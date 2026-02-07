Auto-Generate Product Descriptions with Azure OpenAI for Adobe Commerce/Magento

https://n8nworkflows.xyz/workflows/auto-generate-product-descriptions-with-azure-openai-for-adobe-commerce-magento-8475


# Auto-Generate Product Descriptions with Azure OpenAI for Adobe Commerce/Magento

### 1. Workflow Overview

This workflow automates the generation of product descriptions for products in Adobe Commerce (Magento 2) that are currently missing descriptions. It is designed for ecommerce managers and developers who want to enrich product catalogs systematically without manual entry. The workflow is structured into three main logical blocks:

**1.1 Product Data Retrieval**  
Fetches a product missing a description and retrieves all product attributes, especially resolving attribute options that have selectable values.

**1.2 Description Generation Using AI**  
Transforms raw attribute data into human-readable labels and passes the structured product data to an Azure OpenAI language model to generate an SEO-friendly, natural-sounding product description.

**1.3 Product Update in Magento**  
Saves the newly generated description back to the Magento store via the Magento 2 REST API, ensuring the webshop reflects the updated information immediately.

---

### 2. Block-by-Block Analysis

#### 2.1 Product Data Retrieval

**Overview:**  
This block obtains product data from Magento 2, specifically targeting products without descriptions, and fetches attribute metadata to resolve option values into readable labels.

**Nodes Involved:**  
- When clicking ‘Test workflow’ (Manual Trigger)  
- Get attributes and options (HTTP Request)  
- get Product without description (HTTP Request)  
- Wait until nodes ready (Merge)  

**Node Details:**  

- **When clicking ‘Test workflow’**  
  - Type: Manual Trigger  
  - Role: Entry point to start the workflow  
  - Configuration: No parameters, user-triggered  
  - Connections: Outputs to "Get attributes and options" and "get Product without description"  
  - Edge cases: Workflow won't start unless triggered manually  

- **Get attributes and options**  
  - Type: HTTP Request  
  - Role: Fetches Magento product attribute metadata filtered for attributes with selectable options (frontend input = select)  
  - Configuration:  
    - URL calls Magento REST API endpoint `/V1/products/attributes` with filters on `frontend_input=select` and selected fields: attribute_code, frontend_input, default_frontend_label, options  
    - Authentication: Magento 2 API credentials (predefined)  
    - Executes once per workflow run to minimize API calls  
  - Input: Trigger node  
  - Output: Sends data to "Wait until nodes ready"  
  - Edge cases: API failure, authentication errors, empty result sets  
  - Version: Uses Magento 2 API version 4.2  

- **get Product without description**  
  - Type: HTTP Request  
  - Role: Retrieves one product missing a description via Magento REST API  
  - Configuration:  
    - URL `/V1/products` with query parameters filtering for products where `description` is null  
    - Page size limited to 1 for single product processing  
    - Authentication: Magento 2 API credentials  
  - Input: Trigger node  
  - Output: Sends product data to "Wait until nodes ready"  
  - Edge cases: No products missing description (empty response), API or authentication errors  

- **Wait until nodes ready**  
  - Type: Merge  
  - Role: Synchronizes outputs from "Get attributes and options" and "get Product without description" to ensure both datasets are available before proceeding  
  - Configuration: Default merge mode  
  - Input: Receives from both data-fetching nodes  
  - Output: Sends merged output to "Prepare attributes"  
  - Edge cases: One input missing or delayed could stall the workflow  

---

#### 2.2 Description Generation Using AI

**Overview:**  
Processes raw product attributes by mapping option IDs to human-readable labels, formats the data, and sends it to an Azure OpenAI model configured with a custom prompt to generate a professional, SEO-optimized product description.

**Nodes Involved:**  
- Prepare attributes (Code)  
- Azure OpenAI Chat Model (LLM Node)  
- Basic LLM Chain (Langchain LLM Chain)  
- set Description (Set)  

