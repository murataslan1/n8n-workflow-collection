Auto Remediate Endpoint Infections with Wazuh, ClamAV, and GPT-4

https://n8nworkflows.xyz/workflows/auto-remediate-endpoint-infections-with-wazuh--clamav--and-gpt-4-7022


# Auto Remediate Endpoint Infections with Wazuh, ClamAV, and GPT-4

---
### 1. Workflow Overview

This workflow automates the remediation process of endpoint infections detected by Wazuh using ClamAV antivirus and GPT-4 AI assistance. It targets security operations centers (SOC) and IT administrators aiming to automatically identify, analyze, and remediate high-severity malware alerts by running antivirus scans and notifying stakeholders.

The workflow is logically divided into these blocks:

- **1.1 Input Reception:** Receives alert data from Wazuh via a webhook.
- **1.2 Severity Filtering:** Checks if the alert is high severity and relevant for automated remediation.
- **1.3 Alert Summarization:** Uses GPT-4 to generate a concise, expert-level summary of the alert.
- **1.4 Path Extraction:** Uses GPT-4 to extract the exact file path where the infection was detected.
- **1.5 Antivirus Scan Execution:** Runs a ClamAV scan on the extracted path via SSH.
- **1.6 Stakeholder Notification:** Sends a Telegram message to stakeholders summarizing the alert and scan results.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  Receives incoming alerts as HTTP POST requests from Wazuh’s alerting system.

- **Nodes Involved:**  
  - Wazuh Alert (Webhook)

- **Node Details:**

  - **Wazuh Alert**  
    - Type: Webhook  
    - Role: Entry point capturing raw JSON alerts from Wazuh.  
    - Configuration: HTTP POST on path `de0c6d77-ae71-4d78-9f10-502eaa851ce8`, with raw body enabled to capture full payload.  
    - Inputs: External HTTP POST requests.  
    - Outputs: Passes JSON alert data downstream.  
    - Edge Cases: Malformed request body, invalid HTTP method, webhook not reachable or misconfigured.

#### 2.2 Severity Filtering

- **Overview:**  
  Determines if the alert is of high severity (severity level 3 - "high") and corresponds to a specific rule ID (52502) indicating a ClamAV virus detection.

- **Nodes Involved:**  
  - Check High Severity (If)

- **Node Details:**

  - **Check High Severity**  
    - Type: If Condition  
    - Role: Filters alerts to proceed only if they are high severity and related to ClamAV virus detection (rule_id 52502).  
    - Configuration: Logical AND of two string equality checks: `$json.body.severity` equals `"3 high"` and `$json.body.rule_id` equals `"52502"`.  
    - Inputs: Output from Wazuh Alert node.  
    - Outputs:  
      - True branch continues processing.  
      - False branch leads to a no-operation node to gracefully ignore irrelevant alerts.  
    - Edge Cases: Missing or differently formatted fields in alert JSON causing condition failures.

  - **No Operation, do nothing**  
    - Type: NoOp (no operation)  
    - Role: Endpoint for non-high severity alerts to halt workflow gracefully without errors.

#### 2.3 Alert Summarization

- **Overview:**  
  Uses GPT-4 to produce a detailed yet concise summary of the alert text, emulating a Senior SOC Analyst perspective.

- **Nodes Involved:**  
  - OpenAI Chat Model  
  - Summarize Alert

- **Node Details:**

  - **OpenAI Chat Model**  
    - Type: Language Model (OpenAI GPT-4)  
    - Role: Provides GPT-4-powered chat capabilities to process input text.  
    - Configuration: Uses model `gpt-4.1-mini` with default options. Credentials use a configured OpenAI API account.  
    - Inputs: Receives alert JSON from Check High Severity.  
    - Outputs: Passes AI response to Summarize Alert node.  
    - Edge Cases: API authentication errors, rate limiting, response delays.

  - **Summarize Alert**  
    - Type: LangChain Summarization Chain  
    - Role: Runs a summarization prompt to generate a concise expert summary of the alert text.  
    - Configuration: Custom prompt instructs the AI to act as a Senior SOC Analyst and to focus on ClamAV virus detection alerts, including example commands for ClamAV scans and notification instructions. It references alert details from the JSON input.  
    - Inputs: Text from OpenAI Chat Model node.  
    - Outputs: Summarized alert text forwarded to Path Extraction.  
    - Edge Cases: Prompt misinterpretation, empty or malformed alert text.

#### 2.4 Path Extraction

- **Overview:**  
  Extracts the exact filesystem path where the virus was detected from the summarized alert text using GPT-4.

- **Nodes Involved:**  
  - OpenAI Chat Model1  
  - Extract Path

