Automate Sales Pipeline with HubSpot CRM, ScrapeGraphAI & Google Sheets Dashboard

https://n8nworkflows.xyz/workflows/automate-sales-pipeline-with-hubspot-crm--scrapegraphai---google-sheets-dashboard-6432


# Automate Sales Pipeline with HubSpot CRM, ScrapeGraphAI & Google Sheets Dashboard

### 1. Workflow Overview

This workflow, titled **Sales Pipeline Automation Dashboard**, automates the end-to-end process of capturing, enriching, scoring, qualifying, and routing sales leads. It targets sales teams using HubSpot CRM, integrating AI-powered data extraction from CRM dashboards and external sources (LinkedIn, Crunchbase), and automates follow-up and notification workflows. The workflow also logs data into a Google Sheets dashboard for analytics.

**Use cases:**  
- Automating lead ingestion from multiple sources (scheduled and webhook triggers)  
- Enriching leads with company and financial data via AI scraping  
- Applying advanced lead scoring and qualification logic  
- Creating CRM contacts, deals, and tasks automatically  
- Sending personalized welcome emails and Slack notifications  
- Maintaining a live analytics dashboard for sales performance tracking  

**Logical blocks:**

- **1.1 Lead Input Reception**: Dual triggers for lead data ingestion (scheduled and webhook)  
- **1.2 AI Data Extraction**: Scraping CRM leads, company info, and financial data from external sites  
- **1.3 Lead Intelligence Processing**: Advanced JavaScript node for scoring, qualification, and sales action recommendations  
- **1.4 Lead Categorization & Routing**: Conditional routing based on qualification category  
- **1.5 CRM Integration & Automation**: Creating contacts, deals, tasks in HubSpot CRM  
- **1.6 Communication & Collaboration**: Sending emails, Slack notifications, and logging to Google Sheets dashboard  
- **1.7 Setup & Configuration Notes**: Documentation nodes providing setup guidance and workflow overview  

---

### 2. Block-by-Block Analysis

#### 1.1 Lead Input Reception

**Overview:**  
Captures new leads either on a schedule (every 2 hours) or in real-time via webhook, ensuring no lead is missed.

**Nodes Involved:**  
- Automated Lead Monitor Trigger  
- CRM New Lead Webhook Trigger

**Node Details:**

- **Automated Lead Monitor Trigger**  
  - Type: Schedule Trigger  
  - Configuration: Fires every 2 hours to initiate lead scraping from CRM dashboard in batch mode.  
  - Inputs: None (trigger node)  
  - Outputs: To AI CRM Leads Scraper  
  - Edge cases: Missed schedules due to downtime; frequency should be adjusted based on lead volume.

- **CRM New Lead Webhook Trigger**  
  - Type: Webhook  
  - Configuration: HTTP POST endpoint at path `/new-lead-webhook` to receive real-time lead notifications.  
  - Inputs: External HTTP POST requests from CRM or integration source  
  - Outputs: To AI CRM Leads Scraper  
  - Edge cases: Webhook failure or downtime; noResponseBody=false ensures acknowledgement; fallback logic recommended.

---

#### 1.2 AI Data Extraction

**Overview:**  
Uses ScrapeGraph AI nodes to extract structured lead, company, and financial data from CRM dashboard and external sources.

**Nodes Involved:**  
- AI CRM Leads Scraper  
- AI Company Enrichment Scraper  
- AI Financial Data Scraper

**Node Details:**

- **AI CRM Leads Scraper**  
  - Type: ScrapeGraph AI  
  - Role: Extracts new lead details from CRM dashboard URL, using a detailed JSON schema prompt focusing on lead attributes.  
  - Configuration: URL points to CRM leads dashboard filtered for new leads; userPrompt defines extraction schema.  
  - Inputs: From triggers  
  - Outputs: To AI Company Enrichment Scraper and AI Financial Data Scraper  
  - Requirements: Valid ScrapeGraph AI API credentials; CRM dashboard URL must be accessible and stable.  
  - Edge cases: Changes in dashboard layout may break extraction; null or missing fields handled by prompt schema.

- **AI Company Enrichment Scraper**  
  - Type: ScrapeGraph AI  
  - Role: Enriches lead data with detailed company intelligence from LinkedIn company pages (industry, size, key personnel, news).  
  - Configuration: URL dynamically constructed from company name, sanitized for LinkedIn URL format; custom JSON schema prompt.  
  - Inputs: From AI CRM Leads Scraper  
  - Outputs: To Lead Intelligence Processor  
  - Edge cases: LinkedIn page structure changes; company name sanitization errors; credential errors.

