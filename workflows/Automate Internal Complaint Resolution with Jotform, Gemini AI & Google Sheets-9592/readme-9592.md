Automate Internal Complaint Resolution with Jotform, Gemini AI & Google Sheets

https://n8nworkflows.xyz/workflows/automate-internal-complaint-resolution-with-jotform--gemini-ai---google-sheets-9592


# Automate Internal Complaint Resolution with Jotform, Gemini AI & Google Sheets

### 1. Workflow Overview

This n8n workflow automates the internal complaint resolution process for an organization by integrating JotForm submissions, AI analysis using Google Gemini and LangChain AI agents, and Google Sheets for data management. It classifies complaints, allocates them to the appropriate resolver team or individual, notifies the assigned person via email, and performs daily follow-ups on unresolved issues older than three days.

The workflow is logically divided into two primary parts:

- **1.1 Complaint Collection & Allocation:** Triggered by a JotForm submission, it processes the complaint using AI, determines the responsible resolver via Google Sheets lookup, logs the complaint, and sends a notification email to the resolver.

- **1.2 Daily Follow-Up on Pending Issues:** Runs daily via a schedule trigger, retrieves complaint logs, checks for unresolved issues older than 3 days, and sends follow-up reminder emails to the assigned resolvers.

---

### 2. Block-by-Block Analysis

#### 1.1 Complaint Collection & Allocation

- **Overview:**  
  This block initiates when a complaint form is submitted in JotForm. It uses AI to classify the complaint into predefined categories, determines the resolver responsible for the issue by querying Google Sheets, formats the notification email content, saves the complaint details in Google Sheets, and sends an email to the assigned resolver.

- **Nodes Involved:**  
  - JotForm Trigger  
  - Google Gemini Chat Model (AI language model)  
  - Resolver Details Sheets tool (Google Sheets lookup)  
  - Issue Resolver Allotment Logic Sheets tool (Google Sheets lookup)  
  - AI Agent (LangChain agent integrating AI and Google Sheets tools)  
  - Structured Output Parser  
  - Save Complaint (Google Sheets append/update)  
  - Send a message (Gmail email sender)  
  - Sticky Notes: Sticky Note, Sticky Note1, Sticky Note2, Sticky Note3, Sticky Note8

