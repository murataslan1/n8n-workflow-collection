AI-Powered Contact Intelligence & Enrichment with OpenAI/Anthropic and Supabase

https://n8nworkflows.xyz/workflows/ai-powered-contact-intelligence---enrichment-with-openai-anthropic-and-supabase-9699


# AI-Powered Contact Intelligence & Enrichment with OpenAI/Anthropic and Supabase

### 1. Workflow Overview

This workflow, titled **AI Contact Enrichment**, is designed to automatically enhance incoming contact data using AI-powered insights from providers such as OpenAI or Anthropic. It targets sales and marketing teams who need enriched contact profiles including job roles, company details, and buyer personas.

The workflow consists of the following logical blocks:

- **1.1 Input Reception:** Receiving and initial processing of incoming contact data via a webhook.
- **1.2 AI Preparation:** Setting up AI provider configuration and preparing the request payload.
- **1.3 AI Processing:** Calling the AI API to enrich the contact data.
- **1.4 Data Persistence:** Logging the enriched data and AI response into a Supabase database.
- **1.5 Response Formatting:** Sending a success response after the workflow completes.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
This block receives incoming contact data via an HTTP webhook and processes it by adding an identifier and timestamp.

**Nodes Involved:**  
- Webhook Trigger  
- Process Data

**Node Details:**

- **Webhook Trigger**  
  - *Type:* Webhook Trigger  
  - *Role:* Entry point that listens for HTTP POST requests at the path `/contact-enrichment`.  
  - *Configuration:*  
    - Webhook path: `contact-enrichment`  
    - No authentication or additional options set.  
  - *Connections:* Outputs data to `Process Data`.  
  - *Failure cases:* Network issues, invalid HTTP method or payload; no auth configured so open endpoint.  
  - *Version:* 1

- **Process Data**  
  - *Type:* Code node  
  - *Role:* Enhances the raw input by adding a unique ID (based on timestamp) and a current ISO timestamp.  
  - *Configuration:*  
    - JavaScript code creates a data object merging input JSON with `id` and `timestamp` fields.  
  - *Key expressions:*  
    - `Date.now().toString()` for unique ID  
    - `new Date().toISOString()` for timestamp  
  - *Connections:* Outputs enhanced data to `Prepare AI Request`.  
  - *Failure cases:* Unexpected input format causing code errors; timestamp generation unlikely to fail.  
  - *Version:* 2

#### 1.2 AI Preparation

**Overview:**  
This block prepares the AI provider configuration dynamically based on environment variables and packages the data for AI consumption.

**Nodes Involved:**  
- Prepare AI Request

**Node Details:**

- **Prepare AI Request**  
  - *Type:* Code node  
  - *Role:* Reads environment variables to configure AI provider, API key, model, and endpoint; packages these with the contact data.  
  - *Configuration:*  
    - Uses environment variables: `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`, `AI_ENDPOINT`  
    - Defaults: `openai` for provider, `gpt-3.5-turbo` for model if env vars are missing.  
  - *Key expressions:*  
    - `$env` for environment variable access  
  - *Connections:* Passes configuration and data to `Call AI API`.  
  - *Failure cases:* Missing or invalid environment variables causing incomplete config; potential for undefined keys.  
  - *Version:* 2

#### 1.3 AI Processing

**Overview:**  
This block sends the enriched contact data to the selected AI provider via HTTP request and receives AI-generated insights.

**Nodes Involved:**  
- Call AI API

**Node Details:**

- **Call AI API**  
  - *Type:* HTTP Request node  
  - *Role:* Sends a POST request to either OpenAI’s API endpoint or a custom AI endpoint for chat completions.  
  - *Configuration:*  
    - URL selected dynamically: OpenAI URL if provider is `openai`, else custom endpoint.  
    - Headers: `Content-Type: application/json`, `Authorization: Bearer <API_KEY>`  
    - Body parameters: `model` and `messages` (messages contain the JSON stringified contact data inside a user role chat message).  
    - Authentication: HTTP Header using generic credentials stored in n8n (credential named `Supabase API` is not used here; likely a separate credential for AI API is expected but not explicitly referenced).  
  - *Key expressions:*  
    - Dynamic URL and header values based on JSON data from previous node.  
    - `messages` array includes a single user message with contact data as a JSON string.  
  - *Connections:* Outputs AI response JSON to `Save to Supabase`.  
  - *Failure cases:*  
    - HTTP errors (401 Unauthorized if API key invalid, 429 rate limiting, 500 server errors)  
    - Timeout or malformed responses  
    - Incorrect model or endpoint parameters  
  - *Version:* 4

