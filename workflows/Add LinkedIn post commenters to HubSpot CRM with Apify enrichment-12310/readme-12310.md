Add LinkedIn post commenters to HubSpot CRM with Apify enrichment

https://n8nworkflows.xyz/workflows/add-linkedin-post-commenters-to-hubspot-crm-with-apify-enrichment-12310


# Add LinkedIn post commenters to HubSpot CRM with Apify enrichment

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

## 1. Workflow Overview

**Title:** Add LinkedIn post commenters to HubSpot CRM with Apify enrichment

This workflow collects a LinkedIn post URL from a form, retrieves all comments on that post (via a ConnectSafely community node), iterates through each commenter, enriches the commenter profile using an Apify actor, and creates/updates a HubSpot contact **only if an email address is present**.

### 1.1 Trigger & Data Collection (LinkedIn)
- Receives a LinkedIn post URL via an n8n Form.
- Calls ConnectSafely to fetch the post’s comments.
- Splits the resulting comments array into individual items (one item per commenter/comment).

### 1.2 Iteration, Enrichment & CRM Sync
- Batches/loops through the individual comment items.
- Enriches each commenter profile using Apify (LinkedIn URL → enriched dataset record).
- Checks whether the enrichment output contains an email.
- If email exists, creates or updates the contact in HubSpot; otherwise skips.
- Continues looping until all commenters are processed.

---

## 2. Block-by-Block Analysis

### Block 1 — Trigger and Fetch Comments
**Overview:** Captures a LinkedIn Post URL from a form, fetches post comments via ConnectSafely, and normalizes the response into one item per comment to prepare for looping.

**Nodes Involved:**
- Sticky Note (documentation)
- Sticky Note - Trigger Section (documentation)
- Form Trigger - Enter Post URL
- Fetch Post Comments
- Split Comments Array

#### Node: Sticky Note
- **Type / Role:** `n8n-nodes-base.stickyNote` — documentation panel.
- **Configuration choices:** Contains a YouTube link and full workflow explanation, setup steps, customization ideas.
- **Connections:** None (non-executing).
- **Edge cases:** None.

#### Node: Sticky Note - Trigger Section
- **Type / Role:** `n8n-nodes-base.stickyNote` — documentation for block 1.
- **Configuration choices:** Visual label “1. Trigger and Fetch Comments”.
- **Connections:** None.
- **Edge cases:** None.

#### Node: Form Trigger - Enter Post URL
- **Type / Role:** `n8n-nodes-base.formTrigger` — workflow entrypoint; collects user input.
- **Configuration choices (interpreted):**
  - Form title: “LinkedIn Post Engagement Automation”
  - Field: **LinkedIn Post URL** (required)
  - Description text indicates “send personalized connection requests”, but the actual implemented logic is enrichment + HubSpot sync (no connection-request step exists in this JSON).
- **Key variables/expressions:**
  - Output JSON contains a key exactly named: `LinkedIn Post URL`
- **Input / Output connections:**
  - **Output →** Fetch Post Comments
- **Version requirements:** Node typeVersion `2.3` (n8n recent versions).
- **Edge cases / failures:**
  - Invalid or non-public LinkedIn URL may later cause ConnectSafely failure or empty comments.
  - Field label must match downstream expression usage exactly.

#### Node: Fetch Post Comments
- **Type / Role:** `n8n-nodes-connectsafely-ai.connectSafelyLinkedIn` — community node to query LinkedIn data through ConnectSafely.
- **Configuration choices:**
  - Operation: `getPostComments`
  - Post URL set from form input.
- **Key expressions:**
  - `postUrl = {{ $json['LinkedIn Post URL'] }}`
- **Input / Output connections:**
  - **Input ←** Form Trigger - Enter Post URL
  - **Output →** Split Comments Array
- **Version requirements:**
  - This is a **community node**; per sticky note it requires **self-hosted n8n** and installation of the ConnectSafely node package.
- **Edge cases / failures:**
  - Credential/auth failure with ConnectSafely API.
  - LinkedIn rate limits / scraping protections.
  - Post URL not supported, comments disabled, or no comments → `comments` field may be missing/empty (affects Split Out).
  - Response shape changes could break `fieldToSplitOut=comments`.

