Auto-comment on Instagram posts with GPT-4o, Phantombuster, and SharePoint

https://n8nworkflows.xyz/workflows/auto-comment-on-instagram-posts-with-gpt-4o--phantombuster--and-sharepoint-6768


# Auto-comment on Instagram posts with GPT-4o, Phantombuster, and SharePoint

### 1. Workflow Overview

This workflow automates commenting on Instagram posts using a combination of GPT-4o (OpenAI), Phantombuster agents, and Microsoft SharePoint for data management. Its main use case is to engage Instagram posts under specific hashtags by generating context-aware comments, while avoiding duplicates and respecting rate limits.

The workflow is logically divided into these blocks:

- **1.1 Initialization & Scheduling**: Periodically triggers the workflow and prepares session cookies and hashtags.
- **1.2 Hashtag-Based Instagram Post Scraping**: Uses Phantombuster agents to scrape Instagram posts for generated hashtags.
- **1.3 Post Selection and Comment Generation**: Randomly selects a post, checks for duplicates, and generates an Instagram-optimized comment using GPT-4o.
- **1.4 CSV Handling & Posting**: Creates a CSV with post and comment data, uploads it to SharePoint, then triggers another Phantombuster agent to post the comment.
- **1.5 Deduplication and Data Update**: Checks if the post was already commented on, updates the list of commented posts in SharePoint.
- **1.6 Rate Limiting and Waits**: Includes scheduled triggers and wait nodes to control execution frequency and avoid hitting Instagram or API limits.

---

### 2. Block-by-Block Analysis

#### 1.1 Initialization & Scheduling

**Overview:**  
This block triggers the workflow every two hours, downloads available Instagram session cookies from SharePoint, selects an active cookie based on the current hour, and generates a realistic hashtag for scraping Instagram posts.

**Nodes Involved:**  
- Schedule Trigger  
- Get Available Session Cookies  
- Extract Cookies  
- OpenAI Chat Model2 (GPT-4o)  
- Select Cookie  
- OpenAI Chat Model1 (GPT-4o)  
- Generate Random Hashtag  
- Set ENV Variables  
- Sticky Note4, Sticky Note5

**Node Details:**  

- **Schedule Trigger**  
  - Type: Schedule Trigger  
  - Role: Starts workflow every 2 hours at 30 minutes past the hour.  
  - Config: Interval set to 2 hours, triggering at minute 30.  
  - Input: None  
  - Output: Triggers downstream nodes.  
  - Edge Cases: Missed triggers if n8n is offline; no credentials needed.  

- **Get Available Session Cookies**  
  - Type: Microsoft SharePoint  
  - Role: Downloads a text file containing session cookies for Instagram.  
  - Config: Points to SharePoint site and folder, downloads `instagram_session_cookies.txt`.  
  - Credentials: Microsoft SharePoint OAuth2.  
  - Input: Trigger from Schedule Trigger.  
  - Output: File content to Extract Cookies.  
  - Failures: Auth errors, file not found, network issues.  

- **Extract Cookies**  
  - Type: Extract From File (text operation)  
  - Role: Extracts raw text content from the downloaded file.  
  - Input: File binary from SharePoint node.  
  - Output: Text data containing cookies list.  
  - Edge Cases: Empty or corrupted file content.  

- **OpenAI Chat Model2**  
  - Type: OpenAI Chat Model (GPT-4o)  
  - Role: (Not directly connected, likely for internal or fallback usage)  
  - Credentials: OpenAI API.  
  - Output: Used by Select Cookie as AI model.  

- **Select Cookie**  
  - Type: LangChain Agent (GPT-4o)  
  - Role: Selects one session cookie from the list based on current Berlin hour, slicing cookies evenly across the day.  
  - Config: Prompt defines the selection logic and requires output as JSON with `session_cookie` field.  
  - Input: Text of cookies from Extract Cookies.  
  - Output: Selected cookie JSON, used downstream.  
  - Edge Cases: Invalid cookie format, AI response errors, time zone issues.  

