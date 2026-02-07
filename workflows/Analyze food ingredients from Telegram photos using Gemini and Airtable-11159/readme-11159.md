Analyze food ingredients from Telegram photos using Gemini and Airtable

https://n8nworkflows.xyz/workflows/analyze-food-ingredients-from-telegram-photos-using-gemini-and-airtable-11159


# Analyze food ingredients from Telegram photos using Gemini and Airtable

### 1. Workflow Overview

This workflow, titled **"Ingredients Analyst"**, is designed to analyze food ingredient information extracted from photos sent via Telegram. It uses Optical Character Recognition (OCR) to read product labels, then applies AI-powered fuzzy matching to compare detected ingredients against personalized "Good" and "Bad" ingredient lists stored in Airtable. The final result indicates whether the product is safe based on strict veto rules, and sends a detailed message back to the user on Telegram. It also logs analysis results to Airtable for record-keeping.

The workflow is logically divided into the following blocks:

- **1.1 Telegram Input/Output:** Receiving photo messages from users and sending analysis results back.
- **1.2 Data Retrieval:** Fetching user-defined ingredient preferences and watchlists from Airtable.
- **1.3 Data Aggregation & Preparation:** Extracting persona, language, and ingredient lists to format prompts for AI.
- **1.4 OCR Text Extraction:** Processing the image via OCR to extract label text.
- **1.5 AI Analysis:** Using Gemini and LangChain AI agents to analyze the OCR text against the ingredient lists with fuzzy matching and veto logic.
- **1.6 Result Parsing & Response:** Parsing AI output JSON, sending Telegram replies, and logging the results.
- **1.7 Completion:** Marking the workflow as finished.

---

### 2. Block-by-Block Analysis

#### 1.1 Telegram Input/Output

**Overview:**  
Handles receiving photo messages via Telegram and sending back formatted analysis results. Ensures interaction with the user is seamless and conversational.

**Nodes Involved:**  
- Telegram Trigger  
- Get a file  
- Send a text message

**Node Details:**  

- **Telegram Trigger**  
  - Type: Telegram Trigger  
  - Role: Listens for incoming Telegram messages, specifically photos, and triggers the workflow.  
  - Configuration: Watches for "message" updates, downloads the message content automatically.  
  - Input: Telegram messages from users.  
  - Output: Message data including photo metadata.  
  - Failure Modes: Network issues, Telegram API rate limits, missing photo attachments.

- **Get a file**  
  - Type: Telegram  
  - Role: Downloads the highest resolution photo from the Telegram message for OCR processing.  
  - Configuration: Uses the file ID of the last photo in the message array.  
  - Input: Photo file ID from Telegram Trigger.  
  - Output: Binary image file for OCR.  
  - Failure Modes: File not found, download errors, expired file IDs.

- **Send a text message**  
  - Type: Telegram  
  - Role: Sends HTML-formatted analysis summary back to the Telegram user.  
  - Configuration: Sends message to the chat ID of the original sender, replies to the original message, uses HTML parse mode.  
  - Input: Parsed AI results (summary, detected good/bad items).  
  - Output: Confirmation of message sent.  
  - Failure Modes: Telegram API errors, invalid chat ID, message formatting errors.

---

#### 1.2 Data Retrieval

**Overview:**  
Fetches user's personalized ingredient watchlist and preferences stored in Airtable to build the knowledge base for AI analysis.

**Nodes Involved:**  
- Watchlist  
- Preferences

**Node Details:**  

- **Watchlist**  
  - Type: Airtable  
  - Role: Retrieves active ingredient entries categorized as "Good Stuff" or "Bad Stuff".  
  - Configuration: Searches the Airtable "Watchlist" table filtering for records where Status = "Active".  
  - Input: Trigger from Telegram Trigger node.  
  - Output: List of active ingredient items.  
  - Failure Modes: Airtable API errors, invalid credentials, empty result sets.

- **Preferences**  
  - Type: Airtable  
  - Role: Retrieves user preferences such as AI persona and language settings.  
  - Configuration: Reads all records from the "Preferences" table once per workflow execution.  
  - Input: Output from Watchlist node.  
  - Output: Preferences key-value pairs, e.g., Persona and Language.  
  - Failure Modes: Airtable API issues, missing preference keys.

---

#### 1.3 Data Aggregation & Preparation

**Overview:**  
Aggregates ingredients and preferences, formats them into structured data for AI prompt construction.

**Nodes Involved:**  
- Data Aggregation

**Node Details:**  

