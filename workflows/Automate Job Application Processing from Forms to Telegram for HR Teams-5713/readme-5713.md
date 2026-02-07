Automate Job Application Processing from Forms to Telegram for HR Teams

https://n8nworkflows.xyz/workflows/automate-job-application-processing-from-forms-to-telegram-for-hr-teams-5713


# Automate Job Application Processing from Forms to Telegram for HR Teams

### 1. Workflow Overview

This workflow automates the processing of job applications submitted via a web form, specifically designed for HR teams to streamline candidate intake and notification. It captures application data, normalizes and formats key fields, branches depending on whether a resume file is attached, and sends the relevant applicant information to a designated Telegram group for HR review.

Logical blocks included:

- **1.1 Input Reception:** Captures form submissions via webhook.
- **1.2 Data Normalization:** Processes and formats key fields like phone numbers and dates.
- **1.3 Field Mapping:** Standardizes incoming form data into consistent JSON properties.
- **1.4 Conditional Branching:** Checks if a resume file was submitted and routes accordingly.
- **1.5 Data Consolidation:** Merges data from both branches for uniform output.
- **1.6 Notification Dispatch:** Sends either the resume document or plain text applicant info to Telegram.
- **1.7 Workflow Termination:** Ends the workflow gracefully after sending notifications.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  Listens for new job application submissions via a custom web form, triggering the workflow.

- **Nodes Involved:**  
  - On form submission

- **Node Details:**  
  - **On form submission**  
    - Type: Form Trigger  
    - Role: Initiates workflow on form submit event.  
    - Configuration:  
      - Webhook path set to "mmc-newjob".  
      - Custom CSS applied for branding and styling of the form interface.  
      - Form titled "Career Application" with fields including Name, Age, WhatsApp Number, Education Level, Position Applied (multi-select), Earliest Start Date, Expected Salary, Resume (file upload), and Additional Information.  
      - Required fields enforced on critical inputs.  
    - Input: HTTP POST from form submission.  
    - Output: Captured JSON representing the submitted form data.  
    - Edge cases: Potential webhook availability issues, malformed form data, or missing required fields could cause failures.

#### 2.2 Data Normalization

- **Overview:**  
  Normalizes the WhatsApp phone number format and converts the earliest start date into a consistent string format for downstream processing.

- **Nodes Involved:**  
  - Code  
  - Date & Time

- **Node Details:**  
  - **Code**  
    - Type: Code (JavaScript)  
    - Role: Ensures WhatsApp number starts with '0' if missing.  
    - Key expression: Checks string start, prepends '0' if absent.  
    - Input: JSON from form submission.  
    - Output: Modified JSON with normalized WhatsApp number.  
    - Edge cases: Non-numeric or malformed phone numbers may produce incorrect normalization.  
  - **Date & Time**  
    - Type: Date & Time  
    - Role: Formats the "Earliest Start Date" into a standardized date string.  
    - Configuration: Uses the date field from JSON input, no special format options specified (default formatting).  
    - Input: JSON with normalized phone number.  
    - Output: JSON with formatted date string replacing original date field.  
    - Edge cases: Invalid or missing date input could cause formatting errors.

#### 2.3 Field Mapping

- **Overview:**  
  Maps and renames form fields into unified, consistent JSON properties to facilitate easier processing downstream.

- **Nodes Involved:**  
  - Edit Fields

- **Node Details:**  
  - **Edit Fields**  
    - Type: Set  
    - Role: Assigns new properties and copies values from the original form submission to a clean schema.  
    - Configuration: Copies fields such as banner-top, Name, Age, WhatsApp Number (from Code node output), Education Level, Position Applied (as array), Earliest Start Date (formatted date), Expected Salary, Resume, Additional Information, and Current Occupation.  
    - Input: JSON from Date & Time node.  
    - Output: JSON with standardized field names and values.  
    - Edge cases: Missing fields in the original data could result in undefined properties.

#### 2.4 Conditional Branching

- **Overview:**  
  Checks if the applicant uploaded a resume file and directs workflow accordingly.

- **Nodes Involved:**  
  - If Have Resume

