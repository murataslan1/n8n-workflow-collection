Automate Calendly User Onboarding & Offboarding with Google Sheets and Human Approval

https://n8nworkflows.xyz/workflows/automate-calendly-user-onboarding---offboarding-with-google-sheets-and-human-approval-11050


# Automate Calendly User Onboarding & Offboarding with Google Sheets and Human Approval

### 1. Workflow Overview

This workflow automates the user onboarding and offboarding processes for Calendly within a company, incorporating human approval steps. It is designed for HR and IT teams to streamline adding and removing users in the Calendly organization via API, with Google Sheets as a central data source and OpenAI-generated email notifications to HR for approval.

The workflow is logically divided into two parallel streams: Onboarding and Offboarding. Both streams share a similar structure with form inputs, data verification/updates in Google Sheets, AI-generated email notifications for HR, man-in-the-loop approval via Gmail, and API interactions with Calendly to add or remove users. Upon completion or rejection, the workflow updates the spreadsheet and provides feedback via form completion pages.

Logical blocks:

- **1.1 Onboarding Input and Data Recording**: Collect user data via a form and record it in Google Sheets.
- **1.2 Onboarding Email Notification and Approval**: Generate an AI-based email to HR and send it for double approval.
- **1.3 Onboarding Execution**: Upon approval, add the user to Calendly via API and update the spreadsheet.
- **2.1 Offboarding Input and Verification**: Collect offboarding request, verify user existence and Calendly status in Google Sheets.
- **2.2 Offboarding Email Notification and Approval**: Generate an AI-based email to HR for offboarding approval and send it for double approval.
- **2.3 Offboarding Execution**: Upon approval, delete the user from Calendly via API and update the spreadsheet.

Supporting nodes include utility actions such as setting the Calendly organization ID, managing human approval conditions, and rendering form completion feedback.

---

### 2. Block-by-Block Analysis

#### 1.1 Onboarding Input and Data Recording

**Overview:**  
This block captures new user data through a form, sets the Calendly organization ID, and appends the user data to a Google Sheets document.

**Nodes Involved:**  
- Onboarding form  
- New user  
- Set Calendy Organization  
- Merge

**Node Details:**

- **Onboarding form**  
  - Type: Form Trigger  
  - Role: Entry point for onboarding user data collection with fields for First Name, Last Name, Email (all required).  
  - Configuration: Form titled "Calendly Onboarding" with three required fields.  
  - Outputs: Data used downstream to add user to sheet and set organization ID.  
  - Edge cases: Missing required fields; form webhook must be publicly accessible.

- **New user**  
  - Type: Google Sheets (Append)  
  - Role: Append collected new user data to the spreadsheet with current date and default Calendly status.  
  - Configuration: Appends row with columns DATE (current date), EMAIL, LAST NAME, FIRST NAME, CALENDLY (empty at this stage).  
  - Inputs: Data from Onboarding form.  
  - Outputs: Passes data to Merge node.  
  - Edge cases: Google Sheets API errors, permission issues.

- **Set Calendy Organization**  
  - Type: Set  
  - Role: Assigns a static string value for Calendly organization ID to be used in API calls.  
  - Configuration: calendly_organization = "XXX" (placeholder, must be replaced).  
  - Inputs: Triggered after Onboarding form.  
  - Outputs: Passes organization ID downstream.  
  - Edge cases: Organization ID must be updated correctly.

- **Merge**  
  - Type: Merge  
  - Role: Combine outputs from New user and Set Calendy Organization nodes, consolidating data for next steps.  
  - Configuration: Combine mode "combineAll".  
  - Inputs: Data from New user and Set Calendy Organization.  
  - Outputs: Passes combined data to Email Agent Onboarding.  
  - Edge cases: Mismatched data or missing inputs could cause failure.

---

#### 1.2 Onboarding Email Notification and Approval

**Overview:**  
Generates a professional HTML email for HR notification via an AI agent, sends the email for double approval, and waits for HR’s confirmation.

