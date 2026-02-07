AI-Powered Local Event Finder with Multi-Tool Search

https://n8nworkflows.xyz/workflows/ai-powered-local-event-finder-with-multi-tool-search-4816


# AI-Powered Local Event Finder with Multi-Tool Search

### 1. Workflow Overview

The **"Local Event Finder"** workflow is an AI-powered event discovery system designed to find relevant local events based on user-supplied criteria such as event type, city, country, date range, and interests. It is implemented as a self-contained n8n workflow that acts simultaneously as:

- An **MCP Server endpoint** exposing the event-finding AI agent as a callable tool for external clients.
- The **core AI agent logic** that uses a Google Gemini large language model (LLM) combined with multiple external search and scraping tools to discover, aggregate, and format event information.

The workflow's structure can be logically grouped into the following blocks:

- **1.1 MCP Server Trigger and Interface:** Receives external requests, exposes the event finder as a tool, and forwards input parameters.
- **1.2 Agent Core Logic Execution:** Triggers the internal sub-workflow that runs the AI agent.
- **1.3 AI Agent and Memory:** Hosts the main LLM agent node, its memory buffer, and orchestrates tool usage.
- **1.4 External Search Tools:** Integrates multiple search APIs (Brave Web Search, Brave Local Search, Google Gemini Search) to gather event data.
- **1.5 Web Page Scraper:** Extracts detailed event information from URLs identified by search tools.
- **1.6 Documentation and Support Nodes:** Sticky notes provide detailed explanations, usage guidance, and troubleshooting tips.

This layered design allows flexible, context-aware event search and data extraction, while exposing the agent as an easy-to-use external service.

---

### 2. Block-by-Block Analysis

#### 2.1 MCP Server Trigger and Interface

**Overview:**  
This block provides the workflow's entry point for external calls, exposing the event-finding capability as a tool via the MCP protocol. It receives input parameters (query, city, country, etc.) from clients and passes them internally to the agent logic.

**Nodes Involved:**  
- `local_event_finder` (MCP Trigger)  
- `find_events` (Tool Workflow)  
- `even_finder_workflow` (Execute Workflow Trigger)  

**Node Details:**  

- **local_event_finder**  
  - Type: MCP Trigger  
  - Role: Listens for external HTTP POST requests formatted per MCP protocol at a specified webhook path.  
  - Configuration: Exposes `find_events` as a tool for invocation.  
  - Inputs: MCP client requests containing JSON payloads with `tool_name: "find_events"` and `tool_input` JSON.  
  - Outputs: Forwards tool input to `find_events` node.  
  - Edge Cases: Invalid or malformed MCP requests; authentication not implemented (future enhancement suggested).  

- **find_events**  
  - Type: Tool Workflow (Langchain)  
  - Role: Acts as the interface to invoke the internal agent logic sub-workflow.  
  - Configuration: Calls the `even_finder_workflow` node with parameters: `query`, `city`, `country`, `date-range`, and `interests`.  
  - Inputs: Receives parameters from `local_event_finder`.  
  - Outputs: Forwards the parameters to `even_finder_workflow`.  
  - Edge Cases: Workflow invocation failures, missing parameters.  

- **even_finder_workflow**  
  - Type: Execute Workflow Trigger  
  - Role: Internal entry point for the agent logic sub-workflow.  
  - Configuration: Receives the same search parameters to kick off the AI agent processing.  
  - Inputs: From `find_events`.  
  - Outputs: To `event_finder_agent`.  
  - Edge Cases: Workflow execution errors.  

---

#### 2.2 Agent Core Logic Execution

**Overview:**  
This block contains the AI agent that processes the user query using an LLM and integrates multiple external tools to perform searches and scrape event data. It also manages short-term memory for context.

**Nodes Involved:**  
- `event_finder_agent` (Langchain Agent)  
- `Simple Memory` (Memory Buffer Window)  
- `Google Gemini Chat Model` (LLM)  

