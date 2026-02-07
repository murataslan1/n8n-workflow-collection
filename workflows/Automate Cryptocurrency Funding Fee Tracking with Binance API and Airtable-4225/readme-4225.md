Automate Cryptocurrency Funding Fee Tracking with Binance API and Airtable

https://n8nworkflows.xyz/workflows/automate-cryptocurrency-funding-fee-tracking-with-binance-api-and-airtable-4225


# Automate Cryptocurrency Funding Fee Tracking with Binance API and Airtable

### 1. Workflow Overview

This workflow automates the tracking of cryptocurrency funding fees from Binance Futures API and synchronizes relevant token and position data with Airtable. It is designed to:

- Retrieve funding fee income data and open positions from Binance Futures.
- Aggregate and enrich this data with detailed token information stored in Airtable.
- Create or update records in Airtable representing tokens and funding statements.
- Regularly update token prices from Binance and reflect them in Airtable.

The workflow is logically divided into two main scenarios and their supporting sub-tasks:

- **1.1 Scenario 1 - Funding Fees Tracking:**  
  Fetch funding fee income from Binance, aggregate it with current positions and token data, then create or update funding statements and tokens in Airtable.

- **1.2 Scenario 2 - Token Price Update:**  
  Periodically update token prices by fetching current prices from Binance and updating Airtable records.

- **1.3 Support Blocks:**  
  Supporting blocks handle authentication signature generation, data aggregation, and splitting arrays for iterative processing.

---

### 2. Block-by-Block Analysis

#### 2.1 Scenario 1 - Funding Fees Tracking

**Overview:**  
This block fetches funding fee income data from Binance, enriches it with current position and token information, and updates Airtable with funding fee statements. It ensures new tokens are created in Airtable if not already present.

**Nodes Involved:**  
- Schedule Trigger (disabled)  
- Edit Fields4  
- Crypto3 (HMAC signature for funding fee request)  
- Get Fees2 (Binance API request for income)  
- Aggregate Fees  
- Edit Fields1  
- Crypto2 (HMAC signature for positions request)  
- Get Positions (Binance API request for positions)  
- Aggregate Positions  
- Get Tokens (Airtable fetch tokens)  
- Aggregate Tokens  
- Edit Fields2  
- Split Out  
- If (check if token exists)  
- Create Token (Airtable create token)  
- Create Statement (Airtable create funding statement for new token)  
- Create Statement1 (Airtable create funding statement for existing token)

**Node Details:**

- **Schedule Trigger**  
  - Type: Schedule Trigger  
  - Role: Triggers funding fee tracking periodically (disabled in current setup).  
  - Configuration: Cron expression for 1:03, 9:03, and 17:03 daily.  
  - Edge Cases: Disabled, so manual or external trigger needed.

- **Edit Fields4**  
  - Type: Set Node  
  - Role: Sets `timestamp` (current time) and `startTime` (8 hours ago) for query.  
  - Key Expressions: `{{$now.format('x')}}` for timestamp, `{{$now.minus(8,'hours').format('x')}}` for startTime.  
  - Inputs: Trigger output or previous node.  
  - Outputs: JSON with `timestamp` and `startTime`.

- **Crypto3**  
  - Type: Crypto (HMAC SHA256)  
  - Role: Generates API signature for funding fee API call using secret key.  
  - Configuration: Input string includes `recvWindow=20000`, `timestamp`, `incomeType=FUNDING_FEE`, and `startTime`.  
  - Secret: Binance API secret key (hardcoded in node).  
  - Edge Cases: Signature failure if secret incorrect or data malformed.

- **Get Fees2**  
  - Type: HTTP Request  
  - Role: Calls Binance `/fapi/v1/income` endpoint to get funding fee incomes with parameters for funding fees and time window.  
  - Authentication: HTTP header using API key credential.  
  - Query Params: `recvWindow`, `timestamp`, `signature`, `incomeType`, `startTime`.  
  - Edge Cases: API limits, authentication failure, empty data responses.

- **Aggregate Fees**  
  - Type: Aggregate  
  - Role: Aggregates all items from funding fees response into one data array for easier processing.

- **Edit Fields1**  
  - Type: Set Node  
  - Role: Adds current timestamp to data for next signature generation.  
  - Key Expressions: `{{$now.format('x')}}`.

- **Crypto2**  
  - Type: Crypto (HMAC SHA256)  
  - Role: Generates signature for Binance positions API request.  
  - Input string uses `recvWindow=20000` and current `timestamp`.  
  - Secret: Binance API secret key.

- **Get Positions**  
  - Type: HTTP Request  
  - Role: Calls Binance `/fapi/v2/positionRisk` endpoint to get current futures positions.  
  - Authentication: HTTP header with API key.  
  - Query Params: `recvWindow`, `timestamp`, `signature`.  
  - Edge Cases: Timeout, auth failure, empty or partial data.

