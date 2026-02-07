AI-Powered HR Interview System with BeyondPresence

https://n8nworkflows.xyz/workflows/ai-powered-hr-interview-system-with-beyondpresence-4514


# AI-Powered HR Interview System with BeyondPresence

### 1. Workflow Overview

This workflow, titled **"BeyondPresence Agent HR Interview System"**, automates the creation, deployment, and analysis of AI-powered HR interviews using BeyondPresence digital avatars. It is designed to streamline recruitment by generating an AI interviewer tailored to a specific job description, collecting candidate interview data via webhook, performing AI-driven analysis of candidates’ responses, and logging results into Google Sheets for easy review.

The workflow logically divides into three main blocks:

- **1.1 Job Description Input & Interview Agent Setup**: Captures the job description and generates an AI-based interview agent with a customized system prompt and welcome message.

- **1.2 Interview Reception & Data Validation**: Listens for incoming interview data via webhook, confirms receipt, and validates the relevance and completeness of the data before processing.

- **1.3 AI Interview Analysis & Result Storage**: Uses OpenAI to analyze the interview transcript, extracts insights, and saves structured results to Google Sheets for HR use.

---

### 2. Block-by-Block Analysis

#### 2.1 Job Description Input & Interview Agent Setup

**Overview:**  
This block allows users to input a detailed job description and initiates the creation of a customized AI interviewer agent on BeyondPresence. It prepares the system prompt and welcome message, creates the agent, and saves the agent details and interview link for later use.

**Nodes Involved:**  
- Job Description Instructions (Sticky Note)  
- 📝 Your Job Description (Code)  
- Setup Instructions (Sticky Note)  
- ▶️ Click to Start Setup (Manual Trigger)  
- Prepare Interview Agent (Code)  
- Create Interview Agent (BeyondPresence)  
- Save Agent Info (Code)  
- Save to Google Sheets1 (Google Sheets)  
- Success! (Sticky Note)  

**Node Details:**

- **Job Description Instructions**  
  - Type: Sticky Note  
  - Role: Provides user guidance to paste the complete job description including title, responsibilities, and requirements.  
  - No inputs or outputs.  
  - Potential failure: None (informational).

- **📝 Your Job Description**  
  - Type: Code  
  - Role: Stores the full job description as a JavaScript string.  
  - Configuration: Job description hardcoded in multi-line template literal. Outputs JSON with `jobDescription` and `timestamp`.  
  - Input: Triggered manually. Output: JSON with job description.  
  - Edge cases: User must ensure job description is complete and correct. No dynamic input here.

- **Setup Instructions**  
  - Type: Sticky Note  
  - Role: Instructs user to create the interview agent and obtain the interview link, only done once.  
  - No inputs or outputs.

- **▶️ Click to Start Setup**  
  - Type: Manual Trigger  
  - Role: Starts the agent setup process.  
  - No inputs, triggers next node.

- **Prepare Interview Agent**  
  - Type: Code  
  - Role: Generates the interview system prompt, welcome message, and agent name based on the job description.  
  - Uses expressions to embed job description into a professional HR interviewer prompt with instructions for tone and approach.  
  - Outputs JSON including `systemPrompt`, `welcomeMessage`, `agentName`, and `jobDescription`.  
  - Inputs: job description JSON. Outputs: interview prompt data.  
  - Edge cases: If job description missing or malformed, prompt generation may fail or produce poor results.

- **Create Interview Agent**  
  - Type: BeyondPresence Node  
  - Role: Calls BeyondPresence API to create an AI interviewer agent with name, greeting, and system prompt.  
  - Parameters use expressions to pass `agentName`, `welcomeMessage`, and `systemPrompt`.  
  - Input: prompt data JSON. Output: response with agent ID and interview link.  
  - Failure modes: API connectivity issues, invalid parameters, or authentication errors.

- **Save Agent Info**  
  - Type: Code  
  - Role: Stores agent ID, job description, and interview link in global workflow static data and outputs summary JSON.  
  - Inputs: API response from create agent node. Outputs: agent info JSON.  
  - Edge cases: If API response missing expected fields, data may be incomplete.

- **Save to Google Sheets1**  
  - Type: Google Sheets  
  - Role: Appends agent info (ID, name, link, job description, prompt, welcome message) to the 'Interview Agents' sheet in a Google Sheets document.  
  - Requires configured Google Sheets credentials and access.  
  - Edge cases: Authentication failure, sheet permissions, or schema mismatches.

- **Success!**  
  - Type: Sticky Note  
  - Role: Notifies user that setup is complete and provides the URL format of the interview link for sharing.  
  - No inputs or outputs.

---

#### 2.2 Interview Reception & Data Validation

**Overview:**  
This block receives completed interview data from BeyondPresence via webhook, acknowledges receipt to the source, and filters data to ensure only relevant, completed interviews from the configured agent are processed.

