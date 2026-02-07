AI Sales Assistant with GPT-4 & Claude: Qualify Leads, Book Meetings & Log in Google

https://n8nworkflows.xyz/workflows/ai-sales-assistant-with-gpt-4---claude--qualify-leads--book-meetings---log-in-google-9026


# AI Sales Assistant with GPT-4 & Claude: Qualify Leads, Book Meetings & Log in Google

### 1. Workflow Overview

This workflow implements an AI-powered sales assistant designed to interact with website visitors, qualify leads, schedule meetings, and maintain records in Google Sheets and Google Calendar. It leverages advanced AI models (GPT-4 and Claude via OpenRouter) to provide conversational engagement, calendar management, and automated email confirmations.

**Target Use Cases:**  
- Qualifying potential leads visiting a website for AI automation services  
- Booking meetings automatically based on calendar availability  
- Logging conversations and appointments for CRM and follow-up  

**Logical Blocks:**

- **1.1 Chat Interaction & Lead Qualification:**  
  Captures incoming chat messages, engages visitors with a persona-driven AI assistant (“Hassan”), collects contact info, references company data, and logs conversation summaries.

- **1.2 Calendar Management & Meeting Booking:**  
  Upon lead interest, checks calendar availability, proposes meeting slots, books appointments, and sends branded email confirmations.

- **1.3 Response Processing & Data Management:**  
  Extracts and formats AI responses, manages conversation continuity, updates Google Sheets with lead and meeting data, and checks historical interactions to avoid duplicates.

---

### 2. Block-by-Block Analysis

#### 2.1 Chat Interaction & Lead Qualification

**Overview:**  
This block handles incoming chat messages from website visitors, uses an AI agent named “Hassan” to qualify leads conversationally, retrieves company info from Google Docs for accurate responses, and logs visitor data and summaries in Google Sheets.

**Nodes Involved:**  
- When chat message received  
- AI Agent  
- OpenRouter Chat Model  
- Simple Memory  
- Get a document in Google Docs  
- Append or update row in sheet in Google Sheets  
- Checking History  
- Code (response extraction)

**Node Details:**

- **When chat message received**  
  - Type: LangChain Chat Trigger node  
  - Role: Entry point for incoming chat messages from website visitors via webhook  
  - Config: Public webhook enabled to receive messages  
  - Inputs: External chat messages  
  - Outputs: Passes message data to AI Agent  
  - Edge Cases: Webhook downtime, malformed payloads  

- **AI Agent**  
  - Type: LangChain Agent node  
  - Role: Main conversational AI simulating “Hassan”, the lead qualification assistant  
  - Config:  
    - Uses GPT-4 via OpenRouter  
    - System prompt defines persona, sales methodology (Challenger Sale, SPIN Selling), and conversation flow  
    - Mandates updating Google Sheets after every response  
    - Enforces strict rules on engagement style and data handling  
  - Inputs: Chat message, conversation memory, company info, and history check results  
  - Outputs: AI-generated message, flags for meeting booking trigger  
  - Edge Cases: Model response delays, incomplete data, conversation context loss  

- **OpenRouter Chat Model**  
  - Type: Language Model node (OpenRouter API)  
  - Role: Provides GPT-4 conversational responses for the AI Agent  
  - Config: Model set as “openai/gpt-4.1” via OpenRouter credentials  
  - Inputs/Outputs: Receives prompt text, returns chat completion  
  - Edge Cases: API rate limits, authentication errors  

- **Simple Memory**  
  - Type: LangChain Memory Buffer Window  
  - Role: Maintains conversation context with a sliding window of last 10 messages  
  - Config: Session key based on custom sessionId from chat input  
  - Inputs: Chat messages, AI responses  
  - Outputs: Provides context for AI Agent  
  - Edge Cases: Memory overflow or reset causing context loss  

- **Get a document in Google Docs**  
  - Type: Google Docs Tool  
  - Role: Retrieves Sycorda company information to enable informed AI responses  
  - Config: Document URL preset, OAuth2 credential linked to company account  
  - Inputs: Triggered by AI Agent tool usage  
  - Outputs: Company info text  
  - Edge Cases: Document access permissions, network failures  

- **Append or update row in sheet in Google Sheets**  
  - Type: Google Sheets Tool  
  - Role: Stores or updates visitor info and conversation summaries for lead tracking  
  - Config:  
    - Matches rows by Email column to update existing records  
    - Appends new rows if no match found  
    - Columns include Name, Email, Summary, Date (timestamped)  
    - OAuth2 credential for Google Sheets access  
  - Inputs: Data from AI Agent outputs (name, email, summary)  
  - Outputs: Confirmation of data write  
  - Edge Cases: Sheet access errors, data type mismatches  

