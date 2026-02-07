Automate Outbound Voice Calls with Vapi from Form Submissions

https://n8nworkflows.xyz/workflows/automate-outbound-voice-calls-with-vapi-from-form-submissions-6577


# Automate Outbound Voice Calls with Vapi from Form Submissions

### 1. Workflow Overview

This workflow automates outbound voice calls using the Vapi.ai service, triggered by new submissions on an n8n form. It is designed for scenarios where immediate or slightly delayed proactive phone outreach is needed based on user-submitted contact information. The workflow consists of the following logical blocks:

- **1.1 Input Reception:** Captures new form submissions with contact details.
- **1.2 Delay Handling:** Introduces a controlled wait time before initiating the call.
- **1.3 Configuration Setup:** Sets necessary Vapi API credentials and identifiers.
- **1.4 Outbound Call Execution:** Makes an HTTP POST request to the Vapi API to start the call.
- **1.5 Documentation and Instruction:** Provides key usage notes and setup instructions as sticky notes for maintainers.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  This block listens for new submissions on a configured n8n form, capturing user inputs such as name, email, and phone number.

- **Nodes Involved:**  
  - On form submission

- **Node Details:**  
  - **On form submission**  
    - Type: Form Trigger  
    - Role: Entry point that triggers whenever the form titled "Lead form" receives a new submission.  
    - Configuration:  
      - Form Title: "Lead form"  
      - Fields:  
        - Name (required, text)  
        - Email (required, email type)  
        - Phone (required, text with placeholder instructing to include "+" and country code, no spaces)  
      - Attribution appending disabled  
      - Webhook ID uniquely identifies this trigger  
    - Inputs: None (trigger node)  
    - Outputs: Passes submission data downstream  
    - Edge Cases:  
      - Missing required fields will prevent trigger firing (handled by n8n form validation).  
      - Phone number format errors must be handled upstream or by user input discipline.  
    - Version: 2.2  

#### 1.2 Delay Handling

- **Overview:**  
  Adds a 2-minute delay after form submission before proceeding, possibly to allow for any processing or to manage call timing.

- **Nodes Involved:**  
  - Wait 2min

- **Node Details:**  
  - **Wait 2min**  
    - Type: Wait  
    - Role: Pauses workflow execution for a defined period to defer call initiation.  
    - Configuration:  
      - Duration: 2 minutes  
      - Unit: minutes  
      - Webhook ID assigned (internal use)  
    - Input: Receives form submission data  
    - Output: Passes data unchanged after delay  
    - Edge Cases:  
      - Workflow timeout if environment kills long executions (check n8n timeout settings).  
    - Version: 1.1  

#### 1.3 Configuration Setup

- **Overview:**  
  This block sets static values required to authenticate and specify the call parameters for Vapi.

- **Nodes Involved:**  
  - Set fields

- **Node Details:**  
  - **Set fields**  
    - Type: Set  
    - Role: Injects Vapi API credentials and identifiers into the workflow data.  
    - Configuration:  
      - Sets three string fields:  
        - `vapiPhoneNumberId`: The ID of the phone number in Vapi that will make the call (placeholder "insert-id")  
        - `vapiAssistantId`: The ID of the Vapi assistant to be enabled during the call (placeholder "insert-id")  
        - `vapiApi`: The API key for authenticating with Vapi (placeholder "insert-api")  
    - Inputs: Receives data from Wait node  
    - Outputs: Passes enriched data to next node  
    - Edge Cases:  
      - If placeholders are not replaced, API calls will fail authentication or with invalid parameters.  
      - Sensitive data management should be secured (consider using n8n credentials instead of static assignment).  
    - Version: 3.4  

#### 1.4 Outbound Call Execution

- **Overview:**  
  This block performs the actual outbound call by sending a POST request to Vapi's call creation endpoint with appropriate headers and body.

- **Nodes Involved:**  
  - Start outbound Vapi call

- **Node Details:**  
  - **Start outbound Vapi call**  
    - Type: HTTP Request  
    - Role: Initiates the outbound call by making a REST API call to Vapi.  
    - Configuration:  
      - HTTP Method: POST  
      - URL: `https://api.vapi.ai/call`  
      - Body Type: JSON  
      - Body Content (templated):  
        ```json
        {
          "assistantId": "{{ $json.vapiAssistantId }}",
          "phoneNumberId": "{{ $json.vapiPhoneNumberId }}",
          "customer": {
            "number": "{{ $('On form submission').item.json.Phone }}"
          }
        }
        ```  
      - Headers: Authorization Bearer token with `vapiApi` value  
      - Sends body and headers with request  
    - Inputs: Receives data including Vapi credentials and form submission phone number  
    - Outputs: Response from Vapi API (call creation confirmation or error)  
    - Edge Cases:  
      - HTTP errors (authentication failure, invalid parameters)  
      - Network timeouts or API rate limits  
      - Incorrectly formatted phone number may cause call failure  
      - Must ensure `Phone` field includes "+" and country code as required by the API  
    - Version: 4.2  

#### 1.5 Documentation and Instruction

- **Overview:**  
  Provides important setup instructions and requirements for users and maintainers directly inside the workflow canvas.

