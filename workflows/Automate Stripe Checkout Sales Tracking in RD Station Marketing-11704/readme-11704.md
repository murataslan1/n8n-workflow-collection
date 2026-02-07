Automate Stripe Checkout Sales Tracking in RD Station Marketing

https://n8nworkflows.xyz/workflows/automate-stripe-checkout-sales-tracking-in-rd-station-marketing-11704


# Automate Stripe Checkout Sales Tracking in RD Station Marketing

### 1. Workflow Overview

This workflow automates the process of tracking Stripe Checkout sales within RD Station Marketing by capturing completed checkout sessions and sending detailed order data to RD Station Marketing’s event API. It targets e-commerce businesses using Stripe for payment processing and RD Station Marketing for customer relationship management and marketing automation.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception and Payment Validation:** Listens to Stripe’s webhook for completed checkout sessions and filters only fully paid transactions.

- **1.2 Product Items Retrieval and Processing:** Fetches detailed line items from the Stripe payment intent, splits and prepares product-level data.

- **1.3 Data Aggregation and Payload Preparation:** Aggregates product data, compiles order-level details, and formats the payload for RD Station Marketing.

- **1.4 Event Registration on RD Station Marketing:** Sends the prepared payload to RD Station Marketing via its API to log the e-commerce order paid event.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Payment Validation

**Overview:**  
This block receives Stripe webhook notifications triggered by checkout session completions and filters out only those with confirmed payment status and non-zero total amounts.

**Nodes Involved:**  
- Stripe Trigger  
- Split Out  
- onlyPaid

**Node Details:**

- **Stripe Trigger**  
  - Type: Stripe Trigger (Webhook Listener)  
  - Configuration: Listens for `checkout.session.completed` events from Stripe. Uses Stripe API credentials.  
  - Inputs: External Stripe webhook POST requests.  
  - Outputs: Raw event data containing checkout session details.  
  - Edge Cases: Webhook misconfiguration, authentication failure with Stripe credentials, missing or malformed event data.  
  - Notes: Webhook URL must be registered in Stripe dashboard to receive events.

- **Split Out**  
  - Type: Split Out  
  - Configuration: Splits the incoming event's `data` field array into individual items for processing.  
  - Inputs: Output from Stripe Trigger.  
  - Outputs: Individual checkout session objects.  
  - Edge Cases: Empty or unexpected data structure might cause no outputs.

- **onlyPaid**  
  - Type: Filter  
  - Configuration: Filters only events where `payment_status` equals `"paid"` and `amount_total` is greater than 0.  
  - Expression Conditions:  
    - `{{ $json.payment_status }} === "paid"`  
    - `{{ $json.amount_total }} > 0`  
  - Inputs: Individual checkout sessions from Split Out.  
  - Outputs: Only fully paid checkout sessions.  
  - Edge Cases: Events with other payment statuses (e.g., pending, failed) are excluded; missing fields may cause expression errors.

---

#### 2.2 Product Items Retrieval and Processing

**Overview:**  
Fetches detailed line items associated with the payment intent from Stripe, then splits and reformats product-level data for aggregation.

**Nodes Involved:**  
- getItems  
- splitProducts  
- prepareItemsData

**Node Details:**

- **getItems**  
  - Type: HTTP Request  
  - Configuration: Calls Stripe API endpoint `/v1/payment_intents/{payment_intent}/amount_details_line_items` using the `payment_intent` ID from the event JSON. Uses Stripe API credentials.  
  - Inputs: Output from onlyPaid node.  
  - Outputs: Line items data for the payment intent.  
  - Edge Cases: API errors such as invalid payment intent ID, expired credentials, or rate limiting by Stripe.  
  - Requirements: Stripe API must support this endpoint; ensure the used API version supports `amount_details_line_items`.

