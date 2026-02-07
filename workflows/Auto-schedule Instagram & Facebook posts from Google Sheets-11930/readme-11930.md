Auto-schedule Instagram & Facebook posts from Google Sheets

https://n8nworkflows.xyz/workflows/auto-schedule-instagram---facebook-posts-from-google-sheets-11930


# Auto-schedule Instagram & Facebook posts from Google Sheets

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

## 1. Workflow Overview

**Title:** Auto-schedule Instagram & Facebook posts from Google Sheets

**Purpose:**  
Automatically publishes social posts (caption + optional image) to **Instagram**, **Facebook**, or **both**, based on rows in a Google Sheet. The workflow runs every 15 minutes, selects rows marked **Pending**, checks if they are due based on **ScheduledDateTime**, publishes to the selected platform(s), then writes back **Success/Failed**, timestamp, and any error message into the same row.

**Target use cases:**
- Simple social media scheduling driven by a spreadsheet (content calendar).
- Lightweight publishing automation for small teams without a dedicated scheduling platform.

### Logical blocks
1.1 **Trigger & Configuration**  
1.2 **Data Retrieval & Due Filtering**  
1.3 **Image Handling & Platform Routing**  
1.4 **Publishing to Instagram/Facebook**  
1.5 **Result Normalization & Sheet Status Update**

---

## 2. Block-by-Block Analysis

### 2.1 Trigger & Configuration

**Overview:**  
Starts the workflow on a fixed schedule and loads required IDs/tokens from a single configuration node so downstream nodes can reference them consistently.

**Nodes involved:**
- Schedule Every 15 Minutes
- Workflow Configuration

#### Node: Schedule Every 15 Minutes
- **Type / role:** `Schedule Trigger` — entry point; runs periodically.
- **Configuration (interpreted):** Runs every **15 minutes**.
- **Inputs/Outputs:**  
  - Input: none (trigger)  
  - Output → **Workflow Configuration**
- **Version notes:** typeVersion `1.3`
- **Edge cases / failures:**  
  - If workflow execution time exceeds interval and concurrency is limited, executions can queue/overlap depending on n8n settings.

#### Node: Workflow Configuration
- **Type / role:** `Set` — centralizes runtime configuration and placeholders.
- **Configuration (interpreted):**
  - Sets:
    - `spreadsheetId` (Google Sheets document ID)
    - `sheetName`
    - `instagramAccessToken` (Graph API token)
    - `instagramAccountId` (Instagram Business Account ID)
    - `facebookPageId` (Facebook Page ID)
  - **Include other fields:** enabled (passes through incoming fields if any).
- **Key expressions/variables:** Downstream nodes reference values using:
  - `{{ $('Workflow Configuration').first().json.sheetName }}`
  - `{{ $('Workflow Configuration').first().json.spreadsheetId }}`
  - etc.
- **Inputs/Outputs:**  
  - Input ← Schedule trigger  
  - Output → **Read Pending Posts from Sheet**
- **Version notes:** typeVersion `3.4`
- **Edge cases / failures:**  
  - Placeholder values not replaced → downstream authentication/ID errors.
  - Using a short-lived token for Instagram may cause intermittent failures unless refreshed.

---

### 2.2 Data Retrieval & Due Filtering

**Overview:**  
Reads all rows with `Status = "Pending"` from Google Sheets, then keeps only rows whose `ScheduledDateTime` is now or in the past.

**Nodes involved:**
- Read Pending Posts from Sheet
- Filter Posts Due Now

#### Node: Read Pending Posts from Sheet
- **Type / role:** `Google Sheets` — retrieves candidate posts.
- **Configuration (interpreted):**
  - Document: `spreadsheetId` from configuration node
  - Sheet tab: `sheetName` from configuration node
  - Filter: `Status` column equals **Pending**
  - Return first match: **false** (returns all matches)
- **Credentials:** Google Sheets OAuth2
- **Inputs/Outputs:**  
  - Input ← Workflow Configuration  
  - Output → Filter Posts Due Now
- **Version notes:** typeVersion `4.7`
- **Edge cases / failures:**
  - OAuth expired / missing scopes → auth failure.
  - If the sheet lacks required columns (e.g., `Status`) → node error or empty result.
  - If `row_number` is not returned/available later, update-by-row may fail.

#### Node: Filter Posts Due Now
- **Type / role:** `Code` — filters items by scheduled datetime.
- **Configuration (interpreted):**
  - JS logic:
    - `now = new Date()`
    - For each row: `scheduledDateTime = new Date(item.json.ScheduledDateTime)`
    - Keep item if `scheduledDateTime <= now`
