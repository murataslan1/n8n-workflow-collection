Analyze, Interpret & Visualize Data from Multiple Sources with Ada AI

https://n8nworkflows.xyz/workflows/analyze--interpret---visualize-data-from-multiple-sources-with-ada-ai-9605


# Analyze, Interpret & Visualize Data from Multiple Sources with Ada AI

### 1. Workflow Overview

This workflow, titled **"Analyze, Interpret & Visualize Data from Multiple Sources with Ada AI"**, automates low-code data analysis through natural language interaction. It targets users who want to extract structured data from various sources, process it with AI-driven analytical skills, and deliver comprehensive reports via email. The workflow supports multiple data inputs (database, Google Sheets, local file, or sample data), and applies three AI-powered functions — Data Analysis, Data Interpretation, and Data Visualization — leveraging the Ada AI platform. The final outputs are formatted as HTML or markdown and sent by email.

The workflow is logically structured into the following blocks:

- **1.1 Data Source Extraction:** Nodes that extract or generate structured data from various sources.
- **1.2 Data Processing:** Aggregates or formats the data to prepare it for AI analysis.
- **1.3 AI Processing (Skills):** Performs analysis, interpretation, and visualization using Ada AI APIs.
- **1.4 Output Conversion:** Converts AI responses into appropriate HTML or files.
- **1.5 Delivery:** Sends the processed results via email.
- **1.6 Documentation and Guidance:** Sticky notes providing user instructions, API key setup, and workflow overview.

---

### 2. Block-by-Block Analysis

#### 1.1 Data Source Extraction

**Overview:**  
This block extracts structured sales data from one selected source among multiple supported options: MySQL database, Google Sheets, local Excel/CSV file, or generates sample data internally. It ensures data conforms to a structured format for downstream AI processing.

**Nodes Involved:**  
- Get data from database (MySQL)  
- Get data from Google Sheets  
- Get data from local file  
- Extract JSON from xlsx file  
- Sample Data

**Node Details:**

- **Get data from database**  
  - Type: MySQL node  
  - Role: Executes SQL query to extract up to 100 records from `orders` table.  
  - Config: Query `"select * from orders limit 100"`. No extra options.  
  - Inputs: None (triggered manually or from upstream node)  
  - Outputs: JSON dataset of orders.  
  - Edge cases: DB connection failures, query errors, empty result set.  
  - Credentials: Requires MySQL credentials.  

- **Get data from Google Sheets**  
  - Type: Google Sheets node  
  - Role: Reads data from a specified Google Sheet and tab.  
  - Config: Document ID and Sheet Name set to a specific public sheet.  
  - Inputs: None  
  - Outputs: JSON array of rows.  
  - Edge cases: OAuth token expiry, permission errors, empty sheet.  
  - Credentials: Google Sheets OAuth2 credentials required.  

- **Get data from local file**  
  - Type: Read/Write File node  
  - Role: Reads a local file binary data into the workflow, expecting an Excel/CSV file.  
  - Config: Reads file into binary property named `input_file`.  
  - Inputs: None  
  - Outputs: Binary data of file.  
  - Edge cases: File not found, permission issues.  

- **Extract JSON from xlsx file**  
  - Type: Extract From File node  
  - Role: Converts the binary Excel file (`input_file`) into JSON data.  
  - Config: Operation set to XLSX extraction.  
  - Inputs: Binary file from previous node.  
  - Outputs: JSON structured data extracted from Excel.  
  - Edge cases: File format errors, corrupted files.  

- **Sample Data**  
  - Type: Code node (JavaScript)  
  - Role: Generates 1000 simulated sales order records with fields order_date, product_category, region, and sales_amount.  
  - Config: JS code generates random dates within 2 years, random categories and regions, and sales amounts.  
  - Inputs: None (manual trigger or from upstream)  
  - Outputs: JSON array of generated sales data.  
  - Edge cases: None significant; deterministic in nature.  

---

#### 1.2 Data Processing

**Overview:**  
This block aggregates or processes the incoming raw data into a uniform structure expected by the AI nodes.

**Nodes Involved:**  
- Process Data

**Node Details:**

- **Process Data**  
  - Type: Aggregate node  
  - Role: Aggregates all received items into a single JSON array attached as `data` for downstream consumption.  
  - Config: Uses "aggregateAllItemData" operation, which merges all item JSONs into one array under a single field.  
  - Inputs: Data from any data source node (MySQL, Google Sheets, local file extraction, or sample data).  
  - Outputs: Single JSON object with aggregated data array.  
  - Edge cases: No input data, malformed data arrays.  

