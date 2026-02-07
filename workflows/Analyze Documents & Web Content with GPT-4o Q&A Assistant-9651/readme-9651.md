Analyze Documents & Web Content with GPT-4o Q&A Assistant

https://n8nworkflows.xyz/workflows/analyze-documents---web-content-with-gpt-4o-q-a-assistant-9651


# Analyze Documents & Web Content with GPT-4o Q&A Assistant

### 1. Workflow Overview

This workflow, titled **"Analyze Documents & Web Content with GPT-4o Q&A Assistant"**, is designed to enable users to submit a combined input of a document path or URL along with a natural language question. It then extracts and processes the content from the specified source—whether a local file or a web page—and uses the GPT-4o model to provide a detailed, well-structured answer to the user’s question based solely on the extracted content.

The workflow targets use cases where users want to query the contents of various document types or web pages without manually reading or parsing them. It supports multiple document formats and intelligently cleans and truncates content if necessary to fit processing constraints.

The workflow logic is divided into the following key blocks:

- **1.1 Input Reception & Parsing:** Receives user input via a chat trigger and parses it into document location and question parts.
- **1.2 Source Type Determination:** Checks whether the input is a local file path or a URL to direct processing accordingly.
- **1.3 Content Retrieval & Extraction:** Loads the document from disk or fetches the web content, then extracts raw textual content.
- **1.4 Content Processing & Cleanup:** Cleans, formats, and truncates the extracted content to prepare it for AI analysis.
- **1.5 AI-Powered Document Analysis & Q&A:** Uses LangChain nodes with OpenAI GPT-4o to analyze the content and generate a comprehensive, structured answer.
- **1.6 Metadata & Context Notes:** Provides sticky notes describing workflow purpose and pipeline overview for maintainers and users.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception & Parsing

- **Overview:**  
  This block receives user input in the form of a single string combining a document path or URL and a question separated by a pipe character (`|`). It parses and validates these inputs, determines the source type, and extracts metadata about the input.

- **Nodes Involved:**  
  - Document Q&A Chat  
  - Parse Document & Question

