AI-Driven Inventory Management with OpenAI Forecasting & ERP Integration

https://n8nworkflows.xyz/workflows/ai-driven-inventory-management-with-openai-forecasting---erp-integration-10531


# AI-Driven Inventory Management with OpenAI Forecasting & ERP Integration

### 1. Workflow Overview

This workflow automates inventory management by integrating real-time data retrieval, AI-powered demand forecasting, purchase order (PO) generation, supplier communication, and ERP/database logging. It is designed for warehouse and procurement teams aiming to optimize stock levels, reduce manual ordering errors, and improve procurement efficiency.

**Key Use Cases:**  
- Monitoring inventory and sales velocity regularly  
- Forecasting demand using OpenAI GPT-4 AI models  
- Automatically creating and sending purchase orders to suppliers  
- Logging purchase orders and forecasts in ERP systems and databases  
- Notifying procurement teams by email  

**Logical Blocks:**

- **1.1 Scheduled Trigger & Data Collection:** Automated periodic start, fetching current inventory and sales velocity data in parallel.  
- **1.2 Data Merging:** Combining inventory and sales data into a unified dataset for AI analysis.  
- **1.3 AI Demand Forecasting:** Utilizing OpenAI GPT-4 to analyze combined data and forecast reorder needs.  
- **1.4 Forecast Parsing & Filtering:** Parsing AI response and filtering products that require reordering.  
- **1.5 Purchase Order Creation:** Generating detailed purchase orders with cost and schedule info.  
- **1.6 Supplier Communication:** Sending purchase orders to suppliers via API.  
- **1.7 ERP & Database Logging:** Recording orders in ERP systems and databases.  
- **1.8 Notification:** Sending email notifications about created purchase orders to procurement teams.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Trigger & Data Collection

**Overview:**  
This block triggers the workflow every 6 hours and fetches current inventory levels and sales velocity data from external APIs in parallel.

**Nodes Involved:**  
- Schedule Trigger  
- Fetch Current Inventory  
- Fetch Sales Velocity

**Node Details:**

- **Schedule Trigger**  
  - Type: Schedule Trigger  
  - Role: Initiates workflow every 6 hours automatically  
  - Configurations: Interval set to 6 hours (modifiable to minutes for testing)  
  - Inputs: None (start node)  
  - Outputs: Connects to Fetch Current Inventory  
  - Edge Cases: Misconfigured interval, workflow not triggered if n8n is down

- **Fetch Current Inventory**  
  - Type: HTTP Request  
  - Role: Retrieves current stock levels from warehouse API  
  - Configurations:  
    - URL placeholder: https://your-warehouse-api.com/api/inventory (replace with real endpoint)  
    - Authorization header: Bearer token (replace with valid token)  
    - Method: GET (default)  
  - Inputs: Trigger from Schedule Trigger  
  - Outputs: Feeds into Fetch Sales Velocity and Merge Inventory & Sales Data  
  - Edge Cases: API downtime, invalid auth token, unexpected data format

- **Fetch Sales Velocity**  
  - Type: HTTP Request  
  - Role: Retrieves sales velocity data for last 30 days from sales API  
  - Configurations:  
    - URL placeholder: https://your-sales-api.com/api/sales/velocity  
    - Query parameter "days": 30 (modifiable)  
    - Authorization header: Bearer token (replace with valid token)  
    - Method: GET  
  - Inputs: Triggered after Fetch Current Inventory (parallel path)  
  - Outputs: Connects to Merge Inventory & Sales Data  
  - Edge Cases: API downtime, auth errors, inconsistent sales data

---

#### 2.2 Data Merging

**Overview:**  
Combines inventory and sales data into a single dataset keyed by product ID, enriching inventory items with sales metrics.

**Nodes Involved:**  
- Merge Inventory & Sales Data

**Node Details:**

- **Merge Inventory & Sales Data**  
  - Type: Code (JavaScript)  
  - Role: Merges inventory and sales data arrays by matching product_id  
  - Configuration:  
    - Takes two inputs: inventory data (input 1), sales data (input 2)  
    - Creates a unified data object per product with inventory and sales fields such as current stock, reorder point, sales velocity, trend, unit cost, lead time  
  - Inputs: From Fetch Current Inventory and Fetch Sales Velocity  
  - Outputs: To AI Demand Forecasting  
  - Edge Cases: Missing sales data for some products, malformed data arrays, null/undefined values

---

#### 2.3 AI Demand Forecasting

