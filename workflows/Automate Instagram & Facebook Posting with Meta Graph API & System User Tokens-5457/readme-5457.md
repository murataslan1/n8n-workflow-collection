Automate Instagram & Facebook Posting with Meta Graph API & System User Tokens

https://n8nworkflows.xyz/workflows/automate-instagram---facebook-posting-with-meta-graph-api---system-user-tokens-5457


# Automate Instagram & Facebook Posting with Meta Graph API & System User Tokens

### 1. Workflow Overview

This workflow automates posting images with captions to Instagram and Facebook using the Meta Graph API and System User Tokens. It targets social media managers or automation engineers who want to schedule or manually trigger posts to Instagram Business accounts and Facebook Pages via n8n.

The workflow is logically divided into two main functional blocks:

- **1.1 Token Management & Refresh:** Handles obtaining, refreshing, and storing Facebook/Instagram access tokens, including both short-lived user tokens and permanent system user tokens. It includes scheduled refresh logic and static data storage for token persistence.

- **1.2 Social Media Posting:** Uses the valid tokens to post images and captions to Instagram and Facebook. It supports posting via manual trigger or using tokens refreshed/stored by the first block. Posting to Instagram includes creating media objects and subsequently publishing them after a delay. Posting to Facebook uses direct photo uploads.

Additional supporting nodes provide detailed user guidance in sticky notes for token generation and usage best practices.

---

### 2. Block-by-Block Analysis

#### 2.1 Token Management & Refresh

**Overview:**  
This block manages Facebook and Instagram access tokens, including generating short-lived tokens, exchanging them for long-lived tokens, saving tokens in static data, and refreshing them on a schedule. It uses both user tokens and permanent system user tokens for authentication.

**Nodes Involved:**  
- Schedule Trigger  
- Get Current Token  
- Refresh token  
- Push to Static Data  
- Get Token from static Data  
- Sticky Note (token generation instructions)  
- Sticky Note1 (token longevity notes)  
- Sticky Note4 (permanent system user token instructions)

**Node Details:**

- **Schedule Trigger**  
  - Type: Schedule Trigger  
  - Role: Triggers token refresh every 30 days at 01:00 AM  
  - Configuration: Interval set to every 30 days, trigger hour 1  
  - Inputs: None (trigger node)  
  - Outputs: Connects to "Get Current Token"  
  - Edge cases: Missed runs if n8n is offline at trigger time

- **Get Current Token**  
  - Type: Code (JavaScript)  
  - Role: Retrieves current Facebook token from workflow static data storage (global)  
  - Key expression: `$getWorkflowStaticData('global')`, returns token as JSON property  
  - Inputs: From Schedule Trigger  
  - Outputs: To "Refresh token"  
  - Edge cases: Empty or expired token in static data can cause failures downstream

- **Refresh token**  
  - Type: HTTP Request  
  - Role: Exchanges a short-lived token for a long-lived token using Facebook OAuth endpoint  
  - Configuration:  
    - URL: `https://graph.facebook.com/v19.0/oauth/access_token`  
    - Method: GET with query parameters including `grant_type=fb_exchange_token`, client ID, secret, and short token  
    - Authentication: Predefined Facebook Graph API credential  
  - Inputs: From "Get Current Token"  
  - Outputs: To "Push to Static Data"  
  - Edge cases: Invalid client ID/secret, expired short token, network errors

- **Push to Static Data**  
  - Type: Code (JavaScript)  
  - Role: Saves the refreshed long-lived token into workflow static data for persistent use  
  - Key expression: `staticData.fb_token = $json.access_token`  
  - Inputs: From "Refresh token"  
  - Outputs: None (end node)  
  - Edge cases: Write permission issues or static data corruption

- **Get Token from static Data**  
  - Type: Code (JavaScript)  
  - Role: Reads the token from static data for use in posting requests  
  - Key expression: Same as "Get Current Token"  
  - Inputs: From external nodes that trigger posting  
  - Outputs: To "Post to Instagram1" and "Use System token to get page token1"  
  - Edge cases: Missing token in static data

