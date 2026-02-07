Auto-Categorize YNAB Transactions with GPT-5-Mini and Discord Notifications

https://n8nworkflows.xyz/workflows/auto-categorize-ynab-transactions-with-gpt-5-mini-and-discord-notifications-7566


# Auto-Categorize YNAB Transactions with GPT-5-Mini and Discord Notifications

### 1. Workflow Overview

This workflow automates the categorization of uncategorized transactions in a YNAB (You Need A Budget) budget using GPT-5-Mini AI for intelligent category matching, then updates YNAB with the suggested categories and sends a notification to a Discord channel. It is designed for users who want to streamline budget maintenance by leveraging AI to classify transactions automatically and keep teams or individuals informed via Discord.

The workflow is logically divided into the following blocks:

- **1.1 Initialization and Variable Setup**: Trigger and setup of essential variables such as budget ID, account ID, API key, and lookback period.
- **1.2 YNAB Category Retrieval and Processing**: Fetches all budget categories from YNAB, filters out hidden/deleted/internal categories, and prepares a simplified categories list.
- **1.3 YNAB Uncategorized Transaction Retrieval and Filtering**: Retrieves uncategorized transactions from YNAB for the specified account and period, filters out transfers, deleted, and invalid transactions.
- **1.4 AI Categorization Agent**: Uses GPT-5-Mini via Langchain n8n nodes to analyze transactions against categories and suggest the best matching category for each transaction.
- **1.5 Batch Upload and YNAB Transaction Update**: Aggregates AI results, batch uploads updated transactions back to YNAB with category assignments and visual flags.
- **1.6 Notification via Discord**: Sends a summary message of the auto-budgeted transactions to a configured Discord webhook.

---

### 2. Block-by-Block Analysis

#### 1.1 Initialization and Variable Setup

- **Overview:**  
  This block starts the workflow manually and sets key variables for subsequent API calls.

- **Nodes Involved:**  
  - When clicking ‘Execute workflow’  
  - Variables  

- **Node Details:**  
  - **When clicking ‘Execute workflow’**  
    - Type: Manual Trigger  
    - Role: Starts the workflow on user command  
    - Config: No parameters  
    - Inputs: None  
    - Outputs: Triggers next node  
    - Edge cases: None specific, manual trigger only  

  - **Variables**  
    - Type: Set (data assignment)  
    - Role: Define key workflow variables (budget_id, account_id, api_key, previous_days)  
    - Config: Variables assigned with placeholder "CHANGEME" values—user must replace with real data before execution  
    - Key expressions: None, static values  
    - Inputs: From manual trigger  
    - Outputs: Variables object for downstream API calls  
    - Edge cases: Missing or incorrect variables will cause API request failures (authorization or resource not found)  

---

#### 1.2 YNAB Category Retrieval and Processing

- **Overview:**  
  This block fetches all categories from the specified YNAB budget, filters out hidden/deleted or internal categories, and prepares a clean list of categories for AI processing.

- **Nodes Involved:**  
  - Get Categories  
  - Get Category Groups  
  - Remove Invalid Category Groups  
  - Flatten Category Groups to Categories  
  - Hide Internal Categories  
  - Categories Only  
  - Group Categories  

- **Node Details:**  
  - **Get Categories**  
    - Type: HTTP Request  
    - Role: Retrieve category groups from YNAB API using budget_id and api_key  
    - Config: GET https://api.ynab.com/v1/budgets/{{budget_id}}/categories, Authorization header bearer token from variables  
    - Inputs: Variables node output  
    - Outputs: JSON with category groups  
    - Edge cases: API auth failures, budget_id errors, network timeouts  

  - **Get Category Groups**  
    - Type: Split Out  
    - Role: Splits JSON array of category groups into separate items for filtering  
    - Config: Field to split out: data.category_groups  
    - Inputs: Get Categories output  
    - Outputs: Each category group as individual item  
    - Edge cases: Empty category groups array  

  - **Remove Invalid Category Groups**  
    - Type: Filter  
    - Role: Filters out category groups marked as hidden or deleted  
    - Config: Conditions - hidden == false AND deleted == false  
    - Inputs: Get Category Groups output  
    - Outputs: Valid category groups only  
    - Edge cases: No valid groups found (empty output)  

  - **Flatten Category Groups to Categories**  
    - Type: Split Out  
    - Role: From each valid category group, extract categories as separate items  
    - Config: Field to split out: categories (from each category group)  
    - Inputs: Remove Invalid Category Groups output  
    - Outputs: Individual category items  
    - Edge cases: Empty categories array within groups  

  - **Hide Internal Categories**  
    - Type: Filter  
    - Role: Removes categories that are hidden, deleted, or belong to the "Internal Master Category" group  
    - Config: Conditions - hidden == false AND deleted == false AND category_group_name != "Internal Master Category"  
    - Inputs: Flatten Category Groups to Categories output  
    - Outputs: Categories visible and relevant for budgeting  
    - Edge cases: No categories passing filter  

  - **Categories Only**  
    - Type: Set  
    - Role: Simplifies category objects to only id and name fields for AI processing  
    - Config: Assign id and name from JSON  
    - Inputs: Hide Internal Categories output  
    - Outputs: Simplified category list  
    - Edge cases: Missing id or name fields in categories  

  - **Group Categories**  
    - Type: Aggregate  
    - Role: Aggregates all categories into a single array field named "categories"  
    - Inputs: Categories Only output  
    - Outputs: One item with all categories in .categories field  
    - Edge cases: Empty category list aggregation  

