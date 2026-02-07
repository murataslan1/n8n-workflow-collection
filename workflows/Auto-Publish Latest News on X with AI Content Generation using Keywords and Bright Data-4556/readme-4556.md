Auto-Publish Latest News on X with AI Content Generation using Keywords and Bright Data

https://n8nworkflows.xyz/workflows/auto-publish-latest-news-on-x-with-ai-content-generation-using-keywords-and-bright-data-4556


# Auto-Publish Latest News on X with AI Content Generation using Keywords and Bright Data

### 1. Workflow Overview

This workflow automates the process of publishing the latest news on X (formerly Twitter) and other social media platforms by leveraging AI-generated content based on keywords and location-specific data. It integrates news scraping from Google News via Bright Data, AI-based content generation tailored for the X platform, and subsequent posting and logging of the tweets. The logical structure is divided into four main blocks:

- **1.1 Input Reception:** Captures user inputs via a web form for news topic and country.
- **1.2 News Scraping and Snapshot Monitoring:** Initiates a news scrape from Google News, monitors the scraping progress via Bright Data snapshot IDs, and retrieves scraped data.
- **1.3 AI Content Generation and Posting:** Uses an AI agent with OpenAI GPT-4o to generate concise, localized X posts from news headlines and URLs, then publishes tweets.
- **1.4 Post-Publishing Logging and Notification:** Converts tweet IDs to URLs, records the tweet data in Google Sheets, and sends a success notification email.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:** This block gathers required parameters (news keyword and country) from the user via a web form to trigger the automation.
- **Nodes Involved:** 
  - On form submission
- **Node Details:**
  - **On form submission**
    - *Type:* Form Trigger
    - *Role:* Entry point for the workflow; listens for form submissions.
    - *Configuration:* 
      - Webhook ID provided (unique endpoint).
      - Form titled "News Publisher" with fields:
        - News Name (text, required)
        - Country (dropdown with options: US, IN, GB, AU; required)
      - Form description: "publish latest news to direct social media"
    - *Expressions:* Uses form fields directly in subsequent nodes.
    - *Input/Output:* No input; outputs form data as JSON.
    - *Edge cases:* Form submission failures, missing required fields.
    - *Version:* 2.2

#### 2.2 News Scraping and Snapshot Monitoring

- **Overview:** Initiates news scraping using Bright Data API with the given keyword and country, monitors the scraping process via snapshot ID status checks, and retrieves the news URL once ready.
- **Nodes Involved:**
  - Fetch Latest News
  - Check Snapshot ID Status
  - Wait 1 Minutes
  - Check Final Status1
  - Get News URL from Google News
- **Node Details:**

  - **Fetch Latest News**
    - *Type:* HTTP Request
    - *Role:* Triggers Bright Data dataset scrape for Google News based on user inputs.
    - *Configuration:* 
      - POST to Bright Data API endpoint `https://api.brightdata.com/datasets/v3/trigger`
      - JSON body includes URL (Google News), keyword (from form), country (from form), language empty.
      - Query parameters specify dataset_id, error inclusion, and limit multiple results.
      - Authorization header with Bearer token.
    - *Input:* From form submission node.
    - *Output:* JSON response including snapshot_id.
    - *Edge cases:* API auth failures, invalid parameters, network timeouts.
    - *Version:* 4.2

  - **Check Snapshot ID Status**
    - *Type:* HTTP Request
    - *Role:* Polls Bright Data to check progress status of scraping using snapshot_id.
    - *Configuration:* 
      - GET request to `https://api.brightdata.com/datasets/v3/progress/{{ $json.snapshot_id }}`
      - Authorization header with Bearer token.
      - Always outputs data to ensure status is checked repeatedly.
    - *Input:* Output from Fetch Latest News or from Check Final Status1 fallback.
    - *Output:* JSON with current status (e.g., "ready").
    - *Edge cases:* Snapshot ID invalid or expired, API errors, rate limits.
    - *Version:* 4.2

  - **Wait 1 Minutes**
    - *Type:* Wait
    - *Role:* Delays workflow for 30 seconds between polling attempts to avoid hitting API rate limits.
    - *Configuration:* Wait time set to 30 seconds (though named "Wait 1 Minutes").
    - *Input:* From Check Snapshot ID Status or Check Final Status1.
    - *Output:* Pass-through after delay.
    - *Edge cases:* Workflow timeout or cancellation during wait.
    - *Version:* 1.1

  - **Check Final Status1**
    - *Type:* If
    - *Role:* Checks if snapshot status equals "ready" to decide next steps.
    - *Configuration:* Condition tests if `$json.status === 'ready'`.
    - *Input:* From Wait 1 Minutes.
    - *Output:* 
      - True branch: proceeds to Get News URL from Google News.
      - False branch: loops back to Check Snapshot ID Status for another poll.
    - *Edge cases:* Missing or malformed status, infinite loops if status never "ready".
    - *Version:* 2.2

  - **Get News URL from Google News**
    - *Type:* HTTP Request
    - *Role:* Retrieves the actual news data snapshot from Bright Data once scraping is ready.
    - *Configuration:*
      - GET request to `https://api.brightdata.com/datasets/v3/snapshot/{{ $json.snapshot_id }}`
      - Query parameter: format=json
      - Authorization header with Bearer token.
    - *Input:* From Check Final Status1 true branch.
    - *Output:* JSON containing news data including title and URL.
    - *Edge cases:* Snapshot expired, incorrect snapshot_id, empty or malformed data.
    - *Version:* 4.2