- **OpenAI Chat Model1**  
  - Type: OpenAI Chat Model (GPT-4o)  
  - Role: Supports Generate Random Hashtag.  
  - Credentials: OpenAI API.  

- **Generate Random Hashtag**  
  - Type: LangChain Agent (GPT-4o)  
  - Role: Generates a realistic Instagram hashtag related to AI and Business Process Automation.  
  - Config: Prompt restricts output to a JSON object with a single hashtag field.  
  - Input: Triggered after Select Cookie.  
  - Output: Hashtag JSON used by Set ENV Variables.  
  - Edge Cases: Unparseable or invalid hashtag from AI.  

- **Set ENV Variables**  
  - Type: Set  
  - Role: Stores environment variables including session cookie, hashtag, max posts per hashtag, comment prompt, and comment language for downstream nodes.  
  - Input: Hashtag JSON from Generate Random Hashtag and cookie JSON from Select Cookie.  
  - Output: Variables accessible by other nodes via expressions.  

- **Sticky Notes 4 & 5**  
  - Informational nodes describing this block's purpose and configuration notes.

---

#### 1.2 Hashtag-Based Instagram Post Scraping

**Overview:**  
This block uses Phantombuster agents to scrape Instagram posts for the generated hashtag and retrieves the posts data.

**Nodes Involved:**  
- Get Hashtag Agent (Phantombuster get)  
- Launch Agent (Phantombuster launch)  
- Get Posts (Phantombuster getOutput)  
- Wait (Wait node)  
- Set ENV Variables (from previous block)  
- Sticky Note (dbb2757c...) for block title  
- Sticky Note6

**Node Details:**  

- **Get Hashtag Agent**  
  - Type: Phantombuster (get)  
  - Role: Retrieves the agent configuration or status for the hashtag scraping agent.  
  - Config: Agent ID for hashtag scraping hardcoded.  
  - Input: From Set ENV Variables.  
  - Output: Status info to Launch Agent.  
  - Failures: API auth errors, agent not found.  

- **Launch Agent**  
  - Type: Phantombuster (launch)  
  - Role: Starts the Instagram hashtag scraping agent with parameters from ENV variables: max posts count, session cookie, spreadsheet URL with hashtags.  
  - Input: Agent info from Get Hashtag Agent.  
  - Output: Triggers Wait node.  
  - Failures: Invalid params, API limit, session cookie expired.  

- **Wait**  
  - Type: Wait (30 seconds)  
  - Role: Delays flow to allow scraping to complete.  
  - Input: From Launch Agent.  
  - Output: To Get Posts.  

- **Get Posts**  
  - Type: Phantombuster (getOutput)  
  - Role: Retrieves scraped Instagram posts data from the hashtag agent.  
  - Input: After Wait.  
  - Output: Posts data to Wait2.  
  - Failures: No output available, incomplete scraping.  

- **Wait2**  
  - Type: Wait (no duration configured, acts as delay point)  
  - Role: Used downstream for pacing.  

- **Sticky Notes**  
  - Provide descriptive info about scraping logic, credentials, and tweak points.

---

#### 1.3 Post Selection and Comment Generation

**Overview:**  
From all scraped posts, this block randomly selects one, validates it's not already commented on, and generates a social media optimized comment using GPT-4o.

**Nodes Involved:**  
- Get Random Post (Code)  
- Download file (Microsoft SharePoint)  
- Extract from File (CSV extraction)  
- Check if in List (Code)  
- If (Conditional)  
- Wait2 (from previous block)  
- Prepare Updated Data (Code)  
- Convert to File  
- Update file (Microsoft SharePoint)  
- Create Comment (LangChain Agent)  
- OpenAI Chat Model (GPT-4o)  
- Sticky Note1, Sticky Note7, Sticky Note9

**Node Details:**  

- **Get Random Post**  
  - Type: Code  
  - Role: Selects a random Instagram post from the scraped data, outputs only post URL and description.  
  - Input: Instagram posts data from Get Posts → Wait2.  
  - Output: Post URL and description JSON.  
  - Failures: No posts available, empty input.  

