Auto-Generate MVP Startup Ideas from Reddit with AI & Excel Storage

https://n8nworkflows.xyz/workflows/auto-generate-mvp-startup-ideas-from-reddit-with-ai---excel-storage-3824


# Auto-Generate MVP Startup Ideas from Reddit with AI & Excel Storage

### 1. Workflow Overview

The **Reddit MVP Generator** workflow automates the generation of Minimum Viable Product (MVP) startup ideas by mining real user pain points from Reddit posts and comments. It targets entrepreneurs, market researchers, and content creators who want to discover business ideas grounded in authentic community feedback. The workflow fetches trending posts and comments from selected entrepreneurial subreddits, deduplicates previously analyzed posts, uses an AI language model to generate structured MVP ideas, and saves the results into a Microsoft Excel 365 spreadsheet for further use.

The workflow logic is divided into the following blocks:

- **1.1 Input Reception:** User selects the target subreddit via a form trigger.
- **1.2 Reddit Data Retrieval:** Fetch trending posts and associated comments from Reddit.
- **1.3 Deduplication & Post Filtering:** Extract post identifiers, merge with previously used posts, remove duplicates, and filter out already processed posts.
- **1.4 AI Processing:** Loop over filtered posts, send combined post and comment data to an AI model for MVP idea generation, and parse structured AI output.
- **1.5 Excel Storage:** Prepare and append the AI-generated MVP ideas as new rows in an Excel 365 spreadsheet.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  This block triggers the workflow via a user-facing form that allows dynamic selection of the subreddit to analyze, enabling flexible targeting without editing the workflow.

- **Nodes Involved:**  
  - Select a subreddit

- **Node Details:**

  - **Select a subreddit**  
    - Type: Form Trigger  
    - Role: Entry point for the workflow; captures user input for subreddit selection.  
    - Configuration: Uses a webhook to receive form submissions; no preset parameters, allowing dynamic subreddit choice.  
    - Inputs: External HTTP request (form submission)  
    - Outputs: Triggers downstream nodes to fetch data based on selected subreddit.  
    - Edge Cases: Missing or invalid subreddit input could cause empty or failed Reddit API calls.  
    - Version: Requires n8n version supporting Form Trigger node (v2.2 or later).

---

#### 1.2 Reddit Data Retrieval

- **Overview:**  
  Fetches trending posts from the selected subreddit and retrieves comments for each post. This block collects raw data for analysis.

- **Nodes Involved:**  
  - Get Trending Posts  
  - Extract subreddits and post ids  
  - Create list of posts  
  - Get Comments  
  - Merge post with comments  
  - Flatten post and comments

- **Node Details:**

  - **Get Trending Posts**  
    - Type: Reddit node  
    - Role: Fetch top trending posts from the subreddit specified by the form trigger.  
    - Configuration: Uses Reddit API with developer credentials; parameters dynamically set from the subreddit input.  
    - Inputs: Trigger from "Select a subreddit" node  
    - Outputs: List of posts with metadata.  
    - Edge Cases: API rate limits, subreddit not found, or empty results.

  - **Extract subreddits and post ids**  
    - Type: Aggregate node  
    - Role: Extracts subreddit names and post IDs from the fetched posts for further processing.  
    - Inputs: Output from "Get Trending Posts"  
    - Outputs: Arrays of subreddit names and post IDs.  
    - Edge Cases: Unexpected data structure or missing fields.

  - **Create list of posts**  
    - Type: Code node (JavaScript)  
    - Role: Constructs an array of post objects combining subreddit and post ID info.  
    - Inputs: Output from "Extract subreddits and post ids"  
    - Outputs: List of post objects.  
    - Edge Cases: Empty input arrays, malformed post data.

  - **Get Comments**  
    - Type: Reddit node  
    - Role: Retrieves comments for each post, including nested threads flattened for analysis.  
    - Configuration: Uses Reddit API with developer credentials; parameters set dynamically per post.  
    - Inputs: Triggered in batch from "Loop over posts" (later in workflow)  
    - Outputs: Comments data for each post.  
    - Edge Cases: API timeouts, deleted comments, or rate limits.

  - **Merge post with comments**  
    - Type: Merge node  
    - Role: Combines post metadata with its corresponding comments for unified processing.  
    - Inputs: Post data and comments data  
    - Outputs: Single combined data object per post.  
    - Edge Cases: Mismatched inputs or missing comments.

  - **Flatten post and comments**  
    - Type: Code node (JavaScript)  
    - Role: Flattens nested comment threads and post data into a format suitable for AI input.  
    - Inputs: Merged post and comments data  
    - Outputs: Flattened, concatenated text or structured data.  
    - Edge Cases: Deeply nested comments, large comment volumes causing performance issues.

