AI Industry Trend Monitor 24/7 Across X, Gmail, and Websites Using GPT-5

https://n8nworkflows.xyz/workflows/ai-industry-trend-monitor-24-7-across-x--gmail--and-websites-using-gpt-5-9938


# AI Industry Trend Monitor 24/7 Across X, Gmail, and Websites Using GPT-5

### 1. Workflow Overview

This workflow, titled **"AI Industry Trend Monitor 24/7 Across X, Gmail, and Websites Using GPT-5,"** is designed to continuously monitor and analyze industry trends related to AI by aggregating data from multiple sources: X (formerly Twitter), Gmail newsletters and messages, and curated websites. It leverages GPT-5 and other AI tools to interpret, synthesize, and store insights on emerging trends. The workflow is scheduled to run daily at 6 AM, automating end-to-end data collection, processing, AI-assisted analysis, and storage.

The workflow’s logic is divided into the following main blocks:

- **1.1 Scheduling and Instruction Initialization:** Triggers the workflow daily and sets initial processing instructions.
- **1.2 Twitter (X) Data Collection and Aggregation:** Retrieves X accounts, fetches tweets, filters and aggregates them.
- **1.3 Gmail Newsletter and Email Processing:** Retrieves newsletters and emails, filters messages, selects fields, and aggregates email data.
- **1.4 Website Content Extraction and Processing:** Loads websites from a Google Sheet, uses a browser agent to scrape content, and aggregates website data.
- **1.5 AI Processing and Agent Workflow:** Invokes AI agents (using GPT-5 and Perplexity AI) to analyze the aggregated data, parse outputs, and split results for saving.
- **1.6 Data Saving and Session Management:** Saves processed data to Google Sheets and manages browser sessions.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduling and Instruction Initialization

- **Overview:**  
  This block triggers the entire workflow every day at 6 AM and sets the initial instructions for subsequent data handling nodes.

- **Nodes Involved:**  
  - Every Day 6 AM  
  - Your Instructions  
  - Get X Accounts  

- **Node Details:**

  - **Every Day 6 AM**  
    - Type: Schedule Trigger  
    - Configuration: Default daily trigger at 6 AM (local server time assumed)  
    - Inputs: None (start node)  
    - Outputs: Connects to "Your Instructions"  
    - Potential Failures: Workflow not triggered if server time misconfigured or if n8n is down.

  - **Your Instructions**  
    - Type: Set  
    - Configuration: Sets variables or text instructions for downstream nodes (exact content not specified)  
    - Inputs: From "Every Day 6 AM"  
    - Outputs: Connects to "Get X Accounts"  
    - Edge Cases: Expression errors if references missing or malformed.

  - **Get X Accounts**  
    - Type: Google Sheets  
    - Configuration: Reads X account data (usernames, IDs) from a predefined Google Sheet  
    - Inputs: From "Your Instructions"  
    - Outputs: Connects to "Get Tweets"  
    - Edge Cases: Authentication failure, empty sheet, or rate limits.

---

#### 1.2 Twitter (X) Data Collection and Aggregation

- **Overview:**  
  Fetches tweets from specified X accounts, filters relevant fields, applies filters, and aggregates the tweets for analysis.

- **Nodes Involved:**  
  - Get Tweets  
  - Select Fields  
  - Filter  
  - Aggregate Tweets  
  - Get Newsletters (connected downstream to Aggregate Tweets)

