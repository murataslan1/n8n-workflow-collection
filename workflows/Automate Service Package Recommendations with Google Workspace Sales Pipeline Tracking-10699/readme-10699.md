Automate Service Package Recommendations with Google Workspace Sales Pipeline Tracking

https://n8nworkflows.xyz/workflows/automate-service-package-recommendations-with-google-workspace-sales-pipeline-tracking-10699


# Automate Service Package Recommendations with Google Workspace Sales Pipeline Tracking

### 1. Workflow Overview

This workflow automates the process of recommending service packages based on client inquiries, managing the sales pipeline, and scheduling follow-ups using Google Workspace tools. It is designed for businesses that want to streamline lead qualification, personalized proposal delivery, and pipeline tracking without manual intervention.

The workflow is logically divided into these functional blocks:

- **1.1 Input Reception:** Capture client inquiries via a customizable web form.
- **1.2 Sales Pipeline Logging:** Record inquiry details into a Google Sheets sales pipeline tracker.
- **1.3 Lead Segmentation & Package Assignment:** Route leads by budget and assign corresponding package details.
- **1.4 Personalized Proposal Delivery:** Send a tailored HTML email with package recommendations and case studies.
- **1.5 Pipeline Update & Follow-Up Scheduling:** Update the pipeline status and create calendar reminders for follow-up actions.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
Collects prospective client data through a form trigger node configured as a user-friendly inquiry form, initiating the workflow.

**Nodes Involved:**  
- Package Inquiry Form

**Node Details:**

- **Package Inquiry Form**  
  - Type: Form Trigger  
  - Role: Entry point capturing lead data (full name, email, phone, budget range, timeline, main challenge).  
  - Configuration:  
    - Form titled "Find Your Perfect Package" with required fields for name, email, budget, timeline, and challenge.  
    - Dropdowns for Budget Range and Timeline with predefined options.  
    - Webhook ID set for external form submissions.  
  - Inputs: External HTTP webhook calls (form submissions).  
  - Outputs: JSON object representing the form fields and their values.  
  - Edge Cases: Missing required fields, invalid email format, webhook unavailability, form submission delays.

---

#### 1.2 Sales Pipeline Logging

**Overview:**  
Stores captured inquiry data into a Google Sheet for pipeline tracking and visibility.

**Nodes Involved:**  
- Log Inquiry to Pipeline

**Node Details:**

- **Log Inquiry to Pipeline**  
  - Type: Google Sheets Append operation  
  - Role: Appends new inquiry row to "Package Inquiries" sheet in a Google Spreadsheet.  
  - Configuration:  
    - Maps form fields (Name, Email, Phone, Budget, Timeline, Challenge) to sheet columns.  
    - Adds default values for "Status" ("Inquiry Received") and timestamps.  
    - Spreadsheet ID placeholder `YOUR_GOOGLE_SHEET_ID` must be replaced with actual ID.  
    - OAuth2 credentials used for authentication.  
  - Inputs: Data from Package Inquiry Form.  
  - Outputs: Confirmation of row append, passes data downstream.  
  - Edge Cases: Google API rate limits, invalid spreadsheet ID, OAuth token expiration, missing columns.

---

#### 1.3 Lead Segmentation & Package Assignment

**Overview:**  
Routes leads based on their budget selection and assigns package-specific details for personalized recommendations.

**Nodes Involved:**  
- Route by Budget  
- Set Basic Package Details  
- Set Standard Package Details  
- Set Premium Package Details

**Node Details:**

- **Route by Budget**  
  - Type: Switch  
  - Role: Evaluates the "Budget Range" field to direct workflow to one of three package tiers: Basic, Standard, Premium.  
  - Configuration:  
    - Conditions check exact matches or string contains for Budget Range values.  
    - Outputs renamed to reflect package tiers.  
  - Inputs: JSON from Log Inquiry to Pipeline.  
  - Outputs: One of three paths based on budget.  
  - Edge Cases: Budget values outside defined ranges, case sensitivity, incomplete data.

