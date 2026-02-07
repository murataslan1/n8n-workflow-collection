Automate Lead Nurturing with ChatGPT-4o & Gemini for Personalized Email Drafting

https://n8nworkflows.xyz/workflows/automate-lead-nurturing-with-chatgpt-4o---gemini-for-personalized-email-drafting-11284


# Automate Lead Nurturing with ChatGPT-4o & Gemini for Personalized Email Drafting

### 1. Workflow Overview

This workflow automates lead nurturing for B2B marketing by capturing lead details via a form or spreadsheet, enriching company information using AI agents (OpenAI ChatGPT-4o and Google Gemini), and drafting personalized introductory emails saved as Gmail drafts. It is designed to streamline the outreach process by integrating data collection, AI-powered research, email composition, and record updates in Google Sheets.

The workflow is logically divided into two main phases with functional blocks:

- **1.1 Lead Capture & Enrichment:** Collect lead data either from a web form or an existing Google Sheet, then enrich each lead’s company information and location by querying AI agents.
- **1.2 Email Drafting & Tracking:** Use enriched lead data to generate tailored introductory email drafts using ChatGPT-4o, save these drafts in Gmail, and update lead status and metadata back in Google Sheets.

---

### 2. Block-by-Block Analysis

#### 2.1 Lead Capture & Enrichment

**Overview:**  
This block captures lead information either from a form submission or an existing Google Sheet. It then uses AI to research and enrich company description and location data to augment the lead profile before email drafting.

**Nodes Involved:**  
- On form submission  
- Append row in sheet  
- AI Agent (LangChain agent)  
- Google Gemini Chat Model  
- HTTP Request (AI tool placeholder)  
- Code (JS data parser)  
- Update row in sheet  
- Sticky Note (Lead Collection form)

**Node Details:**

- **On form submission**  
  - *Type:* Form Trigger  
  - *Role:* Entry point capturing lead details from a web form with fields for first name, last name, company name, designation, email, and message.  
  - *Config:* Form titled "Let's Talk AI marketing automation" with required and optional fields.  
  - *Inputs:* External form submission webhook.  
  - *Outputs:* Passes form data downstream.  
  - *Failure modes:* Webhook connectivity, missing required fields.  
  - *Sticky note:* Explains this step is optional and assists AI enrichment.

- **Append row in sheet**  
  - *Type:* Google Sheets Append  
  - *Role:* Saves captured form data into a Google Sheet with status "To Send".  
  - *Config:* Maps form fields to sheet columns, no matching criteria (always appends).  
  - *Inputs:* Form submission data.  
  - *Outputs:* New sheet row created, forwarded to AI Agent.  
  - *Failure modes:* Google Sheets API auth errors, quota limits.

- **AI Agent (LangChain agent)**  
  - *Type:* LangChain agent node (custom AI prompt executor)  
  - *Role:* Searches online and generates a concise description and location for the lead’s company.  
  - *Config:* Custom prompt requesting company description and closest office location from specified options.  
  - *Inputs:* Lead data from sheet or form.  
  - *Outputs:* Raw AI output text with company description and location.  
  - *Failure modes:* API errors, prompt parsing issues, rate limits.

- **Google Gemini Chat Model**  
  - *Type:* LangChain Google Gemini chat model node  
  - *Role:* Acts as AI language model used by the AI Agent for generating company info.  
  - *Config:* Credentials for Google PaLM API; no additional parameters specified.  
  - *Inputs/Outputs:* AI Agent passes prompt and receives response.  
  - *Failure modes:* API quota, auth failure.

- **HTTP Request (AI tool placeholder)**  
  - *Type:* HTTP Request Tool  
  - *Role:* Placeholder or extension point for AI tool calls, currently used internally by AI Agent.  
  - *Failure modes:* Network errors, invalid URLs.

- **Code (JS data parser)**  
  - *Type:* Code node (JavaScript)  
  - *Role:* Parses AI Agent’s raw text output to extract structured fields: companyDescription and companyLocation.  
  - *Config:* Splits text by "Company Location", cleans prefixes and whitespace.  
  - *Inputs:* Raw AI text output.  
  - *Outputs:* JSON with parsed fields added.  
  - *Failure modes:* Unexpected AI output format causing parsing errors.