#### Node: Split Comments Array
- **Type / Role:** `n8n-nodes-base.splitOut` — converts an array field into separate items.
- **Configuration choices:**
  - Field to split: `comments`
- **Input / Output connections:**
  - **Input ←** Fetch Post Comments
  - **Output →** Loop Over Items
- **Version requirements:** typeVersion `1`.
- **Edge cases / failures:**
  - If `comments` is missing, null, or not an array, the node can error or output zero items depending on n8n behavior/version.
  - If comment objects don’t include expected fields (e.g., `profileUrl`), later nodes fail.

---

### Block 2 — Enrich Profiles and Add to CRM
**Overview:** Iterates over commenters, enriches each commenter via Apify, checks for an email, then creates/updates a HubSpot contact using mapped enriched fields.

**Nodes Involved:**
- Sticky Note - Enrich Section (documentation)
- Loop Over Items
- Enrich Profile with Apify
- Check Email Exists
- Create or Update HubSpot Contact
- Continue Loop

#### Node: Sticky Note - Enrich Section
- **Type / Role:** `n8n-nodes-base.stickyNote` — documentation for block 2.
- **Configuration choices:** Visual label “2. Enrich Profiles and Add to CRM”.
- **Connections:** None.
- **Edge cases:** None.

#### Node: Loop Over Items
- **Type / Role:** `n8n-nodes-base.splitInBatches` — batching/loop controller.
- **Configuration choices:**
  - Uses default options (batch size not explicitly set in JSON; default is typically 1 unless configured otherwise in UI/version).
  - Two outputs:
    - Output 0: “No items left”
    - Output 1: “Items” (the current batch)
- **Input / Output connections:**
  - **Input ←** Split Comments Array
  - **Input also ←** Continue Loop (to fetch next batch)
  - **Output (items, index 1) →** Enrich Profile with Apify
  - **Output (done, index 0) →** not connected (workflow ends when finished)
- **Version requirements:** typeVersion `3`.
- **Edge cases / failures:**
  - Batch size too large can trigger API rate limits (ConnectSafely/Apify/HubSpot).
  - If upstream yields zero items, “done” branch triggers immediately (but is not connected; effectively ends).

#### Node: Enrich Profile with Apify
- **Type / Role:** `@apify/n8n-nodes-apify.apify` — runs an Apify actor and returns dataset items.
- **Configuration choices:**
  - Operation: “Run actor and get dataset”
  - Actor: `UMdANQyqx3b2JVuxg` (selected via Apify Console URL)
  - Actor input body contains one field: `linkedin` set to the commenter’s profile URL.
- **Key expressions:**
  - `customBody`:
    - `linkedin: {{ $json.profileUrl }}`
- **Input / Output connections:**
  - **Input ←** Loop Over Items (items output)
  - **Output →** Check Email Exists
- **Version requirements:** typeVersion `1` of the Apify node; requires Apify credentials in n8n.
- **Edge cases / failures:**
  - If the incoming comment item does not contain `profileUrl`, the actor input becomes empty/invalid.
  - Actor run failures (timeout, quota exceeded, invalid actor ID, dataset empty).
  - Returned dataset field naming must match downstream mappings (e.g., `04_Email`), otherwise HubSpot and IF checks fail.

#### Node: Check Email Exists
- **Type / Role:** `n8n-nodes-base.if` — conditional routing.
- **Configuration choices:**
  - Condition: string **exists** check on `{{ $json['04_Email'] }}`
  - Strict validation enabled (per node’s internal options shown).
- **Input / Output connections:**
  - **Input ←** Enrich Profile with Apify
  - **True (index 0) →** Create or Update HubSpot Contact
  - **False (index 1) →** Continue Loop
- **Version requirements:** typeVersion `2.2` (newer IF node condition model).
- **Edge cases / failures:**
  - If Apify output is an array of dataset items but n8n item structure differs than expected, the field may not be at `$json['04_Email']`.
  - Email present but malformed: “exists” passes; HubSpot may reject invalid email formats.