#### 2.3 AI Content Generation and Posting

- **Overview:** Uses the news headline and URL to generate a concise, localized social media post for X via a LangChain AI agent powered by OpenAI GPT-4o, then publishes the tweet.
- **Nodes Involved:**
  - AI Agent
  - OpenAI Chat Model
  - X
  - tweet to URL
- **Node Details:**

  - **AI Agent**
    - *Type:* LangChain Agent
    - *Role:* Orchestrates AI prompt workflow by receiving inputs and generating a tweet text.
    - *Configuration:* 
      - Prompt instructs the agent to act as a professional social media strategist.
      - Inputs: news headline (`{{ $json.title }}`), news URL (`{{ $json.url }}`), country code (`{{ $json.country }}`).
      - Output: Tweet text in English, max 260 characters, with relevant hashtags, no intros/outros or brand mentions.
      - Uses OpenAI GPT-4o as language model.
    - *Input:* From Get News URL from Google News.
    - *Output:* JSON including `output` field with tweet text.
    - *Edge cases:* AI API errors, prompt failures, character length violations.
    - *Version:* 2

  - **OpenAI Chat Model**
    - *Type:* LangChain OpenAI Chat Model
    - *Role:* Provides GPT-4o language model backend for the AI Agent.
    - *Configuration:* Model set to "gpt-4o".
    - *Credentials:* OpenAI API key configured.
    - *Input:* Connected as AI language model for AI Agent.
    - *Output:* Text completion results.
    - *Edge cases:* API rate limits, auth errors.
    - *Version:* 1.2

  - **X**
    - *Type:* Twitter Node (OAuth2)
    - *Role:* Publishes the AI-generated tweet on X.
    - *Configuration:* 
      - Text set to AI Agent's output `={{ $json.output }}`.
      - OAuth2 credentials for X account configured.
    - *Input:* Output of AI Agent.
    - *Output:* Tweet metadata including tweet ID.
    - *Edge cases:* Posting errors, API quota limits, OAuth token expiration.
    - *Version:* 2

  - **tweet to URL**
    - *Type:* Code (JavaScript)
    - *Role:* Converts the tweet ID returned from X into a clickable URL.
    - *Configuration:*
      - Script extracts tweet ID from JSON fields (`tweetId`, `id`, `tweet_id`).
      - Generates URL: `https://twitter.com/i/web/status/{tweetId}`.
      - Appends `tweetUrl` field to output JSON.
    - *Input:* Tweet metadata from X.
    - *Output:* JSON with added `tweetUrl`.
    - *Edge cases:* Missing or invalid tweet ID.
    - *Version:* 2

#### 2.4 Post-Publishing Logging and Notification

- **Overview:** Logs tweet URL and message to a Google Sheet and sends a confirmation email to the user.
- **Nodes Involved:**
  - Google Sheets
  - Gmail
- **Node Details:**

  - **Google Sheets**
    - *Type:* Google Sheets
    - *Role:* Appends tweet URL and message to a specific Google Sheet.
    - *Configuration:*
      - Document ID and sheet name set to a specific sheet.
      - Columns mapped: "Tweet URL" from `tweetUrl`, "Tweet Message" from `text`.
      - Append operation mode.
      - OAuth2 credentials configured.
    - *Input:* From tweet to URL node.
    - *Output:* Confirmation of sheet append.
    - *Edge cases:* Sheet access permission errors, quota exceeded.
    - *Version:* 4.6

  - **Gmail**
    - *Type:* Gmail
    - *Role:* Sends a notification email confirming tweet publication.
    - *Configuration:*
      - Recipient: raushan@iwantonlinemarketing.com
      - Subject: "Your News Has Been Published on X (Twitter)"
      - HTML message includes a link to the tweet URL.
      - OAuth2 credentials configured.
    - *Input:* From Google Sheets.
    - *Output:* Email delivery status.
    - *Edge cases:* Email sending failures, invalid credentials.
    - *Version:* 2.1

