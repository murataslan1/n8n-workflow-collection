Automate Free IP Analysis: NixGuard AI Summaries & Wazuh Integration

https://n8nworkflows.xyz/workflows/automate-free-ip-analysis--nixguard-ai-summaries---wazuh-integration-5928


# Automate Free IP Analysis: NixGuard AI Summaries & Wazuh Integration

### 1. Workflow Overview

This workflow, titled **"Automate Free IP Analysis: NixGuard AI Summaries & Wazuh Integration"**, functions as a dispatcher or orchestrator that triggers a more complex, dedicated security analysis workflow. Its main purpose is to provide input parameters (such as an IP address and API key) and initiate the analysis using the external workflow called **"Get Real-Time Security Insights with NixGuard RAG and Wazuh Integration"**. The output from this external workflow is then formatted and optionally sent as an alert via Slack.

The workflow logically divides into the following blocks:

- **1.1 Input Preparation and Trigger**: Nodes that set up the API key, input prompt, and start the main analysis workflow.
- **1.2 AI & Wazuh Analysis Execution**: Invocation of the external analysis workflow and reception of its output.
- **1.3 Result Formatting and Optional Alerting**: Formatting the AI summary and Wazuh insights for readability and optionally sending alerts.
- **1.4 Instructional and Next Steps Notes**: Sticky notes guiding setup and suggesting further automation enhancements.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Preparation and Trigger

**Overview:**  
This block prepares the necessary inputs, including the API key and IP address for analysis, and triggers the main security analysis workflow.

**Nodes Involved:**  
- Set API Key & Initial Prompt1  
- Webhook Trigger (REAL-WORLD USE)1 (disabled)  

**Node Details:**

- **Set API Key & Initial Prompt1**  
  - *Type:* Set node  
  - *Role:* Initializes the input parameters, specifically setting an `apiKey` (empty by default for user to fill) and a `chatInput` string containing an IP address to scan.  
  - *Configuration:*  
    - `apiKey`: empty string placeholder to be replaced by user  
    - `chatInput`: "Scan this ip for me 192.227.217.219" (example input)  
  - *Inputs:* None (starting node)  
  - *Outputs:* Connected to "Execute NixGuard & Wazuh Workflow"  
  - *Edge Cases:* Missing or invalid API key will cause failures downstream; static IP in prompt limits reusability without modification.  
  - *Version:* n8n v2 (Set node v2)  
  - *Sub-workflow:* None  

- **Webhook Trigger (REAL-WORLD USE)1**  
  - *Type:* Webhook node  
  - *Role:* Intended to receive real-time external triggers to start the workflow dynamically with live inputs. Currently disabled.  
  - *Configuration:*  
    - Path: "my-analysis-webhook"  
    - Active: false  
  - *Inputs:* External HTTP requests, none internally  
  - *Outputs:* None connected currently  
  - *Edge Cases:* Disabled, so no active use; when enabled, must validate incoming data formats and secure endpoint.  
  - *Version:* n8n v1  

---

#### 2.2 AI & Wazuh Analysis Execution

**Overview:**  
This block executes the external, main security analysis workflow that performs detailed IP analysis using NixGuard AI and Wazuh integration.

**Nodes Involved:**  
- Execute NixGuard & Wazuh Workflow  

**Node Details:**

- **Execute NixGuard & Wazuh Workflow**  
  - *Type:* Execute Workflow node  
  - *Role:* Calls the external workflow titled "Get Real-Time Security Insights with NixGuard RAG and Wazuh Integration" and passes through inputs (including API key and chat prompt).  
  - *Configuration:*  
    - Workflow selection by ID, linked to the main analysis workflow  
    - Input mapping mode: passThrough (inputs forwarded as-is)  
  - *Inputs:* Connected from "Set API Key & Initial Prompt1"  
  - *Outputs:* Connected to "Format NixGuard AI Summary & Wazuh Insights"  
  - *Edge Cases:*  
    - Workflow ID must be valid and accessible in the n8n instance  
    - Errors in the called workflow propagate here (e.g., API failures, data parsing errors)  
  - *Version:* Supports Execute Workflow v1.2  
  - *Sub-workflow:* Yes — calls the main analysis workflow  

---

#### 2.3 Result Formatting and Optional Alerting

**Overview:**  
This block formats the output from the analysis into a structured summary and optionally sends alerts via Slack for high-risk events.