- **Data Aggregation**  
  - Type: Code (JavaScript)  
  - Role: Extracts persona and language preferences, filters active ingredients into "Bad" and "Good" lists, and returns a clean JSON object for AI prompt use.  
  - Configuration: Custom JS code referencing previous Airtable nodes by name to gather data.  
  - Key Variables:  
    - `persona`: AI persona (default: "A helpful assistant")  
    - `language`: Target language (default: "English")  
    - `bad_list`: Comma-separated bad ingredients  
    - `good_list`: Comma-separated good ingredients  
  - Input: Outputs from "Watchlist" and "Preferences" Airtable nodes.  
  - Output: JSON with consolidated prompt data.  
  - Failure Modes: Missing keys in input, unexpected empty datasets, expression errors.

---

#### 1.4 OCR Text Extraction

**Overview:**  
Processes the downloaded photo through OCR to extract textual content of the product label.

**Nodes Involved:**  
- AI OCR Agent  
- OpenAI Chat Model

**Node Details:**  

- **AI OCR Agent**  
  - Type: LangChain Agent  
  - Role: Uses AI prompt to extract full text from the image file.  
  - Configuration: Passes the downloaded binary image, expects text output. Uses prompt to "Extract the full text as output from the document as if you were reading it."  
  - Input: Binary image from "Get a file" node.  
  - Output: OCR text in `output` field.  
  - Failure Modes: OCR inaccuracies, model timeout, fallback to default behavior if no text found.

- **OpenAI Chat Model**  
  - Type: LangChain OpenAI Chat Model  
  - Role: Underlying Optical Character Recognition model. In this setup, uses a local OpenAI-compatible endpoint running a specialized OCR model (`benhaotang/Nanonets-OCR-s:F16`).  
  - Configuration: Model set specifically for OCR task, response format as text.  
  - Input: Image binary from Telegram file.  
  - Output: Raw OCR text.  
  - Failure Modes: Local model unavailability, API authentication errors, processing timeouts.

---

#### 1.5 AI Analysis

**Overview:**  
Analyzes extracted OCR text against personalized ingredient lists applying fuzzy matching and veto logic using hybrid AI agents.

**Nodes Involved:**  
- AI Agent  
- Google Gemini Chat Model

**Node Details:**  

- **AI Agent**  
  - Type: LangChain Agent  
  - Role: Performs fuzzy matching of OCR text ingredients against "Bad" and "Good" lists, applies veto logic, and produces a JSON verdict with detailed summary message in HTML.  
  - Configuration:  
    - Template prompt injects persona, language, bad/good lists, and OCR text.  
    - Strict rules: bad ingredients override good; contradictions are bad; safe only if no bad items detected.  
    - Output: JSON object with detected_bad, detected_good, is_safe boolean, and summary_msg HTML string.  
  - Input: OCR text from AI OCR Agent, aggregated data from Data Aggregation node.  
  - Output: JSON analysis result embedded in a text field.  
  - Failure Modes: AI hallucination, malformed JSON output, prompt injection errors, fuzzy matching inaccuracies.

- **Google Gemini Chat Model**  
  - Type: LangChain Google Gemini Chat Model  
  - Role: Provides the language model backend for the AI Agent node’s analysis. Uses Gemini Flash Lite model.  
  - Configuration: Temperature set low (0.2) for deterministic results.  
  - Input: AI Agent node prompt.  
  - Output: JSON-formatted analysis text.  
  - Failure Modes: API quota limits, authentication failures, model downtime.

---

#### 1.6 Result Parsing & Response

**Overview:**  
Parses AI JSON output, handles errors gracefully, sends Telegram reply, and logs results to Airtable.

**Nodes Involved:**  
- JSON Parse & Routing  
- Send a text message  
- Create a record

**Node Details:**  

- **JSON Parse & Routing**  
  - Type: Code (JavaScript)  
  - Role: Extracts JSON object from AI Agent’s text output, parsing it for further use. Includes error handling fallback if no JSON is found.  
  - Configuration: Uses regex to find JSON substring between braces and parse it. Returns default error JSON if parsing fails.  
  - Input: Text output from AI Agent.  
  - Output: Parsed JSON with keys: is_safe, summary_msg, detected_bad, detected_good.  
  - Failure Modes: AI output missing JSON, regex failures, JSON parse errors.

- **Send a text message**  
  - (Described in 1.1 Telegram Input/Output)  
  - Uses parsed summary and detected ingredient lists to send a formatted reply.

- **Create a record**  
  - Type: Airtable  
  - Role: Logs analysis result to Airtable "Logs" table for record-keeping and audit.  
  - Configuration: Stores message ID, AI summary, and detected bad ingredients. Uses typecasting for field mapping.  
  - Input: Parsed JSON results and Telegram message metadata.  
  - Output: Confirmation of Airtable record creation.  
  - Failure Modes: Airtable API failures, data type mismatches.

---

#### 1.7 Completion