- **Aggregate Positions**  
  - Type: Aggregate  
  - Role: Aggregates positions data into single array for further processing.

- **Get Tokens**  
  - Type: Airtable  
  - Role: Fetches existing tokens from Airtable "Tokens" table to correlate with Binance symbols.  
  - Credentials: Airtable API token.  
  - Edge Cases: API limits, missing token data.

- **Aggregate Tokens**  
  - Type: Aggregate  
  - Role: Aggregates Airtable token records into one array.

- **Edit Fields2**  
  - Type: Set Node  
  - Role: Maps and merges fee data with position and token data creating a combined array of funding fee items with enriched info: position size, prices, liquidation price, Airtable token ID (or null if missing).  
  - Key Expression: Uses JavaScript to map fees and lookup positions and tokens by symbol.

- **Split Out**  
  - Type: Split Out  
  - Role: Splits the combined array into individual items for processing through conditional logic.

- **If**  
  - Type: If  
  - Role: Checks if the token exists in Airtable (`tokenId` property exists).  
  - Condition: `tokenId` exists and is not empty.  
  - Branches:  
    - True: Existing token path.  
    - False: New token path.

- **Create Token**  
  - Type: Airtable  
  - Role: Creates new token record in Airtable for tokens not found previously.  
  - Parameters: Uses funding fee symbol as token name.

- **Create Statement**  
  - Type: Airtable  
  - Role: Creates a funding statement record linked to the newly created token (from Create Token).  
  - Fields: Time (converted to dateTime), asset, token (array with token id), amount, mark price, position size, liquidation price.

- **Create Statement1**  
  - Type: Airtable  
  - Role: Creates funding statement record linked to existing token (from If node true branch).  
  - Fields: Similar to Create Statement but uses token id from If node.

---

#### 2.2 Scenario 2 - Token Price Update

**Overview:**  
Periodically fetches current token prices from Binance and updates corresponding records in Airtable.

**Nodes Involved:**  
- Schedule Trigger1  
- Get Tokens1  
- Get Price  
- Update Token Prices1

**Node Details:**

- **Schedule Trigger1**  
  - Type: Schedule Trigger  
  - Role: Triggers price update every 4 hours.  
  - Configuration: Interval of 4 hours.

- **Get Tokens1**  
  - Type: Airtable  
  - Role: Fetches all tokens from Airtable to get their IDs and names (symbols).  
  - Credentials: Airtable API token.

- **Get Price**  
  - Type: HTTP Request  
  - Role: Calls Binance API `/api/v3/ticker/price` endpoint for each token symbol from Airtable.  
  - Loop: Runs for each token record (input from Get Tokens1).  
  - Error Handling: On HTTP request error, continues without stopping workflow.

- **Update Token Prices1**  
  - Type: Airtable  
  - Role: Updates token price field in Airtable with data fetched from Binance.  
  - Matching: Updates based on token `id`.  
  - Fields: `price` updated with Binance price.

---

#### 2.3 Supporting Nodes & Sticky Notes

- **Set Variables** and **Crypto** nodes in the workflow are not connected to the main scenarios and appear to be examples or legacy nodes.

- Several **Sticky Note** nodes provide contextual hints about replacing API keys/secrets and scenario labeling, e.g.:  
  - Header Auth replacement: `X-MBX-APIKEY=<your_api_key>`  
  - Secret replacement for HMAC signature.

- Sticky notes also mark the start of Scenario 1 and Scenario 2 visually.

---

### 3. Summary Table

