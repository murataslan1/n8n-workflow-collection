Article to Threaded Bluesky Posts with JinaAI and Gemini/GPT

https://n8nworkflows.xyz/workflows/article-to-threaded-bluesky-posts-with-jinaai-and-gemini-gpt-7755


# Article to Threaded Bluesky Posts with JinaAI and Gemini/GPT

### 1. Workflow Overview

This workflow is designed to automate the process of transforming articles from various sources into threaded posts on the Bluesky social media platform. It integrates content extraction, AI-based content transformation, and social media posting, with support for both Telegram-triggered inputs and scheduled RSS feed ingestion.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception**: Receives article URLs either via Telegram messages or periodic RSS feed triggers.
- **1.2 Content Extraction**: Uses JinaAI to extract and parse web article content from the provided URL.
- **1.3 AI Processing (Thread Generation)**: Employs Google Gemini LLM (with an alternative OpenAI GPT model available) to convert extracted content into a formatted, engaging threaded post suitable for Bluesky.
- **1.4 Thread Processing**: Cleans and splits the AI-generated thread into individual posts for sequential publishing.
- **1.5 Posting Logic and Control**: Posts the first thread entry on Bluesky, then posts subsequent replies in sequence with controlled delays.
- **1.6 State Management and Conditional Logic**: Tracks post URIs and CIDs, manages batch loops, and uses conditions to distinguish the first post from replies.
- **1.7 Error Handling & Credentials Guidance**: Includes sticky notes with troubleshooting tips and credential setup instructions.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

**Overview:**  
This block gathers the input URLs for articles either from Telegram messages or from scheduled RSS feed updates. It normalizes the input into a consistent JSON field for downstream processing.

**Nodes Involved:**  
- Telegram Input Trigger  
- RSS Feed - Technology Review  
- RSS Feed - Machine Learning Mastery  
- RSS Feed - AI Trends  
- Prepare Input URL  

**Node Details:**

- **Telegram Input Trigger**  
  - Type: Telegram Trigger  
  - Role: Listens to incoming Telegram messages to receive URLs.  
  - Configuration: Listens for "message" updates on a webhook. Uses Telegram API credentials.  
  - Inputs: External Telegram messages  
  - Outputs: JSON containing message text (expected to contain URL)  
  - Failure modes: Telegram API authorization failure, webhook connectivity issues.

- **RSS Feed - Technology Review / Machine Learning Mastery / AI Trends**  
  - Type: RSS Feed Read Trigger  
  - Role: Scheduled triggers to poll RSS feeds once a day at specified hours.  
  - Configuration: Feed URLs set to respective sources; polling hours configured individually.  
  - Inputs: None (trigger node)  
  - Outputs: RSS feed items with article links  
  - Failure modes: Feed unavailability, HTTP errors, malformed RSS.

- **Prepare Input URL**  
  - Type: Set node  
  - Role: Creates a normalized field `inputUrl` selecting the URL from either RSS item (`link`) or Telegram message text.  
  - Configuration: Expression `={{ $json.link || $json.message.text }}` to handle multiple input formats.  
  - Inputs: Data from Telegram or RSS nodes  
  - Outputs: JSON with `inputUrl` field  
  - Failure modes: Missing or malformed input URL; downstream nodes require valid URL.

---

#### 2.2 Content Extraction

**Overview:**  
Extracts full web article content given an input URL, using JinaAI’s API for accurate content parsing.

**Nodes Involved:**  
- Extract Web Content (JinaAI)  

**Node Details:**

- **Extract Web Content (JinaAI)**  
  - Type: JinaAI node  
  - Role: Fetches and extracts structured web content (title, description, main content) from the URL.  
  - Configuration: URL parameter set dynamically from `inputUrl`.  
  - Credentials: JinaAI API key required.  
  - Inputs: JSON with `inputUrl` field  
  - Outputs: JSON including extracted fields like `title`, `description`, `content`  
  - Failure modes: Invalid or inaccessible URLs, network errors, API quota exceeded.

---

