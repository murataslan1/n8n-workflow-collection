Analyze Images & Extract Text with GPT-4o Vision and Telegram

https://n8nworkflows.xyz/workflows/analyze-images---extract-text-with-gpt-4o-vision-and-telegram-8185


# Analyze Images & Extract Text with GPT-4o Vision and Telegram

### 1. Workflow Overview

This workflow enables a Telegram bot to receive images from users, analyze their content using the AIMLAPI GPT-4o Vision model, extract visible text (OCR), and respond back to the user with a concise description. It is designed for image content recognition and text extraction directly via Telegram messaging.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Receives new messages from Telegram, extracts the photo file ID and chat information.
- **1.2 User Experience Enhancement:** Sends a “typing…” action to Telegram to indicate processing.
- **1.3 Photo Retrieval:** Downloads the photo from Telegram servers using the file ID.
- **1.4 Image Encoding:** Converts the downloaded binary image into a base64-encoded string and normalizes the MIME type.
- **1.5 AI Processing:** Sends the base64-encoded image to AIMLAPI’s GPT-4o Vision endpoint for image description and OCR extraction.
- **1.6 Response Delivery:** Sends the AI-generated description and extracted text back to the user via Telegram.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:** Listens for new incoming Telegram messages and extracts essential data for processing.
- **Nodes Involved:**  
  - Step 1 · 📩 Telegram Trigger (In)
- **Node Details:**

  - **Step 1 · 📩 Telegram Trigger (In)**
    - Type: Telegram Trigger  
    - Role: Entry point; listens for new messages on Telegram.
    - Configuration:  
      - Listens for "message" updates.  
      - No additional filters, captures all new messages.
    - Expressions:  
      - Extracts `chat.id` for replying.  
      - Extracts last photo's `file_id` from `message.photo` array.
    - Input: External Telegram messages.  
    - Output: JSON containing message details and photo file IDs.
    - Potential Failures:  
      - Missing photo in message (no photo received).  
      - Telegram API connectivity issues or webhook misconfiguration.
    - Version: 1.2

#### 2.2 User Experience Enhancement

- **Overview:** Sends a “typing…” action to Telegram chat, simulating bot activity during processing.
- **Nodes Involved:**  
  - Step 1.5 · 💬 Typing…
- **Node Details:**

  - **Step 1.5 · 💬 Typing…**
    - Type: Telegram node (sendChatAction)  
    - Role: Improves UX by signaling that the bot is processing.
    - Configuration:  
      - Operation: `sendChatAction` with action `typing`.  
      - Chat ID dynamically set from trigger node output.
    - Input: Trigger node output.  
    - Output: Confirmation of chat action sent.
    - Potential Failures:  
      - Invalid chat ID.  
      - Telegram API quota or rate limits.
    - Version: 1.2

#### 2.3 Photo Retrieval

- **Overview:** Downloads the image file from Telegram using the photo’s file ID.
- **Nodes Involved:**  
  - Step 2 · 📷 Get Photo
- **Node Details:**

  - **Step 2 · 📷 Get Photo**
    - Type: Telegram node (file resource)  
    - Role: Fetches the photo binary data from Telegram servers.
    - Configuration:  
      - `fileId` extracted from the last element in the photo array from the trigger node.  
      - Requests image/jpeg MIME type.
    - Input: Output from "Typing…" node.  
    - Output: Binary photo data.
    - Potential Failures:  
      - Invalid or expired file_id.  
      - Telegram file retrieval errors or network issues.
    - Version: 1.2

#### 2.4 Image Encoding

- **Overview:** Converts binary image data to base64 and constructs a proper Data URI for the AI API.
- **Nodes Involved:**  
  - Step 3 · 🧩 Extract → base64  
  - Step 3.5 · 🧑‍💻 Build Data URI
