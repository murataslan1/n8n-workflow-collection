Auto-Download Reddit Memes to Google Drive with Duplicate Detection & Telegram Alerts

https://n8nworkflows.xyz/workflows/auto-download-reddit-memes-to-google-drive-with-duplicate-detection---telegram-alerts-7719


# Auto-Download Reddit Memes to Google Drive with Duplicate Detection & Telegram Alerts

# Auto-Download Reddit Memes to Google Drive with Duplicate Detection & Telegram Alerts

---

### 1. Workflow Overview

This workflow automates the process of downloading new meme images from Reddit, saving them to a specified Google Drive folder, and notifying via Telegram about new downloads. It intelligently avoids downloading duplicates by checking for existing images in Google Drive before download. The workflow cycles through a configurable list of subreddits, fetching new posts and filtering for Reddit-hosted images.

**Target Use Cases:**

- Automatically archive new meme images from selected Reddit subreddits.
- Prevent repeated downloads of the same images.
- Receive instant notifications about new downloads or absence thereof.
- Suitable for meme collectors, content curators, or social media managers.

**Logical Blocks:**

- **1.1 Trigger & Settings Initialization:** Cron trigger and configuration parameters setup.
- **1.2 Subreddit Selection & Posts Retrieval:** Random subreddit selection and fetching new Reddit posts.
- **1.3 Image Filtering & Duplicate Detection:** Filtering for Reddit images and checking Google Drive for duplicates.
- **1.4 Download & Upload Process:** Downloading new images and uploading them to Google Drive.
- **1.5 Aggregation & Notification:** Aggregating new images and sending Telegram notifications.
- **1.6 Control Flow & Utilities:** Looping through posts, waiting between requests, and conditional branching.
- **1.7 Documentation & Notes:** Embedded sticky notes with instructions and credits.

---

### 2. Block-by-Block Analysis

---

#### 1.1 Trigger & Settings Initialization

**Overview:**  
Starts the workflow on a schedule and initializes all necessary configuration variables used throughout the process.

**Nodes Involved:**  
- Cron  
- Settings

**Node Details:**

- **Cron**  
  - Type: Schedule Trigger  
  - Triggers workflow periodically based on set interval (default: every minute).  
  - No inputs, output triggers the workflow.  
  - Potential failure: misconfiguration of schedule could prevent trigger.

- **Settings**  
  - Type: Set  
  - Assigns key configuration variables:  
    - `telegram_chat_id`: Telegram chat ID for notifications (string).  
    - `wait_in_seconds`: Delay between processing each image (number, default 1).  
    - `image_base_url`: Domain to filter images (string, default "i.redd.it").  
    - `subreddits_array`: Array of subreddit names to choose from (example: ['subreddit1', 'subreddit2', 'subreddit3']).  
  - Inputs from Cron, outputs assigned variables for downstream nodes.  
  - Edge cases: Ensure correct formats and valid values; empty or incorrect `telegram_chat_id` disables notifications.

---

#### 1.2 Subreddit Selection & Posts Retrieval

**Overview:**  
Randomly picks a subreddit from the configured list and fetches the latest 30 new posts from that subreddit.

**Nodes Involved:**  
- Get random subreddit  
- Get Reddit posts

**Node Details:**

- **Get random subreddit**  
  - Type: Code  
  - Uses JavaScript to select a random subreddit from `subreddits_array` set in Settings.  
  - Outputs the selected subreddit name as `subreddit` field.  
  - Input: Settings node.  
  - Output: Passes selected subreddit to Reddit node.  
  - Failure: Empty subreddit array or code errors cause no subreddit selection.

- **Get Reddit posts**  
  - Type: Reddit  
  - Operation: getAll, Category: new posts.  
  - Subreddit input dynamic from previous node.  
  - Retrieves latest posts from chosen subreddit.  
  - Credentials: Reddit OAuth2 API required.  
  - Output: List of posts in JSON format.  
  - Failure: Reddit API rate limiting, invalid credentials, or subreddit restrictions.

---

#### 1.3 Image Filtering & Duplicate Detection

**Overview:**  
Filters posts to keep only those with images hosted on Reddit's image domain, and checks if images already exist in Google Drive to avoid duplicates.

**Nodes Involved:**  
- Keep only images  
- Loop Posts  
- Image variables  
- Search image in drive  
- Is a new image?

**Node Details:**

- **Keep only images**  
  - Type: Filter  
  - Filters posts where the image URL domain matches `image_base_url` (default "i.redd.it").  
  - Input: Get Reddit posts output.  
  - Output: Posts with Reddit-hosted images only.  
  - Edge case: Posts without images or non-matching domains are excluded.