#### 2.3 AI Processing (Thread Generation)

**Overview:**  
Transforms the extracted article content into a structured, engaging thread formatted for Bluesky posts using the Google Gemini language model.

**Nodes Involved:**  
- Gemini  
- Transform Content to Thread  
- (Alternative) Alt (OpenAI GPT-4.1-mini, not connected in main flow)

**Node Details:**

- **Gemini**  
  - Type: Langchain Google Gemini Chat LLM  
  - Role: Runs the AI prompt to generate the thread text.  
  - Configuration: Default options, uses Google Palm API credentials.  
  - Inputs: Receives content fields (title, description, content) to craft thread.  
  - Outputs: AI-generated thread text wrapped in `[THREADSTART]...[THREADEND]` with `-cutthread-` separators.  
  - Failure modes: API quota exceeded, timeouts, malformed prompt input.

- **Transform Content to Thread**  
  - Type: Langchain Chain LLM node  
  - Role: Constructs the prompt for Gemini, embedding specific instructions for thread creation.  
  - Configuration: Template prompt using extracted article fields, emphasizing hook, flow, engagement, and output formatting rules (e.g., no dashes, max 300 chars per post).  
  - Inputs: Extracted content JSON  
  - Outputs: Raw thread text as single string  
  - Failure modes: Expression errors, unexpected content fields.

- **Alt (OpenAI GPT-4.1-mini)**  
  - Type: Langchain OpenAI Chat LLM  
  - Role: Alternative AI model node (currently not integrated in main path).  
  - Configuration: Uses OpenAI credentials.  
  - Inputs/Outputs: Similar role as Gemini, fallback or alternative for AI thread generation.

---

#### 2.4 Thread Processing

**Overview:**  
Processes the AI-generated thread text by cleaning, extracting, and splitting it into individual posts for sequential Bluesky posting.

**Nodes Involved:**  
- Prepare Thread Data  
- Clean Thread Text  
- Split Thread into Posts  

**Node Details:**

- **Prepare Thread Data**  
  - Type: Set node  
  - Role: Assigns the AI-generated thread text to a field `data` for further processing.  
  - Inputs: AI output from Gemini  
  - Outputs: JSON with `data` string containing full thread text.

- **Clean Thread Text**  
  - Type: Code node (JavaScript)  
  - Role:  
    - Extracts the thread content between `[THREADSTART]` and `[THREADEND]`.  
    - Splits by `-cutthread-` delimiter.  
    - Trims and filters empty posts.  
  - Inputs: Full thread text string  
  - Outputs: JSON array with each post as a separate element under `data` field.  
  - Failure modes: Regex mismatch if AI output format changes; empty or malformed thread.

- **Split Thread into Posts**  
  - Type: Split Out node  
  - Role: Splits the array of posts into individual items for batch processing.  
  - Inputs: Array of posts from Clean Thread Text  
  - Outputs: Separate items, one per post  
  - Failure modes: Empty array input.

---

#### 2.5 Posting Logic and Control

**Overview:**  
Manages posting of the thread to Bluesky, ensuring the first post is created as a new post and subsequent posts are replies. Includes wait nodes to space out posting and tracks post identifiers.

**Nodes Involved:**  
- Loop Through Thread Posts  
- Check First Post Condition  
- Create a post  
- Reply with Next Post  
- Wait Before Next Post (Initial)  
- Wait Before Next Reply  
- Store Post URI and CID  

**Node Details:**

- **Loop Through Thread Posts**  
  - Type: Split In Batches  
  - Role: Iterates over each individual thread post for sequential posting.  
  - Inputs: Individual posts from Split Thread into Posts  
  - Outputs: Posts one by one downstream  
  - Failure modes: Batch processing errors.

- **Check First Post Condition**  
  - Type: If node  
  - Role: Checks if current batch index (`$runIndex`) is zero to distinguish first post from replies.  
  - Inputs: Current batch index  
  - Outputs:  
    - True branch (first post) → Create a post  
    - False branch (replies) → Reply with Next Post

