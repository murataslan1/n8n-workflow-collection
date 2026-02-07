Auto-Categorize Blog Posts with OpenAI GPT-4, GitHub, and Google Sheets for Astro/Next.js

https://n8nworkflows.xyz/workflows/auto-categorize-blog-posts-with-openai-gpt-4--github--and-google-sheets-for-astro-next-js-9983


# Auto-Categorize Blog Posts with OpenAI GPT-4, GitHub, and Google Sheets for Astro/Next.js

### 1. Workflow Overview

This workflow automates the process of categorizing and tagging blog posts or articles stored in a GitHub repository, leveraging OpenAI's GPT-4 via n8n's LangChain integration. It compares files already processed (tracked in a Google Sheet) with those present in GitHub, identifies new or updated posts, retrieves their content, and uses an AI agent to analyze and assign relevant categories and tags. The results are appended back to a Google Sheet for tracking and potential further use in Astro or Next.js projects.

The workflow is logically divided into these main blocks:

- **1.1 Input Reception & Trigger**: Starts the process via a manual form submission.
- **1.2 Data Retrieval & Deduplication**: Reads processed posts from Google Sheets and lists posts from GitHub; filters new or unprocessed files.
- **1.3 Content Fetching**: Retrieves the full content of new posts/articles from GitHub.
- **1.4 AI Analysis & Tagging**: Uses LangChain AI Agent with GPT-4 to analyze content and generate categories and tags.
- **1.5 Output Processing & Storage**: Parses AI output and appends proposed categories and tags back to Google Sheets.
- **1.6 Flow Control & Notifications**: Handles empty inputs and end-of-process notifications.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Trigger

**Overview:**  
This block initiates the workflow manually via a form trigger that users submit to start the categorization process.

**Nodes Involved:**  
- On form submission

**Node Details:**  
- **On form submission**  
  - *Type:* Form Trigger  
  - *Role:* Starts the workflow when the user submits a form titled "Start process" that describes adding tags and categories.  
  - *Configuration:* No additional parameters; form has a title and description only.  
  - *Input/Output:* No input; output triggers downstream nodes.  
  - *Failure modes:* Webhook downtime or form misconfiguration may prevent triggering.  
  - *Version:* 2.3  

---

#### 2.2 Data Retrieval & Deduplication

**Overview:**  
Reads the list of already processed posts from Google Sheets and lists all posts/files in the GitHub repository, then filters out duplicates and identifies new files needing processing.

**Nodes Involved:**  
- Get row(s) in sheet  
- List FileName only / Remove duplicates  
- List posts/articles/pages (GitHub)  
- Get paths to files only from GitHub repository (aggregate)  
- Get file paths only from GoogleSheets (aggregate)  
- Merge GitHub and Google Sheets read  
- Check new repo files for AI processing (code)  
- Switch

**Node Details:**  

- **Get row(s) in sheet**  
  - *Type:* Google Sheets  
  - *Role:* Reads existing post metadata rows from Google Sheets to get processed filenames and their categories/tags.  
  - *Configuration:* Reads from Sheet1 (gid=0) of a specific Google Sheet document.  
  - *Credentials:* OAuth2 Google Sheets API linked to user account.  
  - *Output:* Full rows containing FileName, Categories, Proposed Categories, Tags, Proposed Tags.  
  - *Failure modes:* Authentication failure, sheet access issues, empty or malformed data.

- **List FileName only / Remove duplicates**  
  - *Type:* Code (JavaScript)  
  - *Role:* Extracts unique filenames from the Google Sheets rows to prevent reprocessing duplicate entries.  
  - *Key Logic:* Maps input items to only their `FileName` property and removes duplicates using a Set.  
  - *Input:* Output of "Get row(s) in sheet".  
  - *Output:* Unique list of filenames as JSON items `{path: filename}`.  
  - *Failure modes:* Invalid input data may cause runtime exceptions.

- **List posts/articles/pages** (GitHub)  
  - *Type:* GitHub  
  - *Role:* Lists all files in the blog post directory (`src/content/blog/pl/`) in the GitHub repo `astro-n8n-test`.  
  - *Configuration:* Lists files under the specified path and repository owned by `pjsikora`.  
  - *Credentials:* GitHub API with OAuth token.  
  - *Output:* List of file objects with paths.  
  - *Failure modes:* API rate limits, authentication errors, incorrect repository or path.

