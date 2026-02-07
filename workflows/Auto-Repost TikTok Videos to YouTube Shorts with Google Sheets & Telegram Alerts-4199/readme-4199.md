Auto-Repost TikTok Videos to YouTube Shorts with Google Sheets & Telegram Alerts

https://n8nworkflows.xyz/workflows/auto-repost-tiktok-videos-to-youtube-shorts-with-google-sheets---telegram-alerts-4199


# Auto-Repost TikTok Videos to YouTube Shorts with Google Sheets & Telegram Alerts

### 1. Workflow Overview

This workflow automates the process of reposting TikTok videos as YouTube Shorts, while managing video tracking through Google Sheets and sending alerts via Telegram. It targets content creators or social media managers who want to automatically republish TikTok content onto YouTube Shorts, ensuring no duplicate reposts, and receive notifications about upload status.

The workflow is logically grouped into the following blocks:

- **1.1 Input Reception**  
  Handles manual, scheduled, or Telegram-triggered initiation of the workflow.

- **1.2 TikTok Video Retrieval and Filtering**  
  Fetches TikTok videos via HTTP requests and filters out videos previously processed by checking against Google Sheets.

- **1.3 Video Processing and Metadata Preparation**  
  Prepares video data and metadata for uploading, including editing fields and extracting video information.

- **1.4 YouTube Upload Sequence**  
  A multi-step upload process involving snippet creation, video file download, and final video upload to YouTube Shorts.

- **1.5 Post-Upload Actions and Notifications**  
  Updates Google Sheets with new video entries and sends Telegram alerts about upload outcomes.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  Initiates the workflow either manually, on a schedule, or via Telegram command, allowing flexible triggering options.

- **Nodes Involved:**  
  - Manual Trigger  
  - Schedule Trigger  
  - Telegram Trigger  
  - Code (processing Telegram input)

- **Node Details:**  

  - **Manual Trigger**  
    - Type: Manual trigger node  
    - Role: Allows manual start of the workflow for testing or ad hoc runs  
    - Configuration: Default, no parameters required  
    - Inputs: None  
    - Outputs: To "Edit Fields" node  
    - Failures: None typical; if used incorrectly, workflow halts  

  - **Schedule Trigger**  
    - Type: Schedule trigger node  
    - Role: Automatically triggers workflow at configured intervals (not specified in JSON, user-set)  
    - Configuration: User-defined schedule (cron or interval)  
    - Inputs: None  
    - Outputs: To "Edit Fields" node  
    - Failures: Misconfigured schedule may prevent triggering  

  - **Telegram Trigger**  
    - Type: Telegram trigger node  
    - Role: Listens for Telegram bot commands to start workflow  
    - Configuration: Connected to Telegram bot with webhook ID "7234ed1e-a704-4ba4-8f53-d92dce07414d"  
    - Inputs: Telegram webhook events  
    - Outputs: To "Code" node  
    - Failures: Telegram bot authentication or webhook issues; network errors  

  - **Code**  
    - Type: Code node (JavaScript)  
    - Role: Processes incoming Telegram data, likely parsing commands and extracting parameters  
    - Configuration: Custom JavaScript code (details not provided)  
    - Inputs: From Telegram Trigger  
    - Outputs: To "Fetch TikTok Videos via TG trigger" node  
    - Failures: Code errors, malformed Telegram data, missing parameters  

---

#### 2.2 TikTok Video Retrieval and Filtering

- **Overview:**  
  Retrieves TikTok videos through HTTP requests and filters out ones already processed to avoid duplication.

- **Nodes Involved:**  
  - Fetch TikTok Videos  
  - Fetch TikTok Videos via TG trigger  
  - Edit Fields  
  - Filter New Videos

