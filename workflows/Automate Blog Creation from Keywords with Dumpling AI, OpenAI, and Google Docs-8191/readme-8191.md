Automate Blog Creation from Keywords with Dumpling AI, OpenAI, and Google Docs

https://n8nworkflows.xyz/workflows/automate-blog-creation-from-keywords-with-dumpling-ai--openai--and-google-docs-8191


# Automate Blog Creation from Keywords with Dumpling AI, OpenAI, and Google Docs

### 1. Workflow Overview

This workflow automates the creation of blog posts from user-submitted keywords using AI-powered content expansion, news article retrieval, scraping, and synthesis tools. It targets content marketers, bloggers, and digital publishers who want to generate fresh, engaging blog drafts quickly and efficiently. The workflow integrates Dumpling AI (for autocomplete and news scraping), OpenAI (for content generation), and Google Docs (for final document creation).

The logic is divided into two main functional blocks:

**1.1 Agent Branch (Input Expansion & Content Gathering)**  
- Receives keywords from a user form.  
- Uses Dumpling AI Autocomplete to expand keywords into related search suggestions.  
- For each suggestion, fetches recent news articles (1–2 days old) via Dumpling AI Google News.  
- Filters and limits articles to a manageable number.  

**1.2 Blog Branch (Content Processing & Blog Generation)**  
- Scrapes the filtered articles to extract raw content.  
- Cleans and prepares article text by removing markdown clutter and non-essential sections.  
- Aggregates all cleaned articles into a single dataset.  
- Passes the dataset to OpenAI to generate a polished, original blog draft in Markdown format.  
- Creates and updates a Google Docs document with the generated blog post content and title.

---

### 2. Block-by-Block Analysis

#### 2.1 Agent Branch: Input Expansion & Content Gathering

**Overview:**  
This block starts with user input of keywords via a form. It expands those keywords with AI autocomplete suggestions, then fetches and filters recent news articles related to each suggestion to gather fresh content for blog generation.

**Nodes Involved:**  
- Form Submission (Keywords)  
- Dumpling AI Autocomplete  
- Split Autocomplete Suggestions  
- Loop Suggestions  
- Delay Between Requests  
- Dumpling AI Google News  
- Split News Articles  
- Filter Articles (1–2 Days Old)  
- Limit Articles  

**Node Details:**  

- **Form Submission (Keywords)**  
  - Type: Form Trigger  
  - Role: Entry point to capture user input keywords via a web form titled "Blog form".  
  - Configuration: Single field labeled "Keywords".  
  - Inputs: None (trigger)  
  - Outputs: Connects to Dumpling AI Autocomplete  
  - Edge Cases: Missing or empty keyword input could cause no downstream data; handle with form validation.  

- **Dumpling AI Autocomplete**  
  - Type: HTTP Request  
  - Role: Queries Dumpling AI API to get autocomplete suggestions based on submitted keywords.  
  - Configuration: POST request to Dumpling AI autocomplete endpoint with query parameter from form keyword and fixed country "US". Uses header authentication via stored credential.  
  - Inputs: Form Submission output JSON with keyword.  
  - Outputs: To Split Autocomplete Suggestions.  
  - Edge Cases: API failure, auth errors, empty suggestions.  

- **Split Autocomplete Suggestions**  
  - Type: SplitOut  
  - Role: Splits the array of autocomplete suggestions into individual items for iterative processing.  
  - Configuration: Splits on "suggestions" field.  
  - Inputs: Dumpling AI Autocomplete output.  
  - Outputs: To Loop Suggestions.  
  - Edge Cases: Empty suggestions array leads to no iteration.  

- **Loop Suggestions**  
  - Type: SplitInBatches  
  - Role: Processes each autocomplete suggestion one by one to control request flow and avoid rate limits.  
  - Configuration: Default batch size (likely 1).  
  - Inputs: Items from Split Autocomplete Suggestions.  
  - Outputs: Two outputs — primary to Aggregate Articles, secondary (loop) to Delay Between Requests.  
  - Edge Cases: Large suggestion lists may cause long execution times.  