- **Set Basic Package Details**  
  - Type: Set  
  - Role: Defines static properties for the Basic Package, including name, price range, feature list, a case study, and booking link.  
  - Configuration:  
    - Hardcoded strings describing package features and benefits.  
    - Booking link points to Calendly scheduling URL.  
  - Inputs: Routed output from Switch node for Basic.  
  - Outputs: JSON enriched with package details.  
  - Edge Cases: Hardcoded values needing updates, broken booking links.

- **Set Standard Package Details**  
  - Type: Set  
  - Role: Similar to Basic, defines Standard package details with expanded features and pricing.  
  - Configuration: Similar structure with distinct content and link.  
  - Edge Cases: Same as Basic.

- **Set Premium Package Details**  
  - Type: Set  
  - Role: Provides Premium package details including enterprise-grade features and AI integrations.  
  - Configuration: Customized strings and booking URL for premium tier.  
  - Edge Cases: Same as above.

---

#### 1.4 Personalized Proposal Delivery

**Overview:**  
Uses the Gmail node to send a richly formatted HTML email with the personalized package recommendation, including dynamic variables for client info.

**Nodes Involved:**  
- Send Package Recommendation

**Node Details:**

- **Send Package Recommendation**  
  - Type: Gmail (via OAuth2)  
  - Role: Sends an HTML email to the lead with their recommended package, pricing, features, case study, and a clear call-to-action button linking to booking.  
  - Configuration:  
    - Email recipient dynamically set to the lead's email from form data.  
    - Subject line includes package name dynamically.  
    - Email body includes inline CSS styling and references variables set in previous nodes (package details, client name, challenge).  
    - OAuth2 credentials for Gmail account authentication.  
  - Inputs: Package details from Set Package nodes and form data.  
  - Outputs: Email send confirmation, JSON output for further processing.  
  - Edge Cases: Gmail API limits, incorrect OAuth tokens, malformed HTML causing rendering issues, email deliverability/spam filtering.

---

#### 1.5 Pipeline Update & Follow-Up Scheduling

**Overview:**  
Updates the sales pipeline entry to reflect the sent package and schedules a Google Calendar event as a follow-up reminder.

**Nodes Involved:**  
- Update Pipeline Status  
- Schedule Follow-Up Reminder

**Node Details:**

- **Update Pipeline Status**  
  - Type: Google Sheets Update operation  
  - Role: Finds the inquiry row by matching email and updates status to "Package Sent," adds date sent, package price, recommended package, and follow-up date (+3 days).  
  - Configuration:  
    - Uses "Email" column as the key for matching existing rows.  
    - Date formatting uses current date/time and adds 3 days for follow-up.  
    - OAuth2 credentials for Google Sheets.  
  - Inputs: Data from Send Package Recommendation node.  
  - Outputs: Confirmation of row update.  
  - Edge Cases: Email mismatch causing no update, spreadsheet permission issues, token expiration.

- **Schedule Follow-Up Reminder**  
  - Type: Google Calendar Event Creation  
  - Role: Creates a calendar event on the follow-up date to remind the team to contact the lead.  
  - Configuration:  
    - Event start and end times set to 10:00-10:30 AM on the follow-up date (3 days after package sent).  
    - Uses primary Google Calendar by default.  
    - OAuth2 credentials for Google Calendar API.  
  - Inputs: Output from Update Pipeline Status node.  
  - Outputs: Event creation confirmation.  
  - Edge Cases: Calendar permission errors, time zone mismatches, OAuth issues, event conflicts.

---

### 3. Summary Table

