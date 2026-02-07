Automate Meeting Intelligence with VEXA, OpenAI & Mem0 for Conversation Insights

https://n8nworkflows.xyz/workflows/automate-meeting-intelligence-with-vexa--openai---mem0-for-conversation-insights-7029


# Automate Meeting Intelligence with VEXA, OpenAI & Mem0 for Conversation Insights

### 1. Workflow Overview

This n8n workflow automates meeting intelligence by orchestrating AI-powered transcription, conversation analysis, and data synchronization across VEXA, OpenAI, Mem0, Redis, and Baserow. It is designed for solopreneurs and small businesses to:

- Deploy and remove an AI bot during Google Meet sessions via commands from a Baserow CRM table.
- Automatically fetch meeting transcripts once meetings complete.
- Analyze transcripts using AI to extract summaries, next steps, potential risks, and sentiment.
- Store analyzed meeting insights persistently in Mem0 for easy querying.
- Maintain meeting lifecycle status and user context in Baserow and Redis.

The workflow logically divides into two main blocks:

- **1.1 Bot Management:** Receives commands from Baserow to start or stop the VEXA AI bot for Google Meet meetings and updates meeting status accordingly.
- **1.2 AI-Powered Analysis and Memory:** Triggered by VEXA webhook on meeting end, retrieves transcripts, processes and analyzes them via OpenAI, then saves structured insights into Mem0 memory.

Additional utility nodes manage webhook registration for VEXA and handle user ID storage in Redis to maintain contextual linkage across systems.

---

### 2. Block-by-Block Analysis

#### 1.1 Bot Management

**Overview:**  
Manages the lifecycle of the AI bot in Google Meet meetings based on CRM commands. Updates Baserow status fields and controls VEXA bot start/stop via HTTP requests.

**Nodes Involved:**  
- `vexa-start` (Webhook)  
- `Route: Bot Action (Start/Stop)` (Switch)  
- `HTTP: Start VEXA Bot` (HTTP Request)  
- `HTTP: Stop VEXA Bot` (HTTP Request)  
- `Baserow: Update Status to 'In Progress'` (Baserow)  
- `Baserow: Update Status to 'Stopped'` (Baserow)  
- `Baserow : set rowID` (Redis, sets user ID)  
- `No Operation, do nothing` (NoOp)  
- Sticky Note: “BOT Management”

**Node Details:**

- **`vexa-start`**  
  - Type: Webhook (HTTP POST listener)  
  - Role: Entry point receiving commands from Baserow automation webhook  
  - Config: Listens at path `vexa-API` for POST requests, allows all origins  
  - Outputs: Routes to Switch node  
  - Failure modes: HTTP request errors, malformed payloads

- **`Route: Bot Action (Start/Stop)`**  
  - Type: Switch  
  - Role: Decides action based on the `Send Bot` field in payload (`Start_Bot`, `Stop_Bot`, or no_action)  
  - Config: String equality checks on `body.items[0]['Send Bot'].value`  
  - Outputs:  
    - `Start_Bot` → triggers bot start HTTP request  
    - `Stop_Bot` → triggers bot stop HTTP request  
    - fallback no_action → NoOp node  
  - Failure modes: Missing or unexpected command values

- **`HTTP: Start VEXA Bot`**  
  - Type: HTTP Request (POST)  
  - Role: Starts the VEXA AI bot on Google Meet  
  - Config:  
    - URL: `https://gateway.dev.vexa.ai/bots`  
    - Body includes platform (`google_meet`), meeting ID extracted from `Meeting Link`, language, bot name  
    - Auth: HTTP Header with VEXA API key  
    - Retries on failure (max 2, 5s interval)  
  - Outputs: Updates Baserow status to "In Progress"  
  - Failure modes: Network timeouts, auth errors, invalid meeting ID format

