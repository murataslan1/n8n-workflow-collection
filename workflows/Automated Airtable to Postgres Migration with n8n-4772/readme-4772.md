Automated Airtable to Postgres Migration with n8n

https://n8nworkflows.xyz/workflows/automated-airtable-to-postgres-migration-with-n8n-4772


# Automated Airtable to Postgres Migration with n8n

### 1. Workflow Overview

This workflow automates the migration of data from Airtable to a PostgreSQL database using n8n. It is designed to handle schema validation, data transformation, creation or deletion of database tables, and upsert operations to synchronize records. The workflow is triggered via webhooks and processes data in batches to manage large datasets efficiently. It includes several logical blocks:

- **1.1 Input Reception & Initialization:** Handles incoming webhook requests, validates credentials, and initializes global variables.
- **1.2 Schema Retrieval & Validation:** Retrieves Airtable schema and validates base IDs for migration or deletion.
- **1.3 Data Mapping & Transformation:** Maps Airtable fields to PostgreSQL schema, edits fields for compatibility.
- **1.4 Database Operations:** Creates PostgreSQL tables if necessary, deletes tables on request, and tests PostgreSQL credentials.
- **1.5 Data Migration & Upsert:** Splits data into batches, loops over records to upsert into PostgreSQL, handles errors and responses.
- **1.6 Response Handling:** Sends success or failure responses back to the webhook caller.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception & Initialization

- **Overview:** Listens to incoming webhook calls, sets initial variables, and branches logic based on input.
- **Nodes Involved:** `Airtable - Postgres system`, `Pass all data`, `Switch`, `postgres credentials`, `Set webhook user data`, `Validate base id`, `Claude`, `Respond to Webhook`, `set webhook`
  
- **Node Details:**

  - **Airtable - Postgres system**  
    - Type: Webhook  
    - Role: Entry point receiving HTTP requests containing Airtable credentials and migration parameters.  
    - Config: Listens using a unique webhook ID, expects JSON payload with Airtable ID/token.  
    - Outputs to `Pass all data` and `set webhook`.  
    - Edge cases: Unauthorized or malformed requests; ensure webhook security.  

  - **Pass all data**  
    - Type: Set  
    - Role: Passes data forward without modification for routing.  
    - Connected to `Switch`.  

  - **Switch**  
    - Type: Switch  
    - Role: Routes workflow based on the input parameters to handle different operations (e.g., credentials validation, base ID validation, deletion).  
    - Outputs connect to `postgres credentials`, `Set webhook user data`, `base id to delete`, `Set user data3`.  
    - Edge cases: Unrecognized or missing parameters leading to routing errors.  

  - **postgres credentials**  
    - Type: Set  
    - Role: Sets PostgreSQL credentials from input for testing and operations.  
    - Outputs to `If` node for conditional branching.  

  - **Set webhook user data**  
    - Type: Set  
    - Role: Stores webhook user data for further processing.  
    - Outputs to `Validate base id`.  

  - **Validate base id**  
    - Type: Set  
    - Role: Validates the provided Airtable base ID.  
    - Outputs to `get schema`.  

  - **Claude**  
    - Type: HTML (used as a placeholder or for a custom response)  
    - Role: Prepares response content to webhook.  
    - Outputs to `Respond to Webhook`.  

  - **Respond to Webhook**  
    - Type: Respond to Webhook  
    - Role: Sends HTTP response back to the webhook caller.  
    - Connected from `Claude`.  

  - **set webhook**  
    - Type: Set  
    - Role: Prepares variables for downstream processing after webhook reception.  
    - Outputs to `Claude`.  

#### 1.2 Schema Retrieval & Validation

- **Overview:** Retrieves schema details from Airtable, splits data for processing, and sets global parameters.
- **Nodes Involved:** `get schema`, `Split Out`, `set globals`, `Limit1`, `Loop Over Items`, `Field mapping`, `New mapper`, `If3`, `Ser user data`
  
