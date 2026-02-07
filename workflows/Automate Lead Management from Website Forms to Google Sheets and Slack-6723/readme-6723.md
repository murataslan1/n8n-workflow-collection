Automate Lead Management from Website Forms to Google Sheets and Slack

https://n8nworkflows.xyz/workflows/automate-lead-management-from-website-forms-to-google-sheets-and-slack-6723


# Automate Lead Management from Website Forms to Google Sheets and Slack

### 1. Workflow Overview

This workflow automates lead management by capturing website form submissions, standardizing the data, logging it to a Google Sheet, and sending real-time notifications to a Slack channel. It is designed for businesses seeking to streamline the intake of new leads from their website and ensure prompt internal communication for follow-up.

The workflow logically divides into four functional blocks:

- **1.1 Input Reception:** Receives inbound lead data from website forms via a webhook.
- **1.2 Data Transformation:** Processes and normalizes the raw incoming data into a clean, structured format.
- **1.3 Data Logging:** Appends the processed lead details into a designated Google Sheet serving as the lead database.
- **1.4 Team Notification:** Sends a detailed notification message to a Slack channel alerting the team about the new lead.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

**Overview:**  
This block captures incoming POST requests containing lead data submitted from the website’s contact form. It acts as the entry point of the workflow.

**Nodes Involved:**  
- Webhook

**Node Details:**  

- **Webhook**  
  - *Type & Role:* HTTP Webhook node, serves as the trigger for the workflow.  
  - *Configuration:*  
    - HTTP Method: POST  
    - Path: Unique string `34e9fb3f-f6bd-4a44-bb58-6fe58ffe4a78` used as the webhook URL suffix.  
  - *Expressions / Variables:* None directly; receives raw JSON payload in `body`.  
  - *Input/Output:* No input; outputs received JSON data as `item.json`.  
  - *Version:* 2  
  - *Potential Failures:*  
    - Missing or malformed payloads causing subsequent nodes to fail.  
    - Unauthorized or unexpected POST requests if webhook URL leaks.  
  - *Notes:* The webhook URL must be used as the form submission endpoint on the website or API client.

---

#### 2.2 Data Transformation

**Overview:**  
Transforms the raw JSON payload from the webhook into a standardized JSON object containing only relevant fields with clean keys.

**Nodes Involved:**  
- Code

**Node Details:**  

- **Code**  
  - *Type & Role:* JavaScript Code node that normalizes incoming data.  
  - *Configuration:*  
    - Custom JavaScript extracts fields `name`, `email`, `businessName`, `message`, `timeline`, `budget` from the incoming request body (`item.json.body`).  
    - Maps `message` field to `project intent/need` for clarity.  
  - *Key expressions:*  
    ```js
    const { name, email, businessName, message, timeline, budget } = item.json.body;
    return {
      name,
      email,
      businessName,
      "project intent/need": message,
      timeline,
      budget,
    };
    ```  
  - *Input/Output:* Input from Webhook node; outputs cleaned JSON with renamed keys.  
  - *Version:* 2  
  - *Edge cases:*  
    - Missing fields in `body` may lead to undefined values.  
    - Unexpected payload structure can cause errors.  
  - *Notes:* Modify field names here if the website form fields change.

---

#### 2.3 Data Logging

**Overview:**  
Appends the standardized lead data as a new row in an existing Google Sheet to maintain a persistent lead database.

**Nodes Involved:**  
- Google Sheets

**Node Details:**  