**Overview:**  
Marks the workflow execution as complete, enabling clean end status and readiness for next input.

**Nodes Involved:**  
- Done!

**Node Details:**  

- **Done!**  
  - Type: No Operation (NoOp)  
  - Role: Placeholder to mark workflow completion after Airtable logging.  
  - Input: Output from Create a record node.  
  - Output: None (end of workflow).  
  - Failure Modes: None; purely structural.

---

### 3. Summary Table

| Node Name          | Node Type                        | Functional Role                        | Input Node(s)           | Output Node(s)         | Sticky Note                                                                                                            |
|--------------------|---------------------------------|-------------------------------------|-------------------------|------------------------|------------------------------------------------------------------------------------------------------------------------|
| Telegram Trigger    | Telegram Trigger                | Receives photo messages from users | None                    | Watchlist              | Connect your Telegram Bot and configure API token. Listens for photos and downloads them automatically.               |
| Watchlist          | Airtable                       | Fetch active ingredient watchlist  | Telegram Trigger        | Preferences            |                                                                                                                        |
| Preferences        | Airtable                       | Fetch user preferences (Persona, Language) | Watchlist               | Data Aggregation       |                                                                                                                        |
| Data Aggregation    | Code                          | Aggregate and format ingredient data | Preferences             | Get a file             | Enforces that Bad Stuff always overrides Good Stuff. Pulls personal watchlist and preferences from Airtable.          |
| Get a file         | Telegram                       | Download highest-resolution photo  | Data Aggregation        | AI OCR Agent           |                                                                                                                        |
| AI OCR Agent       | LangChain Agent               | Extract OCR text from photo        | Get a file              | AI Agent               | OCR uses local OpenAI-compatible model for text extraction. Hybrid AI architecture separates OCR and analysis.        |
| OpenAI Chat Model  | LangChain OpenAI Model        | Local OCR model                    | AI OCR Agent (via LangChain) | AI OCR Agent         | Uses specialized OCR model `benhaotang/Nanonets-OCR-s:F16`.                                                          |
| AI Agent           | LangChain Agent               | Analyze OCR text vs ingredient lists | AI OCR Agent, Data Aggregation | JSON Parse & Routing | Applies fuzzy matching and veto rules using Gemini AI. Strict logic ensures safety verdicts.                          |
| Google Gemini Chat Model | LangChain Google Gemini Model | Backend AI language model          | AI Agent (via LangChain) | AI Agent               | Gemini Flash Lite model with low temperature for deterministic analysis.                                               |
| JSON Parse & Routing | Code                          | Parse AI JSON output safely         | AI Agent                | Send a text message    | Cleans AI output, extracts JSON or returns error fallback.                                                            |
| Send a text message | Telegram                       | Send analysis summary to user      | JSON Parse & Routing    | Create a record        | Replies with HTML formatted message including detected items and safety summary.                                       |
| Create a record    | Airtable                       | Log analysis result in Airtable    | Send a text message     | Done!                  |                                                                                                                        |
| Done!              | NoOp                          | Marks workflow completion          | Create a record         | None                   | Workflow finished successfully.                                                                                        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Credential:**  
   - Obtain bot token from @BotFather on Telegram.  
   - In n8n, create a Telegram API credential with this token.

2. **Telegram Trigger:**  
   - Add a Telegram Trigger node.  
   - Configure to listen for "message" updates and enable automatic download.  
   - Attach the Telegram API credential.

3. **Watchlist Airtable Node:**  
   - Add an Airtable node named "Watchlist."  
   - Set operation to "search."  
   - Use your Airtable base and table that contains ingredient watchlist.  
   - Filter with formula: `Status = "Active"` to get active records.  
   - Attach Airtable Personal Access Token credential.

4. **Preferences Airtable Node:**  
   - Add an Airtable node named "Preferences."  
   - Set operation to "search" without filter (fetch all).  
   - Use your Airtable base and Preferences table.  
   - Set to execute once per workflow run.  
   - Attach Airtable credential.

5. **Data Aggregation Code Node:**  
   - Add a Code node named "Data Aggregation."  
   - Write JavaScript to:  
     - Extract persona and language from Preferences.  
     - Filter Watchlist items into "Bad Stuff" and "Good Stuff" lists (only active).  
     - Return JSON object with persona, target_language, bad_list, good_list as strings.  
   - Connect output of Preferences node to this node.

6. **Get a file Telegram Node:**  
   - Add Telegram node "Get a file."  
   - Configure to download photo file using expression referencing the last photo's file_id from Telegram Trigger node.  
   - Attach Telegram credential.

7. **AI OCR Agent (LangChain Agent):**  
   - Add LangChain Agent node named "AI OCR Agent."  
   - Configure prompt to: "Extract the full text as output from the document as if you were reading it."  
   - Enable passthrough of binary images.  
   - Enable fallback.  
   - Connect output of Get a file node here.

