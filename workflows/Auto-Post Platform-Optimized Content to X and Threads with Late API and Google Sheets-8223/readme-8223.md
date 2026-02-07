Auto-Post Platform-Optimized Content to X and Threads with Late API and Google Sheets

https://n8nworkflows.xyz/workflows/auto-post-platform-optimized-content-to-x-and-threads-with-late-api-and-google-sheets-8223


# Auto-Post Platform-Optimized Content to X and Threads with Late API and Google Sheets

### 1. Workflow Overview

This workflow automates the posting of platform-optimized content to both X.com (formerly Twitter) and Meta Threads using the Late API, while sourcing and managing content via Google Sheets. It is designed to run on a schedule, retrieve draft content from a Google Sheets document, shorten URLs, upload images, and post tailored messages according to platform-specific constraints (280 characters for X, 500 for Threads). After posting, it updates the content status in Google Sheets to prevent duplication.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception and Content Retrieval:** Scheduled trigger initiates the workflow; content is fetched from Google Sheets.
- **1.2 URL Shortening and Image Acquisition:** URLs are shortened via Bitly; images are downloaded and renamed.
- **1.3 Media Upload:** Images are uploaded to Late's media server for posting.
- **1.4 Content Assembly and Validation:** Tweets and Threads posts are composed and checked for platform-specific length constraints.
- **1.5 Posting to Platforms:** Content is posted to X.com and Threads via Late API.
- **1.6 Post-Posting Update:** Google Sheets is updated to mark content as posted and store short URLs.
- **1.7 Ancillary Nodes and Documentation:** Sticky notes and no-operation nodes provide instructions and flow control.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Content Retrieval

- **Overview:**  
  This block triggers the workflow on a schedule and retrieves draft content entries from a specified Google Sheets document filtered by "Status" = "draft".

- **Nodes Involved:**  
  - Schedule Trigger  
  - Get Topic

- **Node Details:**

  - **Schedule Trigger**  
    - Type: Schedule Trigger  
    - Role: Initiates workflow every 8 hours (cron: 0 */8 * * *)  
    - Configuration: Cron expression for periodic execution  
    - Inputs: None (trigger)  
    - Outputs: Triggers "Get Topic" node  
    - Edge Cases: Misconfigured cron expressions may cause no runs or excessive runs.

  - **Get Topic**  
    - Type: Google Sheets  
    - Role: Reads a single draft row from the sheet named "One Thread" in the specified Google Sheets document  
    - Configuration: Filters rows where "Status" column equals "draft"; returns the first match only  
    - Inputs: Trigger from Schedule Trigger  
    - Outputs: Passes JSON with draft content to "Short link"  
    - Credential: Google Sheets OAuth2 with API enabled  
    - Edge Cases: No matching draft yields no output; API quota limits; access permission errors.

#### 2.2 URL Shortening and Image Acquisition

- **Overview:**  
  This block shortens the URL found in the fetched content and downloads the associated image.

- **Nodes Involved:**  
  - Short link  
  - Get Img

- **Node Details:**

  - **Short link**  
    - Type: Bitly  
    - Role: Converts the long URL from the Google Sheet into a shortened Bitly link  
    - Configuration: Uses Bitly API credentials; input URL from `{{ $json.URL }}`  
    - Inputs: Output of "Get Topic"  
    - Outputs: Passes shortened link to "Get Img"  
    - Credential: Bitly API token or OAuth  
    - Edge Cases: API rate limits, invalid URLs, authentication failure.

  - **Get Img**  
    - Type: HTTP Request  
    - Role: Downloads the image file from the URL in the Google Sheet's "Img URL" column  
    - Configuration: URL dynamically fetched from `{{ $('Get Topic').item.json['Img URL'] }}`  
    - Inputs: Output of "Short link"  
    - Outputs: Passes binary image data to "Rename Img"  
    - Edge Cases: Broken image URLs, HTTP errors, timeouts.

#### 2.3 Media Upload

- **Overview:**  
  This block renames the downloaded image with a timestamped filename and uploads it to Late’s media server to get a media URL for posting.

