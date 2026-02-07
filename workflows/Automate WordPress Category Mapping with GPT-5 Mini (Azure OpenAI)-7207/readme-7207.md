Automate WordPress Category Mapping with GPT-5 Mini (Azure OpenAI)

https://n8nworkflows.xyz/workflows/automate-wordpress-category-mapping-with-gpt-5-mini--azure-openai--7207


# Automate WordPress Category Mapping with GPT-5 Mini (Azure OpenAI)

### 1. Workflow Overview

This workflow, titled **"Automate WordPress Category Mapping with GPT-5 Mini (Azure OpenAI)"**, automates the process of mapping WordPress post categories using AI assistance. It is designed primarily for content managers or developers who want to leverage artificial intelligence to dynamically generate or adjust category mappings for WordPress posts based on user inputs or other logic.

The workflow logically divides into these blocks:

- **1.1 Input Trigger**: Manual trigger to start the workflow.
- **1.2 Retrieve WordPress Categories**: Fetch all categories from a WordPress site using WordPress REST API with authenticated access.
- **1.3 Aggregate Categories**: Aggregate the fetched categories into a single data structure for processing.
- **1.4 AI-powered Category Mapping**: Use GPT-5 Mini model via Azure OpenAI to process input data and generate an updated category mapping.
- **1.5 AI Model Node**: The actual GPT-5 Mini language model node that interacts with the LangChain integration to perform the AI computation.

Additional **Sticky Notes** provide instructions and overview about the workflow and its usage.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Trigger

- **Overview:**  
  This block initiates the workflow manually. It allows a user to start the process when ready, typically from the n8n interface.

- **Nodes Involved:**  
  - Start

- **Node Details:**  
  - **Node Name:** Start  
  - **Type:** Manual trigger (n8n-nodes-base.manualTrigger)  
  - **Configuration:** Default manual trigger with no parameters.  
  - **Key Expressions:** None  
  - **Input:** None  
  - **Output:** Triggers the next node "Get All Categories"  
  - **Version:** 1  
  - **Failure Cases:** None expected; manual trigger is synchronous and user-initiated.  

---

#### 2.2 Retrieve WordPress Categories

- **Overview:**  
  This block fetches all categories from the WordPress REST API endpoint, authenticating with stored WordPress credentials.

- **Nodes Involved:**  
  - Get All Categories

- **Node Details:**  
  - **Node Name:** Get All Categories  
  - **Type:** HTTP Request (n8n-nodes-base.httpRequest)  
  - **Configuration:**  
    - URL: `https://cartilo.my.id/wp-json/wp/v2/categories?per_page=100`  
    - Authentication: Uses predefined WordPress API credentials (`WP - Cartilo (Dax AI)`)  
    - No additional request options configured  
  - **Key Expressions:** None  
  - **Input:** Receives trigger from Start node  
  - **Output:** Returns JSON array of categories to "Aggregate to Process" node  
  - **Version:** 4.2  
  - **Edge Cases / Failures:**  
    - Authentication failure if WordPress credentials expire or are invalid  
    - Network timeouts or connectivity issues  
    - Pagination limits if categories exceed 100 (not handled here)  
    - API rate limits or errors

---

#### 2.3 Aggregate Categories

- **Overview:**  
  Aggregates all category items fetched by the HTTP request into a single array for easier processing downstream.

- **Nodes Involved:**  
  - Aggregate to Process

- **Node Details:**  
  - **Node Name:** Aggregate to Process  
  - **Type:** Aggregate (n8n-nodes-base.aggregate)  
  - **Configuration:**  
    - Aggregate operation: `aggregateAllItemData` (combines all incoming items into one array)  
  - **Input:** Receives multiple items from "Get All Categories" node  
  - **Output:** Single aggregated item passed to "Category-Mapping" node  
  - **Version:** 1  
  - **Edge Cases / Failures:**  
    - If no categories are returned, the aggregation will result in an empty array, which may cause downstream logic issues.

---

#### 2.4 AI-powered Category Mapping