- **Checking History**  
  - Type: Google Sheets Tool (read)  
  - Role: Checks if visitor has previous interactions recorded to avoid duplicates and tailor responses  
  - Config: Reads same sheet as Append/Update node  
  - Inputs: Email from AI Agent  
  - Outputs: Previous interaction data  
  - Edge Cases: Sheet read permission, missing data  

- **Code**  
  - Type: Code Node (JavaScript)  
  - Role: Extracts clean chat response text from AI API’s complex response structure  
  - Config: Custom JS logic to check multiple possible response fields for robustness  
  - Inputs: Raw AI Agent output  
  - Outputs: Clean chat message text and thread ID for conversation continuity  
  - Edge Cases: Unexpected response formats, null or undefined fields  

---

#### 2.2 Calendar Management & Meeting Booking

**Overview:**  
This block activates when a visitor shows interest in booking a meeting. It uses an AI agent specialized in calendar management to check availability, book meetings, generate invites, send confirmation emails, and update records.

**Nodes Involved:**  
- Check Calander & Book Meeting and send email (agent)  
- Get booked Appointments from Google Calendar  
- Google Calendar1 (Create Calendar Event)  
- Send a message in Gmail  
- Simple Memory2  

**Node Details:**

- **Check Calander & Book Meeting and send email**  
  - Type: LangChain Agent Tool  
  - Role: AI agent dedicated to calendar booking tasks  
  - Config:  
    - System prompt defines calendar booking workflow, timezone (Lahore GMT+5), and strict sequential execution: check availability, collect info, confirm, book, send email  
    - Uses Claude model (“anthropic/claude-sonnet-4”) via OpenRouter  
  - Inputs: User message and context from Simple Memory2 and calendar queries  
  - Outputs: Booking confirmation, meeting details, email triggers  
  - Edge Cases: Calendar API failures, booking conflicts, user declines  

- **Get booked Appointments from Google Calendar**  
  - Type: Google Calendar Tool (read)  
  - Role: Retrieves existing appointments within requested time range to check availability  
  - Config: Limits to 10 events, timezone set, OAuth2 linked to Sycorda calendar  
  - Inputs: Requested date range from AI agent  
  - Outputs: List of booked events  
  - Edge Cases: API rate limit, incorrect timezones, empty results  

- **Google Calendar1 (Create Calendar Event)**  
  - Type: Google Calendar Tool (write)  
  - Role: Creates new meeting events with summary, attendees, start/end times  
  - Config: Uses AI-provided meeting data, adds user email and CEO email as attendees  
  - Inputs: Meeting details from AI agent’s booking confirmation  
  - Outputs: Calendar event created confirmation  
  - Edge Cases: Overlapping events, invalid date formats, permission denial  

- **Send a message in Gmail**  
  - Type: Gmail Tool  
  - Role: Sends branded HTML email confirming meeting details to user and host  
  - Config:  
    - Uses dynamic variables for recipient email, meeting summary, date, time, meeting link, and subject from AI outputs  
    - OAuth2 credential linked to Sycorda Gmail account  
  - Inputs: Meeting confirmation data from AI agent  
  - Outputs: Email sent confirmation  
  - Edge Cases: Email delivery failure, invalid recipient address  

- **Simple Memory2**  
  - Type: LangChain Memory Buffer Window  
  - Role: Maintains conversation context specifically for calendar booking interaction  
  - Config: Context window of 20 messages to preserve booking dialogue  
  - Inputs/Outputs: Used by calendar booking AI agent  
  - Edge Cases: Context loss leading to booking errors  

---

#### 2.3 Response Processing & Data Management

**Overview:**  
This block processes AI responses for clean output on the website, manages conversation threads, updates Google Sheets with summaries, and checks history to enhance interaction quality.

**Nodes Involved:**  
- Code (response extraction)  
- Checking History  
- Append or update row in sheet in Google Sheets  

**Node Details:**

- **Code**  
  - (Detailed above in 2.1) Extracts clean text response and threadId from AI output for front-end display and conversation continuity.

- **Checking History**  
  - (Detailed above in 2.1) Checks prior visitor interactions for context and data integrity.

- **Append or update row in sheet in Google Sheets**  
  - (Detailed above in 2.1) Updates visitor and conversation data after each interaction to maintain an up-to-date lead database.

---

### 3. Summary Table

