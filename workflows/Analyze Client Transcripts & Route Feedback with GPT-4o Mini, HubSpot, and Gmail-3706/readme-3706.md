Analyze Client Transcripts & Route Feedback with GPT-4o Mini, HubSpot, and Gmail

https://n8nworkflows.xyz/workflows/analyze-client-transcripts---route-feedback-with-gpt-4o-mini--hubspot--and-gmail-3706


# Analyze Client Transcripts & Route Feedback with GPT-4o Mini, HubSpot, and Gmail

### 1. Workflow Overview

This workflow automates the processing of client conversation transcripts for Customer Satisfaction Managers, sales, and operations teams. It streamlines the extraction of key insights from transcripts, logs summarized notes into HubSpot CRM, and routes relevant feedback to appropriate departments via email.

The workflow is logically divided into four main blocks:

- **1.1 Input Reception**: Captures client transcripts and email addresses via a form trigger.
- **1.2 HubSpot Synchronization**: Searches for the client’s HubSpot contact ID and uploads summarized meeting notes.
- **1.3 AI-Powered Routing**: Uses OpenAI GPT-4o Mini and LangChain agents to analyze the transcript, categorize feedback by department, and send emails to the relevant teams.
- **1.4 Workflow Completion**: Presents an optional confirmation form to the user signaling workflow completion.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

**Overview:**  
This block collects the client’s email and conversation transcript through a form interface, serving as the workflow’s entry point.

**Nodes Involved:**  
- Enter Client Transcript  
- Define routing emails here  
- Sticky Note3 (comment)

**Node Details:**

- **Enter Client Transcript**  
  - *Type & Role:* Form Trigger; initiates workflow on form submission.  
  - *Configuration:*  
    - Form titled "Automate Client issue"  
    - Fields: "client email" (email, required), "client conversation" (textarea, required)  
    - Webhook ID configured for external form submission  
  - *Expressions:* Uses form inputs as JSON fields for downstream nodes.  
  - *Connections:* Outputs to "Define routing emails here".  
  - *Edge Cases:* Invalid email format, empty conversation text, webhook failures.  
  - *Notes:* Transcript can originate from various sources (e.g., Fireflies, Teams).  

- **Define routing emails here**  
  - *Type & Role:* Set node; defines static email addresses for department routing.  
  - *Configuration:* Assigns string variables for Support, Administrative, Product, and Commercial emails.  
  - *Expressions:* Hardcoded email addresses for routing logic.  
  - *Connections:* Outputs to "Summarization".  
  - *Edge Cases:* Emails must be valid; changes require manual update.  

- **Sticky Note3**  
  - *Type & Role:* Documentation; marks the starting form block.  
  - *Content:* "Starting form"  

---

#### 2.2 HubSpot Synchronization

**Overview:**  
This block searches HubSpot for the client’s contact ID using their email and uploads summarized meeting notes to the contact’s record.

**Nodes Involved:**  
- HubSpot1 (Search for ID)  
- HubSpot (Add meeting notes)  
- Summarization (provides summary text)  
- Sticky Note  
- Sticky Note2 (email assignment reminder)

**Node Details:**

- **HubSpot1**  
  - *Type & Role:* HubSpot node; performs a contact search by email.  
  - *Configuration:*  
    - Operation: Search  
    - Filter: email equals client email from form input  
    - Authentication: OAuth2 with HubSpot credentials  
  - *Expressions:* Uses `={{ $('Enter Client Transcript').item.json['client email'] }}` to filter.  
  - *Connections:* Outputs contact data to "HubSpot".  
  - *Edge Cases:* Contact not found, API rate limits, auth failures.  

- **HubSpot**  
  - *Type & Role:* HubSpot node; creates a meeting engagement with notes.  
  - *Configuration:*  
    - Type: Meeting  
    - Metadata body: summary text from "Summarization" node  
    - Title: "New meeting"  
    - Associations: links meeting to contact ID from "HubSpot1"  
    - Authentication: OAuth2 with HubSpot credentials  
  - *Expressions:* `={{ $('Summarization').item.json.response.text }}` for note body, `={{ $json.properties.hs_object_id }}` for contact ID.  
  - *Connections:* None (terminal for this branch).  
  - *Edge Cases:* Missing contact ID, API errors, permission issues.  