- **Node Details:**  
  - **If Have Resume**  
    - Type: If  
    - Role: Branches workflow based on existence of a non-empty "Resume" field.  
    - Configuration: Condition checks if the "Resume" field is not empty.  
    - Input: JSON from Edit Fields node.  
    - Output: Two branches:  
      - True: Applicant has uploaded a resume.  
      - False: No resume uploaded.  
    - Edge cases: Incomplete or corrupted file uploads could cause false negatives.

#### 2.5 Data Consolidation

- **Overview:**  
  Merges data streams from both branches (resume present or absent) back into a single path for subsequent processing.

- **Nodes Involved:**  
  - Merge

- **Node Details:**  
  - **Merge**  
    - Type: Merge  
    - Role: Combines outputs from both branches into a single JSON item.  
    - Configuration: Combines all items into one array (combineAll mode).  
    - Input: Receives data from the "If Have Resume" node's true branch and from the false branch after sending plain info.  
    - Output: Consolidated JSON for final processing.  
    - Edge cases: Merging empty or incompatible data sets may cause unexpected results.

#### 2.6 Notification Dispatch

- **Overview:**  
  Sends the applicant's details to an HR Telegram group either as a document with caption (if resume is present) or as plain text message.

- **Nodes Involved:**  
  - Send a Resume  
  - Send a Info

- **Node Details:**  
  - **Send a Resume**  
    - Type: Telegram  
    - Role: Sends the uploaded resume file to Telegram with applicant details in the caption.  
    - Configuration:  
      - Sends document binary data from the "Resume" field.  
      - Caption includes Name, Age, Education Level, WhatsApp number as clickable link, position applied, current occupation, earliest start date, expected salary, and additional notes.  
      - MarkdownV2 parse mode for message formatting.  
      - Uses Telegram credential (@mal_notis_bot).  
    - Input: Merged JSON with resume file.  
    - Output: Message sent to Telegram.  
    - Edge cases: Telegram API rate limits or credential issues might block sending; file size limits apply.  
  - **Send a Info**  
    - Type: Telegram  
    - Role: Sends plain text applicant details as Telegram message when no resume is uploaded.  
    - Configuration: Similar text content as caption above without file attachment.  
    - Input: JSON from "If Have Resume" false branch.  
    - Output: Message sent to Telegram.  
    - Edge cases: Telegram API or credential failures possible.

#### 2.7 Workflow Termination

- **Overview:**  
  Ends the workflow without further actions after sending notifications.

- **Nodes Involved:**  
  - No Operation, do nothing

- **Node Details:**  
  - **No Operation, do nothing**  
    - Type: NoOp  
    - Role: Terminates workflow without side effects.  
    - Configuration: None.  
    - Input: From both Send a Resume and Send a Info nodes.  
    - Output: None.  
    - Edge cases: None.

---

### 3. Summary Table

