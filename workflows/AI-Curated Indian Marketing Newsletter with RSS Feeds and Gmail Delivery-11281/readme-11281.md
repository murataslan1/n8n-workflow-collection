AI-Curated Indian Marketing Newsletter with RSS Feeds and Gmail Delivery

https://n8nworkflows.xyz/workflows/ai-curated-indian-marketing-newsletter-with-rss-feeds-and-gmail-delivery-11281


# AI-Curated Indian Marketing Newsletter with RSS Feeds and Gmail Delivery

### 1. Workflow Overview

This workflow automates the creation and delivery of a daily curated marketing newsletter focused on Indian brand and campaign news. It fetches the latest articles from multiple RSS feeds related to marketing and advertising, uses an AI agent to filter articles by strict relevance criteria, stores the filtered results in a Data Table, formats the curated list into an HTML newsletter, and sends it by email via Gmail or SMTP. After sending, it cleans up the stored entries to avoid duplicates in future newsletters.

The workflow is organized into the following logical blocks:

- **1.1 Scheduled RSS Feed Retrieval:** Triggers daily at 7:30 PM IST to fetch articles from four specified RSS feeds.
- **1.2 RSS Feed Merging:** Combines the multiple feeds into a single unified list of articles.
- **1.3 AI-Based Relevance Filtering Loop:** Iterates over each article, sending it to an AI agent that returns a strict true/false relevance flag based on marketing-specific criteria.
- **1.4 Data Persistence:** Inserts filtered articles into a Data Table for temporary storage.
- **1.5 Newsletter Composition:** Retrieves stored articles and formats them into an HTML email body with subject line using a Code node.
- **1.6 Email Delivery:** Sends the newsletter email using Gmail OAuth2 or fallback SMTP credentials.
- **1.7 Cleanup:** Deletes all filtered articles from the Data Table after successful email delivery to prepare for the next cycle.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled RSS Feed Retrieval

- **Overview:**  
  This block initiates the workflow on a daily schedule at 7:30 PM IST and fetches the latest marketing-related news articles from four RSS feed sources.

- **Nodes Involved:**  
  - Schedule Trigger  
  - EconomicTimes Top Stories1 (RSS Feed)  
  - EconomicTimes Business of Brands (RSS Feed)  
  - EconomicTimes Digital Marketing (RSS Feed)  
  - Campaign India (RSS Feed)

- **Node Details:**

  - **Schedule Trigger**  
    - Type: Schedule Trigger  
    - Role: Starts workflow daily at 19:30 IST via a cron expression ("30 19 * * *").  
    - Configuration: Cron expression set for 7:30 PM daily.  
    - Connections: Outputs trigger to all four RSS Feed nodes in parallel.  
    - Edge Cases: Cron misconfiguration, server time zone mismatches.

  - **EconomicTimes Top Stories1**  
    - Type: RSS Feed Read  
    - Role: Fetches top stories from ET Brand Equity RSS feed.  
    - Configuration: URL set to "https://brandequity.economictimes.indiatimes.com/rss/topstories".  
    - onError: Continue on error to prevent workflow failure if feed is unreachable.  
    - Output: Array of feed items.  
    - Edge Cases: Network errors, feed changes, invalid XML, SSL errors.

  - **EconomicTimes Business of Brands**  
    - Type: RSS Feed Read  
    - Role: Fetches business of brands stories from ET feed.  
    - Configuration: URL "https://brandequity.economictimes.indiatimes.com/rss/business-of-brands".  
    - Same error handling as above.

  - **EconomicTimes Digital Marketing**  
    - Type: RSS Feed Read  
    - Role: Fetches digital marketing news from ET feed.  
    - Configuration: URL "https://brandequity.economictimes.indiatimes.com/rss/digital".  
    - Same error handling as above.

  - **Campaign India**  
    - Type: RSS Feed Read  
    - Role: Fetches marketing news from Campaign India RSS feed.  
    - Configuration: URL "https://www.campaignindia.in/rss/rss.ashx".  
    - Error handling: Continue on error.

#### 1.2 RSS Feed Merging

- **Overview:**  
  Combines the four RSS feeds fetched into one consolidated list.

