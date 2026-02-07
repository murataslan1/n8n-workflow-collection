AI Text-to-Image for Telegram (Gemini + Hugging Face FLUX)

https://n8nworkflows.xyz/workflows/ai-text-to-image-for-telegram--gemini---hugging-face-flux--5031


# AI Text-to-Image for Telegram (Gemini + Hugging Face FLUX)

### 1. Workflow Overview

This workflow automates the generation of AI-created images based on text prompts received via Telegram messages. It leverages Google Gemini (an advanced AI chat model) to interpret user input and Hugging Face FLUX APIs to generate images from the interpreted text prompts. The final images are then sent back to the user on Telegram.

Logical blocks of the workflow:

- **1.1 Input Reception and Trigger**: Captures incoming Telegram messages from users.
- **1.2 AI Text Interpretation**: Uses Google Gemini chat model through a LangChain AI agent to process and understand the user's prompt.
- **1.3 Image Generation**: Sends the interpreted prompt to Hugging Face FLUX API to generate an image.
- **1.4 Image Retrieval and Delivery**: Downloads the generated image and sends it back to the user via Telegram.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Trigger

- **Overview:**  
  This block listens for incoming messages from Telegram users and triggers the workflow upon receiving a message.

- **Nodes Involved:**  
  - Telegram Trigger

- **Node Details:**

  - **Telegram Trigger**  
    - Type: Telegram Trigger (n8n built-in node)  
    - Configuration: Listens to all incoming Telegram messages on the configured bot webhook. No filters or specific commands indicated.  
    - Key Expressions/Variables: Captures message content, user info, chat ID for later response.  
    - Input: External Telegram webhook events  
    - Output: Passes the Telegram message data to the AI Agent node  
    - Version: 1.2  
    - Potential Failures: Telegram connectivity issues, webhook misconfiguration, invalid updates, or downtime.  

#### 2.2 AI Text Interpretation

- **Overview:**  
  Processes the raw user input text by passing it to the Google Gemini AI chat model through a LangChain AI agent, enabling advanced language understanding and prompt refinement for image generation.

- **Nodes Involved:**  
  - AI Agent  
  - Google Gemini Chat Model

- **Node Details:**

  - **AI Agent**  
    - Type: LangChain Agent node  
    - Configuration: Acts as an orchestrator for AI tasks, connected to the Google Gemini chat model as its language model.  
    - Key Expressions: Passes the Telegram message text as input to the model and expects refined or processed text output.  
    - Input: Telegram Trigger node (raw user message)  
    - Output: Passes processed text output to the Hugging Face HTTP Request node for image generation  
    - Version: 1.9  
    - Potential Failures: AI model timeouts, malformed input causing model errors, network issues reaching AI model API.  
    - Sub-workflow: None  

  - **Google Gemini Chat Model**  
    - Type: LangChain Google Gemini LM Chat Model  
    - Configuration: Uses Google Gemini as the language model backend to interpret user input messages.  
    - Input: Connected as the language model for the AI Agent node  
    - Output: Provides AI-processed text responses back to the AI Agent node  
    - Version: 1  
    - Potential Failures: API authentication errors, quota limits, latency or response errors from Google Gemini.  

#### 2.3 Image Generation

- **Overview:**  
  Takes the AI-generated prompt and sends an HTTP request to Hugging Face FLUX API to generate an image based on the text description.

- **Nodes Involved:**  
  - HTTP Request (Huggingface)

- **Node Details:**

  - **HTTP Request (Huggingface)**  
    - Type: HTTP Request  
    - Configuration: Sends a POST request to Hugging Face FLUX image generation endpoint with the AI Agent’s text output as prompt.  
    - Key Expressions: Uses dynamic input from AI Agent output to construct the request body (likely JSON with prompt text).  
    - Input: AI Agent node output (refined prompt text)  
    - Output: Response containing URL or data of the generated image, passed to the next HTTP Request node for downloading  
    - Version: 4.2  
    - Potential Failures: API authentication errors, rate limits, malformed request data, network timeouts, invalid or empty response payloads.  

#### 2.4 Image Retrieval and Delivery

- **Overview:**  
  Downloads the generated image from the URL received from Hugging Face, then sends the image back to the user on Telegram.

- **Nodes Involved:**  
  - HTTP Request (download_image)  
  - Telegram (Send Image back)

- **Node Details:**

  - **HTTP Request (download_image)**  
    - Type: HTTP Request  
    - Configuration: Downloads the image file from the URL received from Hugging Face response.  
    - Key Expressions: Uses the image URL extracted from the previous node’s response.  
    - Input: HTTP Request (Huggingface) node output  
    - Output: Passes binary image data to Telegram node for sending  
    - Version: 4.2  
    - Potential Failures: Invalid or expired URL, network errors, file size too large, unsupported image format.  

  - **Telegram**  
    - Type: Telegram node (sending message)  
    - Configuration: Sends the image binary data back to the Telegram chat from which the original message came. Uses chat ID from Telegram Trigger node.  
    - Input: HTTP Request (download_image) binary data  
    - Output: Sends image back to user, ends workflow  
    - Version: 1.2  
    - Potential Failures: Telegram API limits, invalid chat ID, network issues, unsupported image formats or large file sizes.  

