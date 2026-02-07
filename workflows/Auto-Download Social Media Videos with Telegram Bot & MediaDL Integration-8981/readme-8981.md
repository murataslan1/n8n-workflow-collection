Auto-Download Social Media Videos with Telegram Bot & MediaDL Integration

https://n8nworkflows.xyz/workflows/auto-download-social-media-videos-with-telegram-bot---mediadl-integration-8981


# Auto-Download Social Media Videos with Telegram Bot & MediaDL Integration

### 1. Workflow Overview

This n8n workflow automates the process of downloading videos from social media URLs sent via a Telegram bot, leveraging the MediaDL API to resolve and proxy-download media files. It is designed for users who want to easily fetch and receive social media videos directly through Telegram.

The workflow is logically divided into four main blocks:

- **1.1 Telegram Input Reception:** Listens for incoming Telegram messages containing media URLs.
- **1.2 Media URL Resolution:** Sends the received URL to MediaDL to parse and obtain direct media URLs.
- **1.3 Download Preparation & Reliability:** Implements timed delays and URL filtering to ensure smooth, ordered processing and to mimic browser requests for successful API interactions.
- **1.4 Media Download & Telegram Response:** Downloads the media file via MediaDL’s proxy and sends it back to the Telegram chat as a video message.

---

### 2. Block-by-Block Analysis

#### 1.1 Telegram Input Reception

- **Overview:**  
Receives messages from users on Telegram, extracting the URL text to initiate the download process.

- **Nodes Involved:**  
  - Telegram Trigger

- **Node Details:**

  - **Telegram Trigger**  
    - Type: Telegram Trigger node (n8n-nodes-base.telegramTrigger)  
    - Role: Entry point that listens to Telegram messages with updates of type “message”.  
    - Configuration: Watches for incoming messages; uses Telegram API credentials.  
    - Expressions: None directly; message text is referenced downstream.  
    - Inputs: External Telegram messages.  
    - Outputs: JSON containing the full Telegram message, including `message.text` which should be a media URL.  
    - Version: 1.2  
    - Potential Issues: Telegram API authentication failure, network issues, incoming message format variations (non-URL messages could cause downstream failures).  

---

#### 1.2 Media URL Resolution

- **Overview:**  
Takes the Telegram message text (expected to be a URL), sends it to MediaDL’s API to resolve the actual media download URLs, and extracts the first media URL for further processing.

- **Nodes Involved:**  
  - URL Download  
  - Delay 3S  
  - Filtering URL Only

- **Node Details:**

  - **URL Download**  
    - Type: HTTP Request node (n8n-nodes-base.httpRequest)  
    - Role: Sends a POST request to `https://www.mediadl.app/api/download` with the URL from Telegram to resolve media information.  
    - Configuration:  
      - Method: POST  
      - Body: JSON with `{ url: <message.text>, format: "bestvideo+bestaudio/best" }`  
      - Headers: Includes user-agent and CORS headers mimicking a browser to avoid rejection.  
    - Expressions: `={{ $json.message.text }}` for URL extraction from Telegram message.  
    - Inputs: Telegram Trigger output.  
    - Outputs: JSON with media metadata including an array `medias` with URLs.  
    - Version: 4.2  
    - Potential Issues: API downtime, invalid URL input, rate limiting by MediaDL, malformed JSON responses.

  - **Delay 3S**  
    - Type: Wait node (n8n-nodes-base.wait)  
    - Role: Pauses workflow for 3 seconds to allow MediaDL API processing completion and avoid race conditions.  
    - Configuration: Fixed 3-second delay.  
    - Inputs: URL Download output.  
    - Outputs: Passes data unchanged.  
    - Version: 1.1  
    - Edge Cases: Delay may need adjustment for slow API responses or large files.

  - **Filtering URL Only**  
    - Type: Set node (n8n-nodes-base.set)  
    - Role: Simplifies data by extracting only the first media URL (`medias[0].url`) for the next download step.  
    - Configuration: Assigns `medias[0].url` to a simplified JSON path.  
    - Expressions: `={{ $json.medias[0].url }}`  
    - Inputs: Delay 3S output.  
    - Outputs: JSON containing only the first media URL under `medias[0].url`.  
    - Version: 3.4  
    - Potential Issues: Empty or missing `medias` array, resulting in undefined URL; needs error handling or fallback.