---

#### 1.3 Deduplication & Post Filtering

- **Overview:**  
  Prevents reprocessing of posts already analyzed by maintaining and updating a dynamic blocklist stored in Excel. It merges new and used post slugs, removes duplicates, and filters out used posts.

- **Nodes Involved:**  
  - Get used reddit post slugs  
  - Flatten list of slugs  
  - Create post slugs  
  - Merge used post slugs with new post slugs  
  - Create list of all post slugs  
  - Remove duplicate post slugs  
  - Split out post slugs  
  - Update "Used Posts" with new post slugs  
  - Merge new post slugs with post data  
  - Filter out used posts

- **Node Details:**

  - **Get used reddit post slugs**  
    - Type: Microsoft Excel node  
    - Role: Reads the Excel sheet containing previously processed Reddit post slugs.  
    - Inputs: Trigger from "Select a subreddit"  
    - Outputs: List of used post slugs.  
    - Edge Cases: Excel connection errors, empty or corrupted sheet.

  - **Flatten list of slugs**  
    - Type: Aggregate node  
    - Role: Flattens nested arrays of used post slugs into a single list.  
    - Inputs: Output from Excel node  
    - Outputs: Flat array of slugs.  
    - Edge Cases: Unexpected data structures.

  - **Create post slugs**  
    - Type: Code node (JavaScript)  
    - Role: Generates unique identifiers (slugs) for new posts combining subreddit and post ID.  
    - Inputs: Post IDs and subreddits from earlier nodes  
    - Outputs: Array of new post slugs.  
    - Edge Cases: Missing fields causing slug generation failure.

  - **Merge used post slugs with new post slugs**  
    - Type: Merge node  
    - Role: Combines old and new post slugs for deduplication.  
    - Inputs: Flattened used slugs and newly created slugs  
    - Outputs: Combined list of slugs.  
    - Edge Cases: Data mismatch or empty inputs.

  - **Create list of all post slugs**  
    - Type: Code node (JavaScript)  
    - Role: Prepares a unified list of all post slugs for duplicate removal.  
    - Inputs: Merged slugs  
    - Outputs: List for deduplication.  
    - Edge Cases: Empty or malformed input.

  - **Remove duplicate post slugs**  
    - Type: Remove Duplicates node  
    - Role: Eliminates duplicate slugs to avoid reprocessing.  
    - Inputs: List of all post slugs  
    - Outputs: Unique post slugs.  
    - Edge Cases: None typical; check for case sensitivity.

  - **Split out post slugs**  
    - Type: Split Out node  
    - Role: Splits unique slugs for batch processing and updates.  
    - Inputs: Unique post slugs  
    - Outputs: Individual slugs for update and processing.  
    - Edge Cases: Large lists may affect performance.

  - **Update "Used Posts" with new post slugs**  
    - Type: Microsoft Excel node  
    - Role: Writes updated list of used post slugs back to the Excel sheet to maintain the blocklist.  
    - Inputs: Split slugs  
    - Outputs: Confirmation of update.  
    - Edge Cases: Excel write failures, concurrency issues.

  - **Merge new post slugs with post data**  
    - Type: Merge node  
    - Role: Associates filtered post slugs with their post metadata for further processing.  
    - Inputs: Unique post slugs and post data list  
    - Outputs: Posts ready for AI analysis.  
    - Edge Cases: Missing post data for some slugs.

  - **Filter out used posts**  
    - Type: Code node (JavaScript)  
    - Role: Filters the posts to exclude any that have been previously processed.  
    - Inputs: Merged post data and slugs  
    - Outputs: List of posts to analyze.  
    - Edge Cases: Logic errors causing false exclusions or inclusions.

---

#### 1.4 AI Processing

- **Overview:**  
  Iterates over filtered posts, sending combined post and comment data to an AI language model to generate structured MVP startup ideas. Parses the AI output into structured JSON for downstream use.

- **Nodes Involved:**  
  - Loop over posts  
  - Get Comments (reused here in batch)  
  - Merge post with comments (reused)  
  - Flatten post and comments (reused)  
  - OpenRouter Chat Model  
  - Structured Output Parser  
  - AI powered MVP Generator  
  - Split llm output prep for spreadsheet

