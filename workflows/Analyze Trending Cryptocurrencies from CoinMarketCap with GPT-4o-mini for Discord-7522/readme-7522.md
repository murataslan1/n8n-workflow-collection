Analyze Trending Cryptocurrencies from CoinMarketCap with GPT-4o-mini for Discord

https://n8nworkflows.xyz/workflows/analyze-trending-cryptocurrencies-from-coinmarketcap-with-gpt-4o-mini-for-discord-7522


# Analyze Trending Cryptocurrencies from CoinMarketCap with GPT-4o-mini for Discord

### 1. Workflow Overview

This n8n workflow automates the process of scraping trending cryptocurrency data from CoinMarketCap, analyzing this data using an AI agent powered by OpenAI’s GPT-4o-mini model, and delivering a formatted, insightful summary message directly into a specified Discord channel. It targets cryptocurrency enthusiasts, analysts, or communities who want timely, concise overviews of market movements without manual data gathering or analysis.

The workflow is logically divided into these blocks:

- **1.1 Scheduling & Triggering**: Multiple schedule triggers allow the workflow to run at different predefined hours, ensuring regular updates throughout the early morning. It also supports manual triggering from other workflows.
- **1.2 Data Acquisition & Preparation**: An HTTP Request node fetches the trending cryptocurrencies webpage, and a Markdown node processes the raw HTML content into a usable text format.
- **1.3 AI Analysis & Summarization**: An AI Agent node uses a custom prompt to instruct the OpenAI GPT-4o-mini model to analyze the trending coins and generate a styled Markdown message with key insights, price data, and links.
- **1.4 Output Delivery**: The summarized message is posted to a designated Discord server channel using the Discord node.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduling & Triggering

- **Overview:** Controls when the workflow runs, providing flexibility for automated updates at different times or manual execution.
- **Nodes Involved:**  
  - Schedule Trigger  
  - Schedule Trigger1  
  - Schedule Trigger2  
  - Schedule Trigger3  
  - Schedule Trigger4  
  - Schedule Trigger5  
  - Schedule Trigger6  
  - When Executed by Another Workflow  

- **Node Details:**

| Node Name                        | Details                                                                                     |
|---------------------------------|---------------------------------------------------------------------------------------------|
| Schedule Trigger                | Type: Schedule Trigger. Configured to trigger at 1 AM daily. Initiates the workflow run.    |
| Schedule Trigger1               | Type: Schedule Trigger. Triggers at 2 AM daily for additional daily runs.                   |
| Schedule Trigger2               | Type: Schedule Trigger. Triggers at 3 AM daily.                                            |
| Schedule Trigger3               | Type: Schedule Trigger. Triggers at 4 AM daily.                                            |
| Schedule Trigger4               | Type: Schedule Trigger. Triggers at 1 AM daily (appears duplicated, possibly redundant).    |
| Schedule Trigger5               | Type: Schedule Trigger. Triggers with default interval (likely every minute/hour, no set time). |
| Schedule Trigger6               | Type: Schedule Trigger. Triggers at 5 AM daily.                                            |
| When Executed by Another Workflow | Type: Execute Workflow Trigger. Allows the workflow to be triggered programmatically by other workflows, passing input through. |

- **Connections:** Each trigger node connects to the HTTP Request node to start data acquisition.
- **Edge cases / Failures:**  
  - Overlapping triggers might cause concurrent runs; ensure idempotency.  
  - Manual trigger may pass unexpected inputs; workflow designed to passthrough inputs but expects no input transformations.  
  - Scheduling misconfiguration could cause missed or duplicated runs.

---

#### 1.2 Data Acquisition & Preparation

- **Overview:** Fetches live trending cryptocurrency data from CoinMarketCap and converts it into a format suitable for AI processing.
- **Nodes Involved:**  
  - HTTP Request  
  - Markdown  

- **Node Details:**

| Node Name    | Details                                                                                                  |
|--------------|----------------------------------------------------------------------------------------------------------|
| HTTP Request | Type: HTTP Request. Fetches HTML from https://coinmarketcap.com/trending-cryptocurrencies/. No authentication or headers configured, uses default GET. Output is raw HTML page content in JSON under `data`. Edge cases: Site changes HTML structure may break downstream parsing; request failures/timeouts; rate limiting by CoinMarketCap. |
| Markdown     | Type: Markdown node. Converts the HTML content from HTTP Request (`$json.data`) into Markdown-formatted text. Likely used here to sanitize or simplify the HTML for AI consumption. Edge cases: If input HTML is malformed or empty, output may be invalid or empty, causing AI prompt issues. |

- **Connections:** HTTP Request → Markdown → AI Agent  
- **Expressions:** Markdown node uses the expression `={{ $json.data }}` to pass the HTML content.  
- **Version Note:** HTTP Request node is version 4.2, Markdown node version 1.

---

#### 1.3 AI Analysis & Summarization

- **Overview:** Uses a custom AI Agent node powered by OpenAI GPT-4o-mini to analyze the trending crypto data and compose a single stylized summary message for Discord.
- **Nodes Involved:**  
  - AI Agent  
  - OpenAI Chat Model  