| Node Name              | Node Type         | Functional Role                                    | Input Node(s)        | Output Node(s)           | Sticky Note                                                                                          |
|------------------------|-------------------|--------------------------------------------------|----------------------|--------------------------|----------------------------------------------------------------------------------------------------|
| On form submission     | Form Trigger      | Receive new applicant form submissions            | —                    | Merge, Code              | **On form submission**: Receives all applicant fields. Uses a webhook to capture the form data.    |
| Code                   | Code              | Normalize WhatsApp number format                   | On form submission   | Date & Time              | **Code**: Ensures WhatsApp number starts with a leading zero if missing.                            |
| Date & Time            | Date & Time       | Format earliest start date                          | Code                 | Edit Fields              | **Date & Time**: Formats the "Earliest Start Date" into a standard date string.                     |
| Edit Fields            | Set               | Map and rename fields for consistency              | Date & Time          | If Have Resume           | **Edit Fields**: Renames and maps form fields to unified JSON properties for downstream use.       |
| If Have Resume         | If                | Branch based on presence of resume file            | Edit Fields          | Merge (true), Send a Info (false) | **If Have Resume**: Routes to two paths based on whether a resume file was provided: True → Send document, False → Send plain text info. |
| Merge                  | Merge             | Combine branches back into single data stream      | On form submission, If Have Resume (true) | Send a Resume           | **Merge**: Combines the two branches back into a single item for final processing.                  |
| Send a Resume          | Telegram          | Send resume file with applicant details            | Merge                | No Operation, do nothing | **Send a Resume**: Sends the uploaded resume file to the HR Telegram group with applicant details in the caption. |
| Send a Info            | Telegram          | Send plain text applicant info when no resume      | If Have Resume (false) | No Operation, do nothing | **Send a Info**: Sends plain text applicant details when no resume file is present.                  |
| No Operation, do nothing | NoOp            | End workflow                                       | Send a Resume, Send a Info | —                     |                                                                                                    |
| Overview Note          | Sticky Note       | Overview of entire workflow                         | —                    | —                        | 🔶 **Overview**: This workflow handles new career applications submitted via a web form...          |
| Form Trigger Note      | Sticky Note       | Notes on form submission node                       | —                    | —                        | **On form submission**: Receives all applicant fields. Uses a webhook to capture the form data.     |
| Normalize Phone Note   | Sticky Note       | Notes on phone number normalization                 | —                    | —                        | **Code**: Ensures WhatsApp number starts with a leading zero if missing.                            |
| Format Date Note       | Sticky Note       | Notes on date formatting                             | —                    | —                        | **Date & Time**: Formats the "Earliest Start Date" into a standard date string.                     |
| Map Fields Note        | Sticky Note       | Notes on field mapping                               | —                    | —                        | **Edit Fields**: Renames and maps form fields to unified JSON properties for downstream use.       |
| Branch Note            | Sticky Note       | Notes on conditional branching                       | —                    | —                        | **If Have Resume**: Routes to two paths based on whether a resume file was provided...              |
| Merge Note             | Sticky Note       | Notes on merging branches                            | —                    | —                        | **Merge**: Combines the two branches back into a single item for final processing.                  |
| Send Resume Note       | Sticky Note       | Notes on sending resume to Telegram                  | —                    | —                        | **Send a Resume**: Sends the uploaded resume file to the HR Telegram group with applicant details.  |
| Send Info Note         | Sticky Note       | Notes on sending plain text info to Telegram         | —                    | —                        | **Send a Info**: Sends plain text applicant details when no resume file is present.                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the "On form submission" node**  
   - Type: Form Trigger  
   - Set webhook path to `mmc-newjob`  
   - Configure form fields as follows:
     - Banner HTML image (non-input, display only)  
     - Name (text, required)  
     - Age (number, required)  
     - WhatsApp Number (number, required)  
     - Education Level / Degree (dropdown, options: Secondary School, SPM, Diploma, Degree or Above; required)  
     - Current Occupation (text, required)  
     - Position Applied (dropdown, multi-select, options: Facebook Marketing, Xiaohongshu Marketing, Course Consultant, Any; required)  
     - Earliest Start Date (date, required)  
     - Expected Salary (number, required)  
     - Resume (file upload, optional)  
     - Additional Information (textarea, optional)  
   - Apply custom CSS for branding (provided in original node).  
   - Save node.

2. **Connect "On form submission" output to "Code" node**  
   - Create a Code node named "Code"  
   - Paste JavaScript to normalize WhatsApp number by adding leading zero if missing:  
     ```js
     return items.map(item => {
       let num = String(item.json['WhatsApp Number']);
       if (!num.startsWith('0')) {
         num = '0' + num;
       }
       item.json['WhatsApp Number'] = num;
       return item;
     });
     ```  
   - Connect "On form submission" output to "Code".

3. **Create "Date & Time" node**  
   - Type: Date & Time  
   - Operation: Format Date  
   - Date input: `{{$json["Earliest Start Date"]}}`  
   - Connect "Code" output to "Date & Time".