- **AI Financial Data Scraper**  
  - Type: ScrapeGraph AI  
  - Role: Extracts funding and financial data from Crunchbase company profiles for lead qualification.  
  - Configuration: URL dynamically constructed from company name; detailed JSON schema for funding rounds, revenue estimates, investors.  
  - Inputs: From AI CRM Leads Scraper  
  - Outputs: To Lead Intelligence Processor  
  - Edge cases: Crunchbase page variations; rate limits or API errors; missing financial data.

---

#### 1.3 Lead Intelligence Processing

**Overview:**  
Complex JavaScript node processes all input data to score leads (0-100), qualify them by grade and category, and generate tailored sales actions.

**Nodes Involved:**  
- Lead Intelligence Processor

**Node Details:**

- Type: Code (JavaScript)  
- Role: Implements multi-factor lead scoring and qualification logic, combining lead info, company enrichment, and financial data.  
- Key configuration:  
  - Lead scoring weights defined for company size, industry fit, funding stage, lead source, job title, engagement, and traction.  
  - Qualification grades (A+, A, B+, etc.) derived from score thresholds.  
  - Sales actions (immediate emails, follow-up sequences, rep assignments) personalized by lead category.  
- Inputs: Aggregated data from AI scrapers  
- Outputs: To Lead Categorization Splitter  
- Edge cases: Handling missing or malformed data; exception catch logs errors without breaking workflow.  
- Version: Uses n8n v2 code node features.

---

#### 1.4 Lead Categorization & Routing

**Overview:**  
Conditional logic node routes leads based on their qualification category to subsequent CRM and communication nodes.

**Nodes Involved:**  
- Lead Categorization Splitter

**Node Details:**

- Type: If node  
- Role: Checks if lead category is one of "Enterprise", "High-Value", or "Qualified"  
- Configuration: String equality checks on `$json.qualification.category`  
- Inputs: From Lead Intelligence Processor  
- Outputs: To CRM Contact Creator, CRM Deal Creator, Welcome Email Sender, Sales Task Creator, Slack Notification Sender, Dashboard Logger  
- Edge cases: Leads outside listed categories are excluded from further processing.

---

#### 1.5 CRM Integration & Automation

**Overview:**  
Creates enriched contacts, deals, and follow-up tasks in HubSpot CRM with all relevant lead and enrichment data.

**Nodes Involved:**  
- CRM Contact Creator  
- CRM Deal Creator  
- Sales Task Creator

**Node Details:**

- **CRM Contact Creator**  
  - Type: HubSpot node (contact create)  
  - Role: Creates or updates contact with enriched lead data, custom fields for lead scoring, red flags, qualification, and sales actions.  
  - Configuration: Maps fields from JSON input to HubSpot contact properties; uses OAuth2 credentials.  
  - Inputs: From Lead Categorization Splitter  
  - Outputs: None (end node)  
  - Edge cases: API rate limits, invalid data, credential expiry.

- **CRM Deal Creator**  
  - Type: HubSpot node (deal create)  
  - Role: Creates sales deal/opportunity linked to contact with deal stage, amount estimate, priority, and custom fields.  
  - Configuration: Uses revenue estimate or default; closes deal 90 days from creation; maps qualification and lead info.  
  - Inputs: From Lead Categorization Splitter  
  - Outputs: None  
  - Edge cases: Deal duplications, API errors.

- **Sales Task Creator**  
  - Type: HubSpot node (task create)  
  - Role: Creates follow-up task for sales rep with priority, due date (24h), and detailed description including lead score and follow-up plan.  
  - Configuration: Priority escalates if lead is critical; detailed notes for sales team; custom fields for reporting.  
  - Inputs: From Lead Categorization Splitter  
  - Outputs: None  
  - Edge cases: Task creation limits, missing assignee info.

---

#### 1.6 Communication & Collaboration

**Overview:**  
Sends personalized welcome emails, Slack notifications, and appends processed lead data to Google Sheets dashboard for analytics.

**Nodes Involved:**  
- Welcome Email Sender  
- Slack Notification Sender  
- Dashboard Logger

**Node Details:**