- **splitProducts**  
  - Type: Split Out  
  - Configuration: Splits the `data` field from the line items response into individual product entries.  
  - Inputs: Output from getItems.  
  - Outputs: Individual product line items.  
  - Edge Cases: Empty line items; unexpected data structure.

- **prepareItemsData**  
  - Type: Set  
  - Configuration: Maps Stripe line item fields to custom keys expected by RD Station Marketing:  
    - `product_id` ← `product_code`  
    - `product_title` ← `product_name`  
    - `price` ← `unit_cost / 100` (to convert cents to currency units)  
    - `quantity` ← `quantity`  
    - `variant_id` ← `product_code`  
    - `sku` ← `product_code`  
  - Inputs: Individual product items from splitProducts.  
  - Outputs: Structured product data objects.  
  - Edge Cases: Missing fields in Stripe line items may cause undefined values.

---

#### 2.3 Data Aggregation and Payload Preparation

**Overview:**  
Aggregates all product items back into a single array, merges product and order data, and prepares a structured payload to send to RD Station Marketing.

**Nodes Involved:**  
- Aggregate  
- Merge  
- preparePayload

**Node Details:**

- **Aggregate**  
  - Type: Aggregate  
  - Configuration: Aggregates all prepared product data items into an array field named `line_items`.  
  - Inputs: Output from prepareItemsData.  
  - Outputs: Aggregated array of product line items.  
  - Edge Cases: No items aggregated would result in an empty array.

- **Merge**  
  - Type: Merge  
  - Configuration: Combines two input streams by position:  
    - Input 1: Filtered checkout session data (from onlyPaid)  
    - Input 2: Aggregated product line items (from Aggregate)  
  - Clash Handling: Prefers last values in case of key conflicts.  
  - Inputs: onlyPaid output and Aggregate output.  
  - Outputs: Merged JSON object containing both order and line items data.  
  - Edge Cases: Inputs arriving out of sync or missing may cause incomplete merges.

- **preparePayload**  
  - Type: Set  
  - Configuration: Sets and formats final payload fields for RD Station Marketing event:  
    - `currency` (uppercase)  
    - `identifier` (payment_intent)  
    - `price` (amount_total / 100)  
    - `shipping_price` (shipping_cost / 100)  
    - `total_items` (count of line_items)  
    - `line_items` (array of products)  
    - `email` (customer email)  
  - Inputs: Output from Merge.  
  - Outputs: Final payload JSON for event registration.  
  - Edge Cases: Missing fields like `shipping_cost` or `customer_details.email` may result in undefined or null values.

---

#### 2.4 Event Registration on RD Station Marketing

**Overview:**  
Sends the prepared order and payment event payload to RD Station Marketing’s API to register the e-commerce order paid event.

**Nodes Involved:**  
- send2RDMKT

**Node Details:**

- **send2RDMKT**  
  - Type: HTTP Request  
  - Configuration:  
    - URL: `https://api.rd.services/platform/events`  
    - Method: POST  
    - Headers: `accept: application/json`, `content-type: application/json`  
    - Query Parameters: `event_type=ECOMMERCE_ORDER_PAID`  
    - Body Parameters: JSON containing:  
      - `event_type`: `"ECOMMERCE_ORDER_PAID"`  
      - `event_family`: `"CDP"`  
      - `payload`: The prepared payload JSON from previous node  
    - Authentication: RD Station Marketing OAuth2 credentials  
  - Inputs: Output from preparePayload.  
  - Outputs: HTTP response from RD Station Marketing API.  
  - Edge Cases: OAuth token expiration, API rate limits, invalid payload structure, network errors.

---

### 3. Summary Table

