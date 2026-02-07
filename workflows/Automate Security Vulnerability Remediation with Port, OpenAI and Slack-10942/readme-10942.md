Automate Security Vulnerability Remediation with Port, OpenAI and Slack

https://n8nworkflows.xyz/workflows/automate-security-vulnerability-remediation-with-port--openai-and-slack-10942


# Automate Security Vulnerability Remediation with Port, OpenAI and Slack

### 1. Workflow Overview

This workflow automates the remediation process of newly detected security vulnerabilities by integrating Port’s contextual vulnerability data, AI-generated remediation plans, and team notifications via Slack. It is designed for security teams and DevOps engineers who want to streamline vulnerability management by enriching alerts with organizational context, generating AI-assisted remediation plans, and optionally triggering automated code fixes.

The workflow consists of the following logical blocks:

- **1.1 Input Reception:** Listens for incoming security vulnerability alerts via a webhook.
- **1.2 Context Enrichment via Port:** Enriches the raw vulnerability data with detailed organizational context from Port’s catalog.
- **1.3 AI Remediation Plan Generation:** Uses OpenAI to generate a structured remediation plan based on enriched data.
- **1.4 Conditional Code Fix Trigger:** Checks if the vulnerability is fixable and triggers automated code remediation using Claude AI if applicable.
- **1.5 Notification Delivery:** Sends a detailed vulnerability alert message to Slack, including remediation information.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block initiates the workflow upon receiving a new vulnerability alert from an external security scanner via HTTP POST webhook.

- **Nodes Involved:**  
  - Webhook Trigger

- **Node Details:**  

  - **Webhook Trigger**  
    - Type & Role: HTTP webhook node to receive external vulnerability alerts.  
    - Configuration:  
      - HTTP Method: POST  
      - Path: `security/vulnerability_detected`  
    - Expressions: Accesses incoming payload fields such as vulnerability_id, description, and severity from the webhook body.  
    - Connections: Outputs to "Get Context From Port".  
    - Edge Cases: Possible failure if the webhook is not triggered or payload structure changes; ensure payload matches expected JSON schema.  
    - Notes: Serves as the external entry point for the workflow.

#### 2.2 Context Enrichment via Port

- **Overview:**  
  Enriches the incoming vulnerability alert with organizational metadata from Port’s context lake, such as affected services, owners, environments, and communication channels.

- **Nodes Involved:**  
  - Get Context From Port  
  - Process Port AI Response  
  - Sticky Note (explanatory, no logic)

- **Node Details:**  

  - **Get Context From Port**  
    - Type & Role: Custom Port.io node querying Port’s AI context lake.  
    - Configuration:  
      - Model: GPT-5 (Port’s AI model)  
      - Prompt: Provides vulnerability details and requests structured JSON with keys like affected_service, slack_channel, owners, environments, dependencies, notes.  
      - Labels: Metadata tagging for Port’s AI agent.  
    - Credentials: Port.io API credentials required.  
    - Input: Receives webhook data.  
    - Output: Passes enriched context data to "Process Port AI Response".  
    - Edge Cases: API failures, invalid credentials, or incomplete data from Port could impact downstream logic.  
    - Notes: This node is critical for contextualizing vulnerabilities.

  - **Process Port AI Response**  
    - Type & Role: Custom Port.io node to retrieve AI invocation results.  
    - Configuration:  
      - Operation: getInvocation  
      - InvocationId: Dynamically extracted from previous node output.  
    - Credentials: Port.io API credentials required.  
    - Input: Receives invocation identifier from "Get Context From Port".  
    - Output: Passes parsed AI response to "OpenAI Remediation Plan".  
    - Edge Cases: Invocation retrieval failures or response parsing errors.

  - **Sticky Note (Port Context Lake)**  
    - Content: Explains Port’s role in enriching alert data with ownership, environment, and dependency metadata.

#### 2.3 AI Remediation Plan Generation

- **Overview:**  
  Uses OpenAI’s GPT model to analyze the vulnerability and its enriched context, then generates a structured remediation plan including summary, impact assessment, fixability, and remediation instructions.