---

#### 1.3 YNAB Uncategorized Transaction Retrieval and Filtering

- **Overview:**  
  Retrieves uncategorized transactions for a given account within the last N days and filters out transfers, deleted, and invalid transactions.

- **Nodes Involved:**  
  - Get Transactions  
  - Break out Transactions  
  - Filter out transfers and invalid transactions  
  - Group Transactions  

- **Node Details:**  
  - **Get Transactions**  
    - Type: HTTP Request  
    - Role: Fetch transactions since a calculated date for the specified account, filtered to "uncategorized" type  
    - Config: GET https://api.ynab.com/v1/budgets/{{budget_id}}/accounts/{{account_id}}/transactions  
      - Query param since_date = today minus previous_days (default 30)  
      - Query param type = uncategorized  
      - Auth header: Bearer {{api_key}}  
    - Inputs: Variables node output  
    - Outputs: Transactions JSON  
    - Edge cases: API auth failure, invalid account ID, no transactions found  

  - **Break out Transactions**  
    - Type: Split Out  
    - Role: Splits transactions array into individual transaction items  
    - Config: Field to split out: data.transactions  
    - Inputs: Get Transactions output  
    - Outputs: Individual transaction items  
    - Edge cases: No transactions to split  

  - **Filter out transfers and invalid transactions**  
    - Type: Filter  
    - Role: Removes transactions that have existing category_id, are deleted, are transfers (have transfer_account_id or transfer_transaction_id), or are not uncategorized  
    - Config: Conditions combined with AND:  
      - category_id does not exist  
      - deleted == false  
      - category_name == "Uncategorized"  
      - transfer_account_id is empty  
      - transfer_transaction_id is empty  
    - Inputs: Break out Transactions output  
    - Outputs: Valid transactions for categorization  
    - Edge cases: No transactions passing filter  

  - **Group Transactions**  
    - Type: Aggregate  
    - Role: Aggregates filtered transactions back into single array under "transactions" field  
    - Inputs: Filter out transfers and invalid transactions output  
    - Outputs: One item with transactions array  
    - Edge cases: Empty transactions array  

---

#### 1.4 AI Categorization Agent

- **Overview:**  
  Uses GPT-5-Mini AI via Langchain nodes to analyze each uncategorized transaction individually, comparing it against the category list to suggest the best fitting category. If no suitable category is found, transaction is left unchanged. Outputs include updated category ID, name, and flags.

- **Nodes Involved:**  
  - Skip Categories, Loop Transactions (If)  
  - Loop Transactions (Split Out)  
  - AI Agent1  
  - OpenAI Chat Model2  
  - Structured Output Parser1  
  - Loop Over Items1 (Split in Batches)  
  - Aggregate  
  - Aggregate1  

