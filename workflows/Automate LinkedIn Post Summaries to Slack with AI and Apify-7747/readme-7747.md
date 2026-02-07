Automate LinkedIn Post Summaries to Slack with AI and Apify

https://n8nworkflows.xyz/workflows/automate-linkedin-post-summaries-to-slack-with-ai-and-apify-7747


# Automate LinkedIn Post Summaries to Slack with AI and Apify

### 1. Workflow Overview

This workflow automates the process of summarizing LinkedIn posts from specified profiles and delivering a concise weekly digest to a Slack channel. It is designed for teams or individuals who want to monitor LinkedIn activity efficiently without manual scrolling.

The primary use case is to fetch recent LinkedIn posts from a list of profiles, summarize them in an actionable, digestible format using AI, and distribute the summary in Slack weekly.

The workflow is logically divided into the following blocks:

- **1.1 Scheduled Trigger & Profile Input:** Initiates the workflow weekly and retrieves LinkedIn profile URLs from Google Sheets.
- **1.2 LinkedIn Data Collection:** Uses Apify API to scrape recent LinkedIn posts for each profile.
- **1.3 Data Processing & Summarization:** Cleans, batches, and sends the posts to OpenAI for summarization.
- **1.4 Markdown Digest Construction:** Aggregates AI summaries into a formatted markdown digest.
- **1.5 Slack Message Preparation & Delivery:** Splits the digest to fit Slack limits, posts it, and sends a thread message listing source links.
- **1.6 Supporting Utilities:** Includes auxiliary code nodes for date extraction, markdown stripping, and batch processing.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Trigger & Profile Input

**Overview:**  
This block triggers the workflow every Sunday at 09:00 Africa/Cairo time and reads LinkedIn profile URLs from a Google Sheet to process.

**Nodes Involved:**  
- Start: Weekly Cron  
- Read Profiles from Google Sheets  
- Loop Over Items1 (splitInBatches)

**Node Details:**

- **Start: Weekly Cron**  
  - Type: Cron Trigger  
  - Configuration: Runs weekly Sunday 09:00 (Africa/Cairo timezone).  
  - Inputs: None (trigger node).  
  - Outputs: Triggers "Read Profiles from Google Sheets".  
  - Edge Cases: Timezone misconfiguration may cause unexpected trigger times.

- **Read Profiles from Google Sheets**  
  - Type: Google Sheets node  
  - Configuration: Reads from the first sheet (`gid=0`) of a specified Google Sheets document. Uses OAuth2 credentials for authentication.  
  - Key Parameters: Expects a column named `profileUrl` containing LinkedIn profile URLs.  
  - Inputs: Trigger from Cron node.  
  - Outputs: Passes profile data to "Loop Over Items1".  
  - Edge Cases: Missing or malformed profile URLs, credential expiry, API quota limits.

- **Loop Over Items1**  
  - Type: SplitInBatches  
  - Configuration: Batches size set to 5 (customizable). Allows paging through profiles in manageable chunks.  
  - Inputs: Profiles array from Google Sheets node.  
  - Outputs: Each batch triggers the Apify scraper for profiles in that batch.  
  - Edge Cases: Batch size too large may cause API rate limits; too small reduces efficiency.

---

#### 2.2 LinkedIn Data Collection

**Overview:**  
Fetches LinkedIn posts for each profile in batches using the Apify scraping API, filtering posts to the last 7 days and selecting only regular post types.

**Nodes Involved:**  
- Apify: Start Scraper  
- Batch (processing the scraped posts)

**Node Details:**

- **Apify: Start Scraper**  
  - Type: HTTP Request  
  - Configuration: POST request to Apify actor `apimaestro~linkedin-profile-posts` with JSON body including username (profile URL), paging, and filters.  
  - Key Parameters:  
    - API token injected via `{{YOUR_API_TOKEN}}`.  
    - Filters to include only posts from the last 7 days (`extendOutputFunction` JS embedded in JSON).  
    - Request limits 3 posts per page, max 20 items, post type "regular".  
  - Inputs: Receives profile URLs from Loop Over Items1 batches.  
  - Outputs: Passes post data to "Batch" node for further processing.  
  - Edge Cases:  
    - Invalid or expired Apify token.  
    - Profiles with no posts or private profiles.  
    - Network timeouts or API rate limits.

