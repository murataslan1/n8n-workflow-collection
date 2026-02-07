Automate Instagram Reel Downloads with Google Drive Storage & Telegram Alerts

https://n8nworkflows.xyz/workflows/automate-instagram-reel-downloads-with-google-drive-storage---telegram-alerts-8257


# Automate Instagram Reel Downloads with Google Drive Storage & Telegram Alerts

### 1. Workflow Overview

This workflow automates Instagram Reel downloads triggered via webhook events, storing the downloaded reels in Google Drive, logging metadata in Google Sheets, and sending Telegram alerts upon successful downloads. It is designed primarily for users who want to automate archiving and notification of Instagram Reels shared via messaging platforms.

The workflow is composed of the following logical blocks:

- **1.1 Webhook Reception & Validation**: Receives incoming webhook events and validates subscription requests.
- **1.2 Sender Filtering**: Filters messages to process only those sent by the authorized user.
- **1.3 Reel Download**: Downloads the Instagram Reel video from the provided message attachment URL.
- **1.4 Timestamp Generation**: Generates a timestamp and unique ID for each event.
- **1.5 Google Drive Upload**: Uploads the downloaded video file to a specified Google Drive folder.
- **1.6 Google Sheets Logging**: Logs the download event details into a Google Sheets document.
- **1.7 Telegram Notification**: Sends a Telegram message with the download details and reel URL.

---

### 2. Block-by-Block Analysis

#### 2.1 Webhook Reception & Validation

- **Overview:**  
  This block listens for incoming webhook calls, including subscription handshake requests from Instagram or related services, and responds appropriately to validate the webhook.

- **Nodes Involved:**  
  - Webhook  
  - If (subscription validation)  
  - Respond to Webhook  

- **Node Details:**

  - **Webhook**  
    - Type: Webhook (HTTP Listener)  
    - Role: Entry point receiving incoming webhook HTTP requests on path `n8n-template-insta-webhook`. Supports multiple HTTP methods.  
    - Configuration:  
      - Path: `n8n-template-insta-webhook`  
      - Response mode: Uses a separate response node  
    - Inputs: External HTTP request  
    - Outputs: Passes incoming data to the next nodes  
    - Edge Cases: Must ensure correct path and server exposure; misconfiguration may lead to no events captured.

  - **If (Subscription Validation Check)**  
    - Type: If (conditional branching)  
    - Role: Checks if the incoming webhook request is a subscription validation request by comparing query parameters:  
      - `hub.mode` equals `subscribe`  
      - `hub.verify_token` equals a preset token (`youtube-automation-n8n-token`)  
    - Configuration: Uses strict string equality and case-sensitive checks on query parameters.  
    - Inputs: From Webhook node  
    - Outputs:  
      - True: Means validation request, route to Respond to Webhook  
      - False: Pass to main processing branch (sender filtering)  
    - Edge Cases: Token mismatch or missing query parameters will cause validation failure.

  - **Respond to Webhook**  
    - Type: Respond to Webhook  
    - Role: Sends back the `hub.challenge` query parameter as plain text to complete webhook subscription handshake.  
    - Configuration: Responds with `{{$json.query['hub.challenge']}}`  
    - Inputs: From If node (validation branch)  
    - Outputs: HTTP response to caller  
    - Edge Cases: Missing challenge param may cause handshake failure.

---

#### 2.2 Sender Filtering

- **Overview:**  
  Filters incoming messages to process only those sent by the authorized user (presumably the owner), based on sender and recipient IDs.

- **Nodes Involved:**  
  - If Sender is Me  

- **Node Details:**

  - **If Sender is Me**  
    - Type: If (conditional branching)  
    - Role: Checks if both the sender ID and recipient ID in the message match the configured user ID (value `123456` used as placeholder).  
    - Configuration:  
      - Compares:  
        - `body.entry[0].messaging[0].sender.id` equals `123456`  
        - `body.entry[0].messaging[0].recipient.id` equals `123456`  
      - Both conditions must be true (AND combinator)  
    - Inputs: From Webhook node (non-subscription branch) and again from Upload File node (loopback for reprocessing)  
    - Outputs:  
      - True: Continue processing  
      - False: Stop processing  
    - Edge Cases: Invalid or missing IDs will skip processing.

---