- **Inputs/Outputs:**  
  - Input ← Read Pending Posts from Sheet  
  - Output → Check If Image Link Provided
- **Version notes:** typeVersion `2`
- **Edge cases / failures:**
  - If `ScheduledDateTime` is missing/invalid → `new Date(invalid)` becomes `Invalid Date`; comparison returns `false`, silently dropping the item.
  - Timezone ambiguity: Sheet values may be interpreted as local time vs UTC depending on the string format. ISO strings without timezone suffix can cause unexpected scheduling.

---

### 2.3 Image Handling & Platform Routing

**Overview:**  
Checks whether an image is specified. If yes, downloads it from Google Drive into binary data. Then routes the post to Instagram, Facebook, or both based on the `Platform` column.

**Nodes involved:**
- Check If Image Link Provided
- Download Image from Google Drive
- Route by Platform

#### Node: Check If Image Link Provided
- **Type / role:** `IF` — branches depending on presence of `ImageLink`.
- **Configuration (interpreted):**
  - Condition: `ImageLink` **is not empty**
  - True path → download image
  - False path → skip download, go directly to routing
- **Key expressions:** `{{ $json.ImageLink }}`
- **Inputs/Outputs:**
  - Input ← Filter Posts Due Now
  - Output (true) → Download Image from Google Drive
  - Output (false) → Route by Platform
- **Version notes:** typeVersion `2.3`
- **Edge cases / failures:**
  - If `ImageLink` contains whitespace or a non-Drive URL, the true branch runs but download may fail.

#### Node: Download Image from Google Drive
- **Type / role:** `Google Drive` — downloads the file into binary.
- **Configuration (interpreted):**
  - Operation: **download**
  - File ID input mode: **url**, value from `ImageLink`
- **Credentials:** Google Drive OAuth2
- **Inputs/Outputs:**
  - Input ← Check If Image Link Provided (true)
  - Output → Route by Platform
- **Version notes:** typeVersion `3`
- **Edge cases / failures:**
  - Link not shareable / insufficient Drive permissions → 403/404.
  - Large files can cause memory/time issues.
  - The downstream HTTP request expects a specific binary property name (see Publishing block); if the binary field name differs, upload will fail.

#### Node: Route by Platform
- **Type / role:** `Switch` — routes items based on `Platform`.
- **Configuration (interpreted):**
  - Rules with renamed outputs:
    - If `Platform == "Instagram"` → output “Instagram”
    - If `Platform == "Facebook"` → output “Facebook”
    - If `Platform == "Both"` → output “Both”
- **Key expression:** `{{ $json.Platform }}`
- **Inputs/Outputs:**
  - Input ← Download Image from Google Drive OR Check If Image Link Provided (false)
  - Output “Instagram” → Post to Instagram
  - Output “Facebook” → Post to Facebook
  - Output “Both” → Post to Both Platforms - Instagram (then Facebook)
- **Version notes:** typeVersion `3.4`
- **Edge cases / failures:**
  - Any unexpected `Platform` value (case mismatch, extra spaces) → item goes to no output and is effectively dropped.
  - Consider normalizing with trim/lowercase or adding a default route.

---

### 2.4 Publishing to Instagram/Facebook

**Overview:**  
Publishes the post to the chosen platform(s). Each publishing path is followed by a success check that detects Graph API errors in the response.

**Nodes involved:**
- Post to Instagram
- Post to Facebook
- Post to Both Platforms - Instagram
- Post to Both Platforms - Facebook
- Check Post Success - Instagram
- Check Post Success - Facebook
- Check Post Success - Both

#### Node: Post to Instagram
- **Type / role:** `HTTP Request` — calls Instagram Graph API to create media.
- **Configuration (interpreted):**
  - Method: POST
  - URL: `https://graph.facebook.com/v24.0/{instagramAccountId}/media`
  - Authentication: via `access_token` parameter (taken from configuration node)
  - Caption passed from sheet: `{{ $json.Caption }}`
  - Uses **multipart/form-data** with:
    - `image_url` configured as **formBinaryData** from input field name `data`
  - Also sends query parameters `access_token` and `caption`
  - Response option: **neverError = true** (node won’t throw on HTTP error; API errors appear in JSON body)
- **Key expressions:**
  - `{{ $('Workflow Configuration').first().json.instagramAccountId }}`
  - `{{ $('Workflow Configuration').first().json.instagramAccessToken }}`
  - `{{ $json.Caption }}`
