AI-Powered Lead Scoring & Personalized Responses with JotForm, GPT, and Gmail

https://n8nworkflows.xyz/workflows/ai-powered-lead-scoring---personalized-responses-with-jotform--gpt--and-gmail-9961


# AI-Powered Lead Scoring & Personalized Responses with JotForm, GPT, and Gmail

### 1. Workflow Overview

This workflow automates the qualification, scoring, enrichment, and personalized follow-up response process for new leads submitted via a JotForm form. It targets digital marketing agencies or similar businesses that want to save time on lead management by leveraging AI for lead scoring and customized outreach.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Captures new lead submissions from JotForm in real-time.
- **1.2 AI Lead Scoring:** Uses OpenAI GPT-4.1-nano model to analyze the lead data and assign a numeric score and tier with reasoning.
- **1.3 Data Processing:** Parses and merges the AI scoring results with original lead data into a clean JSON structure.
- **1.4 Data Logging:** Records the enriched lead data including AI scores into a Google Sheet for tracking and further analysis.
- **1.5 Company Enrichment:** Calls an external company enrichment API (via webhook) to obtain additional company insights such as industry, size, tech stack, and location based on the lead’s email domain.
- **1.6 Personalized Email Generation:** Uses OpenAI to compose a tailored email body based on the lead’s tier, company data, and original inquiry.
- **1.7 Email Delivery:** Sends the personalized email response to the lead through Gmail OAuth2.

### 2. Block-by-Block Analysis

---

#### 2.1 Input Reception

**Overview:**  
This block listens for new submissions from a specific JotForm form and triggers the workflow when a lead submits their data.

**Nodes Involved:**  
- Trigger: JotForm Submission

**Node Details:**  

- **Trigger: JotForm Submission**  
  - Type: JotForm Trigger node  
  - Role: Captures form submission events in real-time from JotForm  
  - Configuration:  
    - Connected to a JotForm account credential.  
    - Selected form ID: `252826674643466` (specific to the client’s lead capture form).  
  - Key variables accessed in subsequent nodes: Full Name, Email, Company, Message, Estimated Budget  
  - Input connections: None (trigger node)  
  - Output connections: Leads to AI Lead Scoring node  
  - Edge cases/failures:  
    - Possible webhook connectivity issues or form ID mismatch.  
    - Missing mandatory form fields could cause downstream issues.  
  - Sticky Note Reference: Sticky Note1 explains setup and required form fields.

---

#### 2.2 AI Lead Scoring

**Overview:**  
Analyzes the incoming lead data using a GPT-4.1-nano OpenAI model to assign a lead quality score (1–100), a tier (high/medium/low), and a brief reasoning for the score.

**Nodes Involved:**  
- AI: Lead Scoring Analysis

**Node Details:**  

- **AI: Lead Scoring Analysis**  
  - Type: OpenAI node (LangChain integration)  
  - Role: Perform natural language processing to interpret the lead’s submission and produce a structured JSON lead score and tier.  
  - Configuration:  
    - Model: GPT-4.1-nano  
    - Temperature: 0.2 (low randomness for consistent scoring)  
    - System prompt defines scoring criteria and output JSON format.  
    - Message prompt dynamically injects lead data fields (Full Name, Email, Company, Message, Budget) via expressions.  
  - Expressions:  
    - Uses `{{ $json['Full Name'].values().join(' ') }}` to concatenate full name components.  
    - Other fields referenced directly from the JotForm trigger JSON.  
  - Input connections: From JotForm Trigger node  
  - Output connections: To "Process: Extract & Merge Data" node  
  - Edge cases/failures:  
    - API authentication failure or quota limits on OpenAI.  
    - Model output not parsable as JSON (handled downstream).  
    - Missing or malformed lead data causing incorrect scoring.  
  - Sticky Note Reference: Sticky Note2 explains scoring logic and customization.

---

#### 2.3 Data Processing

**Overview:**  
Parses the JSON string response from the AI scoring node, merges it with the original lead data, and outputs a unified data object.

**Nodes Involved:**  
- Process: Extract & Merge Data

**Node Details:**  