- **Node Details:**

  - **Get Tweets**  
    - Type: HTTP Request  
    - Configuration: Calls X API endpoints to fetch tweets for accounts from the previous node  
    - Inputs: From "Get X Accounts"  
    - Outputs: Connects to "Select Fields"  
    - Edge Cases: API authentication errors, rate limits, empty responses.

  - **Select Fields**  
    - Type: Set  
    - Configuration: Selects and formats relevant tweet data fields (e.g., text, timestamp, author)  
    - Inputs: From "Get Tweets"  
    - Outputs: Connects to "Filter"  
    - Edge Cases: Incorrect or missing fields causing expression errors.

  - **Filter**  
    - Type: Filter  
    - Configuration: Filters tweets based on criteria (e.g., keywords, engagement thresholds)  
    - Inputs: From "Select Fields"  
    - Outputs: Connects to "Aggregate Tweets"  
    - Edge Cases: Incorrect filter conditions or empty outputs.

  - **Aggregate Tweets**  
    - Type: Aggregate  
    - Configuration: Aggregates filtered tweets, possibly summarizing or counting occurrences  
    - Inputs: From "Filter"  
    - Outputs: Connects to "Get Newsletters"  
    - Edge Cases: Large data sets could cause performance issues.

  - **Get Newsletters**  
    - Type: Google Sheets  
    - Configuration: Pulls newsletter data from a Google Sheet, used later for email processing  
    - Inputs: From "Aggregate Tweets"  
    - Outputs: Connects to "Filter String" (email filtering)  
    - Edge Cases: Sheet access issues.

---

#### 1.3 Gmail Newsletter and Email Processing

- **Overview:**  
  Retrieves and filters emails and newsletters from Gmail, selects relevant fields, aggregates emails, and prepares data for AI analysis.

- **Nodes Involved:**  
  - Get Newsletters  
  - Filter String  
  - Get many messages  
  - Get a message  
  - Select Fields1  
  - Aggregate Emails  
  - Session  
  - Window  

- **Node Details:**

  - **Get Newsletters**  
    - Type: Google Sheets  
    - Configuration: Same as above; reads newsletters list or metadata  
    - Inputs: From "Aggregate Tweets"  
    - Outputs: Connects to "Filter String"  
    - Edge Cases: Authentication or data format errors.

  - **Filter String**  
    - Type: Set  
    - Configuration: Prepares filter strings or criteria for Gmail message query  
    - Inputs: From "Get Newsletters"  
    - Outputs: Connects to "Get many messages"  
    - Edge Cases: Malformed filter criteria.

  - **Get many messages**  
    - Type: Gmail  
    - Configuration: Fetches multiple Gmail messages based on filter criteria  
    - Inputs: From "Filter String"  
    - Outputs: Connects to "Get a message"  
    - Edge Cases: Gmail API limits, authentication errors.

  - **Get a message**  
    - Type: Gmail  
    - Configuration: Retrieves full content of individual messages  
    - Inputs: From "Get many messages"  
    - Outputs: Connects to "Select Fields1"  
    - Edge Cases: Message not found, permission errors.

  - **Select Fields1**  
    - Type: Set  
    - Configuration: Selects relevant email fields such as sender, subject, body snippet  
    - Inputs: From "Get a message"  
    - Outputs: Connects to "Aggregate Emails"  
    - Edge Cases: Missing fields or parsing errors.

  - **Aggregate Emails**  
    - Type: Aggregate  
    - Configuration: Aggregates all selected emails for analysis  
    - Inputs: From "Select Fields1"  
    - Outputs: Connects to "Session"  
    - Edge Cases: Large data volumes.

  - **Session**  
    - Type: Airtop (browser automation session)  
    - Configuration: Starts a browser session, likely for website scraping (see next block)  
    - Inputs: From "Aggregate Emails"  
    - Outputs: Connects to "Window"  
    - Execute Once: true (only initiated once per run)  
    - Edge Cases: Browser session startup failure.

  - **Window**  
    - Type: Airtop (browser window)  
    - Configuration: Opens a browser window within the session  
    - Inputs: From "Session"  
    - Outputs: Connects to "Get Websites"  
    - Execute Once: true  
    - Edge Cases: Window creation failure.

---

#### 1.4 Website Content Extraction and Processing

- **Overview:**  
  Reads websites from Google Sheets, uses a browser agent to load and scrape content, aggregates website data, and terminates sessions.

