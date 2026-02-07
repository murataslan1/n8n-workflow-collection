Automate Security Alert Triage with NixGuard AI and Route to Slack or Jira

https://n8nworkflows.xyz/workflows/automate-security-alert-triage-with-nixguard-ai-and-route-to-slack-or-jira-5896


# Automate Security Alert Triage with NixGuard AI and Route to Slack or Jira

### 1. Workflow Overview

This workflow automates the triage of security alerts using NixGuard’s AI and routes prioritized alerts to Slack channels accordingly. Its primary purpose is to reduce alert fatigue by automatically analyzing and categorizing security events collected over the past 24 hours, summarizing the risk, and delivering relevant notifications based on priority.

**Target Use Case:**  
Security Operations Center (SOC) teams or IT security analysts who need an automated process to analyze, prioritize, and distribute security alerts daily, focusing on critical incidents while filtering out noise.

**Logical Blocks:**

- **1.1 Scheduled Trigger & Data Retrieval:** Automates the daily execution and fetches raw security alerts from a sub-workflow integrating NixGuard RAG and Wazuh.
- **1.2 Alert Parsing & Filtering:** Cleans and parses the raw AI output, filters for important alerts, and prepares data for AI summarization.
- **1.3 AI Summarization & Priority Extraction:** Sends filtered alerts to AI for summary and prioritization, parses AI JSON responses.
- **1.4 Notification Routing:** Routes alerts to Slack channels based on AI-assigned priority.
- **1.5 Supportive Configuration & Documentation:** Sticky notes provide usage guidance and workflow overview.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Trigger & Data Retrieval

- **Overview:**  
  This block runs the workflow daily at 8 AM, sets up an initial prompt and API key, then invokes a sub-workflow to fetch real-time security events from NixGuard RAG and Wazuh integration.

- **Nodes Involved:**  
  - Run Daily at 8 AM (Schedule Trigger)  
  - Set API Key & Initial Prompt (Set)  
  - Execute: Get Daily Events as JSON (Execute Workflow)  
  - Parse Alert Array (Code)  
  - If (If)

- **Node Details:**

  - **Run Daily at 8 AM**  
    - Type: Schedule Trigger  
    - Role: Automatically triggers the workflow every hour (configured as interval of hours; likely meant to be daily at 8 AM)  
    - Configuration: Interval set to every hour (actual intended daily run at 8 AM may require cron or time-based trigger adjustment)  
    - Input: None  
    - Output: Triggers next node (Set API Key & Initial Prompt)  
    - Potential failures: Misconfigured schedule causing wrong run frequency

  - **Set API Key & Initial Prompt**  
    - Type: Set  
    - Role: Prepares the initial prompt for AI and stores the NixGuard API key  
    - Configuration:  
      - `apiKey` set to empty string (requires user input)  
      - `chatInput` with instructions requesting a minified JSON array of significant security alerts  
    - Input: Trigger from schedule node  
    - Output: Passed to Execute Workflow node  
    - Edge cases: Missing API key disables AI calls

  - **Execute: Get Daily Events as JSON (NixGuard RAG and Wazuh Integration)**  
    - Type: Execute Workflow  
    - Role: Calls an external workflow to fetch security alerts from NixGuard and Wazuh  
    - Configuration: Workflow ID linked to "Get Real-Time Security Insights with NixGuard RAG and Wazuh Integration"  
    - Input: Receives parameters from Set API Key & Initial Prompt  
    - Output: Raw AI output string with alerts  
    - Failure modes: Sub-workflow failure, API limit exceeded, no data returned

  - **Parse Alert Array**  
    - Type: Code  
    - Role: Cleans AI output by extracting JSON from Markdown code fences and parses it into an alert array  
    - Key Expression: Uses regex to extract JSON inside ```json ... ``` blocks, fallbacks to raw string  
    - Input: Raw AI output from previous node  
    - Output: Parsed alerts array or empty if invalid  
    - Edge cases: Malformed JSON, empty arrays, AI output format changes

  - **If**  
    - Type: If  
    - Role: Checks if the alerts array exists and contains items  
    - Configuration: Condition checks if `alerts` array exists and is non-empty  
    - Input: Output of Parse Alert Array  
    - Output: Routes to next block if true; ends if false  
    - Failure modes: Empty or invalid alerts skip downstream processing

