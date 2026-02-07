Auto-Post Dev.to Articles to LinkedIn with Airtable Tracking & Telegram Alerts

https://n8nworkflows.xyz/workflows/auto-post-dev-to-articles-to-linkedin-with-airtable-tracking---telegram-alerts-3883


# Auto-Post Dev.to Articles to LinkedIn with Airtable Tracking & Telegram Alerts

### 1. Workflow Overview

This workflow automates posting of Dev.to articles to LinkedIn while tracking posted articles in Airtable and sending Telegram alerts upon successful posts. It is designed for developers, tech creators, community managers, and busy professionals who want to maintain consistent LinkedIn engagement without manual effort.

**Logical Blocks:**

- **1.1 Schedule Trigger:** Initiates the workflow twice daily at 9:00 AM and 7:00 PM.
- **1.2 Tag Selection:** Selects a random Dev.to tag to fetch articles.
- **1.3 Airtable Lookup:** Retrieves posted article IDs from Airtable to prevent duplicates.
- **1.4 Articles Fetching:** Calls Dev.to API to get latest articles by the selected tag.
- **1.5 Filtering:** Filters out articles already posted and non-English articles.
- **1.6 Random Article Selection:** Picks a random unused article for posting.
- **1.7 Image Download:** Downloads the social image of the selected article.
- **1.8 LinkedIn Posting:** Posts the article with image and formatted text on LinkedIn.
- **1.9 Airtable Update:** Adds the posted article ID to Airtable for tracking.
- **1.10 Telegram Notification:** Sends a Telegram message confirming successful post.

---

### 2. Block-by-Block Analysis

#### 1.1 Schedule Trigger

- **Overview:** Triggers the workflow twice daily to automate timely posts.
- **Nodes Involved:**  
  - Morning 9 Clock (Schedule Trigger)
- **Node Details:**  
  - Type: Schedule Trigger  
  - Configuration: Cron expressions set to trigger at 9:00 AM and 7:00 PM daily (`0 9,19 * * *`)  
  - Input: None (trigger)  
  - Output: Initiates "get random tags" node  
  - Edge cases: Cron misconfiguration could cause missed triggers; timezone set to Asia/Kolkata requires adjustment if used elsewhere.

#### 1.2 Tag Selection

- **Overview:** Picks one random Dev.to tag from a predefined list to diversify content.
- **Nodes Involved:**  
  - get random tags (Code node)
- **Node Details:**  
  - Type: Code  
  - Configuration: JavaScript array of tags: ["android", "androiddev", "kotlin", "jetpackcompose", "mobiledev", "mobile", "java", "oops"]  
  - Function: Returns one random tag object `{json: {value: <tag>}}`  
  - Input: Trigger from Schedule Trigger  
  - Output: Passes selected tag to "Get List of records used" node  
  - Edge cases: Empty tag list or invalid tag strings would lead to API fetch errors.

#### 1.3 Airtable Lookup

- **Overview:** Retrieves all previously posted article IDs from Airtable to avoid reposting.
- **Nodes Involved:**  
  - Get List of records used (Airtable)  
  - map used articls ids (Code)
- **Node Details:**  
  - *Get List of records used*  
    - Type: Airtable node  
    - Operation: Search all records from base "Linkdin" and table "Used Articles"  
    - Credentials: Airtable Personal Access Token  
    - Input: Receives tag input (though not used here)  
    - Output: List of article IDs stored previously  
    - Edge cases: API rate limits, auth errors, or connectivity issues with Airtable  
  - *map used articls ids*  
    - Type: Code  
    - Function: Maps Airtable records to a simple array of article ID strings under `values` key  
    - Input: Airtable output  
    - Output: Passes array of used article IDs for filtering  
    - Edge cases: Empty Airtable table results in empty array, handled gracefully.

#### 1.4 Articles Fetching

- **Overview:** Fetches latest articles from Dev.to API using the selected tag.
- **Nodes Involved:**  
  - fetch articles from Url (HTTP Request)
- **Node Details:**  
  - Type: HTTP Request  
  - Configuration: URL constructed dynamically using selected tag, e.g., `https://dev.to/api/articles?tag={{ $json.value }}`  
  - Method: GET  
  - Input: Receives tag from previous node  
  - Output: JSON list of articles from Dev.to API (up to 10 per request)  
  - Edge cases: API downtime, incorrect tag causing empty results, rate limiting, network failures.

#### 1.5 Filtering

- **Overview:** Filters out articles that have already been posted and non-English articles.
- **Nodes Involved:**  
  - filter only unused Ids (Filter)
- **Node Details:**  
  - Type: Filter node  
  - Conditions:  
    - Article ID not contained in Airtable used IDs array  
    - Article language equals "en" (English)  
  - Input: Articles list from API  
  - Output: Only new English articles passed forward  
  - Edge cases: Empty input leads to no output, no articles to post.

#### 1.6 Random Article Selection

- **Overview:** Selects one article randomly from the filtered list to post.
- **Nodes Involved:**  
  - get random articles (Code)
