Automate Morning Brew–style Reddit Digests and Publish to DEV using AI

https://n8nworkflows.xyz/workflows/automate-morning-brew-style-reddit-digests-and-publish-to-dev-using-ai-7632


# Automate Morning Brew–style Reddit Digests and Publish to DEV using AI

### 1. Workflow Overview

This workflow automates the creation and distribution of a Morning Brew–style daily newsletter digest based on Reddit posts from the r/n8n subreddit. It fetches the latest posts, enriches them with additional data like comments and upvotes using Bright Data’s web scraping service, processes and summarizes the data with AI to produce a professional HTML newsletter, sends the newsletter via email, and publishes it as a markdown article on DEV.to.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Scheduled trigger and retrieval of the latest Reddit posts via RSS feed.
- **1.2 Data Enrichment with Bright Data:** Extract URLs from posts and initiate batch web scraping to collect comments, upvotes, and other post metadata.
- **1.3 Batch Extraction Monitoring:** Monitor the progress of Bright Data scraping jobs, retrying with waits as necessary until data is ready.
- **1.4 Data Preparation:** Download scraped data, extract and transform essential fields into a normalized format suitable for AI summarization.
- **1.5 AI Processing:** Use a LangChain AI Agent (with OpenAI or Google Gemini language models) to produce a polished, inline-styled HTML newsletter in the style of Morning Brew.
- **1.6 Output Delivery:** Send the generated HTML newsletter via Gmail and convert it to markdown for posting on DEV.to.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

**Overview:**  
This initial block triggers the workflow on a schedule and retrieves the latest posts from the r/n8n subreddit via its RSS feed.

**Nodes Involved:**  
- Schedule Trigger  
- RSS Read  
- Extract URLs  
- Aggregate URLs to Single Object  

**Node Details:**

- **Schedule Trigger**  
  - Type: Schedule Trigger  
  - Role: Starts workflow execution at regular intervals (every day by default).  
  - Configuration: Runs on a repeating schedule with default intervals (likely daily).  
  - Inputs: None (trigger node).  
  - Outputs: Triggers RSS Read node.  
  - Edge Cases: Ensure schedule does not overlap with long-running executions.

- **RSS Read**  
  - Type: RSS Feed Read  
  - Role: Reads the RSS feed from r/n8n subreddit to get recent posts.  
  - Configuration: URL set to "https://www.reddit.com/r/n8n.rss". No additional options set.  
  - Inputs: Trigger from Schedule Trigger.  
  - Outputs: JSON items representing Reddit posts, including fields like `link`, `title`, `description`.  
  - Edge Cases: RSS feed availability, rate limits from Reddit, malformed feed data.

- **Extract URLs**  
  - Type: Set  
  - Role: Extracts the `link` property from each RSS item and assigns it to a new field `url`.  
  - Configuration: Sets `url` = `{{$json.link}}`.  
  - Inputs: RSS Read node output.  
  - Outputs: Items with only `url` field for further processing.  
  - Edge Cases: Missing or invalid `link` properties.

- **Aggregate URLs to Single Object**  
  - Type: Aggregate  
  - Role: Aggregates all URL items into a single JSON array for batch processing.  
  - Configuration: Aggregate all item data into one array.  
  - Inputs: Extract URLs node output.  
  - Outputs: Single item with an array of URLs in `data`.  
  - Edge Cases: Empty input array, large batch sizes.

---

#### 2.2 Data Enrichment with Bright Data

**Overview:**  
This block sends the collected URLs to Bright Data’s web scraper to retrieve enriched data such as comments and upvotes for each Reddit post.

**Nodes Involved:**  
- Initiate batch extraction from URL  
- Loop Over Items  

**Node Details:**

