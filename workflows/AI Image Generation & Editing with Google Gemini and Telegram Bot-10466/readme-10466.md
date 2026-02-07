AI Image Generation & Editing with Google Gemini and Telegram Bot

https://n8nworkflows.xyz/workflows/ai-image-generation---editing-with-google-gemini-and-telegram-bot-10466


# AI Image Generation & Editing with Google Gemini and Telegram Bot

### 1. Workflow Overview

This workflow enables AI-driven image generation and editing through Telegram using Google Gemini’s generative image capabilities and Google Drive for storage. It is designed for users interacting via a Telegram bot, allowing them to upload images or send text prompts and receive AI-edited images in response.

The workflow is logically organized into these main blocks:

- **1.1 Telegram Input Reception:** Listens for incoming Telegram messages and distinguishes between image uploads and text messages.
- **1.2 Image Download and Preparation:** Downloads images sent by users, converts them to base64, and prepares them for upload and processing.
- **1.3 Upload and Record Management:** Uploads images to Google Drive, maintains metadata in Airtable records, and informs users about upload status.
- **1.4 Conditional Message Handling:** Checks if the user has an existing record and sends appropriate Telegram responses guiding the user.
- **1.5 AI Image Editing and Return Flow:** Downloads stored images, sends them with user text prompts to Google Gemini for editing, processes the AI response, uploads the edited image back to Drive, updates records, and sends the final image back to the user.

---

### 2. Block-by-Block Analysis

#### 2.1 Telegram Input Reception  
- **Overview:** Captures incoming Telegram messages (text or images) and routes them based on content type.  
- **Nodes Involved:**  
  - Telegram Trigger  
  - If1 (conditional check for photo existence)  
- **Node Details:**  
  - *Telegram Trigger*: Listens to user messages in Telegram via webhook; triggers workflow on any new message update.  
    - Configured to capture "message" updates only.  
    - Outputs full Telegram message JSON.  
    - Potential failures: webhook misconfiguration, network issues.  
  - *If1*: Checks if the incoming message contains a photo array (first photo exists).  
    - Condition: existence of `message.photo[0]`.  
    - Routes messages with photos to image processing branch; others to text processing.  
    - Edge case: messages with no photo property or empty photo array.  

#### 2.2 Image Download and Preparation  
- **Overview:** Downloads Telegram images, converts them into base64 format for easy API transmission and Drive upload.  
- **Nodes Involved:**  
  - Download Image1  
  - Transform to base  
  - Merge  
  - Aggregate  
  - Edit Fields  
- **Node Details:**  
  - *Download Image1*: Downloads the largest photo version from Telegram using `file_id` from the message.  
    - Input: `message.photo[2].file_id` (highest resolution photo).  
    - Outputs binary file data.  
    - Failures: Telegram API limits, file not found.  
  - *Transform to base*: Converts downloaded binary image into base64 string in JSON property.  
    - Converts binary data to a property for further processing.  
  - *Merge*: Combines multiple binary and JSON paths in the workflow to unify data.  
  - *Aggregate*: Aggregates all item data into a single item for consistent downstream processing.  
  - *Edit Fields*: Sets key variables like image link, image hash, and user ID for record keeping.  
    - Uses expressions to extract data from previous nodes and Telegram Trigger.  
    - Edge cases: missing or incomplete data from previous steps.  

#### 2.3 Upload and Record Management  
- **Overview:** Uploads the prepared image to a designated Google Drive folder, updates Airtable record with image metadata, and confirms upload via Telegram message.  
- **Nodes Involved:**  
  - Upload file  
  - Create or update a record  
  - Send a text message1  
- **Node Details:**  
  - *Upload file*: Uploads base64 image file to Google Drive in a specific folder ("Home Furnishing AI").  
    - Filename based on Telegram file unique ID.  
    - Requires Google Drive credentials with proper permissions.  
    - Potential failures: OAuth errors, quota exceeded, network failure.  
  - *Create or update a record*: Updates or inserts Airtable record keyed by user ID with new image link.  
    - Uses Airtable base and table configured for storing user images.  
    - Matching based on user ID to update existing records.  
    - Failures: Airtable API limits, incorrect field mapping.  
  - *Send a text message1*: Sends confirmation message to user that image was uploaded successfully and requests edit instructions.  
    - Uses user Telegram ID from trigger node.  
    - Edge cases: Telegram API send failures.  