| Node Name       | Node Type            | Functional Role                              | Input Node(s)          | Output Node(s)        | Sticky Note                                                                                                                   |
|-----------------|----------------------|----------------------------------------------|------------------------|-----------------------|-------------------------------------------------------------------------------------------------------------------------------|
| Stripe Trigger  | Stripe Trigger       | Listens for Stripe checkout session completions (webhook) | External webhook       | Split Out             | ## 1. Receive Webhook from Stripe and validate payment status<br>To use in production enviroment you'll need to get Webhook production URL and add to your Stripe account, on Webhook settings |
| Split Out       | Split Out            | Splits event data array into individual checkout sessions | Stripe Trigger         | onlyPaid              | ## 1. Receive Webhook from Stripe and validate payment status<br>To use in production enviroment you'll need to get Webhook production URL and add to your Stripe account, on Webhook settings |
| onlyPaid        | Filter               | Filters only paid checkout sessions with amount > 0 | Split Out              | Merge, getItems       | ## 1. Receive Webhook from Stripe and validate payment status<br>To use in production enviroment you'll need to get Webhook production URL and add to your Stripe account, on Webhook settings |
| getItems        | HTTP Request         | Retrieves line items from Stripe payment intent | onlyPaid               | splitProducts         | ## 2. Get list of items sold<br>Remember to update your Stripe credentials on getItems node                                    |
| splitProducts   | Split Out            | Splits line items array into individual product entries | getItems               | prepareItemsData      | ## 2. Get list of items sold<br>Remember to update your Stripe credentials on getItems node                                    |
| prepareItemsData| Set                  | Maps raw product data fields to RD Station Marketing format | splitProducts          | Aggregate             | ## 2. Get list of items sold<br>Remember to update your Stripe credentials on getItems node                                    |
| Aggregate       | Aggregate            | Aggregates product items into an array field for payload | prepareItemsData       | Merge                 | ## 3. Prepare data and register event<br>Feel free to customize informantion sent to RD Station Marketing, like adding user information collected on checkout session |
| Merge           | Merge                | Combines order data with aggregated line items | onlyPaid, Aggregate    | preparePayload        | ## 3. Prepare data and register event<br>Feel free to customize informantion sent to RD Station Marketing, like adding user information collected on checkout session |
| preparePayload  | Set                  | Prepares final event payload with order and line item details | Merge                  | send2RDMKT            | ## 3. Prepare data and register event<br>Feel free to customize informantion sent to RD Station Marketing, like adding user information collected on checkout session |
| send2RDMKT      | HTTP Request         | Sends event payload to RD Station Marketing API | preparePayload         | -                     | ## 3. Prepare data and register event<br>Feel free to customize informantion sent to RD Station Marketing, like adding user information collected on checkout session |
| Sticky Note     | Sticky Note          | Documentation and instructions               | -                      | -                     | # Register Stripe payments on RD Station Marketing... (full detailed note)                                                   |
| Sticky Note1    | Sticky Note          | Notes on webhook setup and payment validation | -                      | -                     | ## 1. Receive Webhook from Stripe and validate payment status...                                                              |
| Sticky Note2    | Sticky Note          | Reminder to update Stripe credentials        | -                      | -                     | ## 2. Get list of items sold...                                                                                                |
| Sticky Note3    | Sticky Note          | Customization suggestions for RD Station data | -                      | -                     | ## 3. Prepare data and register event...                                                                                       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Stripe Trigger Node:**  
   - Type: Stripe Trigger  
   - Event: `checkout.session.completed`  
   - Credentials: Configure with your Stripe API credentials (API keys)  
   - Notes: Copy the webhook URL and configure it in your Stripe dashboard under Webhook settings.

2. **Create Split Out Node (Split Out):**  
   - Field to split out: `data`  
   - Connect Stripe Trigger output → Split Out input.

3. **Create Filter Node (onlyPaid):**  
   - Add condition group with AND:  
     - Condition 1: String equals `paid` → Expression: `{{$json.payment_status}}`  
     - Condition 2: Number greater than 0 → Expression: `{{$json.amount_total}}`  
   - Connect Split Out output → onlyPaid input.

