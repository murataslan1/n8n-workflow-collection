 Automate AI Image Generation & Telegram Delivery with Google Drive and Sheets

https://n8nworkflows.xyz/workflows/-automate-ai-image-generation---telegram-delivery-with-google-drive-and-sheets-4049


#  Automate AI Image Generation & Telegram Delivery with Google Drive and Sheets

### 1. Workflow Overview

This workflow automates AI-based image generation triggered by Telegram messages and delivers the generated images back to Telegram while logging metadata in Google Drive and Google Sheets. It is designed for both self-hosted and cloud-hosted n8n instances and integrates OpenAI for image creation, LangChain for prompt enhancement, Google Drive for file storage, Google Sheets for logging, and Telegram for user interaction.

Logical blocks:

- **1.1 Telegram Input Reception:** Captures user image prompt requests from Telegram messages.
- **1.2 AI Prompt Expansion:** Enhances the basic prompt using a LangChain agent powered by Google Gemini.
- **1.3 Image Generation:** Sends the expanded prompt to OpenAI’s image generation API and receives the image data.
- **1.4 Image Conversion and Delivery:** Converts image data into a file, uploads it to Google Drive, sends it back to Telegram as a photo, and logs metadata to Google Sheets.

---

### 2. Block-by-Block Analysis

---

#### 2.1 Telegram Input Reception

**Overview:**  
This block listens for incoming Telegram messages and extracts the image prompt input from users to initiate the workflow.

**Nodes Involved:**  
- Telegram Trigger

**Node Details:**

- **Telegram Trigger**  
  - *Type:* Telegram Trigger node  
  - *Role:* Listens to messages sent to the Telegram bot, triggering the workflow upon new input.  
  - *Configuration:* Uses a webhook to receive events from Telegram. Captures chat ID and message text.  
  - *Expressions/Variables:* Receives raw Telegram data, from which `chatID` and prompt text are extracted.  
  - *Connections:* Output connects to the Image Prompt node.  
  - *Edge Cases:*  
    - Telegram connectivity issues or invalid webhook setup.  
    - Messages without valid prompts (empty or malformed).  
    - Bot permissions (must be added to groups/channels if needed).  
  - *Version:* 1.2  

---

#### 2.2 AI Prompt Expansion

**Overview:**  
This block takes the user’s raw image prompt from Telegram and expands it into a more detailed, artistic prompt using a LangChain agent powered by the Google Gemini language model.

**Nodes Involved:**  
- Image Prompt  
- Ai model

**Node Details:**

- **Ai model**  
  - *Type:* LangChain Google Gemini LM Chat node  
  - *Role:* Provides the language model functionality for prompt enhancement.  
  - *Configuration:* Connected internally to the Image Prompt node, using Google Gemini API with configured credentials.  
  - *Expressions/Variables:* Uses input prompt text to generate an expanded version.  
  - *Edge Cases:*  
    - API key or quota issues with Google Gemini.  
    - Timeout or slow responses.  
  - *Version:* 1  

- **Image Prompt**  
  - *Type:* LangChain agent node  
  - *Role:* Coordinates prompt expansion using the Ai model node as its language model backend.  
  - *Configuration:* Calls the Ai model internally to generate enhanced prompts.  
  - *Expressions/Variables:* Receives Telegram prompt input; outputs expanded prompt text.  
  - *Connections:* Output connects to the Create Image HTTP Request node.  
  - *Edge Cases:*  
    - Expression or variable resolution failures.  
    - Model returning irrelevant or empty prompts.  
  - *Version:* 1.9  

---

#### 2.3 Image Generation

**Overview:**  
This block sends the enhanced prompt to OpenAI’s image generation API to create the image and returns the image data in base64 format.

**Nodes Involved:**  
- Create Image

**Node Details:**

