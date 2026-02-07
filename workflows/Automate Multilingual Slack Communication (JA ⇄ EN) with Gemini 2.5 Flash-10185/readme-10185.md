Automate Multilingual Slack Communication (JA ⇄ EN) with Gemini 2.5 Flash

https://n8nworkflows.xyz/workflows/automate-multilingual-slack-communication--ja---en--with-gemini-2-5-flash-10185


# Automate Multilingual Slack Communication (JA ⇄ EN) with Gemini 2.5 Flash

### 1. Workflow Overview

This workflow, named **Slack Multilingual Assistant with Gemini 2.5 Flash**, automates bilingual communication in Slack channels by translating messages between Japanese and English using Google’s Gemini 2.5 Flash language model. It supports three main Slack interaction modes:

- **1.1 Slash Command (/trans):** Users issue `/trans <text>` to receive a bilingual formatted translation post publicly in the channel.
- **1.2 Mention Command (@trans):** When users mention the bot with `@trans` in a thread, it replies in the thread with the translation only.
- **1.3 Reaction Trigger (🇯🇵 or 🇺🇸 emoji):** Users add specific flag reactions to messages, triggering a private translation reply in the thread for the reactor.

The workflow is logically divided into blocks for input reception, event parsing, language model processing, formatting output for Slack, and posting responses. All translation requests share the same Gemini 2.5 Flash core model configured to detect source language automatically and translate to the opposite language (JA⇄EN).

---

### 2. Block-by-Block Analysis

---

#### 2.1 Input Reception and Initial Acknowledgment

**Overview:**  
Receives Slack inputs via webhooks for slash commands and mention/reaction events, immediately acknowledges Slack to confirm receipt and avoid timeouts.

**Nodes Involved:**  
- Webhook (Slack /trans)  
- Ack (Respond to Slack)  
- Webhook (Slack @trans + reaction)  
- Ack Mention Event  
- Ack Reaction Event

**Node Details:**

- **Webhook (Slack /trans)**  
  - Type: Webhook (HTTP POST endpoint)  
  - Purpose: Receive `/trans` slash command payloads at `/slack/trans`  
  - Responds immediately with `Ack (Respond to Slack)` node returning HTTP 200 and text “Translating...” to Slack.  
  - Input: Slack slash command POST  
  - Output: Passes payload to parsing node

- **Ack (Respond to Slack)**  
  - Type: Respond to Webhook  
  - Sends instant HTTP 200 with content-type `text/plain; charset=utf-8`  
  - Responds with static text "Translating..." to slash command

- **Webhook (Slack @trans + reaction)**  
  - Type: Webhook  
  - Receives Slack events for mentions (`app_mention`) and reactions (`reaction_added`) at `/slack/mention`  
  - Immediately acknowledges with either `Ack Mention Event` or `Ack Reaction Event` depending on event type

- **Ack Mention Event**  
  - Type: Respond to Webhook  
  - Responds with JSON `{ "ok": true }` or Slack’s challenge token if present  
  - Confirms receipt of app_mention events

- **Ack Reaction Event**  
  - Type: Respond to Webhook  
  - Responds similarly with JSON `{ "ok": true }` or Slack challenge token  
  - Confirms receipt of reaction_added events

**Edge Cases / Failure Types:**  
- Webhook misconfiguration or missing webhook IDs will cause Slack to reject requests  
- Immediate acknowledgments prevent Slack timeout errors  
- Slack challenge verification handled by Ack Mention and Ack Reaction nodes to establish event subscriptions  

---

#### 2.2 Parsing Incoming Slack Payloads

**Overview:**  
Extracts relevant information such as text to translate, user IDs, channels, and thread timestamps from the raw Slack payloads for each input mode.

**Nodes Involved:**  
- Parse Slash Payload  
- Parse Mention Event  
- Parse Reaction Event  
- Detect Slack Event Type  
- Route by Event Type  
- Filter Reaction Type  
- Prep Reaction Translation Input  
- Skip Reaction When No Message Found