- **Node Details:**

  1. **JotForm Trigger**  
     - *Type:* Trigger node for JotForm form submissions  
     - *Configuration:* Watches form ID `252855912400050` for new submissions  
     - *Inputs:* External webhook triggered by JotForm submission  
     - *Outputs:* Passes form submission data downstream  
     - *Failures:* Possible webhook connectivity issues or credential errors  
     - *Sticky Note:* Explains the trigger initiates on form submission and captures user details.

  2. **Google Gemini Chat Model**  
     - *Type:* AI language model node using Google PaLM (Gemini)  
     - *Configuration:* Default options, uses Google Palm API credentials  
     - *Inputs/Outputs:* Receives prompt text from AI Agent; provides AI-generated text completion  
     - *Failures:* API rate limits, authentication errors, or timeouts.

  3. **Issue Resolver Allotment Logic Sheets tool**  
     - *Type:* Google Sheets Tool for querying resolver allotment logic  
     - *Configuration:* Reads from the sheet named "Sheet1" in document ID `1xEq6Nq9jR7BUBzwLoPd3HyhElzawjY4kKwWsfSzlX-A`  
     - *Authentication:* Service account credentials  
     - *Role:* Determines which person or team should be assigned based on issue category  
     - *Failures:* Sheet access issues, authentication errors.

  4. **Resolver Details Sheets tool**  
     - *Type:* Google Sheets Tool for fetching resolver contact details  
     - *Configuration:* Reads from the sheet named "Sheet1" in document ID `1NxWZ5zitUp1zZDnieyOhv1ACEvmkpFUd7oYG7y_2sqs`  
     - *Authentication:* Service account credentials  
     - *Role:* Retrieves email addresses of the assigned resolver  
     - *Failures:* Similar to above, including missing or malformed data.

  5. **AI Agent**  
     - *Type:* LangChain AI Agent node integrating the above tools and AI model  
     - *Configuration:*  
       - Prompts AI to analyze the complaint text from the JotForm field: `"Please describe the issue or complaint in detail."`  
       - Classifies complaint into one of five categories: Disciplinary/Behavior, Interpersonal/Team Conflicts, Payroll/Compensation, Harassment/Discrimination, Resource/Infrastructure Problems  
       - Uses the Google Sheets tools to determine correct resolver and fetch email  
       - Outputs a structured JSON with keys: `email`, `case_awarded_to`, `Status`, `email_subject`, `email_body_html`  
     - *Inputs:* Form data from JotForm trigger, AI language model, and Google Sheets tools  
     - *Outputs:* Structured JSON output with email content and assignment info  
     - *Failures:* AI parsing errors, tool invocation failures, or improper data returned from sheets  
     - *Sticky Note:* Notes the AI responsibility for context understanding and allocation.

  6. **Structured Output Parser**  
     - *Type:* Output parser node for enforcing JSON structure on AI Agent output  
     - *Configuration:* Uses example JSON schema matching the AI Agent’s expected output  
     - *Inputs:* Raw AI Agent output  
     - *Outputs:* Parsed and validated JSON for downstream nodes  
     - *Failures:* Schema validation errors due to unexpected AI output format  

  7. **Save Complaint**  
     - *Type:* Google Sheets node for appending or updating complaint logs  
     - *Configuration:*  
       - Target sheet: "Sheet1" in document ID `1KU7cqmE5xmi1EmDs81mC8-EPJcrn-U-JrvRBe2dcZ9I` ("Issue Logs")  
       - Columns mapped: Issue description, resolver email, submission time (current timestamp), assigned team, email subject, email body HTML, and involved person if provided  
       - Matching by Issue field to avoid duplicates  
     - *Inputs:* AI Agent parsed output and JotForm submission data  
     - *Outputs:* Confirmation of logged complaint  
     - *Failures:* Sheet permission errors, data mapping errors  
     - *Sticky Note:* Explains this node saves complaint with relevant details.

  8. **Send a message**  
     - *Type:* Gmail node to send email via OAuth2 credentials  
     - *Configuration:*  
       - Recipient: resolver email from AI Agent output  
       - Subject and HTML body dynamically taken from AI Agent output JSON  
       - Attribution disabled (no signature appended)  
     - *Inputs:* Parsed AI Agent output from Save Complaint node  
     - *Outputs:* Email sent confirmation  
     - *Failures:* Gmail quota limits, OAuth token expiration, invalid email addresses  
     - *Sticky Note:* Notes sending of dynamic AI-generated email.

#### 1.2 Daily Follow-Up on Pending Issues

- **Overview:**  
  This block runs once daily, retrieves all logged complaints, checks if any unresolved issues are older than 3 days, and sends a follow-up email to the assigned resolver requesting a status update.

- **Nodes Involved:**  
  - Schedule Trigger  
  - Get Complaint Logs (Google Sheets read)  
  - If (conditional check)  
  - Send a message1 (Gmail email sender for follow-ups)  
  - Sticky Notes: Sticky Note4, Sticky Note5, Sticky Note6, Sticky Note7, Sticky Note9