- **Summarization**  
  - *Type & Role:* LangChain Summarization chain; condenses the client conversation.  
  - *Configuration:*  
    - Prompt: Summarize conversation in 2-3 sentences, output only summary, same language as input  
    - Method: "stuff" (concatenate input for summarization)  
  - *Expressions:* Uses client conversation from form input.  
  - *Connections:* Outputs to "HubSpot1" and "Router Agent".  
  - *Edge Cases:* Long transcripts exceeding token limits, prompt failures.  

- **Sticky Note**  
  - *Type & Role:* Documentation; explains HubSpot data saving steps.  
  - *Content:*  
    - Search for client ID by email  
    - Upload summarized conversation as meeting notes  

- **Sticky Note2**  
  - *Type & Role:* Documentation; reminds to set emails for responsible parties.  
  - *Content:* "Set the emails HERE for each responsible in your company."  

---

#### 2.3 AI-Powered Routing

**Overview:**  
This block analyzes the client transcript using an LLM to categorize feedback by department and sends emails to the appropriate recipients.

**Nodes Involved:**  
- OpenAI Chat Model  
- Router Agent  
- Gmail  
- Sticky Note1

**Node Details:**

- **OpenAI Chat Model**  
  - *Type & Role:* LangChain OpenAI chat model node; processes text for summarization and routing.  
  - *Configuration:*  
    - Model: GPT-4o Mini  
    - No additional options configured  
    - Credentials: OpenAI API key  
  - *Connections:* Outputs to "Summarization" and "Router Agent" via ai_languageModel channel.  
  - *Edge Cases:* API rate limits, invalid API key, model unavailability.  

- **Router Agent**  
  - *Type & Role:* LangChain Agent node; routes feedback to departments based on transcript content.  
  - *Configuration:*  
    - Input text: client conversation from form input  
    - System message: instructions to decide which department to inform, with email addresses dynamically inserted from "Define routing emails here"  
    - Adds client email at the start of the message with prefix "FROM CLIENT:"  
    - Uses Mailjet tool internally to send emails with subject, recipient, and HTML body as the client conversation  
  - *Connections:* Outputs to "Form" and receives input from "Summarization" and "OpenAI Chat Model".  
  - *Edge Cases:* Misclassification of feedback, email sending failures, missing routing emails.  

- **Gmail**  
  - *Type & Role:* Gmail node; sends emails to routed departments.  
  - *Configuration:*  
    - Parameters (To, Subject, Message) dynamically set by AI tool output from "Router Agent"  
    - OAuth2 credentials for Gmail account  
  - *Connections:* Receives input from "Router Agent" ai_tool output.  
  - *Edge Cases:* Gmail API quota, auth failures, invalid email addresses.  

- **Sticky Note1**  
  - *Type & Role:* Documentation; describes routing agent functionality.  
  - *Content:*  
    - Analyzes content with LLM  
    - Decides relevant transcript parts per department  
    - Sends emails accordingly  

---

#### 2.4 Workflow Completion

**Overview:**  
This block provides a user-facing form to confirm workflow completion and display output messages.

**Nodes Involved:**  
- Form

**Node Details:**

- **Form**  
  - *Type & Role:* Form node; displays completion message to user.  
  - *Configuration:*  
    - Operation: Completion  
    - Completion title: "Output"  
    - Completion message: dynamically set from router agent output JSON field `output`  
  - *Connections:* Receives input from "Router Agent".  
  - *Edge Cases:* Missing output data, form display errors.  

---

### 3. Summary Table

