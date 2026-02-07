AI Privacy-Minded Router: PII Detection for Privacy, Security, & Compliance

https://n8nworkflows.xyz/workflows/ai-privacy-minded-router--pii-detection-for-privacy--security----compliance-5874


# AI Privacy-Minded Router: PII Detection for Privacy, Security, & Compliance

### 1. Workflow Overview

This workflow, titled **"AI Privacy-Minded Router: PII Detection for Privacy, Security, & Compliance"**, is designed as a comprehensive privacy-first AI message processing pipeline. Its primary purpose is to detect Personally Identifiable Information (PII) within incoming chat messages, classify the sensitivity and risk of that data, and intelligently route messages either to local or cloud AI processing environments. This ensures regulatory compliance (GDPR, HIPAA, PCI, SOX), security of sensitive data, audit readiness, and operational efficiency.

The workflow is structured into the following logical blocks:

- **1.1 Input Reception:** Captures incoming user chat messages.
- **1.2 Enhanced PII Detection:** Analyzes messages with advanced pattern matching and risk scoring to detect and mask PII.
- **1.3 Routing Decision:** Applies a rule-based switch to decide processing route based on detected PII severity and context.
- **1.4 Compliance & Audit Logging:** Records anonymized audit trails for compliance and monitoring without exposing raw PII.
- **1.5 Error Handling & Recovery:** Centralized error detection, logging, and automatic fallback strategies to maintain compliance and system resilience.
- **1.6 Real-time Monitoring & Alerting:** Aggregates performance, security, and compliance metrics, generating alerts for operational awareness.
- **1.7 AI Agents Processing:** Two paths for AI processing:
  - Local/private AI agent for sensitive data.
  - Cloud/edge AI agent for non-sensitive or low-risk data.
- **1.8 Memory Integration:** Maintains conversation context for better AI interactions.

---

### 2. Block-by-Block Analysis

---

#### 2.1 Input Reception

**Overview:**  
Receives incoming chat messages from users via a chat trigger node to initiate the workflow.

**Nodes Involved:**  
- When chat message received

**Node Details:**

- **When chat message received**  
  - Type: `@n8n/n8n-nodes-langchain.chatTrigger`  
  - Role: Entry point webhook that listens for incoming chat messages to trigger the workflow.  
  - Configuration: Default chat trigger, no special parameters.  
  - Inputs: External chat messages (via configured webhook).  
  - Outputs: Emits messages downstream for PII analysis.  
  - Version: 1.1  
  - Edge cases: Missing message content or malformed payloads may cause downstream detection to fail but are handled gracefully in the PII analyzer node.

---

#### 2.2 Enhanced PII Detection

**Overview:**  
Analyzes incoming messages using advanced regex pattern matching with confidence scoring, severity classification, automatic masking of sensitive substrings, and contextual classification (financial, medical, legal, personal). Produces a risk score and routes the message accordingly.

**Nodes Involved:**  
- Enhanced PII Pattern Analyzer

**Node Details:**

- **Enhanced PII Pattern Analyzer**  
  - Type: `n8n-nodes-base.code` (JavaScript)  
  - Role: Core logic for identifying PII patterns, scoring risk, masking sensitive data, and assigning routing decisions.  
  - Configuration: Custom JavaScript including multiple regex patterns for SSNs, credit cards, emails, phones, IP addresses, medical IDs, account numbers, and more.  
  - Key variables:
    - `piiPatterns`: Object defining regex, confidence, severity, and masking rules for each PII type.  
    - `contextPatterns`: Regex patterns to detect context keywords.  
    - `maskPII()`: Function masks detected PII substrings preserving structure.  
    - `generateSessionId()`: Creates unique session IDs for traceability.  
    - Output JSON includes masked message, risk score, highest severity, context, detected patterns, compliance flags, and routing reason.  
  - Input: Incoming chat message JSON from trigger node.  
  - Output: Annotated message JSON with PII detection results and routing decision.  
  - Version: 2  
  - Edge cases: 
    - No message content found → marks no PII with error note.  
    - Regex false positives/negatives may occur; masking is conservative.  
    - Performance depends on message size and complexity of regex matching.  
  - Error handling: On error, continues with default outputs.

