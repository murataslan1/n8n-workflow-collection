Automate Twitter Posting with GPT-4 Content Generation & Google Sheets Tracking

https://n8nworkflows.xyz/workflows/automate-twitter-posting-with-gpt-4-content-generation---google-sheets-tracking-8010


# Automate Twitter Posting with GPT-4 Content Generation & Google Sheets Tracking

### 1. Workflow Overview

This workflow automates the generation and posting of tweets on Twitter (X.com) using AI-generated content and tracks published tweets in a Google Sheet to avoid duplicates. It targets social media managers and digital marketers aiming to maintain consistent, engaging, and unique posts focused on AI, cloud technology, and software development topics.

The workflow is organized into the following logical blocks:

- **1.1 Scheduler Trigger:** Initiates the workflow every 6 hours.
- **1.2 AI Content Generation:** Uses a Langchain AI Agent with GPT-4 and a memory buffer to draft tweets based on a detailed prompt.
- **1.3 Google Sheets Integration:** Retrieves existing tweet records to prevent duplicates and logs new tweets after posting.
- **1.4 Tweet Parsing and Posting:** Parses AI-generated raw text into structured JSON, then posts the tweet on Twitter (X).
- **1.5 Post-Publication Tracking:** Logs posted tweets back into Google Sheets, completing the validation loop.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduler Trigger

- **Overview:**  
  Automatically triggers the workflow every 6 hours to ensure regular tweet generation and posting without manual intervention.

- **Nodes Involved:**  
  - Start Workflow (Schedule Trigger)

- **Node Details:**  
  - **Start Workflow**  
    - Type: Schedule Trigger  
    - Configuration: Triggers every 6 hours  
    - Input: None (trigger node)  
    - Output: Initiates AI Agent node  
    - Edge cases: Scheduler misconfiguration or system downtime may delay execution.

- **Sticky Note:**  
  > Step 1: Scheduler Trigger  
  > This node acts as the workflow’s timer ⏱️. It is configured to automatically trigger the workflow every **6 hours**, ensuring that new tweet content is generated and posted consistently without requiring manual input.

---

#### 2.2 AI Content Generation

- **Overview:**  
  This block uses an AI Agent powered by GPT-4 to generate tweets based on a strict prompt with character limits, thematic focus, and formatting requirements. It leverages a memory buffer for conversational context and accesses Google Sheets data to avoid duplicate tweets.

- **Nodes Involved:**  
  - AI Agent  
  - OpenAI Chat Model  
  - Simple Memory  
  - Get Data from Google Sheet