- **Node Details:**

  - **Loop over posts**  
    - Type: Split In Batches node  
    - Role: Processes posts one at a time or in manageable batches to avoid API rate limits.  
    - Inputs: Filtered posts list  
    - Outputs: Single post per iteration.  
    - Edge Cases: Batch size too large causing timeouts.

  - **Get Comments** (called in batch)  
    - See details above; fetches comments for each post in the loop.

  - **Merge post with comments**  
    - See details above; combines post and comment data for AI input.

  - **Flatten post and comments**  
    - See details above; prepares text input for AI.

  - **OpenRouter Chat Model**  
    - Type: OpenRouter-compatible LLM node  
    - Role: Sends prompt containing post and comment data to an AI model (e.g., GPT-4o-mini, Gemini Flash) to generate MVP ideas.  
    - Configuration: Uses OpenRouter API key credential; model and parameters set for structured output.  
    - Inputs: Prepared prompt from previous node.  
    - Outputs: AI-generated text response.  
    - Edge Cases: API key errors, rate limits, model downtime.

  - **Structured Output Parser**  
    - Type: Langchain structured output parser  
    - Role: Parses AI text response into a structured JSON object with fields like MVP name, industry, pain points, costs, and revenue potential.  
    - Inputs: AI text output  
    - Outputs: Structured JSON data.  
    - Edge Cases: Parsing errors if AI output deviates from expected format.

  - **AI powered MVP Generator**  
    - Type: Chain LLM node  
    - Role: Combines the OpenRouter Chat Model and Structured Output Parser into a chain for streamlined AI processing.  
    - Inputs: Flattened post and comments data  
    - Outputs: Structured MVP idea JSON.  
    - Edge Cases: Chain failures if any component fails.

  - **Split llm output prep for spreadsheet**  
    - Type: Split Out node  
    - Role: Splits structured JSON fields into individual items for Excel row insertion.  
    - Inputs: Structured JSON from AI Generator  
    - Outputs: Fields ready for Excel.  
    - Edge Cases: Missing fields or inconsistent data structure.

---

#### 1.5 Excel Storage

- **Overview:**  
  Appends each generated MVP idea as a new row in a Microsoft Excel 365 spreadsheet, organizing data for later review or automation.

- **Nodes Involved:**  
  - Append new row to Excel sheet

- **Node Details:**

  - **Append new row to Excel sheet**  
    - Type: Microsoft Excel node  
    - Role: Inserts new rows into a preformatted Excel sheet with columns for MVP, Industry, Pain Point, Startup Costs, and Revenue Potential.  
    - Configuration: Uses OAuth2 credentials for Microsoft Excel 365; target workbook and worksheet specified.  
    - Inputs: Split fields from AI output  
    - Outputs: Confirmation of row insertion.  
    - Edge Cases: Excel API errors, permission issues, sheet formatting errors.

---

### 3. Summary Table

