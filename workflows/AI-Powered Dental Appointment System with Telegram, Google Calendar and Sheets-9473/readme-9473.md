AI-Powered Dental Appointment System with Telegram, Google Calendar and Sheets

https://n8nworkflows.xyz/workflows/ai-powered-dental-appointment-system-with-telegram--google-calendar-and-sheets-9473


# AI-Powered Dental Appointment System with Telegram, Google Calendar and Sheets

### 1. Workflow Overview

This workflow, titled **AI-Powered Dental Appointment System with Telegram, Google Calendar and Sheets**, automates dental appointment booking and management through AI-powered conversational agents integrated with Telegram messaging, Google Calendar scheduling, and Google Sheets data logging. It facilitates user interactions via Telegram or webhook calls, manages appointment scheduling with calendar availability checks, updates records in Google Sheets, and sends notification emails via Gmail. The workflow is structured into several logical blocks representing input reception, AI-driven conversation management, calendar event handling, data persistence, and notification dispatch.

Logical blocks:

- **1.1 Input Reception and Triggering:** Receives user input via Telegram or webhook.
- **1.2 AI Conversation & Planning:** Processes user requests with AI agents for dialog management and appointment planning.
- **1.3 Booking Management:** Handles appointment booking validation, creation, updating, and cancellation using calendar and AI workflows.
- **1.4 Data Management and Notifications:** Updates Google Sheets records and sends confirmation or status emails.
- **1.5 Workflow Operation Handling:** Manages sub-workflow executions and operation routing.
- **1.6 Memory and Context Handling:** Manages conversational context using memory buffer nodes.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception and Triggering

**Overview:**  
This block captures incoming appointment requests from users, either via Telegram messages or webhook calls, and initiates the AI processing chain.

**Nodes Involved:**  
- Telegram Trigger  
- Webhook  
- Webhook/Telegram (Switch)  
- Respond to Webhook  
- Send a text message (Telegram)  

**Node Details:**

- **Telegram Trigger**  
  - Type: Telegram Trigger  
  - Role: Listens for messages sent to the Telegram bot.  
  - Configuration: Uses a webhook linked to Telegram bot.  
  - Inputs: External Telegram messages.  
  - Outputs: Sends data to the Planning Agent node.  
  - Edge Cases: Telegram API downtime, invalid messages, or malformed data.

- **Webhook**  
  - Type: HTTP Webhook  
  - Role: Receives HTTP requests from external sources (e.g., website or app).  
  - Configuration: Standard webhook with no special parameters.  
  - Inputs: HTTP requests with appointment data.  
  - Outputs: Forwards data to Planning Agent.  
  - Edge Cases: Unauthorized requests, malformed payloads, timeout.

- **Webhook/Telegram (Switch)**  
  - Type: Switch  
  - Role: Routes the flow depending on whether the input was from webhook or Telegram.  
  - Configuration: Conditional checks on input source.  
  - Inputs: From Feedback or Next node after planning.  
  - Outputs: Routes to Respond to Webhook or Send a text message nodes.  
  - Edge Cases: Unexpected input values.

- **Respond to Webhook**  
  - Type: Respond to Webhook  
  - Role: Sends HTTP response back to webhook caller.  
  - Configuration: Standard response node.  
  - Inputs: Routed from Webhook/Telegram switch for webhook path.  
  - Outputs: Finalizes webhook response.  
  - Edge Cases: Response timeout or malformed response.

- **Send a text message (Telegram)**  
  - Type: Telegram  
  - Role: Sends Telegram messages back to user.  
  - Configuration: Uses Telegram credentials, sends text messages.  
  - Inputs: Routed from Webhook/Telegram switch for Telegram path.  
  - Outputs: Telegram confirmation message sent.  
  - Edge Cases: Telegram API quota limits, message delivery failures.

---

#### 1.2 AI Conversation & Planning

**Overview:**  
This block manages user dialogue and planning using AI agents with memory buffers and structured output parsing to maintain context and interpret user intent intelligently.

**Nodes Involved:**  
- Planning Agent  
- Simple Memory (two instances)  
- Structured Output Parser (two instances)  
- Google Gemini Chat Model nodes (2)  
- OpenAI Chat Model nodes (3)  
- Feedback or Next (Switch)  
- Edit Fields  