**Node Details:**  

- **event_finder_agent**  
  - Type: Langchain Agent Node  
  - Role: Core AI logic node that interprets user inputs, decides which tools to call, and synthesizes the final markdown response with event details.  
  - Configuration:  
    - System Message: Comprehensive prompt guiding the agent’s persona, search strategies, and response formatting.  
    - Tools Used: `brave_web_search`, `brave_local_search`, `google_gemini_event_search`, `jina_ai_web_page_scraper`.  
    - Input: User criteria (`query`, `city`, `country`, `date-range`, `interests`) from `even_finder_workflow`.  
    - Output: A markdown-formatted summary of found events or a polite no-results message.  
  - Expressions: Uses template expressions to access parameters from previous nodes (e.g., `$('even_finder_workflow').item.json.query`).  
  - Connections: Receives memory input from `Simple Memory`; uses `Google Gemini Chat Model` as LLM backend.  
  - Edge Cases: LLM API errors, tool call failures, timeouts, memory sync issues, malformed inputs.  
  - Version-specific: Requires n8n Langchain integration supporting Langchain Agent nodes with multi-tool support.  

- **Simple Memory**  
  - Type: Langchain Memory Buffer Window  
  - Role: Maintains short-term conversational context for the `event_finder_agent` across the current execution.  
  - Configuration: Session key set to current execution ID for uniqueness.  
  - Edge Cases: Memory overflow is handled by windowing; no long-term persistence.  

- **Google Gemini Chat Model**  
  - Type: Langchain LLM Node for Google Gemini  
  - Role: Provides the underlying LLM capabilities for the agent.  
  - Configuration: Model set to `"models/gemini-2.5-flash-preview-05-20"`.  
  - Credential: Uses `Google Gemini Context7` credential for API access.  
  - Edge Cases: API key issues, rate limits, model version compatibility.  

---

#### 2.3 External Search Tools Integration

**Overview:**  
This block contains tools used by the agent to search for events from different sources: broad web searches, local searches, and advanced Gemini-powered searches.

**Nodes Involved:**  
- `brave_web_search` (MCP Client Tool)  
- `brave_local_search` (MCP Client Tool)  
- `google_gemini_event_search` (Gemini Search Tool)  

**Node Details:**  

- **brave_web_search**  
  - Type: MCP Client Tool Node  
  - Role: Performs general web searches via the Brave Search API to find event listings and broader information.  
  - Configuration:  
    - Tool Name: `brave_web_search`  
    - Parameters: JSON object with `query` (required), optional `count` (max 20), and `offset` (pagination).  
    - Credential: Uses `smithery brave search`.  
  - Input: Query constructed dynamically by the agent.  
  - Output: List of search results (URLs, snippets).  
  - Edge Cases: HTTP errors, API rate limits, invalid parameters, fallback if no results.  

- **brave_local_search**  
  - Type: MCP Client Tool Node  
  - Role: Conducts location-specific searches for events, venues, or points of interest using Brave Local Search.  
  - Configuration:  
    - Tool Name: `brave_local_search`  
    - Parameters: JSON with `query` (required), optional `count`.  
    - Credential: Uses `smithery brave search` (same as above).  
  - Input: Location-targeted queries, e.g., `"live music in [City]"`.  
  - Output: Localized event results or fallback to broader web search if none.  
  - Edge Cases: No local results, API failures, no pagination support.  

- **google_gemini_event_search**  
  - Type: Gemini Search Tool Node  
  - Role: Uses Google Gemini’s advanced search to handle complex, multi-interest event queries or nuanced requests.  
  - Configuration:  
    - Model: `"gemini-2.5-flash-preview-05-20"`  
    - Parameters: `query` (string), optional `organization` context, optional `restrictUrls` for trusted sources.  
    - Credential: Uses `Gemini Credentials account`.  
  - Input: Rich search queries combining user preferences.  
  - Output: Detailed search results, including source URLs.  
  - Edge Cases: API quota issues, malformed context, no relevant results.  

