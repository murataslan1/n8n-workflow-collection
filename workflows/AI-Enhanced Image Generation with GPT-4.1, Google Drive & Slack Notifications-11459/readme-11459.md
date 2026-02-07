AI-Enhanced Image Generation with GPT-4.1, Google Drive & Slack Notifications

https://n8nworkflows.xyz/workflows/ai-enhanced-image-generation-with-gpt-4-1--google-drive---slack-notifications-11459


# AI-Enhanced Image Generation with GPT-4.1, Google Drive & Slack Notifications

### 1. Workflow Overview

This n8n workflow automates the generation of AI-enhanced images starting from a simple text subject. It expands the user's brief input into a richly detailed prompt for image generation using OpenAI's GPT-4.1 and image generation API, then creates an image, saves it to Google Drive, and notifies a Slack channel.

The workflow is logically structured into the following blocks:

- **1.1 Input Reception and Initialization:** Receives the initial subject input manually.
- **1.2 AI Prompt Expansion:** Uses GPT-4.1 to transform the simple subject into a detailed image prompt.
- **1.3 Image Generation:** Calls OpenAI’s image generation API with the expanded prompt.
- **1.4 Image Processing and Storage:** Converts the generated image to a binary file and saves it in Google Drive.
- **1.5 Notification:** Sends a Slack message with the image preview and link to Google Drive.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Initialization

- **Overview:**  
  This block triggers the workflow manually and sets the initial image subject text.

- **Nodes Involved:**  
  - When clicking ‘Execute workflow’ (Manual Trigger)  
  - Set image subject

- **Node Details:**  
  - **When clicking ‘Execute workflow’**  
    - Type: Manual Trigger  
    - Role: Initiates the workflow manually for testing or on-demand execution.  
    - Inputs: None  
    - Outputs: Connected to "Set image subject"  
    - Potential Failures: None expected; manual trigger reliability depends on user interaction.  
  - **Set image subject**  
    - Type: Set  
    - Role: Defines the initial text subject for the image generation (e.g., "A monkey holding a banana in cartoon style").  
    - Configuration: Sets a single string field `subject` with a default value.  
    - Inputs: From manual trigger  
    - Outputs: Connected to "Image Prompt"  
    - Edge Cases: Empty or invalid subject text would propagate downstream; no validation present here.

#### 2.2 AI Prompt Expansion

- **Overview:**  
  This block uses GPT-4.1 to convert the simple subject into a detailed prompt suitable for image generation.

- **Nodes Involved:**  
  - GPT 4.1  
  - Image Prompt

- **Node Details:**  
  - **GPT 4.1**  
    - Type: AI Language Model (OpenRouter-based GPT-4.1)  
    - Role: Performs complex natural language processing to generate detailed prompts.  
    - Configuration: Uses the "openai/gpt-4.1" model via OpenRouter API credentials.  
    - Inputs: From "Image Prompt" node’s language model output  
    - Outputs: Connected to "Image Prompt" node as an AI language model response.  
    - Version: Requires n8n version supporting `@n8n/n8n-nodes-langchain.lmChatOpenRouter`.  
    - Potential Failures: API rate limits, connectivity issues, invalid credentials, or timeout errors.  
  - **Image Prompt**  
    - Type: LangChain Agent Node specialized for prompt engineering  
    - Role: Receives the initial subject and formulates a comprehensive image prompt covering subject, environment, style, mood, and details.  
    - Configuration: Uses a system message instructing the AI to produce a detailed image prompt, with an example provided.  
    - Key Expression: `={{ $json.subject }}` — takes the subject from the Set node as input text.  
    - Inputs: From "Set image subject" node (main input) and from "GPT 4.1" (AI language model output)  
    - Outputs: Sends the expanded prompt text to "Generate Image" node.  
    - Edge Cases: If the subject is too vague or empty, the prompt may be incomplete or nonsensical.

#### 2.3 Image Generation

- **Overview:**  
  Uses OpenAI’s image generation endpoint to create an image based on the detailed prompt.

- **Nodes Involved:**  
  - Generate Image  
  - Convert to File