**Overview:**  
Analyzes merged data using OpenAI GPT-4 to forecast demand, recommend reorder quantities, and provide reasoning.

**Nodes Involved:**  
- AI Demand Forecasting

**Node Details:**

- **AI Demand Forecasting**  
  - Type: OpenAI (Langchain)  
  - Role: Sends merged product data to GPT-4 model, receives demand forecast and reorder recommendations  
  - Configuration:  
    - OpenAI API credentials required (configured in n8n)  
    - Model: gpt-4 or gpt-4-turbo  
    - Temperature: 0.3 (low randomness for consistent output)  
    - Custom API call with payload including current stock, sales trends, reorder points, lead times  
  - Inputs: Merged inventory and sales data  
  - Outputs: To Parse AI Response  
  - Edge Cases: API rate limits, network errors, malformed AI response, credential misconfiguration

---

#### 2.4 Forecast Parsing & Filtering

**Overview:**  
Parses AI JSON response, combines it with original data, filters out items that do not require reorder.

**Nodes Involved:**  
- Parse AI Response  
- Filter: Reorder Needed

**Node Details:**

- **Parse AI Response**  
  - Type: Code (JavaScript)  
  - Role: Parses AI JSON response safely, adds forecast fields (should_reorder, recommended_quantity, confidence, etc.) to data  
  - Configuration:  
    - Handles parsing exceptions, defaults to safe values if parse fails  
  - Inputs: AI Demand Forecasting output  
  - Outputs: Filter node  
  - Edge Cases: Malformed AI response, missing fields, parsing errors

- **Filter: Reorder Needed**  
  - Type: Filter  
  - Role: Allows only items with `should_reorder === true` to pass to PO creation  
  - Configuration: Filter condition on boolean field `should_reorder`  
  - Inputs: Parsed AI response data  
  - Outputs: Create Purchase Order (if true), terminated otherwise  
  - Edge Cases: No items pass (no reorder needed), all items filtered out

---

#### 2.5 Purchase Order Creation

**Overview:**  
Generates detailed purchase order documents with unique PO numbers, cost calculations, delivery dates, and AI forecast data.

**Nodes Involved:**  
- Create Purchase Order

**Node Details:**

- **Create Purchase Order**  
  - Type: Code (JavaScript)  
  - Role: Constructs PO JSON object per item including:  
    - Unique PO number with timestamp and index  
    - Quantity (recommended by AI), unit cost, total cost  
    - Order and expected delivery dates based on lead time  
    - Supplier and product details  
    - Forecast confidence and reasoning notes  
  - Inputs: Filter: Reorder Needed  
  - Outputs: Send PO to Supplier  
  - Edge Cases: Missing unit cost or lead time (defaults), PO number collision (unlikely with timestamp), empty inputs

---

#### 2.6 Supplier Communication

**Overview:**  
Sends generated purchase orders to supplier systems via HTTP API calls.

**Nodes Involved:**  
- Send PO to Supplier

**Node Details:**

- **Send PO to Supplier**  
  - Type: HTTP Request  
  - Role: POST purchase order JSON to supplier API endpoint  
  - Configuration:  
    - URL placeholder: https://your-supplier-api.com/api/purchase-orders (replace)  
    - Authorization header with Bearer token  
    - Content-Type: application/json  
    - Body includes PO number, supplier and product IDs, quantity, costs, expected delivery  
  - Inputs: Create Purchase Order output  
  - Outputs: Log to ERP System  
  - Edge Cases: Supplier API downtime, auth errors, invalid response, request timeouts

---

#### 2.7 ERP & Database Logging

**Overview:**  
Logs completed purchase orders including AI forecast data into ERP systems and relational databases.

**Nodes Involved:**  
- Log to ERP System  
- Save to Database

**Node Details:**

- **Log to ERP System**  
  - Type: HTTP Request  
  - Role: POST PO data to ERP system API (SAP, Oracle, NetSuite, etc.)  
  - Configuration:  
    - URL placeholder: https://your-erp-system.com/api/purchase-orders (replace)  
    - Authorization header with Bearer token  
    - Content-Type: application/json  
  - Inputs: Send PO to Supplier output  
  - Outputs: Save to Database  
  - Edge Cases: ERP API errors, auth failures, data format mismatches

