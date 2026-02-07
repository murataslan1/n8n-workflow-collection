Automate Lightroom to Instagram with Claude AI Alt Text Generator

https://n8nworkflows.xyz/workflows/automate-lightroom-to-instagram-with-claude-ai-alt-text-generator-9692


# Automate Lightroom to Instagram with Claude AI Alt Text Generator

### 1. Workflow Overview

This workflow automates the process of posting photos from an Adobe Lightroom Cloud album to Instagram, with AI-generated alt text for accessibility and SEO. It continuously polls a specified Lightroom album, downloads new photo assets, generates descriptive alternative text using Claude AI, and queues the photos with metadata in a Data Table for further Instagram posting.

The workflow is logically divided into three main blocks:

- **1.1 Input Reception & Parameter Setup:** Triggered periodically by a schedule node, sets essential parameters such as Lightroom catalog and album IDs, API keys, and the n8n instance URL.

- **1.2 Lightroom Asset Retrieval & Preparation:** Fetches the asset list from Lightroom Cloud, cleans and parses the response, splits the asset list into individual items, and sorts them by capture date.

- **1.3 AI Alt Text Generation & Data Table Insertion:** Checks for duplicate assets in the Data Table to avoid reposting, processes new images one by one through an AI node that analyzes images and generates alt text, then inserts the enriched records into the Data Table for Instagram posting.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Parameter Setup

- **Overview:**  
This block triggers the workflow on a scheduled interval and initializes necessary parameters for the Lightroom API and n8n instance.

- **Nodes Involved:**  
  - Schedule Trigger  
  - Params

- **Node Details:**

  - **Schedule Trigger**  
    - Type: Schedule trigger  
    - Role: Initiates the workflow at a fixed interval (hourly) to check for new Lightroom assets.  
    - Configuration: Set to trigger every hour.  
    - Inputs: None (starting node)  
    - Outputs: Connects to Params node.  
    - Edge cases: Misconfigured schedule could cause missed or excessive runs.

  - **Params**  
    - Type: Set node  
    - Role: Defines key variables like Lightroom catalog ID, album ID, API key, and the public n8n instance base URL for image proxying.  
    - Configuration: Four string parameters set with placeholder values:  
      - LR catalog ID  
      - LR album ID  
      - LR API key  
      - n8n instance URL (publicly reachable for image proxy webhook)  
    - Inputs: From Schedule Trigger  
    - Outputs: Connects to HTTP Request node.  
    - Edge cases: Incorrect or missing parameters will cause downstream failures in API calls.

---

#### 2.2 Lightroom Asset Retrieval & Preparation

- **Overview:**  
This block fetches the list of photo assets from the Lightroom album using the Lightroom API, cleans the response from Adobe's XSSI prefix, parses JSON, splits the list into individual assets, and sorts them by capture date.

- **Nodes Involved:**  
  - HTTP Request  
  - Code in JavaScript  
  - Split Out  
  - Sort  
  - If row does not exist

