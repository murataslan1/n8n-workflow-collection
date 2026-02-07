Analyze Crypto Market with CoinGecko: Volatility Metrics & Investment Signals

https://n8nworkflows.xyz/workflows/analyze-crypto-market-with-coingecko--volatility-metrics---investment-signals-4115


# Analyze Crypto Market with CoinGecko: Volatility Metrics & Investment Signals

### 1. Workflow Overview

This workflow, titled **"Analyze Crypto Market with CoinGecko: Volatility Metrics & Investment Signals"**, is designed to fetch real-time cryptocurrency market data, compute volatility and other market metrics, and generate actionable investment signals and risk ratings. The workflow targets users interested in cryptocurrency trading or portfolio management who want automated analytical insights based on recent price movements and market conditions.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Receives a webhook call to trigger the analysis process.
- **1.2 Data Retrieval:** Fetches current cryptocurrency market data from the CoinGecko API.
- **1.3 Data Processing & Metric Calculation:** Processes each coin’s data to compute volatility scores, market ratios, and composite market scores.
- **1.4 Signal Generation:** Applies conditional logic to categorize price action and assign trading signals (BUY, SELL, HOLD, NEUTRAL).
- **1.5 Risk Rating Assignment:** Assigns risk ratings based on computed market scores.
- **1.6 Analysis Formatting:** Formats the analysis results into human-readable summaries and structured reports.
- **1.7 Portfolio Summary Generation:** Aggregates individual coin analyses into a portfolio-wide summary.
- **1.8 Output Delivery:** Responds to the original webhook request with all processed data.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:** Listens for incoming HTTP requests to start the crypto analysis workflow.
- **Nodes Involved:**  
  - Webhook  
  - Respond to Webhook  

- **Node Details:**

  - **Webhook**
    - Type: HTTP Webhook Trigger
    - Role: Entry point that listens at a specific URL path for incoming requests to initiate the workflow.
    - Key Config: Path set to a unique ID string; response mode configured to use a response node.
    - Inputs: External HTTP requests
    - Outputs: Initiates the next node (`Fetch Crypto Data`)
    - Failure Cases: Network issues, invalid HTTP requests, no authentication configured.

  - **Respond to Webhook**
    - Type: HTTP Response
    - Role: Sends the final response back to the requester containing the processed data.
    - Inputs: Data from `Split Out` node (individual analyses)
    - Outputs: HTTP response
    - Failure Cases: Timeout, data serialization errors.

---

#### 1.2 Data Retrieval

- **Overview:** Retrieves market data for the top 10 cryptocurrencies by market cap from CoinGecko API.
- **Nodes Involved:**  
  - Fetch Crypto Data  

- **Node Details:**

  - **Fetch Crypto Data**
    - Type: HTTP Request
    - Role: Calls CoinGecko’s public API to retrieve market data including price changes and volumes.
    - Configuration:  
      - URL: `https://api.coingecko.com/api/v3/coins/markets` with parameters:
        - vs_currency=usd
        - order=market_cap_desc
        - per_page=10
        - page=1
        - sparkline=false
        - price_change_percentage=24h,7d,30d
    - Inputs: Trigger from `Webhook`
    - Outputs: JSON array of coin data objects
    - Edge Cases: API rate limiting, network failures, invalid response format.

---

#### 1.3 Data Processing & Metric Calculation

- **Overview:** Processes each coin’s data individually to calculate volatility scores, market cap to volume ratio, price to all-time-high ratio, and composite market scores.
- **Nodes Involved:**  
  - Loop Over Items  
  - Calculate Market Metrics  

- **Node Details:**

  - **Loop Over Items**
    - Type: SplitInBatches
    - Role: Iterates over each coin separately to allow isolated processing.
    - Inputs: Array from `Fetch Crypto Data`
    - Outputs: Single coin data item per iteration
    - Edge Cases: Large datasets may require batch size tuning.

  - **Calculate Market Metrics**
    - Type: Function
    - Role: Performs calculations on coin data:
      - Extracts 24h, 7d, and 30d price change percentages.
      - Computes absolute changes for volatility.
      - Applies weighted volatility scoring (weights: 0.5 for 24h, 0.3 for 7d, 0.2 for 30d).
      - Calculates market cap to volume ratio (market_cap / total_volume).
      - Calculates price to ATH ratio.
      - Combines these into a composite market score.
      - Adds an analysis timestamp.
    - Inputs: Single coin JSON
    - Outputs: Enriched coin JSON with new metrics
    - Potential Failures: Missing fields (e.g., `total_volume` zero or null), division by zero, malformed input data.