**Nodes Involved:**  
- Automated Analysis (Sticky Note)  
- Receive Interview Data (Webhook)  
- Confirm Receipt (Respond to Webhook)  
- Data checks (Code)  
- Is Our Interview? (If)  
- Sticky Note (Data Checks)  

**Node Details:**

- **Automated Analysis**  
  - Type: Sticky Note  
  - Role: Explains the automatic process for receiving, analyzing, and saving interviews, with a reminder to configure the webhook URL in BeyondPresence dashboard.  
  - Informational only.

- **Receive Interview Data**  
  - Type: Webhook  
  - Role: Listens for POST requests at path `/beyondpresence-hr-interviews` from BeyondPresence with interview data payload.  
  - Configured to respond with JSON status message via downstream respond node.  
  - Inputs: External HTTP POST. Outputs: webhook JSON data.  
  - Edge cases: Invalid or malformed webhook payloads, webhook URL misconfiguration.

- **Confirm Receipt**  
  - Type: Respond to Webhook  
  - Role: Sends immediate JSON acknowledgment back to BeyondPresence to confirm receipt of the webhook data.  
  - Output: Fixed JSON: `{ status: "success", message: "Interview received and being analyzed" }`.  
  - Input: From webhook node.

- **Data checks**  
  - Type: Code  
  - Role: Validates that the webhook data corresponds to the configured agent ID stored in workflow static data and that the call is completed (`event_type === "call_ended"`).  
  - If valid, outputs JSON with `process: true` and passes job description and webhook data. Otherwise, outputs `process: false` with a reason.  
  - Inputs: webhook data JSON. Outputs: filtered JSON for further processing or halt.  
  - Edge cases: Missing or mismatched agent IDs, partial or ongoing calls, malformed webhook data.

- **Is Our Interview?**  
  - Type: If  
  - Role: Conditional node that routes only interview data flagged for processing (`process === true`).  
  - Inputs: output from Data checks. Outputs: to AI analysis if true, else no further processing.  
  - Edge cases: False negatives due to logic bugs or data inconsistency.

- **Sticky Note (Data Checks)**  
  - Type: Sticky Note  
  - Role: Reminds that only webhooks related to the configured agent and completed calls are processed.  
  - Informational.

---

#### 2.3 AI Interview Analysis & Result Storage

**Overview:**  
This block performs AI-driven analysis of the interview transcript using OpenAI GPT-4o-mini model, formats the AI’s JSON response, and saves the structured results into Google Sheets for HR review.

**Nodes Involved:**  
- Analyze Interview (OpenAI)  
- Format for Sheets (Code)  
- Save to Google Sheets (Google Sheets)  
- Sheet Headers (Sticky Note)  
- Processing Steps (Sticky Note)  

**Node Details:**

- **Analyze Interview**  
  - Type: OpenAI (Langchain Node)  
  - Role: Sends a system prompt to GPT-4o-mini model to analyze the interview transcript in detail.  
  - Prompt contains embedded job description (global static data), candidate name, interview metadata (date, duration), and a formatted transcript from webhook messages.  
  - Request temperature set to 0.3 for controlled creativity.  
  - Expects JSON-formatted output with fit score, strengths, concerns, recommendations, summary, and next steps.  
  - Inputs: validated webhook data with interview transcript. Outputs: AI analysis JSON string.  
  - Edge cases: API rate limits, malformed transcript data, invalid JSON parsing.

- **Format for Sheets**  
  - Type: Code  
  - Role: Parses the AI's JSON response from the OpenAI node, extracts relevant fields, and formats them into a flat JSON object suitable for Google Sheets ingestion.  
  - Includes candidate name, interview date, duration, fit score, recommendation, strengths, concerns, summary, next steps, call ID, and analysis timestamp.  
  - Inputs: AI analysis JSON string and webhook data. Outputs: formatted JSON.  
  - Edge cases: JSON parse errors if AI response malformed, missing fields.

- **Save to Google Sheets**  
  - Type: Google Sheets  
  - Role: Appends formatted interview analysis results to the 'Interview Results' sheet in the configured Google Sheets document.  
  - Requires Google Sheets credential with write permissions to the specific document and sheet.  
  - Edge cases: Authentication failure, document access issues, schema mismatch.

- **Sheet Headers**  
  - Type: Sticky Note  
  - Role: Provides instructions on connecting Google Sheets and using the provided template sheet with required columns.  
  - Informational.

- **Processing Steps**  
  - Type: Sticky Note  
  - Role: Summarizes the interview processing logic and the AI evaluation criteria.  
  - Informational.

---

### 3. Summary Table