**Node Details:**  

- **Prepare attributes**  
  - Type: Code (JavaScript)  
  - Role: Transforms product attribute values from raw IDs to human-readable labels using attribute options data  
  - Configuration:  
    - Reads product data and attribute metadata from previous nodes  
    - Constructs a mapping of attribute codes to their option labels  
    - Replaces numeric or coded attribute values with corresponding labels for better LLM comprehension  
    - Returns the enriched product JSON object  
  - Input: Merged data from "Wait until nodes ready"  
  - Output: Passes processed product data to "Basic LLM Chain"  
  - Edge cases: Missing attributes/options, data format inconsistencies, script errors  
  - Version: Code node v2  

- **Azure OpenAI Chat Model**  
  - Type: AI Language Model (Azure OpenAI)  
  - Role: Provides the language model backend for the LLM chain  
  - Configuration:  
    - Model: "model-router" (default Azure OpenAI model routing)  
    - Credentials: Azure OpenAI API credentials set up in n8n securely  
    - No additional options configured  
  - Input: Connected as AI language model provider for "Basic LLM Chain"  
  - Output: Model responses streamed to "Basic LLM Chain"  
  - Edge cases: API key invalid, request timeouts, model unavailability, rate limits  

- **Basic LLM Chain**  
  - Type: Langchain LLM Chain  
  - Role: Defines prompt template and calls Azure OpenAI model to generate product description  
  - Configuration:  
    - Prompt instructs the model to write an English product description in HTML paragraphs with breaks  
    - Emphasizes grammatical correctness, natural language, consistency, SEO-friendliness, and customer-oriented persuasive tone tailored for the webshop sector  
    - Template uses the enriched product JSON string as input for the model  
    - Output: Generated product description text  
  - Input: Receives enriched product JSON from "Prepare attributes" and AI model from "Azure OpenAI Chat Model"  
  - Output: Text output passed to "set Description"  
  - Edge cases: Prompt failure, unexpected input format, model response errors  

- **set Description**  
  - Type: Set  
  - Role: Extracts and assigns the generated text from LLM output to a new JSON key `description` for further processing  
  - Configuration:  
    - Assignment sets `description` to the text field of the incoming JSON  
  - Input: Receives LLM output text from "Basic LLM Chain"  
  - Output: Passes data to "Save configurable"  
  - Edge cases: Missing or malformed LLM output  

---

#### 2.3 Product Update in Magento

**Overview:**  
Updates the Magento product by saving the generated description back via the Magento REST API, ensuring the webshop product is enriched immediately.

**Nodes Involved:**  
- Save configurable (HTTP Request)  

**Node Details:**  

- **Save configurable**  
  - Type: HTTP Request  
  - Role: Updates the product description field of the Magento product using a PUT request  
  - Configuration:  
    - URL uses the product SKU dynamically extracted and URL encoded from the product data node  
    - JSON body updates `custom_attributes` array with the `description` attribute set to the generated description text  
    - Replaces newlines and escapes quotes to ensure JSON safety  
    - Authentication: Magento 2 API credentials  
  - Input: Receives `description` field from "set Description" and product SKU from "get Product without description"  
  - Output: No further connections  
  - Edge cases: API update failure, SKU missing, JSON formatting errors, authentication issues  

---

### 3. Summary Table

