AI-Powered Price Watchdog: Competitor Monitoring & Alerting (Decodo & Gemini)

https://n8nworkflows.xyz/workflows/ai-powered-price-watchdog--competitor-monitoring---alerting--decodo---gemini--11063


# AI-Powered Price Watchdog: Competitor Monitoring & Alerting (Decodo & Gemini)

---

### 1. Workflow Overview

This workflow, titled **AI-Powered Price Watchdog: Competitor Monitoring & Alerting (Decodo & Gemini)**, is designed to automate monitoring of competitor pricing pages by dynamically scraping pricing data, structuring it with AI, comparing it against historical data, and sending alerts upon significant price changes.

**Target Use Cases:**  
- Monitoring competitor pricing changes across multiple companies and pricing plans.  
- Detecting critical price shifts such as free-to-paid transitions or substantial percentage changes.  
- Automating alert notifications via Slack to inform stakeholders instantly.  
- Maintaining an evolving historical dataset in Google Sheets for trend analysis and comparison.

The workflow is logically divided into the following blocks:

- **1.1 Initialization & Configuration:** Setup parameters and trigger runs manually or on schedule.  
- **1.2 Data Sourcing:** Retrieve competitor URLs from Google Sheets.  
- **1.3 HTML Scraping & Cleaning:** Fetch fully rendered competitor pages via Decodo, then clean and isolate pricing-relevant text.  
- **1.4 AI Extraction & Structuring:** Use Google Gemini via LangChain to parse the cleaned text into structured JSON pricing data.  
- **1.5 Validation & History Checking:** Ensure AI output is valid and check if historical data exists.  
- **1.6 Price Comparison & Alert Filtering:** Compare current vs historical prices, calculate differences, handle free-to-paid edge cases, and filter alerts based on a configurable threshold.  
- **1.7 Alerting & Logging:** Send Slack notifications for alerts and update Google Sheets with new pricing data.  
- **1.8 Error Handling:** Discard erroneous or incomplete items gracefully to maintain workflow integrity.

---

### 2. Block-by-Block Analysis

---

#### 1.1 Initialization & Configuration

- **Overview:** This block triggers the workflow either manually or on a schedule and sets global alert parameters such as the alert threshold percentage.  
- **Nodes Involved:**  
  - Start Workflow (Manual Run)  
  - Schedule Trigger  
  - Config: Alert Parameters  
- **Node Details:**  
  - **Start Workflow (Manual Run):**  
    - Type: Manual Trigger  
    - Role: Allows ad-hoc initiation of the workflow for testing or immediate execution.  
    - Config: No parameters; manual activation only.  
    - Connections: Outputs to Config: Alert Parameters.  
    - Edge Cases: None specific; user-triggered.  
  - **Schedule Trigger:**  
    - Type: Schedule Trigger  
    - Role: Automates periodic execution of the workflow.  
    - Config: Runs on a default interval (not explicitly specified in JSON).  
    - Connections: Outputs to Config: Alert Parameters.  
    - Edge Cases: Missed triggers if n8n instance not running or downtime.  
  - **Config: Alert Parameters:**  
    - Type: Set node  
    - Role: Defines global variables, notably `alert_threshold_percent` set to 10%, controlling sensitivity of alerts.  
    - Config: Assigns alert_threshold_percent = 10 (number).  
    - Connections: Outputs to Sheets: Get Competitor List.  
    - Edge Cases: Misconfiguration could cause too many or too few alerts.

---

#### 1.2 Data Sourcing

- **Overview:** Retrieves the current list of competitor companies and their URLs from a Google Sheet which acts as the historical database and source for monitoring targets.  
- **Nodes Involved:**  
  - Sheets: Get Competitor List  
  - Loop Monitor Each Plan  
