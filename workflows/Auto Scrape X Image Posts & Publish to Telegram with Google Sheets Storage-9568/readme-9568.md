Auto Scrape X Image Posts & Publish to Telegram with Google Sheets Storage

https://n8nworkflows.xyz/workflows/auto-scrape-x-image-posts---publish-to-telegram-with-google-sheets-storage-9568


# Auto Scrape X Image Posts & Publish to Telegram with Google Sheets Storage

### 1. Workflow Overview

This workflow automates scraping recent posts from a specified X (formerly Twitter) user account, filters and formats tweets containing both text and images, stores the data in a Google Sheet, and posts the content sequentially to a Telegram channel with a controlled delay between posts. It addresses content creators’ and social media managers’ needs for automated, clean, and consistent cross-posting from X to Telegram without manual intervention or coding.

The workflow is logically divided into the following blocks:

- **1.1 Trigger & Data Retrieval:** Manual start and retrieval of tweets from a specified X user account via Twitter API.
- **1.2 Data Filtering & Deduplication:** Filtering tweets to only those with text and images, and removing duplicate posts based on tweet ID history.
- **1.3 Data Storage & Formatting:** Storing raw scraped data into Google Sheets, then cleaning tweet text by removing URLs.
- **1.4 Posting Loop:** Iteratively sending each filtered post (image + text) to a Telegram channel, with a 3-minute wait between posts to prevent spam.

---

### 2. Block-by-Block Analysis

#### 2.1 Trigger & Data Retrieval

- **Overview:** Initiates the workflow manually and fetches the latest tweets from a specified X user through an API call.
- **Nodes Involved:**  
  - Trigger : Start scraping on X  
  - Twitter API

- **Node Details:**

  - **Trigger : Start scraping on X**  
    - Type: Manual Trigger  
    - Role: Starts the workflow execution manually; no parameters needed.  
    - Connections: Output connects to "Twitter API".  
    - Edge Cases: None significant; manual start requires user interaction.

  - **Twitter API**  
    - Type: HTTP Request  
    - Role: Calls Twitter API endpoint `https://api.twitterapi.io/twitter/user/last_tweets` to fetch last tweets.  
    - Configuration: Query parameters specify the user ID (`1361142028667662338`) and username (`@Inku_Fr`). Uses HTTP Header Authentication credentials named "X scrapping utilisateur".  
    - Inputs: Trigger node output.  
    - Outputs: Raw tweet data JSON.  
    - Edge Cases: API rate limits, authentication failures, network timeouts, invalid user ID/username.

---

#### 2.2 Data Filtering & Deduplication

- **Overview:** Filters tweets to keep only those containing both text and at least one image, then removes duplicates from previous executions based on tweet ID.
- **Nodes Involved:**  
  - Filter only tweets that have text and an image  
  - Remove Duplicates

- **Node Details:**

  - **Filter only tweets that have text and an image**  
    - Type: Code  
    - Role: Processes raw tweets to extract necessary fields and filters out tweets without text or images.  
    - Configuration: JavaScript filters tweets with `tweet_text` and `first_image_url`. Extracts author name, username, tweet text, URL, ID, creation date, and image URL.  
    - Inputs: Output from "Twitter API".  
    - Outputs: Filtered tweet objects with required fields.  
    - Edge Cases: Input missing expected fields, code errors in expression evaluation.

  - **Remove Duplicates**  
    - Type: Remove Duplicates  
    - Role: Ensures no tweet is processed twice by checking tweet IDs against a 10,000-item history.  
    - Configuration: Deduplicates using `tweet_id` field, history size 10,000.  
    - Inputs: Filtered tweets from prior node.  
    - Outputs: New, unique tweets for further processing.  
    - Edge Cases: History size exhaustion, incorrect dedupe key.  

---

#### 2.3 Data Storage & Formatting

- **Overview:** Saves the filtered tweet data into a Google Sheet for archival and then cleans the tweet text by removing URLs.
- **Nodes Involved:**  
  - Save the scraping Data in a google sheet  
  - Format and remove links from the scraping data

- **Node Details:**

  - **Save the scraping Data in a google sheet**  
    - Type: Google Sheets  
    - Role: Appends tweet data to a specified sheet for record-keeping.  
    - Configuration: Maps tweet fields to columns: URL, Date, Image, Content (text), Tweet ID, Account name, Username. Uses OAuth2 credentials for Google Sheets access.  
    - Inputs: Unique tweets from "Remove Duplicates".  
    - Outputs: Passes saved rows for further processing.  
    - Edge Cases: Google API quota limits, authentication issues, incorrect sheet ID or permissions.

  - **Format and remove links from the scraping data**  
    - Type: Code  
    - Role: Cleans tweet text by removing URLs to improve readability before posting.  
    - Configuration: JavaScript uses regex to strip http/https links from the "Contenu" field. Also re-maps fields to consistent keys for later use.  
    - Inputs: Output of Google Sheets node.  
    - Outputs: Cleaned tweet objects with text and image URLs.  
    - Edge Cases: Unexpected text format, regex failures.

