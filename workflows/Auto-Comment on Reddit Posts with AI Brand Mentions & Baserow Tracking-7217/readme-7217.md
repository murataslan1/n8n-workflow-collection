Auto-Comment on Reddit Posts with AI Brand Mentions & Baserow Tracking

https://n8nworkflows.xyz/workflows/auto-comment-on-reddit-posts-with-ai-brand-mentions---baserow-tracking-7217


# Auto-Comment on Reddit Posts with AI Brand Mentions & Baserow Tracking

### 1. Workflow Overview

This workflow automates intelligent engagement on Reddit by scanning for new posts mentioning AI brand-related keywords, analyzing their relevance to a brand’s AI design tool, and posting tailored comments using advanced AI models. It also tracks interactions in a Baserow database to avoid duplicate replies and maintain a historical record.

Logical blocks are organized as follows:

- **1.1 Schedule & Fetch Posts:** Periodically trigger and search Reddit for new posts matching target keywords.
- **1.2 Post Processing & Deduplication:** Split fetched posts into individual items and check Baserow for previously replied posts to prevent duplication.
- **1.3 Relevance Analysis:** Use an AI agent to analyze each post’s content for relevance based on brand-specific criteria.
- **1.4 Comment Generation:** For relevant posts, generate a concise, authentic Reddit reply using AI while respecting subreddit norms.
- **1.5 Posting & Tracking:** Post the AI-generated comment on Reddit, then record the interaction details in Baserow and implement wait times to avoid API rate limits.

---

### 2. Block-by-Block Analysis

#### 2.1 Schedule & Fetch Posts

**Overview:**  
This block periodically triggers the workflow every 12 hours and uses Reddit API to search for new posts across Reddit using a specified keyword.

**Nodes Involved:**  
- Schedule Trigger  
- Search for a post

**Node Details:**  

- **Schedule Trigger**  
  - *Type & Role:* n8n Schedule Trigger node; initiates workflow execution every 12 hours.  
  - *Configuration:* Interval set to every 12 hours.  
  - *Connections:* Outputs to “Search for a post”.  
  - *Edge Cases:* Workflow depends on schedule trigger firing; if missed, no new posts fetched.  
  - *Notes:* Sticky note labeled “Check for New Posts”.

- **Search for a post**  
  - *Type & Role:* Reddit node; searches Reddit for posts matching a keyword.  
  - *Configuration:* Search limit 25; keyword placeholder `{your keyword here}`; sort by newest posts; scope is all Reddit.  
  - *Credentials:* Uses OAuth2 for Reddit authentication.  
  - *Connections:* Outputs to “Loop Over Items”.  
  - *Edge Cases:* API rate limits, authentication errors, or empty results.  
  - *Notes:* Sticky note labeled “Fetch Posts from Reddit”.

---

#### 2.2 Post Processing & Deduplication

**Overview:**  
Splits the search results into individual posts and checks Baserow to avoid replying multiple times to the same post.

**Nodes Involved:**  
- Loop Over Items  
- Check Baserow for duplicate post  
- Filter  
- Filter Replied Posts

**Node Details:**  

- **Loop Over Items**  
  - *Type & Role:* SplitInBatches; processes Reddit posts one by one.  
  - *Configuration:* Default batch settings (likely batch size 1).  
  - *Connections:* Main output to “Check Baserow for duplicate post”.  
  - *Edge Cases:* Large batch sizes could lead to rate limits or memory issues.  
  - *Notes:* Sticky note labeled “Split into Single Posts”.

- **Check Baserow for duplicate post**  
  - *Type & Role:* HTTP Request; queries Baserow API to check if the post ID exists.  
  - *Configuration:* URL with dynamic filtering on post ID; authorization token header for Baserow.  
  - *Connections:* Outputs to “Filter”.  
  - *Edge Cases:* API errors, token expiration, network issues.  
  - *Notes:* Sticky note labeled “Check duplicate row in Baserow”.

- **Filter**  
  - *Type & Role:* Code node; merges Reddit post data with Baserow response to enrich context.  
  - *Configuration:* JavaScript merges post JSON with Baserow count and results.  
  - *Connections:* Outputs to “Filter Replied Posts”.  
  - *Edge Cases:* Empty or malformed Baserow responses could cause errors.