| Node Name                | Node Type                    | Functional Role                                           | Input Node(s)                   | Output Node(s)                    | Sticky Note                                                                                                              |
|--------------------------|------------------------------|-----------------------------------------------------------|---------------------------------|----------------------------------|--------------------------------------------------------------------------------------------------------------------------|
| Job Description Instructions | Sticky Note                 | Instructions to paste full job description                 | —                               | —                                | Step 1: Add Your Job Description. Includes required job posting details.                                                  |
| 📝 Your Job Description   | Code                         | Stores complete job description string                     | ▶️ Click to Start Setup          | Prepare Interview Agent           |                                                                                                                          |
| Setup Instructions       | Sticky Note                  | Instructions for creating the interview agent             | —                               | —                                | Step 2: Create your Interview Agent. One-time setup instructions.                                                        |
| ▶️ Click to Start Setup   | Manual Trigger               | Starts the setup workflow                                  | —                               | 📝 Your Job Description           |                                                                                                                          |
| Prepare Interview Agent  | Code                         | Generates system prompt, welcome message, and agent name  | 📝 Your Job Description          | Create Interview Agent            |                                                                                                                          |
| Create Interview Agent   | BeyondPresence Node           | Creates AI interviewer agent on BeyondPresence            | Prepare Interview Agent          | Save Agent Info                  |                                                                                                                          |
| Save Agent Info          | Code                         | Saves agent ID, link, job description to static data      | Create Interview Agent           | Save to Google Sheets1            |                                                                                                                          |
| Save to Google Sheets1   | Google Sheets                | Appends agent info to 'Interview Agents' sheet            | Save Agent Info                 | —                                |                                                                                                                          |
| Success!                 | Sticky Note                  | Confirms setup completion and provides interview link     | —                               | —                                | Setup complete with interview link format `https://bey.chat/[agent-id]`.                                                 |
| Automated Analysis       | Sticky Note                  | Explains automated interview reception and analysis       | —                               | —                                | Step 3: Automated Interview Analysis. Reminder to configure webhook URL in BeyondPresence dashboard.                     |
| Receive Interview Data   | Webhook                      | Receives interview data POSTed from BeyondPresence        | —                               | Confirm Receipt                  |                                                                                                                          |
| Confirm Receipt          | Respond to Webhook           | Sends acknowledgement JSON to webhook sender              | Receive Interview Data           | —                                |                                                                                                                          |
| Data checks              | Code                         | Validates webhook data for agent ID and call completion   | Confirm Receipt                 | Is Our Interview?                 | Data checks: Only process calls from configured agent and completed calls.                                               |
| Is Our Interview?        | If                           | Routes processing based on validity of webhook data       | Data checks                    | Analyze Interview                |                                                                                                                          |
| Analyze Interview        | OpenAI (Langchain)            | Sends transcript to OpenAI for detailed candidate analysis| Is Our Interview?               | Format for Sheets                |                                                                                                                          |
| Format for Sheets        | Code                         | Parses AI JSON response and formats data for Sheets       | Analyze Interview               | Save to Google Sheets             |                                                                                                                          |
| Save to Google Sheets    | Google Sheets                | Saves candidate analysis results to 'Interview Results' sheet| Format for Sheets              | —                                |                                                                                                                          |
| Sheet Headers            | Sticky Note                  | Instructions for Google Sheets setup                       | —                               | —                                | Quick start: use template sheet and connect Google Sheets credential.                                                    |
| Processing Steps         | Sticky Note                  | Summary of interview processing and AI assessment logic   | —                               | —                                | Details of AI metrics and decision support provided.                                                                     |
| Sticky Note (Data Checks)| Sticky Note                  | Reminder for filtering webhook data based on agent and call status | —                           | —                                | Data Checks: Only pass webhooks related to our agent and completed calls.                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Sticky Note**: "Job Description Instructions"  
   - Content: Instructions for pasting full job description with title, company, responsibilities, requirements.

2. **Add Code Node**: "📝 Your Job Description"  
   - Paste entire job posting inside a multi-line JavaScript template literal.  
   - Output JSON with keys: `jobDescription` (trimmed string), `timestamp` (current ISO datetime).

3. **Create Sticky Note**: "Setup Instructions"  
   - Content: Instructions to create AI interviewer agent and obtain interview link (one-time setup).

4. **Add Manual Trigger Node**: "▶️ Click to Start Setup"  
   - No parameters; triggers next node.

5. **Add Code Node**: "Prepare Interview Agent"  
   - Input: job description JSON.  
   - Generate a detailed system prompt embedding the job description, describing interviewer behavior and tone.  
   - Create a welcome message to start the interview.  
   - Generate an agent name including current date.  
   - Output JSON: `jobDescription`, `systemPrompt`, `welcomeMessage`, `agentName`.