**Nodes Involved:**  
- OpenAI Chat Model  
- Email Agent Onboarding  
- Email Man-in-the-loop Onboarding  
- Approve onboarding?  

**Node Details:**

- **OpenAI Chat Model**  
  - Type: LangChain OpenAI Chat Model  
  - Role: Backend AI model (gpt-5.1) used by Email Agent Onboarding for generating email content.  
  - Configuration: Model "gpt-5.1" with default options.  
  - Inputs: Receives prompt text with user details.  
  - Outputs: AI-generated HTML email content.  
  - Credentials: OpenAI API key required.  
  - Edge cases: API rate limits, authentication failures, prompt errors.

- **Email Agent Onboarding**  
  - Type: LangChain Agent  
  - Role: Formats and sends a prompt to OpenAI to generate a professional HTML email notifying HR about onboarding.  
  - Configuration: Inputs first name, last name, email; system message instructs to produce a full HTML email with a call-to-action button but no approval link included in output.  
  - Inputs: Combined user and organization data from Merge node.  
  - Outputs: AI-generated HTML email string.  
  - Edge cases: Incorrect data interpolation can cause prompt failures.

- **Email Man-in-the-loop Onboarding**  
  - Type: Gmail Node  
  - Role: Sends the generated HTML email to HR's email address (info@n3w.it) with double approval enabled; waits up to 45 minutes for approval.  
  - Configuration: Sends email subject indicating user’s onboarding request; uses OAuth2 credentials for Gmail.  
  - Inputs: HTML email content from Email Agent Onboarding.  
  - Outputs: Approval data indicating HR's confirmation or rejection.  
  - Edge cases: Email delivery failures, approval timeout, OAuth token expiry.

- **Approve onboarding?**  
  - Type: If Condition  
  - Role: Checks if HR approved the onboarding (boolean true).  
  - Configuration: Condition is $json.data.approved == true.  
  - Inputs: Approval data from Email Man-in-the-loop Onboarding.  
  - Outputs: If true, proceeds to add user to Calendly; else, triggers onboarding not approved form.  
  - Edge cases: Missing approval data, unexpected values.

---

#### 1.3 Onboarding Execution

**Overview:**  
Upon HR approval, this block adds the user to the Calendly organization via API, updates the Google Sheet, and displays a completion form.

**Nodes Involved:**  
- Add user to Calendly  
- Onboarding complete  
- End form page onboarding  
- Form ending (not approved)

**Node Details:**

- **Add user to Calendly**  
  - Type: HTTP Request  
  - Role: Sends a POST request to Calendly API to invite the user to the organization.  
  - Configuration: URL built with Calendly organization ID, POST method, body contains user email, Authorization header with Bearer token (placeholder "YOUR_TOKEN_HERE").  
  - Inputs: User email and organization ID from previous nodes.  
  - Outputs: Response passed to Onboarding complete.  
  - Edge cases: API authorization errors, invalid organization ID, network timeouts.

- **Onboarding complete**  
  - Type: Google Sheets (Update)  
  - Role: Updates the user row in the spreadsheet to set CALENDLY status to "on".  
  - Configuration: Matches row by email, updates CALENDLY column to "on".  
  - Inputs: User email and row number from previous steps.  
  - Outputs: Triggers form completion page.  
  - Edge cases: Row mismatch, Google Sheets API errors.

- **End form page onboarding**  
  - Type: Form  
  - Role: Displays a completion message "Onboarding complete" to the user at the form webhook endpoint.  
  - Configuration: Basic success message.  
  - Inputs: Triggered after Google Sheets update.  
  - Edge cases: Form webhook availability.

- **Form ending**  
  - Type: Form  
  - Role: Displays a message "Onboarding not approved" to the user if HR rejects the approval.  
  - Configuration: Basic rejection message.  
  - Inputs: Triggered by If node on negative approval.  
  - Edge cases: Same as above.

