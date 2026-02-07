Automate Multi-Bank Transaction Sync & Reporting with GoCardless & Maybe Finance

https://n8nworkflows.xyz/workflows/automate-multi-bank-transaction-sync---reporting-with-gocardless---maybe-finance-6284


# Automate Multi-Bank Transaction Sync & Reporting with GoCardless & Maybe Finance

### 1. Workflow Overview

This workflow automates the synchronization and reporting of bank transactions from multiple bank accounts (specifically Revolut Pro and Revolut Personal) using the GoCardless Bank Account Data API. It then aggregates these transactions and creates corresponding entries in the "Maybe Finance" system via its API. After processing, a weekly overview email is sent to notify the user of the compiled transaction data.

**Use cases targeted:**

- Weekly automated bank transaction fetching from multiple sources/accounts.
- Aggregation and normalization of transaction data.
- Automated creation of transaction records in a financial management system (Maybe Finance).
- Sending a notification email summarizing the weekly transaction overview.

---

**Logical Blocks:**

- **1.1 Scheduled Trigger**: Initiates the workflow weekly.
- **1.2 Authentication & Setup**: Obtains access tokens for API calls and fetches necessary account IDs.
- **1.3 Fetch Transactions from Bank Accounts**: Calls GoCardless API for Revolut Pro and Revolut Personal transactions.
- **1.4 Data Transformation & Merging**: Extracts and normalizes transaction data, merges into a unified array.
- **1.5 Create Transactions in Maybe Finance**: Posts each normalized transaction to Maybe Finance.
- **1.6 Notification Email**: Sends a weekly overview email via Resend service.
- **1.7 Configuration & Instruction Notes**: Sticky notes provide instructions, documentation links, and reminders.

---

### 2. Block-by-Block Analysis

#### Block 1.1: Scheduled Trigger

- **Overview:**  
  Starts the workflow execution every Monday at 4 AM, triggering the whole process on a weekly schedule.

- **Nodes Involved:**  
  - Schedule Trigger

- **Node Details:**

  - **Schedule Trigger**  
    - Type: Schedule Trigger  
    - Configuration:  
      - Interval: Weekly  
      - Trigger at: Monday, 4:00 AM  
    - Inputs: None (start node)  
    - Outputs: To "Get access token" node  
    - Edge Cases: Workflow only triggers once per week as configured; misconfiguration could lead to no or multiple triggers.  
    - Notes: Ensures workflow runs regularly without manual intervention.

---

#### Block 1.2: Authentication & Setup

- **Overview:**  
  Obtains OAuth or API access tokens from GoCardless Bank Account Data API, fetches institution IDs and account IDs necessary for querying transactions.

- **Nodes Involved:**  
  - Get access token  
  - Step 2 - Get institution id  
  - Step 3a - User agreement with first Revolut Account  
  - Step 3a - User agreement with second Revolut Account  
  - Step 4 - Building link with Revolut  
  - Step 5 - Get account id  
  - Get accounts id from Maybe  
  - Sticky Notes (configuration and instructions)