- **Inputs/Outputs:**
  - Input ← Route by Platform (“Instagram”)
  - Output → Check Post Success - Instagram
- **Version notes:** typeVersion `4.3`
- **Edge cases / failures:**
  - **Important API logic gap:** Creating media (`/{ig-user-id}/media`) is only the first step for Instagram publishing; typically you must call `/{ig-user-id}/media_publish` with the creation ID to actually publish.
  - Parameter mismatch: Instagram expects `image_url` as a publicly accessible URL for many setups; sending binary under the name `image_url` may not work as intended.
  - If binary property name is not `data`, upload fails.
  - Token missing required permissions or expired → error object returned.

#### Node: Post to Facebook
- **Type / role:** `Facebook Graph API` — posts to Page feed.
- **Configuration (interpreted):**
  - POST to `{facebookPageId}/feed`
  - Message: `{{ $json.Caption }}`
- **Credentials:** Uses configured Facebook Graph API credentials (token managed by n8n credential)
- **Inputs/Outputs:**
  - Input ← Route by Platform (“Facebook”)
  - Output → Check Post Success - Facebook
- **Version notes:** typeVersion `1`
- **Edge cases / failures:**
  - Posting permissions missing (Page access token, `pages_manage_posts`, etc.) → Graph API error.
  - This node posts text; it does not attach the downloaded image. If you need an image post, you must use `/photos` edge with `url` or binary upload.

#### Node: Post to Both Platforms - Instagram
- **Type / role:** `HTTP Request` — Instagram step for “Both”.
- **Configuration (interpreted):**
  - Similar to “Post to Instagram”, multipart form upload from binary field `data`.
- **Inputs/Outputs:**
  - Input ← Route by Platform (“Both”)
  - Output → Post to Both Platforms - Facebook
- **Version notes:** typeVersion `4.3`
- **Edge cases / failures:**
  - Same Instagram concerns as above (media_publish step missing; binary vs URL).
  - No explicit “neverError” option here (unlike the single Instagram node). If the request fails with non-2xx, this node may error the workflow unless n8n treats it differently; configuration here is less defensive than “Post to Instagram”.

#### Node: Post to Both Platforms - Facebook
- **Type / role:** `Facebook Graph API` — Facebook step for “Both”.
- **Configuration (interpreted):**
  - POST to `{facebookPageId}/feed`
  - Message: `{{ $json.Caption }}`
- **Inputs/Outputs:**
  - Input ← Post to Both Platforms - Instagram
  - Output → Check Post Success - Both
- **Version notes:** typeVersion `1`
- **Edge cases / failures:**
  - If Instagram step fails and stops execution, Facebook posting won’t happen (sequential dependency).
  - Same limitation: no image attached.

#### Node: Check Post Success - Instagram / Facebook / Both
- **Type / role:** `IF` — determines success by checking for presence of `$json.error`.
- **Configuration (interpreted):**
  - Condition: `$json.error` **does not exist** → success branch
  - Otherwise → error branch
- **Key expression:** `{{ $json.error }}`
- **Inputs/Outputs:**
  - Instagram check input ← Post to Instagram
  - Facebook check input ← Post to Facebook
  - Both check input ← Post to Both Platforms - Facebook
  - Each outputs:
    - True → Prepare Success Update
    - False → Prepare Error Update
- **Version notes:** typeVersion `2.3`
- **Edge cases / failures:**
  - If a node throws an execution error (instead of returning JSON with `error`), this IF node won’t run; you’d need error workflows or “Continue On Fail”.
  - Some APIs return errors in other shapes; relying only on `$json.error` can miss failures.

---

### 2.5 Result Normalization & Sheet Status Update

**Overview:**  
Normalizes the result into a consistent schema (Status, PublishedAt, ErrorMessage), merges success/error branches, and updates the originating sheet row using `row_number` as the match key.

**Nodes involved:**
- Prepare Success Update
- Prepare Error Update
- Merge Success and Error Paths
- Update Sheet with Status

#### Node: Prepare Success Update
- **Type / role:** `Set` — constructs success update payload.
- **Configuration (interpreted):**
  - Sets:
    - `Status = "Success"`
    - `PublishedAt = {{ $now.toISO() }}`
    - `ErrorMessage = ""`
  - Include other fields: enabled (keeps original row fields like `row_number`)
- **Inputs/Outputs:**
  - Input ← any “Check Post Success” node (true branch)
  - Output → Merge Success and Error Paths
