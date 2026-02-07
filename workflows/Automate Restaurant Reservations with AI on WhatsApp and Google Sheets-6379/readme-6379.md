Automate Restaurant Reservations with AI on WhatsApp and Google Sheets

https://n8nworkflows.xyz/workflows/automate-restaurant-reservations-with-ai-on-whatsapp-and-google-sheets-6379


# Automate Restaurant Reservations with AI on WhatsApp and Google Sheets

### 1. Workflow Overview

This workflow automates restaurant reservation management for "The Carnival All Day Buffet" via WhatsApp, leveraging AI for conversational interaction and Google Sheets for data storage. It supports reservation booking, menu and discount inquiries, discount calculations, location sharing, and reservation status notifications.

**Target Use Cases:**  
- Customers making reservations through WhatsApp conversationally.  
- Providing menu, discount information, and restaurant location on request.  
- Calculating discounts based on customer card choices.  
- Logging reservation details in Google Sheets.  
- Sending reservation confirmation or rejection messages based on status updates.  
- Scheduled notification of reservation statuses to customers.

**Logical Blocks:**  
- **1.1 Input Reception:** Receiving and filtering WhatsApp messages.  
- **1.2 AI Processing:** Interpreting messages via AI agent with LangChain and OpenAI.  
- **1.3 Reservation Logging:** Writing reservation data into Google Sheets.  
- **1.4 Discount Calculation:** Calculating and returning discount amounts.  
- **1.5 Response Dispatch:** Sending WhatsApp replies to customers.  
- **1.6 Scheduled Reservation Status Notification:** Periodic check of reservation status and messaging customers accordingly.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
Receives incoming WhatsApp messages via webhook, then filters to process only text messages to pass them forward for AI processing.

**Nodes Involved:**  
- WhatsApp Trigger  
- Filter

**Node Details:**  
- **WhatsApp Trigger**  
  - Type: WhatsApp Trigger (Webhook)  
  - Role: Entry point capturing incoming WhatsApp messages from customers.  
  - Configuration: Listens for "messages" updates; webhook URL auto-generated.  
  - Inputs: Incoming WhatsApp messages.  
  - Outputs: Raw message JSON to downstream nodes.  
  - Edge Cases: Webhook misconfiguration, WhatsApp API rate limits, connectivity issues.

- **Filter**  
  - Type: Filter  
  - Role: Filters messages to pass only those where message type is "text".  
  - Configuration: Condition: `$json.messages[0].type` contains "text".  
  - Inputs: WhatsApp Trigger output.  
  - Outputs: Passes only text messages to AI Agent.  
  - Edge Cases: Non-text messages ignored; could cause missed interactions if customers send images/audio.

---

#### 1.2 AI Processing

**Overview:**  
Processes customer messages with an AI agent that acts as a reservation assistant, handling conversational logic, including menu inquiries, discount calculations, and reservation details collection.

**Nodes Involved:**  
- AI Agent  
- OpenAI Chat Model  
- Simple Memory  
- Calculator  
- log reservation

**Node Details:**  
- **AI Agent**  
  - Type: LangChain Agent Node  
  - Role: Core conversational engine embedding business logic and access to tools for reservation logging and discount calculation.  
  - Configuration:  
    - Input Text: Extracts user message from `$json.messages[0].text.body`.  
    - System Message: Detailed prompt defining reservation assistant role, rules, variables to collect, discount cards info, links, formatting rules, and conversation flow.  
    - Tools:  
      - "log reservation" (Google Sheets integration for booking)  
      - "calculator" (discount calculation tool)  
  - Inputs: Filtered text messages, AI memory buffer, external tools.  
  - Outputs: Text output to be sent back to customers.  
  - Edge Cases: AI prompt misinterpretation, tool invocation failures, incomplete user inputs, session memory issues.

- **OpenAI Chat Model**  
  - Type: OpenAI GPT Language Model  
  - Role: Language model backend for AI Agent to generate conversational responses.  
  - Configuration: Model set to "gpt-4o-mini", max tokens 2000, temperature 0.5 for balanced creativity.  
  - Inputs: AI Agent queries.  
  - Outputs: Generated text response.  
  - Edge Cases: API rate limits, token limits, model availability.