8. **OpenAI Chat Model (OCR model):**  
   - Add LangChain OpenAI Chat Model node.  
   - Set model to local OCR model ID: `benhaotang/Nanonets-OCR-s:F16`.  
   - Set response format to "text."  
   - Attach your OpenAI API credential (or local compatible endpoint).  
   - Connect this node as AI language model backend to AI OCR Agent node.

9. **AI Agent node (Ingredient Analyzer):**  
   - Add LangChain Agent node named "AI Agent."  
   - Configure prompt with:  
     - Persona, language, bad_list, good_list injected from Data Aggregation node outputs.  
     - OCR text injected from AI OCR Agent output.  
     - Instructions enforcing fuzzy matching, veto rules, and output JSON format with keys: detected_bad, detected_good, is_safe, summary_msg in HTML.  
   - Connect AI OCR Agent node output as input.  
   - Connect Data Aggregation node output to use variables in prompt.  
   - Attach Google Gemini Chat Model node as AI language model backend.

10. **Google Gemini Chat Model node:**  
    - Add LangChain Google Gemini Chat Model node.  
    - Set model name: `models/gemini-2.0-flash-lite-001`.  
    - Set temperature to 0.2 for deterministic outputs.  
    - Attach Google PaLM API credential.

11. **JSON Parse & Routing Code Node:**  
    - Add Code node "JSON Parse & Routing."  
    - Write JavaScript to extract JSON substring from AI Agent’s output text (regex for JSON braces).  
    - Parse JSON or fallback to error JSON with `is_safe: false`.  
    - Connect AI Agent node output here.

12. **Send a text message Telegram Node:**  
    - Add Telegram node "Send a text message."  
    - Configure message text using expressions referencing JSON Parse & Routing node:  
      - Show summary_msg (HTML), detected_bad, detected_good lists.  
    - Send message to chat ID of original Telegram Trigger message.  
    - Enable reply to original message ID.  
    - Use HTML parse mode.  
    - Attach Telegram credential.

13. **Create a record Airtable Node:**  
    - Add Airtable node "Create a record."  
    - Configure to create a new record in your Airtable Logs table.  
    - Map fields:  
      - Message ID: from Telegram message ID.  
      - AI Response: from parsed summary_msg.  
      - Detected Stuff: comma-separated detected_bad list.  
    - Use Airtable Personal Access Token credential.

14. **Done! NoOp Node:**  
    - Add a No Operation node called "Done!"  
    - Connect Create a record node output here to mark workflow end.

15. **Connect all nodes as per the described flow:**  
    - Telegram Trigger → Watchlist → Preferences → Data Aggregation → Get a file → AI OCR Agent → AI Agent → JSON Parse & Routing → Send a text message → Create a record → Done!  
    - OpenAI Chat Model connected as AI model to AI OCR Agent.  
    - Google Gemini Chat Model connected as AI model to AI Agent.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                              | Context or Link                                                                                         |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| 🛡️ Personal Ingredient Bodyguard: Turns Telegram into a smart food safety scanner by analyzing photos of product labels. Requires Airtable setup with specific base and tables for watchlist and preferences.                               | [Airtable Base Copy Link](https://airtable.com/appwuO8h6qLVULY20/shrYVCqWgPtFDPz0q)                   |
| Setup tutorial video to connect n8n with Airtable API key: 5-minute guide to generate and configure Airtable credentials.                                                                                                                | [YouTube Tutorial](https://www.youtube.com/watch?v=xFFfkBeI2rQ)                                        |
| Hybrid AI Architecture note: OCR is done locally or via a specialized OpenAI-compatible model to save cost and improve privacy; Gemini AI performs the logical ingredient analysis with strict veto rules.                                 | See Sticky Note2 content for detailed architecture explanation.                                        |
| Important disclaimer: This workflow is for informational purposes only. It is not medical advice. OCR and AI can make errors—always verify physical labels independently. Use at your own risk.                                           | Included in Sticky Note content.                                                                       |
| Telegram Bot setup instructions: Use @BotFather to create bot and obtain API token. Configure n8n Telegram credentials accordingly.                                                                                                       | See Sticky Note1 for detailed instructions.                                                           |
| Logic note: "Bad Stuff" ingredients always override "Good Stuff." Contradictions are treated as bad for safety.                                                                                                                         | Explained in Data Aggregation and AI Agent prompt logic.                                              |
| Workflow complete status indicates successful image processing, ingredient analysis, Telegram response sent, and logging to Airtable.                                                                                                   | See Sticky Note4 for summary of workflow completion steps.                                            |

---

**Disclaimer:** The text provided originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.