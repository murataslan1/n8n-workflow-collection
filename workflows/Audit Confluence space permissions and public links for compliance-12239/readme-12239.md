Audit Confluence space permissions and public links for compliance

https://n8nworkflows.xyz/workflows/audit-confluence-space-permissions-and-public-links-for-compliance-12239


# Audit Confluence space permissions and public links for compliance

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

## 1. Workflow Overview

**Title:** Audit Confluence space permissions and public links for compliance  
**Workflow name (in JSON):** Audit permissions in Confluence to ensure compliance  
**Purpose:** Audits selected Confluence Cloud spaces for potential public exposure by checking:
- **Anonymous access permissions** at the space level
- Whether **public links are enabled** at the space level
- Which **pages have public links** (including active and blocked states for visibility)

**Primary use cases**
- Security/compliance review of Confluence spaces
- Periodic audits for publicly accessible documentation
- Producing structured findings per space (space-level settings + page-level public links)

### 1.1 Input & Configuration
Defines Atlassian tenant base URL and the set of space keys to audit.

### 1.2 Space Discovery (Confluence REST API v2)
Fetches space metadata for the specified space keys, then iterates spaces one-by-one.

### 1.3 Parallel Space Exposure Checks (Atlassian GraphQL)
For each space, runs three GraphQL queries in parallel:
- Anonymous permissions
- Space public link status
- Pages with public links (up to 250)

### 1.4 Consolidation & Reporting
Merges the three query results into one combined item per space and builds a concise compliance output structure.

---

## 2. Block-by-Block Analysis

### Block 1 — Input & Configuration
**Overview:** Sets runtime variables (tenant domain, target space keys). These variables are referenced by later HTTP and GraphQL requests.

**Nodes involved:**
- When clicking ‘Execute workflow’
- Set Variables

#### Node: When clicking ‘Execute workflow’
- **Type / role:** `Manual Trigger` — manual entry point for ad-hoc audits.
- **Configuration choices:** No parameters; execution starts on user click.
- **Connections:**
  - **Output →** Set Variables
- **Edge cases / failures:** None (unless workflow is disabled or user lacks permission to execute).

#### Node: Set Variables
- **Type / role:** `Set` — defines configuration variables used throughout the workflow.
- **Configuration choices (interpreted):**
  - `atlassianDomain`: base URL like `https://yourDomain.atlassian.net`
  - `spaceKeys`: comma-separated keys like `space1, space2`
- **Key expressions / variables used downstream:**
  - `$('Set Variables').first().json.atlassianDomain` (used to build GraphQL endpoint and public URLs)
  - `$json.spaceKeys` (used as query parameter for REST call)
- **Connections:**
  - **Input ←** Manual Trigger
  - **Output →** Confluence - Get Spaces
- **Edge cases / failures:**
  - Wrong domain (missing `https://`, wrong tenant) → 404/ENOTFOUND/TLS errors in later nodes
  - `spaceKeys` formatting issues (spaces, invalid keys) → empty results from REST API
- **Version-specific notes:** Set node v3.4 uses the “assignments” UI model.

---

### Block 2 — Space Discovery (Confluence REST API v2)
**Overview:** Calls Confluence REST API v2 to retrieve spaces matching the configured space keys, then splits the returned `results` list into one item per space.

**Nodes involved:**
- Confluence - Get Spaces
- Split Out Spaces

#### Node: Confluence - Get Spaces
- **Type / role:** `HTTP Request` — queries Confluence REST API v2 for spaces.
- **Configuration choices (interpreted):**
  - **URL:** `{{$json.atlassianDomain}}/wiki/api/v2/spaces`
  - **Query parameters:**
    - `keys = {{$json.spaceKeys}}` (comma-separated)
    - `type = global` (note: stored in JSON as `=global`, but intended value is `global`)
  - **Authentication:** Generic credential type → **HTTP Basic Auth** (Atlassian email + API token).
- **Connections:**
  - **Input ←** Set Variables
  - **Output →** Split Out Spaces
- **Edge cases / failures:**
  - 401/403: invalid token, missing permissions, SSO restrictions
  - 400: invalid query parameter format
  - Pagination: REST v2 spaces endpoint can paginate; this workflow does **not** handle pagination. If keys resolve to many spaces beyond one page, results may be incomplete (often acceptable if `keys` is a bounded list).
- **Version-specific notes:** HTTP Request v4.3.

#### Node: Split Out Spaces
- **Type / role:** `Split Out` — converts an array into multiple items (one per space).
- **Configuration choices:**
  - Splits field `results` from the REST response.
