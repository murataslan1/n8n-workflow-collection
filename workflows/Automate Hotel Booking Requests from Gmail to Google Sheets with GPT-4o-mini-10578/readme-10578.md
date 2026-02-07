Automate Hotel Booking Requests from Gmail to Google Sheets with GPT-4o-mini

https://n8nworkflows.xyz/workflows/automate-hotel-booking-requests-from-gmail-to-google-sheets-with-gpt-4o-mini-10578


# Automate Hotel Booking Requests from Gmail to Google Sheets with GPT-4o-mini

### 1. Workflow Overview

This workflow automates the processing of hotel booking requests received via Gmail by extracting booking details using AI (OpenAI GPT-4o-mini), validating and applying business rules, logging data to Google Sheets, and notifying relevant teams. It targets hotels, travel agencies, or booking operations teams aiming to streamline booking intake, reduce manual data entry, and ensure timely follow-up.

The workflow is logically divided into these blocks:

- **1.1 Input Reception:** Triggered hourly, it scans Gmail inbox for booking-related emails (including attachments).
- **1.2 Data Extraction:** Uses OpenAI GPT-4o-mini agents to extract structured booking details from email body text or PDF attachments.
- **1.3 Validation:** Verifies completeness and correctness of extracted data, identifying missing or illogical fields.
- **1.4 Business Rules Application:** Assigns priority, team, and status based on booking data such as room count, urgency, and agency type.
- **1.5 Logging and Notifications:** Logs booking data and team assignments to Google Sheets, sends confirmation emails to customers, and logs success metrics.
- **1.6 Error Handling:** Captures extraction or validation errors, logs them to Google Sheets, and sends detailed error notifications to administrators.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

**Overview:**  
This block triggers the workflow hourly, fetches new Gmail messages from the inbox, and filters emails relevant to hotel bookings by matching subject keywords.

**Nodes Involved:**  
- Look for incoming emails (Gmail Trigger)  
- Get many messages (Gmail)  
- Filter Booking Emails (Filter)  
- Configuration: User Settings (Set)  

**Node Details:**  

- **Look for incoming emails**  
  - Type: Gmail Trigger  
  - Role: Polls Gmail inbox hourly for new emails  
  - Config: Filters by label "INBOX", polling every hour  
  - Output: Raw email data including metadata and attachments  

- **Get many messages (1)**  
  - Type: Gmail  
  - Role: Retrieves email messages from trigger, downloads attachments if any  
  - Config: Limit 1 message per execution, downloads attachments  
  - Input: Trigger output  
  - Output: Full email JSON including headers, body, and attachments  

- **Filter Booking Emails**  
  - Type: Filter  
  - Role: Filters emails by subject containing booking-related keywords  
  - Config: Checks subject for substrings (case-insensitive): "Booking Request", "reservation", "room request", "accommodation", "check-in", "booking", etc. OR logic applied  
  - Input: Emails from Get many messages  
  - Output: Only booking-related emails proceed  

- **Configuration: User Settings**  
  - Type: Set  
  - Role: Stores user configuration values (Google Sheet ID, admin email)  
  - Config:  
    - gSheetID: Google Sheet document ID for logging  
    - adminEmailForErrors: Email for error notifications  
  - Output: Configuration data for downstream nodes  

---

#### 2.2 Data Extraction

**Overview:**  
Extracts structured booking information using AI from either the email body text or PDF attachments, depending on the presence of attachments.

**Nodes Involved:**  
- Check for Attachment (If)  
- Extract Attachment Data (ExtractFromFile)  
- OpenAI GPT Model (Attachment) (LM Chat OpenAI)  
- OpenAI Model for PDF (LangChain Agent)  
- OpenAI GPT Model (Email) (LM Chat OpenAI)  
- OpenAI Model for Email Text (LangChain Agent)  

**Node Details:**  

- **Check for Attachment**  
  - Type: If  
  - Role: Checks if the email contains any attachments  
  - Config: Evaluates if binary property count > 0  
  - Input: Configuration node output  
  - Output: True branch if attachment exists, else false  