- **Nodes Involved:**  
  - Rename Img  
  - Upload IMG

- **Node Details:**

  - **Rename Img**  
    - Type: Code (JavaScript)  
    - Role: Renames the binary image file with a timestamp-based filename and proper extension based on MIME type  
    - Configuration: Generates filename like `image-YYYY-MM-DD_HHMMSS.ext` where ext is derived from MIME type or defaults to jpg  
    - Inputs: Binary image data from "Get Img"  
    - Outputs: Renamed binary data to "Upload IMG"  
    - Edge Cases: Missing MIME type, unexpected binary formats.

  - **Upload IMG**  
    - Type: HTTP Request  
    - Role: Uploads the renamed image to Late’s media endpoint to obtain a hosted media URL  
    - Configuration: POST multipart/form-data with binary file under field "files"; uses Bearer token authentication for Late API  
    - Inputs: Output from "Rename Img"  
    - Outputs: Provides media URL metadata to subsequent nodes ("Set Tweets" and "Set Thread")  
    - Credential: Late API Bearer Token  
    - Edge Cases: API failure, network issues, authentication errors, file size limits.

#### 2.4 Content Assembly and Validation

- **Overview:**  
  Prepares and validates the platform-specific content for X and Threads, ensuring they meet character limits.

- **Nodes Involved:**  
  - Set Tweets  
  - Set Thread  
  - If  
  - If1

- **Node Details:**

  - **Set Tweets**  
    - Type: Set  
    - Role: Constructs two tweet texts (tweet and tweet2) optimized for X, incorporating headline, short URL, and hashtags  
    - Configuration:  
      - `tweet`: "📢 [Headline] 👉 [Short URL] 🧐 #[hashtag1] #[hashtag2]"  
      - `tweet2`: Uses the "Tweet" field from Google Sheets  
    - Inputs: Output from "Upload IMG"  
    - Outputs: Passes content to "If" node for validation

  - **Set Thread**  
    - Type: Set  
    - Role: Constructs content for a single post on Threads, including headline, critique, short URL, and hashtags  
    - Configuration:  
      - `tweet`: "🔥[Headline]. 🤔 [Kritik] [Short URL] #[hashtag1] #[hashtag2]"  
    - Inputs: Output from "Upload IMG"  
    - Outputs: Passes content to "If1" node for validation

  - **If**  
    - Type: If  
    - Role: Validates both tweet texts for X to ensure length ≤ 280 characters  
    - Conditions:  
      - tweet length ≤ 280  
      - tweet2 length ≤ 280  
    - Inputs: From "Set Tweets"  
    - Outputs: On true, continues to "Post Twitter"; on false, no further action (falls through)

  - **If1**  
    - Type: If  
    - Role: Validates Threads content length to be ≤ 500 characters  
    - Conditions:  
      - tweet length ≤ 500  
    - Inputs: From "Set Thread"  
    - Outputs: On true, continues to "Post Thread"; on false, no further action

#### 2.5 Posting to Platforms

- **Overview:**  
  Posts the validated content to X.com and Threads platforms through Late’s API, including the previously uploaded media.

- **Nodes Involved:**  
  - Post Twitter  
  - Post Thread  
  - No Operation, do nothing  
  - No Operation, do nothing1

- **Node Details:**

  - **Post Twitter**  
    - Type: HTTP Request  
    - Role: Posts a threaded tweet containing two tweet items and the uploaded image via Late API  
    - Configuration:  
      - POST to `https://getlate.dev/api/v1/posts`  
      - JSON body includes:  
        - Content (escaped text) from tweets  
        - Media item with image URL from "Upload IMG"  
        - Platforms array specifying platform = "twitter", accountId (user must replace with their Twitter account ID), threadItems array with two tweet contents  
      - Publish immediately (`publishNow: true`)  
      - Bearer Auth with Late API credentials  
    - Inputs: From "If" node (on true)  
    - Outputs: On success, passes to "No Operation, do nothing" node  
    - Edge Cases: Authentication failure, API errors, invalid account ID, content length issues.

  - **Post Thread**  
    - Type: HTTP Request  
    - Role: Posts a single Threads post with the image via Late API  
    - Configuration:  
      - POST to same endpoint as above  
      - JSON body with content text, platform = "threads", and accountId (user must replace with their Threads account ID)  
      - Includes media item with image URL  
      - Publish immediately  
      - Bearer Auth with Late API credentials  
    - Inputs: From "If1" node (on true)  
    - Outputs: On success, proceeds to "Update Data Posted" node  
    - Edge Cases: Similar to Post Twitter; authentication and API errors.

  - **No Operation, do nothing / No Operation, do nothing1**  
    - Type: No Operation (NoOp)  
    - Role: Acts as flow terminators or placeholders after posting actions  
    - Inputs: From "Post Twitter" and "Update Data Posted" respectively  
    - Outputs: None  
    - Edge Cases: None; purely control flow.

