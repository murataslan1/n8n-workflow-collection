Automate Influencer Evaluation & Campaign Management with Instagram/YouTube APIs

https://n8nworkflows.xyz/workflows/automate-influencer-evaluation---campaign-management-with-instagram-youtube-apis-8963


# Automate Influencer Evaluation & Campaign Management with Instagram/YouTube APIs

### 1. Workflow Overview

This workflow automates the end-to-end process of evaluating influencer applications and managing campaign approvals using data from Instagram and YouTube APIs. It is designed for marketing agencies, brands, or influencer platforms handling high volumes of influencer applications, streamlining validation, audience data retrieval, scoring, and onboarding communications.

**Logical Blocks:**

- **1.1 Input Reception & Validation:** Receives influencer application data via a webhook, sanitizes and validates required fields including email format and social handles.
- **1.2 Email Verification:** Uses VerifiEmail API to check the validity of the influencer’s email address.
- **1.3 Social Media Data Retrieval:** Fetches real-time profile statistics from Instagram and YouTube using RapidAPI.
- **1.4 Data Parsing & Aggregation:** Parses and normalizes social media API responses, combines data into a unified profile.
- **1.5 Influencer Scoring:** Calculates a composite influencer score based on follower tiers, engagement rates, and quality bonuses across platforms.
- **1.6 Approval Decision & Actions:** Determines approval status based on score thresholds and business rules, then either stops with error or proceeds to onboarding.
- **1.7 Onboarding:** Adds approved influencers to a Google Sheets database and sends a customized welcome email.

### 2. Block-by-Block Analysis

---

#### 2.1 Input Reception & Validation

**Overview:**  
Handles incoming POST requests with influencer application data, cleans input, validates required fields and email format, and prepares data for further processing.

**Nodes Involved:**  
- Webhook  
- Data Sanitizer

**Node Details:**

- **Webhook**  
  - Type: Webhook (HTTP POST listener)  
  - Configuration: Listens at `/YOUR_CUSTOM_WEBHOOK_PATH` with POST method expecting JSON payload.  
  - Input: External HTTP POST request with influencer application data.  
  - Output: Raw input data forwarded downstream.  
  - Edge Cases: Invalid HTTP method, no payload, malformed JSON.  
  - Sticky Note: Specifies expected payload format and endpoint URL.

- **Data Sanitizer**  
  - Type: Code Node (JavaScript)  
  - Role: Extracts and normalizes incoming JSON data whether in body or query parameters.  
  - Validates presence of required fields: `name`, `email`, `social_handles`, `niche`, `country`.  
  - Performs regex email format validation.  
  - Cleans social media handles removing '@' and URL parts, keeping only usernames.  
  - Adds metadata: `created_at` timestamp and initial `status` as `pending_validation`.  
  - Throws errors to stop workflow if validation fails (missing fields or invalid email).  
  - Edge Cases: Input data as string needing JSON parse; missing or malformed fields; invalid email format.  
  - Logs detailed debugging info for troubleshooting.

---

#### 2.2 Email Verification

**Overview:**  
Verifies the influencer’s email address using the VerifiEmail API to ensure contact validity before proceeding.

**Nodes Involved:**  
- Verifi Email  
- Switch  
- Stop and Error (invalid email branch)

**Node Details:**

- **Verifi Email**  
  - Type: VerifiEmail API node  
  - Configuration: Uses the influencer email from sanitized data (`{{$json.email}}`).  
  - Credentials: Requires VerifiEmail API key setup.  
  - Input: Validated influencer email.  
  - Output: JSON response with `valid` boolean field.  
  - Edge Cases: API failures, invalid or disposable emails, network timeouts.

- **Switch**  
  - Type: Switch (Boolean condition)  
  - Configuration: Routes flow based on `valid` field from email verification.  
  - True branch: Proceeds to social media data retrieval.  
  - False branch: Stops workflow with error "invalid email".  
  - Edge Cases: Missing `valid` field, unexpected response structure.

- **Stop and Error**  
  - Type: Stop and Error  
  - Role: Ends workflow with error message if email invalid.

---

#### 2.3 Social Media Data Retrieval

**Overview:**  
Fetches Instagram and YouTube profile statistics via RapidAPI to gather real audience and engagement metrics for scoring.

**Nodes Involved:**  
- Instagram Profile Stats  
- YouTube Channel Stats

**Node Details:**

- **Instagram Profile Stats**  
  - Type: HTTP Request  
  - Configuration: POST request to Instagram120 API endpoint with Instagram username parameter.  
  - Headers: RapidAPI host and key required.  
  - Input: Instagram username extracted from sanitized social handles.  
  - Output: Raw Instagram profile JSON data.  
  - Edge Cases: API quota limits, invalid username, network errors.  
  - Sticky Note: Reminds user to update RapidAPI key and manage rate limits.

