Automate Salon Appointment Management with WhatsApp, GPT & Google Calendar

https://n8nworkflows.xyz/workflows/automate-salon-appointment-management-with-whatsapp--gpt---google-calendar-4926


# Automate Salon Appointment Management with WhatsApp, GPT & Google Calendar

### 1. Workflow Overview

This workflow automates appointment management for a Nail Salon in the US using WhatsApp for communication, GPT-powered AI agents (OpenAI and Google Gemini models) for natural language understanding and decision-making, and Google Calendar plus Airtable for scheduling and data storage.

**Target Use Cases:**  
- Receiving and processing customer appointment requests via WhatsApp text, audio, image, or file messages.  
- Recognizing user intent to book, update, cancel, or inquire about appointments.  
- Managing calendar events and storing appointment data in Airtable.  
- Sending confirmations, reminders, and notifications back to customers on WhatsApp and via email.  
- Handling errors and rate limiting to ensure robust operation.

**Logical Blocks:**  
- **1.1 Input Reception & Preprocessing**: Receive WhatsApp messages, identify message type (text, audio, image, file), and preprocess content (download, transcribe, analyze).  
- **1.2 Intent Recognition & Routing**: Use AI agents to classify customer intent (booking, cancellation, update, general inquiry) and route the workflow accordingly.  
- **1.3 Appointment Booking**: Check availability, create Google Calendar events, log details in Airtable, and send confirmations.  
- **1.4 Appointment Updates & Cancellations**: Modify or delete calendar events and update Airtable records, notify customers.  
- **1.5 General Inquiries Handling**: Respond to non-booking related customer questions.  
- **1.6 Reminders & Notifications**: Scheduled triggers to send appointment reminders and alerts.  
- **1.7 Rate Limiting & Message Batching**: Manage throughput, ensure fair API usage and avoid overload.  
- **1.8 Error Handling & Logging**: Send error notifications internally and to customers, log issues.

---

### 2. Block-by-Block Analysis

---

#### 1.1 Input Reception & Preprocessing

**Overview:**  
Listens for incoming WhatsApp messages, determines message type, downloads or extracts content accordingly, and prepares data for intent recognition.

**Nodes Involved:**  
- WhatsApp Trigger  
- Fetch Configuration  
- Set Initial Data  
- Is Audio Message? (If)  
- Is User Text Message? (If)  
- Input type (Switch)  
- Download Audio / Download Image / Download File (HTTP Request)  
- Transcribe Audio (OpenAI)  
- Analyze Image (OpenAI)  
- Extract from File  
- Get File Url / Get Audio Url / Get Image Url (WhatsApp)  
- Only PDF File (If)  
- Incorrect format (WhatsApp)  
- Not supported (WhatsApp)  
- Send Media Warning Owner / Send File Warning Owner / Send User Notification (WhatsApp)  
- Fix mimeType for Audio (Code)  
- Send audio / Send message (WhatsApp)

**Node Details:**  

- **WhatsApp Trigger**: Listens to incoming WhatsApp messages via webhook. Triggers entire workflow.  
  - No parameters, standard webhook setup.  
  - Input: Incoming WhatsApp messages.  
  - Output: Message data to “Fetch Configuration”.  
  - Potential failures: webhook connectivity, auth errors with WhatsApp.  

- **Fetch Configuration**: Retrieves any app config from Airtable to initialize processing context.  
  - Executes once per message.  
  - Output: Passes data to “Set Initial Data”.  

- **Set Initial Data**: Sets flags or default values to classify message type.  
  - Output branches to “Is Audio Message?” node.  

- **Is Audio Message?**: Condition node checks if message is audio type.  
  - True: routes to Get Audio Url → Download Audio → Transcribe Audio → Audio (Set node)  
  - False: routes to “Is User Text Message?”  

- **Is User Text Message?**: Condition node checks if message is text.  
  - True: routes to “Text” (Set node)  
  - False: routes to “Input type” switch for other media types.  

- **Input type**: Switch node directing to handlers based on media type:  
  - Image → Get Image Url → Download Image → Analyze Image → Image (Set)  
  - File → Only PDF File (If) → Get File Url → Download File → Extract from File → File (Set)  
  - Unsupported media → Send Media/File Warning Owner, Send User Notification, or Not supported nodes.  

- **Download Audio/Image/File**: HTTP Request nodes to fetch media content from WhatsApp servers via URL.  
  - Key for media processing nodes.  
  - Edge cases: network timeouts, invalid URLs, auth errors.  

- **Transcribe Audio**: Uses OpenAI model to convert audio to text.  
  - Input: audio file data.  
  - Output: transcribed text.  
  - Possible failures: API limits, transcription errors.  

