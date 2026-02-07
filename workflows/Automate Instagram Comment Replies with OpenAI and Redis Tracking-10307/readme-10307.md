Automate Instagram Comment Replies with OpenAI and Redis Tracking

https://n8nworkflows.xyz/workflows/automate-instagram-comment-replies-with-openai-and-redis-tracking-10307


# Automate Instagram Comment Replies with OpenAI and Redis Tracking

### 1. Workflow Overview

This workflow automates Instagram comment replies by leveraging OpenAI's language model for AI-generated contextual responses, while using Redis for duplicate prevention and logging. It is designed for Instagram account managers and marketers who want to engage their audience automatically and efficiently.

**Target Use Cases:**
- Real-time monitoring of Instagram comments on recent posts
- AI-powered generation of personalized replies based on comment content and post context
- Preventing duplicate replies to the same comment
- Filtering out spam or irrelevant comments to optimize reply quality
- Logging replies for analytics and tracking purposes

**Logical Blocks:**

- **1.1 Trigger Block:** Periodic trigger that initiates the workflow every few minutes to check for new comments.
- **1.2 Instagram Data Retrieval:** Fetches recent posts and their associated comments.
- **1.3 Data Preparation:** Splits posts and comments, merges comment data with post context for AI processing.
- **1.4 Duplicate Check:** Uses Redis to verify if a comment has already been replied to.
- **1.5 Spam Filtering:** Filters out spammy, overly short, or emoji-only comments.
- **1.6 AI Reply Generation:** Generates replies using OpenAI’s GPT model with contextual prompt.
- **1.7 Posting & Logging:** Posts the AI-generated reply to Instagram, marks the comment as replied in Redis, and logs the interaction for analytics.

---

### 2. Block-by-Block Analysis

#### 1.1 Trigger Block

- **Overview:**  
  Initiates the workflow on a schedule, running every 5 minutes by default to check for new Instagram comments.

- **Nodes Involved:**  
  - Schedule Trigger  
  - Sticky Note1 (documentation)

- **Node Details:**  
  - **Schedule Trigger**  
    - Type: scheduleTrigger  
    - Configuration: Runs at a fixed interval (default every 5 minutes)  
    - Input: None (trigger node)  
    - Output: Initiates “Get Recent Posts” node  
    - Edge Cases: Misconfigured schedule or n8n instance downtime may delay execution  
    - Sticky Note1: Explains trigger frequency recommendations for different traffic volumes  

#### 1.2 Instagram Data Retrieval

- **Overview:**  
  Retrieves the 10 most recent Instagram posts of the authenticated user and fetches all comments for each post.

- **Nodes Involved:**  
  - Get Recent Posts  
  - Sticky Note2  
  - Split Posts  
  - Get Comments  
  - Sticky Note3  
  - Split Comments

- **Node Details:**  
  - **Get Recent Posts**  
    - Type: httpRequest  
    - Role: Calls Instagram Graph API `/me/media` endpoint using POST (Graph API requires POST for certain calls)  
    - Parameters: Requests fields `id,caption,media_type,media_url,timestamp`, limit 10 posts  
    - Authentication: Instagram Graph API credentials  
    - Input: From Schedule Trigger  
    - Output: JSON array of recent posts  
    - Edge Cases: Instagram API rate limiting, expired tokens, empty posts list  
    - Sticky Note2: Details endpoint and returned data  

  - **Split Posts**  
    - Type: splitOut  
    - Role: Splits the array of posts into individual items for separate processing  
    - Input: Output of Get Recent Posts  
    - Output: Single post per execution branch  

  - **Get Comments**  
    - Type: httpRequest  
    - Role: Fetches comments for each post using `/{{post_id}}/comments` endpoint  
    - Parameters: Fields requested are `id,text,username,timestamp,like_count`  
    - Authentication: Instagram Graph API credentials  
    - Input: Each post item from Split Posts  
    - Output: JSON array of comments per post  
    - Edge Cases: No comments, API failures, rate limits  

  - **Split Comments**  
    - Type: splitOut  
    - Role: Splits comments array into individual comment items  
    - Input: Output of Get Comments  
    - Output: Single comment per execution branch  

  - **Sticky Notes**  
    - Sticky Note2 and Sticky Note3 document the purpose and API endpoints of these nodes.

#### 1.3 Data Preparation

- **Overview:**  
  Merges each comment with its corresponding post context (caption, media info) to provide AI with necessary background for generating relevant replies.