| Node Name                        | Node Type                                  | Functional Role                          | Input Node(s)                     | Output Node(s)                      | Sticky Note                                                                                       |
|---------------------------------|--------------------------------------------|----------------------------------------|----------------------------------|-----------------------------------|-------------------------------------------------------------------------------------------------|
| Select a subreddit               | Form Trigger                               | Workflow entry, user subreddit input   | -                                | Get used reddit post slugs, Get Trending Posts |                                                                                                 |
| Get used reddit post slugs       | Microsoft Excel                            | Reads previously processed post slugs | Select a subreddit               | Flatten list of slugs             |                                                                                                 |
| Flatten list of slugs            | Aggregate                                 | Flattens used post slugs list          | Get used reddit post slugs       | Merge used post slugs with new post slugs |                                                                                                 |
| Get Trending Posts               | Reddit                                    | Fetches trending posts from subreddit | Select a subreddit               | Extract subreddits and post ids   |                                                                                                 |
| Extract subreddits and post ids  | Aggregate                                 | Extracts subreddit names and post IDs  | Get Trending Posts               | Create post slugs                 |                                                                                                 |
| Create post slugs               | Code                                      | Creates unique post slugs               | Extract subreddits and post ids  | Merge used post slugs with new post slugs |                                                                                                 |
| Merge used post slugs with new post slugs | Merge                         | Combines old and new post slugs        | Flatten list of slugs, Create post slugs | Create list of all post slugs     |                                                                                                 |
| Create list of all post slugs   | Code                                      | Prepares unified slug list              | Merge used post slugs with new post slugs | Remove duplicate post slugs       |                                                                                                 |
| Remove duplicate post slugs     | Remove Duplicates                         | Removes duplicate slugs                 | Create list of all post slugs    | Merge new post slugs with post data, Split out post slugs |                                                                                                 |
| Split out post slugs            | Split Out                                 | Splits slugs for update and processing | Remove duplicate post slugs      | Update "Used Posts" with new post slugs |                                                                                                 |
| Update "Used Posts" with new post slugs | Microsoft Excel                   | Updates Excel blocklist                 | Split out post slugs             | -                                 |                                                                                                 |
| Create list of posts            | Code                                      | Creates list of post objects            | Extract subreddits and post ids  | Merge new post slugs with post data |                                                                                                 |
| Merge new post slugs with post data | Merge                                | Associates slugs with post data         | Remove duplicate post slugs, Create list of posts | Filter out used posts             |                                                                                                 |
| Filter out used posts           | Code                                      | Filters out posts already processed     | Merge new post slugs with post data | Loop over posts                  |                                                                                                 |
| Loop over posts                | Split In Batches                          | Iterates over posts for AI processing   | Filter out used posts            | Get Comments, AI powered MVP Generator |                                                                                                 |
| Get Comments                   | Reddit                                    | Fetches comments for each post          | Loop over posts                 | Merge post with comments          |                                                                                                 |
| Merge post with comments       | Merge                                     | Combines post and comments data         | Get Comments, Loop over posts    | Flatten post and comments         |                                                                                                 |
| Flatten post and comments       | Code                                      | Flattens data for AI input               | Merge post with comments         | Loop over posts, AI powered MVP Generator |                                                                                                 |
| OpenRouter Chat Model           | OpenRouter-compatible LLM                  | Sends prompt to AI model                 | AI powered MVP Generator         | AI powered MVP Generator          |                                                                                                 |
| Structured Output Parser        | Langchain Output Parser                    | Parses AI response into structured JSON | AI powered MVP Generator         | AI powered MVP Generator          |                                                                                                 |
| AI powered MVP Generator        | Chain LLM                                 | AI chain combining model and parser     | Loop over posts, Flatten post and comments | Split llm output prep for spreadsheet |                                                                                                 |
| Split llm output prep for spreadsheet | Split Out                           | Prepares AI output fields for Excel     | AI powered MVP Generator         | Append new row to Excel sheet     |                                                                                                 |
| Append new row to Excel sheet   | Microsoft Excel                            | Inserts MVP idea into Excel sheet       | Split llm output prep for spreadsheet | -                               |                                                                                                 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Form Trigger Node:**  
   - Type: Form Trigger (v2.2+)  
   - Configure webhook to receive subreddit input dynamically. No preset parameters.

2. **Add Microsoft Excel Node to Read Used Post Slugs:**  
   - Type: Microsoft Excel (v2.1)  
   - Connect to Excel 365 with OAuth2 credentials.  
   - Configure to read the sheet storing used Reddit post slugs.

3. **Add Aggregate Node to Flatten Used Slugs:**  
   - Type: Aggregate  
   - Input: Excel node output  
   - Configure to flatten nested arrays into a single array.

4. **Add Reddit Node to Get Trending Posts:**  
   - Type: Reddit  
   - Connect to Reddit developer credentials.  
   - Set subreddit parameter dynamically from Form Trigger input.  
   - Fetch top trending posts.

5. **Add Aggregate Node to Extract Subreddits and Post IDs:**  
   - Type: Aggregate  
   - Input: Reddit trending posts node  
   - Extract subreddit names and post IDs into arrays.

6. **Add Code Node to Create Post Slugs:**  
   - Type: Code (JavaScript)  
   - Input: Extracted subreddit and post ID arrays  
   - Output: Array of unique post slugs (e.g., "r/subreddit_postid").

7. **Add Merge Node to Combine Used and New Post Slugs:**  
   - Type: Merge  
   - Inputs: Flattened used slugs and new post slugs  
   - Mode: Append or Combine

8. **Add Code Node to Create List of All Post Slugs:**  
   - Type: Code  
   - Input: Merged slugs  
   - Output: Unified list for deduplication.

9. **Add Remove Duplicates Node:**  
   - Type: Remove Duplicates  
   - Input: List of all post slugs  
   - Output: Unique post slugs.