---

#### 1.4 Signal Generation

- **Overview:** Assigns market signals and descriptive data based on price movement and volatility thresholds.
- **Nodes Involved:**  
  - IF 24h Price Up >5%  
  - IF 24h Price Down >5%  
  - IF High Volatility  
  - Set Uptrend Data  
  - Set Downtrend Data  
  - Set Volatility Data  
  - Set Stable Data  
  - Merge Results  

- **Node Details:**

  - **IF 24h Price Up >5%**
    - Type: If
    - Role: Checks if 24h price change is greater than 5%, indicating strong upward momentum.
    - Outputs:
      - True → `Set Uptrend Data`
      - False → `IF 24h Price Down >5%`
    - Edge Cases: Missing or zero price change data.

  - **IF 24h Price Down >5%**
    - Type: If
    - Role: Checks if 24h price change is less than -5%, indicating sharp decline.
    - Outputs:
      - True → `Set Downtrend Data`
      - False → `IF High Volatility`
    - Edge Cases: Same as above.

  - **IF High Volatility**
    - Type: If
    - Role: Checks if volatility score is greater than 10 to identify highly volatile coins.
    - Outputs:
      - True → `Set Volatility Data`
      - False → `Set Stable Data`
    - Edge Cases: Potential missing `volatilityScore`.

  - **Set Uptrend Data**
    - Type: Set
    - Role: Sets descriptive fields for strong uptrend:
      - priceAction: "Strong upward momentum in the past 24 hours"
      - signal: "BUY"
      - recommendation: "Consider buying on continued strength above resistance levels. Set stop loss at recent support."
      - investmentStrategy: "Momentum strategy with trailing stop loss. Consider dollar-cost averaging to manage volatility risk."
    - Outputs: `Merge Results`

  - **Set Downtrend Data**
    - Type: Set
    - Role: Sets descriptive fields for downtrend:
      - priceAction: "Rapid price decline in the past 24 hours"
      - signal: "SELL"
      - recommendation: "Consider reducing exposure or implementing hedging strategies. Watch for oversold conditions."
      - investmentStrategy: "Capital preservation is priority. Consider re-evaluation after price stabilization."
    - Outputs: `Merge Results`

  - **Set Volatility Data**
    - Type: Set
    - Role: Sets descriptive fields for volatile but unclear trend:
      - priceAction: "High volatility with significant price swings"
      - signal: "HOLD"
      - recommendation: "High volatility indicates market uncertainty. Consider waiting for clearer signals before making major positions."
      - investmentStrategy: "Range-trading strategy may be effective. Set both upper and lower limit orders."
    - Outputs: `Merge Results`

  - **Set Stable Data**
    - Type: Set
    - Role: Sets descriptive fields for stable markets:
      - priceAction: "Relatively stable price action with minimal volatility"
      - signal: "NEUTRAL"
      - recommendation: "Market is consolidating. Watch for breakout signals in either direction."
      - investmentStrategy: "Consider accumulating small positions or implementing a neutral options strategy."
    - Outputs: `Merge Results`

  - **Merge Results**
    - Type: NoOp
    - Role: Consolidates outputs from signal-setting nodes.
    - Outputs: `Switch by Market Score`

---

#### 1.5 Risk Rating Assignment

- **Overview:** Assigns risk ratings to each coin based on their composite market score.
- **Nodes Involved:**  
  - Switch by Market Score  
  - Set High Risk Rating  
  - Set Medium Risk Rating  
  - Set Low Risk Rating  
  - Set Default Risk Rating  
  - Final Merge  