---

#### 2.1 Offboarding Input and Verification

**Overview:**  
Receives offboarding requests via a form, verifies the user's existence and Calendly status in Google Sheets.

**Nodes Involved:**  
- Offboarding form  
- Get row(s) in sheet  
- If1

**Node Details:**

- **Offboarding form**  
  - Type: Form Trigger  
  - Role: Entry point for offboarding requests, collects only Email (required).  
  - Configuration: Form titled "Calendly Offboarding" with one required email field.  
  - Outputs: Email passed to Google Sheets lookup.  
  - Edge cases: Missing or invalid email.

- **Get row(s) in sheet**  
  - Type: Google Sheets (Lookup)  
  - Role: Searches Google Sheet for a row matching the provided email and CALENDLY equals "on".  
  - Configuration: Filters by EMAIL = input email, CALENDLY = "on".  
  - Inputs: Email from Offboarding form.  
  - Outputs: Row data if user found.  
  - Edge cases: No matching user found, Google Sheets API errors.

- **If1**  
  - Type: If Condition  
  - Role: Checks if a row was found (row_number exists).  
  - Configuration: Condition tests existence of row_number field in JSON.  
  - Inputs: Output from Get row(s) in sheet.  
  - Outputs: If true, proceed to offboarding email generation; else, no further action.  
  - Edge cases: Missing row_number or empty result.

---

#### 2.2 Offboarding Email Notification and Approval

**Overview:**  
Generates an AI-based email notification for HR about offboarding, sends it with double approval, and waits for confirmation.

**Nodes Involved:**  
- OpenAI Chat Model1  
- Email Agent Offboarding  
- Email Man-in-the-loop Offboarding  
- Approve offboarding?

**Node Details:**

- **OpenAI Chat Model1**  
  - Type: LangChain OpenAI Chat Model  
  - Role: AI model instance (gpt-5.1) used by Email Agent Offboarding to generate email content.  
  - Configuration: Same as onboarding OpenAI node but separate instance.  
  - Inputs: User details pulled from sheet.  
  - Outputs: AI-generated HTML email content.  
  - Edge cases: Same as onboarding OpenAI node.

- **Email Agent Offboarding**  
  - Type: LangChain Agent  
  - Role: Constructs and sends prompt to OpenAI for offboarding email generation.  
  - Configuration: Inputs user first name, last name, and email; system message requests full HTML email notifying HR about offboarding and manual approval.  
  - Inputs: User data from If1 node.  
  - Outputs: HTML email content.  
  - Edge cases: Data interpolation errors.

- **Email Man-in-the-loop Offboarding**  
  - Type: Gmail Node  
  - Role: Sends the offboarding email to HR with double approval enabled, waits 45 minutes for approval.  
  - Configuration: Sends to info@n3w.it, subject indicates offboarding request for user.  
  - Inputs: HTML email content from Email Agent Offboarding.  
  - Outputs: Approval or rejection data.  
  - Edge cases: Email failures, approval timeout.

- **Approve offboarding?**  
  - Type: If Condition  
  - Role: Checks if HR approved offboarding (boolean true).  
  - Configuration: Condition $json.data.approved == true.  
  - Inputs: Approval data from Email Man-in-the-loop Offboarding.  
  - Outputs: If true, proceed to Calendly user deletion; else, trigger rejection form.  
  - Edge cases: Missing or invalid approval data.

---

#### 2.3 Offboarding Execution

**Overview:**  
Upon approval, retrieves the Calendly user membership, deletes the user from Calendly via API, updates Google Sheets, and shows completion form.

**Nodes Involved:**  
- Set Calendy Organization id  
- Get Calendly User  
- Delete Calendly user  
- Offboarding complete  
- End form page offboarding  
- Form ending1 (not approved)

**Node Details:**

