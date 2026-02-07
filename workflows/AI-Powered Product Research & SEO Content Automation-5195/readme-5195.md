AI-Powered Product Research & SEO Content Automation

https://n8nworkflows.xyz/workflows/ai-powered-product-research---seo-content-automation-5195


# AI-Powered Product Research & SEO Content Automation

---

### 1. Workflow Overview

This workflow, **AI-Powered Product Research & SEO Content Automation**, is designed to automate the process of product research and SEO content generation. It targets digital marketers, SEO specialists, and e-commerce professionals who need to quickly generate optimized product descriptions and SEO metadata based on competitor analysis.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception**: Collect product title input from a user via a web form.
- **1.2 Query Preparation**: Format and prepare the product title for a Google Custom Search query.
- **1.3 Competitor Data Collection**: Perform a Google Custom Search to retrieve competitor product data.
- **1.4 Competitor Data Extraction**: Extract titles, descriptions, and keywords from search results.
- **1.5 AI SEO & Content Generation**: Use LangChain LLM to generate SEO metadata and product content.
- **1.6 AI Content Refinement**: Refine content quality and engagement using Google Gemini (PaLM) chat model.
- **1.7 Content Formatting**: Split the AI-generated content into structured sections for SEO metadata and product content.
- **1.8 Data Storage**: Append the finalized content into a Google Sheets document for easy access and management.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  Captures the product title from the user through a form submission, initiating the workflow.

- **Nodes Involved:**  
  - On form submission  
  - Edit Fields

- **Node Details:**  

  - **On form submission**  
    - Type: Form Trigger  
    - Role: Workflow trigger via user input form  
    - Configuration: Waits for a form submission with a required field `title` for product title input.  
    - Input: Web UI user entry  
    - Output: JSON containing the `title` field  
    - Edge Cases: Missing required field handled by form validation; webhook availability required.

  - **Edit Fields**  
    - Type: Set Node  
    - Role: Prepares and formats the product title for the search query  
    - Configuration: Copies the submitted `title` field into its own JSON property `title` unchanged.  
    - Input: Output from form node  
    - Output: JSON with `title` ready for querying  
    - Edge Cases: Empty or malformed titles could cause search issues; no transformation applied here.

---

#### 1.2 Query Preparation

- **Overview:**  
  Prepares and executes a Google Custom Search API query using the formatted product title to gather competitor data.

- **Nodes Involved:**  
  - Google Search

- **Node Details:**  

  - **Google Search**  
    - Type: HTTP Request  
    - Role: Performs Google Custom Search to find competitor products and related data  
    - Configuration:  
      - URL: `https://www.googleapis.com/customsearch/v1`  
      - Query parameters include API key, custom search engine ID (cx), and a search query constructed as:  
        `intitle:"<product title>" (pricing OR features OR buy OR software) -medium.com -quora.com -youtube.com -linkedin.com`  
      - Uses the product title from previous step to restrict search results to relevant competitor content.  
    - Input: JSON with `title`  
    - Output: Google search JSON results including items with titles and snippets  
    - Edge Cases:  
      - API key quota limits or invalid credentials cause failures  
      - Network timeouts or Google API errors  
      - No search results returned if query is too restrictive or product unknown  

---

#### 1.3 Competitor Data Extraction

- **Overview:**  
  Extracts competitor product titles, descriptions, and keywords from the Google Search results to prepare input for AI content generation.

- **Nodes Involved:**  
  - Extract Competitor Data

- **Node Details:**  

  - **Extract Competitor Data**  
    - Type: Function Node (JavaScript)  
    - Role: Parses the `items` array from Google Search results to extract titles, snippets, and derive keywords  
    - Key Logic:  
      - Loops through each item to collect titles and snippets  
      - Generates keywords by splitting titles into words >3 characters, filtering duplicates  
      - Outputs combined text with sections: Title List, Description List, Keywords  
    - Input: JSON from Google Search results  
    - Output: JSON with a single property `chatInput` containing formatted competitor data text  
    - Edge Cases:  
      - Empty or malformed search results cause empty outputs  
      - Unexpected JSON structure may cause runtime errors  
      - Keywords extraction simplistic, may include irrelevant terms

---

#### 1.4 AI SEO & Content Generation

- **Overview:**  
  Uses LangChain’s large language model chain to generate SEO metadata and detailed product content based on competitor data.

- **Nodes Involved:**  
  - Basic LLM Chain

