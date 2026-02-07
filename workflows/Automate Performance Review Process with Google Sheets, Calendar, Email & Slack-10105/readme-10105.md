Automate Performance Review Process with Google Sheets, Calendar, Email & Slack

https://n8nworkflows.xyz/workflows/automate-performance-review-process-with-google-sheets--calendar--email---slack-10105


# Automate Performance Review Process with Google Sheets, Calendar, Email & Slack

### 1. Workflow Overview

This workflow automates the performance review scheduling and reminder process within an organization using Google Sheets, Google Calendar, email, and Slack. It is designed to run daily, check for upcoming performance reviews scheduled within the next three days, send reminder emails to both employees and reviewers, update calendar events, notify HR via Slack, and update the review status in the source spreadsheet.

The workflow is logically divided into the following blocks:

- **1.1 Daily Trigger:** Initiates the workflow every day at 8 AM.
- **1.2 Data Retrieval:** Fetches the scheduled reviews from a Google Sheets document.
- **1.3 Review Filtering:** Filters reviews to only those upcoming within three days and splits today’s reviews from future reminders.
- **1.4 Validation:** Checks if there are any upcoming reviews to process.
- **1.5 Processing Each Review:** Splits the list of reviews into individual items and prepares relevant review data fields.
- **1.6 Notification & Update:** Sends reminder emails, updates calendar events, notifies HR on Slack, and updates the review status in Google Sheets.

---

### 2. Block-by-Block Analysis

#### 2.1 Daily Trigger

- **Overview:**  
  This block triggers the entire workflow once daily at 8 AM to ensure timely processing of scheduled reviews.

- **Nodes Involved:**  
  - Daily Check at 8 AM  
  - Sticky Note (description)

- **Node Details:**  

  - **Daily Check at 8 AM**  
    - Type: Schedule Trigger  
    - Configuration: Runs once every day at 8 AM (local time assumed)  
    - Expressions: None  
    - Inputs: None (trigger node)  
    - Outputs: Triggers "Get Review Schedule" node  
    - Potential Failures: Schedule misconfiguration, timezone issues  
    - Version: 1.1  

  - **Sticky Note**  
    - Provides description: "Daily morning check runs at 8 AM every day."  
    - No technical function, purely informational.

#### 2.2 Data Retrieval

- **Overview:**  
  Retrieves all performance review schedule entries from a specific Google Sheets document and sheet.

- **Nodes Involved:**  
  - Get Review Schedule  
  - Sticky Note1 (description)

- **Node Details:**  

  - **Get Review Schedule**  
    - Type: Google Sheets (Read Operation)  
    - Configuration:  
      - Reads the sheet named "ReviewSchedule"  
      - Uses a Google Service Account for authentication  
      - Document ID set to a placeholder ("YOUR_REVIEW_SPREADSHEET_ID")—must be replaced with actual ID  
      - No filters applied; retrieves all rows  
    - Inputs: Trigger from "Daily Check at 8 AM"  
    - Outputs: Outputs all rows as items containing review data  
    - Potential Failures: Authentication errors, invalid document ID, API rate limits, empty or malformed sheet data  
    - Version: 4.2  

  - **Sticky Note1**  
    - Describes that this node fetches all planned reviews from the spreadsheet.

#### 2.3 Review Filtering

- **Overview:**  
  Filters the retrieved review entries to those scheduled in the next three days and segregates reviews scheduled for today versus upcoming days.

- **Nodes Involved:**  
  - Filter Upcoming Reviews  
  - Sticky Note2 (description)

- **Node Details:**  

  - **Filter Upcoming Reviews**  
    - Type: Code (JavaScript)  
    - Configuration:  
      - Filters all input items by comparing their "ReviewDate" field to today’s date and the next three days  
      - Excludes reviews marked as "Completed"  
      - Creates three output arrays:  
        - `upcomingReviews`: all reviews between today and three days from now, excluding completed  
        - `todayReviews`: subset of `upcomingReviews` scheduled for today  
        - `reminderReviews`: subset scheduled after today but within the interval  
    - Inputs: Items from "Get Review Schedule"  
    - Outputs: An object containing three arrays (upcomingReviews, todayReviews, reminderReviews)  
    - Expressions & Variables: Uses `$now.toDate()` for current date, parses "ReviewDate" from input JSON  
    - Potential Failures: Date parsing errors if "ReviewDate" is malformed, timezone inconsistencies, empty inputs  
    - Version: 2  

  - **Sticky Note2**  
    - Explains that this node filters upcoming reviews checking the next 3 days.

#### 2.4 Validation