#### 2.6 Post-Posting Update

- **Overview:**  
  Updates the Google Sheet row for the posted content, marking status as "posted" and saving the short URL.

- **Nodes Involved:**  
  - Update Data Posted

- **Node Details:**

  - **Update Data Posted**  
    - Type: Google Sheets  
    - Role: Updates the row in the sheet "One Thread" matching the original content's row_number  
    - Configuration:  
      - Updates columns:  
        - Status → "posted"  
        - Short URL → from Bitly node  
        - Kritik → preserved from original row  
      - Uses "row_number" as matching key for update  
      - Google Sheets OAuth2 credentials  
    - Inputs: From successful "Post Thread" node  
    - Outputs: To "No Operation, do nothing1"  
    - Edge Cases: Update failure due to incorrect matching, API limits.

#### 2.7 Ancillary Nodes and Documentation

- **Overview:**  
  Sticky notes provide instructions and logical flow markers. NoOp nodes assist in flow control.

- **Nodes Involved:**  
  - Sticky Note (intro and instructions)  
  - Sticky Note2, Sticky Note3, Sticky Note4, Sticky Note5  
  - No Operation, do nothing  
  - No Operation, do nothing1

- **Node Details:**

  - **Sticky Notes**  
    - Contain detailed instructions on usage, setup, and step demarcations (STEP 1, STEP 2, STEP 3)  
    - Include links to Google Sheets template, Bitly API, and getlate.dev API key acquisition  
    - Aid users in understanding workflow setup and operation

  - **No Operation nodes**  
    - Functional placeholders to end branches cleanly

---

### 3. Summary Table

