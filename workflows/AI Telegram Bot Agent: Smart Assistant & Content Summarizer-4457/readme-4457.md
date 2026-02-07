AI Telegram Bot Agent: Smart Assistant & Content Summarizer

https://n8nworkflows.xyz/workflows/ai-telegram-bot-agent--smart-assistant---content-summarizer-4457


# AI Telegram Bot Agent: Smart Assistant & Content Summarizer

### 1. Workflow Overview

This workflow implements an **AI-powered Telegram Bot Agent** designed to serve as a smart assistant and content summarizer. It listens to incoming Telegram messages and supports three main commands:

- `/help`: Provides a help menu with command usage instructions.
- `/summary <URL>`: Fetches the article at the specified URL, extracts the main text, and generates a 10–12-point professional bullet-point summary using OpenAI.
- `/img <prompt>`: Acknowledges receipt of an image generation prompt and forwards it to OpenAI’s image generation API (or a configured image model endpoint).

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Listens for new Telegram messages and triggers the workflow.
- **1.2 Command Routing:** Determines which command was issued (`/help`, `/summary`, or `/img`) and directs the flow accordingly.
- **1.3 Help Response:** Sends a predefined help menu back to the user.
- **1.4 Summary Processing:** Validates summary requests, fetches webpage content, extracts article text, sends it to OpenAI for summarization, and returns the summary.
- **1.5 Image Processing:** Validates image prompts, sends prompt to OpenAI image generation API, and acknowledges the user.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  Watches Telegram for new messages and triggers the workflow on every message received.

- **Nodes Involved:**  
  - Listener

- **Node Details:**

  - **Listener**  
    - Type: Telegram Trigger  
    - Role: Entry point listening for new Telegram messages (`message` update type).  
    - Configuration: Listens to all messages without filters.  
    - Input: Telegram webhook event  
    - Output: Message JSON object containing chat, user, and message text details.  
    - Notes: Requires valid Telegram Bot credentials and webhook configuration.  
    - Potential Failures: Telegram API downtime, webhook misconfiguration.

---

#### 1.2 Command Routing

- **Overview:**  
  Checks the incoming message text and routes execution depending on whether the text starts with `/help`, `/summary`, or `/img`.

- **Nodes Involved:**  
  - Command Router  
  - Help Responder  
  - Summary Checker  
  - Image Prompt Checker

- **Node Details:**

  - **Command Router**  
    - Type: If node  
    - Role: Checks if message text starts with `/help`.  
    - Configuration: Condition `startsWith('/help')` on message text.  
    - Input: Listener output  
    - Output: Two branches: one for `/help`, one for others.  
    - Potential Failures: Expression evaluation errors if message text is missing.

  - **Help Responder**  
    - Type: Telegram node (send message)  
    - Role: Sends the help menu instructions to the user.  
    - Configuration: Static Markdown message describing commands `/summary <link>` and `/img <prompt>`.  
    - Input: Command Router’s `/help` branch  
    - Output: Sends message, then cycles back to Command Router (loop allows continuous listening).  
    - Potential Failures: Telegram API send message errors, chat ID missing.

  - **Summary Checker**  
    - Type: If node  
    - Role: Checks if message text starts with `/summary`.  
    - Configuration: Condition `startsWith('/summary')` on message text.  
    - Input: Command Router’s "not /help" branch  
    - Output: Branches to either summary processing or image prompt check.  
    - Potential Failures: Missing or malformed message text.

  - **Image Prompt Checker**  
    - Type: If node  
    - Role: Checks if message text starts with `/img`.  
    - Configuration: Condition `startsWith('/img')` on message text.  
    - Input: Summary Checker’s "not /summary" branch  
    - Output: Branches to image generation or ends flow.  
    - Potential Failures: Missing message text. If false, the flow ends silently (no response).

---

#### 1.3 Help Response

- **Overview:**  
  Handles `/help` command by sending a static help menu message describing usage.

- **Nodes Involved:**  
  - Help Responder

- **Node Details:**

  - **Help Responder**  
    - (See details above in Command Routing)

---

#### 1.4 Summary Processing

- **Overview:**  
  Processes `/summary <URL>` commands by fetching the article URL, extracting main content, summarizing it via OpenAI, and sending the summary back to the user.

- **Nodes Involved:**  
  - Fetcher  
  - Text Extractor  
  - Summarizer  
  - Summary Sender

