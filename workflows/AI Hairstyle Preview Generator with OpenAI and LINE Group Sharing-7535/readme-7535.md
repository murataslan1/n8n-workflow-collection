AI Hairstyle Preview Generator with OpenAI and LINE Group Sharing

https://n8nworkflows.xyz/workflows/ai-hairstyle-preview-generator-with-openai-and-line-group-sharing-7535


# AI Hairstyle Preview Generator with OpenAI and LINE Group Sharing

### 1. Workflow Overview

This workflow, titled **AI Hairstyle Preview Generator with OpenAI and LINE Group Sharing**, is designed to automate the process of generating hairstyle edits on user-submitted images while preserving the person’s identity, and then sharing the resulting images directly to a LINE group. It targets salons, hair stylists, or creative teams who want to quickly preview hairstyle changes and share them with staff or clients via LINE messaging.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Collect user inputs via an n8n Form and optionally capture LINE group IDs from messages.
- **1.2 AI Hairstyle Image Editing:** Send the submitted image and instructions to OpenAI’s Image Edit API to modify only the hairstyle.
- **1.3 Image Processing and Upload:** Convert the AI output to a file and upload it to Cloudinary to obtain a publicly accessible URL.
- **1.4 LINE Group Sharing:** Use the LINE Messaging API to push the edited image to a predefined LINE group.
- **1.5 Admin Utility:** A webhook node to capture LINE group IDs by receiving messages, assisting initial setup.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block receives user data from an n8n Form submission and optionally listens for messages from LINE to extract group IDs.

- **Nodes Involved:**  
  - On form submission  
  - LINE input  
  - Sticky Note1 (instructional)

- **Node Details:**  

  - **On form submission**  
    - *Type:* Form Trigger  
    - *Role:* Entry point for user input (image + hairstyle instructions).  
    - *Configuration:*  
      - Authenticated via Basic Auth credential.  
      - Accepts 2 fields: a single image file (`pic`) and a textarea for instructions (`content`).  
      - Triggered via a webhook with a defined webhook ID.  
    - *Expressions:* Uses form fields to receive image and text.  
    - *Connections:* Output leads to "Create Image" node.  
    - *Failure Modes:* Authentication failure, malformed form data, file upload errors.

  - **LINE input**  
    - *Type:* Webhook  
    - *Role:* Captures incoming POST requests from LINE messaging platform for group ID retrieval.  
    - *Configuration:*  
      - Webhook path set to a unique identifier.  
      - Accepts POST requests.  
    - *Connections:* None linked downstream in this workflow (used as a standalone utility).  
    - *Failure Modes:* Webhook unavailability, invalid POST payloads.

  - **Sticky Note1**  
    - *Type:* Sticky Note (non-executable)  
    - *Role:* Instructions to retrieve LINE group ID by inviting the bot to a group and sending messages.  
    - *Content Highlights:* Explains how to capture and save the group ID for later use; node can be deleted thereafter.

#### 2.2 AI Hairstyle Image Editing

- **Overview:**  
  This block sends the provided image and user instructions to OpenAI’s Image Edit endpoint to generate a hairstyle-only modification, preserving facial identity.

- **Nodes Involved:**  
  - Create Image

- **Node Details:**  

  - **Create Image**  
    - *Type:* HTTP Request  
    - *Role:* Calls OpenAI Image Edit API to create a hairstyle-edited image.  
    - *Configuration:*  
      - POST to `https://api.openai.com/v1/images/edits`  
      - Multipart form data including:  
        - `prompt`: Instruction emphasizing to keep the face unchanged and only modify hairstyle, appended with user `content` input.  
        - `model`: `"gpt-image-1"` specified for image editing.  
        - `size`: `"1024x1536"` resolution.  
        - `image`: Binary data from form field `pic`.  
        - `quality`: `"high"`.  
      - Authentication via OpenAI API credential.  
    - *Expressions:* Uses template expressions to inject user content dynamically.  
    - *Input:* Receives image and text from "On form submission" node.  
    - *Output:* JSON response with base64-encoded image data.  
    - *Failure Modes:* API key or quota errors, invalid image format, request timeout, malformed prompt.

#### 2.3 Image Processing and Upload

- **Overview:**  
  Converts the AI-generated image data into a file format suitable for upload, then uploads the file to Cloudinary for hosting.

- **Nodes Involved:**  
  - Convert to File  
  - Upload Image

