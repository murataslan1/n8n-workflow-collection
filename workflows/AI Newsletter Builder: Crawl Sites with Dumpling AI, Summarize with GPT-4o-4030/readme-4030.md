AI Newsletter Builder: Crawl Sites with Dumpling AI, Summarize with GPT-4o

https://n8nworkflows.xyz/workflows/ai-newsletter-builder--crawl-sites-with-dumpling-ai--summarize-with-gpt-4o-4030


# AI Newsletter Builder: Crawl Sites with Dumpling AI, Summarize with GPT-4o

---
### 1. Workflow Overview

This workflow automates the process of building and sending a curated newsletter by crawling specified web articles, summarizing them with AI, and delivering the final content via email. It targets newsletter writers, content marketers, virtual assistants, and founders who want to streamline newsletter creation from raw URLs to polished, branded HTML emails.

**Logical Blocks:**

- **1.1 Input Reception**  
  Manual start trigger and retrieval of article URLs from Google Sheets.

- **1.2 Web Content Extraction**  
  Sending URLs to Dumpling AI’s crawl API to fetch article content, splitting multi-article responses into individual items for processing.

- **1.3 Data Structuring**  
  Mapping relevant fields (title, URL, content) per article and aggregating all articles into a single formatted prompt.

- **1.4 AI Summarization and Formatting**  
  Using GPT-4o to generate a newsletter subject line and HTML body summarizing all articles.

- **1.5 Newsletter Delivery**  
  Sending the formatted HTML newsletter via Gmail to specified recipients.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

**Overview:**  
Begins the workflow manually and fetches a list of article URLs from a Google Sheet to be processed.

**Nodes Involved:**  
- Start Workflow Manually  
- Get Website URLs from Google Sheet

**Node Details:**

- **Start Workflow Manually**  
  - Type: Manual Trigger  
  - Role: Entry point to initiate the workflow on-demand  
  - Configuration: Default, no parameters  
  - Inputs: None  
  - Outputs: Triggers next node  
  - Edge Cases: None significant; user must manually trigger or replace with schedule node for automation.

- **Get Website URLs from Google Sheet**  
  - Type: Google Sheets  
  - Role: Reads article URLs from a specified Google Sheet document and sheet/tab  
  - Configuration: Uses OAuth2 credentials linked to a Google account; configured with document ID and sheet name (e.g., "sites" document, "Sheet1" tab)  
  - Key Expressions: None; directly reads all rows in the sheet  
  - Inputs: Trigger from manual start  
  - Outputs: JSON array containing URLs (under a field like `websites`)  
  - Edge Cases:  
    - Google API rate limits or auth errors  
    - Empty or malformed URLs in the sheet  
  - Version Requirement: Node version 4.5 to support OAuth2 and Sheets API v4 features

---

#### 2.2 Web Content Extraction

**Overview:**  
Sends each URL to Dumpling AI’s `/crawl` endpoint to extract readable article content, then splits the multi-article response into individual items for further processing.

**Nodes Involved:**  
- Crawl and Extract Site Content with Dumpling AI  
- Split Extracted Results into Individual Items

**Node Details:**

- **Crawl and Extract Site Content with Dumpling AI**  
  - Type: HTTP Request  
  - Role: POSTs to Dumpling AI crawl API to fetch article content, limited to 5 results and depth of 2 links  
  - Configuration:  
    - URL: `https://app.dumplingai.com/api/v1/crawl`  
    - HTTP Method: POST  
    - Body: JSON containing URL (taken dynamically from previous node’s output), limit, depth, and format set to "text"  
    - Authentication: HTTP Header with API key credential for Dumpling AI  
  - Key Expressions:  
    - Uses expression `{{ $json.websites }}` to pass URL dynamically  
  - Inputs: URLs array from Sheets node  
  - Outputs: JSON with `results` array containing extracted articles  
  - Edge Cases:  
    - API key invalid or expired  
    - Network timeouts or API rate limits  
    - No content found for URL  
  - Version Requirement: Version 4.2 or higher for HTTP node features

