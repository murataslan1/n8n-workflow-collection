Add User Authorization Layer to Your Telegram Bot with Admin Alerts

https://n8nworkflows.xyz/workflows/add-user-authorization-layer-to-your-telegram-bot-with-admin-alerts-9203


# Add User Authorization Layer to Your Telegram Bot with Admin Alerts

---
### 1. Workflow Overview

This workflow implements an **Authorization Layer for a Telegram Bot** to restrict access only to approved users while notifying administrators of unauthorized access attempts. It is designed to protect sensitive or costly bot operations by ensuring only whitelisted users can interact with the bot, thereby preventing misuse, excessive costs, or security risks.

The workflow logically divides into the following blocks:

- **1.1 Input Reception:** Captures incoming Telegram messages via webhook.
- **1.2 Authorization Logic:** Determines if the user is allowed, pending approval, or unauthorized, generating appropriate status messages.
- **1.3 Authorization Check:** Routes the flow based on authorization status.
- **1.4 User Notification:** Sends success messages to authorized users or denial messages to unauthorized users.
- **1.5 Admin Notification:** Sends alerts to administrators when unauthorized access attempts occur.
- **1.6 Documentation and Quick Start Notes:** Sticky notes provide detailed guidance and configuration tips.

---

### 2. Block-by-Block Analysis

---

#### 2.1 Input Reception

- **Overview:**  
  Listens to Telegram updates and triggers the workflow for each new incoming message.

- **Nodes Involved:**  
  - `Telegram Trigger`

- **Node Details:**  
  - **Type:** Telegram Trigger  
  - **Role:** Listens for incoming Telegram messages (updates of type "message")  
  - **Configuration:**  
    - Watches for "message" updates only  
    - Uses Telegram API credentials (`ElishevFamilyBot`)  
  - **Input:** Webhook from Telegram server  
  - **Output:** Passes incoming message data to the next node (`BotGuard Authorization`)  
  - **Edge cases:**  
    - Telegram API connectivity issues  
    - Invalid or missing message content  
  - **Version Notes:** Uses webhookId for webhook management.

---

#### 2.2 Authorization Logic

- **Overview:**  
  Processes incoming messages by checking if the user is authorized, pending approval, or unauthorized, and prepares user/admin messages accordingly.

- **Nodes Involved:**  
  - `BotGuard Authorization`

- **Node Details:**  
  - **Type:** Code node (JavaScript)  
  - **Role:** Implements the core authorization mechanism  
  - **Configuration:**  
    - Defines arrays of allowed users and administrators with user IDs, usernames, subscription types, and admin chat IDs  
    - Extracts user info from incoming Telegram message JSON  
    - Checks authorization status:  
      - Authorized users (in AllowedUsers)  
      - Administrators (in Administrators)  
      - Pending requests (empty ProcessingRequests array placeholder)  
      - Recognizes "/request" command  
    - Generates messages for:  
      - Authorized users (success message)  
      - Unauthorized users (denied message including user ID)  
      - Admin alert message on unauthorized access attempts (if not a /request command)  
    - Attaches all relevant info to `item.json.botGuard` for downstream use  
  - **Key Expressions:**  
    - Checks user ID membership in AllowedUsers and Administrators  
    - Constructs HTML-formatted messages with user details  
  - **Input:** JSON from Telegram Trigger node  
  - **Output:** Enriched JSON with authorization info  
  - **Edge cases:**  
    - Missing or malformed message data  
    - Errors in JS code execution caught and handled with error message  
  - **Version Notes:** Uses async JS code with try/catch for robustness

---

#### 2.3 Authorization Check

- **Overview:**  
  Routes the workflow depending on whether the user is authorized or not.

- **Nodes Involved:**  
  - `Check Authorization`

- **Node Details:**  
  - **Type:** If node  
  - **Role:** Evaluates boolean `botGuard.allowEntry` from previous node  
  - **Configuration:**  
    - Condition: `{{$json.botGuard.allowEntry}} === true`  
  - **Input:** From `BotGuard Authorization`  
  - **Output:**  
    - True branch: authorized user flow  
    - False branch: unauthorized user flow and admin notification  
  - **Edge cases:**  
    - Missing or invalid `allowEntry` field  
  - **Version Notes:** Supports loose type validation

---

#### 2.4 User Notification

- **Overview:**  
  Sends Telegram messages back to the user based on authorization outcome.

- **Nodes Involved:**  
  - `Send Success`  
  - `Send Denied`