- **Node Details:**  

  - **Edit Fields**  
    - Type: Set node  
    - Role: Prepare or normalize data fields for TikTok video requests or filtering  
    - Configuration: Sets or modifies necessary parameters before fetching videos  
    - Inputs: From Manual or Schedule Trigger  
    - Outputs: To "Fetch TikTok Videos"  
    - Failures: Misconfiguration may cause invalid requests  

  - **Fetch TikTok Videos**  
    - Type: HTTP Request node  
    - Role: Calls TikTok API or public endpoints to obtain recent videos  
    - Configuration: URL, method, and headers configured to fetch TikTok videos (details not visible)  
    - Inputs: From "Edit Fields"  
    - Outputs: To "Filter New Videos"  
    - Failures: API errors, rate limits, network timeouts, invalid credentials  

  - **Fetch TikTok Videos via TG trigger**  
    - Type: HTTP Request node  
    - Role: Similar to "Fetch TikTok Videos" but triggered specifically by Telegram commands  
    - Configuration: Same as above, possibly with parameters from Telegram input  
    - Inputs: From "Code" node  
    - Outputs: To "Filter New Videos"  
    - Failures: Same as above  

  - **Filter New Videos**  
    - Type: Function node  
    - Role: Filters out TikTok videos already present in Google Sheets to prevent duplicate uploads  
    - Configuration: Custom JavaScript filtering based on video IDs or URLs compared to Google Sheets data  
    - Inputs: From both TikTok video fetch nodes  
    - Outputs: To "Append to Google Sheets" and "Video Information" nodes  
    - Failures: Logic errors, data mismatch, empty input datasets  

---

#### 2.3 Video Processing and Metadata Preparation

- **Overview:**  
  Prepares video metadata and formats needed for YouTube upload.

- **Nodes Involved:**  
  - Append to Google Sheets  
  - Video Information  
  - YouTube Upload Snippet

- **Node Details:**  

  - **Append to Google Sheets**  
    - Type: Google Sheets node  
    - Role: Logs new video entries to a Google Sheets document for tracking  
    - Configuration: Spreadsheet ID, sheet name, and range configured to append rows  
    - Inputs: From "Filter New Videos"  
    - Outputs: None direct; runs asynchronously before video upload  
    - Failures: Google API authentication errors, quota limits, incorrect spreadsheet parameters  

  - **Video Information**  
    - Type: Set node  
    - Role: Sets or enriches video metadata like title, description, tags for YouTube upload  
    - Configuration: Fields set based on filtered video data  
    - Inputs: From "Filter New Videos"  
    - Outputs: To "YouTube Upload Snippet"  
    - Failures: Incorrect or missing metadata can affect upload quality  

  - **YouTube Upload Snippet**  
    - Type: HTTP Request node  
    - Role: Sends snippet metadata to YouTube API as part of the upload process  
    - Configuration: YouTube API endpoint for video snippet insertion, OAuth2 credentials expected  
    - Inputs: From "Video Information"  
    - Outputs: To "Download Video" node  
    - Failures: OAuth token expiration, invalid API request, quota exceeded  

---

#### 2.4 YouTube Upload Sequence

- **Overview:**  
  Downloads the TikTok video and uploads it to YouTube Shorts in a two-step process.

- **Nodes Involved:**  
  - Download Video  
  - YouTube Upload Video

- **Node Details:**  

  - **Download Video**  
    - Type: HTTP Request node  
    - Role: Downloads TikTok video file to be uploaded to YouTube  
    - Configuration: Uses video URL from previous nodes, expects binary data response  
    - Inputs: From "YouTube Upload Snippet"  
    - Outputs: To "YouTube Upload Video"  
    - Failures: Download failures, invalid URLs, network interruptions  

  - **YouTube Upload Video**  
    - Type: HTTP Request node  
    - Role: Uploads the downloaded video as a YouTube Short using YouTube API  
    - Configuration: Multipart upload with video binary data, OAuth2 authentication  
    - Inputs: From "Download Video"  
    - Outputs: To "Telegram" node for notification  
    - Failures: Upload failures, size constraints, API limits, OAuth errors  

---

#### 2.5 Post-Upload Actions and Notifications