- **Node Details:**  
  - **Skip Categories, Loop Transactions**  
    - Type: If  
    - Role: Checks if there are transactions to process; if yes, continue, else skip  
    - Condition: transactions array exists  
    - Inputs: Merge node output (merged categories and transactions)  
    - Outputs: True branch triggers Loop Transactions  
    - Edge cases: No transactions leads to early exit  

  - **Loop Transactions**  
    - Type: Split Out  
    - Role: Splits transactions array into individual transactions for AI processing  
    - Inputs: Skip Categories, Loop Transactions output  
    - Outputs: Single transaction item  
    - Edge cases: Empty input  

  - **AI Agent1**  
    - Type: Langchain Agent  
    - Role: Core AI node that formulates prompt, sends to language model, and interprets AI response  
    - Config:  
      - Prompt includes JSON stringified categories and transaction data  
      - System message: "You are a helpful assistant who is tasked with categorizing budget items."  
      - Output fields: category_id, category_name, flag_color ("yellow"), flag_name ("n8n") if a match is found  
      - Leaves other transaction fields unchanged if no match  
    - Inputs: Loop Transactions output (single transaction), categories from Group Categories node via merged data  
    - Outputs: AI-annotated transaction  
    - Edge cases:  
      - AI timeouts or errors  
      - Misinterpretation or invalid JSON output  
      - Rate limiting on OpenAI API  
    - Version: Requires Langchain and OpenAI integration with GPT-5-Mini model configured  

  - **OpenAI Chat Model2**  
    - Type: Langchain LM Chat OpenAI  
    - Role: Connects AI Agent1 to GPT-5-Mini model for inference  
    - Config: Uses GPT-5-Mini model with OpenAI API credentials  
    - Inputs: From AI Agent1 (languageModel interface)  
    - Outputs: AI model responses to AI Agent1  
    - Edge cases: API auth errors, quota exceeded, model unavailability  

  - **Structured Output Parser1**  
    - Type: Langchain Structured Output Parser  
    - Role: Parses AI output JSON to ensure it matches expected schema for transaction objects  
    - Config: JSON schema specifying transaction fields with types, including subtransactions  
    - Inputs: AI Agent1 outputParser interface  
    - Outputs: Validated structured transaction objects  
    - Edge cases: JSON parsing errors, schema validation failures  

  - **Loop Over Items1**  
    - Type: Split In Batches  
    - Role: Processes AI-updated transactions in batches of 10 to optimize API calls and throughput  
    - Inputs: Aggregate results from AI Agent1  
    - Outputs: Batch arrays for upload and notification  
    - Edge cases: Partial batch failures, batch size tuning for rate limits  

  - **Aggregate**  
    - Type: Aggregate  
    - Role: Aggregates batch results of updated transactions into one array under "transactions"  
    - Inputs: Loop Over Items1 output (batch of AI-processed transactions)  
    - Outputs: Aggregated transactions for upload  
    - Edge cases: Empty input aggregation  

  - **Aggregate1**  
    - Type: Aggregate  
    - Role: Aggregates batch results for Discord notification content  
    - Inputs: Loop Over Items1 output parallel branch  
    - Outputs: Aggregated transactions for message formatting  
    - Edge cases: Empty input  

---

#### 1.5 Batch Upload and YNAB Transaction Update

- **Overview:**  
  This block sends the AI-categorized transactions back to YNAB in batches, updating their category assignments and flagging them as processed.

- **Nodes Involved:**  
  - YNAB modify transactions  
  - Loop Over Items1 (already described)  
  - Aggregate (already described)  

- **Node Details:**  
  - **YNAB modify transactions**  
    - Type: HTTP Request  
    - Role: PATCH request to update transactions in YNAB with new category assignments and flags  
    - Config:  
      - URL: PATCH https://api.ynab.com/v1/budgets/{{budget_id}}/transactions  
      - Body: JSON including "transactions" array with updated transaction objects from Aggregate node  
      - Headers: Authorization Bearer token, accept JSON  
    - Inputs: Aggregate node output  
    - Outputs: YNAB API response  
    - Edge cases: API rate limits, invalid transaction IDs, partial updates, auth errors  

---

#### 1.6 Notification via Discord

- **Overview:**  
  Sends a summary notification of auto-budgeted transactions to a configured Discord webhook, including transaction count and details (payee, category, amount) and a direct link to the YNAB account.

- **Nodes Involved:**  
  - Discord  
  - Aggregate1 (input)  

- **Node Details:**  
  - **Discord**  
    - Type: Discord node (Webhook)  
    - Role: Posts a message with transaction summary to Discord channel  
    - Config:  
      - Message content formatted with number of transactions and list of transactions with payee name, category, and amount (converted from milliunits to dollars)  
      - Username and avatar URL set to "YNAB Budget Bot" branding  
      - Authentication via configured Discord webhook credentials  
    - Inputs: Aggregate1 output aggregated transactions  
    - Outputs: Discord API response  
    - Edge cases: Webhook misconfiguration, rate limits, message formatting errors  