- **Node Details:**  
  - **Generate Image**  
    - Type: HTTP Request  
    - Role: Sends a POST request to OpenAI’s image generation API endpoint.  
    - Configuration:  
      - URL: `https://api.openai.com/v1/images/generations`  
      - Method: POST  
      - Body Parameters:  
        - model: `"gpt-image-1"`  
        - prompt: Expression `={{ $json.output.replace(/\"/g, '') }}` uses the expanded prompt after removing quotes.  
        - size: `"1024x1024"` (image resolution)  
      - Authentication: Predefined OpenAI API credentials  
    - Inputs: From "Image Prompt" node’s main output  
    - Outputs: JSON response containing base64-encoded image data  
    - Potential Failures: API authentication errors, quota exceeded, invalid prompt, or server errors.  
  - **Convert to File**  
    - Type: Convert to File  
    - Role: Converts base64-encoded image data (`data[0].b64_json`) into binary file format for storage.  
    - Configuration: Operation set to "toBinary" on source property `data[0].b64_json`  
    - Inputs: From "Generate Image" node  
    - Outputs: Binary image file data forwarded to Google Drive node  
    - Edge Cases: Malformed base64 data, conversion errors.

#### 2.4 Image Processing and Storage

- **Overview:**  
  Saves the generated image file to a designated folder in Google Drive.

- **Nodes Involved:**  
  - Save image to Drive

- **Node Details:**  
  - **Save image to Drive**  
    - Type: Google Drive Node  
    - Role: Uploads the binary image file to Google Drive with a descriptive filename.  
    - Configuration:  
      - Filename: Derived from `subject` (e.g., `"A monkey holding a banana in cartoon style.png"`)  
      - Drive: "My Drive"  
      - Folder ID: `"13INQR6dKeD3YOEILFNb9mOXG4-eDj1ZM"` (specific folder for image storage)  
    - Inputs: Binary image from "Convert to File"  
    - Outputs: File metadata including Google Drive links, passed to Slack notification  
    - Credentials: Google Drive OAuth2  
    - Potential Failures: OAuth token expiration, insufficient permissions, network issues, or storage quota exceeded.

#### 2.5 Notification

- **Overview:**  
  Sends a formatted Slack message with a preview and link to the saved image in Google Drive.

- **Nodes Involved:**  
  - Send a message

- **Node Details:**  
  - **Send a message**  
    - Type: Slack Node  
    - Role: Posts a Slack message to a specific channel with image info and clickable link.  
    - Configuration:  
      - Channel: Fixed channel ID `"C08QZPHUN1Y"`  
      - Message Type: Block Kit message with a divider, section text, and image accessory  
      - Message Content:  
        - Text includes image name and a clickable link to view it on Google Drive  
        - Image accessory uses thumbnail URL from Google Drive metadata  
    - Inputs: From "Save image to Drive" node output  
    - Credentials: Slack OAuth2  
    - Edge Cases: Slack API rate limits, invalid channel ID, credential expiration, or message formatting errors.

---

### 3. Summary Table

| Node Name               | Node Type                            | Functional Role                | Input Node(s)                 | Output Node(s)             | Sticky Note                                                                                  |
|-------------------------|------------------------------------|-------------------------------|------------------------------|----------------------------|----------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger                     | Start workflow manually       | —                            | Set image subject           |                                                                                              |
| Set image subject        | Set                                | Define initial image subject  | When clicking ‘Execute workflow’ | Image Prompt                |                                                                                              |
| GPT 4.1                 | AI Language Model (OpenRouter GPT) | Generate detailed prompt text | Image Prompt (ai_languageModel) | Image Prompt (ai_languageModel) | Sticky Note2: "## Model"                                                                     |
| Image Prompt            | LangChain Agent                    | Expand subject to detailed prompt | Set image subject, GPT 4.1   | Generate Image              | Sticky Note4: "# Image Prompt"                                                               |
| Generate Image           | HTTP Request                      | Generate AI image from prompt | Image Prompt                 | Convert to File             | Sticky Note1: "# Generate Image"                                                             |
| Convert to File          | Convert To File                   | Convert base64 to binary file | Generate Image               | Save image to Drive         |                                                                                              |
| Save image to Drive      | Google Drive                      | Save image file to Drive      | Convert to File              | Send a message              | Sticky Note6: "# Write to Drive & Sheets"                                                    |
| Send a message           | Slack                            | Notify Slack channel          | Save image to Drive          | —                          |                                                                                              |
| Sticky Note4             | Sticky Note                      | Annotation                   | —                            | —                          | "# Image Prompt"                                                                             |
| Sticky Note2             | Sticky Note                      | Annotation                   | —                            | —                          | "## Model"                                                                                   |
| Sticky Note1             | Sticky Note                      | Annotation                   | —                            | —                          | "# Generate Image"                                                                           |
| Sticky Note6             | Sticky Note                      | Annotation                   | —                            | —                          | "# Write to Drive & Sheets"                                                                  |
| Sticky Note              | Sticky Note                      | General description          | —                            | —                          | "# Text-to-Image Generator with OpenAI\n\n## What It Is\n\nThis is an automated text-to-image generation system that converts simple subject descriptions into AI-generated photos using OpenAI's image generation technology.\n\n## Setup\n\nThe system works through a streamlined workflow:\n\n1. You input a subject or brief description into a designated note field\n2. The system automatically expands your simple subject into a detailed, comprehensive prompt\n3. This enhanced prompt is sent to OpenAI's image generator\n4. Once the image is created, it is automatically saved to your Google Drive for easy access and storage\n5. You receive a notification in Slack to view it" |
| Sticky Note3             | Sticky Note                      | Video explanation            | —                            | —                          | "## Video explanation\n\n[![Video](https://img.youtube.com/vi/ZgDFb54P9ww/0.jpg)](https://youtu.be/ZgDFb54P9ww)" |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger node:**  
   - Name: `When clicking ‘Execute workflow’`  
   - Purpose: Start workflow manually.

