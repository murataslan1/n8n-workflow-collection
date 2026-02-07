AI-Powered Stock Analysis with Multi-Model Consensus and Telegram Alerts

https://n8nworkflows.xyz/workflows/ai-powered-stock-analysis-with-multi-model-consensus-and-telegram-alerts-10615


# AI-Powered Stock Analysis with Multi-Model Consensus and Telegram Alerts

### 1. Workflow Overview

This workflow automates daily stock market analysis by aggregating multiple data sources and applying AI models to generate a consensus-driven trading recommendation. It targets investors or analysts seeking an AI-powered, multi-perspective stock evaluation combined with real-time Telegram alerts.

The workflow is logically structured into the following blocks:

- **1.1 Scheduled Trigger & API Setup**: Initiates daily execution and configures API parameters.
- **1.2 Data Acquisition**: Fetches stock price data, news sentiment, analyst ratings, and social media sentiment via HTTP requests.
- **1.3 Initial Data Analysis**: Processes each data source with custom code nodes to extract meaningful insights.
- **1.4 Data Combination & Recommendation Generation**: Merges analyzed data and produces a comprehensive stock recommendation.
- **1.5 AI Validation & Consensus**: Uses three different AI language models (OpenAI GPT, Anthropic Claude, and xAI Grok/Gemini) to validate the recommendation and reach consensus.
- **1.6 Alert Formatting & Delivery**: Formats the final message and sends a Telegram alert to users.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Trigger & API Setup

**Overview:** This block triggers the workflow daily and sets up necessary API configurations for subsequent data fetches.

**Nodes Involved:**  
- Daily Stock Check  
- API Configuration

**Node Details:**

- **Daily Stock Check**  
  - *Type:* Schedule Trigger  
  - *Role:* Triggers workflow execution daily at a preset time (default schedule, not explicitly configured in JSON).  
  - *Inputs:* None (trigger node)  
  - *Outputs:* API Configuration  
  - *Version:* 1.2  
  - *Potential Failures:* Scheduling misconfiguration, instance downtime.

- **API Configuration**  
  - *Type:* Set  
  - *Role:* Prepares API keys, endpoints, or parameters required for HTTP requests.  
  - *Inputs:* From Daily Stock Check  
  - *Outputs:* Stock Data Fatch, News Sentiment Fatch, Analyst Ratings Fetch, Social Media Sentiment Fetch  
  - *Version:* 3.4  
  - *Potential Failures:* Missing or invalid API credentials, misconfigured parameters.

---

#### 1.2 Data Acquisition

**Overview:** Fetches raw data from multiple sources via HTTP requests for stock prices, news sentiment, analyst ratings, and social media sentiment.

**Nodes Involved:**  
- Stock Data Fatch  
- News Sentiment Fatch  
- Analyst Ratings Fetch  
- Social Media Sentiment Fetch

**Node Details:**

- **Stock Data Fatch**  
  - *Type:* HTTP Request  
  - *Role:* Retrieves current and historical stock price data.  
  - *Inputs:* API Configuration  
  - *Outputs:* Analyze Stock Trends  
  - *Parameters:* Configured URL, authentication, and query parameters for stock API.  
  - *Version:* 4.2  
  - *Potential Failures:* Network errors, API rate limits, invalid symbols.

- **News Sentiment Fatch**  
  - *Type:* HTTP Request  
  - *Role:* Fetches news articles and related sentiment scores.  
  - *Inputs:* API Configuration  
  - *Outputs:* Analyze News Sentiment  
  - *Version:* 4.2  
  - *Potential Failures:* API errors, no news data, malformed responses.

- **Analyst Ratings Fetch**  
  - *Type:* HTTP Request  
  - *Role:* Obtains current analyst ratings and recommendations.  
  - *Inputs:* API Configuration  
  - *Outputs:* Process Analyst Ratings  
  - *Version:* 4.2  
  - *Potential Failures:* Data unavailability, authentication issues.

- **Social Media Sentiment Fetch**  
  - *Type:* HTTP Request  
  - *Role:* Collects sentiment data from social media platforms regarding the stock.  
  - *Inputs:* API Configuration  
  - *Outputs:* Analyze Social Sentiment  
  - *Version:* 4.2  
  - *Potential Failures:* API limits, noisy or sparse data.

---

#### 1.3 Initial Data Analysis

**Overview:** Processes the raw data from each source using JavaScript code nodes to extract actionable insights.

