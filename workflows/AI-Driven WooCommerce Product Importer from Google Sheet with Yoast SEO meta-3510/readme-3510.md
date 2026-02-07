AI-Driven WooCommerce Product Importer from Google Sheet with Yoast SEO meta

https://n8nworkflows.xyz/workflows/ai-driven-woocommerce-product-importer-from-google-sheet-with-yoast-seo-meta-3510


# AI-Driven WooCommerce Product Importer from Google Sheet with Yoast SEO meta

### 1. Workflow Overview

This workflow automates the creation and SEO optimization of WooCommerce products by integrating Google Sheets, WooCommerce REST API, and AI-powered SEO meta tag generation. It is designed for eCommerce managers and digital marketers who want to streamline bulk product uploads and improve search engine visibility without manual intervention.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception & Data Retrieval**: Triggering the workflow manually and fetching product data from Google Sheets.
- **1.2 Data Preparation & Product Creation**: Parsing and mapping product categories, then creating products in WooCommerce with detailed attributes.
- **1.3 SEO Meta Tag Generation**: Using an AI language model to generate optimized meta titles and descriptions for Yoast SEO.
- **1.4 Meta Tag Application & Sheet Update**: Applying generated SEO meta tags to WooCommerce products and updating Google Sheets with completion status and SEO data.
- **1.5 Completion Notification**: Sending a Telegram message to notify when all products have been processed.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Data Retrieval

**Overview:**  
This block initiates the workflow manually and retrieves product data from a specified Google Sheets document, filtering out already processed entries.

**Nodes Involved:**  
- When clicking ‘Test workflow’ (Manual Trigger)  
- Get products (Google Sheets)  
- Loop products (SplitInBatches)

**Node Details:**

- **When clicking ‘Test workflow’**  
  - Type: Manual Trigger  
  - Role: Starts the workflow on user command.  
  - Configuration: Default manual trigger with no parameters.  
  - Inputs: None  
  - Outputs: Triggers "Get products" node.  
  - Edge cases: None typical; user must manually trigger.

- **Get products**  
  - Type: Google Sheets  
  - Role: Reads product rows from Google Sheets where the "DONE" column is empty (not processed).  
  - Configuration:  
    - Document ID and Sheet ID set to the product data sheet.  
    - Filter applied on "DONE" column to exclude processed rows.  
  - Inputs: Trigger from manual node.  
  - Outputs: Passes product data to "Loop products".  
  - Edge cases:  
    - Authentication errors if Google Sheets OAuth2 token expires.  
    - Empty or malformed rows could cause downstream errors.  
    - Sheet ID or document ID misconfiguration.

- **Loop products**  
  - Type: SplitInBatches  
  - Role: Processes products one by one or in batches to avoid API rate limits and manage workflow load.  
  - Configuration: Default batch size (not explicitly set).  
  - Inputs: Product list from "Get products".  
  - Outputs: Sends each batch item to "Map categories" and also triggers "Send message" after completion.  
  - Edge cases:  
    - Large datasets may require batch size tuning.  
    - Failure in batch processing could halt workflow.

---

#### 2.2 Data Preparation & Product Creation

**Overview:**  
This block converts category data from string to array format, creates WooCommerce products with detailed attributes, and marks products as done in Google Sheets.

**Nodes Involved:**  
- Map categories (Code)  
- Create product (WooCommerce)  
- Creation done (Google Sheets)

**Node Details:**

- **Map categories**  
  - Type: Code (JavaScript)  
  - Role: Parses the "CATEGORY" string from the sheet (comma-separated IDs) into an array of integers for WooCommerce API compatibility.  
  - Configuration:  
    - Splits category string by commas, converts each to integer, filters out invalid values.  
  - Inputs: Single product item from "Loop products".  
  - Outputs: Modified product data with category array to "Create product".  
  - Edge cases:  
    - Empty or malformed category strings could result in empty arrays.  
    - Non-numeric category IDs filtered out silently.

- **Create product**  
  - Type: WooCommerce  
  - Role: Creates a new product in WooCommerce with all relevant details including SKU, prices, stock, categories, images, and descriptions.  
  - Configuration:  
    - Uses product fields mapped from Google Sheets columns (e.g., TITLE, SKU, SALE PRICE).  
    - Sets product type as "simple", manages stock, sets tax status as taxable.  
    - Uploads product image URL with alt text.  
  - Inputs: Product data with parsed categories from "Map categories".  
  - Outputs: WooCommerce product creation response to "Creation done".  
  - Edge cases:  
    - WooCommerce API errors (authentication, validation, rate limits).  
    - Invalid image URLs or missing required fields.  
    - SKU conflicts or duplicate products.