---

### 3. Summary Table

| Node Name                       | Node Type                          | Functional Role                                  | Input Node(s)                  | Output Node(s)                 | Sticky Note                                                                                      |
|--------------------------------|----------------------------------|-------------------------------------------------|-------------------------------|-------------------------------|-------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’| Manual Trigger                   | Workflow start trigger                           | None                          | Variables                     |                                                                                                 |
| Variables                      | Set                              | Define budget_id, account_id, api_key, previous_days | When clicking ‘Execute workflow’ | Get Categories, Get Transactions |                                                                                                 |
| Get Categories                 | HTTP Request                     | Fetch YNAB categories                            | Variables                     | Get Category Groups           |                                                                                                 |
| Get Category Groups            | Split Out                       | Split category groups into individual items     | Get Categories                | Remove Invalid Category Groups |                                                                                                 |
| Remove Invalid Category Groups | Filter                          | Remove hidden/deleted category groups            | Get Category Groups           | Flatten Category Groups to Categories |                                                                                                 |
| Flatten Category Groups to Categories | Split Out                 | Extract categories from groups                    | Remove Invalid Category Groups | Hide Internal Categories      |                                                                                                 |
| Hide Internal Categories       | Filter                          | Remove hidden, deleted, or internal master categories | Flatten Category Groups to Categories | Categories Only              |                                                                                                 |
| Categories Only               | Set                              | Simplify categories to id and name                | Hide Internal Categories      | Group Categories              |                                                                                                 |
| Group Categories              | Aggregate                       | Aggregate categories array                         | Categories Only               | Merge                        |                                                                                                 |
| Get Transactions              | HTTP Request                    | Fetch uncategorized transactions                   | Variables                     | Break out Transactions        |                                                                                                 |
| Break out Transactions        | Split Out                      | Split transactions array into individual items   | Get Transactions              | Filter out transfers and invalid transactions |                                                                                                 |
| Filter out transfers and invalid transactions | Filter           | Remove transfers, deleted, categorized transactions | Break out Transactions        | Group Transactions            |                                                                                                 |
| Group Transactions            | Aggregate                      | Aggregate valid transactions array                | Filter out transfers and invalid transactions | Merge                    |                                                                                                 |
| Merge                        | Merge                         | Combine categories and transactions for processing | Group Categories, Group Transactions | Skip Categories, Loop Transactions | Sticky Note4: Wait for parallel API calls to complete before moving on.                       |
| Skip Categories, Loop Transactions | If                       | Check if transactions exist before processing     | Merge                        | Loop Transactions             |                                                                                                 |
| Loop Transactions            | Split Out                     | Process each transaction individually              | Skip Categories, Loop Transactions | AI Agent1                  |                                                                                                 |
| AI Agent1                   | Langchain Agent               | Use GPT-5-Mini to categorize transactions         | Loop Transactions, OpenAI Chat Model2 | Loop Over Items1            | Sticky Note2: ## Category Matching - Leverage Chat GPT to intelligently categorize uncategorized transactions. With 4o-mini each transaction takes about 10 seconds. There likely is room to speed this up. |
| OpenAI Chat Model2           | Langchain LM Chat OpenAI       | Connects AI agent to GPT-5-Mini model             | AI Agent1                    | AI Agent1                    |                                                                                                 |
| Structured Output Parser1    | Langchain Structured Output Parser | Validates AI output schema                         | AI Agent1                    | AI Agent1                    |                                                                                                 |
| Loop Over Items1             | Split In Batches              | Process transactions in batches of 10              | YNAB modify transactions, Aggregate1 | Aggregate, Aggregate1        | Sticky Note3: ## Batch Upload - Batch upload transactions. Each transaction will have the color changed to 'yellow' and tagged 'n8n'. |
| Aggregate                   | Aggregate                    | Aggregate batch transactions for YNAB update      | Loop Over Items1              | YNAB modify transactions      |                                                                                                 |
| Aggregate1                  | Aggregate                    | Aggregate batch transactions for Discord message  | Loop Over Items1              | Discord                      |                                                                                                 |
| YNAB modify transactions    | HTTP Request                 | Patch updated transactions back to YNAB            | Aggregate                    | Loop Over Items1              |                                                                                                 |
| Discord                    | Discord                      | Post summary notification to Discord webhook      | Aggregate1                   | None                        | Sticky Note: ## Auto Budgeted Notification, includes count and transaction details with a link to YNAB account. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Type: Manual Trigger  
   - Name: "When clicking ‘Execute workflow’"  
   - No parameters needed  