---

### 3. Summary Table

| Node Name               | Node Type                      | Functional Role                                    | Input Node(s)               | Output Node(s)            | Sticky Note                                       |
|-------------------------|--------------------------------|---------------------------------------------------|-----------------------------|---------------------------|--------------------------------------------------|
| On form submission      | Form Trigger                   | Entry point: Collects news name and country input | —                           | Fetch Latest News          |                                                  |
| Fetch Latest News       | HTTP Request                  | Triggers Bright Data scrape with user inputs      | On form submission          | Check Snapshot ID Status   | ## Scrap Latest News and Generate Content        |
| Check Snapshot ID Status| HTTP Request                  | Checks scraping progress status by snapshot_id    | Fetch Latest News, Check Final Status1 | Wait 1 Minutes           | ## Checking Snapshot ID status in While Loops    |
| Wait 1 Minutes          | Wait                          | Delays workflow between polling attempts          | Check Snapshot ID Status, Check Final Status1 | Check Final Status1      | ## Checking Snapshot ID status in While Loops    |
| Check Final Status1     | If                            | Tests if snapshot status is "ready"                | Wait 1 Minutes             | Get News URL from Google News, Check Snapshot ID Status | ## Checking Snapshot ID status in While Loops    |
| Get News URL from Google News | HTTP Request            | Retrieves scraped news data snapshot               | Check Final Status1 (true) | AI Agent                  | ## Scrap Latest News and Generate Content        |
| AI Agent               | LangChain Agent               | Generates localized tweet content                   | Get News URL from Google News | X                        | ## Scrap Latest News and Generate Content        |
| OpenAI Chat Model      | LangChain OpenAI Chat Model   | Provides GPT-4o model for AI Agent                  | AI Agent (ai_languageModel) | AI Agent                  | ## Scrap Latest News and Generate Content        |
| X                      | Twitter Node (OAuth2)         | Publishes tweet on X platform                        | AI Agent                   | tweet to URL              | ## Publishing on X                                |
| tweet to URL           | Code (JavaScript)             | Creates tweet URL from tweet ID                      | X                          | Google Sheets             | ## Publishing on X                                |
| Google Sheets          | Google Sheets                 | Logs tweet data into Google Sheet                    | tweet to URL               | Gmail                     | ## Update URL in Sheet and Sent Success Mail     |
| Gmail                  | Gmail                        | Sends confirmation email with tweet link            | Google Sheets              | —                         | ## Update URL in Sheet and Sent Success Mail     |

---

### 4. Reproducing the Workflow from Scratch

1. **Create** a new workflow in n8n.

2. **Add "On form submission" node:**
   - Type: Form Trigger
   - Configure webhook ID (auto-generated or custom).
   - Set Form Title: "News Publisher"
   - Add fields:
     - "News Name" (Text, required)
     - "Country" (Dropdown, options: US, IN, GB, AU, required)
   - Save.

3. **Add "Fetch Latest News" node:**
   - Type: HTTP Request
   - Method: POST
   - URL: `https://api.brightdata.com/datasets/v3/trigger`
   - Body Content (JSON):
     ```json
     [
       {
         "url": "https://news.google.com/",
         "keyword": "={{ $json['News Name'] }}",
         "country": "={{ $json.Country }}",
         "language": ""
       }
     ]
     ```
   - Query Parameters:
     - dataset_id = gd_lnsxoxzi1omrwnka5r
     - include_errors = true
     - limit_multiple_results = 1
   - Headers:
     - Authorization: Bearer *Your Bright Data API Token*
   - Connect "On form submission" → "Fetch Latest News".

4. **Add "Check Snapshot ID Status" node:**
   - Type: HTTP Request
   - Method: GET
   - URL: `https://api.brightdata.com/datasets/v3/progress/{{ $json.snapshot_id }}`
   - Headers:
     - Authorization: Bearer *Your Bright Data API Token*
   - Set "Always Output Data" enabled.
   - Connect "Fetch Latest News" → "Check Snapshot ID Status".

5. **Add "Wait 1 Minutes" node:**
   - Type: Wait
   - Set wait time to 30 seconds.
   - Connect "Check Snapshot ID Status" → "Wait 1 Minutes".

6. **Add "Check Final Status1" node:**
   - Type: If
   - Condition: `$json.status === 'ready'`
   - Connect "Wait 1 Minutes" → "Check Final Status1".

7. **Configure "Check Final Status1" branches:**
   - True branch → "Get News URL from Google News"
   - False branch → Loop back to "Check Snapshot ID Status".

