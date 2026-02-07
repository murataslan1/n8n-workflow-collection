Automate Meeting Minutes Distribution with Google Sheets and Gmail

https://n8nworkflows.xyz/workflows/automate-meeting-minutes-distribution-with-google-sheets-and-gmail-7429


# Automate Meeting Minutes Distribution with Google Sheets and Gmail

### 1. Workflow Overview

This workflow automates the process of distributing meeting minutes by reading structured data from a Google Sheet and sending a formatted summary email via Gmail. It is designed for users who document meeting minutes in a Google Sheet and want to streamline email distribution without manual copy-pasting.

The workflow consists of two main logical blocks:

- **1.1 Workflow Trigger and Data Gathering**: Starts the workflow manually and retrieves meeting minutes data from a designated Google Sheet tab.
- **1.2 Email Generation and Dispatch**: Processes the retrieved data into an HTML email format and sends it to the intended recipients using Gmail.

---

### 2. Block-by-Block Analysis

#### 2.1 Workflow Trigger and Data Gathering

- **Overview:**  
  This block initiates the workflow manually and reads the meeting minutes data from a specified Google Sheet. It ensures the data is well-structured and ready for email formatting.

- **Nodes Involved:**  
  - Trigger (Manual Trigger)  
  - Get the data (Google Sheets)

- **Node Details:**

  - **Trigger**  
    - *Type and Role:* Manual Trigger node; initiates workflow execution on demand.  
    - *Configuration:* No parameters; user manually starts workflow when meeting minutes are finalized.  
    - *Connections:* Output to "Get the data" node.  
    - *Failure/Edge Cases:* None specifically; user-dependent activation.  
    - *Version:* Standard, no special version required.

  - **Get the data**  
    - *Type and Role:* Google Sheets node; reads data from a spreadsheet.  
    - *Configuration:*  
      - Spreadsheet selected by URL.  
      - Sheet/tab name selected by ID.  
      - "Use first row as header" enabled (implied from sticky notes).  
    - *Key Expressions:* Reads columns "Topic", "Status", "Owner", "Next Step" exactly matching header names.  
    - *Connections:* Input from Trigger; output to "Generate the email".  
    - *Failure/Edge Cases:*  
      - Authentication errors if Google credentials are invalid.  
      - Incorrect sheet/tab selection or missing columns causes empty or malformed data.  
      - Case sensitivity and exact matching of column headers critical; mismatches lead to missing data fields.  
    - *Version Specifics:* Node version 4.6 used here, must support reading sheets with header row option.

#### 2.2 Email Generation and Dispatch

- **Overview:**  
  This block formats the retrieved data into an HTML email summarizing the meeting minutes and sends it via Gmail to the appropriate recipients.

- **Nodes Involved:**  
  - Generate the email (Code node)  
  - Email with meeting minutes (Gmail node)

- **Node Details:**

  - **Generate the email**  
    - *Type and Role:* Code (Function) node; transforms raw row data into formatted HTML and prepares email content.  
    - *Configuration:*  
      - JavaScript snippet loops over input rows, building an HTML table with columns Topic, Status, Owner, Next Step.  
      - The email body includes a styled HTML table and greeting/farewell text.  
      - Outputs a single JSON object containing the HTML under `html` key.  
    - *Key Expressions:* Accesses each row’s `.json` properties for required fields.  
    - *Connections:* Input from Google Sheets node; output to Gmail node.  
    - *Failure/Edge Cases:*  
      - Missing or malformed data fields result in empty table cells but do not crash the code.  
      - Unexpected input structure could cause runtime errors in JavaScript.  
    - *Version Requirements:* Node version 2 used; ensure compatibility with JavaScript ES6+.  

  - **Email with meeting minutes**  
    - *Type and Role:* Gmail node; sends an email with the generated HTML content.  
    - *Configuration:*  
      - Recipient email address taken dynamically from input (field `email`).  
      - Subject line set as "Meeting notes today's meeting".  
      - Message body set as the generated HTML from previous node.  
      - Uses Gmail OAuth2 credentials for authentication.  
    - *Key Expressions:*  
      - Sends to `email` field from input JSON.  
      - Message content directly from `$json.html`.  
    - *Connections:* Input from Generate the email node.  
    - *Failure/Edge Cases:*  
      - Authentication failures if Gmail OAuth credentials are invalid or expired.  
      - Missing or invalid recipient email addresses cause send errors.  
      - Gmail API quota limits or network issues may delay or fail sending.  
    - *Version:* Updated 2.1 version, supports OAuth2 and HTML message sending.

---

### 3. Summary Table

