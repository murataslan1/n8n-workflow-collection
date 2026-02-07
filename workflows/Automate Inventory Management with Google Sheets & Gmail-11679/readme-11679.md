Automate Inventory Management with Google Sheets & Gmail

https://n8nworkflows.xyz/workflows/automate-inventory-management-with-google-sheets---gmail-11679


# Automate Inventory Management with Google Sheets & Gmail

### 1. Workflow Overview

This workflow automates inventory procurement by integrating Google Sheets and Gmail to manage stock levels, generate purchase orders (POs), and communicate with suppliers. It runs daily to identify low-stock products, calculates reordering quantities based on thresholds and constraints, sends purchase order emails to suppliers, and logs orders to a Google Sheets document for tracking.

The workflow is logically divided into these functional blocks:

- **1.1 Scheduled Trigger and Low Stock Retrieval:** Initiates the workflow daily and fetches products marked as "Low Stock" from a Google Sheet.
- **1.2 Stock Analysis and Reorder Calculation:** Processes each low-stock product to determine if reorder is necessary and calculates order quantities.
- **1.3 Purchase Order and Email Generation:** Groups reorder items by supplier, generates purchase order details and supplier emails.
- **1.4 Conditional Routing and Email Sending:** Routes data to either send emails or handle purchase orders for storage depending on type.
- **1.5 Purchase Order Record Verification and Storage:** Checks if a purchase order record already exists; if not, stores new purchase order entries.
- **1.6 Batch Processing and Flow Control:** Manages item batching and controls flow when no action is required.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Trigger and Low Stock Retrieval

**Overview:**  
This block triggers the workflow every day and retrieves products from the inventory sheet that are marked as having low stock.

**Nodes Involved:**  
- Trigger Everyday  
- Get Low Stock Product

**Node Details:**

- **Trigger Everyday**  
  - *Type:* Schedule Trigger  
  - *Role:* Starts workflow on a daily interval (every 24 hours).  
  - *Configuration:* Default daily interval without time constraints.  
  - *Connections:* Outputs to "Get Low Stock Product".  
  - *Edge Cases:* Missed executions if n8n instance is down; ensure time zone consistency.

- **Get Low Stock Product**  
  - *Type:* Google Sheets (Read)  
  - *Role:* Reads rows from the "Inventory Management" Google Sheet filtered by "Inventory Status" column equal to "Low Stock".  
  - *Configuration:* Document ID and sheet gid specified; filter set to retrieve only low stock products.  
  - *Key Expressions:* Filter uses fixed value `"Low Stock"`.  
  - *Connections:* Outputs to "Order Handling".  
  - *Edge Cases:* API limits or auth errors; empty results if no low stock products.

---

#### 2.2 Stock Analysis and Reorder Calculation

**Overview:**  
Processes each retrieved product to check if reorder is needed based on available stock, thresholds, and min/max order constraints; calculates reorder quantities.

**Nodes Involved:**  
- Order Handling

**Node Details:**

- **Order Handling**  
  - *Type:* Code (JavaScript)  
  - *Role:* For each product, calculates whether reorder is needed and the quantity to order.  
  - *Configuration:*  
    - Reads fields: SKU, Name, Supplier, Supplier Email, Available Qty, Min Threshold, Min Order, Max Order.  
    - Logic: If available < threshold, reorder quantity = threshold - available, adjusted to min/max order limits.  
    - Outputs enriched JSON with reorder status and quantity.  
  - *Key Expressions:* Uses numeric conversions and conditional logic inside code node.  
  - *Connections:* Outputs to "Generate Email & PO".  
  - *Edge Cases:* Missing or invalid numeric fields can cause NaN; ensures fallback to 0.

---

#### 2.3 Purchase Order and Email Generation

**Overview:**  
Groups reorder items by supplier, generates purchase order numbers, and creates email content with order details for each supplier.

**Nodes Involved:**  
- Generate Email & PO

**Node Details:**

