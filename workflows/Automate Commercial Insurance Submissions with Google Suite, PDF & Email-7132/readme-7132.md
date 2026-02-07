Automate Commercial Insurance Submissions with Google Suite, PDF & Email

https://n8nworkflows.xyz/workflows/automate-commercial-insurance-submissions-with-google-suite--pdf---email-7132


# Automate Commercial Insurance Submissions with Google Suite, PDF & Email

### 1. Workflow Overview

This n8n workflow automates the processing and submission of commercial insurance applications using Google Suite services (Sheets, Docs, Drive), PDF generation, and email communication. It is designed to streamline insurance brokers' workflows by automatically selecting carriers, generating application PDFs, emailing carriers, tracking submissions, and notifying brokers.

The workflow is logically structured into the following blocks:

- **1.1 Input Reception & Validation:** Trigger and retrieve application data from Google Sheets; check for new applications.
- **1.2 Application Processing:** Batch process each application and select suitable insurance carriers.
- **1.3 Carrier Processing:** For each carrier, generate application documents, copy and update Google Docs, download files, wait for processing, and email carriers.
- **1.4 Submission Tracking:** Track carrier submissions and update Google Sheets accordingly.
- **1.5 Summary & Notification:** Create summary reports and notify brokers via email.
- **1.6 Auxiliary & Configuration:** Includes manual trigger node, test email setup, and carrier code generation for both test and production modes.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Validation

- **Overview:** This block initiates the workflow manually, retrieves application rows from Google Sheets, and verifies if there are applications to process.
- **Nodes Involved:** 
  - When clicking 'Execute workflow' (Manual Trigger)
  - Get row(s) in sheet (Google Sheets)
  - Check for Applications (If)
  - Process Each Application (SplitInBatches)

- **Node Details:**

  - **When clicking 'Execute workflow'**
    - Type: Manual Trigger
    - Role: Starts the workflow manually.
    - Configuration: Default.
    - Connections: Output → Get row(s) in sheet.
    - Edge cases: Manual start; no input data if trigger not activated.

  - **Get row(s) in sheet**
    - Type: Google Sheets
    - Role: Retrieves rows representing insurance applications.
    - Configuration: Connected to a specific Google Sheet and worksheet; reads new or all rows.
    - Key expressions: None explicitly.
    - Input: Manual Trigger output.
    - Output: Rows of application data.
    - Potential failures: Authentication errors, sheet access denied, empty sheet.
  
  - **Check for Applications**
    - Type: If node
    - Role: Checks if retrieved rows exist to continue processing.
    - Configuration: Condition checks if data length > 0.
    - Input: Output from Google Sheets.
    - Output: True → Process Each Application; False → workflow ends.
    - Edge cases: Empty sheet triggers no further processing.

  - **Process Each Application**
    - Type: SplitInBatches
    - Role: Processes each application individually in batches.
    - Configuration: Batch size (default or configured).
    - Input: Filtered applications.
    - Output: Single application passed downstream.
    - Edge cases: Large datasets handled by batching, potential timeouts.

---

#### 2.2 Application Processing

- **Overview:** Processes each application individually to select suitable carriers and consolidate data for further processing.
- **Nodes Involved:** 
  - Select Suitable Carriers (Code)
  - Process Each Carrier (SplitInBatches)
  - Merge (Merge)
  - Pre-process & Consolidate Data (Code)

- **Node Details:**

  - **Select Suitable Carriers**
    - Type: Code
    - Role: Applies logic to determine which carriers fit the given application.
    - Configuration: Custom JavaScript code; filters carriers based on application data.
    - Input: Single application data.
    - Output: List of suitable carriers.
    - Edge cases: Empty carrier list, code errors.
  
  - **Process Each Carrier**
    - Type: SplitInBatches
    - Role: Processes each carrier individually for the application.
    - Configuration: Batch size, default.
    - Input: Suitable carriers.
    - Output: Individual carrier data.
    - Edge cases: Large carrier lists, potential timeouts.

  - **Merge**
    - Type: Merge
    - Role: Combines outputs from carrier selection and other processing paths.
    - Configuration: Default merge mode.
    - Input: Multiple upstream nodes.
    - Output: Consolidated data.
    - Edge cases: Data mismatch if inputs are asynchronous.

  - **Pre-process & Consolidate Data**
    - Type: Code
    - Role: Prepares and structures data for summary creation and downstream processing.
    - Configuration: Custom JavaScript.
    - Input: Merged data.
    - Output: Consolidated application-carrier data.
    - Edge cases: Data inconsistency, code exceptions.