- **Initiate batch extraction from URL**  
  - Type: Bright Data API node (webScrapper, triggerCollectionByUrl)  
  - Role: Starts a Bright Data scraping job for the list of URLs aggregated previously.  
  - Configuration:  
    - `urls`: JSON stringified array of URLs from previous aggregate node.  
    - `dataset_id`: Fixed Bright Data dataset ID `"gd_lvz8ah06191smkebj4"` for Reddit posts.  
  - Credentials: Bright Data API credentials named "Angel BrightData account".  
  - Inputs: Aggregated URLs item.  
  - Outputs: Snapshot ID and job status to track scraping progress.  
  - Edge Cases: Bright Data API errors, invalid URLs, authentication failures, rate limits.

- **Loop Over Items**  
  - Type: Split in Batches  
  - Role: Processes each batch of scraping jobs one at a time to monitor their progress.  
  - Configuration: Resets after completion to allow looping.  
  - Inputs: Output of Initiate batch extraction.  
  - Outputs: Feeds each batch item to the next monitoring node.  
  - Edge Cases: Long-running loops, infinite looping if not handled properly.

---

#### 2.3 Batch Extraction Monitoring

**Overview:**  
This block continuously monitors the status of Bright Data scraping snapshots and waits until the data is ready, retrying with delay if needed.

**Nodes Involved:**  
- Check the status of a batch extraction  
- Check if Batch Ready (If node)  
- Wait 5 seconds  
- Check Snapshot Again for Success  

**Node Details:**

- **Check the status of a batch extraction**  
  - Type: Bright Data API node (monitorProgressSnapshot)  
  - Role: Queries Bright Data for the current status of the scraping job.  
  - Configuration: Uses `snapshot_id` from the batch extraction initiation.  
  - Inputs: Output of Loop Over Items.  
  - Outputs: Status such as "ready" or "processing".  
  - Credentials: Bright Data API credentials.  
  - Edge Cases: API timeouts, snapshot ID invalidation, network issues.

- **Check if Batch Ready**  
  - Type: If  
  - Role: Checks if the batch extraction status equals "ready".  
  - Configuration: Condition `status == "ready"` (case sensitive, strict).  
  - Inputs: Status from previous node.  
  - Outputs:  
    - True: Proceed to download snapshot content.  
    - False: Wait 5 seconds before retrying.  
  - Edge Cases: Status field missing or malformed.

- **Wait 5 seconds**  
  - Type: Wait  
  - Role: Pauses workflow for 5 seconds before retrying status check.  
  - Configuration: Fixed 5 seconds delay.  
  - Inputs: False branch of If node.  
  - Outputs: Feeds back into Check Snapshot Again node for retry.  
  - Edge Cases: Workflow timeout if retries too many.

- **Check Snapshot Again for Success**  
  - Type: NoOp (No operation, used as a loop control)  
  - Role: Acts as a pass-through node to trigger the Loop Over Items node again after wait.  
  - Inputs: Output of Wait node.  
  - Outputs: Back to Loop Over Items node to re-check status.  
  - Edge Cases: None (control flow node).

---

#### 2.4 Data Preparation

**Overview:**  
Once the data is ready, this block downloads the scraped data, extracts essential fields, and aggregates them into a formatted string suitable for AI input.

**Nodes Involved:**  
- Download the snapshot content  
- Extract Essential Data  
- Reduce Objects to 1  
- Aggregate  

**Node Details:**

- **Download the snapshot content**  
  - Type: Bright Data API node (downloadSnapshot)  
  - Role: Downloads the scraped data JSON for the snapshot.  
  - Configuration: Uses `snapshot_id` from batch status check.  
  - Credentials: Bright Data API credentials.  
  - Inputs: True branch of Check if Batch Ready node.  
  - Outputs: Raw scraped data including posts and comments.  
  - Edge Cases: Partial or corrupted downloads.

- **Extract Essential Data**  
  - Type: Set  
  - Role: Extracts and maps essential fields required for summarization from raw data.  
  - Configuration: Maps fields such as `title`, `description`, `comments`, `post_id`, `url`, `num_upvotes`, `num_comments`.  
  - Inputs: Downloaded snapshot content.  
  - Outputs: Items with normalized fields for AI input.  
  - Edge Cases: Missing fields, null comments array.

