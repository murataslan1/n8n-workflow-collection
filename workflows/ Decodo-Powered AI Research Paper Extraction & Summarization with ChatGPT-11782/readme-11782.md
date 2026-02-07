 Decodo-Powered AI Research Paper Extraction & Summarization with ChatGPT

https://n8nworkflows.xyz/workflows/-decodo-powered-ai-research-paper-extraction---summarization-with-chatgpt-11782


#  Decodo-Powered AI Research Paper Extraction & Summarization with ChatGPT

### 1. Workflow Overview

This workflow automates the extraction, processing, summarization, and storage of recent AI research papers listed on arXiv. It is designed for researchers and knowledge workers who want to keep up-to-date with AI advancements without manually browsing or reading full papers.

The workflow contains the following logical blocks:

- **1.1 Scheduled Trigger & Paper Scraping:** Automatically triggers the workflow monthly, then scrapes the latest AI research listings from arXiv using Decodo, a specialized web scraper.
- **1.2 Article Extraction:** Parses the raw HTML content fetched by Decodo to identify individual article titles and their corresponding PDF download links, structuring this into JSON.
- **1.3 Iterative PDF Download and Text Extraction:** Loops over each extracted article link to download the PDF, convert it to plain text, and prepare it for AI summarization.
- **1.4 AI Summarization:** Uses OpenAI GPT-based models to chunk and summarize the extracted paper text into concise, human-readable summaries.
- **1.5 Data Storage and Notification:** Appends the summarized data into a Google Sheets spreadsheet serving as a research database and sends a Telegram notification alerting users of new summaries.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Trigger & Paper Scraping

- **Overview:** Initiates the workflow automatically on a monthly basis and scrapes the recent AI research paper listings from arXiv using Decodo, which handles scraping reliably while bypassing site restrictions.
- **Nodes Involved:** Schedule Trigger, Decodo, Extract HTML Content
- **Node Details:**

  - **Schedule Trigger**
    - Type: Schedule Trigger
    - Configuration: Set to trigger once every month (interval by months)
    - Input: None (starts the workflow)
    - Output: Triggers the Decodo node
    - Potential Failures: Misconfiguration of schedule interval; workflow inactive state prevents triggering

  - **Decodo**
    - Type: Decodo scraper node (specialized scraping node)
    - Configuration: Target URL is the recent AI papers listing on arXiv (`https://arxiv.org/list/cs.AI/recent?skip=0&show=25`)
    - Credentials: Requires Decodo API key credential configured
    - Input: Trigger from Schedule Trigger
    - Output: Raw HTML content of the arXiv page
    - Failure Modes: API quota limits, network errors, invalid credentials, site structure changes

  - **Extract HTML Content**
    - Type: HTML Extraction node
    - Configuration: Extracts content from the `#articles` CSS selector, excluding `<h3>` tags, trims and cleans text
    - Input: Raw HTML from Decodo
    - Output: Extracted HTML content of the articles block, passed to Extract Articles
    - Edge Cases: Page structure changes causing CSS selector failures, empty content extraction

#### 2.2 Article Extraction

- **Overview:** Converts the extracted HTML content into structured JSON that lists each article with its title and PDF link.
- **Nodes Involved:** Extract Articles, OpenAI Chat Model1, Split Out
- **Node Details:**

  - **Extract Articles**
    - Type: Langchain Information Extractor
    - Configuration: Uses a JSON schema to parse the `articles` array containing `title` and `pdf_link` fields from the HTML content
    - Input: Cleaned HTML content from Extract HTML Content
    - Output: JSON array of articles
    - Failure Modes: Parsing errors if HTML format changes, invalid JSON schema matching

  - **OpenAI Chat Model1**
    - Type: Langchain OpenAI Chat Model (GPT-5-mini)
    - Configuration: Used as an AI language model to assist in extracting structured data
    - Input: Receives content from Extract HTML Content to possibly improve extraction accuracy
    - Output: Feeds into Extract Articles node
    - Credentials: Requires OpenAI API key
    - Failures: API quota, model unavailability

  - **Split Out**
    - Type: Split Out node
    - Configuration: Splits the JSON array of articles into individual items for batch processing
    - Input: Articles array from Extract Articles
    - Output: Individual article JSON objects, passed to Loop Over Items
    - Edge Cases: Empty article list leads to no iterations

