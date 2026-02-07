Automate Restaurant Sales & Inventory Forecasting with Gemini AI & Google Sheets

https://n8nworkflows.xyz/workflows/automate-restaurant-sales---inventory-forecasting-with-gemini-ai---google-sheets-5983


# Automate Restaurant Sales & Inventory Forecasting with Gemini AI & Google Sheets

### 1. Workflow Overview

This workflow automates the weekly forecasting of restaurant sales and raw material inventory needs by leveraging historical sales data stored in Google Sheets and applying AI forecasting with Google Gemini. Its goal is to provide managers with actionable predictions to optimize inventory procurement and reduce waste.

The workflow consists of these main logical blocks:

- **1.1 Scheduled Trigger**  
  Automatically initiates the process weekly at a specified time.

- **1.2 Data Retrieval and Preparation**  
  Pulls historical sales and raw material usage data from Google Sheets and formats it for AI consumption.

- **1.3 AI Forecasting with Gemini**  
  Uses Google Gemini AI to analyze historical trends and generate sales and inventory forecasts for the upcoming week.

- **1.4 Forecast Parsing and Storage**  
  Parses the AI-generated forecast JSON, then logs the forecast back into a Google Sheet for recordkeeping.

- **1.5 Notification via Email**  
  Sends an email summary of the forecast to stakeholders for operational planning.

---

### 2. Block-by-Block Analysis

#### Block 1.1: Scheduled Trigger

**Overview:**  
Automatically triggers the workflow every week at 8 PM, initiating the forecasting pipeline.

**Nodes Involved:**  
- Trigger Weekly Forecast  
- Sticky Note (describing trigger function)

**Node Details:**  

- **Trigger Weekly Forecast**  
  - *Type:* Schedule Trigger  
  - *Role:* Starts the workflow weekly at 20:00 (8 PM).  
  - *Configuration:* Interval set to trigger weekly on a specific hour.  
  - *Inputs:* None (trigger node).  
  - *Outputs:* Initiates "Load Historical Sales Data" node.  
  - *Edge cases:* If the n8n instance is offline at trigger time, the execution will be missed unless the system is configured to catch missed executions.

- **Sticky Note (761f823d-4ba8-44d3-9ae7-c595de84cf9e)**  
  - *Content:* "Automatically starts the workflow at a scheduled time."  
  - *Role:* Documentation for clarity.

---

#### Block 1.2: Data Retrieval and Preparation

**Overview:**  
Retrieves historical weekly sales and raw material data from a Google Sheets document and formats it into a structured JSON suitable for AI input.

**Nodes Involved:**  
- Load Historical Sales Data  
- Format Input for AI Agent  
- Sticky Notes (related explanations)

**Node Details:**  

- **Load Historical Sales Data**  
  - *Type:* Google Sheets node  
  - *Role:* Reads raw historical data from a specific sheet (gid=0) in a Google Sheets document.  
  - *Configuration:* Uses service account authentication; reads all rows from the first sheet.  
  - *Inputs:* Trigger from schedule node.  
  - *Outputs:* Passes raw rows to "Format Input for AI Agent".  
  - *Edge cases:*  
    - Google API quota or authentication errors.  
    - Empty or malformed data in sheet.  
  - *Sticky Note:* "Pulls weekly sales and material usage from Google Sheets."

- **Format Input for AI Agent**  
  - *Type:* Code node (JavaScript)  
  - *Role:* Aggregates all rows of historical data into a single JSON object under a `rows` array for AI consumption.  
  - *Configuration:* Custom JS code that consolidates input items into one JSON payload.  
  - *Inputs:* Takes all rows from Google Sheets node.  
  - *Outputs:* Single JSON object with all data.  
  - *Edge cases:* Input data missing or corrupt could cause empty or invalid payload.  
  - *Sticky Note:* "Transforms raw data into a structured format suitable for the AI Agent."

---

#### Block 1.3: AI Forecasting with Gemini

**Overview:**  
Utilizes Google Gemini AI via Langchain integration to analyze historical data and produce a forecast for next Monday’s sales and raw material requirements.

