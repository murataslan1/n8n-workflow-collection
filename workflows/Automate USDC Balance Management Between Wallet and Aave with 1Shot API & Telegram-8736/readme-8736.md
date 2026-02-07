Automate USDC Balance Management Between Wallet and Aave with 1Shot API & Telegram

https://n8nworkflows.xyz/workflows/automate-usdc-balance-management-between-wallet-and-aave-with-1shot-api---telegram-8736


# Automate USDC Balance Management Between Wallet and Aave with 1Shot API & Telegram

### 1. Workflow Overview

This workflow automates the management of USDC funds between a user's wallet and the Aave protocol on the Base network, leveraging the 1Shot API for blockchain interactions and Telegram for notifications. Its main purpose is to optimize yield by automatically depositing excess USDC into Aave to earn interest and withdrawing funds back into the wallet when balances fall below a configured threshold.

The workflow is logically divided into these blocks:

- **1.1 Configuration Setup:** Defines the user’s wallet address, token and pool contracts, balance thresholds, and Telegram chat ID.
- **1.2 Scheduled Trigger:** Initiates the workflow on a user-defined schedule.
- **1.3 Balance Checks:** Reads the current USDC wallet balance and Aave savings balance using 1Shot API smart contract calls.
- **1.4 Decision Logic:** Compares balances against thresholds to determine whether to deposit excess funds, withdraw from savings, or do nothing.
- **1.5 Deposit Flow:** Approves and deposits excess USDC from the wallet into Aave.
- **1.6 Withdrawal Flow:** Withdraws funds from Aave back into the wallet when balance is too low.
- **1.7 Confirmation & Notification:** Confirms balance updates after transactions and sends appropriate Telegram notifications.
- **1.8 Error Handling & Warnings:** Sends Telegram alerts upon deposit or withdrawal failures, or warnings when insufficient savings exist to top off the wallet.

---

### 2. Block-by-Block Analysis

#### 1.1 Configuration Setup

**Overview:**  
Defines static configuration variables such as savings thresholds, wallet and contract addresses, and Telegram chat ID to parameterize the workflow.

**Nodes Involved:**  
- Savings Configs  
- Sticky Note (Set Your Savings Thresholds)  
- Sticky Note1 (Setup Instructions)  
- Sticky Note5 (YouTube Tutorial)

**Node Details:**

- **Savings Configs**  
  - Type: Code  
  - Role: Initializes parameters for thresholds, wallet address, token and pool contract addresses, Telegram chat ID.  
  - Configuration:  
    - `moveToSavingsThreshold`: USDC balance above which funds move to Aave (atomic units).  
    - `topOffBalance`: USDC balance below which funds are withdrawn from Aave (must be less than moveToSavingsThreshold).  
    - `delegator`: Wallet address delegated to 1Shot API.  
    - `token`: USDC token contract address on Base.  
    - `pool`: Aave L2Pool contract address on Base.  
    - `telegramChatId`: Telegram chat ID for notifications.  
  - Inputs: Trigger node (Schedule Trigger)  
  - Outputs: USDC balance check node  
  - Edge Cases: Misconfigured thresholds (e.g., topOffBalance ≥ moveToSavingsThreshold) could cause logic errors. Invalid wallet or contract addresses would cause blockchain call failures.

- **Sticky Notes**  
  - Provide user guidance on configuration and setup.  
  - Contain instructions for setting thresholds, creating Telegram bot and credentials, and links to a YouTube tutorial.

---

#### 1.2 Scheduled Trigger

**Overview:**  
Starts the workflow execution on a repeated schedule.

**Nodes Involved:**  
- Schedule Trigger

**Node Details:**

- **Schedule Trigger**  
  - Type: Schedule Trigger  
  - Role: Executes workflow at user-configured intervals (default: every 24 hours or as set).  
  - Configuration: Interval trigger with no specific time set (user to configure).  
  - Outputs: Savings Configs node.  
  - Edge Cases: Misconfigured schedule can cause no runs or too frequent runs leading to rate limits.

---

#### 1.3 Balance Checks

**Overview:**  
Reads current USDC wallet balance and Aave savings balance using 1Shot API contract calls.

**Nodes Involved:**  
- Check User's USDC Balance  
- Check User's Aave Savings

**Node Details:**

