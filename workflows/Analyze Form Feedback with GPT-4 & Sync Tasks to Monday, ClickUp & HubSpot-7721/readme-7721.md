Analyze Form Feedback with GPT-4 & Sync Tasks to Monday, ClickUp & HubSpot

https://n8nworkflows.xyz/workflows/analyze-form-feedback-with-gpt-4---sync-tasks-to-monday--clickup---hubspot-7721


# Analyze Form Feedback with GPT-4 & Sync Tasks to Monday, ClickUp & HubSpot

### 1. Workflow Overview

This workflow automates the processing of customer feedback submitted through a dynamic form, leveraging AI (OpenAI GPT-4) to analyze sentiment and categorize the review. The insights generated are then transformed into structured, actionable tasks that are synchronized across three major task management platforms: Monday.com, ClickUp, and HubSpot.

The logical flow is structured into the following blocks:

- **1.1 Input Reception and Preprocessing:** Captures and extracts structured data from customer feedback submitted via a form.
- **1.2 AI Analysis:** Uses GPT-4 to analyze the review text, providing sentiment, category, priority, and other metadata.
- **1.3 Data Processing:** Parses and enriches AI output, prepares task metadata and due dates, and sets flags for downstream integrations.
- **1.4 Task Structuring with AI Agent:** Generates a clean JSON object tailored for Monday.com, ClickUp, and HubSpot task creation.
- **1.5 Multi-Platform Task Creation:** Creates tasks/items in Monday.com, ClickUp, and HubSpot using the structured data.
- **1.6 Supporting Nodes:** Sticky Notes providing documentation and context for each major block.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Preprocessing

- **Overview:**  
  Captures customer feedback via a custom n8n form trigger and extracts key fields into a clean, structured format for AI processing. This is the workflow’s entry point.

- **Nodes Involved:**  
  - 📝 On form submission  
  - 🧪 Code

- **Node Details:**

  - **📝 On form submission**  
    - *Type & Role:* Form Trigger; initiates workflow upon form submission.  
    - *Configuration:* Custom form titled "Feedback Form" with required fields: Name (text), Message (textarea), Rating (dropdown 1–5), Product Service (textarea).  
    - *Expressions:* None; raw form inputs accessible via `$input`.  
    - *Connections:* Outputs to 🧪 Code node.  
    - *Edge Cases:* Missing fields handled by form required flags; webhook availability critical.  
    - *Version:* 2.2  

  - **🧪 Code**  
    - *Type & Role:* JavaScript Code node; extracts and normalizes form data fields into a structured object with typed rating.  
    - *Configuration:* Extracts `Message` as `review_text`, `Name` as `customer_name`, parses `Rating` as integer, and extracts `Product Service`.  
    - *Expressions:* Uses `$input.first().json` to access form data.  
    - *Connections:* Outputs to 🧠 OpenAI Analysis node.  
    - *Edge Cases:* Assumes form fields exist; no error handling for missing keys.  
    - *Version:* 2  

---

#### 2.2 AI Analysis

- **Overview:**  
  Sends the structured review data to OpenAI GPT-4 for detailed sentiment analysis, classification, and action recommendations, formatted as a JSON response.

- **Nodes Involved:**  
  - 🧠 OpenAI Analysis

- **Node Details:**

  - **🧠 OpenAI Analysis**  
    - *Type & Role:* Langchain OpenAI node; requests GPT-4 to analyze customer review and return a structured JSON with sentiment, category, priority, department, and other fields.  
    - *Configuration:*  
      - Model: GPT-4O-MINI (a GPT-4 variant)  
      - Temperature: 0.3 (low creativity for consistent output)  
      - System prompt guides the AI to produce a JSON with exact fields.  
      - User prompt dynamically injects review data via expressions, e.g. `{{ $json.review_text }}`.  
    - *Expressions:* Used to populate prompt text with review details.  
    - *Connections:* Outputs to 🧮 Data Processing node.  
    - *Credentials:* Uses configured OpenAI API credentials.  
    - *Edge Cases:* AI response may be malformed or delayed; model availability and API quota can cause failures.  
    - *Version:* 1  