- **Node Details:**

  - **Fetcher**  
    - Type: HTTP Request  
    - Role: Fetches the webpage HTML from the URL extracted from the message.  
    - Configuration:  
      - URL: Extracted from `message.link_preview_options.url` (assumes Telegram link preview is enabled).  
      - Sends a `User-Agent: Mozilla/5.0` header to mimic a browser request.  
    - Input: Summary Checker’s `/summary` branch  
    - Output: Raw HTML of the page.  
    - Potential Failures:  
      - Invalid or missing URL.  
      - HTTP errors (404, 500).  
      - Network timeouts.  
    - Notes: Relies on Telegram’s link preview to extract URL; if link preview disabled, URL extraction might fail.

  - **Text Extractor**  
    - Type: HTML Extract  
    - Role: Extracts the main article text from the HTML body tag, skipping SVG and anchor (`<a>`) elements.  
    - Configuration: Uses CSS selector `body` with skip selectors `svg, a`.  
    - Input: Fetcher output (HTML)  
    - Output: Extracted plain text content as a string.  
    - Potential Failures: Malformed HTML causing extraction issues.

  - **Summarizer**  
    - Type: OpenAI (LangChain node)  
    - Role: Sends extracted article text to OpenAI for summarization.  
    - Configuration:  
      - Model: List mode, user must choose an OpenAI model (e.g., GPT-4 or GPT-3.5).  
      - Prompt: "Summarize the entire content... into 10–12 concise bullet points..." with the extracted text injected.  
    - Input: Text Extractor output  
    - Output: OpenAI completion containing bullet-point summary.  
    - Potential Failures:  
      - OpenAI API authentication or quota errors.  
      - Prompt or variable injection errors.  
      - Timeout or rate limiting.  
    - Requirements: Valid OpenAI API credentials.

  - **Summary Sender**  
    - Type: Telegram node (send message)  
    - Role: Sends the bullet-point summary back to the user in Telegram.  
    - Configuration:  
      - Text: Extracted from OpenAI response JSON path: `candidates[0].content.parts[0].text`.  
      - Chat ID: From original Telegram message (`Listener` node).  
    - Input: Summarizer output  
    - Output: Sends message to Telegram chat.  
    - Potential Failures: Telegram API errors, invalid chat ID.

---

#### 1.5 Image Processing

- **Overview:**  
  Processes `/img <prompt>` commands by sending the prompt to an image generation API and acknowledging the user.

- **Nodes Involved:**  
  - Image Generator  
  - Image Acknowledger

- **Node Details:**

  - **Image Generator**  
    - Type: OpenAI (LangChain node)  
    - Role: Sends image generation prompt to OpenAI image endpoint or configured image API.  
    - Configuration:  
      - Resource set to `"image"` to indicate image generation.  
      - Options: Default.  
      - Input: The full message text starting with `/img`.  
    - Input: Image Prompt Checker’s `/img` branch  
    - Output: Response from image generation API (image URL or status).  
    - Potential Failures:  
      - OpenAI API errors or invalid credentials.  
      - Unsupported or missing prompt.  
      - Timeout or rate limiting.

  - **Image Acknowledger**  
    - Type: Telegram node (send message)  
    - Role: Sends a confirmation message to the user acknowledging receipt of the image prompt.  
    - Configuration: Static text explaining the image prompt was received and that actual image URLs are not yet returned by the Gemini image model (suggests using other APIs).  
    - Input: Image Generator output  
    - Output: Sends acknowledgment message to Telegram chat.  
    - Potential Failures: Telegram API errors, invalid chat ID.

---

### 3. Summary Table

