Automate LINE & Google Account Linking with OAuth2 Authentication

https://n8nworkflows.xyz/workflows/automate-line---google-account-linking-with-oauth2-authentication-10950


# Automate LINE & Google Account Linking with OAuth2 Authentication

---

### 1. Workflow Overview

This workflow automates the linking of a user's LINE Official Account (LINE OA) with their Google Account using OAuth2 authentication. It is designed for scenarios where a LINE OA wants to offer seamless Google account integration to new followers, enabling personalized services or features that require Google user data.

The workflow consists of two main logical blocks:

**1.1 LINE Follow Event & Authentication Initiation**  
Triggered when a user adds the LINE OA as a friend (follow event). This block generates a unique Google OAuth2 authorization URL embedding the LINE user ID as state, then sends a welcome message with the Google Auth link via LINE to the user. This securely initiates the account linking process.

**1.2 Google OAuth2 Callback & Account Linking Completion**  
Triggered when Google redirects back with an authorization code after the user consents. This block exchanges the code for an access token, retrieves the Google user profile, sends a confirmation message to the user on LINE, and finally redirects the user’s browser to the LINE OA page, completing the linking cycle.

---

### 2. Block-by-Block Analysis

#### 2.1 Block: LINE Follow Event & Authentication Initiation

- **Overview:**  
  Listens for LINE webhook events, filters for the "follow" event, constructs a Google authorization URL with the LINE user ID embedded, and replies to the user with a welcome message and an authentication link.

- **Nodes Involved:**  
  - LINE Webhook  
  - If Follow Event  
  - Create Google Auth URL  
  - Send Auth Link to LINE  
  - Sticky Note (documentation)

- **Node Details:**

  - **LINE Webhook**  
    - *Type:* Webhook (HTTP POST listener)  
    - *Config:* Listens on path `YOUR_WEBHOOK_PATH_FOR_LINE` for POST requests from LINE platform.  
    - *Inputs:* External HTTP POST from LINE platform.  
    - *Outputs:* Passes webhook data downstream.  
    - *Edge Cases:* Missing or malformed webhook payload; webhook not registered correctly in LINE Developer console.  
    - *Notes:* Serves as the entry point for LINE events.

  - **If Follow Event**  
    - *Type:* If (conditional filter)  
    - *Config:* Checks if the first event's type equals "follow".  
    - *Expression:* `{{$json.body.events[0].type}} === 'follow'`  
    - *Inputs:* From LINE Webhook.  
    - *Outputs:* Continues only if condition true.  
    - *Edge Cases:* Multiple events in payload; only first event checked; may miss other event types.  
    - *Failure Modes:* Expression errors if input structure changes.

  - **Create Google Auth URL**  
    - *Type:* Set (variable assignment)  
    - *Config:* Constructs Google OAuth2 authorization URL with:  
      - scope: `email profile`  
      - access_type: `offline` for refresh tokens  
      - response_type: `code`  
      - state: LINE user ID (`{{$json.body.events[0].source.userId}}`)  
      - redirect_uri: `YOUR_N8N_WEBHOOK_URL_FOR_GOOGLE` (callback endpoint)  
      - client_id: `YOUR_GOOGLE_CLIENT_ID`  
    - *Outputs:* JSON with `googleAuthUrl` string.  
    - *Edge Cases:* URL encoding errors; missing or incorrect client_id or redirect_uri cause OAuth failure.

  - **Send Auth Link to LINE**  
    - *Type:* HTTP Request  
    - *Config:*  
      - Method: POST  
      - URL: `https://api.line.me/v2/bot/message/reply`  
      - Auth: Header Auth using LINE Channel Access Token credential  
      - Body JSON: Sends two text messages: a welcome and a Google Auth link (from previous node).  
      - Uses replyToken from webhook payload for proper reply.  
    - *Inputs:* From Create Google Auth URL node.  
    - *Outputs:* None (end of this block).  
    - *Edge Cases:* Authentication failure if token invalid; network timeout; replyToken expiry.  
    - *Failure Modes:* 400/401 errors if token expired or malformed.

---