- **Download file**  
  - Type: Microsoft SharePoint  
  - Role: Downloads CSV file listing Instagram posts already commented on to avoid duplicates.  
  - Input: From Get Random Post.  
  - Output: Binary file to Extract from File.  
  - Failures: File missing, auth issues.  

- **Extract from File**  
  - Type: Extract From File (CSV)  
  - Role: Extracts data rows from downloaded CSV with header row.  
  - Input: Binary file from Download file.  
  - Output: JSON array of commented posts.  

- **Check if in List**  
  - Type: Code  
  - Role: Checks if the randomly selected post URL already exists in the commented posts list to avoid duplicate commenting.  
  - Input: Extracted CSV data + selected post.  
  - Output: Boolean `isDuplicate`.  
  - Edge Cases: URL normalization to avoid minor mismatches; logging included for debugging.  

- **If**  
  - Type: Conditional  
  - Role: Branches workflow based on duplication check; if duplicate, ends or waits; if not, continues to update list and comment generation.  
  - Input: Output of Check if in List.  
  - Output: Two branches: duplicate → Wait2 (delay), else → Prepare Updated Data.  

- **Prepare Updated Data**  
  - Type: Code  
  - Role: Combines existing commented post URLs with the new post URL for updating the CSV file.  
  - Input: Extracted CSV data + selected post URL.  
  - Output: JSON array of URLs for conversion to CSV.  

- **Convert to File**  
  - Type: Convert To File  
  - Role: Converts prepared JSON array back into a CSV file for re-upload to SharePoint.  
  - Input: From Prepare Updated Data.  
  - Output: Binary CSV file.  

- **Update file**  
  - Type: Microsoft SharePoint  
  - Role: Updates the SharePoint CSV file with the new list of commented posts (including the newly added one).  
  - Input: CSV file binary from Convert to File.  
  - Output: Triggers Create Comment.  

- **Create Comment**  
  - Type: LangChain Agent (GPT-4o)  
  - Role: Generates an Instagram comment based on the post description and predefined rules like language and length.  
  - Config: Prompt instructs to produce a ≤150 character comment in German, subtly referencing the original post content.  
  - Input: Post description from Get Random Post, environment variables for comment prompt and language.  
  - Output: Comment text for CSV creation.  
  - Edge Cases: AI model failures, prompt misunderstanding, language constraints.  

- **OpenAI Chat Model**  
  - Type: OpenAI Chat Model (GPT-4o)  
  - Role: Backend model used by Create Comment node.  

- **Sticky Notes**  
  - Describe the logic for post selection, comment generation, and deduplication.

---

#### 1.4 CSV Handling & Posting

**Overview:**  
This block creates a CSV file with the post URL and generated comment, uploads it to SharePoint, and triggers the auto-commenting Phantombuster agent to post the comment on Instagram.

**Nodes Involved:**  
- Create CSV Binary (Code)  
- Upload CSV (Microsoft SharePoint)  
- Get Autocomment Agent (Phantombuster get)  
- Launch AC Agent (Phantombuster launch)  
- Wait1 (Wait node)  
- Get Response (Phantombuster getOutput)  
- Sticky Note2, Sticky Note8

**Node Details:**  

- **Create CSV Binary**  
  - Type: Code  
  - Role: Builds a single-row CSV file (post URL + comment) as binary data, escaping and cleaning text.  
  - Input: Post URL from Get Random Post, comment text from Create Comment.  
  - Output: Binary CSV for upload.  
  - Edge Cases: Special characters in text, encoding issues.  

- **Upload CSV**  
  - Type: Microsoft SharePoint  
  - Role: Uploads the CSV file to a specific SharePoint folder and filename for the auto-commenting agent to consume.  
  - Input: Binary CSV from Create CSV Binary.  
  - Output: Download URL used as input parameter for Launch AC Agent.  
  - Failures: Auth errors, file overwrite conflicts.  

