AI Lyrics Study Bot for Telegram — Translation, Summary, Vocabulary

https://n8nworkflows.xyz/workflows/ai-lyrics-study-bot-for-telegram---translation--summary--vocabulary-7195


# AI Lyrics Study Bot for Telegram — Translation, Summary, Vocabulary

### 1. Workflow Overview

This workflow implements a Telegram bot specialized in analyzing song lyrics. It accepts commands with a song lyrics URL, downloads and cleans the lyrics text from the URL, then uses OpenAI’s language models to perform various types of linguistic and literary analyses. The results are sent back to the user on Telegram in MarkdownV2 format.

The workflow is logically divided into the following blocks:

- **1.1 Trigger & Input Reception:**  
  Listens for incoming Telegram messages via a webhook, filters valid text messages, and extracts chat context.

- **1.2 Command Routing & Validation:**  
  Routes messages based on command prefixes using IF and Switch nodes; validates commands and presence of required URL parameter.

- **1.3 URL Extraction & Content Retrieval (ETL):**  
  Extracts the URL from the command text, downloads the webpage, and cleans the HTML content to produce plain lyrics text.

- **1.4 AI Processing:**  
  Sends the cleaned lyrics text to OpenAI’s Chat API with prompts tailored to the requested analysis type (translation, interpretation, study, summary, vocabulary, poetic analysis, or start message).

- **1.5 Response Delivery:**  
  Sends the AI-generated text back to the user on Telegram, applying MarkdownV2 formatting and handling errors or unsupported commands gracefully.

- **1.6 Error Handling:**  
  Provides user-friendly messages for unsupported commands or incomplete/invalid inputs.

---

### 2. Block-by-Block Analysis

#### 2.1 Trigger & Input Reception

- **Overview:**  
  Receives Telegram messages via webhook, filters out non-text messages, and sets essential parameters such as chat ID and AI model settings.

- **Nodes Involved:**  
  - Webhook que recebe as mensagens  
  - Message_Filter  
  - Settings  
  - No Operation, do nothing

- **Node Details:**

  - **Webhook que recebe as mensagens**  
    - Type: Webhook  
    - Role: Entry point receiving POST updates from Telegram bot webhook  
    - Config: HTTP POST on path `/lyrics-bot`  
    - Input: Incoming Telegram update JSON  
    - Output: Raw Telegram update JSON  
    - Edge Cases: Webhook must be accessible publicly; Telegram token must be valid.

  - **Message_Filter**  
    - Type: IF  
    - Role: Ensures the update contains a message with text (`$json.body.message.text !== undefined`)  
    - Config: Boolean condition on message text existence  
    - Input: Telegram update JSON  
    - Output: Routes valid text messages forward; others to No Operation node  
    - Edge Cases: Prevents workflow from processing non-text updates.

  - **Settings**  
    - Type: Set  
    - Role: Extracts and sets variables for downstream nodes: model temperature (0.8), token length (4096), and chat_id from Telegram message  
    - Config: Values set with expressions reading from incoming JSON  
    - Input: Filtered Telegram message JSON  
    - Output: JSON containing parameters for AI and Telegram nodes  
    - Edge Cases: If chat_id missing, downstream nodes may fail.

  - **No Operation, do nothing**  
    - Type: NoOp  
    - Role: Terminates flow for non-text messages  
    - Input: Telegram update JSON failing Message_Filter  
    - Output: None

#### 2.2 Command Routing & Validation

- **Overview:**  
  Determines which command was sent and routes accordingly. Recognizes `/start` command separately; other commands routed via Switch. Handles unsupported commands by sending error message.

- **Nodes Involved:**  
  - If  
  - Switch  
  - Send error message