---

#### 1.2 Alert Parsing & Filtering

- **Overview:**  
  Processes the alert array to split into individual alert items, filters for alerts with severity level ≥ 7, aggregates filtered alerts for AI summarization.

- **Nodes Involved:**  
  - Edit Fields (Set)  
  - Parse & Split Alerts (Code)  
  - Filter for Important Alerts (Level > 7) (If)  
  - Aggregate (Aggregate)  
  - Set Prompt for Summary (Set)

- **Node Details:**

  - **Edit Fields**  
    - Type: Set  
    - Role: Restructures the JSON to assign `alerts` array to a new field named `output`  
    - Configuration: Assign `output` = `alerts` array from previous node, exclude other fields  
    - Input: If node’s true branch output  
    - Output: JSON with `output` field containing alerts  
    - Edge cases: Missing alerts field would cause empty output

  - **Parse & Split Alerts**  
    - Type: Code  
    - Role: Splits the array of alerts into individual execution items for parallel processing  
    - Key Expression: Maps each alert object to a separate n8n item  
    - Input: JSON with `output` array of alerts  
    - Output: Multiple items, each with one alert JSON  
    - Edge cases: Empty array returns no items; malformed data causes errors

  - **Filter for Important Alerts (Level > 7)**  
    - Type: If  
    - Role: Filters alerts where severity `level` field is ≥ 7 (high importance)  
    - Configuration: Number condition comparing `level` field to 7  
    - Input: Individual alert items  
    - Output: Passes only important alerts downstream  
    - Edge cases: Missing or non-numeric `level` field causes false negatives

  - **Aggregate**  
    - Type: Aggregate  
    - Role: Combines filtered alerts back into a single array under field `output`  
    - Configuration: Aggregate all item data into one array  
    - Input: Filtered alerts from If node  
    - Output: JSON with `output` array of important alerts  
    - Edge cases: No input items results in empty aggregation

  - **Set Prompt for Summary**  
    - Type: Set  
    - Role: Sets the prompt for AI to produce a summarized JSON object describing the alerts’ overall risk and recommendations  
    - Configuration:  
      - `chatInput` with instructions to act as senior security analyst and produce structured JSON summary  
      - Includes raw alert data injected dynamically  
    - Input: Aggregated important alerts  
    - Output: Prompt and API key setup for next AI call  
    - Edge cases: Empty alerts data may produce empty or irrelevant AI output

---

#### 1.3 AI Summarization & Priority Extraction

- **Overview:**  
  Executes an AI workflow to generate a summarized security report, parses the AI’s JSON response, extracts priority and summary fields.

- **Nodes Involved:**  
  - Execute: Generate Slack Message (Execute Workflow)  
  - Parse AI JSON Response (Code)  
  - Extract AI Priority & Summary (Set)  
  - Switch

- **Node Details:**

  - **Execute: Generate Slack Message (Get Real-Time Security Insights with NixGuard RAG and Wazuh Integration)**  
    - Type: Execute Workflow  
    - Role: Invokes a sub-workflow that sends the summary prompt to AI and formats the Slack message  
    - Configuration: Uses same NixGuard RAG sub-workflow as before  
    - Input: Prompt from Set Prompt for Summary  
    - Output: Raw AI JSON summary string under `output` field  
    - Edge cases: Sub-workflow failures, invalid AI responses

  - **Parse AI JSON Response**  
    - Type: Code  
    - Role: Parses AI output JSON string into individual fields merged with existing data  
    - Key Expression: JSON.parse on `rawOutput` string from previous node  
    - Input: AI raw JSON string  
    - Output: JSON enriched with fields: `ai_priority`, `ai_summary`, `total_critical_alerts`, `key_observations`, `recommendation`  
    - Edge cases: Malformed JSON causes parsing failure and workflow termination

  - **Extract AI Priority & Summary**  
    - Type: Set  
    - Role: Extracts `ai_priority` and `ai_summary` fields for routing logic  
    - Configuration: Copies `ai_priority` and `ai_summary` from parsed JSON  
    - Input: Parsed AI JSON  
    - Output: Used for routing in Switch node  
    - Edge cases: Missing fields cause routing to default branch

  - **Switch**  
    - Type: Switch  
    - Role: Routes flow based on `ai_priority` value (Critical, High, Info, Low)  
    - Configuration: String equality comparisons on `ai_priority` field  
    - Input: Extract AI Priority & Summary output  
    - Output: Routes to appropriate Slack notification nodes accordingly  
    - Edge cases: Unknown or missing priority falls to default (no output) branch