| Node Name              | Node Type                          | Functional Role                         | Input Node(s)              | Output Node(s)           | Sticky Note                                                                                         |
|------------------------|----------------------------------|---------------------------------------|---------------------------|--------------------------|---------------------------------------------------------------------------------------------------|
| Enter Client Transcript | Form Trigger                     | Capture client email and transcript   | -                         | Define routing emails here | Sticky Note3: "Starting form"                                                                     |
| Define routing emails here | Set                            | Define department routing email addresses | Enter Client Transcript    | Summarization            | Sticky Note2: "Set the emails HERE for each responsible in your company."                         |
| Summarization          | LangChain Summarization Chain    | Summarize client conversation         | Define routing emails here, OpenAI Chat Model | Router Agent, HubSpot1 | Sticky Note: "Search for client ID by email; upload summarized conversation as meeting notes"     |
| HubSpot1               | HubSpot (search)                 | Search HubSpot contact by email       | Summarization             | HubSpot                  |                                                                                                   |
| HubSpot                | HubSpot (engagement create)      | Add meeting notes to HubSpot contact  | HubSpot1                  | -                        |                                                                                                   |
| OpenAI Chat Model      | LangChain OpenAI Chat Model      | Process text for summarization & routing | -                       | Summarization, Router Agent |                                                                                                   |
| Router Agent           | LangChain Agent                  | Analyze transcript and route feedback | Summarization, OpenAI Chat Model | Form, Gmail (ai_tool)    | Sticky Note1: "Analyzes content with LLM; routes to departments; sends emails"                    |
| Gmail                  | Gmail Tool                      | Send routed emails to departments     | Router Agent (ai_tool)     | -                        |                                                                                                   |
| Form                   | Form                            | Display completion confirmation       | Router Agent              | -                        |                                                                                                   |
| Sticky Note            | Sticky Note                     | Documentation                        | -                         | -                        | "Search for the client ID based on his email; upload the summarized conversation as meeting notes"|
| Sticky Note1           | Sticky Note                     | Documentation                        | -                         | -                        | "Router agent analyzes content and sends emails to departments"                                  |
| Sticky Note2           | Sticky Note                     | Documentation                        | -                         | -                        | "Set the emails HERE for each responsible in your company."                                      |
| Sticky Note3           | Sticky Note                     | Documentation                        | -                         | -                        | "Starting form"                                                                                   |
| Sticky Note7           | Sticky Note                     | Contact info for workflow support    | -                         | -                        | "Contact me: thomas@pollup.net for modifications or help"                                        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Form Trigger Node**  
   - Name: Enter Client Transcript  
   - Type: Form Trigger  
   - Configure webhook with a unique ID or leave auto-generated  
   - Form Title: "Automate Client issue"  
   - Add two fields:  
     - Email field labeled "client email" (required)  
     - Textarea field labeled "client conversation" (required)  

2. **Create a Set Node for Routing Emails**  
   - Name: Define routing emails here  
   - Type: Set  
   - Add string fields with these exact names and values:  
     - Support Email: support@pollup.net  
     - Administrative Email: admin@pollup.net  
     - Product Email: product@pollup.net  
     - Commercial Email: commercial@pollup.net  
   - Connect Enter Client Transcript → Define routing emails here  

3. **Create OpenAI Chat Model Node**  
   - Name: OpenAI Chat Model  
   - Type: LangChain OpenAI Chat Model  
   - Model: gpt-4o-mini  
   - Credentials: Configure with your OpenAI API key  
   - No additional options needed  
   - Connect Define routing emails here → OpenAI Chat Model (ai_languageModel)  

4. **Create Summarization Node**  
   - Name: Summarization  
   - Type: LangChain Summarization Chain  
   - Prompt:  
     ```
     Summarize the following Conversation in 2-3 sentences:

     "{{ $json['client conversation'] }}"

     Just output the summarized conversation and nothing else. Use the same language as the input
     ```  
   - Method: "stuff"  
   - Connect Define routing emails here → Summarization  
   - Connect OpenAI Chat Model → Summarization (ai_languageModel)  