- **Google Sheets**  
  - *Type & Role:* Google Sheets node, appends a row with lead details.  
  - *Configuration:*  
    - Operation: Append  
    - Credentials: OAuth2 credential linked to Google Sheets API.  
    - Document ID: Spreadsheet ID `1OBxt6TX3edgxiSYnsULCuSM5OL7GYlA6W3DjNYBEpfo` (replace with your sheet ID).  
    - Sheet Name: `gid=0` (Sheet1).  
    - Columns mapped to node input JSON fields:  
      - `full name`: `={{ $json.name }}`  
      - `Email Address`: `={{ $json.email }}`  
      - `Business name`: `={{ $json.businessName }}`  
      - `Project Intent/Needs`: `={{ $json['project intent/need'] }}`  
      - `Project Timeline`: `={{ $json.timeline }}`  
      - `Budget Range`: `={{ $json.budget }}`  
    - No explicit timestamp column configured here; timestamp is managed via Slack notification message.  
  - *Input/Output:* Input from Code node; outputs data status for downstream nodes.  
  - *Version:* 4.5  
  - *Potential Failures:*  
    - Authentication or permission errors with Google Sheets OAuth2.  
    - Invalid spreadsheet ID or sheet name.  
    - Data type mismatches or empty fields causing append failures.  
  - *Notes:* The sheet must have matching column headers exactly as configured.

---

#### 2.4 Team Notification

**Overview:**  
Sends a formatted message to a Slack channel to alert the team about the new lead and provide key details for immediate action.

**Nodes Involved:**  
- Send a message (Slack)

**Node Details:**  

- **Send a message**  
  - *Type & Role:* Slack node sending message notifications.  
  - *Configuration:*  
    - Operation: Send a message  
    - Credentials: OAuth2 Slack credential for bot authentication.  
    - Channel: Slack channel ID (replace with target channel).  
    - Message Template: Includes lead details from the Code node using expressions, such as:  
      - Name, Email, Business Name (defaulting to 'N/A' if empty)  
      - Project Intent/Need  
      - Timeline (defaults to 'Not specified')  
      - Budget (defaults to 'Not specified')  
    - Includes a clickable link to the Google Sheet and a timestamp of reception.  
  - *Expressions used:*  
    - `{{ $('Code').item.json.name }}`, etc., to pull lead data from previous node.  
    - `{{ new Date().toLocaleString() }}` for current timestamp.  
  - *Input/Output:* Input from Google Sheets node; no output.  
  - *Version:* 2.3  
  - *Potential Failures:*  
    - Slack authentication or permission errors.  
    - Invalid or missing Slack channel ID.  
    - Message template errors if referenced fields are missing.  
  - *Notes:* Ensure the Slack app has appropriate permissions (`chat:write`, `channels:read`).

---

### 3. Summary Table

| Node Name      | Node Type           | Functional Role            | Input Node(s) | Output Node(s) | Sticky Note                                                                                                    |
|----------------|---------------------|----------------------------|---------------|----------------|---------------------------------------------------------------------------------------------------------------|
| Webhook        | HTTP Webhook        | Input Reception            | —             | Code           | This node receives data from your website's contact form via a POST webhook.                                  |
| Code           | Code                | Data Transformation        | Webhook       | Google Sheets  | Transforms raw webhook data into a clean standardized JSON object.                                            |
| Google Sheets  | Google Sheets       | Data Logging               | Code          | Send a message | Appends the lead details to the Google Sheet specified by document ID and sheet name.                         |
| Send a message | Slack               | Team Notification          | Google Sheets | —              | Sends a formatted Slack alert message to notify the team of a new lead, including details and a sheet link.   |
| Sticky Note    | Sticky Note         | Documentation & Instructions | —             | —              | Website Contact Form to Google Sheet & Slack Notification: comprehensive setup and usage instructions included.|

---

### 4. Reproducing the Workflow from Scratch

1. **Create a New Workflow in n8n**

2. **Add a Webhook Node**  
   - Name: `Webhook`  
   - HTTP Method: `POST`  
   - Path: `34e9fb3f-f6bd-4a44-bb58-6fe58ffe4a78` (unique identifier)  
   - No authentication required unless desired for security.

3. **Add a Code Node**  
   - Name: `Code`  
   - Connect input from `Webhook` node.  
   - Paste the following JavaScript:  
     ```js
     const items = $input.all();
     const updatedItems = items.map((item) => {
       const { name, email, businessName, message, timeline, budget } = item.json.body;
       return {
         name,
         email,
         businessName,
         "project intent/need": message,
         timeline,
         budget,
       };
     });
     return updatedItems;
     ```
   - No additional parameters required.

