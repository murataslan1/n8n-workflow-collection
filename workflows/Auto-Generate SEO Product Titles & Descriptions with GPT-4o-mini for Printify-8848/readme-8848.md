Auto-Generate SEO Product Titles & Descriptions with GPT-4o-mini for Printify

https://n8nworkflows.xyz/workflows/auto-generate-seo-product-titles---descriptions-with-gpt-4o-mini-for-printify-8848


# Auto-Generate SEO Product Titles & Descriptions with GPT-4o-mini for Printify

### 1. Workflow Overview

This workflow automates the process of generating SEO-optimized product titles and descriptions for Printify products using the GPT-4o-mini AI model. It is designed for ecommerce sellers who want to enhance their product listings on Printify and across multiple sales channels such as Shopify, Etsy, Amazon, and TikTok Shops. The workflow retrieves product data from Printify, uses AI to generate improved product titles and descriptions based on brand guidelines and custom instructions, updates a Google Sheets document with these options, and finally updates the products on Printify with the new content.

The workflow logically decomposes into these main blocks:

- **1.1 Initialization and Brand Guidelines Setup:** Manual trigger with initial brand tone and instructions configuration.
- **1.2 Printify Data Retrieval:** Fetching shops and products data from Printify API.
- **1.3 Product Data Processing:** Splitting product list into individual items and extracting key fields.
- **1.4 Options Calculation:** Setting and calculating the number of title/description variants to generate.
- **1.5 AI Content Generation:** Calling GPT-4o-mini to generate SEO-friendly titles, descriptions, and keywords.
- **1.6 Google Sheets Integration:** Adding and updating product data and generated options in Google Sheets for tracking.
- **1.7 Conditional Product Update:** Listening to Google Sheets updates to trigger product updates on Printify.
- **1.8 Printify Product Update:** Sending the generated titles and descriptions back to Printify to update the products.

---

### 2. Block-by-Block Analysis

#### 1.1 Initialization and Brand Guidelines Setup

- **Overview:** This block initializes the workflow manually and sets brand-specific parameters and custom instructions for the AI model to tailor output content.

- **Nodes Involved:**
  - When clicking ‘Test workflow’ (Manual Trigger)
  - Brand Guidelines + Custom Instructions (Set node)
  - Sticky Note11 (Informational)

- **Node Details:**

  - **When clicking ‘Test workflow’**
    - Type: Manual trigger
    - Role: Entry point for manual executions for testing or initial runs.
    - Configuration: No parameters; simply triggers the flow.
    - Inputs: None
    - Outputs: Connects to Brand Guidelines node
    - Failure modes: None expected unless workflow is inactive

  - **Brand Guidelines + Custom Instructions**
    - Type: Set node
    - Role: Defines brand name, tone, and custom instructions for AI prompt.
    - Configuration:
      - brand_name = "AlexK1919"
      - brand_tone = "informal, instructional, trustoworthy" (note: "trustworthy" is misspelled in original)
      - custom_instructions = "re-write for the coming Christmas season"
    - Inputs: Manual Trigger node
    - Outputs: Connects to Printify - Get Shops node
    - Failure modes: None, unless variable names are misused downstream.

  - **Sticky Note11**
    - Role: Reminder to update brand guidelines before running.
    - Content: "# Update your Brand Guidelines before running this workflow\nYou can also add custom instructions for the AI node."

#### 1.2 Printify Data Retrieval

- **Overview:** Fetches Printify shops and their corresponding products to get the raw data for processing.

- **Nodes Involved:**
  - Printify - Get Shops (HTTP Request)
  - Printify - Get Products (HTTP Request)
  - Split Out (Split array node)
  - Loop Over Items (SplitInBatches for processing)
  - Sticky Note10 (Informational)