- **Node Details:**

  - **OpenAI Chat Model1**  
    - Type: Language Model (OpenAI GPT-4)  
    - Role: Provides GPT-4 chat capabilities specific for extracting structured information.  
    - Configuration: Uses `gpt-4.1-mini` model with default options and same OpenAI API credentials.  
    - Inputs: Receives summarized text from Summarize Alert node.  
    - Outputs: Passes data to Extract Path node.  
    - Edge Cases: Same as previous OpenAI node.

  - **Extract Path**  
    - Type: LangChain Agent  
    - Role: Uses a defined prompt to parse free text and extract the virus detection path in a strict format.  
    - Configuration: Prompt explains the input format and provides an example of how to output the file path extracted from the alert text.  
    - Inputs: Receives summarized alert from Summarize Alert node.  
    - Outputs: Extracted path string forwarded to Run AV Scan.  
    - Edge Cases: Ambiguous or missing path information, incorrect parsing by AI.

#### 2.5 Antivirus Scan Execution

- **Overview:**  
  Initiates a ClamAV scan over SSH on the extracted path to remediate the infection.

- **Nodes Involved:**  
  - Run AV Scan

- **Node Details:**

  - **Run AV Scan**  
    - Type: SSH  
    - Role: Connects via SSH to a Wazuh manager or endpoint to execute ClamAV scan command.  
    - Configuration: Runs command `clamscan -r {{ $json.output }} --bell -i`, where `{{ $json.output }}` is the extracted path from previous node. Uses SSH password credentials for authentication.  
    - Inputs: Receives path string from Extract Path node.  
    - Outputs: Scan result output (stdout) passed to notification node.  
    - Edge Cases: SSH connection failures, command execution errors, missing path, permission issues.

#### 2.6 Stakeholder Notification

- **Overview:**  
  Sends a detailed Telegram notification to stakeholders including the alert summary and scan results.

- **Nodes Involved:**  
  - Notify Stateholders via Telegram

- **Node Details:**

  - **Notify Stateholders via Telegram**  
    - Type: Telegram  
    - Role: Sends a message to a Telegram chat summarizing the incident and scan completion.  
    - Configuration: Message text includes summarized alert text and ClamAV scan stdout. Uses configured Telegram API credentials with a specific chat ID.  
    - Inputs: Receives scan results from Run AV Scan and summarized alert text from Summarize Alert.  
    - Outputs: Terminal node, no further outputs.  
    - Edge Cases: Telegram API failures, invalid chat ID, rate limiting.

---

### 3. Summary Table

| Node Name                     | Node Type                        | Functional Role                      | Input Node(s)            | Output Node(s)                     | Sticky Note                                                     |
|-------------------------------|---------------------------------|------------------------------------|-------------------------|----------------------------------|----------------------------------------------------------------|
| Wazuh Alert                   | Webhook                         | Receive Wazuh alert payload         | External HTTP POST      | Check High Severity              |                                                                |
| Check High Severity           | If Condition                   | Filter for high severity ClamAV alerts | Wazuh Alert             | Summarize Alert, No Operation    |                                                                |
| No Operation, do nothing      | NoOp                           | Stop workflow on irrelevant alerts  | Check High Severity (false) | None                           |                                                                |
| OpenAI Chat Model             | Language Model (OpenAI GPT-4)  | Provide AI text generation for summarization | Check High Severity (true) | Summarize Alert (ai_languageModel) |                                                                |
| Summarize Alert              | LangChain Summarization Chain  | Generate SOC analyst alert summary  | OpenAI Chat Model       | Extract Path                    |                                                                |
| OpenAI Chat Model1            | Language Model (OpenAI GPT-4)  | AI extraction of virus detection path | Summarize Alert (ai_languageModel) | Extract Path (ai_languageModel) |                                                                |
| Extract Path                  | LangChain Agent                | Extract file path of infection      | Summarize Alert         | Run AV Scan                    |                                                                |
| Run AV Scan                  | SSH                            | Run ClamAV scan on extracted path   | Extract Path            | Notify Stateholders via Telegram |                                                                |
| Notify Stateholders via Telegram | Telegram                     | Send Telegram notification          | Run AV Scan             | None                           |                                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node:**  
   - Name: `Wazuh Alert`  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: `de0c6d77-ae71-4d78-9f10-502eaa851ce8`  
   - Enable Raw Body to receive full JSON payload.

2. **Create If Node:**  
   - Name: `Check High Severity`  
   - Type: If  
   - Conditions (AND):  
     - `$json.body.severity` equals `"3 high"` (case insensitive)  
     - `$json.body.rule_id` equals `"52502"`  
   - Connect `Wazuh Alert` main output to `Check High Severity` input.

