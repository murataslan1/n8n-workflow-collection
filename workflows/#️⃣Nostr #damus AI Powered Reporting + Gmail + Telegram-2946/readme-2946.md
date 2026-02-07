#️⃣Nostr #damus AI Powered Reporting + Gmail + Telegram

https://n8nworkflows.xyz/workflows/---nostr--damus-ai-powered-reporting---gmail---telegram-2946


# #️⃣Nostr #damus AI Powered Reporting + Gmail + Telegram

### 1. Workflow Overview

This workflow automates the collection, analysis, and reporting of Nostr social network threads tagged with the hashtag `#damus`. It leverages the n8n Community Node for Nostr to read relevant threads, processes the content using AI language models (Google Gemini via LangChain nodes), and distributes summarized reports via Gmail and Telegram. The workflow is designed for self-hosted n8n instances and targets community managers, social media analysts, or developers interested in decentralized social media insights.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception and Triggering**: Manual and scheduled triggers to start the workflow.
- **1.2 Data Acquisition from Nostr**: Reading Nostr threads tagged with `#damus`.
- **1.3 Content Aggregation**: Combining multiple thread contents into a single aggregated dataset.
- **1.4 AI Processing and Thematic Analysis**: Using AI to extract themes, analyze threads, and generate detailed reports.
- **1.5 Formatting and Conversion**: Converting AI outputs from markdown to HTML.
- **1.6 Distribution**: Sending the processed reports via Gmail and Telegram.
- **1.7 Utility and Documentation**: Sticky notes for workflow documentation and user guidance.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception and Triggering

**Overview:**  
This block initiates the workflow either manually or on a scheduled interval.

**Nodes Involved:**  
- When clicking ‘Test workflow’ (Manual Trigger)  
- Schedule Trigger (Scheduled Trigger)

**Node Details:**

- **When clicking ‘Test workflow’**  
  - Type: Manual Trigger  
  - Role: Allows manual start of the workflow for testing or ad-hoc runs.  
  - Configuration: Default manual trigger with no parameters.  
  - Input: None  
  - Output: Triggers the Nostr Read node.  
  - Edge Cases: None significant; manual trigger requires user interaction.

- **Schedule Trigger**  
  - Type: Schedule Trigger  
  - Role: Automatically triggers the workflow at regular intervals (default every minute).  
  - Configuration: Interval set to default (every minute).  
  - Input: None  
  - Output: Triggers the Nostr Read node.  
  - Edge Cases: Potential for overlapping executions if processing takes longer than interval.

---

#### 1.2 Data Acquisition from Nostr

**Overview:**  
Fetches Nostr events (threads) tagged with `#damus` using the Nostr Community Node.

**Nodes Involved:**  
- Nostr Read #damus

**Node Details:**

- **Nostr Read #damus**  
  - Type: n8n-nodes-nostrobots.nostrobotsread (Community Node for Nostr)  
  - Role: Reads Nostr events with hashtag `#damus` from the decentralized network.  
  - Configuration:  
    - Strategy: `hashtag`  
    - Hashtag: `#damus`  
    - From: 180 (likely a timestamp or event offset to limit results)  
  - Input: Trigger from manual or schedule trigger  
  - Output: Emits JSON array of Nostr events matching the hashtag  
  - Edge Cases: Network latency, node connectivity issues, or empty results if no recent events.  
  - Requirements: Self-hosted n8n instance; community node not supported on n8n cloud.

---

#### 1.3 Content Aggregation

**Overview:**  
Aggregates the content field from all fetched Nostr events into a single combined dataset.

**Nodes Involved:**  
- Aggregate #damus Content

**Node Details:**

- **Aggregate #damus Content**  
  - Type: Aggregate  
  - Role: Combines the `content` field from all incoming Nostr events into one aggregated output.  
  - Configuration: Aggregates on the `content` field only.  
  - Input: Output from Nostr Read #damus  
  - Output: Aggregated content array for further AI processing  
  - Edge Cases: Empty input array results in empty aggregation.

---

#### 1.4 AI Processing and Thematic Analysis

**Overview:**  
Uses Google Gemini AI models via LangChain nodes to extract themes from the aggregated content, analyze threads, and generate detailed reports.

