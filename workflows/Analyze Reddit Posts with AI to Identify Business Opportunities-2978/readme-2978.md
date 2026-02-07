Analyze Reddit Posts with AI to Identify Business Opportunities

https://n8nworkflows.xyz/workflows/analyze-reddit-posts-with-ai-to-identify-business-opportunities-2978


# Analyze Reddit Posts with AI to Identify Business Opportunities

### 1. Workflow Overview

This workflow automates the process of identifying viable business opportunities from trending Reddit posts by leveraging AI models. It targets entrepreneurs and market researchers who want to save time and improve consistency in monitoring Reddit discussions for unmet customer needs and business ideas.

The workflow is logically divided into the following blocks:

- **1.1 Data Collection**: Fetches recent popular Reddit posts from specified subreddits and filters them based on engagement metrics and recency.
- **1.2 Content Selection and Preparation**: Extracts key fields from filtered posts and determines if posts describe business-related problems or needs.
- **1.3 AI Analysis and Summarization**: Uses multiple OpenAI GPT-4o-mini models to analyze posts, generate summaries, suggest business solutions, and perform sentiment analysis.
- **1.4 Sentiment-Based Draft Email Creation**: Categorizes posts by sentiment and drafts Gmail messages accordingly.
- **1.5 Results Consolidation and Output**: Merges AI-generated insights and outputs structured data to Google Sheets for further review and decision-making.

---

### 2. Block-by-Block Analysis

#### 2.1 Data Collection

- **Overview:**  
  Retrieves recent popular Reddit posts from target subreddits using keyword search and filters them by engagement (upvotes), content presence, and recency (within 180 days).

- **Nodes Involved:**  
  - When clicking ‘Test workflow’ (Manual Trigger)  
  - Get Posts (Reddit node)  
  - Filter Posts By Features (IF node)  
  - Select Key Fields (Set node)  
  - Merge Input (Merge node)  
  - Sticky Note (Documentation)

- **Node Details:**

  - **When clicking ‘Test workflow’**  
    - Type: Manual Trigger  
    - Role: Entry point to start the workflow manually for testing or on-demand runs.  
    - Inputs: None  
    - Outputs: Triggers "Get Posts" node.  
    - Edge cases: None significant; manual trigger.

  - **Get Posts**  
    - Type: Reddit node  
    - Role: Searches the "smallbusiness" subreddit for posts containing "looking for a solution", limited to 20 posts sorted by "hot".  
    - Configuration: OAuth2 Reddit credentials required.  
    - Inputs: Trigger from manual node.  
    - Outputs: List of Reddit posts with metadata.  
    - Edge cases: API rate limits, authentication errors, empty results.

  - **Filter Posts By Features**  
    - Type: IF node  
    - Role: Filters posts where upvotes > 2, selftext is not empty, and post creation date is within last 180 days.  
    - Key expressions:  
      - `{{$json.ups}} > 2`  
      - `{{$json.selftext}}` not empty  
      - `DateTime.fromSeconds($json.created).toISO() > $today.minus(180,'days').toISO()`  
    - Inputs: Reddit posts from "Get Posts".  
    - Outputs: Passes filtered posts to "Select Key Fields".  
    - Edge cases: Posts missing expected fields, date parsing errors.

  - **Select Key Fields**  
    - Type: Set node  
    - Role: Extracts and renames key fields for downstream processing: upvotes, subreddit subscribers, post content, URL, and post date (converted to ISO).  
    - Key expressions:  
      - `{{$json.ups}}` → upvotes  
      - `{{$json.subreddit_subscribers}}` → subreddit_subscribers  
      - `{{$json.selftext}}` → postcontent  
      - `{{$json.url}}` → url  
      - `DateTime.fromSeconds($json.created).toISO()` → date  
    - Inputs: Filtered posts.  
    - Outputs: Cleaned and structured post data.  
    - Edge cases: Missing fields, type mismatches.

  - **Merge Input**  
    - Type: Merge node (combine mode)  
    - Role: Combines input streams by position to prepare data for AI analysis.  
    - Inputs: From "Select Key Fields" and from "Analysis Content By AI" (see next block).  
    - Outputs: Combined data for further processing.  
    - Edge cases: Mismatched input lengths.

  - **Sticky Note**  
    - Content:  
      ```
      # Data Collection
      ## Retrieves recent popular posts from specified Reddit communities
      ## Filters content by engagement metrics and keywords
      ```  
    - Role: Documentation only.

