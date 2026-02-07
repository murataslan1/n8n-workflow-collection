AI Model Usage Dashboard: Track Token Metrics and Costs for LLM Workflows

https://n8nworkflows.xyz/workflows/ai-model-usage-dashboard--track-token-metrics-and-costs-for-llm-workflows-9497


# AI Model Usage Dashboard: Track Token Metrics and Costs for LLM Workflows

---

### 1. Workflow Overview

This workflow, titled **AI Model Usage Dashboard: Track Token Metrics and Costs for LLM Workflows**, is designed to collect, calculate, and visualize usage metrics and cost data for AI language model interactions within n8n. It targets users and teams running conversational AI or language model workflows who want detailed tracking of token consumption, sessions, and associated costs, presented in an interactive HTML dashboard.

The workflow is logically divided into three main blocks:

- **1.1 Input Reception & AI Processing**  
  Handles incoming chat messages, processes them through an AI agent with memory, and captures output and execution metadata.

- **1.2 Token & Cost Tracking Mini Workflow**  
  Extracts token usage data from AI executions, calculates costs based on pricing tables, and stores detailed records in data tables.

- **1.3 Dashboard Generation & Scheduling**  
  Periodically aggregates stored data, computes KPIs and trends, and generates an interactive dashboard served via webhook with charts and summary statistics.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception & AI Processing

**Overview:**  
This block receives chat messages, triggers AI processing with conversational memory, and prepares execution metadata for downstream token tracking.

**Nodes Involved:**  
- When chat message received  
- AI Agent  
- Simple Memory  
- OpenAI Chat Model  
- No Operation, do nothing1  
- Get Excution ID  
- Insert row2  
- Sticky Note3 (Chat Example comment)

**Node Details:**  

- **When chat message received**  
  - Type: `LangChain Chat Trigger`  
  - Role: Entry trigger node for incoming chat messages (webhook-based, public)  
  - Parameters: Default, listens for chat input events  
  - Output: Passes chat input JSON to AI Agent  
  - Edge cases: Possible webhook connectivity issues, malformed input

- **AI Agent**  
  - Type: `LangChain Agent`  
  - Role: Processes input text via AI model, generates output  
  - Parameters: Uses expression to respond to input: `"Réponds à ce message : \n{{ $json.chatInput }}"`  
  - Input: Chat input from previous node and memory context  
  - Output: AI-generated response JSON  
  - Edge cases: AI API errors, timeouts, prompt failures

- **Simple Memory**  
  - Type: `LangChain Memory Buffer Window`  
  - Role: Maintains conversational context for AI Agent  
  - Parameters: Default window, no special config  
  - Connected as AI memory input for AI Agent  
  - Edge cases: Memory overflow or state issues

- **OpenAI Chat Model**  
  - Type: `LangChain LM Chat OpenAI`  
  - Role: Provides the AI language model backend for agent  
  - Parameters: Model set to `gpt-4.1-mini` (custom selection list)  
  - Credentials: OpenAI API key configured  
  - Connected as AI language model for AI Agent  
  - Edge cases: API key errors, rate limits, model availability

- **No Operation, do nothing1**  
  - Type: `NoOp` (No Operation)  
  - Role: Placeholder node, passes data unchanged  
  - Connected after AI Agent for execution sequencing

- **Get Excution ID**  
  - Type: `Set`  
  - Role: Captures current workflow execution ID and model name for tracking  
  - Parameters: Assigns execution.id and OpenAI Chat Model's model name to variables  
  - Output: Used to insert records and reference executions downstream

- **Insert row2**  
  - Type: `Data Table`  
  - Role: Inserts a new record with chat input, output, sessionId, action, and executionId into the "Template - data" data table  
  - Parameters: Maps relevant fields from previous nodes  
  - Edge cases: Data table insert failures, schema mismatches

- **Sticky Note3**  
  - Role: Provides inline comment titled "Chat Example" for user reference

---

#### 1.2 Token & Cost Tracking Mini Workflow

**Overview:**  
This mini workflow extracts token usage and model info from AI execution data, merges pricing data, calculates costs, and updates the data table with token and cost metrics.

