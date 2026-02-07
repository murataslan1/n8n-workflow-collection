Automate DEI Eligibility Screening with Azure GPT-4o, Google Drive and Sheets

https://n8nworkflows.xyz/workflows/automate-dei-eligibility-screening-with-azure-gpt-4o--google-drive-and-sheets-9226


# Automate DEI Eligibility Screening with Azure GPT-4o, Google Drive and Sheets

### 1. Workflow Overview

This workflow automates Diversity, Equity, and Inclusion (DEI) eligibility screening for job candidates by integrating Azure OpenAI GPT-4o-mini, Google Drive, and Google Sheets. It monitors newly added CV files in a specific Google Drive folder, extracts and analyzes candidate data using GPT-4o on Azure OpenAI, compares it with existing workforce data from a Google Sheet, and determines DEI eligibility based on organization-defined balance rules. Eligible candidates trigger an automated email notification to hiring managers.

**Logical Blocks:**

- **1.1 Input Reception & File Handling**  
  Watches Google Drive for new CV uploads, downloads the CV file, and extracts text content.

- **1.2 AI Processing & Workforce Data Integration**  
  Uses Azure OpenAI GPT-4o-mini to analyze extracted CV text and determine DEI eligibility by referencing current employee data stored in Google Sheets.

- **1.3 Data Update & Decision Logic**  
  Appends eligibility results to a Google Sheet, evaluates if the candidate is DEI eligible, and routes workflow accordingly.

- **1.4 Notification**  
  Creates a formatted email summarizing the eligibility results and sends it to the hiring manager.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception & File Handling

**Overview:**  
This block detects new CV files uploaded to a specified Google Drive folder, downloads these files, and extracts their textual content for further processing.

**Nodes Involved:**  
- CV Trigger  
- Download CV  
- Extract from PDF

**Node Details:**

- **CV Trigger**  
  - *Type:* Google Drive Trigger  
  - *Role:* Listens for new files created in the specific folder "HR auto" (Google Drive folder ID: 1KyX5RGqeF7v0sAvvaoBnJPTQoq4aOHLz).  
  - *Configuration:* Trigger fires every minute on file creation. Limited to one folder.  
  - *Input/Output:* Outputs metadata of new file including `webViewLink`.  
  - *Potential Failures:* OAuth2 token expiration, Google API quota limits, folder permission errors.

- **Download CV**  
  - *Type:* Google Drive node  
  - *Role:* Downloads the CV file using the file’s `webViewLink` URL from the trigger node.  
  - *Configuration:* Operation “download” with fileId set dynamically from trigger.  
  - *Input:* Receives new file metadata.  
  - *Output:* Binary data of the CV file for downstream extraction.  
  - *Potential Failures:* Invalid file link, file access permissions, network timeouts.

- **Extract from PDF**  
  - *Type:* Extract From File node  
  - *Role:* Extracts raw text content from the downloaded PDF CV.  
  - *Configuration:* Operation set to “pdf.”  
  - *Input:* Binary PDF file.  
  - *Output:* Extracted text in JSON under property `text`.  
  - *Potential Failures:* Corrupted or non-PDF files, extraction errors, unsupported file types.

---

#### 1.2 AI Processing & Workforce Data Integration

**Overview:**  
Processes the extracted CV text using Azure OpenAI GPT-4o-mini to extract structured candidate attributes and determine DEI eligibility by referencing current employees' data in Google Sheets.

**Nodes Involved:**  
- Azure OpenAI Chat Model  
- Structured Output Parser  
- Get row(s) in sheet in Google Sheets  
- Check for DEI Eligibility

**Node Details:**

- **Azure OpenAI Chat Model**  
  - *Type:* LangChain Azure OpenAI Chat Model node  
  - *Role:* Uses GPT-4o-mini to analyze CV text and generate structured responses.  
  - *Configuration:* Model set to “gpt-4o-mini,” no additional options.  
  - *Input:* Receives text content from “Extract from PDF.”  
  - *Output:* Raw AI-generated chat completion.  
  - *Credentials:* Azure OpenAI API credentials configured.  
  - *Potential Failures:* API quota limits, network errors, model unavailability.

- **Structured Output Parser**  
  - *Type:* LangChain Output Parser (Structured)  
  - *Role:* Parses the GPT-generated text into a strict JSON schema with expected fields like Name, Location, Gender, Disability, DEI eligibility, and Factor.  
  - *Configuration:* JSON schema example provided to enforce format.  
  - *Input:* GPT raw output.  
  - *Output:* Parsed structured JSON object.  
  - *Potential Failures:* Parsing errors if GPT output deviates from schema.

