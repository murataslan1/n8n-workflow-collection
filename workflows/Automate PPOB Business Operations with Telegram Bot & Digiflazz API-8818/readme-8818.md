Automate PPOB Business Operations with Telegram Bot & Digiflazz API

https://n8nworkflows.xyz/workflows/automate-ppob-business-operations-with-telegram-bot---digiflazz-api-8818


# Automate PPOB Business Operations with Telegram Bot & Digiflazz API

### 1. Workflow Overview

This workflow implements a comprehensive Telegram bot to automate PPOB (Payment Point Online Bank) business operations using the Digiflazz API. It enables users to manage mobile credit topups, check and pay postpaid bills, monitor their deposit balances, browse product price lists, and review transaction history via Telegram commands and inline keyboards.

The workflow’s logic is divided into functional blocks:

- **1.1 Input Reception & Command Routing:** Handles incoming Telegram messages and callback queries, routing them to appropriate functional branches.
- **1.2 User Interface Messaging:** Sends formatted messages and inline keyboards to users for menu navigation, prompts, and informational responses.
- **1.3 Balance Management:** Generates authenticated requests to Digiflazz, checks deposit balance, interprets API responses, and sends results.
- **1.4 Product Listing:** Fetches product price lists from Digiflazz with signature authentication, organizes products by category, and presents them with pagination.
- **1.5 Transaction Handling (Topup, Check Bill, Pay Bill):** Processes user selections for prepaid topups and postpaid bill inquiries/payments, including input prompts, validation scaffolds, and API calls.
- **1.6 Deposit Requests:** Provides deposit instruction messages with admin contacts and processing tips.
- **1.7 Transaction History:** Retrieves and displays recent transaction history (scaffolded for last 7 days).
- **1.8 Utility & Processing Nodes:** Includes signature generation, message formatting, and error handling for robust API interaction.

---

### 2. Block-by-Block Analysis

---

#### 2.1 Input Reception & Command Routing

**Overview:**  
This block captures all Telegram messages and callback queries, then dispatches them to appropriate workflow branches based on commands or inline button callback data.

**Nodes Involved:**  
- Telegram Trigger  
- Main Command Router

**Node Details:**

- **Telegram Trigger**  
  - Type: Telegram Trigger node  
  - Role: Listens for Telegram updates (`message` and `callback_query`) to initiate workflow execution.  
  - Configuration: Connected to Telegram credentials; configured to capture relevant Telegram updates.  
  - Inputs: Incoming Telegram updates  
  - Outputs: Raw JSON of messages or callback queries  
  - Edge Cases: Network or Telegram API downtime; malformed update payloads.

- **Main Command Router**  
  - Type: Switch node  
  - Role: Routes input based on message text or callback data to logical command branches.  
  - Configuration: Multiple rules matching exact strings or prefixes like `/start`, `/menu`, `topup_`, `checkbill_`, `paybill_`, etc.  
  - Key Expressions: Uses expressions like `{{$json.message?.text || $json.callback_query?.data}}`.  
  - Inputs: Telegram Trigger output  
  - Outputs: Named outputs like `welcome`, `main_menu`, `check_balance`, `list_products`, `topup_command`, etc.  
  - Edge Cases: Unknown commands lead to no routing; case sensitivity enforced; malformed or missing data in message/callback.

---

#### 2.2 User Interface Messaging

**Overview:**  
Sends interactive Telegram messages with inline keyboards for user interaction such as welcome messages, menus, prompts, and information display.

**Nodes Involved:**  
- Welcome Message  
- Main Menu  
- Send Welcome  
- Send Menu Information  
- Send Balance Result  
- Send Product Categories  
- Deposit Information  
- Send Deposit Information  
- Topup Menu  
- Send Topup Input Prompt  
- Check Bill Menu  
- Send Check Bill Input Prompt  
- Pay Bill Menu  
- Send Pay Bill Input Prompt  
- Transaction History  
- Send Transaction Information

**Node Details:**  

