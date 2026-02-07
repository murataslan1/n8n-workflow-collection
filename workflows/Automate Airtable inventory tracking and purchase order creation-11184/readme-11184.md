Automate Airtable inventory tracking and purchase order creation

https://n8nworkflows.xyz/workflows/automate-airtable-inventory-tracking-and-purchase-order-creation-11184


# Automate Airtable inventory tracking and purchase order creation

### 1. Workflow Overview

This n8n workflow automates inventory tracking and purchase order (PO) management using Airtable as the data backend. Its core purpose is to maintain optimal stock levels by automatically creating draft purchase orders, adding products to them when inventory falls below predefined thresholds, and preparing supplier order emails without sending them automatically. Additionally, it includes a manual test section to simulate sales orders (SO) to test the reorder logic.

The workflow is structured into logical blocks that align with key functionalities:

- **1.1 Draft Purchase Order Management:**  
  Ensures that each supplier always has a draft PO available. If none exists, it automatically creates one.

- **1.2 Auto-Add Products to Purchase Orders:**  
  Runs on an hourly schedule to identify products needing replenishment and adds the required quantities to the supplier’s draft PO by updating or creating associated stock-in records.

- **1.3 Purchase Order Email Preparation and Sending:**  
  Detects when a PO status changes to "Needs Email," generates the email body, and sends the purchase order to the supplier’s email address. Following sending, the PO status updates to "Order."

- **1.4 Test Sales Order Generation (Manual Trigger):**  
  Simulates daily sales by randomly selling quantities from available products to test the reorder and PO creation logic.

---

### 2. Block-by-Block Analysis

---

#### 2.1 Draft Purchase Order Management

**Overview:**  
This block triggers when a purchase order record is modified in Airtable. It checks if any suppliers lack a draft PO and creates one if necessary, ensuring continuous availability of draft orders.

**Nodes Involved:**  
- PO Modified (Airtable Trigger)  
- Find Suppliers Without Draft PO (Airtable)  
- Create a Draft PO (Airtable)  
- Requirements Overview Note (Sticky Note)  
- Draft PO Creation Section (Sticky Note)

**Node Details:**

- **PO Modified**  
  - Type: Airtable Trigger  
  - Role: Watches for changes in the "Purchase Orders" table, triggering on “Last Modified” field changes every minute.  
  - Config: Polling enabled every minute, authenticates via Airtable Personal Access Token.  
  - Inputs: None (trigger node)  
  - Outputs: Triggers downstream nodes to check suppliers without draft POs.  
  - Edge Cases: Potential Airtable API rate limits or token expiration; trigger may miss changes if polling delays occur.

- **Find Suppliers Without Draft PO**  
  - Type: Airtable (Search)  
  - Role: Retrieves suppliers whose "Draft PO Count" equals zero (no draft PO exists).  
  - Config: Filters suppliers where `{Draft PO Count} = 0`.  
  - Inputs: Triggered by “PO Modified.”  
  - Outputs: List of supplier records without draft POs.  
  - Edge Cases: Empty results if all suppliers have draft POs; API errors or token issues.

- **Create a Draft PO**  
  - Type: Airtable (Create)  
  - Role: Creates a new draft purchase order record for each supplier found without one.  
  - Config: Sets "Status" to "Draft" and links the PO to the supplier by ID.  
  - Inputs: Supplier records from “Find Suppliers Without Draft PO.”  
  - Outputs: Newly created draft PO records.  
  - Edge Cases: Possible duplicate draft POs if concurrent triggers run; Airtable write failures.

- **Sticky Notes ("Requirements Overview Note" and "Draft PO Creation Section")**  
  - Provide contextual explanations and summaries of the draft PO creation logic.

---

#### 2.2 Auto-Add Products to Purchase Orders

**Overview:**  
This block runs on an hourly schedule. It identifies products needing replenishment (where forecast quantity ≤ threshold), finds or creates stock-in records linked to the supplier’s draft PO, and updates quantities accordingly, effectively adding products to draft POs.

**Nodes Involved:**  
- Check Products Hourly (Schedule Trigger)  
- Find Products Need Purchase (Airtable)  
- Find Existing Stock In (Airtable)  
- Merge Product and Stock In Data (Merge)  
- Find Draft PO for Supplier (Airtable)  
- Is there Stock In Already (If)  
- Update Stock In (Airtable)  
- Create Stock In (Airtable)  
- Auto Add Products Section (Sticky Note)