---

#### 2.2 Content Selection and Preparation

- **Overview:**  
  Determines if posts describe business-related problems or needs using AI, filters posts accordingly, and prepares data for summarization and solution generation.

- **Nodes Involved:**  
  - Analysis Content By AI (LangChain Agent)  
  - Filter Posts By Content (IF node)  
  - Post Summarization (OpenAI Chat Model)  
  - Find Proper Solutions (OpenAI OpenAI node)  
  - Merge 3 Inputs (Merge node)  
  - Sticky Note2 (Documentation)

- **Node Details:**

  - **Analysis Content By AI**  
    - Type: LangChain Agent node  
    - Role: Uses conversational AI to classify if a Reddit post describes a business problem or need.  
    - Configuration: Prompt asks for "yes" or "no" answer based on post content.  
    - Input: `{{$json.postcontent}}` from "Select Key Fields".  
    - Output: Field `output` with "yes" or "no".  
    - Edge cases: Ambiguous posts, AI misclassification, API errors.

  - **Filter Posts By Content**  
    - Type: IF node  
    - Role: Passes only posts classified as "yes" (business problem/need) for further processing.  
    - Condition: `{{$json.output}} === 'yes'`  
    - Inputs: From "Merge Input".  
    - Outputs: To "Post Summarization", "Find Proper Solutions", "Post Sentiment Analysis", and "Merge 3 Inputs".  
    - Edge cases: Filtering logic errors.

  - **Post Summarization**  
    - Type: OpenAI Chat Model (LangChain)  
    - Role: Summarizes the Reddit post content into concise text.  
    - Model: GPT-4o-mini  
    - Input: Post content.  
    - Output: Summary text in `response.text`.  
    - Edge cases: API timeouts, incomplete summaries.

  - **Find Proper Solutions**  
    - Type: OpenAI OpenAI node  
    - Role: Suggests a business idea or service addressing the problem described in the Reddit post.  
    - Model: GPT-4o-mini  
    - Prompt: "Based on the following Reddit post, suggest a business idea or service..."  
    - Input: Post content.  
    - Output: Suggested solution in `message.content`.  
    - Edge cases: Irrelevant or generic suggestions, API errors.

  - **Merge 3 Inputs**  
    - Type: Merge node (combine mode, 3 inputs)  
    - Role: Combines outputs from summarization, solution generation, and sentiment analysis for final aggregation.  
    - Inputs: From "Post Summarization", "Find Proper Solutions", and "Post Sentiment Analysis".  
    - Outputs: To "Output The Results".  
    - Edge cases: Input length mismatches.

  - **Sticky Note2**  
    - Content:  
      ```
      # Analysis Content
      ## Emerging market needs
      ## Underserved customer demands
      ```  
    - Role: Documentation only.

---

#### 2.3 AI Sentiment Analysis and Draft Email Creation

- **Overview:**  
  Performs sentiment analysis on posts and drafts Gmail messages categorized by sentiment to facilitate follow-up or review.

- **Nodes Involved:**  
  - Post Sentiment Analysis (LangChain Sentiment Analysis)  
  - Positive Posts Draft (Gmail node)  
  - Neutral Posts Draft (Gmail node)  
  - Negative Posts Draft (Gmail node)  
  - Sticky Note1 (Documentation)

