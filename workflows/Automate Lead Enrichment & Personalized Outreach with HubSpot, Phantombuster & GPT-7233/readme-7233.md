Automate Lead Enrichment & Personalized Outreach with HubSpot, Phantombuster & GPT

https://n8nworkflows.xyz/workflows/automate-lead-enrichment---personalized-outreach-with-hubspot--phantombuster---gpt-7233


# Automate Lead Enrichment & Personalized Outreach with HubSpot, Phantombuster & GPT

### 1. Workflow Overview

This workflow automates lead enrichment and personalized outreach by integrating HubSpot, Phantombuster social media scrapers, and AI-generated email content via OpenAI. It is designed to trigger upon new or updated HubSpot contacts, fetch detailed contact info, enrich social profiles (Twitter and LinkedIn) using Phantombuster, and generate personalized outreach emails tailored to the enriched social data.

The workflow is logically divided into these blocks:

- **1.1 Trigger & Input Reception:** Receive HubSpot webhook events for contact creation or update, then fetch full contact details.
- **1.2 Data Logging:** Update a Google Sheet with the contact’s Twitter/LinkedIn usernames for tracking.
- **1.3 Conditional Validation:** Check if social profile usernames exist before proceeding.
- **1.4 Social Media Scraping:** Launch Phantombuster agents to scrape Twitter profile and tweet information.
- **1.5 Processing Wait:** Wait nodes to allow Phantombuster scraping jobs to complete.
- **1.6 Result Retrieval & Parsing:** Fetch scraping results, extract URLs, download JSON files, and parse profile and tweet data.
- **1.7 Data Structuring & Merging:** Format extracted data fields, merge tweet and profile data into a unified object.
- **1.8 AI-Powered Email Generation:** Use LangChain with OpenAI GPT to generate personalized HTML emails based on enriched social data.
- **1.9 Email Delivery:** Parse AI output and send the personalized email through Gmail.

---

### 2. Block-by-Block Analysis

#### 1.1 Trigger & Input Reception

- **Overview:**  
  Starts the workflow by receiving HubSpot webhook POST requests when contacts are added or updated. It fetches the full contact details using the contact ID from the webhook payload.

- **Nodes Involved:**  
  - 🔗 HubSpot Contact Webhook  
  - 👤 Fetch Contact

- **Node Details:**  
  - **🔗 HubSpot Contact Webhook**  
    - *Type:* Webhook node  
    - *Role:* Receives HTTP POST webhook calls at specified endpoint path.  
    - *Config:* Path set as `webhook-endpoint`; HTTP method POST.  
    - *Input:* External HubSpot webhook HTTP call.  
    - *Output:* JSON containing array with `objectId` of contact.  
    - *Failures:* Webhook downtime or invalid payload.  
  - **👤 Fetch Contact**  
    - *Type:* HubSpot node  
    - *Role:* Retrieves full contact details from HubSpot API using contact ID.  
    - *Config:* Uses `appToken` authentication; contact ID dynamically set from webhook JSON `body[0].objectId`.  
    - *Input:* Output from webhook node.  
    - *Output:* Full contact data JSON including properties like email, Twitter, LinkedIn.  
    - *Failures:* API token invalid, contact not found, rate limits.

#### 1.2 Data Logging

- **Overview:**  
  Logs Twitter and LinkedIn usernames of the contact in a Google Sheet to track enrichment progress.

- **Nodes Involved:**  
  - 📝 Update Sheet with Users Twitter/LinkedIn

- **Node Details:**  
  - *Type:* Google Sheets node  
  - *Role:* Appends or updates rows in Google Sheets with social profile usernames and status.  
  - *Config:*  
    - Sheet ID and name configured (replace placeholders).  
    - Mapping: Profiles column matches Twitter username; Status set to "Done".  
    - Credential: OAuth2 with Google Sheets.  
  - *Input:* Contact JSON from Fetch Contact node, uses expression to get Twitter username.  
  - *Output:* Updated spreadsheet row info.  
  - *Failures:* Invalid spreadsheet ID, OAuth token expired, schema mismatch.

#### 1.3 Conditional Validation