- **Node Details:**

| Node Name       | Details                                                                                                                                            |
|-----------------|----------------------------------------------------------------------------------------------------------------------------------------------------|
| AI Agent        | Type: LangChain AI Agent node. Role: Receives the Markdown-processed data as input text (`$json.data`) and uses a detailed prompt instructing it to analyze up to 3 trending coins. The prompt specifies output format constraints (max 1500 characters, markdown-compatible, emoji usage, inclusion of links to CoinMarketCap and a DEX). Output is a single formatted text message. Edge cases: If input data lacks expected coin info, result may be incomplete or fail prompt constraints. If exceeding character limits, the agent truncates or excludes data as per prompt. |
| OpenAI Chat Model | Type: LangChain OpenAI Chat Model node. Uses the GPT-4o-mini model to power the AI Agent. No special options set besides model choice. Responsible for natural language generation. Edge cases: API authentication failures, rate limits, model unavailability, or prompt parsing errors can cause failures. |

- **Connections:** Markdown → AI Agent → Discord; OpenAI Chat Model is linked as the language model for AI Agent.  
- **Expressions:** AI Agent uses `={{ $json.data }}` as input text and a complex system prompt specifying formatting rules and content requirements.  
- **Version Note:** AI Agent node version 1.8, OpenAI Chat Model node version 1.2.

---

#### 1.4 Output Delivery

- **Overview:** Posts the AI-generated cryptocurrency summary message to a specific Discord server and channel.
- **Nodes Involved:**  
  - Discord  

- **Node Details:**

| Node Name | Details                                                                                                        |
|-----------|----------------------------------------------------------------------------------------------------------------|
| Discord   | Type: Discord node. Sends a message resource to a specific Guild and Channel using a Discord webhook. The content is set dynamically from the AI Agent output (`$json.output`). Guild ID and Channel ID are hardcoded with cached URLs for reference. Credentials: Requires Discord webhook OAuth2 authentication configured in n8n. Edge cases: Invalid webhook or permissions can cause message sending failures; message content exceeding Discord limits would be rejected; network issues may cause timeouts. |

- **Connections:** AI Agent → Discord  
- **Expressions:** Content expression is `={{ $json.output }}` to send the AI-generated message text.  
- **Version Note:** Discord node version 2.

---

### 3. Summary Table

| Node Name                  | Node Type                           | Functional Role                         | Input Node(s)                 | Output Node(s)                | Sticky Note                                                                                                      |
|----------------------------|-----------------------------------|----------------------------------------|------------------------------|------------------------------|-----------------------------------------------------------------------------------------------------------------|
| When Executed by Another Workflow | Execute Workflow Trigger          | Manual or external trigger              |                              | HTTP Request                 |                                                                                                                 |
| Schedule Trigger            | Schedule Trigger                  | Scheduled trigger at 1 AM               |                              | HTTP Request                 | Note 1: The workflow starts with multiple Schedule Trigger nodes, each configured to run at different hours, providing flexibility in scheduling the updates.  |
| Schedule Trigger1           | Schedule Trigger                  | Scheduled trigger at 2 AM               |                              | HTTP Request                 | Note 1: The workflow starts with multiple Schedule Trigger nodes, each configured to run at different hours, providing flexibility in scheduling the updates.  |
| Schedule Trigger2           | Schedule Trigger                  | Scheduled trigger at 3 AM               |                              | HTTP Request                 | Note 1: The workflow starts with multiple Schedule Trigger nodes, each configured to run at different hours, providing flexibility in scheduling the updates.  |
| Schedule Trigger3           | Schedule Trigger                  | Scheduled trigger at 4 AM               |                              | HTTP Request                 | Note 1: The workflow starts with multiple Schedule Trigger nodes, each configured to run at different hours, providing flexibility in scheduling the updates.  |
| Schedule Trigger4           | Schedule Trigger                  | Scheduled trigger at 1 AM (duplicate)  |                              | HTTP Request                 | Note 1: The workflow starts with multiple Schedule Trigger nodes, each configured to run at different hours, providing flexibility in scheduling the updates.  |
| Schedule Trigger5           | Schedule Trigger                  | Scheduled trigger (default interval)   |                              | HTTP Request                 | Note 1: The workflow starts with multiple Schedule Trigger nodes, each configured to run at different hours, providing flexibility in scheduling the updates.  |
| Schedule Trigger6           | Schedule Trigger                  | Scheduled trigger at 5 AM               |                              | HTTP Request                 | Note 1: The workflow starts with multiple Schedule Trigger nodes, each configured to run at different hours, providing flexibility in scheduling the updates.  |
| HTTP Request               | HTTP Request                     | Fetch trending cryptocurrencies page   | All Schedule Triggers, Manual | Markdown                     | Note 2: An HTTP Request node fetches data from CoinMarketCap's trending cryptocurrencies page. This node acts as the data source for the entire workflow.       |
| Markdown                   | Markdown                        | Converts raw HTML to Markdown           | HTTP Request                 | AI Agent                    | Note 2: An HTTP Request node fetches data from CoinMarketCap's trending cryptocurrencies page. This node acts as the data source for the entire workflow.       |
| AI Agent                  | LangChain AI Agent              | Analyze data and generate formatted summary | Markdown                     | Discord                     | Note 3: An AI Agent node processes the raw data from CoinMarketCap. It uses a custom prompt to instruct the OpenAI language model to generate a concise, formatted message with key insights about the top trending cryptocurrencies, including links and emojis. |
| OpenAI Chat Model          | LangChain OpenAI Chat Model    | Provides GPT-4o-mini model for AI Agent |                             | AI Agent (as language model) | Note 4: The OpenAI Chat Model node provides the language model (GPT-4o-mini) for the AI Agent, responsible for generating the insightful cryptocurrency summary. |
| Discord                   | Discord                         | Posts the AI-generated summary to Discord | AI Agent                    |                              | Note 5: Finally, a Discord node sends the AI-generated summary to a designated Discord server and channel. This delivers the neatly formatted cryptocurrency analysis directly to the Discord community. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger nodes** (7 total) for automated runs:  
   - Add seven Schedule Trigger nodes named "Schedule Trigger", "Schedule Trigger1", ..., "Schedule Trigger6".  
   - Configure their "rule" property with "interval" as follows:  
     - Trigger at 1 AM, 2 AM, 3 AM, 4 AM, 5 AM respectively for the first six triggers.  
     - One trigger with default interval (runs frequently or every minute/hour).  
   - Connect each Schedule Trigger node's main output to the HTTP Request node (to be created next).

