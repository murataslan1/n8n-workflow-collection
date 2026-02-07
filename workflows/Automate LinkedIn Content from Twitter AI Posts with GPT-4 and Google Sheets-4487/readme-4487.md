Automate LinkedIn Content from Twitter AI Posts with GPT-4 and Google Sheets

https://n8nworkflows.xyz/workflows/automate-linkedin-content-from-twitter-ai-posts-with-gpt-4-and-google-sheets-4487


# Automate LinkedIn Content from Twitter AI Posts with GPT-4 and Google Sheets

### 1. Workflow Overview

This workflow automates the process of generating and posting LinkedIn content derived from AI-generated tweets, leveraging GPT-4 and Google Sheets for data management. It targets social media managers or content creators who want to repurpose Twitter AI posts into LinkedIn updates automatically and schedule postings based on approved content and timing.

The logical structure is divided into these blocks:

- **1.1 Scheduled Tweet Fetching and Processing:** Triggered daily at 5 AM, fetch AI-generated tweets, clean them, check for duplicates in Google Sheets, and save new tweets.
- **1.2 Daily Content Processing and AI Generation:** Triggered daily at 6 AM, reads data from Google Sheets, limits entries, invokes an AI agent to generate LinkedIn posts from tweets, and aggregates results.
- **1.3 Post Approval and Scheduling:** Detects updates in Google Sheets for approved posts, filters them, limits batch size, calculates posting timings, and loops through approved posts.
- **1.4 LinkedIn Posting Automation:** Downloads images linked to posts, publishes content on LinkedIn, updates Google Sheets with posting status, and sends Telegram notifications about updates.
- **1.5 Control and Flow Management:** Various control nodes like split batches, switches, waits, and limits manage flow, timing, and error handling.

Each block is interlinked with nodes feeding outputs to subsequent processing steps, ensuring data flows from tweet acquisition through AI content generation to final LinkedIn posting.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Tweet Fetching and Processing

- **Overview:**  
  This block runs every day at 5 AM to retrieve AI-generated tweets via HTTP, clean and process the tweets, check for duplicates in Google Sheets, and save any new tweets found to the sheet.

- **Nodes Involved:**  
  - 5AM Everyday (Schedule Trigger)  
  - Get AI Tweets (HTTP Request)  
  - Clean Tweets (Code)  
  - Loop Tweets (Split In Batches)  
  - Find Existing Tweet (Google Sheets)  
  - Switch  
  - Already Exists, Ignore (NoOp)  
  - Save New Tweet (Google Sheets)  
  - All Done, End (NoOp)

