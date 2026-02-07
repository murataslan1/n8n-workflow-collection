Auto-Publish Social Videos to 9 Platforms via Google Sheets and Blotato

https://n8nworkflows.xyz/workflows/auto-publish-social-videos-to-9-platforms-via-google-sheets-and-blotato-3522


# Auto-Publish Social Videos to 9 Platforms via Google Sheets and Blotato

### 1. Workflow Overview

This workflow automates the multi-platform publishing of social videos by reading video metadata from a Google Sheet, uploading the video to Blotato’s media service, and then posting it simultaneously to nine social media platforms via Blotato’s API. It finally updates the Google Sheet to mark the publishing status as done.

**Target Use Cases:**  
- Marketers, content creators, virtual assistants, and automation specialists managing video content across multiple social platforms.  
- Teams wanting centralized control of social video publishing via a spreadsheet interface.  
- Automating repetitive manual posting tasks to save time and reduce errors.

**Logical Blocks:**  
- **1.1 Scheduling & Input Retrieval:** Trigger the workflow on a schedule and fetch video data from Google Sheets.  
- **1.2 Social Media Account Setup:** Assign platform-specific account IDs for posting.  
- **1.3 Video Upload:** Upload the video URL to Blotato’s media endpoint.  
- **1.4 Multi-Platform Posting:** Post the uploaded video to Instagram, YouTube, TikTok, Facebook, Threads, Twitter (X), LinkedIn, Bluesky, and Pinterest via Blotato’s API.  
- **1.5 Status Update:** Update the Google Sheet row to mark the video as published (`STATUS = DONE`).  
- **1.6 Documentation & Notes:** Sticky note providing overview and links.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduling & Input Retrieval

- **Overview:**  
  This block triggers the workflow daily at 22:00 and retrieves video metadata from a configured Google Sheet.

- **Nodes Involved:**  
  - Schedule Trigger  
  - Get my video

- **Node Details:**  

  - **Schedule Trigger**  
    - Type: Schedule Trigger  
    - Role: Initiates workflow execution daily at 22:00 hours.  
    - Configuration: Trigger set to fire once daily at 22:00.  
    - Inputs: None (start node)  
    - Outputs: Triggers "Get my video" node.  
    - Edge Cases: Workflow won’t run if n8n instance is down at trigger time; no retries configured.

  - **Get my video**  
    - Type: Google Sheets  
    - Role: Reads rows from a Google Sheet containing video metadata.  
    - Configuration: Reads from a specific sheet and document ID (configured via credentials).  
    - Credentials: Uses Google Sheets OAuth2 credentials.  
    - Key Expressions: None explicitly, but reads columns like `URL VIDEO`, `DESCRIPTION`, `Titre`, `row_number`.  
    - Inputs: Triggered by Schedule Trigger.  
    - Outputs: Passes data to "Assign Social Media IDs".  
    - Edge Cases:  
      - Google API quota limits or auth failures.  
      - Empty or malformed rows.  
      - Missing required columns.

#### 1.2 Social Media Account Setup

- **Overview:**  
  Assigns the platform-specific account IDs required for posting to each social media platform via Blotato.

- **Nodes Involved:**  
  - Assign Social Media IDs

- **Node Details:**  

  - **Assign Social Media IDs**  
    - Type: Set  
    - Role: Defines static JSON object containing all social media account IDs.  
    - Configuration: Hardcoded IDs for Instagram, YouTube, TikTok, Facebook, Facebook Page, Threads, Twitter, LinkedIn, Pinterest, Pinterest Board, Bluesky.  
    - Inputs: Receives video data from "Get my video".  
    - Outputs: Passes IDs and video data to "Upload Video to Blotato".  
    - Edge Cases:  
      - IDs must be updated manually to reflect actual account IDs.  
      - Missing or incorrect IDs will cause posting failures downstream.

#### 1.3 Video Upload

- **Overview:**  
  Uploads the video URL from the Google Sheet to Blotato’s media endpoint to obtain a media URL for posting.

- **Nodes Involved:**  
  - Upload Video to Blotato