| Node Name               | Node Type           | Functional Role                                | Input Node(s)      | Output Node(s)     | Sticky Note                                                                                                          |
|-------------------------|---------------------|-----------------------------------------------|--------------------|--------------------|----------------------------------------------------------------------------------------------------------------------|
| Schedule Trigger        | Schedule Trigger     | Starts workflow every 8 hours                  | -                  | Get Topic          |                                                                                                                      |
| Get Topic              | Google Sheets       | Retrieves draft content from Google Sheets     | Schedule Trigger   | Short link         |                                                                                                                      |
| Short link             | Bitly               | Shortens URL from sheet                         | Get Topic          | Get Img            |                                                                                                                      |
| Get Img                | HTTP Request        | Downloads image from URL                         | Short link         | Rename Img         |                                                                                                                      |
| Rename Img             | Code                | Renames image file with timestamp                | Get Img            | Upload IMG         |                                                                                                                      |
| Upload IMG             | HTTP Request        | Uploads image to Late API media server           | Rename Img         | Set Tweets, Set Thread |                                                                                                                      |
| Set Tweets             | Set                 | Constructs tweet texts for X platform            | Upload IMG         | If                 |                                                                                                                      |
| If                     | If                  | Validates tweet lengths ≤ 280 for X              | Set Tweets         | Post Twitter       |                                                                                                                      |
| Post Twitter           | HTTP Request        | Posts threaded tweets with media to X via Late API | If                 | No Operation, do nothing |                                                                                                                      |
| No Operation, do nothing | No Operation        | Ends X posting branch                            | Post Twitter       | -                  |                                                                                                                      |
| Set Thread             | Set                 | Constructs post content for Threads platform     | Upload IMG         | If1                |                                                                                                                      |
| If1                    | If                  | Validates thread post length ≤ 500               | Set Thread         | Post Thread        |                                                                                                                      |
| Post Thread            | HTTP Request        | Posts single post with media to Threads via Late API | If1                | Update Data Posted |                                                                                                                      |
| Update Data Posted     | Google Sheets       | Updates content status and short URL in sheet    | Post Thread        | No Operation, do nothing1 |                                                                                                                      |
| No Operation, do nothing1 | No Operation        | Ends Threads posting branch                       | Update Data Posted  | -                  |                                                                                                                      |
| Sticky Note            | Sticky Note         | Introductory explanation and instructions        | -                  | -                  | ## Different X and Threads Content Auto Poster ... [full content with usage instructions and requirements]           |
| Sticky Note2           | Sticky Note         | Marks STEP 1 block                                 | -                  | -                  | # STEP 1                                                                                                             |
| Sticky Note3           | Sticky Note         | Marks STEP 2 block (Post to X.com)                 | -                  | -                  | # STEP 2 - POST TO X.COM                                                                                             |
| Sticky Note4           | Sticky Note         | Marks STEP 3 block (Post to Meta Threads)          | -                  | -                  | # STEP 3 - POST TO META THREADS.COM                                                                                  |
| Sticky Note5           | Sticky Note         | Detailed HOW TO USE instructions                   | -                  | -                  | ## HOW TO USE ... [step-by-step setup instructions with links to Google Sheets template, Bitly, and Late API]         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger node**  
   - Type: Schedule Trigger  
   - Set cron expression to `0 */8 * * *` to run every 8 hours.

2. **Create Google Sheets node named "Get Topic"**  
   - Operation: Read Rows  
   - Document ID: Use your Google Sheets document ID  
   - Sheet Name: "One Thread" (or your sheet name)  
   - Filter rows where "Status" = "draft"  
   - Option: Return first match only  
   - Credentials: Set up Google Sheets OAuth2 with API access enabled  
   - Connect Schedule Trigger → Get Topic

3. **Create Bitly node named "Short link"**  
   - Operation: Shorten URL  
   - Long URL: `={{ $json.URL }}` from Google Sheets  
   - Credentials: Add Bitly API token or OAuth credentials  
   - Connect Get Topic → Short link

4. **Create HTTP Request node named "Get Img"**  
   - Method: GET  
   - URL: `={{ $('Get Topic').item.json['Img URL'] }}`  
   - Connect Short link → Get Img

5. **Create Code node named "Rename Img"**  
   - JavaScript code: Rename binary image file with timestamp and proper extension based on MIME type (see code snippet in analysis)  
   - Connect Get Img → Rename Img

6. **Create HTTP Request node named "Upload IMG"**  
   - Method: POST  
   - URL: `https://getlate.dev/api/v1/media`  
   - Content-Type: multipart/form-data  
   - Body Parameter: files (binary, input field name: data)  
   - Authentication: Bearer Token (Late API)  
   - Connect Rename Img → Upload IMG

7. **Create Set node named "Set Tweets"**  
   - Create two string fields:  
     - tweet: `📢 {{ $('Get Topic').item.json.Headline }} 👉 {{ $('Short link').item.json.link }} 🧐 #{{ $('Get Topic').item.json['hashtags 1'] }} #{{ $('Get Topic').item.json['hashtags 2'] }}`  
     - tweet2: `={{ $('Get Topic').item.json.Tweet }}`  
   - Connect Upload IMG → Set Tweets

8. **Create If node named "If"**  
   - Conditions (AND):  
     - `{{ $json["tweet"].length <= 280 }}` is true  
     - `{{ $json["tweet2"].length <= 280 }}` is true  
   - Connect Set Tweets → If