**Nodes Involved:**  
- Format NixGuard AI Summary & Wazuh Insights  
- (Optional) Send Slack Alert for High-Risk Events (disabled)  

**Node Details:**

- **Format NixGuard AI Summary & Wazuh Insights**  
  - *Type:* Set node  
  - *Role:* Formats the output JSON from the executed workflow into a single string field named `ai_summary` for easy consumption.  
  - *Configuration:*  
    - Sets `"ai_summary"` to the value of the `output` field from the previous node's JSON  
  - *Inputs:* From "Execute NixGuard & Wazuh Workflow"  
  - *Outputs:* To "(Optional) Send Slack Alert for High-Risk Events"  
  - *Edge Cases:* If `output` field is missing or malformed, expression will fail or produce empty results.  
  - *Version:* Set node v2  

- **(Optional) Send Slack Alert for High-Risk Events**  
  - *Type:* Slack node  
  - *Role:* Sends a formatted Slack message containing the AI summary to a configured Slack channel.  
  - *Configuration:*  
    - Text message includes alert emoji and the AI summary content  
    - Authentication via OAuth2 (configured webhookId)  
    - Node is disabled by default to prevent accidental alerts  
  - *Inputs:* From "Format NixGuard AI Summary & Wazuh Insights"  
  - *Outputs:* None (end node)  
  - *Edge Cases:*  
    - Slack OAuth2 credentials must be valid and have write permissions  
    - Disabled by default; activation requires user action  
    - Network or API rate limits may cause failures  
  - *Version:* Slack node v2  

---

#### 2.4 Instructional and Next Steps Notes

**Overview:**  
These sticky notes provide critical setup instructions and suggestions for expanding the workflow into a full SOC/IR automation pipeline.

**Nodes Involved:**  
- Setup Instructions  
- Workflow Overview  
- Next Steps: Automate Response  

**Node Details:**

- **Setup Instructions**  
  - *Type:* StickyNote  
  - *Role:* Critical user guide for initial configuration steps.  
  - *Contents:*  
    - Guide to input API key in the "Set API Key & Initial Prompt" node  
    - Instruction to connect the main analysis workflow in the "Execute NixGuard & Wazuh Workflow" node  
    - Link to obtain the main workflow if not present:  
      https://n8n.io/workflows/4693-get-real-time-security-insights-with-nixguard-rag-and-wazuh-integration/  
  - *Position:* Top-left area for visibility  

- **Workflow Overview**  
  - *Type:* StickyNote  
  - *Role:* Describes the purpose of the dispatcher workflow and why this pattern is beneficial.  
  - *Contents:*  
    - Explanation of this workflow as a trigger/dispatcher  
    - Benefits such as reusability, separation of concerns  
    - Link to learn more about NixGuard: https://nixguard.thenex.world  

- **Next Steps: Automate Response**  
  - *Type:* StickyNote  
  - *Role:* Provides guidance for further automation post-analysis.  
  - *Contents:*  
    - Enables Slack node for immediate alerting  
    - Suggestions for creating Jira tickets for incidents  
    - Logging analysis results to Google Sheets or databases  
    - Triggering firewall or remediation workflows  
  - *Position:* Near output nodes for visibility  

---

### 3. Summary Table

| Node Name                                | Node Type             | Functional Role                        | Input Node(s)                    | Output Node(s)                          | Sticky Note                                                                                                                                                                                  |
|-----------------------------------------|-----------------------|-------------------------------------|---------------------------------|----------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Set API Key & Initial Prompt1            | Set                   | Initialize API key and input prompt | None                            | Execute NixGuard & Wazuh Workflow      |                                                                                                                                                                                              |
| Execute NixGuard & Wazuh Workflow        | Execute Workflow      | Call main analysis workflow          | Set API Key & Initial Prompt1   | Format NixGuard AI Summary & Wazuh Insights |                                                                                                                                                                                              |
| Format NixGuard AI Summary & Wazuh Insights | Set                   | Format AI summary output              | Execute NixGuard & Wazuh Workflow | (Optional) Send Slack Alert for High-Risk Events |                                                                                                                                                                                              |
| (Optional) Send Slack Alert for High-Risk Events | Slack                 | Send alert to Slack                   | Format NixGuard AI Summary & Wazuh Insights | None                                   |                                                                                                                                                                                              |
| Webhook Trigger (REAL-WORLD USE)1         | Webhook                | (Disabled) External trigger          | None                            | None                                   |                                                                                                                                                                                              |
| Setup Instructions                        | StickyNote            | Workflow setup guidance               | None                            | None                                   | This template requires two actions: input your API key in the `Set API Key & Initial Prompt` node, and connect the main workflow in the `Execute NixGuard & Wazuh Workflow` node. See link: https://n8n.io/workflows/4693-get-real-time-security-insights-with-nixguard-rag-and-wazuh-integration/ |
| Workflow Overview                        | StickyNote            | Explains dispatcher workflow purpose | None                            | None                                   | This workflow acts as a **Dispatcher** for triggering the main NixGuard & Wazuh analysis workflow. Learn more about NixGuard: https://nixguard.thenex.world                                        |
| Next Steps: Automate Response             | StickyNote            | Suggestions for further automation   | None                            | None                                   | Enable Slack alerts, create Jira tickets, log to Sheets or DB, or trigger remediation workflows to automate your SOC/IR process.                                                               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow in n8n.**