- **Process: Extract & Merge Data**  
  - Type: Code node (JavaScript)  
  - Role: Parse AI’s JSON string output safely and combine it with original lead data fields.  
  - Configuration:  
    - JavaScript code tries to parse OpenAI's text output as JSON.  
    - On parse failure, defaults to low score and reasoning indicating parsing error.  
    - Merges original lead fields with new keys: `aiScore`, `aiTier`, `aiReasoning`.  
  - Input connections: From AI Lead Scoring Analysis node  
  - Output connections: To Sheets: Create Lead Record node  
  - Edge cases/failures:  
    - Invalid or malformed JSON from AI node.  
    - Missing keys in AI response.  
  - Sticky Note Reference: Sticky Note3 describes purpose and output structure.

---

#### 2.4 Data Logging

**Overview:**  
Stores the combined lead and AI scoring data permanently in a Google Sheet for record-keeping and further analysis.

**Nodes Involved:**  
- Sheets: Create Lead Record

**Node Details:**  

- **Sheets: Create Lead Record**  
  - Type: Google Sheets node  
  - Role: Append a new row with lead data and AI scoring results into a specified spreadsheet.  
  - Configuration:  
    - Operation: Append  
    - Spreadsheet ID and Sheet Name: Points to a specific Google Sheet (documentId and gid=0).  
    - Columns mapped: first_name, last_name, company, email, message, estimated_budget, ai_score, ai_tier, ai_reasoning  
    - Values pulled from: merged data JSON and original submission JSON using expressions.  
  - Input connections: From Process: Extract & Merge Data node  
  - Output connections: To API: Company Enrichment Request node  
  - Credentials: Google Sheets OAuth2 account connected.  
  - Edge cases/failures:  
    - Authentication issues with Google Sheets API.  
    - Schema mismatch or missing required columns in the Sheet.  
  - Sticky Note Reference: Sticky Note4 explains setup and usage tips.

---

#### 2.5 Company Enrichment

**Overview:**  
Enhances lead data by querying an external enrichment API using the domain extracted from the lead’s email to obtain company details like industry, employee count, technologies used, and location.

**Nodes Involved:**  
- API: Company Enrichment Request

**Node Details:**  

- **API: Company Enrichment Request**  
  - Type: HTTP Request node  
  - Role: POST request to a custom webhook enrichment API with the email domain as payload.  
  - Configuration:  
    - URL: Points to a deployed enrichment webhook (`https://n8n.nickautomations.com/webhook/enrich`).  
    - Method: POST with JSON body containing `domain` extracted by splitting the lead email at '@'.  
    - Authentication: HTTP Header with generic header auth credentials.  
  - Input connections: From Sheets: Create Lead Record node  
  - Output connections: To AI: Generate Personalized Email node  
  - Edge cases/failures:  
    - API downtime or invalid webhook URL.  
    - Invalid domain extraction from malformed email.  
    - Authentication failures.  
  - Sticky Note Reference: Sticky Note5 details setup and optional usage.

---

#### 2.6 Personalized Email Generation

**Overview:**  
Generates a customized, tier-appropriate email body in HTML format referencing the lead’s inquiry and enriched company data using OpenAI GPT-4.1-nano.

**Nodes Involved:**  
- AI: Generate Personalized Email

**Node Details:**  

- **AI: Generate Personalized Email**  
  - Type: OpenAI node (LangChain integration)  
  - Role: Compose a professional, concise, and friendly follow-up email body tailored to lead tier, company enrichment data, and original message.  
  - Configuration:  
    - Model: GPT-4.1-nano  
    - Temperature: 0.7 (more creative/flexible tone)  
    - System prompt: Instructions to write email body only (no subject/sign-off), with personalization rules based on lead tier (high, medium, low).  
    - Message prompt: Injects lead details from Google Sheet and company enrichment data dynamically.  
  - Input connections: From API: Company Enrichment Request node  
  - Output connections: To Email: Send Lead Response node  
  - Edge cases/failures:  
    - API quota or auth issues.  
    - Missing or incomplete enrichment data causing generic emails.  
  - Sticky Note Reference: Sticky Note6 describes email content variations and personalization logic.

---

#### 2.7 Email Delivery

**Overview:**  
Sends the generated personalized email response to the lead’s email address via Gmail with a subject line referencing their company.

**Nodes Involved:**  
- Email: Send Lead Response

**Node Details:**  

