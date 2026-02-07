Automate Employee Date Tracking & Reminders for HR with JavaScript

https://n8nworkflows.xyz/workflows/automate-employee-date-tracking---reminders-for-hr-with-javascript-5735


# Automate Employee Date Tracking & Reminders for HR with JavaScript

### 1. Workflow Overview

This workflow automates the tracking and management of employee-related dates for Human Resources (HR) purposes, including reminders and notifications. It is designed to handle employee data input, analyze key dates, schedule reminders, apply advanced filtering, and export formatted results to multiple communication platforms and calendars.

The workflow is logically organized into the following blocks:

- **1.1 Input Reception and Data Preparation:** Receiving HR employee data from Google Sheets or manual trigger and preparing it for processing.
- **1.2 Date Analysis & Categorization:** Analyzing employee dates to categorize events relevant to HR management.
- **1.3 Reminder Scheduling:** Scheduling reminders based on analyzed dates and sending notifications via Gmail and Google Calendar.
- **1.4 Advanced Filtering and Export:** Applying advanced filters on date data and exporting the results formatted to Slack and other outputs.
- **1.5 Supporting Utilities and Branding:** Includes sample data generation and workflow branding notes.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Data Preparation

**Overview:**  
This block handles the initial data input for employee date tracking. It can be triggered manually or via data from a Google Sheets source. It prepares the data fields for subsequent processing.

**Nodes Involved:**  
- When clicking 'Test workflow' (Manual Trigger)  
- HR DATA (Google Sheets)  
- Edit Fields (Set)  
- Sample Data Generator (Code)

**Node Details:**

- **When clicking 'Test workflow'**  
  - Type: Manual Trigger  
  - Role: Initiates the workflow manually for testing or execution on demand.  
  - Config: No parameters; triggers downstream nodes.  
  - Inputs: None  
  - Outputs: HR DATA  
  - Edge Cases: None typically, but workflow won't proceed without manual trigger unless data source changes.

- **HR DATA**  
  - Type: Google Sheets  
  - Role: Fetches employee data from a configured Google Sheets document.  
  - Config: Connected to a specific Google Sheets document and sheet containing employee dates.  
  - Inputs: Manual Trigger output  
  - Outputs: Edit Fields  
  - Possible Failures: Authentication errors, rate limits, or sheet not found.

- **Edit Fields**  
  - Type: Set  
  - Role: Adjusts or adds fields to the input data to standardize or prepare for analysis.  
  - Config: Defines which fields to keep or modify; may set default values or rename fields.  
  - Inputs: HR DATA  
  - Outputs: Date Analysis & Categorization  
  - Edge Cases: Missing or malformed fields could cause downstream issues.

- **Sample Data Generator**  
  - Type: Code  
  - Role: Generates synthetic employee data for testing without requiring real data input.  
  - Config: JavaScript code generating sample employee records with dates.  
  - Inputs: None  
  - Outputs: None connected in this workflow version (likely for manual use or isolated testing)  
  - Edge Cases: Code errors or data not matching expected schema.

---

#### 2.2 Date Analysis & Categorization

**Overview:**  
Analyzes and categorizes employee dates (e.g., contract renewals, anniversaries) to determine which events require reminders or special handling.

**Nodes Involved:**  
- Date Analysis & Categorization (Code)  
- Sticky Note - Date Analysis (Informational)

**Node Details:**

- **Date Analysis & Categorization**  
  - Type: Code  
  - Role: Processes input data records, calculates time differences from current dates, categorizes events by urgency or type.  
  - Config: Custom JavaScript logic analyzing dates and setting flags or categories.  
  - Inputs: Edit Fields  
  - Outputs: Reminder Scheduler, Advanced Date Filters  
  - Edge Cases: Date parsing errors, missing dates, timezone issues.

---

#### 2.3 Reminder Scheduling

**Overview:**  
Schedules reminders and notifications based on the date analysis, sending emails and adding calendar events to keep HR informed.

**Nodes Involved:**  
- Reminder Scheduler (Code)  
- Gmail (Email)  
- Google Calendar (Calendar)  
- Sticky Note - Reminder System (Informational)

**Node Details:**