- **Node Details:**  

  - **Upload Video to Blotato**  
    - Type: HTTP Request  
    - Role: Sends POST request to Blotato API to upload video by URL.  
    - Configuration:  
      - URL: `https://backend.blotato.com/v2/media`  
      - Method: POST  
      - Body: JSON containing `"url"` field set dynamically from `URL VIDEO` column of Google Sheet.  
      - Headers: Includes `blotato-api-key` (API key must be set in node headers).  
    - Inputs: Receives video data and social media IDs.  
    - Outputs: Passes uploaded media URL to all social media posting nodes and Google Sheets update node.  
    - Edge Cases:  
      - API key missing or invalid → auth errors.  
      - Invalid or inaccessible video URL → upload failure.  
      - Network timeouts or API rate limits.

#### 1.4 Multi-Platform Posting

- **Overview:**  
  Posts the uploaded video to nine social media platforms using Blotato’s posting API, each with platform-specific parameters.

- **Nodes Involved:**  
  - INSTAGRAM  
  - YOUTUBE  
  - TIKTOK  
  - FACEBOOK  
  - THREADS  
  - TWETTER (Twitter)  
  - LINKEDIN  
  - BLUESKY  
  - PINTEREST

- **Node Details:**  

  Each node is an HTTP Request node configured to POST to `https://backend.blotato.com/v2/posts` with JSON body specifying:

  - `accountId`: Pulled from "Assign Social Media IDs" node.  
  - `targetType`: Platform name (e.g., "instagram", "youtube").  
  - `content`: Includes `text` from Google Sheet `DESCRIPTION` and `mediaUrls` from uploaded video URL.  
  - Platform-specific parameters where applicable (e.g., YouTube privacy status, Facebook page ID, TikTok privacy settings).

  Common configuration details:  
  - Method: POST  
  - Headers: Include `blotato-api-key`  
  - Body: JSON with dynamic expressions referencing prior nodes.

  **Individual notes:**  
  - **INSTAGRAM:** Uses Instagram account ID, posts with text and media URL.  
  - **YOUTUBE:** Includes title from Google Sheet, privacy set to "unlisted", no subscriber notification.  
  - **TIKTOK:** Includes multiple privacy and content flags (e.g., `isAiGenerated`, `disabledComments`).  
  - **FACEBOOK:** Includes Facebook Page ID for posting to a page.  
  - **THREADS:** Simple post with text and media URL.  
  - **TWETTER:** Posts to Twitter (X) with text and media URL.  
  - **LINKEDIN:** Posts with text and media URL.  
  - **BLUESKY:** Posts with text and media URL; note media URL is hardcoded to an image URL instead of uploaded video URL (potential inconsistency).  
  - **PINTEREST:** Posts with text and media URL; media URL is hardcoded to an image URL (same as Bluesky), uses Pinterest board ID.

  - Inputs: Receive uploaded media URL and social media IDs.  
  - Outputs: None (end nodes for posting).  
  - Edge Cases:  
    - API key or account ID errors → posting failures.  
    - Platform-specific API changes or restrictions.  
    - Hardcoded media URLs in Bluesky and Pinterest may cause inconsistency or errors if video URL is expected.  
    - Network or API rate limits.

#### 1.5 Status Update

- **Overview:**  
  Updates the Google Sheet row corresponding to the published video to mark its status as `DONE`.

- **Nodes Involved:**  
  - Google Sheets (update operation)

- **Node Details:**  

  - **Google Sheets (Update Status)**  
    - Type: Google Sheets  
    - Role: Updates the `STATUS` column to "DONE" for the row identified by `row_number`.  
    - Configuration:  
      - Operation: Update  
      - Matching column: `row_number` (to identify the correct row)  
      - Columns updated: `STATUS` set to "DONE"  
      - Uses same Google Sheets credentials as input node.  
    - Inputs: Receives data from all posting nodes (via parallel connections from "Upload Video to Blotato").  
    - Outputs: None (end node).  
    - Edge Cases:  
      - Google Sheets API errors or auth failures.  
      - Row number mismatch or missing.  
      - Concurrent updates causing race conditions.

#### 1.6 Documentation & Notes

- **Overview:**  
  Provides a sticky note with a summary and links to documentation.

- **Nodes Involved:**  
  - Sticky Note3

- **Node Details:**  

  - **Sticky Note3**  
    - Type: Sticky Note  
    - Role: Displays workflow purpose, platforms covered, and a documentation link.  
    - Content includes:  
      - Summary of the 9-platform auto-publishing.  
      - Link to Notion guide: https://automatisation.notion.site/Workflow-n8n-d-Auto-Post-sur-les-r-seaux-sociaux-1d33d6550fd980b7b43ac417e9a06a9b?pvs=4  
    - Inputs/Outputs: None (annotation only).