- **Extract Attachment Data**  
  - Type: ExtractFromFile  
  - Role: Extracts text content from the first PDF attachment  
  - Config: Binary property name dynamically set to first attachment key  
  - Input: Attachment from Check for Attachment true branch  
  - Output: Extracted text from PDF  

- **OpenAI GPT Model (Attachment)**  
  - Type: LM Chat OpenAI  
  - Role: GPT-4o-mini model for AI text extraction from attachments  
  - Config: Model "gpt-4o-mini", temperature 0.3, responseFormat JSON object  
  - Input: Extracted PDF text  
  - Output: JSON booking info  

- **OpenAI Model for PDF**  
  - Type: LangChain Agent  
  - Role: Parses GPT output to extract required booking fields from PDF text  
  - Config: System message instructs to extract specific fields into JSON with data validation and formatting (dates to YYYY-MM-DD)  
  - Input: Output of GPT model (attachment)  
  - Output: Structured booking data JSON  

- **OpenAI GPT Model (Email)**  
  - Type: LM Chat OpenAI  
  - Role: GPT-4o-mini model for AI extraction from email body text  
  - Config: Same as attachment model (gpt-4o-mini, temp 0.3, JSON output)  
  - Input: Email body text  
  - Output: JSON booking info  

- **OpenAI Model for Email Text**  
  - Type: LangChain Agent  
  - Role: Parses GPT output to extract required booking fields from email body text  
  - Config: Same system message as PDF agent but adapted for email text  
  - Input: Output of GPT model (email)  
  - Output: Structured booking data JSON  

---

#### 2.3 Validation

**Overview:**  
Validates extracted booking data for completeness and logical consistency, catching missing fields or invalid dates.

**Nodes Involved:**  
- Validate Extraction (Code)  
- Check for Errors (If)  

**Node Details:**  

- **Validate Extraction**  
  - Type: Code  
  - Role: Runs JavaScript to verify AI extraction success, parse JSON, check required fields, validate dates and date logic  
  - Key logic:  
    - Checks presence of critical fields (travel_agency_name, number_of_rooms, check_in_date, check_out_date)  
    - Validates date formats and ensures check-out is after check-in  
    - On error, returns JSON with error details and flags `error_occurred: true`  
    - On success, returns `error_occurred: false` and validated booking data  
  - Input: AI extracted JSON object from LangChain agents  
  - Output: Validation result with error flags and data  

- **Check for Errors**  
  - Type: If  
  - Role: Routes flow based on validation outcome  
  - Config: Checks if `error_occurred` is false to proceed; otherwise routes to error handling  
  - Input: Validation output  
  - Output: Main (success) or alternate (error) branch  

---

#### 2.4 Business Rules Application

**Overview:**  
Applies business logic to assign priority, team, status, and other metadata based on booking details.

**Nodes Involved:**  
- Apply Business Rules (Code)  
- Log Team Assignment (Google Sheets)  
- Append to Cases Sheet (Google Sheets)  

**Node Details:**  

- **Apply Business Rules**  
  - Type: Code  
  - Role: Implements custom JavaScript rules including:  
    - Team assignment by number of rooms (Large, Group, Regular)  
    - Priority override if urgency is "urgent"  
    - Priority escalation if check-in date is within 7 days  
    - VIP agency detection assigns VIP Relations Team  
    - Calculates total nights between check-in and check-out  
    - Generates case ID and default booking reference if missing  
  - Input: Validated booking data from validation node  
  - Output: Enhanced booking data with business rule outputs  

- **Log Team Assignment**  
  - Type: Google Sheets  
  - Role: Appends team assignment details to "Team Assignments" sheet  
  - Config: Maps fields like case_id, priority, assigned_team, team_email, check_in_date, travel_agency, number_of_rooms  
  - Input: Output from Apply Business Rules  
  - Output: Confirmation of append operation  

- **Append to Cases Sheet**  
  - Type: Google Sheets  
  - Role: Appends full booking case info to "Cases" sheet for record-keeping  
  - Config: Maps detailed booking fields, metadata, original email info, and processing status  
  - Input: Output from Apply Business Rules  
  - Output: Confirmation of append operation  

---