- **Set Calendy Organization id**  
  - Type: Set  
  - Role: Sets the Calendly organization ID string for API calls (same as onboarding).  
  - Configuration: calendly_organization = "XXX" placeholder.  
  - Inputs: Triggered after offboarding approval.  
  - Outputs: Passes organization ID downstream.  
  - Edge cases: Must update placeholder with valid ID.

- **Get Calendly User**  
  - Type: HTTP Request  
  - Role: Retrieves Calendly organization membership info for the user via API GET request.  
  - Configuration: URL built with organization ID and user email parameters, Authorization header with Bearer token (placeholder).  
  - Inputs: Organization ID and email from Set node and sheet.  
  - Outputs: Membership data including deletion URI.  
  - Edge cases: API errors, user not found.

- **Delete Calendly user**  
  - Type: HTTP Request  
  - Role: Deletes user from Calendly by sending HTTP DELETE to membership URI retrieved previously.  
  - Configuration: URL from previous node’s JSON data; Authorization header with Bearer token.  
  - Inputs: Membership URI from Get Calendly User.  
  - Outputs: Response passed to Offboarding complete.  
  - Edge cases: API authorization errors, invalid URI.

- **Offboarding complete**  
  - Type: Google Sheets (Update)  
  - Role: Updates user row in spreadsheet to mark CALENDLY status as "off".  
  - Configuration: Matches row by email, updates CALENDLY column to "off".  
  - Inputs: User email and row number.  
  - Outputs: Triggers offboarding completion form.  
  - Edge cases: Row matching errors.

- **End form page offboarding**  
  - Type: Form  
  - Role: Displays "Onboarding complete" message upon successful offboarding.  
  - Configuration: Basic success message.  
  - Inputs: Triggered after sheet update.  
  - Edge cases: Form webhook availability.

- **Form ending1**  
  - Type: Form  
  - Role: Displays "Offboarding not approved" if HR rejects approval.  
  - Configuration: Basic rejection message.  
  - Inputs: Triggered by If node on rejection.  
  - Edge cases: Same as above.

---

### 3. Summary Table

