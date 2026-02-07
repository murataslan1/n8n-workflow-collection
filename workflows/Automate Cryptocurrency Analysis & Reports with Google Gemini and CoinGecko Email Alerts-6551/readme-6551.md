Automate Cryptocurrency Analysis & Reports with Google Gemini and CoinGecko Email Alerts

https://n8nworkflows.xyz/workflows/automate-cryptocurrency-analysis---reports-with-google-gemini-and-coingecko-email-alerts-6551


# Automate Cryptocurrency Analysis & Reports with Google Gemini and CoinGecko Email Alerts

### 1. Workflow Overview

This workflow automates the daily retrieval, analysis, and reporting of cryptocurrency market data using CoinGecko’s API and Google Gemini AI models. It targets users who want timely, AI-generated professional insights on specific cryptocurrencies delivered via email. The workflow is designed to run every day at 10:00 AM, fetching detailed market data for four cryptocurrencies (BONK, PEPE, Radio Caca, and Stellar), cleaning and formatting this data, generating concise AI-based analyses, and emailing these analyses to predefined recipients.

Logical blocks in the workflow:

- **1.1 Scheduled Trigger & Data Extraction:** Automatically triggers daily and fetches raw market data for four cryptocurrencies via HTTP requests to CoinGecko API.
- **1.2 Data Cleaning:** Processes and formats the raw JSON data into a human-readable structure suitable for AI input.
- **1.3 AI Prompt Preparation:** Constructs detailed prompts embedding cleaned data for AI analysis.
- **1.4 AI Analysis Generation:** Uses Google Gemini Chat Models to generate professional cryptocurrency market analyses from prompts.
- **1.5 Email Dispatch:** Sends the AI-generated analyses via Outlook email to specified recipients.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Trigger & Data Extraction

- **Overview:**  
  Starts the workflow every day at 10:00 AM and fetches cryptocurrency market data for BONK, PEPE, Radio Caca, and Stellar from CoinGecko API.

- **Nodes Involved:**  
  - Schedule Trigger  
  - Extract Crypto Data1 (BONK)  
  - Extract Crypto Data2 (PEPE)  
  - Extract Crypto Data3 (Radio Caca)  
  - Extract Crypto Data4 (Stellar)

- **Node Details:**

  - **Schedule Trigger**  
    - Type: Schedule Trigger  
    - Config: Triggers daily at 10:00 AM local time  
    - Inputs: None (start node)  
    - Outputs: Four parallel outputs connecting to each Extract Crypto Data node  
    - Potential Failures: System downtime, schedule misconfiguration

  - **Extract Crypto Data1, 2, 3, 4**  
    - Type: HTTP Request  
    - Config: GET requests to CoinGecko API endpoints for markets data, filtered by cryptocurrency id (`bonk`, `pepe`, `radio-caca`, `stellar`) and Turkish Lira (TRY) currency  
    - Inputs: Schedule Trigger  
    - Outputs: Raw JSON data to respective Data Cleaning nodes  
    - Expressions: URLs hardcoded with `ids` parameter per coin  
    - Potential Failures: API downtime, rate limiting, network errors, invalid coin IDs

#### 1.2 Data Cleaning

- **Overview:**  
  Cleans and formats raw API data for each coin to structured JSON suitable for AI prompt insertion, adding units and formatting decimals.

- **Nodes Involved:**  
  - Data Cleaning1  
  - Data Cleaning2  
  - Data Cleaning3  
  - Data Cleaning4

- **Node Details:**

  - **Data Cleaning (all 4 nodes)**  
    - Type: Code (JavaScript)  
    - Config: Custom JS function that:  
      - Checks each data field for null/undefined and replaces with “Belirlenemedi” (Turkish for "Undetermined")  
      - Formats numbers to fixed decimals for prices and percentages  
      - Combines units (e.g., “TL” for Turkish Lira, “%” for percentages)  
      - Extracts fields: name, symbol (uppercased), current price, 24h high/low, 24h price change %, volume, ATH/ATL and their change %, circulating/total/max supply  
    - Inputs: Corresponding Extract Crypto Data node  
    - Outputs: Cleaned JSON to AI Prompt nodes  
    - Edge Cases: Missing or null data fields, unexpected data types

#### 1.3 AI Prompt Preparation

- **Overview:**  
  Builds a detailed textual prompt embedding the cleaned coin data to instruct the AI model to generate an analysis with specified format and tone.

- **Nodes Involved:**  
  - AI Promt1 (BONK)  
  - AI Promt2 (PEPE)  
  - AI Promt3 (Radio Caca)  
  - AI Promt4 (Stellar)