- **Node Details:**

  1. **Schedule Trigger**  
     - *Type:* Time-based trigger  
     - *Configuration:* Fires daily at 10:00 AM  
     - *Outputs:* Initiates the workflow daily  
     - *Sticky Note:* Explains daily workflow execution.

  2. **Get Complaint Logs**  
     - *Type:* Google Sheets node for reading complaint logs  
     - *Configuration:* Reads entire "Sheet1" from "Issue Logs" document (same as Save Complaint node)  
     - *Authentication:* Service account  
     - *Outputs:* Provides all complaint records for filtering  
     - *Sticky Note:* Notes retrieval of saved complaint logs.

  3. **If**  
     - *Type:* Conditional branch node  
     - *Configuration:* Checks if the complaint is older than or equal to 3 days and presumably if status is pending (check implied by condition on date difference)  
       - Uses expression to calculate days difference between current date and submission date (format `dd-MM-yyyy HH:mm`)  
       - Condition: days difference >= 3  
     - *Outputs:* True branch for sending follow-up, false branch ignored  
     - *Sticky Note:* Documents its role in detecting aged pending complaints.

  4. **Send a message1**  
     - *Type:* Gmail node for sending follow-up email  
     - *Configuration:*  
       - Recipient: resolver email from complaint log  
       - Subject: "What's the update this issue?"  
       - Body: Text email dynamically including days since submission and issue description, requesting status update  
       - Attribution disabled  
     - *Inputs:* Complaints filtered by If node  
     - *Failures:* Same as previous Gmail node  
     - *Sticky Note:* Explains sending of follow-up email for unresolved issues.

---

### 3. Summary Table

| Node Name                             | Node Type                           | Functional Role                                       | Input Node(s)                     | Output Node(s)                  | Sticky Note                                                                               |
|-------------------------------------|-----------------------------------|-----------------------------------------------------|----------------------------------|--------------------------------|-------------------------------------------------------------------------------------------|
| JotForm Trigger                     | jotFormTrigger                    | Starts workflow on complaint form submission        | (Trigger)                       | AI Agent                       | The workflow gets triggered when jotform got submitted; grabs user submitted details      |
| Google Gemini Chat Model            | lmChatGoogleGemini                 | Provides AI language model completion                | AI Agent (ai_languageModel)      | AI Agent                       |                                                                                           |
| Issue Resolver Allotment Logic Sheets tool | googleSheetsTool                   | Looks up issue-to-resolver mapping                    | AI Agent (ai_tool)               | AI Agent                       |                                                                                           |
| Resolver Details Sheets tool        | googleSheetsTool                   | Fetches resolver email addresses                       | AI Agent (ai_tool)               | AI Agent                       |                                                                                           |
| AI Agent                           | langchain.agent                   | Analyzes complaint, classifies, allocates resolver   | JotForm Trigger, Gemini, Sheets  | Save Complaint                 | AI Agent Node: Understands the context of issue and allots the issue to relevant department |
| Structured Output Parser            | outputParserStructured            | Validates and parses AI Agent output JSON             | AI Agent                        | Save Complaint                 |                                                                                           |
| Save Complaint                    | googleSheets                     | Logs complaint data with assignment                    | AI Agent                       | Send a message                 | Google Sheets Node: Saves the complaint in the log with relevant department allotment      |
| Send a message                    | gmail                            | Sends notification email to assigned resolver         | Save Complaint                 |                                | Gmail Node: Sends an email with dynamic AI written subject and body                        |
| Schedule Trigger                   | scheduleTrigger                  | Triggers daily follow-up workflow                      | (Trigger)                     | Get Complaint Logs             | Schedule Trigger: Runs the workflow once per day                                          |
| Get Complaint Logs                | googleSheets                    | Reads logged complaints                                | Schedule Trigger              | If                            | Google Sheets Node: Get the issue logs that we have saved in our google sheets             |
| If                               | if                             | Checks if unresolved issue is >= 3 days old            | Get Complaint Logs             | Send a message1                | IF Node: Checks if there is a pending issue which is older than 3 days                     |
| Send a message1                  | gmail                          | Sends follow-up email requesting issue status update  | If                           |                                | Gmail Node: Sends a follow up email about the issue status                                |
| Sticky Note                      | stickyNote                     | Explanatory note                                       |                                |                                | The workflow gets triggered when jotform got submitted; grabs the user submitted details  |
| Sticky Note1                     | stickyNote                     | Explanatory note                                       |                                |                                | AI Agent Node: Understands the context of issue and allots the issue to relevant department |
| Sticky Note2                     | stickyNote                     | Explanatory note                                       |                                |                                | Google Sheets Node: Saves the complaint in the log with relevant department allotment      |
| Sticky Note3                     | stickyNote                     | Explanatory note                                       |                                |                                | Gmail Node: Sends an email with dynamic AI written Email subject and body                 |
| Sticky Note4                     | stickyNote                     | Explanatory note                                       |                                |                                | Schedule Trigger: Runs the workflow once per day                                          |
| Sticky Note5                     | stickyNote                     | Explanatory note                                       |                                |                                | Google Sheets Node: Get the issue logs that we have saved in our google sheets             |
| Sticky Note6                     | stickyNote                     | Explanatory note                                       |                                |                                | IF Node: Checks if there is a pending issue which is older than 3 days                     |
| Sticky Note7                     | stickyNote                     | Explanatory note                                       |                                |                                | Gmail Node: Sends a follow up email about the issue status                                |
| Sticky Note8                     | stickyNote                     | Explanatory note                                       |                                |                                | Part 1 - Collects Issues and allot them to the relevant department                        |
| Sticky Note9                     | stickyNote                     | Explanatory note                                       |                                |                                | Part 2 - Daily Follow-Ups After 3 Days Until Resolution                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a JotForm Trigger node**  
   - Type: `jotFormTrigger`  
   - Configure with your JotForm API credentials  
   - Select the complaint form ID (`252855912400050`)  
   - This node triggers when a new form submission is received.

