Automate Pokemon Card Stock Monitoring with Apify, AI, and Slack Alerts

https://n8nworkflows.xyz/workflows/automate-pokemon-card-stock-monitoring-with-apify--ai--and-slack-alerts-11095


# Automate Pokemon Card Stock Monitoring with Apify, AI, and Slack Alerts

### 1. Workflow Overview

This workflow automates monitoring the stock availability of Pokemon Cards in Japan by combining social media scraping, AI-based content analysis, official site verification, and Slack notifications. It is designed for collectors, retailers, or enthusiasts who want timely and accurate updates on Pokemon card availability.

The workflow is logically divided into four main blocks:

- **1.1 Data Collection:** Scrapes recent tweets related to Pokemon cards using Apify's Tweet Scraper actor and prepares the data for analysis.
- **1.2 Initial Analysis:** Uses an AI agent to analyze tweet content for potential stock availability signals.
- **1.3 Verification:** Cross-checks the analyzed information with official Pokemon Center websites via HTTP requests and a second AI agent.
- **1.4 Notification:** Sends validated stock alerts and summaries to a Slack channel.

---

### 2. Block-by-Block Analysis

#### 2.1 Data Collection

- **Overview:**  
  This block fetches the latest social media data from Twitter (X) concerning Pokemon cards using Apify’s Tweet Scraper actor. The tweets are then split into batches for sequential AI processing.

- **Nodes Involved:**  
  - When clicking ‘Execute workflow’ (Manual Trigger)  
  - Run an Actor (Apify Tweet Scraper)  
  - Loop Over Items (Split in Batches)  

- **Node Details:**

  - **When clicking ‘Execute workflow’**  
    - Type: Manual Trigger  
    - Role: Starts the workflow manually.  
    - Configuration: No parameters; simple manual start.  
    - Inputs: None  
    - Outputs: Triggers "Run an Actor" node.  
    - Edge Cases: None, but workflow won’t run unless manually triggered.

  - **Run an Actor**  
    - Type: Apify actor execution node  
    - Role: Runs "Tweet Scraper V2 - X / Twitter Scraper" actor to fetch tweets containing keywords related to Pokemon cards in Japanese.  
    - Configuration:  
      - Memory: 8192 MB  
      - Actor ID: "61RPP7dywgiy0JPD0" (Tweet Scraper V2)  
      - Search terms: "ポケモンカード", "ポケモンカード販売情報", "ポケカ"  
      - Max items: 3 tweets  
      - Filters: No restrictions on images, quotes, verification, or Twitter Blue  
      - Sort: Latest tweets  
      - Language: Japanese (ja)  
      - Authentication: Apify OAuth2  
    - Inputs: Triggered by manual start  
    - Outputs: Provides scraped tweet items to "Loop Over Items" node  
    - Edge Cases:  
      - API rate limits or actor downtime may cause failures  
      - No tweets matching criteria may produce empty output  

  - **Loop Over Items**  
    - Type: Split in Batches  
    - Role: Processes each tweet individually by splitting the batch to allow sequential AI analysis.  
    - Configuration: Default batch options (no custom batch size specified)  
    - Inputs: Receives scraped tweets from "Run an Actor"  
    - Outputs: Sends each tweet item to two parallel paths: one leading to the "AI Agent" node and a no-op node named "Replace Me" (for possible future use or expansion)  
    - Edge Cases: Empty input results in no iterations.

---

#### 2.2 Initial Analysis

- **Overview:**  
  This block uses an AI Agent with Langchain to interpret the tweets and identify potential stock availability or sales information. The AI filters noise and formats outputs for further verification.

- **Nodes Involved:**  
  - AI Agent  
  - OpenRouter Chat Model  

- **Node Details:**

  - **AI Agent**  
    - Type: Langchain AI Agent node  
    - Role: Processes each tweet content to determine if it contains announcements or stock information about Pokemon cards, and searches for relevant stores using tools. If no info found, it generates an SNS (social network) message indicating no info.  
    - Configuration:  
      - Prompt (in Japanese): Instructs to detect Pokemon card release or stock info, find stores via tools, and output only relevant data without explanations or extra text.  
      - Prompt Type: Define (custom prompt)  
      - Options: Default (no special options)  
    - Inputs: Each tweet item from "Loop Over Items"  
    - Outputs: Sends processed output to "AI Agent1" for further analysis  
    - Edge Cases:  
      - AI misinterpretation due to ambiguous tweets  
      - API or model timeouts or errors  

  - **OpenRouter Chat Model**  
    - Type: Language Model (Chat model connected to OpenRouter)  
    - Role: Provides the natural language processing backend for the AI Agent.  
    - Configuration: Default options (uses credentials configured in n8n)  
    - Inputs: Receives prompts from "AI Agent" node  
    - Outputs: Returns AI-generated text to "AI Agent"  
    - Edge Cases:  
      - Authentication failures with OpenRouter  
      - Model response delays or errors  