- **`HTTP: Stop VEXA Bot`**  
  - Type: HTTP Request (DELETE)  
  - Role: Stops the VEXA AI bot for specified meeting  
  - Config: URL dynamically built from meeting ID in payload  
  - Auth: HTTP Header with VEXA API key  
  - On error: continues to next node  
  - Outputs: Updates Baserow status to "Stop Request" and also a NoOp node  
  - Failure modes: Network issues, invalid meeting ID, auth failure

- **`Baserow: Update Status to 'In Progress'`**  
  - Type: Baserow API  
  - Role: Sets meeting status to "In Progress" when bot starts  
  - Config: Updates single-select `Status` field in Baserow table with row ID from webhook payload  
  - Failure modes: API rate limits, invalid row ID, invalid credentials

- **`Baserow: Update Status to 'Stopped'`**  
  - Type: Baserow API  
  - Role: Sets meeting status to "Stop Request" when bot stops  
  - Config: Same as above but different status value  
  - Failure modes: Same as above

- **`Baserow : set rowID`**  
  - Type: Redis Set  
  - Role: Stores user ID temporarily in Redis with TTL 3600s  
  - Config: Key `setMem0-userId`, value from meeting with field in payload  
  - Failure modes: Redis connectivity issues

- **`No Operation, do nothing`**  
  - Type: NoOp  
  - Role: Fallback for unsupported actions, ends flow silently

---

#### 1.2 AI-Powered Analysis and Memory

**Overview:**  
Triggered by VEXA webhook when transcript is ready, fetches full transcript, processes text segments, aggregates data, analyzes it with AI, then stores structured meeting insights in Mem0.

**Nodes Involved:**  
- `Webhook: Transcript Ready` (Webhook)  
- `VEXA: Get Transcript` (HTTP Request)  
- `Process: Split Transcript Segments` (SplitOut)  
- `Prepare: Select Transcript Data` (Set)  
- `Redis: Get User ID` (Redis Get)  
- `Merge` (Merge)  
- `Prepare: Aggregate for Analysis` (Aggregate)  
- `AI: Analyze Transcript` (Langchain Information Extractor)  
- `OpenAI Chat Model` (Langchain LM Chat OpenAI)  
- `Clean up for mem0` (Code)  
- `Mem0: Add Transcript Memory` (HTTP Request)  
- `Stop and Error` (StopAndError)  
- Sticky Note: “The Notetaking Magic”

**Node Details:**

- **`Webhook: Transcript Ready`**  
  - Type: Webhook (HTTP POST)  
  - Role: Receives notification from VEXA that transcript is available  
  - Config: Path `luffy`, POST method  
  - Outputs: Parallel to fetching transcript and user ID  
  - Failure modes: HTTP errors, invalid payloads

- **`VEXA: Get Transcript`**  
  - Type: HTTP Request (GET)  
  - Role: Retrieves full meeting transcript JSON from VEXA API  
  - Config: URL constructed with meeting ID from webhook  
  - Auth: HTTP Header VEXA API key  
  - On error: continues to StopAndError node  
  - Retries on failure, 5s wait between tries  
  - Failure modes: API throttling, missing transcript, auth failure

- **`Process: Split Transcript Segments`**  
  - Type: SplitOut  
  - Role: Splits transcript's `segments` array into individual items for processing  
  - Config: Splits on `segments` field  
  - Outputs: Sends each segment to next node

- **`Prepare: Select Transcript Data`**  
  - Type: Set  
  - Role: Extracts relevant fields (`speaker`, `text`, `created_at`) from each segment for analysis  
  - Config: Maps JSON properties to clean field names  
  - Outputs: Sends cleaned segment data

- **`Redis: Get User ID`**  
  - Type: Redis Get  
  - Role: Retrieves stored user ID from Redis key `setMem0-userId` to associate transcript with user  
  - Failure modes: Redis errors, missing key

- **`Merge`**  
  - Type: Merge (combine all)  
  - Role: Combines split transcript segments and user ID into single dataset for aggregation  
  - Mode: Combine all incoming items into one

