AI-Powered Research Assistant with Linear, Scrapeless, and Claude

https://n8nworkflows.xyz/workflows/ai-powered-research-assistant-with-linear--scrapeless--and-claude-6220


# AI-Powered Research Assistant with Linear, Scrapeless, and Claude

---

### 1. Workflow Overview

This workflow, titled **"Build an AI-Powered Research Assistant with Linear + Scrapeless + Claude"**, is designed to automate and streamline research tasks initiated from Linear issues by leveraging multiple AI and scraping services. It listens for specific issue creation or comments in Linear, interprets command-like keywords in issue titles, performs the corresponding research or data extraction task using Scrapeless APIs, processes and summarizes the results with an AI agent powered by Anthropic Claude, and finally posts a structured comment back to the Linear issue.

**Target use cases:**  
- Automating research queries triggered via Linear issue titles  
- Gathering data from Google Search, Google Trends, web scraping, or crawling based on user commands  
- Using AI to analyze gathered data and produce concise, actionable summaries formatted for Linear comments  

**Logical blocks:**  
- **1.1 Input Reception:** Linear trigger listens to events and routes based on issue title commands  
- **1.2 Command Parsing & Cleaning:** Clean command keywords from issue titles for processing  
- **1.3 Data Acquisition:** Conditional branches invoking Scrapeless API for different research tasks (search, trends, unlock, scrape, crawl)  
- **1.4 Data Formatting:** Convert raw API responses into JSON string output  
- **1.5 AI Processing:** Use Anthropic Claude model via Langchain agent to analyze and summarize data  
- **1.6 Posting Results:** Format AI output and add it as a comment to the originating Linear issue

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  Listens for Linear webhook events related to issues, comments, and reactions, then routes the workflow based on the issue title commands.

- **Nodes Involved:**  
  - Linear Trigger  
  - Switch  

- **Node Details:**  

  - **Linear Trigger**  
    - Type: Linear webhook trigger node  
    - Configuration: Watches a specific Linear team (teamId: 3a89590a-2521-4c4a-b3b2-7e7ad5962666) for resources: issue, comment, reaction  
    - Credentials: Authenticated with Linear API credentials  
    - Connections: Outputs to Switch node  
    - Edge cases:  
      - Webhook misconfiguration or expired credentials causing missed triggers  
      - Large payloads or rate limits from Linear API  

  - **Switch**  
    - Type: Switch node evaluating expressions  
    - Configuration: Routes based on issue type and keywords in issue title (case-insensitive), with 5 outputs:  
      0: title includes "/search"  
      1: title includes "/trends"  
      2: title includes "/unlock"  
      3: title includes "/scrape"  
      4: title includes "/crawl"  
      Default: -1 (no match, no further processing)  
    - Expressions: Uses `$json.type === 'Issue'` and `$json.data.title.toLowerCase().includes()`  
    - Connections: Each output connects to a dedicated code node cleaning the title for the specific command  
    - Edge cases:  
      - Issue titles not matching any keyword stop workflow silently  
      - Case sensitivity guarded by `.toLowerCase()` but malformed titles may cause issues

#### 2.2 Command Parsing & Cleaning

- **Overview:**  
  Removes command keywords (e.g., "/search") from the issue title to isolate the actual query or URL for use in downstream nodes.

- **Nodes Involved:**  
  - Code2, Code3, Code4, Code5, Code6 (one per command branch)

- **Node Details:**  

  Each Code node:  
  - Type: JavaScript Code node (mode varies between runOnceForEachItem and standard)  
  - Logic: Strip the respective command keyword from `$json.data.title` (case-insensitive) and trim whitespace  
  - Output: Passes cleaned title back in `data.title` while preserving original data  
  - Connections: Each connects to one Scrapeless API node relevant for the command  
  - Edge cases:  
    - If title doesn’t contain the exact keyword, no replacement occurs (safe due to prior Switch)  
    - Unexpected characters or malformed titles may yield cleaned titles that are empty or invalid URLs

#### 2.3 Data Acquisition

- **Overview:**  
  Based on the cleaned command input, calls Scrapeless API endpoints to perform the requested data retrieval or scraping operation.

- **Nodes Involved:**  
  - Google Search  
  - Google Trends  
  - Web Unlocker  
  - Scrape  
  - Crawl  