| Node Name          | Node Type                      | Functional Role                                  | Input Node(s)           | Output Node(s)          | Sticky Note                                                                                                                    |
|--------------------|--------------------------------|-------------------------------------------------|------------------------|-------------------------|-------------------------------------------------------------------------------------------------------------------------------|
| Sticky Note        | Sticky Note                    | Quick-Start Telegram Echo Bot description        |                        |                         | Quick-Start Telegram Echo Bot: Parses /help, /summary <URL>, or /img <prompt> and returns help, summary, or image ack.       |
| Listener           | Telegram Trigger               | Listens for new Telegram messages                 |                        | Command Router           | Listener: Watches for any new message from Telegram and kicks the flow off.                                                   |
| Command Router     | If                            | Routes commands depending on message text        | Listener                | Help Responder, Summary Checker | Command Router: Checks if message starts with /help, /summary, or /img, routes accordingly.                                  |
| Help Responder     | Telegram                      | Sends help menu message                           | Command Router          | Command Router           | Help Responder: Replies with list of commands and usage info.                                                                 |
| Summary Checker    | If                            | Checks for /summary command                       | Command Router          | Fetcher, Image Prompt Checker | Summary Checker: Checks if text begins with /summary, fetches article or skips onward.                                        |
| Fetcher            | HTTP Request                  | Downloads webpage HTML at URL                      | Summary Checker         | Text Extractor           | Fetcher: Goes to provided URL and downloads page HTML.                                                                         |
| Text Extractor     | HTML Extract                  | Extracts main article text from HTML              | Fetcher                 | Summarizer               | Text Extractor: Pulls main article text (everything inside <body>).                                                            |
| Summarizer         | OpenAI (LangChain)            | Generates bullet-point summary from article text | Text Extractor          | Summary Sender           | Summarizer: Sends article text to OpenAI for 10-12 point professional summary.                                                 |
| Summary Sender     | Telegram                      | Sends summary back to Telegram user               | Summarizer              |                         | Summary Sender: Delivers bullet-point summary back to user in Telegram.                                                        |
| Image Prompt Checker| If                            | Checks for /img command                           | Summary Checker         | Image Generator          | Image Prompt Checker: Checks if text begins with /img, forwards prompt or ends flow.                                           |
| Image Generator    | OpenAI (LangChain)            | Sends image prompt to OpenAI image endpoint       | Image Prompt Checker    | Image Acknowledger        | Image Generator: Sends prompt to OpenAI's image endpoint or chosen image API.                                                  |
| Image Acknowledger  | Telegram                      | Acknowledges image prompt receipt                  | Image Generator         |                         | Image Acknowledger: Tells user "Got it—your image is being made!" and notes Gemini image model limitations.                   |
| Sticky Note1       | Sticky Note                    | Listener description                              |                        |                         | Listener: Watches for any new message from Telegram and kicks the flow off.                                                   |
| Sticky Note2       | Sticky Note                    | Command Router description                        |                        |                         | Command Router: Checks if message starts with /help, /summary, or /img, and sends it down the right path.                     |
| Sticky Note3       | Sticky Note                    | Help Responder description                        |                        |                         | Help Responder: When it sees /help, replies with a simple list of commands and usage instructions.                             |
| Sticky Note4       | Sticky Note                    | Summary Checker description                       |                        |                         | Summary Checker: Checks if text begins with /summary. If yes, proceeds to fetch article.                                       |
| Sticky Note5       | Sticky Note                    | Fetcher description                              |                        |                         | Fetcher: Goes to the provided URL and downloads the page’s HTML.                                                               |
| Sticky Note6       | Sticky Note                    | Image Prompt Checker description                  |                        |                         | Image Prompt Checker: Checks if text begins with /img. If yes, forwards prompt to image generator.                             |
| Sticky Note7       | Sticky Note                    | Text Extractor description                        |                        |                         | Text Extractor: Pulls out just the main article text (everything inside <body>).                                               |
| Sticky Note8       | Sticky Note                    | Image Generator description                       |                        |                         | Image Generator: Sends prompt to OpenAI’s image endpoint or chosen image API.                                                  |
| Sticky Note9       | Sticky Note                    | Summarizer description                            |                        |                         | Summarizer: Sends raw article text to OpenAI for a 10–12 point professional bullet-point summary.                              |
| Sticky Note10      | Sticky Note                    | Image Acknowledger description                     |                        |                         | Image Acknowledger: Tells user “Got it—your image is being made!” and notes image API limitations.                            |
| Sticky Note11      | Sticky Note                    | Summary Sender description                        |                        |                         | Summary Sender: Delivers bullet-point summary back to user in Telegram.                                                        |
| Sticky Note12      | Sticky Note                    | Workflow Assistance contact info                   |                        |                         | ======================================= WORKFLOW ASSISTANCE For questions or support contact Yaron@nofluff.online and see related videos and links. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Telegram Trigger node ("Listener")**  
   - Set the trigger to listen for `message` update events.  
   - Configure Telegram credentials (Telegram Bot token and webhook setup).  
   - Position: Entry node.