#### 2.2 Block: Google OAuth2 Callback & Account Linking Completion

- **Overview:**  
  Receives the authorization code from Google OAuth2 callback, exchanges it for an access token, fetches user info, sends a confirmation message to the user on LINE, and redirects the browser to the LINE OA page.

- **Nodes Involved:**  
  - Google Auth Callback (Webhook)  
  - Get Google Access Token  
  - Get Google User Info  
  - Send Completion Message to LINE  
  - Redirect to LINE OA  
  - Sticky Note (documentation)

- **Node Details:**

  - **Google Auth Callback**  
    - *Type:* Webhook (HTTP listener)  
    - *Config:* Listens on path `YOUR_WEBHOOK_PATH_FOR_GOOGLE` for GET or POST; configured to respond via response node.  
    - *Inputs:* Redirect from Google OAuth2 after user consent with query parameters including `code` and `state`.  
    - *Outputs:* Passes query parameters downstream.  
    - *Edge Cases:* Missing or invalid `code`; user denies consent; URL mismatch causing 400 errors.

  - **Get Google Access Token**  
    - *Type:* HTTP Request (POST)  
    - *Config:*  
      - URL: `https://oauth2.googleapis.com/token`  
      - Method: POST  
      - Body (JSON):  
        - code: from webhook query param `code`  
        - client_id: YOUR_GOOGLE_CLIENT_ID  
        - client_secret: YOUR_GOOGLE_CLIENT_SECRET  
        - redirect_uri: YOUR_N8N_WEBHOOK_URL_FOR_GOOGLE  
        - grant_type: authorization_code  
      - Sends JSON body.  
    - *Inputs:* From Google Auth Callback.  
    - *Outputs:* Google access token and refresh token data.  
    - *Edge Cases:* Expired or invalid code; rate limiting; incorrect client_secret or redirect_uri mismatch.

  - **Get Google User Info**  
    - *Type:* HTTP Request (GET)  
    - *Config:*  
      - URL: `https://www.googleapis.com/oauth2/v2/userinfo`  
      - Auth: Header Auth with Bearer token from access token obtained earlier.  
    - *Inputs:* From Get Google Access Token (requires access token setup in auth header).  
    - *Outputs:* Google user profile JSON (email, name, etc.).  
    - *Edge Cases:* Token expired; insufficient scope; network errors.

  - **Send Completion Message to LINE**  
    - *Type:* HTTP Request (POST)  
    - *Config:*  
      - URL: `https://api.line.me/v2/bot/message/push`  
      - Auth: Header Auth with LINE Channel Access Token  
      - Body JSON:  
        - `to`: userId retrieved from `state` query param (LINE user ID stored in OAuth state)  
        - `messages`: text confirming linking completion and displaying user email  
    - *Inputs:* From Get Google User Info.  
    - *Outputs:* None (end of block).  
    - *Edge Cases:* Invalid userId; message quota exceeded; authentication failure.

  - **Redirect to LINE OA**  
    - *Type:* Respond to Webhook (HTTP 302 redirect)  
    - *Config:*  
      - Redirect URL: `https://line.me/R/ti/p/@YOUR_LINE_OFFICIAL_ACCOUNT_ID`  
      - Response code: 302  
    - *Inputs:* From Send Completion Message to LINE node.  
    - *Outputs:* HTTP redirect response to user’s browser.  
    - *Edge Cases:* Broken or incorrect LINE OA ID; user agent not following redirect.

---

### 3. Summary Table