- **Overview:**  
  Validates that the contact has Twitter or LinkedIn usernames before triggering scraping agents.

- **Nodes Involved:**  
  - ✅ Validate Twitter/LinkedIn Exists

- **Node Details:**  
  - *Type:* If node (conditional)  
  - *Role:* Checks if the "Profiles" field (from Google Sheet update node) exists and is non-empty.  
  - *Config:* Condition: string exists operator on `$json.Profiles`.  
  - *Input:* Output from Google Sheets node.  
  - *Output:* If true, proceeds to scraping launch; else stops.  
  - *Failures:* Expression evaluation errors if Profiles field missing.

#### 1.4 Social Media Scraping

- **Overview:**  
  Initiates external Phantombuster agents to scrape Twitter profile data and tweets, sending authenticated POST requests.

- **Nodes Involved:**  
  - 🚀 Launch Profile Scraper  
  - 🎯 Launch Tweet Scraper

- **Node Details:**  
  - *Type:* HTTP Request nodes  
  - *Role:* POST to Phantombuster API to manually launch agents by ID.  
  - *Config:*  
    - URL: `https://api.phantombuster.com/api/v2/agents/launch`  
    - Body: JSON with Phantombuster agent ID (`YOUR_PROFILE_SCRAPER_ID` or `YOUR_TWEET_SCRAPER_ID`) and manualLaunch flag true.  
    - Headers: `X-Phantombuster-Key-1` with API key, Content-Type JSON.  
  - *Input:* From conditional node.  
  - *Output:* Confirmation of agent launch, includes container ID.  
  - *Failures:* Invalid API key, incorrect agent ID, network errors.

#### 1.5 Processing Wait

- **Overview:**  
  Waits a predefined period to allow Phantombuster agents to complete scraping.

- **Nodes Involved:**  
  - ⏳ Wait for Profile Processing  
  - ⏳ Wait for Tweet Processing

- **Node Details:**  
  - *Type:* Wait node  
  - *Role:* Pauses workflow for fixed seconds (30s for profile, 60s for tweets).  
  - *Config:* Amount parameter set to 30 or 60 seconds.  
  - *Input:* From respective launch nodes.  
  - *Output:* Continues after wait period.  
  - *Failures:* Unexpected workflow interruption during wait.

#### 1.6 Result Retrieval & Parsing

- **Overview:**  
  Fetches completed scraping results from Phantombuster, extracts downloadable JSON URLs, downloads and parses the JSON data files.

- **Nodes Involved:**  
  - 📊 Fetch Profile Results  
  - 📊 Fetch Tweet Results  
  - 🔍 Extract Profile URL  
  - 🔍 Extract Tweet URL  
  - 📥 Download Profile Data  
  - 📋 Parse Profile JSON  
  - 📋 Download Tweet JSON  
  - 📋 Parse Tweet JSON

- **Node Details:**  
  - **Fetch Results Nodes (HTTP Request):**  
    - Fetch output from Phantombuster containers using container ID.  
    - Headers include Phantombuster API key.  
    - Output includes raw string containing metadata with URLs.  
  - **Extract URL Nodes (Code):**  
    - Use regex in JavaScript to parse output string for JSON or CSV URLs of results.  
    - Throws error if URL not found.  
  - **Download Data Nodes (HTTP Request):**  
    - Downloads JSON result files using extracted URLs.  
    - Configured to receive response as file.  
  - **Parse JSON Nodes (Extract From File):**  
    - Convert downloaded JSON files to usable JSON objects for later nodes.  
  - *Failures:* API key invalid, container ID missing, malformed output, request timeouts, regex failures.

#### 1.7 Data Structuring & Merging

- **Overview:**  
  Formats important social data fields into readable properties, merges profile and tweet data streams into a single unified JSON object.

- **Nodes Involved:**  
  - 🏷️ Format Profile Fields  
  - 🏷️ Format Tweet Fields  
  - 🔄 Merge Data Streams  
  - 🧩 Combine All Data