- **Get paths to files only from GitHub repository** (Aggregate)  
  - *Type:* Aggregate  
  - *Role:* Aggregates the paths from the GitHub list into a single array `githubPaths`.  
  - *Input:* Output from "List posts/articles/pages".  
  - *Output:* Array of paths.  
  - *Failure modes:* Empty input results in empty array.

- **Get file paths only from GoogleSheets** (Aggregate)  
  - *Type:* Aggregate  
  - *Role:* Aggregates the unique filenames from Google Sheets into array `googlesheetsPaths`.  
  - *Input:* Output of "List FileName only / Remove duplicates".  
  - *Output:* Array of paths.  
  - *Failure modes:* Empty input results in empty array.

- **Merge GitHub and Google Sheets read**  
  - *Type:* Merge  
  - *Role:* Combines outputs of GitHub and Google Sheets aggregate nodes to provide both arrays for comparison.  
  - *Input:* Aggregated GitHub paths and Google Sheets paths.  
  - *Output:* Single combined item containing both arrays.

- **Check new repo files for AI processing** (Code)  
  - *Type:* Code (JavaScript)  
  - *Role:* Filters GitHub paths to only those not present in Google Sheets (i.e., new files to process).  
  - *Key Logic:* Computes difference array `githubPaths - googlesheetsPaths`.  
  - *Input:* Merged arrays from previous step.  
  - *Output:* List of new file paths for AI processing.  
  - *Failure modes:* Missing arrays or malformed data.

- **Switch**  
  - *Type:* Switch  
  - *Role:* Checks if the list of new files is empty or not.  
  - *Input:* Output of "Check new repo files for AI processing".  
  - *Output:* Routes workflow to either "No new posts/articles in GitHub" or "Get post/article file".  
  - *Failure modes:* Expression evaluation errors.

---

#### 2.3 Content Fetching

**Overview:**  
Retrieves the raw content of each new file from GitHub for AI analysis.

**Nodes Involved:**  
- Get post/article file  
- Loop Over Posts/Pages

**Node Details:**  

- **Get post/article file**  
  - *Type:* GitHub  
  - *Role:* Downloads the full content of each blog post file identified as new.  
  - *Configuration:* Uses dynamic file path from the filtered list; repository is `piotr-sikora.com`.  
  - *Credentials:* GitHub API.  
  - *Output:* File content in JSON including path and content.  
  - *Failure modes:* File not found, API limits, invalid path.

- **Loop Over Posts/Pages**  
  - *Type:* SplitInBatches  
  - *Role:* Processes posts one by one or in batches (default batch size) to avoid overload.  
  - *Input:* Files from "Get post/article file".  
  - *Output:* Iterates over items, allowing downstream nodes to process each post individually.  
  - *Failure modes:* Batch misconfiguration, concurrency issues.

---

#### 2.4 AI Analysis & Tagging

**Overview:**  
Uses LangChain AI Agent with GPT-4 to analyze each post content and generate updated categories and tags.

**Nodes Involved:**  
- AI Agent  
- OpenAI Chat Model  
- Simple Memory  
- Structured Output Parser

**Node Details:**  

- **AI Agent**  
  - *Type:* LangChain Agent  
  - *Role:* Main AI processor that receives post content and metadata, assigns categories and tags, and outputs structured JSON.  
  - *Configuration:* Uses prompt instructing the AI to parse metadata from markdown front matter, analyze content, and produce updated tags/categories in JSON format.  
  - *Key expressions:* `={{ $json.path }}` for input text.  
  - *Edges:* Input from "Loop Over Posts/Pages" and AI components; output to "Append rows with posts / article analysis".  
  - *Failure modes:* API errors, prompt misunderstanding, large content causing token limits.  
  - *Version:* 2.2  

- **OpenAI Chat Model**  
  - *Type:* LangChain OpenAI Chat Model  
  - *Role:* Provides GPT-4.1-mini model for AI Agent.  
  - *Configuration:* Model set to "gpt-4.1-mini" with JSON response format.  
  - *Credentials:* OpenAI API key.  
  - *Failure modes:* API quota, network errors.

- **Simple Memory**  
  - *Type:* LangChain Memory Buffer Window  
  - *Role:* Maintains short session memory window (2 items) for AI context.  
  - *Configuration:* Session key `simple_memory`, custom session ID.  
  - *Failure modes:* Memory overflow or reset affecting AI context.

