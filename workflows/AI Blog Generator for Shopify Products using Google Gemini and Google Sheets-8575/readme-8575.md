AI Blog Generator for Shopify Products using Google Gemini and Google Sheets

https://n8nworkflows.xyz/workflows/ai-blog-generator-for-shopify-products-using-google-gemini-and-google-sheets-8575


# AI Blog Generator for Shopify Products using Google Gemini and Google Sheets

### 1. Workflow Overview

This workflow automates the generation of SEO-optimized blog posts for Shopify products by leveraging Google Sheets as a data intermediary and Google Gemini AI for content creation. It targets e-commerce store owners or marketers who want to auto-generate engaging blog content from product data to enhance content marketing and SEO without manual writing.

The workflow is logically divided into these main blocks:

- **1.1 Input Reception and Product Data Extraction**  
  Fetches all Shopify products and writes raw product data into Google Sheets for persistence.

- **1.2 Data Cleaning and Formatting**  
  Processes raw Shopify product data to clean descriptions, parse images, and prepare structured, plain-text content. Updates a refined Google Sheet.

- **1.3 Filtering and Selection**  
  Filters products whose blog posts have not yet been generated ("unused" or empty status) to avoid duplicates, limiting to one product at a time.

- **1.4 AI Blog Content Generation**  
  Sends cleaned product data to Google Gemini AI via a Langchain agent node, using a detailed prompt to generate a structured blog post with title, intro, features, reviews, SEO fields, and formatting.

- **1.5 Blog Content Handling and Publishing**  
  Parses AI output, formats blog content safely for Shopify, creates the blog post via Shopify Admin API, and updates Google Sheets with blog status and Shopify article ID.

- **1.6 Status Management and Monitoring**  
  Updates Google Sheets to track blog post generation and publication status, ensuring the workflow runs idempotently and reports progress.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Product Data Extraction

- **Overview:**  
  This block initiates the workflow manually, fetches all products from Shopify, and stores raw product info in Google Sheets.

- **Nodes Involved:**  
  - Start Creation (Manual Trigger)  
  - Get All Product Details (Shopify Node)  
  - Product Details to Sheet (Google Sheets Node)

- **Node Details:**

1. **Start Creation**  
   - Type: Manual Trigger  
   - Role: Starts the workflow on demand  
   - Inputs: None  
   - Outputs: Triggers next node  
   - Edge Cases: None (manual start)

2. **Get All Product Details**  
   - Type: Shopify Node  
   - Role: Retrieves all products with full details via Shopify Admin API  
   - Configuration: Operation "getAll" on "product" resource, returns all products, authenticated via Shopify Access Token (OAuth2 token stored in credentials)  
   - Inputs: Trigger from Manual Trigger  
   - Outputs: List of products  
   - Edge Cases: Shopify API rate limits, authentication expiry, network errors

3. **Product Details to Sheet**  
   - Type: Google Sheets Node  
   - Role: Appends or updates product data to the "Raw Input" sheet in Google Sheets  
   - Configuration: Maps product fields (title, images, handle, id, description) to specific columns; matches rows by product_id to prevent duplicates  
   - Inputs: Product list from Shopify node  
   - Outputs: Confirmation of write operation  
   - Edge Cases: Google Sheets API quota limits, authentication failure, schema mismatches

---

#### 2.2 Data Cleaning and Formatting

- **Overview:**  
  This block processes raw product data to clean descriptions (HTML to plain text), parse image URLs into arrays, and prepare refined structured data for AI consumption.

- **Nodes Involved:**  
  - Fix the input format (Code Node)  
  - Update the sheet (Google Sheets Node)

- **Node Details:**

1. **Fix the input format**  
   - Type: Code Node (JavaScript)  
   - Role: Cleans and structures data for each product item  
   - Key Logic:  
     - Strips HTML tags from description to create a plain text field `cleanDescription`  
     - Parses image arrays or JSON strings safely to extract unique image URLs  
     - Adds error handling to catch parse or unexpected data shape errors  
   - Inputs: Raw product data from Google Sheets node  
   - Outputs: Refined JSON with fields: product_id, title, handle, description (HTML), cleanDescription (plain text), imageSources (array), totalImages, error (optional)  
   - Edge Cases: Malformed HTML, images field as string or array, JSON parse failures, missing fields

