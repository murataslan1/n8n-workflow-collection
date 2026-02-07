Automate Reddit Monitoring with GPT-5-Mini, Notion, and Gmail

https://n8nworkflows.xyz/workflows/automate-reddit-monitoring-with-gpt-5-mini--notion--and-gmail-10877


# Automate Reddit Monitoring with GPT-5-Mini, Notion, and Gmail

### 1. Workflow Overview

This workflow automates the monitoring of Reddit discussions related to specified keywords and subreddits, leveraging GPT-5-Mini to analyze and score relevance, generate comments, and subsequently log results in Notion and optionally send an email summary via Gmail. The main use case is competitive intelligence or market research teams who want to track relevant Reddit conversations, assess their importance, and engage effectively using AI-generated insights.

The workflow is logically divided into two core blocks:

- **1.1 Fetch and Filter Reddit Posts**:  
  Defines keywords and subreddits, queries Reddit API for new posts, filters out empty results, and aggregates the posts.

- **1.2 AI Analysis, Data Storage, and Notification**:  
  Uses GPT-5-Mini to evaluate each post's relevance and generate comments, enriches the posts with AI data, saves posts to a Notion database, compiles an HTML email summary, and optionally sends it via Gmail.

---

### 2. Block-by-Block Analysis

#### 2.1 Fetch and Filter Reddit Posts

**Overview:**  
This block initializes search parameters, triggers the workflow on a schedule, performs Reddit searches based on keywords and subreddits, filters out empty results, and aggregates the posts into a unified list.

**Nodes Involved:**  
- Schedule Trigger  
- Define Keywords And Subreddits  
- Split Out Keywords  
- Define Relevance Criteria  
- Define Instructions For Generating Comments  
- Search Reddit  
- Filter Reddit Items With No Posts  
- Aggregate Reddit Items  
- Combine Posts Into A Single Array  
- Split Out Posts  

---

**Node Details:**

- **Schedule Trigger**  
  - Type: Schedule Trigger  
  - Role: Initiates the workflow periodically (daily by default)  
  - Configuration: Runs on a recurring daily interval with no set time constraints  
  - Inputs: None (trigger node)  
  - Outputs: Triggers "Define Keywords And Subreddits"  
  - Failure Modes: Scheduling misconfiguration, system downtime  

- **Define Keywords And Subreddits**  
  - Type: Set  
  - Role: Defines the keywords to search for, the list of subreddits to target, and a flag for searching all subreddits  
  - Configuration:  
    - keywords: ["competitor", "intelligence"]  
    - search_all_subs: false  
    - subreddits: ["saas", "solopreneur", "b2bsaas", "indiehackers"]  
  - Inputs: From Schedule Trigger  
  - Outputs: To Split Out Keywords  
  - Edge Cases: Empty keywords or subreddits list, invalid subreddit names  

- **Split Out Keywords**  
  - Type: Split Out  
  - Role: Iterates over the keywords array, processing each keyword individually downstream  
  - Configuration: Splits on "keywords" field  
  - Inputs: From Define Keywords And Subreddits  
  - Outputs: To Define Relevance Criteria  
  - Edge Cases: Empty keywords array leads to no iterations  

- **Define Relevance Criteria**  
  - Type: Set  
  - Role: Sets the criteria text used by GPT to assess relevance  
  - Configuration: String assignment: "Discussions should be related to competitive intelligence."  
  - Inputs: From Split Out Keywords  
  - Outputs: To Define Instructions For Generating Comments  
  - Edge Cases: Missing or vague criteria may reduce AI accuracy  

- **Define Instructions For Generating Comments**  
  - Type: Set  
  - Role: Provides instructions to GPT on how to generate comments for posts  
  - Configuration: "Acknowledge the challenges users face and offer clear, helpful solutions. Generate a brief comment and don't use em dash or hyphens."  
  - Inputs: From Define Relevance Criteria  
  - Outputs: To Search Reddit  
  - Edge Cases: Ambiguous instructions may produce irrelevant comments  

