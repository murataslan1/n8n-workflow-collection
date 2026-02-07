Automate Image Portfolio Organization with GPT-4o Vision, Google Drive and Notion

https://n8nworkflows.xyz/workflows/automate-image-portfolio-organization-with-gpt-4o-vision--google-drive-and-notion-11150


# Automate Image Portfolio Organization with GPT-4o Vision, Google Drive and Notion

### 1. Workflow Overview

This workflow automates the organization and archiving of photographic images uploaded to a designated Google Drive folder. It leverages GPT-4o Vision’s AI capabilities to analyze images for content and safety, categorizes them into "Portrait" or "Landscape," generates descriptive tags, moves the images into appropriate folders on Google Drive, archives metadata into a Notion database, and sends notifications via Slack.

Logical blocks:

- **1.1 Setup & Trigger**: Initialization of configuration parameters and monitoring Google Drive for new image uploads.
- **1.2 AI Analysis & Safety**: Downloading the image, performing AI vision analysis to classify and describe the image, and conducting an NSFW safety check.
- **1.3 Categorization & Routing**: Routing the workflow based on image category, generating detailed tags for portraits or landscapes, and moving files accordingly.
- **1.4 Archiving & Notification**: Preparing consolidated metadata, creating or updating a Notion database entry, updating Google Drive file descriptions, and sending notifications to Slack.

---

### 2. Block-by-Block Analysis

#### 2.1 Setup & Trigger

- **Overview:**  
  This block sets global variables including folder IDs and channel IDs, and triggers the workflow when a new file is created in a specific Google Drive folder.

- **Nodes Involved:**  
  - Watch for New Images  
  - Workflow Configuration

- **Node Details:**

  1. **Watch for New Images**  
     - *Type:* Google Drive Trigger  
     - *Role:* Watches a specific Google Drive folder ("Inbox") for new files created every minute.  
     - *Configuration:* Watches folder with ID `"1yTbUzOVHIxHBocxY_aSuhJ5KHoTqsn2F"`.  
     - *Input:* Triggered by Google Drive event.  
     - *Output:* Emits metadata of newly created file.  
     - *Edge cases:* Possible delays in trigger firing, permission errors on Google Drive OAuth2 credentials.  
     - *Credentials:* Google Drive OAuth2.

  2. **Workflow Configuration**  
     - *Type:* Set node  
     - *Role:* Defines and exposes workflow-wide configuration parameters (folder IDs, Notion database ID, Slack channel ID).  
     - *Configuration:* Hardcoded string values for:  
       - `portraitsFolderId`: Folder ID for portraits  
       - `landscapesFolderId`: Folder ID for landscapes  
       - `notionDatabaseId`: Notion database ID for archiving  
       - `slackChannel`: Slack channel ID for notifications  
     - *Input:* Receives file metadata from trigger.  
     - *Output:* Passes configuration and file info downstream.  
     - *Edge cases:* Incorrect or outdated folder/database/channel IDs will cause failures downstream.

---

#### 2.2 AI Analysis & Safety

- **Overview:**  
  Downloads the image file from Google Drive, analyzes the image using GPT-4o Vision to classify content, identify NSFW status, generate description and dominant colors, then parses the AI response and performs an NSFW safety check.

- **Nodes Involved:**  
  - Download Image File  
  - AI Vision Analysis  
  - Parse AI Response  
  - Safety Check (NSFW Filter)