- **Nodes Involved:**  
  - OpenAI Remediation Plan  
  - Is Fixable?  
  - Sticky Note (workflow overview)

- **Node Details:**  

  - **OpenAI Remediation Plan**  
    - Type & Role: OpenAI node for chat completion.  
    - Configuration:  
      - Model: GPT-4o-mini  
      - Prompt: Instructs the model to act as a cybersecurity assistant, summarizing the vulnerability and generating remediation instructions in a strict JSON format without markdown or extra formatting.  
      - Key expressions: Injects vulnerability_id, description, severity from webhook and context message from Port AI response.  
    - Credentials: OpenAI API credentials required.  
    - Input: Receives contextualized vulnerability data.  
    - Output: Outputs AI-generated remediation plan JSON to "Is Fixable?".  
    - Edge Cases: API rate limits, prompt parsing errors, malformed JSON output.  
    - Notes: Output schema enforces structured JSON with fields: summary, impact, remediation_plan, is_fixable (boolean).

  - **Is Fixable?**  
    - Type & Role: IF node to determine if automated code remediation should be triggered.  
    - Configuration:  
      - Condition: Checks if `is_fixable` field in OpenAI response is true.  
    - Inputs: Receives AI remediation plan.  
    - Outputs:  
      - True branch: Triggers "Trigger Claude Code" node.  
      - False branch: Skips code fix and proceeds to Slack notification.  
    - Edge Cases: Missing or malformed `is_fixable` field could cause logic errors.

  - **Sticky Note (Workflow Overview)**  
    - Content: Describes the overall workflow purpose, setup instructions, and integration overview.

#### 2.4 Conditional Code Fix Trigger

- **Overview:**  
  If the vulnerability is deemed fixable, this block uses Claude AI via Port to generate a code fix and open a pull request automatically.

- **Nodes Involved:**  
  - Trigger Claude Code  
  - Sticky Note (Claude setup)

- **Node Details:**  

  - **Trigger Claude Code**  
    - Type & Role: HTTP Request node to call Port API for running Claude code generation.  
    - Configuration:  
      - URL: `https://api.getport.io/v1/actions/run_claude_code_demo/runs`  
      - Method: POST  
      - Authentication: Bearer token (configured in credentials)  
      - JSON Body:  
        - `service`: Extracted from Port AI response’s `affected_service` or fallback `<OWNER/REPO>` placeholder.  
        - `prompt`: Instruction to generate a code fix based on AI summary and remediation plan, with PR creation instructions.  
    - Credentials: HTTP Bearer authentication with Port API token.  
    - Input: Receives AI remediation plan and Port context data.  
    - Output: On success, proceeds to "Send Slack Message" node.  
    - Edge Cases: API authentication failures, network timeouts, invalid prompt or missing service repo info.  
    - Notes: See sticky note for setup guide and owner/repo replacement instructions.

  - **Sticky Note (Setup Claude in Port)**  
    - Content: Provides setup instructions and link to Port’s official guide for the Claude trigger. Advises replacing `<OWNER/REPO>` with actual repo if Port does not provide one.

#### 2.5 Notification Delivery

- **Overview:**  
  Sends a detailed Slack message to notify relevant teams about the vulnerability, its severity, summary, impact, and remediation plan.

- **Nodes Involved:**  
  - Send Slack Message  
  - Sticky Note (Slack channel replacement)

- **Node Details:**  

  - **Send Slack Message**  
    - Type & Role: Slack node for posting messages.  
    - Configuration:  
      - Channel: Dynamically set from Port AI response’s slack_channel field or fallback `<DEFAULT_SLACK_CHANNEL>`.  
      - Text: Multi-line formatted string with vulnerability details including ID, severity, summary, impact, and remediation plan extracted from OpenAI node output.  
      - Attachments: None configured.  
    - Credentials: Slack API OAuth2 credentials required.  
    - Input: Receives both AI remediation plan and Port context data (via branches from both "Trigger Claude Code" and "Is Fixable?").  
    - Edge Cases: Invalid channel, missing Slack credentials, API rate limits, message formatting errors.  
    - Notes: See sticky note for instructions on replacing default Slack channel.

  - **Sticky Note (Slack Channel Replacement)**  
    - Content: Advises replacing `<DEFAULT_SLACK_CHANNEL>` with the desired Slack channel for fallback notifications.

