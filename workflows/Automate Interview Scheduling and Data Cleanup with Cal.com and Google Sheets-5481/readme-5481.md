Automate Interview Scheduling and Data Cleanup with Cal.com and Google Sheets

https://n8nworkflows.xyz/workflows/automate-interview-scheduling-and-data-cleanup-with-cal-com-and-google-sheets-5481


# Automate Interview Scheduling and Data Cleanup with Cal.com and Google Sheets

---

### 1. Workflow Overview

This workflow automates interview scheduling and data cleanup by integrating Cal.com booking data with Google Sheets applicant records. It is designed for recruitment teams who want to synchronize interview appointments booked via Cal.com with their candidate tracking spreadsheet, ensuring data consistency and removing invalid entries.

The workflow is logically divided into the following blocks:

- **1.1 Manual Trigger & Data Retrieval from Cal.com:** Initiates the workflow manually and fetches booking and attendee data from Cal.com’s API.
- **1.2 Data Formatting and Enrichment:** Processes raw booking data to extract and format candidate details, converting timestamps to readable interview schedules.
- **1.3 Google Sheets Synchronization:** Appends or updates candidate interview schedules in the Google Sheets document, matching by email.
- **1.4 Data Cleanup:** Iterates through the Google Sheets rows to identify and delete records with unmatched or missing data (e.g., empty summary fields), maintaining a clean applicant list.

---

### 2. Block-by-Block Analysis

---

#### 2.1 Manual Trigger & Data Retrieval from Cal.com

**Overview:**  
This block begins the workflow upon manual execution and pulls the latest attendee and booking data from Cal.com’s API, using the provided API key.

**Nodes Involved:**  
- When clicking ‘Execute workflow’  
- Fetching Booking Information  
- HTTP Request1

**Node Details:**

- **When clicking ‘Execute workflow’**  
  - Type: Manual Trigger  
  - Role: Starts the workflow on user command.  
  - Configuration: No parameters; manual execution only.  
  - Inputs: None  
  - Outputs: Triggers next node  
  - Failure Modes: None (manual)  

- **Fetching Booking Information**  
  - Type: HTTP Request  
  - Role: Fetches attendee information from Cal.com API endpoint `/v1/attendees`.  
  - Configuration:  
    - URL: `https://api.cal.com/v1/attendees`  
    - Query Parameter: `apiKey` (user must insert their Cal.com API Key)  
    - HTTP method: GET (default)  
  - Expressions: Static query parameters with required API key.  
  - Inputs: Trigger from manual node  
  - Outputs: JSON array of attendees  
  - Failure Modes: Authentication failure if API key invalid, network issues, or API downtime.  
  - Notes: Requires secure storage of API key.  

- **HTTP Request1**  
  - Type: HTTP Request  
  - Role: For each booking, fetch detailed booking data from `/v1/bookings` endpoint using bookingId from attendees data.  
  - Configuration:  
    - URL: `https://api.cal.com/v1/bookings`  
    - Query Parameters: `apiKey` and `id` (bookingId from previous node output)  
  - Expressions: Dynamic extraction of bookingId from JSON path `$json.attendees[0].bookingId`.  
  - Inputs: Output from Fetching Booking Information  
  - Outputs: Booking details JSON  
  - Failure Modes: Invalid or missing bookingId, API rate limits, invalid API key.

---

#### 2.2 Data Formatting and Enrichment

**Overview:**  
Transforms the raw booking data into structured candidate interview details: attendee name, email (lowercase), and formatted interview schedule with timezone adjustment.

**Nodes Involved:**  
- Converting to time  
- Edit Fields1  
- Adding Time & Date for interview

**Node Details:**

- **Converting to time**  
  - Type: Code (JavaScript)  
  - Role: Converts booking start times to human-readable strings in "en-GB" locale and Asia/Riyadh timezone.  
  - Configuration:  
    - Custom JS code that maps `$json.bookings` array to extract attendee name, email, and formats startTime.  
  - Inputs: Output from HTTP Request1 (booking details)  
  - Outputs: Array of JSON objects with keys: `name`, `email`, `startFormatted`  
  - Failure Modes: Errors if bookings array missing or malformed date strings.  
  - Notes: Timezone is hardcoded to Asia/Riyadh, which must match user requirements.

