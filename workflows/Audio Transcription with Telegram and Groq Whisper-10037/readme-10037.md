Audio Transcription with Telegram and Groq Whisper

https://n8nworkflows.xyz/workflows/audio-transcription-with-telegram-and-groq-whisper-10037


# Audio Transcription with Telegram and Groq Whisper

---

### 1. Workflow Overview

This workflow automates the transcription of audio messages received via a Telegram bot using the Groq Whisper API. It targets users who want to convert Telegram voice or audio messages into text and receive the transcription either as a Telegram text message or as a downloadable `.txt` file.

The workflow is composed of the following logical blocks:

- **1.1 Telegram Input Reception:** Listens for incoming Telegram messages restricted to a specific chat ID.
- **1.2 Message Type Validation and Routing:** Determines if the message contains audio or voice data and routes accordingly, or sends an error message for unsupported types.
- **1.3 Audio Retrieval:** Downloads the audio file from Telegram using the file ID extracted.
- **1.4 Credential Setup:** Prepares the essential API keys and tokens for Groq and Telegram.
- **1.5 Audio Transcription:** Sends the audio file to the Groq API for transcription using the Whisper model.
- **1.6 User Output Format Selection:** Offers the user a choice to receive the transcription as a text message or a `.txt` file.
- **1.7 Transcription Delivery:** Depending on the user’s choice, sends either a text message or a `.txt` file containing the transcription back via Telegram.

---

### 2. Block-by-Block Analysis

#### 2.1 Telegram Input Reception

- **Overview:**  
  This block triggers the workflow upon receiving a message in the configured Telegram bot and filters messages by chat ID.

- **Nodes Involved:**  
  - Telegram: Receive Message

- **Node Details:**  
  - **Telegram: Receive Message**  
    - **Type:** Telegram Trigger  
    - **Configuration:**  
      - Listens for the "message" update type.  
      - Restricts messages to those from chat ID `8464412504`.  
      - Uses Telegram API credentials linked to the bot named "abhiman1bot".  
    - **Input/Output:** Entry point of the workflow; outputs Telegram message JSON.  
    - **Edge Cases:** If the bot token is invalid or revoked, the trigger will fail. Network issues may cause missed messages.  
    - **Sticky Note:** Provides setup instructions for Telegram bot and trigger configuration.

#### 2.2 Message Type Validation and Routing

- **Overview:**  
  Checks if the incoming Telegram message contains an audio or voice message and sets the `file_id` accordingly. If not, it sends a notification back to the user and stops the workflow.

- **Nodes Involved:**  
  - Switch (Check Message Type)  
  - Set Node (audio type)  
  - Set Node (voice type)  
  - Telegram: Unsupported Type Message

- **Node Details:**  
  - **Switch (Check Message Type)**  
    - **Type:** Switch  
    - **Configuration:**  
      - Checks existence of `message.audio.file_id` → routes to `audio` output.  
      - Checks existence of `message.voice.file_id` → routes to `voice` output.  
      - Checks existence of `message.text` → routes to `error` output.  
    - **Input:** Message JSON from Telegram trigger.  
    - **Output:** Routes to Set nodes or error message node.  
    - **Edge Cases:** Incoming messages without audio/voice/text fields may not match any condition.  
  - **Set Node (audio type)**  
    - **Type:** Set  
    - **Configuration:** Assigns variable `fileid` with the audio `file_id` from the incoming message.  
    - **Input:** From Switch `audio` output.  
    - **Output:** Passes `fileid` to the next node.  
  - **Set Node (voice type)**  
    - Similar to the audio Set node but assigns `fileid` from voice message.  
  - **Telegram: Unsupported Type Message**  
    - **Type:** Telegram node (send message)  
    - **Configuration:** Sends a text message: "Yo! I only take audio😅, drop an audio message instead!" to the user’s chat ID.  
    - **Input:** From Switch `error` output.  
    - **Output:** Ends workflow for unsupported message types.  
    - **Edge Cases:** If Telegram API is unreachable, the notification will fail.

- **Sticky Note:** Explains the purpose of this block and routing logic.

#### 2.3 Audio Retrieval

- **Overview:**  
  Downloads the audio or voice file from Telegram using the `fileid` set previously and outputs the file path for transcription.

- **Nodes Involved:**  
  - Telegram: Download Audio File