| Node Name                   | Node Type                          | Functional Role                        | Input Node(s)                  | Output Node(s)               | Sticky Note                                                                                                  |
|-----------------------------|----------------------------------|-------------------------------------|-------------------------------|-----------------------------|--------------------------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’ | Manual Trigger                   | Start workflow manually              | —                             | Get attributes and options, get Product without description |                                                                                                              |
| Get attributes and options   | HTTP Request                     | Fetch attribute metadata for select-type attributes | When clicking ‘Test workflow’ | Wait until nodes ready       | Step 1: Get Product Information from Magento - Retrieves product attributes including selectable options.   |
| get Product without description | HTTP Request                   | Fetch one product missing description | When clicking ‘Test workflow’ | Wait until nodes ready       | Step 1: Get Product Information from Magento - Retrieves a single product missing description.               |
| Wait until nodes ready       | Merge                           | Synchronize attribute data and product data | Get attributes and options, get Product without description | Prepare attributes          |                                                                                                              |
| Prepare attributes          | Code                            | Map attribute option IDs to labels  | Wait until nodes ready         | Basic LLM Chain              | Step 2: Generate Description with LLM - Resolves attribute values to human-readable labels before AI input.  |
| Azure OpenAI Chat Model      | AI Language Model (Azure OpenAI) | Provides LLM model for description generation | Basic LLM Chain (AI model input) | Basic LLM Chain             | Step 2: Generate Description with LLM - Uses Azure OpenAI to create product description from structured data.|
| Basic LLM Chain              | Langchain LLM Chain             | Defines prompt and generates description | Prepare attributes, Azure OpenAI Chat Model | set Description             | Step 2: Generate Description with LLM - Produces SEO-friendly, natural product description text.              |
| set Description              | Set                             | Assign generated text to description key | Basic LLM Chain               | Save configurable            | Step 3: Save Product in Magento - Prepares description for API update.                                       |
| Save configurable            | HTTP Request                    | Update product description in Magento store | set Description              | —                           | Step 3: Save Product in Magento - Updates product description via Magento API.                              |
| Sticky Note                 | Sticky Note                     | Documentation                       | —                             | —                           | Step 1: Get Product Information from Magento - Retrieves a single product missing description and attributes.|
| Sticky Note1                | Sticky Note                     | Documentation                       | —                             | —                           | Step 2: Generate Description with LLM - Resolves attribute IDs to human labels, uses Azure OpenAI.           |
| Sticky Note2                | Sticky Note                     | Documentation                       | —                             | —                           | Step 3: Save Product in Magento - Saves generated description to product via API.                            |
| Sticky Note3                | Sticky Note                     | Documentation                       | —                             | —                           | Overview and detailed explanation of the workflow, use cases, customization options, and requirements.      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Type: Manual Trigger  
   - Purpose: Start the workflow manually  

2. **Create HTTP Request Node: Get attributes and options**  
   - URL: `https://www.example.com/rest/V1/products/attributes?searchCriteria[filter_groups][0][filters][0][field]=frontend_input&searchCriteria[filter_groups][0][filters][0][value]=select&fields=items[frontend_input,attribute_code,default_frontend_label,options]`  
   - Method: GET (default)  
   - Authentication: Use Magento 2 API credentials (OAuth2 or token)  
   - Execute Once: Enabled  
   - Connect from Manual Trigger node output  

3. **Create HTTP Request Node: get Product without description**  
   - URL: `https://www.example.com/rest/V1/products`  
   - Method: GET  
   - Query Parameters:  
     - `searchCriteria[filter_groups][0][filters][0][field]`: `description`  
     - `searchCriteria[filter_groups][0][filters][0][condition_type]`: `null`  
     - `searchCriteria[pageSize]`: `1`  
   - Authentication: Magento 2 API credentials  
   - Connect from Manual Trigger node output  

4. **Create Merge Node: Wait until nodes ready**  
   - Mode: Default (Wait for all inputs)  
   - Connect inputs from "Get attributes and options" and "get Product without description" nodes  
   - Output to next node  

5. **Create Code Node: Prepare attributes**  
   - Type: Code (JavaScript)  
   - Paste the provided JavaScript code that:  
     - Extracts product and attribute option data  
     - Maps attribute option IDs to human-readable labels  
     - Replaces raw values with labels in product data  
   - Input: Connect from Merge node output  

6. **Create Azure OpenAI Chat Model Node**  
   - Type: AI Language Model (Azure OpenAI)  
   - Select model: `model-router` or your preferred Azure model  
   - Configure credentials: Azure OpenAI API key and endpoint  
   - No special options needed  
   - Connect as AI model input for the next LLM chain  