---

#### 2.4 Posting Loop

- **Overview:** Iterates through each cleaned tweet, sends a photo with caption to a Telegram channel, and waits 3 minutes between each post to avoid spamming.
- **Nodes Involved:**  
  - Loop Over Items  
  - Send a photo and text in your channel  
  - Wait 3 minutes per post

- **Node Details:**

  - **Loop Over Items**  
    - Type: Split In Batches  
    - Role: Processes tweets one at a time in a loop.  
    - Configuration: Default batch size (1), no additional options.  
    - Inputs: Cleaned tweets from formatter node.  
    - Outputs: Each tweet item sent sequentially to "Send a photo and text in your channel".  
    - Edge Cases: Large volume causing long execution times; batch size can be adjusted.

  - **Send a photo and text in your channel**  
    - Type: Telegram  
    - Role: Sends a photo and text caption to Telegram channel `@instantanimee`.  
    - Configuration: Uses Telegram bot credentials; operation is `sendPhoto`. Caption is tweet text; photo URL is from tweet.  
    - Inputs: Single tweet item from loop node.  
    - Outputs: Connects to wait node to throttle posts.  
    - Edge Cases: Telegram API errors, invalid chat ID, media loading failures.

  - **Wait 3 minutes per post**  
    - Type: Wait  
    - Role: Delays next iteration by 3 minutes to prevent spamming Telegram channel.  
    - Configuration: Wait duration set to 3 minutes.  
    - Inputs: After sending photo node.  
    - Outputs: Loops back to "Loop Over Items" to process next tweet.  
    - Edge Cases: Workflow timeout if too many tweets; ensure n8n execution time limits account for this.

---

### 3. Summary Table

| Node Name                               | Node Type             | Functional Role                              | Input Node(s)                  | Output Node(s)                  | Sticky Note                                                                                                                              |
|----------------------------------------|-----------------------|----------------------------------------------|-------------------------------|--------------------------------|------------------------------------------------------------------------------------------------------------------------------------------|
| Trigger : Start scraping on X           | Manual Trigger        | Starts workflow manually                      | —                             | Twitter API                    |                                                                                                                                          |
| Twitter API                            | HTTP Request          | Fetches recent tweets from X user            | Trigger : Start scraping on X  | Filter only tweets that have text and an image |                                                                                                                                          |
| Filter only tweets that have text and an image | Code                  | Filters tweets to those with text and images | Twitter API                   | Remove Duplicates              | ## It will format the data. It also filters the tweets, keeping only those that contain text and at least one image.                    |
| Remove Duplicates                      | Remove Duplicates     | Removes duplicate tweets by tweet ID         | Filter only tweets that have text and an image | Save the scraping Data in a google sheet |                                                                                                                                          |
| Save the scraping Data in a google sheet | Google Sheets         | Saves tweet data for archival                  | Remove Duplicates              | Format and remove links from the scraping data |                                                                                                                                          |
| Format and remove links from the scraping data | Code                  | Cleans tweet text removing URLs               | Save the scraping Data in a google sheet | Loop Over Items               | ## It will format the data. It also filters the tweets, keeping only those that contain text and at least one image.                    |
| Loop Over Items                       | Split In Batches      | Processes each tweet individually             | Format and remove links from the scraping data | Send a photo and text in your channel | ## Publish the tweet on your telegram channel with a wait time of 3 minutes per post                                                     |
| Send a photo and text in your channel | Telegram              | Sends photo + caption to Telegram channel     | Loop Over Items               | Wait 3 minutes per post        | ## Publish the tweet on your telegram channel with a wait time of 3 minutes per post                                                     |
| Wait 3 minutes per post               | Wait                  | Waits 3 minutes between each post             | Send a photo and text in your channel | Loop Over Items               | ## Publish the tweet on your telegram channel with a wait time of 3 minutes per post                                                     |
| Sticky Note                          | Sticky Note           | Instruction: Enter the ID and username        | —                             | —                              | ## Enter the ID and username of the user account you want to scrape.                                                                     |
| Sticky Note1                         | Sticky Note           | Instruction on data formatting and filtering | —                             | —                              | ## It will format the data. It also filters the tweets, keeping only those that contain text and at least one image.                    |
| Sticky Note2                         | Sticky Note           | Instruction on publishing and delay           | —                             | —                              | ## Publish the tweet on your telegram channel with a wait time of 3 minutes per post                                                     |
| Sticky Note3                         | Sticky Note           | Use case explanation                          | —                             | —                              | ## Use this workflow to automates the process of scraping tweets from X (Twitter) and publishing them to a Telegram channel             |
| Sticky Note4                         | Sticky Note           | Full workflow overview, instructions, and credits | —                             | —                              | ## Who’s it for... [LinkedIn](https://www.linkedin.com/in/jaures-nya-83a033270/) / [YouTube](https://www.youtube.com/@jauresnya)         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Name: `Trigger : Start scraping on X`  
   - Type: Manual Trigger  
   - No parameters required.