- **Get Autocomment Agent**  
  - Type: Phantombuster (get)  
  - Role: Retrieves configuration/status for the auto-commenting agent.  
  - Input: After Upload CSV.  
  - Output: Info for Launch AC Agent.  

- **Launch AC Agent**  
  - Type: Phantombuster (launch)  
  - Role: Starts the auto-commenting agent with session cookie and spreadsheet URL pointing to the uploaded CSV on SharePoint.  
  - Input: Agent info and parameters JSON.  
  - Output: Triggers Wait1 node.  
  - Failures: API limits, session cookie expiration.  

- **Wait1**  
  - Type: Wait (30 seconds)  
  - Role: Allows time for agent to process posting.  

- **Get Response**  
  - Type: Phantombuster (getOutput)  
  - Role: Retrieves output data or status from the auto-commenting agent.  
  - Input: After Wait1.  
  - Output: (Not used further here, potential for logging or error detection).  

- **Sticky Notes**  
  - Explain the CSV creation, upload, and auto-comment agent launch process.

---

#### 1.5 Deduplication and Data Update

**Overview:**  
Ensures the workflow does not comment multiple times on the same Instagram post by downloading a CSV of already commented posts, checking duplicates, and updating the list accordingly.

**Nodes Involved:**  
- Download file  
- Extract from File  
- Check if in List  
- If  
- Prepare Updated Data  
- Convert to File  
- Update file  
- Sticky Note9

**Node Details:**  
Covered in 1.3 block as deduplication is integrated with comment generation.

---

#### 1.6 Rate Limiting and Waits

**Overview:**  
This block contains scheduled triggers and wait nodes spaced to limit the number of comments posted daily, controlling API and Instagram platform rate limits.

**Nodes Involved:**  
- Schedule Trigger  
- Wait  
- Wait1  
- Wait2  
- Sticky Note10

**Node Details:**  

- **Wait Nodes (Wait, Wait1, Wait2)**  
  - Type: Wait  
  - Role: Insert pauses (mostly 30 seconds) at critical points to avoid race conditions and rate-limit violations.  
  - Wait2 is used conditionally for duplicates.  

- **Schedule Trigger**  
  - Controls overall execution frequency (every 2 hours).  

- **Sticky Note10**  
  - Describes rate limiting and scheduling rationale.

---

### 3. Summary Table

