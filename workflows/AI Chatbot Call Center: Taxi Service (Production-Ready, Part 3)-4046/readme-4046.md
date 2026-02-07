AI Chatbot Call Center: Taxi Service (Production-Ready, Part 3)

https://n8nworkflows.xyz/workflows/ai-chatbot-call-center--taxi-service--production-ready--part-3--4046


# AI Chatbot Call Center: Taxi Service (Production-Ready, Part 3)

---
### 1. Workflow Overview

This workflow, titled **"🛎️ Taxi Service"**, is a production-ready core component for a Taxi Service chatbot integrated with a call center. It is designed to handle incoming taxi service requests, validate service availability, manage session and route data caching, invoke AI for fare estimation, calculate route distances via Google Maps API, and distribute the requests to multiple taxi service providers for fare estimation.

**Target use cases:**  
- Taxi service call centers handling customer queries and service requests via chat or call.  
- Scalable taxi fare estimation workflows integrating AI and external APIs with caching and database-backed service data.  
- Multilingual chatbot interactions with error management and session control.

**Logical blocks:**  
- **1.1 Input Reception & Triggering:** Receives messages from Call Center or other workflows.  
- **1.2 Service Validation & Caching:** Checks service availability from Redis cache or PostgreSQL database, caches results, and handles inactive or missing services.  
- **1.3 Session & Route Data Management:** Resets session cache, deletes previous route data from cache.  
- **1.4 AI Processing for Route Estimation:** Uses AI Agent node to interpret fare estimation queries and create route data.  
- **1.5 Route Distance Calculation:** Calls Google Maps API to get route distance based on AI-generated route data.  
- **1.6 Route Data Validation & Dispatch:** Checks if route data is valid, parses it, and triggers Taxi Service Provider workflows for fare estimation.  
- **1.7 Multilingual Output & Error Handling:** Uses conditional logic to deliver localized outputs and manages errors gracefully.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception & Triggering

- **Overview:**  
  This block triggers the workflow upon receiving a message from the taxi service call center or other sub-workflows.

- **Nodes Involved:**  
  - Flow Trigger  
  - Input  
  - Test Trigger (for testing purposes)  
  - Test Fields (for testing purposes)

- **Node Details:**  
  - **Flow Trigger**  
    - Type: Execute Workflow Trigger  
    - Role: Waits for external workflow calls to start the taxi service process.  
    - Configuration: Default, no parameters.  
    - Inputs: None (trigger node).  
    - Outputs: Connected to Input node.  
    - Failures: Trigger failures are rare but ensure proper trigger registration.  
  - **Input**  
    - Type: Set  
    - Role: Sets initial data fields like `channel_no` = "taxi" and `service_no` = "test" for the taxi service context.  
    - Configuration: Empty parameters; fields are set via notes or expressions.  
    - Inputs: From Flow Trigger.  
    - Outputs: To Service Cache node.  
  - **Test Trigger & Test Fields**  
    - Used for testing the workflow externally via webhook and setting test data.  
    - Not part of production flow but useful for QA.

#### 1.2 Service Validation & Caching

- **Overview:**  
  Verifies if the requested taxi service exists and is active by checking Redis cache first. If not found or inactive, the workflow queries the PostgreSQL database. Caches the service data if active.

- **Nodes Involved:**  
  - Service Cache (Redis)  
  - If Service Cache (If node)  
  - Parse Service (Code)  
  - Load Service Data (Postgres)  
  - If Active (If node)  
  - Save Service Cache (Redis)  
  - Service (Set)  
  - Inactive Output (Set)  
  - Error Output (Set)

- **Node Details:**  
  - **Service Cache**  
    - Type: Redis node  
    - Role: Attempts to load cached service data with key pattern `service:{channel_no}:{service_no}:data` with 15-minute TTL.  
    - OnError: Continue (non-fatal cache miss leads to DB query).  
  - **If Service Cache**  
    - Type: If node  
    - Role: Checks if service data exists in cache.  
    - True: Parse cached service.  
    - False: Load from Postgres database.  
  - **Parse Service**  
    - Type: Code node  
    - Role: Parses JSON or cache format into usable service data fields.  
  - **Load Service Data**  
    - Type: Postgres node  
    - Role: Queries `sys_service` table or equivalent to get service info.  
    - OnError: Continue to prevent workflow failure on DB error.  
  - **If Active**  
    - Type: If node  
    - Role: Checks if the service record indicates the service is active.  
    - True: Save service data back to Redis cache.  
    - False: Set inactive output message.  
  - **Save Service Cache**  
    - Type: Redis node  
    - Role: Caches the active service data with 15-minute TTL.  
  - **Service**  
    - Type: Set node  
    - Role: Prepares service data for downstream use.  
  - **Inactive Output & Error Output**  
    - Type: Set nodes  
    - Role: Prepare error messages when service is inactive or not found.