- **Node Details:**

  - **Printify - Get Shops**
    - Type: HTTP Request
    - Role: Calls Printify API endpoint to retrieve all shops linked to the account.
    - Configuration:
      - URL: https://api.printify.com/v1/shops.json
      - Authentication: HTTP Header Auth (credential named "AlexK1919 Printify Header Auth")
    - Input: Brand Guidelines node
    - Output: Connects to Printify - Get Products
    - Failure modes:
      - Auth errors if API key invalid or expired.
      - Network or API downtime.
      - Rate limiting by Printify API.

  - **Printify - Get Products**
    - Type: HTTP Request
    - Role: Retrieves all products for each shop returned by the previous node.
    - Configuration:
      - URL templated with shop id: https://api.printify.com/v1/shops/{{ $json.id }}/products.json
      - Authentication: same as above.
    - Input: Printify - Get Shops node
    - Output: Connects to Split Out
    - Failure modes: Same as above; also risk of empty product lists.

  - **Split Out**
    - Type: SplitOut
    - Role: Splits the array of products in the "data" field into individual items.
    - Configuration: Splits on "data" array field.
    - Input: Printify - Get Products node
    - Output: Connects to Loop Over Items
    - Failure modes: Malformed or missing "data" field.

  - **Loop Over Items**
    - Type: SplitInBatches
    - Role: Processes products one by one or in batches.
    - Configuration: Default batch size; processes sequentially.
    - Input: Split Out node
    - Output: Connects to Split - id, title, desc
    - Failure modes: Long list can cause delays; batch size must be tuned for rate limits.

  - **Sticky Note10**
    - Content: "# ![Printify](https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTb2gV-cjThU_5xJRxtjDx7Uh9xXCN5Uo1GGA&s)\nYou can swap out the API calls to similar services like Printful, Vistaprint, etc."

#### 1.3 Product Data Processing

- **Overview:** Extracts crucial product fields (id, title, description) and sets the number of options for AI generation.

- **Nodes Involved:**
  - Split - id, title, desc (SplitOut)
  - Number of Options (Set)
  - Calculate Options (Code)
  - If1 (If condition)
  - Sticky Note1 (Instructional)

- **Node Details:**

  - **Split - id, title, desc**
    - Type: SplitOut
    - Role: Extracts fields "id", "title", and "description" from each product item.
    - Configuration: Includes "title" and "description" fields along with "id".
    - Input: Loop Over Items node
    - Output: Connects to Number of Options node
    - Failure modes: Missing fields in product data may cause errors downstream.

  - **Number of Options**
    - Type: Set node
    - Role: Defines how many title/description options to generate per product.
    - Configuration: Sets variable "number_of_options" to string "3" by default.
    - Input: Split - id, title, desc
    - Output: Connects to Calculate Options
    - Failure modes: If "number_of_options" is non-numeric, code node might fail.

  - **Calculate Options**
    - Type: Code (JavaScript)
    - Role: Calculates the number of options for AI generation, adding 1 internally (possibly for indexing).
    - Configuration:
      ```javascript
      const inputData = $json["number_of_options"];
      const initialValue = parseInt(inputData, 10);
      const numberOfOptions = initialValue + 1;
      const result = numberOfOptions - 1;
      return {
        number_of_options: numberOfOptions,
        result,
      };
      ```
    - Input: Number of Options node
    - Output: If1 node
    - Failure modes:
      - Non-integer input causes NaN or errors.
      - Edge cases if number_of_options <= 0.

  - **If1**
    - Type: If condition
    - Role: Checks if the calculation result equals 0 to decide workflow path.
    - Condition: `{{$json.result}} == 0`
    - Input: Calculate Options node
    - Outputs:
      - True branch: loops over items (no options to generate)
      - False branch: GS - Add Product Option (proceed with generation)
    - Failure modes: Expression failures if result field missing.

  - **Sticky Note1**
    - Content: "# Set the Number of Options you'd like for the Title and Description"

#### 1.4 AI Content Generation

- **Overview:** Uses GPT-4o-mini model to generate SEO-friendly product titles, descriptions, and keywords based on the original data and brand guidelines.

- **Nodes Involved:**
  - GS - Add Product Option (Google Sheets Append)
  - Generate Title and Desc (OpenAI)
  - Update Product Option (Google Sheets AppendOrUpdate)
  - Remember Options (Set)
  - Sticky Note2 (Instructional)

