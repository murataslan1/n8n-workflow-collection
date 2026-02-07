Answer Real Estate Questions with AI Using PropertyFinder.ae, OpenRouter, and SerpAPI

https://n8nworkflows.xyz/workflows/answer-real-estate-questions-with-ai-using-propertyfinder-ae--openrouter--and-serpapi-8309


# Answer Real Estate Questions with AI Using PropertyFinder.ae, OpenRouter, and SerpAPI

---

### 1. Workflow Overview

This n8n workflow, titled **"Answer Real Estate Questions with AI Using PropertyFinder.ae, OpenRouter, and SerpAPI"**, is designed to serve as an AI-powered real estate assistant focused on properties in the UAE. Its primary function is to interpret user queries related to real estate, extract property details from a provided PropertyFinder.ae listing URL, and respond intelligently using a combination of scraped property data and external search via SerpAPI when needed.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception and Context Retrieval**: Captures incoming chat messages, manages conversational memory, and extracts relevant URLs from the conversation.
- **1.2 Property Data Scraping and Summarization**: If a valid property link is found, scrapes the property page HTML and processes it into a structured summary usable by the AI.
- **1.3 AI Agent Query Processing**: Uses an AI agent powered by OpenRouter to answer user questions, leveraging the property summary as a knowledge base and falling back to SerpAPI search for missing information.
- **1.4 Data Merging and Output Preparation**: Combines the enriched user message and listing summary for the AI agent to generate an informed response.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Context Retrieval

**Overview:**  
This initial block captures the user's incoming chat message, retrieves recent conversation history to maintain context, and extracts the most relevant property listing link from the message or past conversation.

**Nodes Involved:**  
- Chat input  
- Chat Memory Manager  
- Find link  
- If msg contains link  
- Capture Incoming Message  
- Simple Memory1

**Node Details:**

- **Chat input**  
  - *Type*: Langchain Chat Trigger  
  - *Role*: Entry point; triggers workflow on new chat messages.  
  - *Configuration*: Public webhook, initial greeting message "Hello!", no advanced options.  
  - *Input/Output*: Input via webhook, outputs chat message data including session ID.  
  - *Potential failures*: Webhook misconfiguration, missing sessionId in payload.  
  - *Notes*: Essential for triggering entire workflow with user input.

- **Chat Memory Manager**  
  - *Type*: Langchain Memory Manager  
  - *Role*: Retrieves and manages conversation history for context.  
  - *Configuration*: Default options, no custom parameters.  
  - *Input*: From Chat input node.  
  - *Output*: Provides conversation messages array used downstream.  
  - *Failures*: Memory access issues or data corruption can cause errors.

- **Simple Memory1**  
  - *Type*: Langchain Memory Buffer Window  
  - *Role*: Maintains a sliding window of up to 30 past messages as a session-based context buffer.  
  - *Configuration*: Uses sessionId from chat input as custom key, context window length 30 messages.  
  - *Input/Output*: Input from Chat input, output used by Chat Memory Manager.  
  - *Failures*: Session key missing or malformed.

- **Find link**  
  - *Type*: Code Node  
  - *Role*: Extracts the most recent URL from the current chat input or from recent conversation history.  
  - *Configuration*: Uses JavaScript to parse text and conversation for HTTP/HTTPS URLs, returns the last found link or empty string.  
  - *Key expressions*: Regex to find URLs, logic to fallback search messages array.  
  - *Input*: JSON with chat input message and conversation messages.  
  - *Output*: JSON with a single property `link`.  
  - *Failures*: Regex failure, empty or malformed chat input, no URLs found.  

- **If msg contains link**  
  - *Type*: If Node  
  - *Role*: Checks if the extracted link is non-empty to decide workflow branching.  
  - *Configuration*: Condition: `link` field is not empty string.  
  - *Input*: From Find link node.  
  - *Output*: Two branches: true (link found) and false (no link).  
  - *Failures*: Incorrect condition evaluation if input missing.

- **Capture Incoming Message**  
  - *Type*: Set Node  
  - *Role*: Stores the raw user message and initializes the `listing_summary` field empty.  
  - *Configuration*: Assigns `message` from chat input, `listing_summary` set to empty string.  
  - *Input*: From If msg contains link (false branch).  
  - *Output*: JSON with user message and empty listing summary.  
  - *Failures*: None expected.

---

#### 2.2 Property Data Scraping and Summarization

**Overview:**  
When a valid property link is detected, this block scrapes the HTML content of the listing page and processes it into a well-structured summary suitable for AI consumption.

**Nodes Involved:**  
- Scrape  
- Summarize  
- Capture

**Node Details:**

