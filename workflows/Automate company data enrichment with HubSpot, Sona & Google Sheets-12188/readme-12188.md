Automate company data enrichment with HubSpot, Sona & Google Sheets

https://n8nworkflows.xyz/workflows/automate-company-data-enrichment-with-hubspot--sona---google-sheets-12188


# Automate company data enrichment with HubSpot, Sona & Google Sheets

## 1. Workflow Overview

**Purpose:**  
This workflow reads a list of company website domains from **Google Sheets**, enriches each company using the **Sona** enrichment API, then creates/updates **HubSpot Company** records with both standard HubSpot fields (name, address, etc.) and a large set of custom “Sona:” properties (tech stack, tags, socials, revenue ranges, etc.).

**Typical use cases:**
- Bulk enrichment of prospect/account lists from a spreadsheet into HubSpot
- Standardizing firmographic + technographic data in HubSpot for segmentation and routing
- Creating a repeatable enrichment pipeline with rate-limiting

### 1.1 Input Reception (Google Sheets)
Reads domains from a column named **`Website Domain`**.

### 1.2 Data Aggregation & Pre-processing
Aggregates all domains into one array, then transforms that array back into individual items for looping.

### 1.3 HubSpot Schema Setup (Custom Properties)
Creates a set of custom HubSpot company properties intended to store Sona enrichment fields.

### 1.4 Per-Company Enrichment & HubSpot Sync (Loop)
For each domain: call Sona → create HubSpot company (standard fields) → format custom properties → PATCH HubSpot company with custom properties → wait 2 seconds → continue batch loop.

---

## 2. Block-by-Block Analysis

### Block 2.1 — Input Reception (Google Sheets)
**Overview:** Pulls all rows from a target Google Sheet tab, expecting a column called `Website Domain`.  
**Nodes involved:** `Start`, `Get Company List from Sheet`

#### Node: Start
- **Type / role:** Manual Trigger (entry point)
- **Configuration:** No parameters; starts the workflow manually in the editor.
- **Connections:**  
  - Output → `Get Company List from Sheet`
- **Failure types / edge cases:** None (only manual start).

#### Node: Get Company List from Sheet
- **Type / role:** Google Sheets node (read operation)
- **Configuration choices (interpreted):**
  - Uses an OAuth2 Google Sheets credential.
  - Targets a specific spreadsheet by **Document ID**.
  - Targets a specific sheet/tab by **sheetName** (internally `gid=0`, shown as “Sheet1”).
  - Operation is implicitly “Read” (node name suggests pulling the list).
- **Inputs:** From `Start`
- **Outputs:** Rows from the sheet as items, each item containing fields/columns (including `Website Domain`).
- **Version requirements:** `googleSheets` node `v4.6`.
- **Edge cases / failures:**
  - OAuth token expired / insufficient Drive/Sheets scopes.
  - Sheet not shared with the OAuth user.
  - Column name mismatch: if `Website Domain` doesn’t exist exactly, later nodes will aggregate an empty field.
  - Empty rows produce empty domains later.

**Sticky note context (applies to this block):**
- “Step 1: Get Company List” — reads domains, aggregates to array, prepares batch processing.

---

### Block 2.2 — Aggregate Domains Into a Single Array
**Overview:** Collects all `Website Domain` values into one aggregated array so it can be handled as a single list.  
**Nodes involved:** `Aggregate`

#### Node: Aggregate
- **Type / role:** Aggregate node (field aggregation)
- **Configuration choices:**
  - Aggregates the field **`Website Domain`** across all incoming items.
  - Produces a single item whose `Website Domain` field becomes an array of values.
- **Inputs:** `Get Company List from Sheet`
- **Outputs:** Single aggregated item → `Create Custom HubSpot Fields`
- **Version requirements:** Aggregate node `v1`.
- **Edge cases / failures:**
  - If the input field is missing or blank, output array may be empty.
  - Mixed data types (numbers, nulls) can later break string operations (like `.toLowerCase()`).