- **Node Details:**  

  - **Basic LLM Chain**  
    - Type: LangChain Chain LLM Node  
    - Role: Generates SEO meta title, description, keywords, and product content from competitor data input  
    - Configuration:  
      - Prompt instructs the LLM to:  
        - Use exact product title for SEO Title and Product Title  
        - Generate a concise meta description (120-160 characters) with natural keyword inclusion  
        - Provide relevant keywords list  
        - Produce a detailed product description with a minimum of 150 words  
      - Output format strictly defined for parsing downstream  
    - Input: `chatInput` text from Extract Competitor Data node  
    - Output: Text combining SEO metadata and product content as a single string  
    - Edge Cases:  
      - Model might produce output not matching strict format, causing parsing issues  
      - Latency or API limits on LangChain or underlying LLM  
      - Prompt sensitivity – poorly formed competitor data might reduce output quality

---

#### 1.5 AI Content Refinement

- **Overview:**  
  Refines and enhances the AI-generated content for quality and engagement using the Google Gemini (PaLM) language model.

- **Nodes Involved:**  
  - Google Gemini Chat Model

- **Node Details:**  

  - **Google Gemini Chat Model**  
    - Type: LangChain Google Gemini Chat LLM  
    - Role: Improves output quality and engagement of the product content generated by Basic LLM Chain  
    - Configuration:  
      - Model: `models/gemini-2.0-flash`  
      - Credentials: Requires Google PaLM API credentials  
    - Input: Output from Basic LLM Chain via `ai_languageModel` connection  
    - Output: Refined text passed back to Basic LLM Chain node for further processing (bi-directional chaining)  
    - Edge Cases:  
      - API quota or auth failures  
      - Model errors or timeouts  
      - Potential content drift or undesired rewriting  

*Note:* In this workflow, this node is connected back to Basic LLM Chain via a special AI model connection, suggesting iterative refinement.

---

#### 1.6 Content Formatting

- **Overview:**  
  Splits the combined AI-generated text into two structured JSON objects: one for SEO metadata and one for product content, facilitating storage and usage.

- **Nodes Involved:**  
  - Code Formatting

- **Node Details:**  

  - **Code Formatting**  
    - Type: Code Node (JavaScript)  
    - Role: Parses the AI output text to extract SEO meta data fields and product content fields separately  
    - Key Logic:  
      - Uses regex to extract "Title", "Description", "Keywords" under SEO Meta Data  
      - Extracts "Product Title" and "Product Description" under Product Content  
      - Returns two JSON objects: one with SEO fields, one with product content fields, distinguished by a `type` property  
    - Input: Text output from Basic LLM Chain  
    - Output: Two JSON items ready for insertion into Google Sheets  
    - Edge Cases:  
      - Parsing fails if output format changes or is malformed  
      - Missing fields lead to empty strings  
      - Regex matching may not cover all edge text variations

---

#### 1.7 Data Storage

- **Overview:**  
  Stores the finalized SEO metadata and product content into a Google Sheets document for easy tracking and further use.

- **Nodes Involved:**  
  - Google Sheets

- **Node Details:**  

  - **Google Sheets**  
    - Type: Google Sheets Node  
    - Role: Appends or updates rows in a designated Google Sheets document with structured SEO and product content data  
    - Configuration:  
      - Operation: `appendOrUpdate`  
      - Uses service account credentials with access to the target Google Sheets document  
      - Auto-mapping of columns: type, title, description, keywords, product_title, product_description  
      - Document ID and Sheet Name provided via URL mode parameters (to be filled by user)  
    - Input: Two JSON rows from Code Formatting node  
    - Output: Confirmation of data append/update operation  
    - Edge Cases:  
      - Authentication errors if credentials expire or lack permissions  
      - Sheet or document not found errors  
      - Data mapping errors if column schema changes

---

### 3. Summary Table