- **Filter Replied Posts**  
  - *Type & Role:* If node; filters out posts already replied to (where Baserow count > 0 and status true).  
  - *Configuration:* Condition checks if post already replied.  
  - *Connections:* True branch leads to “Wait” (to delay processing), False branch proceeds to “AI Agent”.  
  - *Edge Cases:* Logic errors could cause missed replies or duplicates.  
  - *Notes:* Sticky note labeled “Filter Replied Posts”.

---

#### 2.3 Relevance Analysis

**Overview:**  
Analyzes each post’s content using an AI agent to determine whether it warrants a brand reply. Outputs structured JSON with relevance status and reasoning.

**Nodes Involved:**  
- AI Agent  
- Google Gemini Chat Model / Anthropic Chat Model (AI language model nodes)  
- Structured Output Parser  
- Structure Output

**Node Details:**  

- **AI Agent**  
  - *Type & Role:* Langchain agent node; performs intelligent post analysis.  
  - *Configuration:* Custom prompt instructing to classify posts based on relevance criteria (tool requests, frustrations, use cases).  
  - *Input Variables:* Reddit post’s selftext, title, subreddit, and post ID from “Loop Over Items”.  
  - *Connections:* Output sent to “Structure Output”.  
  - *AI Models:* Uses Google Gemini Chat Model and Anthropic Chat Model as underlying LLMs.  
  - *Edge Cases:* AI misclassification, API errors, prompt failures.  
  - *Notes:* Sticky note labeled “Analyse Post Relevance & Sentiment”.

- **Google Gemini Chat Model & Anthropic Chat Model**  
  - *Type & Role:* AI language model nodes backing the AI Agent.  
  - *Configuration:* Connected as AI language models to the AI Agent node.  
  - *Credentials:* Google PaLM API and Anthropic API credentials respectively.  
  - *Edge Cases:* API limits, model unavailability.  

- **Structured Output Parser**  
  - *Type & Role:* Parses AI textual output into structured JSON to be consumed downstream.  
  - *Configuration:* JSON schema example provided matching expected output.  
  - *Connections:* Output to “Structure Output”.  
  - *Edge Cases:* Parsing failures if AI output deviates from schema.

- **Structure Output**  
  - *Type & Role:* Set node; maps AI output JSON fields to workflow variables for easy access.  
  - *Configuration:* Assigns fields like is_relevant, reason, relevance_type, title, selftext, subreddit, postid.  
  - *Connections:* Outputs to “If” node (next filtering step).  
  - *Edge Cases:* Missing fields or null values.

---

#### 2.4 Comment Generation

**Overview:**  
Generates a personalized Reddit comment for relevant posts using AI, adhering to strict tone and content rules to sound genuine and respectful.

**Nodes Involved:**  
- If  
- AI Agent1  
- Google Gemini Chat Model1 / Anthropic Chat Model1  
- Simple Memory

**Node Details:**  

- **If**  
  - *Type & Role:* If node; checks if AI analysis marked post as relevant (`output.is_relevant === "true"`).  
  - *Connections:* True path leads to “AI Agent1” for comment generation; False path loops back to “Loop Over Items” to process next post.  
  - *Edge Cases:* Logic errors could cause missed or unnecessary comments.  
  - *Notes:* Sticky note labeled “Filter Relevant Post”.

- **AI Agent1**  
  - *Type & Role:* Langchain agent node; writes the actual Reddit comment text.  
  - *Configuration:* Complex prompt instructing the AI to write a concise, honest, non-promotional, subreddit-compliant comment. Includes optional soft brand mention with specific wording rules. Input variables from previous analysis node fields.  
  - *Connections:* Outputs to “HTTP Request” (posting the comment).  
  - *AI Models:* Uses Google Gemini Chat Model1 and Anthropic Chat Model1.  
  - *Edge Cases:* AI generating off-tone or inappropriate comments, API failures.  
  - *Notes:* Sticky note labeled “Write Reddit Comment using AI”.

- **Google Gemini Chat Model1 & Anthropic Chat Model1**  
  - *Type & Role:* AI language model nodes used by AI Agent1 for comment generation.  
  - *Credentials:* Same as earlier AI model nodes.  
  - *Edge Cases:* Same as above.

