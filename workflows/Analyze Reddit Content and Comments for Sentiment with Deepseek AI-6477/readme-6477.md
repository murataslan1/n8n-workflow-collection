Analyze Reddit Content and Comments for Sentiment with Deepseek AI

https://n8nworkflows.xyz/workflows/analyze-reddit-content-and-comments-for-sentiment-with-deepseek-ai-6477


# Analyze Reddit Content and Comments for Sentiment with Deepseek AI

### 1. Workflow Overview

This workflow, titled **"Reddit Sentiment Analysis"**, automates the process of retrieving Reddit posts and their comments, analyzing the sentiment of the content, and generating structured data summarizing this sentiment. It uses AI models to perform deep sentiment analysis on Reddit discussions, making it suitable for social media monitoring, market research, brand reputation tracking, or any use case requiring automated sentiment insights from Reddit content.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Receives external triggers and initiates the workflow.
- **1.2 Reddit Data Retrieval:** Fetches multiple posts and their associated comments from Reddit.
- **1.3 Data Splitting and Iteration:** Splits posts and comments into manageable chunks for processing.
- **1.4 Sentiment Analysis:** Applies an AI-powered sentiment analysis model to comments.
- **1.5 Structured Data Generation:** Converts AI results into structured data format.
- **1.6 Post-Processing and Response:** Executes custom code for final formatting and sends the response back to the requester.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block receives external HTTP requests via a webhook to trigger the workflow.

- **Nodes Involved:**  
  - Webhook

- **Node Details:**  

  - **Webhook**  
    - *Type and Role:* HTTP webhook node; entry point for external calls.  
    - *Configuration:* Default HTTP method and path not specified in JSON, assumed customizable.  
    - *Expressions/Variables:* None specified.  
    - *Connections:* Outputs to "Get many posts".  
    - *Version:* Uses n8n webhook v2 node.  
    - *Edge Cases:* Missing or malformed webhook payloads could cause failures; ensure validation on input. Authentication not shown, so consider adding if needed.  
    - *Sub-workflows:* None.

#### 2.2 Reddit Data Retrieval

- **Overview:**  
  Retrieves multiple Reddit posts based on the webhook input, then gathers multiple comments per post.

- **Nodes Involved:**  
  - Get many posts  
  - Get many comments in a post

- **Node Details:**  

  - **Get many posts**  
    - *Type and Role:* Reddit node to fetch multiple posts from specified subreddit(s) or criteria.  
    - *Configuration:* Parameters not detailed, but likely set to fetch posts based on subreddit, sorting, or query.  
    - *Connections:* Receives input from "Webhook" and outputs to "Split Out".  
    - *Version:* Reddit node v1.  
    - *Edge Cases:* API rate limits, empty subreddit, or invalid subreddit name could cause errors. Authentication required; ensure Reddit credentials are configured.  
    - *Sub-workflows:* None.

  - **Get many comments in a post**  
    - *Type and Role:* Reddit node to fetch multiple comments for each Reddit post.  
    - *Configuration:* Parameters not shown; expected to use post IDs from previous node.  
    - *Connections:* Input from "Split Out" node, output to "Loop Over Items".  
    - *Version:* Reddit node v1.  
    - *Edge Cases:* Posts with no comments, deleted comments, or API limits. Authentication required.  
    - *Sub-workflows:* None.

#### 2.3 Data Splitting and Iteration

- **Overview:**  
  Splits the fetched posts and their comments into individual items for processing and iterates over them in batches.

- **Nodes Involved:**  
  - Split Out  
  - Loop Over Items

- **Node Details:**  

  - **Split Out**  
    - *Type and Role:* Splits an array of items into separate output items for downstream processing.  
    - *Configuration:* Default splitting behavior.  
    - *Connections:* Input from "Get many posts" or "Loop Over Items" (second output), outputs to "Get many comments in a post".  
    - *Version:* v1  
    - *Edge Cases:* Empty arrays result in no output; handle with conditional logic if needed.  

  - **Loop Over Items**  
    - *Type and Role:* Splits items into batches for iterative processing, avoiding timeouts or memory issues.  
    - *Configuration:* Batch size not specified but can be set for optimized processing.  
    - *Connections:* Input from "Get many comments in a post", two outputs: first unused, second feeds back into "Split Out" and "Sentiment Analyzer".  
    - *Version:* v3  
    - *Edge Cases:* Large batch sizes may cause timeouts; small batch sizes slow overall process. Network or API failures during iteration.  

#### 2.4 Sentiment Analysis

- **Overview:**  
  Applies AI language models to analyze the sentiment of individual Reddit comments.

- **Nodes Involved:**  
  - Sentiment Analyzer  
  - OpenRouter Chat Model1