#### 1.4 Data Persistence

**Overview:**  
Logs the workflow name, input data, AI response, and timestamp into a Supabase table for auditing and later reference.

**Nodes Involved:**  
- Save to Supabase

**Node Details:**

- **Save to Supabase**  
  - *Type:* Supabase node  
  - *Role:* Inserts a new record into the table `workflow_logs` with relevant workflow execution data.  
  - *Configuration:*  
    - Table: `workflow_logs`  
    - Columns: `workflow_name`, `data`, `ai_response`, `created_at`  
    - Values:  
      - `workflow_name`: static string `"AI Contact Enrichment"`  
      - `data`: JSON stringified input and intermediate data  
      - `ai_response`: JSON stringified AI API response  
      - `created_at`: current ISO timestamp  
    - Credentials: Uses stored Supabase API credentials.  
  - *Connections:* Outputs to `Format Response`.  
  - *Failure cases:*  
    - Database connection errors, wrong table or column names, permission issues with API key.  
  - *Version:* 1

#### 1.5 Response Formatting

**Overview:**  
Returns a simple JSON success response indicating workflow completion.

**Nodes Involved:**  
- Format Response

**Node Details:**

- **Format Response**  
  - *Type:* Code node  
  - *Role:* Creates a JSON object confirming success, workflow name, and timestamp to send back as response.  
  - *Configuration:*  
    - Static JSON response including success status and timestamp.  
  - *Connections:* This is the final node in the chain, no outputs.  
  - *Failure cases:* Minimal; mainly syntax errors if code is modified.  
  - *Version:* 2

---

### 3. Summary Table

| Node Name       | Node Type          | Functional Role                     | Input Node(s)    | Output Node(s)       | Sticky Note                                                                                      |
|-----------------|--------------------|-----------------------------------|------------------|----------------------|-------------------------------------------------------------------------------------------------|
| Webhook Trigger | Webhook Trigger    | Receives incoming contact data    |                  | Process Data         | ## 🔍 AI Contact Enrichment Workflow Purpose and features overview                              |
| Process Data    | Code               | Adds ID and timestamp to data     | Webhook Trigger  | Prepare AI Request    | ## 🔍 AI Contact Enrichment Workflow Purpose and features overview                              |
| Prepare AI Request | Code             | Prepares AI provider config       | Process Data     | Call AI API          | ## 📋 Setup Required Environment variables and credentials details                             |
| Call AI API     | HTTP Request       | Sends data to AI provider         | Prepare AI Request | Save to Supabase    | ## 🔄 Workflow flow steps 1-6 with output description                                          |
| Save to Supabase| Supabase           | Logs data and AI response to DB   | Call AI API      | Format Response      | ## 🔄 Workflow flow steps 1-6 with output description                                          |
| Format Response | Code               | Returns success response           | Save to Supabase |                      | ## 🔄 Workflow flow steps 1-6 with output description                                          |
| Sticky Note     | Sticky Note        | Overview of workflow purpose       |                  |                      | ## 🔍 AI Contact Enrichment Workflow Purpose and features overview                              |
| Sticky Note1    | Sticky Note        | Setup instructions and env vars   |                  |                      | ## 📋 Setup Required Environment variables and credentials details                             |
| Sticky Note2    | Sticky Note        | Summary of workflow flow           |                  |                      | ## 🔄 Workflow flow steps 1-6 with output description                                          |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Trigger Node**
   - Type: Webhook  
   - Set Path: `contact-enrichment`  
   - Method: POST (default)  
   - No authentication configured (open endpoint)  
   - Position on canvas: approx. [250, 300]

