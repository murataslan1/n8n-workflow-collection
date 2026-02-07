AI Testimonial Extractor Agent: Feedback to Marketing Gold

https://n8nworkflows.xyz/workflows/ai-testimonial-extractor-agent--feedback-to-marketing-gold-4449


# AI Testimonial Extractor Agent: Feedback to Marketing Gold

### 1. Workflow Overview

This workflow, named **AI Testimonial Extractor Agent: Feedback to Marketing Gold**, automates the process of collecting user feedback from a Google Form, extracting an emotionally engaging testimonial quote using Google Gemini AI, saving the data back into a Google Sheet, and notifying the marketing team by email. It is designed for marketing teams who want to automatically curate impactful testimonials from raw user feedback for promotional or analytical purposes.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception**: Detects new user feedback submissions via Google Forms connected through Google Sheets.
- **1.2 AI Processing**: Uses Google Gemini language model to extract a concise, emotional testimonial from the raw feedback.
- **1.3 Data Persistence**: Saves the original feedback, user information, and extracted testimonial into a Google Sheet.
- **1.4 Notification**: Sends an email alert to the marketing team with the extracted testimonial.
- **1.5 Support and Documentation**: Provides sticky notes for user guidance and contact information.


---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  This block starts the workflow by triggering on new rows added to a specific Google Sheet that collects Google Form responses.

- **Nodes Involved:**  
  - New Form Response Trigger  
  - Sticky Note (description of trigger)

- **Node Details:**

  - **New Form Response Trigger**  
    - Type: Google Sheets Trigger  
    - Role: Watches a Google Sheet tab ("Form Responses 1") for new rows added (user feedback submissions).  
    - Configuration: Polls every minute (`pollTimes` set to everyMinute), watches a specific sheet and document ID linked to the Google Form responses.  
    - Inputs: None (trigger node)  
    - Outputs: Passes new row data downstream  
    - Credentials: Uses OAuth2 for Google Sheets  
    - Edge Cases: Possible failures include Google API rate limits, OAuth token expiry, or sheet access permission errors.  
    - Expression Usage: None directly, but passes full row JSON including fields like Feedback, Timestamp, Name, Email.

  - **Sticky Note (Starts the workflow ...)**  
    - Purpose: Describes the trigger purpose for user clarity  
    - No input/output connections

#### 1.2 AI Processing

- **Overview:**  
  Extracts a short, emotionally engaging testimonial quote from the raw user feedback using the Google Gemini language model.

- **Nodes Involved:**  
  - Google Gemini Chat Model  
  - Extract Testimonial with Gemini  
  - Sticky Note (about Gemini usage)

- **Node Details:**

  - **Google Gemini Chat Model**  
    - Type: Language Model Chat Node (Google Gemini)  
    - Role: Provides the AI model interface for generating text outputs.  
    - Configuration: Uses model "models/gemini-2.0-flash" without extra options.  
    - Credentials: Google PaLM API credentials needed.  
    - Inputs: Receives prompt text from downstream node.  
    - Outputs: AI-generated testimonial quote.

  - **Extract Testimonial with Gemini**  
    - Type: Chain LLM (Language Model Chain)  
    - Role: Defines the prompt template and sends user feedback text to the Gemini model for processing.  
    - Configuration: The prompt instructs the model to "Extract a short, emotionally engaging testimonial quote from the following user feedback. Ignore neutral or irrelevant text. Only return the quote."  
    - Expressions: Uses `{{ $json.Feedback }}` to insert the exact feedback text from the trigger node.  
    - Inputs: Receives new form response JSON.  
    - Outputs: Passes extracted testimonial text.  
    - Version: 1.5 (specific to chainLlm node)  
    - Edge Cases: Failure to parse feedback text properly, AI model downtime, or malformed input JSON could cause errors.

  - **Sticky Note1**  
    - Purpose: Explains the AI testimonial extraction process.

#### 1.3 Data Persistence

- **Overview:**  
  Saves the original user feedback, extracted testimonial, and related user data back to a Google Sheet for record-keeping.

- **Nodes Involved:**  
  - Save Extracted Testimonial  
  - Sticky Note2 (about storage)