---

### 3. Summary Table

| Node Name              | Node Type          | Functional Role                           | Input Node(s)           | Output Node(s)          | Sticky Note                                                                                  |
|------------------------|--------------------|-----------------------------------------|-------------------------|-------------------------|----------------------------------------------------------------------------------------------|
| Webhook Trigger        | Webhook            | Entry point for vulnerability alerts   | —                       | Get Context From Port    |                                                                                              |
| Get Context From Port  | CUSTOM.portIo      | Enrich vulnerability with Port context  | Webhook Trigger         | Process Port AI Response | Explains Port’s context lake enrichment                                                     |
| Process Port AI Response| CUSTOM.portIo      | Retrieve Port AI invocation result       | Get Context From Port    | OpenAI Remediation Plan  |                                                                                              |
| OpenAI Remediation Plan| OpenAI             | Generate AI remediation plan             | Process Port AI Response | Is Fixable?              | Workflow overview and setup instructions                                                    |
| Is Fixable?            | IF                 | Branching: fixable or not                 | OpenAI Remediation Plan  | Trigger Claude Code (true), Send Slack Message (false) |                                                                                              |
| Trigger Claude Code    | HTTP Request       | Call Port API to generate code fix       | Is Fixable? (true branch) | Send Slack Message       | Setup guide & repo replacement instructions                                                  |
| Send Slack Message     | Slack              | Notify teams with vulnerability details  | Is Fixable? (false branch), Trigger Claude Code | —                       | Instructions for replacing default Slack channel                                            |
| Sticky Note            | Sticky Note        | Documentation                            | —                       | —                       | Workflow overview and instructions                                                          |
| Sticky Note1           | Sticky Note        | Documentation                            | —                       | —                       | Port’s context lake explanation                                                             |
| Sticky Note2           | Sticky Note        | Documentation                            | —                       | —                       | Setup Claude in Port instructions and repo placeholder                                      |
| Sticky Note3           | Sticky Note        | Documentation                            | —                       | —                       | Slack channel replacement instruction                                                       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Webhook Trigger node**  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: `security/vulnerability_detected`  
   - Purpose: Receive vulnerability alerts from external scanners.

2. **Add a Custom Port.io Node ("Get Context From Port")**  
   - Type: CUSTOM.portIo  
   - Set model to `gpt-5`  
   - Configure prompt to send vulnerability details (ID, description, severity) and request structured JSON with keys: identifier, title, affected_service, slack_channel, owners, environments, dependencies, notes.  
   - Add labels for AI agent identification (source: n8n-workflow, use_case: vulnerability-context-enrichment).  
   - Connect Webhook Trigger output to this node.  
   - Configure Port.io API credentials.

3. **Add a Custom Port.io Node ("Process Port AI Response")**  
   - Type: CUSTOM.portIo  
   - Operation: `getInvocation`  
   - InvocationId: Dynamically set from previous node’s output (`{{$json.invocationIdentifier}}`).  
   - Connect "Get Context From Port" output to this node.  
   - Use the same Port.io API credentials.

4. **Add an OpenAI Node ("OpenAI Remediation Plan")**  
   - Type: OpenAI (Chat Completion)  
   - Model: `gpt-4o-mini`  
   - Prompt:  
     ```
     You are a cybersecurity assistant. Given the following vulnerability details, summarize the issue, assess impact, and generate a clear remediation plan.

     Vulnerability: {{ $('Webhook Trigger').item.json.body.vulnerability_id }}
     Description: {{ $('Webhook Trigger').item.json.body.description }}
     Severity: {{ $('Webhook Trigger').item.json.body.severity }}

     Context: {{ $json.result.message }}

     Your response must be a single valid JSON object only, without any code block formatting, markdown, explanations, or extra text.  
     Do not include ```json or ``` or any surrounding characters — just raw JSON.

     Required output schema:
     {
       "summary": "",
       "impact": "",
       "remediation_plan": "",
       "is_fixable": boolean true or false
     }
     ```  
   - Connect "Process Port AI Response" output to this node.  
   - Configure OpenAI API credentials.

