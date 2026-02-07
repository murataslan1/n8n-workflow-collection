 Smart Email Responder Workflow using AI

https://n8nworkflows.xyz/workflows/-smart-email-responder-workflow-using-ai-4807


#  Smart Email Responder Workflow using AI

### 1. Workflow Overview

This workflow, titled **Smart Email Auto-Responder**, automates intelligent email replies based on the content and context of incoming Gmail messages. It is designed primarily for handling emails within a corporate environment (specifically targeting emails related to project updates, questions, or feedback), leveraging AI classification and natural language generation to respond appropriately. The workflow uses Gmail as the trigger, classifies incoming emails into categories using AI, and sends tailored email responses based on the classification. It also manages calendar event invitations for meeting scheduling and updates email states (marking as read and applying labels).

**Target Use Cases:**  
- Automatic categorization and response to emails from existing contract partners or internal stakeholders.  
- Scheduling meetings with email senders when questions arise.  
- Acknowledging project updates or feedback with customized messages.  
- Managing Gmail message states (mark as read, add labels) to maintain inbox organization.

**Logical Blocks:**  
- **1.1 Input Reception:** Triggering on new Gmail messages with a specific label.  
- **1.2 Email Source Validation:** Filtering emails from known contract domains.  
- **1.3 AI-Based Text Classification:** Categorizing email content into Questions, Project Updates, or Feedback.  
- **1.4 Response Preparation and Dispatch:** Generating and sending appropriate email replies, including scheduling meetings and acknowledgment messages.  
- **1.5 Gmail Message State Management:** Marking emails as read and applying labels after processing.  
- **1.6 Meeting Slot Retrieval and Invitation Handling:** Querying Google Calendar for available slots, formatting slot data, updating calendar events with invitees.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  Listens for incoming emails in Gmail that have a specific label applied, polling every hour for new messages.

- **Nodes Involved:**  
  - Gmail Trigger

- **Node Details:**  
  - **Gmail Trigger**  
    - Type: Trigger node for Gmail.  
    - Configuration: Monitors Gmail inbox for emails tagged with label ID `"Label_43975351283257832"`. Polls every hour.  
    - Credentials: Uses Gmail OAuth2 credentials.  
    - Inputs: None (trigger).  
    - Outputs: Emits new email data including headers, subject, sender info, and email body.  
    - Potential Failures: Authentication errors, Gmail API rate limits, network issues.

#### 2.2 Email Source Validation

- **Overview:**  
  Filters incoming emails to only process those sent from known contract domains (e.g., `@syncbricks.com`).

- **Nodes Involved:**  
  - Emails from Existing Contracts (IF node)

- **Node Details:**  
  - **Emails from Existing Contracts**  
    - Type: IF node (conditional filtering).  
    - Configuration: Checks if the sender's email address contains the domain `@syncbricks.com`.  
    - Input: Output from Gmail Trigger.  
    - Output: Passes emails matching condition to the next node, discards others.  
    - Edge Cases: Emails with malformed or missing sender headers may fail condition matching.

#### 2.3 AI-Based Text Classification

- **Overview:**  
  Uses AI to classify the incoming email text and subject into one of three categories: Questions, Project Update, or Feedback.

- **Nodes Involved:**  
  - Text Classifier

- **Node Details:**  
  - **Text Classifier**  
    - Type: LangChain Text Classifier node.  
    - Configuration: Input text concatenates email subject and body text from the Gmail Trigger.  
    - Categories:  
      - Questions: Inquiries about company info, products, pricing, legal terms, etc.  
      - Project Update: Notifications about project progress, agreements, deliverables.  
      - Feedback: Compliments, complaints, suggestions.  
    - Input: Email data from Gmail Trigger (filtered).  
    - Output: Email classified into one category, which drives branching logic.  
    - Edge Cases: Ambiguous or very short emails may be misclassified; model API failures possible.

#### 2.4 Response Preparation and Dispatch

- **Overview:**  
  Sends customized email replies based on classification results and controls follow-up actions such as calendar invites or acknowledgment messages.

- **Nodes Involved:**  
  - Google Calendar  
  - Loop Over Items (split in batches)  
  - Code (JavaScript for formatting)  
  - Google Calendar1 (update event)  
  - QuestionsReply (email send)  
  - Youtube Video Inquiry (email send)  
  - Send Email (email send)  
  - Reply (IF node to check if reply needed)

