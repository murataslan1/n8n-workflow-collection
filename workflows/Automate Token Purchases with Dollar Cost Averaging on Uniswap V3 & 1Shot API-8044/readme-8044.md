Automate Token Purchases with Dollar Cost Averaging on Uniswap V3 & 1Shot API

https://n8nworkflows.xyz/workflows/automate-token-purchases-with-dollar-cost-averaging-on-uniswap-v3---1shot-api-8044


# Automate Token Purchases with Dollar Cost Averaging on Uniswap V3 & 1Shot API

### 1. Workflow Overview

This n8n workflow automates recurring token purchases on Uniswap V3 using a Dollar Cost Averaging (DCA) strategy combined with 1Shot API calls. Its main purpose is to periodically execute token swaps at controlled intervals, leveraging Uniswap’s TWAP (Time-Weighted Average Price) to minimize price impact and slippage. The workflow includes the following logical blocks:

- **1.1 Scheduling & Configuration:** Defines the frequency of DCA purchases and configures token swap parameters such as amounts, token addresses, fees, and delegator wallet.
- **1.2 Data Retrieval & Price Calculation:** Fetches Uniswap pool observations to calculate the TWAP price and obtains a swap quote based on current market conditions.
- **1.3 Approval & Execution:** Approves the Uniswap router to spend tokens on behalf of the delegator and performs the swap transaction.
- **1.4 Post-Swap Handling & Notifications:** Retrieves remaining token balance post-swap, sends success or failure notifications via Telegram, and handles errors gracefully.
- **1.5 Documentation & User Guidance:** Sticky notes provide user instructions for configuring schedules, API connections, and parameters.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduling & Configuration

**Overview:**  
This block sets the interval for recurring DCA trades and configures all parameters needed for swap execution, including token addresses, amounts, fees, and delegator information.

**Nodes Involved:**  
- Schedule Trigger  
- Swap Configs  
- Sticky Note (Set Your DCA Schedule)  
- Sticky Note1 (DCA configs)  

**Node Details:**

- **Schedule Trigger**  
  - Type: Schedule Trigger  
  - Role: Initiates the workflow every 10 minutes to trigger DCA purchases.  
  - Configuration: Interval set to 10 minutes.  
  - Inputs: None (trigger node)  
  - Outputs: Connected to Swap Configs node.  
  - Edge Cases: Workflow won’t start if scheduling is disabled or misconfigured.  

- **Swap Configs**  
  - Type: Code  
  - Role: Defines and outputs configuration parameters required for swaps, such as TWAP window size, swap amounts, token and router addresses, and pool fee.  
  - Configuration:  
    - secondsAgo: 120 (TWAP window size)  
    - amountDCA: 100,000 units (amount to swap each cycle)  
    - delegator: Ethereum address of delegated wallet  
    - router: Uniswap SwapRouterV2 contract address  
    - token0, token1: Token contract addresses for swap pair  
    - fee: Pool fee tier (500)  
  - Key Expression: Sets these values as JSON properties for downstream nodes.  
  - Inputs: Triggered by Schedule Trigger  
  - Outputs: To Fetch Pool TWA Observations node.  
  - Edge Cases: Misconfiguration of addresses or amount can cause swap failures.  

- **Sticky Note (Set Your DCA Schedule)**  
  - Type: Sticky Note  
  - Role: User instruction on setting the recurrence schedule for DCA purchases via the Schedule Trigger node.  
  - Connected visually to Schedule Trigger node.  

- **Sticky Note1 (DCA configs)**  
  - Type: Sticky Note  
  - Role: Instructions on setting swap parameters, including amount, SwapRouter address, token addresses, and pool fee.  
  - Connected visually to Swap Configs node.  
  - Includes a link to Uniswap SwapRouter deployment docs: https://docs.uniswap.org/contracts/v3/reference/deployments/  

---

#### 2.2 Data Retrieval & Price Calculation

