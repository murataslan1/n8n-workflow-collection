Automate Employee Recognition with Slack, Sheets, Gmail & Optional GPT-4

https://n8nworkflows.xyz/workflows/automate-employee-recognition-with-slack--sheets--gmail---optional-gpt-4-10222


# Automate Employee Recognition with Slack, Sheets, Gmail & Optional GPT-4

---
### 1. Workflow Overview

**Purpose:**  
This workflow automates employee recognition by integrating Google Sheets, Slack, Gmail, and optionally OpenAI GPT-4. It addresses the problem of inconsistent manual recognition processes by automatically announcing achievements, sending thank-you emails, updating records, and notifying HR of any issues.

**Target Use Cases:**  
- HR teams, managers, or founders seeking to automate and standardize employee recognition  
- Organizations wanting to boost morale and culture with zero manual effort  
- Teams that maintain employee recognition data in Google Sheets and communicate via Slack and Gmail  

**Logical Blocks:**  
- **1.1 Trigger & Input Reception:** Watches a Google Sheet for new rows indicating employee recognition entries.  
- **1.2 Data Formatting:** Extracts and formats employee recognition data from the sheet row.  
- **1.3 AI Message Generation (Optional):** Uses OpenAI GPT-4 to create a personalized recognition message.  
- **1.4 Slack Announcement:** Posts the recognition message to a Slack channel.  
- **1.5 Google Sheets Update (Status):** Marks the recognition as announced in the Google Sheet.  
- **1.6 Thank-You Email:** Sends a personalized thank-you email to the recognized employee.  
- **1.7 Slack Notification to HR:** Notifies HR privately that the recognition process completed.  
- **1.8 Email Success Verification & Logging:** Checks if the thank-you email was sent successfully, updates the sheet accordingly, and alerts HR if the email failed.  
- **1.9 Notes & Documentation:** Embedded sticky notes explain workflow context and section titles.

---

### 2. Block-by-Block Analysis

#### 1.1 Trigger & Input Reception

- **Overview:**  
  This block triggers the workflow whenever a new row is added to a specific Google Sheet. It listens for new employee recognition entries.

- **Nodes Involved:**  
  - New Row Added  
  - Sticky Note2 (Trigger label)

- **Node Details:**  

  - **New Row Added**  
    - Type: Google Sheets Trigger  
    - Role: Monitors a Google Sheet for new rows in a specified range (columns A to D) every minute.  
    - Configuration:  
      - Event: `rowAdded`  
      - Sheet range: `A:D`  
      - Document and Sheet IDs are parameterized placeholders requiring real IDs.  
    - Inputs: None (trigger)  
    - Outputs: Emits new row data JSON when a row is added  
    - Edge cases:  
      - Google Sheets API auth failure  
      - Trigger delay due to polling (max 1 minute delay)  
      - Missing or malformed data in newly added rows  

  - **Sticky Note1**  
    - Provides a heading and context label "## Trigger" placed near `New Row Added`.

---

#### 1.2 Data Formatting

- **Overview:**  
  Extracts relevant fields from the new row and formats a base recognition message for downstream use.

- **Nodes Involved:**  
  - Format Employee Data  
  - Sticky Note2 (Message Generator label)

- **Node Details:**  

  - **Format Employee Data**  
    - Type: Code Node (JavaScript)  
    - Role: Maps incoming Google Sheets row JSON to a simplified object containing employee `name`, `dept` (department), `reason`, `date`, and a constructed `message`.  
    - Configuration:  
      - Uses JavaScript `.map()` to structure each item as:  
        ```js
        {
          name: item.json["Name"],
          dept: item.json["Department"],
          reason: item.json["Reason"],
          date: item.json["Date"],
          message: `${name} from ${dept} has been recognized for ${reason}! 🎉`
        }
        ```  
      - This provides a fallback message if AI is not used or for display.  
    - Inputs: Output from Google Sheets Trigger  
    - Outputs: Reformatted JSON objects with key fields  
    - Edge cases:  
      - Missing expected columns in sheet data  
      - Empty or null fields causing malformed messages  

---

