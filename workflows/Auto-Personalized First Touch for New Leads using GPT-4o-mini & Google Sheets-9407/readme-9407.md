Auto-Personalized First Touch for New Leads using GPT-4o-mini & Google Sheets

https://n8nworkflows.xyz/workflows/auto-personalized-first-touch-for-new-leads-using-gpt-4o-mini---google-sheets-9407


# Auto-Personalized First Touch for New Leads using GPT-4o-mini & Google Sheets

### 1. Workflow Overview

This workflow automates the generation of personalized first-touch messages for new leads by integrating Google Sheets data with AI-driven content creation using GPT-4o-mini. It targets sales and marketing teams seeking to automatically research and craft tailored outreach messages, thereby increasing engagement efficiency.

The workflow is logically divided into these blocks:

- **1.1 Input Reception and Data Fetching:** Manual trigger initiates the workflow, which then fetches leads data from a Google Sheet.
- **1.2 Lead Processing Control:** Splits the list of leads into individual batches for sequential processing.
- **1.3 AI Research & Personalization:** Uses a LangChain AI agent with GPT-4o-mini to research and generate personalized messages for each lead.
- **1.4 Response Parsing and Data Writing:** Parses the AI-generated response and writes the personalized message back to the Google Sheet.
  
---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception and Data Fetching

- **Overview:** Initiates the workflow manually and retrieves lead data from Google Sheets.
- **Nodes Involved:** 
  - When clicking ‘Execute workflow’
  - Fetch Leads from Google Sheet

##### Node: When clicking ‘Execute workflow’
- **Type & Role:** Manual Trigger — starts the workflow manually.
- **Configuration:** Default manual trigger with no parameters.
- **Key Expressions/Variables:** None.
- **Inputs:** None (trigger).
- **Outputs:** Leads to "Fetch Leads from Google Sheet".
- **Edge Cases:** User forgetting to trigger manually; no data fetched if sheet is empty.
- **Version:** n8n v1+ compatible.
- **Sub-workflow:** None.

##### Node: Fetch Leads from Google Sheet
- **Type & Role:** Google Sheets node — reads lead data.
- **Configuration:** Reads rows from a predefined Google Sheet containing new leads.
- **Key Expressions/Variables:** Uses Google Sheets credentials; sheet and range parameters configured (details not shown in JSON).
- **Inputs:** Triggered from manual trigger.
- **Outputs:** Outputs array of leads to "Process Leads One by One".
- **Edge Cases:** Authentication errors, empty sheet, API rate limits, incorrect sheet/range configuration.
- **Version:** Requires Google Sheets node v4.7 or later.
- **Sub-workflow:** None.

---

#### 1.2 Lead Processing Control

- **Overview:** Splits the fetched leads into individual batches for sequential AI processing.
- **Nodes Involved:** 
  - Process Leads One by One

##### Node: Process Leads One by One
- **Type & Role:** SplitInBatches — handles lead records one at a time.
- **Configuration:** Splits input data into batches of size one (default for “process one by one”).
- **Key Expressions/Variables:** None explicitly configured.
- **Inputs:** Receives array of leads from "Fetch Leads from Google Sheet".
- **Outputs:** Sends individual lead records to "AI Research & Personalization Agent".
- **Edge Cases:** Batch size misconfiguration, empty input, potential performance delays on many leads.
- **Version:** n8n v3+ recommended.
- **Sub-workflow:** None.

---

#### 1.3 AI Research & Personalization

- **Overview:** Uses a LangChain AI agent backed by the GPT-4o-mini language model to generate personalized outreach messages for each lead.
- **Nodes Involved:** 
  - AI Research & Personalization Agent
  - GPT-4o Mini Language Model

