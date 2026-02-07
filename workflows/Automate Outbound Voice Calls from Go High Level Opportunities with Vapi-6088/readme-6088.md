Automate Outbound Voice Calls from Go High Level Opportunities with Vapi

https://n8nworkflows.xyz/workflows/automate-outbound-voice-calls-from-go-high-level-opportunities-with-vapi-6088


# Automate Outbound Voice Calls from Go High Level Opportunities with Vapi

### 1. Workflow Overview

This workflow automates outbound voice calls using Vapi when new opportunities are created in Go High Level (GHL). Its primary use case is to trigger a voice call through Vapi to a contact associated with a newly created opportunity in GHL, after a short delay. The workflow consists of the following logical blocks:

- **1.1 Input Reception:** Receives webhook notifications from GHL when a new opportunity is created.
- **1.2 Contact Retrieval:** Uses the GHL API to fetch detailed contact information based on the opportunity.
- **1.3 Wait Timer:** Introduces a delay before making the call.
- **1.4 Vapi Call Configuration:** Sets necessary parameters for the Vapi outbound call.
- **1.5 Outbound Call Execution:** Sends a POST request to Vapi's API to initiate the voice call.
- **1.6 Documentation & Requirements:** Sticky notes provide configuration instructions and prerequisite information for users.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:** Listens for incoming webhook POST requests from Go High Level when a new opportunity is created. This is the entry point of the workflow.
- **Nodes Involved:** `GHL opportunity created`
- **Node Details:**

  - **Node Name:** GHL opportunity created
  - **Type:** Webhook
  - **Technical Role:** Entry trigger for the workflow; captures HTTP POST requests from GHL.
  - **Configuration Choices:** 
    - HTTP Method: POST
    - Webhook path: Unique ID (94788969-ef95-45c7-88ad-29b894324466)
  - **Key Expressions/Variables:** `$json.body.contactId` used downstream to retrieve contact.
  - **Input Connections:** None (trigger node).
  - **Output Connections:** Connects to `Get a GHL contact`.
  - **Version Requirements:** Webhook node version 2.
  - **Potential Failures:** 
    - Missing or malformed webhook payload.
    - Incorrect webhook URL configuration in GHL.
  - **Sub-workflow:** None.

#### 2.2 Contact Retrieval

- **Overview:** Retrieves detailed contact information from GHL using the contact ID extracted from the webhook payload.
- **Nodes Involved:** `Get a GHL contact`
- **Node Details:**

  - **Node Name:** Get a GHL contact
  - **Type:** HighLevel API node
  - **Technical Role:** Queries GHL API to get contact details, particularly the phone number.
  - **Configuration Choices:** 
    - Operation: `get`
    - ContactId: Dynamically set via expression `={{ $json.body.contactId }}`
    - Uses authenticated HighLevel OAuth2 credentials.
  - **Key Expressions/Variables:** Uses the contact ID from webhook JSON.
  - **Input Connections:** Connected from `GHL opportunity created`.
  - **Output Connections:** Connects to `Wait 5min`.
  - **Version Requirements:** HighLevel node version 2.
  - **Potential Failures:** 
    - Invalid or expired OAuth credentials.
    - Contact ID not found or invalid in GHL.
    - API rate limits or network issues.
  - **Sub-workflow:** None.

#### 2.3 Wait Timer

- **Overview:** Introduces a 5-minute delay before proceeding to the outbound call. This delay might be used to allow other processes to complete or to space out calls.
- **Nodes Involved:** `Wait 5min`
- **Node Details:**

  - **Node Name:** Wait 5min
  - **Type:** Wait node
  - **Technical Role:** Pauses workflow execution for 5 minutes.
  - **Configuration Choices:** 
    - Unit: minutes
    - Duration: 5
  - **Key Expressions/Variables:** None.
  - **Input Connections:** From `Get a GHL contact`.
  - **Output Connections:** To `Set fields`.
  - **Version Requirements:** Wait node version 1.1.
  - **Potential Failures:** 
    - Workflow timeout if overall execution limits are exceeded.
  - **Sub-workflow:** None.

#### 2.4 Vapi Call Configuration