#### 2.5 Logging and Notifications

**Overview:**  
Sends confirmation emails to booking contacts and logs success metrics for monitoring.

**Nodes Involved:**  
- Send Confirmation Email (Gmail)  
- Log Success Metrics (Google Sheets)  

**Node Details:**  

- **Send Confirmation Email**  
  - Type: Gmail  
  - Role: Sends a styled HTML confirmation email to the contact email extracted from booking data  
  - Config:  
    - Uses booking data to populate email body with booking details, case reference, priority, assigned team, status, and contact info  
    - Subject includes booking reference  
    - Continues on failure (to avoid halting workflow)  
  - Input: Booking data from Append to Cases Sheet output  
  - Output: Email sent confirmation or error  

- **Log Success Metrics**  
  - Type: Google Sheets  
  - Role: Logs metrics such as case ID, priority, timestamp, email sent status, assigned team, number of rooms, and processing time in seconds to "Success Metrics" sheet  
  - Config: Uses expression to calculate processing time and conditional email sent status  
  - Input: Output from Send Confirmation Email  
  - Output: Append confirmation  

---

#### 2.6 Error Handling

**Overview:**  
Handles any errors during extraction or validation by logging detailed error info to Google Sheets and notifying administrators by email.

**Nodes Involved:**  
- Log Error to Sheet (Google Sheets)  
- Send Error Notification (Gmail)  

**Node Details:**  

- **Log Error to Sheet**  
  - Type: Google Sheets  
  - Role: Appends error logs including error type, message, timestamp, extracted data, original email info, and workflow execution ID to "Error Logs" sheet  
  - Input: From Check for Errors' error branch or Validate Extraction errors  
  - Output: Append confirmation  

- **Send Error Notification**  
  - Type: Gmail  
  - Role: Sends detailed HTML formatted email to configured admin email with error details, original email snippet, extraction data, and action required message  
  - Config: Pulls admin email from configuration node  
  - Input: Output of Log Error to Sheet  
  - Output: Email sent confirmation  

---

### 3. Summary Table

| Node Name                 | Node Type                         | Functional Role                                         | Input Node(s)                    | Output Node(s)                    | Sticky Note                                                                                                      |
|---------------------------|----------------------------------|---------------------------------------------------------|---------------------------------|---------------------------------|------------------------------------------------------------------------------------------------------------------|
| Look for incoming emails  | Gmail Trigger                    | Trigger workflow hourly on new emails in inbox          | —                               | Get many messages (1)            | See Sticky Note19: filters booking-related emails by subject keywords                                            |
| Get many messages (1)     | Gmail                           | Fetches latest emails with attachments                   | Look for incoming emails         | Filter Booking Emails            |                                                                                                                  |
| Filter Booking Emails     | Filter                          | Filters emails for booking-related subjects              | Get many messages (1)            | Configuration: User Settings     | See Sticky Note19                                                                                                 |
| Configuration: User Settings | Set                            | Stores config values: Google Sheet ID, admin error email | Filter Booking Emails            | Check for Attachment             | See Sticky Note3: update Google Sheet ID and admin email                                                        |
| Check for Attachment      | If                              | Checks if email has attachments                           | Configuration: User Settings     | Extract Attachment Data / OpenAI Model for Email Text |                                                                                                                  |
| Extract Attachment Data   | ExtractFromFile                 | Extracts text from PDF attachments                        | Check for Attachment (true)      | OpenAI Model for PDF             | See Sticky Note20: extracts data from PDF using AI                                                              |
| OpenAI GPT Model (Attachment) | LM Chat OpenAI               | AI model extracts booking data from PDF text             | Extract Attachment Data          | OpenAI Model for PDF             |                                                                                                                  |
| OpenAI Model for PDF      | LangChain Agent                 | Parses AI output from PDF extraction                      | OpenAI GPT Model (Attachment)   | Validate Extraction             |                                                                                                                  |
| OpenAI GPT Model (Email)  | LM Chat OpenAI                 | AI model extracts booking data from email body           | Check for Attachment (false)     | OpenAI Model for Email Text      |                                                                                                                  |
| OpenAI Model for Email Text | LangChain Agent               | Parses AI output from email body extraction               | OpenAI GPT Model (Email)         | Validate Extraction             |                                                                                                                  |
| Validate Extraction       | Code                           | Validates extracted data for completeness and correctness | OpenAI Model for Email Text / OpenAI Model for PDF | Check for Errors               | See Sticky Note24: validates required fields, date formats, and logic                                           |
| Check for Errors          | If                             | Routes flow based on validation result                    | Validate Extraction             | Apply Business Rules / Log Error to Sheet |                                                                                                                  |
| Apply Business Rules      | Code                           | Applies priority, team assignment, status, and metadata  | Check for Errors (success)       | Log Team Assignment / Append to Cases Sheet |                                                                                                                  |
| Log Team Assignment       | Google Sheets                  | Logs team assignment data                                 | Apply Business Rules             | —                               | See Sticky Note18: logs team assignments                                                                        |
| Append to Cases Sheet     | Google Sheets                  | Logs detailed booking case data                           | Apply Business Rules             | Send Confirmation Email         | See Sticky Note18: logs booking cases                                                                            |
| Send Confirmation Email  | Gmail                          | Sends confirmation email to contact                       | Append to Cases Sheet            | Log Success Metrics             | See Sticky Note4: sends confirmation emails                                                                      |
| Log Success Metrics       | Google Sheets                  | Logs success metrics for monitoring                       | Send Confirmation Email          | —                               | See Sticky Note17: logs success metrics                                                                          |
| Log Error to Sheet        | Google Sheets                  | Logs extraction/validation errors                         | Check for Errors (error)         | Send Error Notification         | See Sticky Note5: logs errors                                                                                     |
| Send Error Notification   | Gmail                          | Sends error notification email to admin                  | Log Error to Sheet               | —                               | See Sticky Note5                                                                                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Gmail Trigger Node ("Look for incoming emails")**  
   - Type: Gmail Trigger  
   - Configure polling interval: every hour  
   - Filter: Label "INBOX"  
   - Connect to next node  

