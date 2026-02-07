AI-Powered Lead Qualification with Zoho CRM, People Data Labs and Google Gemini

https://n8nworkflows.xyz/workflows/ai-powered-lead-qualification-with-zoho-crm--people-data-labs-and-google-gemini-11598


# AI-Powered Lead Qualification with Zoho CRM, People Data Labs and Google Gemini

### 1. Workflow Overview

This workflow automates lead qualification by integrating Zoho CRM, People Data Labs (PDL), and Google Gemini AI. It periodically fetches newly created leads from Zoho CRM, enriches each lead with detailed company data via PDL, then uses Google Gemini to assign an AI-powered qualification score based on business relevance and conversion likelihood. Qualified leads are updated in Zoho CRM and trigger email notifications. The workflow logically divides into these blocks:

- **1.1 Scheduled Trigger & Lead Retrieval**: Periodically triggers the workflow, computes the last execution timestamp, and fetches new leads from Zoho CRM created after that timestamp.
- **1.2 Data Preprocessing & Enrichment**: Extracts website domains from leads and enriches company data using the People Data Labs API.
- **1.3 AI Lead Scoring**: Sends enriched data to Google Gemini AI via a LangChain LLM chain to generate a qualification summary, score, and key factors.
- **1.4 Lead Qualification Decision & Update**: Applies decision logic to classify leads as Qualified or Not Qualified based on the AI score, updates Zoho CRM accordingly, and sends notification emails for qualified leads.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Trigger & Lead Retrieval

- **Overview:**  
  This block triggers the workflow every 10 minutes, computes the timestamp of the last check (offset by 10 minutes), and retrieves all leads from Zoho CRM.

- **Nodes Involved:**  
  - Schedule Trigger  
  - Compute Last Check (Code)  
  - Get many leads (Zoho CRM)  
  - Merge

- **Node Details:**

  - **Schedule Trigger**  
    - Type: Schedule Trigger  
    - Role: Initiates the workflow every X minutes (default 10 min)  
    - Configuration: Interval set to every 10 minutes (default)  
    - Connections: Outputs to Compute Last Check and Get many leads nodes  
    - Edge Cases: Misconfigured intervals can cause missed or duplicated runs.

  - **Compute Last Check (Code)**  
    - Type: Code (JavaScript)  
    - Role: Calculates the timestamp 10 minutes before current time adjusted for timezone offset (+05:30)  
    - Key Expressions: Uses JavaScript date functions to format ISO-like timestamp with fixed offset  
    - Input: Trigger event  
    - Output: JSON with `lastCheck` timestamp string  
    - Edge Cases: Timezone hardcoded to +05:30; workflows in other timezones require adjustment to avoid filtering errors.

  - **Get many leads (Zoho CRM)**  
    - Type: Zoho CRM node  
    - Role: Fetch all leads from Zoho CRM without filtering (fetches all leads)  
    - Configuration: Resource = Lead, Operation = getAll, Return all = true  
    - Credentials: Requires Zoho OAuth2 with read access to Leads module  
    - Edge Cases: Large lead volumes may cause API timeouts or rate limits; no direct filtering by date here.

  - **Merge**  
    - Type: Merge node  
    - Role: Combines output of Compute Last Check and Get many leads to synchronize data for filtering  
    - Configuration: Mode = Combine, Combination mode = Merge by Position, excludes unpaired items  
    - Input: Two inputs from Compute Last Check and Get many leads  
    - Output: Combined JSON containing leads and lastCheck timestamp  
    - Edge Cases: If inputs mismatch, leads might be dropped; ensure synchronization.

---

#### 1.2 Data Preprocessing & Enrichment

- **Overview:**  
  This block processes each lead to extract the website domain and enriches it with company data using People Data Labs API.

- **Nodes Involved:**  
  - Code in JavaScript (extract website)  
  - Enrich Lead (PDL HTTP Request)

- **Node Details:**

  - **Code in JavaScript**  
    - Type: Code (JavaScript)  
    - Role: Extracts the `Website` field from each lead JSON item for enrichment  
    - Key Expressions: `const website = $('Get many leads').item.json.Website || ""`  
    - Input: Merged data from previous block  
    - Output: Adds `website` property to each lead's JSON object  
    - Edge Cases: Missing or malformed website fields result in empty string, causing enrichment calls to fail or return poor data.

  - **Enrich Lead (PDL)**  
    - Type: HTTP Request node  
    - Role: Calls People Data Labs company enrichment API with the lead’s website domain  
    - Configuration:  
      - URL templated with `website` parameter: `https://api.peopledatalabs.com/v5/company/enrich?website={{ $json.website }}`  
      - HTTP Headers: `x-api-key` required (must be configured with valid API key)  
      - Response format: JSON  
    - Credentials: PDL API key set in header  
    - Input: Lead with website from JavaScript node  
    - Output: Detailed company data JSON for each lead  
    - Edge Cases: Invalid or missing API key causes authentication failures; invalid website URLs cause enrichment data to be incomplete or empty; API rate limits possible.