- All nodes are Telegram nodes that send formatted text messages with inline keyboards.  
- Key Configuration: Text content often includes Markdown formatting; chat ID dynamically extracted from the current Telegram update context.  
- Inline keyboards contain callback buttons linked to different commands for navigation or operation triggers.  
- Inputs: JSON objects containing messages or buttons to send.  
- Outputs: Telegram API responses (not used further in this workflow).  
- Edge Cases: Telegram API rate limits; invalid chat IDs; malformed message formatting; user cancelling operations via buttons.

---

#### 2.3 Balance Management

**Overview:**  
Generates authenticated requests to Digiflazz API to check deposit balance, interprets the response, and sends a status message including warning levels.

**Nodes Involved:**  
- Generate Balance Signature  
- Check Balance API  
- Format Balance Response  
- Send Balance Result

**Node Details:**

- **Generate Balance Signature**  
  - Type: Code node  
  - Role: Creates MD5 signature combining username, API key, and command `depo` for authentication.  
  - Key Expression: Uses Node.js `crypto` module for MD5 hash.  
  - Output JSON includes `cmd`, `username`, and `sign`.  
  - Edge Cases: Missing environment variables; errors in crypto module.

- **Check Balance API**  
  - Type: HTTP Request node  
  - Role: Sends POST request to Digiflazz `cek-saldo` endpoint with signed payload.  
  - Config: Timeout 30s; Content-Type `application/json`.  
  - Input: Output of signature node.  
  - Output: API response JSON.  
  - Edge Cases: Network timeout; API errors; invalid signature.

- **Format Balance Response**  
  - Type: Code node  
  - Role: Parses API response to extract balance and generate user-friendly status message with traffic-light icons (red/yellow/green).  
  - Also handles error responses with detailed advice based on error codes.  
  - Edge Cases: Missing or malformed response data; unknown error codes.

- **Send Balance Result**  
  - Type: Telegram node  
  - Role: Sends formatted balance information message to the user with navigation buttons.  
  - Inputs: Formatted message from previous node.  
  - Edge Cases: Telegram API errors.

---

#### 2.4 Product Listing

**Overview:**  
Fetches product price list from Digiflazz, groups products by category with counts, and sends an interactive menu with category buttons.

**Nodes Involved:**  
- Generate Product Signature  
- Get Products API  
- Format Product List  
- Send Product Categories

**Node Details:**

- **Generate Product Signature**  
  - Type: Code node  
  - Role: Generates MD5 signature for command `pricelist`.  
  - Output JSON includes `cmd: 'prepaid'`, `username`, and `sign`.  
  - Edge Cases: Same as balance signature node.

- **Get Products API**  
  - Type: HTTP Request node  
  - Role: Sends signed POST request to Digiflazz `price-list` endpoint.  
  - Edge Cases: Network or API errors.

- **Format Product List**  
  - Type: Code node  
  - Role: Parses product list, groups by category, counts products, builds menu text and inline keyboard buttons with pagination (two buttons per row).  
  - Adds a “Main Menu” button row.  
  - Handles error responses by sending retry and main menu buttons.  
  - Edge Cases: Empty or malformed product data.

- **Send Product Categories**  
  - Type: Telegram node  
  - Role: Sends the formatted product category list with interactive buttons.  
  - Edge Cases: Telegram API failures.

---

#### 2.5 Transaction Handling (Topup, Check Bill, Pay Bill)

**Overview:**  
Processes user selections for prepaid topups, bill checking, and bill payment. Includes prompting users for required input like phone numbers or customer IDs, validating input format, and preparing API calls.

**Nodes Involved:**  
- Process Topup Selection  
- Send Topup Input Prompt  
- Execute Transaction API  
- Process Check Bill Selection  
- Send Check Bill Input Prompt  
- Bill Inquiry API  
- Process Pay Bill Selection  
- Send Pay Bill Input Prompt

**Node Details:**