- **Node Details:**

  - **Get access token**  
    - Type: HTTP Request  
    - Role: Requests new access token from GoCardless API for authentication.  
    - Configuration: POST to `https://bankaccountdata.gocardless.com/api/v2/token/new/`  
      - Body params: `secret_id`, `secret_key` (credentials)  
      - Headers: Accept JSON  
    - Inputs: From Schedule Trigger  
    - Outputs: Provides token in JSON field `access` for downstream authorization.  
    - Edge Cases: Auth failure if invalid secrets; token expires in 24h - must run workflow timely.

  - **Step 2 - Get institution id**  
    - Type: HTTP Request  
    - Role: Fetches institution IDs filtered by country (Netherlands "nl").  
    - Configuration: GET to `https://bankaccountdata.gocardless.com/api/v2/institutions?country=nl`  
      - Header: Authorization Bearer token from previous node  
    - Inputs: From "Get access token"  
    - Outputs: List of institutions for user to select (manual or automated next steps).  
    - Edge Cases: Token expiry, network issues.

  - **Step 3a - User agreement with first Revolut Account**  
    - Type: HTTP Request  
    - Role: Creates user agreement for first bank account (example uses ABNAMRO).  
    - Configuration: POST JSON with institution ID, access scope, max days.  
    - Inputs: Requires valid token.  
    - Outputs: Agreement object for next steps.  
    - Edge Cases: Invalid institution ID, token expiry.

  - **Step 3a - User agreement with second Revolut Account**  
    - Type: HTTP Request  
    - Same as above but for Revolut institution ID `REVOLUT_REVOGB21`.

  - **Step 4 - Building link with Revolut**  
    - Type: HTTP Request  
    - Role: Creates requisition with redirect URL and institution ID.  
    - Configuration: POST to `/requisitions/` with redirect URL and institution ID.  
    - Inputs: Token, user agreements.  
    - Outputs: Link for user to authorize account connection.

  - **Step 5 - Get account id**  
    - Type: HTTP Request  
    - Role: Fetches account IDs after requisition creation.  
    - Configuration: GET from `/requisitions/{requisition_id}/`.  
    - Inputs: Token and requisition ID.  
    - Outputs: Account IDs needed to fetch transactions.

  - **Get accounts id from Maybe**  
    - Type: HTTP Request  
    - Role: Fetches account IDs from Maybe Finance (local API at `localhost:3005`).  
    - Configuration: GET `http://localhost:3005/api/v1/accounts` with API key header.  
    - Inputs: None (manual or prior setup).  
    - Outputs: Account IDs to map transactions.

  - **Sticky Notes**  
    - Provide instructions to run these steps once for setup and guidance to avoid rate limits.  
    - Link to GoCardless docs: https://developer.gocardless.com/bank-account-data/quick-start-guide  
    - Warnings about token validity and rate limiting.

---

#### Block 1.3: Fetch Transactions from Bank Accounts

- **Overview:**  
  Retrieves transactions for the previous week from both Revolut Pro and Revolut Personal accounts using the GoCardless API.

- **Nodes Involved:**  
  - Get Revolut Pro transactions  
  - Get Revolut Personal transactions  
  - Extract booked - Revolut Pro  
  - Extract booked - Revolut Personal

- **Node Details:**

  - **Get Revolut Pro transactions**  
    - Type: HTTP Request  
    - Role: Fetches transactions for Revolut Pro account for last week.  
    - Configuration: GET to `/accounts/<account_id>/transactions` with query params:  
      - date_from: One week ago (start of last week minus 7 days)  
      - date_to: End of last week (start of last week minus 1 day)  
      - Headers: Authorization Bearer token, Accept JSON  
    - Inputs: Token from "Get access token" node.  
    - Outputs: Transactions JSON with nested `transactions.booked` field.  
    - Edge Cases: Invalid account ID, token expiry, empty transaction set.

  - **Get Revolut Personal transactions**  
    - Same as above but for personal account ID.

  - **Extract booked - Revolut Pro / Revolut Personal**  
    - Type: Item Lists  
    - Role: Extracts the `transactions.booked` array from fetched data into individual items for processing.  
    - Inputs: From respective GET transactions nodes.  
    - Outputs: Single transaction items for transformation.

---

#### Block 1.4: Data Transformation & Merging

- **Overview:**  
  Normalizes the transaction data structure for both sources, sets required fields, and merges them into a single array.

- **Nodes Involved:**  
  - Set transactions for Revolut Pro  
  - Set transactions for Revolut Personal  
  - Merge all transactions in one array

- **Node Details:**

  - **Set transactions for Revolut Pro / Revolut Personal**  
    - Type: Set  
    - Role: Transforms raw transaction data into normalized JSON format for Maybe Finance.  
    - Configuration:  
      - Creates an object with keys:  
        - account_id: (to be filled manually or via mapping)  
        - name: Uses creditorName or first element of remittanceInformationUnstructuredArray  
        - date: bookingDate  
        - amount: absolute value of transactionAmount.amount  
        - currency: transactionAmount.currency  
        - nature: "income" if amount >= 0 else "expense"  
    - Inputs: Individual transaction items from extraction nodes.  
    - Outputs: Single normalized transaction objects.  
    - Edge Cases: Missing creditorName or remittance info, non-numeric amounts.

  - **Merge all transactions in one array**  
    - Type: Merge  
    - Role: Combines the two streams (Pro and Personal) into one array for batch processing.  
    - Inputs: Both Set transactions nodes outputs.  
    - Outputs: Unified array of transactions for Maybe Finance API calls.