- **Connections:**
  - **Input ←** Confluence - Get Spaces
  - **Output →** (three parallel branches)
    - Confluence - GQL Space Pages with Public Link
    - Confluence - GQL Space Public Links Enabled
    - Confluence - GQL Space Anonymous Access
- **Edge cases / failures:**
  - If `results` is missing or not an array (e.g., API error payload), split fails or produces zero items.
- **Version-specific notes:** Split Out v1.

---

### Block 3 — Parallel Space Exposure Checks (Atlassian GraphQL)
**Overview:** For each space item, runs three GraphQL queries against Atlassian’s GraphQL gateway. Each branch wraps its raw result into a named object to prepare for merging.

**Nodes involved:**
- Confluence - GQL Space Anonymous Access → Set Anonymous Access
- Confluence - GQL Space Public Links Enabled → Set Space Public Links Enabled
- Confluence - GQL Space Pages with Public Link → Set Space Pages with Public Link

#### Node: Confluence - GQL Space Anonymous Access
- **Type / role:** `GraphQL` — retrieves anonymous subject permissions for the space.
- **Configuration choices (interpreted):**
  - **Endpoint:** `{{ $('Set Variables').first().json.atlassianDomain }}/gateway/api/graphql`
  - **Auth:** Basic Auth (same Atlassian credential)
  - **Operation name:** `SpacePermissionsAnonymousQuery`
  - **Variables:** `spaceKey` comes from the current space item: `{{ $json.key }}`
  - **Query behavior:** requests `filteredSubjectsWithPermissions(permissionDisplayType: ANONYMOUS, first: 25, after: "", filterText: "")`
- **Connections:**
  - **Input ←** Split Out Spaces
  - **Output →** Set Anonymous Access
- **Edge cases / failures:**
  - 401/403: GraphQL endpoint permission restrictions
  - Space key mismatch → empty `nodes`
  - Atlassian GraphQL schema changes could break fields (e.g., renamed types)
  - Result size: capped at `first: 25` subjects; if more exist, pagination is not handled (`after` is fixed empty).
- **Version-specific notes:** GraphQL node v1.1.

#### Node: Set Anonymous Access
- **Type / role:** `Set` — wraps GraphQL response into `anonymousAccess`.
- **Configuration choices:**
  - `anonymousAccess = {{$json}}` (entire GraphQL response object)
- **Connections:**
  - **Input ←** Confluence - GQL Space Anonymous Access
  - **Output →** Merge (input index 0)
- **Edge cases / failures:** If GraphQL node returns an error format, you’ll still wrap it; downstream mapping may fail later if expected paths are missing.

#### Node: Confluence - GQL Space Public Links Enabled
- **Type / role:** `GraphQL` — checks whether public links are enabled at the space level and site status.
- **Configuration choices (interpreted):**
  - **Endpoint:** `{{ $('Set Variables').first().json.atlassianDomain }}/gateway/api/graphql`
  - **Operation name:** `usePublicLinkSpaceTogglePublicLinkSpaceQuery`
  - **Variables:** `spaceId` from current space item: `{{ $json.id }}`
  - **Query behavior:** pulls `publicLinkSpace.status`, and `stats.publicLinks.active` plus `publicLinkSiteStatus.status`.
- **Connections:**
  - **Input ←** Split Out Spaces
  - **Output →** Set Space Public Links Enabled
- **Edge cases / failures:**
  - Space ID missing (if REST response shape changes) → GraphQL error
  - Some tenants/features may not expose public link fields → schema/permission errors
- **Version-specific notes:** GraphQL node v1.1.

#### Node: Set Space Public Links Enabled
- **Type / role:** `Set` — wraps GraphQL response into `publicLinksEnabled`.
- **Configuration choices:**
  - `publicLinksEnabled = {{$json}}`
- **Connections:**
  - **Input ←** Confluence - GQL Space Public Links Enabled
  - **Output →** Merge (input index 1)

#### Node: Confluence - GQL Space Pages with Public Link
- **Type / role:** `GraphQL` — lists pages with public links in the space (including blocked states).
- **Configuration choices (interpreted):**
  - **Endpoint:** `{{ $('Set Variables').first().json.atlassianDomain }}/gateway/api/graphql`
  - **Operation name:** `PublicLinkPagesTablePublicLinksByCriteriaQuery`
  - **Variables:**
    - `spaceId = {{ $json.id }}`
    - `first = 250` (fetch limit)
    - `orderBy = TITLE`, `isAscending = true`
    - `status = ["ON","BLOCKED_BY_PRODUCT","BLOCKED_BY_SPACE"]`
    - `after = ""` (no pagination)
  - **Query behavior:** returns `nodes` with link path, status, title, last enabled info.