- **Node Details:**

  - **HTTP Request**  
    - Type: HTTP Request (OAuth2)  
    - Role: Calls Lightroom API to retrieve assets of a specific album, adding required OAuth2 authentication and X-API-Key header.  
    - Configuration:  
      - URL template using parameters for catalog and album IDs  
      - OAuth2 credentials for Lightroom API  
      - Header includes X-API-Key from parameters  
      - Response format set to text  
    - Inputs: From Params node  
    - Outputs: Connects to Code in JavaScript node.  
    - Edge cases:  
      - OAuth token expiry or misconfiguration may cause 401 errors.  
      - Network timeout or API errors (429 rate limits, 5xx server errors).  
      - Incorrect catalog or album ID causing 404 errors.

  - **Code in JavaScript**  
    - Type: Function (JavaScript)  
    - Role: Strips Adobe Lightroom’s XSSI JSON prefix (`while(1){}`) from the HTTP response and parses JSON safely.  
    - Key logic:  
      - Detects and removes the XSSI prefix if present.  
      - Attempts JSON parse, returns parsed object or error info.  
      - Handles cases where input is already a JSON object.  
    - Inputs: Raw text response from HTTP Request.  
    - Outputs: Provides a clean parsed JSON object with `resources` array.  
    - Edge cases:  
      - Malformed JSON response leading to parse failure.  
      - Unexpected response structure requiring adaptation of input extraction.

  - **Split Out**  
    - Type: Split Out  
    - Role: Splits the `parsed.resources` array into individual items for further processing.  
    - Configuration: Splitting on `parsed.resources` field from previous node output.  
    - Inputs: From Code in JavaScript node.  
    - Outputs: Connects to Sort node.  
    - Edge cases: Empty asset list results in no items downstream.

  - **Sort**  
    - Type: Sort  
    - Role: Sorts individual assets by their capture date for chronological processing.  
    - Configuration: Sort field set to `asset.payload.captureDate`.  
    - Inputs: From Split Out node.  
    - Outputs: Connects to If row does not exist node.  
    - Edge cases: Missing or invalid capture dates may affect sorting order.

  - **If row does not exist**  
    - Type: Data Table (rowNotExists)  
    - Role: Checks that the asset ID does not already exist in the Photos Data Table to prevent duplication.  
    - Configuration: Filters on `lr_asset_id` matching current asset’s `id`.  
    - Inputs: From Sort node.  
    - Outputs:  
      - If asset is new (rowNotExists = true), connects to Loop Over Items for AI processing.  
      - Else, no output, effectively filtering duplicates.  
    - Edge cases:  
      - Data Table API failures or permission errors.  
      - Race conditions if workflow runs concurrently.

---

#### 2.3 AI Alt Text Generation & Data Table Insertion

- **Overview:**  
For each new photo asset, this block generates an AI-based alt text description using Claude AI, then inserts the photo metadata and generated alt text into the Photos Data Table.

- **Nodes Involved:**  
  - Loop Over Items (SplitInBatches)  
  - Analyze image (Anthropic Claude AI)  
  - Insert row

- **Node Details:**

  - **Loop Over Items**  
    - Type: Split In Batches  
    - Role: Processes each new asset individually to avoid rate limits and manage asynchronous AI calls.  
    - Configuration: Default batch size (1 item per batch).  
    - Inputs: From If row does not exist (true branch).  
    - Outputs:  
      - First output: empty (for possible parallel paths, unused)  
      - Second output: connects to Analyze image node.  
    - Edge cases: Large batch sizes could overwhelm API or cause timeouts.

  - **Analyze image**  
    - Type: Anthropic AI (LangChain)  
    - Role: Uses Claude AI to analyze the image and generate a factual, SEO-optimized English alt description of up to 500 characters.  
    - Configuration:  
      - Model: Claude Sonnet 4.5  
      - Input text prompt instructs AI to focus on visible content, composition, lighting, colors, mood, setting, and legible text, excluding guesses or sensitive info.  
      - Input resource type is “image” with image URL constructed via n8n webhook proxy, embedding catalog and asset IDs.  
      - Credentials: Anthropic API key configured.  
      - Retry enabled on failure to improve reliability.  
    - Inputs: From Loop Over Items (one asset at a time).  
    - Outputs: Connects to Insert row node.  
    - Edge cases:  
      - AI API rate limits or errors.  
      - Image URL inaccessible due to misconfigured n8n webhook or network issues.  
      - AI output format changes causing parsing errors.

  - **Insert row**  
    - Type: Data Table (insert)  
    - Role: Saves the asset metadata and generated alt text into the Photos Data Table for further Instagram posting.  
    - Configuration:  
      - Inserts columns:  
        - `lr_asset_id` = asset.id  
        - `lr_asset` = serialized JSON string of the asset object  
        - `alt` = AI-generated alt text from Analyze image node output  
      - Data Table ID references the Photos table.  
    - Inputs: From Analyze image node.  
    - Outputs: Connects back to Loop Over Items node (to process next item).  
    - Edge cases:  
      - Data Table insertion failures due to schema mismatch or permission errors.  
      - Duplicate inserts if deduplication fails upstream.

---

### 3. Summary Table

