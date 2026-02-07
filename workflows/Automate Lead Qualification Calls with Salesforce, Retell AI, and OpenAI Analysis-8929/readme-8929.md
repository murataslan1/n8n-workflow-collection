Automate Lead Qualification Calls with Salesforce, Retell AI, and OpenAI Analysis

https://n8nworkflows.xyz/workflows/automate-lead-qualification-calls-with-salesforce--retell-ai--and-openai-analysis-8929


# Automate Lead Qualification Calls with Salesforce, Retell AI, and OpenAI Analysis

### 1. Workflow Overview

This workflow automates lead qualification calls triggered by new lead creation events in Salesforce. It uses Retell AI to initiate and manage phone calls, OpenAI to analyze call transcripts, and Salesforce to create follow-up tasks enriched with AI-generated insights. The workflow is designed to streamline and accelerate the lead qualification process by combining telephony automation with advanced AI analysis, enabling sales teams to focus on qualified prospects efficiently.

The workflow’s logical structure is divided into the following blocks:

- **1.1 Input Reception:** Receives new lead data from Salesforce via webhook.
- **1.2 Automated Calling:** Initiates a phone call to the lead using Retell AI.
- **1.3 Call Monitoring:** Polls Retell AI to check call status until completion.
- **1.4 AI Analysis:** Sends the completed call transcript to OpenAI to extract insights.
- **1.5 Salesforce Integration:** Creates a follow-up task in Salesforce with the analysis results.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
This block receives incoming lead data from Salesforce when a new lead is created. It acts as the entry point for the workflow.

**Nodes Involved:**  
- 🔗 Receive Salesforce Lead

**Node Details:**  

- **🔗 Receive Salesforce Lead**  
  - Type: Webhook  
  - Role: Entry point receiving HTTP POST requests from Salesforce containing lead data.  
  - Configuration: Configured with a unique webhook path `salesforce-lead`. HTTP method is POST. No additional options set.  
  - Expressions/Variables: The lead’s phone number is extracted from `{{$json.body.Phone}}` for downstream use.  
  - Input: External HTTP POST from Salesforce.  
  - Output: JSON payload containing lead details including phone number.  
  - Edge Cases:  
    - Missing or malformed lead data could cause downstream failures.  
    - Salesforce must be configured to send lead data to this webhook URL.  
    - Authentication/verification of incoming requests is not explicitly configured, which could be a security consideration.

---

#### 1.2 Automated Calling

**Overview:**  
This block initiates an automated phone call to the new lead’s phone number using the Retell AI service.

**Nodes Involved:**  
- 📞 Start Retell AI Call

**Node Details:**  

- **📞 Start Retell AI Call**  
  - Type: HTTP Request  
  - Role: Sends a POST request to Retell AI’s API to create a phone call.  
  - Configuration:  
    - URL: `https://api.retellai.com/v2/create-phone-call`  
    - Method: POST  
    - Body Parameters:  
      - `from_number`: Your Retell AI phone number (to be replaced by user).  
      - `to_number`: Lead’s phone number extracted dynamically (`={{$json.body.Phone}}`).  
      - `agent_id`: Retell AI agent ID (to be replaced by user).  
    - Headers: Authorization with Bearer token from Retell AI credentials; Content-Type application/json.  
    - Authentication: HTTP Header Auth with Retell AI API key.  
  - Input: Lead data from webhook node.  
  - Output: JSON containing call details including a unique `call_id`.  
  - Edge Cases:  
    - API key authentication failures (invalid or missing keys).  
    - Invalid phone numbers or missing `to_number`.  
    - Retell AI service unavailability or timeouts.  
    - Incorrect `agent_id` or `from_number` causing call creation failure.

---

#### 1.3 Call Monitoring

**Overview:**  
This block continuously polls Retell AI’s API to check the status of the initiated call until it is completed.

**Nodes Involved:**  
- 🔍 Check Call Status  
- ❓ Is Call Complete?  
- ⏱️ Wait 10 Seconds

**Node Details:**  

- **🔍 Check Call Status**  
  - Type: HTTP Request  
  - Role: Retrieves real-time status of the call from Retell AI using the `call_id`.  
  - Configuration:  
    - URL dynamically constructed as `https://api.retellai.com/v2/get-call/${call_id}` where `call_id` is from the previous node’s output.  
    - Method: GET (default implied).  
    - Headers: Authorization with Bearer token from Retell AI credentials.  
    - Full HTTP response is retained for detailed inspection if needed.  
  - Input: Output from “Start Retell AI Call” or “Wait 10 Seconds” node.  
  - Output: JSON with `call_status` field among other call details.  
  - Edge Cases:  
    - API authentication errors.  
    - Call ID not found or expired.  
    - Network timeout or service downtime.