- **Node Details:**

  - **get schema**  
    - Type: HTTP Request  
    - Role: Fetches Airtable schema via API.  
    - Configuration: Uses Airtable API endpoint with credentials from the webhook.  
    - Outputs to `Split Out`.  
    - Possible failures: Network errors, invalid API key, rate limits.  

  - **Split Out**  
    - Type: SplitOut  
    - Role: Splits the retrieved schema into smaller parts for parallel processing.  
    - Connects to `set globals`.  

  - **set globals**  
    - Type: Set  
    - Role: Sets global variables for schema and workflow parameters.  
    - Outputs to `Limit1`.  

  - **Limit1** (disabled)  
    - Type: Limit  
    - Role: Intended for rate limiting or controlling batch size but currently disabled.  
    - Outputs to `Loop Over Items` and `Loop Over Items1`.  

  - **Loop Over Items**  
    - Type: SplitInBatches  
    - Role: Processes schema items in batches to manage large data sets efficiently.  
    - Outputs to two parallel nodes: `Set columns` and `Field mapping`.  

  - **Field mapping**  
    - Type: Set  
    - Role: Maps Airtable fields to PostgreSQL field names/types for migration.  
    - Outputs to `New mapper`.  

  - **New mapper**  
    - Type: Code  
    - Role: Runs custom JavaScript to refine or create new mapping logic for fields.  
    - Outputs to `If3`.  

  - **If3**  
    - Type: If  
    - Role: Conditional check to decide next steps based on mapping results.  
    - Outputs to `Ser user data` or `Loop Over Items`.  

  - **Ser user data**  
    - Type: Set  
    - Role: Sets user data variables for database creation phase.  
    - Outputs to `Create database`.  

#### 1.3 Data Mapping & Transformation

- **Overview:** Adjusts and prepares field data for compatibility with PostgreSQL schema.
- **Nodes Involved:** `Set columns`, `Field mapping`, `Edit Fields`, `Ser user data1`, `Upsert records`, `Loop Over Items1`, `Edit Fields2`, `Get records`, `If1`, `Split Out3`, `Set record fields`
  
- **Node Details:**

  - **Set columns**  
    - Type: Set  
    - Role: Defines and prepares the columns to be created or updated in PostgreSQL.  
    - Connected in batch processing after splitting items.  

  - **Edit Fields**  
    - Type: Set  
    - Role: Adjusts field data, possibly normalizing or formatting fields.  
    - Outputs to `Ser user data1`.  

  - **Ser user data1**  
    - Type: Set  
    - Role: Prepares user data for upsert operations.  
    - Outputs to `Upsert records`.  

  - **Upsert records**  
    - Type: Code  
    - Role: Contains custom JavaScript to perform upsert (insert or update) operations in PostgreSQL.  
    - Outputs to `Loop Over Items1` for further batching.  
    - Failure modes: SQL errors, connection issues, data type mismatches.  

  - **Loop Over Items1**  
    - Type: SplitInBatches  
    - Role: Processes record batches for upsert operations.  
    - Outputs to `Edit Fields2` and `Get records`.  

  - **Edit Fields2**  
    - Type: Set  
    - Role: Further field editing for records retrieved or to be updated.  
    - Outputs to `Credential response1`.  

  - **Get records**  
    - Type: HTTP Request  
    - Role: Retrieves records from Airtable for migration or synchronization.  
    - Outputs to `If1`.  

  - **If1**  
    - Type: If  
    - Role: Conditional branching based on record retrieval results.  
    - Outputs to `Split Out3` or `Loop Over Items1`.  

  - **Split Out3**  
    - Type: SplitOut  
    - Role: Splits data for parallel processing.  
    - Outputs to `Set record fields`.  

  - **Set record fields**  
    - Type: Set  
    - Role: Prepares individual record fields for database insertion.  
    - Outputs to `Edit Fields`.  

#### 1.4 Database Operations

- **Overview:** Creates or deletes PostgreSQL tables, tests credentials, and manages database schema integrity.
- **Nodes Involved:** `Create database`, `set error`, `set tables found`, `Credential response`, `Test credentials`, `Test postgres credentials`, `if successful`, `Failure message`, `success message`, `Pass both responses`, `Delete table`, `Ser user data2`, `Loop Over Items2`, `Edit Fields1`, `Ser user data3`, `Upsert records2`, `Edit airtable fields2`
  