- **Nodes Involved:**  
  - Add Post Context  
  - Sticky Note4

- **Node Details:**  
  - **Add Post Context**  
    - Type: merge (mode: combine, combinationMode: multiplex)  
    - Role: Combines the individual comment data and the respective post data so that each comment item contains post details  
    - Input: From Split Comments (comment data) and Split Posts (post data)  
    - Output: Combined JSON object with comment and post information  
    - Edge Cases: Mismatched data if IDs or arrays are out of sync  

  - **Sticky Note4**  
    - Documents the purpose of merging comment with post data for AI context

#### 1.4 Duplicate Check

- **Overview:**  
  Checks Redis if the comment has already been replied to, to avoid duplicate responses.

- **Nodes Involved:**  
  - Check If Replied  
  - Sticky Note5  
  - Not Replied Yet?  
  - Sticky Note6

- **Node Details:**  
  - **Check If Replied**  
    - Type: redis  
    - Role: Queries Redis by key `replied_{comment_id}` to check if reply exists  
    - Input: Combined comment-post data  
    - Output: Redis value of the key (empty if not replied)  
    - Credentials: Redis account configured separately  
    - Edge Cases: Redis connection failure, key TTL expiry  
    - Sticky Note5 explains the duplicate prevention logic  

  - **Not Replied Yet?**  
    - Type: if  
    - Role: Filters data stream to continue only if Redis reply key is empty  
    - Condition: Checks if Redis response `reply` is empty  
    - Output: Continue workflow for new comments only  
    - Sticky Note6 explains the filter logic  

#### 1.5 Spam Filtering

- **Overview:**  
  Filters comments for spam, very short texts, or emoji-only content to avoid unnecessary or inappropriate AI replies.

- **Nodes Involved:**  
  - Spam Filter  
  - Sticky Note7  
  - Should Reply?

- **Node Details:**  
  - **Spam Filter**  
    - Type: code (JavaScript)  
    - Role: Implements keyword-based spam detection, minimum length check, emoji-only filter  
    - Keywords: ‘buy now’, ‘click here’, ‘dm me’, ‘check bio’, ‘follow for follow’, ‘f4f’, ‘l4l’, ‘spam’, ‘bot’  
    - Outputs booleans: isSpam, isTooShort, isOnlyEmojis, and a combined shouldReply flag  
    - Input: Single comment JSON  
    - Output: Augmented JSON with filtering flags  
    - Edge Cases: New spam patterns not covered, false positives/negatives  
    - Sticky Note7 documents filtering criteria  

  - **Should Reply?**  
    - Type: if  
    - Role: Passes comments with `shouldReply` true to AI generation  
    - Edge Cases: False negatives prevent replies  

#### 1.6 AI Reply Generation

- **Overview:**  
  Generates a friendly, contextual reply using OpenAI's GPT-4o-mini model based on the comment text, username, and post caption.

- **Nodes Involved:**  
  - Generate AI Reply  
  - Sticky Note8

- **Node Details:**  
  - **Generate AI Reply**  
    - Type: OpenAI node from Langchain integration (chat resource)  
    - Role: Calls OpenAI GPT-4o-mini for generating reply text  
    - Prompt includes: post caption, comment text, username  
    - Parameters: temperature 0.8 (creative), max tokens 150, tone friendly and engaging  
    - Credentials: OpenAI API key configured externally  
    - Input: Filtered comment with post context  
    - Output: AI-generated message content in JSON `message.content`  
    - Edge Cases: API rate limits, malformed prompts, network failures  
    - Sticky Note8 documents the AI generation settings  

#### 1.7 Posting & Logging

- **Overview:**  
  Posts the AI-generated reply on Instagram, marks the comment as replied in Redis with a 30-day TTL, and logs the reply details for analytics.

- **Nodes Involved:**  
  - Post Reply  
  - Sticky Note9  
  - Mark As Replied  
  - Sticky Note10  
  - Log Reply  
  - Sticky Note11