- **Structured Output Parser**  
  - *Type:* LangChain Output Parser Structured  
  - *Role:* Parses AI Agent JSON output to extract arrays for old/new categories and tags.  
  - *Configuration:* Uses a JSON schema example defining expected keys (`old_categories`, `categories`, `old_tags`, `tags`).  
  - *Failure modes:* Parsing errors if AI output deviates from schema.

---

#### 2.5 Output Processing & Storage

**Overview:**  
Appends the AI-generated categories and tags along with original metadata back to Google Sheets for tracking.

**Nodes Involved:**  
- Append rows with posts / article analysis

**Node Details:**  

- **Append rows with posts / article analysis**  
  - *Type:* Google Sheets  
  - *Role:* Adds a new row per analyzed post with filename, old and proposed categories and tags.  
  - *Configuration:* Maps fields: `FileName`, `Categories`, `Proposed Categories`, `Tags`, `Proposed Tags` to respective JSON values from AI output and GitHub file info.  
  - *Credentials:* OAuth2 Google Sheets.  
  - *Failure modes:* Writing failures due to permission, quota, or malformed data.

---

#### 2.6 Flow Control & Notifications

**Overview:**  
Handles cases when no new posts require analysis and provides user feedback on process completion.

**Nodes Involved:**  
- No new posts/articles in GitHub  
- Proces finished - Categories and tags added

**Node Details:**  

- **No new posts/articles in GitHub**  
  - *Type:* Form  
  - *Role:* Sends a completion message indicating no new posts to process.  
  - *Configuration:* Completion title and message.  
  - *Failure modes:* Webhook errors.

- **Proces finished - Categories and tags added**  
  - *Type:* Form  
  - *Role:* Sends a completion message confirming process completion after AI analysis and data appending.  
  - *Configuration:* Completion title and message.  
  - *Failure modes:* Webhook errors.

---

### 3. Summary Table

| Node Name                                | Node Type                                | Functional Role                                   | Input Node(s)                             | Output Node(s)                        | Sticky Note                                                                                                           |
|-----------------------------------------|-----------------------------------------|-------------------------------------------------|------------------------------------------|-------------------------------------|-----------------------------------------------------------------------------------------------------------------------|
| On form submission                      | Form Trigger                            | Initiates workflow via user form submission      | -                                        | Get row(s) in sheet, List posts... |                                                                                                                       |
| Get row(s) in sheet                     | Google Sheets                          | Reads processed posts metadata from Google Sheets| On form submission                       | List FileName only / Remove duplicates | ## Get list of posts from Google Sheets: prevents repeating AI usage, requires columns FileName, Categories, etc.    |
| List FileName only / Remove duplicates | Code                                  | Extracts unique filenames from Google Sheets data| Get row(s) in sheet                      | Get file paths only from GoogleSheets | ## List FileNames only and Remove duplicates: filters duplicates by FileName property                                  |
| Get file paths only from GoogleSheets  | Aggregate                             | Aggregates Google Sheets filenames into array    | List FileName only / Remove duplicates  | Merge GitHub and Google Sheets read | ## Convert JSON to Array: converts list of objects to array of paths                                                   |
| List posts/articles/pages               | GitHub                                | Lists all blog post files paths from GitHub repo | On form submission                       | Get paths to files only from GitHub repo | ## Define repository: repo and directory for articles/posts                                                           |
| Get paths to files only from GitHub repo | Aggregate                             | Aggregates GitHub file paths into array           | List posts/articles/pages                | Merge GitHub and Google Sheets read | ## Convert JSON to Array: converts list of objects to array of paths                                                   |
| Merge GitHub and Google Sheets read    | Merge                                | Combines GitHub and Google Sheets arrays          | Get file paths only from GoogleSheets, Get paths to files only from GitHub repo | Check new repo files for AI processing | ## Compare list from Google Sheets with list from Github                                                                |
| Check new repo files for AI processing | Code                                  | Filters GitHub paths to only new files             | Merge GitHub and Google Sheets read     | Switch                             |                                                                                                                       |
| Switch                                 | Switch                               | Routes flow depending on new files availability   | Check new repo files for AI processing  | No new posts/articles in GitHub, Get post/article file |                                                                                                                       |
| No new posts/articles in GitHub        | Form                                 | Notifies no new posts to process                   | Switch                                 | -                                   | ## No new files in GitHub repository                                                                                   |
| Get post/article file                   | GitHub                               | Retrieves full content of individual files         | Switch                                 | Loop Over Posts/Pages               | ## Get file content: get file content and pass to AI Agent                                                            |
| Loop Over Posts/Pages                   | SplitInBatches                       | Processes posts individually or in batches         | Get post/article file                   | Proces finished, AI Agent          |                                                                                                                       |
| AI Agent                               | LangChain Agent                     | Analyzes content and assigns categories/tags      | Loop Over Posts/Pages, Simple Memory, OpenAI Chat Model, Structured Output Parser | Append rows with posts / article analysis | ## AI Agent: analyzes content, assigns categories/tags, outputs structured JSON                                        |
| OpenAI Chat Model                      | LangChain OpenAI Model              | Provides GPT-4 model for AI Agent                  | -                                      | AI Agent                          |                                                                                                                       |
| Simple Memory                         | LangChain Memory Buffer Window       | Maintains context window for AI conversations      | -                                      | AI Agent                          |                                                                                                                       |
| Structured Output Parser               | LangChain Output Parser Structured  | Parses AI JSON output into usable fields           | AI Agent                              | AI Agent (ai_outputParser slot)    |                                                                                                                       |
| Append rows with posts / article analysis | Google Sheets                      | Appends AI results and metadata to Google Sheets  | AI Agent                              | Loop Over Posts/Pages              | ## Save propositions to Google Sheet: columns for FileName, Categories, Proposed Categories, Tags, Proposed Tags       |
| Proces finished - Categories and tags added | Form                             | Notifies process completion                         | Loop Over Posts/Pages                  | -                                   |                                                                                                                       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Node**  
   - Add **Form Trigger** node named "On form submission".  
   - Set form title: "Start process".  
   - Set description: "Start process of adding tags and categories".  