- **Node Details:**

  - **Send Success**  
    - **Type:** Telegram  
    - **Role:** Sends authorization success message to user  
    - **Configuration:**  
      - Text: `botGuard.authorizedMessage` (HTML formatted)  
      - Chat ID: `botGuard.chatId`  
      - Parse mode: HTML  
    - **Input:** True branch of `Check Authorization`  
    - **Output:** None  
    - **Edge cases:**  
      - Telegram API errors (e.g., invalid chat ID)  

  - **Send Denied**  
    - **Type:** Telegram  
    - **Role:** Sends access denied message to user  
    - **Configuration:**  
      - Text: `botGuard.userMessage` (HTML formatted)  
      - Chat ID: `botGuard.chatId`  
      - Parse mode: HTML  
    - **Input:** False branch of `Check Authorization`  
    - **Output:** Passes to `Check Admin Notify`  
    - **Edge cases:**  
      - Telegram API errors  
      - Chat ID missing or invalid

---

#### 2.5 Admin Notification

- **Overview:**  
  Notifies all administrators of unauthorized access attempts with detailed user and message info.

- **Nodes Involved:**  
  - `Check Admin Notify`  
  - `Prepare Admin Notifications`  
  - `Notify Admin`

- **Node Details:**

  - **Check Admin Notify**  
    - **Type:** If node  
    - **Role:** Checks if adminMessage string is non-empty (i.e., unauthorized attempt requires alert)  
    - **Input:** False branch of `Check Authorization` (after `Send Denied`)  
    - **Output:**  
      - True: continue to prepare notifications  
      - False: end workflow here  
    - **Edge cases:** Empty or missing admin message  

  - **Prepare Admin Notifications**  
    - **Type:** Code node  
    - **Role:** Generates one item per admin user to send notification messages individually  
    - **Configuration:**  
      - Extracts `Administrators` array and `adminMessage` from `botGuard` data  
      - Maps each admin to an item with chatId, username, and message  
    - **Input:** True branch of `Check Admin Notify`  
    - **Output:** Multiple items for parallel sending  
    - **Edge cases:** Empty administrators array  

  - **Notify Admin**  
    - **Type:** Telegram  
    - **Role:** Sends admin alert messages to each admin chat ID  
    - **Configuration:**  
      - Text: `adminMessage` (HTML formatted)  
      - Chat ID: `adminChatId` from prepared items  
      - Parse mode: HTML  
    - **Input:** From `Prepare Admin Notifications`  
    - **Output:** None  
    - **Edge cases:** Telegram API errors, invalid chat IDs

---

#### 2.6 Documentation and Quick Start Notes

- **Overview:**  
  Sticky notes provide explanations, usage instructions, and configuration samples for users setting up or modifying the workflow.

- **Nodes Involved:**  
  - `Sticky Note - Intro`  
  - `Sticky Note - Quick Start`  
  - `Sticky Note1`

- **Node Details:**  
  - **Type:** Sticky Note  
  - **Role:** Documentation and user guidance  
  - **Content Highlights:**  
    - Problem statement and solution overview  
    - Step-by-step quick start instructions for configuring allowed users and admins  
    - Full configuration code samples for user/admin arrays  
    - How to find user IDs, export/import workflow, and admin notification details  
  - **Position:** Placed on canvas for easy reference  
  - **Edge cases:** None (informational only)

---

### 3. Summary Table

| Node Name                | Node Type           | Functional Role                          | Input Node(s)          | Output Node(s)                      | Sticky Note                                                                                           |
|--------------------------|---------------------|----------------------------------------|-----------------------|-----------------------------------|-----------------------------------------------------------------------------------------------------|
| Telegram Trigger         | Telegram Trigger    | Capture incoming Telegram messages      | —                     | BotGuard Authorization            |                                                                                                     |
| BotGuard Authorization   | Code                | Check user authorization and prepare messages | Telegram Trigger       | Check Authorization               |                                                                                                     |
| Check Authorization      | If                   | Route flow based on authorization result | BotGuard Authorization | Send Success, Send Denied, Check Admin Notify |                                                                                                     |
| Send Success             | Telegram             | Notify authorized user of success       | Check Authorization    | —                                 |                                                                                                     |
| Send Denied              | Telegram             | Notify unauthorized user of denial      | Check Authorization    | Check Admin Notify                 |                                                                                                     |
| Check Admin Notify       | If                   | Determine if admin notifications needed | Send Denied            | Prepare Admin Notifications       |                                                                                                     |
| Prepare Admin Notifications | Code               | Generate notification items per admin   | Check Admin Notify     | Notify Admin                      |                                                                                                     |
| Notify Admin             | Telegram             | Send unauthorized access alerts to admins | Prepare Admin Notifications | —                                 |                                                                                                     |
| Sticky Note - Intro      | Sticky Note          | Documentation: Problem and solution     | —                     | —                                 | # 🛡️ BotGuard - Why You Need This: Explains risks of open bots and BotGuard benefits               |
| Sticky Note - Quick Start| Sticky Note          | Quick setup instructions                 | —                     | —                                 | # 🚀 Quick Start: Steps to configure users/admins and test authorization flow                       |
| Sticky Note1             | Sticky Note          | Detailed documentation and configuration | —                     | —                                 | # 🛡️ BotGuard Authorization System: Full config examples, admin alert details, user ID retrieval   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger Node:**  
   - Type: Telegram Trigger  
   - Configure credentials with your Telegram bot token (e.g., `ElishevFamilyBot`)  
   - Set updates to listen for: `message`  
   - Position node on canvas