- **Analyze Image**: Uses OpenAI for image analysis (e.g., OCR or context extraction).  
  - Input: image data.  
  - Output: extracted text or metadata.  
  - Failures: unsupported image formats, API errors.  

- **Extract from File**: Extracts text from downloaded PDF files.  
  - Input: file binary.  
  - Output: extracted text content.  

- **Only PDF File**: If node filtering to allow only PDF files.  
  - Routes non-PDF files to “Incorrect format” WhatsApp node to notify user.  

- **Send Media/File Warning Owner**, **Send User Notification**: WhatsApp nodes to alert salon staff or notify customers about unsupported media.  

- **Fix mimeType for Audio**: Code node adjusts audio MIME types for WhatsApp compatibility.  

- **Send audio/message**: Sends audio or text messages back to the user as response / confirmation.  

**Edge Cases:**  
- Unsupported file types or corrupted media.  
- Network or API errors during media download or transcription.  
- Empty or unreadable content after extraction.  
- WhatsApp message format changes.  

---

#### 1.2 Intent Recognition & Routing

**Overview:**  
Uses AI agents to interpret user intent from preprocessed message content and route the workflow to the appropriate function: booking, cancellation, update, or general inquiry.

**Nodes Involved:**  
- Intent Recognition Agent (LangChain Agent, OpenAI / Google Gemini)  
- Parse Intent JSON (Code)  
- Switch Route (Switch)  
- Intent Recognition Agent - Backup  
- Max Iterations? (If) nodes for retry logic  
- Intent Recognition Agent - Backup  
- Simple Memory2 & Simple Memory11 (memory buffer nodes)  

**Node Details:**  

- **Intent Recognition Agent**: AI agent node that parses the text input to identify intent (e.g., book, cancel, update, inquiry).  
  - Uses OpenAI or Google Gemini chat models.  
  - Includes retry logic with backup agent on failure.  
  - Input: text from “Text”, “Audio”, “Image”, or “File” nodes.  
  - Output: JSON with intent details.  
  - Version-specific: requires configured OpenAI or Google Gemini credentials.  
  - Failures: API rate limits, parsing errors, malformed JSON.  

- **Parse Intent JSON**: Code node to parse AI agent JSON output to structured data.  
  - Sends output to “Switch Route”.  
  - Potential errors in JSON parsing handled with fallback to backup agent.  

- **Switch Route**: Switch node that directs flow to:  
  - Booking Agent for appointment booking intents  
  - Cancellation Agent for cancellation intents  
  - Update Agent for update-related intents  
  - General Inquiry for other questions or requests.  

- **Backup Agents**: Secondary AI agents invoked if primary agents fail or max retries reached.  
  - Ensure robust fallback to prevent workflow failure.  

- **Max Iterations?**: If nodes check for maximum retry attempts to avoid infinite loops in AI calls.  

- **Simple Memory Buffer Nodes**: Maintain conversational context memory for agents to improve understanding over multi-turn dialogues.  

**Edge Cases:**  
- Ambiguous or unclear user inputs.  
- AI agent service unavailability or slow response.  
- JSON parsing failures.  
- Infinite retry loops avoided by max iteration checks.  

---

#### 1.3 Appointment Booking

**Overview:**  
Handles the booking process: checks calendar availability, creates events in Google Calendar, logs booking data in Airtable, and sends confirmations via WhatsApp and email.

**Nodes Involved:**  
- Booking Agent & Booking Agent - Backup  
- Max Iterations? (For booking)  
- list_services (Airtable Tool)  
- check_availability (Google Calendar Tool)  
- Create Event (Google Calendar)  
- Search Airtable Record  
- Update Airtable Record  
- Send Booking Message (WhatsApp)  
- Send Confirmation (Gmail)  
- Information to be Saved in Airtable1 (Set)  
- Logs the confirmed booking details1 (Airtable)  
- Parse Confirmation Message (Code)  
- Notify Client Error2 / Send Error Notification2 (Error Handling)  
- Simple Memory6 (Memory Buffer)  
- Google Gemini Chat Model4 (AI language model)  

**Node Details:**  

- **Booking Agent**: AI agent specialized in handling booking intents.  
  - Coordinates conversation and data collection for booking.  
  - Uses memory buffer for context.  
  - Backup agent and retry logic included.  

- **list_services**: Airtable tool node to fetch list of services offered for validation and options.  

- **check_availability**: Google Calendar tool to check if requested appointment slot is free.  

- **Create Event**: Creates a new event in Google Calendar for the booking.  
  - Robust error handling with retry on fail.  