- **Edge cases:**  
  - Redis cache miss or connection failure handled gracefully.  
  - DB query failure does not stop flow but leads to error outputs.  
  - Inactive or missing services cause early exit with error messages.

#### 1.3 Session & Route Data Management

- **Overview:**  
  Resets user session data and deletes any previous route data cached for the current session and channel.

- **Nodes Involved:**  
  - Reset Session (Redis)  
  - Delete Route Data (Redis)

- **Node Details:**  
  - **Reset Session**  
    - Type: Redis node  
    - Role: Resets TTL and clears session data with key `{session_id}:session` for 5 minutes.  
    - OnError: Continue to avoid blocking flow.  
  - **Delete Route Data**  
    - Type: Redis node  
    - Role: Deletes any previously cached route data with key `{session_id}:{channel_no}:route`.  
    - OnError: Continue.

- **Edge cases:**  
  - Redis failures do not block the workflow.  
  - Ensures clean state for new fare estimation.

#### 1.4 AI Processing for Route Estimation

- **Overview:**  
  Uses an AI agent node to process the user's fare estimation query, generate route data, and manage user memory and session updates.

- **Nodes Involved:**  
  - AI Agent (LangChain Agent)  
  - Load User Memory (Postgres)  
  - Save User Memory (Postgres)  
  - Update User Session (Redis)  
  - Postgres Chat Memory (LangChain Memory)  
  - xAI @grok-2-1212 (Chat Language Model)  
  - Create Route Data (Redis)

- **Node Details:**  
  - **AI Agent**  
    - Type: LangChain Agent  
    - Role: Main AI processor for interpreting fare queries and generating route metadata.  
    - OnError: Continues on errors to allow fallback or error handling.  
    - Connected to language model, user memory, chat memory, and Redis cache for route data creation.  
  - **Load User Memory & Save User Memory**  
    - Type: Postgres Tool nodes  
    - Role: Load and save user conversation memory for personalized AI interactions.  
  - **Update User Session**  
    - Type: Redis Tool  
    - Role: Updates session TTL and session state with 5 minutes expiry.  
  - **Postgres Chat Memory**  
    - Type: LangChain Memory (Postgres)  
    - Role: Maintains chat history with expiry and session scoping.  
  - **xAI @grok-2-1212**  
    - Type: Language Model node, e.g., XAI Grok model  
    - Role: Provides the language model inference for the AI Agent.  
  - **Create Route Data**  
    - Type: Redis Tool  
    - Role: Caches the newly created route data with TTL 5 minutes using key `{session_id}:{channel_id}:route`.

- **Edge cases:**  
  - AI model errors handled via continue error output.  
  - Memory loading or saving failures do not block AI processing.  
  - Redis cache failures for route data creation handled gracefully.

#### 1.5 Route Distance Calculation

- **Overview:**  
  Calls the Google Maps Route API to calculate the distance for the AI-generated route.

- **Nodes Involved:**  
  - Find Route Distance (HTTP Request)

- **Node Details:**  
  - **Find Route Distance**  
    - Type: HTTP Request node  
    - Role: Sends API request to Google Maps with route details to compute distance.  
    - Configuration: Uses Google Maps API key credential.  
    - Input: Route data from AI Agent.  
    - Output: Route distance data for downstream usage.  
  - Edge cases:  
    - API key failures or quota limits cause errors; ensure API key is valid and has routing enabled.  
    - Network or timeout errors possible; recommend retry or fallback logic.

#### 1.6 Route Data Validation & Dispatch

- **Overview:**  
  Checks if route data exists, parses it, and calls Taxi Service Provider workflows for fare estimation, then handles multilingual output options.

- **Nodes Involved:**  
  - Route Data (Redis)  
  - If Route Data (If node)  
  - Parse Route (Code)  
  - Taxi Service Provider (Execute Workflow)  
  - Switch (Switch node)  
  - English, Chinese, Japanese (Set nodes)  
  - Call Back (Execute Workflow)  
  - Output (Set)

