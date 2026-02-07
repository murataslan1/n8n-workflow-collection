AI Powered Web Scraping with Jina, Google Sheets and OpenAI : the EASY way

https://n8nworkflows.xyz/workflows/ai-powered-web-scraping-with-jina--google-sheets-and-openai---the-easy-way-2552


# AI Powered Web Scraping with Jina, Google Sheets and OpenAI : the EASY way

### 1. Workflow Overview

This workflow automates web scraping of book data from a specified website, structures the extracted information, and saves it into a Google Sheets spreadsheet for easy access and analysis. It is designed for use cases where users want to collect and organize product data (books, in this example) from an online catalog without manual copying.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Manual trigger to start the workflow.
- **1.2 Web Scraping:** HTTP request to Jina AI’s service, which scrapes the target web page and returns a text representation optimized for language models.
- **1.3 AI-Powered Information Extraction:** Uses a LangChain Information Extractor node with an AI model (Claude AI via OpenAI Chat Model integration) to parse the scraped text and extract structured book details according to a JSON schema.
- **1.4 Data Splitting:** Splits the extracted JSON array into individual book entries for further processing.
- **1.5 Google Sheets Integration:** Appends each book entry as a new row into a predefined Google Sheets spreadsheet.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block initiates the workflow manually by the user clicking "Test workflow."

- **Nodes Involved:**  
  - When clicking "Test workflow"

- **Node Details:**  
  - **Type & Role:** Manual Trigger node; starts the workflow on user command.  
  - **Configuration:** Default settings; no parameters.  
  - **Inputs/Outputs:** No input; outputs a single trigger event to "Jina Fetch".  
  - **Edge Cases:** None; manual trigger is reliable.  
  - **Version:** n8n-nodes-base.manualTrigger, version 1.

---

#### 2.2 Web Scraping

- **Overview:**  
  Sends an HTTP request to Jina AI’s scraping endpoint, which retrieves and pre-processes the target website’s content into a text format suitable for AI parsing.

- **Nodes Involved:**  
  - Jina Fetch

- **Node Details:**  
  - **Type & Role:** HTTP Request node; performs authenticated GET request to Jina's scraping API.  
  - **Configuration:**  
    - URL: `https://r.jina.ai/http://books.toscrape.com/catalogue/category/books/historical-fiction_4/index.html` — proxy URL that instructs Jina AI to scrape the specified page.  
    - Authentication: HTTP Header Auth with Jina AI API key injected as a header.  
    - Options: Allows unauthorized certificates (useful for dev/test environments).  
  - **Key Expressions:** None dynamic; URL and auth credentials are static.  
  - **Input/Output:** Input from manual trigger; outputs JSON with scraped text under `data` attribute.  
  - **Edge Cases:**  
    - API key invalid or expired → authentication error.  
    - Target URL unreachable or changed → HTTP timeout or 404/500 errors.  
    - Jina AI service downtime.  
  - **Version:** n8n-nodes-base.httpRequest, version 4.1.

---

#### 2.3 AI-Powered Information Extraction

- **Overview:**  
  Uses an AI-powered Information Extractor node that applies a custom JSON schema to parse the scraped text and extract structured book information such as title, price, availability, image URL, and product URL.

- **Nodes Involved:**  
  - Information Extractor  
  - OpenAI Chat Model (LangChain integration, used as AI backend)

- **Node Details:**  
  - **Information Extractor:**  
    - **Type & Role:** LangChain Information Extractor node; extracts structured data from unstructured text using AI and a JSON schema.  
    - **Configuration:**  
      - Input text: Expression `={{ $json.data }}` — uses scraped text from previous node.  
      - System prompt: Instructs AI to extract only relevant book info, omit unknown values, and output as a JSON array `results` with specified fields.  
      - Schema Type: Manual JSON schema defining array of objects with properties: title (string), price (string), availability (string), image_url (string), product_url (string).  
    - **Input/Output:** Receives text from "Jina Fetch"; outputs JSON structured data under field `results`.  
    - **Edge Cases:**  
      - AI fails to extract or outputs malformed JSON → downstream nodes may error.  
      - Extraction may omit fields if unknown per prompt.  
      - Rate limits or API errors from OpenAI backend.  
    - **Version:** Type version 1.  
  - **OpenAI Chat Model:**  
    - **Type & Role:** AI language model node used by the Information Extractor node as backend.  
    - **Configuration:**  
      - No special parameters; uses default OpenAI Chat model settings.  
      - Credentials: OpenAI API key credential named "Derek T."  
    - **Input/Output:** Receives prompt from Information Extractor; returns AI response.  
    - **Edge Cases:** API key invalid, rate limits, or connectivity issues.  
    - **Version:** LangChain integration, version 1.