- **Update row in sheet**  
  - *Type:* Google Sheets Update  
  - *Role:* Updates lead row with enriched company information and location.  
  - *Config:* Matches on Email ID; updates "Company Information" and "Location" columns.  
  - *Inputs:* Parsed AI data and original lead data.  
  - *Outputs:* Updated sheet row; triggers next phase.  
  - *Failure modes:* Sheet permissions, matching failures if Email ID missing.

- **Sticky Note (Lead Collection form)**  
  - *Content:* Explains the lead collection form step is optional and assists AI enrichment.

---

#### 2.2 Email Drafting & Tracking

**Overview:**  
This block reads leads marked "To Send" from the Google Sheet, generates personalized introductory emails using ChatGPT-4o, creates Gmail drafts for review, and updates lead status and metadata in the sheet accordingly.

**Nodes Involved:**  
- Get row(s) in sheet  
- Introductory email (OpenAI ChatGPT-4o)  
- Create a draft (Gmail)  
- Append or update row in sheet  
- Sticky Note1 (Email Drafting and Sheet Update)  
- Sticky Note2 (Main workflow explanation)

**Node Details:**

- **Get row(s) in sheet**  
  - *Type:* Google Sheets Read  
  - *Role:* Fetches all lead rows with "Status" either "To send" or "To Send" (case variations).  
  - *Config:* Filters on Status column with OR condition.  
  - *Inputs:* Triggered after enrichment update or scheduled trigger.  
  - *Outputs:* Leads needing emails drafted.  
  - *Failure modes:* API errors, empty results.

- **Introductory email**  
  - *Type:* LangChain OpenAI ChatGPT node (chat completion)  
  - *Role:* Generates personalized email subject and content using a prompt template.  
  - *Config:*  
    - Model: chatgpt-4o-latest  
    - Messages include an assistant role defining task, and a system role with a detailed prompt template using lead JSON data: First Name, Company Name, Company Information, Message, Email ID.  
    - Output JSON contains two variables: EmailSubject and EmailContent.  
  - *Inputs:* Lead data from sheet.  
  - *Outputs:* JSON with email subject, content, and email ID.  
  - *Failure modes:* API rate limits, prompt formatting issues.

- **Create a draft**  
  - *Type:* Gmail node (draft creation)  
  - *Role:* Creates an email draft in Gmail with generated subject and content, addressed to the lead’s Email ID.  
  - *Config:* Uses OAuth2 Gmail credentials; message content and subject from AI output JSON; resource set to draft.  
  - *Inputs:* Email content JSON from AI node.  
  - *Outputs:* Draft created confirmation.  
  - *Failure modes:* Gmail API auth errors, draft creation failures.

- **Append or update row in sheet**  
  - *Type:* Google Sheets AppendOrUpdate  
  - *Role:* Updates the lead row status to "Drafted", adds the email ID and timestamp of the introductory email.  
  - *Config:* Matches on "Email ID", updates columns: Status, Email ID, Intro email Date.  
  - *Inputs:* Output from draft creation node.  
  - *Outputs:* Updated spreadsheet row.  
  - *Failure modes:* Sheet locking, permission issues.

- **Sticky Note1 (Email Drafting and Sheet Update)**  
  - *Content:* Key notes on email drafts: emails are saved as drafts (not sent), recommendation to add auto-signature in Gmail account, and to customize AI prompt for optimal results.

- **Sticky Note2 (Main workflow explanation)**  
  - *Content:* Describes overall workflow phases, setup instructions for research prompt, email structure, and sender email ID.

---

### 3. Summary Table