- **Split Extracted Results into Individual Items**  
  - Type: SplitOut  
  - Role: Splits the array of extracted articles (`results` field) into individual workflow items for granular processing  
  - Configuration: Splits on the field named `results`  
  - Inputs: Output from Dumpling AI HTTP Request node  
  - Outputs: Individual article JSON objects, one per item  
  - Edge Cases: Empty or missing `results` field causes no items, halting downstream processing.

---

#### 2.3 Data Structuring

**Overview:**  
Maps and cleans each individual article’s key data fields (title, URL, content), then aggregates all articles into a single formatted string prompt suitable for AI summarization.

**Nodes Involved:**  
- Map Title, URL, and Page Text  
- Combine Articles into Single Prompt Format (Code Node)

**Node Details:**

- **Map Title, URL, and Page Text**  
  - Type: Set  
  - Role: Extracts and explicitly sets `metadata.title`, `metadata.original_url`, and `content` fields from each article item for consistent downstream access  
  - Configuration: Assigns three fields with values mapped from the input JSON  
  - Inputs: Individual article items from Split node  
  - Outputs: JSON with structured fields per article  
  - Edge Cases: Missing fields in input JSON may cause empty or default values

- **Combine Articles into Single Prompt Format**  
  - Type: Code (JavaScript)  
  - Role: Concatenates all articles into a single string with numbered entries, each including title, URL, and content separated by newlines, to serve as input prompt for GPT-4o  
  - Configuration: Custom JS code iterates over all items, builds formatted string, returns one JSON object with aggregated text under `aggregatedArticles`  
  - Key Expressions: Uses optional chaining for safety when accessing nested fields  
  - Inputs: Structured articles from Set node  
  - Outputs: Single JSON object with aggregated articles string  
  - Edge Cases: Empty input arrays result in empty output string; malformed content could lead to odd formatting

---

#### 2.4 AI Summarization and Formatting

**Overview:**  
Feeds the aggregated article text prompt into GPT-4o to generate a catchy newsletter subject line and an HTML-formatted newsletter body summarizing each article.

**Nodes Involved:**  
- Generate HTML Newsletter with Subject Using GPT-4o

**Node Details:**

- **Generate HTML Newsletter with Subject Using GPT-4o**  
  - Type: OpenAI (Langchain) Node  
  - Role: Uses GPT-4o model to transform raw article text into a summarized newsletter with subject line and HTML body  
  - Configuration:  
    - Model: gpt-4o  
    - Prompt: Instructions specify structured JSON output with subject and HTML body, including HTML tags `<h3>`, `<p>`, and `<br/>` for formatting  
    - JSON output enabled to directly parse response  
  - Key Expressions: Injects aggregated articles string into prompt using `{{ $json.aggregatedArticles }}`  
  - Inputs: Aggregated prompt string from Code node  
  - Outputs: JSON containing `subject` and `body` keys with newsletter content  
  - Edge Cases:  
    - API key or quota issues with OpenAI  
    - Unexpected output format or parsing errors if GPT response deviates from JSON spec  
  - Version Requirement: Node supporting Langchain and OpenAI API v1.8+

---

#### 2.5 Newsletter Delivery

**Overview:**  
Sends the AI-generated newsletter as an HTML email via Gmail to configured recipients.

**Nodes Involved:**  
- Send Newsletter via Gmail

**Node Details:**

- **Send Newsletter via Gmail**  
  - Type: Gmail  
  - Role: Sends the newsletter email using OAuth2 authentication  
  - Configuration:  
    - Recipient email address configured in `sendTo` field (should be updated by user)  
    - Email subject and HTML body dynamically mapped from GPT node’s JSON output (`subject` and `body`)  
    - Attribution disabled for clean formatting  
  - Inputs: JSON with newsletter content from GPT node  
  - Outputs: Standard Gmail node output (success/failure info)  
  - Credentials: Gmail OAuth2 account configured  
  - Edge Cases:  
    - Authentication failure or expired token  
    - Invalid recipient email  
    - Gmail API rate limits or sending restrictions  
  - Version Requirement: Node version 2.1+

