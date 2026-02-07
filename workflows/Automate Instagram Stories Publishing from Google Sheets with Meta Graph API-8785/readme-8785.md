Automate Instagram Stories Publishing from Google Sheets with Meta Graph API

https://n8nworkflows.xyz/workflows/automate-instagram-stories-publishing-from-google-sheets-with-meta-graph-api-8785


# Automate Instagram Stories Publishing from Google Sheets with Meta Graph API

### 1. Workflow Overview

This workflow automates the publishing of Instagram Stories from video URLs listed in a Google Sheet. It is designed for Instagram Business Accounts connected via the Facebook Graph API and reads a predefined Google Sheet to find new videos to post as Stories. The workflow ensures only unposted videos are processed, handles video processing status checks with Instagram, and marks videos as posted after successful publication.

The workflow is logically grouped into these blocks:

- **1.1 Setup & Configuration:** Initial configuration settings and user guidance.
- **1.2 Input Reception:** Triggering the workflow manually or via a schedule.
- **1.3 Fetching & Filtering Videos:** Reading video URLs from Google Sheets and selecting unposted videos randomly.
- **1.4 Preparing Video Data for Instagram:** Formatting data and setting variables for API calls.
- **1.5 Instagram Story Container Creation:** Uploading video to Instagram via Facebook Graph API and managing processing status.
- **1.6 Publishing Story:** Publishing the processed video as an Instagram Story.
- **1.7 Post-Publishing Update:** Marking the video as posted in the Google Sheet.
- **1.8 User Guidance & Troubleshooting:** Documentation nodes to help users set up and troubleshoot the workflow.

---

### 2. Block-by-Block Analysis

#### 1.1 Setup & Configuration

**Overview:**  
This block contains nodes providing instructions, setup checklist, and a configuration node where users input essential constants for the workflow operation.

**Nodes Involved:**  
- 📖 SETUP GUIDE (Sticky Note)  
- ⚙️ Configuration Hub (Set node)  
- 📊 Sheet Requirements (Sticky Note)  
- 📱 Video Requirements (Sticky Note)  
- 🔧 Troubleshooting (Sticky Note)  
- ✅ Setup Checklist (Sticky Note)

**Node Details:**

- **📖 SETUP GUIDE**  
  - Type: Sticky Note  
  - Role: Provides a detailed step-by-step setup instruction, including links to a template Google Sheet and general usage tips for non-technical users.  
  - Input/Output: None  
  - Edge Cases: None

- **⚙️ Configuration Hub**  
  - Type: Set node  
  - Role: Stores key configuration variables such as Instagram Business Account ID, Facebook Graph API version, Google Sheet document ID, and Sheet tab name.  
  - Configuration: User must replace placeholder strings with actual values before running workflow.  
  - Key variables: `IG_BUSINESS_ID`, `GRAPH_VERSION`, `SHEET_DOC_ID`, `SHEET_TAB_NAME`  
  - Input: Trigger nodes (Manual or Scheduled)  
  - Output: Used by downstream nodes via expressions.  
  - Edge Cases: Incorrect values prevent the workflow from functioning properly; must be configured once.

- **📊 Sheet Requirements**  
  - Type: Sticky Note  
  - Role: Describes required columns and video URL criteria for the Google Sheet.  
  - Input/Output: None  
  - Edge Cases: Users must ensure sheet matches these requirements or workflow will fail to post.

- **📱 Video Requirements**  
  - Type: Sticky Note  
  - Role: Lists video format and URL accessibility requirements needed for Instagram Stories.  
  - Input/Output: None

- **🔧 Troubleshooting**  
  - Type: Sticky Note  
  - Role: Provides common errors and solutions related to API errors, sheet access, and video processing.  
  - Input/Output: None

- **✅ Setup Checklist**  
  - Type: Sticky Note  
  - Role: Summarizes prep steps and credential requirements for non-technical users.  
  - Input/Output: None

---

#### 1.2 Input Reception

**Overview:**  
This block defines the workflow’s entry points: either a manual trigger for testing or an automated schedule for daily posting.

**Nodes Involved:**  
- 🚀 Manual Start (Manual Trigger)  
- ⏰ Auto Schedule (Schedule Trigger)  

**Node Details:**

- **🚀 Manual Start**  
  - Type: Manual Trigger  
  - Role: Allows manual testing of the workflow; triggers workflow immediately when user clicks.  
  - Input: User action  
  - Output: Passes control to Configuration Hub  
  - Edge Cases: None

