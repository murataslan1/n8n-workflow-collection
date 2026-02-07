Automate Stripe Customer Data Transfer to KlickTipp with Dynamic Tagging Logic

https://n8nworkflows.xyz/workflows/automate-stripe-customer-data-transfer-to-klicktipp-with-dynamic-tagging-logic-9711


# Automate Stripe Customer Data Transfer to KlickTipp with Dynamic Tagging Logic

### 1. Workflow Overview

This workflow automates the synchronization of Stripe customer and checkout data into KlickTipp, applying dynamic tagging based on purchase characteristics. It is designed to streamline the updating and segmentation of contacts in KlickTipp for targeted marketing and customer management.

Key use cases include:

- Automatically subscribing or updating customers in KlickTipp upon creation or update events in Stripe.
- Handling checkout session completions to fetch detailed purchase data.
- Applying conditional tags for high-value orders (≥100 currency units) and specific product categories (e.g., clothing).
- Enriching KlickTipp contact records with detailed billing, shipping, and purchase information.

Logical blocks:

- **1.1 Data Reception & Collection:** Listening for Stripe events (customer creation/update, checkout completion) and fetching detailed payment and line item data.
- **1.2 Customer Data Transfer:** Subscribing or updating customer contact records in KlickTipp with enriched data fields.
- **1.3 Routing Logic:** Conditional branching based on event type and purchase details (SKU, order value) to determine tagging.
- **1.4 Contact Tagging:** Applying dynamic tags in KlickTipp to enable customized marketing automation.

---

### 2. Block-by-Block Analysis

#### 1.1 Data Reception & Collection

**Overview:**  
This block listens to Stripe webhook events for new or updated customers and checkout completions. It fetches detailed payment and line item data from Stripe APIs based on event data.

**Nodes Involved:**  
- Watch new Stripe events  
- Route by event type  
- Getting line items  
- Getting charge ID  
- Getting invoice link  

**Node Details:**

- **Watch new Stripe events**  
  - *Type:* Stripe Trigger  
  - *Role:* Entry point; listens for Stripe events: `checkout.session.completed`, `customer.created`, `customer.updated`.  
  - *Config:* Uses Stripe API credentials; webhook configured for these events.  
  - *Input:* Incoming Stripe webhook.  
  - *Output:* Emits event JSON to next node.  
  - *Edge Cases:* Webhook delivery failures, invalid event payloads, API credential expiration.

- **Route by event type**  
  - *Type:* Switch  
  - *Role:* Routes workflow based on the Stripe event object type (`checkout.session` vs `customer`).  
  - *Config:* Conditions check `$json.data.object.object` for `"checkout.session"` or `"customer"`.  
  - *Input:* From Stripe event trigger.  
  - *Output:* Two paths: checkout session or customer event.  
  - *Edge Cases:* Unexpected or unsupported event types; missing object field.

- **Getting line items**  
  - *Type:* HTTP Request  
  - *Role:* Fetches line items from Stripe checkout session API to identify purchased products.  
  - *Config:* Uses `checkout.session` ID from event JSON to build URL; sets Stripe API headers including version `2025-05-28.basil` and authorization with Stripe API key.  
  - *Input:* From checkout session route branch.  
  - *Output:* Line items JSON to next node.  
  - *Edge Cases:* API rate limits, invalid session ID, network errors.

- **Getting charge ID**  
  - *Type:* HTTP Request  
  - *Role:* Retrieves charge details including receipt URL using payment intent from checkout session.  
  - *Config:* URL built using payment intent ID; sends authorization header with Stripe API key.  
  - *Input:* From "Getting line items" node.  
  - *Output:* Charge details JSON, including amount and receipt URL.  
  - *Edge Cases:* Missing or invalid payment intent, auth failures.

- **Getting invoice link**  
  - *Type:* Stripe node (Charge resource)  
  - *Role:* Gets detailed charge information to confirm payment amount and status.  
  - *Config:* Uses latest charge ID from previous node output.  
  - *Input:* From "Getting charge ID" node.  
  - *Output:* Charge details for subscription and tagging logic.  
  - *Edge Cases:* Charge not found, API errors.

---

#### 1.2 Customer Data Transfer

**Overview:**  
Subscribes or updates the customer contact record in KlickTipp with enriched personal, billing, shipping, and purchase data.

**Nodes Involved:**  
- Transfer customers to KlickTipp  
- Subscribe buyer to KlickTipp  

**Node Details:**

- **Transfer customers to KlickTipp**  
  - *Type:* KlickTipp subscriber node (community node)  
  - *Role:* Creates or updates a subscriber in KlickTipp based on Stripe customer event data.  
  - *Config:* Maps customer fields (email, name split into first and last, phone, shipping address components) to KlickTipp custom fields.  
  - *Input:* From "Route by event type" node on customer event path.  
  - *Output:* KlickTipp API response.  
  - *Edge Cases:* KlickTipp API auth errors, missing or malformed customer data, field mapping errors.