**Nodes Involved:**  
- Analyze Stock Trends  
- Predict Future Trends  
- Analyze News Sentiment  
- Process Analyst Ratings  
- Analyze Social Sentiment

**Node Details:**

- **Analyze Stock Trends**  
  - *Type:* Code  
  - *Role:* Analyzes stock price data to detect trends and patterns.  
  - *Inputs:* Stock Data Fatch  
  - *Outputs:* Predict Future Trends  
  - *Version:* 2  
  - *Potential Failures:* Code errors, unexpected data formats.

- **Predict Future Trends**  
  - *Type:* Code  
  - *Role:* Projects possible future stock trends based on historical analysis.  
  - *Inputs:* Analyze Stock Trends  
  - *Outputs:* Combine All Analysis  
  - *Version:* 2  
  - *Potential Failures:* Prediction logic errors.

- **Analyze News Sentiment**  
  - *Type:* Code  
  - *Role:* Converts news sentiment data into quantified scores or categories.  
  - *Inputs:* News Sentiment Fatch  
  - *Outputs:* Combine All Analysis (connected at index 1)  
  - *Version:* 2  
  - *Potential Failures:* Sentiment parsing errors, empty news data.

- **Process Analyst Ratings**  
  - *Type:* Code  
  - *Role:* Summarizes analyst ratings into a usable metric or signal.  
  - *Inputs:* Analyst Ratings Fetch  
  - *Outputs:* Combine All Analysis (connected at index 2)  
  - *Version:* 2  
  - *Potential Failures:* Inconsistent rating formats.

- **Analyze Social Sentiment**  
  - *Type:* Code  
  - *Role:* Evaluates social media sentiment for bullish/bearish indicators.  
  - *Inputs:* Social Media Sentiment Fetch  
  - *Outputs:* Combine All Analysis (connected at index 3)  
  - *Version:* 2  
  - *Potential Failures:* Noisy data, API response anomalies.

---

#### 1.4 Data Combination & Recommendation Generation

**Overview:** Merges all analyzed data sources and generates a comprehensive stock recommendation.

**Nodes Involved:**  
- Combine All Analysis  
- Generate Comprehensive Recommendation  
- Prepare AI Validation Input

**Node Details:**

- **Combine All Analysis**  
  - *Type:* Merge  
  - *Role:* Combines outputs from Predict Future Trends, Analyze News Sentiment, Process Analyst Ratings, and Analyze Social Sentiment into a single dataset.  
  - *Inputs:* Predict Future Trends, Analyze News Sentiment, Process Analyst Ratings, Analyze Social Sentiment  
  - *Outputs:* Generate Comprehensive Recommendation  
  - *Version:* 3.2  
  - *Potential Failures:* Data structure mismatches.

- **Generate Comprehensive Recommendation**  
  - *Type:* Code  
  - *Role:* Synthesizes combined data into a final recommendation summary for the stock.  
  - *Inputs:* Combine All Analysis  
  - *Outputs:* Format Telegram Message, Prepare AI Validation Input  
  - *Version:* 2  
  - *Potential Failures:* Logic errors, incomplete data.

- **Prepare AI Validation Input**  
  - *Type:* Set  
  - *Role:* Prepares and formats the recommendation text for AI validation nodes.  
  - *Inputs:* Generate Comprehensive Recommendation  
  - *Outputs:* AI Validator 1 - OpenAI, AI Validator 2 - Anthropic, AI Validator 3 - Gemini  
  - *Version:* 3.4  
  - *Potential Failures:* Data formatting errors.

---

#### 1.5 AI Validation & Consensus

**Overview:** Validates the recommendation using three AI models and evaluates their consensus to improve reliability.

**Nodes Involved:**  
- AI Validator 1 - OpenAI  
- AI Validator 2 - Anthropic  
- AI Validator 3 - Gemini  
- OpenAI GPT Model  
- Anthropic Claude Model  
- xAI Grok Chat Model  
- Combine AI Validations  
- Evaluate AI Consensus

**Node Details:**

- **OpenAI GPT Model**  
  - *Type:* LangChain LLM Chat (OpenAI)  
  - *Role:* Provides AI-generated validation content or analysis.  
  - *Inputs:* None directly, used internally by AI Validator 1  
  - *Outputs:* AI Validator 1 - OpenAI  
  - *Version:* 1.2  
  - *Credentials:* OpenAI API key required  
  - *Potential Failures:* API limits, authentication errors.

