AI-Powered Salon Appointment Booking System with WhatsApp and Google Sheets

https://n8nworkflows.xyz/workflows/ai-powered-salon-appointment-booking-system-with-whatsapp-and-google-sheets-8698


# AI-Powered Salon Appointment Booking System with WhatsApp and Google Sheets

### 1. Workflow Overview

This workflow implements an AI-powered salon appointment booking system leveraging WhatsApp messaging and Google Sheets as a backend database. It targets GlamourEdge Salon to automate reception tasks such as service inquiries, stylist details, appointment booking, cancellation, and editing, all via conversational WhatsApp interactions.

The workflow is structured into the following logical blocks:

- **1.1 Input Reception & Trigger**: Captures inbound WhatsApp messages via Twilio.
- **1.2 AI Conversational Agent**: Processes user messages using a LangChain-based AI agent with GPT-4 and maintains session memory for context.
- **1.3 Google Sheets Data Access**: Handles data retrieval and manipulation including salon services, stylists, opening hours, bookings, and updates.
- **1.4 Messaging Output**: Sends AI-generated responses back to users on WhatsApp through Twilio.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception & Trigger

**Overview:**  
This block listens for incoming WhatsApp messages from clients via the Twilio platform and initiates the workflow.

**Nodes Involved:**  
- Twilio Trigger

**Node Details:**  

- **Node:** Twilio Trigger  
  - Type: Trigger node for Twilio inbound message events  
  - Configuration: Listens specifically for “com.twilio.messaging.inbound-message.received” event  
  - Credentials: Uses pre-configured Twilio API credentials  
  - Input/Output: No input; outputs inbound message data including sender and recipient numbers, and message body  
  - Edge Cases: Potential failure if Twilio credentials invalid or webhook misconfigured; message format inconsistencies  
  - Notes: Extracts sender phone number and message text for downstream processing

---

#### 1.2 AI Conversational Agent

**Overview:**  
Processes the user message with a defined AI assistant prompt tailored to salon booking tasks. It uses LangChain’s AI Agent node connected to GPT-4 via the OpenAI Chat Model node, enriched with session memory to maintain conversational context.

**Nodes Involved:**  
- AI Agent  
- OpenAI Chat Model  
- Simple Memory

**Node Details:**  

- **Node:** AI Agent  
  - Type: LangChain AI Agent node  
  - Role: Core AI conversational engine implementing the salon receptionist persona with detailed instructions (tone, task flow, fallback)  
  - Configuration:  
    - Custom prompt defining identity, style, task goals, error handling, and WhatsApp formatting rules  
    - Calls external tools depending on user intent (e.g., Google Sheets nodes for services, stylists, bookings)  
    - Uses runtime variables like current date/time and phone number from incoming message  
  - Inputs: User message from Twilio Trigger; context memory from Simple Memory; data from Google Sheets nodes via ‘ai_tool’ connections  
  - Outputs: Formatted conversational response text  
  - Edge Cases: Expression evaluation failures; handling missing or ambiguous input; fallback to transfer call on system errors  
  - Version: 2.2

- **Node:** OpenAI Chat Model  
  - Type: Language Model node using OpenAI GPT-4.1-mini  
  - Role: Provides the underlying language generation model for the AI Agent  
  - Configuration: GPT-4.1-mini model selected; linked to OpenAI API credentials  
  - Input: Prompt and context from AI Agent  
  - Output: Generated text response  
  - Edge Cases: API rate limits, timeouts, invalid credentials  
  - Version: 1.2

- **Node:** Simple Memory  
  - Type: LangChain Memory buffer window  
  - Role: Maintains session-specific conversational history using sender’s phone number as session key  
  - Configuration: Context window length set to 10 messages  
  - Input: Conversation data stream  
  - Output: Memory context passed to AI Agent  
  - Edge Cases: Session key missing or malformed; memory overflow or data loss  
  - Version: 1.3

---

#### 1.3 Google Sheets Data Access

**Overview:**  
Provides dynamic access to salon data stored in Google Sheets including services, stylists, opening hours, booking entries, and updates. The AI Agent invokes these nodes as “tools” to retrieve or modify data based on user intent.

**Nodes Involved:**  
- salonservices  
- SuggestStylist  
- openingHour  
- perticullerstylistsdetails  
- Booking services  
- Getbookingdetails  
- Updatebooking

**Node Details:**  

- **Node:** salonservices  
  - Type: Google Sheets Tool (read data)  
  - Role: Fetches list of available salon services from “Services” sheet  
  - Configuration: Reads from sheet ID 1011822210 in the main spreadsheet  
  - Input: Called by AI Agent when service info requested  
  - Output: Service list data  
  - Edge Cases: Sheet access errors; missing or malformed service data  
  - Version: 4.7

- **Node:** SuggestStylist  
  - Type: Google Sheets Tool (read data)  
  - Role: Provides stylist suggestions from “SuggestStylist” sheet  
  - Configuration: Reads from sheet ID 1978384237  
  - Input: Invoked when stylist info needed  
  - Output: Stylist names and details  
  - Edge Cases: Sheet permission errors; outdated stylist information  
  - Version: 4.7

