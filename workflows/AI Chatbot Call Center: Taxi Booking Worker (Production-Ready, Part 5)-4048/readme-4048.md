AI Chatbot Call Center: Taxi Booking Worker (Production-Ready, Part 5)

https://n8nworkflows.xyz/workflows/ai-chatbot-call-center--taxi-booking-worker--production-ready--part-5--4048


# AI Chatbot Call Center: Taxi Booking Worker (Production-Ready, Part 5)

### 1. Workflow Overview

This workflow, titled **"AI Chatbot Call Center: Taxi Booking Worker (Production-Ready, Part 5)"**, is designed to automate taxi booking management within a call center environment. It integrates an AI-powered chatbot interface to handle user inputs, manage booking data, reset session states, and synchronize bookings with Google Calendar. The workflow is structured to handle multiple languages, session resets, and error scenarios effectively.

The logical structure is divided into these principal blocks:

- **1.1 Input Reception & Triggering:** Captures user input via webhook triggers and sets initial data.
- **1.2 Booking Validation & Conditional Routing:** Checks booking existence and directs flow accordingly.
- **1.3 Booking Management & Database Operations:** Inserts or updates booking data in PostgreSQL, manages user memory, and handles Redis session data.
- **1.4 Session Reset & Cleanup:** Clears cached Redis data related to the session and resets state with TTL.
- **1.5 Calendar Synchronization:** Creates Google Calendar events and synchronizes booking data.
- **1.6 Multilingual Response Handling:** Selects language-specific responses before callback execution.
- **1.7 Error and Cancellation Handling:** Provides error output and cancellation messaging.

---

### 2. Block-by-Block Analysis

---

#### 2.1 Input Reception & Triggering

**Overview:**  
This block captures incoming chatbot requests either via a webhook or a workflow trigger and prepares the initial input data for processing.

**Nodes Involved:**  
- Flow Trigger  
- Test Trigger  
- Input  
- Test Fields

**Node Details:**

- **Flow Trigger**  
  - *Type:* Execute Workflow Trigger  
  - *Role:* Entry point to start workflow execution on demand.  
  - *Configuration:* Basic trigger with no parameters; version 1.1.  
  - *Connections:* Outputs to "Input" node.  
  - *Notes:* Allows manual or programmatic triggering.

- **Test Trigger**  
  - *Type:* LangChain Chat Trigger  
  - *Role:* Webhook entry point for chatbot conversation initiation.  
  - *Configuration:* Uses webhook ID `43be72d3-74d8-4e20-8749-ecb60cf54774`; version 1.1.  
  - *Connections:* Outputs to "Test Fields".  
  - *Edge Cases:* Webhook authentication or connectivity failures.

- **Input**  
  - *Type:* Set  
  - *Role:* Prepares and sets initial variables or data for the workflow.  
  - *Configuration:* No explicit parameters; defaults to pass-through or initial data setup; version 3.4.  
  - *Connections:* Receives from "Flow Trigger", outputs to "If Not Zero".

- **Test Fields**  
  - *Type:* Set  
  - *Role:* Sets test-specific fields or variables for debugging/simulation.  
  - *Configuration:* Empty parameters; version 3.4.  
  - *Connections:* Receives from "Test Trigger", outputs to "Input".  

---

#### 2.2 Booking Validation & Conditional Routing

**Overview:**  
Determines whether a booking exists or not based on query results and routes the workflow accordingly.

**Nodes Involved:**  
- If Not Zero  
- Wait Output  
- Booking  
- If Booking  
- Error Output

**Node Details:**

- **If Not Zero**  
  - *Type:* If  
  - *Role:* Checks if booking count or status is non-zero, i.e., booking exists.  
  - *Configuration:* Condition likely based on booking query output, version 2.2.  
  - *Connections:*  
    - True path to "Wait Output" -> "Booking" nodes.  
    - False path to "Reset Session 2".  
  - *Edge Cases:* Expression failures if booking data missing.