| Node Name                | Node Type                          | Functional Role                              | Input Node(s)             | Output Node(s)             | Sticky Note                                                                                                  |
|--------------------------|----------------------------------|----------------------------------------------|---------------------------|----------------------------|--------------------------------------------------------------------------------------------------------------|
| Schedule Trigger          | Schedule Trigger                 | Periodic trigger every 2 hours                | —                         | Get Available Session Cookies | Describes scheduling and rate limiting logic.                                                              |
| Get Available Session Cookies | Microsoft SharePoint            | Downloads session cookie file                  | Schedule Trigger           | Extract Cookies             |                                                                                                              |
| Extract Cookies           | Extract From File (text)          | Extracts cookies list from file                | Get Available Session Cookies | Select Cookie              |                                                                                                              |
| OpenAI Chat Model2        | OpenAI Chat Model (GPT-4o)        | AI model for cookie selection                  | —                         | Select Cookie              |                                                                                                              |
| Select Cookie             | LangChain Agent (GPT-4o)          | Selects session cookie based on current hour  | Extract Cookies, OpenAI Chat Model2 | Generate Random Hashtag    |                                                                                                              |
| OpenAI Chat Model1        | OpenAI Chat Model (GPT-4o)        | AI model for hashtag generation                 | —                         | Generate Random Hashtag     |                                                                                                              |
| Generate Random Hashtag   | LangChain Agent (GPT-4o)          | Generates a realistic Instagram hashtag        | Select Cookie, OpenAI Chat Model1 | Set ENV Variables          |                                                                                                              |
| Set ENV Variables         | Set                              | Stores environment variables for session, hashtag, prompts | Generate Random Hashtag    | Get Hashtag Agent          |                                                                                                              |
| Get Hashtag Agent         | Phantombuster (get)               | Gets hashtag scraping agent info                | Set ENV Variables          | Launch Agent               | Sticky Note: "Get Instagram Posts By Custom Hashtag"                                                        |
| Launch Agent              | Phantombuster (launch)            | Launches hashtag scraping agent                 | Get Hashtag Agent          | Wait                       |                                                                                                              |
| Wait                     | Wait                             | Delays flow to allow scraping                    | Launch Agent               | Get Posts                  |                                                                                                              |
| Get Posts                 | Phantombuster (getOutput)         | Retrieves scraped Instagram posts                | Wait                      | Wait2                      | Sticky Note: "Scrape Instagram Posts"                                                                       |
| Wait2                    | Wait                             | Delay placeholder and conditional wait           | Get Posts, If (duplicate branch) | Get Random Post / Wait2    |                                                                                                              |
| Get Random Post           | Code                             | Selects a random Instagram post                   | Wait2                      | Download file              | Sticky Note: "Post Selection and Comment Generation"                                                        |
| Download file            | Microsoft SharePoint             | Downloads CSV of already commented posts          | Get Random Post            | Extract from File          |                                                                                                              |
| Extract from File         | Extract From File (CSV)           | Parses CSV of commented posts                      | Download file              | Check if in List           |                                                                                                              |
| Check if in List          | Code                             | Checks if post URL is duplicate                    | Extract from File, Get Random Post | If                        |                                                                                                              |
| If                       | If                               | Branches on duplicate check                        | Check if in List           | Wait2 (duplicate), Prepare Updated Data (new post) |                                                                                                              |
| Prepare Updated Data      | Code                             | Adds current post URL to existing list              | If (non-duplicate branch)  | Convert to File            |                                                                                                              |
| Convert to File           | Convert To File                  | Converts updated list to CSV                        | Prepare Updated Data       | Update file                |                                                                                                              |
| Update file               | Microsoft SharePoint             | Uploads updated CSV with commented posts            | Convert to File            | Create Comment             | Sticky Note: "Deduplication update"                                                                          |
| Create Comment            | LangChain Agent (GPT-4o)          | Generates Instagram comment for selected post      | Update file, Get Random Post | Create CSV Binary          | Sticky Note: "Comment Generation"                                                                             |
| OpenAI Chat Model         | OpenAI Chat Model (GPT-4o)        | AI model for comment generation                      | —                         | Create Comment             |                                                                                                              |
| Create CSV Binary         | Code                             | Creates one-row CSV (post URL + comment)             | Create Comment, Get Random Post | Upload CSV                 |                                                                                                              |
| Upload CSV                | Microsoft SharePoint             | Uploads CSV for autocommenting agent                 | Create CSV Binary          | Get Autocomment Agent      | Sticky Note: "CSV Upload & Auto-comment"                                                                      |
| Get Autocomment Agent     | Phantombuster (get)               | Retrieves autocomment agent info                       | Upload CSV                 | Launch AC Agent            |                                                                                                              |
| Launch AC Agent           | Phantombuster (launch)            | Launches autocomment agent with CSV and cookie       | Get Autocomment Agent      | Wait1                      |                                                                                                              |
| Wait1                    | Wait                             | Waits for autocomment agent to process               | Launch AC Agent            | Get Response               |                                                                                                              |
| Get Response             | Phantombuster (getOutput)         | Retrieves autocomment agent results                   | Wait1                      | —                          |                                                                                                              |
| Wait2                    | Wait                             | Conditional wait after duplicate detection            | If (duplicate branch)      | Get Random Post            |                                                                                                              |
| Sticky Notes (various)    | Sticky Note                      | Descriptive notes for workflow blocks                  | —                         | —                          | Multiple notes explain block purposes, tweaks, credentials, and logic.                                       |

---

### 4. Reproducing the Workflow from Scratch

**Step 1: Create Schedule Trigger**  
- Type: Schedule Trigger  
- Config: Interval → Hours: 2, Trigger At Minute: 30  
- No credentials needed  
- Output → Connect to "Get Available Session Cookies"