- **Node Details:**  

  - **Google Search**  
    - Type: Scrapeless node calling Google Search API  
    - Parameters: Query (`q`) set to cleaned title  
    - Credentials: Scrapeless API credentials  
    - Output: Raw search results JSON  

  - **Google Trends**  
    - Type: Scrapeless node calling Google Trends API  
    - Parameters: Query (`q`) set to cleaned title, operation set to "googleTrends"  
    - Credentials: Scrapeless API credentials  
    - Output: Trends data JSON  

  - **Web Unlocker**  
    - Type: Scrapeless node using universal scraping API  
    - Parameters: URL derived from cleaned title by removing "/unlock" keyword, headless mode disabled  
    - Credentials: Scrapeless API credentials  
    - Output: Scraped webpage content  

  - **Scrape**  
    - Type: Scrapeless node crawler resource  
    - Parameters: URL set to cleaned title  
    - Credentials: Scrapeless API credentials  
    - Output: Scraped page(s) content  

  - **Crawl**  
    - Type: Scrapeless node crawler resource with crawl operation  
    - Parameters: URL set to cleaned title, limit crawl pages to 1  
    - Credentials: Scrapeless API credentials  
    - Output: Crawl results  

- **Edge cases:**  
  - API failures due to invalid URLs or queries  
  - Rate limits or quota exhaustion on Scrapeless API  
  - Network timeouts  
  - Unexpected content formats causing downstream parsing issues

#### 2.4 Data Formatting

- **Overview:**  
  Converts the Scrapeless API JSON output into a formatted JSON string for AI processing.

- **Nodes Involved:**  
  - Code (single node connected to all Scrapeless API nodes)  

- **Node Details:**  
  - Type: Code node, run once for each item  
  - Logic: JSON stringify the entire input object with indentation for readability  
  - Output: Single property `output` containing the formatted JSON string  
  - Connections: Sends output to AI Agent1 node  
  - Edge cases:  
    - Large JSON objects may cause performance issues  
    - Non-serializable data would cause errors (unlikely with Scrapeless structured JSON)

#### 2.5 AI Processing

- **Overview:**  
  Uses Anthropic Claude model integrated via Langchain agent to analyze and summarize the formatted data, producing a structured and concise research summary.

- **Nodes Involved:**  
  - Anthropic Chat Model1  
  - AI Agent1  
  - Code7  

- **Node Details:**  

  - **Anthropic Chat Model1**  
    - Type: Langchain AI language model node (Anthropic Claude)  
    - Model: "claude-sonnet-4-20250514" with temperature 0.3 and max tokens 4000  
    - Credentials: Anthropic API credentials  
    - Output: AI response text  
    - Connections: AI language model input for AI Agent1 node  

  - **AI Agent1**  
    - Type: Langchain Agent node  
    - Input: Text from Code node containing JSON string  
    - System Message: Detailed prompt instructing to:  
      - Act as data analyst, summarize concisely and factually  
      - Include key findings, data source reliability, recommendations, metrics, next steps  
      - Format for Linear comments with headers and bullet points  
    - Output: Structured summary text  
    - Connections: Output to Code7 for final formatting  

  - **Code7**  
    - Type: Code node  
    - Logic: Cleans AI output string by replacing escaped characters and trimming whitespace  
    - Output: Cleaned string for posting  
    - Connections: Connects to "Add a comment to an issue1" node  

- **Edge cases:**  
  - AI response might exceed token limits or timeout  
  - Unexpected AI output format or errors  
  - Anthropic API authentication or quota issues  

#### 2.6 Posting Results

- **Overview:**  
  Posts the AI-generated summary as a comment on the original Linear issue that triggered the workflow.

- **Nodes Involved:**  
  - Add a comment to an issue1  

- **Node Details:**  
  - Type: Linear API action node (comment creation)  
  - Parameters:  
    - Comment content: from Code7 output  
    - Issue ID: dynamically obtained from original Linear Trigger data  
  - Credentials: Linear API credentials  
  - Edge cases:  
    - Failure to post comment due to invalid issue ID or permissions  
    - Rate limits or API errors  
    - Network issues or retries

---

### 3. Summary Table

