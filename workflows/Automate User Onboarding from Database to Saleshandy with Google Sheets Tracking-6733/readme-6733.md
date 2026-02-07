Automate User Onboarding from Database to Saleshandy with Google Sheets Tracking

https://n8nworkflows.xyz/workflows/automate-user-onboarding-from-database-to-saleshandy-with-google-sheets-tracking-6733


# Automate User Onboarding from Database to Saleshandy with Google Sheets Tracking

---
### 1. Workflow Overview

This workflow automates the onboarding of new users by extracting signup data from a database, filtering those who signed up "yesterday," adding them to a Saleshandy email sequence for outreach, and tracking the processed users in a Google Sheet. It is designed for daily execution to ensure timely engagement of new users through personalized email sequences while maintaining a record for analysis or backup.

The workflow is logically divided into these blocks:

- **1.1 Date Generation:** Calculate the date range for "yesterday" to filter recent signups.
- **1.2 Fetch Users from Database:** Retrieve all user records from the database with secure authentication.
- **1.3 Filter Users by Date:** Select only users created within the "yesterday" date range and parse their names.
- **1.4 Saleshandy Sequence Integration:** Add the filtered users to a Saleshandy email sequence for onboarding outreach.
- **1.5 Google Sheets Tracking:** Append the onboarded users' data to a Google Sheet for tracking purposes.

---

### 2. Block-by-Block Analysis

#### 1.1 Date Generation

- **Overview:**  
Generates the start and end timestamps representing the whole day of "yesterday" in a format compatible with Supabase timestamps. This range will be used to filter users who signed up during that day.

- **Nodes Involved:**  
  - Get yesterday dates (Code node)  
  - Sticky Note3 (Informational)

- **Node Details:**  

  - **Get yesterday dates**  
    - Type: Code (JavaScript)  
    - Configuration:  
      - Defines a helper function `formatToSupabaseTimestamp` to convert JS Date objects to Supabase-compatible ISO timestamps with microsecond precision and timezone info.  
      - Calculates yesterday's date at 00:00:00 and 23:59:59.999 times to form start and end boundaries.  
      - Outputs JSON with `isoStart` and `isoEnd`.  
    - Inputs: Manual Trigger (indirect via connection chain)  
    - Outputs: JSON object with formatted date range  
    - Potential Failures: Date calculation or formatting errors (unlikely unless system clock is misconfigured)  
    - Version-specific: Uses n8n typeVersion 2 for Code node  
    - Sticky Note3 describes the purpose and adjustability of this date range.

---

#### 1.2 Fetch Users from Database

- **Overview:**  
Connects to a user database via HTTP request, authenticates using API keys, and retrieves all user records to be filtered later.

- **Nodes Involved:**  
  - Fetch all users from database (HTTP Request)  
  - Sticky Note1 (General context about fetching users)  
  - Sticky Note4 (Required credential updates)

- **Node Details:**  

  - **Fetch all users from database**  
    - Type: HTTP Request  
    - Configuration:  
      - URL: Placeholder for the actual database API endpoint (e.g., Supabase REST endpoint).  
      - Headers: Requires `apikey` (public anon key) and `Authorization` (service role key with `Bearer` prefix) for authentication.  
      - Sends no body, uses GET by default.  
    - Inputs: Output from "Get yesterday dates" node (triggered sequentially)  
    - Outputs: JSON array of users with fields including `id`, `full_name`, `email`, and `created_at`.  
    - Failure Modes:  
      - Authentication errors (invalid or missing keys)  
      - Network timeouts or unreachable URL  
      - Malformed JSON responses  
    - Sticky Note4 stresses updating URL and API keys correctly.

---

#### 1.3 Filter Users by Date

- **Overview:**  
Filters the fetched users to include only those whose `created_at` timestamp falls within yesterday’s date range; also splits `full_name` into `first_name` and `last_name` for use in email personalization.

- **Nodes Involved:**  
  - Date Filtered Users (Code node)  
  - Sticky Note1 (context on filtering)  
  - Sticky Note6 (default date setting reminder)