| Node Name           | Node Type             | Functional Role                                  | Input Node(s)          | Output Node(s)         | Sticky Note                                      |
|---------------------|-----------------------|-------------------------------------------------|------------------------|------------------------|-------------------------------------------------|
| Schedule Trigger     | Schedule Trigger      | Triggers funding fee tracking (disabled)        | -                      | Edit Fields4           |                                                 |
| Edit Fields4        | Set                   | Sets timestamp and startTime for funding fees   | Schedule Trigger        | Crypto3                |                                                 |
| Crypto3             | Crypto (HMAC SHA256)  | Generates signature for funding fee API call    | Edit Fields4            | Get Fees2              | Replace Secret                                   |
| Get Fees2           | HTTP Request          | Fetches funding fee income from Binance          | Crypto3                 | Aggregate Fees          | Replace Header Auth: X-MBX-APIKEY=<your_api_key>|
| Aggregate Fees      | Aggregate             | Aggregates funding fee data                       | Get Fees2                | Edit Fields1            |                                                 |
| Edit Fields1        | Set                   | Adds timestamp for positions API request         | Aggregate Fees           | Crypto2                 |                                                 |
| Crypto2             | Crypto (HMAC SHA256)  | Generates signature for positions API call       | Edit Fields1             | Get Positions           | Replace Secret                                   |
| Get Positions       | HTTP Request          | Fetches current futures positions from Binance   | Crypto2                  | Aggregate Positions      | Replace Header Auth: X-MBX-APIKEY=<your_api_key>|
| Aggregate Positions | Aggregate             | Aggregates positions data                         | Get Positions            | Get Tokens               |                                                 |
| Get Tokens          | Airtable              | Fetches tokens from Airtable                      | Aggregate Positions       | Aggregate Tokens         |                                                 |
| Aggregate Tokens    | Aggregate             | Aggregates Airtable token records                 | Get Tokens               | Edit Fields2             |                                                 |
| Edit Fields2        | Set                   | Combines fees with positions and tokens data     | Aggregate Tokens          | Split Out                |                                                 |
| Split Out           | Split Out             | Splits combined data into individual fee items   | Edit Fields2              | If                       |                                                 |
| If                  | If                    | Checks if token exists in Airtable                | Split Out                 | Create Statement, Create Token |                                                 |
| Create Token        | Airtable              | Creates new token record if missing                | If (false branch)         | Create Statement1         |                                                 |
| Create Statement    | Airtable              | Creates funding statement for new token           | If (true branch)          | -                        |                                                 |
| Create Statement1   | Airtable              | Creates funding statement for existing token      | Create Token              | -                        |                                                 |
| Schedule Trigger1    | Schedule Trigger      | Triggers token price update every 4 hours         | -                        | Get Tokens1               | Scenario 2 - update tokens price                 |
| Get Tokens1         | Airtable              | Fetches tokens for price update                     | Schedule Trigger1         | Get Price                 |                                                 |
| Get Price           | HTTP Request          | Fetches current token price from Binance           | Get Tokens1               | Update Token Prices1      |                                                 |
| Update Token Prices1 | Airtable              | Updates token prices in Airtable                    | Get Price                 | -                        |                                                 |
| Set Variables       | Set                   | Example node, sets timestamp (unused in main flow)| -                        | Crypto                   | Example                                         |
| Crypto              | Crypto (HMAC SHA256)  | Example HMAC signature generation (unused)         | Set Variables             | Binance - Get Fees        | Replace Secret                                   |
| Binance - Get Fees  | HTTP Request          | Example API call (unused)                           | Crypto                    | -                        | Replace Header Auth: X-MBX-APIKEY=<your_api_key>|
| Sticky Note         | Sticky Note           | Labels and instructions                            | -                        | -                        | Scenario 2 - update tokens price                 |
| Sticky Note1        | Sticky Note           | Labels and instructions                            | -                        | -                        | Scenario 1 - Add funding fees                     |
| Sticky Note2        | Sticky Note           | Instruction to replace header auth                 | -                        | -                        | Replace Header Auth: X-MBX-APIKEY=<your_api_key>|
| Sticky Note3        | Sticky Note           | Instruction to replace secret                       | -                        | -                        | Replace Secret                                   |
| Sticky Note4        | Sticky Note           | Instruction to replace secret                       | -                        | -                        | Replace Secret                                   |
| Sticky Note5        | Sticky Note           | Instruction to replace header auth                 | -                        | -                        | Replace Header Auth: X-MBX-APIKEY=<your_api_key>|
| Sticky Note6        | Sticky Note           | Example label                                      | -                        | -                        | Example                                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node for Scenario 1**  
   - Type: Schedule Trigger  
   - Cron expression: `3 1,9,17 * * *` (disabled by default)  
   - Purpose: To trigger funding fee data refresh.

2. **Create Set Node ("Edit Fields4")**  
   - Set two fields:  
     - `timestamp` = current Unix time in milliseconds (`{{$now.format('x')}}`)  
     - `startTime` = timestamp 8 hours ago (`{{$now.minus(8,'hours').format('x')}}`)

3. **Create Crypto Node ("Crypto3")**  
   - Type: Crypto (HMAC SHA256)  
   - Input string: `recvWindow=20000&timestamp={{ $json.timestamp }}&incomeType=FUNDING_FEE&startTime={{ $json.startTime }}`  
   - Secret: Binance API secret key  
   - Output: Signature in field `secretKey`.

4. **Create HTTP Request Node ("Get Fees2")**  
   - URL: `https://fapi.binance.com/fapi/v1/income`  
   - Method: GET  
   - Query parameters: `recvWindow=20000`, `timestamp` from Edit Fields4, `signature` from Crypto3, `incomeType=FUNDING_FEE`, `startTime` from Edit Fields4  
   - Authentication: HTTP Header Auth with Binance API key  
   - Output: Funding fee income data.

5. **Create Aggregate Node ("Aggregate Fees")**  
   - Aggregate all incoming items into one array.