- **Node Details:**  
  - **Reply** (IF node)  
    - Checks if the email subject does NOT start with "Re:" to avoid replying multiple times to the same thread.  
  - **Google Calendar**  
    - Retrieves up to 3 available meeting slots from a specific Google Calendar with the query "Available – Office Visit".  
    - Credentials: Google Calendar OAuth2.  
  - **Loop Over Items**  
    - Processes each calendar event item individually.  
  - **Code**  
    - Extracts sender's name and email from the Gmail Trigger headers.  
    - Formats calendar event times into readable strings for email inclusion.  
    - Passes structured data (slot times, sender info) to the next node.  
  - **Google Calendar1**  
    - Updates each Google Calendar event to add the email sender as an attendee and sends update notifications.  
  - **QuestionsReply** (Email Send)  
    - Sends meeting invitation email including available calendar slots to the sender.  
    - Subject: "Re: [original subject]".  
    - From: configured SMTP email.  
  - **Youtube Video Inquiry** (Email Send)  
    - Sends acknowledgment email for project updates with detailed structured HTML content.  
    - Subject: "Re: [original subject]".  
  - **Send Email** (Email Send)  
    - Sends a thank-you email for feedback received with reference ID.  
    - Subject: "Re: [original subject]".  
  - Credentials: SMTP account configured for all email sends.  
  - Edge Cases:  
    - SMTP failures, invalid email addresses.  
    - Calendar API errors or no available slots.  
    - Formatting errors in code node expressions.

#### 2.5 Gmail Message State Management

- **Overview:**  
  Marks processed emails as read and applies a Gmail category label to keep the inbox organized.

- **Nodes Involved:**  
  - Mark as Read  
  - Apply Label

- **Node Details:**  
  - **Mark as Read**  
    - Marks the processed Gmail message as read using Gmail API.  
    - Input: Message ID from Gmail Trigger.  
    - Credentials: Gmail OAuth2.  
  - **Apply Label**  
    - Adds the Gmail system label `"CATEGORY_UPDATES"` to the email.  
    - Input: Same message ID.  
    - Credentials: Gmail OAuth2.  
  - Edge Cases:  
    - Message ID missing or invalid.  
    - Gmail API rate limits or auth errors.

---

### 3. Summary Table

| Node Name                | Node Type                       | Functional Role                        | Input Node(s)            | Output Node(s)           | Sticky Note                                                                                  |
|--------------------------|--------------------------------|--------------------------------------|--------------------------|--------------------------|----------------------------------------------------------------------------------------------|
| Gmail Trigger            | gmailTrigger                   | Trigger on new labeled Gmail messages | None                     | Emails from Existing Contracts |                                                                                              |
| Emails from Existing Contracts | IF                            | Filter emails from known contract domain | Gmail Trigger            | Reply (false branch), Text Classifier (true branch) |                                                                                              |
| Reply                    | IF                            | Check if email subject does NOT start with "Re:" | Emails from Existing Contracts | Text Classifier           |                                                                                              |
| Text Classifier           | @n8n/n8n-nodes-langchain.textClassifier | Classify email content into categories | Reply                    | Google Calendar, Youtube Video Inquiry, Send Email |                                                                                              |
| Google Calendar           | googleCalendar                | Retrieve available meeting slots       | Text Classifier           | Loop Over Items           |                                                                                              |
| Loop Over Items           | splitInBatches                | Process each calendar event individually | Google Calendar           | Code, Google Calendar1    |                                                                                              |
| Code                     | code                         | Extract sender info and format slot times | Loop Over Items           | QuestionsReply            |                                                                                              |
| Google Calendar1          | googleCalendar                | Add sender as attendee to calendar events | Loop Over Items           | Loop Over Items           |                                                                                              |
| QuestionsReply            | emailSend                    | Send meeting invitation email          | Code                      | Mark as Read              |                                                                                              |
| Youtube Video Inquiry     | emailSend                    | Send project update acknowledgment email | Text Classifier           | Mark as Read              |                                                                                              |
| Send Email               | emailSend                    | Send thank-you email for feedback      | Text Classifier           | Mark as Read              |                                                                                              |
| Mark as Read             | gmail                        | Mark processed email as read            | QuestionsReply, Youtube Video Inquiry, Send Email | Apply Label               |                                                                                              |
| Apply Label              | gmail                        | Apply category label to processed email | Mark as Read              | None                     |                                                                                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Gmail Trigger Node**  
   - Type: Gmail Trigger  
   - Set to poll every hour.  
   - Filter by label ID `"Label_43975351283257832"` (adjust label to your Gmail setup).  
   - Configure Gmail OAuth2 credentials.

2. **Add IF Node "Emails from Existing Contracts"**  
   - Condition: Check if `{{$json.headers.from}}` contains `"@syncbricks.com"`.  
   - Connect Gmail Trigger output to this node.

3. **Add IF Node "Reply"**  
   - Condition: Check if `{{$json.subject}}` does NOT start with `"Re:"` (to avoid repeated replies).  
   - Connect true output of "Emails from Existing Contracts" to this node.

4. **Add Text Classifier Node**  
   - Type: LangChain Text Classifier.  
   - Input Text: Concatenate subject and body text from Gmail Trigger:  
     `={{ $('Gmail Trigger').item.json.subject }}\n{{ $('Gmail Trigger').item.json.text }}`  
   - Define categories:  
     - Questions  
     - Project Update  
     - Feedback  
   - Connect true output of "Reply" node to this node.