- **Simple Memory**  
  - Type: LangChain Memory Buffer Window  
  - Role: Maintains conversational context per user session keyed by sender phone number.  
  - Configuration: Session key from `$json.messages[0].from`.  
  - Inputs: Conversation messages.  
  - Outputs: Context provided to AI Agent.  
  - Edge Cases: Memory overflow, session mismatch, context loss.

- **Calculator**  
  - Type: LangChain Calculator Tool  
  - Role: Performs discount and tax calculations as per business rules when invoked by AI Agent.  
  - Configuration: Uses formula and discount caps as defined in prompt.  
  - Inputs: Discount parameters from AI Agent.  
  - Outputs: Final amount after discount and tax.  
  - Edge Cases: Calculation errors, missing parameters.

- **log reservation**  
  - Type: Google Sheets Tool  
  - Role: Logs reservation details into a Google Sheet document.  
  - Configuration:  
    - Appends rows with columns: ReservationID (unique), Timestamp, CustomerName, Phone, Date, Time slot, Guests, Status (Pending/Paid), etc.  
    - Document ID and Sheet GID specified for "Carnival crm portal".  
  - Inputs: Reservation details from AI Agent.  
  - Outputs: Confirmation of row appended.  
  - Edge Cases: Google API auth errors, sheet access denied, data format mismatches.

---

#### 1.3 Reservation Response Dispatch

**Overview:**  
Sends AI-generated responses back to customers via WhatsApp.

**Nodes Involved:**  
- Send message

**Node Details:**  
- **Send message**  
  - Type: WhatsApp Node  
  - Role: Sends text messages to customers on WhatsApp.  
  - Configuration:  
    - Text body: `{{$json.output}}` (AI Agent response text).  
    - Recipient phone: Extracted dynamically from incoming message sender info.  
    - Phone Number ID: Linked to WhatsApp business number.  
  - Inputs: AI Agent text output.  
  - Outputs: Sent message confirmation.  
  - Edge Cases: WhatsApp API throttling, invalid phone numbers, message send failures.

---

#### 1.4 Scheduled Reservation Status Notification

**Overview:**  
Periodically checks Google Sheets for reservations with "Confirmed" or "Rejected" status and sends appropriate notification messages to customers.

**Nodes Involved:**  
- Schedule Trigger  
- Get row(s) in sheet  
- If  
- Send message2 (confirm message)  
- Send message1 (rejection message)  
- Filter1  
- Update row in sheet  
- Update row in sheet1

**Node Details:**  
- **Schedule Trigger**  
  - Type: Schedule Trigger  
  - Role: Initiates workflow at a defined interval (default every minute/hour/day depending on config).  
  - Configuration: Interval rule (default empty in JSON, user to configure).  
  - Inputs: None.  
  - Outputs: Triggers downstream nodes periodically.  
  - Edge Cases: Misconfiguration leads to missed notifications or excessive runs.

- **Get row(s) in sheet**  
  - Type: Google Sheets Read Node  
  - Role: Retrieves rows where Status is "Confirmed" or "Rejected" and Notified column is blank or not "Yes".  
  - Configuration: Filters with OR condition on Status and Notified.  
  - Inputs: Trigger from Schedule Trigger.  
  - Outputs: Matching rows for notification.  
  - Edge Cases: Large datasets impacting performance, API limits.

- **If**  
  - Type: If Node  
  - Role: Checks if Status is "Confirmed" (case sensitive, exact match "Confirmed ").  
  - Inputs: Rows from Google Sheets.  
  - Outputs:  
    - True branch: rows with Status "Confirmed".  
    - False branch: rows with other statuses.  
  - Edge Cases: Trailing spaces in status string may cause logic errors.

- **Send message2**  
  - Type: WhatsApp Node  
  - Role: Sends confirmation message to customer for confirmed reservations.  
  - Configuration: Message includes customer name, date, and slot time dynamically.  
  - Inputs: Rows from If node true branch.  
  - Outputs: Sent message confirmation.  
  - Edge Cases: WhatsApp API issues, invalid phone numbers.

- **Update row in sheet**  
  - Type: Google Sheets Update Node  
  - Role: Marks notified reservations with "Notified" = "Yes" after sending confirmation.  
  - Inputs: From Send message2.  
  - Outputs: Updated row confirmation.  
  - Edge Cases: Update conflicts, API errors.

- **Filter1**  
  - Type: Filter Node  
  - Role: Filters rows where Status is "Rejected".  
  - Inputs: If node false branch.  
  - Outputs: Rows with rejected status.  
  - Edge Cases: Status string matching must be exact.