- **Node Details:**

  - **Post Sentiment Analysis**  
    - Type: LangChain Sentiment Analysis node  
    - Role: Analyzes sentiment of post content (`{{$json.postcontent}}`).  
    - Output: Routes to one of three Gmail draft nodes based on sentiment (positive, neutral, negative).  
    - Edge cases: Ambiguous sentiment, API failures.

  - **Positive Posts Draft**  
    - Type: Gmail node (draft resource)  
    - Role: Creates draft email with subject "Positive Post" and post content as message body.  
    - Credentials: Gmail OAuth2 required.  
    - Edge cases: Gmail API quota, auth errors.

  - **Neutral Posts Draft**  
    - Same as above, subject "Neutral Post".

  - **Negative Posts Draft**  
    - Same as above, subject "Negative Post".

  - **Sticky Note1**  
    - Content:  
      ```
      # Post Sentiment Analysis
      ## 
      ```  
    - Role: Documentation only.

---

#### 2.4 Results Consolidation and Output

- **Overview:**  
  Aggregates all AI-generated insights and outputs structured data to a Google Sheet for review and decision-making.

- **Nodes Involved:**  
  - Output The Results (Google Sheets node)  
  - Sticky Note3 (Documentation)

- **Node Details:**

  - **Output The Results**  
    - Type: Google Sheets node  
    - Role: Appends rows to a specified Google Sheet with columns: Upvotes, Post URL, Post Date, Post Summary, Post Solution, Subreddit Size.  
    - Configuration:  
      - Document ID and Sheet Name set to a specific Google Sheet.  
      - Mapping defines which JSON fields populate which columns.  
    - Credentials: Google Sheets OAuth2 required.  
    - Edge cases: API limits, auth errors, sheet access issues.

  - **Sticky Note3**  
    - Content:  
      ```
      # Insight Generation And Output 
      ## Generates executive summaries of key opportunities
      ## Consolidates findings in Google Sheets
      ```  
    - Role: Documentation only.

---

### 3. Summary Table

| Node Name               | Node Type                          | Functional Role                          | Input Node(s)                   | Output Node(s)                         | Sticky Note                                                                                   |
|-------------------------|----------------------------------|----------------------------------------|--------------------------------|--------------------------------------|----------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’ | Manual Trigger                   | Workflow entry point                    | None                           | Get Posts                            | # Data Collection<br>Retrieves recent popular posts from specified Reddit communities<br>Filters content by engagement metrics and keywords |
| Get Posts               | Reddit                           | Fetch Reddit posts                      | When clicking ‘Test workflow’  | Filter Posts By Features             |                                                                                              |
| Filter Posts By Features | IF                              | Filter posts by upvotes, content, date | Get Posts                      | Select Key Fields                    |                                                                                              |
| Select Key Fields       | Set                             | Extract key post fields                 | Filter Posts By Features        | Merge Input, Analysis Content By AI  |                                                                                              |
| Merge Input             | Merge                           | Combine data streams                    | Select Key Fields, Analysis Content By AI | Filter Posts By Content              |                                                                                              |
| Analysis Content By AI  | LangChain Agent                 | Classify posts as business-related or not | Select Key Fields              | Merge Input                         | # Analysis Content<br>Emerging market needs<br>Underserved customer demands                  |
| Filter Posts By Content | IF                              | Filter posts classified as "yes"       | Merge Input                    | Post Summarization, Find Proper Solutions, Post Sentiment Analysis, Merge 3 Inputs |                                                                                              |
| Post Summarization      | OpenAI Chat Model (LangChain)   | Summarize post content                  | Filter Posts By Content        | Merge 3 Inputs                      |                                                                                              |
| Find Proper Solutions   | OpenAI OpenAI                  | Suggest business ideas/solutions        | Filter Posts By Content        | Merge 3 Inputs                      |                                                                                              |
| Post Sentiment Analysis | LangChain Sentiment Analysis    | Analyze sentiment of posts              | Filter Posts By Content        | Positive Posts Draft, Neutral Posts Draft, Negative Posts Draft | # Post Sentiment Analysis                                                                    |
| Positive Posts Draft    | Gmail                          | Draft email for positive sentiment posts | Post Sentiment Analysis        | None                              |                                                                                              |
| Neutral Posts Draft     | Gmail                          | Draft email for neutral sentiment posts | Post Sentiment Analysis        | None                              |                                                                                              |
| Negative Posts Draft    | Gmail                          | Draft email for negative sentiment posts | Post Sentiment Analysis        | None                              |                                                                                              |
| Merge 3 Inputs          | Merge                           | Combine AI outputs                      | Post Summarization, Find Proper Solutions, Post Sentiment Analysis | Output The Results                 |                                                                                              |
| Output The Results      | Google Sheets                  | Append consolidated data to Google Sheet | Merge 3 Inputs                 | None                              | # Insight Generation And Output<br>Generates executive summaries of key opportunities<br>Consolidates findings in Google Sheets |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Name: "When clicking ‘Test workflow’"  
   - Type: Manual Trigger  
   - Purpose: To manually start the workflow.