- **Node Details:**  
  - **Format Profile Fields (Set node):**  
    - Maps profile JSON properties (Twitter handle, tweets count, followers, bio, verified status, etc.) into fields with string values for downstream use.  
  - **Format Tweet Fields (Set node):**  
    - Assigns tweets and email address from HubSpot contact to fields.  
  - **Merge Data Streams (Merge node):**  
    - Merges profile and tweet formatted data streams into one combined stream.  
  - **Combine All Data (Code node):**  
    - Merges all input JSON objects into a single JSON object for AI input.  
  - *Failures:* Missing fields, malformed data, type mismatches.

#### 1.8 AI-Powered Email Generation

- **Overview:**  
  Uses LangChain with OpenAI GPT to generate a personalized and professional HTML email based on combined social data and sender’s brand info.

- **Nodes Involved:**  
  - 🧠 Generate Personalized Email  
  - 🤖 OpenAI Language Model  
  - ✂️ Parse Email Content

- **Node Details:**  
  - **Generate Personalized Email (LangChain Agent):**  
    - Custom prompt includes extracted Twitter profile data and instructions to produce JSON with subject and HTML body.  
    - Parameters specify prompt type and detailed instructions.  
  - **OpenAI Language Model:**  
    - GPT-4o-mini model invoked by LangChain node to generate AI text.  
    - Credential: OpenAI API key.  
  - **Parse Email Content (Code):**  
    - Cleans raw AI output, removes Markdown JSON formatting, parses JSON string to extract subject and body fields.  
  - *Failures:* AI model errors, malformed output, JSON parse errors, API key issues.

#### 1.9 Email Delivery

- **Overview:**  
  Sends the generated personalized email to the contact’s email address via Gmail.

- **Nodes Involved:**  
  - 📧 Sends Email

- **Node Details:**  
  - *Type:* Gmail node  
  - *Role:* Sends an email to the contact using OAuth2 Gmail credentials.  
  - *Config:*  
    - Recipient address dynamically from merged data.  
    - Subject and body from parsed AI output.  
    - Option to disable attribution appended.  
  - *Input:* Email content JSON from Parse Email Content node.  
  - *Failures:* Gmail OAuth token expired, invalid recipient email, Gmail API errors.

---

### 3. Summary Table