- **Sticky Note** (token generation instructions)  
  - Type: Sticky Note  
  - Role: Provides detailed step-by-step instructions on generating a Facebook short-lived access token for Instagram and Facebook posting  
  - Content: Covers app creation, permission scopes, Graph API Explorer usage, and token copying  
  - Position: Prominently placed for user reference

- **Sticky Note1** (token longevity notes)  
  - Type: Sticky Note  
  - Role: Advises about token expiration limitations and workarounds for testing tokens lasting up to two months  
  - Content: Notes about static data behavior and token refresh scheduling

- **Sticky Note4** (permanent system user token instructions)  
  - Type: Sticky Note  
  - Role: Explains how to create a permanent system user token, including business verification, system user creation, token generation with never expire setting, and required permissions  
  - Content: Recommended production approach for stable automation

---

#### 2.2 Social Media Posting

**Overview:**  
This block executes the actual posting of images and captions to Instagram and Facebook Pages. It supports manual triggering and uses the tokens managed by the first block. Instagram posting is two-step: media creation then publishing. Facebook posting uses photo uploads.

**Nodes Involved:**  
- When clicking ‘Execute workflow’ (manual trigger)  
- Post to Instagram  
- Wait 2 Second  
- Publish instagram post  
- Use System token to get page token  
- Get Correct Page Token  
- Post to Facebook  
- Get Token from static Data  
- Post to Instagram1  
- Wait 2 Second1  
- Publish instagram post1  
- Use System token to get page token1  
- Get Correct Page Token1  
- Post to Facebook1  
- Sticky Note3 (token usage note)

**Node Details:**

- **When clicking ‘Execute workflow’**  
  - Type: Manual Trigger  
  - Role: Entry point for manual posting trigger  
  - Outputs: To "Post to Instagram"  
  - Edge cases: No input data; must be manually triggered

- **Post to Instagram**  
  - Type: HTTP Request  
  - Role: Creates an Instagram media object (image + caption) on Instagram Graph API  
  - Configuration:  
    - URL: `https://graph.facebook.com/v19.0/<YOUR PAGE ID HERE>/media`  
    - Method: POST  
    - Content Type: form-urlencoded  
    - Body parameters: `image_url`, `caption` (placeholders to be replaced by user)  
    - Authentication: Facebook Graph API credentials (System User token)  
  - Inputs: From manual trigger  
  - Outputs: To "Wait 2 Second"  
  - Edge cases: Invalid image URL, permission errors, token issues

- **Wait 2 Second**  
  - Type: Wait  
  - Role: Delays for 2 seconds before publishing to ensure media object creation is processed  
  - Inputs: From "Post to Instagram"  
  - Outputs: To "Publish instagram post"  
  - Edge cases: Delay too short may cause failure to publish

- **Publish instagram post**  
  - Type: HTTP Request  
  - Role: Publishes the previously created Instagram media object using its ID  
  - Configuration:  
    - URL: `https://graph.facebook.com/v19.0/17841404935066235/media_publish` (Instagram Business Account ID hardcoded)  
    - Method: POST  
    - Body parameter: `creation_id` from previous node output `$json.id`  
    - Authentication: Facebook Graph API credentials  
  - Inputs: From "Wait 2 Second"  
  - Outputs: To "Use System token to get page token"  
  - Edge cases: Invalid or expired creation ID, token permissions, timeout

- **Use System token to get page token**  
  - Type: HTTP Request  
  - Role: Retrieves Facebook Page access tokens using the system user token  
  - Configuration:  
    - URL: `https://graph.facebook.com/v19.0/me/accounts`  
    - Authentication: Facebook Graph API credentials  
  - Inputs: From "Publish instagram post"  
  - Outputs: To "Get Correct Page Token"  
  - Edge cases: Token permissions, network errors