- **Creation done**  
  - Type: Google Sheets  
  - Role: Updates the original Google Sheet row marking the product as done, stores WooCommerce product ID and permalink.  
  - Configuration:  
    - Matches rows by internal "row_number".  
    - Updates "DONE" column with "x", adds "ID" and "PERMALINK" from WooCommerce response.  
  - Inputs: Product creation response from "Create product" and row metadata from "Map categories".  
  - Outputs: Passes data to "SEO Expert" node.  
  - Edge cases:  
    - Google Sheets update failures due to permissions or API limits.  
    - Row matching errors if "row_number" is missing or incorrect.

---

#### 2.3 SEO Meta Tag Generation

**Overview:**  
This block uses an AI language model to generate SEO-optimized meta titles and descriptions based on product content.

**Nodes Involved:**  
- SEO Expert (LangChain LLM Chain)  
- OpenRouter Chat Model (AI Language Model)  
- Structured Output Parser (LangChain Output Parser)

**Node Details:**

- **OpenRouter Chat Model**  
  - Type: LangChain OpenRouter Chat Model  
  - Role: Provides AI model access (Google Gemini 2.0 flash experimental) for generating SEO meta tags.  
  - Configuration:  
    - Model set to "google/gemini-2.0-flash-exp:free".  
    - Uses OpenRouter API credentials.  
  - Inputs: Prompt from "SEO Expert".  
  - Outputs: Raw AI response to "SEO Expert".  
  - Edge cases:  
    - API rate limits or authentication failures.  
    - Model response delays or errors.

- **SEO Expert**  
  - Type: LangChain Chain LLM  
  - Role: Constructs a detailed prompt including product title, category, short description, and description to instruct the AI to generate meta title and description.  
  - Configuration:  
    - Prompt instructs AI to create meta title ≤60 chars and meta description ≤160 chars with SEO best practices.  
    - Output parser enabled to extract structured JSON with "metatitle" and "metadescription".  
  - Inputs: Product data from "Creation done".  
  - Outputs: AI-generated meta tags to "Set SEO meta".  
  - Edge cases:  
    - Prompt formatting errors or expression failures.  
    - AI output not matching expected schema.

- **Structured Output Parser**  
  - Type: LangChain Output Parser Structured  
  - Role: Parses AI response into structured JSON with fields "metatitle" and "metadescription".  
  - Configuration:  
    - JSON schema defined with two string properties.  
  - Inputs: Raw AI output from "OpenRouter Chat Model".  
  - Outputs: Parsed meta tags to "SEO Expert".  
  - Edge cases:  
    - Parsing errors if AI output deviates from schema.

---

#### 2.4 Meta Tag Application & Sheet Update

**Overview:**  
This block applies the AI-generated SEO meta tags to WooCommerce products using Yoast SEO metadata fields and updates the Google Sheet with the meta tags.

**Nodes Involved:**  
- Set SEO meta (WooCommerce)  
- Update meta (Google Sheets)

**Node Details:**

- **Set SEO meta**  
  - Type: WooCommerce  
  - Role: Updates the WooCommerce product metadata with Yoast SEO meta title and description.  
  - Configuration:  
    - Uses WooCommerce REST API "update product" operation.  
    - Sets metadata keys "_yoast_wpseo_title" and "_yoast_wpseo_metadesc" with AI-generated values.  
    - Product ID sourced from "Create product" node.  
  - Inputs: Meta tags from "SEO Expert".  
  - Outputs: Passes to "Update meta".  
  - Edge cases:  
    - WooCommerce API errors or permission issues.  
    - Metadata keys must be enabled in WordPress REST API (see setup notes).  
    - Product ID must be valid.

- **Update meta**  
  - Type: Google Sheets  
  - Role: Updates the Google Sheet row with generated meta title and description for record-keeping.  
  - Configuration:  
    - Matches rows by "row_number".  
    - Updates "METATITLE" and "METADESCRIPTION" columns.  
  - Inputs: Meta tags and row info from "Set SEO meta".  
  - Outputs: Loops back to "Loop products" for next batch.  
  - Edge cases:  
    - Google Sheets API update errors.  
    - Row matching failures.

---

#### 2.5 Completion Notification

**Overview:**  
After processing all products, this block sends a Telegram notification indicating completion.

**Nodes Involved:**  
- Send message (Telegram)

**Node Details:**