| Node Name                        | Node Type                         | Functional Role                              | Input Node(s)                           | Output Node(s)                     | Sticky Note                                                                                                           |
|---------------------------------|----------------------------------|----------------------------------------------|---------------------------------------|-----------------------------------|-----------------------------------------------------------------------------------------------------------------------|
| 🔗 HubSpot Contact Webhook       | Webhook                          | Trigger on HubSpot contact add/update         | External HTTP call                    | 👤 Fetch Contact                   | 🔗 Trigger & Input: Trigger and input reception explanation                                                         |
| 👤 Fetch Contact                 | HubSpot                          | Fetch full contact details from HubSpot       | 🔗 HubSpot Contact Webhook            | 📝 Update Sheet with Users Twitter/LinkedIn | 🔗 Trigger & Input: Fetch contact details                                                                             |
| 📝 Update Sheet with Users Twitter/LinkedIn | Google Sheets                   | Log Twitter/LinkedIn usernames to Sheet       | 👤 Fetch Contact                      | ✅ Validate Twitter/LinkedIn Exists | 🔗 Trigger & Input: Logging social profiles                                                                            |
| ✅ Validate Twitter/LinkedIn Exists | If                              | Check if social profile usernames exist       | 📝 Update Sheet with Users Twitter/LinkedIn | 🚀 Launch Profile Scraper, 🎯 Launch Tweet Scraper | ✅ Conditional Path: Validate presence of social usernames                                                            |
| 🚀 Launch Profile Scraper        | HTTP Request                    | Launch Phantombuster profile scraper agent    | ✅ Validate Twitter/LinkedIn Exists  | ⏳ Wait for Profile Processing     | 🔍 Social Media Scraping: Launch Phantombuster agents                                                                 |
| 🎯 Launch Tweet Scraper          | HTTP Request                    | Launch Phantombuster tweet scraper agent      | ✅ Validate Twitter/LinkedIn Exists  | ⏳ Wait for Tweet Processing       | 🔍 Social Media Scraping: Launch Phantombuster agents                                                                 |
| ⏳ Wait for Profile Processing   | Wait                            | Wait for profile scraping to complete         | 🚀 Launch Profile Scraper            | 📊 Fetch Profile Results           | 🔍 Social Media Scraping: Wait nodes allow scraping to finish                                                         |
| ⏳ Wait for Tweet Processing     | Wait                            | Wait for tweet scraping to complete           | 🎯 Launch Tweet Scraper              | 📊 Fetch Tweet Results             | 🔍 Social Media Scraping: Wait nodes allow scraping to finish                                                         |
| 📊 Fetch Profile Results         | HTTP Request                    | Retrieve profile scraping results              | ⏳ Wait for Profile Processing       | 🔍 Extract Profile URL             | 🔍 Social Media Scraping: Fetch results from Phantombuster                                                            |
| 📊 Fetch Tweet Results           | HTTP Request                    | Retrieve tweet scraping results                | ⏳ Wait for Tweet Processing         | 🔍 Extract Tweet URL               | 🔍 Social Media Scraping: Fetch results from Phantombuster                                                            |
| 🔍 Extract Profile URL           | Code                            | Extract profile JSON/CSV URL from results      | 📊 Fetch Profile Results             | 📥 Download Profile Data           | 🔍 Social Media Scraping: Extract download URL using regex                                                             |
| 🔍 Extract Tweet URL             | Code                            | Extract tweet JSON URL from results            | 📊 Fetch Tweet Results               | 📋 Download Tweet JSON             | 🔍 Social Media Scraping: Extract download URL using regex                                                             |
| 📥 Download Profile Data         | HTTP Request                    | Download profile JSON data file                 | 🔍 Extract Profile URL               | 📋 Parse Profile JSON              | 📥 Data Download & Parsing: Download and parse profile JSON                                                            |
| 📋 Parse Profile JSON            | Extract From File               | Convert downloaded profile JSON file to object | 📥 Download Profile Data             | 🏷️ Format Profile Fields          | 📥 Data Download & Parsing: Parse profile JSON                                                                          |
| 📋 Download Tweet JSON           | HTTP Request                    | Download tweet JSON data file                   | 🔍 Extract Tweet URL                 | 📋 Parse Tweet JSON                | 📥 Data Download & Parsing: Download and parse tweet JSON                                                              |
| 📋 Parse Tweet JSON              | Extract From File               | Convert downloaded tweet JSON file to object   | 📋 Download Tweet JSON               | 🏷️ Format Tweet Fields            | 📥 Data Download & Parsing: Parse tweet JSON                                                                            |
| 🏷️ Format Profile Fields        | Set                             | Format profile stats fields                      | 📋 Parse Profile JSON                | 🔄 Merge Data Streams             | 🏷️ Data Structuring: Map important profile fields                                                                      |
| 🏷️ Format Tweet Fields          | Set                             | Format tweet stats fields and email             | 📋 Parse Tweet JSON                  | 🔄 Merge Data Streams             | 🏷️ Data Structuring: Map tweet fields and contact email                                                                |
| 🔄 Merge Data Streams            | Merge                           | Combine formatted profile and tweet streams    | 🏷️ Format Profile Fields, 🏷️ Format Tweet Fields | 🧩 Combine All Data              | 🔄 Data Merging: Combine tweet and profile data streams                                                                |
| 🧩 Combine All Data              | Code                            | Merge all JSON objects into one for AI prompt   | 🔄 Merge Data Streams                | 🧠 Generate Personalized Email    | 🔄 Data Merging: Consolidate all data for AI input                                                                      |
| 🧠 Generate Personalized Email  | LangChain Agent                 | Generate personalized email JSON from social data | 🧩 Combine All Data                 | ✂️ Parse Email Content            | ✉️ Email Generation & Delivery: AI-based email generation                                                              |
| 🤖 OpenAI Language Model         | LangChain LM Chat OpenAI        | AI language model for generating email content | 🧠 Generate Personalized Email      | 🧠 Generate Personalized Email    | ✉️ Email Generation & Delivery: Uses GPT-4o-mini model                                                                  |
| ✂️ Parse Email Content           | Code                            | Parse AI raw output to extract email subject and body | 🧠 Generate Personalized Email      | 📧 Sends Email                   | ✉️ Email Generation & Delivery: Parse AI JSON output                                                                    |
| 📧 Sends Email                  | Gmail                          | Send personalized email to contact via Gmail    | ✂️ Parse Email Content              | —                                 | ✉️ Email Generation & Delivery: Sends email to contact using Gmail OAuth2                                               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node: "🔗 HubSpot Contact Webhook"**  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: `webhook-endpoint`  
   - Purpose: Trigger workflow on HubSpot contact create/update.