- **Node Details:**

  - **Switch by Market Score**
    - Type: Switch
    - Role: Routes coins based on `marketScore` value:
      - > 20 → High Risk
      - > 10 → Medium Risk
      - > 0 → Low Risk
      - Otherwise → Default/Unknown Risk
    - Outputs: Corresponding Set Risk Rating nodes

  - **Set High Risk Rating**
    - Type: Set
    - Role: Adds risk rating "High Risk" and appends to investmentStrategy a note about strict position sizing (max 2-5% portfolio).
    - Outputs: `Final Merge`

  - **Set Medium Risk Rating**
    - Type: Set
    - Role: Sets risk rating "Medium Risk" with moderate position sizing advice (5-10% portfolio).
    - Outputs: `Final Merge`

  - **Set Low Risk Rating**
    - Type: Set
    - Role: Sets risk rating "Low Risk" with advice for larger position sizing (10-15% portfolio).
    - Outputs: `Final Merge`

  - **Set Default Risk Rating**
    - Type: Set
    - Role: Sets risk rating "Unknown Risk" with conservative position sizing advice.
    - Outputs: `Final Merge`

  - **Final Merge**
    - Type: NoOp
    - Role: Consolidates risk rating outputs.
    - Outputs: `Format Final Analysis`

---

#### 1.6 Analysis Formatting

- **Overview:** Formats each coin’s enriched data into structured reports and human-readable markdown summaries.
- **Nodes Involved:**  
  - Format Final Analysis  

- **Node Details:**

  - **Format Final Analysis**
    - Type: Function
    - Role:  
      - Formats currency and percentage values for readability.
      - Constructs a detailed analysis report object.
      - Generates a markdown summary including price, signals, risk rating, recommendations, and timestamp.
    - Inputs: Enriched coin JSON with all computed fields.
    - Outputs: JSON with structured report and summary string.
    - Edge Cases: Localization issues with formatting, missing fields.

---

#### 1.7 Portfolio Summary Generation

- **Overview:** Aggregates all individual coin analyses into an overall portfolio summary including counts per signal and risk rating.
- **Nodes Involved:**  
  - Collect All Analyses  
  - Generate Portfolio Summary  
  - Split Out  

- **Node Details:**

  - **Collect All Analyses**
    - Type: NoOp
    - Role: Collects all processed coin data outputs from the loop.
    - Inputs: Output from `Loop Over Items`
    - Outputs: `Generate Portfolio Summary`

  - **Generate Portfolio Summary**
    - Type: Function
    - Role:  
      - Aggregates counts of signals (BUY, SELL, HOLD, NEUTRAL) and risk ratings.
      - Sorts coins by market score.
      - Picks top opportunity for highlighting.
      - Constructs a markdown summary of the portfolio and detailed coin analyses.
      - Outputs structured portfolio summary and timestamp.
    - Inputs: Array of coin analysis objects.
    - Outputs: JSON with portfolio summary and data arrays.

  - **Split Out**
    - Type: SplitOut
    - Role: Splits portfolio summary into individual analyses for output.
    - Inputs: Output from `Generate Portfolio Summary`
    - Outputs: `Respond to Webhook`

---

#### 1.8 Output Delivery

- **Overview:** Sends the completed analysis back to the client that triggered the workflow.
- **Nodes Involved:**  
  - Respond to Webhook  

- **Node Details:** See 1.1 Input Reception.

---

### 3. Summary Table