- **Batch**  
  - Type: Code  
  - Configuration: Aggregates posts, finds min/max dates, groups posts by author, and prepares a human-readable digest snippet with reaction/comment stats.  
  - Inputs: Raw post data from Apify.  
  - Outputs: Digest text for next cleaning step.  
  - Edge Cases: Posts missing expected fields, empty post arrays.

---

#### 2.3 Data Processing & Summarization

**Overview:**  
This block cleans markdown artifacts, extracts date information, and summarizes each post using OpenAI’s GPT model into concise bullet points.

**Nodes Involved:**  
- Strip Markdown  
- Date Extract  
- Message a model (OpenAI GPT summarizer)

**Node Details:**

- **Strip Markdown**  
  - Type: Code  
  - Configuration: Removes markdown headers, links, escaped quotes, and extra newlines from the digest text to produce plain text.  
  - Inputs: Digest text from "Batch".  
  - Outputs: Clean text passed to "Date Extract".  
  - Edge Cases: Unexpected markdown formats may leave residual artifacts.

- **Date Extract**  
  - Type: Code  
  - Configuration: Extracts the date string from the digest header using regex and removes the dated header from text. Defaults to current date if not found.  
  - Inputs: Clean text from "Strip Markdown".  
  - Outputs: Text and extracted date for OpenAI summarization input.  
  - Edge Cases: Missing or corrupted date header.

- **Message a model**  
  - Type: OpenAI (LangChain)  
  - Configuration: Uses GPT-5-mini with a system prompt instructing it to summarize each LinkedIn post into 2–3 bullet points, ≤15 words each, with constraints on format and length (max 500 words total).  
  - Key Expressions: Inputs text and date dynamically for context.  
  - Inputs: Text and date from "Date Extract".  
  - Outputs: AI-generated summaries per post.  
  - Credentials: OpenAI API key required.  
  - Edge Cases: API quota limits, rate limiting, or response timeouts, malformed input text.

---

#### 2.4 Markdown Digest Construction

**Overview:**  
Groups AI summaries by author/profile and formats them into a markdown digest document with headings and links.

**Nodes Involved:**  
- Build Markdown Digest  
- Code (splits digest for Slack message size limits)

**Node Details:**

- **Build Markdown Digest**  
  - Type: Code  
  - Configuration: Groups items by profile or author, formats a markdown digest with headings, numbered posts, and links. Truncates digest if exceeding ~3800 characters to fit Slack limits.  
  - Inputs: Items from "Message a model".  
  - Outputs: Single JSON with markdown string.  
  - Edge Cases: Large digests truncated, potential loss of data if too big.

- **Code**  
  - Type: Code  
  - Configuration: Splits markdown digest into chunks safely under 35,000 characters each for Slack posting, preserving section separators, splitting on newlines if necessary.  
  - Inputs: Markdown digest from "Build Markdown Digest".  
  - Outputs: Multiple items each representing a chunk to post separately.  
  - Edge Cases: Very large digests split unevenly, potential off-by-one chunking issues.

---

#### 2.5 Slack Message Preparation & Delivery

**Overview:**  
Posts the digest chunks sequentially to Slack, then sends a follow-up thread message containing source links for traceability.

**Nodes Involved:**  
- LinkedIn Digest (Slack)  
- Source Links (code)  
- Threads Messaging (Slack)

**Node Details:**

- **LinkedIn Digest**  
  - Type: Slack node  
  - Configuration: Posts each chunk of the digest with header "LinkedIn Digest (part x/y)". Posts to a specified Slack channel using Slack API credentials.  
  - Inputs: Chunked digest parts from "Code".  
  - Outputs: Passes message timestamp to thread message node.  
  - Edge Cases: Slack API rate limits, channel permission errors, message length restrictions.

- **Source Links**  
  - Type: Code  
  - Configuration: Extracts URLs from the original scraped LinkedIn posts (from Apify node) to create a Slack-friendly summary list of source post links.  
  - Inputs: Full scrape data from "LinkedIn Digest".  
  - Outputs: A single message text listing all source links.  
  - Edge Cases: Missing or malformed URLs.