- **Node Details:**  

  - **Convert to File**  
    - *Type:* Convert To File  
    - *Role:* Converts base64 JSON image from OpenAI response into a binary file format.  
    - *Configuration:*  
      - Operation: `toBinary`  
      - Source Property: `data[0].b64_json` (path to base64 image data)  
    - *Input:* Output from "Create Image" node.  
    - *Output:* Binary file data prepared for upload.  
    - *Failure Modes:* Incorrect data path, invalid base64 data.

  - **Upload Image**  
    - *Type:* HTTP Request  
    - *Role:* Uploads the binary image file to Cloudinary using unsigned upload preset.  
    - *Configuration:*  
      - POST to `https://api.cloudinary.com/v1_1/{{CLOUDINARY_CLOUD_NAME}}/image/upload`  
      - Multipart form data includes:  
        - `file`: binary data from "Convert to File"  
        - `upload_preset`: environment variable placeholder for unsigned preset  
      - No authentication needed (unsigned preset).  
    - *Input:* Binary image file from "Convert to File" node.  
    - *Output:* JSON response with image URLs including `secure_url`.  
    - *Failure Modes:* Misconfigured Cloudinary cloud name or upload preset, network errors, file too large.

#### 2.4 LINE Group Sharing

- **Overview:**  
  Pushes the uploaded image to a predefined LINE group using the LINE Messaging API.

- **Nodes Involved:**  
  - LINE output

- **Node Details:**  

  - **LINE output**  
    - *Type:* HTTP Request  
    - *Role:* Sends a push message with the image to the LINE group.  
    - *Configuration:*  
      - POST to `https://api.line.me/v2/bot/message/push`  
      - JSON body includes:  
        - `to`: LINE group ID from environment variable  
        - `messages`: array with one image message referencing Cloudinary `secure_url` for original and preview image URLs  
      - Headers:  
        - Authorization: Bearer token from `LINE_CHANNEL_TOKEN` environment variable  
        - Content-Type: application/json  
    - *Input:* Cloudinary upload response from "Upload Image" node.  
    - *Output:* API response from LINE platform.  
    - *Failure Modes:* Invalid or expired LINE channel token, invalid group ID, network errors, message size limits.

#### 2.5 Admin Utility

- **Overview:**  
  Provides instructions and a webhook to capture LINE group IDs by monitoring incoming messages, facilitating initial setup.

- **Nodes Involved:**  
  - Sticky Note

- **Node Details:**  

  - **Sticky Note**  
    - *Type:* Sticky Note  
    - *Role:* Describes the workflow purpose, setup requirements, and key features.  
    - *Content Highlights:*  
      - Workflow overview and intended use cases  
      - Requirements: OpenAI API key, Cloudinary account, LINE Official Account setup  
      - Placeholders to replace with actual credentials and IDs  
      - Safety note on storing group IDs  
      - Summary of the process flow and key nodes  

---

### 3. Summary Table

| Node Name          | Node Type            | Functional Role                       | Input Node(s)          | Output Node(s)      | Sticky Note                                                                                                                |
|--------------------|----------------------|------------------------------------|-----------------------|---------------------|----------------------------------------------------------------------------------------------------------------------------|
| On form submission | Form Trigger         | Receives user image and instructions |                       | Create Image         |                                                                                                                            |
| Create Image        | HTTP Request         | Calls OpenAI to edit hairstyle      | On form submission    | Convert to File      |                                                                                                                            |
| Convert to File     | Convert To File      | Converts base64 image to binary file | Create Image          | Upload Image         |                                                                                                                            |
| Upload Image        | HTTP Request         | Uploads image to Cloudinary          | Convert to File       | LINE output          |                                                                                                                            |
| LINE output         | HTTP Request         | Pushes edited image to LINE group   | Upload Image          |                     |                                                                                                                            |
| LINE input          | Webhook              | Captures LINE message to get group ID |                       |                     | Please use this node to find out the LINE group ID. Invite the bot to a group, send a message, capture source.groupId.     |
| Sticky Note1        | Sticky Note          | Instruction to capture LINE group ID |                       |                     | Please use this node to find out the LINE group ID. Invite the bot to a group, then send any message.                      |
| Sticky Note         | Sticky Note          | Workflow overview and setup notes   |                       |                     | # Hairstyle Preview & LINE Group Share overview, key features, requirements, and setup instructions.                       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create "On form submission" node:**  
   - Type: Form Trigger  
   - Configure webhook with Basic Auth credential (create a HTTP Basic Auth credential with username/password).  
   - Form Title: "Hairstyle Preview"  
   - Add two form fields:  
     - File field labeled `pic` (single file, required)  
     - Textarea field labeled `content` (required)  