---

### 3. Summary Table

| Node Name                  | Node Type                         | Functional Role                 | Input Node(s)           | Output Node(s)               | Sticky Note                        |
|----------------------------|----------------------------------|--------------------------------|------------------------|-----------------------------|----------------------------------|
| Telegram Trigger           | Telegram Trigger                 | Receive Telegram messages       | External Telegram events | AI Agent                    |                                  |
| AI Agent                  | LangChain Agent                  | Orchestrate AI text processing  | Telegram Trigger        | HTTP Request (Huggingface)  |                                  |
| Google Gemini Chat Model  | LangChain Google Gemini LM Chat | AI language model for processing| AI Agent (ai_languageModel input) | AI Agent                     |                                  |
| HTTP Request (Huggingface)| HTTP Request                    | Send prompt to Hugging Face API | AI Agent               | HTTP Request(download_image) |                                  |
| HTTP Request(download_image)| HTTP Request                    | Download generated image        | HTTP Request (Huggingface) | Telegram                    |                                  |
| Telegram                  | Telegram node                   | Send image back to Telegram user| HTTP Request(download_image) | None                        |                                  |
| Sticky Note               | Sticky Note                     | Not applicable                  | None                   | None                        |                                  |
| Sticky Note1              | Sticky Note                     | Not applicable                  | None                   | None                        |                                  |
| Sticky Note2              | Sticky Note                     | Not applicable                  | None                   | None                        |                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger Node**  
   - Type: Telegram Trigger  
   - Configuration: Connect your Telegram bot credentials. No special filters needed; accept all messages.  
   - Position it as the workflow start.

2. **Add LangChain AI Agent Node**  
   - Type: LangChain Agent  
   - Connect input from Telegram Trigger’s main output.  
   - No extra parameters needed here; will configure language model next.

3. **Add Google Gemini Chat Model Node**  
   - Type: LangChain Google Gemini LM Chat Model  
   - Configure with Google Gemini API credentials and parameters as per your API subscription.  
   - Connect its output as the `ai_languageModel` input of the AI Agent node (special input port).

4. **Add HTTP Request Node for Hugging Face**  
   - Type: HTTP Request  
   - Connect input from AI Agent’s main output.  
   - Configure to send POST requests to Hugging Face FLUX text-to-image API endpoint.  
   - Set authorization headers (e.g., Bearer token).  
   - Configure body to include prompt text from AI Agent output dynamically.  
   - Set response format to JSON.

5. **Add HTTP Request Node to Download Image**  
   - Type: HTTP Request  
   - Connect from Hugging Face HTTP Request output.  
   - Configure to download the image using URL from previous node’s response.  
   - Set response type to “File” or “Binary Data.”

6. **Add Telegram Node to Send Image**  
   - Type: Telegram  
   - Connect input from the HTTP Request (download_image) node output.  
   - Configure with Telegram bot credentials.  
   - Set chat ID dynamically from original Telegram Trigger node (pass it through the workflow).  
   - Set the message to send the downloaded image as a photo.

7. **Connect all nodes in the order:**  
   Telegram Trigger → AI Agent → HTTP Request (Huggingface) → HTTP Request (download_image) → Telegram (send image).

8. **Credentials Setup:**  
   - Configure Telegram bot credentials with OAuth2 or Bot Token.  
   - Set up Google Gemini API credentials in n8n credentials manager.  
   - Set up Hugging Face API credentials similarly.

9. **Test the Workflow:**  
   - Send a text message to your Telegram bot.  
   - Confirm the AI processes the message and returns an image.

---

### 5. General Notes & Resources

| Note Content                                                                                       | Context or Link                                       |
|--------------------------------------------------------------------------------------------------|------------------------------------------------------|
| This workflow demonstrates integration of Google Gemini AI with Hugging Face FLUX for image gen. | N8N official blog and LangChain documentation useful |
| Ensure API keys for Google Gemini and Hugging Face are valid and have sufficient quota.          | Google Cloud Console & Hugging Face API dashboard    |
| Telegram bots require proper webhook configuration and permissions to receive/send messages.     | https://core.telegram.org/bots/api                   |
| Hugging Face FLUX API documentation: https://huggingface.co/docs/api-inference/detailed_parameters | Reference for request parameters and response format |

---

**Disclaimer**: The provided text originates exclusively from an automated workflow created with n8n, an integration and automation tool. This process strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All manipulated data is legal and public.