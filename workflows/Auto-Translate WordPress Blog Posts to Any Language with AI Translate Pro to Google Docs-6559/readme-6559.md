Auto-Translate WordPress Blog Posts to Any Language with AI Translate Pro to Google Docs

https://n8nworkflows.xyz/workflows/auto-translate-wordpress-blog-posts-to-any-language-with-ai-translate-pro-to-google-docs-6559


# Auto-Translate WordPress Blog Posts to Any Language with AI Translate Pro to Google Docs

### 1. Workflow Overview

This workflow automates the process of translating a WordPress blog post into any desired language using the AI Translate Pro API, then inserts the translated content into a Google Docs document. It is designed primarily for content creators, marketers, and localization teams who want to streamline multilingual blogging or content localization.

The workflow is logically divided into the following blocks:

- **1.1 Manual Trigger**: Initiates the workflow manually.
- **1.2 WordPress Content Retrieval**: Fetches the blog post content in HTML format from WordPress using its REST API.
- **1.3 AI Translation Processing**: Sends the post content to the AI Translate Pro API via an HTTP POST request to translate it into the target language.
- **1.4 Google Docs Insertion**: Inserts the translated text into a specified Google Docs document using Google Docs API with a service account.

---

### 2. Block-by-Block Analysis

#### 1.1 Manual Trigger

- **Overview:**  
  This block manually starts the workflow on demand when the user clicks 'Execute Workflow' inside n8n.

- **Nodes Involved:**  
  - When clicking ‘Execute workflow’

- **Node Details:**  
  - **Name:** When clicking ‘Execute workflow’  
  - **Type:** Manual Trigger  
  - **Role:** Entry point for manual execution.  
  - **Configuration:** No parameters; simply triggers the flow.  
  - **Expressions/Variables:** None.  
  - **Connections:** Output connected to WordPress node input.  
  - **Version:** 1  
  - **Potential Failures:** None typical; user must manually execute workflow.  
  - **Sub-workflow:** None.

#### 1.2 WordPress Content Retrieval

- **Overview:**  
  Retrieves a specific WordPress blog post (ID 2151) via the WordPress REST API, returning the post content in raw HTML format.

- **Nodes Involved:**  
  - Wordpress

- **Node Details:**  
  - **Name:** Wordpress  
  - **Type:** WordPress API Node  
  - **Role:** Fetches blog post data.  
  - **Configuration:**  
    - Operation: Get  
    - Post ID: 2151 (hardcoded, can be parameterized)  
    - Options: Default (none specified)  
  - **Credentials:** Wordpress API credentials (OAuth or Basic Auth configured externally)  
  - **Expressions/Variables:** None dynamic; postId fixed.  
  - **Connections:** Input from Manual Trigger; output to HTTP Request node.  
  - **Version:** 1  
  - **Potential Failures:**  
    - Authentication errors (invalid or expired credentials)  
    - Post not found (invalid post ID)  
    - Network issues  
  - **Sub-workflow:** None.

#### 1.3 AI Translation Processing

- **Overview:**  
  Sends the retrieved WordPress post content to the AI Translate Pro API via RapidAPI to translate it from the original language into Hindi (configurable).

- **Nodes Involved:**  
  - HTTP Request

- **Node Details:**  
  - **Name:** HTTP Request  
  - **Type:** HTTP Request Node  
  - **Role:** Calls external AI translation API to translate text.  
  - **Configuration:**  
    - URL: https://ai-translate-pro.p.rapidapi.com/translate.php  
    - Method: POST  
    - Content Type: multipart/form-data  
    - Body Parameters:  
      - text: `={{ $json.content.rendered }}` (WordPress post HTML content)  
      - language: "Hindi" (target language; can be parameterized)  
    - Headers:  
      - x-rapidapi-host: ai-translate-pro.p.rapidapi.com  
      - x-rapidapi-key: "your key" (must be replaced with valid RapidAPI key)  
  - **Expressions/Variables:** Uses expression to extract HTML content from WordPress node JSON.  
  - **Connections:** Input from WordPress node; output to Google Docs node.  
  - **Version:** 4.2  
  - **Potential Failures:**  
    - Authentication errors (invalid RapidAPI key)  
    - API request limits or quota exceeded  
    - Network timeouts or unreachable API  
    - Unexpected API response structure or errors  
  - **Sub-workflow:** None.

#### 1.4 Google Docs Insertion

- **Overview:**  
  Inserts the translated text returned by the translation API into a specified Google Docs document using Google Docs API with service account authentication.

- **Nodes Involved:**  
  - Google Docs

- **Node Details:**  
  - **Name:** Google Docs  
  - **Type:** Google Docs Node  
  - **Role:** Updates a Google Docs document by inserting translated text.  
  - **Configuration:**  
    - Operation: Update  
    - Actions: Insert text with value from `{{$json.data}}` (translated text from HTTP Request)  
    - Document URL: (blank in the example; must be set to target document URL)  
    - Authentication: Service Account  
  - **Credentials:** Google API Service Account credentials configured externally.  
  - **Expressions/Variables:** Uses expression to insert translated text from previous node's output.  
  - **Connections:** Input from HTTP Request node; no outputs further.  
  - **Version:** 2  
  - **Potential Failures:**  
    - Authentication errors (invalid or expired Google service account credentials)  
    - Incorrect or missing Document URL  
    - API quota limits  
    - Network issues  
    - Data format or insertion errors  
  - **Sub-workflow:** None.

---

### 3. Summary Table