- **Wait Output**  
  - *Type:* Set  
  - *Role:* Sets response message "Please wait" for the user.  
  - *Connections:* Outputs to "Wait Call Back".  
  - *Notes:* Used to notify user during processing.

- **Booking**  
  - *Type:* PostgreSQL  
  - *Role:* Queries booking data with status "NEW".  
  - *Configuration:* Connects to PostgreSQL database, executes once per run, continues on error, outputs data always.  
  - *Connections:* Outputs to "If Booking".  
  - *Edge Cases:* DB connection failures, query errors.

- **If Booking**  
  - *Type:* If  
  - *Role:* Checks if a valid booking record exists.  
  - *Connections:*  
    - True path to "Set Open Booking".  
    - False path to "Error Output".  
  - *Edge Cases:* Misinterpretation of booking data.

- **Error Output**  
  - *Type:* Set  
  - *Role:* Sets error message "Booking not found. Please retry."  
  - *Connections:* Outputs to "Call Back".  
  - *Notes:* Provides user feedback on booking failure.

---

#### 2.3 Booking Management & Database Operations

**Overview:**  
Manages booking data persistence, user memory saving, and Redis cache cleanup.

**Nodes Involved:**  
- Set Open Booking  
- Save User Memory  
- Delete Provider Number  
- Delete Route Data  
- Reset Session  
- Reset Session 2

**Node Details:**

- **Set Open Booking**  
  - *Type:* PostgreSQL  
  - *Role:* Inserts or updates open booking information in the database.  
  - *Configuration:* Executes once; version 2.6.  
  - *Connections:* Outputs to "Reset Session", "Save User Memory", and "Create Event".  
  - *Edge Cases:* DB failures, data integrity issues.

- **Save User Memory**  
  - *Type:* PostgreSQL  
  - *Role:* Saves conversational context or user data for session continuity.  
  - *Configuration:* Executes once; continues on error; version 2.6.  
  - *Connections:* Receives from "Reset Session".  
  - *Edge Cases:* DB write errors.

- **Delete Provider Number**  
  - *Type:* Redis  
  - *Role:* Deletes cached provider phone number keyed by session.  
  - *Configuration:* No explicit parameters; continues on error; version 1.  
  - *Connections:* Part of "Reset Session" and "Reset Session 2" cleanup.  
  - *Notes:* Prevents stale provider info reuse.

- **Delete Route Data**  
  - *Type:* Redis  
  - *Role:* Deletes cached route data using key pattern `{session_id}:{channel_no}:route`.  
  - *Configuration:* Continues on error; version 1.  
  - *Connections:* Part of session reset cleanup.  
  - *Notes:* Clears cached routing info after booking finalization.

- **Reset Session**  
  - *Type:* Redis  
  - *Role:* Manages session TTL of 5 minutes and triggers cache cleanup.  
  - *Configuration:* TTL 5m; continues on error; version 1; does not always output data.  
  - *Connections:* Outputs to "Delete Provider Number", "Delete Route Data", and "Switch".  

- **Reset Session 2**  
  - *Type:* Redis  
  - *Role:* Similar to Reset Session but triggered on no booking existence.  
  - *Configuration:* TTL 5m; continues on error; version 1.  
  - *Connections:* Outputs to "Cancel Output", "Delete Provider Number", and "Delete Route Data".  

---

#### 2.4 Calendar Synchronization

**Overview:**  
Generates calendar events from bookings and synchronizes booking data with Google Calendar.

**Nodes Involved:**  
- Create Event  
- Sync Booking Google Cal

**Node Details:**

- **Create Event**  
  - *Type:* Google Calendar  
  - *Role:* Creates a calendar event representing the taxi booking.  
  - *Configuration:* Uses Google Calendar credentials; tagged as "DEMO"; version 1.3.  
  - *Connections:* Outputs to "Sync Booking Google Cal".  
  - *Edge Cases:* API auth errors, rate limits.

