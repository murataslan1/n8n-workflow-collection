Automate Employee Birthdays & Work Anniversaries with Google Gemini and Slack

https://n8nworkflows.xyz/workflows/automate-employee-birthdays---work-anniversaries-with-google-gemini-and-slack-10430


# Automate Employee Birthdays & Work Anniversaries with Google Gemini and Slack

### 1. Workflow Overview

This workflow automates sending personalized employee birthday and work anniversary congratulations to a Slack channel daily at 9 AM. It serves HR or internal communications teams aiming to replace paid Slack bots like BillyBot with a cost-effective, AI-powered alternative. The workflow fetches employee data from Google Sheets, filters for celebrations occurring on the current day, generates unique, heartfelt Slack messages using Google Gemini's AI language model, and posts them to Slack.

The workflow’s logic is organized into these logical blocks:

- **1.1 Scheduled Trigger:** Initiates the workflow every day at 9 AM.
- **1.2 Data Retrieval:** Fetches employee data from a Google Sheets document.
- **1.3 Celebration Filtering:** Filters employees whose birthdays or work anniversaries match the current date.
- **1.4 Data Aggregation:** Combines filtered records to prepare for batch processing.
- **1.5 AI Message Generation:** Uses Google Gemini and LangChain agent nodes to generate varied, personalized Slack messages abiding by specific style and formatting rules.
- **1.6 Slack Notification:** Posts the generated messages to a designated Slack channel.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Trigger

**Overview:**  
Triggers the workflow every day at 9 AM to initiate the automation.

**Nodes Involved:**  
- Daily 9AM Trigger

**Node Details:**  
- **Daily 9AM Trigger**  
  - Type: Schedule Trigger  
  - Configuration: Set to trigger daily at hour 9 (9 AM)  
  - Inputs: None (start node)  
  - Outputs: Connects to "Fetch Employee Data" node  
  - Edge Cases: Workflow won’t run if n8n instance is offline or if scheduler is misconfigured; time zone considerations may affect trigger time accuracy.

#### 2.2 Data Retrieval

**Overview:**  
Fetches the complete employee dataset from a specified Google Sheets document.

**Nodes Involved:**  
- Fetch Employee Data

**Node Details:**  
- **Fetch Employee Data**  
  - Type: Google Sheets node  
  - Configuration:  
    - Reads data from specified Sheet ID and Document ID representing an employee data sheet  
    - Expected columns: NO | Name | Email | Date of Birth (YYYY-MM-DD) | Joining Date (YYYY-MM-DD)  
  - Credentials: Uses OAuth2 credentials for Google Sheets access  
  - Inputs: Receives trigger from "Daily 9AM Trigger"  
  - Outputs: Passes data to "Check Birthday or Work Anniversary" node  
  - Edge Cases:  
    - Authentication errors if OAuth token expires or lacks permissions  
    - Empty or malformed sheets cause downstream errors  
    - Date formats must strictly follow ISO (YYYY-MM-DD) or else date parsing will fail

#### 2.3 Celebration Filtering

**Overview:**  
Filters the fetched employee data to identify those celebrating birthdays or work anniversaries on the current day.

**Nodes Involved:**  
- Check Birthday or Work Anniversary

**Node Details:**  
- **Check Birthday or Work Anniversary**  
  - Type: If node (conditional)  
  - Configuration:  
    - Condition checks if today’s date (formatted MM-dd) equals either the "Date of Birth" or "Joining Date" fields (also formatted MM-dd) in each record  
    - Combines conditions with OR logic (birthday or anniversary)  
  - Inputs: Employee data array from "Fetch Employee Data"  
  - Outputs: True branch leads to further processing; false branch discards non-matching records  
  - Expressions: Uses DateTime functions to parse and format dates dynamically  
  - Edge Cases:  
    - Records with missing or invalid date fields will not match  
    - Time zone differences may cause date mismatches if server time is different from employee locale  
    - Loose type validation helps avoid strict type errors but may allow unexpected data types that produce false negatives

#### 2.4 Data Aggregation

**Overview:**  
Aggregates all employees celebrating today into a single combined data item to enable batch message generation.

**Nodes Involved:**  
- Combine Today's Celebrations

**Node Details:**  
- **Combine Today's Celebrations**  
  - Type: Aggregate node  
  - Configuration: Aggregates all incoming items into one item containing an array of celebration data (`aggregateAllItemData`)  
  - Inputs: Filtered employee items from "Check Birthday or Work Anniversary"  
  - Outputs: Single aggregated item to "Generate Personalized Slack Message"  
  - Edge Cases:  
    - If no employees celebrate today, aggregation results in empty data, which downstream nodes must handle gracefully  
    - Large number of celebrations could impact AI prompt size or processing time

