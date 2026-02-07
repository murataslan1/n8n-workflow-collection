AI Chatbot Call Center: Telegram Call In (Production-Ready, Part 1a)

https://n8nworkflows.xyz/workflows/ai-chatbot-call-center--telegram-call-in--production-ready--part-1a--4044


# AI Chatbot Call Center: Telegram Call In (Production-Ready, Part 1a)

### 1. Workflow Overview

This workflow, titled **"🤙 Telegram Call In"**, is designed as a production-ready Telegram chatbot interface for an AI-driven call center. It targets high-skill users who want to automate processing incoming Telegram messages—both text and voice—and route them through a call center system with optional member data enrichment and caching.

**Use cases include:**

- Receiving Telegram messages from users (text or voice)
- Transcribing voice messages to text via Google Speech-to-Text (STT)
- Checking and caching user/member data from a PostgreSQL database with Redis caching
- Routing the processed input to sub-workflows for call center handling or callback
- Supporting multi-language voice transcription
- Supporting test triggers and outputs for debugging/testing

**Logical blocks:**

- **1.1 Input Reception:** Trigger nodes for Telegram and test inputs.
- **1.2 Member Data Lookup and Caching:** Redis cache check, PostgreSQL lookup, caching results.
- **1.3 Message Type Determination:** Switch between text and voice messages.
- **1.4 Voice Message Processing:** Download audio, extract file data, transcribe with Google STT, language detection & setting.
- **1.5 Post-Transcription Handling:** Check transcription success, set fallback text for failures.
- **1.6 Call Center Routing:** Pass processed text input and member info to the main call center sub-workflow or callback sub-workflow.
- **1.7 Testing and Output:** Nodes to test and debug with Telegram output.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
Waits for new Telegram messages or test triggers to initiate the workflow.

**Nodes Involved:**  
- Telegram Trigger  
- Test Trigger  
- Test Input  
- Telegram Input  

**Node Details:**

- **Telegram Trigger**  
  - Type: Telegram Trigger  
  - Role: Receives incoming Telegram messages from the configured bot (@chpy_demo_bot).  
  - Configuration: Default, with webhook ID set. Uses Telegram credentials.  
  - Input: None (entry point)  
  - Output: To Member Cache node  
  - Edge cases: Telegram downtime, webhook misconfiguration, invalid credentials.

- **Test Trigger**  
  - Type: Langchain Chat Trigger  
  - Role: Alternative entry point for testing with manual input.  
  - Configuration: Default, webhook ID set.  
  - Input: None  
  - Output: To Test Input node  
  - Edge cases: Test data format mismatch.

- **Test Input**  
  - Type: Set node  
  - Role: Prepares test input data for the workflow.  
  - Configuration: Empty set, presumably filled during testing.  
  - Input: From Test Trigger  
  - Output: To Input node  

- **Telegram Input**  
  - Type: Set node  
  - Role: Normalizes or prepares Telegram message data for downstream nodes.  
  - Configuration: Empty set node, likely placeholder for setting fields.  
  - Input: From Type Switch node (see below)  
  - Output: To Input node  

---

#### 1.2 Member Data Lookup and Caching

**Overview:**  
Checks for cached member data in Redis; if missing, fetches from PostgreSQL and caches it.

**Nodes Involved:**  
- Member Cache  
- If Member Cache  
- Parse Service  
- Load Memer Data (Postgres)  
- If Active  
- Save Member Cache  
- Member  

**Node Details:**

- **Member Cache**  
  - Type: Redis node  
  - Role: Tries to retrieve member data from Redis cache using key pattern `member:telegram:{user_id}:data` with TTL 5 minutes.  
  - Input: From Telegram Trigger  
  - Output: To If Member Cache  
  - Edge cases: Redis connection failure, cache miss.

- **If Member Cache**  
  - Type: If node  
  - Role: Checks if cached member data exists (true path) or not (false path).  
  - Input: From Member Cache  
  - Output: True → Parse Service; False → Load Memer Data  
  - Edge cases: Expression evaluation errors if input data missing.

- **Parse Service**  
  - Type: Code node  
  - Role: Parses cached member data and prepares member info for downstream nodes.  
  - Input: True output of If Member Cache  
  - Output: To Member node  
  - Edge cases: Parsing errors if cached data malformed.