3. **Create NoOp Node:**  
   - Name: `No Operation, do nothing`  
   - Type: NoOp  
   - Connect `Check High Severity` false output to this node to gracefully ignore low severity alerts.

4. **Create OpenAI Chat Model Node for Summarization:**  
   - Name: `OpenAI Chat Model`  
   - Type: `@n8n/n8n-nodes-langchain.lmChatOpenAi`  
   - Model: `gpt-4.1-mini`  
   - Credentials: Configure OpenAI API credentials (OAuth or API key).  
   - Connect `Check High Severity` true output to this node’s input.

5. **Create LangChain Summarization Node:**  
   - Name: `Summarize Alert`  
   - Type: `@n8n/n8n-nodes-langchain.chainSummarization`  
   - Prompt:  
     ```
     Write a detailed concise summary of the following as a Senior soc analyst:
     
     "{text}"
     
     CONCISE SUMMARY:
     ```  
   - Custom combineMapPrompt: instruct AI to act as Wazuh AI Assistant, run ClamAV scan commands, consolidate output, and notify via Telegram, referencing alert name and full log.  
   - Connect `OpenAI Chat Model` output (ai_languageModel) to Summarize Alert.

6. **Create OpenAI Chat Model Node for Path Extraction:**  
   - Name: `OpenAI Chat Model1`  
   - Type: `@n8n/n8n-nodes-langchain.lmChatOpenAi`  
   - Model: `gpt-4.1-mini`  
   - Credentials: Same OpenAI API credentials as before.  
   - Connect `Summarize Alert` output (ai_languageModel) to this node.

7. **Create LangChain Agent Node for Path Extraction:**  
   - Name: `Extract Path`  
   - Type: `@n8n/n8n-nodes-langchain.agent`  
   - Prompt:  
     ```
     You are the wazuh AI Assistant. your primary task is to understand the above mentioned text and extract the path where the virus got detected on the below format:
     
     Example: 
     
     text:
     A high-severity WAZUH alert was triggered on July 30, 2025, indicating ClamAV detected the EICAR test virus (EICAR.TEST.3.UNOFFICIAL) in the file `/test/eicar.com` on the host `shadowark`...
     
     output required:
     /test/eicar.com
     ```  
   - Connect `OpenAI Chat Model1` output (ai_languageModel) to `Extract Path`.

8. **Create SSH Node to Run ClamAV Scan:**  
   - Name: `Run AV Scan`  
   - Type: SSH  
   - Command: `clamscan -r {{ $json.output }} --bell -i` (where `{{ $json.output }}` is the extracted path)  
   - Credentials: Configure SSH credentials for Wazuh Manager or target machine.  
   - Connect `Extract Path` main output to this node.

9. **Create Telegram Node for Notifications:**  
   - Name: `Notify Stateholders via Telegram`  
   - Type: Telegram  
   - Chat ID: Configure your Telegram chat ID to receive notifications.  
   - Text:  
     ```
     Notification:
     
     {{ $('Summarize Alert').item.json.output.text }}
     
     Followed by the above activity, the scanning has been initiated and completed successfully. please find the below details.
     
     {{ $json.stdout }}
     
     Thank you!
     Mariskarthick M
     ```  
   - Credentials: Configure Telegram API bot credentials.  
   - Connect `Run AV Scan` main output to this node.

10. **Connect all nodes as per the flow:**  
    - `Wazuh Alert` → `Check High Severity`  
    - `Check High Severity` True → `OpenAI Chat Model`  
    - `Check High Severity` False → `No Operation, do nothing`  
    - `OpenAI Chat Model` (ai_languageModel) → `Summarize Alert`  
    - `Summarize Alert` (ai_languageModel) → `OpenAI Chat Model1`  
    - `OpenAI Chat Model1` (ai_languageModel) → `Extract Path`  
    - `Extract Path` → `Run AV Scan`  
    - `Run AV Scan` → `Notify Stateholders via Telegram`

---

### 5. General Notes & Resources

| Note Content                                                                                                                                            | Context or Link                                                                                                      |
|---------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| The workflow was created by Mariskarthick and uses advanced GPT-4 prompts tailored for SOC analysts.                                                    |                                                                                                                     |
| For examples of AI prompt design for security automation, see related blog posts on LangChain and AI-driven SOC workflows.                             |                                                                                                                     |
| Telegram bot setup requires creating a bot via BotFather and obtaining chat IDs for notification channels.                                            | Telegram Bot API documentation: https://core.telegram.org/bots/api                                                   |
| SSH credentials must allow password-based authentication and have permissions to run clamscan commands on target machines.                              |                                                                                                                     |
| Wazuh alerts are expected to include fields like `severity`, `rule_id`, `body.title`, and `body.text` in the JSON payload for correct filtering/parsing. |                                                                                                                     |

---

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.