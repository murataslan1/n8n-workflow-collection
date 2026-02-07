Automate WooCommerce SEO with Yoast & AI-Powered Meta Tag Generation for FREE

https://n8nworkflows.xyz/workflows/automate-woocommerce-seo-with-yoast---ai-powered-meta-tag-generation-for-free-2963


# Automate WooCommerce SEO with Yoast & AI-Powered Meta Tag Generation for FREE

### 1. Workflow Overview

This workflow automates the generation and updating of SEO meta titles and descriptions for WooCommerce products using n8n. It targets WooCommerce store owners or SEO specialists who want to streamline SEO optimization by automatically creating meta tags based on product data and updating both WooCommerce and a Google Sheets tracking document.

The workflow is logically divided into the following blocks:

- **1.1 Trigger Block:** Initiates the workflow either manually or on a schedule.
- **1.2 Data Retrieval Block:** Fetches product IDs from Google Sheets and retrieves detailed product information from WooCommerce.
- **1.3 Meta Tag Generation Block:** Uses a free AI language model (Gemini 2.0 Flash Exp via OpenRouter) to generate SEO-optimized meta titles and descriptions based on product data.
- **1.4 WooCommerce Update Block:** Updates the WooCommerce product metadata with the generated meta tags using Yoast SEO fields.
- **1.5 Google Sheets Update Block:** Updates the Google Sheets document with the new meta tags, product URL, title, and update timestamp.

---

### 2. Block-by-Block Analysis

#### 1.1 Trigger Block

- **Overview:** This block starts the workflow either manually for testing or automatically on a schedule.
- **Nodes Involved:**  
  - `When clicking ‘Test workflow’` (Manual Trigger)  
  - `Schedule Trigger` (Scheduled Trigger)

- **Node Details:**

  - **When clicking ‘Test workflow’**  
    - Type: Manual Trigger  
    - Role: Allows manual initiation of the workflow for testing or one-off runs.  
    - Configuration: No parameters; triggers on user action.  
    - Input: None  
    - Output: Triggers `Get product ID` node.  
    - Edge Cases: None significant; manual trigger depends on user interaction.

  - **Schedule Trigger**  
    - Type: Schedule Trigger  
    - Role: Automatically triggers the workflow at regular intervals (every minute by default).  
    - Configuration: Interval set to every minute (field: minutes).  
    - Input: None  
    - Output: Not connected in this workflow JSON, but available for scheduling.  
    - Edge Cases: Potential for overlapping runs if workflow execution exceeds interval time.

---

#### 1.2 Data Retrieval Block

- **Overview:** Retrieves product IDs from Google Sheets where meta titles are missing, then fetches full product details from WooCommerce.
- **Nodes Involved:**  
  - `Get product ID` (Google Sheets)  
  - `Get product` (WooCommerce)  
  - Sticky Notes: "Get the product ID that does not have metatitle or metadescription yet", "Get all the product details starting from the product ID"

- **Node Details:**

  - **Get product ID**  
    - Type: Google Sheets  
    - Role: Reads product IDs from a Google Sheets document, filtering for products missing meta titles.  
    - Configuration:  
      - Document ID: Google Sheets document with WooCommerce product IDs.  
      - Sheet: First sheet (gid=0).  
      - Filter: Looks for rows where `METATITLE` column is empty (returnFirstMatch: true).  
      - Authentication: OAuth2 via configured Google Sheets credentials.  
    - Input: Trigger from manual trigger node.  
    - Output: Passes product ID and row number to `Get product`.  
    - Edge Cases:  
      - No matching rows (empty result).  
      - Google Sheets API quota or auth errors.  
      - Incorrect document or sheet ID.

  - **Get product**  
    - Type: WooCommerce  
    - Role: Fetches detailed product data from WooCommerce using product ID.  
    - Configuration:  
      - Operation: Get product by ID.  
      - Product ID: Dynamically set from `Get product ID` node's `ID POST` field.  
      - Credentials: WooCommerce API credentials configured.  
    - Input: Product ID from `Get product ID`.  
    - Output: Full product JSON including name, description, short description, categories, permalink, etc.  
    - Edge Cases:  
      - Product ID not found or deleted.  
      - WooCommerce API errors or rate limits.  
      - Network timeouts.