- **Load Memer Data**  
  - Type: Postgres node  
  - Role: Queries PostgreSQL to load member data if cache miss occurs.  
  - Configuration: SQL query against `sys_member` table (default).  
  - Input: False output of If Member Cache  
  - Output: To If Active node  
  - Edge cases: DB connection issues, query errors, missing data.

- **If Active**  
  - Type: If node  
  - Role: Checks if loaded member is active (e.g., is_active = true).  
  - Input: From Load Memer Data  
  - Output: Both branches go to Save Member Cache (to cache member data regardless)  
  - Edge cases: Logical errors if member status field missing.

- **Save Member Cache**  
  - Type: Redis node  
  - Role: Saves member data back to Redis cache with TTL 5 minutes.  
  - Input: From If Active  
  - Output: To Member node  
  - Edge cases: Redis write failures.

- **Member**  
  - Type: Set node  
  - Role: Sets member context data for further processing, including setting default language as English.  
  - Input: From Parse Service or Save Member Cache  
  - Output: To Type Switch node  
  - Edge cases: Missing or incomplete member data.

---

#### 1.3 Message Type Determination

**Overview:**  
Determines if incoming message is text or voice and routes accordingly.

**Nodes Involved:**  
- Type Switch

**Node Details:**

- **Type Switch**  
  - Type: Switch node  
  - Role: Branches to handle either text messages or voice messages.  
  - Input: From Member node  
  - Output:  
    - Text path → Telegram Input node  
    - Voice path → Download Audio node  
  - Edge cases: Unexpected message types, missing fields.

---

#### 1.4 Voice Message Processing

**Overview:**  
Downloads voice audio file, extracts file data, transcribes via Google STT, sets language context.

**Nodes Involved:**  
- Download Audio  
- Extract from File  
- Switch (language selection)  
- cmn-Hans-CN, cmn-Hant-TW, yue-Hant-HK, ja-JP, English (Set nodes for language)  
- Google STT  
- If Transcript  
- Telegram Voice Input  

**Node Details:**

- **Download Audio**  
  - Type: Telegram node  
  - Role: Downloads voice message audio from Telegram.  
  - Input: From Type Switch (voice path)  
  - Output: To Extract from File  
  - Edge cases: Download failures, file not found.

- **Extract from File**  
  - Type: Extract From File node  
  - Role: Extracts audio file binary or metadata for transcription.  
  - Input: From Download Audio  
  - Output: To Switch (language picker)  
  - Edge cases: File corruption, unsupported formats.

- **Switch (language selection)**  
  - Type: Switch node  
  - Role: Routes to corresponding language setting nodes based on detected or user language.  
  - Input: From Extract from File  
  - Output: To one of the language Set nodes (cmn-Hans-CN, cmn-Hant-TW, yue-Hant-HK, ja-JP, English)  
  - Edge cases: Unknown language codes.

- **Language Set nodes (cmn-Hans-CN, cmn-Hant-TW, yue-Hant-HK, ja-JP, English)**  
  - Type: Set nodes  
  - Role: Set language parameters required by Google STT for accurate transcription.  
  - Input: From Switch node  
  - Output: To Google STT node  
  - Edge cases: Incorrect language code leading to transcription errors.

- **Google STT**  
  - Type: Google Speech node (community node)  
  - Role: Performs speech-to-text transcription on the voice audio input.  
  - Configuration: Google STT API credentials configured externally.  
  - Input: From language Set nodes  
  - Output: To If Transcript node  
  - Error handling: On error, continues workflow (error output ignored).  
  - Edge cases: API rate limits, invalid credentials, audio format issues.

- **If Transcript**  
  - Type: If node  
  - Role: Checks if transcription text is available.  
  - Input: From Google STT  
  - Output:  
    - True → Telegram Voice Input node  
    - False → No Transcript Input node  
  - Edge cases: Empty transcription, API partial failures.

- **Telegram Voice Input**  
  - Type: Set node  
  - Role: Prepares the transcribed text as input for the next processing step.  
  - Input: From If Transcript (true path)  
  - Output: To Input node  

---

#### 1.5 Post-Transcription Handling

**Overview:**  
Handles cases where transcription fails or no text is recognized.

**Nodes Involved:**  
- No Transcript Input  
- Demo Call Back  

**Node Details:**

- **No Transcript Input**  
  - Type: Set node  
  - Role: Sets a default text message like "I don't understand" when transcription fails.  
  - Input: From If Transcript (false path)  
  - Output: To Demo Call Back node  
  - Edge cases: Ensures user receives fallback response.

