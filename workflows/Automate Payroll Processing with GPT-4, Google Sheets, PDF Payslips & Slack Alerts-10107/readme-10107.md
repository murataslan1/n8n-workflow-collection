Automate Payroll Processing with GPT-4, Google Sheets, PDF Payslips & Slack Alerts

https://n8nworkflows.xyz/workflows/automate-payroll-processing-with-gpt-4--google-sheets--pdf-payslips---slack-alerts-10107


# Automate Payroll Processing with GPT-4, Google Sheets, PDF Payslips & Slack Alerts

### 1. Workflow Overview

This workflow automates the monthly payroll processing for a company using GPT-4 AI, Google Sheets, PDF generation, email distribution, and Slack notifications. Its core purpose is to calculate net salaries for employees, generate payslips, log payroll data, and notify both employees and HR efficiently.

Logical blocks:

- **1.1 Monthly Trigger & Data Retrieval:** Automatically starts the workflow monthly and fetches employee payroll data from Google Sheets.
- **1.2 AI Salary Calculation:** Uses GPT-4 to compute net salary applying taxes and deductions.
- **1.3 Payslip Data Formatting:** Structures the AI response and employee details for further use.
- **1.4 Payroll Logging & Document Generation:** Logs the payroll into another sheet and generates PDF payslips.
- **1.5 Notification Distribution:** Emails payslips to employees and sends Slack alerts to HR.

---

### 2. Block-by-Block Analysis

#### 1.1 Monthly Trigger & Data Retrieval

**Overview:**  
This block triggers the workflow on a monthly schedule and retrieves employee salary data from a Google Sheets document.

**Nodes Involved:**  
- Monthly Payroll Trigger  
- Get Employee Data

**Node Details:**

- **Monthly Payroll Trigger**  
  - Type: Schedule Trigger  
  - Role: Initiates the workflow on specific days of the month (configured for 28th day)  
  - Configuration: Monthly interval trigger on monthDays (28th specifically)  
  - Inputs: None (trigger node)  
  - Outputs: Connects to "Get Employee Data"  
  - Edge Cases: Workflow won’t run if the trigger is disabled or misconfigured; time zone mismatches can cause scheduling issues.

- **Get Employee Data**  
  - Type: Google Sheets  
  - Role: Fetches employee records from a Google Sheet named "Employees"  
  - Configuration: Uses service account authentication pointing to a specific spreadsheet ID  
  - Key Variables: Reads all rows from "Employees" sheet including fields such as Name, Email, EmployeeId, BaseSalary, Allowances, Deductions  
  - Inputs: From "Monthly Payroll Trigger"  
  - Outputs: To "AI Calculate Salary"  
  - Edge Cases: Authentication failure, spreadsheet ID misconfiguration, or empty sheet could cause errors or empty outputs.

---

#### 1.2 AI Salary Calculation

**Overview:**  
Sends employee salary details to GPT-4 to calculate net salary including tax, insurance, and provident fund deductions, returning structured JSON.

**Nodes Involved:**  
- AI Calculate Salary

**Node Details:**

- **AI Calculate Salary**  
  - Type: HTTP Request  
  - Role: Calls OpenAI Chat Completion API with GPT-4 model  
  - Configuration: POST request to OpenAI's chat completions endpoint with JSON body containing system and user messages  
  - Key Expressions:  
    - Model: "gpt-4"  
    - Messages: Includes employee name, base salary, allowances, deductions dynamically injected via expressions like `{{$json.Name}}`  
  - Inputs: From "Get Employee Data"  
  - Outputs: To "Format Payslip Data"  
  - Version Specifics: Requires OpenAI API key set in HTTP request headers (not explicitly shown)  
  - Edge Cases: API rate limits, network timeouts, invalid model name or request structure, and failure to parse the JSON response.

---

#### 1.3 Payslip Data Formatting

