Auto-translate Blog Articles with Google Translate and Airtable Storage

https://n8nworkflows.xyz/workflows/auto-translate-blog-articles-with-google-translate-and-airtable-storage-6825


# Auto-translate Blog Articles with Google Translate and Airtable Storage

---

### 1. Workflow Overview

This workflow automates the process of translating a blog article from English to French. It achieves this by fetching the article's HTML content from a specified URL, extracting the visible text content, storing it in Airtable, translating the text using Google Translate, and finally updating the Airtable record with the translated text.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception**: Manually triggered execution that initiates the workflow.
- **1.2 Content Acquisition and Extraction**: Fetch the HTML content of the blog post and extract the visible text.
- **1.3 Storage of Original Text**: Save the extracted text into an Airtable base.
- **1.4 Translation Process**: Translate the stored text from English to French using Google Translate.
- **1.5 Storage of Translated Text**: Update the Airtable record with the translated French text.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block permits manual triggering of the workflow, serving as the entry point.

- **Nodes Involved:**  
  - When clicking ‘Execute workflow’

- **Node Details:**  
  - **When clicking ‘Execute workflow’**  
    - Type: Manual Trigger  
    - Role: Starts the workflow on user command rather than an automated schedule or external event.  
    - Configuration: Default manual trigger without parameters.  
    - Input: None  
    - Output: Triggers the next node "HTTP Request".  
    - Edge cases: No external dependencies; failure unlikely unless manual execution is not performed.

---

#### 2.2 Content Acquisition and Extraction

- **Overview:**  
  This block retrieves the blog post HTML content via HTTP and extracts the visible text from it.

- **Nodes Involved:**  
  - HTTP Request  
  - Code

- **Node Details:**  

  - **HTTP Request**  
    - Type: HTTP Request node  
    - Role: Fetches the raw HTML content of the blog post from the given URL.  
    - Configuration:  
      - URL: `https://dorik.com/blog/what-makes-a-good-website`  
      - Options: Default (no authentication, no headers).  
    - Input: Triggered by manual trigger.  
    - Output: Response body containing HTML passed to the "Code" node.  
    - Edge cases:  
      - HTTP errors (404, 500, timeouts) could cause failure.  
      - Changes in the target page structure or URL may break extraction.

  - **Code**  
    - Type: Code node (JavaScript)  
    - Role: Parses the HTML content to extract visible blog text.  
    - Configuration:  
      - Uses `cheerio` library to load HTML content.  
      - Extracts text from elements with class `.dorik-postContent-cnuauoa5`.  
      - Trims whitespace and returns extracted text as `blogContent`.  
    - Key Expressions:  
      - `const $ = cheerio.load(html);`  
      - `const blogContent = $('.dorik-postContent-cnuauoa5').text().trim();`  
    - Input: Raw HTML from HTTP Request node.  
    - Output: JSON with key `blogContent`.  
    - Edge cases:  
      - If the class `.dorik-postContent-cnuauoa5` changes or does not exist, extraction returns empty string.  
      - If the HTTP response is not proper HTML, parsing may fail or result in incorrect extraction.  
      - Requires `cheerio` library available in the n8n environment.  
    - Sticky Note: "Extract the HTML and convert to text"

---

#### 2.3 Storage of Original Text

- **Overview:**  
  This block stores the extracted blog text into an Airtable base, creating a new record.

- **Nodes Involved:**  
  - Create a record

- **Node Details:**  

  - **Create a record**  
    - Type: Airtable node  
    - Role: Adds a new record to Airtable containing the extracted blog text.  
    - Configuration:  
      - Base: `appP62U5MtSww1eeP` (N8n experiment)  
      - Table: `tblHVSfUR71dToSif` (Table 1)  
      - Columns mapped:  
        - `HTML`: set to extracted `blogContent` from previous node (`={{ $json.blogContent }}`)  
        - `TRANSLATED`: left empty (`=`) initially  
      - Operation: Create  
      - Authentication: Airtable OAuth2 (credential named "ABRAR AIRTABLE")  
    - Input: Extracted blog content JSON from Code node.  
    - Output: Airtable record metadata passed to the next node.  
    - Edge cases:  
      - Authentication failures with Airtable OAuth2.  
      - Airtable API rate limits.  
      - Missing or malformed blog content leads to empty record fields.  
    - Sticky Note: "Store the Text"