- **Version notes:** typeVersion `3.4`
- **Edge cases / failures:**
  - If `row_number` is not present in the item, the update later won’t match the row.

#### Node: Prepare Error Update
- **Type / role:** `Set` — constructs failure update payload.
- **Configuration (interpreted):**
  - Sets:
    - `Status = "Failed"`
    - `PublishedAt = ""`
    - `ErrorMessage = {{ $json.error.message }}`
  - Include other fields: enabled
- **Inputs/Outputs:**
  - Input ← any “Check Post Success” node (false branch)
  - Output → Merge Success and Error Paths
- **Version notes:** typeVersion `3.4`
- **Edge cases / failures:**
  - If error is not shaped like `{ error: { message: ... } }`, `ErrorMessage` becomes empty or expression may resolve to null.
  - If the prior node hard-failed (threw), this block is never reached.

#### Node: Merge Success and Error Paths
- **Type / role:** `Merge` — recombines branches for a single update path.
- **Configuration (interpreted):**
  - Mode: **combine**  
  - Combine by: **combineAll**
- **Inputs/Outputs:**
  - Input 0 ← Prepare Success Update
  - Input 1 ← Prepare Error Update
  - Output → Update Sheet with Status
- **Version notes:** typeVersion `3.2`
- **Edge cases / failures:**
  - With `combineAll`, item pairing behavior can be non-intuitive if multiple items arrive on each input; depending on n8n merge semantics, you might create unexpected combinations. Many workflows instead use “Pass-through” style merges or ensure only one branch emits per original item.

#### Node: Update Sheet with Status
- **Type / role:** `Google Sheets` — writes results back to the originating row.
- **Configuration (interpreted):**
  - Operation: **update**
  - Match column: `row_number`
  - Updates columns:
    - `Status`
    - `PublishedAt`
    - `ErrorMessage`
- **Key expressions:**
  - `Status = {{ $json.Status }}`
  - `row_number = {{ $json.row_number }}`
  - `PublishedAt = {{ $json.PublishedAt }}`
  - `ErrorMessage = {{ $json.ErrorMessage }}`
- **Credentials:** Google Sheets OAuth2
- **Inputs/Outputs:**  
  - Input ← Merge Success and Error Paths  
  - Output: end