- **Node Details:**  
  - **Route Data**  
    - Redis node to get cached route data with TTL 5 minutes.  
  - **If Route Data**  
    - Checks if route data is available.  
    - True: Proceed to Parse Route.  
    - False: Outputs empty or error message.  
  - **Parse Route**  
    - Code node to parse and prepare route data for providers.  
  - **Taxi Service Provider**  
    - Executes sub-workflow "Taxi Service Provider" to process fare estimation.  
    - OnError: Continue to prevent blocking.  
  - **Switch**  
    - Routes output message based on language code or preference.  
  - **English, Chinese, Japanese**  
    - Set nodes providing localized messages and instructions (e.g., cancellation text).  
  - **Call Back**  
    - Executes "Demo Call Back" sub-workflow to send final responses back to the caller.  
  - **Output**  
    - Sets final output fields.

- **Edge cases:**  
  - Missing route data leads to fallback output.  
  - Sub-workflow failures do not stop the main workflow.  
  - Language selection default and fallback handled.

#### 1.7 Error Handling & Miscellaneous

- **Overview:**  
  Handles errors and outputs fallback messages to the caller.

- **Nodes Involved:**  
  - Error Output (Set)  
  - Inactive Output (Set)  

- **Node Details:**  
  - These nodes prepare user-friendly error messages such as "Service not available" or "Please retry."  
  - They are connected to Call Back node ensuring caller receives feedback.

---

### 3. Summary Table

| Node Name             | Node Type                         | Functional Role                                  | Input Node(s)              | Output Node(s)                   | Sticky Note                                         |
|-----------------------|----------------------------------|-------------------------------------------------|----------------------------|---------------------------------|-----------------------------------------------------|
| Flow Trigger          | Execute Workflow Trigger          | Starts workflow on external trigger              | -                          | Input                           |                                                     |
| Input                 | Set                              | Sets initial taxi service parameters             | Flow Trigger               | Service Cache                   | channel_no: taxi, service_no: test                  |
| Test Trigger          | Chat Trigger                     | Test webhook trigger                              | -                          | Test Fields                    |                                                     |
| Test Fields           | Set                              | Sets test data fields                             | Test Trigger               | Input                          |                                                     |
| Service Cache         | Redis                            | Fetches cached service data                       | Input                      | If Service Cache               | TTL 15m service:{channel_no}:{service_no}:data      |
| If Service Cache      | If                               | Checks if cached service data exists              | Service Cache              | Parse Service / Load Service Data |                                                     |
| Parse Service         | Code                             | Parses service data from cache                    | If Service Cache           | Service                        |                                                     |
| Load Service Data     | Postgres                         | Queries service data from database                | If Service Cache           | If Active                     | executeOnce: true, alwaysOutputData: true           |
| If Active             | If                               | Checks if service is active                        | Load Service Data          | Save Service Cache / Inactive Output |                                                     |
| Save Service Cache    | Redis                            | Saves active service data to cache                | If Active                  | Service                       | TTL 15m                                              |
| Service               | Set                              | Prepares service data for downstream nodes        | Save Service Cache / Parse Service | Reset Session               |                                                     |
| Reset Session         | Redis                            | Resets user session data TTL                       | Service                    | Delete Route Data             | TTL 5m {session_id}:session                           |
| Delete Route Data     | Redis                            | Deletes cached route data                          | Reset Session              | AI Agent                     | {session_id}:{channel_no}:route                       |
| AI Agent              | LangChain Agent                  | Processes fare estimation query via AI            | Delete Route Data          | Route Data / Error Output      | OnError continueErrorOutput                           |
| Load User Memory      | Postgres Tool                   | Loads user memory for AI context                   | - (ai_tool input)          | AI Agent                     | n8n_user_memory                                      |
| Save User Memory      | Postgres Tool                   | Saves user memory after AI interaction             | - (ai_tool input)          | AI Agent                     |                                                     |
| Update User Session   | Redis Tool                      | Updates session TTL and state                       | - (ai_tool input)          | AI Agent                     | TTL 5m {session_id}:session                           |
| Postgres Chat Memory  | LangChain Memory (Postgres)     | Maintains chat history for AI agent                | - (ai_memory input)        | AI Agent                     | 20 CHAT, EXPIRY 60m                                  |
| xAI @grok-2-1212      | LangChain LM                    | Language model providing AI inference               | - (ai_languageModel input) | AI Agent                     |                                                     |
| Create Route Data     | Redis Tool                      | Caches route data generated by AI                   | - (ai_tool input)          | AI Agent                     | TTL 5m {session_id}:{channel_id}:route               |
| Route Data            | Redis                           | Retrieves cached route data                         | AI Agent                   | If Route Data                | TTL 5m {session_id}:{channel_id}:route               |
| If Route Data         | If                              | Checks existence of route data                      | Route Data                 | Parse Route / Output          |                                                     |
| Parse Route           | Code                            | Parses route data for providers                     | If Route Data              | Taxi Service Provider, Switch |                                                     |
| Taxi Service Provider | Execute Workflow                | Executes taxi providers for fare estimation         | Parse Route                | -                           | Taxi Service Provider NO WAIT                        |
| Switch                | Switch                         | Routes to language-specific output nodes            | Parse Route                | English / Chinese / Japanese  |                                                     |
| English               | Set                             | Sets English localized output                        | Switch                     | Call Back                    | Enter 0 to cancel                                   |
| Chinese               | Set                             | Sets Chinese localized output                        | Switch                     | Call Back                    | 如須取消，輸入0                                      |
| Japanese              | Set                             | Sets Japanese localized output                       | Switch                     | Call Back                    | キャンセルする場合は0を入力してください               |
| Call Back             | Execute Workflow               | Sends final response back to caller                  | Output / English / Chinese / Japanese / Error Output / Inactive Output | - | Demo Call Back                                       |
| Output                | Set                             | Prepares final output data                            | If Route Data              | Call Back                    |                                                     |
| Error Output          | Set                             | Prepares error message on failure                     | AI Agent                   | Call Back                    | Please retry.                                       |
| Inactive Output       | Set                             | Prepares message when service is inactive             | If Active (false)           | Call Back                    | Service not available.                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Flow Trigger node:**  
   - Type: Execute Workflow Trigger  
   - Purpose: Entry point waiting for external workflow calls.  
   - No special parameters.