- **Delay Between Requests**  
  - Type: Wait  
  - Role: Pauses execution between requests to Dumpling AI Google News to respect API rate limits.  
  - Configuration: Default wait time (not explicitly set, likely a few seconds).  
  - Inputs: Loop Suggestions secondary output.  
  - Outputs: Dumpling AI Google News.  
  - Edge Cases: Delay misconfiguration may cause workflow slowdown or API rate limit issues.  

- **Dumpling AI Google News**  
  - Type: HTTP Request  
  - Role: Queries Dumpling AI API to fetch news articles related to each autocomplete suggestion.  
  - Configuration: POST request with "query" parameter from current suggestion value and country "US". Uses header authentication.  
  - Inputs: Delay Between Requests output (batched suggestions).  
  - Outputs: Split News Articles.  
  - Edge Cases: API failures, empty news results.  

- **Split News Articles**  
  - Type: SplitOut  
  - Role: Splits the returned array of news articles into separate items.  
  - Configuration: Splits on "news" field.  
  - Inputs: Dumpling AI Google News output.  
  - Outputs: Filter Articles (1–2 Days Old).  
  - Edge Cases: Empty news array means no articles to process.  

- **Filter Articles (1–2 Days Old)**  
  - Type: Code (JavaScript)  
  - Role: Filters articles to keep only those published between 1 and 2 days ago, ensuring content freshness.  
  - Configuration: Custom JS code parsing relative published times and filtering accordingly.  
  - Inputs: Split News Articles output.  
  - Outputs: Limit Articles.  
  - Edge Cases: Articles without valid date info are discarded; date parsing errors possible.  

- **Limit Articles**  
  - Type: Limit  
  - Role: Restricts the number of articles processed downstream to 2, to keep workload manageable.  
  - Configuration: Max items set to 2.  
  - Inputs: Filter Articles output.  
  - Outputs: Dumpling AI Scraper (start of blog branch).  
  - Edge Cases: If fewer than 2 articles, processes what is available.

#### 2.2 Blog Branch: Content Processing & Blog Generation

**Overview:**  
This block scrapes and cleans article content, aggregates all articles, then sends the aggregated data to OpenAI to generate a polished blog draft. Finally, it creates and updates a Google Docs document with the generated content.

**Nodes Involved:**  
- Dumpling AI Scraper  
- Clean & Prepare Article Content  
- Aggregate Articles  
- OpenAI: Generate Blog Draft  
- Google Docs: Create Blog File  
- Google Docs: Insert Blog Content  

**Node Details:**  

- **Dumpling AI Scraper**  
  - Type: HTTP Request  
  - Role: Scrapes the full article content from each article URL using Dumpling AI's scraper API.  
  - Configuration: POST request with "url" parameter from article URL. Uses header authentication.  
  - Inputs: Limit Articles output (each article URL).  
  - Outputs: Clean & Prepare Article Content.  
  - Edge Cases: Scraper failure or incomplete content; node configured to continue on error.  

- **Clean & Prepare Article Content**  
  - Type: Code (JavaScript)  
  - Role: Cleans raw scraped content by removing markdown images, links, clutter, and non-article sections. Produces a clean text article and title.  
  - Configuration: Custom JS code handles markdown cleanup, removes common clutter lines, and compresses blank lines.  
  - Inputs: Dumpling AI Scraper output.  
  - Outputs: Loop Suggestions (to continue processing next suggestions) and Aggregate Articles (for blog generation).  
  - Edge Cases: Unexpected markdown structures could cause incomplete cleaning.  