#### 2.3 Iterative PDF Download and Text Extraction

- **Overview:** Processes each article individually by downloading its PDF, extracting the textual content, then preparing it for summarization.
- **Nodes Involved:** Loop Over Items, Get PDF, PDF to Text, Set Content Field
- **Node Details:**

  - **Loop Over Items**
    - Type: Split In Batches
    - Configuration: Processes one article at a time (default batch size)
    - Input: Individual article JSON objects from Split Out
    - Output: Passes each item sequentially to download and extraction nodes
    - Edge Cases: Large batch size could cause timeouts or memory issues

  - **Get PDF**
    - Type: HTTP Request
    - Configuration: Downloads the PDF from the article’s `pdf_link`
    - Input: Article JSON from Loop Over Items
    - Output: PDF binary file
    - Failure Modes: Broken links, network errors, large file size timeouts

  - **PDF to Text**
    - Type: Extract From File
    - Configuration: Extracts text content from the downloaded PDF file
    - Input: PDF file data from Get PDF
    - Output: Extracted plain text of the paper
    - Edge Cases: Complex PDFs may yield incomplete or garbled text, extraction failures

  - **Set Content Field**
    - Type: Set
    - Configuration: Assigns extracted text to a new field named `text` for summarization input
    - Input: Extracted text from PDF to Text
    - Output: JSON with `text` field for summarization
    - Edge Cases: Missing or empty text field if extraction failed

#### 2.4 AI Summarization

- **Overview:** Uses a GPT-based summarization chain to chunk large paper texts and generate concise summaries.
- **Nodes Involved:** OpenAI Chat Model, Paper Summarizer
- **Node Details:**

  - **OpenAI Chat Model**
    - Type: Langchain OpenAI Chat Model (GPT-5-nano)
    - Configuration: Selected GPT-5-nano model for summarization
    - Input: Paper text from Set Content Field
    - Output: Text chunks fed into summarization chain
    - Credentials: Requires OpenAI API key
    - Failures: API limits, long processing times for large texts

  - **Paper Summarizer**
    - Type: Langchain Summarization Chain
    - Configuration: Uses chunk size of 10,000 characters with 2,000 overlap to handle long documents
    - Input: Text chunks from OpenAI Chat Model
    - Output: Concise summary text of the paper
    - Edge Cases: Poor chunk splitting may reduce summary quality, long papers may exceed max token limits

#### 2.5 Data Storage and Notification

- **Overview:** Stores the summarized paper data in a Google Sheets document and sends a Telegram message notification.
- **Nodes Involved:** Store to database, Telegram Notifier
- **Node Details:**

  - **Store to database**
    - Type: Google Sheets node
    - Configuration: Appends rows with four columns: paper URL, title, summary, and extraction date (formatted YYYY-MM-DD)
    - Input: Summary text and article info from Paper Summarizer and Loop Over Items
    - Output: Data appended to the specified Google Sheets document and sheet ID
    - Credentials: Requires Google Sheets OAuth2 credentials
    - Failures: Invalid spreadsheet ID, permission errors, API quota limits

  - **Telegram Notifier**
    - Type: Telegram node
    - Configuration: Sends a fixed notification text to a specified Telegram chat ID (group or channel)
    - Input: Triggered on each loop iteration (but effectively after first item)
    - Credentials: Requires Telegram Bot API credentials and chat ID
    - Edge Cases: Incorrect chat ID or revoked bot permissions cause message failure

---

### 3. Summary Table