---

### Block 2.3 — HubSpot Schema Setup (Create Custom Properties)
**Overview:** Creates (in bulk) the custom company properties in HubSpot where Sona enrichment fields will be stored.  
**Nodes involved:** `Create Custom HubSpot Fields`

#### Node: Create Custom HubSpot Fields
- **Type / role:** HTTP Request (HubSpot CRM Properties batch create)
- **Configuration choices:**
  - **Method:** POST
  - **Authentication:** HubSpot App Token credential (`hubspotAppToken`)
  - **Body:** JSON payload with `"inputs": [...]` defining many company properties such as:
    - `industry`, `tech`, `tech_categories`, revenue fields, `social_handles`, many social URLs, ads metrics, SEO/SEM metrics, GitHub metrics, `linkedin_id`, etc.
  - **Error handling:** `onError: continueRegularOutput` (workflow continues even if this node errors)
- **Inputs:** `Aggregate`
- **Outputs:** → `Prepare Data for Loop`
- **Critical note on configuration:**
  - The node’s URL is set to `https://api.hubapi.com/YOUR_AWS_SECRET_KEY_HERE` which is **not a valid HubSpot endpoint** as-is. In a working workflow, it should point to HubSpot’s properties batch endpoint (commonly under `/crm/v3/properties/companies/batch/create`).
- **Version requirements:** HTTP Request node `v4.2` using predefined credential type.
- **Edge cases / failures:**
  - **409 conflict** if properties already exist (very likely on reruns).
  - **400 validation** errors if any property definitions are invalid (name collisions, invalid field types, etc.).
  - **401/403** if app token scopes are insufficient (sticky note suggests required scopes).
  - Continuing on error means the workflow may proceed without required fields existing, causing later PATCH updates to fail silently or return errors.

**Sticky note context (applies to this block):**
- “Step 2: Setup HubSpot Fields” — creates custom Sona fields in HubSpot.

---

### Block 2.4 — Prepare Items for Loop Processing
**Overview:** Takes the aggregated domain list, stores it in a `domains` array, then splits it back out into one domain per item for looping.  
**Nodes involved:** `Prepare Data for Loop`, `Split Companies and AI Output into Items`, `Loop Through Companies`

#### Node: Prepare Data for Loop
- **Type / role:** Set node (data shaping)
- **Configuration choices:**
  - Creates a field `domains` as **array**:
    - `domains = $('Aggregate').first().json['Website Domain']`
  - This assumes the Aggregate node output contains `Website Domain` as an array.
- **Inputs:** `Create Custom HubSpot Fields`
- **Outputs:** → `Split Companies and AI Output into Items`
- **Version requirements:** Set node `v3.4`.
- **Edge cases / failures:**
  - If `Aggregate` output doesn’t contain `Website Domain`, `domains` becomes `undefined`, and the Split Out node will fail or produce no items.

#### Node: Split Companies and AI Output into Items
- **Type / role:** Split Out node (explode an array into multiple items)
- **Configuration choices:**
  - `fieldToSplitOut: domains`
  - Produces items like `{ "domains": "<single-domain-value>" }`
- **Inputs:** `Prepare Data for Loop`
- **Outputs:** → `Loop Through Companies`
- **Version requirements:** Split Out `v1`.
- **Edge cases / failures:**
  - Non-array `domains` field causes errors.
  - Null/empty elements become items with empty `domains`.

#### Node: Loop Through Companies
- **Type / role:** Split In Batches (loop controller)
- **Configuration choices:**
  - Uses default options (batch size not explicitly set; n8n default is typically 1 unless configured).
  - Has two outgoing connections:
    - One to `Sona Enrich` (process current batch item)
    - One to `End` (no-op branch often used as the “done” output)
- **Inputs:** `Split Companies and AI Output into Items` and later `Wait 2 seconds` (to continue loop)
- **Outputs:**
  - Main output 0 → `End` (completion branch)
  - Main output 1 → `Sona Enrich` (processing branch)
