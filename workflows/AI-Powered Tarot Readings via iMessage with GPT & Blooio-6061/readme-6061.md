AI-Powered Tarot Readings via iMessage with GPT & Blooio

https://n8nworkflows.xyz/workflows/ai-powered-tarot-readings-via-imessage-with-gpt---blooio-6061


# AI-Powered Tarot Readings via iMessage with GPT & Blooio

---

### 1. Workflow Overview

This workflow implements an AI-powered tarot reading service accessible via iMessage, integrating Blooio.com messaging API and OpenAI GPT models through n8n automation. It targets users who send tarot-related queries or images of tarot cards via iMessage, providing intuitive, poetic tarot interpretations and guidance through AI.

The logic is organized into these functional blocks:

- **1.1 Input Reception and Filtering:** Receives incoming iMessage events from Blooio via webhook, filters out self-messages, and checks for attached images.
- **1.2 Image Handling:** If tarot card images are attached, downloads them for subsequent AI visual analysis.
- **1.3 AI Tarot Interpretation:** Uses LangChain AI Agent with OpenAI GPT-4.1-mini model to analyze text and images with a carefully crafted mystical tarot reading prompt.
- **1.4 Session Memory Management:** Stores and retrieves chat context using Postgres to maintain conversational continuity.
- **1.5 Message Aggregation and Response Generation:** Aggregates any multi-part AI responses, summarizes if needed, and prepares the outgoing message.
- **1.6 Sending Response via Blooio:** Sends the AI-generated tarot reading back to the user through Blooio’s messaging API.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Filtering

- **Overview:**  
  Listens for incoming iMessage messages from Blooio. Prevents the bot from responding to its own messages to avoid loops.

- **Nodes Involved:**  
  - Receive Message (From Blooio)  
  - Don't respond to yourself  
  - If has images, download them (conditional branching)

- **Node Details:**

  - **Receive Message (From Blooio)**  
    - *Type:* Webhook  
    - *Role:* Entry point receiving POST requests from Blooio with new or updated iMessage data.  
    - *Config:* Path `/tarot-ai`, HTTP POST method, expects JSON payload with message details including sender, content, attachments.  
    - *Input:* External HTTP request from Blooio.  
    - *Output:* Message JSON passed downstream.  
    - *Failure Modes:* Missing or malformed webhook payload, Blooio endpoint misconfiguration.

  - **Don't respond to yourself**  
    - *Type:* If (Conditional)  
    - *Role:* Filters out messages sent by the bot itself by checking `selfMessage` boolean flag in payload.  
    - *Config:* Condition is `selfMessage == false`. Only allows non-self messages to proceed.  
    - *Input:* Output from webhook node.  
    - *Output:* Proceeds only if message is from user.  
    - *Edge Cases:* If `selfMessage` field missing or incorrectly set, may block or allow unintended messages.

  - **If has images, download them**  
    - *Type:* If (Conditional)  
    - *Role:* Checks if message contains attachments (images) to branch the workflow accordingly.  
    - *Config:* Condition on length of `message.attachments` array > 0.  
    - *Input:* Filtered user message JSON.  
    - *Output:* Two branches - yes (has images), no (no images).  
    - *Edge Cases:* Attachments array empty or undefined; non-image attachments not validated here.

---

#### 2.2 Image Handling

- **Overview:**  
  Extracts URLs of attached images and prepares them for AI processing.

- **Nodes Involved:**  
  - Code (Extract URLs)  
  - Loop Over Items (Iterate URLs)  
  - HTTP Request (Download Images)

- **Node Details:**

  - **Code (Extract URLs)**  
    - *Type:* Code (JavaScript)  
    - *Role:* Pulls URLs from each attachment in the incoming message's attachments array.  
    - *Config:* Iterates over `message.attachments`, outputs an array of objects each with a `url` property.  
    - *Input:* Incoming message JSON with attachments.  
    - *Output:* List of attachment URLs for looping.  
    - *Failure Modes:* If attachments array missing or malformed, may produce empty output or error.

  - **Loop Over Items**  
    - *Type:* SplitInBatches  
    - *Role:* Processes each attachment URL individually to handle downloads or AI recognition.  
    - *Config:* Default batch size (assumed 1).  
    - *Input:* URLs array from Code node.  
    - *Output:* Sends each URL item downstream sequentially.  
    - *Edge Cases:* Large number of attachments could slow workflow; no explicit concurrency control.

  - **HTTP Request**  
    - *Type:* HTTP Request  
    - *Role:* Fetches each image from its URL for AI analysis.  
    - *Config:* URL dynamically set from current item’s URL, GET method (default).  
    - *Input:* Single attachment URL.  
    - *Output:* Binary image data or raw response passed to AI Agent.  
    - *Failure Modes:* URL expiration, network issues, invalid URLs, slow response.