- **❓ Is Call Complete?**  
  - Type: IF Node  
  - Role: Checks if the call status returned from the previous node equals `ended`.  
  - Configuration:  
    - Condition: `{{$json.body.call_status}} === "ended"`  
  - Input: Output of “Check Call Status” node.  
  - Output:  
    - True branch proceeds to AI analysis.  
    - False branch triggers wait and retry.  
  - Edge Cases:  
    - Missing or malformed `call_status` field.  
    - Other call statuses (e.g., failed, busy) are not explicitly handled.

- **⏱️ Wait 10 Seconds**  
  - Type: Wait  
  - Role: Pauses workflow execution for 10 seconds before rechecking the call status.  
  - Configuration: Wait for 10 seconds.  
  - Input: False branch of IF node.  
  - Output: Triggers “Check Call Status” node again.  
  - Edge Cases:  
    - Prolonged call durations may result in many polling cycles. Consider max retry limits in production.

---

#### 1.4 AI Analysis

**Overview:**  
Once the call is completed, this block sends the call transcript to OpenAI to extract structured insights for sales follow-up.

**Nodes Involved:**  
- 🎯 Analyze Call Transcript  
- 🤖 OpenAI Chat Model

**Node Details:**  

- **🎯 Analyze Call Transcript**  
  - Type: Langchain Agent Node  
  - Role: Prepares and sends a prompt to OpenAI to analyze the call transcript using a professional sales summarization assistant persona.  
  - Configuration:  
    - Text prompt includes:  
      - Call ID  
      - Call transcript (from `{{$json.body.transcript}}`)  
      - Request for structured JSON output with keys: purpose, keyDiscussionPoints, leadResponses, nextActions, overallOutcome.  
    - Uses the “define” prompt type to specify expected output format.  
  - Input: Output from IF node’s True branch (call ended) containing call transcript.  
  - Output: AI-generated structured JSON analysis.  
  - Edge Cases:  
    - Missing or incomplete transcript data.  
    - OpenAI API key errors or rate limits.  
    - Unexpected output formatting from AI.

- **🤖 OpenAI Chat Model**  
  - Type: Langchain OpenAI Chat Model Node  
  - Role: Executes the GPT-3.5-turbo model to process the prompt from the “Analyze Call Transcript” node.  
  - Configuration:  
    - Model: gpt-3.5-turbo, chosen for cost-effectiveness.  
    - No additional options configured.  
  - Input: From “Analyze Call Transcript” node as AI language model backend.  
  - Output: Processed AI response passed back to “Analyze Call Transcript”.  
  - Edge Cases:  
    - OpenAI service downtime or API quota exceeded.

---

#### 1.5 Salesforce Integration

**Overview:**  
This block creates a follow-up task in Salesforce with the AI-generated analysis results, facilitating prompt sales action.

**Nodes Involved:**  
- 📝 Create Salesforce Task

**Node Details:**  

- **📝 Create Salesforce Task**  
  - Type: Salesforce Node  
  - Role: Creates a new Task record in Salesforce.  
  - Configuration:  
    - Resource: Task  
    - Status: Not Started  
    - Additional Fields:  
      - Type: Call  
      - Subject: “Lead Qualification Call Analysis - [current timestamp]” dynamically generated.  
      - Description: Populated with the AI analysis JSON output from previous node.  
    - Execution set to run once per trigger.  
  - Input: Output from “Analyze Call Transcript” node.  
  - Output: Salesforce API response, confirmation of task creation.  
  - Credentials: OAuth2 connection to Salesforce with adequate permissions for task creation.  
  - Edge Cases:  
    - Salesforce authentication/authorization failures.  
    - Permission issues on Task creation.  
    - Malformed description data causing API errors.

---

### 3. Summary Table

