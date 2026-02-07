Auto-Moderate Instagram Comments with Perspective API & Slack Alerts

https://n8nworkflows.xyz/workflows/auto-moderate-instagram-comments-with-perspective-api---slack-alerts-10319


# Auto-Moderate Instagram Comments with Perspective API & Slack Alerts

### 1. Workflow Overview

This workflow automates the moderation of Instagram comments by detecting toxic content and taking protective actions. It is designed for Instagram Business Accounts to maintain healthy community engagement and minimize offensive interactions. The workflow periodically polls Instagram posts and comments, analyzes comment toxicity using the Perspective API, and if comments are deemed toxic, it hides them on Instagram, notifies a team via Slack, and logs evidence in a Google Sheet.

Logical blocks:

- **1.1 Scheduled Polling:** Periodically triggers the workflow to fetch recent Instagram posts.
- **1.2 Fetch Comments:** Retrieves comments for each post.
- **1.3 Toxicity Detection:** Sends each comment’s text to the Perspective API to assess toxicity.
- **1.4 Conditional Processing:** If toxicity exceeds threshold, triggers auto-hide, notification, and logging; else ends workflow.
- **1.5 Auto-Defense Actions:** Hides toxic comments, alerts team via Slack, and stores evidence in Google Sheets.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Polling

- **Overview:** This block triggers the workflow at regular intervals (every 15 minutes) to start the moderation process by fetching Instagram posts.
- **Nodes Involved:** Schedule Trigger, Get Instagram Posts
- **Node Details:**

  - **Schedule Trigger**
    - Type: Cron Trigger
    - Role: Initiates workflow execution on a time schedule.
    - Configuration: Defaults to a cron schedule (not explicitly configured here, but sticky note suggests every 15 minutes).
    - Inputs: None (start node)
    - Outputs: Connects to "Get Instagram Posts"
    - Edge Cases: Cron misconfiguration could cause missed runs; rate limits if frequency too high.
  
  - **Get Instagram Posts**
    - Type: HTTP Request
    - Role: Fetches recent media posts from the Instagram Business Account using Graph API.
    - Configuration:
      - URL: `https://graph.facebook.com/v12.0/YOUR_INSTAGRAM_BUSINESS_ACCOUNT_ID/media?access_token=YOUR_INSTAGRAM_ACCESS_TOKEN`
      - Method: GET
      - Authentication: Handled via URL parameter (access token).
    - Inputs: From Schedule Trigger
    - Outputs: Connects to "Get Comments"
    - Edge Cases: Invalid or expired access token; API rate limits; Instagram API version changes could cause breakage.
    - Notes: Requires Instagram Business Account and valid access token from Facebook Developer Portal.

#### 1.2 Fetch Comments

- **Overview:** Retrieves comments for the most recent Instagram post fetched to analyze for toxicity.
- **Nodes Involved:** Get Comments, Loop Over Comments
- **Node Details:**

  - **Get Comments**
    - Type: HTTP Request
    - Role: Fetches comments associated with the latest Instagram post.
    - Configuration:
      - URL is dynamically constructed using the first post’s ID from "Get Instagram Posts".
      - Example URL: `https://graph.facebook.com/v12.0/{post_id}/comments?access_token=YOUR_INSTAGRAM_ACCESS_TOKEN`
      - Method: GET
      - Authentication: Header-based auth with configured credentials.
    - Inputs: From "Get Instagram Posts"
    - Outputs: Connects to "Loop Over Comments"
    - Edge Cases: No posts available (empty data array); invalid post ID; token expiration; paginated comments not handled explicitly.
  
  - **Loop Over Comments**
    - Type: SplitInBatches
    - Role: Processes comments one at a time to individually assess toxicity.
    - Configuration: Batch size = 1
    - Inputs: From "Get Comments"
    - Outputs: Connects to "Detect Toxicity"
    - Edge Cases: Large comment volumes could cause long execution times; empty comments list halts downstream processing.

#### 1.3 Toxicity Detection