**Node Details:**

- **Planning Agent**  
  - Type: LangChain Agent  
  - Role: Core AI agent that plans the workflow steps based on user input and memory context.  
  - Configuration: Connected with AI language models and memory nodes.  
  - Inputs: From Telegram Trigger or Webhook; memory input from Simple Memory.  
  - Outputs: Routes to Feedback or Next node.  
  - Edge Cases: AI model timeouts, unexpected responses, memory overload.

- **Simple Memory** (two instances)  
  - Type: LangChain Memory Buffer Window  
  - Role: Holds conversational context for planning and booking agents.  
  - Configuration: Defaults, stores recent conversation segments.  
  - Inputs: Connected to Planning Agent and Booking Agent respectively.  
  - Outputs: Provides context memory to agents.  
  - Edge Cases: Memory overflow, context loss.

- **Structured Output Parser** (two instances)  
  - Type: LangChain Output Parser Structured  
  - Role: Parses AI output into structured data for downstream processing.  
  - Configuration: Default parsing rules to interpret AI responses.  
  - Inputs: Connected to AI Chat Model nodes.  
  - Outputs: Parsed structured data to AI agents.  
  - Edge Cases: Parsing failures if AI output deviates from expected format.

- **Google Gemini Chat Model nodes (2)**  
  - Type: AI Language Model (Google Gemini)  
  - Role: Provides AI conversational responses as part of the LangChain agents.  
  - Configuration: Integrated with Google Gemini API.  
  - Inputs: From Structured Output Parser or agent nodes.  
  - Outputs: AI-generated chat responses.  
  - Edge Cases: API rate limits, authentication failures.

- **OpenAI Chat Model nodes (3)**  
  - Type: AI Language Model (OpenAI)  
  - Role: Alternative AI conversational models used in agents.  
  - Configuration: Uses OpenAI API credentials.  
  - Inputs: Connected to agents and structured parsers.  
  - Outputs: AI-generated chat responses.  
  - Edge Cases: API quota or network errors.

- **Feedback or Next (Switch)**  
  - Type: Switch  
  - Role: Determines if conversation requires more input or can proceed.  
  - Configuration: Conditional on AI output or user input.  
  - Inputs: From Planning Agent.  
  - Outputs: Routes to Webhook/Telegram or Edit Fields nodes.  
  - Edge Cases: Incorrect condition evaluation.

- **Edit Fields**  
  - Type: Set  
  - Role: Prepares or modifies data fields before passing to Booking Agent.  
  - Configuration: Field mappings or transformations.  
  - Inputs: From Feedback or Next.  
  - Outputs: To Booking Agent.  
  - Edge Cases: Missing or invalid data fields.

---

#### 1.3 Booking Management

**Overview:**  
This block validates appointment availability, creates, updates, or deletes calendar events, and manages booking logic with AI tool workflows and Google Calendar nodes.

**Nodes Involved:**  
- Booking Agent  
- Booking Tool  
- Google Calendar nodes: create_event, delete_event1, update_calendar, validate_availability_event, check_availability_to_create, get_event_in_time_gap  
- Tool Workflows: validate_busy_time, create_new_event, delete_event, update_event, get_events_in_gap_time  
- Switch nodes: Success/Fail Booking, Operation  
- If node (validation decision)  
- Stop and Error  

**Node Details:**

- **Booking Agent**  
  - Type: LangChain Agent  
  - Role: AI agent handling booking requests and decisions.  
  - Configuration: Receives input from Edit Fields and Booking Tool, outputs booking success/failure.  
  - Inputs: Booking data and AI tool results.  
  - Outputs: Routes to Success/Fail Booking or Switch nodes.  
  - Edge Cases: AI errors, booking conflicts.

- **Booking Tool**  
  - Type: LangChain MCP Client Tool  
  - Role: Acts as an AI tool for booking operations, integrated with MCP Server Trigger.  
  - Configuration: Tool interface to calendar and booking sub-workflows.  
  - Inputs: From Edit Fields node.  
  - Outputs: To Booking Agent.  
  - Edge Cases: Tool communication failure.