- **Threads Messaging**  
  - Type: Slack node  
  - Configuration: Posts the source links message as a threaded reply to the initial digest message in Slack. Uses the timestamp from the digest message to thread properly.  
  - Inputs: Source links text from "Source Links".  
  - Outputs: None (final node).  
  - Edge Cases: Threading fails if timestamp unavailable, Slack permission issues.

---

#### 2.6 Supporting Utilities

**Overview:**  
Contains a sticky note describing workflow purpose, setup instructions, and benefits.

**Nodes Involved:**  
- Sticky Note

**Node Details:**

- **Sticky Note**  
  - Type: Sticky Note  
  - Content: Describes workflow title, functional description, setup instructions for Google Sheets, Apify, OpenAI, Slack credentials, and workflow benefits.  
  - Position: Off the main flow, informational only.

---

### 3. Summary Table

| Node Name               | Node Type                    | Functional Role                         | Input Node(s)                  | Output Node(s)              | Sticky Note                                                                                   |
|-------------------------|------------------------------|---------------------------------------|-------------------------------|-----------------------------|----------------------------------------------------------------------------------------------|
| Start: Weekly Cron       | Cron Trigger                 | Triggers workflow weekly               | None                          | Read Profiles from Google Sheets | Runs every Sunday 09:00 Africa/Cairo                                                        |
| Read Profiles from Google Sheets | Google Sheets           | Reads LinkedIn profiles from sheet    | Start: Weekly Cron             | Loop Over Items1             | Requires Google Sheets OAuth2 credential                                                     |
| Loop Over Items1         | SplitInBatches               | Batches profiles for scraping          | Read Profiles from Google Sheets | Apify: Start Scraper (batch 1) | Batch size customizable                                                                      |
| Apify: Start Scraper     | HTTP Request                 | Scrapes LinkedIn posts from profiles  | Loop Over Items1               | Batch                       | Requires Apify API token                                                                     |
| Batch                   | Code                         | Groups posts by author and creates digest snippet | Apify: Start Scraper           | Strip Markdown              |                                                                                              |
| Strip Markdown           | Code                         | Cleans markdown artifacts from digest | Batch                         | Date Extract                |                                                                                              |
| Date Extract             | Code                         | Extracts date from digest header       | Strip Markdown                | Message a model             |                                                                                              |
| Message a model          | OpenAI (LangChain)           | Summarizes posts into bullet points    | Date Extract                  | Build Markdown Digest       | Uses GPT-5-mini; requires OpenAI API key                                                    |
| Build Markdown Digest    | Code                         | Aggregates summaries into markdown digest | Message a model               | Code                       | Truncates digest if too long                                                                |
| Code                    | Code                         | Splits digest into Slack-safe chunks  | Build Markdown Digest          | LinkedIn Digest             |                                                                                              |
| LinkedIn Digest          | Slack                        | Posts digest chunks to Slack channel   | Code                         | Source Links                | Posts to specified Slack channel; uses Slack API credentials                                |
| Source Links             | Code                         | Extracts and formats post source URLs  | LinkedIn Digest               | Threads Messaging           |                                                                                              |
| Threads Messaging        | Slack                        | Posts source links in Slack thread     | Source Links                  | Loop Over Items1            | Threads message to original digest post                                                     |
| Sticky Note             | Sticky Note                  | Documentation and setup instructions   | None                         | None                       | Detailed workflow description and setup instructions                                        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Cron node named "Start: Weekly Cron"**  
   - Set trigger to weekly on Sunday at 09:00.  
   - Set timezone to Africa/Cairo.

2. **Add Google Sheets node "Read Profiles from Google Sheets"**  
   - Connect from Cron node.  
   - Configure to read from your Google Sheets document containing LinkedIn profile URLs.  
   - Use OAuth2 credentials for Google Sheets.  
   - Target sheet with `gid=0`. Ensure column `profileUrl` exists.

3. **Add SplitInBatches node "Loop Over Items1"**  
   - Connect from Google Sheets node.  
   - Set batch size to 5 (adjustable).  
   - This will loop through profiles in manageable sets.