| Node Name           | Node Type                             | Functional Role                        | Input Node(s)         | Output Node(s)         | Sticky Note                                                                                                                            |
|---------------------|-------------------------------------|-------------------------------------|-----------------------|------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| Schedule Trigger     | Schedule Trigger                    | Starts workflow monthly             | -                     | Decodo                 |                                                                                                                                         |
| Decodo              | Decodo scraper                     | Scrapes arXiv AI papers page       | Schedule Trigger       | Extract HTML Content    | Paper Scrapper: Decodo scrapes arXiv reliably, bypasses site limits, ensures clean data                                                  |
| Extract HTML Content | HTML Extraction                    | Extracts articles block from HTML   | Decodo                 | OpenAI Chat Model1, Extract Articles | Paper Scrapper: Converts raw HTML into structured data                                                                                   |
| OpenAI Chat Model1   | Langchain OpenAI Chat Model        | Assists article extraction AI       | Extract HTML Content   | Extract Articles        |                                                                                                                                         |
| Extract Articles     | Langchain Info Extractor           | Parses articles JSON from HTML      | OpenAI Chat Model1, Extract HTML Content | Split Out               |                                                                                                                                         |
| Split Out           | Split Out                         | Splits articles array into items    | Extract Articles       | Loop Over Items         |                                                                                                                                         |
| Loop Over Items      | Split In Batches                  | Processes each article sequentially | Split Out, Store to database | Telegram Notifier, Get PDF |                                                                                                                                         |
| Telegram Notifier    | Telegram                         | Sends notification on new summaries | Loop Over Items        | -                      |                                                                                                                                         |
| Get PDF             | HTTP Request                     | Downloads article PDF               | Loop Over Items        | PDF to Text             | PDF Download & Extraction: Downloads and converts to text for AI processing                                                             |
| PDF to Text         | Extract From File                 | Extracts text from PDF              | Get PDF                | Set Content Field       |                                                                                                                                         |
| Set Content Field   | Set                              | Prepares text field for summarization | PDF to Text            | Paper Summarizer        |                                                                                                                                         |
| OpenAI Chat Model    | Langchain OpenAI Chat Model       | Generates text chunks for summary   | Set Content Field      | Paper Summarizer        | Paper Summarizer: AI breaks papers into chunks and summarizes                                                                           |
| Paper Summarizer    | Langchain Summarization Chain    | Produces concise paper summary      | OpenAI Chat Model      | Store to database       |                                                                                                                                         |
| Store to database   | Google Sheets                    | Appends summaries to spreadsheet   | Paper Summarizer       | Loop Over Items         |                                                                                                                                         |
| Sticky Note1        | Sticky Note                      | Explains paper scraping and extraction blocks | -                     | -                      | Paper Scrapper explained: Decodo & extraction                                                                                           |
| Sticky Note4        | Sticky Note                      | Explains PDF extraction and summarization | -                     | -                      | PDF Download & Extraction and Paper Summarizer explained                                                                                |
| Sticky Note2        | Sticky Note                      | Workflow overview and setup steps   | -                     | -                      | Full workflow description and setup instructions                                                                                        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**
   - Type: Schedule Trigger
   - Parameters: Set interval to trigger every 1 month
   - No credentials needed

2. **Create Decodo Node**
   - Type: Decodo scraper node
   - Parameters: Set the URL to `https://arxiv.org/list/cs.AI/recent?skip=0&show=25`
   - Credentials: Configure Decodo API credentials with valid API key
   - Connect Schedule Trigger → Decodo

3. **Create Extract HTML Content Node**
   - Type: HTML Extraction node
   - Parameters:
     - Operation: Extract HTML Content
     - CSS Selector: `#articles`
     - Skip Selectors: `h3`
     - Trim and cleanup enabled
     - Data property name: `results[0].content`
   - Connect Decodo → Extract HTML Content

4. **Create OpenAI Chat Model1 Node**
   - Type: Langchain OpenAI Chat Model
   - Parameters: Select `gpt-5-mini` model
   - Credentials: Configure with OpenAI API key
   - Connect Extract HTML Content → OpenAI Chat Model1

5. **Create Extract Articles Node**
   - Type: Langchain Information Extractor
   - Parameters:
     - Text input: `{{$json.articles}}`
     - Schema type: fromJson
     - JSON schema example:
       ```
       {
         "articles": [
           {
             "title": "article title",
             "pdf_link": "pdf/2512.10937"
           }
         ]
       }
       ```
   - Connect OpenAI Chat Model1 → Extract Articles
   - Also connect Extract HTML Content → Extract Articles (main input)