- **Node Details:**  

  - **Date Filtered Users**  
    - Type: Code (JavaScript)  
    - Configuration:  
      - Retrieves the `isoStart` and `isoEnd` from "Get yesterday dates" node output.  
      - Filters incoming user items by checking if `created_at` date is between `isoStart` and `isoEnd`.  
      - Splits `full_name` into `first_name` (first word) and `last_name` (remaining words).  
      - Outputs filtered and transformed user objects with keys: `id`, `first_name`, `last_name`, `email`, `created_at`.  
    - Input: JSON array of all users from the HTTP Request node  
    - Output: Filtered user JSON items to be sent to Saleshandy and Google Sheets  
    - Failure Modes:  
      - Parsing errors if `created_at` is missing or malformed  
      - Name splitting issues if `full_name` is empty or not a string  
    - Version: Code node v2  
    - Sticky Note6 reminds the default date range is yesterday.

---

#### 1.4 Saleshandy Sequence Integration

- **Overview:**  
Adds each filtered user to a specified Saleshandy email sequence to automate outreach for onboarding or promotion purposes.

- **Nodes Involved:**  
  - Add new signup to Saleshandy's Sequence (HTTP Request)  
  - Sticky Note5 (context on Saleshandy integration)  
  - Sticky Note7 (required API key and sequence ID info)

- **Node Details:**  

  - **Add new signup to Saleshandy's Sequence**  
    - Type: HTTP Request  
    - Configuration:  
      - URL: Saleshandy API endpoint for importing prospects with field names.  
      - Method: POST  
      - Headers: Requires `x-api-key` (Saleshandy API key)  
      - Body (JSON):  
        - `prospectList`: Array with user object containing `First Name` and `Email` fields mapped from node input JSON.  
        - `stepId`: Saleshandy sequence ID to add prospects to (must be updated by user).  
        - `verifyProspects`: false (does not verify emails before import)  
        - `conflictAction`: "overwrite" (overwrites existing prospects if conflicts occur)  
    - Inputs: Filtered user data from "Date Filtered Users" node  
    - Outputs: API response for each user import  
    - Failure Modes:  
      - Invalid or expired API key  
      - Incorrect or missing sequence ID  
      - API rate limits or network errors  
      - Invalid email formats rejected by Saleshandy  
    - Version: HTTP Request v4.2  
    - Sticky Note7 instructs updating API key and sequence ID.

---

#### 1.5 Google Sheets Tracking

- **Overview:**  
Appends or updates a row in a designated Google Sheet with user data for tracking onboarded users, enabling backup or further analysis.

- **Nodes Involved:**  
  - Append row for semi-qualified (Google Sheets)  
  - Sticky Note8 (purpose of appending to sheet)  
  - Sticky Note9 (required Google Sheets account and sheet column setup)

- **Node Details:**  

  - **Append row for semi-qualified**  
    - Type: Google Sheets  
    - Configuration:  
      - Operation: appendOrUpdate (adds a new row or updates if matching ID exists)  
      - Document ID: User’s Google Sheet ID (configured)  
      - Sheet Name: "Sheet1" (gid=0)  
      - Columns mapped:  
        - ID ← user `id`  
        - Name ← user `first_name`  
        - Email ← user `email`  
        - created_at ← user `created_at`  
      - Matching Columns: "ID" to find existing rows  
    - Inputs: User data from Saleshandy import node  
    - Outputs: Confirmation of sheet update  
    - Failure Modes:  
      - Authentication errors if Google Sheets OAuth2 token expires or is invalid  
      - Sheet or document ID misconfiguration  
      - Missing required columns in the target sheet  
    - Credentials: Uses Google Sheets OAuth2 API credentials  
    - Version: 4.6  
    - Sticky Note9 details required columns and connection setup.

---

### 3. Summary Table