5. **Create HubSpot Search Node**  
   - Name: HubSpot1  
   - Type: HubSpot  
   - Operation: Search  
   - Resource: Contact  
   - Filter: email equals `={{ $('Enter Client Transcript').item.json['client email'] }}`  
   - Authentication: OAuth2 with HubSpot credentials  
   - Connect Summarization → HubSpot1  

6. **Create HubSpot Engagement Node**  
   - Name: HubSpot  
   - Type: HubSpot  
   - Operation: Create Engagement (meeting)  
   - Metadata:  
     - Title: "New meeting"  
     - Body: `={{ $('Summarization').item.json.response.text }}`  
   - Associations: contactIds = `={{ $json.properties.hs_object_id }}` from HubSpot1 output  
   - Authentication: OAuth2 with HubSpot credentials  
   - Connect HubSpot1 → HubSpot  

7. **Create Router Agent Node**  
   - Name: Router Agent  
   - Type: LangChain Agent  
   - Text input: `={{ $('Enter Client Transcript').item.json['client conversation'] }}`  
   - System message:  
     ```
     You are provided with some client-company conversation and should decide who has to be informed about the feedback. Always only inform one person. Those are your options: 
     - It's about a product, send an email to {{ $('Define routing emails here').item.json['Product Email'] }}
     - It's about an invoicing problem, send an email to {{ $('Define routing emails here').item.json['Administrative Email'] }}
     - It's  related to a problem with the product, send an email to {{ $('Define routing emails here').item.json['Support Email'] }}
     - It's commercial related, send an email to {{ $('Define routing emails here').item.json['Commercial Email'] }}

     Add the email of the person ("{{ $('Enter Client Transcript').item.json['client email'] }}") at the beginning of the text preceded by "FROM CLIENT: "
     Use the Mailjet tool to inform each of the most related department. Provide mailjet with a subject, an email, and the email body formatted as html which is the client conversation itself.
     ```  
   - Connect Summarization → Router Agent  
   - Connect OpenAI Chat Model → Router Agent (ai_languageModel)  

8. **Create Gmail Node**  
   - Name: Gmail  
   - Type: Gmail Tool  
   - Parameters:  
     - Send To: `={{ $fromAI('To', '', 'string') }}`  
     - Subject: `={{ $fromAI('Subject', '', 'string') }}`  
     - Message: `={{ $fromAI('Message', '', 'string') }}`  
   - Credentials: OAuth2 Gmail account  
   - Connect Router Agent (ai_tool output) → Gmail  

9. **Create Completion Form Node**  
   - Name: Form  
   - Type: Form  
   - Operation: Completion  
   - Completion Title: "Output"  
   - Completion Message: `={{ $json.output }}` (from Router Agent output)  
   - Connect Router Agent → Form  

10. **Add Sticky Notes for Documentation**  
    - Place notes near relevant nodes to explain purpose and instructions, including:  
      - Starting form  
      - HubSpot data saving steps  
      - Routing agent logic  
      - Email assignment reminder  
      - Contact info for workflow support  

---

### 5. General Notes & Resources

| Note Content                                                                                         | Context or Link                          |
|----------------------------------------------------------------------------------------------------|----------------------------------------|
| Contact me for workflow modifications or help: [thomas@pollup.net](mailto:thomas@pollup.net)       | Workflow support and customization     |
| Workflow designed for Customer Satisfaction Managers, sales, and operations teams                   | Target audience                        |
| Use OAuth2 credentials for HubSpot and Gmail nodes                                                 | Credential setup                       |
| Adjust OpenAI prompt to customize categorization criteria (e.g., add more departments)             | Customization tip                      |
| Extend workflow to pull transcripts from other sources like Zoom or Slack                          | Enhancement suggestion                 |
| Add Slack or MS Teams notifications for urgent feedback                                            | Enhancement suggestion                 |
| Introduce retries or fallback actions for HubSpot/Gmail failures                                   | Error handling recommendation         |

---

This structured documentation enables advanced users and AI agents to fully understand, reproduce, and extend the workflow with confidence.