- **Version requirements:** Split In Batches `v3`.
- **Edge cases / failures:**
  - If batch size > 1 in options, downstream nodes must handle multiple items; here the Sona node has batching configured anyway, but other nodes reference `.first()` which may become incorrect.

**Sticky note context (applies to this block):**
- “Step 3: Prepare for Processing” — converts aggregated domains into individual items and sets up batch loop.

---

### Block 2.5 — Enrich with Sona and Sync into HubSpot (Create + Update)
**Overview:** For each domain, the workflow calls Sona enrichment, creates a HubSpot company with core firmographics, then formats and PATCHes custom Sona properties into the same company record. A short wait helps reduce rate-limit pressure and drives the batch loop forward.  
**Nodes involved:** `Sona Enrich`, `Create HubSpot Company`, `Format Custom Properties`, `Update Company with AI Data`, `Wait 2 seconds`, `End`

#### Node: Sona Enrich
- **Type / role:** HTTP Request (Sona enrichment API call)
- **Configuration choices:**
  - **URL:** `https://api2.sonalabs.com/resource/company/enrich`
  - **Query parameter:** `website = {{ ... }}`  
    Expression:
    ```js
    $json.domains.toLowerCase().endsWith('.com')
      ? $json.domains.toLowerCase()
      : $json.domains.toLowerCase() + '.com'
    ```
    This normalizes input to lowercase and forces a `.com` suffix when missing.
  - **Headers:**
    - `x-api-key` (value not set in JSON; must be provided in node UI/credentials or expression)
    - `Content-Type: application/json`
  - **Timeout:** 50,000 ms
  - **Batching in HTTP node:** enabled with `batchSize: 1`, interval `3000ms`
  - **Error behavior:** `onError: continueRegularOutput` and `neverError: true` (tries not to hard-fail on HTTP errors)
- **Inputs:** `Loop Through Companies`
- **Outputs:** → `Create HubSpot Company`
- **Version requirements:** HTTP Request `v4.2`
- **Edge cases / failures:**
  - `.toLowerCase()` will fail if `domains` is not a string (null/number).
  - Forcing `.com` can corrupt valid non-.com domains (e.g., `.io`, `.co.uk`) and reduce enrichment accuracy.
  - 401 if `x-api-key` is missing/invalid.
  - “Continue” behavior means downstream nodes may see missing/partial `data`.

#### Node: Create HubSpot Company
- **Type / role:** HubSpot node (create company object)
- **Configuration choices:**
  - **Authentication:** App Token
  - **Resource:** `company`
  - **Name:** `{{$json.data.name}}` (from Sona response)
  - **Additional fields mapping (standard-ish company fields):**
    - city, timezone, postalCode, websiteUrl, description, phoneNumber, stateRegion, yearFounded, annualRevenue, countryRegion, streetAddress, twitterHandle, numberOfEmployees
    - `companyDomainName` uses: `{{ $('Loop Through Companies').first().json.domains || none }}`
      - Note: `none` is not quoted; in n8n expressions it should be `'none'` or `null`. As written, this may evaluate incorrectly.
  - Many fields default to `'none'` or `0` if missing.
- **Inputs:** `Sona Enrich`
- **Outputs:** → `Format Custom Properties`
- **Version requirements:** HubSpot node `v2.1`
- **Edge cases / failures:**
  - If Sona returns no `data.name`, HubSpot create may fail (name is usually required).
  - Duplicate domain/company: HubSpot may create duplicates unless deduplication is configured elsewhere (not present).
  - Type mismatches: setting `postalCode` or `phoneNumber` to `0` may be undesirable.
  - The `companyDomainName` expression’s fallback likely needs correction.