- **Aggregate Articles**  
  - Type: Aggregate  
  - Role: Combines all cleaned article contents into a single aggregated field named "article" for use by OpenAI.  
  - Configuration: Aggregates all item data specifically on the "article" field.  
  - Inputs: Loop Suggestions output after Clean & Prepare Article Content.  
  - Outputs: OpenAI: Generate Blog Draft.  
  - Edge Cases: If no articles aggregated, OpenAI input will be empty, possibly leading to poor results.  

- **OpenAI: Generate Blog Draft**  
  - Type: OpenAI Langchain node  
  - Role: Generates a professional, original blog post in Markdown using GPT-4.1-MINI, based on aggregated article content.  
  - Configuration: System prompt instructs to produce valid JSON with "Blog_post" (Markdown blog) and "title". Enforces rewriting and formatting rules.  
  - Inputs: Aggregate Articles output with aggregated content.  
  - Outputs: Google Docs: Create Blog File.  
  - Credential: OpenAI API credential required.  
  - Edge Cases: API rate limits, malformed JSON output, or prompt failure.  

- **Google Docs: Create Blog File**  
  - Type: Google Docs node  
  - Role: Creates a new Google Docs document with the blog post title from OpenAI output, in a predefined folder.  
  - Configuration: Title set dynamically from OpenAI "title" JSON key; folder ID is fixed.  
  - Inputs: OpenAI output.  
  - Outputs: Google Docs: Insert Blog Content.  
  - Credential: Google Docs OAuth2 credential required.  
  - Edge Cases: Folder permissions or API quota issues.  

- **Google Docs: Insert Blog Content**  
  - Type: Google Docs node  
  - Role: Inserts the generated blog post Markdown content into the newly created Google Docs file.  
  - Configuration: Updates the document by inserting text at the start; document URL dynamically set from previous node output.  
  - Inputs: Google Docs: Create Blog File output.  
  - Credential: Google Docs OAuth2 credential required.  
  - Edge Cases: Document access errors, API timeouts.  

---

### 3. Summary Table

| Node Name                   | Node Type             | Functional Role                             | Input Node(s)                  | Output Node(s)                 | Sticky Note                                                                                      |
|-----------------------------|-----------------------|--------------------------------------------|-------------------------------|-------------------------------|-------------------------------------------------------------------------------------------------|
| Form Submission (Keywords)   | Form Trigger          | Receive user keywords                       | None                          | Dumpling AI Autocomplete       | This branch starts with a form submission. The entered keyword is expanded using Dumpling AI Autocomplete, then news articles are fetched with Dumpling AI Google News. |
| Dumpling AI Autocomplete     | HTTP Request          | Get autocomplete keyword suggestions       | Form Submission (Keywords)     | Split Autocomplete Suggestions |                                                                                                 |
| Split Autocomplete Suggestions | SplitOut             | Split suggestions into individual items    | Dumpling AI Autocomplete       | Loop Suggestions               |                                                                                                 |
| Loop Suggestions             | SplitInBatches        | Iterate suggestions with batching          | Split Autocomplete Suggestions | Aggregate Articles, Delay Between Requests |                                                                                                 |
| Delay Between Requests       | Wait                  | Delay between API requests                  | Loop Suggestions              | Dumpling AI Google News        |                                                                                                 |
| Dumpling AI Google News      | HTTP Request          | Fetch news articles for each suggestion    | Delay Between Requests         | Split News Articles            |                                                                                                 |
| Split News Articles          | SplitOut              | Split news articles into individual items  | Dumpling AI Google News        | Filter Articles (1–2 Days Old) |                                                                                                 |
| Filter Articles (1–2 Days Old) | Code                 | Filter articles by freshness (1–2 days old)| Split News Articles            | Limit Articles                |                                                                                                 |
| Limit Articles              | Limit                  | Limit to maximum 2 recent articles          | Filter Articles (1–2 Days Old) | Dumpling AI Scraper            |                                                                                                 |
| Dumpling AI Scraper          | HTTP Request          | Scrape full article content                 | Limit Articles                | Clean & Prepare Article Content |                                                                                                 |
| Clean & Prepare Article Content | Code                 | Clean markdown and clutter from articles   | Dumpling AI Scraper            | Loop Suggestions, Aggregate Articles |                                                                                                 |
| Aggregate Articles          | Aggregate              | Aggregate cleaned articles for AI input    | Loop Suggestions              | OpenAI: Generate Blog Draft    |                                                                                                 |
| OpenAI: Generate Blog Draft  | OpenAI Langchain Node | Generate blog post in Markdown              | Aggregate Articles            | Google Docs: Create Blog File  | From each filtered article, the workflow scrapes and cleans content with Dumpling AI Scraper. The articles are aggregated and passed to OpenAI, which generates a polished blog draft. The final post is saved into Google Docs, creating and updating a document with the finished blog content. |
| Google Docs: Create Blog File| Google Docs Node       | Create new Google Doc with blog title       | OpenAI: Generate Blog Draft    | Google Docs: Insert Blog Content |                                                                                                 |
| Google Docs: Insert Blog Content | Google Docs Node    | Insert blog post content into Google Doc    | Google Docs: Create Blog File  | None                          |                                                                                                 |
| Sticky Note                 | Sticky Note            | Agent Branch overview                        | None                          | None                          | This branch starts with a form submission. The entered keyword is expanded using Dumpling AI Autocomplete, then news articles are fetched with Dumpling AI Google News. The workflow splits suggestions and articles, filters them to keep only fresh items (1–2 days old), and prepares them for content creation. |
| Sticky Note1                | Sticky Note            | Blog Branch overview                         | None                          | None                          | From each filtered article, the workflow scrapes and cleans content with Dumpling AI Scraper. The articles are aggregated and passed to OpenAI, which generates a polished blog draft. The final post is saved into Google Docs, creating and updating a document with the finished blog content. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Form Trigger node** named "Form Submission (Keywords)"  
   - Form Title: "Blog form"  
   - Form Field: One field labeled "Keywords" (text input)  
   - This node starts the workflow on form submission.