4. **Add a Google Sheets Node**  
   - Name: `Google Sheets`  
   - Connect input from `Code` node.  
   - Operation: `Append`  
   - Credentials: Select or create Google Sheets OAuth2 credential with access to your Google account.  
   - Document ID: Use your Google Sheet's ID (found in the URL).  
   - Sheet Name: `Sheet1` (or your sheet’s actual tab name).  
   - Map columns as follows:  
     - `full name`: `={{ $json.name }}`  
     - `Email Address`: `={{ $json.email }}`  
     - `Business name`: `={{ $json.businessName }}`  
     - `Project Intent/Needs`: `={{ $json['project intent/need'] }}`  
     - `Project Timeline`: `={{ $json.timeline }}`  
     - `Budget Range`: `={{ $json.budget }}`

5. **Add a Slack Node**  
   - Name: `Send a message`  
   - Connect input from `Google Sheets` node.  
   - Operation: `Send a message`  
   - Credentials: Select or create Slack OAuth2 credential configured with necessary permissions (`chat:write`, `channels:read`).  
   - Channel ID: Enter the Slack channel ID where messages should be posted.  
   - Message: Use this template (replace the Google Sheet link with your own):  
     ```
     *New Website Lead Alert!* :zap:

     A new project inquiry has been received and logged to the Google Sheet.

     *Details:*
     - *Name:* {{ $('Code').item.json.name }}
     - *Email:* {{ $('Code').item.json.email }}
     - *Business Name:* {{ $('Code').item.json.businessName || 'N/A' }}
     - *Project Intent/Need:* {{ $('Code').item.json['project intent/need'] }}
     - *Timeline:* {{ $('Code').item.json.timeline || 'Not specified' }}
     - *Budget:* {{ $('Code').item.json.budget || 'Not specified' }}

     :clipboard: *Google Sheet Link:* https://docs.google.com/spreadsheets/d/1OBxt6TX3edgxiSYnsULCuSM5OL7GYlA6W3DjNYBEpfo/edit#gid=0
     :alarm_clock: *Received At:* {{ new Date().toLocaleString() }}

     :point_right: *Action:* Please review the details in the Google Sheet and follow up with the lead as soon as possible!
     ```

6. **Connect Nodes in Order:**  
   - `Webhook` → `Code` → `Google Sheets` → `Send a message`

7. **Activate the Workflow** and test by sending POST requests with JSON payloads matching your form fields to the webhook URL.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Context or Link                                                                                                                     |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------|
| This workflow streamlines lead intake from website forms by capturing data, logging it in Google Sheets, and alerting teams on Slack in real-time to ensure prompt follow-up. For detailed setup instructions, consult the sticky note included in the workflow.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Embedded sticky note in workflow contains comprehensive setup and configuration details.                                           |
| Google Sheets OAuth2 authentication requires enabling the Google Sheets API and creating OAuth credentials in the Google Developer Console. Use the generated OAuth credentials in n8n’s credential manager.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | https://developers.google.com/sheets/api/quickstart/js                                                                        |
| Slack OAuth2 setup involves creating a Slack App in your workspace at api.slack.com/apps, adding necessary bot token scopes (`chat:write`, `channels:read`), installing the app, and then configuring OAuth2 credentials in n8n.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | https://api.slack.com/authentication/oauth-v2                                                                                   |
| Ensure that the Google Sheet column headers exactly match those configured in the Google Sheets node to avoid data misalignment.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Google Sheets column headers: Full Name, Email Address, Business Name, Project Intent/Needs, Project Timeline, Budget Range       |
| The webhook URL is sensitive and should not be exposed publicly to avoid unauthorized submissions. Consider adding authentication or IP whitelisting if needed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Security best practice for webhook endpoints                                                                                     |

---

**Disclaimer:** The provided text originates exclusively from an n8n automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected material. All handled data are legal and publicly accessible.