---

#### 2.3 Data Processing

- **Overview:**  
  Parses the AI JSON response, enriches original data with AI insights, sets task metadata including title, description, due date, and flags for integration control.

- **Nodes Involved:**  
  - 🧮 Data Processing

- **Node Details:**

  - **🧮 Data Processing**  
    - *Type & Role:* JavaScript Code node; parses AI response string/object safely, applies fallbacks on parse failure, and constructs a comprehensive data object for downstream use.  
    - *Configuration:*  
      - Extracts AI response fields such as sentiment, category, priority, action_required, key insights, and summary.  
      - Computes due dates based on priority:  
        - High → 1 day  
        - Medium → 3 days  
        - Low → 7 days  
      - Constructs `task_title` and a detailed `task_description` including all metadata and insights.  
      - Flags for toggling integrations are in comments for modification (`create_*_task` flags implied but not explicitly shown).  
    - *Expressions:* Uses `$` syntax to access node outputs, e.g. `$('🧪 Code').first().json`.  
    - *Connections:* Outputs enriched data to 🕵️‍♂️ AI Agent node.  
    - *Edge Cases:* Handles JSON parse errors gracefully; logs errors to console.  
    - *Version:* 2  

---

#### 2.4 Task Structuring with AI Agent

- **Overview:**  
  Converts the enriched data into a strictly formatted JSON object tailored to be compatible with Monday.com, HubSpot, and ClickUp task creation APIs.

- **Nodes Involved:**  
  - 🕵️‍♂️ AI Agent  
  - 💬 OpenAI Chat Model (used internally by AI Agent)

- **Node Details:**

  - **🕵️‍♂️ AI Agent**  
    - *Type & Role:* Langchain AI Agent node; receives processed input and uses GPT-4 to produce a JSON-only output with fields exactly matching requirements for task creation on multiple platforms.  
    - *Configuration:*  
      - Prompt explicitly requests output in strict JSON format, containing title, description, priority, due_date, and metadata fields in fixed order.  
      - Input variables injected from previous node's JSON fields.  
      - No additional commentary or formatting allowed.  
    - *Connections:* Outputs to all three task creation nodes: Monday.com, ClickUp, HubSpot.  
    - *Edge Cases:* AI might return malformed JSON if prompt or input is incorrect; requires error handling or validation downstream.  
    - *Version:* 2  

  - **💬 OpenAI Chat Model**  
    - *Type & Role:* Language model node used internally by AI Agent to fulfill the prompt with GPT-4O-MINI.  
    - *Configuration:* Model set to GPT-4O-MINI, no special options.  
    - *Connections:* Outputs to AI Agent node’s languageModel input.  
    - *Credentials:* Uses same OpenAI credentials.  
    - *Edge Cases:* Same considerations as AI Agent node.  
    - *Version:* 1.2  

---

#### 2.5 Multi-Platform Task Creation

- **Overview:**  
  Creates tasks/items on Monday.com, ClickUp, and HubSpot platforms using the structured JSON output from the AI Agent, facilitating synchronized task management across systems.

- **Nodes Involved:**  
  - 🗓️ Create Monday.com Item  
  - ✅ Create ClickUp Task  
  - 📌 Create HubSpot Task