- **Connections:**
  - **Input ←** Split Out Spaces
  - **Output →** Set Space Pages with Public Link
- **Edge cases / failures:**
  - Pagination not handled: if a space has >250 results, excess pages will be omitted.
  - Some results may have null `lastEnabledByUser` or missing fields; downstream mapping must tolerate nulls.
- **Version-specific notes:** GraphQL node v1.1.

#### Node: Set Space Pages with Public Link
- **Type / role:** `Set` — wraps GraphQL response into `pagesWithPublicLink`.
- **Configuration choices:**
  - `pagesWithPublicLink = {{$json}}`
- **Connections:**
  - **Input ←** Confluence - GQL Space Pages with Public Link
  - **Output →** Merge (input index 2)

---

### Block 4 — Consolidation & Reporting
**Overview:** Combines the three parallel branch outputs into one item per space (by position) and builds a final structured report payload.

**Nodes involved:**
- Merge
- Build Report

#### Node: Merge
- **Type / role:** `Merge` — combines 3 inputs into a single item.
- **Configuration choices (interpreted):**
  - **Mode:** Combine
  - **Combine by:** Position (item 1 from each input merged together)
  - **Number of inputs:** 3
- **Connections:**
  - **Input 0 ←** Set Anonymous Access
  - **Input 1 ←** Set Space Public Links Enabled
  - **Input 2 ←** Set Space Pages with Public Link
  - **Output →** Build Report
- **Edge cases / failures:**
  - **Misalignment risk:** Combine-by-position assumes each branch produces items in the same order and count. If one branch errors, returns fewer items, or is filtered, merged data can mismatch spaces.
  - If any branch returns 0 items for a space, merge output may be missing or shifted.
- **Version-specific notes:** Merge v3.2.

#### Node: Build Report
- **Type / role:** `Set` — transforms merged data into the final compliance report structure.
- **Configuration choices (interpreted fields):**
  - `spaceKey = {{$json.publicLinksEnabled.data.publicLinkSpace.spaceKey}}`
  - `anonymousAccess = {{$json.anonymousAccess.data.spacePermissions.filteredSubjectsWithPermissions.nodes}}`
  - `publicLinksEnabled = {{$json.publicLinksEnabled.data.publicLinkSpace.status}}`
  - `pagesWithPublicLink` mapped to simplified objects:
    - `id`, `title`, `status`
    - `publicUrl = $('Set Variables').first().json.atlassianDomain + p.publicLinkUrlPath`
    - `lastEnabledBy = p.lastEnabledByUser`
- **Connections:**
  - **Input ←** Merge
  - **Output →** (none; this is the workflow result)
- **Edge cases / failures:**
  - If any expected path is missing (GraphQL errors, null `publicLinkSpace`, schema change), expressions can throw “Cannot read properties of undefined”.
  - `publicLinkUrlPath` concatenation assumes path begins with `/`; if not, URL may be malformed.
  - `lastEnabledByUser` may be null; ensure consumers tolerate null.
