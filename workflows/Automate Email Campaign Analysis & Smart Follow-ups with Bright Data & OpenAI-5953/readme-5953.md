Automate Email Campaign Analysis & Smart Follow-ups with Bright Data & OpenAI

https://n8nworkflows.xyz/workflows/automate-email-campaign-analysis---smart-follow-ups-with-bright-data---openai-5953


# Automate Email Campaign Analysis & Smart Follow-ups with Bright Data & OpenAI

### 1. Workflow Overview

This workflow automates the monitoring and analysis of email campaign performance, leveraging Bright Data’s scraping capabilities and OpenAI’s language models to intelligently scrape campaign data, analyze it, and trigger smart follow-up emails based on performance metrics. It targets marketing teams or automation specialists who want to regularly track email campaign effectiveness without manual intervention and send personalized engagement emails only when beneficial.

The workflow is structured into three main logical blocks:

- **1.1 Schedule & Prepare Inputs**: Automatically triggers the workflow daily and sets required input parameters such as the campaign report URL.
- **1.2 Scrape & Analyze with AI Agent**: Uses Bright Data to scrape campaign data, then processes the data using an AI agent and OpenAI language models to extract structured metrics.
- **1.3 Decide & Act Automatically**: Evaluates the campaign metrics and decides whether to send a personalized follow-up email or skip action.

---

### 2. Block-by-Block Analysis

#### 2.1 Schedule & Prepare Inputs

**Overview:**  
This block initiates the workflow on a daily schedule and sets the necessary input parameters for further processing, such as the campaign report URL.

**Nodes Involved:**  
- ⏰ Daily Campaign Check Trigger  
- ✏️ Set Campaign Input Fields

**Node Details:**

- **⏰ Daily Campaign Check Trigger**  
  - Type: Schedule Trigger  
  - Role: Automatically triggers the workflow at 9:00 AM every day.  
  - Configuration: Scheduled to run daily at hour 9.  
  - Inputs: None (trigger node)  
  - Outputs: Connected to "Set Campaign Input Fields" node  
  - Edge Cases: Workflow will not run if n8n instance is down or scheduler is disabled.  
  - Version: 1.2

- **✏️ Set Campaign Input Fields**  
  - Type: Set  
  - Role: Defines static or dynamic input values for the workflow; here, it sets the campaign report URL.  
  - Configuration: Sets a string field `url` with value `https://www.mailchimp.com/campaigns/123/report`.  
  - Key Expression: Static URL string assignment.  
  - Inputs: From schedule trigger node  
  - Outputs: Connects to AI Agent node  
  - Edge Cases: If the URL is incorrect or inaccessible, downstream scraping will fail.  
  - Version: 3.4

---

#### 2.2 Scrape & Analyze with AI Agent

**Overview:**  
This block performs the core data gathering by scraping the email campaign report using Bright Data, then processes and formats the scraped data with OpenAI LLMs and an AI Agent to produce structured campaign metrics.

**Nodes Involved:**  
- 🤖 Agent: Scrape & Analyze Campaign Performance  
- 🌐 Bright Data MCP: Scrape Report  
- 🧠 LLM: Summarize & Format  
- Auto-fixing Output Parser  
- OpenAI Chat Model  
- Structured Output Parser

**Node Details:**

- **🤖 Agent: Scrape & Analyze Campaign Performance**  
  - Type: LangChain Agent Node  
  - Role: Coordinates the scraping and AI processing; calls Bright Data tool and OpenAI models, parses output.  
  - Configuration: Uses a defined prompt type with output parser enabled.  
  - Inputs: Receives URL from Set Campaign Input Fields node, and connects to Bright Data MCP and LLM nodes.  
  - Outputs: Provides processed campaign metrics JSON to decision node.  
  - Edge Cases: Failures in tool execution (scraping or LLM), parsing errors, or timeouts.  
  - Version: 2