- **Node Details:**  
  - **Sheets: Get Competitor List:**  
    - Type: Google Sheets (Read Rows)  
    - Role: Reads all rows from a sheet named "competitors" containing columns: Name, URL, Old Plans, Last Plans, Updated At, row_number.  
    - Config: Uses credentials with OAuth2; document and sheet IDs hardcoded for the specific Google Sheet.  
    - Outputs: Each competitor row as an item.  
    - Edge Cases: Missing or corrupt sheet data, auth errors.  
  - **Loop Monitor Each Plan:**  
    - Type: SplitInBatches  
    - Role: Processes each competitor row one-by-one through the workflow.  
    - Config: Default split (likely 1 item per batch).  
    - Inputs: From Sheets: Get Competitor List.  
    - Outputs: To Decodo: Fetch Full HTML on second output (conditional).  
    - Edge Cases: Batch size misconfigurations; large datasets could cause performance issues.

---

#### 1.3 HTML Scraping & Cleaning

- **Overview:** Fetches fully rendered competitor pricing pages using Decodo, then cleans and extracts relevant pricing text by slicing out noise and boilerplate content.  
- **Nodes Involved:**  
  - Decodo: Fetch Full HTML  
  - Code: Filter HTML Noise  
- **Node Details:**  
  - **Decodo: Fetch Full HTML:**  
    - Type: Decodo node (3rd party scraping API)  
    - Role: Retrieves complete HTML content of competitor URL with JavaScript rendering enabled, enabling dynamic content extraction.  
    - Config: Uses competitor URL from current batch item (`{{$json.URL}}`), geo set to United States. Credentials for Decodo API required.  
    - Outputs: Raw HTML content in JSON format.  
    - Edge Cases: API errors, rate limits, invalid URLs, network failures.  
  - **Code: Filter HTML Noise:**  
    - Type: Code (JavaScript)  
    - Role: Cleans raw HTML by removing scripts, styles, headers, and all HTML tags. Converts to uppercase for case-insensitive processing. Slices text between universal keywords (e.g., PRODUCTS to FAQ) to isolate pricing section.  
    - Config: Runs once for all items; outputs cleaned text as `clean_pricing_text`. Status flag indicates success or failure based on length threshold.  
    - Inputs: Raw HTML from Decodo node.  
    - Outputs: Cleaned text for AI analysis.  
    - Edge Cases: Missing keywords causing incorrect slicing, too short content flagged as failure.

---

#### 1.4 AI Extraction & Structuring

- **Overview:** Uses Google Gemini (via LangChain LangModel) to analyze the cleaned pricing text and extract structured pricing plans as a rigid JSON array according to a predefined schema.  
- **Nodes Involved:**  
  - Google Gemini Chat Model  
  - AI Agent: Extract Plans  
  - Structured Output Parser  
- **Node Details:**  
  - **Google Gemini Chat Model:**  
    - Type: LangChain Google Gemini LM node  
    - Role: Provides AI language model backend for processing text input.  
    - Config: Uses Google PaLM API credentials. Default chat model config.  
    - Outputs: Passed to AI Agent.  
    - Edge Cases: API quotas, network failures, rate limits.  
  - **AI Agent: Extract Plans:**  
    - Type: LangChain Agent node with output parser  
    - Role: Processes cleaned pricing text to extract all pricing plans exhaustively, enforcing strict JSON output schema. Ignores irrelevant page content.  
    - Config: System message instructs exhaustive extraction of all plans, strict JSON output with fields: plan_name, price_usd, billing_cycle, key_feature_summary. Retries on failure up to 3 times.  
    - Inputs: Cleaned text.  
    - Outputs: Parsed JSON array of plans or empty array if none found.  
    - Edge Cases: Parsing errors, incomplete extraction, empty outputs.  
  - **Structured Output Parser:**  
    - Type: Output parser for LangChain  
    - Role: Validates and parses AI output into JSON according to schema example.  
    - Config: Schema example provided to enforce output structure.  
    - Edge Cases: Malformed AI output, parser failures.

---

#### 1.5 Validation & History Checking

- **Overview:** Validates AI extraction success and checks if historical price data exists for comparison or initial logging.  
- **Nodes Involved:**  
  - If: Price Parsed Successfully?  
  - If: History Exists?  
  - Discard Error Item  