- **Nodes Involved:**  
  - Merge Feeds-1  
  - Merge Feeds-2  
  - Merge Feeds-All

- **Node Details:**

  - **Merge Feeds-1**  
    - Type: Merge  
    - Role: Combines "Campaign India" feed with "EconomicTimes Top Stories1".  
    - Configuration: Default merge mode.  
    - Input: Two feeds.  
    - Output: Combined feed array.

  - **Merge Feeds-2**  
    - Type: Merge  
    - Role: Combines "EconomicTimes Business of Brands" with "EconomicTimes Digital Marketing".  
    - Configuration: Default merge mode.

  - **Merge Feeds-All**  
    - Type: Merge  
    - Role: Final merge of the two merged results above into one unified feed list.  
    - Output: Single combined array of all articles.

#### 1.3 AI-Based Relevance Filtering Loop

- **Overview:**  
  Iterates over each article from the merged feed, uses an AI agent to filter articles based on strict marketing relevance rules, and routes filtered articles for storage.

- **Nodes Involved:**  
  - Loop Over Items (SplitInBatches)  
  - AI Agent (Langchain Agent)  
  - Merge  
  - If  
  - Insert row (Data Table)

- **Node Details:**

  - **Loop Over Items**  
    - Type: SplitInBatches  
    - Role: Processes articles one by one or in small batches to avoid overload.  
    - Configuration: Default batch size, reset option disabled.  
    - Input: Merged list of articles.  
    - Output: Single article per iteration.

  - **AI Agent**  
    - Type: Langchain Agent  
    - Role: Evaluates article relevance strictly according to prompt instructions.  
    - Configuration:  
      - Prompt instructs agent to reply only "true" or "false". No explanation or punctuation.  
      - Relevant topics: brand/product launches, marketing campaigns, digital media changes.  
      - Input variables: article title, content, snippet.  
    - Output: Single boolean string ("true" or "false").  
    - Edge Cases: AI service timeouts, prompt errors, unexpected responses.

  - **Merge**  
    - Type: Merge  
    - Role: Combines AI agent output with original article data by position for conditional processing.

  - **If**  
    - Type: If  
    - Role: Checks if AI agent’s output is "true" (article relevant).  
    - Configuration: String contains "true" condition on AI agent output.  
    - Outputs:  
      - True branch: passes article for storage.  
      - False branch: loops back for processing next article.

  - **Insert row**  
    - Type: Data Table Insert Row  
    - Role: Stores relevant articles in the Data Table with all metadata including AI output.  
    - Configuration: Maps all article fields (Guid, Link, Title, Content, IsoDate, PubDate, ContentSnippet, Output).  
    - Edge Cases: Data Table connection errors, schema mismatches.

#### 1.4 Data Persistence

- **Overview:**  
  Holds filtered articles in a structured Data Table to accumulate daily relevant news.

- **Nodes Involved:**  
  - Insert row (covered above)  
  - Get row(s)  
  - Limit

- **Node Details:**

  - **Get row(s)**  
    - Type: Data Table Get Rows  
    - Role: Retrieves up to 30 stored articles from the Data Table to prepare for newsletter composition.  
    - Configuration: Limit set to 30 rows to restrict volume.  
    - Edge Cases: Empty table, retrieval failures.

  - **Limit**  
    - Type: Limit  
    - Role: Ensures that downstream nodes receive a controlled number of items.  
    - Configuration: Default (no explicit limit set beyond Data Table limit).  

#### 1.5 Newsletter Composition

- **Overview:**  
  Formats stored articles into a visually appealing HTML newsletter with subject line using JavaScript code.

- **Nodes Involved:**  
  - Code

- **Node Details:**

  - **Code**  
    - Type: Code (JavaScript)  
    - Role: Constructs newsletter HTML body and subject line dynamically.  
    - Configuration highlights:  
      - Uses "Asia/Kolkata" timezone for current date/time formatting.  
      - Iterates over articles, builds styled HTML blocks with title (linked), publish date formatted as "day month year", and content snippet.  
      - Wraps article blocks in a container with heading and footer note.  
      - Outputs JSON with `subject` and `htmlBody` keys for email nodes.  
    - Edge Cases: Date formatting issues, empty article list output.