- **Node Details:**

  - **GS - Add Product Option**
    - Type: Google Sheets Append
    - Role: Adds initial product processing record to the Google Sheet with status "Product Processing" and metadata.
    - Configuration:
      - Columns include xid (random string), date, time, status, and product fields (id, original title/desc, URLs).
      - Appends to specified Google Sheet and sheet.
    - Input: If1 node (false branch)
    - Output: Connects to Generate Title and Desc
    - Failure modes:
      - Google Sheets API limits or authorization errors.
      - Sheet schema mismatch.

  - **Generate Title and Desc**
    - Type: OpenAI (GPT-4o-mini)
    - Role: Generates new product title, description, and keyword using GPT-4o-mini based on input product data and brand guidelines.
    - Configuration:
      - Messages include prompts with original title/desc, instructions to humanize, brand tone, custom instructions, and output format.
      - Outputs JSON with keyword, title, and description.
    - Input: GS - Add Product Option
    - Output: Update Product Option
    - Credentials: OpenAI API key ("AlexK OpenAi Key")
    - Failure modes:
      - API quota exceeded
      - Network timeouts
      - Incorrect prompt leading to unexpected outputs
      - JSON parsing errors in response

  - **Update Product Option**
    - Type: Google Sheets AppendOrUpdate
    - Role: Updates the Google Sheet with the generated keyword, title, and description, linking back to the original product via xid.
    - Configuration:
      - Matches rows by xid.
      - Adds fields: status "Option added", keyword, product_id, generated title/desc, original title/desc.
    - Input: Generate Title and Desc
    - Output: Remember Options
    - Failure modes: Same as GS - Add Product Option

  - **Remember Options**
    - Type: Set node
    - Role: Stores calculated number_of_options for downstream use.
    - Configuration: Sets number_of_options to calculated result minus 1.
    - Input: Update Product Option
    - Output: Calculate Options (loop or final steps)
    - Failure modes: None expected.

  - **Sticky Note2**
    - Content: "# Process Title and Description Options"

#### 1.5 Conditional Product Update Trigger

- **Overview:** Listens for Google Sheets row updates indicating products are ready to be updated on Printify, then triggers the update process.

- **Nodes Involved:**
  - Google Sheets Trigger
  - If (conditional)
  - Printify - Get Shops1
  - Printify - Update Product
  - Sticky Note (informational)

- **Node Details:**

  - **Google Sheets Trigger**
    - Type: Google Sheets Trigger
    - Role: Watches the Google Sheet for updates to the "upload" column, polling every minute.
    - Configuration:
      - Triggers on row update where "upload" column changes.
      - Monitors specific Google Sheet document and sheet.
    - Output: Connects to If (conditional)
    - Failure modes: 
      - OAuth token expiry or revocation.
      - Rate limits from Google Sheets API.

  - **If**
    - Type: If condition
    - Role: Checks if the "upload" field equals "yes" to proceed with updating Printify.
    - Condition: `{{$json.upload}} == "yes"`
    - Input: Google Sheets Trigger
    - Output: True branch connects to Printify - Get Shops1
    - Failure modes: Expression failure if upload field is missing.

  - **Printify - Get Shops1**
    - Type: HTTP Request
    - Role: Retrieves shops from Printify API similarly to the earlier "Printify - Get Shops" node.
    - Configuration:
      - URL: https://api.printify.com/v1/shops.json
      - Authentication: same header auth credential
    - Input: If node (true branch)
    - Output: Connects to Printify - Update Product
    - Failure modes: Same as previous Printify API calls.

  - **Printify - Update Product**
    - Type: HTTP Request (PUT)
    - Role: Updates a product on Printify with new title and description from Google Sheets.
    - Configuration:
      - URL templated with shop id and product_id from Google Sheets row.
      - Method: PUT
      - Body: JSON including updated "title" and "description" fields.
      - Authentication: same header auth.
    - Input: Printify - Get Shops1
    - Output: None (end of flow)
    - Failure modes:
      - API errors if product_id or shop_id invalid.
      - Network failures.
      - Rate limits or authorization issues.

  - **Sticky Note**
    - Content: "# Update Title and Description"