2. **Create Variables Node**  
   - Type: Set  
   - Name: "Variables"  
   - Assign the following string variables:  
     - budget_id: "CHANGEME" (replace with real YNAB budget ID)  
     - account_id: "CHANGEME" (replace with real YNAB account ID)  
     - api_key: "CHANGEME" (replace with YNAB API personal access token)  
     - previous_days: "30" (number of days to look back for transactions)  
   - Connect output from Manual Trigger  

3. **Create Get Categories Node**  
   - Type: HTTP Request  
   - Name: "Get Categories"  
   - Method: GET  
   - URL: `https://api.ynab.com/v1/budgets/{{ $json.budget_id }}/categories`  
   - Headers:  
     - accept: application/json  
     - Authorization: `Bearer {{ $json.api_key }}`  
   - Connect input from Variables node  

4. **Create Get Category Groups Node**  
   - Type: Split Out  
   - Name: "Get Category Groups"  
   - Field to split out: `data.category_groups`  
   - Connect input from Get Categories node  

5. **Create Remove Invalid Category Groups Node**  
   - Type: Filter  
   - Name: "Remove Invalid Category Groups"  
   - Conditions:  
     - hidden == false  
     - deleted == false  
   - Connect input from Get Category Groups node  

6. **Create Flatten Category Groups to Categories Node**  
   - Type: Split Out  
   - Name: "Flatten Category Groups to Categories"  
   - Field to split out: `categories` (from each category group)  
   - Connect input from Remove Invalid Category Groups node  

7. **Create Hide Internal Categories Node**  
   - Type: Filter  
   - Name: "Hide Internal Categories"  
   - Conditions:  
     - hidden == false  
     - deleted == false  
     - category_group_name != "Internal Master Category"  
   - Connect input from Flatten Category Groups to Categories node  

8. **Create Categories Only Node**  
   - Type: Set  
   - Name: "Categories Only"  
   - Assign fields:  
     - id: `{{$json.id}}`  
     - name: `{{$json.name}}`  
   - Connect input from Hide Internal Categories node  

9. **Create Group Categories Node**  
   - Type: Aggregate  
   - Name: "Group Categories"  
   - Aggregate all items into field "categories"  
   - Connect input from Categories Only node  

10. **Create Get Transactions Node**  
    - Type: HTTP Request  
    - Name: "Get Transactions"  
    - Method: GET  
    - URL: `https://api.ynab.com/v1/budgets/{{ $json.budget_id }}/accounts/{{ $json.account_id }}/transactions`  
    - Query parameters:  
      - since_date: `={{ $today.minus({ days: $json.previous_days }).format('yyyy-MM-dd') }}`  
      - type: uncategorized  
    - Headers:  
      - accept: application/json  
      - Authorization: `Bearer {{ $json.api_key }}`  
    - Connect input from Variables node  

11. **Create Break out Transactions Node**  
    - Type: Split Out  
    - Name: "Break out Transactions"  
    - Field to split out: `data.transactions`  
    - Connect input from Get Transactions node  

12. **Create Filter out transfers and invalid transactions Node**  
    - Type: Filter  
    - Name: "Filter out transfers and invalid transactions"  
    - Conditions:  
      - category_id does not exist  
      - deleted == false  
      - category_name == "Uncategorized"  
      - transfer_account_id is empty  
      - transfer_transaction_id is empty  
    - Connect input from Break out Transactions node  

13. **Create Group Transactions Node**  
    - Type: Aggregate  
    - Name: "Group Transactions"  
    - Aggregate all filtered transactions into field "transactions"  
    - Connect input from Filter out transfers and invalid transactions node  

14. **Create Merge Node**  
    - Type: Merge  
    - Name: "Merge"  
    - Connect inputs from Group Categories (left input) and Group Transactions (right input)  

15. **Create Skip Categories, Loop Transactions Node**  
    - Type: If  
    - Name: "Skip Categories, Loop Transactions"  
    - Condition: check if `transactions` array exists in merged data  
    - Connect input from Merge node  

16. **Create Loop Transactions Node**  
    - Type: Split Out  
    - Name: "Loop Transactions"  
    - Field to split out: `transactions`  
    - Connect input from Skip Categories, Loop Transactions (true branch)  

