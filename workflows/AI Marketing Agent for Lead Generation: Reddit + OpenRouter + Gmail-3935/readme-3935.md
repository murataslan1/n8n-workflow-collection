AI Marketing Agent for Lead Generation: Reddit + OpenRouter + Gmail

https://n8nworkflows.xyz/workflows/ai-marketing-agent-for-lead-generation--reddit---openrouter---gmail-3935


# AI Marketing Agent for Lead Generation: Reddit + OpenRouter + Gmail

### 1. Workflow Overview

This n8n workflow, titled **AI Marketing Agent for Lead Generation: Reddit + OpenRouter + Gmail**, is designed to automate lead generation by monitoring Reddit posts relevant to a user’s business or industry. It analyzes user-submitted websites to extract industry-specific keywords, searches Reddit for matching posts, filters and evaluates these posts using AI, stores relevant leads in Google Sheets, and finally sends a professional summary email to the user.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Collects user input (website URL and email) via a form trigger.
- **1.2 Website Analysis & Keyword Extraction:** Uses AI to analyze the submitted website and extract relevant keywords.
- **1.3 Reddit Post Retrieval & Filtering:** Searches Reddit for posts containing extracted keywords, removes duplicates, and filters posts based on engagement and recency criteria.
- **1.4 AI Lead Analysis & Summarization:** Uses OpenRouter’s GPT-4.1-mini model to evaluate post relevance and summarize key points.
- **1.5 Data Storage & Email Preparation:** Stores relevant leads in Google Sheets and generates a formatted HTML email.
- **1.6 Email Delivery:** Sends the generated email to the user’s provided email address via Gmail.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:** Receives user input via a form submission containing a website URL and an email address.
- **Nodes Involved:** `Form`
- **Node Details:**
  - **Form**
    - Type: Form Trigger
    - Role: Entry point for the workflow; triggers on form submission.
    - Configuration: Uses a webhook with ID `52e97f2f-4224-440b-8339-a28b09f86efb`.
    - Inputs: External HTTP form submission.
    - Outputs: Passes form data (website URL and email) to the next node.
    - Edge Cases: Form submission failures, missing or invalid inputs.
    - Notes: This node initiates the entire lead generation process.

#### 1.2 Website Analysis & Keyword Extraction

- **Overview:** Analyzes the submitted website URL to determine the industry and extract relevant keywords using AI.
- **Nodes Involved:** `Keyword Analyst`, `OpenRouter Chat Model`, `HTTP Request`, `Structured Output Parser`, `Split Out`
- **Node Details:**
  - **Keyword Analyst**
    - Type: Langchain AI Agent
    - Role: Orchestrates AI-driven analysis of the website content.
    - Configuration: Uses AI language model and tools to analyze the website.
    - Inputs: Data from `Form`.
    - Outputs: Extracted keywords and industry insights.
    - Edge Cases: AI response errors, API timeouts, malformed website URLs.
  - **OpenRouter Chat Model**
    - Type: OpenRouter GPT-4.1-mini Chat Model
    - Role: Provides the AI language model for `Keyword Analyst`.
    - Configuration: Connected as the AI language model.
    - Inputs: Prompts from `Keyword Analyst`.
    - Outputs: AI-generated text responses.
    - Edge Cases: Authentication errors with OpenRouter, rate limits.
  - **HTTP Request**
    - Type: HTTP Request Tool
    - Role: Fetches website content or metadata for analysis.
    - Configuration: Used by `Keyword Analyst` as an AI tool.
    - Inputs: URL from form data.
    - Outputs: Website content or metadata.
    - Edge Cases: Network errors, HTTP errors (404, 500), slow responses.
  - **Structured Output Parser**
    - Type: Langchain Structured Output Parser
    - Role: Parses AI responses into structured data (e.g., JSON).
    - Configuration: Used by `Keyword Analyst` to interpret AI output.
    - Inputs: Raw AI text.
    - Outputs: Structured keyword and industry data.
    - Edge Cases: Parsing errors if AI output format changes.
  - **Split Out**
    - Type: Split Out
    - Role: Splits array data into individual items for processing.
    - Inputs: Keywords array from `Keyword Analyst`.
    - Outputs: Individual keywords to be used for Reddit search.
    - Edge Cases: Empty keyword lists.

#### 1.3 Reddit Post Retrieval & Filtering

