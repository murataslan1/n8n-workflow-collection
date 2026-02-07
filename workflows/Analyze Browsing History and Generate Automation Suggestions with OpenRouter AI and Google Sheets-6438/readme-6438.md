Analyze Browsing History and Generate Automation Suggestions with OpenRouter AI and Google Sheets

https://n8nworkflows.xyz/workflows/analyze-browsing-history-and-generate-automation-suggestions-with-openrouter-ai-and-google-sheets-6438


# Analyze Browsing History and Generate Automation Suggestions with OpenRouter AI and Google Sheets

### 1. Workflow Overview

This n8n workflow is designed to analyze a user's web browsing history, identify automation opportunities, and save actionable suggestions. It reads browsing history data from a Google Sheet, groups the history by domain, filters out common non-actionable websites, and uses an AI agent powered by OpenRouter's language model to analyze each domain's activity. The AI evaluates if automation is possible, describes what exactly can be automated, rates the automation potential, and suggests appropriate tools. Additionally, it searches for relevant n8n workflow templates to assist with implementation. Finally, the workflow saves the automation recommendations back into another Google Sheet tab.

Logical blocks in the workflow:

- **1.1 Input Reception and Data Retrieval**: Manual trigger and reading browsing history rows from Google Sheets.
- **1.2 Data Grouping and Filtering**: Group browsing data by domain and exclude unwanted/common domains.
- **1.3 AI Analysis and Enrichment**: Prepare data, invoke AI agent to analyze automation potential per domain, and manage AI context.
- **1.4 Post-Processing and Output**: Search for related n8n templates, save AI-generated suggestions back to Google Sheets.
- **1.5 Documentation and Metadata**: Sticky note describing workflow purpose and usage.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception and Data Retrieval

**Overview:**  
Starts the workflow manually and fetches browsing history data from a Google Sheet.

**Nodes Involved:**  
- When clicking ‘Execute workflow’  
- Get row(s) in sheet

**Node Details:**

- **When clicking ‘Execute workflow’**  
  - Type: Manual Trigger  
  - Role: Entry point allowing manual start of workflow execution.  
  - Config: Default manual trigger with no parameters.  
  - Inputs: None  
  - Outputs: Connects to "Get row(s) in sheet"  
  - Failures: None typical, unless interruptions occur during manual start.

- **Get row(s) in sheet**  
  - Type: Google Sheets (v4.6)  
  - Role: Reads browsing history data from a specific sheet tab named "history" in a Google Sheet document.  
  - Config:  
    - Document ID: Points to the user's Google Sheet (URL provided in metadata).  
    - Sheet Name: "history" (sheet with browsing history data).  
    - Credentials: Uses Google Sheets OAuth2 account for authorization.  
  - Inputs: Triggered by manual start.  
  - Outputs: Passes all rows read to next node "groupe history by domain".  
  - Failure Modes: Authentication error if credentials expire; API quota limits; invalid sheet or document ID.

---

#### 1.2 Data Grouping and Filtering

**Overview:**  
Groups the browsing history entries by domain and removes entries from common domains not relevant for automation analysis.

**Nodes Involved:**  
- groupe history by domain  
- remove unwanted domains  
- Loop Over Items

**Node Details:**

- **groupe history by domain**  
  - Type: Code (JavaScript)  
  - Role: Groups all browsing history rows by domain extracted from the URL field.  
  - Config: Custom JS code extracts domain by splitting URL, attaches domain field, groups entries into arrays keyed by domain, and formats output as an array of groups.  
  - Inputs: Receives raw rows from Google Sheets.  
  - Outputs: Emits groups of browsing history by domain as items with a "group" field containing all rows for that domain.  
  - Edge Cases: URLs missing domain or malformed URLs may cause errors or incorrect grouping; empty input leads to empty output.

- **remove unwanted domains**  
  - Type: Filter  
  - Role: Excludes groups where the domain matches popular non-actionable sites such as YouTube, Google (any country TLD), ChatGPT, OpenAI, Chrome Web Store.  
  - Config:  
    - Condition: domain field in first item of group does NOT regex match /(youtube\.com|google\.(com|[a-z]{2})|chatgpt\.com|openai\.com|chromewebstore.google.com)/i  
  - Inputs: Groups from previous node.  
  - Outputs: Passes only filtered groups to next node.  
  - Failures: If domain field missing or malformed, filter may behave unexpectedly.

