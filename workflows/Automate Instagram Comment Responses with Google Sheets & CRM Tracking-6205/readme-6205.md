Automate Instagram Comment Responses with Google Sheets & CRM Tracking

https://n8nworkflows.xyz/workflows/automate-instagram-comment-responses-with-google-sheets---crm-tracking-6205


# Automate Instagram Comment Responses with Google Sheets & CRM Tracking

---

### 1. Workflow Overview

This workflow automates Instagram comment responses by integrating Instagram’s Graph API with Google Sheets for managing predefined replies and logging user interactions for CRM tracking. It listens to Instagram webhook events, verifies webhook subscriptions, identifies comment updates, matches comments with stored keywords in Google Sheets, sends appropriate automated replies, and logs each interaction with user details and timestamps.

The workflow is logically organized into two main blocks:

- **1.1 Webhook Verification**: Handles Instagram webhook subscription verification requests to confirm the webhook URL with Meta’s platform.
- **1.2 Automated Comment Response & CRM Logging**: Processes incoming Instagram comment events, filters relevant comment updates, checks that comments are from other users, matches comment text against predefined responses in Google Sheets, sends automated replies via Instagram API, and logs interactions in a CRM Google Sheet.

---

### 2. Block-by-Block Analysis

#### 1.1 Webhook Verification

- **Overview:**  
  This block responds to Meta’s webhook verification challenge requests, confirming the webhook subscription by echoing back the challenge token.

- **Nodes Involved:**  
  - Get Verification (Webhook)  
  - Respond to Verification Message (Respond to Webhook)

- **Node Details:**

  1. **Get Verification**  
     - Type: Webhook  
     - Role: Entry point for GET requests from Meta's webhook verification process.  
     - Configuration:  
       - HTTP Method: GET (implicit by default webhook setup)  
       - Path: `/instagram` (same as main webhook path)  
       - Response Mode: Set to use the Respond to Webhook node explicitly.  
     - Input: Incoming GET request with query parameters containing `hub.challenge`.  
     - Output: Passes the request data to the next node for response.  
     - Edge Cases: If request is not a verification challenge, it will pass through but not be handled here.

  2. **Respond to Verification Message**  
     - Type: Respond to Webhook  
     - Role: Sends back the `hub.challenge` token as plain text to complete verification.  
     - Configuration:  
       - Respond With: Text  
       - Response Body: Expression extracting `hub.challenge` from query parameters `={{ $json.query["hub.challenge"] }}`  
     - Input: Receives data from Get Verification node.  
     - Output: Sends HTTP 200 response to Meta.  
     - Edge Cases: If `hub.challenge` is missing, response may fail or be empty.

---

#### 1.2 Automated Comment Response & CRM Logging

- **Overview:**  
  This block receives Instagram webhook POST events for comments, filters for comment updates only, verifies that the comment is from a user other than the Instagram account owner, retrieves a predefined reply from Google Sheets based on the comment keyword, sends the reply via Instagram Graph API, and logs the interaction with relevant user data and response status in another Google Sheet for CRM purposes.

- **Nodes Involved:**  
  - Insta Update (Webhook)  
  - Check if update is of comment? (Switch)  
  - Comment if of other user (If)  
  - Comment List (Google Sheets)  
  - Send Message for Comment (HTTP Request)  
  - Add Interation in Sheet (CRM) (Google Sheets)