- **Overview:**  
  Validates whether there are any upcoming performance reviews to process, preventing unnecessary execution if none exist.

- **Nodes Involved:**  
  - Reviews Scheduled?  
  - Sticky Note3 (description)

- **Node Details:**  

  - **Reviews Scheduled?**  
    - Type: If Node  
    - Configuration:  
      - Checks if the length of the `upcomingReviews` array is greater than 0  
      - Routes the workflow accordingly: continue if reviews exist, stop otherwise  
    - Inputs: From "Filter Upcoming Reviews" node output  
    - Outputs:  
      - True: proceeds to "Split Into Items"  
      - False: stops workflow  
    - Potential Failures: Expression evaluation errors if `upcomingReviews` is undefined  
    - Version: 1  

  - **Sticky Note3**  
    - Notes that this node ensures reviews exist before continuing.

#### 2.5 Processing Each Review

- **Overview:**  
  Splits the list of upcoming reviews into individual items and prepares each review’s data by mapping necessary fields for downstream processing.

- **Nodes Involved:**  
  - Split Into Items  
  - Prepare Review Data  
  - Sticky Note4 (description)

- **Node Details:**  

  - **Split Into Items**  
    - Type: Split Out  
    - Configuration:  
      - Splits the `upcomingReviews` array into individual items for processing one by one  
      - Field to split: `upcomingReviews`  
    - Inputs: From "Reviews Scheduled?" True output  
    - Outputs: One item per review  
    - Potential Failures: If `upcomingReviews` is empty or malformed, node outputs nothing  
    - Version: 1  

  - **Prepare Review Data**  
    - Type: Set  
    - Configuration:  
      - Maps and renames fields from the incoming item for consistency:  
        - calendarEventId ← CalendarEventId  
        - employeeName ← EmployeeName  
        - reviewerName ← ReviewerName  
        - reviewDate ← ReviewDate  
        - reviewType ← ReviewType  
        - employeeEmail ← EmployeeEmail  
        - reviewerEmail ← ReviewerEmail  
    - Inputs: From "Split Into Items"  
    - Outputs: Single item with standardized fields for notifications and updates  
    - Potential Failures: Missing fields in input data may cause undefined values  
    - Version: 3.3  

  - **Sticky Note4**  
    - Describes that this block splits and prepares individual review data for processing.

#### 2.6 Notification & Update

- **Overview:**  
  For each review, this block sends reminder emails to employee and reviewer, updates the corresponding Google Calendar event, sends a notification to HR on Slack, and updates the review status in Google Sheets.

- **Nodes Involved:**  
  - Send Email Reminder  
  - Update Calendar Event  
  - Notify HR on Slack  
  - Update Review Status  
  - Sticky Note5 (description)

- **Node Details:**  

  - **Send Email Reminder**  
    - Type: Email Send  
    - Configuration:  
      - Subject line: "🎯 Performance Review Reminder - {employeeName}"  
      - To: employeeEmail and reviewerEmail (both)  
      - From: hr@yourcompany.com  
      - Credentials: SMTP server configured for sending emails  
    - Inputs: From "Prepare Review Data"  
    - Outputs: Proceeds to "Notify HR on Slack"  
    - Potential Failures: SMTP authentication errors, invalid email addresses, rate limiting  
    - Version: 2.1  

  - **Update Calendar Event**  
    - Type: Google Calendar (Update event)  
    - Configuration:  
      - Updates calendar event using "calendarEventId" (assumed to be implicitly linked)  
      - Uses primary calendar  
      - Start and end times are statically set in this version (likely placeholders) — requires dynamic configuration for real use  
      - Credentials: Google OAuth2 for calendar access  
    - Inputs: Also from "Prepare Review Data", runs in parallel with "Send Email Reminder"  
    - Outputs: Proceeds to "Notify HR on Slack"  
    - Potential Failures: Authentication errors, invalid or missing calendar event IDs, API rate limits  
    - Version: 1.2  

  - **Notify HR on Slack**  
    - Type: Slack node  
    - Configuration:  
      - Sends a formatted message including employee name, reviewer name, review type, scheduled date, and summary of actions taken  
      - User selection is blank (message sent via webhook or default channel)  
      - Credentials: Slack API token with chat permissions  
    - Inputs: From both "Send Email Reminder" and "Update Calendar Event" (merged)  
    - Outputs: Proceeds to "Update Review Status"  
    - Potential Failures: Slack authentication errors, invalid webhook or token, message formatting errors  
    - Version: 2.1  

  - **Update Review Status**  
    - Type: Google Sheets (Update operation)  
    - Configuration:  
      - Updates the "ReviewSchedule" sheet in the same spreadsheet  
      - Automatically maps input data to sheet columns (autoMapInputData)  
      - Intended to update review status (presumably marking reminders sent or status updated)  
      - Uses Service Account credentials same as "Get Review Schedule"  
    - Inputs: From "Notify HR on Slack"  
    - Outputs: None (end of flow)  
    - Potential Failures: Authentication errors, mismatched columns, write conflicts, API limits  
    - Version: 4.2  

  - **Sticky Note5**  
    - Describes multi-channel notifications and tracking: emails, calendar, Slack, and status update.