7. **Create Langchain LLM Chain Node: Basic LLM Chain**  
   - Type: Langchain LLM Chain  
   - Set prompt:  
     ```
     Write an English product description based on this Magento2 attributes. Please use html paragraphs and breaks only. Ensure the text is grammatically correct, natural, and tailored to the ... market. Use terminology that is common in this sector, and avoid overly literal or informal style. 

     Write in a consistent style suitable for webshop product descriptions: professional, clear, and customer-oriented, while keeping a persuasive tone aimed at ...

     Additionally, make the text SEO-friendly : include relevant keywords naturally without unnecessary repetition, and ensure the text reads smoothly while supporting search visibility.

     Here is the Magento product: {{  JSON.stringify($json) }}
     ```
   - Input: Connect from "Prepare attributes"  
   - AI Language Model: Connect to Azure OpenAI Chat Model node  
   - Output: Sends generated description text  

8. **Create Set Node: set Description**  
   - Type: Set  
   - Assignments:  
     - Field name: `description`  
     - Value: Expression `{{$json["text"]}}` (the generated text from LLM)  
   - Input: Connect from "Basic LLM Chain" output  

9. **Create HTTP Request Node: Save configurable**  
   - Type: HTTP Request  
   - Method: PUT  
   - URL:  
     ```
     https://www.example.com/rest/V1/products/{{ encodeURIComponent($('get Product without description').first().json.items[0].sku) }}
     ```
   - Authentication: Magento 2 API credentials  
   - Body Content Type: JSON  
   - JSON Body:  
     ```json
     {
       "product": {
         "custom_attributes": [{
           "attribute_code": "description",
           "value": "{{ $json.description.replaceAll('\n',' ').replaceAll('\"\"','\\\"') }}"
         }]
       }
     }
     ```
   - Send Body: True  
   - Input: Connect from "set Description" node output  

10. **Verify all connections and test the workflow**  
    - Trigger manually via the manual trigger node  
    - Monitor logs for API errors or failures  
    - Adjust prompt or API credentials as needed  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Context or Link                                                                                     |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| This workflow demonstrates automated product description generation using Azure OpenAI integrated with Adobe Commerce (Magento 2), focusing on SEO-friendly, customer-oriented text generation. It can be adapted easily to other LLM providers or ecommerce platforms.                                                                                                                                                                                                                                                                                                                                                                                                | Core workflow description and adaptability                                                        |
| The JavaScript code in "Prepare attributes" is critical for mapping numeric attribute option values into human-readable labels, which greatly improves AI output quality and relevance.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Attribute resolution logic                                                                          |
| Azure OpenAI is configured in the workflow but can be swapped with OpenAI, Anthropic, Gemini, or other supported LLM services within n8n’s AI nodes to suit user preference or licensing.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | AI provider flexibility                                                                            |
| The prompt used in the Langchain LLM Chain is designed for SEO optimization and professional tone; customization is encouraged to match brand voice, languages, or product categories.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Prompt customization                                                                               |
| Ensure Magento 2 API credentials have sufficient permissions to read product data and update product attributes via REST API. Authentication failures are a common error point.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Magento 2 API permission requirements                                                             |
| The workflow is manually triggered but can be adapted to run on schedules or event-based triggers for automation at scale.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Trigger flexibility                                                                               |
| For improved resilience, consider adding error handling nodes or retry logic around HTTP requests and AI calls to manage transient failures or rate limits gracefully.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Error handling best practices                                                                      |
| For multi-language shops, extend the prompt or branch the workflow to generate descriptions in different languages by modifying the prompt and possibly using translation APIs.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Multi-language support                                                                             |

---

**Disclaimer:** The text provided is derived exclusively from an automated workflow created with n8n, an integration and automation tool. The processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All data manipulated are legal and public.