- **Google Calendar Nodes**  
  - **create_event**: Creates new calendar events.  
  - **delete_event1**: Deletes specified events.  
  - **update_calendar**: Updates existing events.  
  - **validate_availability_event**: Checks availability for requested timeslot.  
  - **check_availability_to_create**: Further availability validation before creating event.  
  - **get_event_in_time_gap**: Retrieves events within a time window.  
  - Configuration: Each uses Google Calendar OAuth2 credentials and relevant parameters.  
  - Inputs/Outputs: Connected in a chain to perform booking lifecycle management.  
  - Edge Cases: API errors, permission issues, conflicting events.

- **Tool Workflows**  
  - Sub-workflows for complex operations: validate_busy_time, create_new_event, delete_event, update_event, get_events_in_gap_time.  
  - Triggered via MCP Server Trigger node and linked as AI tools.  
  - Inputs/Outputs: Accept specific parameters, return operation results.  
  - Edge Cases: Workflow execution failure, timeout.

- **Switch Nodes (Success/Fail Booking, Operation)**  
  - Role: Direct flow based on booking operation result or type.  
  - Configuration: Conditions on booking success or requested operation.  
  - Inputs: From Booking Agent and map_data.  
  - Outputs: Route to Google Calendar nodes or error handling.  
  - Edge Cases: Incorrect routing or missing conditions.

- **If Node**  
  - Role: Decision node to proceed with event creation or stop with error.  
  - Configuration: Conditional on availability check result.  
  - Inputs: From check_availability_to_create.  
  - Outputs: To create_event or Stop and Error.  
  - Edge Cases: Condition evaluation failure.

- **Stop and Error**  
  - Role: Terminates workflow execution with error status if booking fails.  
  - Configuration: Standard error stop.  
  - Inputs: From If node.  
  - Outputs: None.  
  - Edge Cases: None.

---

#### 1.4 Data Management and Notifications

**Overview:**  
This block updates appointment data in Google Sheets and sends confirmation or status emails to patients.

**Nodes Involved:**  
- Mail and Sheet Entry (LangChain Agent)  
- Edit Fields1 and Edit Fields2 (Set nodes)  
- Append or update row in sheet in Google Sheets  
- Send a message in Gmail  
- Switch App  
- Send a text message1 and Send a text message2 (Telegram)  
- Respond to Webhook1 and Respond to Webhook2  

**Node Details:**

- **Mail and Sheet Entry**  
  - Type: LangChain Agent  
  - Role: Manages data entry to Sheets and email notifications post-booking.  
  - Configuration: Uses OpenAI Chat Model2 and connects to Google Sheets and Gmail nodes as AI tools.  
  - Inputs: Data from Edit Fields1.  
  - Outputs: Routes to Switch App.  
  - Edge Cases: AI errors, data mismatch.

- **Edit Fields1 and Edit Fields2**  
  - Type: Set  
  - Role: Prepare data fields for mail and sheet entry or calendar validation.  
  - Inputs: From Success/Fail Booking and validate_availability_event respectively.  
  - Outputs: To Mail and Sheet Entry and other validation nodes.  
  - Edge Cases: Missing data fields.

- **Append or update row in sheet in Google Sheets**  
  - Type: Google Sheets Tool  
  - Role: Appends or updates the appointment record in a specified Google Sheet.  
  - Configuration: Uses Google Sheets OAuth2 credentials, sheet ID, and range.  
  - Inputs: From Mail and Sheet Entry agent as AI tool.  
  - Outputs: Back to Mail and Sheet Entry node.  
  - Edge Cases: API errors, sheet access permissions.

- **Send a message in Gmail**  
  - Type: Gmail Tool  
  - Role: Sends confirmation or status emails to patients.  
  - Configuration: Uses Gmail OAuth2 credentials.  
  - Inputs: From Mail and Sheet Entry agent.  
  - Outputs: None (ends this branch).  
  - Edge Cases: Email quota limits, authentication failure.

- **Switch App**  
  - Type: Switch  
  - Role: Routes output to either webhook response or Telegram messages depending on client app.  
  - Inputs: From Mail and Sheet Entry.  
  - Outputs: Respond to Webhook1 or Send a text message1.  
  - Edge Cases: Unexpected app identifiers.

- **Send a text message1 and Send a text message2**  
  - Type: Telegram nodes  
  - Role: Sends Telegram messages for booking updates or notifications.  
  - Configuration: Use Telegram credentials and chat IDs.  
  - Inputs: From Switch App or Switch nodes.  
  - Outputs: End nodes for Telegram communication.  
  - Edge Cases: Telegram API limits or delivery issues.