- **Node Details:**

  1. **Download Image File**  
     - *Type:* Google Drive node  
     - *Role:* Downloads the image binary data to be analyzed.  
     - *Configuration:* Downloads file using file ID from trigger; binary data stored in property `data`.  
     - *Input:* Receives file metadata and config.  
     - *Output:* Outputs binary image data with metadata.  
     - *Edge cases:* File access errors, large file download timeouts.  
     - *Credentials:* Google Drive OAuth2.

  2. **AI Vision Analysis**  
     - *Type:* Langchain OpenAI node with GPT-4o Vision  
     - *Role:* Sends image base64 data to GPT-4o Vision for analysis.  
     - *Configuration:*  
       - Model: `gpt-4o`  
       - Output: JSON object with fields:  
         - `is_nsfw` (boolean)  
         - `category` (string): "Portrait", "Landscape", or "Other"  
         - `description` (string)  
         - `main_colors` (array of strings)  
       - Input: image base64 binary  
       - Prompt instructs professional photo archiver role with strict JSON output (no markdown)  
     - *Input:* Receives image binary from download node.  
     - *Output:* AI response JSON string embedded in the node output.  
     - *Edge cases:* API auth errors, malformed AI output, rate limits, parsing errors.  
     - *Credentials:* OpenAI API.

  3. **Parse AI Response**  
     - *Type:* Code node (JavaScript)  
     - *Role:* Extracts the raw JSON object from GPT-4o Vision’s response and parses it into structured JSON.  
     - *Configuration:*  
       - Searches recursively to find the AI JSON string (handles cases where response is wrapped in markdown).  
       - Cleans code block marks and parses JSON.  
       - Returns error object if parsing fails.  
     - *Input:* AI Vision Analysis node output.  
     - *Output:* Parsed JSON object with fields: `is_nsfw`, `category`, `description`, `main_colors`.  
     - *Edge cases:* Missing or malformed AI output, unexpected JSON format.

  4. **Safety Check (NSFW Filter)**  
     - *Type:* If node  
     - *Role:* Checks if `is_nsfw` is false to continue workflow safely.  
     - *Configuration:* Condition: `is_nsfw === false`  
     - *Input:* Parsed AI response JSON.  
     - *Output:*  
       - True: proceeds to categorization and routing.  
       - False: triggers NSFW alert notification.  
     - *Edge cases:* Incorrect or missing `is_nsfw` flag; false negatives/positives in NSFW detection.

---

#### 2.3 Categorization & Routing

- **Overview:**  
  Routes images based on AI-determined category, generates context-specific detailed tags using GPT-4o-mini, and moves images to their corresponding Google Drive folders.

- **Nodes Involved:**  
  - Category Router  
  - Generate Portrait Tags  
  - Move to Portraits Folder  
  - Generate Landscape Tags  
  - Move to Landscapes Folder  
  - Merge Routes

- **Node Details:**

  1. **Category Router**  
     - *Type:* Switch node  
     - *Role:* Routes workflow by image category field (`Portrait`, `Landscape`, or `Other`).  
     - *Configuration:* Checks exact string match on `category` field from AI response.  
     - *Input:* Parsed AI response JSON.  
     - *Output:* Three outputs corresponding to each category.  
     - *Edge cases:* Unrecognized categories routed to `Other` output which currently uses landscape tag generation logic (fallback).  

  2. **Generate Portrait Tags**  
     - *Type:* Langchain OpenAI node (GPT-4o-mini)  
     - *Role:* Generates 5 to 10 detailed keywords based on the description for portrait images.  
     - *Configuration:* Prompt template injects AI-generated description.  
     - *Input:* Description field from Parse AI Response.  
     - *Output:* List of keywords or tags in text form.  
     - *Credentials:* OpenAI API.

  3. **Move to Portraits Folder**  
     - *Type:* Google Drive node  
     - *Role:* Moves the image file into the configured "portraits" folder.  
     - *Configuration:* Uses file ID from download node and folder ID from workflow configuration.  
     - *Input:* Output of Generate Portrait Tags node.  
     - *Output:* File metadata after move.  
     - *Credentials:* Google Drive OAuth2.

  4. **Generate Landscape Tags**  
     - *Type:* Langchain OpenAI node (GPT-4o-mini)  
     - *Role:* Generates 5 to 10 detailed keywords based on the description for landscape images (or fallback).  
     - *Configuration:* Same prompt template style as portraits but tailored for landscapes.  
     - *Input:* Description from Parse AI Response.  
     - *Output:* List of keywords or tags in text form.  
     - *Credentials:* OpenAI API.

  5. **Move to Landscapes Folder**  
     - *Type:* Google Drive node  
     - *Role:* Moves the image file into the configured "landscapes" folder.  
     - *Configuration:* Uses file ID from download node and folder ID from workflow configuration.  
     - *Input:* Output of Generate Landscape Tags node.  
     - *Output:* File metadata after move.  
     - *Credentials:* Google Drive OAuth2.

  6. **Merge Routes**  
     - *Type:* Merge node  
     - *Role:* Combines outputs from portrait and landscape move operations back into a single stream.  
     - *Input:* Two inputs from Move to Portraits Folder and Move to Landscapes Folder nodes.  
     - *Output:* Unified file metadata for further processing.

---

#### 2.4 Archiving & Notification

- **Overview:**  
  Consolidates tags and metadata, creates a new page in the Notion database, updates the Google Drive file description with AI-generated info, and sends a Slack notification of successful archiving or NSFW alert if applicable.

- **Nodes Involved:**  
  - Prepare Data for Notion  
  - Save to Notion Database  
  - Update Description API  
  - Send Success Notification  
  - Send NSFW Alert