- **Search Airtable Record**: Finds existing booking records matching the event.  

- **Update Airtable Record**: Updates Airtable with booking details such as customer info, services, and time.  

- **Send Booking Message**: Sends WhatsApp confirmation message to customer.  

- **Send Confirmation**: Sends email confirmation to customer or internal team.  

- **Information to be Saved in Airtable1**: Sets structured data for logging.  

- **Logs the confirmed booking details1**: Logs booking info in Airtable.  

- **Parse Confirmation Message**: Prepares confirmation message content from logged data.  

- **Error Handling Nodes**: Notify Client Error2 and Send Error Notification2 handle booking errors gracefully.  

**Edge Cases:**  
- Slot unavailability or conflicts.  
- Airtable or Google Calendar API errors.  
- Partial booking data or missing customer info.  
- Email or WhatsApp send failures.  

---

#### 1.4 Appointment Updates & Cancellations

**Overview:**  
Manages appointment updates and cancellations: updating or deleting Google Calendar events, modifying Airtable records, and notifying customers accordingly.

**Nodes Involved:**  
- Update Agent & Update Agent - Backup  
- Cancellation Agent & Cancellation Agent - Backup  
- Max Iterations? nodes for update and cancellation  
- Extract JSON from Agent / Cancellation Agent (Code)  
- Update Ready? (If)  
- Delete Ready? (If)  
- Update Event (Google Calendar)  
- Delete Event (Google Calendar)  
- Search Airtable Record / Search Delete Record  
- Update Airtable Record  
- Cancel Appointment (Airtable)  
- Send Update Message / Send Cancel Message (WhatsApp)  
- Send Update Message1 (Email)  
- Prepare Cancel Appointment1 (Code)  
- Notify Client Error / Notify Client Error3 / Notify Client Error5  
- Send Error Notification / Send Error Notification3 / Send Error Notification5  
- Simple Memory10 / Simple Memory11  
- Google Gemini Chat Model8 / Google Gemini Chat Model9  

**Node Details:**  

- **Update Agent**: AI agent for update intents, with retry and backup logic.  
- **Cancellation Agent**: AI agent for cancellation intents, with retry and backup.  
- **Extract JSON from Agent / Cancellation Agent**: Parses AI agent outputs for update or cancellation actions.  
- **Update Ready? / Delete Ready?**: If nodes decide whether to proceed with event update or deletion.  
- **Update Event**: Updates existing Google Calendar event with new details.  
- **Delete Event**: Deletes Google Calendar event for canceled appointments.  
- **Search Airtable Record / Search Delete Record**: Finds matching Airtable records for update or cancellation.  
- **Update Airtable Record / Cancel Appointment**: Updates or marks records as canceled in Airtable.  
- **Send Update Message / Send Cancel Message (WhatsApp)**: Notifies customers about changes or cancellations.  
- **Send Update Message1 (Email)**: Sends email notification for updates.  
- **Prepare Cancel Appointment1**: Prepares cancellation data for messaging.  
- **Error Handling Nodes**: Notify Client Error, Send Error Notification nodes ensure errors are reported.  
- **Memory Buffers and AI Models**: Maintain context and provide fallback AI language models.  

**Edge Cases:**  
- Attempting to update or cancel non-existent events.  
- API errors when updating or deleting calendar or Airtable records.  
- Customer notification failures.  
- Handling multiple concurrent updates or cancellations.  

---

#### 1.5 General Inquiries Handling

**Overview:**  
Responds to general customer questions that are not related to booking or cancellations using AI agents.

**Nodes Involved:**  
- General Inquiry & General Inquiry - Backup (AI Agents)  
- Parse General Inquiry Output (Code)  
- Send General Message (WhatsApp)  
- Notify Client Error4 / Send Error Notification4  
- Simple Memory1  
- Google Gemini Chat Model / OpenAI Chat Model2  
- list_services2 (Airtable Tool)  
- get_customer_appointments (Google Calendar Tool)  
- get_appointments / set_appointments (Redis Tool)  

**Node Details:**  

- **General Inquiry AI Agents**: Handles natural language questions from customers with fallback backup agent.  
- **Parse General Inquiry Output**: Parses response and prepares reply message.  
- **Send General Message**: Sends the AI-generated response back to WhatsApp customer.  
- **Error Notifications**: Notify Client Error4 and Send Error Notification4 handle errors in inquiry processing.  
- **Memory Buffers**: Store conversational context to improve response quality.  
- **list_services2, get_customer_appointments**: Provide dynamic data for inquiries on services or appointments.  
- **Redis Tool nodes**: Manage cached appointments to support inquiry responses.  