---

#### 2.3 Verification

- **Overview:**  
  This block uses HTTP requests to official Pokemon card websites, combined with a second AI Agent, to verify and refine the stock information extracted from tweets. This helps ensure alerts are based on official or reliable sources.

- **Nodes Involved:**  
  - AI Agent1  
  - OpenRouter Chat Model1  
  - HTTP Request (https://map.pokemon-card.com/)  
  - HTTP Request1 (https://www.pokemon-card.com/products/)  
  - HTTP Request2 (https://www.pokemoncenter-online.com/)  

- **Node Details:**

  - **AI Agent1**  
    - Type: Langchain AI Agent node  
    - Role: Using the gathered official site data and tweet analysis, it checks for current stock availability and outputs a structured message separating stock status and original output. It assigns official data to a variable named “公式情報” (official information). If no info available, outputs "no latest news".  
    - Configuration:  
      - Prompt (in Japanese): Request to verify latest card stock status without explanations, separate output and original text, and define official data variable.  
      - Prompt Type: Define  
      - Options: Default  
    - Inputs: Receives HTTP request results and previous AI outputs  
    - Outputs: Passes verified message to "Send a message" node  
    - Edge Cases:  
      - Inconsistent or missing data from official sites  
      - AI failure to correctly parse official info  

  - **OpenRouter Chat Model1**  
    - Type: Language Model (Chat model)  
    - Role: AI backend for AI Agent1  
    - Configuration: Default options  
    - Inputs: Prompts from AI Agent1  
    - Outputs: AI-generated verification results to AI Agent1  
    - Edge Cases: Same as previous model node  

  - **HTTP Request**  
    - Type: HTTP Request to "https://map.pokemon-card.com/"  
    - Role: Fetches map-based stock or store information for Pokemon cards to assist AI analysis.  
    - Configuration: Simple GET request without custom headers or parameters.  
    - Inputs: Triggered internally by AI Agent node as a tool.  
    - Outputs: JSON or HTML content to AI Agent for processing.  
    - Edge Cases: Site downtime or response format changes.  

  - **HTTP Request1**  
    - Type: HTTP Request to "https://www.pokemon-card.com/products/"  
    - Role: Retrieves official product availability and information from the Pokemon-card official site.  
    - Configuration: Simple GET request.  
    - Inputs: Used as a tool by AI Agent1  
    - Outputs: Page content for verification AI  
    - Edge Cases: Site changes or network errors  

  - **HTTP Request2**  
    - Type: HTTP Request to "https://www.pokemoncenter-online.com/"  
    - Role: Fetches online official Pokemon Center store product info for stock confirmation.  
    - Configuration: Simple GET request.  
    - Inputs: Used by AI Agent1  
    - Outputs: Web content for AI processing  
    - Edge Cases: Same as above  

---

#### 2.4 Notification

- **Overview:**  
  This block sends the final, verified stock update message to a Slack channel to notify interested parties.

- **Nodes Involved:**  
  - Send a message (Slack)  

- **Node Details:**

  - **Send a message**  
    - Type: Slack node  
    - Role: Posts the validated Pokemon card sales/stock alert message to a configured Slack channel.  
    - Configuration:  
      - Text: Japanese message prefix "今日のポケモンカードの販売速報です" (Today’s Pokemon card sales report) followed by the AI Agent1 output.  
      - Channel: Selectable from Slack channels list (empty in JSON, user must configure)  
      - Authentication: OAuth2 with Slack account  
    - Inputs: Receives final text from AI Agent1  
    - Outputs: None (end node)  
    - Edge Cases:  
      - Slack API auth failure  
      - Invalid channel ID or permissions  
      - Message formatting issues  

---

### 3. Summary Table

| Node Name                 | Node Type                          | Functional Role                         | Input Node(s)                 | Output Node(s)               | Sticky Note                                                                                              |
|---------------------------|----------------------------------|---------------------------------------|------------------------------|------------------------------|--------------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger                   | Workflow start trigger                 | None                         | Run an Actor                 | ## How it works<br>This workflow automates stock tracking for Pokemon Cards in Japan...                 |
| Run an Actor              | Apify Actor execution             | Scrapes tweets from Twitter (X)       | When clicking ‘Execute workflow’ | Loop Over Items             | ## Data Collection<br>Scrapes X (Twitter) for latest info and prepares items for processing.           |
| Loop Over Items           | Split in Batches                  | Processes each tweet individually      | Run an Actor                 | AI Agent, Replace Me          | ## Initial Analysis<br>AI analyzes tweet content to identify potential stock availability.             |
| Replace Me                | No Operation                     | Placeholder node, no operation         | Loop Over Items              | Loop Over Items              | ## Initial Analysis<br>AI analyzes tweet content to identify potential stock availability.             |
| AI Agent                  | Langchain AI Agent               | Analyzes tweets to detect stock info  | Loop Over Items              | AI Agent1                   | ## Initial Analysis<br>AI analyzes tweet content to identify potential stock availability.             |
| OpenRouter Chat Model     | Language Model (OpenRouter)      | Provides NLP backend for AI Agent     | AI Agent                    | AI Agent                    |                                                                                                        |
| HTTP Request              | HTTP Request                    | Fetches Pokemon card map data          | AI Agent (tool)              | AI Agent                    |                                                                                                        |
| AI Agent1                 | Langchain AI Agent               | Verifies info with official websites  | AI Agent                    | Send a message              | ## Verification<br>Cross-checks info with official Pokemon Center sites.                               |
| OpenRouter Chat Model1    | Language Model (OpenRouter)      | Provides NLP backend for AI Agent1    | AI Agent1                   | AI Agent1                   |                                                                                                        |
| HTTP Request1             | HTTP Request                    | Fetches official product info          | AI Agent1 (tool)             | AI Agent1                   |                                                                                                        |
| HTTP Request2             | HTTP Request                    | Fetches official Pokemon Center info   | AI Agent1 (tool)             | AI Agent1                   |                                                                                                        |
| Send a message            | Slack                           | Sends final stock alert to Slack       | AI Agent1                   | None                        | ## Notification<br>Sends the report to Slack.                                                          |
| Main Description          | Sticky Note                     | Workflow description and setup steps   | None                         | None                        | ## How it works...                                                                                      |
| Group: Data Collection    | Sticky Note                     | Data scraping explanation               | None                         | None                        | ## Data Collection                                                                                      |
| Group: Analysis           | Sticky Note                     | Initial AI analysis explanation         | None                         | None                        | ## Initial Analysis                                                                                      |
| Group: Verification       | Sticky Note                     | Verification explanation                | None                         | None                        | ## Verification                                                                                        |
| Group: Notification       | Sticky Note                     | Slack notification explanation          | None                         | None                        | ## Notification                                                                                        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Manual Trigger node**  
   - Name: When clicking ‘Execute workflow’  
   - Purpose: To manually start the workflow.

2. **Add an Apify Actor node**  
   - Name: Run an Actor  
   - Actor ID: Use "61RPP7dywgiy0JPD0" (Tweet Scraper V2 - X / Twitter Scraper)  
   - Memory: 8192 MB  
   - Custom JSON Input:  
     ```json
     {
       "customMapFunction": "(object) => { return {...object} }",
       "includeSearchTerms": false,
       "maxItems": 3,
       "onlyImage": false,
       "onlyQuote": false,
       "onlyTwitterBlue": false,
       "onlyVerifiedUsers": false,
       "onlyVideo": false,
       "searchTerms": ["ポケモンカード", "ポケモンカード販売情報", "ポケカ"],
       "sort": "Latest",
       "tweetLanguage": "ja"
     }
     ```  
   - Authentication: Set up Apify OAuth2 credentials with your Apify account API key.

3. **Create a Split In Batches node**  
   - Name: Loop Over Items  
   - Default options (batch size can remain default)  
   - Connect output of "Run an Actor" to this node.

4. **Add a No Operation node**  
   - Name: Replace Me  
   - Connect "Loop Over Items" output to "Replace Me" (optional placeholder for future expansion).

5. **Add the first AI Agent node (Langchain)**  
   - Name: AI Agent  
   - Prompt:  
     ```
     =この中からポケモンカードが発売されたり、在庫があるのような情報があった場合はツールを使いから販売店を調べて、出力して下さい

     情報がない場合は、SNSに情報なしを出力して下さい

     説明文や補足などは外して下さい
     ```  
   - Prompt Type: Define  
   - Connect "Loop Over Items" output (parallel) to this node.  
   - Set AI backend: Add OpenRouter Chat Model node and connect as language model for this AI Agent.

6. **Add OpenRouter Chat Model node (for AI Agent)**  
   - Name: OpenRouter Chat Model  
   - Use OpenRouter credentials (configure your API key).  
   - Connect to AI Agent node as the language model.

7. **Create HTTP Request nodes for official sites:**  
   - HTTP Request (Name: HTTP Request)  
     - URL: https://map.pokemon-card.com/  
     - Method: GET  
     - Connect to AI Agent node as a “tool” input.

   - HTTP Request1  
     - URL: https://www.pokemon-card.com/products/  
     - Method: GET  
     - Connect to AI Agent1 node as a “tool” input.

   - HTTP Request2  
     - URL: https://www.pokemoncenter-online.com/  
     - Method: GET  
     - Connect to AI Agent1 node as a “tool” input.

8. **Add the second AI Agent node (Langchain) for verification**  
   - Name: AI Agent1  
   - Prompt:  
     ```
     =ツールの中から調べて、最新のカード販売状況を調べて下さい。
     説明などはつけないでください。
     出力する文章と{{ $json.output }}
     こちらを分けて出力して下さい
     ---
     調べる内容
     ・在庫状況にて購入できる在庫がある商品があるのか？

     こちらの情報は、公式情報という名前の変数にして下さい

     販売情報がない場合は、最新の速報はありませんと出力して下さい
     ```  
   - Prompt Type: Define  
   - Connect AI Agent output to AI Agent1 input.  
   - Configure OpenRouter Chat Model1 node as language model for AI Agent1.

9. **Add OpenRouter Chat Model1 node**  
   - Name: OpenRouter Chat Model1  
   - Use OpenRouter credentials (same or different as above).  
   - Connect to AI Agent1 node as language model.

10. **Add Slack node to send notifications**  
    - Name: Send a message  
    - Authentication: Configure Slack OAuth2 credentials with access to your workspace.  
    - Channel: Select the target Slack channel where alerts will be posted.  
    - Text:  
      ```
      =今日のポケモンカードの販売速報です
      {{ $json.output }}
      ```  
    - Connect AI Agent1 output to this node.

11. **Connect the workflow nodes** as per the following order:  
    - When clicking ‘Execute workflow’ → Run an Actor → Loop Over Items  
    - Loop Over Items → AI Agent and Replace Me (parallel)  
    - AI Agent → AI Agent1  
    - AI Agent1 → Send a message

12. **Add Sticky Notes** (optional for clarity in n8n UI) with the content describing each block as in the original workflow.

---

### 5. General Notes & Resources

| Note Content                                                                                                            | Context or Link                                                                                                   |
|-------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| This workflow automates stock tracking for Pokemon Cards in Japan combining social media scraping, AI analysis, and Slack alerts. | Workflow purpose summary.                                                                                        |
| Setup requires Apify API key and actor "Tweet Scraper V2" selection.                                                     | Apify actor config: https://console.apify.com/actors/61RPP7dywgiy0JPD0                                            |
| OpenRouter API key needed for both AI Agent nodes.                                                                       | OpenRouter docs: https://openrouter.ai/                                                                           |
| Slack OAuth2 credentials must be configured with permission to post messages in the desired channel.                      | Slack API docs: https://api.slack.com/authentication/oauth-v2                                                    |
| Search keywords for tweets: "ポケモンカード", "ポケモンカード販売情報", "ポケカ" (Pokemon card, sales info, shorthand).      | Keywords can be customized to adjust scraping focus.                                                             |
| The workflow expects Japanese text inputs and outputs in prompts and Slack messages.                                    | Localization note — all prompts and messages are in Japanese.                                                    |
| Consider implementing error handling for API failures, rate limits, or empty data cases to improve robustness.           | Best practice recommendation.                                                                                    |

---

This completes the full structured documentation of the "Automate Pokemon Card Stock Monitoring with Apify, AI, and Slack Alerts" workflow.