---

### 3. Summary Table

| Node Name             | Node Type           | Functional Role                          | Input Node(s)          | Output Node(s)                                                                                          | Sticky Note                                                                                                   |
|-----------------------|---------------------|----------------------------------------|-----------------------|-------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------|
| Schedule Trigger      | Schedule Trigger    | Initiates workflow daily at 22:00      | None                  | Get my video                                                                                           |                                                                                                               |
| Get my video          | Google Sheets       | Reads video metadata from Google Sheet | Schedule Trigger      | Assign Social Media IDs                                                                                |                                                                                                               |
| Assign Social Media IDs| Set                 | Assigns social media account IDs       | Get my video          | Upload Video to Blotato                                                                                |                                                                                                               |
| Upload Video to Blotato| HTTP Request       | Uploads video URL to Blotato media API | Assign Social Media IDs| INSTAGRAM, YOUTUBE, TIKTOK, FACEBOOK, THREADS, TWETTER, LINKEDIN, BLUESKY, PINTEREST, Google Sheets   |                                                                                                               |
| INSTAGRAM             | HTTP Request        | Posts video to Instagram via Blotato   | Upload Video to Blotato| None                                                                                                  |                                                                                                               |
| YOUTUBE               | HTTP Request        | Posts video to YouTube via Blotato     | Upload Video to Blotato| None                                                                                                  |                                                                                                               |
| TIKTOK                | HTTP Request        | Posts video to TikTok via Blotato      | Upload Video to Blotato| None                                                                                                  |                                                                                                               |
| FACEBOOK              | HTTP Request        | Posts video to Facebook via Blotato    | Upload Video to Blotato| None                                                                                                  |                                                                                                               |
| THREADS               | HTTP Request        | Posts video to Threads via Blotato     | Upload Video to Blotato| None                                                                                                  |                                                                                                               |
| TWETTER               | HTTP Request        | Posts video to Twitter (X) via Blotato | Upload Video to Blotato| None                                                                                                  |                                                                                                               |
| LINKEDIN              | HTTP Request        | Posts video to LinkedIn via Blotato    | Upload Video to Blotato| None                                                                                                  |                                                                                                               |
| BLUESKY               | HTTP Request        | Posts video to Bluesky via Blotato     | Upload Video to Blotato| None                                                                                                  |                                                                                                               |
| PINTEREST             | HTTP Request        | Posts video to Pinterest via Blotato   | Upload Video to Blotato| None                                                                                                  |                                                                                                               |
| Google Sheets         | Google Sheets       | Updates STATUS to DONE in Google Sheet | Upload Video to Blotato| None                                                                                                  |                                                                                                               |
| Sticky Note3          | Sticky Note         | Workflow summary and documentation link| None                  | None                                                                                                  | # Auto-Publish to 9 Social Platforms; Automates distribution using Blotato’s API; [Guide](https://automatisation.notion.site/Workflow-n8n-d-Auto-Post-sur-les-r-seaux-sociaux-1d33d6550fd980b7b43ac417e9a06a9b?pvs=4) |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node:**  
   - Type: Schedule Trigger  
   - Set to trigger daily at 22:00 hours (hour = 22).  
   - No credentials needed.

2. **Create a Google Sheets node ("Get my video"):**  
   - Type: Google Sheets  
   - Operation: Read rows from a specific sheet.  
   - Configure with your Google Sheets OAuth2 credentials.  
   - Set Document ID and Sheet Name to your target spreadsheet.  
   - Ensure columns include: `PROMPT`, `DESCRIPTION`, `URL VIDEO`, `Titre`, `row_number`, `STATUS`.  
   - Connect Schedule Trigger output to this node input.

3. **Create a Set node ("Assign Social Media IDs"):**  
   - Type: Set  
   - Mode: Raw JSON  
   - Add JSON with keys and values for each platform’s account ID, e.g.:  
     ```json
     {
       "instagram_id": "111",
       "youtube_id": "222",
       "tiktok_id": "333",
       "facebook_id": "444",
       "facebook_page_id": "555",
       "threads_id": "666",
       "twitter_id": "777",
       "linkedin_id": "888",
       "pinterest_id": "999",
       "pinterest_board_id": "101010",
       "bluesky_id": "111111"
     }
     ```  
   - Connect "Get my video" output to this node input.