**Nodes Involved:**  
- Generate Forecast with AI  
- AI Think Tool  
- Chat Model (Gemini)  
- Sticky Note (explaining AI usage)

**Node Details:**  

- **Generate Forecast with AI**  
  - *Type:* Langchain Agent  
  - *Role:* Passes structured data to the AI agent with a system prompt detailing the forecasting task.  
  - *Configuration:*  
    - Input JSON data mapped to prompt variable.  
    - System message instructs the AI to analyze trends, forecast sales, and calculate raw material needs.  
    - Uses a think tool to enable intermediate reasoning.  
  - *Inputs:* JSON payload from "Format Input for AI Agent".  
  - *Outputs:* AI-generated text response containing forecast JSON in markdown.  
  - *Edge cases:*  
    - AI response may be delayed or fail due to API limits or network issues.  
    - AI output may be malformed or not in expected JSON format.  
  - *Sub-workflow:* None.

- **AI Think Tool**  
  - *Type:* Langchain Think Tool  
  - *Role:* Supports the AI agent to perform intermediate logical reasoning steps if needed.  
  - *Inputs:* Integrated into AI agent execution flow.  
  - *Outputs:* Passes reasoning back to AI agent.

- **Chat Model**  
  - *Type:* Langchain Google Gemini Chat  
  - *Role:* Backend AI model executing the forecasting prompt.  
  - *Configuration:* Uses Gemini 2.5 Pro model with Google PaLM API credentials.  
  - *Inputs:* From AI agent node.  
  - *Outputs:* AI text response to agent.

- **Sticky Note (ee2932b4-96ec-464f-8b6c-0971a30740e3)**  
  - *Content:* "Uses Gemini AI to analyze trends and predict upcoming needs."

---

#### Block 1.4: Forecast Parsing and Storage

**Overview:**  
Extracts the forecast JSON from the AI’s text response, validates it, and appends it to a dedicated Google Sheet tab for forecasting records.

**Nodes Involved:**  
- Interpret AI Forecast Output  
- Log Forecast to Google Sheets  
- Sticky Notes (on parsing and logging)

**Node Details:**  

- **Interpret AI Forecast Output**  
  - *Type:* Code node (JavaScript)  
  - *Role:*  
    - Removes markdown fences from AI response.  
    - Parses the embedded JSON forecast data.  
    - Throws error if parsing fails.  
  - *Inputs:* AI forecast text from "Generate Forecast with AI".  
  - *Outputs:* Parsed forecast JSON object.  
  - *Edge cases:*  
    - Malformed AI output causing JSON parse error.  
    - AI response missing forecast data.  
  - *Sticky Note:* "Parses the AI's response into readable, usable JSON format."

- **Log Forecast to Google Sheets**  
  - *Type:* Google Sheets node  
  - *Role:* Appends the new forecast row into a specified sheet (gid=370915330) in the Google Sheets document.  
  - *Configuration:* Uses service account credentials, maps forecast JSON fields to sheet columns automatically.  
  - *Inputs:* Parsed JSON forecast from previous node.  
  - *Outputs:* Triggers the email notification node.  
  - *Edge cases:*  
    - Google Sheets API quota or auth errors.  
    - Data type mismatches (all fields treated as strings).  
  - *Sticky Note:* "Stores the new forecast data back into a Google Sheet."

---

#### Block 1.5: Notification via Email

**Overview:**  
Sends an email summary of the forecast to restaurant management, including the forecast date and a link to the Google Sheets document containing full data.

**Nodes Involved:**  
- Email Forecast Summary  
- Sticky Note (explaining email function)

**Node Details:**  

- **Email Forecast Summary**  
  - *Type:* Gmail node  
  - *Role:* Sends an HTML email with forecast date and link to Google Sheet.  
  - *Configuration:*  
    - Recipient email: xyz@gmail.com  
    - Subject: "Next monday prediction"  
    - Body includes dynamic insertion of forecast date and hyperlink to shared Google Sheet.  
    - Uses Gmail OAuth2 credentials.  
  - *Inputs:* Forecast JSON from "Log Forecast to Google Sheets".  
  - *Outputs:* None (end node).  
  - *Edge cases:*  
    - Gmail API quota or authentication failures.  
    - Invalid recipient email.  
  - *Sticky Note:* "Sends a summary of the forecast via Gmail."

