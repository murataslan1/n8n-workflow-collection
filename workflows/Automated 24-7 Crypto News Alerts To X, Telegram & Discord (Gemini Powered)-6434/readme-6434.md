Automated 24/7 Crypto News Alerts To X, Telegram & Discord (Gemini Powered)

https://n8nworkflows.xyz/workflows/automated-24-7-crypto-news-alerts-to-x--telegram---discord--gemini-powered--6434


# Automated 24/7 Crypto News Alerts To X, Telegram & Discord (Gemini Powered)

### 1. Workflow Overview

This workflow automates the collection, processing, and dissemination of cryptocurrency news from multiple RSS feeds to various social and messaging platforms including Twitter, Telegram, Discord, and X (formerly Twitter). It runs continuously 24/7 to ensure timely alerts on crypto news, utilizing Google’s Gemini AI model via LangChain to enhance or summarize the news content before broadcasting.

Logical Blocks:

- **1.1 Input Reception (RSS Feed Triggers):** Multiple RSS feed triggers fetch news articles from a variety of crypto news sources.
- **1.2 Date Filtering:** A filter node to allow processing only on relevant or new news items, potentially filtering by publication date or freshness.
- **1.3 AI Processing:** The Google Gemini Chat Model node linked to an AI Agent node processes news content, likely summarizing or generating alert text.
- **1.4 Message Formatting:** A Set node ("Edit Fields1") adjusts or prepares the output data for posting.
- **1.5 Distribution:** Nodes for posting messages to Telegram, Discord, and Twitter/X platforms.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception (RSS Feed Triggers)

**Overview:**  
This block continuously listens for new news items from multiple cryptocurrency news RSS feeds. It collects raw data to be processed downstream.

**Nodes Involved:**  
- RSS Blockchain  
- RSS Bitcoinist  
- RSS News BTC  
- RSS Cointelegraph  
- RSS News - Messari  
- RSS News Glassnode  
- RSS Feed FX Crypto  
- RSS News Platinum Crypto Academy  
- RSS News Bitcoin  
- RSS News Utoday  
- RSS News Decrypt Feed  

**Node Details:**  

- **Type:** RSS Feed Read Trigger  
- **Role:** Automatically triggers the workflow when new RSS feed items appear.  
- **Configuration:** Each node is configured with a specific RSS feed URL (not shown in JSON), set as triggers to watch for new entries.  
- **Input/Output:** No input; output is the RSS feed items.  
- **Edge Cases:**  
  - Feed downtime or unavailability causing missed triggers.  
  - RSS feed format changes breaking parsing.  
  - Rate limiting by RSS servers.  
- **Version:** v1 for all nodes.  
- **Sticky Notes:** Some sticky notes are positioned nearby but their content is empty, implying placeholders or reminders.

#### 2.2 Date Filtering

**Overview:**  
Filters incoming RSS items to process only those matching certain criteria, likely filtering for recent or relevant news items.

**Nodes Involved:**  
- Date Filter

**Node Details:**  

- **Type:** Filter  
- **Role:** Controls flow based on date conditions or other criteria on the incoming news items.  
- **Configuration:** Not explicitly detailed, but likely filters based on publication date or age to avoid retransmitting old news.  
- **Input:** All RSS feed triggers connect here.  
- **Output:** Passes filtered news to AI processing block.  
- **Edge Cases:**  
  - Incorrect date parsing could block valid news or allow duplicates.  
  - Timezone issues affecting date comparison.  
- **Version:** v2.2

#### 2.3 AI Processing

**Overview:**  
Uses Google Gemini Chat Model integrated via LangChain as the language model backend to process or summarize the news content. The AI Agent node likely coordinates the flow of data and applies AI logic.

**Nodes Involved:**  
- Google Gemini Chat Model  
- AI Agent

**Node Details:**  

- **Google Gemini Chat Model:**  
  - Type: LangChain LM Chat Google Gemini  
  - Role: Provides language model API calls to Google Gemini for conversational AI-based processing.  
  - Configuration: Default parameters, linked as the AI language model for the AI Agent.  
  - Input: Connected as `ai_languageModel` input to AI Agent.  
  - Edge Cases:  
    - Authentication or API quota failures.  
    - Latency or timeout from Google Gemini API.  
    - Unexpected AI output formats causing downstream issues.  
  - Version: v1

- **AI Agent:**  
  - Type: LangChain Agent (AI Agent node)  
  - Role: Orchestrates calls to the language model, handling prompt construction and result parsing.  
  - Configuration: Default parameters with retry on failure enabled (improves reliability).  
  - Input: Receives filtered news items from Date Filter node.  
  - Output: Passes processed text to message formatting.  
  - Edge Cases:  
    - Failures in AI Agent logic or expression errors.  
    - Retry attempts exhausted leading to dropped news items.  
  - Version: v1.9