#### 1.6 Miscellaneous Nodes

- **Calculator** and **Wikipedia** nodes (Langchain tools) are present but not connected to main workflow branches. Possibly placeholders or future extension for AI enrichment.

- **Sticky Note9** provides author info and external links:
  - Link to Alex Kim’s profile: https://beacons.ai/alexk1919
  - Links to products used: OpenAI, Printify
  - Link to Google Sheets template: https://docs.google.com/spreadsheets/d/12Y7M5YSUW1e8UUOjupzctOrEtgMK-0Wb32zcVpNcfjk/edit?gid=0#gid=0

---

### 3. Summary Table

| Node Name                    | Node Type                       | Functional Role                                   | Input Node(s)                  | Output Node(s)                     | Sticky Note                                                                                     |
|------------------------------|--------------------------------|--------------------------------------------------|--------------------------------|----------------------------------|------------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’ | Manual Trigger                 | Entry point for manual workflow start            | None                           | Brand Guidelines + Custom Instructions |                                                                                                |
| Brand Guidelines + Custom Instructions | Set                      | Sets brand name, tone, and AI instructions       | When clicking ‘Test workflow’  | Printify - Get Shops              | # Update your Brand Guidelines before running this workflow\nYou can also add custom instructions for the AI node. |
| Printify - Get Shops          | HTTP Request                   | Retrieves Printify shops                          | Brand Guidelines + Custom Instructions | Printify - Get Products          |                                                                                                |
| Printify - Get Products       | HTTP Request                   | Retrieves products for each shop                  | Printify - Get Shops           | Split Out                       |                                                                                                |
| Split Out                    | SplitOut                      | Splits product array into individual product items | Printify - Get Products        | Loop Over Items                  |                                                                                                |
| Loop Over Items              | SplitInBatches                | Processes products in batches                      | Split Out                     | Split - id, title, desc          |                                                                                                |
| Split - id, title, desc       | SplitOut                      | Extracts id, title, description fields            | Loop Over Items                | Number of Options                |                                                                                                |
| Number of Options             | Set                           | Sets how many title/desc options to generate      | Split - id, title, desc        | Calculate Options               | # Set the Number of Options you'd like for the Title and Description                            |
| Calculate Options             | Code                          | Calculates adjusted number of options             | Number of Options              | If1                            |                                                                                                |
| If1                          | If                            | Branches workflow based on number of options      | Calculate Options              | Loop Over Items (true), GS - Add Product Option (false) |                                                                                                |
| GS - Add Product Option       | Google Sheets Append          | Logs product processing start in Google Sheets   | If1 (false branch)             | Generate Title and Desc         |                                                                                                |
| Generate Title and Desc       | OpenAI (GPT-4o-mini)          | Generates SEO product titles and descriptions     | GS - Add Product Option        | Update Product Option           |                                                                                                |
| Update Product Option         | Google Sheets AppendOrUpdate  | Updates Google Sheets with AI-generated content  | Generate Title and Desc        | Remember Options                |                                                                                                |
| Remember Options             | Set                           | Stores number_of_options for later use             | Update Product Option          | Calculate Options (loop)        |                                                                                                |
| Google Sheets Trigger         | Google Sheets Trigger         | Watches for "upload" flag to update Printify      | None                          | If                            |                                                                                                |
| If                           | If                            | Checks if Google Sheets row has upload == "yes"   | Google Sheets Trigger          | Printify - Get Shops1           |                                                                                                |
| Printify - Get Shops1         | HTTP Request                   | Retrieves shops for product update                 | If                           | Printify - Update Product       |                                                                                                |
| Printify - Update Product     | HTTP Request (PUT)            | Updates product with new title and description     | Printify - Get Shops1          | None                          | # Update Title and Description                                                                |
| Calculator                   | Langchain Tool (Calculator)   | Unused AI tool node                                | None                          | None                          |                                                                                                |
| Wikipedia                    | Langchain Tool (Wikipedia)    | Unused AI tool node                                | None                          | Generate Title and Desc (ai_tool) |                                                                                                |
| Sticky Note9                 | StickyNote                    | Author info, branding, and reference links        | None                          | None                          | # AlexK1919 \n![Alex Kim](https://media.licdn.com/dms/image/v2/D5603AQFOYMkqCPl6Sw/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1718309808352?e=1736985600&v=beta&t=pQKm7lQfUU1ytuC2Gq1PRxNY-XmROFWbo-BjzUPxWOs)\n\n#### I’m Alex Kim, an AI-Native Workflow Automation Architect Building Solutions to Optimize your Personal and Professional Life.\n\n\n### About Me\nhttps://beacons.ai/alexk1919\n\n### Products Used \n[OpenAI](https://openai.com)\n[Printify](https://printify.com/)\n\n[Google Sheets Template for this Workflow](https://docs.google.com/spreadsheets/d/12Y7M5YSUW1e8UUOjupzctOrEtgMK-0Wb32zcVpNcfjk/edit?gid=0#gid=0) |
| Sticky Note10                | StickyNote                    | Notes about Printify API and alternatives          | None                          | None                          | # ![Printify](https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTb2gV-cjThU_5xJRxtjDx7Uh9xXCN5Uo1GGA&s)\nYou can swap out the API calls to similar services like Printful, Vistaprint, etc. |
| Sticky Note1                 | StickyNote                    | Instruction on setting number of options           | None                          | None                          | # Set the Number of Options you'd like for the Title and Description                           |
| Sticky Note2                 | StickyNote                    | Instruction on processing title and description options | None                          | None                          | # Process Title and Description Options                                                      |
| Sticky Note                  | StickyNote                    | Instruction about updating title and description   | None                          | None                          | # Update Title and Description                                                               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Manual Trigger node** named "When clicking ‘Test workflow’" with no parameters.