- **Simple Memory**  
  - *Type & Role:* Langchain memory buffer; maintains conversational context if needed for AI Agent1 (though usage here seems minimal).  
  - *Connections:* Linked as AI memory input to AI Agent1.  
  - *Edge Cases:* Memory overflow or session mismanagement.

---

#### 2.5 Posting & Tracking

**Overview:**  
Posts the generated comment on Reddit, maps and stores comment details in Baserow, and enforces wait times to respect API limits and pacing.

**Nodes Involved:**  
- HTTP Request (Reddit comment)  
- Map Output in Structure  
- Add Post Details on Baserow  
- Wait to avoid hitting api limit  
- Wait

**Node Details:**  

- **HTTP Request (Reddit Comment)**  
  - *Type & Role:* HTTP Request node; posts comment to Reddit API on the given post ID.  
  - *Configuration:* POST to `https://oauth.reddit.com/api/comment`; form-urlencoded body with `thing_id` (post ID) and `text` (AI comment); OAuth2 authentication with Reddit.  
  - *Headers:* User-Agent set to identify bot as per Reddit API policy.  
  - *Connections:* Outputs to “Map Output in Structure”.  
  - *Edge Cases:* API rate limits, posting errors, permissions issues.  
  - *Notes:* Sticky note labeled “Post Reddit Comment”.

- **Map Output in Structure**  
  - *Type & Role:* Set node; formats data for Baserow including post URL, ID, subreddit, title, reply text, status, and creation time.  
  - *Connections:* Outputs to “Add Post Details on Baserow”.  
  - *Edge Cases:* Missing or malformed data.

- **Add Post Details on Baserow**  
  - *Type & Role:* Baserow node; creates a new row recording the Reddit interaction.  
  - *Configuration:* Maps fields such as Post ID, URL, Subreddit, Title, Reply text, Status, and timestamp.  
  - *Credentials:* Baserow API token.  
  - *Connections:* Outputs to “Wait to avoid hitting api limit”.  
  - *Edge Cases:* API token expiration, rate limits, data validation errors.  
  - *Notes:* Sticky note labeled “Store Comment Data on Baserow”.

- **Wait to avoid hitting api limit**  
  - *Type & Role:* Wait node; pauses execution for 6 hours between postings to avoid hitting Reddit or Baserow API limits.  
  - *Connections:* Loops back to “Loop Over Items” for next post processing.  
  - *Edge Cases:* Workflow stalling if wait is too long or interrupted.  
  - *Notes:* Sticky note labeled “Wait for 6 hrs”.

- **Wait**  
  - *Type & Role:* Wait node; delays 5 minutes when a post was already replied to, possibly to space out checks.  
  - *Connections:* Loops back to “Loop Over Items”.  
  - *Notes:* Sticky note labeled “Wait for 5mins”.

---

### 3. Summary Table