- **Anthropic Claude Model**  
  - *Type:* LangChain LLM Chat (Anthropic)  
  - *Role:* Provides AI validation from Anthropic Claude model.  
  - *Inputs:* None directly, used internally by AI Validator 2  
  - *Outputs:* AI Validator 2 - Anthropic  
  - *Version:* 1.3  
  - *Credentials:* Anthropic API key required  
  - *Potential Failures:* API limits, auth errors.

- **xAI Grok Chat Model**  
  - *Type:* LangChain LLM Chat (xAI Grok/Gemini)  
  - *Role:* Third AI validation source.  
  - *Inputs:* None directly, used internally by AI Validator 3  
  - *Outputs:* AI Validator 3 - Gemini  
  - *Version:* 1  
  - *Credentials:* xAI API key or equivalent required  
  - *Potential Failures:* Connectivity or auth issues.

- **AI Validator 1 - OpenAI**  
  - *Type:* LangChain Chain LLM  
  - *Role:* Executes OpenAI GPT Model to validate recommendation.  
  - *Inputs:* Prepare AI Validation Input  
  - *Outputs:* Combine AI Validations  
  - *Version:* 1.7  
  - *Potential Failures:* Execution errors, input format issues.

- **AI Validator 2 - Anthropic**  
  - *Type:* LangChain Chain LLM  
  - *Role:* Executes Anthropic Claude Model for validation.  
  - *Inputs:* Prepare AI Validation Input  
  - *Outputs:* Combine AI Validations  
  - *Version:* 1.7  
  - *Potential Failures:* Same as above.

- **AI Validator 3 - Gemini**  
  - *Type:* LangChain Chain LLM  
  - *Role:* Executes xAI Grok Chat Model for validation.  
  - *Inputs:* Prepare AI Validation Input  
  - *Outputs:* Combine AI Validations  
  - *Version:* 1.7  
  - *Potential Failures:* Same as above.

- **Combine AI Validations**  
  - *Type:* Merge  
  - *Role:* Aggregates outputs from all three AI validators.  
  - *Inputs:* AI Validator 1 - OpenAI, AI Validator 2 - Anthropic, AI Validator 3 - Gemini  
  - *Outputs:* Evaluate AI Consensus  
  - *Version:* 3.2  
  - *Potential Failures:* Data inconsistency.

- **Evaluate AI Consensus**  
  - *Type:* Code  
  - *Role:* Analyzes combined AI outputs to determine consensus level and confidence.  
  - *Inputs:* Combine AI Validations  
  - *Outputs:* Format Telegram Message  
  - *Version:* 2  
  - *Potential Failures:* Logic errors, ambiguous consensus.

---

#### 1.6 Alert Formatting & Delivery

**Overview:** Formats the final consensus recommendation into a Telegram message and sends it to configured recipients.

**Nodes Involved:**  
- Format Telegram Message  
- Send Telegram Alert

**Node Details:**

- **Format Telegram Message**  
  - *Type:* Set  
  - *Role:* Creates a well-structured message text including stock recommendation and AI consensus summary.  
  - *Inputs:* Generate Comprehensive Recommendation, Evaluate AI Consensus  
  - *Outputs:* Send Telegram Alert  
  - *Version:* 3.4  
  - *Potential Failures:* Formatting errors, missing data.

- **Send Telegram Alert**  
  - *Type:* Telegram  
  - *Role:* Sends the message via Telegram bot to subscribed users or channels.  
  - *Inputs:* Format Telegram Message  
  - *Outputs:* None (end node)  
  - *Version:* 1.2  
  - *Credentials:* Telegram Bot API token required  
  - *Potential Failures:* Bot token issues, network errors, chat ID misconfiguration.

---

### 3. Summary Table