- **Node Details:**

  - **5AM Everyday**  
    - Type: Schedule Trigger  
    - Role: Initiates the workflow daily at 5 AM.  
    - Config: Default daily schedule without filters.  
    - Inputs: None  
    - Outputs: Triggers "Get AI Tweets".  
    - Edge cases: Trigger failure due to n8n scheduler issues.

  - **Get AI Tweets**  
    - Type: HTTP Request  
    - Role: Fetches AI-generated tweets from an external API or service.  
    - Config: URL, method, auth (not detailed here) configured to pull latest tweets.  
    - Inputs: Trigger event from schedule node.  
    - Outputs: Raw tweet data to "Clean Tweets".  
    - Edge cases: Network errors, API limits, malformed responses.

  - **Clean Tweets**  
    - Type: Code  
    - Role: Processes and sanitizes tweet text, possibly removing unwanted characters or formatting.  
    - Config: Custom JavaScript code to clean tweet content.  
    - Inputs: Raw tweet data.  
    - Outputs: Cleaned tweets to "Loop Tweets".  
    - Edge cases: Code errors, empty inputs.

  - **Loop Tweets**  
    - Type: Split In Batches  
    - Role: Processes tweets individually or in smaller batches for downstream operations.  
    - Config: Batch size configured (default not specified).  
    - Inputs: Cleaned tweets.  
    - Outputs: Sends each tweet to "Find Existing Tweet" or ends workflow via "All Done, End".  
    - Edge cases: Empty batches, batch size misconfiguration.

  - **Find Existing Tweet**  
    - Type: Google Sheets  
    - Role: Checks if the tweet already exists in a Google Sheet to avoid duplicates.  
    - Config: Reads sheet rows, filters by tweet ID or content hash.  
    - Inputs: Single tweet from batch.  
    - Outputs: Sends to "Switch" node.  
    - Edge cases: Google API auth errors, rate limits, sheet not found.

  - **Switch**  
    - Type: Switch  
    - Role: Routes tweets based on existence check result.  
    - Config: Condition tests if tweet is found or new.  
    - Inputs: Output from "Find Existing Tweet".  
    - Outputs:  
      - If exists: to "Already Exists, Ignore" (NoOp)  
      - If new: to "Wait" node for delayed saving.  
    - Edge cases: Misconfigured conditions, expression errors.

  - **Already Exists, Ignore**  
    - Type: NoOp  
    - Role: Terminates processing for existing tweets to avoid duplication.  
    - Inputs: From "Switch".  
    - Outputs: Loops back to "Loop Tweets".  
    - Edge cases: None.

  - **Wait**  
    - Type: Wait  
    - Role: Delays processing before saving new tweets to avoid API rate limits or timing issues.  
    - Inputs: New tweets from "Switch".  
    - Outputs: To "Save New Tweet".  
    - Edge cases: Timeouts, webhook ID misconfiguration.

  - **Save New Tweet**  
    - Type: Google Sheets  
    - Role: Appends new tweet data into the Google Sheet for tracking and later processing.  
    - Config: Sheet, worksheet, append mode configured.  
    - Inputs: Delayed new tweets.  
    - Outputs: Loops back to "Loop Tweets" for next batch.  
    - Edge cases: Google Sheets API errors, auth failures.

  - **All Done, End**  
    - Type: NoOp  
    - Role: Marks end of processing for the batch.  
    - Inputs: From "Loop Tweets" when no more tweets exist.  
    - Outputs: None.  
    - Edge cases: None.

---

#### 1.2 Daily Content Processing and AI Generation

- **Overview:**  
  Runs daily at 6 AM to read stored tweets from Google Sheets, limit the number processed, send each to an AI agent (GPT-4) for generating LinkedIn content, and aggregate the AI outputs.

- **Nodes Involved:**  
  - 6AM Daily (Schedule Trigger)  
  - Google Sheets (Read)  
  - Limit  
  - AI Agent (Langchain agent using OpenAI GPT-4)  
  - 4.1 (LM Chat Open Router)  
  - Structured Output Parser  
  - Loop Posts (Split In Batches)  
  - Aggregate