- **Node:** openingHour  
  - Type: Google Sheets Tool (read data)  
  - Role: Retrieves salon opening hours from “openingHour” sheet  
  - Configuration: Reads from sheet ID 1322339636  
  - Input: Used to validate booking times against open hours  
  - Output: Opening hour data  
  - Edge Cases: Incorrect hours leading to invalid slot suggestions  
  - Version: 4.7

- **Node:** perticullerstylistsdetails  
  - Type: Google Sheets Tool (read data)  
  - Role: Fetches detailed information about individual stylists from “PerticullerStylistsDetails” sheet  
  - Configuration: Reads from sheet ID 1861968928  
  - Input: Called when stylist details are requested  
  - Output: Stylist profiles and availability  
  - Edge Cases: Missing stylist data or concurrency conflicts  
  - Version: 4.7

- **Node:** Booking services  
  - Type: Google Sheets Tool (append data)  
  - Role: Records new salon appointment bookings into “Order Booking” sheet (gid=0)  
  - Configuration: Appends columns for Date, Phone, Services (array), Start_time, Stylist_name, customer_name  
  - Input: Booking confirmation details from AI Agent  
  - Output: Booking saved in spreadsheet  
  - Edge Cases: Data format errors; concurrent writes causing race conditions  
  - Version: 4.7

- **Node:** Getbookingdetails  
  - Type: Google Sheets Tool (read data with filter)  
  - Role: Retrieves existing booking details matching a phone number from “Order Booking” sheet  
  - Configuration: Filters on Phone column based on AI Agent input  
  - Input: Used for appointment cancellation or editing verification  
  - Output: Booking details for confirmation  
  - Edge Cases: No booking found for given phone; multiple bookings possible ambiguity  
  - Version: 4.7

- **Node:** Updatebooking  
  - Type: Google Sheets Tool (update data)  
  - Role: Updates existing booking record matching Phone column in “Order Booking” sheet  
  - Configuration: Updates Date, Services, Start_time, Stylist_name, customer_name columns  
  - Input: New booking data from AI Agent after edit confirmation  
  - Output: Booking record updated in spreadsheet  
  - Edge Cases: Phone mismatch; concurrent update conflicts; partial data updates  
  - Version: 4.7

---

#### 1.4 Messaging Output

**Overview:**  
Sends the AI-generated WhatsApp response back to the user via Twilio’s messaging API.

**Nodes Involved:**  
- Send an SMS/MMS/WhatsApp message

**Node Details:**  

- **Node:** Send an SMS/MMS/WhatsApp message  
  - Type: Twilio message sending node  
  - Role: Delivers AI Agent responses back over WhatsApp to the user  
  - Configuration:  
    - “To” phone number extracted from inbound message sender (removes leading ‘+’)  
    - “From” number set to Twilio WhatsApp sender number (also trimmed)  
    - Message content directly mapped from AI Agent output  
    - Enabled WhatsApp messaging option  
  - Input: AI Agent’s formatted response text  
  - Output: Confirmation of message sent or error  
  - Edge Cases: Phone number formatting errors; Twilio API failures; messaging limits  
  - Version: 1

---

### 3. Summary Table

| Node Name                      | Node Type                         | Functional Role                               | Input Node(s)           | Output Node(s)                  | Sticky Note                                                          |
|-------------------------------|----------------------------------|-----------------------------------------------|------------------------|-------------------------------|----------------------------------------------------------------------|
| Twilio Trigger                | Twilio Trigger                   | Captures inbound WhatsApp messages             | -                      | AI Agent                      |                                                                      |
| AI Agent                      | LangChain Agent                  | Processes user input, manages dialog & tools   | Twilio Trigger, Simple Memory, Google Sheets nodes, OpenAI Chat Model | Send an SMS/MMS/WhatsApp message |                                                                      |
| OpenAI Chat Model             | LangChain LM Chat OpenAI         | Provides GPT-4 language model for AI Agent     | AI Agent (ai_languageModel) | AI Agent                     |                                                                      |
| Simple Memory                 | LangChain Memory Buffer Window   | Maintains conversation context per user phone  | Twilio Trigger          | AI Agent                      |                                                                      |
| salonservices                 | Google Sheets Tool               | Fetches salon services list                      | AI Agent (ai_tool)      | AI Agent                      |                                                                      |
| SuggestStylist                | Google Sheets Tool               | Provides stylist suggestions                     | AI Agent (ai_tool)      | AI Agent                      |                                                                      |
| openingHour                  | Google Sheets Tool               | Retrieves salon opening hours                     | AI Agent (ai_tool)      | AI Agent                      |                                                                      |
| perticullerstylistsdetails   | Google Sheets Tool               | Fetches detailed stylist info                     | AI Agent (ai_tool)      | AI Agent                      |                                                                      |
| Booking services             | Google Sheets Tool               | Appends new booking entries                        | AI Agent (ai_tool)      | AI Agent                      |                                                                      |
| Getbookingdetails            | Google Sheets Tool               | Retrieves booking details for a phone number     | AI Agent (ai_tool)      | AI Agent                      |                                                                      |
| Updatebooking                | Google Sheets Tool               | Updates existing booking record                     | AI Agent (ai_tool)      | AI Agent                      |                                                                      |
| Send an SMS/MMS/WhatsApp message | Twilio                          | Sends AI-generated WhatsApp response back        | AI Agent                | -                             |                                                                      |
| Sticky Note                  | Sticky Note                     | Notes spreadsheet URL                             | -                      | -                             | Sample Spreadsheet https://docs.google.com/spreadsheets/d/1jF0ACPiyK1gk4J_oWwpMQ8KG9Wek8RtG8Ay2npJClak/edit?usp=sharing |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Twilio Trigger Node**  
   - Node Type: Twilio Trigger  
   - Configure to listen for inbound WhatsApp messages ("com.twilio.messaging.inbound-message.received")  
   - Set Twilio credentials (account SID, auth token)  
   - Ensure webhook URL is correctly set in Twilio console

