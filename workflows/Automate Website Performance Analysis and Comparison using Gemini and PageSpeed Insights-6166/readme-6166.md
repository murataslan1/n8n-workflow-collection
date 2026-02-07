Automate Website Performance Analysis and Comparison using Gemini and PageSpeed Insights

https://n8nworkflows.xyz/workflows/automate-website-performance-analysis-and-comparison-using-gemini-and-pagespeed-insights-6166


# Automate Website Performance Analysis and Comparison using Gemini and PageSpeed Insights

---

### 1. Workflow Overview

This n8n workflow automates website performance analysis and comparison using Google PageSpeed Insights and Google Gemini AI models. It is designed to receive URLs or comparison commands, analyze the websites’ mobile performance metrics, generate detailed reports using AI, and send summarized results to a Discord channel. The workflow supports single URL audits, batch sitemap analysis, and side-by-side mobile performance comparisons of two URLs.

The workflow is logically divided into these blocks:

- **1.1 Input Reception & Scheduling:** Receives URLs or commands via Discord messages, triggered on a schedule.
- **1.2 URL Parsing & Routing:** Parses incoming messages to distinguish between single URL analysis and comparison requests, routing accordingly.
- **1.3 Performance Data Retrieval:** Calls Google PageSpeed Insights API to retrieve performance metrics for single URLs, batch URLs from sitemaps, or compares two URLs.
- **1.4 AI Processing & Report Generation:** Uses Google Gemini LLM to analyze raw Lighthouse JSON reports and generate human-readable audit or comparison reports with structured recommendations.
- **1.5 Message Formatting:** Splits long AI-generated messages into Discord-friendly chunks.
- **1.6 Result Delivery:** Posts final reports back to a specified Discord channel.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Scheduling

- **Overview:**  
  This block initiates the workflow execution on a timer and listens for new Discord messages containing URLs or commands to analyze.

- **Nodes Involved:**  
  - Schedule Trigger  
  - Get many messages

- **Node Details:**

  - **Schedule Trigger**  
    - Type: Trigger node  
    - Role: Starts workflow every 1 minute to poll new Discord messages  
    - Configuration: Interval set to 1 minute  
    - Inputs: None  
    - Outputs: Connects to "Get many messages" node  
    - Edge Cases: Potential delay if Discord API rate limits; ensure webhook ID is valid

  - **Get many messages**  
    - Type: Discord node  
    - Role: Retrieves latest messages from a specific Discord guild and channel  
    - Configuration:  
      - Limit: 1 message per poll  
      - Guild ID and Channel ID set to designated Discord server and channel for page speed insights  
      - Operation: "getAll" messages  
    - Inputs: Trigger from Schedule Trigger  
    - Outputs: Connects to "Switch" for routing  
    - Edge Cases: Discord API rate limits, empty channel, or invalid credentials could cause failures

#### 2.2 URL Parsing & Routing

- **Overview:**  
  Determines if the incoming message contains a single URL for analysis or a comparison command with two URLs and routes the flow accordingly.

- **Nodes Involved:**  
  - Switch  
  - Parse Url

- **Node Details:**

  - **Switch**  
    - Type: Switch node  
    - Role: Routes messages based on content prefix: either a URL starting with "http" or a "compare" command  
    - Configuration:  
      - Condition 1 ("process single"): message content starts with "http"  
      - Condition 2 ("compare"): message content starts with "compare"  
    - Inputs: From "Get many messages"  
    - Outputs:  
      - "process single" → "Analyze Single url"  
      - "compare" → "Parse Url"  
    - Edge Cases: Messages not matching either condition are ignored; expression parsing errors if content missing

  - **Parse Url**  
    - Type: Code node  
    - Role: Extracts URLs from the message text for comparison or single analysis  
    - Configuration:  
      - Extracts URLs using regex  
      - If "compare" found and multiple URLs present, outputs object with url1 and url2 for comparison  
      - Else outputs url1 for single URL analysis  
    - Inputs: From Switch (compare output)  
    - Outputs: Connects to "Compare Mobile Performance" for comparisons or "Analyze Single url" otherwise  
    - Edge Cases: Malformed URLs or missing URLs can cause empty outputs

#### 2.3 Performance Data Retrieval

- **Overview:**  
  This block calls Google PageSpeed Insights API to retrieve detailed web performance data for analysis or comparison.