---

#### 2.3 Carrier Processing

- **Overview:** For each carrier, generates application PDFs, manipulates Google Docs, manages file operations, waits for processing, and sends emails to carriers.
- **Nodes Involved:** 
  - Generate Application PDF (Code)
  - Copy file (Google Drive)
  - Update a document (Google Docs)
  - Download file (Google Drive)
  - Wait (Wait)
  - Email to Carrier (Email Send)
  - Track Submission (Code)
  - If1 (If)
  - Update row in sheet (Google Sheets)

- **Node Details:**

  - **Generate Application PDF**
    - Type: Code
    - Role: Generates a PDF of the application customized for the carrier.
    - Configuration: Custom JavaScript creating PDF content.
    - Input: Carrier and application data.
    - Output: Reference to generated PDF file.
    - Edge cases: PDF generation errors, invalid data.

  - **Copy file**
    - Type: Google Drive
    - Role: Copies Google Docs template or files for modification.
    - Configuration: Source file ID, destination folder.
    - Input: Output from PDF generation or prior nodes.
    - Output: Copied file metadata.
    - Edge cases: Access denied, quota exceeded.

  - **Update a document**
    - Type: Google Docs
    - Role: Updates copied Google Docs with application-specific data.
    - Configuration: Document ID, replacement values.
    - Input: Copied file metadata.
    - Output: Updated document reference.
    - Edge cases: Document locked, invalid placeholders.

  - **Download file**
    - Type: Google Drive
    - Role: Downloads updated Google Doc as PDF.
    - Configuration: File ID, export as PDF.
    - Input: Updated document.
    - Output: PDF file binary data.
    - Edge cases: Download failure, file not found.

  - **Wait**
    - Type: Wait
    - Role: Pauses workflow execution for asynchronous processes or timing.
    - Configuration: Wait duration or webhook-based pause.
    - Input: Downloaded file.
    - Output: Passes after wait.
    - Edge cases: Timeout, webhook not triggered.

  - **Email to Carrier**
    - Type: Email Send
    - Role: Sends the generated PDF and application details to the carrier via email.
    - Configuration: SMTP or other email credentials; dynamic email fields.
    - Input: PDF and carrier email.
    - Output: Email sent confirmation.
    - Edge cases: SMTP authentication errors, invalid email addresses.

  - **Track Submission**
    - Type: Code
    - Role: Records submission status and other tracking metadata.
    - Configuration: Custom code updating internal status.
    - Input: Email sent confirmation.
    - Output: Updated tracking data.
    - Edge cases: Data persistence failure.

  - **If1**
    - Type: If
    - Role: Checks conditions post submission tracking to decide next steps.
    - Configuration: Condition based on tracking data.
    - Output: True → Update row in sheet; False → Merge node.
    - Edge cases: Incorrect condition evaluation.

  - **Update row in sheet**
    - Type: Google Sheets
    - Role: Updates application status or submission details in Google Sheets.
    - Configuration: Sheet ID, row number, columns to update.
    - Input: True output from If1.
    - Edge cases: Row locking, concurrent updates.

---

#### 2.4 Summary & Notification

- **Overview:** Consolidates process outcomes into summary reports and notifies the broker via email.
- **Nodes Involved:** 
  - Create Process Summary (Code)
  - If (If)
  - Notify Broker (Email Send)
  - No Operation (NoOp)

- **Node Details:**

  - **Create Process Summary**
    - Type: Code
    - Role: Generates a summary report of the entire processing batch.
    - Configuration: Aggregates relevant data, formats summary.
    - Input: Consolidated data.
    - Output: Summary content.
    - Edge cases: Data aggregation issues.

  - **If**
    - Type: If
    - Role: Evaluates if notification to broker is required.
    - Configuration: Conditional logic.
    - Output: True → Notify Broker; False → No Operation.
    - Edge cases: False positives/negatives.

  - **Notify Broker**
    - Type: Email Send
    - Role: Sends summary email notification to broker.
    - Configuration: Email credentials, dynamic content.
    - Input: Summary content.
    - Edge cases: Email delivery failure.

  - **No Operation**
    - Type: NoOp
    - Role: Placeholder for no action path.
    - Configuration: None.

