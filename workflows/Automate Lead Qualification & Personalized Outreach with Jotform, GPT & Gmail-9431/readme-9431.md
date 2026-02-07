Automate Lead Qualification & Personalized Outreach with Jotform, GPT & Gmail

https://n8nworkflows.xyz/workflows/automate-lead-qualification---personalized-outreach-with-jotform--gpt---gmail-9431


# Automate Lead Qualification & Personalized Outreach with Jotform, GPT & Gmail

### 1. Workflow Overview

This n8n workflow automates lead qualification and personalized outreach by integrating form submissions from JotForm, AI-driven website analysis via OpenAI GPT, and Gmail for communication. Its main objective is to intake demo requests, filter out unqualified leads (specifically personal emails), analyze the prospect’s business website to tailor personalized outreach emails, and route the communication either as a regret email (for unqualified leads) or as a personalized outreach email pending human approval.

The workflow is logically divided into three main blocks:

- **1.1 Lead Intake & Qualification:** Captures incoming lead data via JotForm, extracts email domains, flags personal email addresses, and routes leads accordingly.
- **1.2 Website Scraping & AI Analysis:** For qualified business leads, scrapes their website HTML content, summarizes key business information using OpenAI GPT, and performs detailed lead analysis and email drafting with an AI sales agent.
- **1.3 Human Approval & Email Dispatch:** Sends the AI-drafted email for human approval via Gmail, then either sends the personalized outreach email or a regret email based on lead qualification.

---

### 2. Block-by-Block Analysis

---

#### 2.1 Lead Intake & Qualification

**Overview:**  
This block captures new demo requests submitted via a JotForm, extracts the lead’s email domain, flags if the email is from a personal/common provider (e.g., Gmail, Yahoo), and routes leads accordingly—qualified business leads proceed to website scraping and AI analysis, while personal emails receive a regret email.

**Nodes Involved:**  
- JotForm Trigger  
- Extract Domain (Code)  
- Flag personal email addresses (Code)  
- Is Personal Email? (If)  
- Send Regret Email (Gmail)  

**Node Details:**

- **JotForm Trigger**  
  - *Type:* JotForm webhook trigger  
  - *Configuration:* Listens to submissions from a specific form ID (252815075257460) via webhook.  
  - *Input/Output:* Initiates workflow with form data including "E-mail" and "Full Name".  
  - *Failure Potential:* Webhook misconfiguration, API credential expiration.  
  - *Notes:* Captures inbound demo requests as lead intake.