2. **Add an HTTP Request node** named "Dumpling AI Autocomplete"  
   - Method: POST  
   - URL: `https://app.dumplingai.com/api/v1/get-autocomplete`  
   - Authentication: HTTP Header Auth with Dumpling AI API key credential  
   - Body (JSON):  
     - `query` = expression from `{{$json.Keywords}}` (form input)  
     - `country` = `"US"`  
   - Connect "Form Submission (Keywords)" output to this node.

3. **Add a SplitOut node** named "Split Autocomplete Suggestions"  
   - Field to split out: `suggestions`  
   - Connect "Dumpling AI Autocomplete" output to this node.

4. **Add a SplitInBatches node** named "Loop Suggestions"  
   - Default batch size (1)  
   - Connect "Split Autocomplete Suggestions" output to this node.

5. **Add a Wait node** named "Delay Between Requests"  
   - Default wait time (set if needed to e.g. 2-3 seconds)  
   - Connect second output of "Loop Suggestions" (loop output) to this node.

6. **Add an HTTP Request node** named "Dumpling AI Google News"  
   - Method: POST  
   - URL: `https://app.dumplingai.com/api/v1/search-news`  
   - Authentication: HTTP Header Auth with Dumpling AI API key credential  
   - Body (JSON):  
     - `query` = expression from `{{$json.value}}` (current suggestion)  
     - `country` = `"US"`  
   - Connect "Delay Between Requests" output to this node.

7. **Add a SplitOut node** named "Split News Articles"  
   - Field to split out: `news`  
   - Connect "Dumpling AI Google News" output to this node.

8. **Add a Code node** named "Filter Articles (1–2 Days Old)"  
   - Paste the provided JavaScript code that filters articles by date (1–2 days old) based on relative date text.  
   - Connect "Split News Articles" output to this node.