**Node Details:**

- **Check Products Hourly**  
  - Type: Schedule Trigger  
  - Role: Triggers workflow every hour to check product stock levels.  
  - Config: Interval set to every 1 hour.  
  - Inputs: None (trigger node)  
  - Outputs: Triggers the product search for reorder needs.

- **Find Products Need Purchase**  
  - Type: Airtable (Search)  
  - Role: Finds products flagged as needing refill (`{Needs Refill} = 1`).  
  - Config: Search filter on the "Products" table with above condition.  
  - Inputs: From schedule trigger.  
  - Outputs: List of products needing purchase.  
  - Edge Cases: Empty output if no products need refill; API issues.

- **Find Existing Stock In**  
  - Type: Airtable (Search)  
  - Role: Searches for existing stock-in records related to the product and draft POs with status "Draft."  
  - Config: Filters based on SKU and status helper field matching product SKU and "Draft" status.  
  - Inputs: Product records from previous node.  
  - Outputs: Existing stock-in records if any.  
  - Edge Cases: Multiple matching records might cause conflicts; empty if none found.

- **Merge Product and Stock In Data**  
  - Type: Merge  
  - Role: Combines product data and stock-in records by matching product ID.  
  - Config: Merge mode is "keep everything" with suffix addition on collisions.  
  - Inputs: Product data and stock-in data.  
  - Outputs: Combined data structure to determine if stock-in exists.  
  - Edge Cases: Mismatched IDs may cause missing merges.

- **Find Draft PO for Supplier**  
  - Type: Airtable (Search)  
  - Role: Retrieves the draft purchase order corresponding to the product's draft PO ID.  
  - Config: Filters purchase orders by PO ID matching the draft PO ID from merged data.  
  - Inputs: Merged data.  
  - Outputs: Draft PO record(s).  
  - Edge Cases: No match found if PO ID is incorrect or missing.

- **Is there Stock In Already**  
  - Type: If  
  - Role: Conditional node to check if a stock-in record already exists.  
  - Config: Condition checks if merged stock-in record ID is truthy.  
  - Inputs: Draft PO search output.  
  - Outputs: Routes flow to update or create stock-in records.  
  - Edge Cases: False negatives if data missing or malformed.

- **Update Stock In**  
  - Type: Airtable (Update)  
  - Role: Updates quantity of an existing stock-in record to add refill quantity minus forecast quantity.  
  - Config: Updates by record ID, quantity calculated as `Refill Qty - Forecast Qty` for the product.  
  - Inputs: If condition true branch.  
  - Outputs: Updated stock-in record.  
  - Edge Cases: Airtable update failures; calculation errors if fields missing.

- **Create Stock In**  
  - Type: Airtable (Create)  
  - Role: Creates new stock-in record if none exists, linking product and PO, with quantity as above.  
  - Config: Sets product, quantity, and purchase order references.  
  - Inputs: If condition false branch.  
  - Outputs: New stock-in record.  
  - Edge Cases: Duplicate creation if race conditions occur; API errors.

- **Auto Add Products Section (Sticky Note)**  
  - Summarizes the logic to add products to purchase orders based on threshold levels.

---

#### 2.3 Purchase Order Email Preparation and Sending

**Overview:**  
This block triggers when a purchase order’s status changes to "Needs Email." It generates an email body with the order details and sends the email to the supplier using Gmail OAuth2 credentials. After sending, it updates the PO status to "Order."

**Nodes Involved:**  
- PO Enters Needs Email (Airtable Trigger)  
- Send out PO to Supplier (Gmail)  
- Update PO Status (Airtable)  
- Email Orders Section (Sticky Note)

**Node Details:**

- **PO Enters Needs Email**  
  - Type: Airtable Trigger  
  - Role: Watches for POs whose "Status" field equals "Needs Email," triggering every minute.  
  - Config: Filter formula `{Status} = "Needs Email"`.  
  - Inputs: Trigger node.  
  - Outputs: Triggers the email sending node.  
  - Edge Cases: Overlapping triggers if status toggles quickly; missed triggers if polling delayed.

- **Send out PO to Supplier**  
  - Type: Gmail (Send Email)  
  - Role: Sends the purchase order email to the supplier’s email address.  
  - Config:  
    - Recipient: Hardcoded "supplier@example.com" (should be updated dynamically in production)  
    - Subject: Includes PO ID dynamically from JSON  
    - Message: Uses the "Order Email Body" field from PO record  
    - Email type: Plain text  
  - Inputs: PO records with "Needs Email" status.  
  - Outputs: Email sent confirmation triggers PO status update.  
  - Edge Cases: Gmail OAuth2 token expiry or failure; invalid email addresses; email quota limits.

