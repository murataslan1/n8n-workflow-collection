Analyze Real Estate Market Sentiment with ScrapeGraphAI and Telegram

https://n8nworkflows.xyz/workflows/analyze-real-estate-market-sentiment-with-scrapegraphai-and-telegram-6627


# Analyze Real Estate Market Sentiment with ScrapeGraphAI and Telegram

---

### 1. Workflow Overview

This n8n workflow automates the analysis of real estate market sentiment by scraping discussion forums and news websites, performing sentiment analysis, generating market predictions, optimizing investment timing, and delivering actionable alerts via Telegram. It is designed for real estate investors, analysts, and advisory services aiming to monitor daily market conditions and receive timely insights for decision-making.

The workflow is logically divided into the following functional blocks:

- **1.1 Schedule Trigger**: Initiates the workflow daily at a fixed time.
- **1.2 Data Collection**: Scrapes recent real estate forum discussions and news articles using ScrapeGraphAI nodes.
- **1.3 Sentiment Analysis**: Processes and scores aggregated textual data to determine market sentiment.
- **1.4 Market Prediction**: Translates sentiment scores into actionable buy/sell/hold recommendations with confidence and reasoning.
- **1.5 Timing Optimization**: Suggests optimal timing for investment actions based on prediction strength and seasonal factors.
- **1.6 Investment Advisor Alert**: Constructs a detailed alert message summarizing analysis, recommendations, and risk levels.
- **1.7 Telegram Delivery**: Sends the formatted alert message to a specified Telegram channel for real-time notification.

---

### 2. Block-by-Block Analysis

#### 2.1 Schedule Trigger

**Overview:**  
Triggers the entire workflow automatically every day at 8:00 AM to perform up-to-date market sentiment analysis.

**Nodes Involved:**  
- Schedule Trigger

**Node Details:**  
- **Type:** Schedule Trigger  
- **Role:** Initiate workflow execution on a daily schedule  
- **Configuration:** Cron expression `0 8 * * *` (daily at 8:00 AM)  
- **Input:** None (trigger node)  
- **Output:** Triggers downstream nodes  
- **Edge Cases:** Cron misconfiguration could cause missed runs; ensure server timezone aligns with intended execution time.

---

#### 2.2 Data Collection

**Overview:**  
Collects fresh data from two distinct sources: real estate investor forums and real estate news websites, focusing on recent 24-hour content.

**Nodes Involved:**  
- ScrapeGraphAI - RE Forums  
- ScrapeGraphAI - RE News

**Node Details:**

- **ScrapeGraphAI - RE Forums**  
  - **Type:** ScrapeGraphAI node (specialized web scraping AI)  
  - **Role:** Scrapes BiggerPockets real estate investing forums for recent discussions  
  - **Configuration:**  
    - Website URL: `https://www.biggerpockets.com/forums/real-estate-investing`  
    - User prompt specifies extraction of discussions from last 24 hrs with fields like title, author, sentiment indicators, replies, URL  
  - **Input:** Trigger from Schedule Trigger  
  - **Output:** JSON object containing an array of recent forum discussions  
  - **Edge Cases:** Website downtime, changed HTML structure affecting scraping, API rate limits or scraping blockades.

- **ScrapeGraphAI - RE News**  
  - **Type:** ScrapeGraphAI node  
  - **Role:** Scrapes real estate investment news site for latest market analysis articles  
  - **Configuration:**  
    - Website URL: `https://www.realestateinvestingtrust.com/news`  
    - User prompt to extract articles from last 24 hrs with headline, author, summary, market impact, URL  
  - **Input:** Trigger from Schedule Trigger  
  - **Output:** JSON object with array of news articles  
  - **Edge Cases:** Same as above; also possibility of sparse news data on some days.

---

#### 2.3 Sentiment Analysis

**Overview:**  
Combines forum and news data to analyze overall market sentiment using keyword-based scoring, producing an aggregate sentiment score and classification.

**Nodes Involved:**  
- Sentiment Analyzer

**Node Details:**  
- **Type:** Code node (JavaScript)  
- **Role:** Analyze text data for bullish/bearish/neutral sentiment, calculate scores, and summarize results  
- **Configuration:**  
  - Analyzes concatenated title and content of forum discussions and news articles  
  - Uses defined bullish and bearish keyword lists for counting occurrences  
  - Assigns sentiment label per item and calculates score (+1, -1, 0)  
  - Computes overall average sentiment score and classifies as bullish, bearish, or neutral based on thresholds  
  - Outputs detailed sentiment analysis and counts per sentiment type  
- **Input:** Combined outputs from both ScrapeGraphAI nodes  
- **Output:** JSON structured sentiment summary with detailed breakdown  
- **Edge Cases:** Keyword-based sentiment may misclassify nuanced language; empty or malformed input data may cause errors; ensure inputs are valid JSON.

---

#### 2.4 Market Prediction

**Overview:**  
Transforms sentiment analysis results into actionable market predictions with confidence levels, reasoning, risk classification, and investment recommendations.

**Nodes Involved:**  
- Market Predictor