9. **Add a Limit node** named "Limit Articles"  
   - Max items: 2  
   - Connect "Filter Articles (1–2 Days Old)" output to this node.

10. **Add an HTTP Request node** named "Dumpling AI Scraper"  
    - Method: POST  
    - URL: `https://app.dumplingai.com/api/v1/scrape`  
    - Authentication: HTTP Header Auth with Dumpling AI API key credential  
    - Body (JSON):  
      - `url` = expression from `{{$json.URL}}` (article URL)  
    - On error: continue execution (to avoid stopping on scraping failures)  
    - Connect "Limit Articles" output to this node.

11. **Add a Code node** named "Clean & Prepare Article Content"  
    - Paste the provided JavaScript code to clean markdown and clutter from the scraped article content.  
    - Connect "Dumpling AI Scraper" output to this node.

12. **Connect the first output of "Clean & Prepare Article Content"** back to "Loop Suggestions" input to continue processing next suggestions (loop continuation).

13. **Add an Aggregate node** named "Aggregate Articles"  
    - Aggregate type: Aggregate all item data  
    - Fields to include: `article`  
    - Destination field name: `article`  
    - Connect the second output of "Clean & Prepare Article Content" (or direct output if single) to this node.

14. **Add an OpenAI Langchain node** named "OpenAI: Generate Blog Draft"  
    - Model: GPT-4.1-MINI (or equivalent GPT-4 variant)  
    - System prompt: Use the detailed prompt requesting JSON output with keys "Blog_post" and "title" and formatting instructions. Include the scraped content from aggregated `article` field.  
    - JSON output enabled.  
    - Connect "Aggregate Articles" output to this node.  
    - Configure OpenAI API credentials.

15. **Add a Google Docs node** named "Google Docs: Create Blog File"  
    - Operation: Create document  
    - Title: Expression from OpenAI output JSON `{{$json.message.content.title}}`  
    - Folder ID: Specify your Google Docs folder ID to store the blog post files.  
    - Connect "OpenAI: Generate Blog Draft" output to this node.  
    - Configure Google Docs OAuth2 credentials.

16. **Add a Google Docs node** named "Google Docs: Insert Blog Content"  
    - Operation: Update document  
    - Document URL: Expression from the created document ID or URL `{{$json.id}}`  
    - Actions: Insert text action with content from OpenAI output JSON `{{$json.message.content.Blog_post}}`  
    - Connect "Google Docs: Create Blog File" output to this node.  
    - Use the same Google Docs OAuth2 credentials.

17. **Activate the workflow** and test by submitting keywords via the form URL generated by the Form Trigger node.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                | Context or Link                                                                                 |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| The workflow relies on Dumpling AI services (Autocomplete, Google News, Scraper) and requires valid API credentials for HTTP Header Authentication.                                                          | Dumpling AI API documentation: https://app.dumplingai.com/docs                               |
| The OpenAI Langchain node uses GPT-4.1-MINI; ensure your OpenAI API plan supports GPT-4 usage and has sufficient quota.                                                                                      | OpenAI API docs: https://platform.openai.com/docs                                            |
| Google Docs nodes require OAuth2 credentials with permission to create and update documents in the specified folder.                                                                                        | Google Docs API documentation: https://developers.google.com/docs/api                         |
| The filtering code for articles expects relative date strings like "15 hours ago" or "yesterday" and may discard articles with unsupported date formats.                                                    | Custom code node; can be adjusted for other date formats if needed.                           |
| The workflow uses batching and delays to avoid hitting rate limits on Dumpling AI APIs. Adjust delay duration as needed based on actual API limits and response times.                                       | Consider adding error handling and retries for robustness in production environments.         |
| Blog post generation enforces JSON-only output from OpenAI to facilitate automatic parsing and insertion into Google Docs without manual intervention.                                                      | Strict prompt engineering is critical for stable JSON output.                                |

---

**Disclaimer:** The text provided originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data processed is legal and public.