- **⏰ Auto Schedule**  
  - Type: Schedule Trigger  
  - Role: Automatically triggers the workflow daily at 8:30 PM by default; configurable.  
  - Parameters: Trigger hour 20 (8 PM), minute 30  
  - Input: Scheduler  
  - Output: Passes control to Configuration Hub  
  - Edge Cases: Misconfigured time may cause unexpected posting times.

---

#### 1.3 Fetching & Filtering Videos

**Overview:**  
Fetches the video list from Google Sheets, randomizes the order to ensure fair content rotation, and isolates the first unposted video for processing.

**Nodes Involved:**  
- ⚙️ Configuration Hub (Set)  
- 📊 Fetch Videos from Sheet (Google Sheets)  
- 🎲 Randomize Order (Sort)  
- 🔄 Process Each Video (SplitInBatches)  
- ❓ Already Posted Check (If)

**Node Details:**

- **📊 Fetch Videos from Sheet**  
  - Type: Google Sheets  
  - Role: Reads all rows from the configured Google Sheet tab, fetching video URLs and posted status.  
  - Configuration: Uses OAuth2 credentials; Sheet and tab names from Config node.  
  - Output: List of all videos with metadata.  
  - Edge Cases: 403 errors if permissions incorrect; sheet not found if tab name wrong.

- **🎲 Randomize Order**  
  - Type: Sort (Random)  
  - Role: Randomly shuffles video list to avoid posting videos in the same order every time.  
  - Input: Video list from Google Sheets  
  - Output: Shuffled list  
  - Edge Cases: None

- **🔄 Process Each Video**  
  - Type: SplitInBatches  
  - Role: Processes videos one by one, enabling conditional logic on each video.  
  - Input: Shuffled video list  
  - Output: Single video item per iteration  
  - Edge Cases: Empty list results in no processing

- **❓ Already Posted Check**  
  - Type: If  
  - Role: Checks if the current video has already been posted (based on 'posted_story' column).  
  - Condition: `posted_story` not equal to string "true" (case sensitive).  
  - True branch: Process video for posting  
  - False branch: Skip and process next video  
  - Edge Cases: Missing or malformed 'posted_story' data may cause logic errors.

---

#### 1.4 Preparing Video Data for Instagram

**Overview:**  
Prepares the data needed for the Facebook Graph API to create an Instagram Story container by setting required variables.

**Nodes Involved:**  
- 🎯 Prepare Video Data (Set)

**Node Details:**

- **🎯 Prepare Video Data**  
  - Type: Set  
  - Role: Defines variables such as Instagram Business Account ID, video URL, and API version for subsequent API calls.  
  - Values set from Config node or current video JSON fields:  
    - `instagram_business_id`  
    - `video_url`  
    - `api_version`  
  - Input: Single video item passing filters  
  - Output: Clean data for API calls  
  - Edge Cases: Missing config values cause failures downstream.

---

#### 1.5 Instagram Story Container Creation and Processing Status

**Overview:**  
Uploads the video to Instagram as a Story container, then polls Instagram to check if the video is processed and ready for publishing.

**Nodes Involved:**  
- 📤 Create Story Container (HTTP Request)  
- 🔍 Check Processing Status (HTTP Request)  
- ✅ Ready to Publish? (If)  
- ⏰ Wait 30 Seconds (Wait)

**Node Details:**

- **📤 Create Story Container**  
  - Type: HTTP Request  
  - Role: Sends POST request to Facebook Graph API to create a media container for the Instagram Story using video URL.  
  - URL constructed dynamically based on graph version and Instagram Business ID.  
  - Query Parameters: `media_type=STORIES`, `video_url` from previous node.  
  - Credentials: Facebook Graph API OAuth2 with Instagram permissions.  
  - Output: Returns container ID for polling.  
  - Edge Cases: Auth errors if credentials invalid; video URL access issues.

- **🔍 Check Processing Status**  
  - Type: HTTP Request  
  - Role: Polls Facebook Graph API for the status of the uploaded video container.  
  - Checks fields: `status_code`, `status`  
  - Output: JSON with video processing status.  
  - Edge Cases: Network timeouts or API rate limits.

- **✅ Ready to Publish?**  
  - Type: If  
  - Role: Checks if `status_code` equals "FINISHED".  
  - True branch: Proceed to publish  
  - False branch: Loop to wait and check again  
  - Edge Cases: Status stuck at "IN_PROGRESS" or "ERROR" requires manual intervention.