- **Reduce Objects to 1**  
  - Type: Set  
  - Role: Converts structured post data into a single formatted string per post including title, description, URL, votes, comments, etc.  
  - Configuration: Uses a complex expression that formats and JSON-stringifies comments, trims whitespace, and prepares data for aggregation.  
  - Inputs: Extract Essential Data output.  
  - Outputs: Items with a single string field `postdata`.  
  - Edge Cases: Malformed comments JSON, empty comments.

- **Aggregate**  
  - Type: Aggregate  
  - Role: Aggregates all formatted post strings into a single array for AI consumption.  
  - Configuration: Aggregates `postdata` fields from all items.  
  - Inputs: Output of Reduce Objects to 1 node.  
  - Outputs: One item with array of all postdata strings.  
  - Edge Cases: Empty input, very large aggregated content.

---

#### 2.5 AI Processing

**Overview:**  
This block sends the aggregated post data to an AI agent (LangChain) that formats it into a professional HTML newsletter styled like Morning Brew, with sections like Top Stories, Quick Hits, Community Q&A, and Comment Spotlight.

**Nodes Involved:**  
- AI Agent  
- OpenAI Chat Model (optional)  
- Google Gemini Chat Model (optional)  

**Node Details:**

- **AI Agent**  
  - Type: LangChain AI Agent  
  - Role: Primary AI node that receives raw post data and outputs a complete HTML newsletter.  
  - Configuration:  
    - Input text: Joined `postdata` strings from aggregated node.  
    - System message: Detailed prompt guiding the AI to produce a clean, inline-styled HTML newsletter with specified sections, tone, formatting rules, and error handling.  
  - Inputs: Aggregated post data.  
  - Outputs: Full HTML string of the newsletter in field `output`.  
  - AI Model: Can use either OpenAI or Google Gemini models connected via sub-nodes.  
  - Edge Cases: Empty or malformed input data, AI timeout or errors, incomplete HTML output.

- **OpenAI Chat Model**  
  - Type: LangChain OpenAI Chat Model  
  - Role: Provides OpenAI GPT-5 model backend for AI Agent.  
  - Configuration: Model set to `gpt-5`, timeout 30 seconds.  
  - Inputs: From AI Agent's language model input.  
  - Outputs: AI-generated text.  
  - Credentials: OpenAI API key.  
  - Edge Cases: API rate limits, network errors, model errors.

- **Google Gemini Chat Model**  
  - Type: LangChain Google Gemini Chat Model  
  - Role: Alternative AI backend using Google Gemini (PaLM) API.  
  - Inputs/Outputs: Similar to OpenAI node.  
  - Credentials: Google PaLM API credentials.  
  - Edge Cases: API limits, authentication errors.

---

#### 2.6 Output Delivery

**Overview:**  
The final block distributes the generated newsletter by sending it as an email via Gmail and posting a markdown version to DEV.to.

**Nodes Involved:**  
- Send a message (Gmail)  
- Markdown  
- Publish to Dev.to  

**Node Details:**

- **Send a message**  
  - Type: Gmail node  
  - Role: Sends the generated HTML newsletter as an email.  
  - Configuration:  
    - Recipient: `angel@n8n.io` (hardcoded).  
    - Subject: `"Daily Digest "` (with no dynamic date appended).  
    - Message body: HTML content from AI Agent’s output field `output`.  
  - Credentials: Gmail OAuth2 account.  
  - Inputs: AI Agent output (HTML).  
  - Outputs: Email send result.  
  - Edge Cases: Gmail API rate limits, auth token expiry, email formatting issues.