2. **Add Set node:**  
   - Name: `Set image subject`  
   - Connect input from Manual Trigger.  
   - Add string field `subject` with default value, e.g. `"A monkey holding a banana in cartoon style"`.

3. **Add LangChain Agent node:**  
   - Name: `Image Prompt`  
   - Connect input from `Set image subject`.  
   - Configure:  
     - Text: Expression `={{ $json.subject }}`  
     - System Message: (copy the detailed instructions for prompt crafting including primary subject, environment, art style, mood, details, output format, and example).  
     - Prompt Type: Define.

4. **Add AI Language Model node:**  
   - Name: `GPT 4.1`  
   - Connect AI language model input of `Image Prompt` node to this node’s output.  
   - Set model to `openai/gpt-4.1`.  
   - Configure OpenRouter API credentials.

5. **Add HTTP Request node:**  
   - Name: `Generate Image`  
   - Connect main output from `Image Prompt` node.  
   - Configure:  
     - URL: `https://api.openai.com/v1/images/generations`  
     - Method: POST  
     - Authentication: OpenAI API credentials.  
     - Body parameters:  
       - model: `"gpt-image-1"`  
       - prompt: Expression `={{ $json.output.replace(/\"/g, '') }}`  
       - size: `"1024x1024"`

6. **Add Convert To File node:**  
   - Name: `Convert to File`  
   - Connect from `Generate Image` node.  
   - Operation: `toBinary`  
   - Source Property: `data[0].b64_json`

7. **Add Google Drive node:**  
   - Name: `Save image to Drive`  
   - Connect from `Convert to File`.  
   - Configure:  
     - Filename: Expression: `={{ $('Set image subject').item.json.subject }}.png`  
     - Drive: `My Drive`  
     - Folder ID: Enter the target folder ID for images.  
     - Authenticate with Google Drive OAuth2 credentials.

8. **Add Slack node:**  
   - Name: `Send a message`  
   - Connect from `Save image to Drive`.  
   - Configure:  
     - Channel: Select appropriate Slack channel or enter channel ID (e.g., `"C08QZPHUN1Y"`).  
     - Message Type: Block Kit  
     - Message Blocks: Use JSON structure to include a divider, section with markdown text referencing image name and link, and accessory image with thumbnail URL from Google Drive file metadata.  
     - Authenticate with Slack API credentials.

9. **Test workflow:**  
   - Execute manually via the trigger.  
   - Verify the expanded prompt, image creation, saved file in Drive, and Slack notification.

---

### 5. General Notes & Resources

| Note Content                                                                                                   | Context or Link                                      |
|---------------------------------------------------------------------------------------------------------------|-----------------------------------------------------|
| This workflow automates text-to-image generation using OpenAI’s GPT and image APIs, storing images in Drive and notifying Slack channels. | General project description embedded in Sticky Note |
| Video explanation available: [![Video](https://img.youtube.com/vi/ZgDFb54P9ww/0.jpg)](https://youtu.be/ZgDFb54P9ww) | Sticky Note3 with video link                         |
| Slack message uses Block Kit format for rich message content with image preview and clickable link.           | Slack node configuration notes                       |
| OpenAI image generation API requires valid API key and quota management.                                      | HTTP Request node credentials and error handling    |
| Google Drive folder ID must be pre-created and accessible by OAuth2 credentials used in the workflow.         | Google Drive node configuration                      |

---

This completes the detailed reference document for the "AI-Enhanced Image Generation with GPT-4.1, Google Drive & Slack Notifications" n8n workflow.