**Step 2: Download Instagram Session Cookies**  
- Type: Microsoft SharePoint  
- Operation: Download file  
- Configure site URL, folder ID, and file ID for `instagram_session_cookies.txt`  
- Use Microsoft SharePoint OAuth2 credentials  
- Input: From Schedule Trigger  
- Output → Connect to "Extract Cookies"

**Step 3: Extract Cookies Text**  
- Type: Extract From File (Text operation)  
- Input: File binary from SharePoint node  
- Output → Connect to "Select Cookie"

**Step 4: Setup OpenAI Chat Model (GPT-4o) Node**  
- Use OpenAI API credentials  
- Model: chatgpt-4o-latest  
- Use this model for nodes: Select Cookie, Generate Random Hashtag, Create Comment

**Step 5: Select Cookie Node**  
- Type: LangChain Agent (GPT-4o)  
- Prompt: Use the detailed selection logic based on current Berlin hour and number of cookies  
- Input: Text from "Extract Cookies"  
- Output: JSON with `session_cookie`  
- Output → Connect to "Generate Random Hashtag"

**Step 6: Generate Random Hashtag Node**  
- Type: LangChain Agent (GPT-4o)  
- Prompt: Generate a realistic hashtag related to AI and Business Process Automation, return JSON with `hashtag` field  
- Input: From Select Cookie  
- Output → Connect to "Set ENV Variables"

**Step 7: Set ENV Variables Node**  
- Type: Set  
- Create variables:  
  - ENV_SEARCH_HASHTAGS: from `hashtag` field (parse JSON)  
  - ENV_SESSION_COOKIE: from `session_cookie` (parse JSON)  
  - ENV_MAX_POSTS_PER_HASHTAG: 10 (string)  
  - ENV_COMMENT_PROMPT: "Erstelle einen ansprechenden Instagram-Kommentar basierend auf dem gegebenen Post-Inhalt."  
  - ENV_COMMENT_LANGUAGE: "Deutsch"  
- Output → Connect to "Get Hashtag Agent"

**Step 8: Get Hashtag Agent**  
- Type: Phantombuster (get)  
- Agent ID: Hashtag scraping agent ID (e.g., `4031886542434447`)  
- Credentials: Phantombuster API  
- Input: From Set ENV Variables  
- Output → Connect to "Launch Agent"

**Step 9: Launch Agent**  
- Type: Phantombuster (launch)  
- Agent ID: Same as above  
- Parameters: JSON with maxPosts, sessionCookie, spreadsheetUrl from ENV variables  
- Credentials: Phantombuster API  
- Output → Connect to "Wait" node (30 seconds)

**Step 10: Wait Node**  
- Type: Wait  
- Duration: 30 seconds  
- Output → Connect to "Get Posts"

**Step 11: Get Posts**  
- Type: Phantombuster (getOutput)  
- Agent ID: Hashtag agent ID  
- Credentials: Phantombuster API  
- Output → Connect to "Wait2"

**Step 12: Wait2 Node**  
- Type: Wait (empty or minimal delay)  
- Output → Connect to "Get Random Post"

**Step 13: Get Random Post**  
- Type: Code  
- Script: Selects a random post from input items, outputs postUrl and description only  
- Input: From Wait2  
- Output → Connect to "Download file"

**Step 14: Download file (Commented Posts CSV)**  
- Type: Microsoft SharePoint  
- Operation: Download file  
- File: `instagram_posts_already_commented.csv`  
- Credentials: Microsoft SharePoint OAuth2  
- Output → Connect to "Extract from File"

**Step 15: Extract from File**  
- Type: Extract From File (CSV)  
- Options: Header row = true  
- Output → Connect to "Check if in List"

**Step 16: Check if in List**  
- Type: Code  
- Script: Normalizes URLs, compares random post URL against all URLs in CSV, returns boolean `isDuplicate`  
- Output → Connect to "If"