- **🌐 Bright Data MCP: Scrape Report**  
  - Type: MCP Client Tool (Bright Data)  
  - Role: Scrapes the live campaign report page as markdown from the given URL.  
  - Configuration: Uses `scrape_as_markdown` tool with parameters dynamically set by AI override.  
  - Credentials: Requires valid Bright Data MCP credentials.  
  - Inputs: Called by AI Agent node as a tool.  
  - Outputs: Scraped raw markdown data to the AI Agent.  
  - Edge Cases: Authentication failures, page layout changes causing scrape errors, network timeouts.  
  - Version: 1

- **🧠 LLM: Summarize & Format**  
  - Type: LangChain OpenAI Chat Model  
  - Role: Summarizes and formats scraped raw data into a readable or structured form.  
  - Configuration: Uses GPT-4o-mini model.  
  - Credentials: Requires OpenAI API credentials.  
  - Inputs: Receives scraped markdown content from Bright Data via the AI Agent.  
  - Outputs: Formatted summary to Output Parser.  
  - Edge Cases: API rate limits, network issues, unexpected input formats.  
  - Version: 1.2

- **Auto-fixing Output Parser**  
  - Type: LangChain Output Parser Autofixing  
  - Role: Automatically corrects and parses the LLM output to ensure clean, structured JSON.  
  - Inputs: Receives summarized output from the LLM node.  
  - Outputs: Passes cleaned data to the Agent node for final processing.  
  - Edge Cases: Parsing fails if output deviates significantly from expected schema.  
  - Version: 1

- **OpenAI Chat Model**  
  - Type: LangChain OpenAI Chat Model  
  - Role: Used internally by the Auto-fixing Output Parser for parsing assistance.  
  - Configuration: Same GPT-4o-mini model.  
  - Credentials: OpenAI API credentials.  
  - Inputs/Outputs: Connected to Auto-fixing Output Parser.  
  - Edge Cases: As above.  
  - Version: 1.2

- **Structured Output Parser**  
  - Type: LangChain Output Parser Structured  
  - Role: Defines and validates the expected JSON schema for campaign metrics, including fields like open_rate, CTR, bounces, and unsubscribe rates.  
  - Inputs: Receives AI Agent processed data.  
  - Outputs: Structured JSON data for decision-making.  
  - Edge Cases: Schema mismatches cause failures.  
  - Version: 1.2

---

#### 2.3 Decide & Act Automatically

**Overview:**  
Based on the extracted campaign metrics, this block determines if a follow-up email should be sent to re-engage the audience or if no action is needed.

**Nodes Involved:**  
- 🔎 IF: Open ≥30% & CTR <10%?  
- 📧 Send Follow-Up Engagement Email  
- 🚫 Skip — No Action Needed

**Node Details:**

- **🔎 IF: Open ≥30% & CTR <10%?**  
  - Type: If node  
  - Role: Evaluates if open rate ≥ 20% and CTR < 130 (likely a typo or misconfiguration, see notes).  
  - Configuration: Checks two conditions combined with AND:  
    - `open_rate >= 20`  
    - `ctr < 130`  
  - Inputs: Receives structured campaign metrics JSON.  
  - Outputs: True branch → Send Follow-Up Email; False branch → Skip No Action.  
  - Edge Cases: Incorrect data types or missing fields cause evaluation failure. The numeric thresholds appear inconsistent with sticky notes (mentions ≥30% open, <10% CTR).  
  - Version: 2.2

- **📧 Send Follow-Up Engagement Email**  
  - Type: Gmail node  
  - Role: Sends a personalized follow-up email to encourage clicks from users who opened but did not engage further.  
  - Configuration:  
    - To: `shahkar.genai@gmail.com` (hardcoded)  
    - Subject: “Did you miss this? Here’s something special for you!”  
    - Body: Plain text with placeholders for personalization (e.g., [First Name], [Big Benefit or Offer], [CTA Button]).  
  - Credentials: Gmail OAuth2 required.  
  - Inputs: True branch from IF node.  
  - Outputs: Workflow ends after sending.  
  - Edge Cases: Authentication errors, sending limits, invalid email address.  
  - Version: 2.1