##### Node: AI Research & Personalization Agent
- **Type & Role:** LangChain Agent — orchestrates AI content generation workflow.
- **Configuration:** Configured to receive single lead data, use the GPT-4o Mini LM, and apply prompt templates or chains for research and personalization.
- **Key Expressions/Variables:** Input lead data passed as context; outputs AI-generated messages.
- **Inputs:** Receives single lead from "Process Leads One by One".
- **Outputs:** AI response sent to "Parse AI Response to Fields".
- **Edge Cases:** AI timeouts, malformed input, API quota limits, unexpected AI outputs.
- **Version:** LangChain Node v2.2 required.
- **Sub-workflow:** None.

##### Node: GPT-4o Mini Language Model
- **Type & Role:** Azure OpenAI Chat Language Model — provides GPT-4o-mini chat completions.
- **Configuration:** Uses Azure OpenAI credentials; model parameter set to GPT-4o-mini.
- **Key Expressions/Variables:** Receives prompt from LangChain Agent.
- **Inputs:** Invoked via ai_languageModel input from the LangChain Agent node.
- **Outputs:** Returns chat completion to LangChain Agent.
- **Edge Cases:** API authentication failure, network issues, model unavailable.
- **Version:** LangChain LM node v1+ for Azure OpenAI.
- **Sub-workflow:** None.

---

#### 1.4 Response Parsing and Data Writing

- **Overview:** Parses the AI-generated text response into structured fields and writes personalized messages back to the Google Sheet.
- **Nodes Involved:** 
  - Parse AI Response to Fields
  - Write Message Back to Sheet

##### Node: Parse AI Response to Fields
- **Type & Role:** Code node — transforms AI text output into structured JSON fields.
- **Configuration:** Custom JavaScript code to parse the AI response string, extract message content and other relevant fields.
- **Key Expressions/Variables:** Uses input JSON from AI agent; outputs structured data.
- **Inputs:** AI-generated response from "AI Research & Personalization Agent".
- **Outputs:** Parsed fields sent to "Write Message Back to Sheet".
- **Edge Cases:** Parsing errors if AI output format changes; empty or malformed AI response.
- **Version:** n8n code node v2+.
- **Sub-workflow:** None.

##### Node: Write Message Back to Sheet
- **Type & Role:** Google Sheets node — updates the original sheet row with personalized message.
- **Configuration:** Writes parsed message fields into specific columns corresponding to each lead row.
- **Key Expressions/Variables:** Uses Google Sheets credentials; writes to designated sheet/range.
- **Inputs:** Receives parsed fields from "Parse AI Response to Fields".
- **Outputs:** Triggers next batch in "Process Leads One by One" (loop continuation).
- **Edge Cases:** Write permission errors, sheet locking, rate limits.
- **Version:** Google Sheets node v4.7+.
- **Sub-workflow:** None.

---

### 3. Summary Table

| Node Name                     | Node Type                           | Functional Role                               | Input Node(s)                  | Output Node(s)                   | Sticky Note                          |
|-------------------------------|----------------------------------|----------------------------------------------|-------------------------------|---------------------------------|------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger                   | Starts the workflow                           | None                          | Fetch Leads from Google Sheet    |                                    |
| Fetch Leads from Google Sheet   | Google Sheets                   | Reads leads data from Google Sheet           | When clicking ‘Execute workflow’ | Process Leads One by One         |                                    |
| Process Leads One by One        | SplitInBatches                   | Processes leads individually                  | Fetch Leads from Google Sheet  | AI Research & Personalization Agent |                                    |
| AI Research & Personalization Agent | LangChain Agent                 | Generates personalized messages using AI     | Process Leads One by One       | Parse AI Response to Fields      |                                    |
| GPT-4o Mini Language Model     | LangChain LM (Azure OpenAI)      | Provides GPT-4o-mini model completions        | AI Research & Personalization Agent (ai_languageModel) | AI Research & Personalization Agent |                                    |
| Parse AI Response to Fields    | Code                            | Parses AI response into structured fields     | AI Research & Personalization Agent | Write Message Back to Sheet      |                                    |
| Write Message Back to Sheet    | Google Sheets                   | Writes personalized messages back to Sheet   | Parse AI Response to Fields    | Process Leads One by One         |                                    |
| Sticky Note 1                 | Sticky Note                      | Unused content note                           | None                          | None                            |                                    |
| Sticky Note 2                 | Sticky Note                      | Unused content note                           | None                          | None                            |                                    |
| Sticky Note 3                 | Sticky Note                      | Unused content note                           | None                          | None                            |                                    |
| Sticky Note 4                 | Sticky Note                      | Unused content note                           | None                          | None                            |                                    |
| Sticky Note 5                 | Sticky Note                      | Unused content note                           | None                          | None                            |                                    |
| Sticky Note 6                 | Sticky Note                      | Unused content note                           | None                          | None                            |                                    |
| Sticky Note Overview          | Sticky Note                      | Unused content note                           | None                          | None                            |                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**
   - Name: `When clicking ‘Execute workflow’`
   - Type: Manual Trigger
   - No parameters needed.

