AI-Powered Multi-Channel Lead Outreach with JotForm, Gemini AI & HeyReach

https://n8nworkflows.xyz/workflows/ai-powered-multi-channel-lead-outreach-with-jotform--gemini-ai---heyreach-9607


# AI-Powered Multi-Channel Lead Outreach with JotForm, Gemini AI & HeyReach

### 1. Workflow Overview

This workflow automates a multi-channel lead outreach process by integrating JotForm submissions with AI-powered message generation and outreach tools. It targets B2B SaaS and AI automation services, focusing on personalizing LinkedIn and email messages to key decision-makers based on lead data collected from a JotForm. The workflow integrates with Google Gemini AI for generating personalized outreach content and HeyReach for campaign management.

Logical blocks:

- **1.1 Input Reception:** Triggering on new JotForm submissions capturing lead data fields.
- **1.2 Lead Enrichment & Storage:** Enriching lead data using Clearbit API, then storing data in tables.
- **1.3 Decision Branching:** Conditional logic to determine outreach channel (LinkedIn vs email).
- **1.4 LinkedIn Message Generation & Campaign Addition:** Using Google Gemini AI to create personalized LinkedIn messages, parsing output, and adding leads to HeyReach campaigns.
- **1.5 Email Message Generation & Sending:** Similar AI-powered generation of transactional email messages, parsing output, and sending emails via Gmail.
- **1.6 Status Updates and Logging:** Recording statuses and interactions in data tables for tracking.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

**Overview:**  
This block initiates the workflow on each form submission, capturing key lead information for processing.

**Nodes Involved:**  
- JotForm Trigger1  
- Sticky Note6

**Node Details:**

- **JotForm Trigger1**  
  - *Type:* JotForm Trigger  
  - *Role:* Listens for new submissions on a specific JotForm (ID 252808415357461).  
  - *Configuration:* Connected with JotForm API credentials; webhook set up to receive submission data.  
  - *Key Data Captured:* Name, First Name, Last Name, Email, LinkedIn Profile, Company Name, Marketing Budget, Domain, Specific Query.  
  - *Input:* External form submissions  
  - *Output:* JSON object with form field values  
  - *Edge Cases:* Missing fields, API connectivity errors, webhook misconfiguration.  
  - *Sticky Note:* Describes form fields captured.

- **Sticky Note6**  
  - *Type:* Visual annotation  
  - *Role:* Documents the fields captured by the form for human reference.  
  - *Sticky Note Content:* Lists the main input fields captured from the form.

---

#### 2.2 Lead Enrichment & Storage

**Overview:**  
This block enriches the incoming lead data via Clearbit API and logs the enriched data into a data table for record-keeping.

**Nodes Involved:**  
- HTTP Request  
- Insert row

**Node Details:**

- **HTTP Request**  
  - *Type:* HTTP Request  
  - *Role:* Calls Clearbit's person enrichment API using the lead's email to fetch additional company and personal data.  
  - *Configuration:* URL dynamically constructed with email from incoming data; Authorization header uses a bearer token stored in environment variable `CLEARBIT_API_KEY`.  
  - *Input:* JSON with lead email from JotForm Trigger1  
  - *Output:* JSON with enriched lead data.  
  - *Edge Cases:* API rate limits, invalid/missing emails, authorization failures.

- **Insert row**  
  - *Type:* Data Table (storage node)  
  - *Role:* Saves enriched lead data into a configured data table (schema defined dynamically).  
  - *Input:* Output from HTTP Request  
  - *Output:* Data table record confirmation  
  - *Edge Cases:* Data table schema mismatch, write permission issues.

---

#### 2.3 Decision Branching

**Overview:**  
Determines the outreach channel based on a field named `journey`. If the journey is empty or different from "linkedin," the workflow splits to different wait nodes leading to LinkedIn or email outreach.

**Nodes Involved:**  
- If1  
- Wait1  
- Wait2

**Node Details:**

- **If1**  
  - *Type:* If (conditional)  
  - *Role:* Checks conditions on the `journey` field to split workflow paths.  
  - *Configuration:* Two conditions — (1) `journey` field is empty, and (2) `journey` is not equal to "linkedin".  
  - *Input:* Data from Insert row  
  - *Output:* Two branches: true (to Wait1), false (to Wait2)  
  - *Edge Cases:* Missing or malformed `journey` field causing incorrect routing.

- **Wait1**  
  - *Type:* Wait  
  - *Role:* Delays execution before LinkedIn message generation  
  - *Input:* True branch from If1  
  - *Output:* Linkedin Message Agent node  
  - *Edge Cases:* Delay misconfiguration causing workflow stalls.