- **Node Details:**  
  - **If: Price Parsed Successfully?:**  
    - Type: If Node (Condition check)  
    - Role: Checks if AI extraction returned an error field empty (successful parse).  
    - Config: Condition: `error` field is empty string.  
    - Outputs: True → History Exists check; False → Discard Error Item.  
    - Edge Cases: Unexpected AI errors, empty or malformed fields.  
  - **If: History Exists?:**  
    - Type: If Node (Condition check)  
    - Role: Checks if the competitor row has existing historical "Last Plans" data to decide comparison vs initial logging.  
    - Config: Condition: `Last Plans` field is not empty.  
    - Outputs: True → Price Diff & Filter Code; False → Update Sheet immediately with current data.  
    - Edge Cases: Corrupted or missing historical data.  
  - **Discard Error Item:**  
    - Type: NoOp  
    - Role: Silently discards items failing AI parsing to avoid workflow crashes.  
    - Config: None.  
    - Edge Cases: None (safe fallback).

---

#### 1.6 Price Comparison & Alert Filtering

- **Overview:** Compares current extracted plans against historical data, calculates percentage price changes, handles edge cases like free-to-paid transitions, and filters plans requiring alerts based on the threshold.  
- **Nodes Involved:**  
  - Code: Price Diff & Filter  
- **Node Details:**  
  - **Code: Price Diff & Filter:**  
    - Type: Code (JavaScript)  
    - Role: Parses historical JSON, compares each current plan to matching historical plan by name and billing cycle, calculates price difference percentage.  
    - Handles special cases:  
      - Free to Paid (forces alert with high diff).  
      - Paid to Free (assigns -100% diff alert).  
      - Standard increase/decrease.  
    - Assigns alert status if absolute diff exceeds `alert_threshold_percent` (10%).  
    - Outputs two arrays: `price_diffs` (all plans with computed diffs) and `alert_items` (filtered plans flagged for alert).  
    - Runs once for all items in batch.  
    - Edge Cases: JSON parse errors on historical data, missing matching plans, malformed prices.

---

#### 1.7 Alerting & Logging

- **Overview:** Sends Slack notifications for each alert-worthy pricing change and updates Google Sheets with latest pricing data to maintain state.  
- **Nodes Involved:**  
  - If: Alerts to Send?  
  - Split Alerts for Notification  
  - Send Competitor Price Alert  
  - Update row in sheet  
- **Node Details:**  
  - **If: Alerts to Send?:**  
    - Type: If Node  
    - Role: Checks if any alert items exist (length > 0) to decide notification sending.  
    - Outputs: True → Split Alerts; False → Update Sheet.  
    - Edge Cases: False negatives if alert_items array empty or undefined.  
  - **Split Alerts for Notification:**  
    - Type: SplitOut  
    - Role: Splits alert items array into individual items for separate Slack notifications.  
    - Config: Splits on `alert_items` field.  
    - Edge Cases: Empty arrays cause no outputs.  
  - **Send Competitor Price Alert:**  
    - Type: Slack node (Webhook)  
    - Role: Sends formatted alert message to a Slack channel named "competitors-monitoring" with details: company name, plan, price change %, old/new prices, and link.  
    - Config: Uses Slack OAuth2 credentials; Markdown enabled; mentions relevant fields from batch and alert item.  
    - Edge Cases: Slack API errors, rate limits, invalid channel.  
  - **Update row in sheet:**  
    - Type: Google Sheets (Update Row)  
    - Role: Updates the competitor's row with new "Old Plans" set to previous "Last Plans", "Last Plans" updated with current AI output, and "Updated At" timestamp.  
    - Config: Matches rows by `row_number`; uses OAuth2 credentials.  
    - Edge Cases: Sheet access errors, concurrent updates.

---

#### 1.8 Error Handling