---

#### 2.3 Routing Decision

**Overview:**  
Determines the processing path based on PII severity, risk score, and detected context using a switch node with advanced multi-condition logic.

**Nodes Involved:**  
- Enhanced PII Routing Switch

**Node Details:**

- **Enhanced PII Routing Switch**  
  - Type: `n8n-nodes-base.switch`  
  - Role: Implements multi-tier routing logic:  
    - Critical PII or high risk → route locally only.  
    - Standard PII or sensitive contexts (financial, medical) → local processing.  
    - No PII → cloud processing.  
  - Configuration:
    - Conditions check JSON fields: `highestSeverity`, `piiDetected`, and `riskScore`.  
    - Outputs:  
      - "Critical PII - Local Only"  
      - "PII Detected - Local Processing"  
      - "Clean - Cloud Processing"  
  - Input: Annotated message JSON from PII Pattern Analyzer.  
  - Outputs: Routes to compliance logger or direct AI agents accordingly.  
  - Version: 3.2  
  - Edge cases: Risk score threshold tuning critical to avoid misrouting.

---

#### 2.4 Compliance & Audit Logging

**Overview:**  
Generates detailed audit logs without including raw PII, stores session and message metadata, compliance flags, processing paths, and risk assessments. Supports regulatory review and monitoring.

**Nodes Involved:**  
- Compliance & Audit Logger

**Node Details:**

- **Compliance & Audit Logger**  
  - Type: `n8n-nodes-base.code`  
  - Role: Creates anonymized audit entries with session tracking, message IDs, routing reasons, risk scores, compliance flags, and performance metrics.  
  - Configuration: JavaScript generating logs and console output for monitoring; calculates summary statistics per session.  
  - Input: Routed messages from PII Routing Switch.  
  - Output: Messages enriched with audit entries and compliance status.  
  - Version: 2  
  - Edge cases: Missing or malformed fields handled gracefully.  
  - Logs to console and attaches audit data for downstream monitoring.

---

#### 2.5 Error Handling & Recovery

**Overview:**  
Centralizes error detection, logs error types (processing, PII detection failure, compliance violation), and applies automatic recovery actions such as forcing local routing or fallback defaults.

**Nodes Involved:**  
- Error Handler & Recovery

**Node Details:**

- **Error Handler & Recovery**  
  - Type: `n8n-nodes-base.code`  
  - Role: Detects errors in processing and compliance, logs them with severity, and executes fallbacks to maintain privacy and workflow continuity.  
  - Configuration: JavaScript with try-catch for error classification and recovery logic.  
  - Input: Audit-logged messages.  
  - Output: Messages with error handling metadata and updated routing if needed.  
  - Version: 2  
  - Edge cases: Unexpected runtime exceptions cause fallback to safe defaults with critical severity.  
  - Logs detailed error reports and recovery statistics.

---

#### 2.6 Real-time Monitoring & Alerting

**Overview:**  
Aggregates and reports system metrics on performance, security, compliance, and overall system health. Generates alerts for critical issues such as PII leakage and compliance violations.

**Nodes Involved:**  
- Real-time Monitoring Dashboard

**Node Details:**

- **Real-time Monitoring Dashboard**  
  - Type: `n8n-nodes-base.code`  
  - Role: Collects metrics from processed messages, evaluates against thresholds, and outputs alerts and detailed dashboard logs.  
  - Configuration: JavaScript calculating averages, compliance scores, error rates, and generating console logs with alert details.  
  - Input: Messages post error handling.  
  - Output: Messages enriched with monitoring metrics and alert lists.  
  - Version: 2  
  - Edge cases: Metrics accuracy depends on input completeness; alert thresholds configurable by code edits.