- **Subscribe buyer to KlickTipp**  
  - *Type:* KlickTipp subscriber node  
  - *Role:* Subscribes buyer after checkout completion with payment data and purchase details.  
  - *Config:* Uses billing email; sets tagId for list subscription; fills custom fields with amount, receipt URL, payment ID, and splits full name into first and last name using expressions. Extracts product descriptions from line items.  
  - *Input:* From "Getting invoice link" node.  
  - *Output:* KlickTipp subscription confirmation.  
  - *Edge Cases:* Email missing or invalid, API errors, expression evaluation errors.

---

#### 1.3 Routing Logic

**Overview:**  
This block evaluates purchase data to apply conditional logic for tagging contacts in KlickTipp based on order value and purchased SKUs.

**Nodes Involved:**  
- Route by SKU and total amount  

**Node Details:**

- **Route by SKU and total amount**  
  - *Type:* Switch  
  - *Role:* Routes workflow based on two conditions: orders ≥ 100 units and orders containing specific SKU (`TEST-002` for clothing).  
  - *Config:*  
    - Condition 1: `$json.amount` (from "Getting invoice link") ≥ 100  
    - Condition 2: Checks if any line item’s SKU equals `"TEST-002"` (from "Getting line items"). Uses `.some()` JS expression to scan items.  
  - *Input:* From "Subscribe buyer to KlickTipp" node.  
  - *Output:* Two outputs for tagging: high-value order and clothing purchase; can output both if both conditions true.  
  - *Edge Cases:* Missing amount or line items data, SKU not present, expression errors.

---

#### 1.4 Contact Tagging

**Overview:**  
Applies specific tags in KlickTipp to contacts based on routing decisions, enabling segmentation for marketing automation.

**Nodes Involved:**  
- Tag contact for high-value order  
- Tag contact for clothing purchase  

**Node Details:**

- **Tag contact for high-value order**  
  - *Type:* KlickTipp contact-tagging node  
  - *Role:* Applies a “Premium Customer” tag for orders valued ≥ 100.  
  - *Config:* Uses customer email; tag ID `13629285`.  
  - *Input:* From "Route by SKU and total amount" switch output for high-value orders.  
  - *Output:* KlickTipp tag application response.  
  - *Edge Cases:* Missing email, tag ID invalid, API failures.

- **Tag contact for clothing purchase**  
  - *Type:* KlickTipp contact-tagging node  
  - *Role:* Applies a “Clothing buyer” tag if the purchase contains clothing SKU.  
  - *Config:* Uses customer email; tag ID `13629293`.  
  - *Input:* From "Route by SKU and total amount" switch output for clothing purchases.  
  - *Output:* KlickTipp tag application response.  
  - *Edge Cases:* Same as above.

---

### 3. Summary Table

| Node Name                   | Node Type                         | Functional Role                         | Input Node(s)                 | Output Node(s)                      | Sticky Note                                                                                                            |
|-----------------------------|----------------------------------|---------------------------------------|------------------------------|-----------------------------------|------------------------------------------------------------------------------------------------------------------------|
| Watch new Stripe events      | Stripe Trigger                   | Entry point; listens for Stripe events| -                            | Route by event type                |                                                                                                                        |
| Route by event type          | Switch                          | Routes by Stripe event object type     | Watch new Stripe events       | Getting line items, Transfer customers to KlickTipp |                                                                                                                        |
| Getting line items           | HTTP Request                    | Fetches checkout session line items    | Route by event type           | Getting charge ID                 |                                                                                                                        |
| Getting charge ID            | HTTP Request                    | Fetches charge details for payment     | Getting line items            | Getting invoice link              |                                                                                                                        |
| Getting invoice link         | Stripe node (Charge resource)   | Retrieves charge info (amount, receipt)| Getting charge ID             | Subscribe buyer to KlickTipp      |                                                                                                                        |
| Subscribe buyer to KlickTipp | KlickTipp subscriber node       | Subscribes buyer with payment and purchase data | Getting invoice link          | Route by SKU and total amount     |                                                                                                                        |
| Route by SKU and total amount| Switch                         | Routes based on SKU and order value    | Subscribe buyer to KlickTipp  | Tag contact for high-value order, Tag contact for clothing purchase |                                                                                                                        |
| Tag contact for high-value order | KlickTipp contact-tagging    | Tags premium customers (order ≥100)    | Route by SKU and total amount | -                               |                                                                                                                        |
| Tag contact for clothing purchase | KlickTipp contact-tagging   | Tags clothing buyers                    | Route by SKU and total amount | -                               |                                                                                                                        |
| Transfer customers to KlickTipp | KlickTipp subscriber node     | Creates/updates customer on Stripe customer events | Route by event type           | -                               |                                                                                                                        |
| Sticky Note                  | Sticky Note                    | Section title: "1. Data reception & collection via Webhook & HTTP Requests" | -                            | -                               |                                                                                                                        |
| Sticky Note1                 | Sticky Note                    | Section title: "2. Saving data into contact record" | -                            | -                               |                                                                                                                        |
| Sticky Note2                 | Sticky Note                    | Community Node Disclaimer and Setup Instructions | -                            | -                               | Community Node Disclaimer: This workflow uses KlickTipp community nodes. Setup instructions included in note content.   |
| Sticky Note3                 | Sticky Note                    | Section title: "3. Routing for tagging" | -                            | -                               |                                                                                                                        |
| Sticky Note4                 | Sticky Note                    | Section title: "4. Contact tagging"    | -                            | -                               |                                                                                                                        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Stripe Trigger Node**  
   - Type: Stripe Trigger  
   - Configure to listen for events: `checkout.session.completed`, `customer.created`, `customer.updated`.  
   - Set up webhook with valid Stripe API credentials.