9. **Create HTTP Request node named "Post Twitter"**  
   - Method: POST  
   - URL: `https://getlate.dev/api/v1/posts`  
   - Authentication: Bearer Token (Late API)  
   - JSON Body (template):  
     ```json
     {
       "content": "{{ escaped first tweet content }}",
       "mediaItems": [
         {
           "type": "image",
           "url": "{{ uploaded image url }}"
         }
       ],
       "platforms": [
         {
           "platform": "twitter",
           "accountId": "YOUR_TWITTER_ACCOUNT_ID",
           "platformSpecificData": {
             "threadItems": [
               {"content": "{{ escaped tweet }}"}, 
               {"content": "{{ escaped tweet2 }}"}
             ]
           }
         }
       ],
       "publishNow": true
     }
     ```
   - Replace placeholders accordingly  
   - Connect If (true) → Post Twitter

10. **Create No Operation node named "No Operation, do nothing"**  
    - Connect Post Twitter → No Operation, do nothing

11. **Create Set node named "Set Thread"**  
    - Create string field:  
      - tweet: `🔥{{ $('Get Topic').item.json.Headline }}. 🤔 {{ $('Get Topic').item.json.Kritik }} {{ $('Short link').item.json.link }} #{{ $('Get Topic').item.json['hashtags 1'] }} #{{ $('Get Topic').item.json['hashtags 2'] }}`  
    - Connect Upload IMG → Set Thread

12. **Create If node named "If1"**  
    - Condition:  
      - `{{ $json["tweet"].length <= 500 }}` is true  
    - Connect Set Thread → If1

13. **Create HTTP Request node named "Post Thread"**  
    - Method: POST  
    - URL: `https://getlate.dev/api/v1/posts`  
    - Authentication: Bearer Token (Late API)  
    - JSON Body (template):  
      ```json
      {
        "content": "{{ escaped tweet content }}",
        "platforms": [
          {
            "platform": "threads",
            "accountId": "YOUR_THREADS_ACCOUNT_ID"
          }
        ],
        "mediaItems": [
          {
            "type": "image",
            "url": "{{ uploaded image url }}"
          }
        ],
        "publishNow": true
      }
      ```
    - Replace placeholders accordingly  
    - Connect If1 (true) → Post Thread

14. **Create Google Sheets node named "Update Data Posted"**  
    - Operation: Update Row  
    - Document ID and Sheet Name: Same as "Get Topic"  
    - Matching column: "row_number" from original data  
    - Columns to update:  
      - Status: "posted"  
      - Short URL: `={{ $('Short link').item.json.link }}`  
      - Kritik: preserved from original row  
    - Credentials: Google Sheets OAuth2  
    - Connect Post Thread → Update Data Posted

15. **Create No Operation node named "No Operation, do nothing1"**  
    - Connect Update Data Posted → No Operation, do nothing1

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                               | Context or Link                                                                                                          |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------|
| ## Different X and Threads Content Auto Poster  \n### This n8n template demonstrates posting different content optimized for X and Meta Threads using Late API. Can be used across niches like AI news.  \n\n**How it works:** Scheduled trigger, Google Sheets source, URL shortening, image uploading, validation, posting, and update. | Sticky Note in workflow introduction                                                                                     |
| HOW TO USE  \n\n**STEP 1**  \n1. Adjust Schedule Trigger timing.  \n2. Copy and configure Google Sheets template [Google Sheets template](https://docs.google.com/spreadsheets/d/1CtpVHtzu_y9KoELS7Cee3BDivtRN2zVg-Uuy7uZD4ko/edit?usp=sharing).  \n3. Add Bitly credentials [Bitly API](https://app.bitly.com/settings/api).  \n4. Add Late API key. | Sticky Note5 content                                                                                                     |
| **STEP 2** Add Late API credentials and Twitter account ID in Post Twitter node.                                                                                                                                                                           | Sticky Note5 content                                                                                                     |
| **STEP 3** Add Late API credentials and Threads account ID in Post Thread node.                                                                                                                                                                           | Sticky Note5 content                                                                                                     |
| Use Late API for unified posting to X and Threads. See https://getlate.dev/ for API details.                                                                                                                                                              | Workflow context                                                                                                         |

---

**Disclaimer:** The provided text originates solely from an automated workflow created with n8n, an integration and automation tool. This process strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All handled data is legal and public.