---

### 3. Summary Table

| Node Name                  | Node Type                       | Functional Role                                   | Input Node(s)               | Output Node(s)                | Sticky Note                                                                                      |
|----------------------------|--------------------------------|-------------------------------------------------|-----------------------------|------------------------------|------------------------------------------------------------------------------------------------|
| Workflow Explanation       | Sticky Note                    | Describes workflow purpose                       |                             |                              | ## Workflow Overview \n\n### This workflow automates weekly forecasting of restaurant sales and raw material requirements using historical data from Google Sheets and AI predictions powered by Google Gemini. The forecast is then emailed to stakeholders for efficient planning and waste reduction. |
| Trigger Weekly Forecast    | Schedule Trigger               | Initiates workflow weekly at 8 PM                |                             | Load Historical Sales Data    | Automatically starts the workflow at a scheduled time.                                          |
| Sticky Note                | Sticky Note                    | Documentation for trigger node                    |                             |                              | Automatically starts the workflow at a scheduled time.                                          |
| Load Historical Sales Data | Google Sheets                 | Loads historical sales and material usage data   | Trigger Weekly Forecast      | Format Input for AI Agent     | Pulls weekly sales and material usage from Google Sheets.                                       |
| Sticky Note1               | Sticky Note                    | Documentation for data loading                    |                             |                              | Pulls weekly sales and material usage from Google Sheets.                                       |
| Format Input for AI Agent  | Code (JavaScript)             | Formats raw sheet data into AI input JSON        | Load Historical Sales Data   | Generate Forecast with AI     | Transforms raw data into a structured format suitable for the AI Agent.                         |
| Sticky Note5               | Sticky Note                    | Documentation for formatting code                 |                             |                              | Transforms raw data into a structured format suitable for the AI Agent.                         |
| Generate Forecast with AI  | Langchain Agent               | Sends data to Gemini AI for forecasting           | Format Input for AI Agent    | Interpret AI Forecast Output  | Uses Gemini AI to analyze trends and predict upcoming needs.                                   |
| AI Think Tool              | Langchain Tool Think          | Enables intermediate AI reasoning                  | Integrated with AI Agent     | Integrated with AI Agent      | Uses Gemini AI to analyze trends and predict upcoming needs.                                   |
| Chat Model                 | Langchain LM Chat Google Gemini| Gemini AI model node for forecasting               | Generate Forecast with AI    | Generate Forecast with AI     | Uses Gemini AI to analyze trends and predict upcoming needs.                                   |
| Sticky Note6               | Sticky Note                    | Documentation for AI forecasting                   |                             |                              | Uses Gemini AI to analyze trends and predict upcoming needs.                                   |
| Interpret AI Forecast Output| Code (JavaScript)             | Parses AI response JSON into usable data           | Generate Forecast with AI    | Log Forecast to Google Sheets | Parses the AI's response into readable, usable JSON format.                                    |
| Sticky Note2               | Sticky Note                    | Documentation for parsing AI output                |                             |                              | Parses the AI's response into readable, usable JSON format.                                    |
| Log Forecast to Google Sheets | Google Sheets               | Appends forecast to Google Sheet                   | Interpret AI Forecast Output | Email Forecast Summary        | Stores the new forecast data back into a Google Sheet.                                        |
| Sticky Note3               | Sticky Note                    | Documentation for logging forecast                  |                             |                              | Stores the new forecast data back into a Google Sheet.                                        |
| Email Forecast Summary     | Gmail                         | Sends forecast summary email to stakeholders       | Log Forecast to Google Sheets|                              | Sends a summary of the forecast via Gmail.                                                    |
| Sticky Note4               | Sticky Note                    | Documentation for email notification                |                             |                              | Sends a summary of the forecast via Gmail.                                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow** and name it "Restaurant Sales & Inventory Forecasting System using Gemini AI & Google Sheets".

