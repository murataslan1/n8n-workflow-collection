Automate Video Content Posting to Multiple Social Platforms with Postiz

https://n8nworkflows.xyz/workflows/automate-video-content-posting-to-multiple-social-platforms-with-postiz-6653


# Automate Video Content Posting to Multiple Social Platforms with Postiz

### 1. Workflow Overview

This workflow automates the scheduling and posting of video content from a monitored Google Drive folder to multiple social media platforms via the Postiz API. It targets content managers and social media marketers who manage video posts across TikTok, YouTube, Facebook, Instagram, and Threads, allowing them to automate the upload process with human-in-the-loop confirmation for scheduling details.

The workflow is divided into the following logical blocks:

- **1.1 Input Reception & File Download:** Detects new video files added to a specific Google Drive folder and downloads them.
- **1.2 Video Upload & Integration Retrieval:** Uploads the downloaded video to Postiz and retrieves available social media integrations.
- **1.3 Integration Splitting & Filtering:** Splits the available integrations and routes the workflow to platform-specific scheduling paths.
- **1.4 Human Confirmation & Scheduling Fields Setup:** Sends a confirmation email to a user to verify title, caption, and scheduling datetime, then sets default posting options.
- **1.5 DateTime Extraction & Scheduling:** Extracts the intended post datetime in ISO format and schedules posts on each social media platform using Postiz.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & File Download

- **Overview:** Watches a specific Google Drive folder for new video files, then downloads the detected file for processing.
- **Nodes Involved:**  
  - Google Drive Trigger  
  - Download file

- **Node Details:**

  - **Google Drive Trigger**  
    - *Type:* Trigger node for Google Drive events  
    - *Configuration:* Watches for new files created every minute in a specified Google Drive folder (ID: `1t3A6BXYskPkAl_VxS5-NjSyzjLiNxv-B`)  
    - *Key Variables:* Outputs file metadata including file ID, name, and mime type  
    - *Input:* None (trigger)  
    - *Output:* File metadata JSON  
    - *Potential Failures:* OAuth token expiration; API rate limits; folder permission errors

  - **Download file**  
    - *Type:* Google Drive operation node  
    - *Configuration:* Downloads the file identified by the trigger's output ID  
    - *Key Variables:* Uses expression `={{ $json.id }}` to specify file to download  
    - *Input:* Output from Google Drive Trigger  
    - *Output:* Binary file data for upload  
    - *Potential Failures:* File no longer available; download timeout; permission denied; large file size issues

#### 2.2 Video Upload & Integration Retrieval

- **Overview:** Uploads the downloaded video file to Postiz and retrieves configured social media integrations for scheduling.
- **Nodes Involved:**  
  - Upload to Postiz  
  - Get integrations

- **Node Details:**

  - **Upload to Postiz**  
    - *Type:* HTTP Request node  
    - *Configuration:* POST multipart/form-data upload to `https://api.postiz.com/public/v1/upload` with binary video file as "file" parameter  
    - *Authentication:* HTTP header auth using Postiz API key  
    - *Input:* Binary data from Download file node  
    - *Output:* JSON response with uploaded file ID and path for scheduling  
    - *Potential Failures:* Network errors; invalid API key; file too large; malformed request

  - **Get integrations**  
    - *Type:* Postiz node (custom community node)  
    - *Configuration:* Calls Postiz API to retrieve all social media integrations linked to the account  
    - *Input:* Triggered after datetime extraction (see block 2.5)  
    - *Output:* List of integration objects with platform identifiers  
    - *Potential Failures:* API limits; invalid credentials; empty integration list

#### 2.3 Integration Splitting & Filtering

- **Overview:** Splits the list of integrations into individual entries and filters them by platform to route scheduling calls accordingly.
- **Nodes Involved:**  
  - Split Out  
  - Filter (TikTok)  
  - Filter1 (YouTube)  
  - Filter2 (Facebook)  
  - Filter3 (Instagram)  
  - Filter4 (Threads)

- **Node Details:**

  - **Split Out**  
    - *Type:* Data split node  
    - *Configuration:* Splits array output from Get integrations using fields `id, identifier`  
    - *Input:* Output from Get integrations  
    - *Output:* One integration per item  
    - *Potential Failures:* Empty input data; unexpected field structure

  - **Filter / Filter1 / Filter2 / Filter3 / Filter4**  
    - *Type:* Filter nodes  
    - *Configuration:* Each filters by matching the `identifier` field to a specific platform string: "tiktok", "youtube", "facebook", "instagram", "threads" respectively  
    - *Input:* Output from Split Out  
    - *Output:* Filtered single integration per platform  
    - *Potential Failures:* Case sensitivity; missing or unexpected `identifier` values