| Node Name                 | Node Type                     | Functional Role                           | Input Node(s)                 | Output Node(s)                  | Sticky Note                                                                                          |
|---------------------------|-------------------------------|------------------------------------------|------------------------------|--------------------------------|----------------------------------------------------------------------------------------------------|
| StickyNote                | Sticky Note                   | Overview and general information          | -                            | -                              | ## 🎯 Salesforce AI Voice Sales Agent for Lead Management ... Setup time: ~30 minutes ... Author: Sri Kolagani |
| StickyNote1               | Sticky Note                   | Annotation for step 1 (Receive Lead Data) | -                            | -                              | ### 📞 Step 1: Receive Lead Data ... Webhook receives lead info from Salesforce                      |
| 🔗 Receive Salesforce Lead | Webhook                      | Entry point receiving new Salesforce leads | -                            | 📞 Start Retell AI Call         | ### 📞 Step 1: Receive Lead Data ... Webhook receives lead info from Salesforce                      |
| StickyNote2               | Sticky Note                   | Annotation for step 2 (Initiate Phone Call) | -                            | -                              | ### 📱 Step 2: Initiate Phone Call ... Setup Required: Retell AI API key, from_number, agent_id      |
| 📞 Start Retell AI Call    | HTTP Request                  | Initiates Retell AI phone call            | 🔗 Receive Salesforce Lead     | 🔍 Check Call Status            | ### 📱 Step 2: Initiate Phone Call ... Setup Required: Retell AI API key, from_number, agent_id      |
| StickyNote3               | Sticky Note                   | Annotation for step 3 (Monitor Call Status) | -                            | -                              | ### ⏱️ Step 3: Monitor Call Status ... Polls Retell AI API to check call end                        |
| 🔍 Check Call Status       | HTTP Request                  | Polls Retell AI API for call status       | 📞 Start Retell AI Call, ⏱️ Wait 10 Seconds | ❓ Is Call Complete?              | ### ⏱️ Step 3: Monitor Call Status ... Polls Retell AI API to check call end                        |
| StickyNote4               | Sticky Note                   | Annotation for step 4 (Call Completion Check) | -                            | -                              | ### ✅ Step 4: Call Completion Check ... Verifies if call ended before AI analysis                  |
| ❓ Is Call Complete?        | IF                           | Checks if call_status equals "ended"      | 🔍 Check Call Status           | 🎯 Analyze Call Transcript (true), ⏱️ Wait 10 Seconds (false) | ### ✅ Step 4: Call Completion Check ... Verifies if call ended before AI analysis                  |
| StickyNote5               | Sticky Note                   | Annotation for wait and retry loop         | -                            | -                              | ### ⏳ Wait & Retry ... Waits 10 seconds before rechecking call status                              |
| ⏱️ Wait 10 Seconds         | Wait                         | Pause before retrying call status check    | ❓ Is Call Complete? (false)   | 🔍 Check Call Status            | ### ⏳ Wait & Retry ... Waits 10 seconds before rechecking call status                              |
| StickyNote6               | Sticky Note                   | Annotation for step 5 (AI Call Analysis)   | -                            | -                              | ### 🧠 Step 5: AI Call Analysis ... OpenAI analyzes transcript; Setup Required: OpenAI API key      |
| 🤖 OpenAI Chat Model       | Langchain OpenAI Chat Model  | Executes GPT-3.5-turbo model for analysis  | 🎯 Analyze Call Transcript     | 🎯 Analyze Call Transcript      | ### 🧠 Step 5: AI Call Analysis ... OpenAI analyzes transcript; Setup Required: OpenAI API key      |
| 🎯 Analyze Call Transcript | Langchain Agent              | Prepares and sends prompt for AI summarization | ❓ Is Call Complete? (true), 🤖 OpenAI Chat Model | 📝 Create Salesforce Task      | ### 🧠 Step 5: AI Call Analysis ... OpenAI analyzes transcript; Setup Required: OpenAI API key      |
| StickyNote7               | Sticky Note                   | Annotation for step 6 (Create Salesforce Task) | -                            | -                              | ### 📋 Step 6: Create Follow-up Task ... Connect Salesforce OAuth2; ensure permissions              |
| 📝 Create Salesforce Task  | Salesforce                   | Creates follow-up task with AI insights    | 🎯 Analyze Call Transcript     | -                              | ### 📋 Step 6: Create Follow-up Task ... Connect Salesforce OAuth2; ensure permissions              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Webhook Node**  
   - Name: `🔗 Receive Salesforce Lead`  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: `salesforce-lead`  
   - No authentication configured (consider adding verification in production).

2. **Create HTTP Request Node to Initiate Retell AI Call**  
   - Name: `📞 Start Retell AI Call`  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://api.retellai.com/v2/create-phone-call`  
   - Body Parameters (JSON):  
     - `from_number`: Replace with your Retell AI phone number  
     - `to_number`: Set expression to `{{$json.body.Phone}}` to use phone from Salesforce lead  
     - `agent_id`: Replace with your Retell agent ID  
   - Headers:  
     - Authorization: `Bearer {{$credentials.retellAI.apiKey}}`  
     - Content-Type: `application/json`  
   - Authentication: HTTP Header Auth with Retell AI API key credentials  
   - Connect input from `🔗 Receive Salesforce Lead`.

3. **Create HTTP Request Node to Check Call Status**  
   - Name: `🔍 Check Call Status`  
   - Type: HTTP Request  
   - Method: GET  
   - URL: Use expression: ``https://api.retellai.com/v2/get-call/${$node["📞 Start Retell AI Call"].json.call_id}``  
   - Headers:  
     - Authorization: `Bearer {{$credentials.retellAI.apiKey}}`  
   - Authentication: HTTP Header Auth with Retell AI API key credentials  
   - No body parameters.  
   - Connect input from `📞 Start Retell AI Call` (initial call) and from the Wait node (for retries).