2. **Read Processed Posts from Google Sheets**  
   - Add **Google Sheets** node named "Get row(s) in sheet".  
   - Set operation to "Read Rows".  
   - Configure document ID and Sheet name (gid=0).  
   - Connect "On form submission" output to this node.  
   - Add Google Sheets OAuth2 credentials.  

3. **Extract Unique FileNames**  
   - Add a **Code** node named "List FileName only / Remove duplicates".  
   - Paste the JavaScript code that extracts the `FileName` from each row and removes duplicates (see code logic in analysis).  
   - Connect output of "Get row(s) in sheet" to this node.  

4. **Aggregate File Paths from Google Sheets**  
   - Add **Aggregate** node named "Get file paths only from GoogleSheets".  
   - Aggregate field: `path` from input.  
   - Rename output field to `googlesheetsPaths`.  
   - Connect output of "List FileName only / Remove duplicates" to this node.  

5. **List Files from GitHub Repository**  
   - Add **GitHub** node named "List posts/articles/pages".  
   - Operation: List files.  
   - Repository: `astro-n8n-test` under owner `pjsikora`.  
   - Path: `src/content/blog/pl/` (directory containing posts).  
   - Add GitHub API credentials.  
   - Connect "On form submission" output to this node.  

6. **Aggregate File Paths from GitHub**  
   - Add **Aggregate** node named "Get paths to files only from GitHub repository".  
   - Aggregate field: `path`.  
   - Rename output field to `githubPaths`.  
   - Connect output of "List posts/articles/pages" to this node.  

7. **Merge Google Sheets and GitHub Paths**  
   - Add **Merge** node named "Merge GitHub and Google Sheets read".  
   - Merge mode: Merge by position (default).  
   - Connect outputs of "Get file paths only from GoogleSheets" and "Get paths to files only from GitHub repository".  

8. **Filter New Files for AI Processing**  
   - Add **Code** node named "Check new repo files for AI processing".  
   - Use JavaScript to compute difference array: files in GitHub but not in Google Sheets.  
   - Connect output of "Merge GitHub and Google Sheets read" to this node.  

9. **Switch Based on New Files Presence**  
   - Add **Switch** node named "Switch".  
   - Add two rules:  
     - "Empty JSON" if input data is empty.  
     - "Not empty JSON" if input data is not empty.  
   - Connect output of "Check new repo files for AI processing" to this node.  

10. **Handle No New Files Case**  
    - Add **Form** node named "No new posts/articles in GitHub".  
    - Set operation to "completion".  
    - Title: "List is empty".  
    - Message: "List of articles is empty (there is no new articles/pages in repository)".  
    - Connect "Empty JSON" output of "Switch" to this node.  

