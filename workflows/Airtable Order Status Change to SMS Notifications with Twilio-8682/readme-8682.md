Airtable Order Status Change to SMS Notifications with Twilio

https://n8nworkflows.xyz/workflows/airtable-order-status-change-to-sms-notifications-with-twilio-8682


# Airtable Order Status Change to SMS Notifications with Twilio

### 1. Workflow Overview

This workflow automates sending SMS notifications to customers when their order status is updated in Airtable. Targeted primarily at e-commerce users, it monitors changes in a Status Notifications Airtable table, prepares personalized SMS messages with customer-specific details, sends the messages through Twilio, and updates the delivery status back in Airtable for tracking.

The workflow is logically divided into these main blocks:

- **1.1 Monitoring Airtable for Status Changes:** Watches the notifications table for any new entries with a "To send" status.
- **1.2 Configuration Setup:** Loads critical configuration variables such as Airtable URLs and the Twilio sender number.
- **1.3 Filtering Notifications & Updating Status:** Identifies pending notifications, marks them as sending, and merges config with notification data.
- **1.4 SMS Preparation and Sending:** Creates the SMS content personalized with customer data and sends the SMS via Twilio.
- **1.5 Delivery Status Handling:** Checks if the SMS was sent successfully or failed and updates the notification's status accordingly in Airtable.
- **1.6 Workflow Documentation and Configuration Guidance:** Provides helpful notes and configuration instructions embedded in sticky notes.

---

### 2. Block-by-Block Analysis

#### 2.1 Monitoring Airtable for Status Changes

- **Overview:** Watches the Airtable Status Notifications table for new records where the order status changed and a notification is required.
- **Nodes Involved:** `Monitor Order Status Changes`
- **Node Details:**

  - **Monitor Order Status Changes**
    - Type: Airtable Trigger
    - Role: Continuously polls the specified Airtable view every minute to detect new records (triggered on the "Created" field).
    - Configuration: Uses Airtable Personal Access Token authentication; monitors a specific Airtable base and table URL.
    - Inputs: None (trigger node)
    - Outputs: Emits new or updated records representing status notifications.
    - Failure Modes: Authentication errors if token invalid; network timeouts; Airtable API rate limiting.

#### 2.2 Configuration Setup

- **Overview:** Loads and centralizes key configuration data such as Airtable table URLs and the Twilio "from" phone number for use downstream.
- **Nodes Involved:** `Config`, `Configuration Helper` (sticky note)
- **Node Details:**

  - **Config**
    - Type: Set Node
    - Role: Defines static variables like Airtable URLs and Twilio sender number.
    - Configuration: Assigns string variables for `orders_table_url`, `notifications_table_url`, `scripts_table_url` (optional), and `from_number` (Twilio phone number).
    - Inputs: Receives data from Airtable Trigger node.
    - Outputs: Passes configuration data alongside incoming data.
    - Failure Modes: None expected; misconfiguration leads to wrong URLs or sender number.

  - **Configuration Helper**
    - Type: Sticky Note
    - Role: Provides user instructions on how to update URLs and Twilio number.
    - No inputs/outputs.

#### 2.3 Filtering Notifications & Updating Status

- **Overview:** Filters records to only those notifications pending sending ("To send"), marks them as "Sending..." in Airtable to prevent duplicates, and merges configuration data with notification records.
- **Nodes Involved:** `Filter Pending Notifications`, `Mark Notification as Sending`, `Combine Config with Order Data`
- **Node Details:**

  - **Filter Pending Notifications**
    - Type: If Node
    - Role: Filters notifications where `Message Status` is "To send".
    - Configuration: Condition on `$json.fields['Message Status']` equals "To send".
    - Inputs: Receives configuration and notification data.
    - Outputs: Only passes records that require sending.
    - Failure Modes: Expression failures if field missing.

  - **Mark Notification as Sending**
    - Type: Airtable Node (Update)
    - Role: Updates the `Message Status` of the notification record to "Sending..." to lock the record.
    - Configuration: Uses URL from Config node to update the correct record by ID.
    - Inputs: Filtered notifications.
    - Outputs: Updated Airtable record.
    - Failure Modes: Airtable API errors; concurrency issues if multiple workflows update same record.

  - **Combine Config with Order Data**
    - Type: Merge Node (Combine by Position)
    - Role: Joins configuration data with notification record data to provide all required context downstream.
    - Inputs: One from Mark Notification as Sending (updated notification), one from Config node.
    - Outputs: Combined dataset.
    - Failure Modes: Mismatch in data indexing; no data to combine.

#### 2.4 SMS Preparation and Sending