**Node Details:**

- **Parse Slash Payload**  
  - Type: Code  
  - Extracts `text`, `response_url`, `user_id`, `user_name` from slash command payload  
  - Outputs JSON with these fields for translation processing

- **Parse Mention Event**  
  - Type: Code  
  - Parses `app_mention` event JSON  
  - Strips bot mention and `@trans` from message text to isolate text to translate  
  - Extracts channel, user ID, and thread timestamp (either thread_ts or ts)  
  - Outputs structured JSON for translation input

- **Parse Reaction Event**  
  - Type: Code  
  - Parses `reaction_added` event JSON  
  - Extracts reactor user, reaction emoji, channel, message timestamp  
  - Normalizes Slack webhook payload variations (payload in `body` or root)  
  - Outputs reaction event data

- **Detect Slack Event Type**  
  - Type: Code  
  - Identifies event type (`app_mention` or `reaction_added`) from incoming payload  
  - Outputs `event_type` and full event JSON

- **Route by Event Type**  
  - Type: Switch  
  - Routes flow based on `event_type` field: `app_mention` or `reaction_added`

- **Filter Reaction Type**  
  - Type: Code  
  - Allows only reactions related to Japanese or US flags (`jp`, `us` substrings)  
  - Skips irrelevant reactions by setting `skip: true`

- **Fetch Original Message**  
  - Type: HTTP Request  
  - Calls Slack API `conversations.replies` to retrieve original message text for reaction translation  
  - Authenticated with Slack Bot Token in header

- **Prep Reaction Translation Input**  
  - Type: Code  
  - Validates Slack API response  
  - Extracts original message text, channel, and thread timestamp  
  - Flags skip when message not found (to prevent unnecessary translation)

- **Skip Reaction When No Message Found**  
  - Type: If node  
  - Checks if skip flag is set or text to translate is empty  
  - Stops flow if no valid text to translate

**Edge Cases / Failure Types:**  
- Slash command missing `text` parameter results in empty translation input  
- Reaction events without matching emoji skip translation  
- Slack API failures or no messages returned cause skip flag to prevent downstream errors  
- Malformed payloads may cause expression or parsing errors

---

#### 2.3 Translation Processing (Google Gemini 2.5 Flash Core)

**Overview:**  
Invokes the Google Gemini 2.5 Flash language model with a prompt to automatically detect input language (Japanese or English) and translate to the opposite language, returning both original and translated text.

**Nodes Involved:**  
- Google Gemini Chat Model  
- Basic LLM Chain (/trans)  
- Basic LLM Chain (@trans)  
- Basic LLM Chain (reaction)

**Node Details:**

- **Google Gemini Chat Model**  
  - Type: Langchain Google Gemini 2.5 Flash LM node  
  - Shared core model used by all three LLM chains  
  - Temperature set to 0.2 for stable translations  
  - Max output tokens 1024  
  - Requires Google Palm API credentials configured in n8n

- **Basic LLM Chain (/trans)**  
  - Type: Langchain LLM Chain  
  - Prompt instructs Gemini to detect input language and provide output in two labeled blocks: `[Original]` and `[Translation]`  
  - Used for slash command translation  
  - Input text from `textToTranslate` or fallback to `text` JSON keys

- **Basic LLM Chain (@trans)**  
  - Same configuration and prompt as `/trans` version  
  - Used for mention-triggered translation in threads

- **Basic LLM Chain (reaction)**  
  - Same configuration and prompt as above  
  - Used for reaction-triggered translation replies

**Edge Cases / Failure Types:**  
- API authentication failure or quota exceeded errors possible  
- Timeout or partial responses due to token limits or network issues  
- Expression failures if input text is missing or malformed  
- Model output not following exact output format expected (missing labels)

---

#### 2.4 Formatting Translation Output for Slack

**Overview:**  
Transforms raw Gemini model output into Slack-formatted messages tailored per interaction mode, e.g., bilingual block for slash command, translation only for threads.