- **Respond to Webhook1 and Respond to Webhook2**  
  - Type: Respond to Webhook  
  - Role: Sends HTTP responses back to webhook callers after processing.  
  - Inputs: From Switch App and Switch node.  
  - Outputs: Ends HTTP response cycle.  
  - Edge Cases: Timeout or malformed responses.

---

#### 1.5 Workflow Operation Handling

**Overview:**  
This block manages sub-workflow executions, operation routing, and external workflow triggers for modular task execution.

**Nodes Involved:**  
- When Executed by Another Workflow  
- map_data (Set)  
- MCP Server Trigger (for AI tool workflows)  
- Operation (Switch)  
- validate_busy_time, create_new_event, delete_event, update_event, get_events_in_gap_time (Tool Workflows)  

**Node Details:**

- **When Executed by Another Workflow**  
  - Type: Execute Workflow Trigger  
  - Role: Entry point for this workflow when called as a sub-workflow.  
  - Inputs: External workflow calls.  
  - Outputs: To map_data.  
  - Edge Cases: Incorrect parameter passing.

- **map_data**  
  - Type: Set  
  - Role: Prepares and maps input data fields for downstream operation routing.  
  - Inputs: From When Executed by Another Workflow.  
  - Outputs: To Operation switch.  
  - Edge Cases: Missing fields.

- **MCP Server Trigger**  
  - Type: MCP Trigger  
  - Role: Handles AI tool workflow triggers (sub-workflows) such as validating busy time or creating events.  
  - Inputs: From AI tools like Booking Tool and Tool Workflows.  
  - Outputs: Tool workflow responses to AI tools.  
  - Edge Cases: Workflow execution errors, API failures.

- **Operation (Switch)**  
  - Type: Switch  
  - Role: Routes requests to the appropriate tool workflow based on operation type (validate, create, update, delete, get events).  
  - Inputs: From map_data.  
  - Outputs: To corresponding tool workflows.  
  - Edge Cases: Undefined operations.

- **Tool Workflows** (validate_busy_time, create_new_event, delete_event, update_event, get_events_in_gap_time)  
  - Type: Tool Workflows (sub-workflows)  
  - Role: Perform specific calendar operations invoked by main workflow via MCP Server Trigger.  
  - Inputs: Parameters from Operation switch.  
  - Outputs: Results back to MCP Server Trigger.  
  - Edge Cases: Workflow logic errors, API errors.

---

#### 1.6 Memory and Context Handling

**Overview:**  
Manages conversational memory to maintain context across user interactions for Planning and Booking agents.

**Nodes Involved:**  
- Simple Memory (two instances)  

**Node Details:**

- **Simple Memory**  
  - Type: LangChain Memory Buffer Window  
  - Role: Stores conversational history window to provide context to AI agents.  
  - Configuration: Default memory size.  
  - Inputs: From agents (Planning Agent and Booking Agent).  
  - Outputs: Feeds context back to agents.  
  - Edge Cases: Memory overflow, loss of critical context.

---

### 3. Summary Table