**Edge Cases:**  
- Ambiguous or complex customer questions.  
- AI service failures or slow responses.  
- Incomplete data in Redis or external sources.  

---

#### 1.6 Reminders & Notifications

**Overview:**  
Scheduled triggers perform daily checks on upcoming appointments and send WhatsApp reminders to clients.

**Nodes Involved:**  
- Schedule Trigger / Schedule Trigger1  
- Calculate Tomorrow (Code)  
- Get Schedule Events / Get Calendar Events (Google Calendar)  
- Format Reminder Data (Code)  
- Search Schedule Events (Airtable)  
- Send Client Reminder (WhatsApp)  

**Node Details:**  

- **Schedule Trigger(s)**: Trigger workflow daily or on defined schedules.  
- **Calculate Tomorrow**: Determines next day’s date for querying events.  
- **Get Schedule Events / Get Calendar Events**: Fetch events from Google Calendar for reminder candidates.  
- **Format Reminder Data**: Prepares data structure for reminder messages.  
- **Search Schedule Events**: Cross-references events with Airtable data.  
- **Send Client Reminder**: Sends WhatsApp reminder messages.  

**Edge Cases:**  
- Timezone mismatches affecting event times.  
- Missing or outdated appointment data.  
- WhatsApp message sending failures.  

---

#### 1.7 Rate Limiting & Message Batching

**Overview:**  
Implements throttling and batching for incoming messages to handle load and prevent API rate limits, including error notification on limits.

**Nodes Involved:**  
- Rate Limiter (Code)  
- Redis Hourly / Increment Counter Hourly / Push / Pop All Batched Messages / Delete Message List  
- Check Limit (Code)  
- Check Rate Limited (If)  
- Send Mesage? (If)  
- Send User Message / Send Owner Message (WhatsApp)  
- Send Rate Limit Email (Gmail)  

**Node Details:**  

- **Rate Limiter and Check Limit**: Custom code nodes implementing logic to count messages and enforce thresholds.  
- **Redis Nodes**: Store counters, batch message queues, and locks.  
- **Send Mesage?**: Decides whether to send message or queue it.  
- **Send User / Owner Message**: Notify users or salon owner on rate limit status.  
- **Send Rate Limit Email**: Internal email alert on hitting rate limits.  

**Edge Cases:**  
- High traffic bursts causing delayed messages.  
- Redis connectivity issues impacting counters.  
- Email delivery failures.  

---

#### 1.8 Error Handling & Logging

**Overview:**  
Manages errors by sending notifications to staff and customers, and logs errors for operational awareness.

**Nodes Involved:**  
- Multiple Send Error Notification (Gmail) nodes (e.g., Send Error Notification1, 2, 3, 4, 5)  
- Notify Client Error (Set nodes)  
- Send Cancel Message, Send Booking Message, Send Update Message (WhatsApp) for error feedback  
- Logs the confirmed booking details1 (Airtable)  

**Node Details:**  

- **Send Error Notification (Gmail)**: Emails sent to system administrators on critical failures.  
- **Notify Client Error (Set)**: Prepares error messages to inform customers politely.  
- **WhatsApp nodes**: Communicate errors or confirmations to customers.  
- **Logging Nodes**: Save detailed booking or error info in Airtable for audit and debugging.  

**Edge Cases:**  
- Failure in sending error notification emails.  
- Multiple simultaneous errors causing notification overload.  

---

### 3. Summary Table