---

#### 1.3 AI Lead Scoring

- **Overview:**  
  This block uses Google Gemini language model via LangChain to analyze enriched company data and generate a lead score, summary, and key qualifying factors.

- **Nodes Involved:**  
  - Basic LLM Chain (LangChain)  
  - Google Gemini Chat Model (Language Model)  
  - Structured Output Parser

- **Node Details:**

  - **Basic LLM Chain**  
    - Type: LangChain LLM Chain  
    - Role: Formats prompt and sends company data for AI analysis  
    - Configuration:  
      - Prompt instructs AI to assign lead score (0–100) and return JSON output with `summary`, `score`, and `factors` array  
      - Uses LangChain prompt type "define" with output parser enabled  
      - Input: Enriched company data JSON  
      - Output: Raw AI response JSON  
    - Connections: Uses Google Gemini Chat Model as LLM, Structured Output Parser for parsing  
    - Edge Cases: AI response format may vary; malformed JSON requires robust parsing.

  - **Google Gemini Chat Model**  
    - Type: LangChain Google Gemini Chat Model  
    - Role: AI language model performing lead qualification analysis  
    - Configuration: Connects with configured Google Palm API credentials  
    - Input: Prompt from Basic LLM Chain  
    - Output: AI-generated text response  
    - Edge Cases: API quota, network timeouts, credential expiry, or malformed prompts causing errors.

  - **Structured Output Parser**  
    - Type: LangChain Structured Output Parser  
    - Role: Parses AI response into structured JSON format  
    - Configuration: Example JSON schema provided to guide parser  
    - Input: Raw AI response  
    - Output: Parsed JSON object with `summary`, `score`, `factors`  
    - Edge Cases: Parsing failure if AI response deviates from schema; fallback or error handling needed.

---

#### 1.4 Lead Qualification Decision & Update

- **Overview:**  
  Evaluates AI lead score to decide qualification status. Updates lead status in Zoho CRM accordingly and sends email notification for qualified leads.

- **Nodes Involved:**  
  - IF - Qualified Lead (If node)  
  - Update Lead status - Qualified (Zoho CRM)  
  - Update Lead status - NOT qualified (Zoho CRM)  
  - send mail for verified lead (Gmail)

- **Node Details:**

  - **IF - Qualified Lead**  
    - Type: If node  
    - Role: Checks if AI score is greater than 80 to classify lead as Qualified  
    - Condition: `{{$json.output.score}} > 80` (Loose type validation)  
    - Input: Parsed AI output from Basic LLM Chain  
    - Outputs: Two branches — True (Qualified), False (Not Qualified)  
    - Edge Cases: Missing or null score values cause misclassification; threshold can be tuned.

  - **Update Lead status - Qualified**  
    - Type: Zoho CRM node  
    - Role: Updates lead’s `Lead_Status` field to "Qualified" in Zoho CRM  
    - Configuration: Uses lead ID from "Get many leads" node  
    - Credentials: Zoho OAuth2 with update permissions  
    - Connections: On True branch from IF node  
    - Edge Cases: API failures, invalid lead IDs, permission errors.

  - **Update Lead status - NOT qualified**  
    - Type: Zoho CRM node  
    - Role: Updates lead’s `Lead_Status` field to "Not Qualified" in Zoho CRM  
    - Configuration: Uses lead ID from Zoho API response array  
    - Credentials: Zoho OAuth2 with update permissions  
    - Connections: On False branch from IF node  
    - Edge Cases: Same as above; uses different lead ID source which might cause mismatches.

  - **send mail for verified lead**  
    - Type: Gmail node  
    - Role: Sends email notification for qualified leads with lead details and AI summary  
    - Configuration:  
      - Recipients configured in `sendTo` (must be set)  
      - Email subject includes lead company name  
      - Body formatted with lead’s first name, company, email, score, and AI summary  
    - Credentials: Gmail OAuth2 with send email permission  
    - Connections: Triggered after lead is updated as Qualified  
    - Edge Cases: Missing recipient email causes failure; Gmail API quota or auth issues.

---

### 3. Summary Table