2. **Add a Google Gemini Chat Model node**  
   - Type: `lmChatGoogleGemini`  
   - Authenticate with Google PaLM API credentials  
   - Use default options.

3. **Add two Google Sheets Tool nodes**:  
   - **Issue Resolver Allotment Logic Sheets tool:**  
     - Type: `googleSheetsTool`  
     - Authenticate with Google Service Account  
     - Set document ID to `1xEq6Nq9jR7BUBzwLoPd3HyhElzawjY4kKwWsfSzlX-A`  
     - Set sheet to `"Sheet1"`  
     - This sheet maps issue categories to resolvers.  
   - **Resolver Details Sheets tool:**  
     - Type: `googleSheetsTool`  
     - Same authentication  
     - Document ID: `1NxWZ5zitUp1zZDnieyOhv1ACEvmkpFUd7oYG7y_2sqs`  
     - Sheet: `"Sheet1"`  
     - This sheet holds resolver email addresses.

4. **Add an AI Agent (LangChain agent) node**  
   - Type: `langchain.agent`  
   - Configure prompt to:  
     - Analyze the complaint text from the form field `"Please describe the issue or complaint in detail."`  
     - Classify into one of five categories (Disciplinary, Interpersonal, Payroll, Harassment, Resource)  
     - Query the Issue Resolver Allotment Logic Sheets tool to decide the primary resolver  
     - If resolver is the normal resolver, allot to alternative resolver  
     - Query Resolver Details Sheets tool to get resolver email  
     - Output a structured JSON containing email, case awarded to, status, email subject, and HTML email body.  
   - Connect input from JotForm Trigger node and AI language model (Google Gemini) node  
   - Attach the two Google Sheets Tools as AI tools.

5. **Add a Structured Output Parser node**  
   - Type: `outputParserStructured`  
   - Configure with example JSON schema matching AI Agent output (email, case_awarded_to, status, email_subject, email_body_html)  
   - Connect input from AI Agent output.