- **Node Details:**

  - **🗓️ Create Monday.com Item**  
    - *Type & Role:* Monday.com API node; creates a new item in a specified board and group.  
    - *Configuration:*  
      - Board ID: 2054150933  
      - Group ID: group_mktjh98q  
      - Item name: Static "Feedback" (could be enhanced to dynamic)  
      - Column values: JSON from AI Agent output injected dynamically.  
    - *Credentials:* Monday.com API key configured.  
    - *Edge Cases:* Invalid board/group IDs or column mapping can cause failures. API rate limits possible.  
    - *Version:* 1  

  - **✅ Create ClickUp Task**  
    - *Type & Role:* ClickUp API node; creates a task with priority and custom fields.  
    - *Configuration:*  
      - List ID: 901610042700  
      - Team, Space, Folder IDs configured as per ClickUp workspace.  
      - Authentication via OAuth2.  
      - Task name: Static "Feedback" (could be dynamic)  
      - Custom fields JSON uses AI Agent output.  
    - *Credentials:* OAuth2 credentials configured.  
    - *Edge Cases:* OAuth token expiry or permission issues possible. List or folder IDs must match workspace.  
    - *Version:* 1  

  - **📌 Create HubSpot Task**  
    - *Type & Role:* HubSpot node; creates a CRM task engagement with body content.  
    - *Configuration:*  
      - Engagement type: "task"  
      - Metadata body: AI Agent JSON output injected.  
      - Authentication via HubSpot app token.  
    - *Credentials:* HubSpot API key configured.  
    - *Edge Cases:* API key permission or rate limits possible. Formatting of body content must be valid.  
    - *Version:* 2  

---

#### 2.6 Supporting Nodes (Sticky Notes)

- **Overview:**  
  Sticky Notes provide documentation and context for groups of nodes, aiding maintainability and onboarding.

- **Nodes Involved:**  
  - Sticky Note (near form submission and code)  
  - Sticky Note1 (near AI analysis and data processing)  
  - Sticky Note2 (near AI Agent and OpenAI Chat Model)  
  - Sticky Note3 (near task creation nodes)

- **Node Details:**

  - Each sticky note summarizes the function and role of the adjacent nodes with concise explanations and reminders about integration toggles, AI prompt purpose, and form design.

---

### 3. Summary Table

| Node Name               | Node Type                          | Functional Role                                | Input Node(s)        | Output Node(s)                              | Sticky Note                                                                                              |
|-------------------------|----------------------------------|-----------------------------------------------|----------------------|---------------------------------------------|--------------------------------------------------------------------------------------------------------|
| 📝 On form submission    | Form Trigger                     | Captures user feedback via form submission    | —                    | 🧪 Code                                     | FORM CAPTURE & PRE-PROCESSING: Captures structured feedback input from a dynamic form.                 |
| 🧪 Code                 | Code (JavaScript)                | Extracts and normalizes form data fields       | 📝 On form submission | 🧠 OpenAI Analysis                          | FORM CAPTURE & PRE-PROCESSING: Extracts key fields (Name, Message, Rating, Product Service)             |
| 🧠 OpenAI Analysis       | Langchain OpenAI GPT-4 Node      | Analyzes sentiment, category, and priority     | 🧪 Code              | 🧮 Data Processing                         | AI-DRIVEN FEEDBACK INTELLIGENCE: Produces structured JSON analysis of review.                          |
| 🧮 Data Processing       | Code (JavaScript)                | Parses AI output, enriches data, computes due dates | 🧠 OpenAI Analysis   | 🕵️‍♂️ AI Agent                             | AI-DRIVEN FEEDBACK INTELLIGENCE: Safely parses AI response, prepares enriched metadata and task details |
| 🕵️‍♂️ AI Agent           | Langchain AI Agent               | Creates strict JSON task object for integrations | 🧮 Data Processing   | 🗓️ Create Monday.com Item, ✅ Create ClickUp Task, 📌 Create HubSpot Task | STRUCTURED OUTPUT FOR TASK SYSTEMS: Formats output JSON for all integrations with strict field order   |
| 💬 OpenAI Chat Model     | Langchain OpenAI Chat Model      | Provides GPT-4 language model service internally | —                    | 🕵️‍♂️ AI Agent (ai_languageModel input)    | STRUCTURED OUTPUT FOR TASK SYSTEMS: Chat-based GPT-4 model used by AI Agent                             |
| 🗓️ Create Monday.com Item | Monday.com API Node              | Creates task item on Monday.com board          | 🕵️‍♂️ AI Agent        | —                                           | MULTI-PLATFORM TASK CREATION: Creates Monday.com item with consistent metadata and due dates           |
| ✅ Create ClickUp Task   | ClickUp API Node                 | Creates task in ClickUp workspace               | 🕵️‍♂️ AI Agent        | —                                           | MULTI-PLATFORM TASK CREATION: Creates ClickUp task with priority and tags                              |
| 📌 Create HubSpot Task   | HubSpot API Node                 | Creates task engagement in HubSpot CRM          | 🕵️‍♂️ AI Agent        | —                                           | MULTI-PLATFORM TASK CREATION: Creates HubSpot CRM task with priority and due date                      |
| Sticky Note             | Sticky Note                     | Documentation and contextual notes              | —                    | —                                           | FORM CAPTURE & PRE-PROCESSING: Explains form and preprocessing nodes                                  |
| Sticky Note1            | Sticky Note                     | Documentation and contextual notes              | —                    | —                                           | AI-DRIVEN FEEDBACK INTELLIGENCE: Explains AI analysis and data processing nodes                        |
| Sticky Note2            | Sticky Note                     | Documentation and contextual notes              | —                    | —                                           | STRUCTURED OUTPUT FOR TASK SYSTEMS: Explains AI Agent and language model role                         |
| Sticky Note3            | Sticky Note                     | Documentation and contextual notes              | —                    | —                                           | MULTI-PLATFORM TASK CREATION: Explains task creation nodes integration                                |