- **Get row(s) in sheet in Google Sheets**  
  - *Type:* Google Sheets Tool node  
  - *Role:* Reads current workforce representation data from the Google Sheet named “HR Dei” (ID: 1P8uforIuBJCkX0i9dl5BgUmzi4Nk63EHyFKLyeQvxT8) to be used for DEI comparison.  
  - *Configuration:* Reads from “Sheet1” (gid=0).  
  - *Input:* This node is invoked internally by the “Check for DEI Eligibility” agent node as a tool.  
  - *Output:* Current employee data for DEI evaluation.  
  - *Potential Failures:* OAuth2 errors, sheet access permissions, rate limits.

- **Check for DEI Eligibility**  
  - *Type:* LangChain Agent node  
  - *Role:* Uses GPT with a system prompt to process candidate data, compare with existing employees, and decide DEI eligibility, strictly using self-reported data and sheet data.  
  - *Configuration:*  
    - System message defines constraints, objectives, output format, and mandatory use of the Google Sheet data.  
    - Input prompt is the extracted CV text.  
    - Uses output parser and Google Sheets as a tool.  
  - *Input:* Extracted text from PDF; calls Google Sheets node as a tool for data lookup.  
  - *Output:* JSON with candidate attributes and DEI eligibility decision.  
  - *Potential Failures:* AI model errors, tool invocation issues, parsing failures, missing data.

---

#### 1.3 Data Update & Decision Logic

**Overview:**  
Appends the eligibility results to the Google Sheet and evaluates the eligibility flag to direct subsequent email notification logic.

**Nodes Involved:**  
- Update on Sheet  
- Logic (If node)

**Node Details:**

- **Update on Sheet**  
  - *Type:* Google Sheets node  
  - *Role:* Appends candidate analysis results (Name, Location, Gender, Disability, Language, DEI status, Factor) as a new row to the “HR Dei” Google Sheet.  
  - *Configuration:* Operation “append,” mapping JSON output fields to columns.  
  - *Input:* JSON output from “Check for DEI Eligibility.”  
  - *Output:* Confirmation of row append operation.  
  - *Potential Failures:* Sheet write permission errors, data format issues, API limits.

- **Logic**  
  - *Type:* If node  
  - *Role:* Checks if the candidate’s DEI eligibility field equals “Yes.” Controls routing for email notification.  
  - *Configuration:* Condition tests `$json.DEI == "Yes"`.  
  - *Input:* Output from “Update on Sheet.”  
  - *Output:* True branch if eligible; false branch otherwise.  
  - *Potential Failures:* Missing DEI field, case sensitivity issues.

---

#### 1.4 Notification

**Overview:**  
Generates a detailed HTML email summarizing the candidate’s DEI eligibility and sends it to the hiring manager.

**Nodes Involved:**  
- Create Email  
- Email to Manager

**Node Details:**

- **Create Email**  
  - *Type:* Code node (JavaScript)  
  - *Role:* Builds a styled HTML email and plain text summary from candidate data, including eligibility status and factors.  
  - *Configuration:*  
    - Reads candidate attributes from input JSON.  
    - Applies inline CSS styles for email client compatibility.  
    - Constructs subject and preheader for the email.  
  - *Input:* JSON candidate data from “Logic” node true branch.  
  - *Output:* JSON with `subject`, `html`, and `text` fields for email sending.  
  - *Potential Failures:* Missing input data, script errors.

- **Email to Manager**  
  - *Type:* Gmail node  
  - *Role:* Sends the generated email to the configured hiring manager email address (`jyothi.swarup@techdome.net.in`).  
  - *Configuration:*  
    - Uses OAuth2 Gmail credentials.  
    - Subject and HTML message set from “Create Email” output.  
  - *Input:* Email content JSON from “Create Email.”  
  - *Output:* Email send confirmation.  
  - *Potential Failures:* Gmail auth errors, quota exceeded, invalid recipient address.

---

### 3. Summary Table