2. **Add Reddit Node**  
   - Name: "Get Posts"  
   - Type: Reddit  
   - Credentials: Configure Reddit OAuth2 credentials.  
   - Parameters:  
     - Operation: Search  
     - Subreddit: `smallbusiness`  
     - Keyword: `looking for a solution`  
     - Limit: 20  
     - Sort: hot  
   - Connect output of Manual Trigger to this node.

3. **Add IF Node to Filter Posts by Features**  
   - Name: "Filter Posts By Features"  
   - Type: IF  
   - Conditions (AND):  
     - Upvotes (`$json.ups`) > 2  
     - Selftext (`$json.selftext`) is not empty  
     - Created date (`DateTime.fromSeconds($json.created).toISO()`) after 180 days ago (`$today.minus(180,'days').toISO()`)  
   - Connect output of "Get Posts" to this node.

4. **Add Set Node to Select Key Fields**  
   - Name: "Select Key Fields"  
   - Type: Set  
   - Assignments:  
     - upvotes = `{{$json.ups}}` (string)  
     - subreddit_subscribers = `{{$json.subreddit_subscribers}}` (number)  
     - postcontent = `{{$json.selftext}}` (string)  
     - url = `{{$json.url}}` (string)  
     - date = `DateTime.fromSeconds($json.created).toISO()` (string)  
   - Connect output of "Filter Posts By Features" to this node.

5. **Add LangChain Agent Node for Business Problem Classification**  
   - Name: "Analysis Content By AI"  
   - Type: LangChain Agent  
   - Parameters:  
     - Text prompt:  
       ```
       Decide whether this reddit post is describing a business-related problem or a need for a solution. The post should mention a specific challenge or requirement that a business is trying to address.
       Reddit post: {{ $json.postcontent }}
       Is this post about a business problem or need for a solution? Output only yes or no
       ```  
     - Agent: conversationalAgent  
   - Credentials: OpenAI API (GPT-4o-mini)  
   - Connect output of "Select Key Fields" to this node.

6. **Add Merge Node to Combine Inputs**  
   - Name: "Merge Input"  
   - Type: Merge (combine mode)  
   - Connect outputs of "Select Key Fields" and "Analysis Content By AI" to this node.

7. **Add IF Node to Filter Posts by Content**  
   - Name: "Filter Posts By Content"  
   - Type: IF  
   - Condition: `{{$json.output}} === 'yes'`  
   - Connect output of "Merge Input" to this node.

8. **Add OpenAI Chat Model Node for Post Summarization**  
   - Name: "Post Summarization"  
   - Type: LangChain OpenAI Chat Model  
   - Model: GPT-4o-mini  
   - Connect output of "Filter Posts By Content" to this node.