**Node Details:**  
- **Type:** Code node  
- **Role:** Apply business rules to sentiment scores to generate market direction predictions and advice  
- **Configuration:**  
  - Uses thresholds on sentiment score and bullish/bearish counts to assign prediction categories: strong_buy, buy, hold, sell, strong_sell  
  - Adjusts confidence score based on sentiment strength and data volume  
  - Compiles reasoning for prediction decisions in array form  
  - Maps predictions to tailored investment recommendations  
  - Categorizes risk level based on confidence  
- **Input:** Output JSON from Sentiment Analyzer  
- **Output:** JSON including prediction, confidence, reasoning, recommendations, and risk level  
- **Edge Cases:** Insufficient data sources lower confidence; borderline sentiment scores may cause unstable predictions.

---

#### 2.5 Timing Optimization

**Overview:**  
Provides strategic guidance on the best timing to act on market predictions, incorporating urgency, optimal timeframes, and seasonal real estate market patterns.

**Nodes Involved:**  
- Timing Optimizer

**Node Details:**  
- **Type:** Code node  
- **Role:** Refine investment timing recommendations based on prediction strength, confidence, and seasonal factors  
- **Configuration:**  
  - Defines timing categories: act_immediately, act_soon, monitor, exit_positions, reduce_exposure  
  - Uses current month to infer season (spring, summer, fall, winter) and adjust timing factors  
  - Outputs timing advice including urgency, recommended timeframe, and explanatory factors  
- **Input:** Output JSON from Market Predictor  
- **Output:** JSON enriched with timing recommendations and seasonal context  
- **Edge Cases:** System date/time misconfiguration affects seasonal logic; non-standard prediction values may cause gaps.

---

#### 2.6 Investment Advisor Alert

**Overview:**  
Generates a comprehensive, formatted investment alert message consolidating all analysis results for distribution.

**Nodes Involved:**  
- Investment Advisor Alert

**Node Details:**  
- **Type:** Code node  
- **Role:** Format detailed alert text with sentiment, prediction, confidence, timing, risk, and recommendations  
- **Configuration:**  
  - Constructs Markdown-formatted message with headings, bullet points, and emojis for readability  
  - Determines alert priority (normal, high, critical) based on urgency and confidence  
  - Includes summary statistics and timing factors  
  - Timestamp included for report generation time  
- **Input:** Output JSON from Timing Optimizer  
- **Output:** JSON with alert_title, alert_message (Markdown), alert_priority, and raw data  
- **Edge Cases:** Markdown formatting errors if input data contains unexpected characters; time zone consistency for timestamps.

---

#### 2.7 Telegram Delivery

**Overview:**  
Sends the generated investment alert message to a designated Telegram channel for immediate notification.

**Nodes Involved:**  
- Telegram Alert

**Node Details:**  
- **Type:** Telegram node (messaging integration)  
- **Role:** Deliver alert message to Telegram channel with Markdown formatting  
- **Configuration:**  
  - Uses chat ID `@real_estate_alerts`  
  - Message text bound dynamically to the alert message from previous node  
  - Markdown parse mode enabled for formatting  
- **Input:** Output JSON from Investment Advisor Alert  
- **Output:** Message delivery status  
- **Credentials:** Telegram Bot API token required, configured in n8n credentials  
- **Edge Cases:** Invalid bot token or chat ID causes auth failure; Telegram API downtime; message size limits.

---

### 3. Summary Table

| Node Name                   | Node Type                     | Functional Role                  | Input Node(s)                  | Output Node(s)              | Sticky Note                                                                                                                  |
|-----------------------------|-------------------------------|--------------------------------|-------------------------------|-----------------------------|------------------------------------------------------------------------------------------------------------------------------|
| Schedule Trigger            | Schedule Trigger              | Workflow trigger on schedule   | None                          | ScrapeGraphAI - RE Forums, ScrapeGraphAI - RE News | # Step 1: Schedule Trigger ⏱️ Daily Market Monitoring, runs at 8:00 AM daily to automate analysis                            |
| ScrapeGraphAI - RE Forums  | ScrapeGraphAI                | Forum data scraping            | Schedule Trigger              | Sentiment Analyzer          | # Step 2: Data Collection 🔍 Dual Source Scraping: BiggerPockets forum extraction for investor discussions                    |
| ScrapeGraphAI - RE News    | ScrapeGraphAI                | News data scraping             | Schedule Trigger              | Sentiment Analyzer          | # Step 2: Data Collection 🔍 Dual Source Scraping: Real estate news articles extraction for market trends                   |
| Sentiment Analyzer         | Code                         | Sentiment scoring and analysis | ScrapeGraphAI - RE Forums, ScrapeGraphAI - RE News | Market Predictor           | # Step 3: Sentiment Analysis 🧠 AI-powered sentiment scoring and market psychology analysis                                    |
| Market Predictor           | Code                         | Market prediction generation   | Sentiment Analyzer            | Timing Optimizer            | # Step 4: Market Prediction 🔮 Converts sentiment into actionable buy/sell/hold signals with confidence and recommendations    |
| Timing Optimizer           | Code                         | Timing recommendation          | Market Predictor              | Investment Advisor Alert    | # Step 5: Timing Optimization ⏰ Suggests optimal investment timing using market and seasonal factors                         |
| Investment Advisor Alert   | Code                         | Alert message generation       | Timing Optimizer              | Telegram Alert              | # Step 6: Investment Alert 🚨 Professional advisory alert with summary, priority, risk, timing, and recommendations           |
| Telegram Alert             | Telegram                     | Alert delivery via Telegram    | Investment Advisor Alert      | None                       | # Step 7: Telegram Delivery 📱 Instant notification system delivering formatted alerts to Telegram channel                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**  
   - Type: Schedule Trigger  
   - Parameters: Set cron expression to `0 8 * * *` (daily at 8:00 AM)  
   - No credentials needed  
   - Connect output to both ScrapeGraphAI nodes