- **Check User's USDC Balance**  
  - Type: 1Shot API (read)  
  - Role: Calls USDC contract’s `balanceOf` for the user’s wallet address.  
  - Configuration:  
    - Param: `account` set to the delegator wallet address from Savings Configs.  
    - Contract function ID corresponds to USDC `balanceOf`.  
  - Inputs: Savings Configs  
  - Outputs: Check User's Aave Savings node  
  - Edge Cases: API auth failures, contract call timeouts, invalid address errors.

- **Check User's Aave Savings**  
  - Type: 1Shot API (read)  
  - Role: Calls aBasUSDC contract’s `balanceOf` for user’s Aave savings balance.  
  - Configuration:  
    - Param: `user` set to delegator wallet from Savings Configs.  
    - Contract function ID corresponds to aBasUSDC `balanceOf`.  
  - Inputs: Check User's USDC Balance  
  - Outputs: Switch node for decision logic  
  - Edge Cases: Same as above.

---

#### 1.4 Decision Logic

**Overview:**  
Determines whether to deposit excess funds, withdraw from savings, or do nothing based on current balances and configured thresholds.

**Nodes Involved:**  
- Switch  
- Calculate Excess Funds  
- Calculate Insufficient Funds  
- Check User Has Sufficient Savings (inactive in this version)  

**Node Details:**

- **Switch**  
  - Type: Switch (version 3.2)  
  - Role: Compares wallet USDC balance against thresholds:  
    - If wallet balance > moveToSavingsThreshold → output "deposit"  
    - If wallet balance < topOffBalance → output "withdraw"  
    - Else → output "extra" (no change)  
  - Inputs: Check User's Aave Savings  
  - Outputs:  
    - deposit → Calculate Excess Funds  
    - withdraw → Calculate Insufficient Funds  
    - extra → No Change, Send Account Status  
  - Edge Cases: Parsing errors on balances or threshold values; missing JSON properties.

- **Calculate Excess Funds**  
  - Type: Code  
  - Role: Calculates amount of USDC to deposit into Aave as (wallet balance - moveToSavingsThreshold).  
  - Inputs: Switch (deposit path)  
  - Outputs: approve USDC  
  - Edge Cases: Negative or zero excess funds should be handled gracefully.

- **Calculate Insufficient Funds**  
  - Type: Code  
  - Role: Calculates amount to withdraw from Aave to top off wallet balance halfway between thresholds.  
  - Logic:  
    - fundGap = (topOffBalance - wallet balance)  
    - withdrawAmount = floor((moveToSavingsThreshold - topOffBalance)/2) + fundGap  
    - Cap withdrawAmount by available Aave savings.  
  - Inputs: Switch (withdraw path)  
  - Outputs: (Inactive) Check User Has Sufficient Savings node  
  - Edge Cases: Insufficient Aave savings → withdrawAmount capped; negative values handled.

- **Check User Has Sufficient Savings**  
  - Type: If (inactive in this workflow version)  
  - Role: Would check if withdrawAmount > 0 to proceed.

---

#### 1.5 Deposit Flow

**Overview:**  
Approves the Aave Pool contract to spend USDC and deposits the calculated excess funds into Aave.

**Nodes Involved:**  
- approve USDC  
- Deposit USDC into Aave L2Pool  
- Confirm User's USDC Balance After Deposit  
- Confirm User's Aave Savings After Deposit  
- Deposit Confirmation  
- Deposit Failure Notification

**Node Details:**

- **approve USDC**  
  - Type: 1Shot API synchronous execute  
  - Role: Calls USDC contract’s `approve` function to authorize Aave Pool to spend excess USDC.  
  - Configuration:  
    - spender = Aave Pool address from Savings Configs  
    - value = excessFunds calculated  
    - memo includes amount approved  
    - delegatorWalletAddress is the delegated wallet  
    - contractMethodId targets `approve` function on USDC  
  - Inputs: Calculate Excess Funds  
  - Outputs: Deposit USDC into Aave L2Pool (success), Deposit Failure Notification (error)  
  - Edge Cases: Approval failure, network timeout.

- **Deposit USDC into Aave L2Pool**  
  - Type: 1Shot API synchronous execute  
  - Role: Calls Aave Pool’s `supply` function to deposit USDC.  
  - Configuration:  
    - asset = USDC token address  
    - amount = excessFunds  
    - onBehalfOf = delegator wallet  
    - referralCode = 0  
    - gasLimit set to 400,000  
    - memo includes deposit amount  
  - Inputs: approve USDC  
  - Outputs: Confirm User's USDC Balance After Deposit (success), Deposit Failure Notification (error)  
  - Edge Cases: Deposit failure, gas limits.