2. **Update the sheet**  
   - Type: Google Sheets Node  
   - Role: Appends or updates cleaned product data into the "Refined Input" sheet  
   - Configuration: Maps refined fields such as title, handle, images (up to 4 images as separate columns), cleanDescription, blog_status (default "unused"), and blog_id  
   - Inputs: Output from Code Node  
   - Outputs: Confirmation of write operation  
   - Edge Cases: Google Sheets API limits, authentication errors, mismatch of array image indexes

---

#### 2.3 Filtering and Selection

- **Overview:**  
  Filters products to select only those which have not yet been blogged (where `blog_status` is "unused" or empty). Limits processing to one product per run to control workflow load and ensure individual handling.

- **Nodes Involved:**  
  - Filter Duplicates (If Node)  
  - Limit = 1 (Limit Node)  
  - Nothing (NoOp Node for unused branch)

- **Node Details:**

1. **Filter Duplicates**  
   - Type: If Node  
   - Role: Checks if `blog_status` equals "unused" or empty string  
   - Inputs: Product list from Google Sheets (Refined Input)  
   - Outputs:  
     - True: Products to process  
     - False: Products already processed (ignored)  
   - Edge Cases: Unexpected or missing blog_status values

2. **Limit = 1**  
   - Type: Limit Node  
   - Role: Restricts processing to 1 product per workflow run  
   - Inputs: Filtered products marked "unused"  
   - Outputs: Single product to process

3. **Nothing**  
   - Type: NoOp Node  
   - Role: Placeholder for products filtered out (no further processing)

---

#### 2.4 AI Blog Content Generation

- **Overview:**  
  Uses Google Gemini AI via Langchain agent node to generate a fully structured blog post based on product title and cleaned description. The AI is prompted with detailed instructions to produce formatted HTML blog content, SEO metadata, and summaries.

- **Nodes Involved:**  
  - Magic Room (Langchain Agent Node)  
  - Gemini (Google Gemini LM Node)  
  - Output Parser (Langchain Output Parser Node)

- **Node Details:**

1. **Magic Room**  
   - Type: Langchain AI Agent Node  
   - Role: Sends prompt to Google Gemini AI for blog content generation  
   - Configuration:  
     - Input: Product title and clean description as text fields  
     - System Message: Detailed content writer instructions specifying HTML formatting, content structure (title, intro, features, reviews, call to action), word counts, and SEO metadata output format as JSON  
     - Prompt Type: Define (fixed prompt)  
   - Inputs: Single product item from Limit node  
   - Outputs: Raw AI JSON response with blog fields  
   - Edge Cases: AI model timeout, malformed AI output, API quota limits, credentials errors

2. **Gemini**  
   - Type: Google Gemini Language Model Node (LMChat)  
   - Role: Underlying AI model called by Magic Room  
   - Configuration: Uses Google Palm API credentials for authentication  
   - Inputs: From Magic Room node  
   - Outputs: AI text response  
   - Edge Cases: API token expiry, rate limits, network failure

3. **Output Parser**  
   - Type: Langchain Structured Output Parser Node  
   - Role: Parses AI JSON output into usable structured data fields  
   - Configuration: JSON schema example enforces presence of fields like blog_title, content, excerpt, page_title, meta_description  
   - Inputs: AI raw output from Gemini/Langchain agent  
   - Outputs: Parsed JSON for downstream nodes  
   - Edge Cases: Parsing errors if AI output deviates from expected schema

---

#### 2.5 Blog Content Handling and Publishing

- **Overview:**  
  Converts AI-generated content into a Shopify-safe JSON format, publishes the blog post via Shopify API, and updates Google Sheets with blog content and publication status.