---

#### 2.4 Data Splitting

- **Overview:**  
  Splits the array of extracted book objects into individual items to process each book entry separately downstream.

- **Nodes Involved:**  
  - Split Out

- **Node Details:**  
  - **Type & Role:** SplitOut node; splits JSON array in field `output.results` into multiple items.  
  - **Configuration:**  
    - Field to split: `output.results` (the array of book objects).  
  - **Input/Output:** Input from "Information Extractor"; outputs multiple items each representing one book.  
  - **Edge Cases:**  
    - If `output.results` is empty or missing → no output items.  
    - Malformed JSON array may cause failures.  
  - **Version:** n8n-nodes-base.splitOut, version 1.

---

#### 2.5 Google Sheets Integration

- **Overview:**  
  Appends each extracted book’s details as a new row into a specific Google Sheets spreadsheet and sheet.

- **Nodes Involved:**  
  - Save to Google Sheets

- **Node Details:**  
  - **Type & Role:** Google Sheets node; writes data rows to a Google Sheets document.  
  - **Configuration:**  
    - Operation: Append rows.  
    - Document ID: `1VDbfi2PpeheD2ZlO6feX3RdMeSsm0XukQlNVW8uVcuo` (pre-existing Google Sheet).  
    - Sheet Name: Sheet identified by gid `258629074` (Sheet2).  
    - Columns: Automatically map input fields to columns `name`, `price`, `availability`, `image`, and `link`.  
    - Mapping uses autoMapInputData mode.  
  - **Input/Output:** Inputs individual book objects from "Split Out"; no output.  
  - **Credentials:** Google Sheets OAuth2 account named "Google Sheets account".  
  - **Edge Cases:**  
    - OAuth token expired or revoked → authentication errors.  
    - Sheet or document deleted or access revoked.  
    - Data type mismatches or missing fields may cause partial row writes.  
  - **Version:** n8n-nodes-base.googleSheets, version 4.2.

---

#### 2.6 Sticky Note (Documentation & Resources)

- **Overview:**  
  Provides user with links to tutorial video and example Google Sheet for reference.

- **Nodes Involved:**  
  - Sticky Note5

- **Node Details:**  
  - **Type & Role:** Sticky Note for documentation and links.  
  - **Content:**  
    - YouTube tutorial video link for setting up AI-powered web scraping with n8n and Jina AI.  
    - Link to example Google Sheet used in the workflow.  
  - **Input/Output:** None; standalone node.  
  - **Edge Cases:** None.  
  - **Version:** n8n-nodes-base.stickyNote, version 1.

---

### 3. Summary Table

| Node Name                | Node Type                                     | Functional Role                        | Input Node(s)            | Output Node(s)          | Sticky Note                                                                                     |
|--------------------------|-----------------------------------------------|-------------------------------------|--------------------------|-------------------------|------------------------------------------------------------------------------------------------|
| When clicking "Test workflow" | Manual Trigger (n8n-nodes-base.manualTrigger) | Starts the workflow manually          |                          | Jina Fetch              |                                                                                                |
| Jina Fetch               | HTTP Request (n8n-nodes-base.httpRequest)      | Calls Jina AI scraping service        | When clicking "Test workflow" | Information Extractor    |                                                                                                |
| Information Extractor    | LangChain Information Extractor (@n8n/n8n-nodes-langchain.informationExtractor) | Extracts structured book data from scraped text | Jina Fetch               | Split Out               |                                                                                                |
| OpenAI Chat Model        | LangChain OpenAI Chat Model (@n8n/n8n-nodes-langchain.lmChatOpenAi) | AI backend for Information Extractor  |                          | Information Extractor (AI backend) |                                                                                              |
| Split Out                | SplitOut (n8n-nodes-base.splitOut)             | Splits JSON array into individual books | Information Extractor     | Save to Google Sheets    |                                                                                                |
| Save to Google Sheets    | Google Sheets (n8n-nodes-base.googleSheets)    | Appends book data rows to Google Sheets | Split Out                |                         |                                                                                                |
| Sticky Note5             | Sticky Note (n8n-nodes-base.stickyNote)        | Provides tutorial and example sheet links |                          |                         | ## Start here: Step by Step Youtube Tutorial :star: [Video](https://youtu.be/f3AJYXHirr8), [Google Sheet Example](https://docs.google.com/spreadsheets/d/1VDbfi2PpeheD2ZlO6feX3RdMeSsm0XukQlNVW8uVcuo/edit?usp=sharing) |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node:**  
   - Add a Manual Trigger node named "When clicking \"Test workflow\"". No special configuration needed.