- **Loop Over Items**  
  - Type: Split In Batches  
  - Role: Processes all filtered domain groups as a single batch (batch size equals input length) to handle them individually downstream.  
  - Config: Batch size set dynamically to the total number of input items to process all at once.  
  - Inputs: Filtered groups.  
  - Outputs: Each item is passed individually to the next processing node.  
  - Edge Cases: Large input sets may impact performance; empty input leads to no processing.

---

#### 1.3 AI Analysis and Enrichment

**Overview:**  
Transforms grouped data into prompts, invokes an AI agent using OpenRouter LLM to analyze automation potential, and manages AI memory context.

**Nodes Involved:**  
- Code (prompt preparation)  
- AI Agent (LangChain Agent node)  
- OpenRouter Chat Model  
- Simple Memory

**Node Details:**

- **Code (prompt preparation)**  
  - Type: Code (JavaScript)  
  - Role: Converts each grouped domain history into a JSON string under the field "prompt" for AI input.  
  - Config: Runs once per item, returns an object with the prompt as a stringified JSON of the group.  
  - Inputs: Single domain group from Loop Over Items.  
  - Outputs: JSON with "prompt" field used by AI Agent.  
  - Edge Cases: Large history arrays may produce very long prompts; malformed JSON may cause AI input errors.

- **AI Agent**  
  - Type: LangChain AI Agent  
  - Role: Core AI analysis node that receives browsing history prompt and generates structured automation recommendations.  
  - Config:  
    - System Message: Defines AI personality as an expert automation analyst using tools like Google Sheets, web automation platforms, schedulers, and searching n8n templates.  
    - Prompt: Injects browsing history JSON as "History".  
    - Expected Output: JSON object with fields domain, automatable, what_to_automate, reason, tool, automation_rating, n8n_template.  
  - Inputs: Prompt from Code node; AI language model, memory, and tool nodes connected.  
  - Outputs: Returns analyzed automation suggestions per domain.  
  - Version: Requires n8n's LangChain agent node and OpenRouter credentials.  
  - Edge Cases: AI may return malformed JSON or unexpected content; API rate limits, network timeouts; credentials expiration.

- **OpenRouter Chat Model**  
  - Type: LangChain LLM (OpenRouter)  
  - Role: Provides the language generation backend for the AI Agent.  
  - Config: Uses OpenRouter API credentials.  
  - Inputs: From AI Agent.  
  - Outputs: Chat completions to AI Agent.  
  - Failures: API errors, invalid credentials, rate limits.

- **Simple Memory**  
  - Type: LangChain Memory Buffer Window  
  - Role: Maintains short-term AI session memory keyed by domain name to preserve context during analysis.  
  - Config: Uses domain (from Loop Over Items) as session key; custom key type.  
  - Inputs: Connected to AI Agent memory.  
  - Outputs: Memory data used in AI prompt context.  
  - Edge Cases: Memory size limits; incorrect session key may cause context leakage.

---

#### 1.4 Post-Processing and Output

**Overview:**  
Searches for relevant public n8n workflow templates based on AI suggestions and saves the automation analysis results into a Google Sheets tab.

**Nodes Involved:**  
- HTTP Request  
- Append row in sheet in Google Sheets

**Node Details:**

- **HTTP Request**  
  - Type: HTTP Request  
  - Role: Queries n8n.io workflows search page to find workflow templates matching AI-suggested keywords.  
  - Config:  
    - URL: https://n8n.io/workflows/?sort=views:desc  
    - Query Parameter: "q" dynamically set from AI output field for search keywords.  
  - Inputs: AI suggestions provide search keywords.  
  - Outputs: Response data is passed to AI Agent as a tool for enriching response with workflow template URLs.  
  - Edge Cases: Network failures, unexpected response formats, rate limiting.

- **Append row in sheet in Google Sheets**  
  - Type: Google Sheets Tool (v4.6)  
  - Role: Saves AI-generated automation suggestions as new rows in the "automations" sheet of the same Google Sheet document.  
  - Config:  
    - Document ID: Same as input sheet.  
    - Sheet Name: "automations" (where suggestions are stored).  
    - Columns: domain, automatable, what_to_automate, reason, automation_rating, n8n_template (all mapped from AI output fields).  
    - Operation: Append new rows.  
    - Credentials: Same Google Sheets OAuth2 account.  
  - Inputs: AI Agent output containing automation analysis.  
  - Outputs: None (end of data flow).  
  - Failures: Authentication errors, quota limits, invalid sheet/tab.

---

#### 1.5 Documentation and Metadata

**Overview:**  
Provides a comprehensive sticky note with detailed description, usage instructions, and resources related to the workflow.

**Nodes Involved:**  
- Sticky Note

**Node Details:**