- **Get Correct Page Token**  
  - Type: Code (JavaScript)  
  - Role: Extracts the precise page access token for the target Facebook Page by filtering the list  
  - Key expression: Finds the page with ID `266271423823110` and returns its access token  
  - Inputs: From "Use System token to get page token"  
  - Outputs: To "Post to Facebook"  
  - Edge cases: Page ID mismatch, empty data array

- **Post to Facebook**  
  - Type: HTTP Request  
  - Role: Posts a photo with caption to Facebook Page using the page access token  
  - Configuration:  
    - Method: POST  
    - URL: `https://graph.facebook.com/v19.0/266271423823110/photos`  
    - Body parameters: static image URL, caption, page access token  
    - Authentication: Facebook Graph API credentials  
  - Inputs: From "Get Correct Page Token"  
  - Outputs: End node (no further connections)  
  - Edge cases: Invalid image URL, token expiration, permission errors

- **Get Token from static Data**  
  - Type: Code (JavaScript)  
  - Role: Retrieves token from static data for posting flow triggered by schedule or other triggers  
  - Inputs: External trigger node  
  - Outputs: To "Post to Instagram1" and "Use System token to get page token1"  
  - Edge cases: Missing or invalid token

- **Post to Instagram1**  
  - Type: HTTP Request  
  - Role: Same as "Post to Instagram" but uses token from static data instead of credential authentication  
  - Configuration: Same as above but includes `access_token` parameter set from token in static data  
  - Inputs: From "Get Token from static Data"  
  - Outputs: To "Wait 2 Second1"  
  - Edge cases: Token expiry, invalid parameters

- **Wait 2 Second1**  
  - Type: Wait  
  - Role: Delay before publishing Instagram post  
  - Inputs: From "Post to Instagram1"  
  - Outputs: To "Publish instagram post1"  
  - Edge cases: Same as above

- **Publish instagram post1**  
  - Type: HTTP Request  
  - Role: Publishes Instagram media object using creation ID and token from static data  
  - Configuration: Similar to "Publish instagram post" but uses token from static data expression  
  - Inputs: From "Wait 2 Second1"  
  - Outputs: To "Use System token to get page token1"  
  - Edge cases: Token or ID invalid

- **Use System token to get page token1**  
  - Type: HTTP Request  
  - Role: Retrieves page tokens with token from static data via `me/accounts` endpoint  
  - Inputs: From "Publish instagram post1"  
  - Outputs: To "Get Correct Page Token1"  
  - Edge cases: Same as above

- **Get Correct Page Token1**  
  - Type: Code (JavaScript)  
  - Role: Filters Facebook Page token by page ID placeholder `<YOUR PAGE ID HERE>` from response  
  - Inputs: From "Use System token to get page token1"  
  - Outputs: To "Post to Facebook1"  
  - Edge cases: Page ID mismatch

- **Post to Facebook1**  
  - Type: HTTP Request  
  - Role: Posts photo to Facebook Page using token from page token retrieval  
  - Configuration: Similar to "Post to Facebook" but uses token from previous node  
  - Inputs: From "Get Correct Page Token1"  
  - Outputs: End node  
  - Edge cases: Same as above

- **Sticky Note3**  
  - Type: Sticky Note  
  - Role: Notes the use of permanent never-expire token for posting  
  - Positioned near posting nodes for user awareness

---

### 3. Summary Table