- **Node Details:**

  - **Create database**  
    - Type: Code  
    - Role: Executes code to create necessary PostgreSQL tables based on mapped schema.  
    - Outputs to `set error`.  
    - Failures: SQL syntax errors, permission issues.  

  - **set error**  
    - Type: Set  
    - Role: Sets error state if database creation fails.  
    - Outputs to `Loop Over Items`.  

  - **Test credentials**  
    - Type: HTTP Request  
    - Role: Verifies Airtable credentials are valid.  
    - Outputs to `set tables found`.  

  - **set tables found**  
    - Type: Set  
    - Role: Captures tables found in Airtable for migration.  
    - Outputs to `Credential response`.  

  - **Credential response**  
    - Type: Respond to Webhook  
    - Role: Sends back credential validation response.  

  - **Test postgres credentials**  
    - Type: Code  
    - Role: Runs code to verify PostgreSQL connection and credentials.  
    - Outputs to `if successful`.  

  - **if successful**  
    - Type: If  
    - Role: Branches based on credential test success or failure.  
    - Outputs to `success message` or `Failure message`.  

  - **Failure message**  
    - Type: Set  
    - Role: Sets failure message for outgoing response.  
    - Outputs to `Pass both responses`.  

  - **success message**  
    - Type: Set  
    - Role: Sets success message for outgoing response.  
    - Outputs to `Pass both responses`.  

  - **Pass both responses**  
    - Type: Set  
    - Role: Prepares combined success/failure response.  
    - Outputs to `Credential response`.  

  - **Delete table**  
    - Type: Code  
    - Role: Executes code to delete specified PostgreSQL tables.  
    - Connected to `Loop Over Items2`.  
    - Failures: Permission errors, non-existent tables.  

  - **Ser user data2**  
    - Type: Set  
    - Role: Sets data for delete table operation.  

  - **Loop Over Items2**  
    - Type: SplitInBatches  
    - Role: Loops over tables to be deleted.  
    - Outputs to `Edit Fields1` and `Ser user data2`.  

  - **Edit Fields1**  
    - Type: Set  
    - Role: Edits fields related to deletion operation.  
    - Outputs to `Edit airtable fields1`.  

  - **Ser user data3**  
    - Type: Set  
    - Role: Prepares data for additional upsert operations (possibly secondary sync).  
    - Outputs to `Upsert records2`.  

  - **Upsert records2**  
    - Type: Code  
    - Role: Alternative or secondary upsert operation in PostgreSQL.  
    - Outputs to `Edit airtable fields2`.  

  - **Edit airtable fields2**  
    - Type: Respond to Webhook  
    - Role: Responds back after upsert operations.  

#### 1.5 Data Migration & Upsert

- **Overview:** Manages batching and looping over data items to perform upsert operations efficiently.
- **Nodes Involved:** `Loop Over Items`, `Loop Over Items1`, `Loop Over Items2`, `Limit1` (disabled), `Limit3` (disabled)
  
- **Node Details:**

  - **Loop Over Items**  
    - Type: SplitInBatches  
    - Role: Processes main batches of records for migration.  
    - Outputs to `Set columns` and `Field mapping`.  

  - **Loop Over Items1**  
    - Type: SplitInBatches  
    - Role: Processes batches for upsert operations and fetching records.  
    - Outputs to `Edit Fields2` and `Get records`.  

  - **Loop Over Items2**  
    - Type: SplitInBatches  
    - Role: Processes batches for deletion or secondary upsert operations.  
    - Outputs to `Edit Fields1` and `Ser user data2`.  

  - **Limit1** and **Limit3**  
    - Type: Limit  
    - Role: Control the number of concurrent executions or batch sizes but currently disabled.  

#### 1.6 Response Handling

- **Overview:** Sends final responses back to the originating webhook caller reflecting operation success or failure.
- **Nodes Involved:** `Credential response`, `Credential response1`, `Respond to Webhook`, `Edit airtable fields1`, `Edit airtable fields2`
  