6. **Create Set Node ("Edit Fields1")**  
   - Add field `timestamp` with current Unix time.

7. **Create Crypto Node ("Crypto2")**  
   - Input string: `recvWindow=20000&timestamp={{ $json.timestamp }}`  
   - Secret: Binance API secret key  
   - Output: Signature for positions request.

8. **Create HTTP Request Node ("Get Positions")**  
   - URL: `https://fapi.binance.com/fapi/v2/positionRisk`  
   - Method: GET  
   - Query parameters: `recvWindow=20000`, `timestamp`, `signature`  
   - Authentication: HTTP Header Auth with Binance API key  
   - Output: Positions data.

9. **Create Aggregate Node ("Aggregate Positions")**  
   - Aggregate all position items into one array.

10. **Create Airtable Node ("Get Tokens")**  
    - Operation: Search  
    - Base: Binance demo Airtable base  
    - Table: Tokens  
    - Credentials: Airtable API token

11. **Create Aggregate Node ("Aggregate Tokens")**  
    - Aggregate tokens data from Airtable.

12. **Create Set Node ("Edit Fields2")**  
    - Using JavaScript, map fees data with position and token data:  
      - For each fee, find matching position and token by symbol  
      - Build enriched object with fee, position amount, mark price, liquidation price, and Airtable token ID (or null)

13. **Create Split Out Node ("Split Out")**  
    - Field to split out: `data` (the array of enriched fee items)

14. **Create If Node ("If")**  
    - Condition: Check if `tokenId` field exists and is not empty  
    - True branch: Token exists  
    - False branch: Token missing

15. **Create Airtable Node ("Create Token")**  
    - Operation: Create  
    - Base: Binance demo  
    - Table: Tokens  
    - Fields: `name` = symbol from current item

16. **Create Airtable Node ("Create Statement")**  
    - Operation: Create  
    - Base: Binance demo  
    - Table: Funding Statement  
    - Fields:  
      - time: Convert timestamp to datetime  
      - asset, amount, markPrice, positionSize, liquidationPrice from item  
      - token: array with token id (from If true branch or Create Token output)

17. **Create Airtable Node ("Create Statement1")**  
    - Similar to Create Statement, but uses token id from newly created token (Create Token node)

18. **Connect nodes according to flow:**  
    - Schedule Trigger → Edit Fields4 → Crypto3 → Get Fees2 → Aggregate Fees → Edit Fields1 → Crypto2 → Get Positions → Aggregate Positions → Get Tokens → Aggregate Tokens → Edit Fields2 → Split Out → If  
    - If true → Create Statement  
    - If false → Create Token → Create Statement1

---

19. **Create Schedule Trigger for Scenario 2 (Token Price Update)**  
    - Schedule Trigger1: Every 4 hours

20. **Create Airtable Node ("Get Tokens1")**  
    - Fetch all tokens from Airtable Tokens table

21. **Create HTTP Request Node ("Get Price")**  
    - URL: `https://api.binance.com/api/v3/ticker/price?symbol={{ $json.name }}` (loop per token)  
    - Error handling: Continue on errors

22. **Create Airtable Node ("Update Token Prices1")**  
    - Operation: Update  
    - Base & Table: Tokens  
    - Matching column: `id`  
    - Field to update: `price` with Binance price

23. **Connect Scenario 2 nodes:**  
    - Schedule Trigger1 → Get Tokens1 → Get Price → Update Token Prices1

---

24. **Add Sticky Notes** for instructions on replacing API keys/secrets and scenario labeling.

---

### 5. General Notes & Resources

| Note Content                                                                 | Context or Link                                             |
|------------------------------------------------------------------------------|-------------------------------------------------------------|
| Replace header authentication with your Binance API Key: `X-MBX-APIKEY=...` | Sticky notes near HTTP Request nodes for Binance API calls. |
| Replace secret key in Crypto nodes for HMAC signature generation             | Sticky notes near Crypto nodes for Binance API authentication. |
| Scenario 1 - Add funding fees and positions tracking                         | Sticky note labeling the first scenario block.               |
| Scenario 2 - Update tokens price every 4 hours                              | Sticky note labeling the second scenario block.              |
| Airtable base and tables used: "Binance demo" base with "Tokens" and "Funding Statement" tables | Referenced in Airtable nodes.                                 |
| Binance Futures API endpoints used: `/fapi/v1/income` and `/fapi/v2/positionRisk` | Official Binance Futures API documentation.                   |
| Funding fee income fetched only for the last 8 hours window                  | Defined in Edit Fields4 with `startTime` set to 8 hours ago. |
| The workflow requires valid Binance API key and secret with Futures permissions | Credentials setup required in n8n.                            |

---

**Disclaimer:**  
The content provided is derived exclusively from an automated workflow designed with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and publicly accessible.