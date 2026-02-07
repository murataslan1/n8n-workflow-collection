Audit SharePoint Online external sharing and anonymous links with Microsoft Graph

https://n8nworkflows.xyz/workflows/audit-sharepoint-online-external-sharing-and-anonymous-links-with-microsoft-graph-12495


# Audit SharePoint Online external sharing and anonymous links with Microsoft Graph

## 1. Workflow Overview

**Purpose:** Audit SharePoint Online content for **external sharing** by detecting:
- **Anonymous sharing links** (anyone links)
- **External/guest users** granted access to items

It uses **Microsoft Graph** to enumerate **Sites → Drives (document libraries) → Items (files/folders)**, recursively traverses folder structures, fetches **permissions per item**, and outputs only items that are externally shared.

### 1.1 Configuration & Entry
Defines tenant domains used to decide what counts as “internal” vs “external”, then starts the audit manually.

### 1.2 Site and Drive Discovery (Top-level SharePoint structure)
Fetches all SharePoint sites, filters out Microsoft system “contentstorage” sites, then retrieves drives (libraries) per site.

### 1.3 Recursive Item Traversal (Sub-workflow pattern)
For each drive, invokes the same workflow as a sub-run to traverse root items and all nested folders, returning a full list of items (files and folders).

### 1.4 Permission Collection and Pairing
For each traversed item, retrieves its permissions and pairs permission data with the corresponding item metadata.

### 1.5 Permission Analysis & Filtering
A Code node inspects permission entries to flag:
- `link.scope === "anonymous"`
- Guest/external principals identified via `#ext#` / `urn:spo:guest` or by email domain not in the internal tenant domain list  
Outputs only matched items with compact, audit-friendly fields.

---

## 2. Block-by-Block Analysis

### Block A — Entry + Tenant Domain Configuration
**Overview:** Starts execution and sets the internal tenant domains used to classify external users.  
**Nodes involved:** `When clicking ‘Execute workflow’`, `Set Variables`

#### Node: When clicking ‘Execute workflow’
- **Type / role:** Manual Trigger (entry point)
- **Configuration:** No parameters; runs when user clicks *Execute workflow*.
- **Outputs to:** `Set Variables`
- **Failure/edge cases:** None (manual start).

#### Node: Set Variables
- **Type / role:** Set node; defines runtime constants.
- **Configuration choices:**
  - Creates `tenantDomains` (Array) with example values:  
    `["yourDomain1.onmicrosoft.com", "yourDomain1.com"]`
- **Key variables:** `tenantDomains` read later by `Filter Items based on permissions` via:
  - `$('Set Variables').first().json.tenantDomains`
- **Outputs to:** `Sharepoint - Get Sites`
- **Edge cases / failures:**
  - If domains are wrong/empty, external detection via email domain may be ineffective (the code treats empty domains as “domains disabled” for email checks).

---

### Block B — Sites → Drives Discovery
**Overview:** Enumerates all SharePoint sites, removes system “contentstorage” sites, and retrieves document libraries (drives) for each site.  
**Nodes involved:** `Sharepoint - Get Sites`, `Split Out - Sites`, `Filter sites`, `SharePoint - Get Drives`, `Split Out - Drives`

#### Node: Sharepoint - Get Sites
- **Type / role:** HTTP Request; calls Microsoft Graph Sites search.
- **Configuration choices:**
  - **URL:** `https://graph.microsoft.com/v1.0/sites?search=*`
  - **Auth:** OAuth2 via “genericCredentialType” → `oAuth2Api` credential `Microsoft Graph (n8n)`
- **Outputs to:** `Split Out - Sites`
- **Edge cases / failures:**
  - OAuth token errors / missing scopes.
  - Graph pagination not handled here (Graph may return `@odata.nextLink` for many sites). This workflow only processes the first page unless n8n HTTP node pagination is configured (it is not here).

#### Node: Split Out - Sites
- **Type / role:** Split Out; converts `value[]` into individual items.
- **Configuration:** `fieldToSplitOut = value`
- **Outputs to:** `Filter sites`
- **Edge cases:** If Graph response lacks `value`, node outputs nothing.