- **Node Details:**  
  - **Telegram: Download Audio File**  
    - **Type:** Telegram node (download file)  
    - **Configuration:**  
      - Uses the `fileid` from Set nodes to request the file.  
      - Downloads the file metadata but actual binary download is disabled (`download: false`), obtaining file path instead.  
      - Uses the same Telegram bot credentials.  
    - **Input:** Receives `fileid` string.  
    - **Output:** Provides a JSON with the `file_path` for the audio file on Telegram servers.  
    - **Edge Cases:** If the file ID is invalid or expired, download fails. Network errors may cause failures.  
    - **Sticky Note:** Describes the function of this node.

#### 2.4 Credential Setup

- **Overview:**  
  Defines and stores the required API credentials for Groq transcription and Telegram access tokens, making them available to subsequent nodes.

- **Nodes Involved:**  
  - Set Credentials (Groq + Telegram)

- **Node Details:**  
  - **Set Credentials (Groq + Telegram)**  
    - **Type:** Set  
    - **Configuration:**  
      - Stores two strings: `Groq_API` (Groq API key) and `Telegram_access_token` (Telegram bot token).  
      - Both are mandatory; placeholders require user replacement.  
    - **Input:** From Telegram Download node.  
    - **Output:** Passes credentials forward.  
    - **Edge Cases:** Missing or invalid keys prevent transcription; no fallback or error handling present.  
    - **Sticky Note:** Provides detailed instructions and security notes about credentials.

#### 2.5 Audio Transcription

- **Overview:**  
  Sends a POST request to the Groq API to transcribe the audio file using the OpenAI Whisper model. Receives transcription text as output.

- **Nodes Involved:**  
  - HTTP - Transcribe Audio (Groq)

- **Node Details:**  
  - **HTTP - Transcribe Audio (Groq)**  
    - **Type:** HTTP Request  
    - **Configuration:**  
      - URL: `https://api.groq.com/openai/v1/audio/transcriptions`  
      - Method: POST with multipart/form-data content type.  
      - Body parameters include:  
        - `url`: Constructed URL to the audio file on Telegram's file server using Telegram access token and downloaded file path.  
        - `model`: "whisper-large-v3" specifying transcription model.  
      - Headers include Authorization Bearer token with `Groq_API` key.  
    - **Input:** Credentials and file path from previous nodes.  
    - **Output:** JSON containing `text` field with transcription result.  
    - **Edge Cases:**  
      - API key invalid or quota exceeded leads to 401/429 errors.  
      - Network timeouts or malformed requests cause failures.  
      - Audio file URL invalid or expired.  
    - **Sticky Note:** Explains API usage, credentials requirement, and failure warnings.

#### 2.6 User Output Format Selection

- **Overview:**  
  Sends a Telegram message asking the user to select the preferred output format for the transcription: plain text message or `.txt` file. Routes workflow based on selection.

- **Nodes Involved:**  
  - Telegram: Send Output Options  
  - If: Output Type Selected

- **Node Details:**  
  - **Telegram: Send Output Options**  
    - **Type:** Telegram node (send message with approval options)  
    - **Configuration:**  
      - Message: "Which format do you want? 👇"  
      - Options set to disable attribution.  
      - Approval buttons with double approval type:  
        - Approve: "Text message"  
        - Disapprove: "Text file"  
      - Chat ID from original Telegram message.  
    - **Input:** From transcription HTTP request output.  
    - **Output:** Waits for user response.  
  - **If: Output Type Selected**  
    - **Type:** If  
    - **Configuration:** Checks if user approved (`data.approved == true`).  
    - **Input:** From Telegram output options node.  
    - **Output:**  
      - True branch: Send transcript as Telegram text message.  
      - False branch: Process to send transcript as `.txt` file.  
    - **Edge Cases:** User ignoring response or delayed response may cause workflow stalls.  
    - **Sticky Note:** Describes functionality and routing.

#### 2.7 Transcription Delivery

- **Overview:**  
  Sends the transcription back to the user either as a Telegram text message or as a `.txt` file, depending on the user’s selection.

- **Nodes Involved:**  
  - Telegram: Send Transcript Message  
  - Set: Transcribed Audio Text  
  - Convert to TXT File  
  - Send Transcript File

