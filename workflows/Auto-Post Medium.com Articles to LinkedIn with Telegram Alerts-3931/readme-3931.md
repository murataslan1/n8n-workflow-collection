Auto-Post Medium.com Articles to LinkedIn with Telegram Alerts

https://n8nworkflows.xyz/workflows/auto-post-medium-com-articles-to-linkedin-with-telegram-alerts-3931


# Auto-Post Medium.com Articles to LinkedIn with Telegram Alerts

### 1. Workflow Overview

This workflow automates the process of sharing Medium.com articles to LinkedIn twice daily with notification alerts sent via Telegram. It targets developers, tech creators, community managers, and busy professionals who want to maintain consistent LinkedIn engagement without manual effort.

The workflow logically groups into these blocks:

- **1.1 Scheduling Trigger**: Runs the workflow twice daily at 9:00 AM and 7:00 PM.

- **1.2 Tag Selection**: Picks a random Medium tag (e.g., android, kotlin) for article fetching.

- **1.3 Airtable Lookup**: Retrieves the list of previously posted articles to avoid duplicates.

- **1.4 Article Fetching and Filtering**: Fetches article IDs from Medium API for the chosen tag and filters out those already posted.

- **1.5 Article Retrieval and Content Preparation**: Selects a new article, fetches its full content and image, and prepares data for LinkedIn posting.

- **1.6 LinkedIn Posting**: Posts the article snippet along with the image to LinkedIn.

- **1.7 Airtable Update**: Stores the posted article ID in Airtable to prevent future reposting.

- **1.8 Telegram Notification**: Sends a confirmation message via Telegram after successful posting.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduling Trigger

- **Overview:** Initiates the workflow twice daily at specified times (9:00 AM and 7:00 PM).

- **Nodes Involved:**  
  - `Morning  9 Clock`

- **Node Details:**

  - **Morning  9 Clock**  
    - Type: Schedule Trigger  
    - Role: Cron scheduler triggering the workflow at 09:00 and 19:00 daily.  
    - Configuration: Cron expression set as `0 9,19 * * *` (runs at 9 AM and 7 PM every day).  
    - Inputs: None (trigger node).  
    - Outputs: Connects to `get random tags` node.  
    - Potential Failures: Cron misconfiguration, timezone issues (configured for "Asia/Kolkata").  
    - Version: n8n v1.2 or newer recommended for schedule trigger stability.

---

#### 1.2 Tag Selection

- **Overview:** Randomly selects one tag from a predefined list of Medium tags related to Android development to use in the article search query.

- **Nodes Involved:**  
  - `get random tags`

- **Node Details:**

  - **get random tags**  
    - Type: Code (JavaScript)  
    - Role: Returns a random tag from the list `["android", "androiddev", "kotlin", "jetpack-compose", "android-appdevelopment", "app-development"]` as an array of JSON objects with a single element.  
    - Key Expression: Custom JS function `getRandomValuesAsObjects()` returns one random tag object.  
    - Inputs: Triggered by schedule or fallback from If node.  
    - Outputs: Passes selected tag value to Airtable search node.  
    - Edge Cases: Empty tag list (unlikely), random selection bias negligible.  
    - Version: Any n8n version supporting JS code node.

---

#### 1.3 Airtable Lookup

- **Overview:** Fetches the list of article IDs that have already been posted and stored in Airtable to prevent reposting.

- **Nodes Involved:**  
  - `Get List of records used`  
  - `map used articls ids`

- **Node Details:**

  - **Get List of records used**  
    - Type: Airtable  
    - Role: Searches the Airtable base "Linkdin" and table "Used Articles" to retrieve records representing posted articles.  
    - Configuration: Uses Airtable Personal Access Token credential; operation set to "search" with no filters to fetch all records.  
    - Inputs: Receives tag selection output.  
    - Outputs: Sends full Airtable records to code node.  
    - Edge Cases: Airtable API rate limits, network errors, invalid credentials.  
    - Version: Airtable API v2.1 integration.

  - **map used articls ids**  
    - Type: Code (JavaScript)  
    - Role: Extracts the `value` field (article IDs) from Airtable records into a simple array for filtering.  
    - Key Expression: Maps all items to an array of `item.json.value`.  
    - Inputs: Airtable record list.  
    - Outputs: Array of used article IDs to filtering node.  
    - Edge Cases: Empty Airtable table returns empty array, handled gracefully.

---

#### 1.4 Article Fetching and Filtering

- **Overview:** Using the random tag, fetches article IDs from Medium API, then filters out IDs already recorded in Airtable.

- **Nodes Involved:**  
  - `fetch article ids from tag`  
  - `filter only unused Ids`