2. **Add an If node ("Command Router") connected to Listener output**  
   - Condition: Check if `{{$json["message"]["text"]}}` starts with `/help`.  
   - Output: Two branches - TRUE (for `/help`), FALSE (for others).

3. **Add a Telegram node ("Help Responder") connected to Command Router TRUE output**  
   - Set the chat ID to `{{$json["message"]["chat"]["id"]}}`.  
   - Message text (Markdown):  
     ```
     🤖 *Help Menu*

     Use `/summary <link>` to summarize an article.
     Use `/img <prompt>` to generate an image.

     _Example:_
     /summary https://example.com
     /img a futuristic cityscape
     ```  
   - After sending, loop back output to Command Router to continue listening.

4. **Add an If node ("Summary Checker") connected to Command Router FALSE output**  
   - Condition: Check if `{{$json["message"]["text"]}}` starts with `/summary`.  
   - Outputs: TRUE (to summary processing), FALSE (to image prompt check).

5. **Add an HTTP Request node ("Fetcher") connected to Summary Checker TRUE output**  
   - URL: `{{$json.message.link_preview_options.url}}` (note: relies on Telegram link preview).  
   - Add HTTP header `User-Agent: Mozilla/5.0`.  
   - Method: GET.

6. **Add an HTML Extract node ("Text Extractor") connected to Fetcher output**  
   - Operation: Extract HTML content.  
   - Extraction: CSS selector `body`.  
   - Skip selectors: `svg, a`.  
   - Output: Extracted main article text.

7. **Add OpenAI node ("Summarizer") connected to Text Extractor output**  
   - Resource: Language model (e.g., GPT-4 or GPT-3.5).  
   - Prompt:  
     ```
     Summarize the entire content provided below into 10–12 concise bullet points. Ensure each point captures a unique and important aspect of the information, covering the core ideas, key facts, major findings, and essential takeaways. Avoid repetition and use clear, professional language suitable for quick understanding by a decision-maker.

     Content:
     {{ $json.text }}
     ```  
   - Configure OpenAI API credentials.

8. **Add a Telegram node ("Summary Sender") connected to Summarizer output**  
   - Chat ID: `{{ $('Listener').item.json.message.chat.id }}`  
   - Text: `{{ $json["candidates"][0]["content"]["parts"][0]["text"] }}`  
   - Sends the bullet-point summary to the user.

9. **Add an If node ("Image Prompt Checker") connected to Summary Checker FALSE output**  
   - Condition: Check if `{{$json["message"]["text"]}}` starts with `/img`.  
   - TRUE: proceed to image generation.  
   - FALSE: end workflow silently.

10. **Add an OpenAI node ("Image Generator") connected to Image Prompt Checker TRUE output**  
    - Resource: Image generation endpoint.  
    - Input: Use message text from Telegram.  
    - Configure OpenAI API credentials.

11. **Add a Telegram node ("Image Acknowledger") connected to Image Generator output**  
    - Chat ID: `{{$json["message"]["chat"]["id"]}}`  
    - Text:  
      ```
      🖼️ Generated image prompt submitted! Gemini image model doesn't return images directly. Use image generation APIs like Stability for actual image URLs.
      ```  
    - Sends acknowledgment message to user.

12. **Add Sticky Notes for documentation purposes** as desired near each logical block or node.

---

### 5. General Notes & Resources

| Note Content | Context or Link |
|--------------|-----------------|
| Workflow designed and maintained by Yaron Been. For support, contact Yaron@nofluff.online. | Contact info from Sticky Note12 |
| Extensive tips and video guides available on YouTube: https://www.youtube.com/@YaronBeen/videos | YouTube channel for workflow assistance |
| Professional LinkedIn profile: https://www.linkedin.com/in/yaronbeen/ | Additional support and professional insights |
| The Gemini image model used currently does not return image URLs directly; consider integrating Stability or other image APIs for full image delivery. | Image generation limitations noted in Image Acknowledger |
| The workflow depends on Telegram’s link preview feature to extract URLs for summarization. Make sure this is enabled in your bot settings. | Important integration note for Fetcher node |

---

**Disclaimer:**  
The text provided is exclusively from an automated workflow created with n8n, adhering strictly to content policies. It contains no illegal, offensive, or protected elements. All data handled is legal and public.