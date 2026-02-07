Automate Candidate Screening with LlamaIndex & GPT-4o-mini for Personalized Email Responses

https://n8nworkflows.xyz/workflows/automate-candidate-screening-with-llamaindex---gpt-4o-mini-for-personalized-email-responses-4727


# Automate Candidate Screening with LlamaIndex & GPT-4o-mini for Personalized Email Responses

### 1. Workflow Overview

This workflow automates candidate screening for HR recruitment by integrating document parsing with LlamaIndex and AI evaluation using GPT-4o-mini. It processes incoming job applications via Gmail, extracts and parses PDF resumes, evaluates candidates against predefined job criteria with OpenAI, and sends personalized acceptance or rejection emails. The workflow is logically segmented into:

- **1.1 Input Reception:** Receiving incoming application emails and extracting relevant content and attachments.
- **1.2 Resume Parsing with LlamaIndex:** Uploading PDF resumes to LlamaIndex, polling for parsing completion, and retrieving cleaned markdown text.
- **1.3 Candidate Evaluation with OpenAI:** Preparing parsed resume data and job criteria for AI analysis, then evaluating the candidate's fit.
- **1.4 Decision & Communication:** Branching on the AI’s decision to send acceptance or rejection emails and updating candidate status (optionally in Google Sheets).

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  Listens for incoming Gmail messages with job applications, extracts email body and attachment presence, and validates email subject to ensure relevance.

- **Nodes Involved:**  
  - Gmail Trigger - Incoming Applications  
  - Set Job Criteria Text  
  - Extract Email Body Text  
  - Check Subject Validity  
  - Check If PDF Attachment Exists  
  - No Operation, do nothing

- **Node Details:**

  - **Gmail Trigger - Incoming Applications**  
    - *Type:* Trigger node listening for new Gmail emails.  
    - *Config:* Uses OAuth2 credentials for Gmail. Monitors inbox or label for new messages.  
    - *Expressions:* Uses email metadata and content for downstream processing.  
    - *Input/Output:* Starts the workflow; outputs email data.  
    - *Failures:* Auth errors, connectivity issues.  
    - *Sub-workflow:* None.

  - **Set Job Criteria Text**  
    - *Type:* Set node used to define or load the job criteria text against which candidates will be evaluated.  
    - *Config:* Contains static or dynamic text representing job requirements.  
    - *Expressions:* Defines a variable holding job criteria.  
    - *Input:* From Gmail trigger.  
    - *Output:* Passes job criteria downstream.  
    - *Failures:* Misconfiguration of criteria text.  

  - **Extract Email Body Text**  
    - *Type:* Set node that extracts the main content (body) from the incoming email.  
    - *Config:* Uses expressions to access email body field from trigger output.  
    - *Input:* Job criteria node.  
    - *Output:* Email body text for validation.  
    - *Failures:* Missing or malformed email body.

  - **Check Subject Validity**  
    - *Type:* If node to verify that the email’s subject matches expected recruitment related patterns.  
    - *Config:* Condition based on subject line content or regex.  
    - *Input:* Email body extraction node.  
    - *Output:* If yes, continues; if no, routes to No Operation node.  
    - *Failures:* Condition expression errors.

  - **Check If PDF Attachment Exists**  
    - *Type:* If node checking if the email includes a PDF attachment (candidate’s resume).  
    - *Config:* Checks attachments array for PDF mime type.  
    - *Input:* Valid email branch.  
    - *Output:* Yes branch proceeds to upload PDF; No branch prepares data without PDF.  
    - *Failures:* Attachment parsing errors.

  - **No Operation, do nothing**  
    - *Type:* NoOp node to gracefully end processing for invalid emails.  
    - *Config:* No parameters.  
    - *Input:* Invalid subject branch.  
    - *Output:* None.  
    - *Failures:* None.

---

#### 2.2 Resume Parsing with LlamaIndex

- **Overview:**  
  If a PDF resume is attached, uploads it to LlamaIndex for parsing, polls for parsing status, retrieves the parsed markdown result, and cleans it for further AI processing.

- **Nodes Involved:**  
  - ☁️ Upload PDF to LlamaIndex  
  - ⏳ Check Parsing Status  
  - 🔁 Condition: Was Parsing Successful?  
  - ⏱ Delay Before Recheck  
  - 📥 Get Parsed Markdown Result  
  - 🧼 Clean Markdown Text