- **Save to Database**  
  - Type: PostgreSQL Node  
  - Role: Inserts PO record into purchase_orders table in relational database  
  - Configuration:  
    - Requires PostgreSQL credentials setup in n8n  
    - SQL INSERT statement maps PO JSON fields into DB columns  
    - Table schema provided in notes for reference  
  - Inputs: Log to ERP System output  
  - Outputs: Send Notification Email  
  - Edge Cases: DB connection errors, SQL syntax errors, constraint violations

---

#### 2.8 Notification

**Overview:**  
Sends email notification to procurement team with details about newly created purchase orders.

**Nodes Involved:**  
- Send Notification Email

**Node Details:**

- **Send Notification Email**  
  - Type: Email Send  
  - Role: Sends email to procurement@yourcompany.com summarizing PO details and AI forecast data  
  - Configuration:  
    - SMTP credentials required in n8n settings (e.g., Gmail SMTP)  
    - Subject includes PO number dynamically  
    - From and To email configured  
    - Email body can be customized (default includes PO and forecast info)  
  - Inputs: Save to Database output  
  - Outputs: None (end node)  
  - Edge Cases: SMTP auth failure, email delivery errors, invalid recipient address

---

### 3. Summary Table

| Node Name               | Node Type                     | Functional Role                   | Input Node(s)                 | Output Node(s)             | Sticky Note                                                                                             |
|-------------------------|-------------------------------|---------------------------------|------------------------------|----------------------------|-------------------------------------------------------------------------------------------------------|
| Schedule Trigger         | Schedule Trigger              | Start workflow every 6 hours    | None                         | Fetch Current Inventory     | 🕐 SCHEDULE TRIGGER Runs every 6 hours to check inventory levels. Adjust interval as needed.           |
| Fetch Current Inventory  | HTTP Request                 | Retrieve warehouse inventory    | Schedule Trigger             | Fetch Sales Velocity, Merge Inventory & Sales Data | 📦 FETCH INVENTORY DATA: Configure API URL, Auth token, method. Expected JSON response format shown.  |
| Fetch Sales Velocity     | HTTP Request                 | Retrieve sales data             | Fetch Current Inventory      | Merge Inventory & Sales Data | 📊 FETCH SALES VELOCITY: Configure API URL, Auth token, days param. Expected JSON format shown.       |
| Merge Inventory & Sales Data | Code (JavaScript)          | Combine inventory & sales data  | Fetch Current Inventory, Fetch Sales Velocity | AI Demand Forecasting      | 🔗 MERGE DATA: Automatically merges data keyed by product_id. No config needed.                        |
| AI Demand Forecasting    | OpenAI (Langchain)           | Generate demand forecast via GPT-4 | Merge Inventory & Sales Data | Parse AI Response           | 🤖 AI DEMAND FORECASTING: Uses OpenAI GPT-4 with temp 0.3. Configure API creds and model.              |
| Parse AI Response        | Code (JavaScript)            | Parse & structure AI JSON output | AI Demand Forecasting        | Filter: Reorder Needed      | 🔍 PARSE AI RESPONSE: Parses AI JSON safely, adds forecast fields, handles errors gracefully.         |
| Filter: Reorder Needed   | Filter                      | Pass only items needing reorder | Parse AI Response            | Create Purchase Order       | 🎯 FILTER: REORDER NEEDED: Filters on should_reorder === true. No config needed.                       |
| Create Purchase Order    | Code (JavaScript)            | Generate detailed PO documents  | Filter: Reorder Needed       | Send PO to Supplier         | 📝 CREATE PURCHASE ORDER: Generates PO number, calculates costs, sets delivery dates, includes AI notes. No config needed. |
| Send PO to Supplier      | HTTP Request                 | Send PO to supplier API         | Create Purchase Order        | Log to ERP System           | 📤 SEND TO SUPPLIER: Configure API URL, Auth token, body params. Supports alternative send methods.    |
| Log to ERP System        | HTTP Request                 | Log PO in ERP system            | Send PO to Supplier          | Save to Database            | 💾 LOG TO ERP SYSTEM: Configure ERP API endpoint, Auth headers, body format. Common ERP endpoints listed. |
| Save to Database         | PostgreSQL                   | Insert PO into database         | Log to ERP System            | Send Notification Email     | 🗄️ SAVE TO DATABASE: Configure DB creds and schema. SQL insert provided.                             |
| Send Notification Email  | Email Send                  | Notify procurement team via email | Save to Database             | None                       | 📧 SEND NOTIFICATION: Configure SMTP creds, recipient, and customize email template as needed.        |
| Sticky Note              | Sticky Note                 | Documentation and notes         | None                         | None                       | Various notes provide configuration instructions and workflow guidance.                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node:**  
   - Type: Schedule Trigger  
   - Configure interval to run every 6 hours (adjustable).  