#### 2.4 Message Formatting

**Overview:**  
Prepares the AI-processed news text for distribution by setting or editing fields to comply with target platforms’ requirements.

**Nodes Involved:**  
- Edit Fields1

**Node Details:**  

- **Type:** Set Node  
- **Role:** Sets or modifies data fields such as message text, titles, or metadata before sending.  
- **Configuration:** Not detailed, but typically involves mapping AI output to platform-specific message formats.  
- **Input:** From AI Agent.  
- **Output:** To Discord message node.  
- **Edge Cases:**  
  - Missing or malformed data fields causing message send failures.  
  - Expression errors if fields reference non-existent data.  
- **Version:** v3.4

#### 2.5 Distribution

**Overview:**  
Sends formatted news alerts to multiple platforms to reach the audience via Telegram, Discord, and Twitter/X.

**Nodes Involved:**  
- Send a text message (Telegram)  
- Discord - Send Message Node  
- Create Tweet (Twitter/X)

**Node Details:**  

- **Send a text message:**  
  - Type: Telegram node  
  - Role: Sends text messages to a Telegram chat or channel.  
  - Configuration: Uses a webhook ID to receive/send messages, credentials for Telegram API configured externally.  
  - Input: From AI Agent node output.  
  - Output: None (terminal).  
  - Edge Cases:  
    - Telegram API rate limits or auth failures.  
    - Message length limits.  
  - Version: v1.2

- **Discord - Send Message Node:**  
  - Type: Discord node  
  - Role: Posts messages to a Discord channel or webhook.  
  - Configuration: Uses webhook ID for authentication.  
  - Input: From Edit Fields1 (message formatting).  
  - Output: None (terminal).  
  - Edge Cases:  
    - Discord API failures or rate limits.  
    - Invalid webhook configuration.  
  - Version: v2

- **Create Tweet:**  
  - Type: Twitter node  
  - Role: Posts tweets on Twitter/X.  
  - Configuration: Uses OAuth2 credentials set up externally.  
  - Input: From AI Agent output.  
  - Output: None (terminal).  
  - Edge Cases:  
    - Twitter API limits or authentication errors.  
    - Tweet length restrictions.  
  - Version: v2

---

### 3. Summary Table

| Node Name                  | Node Type                      | Functional Role                      | Input Node(s)            | Output Node(s)            | Sticky Note                      |
|----------------------------|--------------------------------|------------------------------------|--------------------------|---------------------------|---------------------------------|
| RSS Blockchain             | RSS Feed Read Trigger          | Fetch crypto news from Blockchain feed | None                     | Date Filter               |                                 |
| RSS Bitcoinist             | RSS Feed Read Trigger          | Fetch news from Bitcoinist feed      | None                     | Date Filter               |                                 |
| RSS News BTC               | RSS Feed Read Trigger          | Fetch news from News BTC feed        | None                     | Date Filter               |                                 |
| RSS Cointelegraph          | RSS Feed Read Trigger          | Fetch news from Cointelegraph feed   | None                     | Date Filter               |                                 |
| RSS News - Messari         | RSS Feed Read Trigger          | Fetch news from Messari feed         | None                     | Date Filter               |                                 |
| RSS News Glassnode         | RSS Feed Read Trigger          | Fetch news from Glassnode feed       | None                     | Date Filter               |                                 |
| RSS Feed FX Crypto         | RSS Feed Read Trigger          | Fetch news from FX Crypto feed       | None                     | Date Filter               |                                 |
| RSS News Platinum Crypto Academy | RSS Feed Read Trigger    | Fetch news from Platinum Crypto Academy feed | None             | Date Filter               |                                 |
| RSS News Bitcoin           | RSS Feed Read Trigger          | Fetch news from Bitcoin news feed    | None                     | Date Filter               |                                 |
| RSS News Utoday            | RSS Feed Read Trigger          | Fetch news from Utoday feed          | None                     | Date Filter               |                                 |
| RSS News Decrypt Feed      | RSS Feed Read Trigger          | Fetch news from Decrypt feed         | None                     | Date Filter               |                                 |
| Date Filter               | Filter                        | Filter news items by date or freshness | All RSS Feed triggers    | AI Agent                  |                                 |
| Google Gemini Chat Model   | LangChain LM Chat Google Gemini | Provides Google Gemini AI model for processing | AI Agent (ai_languageModel) | AI Agent                 |                                 |
| AI Agent                  | LangChain Agent                | Orchestrates AI processing of news   | Date Filter              | Edit Fields1, Send a text message, Create Tweet |                         |
| Edit Fields1              | Set                           | Prepare message fields for Discord   | AI Agent                 | Discord - Send Message Node |                                 |
| Send a text message        | Telegram                      | Send messages to Telegram             | AI Agent                 | None                      |                                 |
| Discord - Send Message Node | Discord                      | Send messages to Discord              | Edit Fields1             | None                      |                                 |
| Create Tweet              | Twitter                       | Post tweets on Twitter/X              | AI Agent                 | None                      |                                 |
| Sticky Notes (various)    | Sticky Note                   | Comments / placeholders               | N/A                      | N/A                       | Empty content in all sticky notes |