| Node Name             | Node Type                     | Functional Role                           | Input Node(s)               | Output Node(s)             | Sticky Note                                                                                           |
|-----------------------|-------------------------------|------------------------------------------|-----------------------------|----------------------------|-----------------------------------------------------------------------------------------------------|
| On form submission     | Form Trigger                  | Captures lead data from web form         | -                           | Append row in sheet         | ## Lead Collection form<br>**The step is optional.** The AI agent searches details and location about the lead for assistance. |
| Append row in sheet    | Google Sheets Append          | Saves form data to Google Sheet           | On form submission          | AI Agent                   |                                                                                                     |
| AI Agent              | LangChain Agent               | Enriches lead info with company details   | Append row in sheet         | Code                       |                                                                                                     |
| Google Gemini Chat Model | LangChain Google Gemini LM  | AI language model for company research    | AI Agent                    | AI Agent                   |                                                                                                     |
| HTTP Request          | HTTP Request Tool             | AI tool support (internal link)           | AI Agent                    | AI Agent                   |                                                                                                     |
| Code                  | Code (JavaScript)             | Parses AI output into fields               | AI Agent                    | Update row in sheet        |                                                                                                     |
| Update row in sheet   | Google Sheets Update          | Updates lead row with enriched info       | Code                        | Get row(s) in sheet        |                                                                                                     |
| Get row(s) in sheet   | Google Sheets Read            | Reads leads with status "To Send"          | Update row in sheet         | Introductory email         |                                                                                                     |
| Introductory email     | LangChain OpenAI ChatGPT      | Generates personalized email drafts        | Get row(s) in sheet         | Create a draft             | ## Introductory Email Drafting and sheet updation<br>**Must know below details.**<br>1- Email would be kept in draft and not sent<br>2- Best practice to add auto-signature in email account used for gmail<br>3- Update agent prompt to teach about your company for best result. |
| Create a draft         | Gmail (draft creation)        | Saves email draft in Gmail                  | Introductory email          | Append or update row in sheet |                                                                                                     |
| Append or update row in sheet | Google Sheets AppendOrUpdate | Updates lead status & metadata post draft | Create a draft              | -                          |                                                                                                     |
| Sticky Note            | Sticky Note                   | Lead collection form explanation           | -                           | -                          | ## Lead Collection form<br>**The step is optional.** The AI agent searches details and location about the lead for assistance. |
| Sticky Note1           | Sticky Note                   | Notes on email drafting & updating sheet   | -                           | -                          | ## Introductory Email Drafting and sheet updation<br>**Must know below details.**<br>1- Email would be kept in draft and not sent<br>2- Best practice to add auto-signature in email account used for gmail<br>3- Update agent prompt to teach about your company for best result. |
| Sticky Note2           | Sticky Note                   | Main workflow explanation                   | -                           | -                          | ## Main Sticky<br>**How it works**<br>Phase 1: collects user enquiry to a sheet; AI enriches company info.<br>Phase 2: generates personalized email draft saved in Gmail.<br>**How to setup**: define research prompt, email structure, and sender email ID. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Form Trigger node ("On form submission")**  
   - Type: Form Trigger  
   - Configure form titled "Let's Talk AI marketing automation" with fields:  
     - First name (text, required)  
     - Last Name (text, required)  
     - Company name (text, required)  
     - Designation (text, optional)  
     - Email Id (email, required)  
     - Message (textarea, required)  
   - Set button label: "Let's talk"  
   - Set webhook ID (auto-generated)  

2. **Create a Google Sheets Append node ("Append row in sheet")**  
   - Connect input from "On form submission"  
   - Document ID: [Your Google Sheet ID]  
   - Sheet name: gid=0 (Sheet1) or your target sheet  
   - Operation: Append  
   - Map columns: Status="To Send", and form fields accordingly (First Name, Last Name, Email ID, Company Name, Designation, Message)  
   - Use Google Sheets OAuth2 credentials  

3. **Create a LangChain Agent node ("AI Agent")**  
   - Connect input from "Append row in sheet"  
   - Configure prompt:  
     ```
     Search online and write 2-3 sentences about the company -  {{ $json['Company Name'] }}
     Capture as to what they do.
     Capture the location of closes office.
     Give output in below format

     CompanyDescription - 1-2 sentences
     CompanyLocation - Should be either of these - Delhi/NCR, bangalore, Mumbai, Other
     ```
   - Use Google Gemini Chat Model as AI language model (next step)  

4. **Create a LangChain Google Gemini Chat Model node ("Google Gemini Chat Model")**  
   - Connect to "AI Agent" node's AI language model input  
   - Set credentials with Google PaLM API OAuth2  

5. **Create an HTTP Request node ("HTTP Request")**  
   - Connect as needed internally by AI Agent (typically auto-configured)  
   - No special config needed unless extending AI calls  