#### 2.4 Human Confirmation & Scheduling Fields Setup

- **Overview:** Sends an email to a configured address requesting confirmation of the post title, caption, and date/time. Upon response, sets default posting option fields.
- **Nodes Involved:**  
  - Set fields  
  - Send email and wait for reply

- **Node Details:**

  - **Set fields**  
    - *Type:* Set node  
    - *Configuration:* Predefines default post options such as privacy, duet/stitch/comment permissions, music, brand toggles, posting method, YouTube and Instagram post types, and the email address to send confirmation to (`yourEmail`)  
    - *Input:* Output from Upload to Postiz  
    - *Output:* JSON with default settings and email recipient  
    - *Potential Failures:* Incorrect default values or missing required fields

  - **Send email and wait for reply**  
    - *Type:* Gmail node with sendAndWait operation  
    - *Configuration:* Sends a confirmation email with a custom form requesting Title, Date time, and Caption (all required) to the email defined in Set fields  
    - *Input:* Output from Set fields  
    - *Output:* User-submitted form data on reply  
    - *Authentication:* OAuth2 Gmail credentials  
    - *Potential Failures:* Email delivery issues; user non-response or delays; malformed form response

#### 2.5 DateTime Extraction & Scheduling

- **Overview:** Extracts and formats the scheduling datetime from user input, then triggers scheduling posts on each filtered platform.
- **Nodes Involved:**  
  - Extract datetime  
  - Schedule on TikTok  
  - Schedule on Youtube  
  - Schedule on Facebook  
  - Schedule on Instagram  
  - Schedule on Threads

- **Node Details:**

  - **Extract datetime**  
    - *Type:* LangChain information extractor node  
    - *Configuration:* Parses the "Date time" text from user input into ISO 8601 datetime with milliseconds and UTC timezone  
    - *Input:* Output from Send email and wait for reply  
    - *Output:* ISO 8601 datetime string for scheduling  
    - *Potential Failures:* Ambiguous or invalid date/time input; LangChain API errors

  - **Schedule on TikTok**  
    - *Type:* Postiz node  
    - *Configuration:* Schedules video post on TikTok with custom post settings (title, privacy, duet, stitch, comment, autoAddMusic, brand toggles, and posting method) using uploaded file info and user caption  
    - *Input:* Integration filtered for TikTok, datetime from Extract datetime, uploaded video ID/path, and user form data  
    - *Output:* Scheduling confirmation response  
    - *Potential Failures:* Invalid post settings; API errors; scheduling conflicts

  - **Schedule on Youtube**  
    - *Type:* Postiz node  
    - *Configuration:* Schedules video post on YouTube with title and privacy type (public, unlisted, private) from user data and set fields  
    - *Input:* YouTube integration, datetime, uploaded video info, user caption  
    - *Output:* Scheduling confirmation  
    - *Potential Failures:* Invalid privacy type; quota limits; API errors

  - **Schedule on Facebook**  
    - *Type:* Postiz node  
    - *Configuration:* Schedules video post on Facebook with title and uploaded video info  
    - *Input:* Facebook integration, datetime, video, caption  
    - *Output:* Scheduling confirmation  
    - *Potential Failures:* API or permission errors

  - **Schedule on Instagram**  
    - *Type:* Postiz node  
    - *Configuration:* Schedules Instagram post with title and post_type (post or story) and uploaded video info  
    - *Input:* Instagram integration, datetime, video, caption  
    - *Output:* Scheduling confirmation  
    - *Potential Failures:* Invalid post_type; API errors

  - **Schedule on Threads**  
    - *Type:* Postiz node  
    - *Configuration:* Schedules Threads post with similar parameters as other platforms  
    - *Input:* Threads integration, datetime, video, caption  
    - *Output:* Scheduling confirmation  
    - *Potential Failures:* API limitations; invalid data

---

### 3. Summary Table