| Node Name                  | Node Type                               | Functional Role                      | Input Node(s)                  | Output Node(s)                  | Sticky Note                                                                 |
|----------------------------|---------------------------------------|------------------------------------|-------------------------------|--------------------------------|----------------------------------------------------------------------------|
| Schedule Trigger           | Schedule Trigger                      | Initiates workflow every 12 hours  | —                             | Search for a post               | Check for New Posts                                                        |
| Search for a post          | Reddit                               | Searches Reddit for posts           | Schedule Trigger               | Loop Over Items                 | Fetch Posts from Reddit                                                    |
| Loop Over Items            | SplitInBatches                       | Splits Reddit posts into single items | Search for a post / Wait / Wait to avoid hitting api limit | Check Baserow for duplicate post / — (on false) | Split into Single Posts                                                    |
| Check Baserow for duplicate post | HTTP Request                      | Checks if post already replied     | Loop Over Items                | Filter                         | Check duplicate row in Baserow                                            |
| Filter                    | Code                                | Merges Reddit post and Baserow data | Check Baserow for duplicate post | Filter Replied Posts            |                                                                            |
| Filter Replied Posts       | If                                  | Filters out already replied posts  | Filter                        | Wait (true), AI Agent (false)  | Filter Replied Posts                                                      |
| Wait                      | Wait                                | Waits 5 minutes if post already replied | Filter Replied Posts (true)   | Loop Over Items                | Wait for 5mins                                                           |
| AI Agent                  | Langchain Agent                     | Analyzes post relevance             | Filter Replied Posts (false)  | Structure Output               | Analyse Post Relevance & Sentiment                                       |
| Google Gemini Chat Model   | AI Language Model                   | Language model for AI Agent         | AI Agent                     | AI Agent                      |                                                                            |
| Anthropic Chat Model       | AI Language Model                   | Alternate language model for AI Agent | AI Agent                  | AI Agent                      |                                                                            |
| Structured Output Parser   | Output Parser                      | Parses AI response into JSON        | AI Agent                     | Structure Output               | Structure Output                                                        |
| Structure Output          | Set                                | Maps AI output fields               | Structured Output Parser / AI Agent | If                          | Structure Output                                                        |
| If                        | If                                  | Filters relevant posts for commenting | Structure Output             | AI Agent1 (true), Loop Over Items (false) | Filter Relevant Post                                                    |
| AI Agent1                 | Langchain Agent                     | Generates Reddit comment text       | If (true)                    | HTTP Request                  | Write Reddit Comment using AI                                           |
| Google Gemini Chat Model1  | AI Language Model                   | Language model for AI Agent1        | AI Agent1                    | AI Agent1                    |                                                                            |
| Anthropic Chat Model1      | AI Language Model                   | Alternate model for AI Agent1       | AI Agent1                    | AI Agent1                    |                                                                            |
| Simple Memory             | Memory Buffer                      | Provides context memory to AI Agent1 | AI Agent1                    | AI Agent1                    |                                                                            |
| HTTP Request              | HTTP Request                      | Posts comment on Reddit             | AI Agent1                    | Map Output in Structure       | Post Reddit Comment                                                    |
| Map Output in Structure    | Set                                | Formats data for Baserow             | HTTP Request                 | Add Post Details on Baserow    |                                                                            |
| Add Post Details on Baserow | Baserow                            | Stores comment data in Baserow       | Map Output in Structure       | Wait to avoid hitting api limit | Store Comment Data on Baserow                                           |
| Wait to avoid hitting api limit | Wait                              | Waits 6 hours to avoid API limits    | Add Post Details on Baserow   | Loop Over Items               | Wait for 6 hrs                                                        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node**  
   - Set it to run every 12 hours.

2. **Add a Reddit node ("Search for a post")**  
   - Operation: Search  
   - Keyword: Set your target keyword(s) (replace `{your keyword here}`)  
   - Limit: 25  
   - Location: allReddit  
   - Sort: new  
   - Connect Schedule Trigger main output to this node.  
   - Configure Reddit OAuth2 credentials.

3. **Add a SplitInBatches node ("Loop Over Items")**  
   - Default settings (batch size 1 recommended)  
   - Connect output of Reddit node to this node.

4. **Add an HTTP Request node ("Check Baserow for duplicate post")**  
   - Method: GET  
   - URL: `https://api.baserow.io/api/database/rows/table/{table_id}/?user_field_names=true&filter__post_id__equal={{ $json.name }}&size=1` (replace `{table_id}` accordingly)  
   - Headers: Authorization `Token {token}` (replace `{token}` with your Baserow API token)  
   - Connect SplitInBatches output to this node.

5. **Add a Code node ("Filter")**  
   - JavaScript code merges Reddit post data with Baserow response:  
     ```js
     const post = $items('Loop Over Items', 0, 0).json;
     const res  = $json;
     return [{
       json: {
         ...post,
         baserow_count: res.count || 0,
         baserow_results: res.results || res.results?.results || [],
       }
     }];
     ```
   - Connect HTTP Request output to this node.

6. **Add an If node ("Filter Replied Posts")**  
   - Condition: `{{ ($json.baserow_count || 0) > 0 && ($json.baserow_results[0]?.status === true) }}` is true  
   - True branch connects to a Wait node (see step 7)  
   - False branch connects to AI Agent node (step 8)  
   - Connect Code node output to this If node.

7. **Add a Wait node ("Wait")**  
   - Duration: 5 minutes  
   - Connect If node true output to this node  
   - Connect this Wait node output back to “Loop Over Items” to continue processing.