2. **Create Gmail Node ("Get many messages (1)")**  
   - Operation: Get All messages  
   - Limit: 1 (or as desired)  
   - Enable attachment downloads  
   - Connect input from Gmail Trigger  

3. **Create Filter Node ("Filter Booking Emails")**  
   - Condition: Subject contains (case-insensitive) any of the following: "Booking Request", "reservation", "room request", "accommodation", "check-in", "booking"  
   - Logic: OR on conditions  
   - Connect input from Get many messages (1)  

4. **Create Set Node ("Configuration: User Settings")**  
   - Add string values:  
     - gSheetID: [Your Google Sheet ID]  
     - adminEmailForErrors: [Admin email for error alerts]  
   - Connect input from Filter Booking Emails output  

5. **Create If Node ("Check for Attachment")**  
   - Condition: Number of binary properties > 0 (attachments exist)  
   - Connect input from Configuration node  

6. **Create ExtractFromFile Node ("Extract Attachment Data")**  
   - Operation: PDF extraction  
   - Binary property name: first attachment key dynamically determined  
   - Connect input from Check for Attachment true branch  

7. **Create OpenAI LM Chat Node ("OpenAI GPT Model (Attachment)")**  
   - Model: gpt-4o-mini  
   - Temperature: 0.3  
   - Response format: JSON object  
   - Connect input from Extract Attachment Data  

8. **Create LangChain Agent Node ("OpenAI Model for PDF")**  
   - System message: Instruct AI to extract booking info JSON with required fields, parsing dates to YYYY-MM-DD, null if missing  
   - Connect input from OpenAI GPT Model (Attachment) output  

9. **Create OpenAI LM Chat Node ("OpenAI GPT Model (Email)")**  
   - Model: gpt-4o-mini  
   - Temperature: 0.3  
   - Response format: JSON object  
   - Connect input from Check for Attachment false branch (email body text)  

10. **Create LangChain Agent Node ("OpenAI Model for Email Text")**  
    - Same system message as PDF model but for email text extraction  
    - Connect input from OpenAI GPT Model (Email) output  