| Node Name                     | Node Type                                | Functional Role                                    | Input Node(s)                 | Output Node(s)                | Sticky Note                        |
|-------------------------------|-----------------------------------------|---------------------------------------------------|------------------------------|------------------------------|----------------------------------|
| Telegram Trigger               | Telegram Trigger                        | Receives user messages via Telegram                |                              | Planning Agent               |                                  |
| Webhook                       | Webhook                                | Receives external HTTP requests                     |                              | Planning Agent               |                                  |
| Webhook/Telegram              | Switch                                 | Routes to webhook or Telegram response              | Feedback or Next             | Respond to Webhook, Send a text message |                                  |
| Respond to Webhook            | Respond to Webhook                     | Sends HTTP response to webhook callers              | Webhook/Telegram             |                              |                                  |
| Send a text message           | Telegram                               | Sends Telegram messages to users                     | Webhook/Telegram             |                              |                                  |
| Planning Agent                | LangChain Agent                        | AI dialogue and planning                             | Telegram Trigger, Webhook, Simple Memory | Feedback or Next              |                                  |
| Simple Memory                 | Memory Buffer Window                   | Maintains conversation context for planning agent   |                              | Planning Agent               |                                  |
| Structured Output Parser      | Output Parser                         | Parses AI output into structured data                | Google Gemini Chat Model2     | Planning Agent               |                                  |
| Google Gemini Chat Model2     | AI Language Model (Google Gemini)     | AI model for planning agent                           | Structured Output Parser      | Planning Agent               |                                  |
| OpenAI Chat Model             | AI Language Model (OpenAI)             | AI model for planning agent                           |                              | Planning Agent               |                                  |
| Feedback or Next              | Switch                                | Determines next step or feedback response            | Planning Agent               | Webhook/Telegram, Edit Fields |                                  |
| Edit Fields                  | Set                                   | Prepares data for booking agent                      | Feedback or Next             | Booking Agent               |                                  |
| Booking Agent                | LangChain Agent                       | AI agent managing booking requests                    | Edit Fields, Booking Tool, Simple Memory1, Structured Output Parser1 | Success/Fail Booking, Switch   |                                  |
| Simple Memory1               | Memory Buffer Window                   | Maintains conversation context for booking agent     |                              | Booking Agent               |                                  |
| Structured Output Parser1    | Output Parser                         | Parses booking agent AI output                        | Google Gemini Chat Model3     | Booking Agent               |                                  |
| Google Gemini Chat Model3    | AI Language Model (Google Gemini)     | AI model for booking agent                            | Structured Output Parser1     | Booking Agent               |                                  |
| OpenAI Chat Model1           | AI Language Model (OpenAI)             | AI model for booking agent                            |                              | Booking Agent               |                                  |
| Success/Fail Booking         | Switch                                | Routes flow based on booking success or failure      | Booking Agent               | Edit Fields1, Switch         |                                  |
| Edit Fields1                | Set                                   | Prepares data for mail and sheet entry agent         | Success/Fail Booking         | Mail and Sheet Entry         |                                  |
| Mail and Sheet Entry        | LangChain Agent                       | Manages Google Sheets update and email notifications | Edit Fields1, OpenAI Chat Model2, Append or update row in sheet in Google Sheets, Send a message in Gmail | Switch App                   |                                  |
| Append or update row in sheet in Google Sheets | Google Sheets Tool                      | Updates or appends appointment records               | Mail and Sheet Entry (AI tool) | Mail and Sheet Entry         |                                  |
| Send a message in Gmail      | Gmail Tool                           | Sends confirmation emails                             | Mail and Sheet Entry (AI tool) |                              |                                  |
| Switch App                  | Switch                                | Routes to webhook or Telegram response                | Mail and Sheet Entry         | Respond to Webhook1, Send a text message1 |                                  |
| Respond to Webhook1          | Respond to Webhook                     | Sends HTTP response for mail/sheet operation          | Switch App                   |                              |                                  |
| Send a text message1         | Telegram                               | Sends Telegram messages post-booking                  | Switch App                   |                              |                                  |
| Switch                      | Switch                                | Routes based on booking agent decisions               | Booking Agent, Success/Fail Booking | Respond to Webhook2, Send a text message2 |                                  |
| Respond to Webhook2          | Respond to Webhook                     | Sends HTTP response post-booking                       | Switch                      |                              |                                  |
| Send a text message2         | Telegram                               | Sends Telegram messages post-booking                  | Switch                      |                              |                                  |
| create_event                | Google Calendar                      | Creates a calendar event                               | If                           |                              |                                  |
| delete_event1               | Google Calendar                      | Deletes a calendar event                               | Operation                    |                              |                                  |
| update_calendar             | Google Calendar                      | Updates calendar event                                | Operation                    |                              |                                  |
| validate_availability_event | Google Calendar                      | Validates event availability                           | Operation                    | Edit Fields2                 |                                  |
| check_availability_to_create| Google Calendar                      | Checks availability before event creation             | Operation                    | If                          |                                  |
| get_event_in_time_gap       | Google Calendar                      | Retrieves events in a specified time window           | Operation                    | response_data_get_data       |                                  |
| response_data_get_data      | Set                                   | Formats data response                                  | get_event_in_time_gap        |                              |                                  |
| validate_busy_time          | ToolWorkflow                        | Validates if time is busy                              | MCP Server Trigger           | MCP Server Trigger           |                                  |
| create_new_event            | ToolWorkflow                        | Creates new event                                     | MCP Server Trigger           | MCP Server Trigger           |                                  |
| delete_event               | ToolWorkflow                        | Deletes event                                        | MCP Server Trigger           | MCP Server Trigger           |                                  |
| update_event               | ToolWorkflow                        | Updates event                                        | MCP Server Trigger           | MCP Server Trigger           |                                  |
| get_events_in_gap_time     | ToolWorkflow                        | Gets events in gap time                               | MCP Server Trigger           | MCP Server Trigger           |                                  |
| MCP Server Trigger          | MCP Trigger                       | Triggers tool workflows                               | Booking Tool, Tool Workflows | Tool Workflows, Booking Tool |                                  |
| When Executed by Another Workflow | Execute Workflow Trigger           | Entry for sub-workflow execution                      |                              | map_data                    |                                  |
| map_data                   | Set                                   | Maps input data for operation routing                 | When Executed by Another Workflow | Operation                  |                                  |
| Operation                  | Switch                                | Routes operations to correct sub-workflow             | map_data                    | Tool Workflows              |                                  |
| If                         | If                                    | Branches based on availability check                  | check_availability_to_create | create_event, Stop and Error |                                  |
| Stop and Error             | Stop and Error                       | Stops workflow on error                                | If                         |                              |                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger node**:  
   - Type: Telegram Trigger  
   - Configure webhook with Telegram bot credentials.  
   - Position as input entry point.  