2. **Add HTTP Request Node**  
   - Name: `Twitter API`  
   - Type: HTTP Request  
   - URL: `https://api.twitterapi.io/twitter/user/last_tweets`  
   - Method: GET (default)  
   - Query Parameters:  
     - `userID`: `1361142028667662338`  
     - `userName`: `@Inku_Fr`  
   - Authentication: HTTP Header Auth with credentials for Twitter API (e.g., "X scrapping utilisateur")  
   - Connect output of Manual Trigger to this node.

3. **Add Code Node for Filtering Tweets**  
   - Name: `Filter only tweets that have text and an image`  
   - Type: Code (JavaScript)  
   - Code: Extract tweet fields (author_name, author_username, tweet_text, tweet_url, tweet_id, created_at, first_image_url) and filter to only include tweets with text and image.  
   - Connect output of Twitter API node here.

4. **Add Remove Duplicates Node**  
   - Name: `Remove Duplicates`  
   - Type: Remove Duplicates  
   - Operation: Remove items seen in previous executions  
   - Dedupe Value: Use expression `{{$json.tweet_id}}`  
   - History Size: 10,000  
   - Connect output of Filter node here.

5. **Add Google Sheets Node**  
   - Name: `Save the scraping Data in a google sheet`  
   - Type: Google Sheets  
   - Operation: Append  
   - Document ID: Enter your Google Sheet ID (e.g., `1xZbBYTPYAW-625aRFwfxNzkTA-nbVY7Mv_EX3ubk1uQ`)  
   - Sheet Name: `gid=0` or your target sheet name  
   - Columns Mapping:  
     - URL: `={{ $json.tweet_url }}`  
     - Date: `={{ $json.created_at }}`  
     - Image: `={{ $json.image_url }}`  
     - Contenu: `={{ $json.tweet_text }}`  
     - ID Tweet: `={{ $json.tweet_id }}`  
     - Nom du compte: `={{ $json.author_name }}`  
     - Nom d'utilisateur: `={{ $json.author_username }}`  
   - Credentials: Connect Google Sheets OAuth2 credentials  
   - Connect output of Remove Duplicates here.

6. **Add Code Node to Format and Clean Text**  
   - Name: `Format and remove links from the scraping data`  
   - Type: Code (JavaScript)  
   - Code: Remove URLs from "Contenu" field using regex, keep tweets with text and image only; remap fields for next steps.  
   - Connect output of Google Sheets node here.

7. **Add Split In Batches Node**  
   - Name: `Loop Over Items`  
   - Type: Split In Batches  
   - Batch Size: 1 (default)  
   - Connect output of formatting code node here.

8. **Add Telegram Node**  
   - Name: `Send a photo and text in your channel`  
   - Type: Telegram  
   - Operation: sendPhoto  
   - Chat ID: `@instantanimee` (replace with your channel)  
   - File: `={{ $json.first_image_url }}`  
   - Caption: `={{ $json.tweet_text }}`  
   - Credentials: Connect Telegram bot API credentials  
   - Connect output of Split In Batches node here.

9. **Add Wait Node**  
   - Name: `Wait 3 minutes per post`  
   - Type: Wait  
   - Wait for: 3 minutes  
   - Connect output of Telegram node here.

10. **Connect Wait Node back to Split In Batches Node**  
    - Creates a loop to process next tweet after waiting.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Context or Link                                                                                                         |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------|
| This workflow automates scraping and cross-posting from X (Twitter) to Telegram, ideal for content creators and social media managers who want to automate content curation and maintain a clean, spam-free channel.                                                                                                                                                                                                                                                                               | Sticky Note3 in workflow                                                                                               |
| Requires valid Twitter API credentials or a scraping endpoint, a Google Sheet for data storage, and a Telegram bot connected to the target channel.                                                                                                                                                                                                                                                                                                                                           | Sticky Note4 in workflow                                                                                               |
| Detailed usage instructions and support contacts available via LinkedIn and YouTube: [LinkedIn](https://www.linkedin.com/in/jaures-nya-83a033270/), [YouTube](https://www.youtube.com/@jauresnya)                                                                                                                                                                                                                                                                                                | Sticky Note4 in workflow                                                                                               |
| Enter the correct Twitter user ID and username at the start node to configure which account to scrape.                                                                                                                                                                                                                                                                                                                                                                                         | Sticky Note                                                                                                            |
| The workflow includes a 3-minute delay between Telegram posts to avoid spamming and respect platform limits.                                                                                                                                                                                                                                                                                                                                                                                   | Sticky Note2                                                                                                           |
| Data is stored in Google Sheets as a backup and for future reference before posting.                                                                                                                                                                                                                                                                                                                                                                                                             | Sticky Note1                                                                                                           |

---

**Disclaimer:** The provided text is exclusively generated from an n8n workflow automation. It complies strictly with content policies and contains no illegal, offensive, or protected elements. All data processed is legal and publicly accessible.