- **Overview:** Ensures that any item failing AI parsing or missing historical data is gracefully handled without workflow failure.  
- **Nodes Involved:**  
  - Discard Error Item (NoOp)  
- **Node Details:**  
  - Silently drops problematic items to avoid propagation of errors downstream.

---

### 3. Summary Table

| Node Name                   | Node Type                        | Functional Role                                   | Input Node(s)                   | Output Node(s)                    | Sticky Note                                                                                                                   |
|-----------------------------|---------------------------------|-------------------------------------------------|---------------------------------|----------------------------------|------------------------------------------------------------------------------------------------------------------------------|
| Start Workflow (Manual Run) | Manual Trigger                  | Manual start trigger for workflow execution     | -                               | Config: Alert Parameters          |                                                                                                                              |
| Schedule Trigger             | Schedule Trigger                | Scheduled automatic workflow execution           | -                               | Config: Alert Parameters          |                                                                                                                              |
| Config: Alert Parameters     | Set                            | Define global alert threshold parameter          | Start Workflow, Schedule Trigger| Sheets: Get Competitor List       | ## Global Configuration This node centrally defines global parameters, including the **`alert_threshold_percent`**...         |
| Sheets: Get Competitor List  | Google Sheets                  | Retrieve competitor list and historic pricing    | Config: Alert Parameters         | Loop Monitor Each Plan            | ## Data Sourcing This node retrieves the **live list of competitor URLs** directly from your **Google Sheet**...               |
| Loop Monitor Each Plan       | SplitInBatches                 | Process each competitor individually              | Sheets: Get Competitor List      | Decodo: Fetch Full HTML           |                                                                                                                              |
| Decodo: Fetch Full HTML      | Decodo Scraper Node            | Fetch fully rendered competitor pricing page     | Loop Monitor Each Plan           | Code: Filter HTML Noise           | ## Full HTML Scraping & Filtering **Decodo** scrapes dynamic HTML (JSON). Code then slices the text using universal keywords...|
| Code: Filter HTML Noise      | Code Node (JS)                 | Clean and isolate pricing text from raw HTML     | Decodo: Fetch Full HTML          | AI Agent: Extract Plans           |                                                                                                                              |
| Google Gemini Chat Model     | LangChain LM Chat Model        | AI language model backend for text processing    | AI Agent: Extract Plans (ai_languageModel) | AI Agent: Extract Plans (ai_languageModel) |                                                                                                                              |
| AI Agent: Extract Plans      | LangChain Agent                | Extract structured pricing plans from text       | Code: Filter HTML Noise          | If: Price Parsed Successfully?    | ## AI Extraction & Structuring The AI acts as a **Data Analyst**, structuring cleaned text into a rigid **JSON Schema**...    |
| Structured Output Parser     | LangChain Output Parser        | Validate and parse AI output JSON                 | AI Agent: Extract Plans          | If: Price Parsed Successfully?    |                                                                                                                              |
| If: Price Parsed Successfully? | If Node                      | Check AI extraction success                        | AI Agent: Extract Plans          | If: History Exists?, Discard Error Item | ## Error Guard & History Check Final validation checks if the price is clean, and the history exists to decide...           |
| If: History Exists?          | If Node                        | Check if historical pricing data exists           | If: Price Parsed Successfully?  | Code: Price Diff & Filter, Update row in sheet |                                                                                                                              |
| Code: Price Diff & Filter    | Code Node (JS)                 | Compare current vs historical prices & filter alerts | If: History Exists?              | If: Alerts to Send?               | ## Comparison & Conditional Alerting **Code: Calculate Price Diff** finds changes, handles the **free-to-paid** case...        |
| If: Alerts to Send?          | If Node                        | Check if any alerts need to be sent                | Code: Price Diff & Filter        | Split Alerts for Notification, Update row in sheet |                                                                                                                              |
| Split Alerts for Notification| SplitOut                      | Split alert array into individual alert items     | If: Alerts to Send?              | Send Competitor Price Alert       |                                                                                                                              |
| Send Competitor Price Alert  | Slack                         | Send Slack notification for each alert            | Split Alerts for Notification    | Update row in sheet               | ## Final Logging & Alert Delivery Shifts historical price data, logs new prices, and sends urgent Slack alerts...             |
| Update row in sheet          | Google Sheets (Update Row)     | Update competitor row with new pricing data       | If: Alerts to Send?, If: History Exists?, Send Competitor Price Alert | Loop Monitor Each Plan |                                                                                                                              |
| Discard Error Item           | NoOp                          | Silently discard items failing AI parse or checks | If: Price Parsed Successfully?  | Loop Monitor Each Plan            |                                                                                                                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Nodes:**  
   - Add a **Manual Trigger** node named `Start Workflow (Manual Run)` for manual runs.  
   - Add a **Schedule Trigger** node named `Schedule Trigger` for periodic execution with your desired interval (e.g., daily).  

