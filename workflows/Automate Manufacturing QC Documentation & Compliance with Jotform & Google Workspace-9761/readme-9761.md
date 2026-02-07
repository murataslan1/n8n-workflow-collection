Automate Manufacturing QC Documentation & Compliance with Jotform & Google Workspace

https://n8nworkflows.xyz/workflows/automate-manufacturing-qc-documentation---compliance-with-jotform---google-workspace-9761


# Automate Manufacturing QC Documentation & Compliance with Jotform & Google Workspace

---
### 1. Workflow Overview

This workflow automates the Quality Control (QC) documentation and compliance tracking process for manufacturing using data inputs from Jotform and Google Sheets. It continuously monitors inspection submissions, processes inspection data to determine compliance status, stores reports, alerts the quality team of failures, generates certificates of compliance, emails these certificates to customers, and produces daily summary reports for management review.

The workflow is logically divided into these blocks:

- **1.1 Input Reception**: Collection of inspection data via scheduled checks on a Google Sheets queue and direct form submissions from Jotform.
- **1.2 Inspection Data Processing & Compliance Evaluation**: Parsing inspection data, calculating compliance status based on specifications, and identifying non-conformities.
- **1.3 Data Storage & Documentation**: Saving inspection reports to Google Drive and logging results to a tracking Google Sheet.
- **1.4 Alerts & Notifications**: Conditional alerting of the quality team via Slack on failed inspections.
- **1.5 Certificate Generation & Distribution**: Creating HTML certificates of compliance and emailing them to customers.
- **1.6 Daily Reporting**: Scheduled aggregation of daily inspection metrics and sending summary reports via Slack.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
This block triggers the workflow to receive new inspection data either by polling a Google Sheets queue every 15 minutes or by direct form submissions from Jotform. It ensures continuous and real-time data ingestion.

**Nodes Involved:**  
- Check for New Inspections (Schedule Trigger)  
- Read Inspection Queue (Google Sheets)  
- Jotform Trigger (JotForm Trigger)

**Node Details:**

- **Check for New Inspections**  
  - Type: Schedule Trigger  
  - Role: Periodically triggers the workflow every 15 minutes to check for new inspection data in Google Sheets.  
  - Configuration: Interval set to trigger every 15 minutes.  
  - Inputs: None (trigger node)  
  - Outputs: Connected to "Read Inspection Queue" node  
  - Edge Cases: Workflow may miss data if Google Sheets API is down or if rate limits are exceeded.

- **Read Inspection Queue**  
  - Type: Google Sheets  
  - Role: Reads the inspection entries queued in a specified Google Sheets document and sheet.  
  - Configuration: Uses documentId and sheetName parameters to specify which sheet to read. These are dynamically set in the workflow (hidden in JSON).  
  - Inputs: Triggered by "Check for New Inspections"  
  - Outputs: To "Process Inspection Data"  
  - Edge Cases: Possible failures if the spreadsheet is inaccessible, credentials expire, or data is malformed.

- **Jotform Trigger**  
  - Type: JotForm Trigger  
  - Role: Listens for real-time form submissions from a Jotform form (ID: 252815424602048).  
  - Configuration: Uses stored JotForm API credentials; webhook configured to receive submissions.  
  - Inputs: External event (form submission)  
  - Outputs: To "Process Inspection Data"  
  - Edge Cases: Webhook failures, credential expiry, or form ID changes could disrupt input reception.

---

#### 1.2 Inspection Data Processing & Compliance Evaluation

**Overview:**  
Processes raw inspection data from inputs, parses it, applies manufacturing specifications, and determines a compliance status (PASS/FAIL). It also identifies specific non-conformities.

**Nodes Involved:**  
- Process Inspection Data (Code)  
- Check if Failed (If)

**Node Details:**

- **Process Inspection Data**  
  - Type: Code (JavaScript)  
  - Role: For each inspection item, extracts key inspection details, parses measurements, compares them against predefined specs, calculates compliance status, and compiles a list of non-conformities.  
  - Configuration: Runs once per item; uses inline JavaScript with robust parsing and fallback defaults.  
  - Key Expressions: Uses `$input.item.json` to access incoming data; compliance logic compares dimensions, weight, and visual checks against spec thresholds (e.g., length between 100-102 mm).  
  - Inputs: From "Read Inspection Queue" or "Jotform Trigger"  
  - Outputs: Branches to "Store in Google Drive" and "Check if Failed"  
  - Edge Cases: Missing or invalid numeric data, unexpected field names, or empty inputs could cause parsing errors or incorrect compliance results.