**Overview:**  
Parses the AI response and combines it with employee data to prepare a structured data object for logging, PDF generation, and notifications.

**Nodes Involved:**  
- Format Payslip Data

**Node Details:**

- **Format Payslip Data**  
  - Type: Code (JavaScript)  
  - Role: Processes AI output JSON and employee input to create a normalized payslip object  
  - Configuration: Custom JS code parsing AI response and formatting fields such as netSalary, deductions, taxDeducted, employee details, current month, and payment date  
  - Key Expressions: Uses `$input` to access previous node output, `$now.format()` for date formatting  
  - Inputs: From "AI Calculate Salary"  
  - Outputs: To "Log to Payroll Sheet" and "Generate PDF Payslip"  
  - Edge Cases: Malformed AI response JSON, missing fields in employee data, date formatting errors.

---

#### 1.4 Payroll Logging & Document Generation

**Overview:**  
Logs the structured payroll data into a Google Sheet and generates a PDF payslip document using an external PDF generation API.

**Nodes Involved:**  
- Log to Payroll Sheet  
- Generate PDF Payslip

**Node Details:**

- **Log to Payroll Sheet**  
  - Type: Google Sheets  
  - Role: Appends payslip data to a "Payroll" sheet for record-keeping  
  - Configuration: Service account authentication; appends all fields automatically  
  - Inputs: From "Format Payslip Data"  
  - Outputs: To "Email Payslip to Employee" (parallel with Generate PDF Payslip)  
  - Edge Cases: Authentication errors, sheet permission issues, data mapping problems.

- **Generate PDF Payslip**  
  - Type: HTTP Request  
  - Role: Calls PDFMonkey API to generate a PDF payslip document based on a predefined template  
  - Configuration: POST request with JSON body containing template ID and payload filled with payslip details (e.g., name, employee ID, salary components)  
  - Inputs: From "Format Payslip Data"  
  - Outputs: To "Email Payslip to Employee"  
  - Edge Cases: API authentication failure, invalid template ID, network issues, payload formatting errors.

---

#### 1.5 Notification Distribution

**Overview:**  
Sends the generated payslip PDF via email to the employee and notifies HR via Slack about the completed payroll processing.

**Nodes Involved:**  
- Email Payslip to Employee  
- Notify HR on Slack

**Node Details:**

- **Email Payslip to Employee**  
  - Type: Email Send (SMTP)  
  - Role: Sends email with payslip attached to the employee's email address  
  - Configuration: SMTP credentials configured; dynamic subject including month; attachment named `payslip_{employeeId}_{month}.pdf`  
  - Inputs: From both "Log to Payroll Sheet" and "Generate PDF Payslip" (merged)  
  - Outputs: To "Notify HR on Slack"  
  - Edge Cases: SMTP authentication failure, invalid email addresses, missing attachment files.

- **Notify HR on Slack**  
  - Type: Slack  
  - Role: Posts a confirmation message in Slack channel/user informing payroll is processed  
  - Configuration: Uses Slack API credentials; message dynamically includes employee name, ID, month, net salary, and status  
  - Inputs: From "Email Payslip to Employee"  
  - Outputs: None (end node)  
  - Edge Cases: Slack API rate limits, invalid webhook or credentials, message formatting issues.

---

### 3. Summary Table