**Overview:**  
This block obtains Uniswap V3 pool data to calculate the TWAP price over the specified window and retrieves a swap quote for the intended token amount.

**Nodes Involved:**  
- Fetch Pool TWA Observations  
- Get Swap Qoute  
- Calculate TWAP  
- Sticky Note2 (Connect to Your 1Shot API Account)  

**Node Details:**

- **Fetch Pool TWA Observations**  
  - Type: 1Shot API (oneShot)  
  - Role: Calls the Uniswap pool `observe` method to fetch cumulative ticks and liquidity data for TWAP calculation.  
  - Configuration: Passes `secondsAgos` parameter as array `[0, secondsAgo]` where `secondsAgo` is from Swap Configs.  
  - Inputs: From Swap Configs node  
  - Outputs: To Get Swap Qoute node  
  - Credentials: Uses 1Shot OAuth2 API account  
  - Edge Cases: API call failure, invalid pool address, or incorrect secondsAgo parameter can cause errors.  

- **Get Swap Qoute**  
  - Type: 1Shot API (oneShot)  
  - Role: Calls Uniswap QuoterV2 contract’s `quoteExactInputSingle` to simulate swap output amount for the specified input token and amount.  
  - Configuration:  
    - tokenIn, tokenOut: From Swap Configs  
    - amountIn: secondsAgo (likely a misnomer in naming, should be amountDCA or a similar parameter)  
    - fee: 500  
    - sqrtPriceLimitX96: 0 (no price limit)  
  - Inputs: From Fetch Pool TWA Observations  
  - Outputs: To Calculate TWAP node  
  - Credentials: Uses 1Shot OAuth2 API  
  - Edge Cases: Incorrect token addresses or amounts cause quote failure.  

- **Calculate TWAP**  
  - Type: Code  
  - Role: Calculate the square root price at average tick, compute TWAP price, TWAL (time weighted average liquidity), and current price after swap. Enhances input JSON with these computed values.  
  - Configuration:  
    - Implements Uniswap V3 tick to sqrt price conversion logic  
    - Uses data from 'Fetch Pool TWA Observations' and 'Get Swap Qoute'  
    - Calculates price with decimals adjustment for tokens (token0 decimals 6, token1 decimals 8)  
  - Inputs: From Get Swap Qoute  
  - Outputs: To Give Approval to Router node  
  - Edge Cases: Expression errors if input data missing or parsing fails, BigInt operations require Node.js 12+ environment.  
  - Logs TWAP and price for debugging.  

- **Sticky Note2 (Connect to Your 1Shot API Account)**  
  - Type: Sticky Note  
  - Role: Instructions for setting up 1Shot API credentials and which contract methods each node calls (observe, quoteExactInputSingle, approve, exactInputSingle).  
  - Provides example link to a Uniswap pool for observation: https://app.uniswap.org/explore/pools/base/0xfBB6Eed8e7aa03B138556eeDaF5D271A5E1e43ef  

---

#### 2.3 Approval & Execution

**Overview:**  
This block approves the Uniswap router to spend tokens on behalf of the delegator and then executes the swap transaction as a delegator.

**Nodes Involved:**  
- Give Approval to Router  
- Swap Tokens  

**Node Details:**

- **Give Approval to Router**  
  - Type: 1Shot API (oneShotSynch)  
  - Role: Calls `approve` method on the token contract, allowing the Uniswap router to spend the specified DCA amount.  
  - Configuration:  
    - spender: router address from Swap Configs  
    - value: amountDCA from Swap Configs  
    - memo field: descriptive string with DCA amount  
    - delegatorWalletAddress set to delegator address  
  - Inputs: From Calculate TWAP  
  - Outputs: To Swap Tokens and Failure Details nodes (on error)  
  - Credentials: 1Shot OAuth2 API  
  - Edge Cases: Approval failure due to insufficient token balance, invalid addresses, or network issues.  

