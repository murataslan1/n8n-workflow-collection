Automate Daily AI News with Perplexity Sonar Pro (via Telegram)

https://n8nworkflows.xyz/workflows/automate-daily-ai-news-with-perplexity-sonar-pro--via-telegram--5157


# Automate Daily AI News with Perplexity Sonar Pro (via Telegram)

### 1. Workflow Overview

This n8n workflow automates the collection, filtering, formatting, and dissemination of daily AI news summaries using Perplexity Sonar Pro and OpenAI, delivering the final digest through Telegram while maintaining a log of past news in Google Sheets. It is designed for AI enthusiasts, teams, or organizations that want to stay informed about the latest AI developments without manual effort.

The workflow is logically divided into the following blocks:

- **1.1 Scheduled Trigger**: Initiates the workflow daily at a preset time.
- **1.2 AI-Powered News Search**: Uses Perplexity Sonar Pro to search and summarize the latest AI news from credible sources within the last 24 hours.
- **1.3 News Formatting and Deduplication**: Processes Perplexity’s raw news output using OpenAI to remove duplicates, summarize, and format the content for clarity and visual appeal.
- **1.4 Telegram Delivery and Logging**: Sends the formatted news digest to a Telegram channel or group and logs the news items along with timestamps in a Google Sheet to prevent future duplication.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Trigger

- **Overview:**  
  This block triggers the workflow automatically every day at 10 AM, ensuring daily news updates are fetched and processed without manual intervention.

- **Nodes Involved:**  
  - Schedule Trigger  
  - Sticky Note ("Scheduled trigger")

- **Node Details:**

  - **Schedule Trigger**  
    - Type: Schedule Trigger (n8n-nodes-base.scheduleTrigger)  
    - Role: Starts the workflow daily at a specific hour.  
    - Configuration: Trigger configured to fire daily at 10:00 AM.  
    - Inputs: None (trigger node)  
    - Outputs: Connects to "Perplexity Daily Search (Past 24hrs)" node.  
    - Edge Cases: Workflow won’t run if n8n instance is offline at trigger time; time zone considerations might affect trigger time if n8n server time differs from user expectation.  
    - Version: 1.2  

  - **Sticky Note ("Scheduled trigger")**  
    - Role: Visual annotation for organizational clarity.  
    - No functional impact.

---

#### 2.2 AI-Powered News Search

- **Overview:**  
  Queries Perplexity Sonar Pro AI to retrieve and summarize the most recent AI news within the last 24 hours from primary credible sources, including major AI organizations and emerging disruptors.

- **Nodes Involved:**  
  - Perplexity Daily Search (Past 24hrs)  
  - Sticky Note1 ("Search")

- **Node Details:**

  - **Perplexity Daily Search (Past 24hrs)**  
    - Type: Perplexity AI Node (n8n-nodes-base.perplexity)  
    - Role: Calls Perplexity Sonar Pro with a custom prompt to search recent AI news and summarize findings.  
    - Configuration:  
      - Model: sonar-reasoning-pro  
      - Search recency: day (past 24 hours)  
      - Prompt: Detailed system and user messages instructing the AI to find and summarize top AI news, prioritize credible sources, exclude videos and aggregators, and output two to three sentence summaries with full URLs.  
      - Simplify: true (to reduce complexity of output)  
    - Inputs: Triggered by Schedule Trigger node.  
    - Outputs: Passes raw AI news message to Formatter Agent.  
    - Credentials: Perplexity API connection required.  
    - Edge Cases:  
      - Possible API rate limits or authentication failures.  
      - No news found scenario handled explicitly by prompting AI to respond with a fallback message.  
      - Network timeouts or malformed responses.  
    - Version: 1  

  - **Sticky Note1 ("Search")**  
    - Role: Visual annotation for clarity on the news search block.

---

#### 2.3 News Formatting and Deduplication

- **Overview:**  
  Processes the raw AI news output using OpenAI GPT-4 to clean up formatting, remove duplicates by cross-checking with existing logged news in Google Sheets, and produce a polished, reader-friendly digest with clear summaries and highlighted company names.

- **Nodes Involved:**  
  - Formatter Agent  
  - Sticky Note2 ("Format + Crosscheck Recency")  
  - Past News Sheet Log (Google Sheets read node, referenced implicitly)