**Nodes Involved:**  
- Schedule Trigger  
- Get row(s)  
- Loop Over Items  
- Get an execution  
- Model/Token Info  
- Get row(s)3  
- Merge1  
- Code in JavaScript1  
- Update row(s)  
- No Operation, do nothing  
- Insert row1  
- Edit Fields1  
- Sticky Note1 (Mini Workflow comment)  
- Sticky Note (LLM Pricing Table comment)

**Node Details:**  

- **Schedule Trigger**  
  - Type: `Schedule Trigger`  
  - Role: Runs every 30 minutes to update token and cost data  
  - Parameters: Interval set to every 30 minutes

- **Get row(s)**  
  - Type: `Data Table` (read)  
  - Role: Retrieves all rows from the "Template - data" table where modelName is empty (i.e., unprocessed records)  
  - Parameters: Filter condition `modelName is empty`  
  - Output: List of unprocessed messages for token cost calculation

- **Loop Over Items**  
  - Type: `Split In Batches`  
  - Role: Processes each message record individually for detailed data retrieval and update  
  - Parameters: Default batch size

- **Get an execution**  
  - Type: `n8n API`  
  - Role: Retrieves detailed execution data for the given executionId to extract token usage  
  - Parameters: Uses executionId from current item  
  - Credentials: n8n API credentials configured  
  - Edge cases: Execution not found, API errors

- **Model/Token Info**  
  - Type: `Set`  
  - Role: Extracts token usage and model name from execution data JSON structure  
  - Parameters: Assigns model_name, completionTokens, promptTokens, totalTokens, executionId from execution data  
  - Output: Structured token usage record

- **Get row(s)3**  
  - Type: `Data Table` (read)  
  - Role: Retrieves model pricing info from "Model - Price" data table  
  - Output: All model price entries for cost calculation

- **Merge1**  
  - Type: `Merge` (combine mode)  
  - Role: Joins token usage data with corresponding model pricing by model name  
  - Parameters: Merge by fields `name` (price table) and `model_name` (token usage)  
  - Edge cases: Missing price entries cause incomplete cost data

- **Code in JavaScript1**  
  - Type: `Code` (JavaScript)  
  - Role: Calculates the global cost per message based on token counts and prices  
  - Logic: `globalCost = (completionTokens * completionTokensPrice) + (promptTokens * promptTokensPrice)`  
  - Output: Adds `globalCost` field to item JSON

- **Update row(s)**  
  - Type: `Data Table` (update)  
  - Role: Updates the original message record in "Template - data" with token usage and cost data  
  - Parameters: Filters by executionId, updates token and cost fields  
  - Edge cases: Update failures, concurrency issues

- **No Operation, do nothing**  
  - Type: `NoOp`  
  - Role: Placeholder, linked in parallel path for any required sequencing

- **Insert row1**  
  - Type: `Data Table` (insert)  
  - Role: Inserts pricing data for models into "Model - Price" data table (seed data)  
  - Parameters: Maps name, promptTokensPrice, completionTokensPrice from pinned data  
  - Edge cases: Duplicate inserts, data integrity

- **Edit Fields1**  
  - Type: `Set`  
  - Role: Empty set node, likely placeholder or reset step after insert row1

- **Sticky Note1**  
  - Role: Comment titled "Mini Workflow — Token Tracking"

- **Sticky Note**  
  - Role: Comment titled "LLM Pricing Table for n8n"

---

#### 1.3 Dashboard Generation & Scheduling

**Overview:**  
This block generates an interactive HTML dashboard summarizing key performance indicators (KPIs) and historical usage charts, served in response to a webhook call. It includes a scheduled trigger for periodic data refresh.

**Nodes Involved:**  
- Schedule Trigger  
- Get row(s)1  
- Code in JavaScript  
- Respond to Webhook  
- Webhook  
- Sticky Note2 (Generate Dashboard comment)  
- Sticky Note4 (n8n AI Workflow Dashboard intro)  
- Sticky Note5 (Setup & Run instructions)

**Node Details:**  

- **Schedule Trigger**  
  - Same node as in 1.2 (runs every 30 minutes) to trigger data refresh

- **Get row(s)1**  
  - Type: `Data Table` (read)  
  - Role: Retrieves all records from "Template - data" table for dashboard aggregation