- **Markdown**  
  - Type: Markdown  
  - Role: Converts the HTML newsletter into markdown format suitable for DEV.to.  
  - Configuration: Converts `output` field (HTML) to markdown stored in `markdown`.  
  - Inputs: AI Agent output.  
  - Outputs: Markdown text.  
  - Edge Cases: Conversion accuracy, malformed HTML.

- **Publish to Dev.to**  
  - Type: HTTP Request  
  - Role: Posts the markdown content as a new article on DEV.to via their API.  
  - Configuration:  
    - Method: POST  
    - URL: `https://dev.to/api/articles`  
    - JSON Body: Constructs article with title including current date, body markdown, tags, description, and marks as published. Includes cleanup of markdown formatting in expression.  
  - Credentials: DEV.to API key using generic HTTP auth.  
  - Inputs: Markdown output from previous node.  
  - Outputs: API response for article creation.  
  - Edge Cases: API rate limits, authentication failure, malformed markdown causing post rejection.

---

### 3. Summary Table

| Node Name                          | Node Type                          | Functional Role                                      | Input Node(s)                  | Output Node(s)                        | Sticky Note                                                                                          |
|-----------------------------------|----------------------------------|-----------------------------------------------------|--------------------------------|-------------------------------------|----------------------------------------------------------------------------------------------------|
| Schedule Trigger                  | Schedule Trigger                 | Starts workflow on schedule                          | None                           | RSS Read                           |                                                                                                    |
| RSS Read                         | RSS Feed Read                   | Fetch recent Reddit posts from RSS feed             | Schedule Trigger               | Extract URLs                      | ## Get most recent reddit posts                                                                     |
| Extract URLs                    | Set                             | Extract `link` as `url` from RSS items              | RSS Read                      | Aggregate URLs to Single Object    |                                                                                                    |
| Aggregate URLs to Single Object  | Aggregate                       | Combine URLs into single JSON array                  | Extract URLs                  | Initiate batch extraction from URL |                                                                                                    |
| Initiate batch extraction from URL| Bright Data API (webScrapper)   | Start Bright Data scraping job for URLs              | Aggregate URLs to Single Object| Loop Over Items                   | ## Pass Posts to Bright Data to get comment and upvote data                                         |
| Loop Over Items                  | Split In Batches                | Process each scraping job batch sequentially        | Initiate batch extraction from URL | Check the status of a batch extraction |                                                                                                    |
| Check the status of a batch extraction | Bright Data API (monitorProgressSnapshot) | Poll scraping job status                             | Loop Over Items               | Check if Batch Ready              |                                                                                                    |
| Check if Batch Ready            | If                             | Branch based on scraping status "ready"             | Check the status of a batch extraction | Download the snapshot content / Wait 5 seconds |                                                                                                    |
| Wait 5 seconds                 | Wait                           | Pause 5 seconds before re-checking                   | Check if Batch Ready (false)  | Check Snapshot Again for Success  |                                                                                                    |
| Check Snapshot Again for Success | NoOp                           | Loop control node to retry batch status check       | Wait 5 seconds                | Loop Over Items                  |                                                                                                    |
| Download the snapshot content   | Bright Data API (downloadSnapshot) | Retrieve scraped data JSON                           | Check if Batch Ready (true)   | Extract Essential Data           | ## Prep output for LLM                                                                              |
| Extract Essential Data          | Set                             | Extract and normalize key post fields                | Download the snapshot content | Reduce Objects to 1              |                                                                                                    |
| Reduce Objects to 1             | Set                             | Format post data into single string for AI           | Extract Essential Data        | Aggregate                       |                                                                                                    |
| Aggregate                      | Aggregate                       | Combine all post strings into array for AI input     | Reduce Objects to 1           | AI Agent                       |                                                                                                    |
| AI Agent                      | LangChain AI Agent             | Generate full HTML newsletter from posts             | Aggregate                    | Send a message / Markdown       | ## Convert posts to summary                                                                         |
| OpenAI Chat Model             | LangChain OpenAI Model        | OpenAI GPT-5 model backend for AI Agent               | AI Agent (languageModel input)| AI Agent                      |                                                                                                    |
| Google Gemini Chat Model      | LangChain Google Gemini Model | Google Gemini model backend alternative                | AI Agent (languageModel input)| AI Agent                      |                                                                                                    |
| Send a message                | Gmail                         | Send HTML newsletter email                             | AI Agent (output)             | Markdown                       | ## Send HTML email newsletter                                                                       |
| Markdown                     | Markdown                      | Convert HTML newsletter to markdown                    | AI Agent (output)             | Publish to Dev.to               |                                                                                                    |
| Publish to Dev.to             | HTTP Request                  | Post markdown article to DEV.to API                    | Markdown                     | None                          | ## Convert and Post to Dev.to                                                                        |
| Sticky Note                   | Sticky Note                   | Documentation notes                                    | None                         | None                         | ## Get most recent reddit posts                                                                     |
| Sticky Note1                  | Sticky Note                   | Documentation notes                                    | None                         | None                         | ## Pass Posts to Bright Data to get comment and upvote data                                         |
| Sticky Note2                  | Sticky Note                   | Documentation notes                                    | None                         | None                         | ## Prep output for LLM                                                                              |
| Sticky Note3                  | Sticky Note                   | Documentation notes                                    | None                         | None                         | ## Convert posts to summary                                                                         |
| Sticky Note4                  | Sticky Note                   | Documentation notes                                    | None                         | None                         | ## Send HTML email newsletter                                                                       |
| Sticky Note5                  | Sticky Note                   | Documentation notes                                    | None                         | None                         | ## Convert and Post to Dev.to                                                                        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node**  
   - Set it to trigger at your preferred interval (daily recommended).