| Node Name                  | Node Type                        | Functional Role                            | Input Node(s)                  | Output Node(s)                     | Sticky Note                                                                                                          |
|----------------------------|---------------------------------|--------------------------------------------|-------------------------------|-----------------------------------|----------------------------------------------------------------------------------------------------------------------|
| Google Drive Trigger        | Google Drive Trigger             | Detect new files in Google Drive folder    | None                          | Download file                     | See Sticky Note4 for setup and requirements                                                                          |
| Download file              | Google Drive                    | Download video file from Drive              | Google Drive Trigger           | Upload to Postiz                  |                                                                                                                      |
| Upload to Postiz           | HTTP Request                    | Upload video binary to Postiz API           | Download file                 | Set fields                       |                                                                                                                      |
| Set fields                | Set                             | Define default social media posting options| Upload to Postiz              | Send email and wait for reply    | Sticky Note2: "Adjust your social media settings according to your needs"                                            |
| Send email and wait for reply | Gmail                         | Send confirmation email and wait user input| Set fields                   | Extract datetime                 |                                                                                                                      |
| Extract datetime          | LangChain Information Extractor | Extract ISO datetime from user input        | Send email and wait for reply | Get integrations                 |                                                                                                                      |
| Get integrations          | Postiz                         | Retrieve social media integrations           | Extract datetime              | Split Out                       |                                                                                                                      |
| Split Out                 | Split Out                      | Split integrations list into individual items| Get integrations             | Filter, Filter1, Filter2, Filter3, Filter4|                                                                                                                  |
| Filter                    | Filter                        | Filter for TikTok integration                | Split Out                    | Schedule on TikTok               |                                                                                                                      |
| Filter1                   | Filter                        | Filter for YouTube integration               | Split Out                    | Schedule on Youtube             |                                                                                                                      |
| Filter2                   | Filter                        | Filter for Facebook integration              | Split Out                    | Schedule on Facebook            |                                                                                                                      |
| Filter3                   | Filter                        | Filter for Instagram integration             | Split Out                    | Schedule on Instagram           |                                                                                                                      |
| Filter4                   | Filter                        | Filter for Threads integration               | Split Out                    | Schedule on Threads             |                                                                                                                      |
| Schedule on TikTok        | Postiz                         | Schedule TikTok video post                    | Filter                      | None                          | Sticky Note1: Details on TikTok post settings                                                                        |
| Schedule on Youtube       | Postiz                         | Schedule YouTube video post                   | Filter1                     | None                          | Sticky Note3: YouTube post settings                                                                                   |
| Schedule on Facebook      | Postiz                         | Schedule Facebook video post                  | Filter2                     | None                          |                                                                                                                      |
| Schedule on Instagram     | Postiz                         | Schedule Instagram video post                 | Filter3                     | None                          | Sticky Note: Instagram post settings                                                                                   |
| Schedule on Threads       | Postiz                         | Schedule Threads video post                    | Filter4                     | None                          |                                                                                                                      |
| Sticky Note1              | Sticky Note                    | TikTok post settings explanation              | None                        | None                          | See block 2.5 for detailed setting explanation                                                                       |
| Sticky Note2              | Sticky Note                    | Guidance for adjusting social media settings  | None                        | None                          |                                                                                                                      |
| Sticky Note3              | Sticky Note                    | YouTube post setting explanations              | None                        | None                          |                                                                                                                      |
| Sticky Note               | Sticky Note                    | Instagram post settings explanation             | None                        | None                          |                                                                                                                      |
| Sticky Note4              | Sticky Note                    | Setup requirements and configuration instructions| None                       | None                          | Provides project requirements and setup links                                                                        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Google Drive Trigger**  
   - Node type: Google Drive Trigger  
   - Configure to trigger on "fileCreated" event in a specific folder by folder ID (`1t3A6BXYskPkAl_VxS5-NjSyzjLiNxv-B`)  
   - Set polling interval to every minute  
   - Authenticate with Google Drive OAuth2 credentials  

2. **Add Download file node**  
   - Node type: Google Drive  
   - Operation: Download  
   - File ID: Set to the ID output from Google Drive Trigger using expression `={{ $json.id }}`  
   - Connect Google Drive Trigger → Download file  
   - Use same Google Drive OAuth2 credentials  

3. **Add HTTP Request node ("Upload to Postiz")**  
   - Node type: HTTP Request  
   - Method: POST  
   - URL: `https://api.postiz.com/public/v1/upload`  
   - Content-Type: multipart-form-data  
   - Body parameters: Add formBinaryData parameter named "file", bind input data field to binary data from Download file node  
   - Authentication: HTTP Header Auth with Postiz API key  
   - Connect Download file → Upload to Postiz  

