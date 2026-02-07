Automate CV Screening & Candidate Validation with AI & Email Parsing

https://n8nworkflows.xyz/workflows/automate-cv-screening---candidate-validation-with-ai---email-parsing-6216


# Automate CV Screening & Candidate Validation with AI & Email Parsing

### 1. Workflow Overview

This workflow automates the screening and validation of candidate CVs received via email. It is designed to handle incoming emails with attached CV PDFs, extract and parse relevant candidate information from the PDFs, validate the extracted data against required criteria, and then either save valid CVs into categorized folders or notify HR via email if the CV is invalid or incomplete.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Listens for new incoming emails containing CV attachments.
- **1.2 CV Content Extraction:** Extracts text content from attached PDF CV files.
- **1.3 Data Readiness Assurance:** Pauses execution to ensure all extracted data is fully loaded before further processing.
- **1.4 CV Parsing and Structuring:** Analyzes extracted text to identify candidate details and classify the candidate’s department based on keywords.
- **1.5 Validation:** Checks if essential data fields are present and valid.
- **1.6 Outcome Handling:** Depending on validation results, saves valid CVs into department-specific folders or sends notification emails for invalid CVs.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block monitors an email inbox via IMAP for new unseen emails with subject lines containing "CV", triggering the workflow upon such emails' arrival.

- **Nodes Involved:**  
  - Trigger on New CV Email

- **Node Details:**  
  - **Node Name:** Trigger on New CV Email  
  - **Type:** Email Read (IMAP)  
  - **Configuration:**  
    - Watches for unseen emails with subject containing "CV".  
    - Email format set to “resolved” to retrieve full email content including attachments.  
  - **Credentials:** Uses configured IMAP credentials for connecting to the mail server.  
  - **Inputs:** None (trigger node).  
  - **Outputs:** Email data including attachments, specifically targeting CV PDFs.  
  - **Edge Cases / Failures:**  
    - Authentication errors with IMAP server.  
    - No emails matching criteria (workflow waits).  
    - Large or corrupted email attachments may cause extraction issues.  

#### 2.2 CV Content Extraction

- **Overview:**  
  Extracts textual content from the attached PDF CV to prepare for parsing.

- **Nodes Involved:**  
  - Extract Text from PDF CV

- **Node Details:**  
  - **Node Name:** Extract Text from PDF CV  
  - **Type:** Extract from File  
  - **Configuration:**  
    - Operation set to extract text from PDF.  
    - The binary property targeted is "attachment_0" representing the first attachment of the email.  
  - **Inputs:** Email data with attachment from the previous node.  
  - **Outputs:** JSON with extracted text content of the CV.  
  - **Edge Cases / Failures:**  
    - Attachment missing or not a valid PDF.  
    - PDF content extraction failure due to encryption or corruption.  

#### 2.3 Data Readiness Assurance

- **Overview:**  
  Ensures workflow proceeds only after the extracted CV data is fully loaded and ready to be processed.

- **Nodes Involved:**  
  - Ensure All CV Data Loaded

- **Node Details:**  
  - **Node Name:** Ensure All CV Data Loaded  
  - **Type:** Wait  
  - **Configuration:**  
    - Uses a webhook-based pause, waiting for data readiness before continuing.  
  - **Inputs:** Extracted text from previous node.  
  - **Outputs:** Passes data forward once ready.  
  - **Edge Cases / Failures:**  
    - Potential indefinite waiting if webhook trigger does not occur.  

#### 2.4 CV Parsing and Structuring

- **Overview:**  
  Parses extracted CV text to identify candidate name and classify the candidate into a department based on keyword matches and priority rules.

- **Nodes Involved:**  
  - Parse & Structure CV Information

- **Node Details:**  
  - **Node Name:** Parse & Structure CV Information  
  - **Type:** Code (JavaScript)  
  - **Configuration:**  
    - Uses custom JavaScript logic to parse the CV text.  
    - Keywords matched against the CV content to assign departments such as HR, BDE, SEO, DevOps, Development, Engineering, Marketing, Sales, Support, QA.  
    - Each keyword has a priority to resolve conflicts; highest priority department is selected.  
    - Extracts candidate username (assumed first line of CV text).  
  - **Inputs:** Text extracted from PDF.  
  - **Outputs:** JSON containing `department` and `username`.  
  - **Key Expressions/Variables:**  
    - `keywordsToDepartments` mapping keywords to department names.  
    - `priority` object to rank keywords.  
    - Returns `{ department, username }` object.  
  - **Edge Cases / Failures:**  
    - CV text missing or empty.  
    - No matching department keywords found (defaults to "Unknown").  
    - Parsing errors in JavaScript code.  

