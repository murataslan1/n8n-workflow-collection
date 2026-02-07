Article to LinkedIn Post Generator with Telegram, GPT-4 & Google Sheets

https://n8nworkflows.xyz/workflows/article-to-linkedin-post-generator-with-telegram--gpt-4---google-sheets-11279


# Article to LinkedIn Post Generator with Telegram, GPT-4 & Google Sheets

---

### 1. Workflow Overview

This n8n workflow automates the generation of LinkedIn posts from articles shared via Telegram, leveraging GPT-4 AI models and Google Sheets for storage. It is designed for users who want to curate, summarize, and repurpose relevant articles focused on AI automation, workflows, technology, and operations into concise, engaging LinkedIn content without manual drafting.

The workflow logically divides into three primary blocks:

- **1.1 Input Reception & Article Analysis:** Receives article links or text from Telegram, then uses AI to analyze and summarize the content, extracting key fields.
- **1.2 Data Storage & Messaging:** Saves the analyzed data into Google Sheets as a content library and sends back the summary to the user via Telegram.
- **1.3 LinkedIn Post Generation on Demand:** On user request ("generate" command), generates a polished LinkedIn post based on stored article insights and delivers it via Telegram.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Article Analysis

- **Overview:**  
This block listens for incoming Telegram messages. It determines if the message contains an article URL or a command. If an article link is detected, it triggers AI-powered content analysis to extract title, link, summary, and insightful commentary.

- **Nodes Involved:**  
  - Telegram Trigger  
  - article or generate? (IF node)  
  - Set Field  
  - Content collector (LangChain Agent)  
  - Edit Fields (Set Node)  
  - OpenAI Chat Model  

- **Node Details:**  

  - **Telegram Trigger**  
    - *Type:* Telegram webhook trigger node  
    - *Role:* Entry point, listens for incoming Telegram messages  
    - *Config:* Watches for message updates; uses Telegram API credentials for bot authentication  
    - *Inputs:* None (webhook)  
    - *Outputs:* Message JSON containing chat and text  
    - *Failures:* Telegram API auth failure, webhook misconfiguration  
    - *Sticky Notes:* See Sticky Note3 for setup details  
  
  - **article or generate?**  
    - *Type:* IF node  
    - *Role:* Determines if incoming message contains an article URL or the "generate" command  
    - *Config:* Checks if message text contains "https://" (article) or "generate" keyword from the authorized user  
    - *Inputs:* Telegram Trigger output  
    - *Outputs:* Routes to either Set Field (article) or If generate (command)  
    - *Failures:* Expression evaluation errors if message text missing  
    - *Version:* Uses version 2.2 for enhanced condition support  
  
  - **Set Field**  
    - *Type:* Set node  
    - *Role:* Extracts and sets the chatInput field with incoming message text (article URL or text) for downstream processing  
    - *Config:* Assigns `chatInput` from Telegram message text  
    - *Inputs:* article or generate? (article branch)  
    - *Outputs:* Passes to Content collector  
    - *Failures:* None expected  
  
  - **Content collector**  
    - *Type:* LangChain Agent node (AI agent)  
    - *Role:* Reads article content or input text, summarizes, extracts Title, Link, Summary, and Insight & Commentary fields, using a system prompt tailored for AI automation and workflow insight  
    - *Config:* Receives `chatInput`, uses GPT-4.1-mini model (OpenAI Chat Model node is invoked internally), with a detailed system message defining role, tone, input handling, and response guidelines  
    - *Inputs:* Set Field output  
    - *Outputs:* JSON containing analyzed fields in a full text output  
    - *Failures:* API timeouts, access issues (article inaccessible), or content parsing errors  
    - *Linked Sub-workflow:* Uses OpenAI Chat Model internally for AI processing  
  
  - **Edit Fields**  
    - *Type:* Set node  
    - *Role:* Parses AI output using regex and string methods to extract and assign specific fields: Title, Link, Summary, Insight & Commentary  
    - *Config:* Uses expressions like regex match on AI output to isolate fields, calling helper methods (e.g., `extractUrl()`), trimming content  
    - *Inputs:* Content collector output  
    - *Outputs:* Cleaned structured JSON fields  
    - *Failures:* Regex mismatch if AI output format changes or incomplete data  
  
  - **OpenAI Chat Model**  
    - *Type:* LangChain OpenAI Chat node  
    - *Role:* Provides the language model backend for Content collector node (hidden linkage)  
    - *Config:* Uses GPT-4.1-mini model, connected to OpenAI API credentials  
    - *Inputs/Outputs:* AI prompt and response with article analysis  
    - *Failures:* API quota exceeded, auth failure  