#### 2.3 Timestamp Generation

- **Overview:**  
  Generates a current timestamp and a unique ISO string ID to tag the event for logging and uniqueness.

- **Nodes Involved:**  
  - Get Timestamp Code  

- **Node Details:**

  - **Get Timestamp Code**  
    - Type: Code (JavaScript)  
    - Role: Returns an object with:  
      - `timestamp`: Current date/time string in "en-In" locale and "Asia/Kolkata" timezone  
      - `id`: ISO string timestamp for uniqueness  
    - Configuration (JS code):
    ```js
    return {
      timestamp: new Date().toLocaleString("en-In", {
        timeZone: "asia/Kolkata",
      }),
      id: new Date().toISOString()
    };
    ```
    - Inputs: From If Sender is Me node (true branch)  
    - Outputs: Timestamp and ID data for downstream nodes  
    - Edge Cases: Date/time functions rely on server timezone correctness.

---

#### 2.4 Reel Download

- **Overview:**  
  Downloads the Instagram Reel video from the URL found in the message attachment payload.

- **Nodes Involved:**  
  - Get Reel  

- **Node Details:**

  - **Get Reel**  
    - Type: HTTP Request  
    - Role: Fetches the video content from the URL supplied in the message attachment.  
    - Configuration:  
      - URL dynamically extracted from the message JSON path:  
        `$('If Sender is Me').first().json.body.entry[0].messaging[0].message.attachments[0].payload.url`  
      - No additional HTTP options specified.  
    - Inputs: From Get Timestamp Code node  
    - Outputs: Binary video data for upload  
    - Edge Cases:  
      - URL might be invalid or expired  
      - Network timeouts or HTTP errors  
      - Attachment may be missing or malformed

---

#### 2.5 Google Drive Upload

- **Overview:**  
  Uploads the downloaded Instagram Reel video file to a designated folder in Google Drive.

- **Nodes Involved:**  
  - Upload file  

- **Node Details:**

  - **Upload file**  
    - Type: Google Drive (File upload)  
    - Role: Uploads the incoming binary data as a file into Google Drive under the folder ID `1WcR_S-0wDexvEX16NmEH9SZFiJD8Ajk7`.  
    - Configuration:  
      - Drive: "My Drive" (default drive)  
      - Folder ID: `1WcR_S-0wDexvEX16NmEH9SZFiJD8Ajk7` (Google Drive folder for storage)  
    - Credentials: Requires `Google Drive OAuth2` credentials set up and authorized.  
    - Inputs: From Get Reel (binary file)  
    - Outputs: Metadata of uploaded file, including webViewLink for sharing.  
    - Edge Cases:  
      - Credential expiration or auth failure  
      - Folder ID invalid or inaccessible  
      - File upload size limits or quota exceeded

---

#### 2.6 Google Sheets Logging

- **Overview:**  
  Records the downloaded reel event metadata into a Google Sheet for tracking and auditing.

- **Nodes Involved:**  
  - Update Sheet with the Reel  

- **Node Details:**

  - **Update Sheet with the Reel**  
    - Type: Google Sheets (Append/Update row)  
    - Role: Logs the reel download event by appending or updating a row with these columns:  
      - URL: Google Drive webViewLink of the uploaded file  
      - Status: Set as "Downloaded"  
      - Timestamp: The generated timestamp from Get Timestamp Code node  
    - Configuration:  
      - Document ID: `1ItzGn2Wrs7FCXTzGGxbCbhUElUR4Q78S7_OFSbWbBRk` (Google Sheet document)  
      - Sheet Name (tab): `969588995` (numeric ID of the tab)  
      - Matching column: URL (to avoid duplicates)  
      - Operation: Append or update row based on URL matching  
    - Credentials: Requires Google Sheets OAuth2 credentials.  
    - Inputs: From Upload file (for file metadata) and Get Timestamp Code (for timestamp)  
    - Outputs: Confirmation of logging  
    - Edge Cases:  
      - Credential issues or sheet permission errors  
      - Sheet or tab ID incorrect/moved  
      - Data format mismatches

---

#### 2.7 Telegram Notification

- **Overview:**  
  Sends a Telegram message notifying that the reel has been downloaded and stored, including the timestamp and Google Drive URL.