2. **Add a Set node named "Set API Key & Initial Prompt1":**  
   - Add two string fields:  
     - `apiKey`: leave empty (user to fill with NixGuard API key)  
     - `chatInput`: set default to `"Scan this ip for me 192.227.217.219"` (example IP)  

3. **Add an Execute Workflow node named "Execute NixGuard & Wazuh Workflow":**  
   - Configure it to trigger the external workflow "Get Real-Time Security Insights with NixGuard RAG and Wazuh Integration" (select by workflow ID or name).  
   - Set "Workflow Inputs" to pass through all input data from the previous node.  

4. **Connect "Set API Key & Initial Prompt1" → "Execute NixGuard & Wazuh Workflow".**

5. **Add a Set node named "Format NixGuard AI Summary & Wazuh Insights":**  
   - Add a string field named `ai_summary`.  
   - Set its value to the expression: `{{$json["output"]}}` to extract the output from the executed workflow.  

6. **Connect "Execute NixGuard & Wazuh Workflow" → "Format NixGuard AI Summary & Wazuh Insights".**

7. *(Optional)* **Add a Slack node named "(Optional) Send Slack Alert for High-Risk Events":**  
   - Configure authentication with OAuth2 credentials connected to your Slack workspace.  
   - In the message text, include:  
     ```
     🚨 *NixGuard IP Analysis* 🚨

     *AI Summary:*
     {{$json["ai_summary"]}}
     ```  
   - Disable this node by default to avoid accidental alerts.  

8. **Connect "Format NixGuard AI Summary & Wazuh Insights" → "(Optional) Send Slack Alert for High-Risk Events".**

9. *(Optional)* **Add a Webhook Trigger node named "Webhook Trigger (REAL-WORLD USE)1":**  
   - Set path to `"my-analysis-webhook"`.  
   - Keep disabled initially; enable and secure when ready to accept live inputs.  

10. **Add Sticky Notes for Setup and Instructions:**  
    - "Setup Instructions": explain how to input API key and connect the main workflow; include link to main workflow template.  
    - "Workflow Overview": describe the dispatcher pattern and benefits, with link to NixGuard.  
    - "Next Steps: Automate Response": suggest enabling Slack alerts, Jira integration, logging, and remediation automation.  

11. **Test the workflow:**  
    - Replace the empty API key with a valid NixGuard API key.  
    - Run the workflow manually or via webhook (if enabled).  
    - Validate that the external workflow executes and returns an `output` field.  
    - Verify the summary formatting and Slack alert (if enabled).  

---

### 5. General Notes & Resources

| Note Content                                                                                                      | Context or Link                                                                                                  |
|------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| Learn more about NixGuard, the AI-powered security analysis platform used in this workflow:                      | https://nixguard.thenex.world                                                                                    |
| Main external workflow template needed for this dispatcher:                                                      | https://n8n.io/workflows/4693-get-real-time-security-insights-with-nixguard-rag-and-wazuh-integration/           |
| Suggested next steps to automate SOC/IR processes include integration with Jira, Google Sheets/databases, etc.  | Mentioned in sticky note "Next Steps: Automate Response"                                                        |
| Slack alerts are disabled by default to prevent accidental notifications; enable only after configuring credentials | Slack OAuth2 credentials and webhook setup required                                                             |

---

**Disclaimer:** The provided text is derived exclusively from an n8n automated workflow. All data and processes comply with current content policies and handle only legal and public information.