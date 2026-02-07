AI-Powered Mock Job Interview with Voice, Assessment & Gmail Reporting

https://n8nworkflows.xyz/workflows/ai-powered-mock-job-interview-with-voice--assessment---gmail-reporting-7462


# AI-Powered Mock Job Interview with Voice, Assessment & Gmail Reporting

### 1. Workflow Overview

This workflow, titled **"AI-Powered Mock Job Interview with Voice, Assessment & Gmail Reporting"**, is designed to automate the process of receiving mock interview data, analyzing it using AI, generating a performance report, displaying the report via webhook response, and emailing the assessment to stakeholders. It targets use cases such as HR interview simulations, candidate evaluation, and automated feedback generation.

The workflow can be logically divided into the following blocks:

- **1.1 Input Reception:** Captures incoming interview data via a webhook.
- **1.2 AI Processing:** Utilizes AI language models to assess the interview data.
- **1.3 Report Generation and Distribution:** Processes AI output into a report, displays it via HTTP response, and sends it via Gmail.

Additional sticky notes provide setup requirements and assessment criteria references.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
Receives mock interview data submitted externally (e.g., from a frontend app or voice interface) and triggers the workflow.

- **Nodes Involved:**  
  - Receive Interview Data (Webhook)

- **Node Details:**

  - **Receive Interview Data**  
    - Type: Webhook  
    - Role: Entry point for the workflow; listens for HTTP POST requests with interview data.  
    - Configuration: Uses a unique webhook URL (webhookId provided), listens on default HTTP methods.  
    - Inputs: External HTTP requests carrying interview content.  
    - Outputs: Passes interview data to the AI Interview Assessor node.  
    - Edge Cases: Potential failure if webhook URL is not publicly accessible or if payload is malformed or missing required fields.  
    - Version: Webhook node v2 (supports latest webhook features).  

#### 2.2 AI Processing

- **Overview:**  
Processes the received interview data using an AI language model to assess candidate performance with natural language understanding.

- **Nodes Involved:**  
  - AI Interview Assessor  
  - OpenRouter Chat Model

- **Node Details:**

  - **OpenRouter Chat Model**  
    - Type: Language Model Chat (OpenRouter)  
    - Role: Provides the AI language model backend for the interview assessment.  
    - Configuration: Connects as the AI language model to the AI Interview Assessor node via ai_languageModel input.  
    - Inputs: Receives chat prompts or data from the AI Interview Assessor node.  
    - Outputs: Returns AI-generated responses for assessment.  
    - Edge Cases: Authentication failures with OpenRouter API, rate limits, or model timeout.  
    - Version: v1  

  - **AI Interview Assessor**  
    - Type: LangChain Chain LLM Node  
    - Role: Core AI logic that processes interview data, formulates prompts, and runs assessment chains using the OpenRouter Chat Model.  
    - Configuration: Uses the OpenRouter Chat Model as a linked AI model, likely configured with prompt templates and chain logic internally (not detailed in JSON).  
    - Inputs: Receives interview data from webhook; AI model connection via ai_languageModel input.  
    - Outputs: Sends AI assessment results to the Process Report Data node.  
    - Edge Cases: Prompt construction errors, model response delays, or invalid AI output formatting.  
    - Version: v1.7  

#### 2.3 Report Generation and Distribution

- **Overview:**  
Transforms AI assessment output into a structured report, displays it in HTML format via webhook response, and emails the report to configured recipients.

- **Nodes Involved:**  
  - Process Report Data  
  - Display HTML Report  
  - Email Assessment Report

- **Node Details:**

  - **Process Report Data**  
    - Type: Code Node (JavaScript)  
    - Role: Parses and formats AI assessment data into a user-friendly report structure, possibly generating HTML content or JSON for display and email.  
    - Configuration: Custom code likely processes AI output fields, extracts key metrics, and prepares final report content.  
    - Inputs: Receives AI assessment data from AI Interview Assessor node.  
    - Outputs: Sends formatted report data to Display HTML Report and Email Assessment Report nodes.  
    - Edge Cases: Code errors, unexpected AI output formats, or data parsing failures.  
    - Version: v2  

  - **Display HTML Report**  
    - Type: Respond to Webhook  
    - Role: Sends the formatted report as an HTTP response to the original webhook caller, enabling immediate display of results.  
    - Configuration: Set to respond with HTML content type, likely includes the report generated in Process Report Data.  
    - Inputs: Receives processed report data.  
    - Outputs: HTTP response to the webhook request; ends the workflow for that execution branch.  
    - Edge Cases: Response timeout if processing is slow, malformed HTML causing display issues.  
    - Version: v1.4  

  - **Email Assessment Report**  
    - Type: Gmail Node  
    - Role: Sends the AI assessment report via Gmail to specified recipients for record-keeping or further review.  
    - Configuration: Uses Gmail OAuth2 credentials, email body likely includes the report content prepared by Process Report Data.  
    - Inputs: Receives report content.  
    - Outputs: Sends email; no further nodes.  
    - Edge Cases: Authentication errors, email quota limits, delivery failures.  
    - Version: v2.1  