2. **Create Webhook node**:  
   - Type: Webhook  
   - No special parameters.  
   - Acts as alternative input entry point.

3. **Create Planning Agent node**:  
   - Type: LangChain Agent  
   - Link input from Telegram Trigger and Webhook nodes.  
   - Configure with AI language models (OpenAI and Google Gemini).  
   - Connect to Simple Memory node for context.

4. **Create Simple Memory node (Planning)**:  
   - Type: Memory Buffer Window  
   - Connect to Planning Agent as AI memory input/output.

5. **Create Structured Output Parser node (Planning)**:  
   - Type: Structured Output Parser  
   - Connect output of AI Chat Model (Google Gemini Chat Model2) to this parser.  
   - Connect parser output to Planning Agent.

6. **Create Google Gemini Chat Model2 node**:  
   - Type: AI Language Model (Google Gemini)  
   - Connect input from Structured Output Parser.  
   - Link output back to Structured Output Parser.

7. **Create OpenAI Chat Model node (Planning)**:  
   - Type: AI Language Model (OpenAI)  
   - Connect to Planning Agent as alternative language model.

8. **Create Feedback or Next switch node**:  
   - Type: Switch  
   - Connect output from Planning Agent.  
   - Setup conditions to route either to Webhook/Telegram switch or Edit Fields node.

9. **Create Webhook/Telegram switch node**:  
   - Type: Switch  
   - Routes between webhook response or Telegram message based on input source.

10. **Create Respond to Webhook and Send a text message nodes**:  
    - Respond to Webhook: Sends HTTP response for webhook calls.  
    - Send a text message: Sends Telegram responses.  
    - Connect from Webhook/Telegram switch accordingly.

11. **Create Edit Fields node (before Booking Agent)**:  
    - Type: Set  
    - Prepare data fields for booking processing.  
    - Connect output of Feedback or Next to this node.

12. **Create Booking Agent node**:  
    - Type: LangChain Agent  
    - Connect input from Edit Fields node.  
    - Configure AI models (OpenAI Chat Model1, Google Gemini Chat Model3) and Structured Output Parser1.  
    - Connect with Simple Memory1 for memory context.  
    - Connect to Booking Tool node as AI tool.

13. **Create Simple Memory1 node (Booking)**:  
    - Like Simple Memory for Planning, but linked to Booking Agent.

14. **Create Structured Output Parser1 node**:  
    - Parses AI output from Booking Agent’s language models.

15. **Create Booking Tool node**:  
    - Type: MCP Client Tool  
    - Connect input from Edit Fields node.  
    - Connect output to Booking Agent as AI tool result.

16. **Create Success/Fail Booking switch**:  
    - Routes based on booking success or failure from Booking Agent.  
    - Outputs to Edit Fields1 or Switch node.