| Node Name                | Node Type                             | Functional Role                                    | Input Node(s)                     | Output Node(s)                | Sticky Note                                                                                               |
|--------------------------|-------------------------------------|---------------------------------------------------|----------------------------------|------------------------------|---------------------------------------------------------------------------------------------------------|
| CV Trigger               | Google Drive Trigger                 | Watches Google Drive folder for new CV files      | None                             | Download CV                  | ## CV Trigger  \nWatches Google Drive for newly added CV files and starts the workflow.                  |
| Download CV              | Google Drive                        | Downloads the detected CV file                     | CV Trigger                      | Extract from PDF             | ## Download CV  \nFetches the detected CV file from Drive and makes it available for processing.         |
| Extract from PDF          | Extract From File                   | Extracts text content from PDF                      | Download CV                     | Check for DEI Eligibility    | ## Extract From PDF  \nParses the CV PDF to extract key text and structured fields.                       |
| Azure OpenAI Chat Model   | LangChain Azure OpenAI Chat Model  | Runs GPT-4o-mini analysis on extracted text       | Extract from PDF                | Check for DEI Eligibility    | ## Azure OpenAI Chat Model  \nUses GPT on Azure OpenAI to analyze extracted CV content and generate insights. |
| Structured Output Parser  | LangChain Output Parser (Structured) | Parses GPT output into structured JSON             | Azure OpenAI Chat Model         | Check for DEI Eligibility    |                                                                                                         |
| Get row(s) in sheet in Google Sheets | Google Sheets Tool              | Reads current employee data for DEI comparison     | (Internally used by Check for DEI Eligibility) | Check for DEI Eligibility    |                                                                                                         |
| Check for DEI Eligibility | LangChain Agent                   | Evaluates DEI eligibility using CV and workforce data | Extract from PDF, Azure OpenAI Chat Model, Structured Output Parser, Google Sheets Tool | Update on Sheet             |                                                                                                         |
| Update on Sheet           | Google Sheets                      | Appends DEI eligibility results to Google Sheet    | Check for DEI Eligibility      | Logic                       | ## Update on Sheet  \nAppends the analyzed results and eligibility status back to the Google Sheet.      |
| Logic                    | If node                           | Routes execution based on DEI eligibility           | Update on Sheet                | Create Email (true branch)   | ## Logic  \nEvaluates conditions and routes the flow using true/false branches to control execution.     |
| Create Email             | Code node                        | Builds an HTML email summarizing DEI eligibility   | Logic (true branch)            | Email to Manager            | ## Create Email  \nGenerates a tailored email based on the candidate’s analysis and sheet data.           |
| Email to Manager         | Gmail node                      | Sends notification email to hiring manager          | Create Email                  | None                        | ## Email to Manager  \nSends the composed summary email to the hiring manager for review.                |
| Sticky Note              | Sticky Note                     | Informational note                                  | None                         | None                        | ## CV Trigger  \nWatches Google Drive for newly added CV files and starts the workflow.                  |
| Sticky Note1             | Sticky Note                     | Informational note                                  | None                         | None                        | ## Download CV  \nFetches the detected CV file from Drive and makes it available for processing.         |
| Sticky Note2             | Sticky Note                     | Informational note                                  | None                         | None                        | ## Extract From PDF  \nParses the CV PDF to extract key text and structured fields.                       |
| Sticky Note3             | Sticky Note                     | Informational note                                  | None                         | None                        | ## Azure OpenAI Chat Model  \nUses GPT on Azure OpenAI to analyze extracted CV content and generate insights. |
| Sticky Note4             | Sticky Note                     | Informational note                                  | None                         | None                        | ## Update on Sheet  \nAppends the analyzed results and eligibility status back to the Google Sheet.      |
| Sticky Note5             | Sticky Note                     | Informational note                                  | None                         | None                        | ## Create Email  \nGenerates a tailored email based on the candidate’s analysis and sheet data.           |
| Sticky Note6             | Sticky Note                     | Informational note                                  | None                         | None                        | ## Email to Manager  \nSends the composed summary email to the hiring manager for review.                |
| Sticky Note7             | Sticky Note                     | Informational note                                  | None                         | None                        | ## Logic  \nEvaluates conditions and routes the flow using true/false branches to control execution.     |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Google Drive Trigger node ("CV Trigger")**  
   - Type: Google Drive Trigger  
   - Configure: Watch for file creation event in folder ID `1KyX5RGqeF7v0sAvvaoBnJPTQoq4aOHLz` ("HR auto")  
   - Poll interval: every minute  
   - Connect output to next node.

2. **Create Google Drive node ("Download CV")**  
   - Operation: Download  
   - File ID: set dynamically from trigger output using expression `{{$json.webViewLink}}`  
   - Connect input to “CV Trigger” output.  
   - Ensure Google Drive OAuth2 credentials are configured.