- **Send message**  
  - Type: Telegram  
  - Role: Sends a notification message to a configured Telegram chat.  
  - Configuration:  
    - Text: "Product creation completed"  
    - Chat ID: Must be set in node parameters or environment variable.  
  - Inputs: Triggered after "Loop products" completes all batches.  
  - Outputs: None (end of workflow).  
  - Edge cases:  
    - Telegram API authentication errors.  
    - Invalid or missing chat ID.

---

### 3. Summary Table

| Node Name               | Node Type                          | Functional Role                            | Input Node(s)               | Output Node(s)            | Sticky Note                                                                                   |
|-------------------------|----------------------------------|--------------------------------------------|-----------------------------|---------------------------|-----------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’ | Manual Trigger                   | Starts workflow manually                    | None                        | Get products              |                                                                                               |
| Get products            | Google Sheets                    | Retrieves unprocessed product rows          | When clicking ‘Test workflow’ | Loop products             |                                                                                               |
| Loop products           | SplitInBatches                  | Processes products in batches                | Get products, Update meta    | Map categories, Send message |                                                                                               |
| Map categories          | Code (JavaScript)               | Parses category string to array              | Loop products               | Create product            |                                                                                               |
| Create product          | WooCommerce                     | Creates WooCommerce product                   | Map categories              | Creation done             |                                                                                               |
| Creation done           | Google Sheets                   | Marks product as done and stores WooCommerce IDs | Create product              | SEO Expert                |                                                                                               |
| SEO Expert              | LangChain Chain LLM             | Generates SEO meta title and description     | Creation done               | Set SEO meta              |                                                                                               |
| OpenRouter Chat Model   | LangChain OpenRouter Chat Model | AI model for SEO meta generation             | SEO Expert                  | SEO Expert                |                                                                                               |
| Structured Output Parser| LangChain Output Parser Structured | Parses AI output into structured JSON        | OpenRouter Chat Model       | SEO Expert                |                                                                                               |
| Set SEO meta            | WooCommerce                    | Updates WooCommerce product with SEO meta    | SEO Expert                  | Update meta               |                                                                                               |
| Update meta             | Google Sheets                   | Updates Google Sheet with SEO meta tags      | Set SEO meta                | Loop products             |                                                                                               |
| Send message            | Telegram                       | Sends completion notification                 | Loop products               | None                      |                                                                                               |
| Sticky Note             | Sticky Note                    | Setup instructions for Yoast SEO plugin      | None                        | None                      | ## STEP 1 - Install Yoast SEO Plugin and add PHP code to functions.php for meta API support.  |
| Sticky Note1            | Sticky Note                    | Instructions for Google Sheets setup          | None                        | None                      | ## STEP 3 - Copy provided sheet, format columns B, E, F as text, I as numeric, insert image URLs in C. |
| Sticky Note2            | Sticky Note                    | WooCommerce API enablement and Telegram setup | None                        | None                      | ## STEP 2 - Enable WooCommerce API and add CHAT_ID in Telegram node.                          |
| Sticky Note3            | Sticky Note                    | Workflow overview and purpose                  | None                        | None                      | # AI-Driven WooCommerce Product Importer description and benefits.                            |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Type: Manual Trigger  
   - Purpose: To start the workflow manually.

2. **Add Google Sheets Node ("Get products")**  
   - Operation: Read rows  
   - Document ID: Set to your Google Sheets document containing product data.  
   - Sheet Name: Set to the appropriate sheet (e.g., "gid=0").  
   - Filters: Filter rows where "DONE" column is empty (to process only new products).  
   - Credentials: Configure Google Sheets OAuth2 credentials.

3. **Add SplitInBatches Node ("Loop products")**  
   - Purpose: Process products one at a time or in manageable batches.  
   - Connect "Get products" output to this node.

4. **Add Code Node ("Map categories")**  
   - Purpose: Convert category string (comma-separated) into an array of integers.  
   - Code snippet:  
     ```javascript
     for (const item of $input.all()) {
       if (item.json.CATEGORY && typeof item.json.CATEGORY === 'string') {
         item.json.CATEGORY = item.json.CATEGORY
           .split(',')
           .map(id => parseInt(id))
           .filter(id => !isNaN(id));
       }
     }
     return $input.all();
     ```  
   - Connect "Loop products" output to this node.

5. **Add WooCommerce Node ("Create product")**  
   - Operation: Create product  
   - Resource: Product  
   - Map fields from input JSON:  
     - Name: TITLE  
     - SKU: SKU  
     - Regular Price: REGULAR PRICE  
     - Sale Price: SALE PRICE  
     - Stock Quantity: STOCK QTY  
     - Categories: CATEGORY (array)  
     - Description: DESCRIPTION  
     - Short Description: SHORT DESCRIPTION  
     - Images: Use IMAGE URL with alt text as TITLE  
     - Set product type to "simple", manage stock enabled, tax status "taxable", stock status "instock", catalog visibility "visible".  
   - Credentials: WooCommerce API credentials configured.  
   - Connect "Map categories" output to this node.