---

### 4. Reproducing the Workflow from Scratch

1. **Create RSS Feed Triggers (11 nodes):**  
   - For each crypto news source, create an "RSS Feed Read Trigger" node.  
   - Configure each with the respective RSS feed URL (e.g., Blockchain, Bitcoinist, News BTC, Cointelegraph, Messari, Glassnode, FX Crypto, Platinum Crypto Academy, Bitcoin, Utoday, Decrypt).  
   - Set them to trigger on new feed items.

2. **Add a Filter Node ("Date Filter"):**  
   - Add a "Filter" node after all RSS triggers.  
   - Connect all RSS Feed triggers to this Filter node.  
   - Configure filter rules to allow only recent news (e.g., publication date within last 24 hours or since last run).  
   - Adjust timezone and date parsing as necessary.

3. **Add Google Gemini Chat Model Node:**  
   - Add "@n8n/n8n-nodes-langchain.lmChatGoogleGemini" node.  
   - Configure with Google Gemini credentials (API key, OAuth2 as per LangChain instructions).  
   - Default settings are acceptable unless custom prompt is required.

4. **Add AI Agent Node:**  
   - Add "@n8n/n8n-nodes-langchain.agent" node.  
   - Enable "Retry on Fail" option for robustness.  
   - Connect "Date Filter" node output to AI Agent’s main input.  
   - Connect Google Gemini Chat Model node output to the AI Agent’s `ai_languageModel` input.

5. **Add Set Node ("Edit Fields1"):**  
   - Add a "Set" node after the AI Agent node.  
   - Configure to map or edit fields from AI output into the format required by Discord.  
   - Example: Set a field called `content` or `message` with AI-generated text.

6. **Add Distribution Nodes:**  
   - **Telegram:** Add a "Telegram" node (Send a Text Message).  
     - Configure Telegram credentials (bot token, chat ID).  
     - Connect AI Agent output to Telegram node input.  
   - **Discord:** Add a "Discord" node (Send Message).  
     - Configure Discord webhook URL or OAuth2 credentials.  
     - Connect "Edit Fields1" output to Discord node input.  
   - **Twitter/X:** Add a "Twitter" node (Create Tweet).  
     - Configure OAuth2 credentials for Twitter.  
     - Connect AI Agent output to Twitter node input.

7. **Connect Nodes:**  
   - Connect all RSS triggers to the Date Filter node.  
   - Connect Date Filter output to AI Agent.  
   - Connect Google Gemini Chat Model node to AI Agent’s language model input.  
   - Connect AI Agent to Edit Fields1 and directly to Telegram and Twitter nodes.  
   - Connect Edit Fields1 to Discord node.

8. **Test the workflow:**  
   - Trigger RSS feeds manually or wait for new items.  
   - Check AI processing output for correctness.  
   - Verify messages are posted on Telegram, Discord, and Twitter/X.  
   - Adjust date filter or AI prompts as needed.

---

### 5. General Notes & Resources

| Note Content                                                                                         | Context or Link                                             |
|----------------------------------------------------------------------------------------------------|-------------------------------------------------------------|
| Workflow is designed for continuous 24/7 operation to provide timely crypto news alerts.           | Workflow purpose                                            |
| Uses Google Gemini via LangChain integration for AI-enhanced content processing.                    | Google Gemini Chat Model node                                |
| Retry on fail enabled in AI Agent for increased reliability against API or network failures.       | AI Agent node configuration                                 |
| Telegram, Discord, and Twitter/X credentials must be configured in n8n credentials section to send messages. | Credential setup requirement                                |
| No sticky note content provided; consider adding comments for maintainability and clarity.         | Sticky notes in workflow have empty content                 |

---

**Disclaimer:**  
The provided text and workflow originate exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly respects current content policies and contains no illegal, offensive, or protected elements. All handled data is legal and public.