---

### 3. Summary Table

| Node Name                                  | Node Type                  | Functional Role                              | Input Node(s)                       | Output Node(s)                                 | Sticky Note                                                                                                              |
|--------------------------------------------|----------------------------|----------------------------------------------|------------------------------------|------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------|
| Start Workflow Manually                     | Manual Trigger             | Entry point to start workflow manually       | -                                  | Get Website URLs from Google Sheet             | ### 🌐 Get Website Content Using Dumpling AI: This section starts with a manual trigger, then fetches URLs from Google Sheets. |
| Get Website URLs from Google Sheet          | Google Sheets              | Reads article URLs from Google Sheets        | Start Workflow Manually             | Crawl and Extract Site Content with Dumpling AI |                                                                                                                          |
| Crawl and Extract Site Content with Dumpling AI | HTTP Request               | Calls Dumpling AI crawl API to extract content | Get Website URLs from Google Sheet | Split Extracted Results into Individual Items   |                                                                                                                          |
| Split Extracted Results into Individual Items | SplitOut                   | Splits array of articles into individual items | Crawl and Extract Site Content with Dumpling AI | Map Title, URL, and Page Text                   |                                                                                                                          |
| Map Title, URL, and Page Text               | Set                        | Maps and cleans article fields                | Split Extracted Results into Individual Items  | Combine Articles into Single Prompt Format       |                                                                                                                          |
| Combine Articles into Single Prompt Format  | Code                       | Aggregates all articles into one formatted string | Map Title, URL, and Page Text       | Generate HTML Newsletter with Subject Using GPT-4o | ### 🧠 Summarize and Email AI-Generated Newsletter: Formats articles for GPT-4o summarization and sends email via Gmail. |
| Generate HTML Newsletter with Subject Using GPT-4o | OpenAI (Langchain)         | Generates newsletter subject and HTML body   | Combine Articles into Single Prompt Format | Send Newsletter via Gmail                        |                                                                                                                          |
| Send Newsletter via Gmail                   | Gmail                      | Sends AI-generated newsletter via email      | Generate HTML Newsletter with Subject Using GPT-4o | -                                              |                                                                                                                          |
| Sticky Note                                 | Sticky Note                | Describes Dumpling AI crawling block          | -                                  | -                                              | ### 🌐 Get Website Content Using Dumpling AI: This section starts with a manual trigger, then fetches URLs from Google Sheets. |
| Sticky Note1                                | Sticky Note                | Describes AI summarization and email sending | -                                  | -                                              | ### 🧠 Summarize and Email AI-Generated Newsletter: Formats articles for GPT-4o summarization and sends email via Gmail. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Manual Trigger Node**  
   - Node Type: Manual Trigger  
   - Purpose: To start the workflow on demand  
   - No special parameters required  
   - Position near the left side of the canvas

2. **Add a Google Sheets Node**  
   - Node Type: Google Sheets  
   - Purpose: Read article URLs from a configured Google Sheet  
   - Parameters:  
     - Document ID: Set to your Google Sheet’s document ID containing URLs  
     - Sheet Name: Set to your tab name (e.g., "Sheet1")  
     - Authentication: Connect your Google account using OAuth2 credentials  
   - Connect Manual Trigger output to this node’s input

3. **Add HTTP Request Node to Call Dumpling AI**  
   - Node Type: HTTP Request  
   - Purpose: POST URLs to Dumpling AI `/crawl` API to extract article content  
   - Parameters:  
     - URL: `https://app.dumplingai.com/api/v1/crawl`  
     - Method: POST  
     - Authentication: HTTP Header with your Dumpling AI API key credential  
     - Body Content Type: JSON  
     - Body JSON:  
       ```json
       {
         "url": "{{ $json.websites }}",
         "limit": "5",
         "depth": "2",
         "format": "text"
       }
       ```  
   - Connect Google Sheets output to this node