- **Loop Posts**  
  - Type: SplitInBatches  
  - Processes posts one by one (batch size = 1).  
  - Input: Filtered posts.  
  - Output: Single post per iteration for further processing.  
  - Edge case: Empty input leads to no iterations.

- **Image variables**  
  - Type: Set  
  - Extracts `image_url` and constructs `image_name` from the post's URL (filename from URL path segment).  
  - Input: Loop Posts output.  
  - Output: Passes image metadata for drive search.  
  - Edge case: Malformed URLs may cause incorrect naming.

- **Search image in drive**  
  - Type: Google Drive  
  - Searches Google Drive folder for existing files matching `image_name`.  
  - Folder ID specified for memes folder.  
  - Credentials: Google Drive OAuth2 required.  
  - Output: Drive search result to determine image existence.  
  - Failure: Google API errors, expired credentials, or folder misconfiguration.

- **Is a new image?**  
  - Type: If (Condition)  
  - Checks if search result contains no matching file (`id` does not exist).  
  - If true: image is new → proceed to download.  
  - If false: image exists → skip download, continue loop.  
  - Edge case: Search failures lead to false negatives or positives.

---

#### 1.4 Download & Upload Process

**Overview:**  
Downloads new images from Reddit and uploads them to the designated Google Drive folder.

**Nodes Involved:**  
- Download image  
- Upload image to drive  
- Wait between requests

**Node Details:**

- **Download image**  
  - Type: HTTP Request  
  - Downloads image file from `image_url`.  
  - Uses Reddit OAuth2 credentials for authenticated requests.  
  - Headers include Accept for image content types.  
  - Output: File binary data stored in `image` property.  
  - Edge cases: Network failures, invalid URLs, authentication errors.

- **Upload image to drive**  
  - Type: Google Drive  
  - Uploads downloaded image file to specified Drive folder.  
  - Uses OAuth2 Google Drive credentials.  
  - Input: binary data from Download image node.  
  - Edge cases: Drive API limits, quota exceeded, invalid folder.

- **Wait between requests**  
  - Type: Wait  
  - Delays processing between image downloads using `wait_in_seconds` from settings.  
  - Input: Loop Posts output to pace iterations.  
  - Edge case: Excessive delays increase total workflow time.

---

#### 1.5 Aggregation & Notification

**Overview:**  
Aggregates newly downloaded images and notifies a Telegram chat about the results, or indicates if no new images were found.

**Nodes Involved:**  
- Keep only new images  
- Aggregate new images  
- Have new images?  
- Notify on Telegram  
- Send no new images text

**Node Details:**

- **Keep only new images**  
  - Type: Filter  
  - Filters images that have a valid `createdTime` property indicating newness.  
  - Input: Loop Posts output.  
  - Output: Only new images proceed to aggregation.

- **Aggregate new images**  
  - Type: Aggregate  
  - Collects all new images into a single array under key `new_images`.  
  - Input: Filtered new images.  
  - Output: Aggregated array to feed notification condition.

- **Have new images?**  
  - Type: If (Condition)  
  - Checks if `new_images` array is not empty.  
  - True branch: trigger Telegram notification for new images.  
  - False branch: send "no new images" Telegram message.

- **Notify on Telegram**  
  - Type: Telegram  
  - Sends message with count of new images downloaded.  
  - Uses Telegram bot credentials and chat ID from settings.  
  - Edge cases: Invalid chat ID or bot token disables notifications.

- **Send no new images text**  
  - Type: Telegram  
  - Sends message indicating no new images were downloaded.  
  - Same credentials and chat ID as above.

---

#### 1.6 Control Flow & Utilities

**Overview:**  
Manages looping through posts, pacing requests, and conditional branching for efficient processing.

**Nodes Involved:**  
- Loop Posts (already covered)  
- Wait between requests (already covered)  
- Connections between nodes ensuring proper sequential execution.

**Node Details:**

- Loop Posts and Wait nodes ensure one image is processed at a time with delay to respect Reddit's rate limits and avoid API throttling.

---

#### 1.7 Documentation & Notes

**Overview:**  
Embedded sticky notes provide instructions, configuration guidance, and author credit.

**Nodes Involved:**  
- Sticky Note  
- Sticky Note1  
- Sticky Note6

**Node Details:**

- **Sticky Note**  
  - Detailed explanation of workflow steps, required credentials, and setup instructions.  
  - Links to Reddit app creation, Google Drive API setup, and Telegram bot creation.

- **Sticky Note1**  
  - Configuration tips for variables in Settings node, including example subreddit list and wait time.

