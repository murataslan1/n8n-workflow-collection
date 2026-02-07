AI-Powered Bug Triage System with OpenAI, Jira and Slack Alerts

https://n8nworkflows.xyz/workflows/ai-powered-bug-triage-system-with-openai--jira-and-slack-alerts-11697


# AI-Powered Bug Triage System with OpenAI, Jira and Slack Alerts

### 1. Workflow Overview

This workflow is an **AI-Powered Bug Triage System** designed to automate the reception, analysis, categorization, and notification of software bug reports. It targets software development and QA teams who want to streamline bug management by integrating AI analysis with Jira issue tracking and Slack notifications. 

The workflow logically divides into two main blocks:

- **1.1 Issue Creation:** Receives bug reports via webhook, uses AI to analyze the report for priority and category, then creates a corresponding Jira bug issue labeled "bug-suspicion" and "ai-triaged" with category metadata.
- **1.2 Notification:** Based on the severity, sends a Slack alert to the appropriate QA channel referencing the newly created Jira issue.

---

### 2. Block-by-Block Analysis

#### 2.1 Issue Creation

**Overview:**  
This block handles the initial reception of bug reports, invokes AI to analyze the bug's priority and category, and creates a Jira issue accordingly.

**Nodes Involved:**  
- Webhook Trigger  
- AI Bug Analysis  
- Priority Switch  
- Create High Jira  
- Create Medium Jira  
- Create Low Jira  
- Section - Issue Creation (Sticky Note)  

**Node Details:**

- **Webhook Trigger**  
  - Type: Webhook Trigger  
  - Role: Entry point; listens for HTTP POST requests on path `/advanced-bug-triage`.  
  - Configuration: HTTP Method POST, no special options enabled.  
  - Inputs: External HTTP POST request containing bug report data (expected fields: `title`, `description`).  
  - Outputs: Passes received data to AI Bug Analysis.  
  - Edge Cases: Invalid or missing payload can cause analysis failure; no explicit validation here.  
  - Version: Compatible with n8n v1.x.  

- **AI Bug Analysis**  
  - Type: OpenAI node (GPT-4)  
  - Role: Sends bug report data to OpenAI GPT-4 to extract sentiment, priority (High, Medium, Low), and category of the bug.  
  - Configuration: Uses default options, no explicit prompt shown but implied to analyze text fields for triage.  
  - Inputs: Bug report JSON from webhook.  
  - Outputs: JSON enriched with fields like `priority` and `category` for routing.  
  - Edge Cases: API rate limits, authentication errors, or malformed responses may cause failures.  
  - Version: Requires OpenAI credentials configured in n8n.  

- **Priority Switch**  
  - Type: Switch  
  - Role: Routes workflow based on the `priority` field set by AI Bug Analysis.  
  - Configuration: Switches on string value of `{{$json.priority}}` with rules for "High", "Medium", and "Low".  
  - Inputs: AI Bug Analysis output.  
  - Outputs: Routes to one of the three Jira creation nodes.  
  - Edge Cases: If priority is missing or unmatched, defaults to Medium (fallbackOutput = 1).  

- **Create High Jira**  
  - Type: Jira node  
  - Role: Creates a Jira bug issue in project "APP" for high-priority bugs.  
  - Configuration:  
    - Project: "APP"  
    - IssueType: "Bug"  
    - Summary: prepends priority in square brackets to the summary field (e.g., `[High] Bug summary`)  
    - Labels: `ai-triaged` and category label converted to lowercase (e.g., `ui`, `backend`).  
  - Inputs: Routed from Priority Switch when priority is "High".  
  - Outputs: Passes Jira issue data (including issue key) to Slack Alert (High).  
  - Edge Cases: Jira authentication, permission errors, or API failures.  

- **Create Medium Jira**  
  - Same as Create High Jira but for "Medium" priority.  
  - Outputs to Slack Alert (Normal).  

- **Create Low Jira**  
  - Same as Create High Jira but for "Low" priority.  
  - Outputs to Slack Alert (Normal).  