---

#### 1.3 Download Preparation & Reliability

- **Overview:**  
Adds a second delay to maintain timing between URL resolution and actual download, and prepares HTTP headers to mimic browser requests and ensure CDN/CORS acceptance.

- **Nodes Involved:**  
  - Delay 3S1

- **Node Details:**

  - **Delay 3S1**  
    - Type: Wait node (n8n-nodes-base.wait)  
    - Role: Waits 3 seconds before proceeding to the download to ensure MediaDL proxy is ready and to space API calls.  
    - Configuration: Fixed 3-second delay.  
    - Inputs: Filtering URL Only output.  
    - Outputs: Passes data unchanged.  
    - Version: 1.1  
    - Potential Issues: May require tuning for slow hosts or large files; no retry logic implemented.

---

#### 1.4 Media Download & Telegram Response

- **Overview:**  
Fetches the video file in binary form via MediaDL’s proxy-download endpoint using the URL filtered earlier, then sends the video back to the Telegram chat as a video message.

- **Nodes Involved:**  
  - Download  
  - Sent To Telegram Video

- **Node Details:**

  - **Download**  
    - Type: HTTP Request node (n8n-nodes-base.httpRequest)  
    - Role: Fetches the actual media file binary data through MediaDL’s proxy-download API.  
    - Configuration:  
      - Method: GET  
      - URL: `https://mediadl.app/api/proxy-download` with query parameter `fileUrl` set to the extracted media URL.  
      - Headers: Browser-like headers to avoid blocking (same as previous HTTP request).  
      - Options: Enables binary data download.  
    - Expressions: `={{ $json.medias[0].url }}` for file URL.  
    - Inputs: Delay 3S1 output.  
    - Outputs: Binary video data ready for Telegram.  
    - Version: 4.2  
    - Potential Issues: Large file size may exceed Telegram limits, proxy downtime, network timeouts, incorrect file URL.

  - **Sent To Telegram Video**  
    - Type: Telegram node (n8n-nodes-base.telegram)  
    - Role: Sends the downloaded video back to the Telegram user’s chat.  
    - Configuration:  
      - Chat ID: Extracted dynamically from Telegram Trigger message (`message.chat.id`).  
      - Operation: `sendVideo` with binary data enabled.  
      - File Name: Dynamically set from previous Delay 3S node `title` property with `.mp4` extension—note that `title` must be resolved upstream or set by the user.  
      - Credentials: Telegram API credentials reused.  
    - Expressions:  
      - Chat ID: `={{ $('Telegram Trigger').item.json.message.chat.id }}`  
      - Filename: `={{ $('Delay 3S').item.json.title }}.mp4` (may require validation if title is undefined).  
    - Inputs: Download node output (binary video).  
    - Outputs: None (end of chain).  
    - Version: 1.2  
    - Potential Issues: Telegram file size limits (~50 MB for bots, larger for user accounts), chat ID errors, missing or invalid file name, Telegram API downtime.

---

### 3. Summary Table

| Node Name          | Node Type             | Functional Role                      | Input Node(s)          | Output Node(s)          | Sticky Note                                                                                              |
|--------------------|-----------------------|------------------------------------|-----------------------|-------------------------|--------------------------------------------------------------------------------------------------------|
| Telegram Trigger    | Telegram Trigger       | Receives Telegram message input    | —                     | URL Download            | Expects URL in `message.text`.                                                                         |
| URL Download       | HTTP Request          | Resolves media URLs via MediaDL API| Telegram Trigger      | Delay 3S                | POSTs URL to MediaDL to get media info.                                                                |
| Delay 3S           | Wait                  | Waits 3 seconds after URL resolution| URL Download          | Filtering URL Only       | Adds spacing for API processing.                                                                        |
| Filtering URL Only  | Set                   | Extracts first media URL            | Delay 3S               | Delay 3S1                | Filters to `medias[0].url` for final download.                                                        |
| Delay 3S1          | Wait                  | Waits 3 seconds before download     | Filtering URL Only      | Download                 | Ensures timing between steps.                                                                           |
| Download           | HTTP Request          | Downloads media file binary         | Delay 3S1               | Sent To Telegram Video   | GETs proxy-download with browser headers.                                                              |
| Sent To Telegram Video | Telegram            | Sends video file back to Telegram chat | Download           | —                       | Sends video with filename from title; respects Telegram limits.                                        |
| Sticky Note        | Sticky Note           | Step 1 overview                     | —                     | —                       | "Listens to Telegram message, sends URL to mediadl to prepare download..."                             |
| Sticky Note1       | Sticky Note           | Step 2 input & URL handling         | —                     | —                       | Details Telegram Trigger and URL Download roles.                                                      |
| Sticky Note2       | Sticky Note           | Step 3 reliability & timing         | —                     | —                       | Explains delays, headers, and retry suggestions.                                                      |
| Sticky Note3       | Sticky Note           | Step 4 output & limits              | —                     | —                       | Notes on download and Telegram send, including ToS and file size limits.                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger Node:**  
   - Type: Telegram Trigger  
   - Parameters: Set `Updates` to `message`  
   - Credentials: Connect your Telegram API credentials  
   - Purpose: Listen for incoming Telegram messages containing URLs.