- **Create Image**  
  - *Type:* HTTP Request node  
  - *Role:* Performs the actual call to the OpenAI image generation API.  
  - *Configuration:*  
    - Method: POST  
    - Endpoint: OpenAI's image generation API URL  
    - Authentication: Uses OpenAI API key in HTTP headers  
    - Body: Sends the expanded prompt, along with parameters like image size and number of images.  
  - *Expressions/Variables:* Uses the expanded prompt from the Image Prompt node.  
  - *Connections:* Output connects to Convert to File node.  
  - *Edge Cases:*  
    - API authentication failures.  
    - Rate limiting or quota exhaustion.  
    - Network timeouts or invalid responses.  
  - *Version:* 4.2  

---

#### 2.4 Image Conversion and Delivery

**Overview:**  
This block converts the returned image data into a binary file, uploads it to Google Drive, sends the image back to Telegram, and logs the image metadata in a Google Sheet.

**Nodes Involved:**  
- Convert to File  
- Google Drive  
- Send Photo  
- Image Log

**Node Details:**

- **Convert to File**  
  - *Type:* Convert to File node  
  - *Role:* Converts the base64 or JSON image data from the Create Image node into a binary file format suitable for upload and sending.  
  - *Configuration:* Uses default parameters for conversion.  
  - *Connections:* Outputs to Google Drive and Send Photo nodes.  
  - *Edge Cases:*  
    - Malformed base64 data causing conversion failure.  
  - *Version:* 1.1  

- **Google Drive**  
  - *Type:* Google Drive node  
  - *Role:* Uploads the binary image file into a preconfigured Google Drive folder.  
  - *Configuration:* Uses OAuth2 credentials, target folder ID configured in parameters.  
  - *Connections:* Output connected to Image Log node.  
  - *Edge Cases:*  
    - OAuth token expiration or permission issues.  
    - Folder ID not found or inaccessible.  
  - *Version:* 3  

- **Send Photo**  
  - *Type:* Telegram node  
  - *Role:* Sends the image file as a photo message back to the Telegram chat identified by chatID.  
  - *Configuration:* Uses Telegram API credentials; photo payload is binary data from Convert to File.  
  - *Connections:* No further output connections.  
  - *Edge Cases:*  
    - Telegram API rate limits or message size restrictions.  
    - Invalid chat ID or bot permissions.  
  - *Version:* 1.2  

- **Image Log**  
  - *Type:* Google Sheets node  
  - *Role:* Logs metadata about the image (title, type, prompt, file ID, link) into a Google Sheet for tracking and auditing purposes.  
  - *Configuration:* OAuth2 credentials, target sheet, and specific range or sheet tab specified.  
  - *Connections:* No further output connections.  
  - *Edge Cases:*  
    - Sheet access permissions or quota limits.  
    - Incorrect sheet structure or headers missing.  
  - *Version:* 4.5  

---

### 3. Summary Table

| Node Name       | Node Type                         | Functional Role                      | Input Node(s)       | Output Node(s)             | Sticky Note                                    |
|-----------------|----------------------------------|------------------------------------|---------------------|----------------------------|------------------------------------------------|
| Telegram Trigger| Telegram Trigger                  | Receives Telegram messages          | —                   | Image Prompt               |                                                |
| Image Prompt    | LangChain Agent                  | Expands prompt via AI                | Telegram Trigger    | Create Image               |                                                |
| Ai model        | LangChain LM Chat Google Gemini | Language model for prompt expansion | — (used internally) | Image Prompt (internal)    |                                                |
| Create Image    | HTTP Request                    | Calls OpenAI image API               | Image Prompt        | Convert to File            |                                                |
| Convert to File | Convert to File                  | Converts base64 image to binary     | Create Image        | Google Drive, Send Photo   |                                                |
| Google Drive    | Google Drive                    | Uploads image to Google Drive        | Convert to File     | Image Log                  |                                                |
| Send Photo      | Telegram                        | Sends image back to Telegram         | Convert to File     | —                          |                                                |
| Image Log       | Google Sheets                  | Logs image metadata                  | Google Drive        | —                          |                                                |
| Sticky Note2    | Sticky Note                    | —                                  | —                   | —                          |                                                |
| Sticky Note6    | Sticky Note                    | —                                  | —                   | —                          |                                                |
| Sticky Note7    | Sticky Note                    | —                                  | —                   | —                          |                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger Node**  
   - Type: Telegram Trigger  
   - Configure webhook to receive messages from your Telegram bot.  
   - Set bot token credentials.  
   - Connect output to "Image Prompt" node.