- **Welcome Email Sender**  
  - Type: Send Email  
  - Role: Sends dynamic HTML email welcoming the lead, summarizing next steps from sales actions.  
  - Configuration: Email subject and body built from lead and action data; reply-to and from name set; uses SMTP or email credentials.  
  - Inputs: From Lead Categorization Splitter  
  - Outputs: None  
  - Edge cases: Email delivery failures, invalid email addresses.

- **Slack Notification Sender**  
  - Type: Slack node  
  - Role: Posts formatted message to "sales-alerts" channel alerting team to new high-value leads with key details.  
  - Configuration: Message includes lead name, score, category, estimated value, assigned rep, priority; uses bot token credentials.  
  - Inputs: From Lead Categorization Splitter  
  - Outputs: None  
  - Edge cases: Slack API limits, channel permissions.

- **Dashboard Logger**  
  - Type: Google Sheets  
  - Role: Appends lead data row to "Processed Leads" sheet in Google Sheets document for live sales analytics.  
  - Configuration: Maps multiple JSON fields to sheet columns; uses Google OAuth2 credentials.  
  - Inputs: From Lead Categorization Splitter  
  - Outputs: None  
  - Edge cases: Sheet access permissions, API limits, data mapping errors.

---

#### 1.7 Setup & Configuration Notes

**Overview:**  
Sticky note nodes provide detailed documentation and guidance on workflow operation, configuration, and best practices.

**Nodes Involved:**  
- Workflow Overview (sticky note)  
- Lead Monitoring System (sticky note)  
- CRM Data Extraction (sticky note)  
- Data Enrichment System (sticky note)  
- Lead Intelligence Processing (sticky note)  
- Lead Categorization & Routing (sticky note)  
- CRM & Sales Automation (sticky note)  
- Team Notifications & Analytics (sticky note)  
- Setup & Configuration Guide (sticky note)  

**Node Details:**

- Type: Sticky Note  
- Role: Inform users about workflow structure, benefits, configuration requirements, and operational tips.  
- Content: Markdown-formatted, covering every major functional area in detail.  
- Inputs/Outputs: None  
- Useful for onboarding, maintenance, and operational transparency.

---

### 3. Summary Table

