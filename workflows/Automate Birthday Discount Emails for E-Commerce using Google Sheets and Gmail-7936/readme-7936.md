Automate Birthday Discount Emails for E-Commerce using Google Sheets and Gmail

https://n8nworkflows.xyz/workflows/automate-birthday-discount-emails-for-e-commerce-using-google-sheets-and-gmail-7936


# Automate Birthday Discount Emails for E-Commerce using Google Sheets and Gmail

### 1. Workflow Overview

This workflow automates the process of sending personalized birthday discount emails to customers of an e-commerce business. It is designed to run daily, check customer birthdays from a Google Sheets spreadsheet, generate unique discount codes, and send customized emails through Gmail. The workflow is ideal for e-commerce owners or marketing teams seeking to increase customer retention and loyalty by automating timely birthday offers.

Logical blocks included:

- **1.1 Scheduled Trigger:** Initiates the workflow every day automatically.
- **1.2 Customer Data Retrieval:** Fetches all customer data from Google Sheets.
- **1.3 Birthday Check:** Filters customers whose birthday matches the current date.
- **1.4 Discount Code Generation:** Creates a unique discount code for each birthday customer.
- **1.5 Email Dispatch:** Sends a personalized birthday email containing the discount code via Gmail.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Trigger

**Overview:**  
Triggers the workflow execution once per day to ensure daily processing of customer birthdays.

**Nodes Involved:**  
- Daily Schedule

**Node Details:**

- **Daily Schedule**  
  - Type: Schedule Trigger  
  - Role: Initiates workflow daily at a preset time (default 9 AM)  
  - Configuration: Interval set to daily with no specific time override; runs once every day.  
  - Inputs: None (trigger node)  
  - Outputs: Triggers the "Get Customer Data" node  
  - Version: 1  
  - Potential Failures: None expected unless n8n scheduler is disabled or instance downtime occurs.

#### 1.2 Customer Data Retrieval

**Overview:**  
Retrieves the full list of customers and their data, including birthday information, from a Google Sheets spreadsheet.

**Nodes Involved:**  
- Get Customer Data

**Node Details:**

- **Get Customer Data**  
  - Type: Google Sheets  
  - Role: Reads entire customer data sheet  
  - Configuration:  
    - Operation: "getAll" — fetches all rows  
    - Document ID: Set dynamically or manually to the Google Sheets document containing customer data  
    - Requires Google Sheets OAuth2 credentials  
  - Inputs: Triggered by "Daily Schedule"  
  - Outputs: JSON array of customer records, each containing fields such as `name`, `birthday`, `email`, etc.  
  - Version: 3  
  - Potential Failures:  
    - Authentication errors due to invalid or expired credentials  
    - Access denied if spreadsheet permissions are insufficient  
    - Empty or malformed data if spreadsheet structure is incorrect  

#### 1.3 Birthday Check

**Overview:**  
Filters customer data to identify records where the birthday matches the current date (month and day).

**Nodes Involved:**  
- Is It Their Birthday?

**Node Details:**

- **Is It Their Birthday?**  
  - Type: If node (conditional check)  
  - Role: Compares each customer's birthday field (formatted as MM-dd) with the current date  
  - Configuration:  
    - Condition: Boolean equality between the customer's `birthday` field and current date formatted as `MM-dd` (using expression `={{ $now.toFormat('MM-dd') }}`)  
  - Inputs: Customer data records from "Get Customer Data"  
  - Outputs: Passes only matching birthday customers to the next node  
  - Version: 1  
  - Potential Failures:  
    - Expression evaluation errors if the birthday field is missing or misformatted  
    - Timezone discrepancies affecting `$now` value  

#### 1.4 Discount Code Generation

**Overview:**  
Generates a unique discount code for each customer whose birthday is today.

**Nodes Involved:**  
- Generate Discount Code

**Node Details:**