2. **Create ScrapeGraphAI - RE Forums Node**  
   - Type: ScrapeGraphAI  
   - Parameters:  
     - Website URL: `https://www.biggerpockets.com/forums/real-estate-investing`  
     - User prompt: Extract forum discussions within last 24h with fields: title, author, date, content, replies_count, sentiment_indicators, URL (as per the prompt in the original node)  
   - Connect input from Schedule Trigger  
   - Connect output to Sentiment Analyzer input 1

3. **Create ScrapeGraphAI - RE News Node**  
   - Type: ScrapeGraphAI  
   - Parameters:  
     - Website URL: `https://www.realestateinvestingtrust.com/news`  
     - User prompt: Extract news articles within last 24h with fields: headline, author, date, summary, key_points, market_impact, URL (as per original)  
   - Connect input from Schedule Trigger  
   - Connect output to Sentiment Analyzer input 2

4. **Create Sentiment Analyzer Node**  
   - Type: Code (JavaScript)  
   - Parameters: Paste the JavaScript code that:  
     - Combines forum and news data  
     - Analyzes sentiment by keyword matching  
     - Assigns sentiment labels and scores  
     - Calculates overall sentiment and outputs detailed sentiment array  
   - Connect inputs from both ScrapeGraphAI nodes  
   - Connect output to Market Predictor

5. **Create Market Predictor Node**  
   - Type: Code (JavaScript)  
   - Parameters: Paste JavaScript code that:  
     - Uses sentiment scores to generate market predictions (strong_buy, buy, hold, sell, strong_sell)  
     - Calculates confidence level and reasoning array  
     - Assigns risk level and investment recommendations  
   - Connect input from Sentiment Analyzer  
   - Connect output to Timing Optimizer

6. **Create Timing Optimizer Node**  
   - Type: Code (JavaScript)  
   - Parameters: Paste JavaScript code that:  
     - Determines timing recommendation (act immediately, act soon, monitor, exit positions, reduce exposure)  
     - Considers seasonality based on current month  
     - Outputs urgency, optimal timeframe, timing factors, and current season  
   - Connect input from Market Predictor  
   - Connect output to Investment Advisor Alert

7. **Create Investment Advisor Alert Node**  
   - Type: Code (JavaScript)  
   - Parameters: Paste JavaScript code that:  
     - Formats a Markdown alert message including sentiment summary, market prediction, confidence, timing, risk, and recommendations  
     - Determines alert priority (normal, high, critical)  
     - Adds timestamps and structured message  
   - Connect input from Timing Optimizer  
   - Connect output to Telegram Alert

8. **Create Telegram Alert Node**  
   - Type: Telegram  
   - Parameters:  
     - Chat ID: `@real_estate_alerts`  
     - Text: Expression binding to previous node’s `alert_message` property (`={{ $json.alert_message }}`)  
     - Additional fields: Enable Markdown parse mode  
   - Credentials: Configure Telegram Bot API credentials (token from @BotFather)  
   - Connect input from Investment Advisor Alert

---

### 5. General Notes & Resources

| Note Content                                                                                                            | Context or Link                                                    |
|-------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| Workflow performs daily real estate market sentiment monitoring integrating forum and news data with AI analysis.       | General project description                                      |
| Setup Telegram bot using @BotFather and add to your channel with proper bot token and chat ID configuration in n8n.    | Telegram API setup instructions                                  |
| Sentiment analysis uses keyword-based heuristic, which may be improved by integrating advanced NLP models in future.   | Potential improvement note                                       |
| Seasonal timing factors are simplified and based on month ranges for real estate activity peaks and off-seasons.        | Domain-specific seasonal factor explanation                      |
| Real estate forum source: BiggerPockets (https://www.biggerpockets.com/forums/real-estate-investing)                    | Source website for forums                                        |
| Real estate news source: RealEstateInvestingTrust (https://www.realestateinvestingtrust.com/news)                        | Source website for news                                         |

---

**Disclaimer:** The provided text is exclusively derived from an n8n automated workflow. It strictly complies with content policies and does not include illegal, offensive, or protected material. All data handled is legal and publicly accessible.

---