- **Nodes Involved:**  
  - Message  

- **Node Details:**

  - **Message**  
    - Type: Telegram node  
    - Role: Sends a text message to a specified Telegram chat ID.  
    - Configuration:  
      - Chat ID: `1459274827` (target Telegram user or group)  
      - Text template:  
        ```
        {{$json.Timestamp}}

        Downloaded Reel & Saved to Drive.
        URL - {{$json.URL}}
        ```  
      - No attribution appended.  
    - Credentials: Uses Telegram Bot API credentials configured as `Youtube Automation Telegram Bot`  
    - Inputs: From Update Sheet with the Reel (passing timestamp and URL)  
    - Outputs: Message sent confirmation  
    - Edge Cases:  
      - Telegram API limits or downtime  
      - Chat ID invalid or bot not authorized in chat

---

### 3. Summary Table

| Node Name                 | Node Type          | Functional Role                      | Input Node(s)             | Output Node(s)                | Sticky Note                                                         |
|---------------------------|--------------------|------------------------------------|---------------------------|------------------------------|--------------------------------------------------------------------|
| Webhook                   | Webhook            | Entry point for incoming events    | -                         | If, If Sender is Me           | ## Insta Reel Auto Downloader – Key Steps<br>- Receives events (set this path in Meta Dev).<br>- Challenge Validate: Responds to webhook handshake with verify token.<br>- Sender Filter: Processes only your own events/messages.<br>- Fetch Reel: Downloads IG reel from message/attachment URL.<br>- Timestamp + ID: Adds unique ISO timestamp per event.<br>- Drive Upload: Saves video file to Google Drive.<br>- Sheet Log: Records download info in Google Sheet.<br>- Telegram: Sends download/link alert to you. |
| If                        | If                 | Validates subscription handshake   | Webhook                   | Respond to Webhook            |                                                                    |
| Respond to Webhook        | Respond to Webhook  | Responds to webhook subscription   | If                        | -                            |                                                                    |
| If Sender is Me           | If                 | Filters messages by sender/recipient ID | Webhook, Upload file      | Get Timestamp Code            |                                                                    |
| Get Timestamp Code        | Code               | Adds timestamp and unique ID       | If Sender is Me            | Get Reel                     |                                                                    |
| Get Reel                  | HTTP Request       | Downloads Instagram Reel video     | Get Timestamp Code         | Upload file                  |                                                                    |
| Upload file               | Google Drive       | Uploads video to Google Drive      | Get Reel                   | Update Sheet with the Reel, If Sender is Me |                                                                    |
| Update Sheet with the Reel| Google Sheets      | Logs download info in Google Sheets| Upload file                | Message                      |                                                                    |
| Message                   | Telegram           | Sends Telegram notification        | Update Sheet with the Reel | -                            |                                                                    |
| Sticky Note               | Sticky Note        | Documentation note                 | -                         | -                            | See first sticky note content above.                              |
| Sticky Note1              | Sticky Note        | Setup instructions                 | -                         | -                            | ## Setup Tips<br>- Set Google Drive, Sheets, and Telegram creds in credentials.<br>- Update webhook path and verify_token to match your app.<br>- Make sure Sheet tab & folder IDs are correct.<br>- Use this as a plug-and-play IG reel downloader + logger! |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**  
   - Type: Webhook  
   - Path: `n8n-template-insta-webhook`  
   - Methods: Enable all HTTP methods (default multipleMethods: true)  
   - Response Mode: Use separate Respond to Webhook node for responses

2. **Add If Node (Subscription Validation Check)**  
   - Conditions:  
     - `{{$json.query['hub.mode']}}` equals `subscribe`  
     - `{{$json.query['hub.verify_token']}}` equals `youtube-automation-n8n-token` (replace with your token)  
   - Use AND combinator, case-sensitive, strict validation

3. **Add Respond to Webhook Node**  
   - Respond With: Text  
   - Response Body: `{{$json.query['hub.challenge']}}`

4. **Connect Webhook Node main output to two branches:**  
   - First branch to If (subscription validation) node  
   - Second branch to If Sender is Me node

5. **Add If Sender is Me Node**  
   - Conditions (AND):  
     - `{{$json.body.entry[0].messaging[0].sender.id}}` equals your sender ID (replace `123456`)  
     - `{{$json.body.entry[0].messaging[0].recipient.id}}` equals your recipient ID (replace `123456`)  
   - This node filters to process messages only from yourself