- **Nodes Involved:**  
  - Get Websites  
  - Browser Agent  
  - Aggregate Websites  
  - Terminate a session  

- **Node Details:**

  - **Get Websites**  
    - Type: Google Sheets  
    - Configuration: Reads list of websites to monitor  
    - Inputs: From "Window"  
    - Outputs: Connects to "Browser Agent"  
    - Edge Cases: Sheet access or data formatting errors.

  - **Browser Agent**  
    - Type: Langchain Agent (browser automation with AI)  
    - Configuration: Uses AI-powered browser to load URLs, extract content, and possibly summarize  
    - Inputs: From "Get Websites" (main), AI model and memory inputs also connected  
    - Outputs: Connects to "Aggregate Websites"  
    - Retries on failure with 5 seconds wait  
    - Edge Cases: Page loading failures, AI API errors, timeout.

  - **Aggregate Websites**  
    - Type: Aggregate  
    - Configuration: Aggregates the scraped website content for analysis  
    - Inputs: From "Browser Agent"  
    - Outputs: Connects to "Terminate a session"  
    - Edge Cases: Large data handling.

  - **Terminate a session**  
    - Type: Airtop  
    - Configuration: Closes the browser session to free resources  
    - Inputs: From "Aggregate Websites"  
    - Outputs: Connects to "AI Agent"  
    - Edge Cases: Session termination failure.

---

#### 1.5 AI Processing and Agent Workflow

- **Overview:**  
  Performs AI-driven analysis using GPT-5 and Perplexity AI, parses AI outputs, splits results, and prepares for saving.

- **Nodes Involved:**  
  - AI Agent  
  - Split Out  
  - Save  
  - Perplexity AI  
  - GPT  
  - JSON  
  - JSON1  
  - OpenAI  
  - Simple Memory  
  - Query  
  - Load URL  

- **Node Details:**

  - **AI Agent**  
    - Type: Langchain Agent (AI orchestration)  
    - Configuration: Main AI processing node using GPT-5 and other AI models with structured output parsing  
    - Inputs: From "Terminate a session"  
    - Outputs: Connects to "Split Out"  
    - Edge Cases: API failures, parsing errors, rate limits.

  - **Split Out**  
    - Type: Split Out  
    - Configuration: Splits AI output into manageable segments for saving or further processing  
    - Inputs: From "AI Agent"  
    - Outputs: Connects to "Save"  
    - Edge Cases: Empty or malformed input data.

  - **Save**  
    - Type: Google Sheets  
    - Configuration: Saves final structured data into a Google Sheet for record keeping and later review  
    - Inputs: From "Split Out"  
    - Outputs: None (terminal)  
    - Edge Cases: Authentication failures, quota limits.

  - **Perplexity AI**  
    - Type: Perplexity AI Tool  
    - Configuration: Additional AI querying tool to augment AI Agent insights  
    - Inputs: From "AI Agent" (as ai_tool)  
    - Outputs: Connects back to "AI Agent" (forming an AI tool chain)  
    - Edge Cases: API timeout, quota limits.

  - **GPT**  
    - Type: Langchain OpenAI Chat Model  
    - Configuration: GPT-5 model for chat completions  
    - Inputs: Connected as ai_languageModel for "AI Agent"  
    - Outputs: AI Agent uses its output  
    - Edge Cases: API key issues, rate limiting.

  - **JSON** and **JSON1**  
    - Type: Langchain Output Parser Structured  
    - Configuration: Parses structured JSON output from AI Agent and Browser Agent respectively  
    - Inputs: Connected to AI nodes for output parsing  
    - Outputs: Parsed data for downstream nodes  
    - Edge Cases: Malformed JSON in AI output.

  - **OpenAI**  
    - Type: Langchain OpenAI Chat Model  
    - Configuration: Used as language model for "Browser Agent" AI tasks  
    - Inputs: ai_languageModel for Browser Agent  
    - Outputs: Browser Agent processes outputs  
    - Edge Cases: Similar to GPT node.

  - **Simple Memory**  
    - Type: Langchain Memory Buffer Window  
    - Configuration: Maintains recent interaction context for the Browser Agent AI  
    - Inputs: ai_memory for Browser Agent  
    - Outputs: Contextual input for Browser Agent  
    - Edge Cases: Memory overflow or reset conditions.

  - **Query** and **Load URL**  
    - Type: Airtop Tool nodes  
    - Configuration: Provide AI Agent tools for querying and loading URLs during AI processing  
    - Inputs: Connected to Browser Agent as AI tools  
    - Outputs: Feed results into Browser Agent  
    - Edge Cases: Tool failures or timeouts.