#### 2.4 Documentation & Setup Notes (Sticky Notes)

- **Report Generator Overview**  
  - Likely intended to describe the general workflow purpose; currently empty.

- **Assessment Criteria**  
  - Presumably contains the criteria used by the AI to assess interviews; currently empty.

- **Setup Requirements**  
  - Contains environment or credential setup instructions; currently empty.

---

### 3. Summary Table

| Node Name               | Node Type                           | Functional Role                   | Input Node(s)          | Output Node(s)                       | Sticky Note                       |
|-------------------------|-----------------------------------|---------------------------------|-----------------------|------------------------------------|----------------------------------|
| Report Generator Overview| Sticky Note                       | General workflow overview        | -                     | -                                  |                                  |
| Receive Interview Data   | Webhook                          | Entry point; receives interview data | -                     | AI Interview Assessor               |                                  |
| OpenRouter Chat Model    | LangChain LM Chat                | AI language model backend        | -                     | AI Interview Assessor (ai_languageModel) |                                  |
| AI Interview Assessor    | LangChain Chain LLM              | Processes interview with AI      | Receive Interview Data, OpenRouter Chat Model | Process Report Data              |                                  |
| Process Report Data      | Code                            | Formats AI output into report    | AI Interview Assessor  | Display HTML Report, Email Assessment Report |                                  |
| Display HTML Report      | Respond to Webhook               | Sends report as HTTP response   | Process Report Data    | -                                  |                                  |
| Email Assessment Report  | Gmail                           | Emails report                   | Process Report Data    | -                                  |                                  |
| Setup Requirements       | Sticky Note                     | Setup instructions               | -                     | -                                  |                                  |
| Assessment Criteria      | Sticky Note                     | Assessment criteria details      | -                     | -                                  |                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node: Receive Interview Data**  
   - Type: Webhook  
   - Set HTTP Method: POST (default)  
   - Configure a unique webhook URL (capture webhookId for external calls)  
   - No authentication needed unless specified externally  
   - Position: Start of workflow  

2. **Create OpenRouter Chat Model Node**  
   - Type: LangChain LM Chat (OpenRouter)  
   - Configure API credentials for OpenRouter (obtain API key)  
   - Set model parameters as needed (e.g., model version, temperature)  
   - Position: AI processing layer  

3. **Create AI Interview Assessor Node**  
   - Type: LangChain Chain LLM Node  
   - Configure to use the OpenRouter Chat Model node as its AI language model input  
   - Define prompt templates and chain logic (must be set up to process interview data into assessment)  
   - Connect input from Webhook node and AI model from OpenRouter Chat Model  
   - Position after the Webhook and AI model nodes  

4. **Create Code Node: Process Report Data**  
   - Type: Code (JavaScript)  
   - Write code to parse AI output, extract relevant assessment metrics, and format into HTML or JSON report  
   - Connect input from AI Interview Assessor node  
   - Position after AI Interview Assessor  

5. **Create Respond to Webhook Node: Display HTML Report**  
   - Type: Respond to Webhook  
   - Configure to send HTTP response with Content-Type: text/html  
   - Use the processed report data as the response body  
   - Connect input from Process Report Data  
   - Position downstream of Process Report Data  

6. **Create Gmail Node: Email Assessment Report**  
   - Type: Gmail  
   - Configure OAuth2 credentials for Gmail API access (client ID, secret, token)  
   - Set email parameters: recipient(s), subject, body (use processed report content)  
   - Connect input from Process Report Data  
   - Position parallel to Display HTML Report node  

7. **Add Sticky Notes for Documentation**  
   - Add three Sticky Note nodes for:  
       - Report Generator Overview (describe workflow purpose)  
       - Assessment Criteria (list or summarize criteria used by AI)  
       - Setup Requirements (credentials setup, environment instructions)  
   - Position notes appropriately around main workflow nodes  

8. **Connect Nodes**  
   - Webhook → AI Interview Assessor  
   - OpenRouter Chat Model → AI Interview Assessor (ai_languageModel input)  
   - AI Interview Assessor → Process Report Data  
   - Process Report Data → Display HTML Report  
   - Process Report Data → Email Assessment Report  

9. **Test Workflow**  
   - Deploy webhook externally and send test interview data payload  
   - Verify AI assessment runs and report is generated  
   - Confirm HTTP response returns HTML report  
   - Confirm email is sent with report content  

---

### 5. General Notes & Resources

| Note Content                                                                                 | Context or Link                                            |
|----------------------------------------------------------------------------------------------|------------------------------------------------------------|
| Workflow automates mock interview assessment and reporting using AI and Gmail integration.   | Workflow overview                                          |
| Requires OpenRouter API credentials for AI language model interaction.                       | Credential setup                                           |
| Requires Gmail OAuth2 credentials for sending email reports.                                | Credential setup                                           |
| Ensure webhook URL is publicly accessible to receive interview data from external interfaces.| Webhook configuration                                     |
| For detailed LangChain prompt and chain setup, refer to LangChain documentation and examples.| https://js.langchain.com/docs/                             |

---

**Disclaimer:** This workflow was generated with n8n automation respecting all content policies. It manipulates only legal and public data.