Automate Job Posting Creation with Forms, Dropbox, and Foxit PDF Generation

https://n8nworkflows.xyz/workflows/automate-job-posting-creation-with-forms--dropbox--and-foxit-pdf-generation-6144


# Automate Job Posting Creation with Forms, Dropbox, and Foxit PDF Generation

---

### 1. Workflow Overview

This workflow automates the creation of job posting PDFs triggered by form submissions. When a user submits job details via a form, the workflow downloads a Word template from Dropbox, converts it to a base64 string, sends it to Foxit’s document generation API to populate the template with form data and produce a PDF, then converts the API response back into a file format.

Logical blocks:

- **1.1 Input Reception:** Captures job posting details from a web form.
- **1.2 Template Retrieval and Preparation:** Downloads the Word template from Dropbox and converts it to base64.
- **1.3 PDF Generation via Foxit API:** Sends the base64 template and job data to Foxit’s API to generate a customized PDF.
- **1.4 Final File Conversion:** Converts the base64 PDF response into a binary file ready for further use or storage.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  This block captures job posting data through a form submission. It serves as the workflow trigger and initial data source.

- **Nodes Involved:**  
  - On form submission

- **Node Details:**

  - **On form submission**  
    - Type: Form Trigger  
    - Role: Captures form data when a user submits the "Job Posting Form".  
    - Configuration:  
      - Form Title: "Job Posting Form"  
      - Fields:  
        - Job Position (text, required)  
        - Salary (number, required)  
        - Responsibilities (textarea, required)  
        - Office Location (text, required)  
    - Key expressions: The form fields populate JSON properties accessible by downstream nodes (e.g., `$('On form submission').item.json['Job Position']`).  
    - Input: None (trigger node)  
    - Output: Emits form data as JSON  
    - Edge Cases:  
      - Missing required fields will block submission at form level.  
      - Form submission failures (network or webhook errors) interrupt workflow start.  
    - Version: 2.2

#### 1.2 Template Retrieval and Preparation

- **Overview:**  
  This block obtains the Word document template from Dropbox and converts it into a base64 string to prepare it for API submission.

- **Nodes Involved:**  
  - Dropbox  
  - Convert Word to B64

- **Node Details:**

  - **Dropbox**  
    - Type: Dropbox node  
    - Role: Downloads the Word template file from a specified Dropbox path.  
    - Configuration:  
      - Operation: Download  
      - File path: `/Foxit/docgen_sample_job_offer.docx`  
      - Authentication: OAuth2 with configured Dropbox account credentials  
    - Input: Receives trigger from form submission node  
    - Output: Binary file data of the .docx template  
    - Edge Cases:  
      - OAuth token expiration or revocation causes auth failure.  
      - File path errors (file missing or renamed) produce download errors.  
      - Network timeouts or Dropbox API rate limits may cause failures.  
    - Version: 1

  - **Convert Word to B64**  
    - Type: ExtractFromFile node  
    - Role: Converts the downloaded binary Word file into a base64 string stored in a JSON property.  
    - Configuration:  
      - Operation: binaryToProperty (convert binary data to base64 string in JSON)  
    - Input: Binary data from Dropbox node  
    - Output: JSON with base64-encoded content under property `data`  
    - Edge Cases:  
      - Corrupt or incomplete binary data may cause conversion failure.  
    - Version: 1

#### 1.3 PDF Generation via Foxit API

- **Overview:**  
  This block sends the base64 Word template and form data to Foxit’s Document Generation API to produce a customized PDF document.

- **Nodes Involved:**  
  - Document Generation

- **Node Details:**

  - **Document Generation**  
    - Type: HTTP Request node  
    - Role: Calls Foxit’s document generation REST API to convert the template into a PDF populated with job posting data.  
    - Configuration:  
      - HTTP Method: POST  
      - URL: `https://na1.fusion.foxit.com/document-generation/api/GenerateDocumentBase64`  
      - Body Type: JSON  
      - JSON Body:  
        ```json
        {
          "outputFormat": "pdf",
          "currencyCulture": "en-US",
          "base64FileString": "{{ $json.data }}",
          "documentValues": {
            "jobPosition": "{{ $('On form submission').item.json['Job Position'] }}",
            "salary": {{ $('On form submission').item.json.Salary }},
            "office": "{{ $('On form submission').item.json['Office Location'] }}",
            "responsibilities": "{{ $('On form submission').item.json.Responsibilities }}"
          }
        }
        ```  
      - Authentication: Custom HTTP Auth with credentials named "DocGen Account"  
    - Input: JSON with base64 template from Convert Word to B64 node and form data references  
    - Output: JSON containing a base64-encoded PDF file string under `base64FileString`  
    - Edge Cases:  
      - API key or credential misconfiguration causing authentication failures  
      - Invalid or malformed base64 input results in API errors  
      - Network timeouts or API rate limitations  
      - Data type mismatches (e.g., salary as number, handled carefully in JSON)  
    - Version: 4.2