---

#### 1.3 AI Processing (Skills)

**Overview:**  
This block sends the structured data to three Ada AI skill endpoints for analysis, interpretation, and visualization based on natural language queries. Each node uses HTTP POST requests with authentication via header API key.

**Nodes Involved:**  
- DataAnalysis  
- DataInterpretation  
- DataVisualization

**Node Details:**

- **DataAnalysis**  
  - Type: HTTP Request  
  - Role: Sends data and query to Ada API for statistical and data analysis.  
  - Config: POST to `https://ada.im/api/platform_api/PythonDataAnalysis`.  
  - Body: JSON includes `input_json` (data), fixed query about top three products in 2024 and statistical gap analysis, and platform identifier "n8n".  
  - Authentication: Header Auth with API key.  
  - Inputs: Aggregated data from Process Data node.  
  - Outputs: JSON with analysis result in markdown format.  
  - Edge cases: API key invalid, network timeout, unexpected API response.  

- **DataInterpretation**  
  - Type: HTTP Request  
  - Role: Requests natural language interpretation of sales volume data.  
  - Config: POST to `https://ada.im/api/platform_api/DataInterpretation`.  
  - Body: JSON with `input_json` (data), query "Sales volume of each product in 2024", platform "n8n".  
  - Authentication: Header Auth with API key.  
  - Inputs: Aggregated data.  
  - Outputs: Markdown interpretation result.  
  - Edge cases: Same as DataAnalysis.  

- **DataVisualization**  
  - Type: HTTP Request  
  - Role: Requests charts and visual reports (HTML) for sales data visualization.  
  - Config: POST to `https://ada.im/api/platform_api/EchartsVisualization`.  
  - Body: JSON with `input_json` (data), query for pie chart and line chart for 2024 sales, platform "n8n".  
  - Authentication: Header Auth with API key (credential named "Header Auth account").  
  - Inputs: Aggregated data.  
  - Outputs: JSON with HTML content for charts.  
  - Edge cases: API errors, malformed response, credential expiration.  

---

#### 1.4 Output Conversion

**Overview:**  
This block converts AI outputs from markdown or JSON string format to HTML and prepares visualization data into an HTML file for email attachments.

**Nodes Involved:**  
- Convert markdown to HTML  
- Convert markdown to HTML 2  
- Process Visualization Data  
- Convert to HTML File

**Node Details:**

- **Convert markdown to HTML**  
  - Type: Markdown node  
  - Role: Converts DataAnalysis markdown response to HTML snippet.  
  - Config: Converts markdown from `{{$json.data.parseJson().data}}` with tables and simple line breaks enabled, no complete HTML document.  
  - Inputs: DataAnalysis node output.  
  - Outputs: HTML string under key `html`.  
  - Edge cases: Parsing errors if data is malformed.  

- **Convert markdown to HTML 2**  
  - Type: Markdown node  
  - Role: Converts DataInterpretation markdown response to HTML snippet.  
  - Config: Same as above but processes DataInterpretation output.  
  - Inputs: DataInterpretation node output.  
  - Outputs: HTML string under key `html`.  
  - Edge cases: Same as above.  

- **Process Visualization Data**  
  - Type: Set node  
  - Role: Extracts and assigns the HTML string from DataVisualization JSON response to `html` property for file conversion.  
  - Config: Sets `html` to `JSON.parse($json.data).data`.  
  - Inputs: DataVisualization node output.  
  - Outputs: JSON with `html` string.  
  - Edge cases: JSON parse failures if response malformed.  

- **Convert to HTML File**  
  - Type: Convert To File node  
  - Role: Converts HTML string into a text file named `chart.html` as binary attachment for email.  
  - Config: Source property is `html`, output binary property `chart`.  
  - Inputs: Process Visualization Data node output.  
  - Outputs: Binary file attachment.  
  - Edge cases: Conversion errors or missing data.  

---

#### 1.5 Delivery

**Overview:**  
Sends the converted AI results via Gmail to recipients, using HTML or files as email content or attachments.

**Nodes Involved:**  
- Send DataAnalysis message  
- Send DataInterpretation message  
- Send DataVisualization

**Node Details:**