- **Edit Fields1**  
  - Type: Set Node  
  - Role: Standardizes email to lowercase, assigns `Email` and `Interview Schedule` fields for further processing.  
  - Configuration:  
    - Sets `Email` = lowercase of `$json.email`  
    - Sets `Interview Schedule` = `$json.startFormatted`  
    - Keeps other fields unchanged  
  - Inputs: Output from Converting to time  
  - Outputs: Enhanced JSON with normalized email and interview schedule  
  - Failure Modes: Expression errors if input fields missing.

- **Adding Time & Date for interview**  
  - Type: Google Sheets (appendOrUpdate)  
  - Role: Updates Google Sheets “Accepted” sheet by adding or updating rows matching candidate email with interview time.  
  - Configuration:  
    - Operation: appendOrUpdate  
    - Match column: Email  
    - Columns included: NAME, Email, Phone Number, JUSTIFICATION, SUMMARY, Q1-Q5, plus new interview schedule data  
    - Document ID and Sheet GID specified for target spreadsheet  
  - Inputs: Output from Edit Fields1  
  - Outputs: Confirmation of sheet update  
  - Failure Modes: Google Sheets API authentication errors, quota limits, schema mismatches.  
  - Notes: Requires Google Sheets credentials with appropriate access.

---

#### 2.3 Google Sheets Synchronization

**Overview:**  
Reads existing candidate data from Google Sheets, extracts email addresses to compare against booking data for cleanup.

**Nodes Involved:**  
- Google Sheets1  
- Split Out  
- Iterate over emails

**Node Details:**

- **Google Sheets1**  
  - Type: Google Sheets (Read)  
  - Role: Retrieves rows from the “Accepted” sheet to obtain current candidate records.  
  - Configuration:  
    - Document ID and sheet GID target the “Accepted” sheet  
    - Filters applied on “SUMMARY ” column (note trailing space)  
  - Inputs: Output from Adding Time & Date for interview  
  - Outputs: Rows of candidate data  
  - Failure Modes: Authentication, API limits, or empty sheets.  

- **Split Out**  
  - Type: Split Out  
  - Role: Isolates the “Email” field from the Google Sheets data for individual processing.  
  - Configuration:  
    - Field to split out: Email  
  - Inputs: Output from Google Sheets1  
  - Outputs: JSON items each containing one email record  
  - Failure Modes: Missing or malformed email fields.

- **Iterate over emails**  
  - Type: Split In Batches  
  - Role: Processes emails one by one or in small batches to enable conditional checking and deletion.  
  - Configuration: Default batch size or none specified  
  - Inputs: Output from Split Out and from deletion loop (feedback)  
  - Outputs: Individual email items for evaluation  
  - Failure Modes: Large datasets could cause rate limiting or slow processing.

---

#### 2.4 Data Cleanup

**Overview:**  
Checks each candidate record for unmatched or missing summary fields and deletes such rows from Google Sheets to maintain data integrity.

**Nodes Involved:**  
- Check for unmatched Emails  
- Deleting

**Node Details:**

- **Check for unmatched Emails**  
  - Type: If (Conditional)  
  - Role: Determines if the “SUMMARY ” field is empty (indicating invalid or incomplete records).  
  - Configuration:  
    - Condition: `$json['SUMMARY ']` equals an empty string  
    - Case-sensitive and strict type validation enabled  
  - Inputs: Output from Iterate over emails  
  - Outputs:  
    - True branch: Records with empty summary  
    - False branch: Records with valid summary (loops back to iterate)  
  - Failure Modes: Expression evaluation errors if field missing or named differently.

- **Deleting**  
  - Type: Google Sheets (Delete Row)  
  - Role: Deletes rows in Google Sheets where records have empty or unmatched summaries.  
  - Configuration:  
    - Document ID and sheet GID targeting “Accepted” sheet  
    - Deletes row at index `$json.row_number` (dynamic)  
  - Inputs: True output from Check for unmatched Emails  
  - Outputs: Confirmation of deletion  
  - Failure Modes: Google Sheets API errors, invalid row indices, concurrent modification conflicts.

---

### 3. Summary Table