#### 2.5 Validation

- **Overview:**  
  Verifies that the parsed CV data contains a valid department (not "Unknown") before proceeding.

- **Nodes Involved:**  
  - Check CV for Required Fields

- **Node Details:**  
  - **Node Name:** Check CV for Required Fields  
  - **Type:** If (Boolean Condition)  
  - **Configuration:**  
    - Checks if the `department` field is not equal to "Unknown".  
  - **Inputs:** Parsed candidate info including department.  
  - **Outputs:**  
    - True branch: proceed to save CV.  
    - False branch: trigger notification for invalid CV.  
  - **Edge Cases / Failures:**  
    - Missing department field.  
    - Incorrect data types causing condition check failure.  

#### 2.6 Outcome Handling

- **Overview:**  
  Based on validation, either saves valid CVs into department-specific folders or sends notification emails for invalid CVs.

- **Nodes Involved:**  
  - Save Valid CV to Folder  
  - Notify HR of Invalid CV

- **Node Details:**  

  - **Save Valid CV to Folder**  
    - **Type:** Execute Command (Shell)  
    - **Configuration:**  
      - Creates a directory path `/home/node/.n8n/resume/{{ department }}/`.  
      - Saves the CV text content into a file named after the username with spaces replaced by hyphens, with `.pdf` extension (note: file content is text, not original PDF binary).  
    - **Inputs:** Validated candidate data with department and username.  
    - **Outputs:** None (side effect: file system).  
    - **Edge Cases / Failures:**  
      - File system permission errors.  
      - Username containing invalid filename characters.  
      - Loss of original PDF formatting since saving extracted text only.  

  - **Notify HR of Invalid CV**  
    - **Type:** Email Send (SMTP)  
    - **Configuration:**  
      - Sends an email with subject "CV Processing Error" and body "CV Not Found" to `abc@gmail.com` from `xyz@gmail.com`.  
      - Uses SMTP credentials to send email.  
    - **Inputs:** Invalid CV trigger from validation node.  
    - **Outputs:** None  
    - **Edge Cases / Failures:**  
      - SMTP authentication failures.  
      - Email delivery failures.  

---

### 3. Summary Table

| Node Name                   | Node Type          | Functional Role                          | Input Node(s)                 | Output Node(s)                      | Sticky Note                                                                                           |
|-----------------------------|--------------------|----------------------------------------|------------------------------|-----------------------------------|-----------------------------------------------------------------------------------------------------|
| Trigger on New CV Email      | Email Read (IMAP)  | Listens for new emails containing CVs | None                         | Extract Text from PDF CV           | Listens for new emails containing CV attachments.                                                   |
| Extract Text from PDF CV     | Extract from File  | Extracts text from attached PDF CVs    | Trigger on New CV Email       | Ensure All CV Data Loaded          | Parses CV content from attached PDF files.                                                          |
| Ensure All CV Data Loaded    | Wait               | Pauses until full data is ready        | Extract Text from PDF CV      | Parse & Structure CV Information   | Pauses until full data is ready for processing.                                                     |
| Parse & Structure CV Information | Code           | Parses CV text, extracts candidate info and department classification | Ensure All CV Data Loaded | Check CV for Required Fields       | Extracts structured details like name, skills, education, experience using AI or custom logic.      |
| Check CV for Required Fields | If (Boolean)       | Validates department presence          | Parse & Structure CV Information | Save Valid CV to Folder, Notify HR of Invalid CV | Verifies presence of essential fields (e.g. name, email, skills) before proceeding.                 |
| Save Valid CV to Folder      | Execute Command    | Stores valid CVs in department folders | Check CV for Required Fields (True branch) | None                            | Stores successfully validated CVs into a target directory.                                          |
| Notify HR of Invalid CV      | Email Send (SMTP)  | Sends alert for invalid/incomplete CVs | Check CV for Required Fields (False branch) | None                         | Sends email alert for incomplete or invalid CVs.                                                    |
| Sticky Notes (6 total)       | Sticky Note        | Documentation and clarifications       | N/A                          | N/A                               | See individual notes in section 2 for each sticky note’s content.                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Node: "Trigger on New CV Email"**  
   - Type: Email Read (IMAP)  
   - Credentials: Set up IMAP credentials for the email account.  
   - Parameters:  
     - Format: Resolved  
     - Options: Custom email filter with `["UNSEEN", ["SUBJECT", "CV"]]` to detect new unseen emails with "CV" in subject.  