4. **Create an HTTP Request node ("Upload Video to Blotato"):**  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://backend.blotato.com/v2/media`  
   - Body Parameters: JSON with `"url"` set dynamically from `URL VIDEO` field of Google Sheets, e.g., `={{ $('Get my video').item.json['URL VIDEO'] }}`  
   - Headers: Add header `blotato-api-key` with your Blotato API key.  
   - Connect "Assign Social Media IDs" output to this node input.

5. **Create HTTP Request nodes for each social platform:**  
   For each platform (Instagram, YouTube, TikTok, Facebook, Threads, Twitter, LinkedIn, Bluesky, Pinterest):  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://backend.blotato.com/v2/posts`  
   - Headers: Include `blotato-api-key` with your API key.  
   - Body: JSON with structure:  
     ```json
     {
       "post": {
         "accountId": "{{ corresponding social media ID from 'Assign Social Media IDs' }}",
         "target": {
           "targetType": "platform_name",
           // Additional platform-specific fields if needed
         },
         "content": {
           "text": "{{ description from 'Get my video' }}",
           "platform": "platform_name",
           "mediaUrls": [
             "{{ uploaded media URL from 'Upload Video to Blotato' }}"
           ]
         }
       }
     }
     ```  
   - Replace `platform_name` and IDs accordingly.  
   - For YouTube, add `title`, `privacyStatus`, and `shouldNotifySubscribers` in `target`.  
   - For Facebook, include `pageId` in `target`.  
   - For TikTok, include privacy and content flags as per original config.  
   - For Bluesky and Pinterest, note the original workflow uses hardcoded media URLs (replace with uploaded media URL for consistency).  
   - Connect "Upload Video to Blotato" output to all these posting nodes in parallel.

6. **Create a Google Sheets node ("Google Sheets" update):**  
   - Type: Google Sheets  
   - Operation: Update  
   - Configure with same Google Sheets OAuth2 credentials.  
   - Set Document ID and Sheet Name to your spreadsheet.  
   - Matching Column: `row_number`  
   - Columns to update: Set `STATUS` to `"DONE"`  
   - Connect "Upload Video to Blotato" output to this node input (parallel to posting nodes).

7. **Create a Sticky Note node (optional):**  
   - Add a sticky note with workflow summary and documentation link for reference.

8. **Connect all nodes as per the flow:**  
   - Schedule Trigger → Get my video → Assign Social Media IDs → Upload Video to Blotato → (all social media posting nodes + Google Sheets update node).

9. **Set credentials:**  
   - Google Sheets OAuth2 credentials for Google Sheets nodes.  
   - Blotato API key in HTTP Request nodes’ header parameters.

10. **Test the workflow:**  
    - Ensure Google Sheet is populated with valid video URLs and metadata.  
    - Confirm Blotato API key and social media IDs are correct.  
    - Run manually or wait for scheduled trigger.  
    - Monitor for errors and adjust IDs or API keys as needed.

---

### 5. General Notes & Resources

| Note Content                                                                                                   | Context or Link                                                                                                                      |
|---------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------|
| Workflow automates video publishing to 9 social platforms using Blotato’s API, eliminating manual posting.    | Overview and purpose of the workflow.                                                                                              |
| Uses Community Nodes, which require self-hosted n8n instances.                                                | Important deployment note.                                                                                                         |
| Documentation and customization guide available on Notion.                                                   | https://automatisation.notion.site/Workflow-n8n-d-Auto-Post-sur-les-r-seaux-sociaux-1d33d6550fd980b7b43ac417e9a06a9b?pvs=4          |
| Demo video walkthrough available on YouTube.                                                                  | https://youtu.be/ChcyNE1kw8Q                                                                                                      |
| Hardcoded media URLs in Bluesky and Pinterest nodes may require adjustment to use uploaded video URLs.       | Potential inconsistency to address for full automation fidelity.                                                                   |
| To customize: add logic to skip rows with `STATUS = DONE`, add more platforms, or replace scheduler with webhook.| Suggestions for workflow enhancement.                                                                                             |

---

This structured documentation provides a comprehensive understanding of the workflow’s design, node configurations, and operational logic, enabling users and automation agents to reproduce, modify, and troubleshoot the workflow effectively.