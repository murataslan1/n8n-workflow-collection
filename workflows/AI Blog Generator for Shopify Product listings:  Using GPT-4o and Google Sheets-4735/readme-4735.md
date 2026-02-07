AI Blog Generator for Shopify Product listings:  Using GPT-4o and Google Sheets

https://n8nworkflows.xyz/workflows/ai-blog-generator-for-shopify-product-listings---using-gpt-4o-and-google-sheets-4735


# AI Blog Generator for Shopify Product listings:  Using GPT-4o and Google Sheets

### 1. Workflow Overview

This workflow automates the creation of SEO-friendly blog posts on Shopify for product listings by leveraging AI and Google Sheets as a tracking system. It fetches all Shopify products and their images, extracts nutritional facts via OCR from product images using GPT-4o, and generates structured blog content with AI assistance. The workflow then creates blogs and articles on Shopify via API calls and logs the process and outcomes in a Google Sheet for monitoring and retry logic.

Logical blocks:

- **1.1 Input Reception and Shopify Data Fetching**: Manual trigger initiates the workflow, fetches all products from Shopify, splits out product images for processing.
- **1.2 Nutritional Data Extraction (OCR)**: Uses OpenAI image analysis to extract nutritional facts from product images.
- **1.3 Conditional Processing**: Checks if nutritional info extraction returned valid data or null.
- **1.4 Product Data Preparation**: Sets and formats main product information for downstream AI processing.
- **1.5 AI Blog Content Generation and Posting Agent**: Reads Google Sheets to check existing blog status, generates blog content using GPT-4o-mini, posts blog and article via Shopify API, handles retry logic.
- **1.6 Google Sheets Logging and Update**: Reads from and updates Google Sheets with blog creation status, errors, and retry flags.
- **1.7 Memory Buffer for AI Agent Context**: Manages session memory for consistent AI generation across workflow runs.
- **1.8 Notes and Metadata**: Sticky notes for documentation, author credits, and workflow explanation.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception and Shopify Data Fetching

**Overview:**  
This block starts the workflow manually, retrieves all Shopify products using API with access token authentication, and extracts product images for further processing.

**Nodes Involved:**  
- When clicking ‘Test workflow’  
- Shopify  
- Split Out  
- Sticky Note (Get Products)  
- Sticky Note (Fetches Product Image url)

**Node Details:**

- **When clicking ‘Test workflow’**  
  - *Type:* Manual Trigger  
  - *Role:* Starts the workflow on user action.  
  - *Config:* Default manual trigger, no parameters.  
  - *Connections:* Output to Shopify node.  
  - *Failures:* None expected.  

- **Shopify**  
  - *Type:* Shopify API Node  
  - *Role:* Retrieves all products from Shopify store.  
  - *Config:* Resource = product, Operation = getAll, Return all products, Authentication = Access Token.  
  - *Credentials:* Shopify Access Token account.  
  - *Input:* From manual trigger.  
  - *Output:* JSON array of all products with full details.  
  - *Failures:* API rate limiting, invalid token, network issues.  
  - *Sticky Note:* "Get Products - It get all the product details from the Shopify store."  

- **Split Out**  
  - *Type:* Split Out  
  - *Role:* Splits each product’s images array into individual items for separate processing.  
  - *Config:* Field to split out = images.  
  - *Input:* Products JSON array from Shopify node.  
  - *Output:* Individual image objects per product.  
  - *Failures:* If images field missing or empty, no output.  
  - *Sticky Note:* "Fetches Product Image url - Each Product can have multiple images it fetches image url for further step."  

---

#### 1.2 Nutritional Data Extraction (OCR)

**Overview:**  
Processes each product image URL through OpenAI's GPT-4o model to extract nutritional facts using OCR and image analysis.

**Nodes Involved:**  
- OpenAI  
- Sticky Note (OCR: Collects Nutrients Facts)

**Node Details:**

- **OpenAI**  
  - *Type:* LangChain OpenAI Image Analysis Node  
  - *Role:* Analyzes image URL to extract nutritional information in JSON or returns null if none detected.  
  - *Config:*  
    - Model: chatgpt-4o-latest  
    - Text prompt: Detailed instructions to extract nutrition facts only if clear and complete; otherwise return null.  
    - Input resource: image URLs from product images.  
  - *Credentials:* OpenAI API account.  
  - *Input:* Image URL from Split Out node.  
  - *Output:* JSON with nutrients or null string.  
  - *Failures:* API failures, image URL invalid, rate limits, OCR misinterpretation.  
  - *Sticky Note:* "OCR: Collects Nutrients Facts - It collects Nutrients information from the product image and outputs in json format and send along the true branch of the if node. If no info, returns null."  