- **Check if Failed**  
  - Type: If  
  - Role: Conditional node that evaluates if the compliance status is 'FAIL'.  
  - Configuration: Checks if `{{$json.compliance_status}} === 'FAIL'`.  
  - Inputs: From "Process Inspection Data"  
  - Outputs: On TRUE, routes to "Alert Quality Team"; on FALSE, no further action.  
  - Edge Cases: If compliance_status is missing or malformed, condition might fail or misroute.

---

#### 1.3 Data Storage & Documentation

**Overview:**  
Stores processed inspection data reports as JSON files in Google Drive and logs summarized inspection data into a Google Sheets tracking document.

**Nodes Involved:**  
- Store in Google Drive (Google Drive)  
- Log to Tracking Sheet (Google Sheets)  
- Generate Certificate (Code)  

**Node Details:**

- **Store in Google Drive**  
  - Type: Google Drive  
  - Role: Saves each inspection result as a JSON file named `QC_Report_{batch_number}_{id}.json` under "My Drive" root folder.  
  - Configuration: Uses dynamic filename construction from data fields; folder set to root drive.  
  - Inputs: From "Process Inspection Data"  
  - Outputs: To "Log to Tracking Sheet"  
  - Edge Cases: Google Drive API limits, file overwrite conflicts, or permission issues may cause failures.

- **Log to Tracking Sheet**  
  - Type: Google Sheets (Append)  
  - Role: Appends inspection summary data to a tracking sheet for audit and historical record keeping.  
  - Configuration: Uses documentId and sheetName parameters (hidden); append operation mode.  
  - Inputs: From "Store in Google Drive"  
  - Outputs: To "Generate Certificate"  
  - Edge Cases: Append failures due to sheet access issues or malformed data.

- **Generate Certificate**  
  - Type: Code (JavaScript)  
  - Role: Generates an HTML certificate of compliance per inspection, including detailed inspection results and compliance status.  
  - Configuration: Runs once per item; outputs HTML string and filename.  
  - Inputs: From "Log to Tracking Sheet"  
  - Outputs: To "Email Certificate"  
  - Edge Cases: HTML generation errors if input data is incomplete or invalid; date formatting issues.

---

#### 1.4 Alerts & Notifications

**Overview:**  
Sends Slack notifications to the quality team only when an inspection fails compliance, highlighting product, batch, status, and non-conformities.

**Nodes Involved:**  
- Alert Quality Team (Slack)

**Node Details:**

- **Alert Quality Team**  
  - Type: Slack  
  - Role: Sends formatted alert messages to a Slack channel via webhook on inspection failure.  
  - Configuration: Uses webhookId `d22990c8-4a80-46f8-8071-c6a7aedd2934`; message text dynamically includes product, batch, compliance status, and detailed non-conformities.  
  - Inputs: From "Check if Failed" (on TRUE)  
  - Outputs: None  
  - Edge Cases: Slack webhook failures, message formatting errors, or network issues could cause alert delivery failure.

---

#### 1.5 Certificate Generation & Distribution

**Overview:**  
Generates a detailed HTML certificate document for each inspection and emails it to the customer with a standardized subject and sender.

**Nodes Involved:**  
- Email Certificate (Email Send)

**Node Details:**

- **Email Certificate**  
  - Type: Email Send  
  - Role: Sends the generated certificate HTML as an attachment to the specified customer email or a default fallback email.  
  - Configuration: Subject includes batch number; sender email fixed as quality@yourcompany.com; attachment is the HTML content from "Generate Certificate".  
  - Inputs: From "Generate Certificate"  
  - Outputs: None  
  - Edge Cases: SMTP server failures, invalid email addresses, or attachment size limits may cause email send failure.

---

#### 1.6 Daily Reporting

**Overview:**  
At 8 AM daily, compiles all inspections from the current day, summarizes compliance metrics, and sends a formatted report to Slack.

**Nodes Involved:**  
- Daily Report Trigger (Schedule Trigger)  
- Get Daily Data (Google Sheets)  
- Generate Summary (Code)  
- Send Daily Report (Slack)

**Node Details:**

- **Daily Report Trigger**  
  - Type: Schedule Trigger  
  - Role: Triggers the daily reporting workflow once every day at 8 AM.  
  - Configuration: Trigger at hour 8 (8 AM).  
  - Inputs: None (trigger)  
  - Outputs: To "Get Daily Data"  
  - Edge Cases: Scheduler downtime or workflow paused state delays report.