2. **Create URL Download Node:**  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://www.mediadl.app/api/download`  
   - Body Parameters: JSON with keys:  
     - `url`: Expression `={{ $json.message.text }}`  
     - `format`: `"bestvideo+bestaudio/best"`  
   - Headers: Add browser-like headers to mimic a web browser (User-Agent, Accept, Referer, etc.)  
   - Credentials: None required  
   - Connect input from Telegram Trigger

3. **Create Delay 3S Node:**  
   - Type: Wait  
   - Parameters: Delay time set to 3 seconds  
   - Connect input from URL Download

4. **Create Filtering URL Only Node:**  
   - Type: Set  
   - Parameters: Assign field `medias[0].url` with expression `={{ $json.medias[0].url }}`  
   - Connect input from Delay 3S

5. **Create Delay 3S1 Node:**  
   - Type: Wait  
   - Parameters: Delay time set to 3 seconds  
   - Connect input from Filtering URL Only

6. **Create Download Node:**  
   - Type: HTTP Request  
   - Method: GET  
   - URL: `https://mediadl.app/api/proxy-download`  
   - Query Parameters: `fileUrl` with expression `={{ $json.medias[0].url }}`  
   - Headers: Same browser-like headers as URL Download node  
   - Enable binary data download  
   - Connect input from Delay 3S1

7. **Create Sent To Telegram Video Node:**  
   - Type: Telegram  
   - Operation: sendVideo  
   - Chat ID: Expression `={{ $('Telegram Trigger').item.json.message.chat.id }}`  
   - Enable binary data  
   - File Name: Expression `={{ $('Delay 3S').item.json.title }}.mp4` (ensure `title` is set somewhere or use fallback)  
   - Credentials: Telegram API credentials  
   - Connect input from Download

8. **Add Sticky Notes (Optional for clarity):**  
   - Add sticky notes describing each step as per the overview and reliability notes.

9. **Final Checks:**  
   - Validate Telegram API credentials and chat permissions.  
   - Confirm MediaDL API is accessible and not rate-limited.  
   - Test with various social media URLs to ensure compatibility.  
   - Consider implementing error handling or retries for failed downloads or invalid URLs.  
   - Adjust delay times if needed based on response times and media sizes.

---

### 5. General Notes & Resources

| Note Content                                                                                  | Context or Link                                                                                                           |
|-----------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------|
| Respect platform Terms of Service and copyright when downloading and redistributing media.    | General legal reminder                                                                                                     |
| Telegram bots have file size limits (~50 MB); large video files might require alternative methods or splitting. | Telegram API documentation                                                                                                 |
| MediaDL API usage is subject to their service availability and rate limits.                    | https://www.mediadl.app                                                                                                   |
| Browser-like headers (User-Agent, Referer, Accept) help bypass CORS and CDN restrictions.     | See nodes URL Download and Download for header examples                                                                   |
| For large files or slow connections, increase delays or add retry logic for robustness.      | Sticky Note 2                                                                                                              |

---

**Disclaimer:**  
The provided text and analysis are exclusively derived from an automated n8n workflow using publicly available APIs and legal data. All content complies strictly with current content policies and contains no illegal or protected materials.