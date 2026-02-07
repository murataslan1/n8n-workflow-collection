AI-Powered Lead Scoring with Salesforce, GPT-4o, and Slack with Data Masking

https://n8nworkflows.xyz/workflows/ai-powered-lead-scoring-with-salesforce--gpt-4o--and-slack-with-data-masking-4592


# AI-Powered Lead Scoring with Salesforce, GPT-4o, and Slack with Data Masking

### 1. Workflow Overview

This workflow automates **AI-powered lead scoring** by integrating Salesforce lead data with GPT-4o (OpenAI), Slack notifications, and built-in data masking/unmasking for privacy compliance. It triggers on Salesforce lead updates, processes each lead individually through an AI scoring model, masks sensitive data during API calls, unmasks results before communication, and finally sends the scored lead info to Slack for team visibility.

Logical blocks in the workflow:

- **1.1 Salesforce Lead Trigger and Batch Processing**: Captures Salesforce Lead updates and splits them for sequential processing.
- **1.2 Data Masking and API Preparation**: Masks sensitive lead data before sending to the AI model.
- **1.3 AI Lead Scoring via OpenAI GPT-4o**: Sends masked lead data to OpenAI for scoring.
- **1.4 Data Unmasking and Slack Notification**: Unmasks the AI output and delivers notifications to Slack.

---

### 2. Block-by-Block Analysis

#### 1.1 Salesforce Lead Trigger and Batch Processing

- **Overview:**  
  Initiates the workflow upon Salesforce lead events and splits incoming lead data into manageable batches for processing.

- **Nodes Involved:**  
  - Salesforce Trigger  
  - Loop Over Items (SplitInBatches)

- **Node Details:**

  1. **Salesforce Trigger**  
     - Type: Trigger node for Salesforce events  
     - Configuration: Listens for Lead object changes (default parameters, no filters specified)  
     - Inputs: External event from Salesforce  
     - Outputs: Triggered lead data objects  
     - Edge Cases: Possible failures include Salesforce API connectivity issues, permission errors, or empty triggers if no lead changes occur  
     - Version: v1

  2. **Loop Over Items (SplitInBatches)**  
     - Type: Batch processing node splitting input data into individual lead items  
     - Configuration: Default batch size (unspecified), processes one lead at a time  
     - Inputs: Triggered lead data from Salesforce Trigger  
     - Outputs: Single lead records per batch to next node  
     - Edge Cases: Batch size of zero or too large could cause memory or timeout issues  
     - Version: v3

---

#### 1.2 Data Masking and API Preparation

- **Overview:**  
  Masks sensitive lead information (e.g., email, address) before sending data to external AI service, ensuring compliance with data privacy standards.

- **Nodes Involved:**  
  - HTTP Request  
  - MASK DATA (Code node)

- **Node Details:**

  1. **HTTP Request**  
     - Type: HTTP client node used to prepare or enrich data before masking (exact API not specified)  
     - Configuration: Unspecified URL and method; likely used to fetch or post data as intermediate step  
     - Inputs: Batched lead data from Loop Over Items (second output)  
     - Outputs: Data passed to MASK DATA node  
     - Edge Cases: HTTP errors (timeouts, 4xx/5xx status), invalid response data, connectivity issues  
     - Version: v4.2  
     - Note: `alwaysOutputData` set to false, so empty responses could halt downstream processing  

  2. **MASK DATA (Code node)**  
     - Type: Custom JavaScript code node  
     - Configuration: Executes data masking logic on lead PII fields (e.g., partial obfuscation or tokenization)  
     - Inputs: HTTP Request node output  
     - Outputs: Masked lead data to OpenAI node  
     - Edge Cases: Code errors, improper masking logic causing data leaks or loss  
     - Version: v2

---

#### 1.3 AI Lead Scoring via OpenAI GPT-4o

- **Overview:**  
  Sends masked lead data to OpenAI’s GPT-4o model for advanced lead scoring based on lead attributes.

- **Nodes Involved:**  
  - OpenAI

- **Node Details:**

  1. **OpenAI**  
     - Type: Langchain OpenAI node, executes GPT-4o calls  
     - Configuration: Uses GPT-4o model with appropriate prompt templates to score leads  
     - Inputs: Masked data from MASK DATA node  
     - Outputs: AI-generated lead scores and insights  
     - Credentials: Requires OpenAI API key configured in n8n  
     - Edge Cases: API rate limits, invalid API keys, prompt failures, unexpected model outputs  
     - Version: v1.8

---

#### 1.4 Data Unmasking and Slack Notification

- **Overview:**  
  Unmasks AI output to restore readable data (if necessary) and sends the scored lead information to a Slack channel via webhook.

- **Nodes Involved:**  
  - UNMASK Data (Code node)  
  - Slack

- **Node Details:**

  1. **UNMASK Data (Code node)**  
     - Type: Custom JavaScript code node  
     - Configuration: Reverses masking on AI output to display relevant PII or lead details in Slack  
     - Inputs: OpenAI node output  
     - Outputs: Unmasked lead scoring result to Slack  
     - Edge Cases: Code errors, partial unmasking, data mismatch leading to incorrect display  
     - Version: v2

  2. **Slack**  
     - Type: Slack node to send messages via webhook  
     - Configuration: Uses pre-configured Slack webhook ID to post messages  
     - Inputs: Unmasked lead scoring data  
     - Outputs: None (terminal node)  
     - Credentials: Slack webhook configured in n8n  
     - Edge Cases: Webhook invalidation, network issues, rate limiting  
     - Version: v2.3