- **Node Details:**

  - **Formatter Agent**  
    - Type: OpenAI (LangChain) Node (@n8n/n8n-nodes-langchain.openAi)  
    - Role: Refines raw news, removes internal reasoning notes, filters duplicates by consulting the "Past News Log Sheet", summarizes, highlights key names in bold, and formats spacing.  
    - Configuration:  
      - Model: GPT-4O (latest GPT-4 variant)  
      - Messages: System prompt sets the assistant role; user prompt includes raw Perplexity output and instructions for formatting and deduplication with references to current date and Google Sheets data.  
    - Inputs: Receives raw news data from Perplexity node.  
    - Outputs: Sends formatted message to Telegram node.  
    - Credentials: OpenAI API access required.  
    - Edge Cases:  
      - Expression failures if Google Sheets data is inaccessible.  
      - OpenAI API errors or rate limits.  
      - Possible logical errors in duplicate detection due to paraphrasing differences.  
    - Version: 1.8  

  - **Sticky Note2 ("Format + Crosscheck Recency")**  
    - Role: Visual annotation describing the formatting and deduplication step.

---

#### 2.4 Telegram Delivery and Logging

- **Overview:**  
  Sends the final formatted AI news digest to a Telegram channel or group and logs the news along with timestamps and message thread IDs into a Google Sheet to track reported news and avoid future duplicates.

- **Nodes Involved:**  
  - Telegram  
  - Sheet Log (Google Sheets appendOrUpdate)  
  - Sticky Note4 ("Telegram Message & Log")

- **Node Details:**

  - **Telegram**  
    - Type: Telegram Node (n8n-nodes-base.telegram)  
    - Role: Sends formatted news digest message to a configured Telegram chat.  
    - Configuration:  
      - Uses connected Telegram API credentials.  
      - Sends message with content from Formatter Agent node.  
      - Webhook ID configured for message reply handling if applicable.  
    - Inputs: Receives formatted text from Formatter Agent.  
    - Outputs: Feeds message metadata to Sheet Log node.  
    - Credentials: Telegram API OAuth2 or Bot Token required.  
    - Edge Cases:  
      - Telegram API rate limits or message send failures.  
      - Network issues.  
      - Incorrect chat/channel ID or permissions denying message post.  
    - Version: 1.2  

  - **Sheet Log**  
    - Type: Google Sheets (n8n-nodes-base.googleSheets)  
    - Role: Logs each news update with the current date, news content, and Telegram thread timestamp to Google Sheets for record keeping and deduplication.  
    - Configuration:  
      - Operation: appendOrUpdate by "Date" column to avoid duplicate rows per date.  
      - Columns mapped:  
        - Date: from Schedule Trigger node’s readable date  
        - News: formatted message content from Formatter Agent  
        - Thread Ts: Telegram message timestamp for thread tracking  
      - Sheet and document IDs configured to user’s Google Sheets document.  
    - Inputs: Receives Telegram message metadata and formatted news content.  
    - Credentials: Google Sheets OAuth2 account required.  
    - Edge Cases:  
      - Authentication errors or insufficient permissions on the Google Sheet.  
      - Rate limits or API errors.  
      - Race conditions if multiple runs occur simultaneously.  
    - Version: 4.6  

  - **Sticky Note4 ("Telegram Message & Log")**  
    - Role: Visual annotation summarizing the delivery and logging functionality.

---

#### 2.5 General Workflow Annotation

- **Sticky Note5** (Large overview note)  
  - Content:  
    - Describes the workflow as a turnkey solution for automated daily AI news digest via Telegram.  
    - Highlights the tech stack: Perplexity AI, OpenAI, Google Sheets, Telegram API.  
    - Notes setup requirements such as credential connections and replacing Google Sheet and Telegram settings.  
    - Provides a link to a YouTube channel for more builds and tutorials:  
      https://www.youtube.com/@Automatewithmarc  
  - Position: Top-left, spanning multiple nodes for contextual overview.

---

### 3. Summary Table

| Node Name                          | Node Type                              | Functional Role                                | Input Node(s)                     | Output Node(s)                 | Sticky Note                                                                                         |
|-----------------------------------|--------------------------------------|-----------------------------------------------|----------------------------------|-------------------------------|---------------------------------------------------------------------------------------------------|
| Schedule Trigger                  | Schedule Trigger                     | Initiates workflow daily at 10 AM             | None                             | Perplexity Daily Search (Past 24hrs) | Scheduled trigger                                                                                  |
| Perplexity Daily Search (Past 24hrs) | Perplexity AI Node                  | Queries Perplexity Sonar Pro for recent AI news | Schedule Trigger                 | Formatter Agent                | Search                                                                                            |
| Formatter Agent                  | OpenAI GPT Node                      | Formats, deduplicates, and summarizes news    | Perplexity Daily Search (Past 24hrs) | Telegram                      | Format + Crosscheck Recency                                                                       |
| Telegram                        | Telegram Node                       | Sends formatted news digest to Telegram       | Formatter Agent                  | Sheet Log                     | Telegram Message & Log                                                                            |
| Sheet Log                      | Google Sheets Append/Update          | Logs news and timestamps to Google Sheet      | Telegram                        | None                          | Telegram Message & Log                                                                            |
| Sticky Note                   | Sticky Note                         | Visual annotation for Scheduled Trigger       | None                             | None                          | Scheduled trigger                                                                                  |
| Sticky Note1                  | Sticky Note                         | Visual annotation for Search block             | None                             | None                          | Search                                                                                            |
| Sticky Note2                  | Sticky Note                         | Visual annotation for Format + Deduplication  | None                             | None                          | Format + Crosscheck Recency                                                                       |
| Sticky Note4                  | Sticky Note                         | Visual annotation for Telegram and Logging    | None                             | None                          | Telegram Message & Log                                                                            |
| Sticky Note5                  | Sticky Note                         | Workflow overview and setup notes              | None                             | None                          | 🧠 Perplexity-Powered Daily AI News Digest (via Telegram) with setup instructions and credits.   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow in n8n and name it “Perplexity Powered AI News Search”.**