| Node Name                | Node Type          | Functional Role                            | Input Node(s)      | Output Node(s)           | Sticky Note                                                                                                                  |
|--------------------------|--------------------|-------------------------------------------|--------------------|--------------------------|------------------------------------------------------------------------------------------------------------------------------|
| Sticky Note1             | Sticky Note        | Requirements reminder                      |                    |                          | ## Required\n\n- Google account Gmail\n- Google Sheet                                                                       |
| Sticky Note              | Sticky Note        | Explains workflow trigger and data gathering block |                    |                          | ## 1.Workflow trigger et data gathering\n\nTrigger: Manual Trigger : run the workflow after you finish writing the meeting minutes and you’re ready to send them.\n\nNodes involved:\n\n- Manual Trigger → starts the workflow\n\n- Google Sheets (Read) → pulls the minutes from your sheet\n\nGoogle Sheet requirements:\n\n- Required columns: Topic, Status, Owner, Next Step\n\nSetup:\n\n- Select the Spreadsheet and Tab (e.g., Meeting Minutes).\n\n- Enable Use first row as header.\n\n- Ensure column names match exactly (spelling/case).\n\nTip:\n- If you later want automation, replace Manual Trigger with a Schedule (daily/weekly). |
| Sticky Note3             | Sticky Note        | Explains email sending block              |                    |                          | ## 2. Send the email\n\nPurpose: Build the meeting-minutes message from your sheet data and send it to the right recipients.\n\nNodes involved:\n\n- Code (Function) → formats content (HTML) and subject line\n\n- Gmail → sends the email\n\nSetup (Code node)\n- Use this snippet to generate a subject, HTML body, and recipients from your sheet rows/columns:\n\n- Setup (Gmail node)\n\n- Credentials: select your Gmail OAuth credential\n\n\nValidation\n- Send a test email to yourself first\n- Check that all required columns (Topic, Status, Owner, Next Step) appear and render correctly\n\n\n |
| Trigger                  | Manual Trigger     | Initiates workflow manually                |                    | Get the data             |                                                                                                                              |
| Get the data             | Google Sheets      | Reads meeting minutes from Google Sheet   | Trigger            | Generate the email       |                                                                                                                              |
| Generate the email       | Code (Function)    | Formats meeting minutes as an HTML email  | Get the data       | Email with meeting minutes |                                                                                                                              |
| Email with meeting minutes | Gmail             | Sends the formatted email via Gmail       | Generate the email |                          |                                                                                                                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Trigger node:**  
   - Add a **Manual Trigger** node.  
   - No configuration required. This node starts the workflow when manually activated.

2. **Add Google Sheets node ("Get the data"):**  
   - Node type: Google Sheets.  
   - Credentials: Configure with a valid Google OAuth credential linked to the Google account.  
   - Set "Resource" to "Spreadsheet".  
   - Set "Operation" to "Read Rows".  
   - Set the **Spreadsheet URL** of your meeting minutes Google Sheet.  
   - Set the **Sheet Name** or ID of the worksheet/tab containing meeting minutes (e.g., "Meeting Minutes").  
   - Enable "Use first row as header" to map columns by header name.  
   - Ensure your sheet contains columns exactly named: `Topic`, `Status`, `Owner`, `Next Step`.  
   - Connect the output of the Manual Trigger node to this node.

3. **Add Code node ("Generate the email"):**  
   - Node type: Code (Function).  
   - Paste the following JavaScript code (already prepared):  
     ```javascript
     const allItems = $input.all();
     
     let tableRows = '';
     allItems.forEach(item => {
       tableRows += `
       <tr>
         <td>${item.json.Topic || ''}</td>
         <td>${item.json.Status || ''}</td>
         <td>${item.json.Owner || ''}</td>
         <td>${item.json["Next Step"] || ''}</td>
       </tr>`;
     });
     
     const html = `
     <!DOCTYPE html>
     <html>
     <head>
       <style>
         table {
           border-collapse: collapse;
           width: 100%;
           margin: 20px 0;
           font-family: Arial, sans-serif;
         }
         th, td {
           border: 1px solid #dddddd;
           text-align: left;
           padding: 8px;
         }
         th {
           background-color: #f2f2f2;
           font-weight: bold;
         }
       </style>
     </head>
     <body>
       <p>Hello,</p>
       <p>Here are the elements of the meeting:</p>
       
       <table>
         <thead>
           <tr>
             <th>Topic</th>
             <th>Status</th>
             <th>Owner</th>
             <th>Next Step</th>
           </tr>
         </thead>
         <tbody>
           ${tableRows}
         </tbody>
       </table>
       
       <p>Have a good day.<br/>PM Team</p>
     </body>
     </html>`;
     
     return [{ json: { html } }];
     ```  
   - Connect output from Google Sheets node to this node.

4. **Add Gmail node ("Email with meeting minutes"):**  
   - Node type: Gmail.  
   - Credentials: Select your Gmail OAuth2 credential for sending emails.  
   - Set "Operation" to "Send Email".  
   - Set "To" field to an email address or use expression to map the recipient dynamically if available (in the current workflow, it is set to a static field `"email"` which should be adjusted accordingly).  
   - Set "Subject" to e.g., `"Meeting notes today's meeting"`.  
   - Set "Message" type to HTML and set content to the expression `{{$json["html"]}}` to use the HTML generated by the previous node.  
   - Connect output from the Code node to this node.

5. **Connections Order:**  
   - Manual Trigger → Google Sheets (Get the data) → Code (Generate the email) → Gmail (Email with meeting minutes).

6. **Final Notes:**  
   - Test by running the Manual Trigger after ensuring your Google Sheet is populated with meeting minutes data.  
   - Verify the email is formatted correctly and received as expected.  
   - For scheduling, replace the Manual Trigger with a Schedule Trigger node (e.g., daily or weekly) if desired.  
   - Ensure Google and Gmail OAuth credentials have appropriate scopes for reading sheets and sending emails.

---

### 5. General Notes & Resources

| Note Content                                                                                           | Context or Link                                                                                  |
|------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Required: Google account with Gmail and Google Sheet access.                                          | Sticky Note1                                                                                   |
| Workflow Trigger: Manual trigger to run after meeting minutes are finalized; can replace with Schedule for automation. | Sticky Note                                                                                     |
| Google Sheet Setup: Columns must be named exactly "Topic", "Status", "Owner", "Next Step" with first row as header. | Sticky Note                                                                                     |
| Email Generation: Code node builds an HTML table from sheet rows, ensuring readable formatting in emails. | Sticky Note3                                                                                   |
| Gmail Node: Use Gmail OAuth credentials; send test email first to verify.                             | Sticky Note3                                                                                   |

---

**Disclaimer:**  
The provided text is extracted exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with the current content policies and contains no illegal, offensive, or protected elements. All manipulated data is legal and public.