| Node Name              | Node Type              | Functional Role                          | Input Node(s)          | Output Node(s)                 | Sticky Note                                                                                         |
|------------------------|------------------------|----------------------------------------|------------------------|-------------------------------|---------------------------------------------------------------------------------------------------|
| Monthly Payroll Trigger | Schedule Trigger       | Starts workflow monthly on 28th        | None                   | Get Employee Data             | ## Runs monthly on 28th Automated payroll trigger                                                 |
| Get Employee Data      | Google Sheets           | Retrieves employee salary data          | Monthly Payroll Trigger | AI Calculate Salary           | ## Fetches employee data Retrieves salary info from sheet                                         |
| AI Calculate Salary    | HTTP Request            | Calls GPT-4 to compute net salary       | Get Employee Data       | Format Payslip Data           | ## AI calculates net salary Applies tax & deductions                                             |
| Format Payslip Data    | Code                    | Formats payslip and employee data       | AI Calculate Salary     | Log to Payroll Sheet, Generate PDF Payslip | ## Structures payslip data Prepares for distribution                          |
| Log to Payroll Sheet   | Google Sheets           | Logs payroll data in sheet               | Format Payslip Data     | Email Payslip to Employee     | ## Records & generates docs Logs payroll + creates PDF                                           |
| Generate PDF Payslip   | HTTP Request            | Generates PDF payslip document           | Format Payslip Data     | Email Payslip to Employee     | ## Records & generates docs Logs payroll + creates PDF                                           |
| Email Payslip to Employee | Email Send (SMTP)    | Sends payslip email to employee          | Log to Payroll Sheet, Generate PDF Payslip | Notify HR on Slack            | ## Multi-channel notification Employee email + HR Slack alert                                    |
| Notify HR on Slack     | Slack                   | Sends Slack notification to HR           | Email Payslip to Employee | None                         | ## Multi-channel notification Employee email + HR Slack alert                                    |
| Sticky Note            | Sticky Note             | Informational notes                      | None                   | None                         |                                                                                                   |
| Sticky Note1           | Sticky Note             | Informational notes                      | None                   | None                         |                                                                                                   |
| Sticky Note2           | Sticky Note             | Informational notes                      | None                   | None                         |                                                                                                   |
| Sticky Note3           | Sticky Note             | Informational notes                      | None                   | None                         |                                                                                                   |
| Sticky Note4           | Sticky Note             | Informational notes                      | None                   | None                         |                                                                                                   |
| Sticky Note5           | Sticky Note             | Informational notes                      | None                   | None                         |                                                                                                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger node**  
   - Name: Monthly Payroll Trigger  
   - Type: Schedule Trigger  
   - Set interval to trigger monthly on day 28  

2. **Create Google Sheets node**  
   - Name: Get Employee Data  
   - Operation: Read rows from sheet "Employees"  
   - Document ID: Set your employee spreadsheet ID  
   - Authentication: Use Service Account credentials  
   - Connect output of "Monthly Payroll Trigger" to this node's input  

3. **Create HTTP Request node**  
   - Name: AI Calculate Salary  
   - Method: POST  
   - URL: https://api.openai.com/v1/chat/completions  
   - Headers: Content-Type: application/json; Authorization: Bearer [YOUR_OPENAI_API_KEY]  
   - Body (JSON):  
     ```json
     {
       "model": "gpt-4",
       "messages": [
         {"role":"system","content":"Calculate net salary with deductions (tax, insurance, provident fund). Return JSON format."},
         {"role":"user","content":"Employee: {{$json.Name}}, Base Salary: {{$json.BaseSalary}}, Allowances: {{$json.Allowances}}, Deductions: {{$json.Deductions}}"}
       ]
     }
     ```  
   - Connect output of "Get Employee Data" to this node's input  

4. **Create Code (Function) node**  
   - Name: Format Payslip Data  
   - Paste the provided JavaScript:  
     ```javascript
     const response = JSON.parse($input.item.json.choices[0].message.content);
     const employee = $input.first().json;

     return {
       employeeName: employee.Name,
       employeeEmail: employee.Email,
       employeeId: employee.EmployeeId,
       baseSalary: employee.BaseSalary,
       allowances: employee.Allowances || 0,
       deductions: response.totalDeductions || 0,
       netSalary: response.netSalary,
       taxDeducted: response.tax || 0,
       month: $now.format('MMMM YYYY'),
       paymentDate: $now.format('YYYY-MM-DD')
     };
     ```  
   - Connect output of "AI Calculate Salary" to this node's input  