- **Search Reddit**  
  - Type: HTTP Request  
  - Role: Queries Reddit API to search posts matching keywords within specified subreddits or site-wide  
  - Configuration:  
    - URL dynamically constructed based on "search_all_subs" flag:  
      - If true: `https://www.reddit.com/search.json`  
      - Else: `https://www.reddit.com/r/<subreddits joined by +>/search.json`  
    - Query Parameters:  
      - q: current keyword  
      - restrict_sr: "on" (restrict search to subreddits)  
      - sort: "new" (latest posts)  
      - t: "day" (posts from last day)  
  - Inputs: From Define Instructions For Generating Comments  
  - Outputs: To Filter Reddit Items With No Posts  
  - Edge Cases: Reddit API rate limits, no posts found, network timeout, malformed keywords  

- **Filter Reddit Items With No Posts**  
  - Type: Filter  
  - Role: Excludes results where no posts were found (`data.dist === 0`)  
  - Configuration: Condition to only pass items where `data.dist` not equals 0  
  - Inputs: From Search Reddit  
  - Outputs: To Aggregate Reddit Items  
  - Edge Cases: False negatives if Reddit response changes structure  

- **Aggregate Reddit Items**  
  - Type: Aggregate  
  - Role: Aggregates the "data.children" arrays from multiple Reddit search results into one field  
  - Configuration: Aggregates field "data.children"  
  - Inputs: From Filter Reddit Items With No Posts  
  - Outputs: To Combine Posts Into A Single Array  
  - Edge Cases: Large data sets may impact performance  

- **Combine Posts Into A Single Array**  
  - Type: Code  
  - Role: Flattens nested arrays of posts into a single array for easier processing downstream  
  - Configuration (JS logic):  
    - Flattens all child arrays from aggregated items into a single posts array  
  - Inputs: From Aggregate Reddit Items  
  - Outputs: To Split Out Posts  
  - Edge Cases: Empty posts array if no data  

- **Split Out Posts**  
  - Type: Split Out  
  - Role: Splits the combined posts array so each post can be analyzed individually  
  - Configuration: Splits on "posts" field  
  - Inputs: From Combine Posts Into A Single Array  
  - Outputs: To Analyze Each Post (next block)  
  - Edge Cases: Empty posts array leads to no downstream processing  

---

#### 2.2 AI Analysis, Data Storage, and Notification

**Overview:**  
This block analyzes each Reddit post using GPT-5-Mini to score relevance and generate comments, aggregates these AI outputs back into the posts, stores enriched posts in Notion, generates an HTML email summary, and optionally sends it to a configured Gmail account.

**Nodes Involved:**  
- Analyze Each Post (OpenAI)  
- Add Relevance Score And Comment To Each Post (Code)  
- Aggregate Posts  
- Generate HTML Email (Code)  
- Split Out Posts Into Items  
- Add Each Post to Notion Database  
- Send a message (Gmail)  

---

**Node Details:**

- **Analyze Each Post**  
  - Type: OpenAI (Langchain node)  
  - Role: Sends each Reddit post to GPT-5-Mini for relevance scoring and comment generation  
  - Configuration:  
    - Model: GPT-5-Mini  
    - Prompt: Asks GPT to analyze post title and body, score relevance 1-10, and generate a comment in JSON format only  
    - Inputs included:  
      - Relevance Criteria (from Define Relevance Criteria)  
      - Comment Instructions (from Define Instructions For Generating Comments)  
      - Post Title, Post Body (current post JSON fields)  
  - Inputs: From Split Out Posts  
  - Outputs: To Add Relevance Score And Comment To Each Post  
  - Credentials: OpenAI API key required  
  - Edge Cases: API rate limits, malformed output from GPT, network errors, prompt misinterpretation  

- **Add Relevance Score And Comment To Each Post**  
  - Type: Code  
  - Role: Merges GPT responses (relevance score and comment) with original post data  
  - Configuration (JS logic):  
    - Maps GPT outputs and combines with posts array by index  
    - Adds `relevanceScore` and `generatedComment` properties to each post JSON  
  - Inputs: From Analyze Each Post (GPT outputs) and original post data via paired items  
  - Outputs: To Aggregate Posts  
  - Edge Cases: Mismatched array lengths, missing GPT response content  

- **Aggregate Posts**  
  - Type: Aggregate  
  - Role: Aggregates all enriched post items into a single array under the field "posts"  
  - Configuration: Aggregates all incoming items' JSON into "posts" field  
  - Inputs: From Add Relevance Score And Comment To Each Post  
  - Outputs: To Generate HTML Email  
  - Edge Cases: Large array size may impact processing time  