| Node Name                     | Node Type           | Functional Role                                       | Input Node(s)                        | Output Node(s)                         | Sticky Note                                                                                                                         |
|-------------------------------|---------------------|------------------------------------------------------|------------------------------------|---------------------------------------|------------------------------------------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger       | Manual entry trigger for posting flow                 | -                                  | Post to Instagram                     |                                                                                                                                    |
| Post to Instagram              | HTTP Request        | Creates Instagram media object                         | When clicking ‘Execute workflow’   | Wait 2 Second                        |                                                                                                                                    |
| Wait 2 Second                 | Wait                | Delay before publishing Instagram post                 | Post to Instagram                  | Publish instagram post                |                                                                                                                                    |
| Publish instagram post         | HTTP Request        | Publishes Instagram media using creation ID            | Wait 2 Second                     | Use System token to get page token   |                                                                                                                                    |
| Use System token to get page token | HTTP Request        | Retrieves Facebook Page tokens for system user          | Publish instagram post             | Get Correct Page Token                |                                                                                                                                    |
| Get Correct Page Token         | Code (JavaScript)   | Filters page access token for specific Facebook Page    | Use System token to get page token | Post to Facebook                     |                                                                                                                                    |
| Post to Facebook               | HTTP Request        | Posts photo to Facebook Page                             | Get Correct Page Token             | -                                     |                                                                                                                                    |
| Get Token from static Data     | Code (JavaScript)   | Retrieves Facebook token from static data                | -                                  | Post to Instagram1, Use System token to get page token1 |                                                                                                                                    |
| Post to Instagram1             | HTTP Request        | Creates Instagram media object using token from static data | Get Token from static Data         | Wait 2 Second1                      |                                                                                                                                    |
| Wait 2 Second1                | Wait                | Delay before publishing Instagram post                 | Post to Instagram1                 | Publish instagram post1              |                                                                                                                                    |
| Publish instagram post1        | HTTP Request        | Publishes Instagram media using token from static data   | Wait 2 Second1                    | Use System token to get page token1  |                                                                                                                                    |
| Use System token to get page token1 | HTTP Request        | Retrieves Facebook Page tokens using token from static data | Publish instagram post1            | Get Correct Page Token1               |                                                                                                                                    |
| Get Correct Page Token1        | Code (JavaScript)   | Filters page token for Facebook Page by page ID          | Use System token to get page token1 | Post to Facebook1                   |                                                                                                                                    |
| Post to Facebook1              | HTTP Request        | Posts photo to Facebook Page using token from previous node | Get Correct Page Token1            | -                                     |                                                                                                                                    |
| Schedule Trigger              | Schedule Trigger    | Triggers token refresh every 30 days                    | -                                  | Get Current Token                   |                                                                                                                                    |
| Get Current Token             | Code (JavaScript)   | Retrieves current token from static data                 | Schedule Trigger                   | Refresh token                      |                                                                                                                                    |
| Refresh token                | HTTP Request        | Exchanges short-lived token for long-lived token          | Get Current Token                  | Push to Static Data                |                                                                                                                                    |
| Push to Static Data           | Code (JavaScript)   | Saves refreshed token in static data                      | Refresh token                     | -                                     |                                                                                                                                    |
| Use System token to get page token | HTTP Request        | Retrieves Facebook Page tokens for system user (manual trigger branch) | Publish instagram post             | Get Correct Page Token                |                                                                                                                                    |
| Sticky Note                  | Sticky Note         | Instructions for generating Facebook short-lived token    | -                                  | -                                     | **How to Generate a Facebook Short-Lived Access Token for Instagram + Facebook Page Posting** (Detailed step-by-step guide)        |
| Sticky Note1                 | Sticky Note         | Notes on token expiration and workaround for testing      | -                                  | -                                     | Facebook tokens last short; workaround to extend to 2 months; static data notes                                                    |
| Sticky Note3                 | Sticky Note         | Notes usage of permanent never expire token               | -                                  | -                                     | Using the permanent never expire token                                                                                              |
| Sticky Note4                 | Sticky Note         | Instructions for creating permanent System User Token      | -                                  | -                                     | How to Create a Permanent System User Token (Recommended) - business verification, user creation, token generation, permissions     |

---

### 4. Reproducing the Workflow from Scratch

**Step 1: Create Manual Trigger Node**  
- Node Type: Manual Trigger  
- Name: "When clicking ‘Execute workflow’"  
- No parameters needed