- **Node Details:**

  - **6AM Daily**  
    - Type: Schedule Trigger  
    - Role: Starts the content generation process daily at 6 AM.  
    - Inputs: None  
    - Outputs: Triggers "Google Sheets".  
    - Edge cases: Scheduler issues.

  - **Google Sheets**  
    - Type: Google Sheets  
    - Role: Reads tweets or data rows from sheet for AI processing.  
    - Config: Spreadsheet and worksheet specified.  
    - Inputs: Trigger from schedule.  
    - Outputs: Data to "Limit".  
    - Edge cases: Auth errors, empty sheet.

  - **Limit**  
    - Type: Limit  
    - Role: Limits number of rows processed in this run to avoid overloading AI or API limits.  
    - Config: Max items (not specified, likely default or set to a safe number).  
    - Inputs: Google Sheets output.  
    - Outputs: To "AI Agent".  
    - Edge cases: Misconfigured limit.

  - **AI Agent**  
    - Type: Langchain Agent (GPT-4)  
    - Role: Processes each tweet to generate LinkedIn post content.  
    - Config: Uses OpenAI GPT-4 model, integrated via Langchain interface.  
    - Inputs: Rows from "Limit".  
    - Outputs: To "Loop Posts".  
    - Edge cases: API quota, network errors, prompt errors.

  - **4.1 (LM Chat Open Router)**  
    - Type: Language Model Chat Router  
    - Role: Routes and manages chat completions for GPT-4.  
    - Config: OpenAI API key credentials, prompt templates (not detailed).  
    - Inputs: AI Agent node.  
    - Outputs: Parsed results to "Structured Output Parser".  
    - Edge cases: API errors, token limits.

  - **Structured Output Parser**  
    - Type: Langchain Structured Output Parser  
    - Role: Parses AI output into structured JSON or data format suitable for further processing.  
    - Config: Output schema defined to extract needed fields.  
    - Inputs: Output from LM Chat Router.  
    - Outputs: To "AI Agent" (loop or next processing).  
    - Edge cases: Parsing errors, unexpected output format.

  - **Loop Posts**  
    - Type: Split In Batches  
    - Role: Splits generated LinkedIn posts into batches to manage bulk operations like aggregation or storage.  
    - Inputs: AI Agent output.  
    - Outputs: To "Aggregate" and "Wait1".  
    - Edge cases: Empty inputs.

  - **Aggregate**  
    - Type: Aggregate  
    - Role: Collects batch data for summary or combined processing (e.g., preparing for notification).  
    - Inputs: From "Loop Posts".  
    - Outputs: To "Telegram" for notification.  
    - Edge cases: Data consistency.

---

#### 1.3 Post Approval and Scheduling

- **Overview:**  
  Triggered by Google Sheets updates (likely approval status changes), this block filters approved posts, limits the batch size, calculates posting timings, and iterates through approved posts for scheduled posting.

- **Nodes Involved:**  
  - Updated News (Google Sheets Trigger)  
  - Filter Approved (Filter)  
  - Max 20 (Limit)  
  - Get Post Timings (Code)  
  - Loop Approved Posts (Split In Batches)  
  - Wait for Posting (Wait)  
  - Set Posting (Google Sheets)  
  - Update User (Telegram)

- **Node Details:**

  - **Updated News**  
    - Type: Google Sheets Trigger  
    - Role: Listens for updates in Google Sheets rows, indicating new approvals or changes.  
    - Inputs: None (trigger)  
    - Outputs: To "Filter Approved".  
    - Edge cases: Missed triggers, auth errors.

  - **Filter Approved**  
    - Type: Filter  
    - Role: Filters only posts marked as approved for posting.  
    - Config: Condition based on approval column value.  
    - Inputs: Trigger data.  
    - Outputs: Approved posts to "Max 20".  
    - Edge cases: Incorrect filtering conditions.

  - **Max 20**  
    - Type: Limit  
    - Role: Limits number of posts processed for scheduling to 20 to avoid overload.  
    - Inputs: Filtered posts.  
    - Outputs: To "Get Post Timings".  
    - Edge cases: Misconfiguration.

  - **Get Post Timings**  
    - Type: Code  
    - Role: Calculates or assigns the exact posting times for each approved post based on business logic or schedule.  
    - Inputs: Posts from "Max 20".  
    - Outputs: To "Loop Approved Posts".  
    - Edge cases: Time zone errors, invalid data.

  - **Loop Approved Posts**  
    - Type: Split In Batches  
    - Role: Processes each approved post individually for posting.  
    - Inputs: Posts with timings.  
    - Outputs: To "Update User" and "Wait for Posting".  
    - Edge cases: Empty input.

  - **Wait for Posting**  
    - Type: Wait  
    - Role: Delays execution until the scheduled posting time for each post.  
    - Inputs: From "Loop Approved Posts".  
    - Outputs: To "Set Posting".  
    - Edge cases: Wait time miscalculation.

  - **Set Posting**  
    - Type: Google Sheets  
    - Role: Marks the post as "posting" or updates status before actual LinkedIn posting.  
    - Inputs: After wait node.  
    - Outputs: To "Download Image" for final posting process.  
    - Edge cases: Google Sheets update errors.

  - **Update User**  
    - Type: Telegram  
    - Role: Sends notification to a Telegram user about post status or updates.  
    - Inputs: From "Loop Approved Posts".  
    - Outputs: None.  
    - Edge cases: Telegram API failures, user not reachable.