- **Generate HTML Email**  
  - Type: Code  
  - Role: Builds a styled HTML email summary listing all posts with highlights, snippets, relevance scores, and AI-generated comments  
  - Configuration (JS logic):  
    - Reads keywords, subreddits, and posts  
    - Highlights keywords in titles and snippets  
    - Formats each post with author, subreddit, upvotes, comments count, relevance score, and AI comment  
    - Wraps all posts in a styled container for email  
  - Inputs: From Aggregate Posts  
  - Outputs: To Split Out Posts Into Items and optionally Send a message (Gmail)  
  - Edge Cases: Missing post fields, empty posts list, malformed HTML  

- **Split Out Posts Into Items**  
  - Type: Split Out  
  - Role: Splits the aggregated posts array for individual insertion into Notion database  
  - Configuration: Splits on "posts" field  
  - Inputs: From Generate HTML Email  
  - Outputs: To Add Each Post to Notion Database  
  - Edge Cases: Empty posts array results in no Notion entries  

- **Add Each Post to Notion Database**  
  - Type: Notion  
  - Role: Creates a new database page in Notion for each post with mapped properties  
  - Configuration:  
    - Database ID: preset to "Reddit Automation" database  
    - Properties mapped: Title, Body (rich text), Relevance Score (number), Generated Comment, Subreddit (select), Upvote Ratio, Upvotes, Down Votes, Created At (date), Post ID, Author, Link (URL)  
  - Inputs: From Split Out Posts Into Items  
  - Outputs: None (end of line for Notion storage)  
  - Credentials: Notion API integration with required permissions  
  - Edge Cases: API errors, rate limits, missing required properties, invalid database ID  

- **Send a message (Gmail)**  
  - Type: Gmail  
  - Role: Sends the generated HTML email summary to a configured recipient  
  - Configuration:  
    - Recipient email: "your-mail@example.com" (to be customized)  
    - Subject: "New Reddit Discussions Found"  
    - Message body: HTML content from Generate HTML Email node  
  - Inputs: From Generate HTML Email  
  - Credentials: Gmail OAuth2 credentials needed  
  - Edge Cases: Authentication errors, quota exceeded, invalid recipient, HTML rendering issues  

---

### 3. Summary Table