17. **Create AI Agent1 Node**  
    - Type: Langchain Agent  
    - Name: "AI Agent1"  
    - Parameters:  
      - Prompt includes: JSON.stringify categories and current transaction, instructions for matching category, setting output fields category_id, category_name, flag_color="yellow", flag_name="n8n" if matched  
      - System message: "You are a helpful assistant who is tasked with categorizing budget items."  
      - Enable output parser  
    - Connect input from Loop Transactions node  

18. **Create OpenAI Chat Model2 Node**  
    - Type: Langchain LM Chat OpenAI  
    - Name: "OpenAI Chat Model2"  
    - Model: gpt-5-mini  
    - Credentials: OpenAI API key configured  
    - Connect input from AI Agent1 (languageModel interface)  

19. **Create Structured Output Parser1 Node**  
    - Type: Langchain Structured Output Parser  
    - Name: "Structured Output Parser1"  
    - Input schema: JSON schema describing transaction object fields and types (including subtransactions)  
    - Connect input from AI Agent1 (outputParser interface)  

20. **Create Loop Over Items1 Node**  
    - Type: Split In Batches  
    - Name: "Loop Over Items1"  
    - Batch size: 10  
    - Connect input from YNAB modify transactions node (see step 22) and Aggregate1 node (for Discord)  

21. **Create Aggregate Node**  
    - Type: Aggregate  
    - Name: "Aggregate"  
    - Aggregate output field named "transactions" from batch results  
    - Connect input from Loop Over Items1 (batch for YNAB upload)  

22. **Create YNAB modify transactions Node**  
    - Type: HTTP Request  
    - Name: "YNAB modify transactions"  
    - Method: PATCH  
    - URL: `https://api.ynab.com/v1/budgets/{{budget_id}}/transactions`  
    - Body (JSON): `{ "transactions": {{ JSON.stringify($json.transactions, null, 2) }} }`  
    - Headers:  
      - accept: application/json  
      - Authorization: Bearer token from Variables node  
    - Connect input from Aggregate node  
    - Connect output to Loop Over Items1 node  

23. **Create Aggregate1 Node**  
    - Type: Aggregate  
    - Name: "Aggregate1"  
    - Aggregate field: data.transactions for Discord notification  
    - Connect input from Loop Over Items1 (batch for Discord)  

24. **Create Discord Node**  
    - Type: Discord  
    - Name: "Discord"  
    - Webhook authentication configured with Discord webhook credentials  
    - Content template example:  
      ```
      Auto budgeted  {{ $json.transactions[0].length }} transactions.

      {{ $json.transactions[0].map(t => '- ' + t.payee_name + ' | ' + t.category_name + ' | $' + (t.amount / 1000)).join('\n') }}

      https://app.ynab.com/{{ $json.budget_id }}/accounts/{{ $json.account_id }}
      ```  
    - Username: "YNAB Budget Bot"  
    - Avatar URL: YNAB icon URL  
    - Connect input from Aggregate1 node  

---

### 5. General Notes & Resources

| Note Content                                                                                             | Context or Link                                              |
|---------------------------------------------------------------------------------------------------------|--------------------------------------------------------------|
| Workflow uses GPT-5-Mini model via Langchain for categorization; expects about 10 seconds per transaction processing time. | Sticky Note2: Category Matching block                        |
| Batch upload to YNAB is done in groups of 10 transactions to optimize API calls and reduce rate limits.  | Sticky Note3: Batch Upload block                              |
| Workflow waits for parallel API calls to complete before proceeding to next steps to ensure data consistency. | Sticky Note4: Merge node block                               |
| Discord notification includes transaction count, payee, category, and amount summary with direct YNAB account link. | Discord node and notification formatting                      |
| Replace all "CHANGEME" placeholders with actual YNAB IDs and API keys before running the workflow.       | Variables node setup                                          |
| YNAB API documentation: https://api.youneedabudget.com/                                                 | Reference for API endpoints and authentication details       |
| OpenAI API documentation: https://platform.openai.com/docs/                                             | Reference for model parameters and API usage                 |
| Langchain n8n nodes documentation: https://docs.n8n.io/integrations/official/                          | Details on AI integration nodes                              |

---

This structured document comprehensively explains the entire "Auto-Categorize YNAB Transactions with GPT-5-Mini and Discord Notifications" workflow, enabling replication, modification, and troubleshooting for advanced users and AI agents.