- **Overview:** Searches Reddit for posts matching extracted keywords, removes duplicates, and filters posts based on engagement criteria.
- **Nodes Involved:** `Get Posts`, `Remove Duplicates`, `Filter Posts by Criteria`, `Pick Fields to Keep`
- **Node Details:**
  - **Get Posts**
    - Type: Reddit Node
    - Role: Searches Reddit posts using keywords.
    - Configuration: Uses OAuth2 credentials; searches posts with filters (e.g., upvotes > 15, non-empty text, posted within 90 days).
    - Inputs: Keywords from `Split Out`.
    - Outputs: Raw Reddit posts matching criteria.
    - Edge Cases: Reddit API rate limits, authentication errors, empty search results.
  - **Remove Duplicates**
    - Type: Remove Duplicates
    - Role: Ensures unique Reddit posts by removing duplicates.
    - Inputs: Posts from `Get Posts`.
    - Outputs: Deduplicated posts.
    - Edge Cases: Incorrect duplicate criteria causing data loss or retention.
  - **Filter Posts by Criteria**
    - Type: If Node
    - Role: Filters posts to keep only those meeting custom engagement metrics.
    - Configuration: Conditions check upvotes > 15, non-empty content, and post date within 90 days.
    - Inputs: Posts from `Remove Duplicates`.
    - Outputs: Filtered posts.
    - Edge Cases: Posts with missing fields, date parsing errors.
  - **Pick Fields to Keep**
    - Type: Set Node
    - Role: Selects relevant fields from Reddit posts for further processing.
    - Inputs: Filtered posts.
    - Outputs: Cleaned post data with necessary fields.
    - Edge Cases: Missing expected fields.

#### 1.4 AI Lead Analysis & Summarization

- **Overview:** Uses AI to analyze each Reddit post’s relevance and summarize key points.
- **Nodes Involved:** `Competitor Analyst`, `OpenRouter `, `Structured Output Parser2`, `Merge Outputs`, `Rename Fields from AI Agent' Output`
- **Node Details:**
  - **Competitor Analyst**
    - Type: Langchain AI Agent
    - Role: Analyzes each post to determine lead relevance and summarizes content.
    - Inputs: Cleaned Reddit posts from `Pick Fields to Keep`.
    - Outputs: AI-analyzed post data.
    - Edge Cases: AI API errors, incomplete data.
  - **OpenRouter **
    - Type: OpenRouter GPT-4.1-mini Chat Model
    - Role: Provides AI language model for `Competitor Analyst`.
    - Inputs: Prompts from `Competitor Analyst`.
    - Outputs: AI-generated analysis and summaries.
    - Edge Cases: Same as previous OpenRouter node.
  - **Structured Output Parser2**
    - Type: Langchain Structured Output Parser
    - Role: Parses AI responses from `Competitor Analyst` into structured data.
    - Inputs: Raw AI text.
    - Outputs: Structured analysis data.
    - Edge Cases: Parsing failures.
  - **Merge Outputs**
    - Type: Merge
    - Role: Combines outputs from AI analysis and other nodes.
    - Inputs: AI analyzed data streams.
    - Outputs: Merged dataset.
    - Edge Cases: Data misalignment.
  - **Rename Fields from AI Agent' Output**
    - Type: Set Node
    - Role: Renames fields from AI output for consistency.
    - Inputs: Merged data.
    - Outputs: Standardized dataset.
    - Edge Cases: Field name mismatches.

#### 1.5 Data Storage & Email Preparation

- **Overview:** Stores relevant leads in Google Sheets and generates a professional HTML email summarizing the leads.
- **Nodes Involved:** `Filter Relevant Posts`, `Append Data`, `Generate Email HTML`
- **Node Details:**
  - **Filter Relevant Posts**
    - Type: If Node
    - Role: Filters posts marked relevant by AI for storage and email.
    - Inputs: Standardized dataset.
    - Outputs: Relevant posts.
    - Edge Cases: Missing relevance flags.
  - **Append Data**
    - Type: Google Sheets Node
    - Role: Appends relevant lead data to a Google Sheet.
    - Configuration: Uses OAuth2 credentials; specifies spreadsheet and sheet.
    - Inputs: Relevant posts.
    - Outputs: Confirmation of data append.
    - Edge Cases: API authentication errors, quota limits.
  - **Generate Email HTML**
    - Type: Code Node
    - Role: Generates a formatted HTML email summarizing leads.
    - Inputs: Data from Google Sheets append confirmation or directly from relevant posts.
    - Outputs: HTML email content.
    - Edge Cases: Code execution errors, malformed HTML.

#### 1.6 Email Delivery