4. **Add Set node ("Set fields")**  
   - Node type: Set  
   - Assign the following fields with default values (adjust as needed):  
     - privacy_level: "PUBLIC_TO_EVERYONE"  
     - duet: false  
     - stitch: false  
     - comment: false  
     - autoAddMusic: "no"  
     - brand_content_toggle: false  
     - brand_organic_toggle: true  
     - content_posting_method: "UPLOAD"  
     - youtubeType: "public"  
     - instagramType: "post"  
     - toEmail: your email address for confirmation  
   - Include other fields from Upload to Postiz output  
   - Connect Upload to Postiz → Set fields  

5. **Add Gmail node ("Send email and wait for reply")**  
   - Node type: Gmail  
   - Operation: Send and wait for reply  
   - SendTo: Use `toEmail` from Set fields  
   - Subject: "Confirm post scheduling"  
   - Message: "Please confirm the details to schedule the post"  
   - Form fields:  
     - Title (textarea, required)  
     - Date time (textarea, required)  
     - Caption (textarea, required)  
   - Disable append attribution  
   - Authenticate with Gmail OAuth2 credentials  
   - Connect Set fields → Send email and wait for reply  

6. **Add LangChain Information Extractor node ("Extract datetime")**  
   - Node type: LangChain Information Extractor  
   - Input text: Use `Date time` from form response `={{ $json.data['Date time'] }}`  
   - Attribute: Name "datetime", required, description instructing ISO 8601 format with UTC  
   - Connect Send email and wait for reply → Extract datetime  
   - Authenticate with OpenAI API if required  

7. **Add Postiz node ("Get integrations")**  
   - Node type: Postiz  
   - Operation: getIntegrations  
   - Connect Extract datetime → Get integrations  
   - Authenticate with Postiz API credentials  

8. **Add Split Out node ("Split Out")**  
   - Node type: Split Out  
   - Field to split out: `id, identifier`  
   - Connect Get integrations → Split Out  

9. **Add Filter nodes for each platform:**  
   - For each platform (TikTok, YouTube, Facebook, Instagram, Threads), add a Filter node:  
     - Filter condition: `identifier` equals platform name string (e.g., "tiktok")  
   - Connect Split Out → all Filter nodes in parallel  

10. **Add Postiz nodes for scheduling posts on each platform:**  
    - Node type: Postiz  
    - Operation: schedule  
    - Parameters for each platform node:  
      - Date: Use extracted datetime from Extract datetime node  
      - Type: "schedule"  
      - Posts: Build post object with content (caption), image/video using uploaded file ID/path, and platform-specific settings (title, privacy, post_type, etc.) pulled from Set fields and user form data  
    - Connect each Filter node → corresponding Schedule node  

11. **Wire all schedule nodes as outputs; no further connections needed**  

12. **Add Sticky Notes as informational nodes** for TikTok, YouTube, Instagram setting explanations and overall setup instructions (optional but recommended for maintainability).  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                               | Context or Link                                                                                             |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------|
| Workflow requires an active Postiz account with connected social media platforms and Postiz API key configured in n8n credentials.                                                                                                                                                                                                                      | [Postiz](https://postiz.com/?ref=onenode)                                                                 |
| The Postiz community node must be installed from https://www.npmjs.com/package/n8n-nodes-postiz to enable platform-specific scheduling nodes.                                                                                                                                                                                                            | Node package link                                                                                           |
| Google Drive folder must be accessible with OAuth2 credentials and contain video files for automatic triggering and posting.                                                                                                                                                                                                                              | Google Drive API setup                                                                                      |
| Human-in-the-loop confirmation via email enables manual validation and correction of post title, caption, and scheduling datetime before posts are published.                                                                                                                                                                                             | Gmail OAuth2 setup                                                                                          |
| Date/time extraction uses LangChain information extractor with OpenAI GPT-4.1 model; ensure OpenAI API key is configured and usage quotas are monitored.                                                                                                                                                                                                   | OpenAI API documentation                                                                                    |
| TikTok post settings include options for privacy level, duet, stitch, comments, and branded content toggles — these must be correctly set in the Set fields node per the sticky note instructions.                                                                                                                                                           | Sticky note content on TikTok post settings                                                                |
| YouTube posts support different privacy levels: public, unlisted, private. Instagram supports post or story types. These settings are customizable in the Set fields node.                                                                                                                                                                                 | Sticky notes on YouTube and Instagram post settings                                                        |
| For large video files, consider API and network timeout settings; monitor workflow error executions for failed uploads or scheduling errors. Implement retry logic externally if needed.                                                                                                                                                                     |                                                                                                            |