- **Version notes:** typeVersion `4.7`
- **Edge cases / failures:**
  - If `row_number` is missing or not unique, wrong row updates or no update occurs.
  - If `row_number` is not an actual column in the sheet, matching fails.
  - Sheet protected/range permissions can block updates.

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Schedule Every 15 Minutes | Schedule Trigger | Periodic workflow start | — | Workflow Configuration | ## 📅 SECTION 1: Trigger & Configuration<br>**Purpose:** Start workflow and load settings<br>**Nodes:**<br>- Schedule Trigger: Runs every 15 minutes<br>- Workflow Configuration: Stores all API credentials and IDs<br>**What happens:** Timer triggers workflow, configuration node provides credentials to all downstream nodes |
| Workflow Configuration | Set | Central config variables for IDs/tokens | Schedule Every 15 Minutes | Read Pending Posts from Sheet | ## 📅 SECTION 1: Trigger & Configuration<br>**Purpose:** Start workflow and load settings<br>**Nodes:**<br>- Schedule Trigger: Runs every 15 minutes<br>- Workflow Configuration: Stores all API credentials and IDs<br>**What happens:** Timer triggers workflow, configuration node provides credentials to all downstream nodes |
| Read Pending Posts from Sheet | Google Sheets | Fetch rows with Status=Pending | Workflow Configuration | Filter Posts Due Now | ## 📊 SECTION 2: Data Retrieval & Filtering<br>**Purpose:** Get posts that are ready to publish<br>**Nodes:**<br>- Read Pending Posts: Gets rows with Status="Pending"<br>- Filter Posts Due Now: Compares ScheduledDateTime with current time<br>**What happens:** Only posts scheduled for now or earlier proceed to next section |
| Filter Posts Due Now | Code | Filter posts whose ScheduledDateTime is due | Read Pending Posts from Sheet | Check If Image Link Provided | ## 📊 SECTION 2: Data Retrieval & Filtering<br>**Purpose:** Get posts that are ready to publish<br>**Nodes:**<br>- Read Pending Posts: Gets rows with Status="Pending"<br>- Filter Posts Due Now: Compares ScheduledDateTime with current time<br>**What happens:** Only posts scheduled for now or earlier proceed to next section |
| Check If Image Link Provided | IF | Branch based on ImageLink presence | Filter Posts Due Now | Download Image from Google Drive; Route by Platform | ## 🖼️ SECTION 3: Image Handling<br>**Purpose:** Download images<br>**Nodes:**<br>- Check If Image Link Provided: Checks ImageLink field<br>- Download Image from Google Drive: Gets file from Drive<br>- Route by Platform: Splits flow by Platform value<br>**What happens:** If image exists, downloads it. Then routes to correct platform(s) |
| Download Image from Google Drive | Google Drive | Download image file to binary | Check If Image Link Provided | Route by Platform | ## 🖼️ SECTION 3: Image Handling<br>**Purpose:** Download images<br>**Nodes:**<br>- Check If Image Link Provided: Checks ImageLink field<br>- Download Image from Google Drive: Gets file from Drive<br>- Route by Platform: Splits flow by Platform value<br>**What happens:** If image exists, downloads it. Then routes to correct platform(s) |
| Route by Platform | Switch | Route to Instagram/Facebook/Both | Download Image from Google Drive; Check If Image Link Provided | Post to Instagram; Post to Facebook; Post to Both Platforms - Instagram | ## 🖼️ SECTION 3: Image Handling<br>**Purpose:** Download images<br>**Nodes:**<br>- Check If Image Link Provided: Checks ImageLink field<br>- Download Image from Google Drive: Gets file from Drive<br>- Route by Platform: Splits flow by Platform value<br>**What happens:** If image exists, downloads it. Then routes to correct platform(s) |
| Post to Instagram | HTTP Request | Call IG Graph API media creation | Route by Platform | Check Post Success - Instagram | ## 🚀 SECTION 4: Publishing<br>**Purpose:** Post to social media platforms<br>**Nodes:**<br>- Post to Instagram: Uses Instagram Graph API<br>- Post to Facebook: Uses Facebook Graph API<br>- Post to Both: Sequential posting to both platforms<br>- Check Success nodes: Verify if posting succeeded<br>**What happens:** Posts content with/without image, checks for errors |
| Check Post Success - Instagram | IF | Determine IG call success via absence of error | Post to Instagram | Prepare Success Update; Prepare Error Update | ## 🚀 SECTION 4: Publishing<br>**Purpose:** Post to social media platforms<br>**Nodes:**<br>- Post to Instagram: Uses Instagram Graph API<br>- Post to Facebook: Uses Facebook Graph API<br>- Post to Both: Sequential posting to both platforms<br>- Check Success nodes: Verify if posting succeeded<br>**What happens:** Posts content with/without image, checks for errors |
| Post to Facebook | Facebook Graph API | Post message to FB Page feed | Route by Platform | Check Post Success - Facebook | ## 🚀 SECTION 4: Publishing<br>**Purpose:** Post to social media platforms<br>**Nodes:**<br>- Post to Instagram: Uses Instagram Graph API<br>- Post to Facebook: Uses Facebook Graph API<br>- Post to Both: Sequential posting to both platforms<br>- Check Success nodes: Verify if posting succeeded<br>**What happens:** Posts content with/without image, checks for errors |
| Check Post Success - Facebook | IF | Determine FB call success via absence of error | Post to Facebook | Prepare Success Update; Prepare Error Update | ## 🚀 SECTION 4: Publishing<br>**Purpose:** Post to social media platforms<br>**Nodes:**<br>- Post to Instagram: Uses Instagram Graph API<br>- Post to Facebook: Uses Facebook Graph API<br>- Post to Both: Sequential posting to both platforms<br>- Check Success nodes: Verify if posting succeeded<br>**What happens:** Posts content with/without image, checks for errors |
| Post to Both Platforms - Instagram | HTTP Request | IG step for “Both” path | Route by Platform | Post to Both Platforms - Facebook | ## 🚀 SECTION 4: Publishing<br>**Purpose:** Post to social media platforms<br>**Nodes:**<br>- Post to Instagram: Uses Instagram Graph API<br>- Post to Facebook: Uses Facebook Graph API<br>- Post to Both: Sequential posting to both platforms<br>- Check Success nodes: Verify if posting succeeded<br>**What happens:** Posts content with/without image, checks for errors |
| Post to Both Platforms - Facebook | Facebook Graph API | FB step for “Both” path | Post to Both Platforms - Instagram | Check Post Success - Both | ## 🚀 SECTION 4: Publishing<br>**Purpose:** Post to social media platforms<br>**Nodes:**<br>- Post to Instagram: Uses Instagram Graph API<br>- Post to Facebook: Uses Facebook Graph API<br>- Post to Both: Sequential posting to both platforms<br>- Check Success nodes: Verify if posting succeeded<br>**What happens:** Posts content with/without image, checks for errors |
| Check Post Success - Both | IF | Determine “Both” path success via absence of error | Post to Both Platforms - Facebook | Prepare Success Update; Prepare Error Update | ## 🚀 SECTION 4: Publishing<br>**Purpose:** Post to social media platforms<br>**Nodes:**<br>- Post to Instagram: Uses Instagram Graph API<br>- Post to Facebook: Uses Facebook Graph API<br>- Post to Both: Sequential posting to both platforms<br>- Check Success nodes: Verify if posting succeeded<br>**What happens:** Posts content with/without image, checks for errors |
| Prepare Success Update | Set | Create success status payload for sheet update | Check Post Success - Instagram; Check Post Success - Facebook; Check Post Success - Both | Merge Success and Error Paths | ## ✅ SECTION 5: Status Update<br>**Purpose:** Record results back to Google Sheets<br>**Nodes:**<br>- Prepare Success Update: Sets Status="Success", adds timestamp<br>- Prepare Error Update: Sets Status="Failed", captures error message<br>- Merge Paths: Combines success/error branches<br>- Update Sheet: Writes status back to original row<br>**What happens:** Sheet is updated with post outcome |
| Prepare Error Update | Set | Create failure status payload for sheet update | Check Post Success - Instagram; Check Post Success - Facebook; Check Post Success - Both | Merge Success and Error Paths | ## ✅ SECTION 5: Status Update<br>**Purpose:** Record results back to Google Sheets<br>**Nodes:**<br>- Prepare Success Update: Sets Status="Success", adds timestamp<br>- Prepare Error Update: Sets Status="Failed", captures error message<br>- Merge Paths: Combines success/error branches<br>- Update Sheet: Writes status back to original row<br>**What happens:** Sheet is updated with post outcome |
| Merge Success and Error Paths | Merge | Recombine success/fail branches | Prepare Success Update; Prepare Error Update | Update Sheet with Status | ## ✅ SECTION 5: Status Update<br>**Purpose:** Record results back to Google Sheets<br>**Nodes:**<br>- Prepare Success Update: Sets Status="Success", adds timestamp<br>- Prepare Error Update: Sets Status="Failed", captures error message<br>- Merge Paths: Combines success/error branches<br>- Update Sheet: Writes status back to original row<br>**What happens:** Sheet is updated with post outcome |
| Update Sheet with Status | Google Sheets | Update original row with outcome fields | Merge Success and Error Paths | — | ## ✅ SECTION 5: Status Update<br>**Purpose:** Record results back to Google Sheets<br>**Nodes:**<br>- Prepare Success Update: Sets Status="Success", adds timestamp<br>- Prepare Error Update: Sets Status="Failed", captures error message<br>- Merge Paths: Combines success/error branches<br>- Update Sheet: Writes status back to original row<br>**What happens:** Sheet is updated with post outcome |
| Section 1 Note | Sticky Note | Comment / documentation | — | — | ## 📅 SECTION 1: Trigger & Configuration<br>**Purpose:** Start workflow and load settings<br>**Nodes:**<br>- Schedule Trigger: Runs every 15 minutes<br>- Workflow Configuration: Stores all API credentials and IDs<br>**What happens:** Timer triggers workflow, configuration node provides credentials to all downstream nodes |
| Section 2 Note | Sticky Note | Comment / documentation | — | — | ## 📊 SECTION 2: Data Retrieval & Filtering<br>**Purpose:** Get posts that are ready to publish<br>**Nodes:**<br>- Read Pending Posts: Gets rows with Status="Pending"<br>- Filter Posts Due Now: Compares ScheduledDateTime with current time<br>**What happens:** Only posts scheduled for now or earlier proceed to next section |
| Section 3 Note | Sticky Note | Comment / documentation | — | — | ## 🖼️ SECTION 3: Image Handling<br>**Purpose:** Download images<br>**Nodes:**<br>- Check If Image Link Provided: Checks ImageLink field<br>- Download Image from Google Drive: Gets file from Drive<br>- Route by Platform: Splits flow by Platform value<br>**What happens:** If image exists, downloads it. Then routes to correct platform(s) |
| Section 4 Note | Sticky Note | Comment / documentation | — | — | ## 🚀 SECTION 4: Publishing<br>**Purpose:** Post to social media platforms<br>**Nodes:**<br>- Post to Instagram: Uses Instagram Graph API<br>- Post to Facebook: Uses Facebook Graph API<br>- Post to Both: Sequential posting to both platforms<br>- Check Success nodes: Verify if posting succeeded<br>**What happens:** Posts content with/without image, checks for errors |
| Section 5 Note | Sticky Note | Comment / documentation | — | — | ## ✅ SECTION 5: Status Update<br>**Purpose:** Record results back to Google Sheets<br>**Nodes:**<br>- Prepare Success Update: Sets Status="Success", adds timestamp<br>- Prepare Error Update: Sets Status="Failed", captures error message<br>- Merge Paths: Combines success/error branches<br>- Update Sheet: Writes status back to original row<br>**What happens:** Sheet is updated with post outcome |
| Setup Instructions Note | Sticky Note | Setup guidance | — | — | ## ⚙️ SETUP INSTRUCTIONS<br><br>### 1. Google Sheet Structure<br>Create columns:<br>- **Caption** (text)<br>- **ImageLink** (Google Drive shareable link, optional)<br>- **Platform** ("Instagram", "Facebook", or "Both")<br>- **ScheduledDateTime** (ISO format: 2024-01-15T10:00:00)<br>- **Status** ("Pending" for new posts)<br>- **PublishedAt** (leave empty)<br>- **ErrorMessage** (leave empty)<br>- **row_number** (unique ID for each row)<br><br>### 2. Configure Workflow Configuration Node<br>- spreadsheetId: From Google Sheets URL<br>- sheetName: Your sheet name<br>- instagramAccessToken: From Facebook Developer<br>- instagramAccountId: Your Instagram Business ID<br>- facebookPageId: Your Facebook Page ID<br><br>### 3. Connect Credentials<br>- Google Sheets OAuth2<br>- Google Drive OAuth2<br>- Facebook Graph API (for Facebook nodes)<br><br>### 4. Instagram Requirements<br>- Facebook Business account<br>- Instagram Business account<br>- Linked to Facebook Page<br>- Access token with permissions:<br>  - instagram_basic<br>  - instagram_content_publish<br>  - pages_read_engagement |