#### Node: Create or Update HubSpot Contact
- **Type / Role:** `n8n-nodes-base.hubspot` — CRM upsert by email.
- **Configuration choices:**
  - Authentication: `appToken` (HubSpot Private App Token)
  - Email: `{{ $json['04_Email'] }}`
  - Additional fields mapped from Apify dataset fields:
    - firstName ← `02_First_name`
    - lastName ← `03_Last_name`
    - jobTitle ← `07_Title`
    - streetAddress ← `13_Current_address`
    - city ← `14_City`
    - country ← `15_Country`
    - companyName ← `16_Company_name`
- **Input / Output connections:**
  - **Input ←** Check Email Exists (true branch)
  - **Output →** Continue Loop
- **Version requirements:** typeVersion `2.1`.
- **Edge cases / failures:**
  - HubSpot auth error (invalid/expired token, missing scopes).
  - HubSpot may require specific property internal names depending on portal configuration; n8n’s HubSpot node typically maps to standard properties, but custom portals may differ.
  - Rate limiting (HubSpot API) if many commenters.
  - Missing optional fields is usually fine, but wrong data types (e.g., country codes vs names) can cause validation issues.

#### Node: Continue Loop
- **Type / Role:** `n8n-nodes-base.noOp` — used as a junction to continue batching.
- **Configuration choices:** No parameters.
- **Input / Output connections:**
  - **Input ←** Create or Update HubSpot Contact
  - **Input ←** Check Email Exists (false branch)
  - **Output →** Loop Over Items (back to request next batch)
- **Version requirements:** typeVersion `1`.
- **Edge cases / failures:**
  - None logically; used to keep the loop wiring clean.

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Sticky Note | n8n-nodes-base.stickyNote | Documentation / overview & setup notes |  |  | @[youtube](hzYsKUDVffo) |
| Form Trigger - Enter Post URL | n8n-nodes-base.formTrigger | Entry point: collect LinkedIn post URL |  | Fetch Post Comments | ## 1. Trigger and Fetch Comments |
| Fetch Post Comments | n8n-nodes-connectsafely-ai.connectSafelyLinkedIn | Retrieve LinkedIn post comments via ConnectSafely | Form Trigger - Enter Post URL | Split Comments Array | ## 1. Trigger and Fetch Comments |
| Split Comments Array | n8n-nodes-base.splitOut | Split `comments` array into individual items | Fetch Post Comments | Loop Over Items | ## 1. Trigger and Fetch Comments |
| Loop Over Items | n8n-nodes-base.splitInBatches | Iterate through commenters in batches | Split Comments Array; Continue Loop | Enrich Profile with Apify (items output) | ## 2. Enrich Profiles and Add to CRM |
| Enrich Profile with Apify | @apify/n8n-nodes-apify.apify | Enrich commenter profile via Apify actor | Loop Over Items | Check Email Exists | ## 2. Enrich Profiles and Add to CRM |
| Check Email Exists | n8n-nodes-base.if | Gate: only proceed if enriched email exists | Enrich Profile with Apify | Create or Update HubSpot Contact (true); Continue Loop (false) | ## 2. Enrich Profiles and Add to CRM |
| Create or Update HubSpot Contact | n8n-nodes-base.hubspot | Upsert HubSpot contact using enriched fields | Check Email Exists | Continue Loop | ## 2. Enrich Profiles and Add to CRM |
| Continue Loop | n8n-nodes-base.noOp | Loop connector back into SplitInBatches | Create or Update HubSpot Contact; Check Email Exists (false) | Loop Over Items | ## 2. Enrich Profiles and Add to CRM |
| Sticky Note - Trigger Section | n8n-nodes-base.stickyNote | Documentation label for trigger/comments block |  |  | ## 1. Trigger and Fetch Comments |
| Sticky Note - Enrich Section | n8n-nodes-base.stickyNote | Documentation label for enrichment/CRM block |  |  | ## 2. Enrich Profiles and Add to CRM |

---

## 4. Reproducing the Workflow from Scratch

1. **Create a new workflow** in n8n and name it:  
   “Add LinkedIn post commenters to HubSpot CRM with Apify enrichment”.