6. **Add a Google Sheets node named "Save Complaint"**  
   - Type: `googleSheets`  
   - Authenticate with Google Service Account  
   - Document ID: `1KU7cqmE5xmi1EmDs81mC8-EPJcrn-U-JrvRBe2dcZ9I` ("Issue Logs")  
   - Sheet: `"Sheet1"`  
   - Operation: Append or update by matching "Issue" column  
   - Map columns:  
     - Issue: from JotForm field "Please describe the issue or complaint in detail."  
     - The person Caused by: from JotForm field "What is the name of the team member involved? (Optional)"  
     - case_awarded_to, resolver_email, email_subject, email_body_html, submitted_time (current timestamp), status (default "Pending") from AI Agent output  
   - Connect input from Structured Output Parser.

7. **Add Gmail node "Send a message"**  
   - Type: `gmail`  
   - Authenticate with Gmail OAuth2 credentials  
   - Send to: resolver email from Save Complaint output  
   - Subject and HTML body: from AI Agent output JSON fields  
   - Disable attribution  
   - Connect input from Save Complaint node.

8. **Add a Schedule Trigger node**  
   - Type: `scheduleTrigger`  
   - Set to trigger daily at 10:00 AM.

9. **Add a Google Sheets node "Get Complaint Logs"**  
   - Type: `googleSheets`  
   - Same Google Service Account credentials as Save Complaint  
   - Document ID and Sheet same as Save Complaint  
   - Operation: Read all rows  
   - Connect input from Schedule Trigger.

10. **Add an If node**  
    - Type: `if`  
    - Condition: Check if days difference between current date and complaint's submitted_time field is >= 3  
    - Use expression with `DateTime.fromFormat($json.submitted_time, 'dd-MM-yyyy HH:mm')` and `$now`  
    - Connect input from Get Complaint Logs.

11. **Add Gmail node "Send a message1" for follow-up**  
    - Type: `gmail`  
    - Authenticate with Gmail OAuth2 credentials (can be same as above)  
    - Send To: resolver_email from filtered complaints (If node true branch)  
    - Subject: "What's the update this issue?"  
    - Body: Text including days since submission and issue description, requesting an update  
    - Disable attribution  
    - Connect input from If node's true output.

12. **Connect all nodes as per the logical flow:**  
    - JotForm Trigger → AI Agent  
    - Google Gemini Chat Model → AI Agent (as AI language model)  
    - Issue Resolver Allotment Logic Sheets tool → AI Agent (as AI tool)  
    - Resolver Details Sheets tool → AI Agent (as AI tool)  
    - AI Agent → Structured Output Parser → Save Complaint → Send a message  
    - Schedule Trigger → Get Complaint Logs → If → Send a message1

13. **Add Sticky Notes** (optional but recommended for documentation):  
    - Add notes describing the function of each block and key nodes as per the sticky notes content in the original workflow.

---

### 5. General Notes & Resources

| Note Content                                                                                                                         | Context or Link                                                                                     |
|--------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| Workflow triggered on JotForm submission, integrating AI and spreadsheet tools for automated complaint management and communication. | Workflow purpose summary                                                                           |
| Uses Google Gemini (PaLM) for AI language model and LangChain AI Agent for orchestration of AI and tool calls.                      | AI technology stack                                                                                |
| Google Sheets used for configurable resolver logic, resolver contact details, and complaint logging.                                  | Data management and lookup                                                                         |
| Follow-up emails are sent automatically after 3 days for unresolved complaints to ensure accountability.                             | Automated reminder mechanism                                                                       |
| Gmail nodes configured with OAuth2 credentials to send dynamic emails generated by AI.                                               | Email integration                                                                                  |
| Workflow designed for confidentiality and automated routing of sensitive internal compliance issues.                                 | Use case focus                                                                                    |
| Project credit and detailed explanation: [Source n8n Workflow Repository or Blog] (not provided here but recommended to keep notes) | For further learning and project tracking                                                         |

---

**Disclaimer:** The text above is derived exclusively from an automated workflow implemented in n8n, adhering strictly to content policies and handling only legal, public data. No illegal or offensive content is included.