2. **Create an Execute Workflow Trigger node** named "When Executed by Another Workflow":  
   - Set input source to "passthrough".  
   - Connect its main output also to the HTTP Request node.

3. **Create HTTP Request node** named "HTTP Request":  
   - Set HTTP Method: GET (default).  
   - Set URL: `https://coinmarketcap.com/trending-cryptocurrencies/`.  
   - No authentication or special headers needed.  
   - Connect main input from all Schedule Trigger nodes and manual trigger.  
   - Connect main output to "Markdown" node.

4. **Create Markdown node** named "Markdown":  
   - Parameter "html" set to: `={{ $json.data }}` to take the raw HTML from HTTP Request.  
   - Purpose: convert HTML content to markdown/text for AI processing.  
   - Connect main output to "AI Agent" node.

5. **Create OpenAI Chat Model node** named "OpenAI Chat Model":  
   - Set model to "gpt-4o-mini" from the dropdown.  
   - No additional options needed.  
   - This node will be linked as the language model in the AI Agent.

6. **Create AI Agent node** named "AI Agent":  
   - Input text parameter set to: `={{ $json.data }}` (output from Markdown node).  
   - Set prompt type: "define".  
   - Paste the detailed system message prompt that instructs the agent to analyze up to 3 coins, produce a markdown-formatted summary, include links, emojis, limit to 1500 characters, no code blocks, etc. (Use the prompt content from original workflow).  
   - Link the "OpenAI Chat Model" node as the language model under "ai_languageModel" parameter.  
   - Connect main output to the "Discord" node.

7. **Create Discord node** named "Discord":  
   - Set resource to "message".  
   - Set action to "create/send message".  
   - Set "content" to: `={{ $json.output }}` to send the AI Agent’s generated text.  
   - Set Guild ID and Channel ID to the target Discord server and channel.  
   - Configure credentials with appropriate Discord OAuth2 webhook credentials.  
   - Connect input from AI Agent node.

8. **Test the workflow**:  
   - Run manually or wait for scheduled triggers.  
   - Verify that the Discord channel receives well-formatted messages with trending crypto summaries.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                  | Context or Link                                                                                   |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| This workflow scrapes CoinMarketCap's trending cryptocurrencies page and is dependent on the page structure remaining stable; changes to the webpage may require adjustments in data parsing or prompt adaptations.             | CoinMarketCap Trending Cryptocurrencies URL: https://coinmarketcap.com/trending-cryptocurrencies/ |
| The AI Agent is configured with a detailed system message prompt to ensure output is concise, readable, and suitable for Discord formatting including markdown, emojis, and embedded links.                                   | Prompt is embedded in AI Agent node configuration.                                              |
| Discord node requires valid OAuth2 webhook credentials with permissions to send messages in the target guild and channel.                                                                                                    | https://discord.com/developers/docs/topics/oauth2                                                      |
| Scheduled triggers at multiple distinct hours ensure timely updates; however, overlapping triggers may cause concurrency issues, so consider enabling workflow concurrency controls or locking if needed.                    | See n8n docs on concurrency and execution locking for best practices.                             |
| The workflow includes a manual trigger "When Executed by Another Workflow" to allow integration into larger automation systems.                                                                                            | Useful for chaining workflows or external triggers.                                              |

---

**Disclaimer:**  
The provided content originates exclusively from an n8n automated workflow. It complies strictly with current content policies and contains no illegal, offensive, or protected material. All processed data is legal and publicly available.