- **Generate Discount Code**  
  - Type: Function  
  - Role: Creates a unique discount code string (e.g., random alphanumeric)  
  - Configuration: Custom JavaScript code (not shown in JSON) that generates a code per customer  
  - Inputs: Filtered birthday customers from "Is It Their Birthday?" node  
  - Outputs: Adds a `discountCode` field to each customer JSON object  
  - Version: 1  
  - Potential Failures:  
    - Runtime errors if the function code has bugs  
    - Duplicate codes if logic does not ensure uniqueness  
  - Notes: This node only generates codes locally; integration with an e-commerce coupon system is not included.

#### 1.5 Email Dispatch

**Overview:**  
Sends a personalized birthday email containing the unique discount code to each filtered customer.

**Nodes Involved:**  
- Send Birthday Email

**Node Details:**

- **Send Birthday Email**  
  - Type: Gmail node  
  - Role: Sends email via Gmail account using OAuth2 credentials  
  - Configuration:  
    - Subject: "Happy Birthday! Here's a gift from us!"  
    - Message Body: Personalized email including customer name and discount code via expressions such as `{{ $json.name }}` and `{{ $json.discountCode }}`  
  - Credentials: Gmail OAuth2 credentials required  
  - Inputs: Customer with discount code from "Generate Discount Code"  
  - Outputs: None (terminal node)  
  - Version: 1  
  - Potential Failures:  
    - Authentication errors if Gmail credentials expire or are invalid  
    - Email sending limits or quota exceeded on Gmail account  
    - Invalid email addresses causing delivery failures  

---

### 3. Summary Table

| Node Name           | Node Type           | Functional Role                      | Input Node(s)       | Output Node(s)          | Sticky Note                                                                                                                                                                                                                                             |
|---------------------|---------------------|------------------------------------|---------------------|-------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Daily Schedule      | Schedule Trigger    | Initiates workflow daily            | None                | Get Customer Data       | ## Flow                                                                                                                                                                                                                                                |
| Get Customer Data   | Google Sheets       | Fetches all customer records        | Daily Schedule      | Is It Their Birthday?   |                                                                                                                                                                                                                                                         |
| Is It Their Birthday? | If                 | Filters customers by birthday match | Get Customer Data   | Generate Discount Code  |                                                                                                                                                                                                                                                         |
| Generate Discount Code | Function            | Generates unique discount codes     | Is It Their Birthday? | Send Birthday Email     |                                                                                                                                                                                                                                                         |
| Send Birthday Email | Gmail               | Sends personalized birthday email   | Generate Discount Code | None                   |                                                                                                                                                                                                                                                         |
| Sticky Note        | Sticky Note          | Workflow overview and instructions  | None                | None                    | # ⚙ Workflow Note: Automated Birthday Discount for E-Commerce\n---\n\n## **Problem**\nMany e-commerce businesses miss the opportunity to create a personal connection with their customers. Sending a special birthday offer is a powerful way to build loyalty and increase sales, but doing this manually for every customer is time-consuming and prone to human error. Without an automated system, these valuable marketing moments are often overlooked.\n\n## **Solution**\nThis simple but effective n8n workflow solves this problem by automating the entire birthday outreach process. The system runs daily, checks your customer database for birthdays, generates a unique discount code, and sends a personalized email to the customer on their special day. This ensures a timely, thoughtful gesture without any manual effort.\n\n## **For Whom**\nThis workflow is perfect for **e-commerce store owners, small businesses, and marketing teams** who want to increase customer retention and sales through personalized marketing. It is especially valuable for those who have a growing customer list and need to scale their customer engagement efforts efficiently.\n\n## **Scope**\n* **What it includes:**\n    * A daily scheduled check to scan your customer list.\n    * Automated lookup of customers celebrating their birthday on the current day.\n    * Automatic generation of a unique, single-use discount code.\n    * Personalized email delivery of the birthday message and discount code.\n\n* **What it excludes:**\n    * Integration with your e-commerce platform's coupon system (the code generation is a placeholder and would require manual creation in your platform's backend).\n    * Advanced segmentation (e.g., sending different offers to different customer tiers).\n    * Follow-up emails or drip campaigns.\n\n## ⚙ **How to Set Up**\n\n1.  **Prerequisites:** You will need an n8n instance, a **Google Sheets** spreadsheet with customer data (including a 'birthday' column in 'MM-dd' format), and a **Gmail** account.\n2.  **Workflow Import:** Import the provided JSON file into your n8n instance.\n3.  **Credential Configuration:**\n    * Set up credentials for **Google Sheets** and **Gmail** within n8n.\n4.  **Node-Specific Configuration:**\n    * **`Daily Schedule`:** No changes needed. It is pre-configured to run every day at 9 AM.\n    * **`Get Customer Data`:** Input the **Spreadsheet ID** and **Sheet Name** of your customer database.\n    * **`Is It Their Birthday?`:** Ensure the value in `value1` `={{ $json.birthday }}` matches the name of your birthday column in Google Sheets.\n    * **`Send Birthday Email`:** Customize the **`fromEmail`** and the body of the email to match your brand's voice.\n5.  **Activation:** After all configurations are complete, click **\"Save\"** and then **\"Active\"**. The workflow will now run every day to delight your customers. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow in n8n.**