- **Sync Booking Google Cal**  
  - *Type:* PostgreSQL  
  - *Role:* Updates booking data to reflect synchronization status with Google Calendar.  
  - *Configuration:* Executes once; version 2.6.  
  - *Connections:* Receives from "Create Event".  
  - *Edge Cases:* Database update failures.

---

#### 2.5 Multilingual Response Handling

**Overview:**  
Selects the appropriate language response based on user preference or session data.

**Nodes Involved:**  
- Switch  
- English  
- Chinese  
- Japanese  
- Call Back

**Node Details:**

- **Switch**  
  - *Type:* Switch  
  - *Role:* Routes flow based on language choice or other criteria.  
  - *Configuration:* Multiple outputs, routing to language nodes; version 3.2.  
  - *Connections:* Outputs to "Chinese", "Japanese", "English".

- **English**  
  - *Type:* Set  
  - *Role:* Sets message "Reservation is completed." in English.  
  - *Connections:* Outputs to "Call Back".  
  - *Notes:* Provides localized confirmation.

- **Chinese**  
  - *Type:* Set  
  - *Role:* Sets message "預約完成。" in Chinese.  
  - *Connections:* Outputs to "Call Back".  

- **Japanese**  
  - *Type:* Set  
  - *Role:* Sets message "予約が完了いたしました。" in Japanese.  
  - *Connections:* Outputs to "Call Back".  

- **Call Back**  
  - *Type:* Execute Workflow  
  - *Role:* Handles outbound response or callback logic to inform users.  
  - *Configuration:* Invokes a sub-workflow for callback handling ("Demo Call Back").  
  - *Edge Cases:* Sub-workflow failures or communication errors.

---

#### 2.6 Error and Cancellation Handling

**Overview:**  
Manages messaging for booking errors and cancellations.

**Nodes Involved:**  
- Cancel Output  
- Error Output

**Node Details:**

- **Cancel Output**  
  - *Type:* Set  
  - *Role:* Sets cancellation message "Cancelled".  
  - *Connections:* Outputs to "Call Back".  
  - *Notes:* Provides user feedback on cancellation.

- **Error Output**  
  - *Type:* Set  
  - *Role:* Sets error message "Booking not found. Please retry."  
  - *Connections:* Outputs to "Call Back".  

---

### 3. Summary Table