3. **Create Extract From File node ("Extract from PDF")**  
   - Operation: PDF text extraction  
   - Input: binary data from “Download CV”  
   - Connect input to “Download CV” output.

4. **Create LangChain Azure OpenAI Chat Model node ("Azure OpenAI Chat Model")**  
   - Model: GPT-4o-mini  
   - Input: extracted text from “Extract from PDF”  
   - Credentials: Azure OpenAI account with API key, region, and deployment configured  
   - Connect input to “Extract from PDF” output.

5. **Create LangChain Structured Output Parser node ("Structured Output Parser")**  
   - Schema example: JSON structure with fields Name, Location, Language, Gender, Disability, DEI, Factor (see overview for example)  
   - Connect input to “Azure OpenAI Chat Model” AI output. (Use ai_languageModel output → ai_outputParser input)

6. **Create Google Sheets Tool node ("Get row(s) in sheet in Google Sheets")**  
   - Document ID: Google Sheet ID `1P8uforIuBJCkX0i9dl5BgUmzi4Nk63EHyFKLyeQvxT8`  
   - Sheet Name: “Sheet1” (gid=0)  
   - Operation: Read rows (default)  
   - Credentials: OAuth2 Google Sheets API  
   - This node will be used as a tool inside the next agent node (no direct connection).

7. **Create LangChain Agent node ("Check for DEI Eligibility")**  
   - Input: extracted text from “Extract from PDF”  
   - System message prompt: detailed instructions to use the sheet data and evaluate DEI eligibility strictly from self-reported data and sheet data, outputting structured JSON.  
   - Enable output parser and select the “Structured Output Parser” node.  
   - Add the Google Sheets Tool node as a mandatory tool for agent to query current workforce data.  
   - Connect inputs:  
     - ai_languageModel input from “Azure OpenAI Chat Model” output  
     - ai_outputParser input from “Structured Output Parser” output  
     - ai_tool input from “Get row(s) in sheet in Google Sheets” output  
   - Connect main output to next node.

8. **Create Google Sheets node ("Update on Sheet")**  
   - Operation: Append row  
   - Document ID and Sheet Name same as above  
   - Map columns to output JSON fields from “Check for DEI Eligibility”: Name, Location, Gender, Disability, Language, DEI, Factor  
   - Connect input from “Check for DEI Eligibility” output.

9. **Create If node ("Logic")**  
   - Condition: Check if `$json.DEI` equals “Yes” (case sensitive)  
   - Connect input from “Update on Sheet” output.  
   - True branch will lead to email creation; false branch ends workflow or could be extended.

10. **Create Code node ("Create Email")**  
    - Paste provided JavaScript code to build HTML and text email from input JSON fields (Name, Location, Language, Gender, Disability, DEI, Factor)  
    - Connect input from “Logic” node true branch.

11. **Create Gmail node ("Email to Manager")**  
    - Recipient: `jyothi.swarup@techdome.net.in`  
    - Subject: from input JSON `subject` field  
    - Message: from input JSON `html` field  
    - Credentials: Gmail OAuth2 with appropriate scopes to send email  
    - Connect input from “Create Email” output.

---

### 5. General Notes & Resources

| Note Content                                                                                                      | Context or Link                                                                                      |
|-------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| Workflow integrates Azure OpenAI GPT-4o-mini with Google Workspace for automated DEI candidate screening.          | Official integration example for AI-assisted HR analytics.                                         |
| The system prompt in the agent node is carefully crafted to enforce strict JSON output and conservative DEI logic. | Ensures compliance with data privacy and avoids inference of protected attributes.                  |
| Email formatting uses inline CSS compatible with most email clients and includes a preheader for better UX.        | Inline styling best practices for HTML email design.                                               |
| OAuth2 credentials for Google Drive, Google Sheets, Azure OpenAI, and Gmail must be set up with proper scopes.     | Refer to respective API docs for OAuth2 configuration.                                            |
| Google Sheet “HR Dei” structure is critical for DEI comparison and must be maintained with consistent column names.| See sheet ID: 1P8uforIuBJCkX0i9dl5BgUmzi4Nk63EHyFKLyeQvxT8; Sheet1 (gid=0).                        |
| Trigger folder “HR auto” must have write permissions for users uploading CVs.                                      | Google Drive folder ID: 1KyX5RGqeF7v0sAvvaoBnJPTQoq4aOHLz.                                        |

---

**Disclaimer:** The provided text is exclusively derived from an automated workflow created with n8n, adhering strictly to current content policies without any illegal, offensive, or protected elements. All handled data is legal and public.