- **Process Topup Selection**  
  - Type: Code node  
  - Role: Parses callback data for topup product type, prepares prompt message and input instructions.  
  - Implements input validation regexes for phone numbers, PLN numbers, and amounts (10k - 10M IDR).  
  - Contains simple in-memory user session handling (for demo only; production requires persistent store).  
  - Outputs JSON including message, productType, userId, step, and inputPrompt.  
  - Edge Cases: Unknown product types; missing callback data.

- **Send Topup Input Prompt**  
  - Type: Telegram node  
  - Role: Sends the prompt message for user input with cancel and main menu buttons.  
  - Edge Cases: Telegram API rate limits.

- **Execute Transaction API**  
  - Type: HTTP Request node  
  - Role: Sends POST request to Digiflazz `transaction` endpoint to execute topup or payment.  
  - Edge Cases: API errors, timeouts, invalid signatures.

- **Process Check Bill Selection**  
  - Type: Code node  
  - Role: Parses bill type from callback data, prepares inquiry prompt message, input instructions, and validation similar to topup selection.  
  - Outputs JSON with message, billType, userId, step, and inputPrompt.  
  - Edge Cases: Unknown bill types.

- **Send Check Bill Input Prompt**  
  - Type: Telegram node  
  - Role: Sends inquiry prompt with cancel and main menu buttons.  
  - Edge Cases: Telegram API errors.

- **Bill Inquiry API**  
  - Type: HTTP Request node  
  - Role: Sends POST request to Digiflazz `inquiry` endpoint for bill checking or payment confirmation.  
  - Edge Cases: API failures, network errors.

- **Process Pay Bill Selection**  
  - Type: Code node  
  - Role: Similar to check bill selection but for bill payment; prepares prompt messages and validation, including tips to check bill before payment.  
  - Edge Cases: Unknown bill types.

- **Send Pay Bill Input Prompt**  
  - Type: Telegram node  
  - Role: Sends payment prompt with navigation buttons.  
  - Edge Cases: Telegram API errors.

---

#### 2.6 Deposit Requests

**Overview:**  
Provides users with deposit instructions, admin contact details, and tips for faster processing.

**Nodes Involved:**  
- Deposit Information  
- Process Deposit Information  
- Send Deposit Information

**Node Details:**

- **Deposit Information**  
  - Telegram node sending initial deposit request message with admin contact inline buttons.

- **Process Deposit Information**  
  - Code node formatting detailed deposit instructions including accepted methods, admin contacts, processing times, and tips.  
  - Outputs JSON with message and success flag.

- **Send Deposit Information**  
  - Telegram node sending the detailed deposit info message with cancel and main menu buttons.

- Edge Cases: None critical; user can cancel or navigate away.

---

#### 2.7 Transaction History

**Overview:**  
Scaffolded feature for retrieving and displaying transaction history for the last 7 days.

**Nodes Involved:**  
- Transaction History  
- Process Trancation History Information  
- Send Transaction Information

**Node Details:**

- **Transaction History**  
  - Telegram node sending initial transaction history header with navigation buttons.

- **Process Trancation History Information**  
  - Code node generating MD5 signature for command `history` and setting start/end date parameters for last 7 days.  
  - Outputs JSON for API call.

- **Send Transaction Information**  
  - Telegram node sending transaction data message with navigation buttons.

- Edge Cases: This block is scaffolded only; the HTTP call node to fetch actual history data is missing and must be implemented.

---

#### 2.8 Utility & Processing Nodes

**Overview:**  
Includes minor processing nodes that add placeholder fields or perform simple data transformations.

**Nodes Involved:**  
- Process Welcome  
- Process Menu

**Node Details:**

- Both are simple Code nodes looping over items and adding a dummy field `myNewField` (value 1).  
- Likely placeholders or legacy code; no functional impact.  
- Edge Cases: None.

---

### 3. Summary Table