- **Overview:** Assigns essential Vapi parameters such as phone number ID, assistant ID, and API key. These are required for authenticating and configuring the outbound call.
- **Nodes Involved:** `Set fields`
- **Node Details:**

  - **Node Name:** Set fields
  - **Type:** Set node
  - **Technical Role:** Sets static values for Vapi API credentials and call configuration.
  - **Configuration Choices:** 
    - Assigns three string fields:
      - `vapiPhoneNumberId` (the phone number ID that will place the call)
      - `vapiAssistantId` (the assistant enabled on the call)
      - `vapiApi` (the Vapi API key for authentication)
    - Placeholder values are used and must be replaced by the user.
  - **Key Expressions/Variables:** Static string values (to be replaced).
  - **Input Connections:** From `Wait 5min`.
  - **Output Connections:** To `Start outbound Vapi call`.
  - **Version Requirements:** Set node v3.4.
  - **Potential Failures:** 
    - Missing or incorrect API credentials leading to authentication failure.
  - **Sub-workflow:** None.

- **Additional Information:**  
  - A sticky note (`Sticky Note`) near this node reminds the user to configure these fields correctly.

#### 2.5 Outbound Call Execution

- **Overview:** Sends an HTTP POST request to Vapi's API to initiate the outbound voice call using the configured parameters and contact phone number.
- **Nodes Involved:** `Start outbound Vapi call`
- **Node Details:**

  - **Node Name:** Start outbound Vapi call
  - **Type:** HTTP Request node
  - **Technical Role:** Calls Vapi API to start the outbound voice call.
  - **Configuration Choices:** 
    - Method: POST
    - URL: `https://api.vapi.ai/call`
    - Body: JSON with keys:
      - `assistantId`: Set from `vapiAssistantId`
      - `phoneNumberId`: Set from `vapiPhoneNumberId`
      - `customer.number`: Contact phone number from `Get a GHL contact` node (`$('Get a GHL contact').item.json.phone`)
    - Headers: Authorization bearer token using `vapiApi` key.
    - Sends JSON body and headers.
  - **Key Expressions/Variables:** Uses expressions to dynamically populate JSON body and authorization header.
  - **Input Connections:** From `Set fields`.
  - **Output Connections:** None (terminal node).
  - **Version Requirements:** HTTP Request node v4.2.
  - **Potential Failures:** 
    - Invalid API key or assistant ID causing authorization errors.
    - Invalid phone number format causing call initiation failure.
    - Network or API endpoint issues.
  - **Sub-workflow:** None.

#### 2.6 Documentation & Requirements

- **Overview:** Provides essential instructions and prerequisite information for setting up the workflow, including GHL and Vapi accounts and credentials.
- **Nodes Involved:** `Sticky Note1`, `Sticky Note`
- **Node Details:**

  - **Sticky Note1:** Details requirements such as:
    - GHL account and developer private app setup.
    - Webhook URL registration in GHL.
    - Vapi account with credit, phone number, assistant, and API key.
    - Useful links to documentation for GHL, Vapi, and n8n credentials.
  - **Sticky Note:** Reminds user to set Vapi fields (`phoneNumberId`, `assistantId`, `apiKey`).
  - **Type:** Sticky Note nodes
  - **Input/Output Connections:** None; purely informational.
  - **Version Requirements:** N/A.
  - **Potential Failures:** None.

---

### 3. Summary Table