- **Node Details:**  

  - **Sentiment Analyzer**  
    - *Type and Role:* AI chain node that runs a language model chain to analyze sentiment.  
    - *Configuration:* Specific prompt and chain configuration not detailed but designed to extract sentiment from comment text.  
    - *Connections:* Inputs from "Loop Over Items" (second output), outputs to "Structured Data Generator".  
    - *Version:* v1.7 of chainLlm node.  
    - *Edge Cases:* AI model limits (token or rate limits), possible misinterpretation of sarcasm or complex sentiment. Requires valid AI credentials (OpenRouter API key or equivalent).  

  - **OpenRouter Chat Model1**  
    - *Type and Role:* Language model node providing underlying AI model for the chains.  
    - *Configuration:* Acts as the AI model used by both "Sentiment Analyzer" and "Structured Data Generator".  
    - *Connections:* Linked as ai_languageModel input to "Structured Data Generator" and "Sentiment Analyzer".  
    - *Version:* v1.  
    - *Edge Cases:* Connectivity issues with OpenRouter, authentication failures, model downtime.  

#### 2.5 Structured Data Generation

- **Overview:**  
  Converts AI sentiment analysis results into a structured data format suitable for further processing or output.

- **Nodes Involved:**  
  - Structured Data Generator

- **Node Details:**  

  - **Structured Data Generator**  
    - *Type and Role:* Chain node to format the AI output into structured JSON or similar schema.  
    - *Configuration:* Likely includes a prompt or function to extract key sentiment data points.  
    - *Connections:* Input from "Sentiment Analyzer", output to "Code".  
    - *Version:* v1.7.  
    - *Edge Cases:* Formatting errors if AI output varies; ensure consistent prompt design.  

#### 2.6 Post-Processing and Response

- **Overview:**  
  Runs custom code to finalize the data and sends the result back to the original webhook requester.

- **Nodes Involved:**  
  - Code  
  - Respond to Webhook

- **Node Details:**  

  - **Code**  
    - *Type and Role:* JavaScript code node for custom data manipulation post-AI processing.  
    - *Configuration:* Specific code not provided; presumably formats or aggregates data for output.  
    - *Connections:* Input from "Structured Data Generator", output to "Respond to Webhook".  
    - *Version:* v2.  
    - *Edge Cases:* Runtime errors in custom code; exceptions should be caught and logged.  

  - **Respond to Webhook**  
    - *Type and Role:* Sends HTTP response to the webhook caller with the final processed data.  
    - *Configuration:* Default response behavior; content likely set dynamically from "Code" node output.  
    - *Connections:* Input from "Code".  
    - *Version:* v1.4.  
    - *Edge Cases:* Network errors, timeouts, or missing response data could cause client-side issues.  

---

### 3. Summary Table

| Node Name                 | Node Type                             | Functional Role                 | Input Node(s)           | Output Node(s)                   | Sticky Note |
|---------------------------|-------------------------------------|--------------------------------|-------------------------|---------------------------------|-------------|
| Webhook                   | n8n-nodes-base.webhook (v2)          | Entry point for HTTP trigger   | —                       | Get many posts                  |             |
| Get many posts            | n8n-nodes-base.reddit (v1)            | Fetches Reddit posts           | Webhook                  | Split Out                      |             |
| Split Out                 | n8n-nodes-base.splitOut (v1)           | Splits posts/comments array    | Get many posts, Loop Over Items (2nd output) | Get many comments in a post  |             |
| Get many comments in a post | n8n-nodes-base.reddit (v1)            | Fetches comments for each post | Split Out                | Loop Over Items                |             |
| Loop Over Items           | n8n-nodes-base.splitInBatches (v3)     | Iterates over comments in batches | Get many comments in a post | Split Out (2nd output), Sentiment Analyzer |             |
| Sentiment Analyzer        | @n8n/n8n-nodes-langchain.chainLlm (v1.7) | Runs AI chain for sentiment analysis | Loop Over Items (2nd output) | Structured Data Generator      |             |
| OpenRouter Chat Model1    | @n8n/n8n-nodes-langchain.lmChatOpenRouter (v1) | Provides AI model for chains | — (used as AI model input) | Structured Data Generator, Sentiment Analyzer (ai_languageModel input) |             |
| Structured Data Generator | @n8n/n8n-nodes-langchain.chainLlm (v1.7) | Formats AI output into structured data | Sentiment Analyzer       | Code                          |             |
| Code                      | n8n-nodes-base.code (v2)                | Custom data post-processing    | Structured Data Generator | Respond to Webhook             |             |
| Respond to Webhook        | n8n-nodes-base.respondToWebhook (v1.4)  | Sends HTTP response            | Code                     | —                             |             |
| Sticky Note               | n8n-nodes-base.stickyNote (v1)           | Visual annotation              | —                       | —                             |             |
| Sticky Note1              | n8n-nodes-base.stickyNote (v1)           | Visual annotation              | —                       | —                             |             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**  
   - Type: `Webhook (v2)`  
   - Purpose: Receive external HTTP requests to trigger the workflow.  
   - Configuration: Set the HTTP method (e.g., POST), define the path. No authentication unless desired.  