- **Demo Call Back**  
  - Type: Execute Workflow node  
  - Role: Executes a sub-workflow that handles callback logic when transcription fails or for specific user interactions.  
  - Input: From No Transcript Input  
  - Output: None (terminal or further handled inside sub-workflow)  
  - Edge cases: Sub-workflow availability, parameter passing correctness.

---

#### 1.6 Call Center Routing

**Overview:**  
Routes the prepared text input and member data to the main call center sub-workflow for further processing.

**Nodes Involved:**  
- Input  
- Demo Call Center  
- If Telegram  
- Telegram Test Output (optional testing output)

**Node Details:**

- **Input**  
  - Type: Set node  
  - Role: Normalizes and prepares final input data for call center processing.  
  - Input: From Telegram Input or Telegram Voice Input nodes  
  - Output: To Demo Call Center  

- **Demo Call Center**  
  - Type: Execute Workflow node  
  - Role: Runs the main call center sub-workflow to process the user's input (text or transcribed voice) with member context.  
  - Input: From Input node  
  - Output: To If Telegram node (for testing output)  
  - Edge cases: Sub-workflow load, parameter mapping.

- **If Telegram**  
  - Type: If node  
  - Role: Checks if the flow is in Telegram test mode to optionally output back to Telegram.  
  - Input: From Demo Call Center  
  - Output: True → Telegram Test Output, False → End  
  - Edge cases: Conditional logic errors.

- **Telegram Test Output**  
  - Type: Telegram node  
  - Role: Sends output message back to Telegram for testing/debugging purposes.  
  - Input: From If Telegram (true path)  
  - Output: None (terminal)  
  - Edge cases: Telegram API limits, credentials errors.

---

#### 1.7 Testing and Output

**Overview:**  
Supports testing the workflow with manual triggers and outputs.

**Nodes Involved:**  
- Test Trigger  
- Test Input  
- Input  
- Demo Call Center  
- If Telegram  
- Telegram Test Output  

**Node Details:**  
These nodes have been described above in Input Reception and Call Center Routing blocks, forming a parallel test path that uses Langchain Chat Trigger and outputs results back to Telegram.

---

### 3. Summary Table

