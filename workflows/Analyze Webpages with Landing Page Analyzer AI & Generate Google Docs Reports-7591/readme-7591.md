Analyze Webpages with Landing Page Analyzer AI & Generate Google Docs Reports

https://n8nworkflows.xyz/workflows/analyze-webpages-with-landing-page-analyzer-ai---generate-google-docs-reports-7591


# Analyze Webpages with Landing Page Analyzer AI & Generate Google Docs Reports

### 1. Workflow Overview

This workflow automates the process of analyzing a webpage URL submitted via a form, generating a detailed conversion audit report using an AI-powered Landing Page Analyzer API, and saving the formatted report directly into a Google Docs document. It is designed for SEO professionals, digital marketers, or agencies needing scalable, automated webpage audit reports.

**Logical Blocks:**

- **1.1 Input Reception:** Captures a webpage URL submitted through a user-facing form.
- **1.2 AI Processing via API:** Sends the URL to the Landing Page Analyzer AI API to retrieve an audit report including grade, strengths, suggestions, and scores.
- **1.3 Report Formatting:** Transforms the raw API response into a well-structured Markdown-style audit report.
- **1.4 Document Upload:** Inserts the formatted report text into a specified Google Docs document for collaboration and archival.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
This block collects the webpage URL from a user via an n8n form trigger, serving as the workflow’s entry point.

**Nodes Involved:**  
- On form submission

**Node Details:**  
- **Node Name:** On form submission  
- **Type:** Form Trigger  
- **Role:** Trigger node that activates workflow upon user form submission.  
- **Configuration:**  
  - Form titled "Webpage Analyzer" with a required field labeled "url".  
  - No advanced options configured.  
- **Key Expressions:** The submitted URL is accessed as `$json.url`.  
- **Input Connections:** None (trigger node).  
- **Output Connections:** Connects directly to "WebPage Analyzer" HTTP Request node.  
- **Version-specific:** Uses n8n formTrigger node v2.2.  
- **Potential Failures:**  
  - Missing or invalid URL input (user error).  
  - Workflow not triggered if webhook is inaccessible externally.  
- **Sub-workflow:** None.

---

#### 1.2 AI Processing via API

**Overview:**  
Sends the captured URL to the Landing Page Analyzer AI API via a POST request and retrieves detailed audit data.

**Nodes Involved:**  
- WebPage Analyzer

**Node Details:**  
- **Node Name:** WebPage Analyzer  
- **Type:** HTTP Request  
- **Role:** Executes the POST API call to the Landing Page Analyzer service.  
- **Configuration:**  
  - URL: `https://landing-page-analyzer-ai.p.rapidapi.com/analyse.php`  
  - Method: POST  
  - Content-Type: multipart/form-data  
  - Body parameter: `url` set dynamically as `={{ $json.url }}` (from form submission).  
  - Headers: Includes `x-rapidapi-host` and `x-rapidapi-key` (API key placeholder: "your key").  
- **Key Expressions:** Uses input JSON's `url` field for API body parameter.  
- **Input Connections:** From "On form submission".  
- **Output Connections:** To "Reformat".  
- **Version-specific:** HTTP Request node v4.2.  
- **Potential Failures:**  
  - Authentication failure due to invalid or missing API key.  
  - API rate limit exceeded or service downtime.  
  - Malformed URL causing API rejection.  
  - Network timeouts.  
- **Sub-workflow:** None.

---

#### 1.3 Report Formatting

**Overview:**  
Transforms the raw JSON response from the API into a structured Markdown-style audit report including grade, suggestions, strengths, and score breakdown.

**Nodes Involved:**  
- Reformat

**Node Details:**  
- **Node Name:** Reformat  
- **Type:** Code (JavaScript)  
- **Role:** Processes and formats the API response into a human-readable Markdown text string.  
- **Configuration:**  
  - JavaScript code that:  
    - Extracts `grade`, `score`, `suggestions`, `strengths`, and `conversionScore` from API response.  
    - Formats suggestions with categories, issues, fixes, and priority.  
    - Formats strengths as bullet points.  
    - Formats score breakdown as bullet points with keys and values.  
    - Compiles all into a named variable `docText`.  
  - Returns `docText` in JSON output.  
- **Key Expressions:** Uses `$input.first().json` to access API response data.  
- **Input Connections:** From "WebPage Analyzer".  
- **Output Connections:** To "Upload In Google Docs".  
- **Version-specific:** Code node v2.  
- **Potential Failures:**  
  - Unexpected API response structure causing runtime errors.  
  - Missing data fields (e.g., no suggestions or strengths).  
  - Syntax errors in JavaScript code.  
- **Sub-workflow:** None.

---

#### 1.4 Document Upload

**Overview:**  
Uploads the formatted Markdown audit report text into a pre-configured Google Docs document for permanent storage and collaboration.

**Nodes Involved:**  
- Upload In Google Docs

**Node Details:**  
- **Node Name:** Upload In Google Docs  
- **Type:** Google Docs  
- **Role:** Inserts text into an existing Google Docs document.  
- **Configuration:**  
  - Operation: update  
  - Action: insert text (from `docText` generated in previous node)  
  - Document URL: left blank to be configured per use case  
  - Authentication: Service Account credentials configured with Google API access.  