2. **Add a Set node** named "Brand Guidelines + Custom Instructions" connected from the Manual Trigger. Configure:
   - `brand_name` = "AlexK1919"
   - `brand_tone` = "informal, instructional, trustoworthy"
   - `custom_instructions` = "re-write for the coming Christmas season"

3. **Add HTTP Request node** named "Printify - Get Shops":
   - URL: `https://api.printify.com/v1/shops.json`
   - Authentication: HTTP Header Auth credential (create and configure with Printify API key)
   - Connect from "Brand Guidelines + Custom Instructions"

4. **Add HTTP Request node** named "Printify - Get Products":
   - URL: `https://api.printify.com/v1/shops/{{ $json.id }}/products.json`
   - Authentication: same HTTP Header Auth credential
   - Connect from "Printify - Get Shops"

5. **Add SplitOut node** named "Split Out":
   - Field to split out: `data`
   - Connect from "Printify - Get Products"

6. **Add SplitInBatches node** named "Loop Over Items":
   - Default batch options
   - Connect from "Split Out"

7. **Add SplitOut node** named "Split - id, title, desc":
   - Field to split out: `id`
   - Include fields: `title`, `description`
   - Connect from "Loop Over Items"

8. **Add Set node** named "Number of Options":
   - Assign `number_of_options` = "3" (string)
   - Connect from "Split - id, title, desc"

9. **Add Code node** named "Calculate Options":
   - Mode: runOnceForEachItem
   - JavaScript code to parse `number_of_options`, add 1, calculate result as described above
   - Connect from "Number of Options"

10. **Add If node** named "If1":
    - Condition: Check if `{{$json.result}} == 0`
    - Connect from "Calculate Options"
    - True branch connects back to "Loop Over Items" (to skip generation)
    - False branch continues to next step

11. **Add Google Sheets Append node** named "GS - Add Product Option":
    - Configure to append rows to Google Sheet with columns:
      - xid (random string), date (ISO date), time (24h time), status ("Product Processing"), product_id, original_title, product_desc, product_url, image_url, video_url
    - Connect from If1 (false branch)

12. **Add OpenAI node** named "Generate Title and Desc":
    - Model: gpt-4o-mini
    - Messages: Prompt with original title and description, instructions to generate keyword, title, description, brand tone, and custom instructions from Set node fields
    - JSON output enabled
    - Credentials: OpenAI API key
    - Connect from "GS - Add Product Option"