| Node Name                   | Node Type                         | Functional Role                                  | Input Node(s)                   | Output Node(s)                       | Sticky Note                                                                                           |
|-----------------------------|----------------------------------|-------------------------------------------------|--------------------------------|------------------------------------|-----------------------------------------------------------------------------------------------------|
| Schedule Trigger            | Schedule Trigger                 | Triggers workflow every X minutes                | -                              | Compute Last Check, Get many leads | Runs every X minutes to poll Zoho CRM for new leads.                                                |
| Compute Last Check          | Code (JavaScript)                | Computes last execution timestamp for filtering | Schedule Trigger               | Merge                             |                                                                                                     |
| Get many leads             | Zoho CRM                        | Retrieves all leads from Zoho CRM                 | Schedule Trigger               | Merge                             | Fetches all Zoho leads, calculates last execution time, filters leads created after that timestamp. |
| Merge                      | Merge                           | Combines last check timestamp and leads data     | Compute Last Check, Get many leads | Code in JavaScript                |                                                                                                     |
| Code in JavaScript          | Code (JavaScript)                | Extracts website domain from leads                | Merge                         | Enrich Lead (PDL)                 | Get the website name of filtered leads                                                             |
| Enrich Lead (PDL)           | HTTP Request                    | Enriches lead data using People Data Labs API    | Code in JavaScript             | Basic LLM Chain                  | Calls the People Data Labs Company Enrichment API using the extracted domain and extract data        |
| Basic LLM Chain             | LangChain LLM Chain             | AI lead qualification scoring                     | Enrich Lead (PDL)             | IF - Qualified Lead               | Google Gemini (Basic LLM Chain) generates AI-based lead qualification summary and score (0–100)      |
| Google Gemini Chat Model    | LangChain Google Gemini Model    | AI language model processing                       | Basic LLM Chain (AI LLM)      | Basic LLM Chain                   |                                                                                                     |
| Structured Output Parser    | LangChain Output Parser Structured| Parses AI output into structured JSON            | Basic LLM Chain (AI output)   | Basic LLM Chain                   |                                                                                                     |
| IF - Qualified Lead         | If                             | Decides if lead is qualified based on score      | Basic LLM Chain               | Update Lead status - Qualified, Update Lead status - NOT qualified | Takes AI-generated score and updates lead status accordingly; sends notification on qualified leads |
| Update Lead status - Qualified | Zoho CRM                      | Updates Zoho lead status to "Qualified"           | IF - Qualified Lead (true)    | send mail for verified lead       |                                                                                                     |
| Update Lead status - NOT qualified | Zoho CRM                  | Updates Zoho lead status to "Not Qualified"       | IF - Qualified Lead (false)   | -                                |                                                                                                     |
| send mail for verified lead | Gmail                          | Sends email notification for qualified leads      | Update Lead status - Qualified | -                                |                                                                                                     |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**  
   - Type: Schedule Trigger  
   - Configure interval to run every 10 minutes (or preferred frequency).

2. **Add Code Node "Compute Last Check"**  
   - Type: Code (JavaScript)  
   - Paste code to compute timestamp 10 minutes earlier with timezone offset +05:30:  
     ```js
     const nowUtc = new Date();
     const lookbackMinutes = 10;
     const lastCheckUtc = new Date(nowUtc.getTime() - lookbackMinutes * 60 * 1000);
     function formatWithOffset(date) {
       const pad = (n) => String(n).padStart(2, '0');
       return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}+05:30`;
     }
     return { json: { lastCheck: formatWithOffset(lastCheckUtc) } };
     ```
   - Connect Schedule Trigger → Compute Last Check.

3. **Add Zoho CRM Node "Get many leads"**  
   - Type: Zoho CRM  
   - Set resource: Lead, operation: getAll, returnAll: true  
   - Connect Schedule Trigger → Get many leads  
   - Configure Zoho OAuth2 credentials with Leads read access.

4. **Add Merge Node**  
   - Type: Merge  
   - Mode: Combine, Combination Mode: Merge by Position, Include unpaired: false  
   - Connect Compute Last Check → Merge (input 1)  
   - Connect Get many leads → Merge (input 2)

5. **Add Code Node "Code in JavaScript"**  
   - Type: Code (JavaScript)  
   - Code: Extract website field from lead JSON:  
     ```js
     const website = $('Get many leads').item.json.Website || "";
     return { json: { ...$json, website } };
     ```
   - Connect Merge → Code in JavaScript.

6. **Add HTTP Request Node "Enrich Lead (PDL)"**  
   - Type: HTTP Request  
   - Set method: GET  
   - URL: `https://api.peopledatalabs.com/v5/company/enrich?website={{ $json.website }}`  
   - Add header parameter: `x-api-key` with your PDL API key  
   - Response format: JSON  
   - Connect Code in JavaScript → Enrich Lead (PDL)