| Node Name                    | Node Type                               | Functional Role                            | Input Node(s)                         | Output Node(s)                                | Sticky Note |
|------------------------------|---------------------------------------|--------------------------------------------|-------------------------------------|-----------------------------------------------|-------------|
| Daily Stock Check             | Schedule Trigger                       | Initiates daily workflow execution         | -                                   | API Configuration                             |             |
| API Configuration            | Set                                   | Sets API keys and parameters                | Daily Stock Check                   | Stock Data Fatch, News Sentiment Fatch, Analyst Ratings Fetch, Social Media Sentiment Fetch |             |
| Stock Data Fatch             | HTTP Request                          | Fetches stock price data                     | API Configuration                  | Analyze Stock Trends                          |             |
| News Sentiment Fatch         | HTTP Request                          | Fetches news sentiment data                  | API Configuration                  | Analyze News Sentiment                        |             |
| Analyst Ratings Fetch        | HTTP Request                          | Fetches analyst ratings                       | API Configuration                  | Process Analyst Ratings                       |             |
| Social Media Sentiment Fetch | HTTP Request                          | Fetches social media sentiment data          | API Configuration                  | Analyze Social Sentiment                      |             |
| Analyze Stock Trends         | Code                                  | Analyzes stock data for trends               | Stock Data Fatch                  | Predict Future Trends                         |             |
| Predict Future Trends        | Code                                  | Predicts future stock trends                  | Analyze Stock Trends               | Combine All Analysis                          |             |
| Analyze News Sentiment       | Code                                  | Analyzes news sentiment                       | News Sentiment Fatch              | Combine All Analysis                          |             |
| Process Analyst Ratings      | Code                                  | Processes analyst ratings                      | Analyst Ratings Fetch             | Combine All Analysis                          |             |
| Analyze Social Sentiment     | Code                                  | Analyzes social media sentiment               | Social Media Sentiment Fetch      | Combine All Analysis                          |             |
| Combine All Analysis         | Merge                                 | Combines all analyzed data                    | Predict Future Trends, Analyze News Sentiment, Process Analyst Ratings, Analyze Social Sentiment | Generate Comprehensive Recommendation        |             |
| Generate Comprehensive Recommendation | Code                          | Synthesizes final recommendation              | Combine All Analysis              | Format Telegram Message, Prepare AI Validation Input |             |
| Prepare AI Validation Input  | Set                                   | Formats recommendation for AI validation     | Generate Comprehensive Recommendation | AI Validator 1 - OpenAI, AI Validator 2 - Anthropic, AI Validator 3 - Gemini |             |
| AI Validator 1 - OpenAI      | LangChain Chain LLM                   | Runs OpenAI GPT model validation              | Prepare AI Validation Input       | Combine AI Validations                        |             |
| AI Validator 2 - Anthropic   | LangChain Chain LLM                   | Runs Anthropic Claude model validation         | Prepare AI Validation Input       | Combine AI Validations                        |             |
| AI Validator 3 - Gemini      | LangChain Chain LLM                   | Runs xAI Grok Chat (Gemini) model validation  | Prepare AI Validation Input       | Combine AI Validations                        |             |
| OpenAI GPT Model             | LangChain LLM Chat                   | Provides OpenAI GPT model for validation      | -                               | AI Validator 1 - OpenAI                       |             |
| Anthropic Claude Model       | LangChain LLM Chat                   | Provides Anthropic Claude model for validation | -                               | AI Validator 2 - Anthropic                    |             |
| xAI Grok Chat Model          | LangChain LLM Chat                   | Provides xAI Grok/Gemini model for validation  | -                               | AI Validator 3 - Gemini                       |             |
| Combine AI Validations       | Merge                                 | Merges AI validation results                   | AI Validator 1 - OpenAI, AI Validator 2 - Anthropic, AI Validator 3 - Gemini | Evaluate AI Consensus                        |             |
| Evaluate AI Consensus        | Code                                  | Evaluates consensus among AI validators        | Combine AI Validations            | Format Telegram Message                       |             |
| Format Telegram Message      | Set                                   | Formats final message for Telegram alert      | Generate Comprehensive Recommendation, Evaluate AI Consensus | Send Telegram Alert                          |             |
| Send Telegram Alert          | Telegram                              | Sends alert message via Telegram bot          | Format Telegram Message           | -                                             |             |
| Sticky Note                  | Sticky Note                          | (No content)                                  | -                               | -                                             |             |
| Sticky Note1                 | Sticky Note                          | (No content)                                  | -                               | -                                             |             |
| Sticky Note2                 | Sticky Note                          | (No content)                                  | -                               | -                                             |             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node**  
   - Name: `Daily Stock Check`  
   - Type: `Schedule Trigger`  
   - Configure to trigger once daily at a preferred time.

2. **Add a Set node for API configuration**  
   - Name: `API Configuration`  
   - Connect input from `Daily Stock Check`  
   - Set required API keys, endpoints, stock symbols, and parameters as variables for reuse.

3. **Add HTTP Request nodes to fetch data:**  
   - `Stock Data Fatch`: configure with stock data API URL, auth, and parameters from `API Configuration`.  
   - `News Sentiment Fatch`: configure with news sentiment API details.  
   - `Analyst Ratings Fetch`: configure with analyst ratings API.  
   - `Social Media Sentiment Fetch`: configure with social media sentiment API.  
   - Connect all these nodes as outputs from `API Configuration`.