- **Reminder Scheduler**  
  - Type: Code  
  - Role: Creates reminder tasks, formats notification content, and triggers communication nodes.  
  - Config: Script logic to generate reminders based on categorized dates.  
  - Inputs: Date Analysis & Categorization  
  - Outputs: Gmail, Google Calendar  
  - Edge Cases: Email sending failures, API limits, calendar event conflicts.

- **Gmail**  
  - Type: Gmail  
  - Role: Sends reminder emails to HR or designated recipients.  
  - Config: Uses OAuth2 credentials for Gmail; email template likely set via input parameters.  
  - Inputs: Reminder Scheduler  
  - Outputs: None  
  - Edge Cases: Authentication errors, email quota limits.

- **Google Calendar**  
  - Type: Google Calendar  
  - Role: Creates calendar events for reminders or HR actions.  
  - Config: OAuth2 credentials connected; event details from Reminder Scheduler.  
  - Inputs: Reminder Scheduler  
  - Outputs: None  
  - Edge Cases: Auth errors, event overlaps.

---

#### 2.4 Advanced Filtering and Export

**Overview:**  
Applies advanced filters to the date data for refined reporting or alerts, formats the data, and exports to Slack and other destinations.

**Nodes Involved:**  
- Advanced Date Filters (Code)  
- Date Formatting & Export (Code)  
- Slack (Messaging)  
- Sticky Note - Smart Filters  
- Sticky Note - Export System

**Node Details:**

- **Advanced Date Filters**  
  - Type: Code  
  - Role: Applies complex criteria to filter employee date data (e.g., selecting urgent cases).  
  - Config: JavaScript filtering logic.  
  - Inputs: Date Analysis & Categorization  
  - Outputs: Date Formatting & Export, Slack  
  - Edge Cases: Filtering errors, empty results.

- **Date Formatting & Export**  
  - Type: Code  
  - Role: Formats filtered data into readable summaries or tables for export.  
  - Config: Custom formatting logic for Slack messages or other outputs.  
  - Inputs: Advanced Date Filters  
  - Outputs: Slack, possibly other export nodes  
  - Edge Cases: Formatting errors, data inconsistencies.

- **Slack**  
  - Type: Slack  
  - Role: Sends formatted reminders or reports to Slack channels or users.  
  - Config: OAuth2 or token-based Slack credentials; message payload from formatting node.  
  - Inputs: Advanced Date Filters, Date Formatting & Export  
  - Outputs: None  
  - Edge Cases: Auth failures, rate limits.

---

#### 2.5 Supporting Utilities and Branding

**Overview:**  
Contains sticky notes for branding, instructions, and workflow organization, plus a sample data generator for development.

**Nodes Involved:**  
- Sticky Note - Branding  
- Sticky Note - Trigger  
- Sticky Note - Data Generation  
- Sticky Note - Date Analysis  
- Sticky Note - Reminder System  
- Sticky Note - Smart Filters  
- Sticky Note - Export System

**Node Details:**

- **Sticky Notes**  
  - Type: Sticky Note  
  - Role: Provide visual documentation, branding, and organizational context within the workflow editor.  
  - No inputs or outputs  
  - Important for user guidance.

---

### 3. Summary Table