- **Send message1**  
  - Type: WhatsApp Node  
  - Role: Sends rejection message to customer for rejected reservations.  
  - Configuration: Message informs customer reservation is rejected and suggests alternative.  
  - Inputs: From Filter1.  
  - Outputs: Sent message confirmation.  
  - Edge Cases: WhatsApp API issues.

- **Update row in sheet1**  
  - Type: Google Sheets Update Node  
  - Role: Marks rejected reservations as notified with "Notified" = "Yes".  
  - Inputs: From Send message1.  
  - Outputs: Updated row confirmation.  
  - Edge Cases: Update conflicts, API errors.

---

### 3. Summary Table

| Node Name           | Node Type                              | Functional Role                               | Input Node(s)             | Output Node(s)           | Sticky Note                                                                                               |
|---------------------|--------------------------------------|-----------------------------------------------|---------------------------|---------------------------|----------------------------------------------------------------------------------------------------------|
| WhatsApp Trigger    | n8n-nodes-base.whatsAppTrigger        | Receives WhatsApp messages                     |                           | Filter                    | Receives messages via Facebook Developer App; requires business manager and app setup with credentials  |
| Filter              | n8n-nodes-base.filter                  | Filters only text messages                      | WhatsApp Trigger          | AI Agent                  | Filters message based on text type before sending to AI agent                                           |
| AI Agent            | @n8n/n8n-nodes-langchain.agent        | Processes messages, handles reservation logic | Filter                    | Send message              | AI agent workflow                                                                                         |
| OpenAI Chat Model   | @n8n/n8n-nodes-langchain.lmChatOpenAi| Language model for AI Agent                     | AI Agent                  | AI Agent                  | OpenAI connected for AI brain                                                                             |
| Simple Memory       | @n8n/n8n-nodes-langchain.memoryBufferWindow | Maintains conversation context                 | Filter                    | AI Agent                  | OpenAI is connected for simple memory; stores conversation per user                                     |
| Calculator          | @n8n/n8n-nodes-langchain.toolCalculator| Calculates discount and tax                     | AI Agent (tool)           | AI Agent                  | Calculator tool for discount calculation                                                                 |
| log reservation     | n8n-nodes-base.googleSheetsTool       | Logs reservation data into Google Sheets       | AI Agent (tool)           | AI Agent                  | Stores reservation details in Google Sheets                                                             |
| Send message        | n8n-nodes-base.whatsApp                | Sends AI-generated replies back to customers  | AI Agent                  |                           | Sends reply formed by AI                                                                                   |
| Schedule Trigger    | n8n-nodes-base.scheduleTrigger         | Periodically triggers reservation status check |                           | Get row(s) in sheet       | Runs on a schedule to notify users of reservation status                                                |
| Get row(s) in sheet | n8n-nodes-base.googleSheets            | Retrieves reservations needing notification    | Schedule Trigger          | If                        |                                                                                                          |
| If                  | n8n-nodes-base.if                      | Branches on reservation status                  | Get row(s) in sheet       | Send message2 / Filter1   |                                                                                                          |
| Send message2       | n8n-nodes-base.whatsApp                | Sends confirmation messages                     | If (true branch)          | Update row in sheet       |                                                                                                          |
| Update row in sheet | n8n-nodes-base.googleSheets            | Marks confirmed reservations as notified       | Send message2             |                           |                                                                                                          |
| Filter1             | n8n-nodes-base.filter                  | Filters rejected reservations                    | If (false branch)         | Send message1             |                                                                                                          |
| Send message1       | n8n-nodes-base.whatsApp                | Sends rejection messages                         | Filter1                   | Update row in sheet1      |                                                                                                          |
| Update row in sheet1| n8n-nodes-base.googleSheets            | Marks rejected reservations as notified         | Send message1             |                           |                                                                                                          |
| Sticky Note         | n8n-nodes-base.stickyNote              | Notes and instructions                           |                           |                           | Recivesd the messages via facebook developer app you have to create a business manager and a facebook developer app and connect your whatsaoo to it it will give you the cerdentails for it |
| Sticky Note1        | n8n-nodes-base.stickyNote              | Notes                                           |                           |                           | Filter the message based on only text you can setup any tyoe of filter here and sends it to ai agent the agent then froma reply |
| Sticky Note2        | n8n-nodes-base.stickyNote              | Notes                                           |                           |                           | Once the reply is formed, it routes the message back to the sender                                      |
| Sticky Note3        | n8n-nodes-base.stickyNote              | Notes                                           |                           |                           | OpenAIis connected for the brain's simple memory for storing conversation, and it has two tools: a calculator for calculating discounts and a google sheet doc for storing reservation details. |
| Sticky Note4        | n8n-nodes-base.stickyNote              | Notes                                           |                           |                           | # AI agent workflow                                                                                        |
| Sticky Note5        | n8n-nodes-base.stickyNote              | Notes                                           |                           |                           | #  reservation Confirmatrion workflow                                                                     |
| Sticky Note6        | n8n-nodes-base.stickyNote              | Notes                                           |                           |                           | This workflow has a schedule trigger; it runs on a specific time you choose it gets the data from the sheets and decides it has built-in logic if the status is confirmation not sent, it plucks all the reservations and, based on their status, sends a message to the user the if module decided if the reservation is confirmed or rejected and sends it the the relevant field. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create WhatsApp Trigger Node**  
   - Type: WhatsApp Trigger  
   - Configure webhook for WhatsApp Business API (via Facebook Developer app).  
   - Listen for "messages" updates.