- **Swap Tokens**  
  - Type: 1Shot API (oneShotSynch)  
  - Role: Executes the actual token swap on Uniswap SwapRouterV2 using `exactInputSingle` method with parameters from Swap Configs and TWAP calculation.  
  - Configuration:  
    - tokenIn, tokenOut, fee, recipient, amountIn: from Swap Configs  
    - amountOutMinimum: 0 (no minimum output enforced)  
    - sqrtPriceLimitX96: sqrtTWAPriceX96 from Calculate TWAP  
    - memo includes DCA amount and TWAP price  
    - delegatorWalletAddress for transaction signing  
  - Inputs: From Give Approval to Router  
  - Outputs: To Get Remaining DCA Funds Balance on success, Failure Details on error  
  - Credentials: 1Shot OAuth2 API  
  - Edge Cases: Transaction failure due to slippage, insufficient allowance, gas issues, or invalid parameters.  

---

#### 2.4 Post-Swap Handling & Notifications

**Overview:**  
After the swap, this block retrieves the remaining token balance and sends Telegram notifications for success or failure events.

**Nodes Involved:**  
- Get Remaining DCA Funds Balance  
- Success Details (Telegram)  
- Failure Details (Telegram)  
- Sticky Note3 (Telegram Notifications)  

**Node Details:**

- **Get Remaining DCA Funds Balance**  
  - Type: 1Shot API (oneShot)  
  - Role: Reads token balance of the delegator wallet to report remaining funds after swap.  
  - Configuration: Passes delegator address from Swap Configs as `account`.  
  - Inputs: From Swap Tokens (success path)  
  - Outputs: To Success Details node  
  - Credentials: 1Shot OAuth2 API  
  - Edge Cases: API failure or invalid delegator address results in missing balance info.  

- **Success Details**  
  - Type: Telegram  
  - Role: Sends a Telegram message notifying about successful swap execution with details including DCA amount, tokens swapped, TWAP used, transaction hash, and remaining balance.  
  - Configuration:  
    - Chat ID predefined  
    - Message text uses expressions to pull relevant data from previous nodes (amountDCA, tokens, TWAP, tx hash, balance)  
  - Inputs: From Get Remaining DCA Funds Balance  
  - Outputs: None  
  - Credentials: Telegram API (bot)  
  - Edge Cases: Telegram API errors, invalid chat ID, or missing data cause notification failure.  

- **Failure Details**  
  - Type: Telegram  
  - Role: Sends a failure notification if swap or approval fails.  
  - Configuration: Static message "❌ Swap Failed"  
  - Inputs: From Give Approval to Router and Swap Tokens error paths  
  - Outputs: None  
  - Credentials: Telegram API  
  - Edge Cases: Telegram failures similar to Success Details node.  

- **Sticky Note3 (Telegram Notifications)**  
  - Type: Sticky Note  
  - Role: Advice on connecting a Telegram bot to receive notifications for each DCA purchase.  

---

### 3. Summary Table