6. **Add Google Sheets Node ("Creation done")**  
   - Operation: Update row  
   - Document and Sheet: Same as "Get products"  
   - Matching column: Use internal "row_number" to identify row.  
   - Update columns:  
     - DONE: "x"  
     - ID: WooCommerce product ID from "Create product" response  
     - PERMALINK: WooCommerce product permalink  
   - Credentials: Google Sheets OAuth2  
   - Connect "Create product" output to this node.

7. **Add LangChain Chain LLM Node ("SEO Expert")**  
   - Prompt: Provide product details (title, category, short description, description) and instruct AI to generate SEO meta title (≤60 chars) and meta description (≤160 chars) with SEO best practices.  
   - Enable output parser with JSON schema for "metatitle" and "metadescription".  
   - Connect "Creation done" output to this node.

8. **Add LangChain OpenRouter Chat Model Node ("OpenRouter Chat Model")**  
   - Model: "google/gemini-2.0-flash-exp:free"  
   - Credentials: OpenRouter API key  
   - Connect "SEO Expert" node's AI language model input to this node.

9. **Add LangChain Output Parser Structured Node ("Structured Output Parser")**  
   - Schema: JSON with "metatitle" and "metadescription" as string properties.  
   - Connect "OpenRouter Chat Model" output to this node.  
   - Connect this node's output back to "SEO Expert" node's output parser input.

10. **Add WooCommerce Node ("Set SEO meta")**  
    - Operation: Update product  
    - Resource: Product  
    - Product ID: Use WooCommerce product ID from "Create product" node.  
    - Metadata:  
      - Key: "_yoast_wpseo_title" → Value: AI-generated meta title  
      - Key: "_yoast_wpseo_metadesc" → Value: AI-generated meta description  
    - Credentials: WooCommerce API  
    - Connect "SEO Expert" output to this node.

11. **Add Google Sheets Node ("Update meta")**  
    - Operation: Update row  
    - Document and Sheet: Same as above  
    - Matching column: "row_number"  
    - Update columns:  
      - METATITLE: AI-generated meta title  
      - METADESCRIPTION: AI-generated meta description  
    - Credentials: Google Sheets OAuth2  
    - Connect "Set SEO meta" output to this node.

12. **Connect "Update meta" node output back to "Loop products" node input**  
    - This creates a loop to process the next batch/product.

13. **Add Telegram Node ("Send message")**  
    - Operation: Send message  
    - Chat ID: Set your Telegram chat ID  
    - Text: "Product creation completed"  
    - Credentials: Telegram API  
    - Connect "Loop products" node's second output (completion) to this node.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Context or Link                                                                                         |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| **STEP 1**: Install Yoast SEO plugin on WordPress and add PHP code to `functions.php` to enable REST API support for Yoast meta keys `_yoast_wpseo_title` and `_yoast_wpseo_metadesc`. This is required for WooCommerce API to update SEO metadata.                                                                                                                                                                                                                                           | PHP code snippet provided in Sticky Note node.                                                       |
| **STEP 2**: Enable WooCommerce REST API in WordPress and configure Telegram node with your valid `CHAT_ID` to receive notifications.                                                                                                                                                                                                                                                                                                                                                         | Sticky Note node instructions.                                                                        |
| **STEP 3**: Prepare Google Sheets with product data in columns A to I. Important formatting: Columns B, E, and F as text; Column I as numeric; Columns G and H accept HTML; Column C contains product image URLs. Use the provided sample sheet as a template.                                                                                                                                                                                                                                   | [Google Sheets sample](https://docs.google.com/spreadsheets/d/1vNkSgWHsgYDCusD-xKSrQg64hd7WvOjQmqdB2NdVFG4/edit?usp=sharing) |
| Workflow designed to be triggered manually or scheduled for automation.                                                                                                                                                                                                                                                                                                                                                                                                                       |                                                                                                       |
| For customization or consulting, contact info@n3w.it or connect on [LinkedIn](https://www.linkedin.com/in/davideboizza/).                                                                                                                                                                                                                                                                                                                                                                      |                                                                                                       |

---

This documentation provides a detailed, stepwise understanding of the workflow structure, node configurations, and integration points, enabling reproduction, modification, and troubleshooting by advanced users or automation agents.