17. **Create Edit Fields1 node (for Mail and Sheet Entry)**:  
    - Prepares data fields for mail and sheet entry.  
    - Input from Success/Fail Booking switch.

18. **Create Mail and Sheet Entry agent node**:  
    - LangChain Agent managing data logging and email notifications.  
    - Connect input from Edit Fields1, OpenAI Chat Model2.  
    - Link AI tools: Append or update row in Google Sheets, Send a message in Gmail.

19. **Create Append or update row in Google Sheets node**:  
    - Configure with Google Sheets OAuth2 credentials and target sheet.  
    - Connect input from Mail and Sheet Entry agent as AI tool.

20. **Create Send a message in Gmail node**:  
    - Configure Gmail OAuth2 credentials.  
    - Connect input from Mail and Sheet Entry agent as AI tool.

21. **Create Switch App node**:  
    - Routes output from Mail and Sheet Entry to either Respond to Webhook1 or Send a text message1.

22. **Create Respond to Webhook1 and Send a text message1 nodes**:  
    - Respond to Webhook1: HTTP response for webhook clients.  
    - Send a text message1: Telegram message for app clients.

23. **Create Switch node (post Booking Agent)**:  
    - Routes to Respond to Webhook2 or Send a text message2 based on booking outcome.

24. **Create Respond to Webhook2 and Send a text message2 nodes**:  
    - Sends final responses via webhook or Telegram.

25. **Create Google Calendar nodes**:  
    - create_event, delete_event1, update_calendar, validate_availability_event, check_availability_to_create, get_event_in_time_gap.  
    - Configure with Google Calendar OAuth2 credentials.  
    - Connect based on booking operation flow.

26. **Create If node (booking validation)**:  
    - Conditional to proceed with event creation or stop with error.

27. **Create Stop and Error node**:  
    - Ends workflow with error on booking failure.

28. **Create Tool Workflow nodes**:  
    - validate_busy_time, create_new_event, delete_event, update_event, get_events_in_gap_time.  
    - Each configured as sub-workflows triggered by MCP Server Trigger.

29. **Create MCP Server Trigger node**:  
    - Triggers tool workflows and manages AI tool communication.

30. **Create When Executed by Another Workflow node**:  
    - Entry point when this workflow is invoked as a sub-workflow.

31. **Create map_data node**:  
    - Prepares and maps inputs for operation routing.

32. **Create Operation switch node**:  
    - Routes to specific tool workflows based on requested operation.

33. **Connect all nodes according to logical flow**:  
    - Input triggers → Planning Agent → Feedback or Next → Edit Fields → Booking Agent → Success/Fail Booking → Mail and Sheet Entry → Notifications → Responses.

34. **Set credentials for all services**:  
    - Telegram Bot API credentials.  
    - Google OAuth2 for Calendar and Sheets.  
    - Gmail OAuth2 credentials.  
    - OpenAI API key and Google Gemini API key.

35. **Test workflow end-to-end**:  
    - Trigger via Telegram and webhook inputs.  
    - Verify AI responses, booking creation, calendar updates, record logging, and notifications.

---

### 5. General Notes & Resources

| Note Content                                                                                                                        | Context or Link                                                                                                        |
|------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------|
| The workflow uses advanced LangChain AI agents integrating OpenAI and Google Gemini models to interpret and manage complex dialogs. | AI model integration details are key for conversational accuracy.                                                     |
| Google OAuth2 credentials with calendar and sheets scopes are mandatory for calendar event management and data logging.            | Ensure correct OAuth scopes for Google APIs: calendar.events and spreadsheets.                                         |
| Telegram bot must be properly registered with webhook URLs configured to connect with n8n telegram trigger nodes.                 | Telegram Bot API documentation: https://core.telegram.org/bots/api                                                      |
| MCP Server Trigger and Tool Workflows enable modular sub-workflow execution for calendar event operations.                         | Allows scalability and modular workflow design.                                                                        |
| Gmail OAuth2 credentials are required for sending email notifications; users should verify sending quotas and permissions.          | Gmail API documentation: https://developers.google.com/gmail/api                                                      |

---

**Disclaimer:** This document was generated exclusively from an automated n8n workflow. It complies fully with content policies and contains no illegal, offensive, or protected elements. All processed data are legal and publicly accessible.