2. **Create "Create Image" node:**  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://api.openai.com/v1/images/edits`  
   - Authentication: Use OpenAI API credential with valid API key.  
   - Content Type: multipart/form-data  
   - Body parameters:  
     - `prompt`:  
       ```
       Keep the person's face exactly the same as in the input image. Do not alter or replace the face. 
       Only modify the hairstyle. Make sure the hairstyle looks natural and realistic. 
       The overall identity of the person must remain unchanged.

       User request: {{$json["content"]}}
       ```  
     - `model`: `gpt-image-1`  
     - `size`: `1024x1536`  
     - `image`: set as binary form data from field `pic` of the incoming form  
     - `quality`: `high`  
   - Connect "On form submission" node output to this node input.

3. **Create "Convert to File" node:**  
   - Type: Convert To File  
   - Operation: `toBinary`  
   - Source Property: `data[0].b64_json` (path to base64 image in OpenAI response)  
   - Connect output of "Create Image" node here.

4. **Create "Upload Image" node:**  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://api.cloudinary.com/v1_1/{{CLOUDINARY_CLOUD_NAME}}/image/upload` (replace `{{CLOUDINARY_CLOUD_NAME}}` with actual Cloudinary cloud name)  
   - Content Type: multipart/form-data  
   - Body parameters:  
     - `file`: binary data from "Convert to File" node output  
     - `upload_preset`: Cloudinary unsigned preset (`{{CLOUDINARY_UPLOAD_PRESET}}`)  
   - Connect output of "Convert to File" node here.

5. **Create "LINE output" node:**  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://api.line.me/v2/bot/message/push`  
   - Authentication: None (Authorization via header)  
   - Headers:  
     - `Authorization`: `Bearer {{LINE_CHANNEL_TOKEN}}` (replace with valid LINE channel token)  
     - `Content-Type`: `application/json`  
   - Body: raw JSON specifying:  
     ```json
     {
       "to": "{{LINE_GROUP_ID}}",
       "messages": [
         {
           "type": "image",
           "originalContentUrl": "{{ $json.secure_url }}",
           "previewImageUrl": "{{ $json.secure_url }}"
         }
       ]
     }
     ```  
   - Connect output of "Upload Image" node here.

6. **(Optional) Create "LINE input" node for group ID capture:**  
   - Type: Webhook  
   - Method: POST  
   - Path: any unique identifier  
   - This node captures incoming messages from LINE to retrieve `source.groupId` from event payloads for initial setup.

7. **Create Sticky Notes for instructions and overview:**  
   - Add notes describing workflow purpose, setup instructions, and how to find LINE group ID.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                    | Context or Link                                                                                                                         |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| The workflow requires an **OpenAI API key** with access to image editing models.                                                                                               | OpenAI API documentation: https://platform.openai.com/docs/guides/images                                                             |
| Cloudinary account must have an **unsigned upload preset** configured to allow image uploads without authentication.                                                          | Cloudinary unsigned upload presets: https://cloudinary.com/documentation/upload_images#unsigned_upload                                  |
| LINE Official Account must have Messaging API enabled, and the bot added to the target group chat to retrieve group IDs and send push messages.                              | LINE Messaging API: https://developers.line.biz/en/docs/messaging-api/overview/                                                        |
| The "On form submission" node requires Basic Authentication configured for security.                                                                                           | n8n Form Trigger docs: https://docs.n8n.io/nodes/n8n-nodes-base.formTrigger/                                                           |
| To find the LINE group ID, invite the bot to a group chat and send a message. Capture the `source.groupId` from the webhook payload for use in the `LINE_GROUP_ID` variable.   | See Sticky Note1 instructions in the workflow.                                                                                        |
| Replace placeholders like `{{CLOUDINARY_CLOUD_NAME}}`, `{{CLOUDINARY_UPLOAD_PRESET}}`, `{{LINE_CHANNEL_TOKEN}}`, and `{{LINE_GROUP_ID}}` with your actual credentials before use. |                                                                                                                                        |

---

**Disclaimer:** The provided text is extracted exclusively from an automated n8n workflow designed in compliance with content policies. It contains no illegal, offensive, or protected content. All data processed is legal and public.