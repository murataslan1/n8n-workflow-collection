Automate Weather Reports with GPT-4 Mini and Open-Meteo API to Gmail and Slack

https://n8nworkflows.xyz/workflows/automate-weather-reports-with-gpt-4-mini-and-open-meteo-api-to-gmail-and-slack-10681


# Automate Weather Reports with GPT-4 Mini and Open-Meteo API to Gmail and Slack

### 1. Workflow Overview

This workflow, titled **Dynamic Weather Forecast Bot**, automates the delivery of weather reports using data from the Open-Meteo API, enhanced by AI-powered natural language understanding via GPT-4 Mini. It targets users who want both scheduled daily weather summaries and interactive AI-assisted weather queries delivered through Gmail and Slack.

The workflow logically splits into two main functional blocks:

- **1.1 Scheduled Daily Summary Flow:** Automatically triggers every day at 9:00 AM (or manually), fetches weather data for a fixed location, formats a concise daily temperature summary, and sends it via email and Slack.

- **1.2 AI-Powered Forecast Chat Flow:** Triggered by incoming chat messages, this block uses an AI agent powered by GPT-4 Mini to interpret weather-related questions, fetch real-time data from the weather API dynamically, and respond back through email and Slack.

Additional utility nodes include sticky notes for documentation and explanatory comments embedded within the workflow.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Daily Summary Flow

**Overview:**  
This block periodically fetches the weather forecast for a specified location, formats a daily summary message, and distributes it via Gmail and Slack.

**Nodes Involved:**  
- Schedule Trigger  
- When clicking ‘Execute workflow’ (manual trigger)  
- Fetch Weather Data  
- Format Daily Summary  
- Send Email Summary  
- Send Slack Summary  
- Sticky Note (Daily Summary Flow explanation)

**Node Details:**

- **Schedule Trigger**  
  - *Type:* Schedule Trigger  
  - *Role:* Initiates the daily weather summary at 9:00 AM every day.  
  - *Configuration:* Triggers at hour 9 daily.  
  - *Input/Output:* No inputs; outputs to Fetch Weather Data node.  
  - *Potential Failures:* Scheduling misconfiguration or workflow disabled.  

- **When clicking ‘Execute workflow’**  
  - *Type:* Manual Trigger  
  - *Role:* Allows manual execution of the daily summary for testing or on-demand use.  
  - *Input/Output:* No inputs; outputs to Fetch Weather Data.  
  - *Potential Failures:* None typical; manual trigger only.  

- **Fetch Weather Data**  
  - *Type:* HTTP Request  
  - *Role:* Requests weather forecast data from Open-Meteo API for latitude 35.469 and longitude 140.2981 (Shibuya, Tokyo area).  
  - *Configuration:* GET request to Open-Meteo API with parameters for daily min/max temperature, hourly temperature, and current temperature and humidity.  
  - *Input/Output:* Inputs from Schedule Trigger or manual trigger; outputs raw weather JSON to Format Daily Summary.  
  - *Potential Failures:* Network errors, API rate limits, incorrect coordinates, or API downtime.  
  - *Version:* Uses HTTP Request node version 4.3.  

