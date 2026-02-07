Automate Course Registration Leads from Facebook Ads to KlickTipp

https://n8nworkflows.xyz/workflows/automate-course-registration-leads-from-facebook-ads-to-klicktipp-3786


# Automate Course Registration Leads from Facebook Ads to KlickTipp

### 1. Workflow Overview

This workflow automates the process of capturing lead data from Facebook Lead Ads and transferring it into KlickTipp for subscriber management and targeted email campaigns. It is designed primarily for course registration leads but can be adapted for similar marketing campaigns.

The workflow is logically divided into two main blocks:

- **1.1 Input Reception:** Captures lead submissions from Facebook Lead Ads in real-time via a webhook trigger node.
- **1.2 Subscriber Management in KlickTipp:** Maps and validates the lead data, then adds or updates the subscriber in KlickTipp with appropriate custom fields and tags for campaign segmentation.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  This block listens for new lead submissions from Facebook Lead Ads and triggers the workflow with the lead data payload.

- **Nodes Involved:**  
  - Facebook Lead Ads Trigger

- **Node Details:**

  - **Facebook Lead Ads Trigger**  
    - **Type & Role:** Trigger node that listens for new Facebook Lead Ads form submissions via webhook.  
    - **Configuration:**  
      - Authenticated with Facebook Lead Ads OAuth2 credentials.  
      - Configured to listen to a specific Facebook Page (`315574741814190`) and Lead Form (`989636452637732`).  
      - Webhook ID assigned for receiving real-time lead data.  
    - **Expressions/Variables:**  
      - Outputs lead data in JSON format, including fields such as full name, email, course interest, payment method, and comments.  
    - **Input/Output:**  
      - No input (trigger node).  
      - Outputs lead data to the next node.  
    - **Version Requirements:**  
      - Requires n8n version supporting Facebook Lead Ads Trigger node (v1+).  
    - **Potential Failures:**  
      - Authentication errors if Facebook OAuth2 token expires or is invalid.  
      - Webhook misconfiguration or Facebook API downtime could prevent trigger activation.  
      - Missing or renamed Facebook form fields could cause mapping issues downstream.  
    - **Sub-workflow:** None.

#### 1.2 Subscriber Management in KlickTipp

- **Overview:**  
  This block processes the lead data, maps it to KlickTipp custom fields, and subscribes or updates the contact in KlickTipp. It also assigns tags for segmentation and campaign automation.

- **Nodes Involved:**  
  - Subscribe lead in KlickTipp

- **Node Details:**

  - **Subscribe lead in KlickTipp**  
    - **Type & Role:** KlickTipp node that subscribes or updates a contact in KlickTipp using API credentials.  
    - **Configuration:**  
      - Authenticated with KlickTipp API credentials (username and password).  
      - Email is mapped directly from the Facebook lead data (`$json.data.email`).  
      - Custom fields mapped:  
        - First Name: Extracted as the first word from the full name string.  
        - Last Name: Extracted as the last word from the full name string.  
        - `Facebook_Leads_Ads_Kommentar` mapped from `hast_du_zusätzliche_kommentare_für_uns?` field.  
        - `Facebook_Leads_Ads_Kursauswahl` mapped from `welcher_kurs_interessiert_dich?` field.  
        - `Facebook_Leads_Ads_Zahlungsweise` mapped from `was_ist_deine_bevorzugte_zahlungsweise?` field.  
      - Subscriber is added to list ID `358895`.  
    - **Expressions/Variables:**  
      - Uses JavaScript expressions to parse full name into first and last names.  
      - Direct JSON path references to Facebook lead data fields.  
    - **Input/Output:**  
      - Input: Lead data from Facebook Lead Ads Trigger node.  
      - Output: KlickTipp subscription confirmation or error.  
    - **Version Requirements:**  
      - Requires KlickTipp node v2 or higher for custom field mapping and subscription operation.  
    - **Potential Failures:**  
      - Authentication errors due to invalid KlickTipp credentials.  
      - Validation errors if email is invalid or missing (e.g., Facebook test emails like `test@fb.com` are rejected).  
      - Mapping errors if Facebook form fields are renamed or missing.  
      - Network or API downtime affecting KlickTipp service.  
    - **Sub-workflow:** None.

---

### 3. Summary Table