- **Version-specific notes:** Set node v3.4.

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| When clicking ‘Execute workflow’ | Manual Trigger | Manual entry point | — | Set Variables |  |
| Set Variables | Set | Store domain + target space keys | When clicking ‘Execute workflow’ | Confluence - Get Spaces | ## How it works\nThis workflow audits Confluence spaces for public exposure risks, focusing on anonymous access and public links. A **Set Variables** node defines the Atlassian domain and the list of space keys to evaluate.\n\nUsing the **Confluence API v2**, the workflow retrieves all matching spaces and processes them one by one. For each space, multiple checks run in parallel using GraphQL.\n\nThese queries detect:\n  - **Anonymous access permissions** on spaces\n  - Whether **public links are enabled** at space level\n  - Pages with **active or blocked public links**\n\n\nThe results from all queries are combined into a single, structured output that highlights spaces and pages that may be publicly accessible. This makes it easier to review risks, confirm compliance or share findings with security and documentation owners.\n\n## Setup steps\n1. Open the **Set Variables** node and configure:\n   - `atlassianDomain`: Your Confluence base URL  \n   - `spaceKeys`: Comma-separated list of space keys (for example `ENG,HR`)  \n2. Create an **HTTP Basic Auth** credential in n8n using your Atlassian email address and API token.\n3. Assign this credential to all HTTP and GraphQL nodes in the workflow.\n4. Verify the credential has permission to read spaces, space permissions and GraphQL endpoints.\n5. (Optional) Extend the workflow with email, Slack, or CSV export nodes using the output. |
| Confluence - Get Spaces | HTTP Request | Fetch spaces by keys (REST v2) | Set Variables | Split Out Spaces | ## Confluence API v2 |
| Split Out Spaces | Split Out | Iterate spaces one item at a time | Confluence - Get Spaces | Confluence - GQL Space Pages with Public Link; Confluence - GQL Space Public Links Enabled; Confluence - GQL Space Anonymous Access |  |
| Confluence - GQL Space Anonymous Access | GraphQL | Fetch anonymous permissions for each space | Split Out Spaces | Set Anonymous Access | ## Atlassian GraphQL\nChecks for Anonymous access, public links enabled and pages with public links |
| Set Anonymous Access | Set | Wrap anonymous GraphQL payload | Confluence - GQL Space Anonymous Access | Merge | ## Atlassian GraphQL\nChecks for Anonymous access, public links enabled and pages with public links |
| Confluence - GQL Space Public Links Enabled | GraphQL | Fetch space public link status | Split Out Spaces | Set Space Public Links Enabled | ## Atlassian GraphQL\nChecks for Anonymous access, public links enabled and pages with public links |
| Set Space Public Links Enabled | Set | Wrap space public link payload | Confluence - GQL Space Public Links Enabled | Merge | ## Atlassian GraphQL\nChecks for Anonymous access, public links enabled and pages with public links |
| Confluence - GQL Space Pages with Public Link | GraphQL | List pages with public links (incl. blocked) | Split Out Spaces | Set Space Pages with Public Link | ## Atlassian GraphQL\nChecks for Anonymous access, public links enabled and pages with public links |
| Set Space Pages with Public Link | Set | Wrap pages-with-links payload | Confluence - GQL Space Pages with Public Link | Merge | ## Atlassian GraphQL\nChecks for Anonymous access, public links enabled and pages with public links |
| Merge | Merge | Combine 3 parallel results per space | Set Anonymous Access; Set Space Public Links Enabled; Set Space Pages with Public Link | Build Report |  |
| Build Report | Set | Produce final structured compliance output | Merge | — |  |
| Sticky Note2 | Sticky Note | Documentation references | — | — | ## Confluence API Reference\n* [V2 Get Spaces](https://developer.atlassian.com/cloud/confluence/rest/v2/api-group-space/#api-spaces-get)\n\n## Atlassian GraphQL API Reference\n* [GraphQL API](https://developer.atlassian.com/cloud/confluence/graphql/#overview) |
| Sticky Note | Sticky Note | Block label for GraphQL checks | — | — | ## Atlassian GraphQL\nChecks for Anonymous access, public links enabled and pages with public links |
| Sticky Note6 | Sticky Note | Global notes | — | — | ### Notes\n- Uses **Atlassian GraphQL API**\n- Pages with blocked links are still included for visibility.\n- Current GraphQL page query fetches up to **250 pages per space**.\n- Need help? ✉️ **office@sus-tech.at** |
| Sticky Note1 | Sticky Note | Explanation + setup steps | — | — | (content identical to Set Variables row sticky note) |
| Sticky Note3 | Sticky Note | Block label for REST v2 | — | — | ## Confluence API v2 |

---

## 4. Reproducing the Workflow from Scratch

1. **Create a new workflow** in n8n named: *Audit permissions in Confluence to ensure compliance* (or your preferred name).

2. **Add node: Manual Trigger**
   - Name: `When clicking ‘Execute workflow’`

3. **Add node: Set**
   - Name: `Set Variables`
   - Add fields:
     - `atlassianDomain` (String): `https://yourDomain.atlassian.net`
     - `spaceKeys` (String): `space1, space2` (comma-separated)
   - Connect: **Manual Trigger → Set Variables**

4. **Create credential: HTTP Basic Auth** (Atlassian)
   - In n8n credentials, create **HTTP Basic Auth**
   - Username: Atlassian account email
   - Password: Atlassian API token (Confluence Cloud)
   - Ensure the user/token can read spaces and access GraphQL gateway.

5. **Add node: HTTP Request**
   - Name: `Confluence - Get Spaces`
   - Method: `GET`
   - URL: `{{$json.atlassianDomain}}/wiki/api/v2/spaces`
   - Authentication: **Generic credential type → HTTP Basic Auth** (select the credential from step 4)
   - Query parameters:
     - `keys` = `{{$json.spaceKeys}}`
     - `type` = `global`
   - Connect: **Set Variables → Confluence - Get Spaces**