---

#### 2.2 Data Storage & Messaging

- **Overview:**  
Stores the structured article data into a Google Sheets spreadsheet for content management and sends a summary message back to the user via Telegram.

- **Nodes Involved:**  
  - Clean Code (Code node)  
  - Append row in sheet (Google Sheets node)  
  - Send a text message (Telegram node)  
  - Sticky Note1 (documentation)  

- **Node Details:**  

  - **Clean Code**  
    - *Type:* Code node (JavaScript)  
    - *Role:* Consolidates incoming data from prior node to a clean array of JSON objects for appending to the sheet  
    - *Config:* Maps input items to JSON objects for uniformity  
    - *Inputs:* Edit Fields output  
    - *Outputs:* JSON array for Google Sheets append  
    - *Failures:* Code errors if input data malformed  
  
  - **Append row in sheet**  
    - *Type:* Google Sheets node  
    - *Role:* Appends a new row with article data (Date, Title, Link, Summary, Insight & Commentary) to a specific sheet document  
    - *Config:* Uses OAuth2 credentials for Google Sheets; document ID and sheet name configured as list mode (dynamic or preset)  
    - *Inputs:* Clean Code output  
    - *Outputs:* Confirmation of append  
    - *Failures:* Auth failure, quota limits, incorrect document/sheet IDs, network errors  
  
  - **Send a text message**  
    - *Type:* Telegram node  
    - *Role:* Sends back the article summary text to the Telegram chat that initiated the request  
    - *Config:* Text set to the Summary field from Edit Fields; uses chat ID from Telegram Trigger; disables attribution text  
    - *Inputs:* Append row in sheet output  
    - *Outputs:* Message sent confirmation  
    - *Failures:* Telegram API issues, invalid chat ID  

---

#### 2.3 LinkedIn Post Generation on Demand

- **Overview:**  
Triggered when user sends the "generate" command in Telegram. The workflow queries Google Sheets for stored articles, uses AI to create a concise, engaging LinkedIn post in the user’s voice, and sends it back via Telegram.

- **Nodes Involved:**  
  - If generate (IF node)  
  - Get row(s) in sheet in Google Sheets (Google Sheets Tool node)  
  - Generate LinkedIn Post (LangChain Agent)  
  - The post (Telegram node)  
  - OpenAI Chat Model1 (OpenAI Chat Model)  
  - Sticky Note2 (documentation)  

- **Node Details:**  

  - **If generate**  
    - *Type:* IF node  
    - *Role:* Checks if incoming message contains "generate" command from authorized user  
    - *Config:* Conditions check chat ID and presence of keyword "generate"  
    - *Inputs:* article or generate? node's "generate" branch  
    - *Outputs:* Triggers LinkedIn post generation or ends flow  
    - *Failures:* Expression errors if message malformed  
  
  - **Get row(s) in sheet in Google Sheets**  
    - *Type:* Google Sheets Tool node  
    - *Role:* Retrieves recent or unused article rows from Google Sheets to provide source content for LinkedIn post generation  
    - *Config:* Uses OAuth2 credentials; document and sheet IDs dynamically set (list mode)  
    - *Inputs:* If generate output  
    - *Outputs:* Data rows with article summaries and insights  
    - *Failures:* Sheet access errors, empty data sets  
  
  - **Generate LinkedIn Post**  
    - *Type:* LangChain Agent node  
    - *Role:* Uses AI to craft a viral LinkedIn post based on retrieved insights. The system prompt defines voice, style, content scope, and response constraints to match user style and content guidelines  
    - *Config:* GPT-4.1-mini model via OpenAI Chat Model1; includes instructions to scan Airtable (in this case Google Sheets) for unused entries, generate three posts weekly, and avoid duplicates or politics  
    - *Inputs:* Google Sheets rows from previous node; OpenAI Chat Model1 for AI calls  
    - *Outputs:* Formatted LinkedIn post text  
    - *Failures:* API limits, no new entries available, prompt parsing errors  
  
  - **The post**  
    - *Type:* Telegram node  
    - *Role:* Sends the generated LinkedIn post back to the Telegram user chat  
    - *Config:* Text set from Generate LinkedIn Post output; uses chat ID from Telegram Trigger; disables attribution  
    - *Inputs:* Generate LinkedIn Post output  
    - *Outputs:* Message sent confirmation  
    - *Failures:* Telegram API or chat ID errors  
  
  - **OpenAI Chat Model1**  
    - *Type:* LangChain OpenAI Chat node  
    - *Role:* Provides language model backend for LinkedIn post generation AI node  
    - *Config:* GPT-4.1-mini model with OpenAI API credentials  
    - *Inputs/Outputs:* AI prompt and response for post generation  
    - *Failures:* API auth or quota errors  