| Node Name                  | Node Type           | Functional Role                      | Input Node(s)               | Output Node(s)                         | Sticky Note                                                                                                      |
|----------------------------|---------------------|------------------------------------|-----------------------------|---------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| Schedule Trigger           | Schedule Trigger    | Initiates workflow on schedule     | None                        | Swap Configs                          | Set Your DCA Schedule: Setup recurring schedule for DCA purchases.                                              |
| Swap Configs               | Code                | Defines swap parameters             | Schedule Trigger            | Fetch Pool TWA Observations           | DCA configs: Instructions to configure amounts, tokens, router, fees.                                          |
| Fetch Pool TWA Observations| 1Shot API (oneShot) | Fetch Uniswap pool observations    | Swap Configs                | Get Swap Qoute                       | Connect to Your 1Shot API Account: Setup and contract method references.                                        |
| Get Swap Qoute             | 1Shot API (oneShot) | Get token swap quote                | Fetch Pool TWA Observations | Calculate TWAP                      | Connect to Your 1Shot API Account (same note applies).                                                         |
| Calculate TWAP             | Code                | Calculate TWAP price and parameters| Get Swap Qoute              | Give Approval to Router               | Connect to Your 1Shot API Account (same note applies).                                                         |
| Give Approval to Router    | 1Shot API (oneShotSynch) | Approve router to spend tokens    | Calculate TWAP              | Swap Tokens, Failure Details          | Connect to Your 1Shot API Account (same note applies).                                                         |
| Swap Tokens                | 1Shot API (oneShotSynch) | Execute token swap on Uniswap     | Give Approval to Router     | Get Remaining DCA Funds Balance, Failure Details | Connect to Your 1Shot API Account (same note applies).                                                         |
| Get Remaining DCA Funds Balance | 1Shot API (oneShot) | Fetch remaining token balance      | Swap Tokens                 | Success Details                      |                                                                                                                 |
| Success Details            | Telegram             | Notify success via Telegram         | Get Remaining DCA Funds Balance | None                               | Telegram Notifications: Connect a Telegram bot for notifications.                                              |
| Failure Details            | Telegram             | Notify failure via Telegram         | Give Approval to Router, Swap Tokens (error paths) | None                                | Telegram Notifications (same note applies).                                                                     |
| Sticky Note                | Sticky Note          | Instruction on scheduling           | None                       | None                                | Set Your DCA Schedule                                                                                           |
| Sticky Note1               | Sticky Note          | Instruction on DCA configuration    | None                       | None                                | DCA configs                                                                                                     |
| Sticky Note2               | Sticky Note          | Instruction on 1Shot API setup      | None                       | None                                | Connect to Your 1Shot API Account                                                                                |
| Sticky Note3               | Sticky Note          | Instruction on Telegram notifications| None                       | None                                | Telegram Notifications                                                                                           |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger Node:**  
   - Type: Schedule Trigger  
   - Set to trigger every 10 minutes (minutes interval = 10)  
   - This node starts the recurring workflow execution.

2. **Add a Code Node Named "Swap Configs":**  
   - Define swap parameters in JavaScript:  
     - `secondsAgo = 120` (TWAP window in seconds)  
     - `amountDCA = 100000` (amount of token to swap each time)  
     - `delegator = "0x9fead8b19c044c2f404dac38b925ea16adaa2954"` (your delegated wallet)  
     - `router = "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E"` (Uniswap SwapRouterV2 address)  
     - `token0 = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"` (token to swap from)  
     - `token1 = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14"` (token to swap to)  
     - `fee = 500` (Uniswap pool fee tier)  
   - Output these values in the node JSON for downstream use.

3. **Add a 1Shot API Node "Fetch Pool TWA Observations":**  
   - Operation: `read`  
   - Contract Method: `observe` on Uniswap V3 pool contract  
   - Parameters: `secondsAgos = [0, secondsAgo]` (reference from Swap Configs)  
   - Credential: Connect your 1Shot OAuth2 API account with API key and secret.  

4. **Add a 1Shot API Node "Get Swap Qoute":**  
   - Operation: `simulate`  
   - Contract Method: `quoteExactInputSingle` of QuoterV2 contract  
   - Parameters populated from Swap Configs:  
     - `tokenIn`, `tokenOut` from Swap Configs  
     - `amountIn` (note: careful, in original workflow it uses `secondsAgo` which may be a misconfiguration; ideally use `amountDCA`)  
     - `fee = 500`  
     - `sqrtPriceLimitX96 = 0`  
   - Credential: 1Shot OAuth2 API  

5. **Add a Code Node "Calculate TWAP":**  
   - Implement the provided JavaScript logic that:  
     - Converts tick data to sqrt price ratio  
     - Calculates TWAP price and TWAL  
     - Extracts current price after swap from input data  
   - Use input data from previous nodes (observations and swap quote).  
   - Output enriched JSON with TWAP, sqrtTWAPriceX96, TWAL, and quotePriceAfter.