2. **Set Global Alert Parameters:**  
   - Add a **Set** node named `Config: Alert Parameters`.  
   - Define a number parameter: `alert_threshold_percent` with value `10`.  
   - Connect outputs of both triggers to this node.

3. **Retrieve Competitor List:**  
   - Add a **Google Sheets** node named `Sheets: Get Competitor List`.  
   - Configure credentials for your Google Sheets OAuth2 account.  
   - Set operation to "Read Rows".  
   - Specify the spreadsheet ID and sheet name or gid corresponding to your competitor data sheet.  
   - Ensure the sheet has columns: `Name`, `URL`, `Old Plans`, `Last Plans`, `Updated At`, `row_number`.  
   - Connect `Config: Alert Parameters` output to this node.

4. **Split Competitor Rows for Processing:**  
   - Add a **SplitInBatches** node named `Loop Monitor Each Plan`.  
   - Connect `Sheets: Get Competitor List` output to this node.  
   - Configure batch size as per your processing capacity (default 1 recommended).

5. **Fetch Full Pricing Page HTML:**  
   - Install and add a **Decodo** node named `Decodo: Fetch Full HTML`.  
   - Set credential for Decodo API.  
   - Configure to fetch URL from current item’s `URL` field.  
   - Set geo parameter (e.g., "United States").  
   - Connect `Loop Monitor Each Plan` output to this node.

6. **Clean and Isolate Pricing Text:**  
   - Add a **Code** node named `Code: Filter HTML Noise`.  
   - Paste the provided JavaScript code that removes scripts, styles, headers, strips tags, converts to uppercase, and slices between universal markers to isolate pricing content.  
   - Set to run once for all items.  
   - Connect output of `Decodo: Fetch Full HTML` to this node.

7. **Configure AI Extraction:**  
   - Install and add **LangChain Google Gemini Chat Model** node named `Google Gemini Chat Model`.  
   - Provide Google PaLM API credentials.  
   - Connect this node to the AI Agent node.

8. **Add AI Agent Node for Plan Extraction:**  
   - Add a **LangChain Agent** node named `AI Agent: Extract Plans`.  
   - Configure with system prompt instructing exhaustive extraction of all pricing plans from cleaned text.  
   - Set prompt to pass `clean_pricing_text` from previous node.  
   - Set output parser to strict JSON schema with fields: `plan_name`, `price_usd`, `billing_cycle`, `key_feature_summary`.  
   - Enable retry on failure (max 3 tries).  
   - Connect cleaned text from `Code: Filter HTML Noise` as input.  
   - Connect AI language model and output parser nodes accordingly.

9. **Validate AI Output and Check History:**  
   - Add an **If** node named `If: Price Parsed Successfully?`.  
   - Condition: Check if `error` field is empty (success).  
   - True branch: Connect to `If: History Exists?`.  
   - False branch: Connect to a **NoOp** node named `Discard Error Item`.

10. **Check Historical Pricing Presence:**  
    - Add an **If** node named `If: History Exists?`.  
    - Condition: Check if `Last Plans` field in current batch item is not empty.  
    - True branch: Connect to `Code: Price Diff & Filter`.  
    - False branch: Connect to `Update row in sheet` node (to log initial data).