2. **Add Filter Node to Accept Only Text Messages**  
   - Type: Filter  
   - Condition: `$json.messages[0].type` contains "text".  
   - Connect WhatsApp Trigger → Filter.

3. **Set Up AI Agent Node**  
   - Type: LangChain Agent  
   - Input Text Expression: `{{$json.messages[0].text.body}}`.  
   - System Message (hardcode the detailed prompt including reservation logic, rules, discount cards, links).  
   - Tools:  
     - Add Google Sheets Tool named "log reservation" (see step 5).  
     - Add Calculator Tool named "Calculator" (see step 6).  
   - Connect Filter → AI Agent.

4. **Configure OpenAI Chat Model Node**  
   - Type: LangChain OpenAI Chat Model  
   - Model: gpt-4o-mini  
   - Max tokens: 2000  
   - Temperature: 0.5  
   - Connect AI Agent → OpenAI Chat Model (ai_languageModel input).  
   - Connect OpenAI Chat Model → AI Agent (ai_languageModel output).

5. **Configure Google Sheets Tool for Reservation Logging ("log reservation")**  
   - Select Google Sheets node type for append operation.  
   - Spreadsheet: "Carnival crm portal" (Document ID: `1oG6mCFReg7CRgwjcnnSTSfy7u1TblEXVLuj3B_ElfiY`).  
   - Sheet GID: 0 (default sheet).  
   - Map columns: ReservationID (unique format), Timestamp (current datetime), CustomerName, Phone, Date (YYYY-MM-DD), Time slot (e.g. "3:30 PM – 5:00 PM"), Guests, Status (Pending/Paid), others as needed.  
   - Connect AI Agent → log reservation (ai_tool input).  
   - Connect log reservation → AI Agent (ai_tool output).

6. **Configure Calculator Tool**  
   - Type: LangChain Calculator  
   - No special parameters needed; AI Agent invokes it for discount calculations.  
   - Connect AI Agent → Calculator (ai_tool input).  
   - Connect Calculator → AI Agent (ai_tool output).

7. **Add Simple Memory Node for Conversation Context**  
   - Type: LangChain Memory Buffer Window  
   - Session Key: `{{$json.messages[0].from}}`  
   - Connect Filter → Simple Memory.  
   - Connect Simple Memory → AI Agent (ai_memory input).  
   - Connect AI Agent → Simple Memory (ai_memory output).

8. **Add WhatsApp Send Message Node for Responses**  
   - Type: WhatsApp  
   - Text Body: `{{$json.output}}` (AI Agent response).  
   - Recipient Phone: `{{$('WhatsApp Trigger').item.json.messages[0].from}}`.  
   - Phone Number ID: Use business WhatsApp phone number ID.  
   - Connect AI Agent → Send Message.

9. **Create Scheduled Trigger Node**  
   - Type: Schedule Trigger  
   - Set desired frequency (e.g., hourly).  

10. **Add Google Sheets Node to Get Rows with Unnotified Confirmed or Rejected Reservations**  
    - Type: Google Sheets (read rows).  
    - Document and sheet same as logging node.  
    - Filter rows where Status = "Confirmed" OR "Rejected" AND Notified is not "Yes".  
    - Connect Schedule Trigger → Get row(s) in sheet.