- **Wait2**  
  - *Type:* Wait  
  - *Role:* Delays before email message generation  
  - *Input:* False branch from If1  
  - *Output:* Transactional Email node  
  - *Edge Cases:* Same as Wait1.

---

#### 2.4 LinkedIn Message Generation & Campaign Addition

**Overview:**  
Generates a personalized LinkedIn outreach message using Google Gemini AI, parses the structured response, sends it to HeyReach to add the lead to a campaign, and logs the updated status.

**Nodes Involved:**  
- Google Gemini Chat Model  
- Structured Output Parser  
- Linkedin Message Agent  
- Add leads to campaign  
- Updated Linkedin Status  
- Sticky Note7, Sticky Note8

**Node Details:**

- **Google Gemini Chat Model**  
  - *Type:* Langchain Google Gemini Chat Model  
  - *Role:* AI language model generating raw LinkedIn message content.  
  - *Configuration:* Uses connected Google Palm API credentials.  
  - *Input:* Triggered from Wait1  
  - *Output:* AI-generated text response  
  - *Edge Cases:* API errors, rate limits, malformed prompts.

- **Structured Output Parser**  
  - *Type:* Langchain Structured Output Parser  
  - *Role:* Parses AI output into a JSON schema with key `linkedinMessage` for structured data.  
  - *Configuration:* JSON schema example includes a sample LinkedIn message.  
  - *Input:* Output from Google Gemini Chat Model  
  - *Output:* Parsed message JSON  
  - *Edge Cases:* Parsing failures if AI output does not conform to schema.

- **Linkedin Message Agent**  
  - *Type:* Langchain Agent  
  - *Role:* Defines prompt and logic for LinkedIn message generation with personalization.  
  - *Configuration:* System message emphasizes expert B2B SaaS outreach message creation; prompt uses variables from form submission (e.g., Name, Email, Company Name, Marketing Budget, Specific Query). Includes output parser.  
  - *Input:* Output from Structured Output Parser and Google Gemini Chat Model  
  - *Output:* Final LinkedIn message JSON  
  - *Edge Cases:* Expression or variable substitution errors.

- **Add leads to campaign**  
  - *Type:* HeyReach API node  
  - *Role:* Adds generated lead data and LinkedIn message to a HeyReach campaign for outreach.  
  - *Configuration:* Uses HeyReach API credentials; maps lead details including lastName, firstName, and custom fields like marketing budget, domain, specific question, and LinkedIn message content.  
  - *Input:* Output from Linkedin Message Agent  
  - *Output:* Confirmation of lead addition  
  - *Edge Cases:* API authentication issues, invalid campaign or lead data.

- **Updated Linkedin Status**  
  - *Type:* Data Table  
  - *Role:* Logs the updated LinkedIn outreach status into a data table.  
  - *Input:* Output from Add leads to campaign  
  - *Output:* Data table entry confirmation

- **Sticky Note7, Sticky Note8**  
  - *Type:* Visual annotations  
  - *Role:* Provide visual context and possibly branding/images near LinkedIn message nodes.

---

#### 2.5 Email Message Generation & Sending

**Overview:**  
Generates personalized transactional email messages using Google Gemini AI, parses output, sends email via Gmail node, and logs message sending status.

**Nodes Involved:**  
- Google Gemini Chat Model1  
- Structured Output Parser1  
- Transactional Email  
- Send a message  
- Insert row1

**Node Details:**

- **Google Gemini Chat Model1**  
  - *Type:* Langchain Google Gemini Chat Model  
  - *Role:* AI model for generating transactional email content.  
  - *Configuration:* Uses same Google Palm API credentials as LinkedIn model.  
  - *Input:* Triggered from Wait2  
  - *Output:* Raw AI-generated email text  
  - *Edge Cases:* Similar to Google Gemini Chat Model.

- **Structured Output Parser1**  
  - *Type:* Langchain Structured Output Parser  
  - *Role:* Parses AI output into an `EmailMessage` JSON key with structured message content.  
  - *Input:* Output from Google Gemini Chat Model1  
  - *Output:* Parsed email message JSON

- **Transactional Email**  
  - *Type:* Langchain Agent  
  - *Role:* Defines prompt and logic to generate email messages similar in style and intent to LinkedIn messages, but for email outreach.  
  - *Configuration:* Prompt and system message similar to LinkedIn agent, with personalization fields. Includes output parser.  
  - *Input:* Output from Structured Output Parser1 and Google Gemini Chat Model1  
  - *Output:* Final email message JSON

- **Send a message**  
  - *Type:* Gmail node  
  - *Role:* Sends the generated email message to the lead’s email address.  
  - *Configuration:* Uses Gmail OAuth2 credentials; email recipient set dynamically from lead data; subject hardcoded as "hi" (likely placeholder).  
  - *Input:* Output from Transactional Email  
  - *Output:* Email sent confirmation or error  
  - *Edge Cases:* OAuth expiration, invalid email addresses, SMTP errors.