#### Node: Filter sites
- **Type / role:** Filter; excludes unwanted sites.
- **Condition:** `$json.webUrl` **does not contain** `contentstorage`
- **Outputs to:** `SharePoint - Get Drives`
- **Edge cases:**
  - If `webUrl` missing, the filter may behave unexpectedly depending on strict validation (here it’s strict).

#### Node: SharePoint - Get Drives
- **Type / role:** HTTP Request; lists drives per site.
- **URL expression:**
  - `https://graph.microsoft.com/v1.0/sites/{{ $json.id }}/drives?$select=id,name,webUrl`
- **Auth:** Same Microsoft Graph OAuth2 credential.
- **Outputs to:** `Split Out - Drives`
- **Edge cases / failures:**
  - Permissions: Graph Application permission `Sites.Read.All` required (per sticky note).
  - Pagination for drives not handled (rare but possible).

#### Node: Split Out - Drives
- **Type / role:** Split Out; emits one item per drive.
- **Configuration:** `fieldToSplitOut = value`
- **Outputs to:** `Call 'Audit SharePoint for externally shared Items and anonymous permissions'`
- **Edge cases:** Missing `value` results in no downstream execution.

---

### Block C — Drive Processing via Self-Invocation (Orchestration)
**Overview:** For each drive, runs the workflow as a sub-execution that performs item traversal and permission checks.  
**Nodes involved:** `Call 'Audit SharePoint for externally shared Items and anonymous permissions'`

#### Node: Call 'Audit SharePoint for externally shared Items and anonymous permissions'
- **Type / role:** Execute Workflow; **calls this same workflow** (`workflowId = ZcY7FluJUhdfeQAH`) in **mode: each**.
- **Inputs passed:**
  - `driveId = {{ $json.id }}` (from drive item)
  - `folderId` is defined in schema but not set at this top-level call.
- **Outputs to (within current run):**
  - `SharePoint - Get Item Permissions`
  - `Rename Output for Item`
- **Important behavior note (design implication):**
  - This workflow mixes **orchestrator logic** (site/drive listing) with **subworkflow logic** (item listing/recursion via `ExecuteWorkflowTrigger`).
  - This structure works when the sub-run path is entered (via `ExecuteWorkflowTrigger`), but it can be confusing to maintain and can create recursive execution patterns.
- **Edge cases / failures:**
  - If the workflow is inactive or execution permissions disallow calling itself, this fails.
  - Risk of excessive executions for large tenants (one sub-execution per drive, plus recursion per folder).

---

### Block D — Subworkflow Entry & Item Enumeration (Root vs Folder)
**Overview:** Acts as the entry point for sub-executions and decides whether to list root items of a drive or children of a given folder.  
**Nodes involved:** `Subworkflow - Get Items`, `If Input is a Folder`, `SharePoint - Get Items`, `SharePoint - Get Child Items`, `Split Out - Items`

#### Node: Subworkflow - Get Items
- **Type / role:** Execute Workflow Trigger; receives inputs when invoked as a sub-workflow.
- **Inputs accepted:** `driveId`, `folderId`
- **Outputs to:** `If Input is a Folder`
- **Edge cases:**
  - If called without `driveId`, downstream Graph requests will fail.

#### Node: If Input is a Folder
- **Type / role:** IF; chooses root listing vs folder children listing.
- **Condition:** `{{$json.folderId}}` **is not empty**
  - **True path:** `SharePoint - Get Child Items`
  - **False path:** `SharePoint - Get Items`
- **Edge cases:**
  - If `folderId` provided but invalid, child listing call returns 404.

#### Node: SharePoint - Get Items
- **Type / role:** HTTP Request; lists root items of drive.
- **URL:**  
  `https://graph.microsoft.com/v1.0/drives/{{ $json.driveId }}/root/children?$select=id,name,webUrl,folder,file,parentReference,lastModifiedDateTime`
- **Outputs to:** `Split Out - Items`
- **Edge cases / failures:**
  - Pagination not handled for large libraries.
  - Drive ID must be valid and accessible.

#### Node: SharePoint - Get Child Items
- **Type / role:** HTTP Request; lists children of a folder.
- **URL expression uses trigger context:**
  - `drives/{{ $('Subworkflow - Get Items').item.json.driveId }}/items/{{ $('Subworkflow - Get Items').item.json.folderId }}/children?...`