- **Nodes Involved:**  
  - Analyze Single url  
  - Analyze multiple url in batch (not connected in current workflow)  
  - Analyze from sitemap (not connected in current workflow)  
  - Compare Mobile Performance

- **Node Details:**

  - **Analyze Single url**  
    - Type: Google PageSpeed Insights node  
    - Role: Performs audit for one URL  
    - Configuration:  
      - URL set dynamically from incoming JSON content  
      - Credentials: Uses Google PageSpeed API key  
    - Input: From Switch "process single" output  
    - Output: Connects to "AI Agent" for report generation  
    - Edge Cases: Invalid URLs, API quota limits, or network timeouts

  - **Compare Mobile Performance**  
    - Type: Google PageSpeed Insights node  
    - Role: Compares two URLs’ mobile performance metrics  
    - Configuration:  
      - url1 and url2 set dynamically from parsed message  
      - Operation: "compareUrls"  
      - Credentials: Google PageSpeed API  
    - Input: From "Parse Url" node  
    - Output: Connects to "Compare Website" for AI analysis  
    - Edge Cases: Missing second URL, API failures, invalid URLs

  - **Analyze multiple url in batch** and **Analyze from sitemap** nodes exist but are not connected in the current workflow execution path; they provide batch and sitemap analysis capabilities if integrated.

#### 2.4 AI Processing & Report Generation

- **Overview:**  
  Uses Google Gemini LLM and LangChain to transform raw Lighthouse JSON data or comparison JSON into detailed, actionable audit or comparison reports formatted for Discord.

- **Nodes Involved:**  
  - AI Agent  
  - Gemini  
  - Compare Website

- **Node Details:**

  - **AI Agent**  
    - Type: LangChain LLM Chain node  
    - Role: Processes single URL Lighthouse JSON data to generate structured audit report  
    - Configuration:  
      - Prompt instructs to produce a detailed SEO and performance audit report with sections: Executive Summary, Scorecard, Strengths, Recommendations  
      - Output split into multiple Discord-length messages (handled downstream)  
    - Input: From "Analyze Single url"  
    - Output: Connects to "Parse Into Sections" for message chunking  
    - Credentials: Uses Google Gemini API credentials  
    - Edge Cases: Large JSON input may cause timeout or incomplete responses

  - **Gemini**  
    - Type: Google Gemini LLM node  
    - Role: Provides language model processing for both AI Agent and Compare Website nodes  
    - Configuration: No special options; acts as language model provider  
    - Input: Feeds AI Agent and Compare Website nodes  
    - Credentials: Google Palm API key  
    - Edge Cases: API quota limits or service downtime

  - **Compare Website**  
    - Type: LangChain LLM Chain node  
    - Role: Generates a structured Discord-optimized report comparing two websites’ mobile performance  
    - Configuration:  
      - Multi-message output with Discord markdown formatting and emojis  
      - Includes executive summary, scorecard, metrics deep dive, insights, and recommendations  
    - Input: From "Compare Mobile Performance"  
    - Output: Connects to "Parse Comparison" for message chunking  
    - Credentials: Uses Google Gemini API  
    - Edge Cases: Very large comparison data may cause response truncation

#### 2.5 Message Formatting

- **Overview:**  
  Splits long AI-generated messages into smaller chunks compatible with Discord message length limits, preserving readability and formatting.

- **Nodes Involved:**  
  - Parse Into Sections  
  - Parse Comparison

- **Node Details:**

  - **Parse Into Sections**  
    - Type: Code node  
    - Role: Splits long single URL audit messages into chunks ≤1900 characters  
    - Configuration:  
      - Splits by paragraphs, then sentences, intelligently to avoid breaking mid-sentence  
      - Outputs multiple message chunks with indexing  
    - Input: From "AI Agent"  
    - Output: Connects to "Send a message"  
    - Edge Cases: Very long paragraphs may be forcibly truncated

  - **Parse Comparison**  
    - Type: Code node  
    - Role: Splits AI comparison report messages similarly, but expects pre-formatted message delimiters ("--- (Message X/Y) ---")  
    - Configuration:  
      - Splits on explicit message delimiters  
      - If none found and message too long, splits by paragraphs and sentences  
    - Input: From "Compare Website"  
    - Output: Connects to "Send a message"  
    - Edge Cases: Missing delimiters or malformed text may cause improper splits