- **YouTube Channel Stats**  
  - Type: HTTP Request  
  - Configuration: GET request to YouTube138 API endpoint with YouTube channel ID parameter.  
  - Headers: RapidAPI host and key required.  
  - Input: YouTube channel ID extracted from sanitized social handles.  
  - Output: Raw YouTube channel JSON data.  
  - Edge Cases: API quota limits, invalid channel ID, network errors.

---

#### 2.4 Data Parsing & Aggregation

**Overview:**  
Parses Instagram and YouTube API responses, extracting relevant metrics and normalizing data for scoring. Combines data streams for unified profile.

**Nodes Involved:**  
- Parse Instagram Data  
- Parse YouTube Data  
- Merge

**Node Details:**

- **Parse Instagram Data**  
  - Type: Code Node  
  - Role: Extracts follower counts, engagement metrics, verification status, and profile details from Instagram API response.  
  - Handles errors gracefully by returning fallback data with error flags.  
  - Calculates engagement rate based on follower tiers (nano to mega).  
  - Inputs: Instagram API response and sanitized user data.  
  - Output: Structured Instagram social stats within user profile JSON.

- **Parse YouTube Data**  
  - Type: Code Node  
  - Role: Extracts subscribers, views, video count, verification, and other channel metadata from YouTube API response.  
  - Calculates average views per video and engagement rates.  
  - Handles parsing errors with fallback default data and error flags.  
  - Inputs: YouTube API response and previously parsed user data.  
  - Output: Structured YouTube social stats within user profile JSON.

- **Merge**  
  - Type: Merge Node  
  - Role: Combines two incoming streams (Instagram and YouTube parsed data) into a single item for scoring.  
  - Input: Two separate inputs from Instagram and YouTube parsing nodes.  
  - Output: Single merged data object containing combined social stats.

---

#### 2.5 Influencer Scoring

**Overview:**  
Calculates a comprehensive influencer score based on follower count, engagement rates, verification, and content activity across Instagram and YouTube, weighted by platform.

**Nodes Involved:**  
- Calculate Influencer Score

**Node Details:**

- **Calculate Influencer Score**  
  - Type: Code Node  
  - Role:  
    - Accepts merged profile data with social stats from Instagram and YouTube.  
    - Uses configurable scoring tiers for follower count and engagement rates per platform.  
    - Applies quality bonuses for verified accounts, business emails, posting frequency, and privacy settings.  
    - Computes weighted overall score (Instagram 60%, YouTube 40%).  
    - Applies business rules such as minimum total followers (5K), rate card vs audience ratio, and categorizes status: approved, pending_review, or rejected (with reasons).  
  - Outputs: Enriched JSON with detailed scoring breakdown, overall score, status, and rejection reasons if applicable.  
  - Edge Cases: Missing social stats, scoring config errors, division by zero, unexpected data shapes.  
  - Sticky Note: Details scoring weights and thresholds.

---

#### 2.6 Approval Decision & Actions

**Overview:**  
Branches workflow based on approval status. Approved influencers are added to database and emailed; others stop with error message.

**Nodes Involved:**  
- If  
- Add to Approved Database  
- Send Welcome Email  
- Stop and Error1

**Node Details:**

- **If**  
  - Type: If Node  
  - Role: Checks if influencer status equals "approved".  
  - True branch: Proceeds to database and email actions.  
  - False branch: Stops workflow with error indicating low engagement or rejection reason.

- **Add to Approved Database**  
  - Type: Google Sheets  
  - Role: Appends influencer data to a specified Google Sheets spreadsheet (database).  
  - Maps fields including name, email, niche, social handles, follower counts, scores, and status.  
  - Credentials: Requires Google Sheets OAuth2 credentials.  
  - Edge Cases: API quota exceeded, permission errors, invalid spreadsheet ID.  
  - Sticky Note: Notes about updating Google Sheets ID and credentials.

- **Send Welcome Email**  
  - Type: Gmail  
  - Role: Sends a customized approval email including score, follower stats, next steps, and contact info.  
  - Uses OAuth2 credentials for Gmail account.  
  - Dynamic parameters include influencer name, scores, social profiles, and niche.  
  - Edge Cases: Email delivery failures, invalid recipient address.  
  - Sticky Note: Reminds to replace branding placeholders.

- **Stop and Error1**  
  - Type: Stop and Error  
  - Role: Ends workflow for rejected influencers with message about engagement score or rejection reason.

---

### 3. Summary Table