| Node Name                          | Node Type        | Functional Role                        | Input Node(s)                 | Output Node(s)                               | Sticky Note                                                                                                                                                                      |
|-----------------------------------|------------------|-------------------------------------|------------------------------|----------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Trigger Everyday                  | Manual Trigger   | Starts workflow manually             |                              | Get yesterday dates                          |                                                                                                                                                                                  |
| Get yesterday dates              | Code             | Generates start/end timestamps for yesterday | Trigger Everyday             | Fetch all users from database                 | Sticky Note3: Date Generator - generates yesterday’s date for filtering signups.                                                                                                 |
| Fetch all users from database    | HTTP Request     | Fetches all users from database      | Get yesterday dates           | Date Filtered Users                           | Sticky Note1: Fetch all users from database and filter by date range. Sticky Note4: Update with your database URL and keys.                                                     |
| Date Filtered Users              | Code             | Filters users by date and parses names | Fetch all users from database | Add new signup to Saleshandy's Sequence      | Sticky Note1: Context on fetching users. Sticky Note6: Default date set to yesterday.                                                                                           |
| Add new signup to Saleshandy's Sequence | HTTP Request | Adds users to Saleshandy email sequence | Date Filtered Users           | Append row for semi-qualified                 | Sticky Note5: Connects to Saleshandy sequence. Sticky Note7: Update with Saleshandy API key and sequence ID.                                                                     |
| Append row for semi-qualified    | Google Sheets    | Adds/updates user rows in Google Sheet | Add new signup to Saleshandy's Sequence |                                      | Sticky Note8: Append to Google Sheets for tracking. Sticky Note9: Connect Google Sheets account, select sheet, ensure columns ID, Name, Email, created_at exist.                  |
| Sticky Note1                    | Sticky Note      | Workflow context on fetching users   |                              |                                              |                                                                                                                                                                                  |
| Sticky Note2                    | Sticky Note      | Trigger info and routine recommendation |                              |                                              |                                                                                                                                                                                  |
| Sticky Note3                    | Sticky Note      | Date generator explanation           |                              |                                              |                                                                                                                                                                                  |
| Sticky Note4                    | Sticky Note      | Database connection credentials info |                              |                                              |                                                                                                                                                                                  |
| Sticky Note5                    | Sticky Note      | Saleshandy integration context       |                              |                                              |                                                                                                                                                                                  |
| Sticky Note6                    | Sticky Note      | Date default setting note            |                              |                                              |                                                                                                                                                                                  |
| Sticky Note7                    | Sticky Note      | Saleshandy API key and sequence ID setup |                              |                                              |                                                                                                                                                                                  |
| Sticky Note8                    | Sticky Note      | Google Sheets append explanation     |                              |                                              |                                                                                                                                                                                  |
| Sticky Note9                    | Sticky Note      | Google Sheets connection and columns |                              |                                              |                                                                                                                                                                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Manual Trigger node**  
   - Name: `Trigger Everyday`  
   - Purpose: Start the workflow manually or schedule externally.

2. **Add a Code node**  
   - Name: `Get yesterday dates`  
   - Paste the JavaScript code to compute yesterday’s start and end timestamps in Supabase format:  
     ```js
     function formatToSupabaseTimestamp(date) {
       const iso = date.toISOString();
       const [datePart, ms = "000"] = iso.split('.')[1]?.split('Z') || ["000"];
       const paddedMicro = (ms + "000000").slice(0, 6);
       return iso.replace(/\.\d+Z/, `.${paddedMicro}+00:00`);
     }
     const now = new Date();

     const yesterday = new Date(now);
     yesterday.setDate(now.getDate() - 1);
     yesterday.setHours(0, 0, 0, 0);

     const start = new Date(yesterday);
     const end = new Date(yesterday);
     end.setHours(23, 59, 59, 999);

     return [
       {
         json: {
           isoStart: formatToSupabaseTimestamp(start),
           isoEnd: formatToSupabaseTimestamp(end)
         }
       }
     ];
     ```
   - Connect `Trigger Everyday` → `Get yesterday dates`.