11. **Compare Prices and Filter Alerts:**  
    - Add a **Code** node named `Code: Price Diff & Filter`.  
    - Paste provided JavaScript code that parses historical data, calculates price differences including edge cases (free-to-paid, paid-to-free), and filters alerts based on threshold.  
    - Set to run once for all items.  
    - Connect `If: History Exists?` true output to this node.

12. **Check if Alerts Need to be Sent:**  
    - Add an **If** node named `If: Alerts to Send?`.  
    - Condition: `alert_items.length > 0`.  
    - True branch: Connect to `Split Alerts for Notification`.  
    - False branch: Connect to `Update row in sheet`.

13. **Split Individual Alerts:**  
    - Add a **SplitOut** node named `Split Alerts for Notification`.  
    - Configure to split on `alert_items` array.  
    - Connect `If: Alerts to Send?` true output to this node.

14. **Send Slack Alert Notifications:**  
    - Add a **Slack** node named `Send Competitor Price Alert`.  
    - Configure Slack OAuth2 credentials.  
    - Set channel to your alerts channel (e.g., "competitors-monitoring").  
    - Compose message with markdown including competitor name, plan details, price change %, and URL.  
    - Connect `Split Alerts for Notification` output to this node.

15. **Update Google Sheet with Latest Data:**  
    - Add a **Google Sheets** node named `Update row in sheet`.  
    - Operation: Update Row.  
    - Configure to update competitor row by `row_number`.  
    - Update columns:  
      - `Old Plans` ← previous `Last Plans` value  
      - `Last Plans` ← current AI extracted plans JSON  
      - `Updated At` ← current timestamp  
    - Connect outputs from:  
      - `If: Alerts to Send?` false branch  
      - `If: History Exists?` false branch  
      - `Send Competitor Price Alert` (to ensure logging after alerts)  
    - Connect output to `Loop Monitor Each Plan` to continue batch processing.

---

### 5. General Notes & Resources

| Note Content                                                                                                          | Context or Link                                                                                      |
|-----------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| AI-Powered Price Watchdog automates competitor pricing monitoring using Decodo scraping and Google Gemini AI parsing. | Project overview and purpose explanation (see Sticky Note at workflow start).                       |
| Decodo node fetches fully rendered HTML including JavaScript content, crucial for dynamic pricing pages.              | Decodo Node installation required: https://visit.decodo.com                                         |
| Google Gemini (PaLM) API provides advanced language understanding for structured data extraction from free text.     | Requires Google PaLM API credentials.                                                              |
| Slack integration sends real-time alerts to a dedicated channel on significant pricing changes detected.             | Slack OAuth2 credentials and channel configuration required.                                       |
| Google Sheets stores historical pricing data, enabling comparison and state management across runs.                   | Sheet columns: Name, URL, Old Plans, Last Plans, Updated At, row_number.                            |
| Pricing extraction AI is instructed to output a strict JSON array with fields: plan_name, price_usd, billing_cycle, key_feature_summary. | Ensures consistent structured data for downstream processing.                                     |
| Special price change cases handled: Free-to-Paid and Paid-to-Free transitions trigger forced alerts.                  | Prevents missing critical pricing shifts due to division by zero or zero price values.             |
| Alert threshold set globally in one node for easy adjustment of system sensitivity.                                   | Default is 10%, but can be adjusted as needed.                                                    |
| The workflow includes robust error handling to discard malformed AI outputs and avoid false alerts or failures.      | Maintains workflow stability and data integrity.                                                  |
| Exclusive 80% discount for Decodo API accessible via coupon code `ATTAN8N`.                                           | https://visit.decodo.com/c/6679292/3071239/17480                                                  |

---

**Disclaimer:** The text and workflow content provided are exclusively derived from an automated n8n workflow and comply fully with content policies. All data handled is legal and public. No illegal, offensive, or protected material is included.

---