- **Format Daily Summary**  
  - *Type:* Code (JavaScript)  
  - *Role:* Processes API response to extract today’s min and max temperatures and formats a human-readable message string.  
  - *Configuration:*  
    ```js
    const data = $input.all()[0].json;
    const minTemp = data.daily.temperature_2m_min[0];
    const maxTemp = data.daily.temperature_2m_max[0];
    const message = `Today's high in Shibuya will be ${maxTemp}°C and the low will be ${minTemp}°C.`;
    return { message };
    ```  
  - *Input/Output:* Input from Fetch Weather Data; outputs JSON with `message` property to Send Email Summary.  
  - *Potential Failures:* JSON parsing errors if API response changes or missing fields.  
  - *Version:* Code node version 2.  

- **Send Email Summary**  
  - *Type:* Gmail node  
  - *Role:* Sends the formatted weather summary via email.  
  - *Configuration:*  
    - Recipient: your-email@example.com (to be customized)  
    - Subject: "Daily Weather Forecast"  
    - Message: Uses expression to insert `{{ $json.message }}` plus a friendly closing.  
    - Credential: Gmail OAuth2 credential named "Gmail account yuki".  
  - *Input/Output:* Input from Format Daily Summary; outputs to Send Slack Summary.  
  - *Potential Failures:* Authentication errors, email delivery issues, invalid recipient address.  
  - *Version:* Gmail node version 2.1.  

- **Send Slack Summary**  
  - *Type:* Slack node  
  - *Role:* Sends the daily summary message to a specified Slack channel.  
  - *Configuration:*  
    - Channel ID: C09RLAAP0BY (customize as needed)  
    - Message: `"【Weather Forecast】\n{{ $('Format Daily Summary').item.json.message }}\nHave a great day!"`  
    - Credential: Slack OAuth2 credential named "Slack account".  
  - *Input/Output:* Input from Send Email Summary; no further output.  
  - *Potential Failures:* Slack API authentication errors, invalid channel, message formatting errors.  
  - *Version:* Slack node version 2.3.  

- **Sticky Note (Daily Summary Flow)**  
  - *Content:* "## Daily Summary Flow\nThis flow runs on a schedule to send a daily weather summary."  
  - *Role:* Documentation only.

---

#### 2.2 AI-Powered Forecast Chat Flow

**Overview:**  
This block enables dynamic weather inquiries by users via chat messages. It uses an AI agent with GPT-4 Mini to interpret questions, fetch real-time data, and respond through email and Slack.

**Nodes Involved:**  
- When chat message received  
- AI Agent  
- OpenAI Chat Model (GPT-4 Mini)  
- Simple Memory (Conversation Buffer)  
- HTTP Request Tool for AI  
- Send AI Response via Email  
- Send AI Response via Slack  
- Sticky Note (AI Agent Flow explanation)  
- Sticky Note (Agent Tools explanation)

**Node Details:**

- **When chat message received**  
  - *Type:* LangChain Chat Trigger  
  - *Role:* Entry trigger activated by receiving a chat message webhook.  
  - *Configuration:* Default parameters; webhook ID assigned.  
  - *Input/Output:* Outputs chat message data to AI Agent.  
  - *Potential Failures:* Webhook misconfiguration, message format issues.  
  - *Version:* 1.3.  

- **AI Agent**  
  - *Type:* LangChain Agent  
  - *Role:* Orchestrates AI processing, integrating language model, memory, and tools to generate a relevant weather answer.  
  - *Configuration:* Default options; connected to language model, memory, and HTTP tool.  
  - *Input/Output:* Inputs from chat trigger, memory, language model, HTTP tool; outputs response text to email and Slack sending nodes.  
  - *Potential Failures:* Agent misconfiguration, tool communication errors.  
  - *Version:* 3.  

- **OpenAI Chat Model**  
  - *Type:* LangChain OpenAI Chat Model  
  - *Role:* Provides GPT-4 Mini language model capabilities for natural language understanding and response generation.  
  - *Configuration:* Selected model "gpt-4.1-mini"; connects to AI Agent as language model.  
  - *Credentials:* OpenAI API credential "n8n free OpenAI API credits".  
  - *Potential Failures:* API key limits, network issues, model availability.  
  - *Version:* 1.2.  

- **Simple Memory**  
  - *Type:* LangChain Memory Buffer Window  
  - *Role:* Maintains conversation context for the AI Agent to enable coherent multi-turn dialogue.  
  - *Configuration:* Default buffer window (e.g., last N messages).  
  - *Input/Output:* Connected as memory to AI Agent.  
  - *Potential Failures:* Memory overflow or mismanagement.  
  - *Version:* 1.3.  

- **HTTP Request Tool for AI**  
  - *Type:* HTTP Request Tool  
  - *Role:* Enables AI Agent to fetch live weather data from Open-Meteo API dynamically, supporting the generation of accurate answers.  
  - *Configuration:* Same API endpoint as in Scheduled flow with latitude 35.469 and longitude 140.2981.  
  - *Input/Output:* Used as a tool by AI Agent via ai_tool connection.  
  - *Potential Failures:* API downtime, incorrect requests, rate limits.  
  - *Version:* 4.3.  

- **Send AI Response via Email**  
  - *Type:* Gmail node  
  - *Role:* Sends the AI-generated weather response via email.  
  - *Configuration:*  
    - Recipient: your-email@example.com (customize)  
    - Subject: "AI Weather Assistant"  
    - Message: Expression `={{ $json.output }}` extracts AI Agent output text.  
    - Credential: Gmail OAuth2 credential "Gmail account yuki".  
  - *Input/Output:* Input from AI Agent; outputs to Send AI Response via Slack.  
  - *Potential Failures:* Email sending errors, authentication failures.  
  - *Version:* 2.1.  

- **Send AI Response via Slack**  
  - *Type:* Slack node  
  - *Role:* Sends the AI-generated weather response to Slack channel.  
  - *Configuration:*  
    - Channel ID: C09RLAAP0BY (customize)  
    - Message expression: `={{ $('AI Agent').item.json.output }}`  
    - Credential: Slack OAuth2 credential "Slack account".  
  - *Input/Output:* Input from Send AI Response via Email; no further output.  
  - *Potential Failures:* Slack API errors, invalid channel ID.  
  - *Version:* 2.3.  

- **Sticky Note (AI Agent Flow)**  
  - *Content:* "## AI Agent Flow\nThis flow is triggered by a chat message and uses an AI agent to answer specific weather questions."  
  - *Role:* Documentation for AI flow.  

- **Sticky Note (Agent Tools)**  
  - *Content:* "### Agent Tools\nThese are the tools available to the AI Agent. It uses a language model (OpenAI), memory to recall conversation, and an HTTP Request tool to fetch live data."  
  - *Role:* Documentation for AI Agent components.

---

### 3. Summary Table

| Node Name                   | Node Type                      | Functional Role                                | Input Node(s)                      | Output Node(s)                   | Sticky Note                                                                                       |
|-----------------------------|--------------------------------|-----------------------------------------------|----------------------------------|---------------------------------|-------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger                | Manual start of daily summary flow             | —                                | Fetch Weather Data               |                                                                                                 |
| Schedule Trigger            | Schedule Trigger               | Automatic daily trigger at 9:00 AM              | —                                | Fetch Weather Data               |                                                                                                 |
| Fetch Weather Data          | HTTP Request                  | Requests weather data from Open-Meteo API       | Schedule Trigger, Manual Trigger | Format Daily Summary             |                                                                                                 |
| Format Daily Summary        | Code (JavaScript)             | Formats min/max daily temperature message       | Fetch Weather Data               | Send Email Summary              |                                                                                                 |
| Send Email Summary          | Gmail node                   | Sends daily summary email                        | Format Daily Summary             | Send Slack Summary              |                                                                                                 |
| Send Slack Summary          | Slack node                   | Sends daily summary to Slack channel             | Send Email Summary               | —                               |                                                                                                 |
| Sticky Note                | Sticky Note                   | Daily Summary Flow explanation                   | —                                | —                               | ## Daily Summary Flow This flow runs on a schedule to send a daily weather summary.              |
| When chat message received  | LangChain Chat Trigger        | Trigger AI flow on incoming chat message         | —                                | AI Agent                       |                                                                                                 |
| AI Agent                   | LangChain Agent               | Processes chat input using AI and tools           | When chat message received, Simple Memory, OpenAI Chat Model, HTTP Request Tool for AI | Send AI Response via Email |                                                                                                 |
| OpenAI Chat Model          | LangChain OpenAI Chat Model   | GPT-4 Mini language model for AI Agent            | —                                | AI Agent                       |                                                                                                 |
| Simple Memory              | LangChain Memory Buffer Window| Maintains conversation context for AI Agent      | —                                | AI Agent                       |                                                                                                 |
| HTTP Request Tool for AI   | HTTP Request Tool             | Fetches live weather data for AI Agent            | —                                | AI Agent                       |                                                                                                 |
| Send AI Response via Email | Gmail node                   | Sends AI-generated response via email             | AI Agent                       | Send AI Response via Slack     |                                                                                                 |
| Send AI Response via Slack | Slack node                   | Sends AI-generated response to Slack               | Send AI Response via Email       | —                               |                                                                                                 |
| Sticky Note1               | Sticky Note                   | AI Agent Flow explanation                          | —                                | —                               | ## AI Agent Flow This flow is triggered by a chat message and uses an AI agent to answer specific weather questions. |
| Sticky Note2               | Sticky Note                   | Agent Tools explanation                            | —                                | —                               | ### Agent Tools These are the tools available to the AI Agent. It uses a language model (OpenAI), memory to recall conversation, and an HTTP Request tool to fetch live data. |
| Workflow Description       | Sticky Note                   | Full workflow documentation                        | —                                | —                               | # Automate Weather Reports and AI-Powered Forecasts to Gmail and Slack (detailed instructions inside) |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Type: Manual Trigger  
   - Name: When clicking ‘Execute workflow’  
   - No parameters.  

2. **Create Schedule Trigger Node**  
   - Type: Schedule Trigger  
   - Name: Schedule Trigger  
   - Configure to trigger daily at 9:00 AM (set `triggerAtHour` to 9).  

3. **Create HTTP Request Node for Weather Data**  
   - Type: HTTP Request  
   - Name: Fetch Weather Data  
   - Method: GET  
   - URL: `https://api.open-meteo.com/v1/forecast?latitude=35.469&longitude=140.2981&daily=temperature_2m_min,temperature_2m_max&hourly=temperature_2m&current=temperature_2m,relative_humidity_2m`  
   - No authentication or additional headers required.  