- **Confirm User's USDC Balance After Deposit** & **Confirm User's Aave Savings After Deposit**  
  - Type: 1Shot API (read)  
  - Role: Verify updated balances post-deposit.  
  - Inputs: Deposit USDC into Aave L2Pool  
  - Outputs: Deposit Confirmation  
  - Edge Cases: Read errors.

- **Deposit Confirmation**  
  - Type: Telegram  
  - Role: Sends notification with transaction hash and updated balances.  
  - Inputs: Confirm User's Aave Savings After Deposit  
  - Configuration: Chat ID from Savings Configs; message dynamically includes tx hash and balances.  
  - Edge Cases: Telegram API failures.

- **Deposit Failure Notification**  
  - Type: Telegram  
  - Role: Alerts user of deposit operation failure.  
  - Inputs: approve USDC or Deposit USDC into Aave L2Pool nodes (error outputs)  
  - Configuration: Chat ID from Savings Configs.  
  - Edge Cases: Telegram API failures.

---

#### 1.6 Withdrawal Flow

**Overview:**  
Withdraws funds from Aave savings to top off the wallet balance when below threshold.

**Nodes Involved:**  
- Withdraw from Aave  
- Confirm User's USDC Balance After Withdraw  
- Confirm User's Aave Savings After Withdraw  
- Withdraw Confirmation  
- Withdraw Failure Notification  
- Insufficient Savings Warning

**Node Details:**

- **Withdraw from Aave**  
  - Type: 1Shot API synchronous execute  
  - Role: Calls Aave Pool’s `withdraw` function to move funds from Aave to wallet.  
  - Configuration:  
    - asset = USDC token address  
    - amount = withdrawAmount from Calculate Insufficient Funds  
    - to = delegator wallet  
    - gasLimit set to 500,000  
    - memo includes withdrawal amount  
  - Inputs: (Would be from Check User Has Sufficient Savings, inactive here)  
  - Outputs: Confirm User's USDC Balance After Withdraw (success), Withdraw Failure Notification (error)  
  - Edge Cases: Withdrawal failures, insufficient balance, gas limits.

- **Confirm User's USDC Balance After Withdraw** & **Confirm User's Aave Savings After Withdraw**  
  - Type: 1Shot API (read)  
  - Role: Verify updated balances post-withdrawal.  
  - Inputs: Withdraw from Aave  
  - Outputs: Withdraw Confirmation  
  - Edge Cases: Read errors.

- **Withdraw Confirmation**  
  - Type: Telegram  
  - Role: Sends notification with transaction hash and updated balances.  
  - Inputs: Confirm User's Aave Savings After Withdraw  
  - Configuration: Chat ID from Savings Configs; message dynamically includes tx hash and balances.  
  - Edge Cases: Telegram API failures.

- **Withdraw Failure Notification**  
  - Type: Telegram  
  - Role: Alerts user of withdrawal operation failure, including current balances.  
  - Inputs: Withdraw from Aave (error output)  
  - Configuration: Chat ID from Savings Configs.  
  - Edge Cases: Telegram API failures.

- **Insufficient Savings Warning**  
  - Type: Telegram  
  - Role: Warns user when not enough savings exist to top off wallet.  
  - Inputs: (Would be from Check User Has Sufficient Savings node)  
  - Configuration: Chat ID from Savings Configs.  
  - Edge Cases: Telegram API failures.

---

#### 1.7 No Change Notification

**Overview:**  
When wallet balance is within thresholds, sends a Telegram status update without moving funds.

**Nodes Involved:**  
- No Change, Send Account Status

**Node Details:**

- **No Change, Send Account Status**  
  - Type: Telegram  
  - Role: Sends current wallet and Aave savings balances to the user.  
  - Inputs: Switch node (extra output)  
  - Configuration: Chat ID from Savings Configs; message includes formatted balances.  
  - Edge Cases: Telegram API failures.

---

### 3. Summary Table