- **Node Details:**  
  - Type: Code  
  - Function: Returns a single random article object from input items  
  - Input: Filtered article list  
  - Output: One article for posting  
  - Edge cases: Empty input results in undefined output, which could cause downstream failures.

#### 1.7 Image Download

- **Overview:** Downloads the social image associated with the selected article for LinkedIn media post.
- **Nodes Involved:**  
  - download image for post (HTTP Request)
- **Node Details:**  
  - Type: HTTP Request  
  - Configuration: URL set dynamically to `$json.social_image` field of selected article  
  - Response: Downloads image data (likely binary) for LinkedIn posting  
  - Input: Selected article item  
  - Output: Image binary data attached to item  
  - Edge cases: Missing or invalid image URL, HTTP errors, timeouts.

#### 1.8 LinkedIn Posting

- **Overview:** Creates a LinkedIn post with the article content and image.
- **Nodes Involved:**  
  - make Linkedin post (LinkedIn node)
- **Node Details:**  
  - Type: LinkedIn  
  - Credentials: OAuth2 LinkedIn account  
  - Configuration:  
    - Text includes title, description, article URL, and hashtags  
    - Media type: IMAGE (uses downloaded image)  
    - Visibility: PUBLIC  
    - Person ID: set to a specific user/profile (e.g., `BQYGc4bH9N`)  
  - Input: Image and article data  
  - Output: Post confirmation data  
  - Edge cases: OAuth token expiry, API errors, media upload failures.

#### 1.9 Airtable Update

- **Overview:** Records the newly posted article ID into Airtable to avoid reposting in future runs.
- **Nodes Involved:**  
  - Update the used node (Airtable)
- **Node Details:**  
  - Type: Airtable (Create operation)  
  - Configuration: Adds a record with the article ID to "Used Articles" table  
  - Credentials: Same Airtable token as lookup  
  - Input: Article ID from posted article  
  - Output: Confirmation of record creation  
  - Edge cases: Write permission errors, API rate limits.

#### 1.10 Telegram Notification

- **Overview:** Sends a Telegram message notifying success of the LinkedIn post.
- **Nodes Involved:**  
  - sent the status (Telegram)
- **Node Details:**  
  - Type: Telegram node  
  - Credentials: Telegram Bot API token  
  - Configuration:  
    - Chat ID set to user or group  
    - Message includes article title and Airtable record ID  
  - Input: Confirmation from Airtable update  
  - Output: Confirmation of message sent  
  - Edge cases: Bot token invalid, chat ID incorrect, network errors.

---

### 3. Summary Table

| Node Name               | Node Type           | Functional Role                     | Input Node(s)                | Output Node(s)               | Sticky Note                                                                                                                            |
|-------------------------|---------------------|-----------------------------------|-----------------------------|-----------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| Morning  9 Clock         | Schedule Trigger    | Triggers workflow twice daily     | -                           | get random tags              |                                                                                                                                         |
| get random tags          | Code                | Selects random Dev.to tag         | Morning  9 Clock            | Get List of records used     |                                                                                                                                         |
| Get List of records used | Airtable            | Retrieves posted article IDs      | get random tags             | map used articls ids         | Airtable base "Linkdin" with table "Used Articles" stores posted article IDs to prevent duplicates                                     |
| map used articls ids     | Code                | Maps Airtable records to ID array | Get List of records used    | fetch articles from Url      |                                                                                                                                         |
| fetch articles from Url  | HTTP Request        | Fetches latest articles by tag    | map used articls ids        | filter only unused Ids       | Uses Dev.to API endpoint `https://dev.to/api/articles?tag={{ $json.value }}`                                                           |
| filter only unused Ids   | Filter              | Filters out posted & non-English  | fetch articles from Url     | get random articles          | Filters articles not in Airtable and only English language                                                                              |
| get random articles      | Code                | Selects random article for post   | filter only unused Ids      | download image for post      |                                                                                                                                         |
| download image for post  | HTTP Request        | Downloads article's social image  | get random articles         | make Linkedin post           |                                                                                                                                         |
| make Linkedin post       | LinkedIn            | Posts article to LinkedIn         | download image for post     | Update the used node         | OAuth2 LinkedIn account used; posts with image and formatted text with hashtags                                                         |
| Update the used node     | Airtable            | Adds posted article ID to Airtable| make Linkedin post          | sent the status              |                                                                                                                                         |
| sent the status          | Telegram            | Sends Telegram success notification| Update the used node        | -                           |                                                                                                                                         |
| Sticky Note             | Sticky Note          | Provides workflow overview        | -                           | -                           | # 📢 Auto-Post Dev.to Articles to LinkedIn with Telegram Alerts                                                                         |
| Sticky Note1            | Sticky Note          | Lists workflow features           | -                           | -                           | ## ✅ Features - Runs twice daily - Fetches Dev.to articles - Avoids duplicates - Posts to LinkedIn - Sends Telegram notifications - Customizable |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**  
   - Type: Schedule Trigger  
   - Cron expression: `0 9,19 * * *` (runs at 9 AM and 7 PM daily)  
   - Timezone: Asia/Kolkata or adjust as needed  
   - Connect output to next node.