4. **Create IF Node to Check Call Completion**  
   - Name: `❓ Is Call Complete?`  
   - Type: IF  
   - Condition: Check if `{{$json.body.call_status}}` equals `"ended"`  
   - Connect input from `🔍 Check Call Status`.  
   - True branch proceeds to AI analysis; False branch triggers wait.

5. **Create Wait Node for Polling Delay**  
   - Name: `⏱️ Wait 10 Seconds`  
   - Type: Wait  
   - Duration: 10 seconds  
   - Connect input from IF node’s False branch (call not ended).  
   - Output connects back to `🔍 Check Call Status` for re-polling.

6. **Create Langchain OpenAI Chat Model Node**  
   - Name: `🤖 OpenAI Chat Model`  
   - Type: Langchain OpenAI Chat Model  
   - Model: `gpt-3.5-turbo`  
   - Configure credentials with your OpenAI API key.

7. **Create Langchain Agent Node for Analysis**  
   - Name: `🎯 Analyze Call Transcript`  
   - Type: Langchain Agent  
   - Prompt:  
     ```
     You are a professional sales call summarization assistant.

     Call ID: {{$json["body"]["call_id"]}}

     Transcript:
     {{$json["body"]["transcript"]}}

     Please return a structured JSON with the following keys:
     - purpose: Brief description of the call's purpose
     - keyDiscussionPoints: Main topics discussed (array)
     - leadResponses: Lead's key responses and interest level
     - nextActions: Recommended follow-up actions (array)
     - overallOutcome: Success/failure assessment with reasoning
     ```  
   - Prompt Type: Define (structured output expected)  
   - Connect AI language model input from `🤖 OpenAI Chat Model`.  
   - Connect input from IF node’s True branch (call ended).

8. **Create Salesforce Node to Create Task**  
   - Name: `📝 Create Salesforce Task`  
   - Type: Salesforce  
   - Resource: Task  
   - Operation: Create (default)  
   - Parameters:  
     - Status: Not Started  
     - Type: Call  
     - Subject: Use expression: `Lead Qualification Call Analysis - {{ $now.toFormat('yyyy-MM-dd HH:mm') }}`  
     - Description: AI analysis output `{{$json.output}}`  
   - Configure OAuth2 credentials to connect to Salesforce with appropriate permissions (Task creation).  
   - Connect input from `🎯 Analyze Call Transcript`.

9. **Create Sticky Notes (Optional but Recommended for Clarity)**  
   - Add sticky notes at each major step explaining purpose, setup requirements, and notes on credentials.

10. **Set Execution Order and Activate Workflow**  
    - Ensure nodes are connected as per above steps.  
    - Test with sample Salesforce lead data and validate integration points.  
    - Monitor Retell AI and OpenAI usage for quota and costs.

---

### 5. General Notes & Resources

| Note Content                                                                                                                      | Context or Link                                                                                                  |
|----------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------|
| Workflow authored by Sri Kolagani.                                                                                              | Author credit in main sticky note.                                                                              |
| Workflow requires Salesforce org with lead creation trigger configured to POST to n8n webhook.                                  | Salesforce setup prerequisite.                                                                                   |
| Retell AI account and agent setup required; user must configure API key, phone number, and agent ID in credentials and node.    | Retell AI setup prerequisite, detailed in sticky notes.                                                         |
| OpenAI API key and GPT-3.5-turbo model used for cost-effective AI analysis.                                                      | OpenAI setup prerequisite, detailed in sticky notes.                                                           |
| Salesforce OAuth2 connection must have permission to create Tasks.                                                              | Salesforce setup prerequisite for task creation.                                                                |
| Polling for call completion uses a 10-second wait loop; consider adding max retry to avoid endless loops in production.         | Operational consideration to prevent infinite polling.                                                          |
| Security note: Incoming webhook does not have explicit authentication; consider adding verification to prevent unauthorized calls. | Security best practice recommendation.                                                                           |
| Retell AI API documentation: https://docs.retellai.com/api-reference                                                            | Useful reference for API parameters and error codes.                                                            |
| OpenAI API documentation: https://platform.openai.com/docs                                                                        | Reference for prompt design and API usage.                                                                       |
| Salesforce REST API and n8n Salesforce node docs: https://developer.salesforce.com/docs and https://docs.n8n.io/integrations/builtin/nodes/n8n-nodes-base.salesforce/ | For configuring Salesforce node and OAuth2 credentials.                                                        |

---

This document provides a thorough, stepwise understanding and reconstruction guide for the “Automate Lead Qualification Calls from Salesforce to Retell AI with OpenAI analysis” workflow, enabling advanced users and AI agents to operate, modify, and troubleshoot it effectively.