- **Node Details:**

  1. **Prepare Data for Notion**  
     - *Type:* Code node (JavaScript)  
     - *Role:* Collects and consolidates tags generated by portrait or landscape tag generation nodes, and adds current timestamp.  
     - *Logic:*  
       - Searches latest outputs from "Generate Portrait Tags" and "Generate Landscape Tags" nodes recursively for tag strings.  
       - Defaults to AI description if no tags found.  
       - Adds ISO timestamp as `final_date`.  
     - *Input:* Merged output from file move node.  
     - *Output:* JSON with final tags and date, merged with existing data.  
     - *Edge cases:* Missing tag data; fallback handled gracefully.

  2. **Save to Notion Database**  
     - *Type:* Notion node  
     - *Role:* Creates a new page in the specified Notion database with image metadata.  
     - *Configuration:*  
       - Title: File name  
       - Properties mapped:  
         - Category (Select) from AI response  
         - Description (Rich Text) from AI response  
         - Image URL from Google Drive file web view link  
         - Date (Date) from prepared data (uses Asia/Tokyo timezone)  
         - Tags (Rich Text) from prepared data  
       - Database ID taken from workflow config.  
     - *Input:* Prepared metadata from previous node.  
     - *Output:* Confirmation and page metadata.  
     - *Credentials:* Notion OAuth2 or API token.  
     - *Edge cases:* Invalid database schema or credentials errors.

  3. **Update Description API**  
     - *Type:* HTTP Request node  
     - *Role:* Updates the Google Drive file description with the AI-generated description and tags.  
     - *Configuration:*  
       - PATCH request to Google Drive API v3 for the specific file ID.  
       - Body parameters set `description` field.  
       - Uses Google Drive OAuth2 credentials.  
     - *Input:* Output from Notion save node and AI description.  
     - *Output:* Confirmation of update.  
     - *Edge cases:* API rate limits, permission errors.

  4. **Send Success Notification**  
     - *Type:* Slack node  
     - *Role:* Sends a formatted Slack message to configured channel upon successful archiving.  
     - *Configuration:*  
       - Message includes file name, category, description snippet, and tags.  
       - Channel ID from workflow configuration.  
       - Uses OAuth2 authentication.  
     - *Input:* After updating description API.  
     - *Edge cases:* Slack API errors, channel permissions.

  5. **Send NSFW Alert**  
     - *Type:* Slack node  
     - *Role:* Sends an immediate alert to Slack channel if image is flagged NSFW.  
     - *Configuration:*  
       - Message includes file name and a warning about NSFW content.  
       - Channel ID from workflow configuration.  
     - *Input:* From `Safety Check (NSFW Filter)` node when condition false.  
     - *Edge cases:* Slack API errors, channel permissions.

---

### 3. Summary Table

