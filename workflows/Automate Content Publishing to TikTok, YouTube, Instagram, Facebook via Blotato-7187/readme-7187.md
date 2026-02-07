Automate Content Publishing to TikTok, YouTube, Instagram, Facebook via Blotato

https://n8nworkflows.xyz/workflows/automate-content-publishing-to-tiktok--youtube--instagram--facebook-via-blotato-7187


# Automate Content Publishing to TikTok, YouTube, Instagram, Facebook via Blotato

### 1. Workflow Overview

This n8n workflow automates content publishing to multiple social media platforms using the Blotato API as a central publishing service. It is designed to post videos hosted on Google Drive to nine social platforms — TikTok, YouTube, Instagram, Facebook, LinkedIn, Twitter (X), Threads, Bluesky, and Pinterest — on an hourly schedule.

Logical blocks include:

- **1.1 Scheduling and Data Retrieval**: Triggering the workflow hourly and fetching video post data from a Google Sheet.
- **1.2 Google Drive Link Processing**: Extracting the Google Drive file ID from the provided video URL.
- **1.3 Media Upload to Blotato**: Uploading the video to Blotato’s media hosting endpoint.
- **1.4 Multi-Platform Publishing**: Posting the uploaded media with captions to each social platform via Blotato.
- **1.5 Status Update**: Marking the post as "DONE" in the Google Sheet after all platform posts complete.
- **1.6 Documentation and Instructions**: Sticky notes providing setup instructions, reminders, and resource links.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduling and Data Retrieval

**Overview:**  
This block triggers the workflow every hour and retrieves the next video to post from a Google Sheet.

**Nodes Involved:**  
- Check Every 1 Hours  
- URL VIDEO to Post

**Node Details:**

- **Check Every 1 Hours**  
  - Type: Schedule Trigger  
  - Role: Initiates the workflow every 1 hour to check for new content to publish.  
  - Configuration: Interval set to every 1 hour.  
  - Inputs: None (trigger node)  
  - Outputs: Triggers "URL VIDEO to Post" node.  
  - Edge Cases: If the workflow is paused or the scheduler fails, no posts will be checked.  
  - Version: 1.2

- **URL VIDEO to Post**  
  - Type: Google Sheets  
  - Role: Reads the Google Sheet that contains video URLs, titles, captions, and statuses to identify videos ready for posting.  
  - Configuration: Uses OAuth2 credentials for Google Sheets. The sheet and document IDs are dynamic and presumably configured externally.  
  - Inputs: Trigger from "Check Every 1 Hours"  
  - Outputs: Sends data to "Get Google Drive ID" node.  
  - Edge Cases: Authentication errors, empty or malformed sheet data, or missing columns could cause failures.  
  - Version: 4.5

---

#### 2.2 Google Drive Link Processing

**Overview:**  
Extracts the Google Drive file ID from the full URL so the media can be downloaded for upload to Blotato.

**Nodes Involved:**  
- Get Google Drive ID

**Node Details:**

- **Get Google Drive ID**  
  - Type: Set  
  - Role: Parses the Google Drive URL string from the sheet and extracts the file ID using a regex expression.  
  - Configuration: Uses the expression:  
    `={{ $('URL VIDEO to Post').item.json['URL GOOGLE DRIVE'].match(/https:\/\/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)/i)[1] }}`  
    Assigns the extracted ID to the variable `final_google_drive_url`.  
  - Inputs: Data from "URL VIDEO to Post"  
  - Outputs: Passes the extracted ID to "Upload Video to BLOTATO"  
  - Edge Cases: If the URL does not match the regex pattern (e.g., malformed or non-standard URL), the node will error or produce undefined output.  
  - Version: 3.4

---

#### 2.3 Media Upload to Blotato

**Overview:**  
Downloads the video from Google Drive (using the extracted file ID) and uploads it to Blotato’s media resource endpoint.

**Nodes Involved:**  
- Upload Video to BLOTATO

**Node Details:**