- **Overview:** Sends the generated HTML email to the user’s provided email address.
- **Nodes Involved:** `Send to your email`
- **Node Details:**
  - **Send to your email**
    - Type: Gmail Node
    - Role: Sends an email with the lead summary to the user.
    - Configuration: Uses OAuth2 Gmail credentials.
    - Inputs: HTML content from `Generate Email HTML` and user email from form.
    - Outputs: Email sending confirmation.
    - Edge Cases: Authentication errors, email delivery failures, invalid email addresses.

---

### 3. Summary Table

| Node Name                       | Node Type                         | Functional Role                          | Input Node(s)                      | Output Node(s)                     | Sticky Note                           |
|--------------------------------|----------------------------------|----------------------------------------|----------------------------------|----------------------------------|-------------------------------------|
| Form                           | Form Trigger                     | Receives user website URL and email    | -                                | Keyword Analyst                  |                                     |
| Keyword Analyst                | Langchain AI Agent               | Analyzes website and extracts keywords | Form                             | Split Out                       |                                     |
| OpenRouter Chat Model          | OpenRouter GPT-4.1-mini Model    | AI language model for keyword analysis | Keyword Analyst (ai_languageModel) | Keyword Analyst (ai_languageModel) |                                     |
| HTTP Request                  | HTTP Request Tool                | Fetches website content                 | Keyword Analyst (ai_tool)         | Keyword Analyst (ai_tool)         |                                     |
| Structured Output Parser       | Langchain Structured Output Parser | Parses AI keyword extraction output    | Keyword Analyst (ai_outputParser) | Keyword Analyst (ai_outputParser) |                                     |
| Split Out                     | Split Out                       | Splits keywords array into items       | Keyword Analyst                  | Get Posts                       |                                     |
| Get Posts                     | Reddit Node                     | Searches Reddit posts by keywords      | Split Out                       | Remove Duplicates               |                                     |
| Remove Duplicates             | Remove Duplicates               | Removes duplicate Reddit posts         | Get Posts                       | Filter Posts by Criteria        |                                     |
| Filter Posts by Criteria      | If Node                        | Filters posts by engagement and recency | Remove Duplicates               | Pick Fields to Keep             |                                     |
| Pick Fields to Keep           | Set Node                      | Selects relevant Reddit post fields    | Filter Posts by Criteria        | Competitor Analyst, Merge Outputs |                                     |
| Competitor Analyst            | Langchain AI Agent             | Analyzes post relevance and summarizes | Pick Fields to Keep             | Merge Outputs                  |                                     |
| OpenRouter                   | OpenRouter GPT-4.1-mini Model  | AI language model for competitor analysis | Competitor Analyst (ai_languageModel) | Competitor Analyst (ai_languageModel) |                                     |
| Structured Output Parser2     | Langchain Structured Output Parser | Parses AI competitor analysis output   | Competitor Analyst (ai_outputParser) | Competitor Analyst (ai_outputParser) |                                     |
| Merge Outputs                | Merge Node                    | Merges AI analysis outputs              | Pick Fields to Keep, Competitor Analyst | Rename Fields from AI Agent' Output |                                     |
| Rename Fields from AI Agent' Output | Set Node                      | Renames AI output fields for consistency | Merge Outputs                  | Filter Relevant Posts           |                                     |
| Filter Relevant Posts         | If Node                        | Filters posts marked as relevant       | Rename Fields from AI Agent' Output | Append Data                   |                                     |
| Append Data                  | Google Sheets Node             | Appends relevant leads to Google Sheets | Filter Relevant Posts           | Generate Email HTML            |                                     |
| Generate Email HTML           | Code Node                     | Generates HTML email content            | Append Data                    | Send to your email             |                                     |
| Send to your email           | Gmail Node                    | Sends lead summary email to user        | Generate Email HTML             | -                              |                                     |
| Sticky Note                  | Sticky Note                   | Notes/Comments (empty in this workflow) | -                              | -                              |                                     |
| Sticky Note1                 | Sticky Note                   | Notes/Comments (empty)                   | -                              | -                              |                                     |
| Sticky Note2                 | Sticky Note                   | Notes/Comments (empty)                   | -                              | -                              |                                     |
| Sticky Note3                 | Sticky Note                   | Notes/Comments (empty)                   | -                              | -                              |                                     |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Form Trigger Node**
   - Type: Form Trigger
   - Configure webhook with a unique ID.
   - Expect inputs: website URL and user email.
   - Position as workflow entry point.

2. **Add Keyword Analyst Node**
   - Type: Langchain AI Agent
   - Connect input from Form node.
   - Configure to analyze website content and extract keywords.
   - Set AI language model to OpenRouter Chat Model node.
   - Add HTTP Request tool node for fetching website content.
   - Add Structured Output Parser node to parse AI output.
   - Connect outputs to Split Out node.