- **Extract Domain**  
  - *Type:* Code (JavaScript)  
  - *Purpose:* Parses the submitted email address to extract the domain, then formats it as a URL string (e.g., https://domain.com).  
  - *Key Expression:* Splits email on '@' and prepends 'https://' to domain part.  
  - *Input:* Email address from JotForm Trigger  
  - *Output:* JSON object with `websiteDomain` property  
  - *Failure Types:* Missing or malformed email address leads to null domain.

- **Flag personal email addresses**  
  - *Type:* Code (JavaScript, runOnceForEachItem)  
  - *Purpose:* Checks if the extracted domain matches a list of common personal email providers (e.g., gmail, yahoo, outlook).  
  - *Key Logic:* Compares main domain part (before first dot) against a predefined array of personal email providers. Flags `isPersonalEmail` true/false accordingly.  
  - *Input:* `websiteDomain` from previous node  
  - *Output:* Adds `isPersonalEmail` boolean to JSON  
  - *Edge Cases:* Domains with unusual subdomains may lead to false negatives/positives.

- **Is Personal Email? (If node)**  
  - *Type:* Conditional branching node  
  - *Condition:* Checks if `isPersonalEmail` is true  
  - *Output:*  
    - True branch → Send Regret Email  
    - False branch → Proceed to Scrape Website  
  - *Failure:* Expression errors if `isPersonalEmail` missing or improperly typed.

- **Send Regret Email (Gmail node)**  
  - *Type:* Gmail send email  
  - *Configuration:* Sends a polite rejection email to personal email leads explaining why they don’t qualify, with an invitation to reconnect in the future. Uses form data for personalization (recipient name).  
  - *Input:* Email and name from JotForm Trigger  
  - *Output:* Email dispatch confirmation  
  - *Failures:* Gmail authentication errors, rate limits, invalid email addresses.

---

#### 2.2 Website Scraping & AI Analysis

**Overview:**  
For qualified business leads, the workflow scrapes the lead’s website HTML content, summarizes it via OpenAI GPT, and passes the summary to an AI sales agent which analyzes the prospect’s profile, scores the fit, identifies key pain points, and drafts a personalized outreach email.

**Nodes Involved:**  
- Scrape Website (URL to HTML)  
- Summarize website (OpenAI GPT)  
- AI Sales Agent (Langchain agent node)  
- OpenAI Chat Model (GPT-4.1-mini)  
- Structured Output Parser  

**Node Details:**

- **Scrape Website**  
  - *Type:* URL to HTML scraping node  
  - *Configuration:* Fetches the full HTML content from the domain extracted earlier.  
  - *Input:* `websiteDomain` URL string from previous block  
  - *Output:* Raw HTML content of the website  
  - *Failures:* Network errors, site blocking requests, invalid URL, timeouts.

- **Summarize website**  
  - *Type:* OpenAI GPT text generation  
  - *Configuration:* Uses GPT-4.1-mini model to produce a markdown summary of the scraped HTML, focusing on industry, offerings, and recent business activities.  
  - *Input:* HTML content from Scrape Website node  
  - *Output:* Markdown summary string  
  - *Failures:* API quota limits, malformed input, timeout, rate limiting.

- **AI Sales Agent**  
  - *Type:* Langchain AI Agent node  
  - *Configuration:* Receives website summary, lead email, and extracted domain info; instructed via prompt to analyze the prospect’s business, score fit, and draft a concise, well-formatted HTML outreach email using markdown reasoning.  
  - *Input:* Website summary and lead info  
  - *Output:* Structured JSON including ICP fit, reasoning, email subject, and HTML email body.  
  - *Edge Cases:* Ambiguous website content may reduce analysis quality; prompt failure or incomplete output.

- **OpenAI Chat Model**  
  - *Type:* Language model node (GPT-4.1-mini)  
  - *Role:* Serves as the underlying AI model powering the AI Sales Agent node.  
  - *Input/Output:* Receives prompt from AI Sales Agent and returns AI-generated content.  
  - *Failures:* API errors, misconfiguration of credentials.

- **Structured Output Parser**  
  - *Type:* Output parser node for AI responses  
  - *Configuration:* Enforces a JSON schema to ensure the AI Sales Agent’s output includes required fields: industry, markdown reasoning, ICP score, email subject, and HTML email body.  
  - *Input:* Raw AI output  
  - *Output:* Parsed and validated structured JSON for downstream use  
  - *Failures:* Parsing errors if AI output is malformed or incomplete.

---

#### 2.3 Human Approval & Email Dispatch

**Overview:**  
This block sends the AI-drafted outreach email to a human reviewer via Gmail for approval. Upon approval, the email is sent to the lead. If the lead was flagged as personal email, a regret email is sent instead (covered in Block 2.1).

**Nodes Involved:**  
- Wait for Approval (Gmail sendAndWait)  
- Send Welcome Email (Gmail send)  

**Node Details:**

- **Wait for Approval**  
  - *Type:* Gmail node with sendAndWait operation  
  - *Configuration:* Sends the draft email to a designated reviewer (jitesh@mediajade.com) requesting approval. Includes subject and full HTML body from AI Sales Agent output in the message body. Waits for a reply before continuing.  
  - *Input:* Draft email subject and body from AI Sales Agent output  
  - *Output:* Trigger to proceed once approval reply received  
  - *Failures:* Gmail auth failures, timeout if no reply, spam filtering.

- **Send Welcome Email**  
  - *Type:* Gmail send email  
  - *Configuration:* Sends the approved personalized outreach email to the lead’s email address. Uses the AI-generated subject and HTML body. Attribution is disabled to keep branding consistent.  
  - *Input:* Email address from JotForm, subject and body from AI Sales Agent  
  - *Output:* Confirmation of sent personalized email  
  - *Failures:* Gmail API limits, invalid recipient address, auth issues.

---

### 3. Summary Table

| Node Name                 | Node Type                     | Functional Role                                  | Input Node(s)          | Output Node(s)            | Sticky Note                                                                                                                           |
|---------------------------|-------------------------------|-------------------------------------------------|------------------------|---------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| JotForm Trigger           | JotForm Trigger                | Captures lead form submissions                   | -                      | Extract Domain             | 📧 Lead Intake & Email Qualification: captures demo requests and filters personal emails.                                            |
| Extract Domain            | Code                          | Extracts domain part of lead email                | JotForm Trigger        | Flag personal email addresses | 📧 Lead Intake & Email Qualification: extracts domain for qualification.                                                              |
| Flag personal email addresses | Code                     | Flags emails from common personal providers       | Extract Domain         | Is Personal Email?         | 📧 Lead Intake & Email Qualification: flags personal emails like Gmail, Yahoo, Outlook.                                               |
| Is Personal Email?        | If                            | Routes lead based on personal email flag          | Flag personal email addresses | Send Regret Email / Scrape Website | 📧 Lead Intake & Email Qualification: routes leads; personal emails get regret email, else proceed.                                   |
| Send Regret Email         | Gmail                         | Sends polite rejection email to unqualified leads | Is Personal Email? (true) | -                         | ❌ Send Regret Email: politely declines unqualified leads with invitation to reconnect later.                                          |
| Scrape Website            | URL to HTML                   | Scrapes full HTML content of lead's website       | Is Personal Email? (false) | Summarize website          | 🕷️ Scrape & Summarize Company Website: extracts and analyzes prospect website content.                                                |
| Summarize website         | OpenAI (GPT)                  | Summarizes scraped website content in markdown   | Scrape Website          | AI Sales Agent             | 🕷️ Scrape & Summarize Company Website: AI extracts key business info from HTML.                                                      |
| AI Sales Agent            | Langchain agent               | Analyzes lead and drafts personalized email       | Summarize website       | Wait for Approval          | 🤖 Personalized Email: AI agent analyzes lead and drafts outreach email for human approval.                                           |
| OpenAI Chat Model         | Langchain LM (GPT-4.1-mini)  | Provides GPT model for AI Sales Agent             | AI Sales Agent (ai_languageModel) | AI Sales Agent           | 🤖 Personalized Email: powers AI Sales Agent with GPT-4.1-mini.                                                                       |
| Structured Output Parser  | Langchain Output Parser       | Validates and structures AI Sales Agent output   | AI Sales Agent          | AI Sales Agent             | 🤖 Personalized Email: ensures structured AI output for consistent email drafting.                                                    |
| Wait for Approval         | Gmail (sendAndWait)           | Sends draft email for human approval and waits   | AI Sales Agent          | Send Welcome Email         | 🤖 Personalized Email: human review before sending email to lead.                                                                     |
| Send Welcome Email        | Gmail                         | Sends approved personalized outreach email       | Wait for Approval       | -                         | 🤖 Personalized Email: sends personalized welcome email after approval.                                                               |
| Sticky Note1              | Sticky Note                   | Describes AI personalized email analysis flow    | -                      | -                         | 🤖 Personalized Email: details AI analysis, human review, and email sending flow.                                                     |
| Sticky Note2              | Sticky Note                   | Describes lead intake and email qualification flow | -                      | -                         | 📧 Lead Intake & Email Qualification: overview of capturing and qualifying leads workflow.                                            |
| Sticky Note3              | Sticky Note                   | Describes website scraping and summarization flow | -                      | -                         | 🕷️ Scrape & Summarize Company Website: explains website scraping and AI summarization process.                                        |
| Sticky Note               | Sticky Note                   | Describes regret email sending flow               | -                      | -                         | ❌ Send Regret Email: explains polite rejection email purpose and content.                                                             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create JotForm Trigger Node**  
   - Type: JotForm Trigger  
   - Configure webhook with JotForm form ID: `252815075257460`  
   - Set credentials for JotForm API access.

2. **Add Extract Domain Node (Code)**  
   - Type: Code  
   - Configure JavaScript to extract domain from `'E-mail'` field of form submission and prepend `https://`  
   - Input: Output from JotForm Trigger  
   - Output: JSON with `websiteDomain`

3. **Add Flag personal email addresses Node (Code)**  
   - Type: Code (runOnceForEachItem)  
   - Use JavaScript to check `websiteDomain` domain part against a list of common personal email providers (gmail, yahoo, outlook, etc.)  
   - Output: Add boolean `isPersonalEmail` to JSON

4. **Add If Node "Is Personal Email?"**  
   - Condition: `{{ $json.isPersonalEmail }} == true`  
   - True branch: Send Regret Email  
   - False branch: Scrape Website

5. **Add Send Regret Email Node (Gmail)**  
   - Type: Gmail send email  
   - Configure to send to email from form submission  
   - Subject: "Re: Your ClareVoice Demo Request"  
   - Body: Polite rejection message referencing lead’s name (form field)  
   - Credentials: Gmail OAuth2 with sending account

6. **Add Scrape Website Node (URL to HTML)**  
   - Type: URL to HTML  
   - Configure to scrape URL from `websiteDomain` field  
   - Credentials: URL to HTML API key/account

7. **Add Summarize website Node (OpenAI GPT)**  
   - Type: OpenAI node using GPT-4.1-mini  
   - Prompt: Summarize scraped HTML into markdown highlighting industry, offerings, and business signals  
   - Credentials: OpenAI API key

8. **Add AI Sales Agent Node (Langchain agent)**  
   - Configure prompt to analyze lead info and website summary, score ICP fit, identify pain points, and draft personalized outreach email in HTML with markdown reasoning  
   - Link AI Sales Agent node’s language model input to OpenAI Chat Model node (GPT-4.1-mini)  
   - Connect output parser to Structured Output Parser node

9. **Add OpenAI Chat Model Node**  
   - Model: GPT-4.1-mini  
   - Credentials: OpenAI API key

10. **Add Structured Output Parser Node**  
    - Define JSON schema expecting industry, markdown reasoning, ICP score, email subject, and HTML body  
    - Connect output from AI Sales Agent into this parser

11. **Add Wait for Approval Node (Gmail sendAndWait)**  
    - Configure to send drafted email (subject and HTML body) to internal reviewer email (e.g., jitesh@mediajade.com)  
    - Wait for reply before proceeding  
    - Credentials: Gmail OAuth2

12. **Add Send Welcome Email Node (Gmail send)**  
    - Send personalized outreach email to lead’s email address  
    - Use subject and HTML body from AI Sales Agent output  
    - Credentials: Gmail OAuth2

13. **Connect Nodes in Proper Order**  
    - JotForm Trigger → Extract Domain → Flag personal email addresses → Is Personal Email?  
    - True branch → Send Regret Email  
    - False branch → Scrape Website → Summarize website → AI Sales Agent → Wait for Approval → Send Welcome Email

14. **Add Sticky Notes (Optional but Recommended)**  
    - For each logical block, add sticky notes summarizing purpose and flow for maintainability.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                     | Context or Link                                                                                         |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| JotForm is used for lead capture; sign up link provided: https://www.jotform.com/?partner=mediajade                                                                                            | Lead Intake & Email Qualification block                                                              |
| The workflow relies on OpenAI GPT-4.1-mini model for AI summarization and lead analysis; requires valid API credentials                                                                       | AI Sales Agent and Summarize website nodes                                                           |
| Gmail OAuth2 credentials must be set up with appropriate scopes for sending emails and reading replies (for sendAndWait node)                                                                  | Email sending and approval nodes                                                                       |
| URL to HTML scraping node requires account with URL scraping service; ensure the target websites allow scraping to avoid blocking                                                               | Scrape Website node                                                                                     |
| The polite regret email maintains professional branding and leaves open the possibility for future engagement with leads flagged as personal emails                                          | Send Regret Email node                                                                                  |
| Human approval step is critical to ensure email quality and prevent inappropriate outreach; the workflow pauses until approval reply is received                                              | Wait for Approval node                                                                                   |

---

This document fully details the “Automate Lead Qualification & Personalized Outreach with Jotform, GPT & Gmail” workflow, enabling reproduction, modification, and troubleshooting by advanced users or AI-driven automation agents.