---

#### 1.4 Notification Routing

- **Overview:**  
  Posts alerts to Slack channels based on AI priority. Slack nodes are currently disabled but configured for critical, high, and informational alerts.

- **Nodes Involved:**  
  - Post CRITICAL Alert to Slack (Slack)  
  - Post HIGH Alert to Slack (Slack)  
  - Post INFO Alert to Slack (Slack)

- **Node Details:**

  - **Post CRITICAL Alert to Slack**  
    - Type: Slack  
    - Role: Sends critical alert messages to a Slack channel via webhook  
    - Configuration: Uses Slack webhook ID; node is disabled by default  
    - Input: Switch node’s "Critical" branch  
    - Output: Sends message to Slack  
    - Edge cases: Slack webhook misconfiguration, network errors

  - **Post HIGH Alert to Slack**  
    - Type: Slack  
    - Role: Sends high priority alert messages to Slack  
    - Configuration: Same webhook as above; disabled by default  
    - Input: Switch node’s "High" branch  
    - Output: Slack message post  
    - Edge cases: Same as above

  - **Post INFO Alert to Slack**  
    - Type: Slack  
    - Role: Sends informational alert messages to Slack  
    - Configuration: Disabled by default  
    - Input: Switch node’s "Info" branch  
    - Output: Slack message post  
    - Edge cases: Same as above

---

#### 1.5 Supportive Configuration & Documentation

- **Overview:**  
  Provides workflow documentation and setup guidance via sticky notes for users.

- **Nodes Involved:**  
  - Workflow Overview (Sticky Note)  
  - Setup Guide1 (Sticky Note)

