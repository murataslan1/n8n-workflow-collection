Automate New Customer Onboarding with HubSpot, Google Calendar, and AI-Powered Gmail

https://n8nworkflows.xyz/workflows/automate-new-customer-onboarding-with-hubspot--google-calendar--and-ai-powered-gmail-3958


# Automate New Customer Onboarding with HubSpot, Google Calendar, and AI-Powered Gmail

---

### 1. Workflow Overview

This n8n workflow automates the onboarding of new customers by integrating HubSpot CRM, Google Calendar, and AI-driven personalized email communication via Gmail. It targets customer success and sales teams who want to ensure efficient, personalized, and scalable onboarding experiences.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception & Triggering**: Listens for new customer creation events via webhook or HubSpot trigger.

- **1.2 HubSpot Owner Identification**: Fetches and filters HubSpot owners to identify the owner assigned to the new contact.

- **1.3 Contact Information Retrieval**: Retrieves detailed contact information from HubSpot using the contact ID.

- **1.4 AI-Powered Email & Calendar Scheduling**: Uses AI agents to generate a personalized welcome email and schedule a welcome meeting in the sender’s calendar with the new contact as attendee.

- **1.5 Email Formatting and Sending**: Converts AI-generated markdown email body to HTML and sends the email to the customer through Gmail.

- **1.6 HubSpot Contact Owner Assignment**: Updates the HubSpot contact record to assign the identified owner for future reference.

- **1.7 Error Handling & Status Reporting**: Sets success or retry messages based on the outcome of calendar scheduling.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Triggering

- **Overview:**  
Receives new customer data either via a direct webhook call or a HubSpot trigger node, initiating the workflow.

- **Nodes Involved:**  
  - Webhook  
  - HubSpot Trigger  
  - Enter your company data here (Set node)  

- **Node Details:**  
  1. **Webhook**  
     - Type: Webhook  
     - Role: Receives POST requests to trigger workflow externally.  
     - Config: Path set uniquely; HTTP Method POST.  
     - Input: External system (e.g., HubSpot webhook).  
     - Output: Triggers downstream nodes with payload.  
     - Failure Modes: Invalid payload, connectivity issues.

  2. **HubSpot Trigger**  
     - Type: HubSpot Trigger node  
     - Role: Listens for HubSpot events (e.g., new contact creation).  
     - Config: Authenticated with HubSpot Developer API credentials.  
     - Input: HubSpot event stream.  
     - Output: Triggers downstream nodes with event data.  
     - Failure Modes: Auth errors, event subscription misconfiguration.

  3. **Enter your company data here**  
     - Type: Set node  
     - Role: Defines static company-related variables (sender email, name, company name, activity).  
     - Key Variables: `company_name`, `sender_name`, `sender_email`, `company_activity`  
     - Used in expressions throughout workflow for personalization.  
     - Input: Output from Webhook or HubSpot Trigger.  
     - Output: Passes variables downstream.  
     - Edge Cases: Sender email must match HubSpot owner email for correct filtering.

- **Sub-workflow references:** None.

---

#### 2.2 HubSpot Owner Identification

- **Overview:**  
Fetches all HubSpot owners and filters to find the owner matching the sender email set in company data.

- **Nodes Involved:**  
  - Get list of owners (HTTP Request)  
  - Split Out owners  
  - Get current owner (Filter)  

- **Node Details:**  
  1. **Get list of owners**  
     - Type: HTTP Request  
     - Role: Calls HubSpot API to get a list of all CRM owners.  
     - Config: Authenticated using HubSpot OAuth2 credentials.  
     - URL: `https://api.hubapi.com/crm/v3/owners`  
     - Output: JSON array of owners.  
     - Failure Modes: Auth failure, API rate limits, network issues.

  2. **Split Out owners**  
     - Type: Split Out  
     - Role: Separates the owners array into individual items for filtering.  
     - Config: Field to split is `results`.  
     - Input: Output of HTTP Request.  
     - Output: One item per owner.  

  3. **Get current owner**  
     - Type: Filter  
     - Role: Filters owners array to find the owner with email matching `sender_email` from company data.  
     - Condition: Owner email equals `sender_email`.  
     - Input: Individual owners from Split Out.  
     - Output: Owner matching sender email.  
     - Edge Cases: No match found results in empty output, workflow may fail downstream if not handled.

- **Sub-workflow references:** None.

---

#### 2.3 Contact Information Retrieval

- **Overview:**  
Retrieves full details of the newly created contact in HubSpot, using the object ID from the webhook payload.

- **Nodes Involved:**  
  - If a contact is created (If node)  
  - Get all info about the contact (HubSpot node)  