- **Node Details:**

  - **AI Promt (all 4 nodes)**  
    - Type: Set  
    - Config: Assigns a `chatInput` string with a templated message including:  
      - Current date/time localized to Istanbul timezone  
      - Cleaned coin data fields with labels  
      - Instructions to analyze under headings: price status, liquidity, investor interest, risk/opportunity, judgment, and final recommendation sentence  
      - Allows moderate use of emojis  
      - Example intro sentence included  
    - Inputs: Cleaned data from Data Cleaning nodes  
    - Outputs: Prompt string to AI Analysis nodes  
    - Expressions: Uses n8n expression syntax to insert dynamic fields and date/time  
    - Edge Cases: Incorrect data formatting could produce confusing prompts  

#### 1.4 AI Analysis Generation

- **Overview:**  
  Passes the prepared prompt to a Google Gemini AI chat model to generate a concise, professional cryptocurrency market analysis.

- **Nodes Involved:**  
  - AI Analysis1  
  - AI Analysis2  
  - AI Analysis3  
  - AI Analysis4  
  - Google Gemini Chat Model (linked to AI Analysis2)  
  - Google Gemini Chat Model4 (linked to AI Analysis1)  
  - Google Gemini Chat Model5 (linked to AI Analysis3)  
  - Google Gemini Chat Model6 (linked to AI Analysis4)

- **Node Details:**

  - **AI Analysis Nodes (1-4)**  
    - Type: LangChain Basic LLM Chain  
    - Config: Receives `chatInput` prompt, no batching parameters set  
    - Inputs: AI Promt nodes  
    - Outputs: Generated analysis text to email sending nodes  
    - Edge Cases: API quota limits, network failures, malformed prompts causing poor output

  - **Google Gemini Chat Model Nodes**  
    - Type: LangChain Google Gemini Chat Model  
    - Config: Model name “models/gemini-2.5-pro” used for all nodes except some without explicit modelName (default assumed)  
    - Credentials: Google Palm API OAuth2 credentials required  
    - Inputs: AI Analysis nodes (as language model backend)  
    - Outputs: AI Analysis nodes (processed output)  
    - Potential Failures: API key expiration, quota exceeded, service downtime

#### 1.5 Email Dispatch

- **Overview:**  
  Sends the AI-generated cryptocurrency analysis via Microsoft Outlook email to specified recipients.

- **Nodes Involved:**  
  - Send Mail1 (BONK)  
  - Send Mail2 (PEPE)  
  - Send Mail3 (Radio Caca)  
  - Send Mail4 (Stellar)

- **Node Details:**

  - **Send Mail Nodes (1-4)**  
    - Type: Microsoft Outlook (OAuth2)  
    - Config:  
      - Subject includes localized date/time and coin name with "Crypto Prediction System" suffix  
      - Body contains AI-generated text (`$json.text`)  
      - Recipients configured via `toRecipients` field (user must replace placeholder email addresses)  
      - Retry on failure enabled  
    - Inputs: AI Analysis nodes  
    - Outputs: None (terminal nodes)  
    - Credentials: OAuth2 Microsoft Outlook account required  
    - Edge Cases: Invalid email addresses, OAuth token expiration, mail server issues

---

### 3. Summary Table