5. **Create Google Sheets node**  
   - Name: Log to Payroll Sheet  
   - Operation: Append row to sheet "Payroll"  
   - Document ID: Set your payroll spreadsheet ID  
   - Authentication: Use Service Account credentials  
   - Connect output of "Format Payslip Data" to this node's input  

6. **Create HTTP Request node**  
   - Name: Generate PDF Payslip  
   - Method: POST  
   - URL: https://api.pdfmonkey.io/api/v1/documents  
   - Headers: Content-Type: application/json; Authorization: Bearer [YOUR_PDFMONKEY_API_KEY]  
   - Body (JSON):  
     ```json
     {
       "document": {
         "template_id": "YOUR_TEMPLATE_ID",
         "payload": {
           "name": "{{$json.employeeName}}",
           "employee_id": "{{$json.employeeId}}",
           "month": "{{$json.month}}",
           "base_salary": {{$json.baseSalary}},
           "allowances": {{$json.allowances}},
           "deductions": {{$json.deductions}},
           "net_salary": {{$json.netSalary}}
         }
       }
     }
     ```  
   - Connect output of "Format Payslip Data" to this node's input  

7. **Connect outputs of both "Log to Payroll Sheet" and "Generate PDF Payslip" to the next node.**

8. **Create Email Send node**  
   - Name: Email Payslip to Employee  
   - Use SMTP credentials configured for your email server  
   - To: Set dynamically to `{{$json.employeeEmail}}`  
   - From: payroll@yourcompany.com  
   - Subject: "💰 Salary Credited - {{$json.month}}"  
   - Attachments: `payslip_{{$json.employeeId}}_{{$json.month}}.pdf` (ensure the PDF is correctly referenced)  
   - Connect inputs from both "Log to Payroll Sheet" and "Generate PDF Payslip" (merge)  

9. **Create Slack node**  
   - Name: Notify HR on Slack  
   - Configure Slack API credentials with appropriate permissions  
   - Message text:  
     ```
     ✅ *Payroll Processed*
     
     *Employee:* {{$json.employeeName}} ({{$json.employeeId}})
     *Month:* {{$json.month}}
     *Net Salary:* ₹{{$json.netSalary}}
     *Status:* Payment notification sent
     ```  
   - Connect output of "Email Payslip to Employee" to this node  

---

### 5. General Notes & Resources

| Note Content                                                                                                                    | Context or Link                                    |
|---------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------|
| Workflow runs monthly on the 28th day to automate payroll processing efficiently.                                               | Sticky Note on Monthly Payroll Trigger            |
| Employee data is sourced from a Google Sheet named "Employees" requiring correct permissions and data hygiene.                 | Sticky Note1                                       |
| GPT-4 is used to calculate net salary with deductions for tax, insurance, and provident fund, outputting structured JSON.     | Sticky Note2                                       |
| Payslip data is structured for logging and PDF generation to ensure consistency and accuracy.                                  | Sticky Note3                                       |
| Payroll data logged in "Payroll" Google Sheet and PDF payslip generated via PDFMonkey API.                                     | Sticky Note4                                       |
| Notifications are multi-channel: payslip emailed to employees and Slack alerts to HR ensure prompt communication.             | Sticky Note5                                       |
| For PDFMonkey, ensure you have created a template with ID `YOUR_TEMPLATE_ID` and have API access configured.                   | https://www.pdfmonkey.io                           |
| OpenAI API key must have GPT-4 access enabled for salary calculation calls.                                                     | https://platform.openai.com/docs/models/gpt-4     |
| SMTP credentials must support sending emails with attachments and be configured to allow sending from payroll@yourcompany.com. |                                                   |
| Slack API credentials require permission to post messages in the target HR channel or direct messages to HR users.             | https://api.slack.com/messaging/webhooks          |

---

**Disclaimer:** The text provided originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with applicable content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.