| Node Name               | Node Type         | Functional Role                     | Input Node(s)            | Output Node(s)           | Sticky Note                                                                                                                                                                   |
|-------------------------|-------------------|-----------------------------------|--------------------------|--------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| GHL opportunity created | Webhook           | Entry point: receives GHL webhook | None                     | Get a GHL contact        | See Sticky Note1 for GHL and Vapi setup requirements and useful links                                                                                                        |
| Get a GHL contact        | HighLevel API     | Retrieve contact info from GHL    | GHL opportunity created  | Wait 5min                | See Sticky Note1 for GHL and Vapi setup requirements and useful links                                                                                                        |
| Wait 5min                | Wait              | Delay before call execution        | Get a GHL contact        | Set fields               | See Sticky Note1 for GHL and Vapi setup requirements and useful links                                                                                                        |
| Set fields               | Set               | Configure Vapi API parameters     | Wait 5min                | Start outbound Vapi call | See Sticky Note ("Set Vapi fields") for instructions on setting phoneNumberId, assistantId, and apiKey                                                                       |
| Start outbound Vapi call | HTTP Request      | Initiate outbound call via Vapi   | Set fields               | None                     | See Sticky Note ("Set Vapi fields") for instructions on setting phoneNumberId, assistantId, and apiKey                                                                       |
| Sticky Note1             | Sticky Note       | Documentation & requirements      | None                     | None                     | Contains detailed setup instructions for GHL and Vapi, including links: [GHL](https://www.gohighlevel.com/78476a2?fp_ref=1node), [Vapi](https://vapi.ai/?aff=onenode)       |
| Sticky Note              | Sticky Note       | Reminder to set Vapi fields       | None                     | None                     | Emphasizes setting Vapi phone number ID, assistant ID, and API key                                                                                                          |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**  
   - Node Type: Webhook  
   - Name: `GHL opportunity created`  
   - HTTP Method: POST  
   - Path: Use a unique identifier (e.g., `94788969-ef95-45c7-88ad-29b894324466`)  
   - Purpose: Receive webhook POST requests from Go High Level on new opportunity creation.

2. **Create HighLevel Node**  
   - Node Type: HighLevel  
   - Name: `Get a GHL contact`  
   - Operation: `get`  
   - ContactId: Set expression to `={{ $json.body.contactId }}` to use the contact ID from webhook payload.  
   - Credentials: Set up and select HighLevel OAuth2 credentials with developer private app access.  
   - Connect output of `GHL opportunity created` to this node.

3. **Create Wait Node**  
   - Node Type: Wait  
   - Name: `Wait 5min`  
   - Duration: 5  
   - Unit: minutes  
   - Connect output of `Get a GHL contact` to this node.

4. **Create Set Node**  
   - Node Type: Set  
   - Name: `Set fields`  
   - Add three string fields with placeholder values that must be replaced:  
     - `vapiPhoneNumberId` = `"insert-id"` (Vapi phone number ID that places the call)  
     - `vapiAssistantId` = `"insert-id"` (Vapi assistant ID enabled on the call)  
     - `vapiApi` = `"insert-api"` (Vapi API key for authentication)  
   - Connect output of `Wait 5min` to this node.

5. **Create HTTP Request Node**  
   - Node Type: HTTP Request  
   - Name: `Start outbound Vapi call`  
   - HTTP Method: POST  
   - URL: `https://api.vapi.ai/call`  
   - Authentication: None directly configured; use header injection.  
   - Headers: Set header `Authorization` with value: `=Bearer {{ $json.vapiApi }}` to pass API key dynamically.  
   - Body Content (JSON):  
     ```json
     {
       "assistantId": "{{ $json.vapiAssistantId }}",
       "phoneNumberId": "{{ $json.vapiPhoneNumberId }}",
       "customer": {
         "number": "{{ $('Get a GHL contact').item.json.phone }}"
       }
     }
     ```  
   - Send body and headers as JSON.  
   - Connect output of `Set fields` to this node.

6. **Add Informational Sticky Notes**  
   - Create two Sticky Note nodes to provide user instructions and reminders:  
     - One near the beginning explaining requirements for GHL and Vapi accounts, credentials, webhook URL registration, and useful links.  
     - Another near the `Set fields` and `Start outbound Vapi call` nodes reminding to fill in Vapi parameters.

7. **Activate Workflow**  
   - Ensure the workflow is active and the webhook URL is correctly registered in the Go High Level private app to receive opportunity creation events.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                        | Context or Link                                                                                     |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| Go High Level account required with developer private app enabled and credentials configured in n8n. Webhook URL (from n8n) must be added to GHL private app.     | [Go High Level](https://www.gohighlevel.com/78476a2?fp_ref=1node), [GHL docs](https://developers.gohighlevel.com/) |
| Vapi account needed with credit, configured phone number for calling, assistant setup, and API key.                                                               | [Vapi](https://vapi.ai/?aff=onenode), [Vapi API Docs](https://docs.vapi.ai/api-reference/calls/create) |
| n8n HighLevel OAuth2 credential setup documentation for integration.                                                                                               | [n8n HighLevel Credentials](https://docs.n8n.io/integrations/builtin/credentials/highlevel/)       |

---

**Disclaimer:**  
The text provided originates solely from an automated workflow created with n8n, a tool for integration and automation. This processing strictly respects current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.