| Node Name                     | Node Type           | Functional Role                   | Input Node(s)             | Output Node(s)               | Sticky Note                                            |
|-------------------------------|---------------------|---------------------------------|---------------------------|-----------------------------|--------------------------------------------------------|
| Sticky Note - Branding         | Sticky Note         | Branding / Documentation         |                           |                             |                                                        |
| Sticky Note - Trigger          | Sticky Note         | Documentation                   |                           |                             |                                                        |
| When clicking 'Test workflow'  | Manual Trigger      | Workflow start trigger           |                           | HR DATA                     |                                                        |
| HR DATA                       | Google Sheets       | Fetch employee data              | When clicking 'Test workflow' | Edit Fields               |                                                        |
| Edit Fields                   | Set                 | Prepare / adjust input fields    | HR DATA                    | Date Analysis & Categorization |                                                        |
| Sample Data Generator         | Code                | Generate test employee data      |                           |                             |                                                        |
| Sticky Note - Data Generation | Sticky Note         | Documentation                   |                           |                             |                                                        |
| Date Analysis & Categorization| Code                | Analyze and categorize dates     | Edit Fields                | Reminder Scheduler, Advanced Date Filters |                                                        |
| Sticky Note - Date Analysis   | Sticky Note         | Documentation                   |                           |                             |                                                        |
| Reminder Scheduler            | Code                | Schedule reminders and prepare notifications | Date Analysis & Categorization | Gmail, Google Calendar |                                                        |
| Gmail                        | Gmail               | Send reminder emails             | Reminder Scheduler         |                             |                                                        |
| Google Calendar              | Google Calendar     | Add calendar reminders           | Reminder Scheduler         |                             |                                                        |
| Sticky Note - Reminder System | Sticky Note         | Documentation                   |                           |                             |                                                        |
| Advanced Date Filters         | Code                | Apply advanced filtering         | Date Analysis & Categorization | Date Formatting & Export, Slack |                                                        |
| Date Formatting & Export      | Code                | Format data for export           | Advanced Date Filters      | Slack                       |                                                        |
| Slack                        | Slack               | Send reminders/reports to Slack | Advanced Date Filters, Date Formatting & Export |          |                                                        |
| Sticky Note - Smart Filters   | Sticky Note         | Documentation                   |                           |                             |                                                        |
| Sticky Note - Export System   | Sticky Note         | Documentation                   |                           |                             |                                                        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Manual Trigger node:**  
   - Name: "When clicking 'Test workflow'"  
   - Purpose: Start workflow manually.

2. **Add Google Sheets node:**  
   - Name: "HR DATA"  
   - Connect: Output of Manual Trigger → Input of HR DATA  
   - Configure credentials for Google Sheets OAuth2.  
   - Set Spreadsheet ID and Sheet name where employee data is stored.

3. **Add Set node:**  
   - Name: "Edit Fields"  
   - Connect: HR DATA → Edit Fields  
   - Configure fields to clean or rename as needed for uniform processing.

4. **Add Code node:**  
   - Name: "Date Analysis & Categorization"  
   - Connect: Edit Fields → Date Analysis & Categorization  
   - Implement JavaScript to analyze date fields, e.g., calculate days until events and categorize.

5. **Add Code node:**  
   - Name: "Reminder Scheduler"  
   - Connect: Date Analysis & Categorization → Reminder Scheduler  
   - Script to create reminder messages and event data.

6. **Add Gmail node:**  
   - Name: "Gmail"  
   - Connect: Reminder Scheduler → Gmail  
   - Configure Gmail OAuth2 credentials.  
   - Map email fields (To, Subject, Body) from Reminder Scheduler output.

7. **Add Google Calendar node:**  
   - Name: "Google Calendar"  
   - Connect: Reminder Scheduler → Google Calendar  
   - Configure OAuth2 credentials.  
   - Map event details from Reminder Scheduler output.

8. **Add Code node:**  
   - Name: "Advanced Date Filters"  
   - Connect: Date Analysis & Categorization → Advanced Date Filters  
   - Script to filter data for specific criteria (urgent reminders, specific date ranges).

9. **Add Code node:**  
   - Name: "Date Formatting & Export"  
   - Connect: Advanced Date Filters → Date Formatting & Export  
   - Format filtered data for Slack messages or other exports.

10. **Add Slack node:**  
    - Name: "Slack"  
    - Connect: Advanced Date Filters → Slack (also from Date Formatting & Export → Slack)  
    - Configure Slack credentials (OAuth2 or token).  
    - Map message payload from formatting node.

11. **Optional:** Add Code node as "Sample Data Generator" for testing without real data.

12. **Add Sticky Notes** in the editor at appropriate places to document branding, trigger info, data generation, date analysis, reminder system, smart filters, and export system for clarity.

---

### 5. General Notes & Resources

| Note Content                                                                                       | Context or Link                                  |
|--------------------------------------------------------------------------------------------------|-------------------------------------------------|
| This workflow automates HR date tracking with integrated email, calendar, and Slack notifications.| Workflow Purpose                                 |
| Uses OAuth2 credentials for Gmail, Google Sheets, Google Calendar, and Slack integrations.       | Integration Requirements                          |
| Sample data generator node helps in offline or controlled testing without live data.             | Development Utility                               |
| Sticky notes improve workflow readability and maintainability within n8n editor.                 | Workflow Documentation                            |

---

**Disclaimer:** The text provided is extracted exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.