| Node Name                 | Node Type                       | Functional Role                        | Input Node(s)              | Output Node(s)            | Sticky Note                                    |
|---------------------------|--------------------------------|-------------------------------------|----------------------------|---------------------------|------------------------------------------------|
| Linear Trigger            | Linear Trigger                 | Listens for Linear issue/comment events | (start)                   | Switch                    |                                                |
| Switch                   | Switch                        | Routes based on issue title commands | Linear Trigger             | Code2, Code3, Code4, Code5, Code6 |                                                |
| Code2                    | Code                          | Cleans "/search" from title          | Switch (output 0)           | Google Search             |                                                |
| Code3                    | Code                          | Cleans "/trends" from title          | Switch (output 1)           | Google Trends             |                                                |
| Code4                    | Code                          | Cleans "/unlock" from title          | Switch (output 2)           | Web Unlocker              |                                                |
| Code5                    | Code                          | Cleans "/scrape" from title          | Switch (output 3)           | Scrape                    |                                                |
| Code6                    | Code                          | Cleans "/crawl" from title           | Switch (output 4)           | Crawl                     |                                                |
| Google Search            | Scrapeless                    | Performs Google Search API call      | Code2                      | Code                      |                                                |
| Google Trends            | Scrapeless                    | Performs Google Trends API call      | Code3                      | Code                      |                                                |
| Web Unlocker             | Scrapeless                    | Performs universal web scraping      | Code4                      | Code                      |                                                |
| Scrape                   | Scrapeless                    | Performs scraping via crawler        | Code5                      | Code                      |                                                |
| Crawl                    | Scrapeless                    | Performs crawling operation           | Code6                      | Code                      |                                                |
| Code                     | Code                          | Formats Scrapeless API output as JSON string | Google Search, Google Trends, Web Unlocker, Scrape, Crawl | AI Agent1                 |                                                |
| AI Agent1                | Langchain Agent               | Analyzes and summarizes data with AI | Code                       | Code7                     |                                                |
| Anthropic Chat Model1    | Langchain LM (Anthropic)      | Claude model generating AI responses | AI Agent1 (ai_languageModel) | AI Agent1                |                                                |
| Code7                    | Code                          | Cleans AI output string              | AI Agent1                   | Add a comment to an issue1 |                                                |
| Add a comment to an issue1 | Linear API action             | Posts AI summary as Linear issue comment | Code7                      | (end)                     |                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Linear Trigger node:**  
   - Type: Linear Trigger  
   - Configure credentials with valid Linear API OAuth2 credentials  
   - Set Team ID to the target Linear team (`3a89590a-2521-4c4a-b3b2-7e7ad5962666`)  
   - Resources: `issue`, `comment`, `reaction`

2. **Add Switch node:**  
   - Type: Switch  
   - Mode: Expression  
   - Number outputs: 5  
   - Expression:  
     ```javascript
     $json.type === 'Issue' && $json.data.title.toLowerCase().includes('/search') ? 0 :
     $json.type === 'Issue' && $json.data.title.toLowerCase().includes('/trends') ? 1 :
     $json.type === 'Issue' && $json.data.title.toLowerCase().includes('/unlock') ? 2 :
     $json.type === 'Issue' && $json.data.title.toLowerCase().includes('/scrape') ? 3 :
     $json.type === 'Issue' && $json.data.title.toLowerCase().includes('/crawl') ? 4 :
     -1
     ```  
   - Connect Linear Trigger main output to Switch input

3. **Create five Code nodes (Code2 to Code6), one per Switch output:**  
   - Each cleans the respective command keyword from issue title:  
     ```javascript
     const originalTitle = $json.data.title;
     let cleanTitle = originalTitle;

     if (originalTitle.toLowerCase().includes('/search')) {
       cleanTitle = originalTitle.replace(/\/search/gi, '').trim();
     } else if (originalTitle.toLowerCase().includes('/trends')) {
       cleanTitle = originalTitle.replace(/\/trends/gi, '').trim();
     } else if (originalTitle.toLowerCase().includes('/unlock')) {
       cleanTitle = originalTitle.replace(/\/unlock/gi, '').trim();
     } else if (originalTitle.toLowerCase().includes('/scrape')) {
       cleanTitle = originalTitle.replace(/\/scrape/gi, '').trim();
     } else if (originalTitle.toLowerCase().includes('/crawl')) {
       cleanTitle = originalTitle.replace(/\/crawl/gi, '').trim();
     }

     return {
       data: {
         ...($json.data),
         title: cleanTitle
       }
     };
     ```  
   - Connect each Switch output 0–4 to the corresponding Code node respectively