| Node Name               | Node Type                | Functional Role                                   | Input Node(s)                     | Output Node(s)                    | Sticky Note                                                                                                                                                                                                                                            |
|-------------------------|--------------------------|-------------------------------------------------|----------------------------------|----------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Main Overview           | Sticky Note              | Overview and instructions for the entire workflow | None                             | None                             | # Smart Portfolio Archiver with AI Vision Automate your photography workflow by organizing images using AI vision capabilities. This workflow monitors a Google Drive folder, analyzes new images with GPT-4o, and sorts them while syncing metadata to Notion. |
| Group: Setup            | Sticky Note              | Describes Setup & Trigger block                   | None                             | None                             | ## 1. Setup & Trigger Configure your global IDs (Folders, Database, Channel) and start monitoring for new files.                                                                                                                                         |
| Group: Analysis         | Sticky Note              | Describes AI Analysis & Safety block              | None                             | None                             | ## 2. AI Analysis & Safety Downloads the image, analyzes it with GPT-4o, and performs an NSFW safety check before proceeding.                                                                                                                           |
| Group: Routing          | Sticky Note              | Describes Categorization & Routing block          | None                             | None                             | ## 3. Categorization & Routing Routes the workflow based on image category, generates context-aware tags, and moves files to their respective folders.                                                                                                  |
| Group: Archive          | Sticky Note              | Describes Archiving & Notification block           | None                             | None                             | ## 4. Archiving & Notification Consolidates metadata, creates a Notion page, updates the Google Drive description, and notifies Slack of the result.                                                                                                     |
| Watch for New Images    | Google Drive Trigger     | Watches Google Drive "Inbox" folder for new files | None                             | Workflow Configuration           |                                                                                                                                                                                                                                                        |
| Workflow Configuration  | Set                      | Sets folder IDs, Notion database, and Slack channel IDs | Watch for New Images             | Download Image File              |                                                                                                                                                                                                                                                        |
| Download Image File     | Google Drive             | Downloads image file for analysis                  | Workflow Configuration           | AI Vision Analysis              |                                                                                                                                                                                                                                                        |
| AI Vision Analysis      | Langchain OpenAI (GPT-4o Vision) | Analyzes image content and safety                   | Download Image File              | Parse AI Response               |                                                                                                                                                                                                                                                        |
| Parse AI Response       | Code                     | Parses AI output JSON from GPT-4o Vision           | AI Vision Analysis              | Safety Check (NSFW Filter)      |                                                                                                                                                                                                                                                        |
| Safety Check (NSFW Filter) | If                      | Checks NSFW flag; routes accordingly                | Parse AI Response               | Category Router; Send NSFW Alert |                                                                                                                                                                                                                                                        |
| Category Router         | Switch                   | Routes by category: Portrait, Landscape, Other      | Safety Check (NSFW Filter)      | Generate Portrait Tags; Generate Landscape Tags |                                                                                                                                                                                                                                                        |
| Generate Portrait Tags  | Langchain OpenAI (GPT-4o-mini) | Generates detailed tags for Portrait images          | Category Router (Portrait path) | Move to Portraits Folder        |                                                                                                                                                                                                                                                        |
| Move to Portraits Folder | Google Drive             | Moves image to portraits folder                      | Generate Portrait Tags          | Merge Routes                   |                                                                                                                                                                                                                                                        |
| Generate Landscape Tags | Langchain OpenAI (GPT-4o-mini) | Generates detailed tags for Landscape images         | Category Router (Landscape/Other) | Move to Landscapes Folder       |                                                                                                                                                                                                                                                        |
| Move to Landscapes Folder | Google Drive             | Moves image to landscapes folder                      | Generate Landscape Tags         | Merge Routes                   |                                                                                                                                                                                                                                                        |
| Merge Routes            | Merge                    | Merges portrait and landscape branches              | Move to Portraits Folder; Move to Landscapes Folder | Prepare Data for Notion        |                                                                                                                                                                                                                                                        |
| Prepare Data for Notion | Code                     | Consolidates tags and timestamps for Notion entry   | Merge Routes                   | Save to Notion Database        |                                                                                                                                                                                                                                                        |
| Save to Notion Database | Notion                   | Creates a Notion page with image metadata            | Prepare Data for Notion         | Update Description API          |                                                                                                                                                                                                                                                        |
| Update Description API  | HTTP Request             | Updates Google Drive file description with AI data  | Save to Notion Database        | Send Success Notification      |                                                                                                                                                                                                                                                        |
| Send Success Notification | Slack                   | Sends notification on successful archival            | Update Description API          | None                         |                                                                                                                                                                                                                                                        |
| Send NSFW Alert         | Slack                    | Sends alert if image flagged as NSFW                  | Safety Check (NSFW Filter, false path) | None                         |                                                                                                                                                                                                                                                        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Google Drive Trigger Node (Watch for New Images):**  
   - Type: Google Drive Trigger  
   - Event: fileCreated  
   - Poll interval: every minute  
   - Folder to watch: set folder ID for your Inbox folder  
   - Credentials: Google Drive OAuth2  

2. **Create Set Node (Workflow Configuration):**  
   - Define variables:  
     - `portraitsFolderId` (string): ID of portraits folder  
     - `landscapesFolderId` (string): ID of landscapes folder  
     - `notionDatabaseId` (string): Notion database ID  
     - `slackChannel` (string): Slack channel ID  
   - Connect Watch for New Images output to this node.

3. **Create Google Drive Node (Download Image File):**  
   - Operation: Download  
   - File ID: `={{ $json.id }}` from Workflow Configuration input  
   - Binary property name: `data`  
   - Credentials: Google Drive OAuth2  
   - Connect Workflow Configuration output to this node.

4. **Create Langchain OpenAI Node (AI Vision Analysis):**  
   - Model: `gpt-4o`  
   - Operation: Analyze image (resource: image, inputType: base64)  
   - Prompt: Request JSON output with fields `is_nsfw`, `category`, `description`, `main_colors`  
   - Credentials: OpenAI API  
   - Connect Download Image File output as input.

5. **Create Code Node (Parse AI Response):**  
   - JavaScript to extract and parse JSON from AI response string  
   - Connect AI Vision Analysis output to this node.

6. **Create If Node (Safety Check NSFW Filter):**  
   - Condition: `$json.is_nsfw === false`  
   - Connect Parse AI Response output to this node.