- **Node Details:**

  - **Step 3 · 🧩 Extract → base64**
    - Type: Extract From File  
    - Role: Converts binary data to a JSON property with base64 string.
    - Configuration:  
      - Operation: `binaryToProperty` (extracts base64 into a JSON property).  
      - Defaults for options.
    - Input: Binary photo data from Step 2.  
    - Output: JSON with base64 string under `data`.
    - Potential Failures:  
      - Corrupted binary data.  
      - Conversion errors.
    - Version: 1

  - **Step 3.5 · 🧑‍💻 Build Data URI**
    - Type: Code (JavaScript)  
    - Role: Builds the Data URI string required by AIMLAPI GPT-4o Vision.  
    - Configuration:  
      - Reads base64 string from previous node.  
      - Normalizes MIME type to `image/jpeg` (Telegram sometimes returns `image/jpg` which is non-standard).  
      - Constructs `data:image/jpeg;base64,<base64>` URI.
    - Input: JSON with base64 from Step 3.  
    - Output: JSON with constructed Data URI under `dataUri`.
    - Potential Failures:  
      - Missing or malformed base64 string.  
      - Logic errors in code.
    - Version: 2

#### 2.5 AI Processing

- **Overview:** Sends the image Data URI and instruction prompt to AIMLAPI GPT-4o Vision API for analysis.
- **Nodes Involved:**  
  - Step 4 · 🧠 AIMLAPI Vision (HTTP)
- **Node Details:**

  - **Step 4 · 🧠 AIMLAPI Vision (HTTP)**
    - Type: HTTP Request  
    - Role: Sends POST request to AIMLAPI GPT-4o endpoint to analyze image content and extract text.
    - Configuration:  
      - URL: `https://api.aimlapi.com/v1/chat/completions`  
      - Method: POST  
      - Authentication: Predefined credential "AI/ML account" with API key and base URL configured.  
      - Payload: JSON body containing:  
        - model: `openai/gpt-4o`  
        - messages array with user role: instruction text + image_url object containing the Data URI  
        - max_tokens: 300  
      - Retries enabled on failure.
    - Input: Data URI from Step 3.5.  
    - Output: JSON response with AI-generated description and OCR text.
    - Potential Failures:  
      - API authentication errors (invalid API key).  
      - Network or timeout issues.  
      - Exceeding token or rate limits.  
      - Malformed request payload.
    - Version: 4.2

#### 2.6 Response Delivery

- **Overview:** Sends the AI response text back to the Telegram user as a message reply.
- **Nodes Involved:**  
  - Step 5 · 📤 Reply to Telegram
- **Node Details:**

  - **Step 5 · 📤 Reply to Telegram**
    - Type: Telegram node (sendMessage)  
    - Role: Sends the processed text (image description + OCR) back to the user.
    - Configuration:  
      - Text: Extracts `choices[0].message.content` from AIMLAPI response JSON; fallback text if empty.  
      - Chat ID: from original Telegram trigger message.  
      - Additional fields:  
        - Disables web page preview.  
        - Replies to the original message ID.  
        - No attribution appended.
    - Input: AIMLAPI response from Step 4.  
    - Output: Confirmation of sent message.
    - Potential Failures:  
      - Invalid chat ID or message ID.  
      - Telegram API limits or downtime.
    - Version: 1.2

---

### 3. Summary Table