6. **Create a Code node ("Code") to parse AI output**  
   - Connect input from "AI Agent"  
   - Paste JavaScript code:  
     ```js
     const inputText = $input.first().json.output

     // Split by "Company Location"
     const parts = inputText.split("Company Location");

     // Extract description (remove "Company Description -" prefix)
     const companyDescription = parts[0]
       .replace('Company Description -', '')
       .replace(/\n/g, ' ')
       .trim();

     // Extract location (remove "-" prefix)
     const companyLocation = parts[1]
       ? parts[1].replace('-', '').replace(/\n/g, ' ').trim()
       : '';

     return {
       ...$json,
       companyDescription: companyDescription,
       companyLocation: companyLocation
     };
     ```
7. **Create a Google Sheets Update node ("Update row in sheet")**  
   - Connect input from "Code" node  
   - Document ID and sheet name same as step 2  
   - Operation: Update  
   - Matching column: "Email ID"  
   - Update columns: "Company Information" = companyDescription, "Location" = companyLocation  
   - Use Google Sheets OAuth2 credentials  

8. **Create a Google Sheets Read node ("Get row(s) in sheet")**  
   - Connect input from "Update row in sheet"  
   - Document ID and sheet as before  
   - Operation: Read rows  
   - Filter rows where "Status" == "To send" OR "To Send" (case variations)  
   - Use Google Sheets OAuth2 credentials  

9. **Create a LangChain OpenAI ChatGPT node ("Introductory email")**  
   - Connect input from "Get row(s) in sheet"  
   - Model: chatgpt-4o-latest  
   - Messages:  
     - Assistant role: "You are a helpful B2B marketing assistant who will write introductory email to potential leads."  
     - System role: Provide prompt template including variables for First Name, Company Name, Company Information, Message, Email ID, and instructions to generate EmailSubject and EmailContent variables based on the provided template.  
   - Enable JSON output for parsed variables  
   - Use OpenAI API credentials  

10. **Create a Gmail node ("Create a draft")**  
    - Connect input from "Introductory email"  
    - Operation: Create draft  
    - Subject: Use EmailSubject from AI output JSON  
    - Message body: Use EmailContent from AI output JSON  
    - Recipient: Use Emailid from AI output JSON  
    - Use Gmail OAuth2 credentials  

11. **Create a Google Sheets AppendOrUpdate node ("Append or update row in sheet")**  
    - Connect input from "Create a draft"  
    - Document ID and sheet as before  
    - Operation: Append or Update  
    - Match on "Email ID"  
    - Update columns: "Status" = "Drafted", "Email ID" = Emailid, "Intro email Date" = current timestamp ($now)  
    - Use Google Sheets OAuth2 credentials  

12. **Add Sticky Notes for documentation**  
    - Create three Sticky Note nodes with content:  
      - Lead Collection form explanation (optional step)  
      - Introductory Email Drafting and sheet update notes (draft only, auto-signature advice, prompt customization)  
      - Main workflow explanation (phase overview and setup instructions)  
    - Position notes near relevant nodes for clarity  

13. **Connect all nodes as per dependencies described:**  
    - Form submission → Append row → AI Agent → Code → Update row → Get rows → Intro email → Create draft → Append/update row  
    - For existing sheet data, trigger Get rows → Intro email → Create draft → Append/update row  

---

### 5. General Notes & Resources

| Note Content | Context or Link |
|--------------|-----------------|
| Use "Draft" status emails to avoid accidental sends; review drafts in Gmail before sending. | Workflow best practice |
| The AI prompt templates should be customized to reflect your company’s tone and offerings for best results. | Email drafting guidance |
| Google Gemini (PaLM) and OpenAI ChatGPT-4o APIs require respective account credentials with quota and billing enabled. | API credentials and setup |
| Lead capture via form is optional; leads can be imported or added manually to the Google Sheet. | Lead capture flexibility |
| For Gmail OAuth2, configure scopes to allow draft creation and email sending permissions. | Gmail OAuth2 configuration |
| Sticky notes in the workflow explain key steps for maintenance and user understanding. | Workflow documentation |

---

**Disclaimer:** The provided text is derived exclusively from an automated n8n workflow designed for lead nurturing automation using AI models. All data processed are legal and public; no illegal or offensive content is involved.