| Node Name           | Node Type                   | Functional Role                          | Input Node(s)                | Output Node(s)              | Sticky Note                                                                                                           |
|---------------------|-----------------------------|----------------------------------------|-----------------------------|-----------------------------|-----------------------------------------------------------------------------------------------------------------------|
| Telegram Trigger     | Telegram Trigger            | Entry point for Telegram messages      | None                        | Member Cache                | @chpy_demo_bot                                                                                                        |
| Test Trigger         | Langchain Chat Trigger      | Entry point for test messages           | None                        | Test Input                  |                                                                                                                       |
| Test Input           | Set                         | Prepares test input data                 | Test Trigger                | Input                       |                                                                                                                       |
| Telegram Input       | Set                         | Normalizes Telegram text input           | Type Switch                 | Input                       |                                                                                                                       |
| Type Switch          | Switch                      | Determines message type (text or voice) | Member                      | Telegram Input, Download Audio |                                                                                                                       |
| Download Audio       | Telegram                    | Downloads voice message audio            | Type Switch (voice path)     | Extract from File           | @chpy_demo_bot                                                                                                        |
| Extract from File    | Extract From File           | Extracts audio data for transcription   | Download Audio              | Switch (language selection) |                                                                                                                       |
| Switch               | Switch                      | Selects language for transcription      | Extract from File           | Language Set nodes          |                                                                                                                       |
| cmn-Hans-CN          | Set                         | Sets language parameter for STT         | Switch                      | Google STT                  |                                                                                                                       |
| cmn-Hant-TW          | Set                         | Sets language parameter for STT         | Switch                      | Google STT                  |                                                                                                                       |
| yue-Hant-HK          | Set                         | Sets language parameter for STT         | Switch                      | Google STT                  |                                                                                                                       |
| ja-JP                | Set                         | Sets language parameter for STT         | Switch                      | Google STT                  |                                                                                                                       |
| English              | Set                         | Sets language parameter for STT (default)| Switch                      | Google STT                  |                                                                                                                       |
| Google STT           | Google Speech               | Transcribes voice audio to text          | Language Set nodes          | If Transcript               |                                                                                                                       |
| If Transcript        | If                          | Checks if transcription succeeded       | Google STT                  | Telegram Voice Input, No Transcript Input |                                                                                                                       |
| Telegram Voice Input | Set                         | Prepares transcribed text input          | If Transcript (true)        | Input                       |                                                                                                                       |
| No Transcript Input  | Set                         | Sets fallback message on transcription failure | If Transcript (false)       | Demo Call Back             | I don't understand                                                                                                    |
| Demo Call Back       | Execute Workflow            | Sub-workflow for callback handling       | No Transcript Input         | None                       |                                                                                                                       |
| Input                | Set                         | Normalizes final input for call center   | Telegram Input, Telegram Voice Input, Test Input | Demo Call Center          |                                                                                                                       |
| Demo Call Center     | Execute Workflow            | Main call center sub-workflow             | Input                       | If Telegram                 | Demo Call Center                                                                                                      |
| If Telegram          | If                          | Checks if Telegram test output is enabled | Demo Call Center            | Telegram Test Output        |                                                                                                                       |
| Telegram Test Output | Telegram                    | Sends output back to Telegram (testing) | If Telegram (true)           | None                       | @chpy_demo_bot                                                                                                        |
| Member Cache         | Redis                       | Retrieves cached member data              | Telegram Trigger            | If Member Cache             | member:telegram:{user_id}:data TTL 5m                                                                                 |
| If Member Cache      | If                          | Checks existence of cached member data   | Member Cache                | Parse Service, Load Memer Data |                                                                                                                       |
| Parse Service        | Code                        | Parses cached member data                 | If Member Cache (true)      | Member                      |                                                                                                                       |
| Load Memer Data      | Postgres                    | Loads member data from DB on cache miss  | If Member Cache (false)     | If Active                   |                                                                                                                       |
| If Active            | If                          | Checks member active status               | Load Memer Data             | Save Member Cache (both)    |                                                                                                                       |
| Save Member Cache    | Redis                       | Stores member data in cache                | If Active                   | Member                      | TTL 5m                                                                                                                |
| Member               | Set                         | Sets member info and language context     | Parse Service, Save Member Cache | Type Switch                | language: English                                                                                                     |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger node**  
   - Type: Telegram Trigger  
   - Configure Telegram credentials with your bot token  
   - Leave default settings  
   - Position as entry point  
   - Connect output to `Member Cache` node.

2. **Create Member Cache node**  
   - Type: Redis node  
   - Configure Redis credentials  
   - Key pattern: `member:telegram:{{$json["message"]["from"]["id"]}}:data`  
   - TTL: 5 minutes  
   - On error: continue regular output  
   - Connect output to `If Member Cache`.

3. **Create If Member Cache node**  
   - Type: If node  
   - Condition: Check if cached data exists (e.g., check if `data` field exists)  
   - True output → `Parse Service`  
   - False output → `Load Memer Data`.

4. **Create Parse Service node**  
   - Type: Code node  
   - Write JavaScript code to parse Redis cached data, extract member info  
   - Output member data as JSON  
   - Connect output to `Member` node.

5. **Create Load Memer Data node**  
   - Type: Postgres node  
   - Configure PostgreSQL credentials  
   - SQL Query: Select member data by Telegram user ID, e.g., `SELECT * FROM sys_member WHERE telegram_id = $1` (bind parameter user ID)  
   - Execute once: true  
   - On error: continue regular output  
   - Connect output to `If Active`.

6. **Create If Active node**  
   - Type: If node  
   - Condition: Check if member is active (e.g., `is_active` field equals true)  
   - Both true and false outputs → `Save Member Cache`.

7. **Create Save Member Cache node**  
   - Type: Redis node  
   - Use same Redis credentials  
   - Store member data under same key as in `Member Cache`  
   - TTL: 5 minutes  
   - On error: continue regular output  
   - Connect output to `Member`.

8. **Create Member node**  
   - Type: Set node  
   - Set member info fields from loaded or cached data  
   - Set default language property (e.g., English)  
   - Connect output to `Type Switch`.

9. **Create Type Switch node**  
   - Type: Switch node  
   - Condition: Check message type from Telegram payload (e.g., if voice or text)  
   - Voice path output → `Download Audio`  
   - Text path output → `Telegram Input`.

10. **Create Telegram Input node**  
    - Type: Set node  
    - Prepare text input for call center (e.g., normalize text fields)  
    - Connect output to `Input` node.