- **`Prepare: Aggregate for Analysis`**  
  - Type: Aggregate  
  - Role: Aggregates all transcript segments data into a single JSON field `summary ` for AI input  
  - Failure modes: Data inconsistencies

- **`AI: Analyze Transcript`**  
  - Type: Langchain Information Extractor  
  - Role: Uses a system prompt to analyze the meeting transcript and extract structured data: summary, sentiment, red flags, next steps, social chatter, user_id  
  - Config:  
    - System prompt defines role as Senior Business Analyst specializing in Conversation Intelligence  
    - Requires attributes: summary, overallSentiment, potential red flags, nextSteps, socialChatter, user_id  
    - Input text is JSON stringified transcript data  
  - Failure modes: AI service limits, malformed input, unexpected output format

- **`OpenAI Chat Model`**  
  - Type: Langchain LM ChatOpenAI  
  - Role: Provides the underlying OpenAI GPT-4o model to power the AI analysis  
  - Config: Model `gpt-4o`, temperature 0.7  
  - Credentials: OpenAI API key  
  - Failure modes: API quota exceeded, network errors

- **`Clean up for mem0`**  
  - Type: Code (JavaScript)  
  - Role: Processes AI output to assemble a Mem0-formatted payload including summary, sentiment, red flags, next steps, social chatter, and user ID  
  - Functions: Converts dates, escapes JSON strings, detects known agent names, constructs metadata and categories  
  - Failure modes: Code exceptions, missing fields

- **`Mem0: Add Transcript Memory`**  
  - Type: HTTP Request (POST)  
  - Role: Sends structured meeting insights to Mem0 API to save as persistent memory  
  - Config: POST to `https://api.mem0.ai/v1/memories/` with JSON body from cleanup node  
  - Auth: HTTP Header with Mem0 API key  
  - Failure modes: API errors, invalid payload

- **`Stop and Error`**  
  - Type: StopAndError  
  - Role: Terminates workflow with error message if transcript retrieval fails

---

#### 1.3 Webhook Registration (Setup)

**Overview:**  
One-time manual trigger to register the n8n webhook URL with VEXA to enable transcript delivery.

**Nodes Involved:**  
- `Register your webhook` (Manual Trigger)  
- `SET your webhook` (HTTP Request)  
- Sticky Note: “Register Your Webhook”

**Node Details:**

- **`Register your webhook`**  
  - Type: Manual Trigger  
  - Role: Starts the webhook registration process manually  
  - Outputs: Sends control to HTTP request node

- **`SET your webhook`**  
  - Type: HTTP Request (PUT)  
  - Role: Updates VEXA user webhook URL to point to n8n webhook endpoint `luffy`  
  - Config: PUT to `https://gateway.dev.vexa.ai/user/webhook` with body containing webhook URL  
  - Auth: HTTP Header with VEXA API key  
  - Failure modes: Network errors, invalid URL, auth errors

---

### 3. Summary Table