- **Generate Email & PO**  
  - *Type:* Code (JavaScript)  
  - *Role:* Aggregates reorder items by supplier email, constructs purchase order numbers (based on timestamp), and generates two outputs per supplier: an email object and separate purchase order row entries for the sheet.  
  - *Configuration:*  
    - Groups items by supplier email.  
    - Email body lists items with SKU and quantities.  
    - PO number format: `PO-<timestamp>`.  
  - *Key Expressions:* Date and timestamp generation for PO number; string templating for email body.  
  - *Connections:* Outputs to "Switch Email & PO".  
  - *Edge Cases:* Empty input results in no emails or PO entries; all generated POs share the same timestamp.

---

#### 2.4 Conditional Routing and Email Sending

**Overview:**  
Routes data based on type for either sending emails or further processing purchase order entries.

**Nodes Involved:**  
- Switch Email & PO  
- Send Order to Supplier  
- Loop Over Items

**Node Details:**

- **Switch Email & PO**  
  - *Type:* Switch  
  - *Role:* Directs data to different paths based on the field `type`.  
  - *Configuration:*  
    - If `type` equals "email", route to "Send Order to Supplier".  
    - If `type` equals "po", route to "Loop Over Items".  
  - *Key Expressions:* Uses strict string equality on `$json.type`.  
  - *Connections:*  
    - Email output → "Send Order to Supplier"  
    - Purchase Order output → "Loop Over Items"  
  - *Edge Cases:* Unexpected `type` values will result in no output path.

- **Send Order to Supplier**  
  - *Type:* Gmail (Send Email)  
  - *Role:* Sends purchase order emails to suppliers.  
  - *Configuration:*  
    - Recipient email from `supplier_email`.  
    - Subject and body dynamically constructed from previous code output.  
    - Email type: plain text, attribution disabled.  
  - *Key Expressions:* Uses expressions for `sendTo`, `subject`, and `message` fields.  
  - *Connections:* No outputs, terminal send node.  
  - *Edge Cases:* Gmail API limits, authentication failure, invalid email addresses.

- **Loop Over Items**  
  - *Type:* SplitInBatches  
  - *Role:* Processes purchase order items one by one or in batches.  
  - *Configuration:* Default batch options, effectively iterates over PO items.  
  - *Connections:* Outputs to "Get Purchase Order" node.  
  - *Edge Cases:* Large data sets may affect performance; batching mitigates this.

---

#### 2.5 Purchase Order Record Verification and Storage

**Overview:**  
Checks if a purchase order entry already exists for a SKU and supplier with status "In Progress" before appending new records to prevent duplicates.

**Nodes Involved:**  
- Get Purchase Order  
- Check Record Exists Or Not  
- Store a Purchase Order  
- No Operation, do nothing

**Node Details:**

- **Get Purchase Order**  
  - *Type:* Google Sheets (Read)  
  - *Role:* Queries the purchase order sheet for records matching the SKU and with "In Progress" status.  
  - *Configuration:*  
    - Filter on SKU equals current SKU.  
    - Filter on Order Status equals "In Progress".  
    - Document and sheet IDs specified.  
    - Always outputs data even if empty.  
  - *Key Expressions:* Uses dynamic lookup values from current item JSON.  
  - *Connections:* Outputs to "Check Record Exists Or Not".  
  - *Edge Cases:* Network errors, empty results, API throttling.

- **Check Record Exists Or Not**  
  - *Type:* If (Boolean Condition)  
  - *Role:* Checks if the purchase order query returned any existing records to avoid duplicates.  
  - *Configuration:* Condition tests if `Order Status` field exists in the input data.  
  - *Connections:*  
    - If true (record exists) → "No Operation, do nothing"  
    - If false (no record) → "Store a Purchase Order"  
  - *Edge Cases:* Missing or unexpected data structures could cause false negatives.

- **Store a Purchase Order**  
  - *Type:* Google Sheets (Append)  
  - *Role:* Inserts new purchase order entries into the Purchase Order sheet.  
  - *Configuration:*  
    - Maps fields: SKU, Supplier, Available, Item Name, Order Qty, PO Number, Order Date, Order Status ("In Progress"), Supplier Email.  
    - Document and sheet IDs specified.  
  - *Key Expressions:* Uses expressions referencing previous nodes for field values.  
  - *Connections:* Outputs back to "Loop Over Items" for next item processing.  
  - *Edge Cases:* API limits, authentication failure, schema mismatch.