6. **Add a 1Shot API Node "Give Approval to Router":**  
   - Operation: `executeAsDelegator`  
   - Contract Method: `approve` on token0 contract  
   - Parameters:  
     - `spender = router` from Swap Configs  
     - `value = amountDCA` from Swap Configs  
   - Delegator wallet address: from Swap Configs  
   - Memo: "DCA Approve for [amountDCA]"  
   - Credential: 1Shot OAuth2 API  
   - On error, continue output to Failure Details.  

7. **Add a 1Shot API Node "Swap Tokens":**  
   - Operation: `executeAsDelegator`  
   - Contract Method: `exactInputSingle` on Uniswap SwapRouterV2  
   - Parameters:  
     - `tokenIn`, `tokenOut`, `fee` from Swap Configs  
     - `recipient` = delegator from Swap Configs  
     - `amountIn` = amountDCA from Swap Configs  
     - `amountOutMinimum` = 0 (no minimum)  
     - `sqrtPriceLimitX96` = sqrtTWAPriceX96 from Calculate TWAP  
   - Memo: "DCA Swap for [amountDCA], TWAP: [twap]"  
   - Delegator wallet address: from Swap Configs  
   - Credential: 1Shot OAuth2 API  
   - On success, proceed to Get Remaining DCA Funds Balance; on error, proceed to Failure Details.  

8. **Add a 1Shot API Node "Get Remaining DCA Funds Balance":**  
   - Operation: `read`  
   - Contract Method: `balanceOf` on token0 contract  
   - Parameters: `account` = delegator address from Swap Configs  
   - Credential: 1Shot OAuth2 API  

9. **Add a Telegram Node "Success Details":**  
   - Chat ID: your Telegram chat ID  
   - Text: Use expressions to include swap amount, tokens, TWAP, transaction hash, and remaining balance from previous nodes.  
   - Credential: Telegram API (bot token)  

10. **Add a Telegram Node "Failure Details":**  
    - Chat ID: same as above  
    - Text: Static message "❌ Swap Failed"  
    - Credential: Telegram API  

11. **Link Nodes as Follows:**  
    - Schedule Trigger → Swap Configs → Fetch Pool TWA Observations → Get Swap Qoute → Calculate TWAP → Give Approval to Router → Swap Tokens → Get Remaining DCA Funds Balance → Success Details  
    - Give Approval to Router (on error) → Failure Details  
    - Swap Tokens (on error) → Failure Details  

12. **Add Sticky Note Nodes:**  
    - Near Schedule Trigger: Instructions for setting schedule interval  
    - Near Swap Configs: Instructions on configuring tokens, router, amounts, fees with link to Uniswap docs  
    - Near Data Retrieval Nodes: Instructions on setting up 1Shot API credentials and contract method mapping with example pool link  
    - Near Telegram Nodes: Instructions for connecting Telegram bot for notifications  

---

### 5. General Notes & Resources

| Note Content                                                                                                          | Context or Link                                                                                       |
|-----------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| Uniswap SwapRouter contract deployments documentation for reference                                                   | https://docs.uniswap.org/contracts/v3/reference/deployments/                                        |
| Example Uniswap V3 pool for TWAP observations                                                                         | https://app.uniswap.org/explore/pools/base/0xfBB6Eed8e7aa03B138556eeDaF5D271A5E1e43ef                 |
| Telegram Bot setup instructions for receiving notifications                                                          | Use Telegram BotFather to create bot and obtain token; chat ID from Telegram app or bot interaction |
| 1Shot API official documentation and OAuth2 credential setup                                                          | Refer to 1Shot API docs for creating credentials and contract method IDs                             |

---

**Disclaimer:**  
The provided text is exclusively derived from an automated n8n workflow. It strictly complies with applicable content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.