| Node Name          | Node Type                         | Functional Role                                  | Input Node(s)            | Output Node(s)          | Sticky Note                                                                                                                |
|--------------------|----------------------------------|-------------------------------------------------|--------------------------|-------------------------|----------------------------------------------------------------------------------------------------------------------------|
| Schedule Trigger    | Schedule Trigger                 | Start workflow on schedule                       | None                     | Params                  |                                                                                                                            |
| Params             | Set                             | Define Lightroom and n8n instance parameters    | Schedule Trigger          | HTTP Request            |                                                                                                                            |
| HTTP Request       | HTTP Request                    | Fetch Lightroom album assets via API             | Params                    | Code in JavaScript      |                                                                                                                            |
| Code in JavaScript | Function (JS)                   | Strip Adobe XSSI prefix and parse JSON           | HTTP Request              | Split Out               |                                                                                                                            |
| Split Out          | Split Out                      | Split asset list into individual asset items     | Code in JavaScript        | Sort                    |                                                                                                                            |
| Sort               | Sort                           | Sort assets by capture date                       | Split Out                 | If row does not exist    |                                                                                                                            |
| If row does not exist | Data Table (rowNotExists)      | Filter out assets already in Data Table          | Sort                      | Loop Over Items          |                                                                                                                            |
| Loop Over Items    | Split In Batches               | Process assets one by one for AI alt text        | If row does not exist     | Analyze image           |                                                                                                                            |
| Analyze image      | Anthropic AI (Claude)          | Generate AI-based alt text from image             | Loop Over Items           | Insert row              |                                                                                                                            |
| Insert row         | Data Table (insert)            | Save asset info and alt text into Photos Data Table | Analyze image             | Loop Over Items          |                                                                                                                            |
| Sticky Note        | Sticky Note                    | Overview and setup instructions                   | None                     | None                    | ### Lightroom → Instagram: Photos-to-Post Queue (n8n) Purpose and configuration details on Lightroom API, Data Table, and AI |
| Sticky Note1       | Sticky Note                    | Step 1: Download image list from Lightroom Cloud | None                     | None                    | ## STEP1 = Download the image list from Lightroom Cloud                                                                    |
| Sticky Note2       | Sticky Note                    | Step 2: Split and sort assets                      | None                     | None                    | ## STEP2 = Split and sort them                                                                                            |
| Sticky Note3       | Sticky Note                    | Step 3: Analyze with AI and save in Data Table    | None                     | None                    | ## STEP3 = Analyse them with IA then save them in the Data Table                                                           |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger node**  
   - Type: Schedule Trigger  
   - Configuration: Set to trigger every hour (or desired interval).  
   - No credentials required.

2. **Create Params node (Set node)**  
   - Type: Set  
   - Configuration: Add the following string parameters with your actual values:  
     - `LR catalog ID` (your Lightroom catalog ID)  
     - `LR album ID` (your Lightroom album ID)  
     - `LR API key` (your Lightroom X-API-Key)  
     - `n8n instance URL` (public URL of your n8n instance)  
   - Connect Schedule Trigger → Params.

3. **Create HTTP Request node**  
   - Type: HTTP Request  
   - Method: GET  
   - URL: `https://lr.adobe.io/v2/catalogs/{{ $json["LR catalog ID"] }}/albums/{{ $json["LR album ID"] }}/assets?embed=asset`  
   - Authentication: OAuth2  
     - Configure Lightroom OAuth2 credentials with Adobe OAuth app.  
   - Add header parameter: `X-API-Key` with value from Params node (`{{$json["LR API key"]}}`).  
   - Response Format: Text  
   - Connect Params → HTTP Request.

4. **Create Code in JavaScript node**  
   - Type: Function  
   - Paste the provided JavaScript code that:  
     - Strips the `while(1){}` prefix from the Adobe response  
     - Parses JSON safely  
   - Connect HTTP Request → Code in JavaScript.

5. **Create Split Out node**  
   - Type: Split Out  
   - Field to split out: `parsed.resources` (array of assets)  
   - Connect Code in JavaScript → Split Out.