- **Create a post**  
  - Type: Bluesky Enhanced node  
  - Role: Posts the first thread post as a new Bluesky post.  
  - Configuration: Uses `postText` expression from current post data.  
  - Credentials: Bluesky API with app password.  
  - Outputs: Post URI and CID for tracking.  
  - Failure modes: Authentication failure, rate limits, text length limits.

- **Reply with Next Post**  
  - Type: Bluesky Enhanced node  
  - Role: Posts subsequent thread posts as replies to the original post.  
  - Configuration: Uses `cid` and `uri` from stored post data to reply correctly; reply text from current post.  
  - Credentials: Bluesky API.  
  - Failure modes: Invalid URI/CID, authentication errors.

- **Wait Before Next Post (Initial)** and **Wait Before Next Reply**  
  - Type: Wait nodes  
  - Role: Pauses workflow between posts to avoid rate limiting and create natural posting cadence.  
  - Configuration: Waits 10 seconds each time.  
  - Inputs/Outputs: Linked after each post node.  
  - Failure modes: Workflow delay issues.

- **Store Post URI and CID**  
  - Type: Set node  
  - Role: Stores the Bluesky post identifiers (`uri`, `cid`) for use in replies.  
  - Inputs: Response from post or reply nodes  
  - Outputs: JSON with stored identifiers  
  - Failure modes: Missing or invalid response data.

---

#### 2.6 Error Handling & Credentials Guidance (Sticky Notes)

**Overview:**  
Provides essential instructions for credential setup and common troubleshooting scenarios.

**Nodes Involved:**  
- Sticky Note (Credentials)  
- Sticky Note1 (Error Handling)  

**Node Details:**

- **Sticky Note (Credentials)**  
  - Content:  
    - Instructions for obtaining credentials for Telegram Bot, JinaAI, Google Gemini, and Bluesky.  
    - Includes links to relevant services: @BotFather, jina.ai, Google AI Studio, Bluesky.  
  - Purpose: Reference for setup before running workflow.

- **Sticky Note1 (Error Handling)**  
  - Content:  
    - Tips on handling failures from JinaAI (check URL), Gemini (reduce prompt), Bluesky (app password/rate limits).  
    - Advises testing with small samples first.  
  - Purpose: Operational troubleshooting guidance.

---

### 3. Summary Table