---

#### 2.5 Auxiliary & Configuration

- **Overview:** Contains supporting nodes for test data and carrier code generation.
- **Nodes Involved:** 
  - Set Test Emails (Set)
  - Generate Carrier Code (Code)
  - Edit Fields (Output) (Set)
  - Generate Carrier Code (Production) (Code)
  - Edit Fields (Output)1 (Set)
  - Set Carriers (Set)
  - Generate Carrier Selection Code (Code)
  - Edit Fields (Output)2 (Set)

- **Node Details:**

  - **Set Test Emails**
    - Type: Set
    - Role: Defines test email addresses for testing environment.
    - Configuration: Static test emails.
    - Edge cases: Incorrect test emails.

  - **Generate Carrier Code / Generate Carrier Code (Production)**
    - Type: Code
    - Role: Generates identifying codes for carriers depending on environment.
    - Configuration: Environment check and code generation logic.
    - Edge cases: Code collisions.

  - **Edit Fields (Output) / Edit Fields (Output)1 / Edit Fields (Output)2**
    - Type: Set
    - Role: Formats or adjusts output data fields.
    - Configuration: Static or dynamic field assignments.

  - **Set Carriers**
    - Type: Set
    - Role: Initializes or sets carrier data list.
    - Configuration: Static or dynamic list.

  - **Generate Carrier Selection Code**
    - Type: Code
    - Role: Produces code or logic for carrier selection.
    - Configuration: Custom logic.

---

### 3. Summary Table

| Node Name                     | Node Type           | Functional Role                               | Input Node(s)                  | Output Node(s)                | Sticky Note                          |
|-------------------------------|---------------------|-----------------------------------------------|-------------------------------|------------------------------|------------------------------------|
| When clicking 'Execute workflow' | Manual Trigger      | Initiates workflow manually                    | -                             | Get row(s) in sheet          |                                    |
| Get row(s) in sheet            | Google Sheets       | Retrieves application data                     | When clicking 'Execute workflow' | Check for Applications        |                                    |
| Check for Applications         | If                  | Checks for presence of applications            | Get row(s) in sheet            | Process Each Application      |                                    |
| Process Each Application       | SplitInBatches      | Processes applications one by one              | Check for Applications          | Select Suitable Carriers      |                                    |
| Select Suitable Carriers       | Code                | Selects carriers suitable for each application | Process Each Application        | Process Each Carrier, Merge   |                                    |
| Process Each Carrier           | SplitInBatches      | Processes carriers one by one                   | Select Suitable Carriers        | Generate Application PDF      |                                    |
| Generate Application PDF       | Code                | Generates application PDFs                      | Process Each Carrier            | Copy file                    |                                    |
| Copy file                     | Google Drive        | Copies Google Docs file                          | Generate Application PDF        | Update a document            |                                    |
| Update a document              | Google Docs         | Updates Google Docs with application data       | Copy file                      | Download file                |                                    |
| Download file                 | Google Drive        | Downloads updated document as PDF                | Update a document               | Wait                        |                                    |
| Wait                         | Wait                | Delay for asynchronous processing                | Download file                  | Email to Carrier             |                                    |
| Email to Carrier              | Email Send          | Sends application PDF to carrier                 | Wait                          | Track Submission            |                                    |
| Track Submission             | Code                | Tracks submission status                          | Email to Carrier               | Process Each Carrier, If1    |                                    |
| If1                          | If                  | Decides whether to update Google Sheet           | Track Submission               | Update row in sheet, Merge   |                                    |
| Update row in sheet           | Google Sheets       | Updates application status in sheet               | If1                           | -                           |                                    |
| Merge                        | Merge               | Merges multiple data streams                       | Select Suitable Carriers, If1  | Pre-process & Consolidate Data |                                    |
| Pre-process & Consolidate Data | Code                | Consolidates data for summary                       | Merge                         | Create Process Summary       |                                    |
| Create Process Summary        | Code                | Creates a summary report                            | Pre-process & Consolidate Data | If                          |                                    |
| If                           | If                  | Checks if broker notification is necessary          | Create Process Summary         | Notify Broker, No Operation  |                                    |
| Notify Broker                | Email Send          | Sends notification email to broker                   | If                           | -                           |                                    |
| No Operation                 | NoOp                | Placeholder for no action                            | If                           | -                           |                                    |
| Set Test Emails              | Set                 | Defines test emails                                  | -                             | Generate Carrier Code        |                                    |
| Generate Carrier Code        | Code                | Generates carrier codes for test environment           | Set Test Emails               | Edit Fields (Output)         |                                    |
| Edit Fields (Output)         | Set                 | Edits output fields                                   | Generate Carrier Code          | -                           |                                    |
| Generate Carrier Code (Production) | Code           | Generates carrier codes for production environment       | -                             | Edit Fields (Output)1        |                                    |
| Edit Fields (Output)1        | Set                 | Edits output fields                                   | Generate Carrier Code (Production) | -                       |                                    |
| Set Carriers                | Set                 | Sets carrier list                                    | -                             | Generate Carrier Selection Code |                                    |
| Generate Carrier Selection Code | Code              | Generates selection code for carriers                    | Set Carriers                  | Edit Fields (Output)2        |                                    |
| Edit Fields (Output)2        | Set                 | Edits output fields                                   | Generate Carrier Selection Code | -                         |                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node:**
   - Name: `When clicking 'Execute workflow'`
   - Type: Manual Trigger
   - Purpose: Start the workflow manually.