6. **Add BeyondPresence Node**: "Create Interview Agent"  
   - Credentials: Configure BeyondPresence API credentials.  
   - Parameters: Use expressions to set `name` from `agentName`, `greeting` from `welcomeMessage`, and `systemPrompt`.  
   - Outputs agent information including `id` and `call_link`.

7. **Add Code Node**: "Save Agent Info"  
   - Store `agentId`, `interviewLink`, and `jobDescription` in workflow static data (global).  
   - Output summary JSON containing agent details and prompts for transparency.

8. **Add Google Sheets Node**: "Save to Google Sheets1"  
   - Credentials: Connect Google Sheets OAuth2 credentials.  
   - Operation: Append row to 'Interview Agents' sheet.  
   - Columns to map: Agent ID, Agent Name, Interview Link, Job Description, System Prompt, Welcome Message.  
   - Select Google Sheets document ID and sheet ID for 'Interview Agents'.

9. **Create Sticky Note**: "Success!"  
   - Content: Confirm setup completion and provide interview link format `https://bey.chat/[agent-id]`.

---

10. **Create Sticky Note**: "Automated Analysis"  
    - Content: Explains automatic reception and analysis of interviews.  
    - Reminder to configure webhook in BeyondPresence dashboard.

11. **Add Webhook Node**: "Receive Interview Data"  
    - HTTP POST method.  
    - Path: `/beyondpresence-hr-interviews`.  
    - Set response mode to use downstream response node.

12. **Add Respond to Webhook Node**: "Confirm Receipt"  
    - Respond with JSON status `{status: "success", message: "Interview received and being analyzed"}` immediately.

13. **Add Code Node**: "Data checks"  
    - Retrieve global static data for agentId and jobDescription.  
    - Extract agentId from webhook payload.  
    - Verify webhook agentId matches stored agentId and event_type equals "call_ended".  
    - Output JSON with `process: true` plus jobDescription and webhookData if valid. Otherwise, `process: false` with reason.

14. **Add If Node**: "Is Our Interview?"  
    - Condition: `process === true`.  
    - Routes valid calls to AI analysis.

15. **Create Sticky Note**: "Sticky Note (Data Checks)"  
    - Content: Reminder that only webhooks from our agent and completed calls are processed.

---

16. **Add OpenAI Node (Langchain)**: "Analyze Interview"  
    - Credentials: Configure OpenAI API key.  
    - Model: `gpt-4o-mini` (or similar).  
    - Temperature: 0.3.  
    - System prompt template includes job description, candidate name, interview date, duration, and transcript formatted by mapping webhook messages.  
    - Request a JSON response with fit score, strengths, concerns, recommendation, summary, and next steps.

17. **Add Code Node**: "Format for Sheets"  
    - Parse AI JSON response from OpenAI node’s message content.  
    - Extract relevant fields; format into flat JSON with keys: Candidate Name, Interview Date, Duration, Fit Score, Recommendation, Strengths, Concerns, Summary, Next Steps, Call ID, Analyzed On.  
    - Output JSON ready for Google Sheets.

18. **Add Google Sheets Node**: "Save to Google Sheets"  
    - Credentials: Connect Google Sheets.  
    - Operation: Append to 'Interview Results' sheet.  
    - Map columns according to keys output by previous node.  
    - Select document and sheet IDs corresponding to the template.

19. **Create Sticky Note**: "Sheet Headers"  
    - Content: Instructions to connect Google Sheets and use the template with required columns.

20. **Create Sticky Note**: "Processing Steps"  
    - Content: Summarizes AI assessment criteria and interview processing flow.

---

### 5. General Notes & Resources

| Note Content                                                                                              | Context or Link                                                                                           |
|----------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| **Important!** Run Step 2 (agent creation) before activating the webhook listener to avoid errors.        | Sticky Note "Important!" instructs this mandatory sequence.                                              |
| Google Sheets template link to copy: https://docs.google.com/spreadsheets/d/1dXLpP5bRRirBsln4YIQtFgb1MiP-0yR8IDRzse5k7X0/copy | Used for both 'Interview Agents' and 'Interview Results' sheets with proper schema setup.                 |
| Configure webhook URL in BeyondPresence dashboard under Settings → Webhooks to point to the webhook node | Ensures BeyondPresence sends interview data correctly to this workflow.                                  |
| BeyondPresence API credentials and OpenAI API credentials are required for full operation                 | Setup in n8n credentials manager before running the workflow.                                            |
| AI model used: GPT-4o-mini for balanced detail and efficiency                                            | Can be replaced or updated depending on API availability and pricing.                                   |
| Interview link format provided as `https://bey.chat/[agent-id]` after agent creation                      | Share this link externally for candidates to start interviews.                                          |

---

**Disclaimer:** The text and data processed by this workflow are fully compliant with content policies and legal standards. No sensitive, offensive, or illegal content is involved. All data is public and legally permissible.