| Node Name             | Node Type                      | Functional Role                                  | Input Node(s)          | Output Node(s)          | Sticky Note                                                                                                           |
|-----------------------|--------------------------------|-------------------------------------------------|------------------------|-------------------------|-----------------------------------------------------------------------------------------------------------------------|
| On form submission     | Form Trigger                   | Collects product title input from user          | —                      | Edit Fields             | ### 1. **On form submission** - *Trigger*: Collects the product title entered by the user via the form.               |
| Edit Fields           | Set                            | Prepares product title for search query         | On form submission     | Google Search           | ### 2. **Edit Fields** - *Action*: Formats the product title to fit the required query parameters for the Google search. |
| Google Search          | HTTP Request                   | Executes Google Custom Search API                | Edit Fields            | Extract Competitor Data | ### 3. **Google Search** - *Action*: Executes a Google Custom Search API query to retrieve competitor data.             |
| Extract Competitor Data| Function                      | Extracts titles, descriptions, and keywords      | Google Search          | Basic LLM Chain         | ### 4. **Extract Competitor Data** - *Action*: Extracts key information from the search results.                        |
| Basic LLM Chain        | LangChain Chain LLM            | Generates SEO metadata and product content       | Extract Competitor Data | Code Formatting         | ### 5. **Basic LLM Chain** - *Action*: Uses LangChain’s LLM to generate SEO metadata and product content.               |
| Google Gemini Chat Model| LangChain Google Gemini Chat  | Refines and improves AI-generated content        | Basic LLM Chain (ai_languageModel) | Basic LLM Chain (ai_languageModel) | ### 6. **Google Gemini Chat Model** - *Action*: Refines content quality and engagement.                                |
| Code Formatting        | Code (JavaScript)              | Splits combined content into SEO and product sections | Basic LLM Chain       | Google Sheets           | ### 7. **Code Formating ** - *Action*: Splits content into SEO Meta Data and Product Content sections.                   |
| Google Sheets          | Google Sheets                  | Stores SEO metadata and product content          | Code Formatting        | —                       | ### 8. **Google Sheets** - *Action*: Appends final content into a Google Sheets document.                               |
| Sticky Note            | Sticky Note                   | Documentation and explanation                     | —                      | —                       | # 🚀 AI-Powered Product Research & SEO Content Automation ... (full sticky note content as in workflow description)    |
| Sticky Note1           | Sticky Note                   | Explanation of On form submission block           | —                      | —                       | ### 1. **On form submission** - *Trigger*: Collects the product title entered by the user via the form.                |
| Sticky Note2           | Sticky Note                   | Explanation of Edit Fields block                   | —                      | —                       | ### 2. **Edit Fields** - *Action*: Formats the product title to fit the required query parameters for the Google search. |
| Sticky Note3           | Sticky Note                   | Explanation of Google Search block                 | —                      | —                       | ### 3. **Google Search** - *Action*: Executes a Google Custom Search API query to retrieve competitor data.             |
| Sticky Note4           | Sticky Note                   | Explanation of Extract Competitor Data block      | —                      | —                       | ### 4. **Extract Competitor Data** - *Action*: Extracts key information from the search results.                        |
| Sticky Note5           | Sticky Note                   | Explanation of Basic LLM Chain block               | —                      | —                       | ### 5. **Basic LLM Chain** - *Action*: Uses LangChain’s LLM to generate SEO metadata and product content.               |
| Sticky Note6           | Sticky Note                   | Explanation of Google Gemini Chat Model block     | —                      | —                       | ### 6. **Google Gemini Chat Model** - *Action*: Refines content quality and engagement.                                |
| Sticky Note7           | Sticky Note                   | Explanation of Code Formatting block               | —                      | —                       | ### 7. **Code Formating ** - *Action*: Splits content into SEO Meta Data and Product Content sections.                   |
| Sticky Note8           | Sticky Note                   | Explanation of Google Sheets block                  | —                      | —                       | ### 8. **Google Sheets** - *Action*: Appends final content into a Google Sheets document.                               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Node: On form submission**  
   - Type: Form Trigger  
   - Configure webhook with unique ID  
   - Form title: “Product Research”  
   - Form fields: Single required text field named `title` with placeholder “Enter product title”  

2. **Create Node: Edit Fields**  
   - Type: Set Node  
   - Assign `title` = `{{$json.title}}` (pass through the submitted product title)  
   - Connect output from On form submission to this node  

3. **Create Node: Google Search**  
   - Type: HTTP Request  
   - URL: `https://www.googleapis.com/customsearch/v1`  
   - Method: GET  
   - Query Parameters:  
     - `key`: Your Google API key  
     - `cx`: Your Google Custom Search Engine ID  
     - `q`: Expression:  
       ```
       =intitle:"{{ $json.title }}" (pricing OR features OR buy OR software) -medium.com -quora.com -youtube.com -linkedin.com
       ```  
   - Connect output from Edit Fields to this node  

4. **Create Node: Extract Competitor Data**  
   - Type: Function Node  
   - Paste the JavaScript code to extract titles, descriptions, and keywords:  
     ```javascript
     let allTitles = [];
     let allDescriptions = [];
     let allKeywords = [];

     for (const item of $json.items) {
       allTitles.push(item.title);
       allDescriptions.push(item.snippet);

       const keywords = item.title
         .toLowerCase()
         .replace(/[^a-zA-Z0-9 ]/g, '')
         .split(' ')
         .filter(w => w.length > 3);

       allKeywords.push(...keywords);
     }

     const uniqueKeywords = [...new Set(allKeywords)];

     return [
       {
         json: {
           chatInput: `
     Title List:
     ${allTitles.join('\n')}

     Description List:
     ${allDescriptions.join('\n')}

     Keywords:
     ${uniqueKeywords.join(', ')}
           `.trim()
         }
       }
     ];
     ```  
   - Connect output from Google Search node to this node  