- **Code in JavaScript**  
  - Type: `Code` (JavaScript)  
  - Role: Calculates dashboard KPIs such as total messages, unique sessions, total tokens, average tokens per conversation, total cost, and average cost per conversation  
  - Also compiles daily historical statistics for charts  
  - Generates fully styled HTML page with embedded Chart.js charts visualizing data  
  - Output: HTML content returned as binary data

- **Respond to Webhook**  
  - Type: `Respond to Webhook`  
  - Role: Sends HTML dashboard as HTTP response to webhook request  
  - Parameters: Responds with binary data from previous node

- **Webhook**  
  - Type: `Webhook`  
  - Role: HTTP endpoint serving the dashboard  
  - Parameters: Path set to unique ID, response mode set to respond with node output

- **Sticky Note2**  
  - Role: Comment titled "Generate Dashboard"

- **Sticky Note4**  
  - Role: Introductory comment describing the workflow purpose and features

- **Sticky Note5**  
  - Role: Setup and run instructions for users

---

### 3. Summary Table

| Node Name                  | Node Type                                | Functional Role                               | Input Node(s)                     | Output Node(s)                        | Sticky Note                                                                                   |
|----------------------------|-----------------------------------------|----------------------------------------------|----------------------------------|-------------------------------------|-----------------------------------------------------------------------------------------------|
| When chat message received  | LangChain Chat Trigger                   | Entry point for incoming chat messages       |                                  | AI Agent                           |                                                                                               |
| AI Agent                   | LangChain Agent                         | Processes chat input with AI and memory      | When chat message received, Simple Memory, OpenAI Chat Model | No Operation, do nothing1, Get Excution ID |                                                                                               |
| Simple Memory              | LangChain Memory Buffer Window          | Maintains conversation context                |                                  | AI Agent                          |                                                                                               |
| OpenAI Chat Model          | LangChain LM Chat OpenAI                 | AI Language model backend                      |                                  | AI Agent                          |                                                                                               |
| No Operation, do nothing1  | No Operation                            | Placeholder, passes data unchanged            | AI Agent                         | Get Excution ID                   |                                                                                               |
| Get Excution ID            | Set                                     | Captures execution metadata                    | No Operation, do nothing1        | Insert row2                      |                                                                                               |
| Insert row2                | Data Table (Insert)                     | Stores chat message and execution metadata    | Get Excution ID                  |                                 |                                                                                               |
| Schedule Trigger           | Schedule Trigger                        | Triggers token update workflow every 30 mins |                                  | Get row(s)                       |                                                                                               |
| Get row(s)                 | Data Table (Get)                       | Gets unprocessed chat message records         | Schedule Trigger                 | Loop Over Items                  |                                                                                               |
| Loop Over Items            | Split In Batches                       | Processes each message record                  | Get row(s)                      | No Operation, do nothing, Get an execution |                                                                                               |
| Get an execution           | n8n API (Execution Get)                 | Retrieves detailed execution data              | Loop Over Items                 | Model/Token Info                |                                                                                               |
| Model/Token Info           | Set                                     | Extracts token usage and model name            | Get an execution                | Get row(s)3, Merge1            |                                                                                               |
| Get row(s)3                | Data Table (Get)                       | Retrieves model pricing table                   | Model/Token Info               | Merge1                         |                                                                                               |
| Merge1                    | Merge (Combine)                        | Joins token data with model pricing            | Model/Token Info, Get row(s)3    | Code in JavaScript1             |                                                                                               |
| Code in JavaScript1        | Code (JavaScript)                      | Calculates global cost for tokens              | Merge1                          | Update row(s)                  |                                                                                               |
| Update row(s)              | Data Table (Update)                    | Updates message records with token and cost   | Code in JavaScript1             | Loop Over Items                |                                                                                               |
| No Operation, do nothing   | No Operation                           | Placeholder node                               | Loop Over Items                |                                 |                                                                                               |
| Insert row1                | Data Table (Insert)                    | Inserts model pricing data                      | Edit Fields1                   | Edit Fields1                  |                                                                                               |
| Edit Fields1               | Set                                     | Placeholder/Reset node                         | Insert row1                   |                                 |                                                                                               |
| Get row(s)1                | Data Table (Get)                       | Retrieves all message records for dashboard   | Edit Fields                   | Code in JavaScript             |                                                                                               |
| Code in JavaScript         | Code (JavaScript)                      | Aggregates KPIs and constructs HTML dashboard | Get row(s)1                   | Respond to Webhook             |                                                                                               |
| Respond to Webhook         | Respond to Webhook                     | Sends dashboard HTML response                   | Code in JavaScript             |                                 |                                                                                               |
| Webhook                   | Webhook                                | HTTP endpoint serving dashboard                 |                                 | Edit Fields                   |                                                                                               |
| Sticky Note1              | Sticky Note                            | "Mini Workflow — Token Tracking" comment       |                                 |                                 |                                                                                               |
| Sticky Note               | Sticky Note                            | "LLM Pricing Table for n8n" comment             |                                 |                                 |                                                                                               |
| Sticky Note2              | Sticky Note                            | "Generate Dashboard" comment                     |                                 |                                 |                                                                                               |
| Sticky Note3              | Sticky Note                            | "Chat Example" comment                           |                                 |                                 |                                                                                               |
| Sticky Note4              | Sticky Note                            | Introductory comment describing workflow purpose |                                 |                                 | ## 🤖 n8n AI Workflow Dashboard\n\n### This template helps you collect and visualize data from your AI workflows in a simple and interactive way.\n\n- Track messages, sessions, tokens, and costs for each model.\n- Interactive HTML dashboard with KPIs: messages, sessions, tokens, and costs.\n- Compatible with any AI Agent or RAG workflow in n8n.\n\n### Use this dashboard to monitor AI activity and usage metrics at a glance, and easily identify trends or anomalies in your workflows. |
| Sticky Note5              | Sticky Note                            | Setup & Run instructions                         |                                 |                                 | ## ⚙️ Setup & Run\n\n### Follow these steps to get your workflow up and running in n8n:\n\n- Import the JSON workflow into your n8n instance.\n- Create the Model price and Messages tables.\n- Import token cost data for your LLM models (LLM Pricing).\n- Configure the “chat message” node according to your input channels.\n- Once messages are collected, the Token Tracking sub-workflow calculates token usage and costs.\n- Visualize the dashboard using the HTML response returned by the webhook.\n\n### After setup, your workflow will automatically track AI activity, compute costs, and provide a live dashboard to monitor all your KPIs. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Chat Input Trigger**  
   - Add a **LangChain Chat Trigger** node named `When chat message received`.  
   - Set webhook to public and default options.