---

#### 1.3 Meta Tag Generation Block

- **Overview:** Uses the Gemini 2.0 Flash Exp language model via OpenRouter to generate SEO-optimized meta titles and descriptions based on product data.
- **Nodes Involved:**  
  - `Gemini 2.0 Flash Exp` (OpenRouter LLM)  
  - `Structured Output Parser` (Langchain output parser)  
  - `Generate metatitle e metadescription` (Langchain chain LLM node)  
  - Sticky Note: "Based on the content of the product generates the metatitle and metadescription. In this example we use Gemini Think 2.0 which is FREE with OpenRouter"

- **Node Details:**

  - **Gemini 2.0 Flash Exp**  
    - Type: Langchain OpenRouter LLM Chat node  
    - Role: Sends product data prompt to Gemini 2.0 Flash Exp model to generate meta tags.  
    - Configuration:  
      - Model: `google/gemini-2.0-flash-exp:free`  
      - Credentials: OpenRouter API credentials.  
    - Input: Prompt from `Generate metatitle e metadescription` node.  
    - Output: Raw AI response with meta title and description.  
    - Edge Cases:  
      - API quota exceeded or invalid credentials.  
      - Model response delays or failures.  
      - Unexpected or malformed AI output.

  - **Structured Output Parser**  
    - Type: Langchain Structured Output Parser  
    - Role: Parses AI output into structured JSON with `metatitle` and `metadescription` fields.  
    - Configuration:  
      - Schema: JSON object with string properties `metatitle` and `metadescription`.  
    - Input: AI raw output from `Gemini 2.0 Flash Exp`.  
    - Output: Parsed structured data for downstream use.  
    - Edge Cases:  
      - Parsing errors if AI output does not conform to schema.  
      - Missing or incomplete fields.

  - **Generate metatitle e metadescription**  
    - Type: Langchain Chain LLM node  
    - Role: Constructs prompt with product details and sends to AI model; receives parsed output.  
    - Configuration:  
      - Prompt includes product title, description, short description, and categories serialized as JSON string.  
      - Detailed instructions for SEO-optimized meta tag generation (max 60 chars for title, 160 for description, keyword inclusion, etc.).  
      - Output parser enabled to parse AI response.  
    - Input: Product data from `Get product`.  
    - Output: Structured meta tags passed to `Update product`.  
    - Edge Cases:  
      - Expression evaluation errors in prompt construction.  
      - AI model generating invalid or incomplete meta tags.

---

#### 1.4 WooCommerce Update Block

- **Overview:** Updates WooCommerce product metadata with the generated meta title and description using Yoast SEO fields.
- **Nodes Involved:**  
  - `Update product` (WooCommerce)  
  - Sticky Note: "Insert the generated data into WooCommerce"

- **Node Details:**

  - **Update product**  
    - Type: WooCommerce  
    - Role: Updates product metadata fields `_yoast_wpseo_title` and `_yoast_wpseo_metadesc` with generated meta tags.  
    - Configuration:  
      - Operation: Update product by ID.  
      - Product ID: From `Get product ID` node.  
      - Metadata keys: `_yoast_wpseo_title` and `_yoast_wpseo_metadesc`.  
      - Values: From `Generate metatitle e metadescription` node output.  
      - Credentials: WooCommerce API credentials.  
    - Input: Meta tags and product ID.  
    - Output: Passes updated product info to `Update Sheet`.  
    - Edge Cases:  
      - WooCommerce API update failures.  
      - Invalid metadata keys or values.  
      - Network or auth errors.

---

#### 1.5 Google Sheets Update Block

- **Overview:** Updates the Google Sheets document with the new meta tags, product URL, product title, and the timestamp of the update.
- **Nodes Involved:**  
  - `Update Sheet` (Google Sheets)  
  - Sticky Note: None directly attached.