| Node Name                      | Node Type             | Functional Role                              | Input Node(s)              | Output Node(s)                      | Sticky Note                                                                                                                             |
|--------------------------------|-----------------------|----------------------------------------------|----------------------------|------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------|
| Telegram Trigger               | Telegram Trigger      | Receives Telegram updates                     | -                          | Main Command Router                | See overall workflow explanation and usage guide in sticky note.                                                                        |
| Main Command Router            | Switch                | Routes commands/callbacks to workflow branches | Telegram Trigger            | Welcome Message, Main Menu, Generate Balance Signature, Generate Product Signature, Topup Menu, Deposit Information, Check Bill Menu, Pay Bill Menu, Transaction History, Process Topup Selection, Process Check Bill Selection, Process Pay Bill Selection |                                                                                                                                        |
| Welcome Message               | Telegram              | Sends welcome message with quick action buttons | Main Command Router (welcome) | Process Welcome                   |                                                                                                                                         |
| Process Welcome               | Code                  | Placeholder processing for welcome message    | Welcome Message             | Send Welcome                      |                                                                                                                                         |
| Send Welcome                 | Telegram              | Sends formatted welcome message                | Process Welcome             | -                                |                                                                                                                                         |
| Main Menu                   | Telegram              | Sends main menu with operation options         | Main Command Router (main_menu) | Process Menu                  |                                                                                                                                         |
| Process Menu                 | Code                  | Placeholder processing for main menu            | Main Menu                   | Send Menu Information             |                                                                                                                                         |
| Send Menu Information        | Telegram              | Sends main menu message                         | Process Menu                | -                                |                                                                                                                                         |
| Generate Balance Signature   | Code                  | Generates MD5 signature for balance check      | Main Command Router (check_balance) | Check Balance API             |                                                                                                                                         |
| Check Balance API            | HTTP Request          | Calls Digiflazz API to check balance            | Generate Balance Signature  | Format Balance Response           |                                                                                                                                         |
| Format Balance Response      | Code                  | Formats balance info with status and warnings  | Check Balance API           | Send Balance Result               |                                                                                                                                         |
| Send Balance Result          | Telegram              | Sends balance status message                     | Format Balance Response     | -                                |                                                                                                                                         |
| Generate Product Signature   | Code                  | Generates MD5 signature for product list       | Main Command Router (list_products) | Get Products API              |                                                                                                                                         |
| Get Products API             | HTTP Request          | Calls Digiflazz API to get product list         | Generate Product Signature  | Format Product List              |                                                                                                                                         |
| Format Product List          | Code                  | Groups products by category, creates menu       | Get Products API            | Send Product Categories          |                                                                                                                                         |
| Send Product Categories      | Telegram              | Sends product category menu                      | Format Product List         | -                                |                                                                                                                                         |
| Deposit Information          | Telegram              | Sends initial deposit request instructions      | Main Command Router (deposit_request) | Process Deposit Information  |                                                                                                                                         |
| Process Deposit Information  | Code                  | Formats detailed deposit instructions           | Deposit Information         | Send Deposit Information         |                                                                                                                                         |
| Send Deposit Information     | Telegram              | Sends detailed deposit instructions             | Process Deposit Information | -                                |                                                                                                                                         |
| Topup Menu                  | Telegram              | Shows prepaid topup product type options         | Main Command Router (topup_command) | Process Topup Selection       |                                                                                                                                         |
| Process Topup Selection      | Code                  | Parses topup type, prompts user for input       | Topup Menu                 | Send Topup Input Prompt          |                                                                                                                                         |
| Send Topup Input Prompt      | Telegram              | Sends topup input prompt with cancel options    | Process Topup Selection     | Execute Transaction API          |                                                                                                                                         |
| Execute Transaction API      | HTTP Request          | Executes prepaid topup transaction               | Send Topup Input Prompt     | -                                |                                                                                                                                         |
| Check Bill Menu             | Telegram              | Shows bill checking options                       | Main Command Router (checkbill_command) | Process Check Bill Selection |                                                                                                                                         |
| Process Check Bill Selection | Code                  | Parses bill type, prompts user for ID input     | Check Bill Menu            | Send Check Bill Input Prompt     |                                                                                                                                         |
| Send Check Bill Input Prompt | Telegram              | Sends check bill input prompt with cancel options | Process Check Bill Selection | Bill Inquiry API                |                                                                                                                                         |
| Bill Inquiry API            | HTTP Request          | Queries bill information or payment status       | Send Check Bill Input Prompt, Send Pay Bill Input Prompt | -                     |                                                                                                                                         |
| Pay Bill Menu               | Telegram              | Shows bill payment options                        | Main Command Router (paybill_command) | Process Pay Bill Selection    |                                                                                                                                         |
| Process Pay Bill Selection   | Code                  | Parses pay bill type, prompts user input         | Pay Bill Menu              | Send Pay Bill Input Prompt       |                                                                                                                                         |
| Send Pay Bill Input Prompt   | Telegram              | Sends pay bill input prompt with cancel options | Process Pay Bill Selection  | Bill Inquiry API                |                                                                                                                                         |
| Transaction History         | Telegram              | Sends transaction history header                  | Main Command Router (history_command) | Process Trancation History Information |                                                                                                                                         |
| Process Trancation History Information | Code          | Generates signature and date range for history    | Transaction History        | Send Transaction Information    | Workflow scaffolded; HTTP call for actual history data not implemented.                                                                |
| Send Transaction Information | Telegram              | Sends transaction history message with navigation | Process Trancation History Information | -                              |                                                                                                                                         |
| Process Welcome             | Code                  | Placeholder processing                             | Welcome Message            | Send Welcome                    |                                                                                                                                         |
| Process Menu                | Code                  | Placeholder processing                             | Main Menu                  | Send Menu Information           |                                                                                                                                         |
| Sticky Note                | Sticky Note           | Documentation and usage guide                      | -                          | -                              | Contains detailed installation, usage instructions, API signing methods, and customization tips.                                       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger node**  
   - Type: Telegram Trigger  
   - Set credentials with your Telegram Bot token  
   - Configure to listen for updates: `message` and `callback_query`  

