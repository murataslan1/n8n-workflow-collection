AI-Powered Lead Qualification & Personalized Outreach using Relevance AI

https://n8nworkflows.xyz/workflows/ai-powered-lead-qualification---personalized-outreach-using-relevance-ai-9101


# AI-Powered Lead Qualification & Personalized Outreach using Relevance AI

### 1. Workflow Overview

This workflow automates the lead qualification and personalized outreach process by leveraging AI-powered scoring from Relevance AI and contextualized email personalization. It is designed for B2B marketing and sales teams to efficiently evaluate inbound leads from a website form, assess both individual and company fit, categorize leads by quality, and deliver tailored outreach emails accordingly.

The workflow is logically divided into the following blocks:

- **1.1 Lead Intake:** Captures lead data from a website form and normalizes fields for processing.  
- **1.2 Lead Enrichment:** Sends normalized lead and company data to Relevance AI APIs for scoring and enrichment.  
- **1.3 Lead Scoring & Insights:** Merges and analyzes individual and company scores using an AI model to generate a consolidated lead score, classification label, and detailed structured output.  
- **1.4 Data Handling & CRM Update:** Extracts key data fields and logs or updates the CRM (Google Sheets) with lead details for tracking.  
- **1.5 Lead Routing:** Routes leads into HOT, WARM, or COLD categories based on their score for tailored outreach.  
- **1.6 Personalized Outreach:** Generates customized emails per lead category using AI email personalization models and either drafts (HOT) or directly sends (WARM/COLD) emails via Gmail.  
- **1.7 Notifications:** Notifies the internal sales/marketing team on Slack about high-quality leads for immediate attention.

---

### 2. Block-by-Block Analysis

#### 2.1 Lead Intake

- **Overview:** This block captures visitor details from a web form and normalizes this data for downstream processing.  
- **Nodes Involved:** Form, Edit Fields  
- **Node Details:**  
  - **Form**  
    - Type: Form Trigger  
    - Role: Captures lead info including first name, last name, email, phone, company website, job title.  
    - Configuration: Custom form fields with validation on required fields like email and company website.  
    - Input: Web form submission  
    - Output: Raw form JSON data  
    - Edge cases: Missing required fields will prevent submission; malformed emails may cause downstream errors.  
  - **Edit Fields**  
    - Type: Set Node  
    - Role: Normalizes inputs by merging first and last names into `full_name`, extracts email and company URL into dedicated fields.  
    - Key expressions: Combines `First Name` and `Last Name` into `full_name`, passes through `Email Address` and `Company Website`.  
    - Input: Output of Form node  
    - Output: Normalized JSON with `full_name`, `email`, `company_url`  
    - Edge cases: Missing or malformed fields could propagate errors; no explicit validation beyond form trigger.

---

#### 2.2 Lead Enrichment

- **Overview:** Enriches and scores the individual lead and their company by invoking Relevance AI scoring APIs.  
- **Nodes Involved:** score individual (Relevance), score company (Relevance), Merge data  
- **Node Details:**  
  - **score individual (Relevance)**  
    - Type: HTTP Request (POST)  
    - Role: Sends individual lead data (`full_name`, `email`, `lead_role`) to Relevance AI webhook for individual scoring.  
    - Authentication: HTTP header auth with Relevance AI API key credential.  
    - Query parameter: Requires Relevance AI project ID (to be replaced by user).  
    - Input: Normalized data from Edit Fields and original form (job title).  
    - Output: JSON with individual lead scoring and profile data.  
    - Edge cases: HTTP errors, auth failure, invalid project ID, API rate limits.  
  - **score company (Relevance)**  
    - Type: HTTP Request (POST)  
    - Role: Sends company URL to Relevance AI webhook for company scoring.  
    - Authentication and parameters same as individual scoring.  
    - Input: Company website from Edit Fields.  
    - Output: JSON with company-level scoring and enrichment data.  
  - **Merge data**  
    - Type: Merge Node (Combine)  
    - Role: Combines outputs of individual and company scoring nodes into one consolidated dataset for AI analysis.  
    - Input: Both scoring nodes  
    - Output: Single combined JSON array  
    - Edge cases: Mismatch in items count or data structure could cause merge failures.

---

#### 2.3 Lead Scoring & Insights