| Node Name             | Node Type                     | Functional Role                     | Input Node(s)               | Output Node(s)            | Sticky Note                                                                                              |
|-----------------------|-------------------------------|-----------------------------------|-----------------------------|---------------------------|--------------------------------------------------------------------------------------------------------|
| Schedule Trigger       | Schedule Trigger               | Triggers workflow daily at 10:00 | None                        | Extract Crypto Data1-4     |                                                                                                        |
| Extract Crypto Data1   | HTTP Request                  | Fetch BONK coin market data       | Schedule Trigger             | Data Cleaning1            | Coingecko API                                                                                          |
| Extract Crypto Data2   | HTTP Request                  | Fetch PEPE coin market data       | Schedule Trigger             | Data Cleaning2            | Coingecko API                                                                                          |
| Extract Crypto Data3   | HTTP Request                  | Fetch Radio Caca market data      | Schedule Trigger             | Data Cleaning3            | Coingecko API                                                                                          |
| Extract Crypto Data4   | HTTP Request                  | Fetch Stellar coin market data    | Schedule Trigger             | Data Cleaning4            | Coingecko API                                                                                          |
| Data Cleaning1        | Code                          | Clean & format BONK data          | Extract Crypto Data1         | AI Promt1                 | Data Cleaning                                                                                          |
| Data Cleaning2        | Code                          | Clean & format PEPE data          | Extract Crypto Data2         | AI Promt2                 | Data Cleaning                                                                                          |
| Data Cleaning3        | Code                          | Clean & format Radio Caca data    | Extract Crypto Data3         | AI Promt3                 | Data Cleaning                                                                                          |
| Data Cleaning4        | Code                          | Clean & format Stellar data        | Extract Crypto Data4         | AI Promt4                 | Data Cleaning                                                                                          |
| AI Promt1             | Set                           | Prepare BONK AI prompt            | Data Cleaning1              | AI Analysis1              | AI Promt                                                                                                |
| AI Promt2             | Set                           | Prepare PEPE AI prompt            | Data Cleaning2              | AI Analysis2              | AI Promt                                                                                                |
| AI Promt3             | Set                           | Prepare Radio Caca AI prompt      | Data Cleaning3              | AI Analysis3              | AI Promt                                                                                                |
| AI Promt4             | Set                           | Prepare Stellar AI prompt         | Data Cleaning4              | AI Analysis4              | AI Promt                                                                                                |
| Google Gemini Chat Model4 | LangChain Google Gemini Model | AI model for BONK analysis       | AI Analysis1 (ai_languageModel) | AI Analysis1           | AI Generate                                                                                            |
| Google Gemini Chat Model | LangChain Google Gemini Model | AI model for PEPE analysis       | AI Analysis2 (ai_languageModel) | AI Analysis2           | AI Generate                                                                                            |
| Google Gemini Chat Model5 | LangChain Google Gemini Model | AI model for Radio Caca analysis | AI Analysis3 (ai_languageModel) | AI Analysis3           | AI Generate                                                                                            |
| Google Gemini Chat Model6 | LangChain Google Gemini Model | AI model for Stellar analysis    | AI Analysis4 (ai_languageModel) | AI Analysis4           | AI Generate                                                                                            |
| AI Analysis1          | Basic LLM Chain               | Generates BONK analysis text      | AI Promt1 + Google Gemini Chat Model4 | Send Mail1        |                                                                                                        |
| AI Analysis2          | Basic LLM Chain               | Generates PEPE analysis text      | AI Promt2 + Google Gemini Chat Model | Send Mail2        |                                                                                                        |
| AI Analysis3          | Basic LLM Chain               | Generates Radio Caca analysis text| AI Promt3 + Google Gemini Chat Model5 | Send Mail3        |                                                                                                        |
| AI Analysis4          | Basic LLM Chain               | Generates Stellar analysis text   | AI Promt4 + Google Gemini Chat Model6 | Send Mail4        |                                                                                                        |
| Send Mail1            | Microsoft Outlook             | Send BONK analysis via email      | AI Analysis1                | None                      | Send Mail                                                                                              |
| Send Mail2            | Microsoft Outlook             | Send PEPE analysis via email      | AI Analysis2                | None                      | Send Mail                                                                                              |
| Send Mail3            | Microsoft Outlook             | Send Radio Caca analysis via email| AI Analysis3               | None                      | Send Mail                                                                                              |
| Send Mail4            | Microsoft Outlook             | Send Stellar analysis via email   | AI Analysis4                | None                      | Send Mail                                                                                              |
| Sticky Note           | Sticky Note                  | Notes on Coingecko API            | None                       | None                      | Coingecko API                                                                                          |
| Sticky Note1          | Sticky Note                  | Notes on Data Cleaning            | None                       | None                      | Data Cleaning                                                                                          |
| Sticky Note2          | Sticky Note                  | Notes on AI Prompt Construction   | None                       | None                      | AI Promt                                                                                                |
| Sticky Note3          | Sticky Note                  | Notes on AI Generation            | None                       | None                      | AI Generate                                                                                            |
| Sticky Note4          | Sticky Note                  | Notes on Email Sending            | None                       | None                      | Send Mail                                                                                              |
| Sticky Note5          | Sticky Note                  | Full workflow explanation & customization instructions | None    | None                      | Hello, This workflow is an automated system that fetches market data for your specified cryptocurrencies... |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**  
   - Type: Schedule Trigger  
   - Set to trigger daily at 10:00 AM (local timezone)  
   - No inputs; outputs connect to next nodes

2. **Create Four HTTP Request Nodes (Extract Crypto Data1-4)**  
   - Type: HTTP Request  
   - Configure each with GET method and URL:  
     - BONK: `https://api.coingecko.com/api/v3/coins/markets?vs_currency=try&ids=bonk&order=market_cap_desc&per_page=1&page=1`  
     - PEPE: `...ids=pepe...`  
     - Radio Caca: `...ids=radio-caca...`  
     - Stellar: `...ids=stellar...`  
   - Connect each output of Schedule Trigger to each HTTP Request node