| Node Name           | Node Type               | Functional Role                            | Input Node(s)             | Output Node(s)               | Sticky Note                                                                 |
|---------------------|-------------------------|--------------------------------------------|---------------------------|-----------------------------|-----------------------------------------------------------------------------|
| Flow Trigger        | Execute Workflow Trigger| Workflow start trigger                      | —                         | Input                       |                                                                             |
| Test Trigger        | LangChain Chat Trigger  | Chatbot webhook trigger                     | —                         | Test Fields                 |                                                                             |
| Input               | Set                     | Initial data setup                          | Flow Trigger, Test Fields  | If Not Zero                 |                                                                             |
| Test Fields         | Set                     | Test data preparation                       | Test Trigger              | Input                       |                                                                             |
| If Not Zero         | If                      | Check booking existence                     | Input                      | Wait Output, Reset Session 2|                                                                             |
| Wait Output         | Set                     | Sets "Please wait" message                  | If Not Zero                | Wait Call Back              |                                                                             |
| Wait Call Back      | Execute Workflow         | Handles callback during wait                | Wait Output                | —                           | Demo Call Back NO WAIT                                                       |
| Booking             | PostgreSQL              | Queries booking with status NEW             | Wait Output                | If Booking                  | Status NEW                                                                  |
| If Booking          | If                      | Checks if booking data is valid              | Booking                    | Set Open Booking, Error Output|                                                                             |
| Set Open Booking    | PostgreSQL              | Inserts/updates booking data                  | If Booking                 | Reset Session, Save User Memory, Create Event|                                                                             |
| Save User Memory    | PostgreSQL              | Saves user session memory                      | Reset Session              | —                           |                                                                             |
| Delete Provider Number| Redis                  | Deletes cached provider number                | Reset Session, Reset Session 2 | —                         |                                                                             |
| Delete Route Data   | Redis                   | Deletes cached route data                      | Reset Session, Reset Session 2 | —                         | Key pattern "{session_id}:{channel_no}:route"                               |
| Reset Session       | Redis                   | Resets session with TTL and clears cache     | Set Open Booking           | Delete Provider Number, Delete Route Data, Switch| TTL 5m                                                                   |
| Reset Session 2     | Redis                   | Session reset on no booking found             | If Not Zero (false path)   | Cancel Output, Delete Provider Number, Delete Route Data| TTL 5m                                                         |
| Cancel Output       | Set                     | Sets cancellation message "Cancelled"         | Reset Session 2            | Call Back                   |                                                                             |
| Switch              | Switch                  | Routes flow by language                        | Reset Session              | Chinese, Japanese, English  |                                                                             |
| English             | Set                     | English confirmation message                   | Switch                     | Call Back                   | "Reservation is completed."                                                 |
| Chinese             | Set                     | Chinese confirmation message                   | Switch                     | Call Back                   | "預約完成。"                                                                |
| Japanese            | Set                     | Japanese confirmation message                  | Switch                     | Call Back                   | "予約が完了いたしました。"                                                  |
| Call Back           | Execute Workflow         | Sends response back to user                    | English, Chinese, Japanese, Cancel Output, Error Output| —         | Demo Call Back                                                              |
| Create Event        | Google Calendar         | Creates calendar event for booking             | Set Open Booking           | Sync Booking Google Cal      | DEMO                                                                        |
| Sync Booking Google Cal| PostgreSQL            | Updates booking to reflect calendar sync       | Create Event               | —                           |                                                                             |
| Error Output        | Set                     | Sets error message "Booking not found"          | If Booking (false path)    | Call Back                   | "Booking not found. Please retry."                                          |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Nodes:**
   - Add **Flow Trigger** (Execute Workflow Trigger, version 1.1). No parameters needed.
   - Add **Test Trigger** (LangChain Chat Trigger, version 1.1), configure webhook with ID `43be72d3-74d8-4e20-8749-ecb60cf54774`.

2. **Create Input Preparation Nodes:**
   - Add **Input** (Set node, version 3.4), no parameters.
   - Add **Test Fields** (Set node, version 3.4), no parameters.

3. **Connect Triggers to Input:**
   - Connect Flow Trigger -> Input.
   - Connect Test Trigger -> Test Fields -> Input.

4. **Add Booking Existence Check:**
   - Add **If Not Zero** (If node, version 2.2).
   - Configure condition to check if booking count/status from input data is non-zero.
   - Connect Input -> If Not Zero.

5. **Add Wait Messaging Nodes:**
   - Add **Wait Output** (Set node, version 3.4), set message "Please wait".
   - Add **Wait Call Back** (Execute Workflow, version 1.2), configure to call the "Demo Call Back NO WAIT" sub-workflow.
   - Connect If Not Zero (true) -> Wait Output -> Wait Call Back.

6. **Add Booking Query Node:**
   - Add **Booking** (PostgreSQL node, version 2.6).
   - Configure to query bookings with status "NEW".
   - Set "Execute Once" to true, "Continue on Fail" enabled, "Always Output Data" enabled.
   - Connect Wait Output -> Booking.

7. **Add Booking Validation:**
   - Add **If Booking** (If node, version 2.2).
   - Condition checks if booking record exists.
   - Connect Booking -> If Booking.

8. **Add Booking Handling Nodes:**
   - Add **Set Open Booking** (PostgreSQL node, version 2.6), inserts or updates booking.
   - Connect If Booking (true) -> Set Open Booking.