#### 2.5 AI Message Generation

**Overview:**  
Generates unique, heartfelt Slack messages for each celebration using Google Gemini’s language model, following detailed style and formatting guidelines.

**Nodes Involved:**  
- Google Gemini Chat Model  
- Generate Personalized Slack Message

**Node Details:**  
- **Google Gemini Chat Model**  
  - Type: AI language model (Google Gemini) via LangChain node  
  - Configuration: Default options; credentials linked to Google Palm API account  
  - Inputs: Feeds AI model into the LangChain agent node to process message generation  
  - Outputs: Connects to "Generate Personalized Slack Message" node's AI language model input  
  - Edge Cases: Possible API rate limits, token expiration, or service downtime

- **Generate Personalized Slack Message**  
  - Type: LangChain agent node  
  - Configuration:  
    - Receives aggregated employee data and current date as input  
    - System message instructs AI to generate varied message styles (12 rotating styles), respecting formatting rules (Markdown, emojis, tone)  
    - Ensures messages feel personal and non-repetitive, adapts to tenure for anniversaries  
    - Output: Slack-ready text with line breaks, bold/italic styling, and emojis  
  - Inputs: Aggregated data and AI model output from "Google Gemini Chat Model"  
  - Outputs: Passes generated message text to Slack posting node  
  - Edge Cases:  
    - Large input data could exceed token limits of AI model  
    - AI-generated text may occasionally not meet formatting expectations, requiring validation  
    - Network or API failures interrupt generation

#### 2.6 Slack Notification

**Overview:**  
Posts the AI-generated celebration messages to a pre-configured Slack channel.

**Nodes Involved:**  
- Post Celebration to Slack Channel

**Node Details:**  
- **Post Celebration to Slack Channel**  
  - Type: Slack node  
  - Configuration:  
    - Posts message text received from "Generate Personalized Slack Message" to a selected Slack channel (by channel ID)  
    - Disables workflow link inclusion for cleaner messages  
  - Credentials: Uses Slack Bot OAuth token  
  - Inputs: Receives message text from previous node  
  - Outputs: Terminal node (no outputs)  
  - Edge Cases:  
    - Authentication errors if Slack token expires or lacks permissions  
    - API rate limits or network issues may cause posting failures  
    - Slack channel ID must be valid and accessible by bot

---

### 3. Summary Table

| Node Name                      | Node Type                                 | Functional Role                           | Input Node(s)               | Output Node(s)                      | Sticky Note                                                                                                          |
|-------------------------------|-------------------------------------------|-----------------------------------------|-----------------------------|-----------------------------------|----------------------------------------------------------------------------------------------------------------------|
| Google Gemini Chat Model       | AI Language Model (LangChain Google Gemini) | Provides AI language model for message generation | None (AI model input)        | Generate Personalized Slack Message |                                                                                                                      |
| Sticky Note                   | Sticky Note                              | Documentation and workflow overview     | None                        | None                              | 🎉 Replace BillyBot: Free Slack Employee Birthday & Anniversary Automation - Runs daily at 9 AM. Fetches employee data from Google Sheets, filters today's birthdays/anniversaries, generates personalized AI messages, and posts to Slack. Sheet format: NO | Name | Email | Date of Birth (YYYY-MM-DD) | Joining Date (YYYY-MM-DD). AI features: 12 rotating message styles, auto-calculates tenure, Slack markdown formatting. Cost: $0-20/month vs BillyBot's $1/employee/month ($600-2,400/year for 50-200 employees) |
| Daily 9AM Trigger             | Schedule Trigger                        | Initiates workflow daily at 9 AM        | None                        | Fetch Employee Data               |                                                                                                                      |
| Fetch Employee Data           | Google Sheets                          | Retrieves employee data from Google Sheets | Daily 9AM Trigger           | Check Birthday or Work Anniversary |                                                                                                                      |
| Check Birthday or Work Anniversary | If Node                              | Filters employees with today's birthdays or anniversaries | Fetch Employee Data          | Combine Today's Celebrations       |                                                                                                                      |
| Combine Today's Celebrations  | Aggregate                             | Aggregates filtered celebrations into single batch | Check Birthday or Work Anniversary | Generate Personalized Slack Message |                                                                                                                      |
| Generate Personalized Slack Message | LangChain Agent                       | Generates unique, styled Slack messages using AI | Google Gemini Chat Model, Combine Today's Celebrations | Post Celebration to Slack Channel |                                                                                                                      |
| Post Celebration to Slack Channel | Slack Node                           | Posts generated messages to Slack channel | Generate Personalized Slack Message | None                              |                                                                                                                      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node:**  
   - Type: Schedule Trigger  
   - Set to trigger daily at 9 AM (hour = 9)  