- **Node Details:**

  - **fetch article ids from tag**  
    - Type: HTTP Request  
    - Role: Calls Medium API (via RapidAPI) endpoint to search for articles by the selected tag.  
    - Configuration:  
      - Method: GET  
      - URL: Dynamic, based on tag: `https://medium2.p.rapidapi.com/search/articles?query={{ $('get random tags').first().json.value }}`  
      - Headers: `x-rapidapi-host: medium2.p.rapidapi.com`, `x-rapidapi-key: <user_api_key>` (must be set)  
    - Inputs: Receives tag from `map used articls ids`.  
    - Outputs: Medium article IDs list to filtering node.  
    - Edge Cases: API key missing or invalid, API downtime, response format changes, rate limiting.  
    - Version: HTTP Request node v4.2 or newer recommended for header parameters.

  - **filter only unused Ids**  
    - Type: Filter  
    - Role: Filters out article IDs already present in Airtable to avoid reposting duplicates.  
    - Configuration: Condition checks if Airtable used article IDs array does not contain the current article ID.  
    - Inputs: Medium article IDs and Airtable used IDs.  
    - Outputs: Passes only new article IDs to next node.  
    - Edge Cases: No new articles found (empty output), all IDs filtered out, possible empty posting cycles.

---

#### 1.5 Article Retrieval and Content Preparation

- **Overview:** Fetches full article content and image of a selected unused article to prepare for LinkedIn posting.

- **Nodes Involved:**  
  - `Fetch Medium post using Article Id`  
  - `If`  
  - `Fetch Medium post content`  
  - `download image for post`

- **Node Details:**

  - **Fetch Medium post using Article Id**  
    - Type: HTTP Request  
    - Role: Fetches detailed metadata for a selected article ID from Medium API.  
    - Configuration:  
      - URL: `https://medium2.p.rapidapi.com/article/{{ $json.articles.randomItem() }}` dynamically picks a random article ID from filtered list.  
      - Headers: Same RapidAPI headers as before.  
    - Inputs: Filtered unused article IDs.  
    - Outputs: Article metadata (including title, image_url, url).  
    - Edge Cases: API errors, missing fields, randomItem() failure if empty list.

  - **If**  
    - Type: Conditional (If)  
    - Role: Checks if the `image_url` field is non-empty to ensure posts have images.  
    - Condition: `image_url` string is not empty.  
    - Inputs: Article metadata.  
    - Outputs:  
      - True: Proceeds to fetch content.  
      - False: Loops back to tag selection (`get random tags`) to retry with a different tag.  
    - Edge Cases: Missing or invalid image_url, infinite loop risk if all articles lack images.

  - **Fetch Medium post content**  
    - Type: HTTP Request  
    - Role: Retrieves the full content of the article by article ID.  
    - Configuration:  
      - URL: `https://medium2.p.rapidapi.com/article/{{$json.id}}/content`  
      - Headers: RapidAPI headers.  
    - Inputs: Article metadata from `If` node.  
    - Outputs: Article content JSON to next node.  
    - Edge Cases: API failures, content missing or truncated.

  - **download image for post**  
    - Type: HTTP Request  
    - Role: Downloads the article's image for inclusion in LinkedIn post.  
    - Configuration:  
      - URL: `={{ $('If').item.json.image_url }}`  
      - Headers: User-Agent header set to "Mozilla/5.0" to mimic browser request.  
    - Inputs: Article content node output.  
    - Outputs: Binary image data to LinkedIn post node.  
    - Edge Cases: Image URL invalid, download failures, large image size causing timeout.

---

#### 1.6 LinkedIn Posting

- **Overview:** Publishes the prepared article snippet and image to LinkedIn profile or company page.

- **Nodes Involved:**  
  - `make Linkedin post`

- **Node Details:**

  - **make Linkedin post**  
    - Type: LinkedIn  
    - Role: Posts a snippet of the article content (up to 600 characters) plus article link and hashtags.  
    - Configuration:  
      - Text: Uses substring of article content from `Fetch Medium post content` node + article URL with custom domain `freedium.cfd` + multiple tech-related hashtags.  
      - Title: Article title prefixed with "💫" and suffixed with "⭐".  
      - Visibility: Public.  
      - Share Media Category: IMAGE (includes downloaded image).  
      - OAuth2 credentials required for LinkedIn API authentication.  
      - Person ID: Set to a specific profile or page ID (example `"BQYGc4bH9N"`).  
    - Inputs: Image binary and article text.  
    - Outputs: Success triggers Airtable update.  
    - Edge Cases: OAuth token expiry, API rate limits, content length restrictions, image upload failures.

---