| Node Name               | Node Type                | Functional Role                            | Input Node(s)                  | Output Node(s)              | Sticky Note                                       |
|-------------------------|--------------------------|--------------------------------------------|-------------------------------|-----------------------------|--------------------------------------------------|
| Webhook                 | Webhook                  | Workflow entry point                        | External HTTP request          | Fetch Crypto Data            |                                                  |
| Fetch Crypto Data       | HTTP Request             | Fetch crypto market data                    | Webhook                       | Loop Over Items              |                                                  |
| Loop Over Items         | SplitInBatches           | Iterates over each coin                     | Fetch Crypto Data              | Collect All Analyses, Calculate Market Metrics |                                                  |
| Calculate Market Metrics| Function                 | Calculates volatility and market metrics   | Loop Over Items                | IF 24h Price Up >5%, IF 24h Price Down >5%, IF High Volatility |                                                  |
| IF 24h Price Up >5%     | If                       | Checks for price increase >5% in 24h       | Calculate Market Metrics       | Set Uptrend Data, IF 24h Price Down >5%       |                                                  |
| IF 24h Price Down >5%   | If                       | Checks for price decrease >5% in 24h       | IF 24h Price Up >5%            | Set Downtrend Data, IF High Volatility         |                                                  |
| IF High Volatility      | If                       | Checks if volatility score >10              | IF 24h Price Down >5%          | Set Volatility Data, Set Stable Data           |                                                  |
| Set Uptrend Data        | Set                      | Sets buy signal and strategy for uptrend   | IF 24h Price Up >5%            | Merge Results               |                                                  |
| Set Downtrend Data      | Set                      | Sets sell signal and strategy for downtrend| IF 24h Price Down >5%          | Merge Results               |                                                  |
| Set Volatility Data     | Set                      | Sets hold signal and strategy for volatility| IF High Volatility             | Merge Results               |                                                  |
| Set Stable Data         | Set                      | Sets neutral signal and strategy for stability| IF High Volatility             | Merge Results               |                                                  |
| Merge Results           | NoOp                     | Consolidates signal-setting outputs         | Set Uptrend/Downtrend/Volatility/Stable Data | Switch by Market Score       |                                                  |
| Switch by Market Score  | Switch                   | Routes coins by market score for risk rating | Merge Results                 | Set High/Medium/Low/Default Risk Rating         | Sticky Note: "Categorize and set the rating of coin" |
| Set High Risk Rating    | Set                      | Assigns high risk profile and position sizing | Switch by Market Score         | Final Merge                | Sticky Note: "Categorize and set the rating of coin" |
| Set Medium Risk Rating  | Set                      | Assigns medium risk profile and advice      | Switch by Market Score         | Final Merge                | Sticky Note: "Categorize and set the rating of coin" |
| Set Low Risk Rating     | Set                      | Assigns low risk profile and advice         | Switch by Market Score         | Final Merge                | Sticky Note: "Categorize and set the rating of coin" |
| Set Default Risk Rating | Set                      | Assigns default risk profile and conservative advice | Switch by Market Score         | Final Merge                | Sticky Note: "Categorize and set the rating of coin" |
| Final Merge             | NoOp                     | Consolidates risk rating outputs             | Set High/Medium/Low/Default Risk Rating | Format Final Analysis       | Sticky Note: "Categorize and set the rating of coin" |
| Format Final Analysis   | Function                 | Formats detailed coin analysis summary       | Final Merge                   | Loop Over Items             |                                                  |
| Collect All Analyses    | NoOp                     | Collects all processed coin data             | Loop Over Items               | Generate Portfolio Summary  |                                                  |
| Generate Portfolio Summary| Function               | Aggregates portfolio metrics and creates summary | Collect All Analyses          | Split Out                  |                                                  |
| Split Out               | SplitOut                 | Splits portfolio summary for output          | Generate Portfolio Summary    | Respond to Webhook          |                                                  |
| Respond to Webhook      | RespondToWebhook         | Sends final data back to requester            | Split Out                    |                             |                                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Webhook Node**
   - Type: Webhook
   - Set unique path (e.g., UUID)
   - Response Mode: Use a response node
   - This triggers the workflow on HTTP requests.

2. **Add HTTP Request Node ("Fetch Crypto Data")**
   - URL: `https://api.coingecko.com/api/v3/coins/markets`
   - Query Parameters:
     - vs_currency=usd
     - order=market_cap_desc
     - per_page=10
     - page=1
     - sparkline=false
     - price_change_percentage=24h,7d,30d
   - Connect Webhook output to this node input.

3. **Add SplitInBatches Node ("Loop Over Items")**
   - Default batch size (can be adjusted)
   - Connect output of HTTP Request to this node.

4. **Add Function Node ("Calculate Market Metrics")**
   - Paste provided JavaScript code to:
     - Extract price change percentages
     - Calculate volatility, market cap to volume ratio, price to ATH ratio
     - Compute composite market score
     - Add timestamp
   - Connect output from Loop Over Items to this node.

5. **Add If Node ("IF 24h Price Up >5%")**
   - Condition: `$json.price_change_percentage_24h > 5`
   - Connect `Calculate Market Metrics` output to this node.

6. **Add If Node ("IF 24h Price Down >5%")**
   - Condition: `$json.price_change_percentage_24h < -5`
   - Connect False output of previous If node to this node.

7. **Add If Node ("IF High Volatility")**
   - Condition: `$json.volatilityScore > 10`
   - Connect False output of previous If node to this node.