- **Overview:** Evaluates each comment’s text for toxicity using Perspective API via an HTTP POST request.
- **Nodes Involved:** Detect Toxicity, IF Toxic
- **Node Details:**

  - **Detect Toxicity**
    - Type: HTTP Request
    - Role: Sends comment text to toxicity detection API and receives toxicity score.
    - Configuration:
      - URL: `https://api.moderatehate.com/v1/toxicity`
      - Method: POST
      - Body: JSON with comment text and requested attribute TOXICITY
      - Uses Perspective API client token (must be provided)
      - Dynamic expression pulls comment text from current item (`{{$json["text"]}}`)
    - Inputs: From "Loop Over Comments"
    - Outputs: Connects to "IF Toxic"
    - Edge Cases: API key incorrect or expired; network timeouts; unexpected API response formats.
  
  - **IF Toxic**
    - Type: If node (conditional)
    - Role: Checks if toxicity score exceeds threshold (0.7).
    - Configuration:
      - Condition: `{{$json["attributeScores"]["TOXICITY"]["summaryScore"]["value"]}} > 0.7`
    - Inputs: From "Detect Toxicity"
    - Outputs:
      - True branch: Connects to "Hide Comment", "Alert Team (Slack)", "Store Evidence (Google Sheet)"
      - False branch: Connects to "End (Non-Toxic Path)"
    - Edge Cases: Missing or malformed toxicity scores; logic errors in expression.

#### 1.4 Auto-Defense Actions (Toxic Path)

- **Overview:** For comments classified as toxic, this block hides the comment on Instagram, alerts the moderation team on Slack, and logs the incident in Google Sheets.
- **Nodes Involved:** Hide Comment, Alert Team (Slack), Store Evidence (Google Sheet)
- **Node Details:**

  - **Hide Comment**
    - Type: HTTP Request
    - Role: Makes a POST request to Instagram API to hide the toxic comment.
    - Configuration:
      - URL dynamically uses comment ID: `https://graph.facebook.com/v12.0/{comment_id}?access_token=YOUR_INSTAGRAM_ACCESS_TOKEN`
      - Body: `{ "hide": true }`
      - Method: POST
    - Inputs: True branch from "IF Toxic"
    - Outputs: None (end node for this branch)
    - Edge Cases: Invalid comment ID; insufficient permissions; token expiration; API rate limits.
  
  - **Alert Team (Slack)**
    - Type: Slack
    - Role: Sends a notification message to a Slack channel with toxic comment details.
    - Configuration:
      - Channel: Configured Slack channel name
      - Message text includes comment text, username, toxicity score, and post ID using dynamic expressions.
      - Requires Slack API credentials configured.
    - Inputs: True branch from "IF Toxic"
    - Outputs: None
    - Edge Cases: Slack API auth failures; invalid channel; message formatting errors.
  
  - **Store Evidence (Google Sheet)**
    - Type: Google Sheets
    - Role: Appends toxic comment details to a configured Google Sheet for auditing.
    - Configuration:
      - Operation: Append
      - Sheet ID: User-supplied Google Sheet ID
      - Range: A:Z (appends to all columns)
      - Requires Google API credentials.
    - Inputs: True branch from "IF Toxic"
    - Outputs: None
    - Edge Cases: Invalid sheet ID; permission errors; API quota exceeded.

#### 1.5 Non-Toxic Path End

- **Overview:** Terminates workflow cleanly for comments that are not toxic.
- **Nodes Involved:** End (Non-Toxic Path)
- **Node Details:**

  - **End (Non-Toxic Path)**
    - Type: Set node
    - Role: No operation; used to explicitly terminate the non-toxic branch.
    - Configuration: Keeps no fields (empty set)
    - Inputs: False branch from "IF Toxic"
    - Outputs: None
    - Edge Cases: None significant; acts as a logical endpoint.

---

### 3. Summary Table