- **Nodes Involved:**  
  - Sticky Note  
  - Sticky Note1

- **Node Details:**  
  - **Sticky Note**  
    - Type: Sticky Note  
    - Role: Explains required Vapi fields and phone number format to be set in the workflow.  
    - Content Highlights:  
      - Must set Vapi phone number ID, assistant ID, and API key.  
      - Phone number country code must include "+" and no spaces.  

  - **Sticky Note1**  
    - Type: Sticky Note  
    - Role: Lists prerequisites and useful links to external documentation.  
    - Content Highlights:  
      - Requirements for the n8n form fields (phone format, required fields)  
      - Requirements for Vapi account (credit, connected number, assistant, API key)  
      - Useful links:  
        - Vapi homepage: https://vapi.ai/?aff=onenode  
        - Vapi API docs: https://docs.vapi.ai/api-reference/calls/create  

---

### 3. Summary Table

| Node Name             | Node Type       | Functional Role                          | Input Node(s)          | Output Node(s)         | Sticky Note                                                                                                         |
|-----------------------|-----------------|----------------------------------------|-----------------------|-----------------------|---------------------------------------------------------------------------------------------------------------------|
| On form submission    | Form Trigger    | Capture new form submission data       | —                     | Wait 2min             | See Sticky Note1: Requirements for form and Vapi, useful links                                                       |
| Wait 2min            | Wait            | Delay workflow for 2 minutes            | On form submission    | Set fields            |                                                                                                                     |
| Set fields           | Set             | Set Vapi API credentials and IDs        | Wait 2min             | Start outbound Vapi call| See Sticky Note: Instructions on Vapi fields and phone number format                                               |
| Start outbound Vapi call | HTTP Request  | Perform the API call to initiate Vapi call | Set fields             | —                     |                                                                                                                     |
| Sticky Note          | Sticky Note     | Instructions on setting Vapi fields     | —                     | —                     | Must set phone number id, assistant id, API key; phone number country code format details                            |
| Sticky Note1         | Sticky Note     | Requirements and useful links            | —                     | —                     | Requirements for form fields and Vapi setup; links to Vapi homepage and API documentation                            |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow in n8n.**

2. **Add a Form Trigger node:**  
   - Name: `On form submission`  
   - Configure:  
     - Form Title: "Lead form"  
     - Fields:  
       - Name (Text, Required)  
       - Email (Email type, Required)  
       - Phone (Text, Required, Placeholder: "Insert + symbol and country code without spaces")  
     - Disable "Append Attribution" option  
   - Save and note the webhook URL (for testing or embedding the form).

3. **Add a Wait node:**  
   - Name: `Wait 2min`  
   - Set unit to "minutes" and amount to 2  
   - Connect `On form submission` → `Wait 2min`

4. **Add a Set node:**  
   - Name: `Set fields`  
   - Add three string fields:  
     - `vapiPhoneNumberId`: Set to your actual Vapi phone number ID  
     - `vapiAssistantId`: Set to your Vapi assistant ID  
     - `vapiApi`: Set to your Vapi API key  
   - Connect `Wait 2min` → `Set fields`

5. **Add an HTTP Request node:**  
   - Name: `Start outbound Vapi call`  
   - Configure:  
     - HTTP Method: POST  
     - URL: `https://api.vapi.ai/call`  
     - Authentication: None (API key passed in header)  
     - Headers:  
       - Name: `Authorization`  
       - Value: `Bearer {{$json.vapiApi}}`  
     - Body Content Type: JSON  
     - Body:  
       ```json
       {
         "assistantId": "{{ $json.vapiAssistantId }}",
         "phoneNumberId": "{{ $json.vapiPhoneNumberId }}",
         "customer": {
           "number": "{{ $('On form submission').item.json.Phone }}"
         }
       }
       ```  
   - Connect `Set fields` → `Start outbound Vapi call`

6. **Add Sticky Notes (optional for documentation):**  
   - Add one sticky note near `Set fields` explaining the need to configure Vapi fields and phone number format.  
   - Add another sticky note near `On form submission` describing form requirements, Vapi prerequisites, and useful links:  
     - https://vapi.ai/?aff=onenode  
     - https://docs.vapi.ai/api-reference/calls/create

7. **Activate the workflow and test by submitting a form with a valid international phone number (including + and country code).**

---

### 5. General Notes & Resources

| Note Content                                                                                               | Context or Link                                         |
|------------------------------------------------------------------------------------------------------------|--------------------------------------------------------|
| Vapi account must have credit, a connected phone number, and an assistant ready to handle calls.           | Workflow Requirements                                   |
| Phone numbers must be submitted in international format including "+" and country code, no spaces.         | Input Field Validation                                  |
| Useful API documentation for call creation: https://docs.vapi.ai/api-reference/calls/create               | Official Vapi API Documentation                         |
| Vapi official site with affiliate link: https://vapi.ai/?aff=onenode                                       | Vapi Homepage / Affiliate Link                          |

---

**Disclaimer:** The provided text is derived exclusively from an automated n8n workflow. It complies fully with content policies and contains no illegal, offensive, or protected material. All data handled are legal and public.