| Node Name               | Node Type                | Functional Role                           | Input Node(s)             | Output Node(s)                 | Sticky Note                                                                                             |
|-------------------------|--------------------------|-----------------------------------------|---------------------------|-------------------------------|-------------------------------------------------------------------------------------------------------|
| Webhook                 | Webhook                  | Receive influencer application           | External HTTP POST        | Data Sanitizer                 | Defines webhook URL `/YOUR_CUSTOM_WEBHOOK_PATH` and expected JSON payload example                      |
| Data Sanitizer          | Code                     | Normalize and validate input data        | Webhook                   | Verifi Email                  | Required fields validation and email format check; stops workflow on failure                           |
| Verifi Email            | VerifiEmail API          | Verify influencer email address           | Data Sanitizer             | Switch                       | Requires VerifiEmail API key configured                                                                |
| Switch                  | Switch                   | Route based on email validity             | Verifi Email               | Instagram Profile Stats, YouTube Channel Stats, Stop and Error |                                                                                                       |
| Stop and Error          | Stop and Error           | Stop workflow on invalid email            | Switch                    | -                             | Error message: "invalid email"                                                                         |
| Instagram Profile Stats | HTTP Request             | Fetch Instagram profile stats             | Switch (valid branch)      | Parse Instagram Data          | Requires RapidAPI Instagram120 API key; monitor API rate limits                                        |
| Parse Instagram Data    | Code                     | Parse and enrich Instagram data           | Instagram Profile Stats    | Merge                        | Provides fallback on parse failure; calculates engagement rates                                       |
| YouTube Channel Stats   | HTTP Request             | Fetch YouTube channel stats                | Switch (valid branch)      | Parse YouTube Data            | Requires RapidAPI YouTube138 API key; monitor API rate limits                                         |
| Parse YouTube Data      | Code                     | Parse and enrich YouTube data              | YouTube Channel Stats      | Merge                        | Calculates engagement and channel activity metrics                                                    |
| Merge                   | Merge                    | Combine Instagram and YouTube data        | Parse Instagram Data, Parse YouTube Data | Calculate Influencer Score   |                                                                                                       |
| Calculate Influencer Score | Code                   | Compute overall influencer score          | Merge                      | If                           | Scoring breakdown and thresholds explained                                                           |
| If                      | If                       | Check approval status                      | Calculate Influencer Score | Add to Approved Database, Stop and Error1 |                                                                                                       |
| Add to Approved Database | Google Sheets            | Append approved influencer to database    | If (approved branch)       | Send Welcome Email           | Update Google Sheets ID; requires OAuth2 credentials                                                  |
| Send Welcome Email      | Gmail                    | Send approval notification email          | Add to Approved Database   | -                             | Replace branding placeholders; requires Gmail OAuth2 credentials                                     |
| Stop and Error1         | Stop and Error           | Stop workflow for rejected influencers    | If (rejected branch)       | -                             | Message on engagement score or rejection reason                                                       |
| Sticky Note             | Sticky Note              | Documentation and reminders                | -                         | -                             | Multiple notes cover webhook, validation, API keys, scoring, rejection reasons, and monitoring notes |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: `/YOUR_CUSTOM_WEBHOOK_PATH`  
   - Accept JSON content  
   - Save and activate webhook

2. **Create Data Sanitizer (Code Node)**  
   - Extract incoming JSON from body or query params  
   - Validate required fields: `name`, `email`, `social_handles`, `niche`, `country`  
   - Validate email format via regex  
   - Clean social handles by removing '@' and URL fragments, keep usernames only  
   - Add fields: `created_at` (current ISO timestamp), `status` = `pending_validation`  
   - Throw error if validation fails  
   - Connect Webhook node output to this node input

3. **Create Verifi Email Node**  
   - Use VerifiEmail API credentials (set up API key in n8n credentials)  
   - Input email: `{{$json.email}}`  
   - Connect Data Sanitizer output to this node input

4. **Create Switch Node for Email Validity**  
   - Condition: `$json.valid == true`  
   - True branch: continue to social media API calls  
   - False branch: connect to Stop and Error node with message "invalid email"  
   - Connect Verifi Email output to this node input

5. **Create Stop and Error Node**  
   - Error Message: "invalid email"  
   - Connect Switch false branch to this node

6. **Create Instagram Profile Stats HTTP Request Node**  
   - Method: POST  
   - URL: `https://instagram120.p.rapidapi.com/api/instagram/profile`  
   - Body parameter: `username` = `{{$json.social_handles.instagram}}`  
   - Headers:  
     - `x-rapidapi-host`: `instagram120.p.rapidapi.com`  
     - `x-rapidapi-key`: Your RapidAPI key  
   - Connect Switch true branch to this node

7. **Create YouTube Channel Stats HTTP Request Node**  
   - Method: GET  
   - URL: `https://youtube138.p.rapidapi.com/channel/details`  
   - Query params:  
     - `id` = `{{$json.social_handles.youtube}}`  
     - `hl` = `en`  
     - `gl` = `US`  
   - Headers:  
     - `x-rapidapi-host`: `youtube138.p.rapidapi.com`  
     - `x-rapidapi-key`: Your RapidAPI key  
   - Connect Switch true branch to this node (in parallel with Instagram node)