#### 1.6 Email Delivery

- **Overview:**  
  Sends the composed newsletter email using Gmail OAuth2 first, then fallback SMTP if needed.

- **Nodes Involved:**  
  - Send a message (Gmail)  
  - Send Email (SMTP)

- **Node Details:**

  - **Send a message**  
    - Type: Gmail Node  
    - Role: Sends email with subject and HTML body from Code node.  
    - Configuration:  
      - Recipient email set to "your-email@gmail.com" (to be customized).  
      - Credentials: Gmail OAuth2 with stored credentials.  
    - onError: Continues on error to allow SMTP fallback.  
    - Edge Cases: Gmail API rate limits, OAuth token expiry, permission issues.

  - **Send Email**  
    - Type: Email Send (SMTP)  
    - Role: Fallback SMTP email sender with same subject and HTML body.  
    - Configuration:  
      - Recipient: "your-email@domain.com" (customizable).  
      - From email: "smtp-email@domain.com" (customizable).  
      - Credentials: SMTP credentials stored in n8n.  
    - onError: Continues on error but ideally email sends successfully.  
    - Edge Cases: SMTP authentication failures, relay restrictions, network failures.

#### 1.7 Cleanup

- **Overview:**  
  Deletes all Data Table rows where the AI output was "true" after email sending to avoid duplicate newsletter entries in future runs.

- **Nodes Involved:**  
  - Delete row(s)

- **Node Details:**

  - **Delete row(s)**  
    - Type: Data Table Delete Rows  
    - Role: Deletes all rows with `Output = "true"` in the Data Table after newsletter dispatch.  
    - Configuration: Filter condition on "Output" column equals "true".  
    - Edge Cases: Deletion failure, partial cleanup, concurrent access issues.

---

### 3. Summary Table