---

### 3. Summary Table

| Node Name             | Node Type                | Functional Role                          | Input Node(s)              | Output Node(s)                    | Sticky Note                                                                                      |
|-----------------------|--------------------------|----------------------------------------|----------------------------|----------------------------------|------------------------------------------------------------------------------------------------|
| Daily Check at 8 AM    | Schedule Trigger         | Triggers workflow daily at 8 AM        | None                       | Get Review Schedule              | Daily morning check runs at 8 AM every day                                                     |
| Get Review Schedule    | Google Sheets (Read)     | Retrieves all scheduled reviews        | Daily Check at 8 AM        | Filter Upcoming Reviews           | Fetches review schedule - retrieves all planned reviews                                        |
| Filter Upcoming Reviews| Code (JavaScript)        | Filters reviews within next 3 days     | Get Review Schedule        | Reviews Scheduled?                | Filters upcoming reviews - checks next 3 days                                                 |
| Reviews Scheduled?     | If                       | Checks if any upcoming reviews exist   | Filter Upcoming Reviews    | Split Into Items                  | Validates schedule - ensures reviews exist                                                    |
| Split Into Items       | Split Out                | Splits reviews into single items       | Reviews Scheduled?         | Prepare Review Data               | Processes each review - splits and prepares data                                              |
| Prepare Review Data    | Set                      | Maps and standardizes review fields    | Split Into Items           | Send Email Reminder, Update Calendar Event | Processes each review - splits and prepares data                                              |
| Send Email Reminder    | Email Send               | Sends email reminders to employee & reviewer | Prepare Review Data         | Notify HR on Slack                | Multi-channel notifications & tracking - sends reminders via email, updates calendar, notifies HR, updates status |
| Update Calendar Event  | Google Calendar (Update) | Updates the corresponding calendar event | Prepare Review Data         | Notify HR on Slack                | Multi-channel notifications & tracking - sends reminders via email, updates calendar, notifies HR, updates status |
| Notify HR on Slack     | Slack                    | Sends notification message to HR       | Send Email Reminder, Update Calendar Event | Update Review Status             | Multi-channel notifications & tracking - sends reminders via email, updates calendar, notifies HR, updates status |
| Update Review Status   | Google Sheets (Update)   | Updates review status in spreadsheet   | Notify HR on Slack         | None                            | Multi-channel notifications & tracking - sends reminders via email, updates calendar, notifies HR, updates status |
| Sticky Note            | Sticky Note              | Describes Daily Trigger block           | None                       | None                            | Daily morning check runs at 8 AM every day                                                     |
| Sticky Note1           | Sticky Note              | Describes Data Retrieval block          | None                       | None                            | Fetches review schedule - retrieves all planned reviews                                        |
| Sticky Note2           | Sticky Note              | Describes Review Filtering block        | None                       | None                            | Filters upcoming reviews - checks next 3 days                                                 |
| Sticky Note3           | Sticky Note              | Describes Validation block               | None                       | None                            | Validates schedule - ensures reviews exist                                                    |
| Sticky Note4           | Sticky Note              | Describes Processing Each Review block  | None                       | None                            | Processes each review - splits and prepares data                                              |
| Sticky Note5           | Sticky Note              | Describes Notification & Update block   | None                       | None                            | Multi-channel notifications & tracking - sends reminders via email, updates calendar, notifies HR, updates status |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**  
   - Name: "Daily Check at 8 AM"  
   - Type: Schedule Trigger  
   - Configuration: Set to run once daily at 8 AM local time.

2. **Create Google Sheets Node to Fetch Schedule**  
   - Name: "Get Review Schedule"  
   - Type: Google Sheets (Read)  
   - Credentials: Connect Google Service Account with permission to read the spreadsheet.  
   - Parameters:  
     - Document ID: Set to your performance review spreadsheet ID.  
     - Sheet name: "ReviewSchedule"  
     - Operation: Read all rows.