- **Node Details:**

  - **Credential response**  
    - Type: Respond to Webhook  
    - Role: Sends responses related to credential validation or overall operation status.  

  - **Credential response1**  
    - Type: Respond to Webhook  
    - Role: Sends responses specific to record-level operations or detailed acknowledgments.  

  - **Respond to Webhook**  
    - Type: Respond to Webhook  
    - Role: Generic response node sending HTTP response after processing.  

  - **Edit airtable fields1** and **Edit airtable fields2**  
    - Type: Respond to Webhook  
    - Role: Responds to webhook with data pertaining to field edits or upsert completion.  

---

### 3. Summary Table

| Node Name                | Node Type             | Functional Role                               | Input Node(s)                                        | Output Node(s)                                     | Sticky Note                                                 |
|--------------------------|-----------------------|----------------------------------------------|-----------------------------------------------------|---------------------------------------------------|-------------------------------------------------------------|
| Airtable - Postgres system | Webhook               | Entry point for webhook requests              | None                                                | Pass all data, set webhook                        |                                                             |
| Pass all data            | Set                   | Routes data forward                           | Airtable - Postgres system                          | Switch                                            |                                                             |
| Switch                   | Switch                | Routes based on input parameters              | Pass all data                                       | postgres credentials, Set webhook user data, base id to delete, Set user data3 |                                                             |
| postgres credentials     | Set                   | Sets PostgreSQL credentials                    | Switch                                              | If                                                |                                                             |
| Set webhook user data    | Set                   | Stores webhook user data                       | Switch                                              | Validate base id                                  |                                                             |
| Validate base id         | Set                   | Validates Airtable base ID                     | Set webhook user data                               | get schema                                        |                                                             |
| get schema               | HTTP Request          | Retrieves Airtable schema                      | Validate base id                                    | Split Out                                         |                                                             |
| Split Out                | SplitOut              | Splits schema data                             | get schema                                          | set globals                                       |                                                             |
| set globals              | Set                   | Sets global variables                          | Split Out                                           | Limit1                                            |                                                             |
| Limit1                   | Limit (disabled)      | Intended for rate limiting                     | set globals                                         | Loop Over Items, Loop Over Items1                  | Disabled in this workflow                                    |
| Loop Over Items          | SplitInBatches        | Batch processing of schema items               | Limit1                                              | Set columns, Field mapping                         |                                                             |
| Set columns              | Set                   | Prepares columns for PostgreSQL                | Loop Over Items                                     | Field mapping                                     |                                                             |
| Field mapping            | Set                   | Maps Airtable fields to PostgreSQL             | Loop Over Items                                     | New mapper                                        |                                                             |
| New mapper               | Code                  | Custom mapping logic                            | Field mapping                                       | If3                                               |                                                             |
| If3                      | If                    | Conditional check on mapping                    | New mapper                                          | Ser user data, Loop Over Items                      |                                                             |
| Ser user data            | Set                   | Prepares data for DB creation                   | If3                                                 | Create database                                   |                                                             |
| Create database          | Code                  | Creates PostgreSQL tables                        | Ser user data                                       | set error                                         |                                                             |
| set error                | Set                   | Sets error state                               | Create database                                     | Loop Over Items                                   |                                                             |
| Loop Over Items1         | SplitInBatches        | Batch processing for upsert and retrieval       | Limit1                                              | Edit Fields2, Get records                          |                                                             |
| Edit Fields2             | Set                   | Field adjustments for upsert                     | Loop Over Items1                                    | Credential response1                              |                                                             |
| Get records              | HTTP Request          | Retrieves records from Airtable                  | Loop Over Items1                                    | If1                                               |                                                             |
| If1                      | If                    | Branches based on record retrieval               | Get records                                         | Split Out3, Loop Over Items1                       |                                                             |
| Split Out3               | SplitOut              | Splits records for processing                     | If1                                                 | Set record fields                                 |                                                             |
| Set record fields        | Set                   | Prepares record fields for DB insertion           | Split Out3                                         | Edit Fields                                      |                                                             |
| Edit Fields              | Set                   | Adjusts record fields                              | Set record fields                                   | Ser user data1                                   |                                                             |
| Ser user data1           | Set                   | Prepares data for upsert operation                 | Edit Fields                                         | Upsert records                                   |                                                             |
| Upsert records           | Code                  | Upsert operation in PostgreSQL                      | Ser user data1                                     | Loop Over Items1                                  |                                                             |
| Loop Over Items2         | SplitInBatches        | Batch processing for deletion or secondary upsert   | Ser user data2, Delete table                        | Edit Fields1, Ser user data2                       |                                                             |
| Edit Fields1             | Set                   | Field adjustments for deletion                       | Loop Over Items2                                   | Edit airtable fields1                            |                                                             |
| Edit airtable fields1    | Respond to Webhook    | Responds after deletion field edits                 | Edit Fields1                                       |                                                   |                                                             |
| Ser user data2           | Set                   | Prepares data for table deletion                      | Loop Over Items2                                   | Delete table                                     |                                                             |
| Delete table             | Code                  | Deletes PostgreSQL tables                             | Ser user data2                                     | Loop Over Items2                                  |                                                             |
| Ser user data3           | Set                   | Prepares data for alternative upsert                  | Switch                                            | Upsert records2                                 |                                                             |
| Upsert records2          | Code                  | Secondary upsert operation                             | Ser user data3                                     | Edit airtable fields2                            |                                                             |
| Edit airtable fields2    | Respond to Webhook    | Responds after secondary upsert                        | Upsert records2                                   |                                                   |                                                             |
| Test credentials         | HTTP Request          | Validates Airtable credentials                         | airtable fields                                    | set tables found                                 |                                                             |
| set tables found         | Set                   | Sets found tables post-validation                      | Test credentials                                  | Credential response                              |                                                             |
| Credential response      | Respond to Webhook    | Sends credentials validation response                  | set tables found, Pass both responses             |                                                   |                                                             |
| Credential response1     | Respond to Webhook    | Sends record-level operation response                   | Edit Fields2                                      |                                                   |                                                             |
| Test postgres credentials| Code                  | Tests PostgreSQL credentials                            | Edit postgres fields                              | if successful                                     |                                                             |
| if successful            | If                    | Branches on PostgreSQL credential test result           | Test postgres credentials                         | success message, Failure message                  |                                                             |
| success message          | Set                   | Sets success message                                    | if successful                                     | Pass both responses                              |                                                             |
| Failure message          | Set                   | Sets failure message                                    | if successful                                     | Pass both responses                              |                                                             |
| Pass both responses      | Set                   | Combines success and failure responses                   | success message, Failure message                  | Credential response                              |                                                             |
| Edit postgres fields     | Set                   | Prepares PostgreSQL fields for testing                    | If                                                | Test postgres credentials                        |                                                             |
| airtable fields          | Set                   | Prepares Airtable fields for credential testing           | If                                                | Test credentials                                 |                                                             |
| Claude                   | HTML                  | Prepares response content                                 | set webhook                                       | Respond to Webhook                               |                                                             |
| Respond to Webhook       | Respond to Webhook    | Sends HTTP response back                                  | Claude, Credential response, Credential response1 |                                                   |                                                             |
| set webhook              | Set                   | Sets variables post webhook reception                      | Airtable - Postgres system                        | Claude                                            |                                                             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Webhook Node (`Airtable - Postgres system`):**  
   - Configure with a unique webhook ID.  
   - Accept JSON input containing Airtable credentials and parameters.