2. **Add Google Sheets Node to Get Applications:**
   - Name: `Get row(s) in sheet`
   - Type: Google Sheets
   - Credentials: Google OAuth2 with access to relevant sheet.
   - Parameters: Select specific spreadsheet and worksheet containing applications.
   - Connect output of Manual Trigger to this node.

3. **Add If Node to Check for Applications:**
   - Name: `Check for Applications`
   - Type: If
   - Condition: Check if length of data array > 0.
   - Connect output of Get row(s) in sheet to this node.
   - True output branch goes to next step.

4. **Add SplitInBatches to Process Applications:**
   - Name: `Process Each Application`
   - Type: SplitInBatches
   - Parameters: Batch size (default or as needed).
   - Connect True output of Check for Applications to this node.

5. **Add Code Node to Select Suitable Carriers:**
   - Name: `Select Suitable Carriers`
   - Type: Code
   - JavaScript: Logic to filter carriers suitable for application data.
   - Input: Single application item.
   - Connect output of Process Each Application to this node.

6. **Add SplitInBatches to Process Each Carrier:**
   - Name: `Process Each Carrier`
   - Type: SplitInBatches
   - Parameters: Batch size as needed.
   - Connect first output of Select Suitable Carriers to this node.

7. **Add Code Node to Generate Application PDF:**
   - Name: `Generate Application PDF`
   - Type: Code
   - JavaScript: Generate PDF content from application and carrier data.
   - Connect output of Process Each Carrier (second output) to this node.

8. **Add Google Drive Node to Copy File:**
   - Name: `Copy file`
   - Type: Google Drive
   - Credentials: Google OAuth2 with Drive access.
   - Parameters: Source file ID of template, destination folder.
   - Connect output of Generate Application PDF to this node.

9. **Add Google Docs Node to Update Document:**
   - Name: `Update a document`
   - Type: Google Docs
   - Credentials: Google OAuth2 with Docs access.
   - Parameters: Document ID from copied file, placeholders replaced by application data.
   - Connect output of Copy file to this node.

10. **Add Google Drive Node to Download File:**
    - Name: `Download file`
    - Type: Google Drive
    - Credentials: Google OAuth2.
    - Parameters: File ID from updated document, export as PDF.
    - Connect output of Update a document to this node.

11. **Add Wait Node:**
    - Name: `Wait`
    - Type: Wait
    - Parameters: Configure wait time or webhook pause.
    - Connect output of Download file to this node.