2. **Create Input node:**  
   - Type: Set  
   - Set fields: `channel_no` = "taxi", `service_no` = "test" (or dynamic inputs).  
   - Connect Flow Trigger → Input.

3. **Create Service Cache node:**  
   - Type: Redis  
   - Credential: Redis credentials for service cache.  
   - Key pattern: `service:{channel_no}:{service_no}:data`  
   - TTL: 15 minutes.  
   - Connect Input → Service Cache.

4. **Create If Service Cache node:**  
   - Type: If  
   - Condition: Check if cached service data exists (e.g., check field presence).  
   - Connect Service Cache → If Service Cache.

5. **Create Parse Service node:**  
   - Type: Code  
   - Purpose: Parse cached service JSON to usable fields.  
   - Connect If Service Cache (true) → Parse Service.

6. **Create Load Service Data node:**  
   - Type: Postgres  
   - Credential: PostgreSQL DB credentials.  
   - Query: Select service data from `sys_service` or equivalent table filtered by `channel_no` and `service_no`.  
   - Options: executeOnce = true, alwaysOutputData = true.  
   - Connect If Service Cache (false) → Load Service Data.

7. **Create If Active node:**  
   - Type: If  
   - Condition: Check if service data field `active` is true.  
   - Connect Load Service Data → If Active.

8. **Create Save Service Cache node:**  
   - Type: Redis  
   - Save the active service data to cache with TTL 15 minutes.  
   - Connect If Active (true) → Save Service Cache.

9. **Create Service node:**  
   - Type: Set  
   - Purpose: Prepare service data for downstream processing.  
   - Connect Save Service Cache → Service and Parse Service → Service.

10. **Create Reset Session node:**  
    - Type: Redis  
    - Operation: Reset TTL and clear session cache `{session_id}:session` with 5 min TTL.  
    - Connect Service → Reset Session.

11. **Create Delete Route Data node:**  
    - Type: Redis  
    - Operation: Delete route data cache `{session_id}:{channel_no}:route`.  
    - Connect Reset Session → Delete Route Data.

12. **Create AI Agent node:**  
    - Type: LangChain Agent  
    - Configuration: Set AI model, memory nodes, prompt adapted for taxi fare estimation.  
    - Connect Delete Route Data → AI Agent.