---

#### 2.4 Translation Process

- **Overview:**  
  This block translates the stored blog text from English to French using Google Translate.

- **Nodes Involved:**  
  - Translate a language

- **Node Details:**  

  - **Translate a language**  
    - Type: Google Translate node  
    - Role: Translates the original blog text stored in Airtable.  
    - Configuration:  
      - Text: Uses `HTML` field from Airtable record (`={{ $json.fields.HTML }}`)  
      - Target language: French (`fr`)  
      - Authentication: Google Translate OAuth2 (credential named "Google Translate account")  
    - Input: Airtable record from "Create a record" node.  
    - Output: JSON containing `translatedText` field with the French translation.  
    - Edge cases:  
      - Authentication errors with Google Translate OAuth2.  
      - API quota exceeded or rate limits.  
      - Empty or malformed input text leads to empty translations.  
    - Sticky Note: "Translate"

---

#### 2.5 Storage of Translated Text

- **Overview:**  
  This block updates the Airtable record with the French translated blog text.

- **Nodes Involved:**  
  - Update record

- **Node Details:**  

  - **Update record**  
    - Type: Airtable node  
    - Role: Updates the existing Airtable record’s `TRANSLATED` field with the translated text.  
    - Configuration:  
      - Base: same as creation `appP62U5MtSww1eeP`  
      - Table: same as creation `tblHVSfUR71dToSif`  
      - Columns mapped:  
        - Matches record by `HTML` field (`matchingColumns:["HTML"]`)  
        - Updates `TRANSLATED` field with translation `={{ $json.translatedText }}`  
      - Operation: Update  
      - Authentication: same Airtable OAuth2 credential as before  
    - Input: Translation JSON from Google Translate node.  
    - Output: Updated Airtable record metadata.  
    - Edge cases:  
      - If the matching record is not found by `HTML` field, update fails or writes to the wrong record.  
      - Airtable API errors or authentication issues.  
      - Empty translation text updates with empty field.  
    - Sticky Note: "Store Translated Blog"

---

### 3. Summary Table

| Node Name                   | Node Type             | Functional Role                          | Input Node(s)               | Output Node(s)             | Sticky Note                      |
|-----------------------------|-----------------------|----------------------------------------|-----------------------------|----------------------------|---------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger        | Starts the workflow manually            | -                           | HTTP Request               |                                 |
| HTTP Request                | HTTP Request          | Fetches blog HTML content               | When clicking ‘Execute workflow’ | Code                       |                                 |
| Code                        | Code                  | Extracts visible blog text from HTML   | HTTP Request                | Create a record            | Extract the HTML and convert to text |
| Create a record             | Airtable              | Stores extracted blog text in Airtable | Code                        | Translate a language       | Store the Text                  |
| Translate a language        | Google Translate      | Translates blog text English → French  | Create a record             | Update record              | Translate                      |
| Update record               | Airtable              | Updates Airtable record with translation | Translate a language        | -                          | Store Translated Blog           |
| Sticky Note                 | Sticky Note           | Annotation                             | -                           | -                          | Extract the HTML and convert to text |
| Sticky Note1                | Sticky Note           | Annotation                             | -                           | -                          | Store the Text                  |
| Sticky Note2                | Sticky Note           | Annotation                             | -                           | -                          | Translate                      |
| Sticky Note3                | Sticky Note           | Annotation                             | -                           | -                          | Store Translated Blog           |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Name: `When clicking ‘Execute workflow’`  
   - Type: Manual Trigger (default settings)  