- **Node Details:**  
  - **Telegram: Send Transcript Message**  
    - **Type:** Telegram node (send message)  
    - **Configuration:**  
      - Sends transcription text directly to the user’s Telegram ID (`message.from.id`).  
      - Attribution disabled.  
    - **Input:** From If node’s true output.  
    - **Output:** Ends workflow for text message delivery branch.  
    - **Sticky Note:** Explains sending transcript as message.  
  - **Set: Transcribed Audio Text**  
    - **Type:** Set  
    - **Configuration:** Stores transcription text into a field named `text`.  
    - **Input:** From If node’s false output.  
    - **Output:** Passes text for file conversion.  
  - **Convert to TXT File**  
    - **Type:** Convert To File  
    - **Configuration:**  
      - Converts `text` property to a `.txt` file named "transcription.txt".  
      - Stores binary data under property `transcription`.  
    - **Input:** From Set node.  
    - **Output:** Passes binary file data to send node.  
  - **Send Transcript File**  
    - **Type:** Telegram node (send document)  
    - **Configuration:**  
      - Sends the `.txt` file to user via Telegram using binary data.  
      - Chat ID from original message sender.  
    - **Input:** From Convert to TXT node.  
    - **Output:** Ends workflow for file delivery branch.  
    - **Sticky Note:** Describes file sending process.

---

### 3. Summary Table

| Node Name                     | Node Type              | Functional Role                          | Input Node(s)                      | Output Node(s)                        | Sticky Note                                                  |
|-------------------------------|------------------------|----------------------------------------|----------------------------------|-------------------------------------|--------------------------------------------------------------|
| Telegram: Receive Message      | Telegram Trigger       | Entry point, receives Telegram messages | None                             | Switch (Check Message Type)          | Setup instructions for Telegram bot trigger                  |
| Switch (Check Message Type)    | Switch                 | Routes based on message type (audio/voice/text) | Telegram: Receive Message          | Set Node (audio type), Set Node (voice type), Telegram: Unsupported Type Message | Explains routing logic and audio/voice distinction            |
| Set Node (audio type)          | Set                    | Sets fileid from audio message          | Switch (Check Message Type)       | Telegram: Download Audio File         |                                                              |
| Set Node (voice type)          | Set                    | Sets fileid from voice message          | Switch (Check Message Type)       | Telegram: Download Audio File         |                                                              |
| Telegram: Unsupported Type Message | Telegram Send Message | Sends error when message is not audio/voice | Switch (Check Message Type)       | None                                |                                                              |
| Telegram: Download Audio File  | Telegram File Download  | Retrieves audio file path from Telegram | Set Node (audio type), Set Node (voice type) | Set Credentials (Groq + Telegram)   | Describes audio download process                             |
| Set Credentials (Groq + Telegram) | Set                 | Stores Groq API key and Telegram token  | Telegram: Download Audio File     | HTTP - Transcribe Audio (Groq)       | Details credential setup and security warnings               |
| HTTP - Transcribe Audio (Groq)| HTTP Request           | Sends audio to Groq API for transcription | Set Credentials (Groq + Telegram) | Telegram: Send Output Options         | Explains API call and authentication                          |
| Telegram: Send Output Options  | Telegram Send Message   | Asks user to choose output format       | HTTP - Transcribe Audio (Groq)   | If: Output Type Selected              | Describes user choice for output format                       |
| If: Output Type Selected       | If                     | Routes based on user choice              | Telegram: Send Output Options     | Telegram: Send Transcript Message (true), Set: Transcribed Audio Text (false) | Explains branching based on approval                          |
| Telegram: Send Transcript Message | Telegram Send Message | Sends transcript as Telegram text message | If: Output Type Selected (true)  | None                                | Sends transcript as message                                  |
| Set: Transcribed Audio Text    | Set                    | Stores transcript for file conversion    | If: Output Type Selected (false) | Convert to TXT File                   |                                                              |
| Convert to TXT File            | Convert To File         | Converts text to `.txt` file             | Set: Transcribed Audio Text       | Send Transcript File                  | Converts transcript to file                                  |
| Send Transcript File           | Telegram Send Document  | Sends `.txt` file to user via Telegram  | Convert to TXT File               | None                                | Sends transcript as file                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger Node**  
   - Type: Telegram Trigger  
   - Set event to "message" updates only.  
   - Restrict to chat ID `8464412504`.  
   - Attach Telegram API credentials for your bot token.

2. **Add Switch Node (Check Message Type)**  
   - Add rules to check:  
     - If `message.audio.file_id` exists → output "audio"  
     - Else if `message.voice.file_id` exists → output "voice"  
     - Else if `message.text` exists → output "error"  
   - Connect Telegram Trigger output to this Switch input.

3. **Create Set Node (audio type)**  
   - Assign variable `fileid` with expression: `{{$json.message.audio.file_id}}`  
   - Connect from the Switch node’s "audio" output.