---

#### 2.7 AI Agents Processing

**Overview:**  
Processes the chat messages through AI language models, selecting between local/private and cloud/edge agents based on routing decisions.

**Nodes Involved:**  
- Agent [Edge]  
- AI Agent [Private]  
- Ollama Chat Model  
- OpenRouter Chat Model  
- Simple Memory

**Node Details:**

- **Agent [Edge]**  
  - Type: `@n8n/n8n-nodes-langchain.agent`  
  - Role: Handles AI processing for messages routed as clean or cloud-safe.  
  - Configuration: Uses OpenRouter Chat Model for language model calls; integrates Simple Memory for conversation context with 50-message window.  
  - Inputs: Messages routed as clean/cloud processing.  
  - Outputs: AI-generated responses.  
  - Version: 2  
  - Edge cases: Model availability, rate limits, and response latency.

- **AI Agent [Private]**  
  - Type: `@n8n/n8n-nodes-langchain.agent`  
  - Role: Processes sensitive or high-risk messages locally with masked inputs to prevent data leakage.  
  - Configuration: Uses Ollama Chat Model (Llama 2 7b) as local/private model; takes masked message text as input.  
  - Inputs: Messages routed as local processing.  
  - Outputs: AI-generated responses.  
  - Version: 2  
  - Edge cases: Model availability, hardware constraints for local inference.

- **Ollama Chat Model**  
  - Type: `@n8n/n8n-nodes-langchain.lmChatOllama`  
  - Role: Language model integration for private AI agent.  
  - Configuration: Model set to “llama2:7b”.  
  - Inputs/Outputs: Linked to AI Agent [Private].  
  - Version: 1

- **OpenRouter Chat Model**  
  - Type: `@n8n/n8n-nodes-langchain.lmChatOpenRouter`  
  - Role: Language model integration for edge AI agent.  
  - Configuration: Default options; requires OpenRouter credentials.  
  - Inputs/Outputs: Linked to Agent [Edge].  
  - Version: 1

- **Simple Memory**  
  - Type: `@n8n/n8n-nodes-langchain.memoryBufferWindow`  
  - Role: Maintains conversation history with a 50-message context window to enhance AI interaction quality.  
  - Configuration: Context window length set to 50 messages.  
  - Inputs: From Agent [Edge].  
  - Outputs: Back into Agent [Edge].  
  - Version: 1.3

---

### 3. Summary Table