2. **Create HubSpot Node: "👤 Fetch Contact"**  
   - Type: HubSpot  
   - Operation: Get contact  
   - Contact ID: `={{ $json.body[0].objectId }}` (from webhook)  
   - Authentication: HubSpot App Token  
   - Connect "🔗 HubSpot Contact Webhook" output to this node.

3. **Create Google Sheets Node: "📝 Update Sheet with Users Twitter/LinkedIn"**  
   - Type: Google Sheets  
   - Operation: Append or Update  
   - Document ID: Your Google Sheet ID  
   - Sheet Name: Sheet1 (or your sheet)  
   - Mapping:  
     - Profiles column set to `={{ $json.properties.twitter.value }}`  
     - Status column set to "Done"  
   - Authentication: Google Sheets OAuth2  
   - Connect output of "👤 Fetch Contact" to this node.

4. **Create If Node: "✅ Validate Twitter/LinkedIn Exists"**  
   - Type: If  
   - Condition: Check if `={{ $json.Profiles }}` exists (string exists)  
   - Connect output of "📝 Update Sheet with Users Twitter/LinkedIn" to this node.

5. **Create HTTP Request Node: "🚀 Launch Profile Scraper"**  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://api.phantombuster.com/api/v2/agents/launch`  
   - Headers:  
     - `X-Phantombuster-Key-1`: Your API key  
     - Content-Type: application/json  
   - Body (raw JSON):  
     ```json
     {
       "id": "YOUR_PROFILE_SCRAPER_ID",
       "manualLaunch": true
     }
     ```  
   - Connect If node's "true" output to this node.

6. **Create HTTP Request Node: "🎯 Launch Tweet Scraper"**  
   - Same configuration as above but with `"id": "YOUR_TWEET_SCRAPER_ID"`  
   - Connect If node's "true" output to this node as well.

7. **Create Wait Node: "⏳ Wait for Profile Processing"**  
   - Type: Wait  
   - Duration: 30 seconds  
   - Connect output of "🚀 Launch Profile Scraper" to this node.

8. **Create Wait Node: "⏳ Wait for Tweet Processing"**  
   - Type: Wait  
   - Duration: 60 seconds  
   - Connect output of "🎯 Launch Tweet Scraper" to this node.

9. **Create HTTP Request Node: "📊 Fetch Profile Results"**  
   - Method: GET  
   - URL: `https://api.phantombuster.com/api/v2/containers/fetch-output?id={{ $json.containerId }}`  
   - Headers:  
     - `X-Phantombuster-Key-1`: Your API key  
   - Connect output of "⏳ Wait for Profile Processing" to this node.

10. **Create HTTP Request Node: "📊 Fetch Tweet Results"**  
    - Method: GET  
    - URL: `https://api.phantombuster.com/api/v2/containers/fetch-output?id={{ $json.containerId }}&withResultObject=true`  
    - Headers:  
      - `X-Phantombuster-Key-1`: Your API key  
    - Connect output of "⏳ Wait for Tweet Processing" to this node.

11. **Create Code Node: "🔍 Extract Profile URL"**  
    - JavaScript code to parse output string and extract JSON or CSV URL (see node code in analysis).  
    - Connect output of "📊 Fetch Profile Results" to this node.

12. **Create Code Node: "🔍 Extract Tweet URL"**  
    - JavaScript code to extract JSON URL from tweet results output.  
    - Connect output of "📊 Fetch Tweet Results" to this node.