- **Section - Issue Creation (Sticky Note)**  
  - Provides a summary note describing this block's purpose: webhook receives bug reports then creates Jira bugs labeled "bug-suspicion".  

---

#### 2.2 Notification

**Overview:**  
This block sends Slack notifications to QA channels based on the priority of the created Jira bug.

**Nodes Involved:**  
- Slack Alert (High)  
- Slack Alert (Normal)  
- Section - Notification (Sticky Note)  

**Node Details:**

- **Slack Alert (High)**  
  - Type: Slack node  
  - Role: Sends high-priority bug alerts to the `qa-alerts-high` Slack channel.  
  - Configuration:  
    - Text includes a header "HIGH PRIORITY BUG DETECTED", Jira issue key, summary, and a link to the Jira issue.  
    - Channel: `qa-alerts-high`  
  - Inputs: From Create High Jira node.  
  - Edge Cases: Slack API token invalid, bot missing channel access, rate limits.  

- **Slack Alert (Normal)**  
  - Type: Slack node  
  - Role: Sends normal priority bug alerts to the `qa-general` Slack channel.  
  - Configuration:  
    - Text includes "New Bug Reported" with Jira issue key.  
    - Channel: `qa-general`  
  - Inputs: From both Create Medium Jira and Create Low Jira nodes.  
  - Edge Cases: Same as Slack Alert (High).  

- **Section - Notification (Sticky Note)**  
  - Describes that Slack messages are sent to QA channels with Jira issue references.  

---

#### Additional Notes

- **Sticky Note AI**: Describes the AI analysis and logic routing using OpenAI GPT-4, emphasizing the extraction of priority and category for routing.
- **Main Overview1 (Sticky Note)**: Provides a detailed explanation of the overall workflow, setup instructions for OpenAI, Jira, and Slack credentials, and usage instructions.

---

### 3. Summary Table

| Node Name           | Node Type          | Functional Role                         | Input Node(s)           | Output Node(s)                | Sticky Note                                        |
|---------------------|--------------------|---------------------------------------|------------------------|------------------------------|---------------------------------------------------|
| Webhook Trigger     | Webhook Trigger    | Receives incoming bug reports          | (external HTTP POST)    | AI Bug Analysis              |                                                   |
| AI Bug Analysis     | OpenAI             | Analyzes bug report for priority and category | Webhook Trigger         | Priority Switch              | AI Analysis & Logic Routing (Sticky Note AI)      |
| Priority Switch     | Switch             | Routes based on AI-determined priority | AI Bug Analysis          | Create High Jira, Create Medium Jira, Create Low Jira | AI Analysis & Logic Routing (Sticky Note AI)      |
| Create High Jira    | Jira               | Creates high-priority Jira bug issue   | Priority Switch          | Slack Alert (High)           | Issue Creation (Sticky Note)                       |
| Create Medium Jira  | Jira               | Creates medium-priority Jira bug issue | Priority Switch          | Slack Alert (Normal)         | Issue Creation (Sticky Note)                       |
| Create Low Jira     | Jira               | Creates low-priority Jira bug issue    | Priority Switch          | Slack Alert (Normal)         | Issue Creation (Sticky Note)                       |
| Slack Alert (High)  | Slack              | Sends Slack alert for high-priority bugs | Create High Jira         |                              | Notification (Sticky Note)                         |
| Slack Alert (Normal)| Slack              | Sends Slack alert for medium/low bugs  | Create Medium Jira, Create Low Jira |                      | Notification (Sticky Note)                         |
| Section - Issue Creation | Sticky Note     | Describes issue creation block          |                        |                              | Issue Creation description                         |
| Section - Notification | Sticky Note       | Describes notification block            |                        |                              | Notification description                           |
| Sticky Note AI      | Sticky Note        | Describes AI analysis & routing logic   |                        |                              | AI analysis and routing explanation                |
| Main Overview1      | Sticky Note        | Overall workflow explanation and setup |                        |                              | Setup instructions and workflow overview          |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Trigger Node**  
   - Type: Webhook Trigger  
   - Name: `Webhook Trigger`  
   - HTTP Method: POST  
   - Path: `advanced-bug-triage`  
   - No authentication configured (or configure as needed).  