**Step 2: Create Instagram Media Creation Node (Manual Branch)**  
- Node Type: HTTP Request  
- Name: "Post to Instagram"  
- Method: POST  
- URL: `https://graph.facebook.com/v19.0/<YOUR PAGE ID HERE>/media` (replace with Instagram Business Page ID)  
- Authentication: Use Facebook Graph API credential (System User Token)  
- Content-Type: form-urlencoded  
- Body Parameters:  
  - `image_url`: `<YOUR IMAGE URL HERE>` (replace)  
  - `caption`: `<YOUR CAPTION HERE>` (replace)  
- Connect output of Manual Trigger to this node

**Step 3: Add Wait Node**  
- Node Type: Wait  
- Name: "Wait 2 Second"  
- Wait time: 2 seconds  
- Connect output of "Post to Instagram" to this node

**Step 4: Add Instagram Publish Node**  
- Node Type: HTTP Request  
- Name: "Publish instagram post"  
- Method: POST  
- URL: `https://graph.facebook.com/v19.0/<YOUR INSTAGRAM BUSINESS ACCOUNT ID>/media_publish`  
- Authentication: Facebook Graph API credential  
- Content-Type: form-urlencoded  
- Body Parameters:  
  - `creation_id`: Set expression `={{ $json.id }}` (use output from previous node)  
- Connect output of Wait node to this node

**Step 5: Add Node to Get Page Tokens Using System User Token**  
- Node Type: HTTP Request  
- Name: "Use System token to get page token"  
- Method: GET  
- URL: `https://graph.facebook.com/v19.0/me/accounts`  
- Authentication: Facebook Graph API credential  
- Connect output of Instagram Publish node to this node

**Step 6: Add Code Node to Extract Correct Page Token**  
- Node Type: Code (JavaScript)  
- Name: "Get Correct Page Token"  
- Code:  
```javascript
const page = $json.data.find(p => p.id === '<YOUR PAGE ID HERE>');
return [{ json: { access_token: page.access_token } }];
```
- Replace `<YOUR PAGE ID HERE>` with actual Facebook Page ID  
- Connect output of previous node to this node

**Step 7: Add Facebook Post Node**  
- Node Type: HTTP Request  
- Name: "Post to Facebook"  
- Method: POST  
- URL: `https://graph.facebook.com/v19.0/<YOUR PAGE ID HERE>/photos`  
- Authentication: Facebook Graph API credential  
- Content-Type: form-urlencoded  
- Body Parameters:  
  - `url`: URL of image to post (e.g. sample or replace with variable)  
  - `caption`: Caption text  
  - `access_token`: Set from previous node output `={{ $json.access_token }}`  
- Connect output of "Get Correct Page Token" to this node

---

**Step 8: Add Token Refresh Scheduling Branch**

- Create a Schedule Trigger node  
  - Interval: Every 30 days at 01:00 AM  
  - Name: "Schedule Trigger"

- Add Code Node "Get Current Token"  
  - JavaScript code:  
  ```javascript
  const staticData = $getWorkflowStaticData('global');
  return [{ json: { token: staticData.fb_token } }];
  ```  
  - Connect Schedule Trigger output to this node

- Add HTTP Request "Refresh token"  
  - GET request to `https://graph.facebook.com/v19.0/oauth/access_token`  
  - Query parameters:  
    - `grant_type`: `fb_exchange_token`  
    - `client_id`: Your Facebook App's Client ID  
    - `client_secret`: Your Facebook App's Client Secret  
    - `fb_exchange_token`: token from previous node (expression)  
  - Authentication: Facebook Graph API credential  
  - Connect output of "Get Current Token" to this node

- Add Code Node "Push to Static Data"  
  - JavaScript code:  
  ```javascript
  const staticData = $getWorkflowStaticData('global');
  staticData.fb_token = $json.access_token;
  return [{ json: { status: 'Token saved to static data', token: staticData.fb_token } }];
  ```  
  - Connect output of "Refresh token" to this node

---

**Step 9: Add Posting Branch Using Stored Token**

- Add Code Node "Get Token from static Data"  
  - Same code as "Get Current Token"  
  - Connect external trigger (or manual trigger) to this node

