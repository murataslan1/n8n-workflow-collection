Auto-Generate SEO Meta Descriptions & Keywords for Magento 2 with GPT-4.1 & LangChain

https://n8nworkflows.xyz/workflows/auto-generate-seo-meta-descriptions---keywords-for-magento-2-with-gpt-4-1---langchain-6654


# Auto-Generate SEO Meta Descriptions & Keywords for Magento 2 with GPT-4.1 & LangChain

### 1. Workflow Overview

This workflow automates the generation of SEO meta descriptions and keywords for Magento 2 products using GPT-4.1 and LangChain integration within n8n. It targets e-commerce merchants or developers who want to enrich their Magento 2 product listings automatically with AI-generated SEO metadata based on product data.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Triggered by a web form submission, capturing product SKU input.
- **1.2 Product Data Retrieval and Validation:** Requests product details from Magento 2 via SKU and checks SKU existence.
- **1.3 AI Processing:** Uses LangChain and OpenAI GPT-4.1 models to generate SEO meta description and keywords based on the product data.
- **1.4 Meta Data Update:** Sends the generated SEO metadata back to Magento 2 to update the product.
- **1.5 Auxiliary / Utility Nodes:** Includes code processing and optional SerpAPI integration (disabled), plus output parsing.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block captures the product SKU input from a user via a web form submission, initiating the workflow.

- **Nodes Involved:**  
  - On form submission

- **Node Details:**

  - **On form submission**  
    - Type: `Form Trigger` (Webhook-based)  
    - Role: Entry point; listens for form data submission to trigger the workflow.  
    - Configuration: Default webhook ID set, no additional parameters configured.  
    - Inputs: External HTTP form submission containing at least a SKU field.  
    - Outputs: Passes form data downstream (likely includes SKU).  
    - Failure Modes: Missing or malformed submission, timeout on webhook response.  
    - Version: 2.2  

---

#### 2.2 Product Data Retrieval and Validation

- **Overview:**  
  Retrieves product details from Magento 2 API by SKU and checks if the product exists before further processing.

- **Nodes Involved:**  
  - Get Product By SKU  
  - Checks If SKU exists

- **Node Details:**

  - **Get Product By SKU**  
    - Type: HTTP Request  
    - Role: Queries Magento 2 API to fetch product information using the SKU from form input.  
    - Configuration: Unspecified in JSON but typically includes Magento 2 REST API endpoint with SKU parameter, authenticated request (credentials not shown).  
    - Inputs: SKU from the form submission node.  
    - Outputs: Product data JSON or error response.  
    - Failure Modes: HTTP errors (401 Unauthorized, 404 Not Found if SKU invalid), network timeouts, malformed SKU input.  
    - Version: 4.2  

  - **Checks If SKU exists**  
    - Type: If Condition  
    - Role: Validates if product data was returned by checking presence or validity of SKU or product data.  
    - Configuration: Condition likely checks if product data is non-empty or if HTTP response status is 200.  
    - Inputs: Output from Get Product By SKU.  
    - Outputs:  
      - If true (SKU exists): triggers next block to process AI generation.  
      - If false: workflow halts or skips AI processing.  
    - Failure Modes: Incorrect condition expression, unexpected API response format.  
    - Version: 2.2  

---

#### 2.3 AI Processing

- **Overview:**  
  Core logic where the LangChain AI agent utilizes GPT-4.1 to generate SEO meta descriptions and keywords based on product data.

- **Nodes Involved:**  
  - Code  
  - AI Meta Agent  
  - OpenAI Chat Model1  
  - Structured Output Parser  
  - SerpAPI (disabled)