- **Outputs to:** `Split Out - Items`
- **Edge cases / failures:**
  - Folder might be deleted/moved during traversal.
  - Using `$('Subworkflow - Get Items').item...` ties correctness to that node’s item context; if item linking breaks, expressions may fail.

#### Node: Split Out - Items
- **Type / role:** Split Out; emits one item per file/folder returned.
- **Configuration:** `fieldToSplitOut = value`
- **Outputs to:** `If Item is not a folder`

---

### Block E — Recursion + Keep All Items (files and folders)
**Overview:** For each item, decides whether it’s a folder; folders are recursively explored via another workflow call, while all items (including folders) are merged into a single list for permission checking.  
**Nodes involved:** `If Item is not a folder`, `Recursive call Get Items`, `Keept Items and Folders`, `Return All Data`

#### Node: If Item is not a folder
- **Type / role:** IF; identifies folders by checking presence of `folder`.
- **Condition:** `$json.folder` **does not exist**  
  (So: **True** means “not a folder”; **False** means “is a folder”.)
- **Outputs:**
  - **True (not a folder):** to `Keept Items and Folders` input 0
  - **False (folder):** to `Recursive call Get Items` and also to `Keept Items and Folders` input 1
- **Edge cases:**
  - Items with unusual schema may not include `folder`/`file` objects (treated as not folder by this condition logic).

#### Node: Recursive call Get Items
- **Type / role:** Execute Workflow; calls external workflow `S&S — Get Items` (`workflowId = 4sofE1bF0zs6pvOm`).
- **Inputs passed:**
  - `driveId = {{ $('Subworkflow - Get Items').item.json.driveId }}`
  - `folderId = {{ $json.id }}` (current folder item id)
- **Outputs to:** `Keept Items and Folders` input 2
- **Sub-workflow reference:**
  - **Not included in provided JSON**. The current workflow assumes a second workflow exists that returns traversed items for a given folder.
  - Despite its name, the logic overlaps with the current workflow’s own “Get Items” block; this is a maintenance risk.
- **Edge cases / failures:**
  - Missing workflow ID / inactive workflow / permission to execute.
  - Deep folder structures can cause many executions and timeouts.

#### Node: Keept Items and Folders
- **Type / role:** Merge; collects:
  1) files, 2) folders, 3) recursively returned items
- **Configuration:** `numberInputs = 3`
- **Outputs to:** `Return All Data`
- **Edge cases:**
  - Merge behavior depends on arrival timing; in complex recursion, ensure all branches complete.
  - If recursion returns no data, input 2 may be empty.

#### Node: Return All Data
- **Type / role:** Set; passes through all fields.
- **Configuration:** `includeOtherFields = true`
- **Role in overall design:**
  - This is effectively the “subworkflow result” containing items to audit.
- **Edge cases:** None.

---

### Block F — Permission Retrieval + Pairing
**Overview:** Retrieves permissions for each item and pairs them with item metadata into a single object per item.  
**Nodes involved:** `SharePoint - Get Item Permissions`, `Rename Output for Permissions`, `Rename Output for Item`, `Merge`

#### Node: SharePoint - Get Item Permissions
- **Type / role:** HTTP Request; gets permissions for an item.
- **URL expression:**
  - `https://graph.microsoft.com/v1.0/drives/{{ $('Split Out - Drives').item.json.id }}/items/{{ $json.id }}/permissions`
- **Key dependency:** Relies on `$('Split Out - Drives').item.json.id` being in scope (drive context).
- **Outputs to:** `Rename Output for Permissions`
- **Edge cases / failures:**
  - If drive context is not available (because execution path differs), expression can fail.
  - Some items may not return permissions as expected; Graph may omit details depending on permission type.
  - Throttling (429) likely on large tenants.

#### Node: Rename Output for Permissions
- **Type / role:** Set; nests permission response under `permissions`.
- **Configuration:** sets:
  - `permissions = {{$json}}` (entire current JSON)
- **Outputs to:** `Merge` input 0

#### Node: Rename Output for Item
- **Type / role:** Set; nests item metadata under `item`.
- **Configuration:** sets:
  - `item = {{$json}}`
- **Outputs to:** `Merge` input 1

#### Node: Merge
- **Type / role:** Merge; combines item + permissions objects.
- **Configuration:** `mode = combine`, `combineBy = combineByPosition`
- **Inputs:**  
  - Input 0: `permissions` objects  
  - Input 1: `item` objects