- **Node Details:**

  - **☁️ Upload PDF to LlamaIndex**  
    - *Type:* HTTP Request node sending PDF binary data to LlamaIndex’s parsing API.  
    - *Config:* Uses POST method, attaches PDF file from email, sets headers for authentication and content type.  
    - *Input:* PDF attachment from previous node.  
    - *Output:* Response containing parsing job ID or status.  
    - *Failures:* Network errors, authentication failure, file format issues.

  - **⏳ Check Parsing Status**  
    - *Type:* HTTP Request node polling LlamaIndex for status of resume parsing job.  
    - *Config:* Uses GET method with job ID to query status.  
    - *Input:* Job ID from upload node or delay node.  
    - *Output:* Status response indicating success or pending.  
    - *Failures:* Timeout, API errors.

  - **🔁 Condition: Was Parsing Successful?**  
    - *Type:* If node checking if the parsing status is complete and successful.  
    - *Config:* Condition on status field (e.g., "completed").  
    - *Input:* Status response.  
    - *Output:* Yes branch fetches parsed result; No branch triggers delay before recheck.  
    - *Failures:* Misinterpretation of status response.

  - **⏱ Delay Before Recheck**  
    - *Type:* Wait node delaying workflow execution (e.g., 10 seconds) before re-polling parsing status.  
    - *Config:* Fixed delay time to avoid rapid polling.  
    - *Input:* Not successful status branch.  
    - *Output:* Loops back to check parsing status node.  
    - *Failures:* None.

  - **📥 Get Parsed Markdown Result**  
    - *Type:* HTTP Request node fetching the parsed resume content once ready.  
    - *Config:* GET method with job ID to download markdown text.  
    - *Input:* Successful parsing status branch.  
    - *Output:* Raw markdown content.  
    - *Failures:* API errors, missing data.

  - **🧼 Clean Markdown Text**  
    - *Type:* Code node that processes raw markdown to remove formatting artifacts, normalize text, and prepare for AI analysis.  
    - *Config:* JavaScript code that sanitizes and cleans the parsed resume text.  
    - *Input:* Raw markdown from previous node.  
    - *Output:* Cleaned plain text for OpenAI input.  
    - *Failures:* Code errors or unexpected input format.

---

#### 2.3 Candidate Evaluation with OpenAI

- **Overview:**  
  Combines cleaned resume text with job criteria, sends the combined prompt to OpenAI GPT-4o-mini for evaluation, and branches workflow based on AI’s acceptance or rejection decision.

- **Nodes Involved:**  
  - Prepare Data for OpenAI  
  - Evaluate Candidate with OpenAI  
  - Final Decision Check

- **Node Details:**

  - **Prepare Data for OpenAI**  
    - *Type:* Set node assembling the prompt for OpenAI.  
    - *Config:* Combines cleaned resume text and job criteria into a formatted prompt string.  
    - *Input:* Cleaned resume text or email body if no PDF.  
    - *Output:* JSON with prompt text ready for AI.  
    - *Failures:* Incorrect prompt formatting.

  - **Evaluate Candidate with OpenAI**  
    - *Type:* OpenAI node using Langchain integration to call GPT-4o-mini model.  
    - *Config:* Model set to GPT-4o-mini, with parameters controlling temperature, max tokens, etc.  
    - *Input:* Prompt JSON from previous node.  
    - *Output:* AI evaluation response containing acceptance/rejection and rationale.  
    - *Failures:* API quota limits, auth errors, timeouts.

  - **Final Decision Check**  
    - *Type:* If node parsing AI output to decide acceptance or rejection.  
    - *Config:* Condition based on AI response keywords or flags.  
    - *Input:* OpenAI response.  
    - *Output:* Branches to send acceptance email or send rejection email nodes.  
    - *Failures:* Parsing errors on AI output.

---

#### 2.4 Decision & Communication

- **Overview:**  
  Sends personalized emails based on AI decision and updates candidate status in Google Sheets (currently disabled).

- **Nodes Involved:**  
  - Send Acceptance  
  - Send Rejection  
  - Mark as Accepted  
  - Mark as Rejected  
  - Update Candidate Status on Google Sheets (disabled)