11. **Retrieve Content of New Files from GitHub**  
    - Add **GitHub** node named "Get post/article file".  
    - Operation: Get file content.  
    - Repository: `piotr-sikora.com` under owner `pjsikora`.  
    - File path: Use expression `{{$json.path}}` from filtered list.  
    - Add GitHub credentials.  
    - Connect "Not empty JSON" output of "Switch" to this node.  

12. **Process Files in Batches**  
    - Add **SplitInBatches** node named "Loop Over Posts/Pages".  
    - Default batch size (or as preferred).  
    - Connect output of "Get post/article file" to this node.  

13. **Configure AI Agent**  
    - Add **LangChain Agent** node named "AI Agent".  
    - Set prompt: Provide instructions to parse front matter metadata and content, assign categories/tags, and output updated metadata.  
    - Use expression to pass file content: `={{ $json.path }}`.  
    - Connect AI Agent inputs:  
      - AI Language Model: Add **LangChain LM Chat OpenAI** node configured with GPT-4.1-mini model (response format: JSON).  
      - AI Memory: Add **LangChain Memory Buffer Window** with session key `simple_memory` and window length 2.  
      - Structured Output Parser: Add **LangChain Output Parser Structured** configured with JSON schema example for categories and tags.  
    - Connect "Loop Over Posts/Pages" output to "AI Agent".  

14. **Append AI Results to Google Sheets**  
    - Add **Google Sheets** node named "Append rows with posts / article analysis".  
    - Operation: Append row.  
    - Sheet: Same Google Sheet as earlier, Sheet1 (gid=0).  
    - Map columns:  
      - FileName: `={{ $('Get post/article file').item.json.path }}`  
      - Categories: `={{ JSON.stringify($json.output.old_categories) }}`  
      - Proposed Categories: `={{ JSON.stringify($json.output.categories) }}`  
      - Tags: `={{ JSON.stringify($json.output.old_tags) }}`  
      - Proposed Tags: `={{ JSON.stringify($json.output.tags) }}`  
    - Connect output of "AI Agent" to this node.  

15. **Loop Back for Next Files**  
    - Connect "Append rows with posts / article analysis" output back to "Loop Over Posts/Pages" to process remaining batches.  

16. **Process Completion Notification**  
    - Add **Form** node named "Proces finished - Categories and tags added".  
    - Operation: Completion.  
    - Title: "Proces finished".  
    - Message: "Categories and tags added".  
    - Connect first output of "Loop Over Posts/Pages" (which triggers after all batches processed) to this node.  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                      | Context or Link                                                                                           |
|---------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| Define repository and directory in which workflow can find articles/posts.                                                                        | Sticky note near "List posts/articles/pages" node.                                                       |
| Get file content and pass it to AI Agent.                                                                                                        | Sticky note near "Get post/article file" node.                                                          |
| Save propositions to Google Sheet file. Prepare Google Sheet with columns: FileName, Categories, Proposed Categories, Tags, Proposed Tags          | Sticky note near "Append rows with posts / article analysis" node.                                       |
| Get list of posts from Google Sheets to prevent repeated AI analysis. Prepare Google Sheet accordingly.                                           | Sticky note near "Get row(s) in sheet" node.                                                             |
| List FileNames only and remove duplicates to avoid redundant processing.                                                                           | Sticky note near "List FileName only / Remove duplicates" node.                                          |
| Convert JSON objects to array format for aggregation steps.                                                                                       | Sticky notes near aggregate nodes "Get paths to files only from GitHub repository" and "Get file paths only from GoogleSheets". |
| Compare list from Google Sheets with list from GitHub to identify new files needing processing.                                                   | Sticky note near "Merge GitHub and Google Sheets read" node.                                             |
| No new files in GitHub repository notification.                                                                                                  | Sticky notes near "No new posts/articles in GitHub" and "Switch" node.                                   |
| AI Agent analyzes content of file, assigns categories and tags, and returns structured JSON output following specified schema.                   | Sticky note near "AI Agent" node.                                                                        |

---

**Disclaimer:**  
The provided text originates exclusively from an automated workflow created with n8n, an integration and automation tool. This process strictly adheres to prevailing content policies and contains no illegal, offensive, or protected elements. All data processed is legal and public.