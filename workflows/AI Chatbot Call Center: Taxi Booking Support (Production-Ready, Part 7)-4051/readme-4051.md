AI Chatbot Call Center: Taxi Booking Support (Production-Ready, Part 7)

https://n8nworkflows.xyz/workflows/ai-chatbot-call-center--taxi-booking-support--production-ready--part-7--4051


# AI Chatbot Call Center: Taxi Booking Support (Production-Ready, Part 7)

### 1. Workflow Overview

This workflow, named **🫶 Taxi Booking Support**, is a production-ready background process designed to automate after-sales support for a taxi booking system. Its primary purpose is to periodically check for taxi bookings that remain in an incomplete or pending state (OPEN or HOLD) beyond a specified time threshold and then take appropriate actions such as canceling expired bookings, deleting associated calendar events, and notifying users via AI-generated multi-language messages.

The workflow is logically divided into the following blocks:

- **1.1 Schedule Trigger & Data Retrieval:** Periodically triggers the workflow and queries the database for OPEN or HOLD bookings exceeding defined time limits.
- **1.2 Booking Status Evaluation & AI Response:** Uses AI to generate user-friendly multi-language responses based on booking status.
- **1.3 Expired Booking Handling:** Checks bookings for expiration (OPEN or HOLD), updates statuses, deletes calendar events, and triggers callback workflows.
- **1.4 Sub-Workflow Execution:** Invokes a callback workflow for further processing or user contact.

---

### 2. Block-by-Block Analysis

#### 2.1 Schedule Trigger & Data Retrieval

- **Overview:**  
  This block initiates the workflow every 5 minutes to retrieve bookings with OPEN or HOLD status that have exceeded their allowed time thresholds.

- **Nodes Involved:**  
  - Schedule Trigger  
  - Open Hold Booking  
  - Booking

- **Node Details:**  

  - **Schedule Trigger**  
    - Type: Trigger (Schedule Trigger)  
    - Role: Starts the workflow every 5 minutes on a fixed schedule.  
    - Configuration: Runs with default 5-minute interval; no additional parameters required.  
    - Inputs: None (trigger node)  
    - Outputs: Connects to `Open Hold Booking` node  
    - Edge Cases: If n8n service is down or paused, scheduled trigger won't fire; no built-in retry.  
    - Notes: Sticky note indicates "Every 5m" for clarity.

  - **Open Hold Booking**  
    - Type: PostgreSQL node  
    - Role: Queries the database to fetch bookings with OPEN or HOLD status that have been open for more than 5 minutes (based on TTL).  
    - Configuration: Uses PostgreSQL credentials; executes a SQL SELECT query filtering by booking status and timestamp.  
    - Inputs: Triggered by Schedule Trigger node output  
    - Outputs: Passes booking data to the `Booking` node  
    - Edge Cases: Database connection failures, query timeouts, malformed SQL  
    - Notes: Sticky note indicates "> 5m" TTL to specify the age condition on bookings.

  - **Booking**  
    - Type: Set node  
    - Role: Prepares or formats booking data for downstream processing, possibly setting variables or fields for AI consumption.  
    - Configuration: Likely sets fields or expressions based on the retrieved booking data (exact expressions not specified).  
    - Inputs: Data from `Open Hold Booking`  
    - Outputs: Connects to `AI Agent` node  
    - Edge Cases: Data inconsistencies or empty data sets leading to AI node receiving no input.

---

#### 2.2 Booking Status Evaluation & AI Response

- **Overview:**  
  This block uses AI to generate context-aware, multi-language messages based on the current booking status, enabling personalized user communication.

- **Nodes Involved:**  
  - AI Agent  
  - xAI @grok-2-1212  
  - Status Switch

- **Node Details:**  

  - **xAI @grok-2-1212**  
    - Type: AI Language Model (LangChain LM Chat node)  
    - Role: Acts as the language model backend for the AI Agent node.  
    - Configuration: Connected as the language model provider for `AI Agent`. Requires credentials for the AI provider (likely OpenAI or API key for Grok).  
    - Inputs: Receives prompt and context from `AI Agent`  
    - Outputs: Generates AI responses passed back to `AI Agent`  
    - Edge Cases: API quota limits, network errors, invalid prompts.

  - **AI Agent**  
    - Type: AI Agent (LangChain Agent node)  
    - Role: Orchestrates AI prompt construction and interprets booking data to create multi-language user messages.  
    - Configuration: Connected to `xAI @grok-2-1212` as backend language model. No parameters specified, but likely uses expressions referencing booking data.  
    - Inputs: Receives booking data from `Booking` node, sends language model queries to `xAI @grok-2-1212`.  
    - Outputs: Sends processed messages to `Status Switch` for further branching.  
    - Edge Cases: Expression evaluation errors, malformed input data, AI API failures.

  - **Status Switch**  
    - Type: Switch node  
    - Role: Routes workflow logic based on booking status returned from AI or booking data (e.g., OPEN or HOLD).  
    - Configuration: Switch conditions likely based on booking status fields or AI-generated flags.  
    - Inputs: AI-generated data from `AI Agent`  
    - Outputs: Routes to either `If Open Expired` or `If Hold Expired` nodes.  
    - Edge Cases: Missing or unexpected status values causing no route to match.