- **Send DataAnalysis message**  
  - Type: Gmail node  
  - Role: Sends email with DataAnalysis HTML content as message body.  
  - Config: Sends email with subject "n8n-email"; message body uses HTML from Convert markdown to HTML node. No explicit recipient (likely default configured).  
  - Inputs: Converted HTML from DataAnalysis.  
  - Outputs: None (end node).  
  - Edge cases: Gmail auth errors, email sending failures.  

- **Send DataInterpretation message**  
  - Type: Gmail node  
  - Role: Sends email with DataInterpretation HTML content.  
  - Config: Recipient is fixed to "cuifangxu1999@gmail.com", subject "n8ntest".  
  - Inputs: Converted HTML from Convert markdown to HTML 2 node.  
  - Outputs: None.  
  - Edge cases: Same as above.  

- **Send DataVisualization**  
  - Type: Gmail node  
  - Role: Sends email with HTML file attachment (`chart.html`) for visualization.  
  - Config: Recipient "cuifangxu1999@gmail.com", subject "n8ntest", message instructs user to open attachment in browser. Attachment is binary file from Convert to HTML File node.  
  - Inputs: Converted HTML file.  
  - Outputs: None.  
  - Edge cases: Attachment size limits, email client compatibility.  

---

#### 1.6 Documentation and Guidance (Sticky Notes)

**Overview:**  
This block contains multiple sticky notes providing instructions, API key application, credential setup, usage tips, and contact information to assist users in configuring and understanding the workflow.

**Nodes Involved:**  
- Sticky Note (Data Source explanation)  
- Sticky Note1 (Skill selection and API key setup summary)  
- Sticky Note2 (Output example)  
- Sticky Note3 (Workflow overview and example results with images)  
- Sticky Note4 (Credentials setup guide with screenshots)  
- Sticky Note5 (Contact and consultation info with links)  
- Sticky Note6 (Detailed API Key application instructions with screenshots and credit rules)  
- Sticky Note7 (Final step instructions for trying out skills with screenshot)  

**Node Details:**  
All Sticky Notes are of type `n8n-nodes-base.stickyNote`, serving as documentation and do not affect workflow logic. They contain valuable URLs and images for user guidance.

---

### 3. Summary Table