| Node Name                      | Node Type                 | Functional Role                              | Input Node(s)                 | Output Node(s)                     | Sticky Note                                                                                                     |
|--------------------------------|---------------------------|----------------------------------------------|------------------------------|----------------------------------|-----------------------------------------------------------------------------------------------------------------|
| vexa-start                     | Webhook                   | Entry webhook receiving bot start/stop commands | —                            | Route: Bot Action (Start/Stop)   | BOT Management                                                                                                  |
| Route: Bot Action (Start/Stop) | Switch                    | Routes to start or stop bot HTTP requests     | vexa-start                   | HTTP: Start VEXA Bot, HTTP: Stop VEXA Bot, No Operation, do nothing | BOT Management                                                                                                  |
| HTTP: Start VEXA Bot           | HTTP Request              | Starts VEXA bot with meeting info              | Route: Bot Action (Start/Stop) | Baserow: Update Status to 'In Progress' | BOT Management                                                                                                  |
| Baserow: Update Status to 'In Progress' | Baserow API                | Updates meeting status to 'In Progress'        | HTTP: Start VEXA Bot         | Baserow : set rowID               | BOT Management                                                                                                  |
| Baserow : set rowID            | Redis Set                 | Stores user ID temporarily                      | Baserow: Update Status to 'In Progress' | —                              | BOT Management                                                                                                  |
| HTTP: Stop VEXA Bot            | HTTP Request              | Stops VEXA bot for meeting                      | Route: Bot Action (Start/Stop) | Baserow: Update Status to 'Stopped', No Operation, do nothing | BOT Management                                                                                                  |
| Baserow: Update Status to 'Stopped' | Baserow API                | Updates meeting status to 'Stopped'             | HTTP: Stop VEXA Bot          | Baserow : set rowID (none connected) | BOT Management                                                                                                  |
| No Operation, do nothing       | NoOp                      | Fallback no-operation end node                  | Route: Bot Action (Start/Stop), HTTP: Stop VEXA Bot | —                              | BOT Management                                                                                                  |
| Webhook: Transcript Ready      | Webhook                   | Receives VEXA transcript ready webhook         | —                            | VEXA: Get Transcript, Redis: Get User ID | The Notetaking Magic                                                                                             |
| VEXA: Get Transcript           | HTTP Request              | Fetches full meeting transcript                 | Webhook: Transcript Ready    | Process: Split Transcript Segments, Stop and Error | The Notetaking Magic                                                                                             |
| Stop and Error                 | StopAndError              | Stops workflow with error if transcript fetch fails | VEXA: Get Transcript (on error) | —                              | The Notetaking Magic                                                                                             |
| Process: Split Transcript Segments | SplitOut                  | Splits transcript into individual segments      | VEXA: Get Transcript          | Prepare: Select Transcript Data    | The Notetaking Magic                                                                                             |
| Prepare: Select Transcript Data | Set                       | Extracts and formats transcript fields          | Process: Split Transcript Segments | Merge                          | The Notetaking Magic                                                                                             |
| Redis: Get User ID             | Redis Get                 | Retrieves stored user ID                          | Webhook: Transcript Ready    | Merge                            | The Notetaking Magic                                                                                             |
| Merge                         | Merge                     | Combines transcript segments and user ID        | Prepare: Select Transcript Data, Redis: Get User ID | Prepare: Aggregate for Analysis   | The Notetaking Magic                                                                                             |
| Prepare: Aggregate for Analysis | Aggregate                 | Aggregates all transcript data for AI input     | Merge                        | AI: Analyze Transcript            | The Notetaking Magic                                                                                             |
| AI: Analyze Transcript         | Langchain Information Extractor | Extracts summary, sentiment, red flags, next steps | Prepare: Aggregate for Analysis | Clean up for mem0                | The Notetaking Magic                                                                                             |
| OpenAI Chat Model              | Langchain LM Chat OpenAI  | Provides GPT-4o model for transcript analysis   | AI: Analyze Transcript       | AI: Analyze Transcript            | The Notetaking Magic                                                                                             |
| Clean up for mem0              | Code                      | Processes AI output and builds Mem0 payload      | AI: Analyze Transcript       | Mem0: Add Transcript Memory       | The Notetaking Magic                                                                                             |
| Mem0: Add Transcript Memory    | HTTP Request              | Saves meeting insights into Mem0 memory          | Clean up for mem0            | —                                | The Notetaking Magic                                                                                             |
| Register your webhook          | Manual Trigger            | Manual start for webhook registration            | —                            | SET your webhook                  | Register Your Webhook                                                                                            |
| SET your webhook               | HTTP Request              | Registers n8n webhook URL with VEXA              | Register your webhook        | —                                | Register Your Webhook                                                                                            |
| Sticky Note                   | StickyNote                | Documentation and instructions                    | —                            | —                                | Covers entire workflow with detailed explanation and setup instructions                                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node `vexa-start`:**  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: `vexa-API`  
   - Allowed Origins: `*`