- **🚫 Skip — No Action Needed**  
  - Type: No Operation (NoOp) node  
  - Role: Ends workflow silently if campaign performance does not meet criteria for follow-up.  
  - Inputs: False branch from IF node.  
  - Outputs: None (workflow ends).  
  - Edge Cases: None significant.  
  - Version: 1

---

### 3. Summary Table

| Node Name                            | Node Type                      | Functional Role                          | Input Node(s)                     | Output Node(s)                   | Sticky Note                                                                                                                            |
|------------------------------------|--------------------------------|----------------------------------------|----------------------------------|---------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| ⏰ Daily Campaign Check Trigger     | Schedule Trigger               | Initiates workflow daily at 9 AM       | —                                | ✏️ Set Campaign Input Fields     | See Sticky Note4: Automates daily start and input preparation.                                                                        |
| ✏️ Set Campaign Input Fields        | Set                           | Defines campaign URL input              | ⏰ Daily Campaign Check Trigger   | 🤖 Agent: Scrape & Analyze       | See Sticky Note4                                                                                                                       |
| 🤖 Agent: Scrape & Analyze Campaign Performance | LangChain Agent             | Controls scraping & AI processing       | ✏️ Set Campaign Input Fields     | 🔎 IF: Open ≥30% & CTR <10%?     | See Sticky Note1: Central AI logic - calls Bright Data MCP and LLM nodes                                                                |
| 🌐 Bright Data MCP: Scrape Report   | MCP Client Tool (Bright Data) | Scrapes live campaign report data       | AI Agent                        | AI Agent                       | See Sticky Note1: Scrapes campaign data as markdown                                                                                   |
| 🧠 LLM: Summarize & Format          | LangChain OpenAI Chat Model   | Summarizes and formats scraped data     | AI Agent                        | AI Agent                       | See Sticky Note1: Converts raw scrape to structured or readable format                                                                 |
| Auto-fixing Output Parser           | LangChain Output Parser       | Cleans and parses LLM output             | 🧠 LLM: Summarize & Format       | 🤖 Agent: Scrape & Analyze       | See Sticky Note1                                                                                                                       |
| OpenAI Chat Model                  | LangChain OpenAI Chat Model   | Assists parsing within output parser     | Auto-fixing Output Parser        | Auto-fixing Output Parser        | See Sticky Note1                                                                                                                       |
| Structured Output Parser            | LangChain Output Parser       | Validates structured campaign metrics   | AI Agent                        | 🔎 IF: Open ≥30% & CTR <10%?     | See Sticky Note1                                                                                                                       |
| 🔎 IF: Open ≥30% & CTR <10%?         | If                           | Makes decision to follow-up or skip      | 🤖 Agent: Scrape & Analyze       | 📧 Send Follow-Up Email, 🚫 Skip | See Sticky Note2: Checks campaign performance thresholds to decide next action                                                         |
| 📧 Send Follow-Up Engagement Email  | Gmail                        | Sends follow-up email if criteria met    | 🔎 IF: Open ≥30% & CTR <10%?      | —                               | See Sticky Note2: Sends personalized re-engagement email                                                                               |
| 🚫 Skip — No Action Needed           | No Operation                 | Ends workflow if no action needed        | 🔎 IF: Open ≥30% & CTR <10%?      | —                               | See Sticky Note2: Ends workflow silently                                                                                              |
| Sticky Note (multiple)               | Sticky Note                  | Documentation and comments                | —                                | —                               | See Sticky Note4, Sticky Note1, Sticky Note2, Sticky Note5, Sticky Note9 for detailed explanation and external links                 |
| Sticky Note5                       | Sticky Note                  | Affiliate link for Bright Data            | —                                | —                               | "I’ll receive a tiny commission if you join Bright Data through this link: https://get.brightdata.com/1tndi4600b25"                  |
| Sticky Note9                       | Sticky Note                  | Workflow assistance and support contacts | —                                | —                               | Contact: Yaron@nofluff.online; YouTube & LinkedIn links provided                                                                       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger Node:**  
   - Type: Schedule Trigger  
   - Set to run daily at 9:00 AM (hour 9).  
   - Name it: "⏰ Daily Campaign Check Trigger".