- **Node Details:**

  - **If**  
    - Type: IF  
    - Role: Detects if the message text equals `/start`  
    - Config: String equality check on message text  
    - Input: Settings node output (with chat_id and message)  
    - Output: `/start` path or other commands path  
    - Edge Cases: Case sensitive check; user must send exactly `/start`.

  - **Switch**  
    - Type: Switch (startsWith)  
    - Role: Checks if message text starts with one of the supported commands:  
      `/get_lyrics`, `/interpret_lyrics`, `/study_lyrics`, `/summarize_lyrics`, `/vocabulary_lyrics`, `/lyrics_poetic_analysis`  
    - Config: StartsWith condition on message text for each command; fallback to unsupported command  
    - Input: Non-`/start` messages  
    - Output: One of six nodes corresponding to commands, or fallback error node  
    - Edge Cases: Commands must be at start of message; trailing spaces allowed; unknown commands trigger fallback.

  - **Send error message**  
    - Type: Telegram  
    - Role: Sends error message for unsupported commands  
    - Config: Text explains that command is not supported, suggests `/start` and usage examples; uses MarkdownV2 parse mode  
    - Input: Switch fallback output  
    - Output: Telegram message to user  
    - Edge Cases: Chat_id must exist; message length within Telegram limits.

#### 2.3 URL Extraction & Content Retrieval (ETL)

- **Overview:**  
  Extracts URL parameter from command text, validates presence, downloads webpage, and cleans HTML to plain text lyrics.

- **Nodes Involved:**  
  - Extract_URL  
  - If1  
  - Download_URL  
  - CleanUp  
  - Incomplete_Command

- **Node Details:**

  - **Extract_URL**  
    - Type: Code  
    - Role: Splits the incoming message text by space and extracts the second part as URL  
    - Config: JS code reads `$json.body.message.text`, splits on space, returns `parts[1]` as `url`  
    - Input: Message JSON from Switch output  
    - Output: JSON with `url` field  
    - Edge Cases: Command without URL leads to empty `url`.

  - **If1**  
    - Type: IF  
    - Role: Checks if extracted `url` is not empty  
    - Config: String notEmpty condition on `$json.url`  
    - Input: Extract_URL output  
    - Output: Forward to Download_URL if URL present; else route to Incomplete_Command  
    - Edge Cases: Empty or malformed URL triggers incomplete command response.

  - **Download_URL**  
    - Type: HTTP Request  
    - Role: Downloads content from the extracted URL  
    - Config: URL set from `{{$json.url}}`  
    - Input: Valid URL from If1  
    - Output: Raw HTML content in `data` field  
    - Edge Cases: Network errors, timeouts, redirects, non-200 HTTP responses. No explicit timeout configured but suggested in sticky note.

  - **CleanUp**  
    - Type: Code  
    - Role: Cleans raw HTML by removing comments, scripts, styles, meta tags, and all HTML tags; normalizes whitespace and line breaks  
    - Config: JS code with regex replacements to strip unwanted content; outputs `clean_text`, a 300-char preview, and length  
    - Input: HTML from Download_URL  
    - Output: Cleaned plain text lyrics  
    - Edge Cases: JS-heavy pages might yield little text; no fallback implemented.

  - **Incomplete_Command**  
    - Type: Telegram  
    - Role: Sends message informing user that command is incomplete or URL missing, with usage example  
    - Config: MarkdownV2 message with example `/get_lyrics` usage  
    - Input: If1 false branch  
    - Output: Telegram message to user  
    - Edge Cases: Requires valid chat_id.

#### 2.4 AI Processing

- **Overview:**  
  Sends cleaned lyrics text to OpenAI Chat with command-specific prompts to produce requested analyses or responses.

- **Nodes Involved:**  
  - /start  
  - /get_lyrics  
  - /interpret_lyrics  
  - /study_lyrics  
  - /summarize_lyrics  
  - /vocabulary_lyrics  
  - /lyrics_poetic_analysis

- **Node Details (common across all):**  
  - Type: OpenAI (Chat)  
  - Role: Uses OpenAI Chat API to generate text responses based on tailored system/user prompts  
  - Config:  
    - `maxTokens` from `Settings.token_length` (4096)  
    - `temperature` from `Settings.model_temperature` (0.8)  
    - Prompts contain instructions specific to command, referencing `{{$json.clean_text}}` or user name and language for `/start`  
  - Input: Cleaned lyrics text or message context  
  - Output: AI-generated text as response message  
  - Edge Cases:  
    - API errors, rate limits, or invalid credentials  
    - Long output truncation (controlled via maxTokens)  
    - Prompt variables must be properly escaped  
    - Language detection implicit in prompt for `/start`  
  - Sub-workflow: None

  - Specifics:

    - **/start:** Welcomes user by name and language code, explains bot usage and commands, formats message in MarkdownV2.

    - **/get_lyrics:** Returns original lyrics line-by-line with translations below each line, preserving idioms.

    - **/interpret_lyrics:** Provides emotional and symbolic interpretation, addressing feelings, central message, symbols.

    - **/study_lyrics:** Explains slang, idioms, figures of speech for language learners, organized in numbered lists or table.

    - **/summarize_lyrics:** Concise summary ≤ 5 sentences, highlights main themes or story.

    - **/vocabulary_lyrics:** Lists 5-15 relevant words/expressions with translations, definitions, and usage examples.

    - **/lyrics_poetic_analysis:** Identifies poetic devices (metaphors, rhymes, alliterations, etc.) with examples and explanations.