| Node Name                     | Node Type                              | Functional Role                        | Input Node(s)                 | Output Node(s)                      | Sticky Note                         |
|-------------------------------|--------------------------------------|-------------------------------------|------------------------------|-----------------------------------|-----------------------------------|
| WhatsApp Trigger               | WhatsApp Trigger                     | Entry point: receive WhatsApp msgs  | -                            | Fetch Configuration                |                                   |
| Fetch Configuration           | Airtable                             | Load app config                     | WhatsApp Trigger              | Set Initial Data                  |                                   |
| Set Initial Data              | Set                                 | Initialize message type flags       | Fetch Configuration           | Is Audio Message?                 |                                   |
| Is Audio Message?             | If                                  | Check if message is audio           | Set Initial Data              | Get Audio Url, Is User Text Msg?  |                                   |
| Is User Text Message?         | If                                  | Check if message is text            | Is Audio Message?             | Text, Input type                  |                                   |
| Input type                   | Switch                              | Route by media type                 | Is User Text Message?          | Get Audio Url, Get Image Url, Send Media Warning Owner, Send File Warning Owner, Not Supported |                                   |
| Get Audio Url                | WhatsApp                            | Retrieve audio file URL             | Input type                    | Download Audio                   |                                   |
| Download Audio               | HTTP Request                       | Download audio from URL             | Get Audio Url                 | Transcribe Audio                 |                                   |
| Transcribe Audio             | OpenAI (LangChain)                 | Convert audio to text               | Download Audio                | Audio (Set)                     |                                   |
| Get Image Url                | WhatsApp                            | Retrieve image file URL             | Input type                    | Download Image                  |                                   |
| Download Image               | HTTP Request                       | Download image from URL             | Get Image Url                 | Analyze Image                   |                                   |
| Analyze Image                | OpenAI (LangChain)                 | Analyze image content               | Download Image                | Image (Set)                    |                                   |
| Get File Url                 | WhatsApp                            | Retrieve file URL                   | Only PDF File (If)            | Download File                  |                                   |
| Download File                | HTTP Request                       | Download file from URL              | Get File Url                 | Extract from File               |                                   |
| Extract from File            | Extract from File                  | Extract text from PDF               | Download File                | File (Set)                    |                                   |
| Only PDF File               | If                                 | Filter only PDF files               | Input type                    | Get File Url, Incorrect format  |                                   |
| Incorrect format            | WhatsApp                          | Notify unsupported file format     | Only PDF File (If)            | -                             |                                   |
| Not supported               | WhatsApp                          | Notify unsupported media           | Input type                    | -                             |                                   |
| Send Media Warning Owner    | WhatsApp                          | Notify staff of unsupported media  | Input type                    | Send User Notification         |                                   |
| Send File Warning Owner     | WhatsApp                          | Notify staff of unsupported files  | Input type                    | Send User Notification         |                                   |
| Send User Notification      | WhatsApp                          | Notify user of unsupported media   | Send Media/File Warning Owner | -                             |                                   |
| Fix mimeType for Audio      | Code                             | Adjust audio MIME type for WhatsApp | Generate Audio Response       | Send audio                    |                                   |
| Send audio                  | WhatsApp                         | Send audio message response        | Fix mimeType for Audio        | -                             |                                   |
| Send message                | WhatsApp                         | Send text message                  | From audio to audio? (If)     | -                             |                                   |
| Intent Recognition Agent    | LangChain Agent                  | Classify user intent               | Text, Audio, Image, File (Set) | Parse Intent JSON            |                                   |
| Parse Intent JSON           | Code                             | Parse AI intent JSON               | Intent Recognition Agent      | Switch Route                  |                                   |
| Switch Route               | Switch                          | Route to booking, cancellation, update or inquiry | Parse Intent JSON            | Booking Agent, Cancellation Agent, Update Agent, General Inquiry |                                   |
| Booking Agent              | LangChain Agent                  | Handle booking intents             | Switch Route                 | Max Iterations? (Booking)      |                                   |
| Booking Agent - Backup     | LangChain Agent                  | Backup for booking intents         | Booking Agent                | Fix JSON Output                |                                   |
| Fix JSON Output            | Code                             | Format booking JSON output         | Booking Agent - Backup        | If (Booking)                  |                                   |
| Max Iterations? (Booking) | If                                | Check max retries for booking      | Booking Agent                | Fix JSON Output, Booking Agent - Backup |                                   |
| list_services              | Airtable Tool                   | Fetch services list                | Booking Agent                | check_availability             |                                   |
| check_availability         | Google Calendar Tool            | Check calendar slot availability  | list_services                | Create Event                  |                                   |
| Create Event              | Google Calendar                | Create new calendar event          | If                          | Send Confirmation, Send Error Notification5 |                                   |
| Send Confirmation          | Gmail                          | Email confirmation                 | Create Event                 | Information to be Saved in Airtable1 |                                   |
| Information to be Saved in Airtable1 | Set                    | Prepare Airtable data              | Send Confirmation            | Logs the confirmed booking details1 |                                   |
| Logs the confirmed booking details1 | Airtable                | Log booking details                | Information to be Saved in Airtable1 | Parse Confirmation Message  |                                   |
| Parse Confirmation Message | Code                          | Prepare confirmation message       | Logs the confirmed booking details1 | Send Booking Message        |                                   |
| Send Booking Message       | WhatsApp                      | Send booking confirmation message  | Parse Confirmation Message   | -                             |                                   |
| Notify Client Error2       | Set                           | Prepare error message for bookings | Send Error Notification2     | Send Booking Message          |                                   |
| Send Error Notification2   | Gmail                         | Notify admin on booking errors     | Booking Agent - Backup       | Notify Client Error2          |                                   |
| Update Agent               | LangChain Agent               | Handle update intents              | Switch Route                 | Max Iterations?2, Update Agent - Backup |                                   |
| Update Agent - Backup      | LangChain Agent               | Backup for updates                | Update Agent                | Extract JSON from Agent, Send Error Notification |                                   |
| Extract JSON from Agent    | Code                          | Parse update intent JSON           | Update Agent - Backup        | Update Ready?                |                                   |
| Update Ready?              | If                            | Check if update can proceed        | Extract JSON from Agent      | Update Event, Multiple Appointments |                                   |
| Update Event              | Google Calendar              | Update calendar event              | Update Ready?                | Search Airtable Record        |                                   |
| Search Airtable Record     | Airtable                     | Find booking record                | Update Event                 | Update Airtable Record        |                                   |
| Update Airtable Record     | Airtable                     | Update booking record              | Search Airtable Record       | Send Update Message1          |                                   |
| Send Update Message1       | Gmail                        | Email update confirmation          | Update Airtable Record       | Customer Confirmation Message |                                   |
| Customer Confirmation Message | Code                      | Prepare customer update message    | Send Update Message1         | Send Update Message           |                                   |
| Send Update Message        | WhatsApp                     | Send update confirmation message   | Customer Confirmation Message | -                           |                                   |
| Notify Client Error        | Set                          | Prepare error message for updates  | Send Error Notification     | Send Update Message           |                                   |
| Send Error Notification    | Gmail                        | Notify admin on update errors      | Update Agent - Backup        | Notify Client Error           |                                   |
| Cancellation Agent         | LangChain Agent              | Handle cancellation intents        | Switch Route                 | Max Iterations?1, Cancellation Agent - Backup |                                   |
| Cancellation Agent - Backup | LangChain Agent             | Backup for cancellations           | Cancellation Agent           | Extract JSON from Cancellation Agent, Send Error Notification3 |                                   |
| Extract JSON from Cancellation Agent | Code                | Parse cancellation intent JSON     | Cancellation Agent - Backup  | Delete Ready?                |                                   |
| Delete Ready?              | If                           | Check if cancellation can proceed  | Extract JSON from Cancellation Agent | Delete Event, Send Cancel Message |                                   |
| Delete Event               | Google Calendar             | Delete calendar event              | Delete Ready?                | Send Cancellation1, Not Found |                                   |
| Send Cancellation1         | Gmail                       | Send cancellation email            | Delete Event                 | Search Delete Record          |                                   |
| Search Delete Record       | Airtable                    | Find record to cancel              | Send Cancellation1           | Cancel Appointment            |                                   |
| Cancel Appointment         | Airtable                    | Mark record as canceled            | Search Delete Record         | Prepare Cancel Appointment1   |                                   |
| Prepare Cancel Appointment1 | Code                       | Prepare cancellation message data  | Cancel Appointment           | Send Cancel Message           |                                   |
| Send Cancel Message        | WhatsApp                    | Send cancellation confirmation     | Prepare Cancel Appointment1  | -                            |                                   |
| Notify Client Error3       | Set                         | Prepare error message for cancellations | Send Error Notification3    | Send Cancel Message           |                                   |
| Send Error Notification3   | Gmail                       | Notify admin on cancellation errors | Cancellation Agent - Backup | Notify Client Error3          |                                   |
| General Inquiry            | LangChain Agent             | Handle general inquiries           | Switch Route                 | Parse General Inquiry Output, General Inquiry - Backup |                                   |
| General Inquiry - Backup   | LangChain Agent             | Backup for general inquiries       | General Inquiry             | Parse General Inquiry Output, Notify Client Error4, Send Error Notification4 |                                   |
| Parse General Inquiry Output | Code                      | Parse AI response for inquiries    | General Inquiry              | Send General Message          |                                   |
| Send General Message       | WhatsApp                   | Send response to general inquiry   | Parse General Inquiry Output | -                            |                                   |
| Notify Client Error4       | Set                        | Prepare error message for inquiries | General Inquiry - Backup    | Send General Message          |                                   |
| Send Error Notification4   | Gmail                      | Notify admin on inquiry errors      | General Inquiry - Backup    | Notify Client Error4          |                                   |
| Schedule Trigger           | Schedule Trigger            | Trigger daily reminder workflow     | -                          | Calculate Tomorrow            |                                   |
| Calculate Tomorrow         | Code                       | Compute next day date               | Schedule Trigger            | Get Schedule Events           |                                   |
| Get Schedule Events        | Google Calendar            | Fetch calendar events for reminders | Calculate Tomorrow          | Format Reminder Data          |                                   |
| Format Reminder Data       | Code                       | Prepare reminder message data       | Get Schedule Events         | Search Schedule Events        |                                   |
| Search Schedule Events     | Airtable                   | Find matching schedule records      | Format Reminder Data        | Send Client Reminder          |                                   |
| Send Client Reminder       | WhatsApp                   | Send reminder message to client     | Search Schedule Events      | -                            |                                   |
| Rate Limiter              | Code                       | Enforce message rate limits          | Is User Text Message?       | Redis Hourly                 |                                   |
| Redis Hourly              | Redis                      | Store hourly message count           | Rate Limiter                | Increment Counter Hourly      |                                   |
| Increment Counter Hourly  | Redis                      | Increment message count              | Redis Hourly                | Check Limit                  |                                   |
| Check Limit               | Code                       | Evaluate if rate limit exceeded      | Increment Counter Hourly    | Check Rate Limited            |                                   |
| Check Rate Limited         | If                         | Decide to send or queue message      | Check Limit                 | Send Mesage?, Push            |                                   |
| Send Mesage?              | If                         | Determine message sending             | Check Rate Limited          | Send User Message             |                                   |
| Send User Message          | WhatsApp                   | Send message to user                  | Send Mesage?                | -                            |                                   |
| Send Owner Message         | WhatsApp                   | Notify salon owner on message status | Send User Message           | Send Rate Limit Email         |                                   |
| Send Rate Limit Email      | Gmail                      | Alert admin on rate limit exceeded   | Send Owner Message          | -                            |                                   |
| Send Error Notification    | Gmail                      | General error notification emails    | Various error nodes         | Notify Client Error           |                                   |
| Notify Client Error        | Set                        | Prepare client error notifications   | Various error nodes         | WhatsApp Send nodes           |                                   |