2. **Add a Schedule Trigger node** named "Trigger Weekly Forecast".  
   - Set interval to weekly.  
   - Set trigger hour to 20 (8 PM).  
   - Connect this node’s output to the next node.

3. **Add a Google Sheets node** named "Load Historical Sales Data".  
   - Operation: Read Rows.  
   - Document ID: use your restaurant sales data Google Sheet ID.  
   - Sheet GID: 0 (first sheet where historical data is stored).  
   - Authentication: Use a Google Service Account credential with access to the Sheet.  
   - Connect input from "Trigger Weekly Forecast".

4. **Add a Code node** named "Format Input for AI Agent".  
   - Mode: Run Once for All Items.  
   - Paste the provided JavaScript code to bundle all rows into a single JSON object with a `rows` array.  
   - Connect input from "Load Historical Sales Data".

5. **Add a Langchain Agent node** named "Generate Forecast with AI".  
   - Set the input text to the JSON from previous node: `={{ $json.data }}`.  
   - Configure the system prompt as described to instruct the AI to analyze historical data and forecast next Monday’s sales and raw material needs, outputting a single JSON record.  
   - Enable the Think Tool option to allow intermediate reasoning.  
   - Connect input from "Format Input for AI Agent".

6. **Add Langchain Tool Think node** named "AI Think Tool".  
   - No special config needed; part of AI reasoning.  
   - Connect input from "Generate Forecast with AI" on ai_tool port.

7. **Add Langchain LM Chat Google Gemini node** named "Chat Model".  
   - Model: Select "models/gemini-2.5-pro".  
   - Provide Google PaLM API OAuth2 credentials.  
   - Connect input from "Generate Forecast with AI" on ai_languageModel port.

8. **Add a Code node** named "Interpret AI Forecast Output".  
   - Mode: Run Once for All Items.  
   - Paste the provided JavaScript to extract and parse the JSON forecast from the AI text response.  
   - Connect input from "Generate Forecast with AI".

9. **Add a Google Sheets node** named "Log Forecast to Google Sheets".  
   - Operation: Append Rows.  
   - Document ID: same Google Sheet as before.  
   - Sheet GID: 370915330 (sheet for forecast results).  
   - Map columns automatically to the forecast JSON fields.  
   - Use same Service Account credentials.  
   - Connect input from "Interpret AI Forecast Output".

10. **Add a Gmail node** named "Email Forecast Summary".  
    - Recipient: your manager's email.  
    - Subject: "Next monday prediction".  
    - Message (HTML): includes forecast date from input and link to Google Sheet.  
    - Use Gmail OAuth2 credentials.  
    - Connect input from "Log Forecast to Google Sheets".

11. **Optionally add Sticky Notes** next to each node for documentation, using the provided content for clarity.

12. **Activate the workflow** and test by manually triggering or waiting for the scheduled time.

---

### 5. General Notes & Resources

| Note Content                                                                                                                    | Context or Link                                                                                      |
|---------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| This workflow leverages Google Gemini AI, accessible via the Google PaLM API, using Langchain integration in n8n.              | https://developers.generativeai.google/                                                            |
| Google Sheets authentication uses a Service Account for read and write access.                                                  | Setup requires sharing the sheet with the service account email.                                   |
| Gmail node uses OAuth2 credentials to send emails securely without password exposure.                                           | https://developers.google.com/gmail/api/auth/about-auth                                          |
| The AI prompt includes detailed instructions and expects output in JSON markdown format for accurate parsing.                  | Modifications to prompt may affect AI output structure and require code adjustments for parsing.   |
| Consider API quota limits for Google Sheets, Gmail, and Google Gemini when running this workflow frequently.                    | Monitor usage dashboards in Google Cloud Console.                                                  |
| Test AI response parsing carefully to handle unexpected output formats or errors gracefully.                                     | Use try/catch in code nodes and add error handling workflows if needed.                            |

---

This documentation fully describes the workflow structure, node configurations, and setup instructions to enable advanced users and AI agents to understand, reproduce, and maintain the restaurant sales and inventory forecasting automation.