---

#### 1.3 Conditional Processing

**Overview:**  
Determines whether the extracted nutritional content is valid (non-null) or not, to decide whether to proceed with blog generation or skip.

**Nodes Involved:**  
- If  
- No Operation, do nothing

**Node Details:**

- **If**  
  - *Type:* If Condition  
  - *Role:* Checks if the OpenAI node output content is not equal to "null".  
  - *Config:* Condition: $json.content != "null" (strict string comparison)  
  - *Input:* OpenAI node output.  
  - *Output:* True branch to Main Product info; False branch to No Operation node.  
  - *Failures:* Expression evaluation errors if content missing.  

- **No Operation, do nothing**  
  - *Type:* No Operation  
  - *Role:* Ends processing for images where no valid nutritional info was found.  
  - *Config:* Default no-op node.  
  - *Input:* False branch from If node.  
  - *Output:* None (terminal for this path).  

---

#### 1.4 Product Data Preparation

**Overview:**  
Assigns and formats the main product information including title, id, and body_html for use in subsequent AI blog generation.

**Nodes Involved:**  
- Main Product info  
- Sticky Note (Shopify Products Blog Mechanism)

**Node Details:**

- **Main Product info**  
  - *Type:* Set Node  
  - *Role:* Extracts and prepares product fields title, id, and body_html from Shopify product JSON.  
  - *Config:* Assigns:  
    - title = Shopify product title  
    - id = Shopify product id  
    - body_html = Shopify product body_html  
  - *Input:* True branch from If node.  
  - *Output:* JSON with selected product fields plus all other fields.  
  - *Failures:* Missing product fields could cause empty or null values.  
  - *Sticky Note:* Detailed explanation of Shopify blog mechanism including blog creation, retry logic, and sheet update workflow.  

---

#### 1.5 AI Blog Content Generation and Posting Agent

**Overview:**  
This agent node orchestrates the entire blog creation process: reading Google Sheets for current blog status, generating SEO-friendly blog content using GPT-4o-mini, posting blogs and articles to Shopify via HTTP API calls, and managing retry/error logic.

**Nodes Involved:**  
- AI Blog Poster  
- Read Sheet  
- Update Sheet  
- Create Blog id  
- Create Articles  
- Simple Memory  
- OpenAI Chat Model

**Node Details:**

- **AI Blog Poster**  
  - *Type:* LangChain Agent  
  - *Role:* Main orchestrator AI agent for generating blog content and posting it.  
  - *Config:*  
    - Text input template: includes product id, title, description HTML, nutrition facts JSON.  
    - System prompt: detailed step-by-step instructions for reading Google Sheets, generating blog, posting blogs/articles, updating sheet, and retry logic.  
    - Model: gpt-4o-mini  
  - *Input:* Product info from Main Product info, Google Sheets data, previous AI outputs.  
  - *Output:* Commands to HTTP nodes and sheet update nodes.  
  - *Failures:* AI generation errors, API call failures, sheet access errors, retry logic misfires.  
  - *Sub-workflow:* Integrates with Read Sheet, Update Sheet, Create Blog id, Create Articles, Simple Memory, and OpenAI Chat Model nodes.  

- **Read Sheet**  
  - *Type:* Google Sheets Tool  
  - *Role:* Reads tracking Google Sheet to determine blog creation status for each product.  
  - *Config:* Document and sheet ID configured, reading from gid=0 sheet.  
  - *Credentials:* Google Sheets OAuth2 API account.  
  - *Output:* Sheet rows with product IDs, retry flags, error messages.  
  - *Failures:* OAuth token expiry, sheet not found, permission errors.  

- **Update Sheet**  
  - *Type:* Google Sheets Tool  
  - *Role:* Appends or updates the Google Sheet with blog creation status, retry flags, errors, timestamps.  
  - *Config:* Mapping of columns including Product Id, Blog title, Blog url, Retry, Error, Timestamp, etc. Match on Product Id for update or append.  
  - *Credentials:* Google Sheets OAuth2 API account.  
  - *Failures:* Same as Read Sheet, plus mapping errors, data type mismatches.  