2. **Add AI Agent with Memory**  
   - Add **LangChain Memory Buffer Window** node named `Simple Memory` with default settings.  
   - Add **OpenAI Chat Model** node named `OpenAI Chat Model`, select model `gpt-4.1-mini`, and configure with your OpenAI API credentials.  
   - Add **LangChain Agent** node named `AI Agent`. Set prompt text to `Réponds à ce message : \n{{ $json.chatInput }}`.  
   - Connect `When chat message received` → `AI Agent`.  
   - Connect `Simple Memory` as AI memory input.  
   - Connect `OpenAI Chat Model` as AI language model input.

3. **Execution Metadata Capture**  
   - Add a **No Operation** node named `No Operation, do nothing1` connected after `AI Agent`.  
   - Add a **Set** node named `Get Excution ID` to capture `id` as `{{$execution.id}}` and `model` as selected model name from `OpenAI Chat Model`. Connect `No Operation, do nothing1` → `Get Excution ID`.

4. **Insert Chat & Execution Data**  
   - Create a **Data Table** node named `Insert row2`. Configure it to insert into your "Template - data" table.  
   - Map columns: action, output, chatInput, sessionId from `When chat message received`, executionId from `Get Excution ID`.  
   - Connect `Get Excution ID` → `Insert row2`.

5. **Seed Model Pricing Data**  
   - Add a **Data Table** node named `Insert row1` for inserting pricing data into "Model - Price".  
   - Use pinned data with model names and token prices.  
   - Connect `Insert row1` → a **Set** node `Edit Fields1` (empty set). This node finalizes the insert process.

6. **Schedule Token Tracking Workflow**  
   - Add a **Schedule Trigger** node set to run every 30 minutes.  
   - Connect it to a **Data Table** node `Get row(s)` fetching records from "Template - data" where `modelName` is empty.