2. **Create Code Node to Pick Random Tag**  
   - Name: `get random tags`  
   - Paste JS code that defines a list of Dev.to tags and returns one random tag object with `{ json: { value: <tag> } }`  
   - Connect input from Schedule Trigger node.

3. **Create Airtable Search Node**  
   - Name: `Get List of records used`  
   - Operation: Search  
   - Base: Your Airtable base (e.g., "Linkdin")  
   - Table: "Used Articles"  
   - Credentials: Airtable Personal Access Token  
   - Connect input from `get random tags` node.

4. **Create Code Node to Map Airtable Records**  
   - Name: `map used articls ids`  
   - JS code maps the Airtable records to an array of article ID strings under `values` key.  
   - Input: Output of Airtable Search node.

5. **Create HTTP Request Node to Fetch Articles**  
   - Name: `fetch articles from Url`  
   - Method: GET  
   - URL: `https://dev.to/api/articles?tag={{ $json.value }}` (dynamic tag from previous node)  
   - Input: Output from mapping node.

6. **Create Filter Node to Exclude Used and Non-English Articles**  
   - Name: `filter only unused Ids`  
   - Conditions:  
     - Article ID NOT IN array of used article IDs (from Airtable)  
     - Language == "en"  
   - Input: Articles from Dev.to HTTP request node.

7. **Create Code Node to Pick Random Article**  
   - Name: `get random articles`  
   - JS code returns a single random article from the filtered list.  
   - Input: Filter node output.

8. **Create HTTP Request Node to Download Image**  
   - Name: `download image for post`  
   - Method: GET  
   - URL: `{{ $json.social_image }}` (dynamic URL from selected article)  
   - Set to download binary data  
   - Input: Output from random article selection.

9. **Create LinkedIn Node to Post Article**  
   - Name: `make Linkedin post`  
   - Credentials: LinkedIn OAuth2 credentials (user or company profile)  
   - Text: Compose with article title, description, URL, hashtags, and emojis.  
   - Media: Attach downloaded image (set media category as IMAGE)  
   - Visibility: PUBLIC  
   - Input: From image download node.

10. **Create Airtable Create Node to Record Posted Article**  
    - Name: `Update the used node`  
    - Operation: Create  
    - Base/Table: Same as Airtable lookup  
    - Map Article ID field to `{{ $('download image for post').item.json.id }}`  
    - Input: LinkedIn post node output.

11. **Create Telegram Node for Success Notification**  
    - Name: `sent the status`  
    - Credentials: Telegram Bot API token and Chat ID  
    - Text: Include confirmation message with article title and Airtable record ID  
    - Input: From Airtable update node.

12. **Connect nodes as per above flow**  
    - Schedule Trigger → get random tags → Get List of records used → map used articls ids → fetch articles from Url → filter only unused Ids → get random articles → download image for post → make Linkedin post → Update the used node → sent the status

13. **Add Sticky Notes** (optional) for overview and feature summary, to improve maintainability.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                             | Context or Link                                                                                                   |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| This workflow automates LinkedIn posts by fetching Dev.to articles twice daily, ensuring no duplicates via Airtable, and notifying success via Telegram.                                                                  | Workflow description and use case                                                                                 |
| Airtable base should have a table named "Used Articles" with a single text column "ArticleID" to track posted articles.                                                                                                  | Airtable setup                                                                                                    |
| Dev.to API endpoint: `https://dev.to/api/articles?tag=YOUR_TAG_HERE&per_page=10` Replace tag as needed for content focus.                                                                                              | Dev.to API reference                                                                                              |
| Telegram Bot setup requires creating a bot with @BotFather and retrieving chat ID via @userinfobot or Telegram API.                                                                                                      | Telegram Bot API setup                                                                                            |
| LinkedIn Developer App with OAuth2 credentials needed to post to user profile or company page.                                                                                                                           | LinkedIn API setup                                                                                                |
| Hashtags used in the LinkedIn post text are customizable to match your audience and content theme.                                                                                                                       | Customization tip                                                                                                |
| Cron timezone is set to Asia/Kolkata; adjust if deploying in other regions to maintain correct scheduling.                                                                                                              | Scheduling note                                                                                                   |
| The workflow assumes articles have a social image URL; some Dev.to articles may not have images, which could cause the image download step to fail or produce empty media posts. Handle such cases accordingly.             | Edge case consideration                                                                                          |
| Rate limits and API quotas for Airtable, Dev.to, LinkedIn, and Telegram APIs should be monitored to avoid disruptions. Use error workflows or retries if needed.                                                         | Integration and error handling advisory                                                                           |
| Sticky notes in the workflow provide useful overview and features summary for maintainers and users.                                                                                                                    | Documentation practice                                                                                           |

---

This structured documentation provides a detailed understanding and reproduction guide for the "Auto-Post Dev.to Articles to LinkedIn with Airtable Tracking & Telegram Alerts" workflow.