- **Nodes Involved:**  
  - Update Blog Content (Google Sheets Node)  
  - Fix Content Format (Code Node)  
  - Blog Creation (HTTP Request Node)  
  - Status Update (Google Sheets Node)  
  - Update Input table (Google Sheets Node)  
  - Nothing1 (NoOp Node)

- **Node Details:**

1. **Update Blog Content**  
   - Type: Google Sheets Node  
   - Role: Appends AI-generated blog content fields to the "Blog Post" sheet  
   - Inputs: Parsed AI output and product metadata  
   - Configuration: Maps blog_title, content, excerpt, page_title, meta_description, blog_status ("generated"), product_id, handle  
   - Edge Cases: API limits, mismatched data, credential issues

2. **Fix Content Format**  
   - Type: Code Node (JavaScript)  
   - Role: Converts raw HTML blog content into JSON-string-safe format for Shopify API  
   - Logic: Escapes backslashes, quotes, and line breaks; removes carriage returns  
   - Outputs: JSON with formatted blog content for Shopify body_html field  
   - Edge Cases: Improper escaping causing API errors

3. **Blog Creation**  
   - Type: HTTP Request Node  
   - Role: Calls Shopify Admin API to create a blog article under a given blog_id  
   - Configuration:  
     - POST method to `/admin/api/2025-07/blogs/{blog_id}/articles.json`  
     - JSON body includes title, author (fixed "Manish Kumar"), tags, body_html, and publish timestamp  
     - Authenticated with Shopify Access Token  
   - Inputs: Fixed content from previous node  
   - Outputs: Shopify API response with article ID  
   - Edge Cases: API rate limits, invalid blog_id, authentication errors, network issues

4. **Status Update**  
   - Type: Google Sheets Node  
   - Role: Updates blog post sheet row with article ID and sets blog_status to "posted"  
   - Inputs: Shopify API response and blog metadata  
   - Edge Cases: Write conflicts, sheet permissions, credential errors

5. **Update Input table**  
   - Type: Google Sheets Node  
   - Role: Updates "Refined Input" sheet to mark product `blog_status` as "used" after post creation, preventing reprocessing  
   - Edge Cases: Sync issues, API limits

6. **Nothing1**  
   - Type: NoOp Node  
   - Role: Placeholder to terminate workflow after successful update

---

#### 2.6 Documentation and Instructions (Sticky Notes)

- Several sticky notes provide user instructions, workflow description, and author contact details. They are informational and not part of the execution logic.

---

### 3. Summary Table