| Node Name             | Node Type            | Functional Role                          | Input Node(s)            | Output Node(s)                          | Sticky Note                                                                                                  |
|-----------------------|----------------------|----------------------------------------|--------------------------|---------------------------------------|--------------------------------------------------------------------------------------------------------------|
| Schedule Trigger       | Cron                 | Periodic trigger to run workflow       | None                     | Get Instagram Posts                   | A Schedule node runs every 15 minutes to poll for new comments (Instagram doesn't natively push notifications easily, so polling is used). You could replace this with a Webhook if you set up Instagram webhooks via Graph API. |
| Get Instagram Posts    | HTTP Request         | Fetch recent Instagram posts            | Schedule Trigger          | Get Comments                         | Uses Instagram Graph API (via HTTP Request) to fetch recent posts and their comments. Assumes you have an Instagram Business Account and a valid access token (from Facebook Developer Portal).                   |
| Get Comments          | HTTP Request          | Fetch comments for a post                | Get Instagram Posts       | Loop Over Comments                   | Uses Instagram Graph API (via HTTP Request) to fetch recent posts and their comments. Assumes you have an Instagram Business Account and a valid access token (from Facebook Developer Portal).                   |
| Loop Over Comments    | SplitInBatches        | Process comments one at a time           | Get Comments              | Detect Toxicity                     |                                                                                                              |
| Detect Toxicity       | HTTP Request          | Send comment text to Perspective API    | Loop Over Comments        | IF Toxic                           | For each comment, it sends the text to Google's Perspective API (a free toxicity detection API; sign up at https://perspectiveapi.com/ for an API key). Threshold for "toxic" is set to >0.7 toxicity score (configurable). |
| IF Toxic              | If                    | Check if comment toxicity exceeds threshold | Detect Toxicity           | Hide Comment, Alert Team (Slack), Store Evidence (Google Sheet), End (Non-Toxic Path) |                                                                                                              |
| Hide Comment          | HTTP Request          | Hide toxic comment on Instagram          | IF Toxic (true)           | None                              | **Auto-Hide Offensive Ones**: If toxic, uses Instagram API to hide the comment.                             |
| Alert Team (Slack)    | Slack                 | Send Slack alert for toxic comment       | IF Toxic (true)           | None                              | **Alert Team**: Sends a Slack notification (or email; configurable) with details.                           |
| Store Evidence (Google Sheet) | Google Sheets  | Log toxic comment details for auditing   | IF Toxic (true)           | None                              | **Store Evidence**: Appends the toxic comment details (text, user, score, timestamp) to a Google Sheet for auditing. |
| End (Non-Toxic Path)  | Set                   | Workflow endpoint for non-toxic comments | IF Toxic (false)          | None                              |                                                                                                              |
| Webhook               | Webhook               | Alternative trigger to start workflow    | None                     | Get Instagram Posts                 |                                                                                                              |
| Sticky Note           | Sticky Note           | Documentation note                       | None                     | None                              | A Schedule node runs every 15 minutes to poll for new comments (Instagram doesn't natively push notifications easily, so polling is used). You could replace this with a Webhook if you set up Instagram webhooks via Graph API. |
| Sticky Note1          | Sticky Note           | Documentation note                       | None                     | None                              | Uses Instagram Graph API (via HTTP Request) to fetch recent posts and their comments. Assumes you have an Instagram Business Account and a valid access token (from Facebook Developer Portal).                   |
| Sticky Note2          | Sticky Note           | Documentation note                       | None                     | None                              | For each comment, it sends the text to Google's Perspective API (a free toxicity detection API; sign up at https://perspectiveapi.com/ for an API key). Threshold for "toxic" is set to >0.7 toxicity score (configurable). |
| Sticky Note3          | Sticky Note           | Documentation note                       | None                     | None                              | **Auto-Hide Offensive Ones**: If toxic, uses Instagram API to hide the comment. **Alert Team**: Sends a Slack notification (or email; configurable) with details. **Store Evidence**: Appends the toxic comment details (text, user, score, timestamp) to a Google Sheet for auditing. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Cron Trigger node ("Schedule Trigger")**
   - Set to run every 15 minutes (e.g., cron expression: `*/15 * * * *`).
   - This triggers the workflow periodically.

2. **Add an HTTP Request node ("Get Instagram Posts")**
   - Connect from "Schedule Trigger".
   - Configure:
     - Method: GET
     - URL: `https://graph.facebook.com/v12.0/YOUR_INSTAGRAM_BUSINESS_ACCOUNT_ID/media?access_token=YOUR_INSTAGRAM_ACCESS_TOKEN`
     - Replace placeholders with your Instagram Business Account ID and Access Token.
   - No authentication node (token in URL).
   - Returns recent media posts.

3. **Add an HTTP Request node ("Get Comments")**
   - Connect from "Get Instagram Posts".
   - Configure:
     - Method: GET
     - URL as expression: `https://graph.facebook.com/v12.0/{{$node["Get Instagram Posts"].json["data"][0]["id"]}}/comments?access_token=YOUR_INSTAGRAM_ACCESS_TOKEN`
     - Replace access token accordingly.
   - Authentication: Use HTTP Header Authentication credentials or token in URL.
   - Fetches comments for the latest post.

4. **Add a SplitInBatches node ("Loop Over Comments")**
   - Connect from "Get Comments".
   - Set Batch Size to 1.
   - This processes comments one by one.

5. **Add an HTTP Request node ("Detect Toxicity")**
   - Connect from "Loop Over Comments".
   - Configure:
     - Method: POST
     - URL: `https://api.moderatehate.com/v1/toxicity`
     - Body parameters (JSON):
       ```json
       {
         "comment": { "text": "{{$json[\"text\"]}}" },
         "requestedAttributes": { "TOXICITY": {} },
         "clientToken": "YOUR_PERSPECTIVE_API_KEY"
       }
       ```
     - Enable "JSON/RAW Parameters".
   - Replace `"YOUR_PERSPECTIVE_API_KEY"` with your actual API key.
   - Content-Type: application/json.

6. **Add an If node ("IF Toxic")**
   - Connect from "Detect Toxicity".
   - Set condition:
     - Type: Number
     - Operation: Greater than
     - Value 1: Expression `{{$json["attributeScores"]["TOXICITY"]["summaryScore"]["value"]}}`
     - Value 2: 0.7 (toxicity threshold)
   - True branch: toxic comment path.
   - False branch: non-toxic path.

7. **Add an HTTP Request node ("Hide Comment")**
   - Connect True branch from "IF Toxic".
   - Configure:
     - Method: POST
     - URL as expression: `https://graph.facebook.com/v12.0/{{$json["id"]}}?access_token=YOUR_INSTAGRAM_ACCESS_TOKEN`
     - Body JSON: `{ "hide": true }`
   - Hides the toxic comment on Instagram.

8. **Add a Slack node ("Alert Team (Slack)")**
   - Connect True branch from "IF Toxic".
   - Configure:
     - Channel: your Slack channel name.
     - Text (expression):
       ```
       Toxic Comment Detected!
       Text: {{$json["text"]}}
       User: {{$json["username"]}}
       Toxicity Score: {{$node["Detect Toxicity"].json["attributeScores"]["TOXICITY"]["summaryScore"]["value"]}}
       Post ID: {{$node["Get Instagram Posts"].json["data"][0]["id"]}}
       ```
   - Configure Slack API credentials with OAuth or token.

9. **Add a Google Sheets node ("Store Evidence (Google Sheet)")**
   - Connect True branch from "IF Toxic".
   - Configure:
     - Operation: Append
     - Sheet ID: your Google Sheet ID for evidence.
     - Range: A:Z
     - Map fields to columns as needed (comment text, username, toxicity score, timestamp).
   - Authenticate with Google API credentials.

10. **Add a Set node ("End (Non-Toxic Path)")**
    - Connect False branch from "IF Toxic".
    - Configure to keep no fields (empty set).
    - Marks workflow end for non-toxic comments.

11. **Optional: Add Webhook node ("Webhook")**
    - Configure path, e.g., `/your-webhook-path`.
    - Connect output to "Get Instagram Posts".
    - This allows triggering workflow via HTTP instead of schedule.

12. **Add Sticky Notes for documentation**
    - Add notes explaining key parts:
      - Polling method (Schedule vs Webhook).
      - Instagram Graph API usage.
      - Perspective API usage and toxicity threshold.
      - Auto-hide, alert, and evidence storage actions.

13. **Credentials Setup**
    - Instagram Access Token: Generated from Facebook Developer Portal for Instagram Business account.
    - Slack API credentials: OAuth token with chat:write scope.
    - Google API credentials: OAuth or Service Account with Google Sheets API enabled.
    - Perspective API key: Sign up at https://perspectiveapi.com/.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                 | Context or Link                                                                                  |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Instagram Graph API requires a Business Account and a valid access token with appropriate permissions to fetch posts and comments.                          | https://developers.facebook.com/docs/instagram-api/                                           |
| Perspective API is a free toxicity detection API by Google; sign up for an API key at https://perspectiveapi.com/.                                          | https://perspectiveapi.com/                                                                    |
| Instagram API does not natively support comment webhooks easily, so the workflow uses polling every 15 minutes by default. Can be replaced with Webhook.     | Sticky note in workflow                                                                        |
| Toxicity threshold is configurable in the IF node; adjust based on tolerance for false positives/negatives.                                                  | Workflow configuration                                                                         |
| Slack notifications help keep moderators informed in real-time of toxic comments for quick action or review.                                                 | Slack API documentation: https://api.slack.com/messaging/webhooks                              |
| Google Sheets storage provides an audit trail of toxic comments for compliance or review purposes.                                                           | Google Sheets API documentation: https://developers.google.com/sheets/api                     |
| Ensure tokens and API keys are kept secure and refreshed as needed to avoid authentication failures.                                                        | Security best practices                                                                        |

---

**Disclaimer:**  
The text provided is exclusively derived from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All handled data is legal and public.