4. **Add SplitOut Node**  
   - Node Type: SplitOut  
   - Purpose: Split the `results` array from Dumpling AI response into individual article items  
   - Parameters:  
     - Field to split out: `results`  
   - Connect HTTP Request node output to this node

5. **Add Set Node to Map Article Fields**  
   - Node Type: Set  
   - Purpose: Extract and store `metadata.title`, `metadata.original_url`, and `content` fields for each article  
   - Parameters: Assign fields:  
     - `metadata.title` = `{{$json.metadata.title}}`  
     - `content` = `{{$json.content}}`  
     - `metadata.original_url` = `{{$json.metadata.original_url}}`  
   - Connect SplitOut node output to this node

6. **Add Code Node to Aggregate Articles**  
   - Node Type: Code  
   - Purpose: Concatenate all articles into a single formatted string prompt for GPT  
   - Parameters: Use the following JavaScript code:  
     ```javascript
     let output = '';
     items.forEach((item, index) => {
       const title = item.json.metadata?.title || 'No title';
       const url = item.json.metadata?.original_url || 'No URL';
       const content = item.json.content || 'No content';

       output += `${index + 1}. ${title}\n${url}\n${content}\n\n`;
     });

     return [{ json: { aggregatedArticles: output } }];
     ```  
   - Connect Set node output to this node

7. **Add OpenAI Node (Langchain OpenAI)**  
   - Node Type: OpenAI (Langchain)  
   - Purpose: Generate newsletter subject line and HTML body from aggregated articles  
   - Parameters:  
     - Model ID: `gpt-4o`  
     - Prompt Message:  
       ```
       You are a newsletter assistant that creates a compelling subject line and summarizes a list of articles in engaging, well-structured HTML format.

       Instructions:

       1. Read the list of articles. Each article includes a title, content, and original URL.
       2. First, generate a short, catchy subject line for the newsletter based on the overall theme of the articles.
       3. Then, for each article:
          - Write the title inside an <h3> tag.
          - Summarize the article in 2 to 3 engaging sentences inside a <p> tag.
          - Below the summary, write: “To read more, click the link:” and include the original URL as a clickable link inside another <p> tag.
          - Add a <br/> to separate entries.

       Return the result in this JSON format:

       {
         "subject": "[Newsletter subject line]",
         "body": "[HTML body with all the articles]"
       }

       Only output the JSON. Do not explain anything else.

       Here is the input: {{ $json.aggregatedArticles }}
       ```  
     - Enable JSON output parsing  
     - Authentication: Connect your OpenAI API credentials  
   - Connect Code node output to this node

8. **Add Gmail Node**  
   - Node Type: Gmail  
   - Purpose: Send the newsletter email with generated subject and HTML body  
   - Parameters:  
     - Send To: Enter recipient email(s)  
     - Subject: `={{ $json.message.content.subject }}` (map from OpenAI node output)  
     - Message (Body): `={{ $json.message.content.body }}`  
     - Disable ‘append attribution’ for clean formatting  
   - Authentication: Connect your Gmail OAuth2 credentials  
   - Connect OpenAI node output to this node

---

### 5. General Notes & Resources

| Note Content                                                                                  | Context or Link                               |
|-----------------------------------------------------------------------------------------------|-----------------------------------------------|
| Dumpling AI is used for crawling and extracting web articles efficiently.                      | https://app.dumplingai.com                     |
| Workflow can be easily scheduled by replacing manual trigger with a Schedule node.            | n8n documentation on Schedule node             |
| GPT-4o model provides advanced AI summarization capabilities for newsletter creation.         | OpenAI GPT-4o model documentation               |
| Gmail node requires OAuth2 authentication; ensure credentials have email sending permissions. | Google Cloud Console and Gmail API setup guides |
| Workflow design allows easy customization such as changing AI tone, adding filters, or output | Flexible for Slack, Airtable, Notion integrations |
| Sticky notes added in the workflow provide helpful context for block purposes and usage tips.  | Embedded within the workflow canvas              |

---

**Disclaimer:** The text above is generated from an automated workflow designed with n8n, respecting all applicable content policies. It contains no illegal or protected content and processes only legal, public data.