Automate Webinar Registration with Zoom & KlickTipp Form Integration

https://n8nworkflows.xyz/workflows/automate-webinar-registration-with-zoom---klicktipp-form-integration-8416


# Automate Webinar Registration with Zoom & KlickTipp Form Integration

### 1. Workflow Overview

This workflow automates webinar registration by integrating KlickTipp form submissions with Zoom webinar APIs. It captures user registrations submitted via a KlickTipp landing page, dynamically routes them based on the selected webinar, registers the participant for the appropriate Zoom webinar, and updates the contact record in KlickTipp with relevant webinar data and segmentation tags.

Logical blocks include:

- **1.1 Data Reception:** Receiving registration submissions from KlickTipp via webhook.
- **1.2 Dynamic Routing:** Filtering submissions by the chosen webinar type using a switch node.
- **1.3 Webinar Registration:** Registering the participant to the appropriate Zoom webinar via API calls.
- **1.4 Contact Enrichment:** Updating KlickTipp contact records with Zoom webinar details and tagging for segmentation.

---

### 2. Block-by-Block Analysis

#### 1.1 Data Reception

**Overview:**  
This block initiates the workflow by listening for registration submissions from a KlickTipp landing page through a webhook trigger.

**Nodes Involved:**  
- KlickTipp Trigger  
- Sticky Note (Data reception via Webhook - Landingpage submissions)

**Node Details:**

- **KlickTipp Trigger**  
  - Type: Community node for KlickTipp webhook trigger  
  - Role: Waits for outbound webhook events from KlickTipp when a registration form is submitted  
  - Configuration: Uses a webhook ID that listens for form data submissions  
  - Inputs: External HTTP POST from KlickTipp landing page form  
  - Outputs: JSON containing contact data including email, first name, last name, and custom field `CustomField219989` indicating webinar choice  
  - Edge cases:  
    - Webhook not triggered if KlickTipp outbound webhook not configured correctly  
    - Missing or malformed data in submission could cause downstream errors

- **Sticky Note** (Data reception via Webhook - Landingpage submissions)  
  - Visual aid to annotate the block’s purpose  

---

#### 1.2 Dynamic Routing

**Overview:**  
Filters incoming submissions to direct participants to the correct webinar registration path based on their webinar selection.

**Nodes Involved:**  
- Switch  
- Sticky Note1 (Dynamic routing based on submission)

**Node Details:**

- **Switch**  
  - Type: Standard switch node  
  - Role: Routes workflow execution based on the value of the custom field `CustomField219989` from the submission JSON  
  - Configuration:  
    - Two rules checking exact string equality (case-sensitive) for webinar choices:  
      - "E-Mail Zustellung für Anfänger"  
      - "E-Mail Zustellung für Experten"  
  - Inputs: Output from KlickTipp Trigger  
  - Outputs: Two branches, each leading to a webinar registration node  
  - Edge cases:  
    - If the field value does not match any rule, no output branch triggers (no registration)  
    - Case sensitivity may cause routing failures if input data varies  
    - Missing field leads to no matches

- **Sticky Note1** (Dynamic routing based on submission)  
  - Annotates routing logic purpose    

---

#### 1.3 Webinar Registration

**Overview:**  
Registers the participant to the Zoom webinar specified by their selection using Zoom’s API, authenticated with OAuth2.

**Nodes Involved:**  
- Register for webinar A  
- Register for webinar B  
- Sticky Note2 (Register for webinar)

**Node Details:**

- **Register for webinar A**  
  - Type: HTTP Request  
  - Role: POST request to Zoom API endpoint to add a registrant to webinar ID `89062978982` ("E-Mail Zustellung für Anfänger")  
  - Configuration:  
    - URL: `https://api.zoom.us/v2/webinars/89062978982/registrants`  
    - Method: POST  
    - Body: JSON including first name, last name, email extracted dynamically from the KlickTipp Trigger node’s JSON  
    - Auth: OAuth2 credential for Zoom with `webinar:write:registrant` scope  
  - Inputs: From the Switch node’s “Anfänger” branch  
  - Outputs: Zoom API response containing webinar registration details  
  - Edge cases:  
    - Zoom API rate limiting or token expiration could cause HTTP errors  
    - Invalid Zoom webinar ID or missing webinar access  
    - Network issues or malformed request body

- **Register for webinar B**  
  - Type: HTTP Request  
  - Role: Same as above but for webinar ID `84861299706` ("E-Mail Zustellung für Experten")  
  - Configuration mirrors webinar A node, with adjusted URL and same OAuth2 credentials  
  - Inputs: From the Switch node’s “Experten” branch  
  - Outputs: Zoom API response for webinar B registration  
  - Edge cases: Same as webinar A

- **Sticky Note2** (Register for webinar)  
  - Marks the webinar registration step  

---

#### 1.4 Contact Enrichment

**Overview:**  
After successful Zoom registration, enriches the KlickTipp contact record with webinar join URL, start time, and applies segmentation tags based on the webinar registered.