---

#### 1.4 LinkedIn Posting Automation

- **Overview:**  
  Downloads any associated image, posts the content to LinkedIn, updates the Google Sheet with posting status, and loops back for the next approved post.

- **Nodes Involved:**  
  - Download Image (HTTP Request)  
  - Post LinkedIn (LinkedIn Node)  
  - Set Posted (Google Sheets)  
  - Loop Approved Posts (Split In Batches)

- **Node Details:**

  - **Download Image**  
    - Type: HTTP Request  
    - Role: Downloads image assets linked to posts for inclusion in LinkedIn posts.  
    - Config: URL comes from post data.  
    - Inputs: From "Set Posting".  
    - Outputs: To "Post LinkedIn".  
    - Edge cases: Broken URLs, download failures.

  - **Post LinkedIn**  
    - Type: LinkedIn  
    - Role: Publishes the post content and optional image on LinkedIn profile or page.  
    - Config: OAuth2 credentials for LinkedIn, post text, and image attachment.  
    - Inputs: From "Download Image".  
    - Outputs: To "Set Posted".  
    - Edge cases: LinkedIn API rate limits, auth failures.

  - **Set Posted**  
    - Type: Google Sheets  
    - Role: Updates the Google Sheet marking the post as posted, including timestamp.  
    - Inputs: From "Post LinkedIn".  
    - Outputs: Loops back to "Loop Approved Posts" for next item.  
    - Edge cases: Google Sheets API errors.

---

#### 1.5 Control and Flow Management

- **Overview:**  
  Various nodes such as split batches, switches, waits, and limits are distributed across the workflow to manage data flow, batch processing, timing delays, and conditional routing.

- **Nodes Involved:**  
  - Loop Tweets  
  - Switch  
  - Wait nodes (Wait, Wait1, Wait for Posting)  
  - Limit nodes (Limit, Max 20)  
  - NoOp nodes (Already Exists, Ignore; All Done, End)  
  - Aggregate  
  - Sticky Notes (non-functional notes)

- **Node Details:**  
  These nodes help regulate workflow logic, such as splitting data into manageable chunks, conditionally routing data, delaying steps to respect rate limits or scheduled times, and marking ends or skips in processing.

---

### 3. Summary Table