---

#### 2.3 Expired Booking Handling

- **Overview:**  
  This block evaluates if bookings have expired based on time-to-live (TTL) conditions, updates booking statuses, deletes calendar events, and initiates user callback workflows.

- **Nodes Involved:**  
  - If Open Expired  
  - If Hold Expired  
  - Set Cancel Booking  
  - Delete Event  
  - Call Back

- **Node Details:**  

  - **If Open Expired**  
    - Type: If node  
    - Role: Checks if an OPEN booking has expired (TTL 10 minutes).  
    - Configuration: Condition compares booking timestamp with current time minus 10 minutes.  
    - Inputs: From `Status Switch`  
    - Outputs: On true, connects to `Set Cancel Booking` and `Call Back`. On false, ends flow.  
    - Edge Cases: Timezone mismatches, missing timestamp data.  
    - Notes: Sticky note "TTL 10m" indicates time threshold.

  - **If Hold Expired**  
    - Type: If node  
    - Role: Checks if a HOLD booking has expired (TTL 5 minutes).  
    - Configuration: Condition compares booking timestamp with current time minus 5 minutes.  
    - Inputs: From `Status Switch`  
    - Outputs: Currently no downstream nodes connected (empty array), meaning no action configured yet.  
    - Edge Cases: Similar to `If Open Expired`.  
    - Notes: Sticky note "TTL 5m".

  - **Set Cancel Booking**  
    - Type: PostgreSQL node  
    - Role: Updates the booking status in the database from OPEN to CANCELLED for expired bookings.  
    - Configuration: Uses PostgreSQL credentials; executes an UPDATE SQL statement.  
    - Inputs: From `If Open Expired` (true branch)  
    - Outputs: Connects to `Delete Event` node  
    - Edge Cases: Database write failures, transaction conflicts, invalid booking IDs.

  - **Delete Event**  
    - Type: Google Calendar node  
    - Role: Deletes the Google Calendar event associated with the cancelled booking to free up calendar space and avoid confusion.  
    - Configuration: Uses Google Calendar credentials; calendar selected (e.g., DEMO calendar).  
    - Inputs: From `Set Cancel Booking`  
    - Outputs: None (terminal node)  
    - Edge Cases: Authentication errors, event not found, API rate limits.

  - **Call Back**  
    - Type: Execute Workflow (Sub-Workflow) node  
    - Role: Triggers a sub-workflow named "Demo Call Back" to handle user callbacks or further processing after booking cancellation.  
    - Configuration: Requires connection to the sub-workflow and passes booking data as parameters.  
    - Inputs: From `If Open Expired` (true branch)  
    - Outputs: None (terminal node)  
    - Edge Cases: Sub-workflow not found, execution failures, parameter mismatches.  
    - Notes: Sticky note "Demo Call Back" provides reference to the sub-workflow used.

---

### 3. Summary Table

| Node Name           | Node Type                    | Functional Role                          | Input Node(s)          | Output Node(s)       | Sticky Note                                    |
|---------------------|------------------------------|----------------------------------------|-----------------------|----------------------|------------------------------------------------|
| Schedule Trigger     | Schedule Trigger             | Periodic trigger every 5 minutes       | None                  | Open Hold Booking     | Every 5m                                       |
| Open Hold Booking    | PostgreSQL                  | Query OPEN or HOLD bookings > 5 minutes| Schedule Trigger      | Booking              | > 5m                                           |
| Booking             | Set                         | Format booking data                     | Open Hold Booking      | AI Agent             |                                                |
| xAI @grok-2-1212    | LangChain LM Chat           | AI language model backend               | AI Agent (ai model)    | AI Agent             |                                                |
| AI Agent            | LangChain Agent             | Generate multi-language AI responses   | Booking                | Status Switch        |                                                |
| Status Switch       | Switch                      | Route based on booking status          | AI Agent               | If Open Expired, If Hold Expired |                                          |
| If Open Expired     | If                          | Check OPEN booking expiration (10m TTL)| Status Switch          | Set Cancel Booking, Call Back | TTL 10m                                  |
| If Hold Expired     | If                          | Check HOLD booking expiration (5m TTL) | Status Switch          | None (no downstream) | TTL 5m                                         |
| Set Cancel Booking  | PostgreSQL                  | Update booking status to CANCELLED     | If Open Expired        | Delete Event          |                                                |
| Delete Event        | Google Calendar             | Delete calendar event for cancelled booking | Set Cancel Booking | None                 |                                                |
| Call Back           | Execute Workflow (Sub-workflow) | Execute callback sub-workflow          | If Open Expired        | None                 | Demo Call Back                                 |
| Sticky Note         | Sticky Note                 | Visual annotation                      | None                   | None                 | (Empty content)                                |
| Sticky Note1        | Sticky Note                 | Visual annotation                      | None                   | None                 | (Empty content)                                |
| Sticky Note2        | Sticky Note                 | Visual annotation                      | None                   | None                 | (Empty content)                                |
| Sticky Note3        | Sticky Note                 | Visual annotation                      | None                   | None                 | (Empty content)                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Schedule Trigger node**  
   - Type: Schedule Trigger  
   - Configuration: Set to trigger every 5 minutes (default).  
   - No credentials required.