| Node Name                     | Node Type                              | Functional Role                                  | Input Node(s)                               | Output Node(s)                           | Sticky Note                                                                                                                                                             |
|-------------------------------|--------------------------------------|-------------------------------------------------|---------------------------------------------|-----------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Onboarding form                | Form Trigger                         | Collect onboarding user data                     | —                                           | New user, Set Calendy Organization      | ## STEP 1 - **Onboarding Process:** Users submit their information (first name, last name, email) through an onboarding form. Data is recorded in Google Sheets.         |
| New user                      | Google Sheets (Append)               | Append new user data to Google Sheet             | Onboarding form                              | Merge                                   | ## STEP 1 - **Onboarding Process:** Users submit their information (first name, last name, email) through an onboarding form. Data is recorded in Google Sheets.         |
| Set Calendy Organization       | Set                                 | Set Calendly organization ID for API calls      | Onboarding form                              | Merge                                   | ## STEP 1 - **Onboarding Process:** Users submit their information (first name, last name, email) through an onboarding form. Data is recorded in Google Sheets.         |
| Merge                         | Merge                               | Combine user data and organization ID            | New user, Set Calendy Organization           | Email Agent Onboarding                   | ## STEP 1 - **Onboarding Process:** Users submit their information (first name, last name, email) through an onboarding form. Data is recorded in Google Sheets.         |
| OpenAI Chat Model             | LangChain OpenAI Chat Model          | AI model for email generation                     | Email Agent Onboarding                       | Email Agent Onboarding                   | ## STEP 2 - Email notification for HR: AI generates a professional HTML email notification for HR with approval steps.                                                  |
| Email Agent Onboarding         | LangChain Agent                     | Generate onboarding HTML email for HR             | Merge                                        | Email Man-in-the-loop Onboarding         | ## STEP 2 - Email notification for HR: AI generates a professional HTML email notification for HR with approval steps.                                                  |
| Email Man-in-the-loop Onboarding | Gmail                              | Send onboarding email to HR with double approval | Email Agent Onboarding                       | Approve onboarding?                      | ## STEP 2 - Email notification for HR: AI generates a professional HTML email notification for HR with approval steps.                                                  |
| Approve onboarding?            | If                                  | Check HR approval for onboarding                   | Email Man-in-the-loop Onboarding             | Add user to Calendly, Form ending        | ## STEP 2 - Email notification for HR: AI generates a professional HTML email notification for HR with approval steps.                                                  |
| Add user to Calendly           | HTTP Request                        | Add user to Calendly organization via API          | Approve onboarding?                          | Onboarding complete                      | ## STEP 3 -  Add user to Calendly organization: System adds user to Calendly, updates sheet, and confirms completion.                                                  |
| Onboarding complete            | Google Sheets (Update)              | Update user Calendly status to "on" in sheet       | Add user to Calendly                         | End form page onboarding                 | ## STEP 3 -  Add user to Calendly organization: System adds user to Calendly, updates sheet, and confirms completion.                                                  |
| End form page onboarding       | Form                               | Show onboarding completion message                  | Onboarding complete                          | —                                       | ## STEP 3 -  Add user to Calendly organization: System adds user to Calendly, updates sheet, and confirms completion.                                                  |
| Form ending                   | Form                               | Show onboarding not approved message                | Approve onboarding? (No branch)              | —                                       | ## STEP 2 - Email notification for HR: AI generates a professional HTML email notification for HR with approval steps.                                                  |
| Offboarding form              | Form Trigger                       | Collect offboarding user email                       | —                                           | Get row(s) in sheet                      | ## STEP 1 - Offboarding Process: Users submit their email through an offboarding form; system verifies user and Calendly access.                                        |
| Get row(s) in sheet           | Google Sheets (Lookup)              | Look up user data in sheet by email and Calendly status | Offboarding form                            | If1                                      | ## STEP 1 - Offboarding Process: Users submit their email through an offboarding form; system verifies user and Calendly access.                                        |
| If1                          | If                                 | Check if user exists and has Calendly access        | Get row(s) in sheet                          | Email Agent Offboarding                  | ## STEP 1 - Offboarding Process: Users submit their email through an offboarding form; system verifies user and Calendly access.                                        |
| OpenAI Chat Model1            | LangChain OpenAI Chat Model          | AI model for offboarding email generation           | Email Agent Offboarding                       | Email Agent Offboarding                  | ## STEP 2 -Email notification for HR: AI generates offboarding notification email for HR approval.                                                                     |
| Email Agent Offboarding        | LangChain Agent                     | Generate offboarding HTML email for HR               | If1                                         | Email Man-in-the-loop Offboarding         | ## STEP 2 -Email notification for HR: AI generates offboarding notification email for HR approval.                                                                     |
| Email Man-in-the-loop Offboarding | Gmail                              | Send offboarding email to HR with double approval   | Email Agent Offboarding                       | Approve offboarding?                     | ## STEP 2 -Email notification for HR: AI generates offboarding notification email for HR approval.                                                                     |
| Approve offboarding?           | If                                  | Check HR approval for offboarding                     | Email Man-in-the-loop Offboarding             | Set Calendy Organization id, Form ending1 | ## STEP 2 -Email notification for HR: AI generates offboarding notification email for HR approval.                                                                     |
| Set Calendy Organization id    | Set                                 | Set Calendly organization ID for offboarding API calls | Approve offboarding?                       | Get Calendly User                        | ## STEP 3 - Remove user from Calendly organization: System removes user, updates sheet, and confirms completion.                                                        |
| Get Calendly User             | HTTP Request                        | Retrieve Calendly membership info for user            | Set Calendy Organization id                  | Delete Calendly user                     | ## STEP 3 - Remove user from Calendly organization: System removes user, updates sheet, and confirms completion.                                                        |
| Delete Calendly user          | HTTP Request                        | Delete user from Calendly organization via API        | Get Calendly User                            | Offboarding complete                     | ## STEP 3 - Remove user from Calendly organization: System removes user, updates sheet, and confirms completion.                                                        |
| Offboarding complete          | Google Sheets (Update)              | Update user Calendly status to "off" in sheet         | Delete Calendly user                         | End form page offboarding                | ## STEP 3 - Remove user from Calendly organization: System removes user, updates sheet, and confirms completion.                                                        |
| End form page offboarding      | Form                               | Show offboarding completion message                    | Offboarding complete                         | —                                       | ## STEP 3 - Remove user from Calendly organization: System removes user, updates sheet, and confirms completion.                                                        |
| Form ending1                  | Form                               | Show offboarding not approved message                  | Approve offboarding? (No branch)             | —                                       | ## STEP 3 - Remove user from Calendly organization: System removes user, updates sheet, and confirms completion.                                                        |
| Sticky Note3                 | Sticky Note                        | Overview and project description                        | —                                           | —                                       | # **Calendly Onboarding and Offboarding process** This n8n workflow automates Calendly onboarding and offboarding with human approvals. Prerequisites and setup steps. |
| Sticky Note4                 | Sticky Note                        | Onboarding process step explanation                      | —                                           | —                                       | ## STEP 1 - **Onboarding Process:** Users submit their information through an onboarding form. Set correct Calendly org ID in Set node.                                 |
| Sticky Note5                 | Sticky Note                        | Email notification for HR explanation                    | —                                           | —                                       | ## STEP 2 - Email notification for HR An AI agent generates a professional HTML email notification for HR with manual approval steps.                                   |
| Sticky Note6                 | Sticky Note                        | Add user to Calendly explanation                          | —                                           | —                                       | ## STEP 3 -  Add user to Calendly organization If approved, system adds user via API, updates sheet, and confirms completion.                                           |
| Sticky Note7                 | Sticky Note                        | Offboarding process explanation                           | —                                           | —                                       | ## STEP 1 - Offboarding Process Users submit email through offboarding form; system verifies user and Calendly access.                                                  |
| Sticky Note8                 | Sticky Note                        | Offboarding email notification explanation                | —                                           | —                                       | ## STEP 2 -Email notification for HR An AI agent generates an offboarding notification email for HR approval.                                                          |
| Sticky Note9                 | Sticky Note                        | Remove user from Calendly explanation                      | —                                           | —                                       | ## STEP 3 - Remove user from Calendly organization System removes user via API, updates sheet, and confirms completion.                                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create "Onboarding form" node**  
   - Type: Form Trigger  
   - Configure form with title "Calendly Onboarding"  
   - Fields: First Name (required), Last Name (required), Email (required, type email)  
   - Note webhook ID for external access.