8. **Add an AI Agent node ("AI Agent")**  
   - Use Langchain agent node  
   - Prompt: Include instructions to analyze post relevance based on brand criteria, with input fields: selftext, title, subreddit, postid  
   - Use AI models Google Gemini Chat Model and Anthropic Chat Model nodes as AI backend (connect via AI languageModel input)  
   - Connect If node false output to this AI Agent node.

9. **Add Google Gemini Chat Model and Anthropic Chat Model nodes**  
   - Configure with respective API credentials  
   - Connect both to AI Agent node.

10. **Add a Structured Output Parser node**  
    - Provide JSON schema example matching expected AI output fields (is_relevant, reason, relevance_type, title, selftext, subreddit, postid)  
    - Connect AI Agent output to this node.

11. **Add a Set node ("Structure Output")**  
    - Map parsed AI output JSON fields to workflow variables (output.is_relevant, output.reason, etc.)  
    - Connect Structured Output Parser output to this node.

12. **Add an If node ("If")**  
    - Condition: `{{ $json.output.is_relevant === 'true' }}`  
    - True output to second AI Agent node (“AI Agent1”); False output loops back to “Loop Over Items”.

13. **Add a second AI Agent node ("AI Agent1")**  
    - Prompt: Instruct to write a concise, genuine Reddit comment (under 110 words, no promotional tone unless clearly relevant, respect subreddit norms)  
    - Input variables: subreddit, title, selftext, reason, brand name/domain placeholders `{your.brand}`, `{your.domain}`  
    - Connect to Google Gemini Chat Model1 and Anthropic Chat Model1 nodes as AI backend.  
    - Connect If node true output to this node.

14. **Add Google Gemini Chat Model1 and Anthropic Chat Model1 nodes**  
    - Configure with same API credentials  
    - Connect to AI Agent1 node.

15. **Add Simple Memory node**  
    - Session key: “rustic”  
    - Session ID type: customKey  
    - Connect as AI memory input to AI Agent1.

16. **Add an HTTP Request node ("HTTP Request")**  
    - Method: POST  
    - URL: `https://oauth.reddit.com/api/comment`  
    - Authentication: OAuth2 with Reddit credentials  
    - Headers: User-Agent set to `n8n:reddit-autoreply:1.0 (by /u/{reddit-username})`  
    - Body (form-urlencoded):  
      - `api_type` = "json"  
      - `thing_id` = postid from AI analysis output  
      - `text` = generated comment text from AI Agent1 output  
    - Connect AI Agent1 output to this node.

17. **Add a Set node ("Map Output in Structure")**  
    - Map comment and post details: Post URL, Post ID, Subreddit, Post Title, Post Reply (comment text), Status (true), created_utc timestamp  
    - Connect HTTP Request output to this node.

18. **Add a Baserow node ("Add Post Details on Baserow")**  
    - Operation: Create  
    - Database and Table IDs set appropriately  
    - Map fields: Post ID, URL, Subreddit, Title, Reply, Status, created_utc  
    - Connect Set node output to this node.

19. **Add a Wait node ("Wait to avoid hitting api limit")**  
    - Duration: 6 hours  
    - Connect Baserow node output to this node.

20. **Loop the Wait node output back to “Loop Over Items” to continue processing new posts.**

---

### 5. General Notes & Resources

| Note Content                                                                                  | Context or Link                                                     |
|-----------------------------------------------------------------------------------------------|-------------------------------------------------------------------|
| Workflow respects Reddit API policies with proper User-Agent headers and OAuth2 authentication | Reddit API Guidelines: https://www.reddit.com/dev/api/           |
| AI prompts carefully crafted to avoid spam and respect subreddit norms                         | Prompts embedded within AI Agent nodes                            |
| Baserow used as lightweight CRM to track replied posts and avoid duplicates                    | Baserow API docs: https://baserow.io/docs/api/                    |
| Wait nodes deliberately used to space requests and prevent hitting API rate limits             | Ensures sustainable automation                                    |
| Sticky notes in the workflow provide clear block labeling and guidance                        | Visible in n8n editor for documentation and maintenance          |

---

**Disclaimer:** The provided content is solely based on an automated workflow created with n8n, adhering strictly to content policies without any illegal, offensive, or protected elements. All data handled is legal and public.