2. **Create the Open Hold Booking node**  
   - Type: PostgreSQL  
   - Credentials: Set up PostgreSQL credentials with access to the booking database.  
   - Parameters: Write a SQL query to select bookings with status OPEN or HOLD that have timestamps older than 5 minutes. Example:  
     ```sql
     SELECT * FROM bookings WHERE status IN ('OPEN', 'HOLD') AND updated_at < NOW() - INTERVAL '5 minutes';
     ```  
   - Connect Schedule Trigger output to this node.

3. **Create the Booking node**  
   - Type: Set node  
   - Purpose: Format or map fields from the query result to expected input for AI processing. Configure fields as needed based on database schema (e.g., booking ID, status, language).  
   - Connect output from Open Hold Booking node.

4. **Create the xAI @grok-2-1212 node**  
   - Type: LangChain LM Chat node  
   - Credentials: Configure AI provider credentials (e.g., OpenAI API key or Grok credentials).  
   - No additional parameters needed for basic setup.  
   - This node will be connected as the language model for the AI Agent.

5. **Create the AI Agent node**  
   - Type: LangChain Agent node  
   - Connect its AI language model input to the xAI @grok-2-1212 node.  
   - Configure prompt templates or expressions if needed to generate multi-language responses based on booking data (language field).  
   - Connect the Booking node output to AI Agent input.

6. **Create the Status Switch node**  
   - Type: Switch node  
   - Configure conditions to route based on booking status or AI agent output, e.g.:  
     - Case 1: If status = "OPEN" → Output 1  
     - Case 2: If status = "HOLD" → Output 2  
   - Connect AI Agent node output to Status Switch.

7. **Create the If Open Expired node**  
   - Type: If node  
   - Condition: Check if the booking's last update timestamp is older than 10 minutes (TTL 10m).  
   - Connect Status Switch output for OPEN bookings to this node.

8. **Create the If Hold Expired node**  
   - Type: If node  
   - Condition: Check if the booking timestamp is older than 5 minutes (TTL 5m).  
   - Connect Status Switch output for HOLD bookings to this node.

9. **Create the Set Cancel Booking node**  
   - Type: PostgreSQL node  
   - Credentials: Use the same PostgreSQL credentials.  
   - SQL: Update booking status from OPEN to CANCELLED for the expired booking. Example:  
     ```sql
     UPDATE bookings SET status = 'CANCELLED' WHERE booking_id = :booking_id;
     ```  
   - Connect If Open Expired node (true output) to this node.

10. **Create the Delete Event node**  
    - Type: Google Calendar node  
    - Credentials: Set up Google Calendar credentials with appropriate calendar access (e.g., DEMO calendar).  
    - Configure to delete event by event ID linked to the booking.  
    - Connect Set Cancel Booking output to Delete Event node.

11. **Create the Call Back node**  
    - Type: Execute Workflow node  
    - Parameters: Select the sub-workflow "Demo Call Back" or an equivalent customized one.  
    - Configure input parameters to pass booking data as needed.  
    - Connect If Open Expired node (true output) also to this node.

12. **Finalize connections:**  
    - Schedule Trigger → Open Hold Booking → Booking → AI Agent → Status Switch →  
      - OPEN → If Open Expired → (true) → Set Cancel Booking → Delete Event  
                                  → (true) → Call Back  
      - HOLD → If Hold Expired → (currently no further nodes)

13. **Activate credentials:**  
    - PostgreSQL credentials for database operations.  
    - Google Calendar credentials for event deletion.  
    - AI provider credentials for `xAI @grok-2-1212`.

14. **Activate the workflow:**  
    - Ensure the workflow is activated for the schedule trigger to run.

---

### 5. General Notes & Resources

| Note Content                                                                 | Context or Link                                                                                                          |
|------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------|
| The workflow is designed for n8n version 1.90.2, ensure compatibility.       | n8n version info from workflow metadata.                                                                                 |
| SQL scripts required for the booking database setup are available on GitHub. | [Github repository](https://github.com/ChatPayLabs/n8n-chatbot-core)                                                    |
| PostgreSQL credential setup guide:                                          | [n8n PostgreSQL integration documentation](https://docs.n8n.io/integrations/builtin/credentials/slack/?utm_source=n8n_app&utm_medium=credential_settings&utm_campaign=create_new_credentials_modal) |
| Google Calendar credential setup guide:                                     | [n8n Google Calendar documentation](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.googlecalendar/?utm_source=n8n_app&utm_medium=node_settings_modal-credential_link&utm_campaign=n8n-nodes-base.googleCalendar) |
| Workflow uses a scalable design suitable for n8n queue mode in production.   | See workflow description for production features.                                                                        |
| The sub-workflow "Demo Call Back" can be replaced with a custom callback flow.| Customization option for specific business logic.                                                                        |

---

**Disclaimer:**  
The text provided is exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected material. All processed data are legal and public.