2. **Add a Set Node (`set webhook`):**  
   - Pass incoming webhook data forward as variables.

3. **Add an HTML Node (`Claude`):**  
   - Prepare response content; can be a placeholder or customized HTML.

4. **Add Respond to Webhook Node (`Respond to Webhook`):**  
   - Connect from `Claude` to respond to incoming requests.

5. **Add a Set Node (`Pass all data`):**  
   - Pass data from webhook to routing logic.

6. **Add a Switch Node (`Switch`):**  
   - Route based on parameters (e.g., validate credentials, delete tables, migrate data).  
   - Create outputs for `postgres credentials`, `Set webhook user data`, `base id to delete`, and `Set user data3`.

7. **For PostgreSQL Credentials Branch:**  
   - Create Set Node (`postgres credentials`) to set DB credentials.  
   - Connect to an If Node (`If`) to branch into `airtable fields` or `Edit postgres fields`.  

8. **Create Set Nodes (`airtable fields`, `Edit postgres fields`):**  
   - Prepare Airtable and PostgreSQL fields for testing.  

9. **Add HTTP Request Nodes (`Test credentials` for Airtable, `Test postgres credentials` as Code node):**  
   - Configure with appropriate API endpoints and DB connection strings.  

10. **Add If Node (`if successful`) to handle credential test results:**  
    - Connect to Set Nodes for success and failure messages.  