*Sticky notes found contain no textual content or external links.*

---

### 4. Reproducing the Workflow from Scratch

1. **Create WhatsApp Trigger Node**  
   - Type: WhatsApp Trigger  
   - Set webhook ID and connect WhatsApp account credentials.  
   - This is the entry point for all inbound WhatsApp messages.

2. **Add Airtable Node to Fetch Configuration**  
   - Type: Airtable (read)  
   - Connect to Airtable credentials and base for configuration data.  
   - Connect output of WhatsApp Trigger to this node.

3. **Add Set Node "Set Initial Data"**  
   - Initialize flags or variables to track message types.  
   - Connect output of Fetch Configuration to this node.

4. **Add If Node "Is Audio Message?"**  
   - Condition: Check if message type is audio.  
   - Connect output of Set Initial Data to this node.

5. **Add If Node "Is User Text Message?"**  
   - Condition: Check if message is plain text.  
   - Connect False output of "Is Audio Message?" to this node.

6. **Add Switch Node "Input type"**  
   - Configure cases for 'image', 'file', and default unsupported media.  
   - Connect False output of "Is User Text Message?" to this node.

7. **Add WhatsApp nodes to Get URLs**  
   - Get Audio Url, Get Image Url, Get File Url nodes.  
   - Connect corresponding Switch outputs to these nodes.