#### 1.4 Final File Conversion

- **Overview:**  
  Converts the base64 PDF string obtained from Foxit into a binary file format for saving, emailing, or further processing.

- **Nodes Involved:**  
  - Convert to File

- **Node Details:**

  - **Convert to File**  
    - Type: ConvertToFile node  
    - Role: Takes the base64 string from the API response and converts it into binary file data for usage downstream.  
    - Configuration:  
      - Operation: toBinary  
      - Source Property: `base64FileString` (from previous node’s JSON)  
    - Input: JSON with base64 PDF string from Document Generation node  
    - Output: Binary file representation of the generated PDF document  
    - Edge Cases:  
      - Input base64 corruption or truncation leading to conversion failure  
    - Version: 1.1

---

### 3. Summary Table

| Node Name           | Node Type            | Functional Role                      | Input Node(s)            | Output Node(s)          | Sticky Note                              |
|---------------------|----------------------|-----------------------------------|--------------------------|-------------------------|-----------------------------------------|
| On form submission  | Form Trigger          | Captures job posting form data     | None                     | Dropbox                 |                                         |
| Dropbox             | Dropbox               | Downloads Word template from Dropbox | On form submission       | Convert Word to B64      |                                         |
| Convert Word to B64 | ExtractFromFile       | Converts Word binary to base64     | Dropbox                  | Document Generation      |                                         |
| Document Generation | HTTP Request          | Calls Foxit API to generate PDF    | Convert Word to B64      | Convert to File          |                                         |
| Convert to File     | ConvertToFile         | Converts base64 PDF to binary file | Document Generation      | None                    |                                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Form Trigger Node:**
   - Name: `On form submission`
   - Type: Form Trigger
   - Configure form title as `"Job Posting Form"`
   - Add form fields:
     - Text: "Job Position" (required)
     - Number: "Salary" (required)
     - Textarea: "Responsibilities" (required)
     - Text: "Office Location" (required)
   - This node will trigger the workflow upon form submission.

2. **Add a Dropbox Node:**
   - Name: `Dropbox`
   - Type: Dropbox
   - Set operation to `Download`
   - Set file path to `/Foxit/docgen_sample_job_offer.docx`
   - Configure Dropbox OAuth2 credentials (create or select existing with Dropbox access)
   - Connect `On form submission` output to this node input.

3. **Add an ExtractFromFile Node:**
   - Name: `Convert Word to B64`
   - Type: ExtractFromFile
   - Set operation to `binaryToProperty`
   - This converts the downloaded Word document binary to a base64 string in JSON property `data`.
   - Connect the `Dropbox` node output to this node input.

4. **Add an HTTP Request Node:**
   - Name: `Document Generation`
   - Type: HTTP Request
   - Configure:
     - Method: POST
     - URL: `https://na1.fusion.foxit.com/document-generation/api/GenerateDocumentBase64`
     - Body content type: JSON
     - Set JSON body (enable expression editor) to:

       ```
       {
         "outputFormat": "pdf",
         "currencyCulture": "en-US",
         "base64FileString": "{{ $json.data }}",
         "documentValues": {
           "jobPosition": "{{ $('On form submission').item.json['Job Position'] }}",
           "salary": {{ $('On form submission').item.json.Salary }},
           "office": "{{ $('On form submission').item.json['Office Location'] }}",
           "responsibilities": "{{ $('On form submission').item.json.Responsibilities }}"
         }
       }
       ```
     - Authentication: Select or create a `HTTP Custom Auth` credential named "DocGen Account" with required API key or token.
   - Connect `Convert Word to B64` output to this node input.

5. **Add a ConvertToFile Node:**
   - Name: `Convert to File`
   - Type: ConvertToFile
   - Set operation to `toBinary`
   - Set source property to `base64FileString`
   - Connect `Document Generation` output to this node input.

6. **Activate the workflow and test:**
   - Submit the form with valid job posting data.
   - Ensure Dropbox OAuth2 and Foxit API credentials are valid and active.
   - Confirm that the final output is a correctly generated PDF file binary data.

---

### 5. General Notes & Resources

| Note Content                                                            | Context or Link                                             |
|-------------------------------------------------------------------------|-------------------------------------------------------------|
| The Foxit Document Generation API requires a valid account and API key. | https://www.foxit.com/document-generation-api               |
| Dropbox credentials must have access to the specified file path.         | https://www.dropbox.com/developers/documentation/http/overview |
| Ensure form field names in the JSON body match exactly those in the form.| Workflow field naming consistency is critical                |

---

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

---