#### 2.4 Conditional Message Handling  
- **Overview:** Checks if user has a saved record to decide the appropriate Telegram reply message.  
- **Nodes Involved:**  
  - Search records (Airtable)  
  - If (record exists)  
  - Send a text message (waiting message)  
  - Send a text message2 (upload prompt)  
- **Node Details:**  
  - *Search records*: Searches Airtable for record with user ID matching Telegram sender ID.  
    - Filter formula: `{ID} = "user_id"`.  
    - Outputs record data if found.  
    - Failures: API limits, missing base/table.  
  - *If*: Checks if returned record contains a valid ID (record exists).  
  - *Send a text message*: Sends a "Please wait 30 seconds" message if record found.  
  - *Send a text message2*: Requests user to upload an image if no record found.  
    - Edge cases: slow Airtable response, incorrect matching.  

#### 2.5 AI Image Editing and Return Flow  
- **Overview:** Downloads the stored base image, extracts base64, sends prompt and image to Google Gemini for editing, converts and uploads the edited image, updates record, and sends the edited photo back to Telegram.  
- **Nodes Involved:**  
  - Download File  
  - Extract from File  
  - Edit Fields1  
  - Edit Image (Google Gemini API HTTP Request)  
  - Convert To File (Code node)  
  - Upload file1 (Google Drive)  
  - Create or update a record1 (Airtable)  
  - Send a photo message (Telegram)  
- **Node Details:**  
  - *Download File*: HTTP request to download image from stored Drive link in Airtable record.  
  - *Extract from File*: Converts downloaded binary to base64 property.  
  - *Edit Fields1*: Prepares data for image editing API, including message text and base64 image.  
  - *Edit Image*: Calls Google Gemini API to generate edited image content based on prompt and base image.  
    - POST request to Gemini model endpoint.  
    - Headers include API key (to be replaced).  
    - Body combines prompt text and inline image data (base64 jpeg).  
    - Failures: API key missing/invalid, rate limits, malformed requests.  
  - *Convert To File*: Custom code node that extracts base64 image data from Gemini response, validates it, converts to PNG binary, and prepares for upload.  
    - Includes robust error handling for missing or malformed base64 data.  
    - Detects image format signatures and normalizes to PNG.  
  - *Upload file1*: Uploads generated PNG file to Google Drive under user-specific filename.  
  - *Create or update a record1*: Updates Airtable record with new base image link.  
  - *Send a photo message*: Sends the edited image back to the user on Telegram as a photo message.  
  - Edge cases: corrupted API response, invalid image data, upload failures, Telegram send errors.  

---

### 3. Summary Table