- **Sticky Note**  
  - Type: Sticky Note  
  - Role: Documents the entire workflow purpose, logic, input/output references, demo links, AI logic, and usage instructions.  
  - Config: Large text content describing the workflow, including links to Google Sheets, Chrome extension, contact info, and use cases.  
  - Inputs/Outputs: None (documentation only).  
  - Usage: Makes workflow easier to understand and maintain.

---

### 3. Summary Table

| Node Name                       | Node Type                          | Functional Role                     | Input Node(s)                 | Output Node(s)                  | Sticky Note                                                                                               |
|--------------------------------|----------------------------------|-----------------------------------|------------------------------|-------------------------------|----------------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’| Manual Trigger                   | Entry point to start workflow     | None                         | Get row(s) in sheet            |                                                                                                          |
| Get row(s) in sheet             | Google Sheets                    | Reads browsing history data       | When clicking ‘Execute workflow’ | groupe history by domain       |                                                                                                          |
| groupe history by domain        | Code                            | Groups history rows by domain     | Get row(s) in sheet           | remove unwanted domains        |                                                                                                          |
| remove unwanted domains         | Filter                          | Exclude common non-actionable domains | groupe history by domain      | Loop Over Items                |                                                                                                          |
| Loop Over Items                | SplitInBatches                  | Process each domain group individually | remove unwanted domains        | Code                         |                                                                                                          |
| Code                           | Code                            | Prepares prompt JSON for AI       | Loop Over Items (batch output 2) | AI Agent                    |                                                                                                          |
| AI Agent                       | LangChain AI Agent              | Analyzes automation potential     | Code, OpenRouter Chat Model, Simple Memory, HTTP Request, Append row in sheet in Google Sheets | Loop Over Items (main, batch output 1) |                                                                                                          |
| OpenRouter Chat Model           | LangChain LLM (OpenRouter)      | Provides language model backend   | AI Agent                     | AI Agent                      |                                                                                                          |
| Simple Memory                  | LangChain Memory Buffer Window  | Maintains AI session context      | AI Agent                     | AI Agent                      |                                                                                                          |
| HTTP Request                   | HTTP Request                   | Searches for relevant n8n templates | AI Agent (ai_tool)            | AI Agent (ai_tool)             |                                                                                                          |
| Append row in sheet in Google Sheets | Google Sheets Tool             | Saves AI suggestions to output sheet | AI Agent (ai_tool)            | AI Agent (ai_tool)             | Use this node to save analysis results to Google Sheets.                                                |
| Sticky Note                   | Sticky Note                     | Workflow documentation            | None                         | None                         | Contains detailed workflow overview, usage instructions, demo sheet link, Chrome extension link, contact info, and use cases. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow in n8n.**

2. **Add a Manual Trigger node:**  
   - Name it "When clicking ‘Execute workflow’".  
   - No parameters needed.

3. **Add a Google Sheets node:**  
   - Name: "Get row(s) in sheet".  
   - Operation: Read rows.  
   - Document ID: Set to your Google Sheet ID containing browsing history.  
   - Sheet Name: "history".  
   - Credentials: Connect your Google Sheets OAuth2 credential.  
   - Connect Manual Trigger output to this node.

4. **Add a Code node:**  
   - Name: "groupe history by domain".  
   - Paste the following JavaScript to group rows by domain:  
   ```js
   const items = $input.all();
   const grouped = {};

   for (const item of items) {
     const url = item.json.url;
     const domain = url.split("/")[2]; // Extract domain
     item.json.domain = domain;

     if (!grouped[domain]) {
       grouped[domain] = [];
     }

     grouped[domain].push(item.json);
   }

   const result = [];
   for (const group of Object.values(grouped)) {
     result.push({ group: group });
   }

   return result;
   ```
   - Connect "Get row(s) in sheet" output to this node.

5. **Add a Filter node:**  
   - Name: "remove unwanted domains".  
   - Condition: Filter out groups where `group[0].domain` matches case-insensitive regex for these domains:  
     `youtube.com`, `google.com` or any country TLD (e.g., google.fr), `chatgpt.com`, `openai.com`, `chromewebstore.google.com`.  
   - Configure a "NOT Regex" condition on the domain field accordingly.  
   - Connect "groupe history by domain" output to this node.

6. **Add a SplitInBatches node:**  
   - Name: "Loop Over Items".  
   - Batch size: Set expression to `{{ $input.all().length }}` to process all items in one batch.  
   - Connect "remove unwanted domains" output to this node.

7. **Add a Code node:**  
   - Name: "Code" (prompt preparation).  
   - Mode: Run once per item.  
   - JS code:  
   ```js
   return { prompt: JSON.stringify($json) };
   ```  
   - Connect the second output (batch output 2) of "Loop Over Items" to this node.