5. **Add an IF Node ("Is Fixable?")**  
   - Type: IF condition node  
   - Condition: Check if `{{$json.message.content.parseJson().is_fixable}}` equals `true`.  
   - Connect "OpenAI Remediation Plan" output to this node.

6. **Add an HTTP Request Node ("Trigger Claude Code")**  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://api.getport.io/v1/actions/run_claude_code_demo/runs`  
   - Authentication: HTTP Bearer Token (configure credentials with your Port token)  
   - Body Type: JSON  
   - Body:  
     ```json
     {
       "properties": {
         "service": "={{ $json.message.content.parseJson().affected_service || \"<OWNER/REPO>\" }}",
         "prompt": "Generate a code fix for the security vulnerability based on the AI-provided summary " + $json.message.content.parseJson().summary + ".\n\nHere is the information about the security vulnerability remediation plan:\n" + $json.message.content.parseJson().remediation_plan + "\n\nAfter generating the code, open a PR with a description summarizing what was fixed and why."
       }
     }
     ```  
   - Connect the "true" output of "Is Fixable?" to this node.

7. **Add a Slack Node ("Send Slack Message")**  
   - Type: Slack  
   - Channel: `={{ $('Process Port AI Response').item.json.result.message.parseJson().slack_channel || "<DEFAULT_SLACK_CHANNEL>" }}`  
   - Text:  
     ```
     🚨 *Vulnerability Alert*

     *ID:* {{$('Webhook Trigger').item.json.body.vulnerability_id}}
     *Severity:* {{$('Webhook Trigger').item.json.body.severity}}
     *Summary:* {{$node["OpenAI Remediation Plan"].json["message"]["content"].parseJson().summary}}
     *Impact:* {{$node["OpenAI Remediation Plan"].json["message"]["content"].parseJson().impact}}
     *Remediation Plan:* {{$node["OpenAI Remediation Plan"].json["message"]["content"].parseJson().remediation_plan}}

     _Workflow: AI-Assisted Remediation_
     ```  
   - Connect both:  
     - The "false" output of "Is Fixable?" directly to this Slack node  
     - The "Trigger Claude Code" node output to this Slack node (to run after automated remediation)  
   - Configure Slack API OAuth2 credentials.

8. **Configure Credentials**  
   - Port.io API credentials for custom Port nodes.  
   - OpenAI API credentials for AI completion node.  
   - Slack API credentials with posting permissions.  
   - HTTP Bearer token for Port API calls to trigger Claude code generation.

9. **Replace Placeholders**  
   - Replace `<OWNER/REPO>` in the Claude code trigger HTTP request body with your default infrastructure repository if Port does not provide an affected service.  
   - Replace `<DEFAULT_SLACK_CHANNEL>` in the Slack node with your default notification Slack channel.

10. **Testing**  
    - Trigger the webhook with sample vulnerability data matching the expected JSON structure to validate the entire flow: enrichment, AI remediation plan generation, condition check, optional code fix trigger, and Slack notification.

---

### 5. General Notes & Resources

| Note Content                                                                                                                               | Context or Link                                                                                      |
|---------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| Workflow automatically enriches vulnerability alerts with Port context and routes to appropriate teams or AI remediation agents.          | Workflow overview sticky note                                                                       |
| Port Context Lake enriches alerts with ownership, environment, and dependency metadata.                                                     | Sticky Note1                                                                                       |
| Setup Claude code generation in Port following the official guide; replace `<OWNER/REPO>` with your repo if missing in Port context data. | https://docs.port.io/guides/all/trigger-claude-code-from-port/                                      |
| Replace `<DEFAULT_SLACK_CHANNEL>` with your preferred Slack channel for fallback notifications.                                            | Sticky Note3                                                                                       |
| Ensure all API credentials are configured and tested before running the workflow.                                                          | General best practice                                                                               |

---

**Disclaimer:** The text provided derives exclusively from an n8n workflow automation. It complies strictly with the applicable content policies and contains no illegal, offensive, or protected elements. All data processed is legal and public.