| Node Name                            | Node Type                  | Functional Role                                           | Input Node(s)                       | Output Node(s)                          | Sticky Note                                                                                           |
|------------------------------------|----------------------------|-----------------------------------------------------------|-----------------------------------|----------------------------------------|-----------------------------------------------------------------------------------------------------|
| Schedule Trigger                   | Schedule Trigger            | Periodically initiates workflow                            | —                                 | Define Keywords And Subreddits          | See Sticky Note5 for block 1 overview and setup instructions                                         |
| Define Keywords And Subreddits     | Set                        | Defines keywords, subreddits, and search scope            | Schedule Trigger                  | Split Out Keywords                      | See Sticky Note5                                                                                     |
| Split Out Keywords                 | Split Out                  | Iterates over keywords for individual processing          | Define Keywords And Subreddits    | Define Relevance Criteria               | See Sticky Note5                                                                                     |
| Define Relevance Criteria          | Set                        | Sets criteria for GPT relevance scoring                    | Split Out Keywords               | Define Instructions For Generating Comments | See Sticky Note5                                                                                     |
| Define Instructions For Generating Comments | Set                    | Sets instructions for GPT comment generation               | Define Relevance Criteria        | Search Reddit                          | See Sticky Note5                                                                                     |
| Search Reddit                     | HTTP Request               | Queries Reddit API for posts matching keywords             | Define Instructions For Generating Comments | Filter Reddit Items With No Posts   | See Sticky Note5                                                                                     |
| Filter Reddit Items With No Posts  | Filter                     | Filters results with zero posts                             | Search Reddit                   | Aggregate Reddit Items                  | See Sticky Note5                                                                                     |
| Aggregate Reddit Items             | Aggregate                  | Aggregates posts arrays from Reddit responses              | Filter Reddit Items With No Posts | Combine Posts Into A Single Array       | See Sticky Note5                                                                                     |
| Combine Posts Into A Single Array  | Code                       | Flattens nested post arrays into one                        | Aggregate Reddit Items           | Split Out Posts                        | See Sticky Note5                                                                                     |
| Split Out Posts                   | Split Out                  | Splits posts array for individual analysis                 | Combine Posts Into A Single Array | Analyze Each Post                      | See Sticky Note6 for block 2 overview and Notion template link                                       |
| Analyze Each Post                 | OpenAI (Langchain)         | Analyzes each post with GPT-5-Mini for relevance and comment | Split Out Posts                 | Add Relevance Score And Comment To Each Post | See Sticky Note6                                                                                     |
| Add Relevance Score And Comment To Each Post | Code                   | Merges GPT outputs with original post data                 | Analyze Each Post               | Aggregate Posts                        | See Sticky Note6                                                                                     |
| Aggregate Posts                  | Aggregate                  | Aggregates enriched posts into a single array              | Add Relevance Score And Comment To Each Post | Generate HTML Email                | See Sticky Note6                                                                                     |
| Generate HTML Email              | Code                       | Creates styled HTML email summary of posts                 | Aggregate Posts                 | Split Out Posts Into Items, Send a message | See Sticky Note6                                                                                     |
| Split Out Posts Into Items       | Split Out                  | Splits posts array for Notion insertion                     | Generate HTML Email             | Add Each Post to Notion Database        | See Sticky Note6                                                                                     |
| Add Each Post to Notion Database  | Notion                     | Saves each post as a page in Notion database                | Split Out Posts Into Items      | —                                      | See Sticky Note6                                                                                     |
| Send a message                   | Gmail                      | Sends the HTML email summary                                | Generate HTML Email             | —                                      | See Sticky Note6                                                                                     |
| Sticky Note4                    | Sticky Note                | Detailed workflow explanation and setup instructions       | —                                 | —                                      | Covers entire workflow with setup and contact info                                                  |
| Sticky Note5                    | Sticky Note                | Block 1 overview and setup instructions                     | —                                 | —                                      | Covers first half (fetch and filter block)                                                          |
| Sticky Note6                    | Sticky Note                | Block 2 overview, Notion template link                      | —                                 | —                                      | Covers second half (AI analysis, Notion, email)                                                     |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node**  
   - Type: Schedule Trigger  
   - Configure it to run daily (default interval)  
   - No credentials needed  

2. **Create a Set node named "Define Keywords And Subreddits"**  
   - Fields:  
     - `keywords`: array of strings, e.g., ["competitor", "intelligence"]  
     - `search_all_subs`: boolean, false to search specific subreddits  
     - `subreddits`: array of subreddit strings, e.g., ["saas", "solopreneur", "b2bsaas", "indiehackers"]  
   - Connect Schedule Trigger output to this node  

3. **Create a Split Out node named "Split Out Keywords"**  
   - Set to split on the field "keywords"  
   - Connect "Define Keywords And Subreddits" output to this node  

4. **Create a Set node named "Define Relevance Criteria"**  
   - Single string field `RELEVANCE_CRITERIA` with value "Discussions should be related to competitive intelligence."  
   - Connect "Split Out Keywords" output to this node  

5. **Create a Set node named "Define Instructions For Generating Comments"**  
   - Single string field `COMMENT_INSTRUCTIONS` with value:  
     "Acknowledge the challenges users face and offer clear, helpful solutions. Generate a brief comment and don't use em dash or hyphens."  
   - Connect "Define Relevance Criteria" output to this node  

6. **Create an HTTP Request node named "Search Reddit"**  
   - Method: GET  
   - URL: Use expression to dynamically build URL:  
     ```
     {{$json.search_all_subs ? "https://www.reddit.com/search.json" : "https://www.reddit.com/r/" + $json.subreddits.join("+") + "/search.json"}}
     ```  
   - Query parameters:  
     - q: current keyword (expression from Split Out Keywords node)  
     - restrict_sr: on  
     - sort: new  
     - t: day  
   - Connect "Define Instructions For Generating Comments" output to this node  

7. **Create a Filter node named "Filter Reddit Items With No Posts"**  
   - Condition: Pass if `data.dist` not equals 0  
   - Connect "Search Reddit" output to this node  

8. **Create an Aggregate node named "Aggregate Reddit Items"**  
   - Field to aggregate: `data.children`  
   - Connect "Filter Reddit Items With No Posts" output to this node  