- **Outputs to:** `Filter Items based on permissions`
- **Edge cases:**
  - **Ordering must match**: combine-by-position assumes the nth permissions response corresponds to the nth item. If one branch drops/duplicates items, pairing breaks.

---

### Block G — Analyze Permissions & Output Only Externally Shared Items
**Overview:** Scans `permissions.value` for anonymous links and external principals; outputs a compact audit record per matching item.  
**Nodes involved:** `Filter Items based on permissions`

#### Node: Filter Items based on permissions
- **Type / role:** Code node; filters + transforms data.
- **Key configuration choices:**
  - Reads tenant domains: `const TENANT_DOMAINS = $('Set Variables').first().json.tenantDomains`
  - External detection:
    - loginName contains `#ext#` or `urn:spo:guest`
    - OR email domain not in `tenantDomains`
  - Anonymous link detection:
    - `p.link.scope === "anonymous"`
  - Drops items with neither anonymous links nor external principals.
- **Input shape expected:**
  - `json.item` → item metadata (id, name, webUrl, parentReference, folder/file flags)
  - `json.permissions.value` → array of permissions
- **Output shape (per matched item):**
  - Identity: `name`, `type`, `webUrl`, `lastModifiedDateTime`
  - Trace IDs: `itemId`, `driveId`, `siteId`, `parentId`, `libraryName`
  - Flags: `externalSharing.hasAnonymousLink`, `externalSharing.hasExternalPrincipal`
  - Details: `anonymousLinks[]`, `externalPrincipals[]` plus counts