| Node Name                  | Node Type             | Functional Role                                                        | Input Node(s)                      | Output Node(s)                  | Sticky Note                                                                                                                                    |
|----------------------------|-----------------------|------------------------------------------------------------------------|----------------------------------|-------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger        | Initiate the workflow manually                                         | None                             | Fetching Booking Information   |                                                                                                                                               |
| Fetching Booking Information | HTTP Request          | Fetch attendee data from Cal.com API                                   | When clicking ‘Execute workflow’ | HTTP Request1                  | ## 📅 Cal.com Calendar Setup This section fetches all bookings from your Cal.com event. - Pulls booking data via Cal.com API - Extracts attendee name, email, and interview time 🔐 Be sure to insert your Cal.com API Key. |
| HTTP Request1              | HTTP Request          | Retrieve detailed booking info using bookingId                         | Fetching Booking Information     | Converting to time             | ## 📅 Cal.com Calendar Setup This section fetches all bookings from your Cal.com event. - Pulls booking data via Cal.com API - Extracts attendee name, email, and interview time 🔐 Be sure to insert your Cal.com API Key. |
| Converting to time         | Code                  | Format booking times and extract email/name                            | HTTP Request1                   | Edit Fields1                  | ## 📅 Cal.com Calendar Setup This section fetches all bookings from your Cal.com event. - Pulls booking data via Cal.com API - Extracts attendee name, email, and interview time 🔐 Be sure to insert your Cal.com API Key. |
| Edit Fields1               | Set                   | Normalize email and assign interview schedule                         | Converting to time              | Adding Time & Date for interview | ## 🔁 Link to Resume Screening Template This workflow can be connected to the resume evaluation system. - Automatically assigns interview schedules - Matches bookings to existing applicants in your sheet 📌 Useful for aligning candidate records with scheduled interviews. |
| Adding Time & Date for interview | Google Sheets        | Append or update candidate interview schedule in Google Sheets       | Edit Fields1                   | Google Sheets1                | ## 🔁 Link to Resume Screening Template This workflow can be connected to the resume evaluation system. - Automatically assigns interview schedules - Matches bookings to existing applicants in your sheet 📌 Useful for aligning candidate records with scheduled interviews. |
| Google Sheets1             | Google Sheets         | Read current candidate data from Google Sheets                        | Adding Time & Date for interview | Split Out                    | ## 🧹 Data Cleanup Logic This section ensures only valid candidates remain in the sheet. - Compares booking emails with accepted applicants - Deletes rows with missing or unmatched data (e.g. no summary) ✅ Keeps your applicant tracking clean and relevant. |
| Split Out                  | Split Out             | Extract email addresses from candidate records                        | Google Sheets1                 | Iterate over emails           | ## 🧹 Data Cleanup Logic This section ensures only valid candidates remain in the sheet. - Compares booking emails with accepted applicants - Deletes rows with missing or unmatched data (e.g. no summary) ✅ Keeps your applicant tracking clean and relevant. |
| Iterate over emails        | Split In Batches      | Process candidate emails individually for validation                  | Split Out, Deleting            | Check for unmatched Emails, Iterate over emails | ## 🧹 Data Cleanup Logic This section ensures only valid candidates remain in the sheet. - Compares booking emails with accepted applicants - Deletes rows with missing or unmatched data (e.g. no summary) ✅ Keeps your applicant tracking clean and relevant. |
| Check for unmatched Emails | If                    | Check if candidate summary is missing or empty                        | Iterate over emails             | Deleting (true), Iterate over emails (false) | ## 🧹 Data Cleanup Logic This section ensures only valid candidates remain in the sheet. - Compares booking emails with accepted applicants - Deletes rows with missing or unmatched data (e.g. no summary) ✅ Keeps your applicant tracking clean and relevant. |
| Deleting                   | Google Sheets         | Delete rows with unmatched or empty candidate summaries              | Check for unmatched Emails      | Iterate over emails           | ## 🧹 Data Cleanup Logic This section ensures only valid candidates remain in the sheet. - Compares booking emails with accepted applicants - Deletes rows with missing or unmatched data (e.g. no summary) ✅ Keeps your applicant tracking clean and relevant. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Manual Trigger node:**  
   - Name: `When clicking ‘Execute workflow’`  
   - Purpose: Start workflow manually.  
   - No special parameters needed.

2. **Add HTTP Request node to fetch attendees:**  
   - Name: `Fetching Booking Information`  
   - URL: `https://api.cal.com/v1/attendees`  
   - Method: GET  
   - Add query parameter `apiKey` with your Cal.com API Key (stored securely in credentials).  
   - Connect output of Manual Trigger to this node.