7. **Create Switch Node (Category Router):**  
   - Property to check: `$json.category`  
   - Cases: "Portrait", "Landscape", "Other"  
   - Connect Safety Check true output to this node.

8. **Create Langchain OpenAI Node (Generate Portrait Tags):**  
   - Model: `gpt-4o-mini`  
   - Prompt: Generate 5–10 keywords based on description for Portraits  
   - Connect Category Router "Portrait" output here.

9. **Create Google Drive Node (Move to Portraits Folder):**  
   - Operation: Move  
   - File ID: `={{ $('Download Image File').item.json.id }}`  
   - Folder ID: from Workflow Configuration `portraitsFolderId`  
   - Credentials: Google Drive OAuth2  
   - Connect Generate Portrait Tags output here.

10. **Create Langchain OpenAI Node (Generate Landscape Tags):**  
    - Model: `gpt-4o-mini`  
    - Prompt: Generate 5–10 keywords for Landscape (can be reused for "Other")  
    - Connect Category Router "Landscape" and "Other" outputs here.

11. **Create Google Drive Node (Move to Landscapes Folder):**  
    - Operation: Move  
    - File ID: same as above  
    - Folder ID: from Workflow Configuration `landscapesFolderId`  
    - Credentials: Google Drive OAuth2  
    - Connect Generate Landscape Tags output here.

12. **Create Merge Node (Merge Routes):**  
    - Merge inputs from Move to Portraits Folder and Move to Landscapes Folder  
    - Connect both move nodes outputs here.

13. **Create Code Node (Prepare Data for Notion):**  
    - JavaScript to collect tags from either portrait or landscape tag nodes and set current date ISO string  
    - Connect Merge Routes output here.

14. **Create Notion Node (Save to Notion Database):**  
    - Resource: databasePage  
    - Database ID: from Workflow Configuration `notionDatabaseId`  
    - Map properties:  
      - Title: file name from Download Image File  
      - Category (Select): from Parse AI Response  
      - Description (Rich Text): from Parse AI Response  
      - Image URL (URL): Google Drive webViewLink  
      - Date (Date): from Prepare Data for Notion (Asia/Tokyo timezone)  
      - Tags (Rich Text): from Prepare Data for Notion  
    - Credentials: Notion API  
    - Connect Prepare Data for Notion output here.

15. **Create HTTP Request Node (Update Description API):**  
    - Method: PATCH  
    - URL: `https://www.googleapis.com/drive/v3/files/{{ fileId }}` where `fileId` from Download Image File  
    - Body: JSON with `description` field combining AI description and tags  
    - Authentication: Google Drive OAuth2  
    - Connect Save to Notion Database output here.

16. **Create Slack Node (Send Success Notification):**  
    - Channel: from Workflow Configuration `slackChannel`  
    - Message: includes file name, category, description snippet, tags  
    - Credentials: Slack OAuth2  
    - Connect Update Description API output here.

17. **Create Slack Node (Send NSFW Alert):**  
    - Channel: from Workflow Configuration `slackChannel`  
    - Message: warns about NSFW content with file name  
    - Credentials: Slack OAuth2  
    - Connect Safety Check (NSFW Filter) false output here.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                           | Context or Link                                    |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------|
| The Notion database must have properties: Category (Select), Description (Text), Tags (Text), and Date configured exactly to receive data correctly from this workflow.                                                                                                 | Node: Save to Notion Database                      |
| Slack notifications require OAuth2 authentication and a configured Slack app with permissions to post in the target channel.                                                                                                                                          | Nodes: Send Success Notification, Send NSFW Alert |
| Workflow requires Google Drive OAuth2 credentials with permission to read, move, and update files in the monitored and destination folders.                                                                                                                           | Multiple Google Drive nodes                         |
| OpenAI API keys must support GPT-4o Vision and GPT-4o-mini models for image analysis and tag generation tasks.                                                                                                                                                         | Nodes: AI Vision Analysis, Generate Portrait/ Landscape Tags |
| The workflow assumes all input images are valid files supported by GPT-4o Vision; corrupt or unsupported file types may cause errors.                                                                                                                                   | AI Vision Analysis node                            |
| Workflow is designed with safety in mind: NSFW content is blocked from further processing and triggers an immediate Slack alert.                                                                                                                                       | Safety Check (NSFW Filter), Send NSFW Alert nodes |
| The workflow is inactive by default; enable it in n8n to start processing.                                                                                                                                                                                             | Workflow metadata                                  |

---

**Disclaimer:** The text provided originates exclusively from an automated workflow created with n8n, an integration and automation tool. This process strictly adheres to applicable content policies and contains no illegal, offensive, or protected material. All data handled is legal and public.