#### Node: Format Custom Properties
- **Type / role:** Code node (normalize Sona fields into HubSpot property payload)
- **Configuration choices (interpreted):**
  - Reads: `const data = $('Sona Enrich').item.json.data;`
  - Formats `socialHandles`:
    - If string: attempts `JSON.parse`
    - Converts object to multi-line “Key: Value” string
    - Falls back to raw value if parsing fails
  - Returns an item shaped as:
    ```json
    {
      "properties": {
        "tech": "...",
        "tech_categories": "...",
        ...
        "linkedin_id": "..."
      }
    }
    ```
  - Converts arrays to comma-separated strings for many fields.
- **Inputs:** `Create HubSpot Company`
- **Outputs:** → `Update Company with AI Data`
- **Version requirements:** Code node `v2`
- **Edge cases / failures:**
  - If `$('Sona Enrich').item.json.data` is undefined (Sona error), code throws.
  - Property names must exist in HubSpot; if custom property creation failed, the PATCH may fail.
  - Some values may exceed HubSpot property limits (long text, etc.).

#### Node: Update Company with AI Data
- **Type / role:** HTTP Request (HubSpot PATCH company with custom properties)
- **Configuration choices:**
  - **Method:** PATCH
  - **URL:** `https://api.hubapi.com/crm/v3/objects/companies/{{ $('Create HubSpot Company').first().json.companyId }}`
  - **Body:** `={{ $json }}` (expects `$json` to be the `{ properties: {...} }` object from the Code node)
  - **Headers:** `Content-Type: application/json`
  - **Authentication:** HubSpot App Token credential
- **Inputs:** `Format Custom Properties`
- **Outputs:** → `Wait 2 seconds`
- **Version requirements:** HTTP Request `v4.2`
- **Edge cases / failures:**
  - If `companyId` is missing (create failed), URL becomes invalid → 404 or malformed request.
  - 400 if properties include invalid fields or value types.
  - Rate limiting (429) possible with large lists; wait node helps but may not be sufficient.

#### Node: Wait 2 seconds
- **Type / role:** Wait (rate limiting / pacing + loop continuation)
- **Configuration choices:** Wait for `amount: 2` seconds.
- **Inputs:** `Update Company with AI Data`
- **Outputs:** → `Loop Through Companies` (to fetch/process the next batch)
- **Version requirements:** Wait node `v1.1`
- **Edge cases / failures:**
  - In high-volume runs, fixed delay may be too small/too large; consider dynamic backoff on 429s.

#### Node: End
- **Type / role:** NoOp (end marker)
- **Configuration choices:** No operation; used as a visual/structural end for the “done” output of the batch loop.
- **Inputs:** `Loop Through Companies`
- **Outputs:** None
- **Version requirements:** NoOp `v1`
- **Edge cases:** None.