- **Upload Video to BLOTATO**  
  - Type: Blotato (community node)  
  - Role: Uploads the video file to Blotato for hosting and distribution to social platforms.  
  - Configuration:  
    - `mediaUrl` set dynamically to `https://drive.google.com/uc?export=download&id={{ $json.final_google_drive_url }}` to download the video file from Google Drive.  
    - Resource set to "media" to indicate media upload.  
  - Inputs: From "Get Google Drive ID"  
  - Outputs: Media URL from Blotato response passed to all social media posting nodes.  
  - Credentials: Requires Blotato API key configured in n8n.  
  - Edge Cases: Network issues, invalid Google Drive ID, Blotato API errors, or unsupported media formats can cause failures.  
  - Version: 2

---

#### 2.4 Multi-Platform Publishing

**Overview:**  
Posts the uploaded video along with captions to nine supported social platforms via Blotato API.

**Nodes Involved:**  
- Tiktok  
- Linkedin  
- Facebook  
- Instagram  
- Twitter (X)  
- Youtube  
- Threads  
- Bluesky  
- Pinterest  
- Merge

**Node Details:**

Each Blotato node shares similar configuration principles, with platform-specific properties:

- **Common Configuration:**
  - Credential: Blotato API key.
  - `postContentText`: Populated from the Google Sheet caption: `={{ $('URL VIDEO to Post').item.json.Caption }}`
  - `postContentMediaUrls`: The media URL output from the "Upload Video to BLOTATO" node: `={{ $json.url }}`
  - `platform` and `accountId` specified per platform.
  
- **Platform Specifics:**
  - Facebook additionally requires `facebookPageId`.
  - Pinterest requires a `pinterestBoardId`.
  - YouTube node includes optional scheduling time and title from the Google Sheet.
  
- **Inputs:** From "Upload Video to BLOTATO"  
- **Outputs:** All feed into the "Merge" node for synchronization.

- **Edge Cases:**
  - Auth errors for individual platform accounts.
  - API rate limits or quota exceeded.
  - Media format or size restrictions by platform.
  - Caption length limitations.
  - Network or service downtime.
  - Platform-specific content policies causing rejections.

- **Version:** 2 for Blotato nodes

- **Merge Node:**
  - Type: Merge  
  - Role: Synchronizes outputs from all platform posting nodes, waiting for all to complete before proceeding.  
  - Configuration: Number of inputs set to 9 (one per platform).  
  - Inputs: From all social platform nodes.  
  - Output: Passes merged data to "Update Status to 'DONE'".

---

#### 2.5 Status Update

**Overview:**  
Updates the Google Sheet to mark the post as "DONE" after all platform posts are successful.

**Nodes Involved:**  
- Update Status to "DONE"

**Node Details:**

- **Update Status to "DONE"**  
  - Type: Google Sheets  
  - Role: Updates or appends the row in the sheet with `Status` = "DONE" based on matching the `Caption` column.  
  - Configuration:  
    - Matching column: "Caption" for row identification.  
    - Columns updated: "Status" set to "DONE", "Caption" updated (redundant with matching).  
  - Inputs: From "Merge" node after all posts complete.  
  - Credentials: Google Sheets OAuth2.  
  - Edge Cases: Sheet write permissions, concurrency issues if multiple posts update simultaneously, or missing matching rows.  
  - Version: 4.5

---

#### 2.6 Documentation and Instructions

**Overview:**  
Sticky notes provide necessary instructions, reminders, and useful resource links for users to understand prerequisites and best practices.

**Nodes Involved:**  
- Sticky Note  
- Sticky Note1  
- Sticky Note3

**Node Details:**

- **Sticky Note**  
  - Content:  
    - Title and purpose description.  
    - YouTube tutorial link with thumbnail.  
    - Blotato official website and documentation links.

- **Sticky Note1**  
  - Content:  
    - Setup instructions including prerequisite Blotato Pro account, API key generation, enabling community nodes, installing Blotato node, Google Sheets template duplication, public Google Drive settings, and workflow completion steps.

- **Sticky Note3**  
  - Content:  
    - Important reminders about avoiding repeated uploads to prevent spam filtering.  
    - Disclosure requirements for AI-generated content.  
    - Useful resource links for Blotato API documentation, troubleshooting dashboard, and media format requirements.