- **Node Details:**

  - **Code**  
    - Type: Code (JavaScript)  
    - Role: Prepares or transforms product data input for the AI agent; could format prompts or parse inputs.  
    - Configuration: Custom JavaScript code (not detailed) to shape data for LangChain agent.  
    - Inputs: Product data after SKU validation.  
    - Outputs: Formatted data for AI Meta Agent.  
    - Failure Modes: Runtime errors in code, reference errors, invalid output format.  
    - Version: 2  

  - **AI Meta Agent**  
    - Type: LangChain Agent Node  
    - Role: Orchestrates the AI processing workflow, integrating with language models and tools to generate SEO metadata.  
    - Configuration: Configured to retry on failure, uses attached AI language model and output parser nodes.  
    - Inputs: Receives formatted input from Code node and connects to OpenAI Chat Model and Structured Output Parser.  
    - Outputs: AI-generated SEO metadata structured output.  
    - Failure Modes: API key or authentication errors with OpenAI, timeout or rate limiting, parsing errors, retry logic.  
    - Version: 1.7  

  - **OpenAI Chat Model1**  
    - Type: OpenAI GPT Chat Model Node (LangChain)  
    - Role: Provides the GPT-4.1 language model interface for text generation tasks.  
    - Configuration: Uses OpenAI credentials, set for GPT-4.1 or similar, configured for chat completions.  
    - Inputs: Passes prompts from AI Meta Agent.  
    - Outputs: Text completion responses for SEO metadata generation.  
    - Failure Modes: Authentication failure, quota exceeded, network issues, invalid prompt.  
    - Version: 1.2  

  - **Structured Output Parser**  
    - Type: LangChain Output Parser Node  
    - Role: Parses AI text output into structured JSON suitable for updating Magento product metadata.  
    - Configuration: Set to parse expected keys like meta description and keywords.  
    - Inputs: Raw AI-generated text from OpenAI Chat Model.  
    - Outputs: Structured JSON fields for downstream HTTP update request.  
    - Failure Modes: Parsing errors if AI output format is unexpected or malformed.  
    - Version: 1.3  

  - **SerpAPI** (Disabled)  
    - Type: LangChain Tool for SerpAPI  
    - Role: Optional external tool for search engine data enrichment, currently disabled.  
    - Configuration: No parameters active, node is disabled.  
    - Inputs: Would receive AI agent tool inputs if enabled.  
    - Outputs: Would feed back into AI Meta Agent.  
    - Failure Modes: Not active; if enabled, could face API limits or auth errors.  
    - Version: 1  

---

#### 2.4 Meta Data Update

- **Overview:**  
  Updates Magento 2 product metadata with the AI-generated SEO meta description and keywords through an authenticated HTTP request.

- **Nodes Involved:**  
  - Update Product Meta Data

- **Node Details:**

  - **Update Product Meta Data**  
    - Type: HTTP Request  
    - Role: Sends a PATCH or PUT request to Magento 2 API to update the product's SEO metadata fields.  
    - Configuration: Configured with Magento 2 API endpoint, authentication credentials (OAuth2 or token-based), and request body containing structured SEO data from AI Meta Agent.  
    - Inputs: Structured SEO metadata JSON from AI Meta Agent node.  
    - Outputs: Success or error response from Magento API.  
    - Failure Modes: Authentication failure, validation errors on product metadata, network issues, API rate limits.  
    - Version: 4.2  

---

#### 2.5 Auxiliary / Utility Nodes

- **Overview:**  
  Includes sticky notes for documentation and reminders within the n8n editor, no functional role in the data flow.

- **Nodes Involved:**  
  - Sticky Note  
  - Sticky Note1

- **Node Details:**

  - **Sticky Note**  
    - Type: Sticky Note  
    - Role: Visual documentation aid within n8n. Content is empty in JSON.  
    - Inputs/Outputs: None.  
    - Version: 1  

  - **Sticky Note1**  
    - Type: Sticky Note  
    - Role: Visual documentation aid within n8n. Content is empty in JSON.  
    - Inputs/Outputs: None.  
    - Version: 1  

---

### 3. Summary Table

| Node Name              | Node Type                               | Functional Role                              | Input Node(s)         | Output Node(s)            | Sticky Note          |
|------------------------|---------------------------------------|----------------------------------------------|-----------------------|---------------------------|----------------------|
| On form submission     | Form Trigger                          | Entry point; receives SKU input               | -                     | Get Product By SKU         |                      |
| Get Product By SKU     | HTTP Request                         | Fetches product data from Magento by SKU     | On form submission    | Checks If SKU exists       |                      |
| Checks If SKU exists   | If Condition                        | Validates product existence from API response| Get Product By SKU     | Code                      |                      |
| Code                   | Code (JavaScript)                   | Formats product data for AI processing        | Checks If SKU exists   | AI Meta Agent             |                      |
| AI Meta Agent          | LangChain Agent                    | Coordinates AI generation of SEO metadata     | Code, OpenAI Chat Model1, Structured Output Parser, SerpAPI (tool) | Update Product Meta Data |                      |
| OpenAI Chat Model1     | OpenAI Chat Model (LangChain)      | Provides GPT-4.1 language model                | AI Meta Agent         | AI Meta Agent              |                      |
| Structured Output Parser| LangChain Output Parser            | Parses AI text output into structured JSON    | OpenAI Chat Model1    | AI Meta Agent              |                      |
| SerpAPI (disabled)     | LangChain Tool for SerpAPI          | Optional SEO search data enrichment tool      | AI Meta Agent (tool)  | AI Meta Agent              | Disabled node         |
| Update Product Meta Data| HTTP Request                      | Updates product SEO metadata in Magento       | AI Meta Agent         | -                         |                      |
| Sticky Note            | Sticky Note                        | Documentation aid                             | -                     | -                         |                      |
| Sticky Note1           | Sticky Note                        | Documentation aid                             | -                     | -                         |                      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Node:**  
   - Add **Form Trigger** node named "On form submission".  
   - Configure webhook to receive form data including product SKU.  
   - Save and activate webhook.