- **Node Details:**  
  - **AI Agent**  
    - Type: Langchain Agent node  
    - Role: Core content creator using a detailed prompt to generate tweets  
    - Configuration:  
      - Prompt instructs the AI to generate tweets ≤250 characters, include specific hashtags (#Intuz mandatory), URLs depending on topic (MLOpsCrew for cloud-related, Intuz otherwise), and drive engagement through CTAs/questions.  
      - Checks existing tweets from Google Sheets to avoid duplication.  
      - Output format is JSON including tweet content, character count, and status.  
    - Inputs:  
      - Receives session context from Simple Memory  
      - Receives list of existing tweets from Google Sheets (via ai_tool input)  
      - Uses OpenAI Chat Model as language model  
    - Outputs: Raw AI-generated tweet response string to Parse AI Response node  
    - Edge cases:  
      - AI output not conforming to JSON format  
      - Rate limits or authentication errors from OpenAI  
      - Missing or invalid Google Sheets data causing duplicate checks to fail  

  - **OpenAI Chat Model**  
    - Type: Langchain OpenAI chat node  
    - Role: Provides GPT-4 model ("gpt-4.1-mini") for AI Agent  
    - Configuration: Uses GPT-4.1-mini model, no additional options set  
    - Inputs: Triggered by AI Agent  
    - Outputs: AI-generated text to AI Agent  
    - Edge cases: API limits, connectivity issues  

  - **Simple Memory**  
    - Type: Langchain memoryBufferWindow  
    - Role: Maintains conversation/session context with 15-message window, keyed by "TWEETS" session key  
    - Inputs: Receives from AI Agent output, feeds back as context to AI Agent  
    - Outputs: Provides session context to AI Agent  
    - Edge cases: Memory overflow or corruption could impact context continuity  

  - **Get Data from Google Sheet**  
    - Type: Google Sheets Tool (v4.7)  
    - Role: Retrieves existing tweet entries from Google Sheet to check duplicates  
    - Configuration:  
      - Document ID and Sheet GID must be set to target the "Tweets" sheet with columns "Tweet Content" and "Status"  
    - Inputs: Triggered by AI Agent to provide existing tweets list as ai_tool input  
    - Outputs: Sends rows to AI Agent for duplicate comparison  
    - Edge cases:  
      - Incorrect document ID or permissions issues  
      - Empty or malformed sheet data causing duplicate check errors  

- **Sticky Notes:**  
  - Step 2: AI Agent Node — details the AI Agent role as the content brain 🧠.  
  - Step 2.1: AI Agent Node — emphasizes prompt control and content quality.  
  - Step 2.2: Simple Memory Node — explains context storage for continuity.  
  - Step 2.3: Get Rows from Google Sheet Node — ensures duplicate avoidance by retrieving past tweets.

---

#### 2.3 Tweet Parsing and Posting

- **Overview:**  
  Parses the AI Agent's raw string response into JSON, extracting tweet content and metadata, then posts the tweet to Twitter (X).

- **Nodes Involved:**  
  - Parse AI Response (Code node)  
  - Create Tweet (Twitter node)

- **Node Details:**  
  - **Parse AI Response**  
    - Type: Code node (JavaScript)  
    - Role: Cleans and parses raw AI output string into JSON format  
    - Configuration:  
      - Attempts direct JSON.parse; if fails, uses regex to extract JSON substring and parse it  
      - Returns parsed JSON or error object  
    - Inputs: Raw text from AI Agent  
    - Outputs: Structured JSON with keys: tweet_content, character_count, status  
    - Edge cases:  
      - Malformed AI response causing parse failure  
      - Missing required JSON keys causing downstream errors  

  - **Create Tweet**  
    - Type: Twitter node (v2)  
    - Role: Posts the parsed tweet content to Twitter (X)  
    - Configuration:  
      - Text parameter set dynamically using parsed tweet_content  
      - Requires Twitter credentials (OAuth2) configured in n8n  
    - Inputs: Parsed JSON from Parse AI Response  
    - Outputs: Response from Twitter API, forwarded to log node  
    - Edge cases:  
      - Twitter API authentication failure or rate limiting  
      - Posting content exceeding Twitter limits (though AI prompt prevents this)  
      - Network or API downtime  

- **Sticky Notes:**  
  - Step 3: Code Node — parsing raw AI response into JSON.  
  - Step 4: X Create Tweet Node — automated publishing and ensuring content validity.

---

#### 2.4 Post-Publication Tracking

- **Overview:**  
  Logs each published tweet and its status into Google Sheets, maintaining a record to prevent duplicate content in future runs.

- **Nodes Involved:**  
  - Add new Tweet to Google sheet

- **Node Details:**  
  - **Add new Tweet to Google sheet**  
    - Type: Google Sheets (v4.7)  
    - Role: Appends or updates a row with the tweet content and status as "Published"  
    - Configuration:  
      - Uses same Google Sheet document and sheet as Get Data node  
      - Columns: "Tweet Content" and "Status" mapped from parsed AI response  
      - Append or update mode based on "Tweet Content" matching  
    - Inputs: Output from Create Tweet node  
    - Outputs: Confirmation of sheet update  
    - Edge cases:  
      - Permission errors or connectivity issues with Google Sheets  
      - Conflicts on matching rows causing failed updates  

- **Sticky Note:**  
  > Step 5: Add New Tweet to Google Sheet Node  
  > Logs each newly published tweet into the connected Google Sheet, recording content and status to maintain history and prevent duplicates.

---

### 3. Summary Table

| Node Name                  | Node Type                               | Functional Role                        | Input Node(s)           | Output Node(s)               | Sticky Note                                                                                                                         |
|----------------------------|---------------------------------------|-------------------------------------|-------------------------|-----------------------------|-------------------------------------------------------------------------------------------------------------------------------------|
| Start Workflow             | Schedule Trigger                      | Workflow timer to trigger every 6h | None                    | AI Agent                    | Step 1: Scheduler Trigger: triggers workflow every 6 hours                                                                         |
| AI Agent                  | Langchain Agent                       | Core AI content generator for tweets| Start Workflow, Simple Memory, Get Data from Google Sheet, OpenAI Chat Model | Parse AI Response             | Step 2 & 2.1: AI Agent Node: content brain 🧠 using detailed prompt                                                                |
| OpenAI Chat Model          | Langchain OpenAI Chat                 | Provides GPT-4 model to AI Agent    | AI Agent                 | AI Agent                    | Step 2.1: AI Agent Node (same as AI Agent)                                                                                        |
| Simple Memory              | Langchain memoryBufferWindow          | Maintains session context for AI    | AI Agent                 | AI Agent                    | Step 2.2: Simple Memory Node: context store 🧠                                                                                      |
| Get Data from Google Sheet | Google Sheets Tool                    | Retrieves existing tweets for check | AI Agent                 | AI Agent                    | Step 2.3: Get Rows from Google Sheet: prevents duplicate tweets                                                                    |
| Parse AI Response          | Code (JavaScript)                    | Parses raw AI string output to JSON | AI Agent                 | Create Tweet                | Step 3: Code Node: parse AI response into JSON                                                                                      |
| Create Tweet               | Twitter                              | Posts tweet to Twitter (X)          | Parse AI Response        | Add new Tweet to Google sheet | Step 4: X Create Tweet Node: posts AI-generated tweet                                                                              |
| Add new Tweet to Google sheet | Google Sheets                       | Logs published tweet to Google Sheet| Create Tweet             | None                       | Step 5: Add New Tweet to Google Sheet: logs tweet content & status to avoid duplicates                                              |
| Sticky Note (multiple)     | Sticky Note                         | Documentation and explanation nodes | None                    | None                       | See section 2 for details                                                                                                           |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**  
   - Type: Schedule Trigger  
   - Set to trigger every 6 hours (hoursInterval: 6)  
   - Position as preferred (e.g., leftmost in canvas)

2. **Create Langchain OpenAI Chat Model Node**  
   - Type: Langchain OpenAI Chat  
   - Select model: "gpt-4.1-mini"  
   - Connect OpenAI API credentials  
   - No additional options needed

3. **Create Langchain Simple Memory Node**  
   - Type: memoryBufferWindow  
   - Set sessionKey: "TWEETS"  
   - sessionIdType: "customKey"  
   - contextWindowLength: 15  
   - This node maintains conversation context

4. **Create Langchain AI Agent Node**  
   - Type: Langchain Agent  
   - Configure prompt text exactly as provided (carefully replicate instructions about tweet length, hashtags, URLs, tone, output format)  
   - Set promptType: "define"  
   - Connect inputs:  
     - From Schedule Trigger (main)  
     - From Simple Memory (ai_memory)  
     - From OpenAI Chat Model (ai_languageModel)  
     - From Google Sheets Get Data node (ai_tool)  
   - Connect output to Parse AI Response node

5. **Create Google Sheets Tool Node (Get Data from Google Sheet)**  
   - Type: Google Sheets Tool (v4.7)  
   - Set Document ID to your Google Sheet’s ID  
   - Set Sheet Name to "gid=0" or your target sheet  
   - Ensure columns: "Tweet Content", "Status" exist in sheet  
   - Connect output to AI Agent ai_tool input

6. **Create Code Node (Parse AI Response)**  
   - Type: Code (JavaScript)  
   - Paste JS code that safely parses AI raw string into JSON (as provided)  
   - Input: AI Agent raw output  
   - Output: parsed JSON object with keys tweet_content, character_count, status  
   - Connect output to Create Tweet node

7. **Create Twitter Node (Create Tweet)**  
   - Type: Twitter (v2)  
   - Configure credentials with your Twitter OAuth2  
   - Text parameter: `={{ $json.tweet_content }}`  
   - Input: parsed JSON from Code Node  
   - Output: connect to Add new Tweet to Google Sheet node

8. **Create Google Sheets Node (Add new Tweet to Google Sheet)**  
   - Type: Google Sheets (v4.7)  
   - Document ID and Sheet Name same as Get Data node  
   - Operation: Append or Update  
   - Columns mapped:  
     - "Tweet Content" = `={{ $('Parse AI Response').item.json.tweet_content }}`  
     - "Status" = `={{ $('Parse AI Response').item.json.status }}`  
   - Matching column: "Tweet Content" (to avoid duplicates)  
   - Input: from Create Tweet node

9. **Link all nodes in order:**  
   - Schedule Trigger → AI Agent  
   - AI Agent → Parse AI Response  
   - Parse AI Response → Create Tweet  
   - Create Tweet → Add new Tweet to Google Sheet  
   - Get Data from Google Sheet → AI Agent (ai_tool)  
   - OpenAI Chat Model → AI Agent (ai_languageModel)  
   - Simple Memory → AI Agent (ai_memory)  

10. **Configure all credentials:**  
    - Google: Google Sheets and Drive with read/write permissions  
    - OpenAI: API key for GPT-4  
    - Twitter: OAuth2 credentials for posting tweets

11. **Create Google Sheet:**  
    - Columns: "Tweet Content" and "Status" (case-sensitive)  
    - Share with Google API service account or OAuth user

12. **Test workflow:**  
    - Trigger manually or wait for scheduled run  
    - Verify tweets posted and logged correctly  
    - Check that duplicates are avoided by inspecting Google Sheets

---

### 5. General Notes & Resources

| Note Content                                                                                                         | Context or Link                                            |
|----------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------|
| Google Sheets prerequisites: enable Google Sheets and Drive APIs, create sheet with columns "Tweet Content" and "Status". | Sticky Note8 in workflow; essential setup instructions     |
| OpenAI API key required and must be connected to OpenAI Chat Model node with GPT-4 access.                            | Sticky Note8                                                |
| Twitter OAuth2 credentials required for Create Tweet node to post on X (Twitter).                                     | Sticky Note8                                                |
| For support or custom workflow development, contact: getstarted@intuz.com or visit https://www.intuz.com/             | Sticky Note23                                               |
| The AI prompt is carefully crafted to manage tweet length, content focus, hashtags, URLs, and tone for lead generation. | AI Agent node parameters and Sticky Notes 1 & 2             |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow constructed with n8n, an integration and automation tool. The processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All manipulated data is legal and public.