**Sticky note context (applies to this block):**
- “Step 4: Enrich & Sync to HubSpot” — loop, enrich, create, format, update, combine firmographics + tech.
- Global setup sticky note also applies (credentials + required column).

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Sticky Note | Sticky Note | Documentation (setup requirements) | — | — | # Enrich Companies from Google Sheets to HubSpot with Sona… (includes https://app.sonalabs.com) |
| Sticky Note1 | Sticky Note | Documentation (Step 1) | — | — | ## 📥 Step 1: Get Company List… |
| Sticky Note2 | Sticky Note | Documentation (Step 2) | — | — | ## ⚙️ Step 2: Setup HubSpot Fields… |
| Sticky Note3 | Sticky Note | Documentation (Step 3) | — | — | ## 🔄 Step 3: Prepare for Processing… |
| Sticky Note4 | Sticky Note | Documentation (Step 4) | — | — | ## 🔍 Step 4: Enrich & Sync to HubSpot… |
| Start | Manual Trigger | Manual workflow entrypoint | — | Get Company List from Sheet | ## 📥 Step 1: Get Company List… |
| Get Company List from Sheet | Google Sheets | Read company domains from spreadsheet | Start | Aggregate | ## 📥 Step 1: Get Company List… |
| Aggregate | Aggregate | Aggregate `Website Domain` into array | Get Company List from Sheet | Create Custom HubSpot Fields | ## 📥 Step 1: Get Company List… |
| Create Custom HubSpot Fields | HTTP Request | Create HubSpot custom company properties in bulk | Aggregate | Prepare Data for Loop | ## ⚙️ Step 2: Setup HubSpot Fields… |
| Prepare Data for Loop | Set | Set `domains` array from aggregated domains | Create Custom HubSpot Fields | Split Companies and AI Output into Items | ## 🔄 Step 3: Prepare for Processing… |
| Split Companies and AI Output into Items | Split Out | Split `domains[]` into individual items | Prepare Data for Loop | Loop Through Companies | ## 🔄 Step 3: Prepare for Processing… |
| Loop Through Companies | Split In Batches | Batch/loop controller | Split Companies and AI Output into Items; Wait 2 seconds | End; Sona Enrich | ## 🔍 Step 4: Enrich & Sync to HubSpot… |
| Sona Enrich | HTTP Request | Enrich company data from Sona by website | Loop Through Companies | Create HubSpot Company | ## 🔍 Step 4: Enrich & Sync to HubSpot… |
| Create HubSpot Company | HubSpot | Create company record with standard fields | Sona Enrich | Format Custom Properties | ## 🔍 Step 4: Enrich & Sync to HubSpot… |
| Format Custom Properties | Code | Transform Sona payload into HubSpot custom properties object | Create HubSpot Company | Update Company with AI Data | ## 🔍 Step 4: Enrich & Sync to HubSpot… |
| Update Company with AI Data | HTTP Request | PATCH created company with custom properties | Format Custom Properties | Wait 2 seconds | ## 🔍 Step 4: Enrich & Sync to HubSpot… |
| Wait 2 seconds | Wait | Rate limiting + continue loop | Update Company with AI Data | Loop Through Companies | ## 🔍 Step 4: Enrich & Sync to HubSpot… |
| End | NoOp | Marks loop completion | Loop Through Companies | — | ## 🔍 Step 4: Enrich & Sync to HubSpot… |

---

## 4. Reproducing the Workflow from Scratch

1. **Create a new workflow** in n8n named:  
   `Automate Company Data Enrichment with HubSpot, Sona & Google Sheets`

2. **Add a Manual Trigger** node named `Start`.

3. **Add Google Sheets node** named `Get Company List from Sheet`
   - Credentials: **Google Sheets OAuth2**
   - Select the target Spreadsheet (Document ID)
   - Select the target sheet/tab (e.g., Sheet1)
   - Configure it to **read rows** (default “Get Many/Read” behavior)
   - Ensure your sheet has a column exactly named: **`Website Domain`**
   - Connect: `Start` → `Get Company List from Sheet`

4. **Add an Aggregate node** named `Aggregate`
   - Aggregate field: `Website Domain`
   - Connect: `Get Company List from Sheet` → `Aggregate`

5. **Add an HTTP Request node** named `Create Custom HubSpot Fields`
   - Credentials: **HubSpot App Token**
     - Token must have scopes at least:
       - `crm.schemas.companies.read`
       - `crm.schemas.companies.write`
       - `crm.objects.companies.write`
   - Method: **POST**
   - URL: HubSpot batch create properties endpoint for companies (HubSpot CRM v3 properties)
   - Body: JSON containing `"inputs": [...]` defining all desired properties (industry, tech, social urls, etc.)
   - Set **On Error** to “Continue (regular output)” if you want reruns not to stop on conflicts.
   - Connect: `Aggregate` → `Create Custom HubSpot Fields`

6. **Add a Set node** named `Prepare Data for Loop`
   - Add field:
     - Name: `domains`
     - Type: **Array**
     - Value (expression): `$('Aggregate').first().json['Website Domain']`
   - Connect: `Create Custom HubSpot Fields` → `Prepare Data for Loop`