**Nodes Involved:**  
- Add "Anfänger" webinar data to contact  
- Add "Experten" webinar data to contact  
- Sticky Note3 (Writing webinar data into contact)  
- Sticky Note4 (Community Node Disclaimer and detailed workflow documentation)

**Node Details:**

- **Add "Anfänger" webinar data to contact**  
  - Type: Custom KlickTipp API node (subscriber operation)  
  - Role: Subscribes or updates the contact in KlickTipp with webinar data and segment tag for the Anfänger webinar  
  - Configuration:  
    - Email: taken from KlickTipp Trigger node  
    - Tag ID: `12687810` (represents webinar participant tag)  
    - Custom fields updated:  
      - `field219991` set to Zoom webinar join URL (from Zoom API response)  
      - `field219990` set to webinar start time converted to Unix timestamp (seconds)  
    - List ID: `358895` (KlickTipp list to update)  
  - Inputs: Output from Register for webinar A node  
  - Outputs: Updated contact in KlickTipp  
  - Edge cases:  
    - KlickTipp API errors (authentication, rate limits)  
    - Missing or malformed Zoom data could cause field update failure

- **Add "Experten" webinar data to contact**  
  - Type: Same as above, but for Experten webinar segment  
  - Configuration differences:  
    - Tag ID: `12932286`  
    - Webinar start time extracted by reducing Zoom webinar occurrences array to find next upcoming occurrence, converted to Unix timestamp  
  - Inputs: Output from Register for webinar B node  
  - Outputs: Updated contact in KlickTipp  
  - Edge cases: Similar to Anfänger node, with additional complexity in date selection logic that could fail if occurrences array is empty or malformed

- **Sticky Note3** (Writing webinar data into contact)  
  - Annotates enrichment logic  

- **Sticky Note4** (Community Node Disclaimer and detailed workflow documentation)  
  - Provides detailed project context, setup instructions, benefits, and customization notes  
  - Useful for onboarding and maintenance  

---

### 3. Summary Table

| Node Name                          | Node Type                     | Functional Role                            | Input Node(s)          | Output Node(s)                             | Sticky Note                                                                                         |
|-----------------------------------|-------------------------------|--------------------------------------------|-----------------------|-------------------------------------------|---------------------------------------------------------------------------------------------------|
| KlickTipp Trigger                 | KlickTipp Trigger (community) | Receives registration data from KlickTipp | —                     | Switch                                    | This webhook waits for data from submissions on the webinar registration landing page.             |
| Switch                          | Switch                        | Routes flow based on webinar selection    | KlickTipp Trigger     | Register for webinar A, Register for webinar B | This node filters the submission based on the webinar choice of the registration process.          |
| Register for webinar A           | HTTP Request                  | Registers user for Anfänger webinar on Zoom | Switch                | Add "Anfänger" webinar data to contact   | This node registers for the "E-Mail Zustellung für Anfänger" webinar. Replace the ID in the URL with your according webinar ID. |
| Register for webinar B           | HTTP Request                  | Registers user for Experten webinar on Zoom | Switch                | Add "Experten" webinar data to contact   | This node registers for the "E-Mail Zustellung für Experten" webinar. Replace the ID in the URL with your according webinar ID.    |
| Add "Anfänger" webinar data to contact | KlickTipp API (custom)          | Updates KlickTipp contact with webinar data and tag | Register for webinar A | —                                         | This node subscribes the contact in order to add webinar data.                                    |
| Add "Experten" webinar data to contact | KlickTipp API (custom)          | Updates KlickTipp contact with webinar data and tag | Register for webinar B | —                                         | This node subscribes the contact in order to add webinar data.                                    |
| Sticky Note                     | Sticky Note                   | Annotates data reception block             | —                     | —                                         | ## Data reception via Webhook - Landingpage submissions                                          |
| Sticky Note1                    | Sticky Note                   | Annotates dynamic routing block             | —                     | —                                         | ## Dynamic routing based on submission                                                            |
| Sticky Note2                    | Sticky Note                   | Annotates webinar registration block        | —                     | —                                         | ## Regsiter for webinar                                                                            |
| Sticky Note3                    | Sticky Note                   | Annotates contact enrichment block           | —                     | —                                         | ## Writing webinar data into contact                                                              |
| Sticky Note4                    | Sticky Note                   | Provides detailed workflow documentation and disclaimer | —                     | —                                         | Community Node Disclaimer: This workflow uses KlickTipp community nodes. [Detailed notes included] |

---

### 4. Reproducing the Workflow from Scratch

1. **Create KlickTipp Trigger Node**  
   - Node Type: KlickTipp Trigger (community node)  
   - Configure webhook to listen for outbound webhook from KlickTipp landing page form submissions  
   - Ensure webhook is active and note the webhook URL to configure in KlickTipp

2. **Create Switch Node**  
   - Node Type: Switch  
   - Connect input from KlickTipp Trigger node  
   - Add two rules matching the `CustomField219989` field in the input JSON:  
     - Rule 1: equals "E-Mail Zustellung für Anfänger"  
     - Rule 2: equals "E-Mail Zustellung für Experten"  
   - Set options for case-sensitive and strict string validation