| Node Name               | Node Type               | Functional Role                     | Input Node(s)           | Output Node(s)                     | Sticky Note                                                                                                                |
|-------------------------|-------------------------|-----------------------------------|------------------------|----------------------------------|----------------------------------------------------------------------------------------------------------------------------|
| Telegram Trigger        | telegramTrigger          | Entry point, captures Telegram messages | -                      | If1                              | ## Telegram Input This part collects user messages or images from Telegram. The trigger starts the workflow each time user sends something. IF node checks message type and sends it to the correct branch for next action. |
| If1                     | if                       | Checks if message contains photo  | Telegram Trigger       | Download Image1 (if true), Search records (if false) |                                                                                                                            |
| Download Image1         | telegram                 | Downloads Telegram photo           | If1                    | Transform to base                 | ## Image Download and Preparation Here the workflow downloads the image that came from Telegram and changes it into base64 string. This format is easy to send further to Drive or to any API that needs encoded file.        |
| Transform to base       | extractFromFile          | Converts binary image to base64   | Download Image1         | Merge                           |                                                                                                                            |
| Merge                   | merge                    | Merges binary and JSON data       | Transform to base, Upload file | Aggregate                      |                                                                                                                            |
| Aggregate               | aggregate                | Aggregates all item data          | Merge                   | Edit Fields                    |                                                                                                                            |
| Edit Fields             | set                      | Sets image metadata and user info | Aggregate                | Create or update a record        |                                                                                                                            |
| Create or update a record| airtable                 | Updates Airtable with image info  | Edit Fields              | Send a text message1             | ## Upload and Record Update This top flow uploads the file to Google Drive and then updates the connected record. After that, a text message is sent in Telegram to confirm that the upload and update is completed properly.  |
| Send a text message1    | telegram                 | Sends confirmation to user        | Create or update a record| -                              |                                                                                                                            |
| Search records          | airtable                 | Searches Airtable for user record | If1 (no photo branch)   | If                             | ## Conditional Message Handling This part is used for checking if the incoming message matches any saved record or keyword. Depending on result, Telegram sends one of the two reply messages to guide the user further.           |
| If                      | if                       | Checks if Airtable record exists  | Search records          | Send a text message (true), Send a text message2 (false) |                                                                                                                            |
| Send a text message     | telegram                 | Sends wait message if record found| If                      | Download File                   |                                                                                                                            |
| Send a text message2    | telegram                 | Requests image upload if no record| If                      | -                              |                                                                                                                            |
| Download File           | httpRequest              | Downloads base image from Drive   | Send a text message     | Extract from File               |                                                                                                                            |
| Extract from File       | extractFromFile          | Converts downloaded binary to base64 | Download File          | Edit Fields1                   |                                                                                                                            |
| Edit Fields1            | set                      | Prepares prompt and base64 image for API | Extract from File      | Edit Image                     |                                                                                                                            |
| Edit Image              | httpRequest              | Sends prompt and image to Gemini for editing | Edit Fields1            | Convert To File                | ## Image Editing and Return Flow This section manages full image process. It downloads the earlier stored image, extracts the content, and edits it using image API. The final image file is made and uploaded again, then sent back to Telegram chat as photo message. |
| Convert To File         | code                     | Extracts and converts base64 API response to PNG file | Edit Image             | Upload file1, Send a photo message |                                                                                                                            |
| Upload file             | googleDrive              | Uploads original image to Drive   | Transform to base        | Merge                          |                                                                                                                            |
| Upload file1            | googleDrive              | Uploads edited image to Drive     | Convert To File          | Create or update a record1      |                                                                                                                            |
| Create or update a record1| airtable                | Updates Airtable with edited image link | Upload file1             | Send a photo message            |                                                                                                                            |
| Send a photo message    | telegram                 | Sends edited photo back to Telegram user | Create or update a record1 | -                           |                                                                                                                            |
| Sticky Note             | stickyNote               | Overview and instructions         | -                       | -                              | ## Google Nano Banana Image Generator: Overview How it works ... (full note content)                                        |
| Sticky Note1            | stickyNote               | Explains Telegram input block    | -                       | -                              | ## Telegram Input This part collects user messages or images from Telegram. ...                                              |
| Sticky Note2            | stickyNote               | Explains image download/preparation | -                       | -                              | ## Image Download and Preparation ...                                                                                      |
| Sticky Note3            | stickyNote               | Upload and record update explanation | -                       | -                              | ## Upload and Record Update ...                                                                                            |
| Sticky Note4            | stickyNote               | Conditional message handling explanation | -                       | -                              | ## Conditional Message Handling ...                                                                                        |
| Sticky Note5            | stickyNote               | AI image editing and return flow explanation | -                       | -                              | ## Image Editing and Return Flow ...                                                                                        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger Node**  
   - Type: Telegram Trigger  
   - Configure webhook to listen for "message" updates only.  
   - Connect output to an If node.

2. **Add If1 Node (Check for Photo)**  
   - Type: If  
   - Condition: Check if `message.photo[0]` exists.  
   - True branch: process image upload flow.  
   - False branch: process text input flow.

3. **Image Upload Flow:**  
   - Create *Download Image1* node (Telegram)  
     - File ID: `{{$json.message.photo[2].file_id}}` (largest photo).  
     - Connect to *Transform to base* node.  
   - Create *Transform to base* node  
     - Operation: binaryToProperty (convert binary to base64 string).  
     - Connect to *Merge* node.  
   - Create *Upload file* node (Google Drive)  
     - Configure with Google Drive credentials.  
     - Folder ID: Google Drive folder "Home Furnishing AI".  
     - Filename: `{{$json.result.file_unique_id}}`.  
     - Connect output to *Merge* node input 2.  
   - Create *Merge* node  
     - Merge binary and JSON data from previous nodes.  
     - Connect to *Aggregate* node.  
   - Create *Aggregate* node  
     - Aggregate all item data into one.  
     - Connect to *Edit Fields* node.  
   - Create *Edit Fields* node  
     - Set variables:  
       - `image_link` = `{{$json.data[0].webContentLink}}`  
       - `image_hash` = `{{$json.data[1].data}}`  
       - `id` = `{{$('Telegram Trigger').item.json.message.from.id}}`  
     - Connect to *Create or update a record* node.  
   - Create *Create or update a record* node (Airtable)  
     - Configure Airtable base and table for user image records.  
     - Matching column: "ID" with user Telegram ID.  
     - Update fields: base_image_link with Drive link.  
     - Connect to *Send a text message1* node.  
   - Create *Send a text message1* node (Telegram)  
     - Text: "Thank you for providing the image. Please let us know the edits you require"  
     - Chat ID: `{{ $('Telegram Trigger').item.json.message.from.id }}`  