- **Node Details:**

  - **Document Q&A Chat**  
    - *Type:* LangChain Chat Trigger  
    - *Role:* Entry point webhook node to receive chat input from user  
    - *Configuration:* Uses webhook ID `simple-doc-analyzer-chat`; no additional options configured  
    - *Input/Output:* No inputs; outputs user input text under field `chatInput`  
    - *Edge Cases:* Input missing or improperly formatted will be caught downstream  
    - *Version:* LangChain Chat Trigger v1.1

  - **Parse Document & Question**  
    - *Type:* Code (JavaScript)  
    - *Role:* Parses the combined string into a document path/URL and question, validates formats, and infers file type  
    - *Configuration Highlights:*  
      - Splits input by pipe (`|`) and trims parts  
      - Validates presence and length of document path and question  
      - Detects if input is URL (starts with http:// or https://)  
      - Infers file extension from path or URL; supports pdf, md, txt, doc, docx, json, yaml, yml  
      - Throws errors for unsupported or invalid inputs  
      - Returns JSON with `documentPath`, `userQuestion`, `fileType`, `inputType` (url/file), `isUrl` boolean, and ISO timestamp  
    - *Key Expressions:* Uses `$input.first().json.chatInput` for input string  
    - *Input/Output:* Input from previous node; outputs parsed metadata  
    - *Edge Cases:* Invalid input format, unsupported file types, missing question or path cause workflow errors  
    - *Version:* Code node v2

#### 1.2 Source Type Determination

- **Overview:**  
  This block uses conditional logic to route processing based on whether the input source is a local file or a URL.

- **Nodes Involved:**  
  - File Path Check (If node)  
  - URL Check (If node)

- **Node Details:**

  - **File Path Check**  
    - *Type:* If node  
    - *Role:* Checks if `isUrl` flag is false to confirm local file processing path  
    - *Configuration:* Condition: equals `{{$json.isUrl}}` to false (boolean)  
    - *Input/Output:* Input from Parse Document & Question; outputs to Read Document File if true  
    - *Edge Cases:* Misidentified URLs or file paths could misroute processing  
    - *Version:* If node v2

  - **URL Check**  
    - *Type:* If node  
    - *Role:* Checks if `isUrl` flag is true to confirm web content fetching path  
    - *Configuration:* Condition: equals `{{$json.isUrl}}` to true (boolean)  
    - *Input/Output:* Input from Parse Document & Question; outputs to Fetch Web Content if true  
    - *Edge Cases:* Same as above; network issues downstream  
    - *Version:* If node v2

#### 1.3 Content Retrieval & Extraction

- **Overview:**  
  Depending on source type, this block reads a local file or fetches web content. It then extracts raw text from the retrieved data.

- **Nodes Involved:**  
  - Read Document File  
  - Fetch Web Content  
  - Extract Document Content

- **Node Details:**

  - **Read Document File**  
    - *Type:* Read Binary File  
    - *Role:* Reads the local file specified by path into binary format  
    - *Configuration:* File path taken dynamically from `{{$json.documentPath}}`  
    - *Input/Output:* Input from File Path Check; outputs file binary data  
    - *Edge Cases:* File not found, permissions errors, unsupported file encoding  
    - *Version:* v1

  - **Fetch Web Content**  
    - *Type:* HTTP Request  
    - *Role:* Fetches web page content from the URL  
    - *Configuration:*  
      - URL dynamic from `{{$json.documentPath}}`  
      - Timeout 30 seconds, max 5 redirects  
      - Custom headers mimic browser user-agent and accept headers for better compatibility  
      - Response expected as plain text  
    - *Input/Output:* Input from URL Check; outputs HTTP response body  
    - *Edge Cases:* Network errors, invalid URLs, timeouts, HTTP errors  
    - *Version:* v4.2

  - **Extract Document Content**  
    - *Type:* Extract From File  
    - *Role:* Extracts text from binary file read in previous node (e.g., PDF, DOCX)  
    - *Configuration:* Operation set to extract text  
    - *Input/Output:* Input from Read Document File; outputs extracted text content  
    - *Edge Cases:* Extraction failure due to file corruption or unsupported formats  
    - *Version:* v1

#### 1.4 Content Processing & Cleanup

- **Overview:**  
  Processes the extracted or fetched content to clean HTML tags, format markdown, pretty-print JSON, and truncate overly long content.

- **Nodes Involved:**  
  - Process Document Content

- **Node Details:**

  - **Process Document Content**  
    - *Type:* Code (JavaScript)  
    - *Role:* Cleans and formats document or web content for AI consumption  
    - *Key Operations:*  
      - For URLs with HTML, strips scripts, styles, all HTML tags, and decodes HTML entities  
      - For markdown files, replaces code block fences with placeholders  
      - Formats JSON content with indentation  
      - Trims and normalizes whitespace in text files  
      - Truncates content longer than 15,000 characters, appending a truncation note  
      - Throws error if extracted content is too short or empty after processing  
    - *Input/Output:* Input from Extract Document Content or Fetch Web Content; outputs cleaned `documentContent` and metadata such as `contentLength` and `isContentTruncated`  
    - *Edge Cases:* Unexpected content structures, JSON parsing errors caught silently, empty or corrupted content triggers error  
    - *Version:* v2

#### 1.5 AI-Powered Document Analysis & Q&A

- **Overview:**  
  Uses the GPT-4o language model via LangChain to analyze the processed content and generate a detailed, human-readable answer to the user’s question.

- **Nodes Involved:**  
  - OpenAI Document Analyzer  
  - Analyze Document & Answer

- **Node Details:**

  - **OpenAI Document Analyzer**  
    - *Type:* LangChain LM Chat OpenAI  
    - *Role:* Provides GPT-4o model access  
    - *Configuration:* Model set to `gpt-4o`; no extra options configured  
    - *Credentials:* Uses stored OpenAI API credentials  
    - *Input/Output:* Input connected from Analyze Document & Answer node as language model provider  
    - *Edge Cases:* API authentication failure, rate limits, network issues  
    - *Version:* v1.2

  - **Analyze Document & Answer**  
    - *Type:* LangChain Agent  
    - *Role:* Defines prompt and instructions for summarizing and answering user questions from content  
    - *Configuration Details:*  
      - Prompt includes detailed instructions for formatting, structure, and response style  
      - Dynamically inserts metadata like source type, file type, content length, and truncation status  
      - Emphasizes clear formatting with headings, bullet points, tables, and quotes  
      - Specifies response structure including summary, direct answer, analysis, and notes  
    - *Input/Output:* Input from Process Document Content; outputs structured AI response text  
    - *Edge Cases:* Model hallucination if content is insufficient, incomplete answers if content truncated  
    - *Version:* v2.1

#### 1.6 Metadata & Context Notes

- **Overview:**  
  Provides workflow documentation and high-level process overview via sticky notes to assist users and maintainers.

- **Nodes Involved:**  
  - Workflow Info (Sticky Note)  
  - Pipeline Info (Sticky Note)

- **Node Details:**

  - **Workflow Info**  
    - *Type:* Sticky Note  
    - *Content:* Describes workflow purpose, input format, supported sources, and key features  
    - *Location:* Positioned at top left for visibility

  - **Pipeline Info**  
    - *Type:* Sticky Note  
    - *Content:* Lists simplified processing pipeline steps from input parsing to final AI response  
    - *Location:* Positioned near main pipeline start

---

### 3. Summary Table

| Node Name               | Node Type                             | Functional Role                           | Input Node(s)                 | Output Node(s)                   | Sticky Note                                               |
|-------------------------|-------------------------------------|-----------------------------------------|------------------------------|---------------------------------|-----------------------------------------------------------|
| Document Q&A Chat        | LangChain Chat Trigger               | Receives combined user input via webhook | None                         | Parse Document & Question        |                                                           |
| Parse Document & Question| Code                                | Parses input string into path and question, validates | Document Q&A Chat            | File Path Check, URL Check       |                                                           |
| File Path Check          | If                                  | Routes flow if input is a local file    | Parse Document & Question     | Read Document File              |                                                           |
| Read Document File       | Read Binary File                    | Reads local file content as binary      | File Path Check              | Extract Document Content         |                                                           |
| Extract Document Content | Extract From File                   | Extracts text from binary document       | Read Document File           | Process Document Content         |                                                           |
| URL Check                | If                                  | Routes flow if input is a URL            | Parse Document & Question     | Fetch Web Content               |                                                           |
| Fetch Web Content        | HTTP Request                       | Fetches web page content as text        | URL Check                   | Process Document Content         |                                                           |
| Process Document Content | Code                                | Cleans, formats, truncates content      | Extract Document Content, Fetch Web Content | Analyze Document & Answer       |                                                           |
| Analyze Document & Answer| LangChain Agent                    | Creates detailed answer from processed content | Process Document Content     | OpenAI Document Analyzer         |                                                           |
| OpenAI Document Analyzer | LangChain LM Chat OpenAI           | Provides GPT-4o model access             | Analyze Document & Answer    | None                            |                                                           |
| Workflow Info            | Sticky Note                        | Workflow purpose and feature summary    | None                         | None                           | Describes workflow purpose, input format, supported sources, and features |
| Pipeline Info            | Sticky Note                        | High-level pipeline step overview       | None                         | None                           | Summarizes processing pipeline from input to final AI answer |

---

### 4. Reproducing the Workflow from Scratch

1. **Create "Document Q&A Chat" node**  
   - Type: LangChain Chat Trigger  
   - Configure webhook ID as `simple-doc-analyzer-chat`  
   - No additional parameters needed

2. **Create "Parse Document & Question" node**  
   - Type: Code (JavaScript)  
   - Input: `chatInput` from previous node  
   - Code Logic:  
     - Split input by `|` into path and question  
     - Validate path length ≥ 3 and question length ≥ 5  
     - Determine if path is URL (starts with http/https)  
     - Infer file extension and validate supported types (pdf, md, txt, doc, docx, json, yaml, yml)  
     - Return object with `documentPath`, `userQuestion`, `fileType`, `inputType` (`file` or `url`), `isUrl`, and timestamp

3. **Create "File Path Check" node**  
   - Type: If  
   - Condition: `{{$json.isUrl}}` equals `false` (boolean)  
   - Input: Output of "Parse Document & Question"

4. **Create "URL Check" node**  
   - Type: If  
   - Condition: `{{$json.isUrl}}` equals `true` (boolean)  
   - Input: Output of "Parse Document & Question"

5. **Create "Read Document File" node**  
   - Type: Read Binary File  
   - File Path: Set dynamically to `{{$json.documentPath}}`  
   - Input: Output of "File Path Check" (true branch)

6. **Create "Extract Document Content" node**  
   - Type: Extract From File  
   - Operation: Extract text  
   - Input: Output of "Read Document File"

7. **Create "Fetch Web Content" node**  
   - Type: HTTP Request  
   - URL: Dynamic from `{{$json.documentPath}}`  
   - Options:  
     - Timeout: 30000 ms  
     - Redirect max: 5  
     - Response format: Text  
     - Headers:  
       - User-Agent: Browser-like string  
       - Accept: `text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8`  
       - Accept-Language: `en-US,en;q=0.9`  
   - Input: Output of "URL Check" (true branch)

8. **Create "Process Document Content" node**  
   - Type: Code (JavaScript)  
   - Input: Output from either "Extract Document Content" or "Fetch Web Content"  
   - Code Logic:  
     - For URLs with HTML, strip scripts, styles, tags, and decode HTML entities  
     - For markdown, replace code fences with placeholders  
     - Format JSON with indentation, ignore YAML formatting  
     - Normalize whitespace and trim  
     - Truncate content to 15,000 characters max, append truncation message  
     - Throw error if processed content length < 10 characters  
     - Output processed content and metadata

9. **Create "Analyze Document & Answer" node**  
   - Type: LangChain Agent  
   - Parameters:  
     - Define prompt with detailed instructions for formatting, response structure, and content analysis  
     - Inject dynamic variables for source type, path, file and input type, content length, truncation status, document content, and user question  
   - Input: Output from "Process Document Content"

10. **Create "OpenAI Document Analyzer" node**  
    - Type: LangChain LM Chat OpenAI  
    - Model: `gpt-4o`  
    - Credentials: Configure OpenAI API credentials (OAuth or API key)  
    - Input: Connect from "Analyze Document & Answer" node

11. **Add two Sticky Notes for documentation**  
    - "Workflow Info": Describe purpose, inputs, supported sources, and features  
    - "Pipeline Info": Summarize pipeline steps from input parsing to AI response

12. **Connect nodes according to the following main flow:**  
    Document Q&A Chat → Parse Document & Question → (File Path Check → Read Document File → Extract Document Content)  
    AND  
    Parse Document & Question → (URL Check → Fetch Web Content)  
    Both Extract Document Content and Fetch Web Content → Process Document Content → Analyze Document & Answer → OpenAI Document Analyzer

---

### 5. General Notes & Resources

| Note Content                                                                                                            | Context or Link                                               |
|-------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------|
| Hybrid Document & Web Analyzer: supports local files (PDF, MD, TXT, JSON, YAML, Word docs) and web URLs (HTML pages).   | Sticky note "Workflow Info" node                              |
| Input format requires: `"path_or_url | your_question"` (pipe-separated string).                                          | Sticky note "Workflow Info" node                              |
| Processing pipeline: Parse input → Read file/fetch URL → Extract content → Process content → AI analysis → Response.   | Sticky note "Pipeline Info" node                              |
| Uses GPT-4o model via LangChain with detailed prompt for structured, readable Q&A responses.                            | Analyze Document & Answer and OpenAI Document Analyzer nodes  |
| Web content fetching uses browser-like headers to improve compatibility and avoid blocks.                               | Fetch Web Content node configuration                           |

---

**Disclaimer:**  
The provided text is exclusively derived from an automated workflow created with n8n, an integration and automation platform. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All handled data is legal and publicly available.