- **Overview:** Uses an AI language model (LangChain) to analyze combined lead and company data, apply custom scoring logic, and produce a final classification and detailed structured JSON output.  
- **Nodes Involved:** Summarize_N_score, Structured Output  
- **Node Details:**  
  - **Summarize_N_score**  
    - Type: LangChain Chain LLM Node  
    - Role: Provides detailed prompt to AI model, instructing it to analyze individual and company scores, merge insights, apply weights (40% individual, 60% company), adjust scores for leadership/flags, and classify lead as hot/warm/cold.  
    - Input: Merged scoring data  
    - Output: Raw AI-generated text containing JSON-formatted lead qualification results.  
    - Edge cases: LLM output might not be valid JSON, leading to parsing errors downstream.  
  - **Structured Output**  
    - Type: Code Node  
    - Role: Cleans and parses the raw LLM output to extract a valid JSON object. Handles cases such as JSON embedded in markdown code blocks or trailing backticks.  
    - Input: AI raw text output  
    - Output: Parsed JSON object with lead scoring and details ready for routing and CRM update.  
    - Edge cases: Parsing failures on malformed JSON or unexpected output format; error handling logs details and stops workflow.

---

#### 2.4 Data Handling & CRM Update

- **Overview:** Extracts key fields from the structured lead JSON and updates the CRM system (Google Sheets) while preparing data for routing and email generation.  
- **Nodes Involved:** Set data, Update CRM, Merge data+mail  
- **Node Details:**  
  - **Set data**  
    - Type: Set Node  
    - Role: Maps and extracts important fields such as lead name, email, score, label, red flags, company details, social profiles, and confidence scores into individual variables for downstream use.  
    - Input: Structured Output JSON  
    - Output: Simplified JSON with flattened fields for CRM and routing.  
  - **Update CRM**  
    - Type: Google Sheets Node  
    - Role: Appends or updates lead information in a Google Sheets document serving as CRM. Uses defined mapping of columns to extracted data fields.  
    - Configuration: Requires Google Sheets OAuth2 credentials; sheet ID and sheet name configured; operates with appendOrUpdate mode keyed by Lead Name.  
    - Input: Data from Set data node  
    - Output: Confirmation of spreadsheet update  
    - Edge cases: API quota exceeded, invalid credentials, missing spreadsheet or sheet name, data format mismatch.  
  - **Merge data+mail**  
    - Type: Merge Node (Combine)  
    - Role: Combines data from Set data and email personalization outputs for notification and further processing.  
    - Input: Set data and email personalization nodes  
    - Output: Combined JSON for notifications and final steps

---

#### 2.5 Lead Routing

- **Overview:** Routes leads into HOT, WARM, or COLD categories based on the AI-generated `label` to trigger appropriate personalized email workflows.  
- **Nodes Involved:** Router  
- **Node Details:**  
  - **Router**  
    - Type: Switch Node  
    - Role: Routes incoming structured lead data based on the `label` field value: "hot", "warm", "cold".  
    - Configuration: Case-sensitive string match conditions for each label.  
    - Input: Output from Set data node (fields contain label)  
    - Output: Branches connected to respective email personalization nodes for each category.  
    - Edge cases: Label missing or unexpected value leads to no output; fallback output is none.

---

#### 2.6 Personalized Outreach

- **Overview:** Generates personalized outreach emails using AI for each lead quality segment, then drafts or sends emails accordingly.  
- **Nodes Involved:** Email Personalizer (HOT), Email Personalizer (WARM), Email Personalizer (COLD), Create a draft, Send email  
- **Node Details:**  
  - **Email Personalizer (HOT)**  
    - Type: LangChain Chain LLM Node  
    - Role: Crafts brief, high-impact, conversion-oriented emails for hot leads, referencing lead data and company growth signals.  
    - Input: Textual lead scoring JSON from Summarize_N_score node.  
    - Output: JSON with email subject and body.  
    - Connected to Create a draft node for manual review before sending.  
  - **Email Personalizer (WARM)**  
    - Type: LangChain Chain LLM Node  
    - Role: Creates consultative, trust-building nurturing emails for warm leads.  
    - Input: Same as HOT, but filtered for warm leads.  
    - Output: JSON email content, connected to Send email node for direct sending.  
  - **Email Personalizer (COLD)**  
    - Type: LangChain Chain LLM Node  
    - Role: Generates neutral, awareness-building emails without sales pressure for cold leads.  
    - Input: Lead data for cold leads.  
    - Output: JSON email content, connected to Send email node for direct sending.  
  - **Create a draft**  
    - Type: Gmail Node (Draft)  
    - Role: Creates a draft email in Gmail for HOT leads to allow manual review/editing before sending.  
    - Input: Output from Email Personalizer (HOT)  
    - Output: Draft creation confirmation with message ID for linking.  
  - **Send email**  
    - Type: Gmail Node (Send)  
    - Role: Sends emails directly for WARM and COLD leads using generated content.  
    - Input: Outputs from Email Personalizer (WARM) and Email Personalizer (COLD) respectively.  
    - Edge cases: Gmail API errors, quota exceeded, invalid email addresses.