8. **Add Set Nodes for each signal condition:**
   - **Set Uptrend Data**
     - priceAction: "Strong upward momentum in the past 24 hours"
     - signal: "BUY"
     - recommendation: "Consider buying on continued strength above resistance levels. Set stop loss at recent support."
     - investmentStrategy: "Momentum strategy with trailing stop loss. Consider dollar-cost averaging to manage volatility risk."
     - Connect True output of IF 24h Price Up >5% to this node.

   - **Set Downtrend Data**
     - priceAction: "Rapid price decline in the past 24 hours"
     - signal: "SELL"
     - recommendation: "Consider reducing exposure or implementing hedging strategies. Watch for oversold conditions."
     - investmentStrategy: "Capital preservation is priority. Consider re-evaluation after price stabilization."
     - Connect True output of IF 24h Price Down >5% to this node.

   - **Set Volatility Data**
     - priceAction: "High volatility with significant price swings"
     - signal: "HOLD"
     - recommendation: "High volatility indicates market uncertainty. Consider waiting for clearer signals before making major positions."
     - investmentStrategy: "Range-trading strategy may be effective. Set both upper and lower limit orders."
     - Connect True output of IF High Volatility to this node.

   - **Set Stable Data**
     - priceAction: "Relatively stable price action with minimal volatility"
     - signal: "NEUTRAL"
     - recommendation: "Market is consolidating. Watch for breakout signals in either direction."
     - investmentStrategy: "Consider accumulating small positions or implementing a neutral options strategy."
     - Connect False output of IF High Volatility to this node.

9. **Add NoOp Node ("Merge Results")**
   - Connect all Set nodes (Uptrend, Downtrend, Volatility, Stable Data) outputs to this node.

10. **Add Switch Node ("Switch by Market Score")**
    - Value to check: `$json.marketScore`
    - Rules:
      - Larger than 20 → output 0
      - Larger than 10 → output 1
      - Larger than 0 → output 2
      - Fallback → output 3
    - Connect output of `Merge Results` to this node.

11. **Add Set Nodes for Risk Ratings:**
    - **Set High Risk Rating**
      - riskRating: "High Risk"
      - investmentStrategy: Append "Due to high risk profile, use strict position sizing (max 2-5% of portfolio)."
      - Connect output 0 of Switch node here.

    - **Set Medium Risk Rating**
      - riskRating: "Medium Risk"
      - investmentStrategy: Append "Moderate risk profile suggests balanced position sizing (5-10% of portfolio)."
      - Connect output 1 of Switch node here.

    - **Set Low Risk Rating**
      - riskRating: "Low Risk"
      - investmentStrategy: Append "Lower risk profile allows for larger position sizing (10-15% of portfolio)."
      - Connect output 2 of Switch node here.

    - **Set Default Risk Rating**
      - riskRating: "Unknown Risk"
      - investmentStrategy: Append "Risk profile is unclear - use conservative position sizing until more data is available."
      - Connect fallback output (3) of Switch node here.

12. **Add NoOp Node ("Final Merge")**
    - Connect all Risk Rating set nodes to this node.

13. **Add Function Node ("Format Final Analysis")**
    - Paste provided JS code that formats currency, percentages, and produces markdown summary.
    - Connect output of `Final Merge` node here.

14. **Connect output of "Format Final Analysis" back to "Loop Over Items" node**  
    - This creates a loop for processing all items.

15. **Add NoOp Node ("Collect All Analyses")**
    - Connect the second output of `Loop Over Items` (batch completion) to this node.

16. **Add Function Node ("Generate Portfolio Summary")**
    - Paste the code that aggregates all coins, counts signals and risk, sorts by market score, and generates markdown portfolio summary.
    - Connect output of `Collect All Analyses` to this node.

17. **Add SplitOut Node ("Split Out")**
    - Configure to split field `individualAnalyses`
    - Connect output of `Generate Portfolio Summary` to this node.

18. **Connect output of `Split Out` to `Respond to Webhook` node**  
    - Sends the final analysis back to the caller.

---

### 5. General Notes & Resources

| Note Content                                                                                                             | Context or Link                                     |
|--------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------|
| Sticky Note on "Categorize and set the rating of coin" applies to all nodes from "Switch by Market Score" through "Final Merge". | Node group for risk categorization                  |
| The API endpoint used is CoinGecko's public markets API for top 10 coins by market cap in USD, including multi-period price change percentages. | API Docs: https://www.coingecko.com/en/api/documentation |
| The workflow is tagged for "training-tasks-n8n" and "training-n8n" suggesting it is suitable for learning and demonstration. |                                                    |

---

**Disclaimer:** The provided content is exclusively from an automated workflow created with n8n, a tool for integration and automation. The process strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and publicly available.