11. **Add If Node to Branch on Status "Confirmed"**  
    - Condition: `$json.Status` equals "Confirmed " (note trailing space).  
    - Connect Get row(s) in sheet → If.

12. **Add WhatsApp Node to Send Confirmation Message**  
    - Text body: `{{$json['CustomerName ']}}, Your reservation at {{$json.Date}} is confirmed. Looking forward to meet you at your desired slot time {{$json['Time slot ']}}`  
    - Recipient phone: `{{$json.Phone.toString()}}`  
    - Connect If (true) → Send message2.

13. **Add Google Sheets Update Node to Mark Confirmed Reservations as Notified**  
    - Update same row with "Notified" = "Yes".  
    - Connect Send message2 → Update row in sheet.

14. **Add Filter Node to Get Rejected Reservations**  
    - Condition: `$json.Status` contains "Rejected".  
    - Connect If (false) → Filter1.

15. **Add WhatsApp Node to Send Rejection Message**  
    - Text body: `{{$json['CustomerName ']}}, We regret to inform you your reservation on {{$json.Date}} at slot {{$json['Time slot ']}} is rejected please consider another slot time, Thank you.`  
    - Recipient phone: `{{$json.Phone.toString()}}`  
    - Connect Filter1 → Send message1.

16. **Add Google Sheets Update Node to Mark Rejected Reservations as Notified**  
    - Update same row with "Notified" = "Yes".  
    - Connect Send message1 → Update row in sheet1.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                             | Context or Link                                                                                                       |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------|
| Received messages via Facebook Developer App require creating a business manager and Facebook developer app and connecting WhatsApp to it; this provides the necessary credentials.                                                                                      | Sticky Note (near WhatsApp Trigger)                                                                                   |
| Filter messages to only text types to streamline AI processing; any message types can be filtered here depending on use case.                                                                                                                                           | Sticky Note1                                                                                                          |
| After AI forms a reply, it routes the message back to the sender through WhatsApp Send Node.                                                                                                                                                                             | Sticky Note2                                                                                                          |
| OpenAI is connected for conversation memory and intelligence. Two tools are integrated: a calculator for discount computations and Google Sheets for storing reservation details.                                                                                        | Sticky Note3                                                                                                          |
| The AI agent manages the conversational flow, including guided prompts, confirmation requests, and discount calculation logic.                                                                                                                                          | Sticky Note4                                                                                                          |
| The workflow includes a scheduled process to check reservation statuses and notify customers accordingly, ensuring timely communication.                                                                                                                                | Sticky Note5 and Sticky Note6                                                                                         |
| Reservation price per head is fixed at 2499 PKR; discounts apply as per bank card details with defined caps.                                                                                                                                                             | Workflow description                                                                                                  |
| Discount calculation formula: total_cost = ((2499 * (1 - discount_rate)) + (2499 * 0.05)) * num_people; 5% tax is applied on original price, discount caps enforced, and only final amount is returned.                                                                    | Workflow description                                                                                                  |
| Phone numbers are standardized to 12-digit strings starting with "92", dropping leading zeros if any, to ensure consistent formatting.                                                                                                                                    | Workflow description                                                                                                  |
| Available slot timings are strictly listed and always shown when requesting slot timings from customers.                                                                                                                                                                 | Workflow description                                                                                                  |
| For queries outside reservation or requests for human support, customers are redirected to a human representative via the same WhatsApp number.                                                                                                                         | Workflow description                                                                                                  |
| Maintain professional tone without emojis; avoid repetitive questions.                                                                                                                                                                                                  | Workflow description                                                                                                  |
| Menu and location links: https://www.instagram.com/p/DJKBhCatQ1Y/?img_index=1 and https://www.google.com/maps/place/The+Carnival+All+Day+Buffet/@31.5217381,74.3486342,17z/data=!3m1!4b1!4m6!3m5!1s0x3919053a9b6bc1fb:0xf473ee386cffadaa!8m2!3d31.5217381!4d74.3512091!16s%2Fg%2F11thhhd98r?entry=ttu&g_ep=EgoyMDI1MDUxMy4xIKXMDSoASAFQAw%3D%3D | Workflow description                                                                                                  |

---

**Disclaimer:**  
The text provided derives exclusively from an automated workflow built with n8n, strictly respecting content policies and handling only legal and public data.