- **⏰ Wait 30 Seconds**  
  - Type: Wait  
  - Role: Delays 30 seconds before rechecking processing status to avoid API flooding.  
  - Edge Cases: Can be adjusted for video size or network speed.

---

#### 1.6 Publishing Story

**Overview:**  
Publishes the fully processed Instagram Story media container live on the Instagram Business Account.

**Nodes Involved:**  
- 🎉 Publish to Instagram (Facebook Graph API)

**Node Details:**

- **🎉 Publish to Instagram**  
  - Type: Facebook Graph API node  
  - Role: Publishes the media container as an Instagram Story using the container ID.  
  - Parameters: Uses `creation_id` parameter with container ID from Create Story Container node.  
  - Credentials: Same Facebook Graph API credentials.  
  - Output: Returns media ID confirming successful publishing.  
  - Edge Cases: API errors if container invalid or permissions missing.

---

#### 1.7 Post-Publishing Update

**Overview:**  
Updates the Google Sheet to mark the posted video’s `posted_story` column as "true" to avoid reposting.

**Nodes Involved:**  
- ✏️ Mark as Posted (Google Sheets)

**Node Details:**

- **✏️ Mark as Posted**  
  - Type: Google Sheets  
  - Role: Finds the row by matching the video URL and sets `posted_story` to "true".  
  - Configuration: Uses `appendOrUpdate` operation with `source_url` as matching column.  
  - Credentials: Same Google Sheets OAuth2 credentials as fetch node.  
  - Edge Cases: Duplicate URLs or permissions issues may cause update failures.

---

#### 1.8 User Guidance & Troubleshooting

**Overview:**  
Sticky notes throughout the workflow provide detailed user instructions, troubleshooting tips, and setup checklists to facilitate smooth deployment and maintenance.

**Nodes Involved:**  
- Included in block 1.1 Setup & Configuration

---

### 3. Summary Table

| Node Name               | Node Type                | Functional Role                         | Input Node(s)                | Output Node(s)               | Sticky Note                                                                                               |
|-------------------------|--------------------------|---------------------------------------|-----------------------------|-----------------------------|----------------------------------------------------------------------------------------------------------|
| 📖 SETUP GUIDE          | Sticky Note              | Setup instructions                    | None                        | None                        | 🎬 **Instagram Story Automation Template** - setup steps and usage tips                                  |
| ⚙️ Configuration Hub     | Set                      | Stores config variables               | 🚀 Manual Start, ⏰ Auto Schedule | 📊 Fetch Videos from Sheet   | 🔧 **SETUP REQUIRED** - Replace IG_BUSINESS_ID, GRAPH_VERSION, SHEET_DOC_ID, SHEET_TAB_NAME               |
| 🚀 Manual Start          | Manual Trigger           | Manual workflow trigger               | None                        | ⚙️ Configuration Hub         | 🎯 **FOR TESTING** - manual test before scheduling                                                       |
| ⏰ Auto Schedule          | Schedule Trigger         | Scheduled daily trigger               | None                        | ⚙️ Configuration Hub         | 🕐 Runs daily at 8:30 PM by default                                                                      |
| 📊 Sheet Requirements    | Sticky Note              | Google Sheet format requirements     | None                        | None                        | 📋 Required columns and video URL requirements                                                          |
| 📊 Fetch Videos from Sheet| Google Sheets            | Reads video list from Google Sheet   | ⚙️ Configuration Hub         | 🎲 Randomize Order           | 📥 **CREDENTIAL SETUP REQUIRED** - OAuth2 credentials required                                           |
| 🎲 Randomize Order       | Sort (Random)            | Randomizes video list order           | 📊 Fetch Videos from Sheet   | 🔄 Process Each Video        | 🔀 Ensures fair rotation of videos                                                                       |
| 🔄 Process Each Video    | SplitInBatches           | Processes videos one by one           | 🎲 Randomize Order           | ❓ Already Posted Check       | 🔍 Finds first unposted video                                                                            |
| ❓ Already Posted Check  | If                       | Checks if video is already posted     | 🔄 Process Each Video        | 🎯 Prepare Video Data (true), 🔄 Process Each Video (false) | 🚦 Skips videos marked posted                                                                            |
| 🎯 Prepare Video Data    | Set                      | Prepares variables for API calls      | ❓ Already Posted Check       | 📤 Create Story Container    | 📋 Sets Instagram Business ID, video URL, API version                                                   |
| 📤 Create Story Container| HTTP Request             | Creates Instagram Story container     | 🎯 Prepare Video Data        | 🔍 Check Processing Status   | 🏗️ Requires Facebook Graph API credentials                                                             |
| 🔍 Check Processing Status| HTTP Request            | Checks video processing status        | 📤 Create Story Container    | ✅ Ready to Publish?         | ⏳ Polls processing status until ready                                                                  |
| ✅ Ready to Publish?     | If                       | Checks if video processing finished   | 🔍 Check Processing Status   | 🎉 Publish to Instagram (true), ⏰ Wait 30 Seconds (false) | 🚦 Proceeds only if status = FINISHED                                                                    |
| ⏰ Wait 30 Seconds       | Wait                     | Delays next status check              | ✅ Ready to Publish? (false) | 🔍 Check Processing Status   | ⏸️ Waits 30 sec before rechecking                                                                        |
| 🎉 Publish to Instagram  | Facebook Graph API       | Publishes the Instagram Story         | ✅ Ready to Publish? (true)  | ✏️ Mark as Posted           | 🚀 Publishes video live                                                                                   |
| ✏️ Mark as Posted        | Google Sheets            | Marks video as posted in sheet        | 🎉 Publish to Instagram      | None                        | 📝 Updates `posted_story` column to "true" in Google Sheet                                              |
| 📱 Video Requirements    | Sticky Note              | Instagram video specs and warnings    | None                        | None                        | 📱 Lists video format, duration, URL requirements                                                       |
| 🔧 Troubleshooting       | Sticky Note              | Common issues & fixes                  | None                        | None                        | 🚨 Helps debug common workflow problems                                                                 |
| ✅ Setup Checklist       | Sticky Note              | User checklist for setup               | None                        | None                        | 🎓 Stepwise setup for non-technical users                                                               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Setup & Instruction Nodes:**  
   - Add sticky notes with the provided texts for Setup Guide, Sheet Requirements, Video Requirements, Troubleshooting, and Setup Checklist.