- **Overview:**  
  Sends a Telegram notification about the upload status to alert users.

- **Nodes Involved:**  
  - Telegram

- **Node Details:**  

  - **Telegram**  
    - Type: Telegram node  
    - Role: Sends message notifications about the success or failure of the YouTube upload  
    - Configuration: Bot token, chat ID configured to send alerts  
    - Inputs: From "YouTube Upload Video"  
    - Outputs: None (terminal node)  
    - Failures: Telegram API errors, invalid chat ID, network issues  

---

### 3. Summary Table

| Node Name                   | Node Type           | Functional Role                                 | Input Node(s)                | Output Node(s)                            | Sticky Note                                                   |
|-----------------------------|---------------------|------------------------------------------------|-----------------------------|------------------------------------------|---------------------------------------------------------------|
| Manual Trigger              | Manual Trigger      | Manual workflow initiation                      | None                        | Edit Fields                             |                                                               |
| Schedule Trigger            | Schedule Trigger    | Scheduled workflow initiation                   | None                        | Edit Fields                             |                                                               |
| Telegram Trigger            | Telegram Trigger    | Telegram bot command initiation                 | None                        | Code                                   |                                                               |
| Code                       | Code                | Processes Telegram input                         | Telegram Trigger            | Fetch TikTok Videos via TG trigger      |                                                               |
| Edit Fields                | Set                 | Prepares data fields for video fetching         | Manual Trigger, Schedule Trigger | Fetch TikTok Videos                   |                                                               |
| Fetch TikTok Videos         | HTTP Request        | Retrieves TikTok videos                          | Edit Fields                 | Filter New Videos                      |                                                               |
| Fetch TikTok Videos via TG trigger | HTTP Request | Retrieves TikTok videos via Telegram trigger     | Code                        | Filter New Videos                      |                                                               |
| Filter New Videos           | Function            | Filters out previously processed videos         | Fetch TikTok Videos, Fetch TikTok Videos via TG trigger | Append to Google Sheets, Video Information |                                                               |
| Append to Google Sheets     | Google Sheets       | Logs new videos for tracking                     | Filter New Videos           | None                                  |                                                               |
| Video Information           | Set                 | Prepares video metadata for YouTube              | Filter New Videos           | YouTube Upload Snippet                 |                                                               |
| YouTube Upload Snippet      | HTTP Request        | Uploads video snippet metadata to YouTube        | Video Information           | Download Video                        |                                                               |
| Download Video             | HTTP Request        | Downloads TikTok video                            | YouTube Upload Snippet      | YouTube Upload Video                   |                                                               |
| YouTube Upload Video        | HTTP Request        | Uploads video content to YouTube Shorts          | Download Video              | Telegram                             |                                                               |
| Telegram                   | Telegram            | Sends Telegram alert notifications                | YouTube Upload Video        | None                                  |                                                               |
| Sticky Note                | Sticky Note         | N/A                                              | N/A                         | N/A                                   | Several sticky notes present, content empty or not provided   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Add a Manual Trigger node named "Manual Trigger" with default settings.

2. **Create Schedule Trigger Node**  
   - Add a Schedule Trigger node named "Schedule Trigger".  
   - Configure the schedule interval or cron as desired (e.g., every hour).

3. **Create Telegram Trigger Node**  
   - Add a Telegram Trigger node named "Telegram Trigger".  
   - Connect it to your Telegram bot with webhook setup.  
   - Configure bot token and webhook URL accordingly.

4. **Create Code Node for Telegram Input**  
   - Add a Code node named "Code".  
   - Insert JavaScript to parse incoming Telegram messages, extract commands or parameters.  
   - Input: Connect from "Telegram Trigger".  
   - Output: Connect to "Fetch TikTok Videos via TG trigger".