| Node Name                 | Node Type              | Functional Role                              | Input Node(s)               | Output Node(s)             | Sticky Note                                                                                                                   |
|---------------------------|------------------------|----------------------------------------------|-----------------------------|----------------------------|-------------------------------------------------------------------------------------------------------------------------------|
| Start                     | Manual Trigger         | Workflow entry point                         | -                           | Sample Data                |                                                                                                                               |
| Sample Data               | Code                   | Generates simulated sales data               | Start                       | Process Data               |                                                                                                                               |
| Get data from database    | MySQL                  | Extracts data from MySQL database            | -                           | Process Data               |                                                                                                                               |
| Get data from Google Sheets | Google Sheets          | Extracts data from Google Sheets             | -                           | Process Data               |                                                                                                                               |
| Get data from local file  | Read/Write File        | Reads local Excel/CSV file                    | -                           | Extract JSON from xlsx file |                                                                                                                               |
| Extract JSON from xlsx file | Extract From File      | Converts Excel binary data to JSON            | Get data from local file    | Process Data               |                                                                                                                               |
| Process Data             | Aggregate              | Aggregates all data items into one JSON array | Sample Data, Get data nodes  | DataAnalysis, DataInterpretation, DataVisualization | Sticky Note (Data Source) explains selection of one data source.                                                             |
| DataAnalysis             | HTTP Request           | Calls Ada AI Data Analysis API                | Process Data                | Convert markdown to HTML   | Sticky Note1 explains skill usage and API key requirements.                                                                    |
| DataInterpretation       | HTTP Request           | Calls Ada AI Data Interpretation API         | Process Data                | Convert markdown to HTML 2 | Sticky Note1                                                                                                                  |
| DataVisualization        | HTTP Request           | Calls Ada AI Visualization API                | Process Data                | Process Visualization Data | Sticky Note1                                                                                                                  |
| Convert markdown to HTML | Markdown               | Converts DataAnalysis markdown to HTML       | DataAnalysis                | Send DataAnalysis message  |                                                                                                                               |
| Convert markdown to HTML 2 | Markdown               | Converts DataInterpretation markdown to HTML | DataInterpretation          | Send DataInterpretation message |                                                                                                                            |
| Process Visualization Data | Set                   | Extracts HTML from JSON visualization data   | DataVisualization           | Convert to HTML File       |                                                                                                                               |
| Convert to HTML File     | Convert To File         | Converts HTML string to binary HTML file     | Process Visualization Data  | Send DataVisualization     |                                                                                                                               |
| Send DataAnalysis message | Gmail                  | Sends analysis email                          | Convert markdown to HTML    | -                          | Sticky Note2 gives example output instructions.                                                                                |
| Send DataInterpretation message | Gmail              | Sends interpretation email                    | Convert markdown to HTML 2  | -                          | Sticky Note2                                                                                                                  |
| Send DataVisualization   | Gmail                  | Sends visualization email with attachment   | Convert to HTML File        | -                          | Sticky Note2                                                                                                                  |
| Sticky Note              | Sticky Note            | Data Source explanation and usage instructions | -                         | -                          | Covers data source selection and sample data description.                                                                     |
| Sticky Note1             | Sticky Note            | Skill node usage and API key setup summary   | -                           | -                          | Covers skills selection and API key authentication.                                                                            |
| Sticky Note2             | Sticky Note            | Output example and delivery note              | -                           | -                          | Explains email sending as example output method.                                                                               |
| Sticky Note3             | Sticky Note            | Workflow overview and example results         | -                           | -                          | Contains branding, overview, and example result images.                                                                        |
| Sticky Note4             | Sticky Note            | Credentials setup guide with screenshots      | -                           | -                          | Detailed credential configuration steps for HTTP nodes.                                                                        |
| Sticky Note5             | Sticky Note            | Contact and consultation info                  | -                           | -                          | Provides email and Discord contact, plus link to Ada AI homepage.                                                             |
| Sticky Note6             | Sticky Note            | API Key application instructions and credit info | -                       | -                          | Step-by-step API key application guide with images and credit consumption rules.                                               |
| Sticky Note7             | Sticky Note            | Final "try the skills" usage instructions      | -                           | -                          | Explains setting query parameters and selecting data source, with screenshot.                                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Manual Trigger Node:**  
   - Name: `Start`  
   - Purpose: Entry point to manually trigger the workflow.

2. **Create Data Source Nodes (Choose One):**  
   a. **MySQL Node:**  
      - Name: `Get data from database`  
      - Operation: Execute Query  
      - Query: `select * from orders limit 100`  
      - Configure MySQL credentials.  
   b. **Google Sheets Node:**  
      - Name: `Get data from Google Sheets`  
      - Set Document ID and Sheet Name to your target Google Sheet.  
      - Use Google Sheets OAuth2 credentials.  
   c. **Read/Write File Node:**  
      - Name: `Get data from local file`  
      - Configure to read the local Excel/CSV file binary data into property `input_file`.  
   d. **Extract From File Node:**  
      - Name: `Extract JSON from xlsx file`  
      - Operation: XLSX extraction  
      - Input: Binary file from previous node.  
   e. **Code Node (optional):**  
      - Name: `Sample Data`  
      - JavaScript code to generate 1000 random sales records (provided in original workflow).  

3. **Create Aggregate Node:**  
   - Name: `Process Data`  
   - Operation: Aggregate all received items into one JSON array under `data`.  
   - Connect from the selected data source node or extraction node.  

4. **Create HTTP Request Nodes for AI Skills:**  
   - Common for all:  
     - Authentication: Generic Credential Type with Header Auth using API key named `Authorization`.  
     - Method: POST  
     - Send body as JSON parameters.  
   - **DataAnalysis:**  
     - URL: `https://ada.im/api/platform_api/PythonDataAnalysis`  
     - Body Parameters:  
       - `input_json`: `{{$json.data}}`  
       - `query`: `"What are the top three products in terms of sales in 2024? Analyze the gap between the top three products and the others from a statistical perspective."`  
       - `platform`: `"n8n"`  
   - **DataInterpretation:**  
     - URL: `https://ada.im/api/platform_api/DataInterpretation`  
     - Body Parameters:  
       - `input_json`: `{{$json.data}}`  
       - `query`: `"Sales volume of each product in 2024"`  
       - `platform`: `"n8n"`  
   - **DataVisualization:**  
     - URL: `https://ada.im/api/platform_api/EchartsVisualization`  
     - Body Parameters:  
       - `input_json`: `{{$json.data}}`  
       - `query`: `"Use a pie chart to display the sales of each product in 2024, and a line chart to represent the total monthly sales of each product in 2024. Additionally, you can add some extra charts based on the data."`  
       - `platform`: `"n8n"`  
     - Credentials: Use HTTP Header Auth credential with API key.  