8. **Add HTTP Request nodes to Download media**  
   - Download Audio, Download Image, Download File nodes.  
   - Connect from respective Get URL nodes.

9. **Add AI nodes for media processing**  
   - Transcribe Audio (OpenAI) connected after Download Audio.  
   - Analyze Image (OpenAI) after Download Image.  
   - Extract from File after Download File.

10. **Add Set nodes for normalized data**  
    - Text, Audio, Image, File nodes to standardize output.  
    - Connect respective AI or extraction nodes.

11. **Add If Node "Only PDF File"** to filter files.  
    - Connect from Switch Input type → File branch.  
    - Route non-PDFs to "Incorrect format" WhatsApp node.

12. **Add WhatsApp nodes for error notifications**  
    - Incorrect format, Not supported, Send Media/File Warning Owner, Send User Notification.  
    - Connect from appropriate branches in "Input type".

13. **Add Code Node "Fix mimeType for Audio"**  
    - Adjust audio MIME types for WhatsApp compatibility.  
    - Connect from Generate Audio Response node (see below).

14. **Add WhatsApp Send nodes for audio and text responses**  
    - Send audio and Send message nodes.  
    - Connect outputs from processing nodes.

15. **Add Intent Recognition Agent (LangChain Agent)**  
    - Configure AI model credentials (OpenAI or Google Gemini).  
    - Connect outputs of all Set nodes (Text, Audio, Image, File) to this node.

16. **Add Code Node "Parse Intent JSON"**  
    - Parse AI response JSON output.  
    - Connect output of Intent Recognition Agent to this node.