2. **Create a Google Sheets node:**  
   - Type: Google Sheets  
   - Set operation to read rows from the employee data sheet  
   - Configure with your Google Sheets Document ID and Sheet name (e.g., "Sheet1")  
   - Use OAuth2 credentials with read access to the sheet  
   - Connect Schedule Trigger output to this node’s input  

3. **Create an If node:**  
   - Type: If  
   - Set condition with OR logic:  
     - Check if `{{ $now.toFormat('MM-dd') }}` equals `{{ DateTime.fromISO($json['Date of Birth']).toFormat('MM-dd') }}`  
     - OR equals `{{ DateTime.fromISO($json['Joining Date']).toFormat('MM-dd') }}`  
   - Connect Google Sheets node output to this If node  
   - True branch leads to next step; false branch terminates or discards  

4. **Create an Aggregate node:**  
   - Type: Aggregate  
   - Set to aggregate all incoming items into a single object (`aggregateAllItemData`)  
   - Connect the If node’s true output to this Aggregate node  

5. **Create a Google Gemini Chat Model node:**  
   - Type: AI Language Model (LangChain Google Gemini)  
   - Configure with Google Palm API credentials  
   - No specific prompt parameters needed here, just provide credentials  
   - This node provides the AI model to the Agent node below  

6. **Create a LangChain Agent node:**  
   - Type: LangChain Agent  
   - Configure prompt:  
     - Input: today's date (`{{ $now }}`) and JSON stringified aggregated employee data (`{{ $json.data.toJsonString() }}`)  
     - System message instructing AI to generate unique, heartfelt, and varied Slack messages per detailed style rules (see Overview)  
   - Connect Aggregate node output as main input  
   - Connect Google Gemini Chat Model output as AI language model input  
   - Output is the generated Slack message text  

7. **Create a Slack node:**  
   - Type: Slack  
   - Configure with Slack Bot OAuth2 credentials  
   - Set channel ID for your target Slack channel  
   - Message text set to `{{ $json.output }}` (output from LangChain Agent)  
   - Disable the option to include workflow link for cleaner messages  
   - Connect LangChain Agent node output to this Slack node  

8. **Add a Sticky Note node (optional):**  
   - Add a sticky note with summary and instructions for users or maintainers  

9. **Test the workflow:**  
   - Run manually or wait for the scheduled trigger  
   - Check Google Sheets data correctness and Slack message appearance  
   - Monitor for any failed executions and check credentials or API limits  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                     | Context or Link                                                                                       |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| 🎉 Replace BillyBot: Free Slack Employee Birthday & Anniversary Automation. Cost-effective compared to BillyBot’s $1/employee/month pricing.                                                                                   | Sticky Note content in workflow description                                                         |
| Sheet format must include columns: NO, Name, Email, Date of Birth (YYYY-MM-DD), Joining Date (YYYY-MM-DD). Consistency in date format is critical.                                                                              | Sticky Note and node configuration notes                                                            |
| AI message generation rules include 12 rotating styles, markdown formatting, emoji usage, and writing tips for natural, human-like, and culturally inclusive messages.                                                           | System message in LangChain Agent node                                                              |
| Google Gemini API credentials required to access AI model; OAuth2 credentials needed for Google Sheets and Slack nodes.                                                                                                         | Credential fields in respective nodes                                                               |
| Slack bot token must have permission to post messages in the target channel.                                                                                                                                                     | Slack node credential requirements                                                                  |
| For large teams, consider AI token or rate limits when scaling; test prompt length and adjust aggregation size if needed.                                                                                                       | Edge case considerations in AI nodes                                                                |
| Helpful links and API documentation:  
- Google Sheets API: https://developers.google.com/sheets/api  
- Slack API: https://api.slack.com  
- Google Gemini AI: https://developers.generativeai.google/products/gemini  
- LangChain n8n nodes: https://n8n.io/integrations/n8n-nodes-langchain                                                                                             | External resources for credential setup and node usage                                              |

---

**Disclaimer:** The provided text originates exclusively from an n8n automated workflow. It complies strictly with applicable content policies and contains no illegal, offensive, or protected elements. All manipulated data are legal and public.