---

#### 1.6 Data Saving and Session Management

- **Overview:**  
  Manages browser sessions lifecycle and saves processed AI insights to persistent storage.

- **Nodes Involved:**  
  - Session  
  - Window  
  - Terminate a session  
  - Save  

- **Node Details:**

  - **Session** and **Window**  
    - As covered in block 1.3, start browser sessions and windows for scraping.

  - **Terminate a session**  
    - Ends browser automation sessions safely after data extraction.

  - **Save**  
    - Stores final AI-analyzed structured data to Google Sheets.

---

### 3. Summary Table

| Node Name           | Node Type                               | Functional Role                                  | Input Node(s)           | Output Node(s)          | Sticky Note          |
|---------------------|---------------------------------------|-------------------------------------------------|------------------------|-------------------------|----------------------|
| Every Day 6 AM      | Schedule Trigger                      | Starts workflow daily at 6 AM                    | —                      | Your Instructions       |                      |
| Your Instructions   | Set                                   | Sets initial instructions for downstream nodes  | Every Day 6 AM          | Get X Accounts          |                      |
| Get X Accounts      | Google Sheets                         | Reads X account list                             | Your Instructions       | Get Tweets              |                      |
| Get Tweets          | HTTP Request                         | Fetches tweets from X API                        | Get X Accounts          | Select Fields           |                      |
| Select Fields       | Set                                   | Selects relevant tweet fields                    | Get Tweets              | Filter                  |                      |
| Filter              | Filter                                | Filters tweets based on criteria                  | Select Fields           | Aggregate Tweets        |                      |
| Aggregate Tweets    | Aggregate                            | Aggregates filtered tweets                        | Filter                  | Get Newsletters         |                      |
| Get Newsletters     | Google Sheets                         | Reads newsletters list                           | Aggregate Tweets        | Filter String           |                      |
| Filter String       | Set                                   | Prepares filter strings for Gmail                 | Get Newsletters         | Get many messages       |                      |
| Get many messages   | Gmail                                | Fetches multiple Gmail messages                   | Filter String           | Get a message           |                      |
| Get a message       | Gmail                                | Retrieves full message content                     | Get many messages       | Select Fields1          |                      |
| Select Fields1      | Set                                   | Selects relevant email fields                      | Get a message           | Aggregate Emails        |                      |
| Aggregate Emails    | Aggregate                            | Aggregates emails                                 | Select Fields1          | Session                 |                      |
| Session             | Airtop                               | Starts browser session                            | Aggregate Emails        | Window                  |                      |
| Window              | Airtop                               | Opens browser window                             | Session                 | Get Websites            |                      |
| Get Websites        | Google Sheets                         | Reads websites list                              | Window                  | Browser Agent           |                      |
| Browser Agent       | Langchain Agent                     | Scrapes and analyzes website content             | Get Websites, OpenAI, Simple Memory, Query, Load URL | Aggregate Websites |                      |
| Aggregate Websites  | Aggregate                            | Aggregates website data                           | Browser Agent           | Terminate a session     |                      |
| Terminate a session | Airtop                               | Ends browser session                             | Aggregate Websites      | AI Agent                |                      |
| AI Agent            | Langchain Agent                     | Performs AI analysis on aggregated data           | Terminate a session, Perplexity AI, GPT, JSON | Split Out               |                      |
| Split Out           | Split Out                           | Splits AI output for saving                      | AI Agent                | Save                    |                      |
| Save                | Google Sheets                         | Saves final processed data                        | Split Out               | —                       |                      |
| Perplexity AI       | Perplexity AI Tool                  | Augments AI analysis                              | AI Agent                | AI Agent                |                      |
| GPT                 | Langchain OpenAI Chat Model         | GPT-5 chat completions for AI Agent              | AI Agent                | AI Agent                |                      |
| JSON                | Langchain Output Parser Structured  | Parses AI Agent’s JSON output                      | AI Agent                | AI Agent                |                      |
| JSON1               | Langchain Output Parser Structured  | Parses Browser Agent output                        | Browser Agent           | Browser Agent           |                      |
| OpenAI              | Langchain OpenAI Chat Model         | Provides language model for Browser Agent         | Browser Agent           | Browser Agent           |                      |
| Simple Memory       | Langchain Memory Buffer Window      | Maintains context memory for Browser Agent        | Browser Agent           | Browser Agent           |                      |
| Query               | Airtop Tool                        | Tool for AI Agent to query                          | Browser Agent           | Browser Agent           |                      |
| Load URL            | Airtop Tool                        | Tool for AI Agent to load URLs                      | Browser Agent           | Browser Agent           |                      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger node:**  
   - Type: Schedule Trigger  
   - Set to trigger daily at 6 AM local time.  
   - Name it "Every Day 6 AM."