---

### 3. Summary Table

| Node Name         | Node Type                        | Functional Role                   | Input Node(s)       | Output Node(s)     | Sticky Note                          |
|-------------------|---------------------------------|---------------------------------|---------------------|--------------------|------------------------------------|
| Salesforce Trigger | Salesforce Trigger              | Initiate workflow on lead event | -                   | Loop Over Items    |                                    |
| Loop Over Items    | SplitInBatches                 | Batch lead records for processing| Salesforce Trigger  | HTTP Request (2nd output), Slack (1st output) |                                    |
| HTTP Request      | HTTP Request                   | Prepare/enrich data before masking| Loop Over Items (2nd output) | MASK DATA          |                                    |
| MASK DATA         | Code                          | Mask sensitive lead data         | HTTP Request        | OpenAI             |                                    |
| OpenAI            | Langchain OpenAI               | AI lead scoring with GPT-4o      | MASK DATA           | UNMASK Data        |                                    |
| UNMASK Data       | Code                          | Unmask AI output data            | OpenAI              | Slack              |                                    |
| Slack             | Slack                         | Send scored lead notification    | UNMASK Data         | -                  |                                    |
| Sticky Note       | Sticky Note                   | -                               | -                   | -                  |                                    |
| Sticky Note1      | Sticky Note                   | -                               | -                   | -                  |                                    |
| Sticky Note2      | Sticky Note                   | -                               | -                   | -                  |                                    |
| Sticky Note3      | Sticky Note                   | -                               | -                   | -                  |                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Salesforce Trigger Node**  
   - Type: Salesforce Trigger  
   - Configure to trigger on Lead records (default event types: create/update)  
   - Connect no input; output connects to next node

2. **Create Loop Over Items Node (SplitInBatches)**  
   - Type: SplitInBatches  
   - Default batch size (usually 1) to process each lead individually  
   - Connect input from Salesforce Trigger output  
   - Has two outputs: main and secondary (for parallel flow)

3. **Create HTTP Request Node**  
   - Type: HTTP Request  
   - Connect input from second output of Loop Over Items node  
   - Configure API endpoint and method as required (URL unspecified, insert your API if needed)  
   - Make sure `alwaysOutputData` is false (default)  
   - This node prepares or enriches data before masking

4. **Create MASK DATA Node (Code)**  
   - Type: Code (JavaScript)  
   - Connect input from HTTP Request node output  
   - Implement logic to mask sensitive fields (e.g., replace emails with tokens, redact addresses)  
   - Output masked data for AI processing

5. **Create OpenAI Node (Langchain OpenAI)**  
   - Type: Langchain OpenAI node  
   - Connect input from MASK DATA node output  
   - Configure with OpenAI API credentials (API key)  
   - Set model to GPT-4o  
   - Define prompt to score leads based on masked data  
   - Set version to 1.8

6. **Create UNMASK Data Node (Code)**  
   - Type: Code (JavaScript)  
   - Connect input from OpenAI node output  
   - Implement logic to unmask or interpret AI output, restoring readable context as needed  
   - Output the processed data for Slack notification

7. **Create Slack Node**  
   - Type: Slack  
   - Connect input from UNMASK Data node output  
   - Configure Slack webhook URL or OAuth2 credentials with webhook access  
   - Set message content to include lead scoring results  
   - Version 2.3

8. **Connect Workflow**  
   - Salesforce Trigger -> Loop Over Items (main output)  
   - Loop Over Items second output -> HTTP Request -> MASK DATA -> OpenAI -> UNMASK Data -> Slack  
   - Loop Over Items main output (first output) -> Slack (direct connection as per JSON, but likely to be via unmasking node; double-check your actual flow)  

9. **Set Credentials**  
   - Salesforce OAuth2 or API credentials in Salesforce Trigger node  
   - OpenAI API key in OpenAI node credentials  
   - Slack webhook or OAuth2 credentials in Slack node

10. **Test Workflow**  
    - Trigger with sample Salesforce Lead update  
    - Verify masking/unmasking correctness  
    - Confirm AI scoring output and Slack notifications

---

### 5. General Notes & Resources

| Note Content                                                            | Context or Link                                     |
|-------------------------------------------------------------------------|----------------------------------------------------|
| Workflow integrates Salesforce, OpenAI GPT-4o, and Slack for lead scoring automation | -                                                  |
| Data masking/unmasking implemented via custom code nodes to protect PII | Critical for GDPR/CCPA compliance                    |
| Slack node uses webhook with ID: 2735d399-4324-4b40-8cd0-539f5c9b6c7e    | Slack webhook configuration details                  |
| Use latest n8n version to ensure compatibility with Langchain OpenAI v1.8 and SplitInBatches v3 | https://docs.n8n.io/nodes/                            |

---

**Disclaimer:**  
The provided text originates exclusively from an n8n automated workflow. It strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data processed is legal and public.