2. **Add Node: "Extract Text from PDF CV"**  
   - Type: Extract from File  
   - Parameters:  
     - Operation: PDF text extraction  
     - Binary Property Name: `attachment_0` (first email attachment)  
   - Connect output of "Trigger on New CV Email" to this node.  

3. **Add Node: "Ensure All CV Data Loaded"**  
   - Type: Wait  
   - Parameters: Leave default or configure as webhook-based wait if needed.  
   - Connect output of "Extract Text from PDF CV" to this node.  

4. **Add Node: "Parse & Structure CV Information"**  
   - Type: Code (JavaScript)  
   - Parameters: Insert the following custom JS code:  
     ```javascript
     const fileContent = ($input.first().json.text || '').toLowerCase();
     const keywordsToDepartments = {
       hr: 'HR',
       bde: 'BDE',
       'business development': 'BDE',
       seo: 'SEO',
       devops: 'DevOps',
       developer: 'Development',
       engineer: 'Engineering',
       marketing: 'Marketing',
       sales: 'Sales',
       support: 'Support',
       tester: 'QA',
       qa: 'QA',
     };
     const priority = {
       devops: 3,
       developer: 3,
       engineer: 3,
       seo: 2,
       bde: 2,
       'business development': 2,
       marketing: 2,
       sales: 2,
       support: 2,
       tester: 2,
       qa: 2,
       hr: 1,
     };
     let matches = [];
     for (const [keyword, department] of Object.entries(keywordsToDepartments)) {
       if (fileContent.includes(keyword)) {
         matches.push({ department, priority: priority[keyword] || 0 });
       }
     }
     const originalText = $input.first().json.text || '';
     const username = originalText.split('\n')[0].trim();
     if (matches.length > 0) {
       const bestMatch = matches.reduce((best, current) =>
         current.priority > best.priority ? current : best
       );
       return [{ department: bestMatch.department, username }];
     }
     return [{ department: 'Unknown', username }];
     ```  
   - Connect output of "Ensure All CV Data Loaded" to this node.  

5. **Add Node: "Check CV for Required Fields"**  
   - Type: If (Boolean condition)  
   - Parameters:  
     - Condition: Check if `{{$json["department"]}}` is not equal to `"Unknown"`.  
   - Connect output of "Parse & Structure CV Information" to this node.  

6. **Add Node: "Save Valid CV to Folder"**  
   - Type: Execute Command  
   - Parameters:  
     - Command:  
       ```bash
       mkdir -p /home/node/.n8n/resume/{{ $json.department }}/ && echo "{{ $('Extract Text from PDF CV').item.json.text }}" > /home/node/.n8n/resume/{{ $json.department }}/{{ $json.username.replace(/ /g, '-') }}.pdf
       ```  
   - Connect the **True** branch of "Check CV for Required Fields" to this node.  

7. **Add Node: "Notify HR of Invalid CV"**  
   - Type: Email Send (SMTP)  
   - Credentials: Configure SMTP credentials for sending emails.  
   - Parameters:  
     - To Email: `abc@gmail.com`  
     - From Email: `xyz@gmail.com`  
     - Subject: "CV Processing Error"  
     - Text: "CV Not Found"  
   - Connect the **False** branch of "Check CV for Required Fields" to this node.  

8. **Optionally Add Sticky Notes** for documentation clarity near each logical block.

---

### 5. General Notes & Resources

| Note Content                                                                                                  | Context or Link                                                                                      |
|---------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| The workflow assumes CVs are attached as PDFs in emails with "CV" in the subject line.                        | Input reception prerequisites.                                                                     |
| The CV parsing logic depends heavily on keyword matching and priority ranking defined in custom JavaScript.   | Parsing and classification logic.                                                                  |
| The saved CV files are text dumps of extracted content, not original PDFs, so original formatting is lost.    | File saving approach may require enhancement if original PDFs are needed.                           |
| SMTP and IMAP credentials need to be securely configured before running the workflow in production.           | Credentials management and security.                                                               |
| For scalability, consider adding error handling and retry logic for failed email reads or file operations.    | Robustness and maintainability best practices.                                                    |
| Sticky notes included in the workflow provide inline documentation and clarifications for each major step.    | Workflow self-documentation practice.                                                              |

---

**Disclaimer:** The text provided originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All manipulated data is legal and publicly accessible.