- **Update PO Status**  
  - Type: Airtable (Update)  
  - Role: Updates the PO status from "Needs Email" to "Order" after email sending.  
  - Config: Updates PO record by ID, changing "Status" field to "Order."  
  - Inputs: After email sent.  
  - Outputs: Updated PO record.  
  - Edge Cases: Airtable write failures; race conditions if status changes elsewhere.

- **Email Orders Section (Sticky Note)**  
  - Provides a summary that this block handles sending out orders to suppliers via email.

---

#### 2.4 Test Sales Order Generation (Manual Trigger)

**Overview:**  
This manual trigger section simulates daily sales orders by randomly reducing product quantities from available stock. It creates sales orders and sales order lines in Airtable for testing the reorder automation.

**Nodes Involved:**  
- Manual Trigger for Test SO (Manual Trigger)  
- List Products (Airtable)  
- Create SO (Airtable)  
- Create SO Line (Airtable)  
- Random SO Generator Section (Sticky Note)

**Node Details:**

- **Manual Trigger for Test SO**  
  - Type: Manual Trigger  
  - Role: Allows manual initiation of the test sales order generation workflow.  
  - Config: No parameters; user triggers manually.  
  - Inputs: None.  
  - Outputs: Triggers product listing.

- **List Products**  
  - Type: Airtable (Search)  
  - Role: Retrieves products with current quantity ≥ 1 to simulate sales only on available stock.  
  - Config: Filter formula `{Current Qty} >= 1`.  
  - Inputs: Manual trigger.  
  - Outputs: List of available products.

- **Create SO**  
  - Type: Airtable (Create)  
  - Role: Creates a new sales order record with a randomly generated sales order ID and status "Sent."  
  - Config:  
    - SO ID: Random hex string generated by expression.  
    - Status: "Sent"  
  - Inputs: From manual trigger.  
  - Outputs: Created sales order record.

- **Create SO Line**  
  - Type: Airtable (Create)  
  - Role: For each product, creates a sales order line with a random quantity sold (0 up to current quantity).  
  - Config:  
    - Product linked by ID  
    - Quantity: Random integer between 0 and product’s current quantity  
    - Sales Order linked to created SO.  
  - Inputs: Products from list and SO from previous node.  
  - Outputs: Sales order line records.

- **Random SO Generator Section (Sticky Note)**  
  - Notes this block is for testing only to simulate random sales orders.

---

### 3. Summary Table