4. **Create Code nodes for initial analysis:**  
   - `Analyze Stock Trends`: input from `Stock Data Fatch`, write JS code to analyze price trends.  
   - `Predict Future Trends`: input from `Analyze Stock Trends`, write code to forecast trends.  
   - `Analyze News Sentiment`: input from `News Sentiment Fatch`, write code to interpret sentiment.  
   - `Process Analyst Ratings`: input from `Analyst Ratings Fetch`, write code to summarize ratings.  
   - `Analyze Social Sentiment`: input from `Social Media Sentiment Fetch`, write code to process social sentiment.

5. **Add a Merge node**  
   - Name: `Combine All Analysis`  
   - Connect inputs from `Predict Future Trends`, `Analyze News Sentiment`, `Process Analyst Ratings`, and `Analyze Social Sentiment`.  
   - Configure mode as “Merge by index” or "Wait for all inputs".

6. **Add a Code node**  
   - Name: `Generate Comprehensive Recommendation`  
   - Input from `Combine All Analysis`  
   - Write logic to synthesize all inputs into a single, clear stock recommendation.

7. **Add a Set node**  
   - Name: `Prepare AI Validation Input`  
   - Input from `Generate Comprehensive Recommendation`  
   - Format and prepare the recommendation text for AI validation models.

8. **Set up AI language model nodes:**  
   - `OpenAI GPT Model` (LangChain LLM Chat OpenAI) with OpenAI API credentials.  
   - `Anthropic Claude Model` (LangChain LLM Chat Anthropic) with Anthropic API credentials.  
   - `xAI Grok Chat Model` (LangChain LLM Chat xAI Grok/Gemini) with appropriate credentials.

9. **Add Chain LLM nodes for AI validation:**  
   - `AI Validator 1 - OpenAI`: input from `Prepare AI Validation Input`, configured to use `OpenAI GPT Model`.  
   - `AI Validator 2 - Anthropic`: input from `Prepare AI Validation Input`, configured to use `Anthropic Claude Model`.  
   - `AI Validator 3 - Gemini`: input from `Prepare AI Validation Input`, configured to use `xAI Grok Chat Model`.

10. **Add a Merge node**  
    - Name: `Combine AI Validations`  
    - Inputs from all three AI Validator nodes.  
    - Configure to wait for all inputs.

11. **Add a Code node**  
    - Name: `Evaluate AI Consensus`  
    - Input from `Combine AI Validations`  
    - Write code to assess agreement among AI model outputs and determine confidence scores.

12. **Add a Set node**  
    - Name: `Format Telegram Message`  
    - Inputs from `Generate Comprehensive Recommendation` and `Evaluate AI Consensus`  
    - Compose a formatted string message including key insights and consensus summary.

13. **Add a Telegram node**  
    - Name: `Send Telegram Alert`  
    - Input from `Format Telegram Message`  
    - Configure Telegram Bot API credentials and target chat/channel ID.

14. **Connect the workflow as per data flow:**  
    - `Daily Stock Check` → `API Configuration` → all HTTP Request nodes → Analysis code nodes → `Combine All Analysis` → `Generate Comprehensive Recommendation` → `Format Telegram Message` & `Prepare AI Validation Input` → AI Validators → `Combine AI Validations` → `Evaluate AI Consensus` → `Format Telegram Message` → `Send Telegram Alert`.

---

### 5. General Notes & Resources

| Note Content                                                                                                          | Context or Link                     |
|-----------------------------------------------------------------------------------------------------------------------|-----------------------------------|
| Workflow leverages three leading AI models (OpenAI GPT, Anthropic Claude, xAI Grok/Gemini) for multi-model validation. | Important for robustness of output |
| Telegram alerts require bot token and chat IDs to be securely stored in credentials.                                  | Telegram Bot API documentation     |
| HTTP Request nodes assume valid API keys and endpoints for stock data, news, analyst ratings, and social sentiment.    | APIs documentation of each service |
| Using LangChain nodes requires installation of n8n community nodes or packages for LangChain integration.              | https://n8n.io/integrations/langchain |
| Ensure API rate limits are respected to avoid throttling or blocking.                                                 | Monitor API quotas                 |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created with n8n, a tool for integration and automation. This processing strictly adheres to applicable content policies and contains no illegal, offensive, or protected elements. All handled data is legal and public.