- **Create Blog id**  
  - *Type:* HTTP Request Tool  
  - *Role:* Calls Shopify API POST /blogs.json to create a new blog and obtain blog ID.  
  - *Config:* URL fixed, JSON body generated by AI agent, authentication with Shopify Access Token.  
  - *Failures:* API rate limits, invalid JSON, auth failures.  

- **Create Articles**  
  - *Type:* HTTP Request Tool  
  - *Role:* Calls Shopify API POST /blogs/{blog.id}/articles.json to create blog articles under created blog.  
  - *Config:* URL and JSON body dynamically set by AI agent, authentication with Shopify Access Token.  
  - *Failures:* Same as Create Blog id, plus invalid blog id or article data.  

- **Simple Memory**  
  - *Type:* LangChain Memory Buffer Window  
  - *Role:* Maintains a context window (last 20 interactions) keyed by product id to provide conversational memory for AI agent.  
  - *Config:* Session key = product id from Main Product info.  
  - *Failures:* Memory overflow, session key missing.  

- **OpenAI Chat Model**  
  - *Type:* LangChain OpenAI Chat Model  
  - *Role:* Provides AI language model capabilities (gpt-4o-mini) for the agent.  
  - *Config:* Model = gpt-4o-mini, default options.  
  - *Failures:* API limits, rate limiting, malformed prompts.  

---

#### 1.6 Google Sheets Logging and Update

**Overview:**  
Reads and writes to Google Sheets to track the blog creation progress, errors, retries, and blog URLs, providing a persistent state for the workflow and retry control.

**Nodes Involved:**  
- Read Sheet  
- Update Sheet

*(Already detailed under 1.5)*

---

#### 1.7 Memory Buffer for AI Agent Context

**Overview:**  
Maintains recent conversational context for the AI Blog Poster agent to improve generation consistency per product.

**Nodes Involved:**  
- Simple Memory

*(Already detailed under 1.5)*

---

#### 1.8 Notes and Metadata

**Overview:**  
Provides inline documentation and author credits for workflow understanding and attribution.

**Nodes Involved:**  
- Sticky Note  
- Sticky Note1  
- Sticky Note2  
- Sticky Note3  
- Sticky Note4

**Node Details:**

- **Sticky Note** (Get Products)  
  - Content: Describes Shopify product retrieval purpose.  

- **Sticky Note1** (Fetches Product Image url)  
  - Content: Explains image extraction for OCR step.  

- **Sticky Note2** (OCR: Collects Nutrients Facts)  
  - Content: Details AI image analysis for nutritional facts extraction.  

- **Sticky Note3** (Shopify Products Blog Mechanism)  
  - Content: Explains blog creation, retry logic, and Google Sheets integration.  

- **Sticky Note4** (Author)  
  - Content: Author bio and contact link: https://kumarshivam.link  

---

### 3. Summary Table