| Node Name                    | Node Type               | Functional Role                              | Input Node(s)                  | Output Node(s)                          | Sticky Note                                                                                      |
|------------------------------|-------------------------|----------------------------------------------|-------------------------------|----------------------------------------|------------------------------------------------------------------------------------------------|
| Requirements Overview Note    | Sticky Note             | Provides overview and requirements           |                               |                                        | "Auto Draft PO..." overview of the workflow's functionality                                    |
| Draft PO Creation Section     | Sticky Note             | Describes draft PO creation logic             |                               |                                        | "## Create a Draft PO if there's none"                                                        |
| PO Modified                  | Airtable Trigger        | Triggers on PO modifications                   |                               | Find Suppliers Without Draft PO         |                                                                                                |
| Find Suppliers Without Draft PO | Airtable (Search)       | Finds suppliers lacking draft POs              | PO Modified                   | Create a Draft PO                       |                                                                                                |
| Create a Draft PO            | Airtable (Create)       | Creates draft purchase order records           | Find Suppliers Without Draft PO |                                        |                                                                                                |
| Auto Add Products Section     | Sticky Note             | Describes logic to add products to POs         |                               |                                        | "## Adds Products to Purchase Order Based on Threshold"                                       |
| Check Products Hourly        | Schedule Trigger        | Triggers hourly product replenishment checks   |                               | Find Products Need Purchase             |                                                                                                |
| Find Products Need Purchase  | Airtable (Search)       | Finds products flagged for refill               | Check Products Hourly          | Find Existing Stock In, Merge Product and Stock In Data |                                                                                                |
| Find Existing Stock In       | Airtable (Search)       | Finds existing stock-in records for products    | Find Products Need Purchase    | Merge Product and Stock In Data         |                                                                                                |
| Merge Product and Stock In Data | Merge                  | Combines product and stock-in data              | Find Existing Stock In         | Find Draft PO for Supplier              |                                                                                                |
| Find Draft PO for Supplier    | Airtable (Search)       | Finds draft PO for given supplier/product       | Merge Product and Stock In Data | Is there Stock In Already                |                                                                                                |
| Is there Stock In Already    | If                      | Checks if stock-in record exists                 | Find Draft PO for Supplier     | Update Stock In (true), Create Stock In (false) |                                                                                                |
| Update Stock In              | Airtable (Update)       | Updates existing stock-in record quantity        | Is there Stock In Already (true) |                                        |                                                                                                |
| Create Stock In              | Airtable (Create)       | Creates new stock-in record                       | Is there Stock In Already (false) |                                        |                                                                                                |
| PO Enters Needs Email        | Airtable Trigger        | Triggers when PO status changes to "Needs Email" |                               | Send out PO to Supplier                 |                                                                                                |
| Send out PO to Supplier      | Gmail                   | Sends purchase order email to supplier          | PO Enters Needs Email          | Update PO Status                        |                                                                                                |
| Update PO Status             | Airtable (Update)       | Updates PO status to "Order" after email sent   | Send out PO to Supplier        |                                        |                                                                                                |
| Email Orders Section         | Sticky Note             | Describes email sending to suppliers             |                               |                                        | "## Sends out order to Suppliers in Email"                                                   |
| Manual Trigger for Test SO   | Manual Trigger          | Manually triggers test sales order generation    |                               | Create SO                              |                                                                                                |
| List Products               | Airtable (Search)       | Lists products with current quantity ≥ 1        | Manual Trigger for Test SO     | Create SO Line                         |                                                                                                |
| Create SO                   | Airtable (Create)       | Creates random test sales order                   | Manual Trigger for Test SO     | List Products                          |                                                                                                |
| Create SO Line              | Airtable (Create)       | Creates sales order lines with random quantities | List Products                 |                                        |                                                                                                |
| Random SO Generator Section  | Sticky Note             | Notes test sales order generation                 |                               |                                        | "## For test - generate random SO"                                                           |
| Workflow Description         | Sticky Note             | Detailed workflow overview and setup instructions|                               |                                        | Describes setup, usage, and base copy link                                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Setup Airtable Base and Credentials**  
   - Copy the Airtable Inventory Management base from https://airtable.com/appN9ivOwGQt1FwT5/shr1ApcBSi4SOVoPh into your Airtable account.  
   - Create a Personal Access Token in Airtable with read/write access to your base.  
   - Configure n8n Airtable credentials using this token.

2. **Create Trigger Node: PO Modified**  
   - Type: Airtable Trigger  
   - Base: Your copied Airtable base  
   - Table: Purchase Orders  
   - Trigger field: "Last Modified"  
   - Poll interval: every minute  
   - Credentials: set with Airtable Personal Access Token

3. **Create Node: Find Suppliers Without Draft PO**  
   - Type: Airtable (Search)  
   - Base: same base  
   - Table: Suppliers  
   - Filter formula: `{Draft PO Count} = 0`  
   - Connect input from "PO Modified"

4. **Create Node: Create a Draft PO**  
   - Type: Airtable (Create)  
   - Base: same  
   - Table: Purchase Orders  
   - Set fields:  
     - Status: "Draft"  
     - Supplier: link to supplier ID from previous node  
   - Connect input from "Find Suppliers Without Draft PO"

5. **Create Schedule Trigger: Check Products Hourly**  
   - Type: Schedule Trigger  
   - Interval: Every 1 hour

6. **Create Node: Find Products Need Purchase**  
   - Type: Airtable (Search)  
   - Table: Products  
   - Filter formula: `{Needs Refill} = 1`  
   - Connect input from "Check Products Hourly"

7. **Create Node: Find Existing Stock In**  
   - Type: Airtable (Search)  
   - Table: Stock In  
   - Filter formula: `={SKU and Status (helper)} = "{{ $json.SKU }} - Draft"` (use expression referencing product SKU)  
   - Connect input from "Find Products Need Purchase"

8. **Create Node: Merge Product and Stock In Data**  
   - Type: Merge  
   - Mode: Combine, keep everything  
   - Join by fields: product ID matching stock-in Product[0] field  
   - Connect inputs from "Find Products Need Purchase" and "Find Existing Stock In"