- **Node Details:**  
  1. **If a contact is created**  
     - Type: If node  
     - Role: Checks if the webhook event is of type `contact.creation`.  
     - Condition: Matches `subscriptionType` to `contact.creation`.  
     - Input: Webhook data flow.  
     - Output: True branch continues workflow; false branch stops.  

  2. **Get all info about the contact**  
     - Type: HubSpot node  
     - Role: Fetches the contact details by ID from HubSpot.  
     - Config: Uses `objectId` from webhook payload as contact ID.  
     - Credentials: HubSpot OAuth2.  
     - Output: Detailed contact properties (name, email, etc.).  
     - Failure Modes: Invalid ID, auth errors, API limits.

- **Sub-workflow references:** None.

---

#### 2.4 AI-Powered Email & Calendar Scheduling

- **Overview:**  
Generates a personalized welcome email and schedules a welcome meeting using AI agents. The AI agent uses a calendar agent tool to find or create calendar events.

- **Nodes Involved:**  
  - Write a personalized message (LangChain Agent)  
  - calendarAgent (Tool Workflow)  
  - OpenAI Chat Model2 (AI language model)  
  - Structured Output Parser  

- **Node Details:**  
  1. **Write a personalized message**  
     - Type: LangChain Agent node  
     - Role: Sends a prompt to generate a personalized welcome email, instructing to schedule a meeting via calendarAgent.  
     - Prompt: Includes sender and recipient variables, instructions to schedule meeting, expects a JSON output with `subject` and `body`.  
     - Output Parser: Structured Output Parser node parses JSON output.  
     - Failure Modes: AI generation errors, prompt misconfiguration, parsing failures.

  2. **calendarAgent**  
     - Type: Tool Workflow (LangChain)  
     - Role: Handles calendar-related actions (create, update, delete events).  
     - Config: Calls sub-workflow (same workflow ID) with calendar tools (Google Calendar nodes).  
     - Input: Queries from AI prompt (e.g., schedule meeting with attendee).  
     - Failure Modes: Calendar API auth issues, event conflicts, invalid parameters.

  3. **OpenAI Chat Model2**  
     - Type: LangChain OpenAI Chat Model  
     - Role: Provides the language model (GPT-4o-mini) for AI agents.  
     - Credentials: OpenAI API key configured.  
     - Input: Prompt text from agent node.  
     - Failure Modes: API rate limits, auth errors, timeouts.

  4. **Structured Output Parser**  
     - Type: LangChain Output Parser  
     - Role: Parses AI agent JSON outputs into usable structured data.  
     - Config: JSON schema example with `subject` and `body`.  
     - Failure Modes: Parsing errors if output malformed.

- **Sub-workflow references:**  
  - The calendarAgent node references a sub-workflow within the same workflow (recursive call) to delegate calendar tools.

---

#### 2.5 Email Formatting and Sending

- **Overview:**  
Converts the AI-generated markdown email body to HTML and sends the formatted email to the new customer via Gmail.

- **Nodes Involved:**  
  - Transforms markdown to HTML (Markdown node)  
  - Send the message (Gmail node)  

- **Node Details:**  
  1. **Transforms markdown to HTML**  
     - Type: Markdown node  
     - Role: Converts the markdown email body produced by AI to HTML for better email formatting.  
     - Input: `output.body` from AI message.  
     - Output: HTML-formatted email body.  
     - Failure Modes: Invalid markdown input.

  2. **Send the message**  
     - Type: Gmail node  
     - Role: Sends the email to the recipient’s email address fetched from HubSpot contact.  
     - Config:  
       - To: Contact’s email address.  
       - Subject: AI-generated subject.  
       - Message: HTML email body.  
       - BCC: Copies sender’s backup email.  
     - Credentials: Gmail OAuth2.  
     - Failure Modes: Auth errors, quota limits, invalid email addresses.

- **Sub-workflow references:** None.

---

#### 2.6 HubSpot Contact Owner Assignment

- **Overview:**  
Assigns the HubSpot contact owner to the identified owner (filtered by email) to track communication responsibility.

- **Nodes Involved:**  
  - Set owner to contact (HubSpot node)  

- **Node Details:**  
  1. **Set owner to contact**  
     - Type: HubSpot node  
     - Role: Updates the HubSpot contact record to set the contact owner.  
     - Config: Uses contact email and owner ID from previous nodes.  
     - Credentials: HubSpot OAuth2.  
     - Failure Modes: Auth errors, invalid owner ID, API errors.

- **Sub-workflow references:** None.

---

#### 2.7 Error Handling & Status Reporting

- **Overview:**  
Sets response messages based on calendar agent success or failure to assist with troubleshooting or user feedback.