5. **Create Markdown Conversion Nodes:**  
   - **Convert markdown to HTML:**  
     - Input: DataAnalysis node output property `data` parsed as JSON, then extract `.data` markdown string.  
     - Mode: markdownToHtml with tables and simple line breaks enabled.  
   - **Convert markdown to HTML 2:**  
     - Same as above but connected to DataInterpretation output.  

6. **Create Set Node to prepare Visualization Data:**  
   - Name: `Process Visualization Data`  
   - Set `html` property to `JSON.parse($json.data).data` from DataVisualization output.  

7. **Create Convert To File Node:**  
   - Name: `Convert to HTML File`  
   - Operation: toText  
   - Source property: `html`  
   - File name: `chart.html`  
   - Output binary property: `chart`  

8. **Create Gmail Nodes to Send Emails:**  
   - **Send DataAnalysis message:**  
     - To: Default or configured email  
     - Subject: `n8n-email`  
     - Message body: HTML from Convert markdown to HTML node.  
   - **Send DataInterpretation message:**  
     - To: `"cuifangxu1999@gmail.com"` (replace with your recipient)  
     - Subject: `n8ntest`  
     - Message body: HTML from Convert markdown to HTML 2 node.  
   - **Send DataVisualization:**  
     - To: `"cuifangxu1999@gmail.com"` (replace accordingly)  
     - Subject: `n8ntest`  
     - Message body: Text instructing to open attached HTML file in browser.  
     - Attachments: Binary file `chart` from Convert to HTML File node.  

9. **Connect the Nodes:**  
   - Connect `Start` to selected data source node or `Sample Data`.  
   - Data source node output to `Process Data`.  
   - `Process Data` output to all three AI HTTP request nodes in parallel.  
   - Connect DataAnalysis node to Convert markdown to HTML, then to Send DataAnalysis message.  
   - Connect DataInterpretation node to Convert markdown to HTML 2, then to Send DataInterpretation message.  
   - Connect DataVisualization node to Process Visualization Data, then to Convert to HTML File, then to Send DataVisualization.  

10. **Set up Credentials:**  
    - Apply for ADA API key at [Ada AI website](https://ada.im/home).  
    - Create generic HTTP Header Auth credential in n8n with header name `Authorization` and value as your API key.  
    - Configure Google Sheets OAuth2 credentials if using Google Sheets data source.  
    - Configure MySQL credentials if using MySQL node.  
    - Configure Gmail OAuth2 credentials for sending emails.  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                             | Context or Link                                                                                                                                                |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|
| This workflow template is supported by Ada AI, a low-code AI data analyst platform.                                                                                                                                                      | [Ada AI website](https://ada.im/home?ada_data_=&utm_source=n8n&utm_medium=landingpage&utm_infeluncer=landingpage&utm_campain=landingpage&utm_content=landingpage) |
| Detailed step-by-step API key application guide and credit usage rules are provided, including free monthly credits and purchase options.                                                                                                | See Sticky Note6 in workflow, includes screenshots and billing link [ADA Billing](https://ada.im/udsl/#/system/billing)                                        |
| Instructions for setting up HTTP header authentication credentials in n8n HTTP Request nodes are included, with screenshots.                                                                                                           | See Sticky Note4 in workflow                                                                                                                                    |
| Example queries show usage of natural language to generate pie charts, line charts, and statistical analyses on 2024 sales data.                                                                                                        | See Sticky Note3 with example images                                                                                                                           |
| Contact and support information is provided via email and Discord for inquiries or feedback.                                                                                                                                             | Email: n8n-plugin@ada.im; Discord: https://discord.com/invite/Bwd6zGYThS                                                                                         |
| Email sending is used as an example for output delivery; users can customize delivery methods as needed.                                                                                                                                 | See Sticky Note2                                                                                                                                                 |

---

**Disclaimer:**  
The text provided derives exclusively from an automated n8n workflow. It complies strictly with content policies and contains no illegal, offensive, or protected elements. All manipulated data are legal and public.