**Nodes Involved:**  
- Format Slack Message (/trans)  
- Format Slack Message (@trans)  
- Format Slack Message (reaction)

**Node Details:**

- **Format Slack Message (/trans)**  
  - Type: Code  
  - Parses Gemini output to extract `[Original]` and `[Translation]` sections  
  - Formats as a bilingual message:  
    ```
    【from @user】
    (Original text)
    ----------
    (Translation text)
    ```  
  - Includes Slack user mention of original sender  
  - Output includes `response_url` for posting reply

- **Format Slack Message (@trans)**  
  - Type: Code  
  - Extracts only the translation portion from Gemini output  
  - Removes `[Original]` and `[Translation]` labels  
  - Prepares message JSON with channel, thread_ts, and text for Slack threaded reply

- **Format Slack Message (reaction)**  
  - Similar to `@trans` formatter, returns translation only for thread reply with channel and thread_ts

**Edge Cases / Failure Types:**  
- Missing `[Original]` or `[Translation]` blocks in Gemini output handled by fallback to entire output as translation  
- Missing user ID or username causes fallback mention text  
- Empty or malformed Gemini output leads to blank messages  
- Slack formatting errors if message fields missing or incorrectly typed

---

#### 2.5 Posting Translated Messages Back to Slack

**Overview:**  
Sends formatted translated messages back to Slack via either response_url or Slack API chat.postMessage, depending on interaction mode.

**Nodes Involved:**  
- Post to Slack (response_url)  
- Post to Slack (@trans reply)  
- Post to Slack (reaction reply)

**Node Details:**

- **Post to Slack (response_url)**  
  - Type: HTTP Request  
  - Uses Slack-provided `response_url` from slash command payload to send an in-channel message  
  - Posts JSON body with `response_type: in_channel` and formatted bilingual message text  
  - Content-Type: `application/json; charset=utf-8`

- **Post to Slack (@trans reply)**  
  - Type: HTTP Request  
  - Calls Slack API `chat.postMessage` to post translation reply in thread  
  - Requires Bot OAuth token in Authorization header  
  - Posts to channel/thread_ts with translation text

- **Post to Slack (reaction reply)**  
  - Same as `@trans reply` but triggered by reaction translation flow

**Edge Cases / Failure Types:**  
- Slack API `invalid_auth` errors if token missing/expired  
- `missing_scope` errors if Bot lacks chat:write or channel history permissions  
- Rate limiting or message posting failures  
- Response_url expiration or invalidity causes posting failure

---

### 3. Summary Table