2. **Create Set node for initial instructions:**  
   - Type: Set  
   - Configure to set any static instructions or variables your workflow needs.  
   - Connect "Every Day 6 AM" → "Your Instructions."

3. **Create Google Sheets node to read X Accounts:**  
   - Type: Google Sheets  
   - Configure credentials for Google Sheets with read access.  
   - Set to read the sheet containing X accounts (usernames/IDs).  
   - Connect "Your Instructions" → "Get X Accounts."

4. **Create HTTP Request node to fetch tweets:**  
   - Type: HTTP Request  
   - Configure authentication for X API.  
   - Set endpoint to fetch tweets for accounts from "Get X Accounts."  
   - Connect "Get X Accounts" → "Get Tweets."

5. **Create Set node to select tweet fields:**  
   - Type: Set  
   - Configure to select relevant fields (e.g., tweet text, date, author).  
   - Connect "Get Tweets" → "Select Fields."

6. **Create Filter node to filter tweets:**  
   - Type: Filter  
   - Set filter criteria (keywords, engagement metrics).  
   - Connect "Select Fields" → "Filter."

7. **Create Aggregate node to aggregate tweets:**  
   - Type: Aggregate  
   - Configure to aggregate tweets (e.g., count, group by topic).  
   - Connect "Filter" → "Aggregate Tweets."

8. **Create Google Sheets node to read newsletters:**  
   - Type: Google Sheets  
   - Configure to read newsletter data from a sheet.  
   - Connect "Aggregate Tweets" → "Get Newsletters."

9. **Create Set node to prepare Gmail filter string:**  
   - Type: Set  
   - Configure to create search/filter strings for Gmail messages.  
   - Connect "Get Newsletters" → "Filter String."

10. **Create Gmail node to get many messages:**  
    - Type: Gmail  
    - Configure OAuth2 credentials for Gmail access.  
    - Use filter strings from "Filter String" to fetch multiple messages.  
    - Connect "Filter String" → "Get many messages."

11. **Create Gmail node to get full message:**  
    - Type: Gmail  
    - Configure to get full message content per ID.  
    - Connect "Get many messages" → "Get a message."

12. **Create Set node to select email fields:**  
    - Type: Set  
    - Select sender, subject, body snippet, date, etc.  
    - Connect "Get a message" → "Select Fields1."