| Node Name                  | Node Type                                | Functional Role                              | Input Node(s)                        | Output Node(s)                     | Sticky Note                                                                                              |
|----------------------------|-----------------------------------------|----------------------------------------------|------------------------------------|----------------------------------|--------------------------------------------------------------------------------------------------------|
| Telegram Input Trigger      | Telegram Trigger                        | Receive URLs from Telegram messages           | -                                  | Prepare Input URL                 | See Sticky Note on credentials.                                                                        |
| RSS Feed - Technology Review| RSS Feed Read Trigger                   | Scheduled RSS feed trigger for Tech Review   | -                                  | Prepare Input URL                 | See Sticky Note on credentials.                                                                        |
| RSS Feed - Machine Learning Mastery | RSS Feed Read Trigger           | Scheduled RSS feed trigger for ML Mastery    | -                                  | Prepare Input URL                 | See Sticky Note on credentials.                                                                        |
| RSS Feed - AI Trends        | RSS Feed Read Trigger                   | Scheduled RSS feed trigger for AI Trends     | -                                  | Prepare Input URL                 | See Sticky Note on credentials.                                                                        |
| Prepare Input URL           | Set                                    | Normalize input URL from multiple sources    | Telegram Input Trigger, RSS feeds  | Extract Web Content (JinaAI)      |                                                                                                        |
| Extract Web Content (JinaAI)| JinaAI                                 | Extract article content from URL              | Prepare Input URL                  | Transform Content to Thread       | See Sticky Note1 for error handling.                                                                   |
| Gemini                     | Langchain Google Gemini LLM             | Generate threaded post content from article | Extract Web Content (JinaAI)       | Transform Content to Thread       | See Sticky Note1 for error handling.                                                                   |
| Transform Content to Thread | Langchain Chain LLM                     | Prompt formatting and AI thread generation   | Extract Web Content (JinaAI), Gemini| Prepare Thread Data             | See Sticky Note1 for error handling.                                                                   |
| Prepare Thread Data         | Set                                    | Assign AI thread text to `data` field        | Transform Content to Thread        | Clean Thread Text                |                                                                                                        |
| Clean Thread Text           | Code (JavaScript)                      | Extract and split thread into posts          | Prepare Thread Data                | Split Thread into Posts          |                                                                                                        |
| Split Thread into Posts     | Split Out                              | Split array of posts into individual items   | Clean Thread Text                  | Loop Through Thread Posts         |                                                                                                        |
| Loop Through Thread Posts   | Split In Batches                       | Iterate over posts for sequential posting    | Split Thread into Posts            | Check First Post Condition (branch 1 & 2) |                                                                                                        |
| Check First Post Condition  | If                                    | Distinguish first post from replies           | Loop Through Thread Posts          | Create a post, Reply with Next Post|                                                                                                        |
| Create a post              | Bluesky Enhanced Node                   | Post first thread message as new Bluesky post| Check First Post Condition (true) | Wait Before Next Post (Initial)  | See Sticky Note1 for error handling.                                                                   |
| Wait Before Next Post (Initial) | Wait                            | Delay for cadence after initial post          | Create a post                     | Store Post URI and CID           |                                                                                                        |
| Store Post URI and CID      | Set                                    | Store identifiers for reply chaining          | Wait Before Next Post (Initial), Wait Before Next Reply | Loop Through Thread Posts        |                                                                                                        |
| Reply with Next Post        | Bluesky Enhanced Node                   | Post replies to original thread post          | Check First Post Condition (false) | Wait Before Next Reply           | See Sticky Note1 for error handling.                                                                   |
| Wait Before Next Reply      | Wait                                   | Delay for cadence between replies              | Reply with Next Post              | Store Post URI and CID           |                                                                                                        |
| Alt                        | Langchain OpenAI LLM                   | Alternative AI model (GPT) for thread gen     | -                                | -                                |                                                                                                        |
| Sticky Note                | Sticky Note                            | Credentials setup instructions                 | -                                | -                                | Instructions to get Telegram, JinaAI, Gemini, Bluesky credentials with useful links.                     |
| Sticky Note1               | Sticky Note                            | Error handling tips                            | -                                | -                                | Troubleshooting guidance for JinaAI, Gemini, Bluesky failures; advises test with small samples.         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Input Trigger**  
   - Type: Telegram Trigger  
   - Set updates to listen for: "message"  
   - Configure Telegram API credentials (bot token from @BotFather)  
   - No additional parameters required.

2. **Create RSS Feed Read Triggers (3 Nodes)**  
   - For each: Technology Review, Machine Learning Mastery, AI Trends  
   - Type: RSS Feed Read Trigger  
   - Set feed URLs:  
     - Tech Review: `https://www.technologyreview.com/feed/` (poll at 22h)  
     - ML Mastery: `https://machinelearningmastery.com/blog/feed/` (poll at 18h)  
     - AI Trends: `https://www.aitrends.com/feed/` (poll at 0h)  
   - No credentials needed.

3. **Create Prepare Input URL Node**  
   - Type: Set  
   - Add assignment: `inputUrl` = `={{ $json.link || $json.message.text }}`  
   - Connect from all 4 triggers (Telegram + 3 RSS feeds).

4. **Create Extract Web Content (JinaAI)**  
   - Type: JinaAI node  
   - Set URL parameter: `={{ $json.inputUrl }}`  
   - Configure JinaAI API credentials (from jina.ai dashboard).

5. **Create Gemini Node (Google Gemini LLM)**  
   - Type: Langchain Google Gemini Chat LLM  
   - Use default options  
   - Configure with Google Palm API credentials (from Google AI Studio).