5. **Create Node: Basic LLM Chain**  
   - Type: LangChain Chain LLM  
   - Configuration: Set prompt message to instruct the LLM to generate SEO metadata and product content with exact format as described.  
   - Connect output from Extract Competitor Data to this node  

6. **Create Node: Google Gemini Chat Model**  
   - Type: LangChain Google Gemini Chat LLM  
   - Model Name: `models/gemini-2.0-flash`  
   - Connect the AI language model input of this node to the Basic LLM Chain output (`ai_languageModel`)  
   - Credentials: Setup Google PaLM API credentials (OAuth2 or API key as required)  

7. **Create Node: Code Formatting**  
   - Type: Code Node  
   - Paste the JavaScript code to parse the AI output into SEO and product content JSON objects:  
     ```javascript
     const inputText = $json.text;

     function getFieldValue(text, field) {
       const regex = new RegExp(field + ':\\s*([\\s\\S]*?)(?=\\n\\S|$)', 'i');
       const match = text.match(regex);
       return match ? match[1].trim() : '';
     }

     function splitSections(text) {
       const seoMetaMatch = text.match(/SEO Meta Data:\n([\s\S]*?)\n\nProduct Content:/i);
       const productContentMatch = text.match(/Product Content:\n([\s\S]*)/i);

       const seoMeta = seoMetaMatch ? seoMetaMatch[1].trim() : '';
       const productContent = productContentMatch ? productContentMatch[1].trim() : '';

       return [
         {
           json: {
             type: 'seo_meta_data',
             title: getFieldValue(seoMeta, 'Title'),
             description: getFieldValue(seoMeta, 'Description'),
             keywords: getFieldValue(seoMeta, 'Keywords'),
             product_title: '',
             product_description: ''
           }
         },
         {
           json: {
             type: 'product_content',
             title: '',
             description: '',
             keywords: '',
             product_title: getFieldValue(productContent, 'Product Title'),
             product_description: getFieldValue(productContent, 'Product Description')
           }
         }
       ];
     }

     return splitSections($input.first().json.text);
     ```  
   - Connect output from Basic LLM Chain node to this node  

8. **Create Node: Google Sheets**  
   - Type: Google Sheets Node  
   - Operation: `appendOrUpdate`  
   - Sheet Name & Document ID: Set to your target Google Sheets document and sheet  
   - Columns Mapping: Map columns for `type`, `title`, `description`, `keywords`, `product_title`, `product_description`  
   - Authentication: Use Google Service Account credentials with proper permissions  
   - Connect output from Code Formatting node to this node  

9. **Add Sticky Notes**  
   - Add sticky notes as documentation for each logical block, matching the text content from the original workflow for clarity and maintainability.

10. **Test Workflow**  
    - Submit a product title via the form URL  
    - Monitor each step’s output for errors or misconfigurations  
    - Validate Google Sheets for correct appending of data  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                       | Context or Link                                                                                                                       |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------|
| This workflow automates product research and SEO content generation using Google Search API, LangChain LLM, and Google Gemini chat model, storing results in Google Sheets for easy management.                                                     | Workflow description and use case                                                                                                |
| The workflow leverages Google Custom Search API; ensure API key and Custom Search Engine ID (cx) are set properly for reliable operation.                                                                                                        | Google Custom Search API documentation: https://developers.google.com/custom-search/v1/overview                                   |
| LangChain nodes require proper API credentials for underlying LLMs (OpenAI, Google PaLM). The Google Gemini node requires Google PaLM API credentials setup.                                                                                    | Google PaLM API: https://developers.generativeai.google/                                                                            |
| The code nodes use regex parsing; any changes in AI output format require updating the code to avoid breaking workflows.                                                                                                                          | Regex documentation: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions                             |
| Google Sheets node requires service account with editor access to the target spreadsheet; ensure sheet structure matches expected columns.                                                                                                       | Google Sheets API docs: https://developers.google.com/sheets/api/                                                                   |
| This workflow reduces manual SEO content creation time and improves consistency, but users should review AI-generated content for accuracy and appropriateness before publishing.                                                                | Best practice reminder                                                                                                             |
| Sticky notes embedded in the workflow provide detailed functional explanations for each step.                                                                                                                                                      | Internal workflow documentation                                                                                                   |

---

**Disclaimer:**  
The provided text originates exclusively from an n8n workflow automation. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data processed is legal and public.

---