13. **Add Google Sheets AppendOrUpdate node** named "Update Product Option":
    - Configure to append or update rows matching `xid`
    - Update fields: status ("Option added"), keyword, product_id, product_desc, original_desc, product_title, original_title
    - Connect from "Generate Title and Desc"

14. **Add Set node** named "Remember Options":
    - Assign `number_of_options` = `{{$('Calculate Options').item.json.result - 1}}`
    - Connect from "Update Product Option"

15. Connect "Remember Options" back to "Calculate Options" to loop until all options processed.

16. **Add Google Sheets Trigger node** named "Google Sheets Trigger":
    - Trigger on row update in same Google Sheet, watching column "upload"
    - Poll every minute
    - Credentials: Google Sheets OAuth2 (configured)
    - Separate branch in workflow (parallel to main flow)

17. **Add If node** named "If":
    - Condition: Check if `upload == "yes"`
    - Connect from Google Sheets Trigger
    - True branch continues

18. **Add HTTP Request node** named "Printify - Get Shops1":
    - Same configuration as "Printify - Get Shops"
    - Connect from If (true branch)

19. **Add HTTP Request node** named "Printify - Update Product":
    - Method: PUT
    - URL: `https://api.printify.com/v1/shops/{{ $json.id }}/products/{{ $('Google Sheets Trigger').item.json.product_id }}.json`
    - Body Parameters:
      - title: `{{ $('Google Sheets Trigger').item.json.product_title }}`
      - description: `{{ $('Google Sheets Trigger').item.json.product_desc }}`
    - Authentication: Same HTTP Header Auth
    - Connect from "Printify - Get Shops1"

20. **Add Sticky Notes** for documentation and instructions as per the original workflow content.

21. **(Optional) Add Langchain Calculator and Wikipedia nodes** for future AI integration (currently unused).

22. Test the workflow end-to-end, ensure credentials are set, API keys valid, and Google Sheets schema matches expected columns.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                        | Context or Link                                                                                                         |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------|
| # AlexK1919 \n![Alex Kim](https://media.licdn.com/dms/image/v2/D5603AQFOYMkqCPl6Sw/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1718309808352?e=1736985600&v=beta&t=pQKm7lQfUU1ytuC2Gq1PRxNY-XmROFWbo-BjzUPxWOs)\n\n#### I’m Alex Kim, an AI-Native Workflow Automation Architect Building Solutions to Optimize your Personal and Professional Life.\n\n### About Me\nhttps://beacons.ai/alexk1919\n\n### Products Used \n[OpenAI](https://openai.com)\n[Printify](https://printify.com/)\n\n[Google Sheets Template for this Workflow](https://docs.google.com/spreadsheets/d/12Y7M5YSUW1e8UUOjupzctOrEtgMK-0Wb32zcVpNcfjk/edit?gid=0#gid=0) | Author branding, product references, and template link.                                                                 |
| # ![Printify](https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTb2gV-cjThU_5xJRxtjDx7Uh9xXCN5Uo1GGA&s)\nYou can swap out the API calls to similar services like Printful, Vistaprint, etc.                                                                                                                                              | Suggestion to adapt workflow to other print-on-demand platforms.                                                       |
| # Update your Brand Guidelines before running this workflow\nYou can also add custom instructions for the AI node.                                                                                                                                                                                                                 | Reminder to customize brand and AI instructions per run.                                                               |
| # Set the Number of Options you'd like for the Title and Description                                                                                                                                                                                                                                                                | Instruction to user on configuring how many AI-generated options to produce per product.                                |
| # Process Title and Description Options                                                                                                                                                                                                                                                                                            | Marks the block handling AI content generation and Google Sheets integration.                                           |
| # Update Title and Description                                                                                                                                                                                                                                                                                                     | Marks the block responsible for updating Printify products with new content.                                            |

---

**Disclaimer:**  
The content provided originates exclusively from an automated workflow designed with n8n, an integration and automation platform. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All handled data is legal and publicly accessible.