---

#### 2.3 AI Tarot Interpretation

- **Overview:**  
  Uses an advanced AI Agent with a tailored prompt to interpret tarot card images and/or text questions, producing a poetic, warm tarot reading.

- **Nodes Involved:**  
  - AI Agent (Main tarot reading)  
  - OpenAI Chat Model (GPT-4.1-mini)  
  - Postgres Chat Memory

- **Node Details:**

  - **AI Agent**  
    - *Type:* LangChain Agent  
    - *Role:* Core AI processing node combining visual recognition and text interpretation of tarot inputs.  
    - *Config:* Receives user message content and images as inputs. Uses a complex system prompt defining identity, mission, analysis protocol, and response format in a mystical tarot reading style.  
    - *Key Expressions:*  
      - Message text extracted as `User message: {{message content}}`  
      - Passthrough of binary images enabled for visual recognition.  
    - *Input:* User message content and images.  
    - *Output:* Tarot reading text.  
    - *Version Note:* Requires LangChain agent node version supporting visual inputs and prompt customization.  
    - *Failure Modes:* AI model errors, image recognition failures, prompt timeouts, OpenAI API limits.

  - **OpenAI Chat Model**  
    - *Type:* Language Model (OpenAI GPT-4.1-mini)  
    - *Role:* Provides the underlying GPT model used by AI Agent for text generation.  
    - *Config:* Model set to `gpt-4.1-mini`, no additional options.  
    - *Credentials:* Uses OpenAI API key credential.  
    - *Input/Output:* Connected as AI language model provider for AI Agent.  
    - *Failure Modes:* API authentication failure, rate limiting, network errors.

  - **Postgres Chat Memory**  
    - *Type:* LangChain Postgres Chat Memory  
    - *Role:* Maintains conversation context keyed by conversation ID, allowing the bot to remember past interactions and provide coherent multi-turn readings.  
    - *Config:* Uses table `n8n_tarot_ai`, session key from `message.conversation.id`, context window length 200 tokens.  
    - *Credentials:* Uses Neon Postgres credentials.  
    - *Input/Output:* Connected as AI memory for AI Agent.  
    - *Failure Modes:* Database connection issues, data corruption, session key missing.

---

#### 2.4 Message Aggregation and Response Generation

- **Overview:**  
  Aggregates AI-generated data if multiple partial results exist, summarizes if necessary, and prepares the final message to send.

- **Nodes Involved:**  
  - Aggregate  
  - AI Agent1 (Summary Agent)  
  - OpenAI Chat Model1

- **Node Details:**

  - **Aggregate**  
    - *Type:* Aggregate  
    - *Role:* Combines all AI Agent outputs into a single aggregated JSON object.  
    - *Config:* Uses `aggregateAllItemData` to collect all outputs.  
    - *Input:* Outputs from AI Agent node.  
    - *Output:* Single aggregated data structure.  
    - *Failure Modes:* Empty inputs, aggregation errors.

  - **AI Agent1**  
    - *Type:* LangChain Agent  
    - *Role:* Summarizes the aggregated AI outputs into a concise iMessage-style tarot report without explicit headers.  
    - *Config:* Uses a system prompt instructing plain summary format without framing phrases.  
    - *Input:* Aggregated data converted to JSON string.  
    - *Output:* Final tarot reading text.  
    - *Failure Modes:* Model errors, prompt failures.

  - **OpenAI Chat Model1**  
    - *Type:* Language Model  
    - *Role:* GPT model providing text generation for summary agent.  
    - *Config:* Same as main OpenAI Chat Model node.  
    - *Input/Output:* Supplies AI Agent1 with language model services.  
    - *Failure Modes:* Same as above.

---

#### 2.5 Sending Response via Blooio

- **Overview:**  
  Sends the AI-generated tarot reading back to the user through Blooio API via HTTP POST.

- **Nodes Involved:**  
  - Send Message