5. **Create Set Node for Field Preparation**  
   - Add a Set node named "Edit Fields".  
   - Configure to set parameters or fields needed for TikTok video fetching (e.g., user ID, API keys).  
   - Inputs: Connect from both "Manual Trigger" and "Schedule Trigger".  
   - Output: Connect to "Fetch TikTok Videos".

6. **Create HTTP Request Node for TikTok Videos (Manual/Scheduled)**  
   - Add an HTTP Request node named "Fetch TikTok Videos".  
   - Configure with TikTok API endpoint or public URL to fetch recent videos.  
   - Method: GET.  
   - Use any required headers or query parameters from "Edit Fields".  
   - Input: Connect from "Edit Fields".  
   - Output: Connect to "Filter New Videos".

7. **Create HTTP Request Node for TikTok Videos (Telegram Trigger)**  
   - Add another HTTP Request node named "Fetch TikTok Videos via TG trigger".  
   - Configuration similar to "Fetch TikTok Videos" but uses parameters parsed from the "Code" node.  
   - Input: Connect from "Code".  
   - Output: Connect to "Filter New Videos".

8. **Create Function Node to Filter New Videos**  
   - Add a Function node named "Filter New Videos".  
   - Write JavaScript code to compare fetched videos against entries in Google Sheets (video IDs or URLs).  
   - Output only videos not found in the sheet.  
   - Inputs: Connect from both TikTok fetch nodes.  
   - Outputs: Connect to both "Append to Google Sheets" and "Video Information".

9. **Create Google Sheets Node to Append New Videos**  
   - Add a Google Sheets node named "Append to Google Sheets".  
   - Configure credentials and spreadsheet ID, sheet name, and range to append rows with video data.  
   - Input: Connect from "Filter New Videos".

10. **Create Set Node for Video Metadata**  
    - Add a Set node named "Video Information".  
    - Configure fields for YouTube upload: title, description, tags, privacy status, etc.  
    - Input: Connect from "Filter New Videos".  
    - Output: Connect to "YouTube Upload Snippet".

11. **Create HTTP Request Node for YouTube Upload Snippet**  
    - Add an HTTP Request node named "YouTube Upload Snippet".  
    - Configure to call YouTube API’s videos.insert endpoint (snippet part).  
    - Use OAuth2 credentials for YouTube API.  
    - Input: Connect from "Video Information".  
    - Output: Connect to "Download Video".

12. **Create HTTP Request Node to Download Video**  
    - Add an HTTP Request node named "Download Video".  
    - Configure to download the TikTok video file URL (binary data).  
    - Input: Connect from "YouTube Upload Snippet".  
    - Output: Connect to "YouTube Upload Video".

13. **Create HTTP Request Node to Upload Video to YouTube**  
    - Add an HTTP Request node named "YouTube Upload Video".  
    - Configure a multipart upload to YouTube API with video file and metadata.  
    - Use OAuth2 credentials.  
    - Input: Connect from "Download Video".  
    - Output: Connect to "Telegram".

14. **Create Telegram Node to Send Alerts**  
    - Add a Telegram node named "Telegram".  
    - Configure bot token and chat ID to send messages.  
    - Input: Connect from "YouTube Upload Video".  
    - Message content: Configure to notify success or failure of upload.

---

### 5. General Notes & Resources

| Note Content                                                                                         | Context or Link                               |
|----------------------------------------------------------------------------------------------------|-----------------------------------------------|
| The workflow supports three trigger modes: manual, scheduled, and Telegram command triggers.      | Workflow design                               |
| Requires OAuth2 credentials for Google Sheets and YouTube API access.                             | Credential setup                              |
| Telegram bot must be configured with proper webhook URL and bot token for triggers and notifications. | Telegram integration                          |
| Video filtering depends on reliable and up-to-date Google Sheets entries to avoid duplicate uploads. | Data integrity consideration                   |
| YouTube API quota limits and OAuth token refresh must be managed for uninterrupted uploads.       | API usage considerations                      |

---

**Disclaimer:** The text provided comes exclusively from a workflow automated with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All manipulated data are legal and public.