2. **Create OpenAI Node for AI Analysis**  
   - Type: OpenAI  
   - Name: `AI Bug Analysis`  
   - Credentials: Set up OpenAI API credentials with GPT-4 access.  
   - Input: Use incoming JSON from webhook.  
   - Configuration: Configure prompt to analyze bug report fields (title, description) and return JSON with keys `priority` (High/Medium/Low) and `category` (string).  
   - Connect Webhook Trigger output to this node input.  

3. **Create Switch Node for Priority Routing**  
   - Type: Switch  
   - Name: `Priority Switch`  
   - Property to check: `{{$json.priority}}` (string)  
   - Rules:  
     - Rule 1: equals "High" → output 0  
     - Rule 2: equals "Medium" → output 1  
     - Rule 3: equals "Low" → output 2  
   - Fallback output: 1 (Medium)  
   - Connect AI Bug Analysis output to this node input.  

4. **Create Jira Nodes for Each Priority**  
   - Credentials: Configure Jira credentials with access to project "APP".  
   - Common config for all three:  
     - Project: APP  
     - Issue Type: Bug  
     - Summary: Use expression `=[{{$json.priority}}] {{$json.summary}}` (where `summary` comes from incoming data or AI-processed data).  
     - Labels: Array with `ai-triaged` and `{{$json.category.toLowerCase()}}`.  
   - Create High Jira node: Connect Priority Switch output 0 to this node.  
   - Create Medium Jira node: Connect Priority Switch output 1 to this node.  
   - Create Low Jira node: Connect Priority Switch output 2 to this node.  

5. **Create Slack Notification Nodes**  
   - Credentials: Configure Slack OAuth2 credentials, ensure bot is added to channels `qa-alerts-high` and `qa-general`.  
   - Slack Alert (High) node:  
     - Channel: `qa-alerts-high`  
     - Text:  
       ```
       HIGH PRIORITY BUG DETECTED
       Issue: {{$json.key}} - {{$json.fields.summary}}
       Link: {{$json.self}}
       ```  
     - Connect output from Create High Jira node.  
   - Slack Alert (Normal) node:  
     - Channel: `qa-general`  
     - Text: `New Bug Reported: {{$json.key}}`  
     - Connect outputs from Create Medium Jira and Create Low Jira nodes (merge outputs if needed).  

6. **Add Sticky Notes for Documentation (Optional but Recommended)**  
   - Add descriptive sticky notes for: Issue Creation block, Notification block, AI analysis explanation, and overall workflow overview with setup instructions.  

7. **Testing**  
   - Send a POST request with fields `title` and `description` to the webhook URL `/webhook/advanced-bug-triage`.  
   - Observe AI analysis, Jira issue creation with correct priority and labels, and Slack notifications in the right channels.  

---

### 5. General Notes & Resources

| Note Content                                                                                                 | Context or Link                                                                                   |
|--------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| Workflow acts as an AI-powered triage agent to automate bug handling in software projects.                   | Overall workflow purpose                                                                         |
| Setup steps: Configure OpenAI credentials, Jira credentials with access to project "APP", Slack bot in channels `#qa-alerts-high` and `#qa-general`. | Provided in Main Overview1 sticky note                                                            |
| Slack alert text formatting includes Jira issue keys and links for quick reference.                           | Enhances QA team's ability to quickly access bug details                                         |
| Workflow requires GPT-4 model access in OpenAI credentials.                                                  | OpenAI usage note                                                                                |
| Jira issues are tagged with `ai-triaged` and AI-determined category labels (in lowercase).                   | Helps with filtering and reporting in Jira                                                      |
| Slack channels must exist and bot must have posting permissions to avoid failed notifications.                | Typical Slack integration requirement                                                           |
| Webhook expects POST requests with at least `title` and `description` fields for correct AI analysis.       | Input data requirement                                                                           |

---

This document provides a comprehensive, structured reference for understanding, reproducing, and maintaining the "AI-Powered Bug Triage System with OpenAI, Jira and Slack Alerts" workflow.