2. **Add Google Sheets Node to Fetch Leads**
   - Name: `Fetch Leads from Google Sheet`
   - Type: Google Sheets (v4.7+)
   - Credentials: Configure Google Sheets OAuth2 credentials.
   - Operation: Read Rows
   - Sheet ID and Range: Set to the specific sheet and range containing leads.
   - Connect output of Manual Trigger to this node.

3. **Add SplitInBatches Node**
   - Name: `Process Leads One by One`
   - Type: SplitInBatches (v3+)
   - Batch Size: 1 (default)
   - Connect output of Google Sheets node to this node.

4. **Add LangChain Agent Node**
   - Name: `AI Research & Personalization Agent`
   - Type: LangChain Agent (v2.2)
   - Configure to accept single lead input and to output AI-generated personalized messages.
   - Connect second output (batch processing) of SplitInBatches node to this node.

5. **Add LangChain LM Node for GPT-4o-mini**
   - Name: `GPT-4o Mini Language Model`
   - Type: LangChain LM Chat Azure OpenAI (v1+)
   - Credentials: Configure Azure OpenAI API credentials.
   - Model: Set to `GPT-4o-mini`.
   - Connect this node to the `ai_languageModel` input of the LangChain Agent node.

6. **Add Code Node to Parse AI Response**
   - Name: `Parse AI Response to Fields`
   - Type: Code (v2+)
   - Paste JavaScript code to parse AI text output into structured fields (e.g., message text).
   - Connect output of LangChain Agent node to this node.

7. **Add Google Sheets Node to Write Message Back**
   - Name: `Write Message Back to Sheet`
   - Type: Google Sheets (v4.7+)
   - Credentials: Use same Google Sheets credentials.
   - Operation: Update Row
   - Configure to write parsed personalized message into the correct row and column.
   - Connect output of Code node to this node.

8. **Connect Write Message Node to SplitInBatches**
   - Connect output of `Write Message Back to Sheet` to the first input of `Process Leads One by One` (to continue batch processing).

9. **Verify All Credentials and Permissions**
   - Ensure Google Sheets and Azure OpenAI credentials are valid and have necessary scopes.
   - Validate sheet access and update permissions.

10. **Test Workflow**
    - Manually execute the workflow.
    - Check logs for errors, ensure messages are correctly generated and written.

---

### 5. General Notes & Resources

| Note Content | Context or Link |
|--------------|-----------------|
| The workflow integrates LangChain AI agent with GPT-4o-mini model via Azure OpenAI service for personalized marketing automation. | Workflow purpose and AI integration context |
| Google Sheets nodes require OAuth2 credentials with read/write access to the target spreadsheet. | Credential requirements |
| SplitInBatches node allows controlled sequential processing to avoid API rate limits and handle large lead lists efficiently. | Performance and rate limit handling |
| Ensure AI prompt templates in the LangChain agent are designed to output machine-parseable JSON for parsing node reliability. | AI response parsing best practices |

---

**Disclaimer:** The text provided originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly respects applicable content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.