**Nodes Involved:**  
- #damus Thread Themes  
- #damus Themes List  
- #damus Themes & Threads Report  
- gemini-2.0-flash-lite-preview (AI model node for #damus Thread Themes)  
- gemini-2.0-flash-lite-preview1 (AI model node for #damus Themes List)  
- gemini-2.0-flash-lite-preview2 (AI model node for #damus Themes & Threads Report)  
- Merge Themes and Content

**Node Details:**

- **#damus Thread Themes**  
  - Type: LangChain Chain LLM  
  - Role: Extracts themes and common threads from the aggregated Nostr threads.  
  - Configuration: Prompt instructs to identify themes and reasons for hashtagging #damus, using the JSON content.  
  - Input: Aggregated content from Aggregate #damus Content (via AI model gemini-2.0-flash-lite-preview)  
  - Output: Textual theme summary for further processing and distribution  
  - Edge Cases: AI model response variability, input size limits.

- **#damus Themes List**  
  - Type: LangChain Chain LLM  
  - Role: Extracts a list of themes from the text input.  
  - Configuration: Prompt requests a list of themes without preamble or explanation.  
  - Input: Output from #damus Thread Themes (via AI model gemini-2.0-flash-lite-preview1)  
  - Output: Clean list of themes  
  - Edge Cases: AI model misinterpretation or empty input.

- **#damus Themes & Threads Report**  
  - Type: LangChain Chain LLM  
  - Role: Generates a detailed report analyzing the Nostr threads with #damus hashtag, including insights and suggestions.  
  - Configuration: Complex prompt requesting structured analysis with bullet points, quotes, and observations.  
  - Input: Merged themes and content (Merge Themes and Content node) (via AI model gemini-2.0-flash-lite-preview2)  
  - Output: Detailed markdown report  
  - Edge Cases: AI model response length, formatting consistency.

- **Merge Themes and Content**  
  - Type: Merge  
  - Role: Combines outputs from #damus Themes List and Aggregate #damus Content for comprehensive input to the report node.  
  - Configuration: Combine mode by position (merges corresponding items by their order)  
  - Input: #damus Themes List and Aggregate #damus Content  
  - Output: Combined data for report generation  
  - Edge Cases: Mismatched array lengths could cause incomplete merges.

- **gemini-2.0-flash-lite-preview, gemini-2.0-flash-lite-preview1, gemini-2.0-flash-lite-preview2**  
  - Type: LangChain LM Chat Google Gemini  
  - Role: AI language model nodes that process prompts and generate text outputs.  
  - Configuration:  
    - Model: `models/gemini-2.0-flash-lite-preview`  
    - Temperature: 0.4 (moderate creativity)  
  - Credentials: Google PaLM API account  
  - Input/Output: Connected to respective LangChain nodes for AI processing  
  - Edge Cases: API rate limits, authentication errors, network issues.

---

#### 1.5 Formatting and Conversion

**Overview:**  
Converts AI-generated markdown reports into HTML format suitable for email and Telegram messaging.

**Nodes Involved:**  
- Get HTML  
- Get HTML Report

**Node Details:**

- **Get HTML**  
  - Type: Markdown  
  - Role: Converts markdown text from AI outputs into HTML.  
  - Configuration: Mode set to `markdownToHtml` with default options.  
  - Input: Text from #damus Thread Themes AI output  
  - Output: HTML formatted text for Gmail and Telegram messages  
  - Edge Cases: Markdown syntax errors could affect HTML output.

- **Get HTML Report**  
  - Type: Markdown  
  - Role: Converts the detailed report markdown into HTML.  
  - Configuration: Same as Get HTML node.  
  - Input: Text from #damus Themes & Threads Report AI output  
  - Output: HTML formatted report for distribution  
  - Edge Cases: Same as above.

---

#### 1.6 Distribution

**Overview:**  
Sends the generated HTML reports via Gmail and Telegram to predefined recipients.

**Nodes Involved:**  
- Gmail Themes  
- Gmail Report  
- Telegram Themes  
- Telegram Themes & Threads

**Node Details:**

- **Gmail Themes**  
  - Type: Gmail  
  - Role: Sends the HTML summary of themes via email.  
  - Configuration:  
    - Recipient: `joe@example.com` (placeholder)  
    - Subject: `#damus`  
    - Message: HTML content from Get HTML node  
    - Append Attribution: Disabled  
  - Credentials: Gmail OAuth2 account  
  - Input: HTML from Get HTML  
  - Output: Email sent confirmation  
  - Edge Cases: OAuth token expiration, email delivery failures.

- **Gmail Report**  
  - Type: Gmail  
  - Role: Sends the detailed HTML report via email.  
  - Configuration: Same as Gmail Themes but message from Get HTML Report node  
  - Credentials: Same Gmail OAuth2 account  
  - Input: HTML from Get HTML Report  
  - Output: Email sent confirmation  
  - Edge Cases: Same as above.

- **Telegram Themes**  
  - Type: Telegram  
  - Role: Sends the themes summary as a Telegram message.  
  - Configuration:  
    - Chat ID: Environment variable `TELEGRAM_CHAT_ID`  
    - Text: HTML content truncated to 4000 characters from Get HTML node  
    - Parse Mode: HTML  
    - Append Attribution: Disabled  
  - Credentials: Telegram API account  
  - Input: HTML from Get HTML  
  - Output: Message sent confirmation  
  - Edge Cases: Telegram API limits, chat ID misconfiguration.

- **Telegram Themes & Threads**  
  - Type: Telegram  
  - Role: Sends the detailed themes and threads report as a Telegram message.  
  - Configuration: Same as Telegram Themes but message from Get HTML Report node  
  - Credentials: Same Telegram API account  
  - Input: HTML from Get HTML Report  
  - Output: Message sent confirmation  
  - Edge Cases: Same as above.

---

#### 1.7 Utility and Documentation

**Overview:**  
Sticky notes provide contextual information, instructions, and references for users maintaining or understanding the workflow.

**Nodes Involved:**  
- Sticky Note  
- Sticky Note1  
- Sticky Note2  
- Sticky Note3  
- Sticky Note4  
- Sticky Note5  
- Sticky Note6

**Node Details:**

- **Sticky Notes**  
  - Type: Sticky Note  
  - Role: Display workflow documentation, branding, instructions, and external links.  
  - Content Highlights:  
    - #damus Threads Themes explanation  
    - Nostr and Damus project links  
    - n8n Community Node GitHub repository  
    - Telegram section headers  
    - Encouragement to try the workflow  
  - Input/Output: None (informational only)  
  - Edge Cases: None

---

### 3. Summary Table

| Node Name                  | Node Type                                | Functional Role                          | Input Node(s)               | Output Node(s)                  | Sticky Note                                                                                  |
|----------------------------|----------------------------------------|----------------------------------------|-----------------------------|-------------------------------|----------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’ | Manual Trigger                         | Manual workflow start                   | None                        | Nostr Read #damus              | Try Me!                                                                                      |
| Schedule Trigger            | Schedule Trigger                       | Scheduled workflow start                | None                        | Nostr Read #damus              | Get Nostr Threads with Hashtag #damus + project links + n8n Community Node GitHub link       |
| Nostr Read #damus          | Nostr Community Node (Read)            | Fetch Nostr threads with #damus hashtag| When clicking ‘Test workflow’, Schedule Trigger | Aggregate #damus Content        | Get Nostr Threads with Hashtag #damus + project links + n8n Community Node GitHub link       |
| Aggregate #damus Content    | Aggregate                             | Combine content fields from threads    | Nostr Read #damus            | #damus Thread Themes, Merge Themes and Content |                                                                                              |
| #damus Thread Themes       | LangChain Chain LLM                    | Extract themes and common threads      | Aggregate #damus Content     | Get HTML, #damus Themes List, Telegram Themes | #damus Threads Themes                                                                        |
| gemini-2.0-flash-lite-preview | LangChain LM Chat Google Gemini       | AI processing for thread themes        | #damus Thread Themes (AI input) | #damus Thread Themes (AI output) | #damus Threads Themes                                                                        |
| #damus Themes List         | LangChain Chain LLM                    | Extract list of themes                  | #damus Thread Themes         | Merge Themes and Content       | #damus Threads Themes                                                                        |
| gemini-2.0-flash-lite-preview1 | LangChain LM Chat Google Gemini       | AI processing for themes list           | #damus Themes List (AI input) | #damus Themes List (AI output) | #damus Threads Themes                                                                        |
| Merge Themes and Content   | Merge                                | Combine themes list and content         | #damus Themes List, Aggregate #damus Content | #damus Themes & Threads Report |                                                                                              |
| #damus Themes & Threads Report | LangChain Chain LLM                    | Generate detailed analysis report       | Merge Themes and Content     | Get HTML Report, Telegram Themes & Threads | #damus Threads & Threads Report                                                             |
| gemini-2.0-flash-lite-preview2 | LangChain LM Chat Google Gemini       | AI processing for detailed report       | #damus Themes & Threads Report (AI input) | #damus Themes & Threads Report (AI output) | #damus Threads & Threads Report                                                             |
| Get HTML                   | Markdown                             | Convert markdown to HTML for themes     | #damus Thread Themes         | Gmail Themes, Telegram Themes  | #damus Threads Themes                                                                        |
| Get HTML Report            | Markdown                             | Convert markdown to HTML for report     | #damus Themes & Threads Report | Gmail Report, Telegram Themes & Threads | #damus Threads & Threads Report                                                             |
| Gmail Themes               | Gmail                                | Send themes summary via email           | Get HTML                    | None                         |                                                                                              |
| Gmail Report               | Gmail                                | Send detailed report via email          | Get HTML Report             | None                         |                                                                                              |
| Telegram Themes            | Telegram                             | Send themes summary via Telegram        | Get HTML                    | None                         | Telegram                                                                                     |
| Telegram Themes & Threads  | Telegram                             | Send detailed report via Telegram       | Get HTML Report             | None                         | Telegram                                                                                     |
| Sticky Note                | Sticky Note                         | Documentation and branding               | None                        | None                         | #damus Threads Themes                                                                        |
| Sticky Note1               | Sticky Note                         | Documentation and branding               | None                        | None                         | #damus Threads Themes                                                                        |
| Sticky Note2               | Sticky Note                         | Documentation and branding               | None                        | None                         | #damus Threads & Threads Report                                                             |
| Sticky Note3               | Sticky Note                         | Documentation and branding               | None                        | None                         | Get Nostr Threads with Hashtag #damus + project links + n8n Community Node GitHub link       |
| Sticky Note4               | Sticky Note                         | Documentation and branding               | None                        | None                         | Telegram                                                                                     |
| Sticky Note5               | Sticky Note                         | Documentation and branding               | None                        | None                         | Telegram                                                                                     |
| Sticky Note6               | Sticky Note                         | Documentation and branding               | None                        | None                         | Try Me!                                                                                      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Type: Manual Trigger  
   - Name: `When clicking ‘Test workflow’`  
   - No parameters needed.

2. **Create Schedule Trigger Node**  
   - Type: Schedule Trigger  
   - Name: `Schedule Trigger`  
   - Configure interval to default (every minute or desired frequency).

3. **Create Nostr Read Node**  
   - Type: `n8n-nodes-nostrobots.nostrobotsread` (Community Node for Nostr)  
   - Name: `Nostr Read #damus`  
   - Parameters:  
     - Strategy: `hashtag`  
     - Hashtag: `#damus`  
     - From: `180` (adjust as needed)  
   - Connect outputs of Manual Trigger and Schedule Trigger to this node.

4. **Create Aggregate Node**  
   - Type: Aggregate  
   - Name: `Aggregate #damus Content`  
   - Configure to aggregate the field `content` from incoming data.

5. **Create LangChain Chain LLM Node for Thread Themes**  
   - Type: `@n8n/n8n-nodes-langchain.chainLlm`  
   - Name: `#damus Thread Themes`  
   - Parameters:  
     - Prompt: Extract themes and highlight common threads from the JSON content, focusing on #damus hashtag reasons.  
   - Connect input from Aggregate node.

6. **Create LangChain LM Chat Google Gemini Node for Thread Themes**  
   - Type: `@n8n/n8n-nodes-langchain.lmChatGoogleGemini`  
   - Name: `gemini-2.0-flash-lite-preview`  
   - Parameters:  
     - Model Name: `models/gemini-2.0-flash-lite-preview`  
     - Temperature: 0.4  
   - Credentials: Google PaLM API account configured.  
   - Connect input from `#damus Thread Themes` node.

7. **Create LangChain Chain LLM Node for Themes List**  
   - Type: `@n8n/n8n-nodes-langchain.chainLlm`  
   - Name: `#damus Themes List`  
   - Parameters:  
     - Prompt: Extract a list of themes from the text input without preamble.  
   - Connect input from `#damus Thread Themes` node.

8. **Create LangChain LM Chat Google Gemini Node for Themes List**  
   - Type: `@n8n/n8n-nodes-langchain.lmChatGoogleGemini`  
   - Name: `gemini-2.0-flash-lite-preview1`  
   - Parameters: Same as previous Gemini node.  
   - Connect input from `#damus Themes List` node.

9. **Create Merge Node**  
   - Type: Merge  
   - Name: `Merge Themes and Content`  
   - Mode: Combine by position  
   - Connect inputs from `#damus Themes List` and `Aggregate #damus Content`.

10. **Create LangChain Chain LLM Node for Detailed Report**  
    - Type: `@n8n/n8n-nodes-langchain.chainLlm`  
    - Name: `#damus Themes & Threads Report`  
    - Parameters:  
      - Prompt: Detailed analysis report with structured sections, examples, and suggestions based on merged themes and content.  
    - Connect input from `Merge Themes and Content`.

11. **Create LangChain LM Chat Google Gemini Node for Detailed Report**  
    - Type: `@n8n/n8n-nodes-langchain.lmChatGoogleGemini`  
    - Name: `gemini-2.0-flash-lite-preview2`  
    - Parameters: Same as previous Gemini nodes.  
    - Connect input from `#damus Themes & Threads Report`.

12. **Create Markdown Node for Themes HTML Conversion**  
    - Type: Markdown  
    - Name: `Get HTML`  
    - Parameters:  
      - Mode: `markdownToHtml`  
      - Input: Text from `#damus Thread Themes` node.

13. **Create Markdown Node for Report HTML Conversion**  
    - Type: Markdown  
    - Name: `Get HTML Report`  
    - Parameters: Same as above, input from `#damus Themes & Threads Report`.

14. **Create Gmail Node for Sending Themes Email**  
    - Type: Gmail  
    - Name: `Gmail Themes`  
    - Parameters:  
      - Send To: `joe@example.com` (replace with actual recipient)  
      - Subject: `#damus`  
      - Message: HTML from `Get HTML` node  
      - Append Attribution: Disabled  
    - Credentials: Configure Gmail OAuth2 credentials.

15. **Create Gmail Node for Sending Report Email**  
    - Type: Gmail  
    - Name: `Gmail Report`  
    - Parameters: Same as above, message from `Get HTML Report`.

16. **Create Telegram Node for Sending Themes Message**  
    - Type: Telegram  
    - Name: `Telegram Themes`  
    - Parameters:  
      - Chat ID: Use environment variable `TELEGRAM_CHAT_ID`  
      - Text: HTML from `Get HTML` truncated to 4000 characters  
      - Parse Mode: HTML  
      - Append Attribution: Disabled  
    - Credentials: Configure Telegram API credentials.

17. **Create Telegram Node for Sending Report Message**  
    - Type: Telegram  
    - Name: `Telegram Themes & Threads`  
    - Parameters: Same as above, text from `Get HTML Report`.

18. **Connect Nodes According to Workflow Logic**  
    - Manual Trigger and Schedule Trigger → Nostr Read #damus  
    - Nostr Read #damus → Aggregate #damus Content  
    - Aggregate #damus Content → #damus Thread Themes and Merge Themes and Content (second input)  
    - #damus Thread Themes → gemini-2.0-flash-lite-preview → #damus Thread Themes output  
    - #damus Thread Themes → #damus Themes List → gemini-2.0-flash-lite-preview1 → #damus Themes List output  
    - #damus Themes List and Aggregate #damus Content → Merge Themes and Content  
    - Merge Themes and Content → #damus Themes & Threads Report → gemini-2.0-flash-lite-preview2 → #damus Themes & Threads Report output  
    - #damus Thread Themes → Get HTML → Gmail Themes and Telegram Themes  
    - #damus Themes & Threads Report → Get HTML Report → Gmail Report and Telegram Themes & Threads

19. **Add Sticky Notes for Documentation**  
    - Add sticky notes with content describing the workflow, project links, and instructions as per original workflow.

---

### 5. General Notes & Resources

| Note Content                                                                                                   | Context or Link                                                                                  |
|---------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| The n8n Nostr Community Node integrates Nostr protocol functionality into workflows for decentralized social media automation. | https://github.com/ocknamo/n8n-nodes-nostrobots                                               |
| Nostr is a decentralized social network protocol; Damus is a client app available on iOS, iPad, and macOS.    | https://nostr.com/ https://damus.io/ https://damus.io/notedeck/                                |
| This workflow is ideal for self-hosted n8n instances; community nodes are not supported on n8n cloud.          | Disclaimer in workflow description                                                             |
| Google Gemini (PaLM) API is used for AI language model processing via LangChain nodes.                         | Requires Google PaLM API credentials configured in n8n                                         |
| Telegram messages use environment variable `TELEGRAM_CHAT_ID` for chat identification.                         | Set environment variables in n8n instance settings                                             |
| Gmail nodes require OAuth2 credentials configured with appropriate scopes for sending emails.                  | Gmail OAuth2 credential setup required                                                         |

---

This documentation provides a complete, detailed reference for understanding, reproducing, and maintaining the `#️⃣Nostr #damus AI Powered Reporting + Gmail + Telegram` workflow in n8n.