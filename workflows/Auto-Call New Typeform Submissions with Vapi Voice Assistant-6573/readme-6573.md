Auto-Call New Typeform Submissions with Vapi Voice Assistant

https://n8nworkflows.xyz/workflows/auto-call-new-typeform-submissions-with-vapi-voice-assistant-6573


# Auto-Call New Typeform Submissions with Vapi Voice Assistant

### 1. Workflow Overview

This workflow automates outbound phone calls using the Vapi voice assistant triggered by new Typeform submissions that include a phone number. It is designed for use cases where immediate or scheduled voice outreach is desired based on user input from Typeform forms. The workflow processes new form submissions, waits briefly to allow data consistency, sets necessary Vapi API credentials and identifiers, then initiates an outbound call via Vapi’s API.

**Logical blocks:**

- **1.1 Input Reception:** Captures new Typeform form submissions with the phone number field.
- **1.2 Delay Handling:** Introduces a wait period to ensure data readiness or to space out calls.
- **1.3 Vapi Configuration Setup:** Assigns required Vapi API credentials and parameters for the call.
- **1.4 Outbound Call Execution:** Sends an HTTP request to Vapi API to start the voice call using the provided phone number.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  This block listens for new responses submitted to a specified Typeform form. It triggers the workflow whenever a new submission is received.

- **Nodes Involved:**  
  - Typeform Trigger

- **Node Details:**  
  - **Type:** Typeform Trigger  
  - **Role:** Webhook listener for new Typeform responses.  
  - **Configuration:**  
    - Connected to a specific Typeform form identified by form ID `FW7LOAGB`.  
    - Uses stored Typeform personal access token credentials for API authentication.  
  - **Expressions/Variables:**  
    - Extracts submission data including the phone number field (`Phone`) from the Typeform response JSON.  
  - **Inputs:** None (trigger node).  
  - **Outputs:** Data passed to the next node “Wait 2min”.  
  - **Version:** 1.1  
  - **Potential Failures:**  
    - Authentication errors if credentials expire or are revoked.  
    - Webhook registration failures if form ID invalid or network issues.  
  - **Notes:** Requires a Typeform form with a phone number field.

#### 1.2 Delay Handling

- **Overview:**  
  Introduces a fixed 2-minute wait after receiving a Typeform submission, potentially to allow other systems to process data or to prevent rapid successive calls.

- **Nodes Involved:**  
  - Wait 2min

- **Node Details:**  
  - **Type:** Wait  
  - **Role:** Pauses workflow execution for defined duration.  
  - **Configuration:**  
    - Wait time set to 2 minutes.  
  - **Expressions/Variables:** None.  
  - **Inputs:** Receives data from “Typeform Trigger”.  
  - **Outputs:** Passes data unchanged to “Set fields” node.  
  - **Version:** 1.1  
  - **Potential Failures:**  
    - Workflow timeout if global execution time limits are exceeded.  
  - **Notes:** Webhook ID present to enable webhook behavior for trigger.

#### 1.3 Vapi Configuration Setup

- **Overview:**  
  Sets the required Vapi API credentials and identifiers for use in the outbound call API request. This centralizes Vapi parameters.

- **Nodes Involved:**  
  - Set fields

- **Node Details:**  
  - **Type:** Set  
  - **Role:** Defines workflow variables for Vapi API integration.  
  - **Configuration:**  
    - Sets three string fields:  
      - `vapiPhoneNumberId`: The ID of the phone number registered in Vapi to place the call.  
      - `vapiAssistantId`: The ID of the Vapi voice assistant to be activated during the call.  
      - `vapiApi`: The API key for authorization with Vapi.  
    - Values are placeholders labeled "insert-id" and "insert-api" for manual replacement.  
  - **Expressions/Variables:** None, static assignment.  
  - **Inputs:** Receives data from “Wait 2min”.  
  - **Outputs:** Passes data with added fields to “Start outbound Vapi call”.  
  - **Version:** 3.4  
  - **Potential Failures:**  
    - Missing or incorrect IDs or API key will cause API call failures downstream.  
  - **Notes:** Critical for enabling authorized calls with correct parameters.

- **Sticky Note (related):**  
  - Advises users to set these Vapi fields using their Vapi account information.

#### 1.4 Outbound Call Execution

- **Overview:**  
  Performs an HTTP POST request to Vapi’s call initiation API endpoint, triggering the outbound voice call to the phone number submitted via Typeform.

- **Nodes Involved:**  
  - Start outbound Vapi call