#### 1.7 Airtable Update

- **Overview:** Records the posted article ID in Airtable to avoid reposting in future runs.

- **Nodes Involved:**  
  - `Update the used node`

- **Node Details:**

  - **Update the used node**  
    - Type: Airtable  
    - Role: Creates a new record in the "Used Articles" table with the article ID just posted.  
    - Configuration:  
      - Fields: `id` and `value` both set from `download image for post` node's article ID.  
      - Credentials: Airtable Personal Access Token.  
      - Operation: Create record (no update or search).  
    - Inputs: LinkedIn post success output.  
    - Outputs: Triggers Telegram notification.  
    - Edge Cases: Airtable API errors, field mapping issues, duplicate record creation if node retried.

---

#### 1.8 Telegram Notification

- **Overview:** Sends a Telegram message confirming successful LinkedIn posting with article title and Airtable record ID.

- **Nodes Involved:**  
  - `sent the status`

- **Node Details:**

  - **sent the status**  
    - Type: Telegram  
    - Role: Sends a text message to a specified chat ID with post success details.  
    - Configuration:  
      - Chat ID: User-specific Telegram chat ID.  
      - Message: Includes LinkedIn post confirmation, article title, and Airtable record ID.  
      - Reply Markup: Inline keyboard (configured but details unspecified).  
      - Credentials: Telegram Bot Token.  
    - Inputs: Airtable update completion.  
    - Outputs: Workflow ends here.  
    - Edge Cases: Invalid chat ID, bot token invalid, network errors, message rate limiting.

---

### 3. Summary Table

| Node Name                 | Node Type         | Functional Role                    | Input Node(s)               | Output Node(s)               | Sticky Note                                    |
|---------------------------|-------------------|----------------------------------|-----------------------------|-----------------------------|------------------------------------------------|
| Morning  9 Clock           | Schedule Trigger  | Workflow scheduler                | None                        | get random tags              |                                                |
| get random tags           | Code              | Selects random Medium tag         | Morning  9 Clock, If         | Get List of records used     |                                                |
| Get List of records used  | Airtable          | Fetch previously posted articles  | get random tags              | map used articls ids         |                                                |
| map used articls ids      | Code              | Extracts article IDs from Airtable| Get List of records used     | fetch article ids from tag   |                                                |
| fetch article ids from tag| HTTP Request      | Fetches article IDs by tag        | map used articls ids         | filter only unused Ids       |                                                |
| filter only unused Ids    | Filter            | Filters out duplicates            | fetch article ids from tag   | Fetch Medium post using Article Id |                                         |
| Fetch Medium post using Article Id | HTTP Request | Fetches article metadata          | filter only unused Ids       | If                          |                                                |
| If                        | If                | Checks for image presence         | Fetch Medium post using Article Id | Fetch Medium post content (true), get random tags (false) |                              |
| Fetch Medium post content | HTTP Request      | Fetches full article content      | If (true)                   | download image for post      |                                                |
| download image for post   | HTTP Request      | Downloads article image           | Fetch Medium post content    | make Linkedin post          |                                                |
| make Linkedin post        | LinkedIn          | Posts article on LinkedIn         | download image for post      | Update the used node         |                                                |
| Update the used node      | Airtable          | Stores posted article ID          | make Linkedin post           | sent the status              |                                                |
| sent the status           | Telegram          | Sends Telegram confirmation       | Update the used node         | None                        |                                                |
| Sticky Note               | Sticky Note       | Documentation note                | None                        | None                        | # 📢 Auto-Post Medium Articles to LinkedIn with Telegram Alerts... |
| Sticky Note1              | Sticky Note       | Features summary                  | None                        | None                        | ## ✅ Features...                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Cron Trigger Node:**
   - Node Type: Schedule Trigger  
   - Set Cron Expression: `0 9,19 * * *` (run at 9 AM and 7 PM daily)  
   - Timezone: Asia/Kolkata  
   - Connect output to next node.

2. **Add Code Node for Random Tag Selection:**
   - Node Type: Code (JavaScript)  
   - Insert JS code to pick one random tag from:  
     `["android", "androiddev", "kotlin", "jetpack-compose", "android-appdevelopment", "app-development"]`  
   - Output format: `[ { json: { value: "selected_tag" } } ]`  
   - Connect from schedule trigger.

3. **Add Airtable Search Node to Retrieve Used Article IDs:**
   - Node Type: Airtable  
   - Credentials: Airtable Personal Access Token  
   - Base: Your Airtable base ID (e.g., "appt6kHkRkLlUh033")  
   - Table: "Used Articles"  
   - Operation: Search (no filters to get all records)  
   - Connect from tag selection node.