- **Nodes Involved:**  
  - Success (Set node)  
  - Try Again (Set node)  

- **Node Details:**  
  1. **Success**  
     - Type: Set node  
     - Role: Sets a success message with AI output for downstream use or logging.  
     - Output: `response` with success text.  

  2. **Try Again**  
     - Type: Set node  
     - Role: Sets an error message prompting retry if calendar agent fails.  
     - Output: `response` with failure message.  

- **Connections:**  
  - Calendar Agent node on success triggers Success node.  
  - On error, triggers Try Again node.  

- **Sub-workflow references:** None.

---

### 3. Summary Table

| Node Name                 | Node Type                                | Functional Role                                | Input Node(s)                             | Output Node(s)                         | Sticky Note                                                                                  |
|---------------------------|-----------------------------------------|-----------------------------------------------|------------------------------------------|---------------------------------------|----------------------------------------------------------------------------------------------|
| Webhook                   | Webhook                                 | Entry point for external triggers             | None                                     | Enter your company data here           | ## What does it do? Objective: Streamline onboarding; Trigger via webhook or CRM event.     |
| HubSpot Trigger           | HubSpot Trigger                         | Entry point for HubSpot event triggers        | None                                     | Enter your company data here           |                                                                                              |
| Enter your company data here | Set                                   | Defines company and sender static data        | Webhook, HubSpot Trigger                  | Get list of owners                     | ## Set your data and your company's; Sender email must match HubSpot email                  |
| Get list of owners         | HTTP Request                           | Retrieves HubSpot owners via API               | Enter your company data here              | Split Out owners                      |                                                                                              |
| Split Out owners           | Split Out                              | Parses owners array into individual items      | Get list of owners                        | Get current owner                     |                                                                                              |
| Get current owner          | Filter                                 | Filters owners to find matching sender email  | Split Out owners                         | If a contact is created                |                                                                                              |
| If a contact is created    | If                                     | Checks event type is contact creation          | Get current owner                         | Get all info about the contact         |                                                                                              |
| Get all info about the contact | HubSpot                              | Fetches contact details by ID                   | If a contact is created                   | Write a personalized message          |                                                                                              |
| Write a personalized message | LangChain Agent                      | Generates personalized welcome email and schedules calendar event | Get all info about the contact            | Transforms markdown to HTML           | ## Email writer - Uses calendarAgent tool for appointment scheduling; customizable prompt    |
| calendarAgent              | Tool Workflow (LangChain)              | Performs calendar operations (create, get, delete, update events) | Connected internally via AI tools         | Success, Try Again                    | ## Calendar tool borrowed from Nate Herk Youtube channel                                    |
| OpenAI Chat Model2         | LangChain OpenAI Chat Model            | Provides AI language model for agents          | calendarAgent                            | Write a personalized message          |                                                                                              |
| Structured Output Parser   | LangChain Output Parser                | Parses AI JSON output into structured data     | OpenAI Chat Model2                       | Write a personalized message          |                                                                                              |
| Transforms markdown to HTML | Markdown                             | Converts AI email body markdown to HTML         | Write a personalized message             | Send the message                      |                                                                                              |
| Send the message           | Gmail                                 | Sends personalized welcome email                | Transforms markdown to HTML               | Set owner to contact                  |                                                                                              |
| Set owner to contact       | HubSpot                               | Assigns owner to contact in HubSpot             | Send the message                         | None                                |                                                                                              |
| Success                   | Set                                   | Sets success response message                    | Calendar Agent                          | None                                |                                                                                              |
| Try Again                 | Set                                   | Sets retry/failure response message              | Calendar Agent                          | None                                |                                                                                              |
| When Executed by Another Workflow | Execute Workflow Trigger         | Allows calendarAgent to call this workflow recursively | None                                     | Calendar Agent                      |                                                                                              |
| Sticky Note (multiple)     | Sticky Note                           | Provides documentation and instructions         | None                                     | None                                | Includes setup instructions, contact info, and credits                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow in n8n.**

2. **Add a Webhook node:**  
   - Set HTTP Method to POST.  
   - Define path as a unique identifier (e.g., `/your-unique-path`).  
   - This node triggers the workflow externally.

3. **Add a HubSpot Trigger node:**  
   - Authenticate with HubSpot Developer API credentials.  
   - Configure to listen for contact creation events.

4. **Add a Set node ("Enter your company data here"):**  
   - Define static variables:  
     - `company_name` (string)  
     - `sender_name` (string)  
     - `sender_email` (string, must match HubSpot owner email)  
     - `company_activity` (string)  
   - Connect both Webhook and HubSpot Trigger to this node.