7. **Process Each Unprocessed Record**  
   - Add a **Split In Batches** node `Loop Over Items` connected to `Get row(s)`.  
   - For each item, add an n8n API node `Get an execution` to fetch execution details using `executionId`.  
   - Connect `Loop Over Items` → `Get an execution`.

8. **Extract Token Usage**  
   - Add a **Set** node `Model/Token Info` that extracts:  
     - `model_name` from execution data  
     - `completionTokens`, `promptTokens`, `totalTokens` from nested JSON tokenUsage  
     - `executionId`  
   - Connect `Get an execution` → `Model/Token Info`.

9. **Fetch Model Prices**  
   - Add a **Data Table** node `Get row(s)3` to get all rows from "Model - Price".  
   - Connect `Model/Token Info` → `Get row(s)3`.

10. **Merge Token Data with Pricing**  
    - Add a **Merge** node `Merge1` in combine mode, merging by fields `name` (price) and `model_name` (token info).  
    - Connect `Model/Token Info` and `Get row(s)3` to `Merge1`.

11. **Calculate Global Cost**  
    - Add a **Code** node `Code in JavaScript1` with JS code to calculate:  
      `globalCost = (completionTokens * completionTokensPrice) + (promptTokens * promptTokensPrice)`  
    - Connect `Merge1` → `Code in JavaScript1`.

12. **Update Records with Token & Cost Data**  
    - Add a **Data Table** update node `Update row(s)` to update the original message record, filtered by `executionId`.  
    - Map token and cost fields to update.  
    - Connect `Code in JavaScript1` → `Update row(s)` → `Loop Over Items` (to continue processing next batch).

13. **Dashboard Data Aggregation**  
    - Add a **Data Table** node `Get row(s)1` to retrieve all messages from "Template - data".  
    - Connect `Get row(s)1` → **Code** node `Code in JavaScript` which:  
      - Calculates KPIs (total messages, unique sessions, tokens, cost, averages)  
      - Aggregates daily data for charts  
      - Generates an interactive HTML page with embedded Chart.js  
    - Connect `Code in JavaScript` → **Respond to Webhook** node `Respond to Webhook`.

14. **Webhook for Dashboard**  
    - Add a **Webhook** node named `Webhook` with path set uniquely (e.g., `176f23d4-71b3-41e0-9364-43bea6be01d3`).  
    - Set response mode to respond with node.  
    - Connect `Webhook` → `Edit Fields` (empty or placeholder) → `Get row(s)1` (starting the dashboard data flow).

15. **Add Sticky Notes**  
    - Add sticky notes for explanations: workflow purpose, mini workflow token tracking, LLM pricing table, dashboard generation, and setup instructions at appropriate positions.

16. **Credentials Setup**  
    - Configure OpenAI credentials in `OpenAI Chat Model`.  
    - Configure n8n API credentials in `Get an execution`.  
    - Ensure data tables "Template - data" and "Model - Price" exist with correct schema.

---

### 5. General Notes & Resources

| Note Content                                                                                                                         | Context or Link                                                                                                           |
|--------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------|
| This template helps you collect and visualize data from your AI workflows in a simple and interactive way. Track messages, tokens, sessions, and costs with a live dashboard. | Sticky Note4 (Introductory description)                                                                                    |
| Follow setup instructions: import workflow JSON, create necessary data tables, import model pricing, configure chat inputs, and use the webhook to view dashboard. | Sticky Note5 (Setup & Run instructions)                                                                                    |
| Dashboard HTML uses Chart.js 3.9.1 and FontAwesome 6.4.0 for charts and icons. The page supports light/dark theme toggling.           | Embedded in Code in JavaScript node generating the dashboard                                                               |
| Compatible with any AI Agent or RAG workflows in n8n; token tracking logic depends on execution data standard structure.              | Sticky Note4 (Introductory description)                                                                                    |
| Token cost calculation uses prompt and completion token prices per model stored in the "Model - Price" data table; ensure prices are accurate and updated. | Sticky Note1 and Sticky Note (LLM Pricing Table)                                                                           |

---

**Disclaimer:** The text provided is exclusively derived from an automated n8n workflow. It complies with all relevant content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.