2. **Create "New user" node**  
   - Type: Google Sheets Append  
   - Connect input from "Onboarding form"  
   - Document ID: your Google Sheets document ID  
   - Sheet name: "gid=0" or your target sheet name  
   - Columns: DATE = current date (`{{$now.format('dd/LL/yyyy')}}`), EMAIL = `{{$json.Email}}`, LAST NAME, FIRST NAME from form data, CALENDLY (empty)  
   - Use Google Sheets OAuth2 credentials.

3. **Create "Set Calendy Organization" node**  
   - Type: Set  
   - Assign variable "calendly_organization" with your Calendly organization ID string

4. **Create "Merge" node**  
   - Type: Merge  
   - Mode: combineAll  
   - Connect inputs from "New user" and "Set Calendy Organization"

5. **Create "OpenAI Chat Model" node**  
   - Type: LangChain OpenAI Chat Model  
   - Set model to "gpt-5.1" or preferred GPT version  
   - Connect from "Email Agent Onboarding" node (next step)  
   - Configure with OpenAI API credentials

6. **Create "Email Agent Onboarding" node**  
   - Type: LangChain Agent  
   - Input text template:  
     ```
     First name: {{ $('Onboarding form').item.json['First Name'] }}
     Laste name: {{ $('Onboarding form').item.json['Last Name'] }}
     Email: {{ $('Onboarding form').item.json.Email }}
     ```  
   - System message: instruct to generate a full HTML email notifying HR of onboarding, including user details, man-in-the-loop approval explanation, with a call-to-action button but no approval link in output.  
   - Connect input from "Merge" node  
   - Connect output to "OpenAI Chat Model" node