| Node Name               | Node Type                              | Functional Role                                  | Input Node(s)                    | Output Node(s)                         | Sticky Note                                                                                                  |
|-------------------------|--------------------------------------|-------------------------------------------------|---------------------------------|---------------------------------------|--------------------------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’ | Manual Trigger                      | Starts workflow on user demand                    | -                               | Shopify                              |                                                                                                              |
| Shopify                 | Shopify API                          | Fetches all products from Shopify store          | When clicking ‘Test workflow’    | Split Out                           | Get Products: It get all the product details from the Shopify store                                          |
| Split Out               | Split Out                           | Splits product images array into individual items| Shopify                        | OpenAI                             | Fetches Product Image url: Each Product can have multiple images it fetches image url for further step.       |
| OpenAI                  | LangChain OpenAI Image Analysis      | Extracts nutritional facts from product images   | Split Out                      | If                                | OCR: Collects Nutrients Facts: Extracts nutrients info in JSON or null if none                                |
| If                      | If Condition                       | Checks if nutritional data is valid (not null)   | OpenAI                        | Main Product info (true), No Operation (false) |                                                                                                              |
| No Operation, do nothing | No Operation                      | Ends flow if no valid nutritional data            | If (false branch)               | -                                 |                                                                                                              |
| Main Product info       | Set Node                            | Prepares main product fields for AI                | If (true branch)                | AI Blog Poster                     | Shopify Products Blog Mechanism: Explains blog creation, retry logic, and Google Sheets integration           |
| AI Blog Poster          | LangChain Agent                    | Generates blog content, posts blogs/articles, handles retries | Main Product info, Read Sheet, Update Sheet, Create Blog id, Create Articles, Simple Memory, OpenAI Chat Model | -                           |                                                                                                              |
| Read Sheet              | Google Sheets                      | Reads blog tracking sheet for existing blog status| AI Blog Poster (ai_tool input) | AI Blog Poster (ai_tool output)     |                                                                                                              |
| Update Sheet            | Google Sheets                      | Logs blog creation status, errors, and retries    | AI Blog Poster (ai_tool input) | AI Blog Poster (ai_tool output)     |                                                                                                              |
| Create Blog id          | HTTP Request                      | Creates new blog via Shopify API                   | AI Blog Poster (ai_tool input) | AI Blog Poster (ai_tool output)     |                                                                                                              |
| Create Articles         | HTTP Request                      | Posts blog article under created blog              | AI Blog Poster (ai_tool input) | AI Blog Poster (ai_tool output)     |                                                                                                              |
| Simple Memory           | LangChain Memory Buffer Window       | Maintains AI session memory per product            | AI Blog Poster (ai_memory input) | AI Blog Poster (ai_memory output)   |                                                                                                              |
| OpenAI Chat Model       | LangChain OpenAI Chat Model          | Provides GPT-4o-mini language model for AI agent  | AI Blog Poster (ai_languageModel input) | AI Blog Poster (ai_languageModel output) |                                                                                                              |
| Sticky Note             | Sticky Note                       | Documentation: Get Products                         | -                               | -                                 | Get Products: It get all the product details from the Shopify store                                          |
| Sticky Note1            | Sticky Note                       | Documentation: Fetches product image URLs          | -                               | -                                 | Fetches Product Image url: Each Product can have multiple images it fetches image url for further step.       |
| Sticky Note2            | Sticky Note                       | Documentation: OCR nutritional facts extraction    | -                               | -                                 | OCR: Collects Nutrients Facts: Extracts nutrients info in JSON or null if none                                |
| Sticky Note3            | Sticky Note                       | Documentation: Shopify blog creation and retry logic| -                               | -                                 | Shopify Products Blog Mechanism: Explains blog creation, retry logic, and Google Sheets integration           |
| Sticky Note4            | Sticky Note                       | Author credit and contact                           | -                               | -                                 | Author: Kumar Shivam, Automation specialist - Contact: https://kumarshivam.link                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Type: Manual Trigger  
   - Purpose: Start workflow manually.  

2. **Create Shopify Node**  
   - Type: Shopify  
   - Resource: product  
   - Operation: getAll  
   - Return All: true  
   - Authentication: Shopify Access Token OAuth2 or Access Token  
   - Credentials: Provide Shopify Access Token API credentials.  
   - Connect manual trigger output to this node.  

3. **Create Split Out Node**  
   - Type: Split Out  
   - Field to Split Out: images (from Shopify product JSON)  
   - Connect Shopify node output to this node.  

4. **Create OpenAI Image Analysis Node**  
   - Type: LangChain OpenAI (OpenAI image analysis)  
   - Model: chatgpt-4o-latest  
   - Input: Image URLs from Split Out node (expression: `{{$json.src}}`)  
   - Text prompt: Provide detailed OCR prompt instructing to extract nutritional facts exactly or return null if none.  
   - Credentials: OpenAI API credentials.  
   - Connect Split Out output to this node.  

5. **Create If Node**  
   - Type: If Node  
   - Condition: Check if `$json.content` !== "null" (string)  
   - Connect OpenAI output to this node.  

6. **Create No Operation Node**  
   - Type: No Operation  
   - Connect If node false branch to this node (ends flow for null nutrition data).  

7. **Create Set Node (Main Product info)**  
   - Type: Set  
   - Assignments:  
     - title = expression: `{{$node["Shopify"].item.json.title}}`  
     - id = expression: `{{$node["Shopify"].item.json.id}}`  
     - body_html = expression: `{{$node["Shopify"].item.json.body_html}}`  
   - Connect If node true branch to this node.  

8. **Create Read Sheet Node**  
   - Type: Google Sheets Tool  
   - Document ID: Your Google Sheet ID containing blog tracking data  
   - Sheet Name: gid=0 or appropriate sheet  
   - Credentials: Google Sheets OAuth2 account  
   - Connect AI Blog Poster node input to this node (see next step).  