#### 2.5 Response Delivery

- **Overview:**  
  Sends the AI-generated or static reply messages back to the Telegram user with proper formatting and in the correct chat.

- **Nodes Involved:**  
  - Text reply (for all AI outputs and /start)  
  - Send error message (for unsupported commands)  
  - Incomplete_Command (for incomplete inputs)

- **Node Details:**

  - **Text reply**  
    - Type: Telegram  
    - Role: Sends the text content received from AI nodes or /start node back to the user  
    - Config:  
      - `chatId` from `Settings.chat_id`  
      - `text` from AI response or start message  
      - `parse_mode`: Markdown or MarkdownV2 (consistent with message type)  
    - Input: Output from AI nodes or /start node  
    - Output: Telegram message to user  
    - Edge Cases: Telegram message size limit (~4096 characters); if exceeded, splitting required (not explicitly handled here).

---

### 3. Summary Table

| Node Name                     | Node Type          | Functional Role                                      | Input Node(s)                                | Output Node(s)                                   | Sticky Note                                                                                      |
|-------------------------------|--------------------|----------------------------------------------------|----------------------------------------------|-------------------------------------------------|------------------------------------------------------------------------------------------------|
| Webhook que recebe as mensagens | Webhook            | Receives Telegram messages via webhook             | N/A                                          | Message_Filter                                  | Trigger & Intake (Webhook + Telegram): entry point, chat_id extraction                         |
| Message_Filter                 | IF                 | Filters updates with message text only              | Webhook que recebe as mensagens              | Settings, No Operation, do nothing              | Trigger & Intake: ensures message.text exists                                                  |
| Settings                      | Set                | Sets model parameters and chat_id                    | Message_Filter                               | If                                             | Settings & Credentials: model_temperature=0.8, token_length=4096, chat_id from message          |
| If                           | IF                 | Checks if message is `/start` command                | Settings                                     | /start, Extract_URL                             | Routing (If): detects `/start` command                                                        |
| /start                       | OpenAI Chat         | Generates welcome message                             | If                                           | Text reply                                      | AI Interaction (OpenAI Chat): welcome + usage tips                                            |
| Text reply                   | Telegram            | Sends Telegram message                               | /start, /get_lyrics, /interpret_lyrics, /study_lyrics, /summarize_lyrics, /vocabulary_lyrics, /lyrics_poetic_analysis | N/A                                 | Send to Telegram: chat_id from Settings, parse_mode MarkdownV2                                 |
| Extract_URL                  | Code                | Extracts URL from command text                        | If                                           | If1                                            | Download & Cleanup (ETL): extracts URL from `/command <URL>`                                   |
| If1                          | IF                 | Validates presence of URL                             | Extract_URL                                  | Download_URL, Incomplete_Command                | Error — Incomplete/Invalid Command: ensures URL present                                       |
| Download_URL                 | HTTP Request        | Downloads webpage content from URL                    | If1                                          | CleanUp                                         | Download & Cleanup: fetch lyrics page                                                         |
| CleanUp                      | Code                | Cleans HTML to plain text lyrics                      | Download_URL                                 | Switch                                          | Download & Cleanup: removes scripts, styles, tags, normalizes whitespace                      |
| Switch                       | Switch              | Routes based on command prefix                        | CleanUp                                       | /get_lyrics, /interpret_lyrics, /study_lyrics, /summarize_lyrics, /vocabulary_lyrics, /lyrics_poetic_analysis, Send error message | Routing (Switch): routes supported commands; fallback sends error message                     |
| /get_lyrics                  | OpenAI Chat         | Returns original lyrics with translations             | Switch                                       | Text reply                                      | AI Interaction: line-by-line translation                                                     |
| /interpret_lyrics            | OpenAI Chat         | Provides emotional and symbolic interpretation        | Switch                                       | Text reply                                      | AI Interaction: literary interpretation                                                      |
| /study_lyrics                | OpenAI Chat         | Explains idioms, slang, and figures of speech         | Switch                                       | Text reply                                      | AI Interaction: linguistic study                                                           |
| /summarize_lyrics            | OpenAI Chat         | Provides concise summary                               | Switch                                       | Text reply                                      | AI Interaction: summary ≤ 5 sentences                                                       |
| /vocabulary_lyrics           | OpenAI Chat         | Lists vocabulary items with definitions                | Switch                                       | Text reply                                      | AI Interaction: vocabulary acquisition                                                     |
| /lyrics_poetic_analysis      | OpenAI Chat         | Analyzes poetic and literary devices                   | Switch                                       | Text reply                                      | AI Interaction: poetic analysis                                                            |
| Send error message           | Telegram            | Sends message for unsupported commands                | Switch (fallback)                            | N/A                                             | Fallback for Unsupported Commands: friendly reply with valid commands list                   |
| Incomplete_Command           | Telegram            | Sends message for incomplete or invalid commands       | If1 (false)                                  | N/A                                             | Error — Incomplete/Invalid Command: usage guidance with examples                            |
| No Operation, do nothing     | NoOp                | Terminates flow for unsupported updates               | Message_Filter (false)                        | N/A                                             | Trigger & Intake: ignores non-text messages                                                |
| Sticky Note (various)        | StickyNote          | Documentation and tips                                | N/A                                          | N/A                                             | Multiple sticky notes provide in-workflow documentation and usage tips                      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Telegram Bot and Get Token:**  
   Use @BotFather to create a bot and obtain the token.