4. **Add HTTP Request node "Apify: Start Scraper"**  
   - Connect from the second output (batch) of "Loop Over Items1".  
   - Configure POST request to:  
     `https://api.apify.com/v2/acts/apimaestro~linkedin-profile-posts/run-sync-get-dataset-items?token=apify_api_<YOUR_API_TOKEN>`  
   - In JSON body, pass username as `{{ $json.profileUrl }}` and set filters: limit 3 posts, maxItems 20, postType "regular", include reactions and shares, exclude comments.  
   - Include `extendOutputFunction` JS to filter posts within last 7 days based on timestamps.  
   - Use your Apify API token in URL.

5. **Add Code node "Batch"**  
   - Connect from Apify node.  
   - Use code to group posts by author, find min/max dates, and generate digest snippets with reaction stats.

6. **Add Code node "Strip Markdown"**  
   - Connect from "Batch".  
   - Use code to remove markdown headers, links, escaped quotes, and extra newlines.

7. **Add Code node "Date Extract"**  
   - Connect from "Strip Markdown".  
   - Use regex to extract date from digest header and remove it from text.

8. **Add OpenAI node "Message a model"**  
   - Connect from "Date Extract".  
   - Use LangChain OpenAI node with GPT-5-mini model.  
   - Provide system prompt requiring 2–3 bullet points per post, ≤15 words each, total digest ≤500 words.  
   - Pass extracted date and cleaned text as input messages.  
   - Use your OpenAI API credential.

9. **Add Code node "Build Markdown Digest"**  
   - Connect from OpenAI node.  
   - Aggregate AI summaries by profile/author and format as markdown digest.  
   - Truncate to ~3800 characters if too long.

10. **Add Code node "Code"**  
    - Connect from "Build Markdown Digest".  
    - Split markdown digest into chunks less than 35,000 characters for Slack.

11. **Add Slack node "LinkedIn Digest"**  
    - Connect from "Code".  
    - Configure to post message text with header "LinkedIn Digest (part x/y)".  
    - Set Slack channel ID (replace `TARGET_SLACK_CHANNEL`).  
    - Use Slack API credential with `chat:write` permission.

12. **Add Code node "Source Links"**  
    - Connect from "LinkedIn Digest".  
    - Extract URLs from original Apify scrape data to list source posts.  
    - Format as Slack message listing links.

13. **Add Slack node "Threads Messaging"**  
    - Connect from "Source Links".  
    - Post the source links message as a threaded reply to the initial digest message using Slack message timestamp.  
    - Use same Slack channel and credentials.

14. **Add Sticky Note node** (optional)  
    - Document workflow purpose, setup instructions for Google Sheets, Apify, OpenAI, and Slack.  
    - Provide setup tips and benefits.

---

### 5. General Notes & Resources

| Note Content                                                                                                                    | Context or Link                                                  |
|---------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------|
| This workflow automatically summarizes LinkedIn posts weekly and posts a digest to Slack, saving manual effort and boosting team insights. | Workflow purpose and benefits (Sticky Note node).               |
| Setup requires Google Sheets OAuth2 credentials, Apify API token, OpenAI API key, and Slack API credentials with chat:write scope. | Credential setup instructions (Sticky Note node).               |
| Apify actor used: `apimaestro~linkedin-profile-posts` for LinkedIn posts scraping.                                              | API integration details.                                        |
| OpenAI summarization uses GPT-5-mini model with strict formatting prompts for concise bullet points.                            | AI model and prompt design best practices.                      |
| Slack messages are split to avoid hitting character limits and source links are posted as threaded messages for traceability.  | Slack API message length constraints and threading usage.       |
| Slack channel ID and credentials must be configured carefully; ensure bot has permission and is a member of the channel.        | Slack API integration notes.                                    |
| Google Sheets document must have a `profileUrl` column with valid LinkedIn profile URLs.                                         | Input data format requirement.                                  |

---

This documentation enables advanced users or automation agents to understand, reproduce, or modify the workflow step-by-step, anticipate errors, and manage integrations effectively.

---

**Disclaimer:** The provided text is exclusively extracted from an n8n automated workflow. It complies fully with applicable content policies and contains no illegal or offensive elements. All handled data is legal and publicly accessible.