4. **Create "Edit Fields" node**  
   - Type: Set  
   - Assign fields by mapping as follows:  
     - banner-top: from `On form submission.banner-top`  
     - Name: from `On form submission.Name`  
     - Age: from `On form submission.Age`  
     - WhatsApp Number: from `Code.WhatsApp Number` (normalized)  
     - Education Level: from `On form submission["Education Level / Degree"]`  
     - Position Applied: from `On form submission["Position Applied"]` (array)  
     - Earliest Start Date: from formatted date in current JSON (`$json.formattedDate`)  
     - Expected Salary: from `On form submission["Expected Salary"]`  
     - Resume: from `On form submission.Resume`  
     - Additional Information: from `On form submission["Additional Information – **Can persuade HR to invite you for an interview"]`  
     - Current Occupation: from `On form submission["Current Occupation"]`  
   - Connect "Date & Time" output to "Edit Fields".

5. **Create "If Have Resume" node**  
   - Type: If  
   - Condition: Check if `Resume` field is not empty  
   - Connect "Edit Fields" output to "If Have Resume".

6. **Create "Send a Resume" Telegram node**  
   - Type: Telegram  
   - Operation: Send Document  
   - Chat ID: Set your HR group's chat ID  
   - Binary Property Name: `Resume`  
   - Caption: Use MarkdownV2 formatting to include:  
     ```
     {{$json["Name"]}}｜{{$json["Age"]}}｜{{$json["Education Level"]}}
     ☎️ [{{$json["WhatsApp Number"]}}](https://wa.me/6{{$json["WhatsApp Number"]}})
     💼 {{$json["Position Applied"].join(", ")}} → Current: {{$json["Current Occupation"]}}
     📅 {{$json["Earliest Start Date"]}}
     💰 {{$json["Expected Salary"]}}
     ·
     Note: “{{$json["Additional Information"]}}”
     ```  
   - Credentials: Use Telegram API credentials (e.g., bot token for @mal_notis_bot).  
   - Connect "If Have Resume" true output to "Send a Resume".

7. **Create "Send a Info" Telegram node**  
   - Type: Telegram  
   - Operation: Send Message  
   - Chat ID: Same HR Telegram group chat ID  
   - Text: Same content as caption above (without file)  
   - Parse Mode: MarkdownV2  
   - Credentials: Same Telegram API credential  
   - Connect "If Have Resume" false output to "Send a Info".

8. **Create "Merge" node**  
   - Type: Merge  
   - Mode: Combine (combineAll)  
   - Connect:  
     - "On form submission" output to first input of Merge  
     - "If Have Resume" true branch output to second input of Merge

9. **Connect "Merge" output to "Send a Resume"**

10. **Create "No Operation, do nothing" node**  
    - Type: NoOp  
    - Connect outputs of "Send a Resume" and "Send a Info" to "No Operation, do nothing".

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                   | Context or Link                                                                                     |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| The workflow uses Telegram Bot API to notify HR teams in real-time about new applicants. Ensure the Telegram bot token has permissions to send messages to the specified group chat.                                             | Telegram Bot API documentation: https://core.telegram.org/bots/api                                  |
| WhatsApp numbers are normalized to start with a leading zero for consistency, but country code handling is manual in Telegram links (hardcoded prefix '6'). Modify as needed for other locales.                                   | Adjust phone number formatting logic in the Code node as per target region conventions.            |
| MarkdownV2 formatting in Telegram messages requires escaping special characters if input might contain them to avoid formatting errors.                                                                                      | See Telegram MarkdownV2 formatting rules: https://core.telegram.org/bots/api#markdownv2-style      |
| The form is styled with custom CSS embedded in the Form Trigger node for branding and UX uniformity.                                                                                                                          | Modify CSS in Form Trigger node parameters to update form appearance.                               |
| The "Additional Information" field is optional but recommended to persuade HR for interviews, providing a qualitative advantage.                                                                                               |                                                                                                   |
| The Merge node ensures workflow continuity by consolidating branches; ensure it is set to "combineAll" to avoid data loss.                                                                                                    |                                                                                                   |
| This workflow is ideal for organizations seeking automation in HR intake processes, reducing manual handling and enabling instant notifications via Telegram.                                                                  |                                                                                                   |

---

**Disclaimer:** The provided text is derived exclusively from an automated workflow created with n8n, a tool for integration and automation. The processing strictly respects current content policies and contains no illegal, offensive, or protected material. All manipulated data is legal and publicly accessible.