#### 2.6 Result Delivery

- **Overview:**  
  Sends the processed and formatted audit or comparison messages back to the Discord channel.

- **Nodes Involved:**  
  - Send a message

- **Node Details:**

  - **Send a message**  
    - Type: Discord node  
    - Role: Posts messages (audit or comparison) to specified Discord guild and channel  
    - Configuration:  
      - Content set dynamically from input message chunk  
      - Guild ID and Channel ID match those used in input reception  
      - Uses Discord bot credentials  
    - Inputs: From either "Parse Into Sections" or "Parse Comparison"  
    - Outputs: None (end of workflow)  
    - Edge Cases: Discord API rate limits, invalid credentials, or message length over limit

---

### 3. Summary Table

| Node Name               | Node Type                                   | Functional Role                      | Input Node(s)              | Output Node(s)            | Sticky Note                                                                                   |
|-------------------------|---------------------------------------------|-----------------------------------|----------------------------|---------------------------|-----------------------------------------------------------------------------------------------|
| Schedule Trigger        | scheduleTrigger                             | Workflow starter on timer          | None                       | Get many messages          |                                                                                               |
| Get many messages       | discord                                    | Fetch new Discord messages         | Schedule Trigger            | Switch                    |                                                                                               |
| Switch                 | switch                                     | Route messages by content prefix   | Get many messages           | Analyze Single url, Parse Url |                                                                                               |
| Analyze Single url      | googlePageSpeed                            | Analyze performance of single URL  | Switch ("process single")   | AI Agent                  |                                                                                               |
| Parse Url              | code                                       | Extract URLs from message for comparison or single analysis | Switch ("compare")          | Compare Mobile Performance  |                                                                                               |
| Compare Mobile Performance | googlePageSpeed                          | Compare two URLs mobile performance | Parse Url                  | Compare Website           |                                                                                               |
| AI Agent               | chainLlm (LangChain)                        | Generate audit report for single URL | Analyze Single url          | Parse Into Sections       |                                                                                               |
| Gemini                 | lmChatGoogleGemini                          | LLM provider for AI Agent and Compare Website | None                       | AI Agent, Compare Website |                                                                                               |
| Compare Website        | chainLlm (LangChain)                        | Generate Discord-optimized comparison report | Compare Mobile Performance | Parse Comparison          |                                                                                               |
| Parse Into Sections    | code                                       | Split long audit messages for Discord | AI Agent                   | Send a message            |                                                                                               |
| Parse Comparison       | code                                       | Split long comparison messages for Discord | Compare Website            | Send a message            |                                                                                               |
| Send a message         | discord                                    | Send final messages to Discord    | Parse Into Sections, Parse Comparison | None                    |                                                                                               |
| Analyze multiple url in batch | googlePageSpeed                        | Batch analyze multiple URLs (unused) | None                       | None                      |                                                                                               |
| Analyze from sitemap    | googlePageSpeed                            | Analyze URLs from sitemap (unused) | None                       | None                      |                                                                                               |
| Sticky Note            | stickyNote                                 | Info about getting Google API key | None                       | None                      | "## get your key [Here](https://developers.google.com/speed/docs/insights/v5/get-started)"     |
| Sticky Note1           | stickyNote                                 | Available Tools description       | None                       | None                      | "## Available Tools"                                                                           |
| Sticky Note2           | stickyNote                                 | Usage guideline                   | None                       | None                      | "## Guideline\n- send single url to measure your web performance\n- compare url by sending ``compare, \"url1\", \"url2\"``\n\nall url must started with http / https" |

---

### 4. Reproducing the Workflow from Scratch

1. **Create "Schedule Trigger" node**  
   - Type: Schedule Trigger  
   - Set to run every 1 minute

2. **Create "Get many messages" Discord node**  
   - Type: Discord  
   - Operation: getAll messages  
   - Limit: 1  
   - Set Guild ID to your Discord server ID  
   - Set Channel ID to your target Discord channel ID for receiving commands  
   - Connect "Schedule Trigger" output to this node

3. **Create "Switch" node**  
   - Type: Switch  
   - Add two outputs with conditions:  
     - Output 1 ("process single"): Condition: `$json.content` starts with "http"  
     - Output 2 ("compare"): Condition: `$json.content` starts with "compare"  
   - Connect "Get many messages" output to this node