| Node Name                  | Node Type                        | Functional Role                              | Input Node(s)                         | Output Node(s)                     | Sticky Note                                                          |
|----------------------------|---------------------------------|----------------------------------------------|-------------------------------------|-----------------------------------|----------------------------------------------------------------------|
| Schedule Trigger           | Schedule Trigger                | Starts workflow daily at 7:30 PM IST          | -                                   | EconomicTimes Top Stories1, EconomicTimes Business of Brands, EconomicTimes Digital Marketing, Campaign India |                                                                      |
| EconomicTimes Top Stories1 | RSS Feed Read                  | Fetches ET Brand Equity top stories           | Schedule Trigger                    | Merge Feeds-1                     |                                                                      |
| EconomicTimes Business of Brands | RSS Feed Read             | Fetches ET Business of Brands feed             | Schedule Trigger                    | Merge Feeds-2                     |                                                                      |
| EconomicTimes Digital Marketing | RSS Feed Read              | Fetches ET Digital Marketing feed              | Schedule Trigger                    | Merge Feeds-2                     |                                                                      |
| Campaign India             | RSS Feed Read                  | Fetches Campaign India marketing news          | Schedule Trigger                    | Merge Feeds-1                     |                                                                      |
| Merge Feeds-1             | Merge                         | Combines Campaign India and ET Top Stories     | Campaign India, EconomicTimes Top Stories1 | Merge Feeds-All              | "## Merge all\n**Combines all RSS feeds into one list.**"           |
| Merge Feeds-2             | Merge                         | Combines ET Business of Brands and Digital feeds | EconomicTimes Business of Brands, EconomicTimes Digital Marketing | Merge Feeds-All              | "## Merge all\n**Combines all RSS feeds into one list.**"           |
| Merge Feeds-All           | Merge                         | Combines all feeds into one unified list       | Merge Feeds-1, Merge Feeds-2        | Loop Over Items                  | "## Merge all\n**Combines all RSS feeds into one list.**"           |
| Loop Over Items           | SplitInBatches                | Iterates over each article for AI processing   | Merge Feeds-All                    | Limit, AI Agent, Merge           | "## Process AND LOOP-OVER All News Items\nEach article is passed to the AI Agent.\nThe agent returns true/false based on strict marketing relevance rules (System Prompt).\nModify the prompt in AI Agent if you want different filtering criteria." |
| Limit                     | Limit                         | Controls number of items processed downstream  | Loop Over Items                    | Get row(s)                      |                                                                      |
| AI Agent                  | Langchain Agent               | Filters articles by relevance using AI prompt | Loop Over Items                    | Merge                           |                                                                      |
| Merge                     | Merge                         | Combines AI output with original article data  | AI Agent, Loop Over Items          | If                             |                                                                      |
| If                        | If                            | Routes articles based on AI relevance "true"   | Merge                            | Insert row (true), Loop Over Items (false) |                                                                      |
| Insert row                | Data Table Insert Row         | Stores relevant articles in Data Table          | If (true)                        | Loop Over Items                  |                                                                      |
| Get row(s)                | Data Table Get Rows           | Retrieves stored articles for newsletter        | Limit                           | Code                           |                                                                      |
| Code                      | Code (JavaScript)             | Builds HTML newsletter and subject line         | Get row(s)                     | Send a message                  | "## Send Filtered News Using Gmail/SMTP Account\nThese nodes creates a polished HTML newsletter using the latest filtered articles from the Data Table.\nThe Code node formats the content with titles, links, publish dates, and snippets, producing the final subject and HTML body used for sending.\nAfter the email is sent, the workflow deletes all Data Table rows where Output = true." |
| Send a message            | Gmail                         | Sends newsletter email via Gmail OAuth2         | Code                           | Delete row(s), Send Email       | "## Send Filtered News Using Gmail/SMTP Account\nThese nodes creates a polished HTML newsletter using the latest filtered articles from the Data Table.\nThe Code node formats the content with titles, links, publish dates, and snippets, producing the final subject and HTML body used for sending.\nAfter the email is sent, the workflow deletes all Data Table rows where Output = true." |
| Send Email                | Email Send (SMTP)             | Fallback SMTP email sender                        | Send a message                 | Delete row(s)                  | "## Send Filtered News Using Gmail/SMTP Account\nThese nodes creates a polished HTML newsletter using the latest filtered articles from the Data Table.\nThe Code node formats the content with titles, links, publish dates, and snippets, producing the final subject and HTML body used for sending.\nAfter the email is sent, the workflow deletes all Data Table rows where Output = true." |
| Delete row(s)             | Data Table Delete Rows        | Deletes sent articles from Data Table            | Send a message, Send Email       | -                             | "## Send Filtered News Using Gmail/SMTP Account\nThese nodes creates a polished HTML newsletter using the latest filtered articles from the Data Table.\nThe Code node formats the content with titles, links, publish dates, and snippets, producing the final subject and HTML body used for sending.\nAfter the email is sent, the workflow deletes all Data Table rows where Output = true." |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**  
   - Type: Schedule Trigger  
   - Set Cron Expression to `30 19 * * *` to run daily at 7:30 PM IST.

2. **Add RSS Feed Read Nodes (4 total)**  
   - For each RSS feed:  
     - EconomicTimes Top Stories1: URL `https://brandequity.economictimes.indiatimes.com/rss/topstories`  
     - EconomicTimes Business of Brands: URL `https://brandequity.economictimes.indiatimes.com/rss/business-of-brands`  
     - EconomicTimes Digital Marketing: URL `https://brandequity.economictimes.indiatimes.com/rss/digital`  
     - Campaign India: URL `https://www.campaignindia.in/rss/rss.ashx`  
   - Set `onError` to continue on error for robustness.  
   - Connect Schedule Trigger to all four RSS nodes.

3. **Add Merge Nodes to Combine Feeds**  
   - Merge Feeds-1: merge Campaign India and EconomicTimes Top Stories1 (default mode).  
   - Merge Feeds-2: merge EconomicTimes Business of Brands and EconomicTimes Digital Marketing (default mode).  
   - Merge Feeds-All: merge Merge Feeds-1 and Merge Feeds-2 (default mode).  
   - Connect RSS nodes accordingly.

4. **Add SplitInBatches Node (Loop Over Items)**  
   - Connect Merge Feeds-All output to SplitInBatches.  
   - Use default batch size and disable reset.