- Add HTTP Request "Post to Instagram1"  
  - POST to `https://graph.facebook.com/v19.0/<Instagram Page ID>/media`  
  - Content-Type: form-urlencoded  
  - Body parameters:  
    - `image_url`: Your image URL  
    - `caption`: Your caption  
    - `access_token`: Expression from token in static data `={{ $json.token }}`  
  - Connect output of "Get Token from static Data" to this node

- Add Wait node "Wait 2 Second1" (2 seconds delay) connected to previous node

- Add HTTP Request "Publish instagram post1"  
  - POST to `https://graph.facebook.com/v19.0/<Instagram Page ID>/media_publish`  
  - Body parameters:  
    - `creation_id`: `={{ $json.id }}`  
    - `access_token`: Expression `={{ $('Get Token from static Data').item.json.token }}`  
  - Connect output of Wait node to this node

- Add HTTP Request "Use System token to get page token1"  
  - GET `https://graph.facebook.com/v19.0/me/accounts`  
  - Body parameter (or query param as per original): `access_token` from static data token  
  - Connect output of "Publish instagram post1" to this node

- Add Code Node "Get Correct Page Token1"  
  - JavaScript:  
  ```javascript
  const page = $json.data.find(p => p.id === '<YOUR PAGE ID HERE>');
  return [{ json: { access_token: page.access_token } }];
  ```  
  - Connect output of previous node to this node

- Add HTTP Request "Post to Facebook1"  
  - POST to `https://graph.facebook.com/v19.0/<YOUR PAGE ID HERE>/photos`  
  - Body parameters: image URL, caption, `access_token` from previous node  
  - Connect output of "Get Correct Page Token1" to this node

---

**Step 10: Add Sticky Notes**

- Add multiple Sticky Note nodes with the provided instructional content for:  
  - Generating short-lived tokens  
  - Token longevity notes and testing warnings  
  - Creating permanent system user tokens (recommended for production)  
  - Usage of permanent never expire tokens

Position these notes clearly for user reference.

---

**Step 11: Credentials Setup**

- Create and configure a Facebook Graph API credential in n8n with:  
  - Your Facebook App’s Client ID and Secret  
  - System User Token or User Token as needed  
  - Proper permission scopes (`pages_show_list`, `pages_manage_posts`, `instagram_basic`, `instagram_content_publish`, etc.)

**Step 12: Replace Placeholders**

- Replace all placeholder strings like `<YOUR PAGE ID HERE>`, `<Instagram Page ID>`, `<YOUR IMAGE URL HERE>`, `<YOUR CAPTION HERE>`, `<Your Client ID>`, and `<Your Secret Here>` with actual values.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Context or Link                                                                                                                                                   |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Detailed instructions on creating Facebook short-lived tokens and app setup are provided in the workflow sticky notes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | https://developers.facebook.com/apps & https://developers.facebook.com/tools/explorer/                                                                          |
| Permanent system user tokens require business verification and granting permissions; recommended for stable production use.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | https://business.facebook.com/settings/info                                                                                                                     |
| Token refresh is automated every 30 days but requires n8n to be running at trigger time; static data is used to store tokens persistently.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | n8n static data documentation: https://docs.n8n.io/nodes/n8n-nodes-base.code/#workflow-static-data                                                             |
| Instagram posting requires a two-step process: create media object then publish after a short delay to avoid race conditions.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Instagram Graph API docs: https://developers.facebook.com/docs/instagram-api/reference/media#creation_and_publishing                                             |
| Facebook photo posting is done via the `/photos` endpoint with the page access token obtained through system user token authorization.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Facebook Graph API docs: https://developers.facebook.com/docs/graph-api/reference/page/photos/#Creating                                                      |

---

**Disclaimer:**  
The provided text and workflow originate solely from an automated n8n workflow respecting all current content policies and legal usage. No illegal or offensive content is included. All data processed is legal and public.