5. **Add an HTTP Request node ("Get list of owners"):**  
   - URL: `https://api.hubapi.com/crm/v3/owners`  
   - Authentication: HubSpot OAuth2 credentials.  
   - Connect from "Enter your company data here".

6. **Add a Split Out node ("Split Out owners"):**  
   - Field to split: `results`.  
   - Connect from "Get list of owners".

7. **Add a Filter node ("Get current owner"):**  
   - Condition: owner email equals `{{$node["Enter your company data here"].json["sender_email"]}}`.  
   - Connect from "Split Out owners".

8. **Add an If node ("If a contact is created"):**  
   - Condition: `{{$node["Webhook"].json["body"][0]["subscriptionType"]}}` equals `contact.creation`.  
   - Connect from "Get current owner".

9. **Add a HubSpot node ("Get all info about the contact"):**  
   - Operation: Get contact by ID.  
   - Contact ID: `{{$node["Webhook"].json["body"][0]["objectId"]}}`.  
   - Authentication: HubSpot OAuth2 credentials.  
   - Connect from the true branch of "If a contact is created".

10. **Add a LangChain Agent node ("Write a personalized message"):**  
    - Prompt includes instructions to write a personalized welcome email and schedule a meeting via calendarAgent.  
    - Use variables from company data and contact info.  
    - Enable output parsing with Structured Output Parser.  
    - Connect from "Get all info about the contact".

11. **Add Structured Output Parser node:**  
    - Provide JSON schema example with `subject` and `body`.  
    - Connect from the LangChain Agent node.

12. **Add Markdown node ("Transforms markdown to HTML"):**  
    - Mode: markdownToHtml  
    - Input: `{{$json["output"]["body"]}}` from previous node.  
    - Connect from "Write a personalized message".

13. **Add Gmail node ("Send the message"):**  
    - To: `{{$node["Get all info about the contact"].json["properties"]["email"]["value"]}}`  
    - Subject: `{{$json["output"]["subject"]}}`  
    - Message: HTML content from Markdown node.  
    - BCC: Your backup email (e.g., `thomas@pollup.net`).  
    - Authenticate with Gmail OAuth2 credentials.  
    - Connect from "Transforms markdown to HTML".

14. **Add a HubSpot node ("Set owner to contact"):**  
    - Email: same as above.  
    - Set `contactOwner` field to ID from "Get current owner".  
    - Authenticate with HubSpot OAuth2.  
    - Connect from "Send the message".

15. **Add LangChain Tool Workflow node ("calendarAgent"):**  
    - Configure to call the same workflow recursively.  
    - This node is used internally by the AI agent to perform calendar actions.

16. **Add Google Calendar nodes for calendarAgent sub-workflow:**  
    - "Get Events", "Create Event", "Create Event with Attendee", "Update Event", "Delete Event" nodes configured with Google Calendar OAuth2.  
    - These nodes receive commands from the calendarAgent tool.

17. **Add Set nodes for status messages ("Success" and "Try Again"):**  
    - "Success": Sets a success message with AI output.  
    - "Try Again": Sets retry prompt message.  
    - Connect "Calendar Agent" main output to "Success" and error output to "Try Again".

18. **Add necessary sticky notes for documentation and instructions.**

19. **Ensure all credentials are properly configured:**  
    - HubSpot OAuth2 for HubSpot API nodes.  
    - Google Calendar OAuth2 for calendar nodes.  
    - OpenAI API key for AI nodes.  
    - Gmail OAuth2 for email sending.

20. **Activate the workflow.**

---

### 5. General Notes & Resources

| Note Content                                                                                                                                              | Context or Link                                                                                   |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| This workflow automates customer onboarding by sending personalized AI-generated welcome emails and scheduling calendar events automatically.             | Description section                                                                              |
| Calendar tool integration inspired by Nate Herk’s YouTube channel: https://www.youtube.com/@nateherk                                                       | Sticky Note3                                                                                    |
| Contact the author for workflow modifications or custom workflows at: thomas@pollup.net                                                                     | Sticky Note7                                                                                    |
| Setup instructions for webhook integration in HubSpot and n8n included in Sticky Note1                                                                    | Sticky Note1                                                                                    |
| The sender email configured must match the HubSpot owner email for correct owner assignment filtering                                                     | Sticky Note2                                                                                    |
| AI prompt is customizable to fit brand voice and onboarding style                                                                                        | Email writer node description and Sticky Note4                                                  |

---

This completes the comprehensive structured documentation of the "Automate New Customer Onboarding with HubSpot, Google Calendar, and AI-Powered Gmail" n8n workflow.