---

#### 2.7 Notifications

- **Overview:** Alerts internal team members on Slack about new HOT leads with key details and links for review and follow-up.  
- **Nodes Involved:** Notify team  
- **Node Details:**  
  - **Notify team**  
    - Type: Slack Node  
    - Role: Sends a formatted message summarizing HOT lead info, including name, email, score, company website, and links to Gmail draft and CRM spreadsheet.  
    - Input: Merged data+mail node output containing lead and email draft info.  
    - Configuration: Uses Slack bot credentials and configured channel ID.  
    - Edge cases: Slack API errors, invalid channel, network issues.

---

### 3. Summary Table

| Node Name                 | Node Type                         | Functional Role                                  | Input Node(s)                      | Output Node(s)                       | Sticky Note                                                                                                                                                              |
|---------------------------|----------------------------------|-------------------------------------------------|----------------------------------|------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Form                      | Form Trigger                     | Captures lead data from web form                 | -                                | Edit Fields                        | ## 🟧 Lead Intake Form → Captures visitor details (name, email, company, job title) from your website/contact page.                                                     |
| Edit Fields               | Set                              | Normalizes and prepares lead data                 | Form                             | score individual (Relevance), score company (Relevance) | ## 🟧 Lead Intake Edit Fields → Normalizes inputs (merges first & last name, extracts company URL).                                                                      |
| score individual (Relevance) | HTTP Request                   | Sends individual data to Relevance AI for scoring | Edit Fields                     | Merge data                        | ## 🔵 Lead Enrichment Score Individual (Relevance) → Calls Relevance AI to evaluate the lead’s personal fit (role, expertise, influence).                              |
| score company (Relevance) | HTTP Request                     | Sends company data to Relevance AI for scoring    | Edit Fields                     | Merge data                        | ## 🔵 Lead Enrichment Score Company (Relevance) → Calls Relevance AI to assess the company’s market fit, size, growth signals, etc.                                    |
| Merge data                | Merge (Combine)                  | Combines individual and company scoring results  | score individual (Relevance), score company (Relevance) | Summarize_N_score                 | ## 🔵 Lead Enrichment Merge → Combines both scores into one payload for holistic evaluation.                                                                           |
| Summarize_N_score         | LangChain Chain LLM              | AI analyzes combined data to generate lead score & label | Merge data                      | Structured Output                 | ## 🟩 Lead Scoring & Insights Summarize_N_score → AI analyzes combined data (40% individual + 60% company) to produce final lead score and classification.             |
| Structured Output         | Code                             | Cleans and parses AI JSON output                   | Summarize_N_score               | Set data, Router                  | ## 🟩 Lead Scoring & Insights Structured Output → Cleans & parses LLM output for consistent JSON downstream.                                                           |
| Set data                  | Set                              | Extracts key fields for CRM and routing            | Structured Output               | Update CRM, Merge data+mail       | ## 🟨 Data Handling Set Data → Extracts key fields (lead name, email, label, summary, red flags, etc.) for CRM and routing.                                            |
| Update CRM                | Google Sheets                    | Appends or updates lead data in CRM Google Sheet  | Set data                       | -                               | ## 🟨 Data Handling Update CRM (Google Sheets) → Logs or updates lead details in CRM sheet for tracking.                                                               |
| Router                    | Switch                          | Routes leads by label into HOT, WARM, COLD branches | Set data                      | Email Personalizer (HOT), Email Personalizer (WARM), Email Personalizer (COLD) | ## 🔀 Routing by Lead Quality Router → Splits leads into HOT / WARM / COLD based on score threshold (HOT: ≥80, WARM: 60–79, COLD: <60).                                |
| Email Personalizer (HOT)  | LangChain Chain LLM              | Generates personalized outreach email for HOT leads | Router (hot branch)              | Create a draft                  | ## ✉️ BONUS: Personalized Outreach Email Personalizer (HOT) → High-impact, conversion-oriented emails for hot leads.                                                  |
| Email Personalizer (WARM) | LangChain Chain LLM              | Generates nurturing email for WARM leads           | Router (warm branch)             | Send email                      | ## ✉️ BONUS: Personalized Outreach Email Personalizer (WARM) → Trust-building, consultative emails.                                                                     |
| Email Personalizer (COLD) | LangChain Chain LLM              | Generates awareness-building email for COLD leads  | Router (cold branch)             | Send email                      | ## ✉️ BONUS: Personalized Outreach Email Personalizer (COLD) → Neutral, awareness-focused emails (no sales push).                                                      |
| Create a draft            | Gmail (Draft)                   | Creates draft email in Gmail for HOT leads         | Email Personalizer (HOT)         | Merge data+mail                 | ## ✉️ BONUS: Personalized Outreach Create a Draft → Drafts email for manual review before sending.                                                                     |
| Send email                | Gmail (Send)                    | Sends email for WARM and COLD leads                 | Email Personalizer (WARM), Email Personalizer (COLD) | -                               | ## ✉️ BONUS: Personalized Outreach Send email → Sends email directly to WARM and COLD leads.                                                                           |
| Merge data+mail           | Merge (Combine)                  | Combines data and mail for notifications            | Set data, Create a draft         | Notify team                    | -                                                                                                                                                                      |
| Notify team               | Slack                          | Sends Slack notification for HOT leads              | Merge data+mail                 | -                               | ## Notify for HOT lead                                                                                                                                                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Form Trigger Node ("Form")**  
   - Type: Form Trigger  
   - Configure form with fields: First Name (required), Last Name (required), Email Address (email, required), Phone Number (number), Company Website (required), Job title.  
   - Set form title and description as desired.  
   - This node triggers on form submission.