13. **Create HTTP Request Node: "📥 Download Profile Data"**  
    - Method: GET  
    - URL: `={{ $json.resultUrl }}` (extracted from previous node)  
    - Response Format: File  
    - Connect output of "🔍 Extract Profile URL" to this node.

14. **Create HTTP Request Node: "📋 Download Tweet JSON"**  
    - Same as above but connected from "🔍 Extract Tweet URL".

15. **Create Extract From File Node: "📋 Parse Profile JSON"**  
    - Operation: fromJson  
    - Connect output of "📥 Download Profile Data" to this node.

16. **Create Extract From File Node: "📋 Parse Tweet JSON"**  
    - Operation: fromJson  
    - Connect output of "📋 Download Tweet JSON" to this node.

17. **Create Set Node: "🏷️ Format Profile Fields"**  
    - Map fields from parsed profile JSON to properties like Twitter, Tweet Count, Followers, Bio, Verified, etc. (see analysis for exact mappings).  
    - Connect output of "📋 Parse Profile JSON" to this node.

18. **Create Set Node: "🏷️ Format Tweet Fields"**  
    - Map tweet data and set contact email from "👤 Fetch Contact" node.  
    - Connect output of "📋 Parse Tweet JSON" to this node.

19. **Create Merge Node: "🔄 Merge Data Streams"**  
    - Merge Type: (default)  
    - Connect outputs of "🏷️ Format Profile Fields" and "🏷️ Format Tweet Fields" to this node.

20. **Create Code Node: "🧩 Combine All Data"**  
    - JS code to combine all input JSON objects into a single JSON object (see analysis for code).  
    - Connect output of "🔄 Merge Data Streams" to this node.

21. **Create LangChain Agent Node: "🧠 Generate Personalized Email"**  
    - Type: LangChain Agent  
    - Prompt: Use provided instructions with dynamic insertion of profile fields and personal brand info placeholders (YOUR_NAME, YOUR_POSITION, etc.).  
    - Connect output of "🧩 Combine All Data" to this node.

22. **Create LangChain LM Node: "🤖 OpenAI Language Model"**  
    - Model: gpt-4o-mini  
    - Credentials: OpenAI API key  
    - Connect AI language model input of "🧠 Generate Personalized Email" node to this node.

23. **Create Code Node: "✂️ Parse Email Content"**  
    - JavaScript to clean and parse AI JSON output string into `subject` and `body`.  
    - Connect output of "🧠 Generate Personalized Email" to this node.

24. **Create Gmail Node: "📧 Sends Email"**  
    - To: `={{ $('🧩 Combine All Data').item.json.Email }}`  
    - Subject: `={{ $json.subject }}`  
    - Message: `={{ $json.body }}` (HTML)  
    - Authentication: Gmail OAuth2  
    - Connect output of "✂️ Parse Email Content" to this node.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                             | Context or Link                                                                                              |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| The workflow requires valid credentials and IDs for HubSpot App Token, Google Sheets OAuth2, Phantombuster API keys, OpenAI API, and Gmail OAuth2. Replace all placeholders accordingly.                  | Credential setup instructions within each node configuration.                                                |
| Phantombuster agent IDs and container IDs must be obtained from your Phantombuster account. The scraping wait times (30s for profile, 60s for tweets) may be adjusted depending on agent performance.         | Phantombuster API documentation: https://phantombuster.com/api                                          |
| LangChain prompt uses placeholders `[YOUR_NAME]`, `[YOUR_POSITION]`, `[YOUR_COMPANY]`, etc. Replace these with your actual brand details for proper personalization in generated emails.                   | LangChain integration details: https://docs.n8n.io/integrations/ai/langchain/                                |
| The Gmail node is configured with OAuth2 credentials and requires prior setup of Gmail API access in Google Cloud Console.                                                                               | Gmail API docs: https://developers.google.com/gmail/api                                                        |
| Error handling is minimal; consider adding try/catch or error workflows to handle API failures, webhook errors, or parsing exceptions for production use.                                               | n8n error workflow guidelines: https://docs.n8n.io/workflows/error-handling/                                  |

---

**Disclaimer:** The provided documentation is based exclusively on an automated n8n workflow. It respects content policies and handles only legal, public data.