- **Get Daily Data**  
  - Type: Google Sheets  
  - Role: Reads inspection data from a designated Google Sheets document for the day’s inspections.  
  - Configuration: Uses documentId and sheetName parameters (hidden).  
  - Inputs: From "Daily Report Trigger"  
  - Outputs: To "Generate Summary"  
  - Edge Cases: Data missing, corrupted, or access issues.

- **Generate Summary**  
  - Type: Code (JavaScript)  
  - Role: Aggregates inspection results for the day, calculating total inspections, pass/fail counts, pass rate, products inspected, inspectors involved, and common issues.  
  - Configuration: Processes all input items, filters by current date, and compiles a summary object.  
  - Inputs: From "Get Daily Data"  
  - Outputs: To "Send Daily Report"  
  - Edge Cases: Date parsing issues or empty datasets.

- **Send Daily Report**  
  - Type: Slack  
  - Role: Posts a daily summary message to Slack with key QC metrics and product listings.  
  - Configuration: Uses webhookId `e8a8d211-7f01-45d0-a16b-64675b98d59f`; message dynamically constructed with summary data.  
  - Inputs: From "Generate Summary"  
  - Outputs: None  
  - Edge Cases: Slack webhook failures or message formatting errors.

---

### 3. Summary Table

| Node Name               | Node Type           | Functional Role                             | Input Node(s)           | Output Node(s)              | Sticky Note                                               |
|-------------------------|---------------------|---------------------------------------------|-------------------------|-----------------------------|-----------------------------------------------------------|
| Check for New Inspections| Schedule Trigger    | Polls for new inspection data every 15 min | None                    | Read Inspection Queue       | ## 📥 INPUT SOURCES Two ways to receive data: Form submissions, Scheduled checks |
| Read Inspection Queue    | Google Sheets       | Reads queued inspection submissions         | Check for New Inspections | Process Inspection Data     |                                                           |
| Jotform Trigger          | JotForm Trigger     | Receives inspection data via form submissions| None                    | Process Inspection Data     | ## 📥 MANUAL FORM Jotform Trigger Create your form for free on [Jotform using this link](https://www.jotform.com/?partner=mediajade) |
| Process Inspection Data  | Code                | Parses and evaluates inspection compliance  | Read Inspection Queue, Jotform Trigger | Store in Google Drive, Check if Failed | ## 🔄 PROCESSING Calculates compliance based on specs |
| Store in Google Drive    | Google Drive        | Saves inspection report JSON files           | Process Inspection Data | Log to Tracking Sheet        | ## 💾 STORAGE Saves to Drive & tracking sheet             |
| Log to Tracking Sheet    | Google Sheets       | Logs inspection data to tracking sheet       | Store in Google Drive   | Generate Certificate         | ## 💾 STORAGE Saves to Drive & tracking sheet             |
| Check if Failed          | If                  | Checks if inspection failed                   | Process Inspection Data | Alert Quality Team           | ## 🔄 PROCESSING Calculates compliance based on specs     |
| Alert Quality Team       | Slack               | Sends Slack alert on failed inspections       | Check if Failed (TRUE)  | None                        | ## 🚨 ALERTS Notifies team for failures only               |
| Generate Certificate     | Code                | Creates HTML certificate of compliance        | Log to Tracking Sheet   | Email Certificate            | ## 📋 DOCS Generates & emails certificates                 |
| Email Certificate        | Email Send          | Emails certificate to customer                 | Generate Certificate    | None                        | ## 📋 DOCS Generates & emails certificates                 |
| Daily Report Trigger     | Schedule Trigger    | Triggers daily summary report at 8 AM         | None                    | Get Daily Data              | ## 📊 DAILY REPORTS Runs at 8 AM Summarizes metrics         |
| Get Daily Data           | Google Sheets       | Loads daily inspection data                    | Daily Report Trigger    | Generate Summary             | ## 📊 DAILY REPORTS Runs at 8 AM Summarizes metrics         |
| Generate Summary         | Code                | Aggregates daily inspection metrics           | Get Daily Data          | Send Daily Report            | ## 📊 DAILY REPORTS Runs at 8 AM Summarizes metrics         |
| Send Daily Report        | Slack               | Posts daily quality summary to Slack           | Generate Summary        | None                        | ## 📊 DAILY REPORTS Runs at 8 AM Summarizes metrics         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger "Check for New Inspections"**  
   - Type: Schedule Trigger  
   - Parameters: Interval trigger every 15 minutes.