- **Key Expressions:** Inserts `={{ $json.docText }}` into document.  
- **Input Connections:** From "Reformat".  
- **Output Connections:** None (terminal node).  
- **Version-specific:** Google Docs node v2.  
- **Potential Failures:**  
  - Invalid or missing Google Docs document URL.  
  - Authentication or permission errors with Google API.  
  - Network or quota issues with Google Docs API.  
- **Sub-workflow:** None.

---

### 3. Summary Table

| Node Name           | Node Type         | Functional Role                           | Input Node(s)       | Output Node(s)         | Sticky Note                                                                                          |
|---------------------|-------------------|-----------------------------------------|---------------------|------------------------|---------------------------------------------------------------------------------------------------|
| On form submission  | Form Trigger      | Entry point capturing webpage URL       | None                | WebPage Analyzer       | **On form submission** Captures the website URL entered by the user through a form trigger.       |
| WebPage Analyzer     | HTTP Request      | Calls Landing Page Analyzer API          | On form submission  | Reformat               | **WebPage Analyzer (API Call)** Sends the captured URL to Landing Page Analyzer API via RapidAPI. |
| Reformat             | Code (JavaScript) | Formats API response into Markdown report| WebPage Analyzer    | Upload In Google Docs   | **Reformat (Code Node)** Processes API response into a human-readable audit report.                |
| Upload In Google Docs| Google Docs       | Inserts formatted report into Google Doc | Reformat            | None                   | **Upload In Google Docs** Inserts report into a Google Document for storage and collaboration.    |
| Sticky Note          | Sticky Note       | Documentation and description            | None                | None                   | # 🚀 Automated Webpage Analyzer & Google Docs Report Generator (full overview and benefits)       |
| Sticky Note1         | Sticky Note       | Notes on On form submission node         | None                | None                   | **On form submission** Captures the website URL entered by the user through a form trigger.       |
| Sticky Note2         | Sticky Note       | Notes on WebPage Analyzer node            | None                | None                   | **WebPage Analyzer (API Call)** Sends the captured URL to the Landing Page Analyzer API.          |
| Sticky Note3         | Sticky Note       | Notes on Reformat node                    | None                | None                   | **Reformat (Code Node)** Processes the API response into a clean audit report.                     |
| Sticky Note4         | Sticky Note       | Notes on Upload In Google Docs node      | None                | None                   | **Upload In Google Docs** Inserts the audit report into a Google Document for sharing.            |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the "On form submission" node:**  
   - Type: Form Trigger  
   - Configure form title as "Webpage Analyzer"  
   - Add one required form field labeled "url"  
   - No additional options needed  
   - This node triggers the workflow when a user submits a URL.

2. **Create the "WebPage Analyzer" node:**  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://landing-page-analyzer-ai.p.rapidapi.com/analyse.php`  
   - Content-Type: multipart/form-data  
   - Body parameters: add parameter named `url` with value `={{ $json.url }}` referencing the form input  
   - Headers:  
     - `x-rapidapi-host`: `landing-page-analyzer-ai.p.rapidapi.com`  
     - `x-rapidapi-key`: *Insert your RapidAPI key here*  
   - Connect "On form submission" output to this node input.

3. **Create the "Reformat" node:**  
   - Type: Code (JavaScript)  
   - Copy and paste the provided JavaScript code that formats the API response into Markdown (see original code in node details)  
   - Connect "WebPage Analyzer" output to this node input.

4. **Create the "Upload In Google Docs" node:**  
   - Type: Google Docs  
   - Operation: Update  
   - Action: Insert text  
   - Text: Use expression `={{ $json.docText }}` to insert the formatted report.  
   - Document URL: specify the target Google Docs URL to update.  
   - Authentication: configure using a Google Service Account credential with Docs API enabled.  
   - Connect "Reformat" output to this node input.

5. **Verify all connections:**  
   - "On form submission" → "WebPage Analyzer" → "Reformat" → "Upload In Google Docs"

6. **Credentials Setup:**  
   - Configure Google API credentials with appropriate scopes for Google Docs API.  
   - Obtain and set the RapidAPI key for Landing Page Analyzer API.

7. **Testing:**  
   - Deploy the workflow and submit a test URL via form to ensure correct execution and output in Google Docs.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                    | Context or Link                                         |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------|
| This workflow leverages the [Landing Page Analyzer API on RapidAPI](https://rapidapi.com/) to provide SEO and conversion audit insights automatically.                                                                                         | Landing Page Analyzer API documentation                 |
| The Google Docs node requires a Service Account with Docs API enabled and sharing permissions set on the target document.                                                                                                                     | Google Cloud Console and Docs API setup guides          |
| The workflow is ideal for SEO agencies, freelancers, and digital marketers needing scalable, automated reporting solutions with minimal manual intervention.                                                                                    | Workflow use case description                            |
| Sticky notes in the workflow visually explain each step and provide a summarized understanding of each node's function.                                                                                                                         | Embedded within workflow for user reference             |

---

**Disclaimer:**  
The text provided originates exclusively from an automated workflow created with n8n, a tool for integration and automation. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All processed data is legal and public.