- **Overview:** Uses the combined data to prepare a personalized SMS message and sends it via Twilio.
- **Nodes Involved:** `Prepare SMS Content`, `Send Order Status SMS`
- **Node Details:**

  - **Prepare SMS Content**
    - Type: Set Node
    - Role: Formats the SMS message text using customer first name and order status fields; sets "To" and "From" phone numbers.
    - Configuration: Uses expressions to extract customer first name, order status, and phone number; message template:  
      `"Hi {{First Name}}, Your order status changed to: {{Order Status}}. Any questions, call us!"`
    - Inputs: Combined config and notification data.
    - Outputs: JSON with `Message`, `To`, and `From` fields.
    - Failure Modes: Missing fields leading to empty message or incorrect phone number.

  - **Send Order Status SMS**
    - Type: Twilio Node
    - Role: Sends the SMS message.
    - Configuration: Uses Twilio credentials; sends from configured `From` number, to customer `To` number, with the prepared message.
    - Inputs: Prepared SMS content.
    - Outputs: Twilio API response.
    - Failure Modes: Twilio authentication failure; invalid phone numbers; SMS sending quota exceeded; API timeouts.

#### 2.5 Delivery Status Handling

- **Overview:** Checks if SMS was sent successfully and updates the notification record in Airtable accordingly.
- **Nodes Involved:** `Check SMS Delivery`, `Mark Notification as Success`, `Mark Notification as Failed`
- **Node Details:**

  - **Check SMS Delivery**
    - Type: If Node
    - Role: Evaluates if the previous SMS send operation had an error.
    - Configuration: Checks if `$json.error` is false (no error).
    - Inputs: Twilio send SMS output.
    - Outputs: Routes success path if no error, failure path otherwise.
    - Failure Modes: Could misinterpret errors if Twilio returns unexpected responses.

  - **Mark Notification as Success**
    - Type: Airtable Node (Update)
    - Role: Updates the notification record's `Message Status` to "Success" in Airtable.
    - Configuration: Uses notification record ID from combined data; updates Airtable using Config URLs.
    - Inputs: Success path from Check SMS Delivery.
    - Outputs: Airtable update confirmation.
    - Failure Modes: Airtable API failures; record locking conflicts.

  - **Mark Notification as Failed**
    - Type: Airtable Node (Update)
    - Role: Updates the notification record's `Message Status` to "Error" if SMS sending failed.
    - Configuration: Similar to success node but sets status to "Error".
    - Inputs: Failure path from Check SMS Delivery.
    - Outputs: Airtable update confirmation.
    - Failure Modes: Airtable API failures.

#### 2.6 Workflow Documentation and Configuration Guidance

- **Overview:** Provides embedded user documentation and guidance for setting up the workflow.
- **Nodes Involved:** `Workflow Description` (sticky note)
- **Node Details:**

  - **Workflow Description**
    - Type: Sticky Note
    - Role: Contains detailed overview, setup instructions, configuration notes, and links to Airtable base templates and Twilio signup.
    - No inputs/outputs.

---

### 3. Summary Table

| Node Name                    | Node Type           | Functional Role                        | Input Node(s)                | Output Node(s)                  | Sticky Note                                                                                                                   |
|------------------------------|---------------------|-------------------------------------|-----------------------------|-------------------------------|------------------------------------------------------------------------------------------------------------------------------|
| Monitor Order Status Changes  | Airtable Trigger    | Trigger on new notification records | None                        | Config                        |                                                                                                                              |
| Config                       | Set                 | Load config variables (URLs, numbers) | Monitor Order Status Changes | Filter Pending Notifications   | See "Configuration Helper" sticky note for setup instructions                                                                |
| Configuration Helper         | Sticky Note         | User instructions for config setup  | None                        | None                         | ## Configure here 👇👇 Update these URLs to match your Airtable base: orders_table_url, notifications_table_url, scripts_table_url (optional), from_number (your Twilio number) |
| Filter Pending Notifications | If                  | Filter notifications to send        | Config                      | Mark Notification as Sending, Combine Config with Order Data |                                                                                                                              |
| Mark Notification as Sending | Airtable (Update)    | Mark notification as "Sending..."   | Filter Pending Notifications | Combine Config with Order Data |                                                                                                                              |
| Combine Config with Order Data| Merge (Combine)      | Merge config with notification data | Mark Notification as Sending, Config | Prepare SMS Content           |                                                                                                                              |
| Prepare SMS Content          | Set                 | Prepare personalized SMS message    | Combine Config with Order Data | Send Order Status SMS          |                                                                                                                              |
| Send Order Status SMS        | Twilio               | Send SMS via Twilio                 | Prepare SMS Content          | Check SMS Delivery             |                                                                                                                              |
| Check SMS Delivery           | If                   | Check SMS send success/failure     | Send Order Status SMS        | Mark Notification as Success, Mark Notification as Failed |                                                                                                                              |
| Mark Notification as Success | Airtable (Update)    | Update status to "Success"          | Check SMS Delivery (success) | None                         |                                                                                                                              |
| Mark Notification as Failed  | Airtable (Update)    | Update status to "Error"            | Check SMS Delivery (failure) | None                         |                                                                                                                              |
| Workflow Description         | Sticky Note          | Detailed workflow overview & setup | None                        | None                         | Contains detailed overview and instructions; includes links to Airtable base template and Twilio signup                       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Airtable Trigger Node**
   - Name: `Monitor Order Status Changes`
   - Type: Airtable Trigger
   - Set to poll every minute.
   - Configure to monitor your "Status Notifications" Airtable table/view.
   - Authenticate using Airtable Personal Access Token.
   - Trigger on the "Created" field.