2. **Create Switch Node `Route: Bot Action (Start/Stop)`:**  
   - Input: From `vexa-start`  
   - Rules:  
     - If `body.items[0]['Send Bot'].value` equals `Start_Bot`, output `Start_Bot`  
     - If equals `Stop_Bot`, output `Stop_Bot`  
     - Else fallback output `no_action`

3. **Create HTTP Request Node `HTTP: Start VEXA Bot`:**  
   - Input: From `Route` `Start_Bot` output  
   - Method: POST  
   - URL: `https://gateway.dev.vexa.ai/bots`  
   - Authentication: HTTP Header with VEXA API key credential  
   - Body (JSON):  
     - `platform`: `"google_meet"`  
     - `native_meeting_id`: Extract URL path from `body.items[0]["Meeting Link"]` removing leading slashes  
     - `language`: `"en"`  
     - `bot_name`: From `body.items[0]["Bot Name"]`  
   - Retry on fail: Enabled (max 2 attempts, 5s intervals)

4. **Create Baserow Node `Baserow: Update Status to 'In Progress'`:**  
   - Input: From `HTTP: Start VEXA Bot`  
   - Operation: Update  
   - Database ID, Table ID: Use your Baserow IDs  
   - Row ID: From `body.items[0].id`  
   - Fields: Set `Status` field to `"In Progress"`  
   - Credentials: Baserow API with proper access

5. **Create Redis Node `Baserow : set rowID`:**  
   - Input: From `Baserow: Update Status to 'In Progress'`  
   - Operation: Set key `setMem0-userId`  
   - Value: From `meeting with` field in JSON  
   - TTL: 3600 seconds  
   - Credentials: Redis connection

6. **Create HTTP Request Node `HTTP: Stop VEXA Bot`:**  
   - Input: From `Route` `Stop_Bot` output  
   - Method: DELETE  
   - URL: `https://gateway.dev.vexa.ai/bots/google_meet/{meetingId}` where meetingId extracted from `body.items[0]['Meeting Link']` URL path (without leading slash)  
   - Auth: HTTP Header VEXA API key  
   - On error: Continue

7. **Create Baserow Node `Baserow: Update Status to 'Stopped'`:**  
   - Input: From `HTTP: Stop VEXA Bot`  
   - Update `Status` field to `"Stop Request"`  
   - Credentials: Baserow API

8. **Create `No Operation, do nothing` Node:**  
   - Input: From `Route` fallback and also from `HTTP: Stop VEXA Bot` second output  

9. **Create Webhook Node `Webhook: Transcript Ready`:**  
   - HTTP Method: POST  
   - Path: `luffy`

10. **Create HTTP Request Node `VEXA: Get Transcript`:**  
    - Input: From `Webhook: Transcript Ready`  
    - Method: GET  
    - URL: `https://gateway.dev.vexa.ai/transcripts/google_meet/{native_meeting_id}` from webhook JSON body  
    - Auth: HTTP Header VEXA API key  
    - Retry on fail enabled (5s wait)  
    - On error: Continue to `Stop and Error`

11. **Create Stop and Error Node `Stop and Error`:**  
    - Input: From `VEXA: Get Transcript` error output  
    - Error message: `"error"`

12. **Create SplitOut Node `Process: Split Transcript Segments`:**  
    - Input: From `VEXA: Get Transcript` success output  
    - Field to split out: `segments`

13. **Create Set Node `Prepare: Select Transcript Data`:**  
    - Input: From `Process: Split Transcript Segments`  
    - Assign:  
      - `speaker` = `$json.speaker`  
      - `meeting_transcript` = `$json.text`  
      - `created_at` = `$json.created_at`

14. **Create Redis Get Node `Redis: Get User ID`:**  
    - Input: From `Webhook: Transcript Ready` (parallel)  
    - Key: `setMem0-userId`

15. **Create Merge Node `Merge`:**  
    - Inputs: From `Prepare: Select Transcript Data` (main input), and `Redis: Get User ID` (second input)  
    - Mode: Combine All