3. **Create Four Code Nodes for Data Cleaning (Data Cleaning1-4)**  
   - Type: Code (JavaScript)  
   - Paste identical JS code for each node to:  
     - Extract fields from API response  
     - Clean undefined/null values replacing with "Belirlenemedi"  
     - Format numbers with fixed decimals and append units  
   - Connect each Extract Crypto Data node output to corresponding Data Cleaning node

4. **Create Four Set Nodes for AI Prompts (AI Promt1-4)**  
   - Type: Set  
   - Assign a string variable `chatInput` with templated prompt including:  
     - Current date/time (Istanbul timezone)  
     - Coin details from Data Cleaning node  
     - Instructions for AI analysis with headings and emoji allowance  
   - Connect each Data Cleaning node to corresponding AI Promt node

5. **Create Four Google Gemini Chat Model Nodes**  
   - Type: LangChain Google Gemini Chat Model  
   - Set model name to `"models/gemini-2.5-pro"` (at least for AI Promt1 and AI Promt2; others can default)  
   - Attach Google Palm API OAuth2 credentials  
   - No special options needed  
   - These nodes serve as AI backend for the AI Analysis nodes

6. **Create Four Basic LLM Chain Nodes (AI Analysis1-4)**  
   - Type: LangChain Basic LLM Chain  
   - Connect each AI Promt node output to the corresponding AI Analysis node input  
   - Configure to use the corresponding Google Gemini Chat Model node as its language model backend

7. **Create Four Microsoft Outlook Send Mail Nodes (Send Mail1-4)**  
   - Type: Microsoft Outlook  
   - Configure OAuth2 credentials for Outlook account  
   - Set email subject dynamically:  
     `={{ new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', hour12: false }).replace(',', '') }} | {{ $('Extract Crypto DataX').item.json.name }} Crypto Prediction System`  
   - Set email body to AI analysis text output (`{{$json.text}}`)  
   - Set recipients in `toRecipients`, replacing placeholder with your email address  
   - Enable retry on failure  
   - Connect each AI Analysis node output to corresponding Send Mail node

8. **Connect all nodes accordingly:**  
   - Schedule Trigger → Extract Crypto Data1-4  
   - Extract Crypto DataX → Data CleaningX  
   - Data CleaningX → AI PromtX  
   - AI PromtX → AI AnalysisX  
   - AI AnalysisX → Send MailX  
   - AI AnalysisX nodes use Google Gemini Chat Model nodes as backend

9. **Test and troubleshoot:**  
   - Verify API responses from CoinGecko  
   - Validate prompt string correctness  
   - Confirm AI model runs and outputs text  
   - Confirm emails send successfully  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                          | Context or Link                                                                                 |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| This workflow is an automated system that fetches market data for user-specified cryptocurrencies from the CoinGecko API, generates professional AI analysis, and sends it via email every day at 10:00 AM.                                                                                          | Full workflow purpose and usage instructions are documented in Sticky Note5 node               |
| To customize cryptocurrencies, edit the `ids=` query parameter in each HTTP Request node URL.                                                                                                                                                                                                      | Workflow customization instructions in Sticky Note5                                           |
| The AI prompt can be modified in the AI Promt nodes to change language, tone, or analysis details.                                                                                                                                                                                                 | Sticky Note5                                                                                   |
| Google Gemini Chat Model is used by default; other AI models (ChatGPT, Deepseek, Ollama) can be swapped by replacing the LangChain model nodes.                                                                                                                                                   | Sticky Note5                                                                                   |
| Update email addresses in Send Mail nodes to receive reports at desired inboxes.                                                                                                                                                                                                                   | Sticky Note5                                                                                   |
| No API keys or sensitive data are embedded except for Google Palm API credentials and Outlook OAuth2. This makes the workflow shareable and secure.                                                                                                                                               | Sticky Note5                                                                                   |
| CoinGecko API documentation: https://www.coingecko.com/en/api/documentation                                                                                                                                                                                                                        | Useful external resource                                                                       |
| Google Gemini (PaLM) API documentation: https://developers.generativeai.google/                                                                                                                                                                                                                   | Useful external resource                                                                       |
| Outlook OAuth2 credential setup required for mail nodes.                                                                                                                                                                                                                                           | Refer to n8n credential documentation                                                         |

---

**Disclaimer:** The text provided derives exclusively from an automated workflow created with n8n, a tool for integration and automation. This processing strictly respects applicable content policies and contains no illegal, offensive, or protected material. All manipulated data is legal and public.