- **Overview:**  
  This block sends the aggregated category data and user input to a LangChain-powered AI chain node, which formats the category mappings dynamically using GPT-5 Mini.

- **Nodes Involved:**  
  - Category-Mapping
  - Gpt-5-mini

- **Node Details:**  

  **Category-Mapping**  
  - **Type:** LangChain Chain LLM node (@n8n/n8n-nodes-langchain.chainLlm)  
  - **Configuration:**  
    - Input text: JSON stringified aggregated category data (`={{JSON.stringify($json)}}`)  
    - Message prompt includes a script that conditionally maps category names to category IDs based on user input from another node (`Topic Chooser and Title Maker`).  
    - Instructions specify:  
      - Only change category and ID values, no newlines in output  
      - The mapping is conditional on category names like "Technology", "Artificial Intelligence (AI)", etc., mapping to specific numeric IDs.  
    - Prompt type: define (custom prompt)  
  - **Input:** Aggregated category data from "Aggregate to Process"  
  - **Output:** Passes message to "Gpt-5-mini" node via AI language model channel  
  - **Version:** 1.7  
  - **Edge Cases / Failures:**  
    - Expression evaluation failure if referenced node or fields are missing (`$('Topic Chooser and Title Maker')`)  
    - AI prompt misinterpretation or unexpected output formatting  
    - Input data inconsistencies  

  **Gpt-5-mini**  
  - **Type:** LangChain LM Chat Azure OpenAI node (@n8n/n8n-nodes-langchain.lmChatAzureOpenAi)  
  - **Configuration:**  
    - Model: `gpt5mini` (Azure OpenAI GPT-5 Mini model)  
    - No additional options set  
  - **Credentials:** Azure OpenAI API credentials named `GPT5-mini`  
  - **Input:** Receives prompt message from "Category-Mapping" node  
  - **Output:** AI-generated category mapping output  
  - **Version:** 1  
  - **Edge Cases / Failures:**  
    - Azure API authentication errors or quota limits  
    - Model latency or timeout  
    - Unexpected output format from AI model

---

#### 2.5 Sticky Notes (Documentation & Instructions)

- **Overview:**  
  Provide user instructions and workflow overview within the n8n editor interface.

- **Nodes Involved:**  
  - Sticky Note4  
  - Sticky Note5

- **Node Details:**  

  **Sticky Note4**  
  - Content: "## WP Category toolkit" (Title note)  
  - Color: Purple (color 5)  
  - Position: Top-left large note covering header area  
  - Usage: Workflow identification

  **Sticky Note5**  
  - Content:  
    ```
    ## Process:
    - change with your url
    - Input your WP credentials
    - Copy `category json` from **Body Post Wordpress**
    - Paste in system prompt on **Category Mapping**
    - Copy the result back to **Body Post Wordpress**
    ```
  - Color: Green (color 4)  
  - Position: Next to main nodes, guiding user steps  
  - Usage: Workflow usage instructions

---

### 3. Summary Table

| Node Name           | Node Type                             | Functional Role               | Input Node(s)                 | Output Node(s)           | Sticky Note                                                                                                  |
|---------------------|-------------------------------------|------------------------------|------------------------------|--------------------------|--------------------------------------------------------------------------------------------------------------|
| Start               | Manual Trigger                      | Initiate workflow             | None                         | Get All Categories        |                                                                                                              |
| Get All Categories   | HTTP Request                       | Fetch WordPress categories    | Start                        | Aggregate to Process      |                                                                                                              |
| Aggregate to Process | Aggregate                         | Combine categories into array | Get All Categories            | Category-Mapping          |                                                                                                              |
| Category-Mapping     | LangChain Chain LLM                | Generate AI category mapping  | Aggregate to Process          | Gpt-5-mini (via ai_languageModel) |                                                                                                              |
| Gpt-5-mini           | LangChain LM Chat Azure OpenAI    | Call GPT-5 Mini model         | Category-Mapping (ai_languageModel) | None                     |                                                                                                              |
| Sticky Note4         | Sticky Note                       | Workflow title note           | None                         | None                     | ## WP Category toolkit                                                                                       |
| Sticky Note5         | Sticky Note                       | Workflow usage instructions   | None                         | None                     | ## Process: - change with your url - Input your WP credentials - Copy `category json` from **Body Post Wordpress** - Paste in system prompt on **Category Mapping** - Copy the result back to **Body Post Wordpress** |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow in n8n and name it "WP Category Toolkit".**