- **Node Details:**

  - **Send Message**  
    - *Type:* HTTP Request  
    - *Role:* Posts the tarot reading message to Blooio’s `send-message` API endpoint to deliver to the user’s iMessage.  
    - *Config:*  
      - Method: POST  
      - URL: `https://api.blooio.com/send-message`  
      - Body: JSON containing `identifier` (user’s phone number) and `message` (AI reading text)  
      - Headers: Accept `application/json`, Authorization Bearer token (Blooio API token), Content-Type `application/json`  
      - Credentials: Uses Bearer Auth credential with Blooio API token  
    - Input: Final tarot reading text and recipient identifier extracted from incoming message.  
    - Output: API response confirming message sent.  
    - Failure Modes: Auth failures, API errors, network issues, invalid recipient number.

---

#### 2.6 Additional Documentation Nodes (Sticky Notes)

Multiple sticky notes provide important documentation and setup instructions for:

- Blooio HTTP Request node configuration  
- Sample webhook payloads for new and updated messages  
- Setup instructions for Blooio API token and webhook mapping  
- Image downloader explanation  
- Workflow architecture screenshot link

---

### 3. Summary Table

| Node Name                 | Node Type                       | Functional Role                              | Input Node(s)                      | Output Node(s)                 | Sticky Note                                                                                                      |
|---------------------------|--------------------------------|----------------------------------------------|----------------------------------|-------------------------------|------------------------------------------------------------------------------------------------------------------|
| Receive Message (From Blooio) | Webhook                      | Entry point; receives iMessage events        | (External HTTP request)           | Don't respond to yourself       |                                                                                                                  |
| Don't respond to yourself  | If                             | Filters out bot’s own messages                | Receive Message (From Blooio)     | If has images, download them    |                                                                                                                  |
| If has images, download them | If                            | Checks if message has attachments             | Don't respond to yourself         | Code, AI Agent                 |                                                                                                                  |
| Code                      | Code                           | Extract attachment URLs                        | If has images, download them      | Loop Over Items                |                                                                                                                  |
| Loop Over Items            | SplitInBatches                 | Iterates over each attachment URL             | Code                             | HTTP Request, AI Agent         |                                                                                                                  |
| HTTP Request              | HTTP Request                   | Downloads each image from URL                  | Loop Over Items                  | Loop Over Items (for AI Agent) | Sticky Note: Detailed Blooio HTTP Request node setup instructions included                                        |
| AI Agent                 | LangChain Agent                | Core AI tarot reading with text and image     | Loop Over Items, If no images branch | Aggregate                    |                                                                                                                  |
| Postgres Chat Memory       | LangChain Memory Postgres      | Maintains conversation context                 | AI Agent                        | AI Agent                      |                                                                                                                  |
| OpenAI Chat Model          | OpenAI GPT-4.1-mini            | Provides language model to AI Agent            | AI Agent                        | AI Agent                      |                                                                                                                  |
| Aggregate                 | Aggregate                      | Aggregates AI Agent outputs                     | AI Agent                       | AI Agent1                     |                                                                                                                  |
| AI Agent1                | LangChain Agent                | Summarizes aggregated AI output for messaging | Aggregate                      | Send Message                  |                                                                                                                  |
| OpenAI Chat Model1         | OpenAI GPT-4.1-mini            | Provides language model to summary AI Agent    | AI Agent1                      | AI Agent1                     |                                                                                                                  |
| Send Message              | HTTP Request                   | Sends tarot reading back via Blooio API        | AI Agent1                      |                               | Sticky Note: Blooio API token must be configured here as Bearer token                                            |
| Sticky Note               | Sticky Note                   | Documentation and setup instructions           | -                               | -                             | Includes Blooio API setup, webhook payload examples, image downloader explanation, and workflow architecture link |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node: "Receive Message (From Blooio)"**  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: `tarot-ai`  
   - Purpose: Receives incoming message JSON from Blooio. No authentication required.  

2. **Add If Node: "Don't respond to yourself"**  
   - Type: If  
   - Condition: `{{$json["body"]["message"]["selfMessage"]}} == false`  
   - Connect Webhook main output to this node’s input.  
   - Purpose: Skip messages sent by the bot itself.  

3. **Add If Node: "If has images, download them"**  
   - Type: If  
   - Condition: Check if `{{$json["body"]["message"]["attachments"].length}} > 0`  
   - Connect “Don't respond to yourself” true output to this node.  

4. **Add Code Node: "Code"**  
   - Type: Code  
   - JavaScript: Extract attachment URLs from incoming message attachments.  
   ```js
   let output = [];
   for (const item of $input.first().json.body.message.attachments) {
     output.push({ json: { url: item.url } });
   }
   return output;
   ```  
   - Connect “If has images” true output to this node.  