- **Node Details:**

  1. **Insta Update**  
     - Type: Webhook  
     - Role: Entry point for Instagram POST webhook events (comment updates).  
     - Configuration:  
       - HTTP Method: POST  
       - Path: `/instagram`  
     - Input: Receives Instagram webhook event payloads for comments, messages, etc.  
     - Output: Passes webhook JSON to the next node.  
     - Edge Cases: Payload structure may vary; expects Instagram Graph API format.

  2. **Check if update is of comment?**  
     - Type: Switch  
     - Role: Filters webhook events to process only comment updates.  
     - Configuration:  
       - Condition: Checks if `body.entry[0].changes[0].field` equals `"comments"`.  
       - Output: Routes matching comment events to "Comment" output; others ignored.  
     - Input: Receives webhook event JSON from Insta Update.  
     - Output: Routes to Comment if true.  
     - Edge Cases: If the webhook payload structure changes or missing fields, condition may fail.

  3. **Comment if of other user**  
     - Type: If  
     - Role: Ensures comment is from a user other than the Instagram account owner to avoid self-responses.  
     - Configuration:  
       - Condition: Compares `body.entry[0].id` (Instagram account ID) to `body.entry[0].changes[0].value.from.id` (comment author ID); proceeds only if not equal.  
     - Input: Receives comment event JSON from Switch node.  
     - Output: Continues only if comment is from another user.  
     - Edge Cases: If IDs are missing or identical, the node blocks further processing.

  4. **Comment List**  
     - Type: Google Sheets  
     - Role: Retrieves the predefined response message matching the comment keyword from the "Comment Responses" sheet.  
     - Configuration:  
       - Return First Match: true (only first matching row returned)  
       - Filter: Matches the first word of the comment text (lowercase) to the "Comment" column in the sheet.  
       - Document ID: Google Sheet identified by ID `1tQwit0eRrR5N-EoLX4dyXurjEDtthsr97Vny9kaIRdA`  
       - Sheet Name: `gid=0` (assumed first sheet)  
     - Input: Uses comment text from webhook to filter.  
     - Output: Provides matched row with reply message.  
     - Credentials: Google Sheets OAuth2 credential named "Akash Google Sheet Account".  
     - Edge Cases: If no match found, output is empty and downstream nodes must handle this gracefully.

  5. **Send Message for Comment**  
     - Type: HTTP Request  
     - Role: Sends the automated reply message back to the Instagram user via Instagram Graph API.  
     - Configuration:  
       - URL: `https://graph.instagram.com/v23.0/{comment_id}/messages` where `{comment_id}` is dynamically extracted from webhook data.  
       - Method: POST  
       - Body (JSON):  
         ```json
         {
           "recipient": {
             "id": "{user_id}"
           },
           "message": {
             "text": "{reply_message}"
           }
         }
         ```  
         where `user_id` and `reply_message` are dynamically retrieved from webhook and Google Sheets respectively.  
       - Authentication: HTTP Header Auth with Instagram Access Token credential.  
       - On Error: Continues workflow on failure to avoid blocking.  
     - Input: Uses matched comment ID, user ID, and reply message.  
     - Output: Passes response or error info downstream.  
     - Edge Cases: Possible errors include expired token, invalid user ID, API rate limits. Errors are recorded but do not stop workflow.

  6. **Add Interation in Sheet (CRM)**  
     - Type: Google Sheets  
     - Role: Logs the interaction details including timestamp, user ID, username, and any error messages into an "Interaction List" sheet for CRM tracking.  
     - Configuration:  
       - Operation: Append new row  
       - Columns:  
         - Time: Timestamp from webhook event  
         - User Id: Comment author ID  
         - Username: Comment author username  
         - Note: Error message if any (from Send Message node)  
       - Document ID: Same as above  
       - Sheet Name: `76673878` (second sheet tab)  
     - Input: Receives data from the HTTP Request node's output and webhook.  
     - Credentials: Same Google Sheets OAuth2 credentials.  
     - Edge Cases: Append failures may occur due to permission issues or API limits.

---

### 3. Summary Table

| Node Name                   | Node Type            | Functional Role                                | Input Node(s)              | Output Node(s)               | Sticky Note                                                                                      |
|-----------------------------|----------------------|-----------------------------------------------|----------------------------|-----------------------------|-------------------------------------------------------------------------------------------------|
| Insta Update                | Webhook              | Receives Instagram POST webhook events         |                            | Check if update is of comment? |                                                                                                |
| Check if update is of comment? | Switch               | Filters events to comment updates only           | Insta Update               | Comment if of other user     |                                                                                                |
| Comment if of other user     | If                   | Checks comment is from a different user         | Check if update is of comment? | Comment List                |                                                                                                |
| Comment List                | Google Sheets        | Fetches predefined reply based on comment keyword | Comment if of other user    | Send Message for Comment     |                                                                                                |
| Send Message for Comment    | HTTP Request         | Sends reply message to Instagram user            | Comment List               | Add Interation in Sheet (CRM) |                                                                                                |
| Add Interation in Sheet (CRM) | Google Sheets        | Logs interaction details for CRM                  | Send Message for Comment    |                             |                                                                                                |
| Get Verification           | Webhook              | Receives GET webhook verification requests       |                            | Respond to Verfication Message |                                                                                                |
| Respond to Verfication Message | Respond to Webhook   | Responds with hub.challenge token for verification | Get Verification           |                             |                                                                                                |
| Sticky Note                 | Sticky Note          | Section 1 marker                                 |                            |                             |                                                                                                |
| Sticky Note1                | Sticky Note          | Section 2 marker                                 |                            |                             |                                                                                                |
| Sticky Note2                | Sticky Note          | Overview and detailed notes                       |                            |                             | ## 🎯 Overview This n8n workflow template automates the process of monitoring Instagram comments and sending predefined responses based on specific comment keywords. It integrates Instagram's Graph API with Google Sheets to manage comment responses and maintains an interaction log for customer relationship management (CRM) purposes. See detailed instructions inside. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node for Instagram POST Events**  
   - Node Name: `Insta Update`  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: `instagram`  
   - Purpose: To receive Instagram comment webhook events.  

2. **Create Switch Node to Filter Comment Events**  
   - Node Name: `Check if update is of comment?`  
   - Type: Switch  
   - Condition:  
     - Check if expression `{{$json.body.entry[0].changes[0].field}}` equals `"comments"`  
   - Connect output “Comment” to next node.