2. **Create Process Data Node**
   - Type: Code  
   - Connect input from `Webhook Trigger`  
   - Code:
     ```javascript
     const data = {
       id: Date.now().toString(),
       ...$input.item.json,
       timestamp: new Date().toISOString()
     };
     return { json: data };
     ```
   - Position: [450, 300]

3. **Create Prepare AI Request Node**
   - Type: Code  
   - Connect input from `Process Data`  
   - Code:
     ```javascript
     const aiConfig = {
       provider: $env.AI_PROVIDER || 'openai',
       apiKey: $env.AI_API_KEY,
       model: $env.AI_MODEL || 'gpt-3.5-turbo',
       endpoint: $env.AI_ENDPOINT
     };
     return { json: { aiConfig, data: $json } };
     ```
   - Position: [650, 300]

4. **Create Call AI API Node**
   - Type: HTTP Request  
   - Connect input from `Prepare AI Request`  
   - Method: POST  
   - URL: Use expression:
     ```
     {{$json.aiConfig.provider === 'openai' ? 'https://api.openai.com/v1/chat/completions' : $json.aiConfig.endpoint}}
     ```
   - Authentication: Generic Credential (HTTP Header Auth) — create or assign a credential with header `Authorization: Bearer <API_KEY>`  
   - Headers:  
     - Content-Type: application/json  
     - Authorization: `=Bearer {{$json.aiConfig.apiKey}}`  
   - Body Parameters (JSON):  
     - model: `={{$json.aiConfig.model}}`  
     - messages: `={{JSON.stringify([{role: 'user', content: JSON.stringify($json.data)}])}}`  
   - Position: [850, 300]

5. **Create Save to Supabase Node**
   - Type: Supabase  
   - Connect input from `Call AI API`  
   - Operation: Insert  
   - Table: `workflow_logs`  
   - Columns: `workflow_name`, `data`, `ai_response`, `created_at`  
   - Values:  
     - workflow_name: `"AI Contact Enrichment"` (static string)  
     - data: `={{JSON.stringify($json)}}` (input data)  
     - ai_response: `={{JSON.stringify($json)}}` (AI API response)  
     - created_at: `={{new Date().toISOString()}}`  
   - Credentials: select existing Supabase API credentials configured with correct access rights  
   - Position: [1050, 300]

6. **Create Format Response Node**
   - Type: Code  
   - Connect input from `Save to Supabase`  
   - Code:
     ```javascript
     return { json: { success: true, workflow: 'AI Contact Enrichment', timestamp: new Date().toISOString() } };
     ```
   - Position: [1250, 300]

7. **Set Execution Order:**
   - Webhook Trigger → Process Data → Prepare AI Request → Call AI API → Save to Supabase → Format Response

8. **Environment Variables Setup:**
   - `AI_PROVIDER` (e.g., `openai` or `anthropic`)  
   - `AI_API_KEY` (your AI provider API key)  
   - `AI_MODEL` (e.g., `gpt-3.5-turbo`, `gpt-4`)  
   - `AI_ENDPOINT` (optional, for non-OpenAI providers)

9. **Credentials Setup:**
   - Create generic HTTP header auth credential for AI API calls (if not using OpenAI official node)  
   - Create Supabase API credential with insert permissions on `workflow_logs`

10. **Optional: Add Sticky Notes for Documentation**
    - Overview: Purpose and features  
    - Setup instructions: Environment variables and database table requirements  
    - Workflow flow summary: Step-by-step process outline

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                     | Context or Link                                  |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------|
| Workflow supports multiple AI providers dynamically, enabling using OpenAI, Anthropic, or custom AI endpoints.                                                 | Environment variable-based AI provider selection |
| Workflow logs all input and AI responses into a Supabase database for auditability and traceability.                                                             | Database design and logging best practices       |
| Recommended environment variables and credential setup are critical for smooth operation and security.                                                          | See Sticky Note1 for detailed setup instructions |
| Useful for sales and marketing teams aiming to enrich contact data automatically with AI-driven insights including persona generation and company details.     | Sticky Note overview                              |

---

**Disclaimer:** The provided text is exclusively generated from a workflow automated with n8n, respecting all applicable content policies. It contains no illegal, offensive, or protected elements. All processed data are legal and publicly accessible.