5. **Add SplitInBatches Node: "Loop Over Items"**  
   - Type: SplitInBatches  
   - Connect Code node output to this node.  

6. **Add HTTP Request Node: "HTTP Request"**  
   - Type: HTTP Request  
   - Method: GET (default)  
   - URL: Expression `{{$json.url}}` (from current batch item)  
   - Connect SplitInBatches main output to this node.  

7. **Add AI Agent Node: "AI Agent"**  
   - Type: LangChain Agent  
   - Text input: Expression:  
     `=User message: {{$json.body.message.content}}`  
   - Enable passthrough binary images.  
   - Paste system prompt exactly as in original node for tarot reading, including identity, mission, protocol, onboarding, error handling.  
   - Connect:  
     - From HTTP Request node (for images)  
     - From “If has images” false branch (directly if no images)  
   - Connect SplitInBatches or “If has images” no output to AI Agent (for text-only messages).  

8. **Add Postgres Chat Memory Node: "Postgres Chat Memory"**  
   - Type: LangChain Postgres Chat Memory  
   - Table: `n8n_tarot_ai`  
   - Session Key: Expression `{{$json.body.message.conversation.id}}`  
   - Context Window: 200 tokens  
   - Connect AI Agent node memory input to this node.  

9. **Add OpenAI Chat Model Node: "OpenAI Chat Model"**  
   - Type: OpenAI GPT-4.1-mini  
   - Connect as AI language model for AI Agent node.  
   - Use OpenAI API credentials configured with valid key.  

10. **Add Aggregate Node: "Aggregate"**  
    - Type: Aggregate  
    - Operation: aggregateAllItemData  
    - Connect AI Agent output to Aggregate node.  

11. **Add AI Agent Node: "AI Agent1" (Summary)**  
    - Type: LangChain Agent  
    - Text input: Expression `{{$json.data.toJsonString()}}`  
    - System prompt: Summarize messages for user without framing text like “here’s the summary.”  
    - Connect Aggregate node output to this node.  

12. **Add OpenAI Chat Model Node: "OpenAI Chat Model1"**  
    - Type: OpenAI GPT-4.1-mini  
    - Connect as AI language model for AI Agent1 node.  

13. **Add HTTP Request Node: "Send Message"**  
    - Type: HTTP Request  
    - Method: POST  
    - URL: `https://api.blooio.com/send-message`  
    - Body Content Type: JSON (application/json)  
    - Headers:  
      - Accept: application/json  
      - Authorization: Bearer YOUR_BLOOIO_API_TOKEN (set via HTTP Bearer Auth credential)  
      - Content-Type: application/json  
    - Body Parameters:  
      - identifier: Expression `{{$json.body.message.sender}}`  
      - message: Expression `{{$json.output}}` (from AI Agent1 output)  
    - Connect AI Agent1 output to this node.  

14. **Credential Setup:**  
    - Configure Blooio Bearer Auth credential with API token for Send Message node.  
    - Configure OpenAI API key credential for OpenAI Chat Model nodes.  
    - Configure Postgres credential for Neon instance for Postgres Chat Memory node.

15. **Testing:**  
    - Map Blooio phone number to the webhook path `/tarot-ai` in Blooio dashboard.  
    - Send “Hi” or “Draw a card for me” to trigger onboarding reading.  
    - Send tarot card images with questions to test AI visual and textual interpretation.  

---

### 5. General Notes & Resources

| Note Content                                                                                                                      | Context or Link                                                   |
|-----------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| Detailed Blooio.com HTTP Request node setup instructions included as sticky note explaining required headers and body parameters. | Blooio HTTP Request node configuration.                          |
| Sample JSON payloads for "new-message" and "updated-message" webhook events illustrating message structure and attachments.      | Blooio webhook message examples.                                 |
| Setup instructions for Blooio API token acquisition, webhook mapping, and onboarding message examples.                           | Blooio API and webhook setup guide sticky note.                  |
| Image downloader explanation sticky note describing logic to extract and download attachments.                                    | Image handling block documentation.                              |
| Workflow architecture screenshot showing node layout and connections: ![Description](https://i.imgur.com/UgEluxE.png)             | Visual reference for overall workflow structure.                 |

---

**Disclaimer:** The provided text and workflow are solely derived from an n8n automation setup. All data processed is legal and public, and the workflow complies with current content policies. No illegal or offensive content is involved.