---

#### Block 1.5: Create Transactions in Maybe Finance

- **Overview:**  
  Sends each normalized transaction to Maybe Finance's API to create the transaction records.

- **Nodes Involved:**  
  - Create transactions to Maybe  
  - Resend

- **Node Details:**

  - **Create transactions to Maybe**  
    - Type: HTTP Request  
    - Role: POSTs each transaction to `http://localhost/api/v1/transactions/` API endpoint.  
    - Configuration:  
      - Method: POST  
      - Body: JSON with transaction details mapped from normalized object.  
      - Header: X-Api-Key for Maybe Finance authentication.  
    - Inputs: Merged transaction array.  
    - Outputs: Confirmation or error response per transaction.  
    - Edge Cases: API failures, validation errors, missing keys, rate limits.

  - **Resend**  
    - Type: Resend (email sending node)  
    - Role: Sends notification email with weekly overview link.  
    - Configuration:  
      - HTML content with branding and message  
      - Subject: "Weekly transactions overview"  
      - Uses Resend API credentials.  
    - Inputs: After transaction creation completes (execute once).  
    - Outputs: Email sent confirmation.  
    - Edge Cases: Email sending failures, API auth errors.

---

#### Block 1.6: Configuration & Instruction Notes (Sticky Notes)

- **Overview:**  
  Contains multiple sticky notes to guide users on setup, rate limiting, documentation, and usage.

- **Nodes Involved:**  
  - Sticky Note  
  - Sticky Note1  
  - Sticky Note2  
  - Sticky Note3  
  - Sticky Note4

- **Content Highlights:**  
  - Links to GoCardless quick start guide.  
  - Instructions on running nodes in correct order during initial setup.  
  - Warnings about token lifetime and API rate limits.  
  - Notes about changing placeholder account IDs to user's own.  
  - Guidance on fetching Maybe Finance accounts before transaction creation.

---

### 3. Summary Table