| Node Name                      | Node Type                                   | Functional Role                                    | Input Node(s)                    | Output Node(s)                             | Sticky Note                                                                                           |
|-------------------------------|---------------------------------------------|---------------------------------------------------|---------------------------------|-------------------------------------------|-----------------------------------------------------------------------------------------------------|
| Webhook (Slack /trans)         | Webhook                                     | Receives `/trans` slash command                    | —                               | Ack (Respond to Slack), Parse Slash Payload |                                                                                                     |
| Ack (Respond to Slack)         | Respond to Webhook                          | Immediate 200 response to `/trans` command        | Webhook (Slack /trans)           | —                                         |                                                                                                     |
| Parse Slash Payload            | Code                                        | Extracts text and metadata from slash payload     | Ack (Respond to Slack)           | Basic LLM Chain (/trans)                   |                                                                                                     |
| Webhook (Slack @trans + reaction) | Webhook                                 | Receives Slack `app_mention` and `reaction_added` events | —                               | Detect Slack Event Type                    |                                                                                                     |
| Ack Mention Event              | Respond to Webhook                          | Acknowledge app_mention event                      | Detect Slack Event Type          | —                                         |                                                                                                     |
| Ack Reaction Event             | Respond to Webhook                          | Acknowledge reaction_added event                   | Detect Slack Event Type          | —                                         |                                                                                                     |
| Detect Slack Event Type        | Code                                        | Identifies event type from payload                 | Webhook (Slack @trans + reaction) | Route by Event Type                        |                                                                                                     |
| Route by Event Type            | Switch                                      | Routes flow by event type: mention or reaction    | Detect Slack Event Type          | Ack Mention Event, Parse Mention Event, Ack Reaction Event, Parse Reaction Event |                                                                                                     |
| Parse Mention Event            | Code                                        | Parses app_mention event to extract text and context | Route by Event Type              | Basic LLM Chain (@trans)                   |                                                                                                     |
| Parse Reaction Event           | Code                                        | Parses reaction_added event                         | Route by Event Type              | Filter Reaction Type                       |                                                                                                     |
| Filter Reaction Type           | Code                                        | Filters reactions to only Japanese/US flags       | Parse Reaction Event             | Fetch Original Message                     |                                                                                                     |
| Fetch Original Message         | HTTP Request                                | Fetches original Slack message for reaction       | Filter Reaction Type             | Prep Reaction Translation Input           |                                                                                                     |
| Prep Reaction Translation Input| Code                                        | Prepares text for translation from fetched message| Fetch Original Message           | Skip Reaction When No Message Found        |                                                                                                     |
| Skip Reaction When No Message Found | If                                    | Skips flow if no valid message to translate       | Prep Reaction Translation Input | Basic LLM Chain (reaction)                 |                                                                                                     |
| Google Gemini Chat Model       | Langchain LLM Model                         | Core translation engine for all modes              | — (called by LLM Chains)         | Basic LLM Chain (/trans), Basic LLM Chain (@trans), Basic LLM Chain (reaction) |                                                                                                     |
| Basic LLM Chain (/trans)       | Langchain LLM Chain                         | Runs Gemini prompt for `/trans` translation        | Parse Slash Payload              | Format Slack Message (/trans)              |                                                                                                     |
| Basic LLM Chain (@trans)       | Langchain LLM Chain                         | Runs Gemini prompt for `@trans` mention translation| Parse Mention Event              | Format Slack Message (@trans)              |                                                                                                     |
| Basic LLM Chain (reaction)     | Langchain LLM Chain                         | Runs Gemini prompt for reaction translation        | Skip Reaction When No Message Found | Format Slack Message (reaction)            |                                                                                                     |
| Format Slack Message (/trans)  | Code                                        | Formats bilingual message for slash command reply | Basic LLM Chain (/trans)         | Post to Slack (response_url)               |                                                                                                     |
| Format Slack Message (@trans)  | Code                                        | Formats translation only for mention thread reply | Basic LLM Chain (@trans)         | Post to Slack (@trans reply)               |                                                                                                     |
| Format Slack Message (reaction)| Code                                        | Formats translation only for reaction thread reply| Basic LLM Chain (reaction)       | Post to Slack (reaction reply)             |                                                                                                     |
| Post to Slack (response_url)   | HTTP Request                                | Posts bilingual translation message via response_url | Format Slack Message (/trans)    | —                                         |                                                                                                     |
| Post to Slack (@trans reply)   | HTTP Request                                | Posts thread reply message for mention translation | Format Slack Message (@trans)    | —                                         |                                                                                                     |
| Post to Slack (reaction reply) | HTTP Request                                | Posts thread reply message for reaction translation| Format Slack Message (reaction)  | —                                         |                                                                                                     |
| How to set up                  | Sticky Note                                 | Setup instructions and overview                    | —                               | —                                         | Slack Multilingual Assistant (Gemini 2.5 Flash) - Three translation modes unified in one workflow     |
| Sticky Note                   | Sticky Note                                 | Slack App creation and configuration instructions | —                               | —                                         | Detailed stepwise Slack app setup instructions including scopes, events, and tokens                  |
| Sticky Note1                  | Sticky Note                                 | Workflow architecture summary                       | —                               | —                                         | Explains webhook endpoints, LM core, logic, and output modes                                         |
| Sticky Note2                  | Sticky Note                                 | Common errors and fixes                              | —                               | —                                         | Lists typical Slack API errors and recommended fixes                                                 |
| Sticky Note3                  | Sticky Note                                 | Validation checklist                                | —                               | —                                         | Confirms activation and successful integration checks                                               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Slack App and Configure:**

   - Create a Slack App named “TransBot” in your workspace.
   - Add Bot Token Scopes: `commands`, `chat:write`, `app_mentions:read`, `reactions:read`, `channels:history`, and optionally `groups:history`.
   - Enable Event Subscriptions:
     - Set Request URL to `https://<your-n8n-domain>/webhook/slack/mention`
     - Subscribe to Bot Events: `app_mention`, `message.channels`
     - Subscribe to User Events: `reaction_added`
   - Create Slash Command `/trans`:
     - Request URL: `https://<your-n8n-domain>/webhook/slack/trans`
     - Short description: “Translate text JA⇄EN with Gemini 2.5 Flash”
   - Install or reinstall the app and copy the Bot User OAuth Token.