8. **Add "Get News URL from Google News" node:**
   - Type: HTTP Request
   - Method: GET
   - URL: `https://api.brightdata.com/datasets/v3/snapshot/{{ $json.snapshot_id }}`
   - Query Parameter: format=json
   - Headers:
     - Authorization: Bearer *Your Bright Data API Token*
   - Connect "Check Final Status1" (true) → "Get News URL from Google News".

9. **Add "OpenAI Chat Model" node:**
   - Type: LangChain OpenAI Chat Model
   - Model: gpt-4o
   - Credentials: Set OpenAI API key
   - Connect as AI language model for "AI Agent".

10. **Add "AI Agent" node:**
    - Type: LangChain Agent
    - Prompt:  
      ```
      You are a professional social media strategist. You'll receive three inputs: a news headline, a URL to the full article, and a country code. 
      First, understand the headline like a news summary. Then analyze the URL content to extract or simulate key facts, context, quotes, or figures. Use the country code to adjust the tone and hashtags to suit the local audience. 
      Your task is to write a post for X (formerly Twitter), within 260 characters, that is clear, engaging, and informative. 
      - Do not include any intro, outro, publisher names, or brand mentions. 
      - Only output the final tweet text with relevant, topic-based and country-specific hashtags.
      - always output in english langauge.
      here is the title: "{{ $json.title }}" 
      here is the URL: "{{ $json.url }}"
      country code: "{{ $json.country }}"
      ```
    - Connect "Get News URL from Google News" → "AI Agent".
    - Connect "OpenAI Chat Model" as AI language model for this node.

11. **Add "X" (Twitter) node:**
    - Type: Twitter (OAuth2)
    - Text: `={{ $json.output }}`
    - Credentials: Configure OAuth2 with X account.
    - Connect "AI Agent" → "X".

12. **Add "tweet to URL" node (Code):**
    - Type: Code (JavaScript)
    - Code:
      ```javascript
      function generateTweetUrl(tweetId) {
        if (!tweetId || isNaN(tweetId)) {
          return null;
        }
        return `https://twitter.com/i/web/status/${tweetId}`;
      }

      return $input.all().map(item => {
        const tweetId = item.json.tweetId || item.json.id || item.json.tweet_id;
        const tweetUrl = generateTweetUrl(tweetId);
        return {
          json: {
            ...item.json,
            tweetUrl,
          }
        };
      });
      ```
    - Connect "X" → "tweet to URL".

13. **Add "Google Sheets" node:**
    - Type: Google Sheets
    - Operation: Append
    - Document ID: *Your Google Sheet ID*
    - Sheet Name: gid=0 (or sheet name)
    - Columns Mapping:
      - "Tweet URL" → `={{ $json.tweetUrl }}`
      - "Tweet Message" → `={{ $json.text }}`
    - Credentials: Configure Google Sheets OAuth2.
    - Connect "tweet to URL" → "Google Sheets".

14. **Add "Gmail" node:**
    - Type: Gmail
    - Send To: raushan@iwantonlinemarketing.com
    - Subject: "Your News Has Been Published on X (Twitter)"
    - Message (HTML):
      ```html
      <p>Hello,</p>
      <p>Your news tweet has been published successfully on X (formerly Twitter).</p>
      <p>You can view it here: <a href="{{ $json['Tweet URL'] }}" target="_blank">Click to view your tweet</a></p>
      <p>Best regards,<br> Team</p>
      ```
    - Credentials: Configure Gmail OAuth2.
    - Connect "Google Sheets" → "Gmail".

15. **Save and activate the workflow.**

---

### 5. General Notes & Resources

| Note Content                                                                                   | Context or Link                                                                                               |
|-----------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| Workflow uses Bright Data API for news scraping; requires valid Bright Data API bearer tokens.| Bright Data API documentation: https://brightdata.com/docs/api/datasets                                     |
| AI Agent leverages LangChain with OpenAI GPT-4o model for content generation.                  | OpenAI API docs: https://platform.openai.com/docs/models/gpt-4                                              |
| Posting is done on X (formerly Twitter) via OAuth2 authentication.                            | Twitter API docs: https://developer.twitter.com/en/docs/authentication/oauth-2-0                             |
| Google Sheets and Gmail nodes require OAuth2 credentials with appropriate scopes.              | n8n credentials setup guides: https://docs.n8n.io/credentials/setup/                                          |
| Sticky notes in workflow clarify snapshot polling loop, content generation, publishing, and logging. | Helps maintain and understand workflow logic flow.                                                           |

---

**Disclaimer:**  
The text provided is exclusively derived from an automated workflow created with n8n, an integration and automation platform. This process strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All data processed is legal and publicly available.