2. **Create Code Node "BotGuard Authorization":**  
   - Connect `Telegram Trigger` output to this node input  
   - Add the provided JavaScript code to:  
     - Define arrays `AllowedUsers` and `Administrators` with user IDs, usernames, subscription types, and admin chat IDs  
     - Extract user info from incoming message JSON  
     - Check if user is authorized or admin  
     - Prepare messages for authorized users, unauthorized users, and admin alerts  
     - Attach all this info under `item.json.botGuard`  
   - Handle errors gracefully and set error messages  
   - Position node next to Telegram Trigger

3. **Create If Node "Check Authorization":**  
   - Connect output of `BotGuard Authorization` to this node input  
   - Set condition: `{{$json.botGuard.allowEntry}} === true` (boolean check)  
   - This routes authorized users to "True" branch and others to "False" branch

4. **Create Telegram Node "Send Success":**  
   - Connect "True" output of `Check Authorization` to this node input  
   - Configure credentials with Telegram bot token  
   - Set Text to: `{{$json.botGuard.authorizedMessage}}`  
   - Set Chat ID to: `{{$json.botGuard.chatId}}`  
   - Set Parse Mode to `HTML`

5. **Create Telegram Node "Send Denied":**  
   - Connect "False" output of `Check Authorization` to this node input  
   - Configure credentials with Telegram bot token  
   - Set Text to: `{{$json.botGuard.userMessage}}`  
   - Set Chat ID to: `{{$json.botGuard.chatId}}`  
   - Set Parse Mode to `HTML`

6. **Create If Node "Check Admin Notify":**  
   - Connect output of `Send Denied` to this node input  
   - Set condition to check if `{{$json.botGuard.adminMessage}}` is not empty (string not empty)  
   - True branch continues to notify admins, False branch ends workflow here

7. **Create Code Node "Prepare Admin Notifications":**  
   - Connect "True" output of `Check Admin Notify` to this node input  
   - Add JS code that:  
     - Extracts `Administrators` array and `adminMessage` from `botGuard`  
     - Maps each admin to an output item with `adminChatId`, `adminUserName`, and `adminMessage`  
   - Output multiple items for parallel notification sending

8. **Create Telegram Node "Notify Admin":**  
   - Connect output of `Prepare Admin Notifications` to this node input  
   - Configure credentials with Telegram bot token  
   - Set Text to: `{{$json.adminMessage}}`  
   - Set Chat ID to: `{{$json.adminChatId}}`  
   - Set Parse Mode to `HTML`

9. **Create Sticky Notes for Documentation (Optional but Recommended):**  
   - Add three sticky notes to the canvas with content:  
     - Problem statement and BotGuard benefits (`Sticky Note - Intro`)  
     - Quick start instructions (`Sticky Note - Quick Start`)  
     - Full config and usage guide (`Sticky Note1`)

10. **Set Credentials:**  
    - Ensure Telegram API credentials are configured properly with your Bot Token  
    - No other external credentials needed

11. **Test the Workflow:**  
    - Send messages from authorized and unauthorized user accounts  
    - Verify success or denial messages  
    - Confirm admin notifications arrive on unauthorized attempts

---

### 5. General Notes & Resources

| Note Content                                                                                                              | Context or Link                                                                                                    |
|---------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------|
| This workflow provides a simple but effective bot authorization layer to prevent unauthorized usage and alert admins.     | Core purpose of BotGuard                                                                                           |
| Modify messages in the `BotGuard Authorization` code node to customize user and admin notifications.                      | Flexibility in user experience                                                                                     |
| To add new users or admins, update the arrays `AllowedUsers` and `Administrators` in the code node.                       | Configuration guide                                                                                                |
| User IDs can be retrieved by checking denied messages sent by the bot after unauthorized attempts.                        | User ID retrieval method                                                                                            |
| Export/import workflow via n8n menu for backup or sharing.                                                                 | Workflow maintenance                                                                                               |
| Admin notifications include user details such as name, ID, language, time, and message content for quick review.          | Security and monitoring best practices                                                                             |
| Telegram API credentials must be set up with required permissions to send/receive messages and manage webhooks.            | Credential setup                                                                                                   |

---

**Disclaimer:**  
The text provided originates exclusively from an automated workflow created with n8n, a tool for integration and automation. This processing strictly respects current content policies and contains no illegal, offensive, or protected material. All processed data is legal and public.

---