7. **Create "Email Man-in-the-loop Onboarding" node**  
   - Type: Gmail  
   - SendTo: "info@n3w.it" (replace with HR email)  
   - Subject: "Start Calendly Onboarding for user {{ $('Onboarding form').item.json['First Name'] }} {{ $('Onboarding form').item.json['Last Name'] }}?"  
   - Message HTML: `{{$json.output}}` from AI agent  
   - Operation: sendAndWait with double approval  
   - Approval timeout: 45 minutes  
   - Use Gmail OAuth2 credentials  
   - Connect input from "Email Agent Onboarding" node

8. **Create "Approve onboarding?" node**  
   - Type: If  
   - Condition: `$json.data.approved == true` (boolean true)  
   - Connect input from "Email Man-in-the-loop Onboarding" node  
   - True branch to "Add user to Calendly" node  
   - False branch to "Form ending" node

9. **Create "Add user to Calendly" node**  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://api.calendly.com/organizations/{{ $('Set Calendy Organization').item.json.calendly_organization }}/invitations`  
   - Headers: Authorization Bearer token (replace with your Calendly API token)  
   - Body: JSON with `email` set to `{{ $('New user').item.json.EMAIL }}`  
   - Connect input from "Approve onboarding?" true branch

10. **Create "Onboarding complete" node**  
    - Type: Google Sheets Update  
    - Document and sheet same as before  
    - Matching column: EMAIL  
    - Update CALENDLY column to "on"  
    - Connect input from "Add user to Calendly" node

11. **Create "End form page onboarding" node**  
    - Type: Form  
    - Operation: completion  
    - Completion title: "Onboarding complete"  
    - Completion message: "Onboarding complete"  
    - Connect input from "Onboarding complete" node

12. **Create "Form ending" node**  
    - Type: Form  
    - Operation: completion  
    - Completion title: "Onboarding not approved"  
    - Completion message: "Onboarding not approved"  
    - Connect input from "Approve onboarding?" false branch

13. **Create "Offboarding form" node**  
    - Type: Form Trigger  
    - Form title: "Calendly Offboarding"  
    - Field: Email (required, email type)  
    - Note webhook ID

14. **Create "Get row(s) in sheet" node**  
    - Type: Google Sheets Lookup  
    - Filters: EMAIL = `{{$json.Email}}`, CALENDLY = "on"  
    - Document and sheet same as before  
    - Connect input from "Offboarding form"

15. **Create "If1" node**  
    - Type: If  
    - Condition: Check if row_number exists in result (indicating user found)  
    - Connect input from "Get row(s) in sheet" node  
    - True branch connects to "Email Agent Offboarding" node

16. **Create "OpenAI Chat Model1" node**  
    - Type: LangChain OpenAI Chat Model  
    - Same configuration as onboarding OpenAI node  
    - Connect input from "Email Agent Offboarding" node

17. **Create "Email Agent Offboarding" node**  
    - Type: LangChain Agent  
    - Input text template:  
      ```
      First name: {{ $json['FIRST NAME'] }}
      Laste name: {{ $json['LAST NAME'] }}
      Email: {{ $json.EMAIL }}
      ```  
    - System message: instruct to generate full HTML email notifying HR about offboarding with manual approval explanation and call-to-action button (no approval link in output).  
    - Connect input from "If1" true branch