| Node Name               | Node Type               | Functional Role                         | Input Node(s)           | Output Node(s)            | Sticky Note                                                   |
|-------------------------|-------------------------|---------------------------------------|------------------------|---------------------------|---------------------------------------------------------------|
| LINE Webhook            | Webhook                 | Entry point for LINE events            | (external HTTP POST)    | If Follow Event            | Workflow 1: LINE Follow Event & Authentication Start           |
| If Follow Event         | If                      | Filter for LINE "follow" event         | LINE Webhook            | Create Google Auth URL     | Workflow 1: LINE Follow Event & Authentication Start           |
| Create Google Auth URL  | Set                     | Generate Google OAuth2 authorization URL | If Follow Event         | Send Auth Link to LINE     | Workflow 1: LINE Follow Event & Authentication Start           |
| Send Auth Link to LINE  | HTTP Request            | Reply to user with Google Auth link    | Create Google Auth URL  | (end)                     | Workflow 1: LINE Follow Event & Authentication Start           |
| Google Auth Callback    | Webhook                 | Receives Google OAuth2 callback        | (external HTTP GET/POST)| Get Google Access Token    | Workflow 2: Google Auth Callback & Linking Completion          |
| Get Google Access Token | HTTP Request            | Exchange auth code for access token    | Google Auth Callback    | Get Google User Info       | Workflow 2: Google Auth Callback & Linking Completion          |
| Get Google User Info    | HTTP Request            | Fetch Google user profile data          | Get Google Access Token | Send Completion Message to LINE | Workflow 2: Google Auth Callback & Linking Completion          |
| Send Completion Message to LINE | HTTP Request     | Send confirmation message on LINE      | Get Google User Info    | Redirect to LINE OA        | Workflow 2: Google Auth Callback & Linking Completion          |
| Redirect to LINE OA     | Respond to Webhook (Redirect) | Redirect user to LINE OA page          | Send Completion Message to LINE | (end)               | Workflow 2: Google Auth Callback & Linking Completion          |
| Sticky Note             | Sticky Note             | Documentation block for Workflow 1     | -                      | -                         |                                                               |
| Sticky Note1            | Sticky Note             | Documentation block for Workflow 2     | -                      | -                         |                                                               |
| Sticky Note2            | Sticky Note             | Overall Workflow documentation & prerequisites | -                  | -                         |                                                               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node "LINE Webhook":**  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: `YOUR_WEBHOOK_PATH_FOR_LINE` (e.g., `/line-webhook`)  
   - Purpose: Receive LINE platform webhook events.

2. **Create If Node "If Follow Event":**  
   - Type: If  
   - Condition: Check if `{{$json.body.events[0].type}}` equals `"follow"`  
   - Connect input from "LINE Webhook" output.

3. **Create Set Node "Create Google Auth URL":**  
   - Type: Set  
   - Add field `googleAuthUrl` (string) with expression:  
     ```
     =https://accounts.google.com/o/oauth2/v2/auth?scope=email%20profile&access_type=offline&response_type=code&state={{ $json.body.events[0].source.userId }}&redirect_uri=YOUR_N8N_WEBHOOK_URL_FOR_GOOGLE&client_id=YOUR_GOOGLE_CLIENT_ID
     ```  
   - Connect input from "If Follow Event" (true branch).

4. **Create HTTP Request Node "Send Auth Link to LINE":**  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://api.line.me/v2/bot/message/reply`  
   - Authentication: Header Auth credential (LINE Channel Access Token)  
   - Body (JSON):  
     ```json
     {
       "replyToken": "{{ $json.body.events[0].replyToken }}",
       "messages": [
         {
           "type": "text",
           "text": "友だち追加ありがとうございます！\nまずはGoogleアカウントと連携して、すべての機能を使えるようにしましょう。"
         },
         {
           "type": "text",
           "text": "連携はこちらのリンクからお願いします👇\n{{ $json.googleAuthUrl }}"
         }
       ]
     }
     ```  
   - Connect input from "Create Google Auth URL".

5. **Create Webhook Node "Google Auth Callback":**  
   - Type: Webhook  
   - HTTP Method: GET or POST (depending on Google config)  
   - Path: `YOUR_WEBHOOK_PATH_FOR_GOOGLE` (e.g., `/google-auth-callback`)  
   - Response Mode: Response Node  
   - Purpose: Receive Google OAuth2 redirect with code.

6. **Create HTTP Request Node "Get Google Access Token":**  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://oauth2.googleapis.com/token`  
   - Body (JSON):  
     ```json
     {
       "code": "{{ $json.query.code }}",
       "client_id": "YOUR_GOOGLE_CLIENT_ID",
       "client_secret": "YOUR_GOOGLE_CLIENT_SECRET",
       "redirect_uri": "YOUR_N8N_WEBHOOK_URL_FOR_GOOGLE",
       "grant_type": "authorization_code"
     }
     ```  
   - Connect input from "Google Auth Callback".