- **Email: Send Lead Response**  
  - Type: Gmail node  
  - Role: Send an email message with dynamic subject and body to the lead.  
  - Configuration:  
    - Recipient: Lead’s email from Google Sheet record.  
    - Subject: "Re: Your inquiry from [Company]" built dynamically.  
    - Message body: Raw HTML content from AI-generated email node.  
    - Options: Append attribution disabled to keep email clean.  
  - Input connections: From AI: Generate Personalized Email node  
  - Output connections: None (end of workflow)  
  - Credentials: Gmail OAuth2 account connected.  
  - Edge cases/failures:  
    - Email sending failures due to auth, quota, or invalid email addresses.  
    - Content formatting issues if AI output includes invalid HTML.  
  - Sticky Note Reference: Sticky Note7 explains email sending setup and testing tips.

---

### 3. Summary Table

| Node Name                    | Node Type                   | Functional Role                          | Input Node(s)                 | Output Node(s)                     | Sticky Note                                                                                 |
|------------------------------|-----------------------------|----------------------------------------|------------------------------|-----------------------------------|---------------------------------------------------------------------------------------------|
| Trigger: JotForm Submission   | JotForm Trigger             | Captures lead form submissions         | None                         | AI: Lead Scoring Analysis          | ## 1️⃣ JotForm Trigger Setup: Captures form submissions with required fields               |
| AI: Lead Scoring Analysis     | OpenAI (LangChain)          | Scores leads and assigns tier          | Trigger: JotForm Submission  | Process: Extract & Merge Data      | ## 2️⃣ AI Lead Scoring: Analyzes lead quality, outputs JSON score and tier                  |
| Process: Extract & Merge Data | Code (JavaScript)           | Parses AI JSON and merges with lead    | AI: Lead Scoring Analysis    | Sheets: Create Lead Record         | ## 3️⃣ Extract & Merge Data: Parses AI response and merges with lead data                   |
| Sheets: Create Lead Record    | Google Sheets               | Logs lead and AI data permanently      | Process: Extract & Merge Data| API: Company Enrichment Request    | ## 4️⃣ Google Sheets Logging: Stores all lead details with AI scores                        |
| API: Company Enrichment Request | HTTP Request              | Fetches company info by email domain   | Sheets: Create Lead Record   | AI: Generate Personalized Email    | ## 5️⃣ Company Enrichment API: Adds industry, tech stack, size, location                    |
| AI: Generate Personalized Email | OpenAI (LangChain)        | Creates custom email body per lead tier| API: Company Enrichment Request | Email: Send Lead Response       | ## 6️⃣ Personalized Email AI: Writes tier-based, personalized email content                |
| Email: Send Lead Response     | Gmail                       | Sends personalized email to lead       | AI: Generate Personalized Email | None                         | ## 7️⃣ Send Email Response: Sends email via Gmail with dynamic subject                      |
| Sticky Note                  | Sticky Note                  | Workflow overview and branding notes   | None                         | None                              | # 🤖 AI-Powered Lead Scoring & Personalized Outreach overview and benefits                  |
| Sticky Note1                 | Sticky Note                  | Explains JotForm trigger setup         | None                         | None                              | ## 1️⃣ JotForm Trigger Setup details                                                       |
| Sticky Note2                 | Sticky Note                  | Explains AI lead scoring logic         | None                         | None                              | ## 2️⃣ AI Lead Scoring logic and customization                                             |
| Sticky Note3                 | Sticky Note                  | Explains data extraction and merging   | None                         | None                              | ## 3️⃣ Extract & Merge Data explanation                                                   |
| Sticky Note4                 | Sticky Note                  | Explains Google Sheets logging          | None                         | None                              | ## 4️⃣ Google Sheets setup and tips                                                       |
| Sticky Note5                 | Sticky Note                  | Explains company enrichment API usage  | None                         | None                              | ## 5️⃣ Company Enrichment API setup and notes                                             |
| Sticky Note6                 | Sticky Note                  | Explains personalized email AI logic   | None                         | None                              | ## 6️⃣ Personalized Email AI content variations                                           |
| Sticky Note7                 | Sticky Note                  | Explains email sending setup            | None                         | None                              | ## 7️⃣ Send Email Response setup and testing tips                                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow in n8n.**

2. **Add a JotForm Trigger node**  
   - Credentials: Connect your JotForm account with API key.  
   - Form: Select the form you want to monitor (use form ID `252826674643466` or your own).  
   - This node triggers when a new submission is received.  
   