| Node Name                    | Node Type             | Functional Role                 | Input Node(s)                         | Output Node(s)                 | Sticky Note                                                                                               |
|-----------------------------|-----------------------|--------------------------------|-------------------------------------|-------------------------------|---------------------------------------------------------------------------------------------------------|
| Step 1 · 📩 Telegram Trigger (In) | Telegram Trigger       | Input reception from Telegram  | None                                | Step 1.5 · 💬 Typing…           | # 📥 Step 1 — Receive Telegram Message: Listens for new messages and extracts chat ID and photo file_id. |
| Step 1.5 · 💬 Typing…          | Telegram (sendChatAction) | User experience: typing status | Step 1 · 📩 Telegram Trigger (In)   | Step 2 · 📷 Get Photo           | # 💬 Step 1.5 — Simulate Typing: Sends "typing…" action to user during processing.                       |
| Step 2 · 📷 Get Photo          | Telegram (file resource)  | Retrieve photo file from Telegram | Step 1.5 · 💬 Typing…                | Step 3 · 🧩 Extract → base64    | # 📷 Step 2 — Get Photo: Fetches binary photo data by file_id.                                          |
| Step 3 · 🧩 Extract → base64   | Extract From File       | Convert binary to base64 string | Step 2 · 📷 Get Photo                | Step 3.5 · 🧑‍💻 Build Data URI  | # 🧩 Step 3 — Convert to base64: Converts image binary to base64 string.                                |
| Step 3.5 · 🧑‍💻 Build Data URI | Code (JavaScript)       | Normalize MIME and build URI   | Step 3 · 🧩 Extract → base64         | Step 4 · 🧠 AIMLAPI Vision (HTTP) | # 🧑‍💻 Step 3.5 — Normalize MIME: Fixes MIME type and builds Data URI for API.                          |
| Step 4 · 🧠 AIMLAPI Vision (HTTP) | HTTP Request            | AI image analysis and OCR      | Step 3.5 · 🧑‍💻 Build Data URI      | Step 5 · 📤 Reply to Telegram   | # 🧠 Step 4 — AIMLAPI Vision: Sends image + instructions to GPT-4o, receives description + text.        |
| Step 5 · 📤 Reply to Telegram  | Telegram (sendMessage)  | Send AI response back to user  | Step 4 · 🧠 AIMLAPI Vision (HTTP)   | None                          | # 📤 Step 5 — Send Reply: Sends model response as Telegram message reply.                               |
| Sticky Note — Overview        | Sticky Note             | Documentation                  | None                                | None                          | # 📸 Telegram → AIMLAPI Vision Bot: Overview and feature list.                                          |
| Sticky Note — Setup Guide     | Sticky Note             | Documentation                  | None                                | None                          | # 🛠 Setup Guide: Instructions for Telegram bot creation and credential setup.                          |
| Sticky Note — Receive Message | Sticky Note             | Documentation                  | None                                | None                          | # 📥 Step 1 — Receive Telegram Message: Explains trigger node role and data extracted.                  |
| Sticky Note — GPT‑5 Processing | Sticky Note             | Documentation                  | None                                | None                          | # 📷 Step 2 — Get Photo: Explains photo retrieval.                                                      |
| Sticky Note — Send Response   | Sticky Note             | Documentation                  | None                                | None                          | # 🧩 Step 3 — Convert to base64: Explains base64 conversion.                                           |
| Sticky Note — Receive Message1 | Sticky Note             | Documentation                  | None                                | None                          | # 💬 Step 1.5 — Simulate Typing: Explains typing action node.                                          |
| Sticky Note — Send Response1  | Sticky Note             | Documentation                  | None                                | None                          | # 🧑‍💻 Step 3.5 — Normalize MIME: Explains MIME normalization in code node.                            |
| Sticky Note — Logging         | Sticky Note             | Documentation                  | None                                | None                          | # 🧠 Step 4 — AIMLAPI Vision: Explains HTTP request to AIMLAPI.                                        |
| Sticky Note — Logging1        | Sticky Note             | Documentation                  | None                                | None                          | # 📤 Step 5 — Send Reply: Explains sending response back to Telegram.                                 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Bot and Credentials**  
   - Use [@BotFather](https://t.me/BotFather) on Telegram to create a new bot and obtain the API token.  
   - In n8n, create Telegram API credentials by pasting the token.

2. **Create AI/ML API Credentials**  
   - Obtain an API key from AIMLAPI (https://api.aimlapi.com).  
   - Set up credentials in n8n with base URL `https://api.aimlapi.com/v1` and the API key.

3. **Add Telegram Trigger Node**  
   - Name: `Step 1 · 📩 Telegram Trigger (In)`  
   - Type: Telegram Trigger  
   - Parameters: Listen for `message` updates.  
   - Attach Telegram API credentials.  
   - Purpose: Trigger workflow on new Telegram messages.

4. **Add Telegram Node to Send Chat Action**  
   - Name: `Step 1.5 · 💬 Typing…`  
   - Type: Telegram (sendChatAction)  
   - Parameters:  
     - Operation: `sendChatAction`  
     - Chat ID: `={{ $json.message.chat.id }}`  
   - Credentials: Telegram API  
   - Connect output of Telegram Trigger to this node.

5. **Add Telegram Node to Get Photo**  
   - Name: `Step 2 · 📷 Get Photo`  
   - Type: Telegram (file resource)  
   - Parameters:  
     - `fileId`: `={{ $json.message.photo[$json.message.photo.length - 1].file_id }}`  
     - Request MIME type: `image/jpeg`  
   - Credentials: Telegram API  
   - Connect output of "Typing…" node to this node.

6. **Add Extract From File Node**  
   - Name: `Step 3 · 🧩 Extract → base64`  
   - Type: Extract From File  
   - Parameters: Operation: `binaryToProperty` (extract base64)  
   - Connect output of "Get Photo" node to this node.

7. **Add Code Node to Build Data URI**  
   - Name: `Step 3.5 · 🧑‍💻 Build Data URI`  
   - Type: Code (JavaScript)  
   - Code:  
     ```js
     const base64Data = $input.first().json.data;
     let fixedMime = 'image/jpeg';
     return [{
       dataUri: `data:${fixedMime};base64,${base64Data}`
     }];
     ```
   - Connect output of Extract From File node to this node.

8. **Add HTTP Request Node to Call AIMLAPI Vision**  
   - Name: `Step 4 · 🧠 AIMLAPI Vision (HTTP)`  
   - Type: HTTP Request  
   - Parameters:  
     - URL: `https://api.aimlapi.com/v1/chat/completions`  
     - Method: POST  
     - Authentication: Use AIMLAPI credentials  
     - Body Content Type: JSON  
     - JSON Body:  
       ```json
       {
         "model": "openai/gpt-4o",
         "messages": [
           {
             "role": "user",
             "content": [
               {
                 "type": "text",
                 "text": "Describe this image. Then extract any visible text (OCR). Keep it concise."
               },
               {
                 "type": "image_url",
                 "image_url": {
                   "url": "{{ $json.dataUri }}"
                 }
               }
             ]
           }
         ],
         "max_tokens": 300
       }
       ```
     - Enable retry on fail.
   - Connect output of Code node to this node.

9. **Add Telegram Node to Reply to User**  
   - Name: `Step 5 · 📤 Reply to Telegram`  
   - Type: Telegram (sendMessage)  
   - Parameters:  
     - Text: `={{ $json?.choices?.[0]?.message?.content || "Sorry, the model returned an empty response." }}`  
     - Chat ID: `={{ $json.message.chat.id }}` (from original trigger)  
     - Additional Fields:  
       - Disable web page preview: true  
       - Reply to message ID: `={{ $json.message.message_id }}`  
       - Append attribution: false  
   - Credentials: Telegram API  
   - Connect output of HTTP Request node to this node.

---

### 5. General Notes & Resources

| Note Content                                                                                                                  | Context or Link                                      |
|-------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------|
| To create the Telegram bot token, interact with [@BotFather](https://t.me/BotFather) on Telegram and follow `/newbot` command. | Telegram Bot Setup                                  |
| AIMLAPI GPT-4o Vision API requires your API key and base URL: `https://api.aimlapi.com/v1`.                                    | AIMLAPI Documentation and API Setup                 |
| This workflow simulates typing to enhance user experience during image processing delays.                                      | UX Enhancement in Telegram Bots                      |
| Telegram sometimes reports MIME type as `image/jpg` which is non-standard; this workflow normalizes it to `image/jpeg`.         | MIME Type Normalization                              |
| The model prompt instructs the AI to produce a concise description and OCR text extraction, suitable for quick user replies.    | AI Prompt Design for Vision Models                   |

---

**Disclaimer:**  
The provided text is exclusively derived from an automated workflow created using n8n, an integration and automation platform. This processing strictly respects current content policies and contains no illegal, offensive, or protected elements. All data handled are legal and public.