3. **Create HTTP Request Node "Register for webinar A"**  
   - Node Type: HTTP Request  
   - Connect from Switch node’s "E-Mail Zustellung für Anfänger" output  
   - Set URL: `https://api.zoom.us/v2/webinars/89062978982/registrants` (replace with your webinar ID)  
   - Method: POST  
   - Body (JSON):  
     ```json
     {
       "first_name": "={{ $json.CustomFieldFirstName }}",
       "last_name": "={{ $json.CustomFieldLastName }}",
       "email": "={{ $json.email }}"
     }
     ```  
   - Authentication: OAuth2 with Zoom credentials configured (ensure scope includes `webinar:write:registrant`)  
   - Use the predefined Zoom OAuth2 credential

4. **Create HTTP Request Node "Register for webinar B"**  
   - Node Type: HTTP Request  
   - Connect from Switch node’s "E-Mail Zustellung für Experten" output  
   - Set URL: `https://api.zoom.us/v2/webinars/84861299706/registrants` (replace with your webinar ID)  
   - Method: POST  
   - Body (JSON) similar to webinar A  
   - Authentication: same Zoom OAuth2 credential

5. **Create KlickTipp API Node "Add 'Anfänger' webinar data to contact"**  
   - Node Type: Custom KlickTipp API (subscriber subscribe operation)  
   - Connect from "Register for webinar A" node output  
   - Parameters:  
     - Email: `={{ $('KlickTipp Trigger').item.json.email }}`  
     - Tag ID: `12687810` (set according to your KlickTipp tag for Anfänger webinar)  
     - List ID: `358895` (your KlickTipp list ID)  
     - Data Fields:  
       - `field219991`: set to `={{ $json.join_url }}` from Zoom response  
       - `field219990`: set to Unix timestamp seconds from `start_time` field in Zoom response, converted with JavaScript Date object  
   - Credentials: KlickTipp API credentials configured

6. **Create KlickTipp API Node "Add 'Experten' webinar data to contact"**  
   - Node Type: Custom KlickTipp API (subscriber subscribe operation)  
   - Connect from "Register for webinar B" node output  
   - Parameters:  
     - Email: `={{ $('KlickTipp Trigger').item.json.email }}`  
     - Tag ID: `12932286` (set according to your KlickTipp tag for Experten webinar)  
     - List ID: `358895`  
     - Data Fields:  
       - `field219991`: set to `={{ $json.join_url }}`  
       - `field219990`: calculate the next upcoming occurrence’s start_time from `occurrences` array using JavaScript reduce function, convert to Unix timestamp seconds  
   - Credentials: KlickTipp API credentials configured

7. **Add Sticky Notes** (Optional but recommended)  
   - Add notes to annotate each logical block for clarity and maintenance

8. **Credential Setup**  
   - Create Zoom OAuth2 credential in n8n with scopes including `webinar:write:registrant`  
   - Create KlickTipp API credential with API access to your account  
   - Ensure OAuth redirect URLs and tokens are valid and refreshed as needed

9. **Testing**  
   - Submit test registrations via your KlickTipp landing page  
   - Confirm webhook triggers and routes correctly  
   - Verify Zoom registration via Zoom dashboard or API  
   - Check KlickTipp contact records for updated fields and tags

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Context or Link                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Community Node Disclaimer: This workflow uses KlickTipp community nodes. It automates Zoom webinar registration and synchronizes data into KlickTipp contact profiles, including segmentation tagging. Ideal for scalable webinar funnels with dynamic routing. Includes setup instructions and recommendations for OAuth credentials and KlickTipp custom fields. Includes tips for dealing with Zoom rate limits and token expiration.                                                                                                                                                                                                                             | Detailed sticky note in workflow (Sticky Note4)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| KlickTipp custom fields required: `Zoom_Join_URL` (URL), `Zoom_webinar_Start` (Date & Time), `Zoom_webinar_Auswahl` (Text). Ensure these exist in your KlickTipp account before deploying the workflow.                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Setup instructions in Sticky Note4                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Zoom OAuth2 App configuration must include `webinar:write:registrant` scope and n8n OAuth redirect URL. Refresh tokens as needed to avoid API errors during repeated registrations.                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Setup instructions in Sticky Note4                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Possible extensions: Add multiple webinars with extended switch logic, customize tagging and segmentation dynamically, integrate follow-up email triggers in KlickTipp, implement A/B testing for communications, add fallback logic for missing Zoom data.                                                                                                                                                                                                                                                                                                                                                                                             | Suggestions from Sticky Note4                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Zoom API rate limits and token expiration may cause errors during testing or high volume registrations; implement retry or staggered calls if needed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Warning from Sticky Note4                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

---

**Disclaimer:** The text provided is exclusively derived from an automated workflow created with n8n, a workflow automation tool. The processing strictly complies with applicable content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.