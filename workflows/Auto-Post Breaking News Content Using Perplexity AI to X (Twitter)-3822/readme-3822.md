Auto-Post Breaking News Content Using Perplexity AI to X (Twitter)

https://n8nworkflows.xyz/workflows/auto-post-breaking-news-content-using-perplexity-ai-to-x--twitter--3822


# Auto-Post Breaking News Content Using Perplexity AI to X (Twitter)

### 1. Workflow Overview

This n8n workflow automates the process of generating and posting breaking news content to X (formerly Twitter) by leveraging Perplexity AI’s conversational API. It is designed for users who want to keep their social media followers informed with timely, concise, and relevant tech news updates without manual intervention.

The workflow is logically divided into the following blocks:

- **1.1 Scheduled Trigger:** Initiates the workflow at configured intervals to automate posting frequency.
- **1.2 Query Setup:** Defines the search query that guides the AI’s content generation.
- **1.3 API Key Injection:** Securely inserts the Perplexity API key for authenticated requests.
- **1.4 Perplexity API Call:** Sends the query to Perplexity AI and receives a formatted, concise news headline with a link.
- **1.5 Post to X:** Publishes the AI-generated news snippet directly to the connected X (Twitter) account.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Trigger

- **Overview:**  
  This block triggers the workflow execution automatically at a set interval, ensuring regular content updates without manual starts.

- **Nodes Involved:**  
  - Schedule Trigger

- **Node Details:**  
  - **Schedule Trigger**  
    - Type: `Schedule Trigger`  
    - Configuration: Runs every 21 hours at a randomized minute within the hour (`triggerAtMinute` is dynamically set using a JavaScript expression generating a random integer between 0 and 59).  
    - Input: None (trigger node)  
    - Output: Initiates the workflow, passing an empty data object downstream.  
    - Version: 1.2  
    - Edge Cases:  
      - If n8n server is down during the scheduled time, the trigger will miss that execution.  
      - Random minute generation ensures posts do not always occur at the exact same minute, reducing predictability.  
    - No sub-workflows invoked.

#### 2.2 Query Setup

- **Overview:**  
  Sets the search query string that defines the topic for which the AI will generate news content.

- **Nodes Involved:**  
  - searchQuery

- **Node Details:**  
  - **searchQuery**  
    - Type: `Set` node  
    - Configuration: Assigns a single string variable `searchInput` with the value `"What's the latest news in artificial intelligence?"`. This string can be customized to change the topic.  
    - Input: Receives trigger from Schedule Trigger  
    - Output: Passes JSON data with `searchInput` downstream  
    - Version: 3.4  
    - Edge Cases:  
      - If the string is empty or malformed, the AI may return irrelevant or empty responses.  
      - No validation on input string length or content.  
    - No sub-workflows invoked.

#### 2.3 API Key Injection

- **Overview:**  
  Inserts the Perplexity API key into the workflow data for use in the authenticated HTTP request.

- **Nodes Involved:**  
  - set API key

- **Node Details:**  
  - **set API key**  
    - Type: `Set` node  
    - Configuration: Assigns a string variable `perplexityAPI` with the user’s Perplexity API key (placeholder `<yourPerplexityAPI>` to be replaced by the user).  
    - Input: Receives JSON data containing `searchInput` from `searchQuery`  
    - Output: Passes JSON data with `searchInput` and `perplexityAPI` downstream  
    - Version: 3.4  
    - Edge Cases:  
      - If the API key is missing or invalid, the subsequent API call will fail with authentication errors.  
      - Sensitive data handling requires secure storage and access control.  
    - No sub-workflows invoked.

#### 2.4 Perplexity API Call

- **Overview:**  
  Sends a POST request to Perplexity AI’s chat completions endpoint to generate a concise news headline and link based on the query.

- **Nodes Involved:**  
  - Perplexity

- **Node Details:**  
  - **Perplexity**  
    - Type: `HTTP Request` node  
    - Configuration:  
      - URL: `https://api.perplexity.ai/chat/completions`  
      - Method: POST  
      - Body (JSON):  
        - Model: `llama-3.1-sonar-small-128k-online`  
        - Messages:  
          - System prompt instructs the AI to produce a short, engaging headline (max 140 characters) followed by a direct article link, no markdown, hashtags, emojis, or line breaks, total output under 200 characters.  
          - User prompt uses the `searchInput` from previous node dynamically (`{{ $('searchQuery').item.json.searchInput }}`).  
        - Temperature: 0.3 (low randomness)  
        - Top_p: 0.9  
        - Return citations: true  
        - Domain filter: restricts search to `perplexity.ai`  
        - Recency filter: only results from the last day  
        - Return images: true (though not used downstream)  
        - Max tokens: 80  
        - Frequency penalty: 1 (discourages repetition)  
      - Headers: Authorization Bearer token set dynamically using `perplexityAPI` (`=Bearer {{ $json.perplexityAPI }}`)  
      - Sends JSON body and headers  
    - Input: Receives JSON with `searchInput` and `perplexityAPI`  
    - Output: JSON response containing AI-generated content under `choices[0].message.content`  
    - Version: 4.2  
    - Edge Cases:  
      - API key invalid or expired → 401 Unauthorized errors  
      - Network timeouts or API downtime → request failures  
      - Unexpected API response format → expression errors when accessing response data  
      - Rate limiting by Perplexity API → 429 errors  
    - No sub-workflows invoked.

#### 2.5 Post to X