6. **Create Sort node**  
   - Type: Sort  
   - Sort field: `asset.payload.captureDate` (ascending)  
   - Connect Split Out → Sort.

7. **Create If row does not exist node (Data Table)**  
   - Type: Data Table, operation `rowNotExists`  
   - Data Table: Select or create a Data Table named "Photos" with columns:  
     - `lr_asset_id` (string, unique)  
     - `lr_asset` (string)  
     - `alt` (string)  
     - Plus optional Instagram-related fields for future use  
   - Filter: `lr_asset_id` equals `{{$json.asset.id}}`  
   - Connect Sort → If row does not exist.

8. **Create Loop Over Items node (Split In Batches)**  
   - Type: Split In Batches  
   - Batch size: 1 (default)  
   - Connect If row does not exist (true output) → Loop Over Items.

9. **Create Analyze image node (Anthropic Claude AI)**  
   - Type: LangChain Anthropic AI  
   - Model: Select `claude-sonnet-4-5-20250929` or equivalent  
   - Text prompt:  
     ```
     You are a photography-savvy describer. Analyze the image and write a factual, SEO-oriented English alt description (single paragraph, up to 500 characters). Focus on visible subject, composition/framing/perspective, lighting (type, direction, quality), colors/contrast, mood, setting/background, and any clearly legible text. Avoid guesses about brand, gear, identities, dates, or locations unless unambiguously visible. No sensitive attributes, no hashtags/emojis, no calls to action. Output only the paragraph.
     ```  
   - Resource type: Image  
   - Image URL: Construct using n8n webhook proxy URL:  
     ```
     {{$('Params').item.json["n8n instance URL"]}}/webhook/lr-image?catalogId={{$('Params').item.json["LR catalog ID"]}}&assetId={{$json.asset.id}}&format=1280
     ```  
   - Credentials: Configure Anthropic API credentials.  
   - Retry on fail: Enabled  
   - Connect Loop Over Items → Analyze image.

10. **Create Insert row node (Data Table)**  
    - Type: Data Table, operation `insert`  
    - Data Table: Same "Photos" table as above  
    - Columns to insert:  
      - `lr_asset_id`: `{{$json.asset.id}}`  
      - `lr_asset`: `{{JSON.stringify($('Split Out').item.json.asset)}}`  
      - `alt`: `{{$json.content[0].text}}` (from Analyze image output)  
    - Connect Analyze image → Insert row.

11. **Connect Insert row → Loop Over Items**  
    - To continue processing next batch/item

12. **Configure any required sub-workflows or webhooks**  
    - The image proxy webhook `/webhook/lr-image` must be implemented to serve images from Lightroom assets securely.  
    - Ensure OAuth2 credentials for Lightroom API and Anthropic AI are correctly set up.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                          | Context or Link                                                                                             |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------|
| The workflow requires a publicly accessible n8n instance URL because the AI image analysis node fetches images via a webhook proxy URL.                                             | n8n instance public URL                                                                                      |
| Data Table schema must include a unique `lr_asset_id` to prevent duplicate processing. Additional fields support Instagram posting metadata.                                         | Photos Data Table schema                                                                                     |
| OAuth2 credentials for Adobe Lightroom API require an Adobe developer account and correct scopes for catalog and album access.                                                        | Adobe Lightroom API OAuth2 setup                                                                             |
| Anthropic Claude AI credentials are necessary; alternative LLM providers can be used if configured accordingly.                                                                        | Anthropic API credentials                                                                                     |
| The workflow handles Adobe Lightroom’s XSSI JSON prefix using a custom JavaScript node to ensure valid JSON parsing.                                                                  | Code in JavaScript node                                                                                       |
| Retry logic on the AI node helps mitigate transient API failures or rate limits.                                                                                                       | Analyze image node configuration                                                                              |
| Sticky notes in the workflow provide conceptual steps and setup instructions directly in the n8n editor interface.                                                                     | Workflow sticky notes                                                                                          |

---

**Disclaimer:** The provided text is exclusively derived from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or copyrighted material. All data handled is legal and public.