2. **Add Set Node ("Edit Fields")**  
   - Type: Set  
   - Create new fields:  
     - `full_name`: Concatenate `First Name` + " " + `Last Name`.  
     - `email`: Copy from `Email Address`.  
     - `company_url`: Copy from `Company Website`.  
   - Connect Form → Edit Fields.

3. **Add HTTP Request Node ("score individual (Relevance)")**  
   - Method: POST  
   - URL: Use your Relevance AI individual lead scoring webhook endpoint.  
   - Authentication: HTTP Header Auth with Relevance AI API key.  
   - Query parameter: `project` with your Relevance AI project ID.  
   - Body parameters: `full_name`, `email`, and `lead_role` (job title from Form).  
   - Connect Edit Fields → score individual (Relevance).

4. **Add HTTP Request Node ("score company (Relevance)")**  
   - Method: POST  
   - URL: Use your Relevance AI company scoring webhook endpoint.  
   - Same authentication and query parameter as individual scoring.  
   - Body parameter: `company_url` from Edit Fields.  
   - Connect Edit Fields → score company (Relevance).

5. **Add Merge Node ("Merge data")**  
   - Mode: Combine by position  
   - Connect `score individual (Relevance)` and `score company (Relevance)` outputs to Merge data.

6. **Add LangChain Chain LLM Node ("Summarize_N_score")**  
   - Use LangChain node configured with your preferred AI model.  
   - Input: Use merged data  
   - Prompt: Provide detailed instructions to analyze individual and company data, apply weighted scoring, classify lead status, and produce JSON output (like the provided prompt).  
   - Connect Merge data → Summarize_N_score.

7. **Add Code Node ("Structured Output")**  
   - Add JavaScript code to extract and parse JSON from the LLM output, handling markdown code blocks and trailing backticks.  
   - Connect Summarize_N_score → Structured Output.

8. **Add Set Node ("Set data")**  
   - Map all key fields from Structured Output JSON to flat workflow variables: lead name, email, label, lead score, job title with seniority, social profiles, company details (name, industry, website, size), tech stack, growth signals, red flags, confidence score.  
   - Connect Structured Output → Set data.