3. **Create If Node to Check Comment Author**  
   - Node Name: `Comment if of other user`  
   - Type: If  
   - Condition:  
     - Expression `{{$json.body.entry[0].id}}` (Instagram account ID)  
     - Does NOT equal `{{$json.body.entry[0].changes[0].value.from.id}}` (comment author ID)  
   - Only continue if condition true.

4. **Create Google Sheets Node to Lookup Reply**  
   - Node Name: `Comment List`  
   - Type: Google Sheets  
   - Operation: Read rows  
   - Document ID: Google Sheet ID for Comment Responses (e.g., `1tQwit0eRrR5N-EoLX4dyXurjEDtthsr97Vny9kaIRdA`)  
   - Sheet Name: `Sheet1` or `gid=0`  
   - Filters:  
     - Column: `Comment`  
     - Lookup Value: First word of comment text converted to lowercase, expression: `{{$json.body.entry[0].changes[0].value.text.split()[0].toLowerCase()}}`  
   - Return first match only.

5. **Create HTTP Request Node to Send Reply**  
   - Node Name: `Send Message for Comment`  
   - Type: HTTP Request  
   - URL: `https://graph.instagram.com/v23.0/{{ $json.body.entry[0].id }}/messages` (Dynamic segment is comment ID)  
   - Method: POST  
   - Body Type: JSON  
   - Body Content:  
     ```json
     {
       "recipient": {
         "id": "{{ $json.body.entry[0].changes[0].value.from.id }}"
       },
       "message": {
         "text": "{{ $json.Message }}"
       }
     }
     ```  
   - Authentication: HTTP Header Auth with Instagram Access Token (create credentials with token)  
   - On Error: Continue workflow to prevent blocking.

6. **Create Google Sheets Node to Log Interaction**  
   - Node Name: `Add Interation in Sheet (CRM)`  
   - Type: Google Sheets  
   - Operation: Append row  
   - Document ID: Same Google Sheet as above  
   - Sheet Name: Interaction Log sheet/tab (e.g., `76673878`)  
   - Columns Mapping:  
     - Time: `{{$json.body.entry[0].time}}`  
     - User Id: `{{$json.body.entry[0].changes[0].value.from.id}}`  
     - Username: `{{$json.body.entry[0].changes[0].value.from.username}}`  
     - Note: `{{$json?.error.message}}` (from previous HTTP Request error if any)  
   - Credentials: Same Google Sheets OAuth2 credential.  

7. **Create Webhook Node for Instagram GET Verification Requests**  
   - Node Name: `Get Verification`  
   - Type: Webhook  
   - HTTP Method: GET (default)  
   - Path: `instagram` (same path as main webhook)  
   - Response Mode: Use Respond to Webhook node.

8. **Create Respond to Webhook Node for Verification Response**  
   - Node Name: `Respond to Verfication Message`  
   - Type: Respond to Webhook  
   - Respond With: Text  
   - Response Body: Expression `={{ $json.query["hub.challenge"] }}`  
   - Connect from `Get Verification` node.

9. **Link Connections**  
   - Connect `Insta Update` → `Check if update is of comment?`  
   - Connect `Check if update is of comment?` (Comment output) → `Comment if of other user`  
   - Connect `Comment if of other user` (true output) → `Comment List`  
   - Connect `Comment List` → `Send Message for Comment`  
   - Connect `Send Message for Comment` → `Add Interation in Sheet (CRM)`  
   - Connect `Get Verification` → `Respond to Verfication Message`

10. **Credential Setup**  
    - Create HTTP Header Auth credential with Instagram Access Token for `Send Message for Comment` node.  
    - Create Google Sheets OAuth2 credential with access to the required Google Sheets document for both Google Sheets nodes.

11. **Google Sheets Setup**  
    - Sheet 1: “Comment Responses” with columns: Comment (keyword), Message (reply text).  
    - Sheet 2: “Interaction List” with columns: Time, User Id, Username, Note.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Context or Link                                                                                                     |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| This workflow requires a Facebook/Meta developer app setup with Instagram Graph API, Facebook Login, and Webhooks configured. Permissions needed include `instagram_basic`, `instagram_manage_comments`, `instagram_manage_messages`, and `pages_show_list`. Generate a User Access Token with these scopes, and keep in mind tokens expire periodically and need refreshing.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Facebook Developers: https://developers.facebook.com/                                                                |
| Webhook URL must be registered in Meta Developer console, subscribing to Instagram object with `comments` field enabled. Verification handled automatically by the workflow’s GET webhook response.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |                                                                                                                     |
| Example Google Sheet structure for comment responses and CRM interaction logs provided in the workflow notes. Sample sheet: https://docs.google.com/spreadsheets/d/1ONPKJZOpQTSxbasVcCB7oBjbZcCyAm9gZ-UNPoXM21A/edit?usp=sharing                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Google Sheets Example                                                                                               |
| Workflow built and maintained by akash@codescale.tech                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Credits                                                                                                              |
| Sticky notes inside the workflow provide detailed overview and setup instructions; refer to these for deeper understanding.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |                                                                                                                     |

---

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

---