- **Node Details:**

  - **Send Acceptance**  
    - *Type:* Gmail node sending an acceptance email to candidate.  
    - *Config:* Uses OAuth2 Gmail credentials. Email content can be templated with candidate’s name and position.  
    - *Input:* Acceptance branch from decision check.  
    - *Output:* Triggers Mark as Accepted node.  
    - *Failures:* Email send errors, auth issues.

  - **Send Rejection**  
    - *Type:* Gmail node sending a rejection email.  
    - *Config:* Similar to acceptance but with rejection content.  
    - *Input:* Rejection branch from decision check.  
    - *Output:* Triggers Mark as Rejected node.  
    - *Failures:* Same as above.

  - **Mark as Accepted**  
    - *Type:* Set node marking the candidate status as accepted.  
    - *Config:* Sets a variable or field flagging acceptance.  
    - *Input:* After sending acceptance email.  
    - *Output:* Triggers Google Sheets update.  
    - *Failures:* Misconfiguration.

  - **Mark as Rejected**  
    - *Type:* Set node marking candidate as rejected.  
    - *Config:* Sets rejection flag.  
    - *Input:* After sending rejection email.  
    - *Output:* Triggers Google Sheets update.  
    - *Failures:* Same as above.

  - **Update Candidate Status on Google Sheets**  
    - *Type:* Google Sheets node updating candidate record with status.  
    - *Config:* Disabled in this workflow. When enabled, updates specified sheet and row.  
    - *Input:* From mark nodes.  
    - *Output:* None.  
    - *Failures:* API quota, sheet permission issues.

---

### 3. Summary Table

| Node Name                        | Node Type                  | Functional Role                        | Input Node(s)                    | Output Node(s)                      | Sticky Note              |
|---------------------------------|----------------------------|-------------------------------------|---------------------------------|-----------------------------------|--------------------------|
| Gmail Trigger - Incoming Applications | Gmail Trigger              | Entry point for incoming applications | —                               | Set Job Criteria Text               |                          |
| Set Job Criteria Text            | Set                        | Define job criteria text             | Gmail Trigger                   | Extract Email Body Text             |                          |
| Extract Email Body Text          | Set                        | Extract email body content           | Set Job Criteria Text            | Check Subject Validity              |                          |
| Check Subject Validity           | If                         | Validate email subject relevance     | Extract Email Body Text          | Check If PDF Attachment Exists, No Operation, do nothing |                          |
| Check If PDF Attachment Exists   | If                         | Check if PDF resume is attached      | Check Subject Validity           | Upload PDF to LlamaIndex, Prepare Data for OpenAI |                          |
| No Operation, do nothing         | NoOp                       | Ends workflow for irrelevant emails  | Check Subject Validity           | —                                 |                          |
| ☁️ Upload PDF to LlamaIndex       | HTTP Request               | Upload PDF resume for parsing        | Check If PDF Attachment Exists   | Check Parsing Status               |                          |
| ⏳ Check Parsing Status           | HTTP Request               | Poll parsing job status              | Upload PDF to LlamaIndex, Delay Before Recheck | Condition: Was Parsing Successful? |                          |
| 🔁 Condition: Was Parsing Successful? | If                         | Check if parsing finished successfully | Check Parsing Status             | Get Parsed Markdown Result, Delay Before Recheck |                          |
| ⏱ Delay Before Recheck           | Wait                       | Delay before polling again           | Condition: Was Parsing Successful? (No branch) | Check Parsing Status               |                          |
| 📥 Get Parsed Markdown Result    | HTTP Request               | Retrieve parsed resume markdown      | Condition: Was Parsing Successful? (Yes branch) | Clean Markdown Text               |                          |
| 🧼 Clean Markdown Text           | Code                       | Clean and normalize parsed markdown  | Get Parsed Markdown Result       | Prepare Data for OpenAI            |                          |
| Prepare Data for OpenAI          | Set                        | Assemble AI prompt                   | Clean Markdown Text, Check If PDF Attachment Exists (No branch) | Evaluate Candidate with OpenAI   |                          |
| Evaluate Candidate with OpenAI   | OpenAI (Langchain)          | AI evaluation of candidate           | Prepare Data for OpenAI          | Final Decision Check               |                          |
| Final Decision Check             | If                         | Decide acceptance or rejection       | Evaluate Candidate with OpenAI   | Send Acceptance, Send Rejection   |                          |
| Send Acceptance                 | Gmail                      | Send acceptance email                | Final Decision Check (accept branch) | Mark as Accepted                  |                          |
| Send Rejection                 | Gmail                      | Send rejection email                 | Final Decision Check (reject branch) | Mark as Rejected                  |                          |
| Mark as Accepted                | Set                        | Mark candidate as accepted            | Send Acceptance                 | Update Candidate Status on Google Sheets |                          |
| Mark as Rejected                | Set                        | Mark candidate as rejected            | Send Rejection                 | Update Candidate Status on Google Sheets |                          |
| Update Candidate Status on Google Sheets | Google Sheets              | Update candidate status record       | Mark as Accepted, Mark as Rejected | —                                 | Disabled currently        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Gmail Trigger - Incoming Applications**  
   - Node Type: Gmail Trigger  
   - Configure OAuth2 credentials with Gmail API access.  
   - Set trigger to watch inbox or label for new emails.  

2. **Add Set Node: Set Job Criteria Text**  
   - Type: Set  
   - Define a variable, e.g., `jobCriteriaText`, containing job requirements text.  