11. **Add Set Nodes (`success message`, `Failure message`) and a combined Set Node (`Pass both responses`):**  
    - Prepare and merge response messages.  

12. **Add Respond to Webhook Node (`Credential response`):**  
    - Send final credential test result back.  

13. **For Base ID Validation Branch:**  
    - Add Set Node (`Set webhook user data`) to store data.  
    - Connect to Set Node (`Validate base id`) to validate Airtable base ID.  
    - Add HTTP Request Node (`get schema`) to retrieve Airtable schema.  
    - Add SplitOut Node (`Split Out`) to split schema.  
    - Add Set Node (`set globals`) for global settings.  
    - Add Limit Node (`Limit1`) — optionally disable as needed.  
    - Add Batch Processing Node (`Loop Over Items`) to process schema in batches.  
    - Add Set Nodes (`Set columns`, `Field mapping`) for preparing fields.  

14. **Add Code Node (`New mapper`) for custom mapping logic:**  
    - Connect to If Node (`If3`) to check mapping results.  
    - Connect to Set Node (`Ser user data`) to prepare for DB creation.  

15. **Add Code Node (`Create database`) to create PostgreSQL tables:**  
    - Connect to Set Node (`set error`) for error handling.  

16. **Add Batch Processing Nodes (`Loop Over Items1`, `Loop Over Items2`) for data upsert and deletion:**  
    - Connect with supporting Set Nodes (`Edit Fields`, `Edit Fields1`, `Edit Fields2`) for field adjustments.  
    - Add HTTP Request Node (`Get records`) to fetch data from Airtable.  
    - Add If Nodes (`If1`) for branching after record retrieval.  
    - Add SplitOut Nodes (`Split Out3`, `Split Out2`) for splitting data batches.  
    - Add Code Nodes (`Upsert records`, `Upsert records2`, `Delete table`) for DB operations.  
    - Add Respond to Webhook Nodes (`Edit airtable fields1`, `Edit airtable fields2`, `Credential response1`) for response handling.  

17. **Connect all nodes respecting the input-output flows as per the workflow diagram.**

18. **Configure Credentials:**  
    - Airtable API key and base ID for HTTP Request nodes.  
    - PostgreSQL credentials for Code nodes managing DB connections.  

19. **Deploy and test webhook endpoint with sample Airtable data and PostgreSQL environment.**

---

### 5. General Notes & Resources

| Note Content                                                                                                      | Context or Link                           |
|------------------------------------------------------------------------------------------------------------------|------------------------------------------|
| This workflow efficiently handles large dataset migrations by batching and looping, preventing timeouts.         | Workflow design principle                 |
| Disabled Limit nodes (`Limit1`, `Limit3`) can be enabled to control concurrency when needed.                      | Performance tuning                        |
| Custom Code nodes (`New mapper`, `Upsert records`) require JavaScript knowledge for customization.                | Extendability and customization          |
| Webhook security is critical; ensure unique webhook URLs and authentication where possible.                       | Security best practice                    |
| The workflow integrates HTTP Request nodes for Airtable API interactions; ensure Airtable API limits are respected.| Airtable API documentation               |
| PostgreSQL operations rely on proper credentials and permissions; test with `Test postgres credentials` node.    | Database administration                   |

---

**Disclaimer:**  
The provided content originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All handled data is legal and public.