| Node Name                      | Node Type                      | Functional Role                        | Input Node(s)             | Output Node(s)                                                   | Sticky Note                                                                                               |
|-------------------------------|--------------------------------|-------------------------------------|--------------------------|-----------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------|
| Automated Lead Monitor Trigger | Schedule Trigger               | Scheduled lead ingestion trigger    | None                     | AI CRM Leads Scraper                                            | Lead Monitoring System (dual triggers explanation)                                                        |
| CRM New Lead Webhook Trigger   | Webhook                       | Real-time lead ingestion trigger    | None                     | AI CRM Leads Scraper                                            | Lead Monitoring System (dual triggers explanation)                                                        |
| AI CRM Leads Scraper           | ScrapeGraph AI                | Extract new lead data from CRM      | Automated Lead Monitor Trigger, CRM New Lead Webhook Trigger | AI Company Enrichment Scraper, AI Financial Data Scraper    | CRM Data Extraction (AI-powered data extraction details)                                                  |
| AI Company Enrichment Scraper  | ScrapeGraph AI                | Enrich company data from LinkedIn   | AI CRM Leads Scraper     | Lead Intelligence Processor                                    | Data Enrichment System (LinkedIn company info enrichment)                                                 |
| AI Financial Data Scraper      | ScrapeGraph AI                | Enrich financial data from Crunchbase | AI CRM Leads Scraper     | Lead Intelligence Processor                                    | Data Enrichment System (Crunchbase financial data enrichment)                                             |
| Lead Intelligence Processor    | Code                         | Advanced lead scoring & qualification | AI Company Enrichment Scraper, AI Financial Data Scraper | Lead Categorization Splitter                                    | Lead Intelligence Processing (scoring algorithm details)                                                  |
| Lead Categorization Splitter   | If                           | Route leads based on qualification  | Lead Intelligence Processor | CRM Contact Creator, CRM Deal Creator, Welcome Email Sender, Sales Task Creator, Slack Notification Sender, Dashboard Logger | Lead Categorization & Routing (routing logic explanation)                                                 |
| CRM Contact Creator            | HubSpot                      | Create/update contact in CRM        | Lead Categorization Splitter | None                                                          | CRM & Sales Automation (contact creation & enrichment)                                                    |
| CRM Deal Creator               | HubSpot                      | Create deal/opportunity in CRM      | Lead Categorization Splitter | None                                                          | CRM & Sales Automation (deal creation & pipeline management)                                             |
| Welcome Email Sender           | Send Email                   | Send personalized welcome email     | Lead Categorization Splitter | None                                                          | CRM & Sales Automation (email automation details)                                                        |
| Sales Task Creator             | HubSpot                      | Create follow-up task for sales rep | Lead Categorization Splitter | None                                                          | CRM & Sales Automation (task management details)                                                         |
| Slack Notification Sender      | Slack                        | Notify sales team of high-value leads | Lead Categorization Splitter | None                                                          | Team Notifications & Analytics (Slack integration for alerts)                                            |
| Dashboard Logger               | Google Sheets                | Log processed leads to analytics dashboard | Lead Categorization Splitter | None                                                          | Team Notifications & Analytics (Google Sheets integration for reporting)                                 |
| Workflow Overview             | Sticky Note                  | Workflow purpose and high-level overview | None                     | None                                                          | Workflow Overview (overall workflow summary and benefits)                                                |
| Lead Monitoring System         | Sticky Note                  | Trigger system explanation           | None                     | None                                                          | Lead Monitoring System (dual trigger detailed notes)                                                     |
| CRM Data Extraction           | Sticky Note                  | AI data extraction explanation       | None                     | None                                                          | CRM Data Extraction (details of AI scraping nodes)                                                       |
| Data Enrichment System         | Sticky Note                  | Company and financial data enrichment | None                     | None                                                          | Data Enrichment System (LinkedIn and Crunchbase integration notes)                                       |
| Lead Intelligence Processing   | Sticky Note                  | Lead scoring and qualification logic | None                     | None                                                          | Lead Intelligence Processing (scoring algorithm explanation)                                            |
| Lead Categorization & Routing  | Sticky Note                  | Lead routing logic and quality gates | None                     | None                                                          | Lead Categorization & Routing (routing and filtering rules)                                              |
| CRM & Sales Automation         | Sticky Note                  | CRM contact/deal/task creation overview | None                     | None                                                          | CRM & Sales Automation (CRM integration and automation details)                                          |
| Team Notifications & Analytics | Sticky Note                  | Slack notifications and analytics dashboard | None                     | None                                                          | Team Notifications & Analytics (communication & reporting mechanisms)                                   |
| Setup & Configuration Guide    | Sticky Note                  | Setup instructions and configuration | None                     | None                                                          | Setup & Configuration Guide (credentials, URL config, customization, testing)                            |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Nodes:**

   - Add a **Schedule Trigger** node named `Automated Lead Monitor Trigger`.  
     - Set to trigger every 2 hours (adjustable).  
     - No credentials needed.

   - Add a **Webhook** node named `CRM New Lead Webhook Trigger`.  
     - Set HTTP Method to POST.  
     - Set path to `/new-lead-webhook`.  
     - Response Body enabled.  
     - No credentials needed.

2. **Create AI Data Extraction Nodes:**

   - Add **ScrapeGraph AI** node named `AI CRM Leads Scraper`.  
     - Set userPrompt to extract lead data with the provided JSON schema.  
     - Set website URL to your CRM leads dashboard filtered for new leads.  
     - Add ScrapeGraph AI API credentials.

   - Add **ScrapeGraph AI** node named `AI Company Enrichment Scraper`.  
     - Set userPrompt to extract company details from LinkedIn with the specified schema.  
     - Configure website URL expression:  
       `={{ 'https://www.linkedin.com/company/' + $json.company_name.toLowerCase().replace(/[^a-z0-9]/g, '-') }}`  
     - Add ScrapeGraph AI API credentials.

   - Add **ScrapeGraph AI** node named `AI Financial Data Scraper`.  
     - Set userPrompt to extract financial data from Crunchbase with the specified schema.  
     - Configure website URL expression:  
       `={{ 'https://www.crunchbase.com/organization/' + $json.company_name.toLowerCase().replace(/[^a-z0-9]/g, '-') }}`  
     - Add ScrapeGraph AI API credentials.

3. **Connect Data Extraction Nodes:**

   - Connect both trigger nodes (`Automated Lead Monitor Trigger` and `CRM New Lead Webhook Trigger`) to `AI CRM Leads Scraper`.  
   - Connect `AI CRM Leads Scraper` outputs to both `AI Company Enrichment Scraper` and `AI Financial Data Scraper`.