| Node Name               | Node Type                      | Functional Role                         | Input Node(s)            | Output Node(s)           | Sticky Note                                                                                                                           |
|-------------------------|--------------------------------|---------------------------------------|--------------------------|--------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| Facebook Lead Ads Trigger| facebookLeadAdsTrigger          | Captures new lead submissions via webhook | None                     | Subscribe lead in KlickTipp | This node listens for new leads generated via Facebook Lead Ads. When a user submits a form on Facebook or Instagram, it triggers the workflow and captures the lead's details. |
| Subscribe lead in KlickTipp | klicktipp                      | Adds or updates subscriber in KlickTipp with mapped fields | Facebook Lead Ads Trigger | None                     | Subscribes the incoming Facebook lead to the KlickTipp. This allows automatic follow-up, tagging, or integration with email campaigns. |
| Sticky Note             | stickyNote                     | Documentation and workflow overview   | None                     | None                     | ### Introduction This workflow streamlines the process of capturing leads via Facebook Lead Ads and transferring them automatically into KlickTipp. It ensures that contact data is accurately mapped and added to KlickTipp to trigger personalized email campaigns. Benefits and setup instructions included. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Facebook Lead Ads Trigger Node**  
   - Add a new node of type **Facebook Lead Ads Trigger**.  
   - Authenticate using your Facebook Lead Ads OAuth2 credentials.  
   - Select the Facebook Page (e.g., `315574741814190`) linked to your lead form.  
   - Select the specific Lead Form (e.g., `989636452637732`) you want to listen to.  
   - Save and activate the webhook to receive real-time lead submissions.

2. **Create KlickTipp Node to Subscribe Leads**  
   - Add a new node of type **KlickTipp**.  
   - Authenticate using your KlickTipp API credentials (username and password).  
   - Set the operation to **subscribe** a subscriber to a list.  
   - Enter the target list ID (e.g., `358895`).  
   - Map the email field to `{{$json.data.email}}`.  
   - Map custom fields as follows:  
     - First Name: Use expression to extract first word from full name:  
       `{{$json.data["full name"].split(" ")[0]}}`  
     - Last Name: Use expression to extract last word from full name:  
       `{{$json.data["full name"].split(" ").pop()}}`  
     - `Facebook_Leads_Ads_Kommentar`: Map from `hast_du_zusätzliche_kommentare_für_uns?` field.  
     - `Facebook_Leads_Ads_Kursauswahl`: Map from `welcher_kurs_interessiert_dich?` field.  
     - `Facebook_Leads_Ads_Zahlungsweise`: Map from `was_ist_deine_bevorzugte_zahlungsweise?` field.  
   - Save the node.

3. **Connect Nodes**  
   - Connect the output of the **Facebook Lead Ads Trigger** node to the input of the **Subscribe lead in KlickTipp** node.

4. **Create Required Custom Fields in KlickTipp**  
   - In your KlickTipp account, navigate to Contacts → Custom Fields.  
   - Create the following custom fields (all as text fields):  
     - `Facebook_Leads_Ads_Kommentar`  
     - `Facebook_Leads_Ads_Kursauswahl`  
     - `Facebook_Leads_Ads_Zahlungsweise`

5. **Testing**  
   - Use the [Meta Lead Ads Testing Tool](https://developers.facebook.com/tools/lead-ads-testing) to submit test leads.  
   - Note: Facebook test emails like `test@fb.com` will be rejected by KlickTipp due to validation rules. Modify the email in the output manually during testing if needed.  
   - Run the workflow manually once to verify the data flow and subscription.

6. **Deployment**  
   - Activate the workflow for continuous operation.  
   - Monitor logs for errors related to authentication or data mapping.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                  | Context or Link                                                                                      |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| This workflow uses community nodes and is compatible only with self-hosted n8n environments.                                                                                                                                                                                                                                                                | Workflow disclaimer                                                                                 |
| Use the [Meta Lead Ads Testing Tool](https://developers.facebook.com/tools/lead-ads-testing) to simulate lead submissions during setup and testing.                                                                                                                                                                                                        | Facebook Lead Ads testing resource                                                                 |
| Custom fields must be created in KlickTipp before running the workflow to avoid synchronization errors. Adjust field mappings in the KlickTipp node if your Facebook form fields differ.                                                                                                                                                                      | Setup instruction                                                                                   |
| Facebook test email addresses (e.g., `test@fb.com`) are invalid in KlickTipp and will cause errors during testing. Modify test data accordingly.                                                                                                                                                                                                             | Testing note                                                                                       |
| Tags can be assigned dynamically in KlickTipp for segmentation and campaign automation, but this workflow focuses on custom field mapping and subscription.                                                                                                                                                                                                  | Campaign automation tip                                                                            |
| The name parsing logic assumes a simple "First Last" format and does not support compound or multiple last names. Adjust expressions if needed for more complex name structures.                                                                                                                                                                              | Data parsing note                                                                                   |

---

This documentation provides a complete and detailed reference for understanding, reproducing, and maintaining the "Automate Course Registration Leads from Facebook Ads to KlickTipp" workflow.