2. **Create Set Node for Configuration**
   - Name: `Config`
   - Type: Set
   - Define variables:
     - `orders_table_url`: URL of your Orders table (string)
     - `notifications_table_url`: URL of your Status Notifications table (string)
     - `scripts_table_url`: URL of any scripts table (optional, string)
     - `from_number`: Your Twilio phone number (string)
   - Connect input from `Monitor Order Status Changes`.

3. **Add Sticky Note for Configuration Helper**
   - Content: Instruct users to update URLs and Twilio number.

4. **Add If Node to Filter Pending Notifications**
   - Name: `Filter Pending Notifications`
   - Condition: `$json.fields['Message Status']` equals "To send"
   - Connect input from `Config`.

5. **Add Airtable Node to Mark Notifications as Sending**
   - Name: `Mark Notification as Sending`
   - Operation: Update record
   - Use `notifications_table_url` from config.
   - Map record ID dynamically from incoming data.
   - Update `Message Status` field to "Sending...".
   - Connect input from `Filter Pending Notifications` (true output).

6. **Add Merge Node to Combine Config and Order Data**
   - Name: `Combine Config with Order Data`
   - Mode: Combine by Position
   - Connect two inputs:
     - From `Mark Notification as Sending` (updated record)
     - From `Config`
   - Outputs combined records downstream.

7. **Add Set Node to Prepare SMS Content**
   - Name: `Prepare SMS Content`
   - Assign fields:
     - `Message`: Template string `"Hi {{ $json.fields['First Name (from Order)'][0] }}, Your order status changed to: {{ $json.fields['Order Status'] }}. Any questions, call us!"`
     - `To`: Customer phone number from notification data.
     - `From`: `from_number` from config.
   - Connect input from `Combine Config with Order Data`.

8. **Add Twilio Node to Send SMS**
   - Name: `Send Order Status SMS`
   - Set "To", "From", and "Message" fields from prepared data.
   - Authenticate with Twilio API credentials (Account SID, Auth Token).
   - Connect input from `Prepare SMS Content`.
   - Set onError to "Continue" to allow downstream error handling.

9. **Add If Node to Check SMS Delivery**
   - Name: `Check SMS Delivery`
   - Condition: Check if `$json.error` is not true (no error).
   - Connect input from `Send Order Status SMS`.

10. **Add Airtable Node to Mark Notification as Success**
    - Name: `Mark Notification as Success`
    - Operation: Update record
    - Use `notifications_table_url` from config.
    - Update `Message Status` to "Success".
    - Connect input from `Check SMS Delivery` (true path).

11. **Add Airtable Node to Mark Notification as Failed**
    - Name: `Mark Notification as Failed`
    - Operation: Update record
    - Use same table URL.
    - Update `Message Status` to "Error".
    - Connect input from `Check SMS Delivery` (false path).

12. **Add Sticky Note for Workflow Description**
    - Include detailed overview, setup instructions, and links:
      - Airtable Base Template URL
      - Twilio Signup URL

---

### 5. General Notes & Resources

| Note Content                                                                                                                                            | Context or Link                                                                                                  |
|---------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| Duplicate the Airtable Order Management Base template to your workspace before use.                                                                     | https://airtable.com/appaeASO1AZV62pLI/shrBP0lmBNXk0G7Vf                                                       |
| Create a Twilio account to obtain credentials and a sending phone number; a free trial is available.                                                    | https://www.twilio.com                                                                                            |
| Update the Config node with your specific Airtable table URLs and Twilio number before running the workflow.                                            | See "Configuration Helper" sticky note within the workflow                                                      |
| Customize the SMS message template in the "Prepare SMS Content" node to match your brand voice or to include additional order details if needed.       |                                                                                                                 |
| The workflow uses Airtable's Personal Access Token authentication for API access for better security and reliability.                                  |                                                                                                                 |
| Twilio node’s onError set to "continueRegularOutput" allows the workflow to handle sending errors gracefully and update statuses accordingly.           |                                                                                                                 |

---

**Disclaimer:**  
The text provided comes exclusively from an automated workflow created with n8n, an integration and automation tool. This process strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.