| Node Name            | Node Type                   | Functional Role                                | Input Node(s)          | Output Node(s)             | Sticky Note |
|----------------------|-----------------------------|-----------------------------------------------|------------------------|----------------------------|-------------|
| Sticky Note          | Sticky Note                 | Informational note                            |                        |                            |             |
| 5AM Everyday         | Schedule Trigger            | Triggers tweet fetching daily at 5 AM        |                        | Get AI Tweets              |             |
| Get AI Tweets        | HTTP Request               | Fetches AI-generated tweets                   | 5AM Everyday           | Clean Tweets               |             |
| Clean Tweets         | Code                       | Cleans and sanitizes tweet text               | Get AI Tweets          | Loop Tweets                |             |
| Loop Tweets          | Split In Batches           | Processes tweets in batches                    | Clean Tweets           | Find Existing Tweet, All Done, End |             |
| Find Existing Tweet  | Google Sheets              | Checks if tweet exists                         | Loop Tweets            | Switch                     |             |
| Switch               | Switch                     | Routes based on tweet existence                | Find Existing Tweet    | Wait, Already Exists, Ignore |             |
| Already Exists, Ignore | NoOp                      | Terminates processing for duplicates          | Switch                 | Loop Tweets                |             |
| Wait                 | Wait                       | Delays before saving new tweets                | Switch                 | Save New Tweet             |             |
| Save New Tweet       | Google Sheets              | Saves new tweets to sheet                      | Wait                   | Loop Tweets                |             |
| All Done, End        | NoOp                       | Marks end of tweet batch                        | Loop Tweets            |                            |             |
| 6AM Daily            | Schedule Trigger            | Triggers content processing at 6 AM            |                        | Google Sheets              |             |
| Google Sheets        | Google Sheets              | Reads stored tweets for AI processing          | 6AM Daily              | Limit                      |             |
| Limit                | Limit                      | Limits rows processed                           | Google Sheets          | AI Agent                   |             |
| AI Agent             | Langchain Agent            | Generates LinkedIn posts from tweets via GPT-4 | Limit                  | Loop Posts                 |             |
| 4.1                  | LM Chat Open Router        | Routes chat completions                         | AI Agent               | Structured Output Parser   |             |
| Structured Output Parser | Langchain Output Parser | Parses GPT-4 output                            | 4.1                    | AI Agent                   |             |
| Loop Posts           | Split In Batches           | Splits generated posts for aggregation         | AI Agent               | Aggregate, Wait1           |             |
| Aggregate            | Aggregate                  | Aggregates posts for notification               | Loop Posts             | Telegram                   |             |
| Telegram             | Telegram                   | Sends notifications                             | Aggregate              |                            |             |
| Sticky Note1         | Sticky Note                 | Informational note                             |                        |                            |             |
| Updated News         | Google Sheets Trigger      | Triggers on sheet update for approvals          |                        | Filter Approved            |             |
| Filter Approved      | Filter                     | Filters approved posts                          | Updated News           | Max 20                     |             |
| Max 20               | Limit                      | Limits number of posts for scheduling           | Filter Approved        | Get Post Timings           |             |
| Get Post Timings     | Code                       | Calculates posting schedule                      | Max 20                 | Loop Approved Posts        |             |
| Loop Approved Posts  | Split In Batches           | Processes approved posts individually            | Get Post Timings       | Update User, Wait for Posting |             |
| Wait for Posting     | Wait                       | Delays until scheduled posting time               | Loop Approved Posts    | Set Posting                |             |
| Set Posting          | Google Sheets              | Marks posts as "posting"                         | Wait for Posting       | Download Image             |             |
| Update User          | Telegram                   | Sends user notifications                         | Loop Approved Posts    |                            |             |
| Download Image       | HTTP Request               | Downloads image for LinkedIn posts                | Set Posting            | Post LinkedIn              |             |
| Post LinkedIn        | LinkedIn                   | Posts content on LinkedIn                          | Download Image         | Set Posted                 |             |
| Set Posted           | Google Sheets              | Marks posts as "posted"                            | Post LinkedIn          | Loop Approved Posts        |             |
| Sticky Note2         | Sticky Note                 | Informational note                             |                        |                            |             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the 5AM Everyday Schedule Trigger** node to trigger daily at 5 AM.

2. **Add an HTTP Request node named "Get AI Tweets"** to fetch AI-generated tweets. Configure it with the external API URL and authentication.

3. **Add a Code node named "Clean Tweets"** to sanitize and prepare tweet text. Paste or write JavaScript code to clean tweet data as desired.

4. **Add a Split In Batches node named "Loop Tweets"** to process tweets one-by-one or in small batches.

5. **Add a Google Sheets node named "Find Existing Tweet"** configured to read your tweets tracking sheet and check if the current tweet exists by matching tweet ID or content.

6. **Add a Switch node named "Switch"** with a condition that checks existence of the tweet in the sheet:
   - If exists, route to a NoOp node "Already Exists, Ignore"
   - If new, route to a Wait node "Wait"

7. **Add the "Already Exists, Ignore" NoOp node**, outputting back to "Loop Tweets" for next item.

8. **Add the "Wait" node** to delay processing (configure webhook ID and wait duration as needed).