- **Edge cases / failures:**
  - If `Set Variables` didn’t run in the same execution context, the node may fail (cannot read tenantDomains).
  - Graph permission objects vary; some external principals may be represented differently (e.g., group grants, sharing links without identities).
  - If `permissions.value` is missing/non-array, code treats it as empty.

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| When clicking ‘Execute workflow’ | manualTrigger | Manual entry point | — | Set Variables |  |
| Set Variables | set | Define internal tenant domains | When clicking ‘Execute workflow’ | Sharepoint - Get Sites | ## How data is filtered  What `Filter Items based on permissions` does for each input item: * Reads your **internal tenant domains** from the “Set Variables” node * Scans the item’s `permissions.value` and flags: * **Anonymous sharing links** (`link.scope === "anonymous"`) * **External/guest users** granted access, detected either by: * SharePoint guest login markers like `#ext#` or `urn:spo:guest`, or * An email domain **not** in your tenant domains list. * **Drops** any item that has **neither** an anonymous link **nor** an external principal. * For items that match, outputs a compact record with **item metadata** and **sharing flags and detailed lists** of the anonymous links and external users found. |
| Sharepoint - Get Sites | httpRequest | List all SharePoint sites | Set Variables | Split Out - Sites | ## Get top level Sharepoint structure  Gets sites and drives as top level entry points for the traversal of their contents; Also filters out contentstorage sites as they are system area created by microsoft apps |
| Split Out - Sites | splitOut | Emit one item per site | Sharepoint - Get Sites | Filter sites | ## Get top level Sharepoint structure  Gets sites and drives as top level entry points for the traversal of their contents; Also filters out contentstorage sites as they are system area created by microsoft apps |
| Filter sites | filter | Exclude contentstorage sites | Split Out - Sites | SharePoint - Get Drives | ## Get top level Sharepoint structure  Gets sites and drives as top level entry points for the traversal of their contents; Also filters out contentstorage sites as they are system area created by microsoft apps |
| SharePoint - Get Drives | httpRequest | List drives (libraries) per site | Filter sites | Split Out - Drives | ## Get top level Sharepoint structure  Gets sites and drives as top level entry points for the traversal of their contents; Also filters out contentstorage sites as they are system area created by microsoft apps |
| Split Out - Drives | splitOut | Emit one item per drive | SharePoint - Get Drives | Call 'Audit SharePoint for externally shared Items and anonymous permissions' | ## Recursively traverse through items  For each drive start recursive process at root level |
| Call 'Audit SharePoint for externally shared Items and anonymous permissions' | executeWorkflow | Self-invocation per drive to start traversal | Split Out - Drives | SharePoint - Get Item Permissions; Rename Output for Item | ## Recursively traverse through items  For each drive start recursive process at root level |
| Subworkflow - Get Items | executeWorkflowTrigger | Subworkflow entry receiving driveId/folderId | — (invoked) | If Input is a Folder | ## Get Items  Differentiates whether to get items of root level drives or to get child items for folders |
| If Input is a Folder | if | Decide root items vs folder children | Subworkflow - Get Items | SharePoint - Get Child Items; SharePoint - Get Items | ## Get Items  Differentiates whether to get items of root level drives or to get child items for folders |
| SharePoint - Get Items | httpRequest | List root drive items | If Input is a Folder (false) | Split Out - Items | ## Get Items  Differentiates whether to get items of root level drives or to get child items for folders |
| SharePoint - Get Child Items | httpRequest | List folder children | If Input is a Folder (true) | Split Out - Items | ## Get Items  Differentiates whether to get items of root level drives or to get child items for folders |
| Split Out - Items | splitOut | Emit one item per file/folder | SharePoint - Get Items / SharePoint - Get Child Items | If Item is not a folder |  |
| If Item is not a folder | if | Branch: file vs folder; trigger recursion | Split Out - Items | Keept Items and Folders; Recursive call Get Items | ## If Item is a folder, go into folder |
| Recursive call Get Items | executeWorkflow | Recurse into folder via separate workflow | If Item is not a folder (folder branch) | Keept Items and Folders | ## If Item is a folder, go into folder |
| Keept Items and Folders | merge | Keep files + folders + recursive results | If Item is not a folder; Recursive call Get Items | Return All Data | ## Merge Output  Keep all traversed items: folders and files as each can have its own permissions |
| Return All Data | set | Pass-through result of traversal | Keept Items and Folders | (used downstream by caller) |  |
| SharePoint - Get Item Permissions | httpRequest | Fetch permissions per item | Call 'Audit…' (item stream) | Rename Output for Permissions | ## Combine and filter the outputs |
| Rename Output for Permissions | set | Wrap permission response in `permissions` | SharePoint - Get Item Permissions | Merge | ## Combine and filter the outputs |
| Rename Output for Item | set | Wrap item metadata in `item` | Call 'Audit…' (item stream) | Merge | ## Combine and filter the outputs |
| Merge | merge | Pair item + permissions by position | Rename Output for Permissions; Rename Output for Item | Filter Items based on permissions | ## Combine and filter the outputs |
| Filter Items based on permissions | code | Detect anonymous links/external principals; filter output | Merge | (final output) | ## How data is filtered  What `Filter Items based on permissions` does for each input item: * Reads your **internal tenant domains** from the “Set Variables” node * Scans the item’s `permissions.value` and flags: * **Anonymous sharing links** (`link.scope === "anonymous"`) * **External/guest users** granted access, detected either by: * SharePoint guest login markers like `#ext#` or `urn:spo:guest`, or * An email domain **not** in your tenant domains list. * **Drops** any item that has **neither** an anonymous link **nor** an external principal. * For items that match, outputs a compact record with **item metadata** and **sharing flags and detailed lists** of the anonymous links and external users found. |
| Sticky Note | stickyNote | Comment | — | — | ## How it works - Fetches all SharePoint sites via Microsoft Graph - Retrieves document libraries for each site - Recursively traverses folder and file structures - Fetches permissions for every item - Analyzes permissions for anonymous links or external users - Outputs only externally shared items  ## Setup Requirements 1. **Microsoft Entra ID app registration** - Grant **Microsoft Graph – Application permissions** - `Sites.Read.All` - Add the credential to all HTTP request nodes  2. **Configure tenant domains** - Add your tenant domains in the `Set Variables` node - These domains are used to identify internal and flag external users |
| Sticky Note6 | stickyNote | Comment | — | — | ### Notes - Requires EntraID Application - Use Client Credentials when adding the OAuth2 credentials in n8n - Use a schedule trigger to automatically run this - Refactor the subworkflow in its own workflow for better execution tracking - Need help? ✉️ **office@sus-tech.at** |
| Sticky Note1 | stickyNote | Comment | — | — | ## Recursively traverse through items For each drive start recursive process at root level |
| Sticky Note2 | stickyNote | Comment | — | — | ## If Item is a folder, go into folder |
| Sticky Note3 | stickyNote | Comment | — | — | ## Merge Output Keep all traversed items: folders and files as each can have its own permissions |
| Sticky Note4 | stickyNote | Comment | — | — | ## Get top level Sharepoint structure Gets sites and drives as top level entry points for the traversal of their contents; Also filters out contentstorage sites as they are system area created by microsoft apps |
| Sticky Note5 | stickyNote | Comment | — | — | ## Combine and filter the outputs |
| Sticky Note7 | stickyNote | Comment | — | — | ## How data is filtered What `Filter Items based on permissions` does for each input item: * Reads your **internal tenant domains** from the “Set Variables” node * Scans the item’s `permissions.value` and flags: * **Anonymous sharing links** (`link.scope === "anonymous"`) * **External/guest users** granted access, detected either by: * SharePoint guest login markers like `#ext#` or `urn:spo:guest`, or * An email domain **not** in your tenant domains list. * **Drops** any item that has **neither** an anonymous link **nor** an external principal. * For items that match, outputs a compact record with **item metadata** and **sharing flags and detailed lists** of the anonymous links and external users found. |
| Sticky Note8 | stickyNote | Comment | — | — | ## Get Items Differentiates whether to get items of root level drives or to get child items for folders |