4. **Connect Manual Trigger and Schedule Trigger to Fetch Weather Data**  
   - Both triggers output to the Fetch Weather Data input.  

5. **Create Code Node to Format Summary**  
   - Type: Code (JavaScript)  
   - Name: Format Daily Summary  
   - Code:
     ```js
     const data = $input.all()[0].json;
     const minTemp = data.daily.temperature_2m_min[0];
     const maxTemp = data.daily.temperature_2m_max[0];
     const message = `Today's high in Shibuya will be ${maxTemp}°C and the low will be ${minTemp}°C.`;
     return { message };
     ```  
   - Connect output of Fetch Weather Data to this node.  

6. **Create Gmail Node to Send Email Summary**  
   - Type: Gmail  
   - Name: Send Email Summary  
   - Configure:  
     - Recipient email (e.g., your-email@example.com)  
     - Subject: "Daily Weather Forecast"  
     - Message: `={{ $json.message }}\nHave a great day!` (use expression editor)  
   - Set Gmail OAuth2 credentials (must pre-configure in n8n).  
   - Connect Format Daily Summary output to this node.  

7. **Create Slack Node to Send Slack Summary**  
   - Type: Slack  
   - Name: Send Slack Summary  
   - Configure:  
     - Channel: Select your target Slack channel  
     - Message: `【Weather Forecast】\n{{ $('Format Daily Summary').item.json.message }}\nHave a great day!` (expression)  
   - Set Slack OAuth2 credentials.  
   - Connect Send Email Summary output to this node.  

8. **Create Chat Trigger Node for AI Flow**  
   - Type: LangChain Chat Trigger  
   - Name: When chat message received  
   - Default webhook configuration.  

9. **Create LangChain Agent Node**  
   - Type: LangChain Agent  
   - Name: AI Agent  
   - No special options needed.  
   - Connect input from When chat message received node.  

10. **Create OpenAI Chat Model Node**  
    - Type: LangChain OpenAI Chat Model  
    - Name: OpenAI Chat Model  
    - Select model: "gpt-4.1-mini"  
    - Configure OpenAI API credentials (pre-configured in n8n).  
    - Connect output to AI Agent as language model input.  

11. **Create Simple Memory Node**  
    - Type: LangChain Memory Buffer Window  
    - Name: Simple Memory  
    - Default configuration.  
    - Connect output to AI Agent as memory input.  

12. **Create HTTP Request Tool Node for AI**  
    - Type: HTTP Request Tool  
    - Name: HTTP Request Tool for AI  
    - Same Open-Meteo API URL as Fetch Weather Data node.  
    - Connect output to AI Agent as tool input.  

13. **Connect AI Agent output to Gmail Node**  
    - Create Gmail Node named Send AI Response via Email.  
    - Configure recipient email, subject "AI Weather Assistant".  
    - Message set to expression: `={{ $json.output }}` to send AI response.  
    - Use same Gmail OAuth2 credentials.  

14. **Connect Send AI Response via Email output to Slack Node**  
    - Create Slack Node named Send AI Response via Slack.  
    - Configure Slack channel as before.  
    - Message set to expression: `={{ $('AI Agent').item.json.output }}`.  
    - Use Slack OAuth2 credentials.  

15. **Add Sticky Notes**  
    - Add explanatory sticky notes at logical places describing the Daily Summary Flow, AI Agent Flow, Agent Tools, and overall Workflow Description.  
    - Use markdown content as provided in the original workflow.  

16. **Verify all nodes, connections, and credentials.**  
    - Ensure Gmail and Slack OAuth2 credentials are correctly set up and authorized.  
    - Validate OpenAI API key is valid and has access to GPT-4 Mini.  
    - Test manual trigger and chat webhook to confirm functionality.  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                           | Context or Link                                                                                          |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| This workflow automates weather reporting with two complementary modes: scheduled summary and AI-driven interactive queries.                                                                                                          | Workflow Description sticky note                                                                         |
| Change the latitude and longitude parameters in HTTP Request nodes to customize the location for weather data.                                                                                                                        | Applies to "Fetch Weather Data" and "HTTP Request Tool for AI" nodes                                    |
| Configure Gmail and Slack nodes with your own credentials and appropriate recipient/channel settings before activating the workflow.                                                                                                   | Credential setup instructions                                                                            |
| Uses GPT-4 Mini model for AI natural language understanding; ensure your OpenAI API key supports this model.                                                                                                                          | OpenAI Chat Model node configuration                                                                     |
| Slack channel ID `C09RLAAP0BY` and Gmail recipient `your-email@example.com` are placeholders; replace with your actual target addresses.                                                                                              | Slack and Gmail node configuration                                                                       |
| AI Agent integrates memory, language model, and live HTTP data fetching to provide context-aware, accurate weather answers.                                                                                                           | Sticky Note2 content                                                                                      |

---

**Disclaimer:** The provided text is exclusively derived from an automated workflow created with n8n, an integration and automation tool. This processing strictly respects current content policies and contains no illegal, offensive, or protected content. All manipulated data are legal and public.