3. **Add Set Node: Extract Email Body Text**  
   - Type: Set  
   - Use expression to extract email body content from the Gmail trigger data.  

4. **Add If Node: Check Subject Validity**  
   - Type: If  
   - Condition: Email subject contains keywords like "Job Application" or matches regex.  
   - True branch continues, False branch leads to No Operation.  

5. **Add If Node: Check If PDF Attachment Exists**  
   - Type: If  
   - Condition: Email attachments array includes at least one file with mime type `application/pdf`.  
   - True branch for PDF processing, False branch skips to AI evaluation with email body only.  

6. **Add No Operation Node: No Operation, do nothing**  
   - Type: NoOp  
   - Connect from subject invalid branch to gracefully end.  

7. **Add HTTP Request Node: ☁️ Upload PDF to LlamaIndex**  
   - Type: HTTP Request  
   - Method: POST  
   - URL: LlamaIndex PDF upload API endpoint.  
   - Attach PDF binary data from email attachment.  
   - Set authentication headers as required.  

8. **Add HTTP Request Node: ⏳ Check Parsing Status**  
   - Type: HTTP Request  
   - Method: GET  
   - URL: LlamaIndex parsing status endpoint with job ID from upload response.  

9. **Add If Node: 🔁 Condition: Was Parsing Successful?**  
   - Type: If  
   - Condition: Status field equals "completed" or equivalent success indicator.  
   - True branch to get parsed result, False branch to delay.  

10. **Add Wait Node: ⏱ Delay Before Recheck**  
    - Type: Wait  
    - Duration: e.g., 10 seconds delay.  
    - Connect from unsuccessful parsing status branch back to Check Parsing Status.  

11. **Add HTTP Request Node: 📥 Get Parsed Markdown Result**  
    - Type: HTTP Request  
    - Method: GET  
    - URL: LlamaIndex endpoint to retrieve parsed markdown text using job ID.  

12. **Add Code Node: 🧼 Clean Markdown Text**  
    - Type: Code  
    - Write JavaScript to sanitize markdown text, remove unwanted characters, normalize spacing.  

13. **Add Set Node: Prepare Data for OpenAI**  
    - Type: Set  
    - Combine cleaned resume text (or email body if no PDF) with job criteria text into a single prompt string.  

14. **Add OpenAI Node: Evaluate Candidate with OpenAI**  
    - Type: OpenAI (Langchain)  
    - Credentials: OpenAI API key configured.  
    - Model: GPT-4o-mini  
    - Parameters: Set temperature, max tokens according to desired output length and creativity.  
    - Input: Prepared prompt.  

15. **Add If Node: Final Decision Check**  
    - Type: If  
    - Parse OpenAI output for keywords indicating acceptance or rejection.  
    - True branch proceeds to Send Acceptance, False branch to Send Rejection.  

16. **Add Gmail Nodes: Send Acceptance and Send Rejection**  
    - Type: Gmail  
    - Use OAuth2 credentials for Gmail.  
    - Configure email templates for acceptance and rejection messages, including dynamic fields like candidate name.  

17. **Add Set Nodes: Mark as Accepted and Mark as Rejected**  
    - Type: Set  
    - Set candidate status flag accordingly.  

18. **Add Google Sheets Node: Update Candidate Status on Google Sheets**  
    - Type: Google Sheets  
    - Authenticate with Google Sheets OAuth2 credentials.  
    - Configure to update specific sheet and row with candidate status.  
    - Note: This node is optional and disabled in the original workflow.  

19. **Connect Nodes According to Workflow Logic**  
    - Follow the connections as described in the overview and summary table to ensure proper data flow and branching.

---

### 5. General Notes & Resources

| Note Content                                                                                  | Context or Link                                     |
|-----------------------------------------------------------------------------------------------|----------------------------------------------------|
| The workflow uses GPT-4o-mini via Langchain integration, suitable for cost-effective AI inference. | OpenAI GPT-4o-mini model documentation             |
| LlamaIndex APIs are used for PDF parsing; ensure API credentials and correct endpoints are set. | LlamaIndex API reference                            |
| Gmail nodes require OAuth2 credentials with Gmail API scope enabled for sending and receiving emails. | Gmail API OAuth2 setup instructions                 |
| Google Sheets update node is disabled but can be enabled for candidate status tracking.        | Google Sheets API and n8n integration guide         |
| Monitor API quota limits and implement error handling for network failures and auth expiration. | Best practices for n8n workflows with external APIs |

---

**Disclaimer:**  
The provided text is exclusively derived from an automated workflow created with n8n, a tool for integration and automation. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All manipulated data is legal and public.