9. **Add OpenAI OpenAI Node for Business Solution Suggestion**  
   - Name: "Find Proper Solutions"  
   - Type: OpenAI  
   - Model: GPT-4o-mini  
   - Prompt:  
     ```
     Based on the following Reddit post, suggest a business idea or service that I could create to help this problem for this business and others with similar needs.

     Reddit post: "{{ $json.postcontent }}"

     Provide a concise description of a business idea or service that would address this issue effectively for multiple businesses facing similar challenges.
     ```  
   - Connect output of "Filter Posts By Content" to this node.

10. **Add LangChain Sentiment Analysis Node**  
    - Name: "Post Sentiment Analysis"  
    - Type: LangChain Sentiment Analysis  
    - Input Text: `{{$json.postcontent}}`  
    - Connect output of "Filter Posts By Content" to this node.

11. **Add Gmail Nodes for Draft Emails**  
    - Names: "Positive Posts Draft", "Neutral Posts Draft", "Negative Posts Draft"  
    - Type: Gmail (resource: draft)  
    - Parameters:  
      - Subject: "Positive Post", "Neutral Post", "Negative Post" respectively  
      - Message: `{{$json.postcontent}}`  
    - Credentials: Gmail OAuth2  
    - Connect outputs of "Post Sentiment Analysis" to these nodes based on sentiment.

12. **Add Merge Node to Combine AI Outputs**  
    - Name: "Merge 3 Inputs"  
    - Type: Merge (combine mode, 3 inputs)  
    - Connect outputs of "Post Summarization", "Find Proper Solutions", and "Post Sentiment Analysis" to this node.

13. **Add Google Sheets Node to Output Results**  
    - Name: "Output The Results"  
    - Type: Google Sheets  
    - Operation: Append  
    - Document ID: Set to target Google Sheet ID  
    - Sheet Name: Set to target sheet (e.g., gid=0)  
    - Columns Mapping:  
      - Upvotes → `{{$json.upvotes}}`  
      - Post_url → `{{$json.url}}`  
      - Post_date → `{{$json.date}}`  
      - Post_summary → `{{$json.response.text}}` (from summarization)  
      - Post_solution → `{{$json.message.content}}` (from solution suggestion)  
      - Subreddit_size → `{{$json.subreddit_subscribers}}`  
    - Credentials: Google Sheets OAuth2  
    - Connect output of "Merge 3 Inputs" to this node.

---

### 5. General Notes & Resources

| Note Content                                                                                                   | Context or Link                                                                                         |
|---------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| Use Reddit, Google, and OpenAI credentials for API access.                                                    | Setup instructions                                                                                     |
| Configure target subreddits in the "Get Posts" node to adjust data sources.                                   | Customization tip                                                                                      |
| To change data sources, replace Reddit trigger with Twitter/X or Hacker News API.                             | Workflow adaptability                                                                                  |
| Adjust scoring thresholds in the "Opportunity Calculator" node (not present here but suggested for extension).| Customization tip                                                                                      |
| Add integrations such as Slack alerts or AI document generation for enhanced automation.                      | Suggested workflow enhancements                                                                       |
| Workflow saves entrepreneurs 10+ hours weekly by automating market research on Reddit.                        | Use case summary                                                                                       |
| Workflow uses GPT-4o-mini model for AI tasks, requiring OpenAI API credentials.                               | Model and credential requirement                                                                       |
| Gmail OAuth2 credentials are required for drafting emails.                                                    | Credential requirement                                                                                 |
| Google Sheets OAuth2 credentials are required for outputting results.                                         | Credential requirement                                                                                 |
| Sticky Notes in workflow provide documentation and block explanations.                                       | Helpful for understanding workflow structure                                                         |
| Workflow tested with sample Reddit posts containing business problems and AI-generated business ideas.       | Sample data available in workflow pinData                                                             |

---

This comprehensive documentation enables advanced users and AI agents to understand, reproduce, and modify the workflow, anticipate potential errors, and integrate it with other systems effectively.