9. **Create a Code node named "Combine Posts Into A Single Array"**  
   - JavaScript code: flatten all `children` arrays into a single `posts` array  
   - Connect "Aggregate Reddit Items" output to this node  

10. **Create a Split Out node named "Split Out Posts"**  
    - Split on `posts` field  
    - Connect "Combine Posts Into A Single Array" output to this node  

11. **Create an OpenAI node named "Analyze Each Post"**  
    - Model: GPT-5-Mini  
    - Prompt: Include Relevance Criteria, Comment Instructions, Post Title, Post Body from previous nodes (use expressions)  
    - Output format: JSON only with `reasoning`, `relevance_score` (1-10), `comment` fields  
    - Connect "Split Out Posts" output to this node  
    - Set credentials for OpenAI API  

12. **Create a Code node named "Add Relevance Score And Comment To Each Post"**  
    - Logic: Map GPT outputs to original post data by index, add `relevanceScore` and `generatedComment` fields  
    - Connect "Analyze Each Post" output to this node  

13. **Create an Aggregate node named "Aggregate Posts"**  
    - Aggregate all incoming items into `posts` field  
    - Connect "Add Relevance Score And Comment To Each Post" output to this node  

14. **Create a Code node named "Generate HTML Email"**  
    - JavaScript: Generate styled HTML email with keywords highlighted, snippet extraction, relevance scores, AI comments, and post metadata  
    - Connect "Aggregate Posts" output to this node  

15. **Create a Split Out node named "Split Out Posts Into Items"**  
    - Split on `posts` field  
    - Connect "Generate HTML Email" output to this node  

16. **Create a Notion node named "Add Each Post to Notion Database"**  
    - Resource: databasePage  
    - Database ID: your Notion database ID for Reddit posts  
    - Map properties: Title, Body, Relevance Score, Generated Comment, Subreddit, Upvote Ratio, Upvotes, Down Votes, Created At, Post ID, Author, Link  
    - Connect "Split Out Posts Into Items" output to this node  
    - Set Notion API credentials with write access  

17. **Create a Gmail node named "Send a message"** (optional)  
    - Recipient: Your email address  
    - Subject: "New Reddit Discussions Found"  
    - Message: Use HTML content from "Generate HTML Email" node  
    - Connect "Generate HTML Email" output to this node  
    - Set Gmail OAuth2 credentials  

18. **Connect nodes according to the described flow**  
    - Schedule Trigger → Define Keywords And Subreddits → Split Out Keywords → Define Relevance Criteria → Define Instructions For Generating Comments → Search Reddit → Filter Reddit Items With No Posts → Aggregate Reddit Items → Combine Posts Into A Single Array → Split Out Posts → Analyze Each Post → Add Relevance Score And Comment To Each Post → Aggregate Posts → Generate HTML Email → (Split Out Posts Into Items → Add Each Post to Notion Database) and (Send a message)  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Context or Link                                                   |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------|
| This workflow runs daily to scan Reddit for posts matching your keywords—in specific subreddits or site-wide. It uses Reddit's public API (no credentials needed), scores relevance with GPT-5-Mini, generates comments, saves results to a Notion database, and optionally emails a summary. Setup requires customizing keywords, subreddits, OpenAI API key, Notion integration, and optionally Gmail credentials. Test thoroughly before live deployment. | Workflow overview and setup instructions (Sticky Note4)         |
| To search all Reddit subreddits, toggle `search_all_subs` to true in the "Define Keywords And Subreddits" node. Otherwise, specify subreddits in the array.                                                                                                                           | Sticky Note5                                                     |
| The Notion database template used can be found here: [Notion Page](https://scoutnow.notion.site/2adc5676482480ccbce6e96af0ea07c1) — duplicate it and configure your integration secret accordingly. | Sticky Note6                                                     |
| For support or questions, contact via Email: hello@scoutnow.app or Twitter: [@ScoutNowApp](https://x.com/ScoutNowApp)                                                                                                                                                                                                                         | Contact info from Sticky Note4                                   |

---

**Disclaimer:** The text provided derives exclusively from an automated n8n workflow. It fully complies with content policies and includes no illegal, offensive, or protected material. All data handled is legal and public.