17. **Add Switch Node "Switch Route"**  
    - Create cases for Booking, Cancellation, Update, General Inquiry intents.  
    - Connect output of Parse Intent JSON to Switch Route.

18. **Create Booking Agent, Cancellation Agent, Update Agent, General Inquiry Agent nodes**  
    - AI agent nodes configured with respective prompts and AI credentials.  
    - Backup agents configured as fallback with retry logic.

19. **Add Max Iterations? If nodes** for retry limits on agents.  
    - Connect agents through these nodes to prevent infinite retries.

20. **Build Booking Flow:**  
    - list_services (Airtable Tool) → check_availability (Google Calendar Tool) → Create Event (Google Calendar) → Send Confirmation (Gmail) → Information to be Saved in Airtable1 (Set) → Logs the confirmed booking details1 (Airtable) → Parse Confirmation Message (Code) → Send Booking Message (WhatsApp)  
    - Include error handling nodes (Send Error Notification2, Notify Client Error2).

21. **Build Update Flow:**  
    - Extract JSON from Agent (Code) → Update Ready? (If) → Update Event (Google Calendar) → Search Airtable Record → Update Airtable Record → Send Update Message1 (Gmail) → Customer Confirmation Message (Code) → Send Update Message (WhatsApp)  
    - Include error handling nodes.

22. **Build Cancellation Flow:**  
    - Extract JSON from Cancellation Agent (Code) → Delete Ready? (If) → Delete Event (Google Calendar) → Send Cancellation1 (Gmail) → Search Delete Record (Airtable) → Cancel Appointment (Airtable) → Prepare Cancel Appointment1 (Code) → Send Cancel Message (WhatsApp)  
    - Include error handling nodes.

23. **Build General Inquiry Flow:**  
    - Parse General Inquiry Output (Code) → Send General Message (WhatsApp)  
    - Use General Inquiry and backup agents.

24. **Add Scheduled Trigger nodes for reminders:**  
    - Schedule Trigger → Calculate Tomorrow (Code) → Get Schedule Events (Google Calendar) → Format Reminder Data (Code) → Search Schedule Events (Airtable) → Send Client Reminder (WhatsApp).

25. **Implement Rate Limiting and Batching:**  
    - Rate Limiter (Code) → Redis Hourly → Increment Counter Hourly → Check Limit (Code) → Check Rate Limited (If) → Send Mesage? (If) → Send User Message (WhatsApp) → Send Owner Message (WhatsApp) → Send Rate Limit Email (Gmail).

26. **Add Error Handling Nodes:**  
    - Multiple Send Error Notification (Gmail) nodes linked to corresponding error paths.  
    - Notify Client Error (Set) nodes prepare client error messages.  
    - WhatsApp nodes send error or status messages to clients.

27. **Set up Redis nodes for Locks and Message Queue:**  
    - Set Processing Lock → Wait → Get Current Processing Lock → Am I the Processor? → Pop All Batched Messages → Delete Message List → Delete Processing Lock → Combine Messages → Package Data → Input type.

28. **Configure all credentials:**  
    - WhatsApp API credentials for triggers and messages.  
    - OpenAI and Google Gemini API keys for AI nodes.  
    - Google Calendar OAuth2 credentials.  
    - Airtable API credentials.  
    - Gmail OAuth2 credentials for sending emails.  
    - Redis connection for caching and rate limiting.

29. **Test each branch independently and monitor logs for errors.**

---

### 5. General Notes & Resources

| Note Content                                                                                                                                       | Context or Link                                                    |
|----------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| This workflow integrates WhatsApp messaging with GPT-powered natural language processing and Google Calendar/Airtable for appointment management. | Project description and technical overview.                      |
| Rate limiting and batching implemented via Redis ensure stable operation under high load.                                                         | Rate Limiting & Message Batching section.                        |
| AI agents use LangChain framework with both OpenAI and Google Gemini chat models for redundancy and best understanding.                           | Intent Recognition & General Inquiry blocks.                     |
| Gmail nodes require OAuth2 setup to send emails from configured accounts.                                                                           | Email confirmation and error notification nodes.                 |
| Airtable stores booking data including services, customer info, and appointment status.                                                            | Booking, update, cancellation logging nodes.                     |
| Google Calendar nodes use OAuth2 and Google Calendar API to manage events and check availability.                                                  | Calendar event management nodes.                                 |
| WhatsApp integration done via official WhatsApp Business API webhook nodes in n8n.                                                                 | WhatsApp Trigger and WhatsApp messaging nodes.                   |

---

**Disclaimer:**  
The provided text is exclusively derived from an automated workflow created in n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All manipulated data is legal and public.