4. **Create Lead Intelligence Processor:**

   - Add a **Code** node named `Lead Intelligence Processor`.  
   - Paste the provided JavaScript code for advanced lead scoring, qualification, and sales action generation.  
   - Configure to accept inputs from both enrichment scraper nodes (set to run after both).  
   - Connect outputs to `Lead Categorization Splitter`.

5. **Create Lead Categorization Splitter:**

   - Add an **If** node named `Lead Categorization Splitter`.  
   - Configure conditions to check if `$json.qualification.category` equals `"Enterprise"`, `"High-Value"`, or `"Qualified"`.  
   - Connect output to the next block nodes.

6. **Create CRM Integration Nodes:**

   - Add a **HubSpot** node named `CRM Contact Creator`.  
     - Resource: Contact  
     - Operation: Create  
     - Map all lead fields and custom fields as per workflow.  
     - Add HubSpot OAuth2 credentials.

   - Add a **HubSpot** node named `CRM Deal Creator`.  
     - Resource: Deal  
     - Operation: Create  
     - Map deal fields (amount, deal name, stage, custom fields).  
     - Add HubSpot OAuth2 credentials.

   - Add a **HubSpot** node named `Sales Task Creator`.  
     - Resource: Task  
     - Operation: Create  
     - Set task details with priority, due date, description, and custom fields.  
     - Add HubSpot OAuth2 credentials.

   - Connect all three nodes from the `Lead Categorization Splitter` output.

7. **Create Communication Nodes:**

   - Add a **Send Email** node named `Welcome Email Sender`.  
     - Configure SMTP or email service credentials.  
     - Set subject and HTML body using expressions with lead data and sales actions.  
     - Set reply-to and from name.

   - Add a **Slack** node named `Slack Notification Sender`.  
     - Configure Slack API credentials (bot token).  
     - Set channel to `sales-alerts`.  
     - Compose message with lead and qualification details.

   - Add a **Google Sheets** node named `Dashboard Logger`.  
     - Configure Google Sheets OAuth2 credentials.  
     - Operation: Append  
     - Document ID: your sales pipeline dashboard sheet ID  
     - Sheet Name: `Processed Leads`  
     - Map columns to lead data and qualification fields.

   - Connect all three communication nodes from the `Lead Categorization Splitter` output.

8. **Add Documentation Sticky Notes:**

   - Add sticky notes with the provided content for workflow overview, trigger explanation, data extraction, enrichment, scoring, routing, CRM integration, team notifications, and setup guide.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                    | Context or Link                                                                                     |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| This workflow automates a sales pipeline, reducing manual processing by 90%, ensuring real-time lead qualification and seamless CRM integration.                | Workflow Overview sticky note                                                                       |
| Dual triggers (schedule + webhook) ensure no leads are missed; configure frequency and monitor webhook reliability for best results.                          | Lead Monitoring System sticky note                                                                 |
| ScrapeGraph AI nodes use natural language prompts to extract structured data; customize prompts and URLs for your CRM and enrichment sources.                 | CRM Data Extraction sticky note                                                                    |
| Company and financial data enrichment improves lead qualification accuracy and risk assessment.                                                                | Data Enrichment System sticky note                                                                 |
| Lead scoring uses a multi-factor weighted system with thresholds triggering different sales actions and priorities.                                           | Lead Intelligence Processing sticky note                                                           |
| Smart routing filters leads to appropriate paths, preventing overload and ensuring high-value prospects get priority attention.                               | Lead Categorization & Routing sticky note                                                          |
| HubSpot integration automates contact, deal, and task creation with custom fields to capture lead intelligence and sales actions.                             | CRM & Sales Automation sticky note                                                                 |
| Slack notifications alert sales teams instantly about high-priority leads with direct CRM links. Google Sheets dashboard provides ongoing analytics.          | Team Notifications & Analytics sticky note                                                        |
| Setup requires API credentials for ScrapeGraph AI, HubSpot, email service, Slack, and Google Sheets. URLs and scoring parameters should be customized.        | Setup & Configuration Guide sticky note                                                           |
| For best results, regularly test triggers, validate data schemas, and monitor API limits and credentials expiration.                                           | Setup & Configuration Guide sticky note                                                           |

---

**Disclaimer:** The provided text is exclusively from an automated n8n workflow. The processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.