---

## 4. Reproducing the Workflow from Scratch

1) **Create Trigger**
1. Add node **Schedule Trigger** named **“Schedule Every 15 Minutes”**.
2. Set interval: **Every 15 minutes**.

2) **Add configuration container**
3. Add node **Set** named **“Workflow Configuration”**.
4. Add string fields:
   - `spreadsheetId`
   - `sheetName`
   - `instagramAccessToken`
   - `instagramAccountId`
   - `facebookPageId`
5. Turn on **Include Other Fields**.
6. Connect: **Schedule Every 15 Minutes → Workflow Configuration**.

3) **Read “Pending” rows from Google Sheets**
7. Add node **Google Sheets** named **“Read Pending Posts from Sheet”**.
8. Credentials: **Google Sheets OAuth2** (connect your Google account).
9. Set:
   - Document ID: expression `{{ $('Workflow Configuration').first().json.spreadsheetId }}`
   - Sheet name: expression `{{ $('Workflow Configuration').first().json.sheetName }}`
   - Add filter: Column `Status` equals `Pending`
   - Ensure it returns all matches (not only first).
10. Connect: **Workflow Configuration → Read Pending Posts from Sheet**.

4) **Filter by ScheduledDateTime**
11. Add node **Code** named **“Filter Posts Due Now”** with JS:
   ```js
   const now = new Date();
   return items.filter(item => {
     const scheduledDateTime = new Date(item.json.ScheduledDateTime);
     return scheduledDateTime <= now;
   });
   ```