- **Overview:**  
  Takes the AI-generated news headline and article link and posts it as a tweet on the connected X (Twitter) account.

- **Nodes Involved:**  
  - Post to X

- **Node Details:**  
  - **Post to X**  
    - Type: `Twitter` node (OAuth2)  
    - Configuration:  
      - Text to post: dynamically set to the AI response content (`={{ $json.choices[0].message.content }}`)  
      - Additional fields: none  
      - Credentials: Uses OAuth2 credentials named `X account 2 for images` (configured externally)  
    - Input: Receives JSON with AI-generated content from `Perplexity` node  
    - Output: Tweet posting result (tweet ID, status, etc.)  
    - Version: 2  
    - Edge Cases:  
      - OAuth token expired or revoked → authentication errors  
      - Twitter API rate limits → 429 errors  
      - Content length exceeding Twitter limits (unlikely due to AI prompt constraints)  
      - Network issues causing posting failures  
    - No sub-workflows invoked.

---

### 3. Summary Table

| Node Name      | Node Type          | Functional Role                       | Input Node(s)          | Output Node(s)    | Sticky Note                                                                                  |
|----------------|--------------------|------------------------------------|-----------------------|-------------------|----------------------------------------------------------------------------------------------|
| Schedule Trigger | Schedule Trigger   | Initiates workflow on schedule      | None                  | searchQuery       |                                                                                              |
| searchQuery    | Set                | Defines the AI search query string  | Schedule Trigger      | set API key       |                                                                                              |
| set API key    | Set                | Inserts Perplexity API key           | searchQuery           | Perplexity        |                                                                                              |
| Perplexity     | HTTP Request       | Calls Perplexity AI API for content | set API key           | Post to X         |                                                                                              |
| Post to X      | Twitter            | Posts AI-generated content to X     | Perplexity            | None              |                                                                                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow** in n8n.

2. **Add a `Schedule Trigger` node:**  
   - Set to run every 21 hours.  
   - Use the expression `={{Math.floor(Math.random() * 60)}}` for `Trigger At Minute` to randomize the minute of execution.

3. **Add a `Set` node named `searchQuery`:**  
   - Add a string field `searchInput`.  
   - Set its value to the desired query, e.g., `"What's the latest news in artificial intelligence?"`.  
   - Connect the output of `Schedule Trigger` to this node.

4. **Add another `Set` node named `set API key`:**  
   - Add a string field `perplexityAPI`.  
   - Enter your Perplexity API key as the value (replace `<yourPerplexityAPI>`).  
   - Connect the output of `searchQuery` to this node.

5. **Add an `HTTP Request` node named `Perplexity`:**  
   - Set Method to POST.  
   - URL: `https://api.perplexity.ai/chat/completions`.  
   - Set Body Content Type to JSON.  
   - Use the following JSON body (use the expression editor to embed dynamic content):  
     ```json
     {
       "model": "llama-3.1-sonar-small-128k-online",
       "messages": [
         {
           "role": "system",
           "content": "You are a social media assistant summarizing tech news for Twitter/X. Only return one article. Your output must follow this exact format: a short, engaging headline (max 140 characters), followed by a single space, then the direct article link. Do not use markdown, hashtags, emojis, or line breaks. Keep the total output under 200 characters. Be precise, objective, and newsworthy.Example: Mastercard launches Agent Pay, allowing AI agents to make purchases for users. https://www.perplexity.ai/page/mastercard-unveils-agent-pay-e-qWXnaUEzQZWCqsxF4l43zA"
         },
         {
           "role": "user",
           "content": "={{ $json.searchInput }}"
         }
       ],
       "temperature": 0.3,
       "top_p": 0.9,
       "return_citations": true,
       "search_domain_filter": ["perplexity.ai"],
       "search_recency_filter": "day",
       "return_images": true,
       "return_related_questions": false,
       "max_tokens": 80,
       "stream": false,
       "presence_penalty": 0,
       "frequency_penalty": 1
     }
     ```  
   - Under Headers, add `Authorization` with value: `=Bearer {{ $json.perplexityAPI }}`.  
   - Connect output of `set API key` to this node.

6. **Add a `Twitter` node named `Post to X`:**  
   - Set the text field to post as: `={{ $json.choices[0].message.content }}`.  
   - Connect the output of `Perplexity` to this node.  
   - Configure OAuth2 credentials for your X (Twitter) account in n8n and select them here.

7. **Activate the workflow** and test by running manually or waiting for the scheduled trigger.

---

### 5. General Notes & Resources

| Note Content                                                                                              | Context or Link                                               |
|----------------------------------------------------------------------------------------------------------|---------------------------------------------------------------|
| This workflow uses Perplexity AI’s chat completions endpoint with a custom system prompt for precise output.| Perplexity API documentation: https://www.perplexity.ai       |
| Ensure your Perplexity API key is kept secure and not exposed publicly.                                   | Security best practices for API keys                           |
| Connect your X (Twitter) account via OAuth2 credentials in n8n before running the workflow.              | n8n Twitter OAuth2 setup guide                                 |
| Join the community Discord for support and tips: [Discord](https://discord.gg/eBZH4WHCqd)                 | Community support channel                                      |
| Ideas to improve include adding content formatting, scheduling multiple queries, and translation steps.  | See workflow description above                                 |

---

This document fully describes the workflow’s structure, logic, and configuration, enabling advanced users or automation agents to understand, reproduce, and extend it confidently.