| Node Name                          | Node Type             | Functional Role                    | Input Node(s)                         | Output Node(s)                           | Sticky Note                                                                                          |
|-----------------------------------|-----------------------|----------------------------------|-------------------------------------|-----------------------------------------|----------------------------------------------------------------------------------------------------|
| Schedule Trigger                  | Schedule Trigger      | Starts workflow on schedule       | —                                   | Savings Configs                         | Setup instructions and YouTube tutorial linked in sticky notes cover initial setup steps.          |
| Savings Configs                  | Code                  | Defines thresholds and config     | Schedule Trigger                    | Check User's USDC Balance               | Sticky Note: Set Your Savings Thresholds explains parameter setup.                                 |
| Check User's USDC Balance        | 1Shot API (read)      | Reads wallet USDC balance         | Savings Configs                    | Check User's Aave Savings                |                                                                                                    |
| Check User's Aave Savings        | 1Shot API (read)      | Reads Aave USDC savings balance   | Check User's USDC Balance           | Switch                                 |                                                                                                    |
| Switch                          | Switch                | Decision logic for deposit/withdraw/no change | Check User's Aave Savings          | Calculate Excess Funds, Calculate Insufficient Funds, No Change, Send Account Status |                                                                                                    |
| Calculate Excess Funds           | Code                  | Calculates amount to deposit      | Switch (deposit)                   | approve USDC                           |                                                                                                    |
| approve USDC                    | 1Shot API (execute)   | Approves Aave Pool to spend USDC | Calculate Excess Funds             | Deposit USDC into Aave L2Pool, Deposit Failure Notification |                                                                                                    |
| Deposit USDC into Aave L2Pool   | 1Shot API (execute)   | Deposits USDC into Aave           | approve USDC                      | Confirm User's USDC Balance After Deposit, Deposit Failure Notification |                                                                                                    |
| Confirm User's USDC Balance After Deposit | 1Shot API (read)      | Confirms wallet balance after deposit | Deposit USDC into Aave L2Pool    | Confirm User's Aave Savings After Deposit |                                                                                                    |
| Confirm User's Aave Savings After Deposit | 1Shot API (read)      | Confirms Aave savings after deposit | Confirm User's USDC Balance After Deposit | Deposit Confirmation                   |                                                                                                    |
| Deposit Confirmation            | Telegram               | Notifies successful deposit       | Confirm User's Aave Savings After Deposit | —                                     |                                                                                                    |
| Deposit Failure Notification    | Telegram               | Notifies deposit failure          | approve USDC (error), Deposit USDC into Aave L2Pool (error) | —                                     |                                                                                                    |
| Calculate Insufficient Funds    | Code                  | Calculates amount to withdraw     | Switch (withdraw)                 | (Inactive) Check User Has Sufficient Savings |                                                                                                    |
| Withdraw from Aave              | 1Shot API (execute)   | Withdraws USDC from Aave          | (Inactive) Check User Has Sufficient Savings | Confirm User's USDC Balance After Withdraw, Withdraw Failure Notification |                                                                                                    |
| Confirm User's USDC Balance After Withdraw | 1Shot API (read)      | Confirms wallet balance after withdrawal | Withdraw from Aave               | Confirm User's Aave Savings After Withdraw |                                                                                                    |
| Confirm User's Aave Savings After Withdraw | 1Shot API (read)      | Confirms Aave savings after withdrawal | Confirm User's USDC Balance After Withdraw | Withdraw Confirmation                  |                                                                                                    |
| Withdraw Confirmation          | Telegram               | Notifies successful withdrawal    | Confirm User's Aave Savings After Withdraw | —                                     |                                                                                                    |
| Withdraw Failure Notification  | Telegram               | Notifies withdrawal failure       | Withdraw from Aave (error)         | —                                     |                                                                                                    |
| No Change, Send Account Status | Telegram               | Sends status when no funds moved  | Switch (extra)                    | —                                     |                                                                                                    |
| Check User Has Sufficient Savings | If (inactive)          | Checks if withdrawal amount > 0   | Calculate Insufficient Funds       | Withdraw from Aave, Insufficient Savings Warning |                                                                                                    |
| Insufficient Savings Warning    | Telegram               | Warns insufficient savings        | Check User Has Sufficient Savings  | —                                     |                                                                                                    |
| Sticky Note                    | Sticky Note            | Instruction for savings thresholds | —                                | —                                     | Contains detailed user instructions on setting savings thresholds and wallet info.                 |
| Sticky Note1                   | Sticky Note            | Setup instructions and overview   | —                                | —                                     | Contains comprehensive setup steps and links to 1Shot API and Telegram setup.                      |
| Sticky Note5                   | Sticky Note            | YouTube tutorial link             | —                                | —                                     | Contains a YouTube tutorial video reference (@[youtube](Hppd04sM4xE)).                            |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Schedule Trigger Node**  
   - Type: Schedule Trigger  
   - Configure to run on desired interval (e.g., every 24 hours).