9. **Add Google Sheets Node ("Update CRM")**  
   - Configure with Google Sheets OAuth credentials.  
   - Set target spreadsheet and sheet name for CRM.  
   - Use appendOrUpdate operation keyed by lead name.  
   - Map columns to data fields from Set data node.  
   - Connect Set data → Update CRM.

10. **Add Switch Node ("Router")**  
    - Route based on `label` field (hot, warm, cold).  
    - Connect Set data → Router.

11. **Add LangChain Chain LLM Nodes for Email Personalization**  
    - Create three nodes: "Email Personalizer (HOT)", "Email Personalizer (WARM)", "Email Personalizer (COLD)".  
    - Each receives lead data from the router output branch.  
    - Use tailored prompts for each lead category to generate JSON email content with fields `To`, `subject`, `body`.  
    - Connect Router hot → Email Personalizer (HOT)  
    - Connect Router warm → Email Personalizer (WARM)  
    - Connect Router cold → Email Personalizer (COLD)

12. **Add Gmail Node ("Create a draft") for HOT leads**  
    - Configure Gmail OAuth2 credentials.  
    - Set resource to "draft".  
    - Map message, subject, and recipient from Email Personalizer (HOT) output.  
    - Connect Email Personalizer (HOT) → Create a draft.

13. **Add Gmail Node ("Send email") for WARM and COLD leads**  
    - Configure Gmail OAuth2 credentials.  
    - Map email fields from Email Personalizer (WARM) and Email Personalizer (COLD).  
    - Connect Email Personalizer (WARM) → Send email.  
    - Connect Email Personalizer (COLD) → Send email.

14. **Add Merge Node ("Merge data+mail")**  
    - Combine outputs from Set data and Create a draft nodes for HOT leads.  
    - Connect Set data and Create a draft → Merge data+mail.

15. **Add Slack Node ("Notify team")**  
    - Configure Slack API credentials and channel ID.  
    - Format message with lead name, email, lead score, company URL, links to Gmail draft and CRM.  
    - Connect Merge data+mail → Notify team.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                     | Context or Link                                                                                                      |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| This workflow automates lead qualification using Relevance AI, scoring both individual and company, routing by quality, and triggering tailored outreach while logging in CRM and notifying the team.                                           | Summary of workflow purpose                                                                                         |
| Setup guide includes instructions for API keys, credential creation, and configuration for Relevance AI, Google Sheets, Gmail, and Slack.                                                                                                      | Sticky Note with setup instructions                                                                                  |
| Use Relevance AI templates for individual and company scoring and clone them into your own Relevance AI instance.                                                                                                                              | https://app.relevanceai.com/notebook/f1db6c/0d4f22cd-d888-4b97-a7d6-c9a44ae87137/d27e0c3f-3d61-4d16-b298-83cbbd031e44    |
| Recommended to collect more detailed lead data (e.g., LinkedIn profile, company size, industry) to improve scoring accuracy.                                                                                                                   | Workflow note                                                                                                        |
| CRM can be swapped from Google Sheets to any preferred CRM platform by replacing the Update CRM node accordingly.                                                                                                                               | Workflow note                                                                                                        |
| Email delivery can be replaced with other providers like Outlook, HubSpot Email, SendGrid, or Mailgun if desired.                                                                                                                               | Workflow note                                                                                                        |
| Slack notifications require setting up a Slack app and bot token and configuring the channel ID properly.                                                                                                                                        | Workflow note                                                                                                        |
| Keep API keys secret and use OAuth credentials instead of hardcoding keys inside nodes.                                                                                                                                                         | Security best practice                                                                                                |
| Email personalization prompts for HOT, WARM, and COLD leads are highly tailored with detailed instructions to produce targeted, non-generic outreach emails.                                                                                   | Detailed prompt content inside respective email personalizer nodes                                                  |
| The AI lead scoring uses a weighted combination of 40% individual and 60% company scores, with custom logic to adjust for seniority, misalignment, and red flags to classify leads into hot, warm, or cold buckets.                             | Lead scoring logic embedded in Summarize_N_score node prompt                                                        |

---

**Disclaimer:** The text provided is extracted exclusively from an automated n8n workflow. All data and processes comply with current content policies and contain no illegal, offensive, or protected elements. All data handled is legal and public.