9. **Create Node: Find Draft PO for Supplier**  
   - Type: Airtable (Search)  
   - Table: Purchase Orders  
   - Filter formula: `{PO ID} = "{{ $json['Draft PO ID_2'][0] }}"` (expression accessing draft PO ID from merged data)  
   - Connect input from "Merge Product and Stock In Data"

10. **Create Node: Is there Stock In Already**  
    - Type: If  
    - Condition: Check if `$('Merge Product and Stock In Data').item.json.id_1` exists (truthy)  
    - Connect input from "Find Draft PO for Supplier"

11. **Create Node: Update Stock In**  
    - Type: Airtable (Update)  
    - Table: Stock In  
    - Update record by ID from merged data  
    - Quantity: `Refill Qty - Forecast Qty` (calculate from product data)  
    - Connect input from "Is there Stock In Already" (true branch)

12. **Create Node: Create Stock In**  
    - Type: Airtable (Create)  
    - Table: Stock In  
    - Fields:  
      - Product: Link to product ID  
      - Quantity: `Refill Qty - Forecast Qty`  
      - Purchase Order: Link to PO ID from draft PO found  
    - Connect input from "Is there Stock In Already" (false branch)

13. **Create Trigger Node: PO Enters Needs Email**  
    - Type: Airtable Trigger  
    - Table: Purchase Orders  
    - Poll every minute  
    - Filter formula: `{Status} = "Needs Email"`  
    - Credentials: Airtable Personal Access Token

14. **Create Node: Send out PO to Supplier**  
    - Type: Gmail (Send Email)  
    - Set recipient dynamically (update from PO supplier email field if possible)  
    - Subject: "New Order - No. {{ $json.fields['PO ID'] }}"  
    - Message body: Use field "Order Email Body" from PO record  
    - Credentials: Gmail OAuth2 account configured  
    - Connect input from "PO Enters Needs Email"

15. **Create Node: Update PO Status**  
    - Type: Airtable (Update)  
    - Table: Purchase Orders  
    - Update record by ID from "PO Enters Needs Email"  
    - Change status to "Order"  
    - Connect input from "Send out PO to Supplier"

16. **Create Manual Trigger: Manual Trigger for Test SO**  
    - Type: Manual Trigger

17. **Create Node: Create SO**  
    - Type: Airtable (Create)  
    - Table: Sales Orders  
    - SO ID: Generate random hex string (e.g., `{{ Math.random().toString(16).slice(2,10) }}`)  
    - Status: "Sent"  
    - Connect input from manual trigger

18. **Create Node: List Products**  
    - Type: Airtable (Search)  
    - Table: Products  
    - Filter formula: `{Current Qty} >= 1`  
    - Connect input from "Create SO"

19. **Create Node: Create SO Line**  
    - Type: Airtable (Create)  
    - Table: Stock Out  
    - Fields:  
      - Product: Link to product ID  
      - Quantity: Random integer between 0 and current qty (expression)  
      - Sales Order: Link to created SO  
    - Connect input from "List Products"

---

### 5. General Notes & Resources

| Note Content                                                                                      | Context or Link                                                                                           |
|--------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| The entire Airtable base with tables and fields is publicly available to copy for setup.         | https://airtable.com/appN9ivOwGQt1FwT5/shr1ApcBSi4SOVoPh                                                  |
| Gmail OAuth2 credentials are required to send emails via the Gmail node.                          | Setup Gmail API and OAuth2 in n8n credentials manager                                                     |
| The workflow runs hourly for product stock checks; this interval can be adjusted in the schedule.| "Check Products Hourly" node                                                                             |
| All reorder thresholds, supplier emails, and refill quantities are managed inside Airtable.       | No hardcoded values inside the workflow except for a placeholder email address in the Gmail node         |
| The manual test sales order generation simulates real-world sales to test reorder logic.          | Useful for testing without real sales data                                                               |
| Sticky notes provide in-flow documentation and summaries for easier understanding and maintenance.| They explain key blocks: Draft PO creation, auto-add products, email sending, and testing                 |

---

This document comprehensively describes the workflow’s structure, node configurations, and logic, enabling users and automation agents to understand, reproduce, and troubleshoot the automation effectively.

**Disclaimer:** The provided text is exclusively derived from an automated workflow designed with n8n integration and automation tool. It complies strictly with content policies and contains no illegal, offensive, or protected material. All processed data is legal and public.