6. **Add node: Split Out**
   - Name: `Split Out Spaces`
   - Field to split out: `results`
   - Connect: **Confluence - Get Spaces → Split Out Spaces**

7. **Add node: GraphQL** (Anonymous permissions)
   - Name: `Confluence - GQL Space Anonymous Access`
   - Endpoint: `{{ $('Set Variables').first().json.atlassianDomain }}/gateway/api/graphql`
   - Authentication: **Basic Auth** (select the same Atlassian basic auth credential)
   - Operation Name: `SpacePermissionsAnonymousQuery`
   - Query: (paste the workflow’s query for anonymous permissions)
   - Variables: set `spaceKey` to `{{ $json.key }}`
   - Connect: **Split Out Spaces → this GraphQL node**

8. **Add node: Set** (wrap anonymous result)
   - Name: `Set Anonymous Access`
   - Field:
     - `anonymousAccess` (Object) = `{{$json}}`
   - Connect: **Confluence - GQL Space Anonymous Access → Set Anonymous Access**

9. **Add node: GraphQL** (space public link setting)
   - Name: `Confluence - GQL Space Public Links Enabled`
   - Endpoint: `{{ $('Set Variables').first().json.atlassianDomain }}/gateway/api/graphql`
   - Auth: Basic Auth credential
   - Operation Name: `usePublicLinkSpaceTogglePublicLinkSpaceQuery`
   - Variables: `spaceId = {{ $json.id }}`
   - Connect: **Split Out Spaces → this GraphQL node**

10. **Add node: Set** (wrap public link setting)
   - Name: `Set Space Public Links Enabled`
   - Field:
     - `publicLinksEnabled` (Object) = `{{$json}}`
   - Connect: **Confluence - GQL Space Public Links Enabled → Set Space Public Links Enabled**

11. **Add node: GraphQL** (pages with public links)
   - Name: `Confluence - GQL Space Pages with Public Link`
   - Endpoint: `{{ $('Set Variables').first().json.atlassianDomain }}/gateway/api/graphql`
   - Auth: Basic Auth credential
   - Operation Name: `PublicLinkPagesTablePublicLinksByCriteriaQuery`
   - Variables (key ones):
     - `spaceId = {{ $json.id }}`
     - `first = 250`
     - `orderBy = TITLE`
     - `isAscending = true`
     - `status = ["ON","BLOCKED_BY_PRODUCT","BLOCKED_BY_SPACE"]`
     - `after = ""`
     - `title = ""`
   - Connect: **Split Out Spaces → this GraphQL node**

12. **Add node: Set** (wrap pages result)
   - Name: `Set Space Pages with Public Link`
   - Field:
     - `pagesWithPublicLink` (Object) = `{{$json}}`
   - Connect: **Confluence - GQL Space Pages with Public Link → Set Space Pages with Public Link**

13. **Add node: Merge**
   - Name: `Merge`
   - Mode: **Combine**
   - Combine by: **Position**
   - Number of inputs: **3**
   - Connect:
     - **Set Anonymous Access → Merge (Input 1 / index 0)**
     - **Set Space Public Links Enabled → Merge (Input 2 / index 1)**
     - **Set Space Pages with Public Link → Merge (Input 3 / index 2)**

14. **Add node: Set** (final report formatting)
   - Name: `Build Report`
   - Add fields:
     - `spaceKey` (String): `{{$json.publicLinksEnabled.data.publicLinkSpace.spaceKey}}`
     - `anonymousAccess` (Array): `{{$json.anonymousAccess.data.spacePermissions.filteredSubjectsWithPermissions.nodes}}`
     - `publicLinksEnabled` (String): `{{$json.publicLinksEnabled.data.publicLinkSpace.status}}`
     - `pagesWithPublicLink` (Array): map nodes into a simplified structure, including:
       - `publicUrl = $('Set Variables').first().json.atlassianDomain + p.publicLinkUrlPath`
   - Connect: **Merge → Build Report**

15. *(Optional but recommended)* Add error handling:
   - Add “Continue On Fail” on GraphQL nodes or route errors to a separate branch to avoid merge misalignment.
   - Add pagination if you expect >250 public-link pages or >25 anonymous subjects.

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| Confluence REST API v2 – Get Spaces | https://developer.atlassian.com/cloud/confluence/rest/v2/api-group-space/#api-spaces-get |
| Atlassian Confluence GraphQL API overview | https://developer.atlassian.com/cloud/confluence/graphql/#overview |
| Uses Atlassian GraphQL API; blocked links included; page query limited to 250 per space; contact: office@sus-tech.at | Sticky note “Notes” in workflow canvas |