2. **Create HTTP Request Node**  
   - Name: `HTTP Request`  
   - Type: HTTP Request  
   - Configuration:  
     - URL: `https://dorik.com/blog/what-makes-a-good-website`  
     - No authentication or headers needed  
   - Connect output of Manual Trigger → HTTP Request  

3. **Create Code Node**  
   - Name: `Code`  
   - Type: Code (JavaScript)  
   - Configuration: Use this script:  
     ```javascript
     const cheerio = require('cheerio');

     const raw = items[0].json.body || items[0].json.data || items[0].json;
     const html = typeof raw === 'string' ? raw : JSON.stringify(raw);

     const $ = cheerio.load(html);

     // Extract just the visible text
     const blogContent = $('.dorik-postContent-cnuauoa5').text().trim();

     return [
       {
         json: {
           blogContent
         }
       }
     ];
     ```  
   - Connect output of HTTP Request → Code  

4. **Create Airtable Node to Create Record**  
   - Name: `Create a record`  
   - Type: Airtable  
   - Configuration:  
     - Operation: Create  
     - Base: Select your Airtable base (e.g., `appP62U5MtSww1eeP`)  
     - Table: Select table (e.g., `tblHVSfUR71dToSif`)  
     - Columns:  
       - `HTML`: Set to `={{ $json.blogContent }}`  
       - `TRANSLATED`: Leave empty `=`  
     - Authentication: Set up Airtable OAuth2 credentials (e.g., "ABRAR AIRTABLE")  
   - Connect output of Code → Create a record  

5. **Create Google Translate Node**  
   - Name: `Translate a language`  
   - Type: Google Translate  
   - Configuration:  
     - Text: `={{ $json.fields.HTML }}` (pulls original blog content from Airtable record)  
     - Translate to: `fr` (French)  
     - Authentication: Configure Google Translate OAuth2 credentials (e.g., "Google Translate account")  
   - Connect output of Create a record → Translate a language  

6. **Create Airtable Node to Update Record**  
   - Name: `Update record`  
   - Type: Airtable  
   - Configuration:  
     - Operation: Update  
     - Base: Same as create node  
     - Table: Same as create node  
     - Matching Columns: Select `HTML` (to find the original record)  
     - Columns to update:  
       - `TRANSLATED`: `={{ $json.translatedText }}`  
     - Authentication: Same Airtable OAuth2 credentials  
   - Connect output of Translate a language → Update record  

7. **Optional: Add Sticky Notes**  
   - Add sticky notes near nodes for clarity, as per original workflow:  
     - Near Code: "Extract the HTML and convert to text"  
     - Near Create a record: "Store the Text"  
     - Near Translate a language: "Translate"  
     - Near Update record: "Store Translated Blog"  

8. **Final Checks**  
   - Ensure all credentials (Airtable OAuth2 and Google Translate OAuth2) are properly configured and valid.  
   - Test HTTP Request URL for accessibility.  
   - Confirm that the target blog structure matches the CSS selector `.dorik-postContent-cnuauoa5`.  
   - Confirm n8n environment supports `cheerio` for HTML parsing.  

---

### 5. General Notes & Resources

| Note Content                                                                                   | Context or Link                                                |
|-----------------------------------------------------------------------------------------------|---------------------------------------------------------------|
| The workflow depends on the CSS class `.dorik-postContent-cnuauoa5` to extract blog content. Any changes to the blog page structure will require updating the selector in the Code node. | Extraction logic in Code node                                  |
| OAuth2 credentials for Airtable and Google Translate must be set up prior to execution.        | Credential setup in Airtable and Google Translate nodes       |
| The workflow is triggered manually but can be adapted for scheduled or webhook triggers.       | Manual Trigger node                                            |
| The blog translation is currently hardcoded to French (`fr`). Modify the Translate node to support other languages. | Google Translate node configuration                            |
| For troubleshooting HTTP errors, verify network access and URL correctness.                     | HTTP Request node                                              |
| Cheerio is used for HTML parsing in Code node, ensure the environment supports it.              | Code node dependencies                                         |

---

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

---