4. **Create "Analyze Single url" Google PageSpeed Insights node**  
   - Type: Google PageSpeed Insights  
   - Set URL parameter to `={{ $json.content }}` dynamically  
   - Use your Google PageSpeed API credentials  
   - Connect "Switch" output "process single" to this node

5. **Create "AI Agent" LangChain LLM node**  
   - Type: LangChain Chain LLM  
   - Configure prompt with instruction to analyze Lighthouse JSON and produce audit report with sections (Executive Summary, Scorecard, etc.)  
   - Set input text to `={{ $json }}`  
   - Use Google Gemini credentials  
   - Connect "Analyze Single url" output to this node

6. **Create "Parse Into Sections" code node**  
   - Type: Code  
   - Paste the provided JavaScript splitting long messages intelligently for Discord (see code in 2.5)  
   - Connect "AI Agent" output to this node

7. **Create "Send a message" Discord node**  
   - Type: Discord  
   - Configure to send message content from `{{$json.message}}`  
   - Same Guild ID and Channel ID as "Get many messages"  
   - Use your Discord bot credentials  
   - Connect "Parse Into Sections" output to this node

8. **Create "Parse Url" code node**  
   - Type: Code  
   - Use provided code to extract URLs and detect comparison commands (see code in 2.2)  
   - Connect "Switch" output "compare" to this node

9. **Create "Compare Mobile Performance" Google PageSpeed Insights node**  
   - Type: Google PageSpeed Insights  
   - Operation: "compareUrls"  
   - Set url1 and url2 dynamically from parsed JSON fields `={{ $json.url1 }}` and `={{ $json.url2 }}`  
   - Use Google PageSpeed API credentials  
   - Connect "Parse Url" output to this node

10. **Create "Compare Website" LangChain Chain LLM node**  
    - Type: LangChain Chain LLM  
    - Configure prompt for web performance comparison report with Discord markdown formatting in 4 messages  
    - Set input text to `={{ $json }}`  
    - Use Google Gemini credentials  
    - Connect "Compare Mobile Performance" output to this node

11. **Create "Parse Comparison" code node**  
    - Type: Code  
    - Paste provided JavaScript code to split multi-message comparison output (see 2.5)  
    - Connect "Compare Website" output to this node

12. **Connect "Parse Comparison" output to "Send a message" node**  
    - This shares the same final node for sending messages to Discord

13. **Optional: Add sticky notes**  
    - Add sticky notes anywhere with the content:  
      - API key info with link: https://developers.google.com/speed/docs/insights/v5/get-started  
      - Usage guideline: send single URLs or "compare, url1, url2" commands; URLs must start with http/https  
      - Available tools description

14. **Credential Setup**  
    - Google PageSpeed API key credential setup in n8n with valid API key  
    - Google Gemini (Google Palm API) credentials for AI nodes  
    - Discord Bot credentials with required permissions for message reading and sending in the target guild and channel

15. **Test the workflow**  
    - Send a message in Discord channel with a single URL (e.g., `https://example.com`)  
    - Send a message to compare two URLs (e.g., `compare, https://site1.com, https://site2.com`)  
    - Verify reports are generated and posted back properly

---

### 5. General Notes & Resources

| Note Content                                                                                          | Context or Link                                                                                     |
|-----------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| Get your Google PageSpeed API key here: [Google PageSpeed Insights API Key](https://developers.google.com/speed/docs/insights/v5/get-started) | Sticky Note with API key acquisition instructions                                                  |
| Guideline for usage: send single URL or comparison commands, URLs must start with http/https         | Sticky Note2 content in workflow                                                                   |
| The AI prompts are designed for producing actionable SEO and performance reports with technical details | Useful for extending or customizing AI behavior                                                   |
| Uses Google Gemini LLM via LangChain integration for advanced natural language analysis               | Requires Google Palm API access                                                                    |
| Discord message limits (1900 chars) are respected by message chunking nodes to ensure smooth posting | Important for preventing message truncation or rejection by Discord API                            |

---

**Disclaimer:** The provided text is extracted exclusively from an automated n8n workflow. All data processed is legal and public, the workflow respects content policies, and contains no illegal or offensive content.

---