---

## 4. Reproducing the Workflow from Scratch

1) **Create OAuth2 credential for Microsoft Graph (Client Credentials)**
   - In Microsoft Entra ID: register an app.
   - Add **Application** permission: `Sites.Read.All`
   - Grant admin consent.
   - In n8n: create **OAuth2 API** credential for Graph using client credentials:
     - Token URL: `https://login.microsoftonline.com/<tenant-id>/oauth2/v2.0/token`
     - Scope: `https://graph.microsoft.com/.default`
     - Audience/Resource: Graph (depending on n8n credential UI)

2) **Create node: Manual Trigger**
   - Name: `When clicking ‘Execute workflow’`

3) **Create node: Set**
   - Name: `Set Variables`
   - Add field:
     - `tenantDomains` (Type: Array) = your internal domains, e.g. `["contoso.com","contoso.onmicrosoft.com"]`
   - Connect: Manual Trigger → Set Variables

4) **Create node: HTTP Request**
   - Name: `Sharepoint - Get Sites`
   - Method: GET
   - URL: `https://graph.microsoft.com/v1.0/sites?search=*`
   - Authentication: OAuth2 (your Graph credential)
   - Connect: Set Variables → Sharepoint - Get Sites

5) **Create node: Split Out**
   - Name: `Split Out - Sites`
   - Field to split out: `value`
   - Connect: Sharepoint - Get Sites → Split Out - Sites

6) **Create node: Filter**
   - Name: `Filter sites`
   - Condition: `{{$json.webUrl}}` **does not contain** `contentstorage`
   - Connect: Split Out - Sites → Filter sites

7) **Create node: HTTP Request**
   - Name: `SharePoint - Get Drives`
   - Method: GET
   - URL (expression):  
     `https://graph.microsoft.com/v1.0/sites/{{ $json.id }}/drives?$select=id,name,webUrl`
   - Auth: same Graph OAuth2 credential
   - Connect: Filter sites → SharePoint - Get Drives

8) **Create node: Split Out**
   - Name: `Split Out - Drives`
   - Field to split out: `value`
   - Connect: SharePoint - Get Drives → Split Out - Drives

9) **Create node: Execute Workflow**
   - Name: `Call 'Audit SharePoint for externally shared Items and anonymous permissions'`
   - Workflow: select **this same workflow**
   - Mode: `Each item`
   - Input mapping:
     - `driveId = {{$json.id}}`
     - Define `folderId` in schema (optional) but leave unset here
   - Connect: Split Out - Drives → Call ‘Audit…’

10) **Create node: Execute Workflow Trigger** (subworkflow entry)
   - Name: `Subworkflow - Get Items`
   - Define inputs: `driveId`, `folderId`
   - (This node is used when the workflow is invoked via Execute Workflow.)

11) **Create node: IF**
   - Name: `If Input is a Folder`
   - Condition: `{{$json.folderId}}` **is not empty**
   - True → folder children; False → drive root