9. **Create Update Sheet Node**  
   - Type: Google Sheets Tool  
   - Document ID and Sheet Name same as Read Sheet  
   - Operation: appendOrUpdate  
   - Matching Columns: Product Id  
   - Map columns: Timestamp, Product Id, Product Name, Blog Title, Blog URL, Blog HTML, Retry, Error  
   - Connect AI Blog Poster node output to this node.  

10. **Create HTTP Request Tool Node (Create Blog id)**  
    - Type: HTTP Request  
    - Method: POST  
    - URL: Shopify Admin API endpoint for blogs creation (e.g., `https://yourshop.myshopify.com/admin/api/2024-01/blogs.json`)  
    - Authentication: Shopify Access Token  
    - Body: JSON with blog title (to be set dynamically by AI agent).  
    - Connect AI Blog Poster node output to this node.  

11. **Create HTTP Request Tool Node (Create Articles)**  
    - Type: HTTP Request  
    - Method: POST  
    - URL: Shopify Admin API endpoint for articles (e.g., `https://yourshop.myshopify.com/admin/api/2024-01/blogs/{{blog.id}}/articles.json`)  
    - Authentication: Shopify Access Token  
    - Body: JSON with article title, HTML body, tags, published flag (dynamic from AI agent).  
    - Connect AI Blog Poster node output to this node.  

12. **Create LangChain Memory Buffer Window Node (Simple Memory)**  
    - Session Key: Expression: `{{$node["Main Product info"].item.json.id}}`  
    - Context Window Length: 20  
    - Connect AI Blog Poster ai_memory input to this node.  

13. **Create LangChain OpenAI Chat Model Node (OpenAI Chat Model)**  
    - Model: gpt-4o-mini  
    - Connect AI Blog Poster ai_languageModel input to this node.  

14. **Create LangChain Agent Node (AI Blog Poster)**  
    - Input Text Template: Include product id, title, description html, and nutrition facts from previous nodes.  
    - System Message: Detailed instructions on reading Google Sheets, checking retry flags, generating SEO blog content, posting via Shopify API, updating sheet, and retry logic.  
    - Model: gpt-4o-mini (or as above)  
    - Connect inputs:  
      - From Main Product info (main)  
      - From Read Sheet (ai_tool)  
      - From Update Sheet (ai_tool)  
      - From Create Blog id (ai_tool)  
      - From Create Articles (ai_tool)  
      - From Simple Memory (ai_memory)  
      - From OpenAI Chat Model (ai_languageModel)  

15. **Connect nodes according to the flow described in the workflow connections:**  
    - Manual Trigger → Shopify → Split Out → OpenAI → If → (true) Main Product info → AI Blog Poster  
    - AI Blog Poster interacts with Read Sheet, Update Sheet, Create Blog id, Create Articles, Simple Memory, OpenAI Chat Model nodes.  
    - If false branch → No Operation node (ends that path).

16. **Add sticky notes for documentation as per the original workflow.**

---

### 5. General Notes & Resources

| Note Content                                                                                                          | Context or Link                                                |
|-----------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------|
| Workflow uses GPT-4o and GPT-4o-mini models for image OCR and blog content generation respectively.                  | n8n LangChain nodes with OpenAI API                            |
| Google Sheets used as a persistent tracking system for blog creation status, errors, and retry flags.                 | Google Sheets Tool node with OAuth2 credentials                |
| Retry logic strictly controlled based on "Retry" column in Google Sheet; errors logged with detailed messages.       | Embedded in AI Blog Poster agent system prompt                 |
| Author: Kumar Shivam, Automation Specialist. Contact: https://kumarshivam.link                                        | Sticky Note4                                                   |
| Shopify API endpoints used for blog and article creation according to Shopify Admin API 2024-01 version.               | HTTP Request Tool nodes                                         |
| Important: Ensure correct OAuth2 credentials for Shopify and Google Sheets for seamless operation.                    | Credentials configuration                                      |
| Nutritional facts extraction only proceeds if clear tables are detected; otherwise, no blog content is generated.    | OpenAI node prompt and If node condition                        |

---

**Disclaimer:** The provided text is exclusively derived from an automated n8n workflow. It complies with all content policies and contains no illicit or protected material. All data processed are legal and public.