3. **Add an OpenAI node (LangChain integration) named "AI: Lead Scoring Analysis"**  
   - Credentials: Connect your OpenAI API key.  
   - Model: Select `gpt-4.1-nano`.  
   - Temperature: Set to 0.2.  
   - System Prompt: Provide a lead scoring assistant prompt specifying scoring criteria and expected JSON output with keys `score`, `tier`, and `reasoning`.  
   - Message Prompt: Inject lead fields using expressions:  
     - Full Name: `{{ $json['Full Name'].values().join(' ') }}`  
     - Email: `{{ $json['E-mail'] }}`  
     - Company: `{{ $json.Company }}`  
     - Message: `{{ $json.Message }}`  
     - Budget: `{{ $json['Estimated Budget'] }}`  
   - Connect JotForm Trigger output into this node.

4. **Add a Code node named "Process: Extract & Merge Data"**  
   - Paste the provided JavaScript code that parses AI response JSON safely and merges it with original lead data, outputting combined data with keys: `aiScore`, `aiTier`, `aiReasoning`.  
   - Connect output of AI Lead Scoring node into this node.

5. **Add a Google Sheets node named "Sheets: Create Lead Record"**  
   - Credentials: Connect your Google Sheets OAuth2 account.  
   - Operation: Append row.  
   - Select your Google Sheet document and worksheet.  
   - Define columns: first_name, last_name, company, email, message, estimated_budget, ai_score, ai_tier, ai_reasoning.  
   - Map values using expressions from the merged data JSON and original submission.  
   - Connect output of Process node to this node.

6. **Add an HTTP Request node named "API: Company Enrichment Request"**  
   - URL: Set to your deployed enrichment webhook URL (or use the example `https://n8n.nickautomations.com/webhook/enrich`).  
   - Method: POST.  
   - Body Parameters:  
     - Key: domain  
     - Value: `={{ $json.email.split('@')[1] }}` (extract domain from email).  
   - Authentication: Use HTTP Header Auth with your API key header configured.  
   - Connect output of Google Sheets node to this node.

7. **Add an OpenAI node named "AI: Generate Personalized Email"**  
   - Credentials: Use the same OpenAI account.  
   - Model: `gpt-4.1-nano`.  
   - Temperature: 0.7.  
   - System Prompt: Detailed instructions to write a personalized email HTML body only, adjusting tone and CTA by AI score tier, referencing lead and enrichment data.  
   - Message Prompt: Inject lead data from Google Sheets node and company enrichment data from HTTP Request node using expressions such as:  
     - Lead’s first and last name, email, company, message, budget, AI tier.  
     - Enrichment data: industry, employee count, tech stack, location.  
   - Connect output of Company Enrichment node to this node.

8. **Add a Gmail node named "Email: Send Lead Response"**  
   - Credentials: Connect your Gmail OAuth2 account.  
   - Send To: Map to lead’s email from Sheets node.  
   - Subject: Use expression like `Re: Your inquiry from {{ $('Sheets: Create Lead Record').item.json.company }}`.  
   - Message: Use the HTML content generated by the previous AI node.  
   - Options: Disable attribution.  
   - Connect output of AI Email Generation node to this node.

9. **Add Sticky Note nodes for documentation and setup instructions** (optional but recommended for maintainability).

10. **Test the workflow:**  
    - Submit a test entry on your JotForm.  
    - Monitor each node’s output and logs.  
    - Adjust prompts, sheet columns, and credentials as needed.

---

### 5. General Notes & Resources

| Note Content                                                                                      | Context or Link                                                                                         |
|-------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| This workflow automatically qualifies, scores, and responds to leads using AI and integrations.  | Workflow overview sticky note provides benefits and setup time estimate (~15 minutes).                 |
| Scoring criteria and email personalization logic can be customized by editing system prompts.   | Sticky Note2 (Lead Scoring) and Sticky Note6 (Email AI) explain prompt details.                        |
| Company enrichment workflow is a separate deployment; you can skip or add it later.              | Enrichment workflow link: https://drive.google.com/file/d/1OK0s6v9m-Hk0Esb1t4BhVT8wP41XkBLj/view?usp=sharing |
| Gmail node can be replaced with Outlook, SendGrid, or SMTP node as needed.                       | Sticky Note7 suggests alternatives for email delivery.                                                |
| Use Google Sheets data to track conversion rates by AI tier for ongoing optimization.            | Sticky Note4 provides setup and tips for Google Sheets logging.                                        |

---

**Disclaimer:**  
The provided text and workflow are generated entirely with n8n, adhering to all applicable content policies. Data handled is legal and publicly accessible.