- **Scrape**  
  - *Type*: HTTP Request  
  - *Role*: Fetches the raw HTML content of the property listing page.  
  - *Configuration*:  
    - URL dynamically set from `Find link` node output.  
    - Custom User-Agent header to mimic a real browser.  
    - On error: continue workflow without failure (to handle broken links gracefully).  
  - *Input*: URL string from Find link.  
  - *Output*: Raw HTML content of the page.  
  - *Failures*: HTTP errors (404, 403, timeouts), network failures, anti-bot blocks.

- **Summarize**  
  - *Type*: Code Node  
  - *Role*: Parses the HTML content to extract key property details into a concise text summary optimized for AI prompt use.  
  - *Configuration*:  
    - Uses `cheerio` library for HTML parsing.  
    - Extracts JSON embedded in `<script id="__NEXT_DATA__">` tag.  
    - Extracts property overview, details (bedrooms, bathrooms, size), location, pricing trends, key features, and agent info.  
    - Formats extracted data into markdown-style text with sections for easy reading.  
    - On parsing failure or missing data, returns "The provided link is not supported".  
  - *Input*: Raw HTML from Scrape node.  
  - *Output*: JSON with `summary` string.  
  - *Failures*: HTML structure changes, missing script tag, JSON parse errors.

- **Capture**  
  - *Type*: Set Node  
  - *Role*: Combines original user message and the newly generated listing summary for downstream AI processing.  
  - *Configuration*: Sets `message` from chat input, `listing_summary` from Summarize output.  
  - *Input*: From Summarize node.  
  - *Output*: JSON with both user message and property summary.  
  - *Failures*: None expected.

---

#### 2.3 AI Agent Query Processing

**Overview:**  
This block processes the combined user message and listing summary through an AI agent. The agent responds based on the available property data and uses SerpAPI for any missing information.

**Nodes Involved:**  
- Merge  
- AI Agent  
- Simple Memory  
- OpenRouter Chat Model  
- SerpAPI

**Node Details:**

- **Merge**  
  - *Type*: Merge Node  
  - *Role*: Merges two input streams: one with chat message + listing summary, another with raw user message (from no-link path).  
  - *Configuration*: Default merge (union or concatenation) to unify data.  
  - *Input*: From Capture and Capture Incoming Message nodes.  
  - *Output*: Unified JSON object containing user message and, if available, listing summary.  
  - *Failures*: Data mismatch or missing inputs.

- **Simple Memory**  
  - *Type*: Langchain Memory Buffer Window  
  - *Role*: Maintains conversational context for AI agent, keyed by session ID.  
  - *Configuration*: Uses sessionId from chat input as custom key.  
  - *Input*: From Chat input node.  
  - *Output*: Provides conversation history to AI agent.  
  - *Failures*: Session key issues.

- **OpenRouter Chat Model**  
  - *Type*: Langchain OpenRouter LLM Node  
  - *Role*: Provides AI language model inference using OpenRouter provider.  
  - *Configuration*: Model set to "google/gemini-2.5-flash".  
  - *Credentials*: Requires OpenRouter API key.  
  - *Input*: Text from merged data (user message), plus prompt configuration.  
  - *Output*: AI model response.  
  - *Failures*: API authentication errors, rate limits, network issues.

- **SerpAPI**  
  - *Type*: Langchain SerpAPI Tool Node  
  - *Role*: External search tool used by AI agent to find public UAE real estate information when knowledge base is insufficient.  
  - *Credentials*: Requires SerpAPI key.  
  - *Input*: Invoked internally by AI Agent node.  
  - *Output*: Search results for AI agent use.  
  - *Failures*: API key issues, quota limits.

- **AI Agent**  
  - *Type*: Langchain Agent Node  
  - *Role*: Central AI processing unit that answers user queries using a layered approach:  
    1. Consults the listing summary knowledge base.  
    2. Uses SerpAPI search for missing info.  
    3. Applies conversation rules to handle URLs, ambiguous queries, and off-topic questions.  
  - *Configuration*:  
    - System message defines the AI persona as a UAE real estate expert with strict rules for response style.  
    - Knowledge base injected dynamically from listing summary.  
    - SerpAPI tool integrated as fallback.  
    - Output constraints forbid meta-explanations or XML tags.  
  - *Input*: Merged JSON with user message and listing summary, plus conversation memory, and LLM model.  
  - *Output*: User-facing AI responses.  
  - *Failures*: Model errors, prompt misconfiguration, knowledge base insufficiency.

---

#### 2.4 Data Merging and Output Preparation

**Overview:**  
This block merges message and listing summary data paths and prepares the final input for the AI agent to output responses.

**Nodes Involved:**  
- Merge

**Node Details:**