12. Connect: **Read Pending Posts from Sheet → Filter Posts Due Now**.

5) **Branch if an image exists**
13. Add node **IF** named **“Check If Image Link Provided”**.
14. Condition: `ImageLink` **is not empty** (expression: `{{ $json.ImageLink }}`).
15. Connect: **Filter Posts Due Now → Check If Image Link Provided**.

6) **Download image from Drive (true branch)**
16. Add node **Google Drive** named **“Download Image from Google Drive”**.
17. Credentials: **Google Drive OAuth2**.
18. Operation: **Download**.
19. File input: **By URL**, value expression `{{ $json.ImageLink }}`.
20. Connect: **Check If Image Link Provided (true) → Download Image from Google Drive**.

7) **Route by Platform**
21. Add node **Switch** named **“Route by Platform”**.
22. Value to evaluate: `Platform` (`{{ $json.Platform }}`)
23. Add rules:
   - Equals `Instagram` → output named `Instagram`
   - Equals `Facebook` → output named `Facebook`
   - Equals `Both` → output named `Both`
24. Connect:
   - **Download Image from Google Drive → Route by Platform**
   - **Check If Image Link Provided (false) → Route by Platform**

8) **Publishing nodes**
25. Add **HTTP Request** node **“Post to Instagram”**:
   - Method: POST
   - URL: `https://graph.facebook.com/v24.0/{{ $('Workflow Configuration').first().json.instagramAccountId }}/media`
   - Content-Type: **multipart/form-data**
   - Body params:
     - `access_token` = `{{ $('Workflow Configuration').first().json.instagramAccessToken }}`
     - `caption` = `{{ $json.Caption }}`
     - `image_url` = **binary** from input field name `data`
   - (Optional but in this workflow) Also add query params `access_token` and `caption`
   - Set response handling to **not hard-fail on HTTP errors** (neverError / continue style).