9. **Add Session Reset and Cleanup:**
   - Add **Reset Session** (Redis node, version 1).
   - Configure TTL 5 minutes, continue on error, execute multiple outputs.
   - Connect Set Open Booking -> Reset Session.

10. **Add Cache Cleanup Nodes:**
    - Add **Delete Provider Number** (Redis node, version 1).
    - Add **Delete Route Data** (Redis node, version 1), key pattern `{session_id}:{channel_no}:route`.
    - Connect Reset Session -> Delete Provider Number and Delete Route Data.

11. **Add User Memory Save:**
    - Add **Save User Memory** (PostgreSQL node, version 2.6).
    - Configure to save session or user context.
    - Connect Reset Session -> Save User Memory.

12. **Add Google Calendar Integration:**
    - Add **Create Event** (Google Calendar node, version 1.3).
    - Configure with appropriate Google Calendar credentials.
    - Connect Set Open Booking -> Create Event.

13. **Add Booking Sync Node:**
    - Add **Sync Booking Google Cal** (PostgreSQL node, version 2.6).
    - Updates booking record to reflect calendar sync.
    - Connect Create Event -> Sync Booking Google Cal.

14. **Add Session Reset 2 for No Booking:**
    - Add **Reset Session 2** (Redis node, version 1).
    - TTL 5 minutes, continue on error.
    - Connect If Not Zero (false) -> Reset Session 2.

15. **Add Cancel Output:**
    - Add **Cancel Output** (Set node, version 3.4).
    - Set message "Cancelled".
    - Connect Reset Session 2 -> Cancel Output.

16. **Add Error Output:**
    - Add **Error Output** (Set node, version 3.4).
    - Set message "Booking not found. Please retry."
    - Connect If Booking (false) -> Error Output.

17. **Add Language Routing:**
    - Add **Switch** (Switch node, version 3.2).
    - Configure switch to route based on language selection or session variable.

18. **Add Language Message Nodes:**
    - Add **English** (Set node), message "Reservation is completed."
    - Add **Chinese** (Set node), message "預約完成。"
    - Add **Japanese** (Set node), message "予約が完了いたしました。"
    - Connect Switch outputs to respective language nodes.

19. **Add Call Back Execution Nodes:**
    - Add **Call Back** (Execute Workflow node, version 1.2).
    - Configure to invoke "Demo Call Back" sub-workflow.
    - Connect English, Chinese, Japanese, Cancel Output, and Error Output to Call Back.

20. **Credentials Setup:**
    - Configure PostgreSQL credentials for all PostgreSQL nodes.
    - Configure Redis credentials for Redis nodes.
    - Configure Google Calendar OAuth2 credentials for calendar nodes.
    - Configure LangChain credentials for Test Trigger if required.

21. **Validation and Testing:**
    - Validate all node parameters and connections.
    - Test trigger inputs and simulate bookings.
    - Verify calendar event creation and session resets.

---

### 5. General Notes & Resources

| Note Content                                                                              | Context or Link                                                      |
|-------------------------------------------------------------------------------------------|--------------------------------------------------------------------|
| The Redis cache keys use patterns involving `{session_id}:{channel_no}:route` for routing. | Redis key management for session-specific data cleanup.            |
| Google Calendar integration is marked as "DEMO" indicating test or sandbox usage.         | Google Calendar node may require configuration for production use. |
| The workflow is part of a multi-part series: "Part 5" of a production-ready taxi booking worker. | Suggests dependency or modular design with other workflow parts.   |
| Sub-workflow "Demo Call Back" handles all outbound communication back to users.           | Sub-workflow must be implemented separately and configured properly.|
| LangChain Chat Trigger is used for chatbot AI integration.                                | Requires LangChain or OpenAI credentials setup.                     |

---

**Disclaimer:** The provided text is extracted solely from an automated workflow created with n8n, a tool for integration and automation. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All manipulated data is legal and public.