| Node Name                   | Node Type                             | Functional Role                              | Input Node(s)             | Output Node(s)                  | Sticky Note                                                                                      |
|-----------------------------|-------------------------------------|----------------------------------------------|---------------------------|---------------------------------|------------------------------------------------------------------------------------------------|
| When chat message received  | @n8n/n8n-nodes-langchain.chatTrigger | Entry point for incoming chat messages       | -                         | Enhanced PII Pattern Analyzer   | Privacy-Minded Router: Enhanced PII Detection Workflow Concept [START HERE]                    |
| Enhanced PII Pattern Analyzer | n8n-nodes-base.code                  | Detects PII, scores risk, masks sensitive data | When chat message received | Enhanced PII Routing Switch     | Enhanced PII Pattern Analyzer 🧠 - detailed explanation of PII detection and masking          |
| Enhanced PII Routing Switch  | n8n-nodes-base.switch                | Routes messages based on PII severity & risk | Enhanced PII Pattern Analyzer | Compliance & Audit Logger (2 outputs), Agent [Edge] (clean data path) | Enhanced PII Routing Switch 📊 - routing decision logic explained                               |
| Compliance & Audit Logger    | n8n-nodes-base.code                  | Logs anonymized audit trails for compliance  | Enhanced PII Routing Switch | Error Handler & Recovery        | Compliance & Audit Logger 📋 - audit trail and compliance monitoring details                   |
| Error Handler & Recovery     | n8n-nodes-base.code                  | Handles errors and applies recovery strategies | Compliance & Audit Logger  | Real-time Monitoring Dashboard  | Error Handler & Recovery 🛠️ - error detection and fallback mechanisms                          |
| Real-time Monitoring Dashboard | n8n-nodes-base.code                  | Aggregates metrics and generates system alerts | Error Handler & Recovery   | AI Agent [Private]              | Real-time Monitoring Dashboard 📊 - metrics and alerting system overview                      |
| AI Agent [Private]           | @n8n/n8n-nodes-langchain.agent      | Processes sensitive data with private LLM    | Real-time Monitoring Dashboard | Ollama Chat Model              | A cleaned LLM Request (PII masked)                                                             |
| Ollama Chat Model            | @n8n/n8n-nodes-langchain.lmChatOllama | Private large language model                  | AI Agent [Private]         | -                               |                                                                                                |
| Agent [Edge]                 | @n8n/n8n-nodes-langchain.agent      | Processes clean or cloud-routed data          | Enhanced PII Routing Switch, Simple Memory | Simple Memory, OpenRouter Chat Model |                                                                                                |
| OpenRouter Chat Model        | @n8n/n8n-nodes-langchain.lmChatOpenRouter | Cloud AI language model                        | Agent [Edge]               | -                               |                                                                                                |
| Simple Memory                | @n8n/n8n-nodes-langchain.memoryBufferWindow | Maintains conversation context for edge agent | Agent [Edge]               | Agent [Edge]                    |                                                                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Chat Trigger Node**  
   - Name: "When chat message received"  
   - Type: `@n8n/n8n-nodes-langchain.chatTrigger`  
   - Configure webhook to receive user chat messages.

2. **Add Enhanced PII Pattern Analyzer (Code Node)**  
   - Name: "Enhanced PII Pattern Analyzer"  
   - Type: `n8n-nodes-base.code`  
   - Paste the JavaScript code that defines PII regexes, confidence levels, masking logic, context detection, risk scoring, and routing decisions.  
   - Input: Connect from "When chat message received".  
   - Output: Pass annotated messages downstream.

3. **Add Enhanced PII Routing Switch**  
   - Name: "Enhanced PII Routing Switch"  
   - Type: `n8n-nodes-base.switch`  
   - Configure three outputs with conditions:  
     - Output 1: If `highestSeverity == 'critical'` → "Critical PII - Local Only"  
     - Output 2: If `piiDetected == true` or `riskScore >= 1.5` or context in ['medical', 'financial'] → "PII Detected - Local Processing"  
     - Output 3: If `piiDetected == false` → "Clean - Cloud Processing"  
   - Input: Connect from "Enhanced PII Pattern Analyzer".

4. **Add Compliance & Audit Logger (Code Node)**  
   - Name: "Compliance & Audit Logger"  
   - Type: `n8n-nodes-base.code`  
   - Implement JavaScript to generate anonymized audit logs including session IDs, message IDs, routing info, risk scores, compliance flags, and processing metrics.  
   - Input: Connect from all outputs of "Enhanced PII Routing Switch" except clean cloud processing output, which routes directly to "Agent [Edge]".

5. **Add Error Handler & Recovery (Code Node)**  
   - Name: "Error Handler & Recovery"  
   - Type: `n8n-nodes-base.code`  
   - Implement error detection for processing errors, PII detection failures, and compliance violations. Apply fallback logic such as forcing local routing.  
   - Input: Connect from "Compliance & Audit Logger".

6. **Add Real-time Monitoring Dashboard (Code Node)**  
   - Name: "Real-time Monitoring Dashboard"  
   - Type: `n8n-nodes-base.code`  
   - Aggregate metrics on performance, security, compliance, and system health. Generate alerts for critical conditions logged in the console.  
   - Input: Connect from "Error Handler & Recovery".