2. **Create OpenAI Chat Model Node**  
   - Node Type: LangChain LM Chat OpenAI  
   - Select GPT-4.1-mini model  
   - Configure OpenAI API credentials (API key)  
   - No additional parameters needed

3. **Create Simple Memory Node**  
   - Node Type: LangChain Memory Buffer Window  
   - Set `sessionKey` to `={{ $json.data.from }}` to use sender phone as session identifier  
   - Set context window length to 10 messages

4. **Create AI Agent Node**  
   - Node Type: LangChain Agent  
   - Configure prompt with detailed instructions: salon receptionist persona, task flow, error handling, WhatsApp formatting rules  
   - Link AI Agent’s language model parameter to OpenAI Chat Model node  
   - Link AI Agent’s memory parameter to Simple Memory node  
   - Define tool calls to Google Sheets nodes for data retrieval and booking updates  
   - Use expressions to inject dynamic data: current date/time `{{$now}}`, user phone `{{ $json.data.from }}`, user message `{{ $json.data.body }}`

5. **Create Google Sheets Nodes for Data Access**  
   - Use Google Sheets Tool nodes with OAuth2 credentials configured for the salon’s spreadsheet  
   - Create nodes with the following configurations:  
     - **salonservices**: Read from “Services” sheet (ID 1011822210)  
     - **SuggestStylist**: Read from “SuggestStylist” sheet (ID 1978384237)  
     - **openingHour**: Read from “openingHour” sheet (ID 1322339636)  
     - **perticullerstylistsdetails**: Read from “PerticullerStylistsDetails” sheet (ID 1861968928)  
     - **Booking services**: Append new entries into “Order Booking” sheet (gid=0), mapping columns Date, Phone, Services (array), Start_time, Stylist_name, customer_name  
     - **Getbookingdetails**: Read filtered bookings by Phone from “Order Booking” sheet  
     - **Updatebooking**: Update existing booking record by Phone in “Order Booking” sheet

6. **Configure the connections for AI Agent tools input**  
   - Connect all Google Sheets nodes to AI Agent’s `ai_tool` input  
   - Connect Simple Memory node to AI Agent’s `ai_memory` input  
   - Connect OpenAI Chat Model node to AI Agent’s `ai_languageModel` input  
   - Connect Twilio Trigger’s main output to AI Agent’s main input

7. **Create Twilio Send Message Node**  
   - Node Type: Twilio  
   - Configure to send WhatsApp messages by enabling ‘toWhatsapp’ option  
   - Set “To” parameter to extract sender phone number from Twilio Trigger (remove leading ‘+’)  
   - Set “From” parameter to Twilio WhatsApp number (remove leading ‘+’)  
   - Map message content from AI Agent output (`$json.output`)  
   - Connect AI Agent’s main output to this node’s input

8. **Set execution order**  
   - Twilio Trigger → AI Agent → Twilio Send Message  
   - Google Sheets nodes connected as tools to AI Agent

9. **Test the workflow**  
   - Send WhatsApp messages to the Twilio number  
   - Confirm AI responds appropriately, services are fetched, bookings are recorded or updated in Google Sheets

---

### 5. General Notes & Resources

| Note Content                                                                                                              | Context or Link                                                                                                           |
|---------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------|
| Sample Spreadsheet used for data storage: services, stylists, bookings, hours                                              | https://docs.google.com/spreadsheets/d/1jF0ACPiyK1gk4J_oWwpMQ8KG9Wek8RtG8Ay2npJClak/edit?usp=sharing                      |
| AI Agent prompt includes detailed instructions for tone, task flow, error handling, and WhatsApp formatting rules         | Embedded in AI Agent node parameters                                                                                       |
| Uses LangChain integration with OpenAI GPT-4.1-mini for conversational AI                                                  | Requires valid OpenAI API credentials                                                                                       |
| Twilio configured for WhatsApp messaging with separate inbound trigger and outbound message nodes                         | Requires Twilio account with WhatsApp sandbox or production enabled                                                        |

---

**Disclaimer:** The text provided is derived exclusively from an n8n automated workflow. It complies strictly with content policies and contains no illegal, offensive, or protected material. All processed data is legal and public.