4. **Add Code Node to Map Airtable Records to ID Array:**
   - Node Type: Code (JavaScript)  
   - JS Code: Map all Airtable records to an array of `value` field strings  
   - Connect from Airtable search node.

5. **Add HTTP Request Node to Fetch Articles by Tag from Medium API:**
   - Node Type: HTTP Request  
   - URL: `https://medium2.p.rapidapi.com/search/articles?query={{ $('get random tags').first().json.value }}`  
   - Method: GET  
   - Headers:  
     - `x-rapidapi-host`: `medium2.p.rapidapi.com`  
     - `x-rapidapi-key`: Your RapidAPI key (set in node credentials or headers)  
   - Connect from mapping code node.

6. **Add Filter Node to Exclude Already Used Article IDs:**
   - Node Type: Filter  
   - Condition: Filter article IDs so that the Airtable `value` array does not contain the article ID  
   - Connect from HTTP request node.

7. **Add HTTP Request Node to Fetch Full Article Metadata:**
   - Node Type: HTTP Request  
   - URL: `https://medium2.p.rapidapi.com/article/{{ $json.articles.randomItem() }}` (select random article from filtered list)  
   - Headers: Same as previous HTTP node  
   - Connect from filter node.

8. **Add If Node to Check for Presence of Image URL:**
   - Node Type: If  
   - Condition: Check if `image_url` is not empty  
   - True branch: Continue  
   - False branch: Connect back to tag selection node (to retry)  
   - Connect from article metadata node.

9. **Add HTTP Request Node to Fetch Full Article Content:**
   - Node Type: HTTP Request  
   - URL: `https://medium2.p.rapidapi.com/article/{{$json.id}}/content`  
   - Headers: Same as above  
   - Connect from If node (true branch).

10. **Add HTTP Request Node to Download Article Image:**
    - Node Type: HTTP Request  
    - URL: `={{ $('If').item.json.image_url }}` (dynamic from If node)  
    - Headers: Set `User-Agent` to `Mozilla/5.0`  
    - Connect from article content node.

11. **Add LinkedIn Node to Post Article:**
    - Node Type: LinkedIn  
    - Credentials: LinkedIn OAuth2 credentials set to allow posting on profile or company page  
    - Text: Use substring of article content (first 600 chars) + article URL + hashtags  
    - Title: Use article title with emojis  
    - Visibility: Public  
    - Share Media Category: IMAGE  
    - Connect from image download node.

12. **Add Airtable Create Node to Store Posted Article ID:**
    - Node Type: Airtable  
    - Credentials: Airtable Personal Access Token  
    - Base and Table same as step 3  
    - Operation: Create record with fields `id` and `value` both set to posted article ID  
    - Connect from LinkedIn post node.

13. **Add Telegram Node to Send Confirmation Message:**
    - Node Type: Telegram  
    - Credentials: Telegram Bot Token  
    - Chat ID: Your user chat ID  
    - Message Text: Confirmation with article title and Airtable record ID  
    - Connect from Airtable create node.

14. **Add Sticky Notes for Documentation (Optional):**
    - Use sticky notes to add overview and feature summaries for ease of understanding.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                   | Context or Link                                                                                 |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------|
| This workflow automates LinkedIn posts from Medium articles twice daily with duplicate prevention and Telegram alerts.                                         | Base workflow description                                                                       |
| Airtable table setup: Table named "Used Articles" with a single text column "ArticleID" to track posted articles.                                              | Airtable configuration instructions                                                           |
| Medium API setup requires RapidAPI subscription and API key from https://mediumapi.com or RapidAPI platform.                                                  | Medium API setup instructions                                                                  |
| Telegram bot setup via @BotFather and obtaining chat ID via @userinfobot.                                                                                      | Telegram bot setup instructions                                                                |
| LinkedIn OAuth2 app creation and permission configuration required for posting to profile or company page.                                                    | LinkedIn developer portal                                                                       |
| Customize tags, posting times, and LinkedIn post formatting by editing code node and cron schedule.                                                          | Customization tips section                                                                      |
| Link to Medium API documentation: https://mediumapi.com/docs/                                                                                                 | For API endpoint details                                                                        |
| Link to n8n documentation on Airtable node: https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.airtable/                                      | For Airtable node usage                                                                         |
| Link to n8n LinkedIn node docs: https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.linkedin/                                                   | For LinkedIn node configuration                                                                 |
| Link to n8n Telegram node docs: https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.telegram/                                                   | For Telegram notification setup                                                                |

---

This structured reference fully describes the workflow’s architecture, nodes, configuration, and reproduction steps, enabling advanced users and automation agents to understand, modify, or recreate it reliably.