7. **Configure AI Agents:**  
   - **Agent [Edge]**  
     - Type: `@n8n/n8n-nodes-langchain.agent`  
     - Connected to "Enhanced PII Routing Switch" output for clean cloud processing.  
     - Connect to "Simple Memory" and "OpenRouter Chat Model".  
     - Configure OpenRouter credentials for cloud LLM access.

   - **Simple Memory Node**  
     - Type: `@n8n/n8n-nodes-langchain.memoryBufferWindow`  
     - Context window length: 50 messages.  
     - Connect input and output to/from "Agent [Edge]".

   - **OpenRouter Chat Model Node**  
     - Type: `@n8n/n8n-nodes-langchain.lmChatOpenRouter`  
     - Configure with OpenRouter API credentials.  
     - Connect output to "Agent [Edge]".

   - **AI Agent [Private]**  
     - Type: `@n8n/n8n-nodes-langchain.agent`  
     - Connected from "Real-time Monitoring Dashboard" output.  
     - Input: Use masked message text from PII analyzer result.  
     - Connect to "Ollama Chat Model".

   - **Ollama Chat Model Node**  
     - Type: `@n8n/n8n-nodes-langchain.lmChatOllama`  
     - Model: "llama2:7b".  
     - Configure Ollama credentials for local/private LLM access.

8. **Wiring and Execution Order:**  
   - Start with "When chat message received" → "Enhanced PII Pattern Analyzer" → "Enhanced PII Routing Switch".  
   - From routing switch:  
     - Critical and standard PII paths → "Compliance & Audit Logger" → "Error Handler & Recovery" → "Real-time Monitoring Dashboard" → "AI Agent [Private]" → "Ollama Chat Model".  
     - Clean path → "Agent [Edge]" → "Simple Memory" → "OpenRouter Chat Model".  
   - Enable proper saving of execution data and error handling on all nodes.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Context or Link                                                                                               |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| This workflow was developed by Charles Oh (https://www.linkedin.com/in/codetender/) as a starter framework for privacy-minded AI processing workflows focused on compliance and security. It is a living concept and demonstration only, not a guaranteed compliance solution.                                                                                                                                                                                                                                               | LinkedIn profile of author                                                                                     |
| Architectural overview and detailed explanations of PII detection, routing logic, audit logging, error handling, and monitoring are provided in attached sticky notes within the workflow. These notes explain the rationale behind design choices and provide example outputs.                                                                                                                                                                                                                                           | See sticky notes in workflow JSON for detailed explanations                                                  |
| Potential use cases include Healthcare (HIPAA compliance), Financial Services (PCI, SOX compliance), Legal (attorney-client privilege), and Enterprise data governance scenarios.                                                                                                                                                                                                                                                                                                                                         | Use case examples described in sticky notes                                                                  |
| Routing decisions leverage a granular risk scoring algorithm based on PII pattern confidence and count, combined with context-aware classification to avoid simple binary decisions.                                                                                                                                                                                                                                                                                                                                    | See Enhanced PII Pattern Analyzer and Routing Switch notes                                                    |
| Monitoring includes real-time alerts for PII leakage risks, compliance violations, and performance degradation, enabling proactive operational management.                                                                                                                                                                                                                                                                                                                                                               | Monitoring dashboard node JavaScript and sticky notes                                                        |
| AI agents are split between local/private models (Ollama Llama 2) for sensitive data and cloud models (OpenRouter) for clean data, optimizing both security and performance.                                                                                                                                                                                                                                                                                                                                             | AI Agent nodes and model integrations                                                                        |
| Developers must configure credentials for OpenRouter and Ollama models separately in n8n credentials manager before workflow execution.                                                                                                                                                                                                                                                                                                                                                                                 | Credential configuration required for LLM nodes                                                              |

---

**Disclaimer:**  
The provided content is derived solely from an automated workflow created with n8n, a tool for integration and automation. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.