- **Node Details:**  
  - **Type:** HTTP Request  
  - **Role:** Sends API call to Vapi to initiate a voice call.  
  - **Configuration:**  
    - URL: `https://api.vapi.ai/call`  
    - Method: POST  
    - Headers: Authorization with Bearer token from `vapiApi` field.  
    - JSON Body constructed dynamically using workflow variables:  
      ```json
      {
        "assistantId": "{{ $json.vapiAssistantId }}",
        "phoneNumberId": "{{ $json.vapiPhoneNumberId }}",
        "customer": {
          "number": "{{ $('Typeform Trigger').item.json.Phone }}"
        }
      }
      ```  
  - **Expressions/Variables:**  
    - Authorization header uses the API key token.  
    - Assistant and phone number IDs from prior set node.  
    - Customer phone number from original Typeform submission.  
  - **Inputs:** Receives data from “Set fields”.  
  - **Outputs:** Returns response from Vapi API.  
  - **Version:** 4.2  
  - **Potential Failures:**  
    - API key invalid or expired → authorization failures.  
    - Incorrect phone number or formatting → call initiation failure.  
    - Network timeouts or API rate limits.  
    - Missing or incorrect assistant or phone number IDs.  
  - **Notes:**  
    - Requires prior correct configuration of Vapi fields and Typeform phone number availability.

---

### 3. Summary Table

| Node Name              | Node Type         | Functional Role                      | Input Node(s)      | Output Node(s)          | Sticky Note                                                                                     |
|------------------------|-------------------|------------------------------------|--------------------|-------------------------|------------------------------------------------------------------------------------------------|
| Typeform Trigger       | Typeform Trigger  | Listen for new Typeform submissions | None               | Wait 2min               | Requirements for Typeform and Vapi setup, with useful links                                    |
| Wait 2min              | Wait              | Delay execution by 2 minutes        | Typeform Trigger   | Set fields              |                                                                                                |
| Set fields             | Set               | Define Vapi API credentials and IDs | Wait 2min          | Start outbound Vapi call | Must set Vapi fields (phone number ID, assistant ID, API key) from your Vapi account           |
| Start outbound Vapi call | HTTP Request      | Initiate outbound call via Vapi API | Set fields         | None                    |                                                                                                |
| Sticky Note            | Sticky Note       | Instructional note                  | None               | None                    | ## Set Vapi fields: Must set phone number id, assistant id, and API key from your Vapi account |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Typeform Trigger node**  
   - Node Type: Typeform Trigger  
   - Parameters:  
     - Form ID: `FW7LOAGB` (replace with your own form ID)  
   - Credentials: Connect a valid Typeform personal access token credential configured in n8n.  
   - Purpose: Trigger workflow on new form submission.  

2. **Add a Wait node named “Wait 2min”**  
   - Node Type: Wait  
   - Parameters:  
     - Unit: Minutes  
     - Amount: 2  
   - Connect the output of “Typeform Trigger” to this node.  
   - Purpose: Delay processing by 2 minutes.  

3. **Add a Set node named “Set fields”**  
   - Node Type: Set  
   - Parameters: Assign static string values for:  
     - `vapiPhoneNumberId`: Insert your Vapi phone number ID.  
     - `vapiAssistantId`: Insert your Vapi assistant ID.  
     - `vapiApi`: Insert your Vapi API key.  
   - Connect the output of “Wait 2min” to this node.  
   - Purpose: Store Vapi credentials and identifiers for API call.  

4. **Add an HTTP Request node named “Start outbound Vapi call”**  
   - Node Type: HTTP Request  
   - Parameters:  
     - URL: `https://api.vapi.ai/call`  
     - Method: POST  
     - Authentication: None (uses header with API key)  
     - Headers: Add header `Authorization` with value: `Bearer {{$json.vapiApi}}`  
     - Body Content Type: JSON  
     - Body:  
       ```json
       {
         "assistantId": "{{$json.vapiAssistantId}}",
         "phoneNumberId": "{{$json.vapiPhoneNumberId}}",
         "customer": {
           "number": "{{$json["Typeform Trigger"].item.json.Phone}}"
         }
       }
       ```  
   - Connect the output of “Set fields” to this node.  
   - Purpose: Trigger the outbound call via Vapi API.  

5. **Add Sticky Notes (optional but recommended)**  
   - Add a sticky note near “Set fields” node explaining the need to replace placeholders with actual Vapi account data.  
   - Add a sticky note near “Typeform Trigger” with setup requirements and links for Typeform and Vapi.  

6. **Activate the workflow**  
   - Ensure credentials are valid and the Typeform form has a phone number field.  
   - Activate the workflow to start listening and making calls automatically.  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                         | Context or Link                                                                                          |
|------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|
| Requirements for Typeform: Account, personal access token in n8n, published form with phone number field. Vapi: Account with credit, phone number, assistant, API key. Useful links to Vapi docs and n8n Typeform credentials. | See sticky note attached at the workflow start.                                                        |
| Vapi API Docs: https://docs.vapi.ai/api-reference/calls/create                                                                                       | Official Vapi API reference for call creation.                                                         |
| Typeform credentials configuration: https://docs.n8n.io/integrations/builtin/credentials/typeform/                                                  | n8n documentation on setting up Typeform credentials.                                                  |
| Vapi Account: https://vapi.ai/?aff=onenode                                                                                                          | Official Vapi website for account creation and info.                                                   |

---

**Disclaimer:**  
The provided text originates exclusively from an automated workflow created with n8n, a tool for integration and automation. This process strictly complies with content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.