2. **Create the Savings Configs Node (Code)**  
   - Define constants:  
     - `moveToSavingsThreshold` (integer, atomic USDC units)  
     - `topOffBalance` (integer, less than moveToSavingsThreshold)  
     - `delegator` (your wallet address)  
     - `token` (USDC contract address on Base)  
     - `pool` (Aave L2Pool contract address on Base)  
     - `telegramChatId` (Telegram chat ID)  
   - Connect Schedule Trigger → Savings Configs.

3. **Create Check User's USDC Balance Node (1Shot API - Read)**  
   - Credential: 1Shot API credential with valid API key/secret.  
   - Operation: Read  
   - Contract Method: USDC `balanceOf` function  
   - Parameters: `account` = `{{ $('Savings Configs').item.json.delegator }}`  
   - Connect Savings Configs → Check User's USDC Balance.

4. **Create Check User's Aave Savings Node (1Shot API - Read)**  
   - Operation: Read  
   - Contract Method: aBasUSDC `balanceOf` function  
   - Parameters: `user` = `{{ $('Savings Configs').item.json.delegator }}`  
   - Connect Check User's USDC Balance → Check User's Aave Savings.

5. **Create Switch Node for Decision Logic**  
   - Conditions:  
     - Output "deposit" if wallet balance > moveToSavingsThreshold  
     - Output "withdraw" if wallet balance < topOffBalance  
     - Else output "extra"  
   - Use expressions to parse balances and thresholds.  
   - Connect Check User's Aave Savings → Switch.

6. **Create Calculate Excess Funds Node (Code)**  
   - JS logic: `excessFunds = walletBalance - moveToSavingsThreshold`  
   - Pass `excessFunds` in output JSON.  
   - Connect Switch (deposit output) → Calculate Excess Funds.

7. **Create approve USDC Node (1Shot API - Execute)**  
   - Operation: executeAsDelegator  
   - Contract Method: USDC `approve` function  
   - Parameters:  
     - `spender` = Aave Pool address (`{{ $('Savings Configs').item.json.pool }}`)  
     - `value` = `{{ $('Calculate Excess Funds').item.json.excessFunds }}`  
   - Delegator wallet set to configured wallet.  
   - Memo includes approval amount.  
   - Connect Calculate Excess Funds → approve USDC.

8. **Create Deposit USDC into Aave L2Pool Node (1Shot API - Execute)**  
   - Operation: executeAsDelegator  
   - Contract Method: Aave Pool `supply` function  
   - Parameters:  
     - `asset` = USDC token address  
     - `amount` = excessFunds  
     - `onBehalfOf` = delegator wallet  
     - `referralCode` = 0  
   - Gas limit: 400,000  
   - Memo includes deposit amount.  
   - Connect approve USDC (success output) → Deposit USDC into Aave L2Pool.  
   - Connect approve USDC (error output) → Deposit Failure Notification (Telegram).

9. **Create Confirm User's USDC Balance After Deposit Node (1Shot API - Read)**  
   - Contract Method: USDC `balanceOf`  
   - Parameters: `account` = delegator wallet  
   - Connect Deposit USDC into Aave L2Pool → Confirm User's USDC Balance After Deposit (success output).  
   - Connect Deposit USDC into Aave L2Pool (error output) → Deposit Failure Notification.

10. **Create Confirm User's Aave Savings After Deposit Node (1Shot API - Read)**  
    - Contract Method: aBasUSDC `balanceOf`  
    - Parameters: `user` = delegator wallet  
    - Connect Confirm User's USDC Balance After Deposit → Confirm User's Aave Savings After Deposit.

11. **Create Deposit Confirmation Node (Telegram)**  
    - Text includes tx hash, new wallet balance, new Aave savings balance (formatted).  
    - Chat ID from Savings Configs.  
    - Connect Confirm User's Aave Savings After Deposit → Deposit Confirmation.