- **Node Details:**

  - **Save Extracted Testimonial**  
    - Type: Google Sheets Node (append or update rows)  
    - Role: Writes or updates a row in the target Google Sheet tab ("Form Responses 1") with multiple columns including Timestamp, Name, Email, Feedback, Testimony, and text.  
    - Configuration: Auto-maps input data to sheet columns, matches rows by "Testimony" column to avoid duplicates, appends new data otherwise.  
    - Inputs: Receives JSON including original and testimonial text.  
    - Outputs: Passes data downstream to notification node.  
    - Credentials: OAuth2 for Google Sheets with edit permissions.  
    - Edge Cases: Google Sheets API limits, permission issues, schema mismatches.

  - **Sticky Note2**  
    - Purpose: Describes saving feedback and testimonial to the sheet.

#### 1.4 Notification

- **Overview:**  
  Sends an email notification to a marketing team member with the newly extracted testimonial quote.

- **Nodes Involved:**  
  - Notify Marketing Team  
  - Sticky Note3 (about notifications)

- **Node Details:**

  - **Notify Marketing Team**  
    - Type: Gmail Node  
    - Role: Sends an email containing the extracted testimonial to a specified email address (`nataylamesa@gmail.com`).  
    - Configuration: Subject line is "New Testimonial Extracted", message body is the testimonial text extracted (`={{ $json.text }}`).  
    - Inputs: Receives testimonial text from Google Sheets node.  
    - Credentials: Gmail OAuth2 account needed.  
    - Edge Cases: Gmail API limits, OAuth token expiry, invalid email format, or SMTP errors.

  - **Sticky Note3**  
    - Purpose: Describes the email alert sent to marketing.

#### 1.5 Support and Documentation

- **Overview:**  
  Provides contact information and helpful links for workflow assistance.

- **Nodes Involved:**  
  - Sticky Note - Assistance  
  - Sticky Note - Description

- **Node Details:**

  - **Sticky Note - Assistance**  
    - Contains author contact email: Yaron@nofluff.online  
    - Links to YouTube and LinkedIn channels for tips and tutorials  
    - Shows author's avatar image.  
    - No connections.

  - **Sticky Note - Description**  
    - Summarizes workflow name and brief description.

---

### 3. Summary Table

| Node Name                    | Node Type                         | Functional Role                         | Input Node(s)             | Output Node(s)                | Sticky Note                                                                                         |
|------------------------------|----------------------------------|---------------------------------------|---------------------------|------------------------------|---------------------------------------------------------------------------------------------------|
| New Form Response Trigger     | Google Sheets Trigger             | Detects new form feedback submissions | None                      | Extract Testimonial with Gemini | Starts the workflow whenever a user submits new feedback via Google Form.                         |
| Extract Testimonial with Gemini| Chain LLM (Language Model Chain) | Extracts testimonial quote using Gemini AI | New Form Response Trigger | Save Extracted Testimonial    | Uses Gemini to generate a concise testimonial quote from user feedback.                          |
| Save Extracted Testimonial    | Google Sheets                    | Saves feedback and testimonial to sheet | Extract Testimonial with Gemini | Notify Marketing Team          | Stores original feedback, extracted quote, and user info in a testimonials tab.                  |
| Notify Marketing Team         | Gmail                           | Sends email notification to marketing | Save Extracted Testimonial | None                         | Sends email alert to marketing when a new testimonial is added.                                 |
| Google Gemini Chat Model      | Language Model Chat Node (Google Gemini) | Provides AI model interface for LLM  | Extract Testimonial with Gemini | Extract Testimonial with Gemini |                                                                                                   |
| Sticky Note - Description     | Sticky Note                     | Workflow summary description          | None                      | None                         | Workflow Name: Testimonial Extractor; Description of workflow functionality                       |
| Sticky Note                   | Sticky Note                     | Describes trigger node                 | None                      | None                         | Starts the workflow whenever a user submits new feedback via Google Form.                         |
| Sticky Note1                  | Sticky Note                     | Describes AI testimonial extraction   | None                      | None                         | Uses Gemini to generate a concise testimonial quote from user feedback.                           |
| Sticky Note2                  | Sticky Note                     | Describes data persistence             | None                      | None                         | Stores original feedback, extracted quote, and user info in a testimonials tab.                  |
| Sticky Note3                  | Sticky Note                     | Describes notification step            | None                      | None                         | Sends email alert to marketing when a new testimonial is added.                                 |
| Sticky Note - Assistance      | Sticky Note                     | Support and contact info                | None                      | None                         | For any questions or support, contact Yaron@nofluff.online; links to YouTube and LinkedIn channels |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Google Sheets Trigger Node**  
   - Type: Google Sheets Trigger  
   - Set event to "Row Added"  
   - Configure to poll every minute  
   - Set Document ID to your Google Form response sheet ID  
   - Set Sheet Name to the tab collecting form responses (e.g., "Form Responses 1")  
   - Connect Google Sheets OAuth2 credentials with permissions to read the sheet.