13. **Create supporting AI memory nodes:**  
    - Load User Memory (Postgres Tool)  
    - Save User Memory (Postgres Tool)  
    - Update User Session (Redis Tool)  
    - Postgres Chat Memory (LangChain Memory)  
    - xAI @grok-2-1212 (LangChain LM)  
    - Create Route Data (Redis Tool)  
    - Connect all to AI Agent appropriately as ai_tool, ai_memory, ai_languageModel inputs.

14. **Create Route Data node:**  
    - Type: Redis  
    - Get cached route data `{session_id}:{channel_id}:route`.  
    - Connect AI Agent → Route Data.

15. **Create If Route Data node:**  
    - Type: If  
    - Condition: Check if route data exists.  
    - Connect Route Data → If Route Data.

16. **Create Parse Route node:**  
    - Type: Code  
    - Purpose: Parse route data for providers.  
    - Connect If Route Data (true) → Parse Route.

17. **Create Taxi Service Provider node:**  
    - Type: Execute Workflow  
    - Workflow: Link to your Taxi Service Provider workflow.  
    - OnError: Continue.  
    - Connect Parse Route → Taxi Service Provider.

18. **Create Switch node:**  
    - Type: Switch  
    - Condition: Based on language preference code or variable.  
    - Connect Parse Route → Switch.

19. **Create language-specific Set nodes:**  
    - English: Set cancellation message "Enter 0 to cancel"  
    - Chinese: Set cancellation message "如須取消，輸入0"  
    - Japanese: Set cancellation message "キャンセルする場合は0を入力してください"  
    - Connect Switch → each language node accordingly.

20. **Create Call Back node:**  
    - Type: Execute Workflow  
    - Workflow: Link to "Demo Call Back" or your custom callback workflow.  
    - Connect all language nodes → Call Back.  
    - Also connect Error Output and Inactive Output nodes → Call Back.

21. **Create Output node:**  
    - Type: Set  
    - Purpose: Prepare final output data for callback.  
    - Connect If Route Data (false) → Output → Call Back.

22. **Create Error Output and Inactive Output nodes:**  
    - Type: Set  
    - Set appropriate error messages ("Please retry." and "Service not available.")  
    - Connect AI Agent (error output) → Error Output → Call Back.  
    - Connect If Active (false) → Inactive Output → Call Back.

23. **Create Find Route Distance node:**  
    - Type: HTTP Request  
    - Purpose: Call Google Maps Route API to obtain distance.  
    - Configure with Google Maps API key credentials.  
    - Connect AI Agent (ai_tool input) → Find Route Distance → AI Agent.

24. **Credential Setup:**  
    - Redis: For caching session, route data, and service data.  
    - PostgreSQL: For service data and user memory storage.  
    - Google Maps API: For route distance calculation.  
    - AI Model: Configure your preferred AI model credentials (e.g., OpenAI, XAI Grok).

25. **Validation and Testing:**  
    - Use Test Trigger and Test Fields to simulate input messages.  
    - Verify caching behavior and AI responses.  
    - Validate multilingual outputs and error handling.

---

### 5. General Notes & Resources

| Note Content                                                                                           | Context or Link                                                                                   |
|------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| SQL setup and schema for `sys_service` and user memory available at GitHub repository.                | https://github.com/ChatPayLabs/n8n-chatbot-core                                                 |
| Redis credential creation details in n8n docs.                                                       | https://docs.n8n.io/integrations/builtin/credentials/slack/?utm_source=n8n_app&utm_medium=credential_settings&utm_campaign=create_new_credentials_modal |
| PostgreSQL credential creation details in n8n docs.                                                  | https://docs.n8n.io/integrations/builtin/credentials/slack/?utm_source=n8n_app&utm_medium=credential_settings&utm_campaign=create_new_credentials_modal |
| Google Maps API key must have routing enabled for Find Route Distance node to work correctly.        | https://developers.google.com/maps/documentation/routes/get-api-key                              |
| AI Agent prompt is customizable for different taxi services or other service types by modifying the node configuration. | Internal design flexibility.                                                                    |
| Workflow designed for n8n version v1.90.2 or later due to some node versions and features used.     |                                                                                                 |
| Queue mode scaling design intended for production environments to handle concurrency and throughput. |                                                                                                 |
| Error management designed to continue workflow on non-critical failures, ensuring robustness.        |                                                                                                 |

---

**Disclaimer:**  
The provided content is derived solely from an automated workflow created with n8n, respecting all current content policies and containing no illegal or protected elements. All data processed is legal and public.