2. **Create Webhook Nodes:**

   - `Webhook (Slack /trans)`:
     - HTTP Method: POST
     - Path: `slack/trans`
     - Response Mode: Response Node
   - `Webhook (Slack @trans + reaction)`:
     - HTTP Method: POST
     - Path: `slack/mention`
     - Response Mode: Response Node

3. **Add Immediate Acknowledgment Nodes:**

   - `Ack (Respond to Slack)`:
     - Respond with HTTP 200, Content-Type `text/plain; charset=utf-8`
     - Response Body: `Translating...`
     - Connect from `Webhook (Slack /trans)`
   - `Ack Mention Event` and `Ack Reaction Event`:
     - Respond with HTTP 200, Content-Type `application/json; charset=utf-8`
     - Response Body: `{{ $json.body && $json.body.challenge ? {"challenge": $json.body.challenge} : {"ok": true} }}`
     - Connect from `Route by Event Type` based on event type

4. **Parse Incoming Payloads:**

   - `Parse Slash Payload` (Code):
     - Extract `text`, `response_url`, `user_id`, `user_name` from slash command payload
     - Connect from `Ack (Respond to Slack)`

   - `Detect Slack Event Type` (Code):
     - Extract `event_type` and `event` from webhook body
     - Connect from `Webhook (Slack @trans + reaction)`

   - `Route by Event Type` (Switch):
     - Routes by `event_type`: `app_mention` or `reaction_added`
     - Connect from `Detect Slack Event Type`

   - `Parse Mention Event` (Code):
     - Remove bot mention and `@trans` from `app_mention` text
     - Extract `textToTranslate`, `channel`, `thread_ts`, `user_id`
     - Connect from `Route by Event Type` (app_mention branch)

   - `Parse Reaction Event` (Code):
     - Extract reaction details: user, reaction, channel, message timestamp
     - Connect from `Route by Event Type` (reaction_added branch)

   - `Filter Reaction Type` (Code):
     - Allow only reactions containing `jp` or `us` substrings
     - Connect from `Parse Reaction Event`

   - `Fetch Original Message` (HTTP Request):
     - URL: `https://slack.com/api/conversations.replies?channel={{$json.channel}}&ts={{$json.message_ts}}&limit=1`
     - Authorization header: `Bearer YOUR_TOKEN_HERE`
     - Connect from `Filter Reaction Type`

   - `Prep Reaction Translation Input` (Code):
     - Extract original message text and prepare translation input
     - Connect from `Fetch Original Message`

   - `Skip Reaction When No Message Found` (If):
     - Condition: Skip if `skip` is true or `textToTranslate` is empty
     - Connect from `Prep Reaction Translation Input`

5. **Configure Google Gemini 2.5 Flash Model:**

   - Add `Google Gemini Chat Model` node:
     - Temperature: 0.2
     - Max Output Tokens: 1024
     - Connect as AI language model credential node for all LLM Chains
     - Credentials: Google Palm API account configured in n8n