3. **Add OpenRouter Chat Model Node**
   - Type: OpenRouter GPT-4.1-mini Chat Model
   - Set API key credential from OpenRouter.
   - Connect as AI language model for Keyword Analyst.

4. **Add HTTP Request Node**
   - Type: HTTP Request Tool
   - Configure to fetch website content from URL.
   - Connect as AI tool in Keyword Analyst.

5. **Add Structured Output Parser Node**
   - Type: Langchain Structured Output Parser
   - Configure to parse AI output into structured keywords.
   - Connect as AI output parser in Keyword Analyst.

6. **Add Split Out Node**
   - Type: Split Out
   - Connect input from Keyword Analyst.
   - Outputs individual keywords for Reddit search.

7. **Add Get Posts Node**
   - Type: Reddit Node
   - Configure OAuth2 credentials for Reddit API.
   - Use keywords from Split Out node to search posts.
   - Set filters for upvotes > 15, non-empty text, posts within last 90 days.

8. **Add Remove Duplicates Node**
   - Type: Remove Duplicates
   - Connect input from Get Posts.
   - Configure to remove duplicate Reddit posts based on unique post ID.

9. **Add Filter Posts by Criteria Node**
   - Type: If Node
   - Connect input from Remove Duplicates.
   - Configure conditions:
     - Upvotes > 15
     - Text content is not empty
     - Post date within last 90 days

10. **Add Pick Fields to Keep Node**
    - Type: Set Node
    - Connect input from Filter Posts by Criteria.
    - Select relevant fields such as post title, author, URL, date, and content.

11. **Add Competitor Analyst Node**
    - Type: Langchain AI Agent
    - Connect input from Pick Fields to Keep.
    - Configure to analyze post relevance and summarize key points.
    - Set AI language model to OpenRouter node.
    - Use Structured Output Parser2 node to parse AI output.

12. **Add OpenRouter Node**
    - Type: OpenRouter GPT-4.1-mini Chat Model
    - Use same OpenRouter API credentials.
    - Connect as AI language model for Competitor Analyst.

13. **Add Structured Output Parser2 Node**
    - Type: Langchain Structured Output Parser
    - Parse AI output from Competitor Analyst into structured data.

14. **Add Merge Outputs Node**
    - Type: Merge
    - Connect inputs from Pick Fields to Keep and Competitor Analyst.
    - Merge data streams for further processing.

15. **Add Rename Fields from AI Agent' Output Node**
    - Type: Set Node
    - Connect input from Merge Outputs.
    - Rename fields to consistent names for downstream nodes.

16. **Add Filter Relevant Posts Node**
    - Type: If Node
    - Connect input from Rename Fields node.
    - Filter posts flagged as relevant by AI.

17. **Add Append Data Node**
    - Type: Google Sheets Node
    - Configure OAuth2 credentials for Google Sheets.
    - Specify target spreadsheet and sheet.
    - Append relevant posts data.

18. **Add Generate Email HTML Node**
    - Type: Code Node
    - Connect input from Append Data.
    - Write JavaScript code to generate professional HTML email summarizing leads.

19. **Add Send to your email Node**
    - Type: Gmail Node
    - Configure OAuth2 credentials for Gmail.
    - Connect input from Generate Email HTML.
    - Set recipient email from original form submission.
    - Configure email subject and HTML body.

20. **Connect all nodes as per the flow described in the connections section.**

21. **Test the workflow end-to-end with valid inputs.**

---

### 5. General Notes & Resources

| Note Content                                                                                          | Context or Link                                                                                      |
|-----------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| Full tutorial on building this workflow: https://findleads.agency/blog/n8n-ai-agent-for-lead-generation-using-reddit-openai-gmail | Detailed step-by-step guide for users building the workflow themselves.                             |
| Reddit OAuth 2.0 app creation tutorial: https://youtu.be/zlGXtW4LAK8                                 | Video guide for setting up Reddit API credentials.                                                 |
| OpenRouter API key generation tutorial: https://youtu.be/Cq5Y3zpEhlc                                 | Video guide for obtaining OpenRouter API key.                                                      |
| Google Sheets OAuth2 setup recommendation: enable Sheets API and create OAuth Client ID with n8n redirect URI | Required for Google Sheets node authentication.                                                    |
| Gmail OAuth2 setup: enable Gmail API and create OAuth credentials in Google Cloud Console            | Required for Gmail node authentication.                                                            |

---

This document provides a detailed and structured reference for understanding, reproducing, and maintaining the AI Marketing Agent workflow for lead generation using Reddit, OpenRouter, and Gmail integrations in n8n.