12. **Create Calculate Insufficient Funds Node (Code)**  
    - JS logic to compute fundGap and withdrawAmount, capped by Aave savings balance.  
    - Connect Switch (withdraw output) → Calculate Insufficient Funds.

13. **[Optional] Create Check User Has Sufficient Savings Node (If)**  
    - Condition: withdrawAmount > 0  
    - Connect Calculate Insufficient Funds → Check User Has Sufficient Savings.

14. **Create Withdraw from Aave Node (1Shot API - Execute)**  
    - Operation: executeAsDelegator  
    - Contract Method: Aave Pool `withdraw` function  
    - Parameters:  
      - `asset` = USDC token address  
      - `amount` = withdrawAmount from calculation  
      - `to` = delegator wallet  
    - Gas limit: 500,000  
    - Memo includes withdrawal amount.  
    - Connect Check User Has Sufficient Savings (true output) → Withdraw from Aave.  
    - Connect Check User Has Sufficient Savings (false output) → Insufficient Savings Warning (Telegram).

15. **Create Confirm User's USDC Balance After Withdraw Node (1Shot API - Read)**  
    - Contract Method: USDC `balanceOf`  
    - Parameters: `account` = delegator wallet  
    - Connect Withdraw from Aave → Confirm User's USDC Balance After Withdraw (success output).  
    - Connect Withdraw from Aave (error output) → Withdraw Failure Notification (Telegram).

16. **Create Confirm User's Aave Savings After Withdraw Node (1Shot API - Read)**  
    - Contract Method: aBasUSDC `balanceOf`  
    - Parameters: `user` = delegator wallet  
    - Connect Confirm User's USDC Balance After Withdraw → Confirm User's Aave Savings After Withdraw.

17. **Create Withdraw Confirmation Node (Telegram)**  
    - Text includes tx hash, updated wallet balance, updated Aave savings balance.  
    - Chat ID from Savings Configs.  
    - Connect Confirm User's Aave Savings After Withdraw → Withdraw Confirmation.

18. **Create Withdraw Failure Notification Node (Telegram)**  
    - Text includes failure message and current balances.  
    - Connect Withdraw from Aave (error output) → Withdraw Failure Notification.

19. **Create Insufficient Savings Warning Node (Telegram)**  
    - Sends warning when savings insufficient to top off wallet.  
    - Connect Check User Has Sufficient Savings (false output) → Insufficient Savings Warning.

20. **Create No Change, Send Account Status Node (Telegram)**  
    - Sends current wallet and Aave savings balances when no deposit or withdrawal occurs.  
    - Connect Switch (extra output) → No Change, Send Account Status.

21. **Create Sticky Notes Nodes**  
    - Add sticky notes with setup instructions, savings thresholds, and tutorial links as per the original workflow.

22. **Credentials Setup**  
    - Create 1Shot API credential with API key and secret.  
    - Create Telegram API credential with bot token.  
    - Assign credentials appropriately to 1Shot API and Telegram nodes.

23. **Activate Workflow**  
    - Set schedule trigger as active.  
    - Test workflow with manual runs or scheduled execution.

---

### 5. General Notes & Resources

| Note Content                                                                                                                        | Context or Link                                                                                   |
|------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| This workflow leverages the 1Shot API to interact with Ethereum smart contracts on Base network without manual wallet signing.    | 1Shot API: https://1shotapi.com                                                                 |
| Telegram notifications keep the user informed about deposits, withdrawals, and failures.                                           | Telegram Bot API: https://core.telegram.org/bots/api                                            |
| The workflow is designed to run on a schedule, for example every 24 hours, to automate balance management seamlessly.             | Setup instructions detailed in sticky notes within the workflow UI.                             |
| YouTube tutorial explaining setup and usage is linked within the workflow's sticky note (Video ID: Hppd04sM4xE).                   | https://www.youtube.com/watch?v=Hppd04sM4xE                                                     |
| The workflow requires valid contract method IDs for the 1Shot API nodes to call specific smart contract functions on USDC and Aave.| These contract method IDs are provisioned by the 1Shot API and should be set according to their docs. |

---

**Disclaimer:**  
The provided content is extracted exclusively from an automated workflow created with n8n, respecting all content policies. It contains no illegal, offensive, or protected elements. All data handled is legal and public.