2. **Add an RSS Feed Read node**  
   - Connect from Schedule Trigger.  
   - Configure URL to `https://www.reddit.com/r/n8n.rss`.  
   - No additional options needed.

3. **Add a Set node named "Extract URLs"**  
   - Connect from RSS Feed Read.  
   - Set a field `url` with value expression `{{$json.link}}`.

4. **Add an Aggregate node named "Aggregate URLs to Single Object"**  
   - Connect from Extract URLs.  
   - Aggregate all item data into a single array.

5. **Add a Bright Data node (webScrapper)**  
   - Connect from Aggregate URLs to Single Object.  
   - Operation: `triggerCollectionByUrl`.  
   - `urls`: set to `={{ $json.data.toJsonString() }}` (stringified array).  
   - Dataset ID: `"gd_lvz8ah06191smkebj4"`.  
   - Authenticate with Bright Data API credentials.

6. **Add a Split In Batches node named "Loop Over Items"**  
   - Connect from Bright Data node.  
   - Enable reset after completion.

7. **Add a Bright Data node (monitorProgressSnapshot)**  
   - Connect from Loop Over Items (main output).  
   - Use `snapshot_id` from current item to check status.  
   - Authenticate with Bright Data API.

8. **Add an If node named "Check if Batch Ready"**  
   - Connect from status check.  
   - Condition: `$json.status == "ready"`.

9. **Add a Bright Data node (downloadSnapshot)**  
   - Connect from If node's true branch.  
   - Use `snapshot_id` to download results.  
   - Authenticate with Bright Data API.

10. **Add a Set node named "Extract Essential Data"**  
    - Connect from downloadSnapshot.  
    - Map fields: `title`, `description`, `comments`, `post_id`, `url`, `num_upvotes`, `num_comments` from JSON.

11. **Add a Set node named "Reduce Objects to 1"**  
    - Connect from Extract Essential Data.  
    - Use an expression to format all post fields into a single string named `postdata`, including serializing comments properly.

12. **Add an Aggregate node named "Aggregate"**  
    - Connect from Reduce Objects to 1.  
    - Aggregate all `postdata` strings into an array.