- **Node Details:**  
  - **Post Reply**  
    - Type: httpRequest  
    - Role: Posts reply to Instagram at endpoint `/{comment_id}/replies` using POST method  
    - Body: JSON with `message` set to AI-generated reply text  
    - Authentication: Instagram Graph API credentials  
    - Input: AI-generated reply plus comment data  
    - Output: Instagram API response  
    - Edge Cases: API failures, permission issues, rate limiting  
    - Sticky Note9 documents API details  

  - **Mark As Replied**  
    - Type: redis  
    - Role: Sets Redis key `replied_{comment_id}` to true with TTL 30 days (2592000 seconds)  
    - Input: Comment ID after successful reply post  
    - Credentials: Redis account  
    - Edge Cases: Redis connection issues  
    - Sticky Note10 documents Redis key and TTL  

  - **Log Reply**  
    - Type: redis  
    - Role: Pushes a JSON string of reply details (comment ID, username, comment text, reply text, post ID, timestamp) to Redis list `instagram_replies_log` for analytics  
    - Input: Data from Mark As Replied node  
    - Credentials: Redis account  
    - Edge Cases: Redis list push failure  
    - Sticky Note11 documents analytics use  

---

### 3. Summary Table

| Node Name          | Node Type                | Functional Role                      | Input Node(s)           | Output Node(s)           | Sticky Note                                                                                   |
|--------------------|--------------------------|------------------------------------|------------------------|--------------------------|----------------------------------------------------------------------------------------------|
| Schedule Trigger    | scheduleTrigger          | Initiates workflow on schedule     | None                   | Get Recent Posts          | Runs every 5 minutes to check for new comments. Adjust frequency based on traffic.           |
| Get Recent Posts    | httpRequest              | Fetches 10 most recent Instagram posts | Schedule Trigger       | Split Posts               | Fetches recent posts via `/me/media` API endpoint.                                           |
| Split Posts         | splitOut                 | Splits posts array into single items | Get Recent Posts       | Get Comments, Add Post Context | -                                                                                            |
| Get Comments        | httpRequest              | Fetches comments for each post     | Split Posts            | Split Comments            | Fetches all comments for each post with relevant fields.                                    |
| Split Comments      | splitOut                 | Splits comments array into single comments | Get Comments          | Add Post Context          | -                                                                                            |
| Add Post Context    | merge                    | Combines comment and post data     | Split Comments, Split Posts | Check If Replied         | Merges comment data with post caption for AI context.                                       |
| Check If Replied    | redis                    | Checks Redis if comment was replied | Add Post Context       | Not Replied Yet?          | Checks Redis key `replied_{comment_id}` to prevent duplicate replies.                        |
| Not Replied Yet?    | if                       | Filters to continue only if not replied | Check If Replied       | Spam Filter               | Only processes comments that haven't been replied to yet.                                   |
| Spam Filter         | code                     | Filters spammy or irrelevant comments | Not Replied Yet?       | Should Reply?             | Filters spam keywords, short comments, emoji-only comments. Prevents wasting API calls.     |
| Should Reply?       | if                       | Checks if comment should be replied | Spam Filter            | Generate AI Reply         | Continues only if comment passes spam filter.                                               |
| Generate AI Reply   | OpenAI (langchain)       | Generates AI reply using GPT       | Should Reply?           | Post Reply                | Uses GPT-4o-mini; prompt includes comment, username, post caption; temperature 0.8.          |
| Post Reply          | httpRequest              | Posts AI-generated reply to Instagram | Generate AI Reply      | Mark As Replied           | Posts reply to Instagram API `/comment_id/replies`.                                         |
| Mark As Replied     | redis                    | Marks comment as replied in Redis  | Post Reply              | Log Reply                 | Sets Redis key `replied_{comment_id}` true with 30-day TTL.                                 |
| Log Reply           | redis                    | Logs reply details to Redis list   | Mark As Replied         | None                     | Logs comment & reply data for analytics in Redis list `instagram_replies_log`.              |
| Sticky Note (various)| stickyNote               | Documentation and explanations     | Various                 | Various                   | Multiple nodes contain detailed documentation notes as per above descriptions.              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node**  
   - Type: scheduleTrigger  
   - Set to run every 5 minutes (adjustable as needed)  

2. **Create HTTP Request node: Get Recent Posts**  
   - Type: httpRequest  
   - Method: POST  
   - URL: `https://graph.instagram.com/me/media`  
   - Query parameters:  
     - fields: `id,caption,media_type,media_url,timestamp`  
     - limit: `10`  
   - Authentication: Instagram Graph API credentials (OAuth2 token from Meta Developer Portal)  
   - Connect from Schedule Trigger  

3. **Create SplitOut node: Split Posts**  
   - Field to split out: `data` (the posts array)  
   - Connect from Get Recent Posts  