6. **Create Split Out Node**
   - Type: Split Out
   - Parameters: field to split out: `output.articles`
   - Connect Extract Articles → Split Out

7. **Create Loop Over Items Node**
   - Type: Split In Batches
   - Parameters: default batch size (1)
   - Connect Split Out → Loop Over Items

8. **Create Telegram Notifier Node**
   - Type: Telegram
   - Parameters:
     - Text: `"🚨Latest Summary Papers are updated on google sheets🚨\n\nHappy learning!"`
     - Chat ID: `<your Telegram chat ID>`
   - Credentials: Telegram Bot credentials configured
   - Connect Loop Over Items → Telegram Notifier

9. **Create Get PDF Node**
   - Type: HTTP Request
   - Parameters:
     - URL: `={{ $json['output.articles'].pdf_link }}`
   - Connect Loop Over Items → Get PDF

10. **Create PDF to Text Node**
    - Type: Extract From File
    - Parameters:
      - Operation: pdf (extract text)
    - Connect Get PDF → PDF to Text

11. **Create Set Content Field Node**
    - Type: Set
    - Parameters:
      - Assign field `text` with value `={{ $json.text }}`
    - Connect PDF to Text → Set Content Field

12. **Create OpenAI Chat Model Node**
    - Type: Langchain OpenAI Chat Model
    - Parameters: Select `gpt-5-nano` model
    - Credentials: OpenAI API key
    - Connect Set Content Field → OpenAI Chat Model

13. **Create Paper Summarizer Node**
    - Type: Langchain Summarization chain
    - Parameters:
      - Chunk size: 10000
      - Chunk overlap: 2000
    - Connect OpenAI Chat Model → Paper Summarizer

14. **Create Store to Database Node**
    - Type: Google Sheets
    - Parameters:
      - Operation: Append
      - Document ID: Your target Google Sheets document
      - Sheet Name or ID: Your target sheet (e.g., `2088990373`)
      - Columns mapping:
        - url: `={{ $('Loop Over Items').item.json['output.articles'].pdf_link }}`
        - title: `={{ $('Loop Over Items').item.json['output.articles'].title }}`
        - summary: `={{ $json.output.text }}`
        - extracted date: `={{ DateTime.now().format('yyyy-MM-dd') }}`
    - Credentials: Google Sheets OAuth2 credentials configured
    - Connect Paper Summarizer → Store to database → Loop Over Items (to continue processing next item)

15. **(Optional) Add Sticky Notes**
    - Add descriptive sticky notes summarizing blocks for maintainability.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                         | Context or Link                                                                                   |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| Workflow automates AI research paper extraction & summarization from arXiv using Decodo and OpenAI GPT models.                                                     | Project description                                                                               |
| Decodo API offers reliable, scalable scraping bypassing site limits.                                                                                                | Decodo node usage                                                                                 |
| Google Sheets is used as a flexible research database for storing paper summaries.                                                                                  | Database storage                                                                                  |
| Telegram notifications keep users informed of new summaries.                                                                                                       | Notification system                                                                              |
| Setup requires API keys for Decodo, OpenAI, Google Sheets OAuth2, and Telegram Bot API.                                                                              | Credential configuration                                                                          |
| Adjust schedule trigger interval as needed to control update frequency.                                                                                            | Scheduling                                                                                       |
| Recommended to monitor API quotas and error logs for scraping and OpenAI usage to handle rate limiting or failures gracefully.                                     | Operational considerations                                                                       |
| For more on Langchain nodes in n8n, see https://docs.n8n.io/nodes/                                                                                                 | Official Langchain documentation                                                                 |
| For Decodo API details, visit https://decodo.com/api                                                                                                               | Decodo official site                                                                              |

---

**Disclaimer:** The text provided is exclusively derived from an automated n8n workflow. It adheres strictly to content policies and contains no illegal or protected content. All data processed is public and legal.