2. **Create OpenAI API Key:**  
   Obtain an OpenAI API key with access to Chat completions.

3. **Create Credentials in n8n:**  
   - Add Telegram API credentials with your bot token.  
   - Add OpenAI API credentials with your API key.

4. **Add Webhook Node:**  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: `lyrics-bot` (or your preferred path)  
   - This node receives Telegram updates.

5. **Add IF Node (Message_Filter):**  
   - Condition: Check if `{{$json.body.message.text}}` is defined (boolean true).  
   - True path continues; false path goes to No Operation node.

6. **Add No Operation Node:**  
   - Terminates flow for non-text messages.

7. **Add Set Node (Settings):**  
   - Set variables:  
     - `model_temperature` = 0.8  
     - `token_length` = 4096  
     - `chat_id` = `{{$json.body.message.chat.id}}`

8. **Add IF Node (If):**  
   - Condition: `{{$json.body.message.text}}` equals `/start` (string equals, case sensitive).  
   - True path to `/start` OpenAI node; false path to Extract_URL and Switch routing.

9. **Add OpenAI Node (/start):**  
   - Model: Chat completion  
   - Prompt: Welcome message using `{{$json.body.message.from.first_name}}` and `{{$json.body.message.from.language_code}}`.  
   - Temperature and maxTokens from Settings.  
   - Output connects to Telegram node for reply.

10. **Add Code Node (Extract_URL):**  
    - JS code: split message text on space, extract second part as URL.  
    - Output JSON contains `url`.

11. **Add IF Node (If1):**  
    - Check if `url` is not empty.  
    - True path to Download_URL; false path to Incomplete_Command Telegram node.

12. **Add Telegram Node (Incomplete_Command):**  
    - Sends message about incomplete command with usage example `/get_lyrics <URL>`.  
    - Uses MarkdownV2 parse mode.  
    - Uses `chat_id` from Settings.

13. **Add HTTP Request Node (Download_URL):**  
    - URL: `{{$json.url}}`  
    - Method: GET  
    - (Optional) Set timeout (e.g., 10 seconds), follow redirects, set User-Agent header.

14. **Add Code Node (CleanUp):**  
    - JS code to remove comments, scripts, styles, meta tags, and all HTML tags.  
    - Normalize whitespace and line breaks.  
    - Output fields: `clean_text`, `preview` (first 300 chars), `length`.