4. **Create HTTP Request Node (getItems):**  
   - Method: GET  
   - URL: `https://api.stripe.com/v1/payment_intents/{{ $json.payment_intent }}/amount_details_line_items`  
   - Authentication: Use Stripe API credentials (same as Stripe Trigger)  
   - Connect onlyPaid output → getItems input.

5. **Create Split Out Node (splitProducts):**  
   - Field to split out: `data`  
   - Connect getItems output → splitProducts input.

6. **Create Set Node (prepareItemsData):**  
   - Set fields:  
     - `product_id` = `{{$json.product_code}}`  
     - `product_title` = `{{$json.product_name}}`  
     - `price` = `{{$json.unit_cost / 100}}`  
     - `quantity` = `{{$json.quantity}}`  
     - `variant_id` = `{{$json.product_code}}`  
     - `sku` = `{{$json.product_code}}`  
   - Connect splitProducts output → prepareItemsData input.

7. **Create Aggregate Node (Aggregate):**  
   - Aggregate: Aggregate all item data into field `line_items`  
   - Connect prepareItemsData output → Aggregate input.

8. **Create Merge Node (Merge):**  
   - Mode: Combine  
   - Combine by position  
   - Clash handling: Prefer last value  
   - Connect two inputs:  
     - Input 1: onlyPaid output (filtered checkout session data)  
     - Input 2: Aggregate output (aggregated line items)  

9. **Create Set Node (preparePayload):**  
   - Set fields:  
     - `currency` = `{{ $json.currency?.toUpperCase() }}`  
     - `identifier` = `{{ $json.payment_intent }}`  
     - `price` = `{{ $json.amount_total / 100 }}`  
     - `shipping_price` = `{{ $json.shipping_cost / 100 }}`  
     - `total_items` = `{{ $json.line_items.length || 0 }}`  
     - `line_items` = `{{ $json.line_items }}`  
     - `email` = `{{ $json.customer_details?.email }}`  
   - Connect Merge output → preparePayload input.

10. **Create HTTP Request Node (send2RDMKT):**  
    - Method: POST  
    - URL: `https://api.rd.services/platform/events`  
    - Headers:  
      - `accept: application/json`  
      - `content-type: application/json`  
    - Query Parameters:  
      - `event_type=ECOMMERCE_ORDER_PAID`  
    - Body Parameters (JSON):  
      - `event_type`: `ECOMMERCE_ORDER_PAID`  
      - `event_family`: `CDP`  
      - `payload`: Set to `{{ $json }}` (output from preparePayload)  
    - Authentication: OAuth2 credentials for RD Station Marketing (configure OAuth2 credentials)  
    - Connect preparePayload output → send2RDMKT input.

11. **Save and Activate Workflow:**  
    - Test the Stripe webhook with a completed checkout session.  
    - Verify data is correctly sent to RD Station Marketing.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                               | Context or Link                                                                                         |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|
| This workflow instantly registers Stripe checkout sales on RD Station Marketing by listening to Stripe webhook events and sending structured order data to RD Station’s event API.                                                        | General workflow purpose and integration overview                                                      |
| [Stripe API keys setup and management](https://docs.stripe.com/keys)                                                                                                                                                                      | Stripe API key management documentation                                                                |
| [RD Station Marketing Event API documentation](https://developers.rdstation.com/reference/evento-de-pedido-pago)                                                                                                                        | RD Station Marketing event API reference                                                               |
| Community node for RD Station Marketing integration must be installed in n8n for OAuth2 authentication and API access.                                                                                                                   | [n8n-nodes-rdstation-marketing on npm](https://www.npmjs.com/package/n8n-nodes-rdstation-marketing)      |
| Self-hosted n8n instance is recommended for production due to webhook exposure requirements and credential security.                                                                                                                     | Deployment recommendation                                                                               |

---

This document fully describes the Stripe to RD Station Marketing sales tracking workflow, enabling both manual recreation and automated understanding for maintenance or extension.