8. **Add a LangChain AI Agent node:**  
   - Name: "AI Agent".  
   - Set system message describing the AI as an expert automation analyst with access to Google Sheets, web automation platforms, APIs, schedulers, and n8n templates.  
   - Define prompt to inject the prompt field from the previous node into the text input.  
   - Expected output: JSON with fields domain, automatable, what_to_automate, reason, tool, automation_rating, n8n_template.  
   - Connect "Code" node output to AI Agent input.

9. **Add LangChain OpenRouter Chat Model node:**  
   - Name: "OpenRouter Chat Model".  
   - Set credentials with OpenRouter API key.  
   - Connect AI Agent's language model input to this node.

10. **Add LangChain Simple Memory node:**  
   - Name: "Simple Memory".  
   - Set session key to expression `{{ $('Loop Over Items').item.json.group[0].domain }}`.  
   - Use custom key type.  
   - Connect AI Agent's memory input to this node.

11. **Add HTTP Request node:**  
   - Name: "HTTP Request".  
   - URL: `https://n8n.io/workflows/?sort=views:desc`  
   - Add query parameter `q` set dynamically from AI output field containing search keywords.  
   - Connect AI Agent's ai_tool input to this node, and HTTP Request output back to AI Agent ai_tool output.

12. **Add Google Sheets Tool node:**  
   - Name: "Append row in sheet in Google Sheets".  
   - Operation: Append row.  
   - Document ID: Same Google Sheet as input.  
   - Sheet name: "automations".  
   - Map columns: domain, automatable, what_to_automate, reason, automation_rating, n8n_template from AI output fields.  
   - Connect AI Agent ai_tool output to this node.  
   - Use same Google Sheets OAuth2 credentials.

13. **Add a Sticky Note node:**  
   - Paste the detailed workflow description, usage instructions, demo sheet link, Chrome extension link, contact info, and example use cases as content.  
   - Place prominently in the editor for documentation.

14. **Connect nodes as per the workflow:**  
   - Manual Trigger → Get row(s) in sheet → groupe history by domain → remove unwanted domains → Loop Over Items → Code → AI Agent → OpenRouter Chat Model (ai_languageModel)  
   - AI Agent → Simple Memory (ai_memory)  
   - AI Agent → HTTP Request (ai_tool) → AI Agent (ai_tool)  
   - AI Agent → Append row in sheet in Google Sheets (ai_tool)  

15. **Test workflow:**  
   - Run manual trigger.  
   - Ensure Google Sheets data is accessible and AI credentials (OpenRouter API key) are valid.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                        | Context or Link                                                                                                                               |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------|
| Browsing History Automation Analyzer – Automation Toolkit (Google Sheets + AI) workflow analyzes browsing history to suggest automation opportunities using AI and Google Sheets.                                                                                                                                                                                                                  | Workflow description in Sticky Note node                                                                                                    |
| Demo Google Sheet with input (history) and output (automations) tabs: https://docs.google.com/spreadsheets/d/1V26KDJLBZno6e_VxaBqhsK_JOOOn_5N6uww2apcAeoc/edit?usp=drivesdk                                                                                                                                                                                                                         | Input/output spreadsheet                                                                                                                     |
| Chrome extension to export browsing history compatible with this workflow: [Export Chrome History Extension](https://chromewebstore.google.com/detail/export-chrome-history/dihloblpkeiddiaojbagoecedbfpifdj?pli=1)                                                                                                                                                                                | Chrome Web Store link                                                                                                                        |
| Contact for personalized automation advice: msaidwolfltd@gmail.com                                                                                                                                                                                                                                                                                                                                 | Email contact                                                                                                                                 |
| Example use cases: automate dashboard logins, autofill repetitive forms, schedule data exports, trigger reminders, discover scraping/integration tasks.                                                                                                                                                                                                                                           | Use case examples                                                                                                                             |
| Technologies used: n8n workflow automation, LangChain AI Agent, OpenRouter LLM, Google Sheets integration, JavaScript code for grouping/filtering, HTTP Request for template search.                                                                                                                                                                                                                | Technology stack                                                                                                                             |
| AI Agent output format includes domain, automatable status, automation description, reasoning, suggested tool, rating, and n8n template URLs for implementation assistance.                                                                                                                                                                                                                        | AI structured output format                                                                                                                  |

---

**Disclaimer:** The provided text is exclusively from an n8n workflow automation. It complies with all content policies and contains no illegal or protected elements. All data processed is legal and public.