4. **Create HTTP Request node: Get Comments**  
   - Method: GET (or POST if needed by API)  
   - URL: `https://graph.instagram.com/{{ $json.id }}/comments` (dynamic with post ID)  
   - Query parameters: fields=`id,text,username,timestamp,like_count`  
   - Authentication: Instagram Graph API credentials  
   - Connect from Split Posts  

5. **Create SplitOut node: Split Comments**  
   - Field to split out: `data` (the comments array)  
   - Connect from Get Comments  

6. **Create Merge node: Add Post Context**  
   - Mode: Combine  
   - Combination Mode: Multiplex  
   - Connect first input: Split Comments  
   - Connect second input: Split Posts  
   - This merges each comment with its post data  

7. **Create Redis node: Check If Replied**  
   - Operation: Get  
   - Key: `replied_{{ $json.id }}` (comment ID)  
   - Credentials: Redis account configured  
   - Connect from Add Post Context  

8. **Create If node: Not Replied Yet?**  
   - Condition: String `reply` is empty (`={{ $json.reply }}` isEmpty)  
   - Connect from Check If Replied  

9. **Create Code node: Spam Filter**  
   - JavaScript code to detect spam keywords, short comments (<3 chars), emoji-only comments  
   - Output properties: `isSpam`, `isTooShort`, `isOnlyEmojis`, `shouldReply` (boolean)  
   - Connect from Not Replied Yet?  

10. **Create If node: Should Reply?**  
    - Condition: Boolean `shouldReply` equals `true`  
    - Connect from Spam Filter  

11. **Create OpenAI node: Generate AI Reply**  
    - Resource: Chat  
    - Model: GPT-4o-mini (or equivalent)  
    - Prompt: Includes post caption, comment text, username  
    - Temperature: 0.8  
    - Max tokens: 150  
    - Credentials: OpenAI API key  
    - Connect from Should Reply?  

12. **Create HTTP Request node: Post Reply**  
    - Method: POST  
    - URL: `https://graph.instagram.com/{{ $json.id }}/replies` (comment ID)  
    - Body parameter: `message` with value `={{ $json.message.content }}` (AI reply)  
    - Authentication: Instagram Graph API credentials  
    - Connect from Generate AI Reply  

13. **Create Redis node: Mark As Replied**  
    - Operation: Set  
    - Key: `replied_{{ $json.id }}`  
    - Value: `true`  
    - TTL: 2592000 (30 days in seconds)  
    - Credentials: Redis account  
    - Connect from Post Reply  

14. **Create Redis node: Log Reply**  
    - Operation: Push (to list)  
    - List: `instagram_replies_log`  
    - Message data: JSON.stringify object containing commentId, username, comment, reply, postId, timestamp  
    - Credentials: Redis account  
    - Connect from Mark As Replied  

15. **Connect all nodes sequentially as above to complete the workflow.**

---

### 5. General Notes & Resources

| Note Content                                                                                                                        | Context or Link                                                                                 |
|------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Setup required: Add Instagram Graph API credentials via Meta Developer Portal.                                                      | See Sticky Note13 in workflow for detailed setup steps                                         |
| Setup required: Add OpenAI API key from https://platform.openai.com/                                                                | Required for AI generation node                                                                |
| Setup required: Configure Redis connection for duplicate prevention and logging                                                     | Redis is critical for preventing duplicate replies and storing logs                             |
| Adjust trigger frequency based on Instagram account traffic volume                                                                  | High traffic: 2-3 min, Medium: 5 min, Low: 10-15 min                                           |
| Customize AI prompt tone, spam keywords, and reply filters as needed                                                                | The spam filter code node is customizable with keyword list and logic                           |
| Workflow respects Instagram API rate limits and OAuth token expiration; monitor usage accordingly                                   | Instagram API limits and token refresh should be handled outside this workflow                  |
| Logging replies to Redis allows integration with external analytics dashboards or reporting tools                                  | The Redis list `instagram_replies_log` can be consumed by BI tools or scripts                   |
| Documentation nodes (sticky notes) provide inline explanations for each step                                                        | They should be preserved in any exported or shared versions of the workflow for clarity        |

---

_Disclaimer: The provided content originates exclusively from an n8n automated workflow. It strictly adheres to content policies and contains no illegal, offensive, or protected material. Only legal and public data is processed._