- **No Operation, do nothing**  
  - *Type:* NoOp  
  - *Role:* Placeholder node to continue flow without changes when duplicate record found.  
  - *Connections:* Outputs back to "Loop Over Items" for next item processing.  
  - *Edge Cases:* None, acts as a pass-through.

---

#### 2.6 Documentation and Annotations

**Nodes Involved:**  
- Sticky Note  
- Sticky Note1  
- Sticky Note2

**Node Details:**

- **Sticky Note**  
  - *Content:* Explains that the code node checks product stock against minimum thresholds and creates emails based on product details.  
  - *Position:* Near "Order Handling" and "Generate Email & PO" nodes.

- **Sticky Note1**  
  - *Content:* Provides a detailed explanation of the workflow’s purpose, setup instructions, and testing advice.  
  - *Position:* Near the trigger and initial nodes.

- **Sticky Note2**  
  - *Content:* Notes that if a purchase order record already exists, the workflow skips adding a duplicate entry.  
  - *Position:* Near the purchase order checking and storage nodes.

---

### 3. Summary Table

| Node Name                 | Node Type               | Functional Role                                  | Input Node(s)            | Output Node(s)                | Sticky Note                                                                                                  |
|---------------------------|-------------------------|-------------------------------------------------|--------------------------|------------------------------|--------------------------------------------------------------------------------------------------------------|
| Trigger Everyday          | Schedule Trigger        | Initiates workflow daily                         | -                        | Get Low Stock Product         | Explains workflow purpose and setup steps.                                                                  |
| Get Low Stock Product     | Google Sheets           | Retrieves low stock inventory items             | Trigger Everyday          | Order Handling               |                                                                                                              |
| Order Handling           | Code                    | Calculates reorder necessity and quantity       | Get Low Stock Product     | Generate Email & PO           | Checks product stock vs threshold; creates reorder flags and quantities.                                     |
| Generate Email & PO      | Code                    | Groups items by supplier; creates emails and PO rows | Order Handling        | Switch Email & PO             |                                                                                                              |
| Switch Email & PO        | Switch                  | Routes data by type (email or PO)                | Generate Email & PO       | Send Order to Supplier, Loop Over Items |                                                                                                     |
| Send Order to Supplier   | Gmail                   | Sends purchase order emails                      | Switch Email & PO (Email) | -                            |                                                                                                              |
| Loop Over Items          | SplitInBatches          | Iterates PO items for processing                 | Switch Email & PO (PO)   | Get Purchase Order            |                                                                                                              |
| Get Purchase Order       | Google Sheets           | Checks for existing PO records                    | Loop Over Items           | Check Record Exists Or Not    |                                                                                                              |
| Check Record Exists Or Not | If                      | Decides to create or skip PO record               | Get Purchase Order        | Store a Purchase Order, No Operation, do nothing | Skips duplicates if PO exists.                                                                                  |
| Store a Purchase Order   | Google Sheets           | Adds new PO records to sheet                      | Check Record Exists Or Not (False) | Loop Over Items           |                                                                                                              |
| No Operation, do nothing | NoOp                    | Pass-through for skipped PO records               | Check Record Exists Or Not (True) | Loop Over Items           |                                                                                                              |
| Sticky Note              | Sticky Note             | Explains stock checking and email creation       | -                        | -                            | Describes stock threshold checks and email generation.                                                      |
| Sticky Note1             | Sticky Note             | Describes workflow purpose and setup steps       | -                        | -                            | Setup instructions and workflow overview.                                                                   |
| Sticky Note2             | Sticky Note             | Notes on PO record duplication prevention         | -                        | -                            | Explains skip logic for existing purchase orders.                                                           |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**  
   - Type: Schedule Trigger  
   - Set to trigger every day (default interval).  
   - Connect output to next node.