10. **Add Split Out Node to Split Unique Post Slugs:**  
    - Type: Split Out  
    - Input: Unique post slugs  
    - Output: Individual slugs for update.

11. **Add Microsoft Excel Node to Update Used Posts:**  
    - Type: Microsoft Excel  
    - Input: Split slugs  
    - Configure to append or update the used posts sheet.

12. **Add Code Node to Create List of Posts:**  
    - Type: Code  
    - Input: Extracted subreddit and post ID arrays  
    - Output: Array of post objects with metadata.

13. **Add Merge Node to Combine New Post Slugs with Post Data:**  
    - Type: Merge  
    - Inputs: Unique post slugs and post data list  
    - Output: Posts ready for filtering.

14. **Add Code Node to Filter Out Used Posts:**  
    - Type: Code  
    - Input: Merged post data and slugs  
    - Output: Filtered posts excluding already processed ones.

15. **Add Split In Batches Node to Loop Over Posts:**  
    - Type: Split In Batches  
    - Input: Filtered posts  
    - Configure batch size (e.g., 1) to manage API limits.

16. **Add Reddit Node to Get Comments:**  
    - Type: Reddit  
    - Input: Post from batch loop  
    - Configure to fetch comments for each post.

17. **Add Merge Node to Combine Post with Comments:**  
    - Type: Merge  
    - Inputs: Post data and comments  
    - Output: Combined data object.

18. **Add Code Node to Flatten Post and Comments:**  
    - Type: Code  
    - Input: Merged post and comments  
    - Output: Flattened text or structured data for AI input.

19. **Add OpenRouter Chat Model Node:**  
    - Type: OpenRouter-compatible LLM  
    - Configure with OpenRouter API key credentials.  
    - Set model (e.g., GPT-4o-mini) and prompt template to generate MVP ideas from input text.

20. **Add Structured Output Parser Node:**  
    - Type: Langchain Output Parser  
    - Configure with expected JSON schema for MVP ideas.  
    - Input: AI model output text.

21. **Add Chain LLM Node to Combine Model and Parser:**  
    - Type: Chain LLM  
    - Inputs: Flattened post/comment data  
    - Chain: OpenRouter Chat Model + Structured Output Parser

22. **Add Split Out Node to Prepare AI Output for Excel:**  
    - Type: Split Out  
    - Input: Structured JSON from AI Generator  
    - Output: Individual fields for Excel insertion.

23. **Add Microsoft Excel Node to Append New Row:**  
    - Type: Microsoft Excel  
    - Configure with OAuth2 credentials for Excel 365.  
    - Target workbook and worksheet with columns: MVP, Industry, Pain Point, Startup Costs, Revenue Potential.  
    - Input: Split fields from AI output.

24. **Connect Nodes Sequentially According to Workflow Logic:**  
    - Form Trigger → Get used reddit post slugs + Get Trending Posts → Extract subreddits and post ids → Create post slugs → Merge used and new slugs → Create list of all slugs → Remove duplicates → Split out slugs → Update Excel → Create list of posts → Merge slugs with posts → Filter out used posts → Loop over posts → Get Comments → Merge post with comments → Flatten post and comments → AI chain → Split AI output → Append row to Excel.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                 | Context or Link                                                                                          |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|
| The workflow requires a free n8n account (self-hosted or cloud), Reddit developer credentials, OpenRouter API key, and Microsoft Excel 365 with Azure OAuth2. | Setup prerequisites                                                                                      |
| Excel sheet must be preformatted with columns: MVP, Industry, Pain Point, Startup Costs, Revenue Potential.                                                  | Excel integration setup                                                                                  |
| OpenRouter-compatible models supported include GPT-4o-mini and Gemini Flash.                                                                                 | AI model compatibility                                                                                   |
| The workflow includes sticky notes inside n8n for detailed setup instructions and best practices.                                                           | In-workflow documentation                                                                               |
| Ideal for entrepreneurs, market researchers, and content creators seeking real-world startup ideas from Reddit community feedback.                          | Use case                                                                                               |
| For detailed OAuth2 app setup for Microsoft Excel 365, refer to Microsoft Azure documentation.                                                               | https://learn.microsoft.com/en-us/azure/active-directory/develop/quickstart-v2-oauth2-auth-code-flow       |

---

This documentation provides a complete, structured reference to understand, reproduce, and maintain the Reddit MVP Generator workflow. It covers all nodes, their configurations, dependencies, and potential failure points, enabling both advanced users and AI agents to work effectively with the workflow.