8. **Create Parse Instagram Data Code Node**  
   - Input: Instagram API response  
   - Extract profile fields: id, username, followers, following, posts, biography, verified, private, profile pics  
   - Calculate engagement rates based on follower count tiers  
   - Return enriched JSON with Instagram social stats and user base data  
   - Connect Instagram Profile Stats output to this node

9. **Create Parse YouTube Data Code Node**  
   - Input: YouTube API response  
   - Extract channel details: channel ID, username, subscribers, views, videos, verification, description, etc.  
   - Calculate average views/video and engagement rate  
   - Return enriched JSON with YouTube social stats merged with user data  
   - Connect YouTube Channel Stats output to this node

10. **Create Merge Node**  
    - Merge the two outputs from Parse Instagram Data and Parse YouTube Data nodes  
    - Mode: Merge by index or combine outputs into a single item  
    - Connect Parse Instagram Data and Parse YouTube Data outputs to this node

11. **Create Calculate Influencer Score Code Node**  
    - Input: merged data with social stats  
    - Define scoring config: platform weights (Instagram 60%, YouTube 40%), follower tiers, engagement tiers, quality bonuses  
    - Compute platform scores based on followers and engagement rates  
    - Calculate weighted overall score  
    - Apply business rules: minimum followers 5K, rate card vs audience ratio  
    - Determine status: approved, pending_review, or rejected with reasons  
    - Return enriched JSON with scoring and status  
    - Connect Merge node output to this node

12. **Create If Node**  
    - Condition: `$json.status == "approved"`  
    - True branch: proceed to database and email nodes  
    - False branch: connect to Stop and Error node with engagement score failure message

13. **Create Stop and Error Node for Rejected Cases**  
    - Error message: "Engagement score doesn't meet the expectations"  
    - Connect If node false branch to this node

14. **Create Add to Approved Database Google Sheets Node**  
    - Operation: Append row  
    - Spreadsheet ID: Your Google Sheets ID  
    - Sheet name: Sheet1 or your sheet  
    - Map columns: Name, Email, niche, Instagram username, Instagram followers, YouTube username, YouTube subscribers, total followers, overall score, rate card, status  
    - Credentials: Google Sheets OAuth2 account  
    - Connect If node true branch to this node

15. **Create Send Welcome Email Gmail Node**  
    - Send to: `{{$json.Email}}`  
    - Subject: "Welcome to YOUR_BRAND_NAME - You're Approved!"  
    - Body: Customized message with influencer name, scores, social stats, next steps, and contact info  
    - Credentials: Gmail OAuth2 account  
    - Connect Add to Approved Database output to this node

16. **Add Sticky Notes** (optional but recommended)  
    - Document webhook usage, required fields, API setup keys, scoring explanation, rejection reasons, approved path actions, monitoring checklist, and credentials setup reminders.

---

### 5. General Notes & Resources

| Note Content                                                                                                          | Context or Link                                                                                          |
|-----------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|
| Workflow automates influencer application validation and campaign approval using Instagram and YouTube data.          | Overall workflow purpose and target audience                                                          |
| Requires RapidAPI subscriptions for Instagram120 and YouTube138 APIs; monitor rate limits and add delays in prod.     | API setup and usage notes                                                                              |
| Google Sheets used as database for approved influencers; requires OAuth2 credentials setup.                            | Database storage and credential setup                                                                  |
| Gmail OAuth2 credentials required for sending automated welcome emails to approved influencers.                        | Email sending setup                                                                                    |
| Scoring thresholds: 80+ auto-approved, 65-79 manual review, below 65 auto-rejected; minimum total followers 5K required. | Scoring and business decision rules                                                                    |
| Rejection reasons logged include low engagement, insufficient reach, overpriced rate card, invalid emails, or missing data. | Quality control and rejection rationale                                                                |
| Recommended monitoring includes API quota, webhook response times, email delivery rates, and database write errors.   | Operational monitoring best practices                                                                  |
| Replace placeholders like `YOUR_BRAND_NAME`, Google Sheets ID, RapidAPI keys, and email addresses before production.   | Production customization and branding                                                                  |
| Links to official API documentation should be consulted for Instagram120 and YouTube138 RapidAPI endpoints.             | API provider resources                                                                                  |

---

This document fully describes the workflow structure, logic, node configurations, and operational requirements for automated influencer evaluation and campaign management using Instagram and YouTube APIs integrated via n8n. It enables reproduction, modification, and troubleshooting by developers and AI agents alike.

---

**Disclaimer:** The provided text is exclusively from an automated n8n workflow. It complies strictly with content policies and contains no illegal or protected data. All processed data is legal and publicly available.