7. **Add a Split Out node** named `Split Companies and AI Output into Items`
   - Field to split out: `domains`
   - Connect: `Prepare Data for Loop` → `Split Companies and AI Output into Items`

8. **Add a Split In Batches node** named `Loop Through Companies`
   - Set batch size as desired (commonly **1** to simplify `.first()` usage and rate limits)
   - Connect: `Split Companies and AI Output into Items` → `Loop Through Companies`

9. **Add an HTTP Request node** named `Sona Enrich`
   - Method: **GET** (or keep default with query params; the current workflow uses query parameters)
   - URL: `https://api2.sonalabs.com/resource/company/enrich`
   - Query parameter:
     - `website` = expression:
       ```
       {{ $json.domains.toLowerCase().endsWith('.com') ? $json.domains.toLowerCase() : $json.domains.toLowerCase() + '.com' }}
       ```
     - (Consider removing the forced `.com` if you have non-.com domains.)
   - Headers:
     - `x-api-key`: your Sona API key
     - `Content-Type`: `application/json`
   - Timeout: ~50000ms
   - (Optional) enable internal batching: batch size 1, interval 3000ms
   - Set “Never Error” / “Continue on fail” if you want the loop to keep going on failed enrichments.
   - Connect: `Loop Through Companies` (processing output) → `Sona Enrich`

10. **Add a HubSpot node** named `Create HubSpot Company`
   - Resource: **Company**
   - Operation: **Create**
   - Authentication: **App Token**
   - Map:
     - Company name: `{{$json.data.name}}`
     - Additional fields (examples):
       - city: `{{$json.data.city || 'none'}}`
       - website URL: `{{$json.data.website || 'none'}}`
       - employees: `{{$json.data.employees || 0}}`
       - domain: use the current loop item domain (prefer: `{{$('Loop Through Companies').item.json.domains}}`)
   - Connect: `Sona Enrich` → `Create HubSpot Company`

11. **Add a Code node** named `Format Custom Properties`
   - Paste logic to:
     - read `$('Sona Enrich').item.json.data`
     - convert arrays to comma-separated strings
     - format `socialHandles` into readable multiline text
     - output `{ properties: { ... } }` matching the custom property internal names created earlier
   - Connect: `Create HubSpot Company` → `Format Custom Properties`

12. **Add an HTTP Request node** named `Update Company with AI Data`
   - Method: **PATCH**
   - Credentials: **HubSpot App Token**
   - URL (expression):  
     `https://api.hubapi.com/crm/v3/objects/companies/{{ $('Create HubSpot Company').first().json.companyId }}`
   - Body: JSON = `{{$json}}` (should be `{ properties: {...} }`)
   - Header: `Content-Type: application/json`
   - Connect: `Format Custom Properties` → `Update Company with AI Data`

13. **Add a Wait node** named `Wait 2 seconds`
   - Wait time: 2 seconds
   - Connect: `Update Company with AI Data` → `Wait 2 seconds`

14. **Close the loop**
   - Connect: `Wait 2 seconds` → `Loop Through Companies` (to request the next batch)

15. **Add a NoOp node** named `End`
   - Connect: `Loop Through Companies` (the “done/no more items” output) → `End`

16. **Credentials to configure**
   - Google Sheets OAuth2: access to the spreadsheet
   - HubSpot App Token credential: token with required CRM scopes
   - Sona API key: set as `x-api-key` header value in `Sona Enrich`

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| Sign up for Sona (free tier available for testing) | https://app.sonalabs.com |
| Google Sheets requirement: column named `Website Domain` containing domains like `example.com` | Workflow setup note |
| HubSpot requirement: create a Legacy App token and enable scopes `crm.schemas.companies.write`, `crm.objects.companies.write`, `crm.schemas.companies.read` | Workflow setup note |
| Output: HubSpot Company records enriched with firmographic + technographic fields | Workflow setup note |