| Node Name               | Node Type                                | Functional Role                                  | Input Node(s)              | Output Node(s)            | Sticky Note                                                                                                                        |
|-------------------------|-----------------------------------------|-------------------------------------------------|----------------------------|---------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| Sticky Note             | Sticky Note                             | Workflow overview and description                |                            |                           | # Shopify Product-to-Blog Automation with AI & Google Sheets (workflow purpose and features)                                    |
| Sticky Note1            | Sticky Note                             | Empty informational note                          |                            |                           |                                                                                                                                  |
| Start Creation          | Manual Trigger                         | Manual start of workflow                          |                            | Get All Product Details    |                                                                                                                                  |
| Get All Product Details | Shopify                                | Fetch all Shopify products                        | Start Creation             | Product Details to Sheet   |                                                                                                                                  |
| Product Details to Sheet| Google Sheets                          | Write raw product data to "Raw Input" sheet      | Get All Product Details    | Fix the input format       |                                                                                                                                  |
| Fix the input format    | Code                                  | Clean descriptions, parse images, structure data | Product Details to Sheet   | Update the sheet           |                                                                                                                                  |
| Update the sheet        | Google Sheets                         | Write refined product data to "Refined Input"   | Fix the input format       | Filter Duplicates          |                                                                                                                                  |
| Filter Duplicates       | If                                    | Filter products with blog_status "unused" or "" | Update the sheet           | Limit = 1 / Nothing        |                                                                                                                                  |
| Limit = 1              | Limit                                 | Limit processing to one product                   | Filter Duplicates          | Magic Room                 |                                                                                                                                  |
| Nothing                 | NoOp                                  | Placeholder for filtered out products            | Filter Duplicates (false)  |                           |                                                                                                                                  |
| Magic Room              | Langchain AI Agent                    | Generate blog post content with Google Gemini    | Limit = 1                  | Update Input table, Update Blog Content |                                                                                                                                  |
| Gemini                  | Google Gemini LMChat                  | Underlying AI language model                      | Magic Room                 | Output Parser              |                                                                                                                                  |
| Output Parser           | Langchain Output Parser               | Parse AI JSON output                              | Gemini                     | Magic Room (re-input)      |                                                                                                                                  |
| Update Blog Content     | Google Sheets                        | Append AI-generated blog content to "Blog Post" | Magic Room                 | Fix Content Format         |                                                                                                                                  |
| Fix Content Format      | Code                                 | Escape HTML content for Shopify API              | Update Blog Content        | Blog Creation              |                                                                                                                                  |
| Blog Creation           | HTTP Request                         | Create Shopify blog article via API              | Fix Content Format         | Status Update              |                                                                                                                                  |
| Status Update           | Google Sheets                        | Update blog post status and article ID in sheet  | Blog Creation              | Nothing1                  |                                                                                                                                  |
| Update Input table      | Google Sheets                        | Mark product blog_status as "used"                | Magic Room                 |                           |                                                                                                                                  |
| Nothing1                | NoOp                                  | Workflow termination placeholder                  | Status Update              |                           |                                                                                                                                  |
| Sticky Note3            | Sticky Note                          | User instructions and setup guidelines            |                            |                           | # User Instruction for Workflow (setup, spreadsheet config, execution, monitoring)                                               |
| Sticky Note4            | Sticky Note                          | Author information                                 |                            |                           | # Author Details (with contact info and image for Manish Kumar)                                                                 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Manual Trigger Node**  
   - Name: Start Creation  
   - Purpose: Entry point to start the workflow manually

2. **Add Shopify Node to Fetch Products**  
   - Name: Get All Product Details  
   - Resource: Product  
   - Operation: Get All  
   - Authentication: Shopify Access Token (set up OAuth2 with Admin API token)  
   - Connect Start Creation → Get All Product Details

3. **Add Google Sheets Node to Save Raw Product Data**  
   - Name: Product Details to Sheet  
   - Document ID: Your Google Sheets document with sheet "Raw Input" (gid=0)  
   - Operation: Append or Update  
   - Matching Column: product_id  
   - Map fields: title, images, handle, product_id, description (body_html)  
   - Connect Get All Product Details → Product Details to Sheet

4. **Add Code Node to Clean and Format Data**  
   - Name: Fix the input format  
   - JavaScript to:  
     - Strip HTML tags from descriptions to create plain text  
     - Parse images field (array or string JSON) to extract unique image URLs  
     - Handle errors gracefully  
   - Connect Product Details to Sheet → Fix the input format

5. **Add Google Sheets Node to Save Refined Data**  
   - Name: Update the sheet  
   - Document ID: Same spreadsheet, sheet "Refined Input" (gid=25757113)  
   - Operation: Append or Update  
   - Matching Column: product_id  
   - Map: title, handle, cleanDescription as description, up to 4 images as separate columns, blog_status default to "unused", blog_id (fixed)  
   - Connect Fix the input format → Update the sheet

6. **Add If Node to Filter Unprocessed Products**  
   - Name: Filter Duplicates  
   - Condition: blog_status equals "unused" OR blog_status equals "" (empty)  
   - Connect Update the sheet → Filter Duplicates

7. **Add Limit Node to Process One Product**  
   - Name: Limit = 1  
   - Limit: 1 item  
   - Connect Filter Duplicates (true) → Limit = 1

8. **Add NoOp Node for Unused Branch**  
   - Name: Nothing  
   - Connect Filter Duplicates (false) → Nothing

9. **Add Langchain AI Agent Node to Generate Blog Content**  
   - Name: Magic Room  
   - Input: Provide title and cleaned description fields  
   - System prompt: Detailed instructions for blog post structure, HTML formatting, word counts, SEO fields, output as JSON (see workflow prompt)  
   - Connect Limit = 1 → Magic Room