- **Node Details:**

  - **Update Sheet**  
    - Type: Google Sheets  
    - Role: Updates the row corresponding to the product with new meta title, meta description, product URL, product title, and current timestamp.  
    - Configuration:  
      - Document ID and sheet same as `Get product ID`.  
      - Matching column: `row_number` to identify the correct row.  
      - Columns updated: `METATITLE`, `METADESCRIPTION`, `URL`, `TITLE POST`, `DATA` (timestamp).  
      - Timestamp formatted as `dd/LL/yyyy HH:ii`.  
      - Authentication: OAuth2 Google Sheets credentials.  
    - Input: Data from `Update product` and `Get product`.  
    - Output: None (end of workflow).  
    - Edge Cases:  
      - Google Sheets API errors or quota limits.  
      - Row number mismatch or missing.  
      - Timestamp formatting issues.

---

### 3. Summary Table

| Node Name                     | Node Type                          | Functional Role                                  | Input Node(s)                 | Output Node(s)                  | Sticky Note                                                                                                         |
|-------------------------------|----------------------------------|-------------------------------------------------|------------------------------|-------------------------------|---------------------------------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’  | Manual Trigger                   | Manual start of workflow                         | None                         | Get product ID                 |                                                                                                                     |
| Schedule Trigger              | Schedule Trigger                 | Scheduled start of workflow                      | None                         | None                          |                                                                                                                     |
| Get product ID               | Google Sheets                   | Retrieves product ID missing meta titles        | When clicking ‘Test workflow’ | Get product                   | Get the product ID that does not have metatitle or metadescription yet                                              |
| Get product                  | WooCommerce                    | Fetches full product details by product ID       | Get product ID               | Generate metatitle e metadescription | Get all the product details starting from the product ID                                                             |
| Gemini 2.0 Flash Exp         | Langchain OpenRouter LLM Chat  | AI model generating meta tags                     | Generate metatitle e metadescription | Generate metatitle e metadescription (ai_outputParser) | Based on the content of the product generates the metatitle and metadescription. In this example we use Gemini Think 2.0 which is FREE with OpenRouter |
| Structured Output Parser     | Langchain Output Parser        | Parses AI output into structured meta tags       | Gemini 2.0 Flash Exp         | Generate metatitle e metadescription |                                                                                                                     |
| Generate metatitle e metadescription | Langchain Chain LLM           | Constructs prompt, sends to AI, parses output    | Get product, Gemini 2.0 Flash Exp, Structured Output Parser | Update product                 |                                                                                                                     |
| Update product              | WooCommerce                    | Updates WooCommerce product metadata with meta tags | Generate metatitle e metadescription | Update Sheet                  | Insert the generated data into WooCommerce                                                                           |
| Update Sheet                | Google Sheets                   | Updates Google Sheets with meta tags and info    | Update product               | None                          |                                                                                                                     |
| Sticky Note                 | Sticky Note                    | Informational notes                              | None                         | None                          | WooCommerce SEO Yoast Meta Tag Generation for FREE. This workflow streamlines the process of optimizing WooCommerce product pages for SEO, saving time and ensuring consistency in meta tag generation. Create a copy of [this Sheet](https://docs.google.com/spreadsheets/d/17eYoKhtUupkye9Bmv13BjfP2jyymBUW4UYQGWU6V2cs/edit?usp=sharing) and insert only the WooCommerce product ID in the column "B". |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Nodes:**
   - Add a **Manual Trigger** node named `When clicking ‘Test workflow’` with default settings.
   - Optionally, add a **Schedule Trigger** node named `Schedule Trigger` set to run every minute (or desired interval).

2. **Add Google Sheets Node to Get Product ID:**
   - Add a **Google Sheets** node named `Get product ID`.
   - Set operation to read rows from your Google Sheets document.
   - Configure to filter rows where `METATITLE` column is empty (to find products missing meta titles).
   - Use OAuth2 credentials for Google Sheets.
   - Set the document ID and sheet name (gid=0).
   - Enable `returnFirstMatch` to process one product at a time.
   - Connect `When clicking ‘Test workflow’` node output to this node.

3. **Add WooCommerce Node to Get Product Details:**
   - Add a **WooCommerce** node named `Get product`.
   - Set operation to "Get product" by ID.
   - Set product ID parameter to `={{ $json["ID POST"] }}` from the previous node.
   - Use WooCommerce API credentials.
   - Connect output of `Get product ID` to this node.

4. **Add Langchain Chain LLM Node for Meta Tag Generation:**
   - Add a **Langchain Chain LLM** node named `Generate metatitle e metadescription`.
   - Configure prompt with product details:
     ```
     Create metatitle and metadescription in the language of the following product:
     - Title: {{ $json.name }}
     - Description: {{ $json.description }}
     - Short description: {{ $json.short_description }}
     - Product category: {{ (JSON.stringify($json.categories)) }},
     ```
   - Add detailed instructions for SEO meta tag creation (max 60 chars title, 160 chars description, keyword inclusion, etc.).
   - Enable output parser.

5. **Add Langchain OpenRouter LLM Chat Node:**
   - Add a **Langchain OpenRouter LLM Chat** node named `Gemini 2.0 Flash Exp`.
   - Set model to `google/gemini-2.0-flash-exp:free`.
   - Use OpenRouter API credentials.
   - Connect this node as the AI language model input for `Generate metatitle e metadescription`.

6. **Add Langchain Structured Output Parser Node:**
   - Add a **Langchain Structured Output Parser** node named `Structured Output Parser`.
   - Define schema with two string properties: `metatitle` and `metadescription`.
   - Connect AI output from `Gemini 2.0 Flash Exp` to this parser.
   - Connect parser output to `Generate metatitle e metadescription` node.

7. **Add WooCommerce Node to Update Product:**
   - Add a **WooCommerce** node named `Update product`.
   - Set operation to "Update product" by ID.
   - Product ID: `={{ $('Get product ID').item.json['ID POST'] }}`.
   - Update metadata keys `_yoast_wpseo_title` and `_yoast_wpseo_metadesc` with values from `Generate metatitle e metadescription` output.
   - Use WooCommerce API credentials.
   - Connect output of `Generate metatitle e metadescription` to this node.

8. **Add Google Sheets Node to Update Sheet:**
   - Add a **Google Sheets** node named `Update Sheet`.
   - Set operation to update row.
   - Match row by `row_number` from `Get product ID`.
   - Update columns: `METATITLE`, `METADESCRIPTION`, `URL`, `TITLE POST`, and `DATA` (current timestamp).
   - Use OAuth2 Google Sheets credentials.
   - Connect output of `Update product` to this node.

9. **Connect Workflow:**
   - Connect `When clicking ‘Test workflow’` → `Get product ID` → `Get product` → `Generate metatitle e metadescription` → `Update product` → `Update Sheet`.
   - Connect `Gemini 2.0 Flash Exp` as AI model input to `Generate metatitle e metadescription`.
   - Connect `Structured Output Parser` between `Gemini 2.0 Flash Exp` and `Generate metatitle e metadescription` for output parsing.

10. **Test and Validate:**
    - Trigger manually to test.
    - Verify meta tags update in WooCommerce and Google Sheets.
    - Adjust prompt or node settings as needed.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                   | Context or Link                                                                                              |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| WooCommerce SEO Yoast Meta Tag Generation for FREE. This workflow streamlines the process of optimizing WooCommerce product pages for SEO, saving time and ensuring consistency in meta tag generation.                         | Workflow purpose summary                                                                                     |
| Create a copy of [this Google Sheets template](https://docs.google.com/spreadsheets/d/17eYoKhtUupkye9Bmv13BjfP2jyymBUW4UYQGWU6V2cs/edit?usp=sharing) and insert only the WooCommerce product IDs in column "B".                      | Google Sheets setup instruction                                                                              |
| Gemini 2.0 Flash Exp is a free language model accessible via OpenRouter, used here for SEO meta tag generation.                                                                                                               | AI model info                                                                                               |
| Ensure WooCommerce API credentials and Google Sheets OAuth2 credentials are properly configured before running the workflow.                                                                                                  | Credential setup reminder                                                                                     |
| Meta title max length: 60 characters; meta description max length: 160 characters; both must include main keywords and be engaging to maximize click-through rate (CTR).                                                       | SEO meta tag best practices                                                                                   |

---

This documentation provides a detailed, structured reference for understanding, reproducing, and maintaining the WooCommerce SEO Yoast Meta Tag Generation workflow using n8n.