2. **Add Switch Node to Route by Event Type**  
   - Type: Switch  
   - Set two outputs with conditions on `$json.data.object.object`:  
     - Output "checkout" if equals `"checkout.session"`  
     - Output "customer" if equals `"customer"`

3. **On "checkout" path, add HTTP Request to Get Line Items**  
   - Type: HTTP Request  
   - URL: `https://api.stripe.com/v1/checkout/sessions/{{$json.data.object.id}}/line_items`  
   - Add header: `Authorization: Basic <Stripe API key>`  
   - Add header: `Stripe-Version: 2025-05-28.basil`  
   - Use Stripe API credentials.

4. **Connect "Getting line items" node to HTTP Request to Get Charge ID**  
   - Type: HTTP Request  
   - URL: `https://api.stripe.com/v1/payment_intents/{{$json.data.object.payment_intent}}`  
   - Add header: `Authorization: Basic <Stripe API key>`  
   - Use Stripe API credentials.

5. **Add Stripe Node to Get Invoice Link**  
   - Type: Stripe (Charge resource)  
   - Operation: Get charge by ID  
   - Charge ID: `={{$json.latest_charge}}` (from previous node)  
   - Use Stripe credentials.

6. **Add KlickTipp Subscriber Node to Subscribe Buyer**  
   - Email: `={{ $json.billing_details.email }}`  
   - List ID: `358895` (example, replace with actual)  
   - Tag ID: `13201265` (example default tag)  
   - Map custom fields: amount, receipt URL, payment ID, first and last name extracted from full name, and product descriptions array.  
   - Use KlickTipp API credentials.

7. **Add Switch Node for Routing by SKU and Order Value**  
   - Conditions:  
     - Output "Order Value ≥ 100": If charge amount ≥ 100  
     - Output "Order contains clothing": If any line item SKU equals `"TEST-002"`  
   - Use expressions to evaluate conditions.

8. **Add KlickTipp Contact Tagging Nodes**  
   - For high-value orders: apply tag ID `13629285` (Premium Customer)  
   - For clothing purchase: apply tag ID `13629293` (Clothing buyer)  
   - Use email from JSON for tagging.

9. **On "customer" path from event type switch, add KlickTipp Subscriber Node**  
   - Subscribe or update customer contact with email, first and last name (split from full name), phone, and shipping address fields mapped to KlickTipp custom fields.  
   - Use KlickTipp API credentials.

10. **Connect all nodes as per the flow:**  
    - Stripe Trigger → Route by Event Type  
    - Route "checkout" → Getting line items → Getting charge ID → Getting invoice link → Subscribe buyer → Route by SKU and total amount → Tagging nodes  
    - Route "customer" → Transfer customers to KlickTipp  

11. **Add sticky notes with section titles for clarity:**  
    - "1. Data reception & collection via Webhook & HTTP Requests" around Stripe trigger and HTTP nodes  
    - "2. Saving data into contact record" near KlickTipp subscriber nodes  
    - "3. Routing for tagging" near SKU and amount switch node  
    - "4. Contact tagging" near tagging nodes  

12. **Credential Setup:**  
    - Stripe API credential configured with secret key and appropriate permissions  
    - KlickTipp API credential with username/password and API access enabled  

13. **Test the workflow with sample events from Stripe (customer created, checkout completed) and verify contact creation, subscription, and tagging in KlickTipp.**

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                              | Context or Link                                                                                                   |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| Community Node Disclaimer: This workflow uses KlickTipp community nodes.                                                                                                                                                                 | Sticky Note2 content in workflow.                                                                                 |
| Setup Instructions: Prepare KlickTipp custom fields for `Products` (Text), `Total` (Decimal Number), `Payment ID` (Text), `Receipt URL` (URL), and tags `Premium customer`, `Clothing buyer`.                                              | Sticky Note2 content in workflow.                                                                                 |
| Credential Configuration: Connect Stripe account with API key; authenticate KlickTipp with API credentials.                                                                                                                              | Sticky Note2 content in workflow.                                                                                 |
| Customization Tips: Use tags to launch campaigns, use KlickTipp placeholders for dynamic emails, route buyers to portals, trigger CRM or Slack notifications, or invoice creation workflows.                                              | Sticky Note2 content in workflow.                                                                                 |
| KlickTipp API docs and community node info can provide additional guidance on field and tag ID usage.                                                                                                                                   | External resource recommendation (not linked here).                                                               |

---

*Disclaimer:* The text provided derives exclusively from an automated workflow created in n8n, an integration and automation tool. This processing strictly respects applicable content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.