- **Merge**  
  - *Type*: Merge Node  
  - *Role*: Unifies data from either the scrape+summarize path or direct message path to ensure AI agent receives consistent input.  
  - *Input*: From Capture (scraped data) and Capture Incoming Message (no link path).  
  - *Output*: Single data stream for AI Agent.  
  - *Failures*: Missing inputs, data inconsistencies.

---

### 3. Summary Table

| Node Name            | Node Type                         | Functional Role                              | Input Node(s)              | Output Node(s)          | Sticky Note                                                                                          |
|----------------------|----------------------------------|----------------------------------------------|----------------------------|-------------------------|----------------------------------------------------------------------------------------------------|
| Chat input           | Langchain Chat Trigger            | Entry point, receives user chat messages    | -                          | Chat Memory Manager, Simple Memory1 | See Sticky Note6: Receiving and Preparing Data                                                    |
| Simple Memory1       | Langchain Memory Buffer Window    | Maintains recent conversation context       | Chat input                 | Chat Memory Manager      | See Sticky Note6: Receiving and Preparing Data                                                    |
| Chat Memory Manager  | Langchain Memory Manager          | Retrieves conversation history for context  | Chat input, Simple Memory1 | Find link                | See Sticky Note6: Receiving and Preparing Data                                                    |
| Find link            | Code                             | Extracts last relevant URL from messages    | Chat Memory Manager        | If msg contains link     | See Sticky Note6: Receiving and Preparing Data                                                    |
| If msg contains link | If                               | Checks if a property link was found          | Find link                  | Scrape (true), Capture Incoming Message (false) | See Sticky Note: Scraping Listing Information                                                     |
| Scrape               | HTTP Request                     | Fetches HTML content of property listing     | If msg contains link (true) | Summarize                | See Sticky Note: Scraping Listing Information                                                     |
| Summarize            | Code                             | Parses HTML and formats property summary     | Scrape                     | Capture                  | See Sticky Note: Scraping Listing Information                                                     |
| Capture              | Set                              | Combines user message with listing summary  | Summarize                  | Merge                    |                                                                                                    |
| Capture Incoming Message | Set                          | Captures user message when no link present  | If msg contains link (false) | Merge                    |                                                                                                    |
| Merge                | Merge                            | Unifies message and summary data paths       | Capture, Capture Incoming Message | AI Agent                |                                                                                                    |
| Simple Memory        | Langchain Memory Buffer Window    | Maintains conversational memory for AI agent | Chat input                 | AI Agent                 |                                                                                                    |
| OpenRouter Chat Model| Langchain OpenRouter LLM         | Provides LLM inference for AI Agent          | AI Agent                   | AI Agent                 |                                                                                                    |
| SerpAPI              | Langchain SerpAPI Tool           | External search tool for missing info        | AI Agent                   | AI Agent                 |                                                                                                    |
| AI Agent             | Langchain Agent                  | Answers user queries using knowledge base and SerpAPI | Merge, Simple Memory, OpenRouter Chat Model, SerpAPI | Output response | See Sticky Note1: AI Agent behavior and logic                                                     |
| Sticky Note7         | Sticky Note                      | Documentation and workflow explanation       | -                          | -                       | Contains detailed project overview, usage instructions, and contact info (George Zargaryan on LinkedIn and Telegram) |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Langchain Chat Trigger node ("Chat input"):**  
   - Set webhook to public, no advanced options.  
   - Initial message: "Hello!"  

2. **Add a Langchain Memory Buffer Window node ("Simple Memory1"):**  
   - Session key: `={{ $json.sessionId }}` (from Chat input).  
   - Context window length: 30 messages.  
   - Connect Chat input → Simple Memory1.

3. **Add a Langchain Memory Manager node ("Chat Memory Manager"):**  
   - Default settings.  
   - Connect Chat input and Simple Memory1 → Chat Memory Manager.

4. **Add a Code node ("Find link"):**  
   - Use JavaScript to:  
     - Extract last URL from the latest chat input message.  
     - If none, scan conversation history messages backwards for a URL.  
     - Return JSON `{ link: <lastLink> }`.  
   - Connect Chat Memory Manager → Find link.

5. **Add an If node ("If msg contains link"):**  
   - Condition: Check if `{{$json.link}}` is not empty string.  
   - Connect Find link → If msg contains link.

6. **Add an HTTP Request node ("Scrape"):**  
   - URL: `={{ $json.link }}` from Find link output.  
   - Method: GET.  
   - Add HTTP header: `User-Agent` = `"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"`.  
   - On error: continue workflow.  
   - Connect If msg contains link (true) → Scrape.

7. **Add a Code node ("Summarize"):**  
   - Use `cheerio` to parse the HTML from Scrape node.  
   - Extract JSON data from `<script id="__NEXT_DATA__">`.  
   - Extract and format property details: overview, details, location, pricing, features, agent info.  
   - Output a concise markdown summary string.  
   - On failure, output "The provided link is not supported".  
   - Connect Scrape → Summarize.