13. **Add a LangChain AI Agent node named "AI Agent"**  
    - Connect from Aggregate.  
    - Input text set to join the `postdata` array with double newlines.  
    - Paste the detailed system prompt from the original workflow (describing Morning Brew style, sections, formatting, etc.).  
    - Connect either:  
      - OpenAI Chat Model node configured to GPT-5, or  
      - Google Gemini Chat Model node with valid credentials.

14. **Add a Gmail node named "Send a message"**  
    - Connect from AI Agent node main output.  
    - Configure to send to your email address.  
    - Subject: "Daily Digest".  
    - Message body: Use AI Agent output field `output` (HTML).  
    - Authenticate using Gmail OAuth2 credentials.

15. **Add a Markdown node named "Markdown"**  
    - Connect from AI Agent output.  
    - Convert the `output` (HTML) to markdown stored in `markdown`.

16. **Add an HTTP Request node named "Publish to Dev.to"**  
    - Connect from Markdown.  
    - POST to `https://dev.to/api/articles`.  
    - Body: JSON with title including current date, `body_markdown` set to markdown output, description, tags, and `published` true.  
    - Clean markdown string in the body expression as per the original.  
    - Authenticate with DEV.to API token via generic HTTP auth.

17. **Add a Wait node named "Wait 5 seconds"**  
    - Connect from If node false branch (Check if Batch Ready).  
    - Set wait time to 5 seconds.

18. **Add a NoOp node named "Check Snapshot Again for Success"**  
    - Connect from Wait node.  
    - Connect its output back to "Loop Over Items" node to retry monitoring.

19. **Connect all nodes as per above, ensuring correct branching and loops.**

20. **Set up Credentials:**  
    - Bright Data API credentials with correct API key.  
    - Gmail OAuth2 credentials for sending emails.  
    - OpenAI API key or Google PaLM API credentials.  
    - Dev.to API key via generic HTTP auth.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                        | Context or Link                                                                                  |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| This workflow demonstrates an advanced integration of RSS feeds, web scraping, AI summarization, and multi-channel publishing. It highlights Bright Data’s capability to enrich data with comments and upvotes, and LangChain’s flexibility to output complex formatted HTML newsletters.                                                                                         | Workflow concept                                                                                    |
| The AI Agent’s system prompt is highly detailed to ensure a professional newsletter output with strict HTML styling suitable for email clients.                                                                                                                                                                                                                                   | AI prompt design                                                                                  |
| The workflow includes retry loops with delay to handle asynchronous scraping jobs gracefully, preventing premature data download attempts.                                                                                                                                                                                                                                         | Workflow reliability                                                                                |
| The DEV.to posting node cleans markdown formatting extensively to ensure article compatibility.                                                                                                                                                                                                                                                                                   | Markdown post-processing                                                                            |
| Gmail node requires OAuth2 credentials to send emails; ensure token refresh is configured to avoid auth failures.                                                                                                                                                                                                                                                                   | Gmail integration                                                                                   |
| Bright Data scraping depends on a specific dataset ID; changes in Bright Data API or dataset availability may require updates.                                                                                                                                                                                                                                                    | Bright Data integration                                                                             |
| See the official n8n documentation for using RSS Feed Read, Bright Data nodes, and LangChain integrations for detailed configuration options.                                                                                                                                                                                                                                      | https://docs.n8n.io/nodes/                                                                          |
| For email HTML compatibility, the AI’s output uses inline styles and table layouts, following best practices for newsletters.                                                                                                                                                                                                                                                      | Email design best practices                                                                         |
| Related example workflows and community discussions on r/n8n can provide insights and inspiration for extending or customizing this workflow.                                                                                                                                                                                                                                     | https://www.reddit.com/r/n8n/                                                                       |

---

**Disclaimer:** The provided text is exclusively derived from an n8n automated workflow. It complies strictly with content policies and contains no illegal or protected data. All manipulated data is legal and public.