---

#### 2.4 Web Page Scraper

**Overview:**  
This node extracts detailed textual content from event web pages identified during search steps, providing enriched event descriptions.

**Node Involved:**  
- `jina_ai_web_page_scraper` (Jina AI Tool)  

**Node Details:**  

- **jina_ai_web_page_scraper**  
  - Type: Jina AI Tool Node  
  - Role: Scrapes and summarizes the main textual content from event URLs to extract detailed event info like descriptions, schedules, and venues.  
  - Configuration:  
    - Input: `url` string pointing to an official or authoritative event page.  
    - Output Format: Markdown, with image captioning enabled.  
    - Credential: Uses `Jina AI account`.  
  - Constraints: Critical to use sparingly (max 1-2 URLs per run) due to a 60-second MCP server timeout on execution.  
  - Edge Cases: Slow or unresponsive pages causing timeout, invalid URLs, incomplete content extraction.  

---

#### 2.5 Documentation and Support

**Overview:**  
Sticky note nodes provide comprehensive explanations, configuration details, usage instructions, troubleshooting tips, and future enhancement ideas throughout the workflow.

**Nodes Involved:**  
- Multiple `Sticky Note` nodes scattered throughout the canvas with contextual documentation.  

**Key Highlights:**  
- Detailed description of MCP Client configuration and expected request/response formats.  
- Explanation of the workflow's dual role as MCP Server and AI Agent.  
- Notes on credentials and external services used.  
- Guidance on agent configuration, memory usage, and LLM settings.  
- Troubleshooting steps for tool failures and API issues.  
- Planned improvements such as input validation, error handling, rate limiting, and advanced tool selection logic.  

---

### 3. Summary Table

| Node Name                  | Node Type                             | Functional Role                               | Input Node(s)                 | Output Node(s)            | Sticky Note                                                                                                          |
|----------------------------|-------------------------------------|-----------------------------------------------|------------------------------|---------------------------|----------------------------------------------------------------------------------------------------------------------|
| local_event_finder          | MCP Trigger                         | Entry point for external MCP client calls     | (External HTTP requests)      | find_events                | 📡 local_event_finder (MCP Server Trigger) - Entry point for external calls exposing `find_events` tool.              |
| find_events                | Tool Workflow                       | Invokes internal agent logic workflow          | local_event_finder            | even_finder_workflow       | ➡️ find_events (Tool Workflow Node) - Bridge node invoking agent core logic.                                        |
| even_finder_workflow        | Execute Workflow Trigger            | Internal start for agent core logic             | find_events                  | event_finder_agent          | 🏁 Sub-Workflow Start: Local Event Finder Logic - Kicks off agent thinking process.                                  |
| event_finder_agent          | Langchain Agent                    | Core AI agent processing user queries          | even_finder_workflow, Simple Memory, Google Gemini Chat Model | (Final output)            | 🧠 event_finder_agent (Core Logic) - Brain of the operation using multiple tools and LLM to find events.              |
| Simple Memory               | Langchain Memory Buffer Window      | Provides short-term memory to agent             | -                            | event_finder_agent         | 💾 Agent Memory (Simple Memory) - Short-term recall for agent context per execution.                                  |
| Google Gemini Chat Model    | Langchain LLM Node                  | Provides the LLM capabilities                    | -                            | event_finder_agent         | 🔑 External Service Credentials - Google Gemini API usage.                                                          |
| brave_web_search            | MCP Client Tool                    | General broad web search for events              | event_finder_agent            | event_finder_agent         | 🛠️ Tool: brave_web_search - Broad web searching via Brave Search API.                                               |
| brave_local_search          | MCP Client Tool                    | Localized search for events and venues           | event_finder_agent            | event_finder_agent         | 🛠️ Tool: brave_local_search - Local area search with fallback to web search.                                        |
| google_gemini_event_search  | Gemini Search Tool                 | Advanced context-aware event search               | event_finder_agent            | event_finder_agent         | 🛠️ Tool: google_gemini_event_search - Advanced Google Gemini search for complex queries.                            |
| jina_ai_web_page_scraper    | Jina AI Tool                      | Extracts detailed content from event webpages    | event_finder_agent            | event_finder_agent         | 🛠️ Tool: jina_ai_web_page_scraper - Detailed content extraction, use sparingly due to timeout limits.                |
| Sticky Note (various)       | Sticky Note                       | Documentation, guidance, and troubleshooting     | -                            | -                         | Multiple notes throughout explaining configuration, logic, troubleshooting, and future enhancements.                 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create MCP Trigger Node**  
   - Name: `local_event_finder`  
   - Type: MCP Trigger  
   - Set webhook path (e.g., `"0ca88864-ec0a-4c27-a7ec-e28c5a900697"`)  
   - Configure to expose the tool named `"find_events"`  
   - Set to receive JSON POST requests formatted for MCP  
   - This node is the external entry point for client calls.  