11. **Create Download Audio node**  
    - Type: Telegram node  
    - Use Telegram credentials  
    - Download voice message audio file  
    - Connect output to `Extract from File`.

12. **Create Extract from File node**  
    - Type: Extract From File node  
    - Extract binary/audio data from downloaded file  
    - Connect output to `Switch (language selection)`.

13. **Create Switch (language selection) node**  
    - Type: Switch node  
    - Detect or read language code from member or message context  
    - Route to corresponding language Set nodes (`cmn-Hans-CN`, `cmn-Hant-TW`, `yue-Hant-HK`, `ja-JP`, `English`).

14. **Create Language Set nodes (five nodes)**  
    - Type: Set node  
    - Set language parameter for Google STT API for each language code  
    - Connect all output to `Google STT`.

15. **Create Google STT node**  
    - Type: Google Speech node (community node)  
    - Configure Google STT credentials  
    - Set audio input to extracted file data  
    - On error: continue regular output  
    - Connect output to `If Transcript`.

16. **Create If Transcript node**  
    - Type: If node  
    - Condition: Check if transcription text exists and is non-empty  
    - True output → `Telegram Voice Input`  
    - False output → `No Transcript Input`.

17. **Create Telegram Voice Input node**  
    - Type: Set node  
    - Prepare transcribed text as input for call center  
    - Connect output to `Input`.

18. **Create No Transcript Input node**  
    - Type: Set node  
    - Set fallback text like "I don't understand"  
    - Connect output to `Demo Call Back`.

19. **Create Demo Call Back node**  
    - Type: Execute Workflow node  
    - Reference sub-workflow for callback handling (configure workflow ID or name)  
    - Connect output as needed (usually terminal).

20. **Create Input node**  
    - Type: Set node  
    - Normalize input text and member data for call center processing  
    - Connect output to `Demo Call Center`.

21. **Create Demo Call Center node**  
    - Type: Execute Workflow node  
    - Reference main call center sub-workflow (configure workflow ID or name)  
    - Connect output to `If Telegram`.

22. **Create If Telegram node**  
    - Type: If node  
    - Condition: Check if Telegram test output is enabled (could be a flag or variable)  
    - True output → `Telegram Test Output`  
    - False output → End.

23. **Create Telegram Test Output node**  
    - Type: Telegram node  
    - Use Telegram credentials  
    - Sends message back to Telegram for testing  
    - Terminal node.

24. **Create Test Trigger and Test Input nodes**  
    - Type: Langchain Chat Trigger and Set node  
    - Configure webhook and test input data  
    - Connect Test Input to Input node for testing path.

---

### 5. General Notes & Resources

| Note Content                                                                                  | Context or Link                                                                                                              |
|-----------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------|
| Source SQL scripts for setting up the member table and other DB setup are available on GitHub | https://github.com/ChatPayLabs/n8n-chatbot-core                                                                             |
| n8n community node "n8n-nodes-google-speech" required for transcription functionality          | https://www.npmjs.com/package/n8n-nodes-google-speech                                                                        |
| Telegram credentials setup instructions can be found in n8n docs                              | https://docs.n8n.io/integrations/builtin/credentials/slack/?utm_source=n8n_app&utm_medium=credential_settings&utm_campaign=create_new_credentials_modal |
| Redis credentials setup instructions are available in n8n docs                               | https://docs.n8n.io/integrations/builtin/credentials/slack/?utm_source=n8n_app&utm_medium=credential_settings&utm_campaign=create_new_credentials_modal |
| PostgreSQL credentials setup instructions are available in n8n docs                          | https://docs.n8n.io/integrations/builtin/credentials/slack/?utm_source=n8n_app&utm_medium=credential_settings&utm_campaign=create_new_credentials_modal |
| The workflow is designed for queue mode scaling in production                                |                                                                                                                               |
| Optional member data caching mechanism with TTL to reduce DB load                           | TTL set to 5 minutes for Redis cache                                                                                          |
| Multi-language support for transcription (Chinese variants, Japanese, English)              | Language nodes select appropriate STT language parameter                                                                      |
| Testing flow included to allow running without actual Telegram input                        | Test Trigger and Telegram Test Output nodes                                                                                   |
| Error handling configured to continue workflow on Redis, Postgres, and Google STT errors    |                                                                                                                               |

---

**Disclaimer:**  
The text provided is exclusively derived from an automated n8n workflow. It complies strictly with content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.