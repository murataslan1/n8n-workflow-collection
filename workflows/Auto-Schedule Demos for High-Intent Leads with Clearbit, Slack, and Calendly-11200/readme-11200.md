Auto-Schedule Demos for High-Intent Leads with Clearbit, Slack, and Calendly

https://n8nworkflows.xyz/workflows/auto-schedule-demos-for-high-intent-leads-with-clearbit--slack--and-calendly-11200


# Auto-Schedule Demos for High-Intent Leads with Clearbit, Slack, and Calendly

# Technical Reference Document  
**Workflow Title:** Auto-Schedule Demos for High-Intent Leads with Clearbit, Slack, and Calendly  
**Workflow Internal Name:** Instant Demo Booker for High Intent Leads

---

### 1. Workflow Overview

This workflow automates the process of booking product demos for high-intent leads by integrating lead capture, enrichment, scoring, scheduling, sales alerting, and fallback communication. It targets sales teams seeking to prioritize and fast-track high-value prospects while maintaining nurture paths for standard leads.

**Key Functional Blocks:**

- **1.1 Lead Capture & Normalization:** Accepts lead submissions via webhook and standardizes fields irrespective of form source.  
- **1.2 Lead Enrichment & Scoring:** Enriches lead data using Clearbit API and calculates a fit score based on company size, revenue, and job seniority to assess lead quality.  
- **1.3 Lead Routing:** Determines lead path (High-Intent or Standard) based on fit score threshold (≥60).  
- **1.4 CRM Integration:** Creates or updates contacts and deals in HubSpot CRM for high-intent leads.  
- **1.5 Demo Scheduling:** Fetches Calendly event types and availability, formats available demo slots for booking.  
- **1.6 Sales Alerts:** Posts lead details and booking links to Slack channels (#hot-leads for high intent, #leads for standard).  
- **1.7 Follow-Up & Fallback:** Waits 10 minutes for sales response in Slack; if no reply, triggers automated fallback email to lead via SendGrid.  
- **1.8 Logging & Response:** Logs lead and interaction data to Google Sheets and returns webhook response with booking info.

---

### 2. Block-by-Block Analysis

---

#### 2.1 Lead Capture & Normalization  
**Overview:** Receives incoming lead submissions via webhook POST. Normalizes incoming data fields for consistent downstream processing.

**Nodes Involved:**  
- Lead Form Webhook  
- Normalize Lead Data

**Node Details:**  

- **Lead Form Webhook**  
  - *Type:* Webhook (Trigger)  
  - *Role:* Entry point for lead submission data via HTTP POST at path `/demo-request`.  
  - *Config:* Returns response node after processing. Continues on error to avoid halt.  
  - *Connections:* Outputs to Normalize Lead Data.  
  - *Edge Cases:* Missing or malformed POST data; network issues.  
  
- **Normalize Lead Data**  
  - *Type:* Set Node  
  - *Role:* Standardizes field names from various form providers (e.g., email, fullName, company, phone). Uses fallback logic for missing fields.  
  - *Key Expressions:*  
    - `email` assigned from `body.email` or `body.contact_email`  
    - `fullName` from `body.name` or `body.full_name`  
    - `company` from multiple possible keys, defaults to empty string  
    - Timestamp captured as current ISO time  
  - *Connections:* Outputs to Enrich with Clearbit.  
  - *Edge Cases:* Missing fields, empty strings; uses defaults to maintain flow.

---

#### 2.2 Lead Enrichment & Fit Scoring  
**Overview:** Enhances lead data by fetching company and job info from Clearbit, then computes a numeric fit score to evaluate lead quality.

**Nodes Involved:**  
- Enrich with Clearbit  
- Calculate Fit Score

**Node Details:**  

- **Enrich with Clearbit**  
  - *Type:* Clearbit Node  
  - *Role:* Enriches person data including company size, revenue, industry, and employment title/seniority using Clearbit API keyed by email.  
  - *Config:* Uses Clearbit API key credential; continues on error to prevent blocking.  
  - *Connections:* Outputs to Calculate Fit Score.  
  - *Edge Cases:* API rate limits, missing Clearbit data, invalid emails.  
  
- **Calculate Fit Score**  
  - *Type:* Set Node  
  - *Role:* Calculates a lead fit score from 0 to 100 based on:  
    - Company size (40 points for 50–5000 employees)  
    - Seniority (30 points if executive or director)  
    - Annual revenue (30 points if ≥ $1M)  
  - *Expressions:* Conditional logic to assign points based on Clearbit data or fallback normalized data.  
  - *Connections:* Outputs to Lead Routing (If node).  
  - *Edge Cases:* Missing or zero numeric data results in zero points for categories.

---

#### 2.3 Lead Routing  
**Overview:** Routes leads into two paths: high-intent (fit score ≥ 60) for immediate demo scheduling and sales prioritization, or standard for regular nurture.

**Nodes Involved:**  
- High Intent Lead? (If Node)  
- Alert Sales (Standard)  
- Create HubSpot Contact

**Node Details:**  

- **High Intent Lead?**  
  - *Type:* If Node  
  - *Role:* Checks if fitScore >= 60 to route lead accordingly.  
  - *Connections:* True branch to Create HubSpot Contact; false branch to Alert Sales (Standard).  
  - *Edge Cases:* Missing fitScore defaults to false branch.  
  
- **Alert Sales (Standard)**  
  - *Type:* Slack Node  
  - *Role:* Posts a simple lead notification to standard #leads Slack channel without follow-up actions.  
  - *Config:* Posts formatted message with lead info and booking URL. Uses Slack bot credentials.  
  - *Connections:* End node for standard path.  
  - *Edge Cases:* Slack API errors, channel misconfiguration.  
  
- **Create HubSpot Contact**  
  - *Type:* HubSpot Node  
  - *Role:* Creates or updates contact in HubSpot with enriched lead data (name, email, job title, company, phone).  
  - *Config:* Uses HubSpot app token; retries on failure with max 3 tries and 2s delay.  
  - *Connections:* Outputs to Create HubSpot Deal.  
  - *Edge Cases:* API failures, auth errors, rate limits.

---

#### 2.4 CRM Deal Creation & Demo Scheduling Preparation  
**Overview:** Creates a HubSpot deal for the lead and prepares to fetch available Calendly demo slots.

**Nodes Involved:**  
- Create HubSpot Deal  
- Get Calendly Event Types  
- Prepare Availability Params

**Node Details:**  

- **Create HubSpot Deal**  
  - *Type:* HubSpot Node  
  - *Role:* Creates a new deal in "Appointment Scheduled" stage with company and deal metadata.  
  - *Config:* Includes deal name with company, zero amount, pipeline default, close date 30 days ahead.  
  - *Connections:* Outputs to Get Calendly Event Types.  
  - *Edge Cases:* CRM API issues; deal creation failures.  
  
- **Get Calendly Event Types**  
  - *Type:* HTTP Request  
  - *Role:* Fetches Calendly event types for the user to identify demo event types.  
  - *Config:* Uses Calendly OAuth2 credentials, sends user URI as query param. Continues on error.  
  - *Connections:* Outputs to Prepare Availability Params.  
  - *Edge Cases:* API downtime, OAuth token expiry, missing demo event type.  
  
- **Prepare Availability Params**  
  - *Type:* Code Node (JavaScript)  
  - *Role:* Searches for event types with "demo" in name, prepares 7-day availability window parameters.  
  - *Config:* Returns eventTypeUri, ISO timestamps for now and +7 days, and fallback scheduling URL.  
  - *Connections:* Outputs to Get Available Demo Slots.  
  - *Edge Cases:* No demo event found — returns error info with fallback URL for manual booking.

---

#### 2.5 Fetching and Formatting Demo Slots  
**Overview:** Obtains real-time available demo slots from Calendly and formats the top two slots for display and booking.

**Nodes Involved:**  
- Get Available Demo Slots  
- Format Demo Slots

**Node Details:**  

- **Get Available Demo Slots**  
  - *Type:* HTTP Request  
  - *Role:* Queries Calendly API for actual available time slots of the demo event within the 7-day window.  
  - *Config:* Uses Calendly OAuth2, retries on failure twice with 1s delay.  
  - *Connections:* Outputs to Format Demo Slots.  
  - *Edge Cases:* No slots available, API errors, token issues.  
  
- **Format Demo Slots**  
  - *Type:* Code Node (JavaScript)  
  - *Role:* Formats the first two available slots into human-readable US locale strings, constructs booking URLs, and prepares slots summary.  
  - *Config:* Uses fallback URL if no slots; includes up to 5 slots for potential use.  
  - *Connections:* Outputs to Alert Sales (High Intent).  
  - *Edge Cases:* Empty slots list triggers fallback messaging.

---

#### 2.6 Sales Alerts and Follow-up Handling  
**Overview:** Sends Slack alerts to sales channels for high-intent leads, waits for sales reply within 10 minutes, sends fallback email if no response.

**Nodes Involved:**  
- Alert Sales (High Intent)  
- Wait 10 Minutes  
- Check Slack Replies  
- No Response?  
- Send Fallback Email

**Node Details:**  

- **Alert Sales (High Intent)**  
  - *Type:* Slack Node  
  - *Role:* Posts detailed lead and booking info to #hot-leads Slack channel, encouraging quick sales action.  
  - *Config:* Rich message with emojis, lead data, fit score, booking slots, and urgency note.  
  - *Connections:* Forks into Wait 10 Minutes, Log to Google Sheets, and Webhook Response.  
  - *Edge Cases:* Slack API failures, incorrect channel.  
  
- **Wait 10 Minutes**  
  - *Type:* Wait Node  
  - *Role:* Pauses flow for 10 minutes to allow sales team to respond.  
  - *Connections:* Outputs to Check Slack Replies.  
  - *Edge Cases:* Workflow timeout or interruptions.  
  
- **Check Slack Replies**  
  - *Type:* Slack Node  
  - *Role:* Checks replies in the thread of the alert message to see if sales responded.  
  - *Config:* Uses timestamp and channel ID from alert node output. Continues on error.  
  - *Connections:* Outputs to No Response? condition check.  
  - *Edge Cases:* Slack API errors, no replies, message count edge cases.  
  
- **No Response?**  
  - *Type:* If Node  
  - *Role:* Checks if replies count equals 1 (meaning no additional replies besides the original message).  
  - *Connections:* True branch to Send Fallback Email.  
  - *Edge Cases:* Missing or malformed message array.  
  
- **Send Fallback Email**  
  - *Type:* SendGrid Node  
  - *Role:* Sends automated booking reminder email to lead if no sales response.  
  - *Config:* Uses SendGrid API key, HTML email template with booking slots and personalized lead data. Retries twice on failure.  
  - *Edge Cases:* Email delivery failures, API rate limits.

---

#### 2.7 Logging and Webhook Response  
**Overview:** Logs lead and interaction metadata into Google Sheets and responds to the originating webhook call with booking info.

**Nodes Involved:**  
- Log to Google Sheets  
- Webhook Response

**Node Details:**  

- **Log to Google Sheets**  
  - *Type:* Google Sheets Node  
  - *Role:* Appends or updates a row in the specified sheet with lead info, fit score, booking URL, HubSpot IDs, and interaction results.  
  - *Config:* Uses OAuth2 credential, target sheet name "Lead Log," maps multiple fields from prior nodes. Continues on error.  
  - *Edge Cases:* Google API limits, incorrect sheet ID, mapping errors.  
  
- **Webhook Response**  
  - *Type:* Respond to Webhook Node  
  - *Role:* Sends a JSON response back to the lead form submitter confirming receipt and providing booking info and lead priority.  
  - *Config:* Dynamic JSON content referencing fit score, available slots, and booking URL.  
  - *Edge Cases:* Response failures, malformed JSON.

---

### 3. Summary Table

| Node Name               | Node Type           | Functional Role                                   | Input Node(s)              | Output Node(s)                   | Sticky Note                                                                                                            |
|-------------------------|---------------------|--------------------------------------------------|----------------------------|---------------------------------|------------------------------------------------------------------------------------------------------------------------|
| Overview                | Sticky Note         | Describes workflow summary and setup             |                            |                                 | ## Instant Demo Booker for High-Intent Leads... (full content describing workflow and setup requirements)              |
| Lead Form Webhook       | Webhook             | Receives lead submissions                         |                            | Normalize Lead Data             | Receives lead submissions via POST request                                                                             |
| Normalize Lead Data     | Set                 | Standardizes lead fields                          | Lead Form Webhook           | Enrich with Clearbit            | Standardizes field names from different form providers                                                                 |
| Enrich with Clearbit    | Clearbit            | Enriches lead data with company and job info     | Normalize Lead Data         | Calculate Fit Score             | Enriches contact with company data (size, revenue, industry, job title)                                                |
| Calculate Fit Score     | Set                 | Calculates numeric fit score (0-100)              | Enrich with Clearbit        | High Intent Lead?               | Scores 0-100 based on company size (40), seniority (30), revenue (30)                                                  |
| High Intent Lead?       | If                  | Routes leads by fit score ≥60                      | Calculate Fit Score         | Create HubSpot Contact, Alert Sales (Standard) | Routes leads with score ≥60 to fast track, others to standard                                                          |
| Create HubSpot Contact  | HubSpot             | Creates/updates lead contact                       | High Intent Lead? (true)    | Create HubSpot Deal             | Creates or updates contact in HubSpot CRM                                                                             |
| Create HubSpot Deal     | HubSpot             | Creates deal in appointment scheduled stage       | Create HubSpot Contact      | Get Calendly Event Types        | Creates deal in 'Appointment Scheduled' stage                                                                          |
| Get Calendly Event Types| HTTP Request        | Fetches Calendly event types                       | Create HubSpot Deal         | Prepare Availability Params     | Fetches your Calendly event types to find Demo events                                                                  |
| Prepare Availability Params | Code            | Finds demo event and prepares 7-day window        | Get Calendly Event Types    | Get Available Demo Slots        | Finds Demo event and prepares 7-day availability window                                                                |
| Get Available Demo Slots| HTTP Request        | Retrieves available Calendly slots                 | Prepare Availability Params | Format Demo Slots               | Fetches real available time slots from Calendly API                                                                    |
| Format Demo Slots       | Code                | Formats next 2 slots with booking URLs             | Get Available Demo Slots    | Alert Sales (High Intent)       | Formats next 2 available slots with booking URLs                                                                       |
| Alert Sales (High Intent)| Slack               | Posts lead details and booking links to #hot-leads| Format Demo Slots           | Wait 10 Minutes, Log to Google Sheets, Webhook Response | Posts to #hot-leads with full lead details and booking links                                                           |
| Wait 10 Minutes         | Wait                | Waits 10 minutes for sales team response           | Alert Sales (High Intent)   | Check Slack Replies             | Waits for sales rep to respond in Slack thread                                                                          |
| Check Slack Replies     | Slack               | Checks if sales replied in thread                   | Wait 10 Minutes            | No Response?                   | Checks if sales team replied in thread                                                                                  |
| No Response?            | If                  | Determines if no sales reply (message count = 1)  | Check Slack Replies         | Send Fallback Email             | Sends email if no Slack reply (message count = 1)                                                                       |
| Send Fallback Email     | SendGrid            | Sends automated booking email if no sales reply    | No Response?                |                                 | Auto-sends booking email if sales doesn't respond                                                                       |
| Alert Sales (Standard)  | Slack               | Posts standard lead notification to #leads channel| High Intent Lead? (false)   |                                 | Posts to #leads channel for standard priority                                                                           |
| Log to Google Sheets    | Google Sheets       | Logs all lead and interaction data                  | Alert Sales (High Intent)   |                                 | Logs all lead data for analytics and reporting                                                                           |
| Webhook Response        | Respond to Webhook  | Returns success message to lead submitter           | Alert Sales (High Intent)   |                                 | Returns success message to form with booking details                                                                    |
| High-Intent Flow        | Sticky Note         | Label for high-intent lead path                      |                            |                                 | ## High-Intent Path (Score ≥60)                                                                                         |
| Standard Flow           | Sticky Note         | Label for standard lead path                         |                            |                                 | ## Standard Path (Score <60) Posts to #leads Slack channel No automated follow-up Standard nurture workflow            |
| Sticky Note (Various)   | Sticky Notes        | Descriptive notes near logical groupings            |                            |                                 | Multiple sticky notes describing blocks (HubSpot, Calendly slots, Slack posting, logging, wait & follow-up)             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**  
   - Type: Webhook (Trigger)  
   - HTTP Method: POST  
   - Path: `demo-request`  
   - Response Mode: Respond from a node  
   - On Error: Continue  

2. **Create Set Node "Normalize Lead Data"**  
   - Assign fields: email, fullName, company, phone, utmSource, utmCampaign, pageUrl, message, submittedAt (current ISO timestamp)  
   - Use expressions for fallback values (e.g., `$json.body.email || $json.body.contact_email`)  
   - Connect from Webhook node.  

3. **Create Clearbit Node "Enrich with Clearbit"**  
   - Set resource: Person  
   - Email: from normalized data  
   - Credentials: Clearbit API key  
   - Continue on error  
   - Connect from Normalize Lead Data.  

4. **Create Set Node "Calculate Fit Score"**  
   - Assign fields: enrichedCompany, companySize, industry, annualRevenue, jobTitle, seniority  
   - Calculate fitScore using conditional scoring:  
     - 40 points if company employees between 50 and 5000  
     - 30 points if seniority is executive or director  
     - 30 points if annual revenue ≥ 1,000,000  
   - Connect from Clearbit node.  

5. **Create If Node "High Intent Lead?"**  
   - Condition: fitScore >= 60  
   - Connect from Calculate Fit Score.  

6. **Create Slack Node "Alert Sales (Standard)"**  
   - Post message to channel named `leads` with basic lead details and booking URL  
   - Credentials: Slack bot token  
   - Connect to False branch of "High Intent Lead?" node.  

7. **Create HubSpot Node "Create HubSpot Contact"**  
   - Create/update contact with email, firstName, lastName, jobTitle, companyName, phoneNumber  
   - Use HubSpot app token credentials  
   - Retries enabled (max 3, 2s interval)  
   - Connect to True branch of "High Intent Lead?" node.  

8. **Create HubSpot Node "Create HubSpot Deal"**  
   - Create deal with stage "appointmentscheduled", pipeline "default", close date 30 days from now, amount 0, deal name "Demo Request - [Company]"  
   - Use same HubSpot credentials  
   - Connect from "Create HubSpot Contact".  

9. **Create HTTP Request Node "Get Calendly Event Types"**  
   - URL: `https://api.calendly.com/event_types`  
   - Query parameter: `user` set to your Calendly user URI  
   - Authentication: Calendly OAuth2  
   - Connect from "Create HubSpot Deal".  

10. **Create Code Node "Prepare Availability Params"**  
    - JavaScript logic to find "demo" event type and prepare start/end time for next 7 days  
    - Output eventTypeUri, startTime, endTime, schedulingUrl (fallback)  
    - Connect from "Get Calendly Event Types".  

11. **Create HTTP Request Node "Get Available Demo Slots"**  
    - URL: `https://api.calendly.com/event_type_available_times`  
    - Query parameters: event_type, start_time, end_time from previous node output  
    - Authentication: Calendly OAuth2  
    - Retries enabled (max 2, 1s interval)  
    - Connect from "Prepare Availability Params".  

12. **Create Code Node "Format Demo Slots"**  
    - Format first two available slots into readable strings with timezones  
    - Provide fallback if no slots  
    - Connect from "Get Available Demo Slots".  

13. **Create Slack Node "Alert Sales (High Intent)"**  
    - Post rich message to Slack channel `hot-leads` with lead details, fit score, booking slots, booking URL, and urgency note  
    - Credentials: Slack bot token  
    - Connect from "Format Demo Slots".  

14. **Create Wait Node "Wait 10 Minutes"**  
    - Wait duration: 10 minutes  
    - Connect from "Alert Sales (High Intent)".  

15. **Create Slack Node "Check Slack Replies"**  
    - Operation: Get replies to message thread using timestamp and channel ID from "Alert Sales (High Intent)" output  
    - Credentials: Slack bot token  
    - Connect from "Wait 10 Minutes".  

16. **Create If Node "No Response?"**  
    - Condition: messages.length equals 1 (means no reply)  
    - Connect from "Check Slack Replies".  

17. **Create SendGrid Node "Send Fallback Email"**  
    - Send email to lead with booking info, personalized with lead name and slots  
    - Credentials: SendGrid API key  
    - Retries enabled (max 2)  
    - Connect from True branch of "No Response?".  

18. **Create Google Sheets Node "Log to Google Sheets"**  
    - Append or update row in sheet "Lead Log" with lead info, scores, HubSpot IDs, Slack reply status, booking URL  
    - Use OAuth2 credentials for Google Sheets  
    - Connect from "Alert Sales (High Intent)".  

19. **Create Respond to Webhook Node "Webhook Response"**  
    - Respond with JSON success message including fitScore, priority, slot count, booking URL  
    - Connect from "Alert Sales (High Intent)".  

---

### 5. General Notes & Resources

| Note Content                                                                                                    | Context or Link                                                                                                           |
|----------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------|
| Setup requires API keys and OAuth2 credentials for Clearbit, HubSpot, Calendly, Slack, SendGrid, Google Sheets | See Overview sticky note for detailed setup instructions                                                                   |
| Slack channels used: `hot-leads` for high intent, `leads` for standard leads                                   | Customize channel names in Slack nodes accordingly                                                                         |
| Fit score logic is customizable in "Calculate Fit Score" node                                                 | Modify weighting or threshold to match business priorities                                                                 |
| Fallback booking URL defaults to Calendly demo page if no slots found                                         | Editable in "Prepare Availability Params" and "Format Demo Slots" node                                                     |
| SendGrid email template includes HTML styling with booking button                                             | Can be customized in Send Fallback Email node                                                                              |
| Google Sheet ID must be replaced with your actual spreadsheet ID                                              | Required in Log to Google Sheets node parameter                                                                            |
| HubSpot pipeline and deal stage names should match your CRM setup                                             | Adjust in Create HubSpot Deal node                                                                                        |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created with n8n, a tool for integration and automation. The processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All handled data is legal and public.