#### 1.3 AI Message Generation (Optional)

- **Overview:**  
  Invokes OpenAI GPT-4 via Langchain nodes to generate a personalized, friendly recognition message.

- **Nodes Involved:**  
  - OpenAI Chat Model  
  - Generate Personalized Message  
  - Sticky Note2 (Message Generator label)

- **Node Details:**  

  - **OpenAI Chat Model**  
    - Type: Langchain OpenAI Chat Model  
    - Role: Provides the GPT-4.1-mini model connection for natural language processing.  
    - Configuration:  
      - Model: `gpt-4.1-mini` (GPT-4 variant)  
      - No additional options specified  
    - Credentials: Requires OpenAI API key  
    - Inputs: None directly; used as a resource for the Agent node  
    - Outputs: Model interface for downstream agent  

  - **Generate Personalized Message**  
    - Type: Langchain Agent  
    - Role: Uses the OpenAI Chat Model to write a short, genuine recognition message under 2 sentences.  
    - Configuration:  
      - System message template:  
        ```
        Write a short, friendly recognition message for {name} from the {dept} department who was recognized for {reason}. 
        Make it sound genuine and positive, under 2 sentences.
        ```  
      - Uses expressions to inject `name`, `dept`, and `reason` from incoming JSON.  
    - Inputs: Reformatted data from `Format Employee Data`  
    - Outputs: AI-generated personalized message JSON  
    - Edge cases:  
      - OpenAI API rate limits or downtime  
      - Failed or malformed AI responses  
      - Missing input variables causing prompt errors  

---

#### 1.4 Slack Announcement