9. **Add a Google Sheets node "Save New Tweet"** configured to append new tweets to the sheet.

10. **Connect "Save New Tweet" back to "Loop Tweets"** to continue processing.

11. **Add a NoOp node "All Done, End"** connected to "Loop Tweets" for when all tweets are processed.

12. **Create the 6AM Daily Schedule Trigger** node to trigger daily at 6 AM.

13. **Add a Google Sheets node "Google Sheets"** to read tweets or data for AI processing.

14. **Add a Limit node "Limit"** to cap processing at a manageable number per run.

15. **Add an AI Agent node "AI Agent"** configured with Langchain and OpenAI GPT-4 credentials to generate LinkedIn posts from tweets.

16. **Add a LM Chat Open Router node "4.1"** connected to AI Agent for managing chat completions.

17. **Add a Structured Output Parser node** to convert AI responses into structured data.

18. **Connect the Structured Output Parser back to AI Agent** if iterative processing is required.

19. **Add a Split In Batches node "Loop Posts"** to batch generated posts.

20. **Add an Aggregate node** to combine posts for notifications.

21. **Add a Telegram node** to notify users about new AI-generated posts.

22. **Add a Google Sheets Trigger node "Updated News"** to listen for approval status changes in the sheet.

23. **Add a Filter node "Filter Approved"** to select only posts marked approved.

24. **Add a Limit node "Max 20"** to limit number of posts scheduled per batch.

25. **Add a Code node "Get Post Timings"** to calculate posting times.

26. **Add a Split In Batches node "Loop Approved Posts"** to process each approved post.

27. **Add a Telegram node "Update User"** to notify users about individual post statuses.

28. **Add a Wait node "Wait for Posting"** to delay until scheduled posting time.

29. **Add a Google Sheets node "Set Posting"** to mark posts as being posted.

30. **Add an HTTP Request node "Download Image"** to fetch images for posts.

31. **Add a LinkedIn node "Post LinkedIn"** configured with OAuth2 credentials to post content.

32. **Add a Google Sheets node "Set Posted"** to mark posts as posted.

33. **Loop "Set Posted" back to "Loop Approved Posts"** to continue processing posts.

34. **Throughout, add supporting NoOp nodes and Sticky Notes as needed** for flow control and documentation.

35. **Configure credentials:**
    - Google Sheets: OAuth2 or API key with read/write access.
    - OpenAI GPT-4 via Langchain: API key configured in AI Agent and LM Chat nodes.
    - LinkedIn OAuth2 credentials for posting.
    - Telegram Bot API token for notifications.

36. **Test each block independently** before running the full workflow.

---

### 5. General Notes & Resources

| Note Content                                                                                       | Context or Link                                                                                      |
|--------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| Workflow automates repurposing AI-generated tweets into LinkedIn posts using GPT-4 and Google Sheets. | Workflow purpose summary.                                                                           |
| Uses Langchain integration for AI processing within n8n.                                         | Langchain nodes require n8n v1.9+ and proper OpenAI credentials.                                    |
| Telegram notifications help monitor workflow progress and posting status.                        | Telegram node requires bot token and chat ID.                                                     |
| Google Sheets is central for data storage and status tracking.                                   | Ensure sheets have correct columns for tweets, approval, posting status, and timestamps.           |
| LinkedIn node requires OAuth2 authentication with sufficient permissions to post content.        | LinkedIn API limits and posting policies should be considered.                                     |
| Rate limits and API quotas (OpenAI, LinkedIn, Google Sheets) are critical considerations.        | Use Wait nodes and Limit nodes to avoid hitting limits.                                            |
| For detailed AI prompt design and output schemas, customize Langchain prompt templates accordingly. | Refer to Langchain documentation for advanced AI prompt engineering.                               |

---

This documentation provides a full understanding and stepwise decomposition of the workflow, facilitating maintenance, customization, and troubleshooting for advanced users and automation agents alike.