| Node Name                               | Node Type                                | Functional Role                              | Input Node(s)                        | Output Node(s)                          | Sticky Note                                                                                  |
|----------------------------------------|-----------------------------------------|----------------------------------------------|------------------------------------|----------------------------------------|----------------------------------------------------------------------------------------------|
| When chat message received              | LangChain Chat Trigger                   | Entry point for incoming chat messages       | External webhook                   | AI Agent                               | STEP 1: Chat Interaction & Lead Qualification                                               |
| AI Agent                               | LangChain Agent                         | Main conversational AI assistant “Hassan”   | When chat message received, Simple Memory, Checking History, Google Docs, Sheets | Code                                   | STEP 1: Chat Interaction & Lead Qualification                                               |
| OpenRouter Chat Model                  | LangChain LM Chat OpenRouter             | Provides GPT-4 conversational responses      | AI Agent                           | AI Agent                               | STEP 1: Chat Interaction & Lead Qualification                                               |
| Simple Memory                         | LangChain Memory Buffer Window           | Maintains conversation context (10 messages) | When chat message received         | AI Agent                               | STEP 1: Chat Interaction & Lead Qualification                                               |
| Get a document in Google Docs          | Google Docs Tool                        | Fetches company info for accurate responses  | AI Agent                          | AI Agent                               | STEP 1: Chat Interaction & Lead Qualification                                               |
| Append or update row in sheet in Google Sheets | Google Sheets Tool                      | Records visitor data and conversation summary | AI Agent                          | AI Agent                               | STEP 1: Chat Interaction & Lead Qualification                                               |
| Checking History                      | Google Sheets Tool (read)                 | Checks previous visitor interactions         | AI Agent                          | AI Agent                               | STEP 1: Chat Interaction & Lead Qualification                                               |
| Code                                  | Code Node                              | Extracts clean AI response text and threadId | AI Agent                          | (none direct, for UI output)           | STEP 3: Response Processing & Data Management                                               |
| Check Calander & Book Meeting and send email | LangChain Agent Tool                     | Specialized AI for calendar booking           | Simple Memory2, Get booked Appointments, Google Calendar1, Send a message in Gmail | AI Agent                               | STEP 2: Calendar Management & Meeting Booking                                               |
| Get booked Appointments from Google Calendar | Google Calendar Tool (read)              | Retrieves existing calendar events            | Check Calander & Book Meeting and send email | Check Calander & Book Meeting and send email | STEP 2: Calendar Management & Meeting Booking                                               |
| Google Calendar1                      | Google Calendar Tool (write)             | Creates new meeting events                     | Check Calander & Book Meeting and send email | Check Calander & Book Meeting and send email | STEP 2: Calendar Management & Meeting Booking                                               |
| Send a message in Gmail                | Gmail Tool                            | Sends meeting confirmation emails             | Check Calander & Book Meeting and send email | Check Calander & Book Meeting and send email | STEP 2: Calendar Management & Meeting Booking                                               |
| Simple Memory2                        | LangChain Memory Buffer Window           | Maintains booking conversation context (20 messages) | Check Calander & Book Meeting and send email | Check Calander & Book Meeting and send email | STEP 2: Calendar Management & Meeting Booking                                               |
| OpenRouter Chat Model4                | LangChain LM Chat OpenRouter             | Provides Claude model responses for booking   | Check Calander & Book Meeting and send email | Check Calander & Book Meeting and send email | STEP 2: Calendar Management & Meeting Booking                                               |
| Sticky Note                          | Sticky Note                           | Describes Step 1 block                         | (none)                            | (none)                                 | STEP 1: Chat Interaction & Lead Qualification                                               |
| Sticky Note1                         | Sticky Note                           | Describes Step 2 block                         | (none)                            | (none)                                 | STEP 2: Calendar Management & Meeting Booking                                               |
| Sticky Note2                         | Sticky Note                           | Describes Step 3 block                         | (none)                            | (none)                                 | STEP 3: Response Processing & Data Management                                               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create "When chat message received" node**  
   - Type: LangChain Chat Trigger  
   - Set webhook to public, enable to receive chat messages from website visitors.

2. **Create "Simple Memory" node**  
   - Type: LangChain Memory Buffer Window  
   - Set `sessionKey` to `{{$json.sessionId}}`  
   - Context window length: 10 messages.

3. **Create "Get a document in Google Docs" node**  
   - Type: Google Docs Tool  
   - Operation: Get  
   - Document URL: `1H9ZBePkINDHi2c-IfsxRaVjF5iiGkwimxgJLICyGZco`  
   - Connect OAuth2 credentials with Google Docs access.

4. **Create "Checking History" node**  
   - Type: Google Sheets Tool (read)  
   - Document ID: `1GRPx3ECZSdB83Kip_MzMV-v_g-9pqoUZRrsB2_BY5Vo`  
   - Sheet Name: `gid=0` (Sheet1)  
   - OAuth2 credentials for Google Sheets.

5. **Create "Append or update row in sheet in Google Sheets" node**  
   - Type: Google Sheets Tool (appendOrUpdate)  
   - Document ID: same as Checking History  
   - Sheet Name: same as Checking History  
   - Matching column: Email  
   - Columns: Name, Email, Summary, Date (formatted with current timestamp)  
   - OAuth2 credentials as above.