2. **Create Google Sheets Node "Read Inspection Queue"**  
   - Operation: Read Rows  
   - Parameters: Set `documentId` and `sheetName` to your inspection queue sheet.  
   - Connect input from "Check for New Inspections".

3. **Create JotForm Trigger "Jotform Trigger"**  
   - Parameters: Set Form ID to your Jotform inspection form ID.  
   - Credential: Link valid JotForm API credentials.  
   - No input connection; this triggers on form submission.

4. **Create Code Node "Process Inspection Data"**  
   - Mode: Run Once For Each Item  
   - Paste the provided JavaScript code that parses inspection data, compares measurements to specs, and assigns compliance status.  
   - Connect inputs from both "Read Inspection Queue" and "Jotform Trigger".  
   - Outputs connect to "Store in Google Drive" and "Check if Failed".

5. **Create Google Drive Node "Store in Google Drive"**  
   - Operation: Upload File  
   - Parameters: Filename as `QC_Report_{{$json.batch_number}}_{{$json.id}}.json`  
   - Drive: "My Drive"; Folder: root  
   - Input: Connect from "Process Inspection Data".

6. **Create Google Sheets Node "Log to Tracking Sheet"**  
   - Operation: Append Row  
   - Parameters: Set `documentId` and `sheetName` for your tracking sheet.  
   - Input: Connect from "Store in Google Drive".

7. **Create Code Node "Generate Certificate"**  
   - Mode: Run Once For Each Item  
   - Paste provided JavaScript to build HTML certificate with inspection details.  
   - Input: Connect from "Log to Tracking Sheet".

8. **Create Email Send Node "Email Certificate"**  
   - Parameters:  
     - Subject: `Quality Certificate - Batch {{$json.batch_number}}`  
     - To: `{{$json.customer_email || 'customer@example.com'}}`  
     - From: `quality@yourcompany.com`  
     - Attachments: Use HTML content from "Generate Certificate".  
   - Input: Connect from "Generate Certificate".

9. **Create If Node "Check if Failed"**  
   - Condition: Check if `{{$json.compliance_status}}` equals "FAIL".  
   - Input: Connect from "Process Inspection Data".

10. **Create Slack Node "Alert Quality Team"**  
    - Webhook ID: Use your Slack webhook URL or ID.  
    - Message: Compose alert with product, batch, status, and non-conformities.  
    - Input: Connect from "Check if Failed" (TRUE branch).

11. **Create Schedule Trigger "Daily Report Trigger"**  
    - Parameters: Trigger at 8 AM daily.

12. **Create Google Sheets Node "Get Daily Data"**  
    - Operation: Read Rows  
    - Parameters: Set `documentId` and `sheetName` for daily data source.  
    - Input: Connect from "Daily Report Trigger".

13. **Create Code Node "Generate Summary"**  
    - Paste JavaScript code that aggregates daily inspections, computes pass rates, and summarizes issues.  
    - Input: Connect from "Get Daily Data".

14. **Create Slack Node "Send Daily Report"**  
    - Webhook ID: Use your Slack webhook URL or ID.  
    - Message: Format daily report with totals, pass/fail counts, pass rate, and product list.  
    - Input: Connect from "Generate Summary".

---

### 5. General Notes & Resources

| Note Content                                                                                              | Context or Link                                                                    |
|-----------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------|
| Two ways to receive inspection data: scheduled queue checks and Jotform form submissions.                 | Sticky Note near "Check for New Inspections" and "Jotform Trigger" nodes.         |
| Jotform form creation is free and can be started here: [Jotform Partner Link](https://www.jotform.com/?partner=mediajade) | Sticky note on "Jotform Trigger" node.                                            |
| Compliance is evaluated against fixed manufacturing specifications embedded in code (e.g., length 100-102 mm). | Processing block note.                                                            |
| Alerts notify only on failed inspections to reduce noise for the quality team.                            | Alert block sticky note.                                                          |
| Certificates are electronically generated and valid without signatures.                                   | Certificate generation code comment and note.                                    |
| Daily reports run at 8 AM and summarize QC metrics for management review.                                 | Daily reporting sticky note.                                                      |

---

**Disclaimer:**  
The provided content is generated from an automated n8n workflow designed for manufacturing QC documentation and complies with all applicable content policies and legal standards. All data processed are legal and publicly accessible.