- **Insert row1**  
  - *Type:* Data Table  
  - *Role:* Logs email sending status and details for tracking.  
  - *Input:* Output from Send a message  
  - *Output:* Data table entry confirmation

---

### 3. Summary Table

| Node Name               | Node Type                                | Functional Role                             | Input Node(s)           | Output Node(s)               | Sticky Note                                                       |
|-------------------------|-----------------------------------------|---------------------------------------------|-------------------------|-----------------------------|-------------------------------------------------------------------|
| JotForm Trigger1         | JotForm Trigger                         | Initiates workflow on form submission       | External                 | HTTP Request                 | Captures form fields: Name, Email, LinkedIn, Company, etc.        |
| HTTP Request            | HTTP Request                           | Enriches lead data via Clearbit API          | JotForm Trigger1         | Insert row                   |                                                                   |
| Insert row              | Data Table                             | Stores enriched lead data                     | HTTP Request             | If1                         |                                                                   |
| If1                     | If (Conditional)                       | Branches workflow based on 'journey' field  | Insert row               | Wait1, Wait2                 |                                                                   |
| Wait1                   | Wait                                  | Delay before LinkedIn message generation     | If1                      | Linkedin Message Agent       |                                                                   |
| Linkedin Message Agent  | Langchain Agent                       | Generates LinkedIn outreach message          | Wait1                    | Add leads to campaign        |                                                                   |
| Google Gemini Chat Model | Langchain Google Gemini Chat Model    | AI model generating LinkedIn message         | Linkedin Message Agent (ai_languageModel) | Structured Output Parser  |                                                                   |
| Structured Output Parser | Langchain Output Parser               | Parses AI LinkedIn message output             | Google Gemini Chat Model | Linkedin Message Agent (ai_outputParser) |                                                                   |
| Add leads to campaign    | HeyReach API                         | Adds lead and message to HeyReach campaign  | Linkedin Message Agent   | Updated Linkedin Status      |                                                                   |
| Updated Linkedin Status  | Data Table                           | Logs LinkedIn outreach status                 | Add leads to campaign    |                             |                                                                   |
| Wait2                   | Wait                                  | Delay before email generation                 | If1                      | Transactional Email          |                                                                   |
| Transactional Email      | Langchain Agent                       | Generates personalized email message         | Wait2                    | Send a message              |                                                                   |
| Google Gemini Chat Model1| Langchain Google Gemini Chat Model    | AI model generating transactional email      | Transactional Email (ai_languageModel) | Structured Output Parser1 |                                                                   |
| Structured Output Parser1| Langchain Output Parser               | Parses AI email output                         | Google Gemini Chat Model1| Transactional Email (ai_outputParser) |                                                                   |
| Send a message          | Gmail                                | Sends email to lead                           | Transactional Email      | Insert row1                 |                                                                   |
| Insert row1             | Data Table                           | Logs email sending status                      | Send a message           |                             |                                                                   |
| Sticky Note6            | Sticky Note                         | Documents captured form fields                 |                         |                             | Captures form fields: Name, Email, LinkedIn Profile, Domain, etc. |
| Sticky Note7            | Sticky Note                         | Visual annotation near LinkedIn message nodes |                         |                             | Displays image for visual context                                |
| Sticky Note8            | Sticky Note                         | Empty visual annotation                         |                         |                             |                                                                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create JotForm Trigger node:**  
   - Type: JotForm Trigger  
   - Credentials: Connect your JotForm API account  
   - Parameters: Select form with ID `252808415357461`  
   - Position: Start of workflow

2. **Add HTTP Request node:**  
   - Type: HTTP Request  
   - Connect input from JotForm Trigger  
   - URL: `https://person.clearbit.com/v2/combined/find?email={{$json.email}}`  
   - Method: GET  
   - Headers: Add `Authorization: Bearer {{CLEARBIT_API_KEY}}` (set environment variable CLEARBIT_API_KEY)  
   - Purpose: Enrich lead data using Clearbit API

3. **Add Data Table node (Insert row):**  
   - Type: Data Table  
   - Connect input from HTTP Request  
   - Configure columns as needed to store enriched data  
   - Purpose: Log enriched lead data for tracking

4. **Add If node (If1):**  
   - Type: If (conditional)  
   - Connect input from Insert row  
   - Conditions:  
     - Check if `journey` field is empty  
     - AND `journey` is not equal to `"linkedin"`  
   - Define two outputs (true, false) to branch workflow

5. **Add two Wait nodes:**  
   - Wait1 connected to true output of If1 (for LinkedIn path)  
   - Wait2 connected to false output of If1 (for email path)