2. **Add Switch node: Main Command Router**  
   - Input: Telegram Trigger output  
   - Add rules matching `message.text` or `callback_query.data` against commands and callback keys: `/start`, `/menu`, `check_balance`, `list_products`, `/topup`, `new_transaction`, `/deposit`, `request_deposit`, `/checkbill`, `check_bills`, `/paybill`, `pay_bills`, `transaction_history`, `topup_`, `checkbill_`, `paybill_`  
   - Create named outputs corresponding to each command  

3. **Welcome Message Branch**  
   - Telegram node sending welcome text with inline keyboard buttons for quick actions (balance, products, topup, deposit, check bills, pay bills, history, menu)  
   - Connect to a Code node (Process Welcome) to add placeholders  
   - Then Telegram node (Send Welcome) to finalize sending message  

4. **Main Menu Branch**  
   - Telegram node sending main menu text with inline keyboard for operation selection  
   - Process Menu Code node (simple placeholder)  
   - Send Menu Information Telegram node  

5. **Check Balance Branch**  
   - Code node to generate MD5 signature with `username + apiKey + 'depo'` using Node.js crypto  
   - HTTP POST request to `https://api.digiflazz.com/v1/cek-saldo` with JSON body containing `cmd`, `username`, `sign`  
   - Code node to parse response:  
     - Extract balance  
     - Use traffic-light icons based on thresholds (<100k red, <500k yellow, >=500k green)  
     - Format message with timestamp Asia/Jakarta timezone  
     - Handle error codes with advice  
   - Telegram node to send formatted balance result with navigation buttons  

6. **List Products Branch**  
   - Code node to generate MD5 signature with `username + apiKey + 'pricelist'`  
   - HTTP POST request to `https://api.digiflazz.com/v1/price-list`  
   - Code node to group products by category, count, and build inline keyboard with two buttons per row, plus main menu button  
   - Telegram node to send product category list and buttons  

7. **Topup Command Branch**  
   - Telegram node showing topup product categories with callback data prefixes `topup_`  
   - Code node to process topup selection callback data: parse product type, prepare input prompts and validation regex for phone numbers, PLN numbers, amounts  
   - Telegram node sending input prompt message with cancel and menu buttons  
   - HTTP POST request node to `https://api.digiflazz.com/v1/transaction` to execute topup, sends user input and signature  