4. **Text Input Flow (No Photo):**  
   - Create *Search records* node (Airtable)  
     - Search for record where `{ID} = "user Telegram ID"`.  
     - Connect to *If* node.  
   - Create *If* node  
     - Condition: record exists (ID field exists).  
     - True branch: *Send a text message* node.  
     - False branch: *Send a text message2* node.  
   - Create *Send a text message* node  
     - Text: "Please wait 30 Seconds while we work our magic."  
     - Chat ID: `{{$json.ID}}` (from Airtable record).  
     - Connect to *Download File* node.  
   - Create *Send a text message2* node  
     - Text: "Please upload a image to to edit."  
     - Chat ID: `{{ $('Telegram Trigger').item.json.message.from.id }}`  

5. **AI Image Editing Flow:**  
   - Create *Download File* node (HTTP Request)  
     - URL: `{{ $('Search records').item.json.base_image_link }}`.  
     - Connect to *Extract from File* node.  
   - Create *Extract from File* node  
     - Operation: binaryToProperty to get base64 string.  
     - Connect to *Edit Fields1* node.  
   - Create *Edit Fields1* node  
     - Set variables:  
       - `message` = user message text from Telegram Trigger  
       - `id` = Telegram user ID  
       - `base_image_link` = Airtable stored link  
       - `base_image64` = base64 data from Extract from File  
       - `image_exists` = true  
     - Connect to *Edit Image* node.  
   - Create *Edit Image* node (HTTP Request)  
     - Method: POST  
     - URL: Google Gemini image generation endpoint (`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent`)  
     - Headers:  
       - `x-goog-api-key`: Your Google API key  
       - `Content-Type`: application/json  
     - Body: JSON containing text prompt and inline base64 image data (jpeg).  
     - Connect to *Convert To File* node.  
   - Create *Convert To File* node (Code node)  
     - JavaScript code to extract base64 image data from Gemini response, validate and convert to PNG binary.  
     - Handles errors if base64 data missing or malformed.  
     - Connect outputs to *Upload file1* and *Send a photo message*.  
   - Create *Upload file1* node (Google Drive)  
     - Upload edited image PNG.  
     - Filename: `{{ Telegram user ID }}_base`.  
     - Folder: same "Home Furnishing AI" folder.  
     - Connect to *Create or update a record1* node.  
   - Create *Create or update a record1* node (Airtable)  
     - Update record with new base_image_link from uploaded file.  
     - Match on user ID.  
     - Connect to *Send a photo message* node.  
   - Create *Send a photo message* node (Telegram)  
     - Chat ID: Telegram user ID.  
     - Send the edited image as photo message (binary).  

6. **General Setup:**  
   - Add Telegram credentials with your bot token.  
   - Add Google Drive OAuth2 credentials with access to appropriate folder.  
   - Add Airtable API credentials with access to your base and table.  
   - Replace Google Gemini API key in HTTP Request node with your valid key.  
   - Ensure webhook URLs are configured and accessible for Telegram trigger.  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                    | Context or Link                                                                                 |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Google Nano Banana Image Generator: Overview - Workflow creates AI images through Telegram messages using Google Gemini API integrated fully within n8n. Optional OpenAI node can be added for prompt refinement. Setup steps included for Telegram Bot and API keys. | Sticky Note content in workflow overview section                                               |
| Telegram Input - Explains how user messages and images are captured and differentiated for processing.                                                                                                                                                          | Sticky Note1 content                                                                            |
| Image Download and Preparation - Details on downloading Telegram images and converting to base64 for further processing.                                                                                                                                          | Sticky Note2 content                                                                            |
| Upload and Record Update - Describes uploading to Google Drive and updating Airtable records, with Telegram confirmation messages.                                                                                                                               | Sticky Note3 content                                                                            |
| Conditional Message Handling - Explains logic to check for existing user records and sending appropriate Telegram prompts.                                                                                                                                         | Sticky Note4 content                                                                            |
| Image Editing and Return Flow - Manages image download, AI editing API call, conversion & upload of edited image, and sending result back to Telegram chat as a photo.                                                                                            | Sticky Note5 content                                                                            |

---

**Disclaimer:** The provided content originates solely from an n8n automated workflow. It strictly respects all applicable content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.