| Node Name                | Node Type           | Functional Role                                | Input Node(s)               | Output Node(s)                 | Sticky Note                                                                                           |
|--------------------------|---------------------|-----------------------------------------------|-----------------------------|-------------------------------|-----------------------------------------------------------------------------------------------------|
| Package Inquiry Form      | Form Trigger        | Capture client inquiry data                    | External webhook            | Log Inquiry to Pipeline        | ## Step 1: Capture And Log Inquiry Purpose: Collect package inquiries via form and store them in the sales pipeline sheet. |
| Log Inquiry to Pipeline   | Google Sheets       | Append inquiry data to sales pipeline sheet   | Package Inquiry Form         | Route by Budget                | ## Step 1: Capture And Log Inquiry Purpose: Collect package inquiries via form and store them in the sales pipeline sheet. |
| Route by Budget           | Switch              | Route lead by budget range                      | Log Inquiry to Pipeline      | Set Basic, Standard, Premium Package Details | ## Step 2: Segment Lead And Set Package Details Purpose: Route each lead by budget and attach the matching package name, price, and feature set. |
| Set Basic Package Details | Set                 | Assign details for Basic Package                | Route by Budget (Basic)      | Send Package Recommendation    | ## Step 2: Segment Lead And Set Package Details Purpose: Route each lead by budget and attach the matching package name, price, and feature set. |
| Set Standard Package Details | Set              | Assign details for Standard Package             | Route by Budget (Standard)   | Send Package Recommendation    | ## Step 2: Segment Lead And Set Package Details Purpose: Route each lead by budget and attach the matching package name, price, and feature set. |
| Set Premium Package Details | Set               | Assign details for Premium Package              | Route by Budget (Premium)    | Send Package Recommendation    | ## Step 2: Segment Lead And Set Package Details Purpose: Route each lead by budget and attach the matching package name, price, and feature set. |
| Send Package Recommendation | Gmail             | Send personalized package recommendation email | Any Set Package Details      | Update Pipeline Status         | ## Step 3: Send Personalized Package Recommendation Purpose: Email the lead a tailored package offer based on their budget, timeline, and challenge. |
| Update Pipeline Status    | Google Sheets       | Update inquiry status and package details      | Send Package Recommendation | Schedule Follow-Up Reminder    | ## Step 4: Update Pipeline And Schedule Follow Up Purpose: Record the package status and dates in the sheet, then create a calendar reminder to follow up. |
| Schedule Follow-Up Reminder | Google Calendar   | Create follow-up event in calendar              | Update Pipeline Status       | —                             | ## Step 4: Update Pipeline And Schedule Follow Up Purpose: Record the package status and dates in the sheet, then create a calendar reminder to follow up. |
| Sticky Note               | Sticky Note         | Documentation and workflow overview             | —                           | —                             | # 💰 Package Recommender with Sales Pipeline Tracking ... (full sticky note content)                   |
| Sticky Note1              | Sticky Note         | Block 1 summary                                 | —                           | —                             | ## Step 1: Capture And Log Inquiry Purpose: Collect package inquiries via form and store them in the sales pipeline sheet. |
| Sticky Note2              | Sticky Note         | Block 2 summary                                 | —                           | —                             | ## Step 2: Segment Lead And Set Package Details Purpose: Route each lead by budget and attach the matching package name, price, and feature set. |
| Sticky Note3              | Sticky Note         | Block 3 summary                                 | —                           | —                             | ## Step 3: Send Personalized Package Recommendation Purpose: Email the lead a tailored package offer based on their budget, timeline, and challenge. |
| Sticky Note4              | Sticky Note         | Block 4 summary                                 | —                           | —                             | ## Step 4: Update Pipeline And Schedule Follow Up Purpose: Record the package status and dates in the sheet, then create a calendar reminder to follow up. |
| Sticky Note5              | Sticky Note         | Customization and troubleshooting guidance     | —                           | —                             | ## 🔧 Customization Options ... ## 🚨 Troubleshooting ... ## 💡 Enhancement Ideas ...                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Package Inquiry Form node**  
   - Add a Form Trigger node named "Package Inquiry Form".  
   - Configure form title: "Find Your Perfect Package".  
   - Add fields: Full Name (required), Email Address (email type, required), Phone Number, Budget Range (dropdown with options: Under $3,000; $3,000 - $6,000; $6,000 - $10,000; $10,000+, required), Timeline (dropdown: ASAP (1-2 weeks), This Month, Next 1-3 Months, Just Exploring, required), Main Challenge (textarea, required).  
   - Enable webhook and note the webhook ID.

2. **Add Google Sheets node "Log Inquiry to Pipeline"**  
   - Set operation to "append".  
   - Connect to "Package Inquiry Form".  
   - Select spreadsheet by ID (replace placeholder with your Google Sheet ID).  
   - Set sheet name to "Package Inquiries".  
   - Map columns: Name, Email, Phone, Budget, Timeline, Challenge from form data.  
   - Add default "Status" = "Inquiry Received", "Date Sent" empty, "Timestamp" = current datetime.  
   - Authenticate with Google Sheets OAuth2 credentials.