18. **Create "Email Man-in-the-loop Offboarding" node**  
    - Type: Gmail  
    - SendTo: "info@n3w.it"  
    - Subject: "Start Calendly Offboarding for user {{ $('If1').item.json['FIRST NAME'] }} {{ $('If1').item.json['LAST NAME'] }}?"  
    - Message HTML: `{{$json.output}}` from AI agent  
    - Operation: sendAndWait with double approval  
    - Approval timeout: 45 minutes  
    - Use Gmail OAuth2 credentials  
    - Connect input from "Email Agent Offboarding"

19. **Create "Approve offboarding?" node**  
    - Type: If  
    - Condition: `$json.data.approved == true`  
    - Connect input from "Email Man-in-the-loop Offboarding"  
    - True branch to "Set Calendy Organization id"  
    - False branch to "Form ending1"

20. **Create "Set Calendy Organization id" node**  
    - Type: Set  
    - Assign variable "calendly_organization" with your Calendly organization ID string  
    - Connect input from "Approve offboarding?" true branch

21. **Create "Get Calendly User" node**  
    - Type: HTTP Request  
    - Method: GET  
    - URL: `https://api.calendly.com/organization_memberships?organization=https%3A%2F%2Fapi.calendly.com%2Forganizations%2F{{ $json.calendly_organization }}&email={{ $('Get row(s) in sheet').item.json.EMAIL }}`  
    - Headers: Authorization Bearer token (replace with your Calendly API token)  
    - Connect input from "Set Calendy Organization id"

22. **Create "Delete Calendly user" node**  
    - Type: HTTP Request  
    - Method: DELETE  
    - URL: `{{$json.collection[0].uri}}` (the URI of the membership to delete)  
    - Headers: Authorization Bearer token  
    - Connect input from "Get Calendly User"

23. **Create "Offboarding complete" node**  
    - Type: Google Sheets Update  
    - Document and sheet same as before  
    - Match by EMAIL  
    - Update CALENDLY column to "off"  
    - Connect input from "Delete Calendly user"

24. **Create "End form page offboarding" node**  
    - Type: Form  
    - Operation: completion  
    - Completion title: "Onboarding complete"  
    - Completion message: "Onboarding complete"  
    - Connect input from "Offboarding complete"

25. **Create "Form ending1" node**  
    - Type: Form  
    - Operation: completion  
    - Completion title: "Offboarding not approved"  
    - Completion message: "Offboarding not approved"  
    - Connect input from "Approve offboarding?" false branch

26. **Create Sticky Notes**  
    - Add descriptive sticky notes as per the original workflow for documentation and clarity.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                             | Context or Link                                                                                                   |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| This n8n workflow automates the entire Calendly onboarding and offboarding process with human approvals, using Google Sheets, OpenAI for email generation, and Gmail. | Project overview and design rationale.                                                                           |
| Prerequisites: Clone this [Google Sheets](https://docs.google.com/spreadsheets/d/1Nl_5MmWcDsmZZ3hEwTUXUVfHLbk1B0vKTjqX2hOMHEQ/edit?usp=sharing), set Calendly org ID and tokens. | Setup requirements for service accounts and API credentials.                                                     |
| Use Gmail OAuth2 credentials for sending approval emails with double approval and timeout configuration.                                                               | Gmail node configuration specifics.                                                                               |
| The OpenAI API key is used to generate professional HTML emails via LangChain nodes for HR notification and approval request.                                          | AI agent configuration details.                                                                                   |
| Human approval steps require manual confirmation through Gmail with a double approval mechanism and 45 minutes wait time.                                             | Man-in-the-loop approval process explanation.                                                                     |
| Update all placeholder values such as Calendly organization ID and API tokens before activating the workflow.                                                          | Critical security and configuration reminder.                                                                     |
| The workflow uses form completion nodes to provide user feedback on success or rejection of onboarding/offboarding.                                                    | User experience via forms for process completion.                                                                 |

---

**Disclaimer:** The provided content is exclusively derived from an automated workflow created with n8n. It strictly adheres to content policies and contains no illegal, offensive, or protected material. All data processed is legal and public.