6. **Add Get Timestamp Code Node**  
   - Type: Code (JavaScript)  
   - Code:
    ```js
    return {
      timestamp: new Date().toLocaleString("en-In", { timeZone: "asia/Kolkata" }),
      id: new Date().toISOString()
    };
    ```

7. **Add Get Reel Node (HTTP Request)**  
   - URL: Extract from previous node JSON data path:  
     `{{$node["If Sender is Me"].json.body.entry[0].messaging[0].message.attachments[0].payload.url}}`  
   - Method: GET  
   - No special headers or auth assumed

8. **Add Upload file Node (Google Drive)**  
   - Operation: Upload file  
   - Drive: My Drive  
   - Folder ID: Your Google Drive folder ID (replace `1WcR_S-0wDexvEX16NmEH9SZFiJD8Ajk7`)  
   - Credentials: Set Google Drive OAuth2 credentials authorized for Drive access

9. **Add Update Sheet with the Reel Node (Google Sheets)**  
   - Operation: Append or Update  
   - Document ID: Your Google Sheet document ID (replace `1ItzGn2Wrs7FCXTzGGxbCbhUElUR4Q78S7_OFSbWbBRk`)  
   - Sheet Name: Your sheet tab ID or name (replace `969588995`)  
   - Columns:  
     - URL: `{{$json.webViewLink}}` from Upload file node output  
     - Status: `"Downloaded"` (static string)  
     - Timestamp: `{{$node["Get Timestamp Code"].json.timestamp}}`  
   - Matching Columns: URL (to avoid duplicates)  
   - Credentials: Google Sheets OAuth2 credentials with edit rights

10. **Add Message Node (Telegram)**  
    - Text:  
      ```
      {{$json.Timestamp}}

      Downloaded Reel & Saved to Drive.
      URL - {{$json.URL}}
      ```  
    - Chat ID: Your Telegram chat ID (replace `1459274827`)  
    - Credentials: Telegram Bot API credentials for your bot

11. **Connect Nodes Sequentially:**  
    - Webhook → If (subscription validation) → Respond to Webhook  
    - Webhook → If Sender is Me → Get Timestamp Code → Get Reel → Upload file  
    - Upload file → Update Sheet with the Reel → Message  
    - Upload file also connects back to If Sender is Me for potential reprocessing (optional loop)

12. **Set Up Credentials:**  
    - Google Drive OAuth2 with access to your Drive folder  
    - Google Sheets OAuth2 with access to the target spreadsheet  
    - Telegram Bot API with bot token and chat permissions

13. **Validate Webhook Exposure:**  
    - Ensure your n8n instance is publicly available or proxied  
    - Update webhook URL in Instagram or related service to point to your n8n webhook URL

---

### 5. General Notes & Resources

| Note Content                                                                                                                     | Context or Link                                                                                           |
|----------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| ## Insta Reel Auto Downloader – Key Steps<br>- Webhook Listener for events<br>- Challenge Validate handshake<br>- Sender Filter<br>- Reel Download<br>- Timestamp + ID<br>- Drive Upload<br>- Sheet Log<br>- Telegram Notification | Workflow summary contained in the workflow sticky note node for high-level understanding                 |
| ## Setup Tips<br>- Set Google Drive, Sheets, and Telegram credentials<br>- Update webhook path and verify_token<br>- Verify Sheet tab and folder IDs<br>- Use as plug-and-play IG reel downloader and logger! | Setup instructions from workflow sticky note node                                                        |
| The workflow assumes user-specific IDs (`123456`) and tokens (`youtube-automation-n8n-token`) must be replaced with your values. | IDs and tokens must be customized for your Instagram and messaging account environment                    |
| Telegram Bot API requires prior bot creation and chat ID retrieval—use tools like @userinfobot to get chat ID.                   | Telegram bot and chat setup prerequisite                                                                  |
| Google OAuth2 credentials must have scopes for Drive and Sheets API enabled and consented for smooth operation.                  | Credential setup requires Google Cloud Console configuration for OAuth2 credentials                       |

---

**Disclaimer:**  
The text provided is exclusively derived from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.