2. **Fetch Product Data:**  
   - Add **HTTP Request** node named "Get Product By SKU".  
   - Configure:  
     - Method: GET  
     - URL: Magento 2 REST API endpoint for product by SKU, e.g. `https://<magento-url>/rest/V1/products/{{ $json["sku"] }}`  
     - Authentication: Set Magento 2 API credentials (token or OAuth2).  
   - Connect "On form submission" output to this node input.

3. **Check SKU Existence:**  
   - Add **If** node named "Checks If SKU exists".  
   - Set condition to test if "Get Product By SKU" returned valid product data:  
     - E.g., check if response status is 200 or product data object exists.  
   - Connect "Get Product By SKU" output to this node.  
   - Use 'true' path for existing SKU; false path can stop workflow or handle error.

4. **Data Preparation for AI:**  
   - Add **Code** node named "Code".  
   - Implement JavaScript code to format the product data into prompt structure suitable for AI agent. For example, extract product name, description, and other relevant fields.  
   - Connect 'true' output from "Checks If SKU exists" to this node.

5. **AI Agent Setup:**  
   - Add **LangChain Agent** node named "AI Meta Agent".  
   - Enable retry on failure.  
   - Connect "Code" node output to this node.  
   - Add an AI language model node for GPT-4.1:  
     - Add **LangChain OpenAI Chat Model** node named "OpenAI Chat Model1".  
     - Configure with OpenAI credentials with access to GPT-4.1.  
     - Connect "OpenAI Chat Model1" to "AI Meta Agent" on the `ai_languageModel` input.  
   - Add **Structured Output Parser** node named "Structured Output Parser".  
     - Configure to parse AI output into JSON with keys for meta description and keywords.  
     - Connect "Structured Output Parser" to "AI Meta Agent" on the `ai_outputParser` input.  
   - (Optional) Add **SerpAPI** tool node and connect to "AI Meta Agent" if SEO enrichment is desired; keep disabled if not used.

6. **Update Magento Product Metadata:**  
   - Add **HTTP Request** node named "Update Product Meta Data".  
   - Configure:  
     - Method: PUT or PATCH (Magento 2 product update endpoint)  
     - URL: `https://<magento-url>/rest/V1/products/{{ $json["sku"] }}`  
     - Authentication: Magento 2 API credentials.  
     - Body: Pass structured SEO metadata JSON from "AI Meta Agent" output (meta description, keywords).  
   - Connect "AI Meta Agent" output to this node.

7. **Add Sticky Notes:**  
   - Add **Sticky Note** nodes as needed to document workflow steps visually.

8. **Activate and Test:**  
   - Activate the workflow.  
   - Submit form with valid SKU.  
   - Verify product metadata updates in Magento.

---

### 5. General Notes & Resources

| Note Content                                                                                         | Context or Link                                                   |
|----------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| Workflow leverages GPT-4.1 model via LangChain integration for advanced AI text generation.        | n8n LangChain nodes documentation                                |
| Magento 2 REST API requires appropriate OAuth2 or token-based authentication setup.                | Magento 2 Developer Documentation                                |
| SerpAPI node is disabled by default, can be enabled for SEO enrichment via real-time search data.  | https://serpapi.com/                                             |
| OpenAI API usage is subject to rate limits and costs; ensure API keys have sufficient quota.       | https://platform.openai.com/account/rate-limits                  |

---

**Disclaimer:** The provided text is exclusively sourced from an automated workflow created using n8n, an integration and automation tool. This processing strictly complies with applicable content policies and contains no illegal, offensive, or protected material. All data handled is legal and public.