2. **Create a Set Node:**  
   - Type: Set  
   - Add a string field named `url`.  
   - Set its value to the campaign report URL, e.g., `https://www.mailchimp.com/campaigns/123/report`.  
   - Name it: "✏️ Set Campaign Input Fields".  
   - Connect output of Schedule Trigger node to this node.

3. **Create a LangChain Agent Node:**  
   - Type: LangChain Agent  
   - Name: "🤖 Agent: Scrape & Analyze Campaign Performance".  
   - Configure prompt type as “define” with output parser enabled.  
   - Connect output of Set node to this Agent node.

4. **Create MCP Client Tool Node (Bright Data):**  
   - Type: MCP Client Tool  
   - Tool Name: `scrape_as_markdown`  
   - Operation: `executeTool`  
   - Tool Parameters: leave dynamic or use AI override as per your scraping needs.  
   - Add your Bright Data MCP credentials.  
   - Connect this node as an AI tool inside the Agent node (via AI tool input).

5. **Create LangChain OpenAI Chat Model Node:**  
   - Type: LangChain OpenAI Chat Model  
   - Model: `gpt-4o-mini`  
   - Add OpenAI API credentials.  
   - Connect as AI language model input to Agent node.

6. **Create LangChain Output Parser Autofixing Node:**  
   - Type: Output Parser Autofixing  
   - Connect input from the OpenAI Chat Model node.  
   - Connect output to the Agent node as AI output parser.

7. **Create a second LangChain OpenAI Chat Model Node:**  
   - Same as above, used internally for parsing assistance.  
   - Connect inputs/outputs accordingly (to autofixing output parser).

8. **Create LangChain Structured Output Parser Node:**  
   - Type: Structured Output Parser  
   - Define JSON schema with fields: campaign_name, campaign_id, date_sent, unique_opens, total_opens, open_rate, unique_clicks, total_clicks, ctr, soft_bounces, hard_bounces, bounce_rate, unsubscribed, unsubscribe_rate (see example in node).  
   - Connect input from Agent node.  
   - Connect output to the IF node.

9. **Create an If Node:**  
   - Name: "🔎 IF: Open ≥30% & CTR <10%?"  
   - Conditions:  
     - `open_rate >= 30` (adjust from workflow’s 20 to match sticky note comment)  
     - `ctr < 10`  
   - Both conditions combined with AND.  
   - Connect input from Structured Output Parser node.

10. **Create Gmail Node (Send Email):**  
    - Name: "📧 Send Follow-Up Engagement Email"  
    - Configure with Gmail OAuth2 credentials.  
    - To: Set recipient address (example: `shahkar.genai@gmail.com`).  
    - Subject: “Did you miss this? Here’s something special for you!”  
    - Body: Plain text with placeholders for personalization.  
    - Connect to IF node’s True output.

11. **Create No Operation Node:**  
    - Name: "🚫 Skip — No Action Needed"  
    - Connect to IF node’s False output.

12. **Connect workflow end points:**  
    - After email sending or no-op, workflow ends.

---

### 5. General Notes & Resources

| Note Content                                                                                                             | Context or Link                                                                                         |
|--------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|
| I’ll receive a tiny commission if you join Bright Data through this link—thanks for fueling more free content!           | https://get.brightdata.com/1tndi4600b25                                                               |
| Workflow assistance contact: Yaron@nofluff.online                                                                        | Support email                                                                                            |
| Explore more tips and tutorials: YouTube https://www.youtube.com/@YaronBeen/videos / LinkedIn https://linkedin.com/in/yaronbeen | Helpful external channels for learning more about n8n and automation                                   |
| The workflow automates repeated manual tasks and combines scraping and AI to transform messy data into actionable insights | Project branding and conceptual overview                                                               |
| Adjust IF node condition thresholds carefully to fit your campaign goals (sticky notes mention ≥30% open and <10% CTR)    | Potential adjustment for decision logic                                                                |
| Use dynamic variables in Set node if campaign URLs or parameters change regularly                                        | Workflow flexibility tip                                                                                |

---

**Disclaimer:** The text provided is exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.