2. **Add node: “Form Trigger”** (`Form Trigger - Enter Post URL`)
   - Set **Form Title**: “LinkedIn Post Engagement Automation”
   - Add a **required** field:
     - Label: `LinkedIn Post URL`
     - Placeholder: `https://www.linkedin.com/posts/your-post-url...`
   - (Optional) Add the provided form description text.
   - This node becomes the **entry point**.

3. **Add node: “ConnectSafely LinkedIn”** (`Fetch Post Comments`)
   - Prerequisite: **install the ConnectSafely community node** (self-hosted n8n).
   - Configure **ConnectSafely API credentials** in n8n.
   - Set **Operation**: “Get Post Comments” (`getPostComments`)
   - Set **Post URL** expression:
     - `{{ $json['LinkedIn Post URL'] }}`
   - Connect: **Form Trigger → Fetch Post Comments**

4. **Add node: “Split Out”** (`Split Comments Array`)
   - Set **Field to split out**: `comments`
   - Connect: **Fetch Post Comments → Split Comments Array**

5. **Add node: “Split In Batches”** (`Loop Over Items`)
   - Keep defaults or set a **Batch Size** appropriate for your rate limits (commonly 1–10).
   - Connect: **Split Comments Array → Loop Over Items**

6. **Add node: “Apify”** (`Enrich Profile with Apify`)
   - Configure **Apify API token** credentials in n8n.
   - Operation: **Run actor and get dataset**
   - Actor: select by URL and use: `https://console.apify.com/actors/UMdANQyqx3b2JVuxg`
   - Actor input (custom body) as an expression:
     - `{ "linkedin": "{{ $json.profileUrl }}" }`
   - Connect: **Loop Over Items (Items output) → Enrich Profile with Apify**

7. **Add node: “IF”** (`Check Email Exists`)
   - Add condition: **String → exists**
   - Left value expression: `{{ $json['04_Email'] }}`
   - Connect: **Enrich Profile with Apify → Check Email Exists**

8. **Add node: “HubSpot”** (`Create or Update HubSpot Contact`)
   - Configure **HubSpot Private App Token** credentials.
   - Action: “Create or Update Contact” (upsert by email)
   - Email field expression: `{{ $json['04_Email'] }}`
   - Map additional fields:
     - First Name: `{{ $json['02_First_name'] }}`
     - Last Name: `{{ $json['03_Last_name'] }}`
     - Job Title: `{{ $json['07_Title'] }}`
     - Street Address: `{{ $json['13_Current_address'] }}`
     - City: `{{ $json['14_City'] }}`
     - Country: `{{ $json['15_Country'] }}`
     - Company Name: `{{ $json['16_Company_name'] }}`
   - Connect: **IF (true) → HubSpot node**

9. **Add node: “No Operation”** (`Continue Loop`)
   - Connect:
     - **HubSpot → Continue Loop**
     - **IF (false) → Continue Loop**

10. **Close the loop**
   - Connect: **Continue Loop → Loop Over Items**
   - Ensure it connects into the **input** of Split In Batches so the next batch is emitted.

11. **(Optional) Add Sticky Notes**
   - Add one overall sticky note including the YouTube link `@[youtube](hzYsKUDVffo)` and the setup/customization text.
   - Add two section sticky notes:
     - “1. Trigger and Fetch Comments”
     - “2. Enrich Profiles and Add to CRM”

12. **Activate workflow**
   - Open the Form Trigger’s public URL (or embedded form) and submit a LinkedIn post URL.
   - Monitor executions for missing `profileUrl` or missing `04_Email` mappings.

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| @[youtube](hzYsKUDVffo) | Video referenced in the workflow sticky note |
| Install the ConnectSafely community node (self-hosted n8n only) | Required to use `n8n-nodes-connectsafely-ai.connectSafelyLinkedIn` |
| Configure ConnectSafely, Apify, and HubSpot credentials before activation | Prevents auth and runtime failures |
| Customization ideas: map more HubSpot fields, add commenter filters, adjust loop batch size | Mentioned in the workflow sticky note text |