2. **Create Google Gemini Chat Model Node**  
   - Type: Language Model Chat Node (Google Gemini)  
   - Set Model Name to "models/gemini-2.0-flash"  
   - Use Google PaLM API credentials for authorization.

3. **Create Chain LLM Node to Extract Testimonial**  
   - Type: Chain LLM  
   - Set prompt type to "define"  
   - Prepare prompt text:  
     ```
     Extract a short, emotionally engaging testimonial quote from the following user feedback. Ignore neutral or irrelevant text. Only return the quote.
     "{{ $json.Feedback }}"
     Feedback: "{{ $json["Feedback"] }}"
     ```  
   - Connect input from Google Sheets Trigger node (new form response)  
   - Connect AI model input to the Google Gemini Chat Model node.

4. **Create Google Sheets Node to Save Data**  
   - Type: Google Sheets (Append or Update)  
   - Set operation to "appendOrUpdate"  
   - Configure target Document ID and Sheet Name (same as trigger or a dedicated "Testimonials" tab)  
   - Define columns to include Timestamp, Name, Email, Feedback, Testimony, and text  
   - Map input data accordingly, matching on "Testimony" column to avoid duplicates  
   - Connect credentials with write access to Google Sheets.

5. **Create Gmail Node to Notify Marketing Team**  
   - Type: Gmail  
   - Set recipient email address (e.g., "nataylamesa@gmail.com")  
   - Set subject line to "New Testimonial Extracted"  
   - Set email body to `={{ $json.text }}` (the extracted testimonial)  
   - Connect Gmail OAuth2 credentials with send email permissions.

6. **Connect Workflow Steps**  
   - Connect Google Sheets Trigger output to Chain LLM input node  
   - Connect Chain LLM output to Google Sheets save node  
   - Connect Google Sheets save node output to Gmail notification node.

7. **Add Sticky Notes for Documentation (Optional but Recommended)**  
   - Add sticky notes near nodes describing their purpose, e.g., trigger description, AI extraction explanation, data saving, and notification step.  
   - Add a sticky note with workflow assistance info including contact email and helpful links.

8. **Test Workflow**  
   - Submit a sample Google Form response  
   - Verify testimonial extraction correctness  
   - Confirm data saved in Google Sheet  
   - Confirm email notification received.

---

### 5. General Notes & Resources

| Note Content                                                                                                                  | Context or Link                                                                                         |
|-------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| For any questions or support, please contact: Yaron@nofluff.online                                                            | Contact email provided in workflow assistance sticky note                                             |
| Explore more tips and tutorials on YouTube: https://www.youtube.com/@YaronBeen/videos                                          | YouTube channel link for workflow and n8n tips                                                        |
| Connect on LinkedIn: https://www.linkedin.com/in/yaronbeen/                                                                    | Author’s LinkedIn profile for networking and support                                                  |
| Author: Yaron Been                                                                                                             | Workflow author credit                                                                                |
| Workflow uses Google Gemini (PaLM) AI model via Google PaLM API credentials                                                    | Requires Google PaLM API account setup                                                                |
| Gmail node requires OAuth2 credentials with permission to send emails                                                          | Gmail OAuth2 must be configured with proper scopes                                                    |
| Google Sheets OAuth2 credentials need read and write permissions for the target spreadsheet                                    | Proper OAuth2 scopes are mandatory for trigger and data persistence nodes                             |
| Workflow is designed for marketing teams to automatically extract testimonials from user feedback for use in promotional assets | Use case and target audience                                                                           |

---

**Disclaimer:**  
The provided text is derived exclusively from an automated workflow created using n8n, a tool for integration and automation. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.