**Step 17: If Node**  
- Condition: `isDuplicate` equals true  
- True branch → Connect to Wait2 (to delay and retry)  
- False branch → Connect to "Prepare Updated Data"

**Step 18: Prepare Updated Data**  
- Type: Code  
- Script: Merges existing CSV URLs with new post URL, outputs array for CSV conversion  
- Output → Connect to "Convert to File"

**Step 19: Convert to File**  
- Type: Convert To File  
- Convert JSON array into CSV file binary  
- Output → Connect to "Update file"

**Step 20: Update file**  
- Type: Microsoft SharePoint  
- Operation: Update file with new CSV content  
- Credentials: Microsoft SharePoint OAuth2  
- Output → Connect to "Create Comment"

**Step 21: Create Comment**  
- Type: LangChain Agent (GPT-4o)  
- Prompt: Use ENV_COMMENT_PROMPT + post description + language instructions (German, max 150 chars)  
- Output → Connect to "Create CSV Binary"

**Step 22: Create CSV Binary**  
- Type: Code  
- Script: Create CSV row with post URL and comment text, encode as buffer binary  
- Output → Connect to "Upload CSV"

**Step 23: Upload CSV**  
- Type: Microsoft SharePoint  
- Operation: Upload file  
- File name: `instagram_post_to_comment.csv`  
- Credentials: Microsoft SharePoint OAuth2  
- Output → Connect to "Get Autocomment Agent"

**Step 24: Get Autocomment Agent**  
- Type: Phantombuster (get)  
- Agent ID: Autocomment agent ID (e.g., `5533276466709830`)  
- Credentials: Phantombuster API  
- Output → Connect to "Launch AC Agent"

**Step 25: Launch AC Agent**  
- Type: Phantombuster (launch)  
- Parameters: JSON with sessionCookie and spreadsheetUrl (SharePoint download URL from Upload CSV)  
- Credentials: Phantombuster API  
- Output → Connect to "Wait1"

**Step 26: Wait1**  
- Type: Wait  
- Duration: 30 seconds  
- Output → Connect to "Get Response"

**Step 27: Get Response**  
- Type: Phantombuster (getOutput)  
- Retrieves status or results from autocomment agent  
- End of main flow

---

### 5. General Notes & Resources

| Note Content                                                                                                                   | Context or Link                                                                                               |
|-------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| Workflow automates Instagram commenting using GPT-4o and Phantombuster agents with SharePoint for data storage and management.| Project description                                                                                           |
| Session cookie selection logic divides day into equal slices to rotate cookies and avoid session expiration issues.            | Select Cookie node prompt                                                                                     |
| Hashtag generation prompt restricts to realistic human-like hashtags related to AI and business automation.                     | Generate Random Hashtag node prompt                                                                           |
| Duplicate checking normalizes URLs and compares against SharePoint CSV to avoid multiple comments on the same post.            | Check if in List node code                                                                                     |
| Rate limiting implemented via scheduled trigger every 2 hours and multiple wait nodes totaling ~80 comments/day max.           | Sticky Note10 and scheduling nodes                                                                            |
| SharePoint files used: `instagram_session_cookies.txt`, `instagram_posts_already_commented.csv`, `instagram_post_to_comment.csv`| SharePoint nodes configuration                                                                                 |
| Phantombuster agents used: hashtag scraping agent and autocomment agent, IDs hardcoded and must be managed in Phantombuster UI.| Phantombuster agent nodes                                                                                      |
| Prompts and environment variables can be customized to change language, comment style, or hashtag niche.                        | Set ENV Variables node                                                                                          |
| Potential failure points: expired session cookies, API limits, SharePoint auth issues, empty scraping results, AI prompt failures.| Suggested monitoring and error handling                                                                        |
| Replace SharePoint with other cloud storage (Drive, Dropbox) by adapting file download/upload nodes as needed.                  | Sticky Note8                                                                                                   |

---

**Disclaimer:**  
The provided text is exclusively derived from an n8n workflow automation and strictly complies with content policies. It contains no illegal, offensive, or protected material. All data handled is legal and public.