8. **Add a Set node ("Capture"):**  
   - Assign `message` from chat input (`{{$node["Chat input"].json.chatInput}}`).  
   - Assign `listing_summary` from Summarize (`{{$json.summary}}`).  
   - Connect Summarize → Capture.

9. **Add a Set node ("Capture Incoming Message"):**  
   - Assign `message` from chat input (`{{$node["Chat input"].json.chatInput}}`).  
   - Assign `listing_summary` as empty string `""`.  
   - Connect If msg contains link (false) → Capture Incoming Message.

10. **Add a Merge node ("Merge"):**  
    - Merge inputs from Capture and Capture Incoming Message.  
    - No special mode; union/concatenate.  
    - Connect Capture and Capture Incoming Message → Merge.

11. **Add a Langchain Memory Buffer Window node ("Simple Memory"):**  
    - Session key: `={{ $json.sessionId }}` (from Chat input).  
    - Connect Chat input → Simple Memory.

12. **Add a Langchain OpenRouter LLM node ("OpenRouter Chat Model"):**  
    - Model: `google/gemini-2.5-flash`.  
    - Set OpenRouter API credentials.  
    - Connect OpenRouter Chat Model → AI Agent (as ai_languageModel input).

13. **Add a Langchain SerpAPI Tool node ("SerpAPI"):**  
    - Configure with SerpAPI credentials.  
    - Connect SerpAPI → AI Agent (as ai_tool input).

14. **Add a Langchain Agent node ("AI Agent"):**  
    - Set input text: `={{ $json.message }}` from Merge node.  
    - Configure system message with:  
      - Persona as UAE Real Estate AI Agent (friendly, concise, expert).  
      - Knowledge base injected dynamically as `{{ $json.listing_summary }}`.  
      - Tool integration: SerpAPI with usage rules.  
      - Rules for query handling, ambiguous questions, URLs, off-topic handling.  
      - Output constraints forbidding internal explanations or XML tags.  
    - Connect Merge → AI Agent (main input).  
    - Connect Simple Memory → AI Agent (ai_memory input).  
    - Connect OpenRouter Chat Model → AI Agent (ai_languageModel input).  
    - Connect SerpAPI → AI Agent (ai_tool input).

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Context or Link                                                                                                    |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------|
| This workflow demonstrates a template for building a UAE real estate AI assistant integrating PropertyFinder.ae scraping, OpenRouter LLM, and SerpAPI search. It is designed to be extensible for adding knowledge bases, more data sources, caching, and multi-channel integrations.                                                                                                                                                                                                                                                                                                            | Sticky Note7 contains detailed project overview and usage instructions.                                          |
| The AI Agent logic enforces a strict persona and interaction rules to provide concise, expert answers without filler or internal details. It prioritizes scraped property data but uses SerpAPI to fill gaps.                                                                                                                                                                                                                                                                                                                                                                                    | Sticky Note1 describes AI Agent behavior and output constraints.                                                 |
| The initial data reception block captures user message and conversation context, extracts links robustly either from the latest message or conversation history for better accuracy in detecting relevant property URLs.                                                                                                                                                                                                                                                                                                                                                                        | Sticky Note6 explains receiving and preparing data.                                                               |
| The scraping block uses a code node with the cheerio library to parse complex HTML and embedded JSON from PropertyFinder.ae listings, extracting comprehensive property information including pricing trends and agent ratings.                                                                                                                                                                                                                                                                                                                                                                  | Sticky Note explains the scraping logic and error handling.                                                       |
| For credential setup, the workflow requires:  
- OpenRouter API key (for LLM usage)  
- SerpAPI key (for external search tool)  
Both keys must be added in the respective nodes' credential fields.                                                                                                                                                                                                                                                                                                                                                                                                            | See node configurations for credential references.                                                               |
| For testing, the workflow can be triggered via the public webhook of the Chat input node or integrated into channels such as Instagram, Telegram, or WhatsApp by connecting the chat trigger accordingly.                                                                                                                                                                                                                                                                                                                                                                                         | Part of the overall design notes for deployment.                                                                  |
| Contact for support or questions:  
- Telegram: @ninesfork  
- LinkedIn: [George Zargaryan](https://www.linkedin.com/in/george-zargaryan-b65290367/)                                                                                                                                                                                                                                                                                                                                                                                                                | From Sticky Note7 contact information.                                                                            |

---

**Disclaimer:** The above documentation is generated exclusively based on the provided n8n workflow JSON. The workflow and its components comply strictly with content policies, and no illegal or offensive content is processed. All data handled is legal and publicly accessible.

---