2. **Create Reddit Node to Get Posts**  
   - Type: `Reddit (v1)`  
   - Purpose: Fetch multiple Reddit posts based on criteria.  
   - Configuration:  
     - Set subreddit(s) or search query.  
     - Choose post sorting (e.g., hot, new, top).  
     - Set limit for number of posts.  
   - Connect Webhook output to this node input.  
   - Set Reddit credentials (OAuth2) in n8n credentials manager.  

3. **Add Split Out Node**  
   - Type: `Split Out (v1)`  
   - Purpose: Split the array of posts into individual items.  
   - Connect output of "Get many posts" to this node.  

4. **Create Reddit Node to Get Comments**  
   - Type: `Reddit (v1)`  
   - Purpose: For each post, fetch multiple comments.  
   - Configuration:  
     - Use post ID from the input item.  
     - Set limit for number of comments per post.  
   - Connect output of "Split Out" to this node.  
   - Use same Reddit credentials.  

5. **Add Loop Over Items Node**  
   - Type: `Split In Batches (v3)`  
   - Purpose: Iterate over comments in batches for processing.  
   - Configuration: Set batch size (e.g., 5-10) to balance speed and reliability.  
   - Connect output of "Get many comments in a post" to this node.  

6. **Add Second Split Out Node (Reusing Split Out Node)**  
   - Purpose: After batch processing, split out batch items again for individual processing in sentiment analysis.  
   - Connect second output of "Loop Over Items" to this node.  

7. **Add Sentiment Analyzer Node**  
   - Type: `Chain LLM (v1.7)` from n8n LangChain nodes  
   - Purpose: Analyze sentiment of each comment using AI.  
   - Configuration:  
     - Define prompt template to instruct AI to evaluate sentiment.  
     - Use AI model node (OpenRouter Chat Model1) as the language model.  
   - Connect output of second "Split Out" node to this node.  
   - Configure OpenRouter or equivalent AI credentials.  

8. **Add OpenRouter Chat Model Node**  
   - Type: `LM Chat OpenRouter (v1)`  
   - Purpose: Provide underlying AI model for chains.  
   - Configuration:  
     - Set OpenRouter API key or similar credentials.  
   - Connect as AI language model input to "Sentiment Analyzer" and "Structured Data Generator".  

9. **Add Structured Data Generator Node**  
   - Type: `Chain LLM (v1.7)`  
   - Purpose: Format AI sentiment output into structured data (JSON).  
   - Configuration:  
     - Define prompt or chain to extract relevant fields (e.g., sentiment score, summary).  
   - Connect output of "Sentiment Analyzer" to this node.  
   - Use OpenRouter Chat Model node as language model input.  

10. **Add Code Node**  
    - Type: `Code (v2)`  
    - Purpose: Custom JavaScript to finalize data formatting or aggregation.  
    - Configuration:  
      - Insert JavaScript code to transform or aggregate structured data as required.  
    - Connect output of "Structured Data Generator" to this node.  

11. **Add Respond to Webhook Node**  
    - Type: `Respond to Webhook (v1.4)`  
    - Purpose: Send final processed data back to the original requester.  
    - Configuration:  
      - Set Response Mode to "On Received Data" or appropriate.  
      - Map response body to the JavaScript node output.  
    - Connect output of "Code" node to this node.  

---

### 5. General Notes & Resources

| Note Content                                                                                               | Context or Link                                           |
|------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------|
| Ensure Reddit API credentials (OAuth2) are properly set up in n8n to avoid authentication errors.           | Reddit API documentation                                  |
| OpenRouter API or equivalent AI provider credentials must be configured to enable AI sentiment analysis.   | https://openrouter.ai/                                    |
| Batch sizes in "Loop Over Items" should be adjusted depending on API rate limits and performance needs.     | n8n documentation on SplitInBatches node                  |
| Consider adding error handling (e.g., "Error Trigger" node) to catch and log API or AI failures.            | n8n error handling best practices                          |
| For sensitive or production use, secure the webhook with authentication or IP restrictions.                 | n8n webhook security guidelines                            |
| This workflow can be extended to other social media or data sources with similar node configurations.       | n8n community forums and marketplace                       |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created with n8n, an integration and automation tool. This process strictly adheres to content policies and contains no illegal, offensive, or protected elements. All handled data are legal and publicly available.