2. **Create Tool Workflow Node**  
   - Name: `find_events`  
   - Type: Langchain Tool Workflow  
   - Configure to invoke the sub-workflow that contains agent logic (same workflow ID)  
   - Define inputs: `query`, `city`, `country`, `date-range`, `interests` (all strings)  
   - Map these inputs to the internal workflow trigger node `even_finder_workflow`  
   - Connect `local_event_finder` output to this node's input.  

3. **Create Execute Workflow Trigger Node**  
   - Name: `even_finder_workflow`  
   - Type: Execute Workflow Trigger (internal)  
   - Configure to receive inputs: `query`, `city`, `country`, `date-range`, `interests`  
   - Connect `find_events` output to this node's input.  

4. **Create Langchain Agent Node**  
   - Name: `event_finder_agent`  
   - Type: Langchain Agent  
   - Configure the system message to define the agent's persona and operational protocol (see Section 2.2 for prompt details)  
   - Specify tools accessible: `brave_web_search`, `brave_local_search`, `google_gemini_event_search`, `jina_ai_web_page_scraper`  
   - Connect inputs from `even_finder_workflow` and memory node (below)  
   - Connect output to workflow output or response node.  

5. **Create Memory Buffer Window Node**  
   - Name: `Simple Memory`  
   - Type: Langchain Memory Buffer Window  
   - Set `sessionKey` to `={{ $execution.id }}` to isolate memory per execution  
   - Connect output to `event_finder_agent` memory input.  

6. **Create Google Gemini Chat Model Node**  
   - Name: `Google Gemini Chat Model`  
   - Type: Langchain LLM Node  
   - Set model to `"models/gemini-2.5-flash-preview-05-20"`  
   - Attach credential for Google Gemini API (e.g., `Google Gemini Context7`)  
   - Connect output to `event_finder_agent` LLM input.  

7. **Create MCP Client Tool Node for Brave Web Search**  
   - Name: `brave_web_search`  
   - Type: MCP Client Tool  
   - Set tool name to `"brave_web_search"`  
   - Configure parameters to accept JSON with keys `query` (required), `count` (optional), `offset` (optional)  
   - Attach MCP Client HTTP API credential (`smithery brave search`)  
   - Connect input and output to `event_finder_agent` tool interface.  

8. **Create MCP Client Tool Node for Brave Local Search**  
   - Name: `brave_local_search`  
   - Type: MCP Client Tool  
   - Set tool name to `"brave_local_search"`  
   - Configure parameters JSON with `query` (required), `count` (optional)  
   - Attach same MCP Client HTTP API credential (`smithery brave search`)  
   - Connect input/output to `event_finder_agent`.  