4. **Configure Scrapeless nodes for each command:**  
   - **Google Search:**  
     - Type: Scrapeless  
     - Credentials: Scrapeless API credentials  
     - Parameter `q`: Set to `{{$json.data.title}}`  
     - Connect output of Code2 to this node  
   - **Google Trends:**  
     - Same as above but set operation to `"googleTrends"`  
     - Connect output of Code3  
   - **Web Unlocker:**  
     - Type: Scrapeless  
     - Parameters:  
       - `url`: `{{$json.data.title.replace(/\/unlock/gi, '').trim()}}` (additional cleaning)  
       - `headless`: false  
       - `resource`: "universalScrapingApi"  
     - Connect output of Code4  
   - **Scrape:**  
     - Type: Scrapeless (crawler resource)  
     - Parameter `url`: `{{$json.data.title}}`  
     - Connect output of Code5  
   - **Crawl:**  
     - Type: Scrapeless (crawler resource)  
     - Parameters:  
       - `url`: `{{$json.data.title}}`  
       - `operation`: "crawl"  
       - `limitCrawlPages`: 1  
     - Connect output of Code6  

5. **Add a Code node to format Scrapeless output:**  
   - Type: Code (runOnceForEachItem)  
   - JavaScript:  
     ```javascript
     return {
       output: JSON.stringify($json, null, 2)
     };
     ```  
   - Connect all Scrapeless nodes to this Code node

6. **Add Anthropic Chat Model node:**  
   - Type: Langchain LM Chat Anthropic  
   - Credentials: Anthropic API credentials  
   - Model: `claude-sonnet-4-20250514` (or latest Claude model)  
   - Options: temperature 0.3, max tokens 4000  

7. **Add AI Agent node:**  
   - Type: Langchain Agent  
   - Input text: `{{$json.output}}` from formatting Code node  
   - System Message (prompt):  
     ```
     You are a data analyst. Summarize search/scrape results concisely. Be factual and brief. Format for Linear comments.

     Analyze the provided data and create a structured summary that includes:
     - Key findings and insights
     - Data source and reliability assessment  
     - Actionable recommendations
     - Relevant metrics and trends
     - Next steps for further research

     Format your response with clear headers and bullet points for easy reading in Linear.
     ```  
   - Connect Anthropic Chat Model node as the language model for AI Agent node

8. **Add Code node for AI output cleaning:**  
   - Type: Code  
   - JavaScript:  
     ```javascript
     return {
       output: $json.output
         .replace(/\\n/g, '\n')
         .replace(/\\"/g, '"')
         .replace(/\\\\/g, '\\')
         .trim()
     };
     ```  
   - Connect AI Agent node output to this node

9. **Add Linear API node to add a comment:**  
   - Type: Linear  
   - Credentials: Linear API credentials (same as trigger)  
   - Resource: Comment  
   - Operation: Create  
   - Parameters:  
     - `comment`: `{{$json.output}}` from cleaning Code node  
     - `issueId`: `={{ $('Linear Trigger').item.json.data.id }}` (dynamic from trigger)  
   - Connect cleaning Code node output to this node

10. **Ensure all nodes are properly connected according to the above steps.**

11. **Activate and test the workflow** by creating issues in Linear with titles starting with `/search`, `/trends`, `/unlock`, `/scrape`, or `/crawl` followed by query or URL.

---

### 5. General Notes & Resources

| Note Content                                                                                                         | Context or Link                                                                                                            |
|----------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------|
| The workflow integrates Linear, Scrapeless, and Anthropic Claude via Langchain to automate research and summarization | This combination enables automated data retrieval and AI-driven insights directly linked to project management in Linear      |
| Scrapeless API documentation can help customize scraping and crawling parameters                                     | https://scrapeless.com/docs                                                                                                 |
| Anthropic Claude API supports advanced prompt engineering for precise AI outputs                                     | https://www.anthropic.com/index/api                                                                                         |
| Linear API requires OAuth2 credentials setup for both trigger and comment nodes                                      | https://developers.linear.app/docs/graphql/getting-started                                                                  |

---

**Disclaimer:** The text provided originates exclusively from an automated workflow built with n8n, a tool for integration and automation. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.