2. **Create the Configuration Hub:**  
   - Add a Set node named "⚙️ Configuration Hub".  
   - Add variables:  
     - `IG_BUSINESS_ID` (string): Instagram Business Account ID (replace placeholder)  
     - `GRAPH_VERSION` (string): Facebook Graph API version (default "v23.0")  
     - `SHEET_DOC_ID` (string): Google Sheet document ID  
     - `SHEET_TAB_NAME` (string): Google Sheet tab name (default "Instagram Videos")  
   - No input connections yet.

3. **Create Workflow Entry Points:**  
   - Add a Manual Trigger node named "🚀 Manual Start".  
   - Add a Schedule Trigger node named "⏰ Auto Schedule" set to daily at 20:30 (8:30 PM).  
   - Connect both triggers’ output to the input of "⚙️ Configuration Hub".

4. **Fetch Videos from Google Sheets:**  
   - Add a Google Sheets node named "📊 Fetch Videos from Sheet".  
   - Configure:  
     - Operation: Read rows from sheet  
     - Sheet Name: `={{ $json.SHEET_TAB_NAME }}` (from Config)  
     - Document ID: `={{ $json.SHEET_DOC_ID }}` (from Config)  
   - Set credentials to Google Sheets OAuth2 with proper permissions.  
   - Connect "⚙️ Configuration Hub" output to this node.

5. **Randomize Video List:**  
   - Add a Sort node named "🎲 Randomize Order" with type "Random".  
   - Connect "📊 Fetch Videos from Sheet" output here.

6. **Process Videos One by One:**  
   - Add a SplitInBatches node named "🔄 Process Each Video".  
   - Connect "🎲 Randomize Order" output here.  
   - No special parameters needed.

7. **Check if Video Already Posted:**  
   - Add an If node named "❓ Already Posted Check".  
   - Condition: `posted_story` does NOT contain "true" (strict, case-sensitive).  
   - Connect "🔄 Process Each Video" first output to the If node.

8. **Prepare Video Data for Instagram:**  
   - Add a Set node named "🎯 Prepare Video Data".  
   - Set variables:  
     - `instagram_business_id` = `={{ $json.IG_BUSINESS_ID || $('⚙️ Configuration Hub').item.json.IG_BUSINESS_ID }}`  
     - `video_url` = `={{ $json.source_url }}`  
     - `api_version` = `={{ $json.GRAPH_VERSION || $('⚙️ Configuration Hub').item.json.GRAPH_VERSION }}`  
   - Connect If node’s true output to this node.