6. **LinkedIn Message Path:**  
   a. Add Langchain Google Gemini Chat Model node:  
      - Connect input from Wait1  
      - Credentials: Google Palm API credentials  
      - Purpose: Generate LinkedIn message content  
   b. Add Langchain Structured Output Parser node:  
      - Connect input from Google Gemini Chat Model  
      - Configure JSON schema example with a `linkedinMessage` field  
   c. Add Langchain Agent node (Linkedin Message Agent):  
      - Connect input from Structured Output Parser and Google Gemini Chat Model (as language model)  
      - System message: Expert LinkedIn outreach message creator for B2B SaaS/AI automation  
      - Prompt: Use variables like Name, Email, Company Name, Marketing Budget, Specific Query  
      - Enable output parser  
   d. Add HeyReach node (Add leads to campaign):  
      - Connect input from Linkedin Message Agent  
      - Credentials: HeyReach API credentials  
      - Map lead fields including custom fields for marketing budget, domain, specific question, LinkedIn message content  
   e. Add Data Table node (Updated Linkedin Status):  
      - Connect input from Add leads to campaign  
      - Purpose: Log LinkedIn campaign addition status

7. **Email Message Path:**  
   a. Add Langchain Google Gemini Chat Model node (Google Gemini Chat Model1):  
      - Connect input from Wait2  
      - Credentials: Google Palm API (same as LinkedIn path)  
   b. Add Langchain Structured Output Parser node (Structured Output Parser1):  
      - Connect input from Google Gemini Chat Model1  
      - JSON schema example with `EmailMessage` field  
   c. Add Langchain Agent node (Transactional Email):  
      - Connect input from Structured Output Parser1 and Google Gemini Chat Model1  
      - System message: Expert email outreach message creator, similar style to LinkedIn agent  
      - Prompt: Use same personalization fields  
      - Output parser enabled  
   d. Add Gmail node (Send a message):  
      - Connect input from Transactional Email  
      - Credentials: Gmail OAuth2 credentials  
      - Send to: `={{ $json.email }}`  
      - Subject: Set appropriate subject (currently "hi")  
   e. Add Data Table node (Insert row1):  
      - Connect input from Send a message  
      - Purpose: Log email send status

8. **Add Sticky Notes for documentation:**  
   - Add Sticky Note6 near JotForm Trigger describing captured fields  
   - Add Sticky Note7 and Sticky Note8 near LinkedIn message nodes for visual context

9. **Configure all credentials:**  
   - JotForm API  
   - Google Palm API (for Gemini AI)  
   - HeyReach API  
   - Gmail OAuth2  
   - Set environment variable `CLEARBIT_API_KEY` for Clearbit API authentication

10. **Test workflow:**  
    - Submit test data via configured JotForm  
    - Verify lead enrichment, AI message generation, campaign addition, and email sending  
    - Monitor data tables for logging accuracy

---

### 5. General Notes & Resources

| Note Content                                                                                                                    | Context or Link                                                                                                      |
|---------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| This workflow automates personalized multi-channel outreach combining form data capture, AI-generated messaging, and campaign management. | Project description and use case overview                                                                            |
| LinkedIn outreach messages are designed to be concise, human, and focused on AI automation benefits for B2B SaaS companies.     | Prompt design in Linkedin Message Agent                                                                              |
| Email messages follow a similar style but are adapted for transactional email communication with a soft call to action.         | Prompt design in Transactional Email node                                                                            |
| API authentication for Clearbit requires a valid API key stored in environment variables for security best practices.           | Clearbit API integration                                                                                             |
| HeyReach integration facilitates lead management and campaign automation for LinkedIn outreach.                                 | HeyReach API node usage                                                                                              |
| Google Gemini (PaLM) AI is used for natural language generation via Langchain nodes.                                            | Google Palm API credentials and Langchain node configuration                                                         |
| Gmail OAuth2 credentials must be set up with appropriate scopes to send emails programmatically.                                | Gmail node configuration                                                                                             |
| Sticky notes provide visual documentation and reminders regarding node functions and captured data fields.                      | Workflow annotations                                                                                                 |
| Workflow includes wait nodes to control timing and sequencing between AI generation and subsequent steps.                      | Wait nodes usage for pacing                                                                                          |
| Example output style for messages is included in structured output parser schemas for consistent parsing and validation.        | Structured Output Parser JSON schema examples                                                                         |
| Workflow depends on correct field names from JotForm; ensure form field IDs/names align with those used in expressions.         | JotForm field mapping                                                                                                |

---

**Disclaimer:**  
The provided text is extracted exclusively from an automated workflow created with n8n, an integration and automation tool. This process strictly complies with current content policies and contains no illegal, offensive, or protected material. All data handled is legal and publicly available.