2. **Create Ai model Node (LangChain Google Gemini LM Chat)**  
   - Type: LangChain LM Chat Google Gemini node  
   - Configure with Google Gemini API credentials.  
   - Set model to `gemini-2.5-pro-preview-05-06` or as per your API access.

3. **Create Image Prompt Node (LangChain Agent)**  
   - Type: LangChain agent node  
   - Configure to use the Ai model node as the language model.  
   - Accept input from Telegram Trigger node.  
   - Connect output to "Create Image" node.

4. **Create Create Image Node (HTTP Request)**  
   - Type: HTTP Request  
   - Configure method: POST  
   - URL: OpenAI’s image generation endpoint (e.g., `https://api.openai.com/v1/images/generations`)  
   - Authentication: Use OpenAI API key in HTTP headers.  
   - Body: Pass expanded prompt from Image Prompt node, set parameters (size, number of images).  
   - Connect output to "Convert to File" node.

5. **Create Convert to File Node**  
   - Type: Convert to File  
   - Configure to convert base64 image data to binary file.  
   - Connect output to both "Google Drive" and "Send Photo" nodes.

6. **Create Google Drive Node**  
   - Type: Google Drive  
   - Configure OAuth2 credentials.  
   - Set target folder ID (created in Google Drive).  
   - Connect output to "Image Log" node.

7. **Create Send Photo Node (Telegram)**  
   - Type: Telegram  
   - Configure with Telegram API credentials.  
   - Set photo to binary data from Convert to File.  
   - Connect input from Convert to File.

8. **Create Image Log Node (Google Sheets)**  
   - Type: Google Sheets  
   - Configure OAuth2 credentials.  
   - Set target spreadsheet and sheet tab (with headers: Title, Type, Request, ID, Link, Post).  
   - Connect input from Google Drive node.  

9. **Configure Credentials in n8n**  
   - Telegram API with Bot Token  
   - OpenAI API with Bearer token in HTTP header  
   - Google Drive OAuth2  
   - Google Sheets OAuth2  
   - Google Gemini API credentials for LangChain nodes  

10. **Test the Workflow**  
    - Send a message to Telegram bot with a prompt like "Image: A cozy cabin in snowy forest".  
    - Observe the image generation, Telegram delivery, Google Drive upload, and Google Sheets logging.

---

### 5. General Notes & Resources

| Note Content                                                                                       | Context or Link                                                      |
|--------------------------------------------------------------------------------------------------|--------------------------------------------------------------------|
| Telegram Bot Token must be obtained via [@BotFather](https://t.me/BotFather).                     | Telegram integration prerequisite                                  |
| OpenAI API Key must have access to image generation (`gpt-image-1`).                             | OpenAI credential setup                                            |
| Create Google Drive folder and set sharing to "Anyone with the link can view" for accessibility. | Google Drive setup instructions                                    |
| Google Sheets must have proper headers and be shared with the OAuth service account or n8n email.| Google Sheets logging setup                                        |
| Optional: Use LangChain with Google Gemini or OpenAI for prompt enhancement.                      | See official LangChain docs or Google Gemini API docs              |
| Self-hosted n8n requires reverse proxy with SSL and publicly accessible webhook URL.             | Deployment tips                                                    |
| n8n Cloud handles webhooks and SSL automatically.                                                | Deployment tips                                                    |
| Consider adding cooldown checks or quotas to prevent spam.                                      | Workflow improvement suggestions                                  |
| Video walkthrough and detailed setup guide are available on n8n community blog (link not provided).| Additional learning resources                                     |

---

**Disclaimer:**  
The provided text and workflow are generated exclusively by an automated n8n process. It complies fully with current content policies, contains no illegal or offensive material, and handles only lawful public data.