7. **Add LangChain Node "Basic LLM Chain"**  
   - Type: LangChain Chain LLM  
   - Prompt:  
     ```
     You are a lead qualification assistant.

     Analyze the following company data and assign a lead score (0–100) based on business size, relevance, and likelihood to convert.
     Return only a valid JSON object with this structure:
     {
       "summary": "...",
       "score": <number>,
       "factors": ["...", "...", "..."]
     }

     Company data:
     Data:
     {{JSON.stringify($json, null, 2)}}
     ```
   - Enable Output Parser  
   - Connect Enrich Lead (PDL) → Basic LLM Chain

8. **Add LangChain Node "Google Gemini Chat Model"**  
   - Type: LangChain Google Gemini Chat Model  
   - Set Google Palm API credentials  
   - Connect Basic LLM Chain (ai_languageModel input) → Google Gemini Chat Model  
   - Connect Google Gemini Chat Model output → Basic LLM Chain (ai_languageModel output)

9. **Add LangChain Node "Structured Output Parser"**  
   - Type: LangChain Output Parser Structured  
   - Paste example JSON schema from workflow  
   - Connect Basic LLM Chain (ai_outputParser input) → Structured Output Parser  
   - Connect Structured Output Parser output → Basic LLM Chain (ai_outputParser output)

10. **Add If Node "IF - Qualified Lead"**  
    - Type: If  
    - Condition: Check if `{{$json.output.score}} > 80` (number comparison, loose validation)  
    - Connect Basic LLM Chain → IF - Qualified Lead

11. **Add Zoho CRM Node "Update Lead status - Qualified"**  
    - Type: Zoho CRM  
    - Operation: Update lead  
    - Lead ID: `={{ $('Get many leads').item.json.id }}`  
    - Update Field: Lead_Status = "Qualified"  
    - Connect IF - Qualified Lead (true) → Update Lead status - Qualified

12. **Add Zoho CRM Node "Update Lead status - NOT qualified"**  
    - Type: Zoho CRM  
    - Operation: Update lead  
    - Lead ID: `={{ $('Zoho: Get All Leads via API').item.json.data[0].id }}` (adjust to actual lead ID from your data)  
    - Update Field: Lead_Status = "Not Qualified"  
    - Connect IF - Qualified Lead (false) → Update Lead status - NOT qualified

13. **Add Gmail Node "send mail for verified lead"**  
    - Type: Gmail  
    - Set recipient(s) in `sendTo` field  
    - Subject: `New Qualified Lead: {{ $('Enrich Lead (PDL)').item.json.name }}`  
    - Message body: Use template with lead details and AI summary from nodes  
    - Connect Update Lead status - Qualified → send mail for verified lead  
    - Configure Gmail OAuth2 credentials

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                  | Context or Link                                                                                                                        |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| This workflow requires Zoho CRM OAuth2 credentials with read and update permissions on the Leads module.                                                                                                                     | Zoho CRM API documentation: https://www.zoho.com/crm/developer/docs/api/v2/                                                           |
| People Data Labs API key must be obtained and set in the HTTP Request node header (`x-api-key`).                                                                                                                             | People Data Labs API docs: https://docs.peopledatalabs.com/                                                                              |
| Google Gemini credentials must be configured properly for LangChain integration.                                                                                                                                              | Google Palm API documentation: https://developers.generativeai.google/tutorials/chatbot                                                    |
| The timezone offset (+05:30) in Compute Last Check node must be adjusted if running workflow in different timezone.                                                                                                          | Adjust the offset in the JavaScript code accordingly                                                                                     |
| Email notification recipients must be configured in the Gmail node for alerts on qualified leads.                                                                                                                             | Gmail OAuth2 setup guide: https://developers.google.com/gmail/api/quickstart/js                                                         |
| The lead scoring threshold (80) can be tuned in the IF node to make qualification criteria more or less strict.                                                                                                              |                                                                                                                                        |
| Large lead volumes may require pagination or batch processing in Zoho CRM queries to avoid API rate limits or timeouts.                                                                                                      | Consider adding filters or paging in Zoho CRM node to limit data volume                                                                 |
| Ensure robust error handling and retries for HTTP requests and AI model calls to handle transient failures or API limits.                                                                                                    | n8n documentation on error workflows: https://docs.n8n.io/nodes/error-handling/                                                          |
| Workflow tested with single lead creation and verified through the entire chain: enrichment, scoring, CRM update, and email notification.                                                                                     |                                                                                                                                        |

---

**Disclaimer:** The text provided is exclusively derived from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.