5. **Add AI Agent Node**  
   - Type: Langchain Agent  
   - Configure prompt as:  
     ```
     You are a strict relevance filter for news articles.

     INSTRUCTIONS:
     - Reply only with: true or false
     - No explanations, no punctuation, no newlines, no extra text

     RELEVANT TOPICS:
     - Brand or product launches
     - New or upcoming advertising/marketing campaigns
     - Digital media changes (strategies, platforms, or tools)

     Evaluate the following article:

     Title: {{ $json.title }}
     Content: {{ $json.content }}
     Snippet: {{ $json.contentSnippet }}

     Is this article relevant? Respond with true or false only.
     ```
   - Connect Loop Over Items to AI Agent.

6. **Add Merge Node**  
   - Combine AI Agent output with original article data by position.

7. **Add If Node**  
   - Condition: Check if AI agent output string contains "true".  
   - True branch connects to Insert row node to store relevant articles.  
   - False branch loops back to Loop Over Items to process next article.

8. **Add Data Table Insert Row Node**  
   - Create a Data Table named e.g. "Newsletter" with fields: Guid, Link, Title, Output, Content, IsoDate, PubDate, ContentSnippet.  
   - Map article fields and AI output to corresponding columns.  
   - Connect If (true) to Insert row, and Insert row back to Loop Over Items.

9. **Add Limit Node**  
   - Connect Loop Over Items (false branch when all done) to Limit node.

10. **Add Data Table Get Rows Node**  
    - Configure to get up to 30 rows from the Newsletter Data Table.

11. **Add Code Node**  
    - Paste provided JavaScript code that formats the newsletter HTML and subject line with current date/time in Asia/Kolkata timezone.  
    - Connect Get row(s) output to Code node.

12. **Add Gmail Node (Send a message)**  
    - Configure with Gmail OAuth2 credentials.  
    - Set recipient email address to your target newsletter recipient.  
    - Use expressions for Subject and Message body from Code node output.  
    - Connect Code node to Gmail node.

13. **Add SMTP Email Send Node (Send Email)**  
    - Configure SMTP credentials as fallback.  
    - Set from and to emails appropriately.  
    - Connect Gmail node output to SMTP node.

14. **Add Data Table Delete Rows Node**  
    - Configure to delete rows where Output = "true" from the Newsletter Data Table.  
    - Connect both Gmail and SMTP nodes outputs into Delete row(s) node.

15. **Test the Workflow**  
    - Verify credentials and feed URLs are correct.  
    - Run once manually to confirm flow.  
    - Schedule will run automatically daily.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                  | Context or Link                                                                                      |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| This workflow pulls the latest marketing news from Campaign India and ET BrandEquity, filters the useful stories with an AI relevance check, saves them to a Data Table, and sends a daily newsletter at 7:30 PM IST.                        | Sticky Note1 in workflow                                                                           |
| You can add or remove RSS feeds in the “Get Latest News” section by editing the RSS Feed nodes connected to the Schedule Trigger.                                                                                                          | Sticky Note6                                                                                       |
| Modify the AI Agent prompt to adjust filtering criteria for relevance as needed.                                                                                                                                                             | Sticky Note8                                                                                       |
| After sending the newsletter, all filtered articles are deleted from the Data Table to prevent duplicates in the next newsletter.                                                                                                          | Sticky Note9                                                                                       |
| For email delivery, Gmail OAuth2 is the primary sender, with SMTP as a fallback option. Update recipient and sender emails accordingly.                                                                                                    | Sticky Note9                                                                                       |
| The newsletter HTML is styled for readability and mobile compatibility, using inline CSS and clear sectioning for titles, dates, and snippets.                                                                                             | JavaScript Code node (Code)                                                                        |
| Official n8n documentation for Data Tables: https://docs.n8n.io/nodes/n8n-nodes-base.datatable/                                                                                                                                             | Useful for understanding Data Table operations                                                    |
| n8n Langchain Agent documentation: https://docs.n8n.io/nodes/ai-nodes/langchain-agent/                                                                                                                                                       | Useful for modifying AI prompt or agent behavior                                                  |

---

This reference document fully describes the workflow structure, node functions, configuration details, and steps to reproduce, enabling precise understanding and modification by advanced users or AI agents.