3. **Create Code Node to Filter Upcoming Reviews**  
   - Name: "Filter Upcoming Reviews"  
   - Type: Code (JavaScript)  
   - Input: All items from previous node  
   - Script: Implement filtering logic to select reviews scheduled from today to three days ahead, exclude completed reviews, and separate today's reviews from reminders (see logic in block 2.3).  
   - Output: Object with arrays `upcomingReviews`, `todayReviews`, `reminderReviews`.

4. **Create If Node to Validate Existence of Reviews**  
   - Name: "Reviews Scheduled?"  
   - Type: If  
   - Condition: Check if `upcomingReviews.length > 0` (expression: `{{$json.upcomingReviews.length}} > 0`)  
   - True branch: Continue workflow  
   - False branch: End workflow.

5. **Create Split Out Node**  
   - Name: "Split Into Items"  
   - Type: Split Out  
   - Configuration: Split field `upcomingReviews` into individual items.

6. **Create Set Node to Prepare Review Data**  
   - Name: "Prepare Review Data"  
   - Type: Set  
   - Configuration: Map fields from input JSON to standardized fields required by downstream nodes:  
     - calendarEventId = CalendarEventId  
     - employeeName = EmployeeName  
     - reviewerName = ReviewerName  
     - reviewDate = ReviewDate  
     - reviewType = ReviewType  
     - employeeEmail = EmployeeEmail  
     - reviewerEmail = ReviewerEmail

7. **Create Email Send Node**  
   - Name: "Send Email Reminder"  
   - Type: Email Send  
   - Credentials: Configure SMTP credentials with a valid email account.  
   - Parameters:  
     - Subject: "🎯 Performance Review Reminder - {{$json.employeeName}}"  
     - To: "{{$json.employeeEmail}}, {{$json.reviewerEmail}}"  
     - From: "hr@yourcompany.com"  
     - Body: Configure as needed (not included in original workflow).

8. **Create Google Calendar Node to Update Event**  
   - Name: "Update Calendar Event"  
   - Type: Google Calendar (Update)  
   - Credentials: Connect OAuth2 Google Calendar credentials.  
   - Parameters:  
     - Calendar: Primary calendar  
     - Event ID: Use `calendarEventId` from input (this needs dynamic assignment in node settings)  
     - Start and End: Configure dynamically based on the review date (in original workflow these are static placeholders; adjust accordingly).

9. **Create Slack Node to Notify HR**  
   - Name: "Notify HR on Slack"  
   - Type: Slack  
   - Credentials: Connect Slack API with chat permissions.  
   - Parameters:  
     - Message text includes performance review details (employee name, reviewer, type, scheduled date) and confirms email and calendar updates.  
     - User: Leave blank or specify the HR user/channel as needed.

10. **Create Google Sheets Node to Update Review Status**  
    - Name: "Update Review Status"  
    - Type: Google Sheets (Update)  
    - Credentials: Use the same Google Service Account as the "Get Review Schedule" node.  
    - Parameters:  
      - Document ID: Same spreadsheet  
      - Sheet name: "ReviewSchedule"  
      - Operation: Update  
      - Mapping Mode: Auto-map input data to sheet columns to update status (e.g., mark reminder sent).

11. **Connect Nodes in Sequence:**  
    - "Daily Check at 8 AM" → "Get Review Schedule" → "Filter Upcoming Reviews" → "Reviews Scheduled?" (True) → "Split Into Items" → "Prepare Review Data" → ["Send Email Reminder" and "Update Calendar Event" in parallel] → "Notify HR on Slack" → "Update Review Status"

12. **Add Sticky Notes:**  
    - Add descriptive notes alongside each logical block to improve maintainability.

---

### 5. General Notes & Resources

| Note Content                                                                                       | Context or Link                                              |
|--------------------------------------------------------------------------------------------------|--------------------------------------------------------------|
| The Google Sheets document ID must be replaced with your actual document ID for the workflow.     | Configuration requirement for Google Sheets nodes             |
| Google Calendar node uses static start/end times in the current version; dynamic date mapping is recommended. | To correctly reflect review dates in calendar events          |
| SMTP credentials must be valid and authorized to send emails from the configured "From" address.  | Email sending setup                                           |
| Slack API token requires permissions to post messages to the appropriate HR channel or user.      | Slack integration setup                                       |
| The workflow assumes date strings in "ReviewDate" are ISO 8601 compatible for correct parsing.    | Data formatting requirement                                   |
| The workflow runs once daily at 8 AM, suitable for organizations needing daily reminders.          | Scheduling design choice                                      |

---

**Disclaimer:**  
The text provided is extracted exclusively from an automated workflow created with n8n, an integration and automation platform. This processing strictly complies with current content policies and contains no illegal, offensive, or protected material. All data handled is legal and publicly available.