2. **Add a `Schedule Trigger` node:**  
   - Set to trigger daily at 10:00 AM (adjust timezone if needed).  
   - No inputs; this node starts the workflow.

3. **Add a `Perplexity` node:**  
   - Connect the `Schedule Trigger` node’s output to this node’s input.  
   - Set model to `sonar-reasoning-pro`.  
   - Under options, set `searchRecency` to `day` (past 24 hours).  
   - Configure messages:  
     - System message: (custom prompt or an empty string if none used)  
     - User message: Provide detailed instructions to find and summarize AI news on recent model releases, breakthroughs, and announcements from major AI organizations, excluding videos and aggregators. Request 2–3 sentence summaries with full URLs. Include fallback message if no news found.  
   - Enter your Perplexity API credentials.

4. **Add an OpenAI node (`@n8n/n8n-nodes-langchain.openAi`):**  
   - Connect output of Perplexity node here.  
   - Select model `gpt-4o` (or equivalent GPT-4 model).  
   - Configure messages:  
     - System message: “You’re a helpful formatter Agent.”  
     - User message: Includes the Perplexity output, instructions to remove thinking notes (`</think>` tags), cross-check past news from Google Sheets to remove duplicates, ensure 1–2 sentence summaries with full URLs, bold company names, and add spacing for readability. Start with a greeting including current date.  
   - Link OpenAI API credentials.

5. **Add a `Telegram` node:**  
   - Connect from OpenAI node output.  
   - Configure with your Telegram Bot API credentials.  
   - Set target chat/channel ID to your desired Telegram group or channel.  
   - Configure message content to use the formatted text from OpenAI node.

6. **Add a `Google Sheets` node for logging (appendOrUpdate):**  
   - Connect from Telegram node output.  
   - Configure with Google Sheets OAuth2 credentials.  
   - Set operation to `appendOrUpdate` targeting a sheet with columns:  
     - `Date` (use Schedule Trigger’s readable date)  
     - `News` (use formatted message content from Formatter Agent)  
     - `Thread Ts` (use Telegram message timestamp)  
   - Enter Google Sheet document ID and sheet name.

7. **Add Sticky Notes for clarity:**  
   - Place notes near: Schedule Trigger (“Scheduled trigger”), Perplexity node (“Search”), Formatter Agent (“Format + Crosscheck Recency”), Telegram and Sheet Log nodes (“Telegram Message & Log”), and a large overview note describing the workflow’s purpose, stack, and setup instructions.

8. **Configure credentials:**  
   - Ensure valid API credentials are connected for Perplexity, OpenAI, Google Sheets, and Telegram.  
   - Test each connection individually for authentication.

9. **Activate the workflow.**

---

### 5. General Notes & Resources

| Note Content                                                                                                                     | Context or Link                                               |
|---------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------|
| This workflow automates daily AI news curation and delivery leveraging Perplexity AI, OpenAI, Google Sheets, and Telegram API. | Project overview and tech stack.                              |
| Replace Google Sheet ID and Telegram chat/channel settings with your own.                                                       | Setup instructions.                                           |
| For step-by-step builds and more automation workflows, visit:                                                                  | https://www.youtube.com/@Automatewithmarc                     |
| The workflow ensures no duplicate news delivery by cross-referencing a Google Sheets log and uses AI to summarize and format.  | Functional description and key features.                      |
| Handles edge cases such as no news found, API failures, and duplicate filtering.                                                | Reliability considerations.                                   |

---

**Disclaimer:** The provided content is derived exclusively from an automated n8n workflow designed in compliance with applicable content policies. It contains no illegal, offensive, or protected material. All processed data is legal and publicly accessible.