- **Type:** Sticky Note nodes  
- **Role:** User guidance and workflow contextual information.

---

### 3. Summary Table

| Node Name               | Node Type               | Functional Role                                   | Input Node(s)              | Output Node(s)                               | Sticky Note                                                  |
|-------------------------|-------------------------|-------------------------------------------------|----------------------------|----------------------------------------------|--------------------------------------------------------------|
| Check Every 1 Hours      | Schedule Trigger        | Triggers workflow hourly                         | None                       | URL VIDEO to Post                            |                                                              |
| URL VIDEO to Post        | Google Sheets           | Retrieves next video data from Google Sheet     | Check Every 1 Hours        | Get Google Drive ID                          |                                                              |
| Get Google Drive ID      | Set                     | Extracts Google Drive file ID from URL          | URL VIDEO to Post          | Upload Video to BLOTATO                      |                                                              |
| Upload Video to BLOTATO  | Blotato Node            | Uploads video file to Blotato media              | Get Google Drive ID        | Tiktok, Linkedin, Facebook, Instagram, Twitter (X), Youtube, Threads, Bluesky, Pinterest |                                                              |
| Tiktok                  | Blotato Node            | Posts video to TikTok                            | Upload Video to BLOTATO    | Merge                                       |                                                              |
| Linkedin                | Blotato Node            | Posts video to LinkedIn                          | Upload Video to BLOTATO    | Merge                                       |                                                              |
| Facebook                | Blotato Node            | Posts video to Facebook                          | Upload Video to BLOTATO    | Merge                                       |                                                              |
| Instagram               | Blotato Node            | Posts video to Instagram                         | Upload Video to BLOTATO    | Merge                                       |                                                              |
| Twitter (X)             | Blotato Node            | Posts video to Twitter (X)                       | Upload Video to BLOTATO    | Merge                                       |                                                              |
| Youtube                 | Blotato Node            | Posts video to YouTube                           | Upload Video to BLOTATO    | Merge                                       |                                                              |
| Threads                 | Blotato Node            | Posts video to Threads                           | Upload Video to BLOTATO    | Merge                                       |                                                              |
| Bluesky                 | Blotato Node            | Posts video to Bluesky                           | Upload Video to BLOTATO    | Merge                                       |                                                              |
| Pinterest               | Blotato Node            | Posts video to Pinterest                         | Upload Video to BLOTATO    | Merge                                       |                                                              |
| Merge                   | Merge                   | Synchronizes completion of all platform posts  | All platform nodes         | Update Status to "DONE"                      |                                                              |
| Update Status to "DONE" | Google Sheets           | Updates post status in Google Sheet             | Merge                      | None                                         |                                                              |
| Sticky Note             | Sticky Note             | Workflow overview, tutorial and links           | None                       | None                                         | # The ULTIMATE Agent to Auto-Publish Content Hourly...       |
| Sticky Note1            | Sticky Note             | Setup instructions and prerequisites            | None                       | None                                         | ## ⚙️ Requirements ... Setup Instructions — What You Need ... |
| Sticky Note3            | Sticky Note             | Important reminders and resource links          | None                       | None                                         | ## 📢 Auto-Post to All Platforms ... Useful Resources ...      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow in n8n.**

2. **Add a Schedule Trigger node:**
   - Name: `Check Every 1 Hours`
   - Type: Schedule Trigger
   - Configure interval to trigger every 1 hour.

3. **Add a Google Sheets node:**
   - Name: `URL VIDEO to Post`
   - Type: Google Sheets
   - Credentials: Configure with Google Sheets OAuth2 credentials.
   - Parameters:
     - Document ID: Set to your Google Sheet document containing video posts.
     - Sheet Name: Set to the relevant sheet name.
   - Connect `Check Every 1 Hours` output to this node.