- **Sticky Note6**  
  - Author LinkedIn profile link.

---

### 3. Summary Table

| Node Name             | Node Type           | Functional Role                            | Input Node(s)             | Output Node(s)                | Sticky Note                                                                                      |
|-----------------------|---------------------|-------------------------------------------|---------------------------|------------------------------|-------------------------------------------------------------------------------------------------|
| Cron                  | Schedule Trigger    | Starts workflow periodically              | -                         | Settings                     |                                                                                                 |
| Settings              | Set                 | Initializes configuration variables       | Cron                      | Get random subreddit          | See Sticky Note1 for variable configuration details                                             |
| Get random subreddit   | Code                | Selects a random subreddit from the list  | Settings                  | Get Reddit posts             |                                                                                                 |
| Get Reddit posts       | Reddit              | Fetches latest posts from chosen subreddit| Get random subreddit       | Keep only images             | Requires Reddit OAuth2 credentials                                                              |
| Keep only images       | Filter              | Filters posts to Reddit-hosted images     | Get Reddit posts           | Loop Posts                   |                                                                                                 |
| Loop Posts            | SplitInBatches      | Processes each post individually          | Keep only images           | Keep only new images, Wait between requests |                                                                                                 |
| Keep only new images   | Filter              | Filters posts that have valid creation time| Loop Posts                | Aggregate new images         |                                                                                                 |
| Aggregate new images   | Aggregate           | Collects all new images into an array     | Keep only new images       | Have new images?             |                                                                                                 |
| Have new images?       | If                  | Checks if new images array is non-empty   | Aggregate new images       | Notify on Telegram, Send no new images text |                                                                                                 |
| Notify on Telegram     | Telegram             | Sends notification about new images       | Have new images? (true)    | -                            | Requires Telegram bot credentials and chat ID                                                  |
| Send no new images text| Telegram             | Sends notification when no new images     | Have new images? (false)   | -                            | Requires Telegram bot credentials and chat ID                                                  |
| Wait between requests  | Wait                | Delays between processing images          | Loop Posts (second output) | Image variables              |                                                                                                 |
| Image variables        | Set                 | Extracts image URL and name                | Wait between requests      | Search image in drive        |                                                                                                 |
| Search image in drive  | Google Drive        | Checks for image existence in Drive       | Image variables            | Is a new image?              | Requires Google Drive OAuth2 credentials                                                       |
| Is a new image?        | If                  | Decides to download or skip based on Drive search | Search image in drive | Download image, Loop Posts    |                                                                                                 |
| Download image         | HTTP Request        | Downloads image file from Reddit           | Is a new image? (true)     | Upload image to drive        | Requires Reddit OAuth2 credentials                                                             |
| Upload image to drive  | Google Drive        | Uploads downloaded image to Drive folder  | Download image             | Loop Posts                   | Requires Google Drive OAuth2 credentials                                                       |
| Sticky Note            | Sticky Note         | Workflow overview and setup instructions  | -                         | -                            | Contains detailed workflow explanation and credential setup instructions                        |
| Sticky Note1           | Sticky Note         | Configuration variable tips                | -                         | -                            | Configuration guidance for Settings node variables                                             |
| Sticky Note6           | Sticky Note         | Author contact                             | -                         | -                            | Author LinkedIn: https://www.linkedin.com/in/vikthyr                                          |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Cron node**  
   - Type: Schedule Trigger  
   - Configure interval as desired (default every 1 minute) to start the workflow periodically.

2. **Create a Set node named "Settings"**  
   - Define variables:  
     - `telegram_chat_id` (string): Your Telegram chat ID.  
     - `wait_in_seconds` (number): Delay between requests (default 1).  
     - `image_base_url` (string): Set to "i.redd.it".  
     - `subreddits_array` (array): List of subreddit names to monitor (e.g., ['memes', 'funny', 'pics']).  
   - Connect Cron → Settings.

3. **Add a Code node named "Get random subreddit"**  
   - JavaScript code to pick a random subreddit from `subreddits_array`:  
     ```js
     const subreddits = $input.first().json.subreddits_array;
     const randomIndex = Math.floor(Math.random() * subreddits.length);
     return [{ json: { subreddit: subreddits[randomIndex] } }];
     ```  
   - Connect Settings → Get random subreddit.

4. **Add a Reddit node named "Get Reddit posts"**  
   - Operation: getAll  
   - Category: new  
   - Subreddit: Expression `={{ $json.subreddit }}`  
   - Credentials: Set up Reddit OAuth2 API credentials (script app type).  
   - Connect Get random subreddit → Get Reddit posts.