- **Node Details:**

  - **Workflow Overview**  
    - Type: Sticky Note  
    - Role: Summarizes the workflow’s purpose and use case for users  
    - Content: Explains use of NixGuard AI to reduce alert fatigue and route alerts by priority

  - **Setup Guide1**  
    - Type: Sticky Note  
    - Role: Provides prerequisites and setup instructions  
    - Content:  
      - Requires valid NixGuard API key  
      - Setup trigger method and test with sample queries  
      - Notes on installing NixGuard agents for real-time data  
      - Support links:  
        - [NixGuard Documentation](https://nixguard.thenex.world)  
        - [Community Discord](https://discord.com/invite/ajCYwYCwHb)

---

### 3. Summary Table

| Node Name                                                     | Node Type          | Functional Role                         | Input Node(s)                                | Output Node(s)                                   | Sticky Note                                                                                                                                                               |
|---------------------------------------------------------------|--------------------|---------------------------------------|----------------------------------------------|-------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Run Daily at 8 AM                                             | Schedule Trigger   | Triggers workflow daily/hourly        | None                                         | Set API Key & Initial Prompt                     |                                                                                                                                                                          |
| Set API Key & Initial Prompt                                  | Set                | Prepares prompt and API key input     | Run Daily at 8 AM                            | Execute: Get Daily Events as JSON                 |                                                                                                                                                                          |
| Execute: Get Daily Events as JSON (NixGuard RAG and Wazuh)   | Execute Workflow   | Retrieves raw security alerts          | Set API Key & Initial Prompt                  | Parse Alert Array                                 |                                                                                                                                                                          |
| Parse Alert Array                                             | Code               | Extracts and parses AI JSON alert array| Execute: Get Daily Events as JSON             | If                                               |                                                                                                                                                                          |
| If                                                           | If                 | Checks if alert array exists           | Parse Alert Array                            | Edit Fields                                      |                                                                                                                                                                          |
| Edit Fields                                                  | Set                | Sets alerts array to field "output"   | If                                           | Parse & Split Alerts                             |                                                                                                                                                                          |
| Parse & Split Alerts                                         | Code               | Splits alert array into individual alerts | Edit Fields                                | Filter for Important Alerts (Level > 7)          |                                                                                                                                                                          |
| Filter for Important Alerts (Level > 7)                      | If                 | Filters high severity alerts (≥ level 7)| Parse & Split Alerts                         | Aggregate                                        |                                                                                                                                                                          |
| Aggregate                                                   | Aggregate          | Aggregates filtered alerts into array | Filter for Important Alerts (Level > 7)    | Set Prompt for Summary                           |                                                                                                                                                                          |
| Set Prompt for Summary                                      | Set                | Sets AI prompt for summary generation | Aggregate                                     | Execute: Generate Slack Message                   |                                                                                                                                                                          |
| Execute: Generate Slack Message (NixGuard RAG and Wazuh)     | Execute Workflow   | Runs AI to generate summarized report | Set Prompt for Summary                        | Parse AI JSON Response                           |                                                                                                                                                                          |
| Parse AI JSON Response                                     | Code               | Parses AI JSON response into fields    | Execute: Generate Slack Message               | Extract AI Priority & Summary                     |                                                                                                                                                                          |
| Extract AI Priority & Summary                              | Set                | Extracts AI priority and summary fields| Parse AI JSON Response                        | Switch                                          |                                                                                                                                                                          |
| Switch                                                     | Switch             | Routes alerts based on AI priority     | Extract AI Priority & Summary                 | Post CRITICAL Alert to Slack, Post HIGH Alert to Slack, Post INFO Alert to Slack |                                                                                                                                                                          |
| Post CRITICAL Alert to Slack                               | Slack              | Sends critical alerts to Slack channel | Switch (Critical branch)                      | None                                            | Disabled by default                                                                                                                                                        |
| Post HIGH Alert to Slack                                   | Slack              | Sends high priority alerts to Slack    | Switch (High branch)                          | None                                            | Disabled by default                                                                                                                                                        |
| Post INFO Alert to Slack                                   | Slack              | Sends informational alerts to Slack    | Switch (Info branch)                          | None                                            | Disabled by default                                                                                                                                                        |
| Workflow Overview                                         | Sticky Note        | Describes workflow purpose and use case| None                                         | None                                            | "This workflow acts as an automated SOC analyst. It receives security alerts from & uses NixGuard's AI to analyze and prioritize them, and then routes them to Slack."    |
| Setup Guide1                                             | Sticky Note        | Provides setup instructions and links | None                                         | None                                            | "Prerequisites: Valid NixGuard API key. Setup instructions and support links: [NixGuard Documentation](https://nixguard.thenex.world), [Community Discord](https://discord.com/invite/ajCYwYCwHb)" |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger Node**  
   - Name: `Run Daily at 8 AM`  
   - Type: Schedule Trigger  
   - Configure to run daily at 8 AM using cron or interval (adjust to daily if needed)

2. **Add a Set Node for Initial Prompt and API Key**  
   - Name: `Set API Key & Initial Prompt`  
   - Type: Set  
   - Add string fields:  
     - `apiKey`: (enter your NixGuard API key)  
     - `chatInput`: "Review all security data from the last 24 hours. List all significant security alerts found. Your response MUST be a single, valid, minified JSON array of objects. Each object in the array should represent a distinct alert. If no significant alerts are found, return an empty array []."  
   - Connect `Run Daily at 8 AM` → `Set API Key & Initial Prompt`

3. **Add an Execute Workflow Node to Fetch Alerts**  
   - Name: `Execute: Get Daily Events as JSON (Get Real-Time Security Insights with NixGuard RAG and Wazuh Integration)`  
   - Type: Execute Workflow  
   - Select or enter the workflow ID for the NixGuard RAG and Wazuh integration workflow  
   - Connect `Set API Key & Initial Prompt` → `Execute: Get Daily Events as JSON`

4. **Add a Code Node to Parse AI JSON Alert Array**  
   - Name: `Parse Alert Array`  
   - Type: Code  
   - Paste JavaScript code to extract JSON inside Markdown fences and parse it into an alert array  
   - Connect `Execute: Get Daily Events as JSON` → `Parse Alert Array`

5. **Add an If Node to Check for Alerts**  
   - Name: `If`  
   - Type: If  
   - Condition: Check if `alerts` array exists and is non-empty (`exists` operation on `{{$json.alerts}}`)  
   - Connect `Parse Alert Array` → `If`

6. **Add a Set Node to Re-assign Alerts to 'output' Field**  
   - Name: `Edit Fields`  
   - Type: Set  
   - Assign `output` = `{{$json.alerts}}`  
   - Include no other fields  
   - Connect `If` true branch → `Edit Fields`

7. **Add a Code Node to Split Alerts**  
   - Name: `Parse & Split Alerts`  
   - Type: Code  
   - Code: Map the `output` array to individual items  
   - Connect `Edit Fields` → `Parse & Split Alerts`

8. **Add an If Node to Filter Alerts with Level ≥ 7**  
   - Name: `Filter for Important Alerts (Level > 7)`  
   - Type: If  
   - Condition: Numeric `{{$json.level}}` ≥ 7  
   - Connect `Parse & Split Alerts` → `Filter for Important Alerts (Level > 7)`

9. **Add an Aggregate Node to Re-aggregate Filtered Alerts**  
   - Name: `Aggregate`  
   - Type: Aggregate  
   - Aggregate all items into field `output`  
   - Connect `Filter for Important Alerts (Level > 7)` true branch → `Aggregate`

10. **Add a Set Node to Prepare AI Summary Prompt**  
    - Name: `Set Prompt for Summary`  
    - Type: Set  
    - Create string field `chatInput` containing detailed instructions for AI to summarize alerts as a JSON object (include placeholders for injected alert data `{{ JSON.stringify($json) }}`)  
    - Connect `Aggregate` → `Set Prompt for Summary`

11. **Add an Execute Workflow Node to Generate AI Summary**  
    - Name: `Execute: Generate Slack Message (Get Real-Time Security Insights with NixGuard RAG and Wazuh Integration)`  
    - Type: Execute Workflow  
    - Use the same sub-workflow as for fetching alerts (configured for AI summarization)  
    - Connect `Set Prompt for Summary` → `Execute: Generate Slack Message`

12. **Add a Code Node to Parse AI JSON Response**  
    - Name: `Parse AI JSON Response`  
    - Type: Code  
    - Code: Parse JSON string from AI output field `output` into discrete fields  
    - Connect `Execute: Generate Slack Message` → `Parse AI JSON Response`

13. **Add a Set Node to Extract AI Priority and Summary**  
    - Name: `Extract AI Priority & Summary`  
    - Type: Set  
    - Extract `ai_priority` and `ai_summary` fields  
    - Connect `Parse AI JSON Response` → `Extract AI Priority & Summary`

14. **Add a Switch Node to Route by AI Priority**  
    - Name: `Switch`  
    - Type: Switch  
    - Add string rules matching `ai_priority` values: "Critical", "High", "Info", "Low"  
    - Connect `Extract AI Priority & Summary` → `Switch`

15. **Add Slack Nodes for Notification (Optional, Disabled by Default)**  
    - Names:  
      - `Post CRITICAL Alert to Slack`  
      - `Post HIGH Alert to Slack`  
      - `Post INFO Alert to Slack`  
    - Type: Slack  
    - Configure Slack webhook URLs appropriate for each alert priority channel  
    - Connect Switch branches to respective Slack nodes:  
      - Critical → Post CRITICAL Alert to Slack  
      - High → Post HIGH Alert to Slack  
      - Info → Post INFO Alert to Slack

16. **Add Sticky Notes for Documentation**  
    - Workflow Overview Sticky Note: Summarizes workflow purpose and use case  
    - Setup Guide Sticky Note: Provides prerequisites, setup instructions, and support links

---

### 5. General Notes & Resources

| Note Content                                                                                                                       | Context or Link                                                                                  |
|------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Workflow acts as an automated SOC analyst, using NixGuard AI to analyze and prioritize alerts, reducing alert fatigue.            | Workflow Overview sticky note                                                                   |
| Prerequisites: Valid NixGuard API key; install NixGuard agents on endpoints for real-time events.                                  | Setup Guide sticky note                                                                         |
| Setup instructions and support links: [NixGuard Documentation](https://nixguard.thenex.world), [Community Discord](https://discord.com/invite/ajCYwYCwHb) | Setup Guide sticky note                                                                         |

---

**Disclaimer:** The provided text originates solely from an automated workflow created with n8n, an integration and automation tool. This processing complies strictly with applicable content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.