| Node Name                   | Node Type           | Functional Role                              | Input Node(s)                 | Output Node(s)             | Sticky Note                                                                                                               |
|-----------------------------|---------------------|----------------------------------------------|------------------------------|----------------------------|---------------------------------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger      | Entry point to manually start the workflow   |                              | Wordpress                  | ### 1. ✅ Manual Trigger Starts the workflow manually when the user clicks "Execute Workflow" inside n8n.                 |
| Wordpress                   | WordPress API       | Fetches blog post content from WordPress     | When clicking ‘Execute workflow’ | HTTP Request               | ### 2. 🌐 WordPress Fetches the blog post with ID `2151` from a connected WordPress site using the REST API.              |
| HTTP Request                | HTTP Request        | Sends content to AI Translate Pro API        | Wordpress                    | Google Docs                | ### 3. 🌍 HTTP Request (AI Translation) Sends content to `ai-translate-pro` API via RapidAPI, translating to Hindi.        |
| Google Docs                | Google Docs          | Inserts translated text into Google Docs     | HTTP Request                 |                            | ### 4. 📝 Google Docs Inserts the translated text into a specified Google Docs document using service account credentials. |
| Sticky Note                 | Sticky Note         | Documentation and overview                    |                              |                            | # 🌐 Changing Your WordPress Blog Into Any Language ... (full note content on workflow overview and use cases)            |
| Sticky Note1                | Sticky Note         | Documentation on Manual Trigger node          |                              |                            | ### 1. ✅ Manual Trigger Starts the workflow manually when the user clicks "Execute Workflow" inside n8n.                 |
| Sticky Note2                | Sticky Note         | Documentation on WordPress node                |                              |                            | ### 2. 🌐 WordPress Fetches the blog post with ID `2151` from a connected WordPress site using the REST API.              |
| Sticky Note3                | Sticky Note         | Documentation on HTTP Request node             |                              |                            | ### 3. 🌍 HTTP Request (AI Translation) Sends content to `ai-translate-pro` API via RapidAPI, translating to Hindi.        |
| Sticky Note4                | Sticky Note         | Documentation on Google Docs node              |                              |                            | ### 4. 📝 Google Docs Inserts the translated text into a specified Google Docs document using service account credentials. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Manual Trigger node**  
   - Name: When clicking ‘Execute workflow’  
   - Purpose: Start the workflow manually.  
   - No parameters needed.

2. **Add a WordPress node**  
   - Name: Wordpress  
   - Set operation to `Get`  
   - Set postId to `2151` (or parameterize as needed)  
   - Configure WordPress API credentials (OAuth or Basic Auth) with access to your WordPress site.  
   - Connect output of Manual Trigger to input of WordPress node.

3. **Add an HTTP Request node**  
   - Name: HTTP Request  
   - Set method to `POST`  
   - URL: `https://ai-translate-pro.p.rapidapi.com/translate.php`  
   - Content type: `multipart/form-data`  
   - Add body parameters:  
     - `text` → expression `={{ $json.content.rendered }}` (this extracts raw HTML blog content)  
     - `language` → `"Hindi"` (replace with desired target language or parameterize)  
   - Add header parameters:  
     - `x-rapidapi-host` → `ai-translate-pro.p.rapidapi.com`  
     - `x-rapidapi-key` → Your valid RapidAPI key for AI Translate Pro  
   - Connect output of WordPress node to input of HTTP Request node.

4. **Add a Google Docs node**  
   - Name: Google Docs  
   - Operation: Update  
   - Document URL: Paste the URL of the Google Doc where you want the translated text inserted.  
   - Under Actions, add an Insert action with text set to expression `={{ $json.data }}` (the translated text from HTTP Request)  
   - Set authentication to `serviceAccount`  
   - Configure Google API service account credentials with appropriate permissions for Google Docs API.  
   - Connect output of HTTP Request node to input of Google Docs node.

5. **Optional: Add Sticky Notes**  
   - Add descriptive sticky notes near each node to document the purpose as per the original workflow.

6. **Test the workflow**  
   - Click 'Execute Workflow' manually.  
   - Ensure WordPress post content is fetched.  
   - Check that translation API returns translated text.  
   - Confirm translated text appears correctly in the specified Google Docs document.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                   | Context or Link                                                                                       |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| This workflow can be adjusted to translate posts into any language supported by the AI Translate Pro API by changing the `language` parameter in the HTTP Request node.                                                                                                                                                                                                                         | Language parameter in HTTP Request node                                                             |
| For better formatting of translated content, consider adding a step to convert HTML content from WordPress into Markdown before translation, as HTML tags may interfere with translation quality or Google Docs insertion.                                                                                                                                                                       | Formatting enhancement suggestion                                                                   |
| Ensure your Google service account has permissions enabled for Google Docs API and that the target document is shared with the service account email.                                                                                                                                                                                                                                        | Google Docs API authentication requirements                                                        |
| AI Translate Pro API usage is subject to RapidAPI rate limits and requires a valid API key; monitor usage to avoid quota exhaustion.                                                                                                                                                                                                                                                         | API usage and quota considerations                                                                  |
| Blog post ID is hardcoded; for dynamic workflows, add parameters or triggers to specify post IDs on demand.                                                                                                                                                                                                                                                                                    | Customization note                                                                                   |
| Workflow credits: Based on the workflow "Auto-Translate WordPress Blog Posts to Any Language with AI Translate Pro to Google Docs" by n8n community contributors.                                                                                                                                                                                                                               | Project credit                                                                                       |

---

**Disclaimer:** This documentation is derived exclusively from an n8n automated workflow export. It complies fully with content policies and contains no illegal, offensive, or protected material. All processed data is legal and public.