8. **Deposit Request Branch**  
   - Telegram node sending initial deposit info with admin contacts  
   - Code node formatting detailed deposit instructions (including bank, e-wallet, convenience store info, tips)  
   - Telegram node to send detailed deposit information with cancel and menu buttons  

9. **Check Bill Command Branch**  
   - Telegram node showing bill checking type options (`checkbill_` callback data)  
   - Code node parsing callback data for bill type, preparing input prompt and validation regexes  
   - Telegram node sending bill inquiry input prompt with navigation buttons  
   - HTTP POST request node to `https://api.digiflazz.com/v1/inquiry` to perform bill inquiry  

10. **Pay Bill Command Branch**  
    - Telegram node showing bill payment type options (`paybill_` callback data)  
    - Code node parsing payment type, preparing prompt and validation with tips  
    - Telegram node sending payment input prompt  
    - HTTP POST request node to `https://api.digiflazz.com/v1/inquiry` (same as bill inquiry)  

11. **Transaction History Branch (Scaffold)**  
    - Telegram node sending transaction history header and navigation buttons  
    - Code node generating MD5 signature for `history` command and setting a 7-day date range  
    - Telegram node sending transaction history message  
    - (Note: HTTP request to fetch actual history data needs to be added)  

12. **Utility Code Nodes**  
    - Add two simple Code nodes (Process Welcome and Process Menu) to maintain structure, returning inputs as outputs  

13. **Sticky Note**  
    - Add a sticky note node containing detailed workflow documentation, prerequisites, usage, and tips  

**Credentials Setup:**  
- Configure Telegram API credentials with your bot token  
- Store `DIGIFLAZZ_USERNAME` and `DIGIFLAZZ_API_KEY` as environment variables in n8n settings  

**Additional Notes:**  
- Use Node.js `crypto` for MD5 hashing in Code nodes  
- Always set Content-Type header to `application/json` for HTTP requests  
- Implement persistent session storage for production (e.g., Redis) replacing simple in-memory sessions in code nodes  
- Test commands `/start` and `/menu` first to verify connectivity and bot responsiveness  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                 | Context or Link                                                                                          |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| This workflow is a Telegram bot managing PPOB business via Digiflazz API. It supports balance checks, product browsing, prepaid topups, postpaid bill checking and payments, deposits, and transaction history display.        | Workflow overview and usage guide in sticky note inside the workflow                                   |
| MD5 signatures for API security are generated using Node.js `crypto` with the pattern: `md5(username + apiKey + command)` where `command` is like `pricelist`, `depo`, or `history`.                                       | Security and signing notes in sticky note                                                             |
| Admin contacts and deposit instructions should be customized in the Telegram message nodes to reflect your real support channels and operational hours.                                                                    | Deposit Information nodes                                                                              |
| Inline keyboards provide user-friendly navigation; all buttons use callback data strings to trigger workflow routing.                                                                                                        | UI design principle in all Telegram message nodes                                                     |
| The transaction history feature is scaffolded; further development is needed to fully implement fetching and displaying detailed user transaction records.                                                                   | Transaction History branch notes                                                                       |
| For production deployments, manage user sessions with Redis or a database rather than in-memory objects to support concurrency and persistence.                                                                             | Session management notes in topup/check bill/pay bill code nodes                                       |
| Digiflazz API endpoints used: `cek-saldo`, `price-list`, `transaction`, and `inquiry`. Each requires properly signed requests with username, API key, and command-specific signatures.                                        | API integration details                                                                                 |
| Official Digiflazz API documentation and Telegram Bot API documentation are recommended references for extending or troubleshooting this workflow.                                                                           | External references (not included in workflow but recommended)                                         |

---

This completes the comprehensive technical reference document for the "Automate PPOB Business Operations with Telegram Bot & Digiflazz API" workflow. It enables thorough understanding, reproduction, and customization with attention to error handling and integration specifics.