9. **Create Gemini Search Tool Node**  
   - Name: `google_gemini_event_search`  
   - Type: Gemini Search Tool  
   - Set model to `"gemini-2.5-flash-preview-05-20"`  
   - Configure inputs: `query` (required), optional `organization`, optional `restrictUrls`  
   - Bind credential `Gemini Credentials account`  
   - Connect to `event_finder_agent`.  

10. **Create Jina AI Tool Node for Web Page Scraper**  
    - Name: `jina_ai_web_page_scraper`  
    - Type: Jina AI Tool  
    - Configure input for `url` string parameter  
    - Set output format to Markdown with image captioning enabled  
    - Attach `Jina AI account` credential  
    - Connect to `event_finder_agent` tool interface.  
    - Enforce usage limits in agent prompt (max 1-2 URLs per execution) to avoid timeouts.  

11. **Connect Nodes Appropriately**  
    - `local_event_finder` → `find_events` → `even_finder_workflow` → `event_finder_agent`  
    - `Simple Memory` → `event_finder_agent` (memory input)  
    - `Google Gemini Chat Model` → `event_finder_agent` (LLM input)  
    - all tool nodes (`brave_web_search`, `brave_local_search`, `google_gemini_event_search`, `jina_ai_web_page_scraper`) → `event_finder_agent` (tool input/output)  

12. **Set Credentials**  
    - Configure and test the following credentials in n8n:  
      - `Google Gemini Context7` for Gemini LLM  
      - `smithery brave search` for Brave MCP Client APIs  
      - `Gemini Credentials account` for Gemini Search Tool  
      - `Jina AI account` for Jina AI scraper  

13. **Add Sticky Notes / Documentation**  
    - Add contextual sticky notes explaining node roles, configuration, and troubleshooting tips for maintainability.  

14. **Test Workflow**  
    - Trigger `local_event_finder` via HTTP POST with appropriate MCP payload containing `tool_name: "find_events"` and required parameters.  
    - Verify the full chain executes, tools respond, and the final markdown output summarizes local events.  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                         | Context or Link                                                                                   |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| This workflow combines MCP Server and AI Agent logic in one file to simplify deployment and management. For very complex setups, splitting into separate workflows is recommended.                                                                                                                                                                                                   | Sticky Note13: n8n AI Agent as MCP Service Pattern                                              |
| Use the `jina_ai_web_page_scraper` sparingly (max 1-2 URLs per run) due to a 60-second MCP server timeout constraint as of June 2025. Prioritize official event pages for scraping.                                                                                                                                                                                                 | Sticky Note7: Agent Logic and Tool Usage Guidelines                                            |
| Credentials must be carefully configured and validated for all external services (Google Gemini, Brave Search via Smithery MCP, Jina AI) to avoid authentication or quota errors.                                                                                                                                                                                                   | Sticky Note14: External Service Credentials                                                     |
| Future enhancements planned include input validation, sophisticated error handling, API key security, rate limiting, improved tool selection logic, and enhanced event data extraction/summarization.                                                                                                                                                                                  | Sticky Note5: TODO / Future Enhancements                                                        |
| The agent's system prompt is critical and defines search strategies, tool usage hierarchy, output formatting with markdown, and user experience. Adjust it carefully when modifying the workflow.                                                                                                                                                                                      | Sticky Note7: event_finder_agent system prompt details                                          |
| MCP Client tool parameters are dynamically generated via AI expressions to fit the current query context, ensuring flexible and relevant external searches.                                                                                                                                                                                                                         | Node configurations for `brave_web_search` and `brave_local_search`                           |
| For detailed workflow and integration examples, visit [Jezweb](https://www.jezweb.com.au). This workflow was authored by Jeremy Dawes at Jezweb.                                                                                                                                                                                                                                    | Sticky Note4: Workflow author and credits                                                      |

---

**Disclaimer:** The provided text is derived exclusively from an n8n automated workflow. The content complies strictly with current content policies and contains no illegal, offensive, or protected elements. All data processed is legal and public.