2. **Add HTTP Request Node (Jina Fetch):**  
   - Add an HTTP Request node named "Jina Fetch".  
   - Set HTTP Method to GET.  
   - Set URL to: `https://r.jina.ai/http://books.toscrape.com/catalogue/category/books/historical-fiction_4/index.html`  
   - Under "Options", enable "Allow Unauthorized Certificates".  
   - Under Authentication, select HTTP Header Auth.  
   - Add a new HTTP Header Authentication credential with your Jina AI API key.  
   - Connect the output of the Manual Trigger to this node.

3. **Add LangChain OpenAI Chat Model Node:**  
   - Add an AI Language Model node of type LangChain OpenAI Chat Model named "OpenAI Chat Model".  
   - Configure with your OpenAI API credentials (e.g., Claude AI via OpenAI API key).  
   - Leave default options. This node will be used as AI backend.

4. **Add LangChain Information Extractor Node:**  
   - Add an Information Extractor node named "Information Extractor".  
   - Set "Text" parameter to expression: `{{$json.data}}` to use the scraped text.  
   - Set "Schema Type" to Manual.  
   - Paste the following JSON schema for extraction:
     ```json
     {
       "results": {
         "type": "array",
         "items": {
           "type": "object",
           "properties": {
             "price": { "type": "string" },
             "title": { "type": "string" },
             "image_url": { "type": "string" },
             "product_url": { "type": "string" },
             "availability": { "type": "string" }
           }
         }
       }
     }
     ```
   - In "System Prompt Template", enter:
     ```
     You are an expert extraction algorithm.
     Only extract relevant information from the text.
     If you do not know the value of an attribute asked to extract, you may omit the attribute's value.
     Always output the data in a json array called results.  Each book should have a title, price, availability and product_url, image_url
     ```
   - Set the AI Language Model node reference to "OpenAI Chat Model".  
   - Connect the output of "Jina Fetch" to this node.

5. **Add SplitOut Node:**  
   - Add a SplitOut node named "Split Out".  
   - Set "Field to Split Out" to `output.results`.  
   - Connect output of "Information Extractor" to this node.

6. **Add Google Sheets Node:**  
   - Add a Google Sheets node named "Save to Google Sheets".  
   - Set operation to "Append".  
   - Set the Google Sheet Document ID to your spreadsheet ID (e.g., `1VDbfi2PpeheD2ZlO6feX3RdMeSsm0XukQlNVW8uVcuo`).  
   - Set Sheet Name to the specific sheet (e.g., Sheet2 with GID `258629074`).  
   - Configure columns with fields: `name`, `price`, `availability`, `image`, and `link`.  
   - Enable "Auto Map Input Data".  
   - Authenticate with your Google Sheets OAuth2 credentials.  
   - Connect output of "Split Out" to this node.

7. **Optional: Add Sticky Note:**  
   - Add a Sticky Note node with links to tutorial video and example spreadsheet for user reference.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                   | Context or Link                                                                                                                     |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------|
| Start here: Step by Step Youtube Tutorial :star: [AI Powered Web Scraping : the EASY way with n8n and Jina.ai (no-code!)](https://youtu.be/f3AJYXHirr8)                      | Video tutorial for full setup                                                                                                     |
| Google Sheet Example: [Book Prices Spreadsheet](https://docs.google.com/spreadsheets/d/1VDbfi2PpeheD2ZlO6feX3RdMeSsm0XukQlNVW8uVcuo/edit?usp=sharing)                          | Example Google Sheet used by the workflow                                                                                          |
| Jina AI service requires an API key for authentication. Sign up at [https://jina.ai](https://jina.ai) to get credentials.                                                     | Jina AI official site for API key registration                                                                                     |
| OpenAI API key is needed to use Claude AI or other AI models for information extraction. Obtain keys from [https://openai.com](https://openai.com) or your AI provider.        | OpenAI API documentation                                                                                                           |
| Google Sheets OAuth2 credentials must be configured with proper permissions to append rows to your target spreadsheet.                                                        | Google Sheets API and OAuth2 setup instructions                                                                                    |

---

This documentation provides a thorough understanding of the workflow’s structure and logic, enabling reproduction, modification, and troubleshooting by advanced users and AI agents alike.