16. **Create Aggregate Node `Prepare: Aggregate for Analysis`:**  
    - Input: From `Merge`  
    - Aggregate all item data into field named `summary `

17. **Create Langchain Information Extractor Node `AI: Analyze Transcript`:**  
    - Input: From `Prepare: Aggregate for Analysis`  
    - Text: JSON stringified input (`{{ JSON.stringify($json) }}`)  
    - System prompt: Senior Business Analyst role with detailed instructions to extract summary, sentiment, red flags, next steps, social chatter, user_id  
    - Attributes required: summary, overallSentiment, potential red flags, nextSteps, socialChatter, user_id

18. **Create Langchain LM Chat OpenAI Node `OpenAI Chat Model`:**  
    - Input: Connected to `AI: Analyze Transcript` as language model  
    - Model: `gpt-4o`  
    - Temperature: 0.7  
    - Credentials: OpenAI API key

19. **Create Code Node `Clean up for mem0`:**  
    - Input: From `AI: Analyze Transcript`  
    - Paste provided JavaScript code that processes AI output to build Mem0 payload, including agent contact detection, JSON escaping, timestamping, and metadata assembly.

20. **Create HTTP Request Node `Mem0: Add Transcript Memory`:**  
    - Input: From `Clean up for mem0`  
    - Method: POST  
    - URL: `https://api.mem0.ai/v1/memories/`  
    - Body: JSON from code node output (`mem0Payload`)  
    - Auth: HTTP Header with Mem0 API key

21. **Create Manual Trigger Node `Register your webhook`:**  
    - For one-time setup

22. **Create HTTP Request Node `SET your webhook`:**  
    - Input: From `Register your webhook`  
    - Method: PUT  
    - URL: `https://gateway.dev.vexa.ai/user/webhook`  
    - Body: JSON with webhook_url set to your n8n webhook endpoint for `luffy`  
    - Auth: HTTP Header with VEXA API key

23. **Add Sticky Notes as per original workflow:**  
    - BOT Management near bot control nodes  
    - The Notetaking Magic near transcript processing and AI analysis nodes  
    - Register Your Webhook near webhook registration nodes  
    - Large explanatory sticky note describing workflow overview and setup instructions

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                          | Context or Link                                                                                          |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| This workflow has two distinct parts managing meeting lifecycle: Bot management via CRM commands and AI-powered transcript analysis. It enables solopreneurs and small businesses to add conversation intelligence easily.                                                                                                                                                             | From large sticky note at top-left of the workflow                                                       |
| Setup requires registering the n8n webhook URL with VEXA, connecting Baserow automation, and configuring API credentials for VEXA, Mem0, OpenAI, and Redis.                                                                                                                                                                                                                           | Setup instructions in large sticky note                                                                 |
| Free Baserow template for bot control panel is available: https://baserow.io/public/grid/t5kYjovKEHjNix2-6Rijk99y4SDeyQY4rmQISciC14w                                                                                                                                                                                                                                               | Baserow template link in sticky note                                                                    |
| To extend, automate follow-ups based on AI next steps/red flags, integrate email or engagement platforms via Mem0, or build fully AI-powered CRM workflows.                                                                                                                                                                                                                           | Suggestions in large sticky note                                                                         |
| Known limitations and potential failure points include: API rate limits, network/auth failures on HTTP requests, Redis connectivity, malformed inputs, and AI service quota or response errors. Proper error handling and retries implemented where possible.                                                                                                                        | Implied from node configurations and error continuations                                                |
| Video explanation and detailed usage instructions are not included but are recommended for end users unfamiliar with n8n or the integrated platforms.                                                                                                                                                                                                                                | Not present in workflow, recommended for users                                                          |

---

**Disclaimer:**  
The provided content originates exclusively from an automated workflow built with n8n, adhering strictly to current content policies without any illegal or protected elements. All processed data is legal and publicly accessible.