---

### 4. Reproducing the Workflow from Scratch

**Step 1: Create the Form Trigger Node**  
- Add a **Form Trigger** node named "📝 On form submission".  
- Configure the form with title "Feedback Form" and description "Please Let us know about your concerns".  
- Add required fields:  
  - Text field "Name" (required)  
  - Textarea "Message" (required)  
  - Dropdown "Rating" with options 1, 2, 3, 4, 5 (required)  
  - Textarea "Product Service" (required)  
- Save and activate webhook.

**Step 2: Add a Code Node for Data Extraction**  
- Add a **Code** node named "🧪 Code".  
- Connect output of "📝 On form submission" to "🧪 Code".  
- Paste the following code (adjust as needed to match form field names):  
  ```javascript
  const raw = $input.first().json;

  return {
    review_text: raw.Message,
    customer_name: raw.Name,
    rating: parseInt(raw.Rating),
    product_service: raw["Product Service"],
  };
  ```  
- Set node version 2.

**Step 3: Add OpenAI GPT-4 Analysis Node**  
- Add a **Langchain OpenAI** node named "🧠 OpenAI Analysis".  
- Connect output of "🧪 Code" to "🧠 OpenAI Analysis".  
- Configure model to "gpt-4o-mini" or equivalent GPT-4 variant.  
- Set temperature to 0.3 for consistent output.  
- Use a system prompt that instructs the AI to produce a JSON with fields: sentiment, sentiment_score, category, priority, department, action_required, key_insights, suggested_response_tone, keywords, summary.  
- Use a user prompt with expressions to inject review data, e.g.:  
  ```
  Please analyze this customer review:

  Review: {{ $json.review_text }}
  Customer: {{ $json.customer_name }}
  Rating: {{ $json.rating }}/5
  Product/Service: {{ $json.product_service }}
  ```  
- Provide OpenAI API credentials.

**Step 4: Add Data Processing Code Node**  
- Add a **Code** node named "🧮 Data Processing".  
- Connect output of "🧠 OpenAI Analysis" to this node.  
- Paste JavaScript code that:  
  - Extracts original form data from "🧪 Code" node outputs.  
  - Parses AI response JSON safely with try/catch.  
  - Applies default/fallback values on failure.  
  - Computes due dates based on priority: high=1 day, medium=3 days, low=7 days.  
  - Constructs `task_title` and `task_description` with full metadata and insights.  
- Set node version 2.

**Step 5: Add AI Agent Node to Structure Task JSON**  
- Add a **Langchain AI Agent** node named "🕵️‍♂️ AI Agent".  
- Connect output of "🧮 Data Processing" to this node.  
- Configure the prompt to request a pure JSON object with fields: title, description, priority, due_date, and metadata containing customer_name, rating, product_service, review_date, sentiment, sentiment_score, category, department, action_required.  
- Enforce strict field order and no additional commentary.  
- Use GPT-4O-MINI model via an internal OpenAI Chat Model node (add if needed).  
- Provide OpenAI API credentials.