4. **Add a Set node:**
   - Name: `Get Google Drive ID`
   - Type: Set
   - Add a new field `final_google_drive_url` (string)
   - Use this expression to extract the file ID:
     ```
     {{$node["URL VIDEO to Post"].json["URL GOOGLE DRIVE"].match(/https:\/\/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)/i)[1]}}
     ```
   - Connect the output of `URL VIDEO to Post` to this node.

5. **Add Blotato node for media upload:**
   - Name: `Upload Video to BLOTATO`
   - Type: Blotato (verified community node)
   - Credentials: Set up with your Blotato API key.
   - Parameters:
     - Resource: `media`
     - Media URL: Use expression:
       ```
       https://drive.google.com/uc?export=download&id={{$json.final_google_drive_url}}
       ```
   - Connect `Get Google Drive ID` to this node.

6. **Add nine Blotato nodes for posting to platforms:**
   - For each platform (TikTok, LinkedIn, Facebook, Instagram, Twitter (X), YouTube, Threads, Bluesky, Pinterest):
     - Name accordingly (e.g., `Tiktok`, `Linkedin`, etc.)
     - Type: Blotato
     - Credentials: Use the same Blotato API credentials.
     - Parameters:
       - Platform: Set to the respective platform.
       - Account ID: Select the corresponding account from Blotato.
       - `postContentText`: Set to `={{ $('URL VIDEO to Post').item.json.Caption }}`
       - `postContentMediaUrls`: Set to `={{ $json.url }}` (output from media upload)
       - Additional platform-specific parameters:
         - Facebook: Add `facebookPageId`.
         - Pinterest: Add `pinterestBoardId`.
         - YouTube: Add optional scheduled time and video title:  
           - ScheduledTime: e.g., `"2025-08-09T08:00:00"`
           - Title: `={{ $('URL VIDEO to Post').item.json.Title }}`
   - Connect the output of `Upload Video to BLOTATO` to all platform posting nodes.

7. **Add a Merge node:**
   - Name: `Merge`
   - Type: Merge
   - Parameters: Set number of inputs to 9 (one for each platform posting node).
   - Connect the output of all nine platform nodes to this Merge node.

8. **Add a Google Sheets node to update status:**
   - Name: `Update Status to "DONE"`
   - Type: Google Sheets
   - Credentials: Use the same Google Sheets OAuth2 credentials.
   - Parameters:
     - Document ID and Sheet Name: same as in `URL VIDEO to Post`.
     - Operation: Append or Update
     - Matching Columns: `Caption`
     - Columns to update:  
       - `Status`: set to `"DONE"`  
       - `Caption`: set to `={{ $('URL VIDEO to Post').item.json.Caption }}`
   - Connect `Merge` node output to this node.

9. **Add Sticky Note nodes for user guidance:**
   - Add three Sticky Note nodes containing:
     - Workflow overview and tutorial link.
     - Setup instructions and prerequisites.
     - Important posting reminders and useful resource links.
   - Position these for user reference; no input/output connections needed.

10. **Save and activate the workflow.**

---

### 5. General Notes & Resources

| Note Content                                                                                                              | Context or Link                                              |
|---------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------|
| The ULTIMATE Agent to Auto-Publish Content Hourly with Blotato + Google Sheets + n8n. Full tutorial video on YouTube.      | https://youtu.be/33opLrLAs3g                                  |
| Blotato API Documentation, API Dashboard for Troubleshooting, Media Format & Size Requirements.                            | https://help.blotato.com/api                                  |
| Setup requires a Blotato Pro plan for API access, Blotato API key, enabling verified community nodes in n8n, and using a public Google Drive folder. | https://blotato.com/?ref=firas                               |
| Avoid uploading the same media repeatedly to prevent spam filters; disclose AI-generated content if required by platforms.| Blotato Terms and Best Practices                              |
| Google Sheet template provided for organizing video post data including title, Google Drive URL, caption, and status.     | https://docs.google.com/spreadsheets/d/1kKGEgdZCLxnILMiOph_YU95-rB8XZsQFz9XJ3gLZvas/edit?usp=sharing |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created with n8n, respecting all current content policies without any illegal, offensive, or protected elements. All data processed is legal and publicly accessible.