6. **Create Transform Content to Thread (Chain LLM)**  
   - Type: Langchain Chain LLM  
   - Prompt:  
     ```
     Title: {{ $json.title }}
     Description: {{ $json.description }}

     Content: {{ $json.content }}
     ```
   - Message: Detailed instruction to write a social media thread with specific formatting (see node details in section 2.3)  
   - Connect from Extract Web Content → Gemini → Transform Content to Thread.

7. **Create Prepare Thread Data Node**  
   - Type: Set  
   - Assignment: `data` = `={{ $json.text }}` (text output from Gemini)

8. **Create Clean Thread Text Node**  
   - Type: Code (JavaScript)  
   - Paste JavaScript to parse `[THREADSTART]...[THREADEND]` and split by `-cutthread-` (see section 2.4)  
   - Connect from Prepare Thread Data.

9. **Create Split Thread into Posts Node**  
   - Type: Split Out  
   - Field to split out: `data`  
   - Connect from Clean Thread Text.

10. **Create Loop Through Thread Posts Node**  
    - Type: Split In Batches  
    - Connect from Split Thread into Posts.

11. **Create Check First Post Condition Node**  
    - Type: If  
    - Condition: `$runIndex < 1` (checks if it’s the first post in batch)  
    - Connect from Loop Through Thread Posts.

12. **Create Create a post Node**  
    - Type: Bluesky Enhanced  
    - Set parameter: `postText` = `={{ $json.data }}` (current post text)  
    - Configure Bluesky API credentials (App Password from Bluesky account)  
    - Connect from Check First Post Condition (true branch).

13. **Create Wait Before Next Post (Initial) Node**  
    - Type: Wait  
    - Wait time: 10 seconds  
    - Connect from Create a post.

14. **Create Store Post URI and CID Node**  
    - Type: Set  
    - Assignments:  
      - `uri` = `={{ $json.uri }}`  
      - `cid` = `={{ $json.cid }}`  
    - Connect from Wait Before Next Post (Initial).

15. **Create Reply with Next Post Node**  
    - Type: Bluesky Enhanced  
    - Operation: Reply  
    - Parameters:  
      - `cid` = `={{ $('Store Post URI and CID').first(0, $runIndex).json.cid }}`  
      - `uri` = `={{ $('Store Post URI and CID').first(0, $runIndex).json.uri }}`  
      - `replyText` = `={{ $json.data }}`  
    - Connect from Check First Post Condition (false branch).

16. **Create Wait Before Next Reply Node**  
    - Type: Wait  
    - Wait time: 10 seconds  
    - Connect from Reply with Next Post.

17. **Connect Wait Before Next Reply to Store Post URI and CID**  
    - To keep track of each reply’s URI and CID for the next iteration.

18. **Connect Store Post URI and CID back to Loop Through Thread Posts**  
    - To continue batch processing of posts.

19. **(Optional) Create Alt Node for OpenAI GPT model**  
    - Type: Langchain OpenAI Chat LLM  
    - Configure with OpenAI credentials.  
    - Not connected to main flow but available as alternative.

20. **Add Sticky Notes**  
    - Credentials setup instructions (Telegram, JinaAI, Google Gemini, Bluesky) with links.  
    - Error handling tips for JinaAI, Gemini, Bluesky issues.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                  | Context or Link                                                                                         |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|
| How to obtain credentials: Telegram Bot via [@BotFather](https://t.me/botfather), JinaAI API Key at [jina.ai](https://jina.ai), Google Gemini API at [Google AI Studio](https://makersuite.google.com/), Bluesky App Password at [Bluesky](https://bsky.app). | Sticky Note in workflow providing credential acquisition guidance.                                     |
| Error handling tips: Check URL validity for JinaAI failures; simplify prompt or reduce size for Gemini timeout; verify Bluesky App Password and watch rate limits. Test with small samples first. | Sticky Note in workflow providing operational troubleshooting advice.                                  |

---

This structured documentation aims to fully capture the workflow logic, enabling users and AI agents to understand, reproduce, and maintain the automation without access to raw JSON or external references beyond those provided.