2. **Add Google Sheets Node to Get Low Stock Product**  
   - Type: Google Sheets (Read)  
   - Credentials: Connect your Google Sheets account.  
   - Document ID: Use your Inventory Management sheet ID.  
   - Sheet Name: Set to the inventory sheet (gid=0 or your sheet name).  
   - Filters: Set filter on column "Inventory Status" with lookup value "Low Stock".  
   - Connect output from Schedule Trigger.

3. **Add Code Node for Order Handling**  
   - Type: Code (JavaScript)  
   - Paste logic to check if reorder is needed based on available quantity, thresholds, min order, max order.  
   - Inputs: Use fields SKU, Name, Supplier, supplier_email, Available Qty, Min Threshold, Min Order, Max Order.  
   - Output enriched JSON with reorder_needed and order_qty.  
   - Connect output from Get Low Stock Product.

4. **Add Code Node to Generate Email & PO**  
   - Type: Code (JavaScript)  
   - Logic to group items by supplier email, generate PO number (e.g. "PO-" + timestamp), prepare email subject and body, output both email and PO items.  
   - Connect output from Order Handling.

5. **Add Switch Node to Route by Type**  
   - Type: Switch  
   - Condition: If `$json.type` equals "email" → route to email sending path.  
   - If `$json.type` equals "po" → route to purchase order handling path.  
   - Connect output from Generate Email & PO.

6. **Add Gmail Node to Send Order to Supplier**  
   - Type: Gmail (Send Email)  
   - Credentials: Connect your Gmail account with OAuth2.  
   - Send To: Expression `{{$json.supplier_email}}`  
   - Subject: Expression `{{$json.subject}}`  
   - Message: Expression `{{$json.body}}`  
   - Email Type: Text  
   - Connect from Switch node "Email" output.

7. **Add SplitInBatches Node to Loop Over Items**  
   - Type: SplitInBatches  
   - Default batch options (batch size 1 or more as needed).  
   - Connect from Switch node "Purchase Order" output.

8. **Add Google Sheets Node to Get Purchase Order**  
   - Type: Google Sheets (Read)  
   - Document ID and Sheet Name: Your Purchase Order sheet.  
   - Filters: SKU equals current item SKU, Order Status equals "In Progress".  
   - Always output data.  
   - Connect output from Loop Over Items.

9. **Add If Node to Check Record Exists or Not**  
   - Type: If  
   - Condition: Check if "Order Status" field exists in input data (i.e., record found).  
   - Connect output from Get Purchase Order.

10. **Add Google Sheets Node to Store a Purchase Order**  
    - Type: Google Sheets (Append)  
    - Document ID and Sheet Name: Purchase Order sheet.  
    - Map columns: SKU, Supplier, Supplier Email, Item Name, Available, Order Qty, PO Number, Order Date, Order Status ("In Progress").  
    - Connect to If node's False output (record does not exist).

11. **Add No Operation Node**  
    - Type: NoOp  
    - Connect to If node's True output (record exists).

12. **Connect Store a Purchase Order and No Operation outputs back to Loop Over Items**  
    - To continue processing next batch item.

13. **Add Sticky Notes for Documentation**  
    - Place notes near respective node groups to explain key logic and workflow steps.

---

### 5. General Notes & Resources

| Note Content                                                                                       | Context or Link                                                                                  |
|--------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Workflow automates inventory procurement by checking stock daily, generating POs, and sending emails. | Workflow purpose overview (Sticky Note1)                                                        |
| Adjust schedule trigger timing and Google Sheet document ID to suit your environment.            | Setup instructions (Sticky Note1)                                                              |
| Avoid duplicate purchase order entries by checking existing records before appending new ones.   | Data integrity note (Sticky Note2)                                                             |
| Code nodes carefully handle numeric conversions and reorder logic to prevent invalid orders.     | Implementation detail (Sticky Note)                                                             |

---

**Disclaimer:** The text above is derived exclusively from an automated workflow created with n8n, adhering strictly to content policies and containing no illegal or protected elements. All data handled is legal and public.