12. **Add Email Send Node to Email to Carrier:**
    - Name: `Email to Carrier`
    - Type: Email Send
    - Credentials: SMTP or other email service.
    - Parameters: Dynamic email address, subject, body, attachment as PDF.
    - Connect output of Wait node to this node.

13. **Add Code Node to Track Submission:**
    - Name: `Track Submission`
    - Type: Code
    - JavaScript: Update submission status and tracking info.
    - Connect output of Email to Carrier to this node.

14. **Add If Node (If1) for Conditional Update:**
    - Name: `If1`
    - Type: If
    - Condition: Check tracking status or flags.
    - Connect output of Track Submission to this node.
    - True branch connects to Update row in sheet.
    - False branch connects to Merge node.

15. **Add Google Sheets Node to Update Row:**
    - Name: `Update row in sheet`
    - Type: Google Sheets
    - Credentials: Google OAuth2.
    - Parameters: Spreadsheet, worksheet, row number, columns to update submission status.
    - Connect True output of If1 to this node.

16. **Add Merge Node:**
    - Name: `Merge`
    - Type: Merge
    - Parameters: Default.
    - Connect False output of If1 and second output of Select Suitable Carriers to this node.

17. **Add Code Node to Pre-process & Consolidate Data:**
    - Name: `Pre-process & Consolidate Data`
    - Type: Code
    - JavaScript: Aggregate and format data for summary.
    - Connect output of Merge to this node.

18. **Add Code Node to Create Process Summary:**
    - Name: `Create Process Summary`
    - Type: Code
    - JavaScript: Generate overall summary report.
    - Connect output of Pre-process & Consolidate Data to this node.

19. **Add If Node to Check Notification Need:**
    - Name: `If`
    - Type: If
    - Condition: Evaluate if notification to broker required.
    - Connect output of Create Process Summary to this node.

20. **Add Email Send Node to Notify Broker:**
    - Name: `Notify Broker`
    - Type: Email Send
    - Credentials: SMTP or email service.
    - Parameters: Broker email, summary content.
    - Connect True output of If to this node.

21. **Add NoOp Node:**
    - Name: `No Operation`
    - Type: NoOp
    - Purpose: Placeholder for no notification path.
    - Connect False output of If to this node.

22. **Configure Auxiliary Nodes for Carrier Code and Test Emails:**
    - Add Set, Code, and Set nodes as per workflow to generate carrier codes and set test emails.
    - Connect in order: Set Test Emails → Generate Carrier Code → Edit Fields (Output)
    - For production: Generate Carrier Code (Production) → Edit Fields (Output)1
    - Set Carriers → Generate Carrier Selection Code → Edit Fields (Output)2

Ensure all nodes have appropriate credentials configured (Google OAuth2 for Sheets, Docs, Drive; SMTP for emails). Validate dynamic expressions for data fields throughout.

---

### 5. General Notes & Resources

| Note Content                                                                                         | Context or Link                                                                                   |
|----------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| This workflow leverages Google Suite integration extensively: Google Sheets, Docs, Drive, and Gmail. | Requires Google OAuth2 credentials with appropriate scopes for Sheets, Docs, Drive, and Gmail.  |
| Email sending depends on SMTP or compatible service; ensure credentials and sender addresses are valid. | SMTP credentials must support sending with attachments and dynamic recipient fields.            |
| The workflow uses batching to handle multiple applications and carriers efficiently.                 | Batch size parameters can be tuned for performance and API rate limit considerations.           |
| PDF generation and Google Docs updates depend on template files and placeholder consistency.        | Templates must have placeholders matching keys used in code nodes for accurate document population. |
| Wait node may use webhook or fixed delay to accommodate asynchronous Google Drive or email processes. | Adjust wait times as needed to match external system response times.                            |
| The workflow includes manual trigger for controlled execution; can be adapted for webhook or schedule. | Replace Manual Trigger with Webhook Trigger or Cron Trigger as required.                        |
| Project credits and additional information (if any) are maintained in sticky notes within the workflow. | Sticky notes are empty in provided data but can be used to annotate nodes or blocks.            |

---

**Disclaimer:** The text provided originates exclusively from an automated workflow created with n8n, a tool for integration and automation. This processing strictly adheres to content policies and contains no illegal, offensive, or protected elements. All data handled are legal and public.