2. **Add a Manual Trigger node**  
   - Set the node name to `Start`.  
   - No additional configuration needed.

3. **Add an HTTP Request node**  
   - Name it `Get All Categories`.  
   - Set HTTP Method to `GET`.  
   - Set URL to `https://cartilo.my.id/wp-json/wp/v2/categories?per_page=100` (replace with your WordPress site URL).  
   - Under Authentication, select **Predefined Credential Type** and choose or create a WordPress API credential using OAuth2 or Basic Auth as required.  
   - Connect the `Start` node’s output to this node’s input.

4. **Add an Aggregate node**  
   - Name it `Aggregate to Process`.  
   - Set Aggregate Operation to `Aggregate All Item Data` to combine all fetched category items into a single JSON array.  
   - Connect `Get All Categories` node’s output to this node’s input.

5. **Add a LangChain Chain LLM node**  
   - Name it `Category-Mapping`.  
   - Set the node input parameter `text` to `={{JSON.stringify($json)}}` to serialize the aggregated data.  
   - Under Messages, add the following prompt (adjust references to your actual node names if different):  
     ```
     You are an expert programmer. 

     change this mapping:
      {{ $('Topic Chooser and Title Maker').item.json.output.category == "Technology" ? [3] :
         $('Topic Chooser and Title Maker').item.json.output.category == "Artificial Intelligence (AI)" ? [4] :
         $('Topic Chooser and Title Maker').item.json.output.category == "Tech Fact" ? [7] :
         $('Topic Chooser and Title Maker').item.json.output.category == "Tech History" ? [8] :
         $('Topic Chooser and Title Maker').item.json.output.category == "Tech Tips" ? [9] : [1] }}

     based on user input.
     only change category and the id. never add "\n" in the output
     ```  
   - Set prompt type to `define`.  
   - Connect `Aggregate to Process` node’s output to this node’s input.

6. **Add a LangChain LM Chat Azure OpenAI node**  
   - Name it `Gpt-5-mini`.  
   - Select the model `gpt5mini`.  
   - Configure Azure OpenAI API credentials (create or select existing credentials with access to GPT-5 Mini).  
   - Connect the `Category-Mapping` node’s ai_languageModel output to this node’s input.

7. **Add Sticky Notes for workflow documentation (optional but recommended):**  
   - Add a sticky note named `Sticky Note4` with content: `## WP Category toolkit`.  
   - Add a sticky note named `Sticky Note5` with instructions:  
     ```
     ## Process:
     - change with your url
     - Input your WP credentials
     - Copy `category json` from **Body Post Wordpress**
     - Paste in system prompt on **Category Mapping**
     - Copy the result back to **Body Post Wordpress**
     ```

8. **Verify all connections and credentials are valid.**

9. **Save and activate the workflow.**

---

### 5. General Notes & Resources

| Note Content                                                                                                         | Context or Link                                             |
|----------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------|
| Replace `https://cartilo.my.id` in HTTP Request node with your actual WordPress site URL.                            | Workflow configuration requirement                           |
| The "Topic Chooser and Title Maker" node referenced in the prompt is external and must exist or be replaced accordingly. | Dependency for expressions in Category-Mapping prompt       |
| WordPress API credential must have permission to read categories via REST API.                                        | WordPress API setup                                          |
| Azure OpenAI GPT-5 Mini model requires valid subscription and API key configured in n8n credentials.                 | Azure OpenAI setup                                           |
| The workflow does not handle category pagination beyond 100 items — consider adding pagination if needed.             | Potential enhancement                                        |
| Sticky notes provide essential usage instructions; consult them when onboarding new users or modifying workflow.     | n8n editor interface                                         |

---

**Disclaimer:**  
The provided text comes exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All manipulated data are legal and public.