---

### 3. Summary Table

| Node Name                 | Node Type                        | Functional Role                                 | Input Node(s)               | Output Node(s)               | Sticky Note                                                                                              |
|---------------------------|---------------------------------|------------------------------------------------|-----------------------------|-----------------------------|--------------------------------------------------------------------------------------------------------|
| Telegram Trigger           | Telegram Trigger                | Entry point, receives Telegram messages         | None                        | article or generate?         | Setup instructions for Telegram bot and workflow overview (Sticky Note3)                              |
| article or generate?       | IF                             | Routes between article input or generate command| Telegram Trigger            | Set Field / If generate      |                                                                                                        |
| Set Field                 | Set                             | Extracts chatInput field from Telegram message  | article or generate?         | Content collector           |                                                                                                        |
| Content collector          | LangChain Agent                 | AI analysis and summarization of article         | Set Field                   | Edit Fields                 |                                                                                                        |
| OpenAI Chat Model          | LangChain OpenAI Chat           | Backend AI model for Content collector          | Content collector (internal) | Content collector           |                                                                                                        |
| Edit Fields               | Set                             | Extracts structured fields using regex           | Content collector           | Clean Code                  |                                                                                                        |
| Clean Code                | Code                            | Cleans and formats data for Google Sheets append| Edit Fields                 | Append row in sheet         |                                                                                                        |
| Append row in sheet        | Google Sheets                   | Appends article data row to Google Sheets       | Clean Code                  | Send a text message         | Requires Google Sheets OAuth2 credentials and proper sheet structure (Sticky Note3)                    |
| Send a text message        | Telegram                        | Sends article summary back to user               | Append row in sheet         | None                       |                                                                                                        |
| If generate                | IF                             | Detects "generate" command from user             | article or generate?         | Generate LinkedIn Post      |                                                                                                        |
| Get row(s) in sheet in Google Sheets | Google Sheets Tool             | Retrieves recent/unused article entries          | If generate                 | Generate LinkedIn Post      |                                                                                                        |
| Generate LinkedIn Post     | LangChain Agent                 | AI generates LinkedIn post from article data      | Get row(s) in sheet         | The post                   | Custom prompt instructions and user style guidelines (Sticky Note2)                                   |
| OpenAI Chat Model1         | LangChain OpenAI Chat           | Backend AI model for LinkedIn post generation     | Generate LinkedIn Post (internal) | Generate LinkedIn Post      |                                                                                                        |
| The post                  | Telegram                        | Sends generated LinkedIn post back to user        | Generate LinkedIn Post      | None                       |                                                                                                        |
| Sticky Note                | Sticky Note                    | Documentation and guide notes                      | None                        | None                       | Step 1: Collect and Analyze Links (Sticky Note)                                                       |
| Sticky Note1               | Sticky Note                    | Documentation guide for storage and messaging     | None                        | None                       | Step 2: Store data and send a summary message                                                         |
| Sticky Note2               | Sticky Note                    | Documentation for LinkedIn post generation         | None                        | None                       | Step 3: LinkedIn post generator on demand                                                             |
| Sticky Note3               | Sticky Note                    | Workflow overview, instructions, and requirements | None                        | None                       | Comprehensive workflow explanation and setup requirements                                            |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger Node**  
   - Node Type: Telegram Trigger  
   - Configure with your Telegram Bot token (from @BotFather)  
   - Set to listen for "message" updates  
   - Position: Entry node  

2. **Add IF Node: article or generate?**  
   - Node Type: IF  
   - Condition 1: Check if message text contains "https://" (indicates article)  
   - Condition 2: Check if message text contains "generate" (command)  
   - Use AND combinator with user chat ID verification for security  
   - Connect Telegram Trigger main output to this node  

3. **Add Set Node: Set Field**  
   - Node Type: Set  
   - Create a new string field named `chatInput`  
   - Set value to incoming Telegram message text  
   - Connect IF node's "article" output to this node  

4. **Add LangChain Agent Node: Content collector**  
   - Node Type: LangChain Agent  
   - Configure prompt with detailed system message defining:  
     - Role as AI research and insight assistant  
     - Input handling for URL or text  
     - Output fields: Title, Link, Summary, Insight & Commentary  
     - Tone: formal, direct, witty  
     - Limitations and response guidelines  
   - Set prompt text to: `Read the article {{ $json.chatInput }} and do as required by your role`  
   - Connect Set Field node output here  