3. **Add an HTTP Request node**  
   - Name: `Fetch all users from database`  
   - Set URL to your database endpoint (e.g., Supabase REST URL for users).  
   - Method: GET  
   - Add Header parameters:  
     - `apikey`: Your public anon key  
     - `Authorization`: `Bearer YOUR_SERVICE_ROLE_KEY`  
   - Connect `Get yesterday dates` → `Fetch all users from database`.

4. **Add a Code node**  
   - Name: `Date Filtered Users`  
   - Paste the JavaScript code to filter by creation date and parse names:  
     ```js
     const isoStart = $items("Get yesterday dates")[0].json.isoStart;
     const isoEnd = $items("Get yesterday dates")[0].json.isoEnd;

     return items
       .filter(item => {
         const createdAt = new Date(item.json.created_at);
         const start = new Date(isoStart);
         const end = new Date(isoEnd);
         return createdAt >= start && createdAt <= end;
       })
       .map(item => {
         const [first_name, ...rest] = item.json.full_name.split(' ');
         const last_name = rest.join(' ') || '';
         return {
           json: {
             id: item.json.id,
             first_name: first_name,
             last_name: last_name,
             email: item.json.email,
             created_at: item.json.created_at
           }
         };
       });
     ```
   - Connect `Fetch all users from database` → `Date Filtered Users`.

5. **Add an HTTP Request node**  
   - Name: `Add new signup to Saleshandy's Sequence`  
   - URL: `https://open-api.saleshandy.com/v1/sequences/prospects/import-with-field-name`  
   - Method: POST  
   - Headers:  
     - `x-api-key`: Your Saleshandy API key  
   - Body Parameters (JSON):  
     ```json
     {
       "prospectList": [
         {
           "First Name": "={{ $json['first_name'] }}",
           "Email": "={{ $json['email'] }}"
         }
       ],
       "stepId": "YOUR_SALESHANDY_SEQUENCE_ID",
       "verifyProspects": false,
       "conflictAction": "overwrite"
     }
     ```
   - Connect `Date Filtered Users` → `Add new signup to Saleshandy's Sequence`.

6. **Add a Google Sheets node**  
   - Name: `Append row for semi-qualified`  
   - Operation: `appendOrUpdate`  
   - Document ID: Your Google Sheet ID  
   - Sheet Name: `Sheet1` (or your actual sheet name/gid)  
   - Columns mapping:  
     - ID ← `={{ $('Date Filtered Users').item.json.id }}`  
     - Name ← `={{ $('Date Filtered Users').item.json.first_name }}`  
     - Email ← `={{ $('Date Filtered Users').item.json.email }}`  
     - created_at ← `={{ $('Date Filtered Users').item.json.created_at }}`  
   - Matching Columns: `ID`  
   - Connect `Add new signup to Saleshandy's Sequence` → `Append row for semi-qualified`.  
   - Configure Google Sheets OAuth2 credentials with your Google account.

---

### 5. General Notes & Resources

| Note Content                                                                                                                         | Context or Link                                                                                                 |
|--------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------|
| This workflow automates onboarding by connecting app signups to Saleshandy sequences and tracks users in Google Sheets daily.        | Workflow purpose summary                                                                                         |
| Update all placeholder values: Database URL, API keys (database and Saleshandy), Saleshandy Sequence ID, and Google Sheets info.     | Essential for correct workflow operation                                                                        |
| Google Sheets must contain columns: ID, Name, Email, created_at for proper mapping and updating.                                      | Critical for data consistency                                                                                    |
| Saleshandy API documentation for sequences: https://developers.saleshandy.com/reference/post-sequences-prospects-import-with-field-name | Reference for Saleshandy API usage                                                                                |
| Adjust date range logic in "Get yesterday dates" node if you want a different signup filter window (e.g., last 7 days, last month).   | Flexibility tip                                                                                                |

---

**Disclaimer:** The text provided is derived solely from an automated n8n workflow. It strictly complies with content policies and contains no illegal, offensive, or protected material. All data processed is legal and public.