5. **Add Google Calendar Node**  
   - Operation: Get All Events  
   - Calendar: Select your shared calendar (example ID given).  
   - Query: `"Available – Office Visit"`  
   - Limit: 3  
   - Order by: Start time  
   - Configure Google Calendar OAuth2 credentials.  
   - Connect "Questions" category output from Text Classifier to this node.

6. **Add SplitInBatches Node "Loop Over Items"**  
   - No special parameters needed.  
   - Connect Google Calendar output to this node.

7. **Add Code Node**  
   - JavaScript to extract sender name/email and format calendar slots:  
     ```javascript
     const triggerJson = $('Gmail Trigger').item.json;
     const headersFrom  = triggerJson.headers.from;
     
     const namePart = headersFrom.split('<')[0].replace(/^From:\s*/i, '').trim();
     const emailPart = headersFrom.match(/<([^>]+)>/)?.[1] || headersFrom;
     
     const slotTimes = items.map(i =>
       new Date(i.json.start.dateTime || i.json.start.date).toLocaleString(
         'en-US',
         { weekday:'short', month:'short', day:'numeric', hour:'numeric',
           minute:'2-digit', hour12:true }
       )
     );
     
     return [{
       json: {
         slotTimes,
         senderName:  namePart,
         senderEmail: emailPart,
         originalSub: triggerJson.subject
       }
     }];
     ```
   - Connect "Loop Over Items" output to this node.

8. **Add Google Calendar Node "Google Calendar1"**  
   - Operation: Update Event  
   - Calendar: Same as before  
   - Event ID: `={{$json.id}}` (from batch item)  
   - Update Fields: Add attendee with sender email from Gmail Trigger  
   - Send update notifications to all attendees.  
   - Connect "Loop Over Items" output to this node as well.

9. **Add Email Send Node "QuestionsReply"**  
   - Configure SMTP credentials.  
   - Subject: `=Re: {{$json.originalSub}}`  
   - To Email: `={{$json.senderName}} <{{$json.senderEmail}}>`  
   - HTML Body includes greeting, meeting location, formatted available slots from `slotTimes` array, instructions for selecting a slot or replying with alternatives.  
   - Connect Code node output to this node.

10. **Add Email Send Node "Youtube Video Inquiry"**  
    - Configure SMTP credentials.  
    - Subject: `=Re: {{$('Gmail Trigger').item.json.subject}}`  
    - To Email: Extracted from Gmail Trigger sender.  
    - HTML Body: Project update acknowledgment with structured content.  
    - Connect "Project Update" category output from Text Classifier to this node.

11. **Add Email Send Node "Send Email"**  
    - Configure SMTP credentials.  
    - Subject: `=Re: {{$('Gmail Trigger').item.json.subject}}`  
    - To Email: Extracted from Gmail Trigger sender.  
    - HTML Body: Thank you for feedback with reference ID from message ID slice.  
    - Connect "Feedback" category output from Text Classifier to this node.

12. **Add Gmail Node "Mark as Read"**  
    - Operation: Mark as read  
    - Message ID: `={{$('Gmail Trigger').all()[0].json.id}}`  
    - Connect output of all Email Send nodes (QuestionsReply, Youtube Video Inquiry, Send Email) to this node.

13. **Add Gmail Node "Apply Label"**  
    - Operation: Add Labels  
    - Label ID: `"CATEGORY_UPDATES"`  
    - Message ID: same as above.  
    - Connect output of "Mark as Read" node to this node.

---

### 5. General Notes & Resources

| Note Content                                                                                                      | Context or Link                                                                                   |
|------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| The workflow uses Google Gemini Chat Model credentials but this node is not connected in the main flow.          | Could be for advanced AI processing or future extension; currently inactive.                     |
| Email HTML templates are richly styled and personalized with sender names and dynamic content (slots, IDs).      | Enhances professionalism and user engagement in automated replies.                              |
| Gmail label filters and Google Calendar IDs must be adapted to your environment for correct operation.          | See Gmail labels and Google Calendar management documentation for setup.                         |
| SMTP credentials used for sending emails should be configured with proper authentication to avoid delivery issues.| Recommended to use OAuth2 SMTP or app-specific passwords depending on provider security policies.|
| The workflow is not active by default; enable after proper testing and credential setup.                         |                                                                                                 |
| For best results, monitor quota limits and error handling for Gmail API, Google Calendar API, and SMTP server.  | Implement retry or alerting mechanisms outside this workflow if necessary.                       |
| SyncBricks branding in emails reflects the original project context; replace with your branding as needed.       | https://syncbricks.com                                                                            |

---

**Disclaimer:**  
The provided text is exclusively derived from an automated workflow created with n8n, respecting all current content policies and containing no illegal or protected material. All data processed is lawful and publicly accessible.