6. **Create LLM Chain Nodes:**

   - For `/trans`:
     - `Basic LLM Chain (/trans)` with prompt to detect language and translate (bilingual output)
     - Connect input from `Parse Slash Payload`
     - Connect AI model input to `Google Gemini Chat Model`

   - For `@trans`:
     - `Basic LLM Chain (@trans)` with same prompt as above
     - Connect input from `Parse Mention Event`
     - Connect AI model input to `Google Gemini Chat Model`

   - For Reaction:
     - `Basic LLM Chain (reaction)` with same prompt
     - Connect input from `Skip Reaction When No Message Found`
     - Connect AI model input to `Google Gemini Chat Model`

7. **Format Slack Messages:**

   - `/trans` Formatter (`Format Slack Message (/trans)`):
     - Parse Gemini output for `[Original]` and `[Translation]`
     - Format bilingual message with user mention and line separator
     - Connect from `Basic LLM Chain (/trans)`

   - `@trans` Formatter (`Format Slack Message (@trans)`):
     - Extract translation only, remove labels
     - Prepare channel, thread_ts, text fields for threaded reply
     - Connect from `Basic LLM Chain (@trans)`

   - Reaction Formatter (`Format Slack Message (reaction)`):
     - Same as `@trans` formatter
     - Connect from `Basic LLM Chain (reaction)`

8. **Post Messages Back to Slack:**

   - `/trans` Poster (`Post to Slack (response_url)`):
     - POST to `response_url` from slash command
     - Body parameters: `response_type: in_channel`, `text` with formatted bilingual message
     - Content-Type: application/json
     - Connect from `Format Slack Message (/trans)`

   - `@trans` Poster (`Post to Slack (@trans reply)`):
     - POST to Slack API `chat.postMessage`
     - Body parameters: `channel`, `text`, `thread_ts`
     - Authorization header with Bot token
     - Connect from `Format Slack Message (@trans)`

   - Reaction Poster (`Post to Slack (reaction reply)`):
     - Same as above but triggered by reaction flow
     - Connect from `Format Slack Message (reaction)`

9. **Set Credentials and Tokens:**

   - Configure Google Palm API credentials in n8n for Gemini 2.5 Flash node
   - Set Slack Bot OAuth token in HTTP Request headers (`Authorization: Bearer YOUR_TOKEN_HERE`)
   - Replace webhook IDs in webhook nodes with actual n8n webhook IDs

10. **Test Workflow:**

    - Test `/trans` command with Japanese and English text
    - Test mention `@trans` in thread reply
    - Test adding 🇯🇵 or 🇺🇸 reactions to messages to trigger reaction translation
    - Confirm Slack messages appear as formatted and expected

---

### 5. General Notes & Resources

| Note Content                                                                                                                                | Context or Link                                                                                  |
|---------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Slack Multilingual Assistant (Gemini 2.5 Flash) supports unified translation modes: slash command, mention thread, and reaction triggers.  | Sticky Note "How to set up"                                                                     |
| Create and configure Slack App 'TransBot' with proper scopes, event subscriptions, and slash commands as detailed in setup instructions. | Sticky Note with detailed Slack app creation steps                                              |
| Workflow architecture explained: shared Gemini core, input webhooks, routing by event, formatting, and posting.                           | Sticky Note "Workflow Architecture"                                                            |
| Common Slack API errors include `invalid_auth`, `missing_scope`, and no message found in reaction event; fixes are documented.             | Sticky Note "Common Errors & Fixes"                                                            |
| Validation checklist ensures Slack event subscriptions verified, correct scopes assigned, and all three translation modes function well.  | Sticky Note "Validation checklist"                                                             |
| Use latest Bot Token (xoxb-...) and invite bot to channels with `/invite @TransBot` for proper operation.                                   | Sticky Note "How to set up" instructions                                                       |
| Gemini 2.5 Flash model prompt requires exact output format to parse translations correctly; monitor for changes in model response style.   | General note for maintaining prompt and parser code                                            |

---

**Disclaimer:** The provided description and analysis are based exclusively on an n8n automated workflow. The workflow respects all content policies and processes only legal and public data.