9. **Create Instagram Story Container:**  
   - Add an HTTP Request node named "📤 Create Story Container".  
   - Method: POST  
   - URL: `https://graph.facebook.com/{{ $json.GRAPH_VERSION }}/{{ instagram_business_id }}/media` (use expressions)  
   - Query parameters:  
     - `media_type` = "STORIES"  
     - `video_url` = `{{ $json.video_url }}`  
   - Authentication: Use Facebook Graph API credentials with Instagram permissions.  
   - Connect "🎯 Prepare Video Data" output here.

10. **Check Video Processing Status:**  
    - Add an HTTP Request node named "🔍 Check Processing Status".  
    - Method: GET  
    - URL: `https://graph.facebook.com/{{ $json.GRAPH_VERSION }}/{{ container_id }}` where `container_id` is from "Create Story Container".  
    - Query parameter: `fields=status_code,status`  
    - Use same Facebook Graph API credentials.  
    - Connect output of "📤 Create Story Container" here.

11. **Check if Ready to Publish:**  
    - Add an If node named "✅ Ready to Publish?".  
    - Condition: `status_code` equals "FINISHED".  
    - Connect "🔍 Check Processing Status" output here.

12. **Publish or Wait:**  
    - True output: Connect to Facebook Graph API node "🎉 Publish to Instagram".  
    - False output: Connect to a Wait node "⏰ Wait 30 Seconds".

13. **Wait Before Rechecking:**  
    - Add Wait node "⏰ Wait 30 Seconds" with 30 seconds delay.  
    - Connect its output back to "🔍 Check Processing Status" (loop).

14. **Publish Story:**  
    - Add Facebook Graph API node "🎉 Publish to Instagram".  
    - Set edge to `media_publish`.  
    - Use Instagram Business ID for the node parameter.  
    - Query parameter: `creation_id` set to container ID from "Create Story Container".  
    - Use same Facebook OAuth credentials.  
    - Connect "✅ Ready to Publish?" true output here.

15. **Mark Video as Posted in Google Sheet:**  
    - Add Google Sheets node "✏️ Mark as Posted".  
    - Operation: Append or Update.  
    - Matching column: `source_url`.  
    - Update `posted_story` column to string "true".  
    - Use same Google Sheets credentials.  
    - Connect "🎉 Publish to Instagram" output here.

16. **Connect False Branch of 'Already Posted Check':**  
    - Connect false output back to "🔄 Process Each Video" to process next batch.

17. **Final Connections:**  
    - Make sure all nodes have correct input/output connections as per above steps.

18. **Credential Setup:**  
    - Google Sheets OAuth2: OAuth2 credentials with read/write permissions on the target sheet.  
    - Facebook Graph API: OAuth2 credentials with Instagram Business Account publishing permissions, App ID and App Secret configured.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                     | Context or Link                                                                                              |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| Download Google Sheets video template to start: https://imanetworks.ch/wp-content/uploads/2025/09/Instagram-Videos-Template.xlsx                                | Provided in the 📖 SETUP GUIDE sticky note                                                                    |
| Facebook Graph API documentation: https://developers.facebook.com/docs/graph-api                                                                                 | For understanding API versioning and endpoints                                                               |
| Instagram Business Account ID found in Facebook Business Manager under Instagram Accounts                                                                        | Critical for configuration hub parameter `IG_BUSINESS_ID`                                                    |
| Videos must be publicly accessible without authentication, HTTPS recommended                                                                                     | Common failure cause: private links or sharing links from Google Drive or Dropbox will not work              |
| Use Manual Trigger for initial testing before enabling Schedule Trigger                                                                                          | To avoid unexpected posts during setup                                                                       |
| Troubleshooting sticky note covers common errors including API permissions, Google Sheets access, and video URL issues                                           | Helps in quick diagnosis of errors                                                                            |
| Make sure to maintain unique video URLs in Google Sheet to avoid update conflicts in the 'posted_story' column                                                  | Prevents multiple row updates                                                                                  |
| Scheduling time should match peak audience activity for best engagement                                                                                          | Configurable in Schedule Trigger node                                                                         |

---

This documentation fully describes the workflow structure, node configurations, data flow, and setup considerations, enabling both human operators and AI agents to understand, reproduce, and maintain the Instagram Stories publishing automation.