6. **Create "OpenRouter Chat Model" node**  
   - Type: LangChain LM Chat OpenRouter  
   - Model: `openai/gpt-4.1`  
   - Connect OpenRouter API credentials.

7. **Create "AI Agent" node**  
   - Type: LangChain Agent  
   - Text input: combine incoming chat message and prior context  
   - Set system prompt defining Hassan persona, Challenger Sale & SPIN techniques, conversation flow, tool usage requirements, and response style (see detailed prompt in node)  
   - Use linked OpenRouter Chat Model node as language model  
   - Add tools: Google Docs, Google Sheets (Checking History, Append/Update), Simple Memory buffer  
   - Connect inputs from "When chat message received," Simple Memory, Docs, Sheets nodes  
   - Output connects to "Code" node.

8. **Create "Code" node**  
   - Type: Code Node (JavaScript)  
   - Logic to extract clean chat response text and threadId from AI Agent output (use provided JS script for robustness).

9. **Create "Simple Memory2" node**  
   - Type: LangChain Memory Buffer Window  
   - Context window length: 20 messages  
   - Used for booking conversation context.

10. **Create "Get booked Appointments from Google Calendar" node**  
    - Type: Google Calendar Tool (read)  
    - Operation: getAll  
    - Limit: 10  
    - TimeMin and TimeMax set dynamically from AI agent input  
    - Calendar: sycorda CEO email calendar  
    - OAuth2 calendar credentials.

11. **Create "Google Calendar1" node**  
    - Type: Google Calendar Tool (write)  
    - Operation: create event  
    - Use AI-provided start, end, summary, and attendees (visitor email + CEO email)  
    - OAuth2 calendar credentials.

12. **Create "Send a message in Gmail" node**  
    - Type: Gmail Tool  
    - Send to: visitor email from AI data  
    - Subject and HTML message body: use AI-provided meeting details in branded template  
    - OAuth2 Gmail credentials.

13. **Create "OpenRouter Chat Model4" node**  
    - Type: LangChain LM Chat OpenRouter  
    - Model: `anthropic/claude-sonnet-4`  
    - OAuth2 OpenRouter API credentials.

14. **Create "Check Calander & Book Meeting and send email" node**  
    - Type: LangChain Agent Tool  
    - System prompt: Define booking workflow with steps (availability, info collection, confirmation, event creation, email sending) and timezone (Lahore GMT+5)  
    - Use OpenRouter Chat Model4 (Claude) as language model  
    - Add tools: Google Calendar (Get booked Appointments), Google Calendar1, Gmail Tool, Simple Memory2  
    - Input text: user message and booking context  
    - Output: booking confirmations, triggers email send and calendar event creation.

15. **Connect nodes in sequence:**  
    - "When chat message received" → "AI Agent" → "Code"  
    - "AI Agent" uses "Simple Memory," "Get a document in Google Docs," "Checking History," "Append or update row in Google Sheets" as tools  
    - "AI Agent" triggers "Check Calander & Book Meeting and send email" upon booking interest  
    - Booking agent uses "Get booked Appointments," "Google Calendar1," "Send a message in Gmail," and "Simple Memory2"  
    - All nodes use appropriate OAuth2 credentials for Google services and OpenRouter API.

---

### 5. General Notes & Resources

| Note Content                                                                                                                    | Context or Link                               |
|---------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------|
| Persona “Hassan” embodies a friendly, casual American English sales assistant using Challenger Sale and SPIN Selling methods.   | AI Agent system prompt                        |
| Booking AI agent uses Claude model specialized for calendar and scheduling tasks with timezone Lahore GMT+5.                   | Calendar Booking Agent node                    |
| Email template uses branded Sycorda styling with logo and call-to-action link: https://sycorda.com                             | Gmail Tool node HTML message                   |
| Google Sheets document for conversation summary and lead tracking: https://docs.google.com/spreadsheets/d/1GRPx3ECZSdB83Kip_MzMV-v_g-9pqoUZRrsB2_BY5Vo | Google Sheets nodes                            |
| Google Docs company info document: https://docs.google.com/document/d/1H9ZBePkINDHi2c-IfsxRaVjF5iiGkwimxgJLICyGZco              | Google Docs Tool node                          |
| Timezone conversions and calendar operations must respect Lahore GMT+5 timezone consistently to avoid scheduling errors.        | Calendar Booking Agent system prompt          |
| Persistent conversation context maintained with buffer windows to enable multi-turn engagements without losing history.        | Simple Memory and Simple Memory2 nodes        |

---

**Disclaimer:**  
The text provided results solely from an automated workflow created with n8n, respecting all current content policies and containing no illegal, offensive, or protected content. All data handled is legal and public.