10. **Add Google Gemini LMChat Node for AI Model**  
    - Name: Gemini  
    - Credentials: Google Palm API with valid key  
    - Connect Magic Room (ai_languageModel) → Gemini

11. **Add Langchain Output Parser Node**  
    - Name: Output Parser  
    - Configuration: JSON schema matching expected blog fields  
    - Connect Gemini (ai_outputParser) → Output Parser  
    - Connect Output Parser (ai_outputParser) → Magic Room (ai_outputParser) [for structured output]

12. **Add Google Sheets Node to Save AI Blog Content**  
    - Name: Update Blog Content  
    - Sheet: "Blog Post" (gid=1548183235)  
    - Operation: Append  
    - Map AI output fields: blog_title, content, excerpt, page_title, meta_description, blog_status="generated", product_id, handle  
    - Connect Magic Room → Update Blog Content

13. **Add Code Node to Escape HTML for Shopify**  
    - Name: Fix Content Format  
    - JavaScript to escape backslashes, quotes, and line breaks in blog content for Shopify API POST  
    - Connect Update Blog Content → Fix Content Format

14. **Add HTTP Request Node to Create Shopify Blog Article**  
    - Name: Blog Creation  
    - Method: POST  
    - URL: `https://{shop}.myshopify.com/admin/api/2025-07/blogs/{blog_id}/articles.json`  
    - Body: JSON with article title, author, tags, escaped body_html, published_at timestamp  
    - Authentication: Shopify Access Token OAuth2 credentials  
    - Connect Fix Content Format → Blog Creation

15. **Add Google Sheets Node to Update Blog Post Status**  
    - Name: Status Update  
    - Sheet: "Blog Post"  
    - Operation: Update  
    - Match product_id  
    - Map article_id from Shopify response, blog_status="posted"  
    - Connect Blog Creation → Status Update

16. **Add Google Sheets Node to Mark Product as Used**  
    - Name: Update Input table  
    - Sheet: "Refined Input"  
    - Operation: Append or Update  
    - Match product_id  
    - Update blog_status="used" to prevent reprocessing  
    - Connect Magic Room → Update Input table

17. **Add NoOp Node as Workflow End Point**  
    - Name: Nothing1  
    - Connect Status Update → Nothing1

18. **Add Sticky Notes as Needed**  
    - For workflow overview, user instructions, and author information

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                   | Context or Link                                             |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------|
| This workflow automates transforming Shopify product data into SEO-optimized blog posts using Google Gemini AI and Google Sheets for data storage and tracking.                                                                                                                                           | Workflow purpose (Sticky Note)                              |
| User instructions include setting up Shopify Admin API token, Google Sheets access, and Google Gemini API credentials. Spreadsheet contains three sheets: Raw Input, Refined Input, and Blog Post for data and status tracking.                                                                                   | Setup instructions (Sticky Note3)                           |
| Author: Manish Kumar – Expert Designer & Automation Engineer specializing in Shopify apps and workflow automation. Contact: manipritraj@gmail.com, +91-9334888899.                                                                                                                                          | Author info (Sticky Note4)                                  |
| AI prompt in Langchain Agent can be customized to change blog style or content structure. Shopify blog ID and tags in HTTP Request node can be changed to post to different blog categories.                                                                                                                 | Customization tips (Sticky Note3)                           |
| Shopify API version used: 2025-07. Ensure API permissions include reading products and writing blog articles.                                                                                                                                                                                               | Shopify API notes                                           |
| Google Sheets OAuth2 credential must have edit access to the specified spreadsheet.                                                                                                                                                                                                                          | Google Sheets credential notes                              |
| Google Gemini AI usage requires the Google Palm API key with sufficient quota and billing enabled.                                                                                                                                                                                                          | Google Gemini API notes                                     |

---

**Disclaimer:**  
The provided description and data come exclusively from an n8n automated workflow. The process respects all content policies, contains no illegal or prohibited content, and only manipulates legal, publicly accessible data.