| Node Name                          | Node Type                  | Functional Role                             | Input Node(s)                    | Output Node(s)                   | Sticky Note                                                                                                              |
|-----------------------------------|----------------------------|---------------------------------------------|---------------------------------|---------------------------------|--------------------------------------------------------------------------------------------------------------------------|
| Schedule Trigger                  | Schedule Trigger           | Weekly initiation of workflow                | None                            | Get access token                |                                                                                                                          |
| Get access token                 | HTTP Request               | Obtain API token from GoCardless             | Schedule Trigger                | Get Revolut Personal transactions, Get Revolut Pro transactions | Sticky Note1, Sticky Note                                                                                               |
| Get Revolut Pro transactions    | HTTP Request               | Fetch Revolut Pro transactions from GoCardless | Get access token                | Extract booked - Revolut Pro    | Sticky Note2                                                                                                             |
| Get Revolut Personal transactions | HTTP Request               | Fetch Revolut Personal transactions          | Get access token                | Extract booked - Revolut Personal | Sticky Note2                                                                                                             |
| Extract booked - Revolut Pro    | Item Lists                 | Extract booked transactions array            | Get Revolut Pro transactions    | Set transactions for Revolut Pro |                                                                                                                          |
| Extract booked - Revolut Personal | Item Lists                 | Extract booked transactions array            | Get Revolut Personal transactions | Set transactions for Revolut Personal |                                                                                                                          |
| Set transactions for Revolut Pro | Set                        | Normalize Revolut Pro transaction data       | Extract booked - Revolut Pro    | Merge all transactions in one array | Sticky Note3                                                                                                             |
| Set transactions for Revolut Personal | Set                    | Normalize Revolut Personal transaction data  | Extract booked - Revolut Personal | Merge all transactions in one array | Sticky Note3                                                                                                             |
| Merge all transactions in one array | Merge                    | Combine all normalized transactions           | Set transactions for Revolut Pro, Set transactions for Revolut Personal | Create transactions to Maybe    |                                                                                                                          |
| Create transactions to Maybe     | HTTP Request               | Post transactions to Maybe Finance API       | Merge all transactions in one array | Resend                        | Sticky Note3                                                                                                             |
| Resend                          | Resend Email Node          | Send weekly overview notification email      | Create transactions to Maybe    | None                           |                                                                                                                          |
| Get accounts id from Maybe       | HTTP Request               | Fetch account IDs from Maybe Finance          | None                           | None                           | Sticky Note4                                                                                                             |
| Step 2 - Get institution id      | HTTP Request               | Fetch institution IDs (setup)                 | Get access token                | Step 3a - User agreement nodes  | Sticky Note                                                                                                              |
| Step 3a - User agreement with first Revolut Account | HTTP Request | Create user agreement for first bank account | Step 2 - Get institution id     | None                           | Sticky Note                                                                                                              |
| Step 3a - User agreement with second Revolut Account | HTTP Request | Create user agreement for second bank account | Step 2 - Get institution id     | None                           | Sticky Note                                                                                                              |
| Step 4 - Building link with Revolut | HTTP Request             | Create requisition with redirect and institution | Step 3a nodes                  | Step 5 - Get account id         | Sticky Note                                                                                                              |
| Step 5 - Get account id          | HTTP Request               | Fetch account IDs from requisition            | Step 4 - Building link with Revolut | None                           | Sticky Note                                                                                                              |
| Sticky Note                     | Sticky Note                | Run once configuration and GoCardless docs    | None                           | None                           | ## Run once - Configuration\nAfter getting the access token, follow the GoCardless steps from their docs and run these nodes accordingly in the right order.\nGoCardless docs: https://developer.gocardless.com/bank-account-data/quick-start-guide |
| Sticky Note1                    | Sticky Note                | Setup weekly workflow instructions             | None                           | None                           | ## Set up weekly workflow\nAfter linking the bank accounts, you can request access token (lasts 24h) and use that to request the transactions from all your bank accounts. You have 4 requests per bank account per day before you hit your rate limit. Use them wisely. |
| Sticky Note2                    | Sticky Note                | GoCardless fetch transactions explanation      | None                           | None                           | ## GoCardless - Fetch transactions\nFirst we fetch transactions from GoCardless for all bank accounts that we have connected. Change the <account_id> to your own id. |
| Sticky Note3                    | Sticky Note                | Maybe Finance create transactions explanation  | None                           | None                           | ## Maybe Finance - Create transactions\nCombine transactions in one object, call the API recursively for each of the transaction to create them to Maybe Finance. Change account id in the json to your own account id. |
| Sticky Note4                    | Sticky Note                | Fetch Maybe Finance accounts instructions       | None                           | None                           | ## Get Maybe Finance accounts\nAfter creating the respective accounts in Maybe Finance, run a GET request to fetch all account ids to insert them to the "Set" nodes later. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**  
   - Type: Schedule Trigger  
   - Configure: Weekly trigger every Monday at 4 AM.

2. **Create "Get access token" Node**  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://bankaccountdata.gocardless.com/api/v2/token/new/`  
   - Body Parameters (Raw or Form): `secret_id`, `secret_key` (set your credentials)  
   - Headers: `Accept: application/json`  
   - Connect Schedule Trigger output to this node input.

3. **Set up nodes for User Agreement and Institution Access (optional for initial setup):**

   a. **Step 2 - Get institution id**  
      - HTTP Request GET to `https://bankaccountdata.gocardless.com/api/v2/institutions?country=nl`  
      - Header: `Authorization: Bearer {{ $json.access }}`  
      - Input from "Get access token"

   b. **Step 3a - User agreement nodes (two separately for each bank):**  
      - HTTP Request POST to `https://bankaccountdata.gocardless.com/api/v2/agreements/enduser/`  
      - JSON Body:  
        ```json
        {
          "institution_id": "INSTITUTION_ID",
          "max_historical_days": "180",
          "access_valid_for_days": "90",
          "access_scope": ["balances","details","transactions"]
        }
        ```  
      - Header: Authorization Bearer token  
      - Connect output from "Step 2 - Get institution id"

   c. **Step 4 - Building link with Revolut**  
      - HTTP Request POST to `https://bankaccountdata.gocardless.com/api/v2/requisitions/`  
      - Body: `redirect` URL and `institution_id`  
      - Header: Authorization Bearer token  
      - Input from one of the user agreement nodes.

   d. **Step 5 - Get account id**  
      - HTTP Request GET to `https://bankaccountdata.gocardless.com/api/v2/requisitions/{requisition_id}/`  
      - Header: Authorization Bearer token  
      - Input from Step 4.