2. **Add HTTP Request node "Fetch Current Inventory":**  
   - Connect from Schedule Trigger.  
   - Set method to GET.  
   - Set URL to your warehouse API endpoint.  
   - Add Authorization header with Bearer token.  
   - Expect JSON array of inventory items.

3. **Add HTTP Request node "Fetch Sales Velocity":**  
   - Connect from "Fetch Current Inventory" (parallel output).  
   - Set method to GET.  
   - Set URL to your sales API endpoint.  
   - Add query parameter `days=30`.  
   - Add Authorization header with Bearer token.  
   - Expect JSON array of sales velocity data.

4. **Add Code node "Merge Inventory & Sales Data":**  
   - Connect inputs from "Fetch Current Inventory" (first input) and "Fetch Sales Velocity" (second input).  
   - Paste provided JavaScript code to merge data by product_id.  
   - No additional configuration needed.

5. **Add OpenAI node "AI Demand Forecasting":**  
   - Connect from "Merge Inventory & Sales Data".  
   - Configure OpenAI API credentials in n8n.  
   - Set model to gpt-4 or gpt-4-turbo.  
   - Set temperature to 0.3.  
   - Use custom API call resource with prompt containing merged data for forecasting.

6. **Add Code node "Parse AI Response":**  
   - Connect from "AI Demand Forecasting".  
   - Paste JavaScript code to parse AI JSON response and enrich data.  
   - No additional configuration needed.

7. **Add Filter node "Filter: Reorder Needed":**  
   - Connect from "Parse AI Response".  
   - Set condition: `should_reorder === true`.  
   - No extra config needed.

8. **Add Code node "Create Purchase Order":**  
   - Connect from "Filter: Reorder Needed".  
   - Paste JavaScript code that generates PO documents with unique PO numbers, costs, delivery dates, and AI notes.  
   - No extra config needed.

9. **Add HTTP Request node "Send PO to Supplier":**  
   - Connect from "Create Purchase Order".  
   - Set method to POST.  
   - Set URL to supplier API endpoint.  
   - Add Authorization header and Content-Type: application/json.  
   - Map body parameters: po_number, supplier_id, product_id, quantity, total_cost, expected_delivery.

10. **Add HTTP Request node "Log to ERP System":**  
    - Connect from "Send PO to Supplier".  
    - Set method to POST.  
    - Set URL to your ERP API endpoint.  
    - Add Authorization header and content-type application/json.  
    - Map entire PO JSON for logging.

11. **Add PostgreSQL node "Save to Database":**  
    - Connect from "Log to ERP System".  
    - Configure PostgreSQL credentials in n8n.  
    - Use provided SQL INSERT query adapting to your DB schema.  
    - Map JSON fields accordingly.

12. **Add Email Send node "Send Notification Email":**  
    - Connect from "Save to Database".  
    - Configure SMTP credentials in n8n.  
    - Set recipient email (e.g., procurement@yourcompany.com).  
    - Customize subject and email body to include PO and AI forecast details.

13. **Test the workflow:**  
    - Adjust API endpoint URLs and authorization tokens accordingly.  
    - Validate data formats at each step.  
    - Monitor logs for errors or missing data.

---

### 5. General Notes & Resources

| Note Content | Context or Link |
|--------------|-----------------|
| Workflow runs every 6 hours but interval can be modified in Schedule Trigger node for testing or operational needs. | Scheduling configuration |
| OpenAI API credentials must be configured securely in n8n credentials manager before using AI Demand Forecasting node. | OpenAI integration setup |
| Common ERP API endpoints and formats for SAP, Oracle NetSuite, Odoo, Microsoft Dynamics are provided in node notes for easy adaptation. | ERP integration references |
| Database schema for purchase_orders table is provided to ensure correct SQL insert queries. Adjust to your database if needed. | Database setup |
| SMTP settings example for Gmail provided for email notification node configuration. Use app password if 2FA enabled. | Email notification setup |
| Supplier API can be modified to send purchase orders via email or generate PDFs instead of API calls if required. | Supplier communication flexibility |
| Monitor workflow executions to track AI forecast accuracy, number of POs created, total spending, and errors. | Operational monitoring |

---

**Disclaimer:**  
The text above is exclusively derived from an n8n automated workflow. It strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All processed data is legal and publicly accessible.