5. **Add OpenAI Chat Model Node**  
   - Node Type: LangChain OpenAI Chat  
   - Select GPT-4.1-mini or equivalent model  
   - Connect to Content collector’s AI language model input  
   - Configure OpenAI API credentials  

6. **Add Set Node: Edit Fields**  
   - Node Type: Set  
   - Use regex expressions on AI output field to extract:  
     - Title (regex for "Title: ...")  
     - Link (use `extractUrl()` helper)  
     - Summary (regex for "Summary: ... Insight & Commentary:")  
     - Insight & Commentary (regex for "Insight & Commentary: ...")  
   - Connect Content collector output here  

7. **Add Code Node: Clean Code**  
   - Node Type: Code (JavaScript)  
   - Map all input JSON items to a clean array for Google Sheets append  
   - Code snippet example:  
     ```javascript
     const fields = $input.all().map(item => item.json);
     return fields;
     ```  
   - Connect Edit Fields output here  

8. **Add Google Sheets Node: Append row in sheet**  
   - Node Type: Google Sheets  
   - Operation: Append  
   - Set Document ID and Sheet Name (ensure sheet has columns for Date, Title, Link, Summary, Insight & Commentary)  
   - Connect Clean Code output here  
   - Configure Google OAuth2 credentials  

9. **Add Telegram Node: Send a text message**  
   - Node Type: Telegram  
   - Text: Use the Summary field from Edit Fields, e.g., `={{ $('Edit Fields').item.json.Summary }}`  
   - Chat ID: Use from Telegram Trigger message chat id  
   - Connect Append row in sheet output here  

10. **Add IF Node: If generate**  
    - Node Type: IF  
    - Check if message text contains "generate" and from authorized user  
    - Connect article or generate? node "generate" output here  

11. **Add Google Sheets Tool Node: Get row(s) in sheet**  
    - Node Type: Google Sheets Tool  
    - Operation: Read rows from the same document and sheet as append node  
    - Configure to retrieve recent or unused rows (logic can be adjusted as needed)  
    - Connect If generate output here  

12. **Add LangChain Agent Node: Generate LinkedIn Post**  
    - Node Type: LangChain Agent  
    - Configure prompt to:  
      - Role as LinkedIn content assistant  
      - Instructions to generate three posts weekly in user’s voice (formal, direct, witty)  
      - Input: recent unused article summaries and insights  
      - Constraints to avoid politics, personal anecdotes, and duplicate content  
    - Connect Google Sheets Tool output here  

13. **Add OpenAI Chat Model Node: OpenAI Chat Model1**  
    - Node Type: LangChain OpenAI Chat  
    - GPT-4.1-mini model  
    - Connect to Generate LinkedIn Post AI language model input  
    - Configure OpenAI API credentials  

14. **Add Telegram Node: The post**  
    - Node Type: Telegram  
    - Text: Use output from Generate LinkedIn Post  
    - Chat ID: From Telegram Trigger  
    - Connect Generate LinkedIn Post output here  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                      | Context or Link                                      |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------|
| Telegram Bot setup requires creating a bot via @BotFather and adding the token to Telegram Trigger credentials. Ensure the bot permissions allow receiving messages.                                                             | Telegram bot setup instructions (Sticky Note3)      |
| Google Sheets must have columns for Date, Title, Link, Summary, and Insight & Commentary to store article data properly. OAuth2 credentials are required with access to the spreadsheet.                                           | Google Sheets setup (Sticky Note3)                   |
| OpenAI GPT-4.1-mini model is used for both article analysis and LinkedIn post generation, ensuring consistent tone and style across outputs. API keys must be configured and have quota.                                          | OpenAI API usage                                      |
| The LinkedIn post generation prompt enforces strict content guidelines to avoid politics, personal anecdotes, and duplicate posts, focusing on AI trends and operational innovation in a formal, witty style.                       | Prompt design details (Sticky Note2)                 |
| The workflow assumes unique user identification by chat ID to secure commands and avoid unauthorized access. Modify user ID checks to fit your own Telegram user IDs.                                                             | User security considerations                          |
| The “generate” command triggers the LinkedIn post creation; if no new content exists, the AI will inform the user accordingly.                                                                                                   | Command logic                                         |
| Sticky notes in the workflow provide detailed multi-step explanations and setup instructions, serving as embedded documentation for maintainers and users.                                                                       | Internal documentation                               |
| The workflow can be extended to post directly to LinkedIn via API integration or add hashtag automation as future improvements.                                                                                                  | Possible enhancements                                 |

---

**Disclaimer:**  
The text provided originates solely from an automated workflow created using n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.

---