3. **Add HTTP Request node to fetch booking details:**  
   - Name: `HTTP Request1`  
   - URL: `https://api.cal.com/v1/bookings`  
   - Method: GET  
   - Query parameters:  
     - `apiKey`: same Cal.com API Key  
     - `id`: Expression: `{{$json.attendees[0].bookingId}}` to use bookingId from attendee data.  
   - Connect output of `Fetching Booking Information` here.

4. **Add Code node to convert booking times:**  
   - Name: `Converting to time`  
   - Language: JavaScript  
   - Paste code that maps `$json.bookings` to extract attendee name, lowercase email, and format start time in Asia/Riyadh timezone, locale `en-GB`.  
   - Connect output of `HTTP Request1` here.

5. **Add Set node to normalize fields:**  
   - Name: `Edit Fields1`  
   - Set fields:  
     - `Email`: `{{$json.email.toLowerCase()}}`  
     - `Interview Schedule`: `{{$json.startFormatted}}`  
   - Include other fields unchanged.  
   - Connect from `Converting to time`.

6. **Add Google Sheets node to append or update interview schedule:**  
   - Name: `Adding Time & Date for interview`  
   - Operation: `appendOrUpdate`  
   - Document ID: your Google Sheet ID  
   - Sheet Name: target sheet GID (e.g., `gid=0`)  
   - Match column: `Email`  
   - Columns: map all relevant columns including NAME, Email, Phone Number, JUSTIFICATION, SUMMARY, Q1-Q5, plus new interview schedule fields.  
   - Connect from `Edit Fields1`.  
   - Set up Google Sheets credentials with write access.

7. **Add Google Sheets node to read candidate data:**  
   - Name: `Google Sheets1`  
   - Operation: Read rows  
   - Document ID and Sheet GID same as above.  
   - Optionally filter on `SUMMARY ` column.  
   - Connect from `Adding Time & Date for interview`.

8. **Add Split Out node to extract Email field:**  
   - Name: `Split Out`  
   - Field to split out: `Email`  
   - Connect from `Google Sheets1`.

9. **Add Split In Batches node for iterative processing:**  
   - Name: `Iterate over emails`  
   - Default batch size or as needed.  
   - Connect from `Split Out`.  
   - Also configure loop-back connection from `Deleting` node (step 11) for iterative cleanup.

10. **Add If node to check for empty summary:**  
    - Name: `Check for unmatched Emails`  
    - Condition: `$json['SUMMARY ']` equals empty string `""` (case-sensitive, strict)  
    - Connect from `Iterate over emails`.

11. **Add Google Sheets node to delete rows:**  
    - Name: `Deleting`  
    - Operation: Delete row  
    - Document ID and Sheet GID same as above.  
    - Row index: `{{$json.row_number}}` (dynamic from current item)  
    - Connect from true condition of `Check for unmatched Emails`.  
    - Connect output back to `Iterate over emails` for processing next batch.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                         | Context or Link                                                                                   |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| This workflow requires a valid Cal.com API key with permissions to read bookings and attendees. Keep the key secure and do not expose publicly.                                                                                                     | Cal.com API Documentation: https://docs.cal.com/reference                                         |
| Google Sheets credentials must allow read/write access to the target spreadsheet. Ensure OAuth2 credentials are properly configured in n8n.                                                                                                        | Google Sheets API: https://developers.google.com/sheets/api                                      |
| Timezone for interview scheduling is set to Asia/Riyadh in the code node. Adjust this to your local timezone as needed in the JavaScript code.                                                                                                     | Timezone config in `Converting to time` node                                                     |
| Workflow includes sticky notes within n8n UI to guide users on setup and purpose of different blocks (Cal.com API integration, resume screening linkage, and data cleanup).                                                                          | Sticky notes visible in the workflow editor                                                     |
| Candidate email normalization to lowercase helps avoid mismatches due to casing differences in Google Sheets matching and Cal.com data.                                                                                                            | See `Edit Fields1` node                                                                          |
| Deletion of rows with empty 'SUMMARY ' fields ensures that only candidates with valid data remain in the tracking sheet, improving data quality and workflow reliability.                                                                           | See data cleanup block                                                                          |
| When reproducing the workflow, ensure all nodes are connected exactly as per the described sequence and that credentials are properly assigned to HTTP Request and Google Sheets nodes to prevent runtime errors.                                    |                                                                                                 |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created with n8n, an integration and automation tool. This process strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All handled data is legal and public.

---