13. **Create Aggregate node to aggregate emails:**  
    - Type: Aggregate  
    - Aggregate selected email messages for analysis.  
    - Connect "Select Fields1" → "Aggregate Emails."

14. **Create Airtop Session node:**  
    - Type: Airtop  
    - Configure to start browser session (once per workflow run).  
    - Connect "Aggregate Emails" → "Session."

15. **Create Airtop Window node:**  
    - Type: Airtop  
    - Opens browser window in session.  
    - Connect "Session" → "Window."

16. **Create Google Sheets node to get websites:**  
    - Type: Google Sheets  
    - Configure to read list of URLs from sheet.  
    - Connect "Window" → "Get Websites."

17. **Create Langchain Browser Agent node:**  
    - Type: Langchain Agent  
    - Configure with OpenAI GPT-5 credentials for AI language model.  
    - Assign Simple Memory (Langchain Memory Buffer Window) node as ai_memory.  
    - Add Airtop tools "Query" and "Load URL" as ai_tools.  
    - Connect "Get Websites" → "Browser Agent."

18. **Create Aggregate node to aggregate website content:**  
    - Type: Aggregate  
    - Aggregate content scraped by Browser Agent.  
    - Connect "Browser Agent" → "Aggregate Websites."

19. **Create Airtop node to terminate session:**  
    - Type: Airtop  
    - Closes browser sessions/windows to free resources.  
    - Connect "Aggregate Websites" → "Terminate a session."

20. **Create Langchain AI Agent node:**  
    - Type: Langchain Agent  
    - Configure with GPT-5 model, Perplexity AI tool, and JSON output parser.  
    - Connect "Terminate a session" → "AI Agent."

21. **Create Split Out node:**  
    - Type: Split Out  
    - Splits AI Agent output into manageable chunks.  
    - Connect "AI Agent" → "Split Out."

22. **Create Google Sheets node to save data:**  
    - Type: Google Sheets  
    - Configure with write permissions to store final AI results.  
    - Connect "Split Out" → "Save."

23. **Create additional AI nodes:**  
    - GPT and OpenAI nodes as language models for AI Agent and Browser Agent.  
    - JSON and JSON1 nodes as output parsers for AI Agent and Browser Agent respectively.  
    - Perplexity AI node as AI tool for AI Agent.

24. **Configure all credentials:**
    - Google Sheets OAuth2 credentials with proper scopes for reading/writing.  
    - Gmail OAuth2 credentials with full Gmail read.  
    - OpenAI API key with GPT-5 access.  
    - Airtop credentials for browser automation.  
    - Perplexity AI API key if applicable.

25. **Verify connections and test execution:**
    - Run the workflow and monitor logs for errors.  
    - Test each block separately if possible.

---

### 5. General Notes & Resources

| Note Content                                                                                          | Context or Link                                   |
|-----------------------------------------------------------------------------------------------------|--------------------------------------------------|
| The workflow uses Airtop nodes for browser automation, ensure Airtop credentials and environment are set up correctly. | Airtop browser automation documentation           |
| Langchain integration requires OpenAI API keys and environment properly configured with GPT-5 access. | https://platform.openai.com/docs/models/gpt-5    |
| Gmail nodes require OAuth2 credentials with Gmail API enabled and correct scopes for reading emails. | https://developers.google.com/gmail/api/quickstart |
| Google Sheets nodes need OAuth2 credentials with Google Sheets API enabled.                          | https://developers.google.com/sheets/api/quickstart |
| The workflow should be monitored for API rate limits (X API, Gmail API, OpenAI API) to avoid failures.| Consider implementing throttling or error handling |
| AI output parsers expect well-formed JSON; malformed AI responses could break workflow execution.    | Add error handling or fallback steps if needed    |
| Sticky notes in the workflow contain no content but can be used to add future documentation or instructions within n8n. |                                                  |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with existing content policies and contains no illegal, offensive, or protected elements. All handled data is legal and public.