2. **Add a "Schedule Trigger" node:**
   - Name: `Daily Schedule`
   - Type: Schedule Trigger
   - Configuration: Set to trigger daily (default at 9 AM)
   - No credentials needed.
   - This node starts the workflow.

3. **Add a "Google Sheets" node:**
   - Name: `Get Customer Data`
   - Type: Google Sheets
   - Operation: `getAll`
   - Set `Document ID` to your Google Sheets spreadsheet containing the customer list.
   - Configure credentials: Set up and select Google Sheets OAuth2 credentials authorized to read the sheet.
   - Connect the output of `Daily Schedule` to this node's input.

4. **Add an "If" node:**
   - Name: `Is It Their Birthday?`
   - Type: If
   - Condition Type: Boolean
   - Expression for Condition:  
     - `value1`: `={{ $json.birthday }}` — the birthday field in your sheet (make sure your Google Sheet column matches this key exactly)  
     - `value2`: `={{ $now.toFormat('MM-dd') }}` — current date formatted as month-day  
   - Connect output of `Get Customer Data` to this node's input.

5. **Add a "Function" node:**
   - Name: `Generate Discount Code`
   - Type: Function
   - Code example (sample placeholder):  
     ```javascript
     // Generate a random alphanumeric discount code of length 8
     const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
     let code = '';
     for (let i = 0; i < 8; i++) {
       code += chars.charAt(Math.floor(Math.random() * chars.length));
     }
     $json.discountCode = code;
     return $json;
     ```
   - Connect the `true` output of `Is It Their Birthday?` node to this node.

6. **Add a "Gmail" node:**
   - Name: `Send Birthday Email`
   - Type: Gmail
   - Configure Gmail OAuth2 credentials authorized to send emails.
   - Parameters:  
     - Subject: `Happy Birthday! Here's a gift from us!`  
     - Message:  
       ```
       Hi {{ $json.name }},

       Happy Birthday! We wanted to celebrate you with a special gift.

       Here is your unique discount code for 20% off your next order:

       {{ $json.discountCode }}

       Enjoy your day!

       Best regards,
       Your E-commerce Team
       ```
   - Connect output of `Generate Discount Code` node here.

7. **Activate the workflow:**
   - Save and activate the workflow.
   - The workflow will now run daily and send birthday discount emails automatically.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                            | Context or Link                                           |
|---------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------|
| The discount code generation node creates placeholder codes; integration with e-commerce backend coupon systems is required for real discounts.          | Workflow scope notes                                      |
| Ensure the 'birthday' column in Google Sheets is formatted as `MM-dd` (e.g., 06-15 for June 15th) to match workflow date comparison.                     | Setup instructions                                        |
| Gmail accounts have sending limits; for large customer lists, consider using a dedicated transactional email service integrated via n8n.                 | Email sending best practices                              |
| Workflow includes detailed instructions and setup notes within sticky notes inside the n8n editor for user guidance.                                     | In-workflow sticky notes                                  |
| For enhanced personalization or segmentation, this workflow can be expanded with additional filters or multiple email templates.                         | Potential workflow extensions                             |

---

**Disclaimer:** The text provided is exclusively derived from an n8n automated workflow designed for lawful, public customer engagement. It complies fully with content policies and contains no illegal or offensive elements. All data processed is legal and public.