4. **Create nodes to fetch transactions for Revolut Pro and Personal:**

   - **Get Revolut Pro transactions**  
     - HTTP Request GET to `https://bankaccountdata.gocardless.com/api/v2/accounts/<account_id>/transactions`  
     - Query Params:  
       - `date_from` = One week ago start date (`={{ DateTime.now().startOf('week').minus({days: 7}).toFormat('yyyy-MM-dd') }}`)  
       - `date_to` = End of last week (`={{ DateTime.now().startOf('week').minus({days: 1}).toFormat('yyyy-MM-dd') }}`)  
     - Headers: Accept JSON, Authorization Bearer token  
     - Input from "Get access token"

   - **Get Revolut Personal transactions**  
     - Same as above with different `<account_id>`

5. **Create extraction nodes:**

   - **Extract booked - Revolut Pro**  
     - Item Lists node  
     - Split out field: `transactions.booked`  
     - Input from Revolut Pro transactions node.

   - **Extract booked - Revolut Personal**  
     - Same as above with Revolut Personal transactions.

6. **Create Set nodes to normalize transaction data:**

   - **Set transactions for Revolut Pro**  
     - Set node with raw JSON output:  
       ```javascript
       {
         "transaction": {
           "account_id": "",
           "name": "{{ $json.creditorName || $json.remittanceInformationUnstructuredArray[0] }}",
           "date": "{{ $json.bookingDate }}",
           "amount": "{{ Math.abs(parseFloat($json.transactionAmount.amount)) }}",
           "currency": "{{ $json.transactionAmount.currency }}",
           "nature": "{{ parseFloat($json.transactionAmount.amount) >= 0 ? 'income' : 'expense' }}"
         }
       }
       ```  
     - Input from Extract booked - Revolut Pro

   - **Set transactions for Revolut Personal**  
     - Same structure as above  
     - Input from Extract booked - Revolut Personal

7. **Merge transactions:**

   - Merge node  
   - Combine inputs from both Set transactions nodes  
   - Output as single merged array.

8. **Create transactions in Maybe Finance:**

   - HTTP Request node  
   - POST to `http://localhost/api/v1/transactions/`  
   - JSON body:  
     ```json
     {
       "transaction": {
         "account_id": "{{ $json.transaction.account_id }}",
         "name": "{{ $json.transaction.name }}",
         "date": "{{ $json.transaction.date }}",
         "amount": {{ $json.transaction.amount }},
         "currency": "{{ $json.transaction.currency }}",
         "nature": "{{ $json.transaction.nature }}"
       }
     }
     ```  
   - Headers: Include `X-Api-Key` credential for Maybe Finance API  
   - Input from Merge node.

9. **Send notification email:**

   - Resend node  
   - Configure with Resend API credentials  
   - Subject: "Weekly transactions overview"  
   - HTML content: Use provided HTML template with branding and overview link  
   - Input from "Create transactions to Maybe" node  
   - Set `Execute Once` to true to avoid multiple emails.

10. **Optional: Create HTTP Request node to fetch accounts from Maybe Finance for setup**

    - GET `http://localhost:3005/api/v1/accounts` with API key header  
    - Use data to fill `account_id` in Set nodes before running transaction creation.

---

### 5. General Notes & Resources

| Note Content                                                                                                 | Context or Link                                                                                  |
|--------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| After getting the access token, follow the GoCardless steps from their docs and run these nodes accordingly | https://developer.gocardless.com/bank-account-data/quick-start-guide                             |
| Token lasts 24h; you have 4 requests per bank account per day before rate limits apply                        | Rate limiting reminder from Sticky Note1                                                      |
| Change `<account_id>` placeholders to your actual account IDs for API calls                                  | Important to replace placeholders in transaction fetching nodes                                |
| The email sends a branded weekly overview with link to your hosted dashboard                                 | Email uses Resend API with HTML content including branding and overview link                    |
| Maybe Finance API is assumed to be available locally at `localhost` with API key for authentication          | Local environment requirement for API requests                                                |
| Workflow inactive by default: activate after proper setup and credential configuration                       | Workflow status is inactive initially; enable after setup                                      |

---

**Disclaimer:**  
The provided text is exclusively derived from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All manipulated data is legal and public.