5. **Add a Filter node named "Keep only images"**  
   - Condition: `$json.url.split('/')[2]` equals `={{ $node["Settings"].json["image_base_url"] }}`  
   - Connect Get Reddit posts → Keep only images.

6. **Add a SplitInBatches node named "Loop Posts"**  
   - Batch size: 1  
   - Connect Keep only images → Loop Posts.

7. **Add a Filter node named "Keep only new images"**  
   - Condition: `$json.createdTime` exists  
   - Connect Loop Posts (main output) → Keep only new images.

8. **Add an Aggregate node named "Aggregate new images"**  
   - Aggregate all item data, destination field: `new_images`  
   - Connect Keep only new images → Aggregate new images.

9. **Add an If node named "Have new images?"**  
   - Condition: `new_images` array is not empty  
   - Connect Aggregate new images → Have new images?

10. **Add two Telegram nodes:**  
    - "Notify on Telegram":  
      - Text: `={{ $json.new_images.length }} new images downloaded from Reddit`  
      - Chat ID: Expression `={{ $node["Settings"].json["telegram_chat_id"] }}`  
      - Credentials: Telegram Bot API  
      - Connect Have new images? (true) → Notify on Telegram  
    - "Send no new images text":  
      - Text: "No new images downloaded from Reddit"  
      - Chat ID same as above  
      - Credentials: Telegram Bot API  
      - Connect Have new images? (false) → Send no new images text

11. **Add a Wait node named "Wait between requests"**  
    - Duration: Expression `={{ $node["Settings"].json["wait_in_seconds"] }}` seconds  
    - Connect Loop Posts (second output) → Wait between requests.

12. **Add a Set node named "Image variables"**  
    - Assign:  
      - `image_url` = `={{ $json.url }}`  
      - `image_name` = `={{ $json.url.split("/")[3] }}`  
    - Connect Wait between requests → Image variables.

13. **Add a Google Drive node named "Search image in drive"**  
    - Resource: fileFolder  
    - Operation: Search files  
    - Query: Expression `={{ $json.image_name }}`  
    - Folder ID: Your Google Drive folder ID for memes  
    - Limit: 1  
    - Credentials: Google Drive OAuth2  
    - Connect Image variables → Search image in drive.

14. **Add an If node named "Is a new image?"**  
    - Condition: Check if `id` field in search result does not exist (string operation: notExists)  
    - Connect Search image in drive → Is a new image?

15. **Add HTTP Request node named "Download image"**  
    - URL: Expression `={{ $node["Image variables"].json["image_url"] }}`  
    - Response format: File (binary)  
    - Headers: Accept image/*  
    - Authentication: Reddit OAuth2 API credentials  
    - Connect Is a new image? (true) → Download image.

16. **Add Google Drive node named "Upload image to drive"**  
    - Operation: Upload file  
    - Folder ID: Same Google Drive memes folder  
    - Input data field: `image` (binary data from Download image)  
    - Credentials: Google Drive OAuth2  
    - Connect Download image → Upload image to drive.

17. **Loop Control:**  
    - Connect Upload image to drive → Loop Posts (to continue batch processing).  
    - Connect Is a new image? (false) → Loop Posts (skip download).  

18. **Final connections:**  
    - Connect Loop Posts (main output) → Keep only new images (to filter new images).  

19. **Add Sticky Note nodes for documentation:**  
    - Place detailed workflow explanation, configuration hints, and author LinkedIn as per original.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                             | Context or Link                                                                                                                      |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------|
| Workflow execution flow: Cron trigger → Random subreddit selection → Fetch latest new posts → Filter Reddit-hosted images → Check Google Drive for duplicates → Download new images → Upload to Drive → Telegram notifications. Smart duplicate prevention saves bandwidth!                     | Sticky Note embedded in workflow                                                                                                   |
| Required credentials setup: Reddit OAuth2 API (script app), Google Drive OAuth2 with upload scopes, Telegram Bot API with bot token and chat ID.                                                                                                                                          | Sticky Note embedded in workflow                                                                                                   |
| Configuration tips: Update `telegram_chat_id`, `subreddits_array`, `wait_in_seconds`, and `image_base_url` in Settings node. Keep wait time low but respect Reddit rate limits.                                                                                                           | Sticky Note1                                                                                                                      |
| Author LinkedIn profile for contact and updates: [https://www.linkedin.com/in/vikthyr](https://www.linkedin.com/in/vikthyr)                                                                                                                                                              | Sticky Note6                                                                                                                      |

---

**Disclaimer:** The text above originates exclusively from an automated workflow created with n8n, respecting content policies with no illegal or protected content. All data handled is legal and public.