4. **Create Set Node (voice type)**  
   - Assign variable `fileid` with expression: `{{$json.message.voice.file_id}}`  
   - Connect from the Switch node’s "voice" output.

5. **Create Telegram Node (Unsupported Type Message)**  
   - Operation: Send Message  
   - Text: "Yo! I only take audio😅, drop a audio message instead!"  
   - Chat ID: `{{$json.message.chat.id}}` from Telegram Trigger node.  
   - Connect from Switch node’s "error" output. This will end workflow for unsupported messages.

6. **Create Telegram Node (Download Audio File)**  
   - Operation: Download File (resource: file)  
   - File ID: `{{$json.fileid}}` (from Set nodes)  
   - Set `download` to `false` to retrieve file path only.  
   - Connect from both Set Node (audio type) and Set Node (voice type) outputs.

7. **Create Set Node (Credentials for Groq and Telegram)**  
   - Add two string fields:  
     - `Groq_API` — set your Groq API key.  
     - `Telegram_access_token` — set your Telegram bot token.  
   - Connect from Telegram Download Audio File node.

8. **Create HTTP Request Node (Transcribe Audio via Groq)**  
   - Method: POST  
   - URL: `https://api.groq.com/openai/v1/audio/transcriptions`  
   - Content Type: multipart/form-data  
   - Body Parameters:  
     - `url`: Construct URL as:  
       `https://api.telegram.org/file/bot{{ $json.Telegram_access_token }}/{{ $json.file_path }}`  
       Use expressions to reference values from previous nodes.  
     - `model`: "whisper-large-v3"  
   - Header Parameters:  
     - `Authorization`: `Bearer {{ $json.Groq_API }}`  
     - `Content-Type`: `multipart/form-data`  
   - Connect from Set Credentials node.

9. **Create Telegram Node (Send Output Options)**  
   - Operation: Send Message and Wait for Approval  
   - Message: "Which format do you want? 👇"  
   - Approval Type: Double Approval  
     - Approve label: "Text message"  
     - Disapprove label: "Text file"  
   - Chat ID: from Telegram Trigger original message chat.  
   - Connect from HTTP Request node.

10. **Create If Node (Output Type Selected)**  
    - Condition: Check if `data.approved == true`  
    - Connect from Telegram Send Output Options node.

11. **Create Telegram Node (Send Transcript Message)**  
    - Operation: Send Message  
    - Text: transcription text from HTTP Request node (`{{$json.text}}`)  
    - Chat ID: Original Telegram message sender ID (`{{$json.message.from.id}}`)  
    - Connect from If node’s true output.

12. **Create Set Node (Transcribed Audio Text)**  
    - Assign field `text` with transcription text (`{{$json.text}}`)  
    - Connect from If node’s false output.

13. **Create Convert to File Node**  
    - Operation: toText  
    - Source Property: `text`  
    - File Name: "transcription.txt"  
    - Binary Property Name: "transcription"  
    - Connect from Set Transcribed Audio Text node.

14. **Create Telegram Node (Send Transcript File)**  
    - Operation: Send Document  
    - Binary Property Name: "transcription"  
    - Chat ID: Original Telegram message sender ID (`{{$json.message.from.id}}`)  
    - Connect from Convert to File node.

15. **Activate and Test**  
    - Replace placeholder API keys with actual valid keys.  
    - Test by sending voice or audio message to your Telegram bot from the allowed chat ID.  
    - Confirm that transcription is received in the chosen format.

---

### 5. General Notes & Resources

| Note Content                                                                                     | Context or Link                                            |
|-------------------------------------------------------------------------------------------------|------------------------------------------------------------|
| Groq API key can be created for free at Groq Console                                            | https://console.groq.com/keys                               |
| Telegram bot token must be generated via BotFather                                             | https://core.telegram.org/bots#6-botfather                  |
| Workflow only supports voice/audio messages; text or other types produce an error notification  | Included in Switch node and Unsupported Type Message node  |
| Security note: Do not hardcode API keys in public nodes; use environment variables or credentials | Sticky Note 7                                               |
| Workflow stops immediately after sending error message for unsupported file types               | Ensures resource efficiency                                 |
| Uses OpenAI Whisper large model via Groq API for transcription                                  | High accuracy transcription                                 |

---

**Disclaimer:**  
The provided content is exclusively derived from an automated workflow created with n8n, adhering strictly to current content policies and containing no illegal, offensive, or protected material. All data handled is legal and publicly accessible.

---