15. **Add Switch Node (Switch):**  
    - Route on message text’s command (startsWith):  
      `/get_lyrics` → `/get_lyrics` OpenAI node  
      `/interpret_lyrics` → `/interpret_lyrics` OpenAI node  
      `/study_lyrics` → `/study_lyrics` OpenAI node  
      `/summarize_lyrics` → `/summarize_lyrics` OpenAI node  
      `/vocabulary_lyrics` → `/vocabulary_lyrics` OpenAI node  
      `/lyrics_poetic_analysis` → `/lyrics_poetic_analysis` OpenAI node  
    - Fallback: Send error message Telegram node.

16. **Add OpenAI Nodes for Each Command:**  
    - Each node has a tailored prompt referencing `{{$json.clean_text}}`.  
    - Use Settings values for temperature and maxTokens.  
    - Commands:  
      - `/get_lyrics`: Line-by-line translation with original and translated lines  
      - `/interpret_lyrics`: Emotional and symbolic interpretation  
      - `/study_lyrics`: Linguistic study of idioms and expressions  
      - `/summarize_lyrics`: Concise summary ≤ 5 sentences  
      - `/vocabulary_lyrics`: Vocabulary list with definitions and usage examples  
      - `/lyrics_poetic_analysis`: Poetic and literary device analysis

17. **Add Telegram Node (Text reply):**  
    - Sends OpenAI output text back to user.  
    - Uses `chat_id` from Settings.  
    - Parse mode: MarkdownV2 for formatting consistency.

18. **Add Telegram Node (Send error message):**  
    - Sends friendly message for unsupported commands, listing valid commands and usage tips.

19. **Connect nodes accordingly:**  
    - Webhook → Message_Filter → Settings → If (start?) → `/start` OpenAI → Text reply  
    - If false → Extract_URL → If1 → Download_URL → CleanUp → Switch → corresponding OpenAI node → Text reply  
    - Switch fallback → Send error message  
    - Message_Filter false → No Operation  
    - If1 false → Incomplete_Command

20. **Publish workflow and set Telegram webhook URL:**  
    - Use Telegram API to set webhook to `https://[YOUR_DOMAIN]/webhook/lyrics-bot`.

21. **Test each command with valid lyrics URLs.**

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Context or Link                                                                                                                        |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------|
| This workflow is designed for private chats and groups; it is not intended for Telegram channels because channel update JSON structures differ.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Sticky Note7: Workflow Scope & Limitations                                                                                            |
| Telegram message formatting uses MarkdownV2 to ensure compatibility and prevent formatting errors. Escape special characters as required by Telegram MarkdownV2 rules.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Sticky Note4: Telegram message formatting guidelines                                                                                  |
| The bot commands supported are: `/start`, `/get_lyrics <URL>`, `/interpret_lyrics <URL>`, `/study_lyrics <URL>`, `/summarize_lyrics <URL>`, `/vocabulary_lyrics <URL>`, `/lyrics_poetic_analysis <URL>`. Keep the fallback message updated if commands change.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Sticky Note, Sticky Note9, Sticky Note (Fallback for Unsupported Commands)                                                             |
| No API keys or secrets are hardcoded in nodes; all credentials must be managed securely in n8n Credentials.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Sticky Note10: Settings & Credentials                                                                                                 |
| The HTML cleanup method is effective for static pages but may fail on JavaScript-heavy sites that render content dynamically. Consider alternative lyric sources or APIs if needed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Sticky Note3: Download & Cleanup (ETL)                                                                                                |
| Telegram has a ~4096 character limit per message. Long AI outputs should ideally be split into chunks before sending, though this workflow does not explicitly implement splitting.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Sticky Note4: Telegram message length limitation                                                                                      |
| Telegram webhook setup can be done via GET or POST requests to the Telegram API, with options to specify allowed update types to optimize performance and reduce unnecessary triggers.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Sticky Note7: Telegram webhook configuration details                                                                                  |
| The AI prompts are designed to produce Telegram-safe MarkdownV2 formatted text, avoiding overly wide tables or complex formatting that Telegram cannot render properly.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Sticky Note5: AI interaction prompt guidelines                                                                                        |
| Rate limits and API errors from OpenAI are not explicitly handled in this workflow; consider adding error handling and retry strategies for production use.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | General best practice                                                                                                                 |

---

**Disclaimer:** The text analyzed originates solely from an automated n8n workflow designed for lawful public data. It respects all current content policies and contains no illegal, offensive, or protected material.