12) **Create node: HTTP Request** (root items)
   - Name: `SharePoint - Get Items`
   - URL (expression):  
     `https://graph.microsoft.com/v1.0/drives/{{ $json.driveId }}/root/children?$select=id,name,webUrl,folder,file,parentReference,lastModifiedDateTime`
   - Auth: Graph OAuth2
   - Connect: IF (false) → SharePoint - Get Items

13) **Create node: HTTP Request** (child items)
   - Name: `SharePoint - Get Child Items`
   - URL (expression):  
     `https://graph.microsoft.com/v1.0/drives/{{ $('Subworkflow - Get Items').item.json.driveId }}/items/{{ $('Subworkflow - Get Items').item.json.folderId }}/children?$select=id,name,webUrl,folder,file,parentReference,lastModifiedDateTime`
   - Auth: Graph OAuth2
   - Connect: IF (true) → SharePoint - Get Child Items

14) **Create node: Split Out**
   - Name: `Split Out - Items`
   - Field: `value`
   - Connect: SharePoint - Get Items → Split Out - Items
   - Connect: SharePoint - Get Child Items → Split Out - Items

15) **Create node: IF**
   - Name: `If Item is not a folder`
   - Condition: `{{$json.folder}}` **does not exist**
   - True (file) → merge
   - False (folder) → recursion + merge

16) **Create node: Execute Workflow** (recursion)
   - Name: `Recursive call Get Items`
   - Workflow: `S&S — Get Items` (must exist separately)
   - Inputs:
     - `driveId = {{ $('Subworkflow - Get Items').item.json.driveId }}`
     - `folderId = {{ $json.id }}`
   - Connect: IF (folder branch) → Recursive call Get Items

17) **Create node: Merge**
   - Name: `Keept Items and Folders`
   - Number of inputs: `3`
   - Connect:
     - IF (file branch) → Merge input 0
     - IF (folder branch) → Merge input 1
     - Recursive call Get Items → Merge input 2

18) **Create node: Set**
   - Name: `Return All Data`
   - Include Other Fields: enabled
   - Connect: Keept Items and Folders → Return All Data

19) **Create node: HTTP Request** (permissions)
   - Name: `SharePoint - Get Item Permissions`
   - URL (expression):  
     `https://graph.microsoft.com/v1.0/drives/{{ $('Split Out - Drives').item.json.id }}/items/{{ $json.id }}/permissions`
   - Auth: Graph OAuth2
   - Connect: Call ‘Audit…’ → SharePoint - Get Item Permissions  
   - Also connect: Call ‘Audit…’ → `Rename Output for Item` (next step)

20) **Create node: Set**
   - Name: `Rename Output for Permissions`
   - Add field:
     - `permissions` (Object) = `{{$json}}`
   - Connect: SharePoint - Get Item Permissions → Rename Output for Permissions

21) **Create node: Set**
   - Name: `Rename Output for Item`
   - Add field:
     - `item` (Object) = `{{$json}}`
   - Connect: Call ‘Audit…’ → Rename Output for Item

22) **Create node: Merge**
   - Name: `Merge`
   - Mode: `Combine`
   - Combine by: `Position`
   - Connect:
     - Rename Output for Permissions → Merge (input 0)
     - Rename Output for Item → Merge (input 1)

23) **Create node: Code**
   - Name: `Filter Items based on permissions`
   - Paste the provided JS logic (anonymous + external detection).
   - Connect: Merge → Filter Items based on permissions

24) **(Optional) Add Schedule Trigger**
   - As suggested by sticky note, replace manual trigger or add schedule for periodic audits.

**Required external dependency:** workflow `S&S — Get Items` (`workflowId = 4sofE1bF0zs6pvOm`) must exist and accept `driveId` and `folderId`, returning traversed items. If you don’t have it, you must implement it (or refactor recursion to call the same workflow consistently).

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| Fetches all SharePoint sites, retrieves drives, recursively traverses items, fetches permissions, detects anonymous links/external users, outputs only externally shared items. | Sticky note “How it works” |
| Requires Microsoft Entra ID app registration with Graph **Application** permission `Sites.Read.All`; add credential to all HTTP Request nodes. | Setup requirement |
| Configure internal tenant domains in `Set Variables` to classify external users. | Setup requirement |
| Requires EntraID Application; use **Client Credentials** for OAuth2 in n8n; consider schedule trigger; refactor subworkflow into its own workflow for execution tracking; contact: **office@sus-tech.at** | Sticky note “Notes” |