7. **Create HTTP Request Node "Get Google User Info":**  
   - Type: HTTP Request  
   - Method: GET  
   - URL: `https://www.googleapis.com/oauth2/v2/userinfo`  
   - Authentication: Header Auth with Bearer Token — set token dynamically from "Get Google Access Token" (`access_token`)  
   - Connect input from "Get Google Access Token".

8. **Create HTTP Request Node "Send Completion Message to LINE":**  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://api.line.me/v2/bot/message/push`  
   - Authentication: Header Auth credential (LINE Channel Access Token)  
   - Body (JSON):  
     ```json
     {
       "to": "{{ $json.query.state }}",
       "messages": [
         {
           "type": "text",
           "text": "Googleアカウントとの連携が完了しました！\nありがとうございます。\n\nアカウント情報\n{{ $json.email }}"
         }
       ]
     }
     ```  
   - Connect input from "Get Google User Info".

9. **Create Respond to Webhook Node "Redirect to LINE OA":**  
   - Type: Respond to Webhook  
   - Response Code: 302  
   - Redirect URL: `https://line.me/R/ti/p/@YOUR_LINE_OFFICIAL_ACCOUNT_ID`  
   - Connect input from "Send Completion Message to LINE".

10. **Set Up Credentials:**

    - **LINE Channel Access Token Credential:**  
      Create a Header Auth credential with header key `Authorization` and value `Bearer YOUR_LINE_CHANNEL_ACCESS_TOKEN`.

    - **Google OAuth2 Client Credentials:**  
      Store client ID and secret securely; used in HTTP Request nodes.

11. **Update Placeholder Values:**

    - Replace `YOUR_LINE_OFFICIAL_ACCOUNT_ID` with your actual LINE OA ID.  
    - Replace `YOUR_N8N_WEBHOOK_URL_FOR_GOOGLE` and `YOUR_WEBHOOK_PATH_FOR_LINE` with your actual n8n webhook URLs.  
    - Replace `YOUR_GOOGLE_CLIENT_ID` and `YOUR_GOOGLE_CLIENT_SECRET` with Google OAuth credentials.

12. **Activate Workflow:**

    - Ensure all nodes are connected as above.  
    - Activate the workflow to respond live to LINE and Google OAuth events.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                 | Context or Link                                                                                                                     |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------|
| This workflow automates LINE and Google account linking using OAuth2. It requires prior setup in LINE Developers Console and Google Cloud Platform, including OAuth credentials and webhook URLs.                                           | Provided in Sticky Note2 documentation within the workflow.                                                                         |
| Ensure your Google OAuth consent screen is configured with scopes for `email` and `profile` and that your redirect URI matches the webhook URL in n8n.                                                                                     | Google Cloud Platform OAuth2 setup guidelines.                                                                                      |
| LINE Developer Console must have the webhook URL set to the `LINE Webhook` node’s URL; the channel access token must be long-lived and configured in n8n credentials.                                                                       | LINE Developers Console docs: https://developers.line.biz/en/docs/messaging-api/overview/                                           |
| The workflow uses OAuth2 `state` parameter to securely pass the LINE user ID through the Google OAuth flow to ensure the confirmation message is sent to the correct user.                                                                  | OAuth2 best practices for state parameter usage.                                                                                     |
| For troubleshooting, monitor HTTP request responses, especially for token exchange and LINE message API calls, to detect authentication errors or rate limits.                                                                              | n8n execution logs and HTTP request node debug output.                                                                              |
| Video explanation and setup guide available at: https://n8n.io/workflows/line-google-account-linking                                                                                                                                          | n8n official workflows repository.                                                                                                  |

---

**Disclaimer:** The provided text originates exclusively from an n8n automated workflow. The process follows current content policies and contains no illegal, offensive, or protected elements. All manipulated data is legal and public.

---