26. Add **Facebook Graph API** node **“Post to Facebook”**:
   - Node/Page: `{{ $('Workflow Configuration').first().json.facebookPageId }}`
   - Edge: `feed`
   - Method: POST
   - Query/message: `message = {{ $json.Caption }}`
   - Credentials: Facebook Graph API credential in n8n.

27. Add **HTTP Request** node **“Post to Both Platforms - Instagram”** (same as Instagram settings above).
28. Add **Facebook Graph API** node **“Post to Both Platforms - Facebook”** (same as Facebook settings above).

29. Connect routing:
   - **Route by Platform (Instagram) → Post to Instagram**
   - **Route by Platform (Facebook) → Post to Facebook**
   - **Route by Platform (Both) → Post to Both Platforms - Instagram → Post to Both Platforms - Facebook**

9) **Success checks**
30. Add three **IF** nodes:
   - “Check Post Success - Instagram” (input from Post to Instagram)
   - “Check Post Success - Facebook” (input from Post to Facebook)
   - “Check Post Success - Both” (input from Post to Both Platforms - Facebook)
31. Each IF condition: `$json.error` **does not exist** (expression `{{ $json.error }}` with operator “not exists”).
32. Connect:
   - **Post to Instagram → Check Post Success - Instagram**
   - **Post to Facebook → Check Post Success - Facebook**
   - **Post to Both Platforms - Facebook → Check Post Success - Both**

10) **Prepare success/failure payloads**
33. Add **Set** node “Prepare Success Update”:
   - `Status = "Success"`
   - `PublishedAt = {{ $now.toISO() }}`
   - `ErrorMessage = ""`
   - Include other fields: enabled
34. Add **Set** node “Prepare Error Update”:
   - `Status = "Failed"`
   - `PublishedAt = ""`
   - `ErrorMessage = {{ $json.error.message }}`
   - Include other fields: enabled
35. Connect each Check node:
   - True → Prepare Success Update
   - False → Prepare Error Update

11) **Merge and update Google Sheet**
36. Add **Merge** node “Merge Success and Error Paths”:
   - Mode: **Combine**
   - Combine by: **Combine All**
37. Connect:
   - Prepare Success Update → Merge (input 0)
   - Prepare Error Update → Merge (input 1)
38. Add **Google Sheets** node “Update Sheet with Status”:
   - Operation: **Update**
   - Document ID: `{{ $('Workflow Configuration').first().json.spreadsheetId }}`
   - Sheet name: `{{ $('Workflow Configuration').first().json.sheetName }}`
   - Matching column: `row_number`
   - Set mapped fields:
     - `row_number = {{ $json.row_number }}`
     - `Status = {{ $json.Status }}`
     - `PublishedAt = {{ $json.PublishedAt }}`
     - `ErrorMessage = {{ $json.ErrorMessage }}`
39. Connect: **Merge → Update Sheet with Status**.

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| Google Sheet must contain columns: Caption, ImageLink (optional), Platform, ScheduledDateTime (ISO), Status, PublishedAt, ErrorMessage, row_number | From “Setup Instructions Note” |
| Configure the Workflow Configuration node with spreadsheetId, sheetName, instagramAccessToken, instagramAccountId, facebookPageId | From “Setup Instructions Note” |
| Required credentials: Google Sheets OAuth2, Google Drive OAuth2, Facebook Graph API credentials | From “Setup Instructions Note” |
| Instagram requirements: Facebook Business + Instagram Business linked to Page; permissions: instagram_basic, instagram_content_publish, pages_read_engagement | From “Setup Instructions Note” |