11. **Create Code Node ("Validate Extraction")**  
    - JavaScript to:  
      - Detect extraction errors or missing output  
      - Parse JSON output  
      - Check required fields: travel_agency_name, number_of_rooms, check_in_date, check_out_date  
      - Validate dates format and logic (check-out > check-in)  
      - Return error details or validated data object  
    - Connect input from both LangChain agent nodes outputs  

12. **Create If Node ("Check for Errors")**  
    - Condition: `error_occurred` is false to proceed  
    - Connect input from Validate Extraction output  

13. **Create Code Node ("Apply Business Rules")**  
    - JavaScript to:  
      - Assign teams and priority based on number_of_rooms, urgency, VIP agencies, check-in proximity  
      - Calculate total nights  
      - Generate default booking reference and case ID  
    - Connect input from Check for Errors success branch  

14. **Create Google Sheets Node ("Log Team Assignment")**  
    - Operation: Append  
    - Sheet: Team Assignments  
    - Map fields: case_id, priority, assigned_team, team_email, check_in_date, travel_agency, number_of_rooms  
    - Connect input from Apply Business Rules output  

15. **Create Google Sheets Node ("Append to Cases Sheet")**  
    - Operation: Append  
    - Sheet: Cases  
    - Map detailed booking and metadata fields including original email info  
    - Connect input from Apply Business Rules output  

16. **Create Gmail Node ("Send Confirmation Email")**  
    - To: contact_email  
    - Subject: "Booking Request Received - Ref #{{case_id}}"  
    - HTML body: Styled email with booking details, status, assigned team, and contact info  
    - Continue on failure enabled  
    - Connect input from Append to Cases Sheet output  

17. **Create Google Sheets Node ("Log Success Metrics")**  
    - Operation: Append  
    - Sheet: Success Metrics  
    - Map metrics: case_id, priority, timestamp, email_sent status, assigned_team, number_of_rooms, processing time  
    - Connect input from Send Confirmation Email output  

18. **Create Google Sheets Node ("Log Error to Sheet")**  
    - Operation: Append  
    - Sheet: Error Logs  
    - Map fields: timestamp, error_type, error_message, extracted_data, original sender/subject, email snippet, workflow execution ID  
    - Connect input from Check for Errors error branch  

19. **Create Gmail Node ("Send Error Notification")**  
    - To: adminEmailForErrors  
    - Subject: "⚠️ Booking Processing Error - {{error_type}}"  
    - HTML body: Detailed error info, original email snippet, extracted data, action required message  
    - Connect input from Log Error to Sheet output  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                         | Context or Link                                                                                   |
|------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| This workflow automates hotel booking request processing by extracting data from Gmail using GPT-4o-mini and routing bookings with business rules. | Main project purpose                                                                              |
| Google Sheet template with tabs: Cases, Team Assignments, Error Logs, Success Metrics must be created before usage.                                  | https://docs.google.com/spreadsheets/d/1qhUoE4baN5TyO51mD2caYU789XizhXl3UDCCT0v83So/edit?usp=sharing |
| Credentials required: Gmail OAuth2, Google Sheets OAuth2, OpenAI API key configured in n8n for all respective nodes.                                | Setup requirement                                                                                |
| Strong error handling ensures no booking requests are lost; admins receive detailed emails on failures.                                              | See Sticky Note5 and Sticky Note21                                                              |
| Booking priority and team assignments are dynamically assigned based on room count, urgency, and VIP agency detection.                              | Business logic detailed in Apply Business Rules node                                            |
| [Data Flow Diagrams for Confirmation Email and Error Notification](https://i.postimg.cc/X7yn1dtV/Screenshot-2025-11-07-at-00-36-19.png)             | Sticky Note4                                                                                     |
| [Error Notification Diagram](https://i.postimg.cc/tRvgMXT2/Screenshot-2025-11-07-at-00-54-22.png)                                                    | Sticky Note5                                                                                     |

---

**Disclaimer:** The text provided is exclusively derived from an n8n workflow automation. It complies strictly with content policies and contains no illegal, offensive, or protected elements. All data processed is legal and publicly accessible.