- **Overview:**  
  Posts the recognition message to a designated Slack channel (#general).

- **Nodes Involved:**  
  - Post Message to #general  
  - Sticky Note3 (Notify label)

- **Node Details:**  

  - **Post Message to #general**  
    - Type: Slack node (message post)  
    - Role: Sends a formatted message to a Slack channel announcing the employee recognition.  
    - Configuration:  
      - Message text uses expressions to insert name, department, reason:  
        ```
        🎉 Employee Spotlight 🎉  
        {{ $json.name }} from {{ $json.dept }} has been recognized for {{ $json.reason }}!  
        Great work! 👏
        ```  
      - Target channel ID is parameterized (`YOUR_CHANNEL_ID`)  
    - Credentials: Slack API OAuth token required  
    - Inputs: AI-generated or formatted message JSON  
    - Outputs: Slack message response data  
    - Edge cases:  
      - Slack API auth failure  
      - Invalid channel ID or permissions  
      - Slack rate limits  

---

#### 1.5 Google Sheets Update (Status)

- **Overview:**  
  Updates the original Google Sheet row to mark the recognition as "Announced" or update status fields.

- **Nodes Involved:**  
  - Update Row (Status)  

- **Node Details:**  

  - **Update Row (Status)**  
    - Type: Google Sheets (Update)  
    - Role: Updates specific columns in the recognition sheet (e.g., Status column) to reflect the announcement completion.  
    - Configuration:  
      - Operation: Update  
      - Requires sheet and document IDs (placeholders `SHEET_ID` and `DOC_ID`)  
      - Mapping mode: Defines columns below or by index (not fully detailed)  
    - Credentials: Google Sheets OAuth2  
    - Inputs: Output from Slack post node  
    - Outputs: Updated sheet confirmation JSON  
    - Edge cases:  
      - Google Sheets API errors or permission issues  
      - Row matching failure if row index or ID is missing  

---

#### 1.6 Thank-You Email

- **Overview:**  
  Sends a personalized thank-you email to the recognized employee using Gmail.

- **Nodes Involved:**  
  - Send Thank You Email  

- **Node Details:**  

  - **Send Thank You Email**  
    - Type: Gmail node (send email)  
    - Role: Sends a thank-you email to recognized employee’s email address.  
    - Configuration:  
      - Recipient email: `{{ $json.email }}` (from sheet data)  
      - Subject: `"Thank you for your amazing work, {{ $json.name }}!"`  
      - Message body template:  
        ```
        Hi {{ $json.name }},
        
        Congratulations on being recognized for your excellent work in {{ $json.dept }}! 
        We truly appreciate your contribution and dedication.
        
        Keep shining,
        HR Team 🌟
        ```  
    - Credentials: Gmail OAuth2 required  
    - Inputs: Updated sheet data or formatted data  
    - Outputs: Gmail send status response  
    - Edge cases:  
      - Gmail API quota or auth errors  
      - Missing or invalid email addresses  
      - Email formatting errors  

---

#### 1.7 Slack Notification to HR

- **Overview:**  
  Privately notifies the HR team in Slack that the recognition announcement and email have completed successfully.

- **Nodes Involved:**  
  - Notify HR privately  

- **Node Details:**  

  - **Notify HR privately**  
    - Type: Slack node (message post)  
    - Role: Sends a confirmation message to an HR Slack channel once recognition steps complete.  
    - Configuration:  
      - Message:  
        ```
        ✅ Recognition completed for {{ $json.name }}  
        Posted to #general and sent thank-you email.
        ```  
      - Channel ID parameterized (`CHANNEL_ID`)  
    - Credentials: Slack API OAuth token  
    - Inputs: Output from email node  
    - Outputs: Slack message confirmation  
    - Edge cases:  
      - Slack auth or permission errors  
      - Invalid channel ID  

---

#### 1.8 Email Success Verification & Logging

- **Overview:**  
  Checks the Gmail node response to confirm the email was sent successfully. Updates sheet with email status and alerts HR if sending failed.

- **Nodes Involved:**  
  - Check if Email Sent Successfully  
  - Update Row (Email Status)  
  - Alert HR if Email Fails  
  - Sticky Note4 (Logging)

- **Node Details:**  

  - **Check if Email Sent Successfully**  
    - Type: If node  
    - Role: Evaluates if `gmail.status` equals "success" (case insensitive).  
    - Configuration:  
      - Condition: `{{$json.gmail.status.toLowerCase()}} === "success"`  
    - Inputs: Output from Slack notification node  
    - Outputs: Two branches: success and failure  

  - **Update Row (Email Status)**  
    - Type: Google Sheets Update  
    - Role: Marks the EmailStatus column in the sheet as sent/failed accordingly.  
    - Configuration:  
      - Operation: Update  
      - SheetName and DocumentId must be set (currently placeholders/empty)  
    - Credentials: Google Sheets OAuth2  
    - Inputs: From If node success branch  

  - **Alert HR if Email Fails**  
    - Type: Slack message post  
    - Role: Alerts HR in Slack if email failed to send.  
    - Configuration:  
      - Message:  
        ```
        ⚠️ Failed to send email to {{ $json.name }}. 
        Please check Gmail node or update manually.
        ```  
      - Channel ID parameterized (`CHANNEL_ID`)  
    - Credentials: Slack API OAuth  
    - Inputs: From If node failure branch  

  - **Sticky Note4**  
    - Label: "## Logging" near these nodes, indicating this block’s logging and error handling role.

---

#### 1.9 Notes & Documentation

- **Overview:**  
  Contains detailed documentation and explanation of the workflow, setup instructions, and problem statement.

- **Nodes Involved:**  
  - Sticky Note (Main overview note)  

- **Node Details:**  

  - **Sticky Note**  
    - Type: Sticky Note  
    - Content:  
      - Problem description: manual recognition inconsistency  
      - Solution overview: automates recognition flow from Sheets to Slack and Gmail  
      - Features list and setup instructions  
    - Positioned centrally for visibility  

---

### 3. Summary Table

| Node Name                  | Node Type                        | Functional Role                        | Input Node(s)             | Output Node(s)              | Sticky Note                                         |
|----------------------------|---------------------------------|-------------------------------------|---------------------------|-----------------------------|----------------------------------------------------|
| New Row Added              | Google Sheets Trigger            | Trigger on new recognition row      | -                         | Format Employee Data         | ## Trigger                                         |
| Format Employee Data       | Code                            | Format raw sheet data to structured | New Row Added             | Generate Personalized Message| ## Message Generator                               |
| OpenAI Chat Model          | Langchain OpenAI Chat Model     | GPT-4 model interface                | -                         | Generate Personalized Message|                                                    |
| Generate Personalized Message | Langchain Agent               | Create personalized recognition msg | Format Employee Data, OpenAI Chat Model | Post Message to #general      | ## Message Generator                               |
| Post Message to #general   | Slack                           | Post announcement to Slack channel  | Generate Personalized Message | Update Row (Status)          | ## Notify                                           |
| Update Row (Status)        | Google Sheets Update            | Mark recognition as announced       | Post Message to #general   | Send Thank You Email         |                                                    |
| Send Thank You Email       | Gmail                           | Send thank-you email to employee    | Update Row (Status)        | Notify HR privately          |                                                    |
| Notify HR privately        | Slack                           | Notify HR channel of completion     | Send Thank You Email       | Check if Email Sent Successfully | ## Notify                                        |
| Check if Email Sent Successfully | If                       | Branch on email send success/failure | Notify HR privately        | Update Row (Email Status), Alert HR if Email Fails | ## Logging                              |
| Update Row (Email Status)  | Google Sheets Update            | Update email status in sheet        | Check if Email Sent Successfully (success) | -                           | ## Logging                                         |
| Alert HR if Email Fails    | Slack                           | Alert HR Slack channel on email fail| Check if Email Sent Successfully (fail) | -                           | ## Logging                                         |
| Sticky Note                | Sticky Note                    | Documentation and overview          | -                         | -                           | Detailed workflow explanation and setup instructions|
| Sticky Note1               | Sticky Note                    | Label for Trigger block             | -                         | -                           | ## Trigger                                         |
| Sticky Note2               | Sticky Note                    | Label for Message Generator block   | -                         | -                           | ## Message Generator                               |
| Sticky Note3               | Sticky Note                    | Label for Notify block              | -                         | -                           | ## Notify                                           |
| Sticky Note4               | Sticky Note                    | Label for Logging block             | -                         | -                           | ## Logging                                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Google Sheet**  
   - Setup columns: `Name | Department | Reason | Date | Email | Status | EmailStatus`  
   - Share and obtain Document ID and Sheet ID.

2. **Create Trigger Node**  
   - Add **Google Sheets Trigger** node named `New Row Added`.  
   - Event: `rowAdded`  
   - Range: `A:D` (or as per your sheet layout)  
   - Enter the Google Sheet Document ID and Sheet ID.  
   - Connect OAuth2 Google Sheets credentials.  
   - Set poll interval to every minute.  

3. **Add Code Node for Formatting**  
   - Add **Code** node named `Format Employee Data`.  
   - JavaScript:  
     ```js
     return items.map(item => ({
       json: {
         name: item.json["Name"],
         dept: item.json["Department"],
         reason: item.json["Reason"],
         date: item.json["Date"],
         message: `${item.json["Name"]} from ${item.json["Department"]} has been recognized for ${item.json["Reason"]}! 🎉`
       }
     }));
     ```  
   - Connect input from `New Row Added`.

4. **Add OpenAI Chat Model (Optional)**  
   - Add **Langchain OpenAI Chat Model** node named `OpenAI Chat Model`.  
   - Select model: `gpt-4.1-mini`.  
   - Connect OpenAI API credentials.

5. **Add Langchain Agent Node**  
   - Add **Langchain Agent** node named `Generate Personalized Message`.  
   - System message:  
     ```
     Write a short, friendly recognition message for {name} from the {dept} department who was recognized for {reason}. 
     Make it sound genuine and positive, under 2 sentences.
     ```  
   - Use expressions to pass `name`, `dept`, and `reason` from previous node.  
   - Connect input from `Format Employee Data` and link to `OpenAI Chat Model` as model source.

6. **Add Slack Node to Post Message**  
   - Add **Slack** node named `Post Message to #general`.  
   - Message text:  
     ```
     🎉 Employee Spotlight 🎉  
     {{ $json.name }} from {{ $json.dept }} has been recognized for {{ $json.reason }}!  
     Great work! 👏
     ```  
   - Choose channel by ID (`YOUR_CHANNEL_ID`).  
   - Connect Slack API credentials.  
   - Connect input from `Generate Personalized Message`.

7. **Add Google Sheets Update Node (Status)**  
   - Add **Google Sheets** node named `Update Row (Status)`.  
   - Operation: `update`  
   - Specify Document ID and Sheet Name.  
   - Map the `Status` column to mark recognition as announced (e.g., "Announced").  
   - Connect input from `Post Message to #general`.

8. **Add Gmail Node to Send Thank You Email**  
   - Add **Gmail** node named `Send Thank You Email`.  
   - Recipient: `={{ $json.email }}`  
   - Subject: `Thank you for your amazing work, {{ $json.name }}!`  
   - Message body:  
     ```
     Hi {{ $json.name }},
     
     Congratulations on being recognized for your excellent work in {{ $json.dept }}! 
     We truly appreciate your contribution and dedication.
     
     Keep shining,
     HR Team 🌟
     ```  
   - Connect Gmail OAuth2 credentials.  
   - Connect input from `Update Row (Status)`.

9. **Add Slack Notification Node to Notify HR**  
   - Add **Slack** node named `Notify HR privately`.  
   - Message:  
     ```
     ✅ Recognition completed for {{ $json.name }}  
     Posted to #general and sent thank-you email.
     ```  
   - Set channel ID to HR notification channel (`CHANNEL_ID`).  
   - Connect Slack API credentials.  
   - Connect input from `Send Thank You Email`.

10. **Add If Node to Check Email Success**  
    - Add **If** node named `Check if Email Sent Successfully`.  
    - Condition: Check if `{{$json.gmail.status.toLowerCase()}}` equals `"success"`.  
    - Connect input from `Notify HR privately`.

11. **Add Google Sheets Update Node (Email Status)**  
    - Add **Google Sheets** update node named `Update Row (Email Status)`.  
    - Operation: `update`  
    - Specify Document ID and Sheet Name.  
    - Map `EmailStatus` column to `"Sent"` on success.  
    - Connect input from success output of If node.

12. **Add Slack Node to Alert HR on Failure**  
    - Add **Slack** node named `Alert HR if Email Fails`.  
    - Message:  
      ```
      ⚠️ Failed to send email to {{ $json.name }}. 
      Please check Gmail node or update manually.
      ```  
    - Set channel ID to HR notification channel (`CHANNEL_ID`).  
    - Connect Slack API credentials.  
    - Connect input from failure output of If node.

13. **Add Sticky Notes for Documentation and Block Labels**  
    - Add sticky notes with content describing the workflow overview, trigger, message generation, notification, and logging blocks for clarity.

14. **Activate Workflow**  
    - Verify all credentials are correctly connected.  
    - Replace all placeholder IDs with real Google Sheet IDs, Slack channel IDs, and ensure OpenAI and Gmail credentials are valid.  
    - Activate and test by adding a new row to the Google Sheet.

---

### 5. General Notes & Resources

| Note Content                                                                                                                     | Context or Link                                                                                                   |
|----------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| Detailed problem statement and solution description embedded as a sticky note in the workflow.                                   | Included in main Sticky Note node content.                                                                        |
| Setup steps include creating Google Sheet with specific columns and connecting Slack, Gmail, and OpenAI credentials.             | Workflow setup instructions in Sticky Note and section 4 reproduction steps.                                      |
| Slack API and Gmail OAuth2 credentials require proper scopes for sending messages and emails.                                    | Credential setup must be done in n8n credentials manager with appropriate permissions.                             |
| OpenAI GPT-4 model is used optionally for message personalization, requiring an OpenAI API key with access to GPT-4 variants.   | Langchain nodes require OpenAI API credentials configured in n8n.                                                |
| Workflow ensures zero manual work and 100% consistent recognition announcements and emails, improving employee morale and culture. | Business value described in sticky note and overview section.                                                    |

---

**Disclaimer:**  
The provided text originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly respects applicable content policies and contains no illegal, offensive, or protected elements. All manipulated data is legal and public.