3. **Add Switch node "Route by Budget"**  
   - Connect from "Log Inquiry to Pipeline".  
   - Configure rules:  
     - Output "Basic Package" if Budget Range equals "Under $3,000".  
     - Output "Standard Package" if Budget Range equals "$3,000 - $6,000".  
     - Output "Premium Package" if Budget Range contains "$6,000".  
   - Ensure case sensitivity and exact matches.

4. **Create three Set nodes for package details**  
   - "Set Basic Package Details": Assign packageName, packagePrice, packageFeatures, caseStudy, bookingLink with relevant Basic package info and link.  
   - "Set Standard Package Details": Similar assignment for Standard package.  
   - "Set Premium Package Details": Similar assignment for Premium package.  
   - Connect each Set node to corresponding output of the Switch node.

5. **Add Gmail node "Send Package Recommendation"**  
   - Connect all three Set nodes to this node.  
   - Configure recipient dynamically: use the email from "Package Inquiry Form".  
   - Use OAuth2 Gmail credentials.  
   - Compose subject with packageName included.  
   - Paste the provided HTML email template with embedded expressions for personalization (client name, budget, timeline, package details, case study, challenge, booking link).  
   - Test email rendering.

6. **Add Google Sheets node "Update Pipeline Status"**  
   - Connect from "Send Package Recommendation".  
   - Operation: Update row.  
   - Use "Email" column to match the row.  
   - Update fields: Status = "Package Sent", Date Sent = today’s date, Package Price, Follow-Up Date = today + 3 days, Package Recommended.  
   - Use same Google Sheets credentials and spreadsheet as step 2.

7. **Add Google Calendar node "Schedule Follow-Up Reminder"**  
   - Connect from "Update Pipeline Status".  
   - Set event start and end times at 10:00 and 10:30 AM on follow-up date (today + 3 days).  
   - Use primary calendar or specify calendar ID.  
   - Authenticate with Google Calendar OAuth2 credentials.

8. **Configure credentials**  
   - Setup and verify OAuth2 credentials for Google Sheets, Google Calendar, and Gmail in n8n.  
   - Ensure appropriate permissions for reading/writing sheets, creating calendar events, and sending emails.

9. **Test the workflow**  
   - Submit example data through the form webhook.  
   - Verify data logs into Google Sheets correctly.  
   - Verify routing and package assignment.  
   - Confirm receipt of personalized email.  
   - Check pipeline updated and calendar event created.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                      | Context or Link                                                             |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------|
| # 💰 Package Recommender with Sales Pipeline Tracking: Automates recommendation, email proposals, pipeline logging, and follow-up scheduling. Converts inquiries to booked calls without manual work.                                            | Workflow overview sticky note                                              |
| Step 1: Create Google Sheet with tab "Package Inquiries" and columns: Timestamp, Name, Email, Phone, Budget, Timeline, Challenge, Package Recommended, Package Price, Status, Date Sent, Follow-Up Date. Replace `YOUR_GOOGLE_SHEET_ID` accordingly. | Setup instructions sticky note                                            |
| Customize package details and booking links in the Set nodes. Adjust email template branding, colors, and signature in the Gmail node.                                                                                                           | Setup instructions sticky note                                            |
| Troubleshooting tips include verifying exact budget values for routing, OAuth permissions for calendar and sheets, and testing email HTML rendering with tools like Litmus or Email on Acid.                                                      | Sticky Note5 troubleshooting section                                      |
| Enhancement ideas: Add payment links, email open tracking, SMS alerts, CRM integration, multi-stage follow-ups, and PDF proposal generation.                                                                                                     | Sticky Note5 enhancement ideas section                                    |
| Video and blog resources for n8n and Google Workspace integration can be found on the official n8n documentation and community forums.                                                                                                         | n8n community resources                                                    |

---

This completes the comprehensive documentation and reference for the "Package Recommender with Sales Pipeline Tracking" workflow. It can be used by developers and automation agents to understand, reproduce, and maintain the automation effectively.