**Step 6: Add Monday.com Task Creation Node**  
- Add a **Monday.com** node named "🗓️ Create Monday.com Item".  
- Connect output of "🕵️‍♂️ AI Agent" to this node.  
- Configure board ID and group ID to your Monday.com board.  
- Map column values to the JSON output from AI Agent.  
- Provide Monday.com API credentials.

**Step 7: Add ClickUp Task Creation Node**  
- Add a **ClickUp** node named "✅ Create ClickUp Task".  
- Connect output of "🕵️‍♂️ AI Agent" to this node.  
- Configure list, team, space, and folder IDs as per your ClickUp workspace.  
- Set authentication to OAuth2.  
- Map custom fields JSON to AI Agent output.  
- Provide ClickUp OAuth2 credentials.

**Step 8: Add HubSpot Task Creation Node**  
- Add a **HubSpot** node named "📌 Create HubSpot Task".  
- Connect output of "🕵️‍♂️ AI Agent" to this node.  
- Set engagement type to "task".  
- Map body metadata to AI Agent output JSON.  
- Provide HubSpot app token credentials.

**Step 9: Add Sticky Notes for Documentation (Optional)**  
- Add Sticky Note nodes near each logical block to document the purpose of nodes and key notes as per the original workflow.

**Step 10: Test and Activate Workflow**  
- Test form submission to validate end-to-end processing.  
- Monitor logs for parsing errors or API failures.  
- Adjust prompts, credentials, or IDs as necessary.

---

### 5. General Notes & Resources

| Note Content                                                                                                         | Context or Link                                                                                  |
|----------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| AI ANALYSIS: Uses OpenAI GPT-4 to analyze sentiment, categorize feedback, and determine required actions. Adjust temperature for more/less creative responses. | Comments in 🧠 OpenAI Analysis node.                                                           |
| MONDAY.COM INTEGRATION: Creates item in Monday.com board. Update BOARD_ID and column IDs to match your board structure. | Comments in 🗓️ Create Monday.com Item node.                                                    |
| CLICKUP INTEGRATION: Creates task in ClickUp with priority mapping and keyword tagging. Update LIST_ID with your ClickUp list. | Comments in ✅ Create ClickUp Task node.                                                       |
| HUBSPOT INTEGRATION: Creates task in HubSpot CRM with priority mapping and due date. Requires HubSpot API key in credentials. | Comments in 📌 Create HubSpot Task node.                                                       |
| FORM CAPTURE & PRE-PROCESSING: Captures user feedback via a dynamic form and extracts the input fields (Name, Message, Rating, and Product Service). Passes clean, structured data to the AI for further analysis. This is the entry point for customer sentiment workflows. | Sticky Note near On form submission and Code nodes.                                           |
| AI-DRIVEN FEEDBACK INTELLIGENCE: Uses GPT-4 to analyze the customer review for sentiment, category, department, priority, and more. Then formats this output with due dates, task descriptions, and metadata. Ensures consistency and fallback handling for failed AI responses. | Sticky Note near OpenAI Analysis and Data Processing nodes.                                   |
| STRUCTURED OUTPUT FOR TASK SYSTEMS: Transforms enriched AI response into a clean, JSON-only object ready to be pushed into Monday.com, ClickUp, and HubSpot. Maintains strict field order, tone, and formatting. Acts as a bridge between data processing and task integrations. | Sticky Note near AI Agent and OpenAI Chat Model nodes.                                        |
| MULTI-PLATFORM TASK CREATION: Automatically sends analyzed feedback to Monday.com, ClickUp, and HubSpot with consistent metadata, due dates, and formatting. Integrations are toggleable as needed. | Sticky Note near Monday.com, ClickUp, and HubSpot task creation nodes.                         |

---

**Disclaimer:**  
The provided text is exclusively derived from an automated n8n workflow. It complies strictly with current content policies and contains no illegal, offensive, or protected material. All processed data is legal and public.