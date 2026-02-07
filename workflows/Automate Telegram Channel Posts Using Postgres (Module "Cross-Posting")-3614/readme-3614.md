Automate Telegram Channel Posts Using Postgres (Module "Cross-Posting")

https://n8nworkflows.xyz/workflows/automate-telegram-channel-posts-using-postgres--module--cross-posting---3614


# Automate Telegram Channel Posts Using Postgres (Module "Cross-Posting")

### 1. Workflow Overview

This workflow automates posting messages, including text and images, to Telegram channels using a Postgres database as the content source. It is designed for Telegram channel managers who want to streamline content delivery by automating posts via a bot with admin privileges on target channels.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception and Initialization:** Captures incoming Telegram bot commands or triggers and initializes variables.
- **1.2 Admin Verification and Command Routing:** Checks if the user is an admin and routes commands accordingly.
- **1.3 Channel Management:** Handles adding, deleting, and verifying Telegram channels linked to the bot.
- **1.4 Content Retrieval and Posting:** Retrieves post content from Postgres and sends text or image posts to channels.
- **1.5 Bot Status Updates:** Updates the bot’s operational status in the database based on various events.
- **1.6 Post-Success Confirmation:** Confirms successful message delivery to Telegram channels.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Initialization

**Overview:**  
This block receives Telegram bot triggers (commands or messages) and sets up initial variables for processing.

**Nodes Involved:**  
- Telegram Trigger  
- Variables TG  
- Initialization

**Node Details:**

- **Telegram Trigger**  
  - Type: Telegram Trigger  
  - Role: Entry point for Telegram bot updates (messages/commands).  
  - Configuration: Uses a webhook with a specific ID to receive bot updates.  
  - Inputs: External Telegram bot updates.  
  - Outputs: Passes data to Variables TG.  
  - Edge Cases: Webhook misconfiguration, Telegram API downtime, invalid updates.

- **Variables TG**  
  - Type: Set Node  
  - Role: Initializes or sets workflow variables based on the Telegram trigger data.  
  - Configuration: No explicit parameters; likely sets default variables or extracts data.  
  - Inputs: Telegram Trigger output.  
  - Outputs: Passes data to Initialization.  
  - Edge Cases: Missing expected data fields, expression evaluation errors.

- **Initialization**  
  - Type: Set Node  
  - Role: Further variable initialization or preparation for admin verification.  
  - Configuration: No explicit parameters; prepares data for next step.  
  - Inputs: Variables TG output.  
  - Outputs: Passes data to Is Admin? node.  
  - Edge Cases: Similar to Variables TG.

---

#### 2.2 Admin Verification and Command Routing

**Overview:**  
This block verifies if the user interacting with the bot is an admin and routes the workflow based on the command type.

**Nodes Involved:**  
- Is Admin?  
- Define Type  
- Get Bot Status  
- Define flow  
- Commands  
- Buttons

**Node Details:**

- **Is Admin?**  
  - Type: If Node  
  - Role: Checks if the user is an admin to allow privileged commands.  
  - Configuration: Conditional logic based on user/admin status.  
  - Inputs: Initialization output.  
  - Outputs: Routes to Define Type if admin, else likely terminates or restricts.  
  - Edge Cases: Incorrect admin list, false negatives/positives.

- **Define Type**  
  - Type: Switch Node  
  - Role: Determines the type of command or message received (e.g., start, add channel, delete channel, post request).  
  - Configuration: Switches based on command content or message type.  
  - Inputs: Is Admin? output.  
  - Outputs: Routes to Get Bot Status or Buttons node depending on command.  
  - Edge Cases: Unrecognized commands, malformed messages.

- **Get Bot Status**  
  - Type: Postgres Node  
  - Role: Retrieves the current status of the bot from the Postgres database.  
  - Configuration: Executes a SQL query to fetch bot status.  
  - Inputs: Define Type output.  
  - Outputs: Feeds into Define flow node.  
  - Edge Cases: Database connection errors, empty or corrupt status data.

- **Define flow**  
  - Type: Switch Node  
  - Role: Routes workflow based on bot status or command context to appropriate sub-flows (e.g., add channel, get channels, update status).  
  - Configuration: Switch with multiple outputs for different flows.  
  - Inputs: Get Bot Status output.  
  - Outputs: Commands, Add Channel, Get Channels, Update bot status nodes.  
  - Edge Cases: Unexpected status values, missing data.

- **Commands**  
  - Type: Switch Node  
  - Role: Handles specific bot commands such as welcome message, add/delete channel requests, or fetching channels.  
  - Configuration: Switch based on command text.  
  - Inputs: Define flow output.  
  - Outputs: Routes to Welcome Message, Request Add Channel, Request Delete Channel, Get Channels nodes.  
  - Edge Cases: Unknown commands, command parsing errors.

- **Buttons**  
  - Type: Switch Node  
  - Role: Processes button clicks or interactive elements in Telegram messages.  
  - Configuration: Switch based on button payload.  
  - Inputs: Define Type output (for certain commands).  
  - Outputs: Routes to Upsert bot status or post request update nodes.  
  - Edge Cases: Invalid button payloads, timing issues.

---

#### 2.3 Channel Management

**Overview:**  
Manages the Telegram channels associated with the bot, including adding, deleting, verifying existence, and retrieving channel lists.

**Nodes Involved:**  
- Add Channel  
- Channel Exists  
- Channel Not Exists  
- Delete Channel  
- Request New Add Channel  
- Request New Delete Channel  
- Get Channels  
- Add Divide Channels  
- Channels

**Node Details:**

- **Add Channel**  
  - Type: Postgres Node  
  - Role: Inserts or updates channel information in the database.  
  - Configuration: SQL insert or update query with error handling to continue on error.  
  - Inputs: Routed from Define flow or Commands.  
  - Outputs: Request New Add Channel or Channel Exists nodes.  
  - Edge Cases: Duplicate entries, DB constraint violations.

- **Channel Exists**  
  - Type: Telegram Node  
  - Role: Checks if the bot is an admin in the specified Telegram channel.  
  - Configuration: Telegram API call to verify channel membership/status.  
  - Inputs: Add Channel output.  
  - Outputs: Further processing or confirmation.  
  - Edge Cases: Telegram API errors, bot not admin.

- **Channel Not Exists**  
  - Type: Telegram Node  
  - Role: Handles cases where the channel does not exist or bot is not admin.  
  - Configuration: Sends notification or error message.  
  - Inputs: If node output (false branch).  
  - Outputs: End or corrective action.  
  - Edge Cases: False negatives, API errors.

- **Delete Channel**  
  - Type: Postgres Node  
  - Role: Removes channel records from the database.  
  - Configuration: SQL delete query with error handling to continue on error.  
  - Inputs: If node output (true branch).  
  - Outputs: Request New Delete Channel node.  
  - Edge Cases: Referential integrity, missing records.

- **Request New Add Channel**  
  - Type: Telegram Node  
  - Role: Sends confirmation/request message to add a new channel.  
  - Configuration: Telegram message with instructions or confirmation.  
  - Inputs: Add Channel output.  
  - Outputs: None or next steps.  
  - Edge Cases: Message delivery failure.

- **Request New Delete Channel**  
  - Type: Telegram Node  
  - Role: Sends confirmation/request message to delete a channel.  
  - Configuration: Telegram message.  
  - Inputs: Delete Channel output.  
  - Outputs: None or next steps.  
  - Edge Cases: Message delivery failure.

- **Get Channels**  
  - Type: Postgres Node  
  - Role: Retrieves the list of channels from the database.  
  - Configuration: SQL select query.  
  - Inputs: Routed from Commands or Define flow.  
  - Outputs: Add Divide Channels node.  
  - Edge Cases: Empty results, DB errors.

- **Add Divide Channels**  
  - Type: Summarize Node  
  - Role: Aggregates or formats channel data for further processing.  
  - Configuration: Summarizes channel list output.  
  - Inputs: Get Channels output.  
  - Outputs: Channels node.  
  - Edge Cases: Data formatting issues.

- **Channels**  
  - Type: Telegram Node  
  - Role: Sends channel list or related messages to Telegram.  
  - Configuration: Telegram message with channel info.  
  - Inputs: Add Divide Channels output.  
  - Outputs: None.  
  - Edge Cases: Message delivery failure.

---

#### 2.4 Content Retrieval and Posting

**Overview:**  
Retrieves post content (text or images) from the Postgres database and sends posts to the appropriate Telegram channels.

**Nodes Involved:**  
- Select Channels  
- Select Channels (duplicate node with space)  
- Send Posts (4922)  
- Send Posts Image (4922)  
- Send Posts Image (4922) (duplicate)  
- Request Post Text  
- Request Post Image Text  
- Request Post Image Image  
- Success Send Post  
- Success Send Post Image

**Node Details:**

- **Select Channels**  
  - Type: Postgres Node  
  - Role: Selects channels eligible for posting from the database.  
  - Configuration: SQL select query.  
  - Inputs: Update bot status nodes or initial triggers.  
  - Outputs: Send Posts or Send Posts Image nodes.  
  - Edge Cases: Empty channel list, DB errors.

- **Send Posts (4922)**  
  - Type: Telegram Node  
  - Role: Sends text posts to Telegram channels.  
  - Configuration: Telegram API call to send text messages.  
  - Inputs: Select Channels output.  
  - Outputs: Success Send Post node.  
  - Edge Cases: Message size limits, API rate limits.

- **Send Posts Image (4922)** (two nodes)  
  - Type: Telegram Node  
  - Role: Sends image posts (with optional captions) to Telegram channels.  
  - Configuration: Telegram API call to send photo messages.  
  - Inputs: Select Channels (with space) or If1 node output.  
  - Outputs: Success Send Post Image node.  
  - Edge Cases: Image size limits, invalid URLs, API errors.

- **Request Post Text**  
  - Type: Telegram Node  
  - Role: Requests or confirms text post content from the user.  
  - Configuration: Telegram message.  
  - Inputs: Buttons node output.  
  - Outputs: Update bot status on POST TEXT REQUEST node.  
  - Edge Cases: User input errors.

- **Request Post Image Text**  
  - Type: Telegram Node  
  - Role: Requests or confirms image post caption text.  
  - Configuration: Telegram message.  
  - Inputs: Buttons node output.  
  - Outputs: Update bot status on POST IMAGE REQUEST TEXT node.  
  - Edge Cases: User input errors.

- **Request Post Image Image**  
  - Type: Telegram Node  
  - Role: Requests or confirms the image for posting.  
  - Configuration: Telegram message.  
  - Inputs: Update bot status on POST IMAGE REQUEST IMAGE node.  
  - Outputs: None or next steps.  
  - Edge Cases: Image upload errors.

- **Success Send Post**  
  - Type: Telegram Node  
  - Role: Sends confirmation of successful text post delivery.  
  - Configuration: Telegram message.  
  - Inputs: Send Posts output.  
  - Outputs: None.  
  - Edge Cases: Message delivery failure.

- **Success Send Post Image**  
  - Type: Telegram Node  
  - Role: Sends confirmation of successful image post delivery.  
  - Configuration: Telegram message.  
  - Inputs: Send Posts Image nodes output.  
  - Outputs: None.  
  - Edge Cases: Message delivery failure.

---

#### 2.5 Bot Status Updates

**Overview:**  
Updates the bot's status in the Postgres database to reflect various operational states or events.

**Nodes Involved:**  
- Upsert bot status on START  
- Update bot status on START  
- Update bot status on START (duplicate with space)  
- Update bot status on ADD CHANNEL  
- Update bot status on DELETE CHANNEL  
- Update bot status on POST TEXT REQUEST  
- Update bot status on POST IMAGE REQUEST TEXT  
- Update bot status on POST IMAGE REQUEST IMAGE  
- Upsert bot status on START (at bottom)

**Node Details:**

- **Upsert bot status on START** (two nodes)  
  - Type: Postgres Node  
  - Role: Inserts or updates bot status when the bot starts or is initialized.  
  - Configuration: SQL upsert query.  
  - Inputs: Welcome Message or Buttons output.  
  - Outputs: Next steps like Select Channels or other status updates.  
  - Edge Cases: DB errors, concurrency issues.

- **Update bot status on START** (two nodes)  
  - Type: Postgres Node  
  - Role: Updates bot status on workflow start or specific triggers.  
  - Configuration: SQL update queries.  
  - Inputs: Define flow or other nodes.  
  - Outputs: Select Channels or other nodes.  
  - Edge Cases: DB errors.

- **Update bot status on ADD CHANNEL**  
  - Type: Postgres Node  
  - Role: Updates status after adding a channel.  
  - Configuration: SQL update query.  
  - Inputs: Request Add Channel output.  
  - Outputs: None.  
  - Edge Cases: DB errors.

- **Update bot status on DELETE CHANNEL**  
  - Type: Postgres Node  
  - Role: Updates status after deleting a channel.  
  - Configuration: SQL update query.  
  - Inputs: Request Delete Channel output.  
  - Outputs: None.  
  - Edge Cases: DB errors.

- **Update bot status on POST TEXT REQUEST**  
  - Type: Postgres Node  
  - Role: Updates status after receiving a text post request.  
  - Configuration: SQL update query.  
  - Inputs: Request Post Text output.  
  - Outputs: None.  
  - Edge Cases: DB errors.

- **Update bot status on POST IMAGE REQUEST TEXT**  
  - Type: Postgres Node  
  - Role: Updates status after receiving an image post caption request.  
  - Configuration: SQL update query.  
  - Inputs: Request Post Image Text output.  
  - Outputs: None.  
  - Edge Cases: DB errors.

- **Update bot status on POST IMAGE REQUEST IMAGE**  
  - Type: Postgres Node  
  - Role: Updates status after receiving an image post image request.  
  - Configuration: SQL update query.  
  - Inputs: Select Channels output.  
  - Outputs: Request Post Image Image node.  
  - Edge Cases: DB errors.

---

#### 2.6 Post-Success Confirmation

**Overview:**  
Sends confirmation messages to the Telegram user after successful post delivery.

**Nodes Involved:**  
- Success Send Post  
- Success Send Post Image

**Node Details:**

- **Success Send Post**  
  - Type: Telegram Node  
  - Role: Confirms successful text post delivery.  
  - Configuration: Telegram message.  
  - Inputs: Send Posts output.  
  - Outputs: None.  
  - Edge Cases: Telegram API errors.

- **Success Send Post Image**  
  - Type: Telegram Node  
  - Role: Confirms successful image post delivery.  
  - Configuration: Telegram message.  
  - Inputs: Send Posts Image outputs (two nodes).  
  - Outputs: None.  
  - Edge Cases: Telegram API errors.

---

### 3. Summary Table

| Node Name                      | Node Type            | Functional Role                          | Input Node(s)                       | Output Node(s)                      | Sticky Note                         |
|--------------------------------|----------------------|----------------------------------------|-----------------------------------|-----------------------------------|-----------------------------------|
| Telegram Trigger               | Telegram Trigger     | Entry point for Telegram bot updates   | -                                 | Variables TG                      |                                   |
| Variables TG                  | Set                  | Initializes variables                   | Telegram Trigger                  | Initialization                   |                                   |
| Initialization                | Set                  | Prepares data for admin check          | Variables TG                     | Is Admin?                       |                                   |
| Is Admin?                    | If                   | Checks if user is admin                 | Initialization                   | Define Type                     |                                   |
| Define Type                  | Switch               | Routes based on command type            | Is Admin?                       | Get Bot Status, Buttons          |                                   |
| Get Bot Status               | Postgres             | Retrieves bot status from DB            | Define Type                     | Define flow                    |                                   |
| Define flow                  | Switch               | Routes to command/channel flows         | Get Bot Status                  | Commands, Add Channel, Get Channels, Update bot status nodes |                                   |
| Commands                    | Switch               | Handles specific bot commands           | Define flow                    | Welcome Message, Request Add Channel, Request Delete Channel, Get Channels |                                   |
| Buttons                     | Switch               | Processes Telegram button clicks        | Define Type                    | Upsert bot status on START, Request Post Image Text, Request Post Text |                                   |
| Add Channel                 | Postgres             | Adds channel info to DB                  | Define flow, Commands           | Request New Add Channel, Channel Exists |                                   |
| Channel Exists              | Telegram             | Checks bot admin status in channel      | Add Channel                    | -                               |                                   |
| Channel Not Exists          | Telegram             | Handles non-existent channel cases      | If (false branch)              | -                               |                                   |
| Delete Channel              | Postgres             | Deletes channel from DB                  | If (true branch)               | Request New Delete Channel       |                                   |
| Request New Add Channel     | Telegram             | Sends add channel confirmation          | Add Channel                    | Update bot status on ADD CHANNEL |                                   |
| Request New Delete Channel  | Telegram             | Sends delete channel confirmation       | Delete Channel                 | Update bot status on DELETE CHANNEL |                                   |
| Get Channels                | Postgres             | Retrieves channel list                   | Commands, Define flow           | Add Divide Channels              |                                   |
| Add Divide Channels         | Summarize            | Aggregates channel data                  | Get Channels                   | Channels                       |                                   |
| Channels                   | Telegram             | Sends channel list message               | Add Divide Channels            | -                               |                                   |
| Select Channels             | Postgres             | Selects channels for posting             | Update bot status nodes        | Send Posts, Send Posts Image    |                                   |
| Send Posts (4922)           | Telegram             | Sends text posts to channels             | Select Channels                | Success Send Post               |                                   |
| Send Posts Image (4922)     | Telegram             | Sends image posts to channels            | Select Channels (space), If1   | Success Send Post Image         |                                   |
| Request Post Text           | Telegram             | Requests text post content from user    | Buttons                       | Update bot status on POST TEXT REQUEST |                                   |
| Request Post Image Text     | Telegram             | Requests image post caption text         | Buttons                       | Update bot status on POST IMAGE REQUEST TEXT |                                   |
| Request Post Image Image    | Telegram             | Requests image for posting               | Update bot status on POST IMAGE REQUEST IMAGE | -                               |                                   |
| Success Send Post           | Telegram             | Confirms successful text post delivery  | Send Posts                    | -                               |                                   |
| Success Send Post Image     | Telegram             | Confirms successful image post delivery | Send Posts Image nodes         | -                               |                                   |
| Upsert bot status on START  | Postgres             | Inserts or updates bot status on start  | Welcome Message, Buttons       | Select Channels, etc.           |                                   |
| Update bot status on START  | Postgres             | Updates bot status on workflow start    | Define flow, others            | Select Channels, etc.           |                                   |
| Update bot status on ADD CHANNEL | Postgres        | Updates status after adding channel      | Request Add Channel            | -                               |                                   |
| Update bot status on DELETE CHANNEL | Postgres     | Updates status after deleting channel    | Request Delete Channel         | -                               |                                   |
| Update bot status on POST TEXT REQUEST | Postgres   | Updates status after text post request   | Request Post Text              | -                               |                                   |
| Update bot status on POST IMAGE REQUEST TEXT | Postgres | Updates status after image caption request | Request Post Image Text        | -                               |                                   |
| Update bot status on POST IMAGE REQUEST IMAGE | Postgres | Updates status after image post request  | Select Channels                | Request Post Image Image        |                                   |
| Welcome Message             | Telegram             | Sends welcome message to user            | Commands                      | Upsert bot status on START      |                                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger Node**  
   - Type: Telegram Trigger  
   - Configure webhook with your Telegram bot token and webhook URL.  
   - Set to listen for messages and commands.

2. **Add Set Node "Variables TG"**  
   - Initialize variables or extract relevant data from the Telegram trigger output.  
   - Connect output of Telegram Trigger to this node.

3. **Add Set Node "Initialization"**  
   - Further prepare variables for admin check.  
   - Connect output of Variables TG to this node.

4. **Add If Node "Is Admin?"**  
   - Configure condition to verify if the user ID or username is in the admin list.  
   - Connect Initialization output to this node.

5. **Add Switch Node "Define Type"**  
   - Configure to route based on command or message type (e.g., /start, /addchannel, /deletechannel, post requests).  
   - Connect true output of Is Admin? to this node.

6. **Add Postgres Node "Get Bot Status"**  
   - Configure with credentials to your Postgres DB.  
   - Write SQL to fetch bot status.  
   - Connect appropriate output of Define Type to this node.

7. **Add Switch Node "Define flow"**  
   - Configure multiple outputs to route commands to: Commands, Add Channel, Get Channels, Update bot status nodes.  
   - Connect Get Bot Status output to this node.

8. **Add Switch Node "Commands"**  
   - Configure to handle commands like welcome message, add/delete channel requests, get channels.  
   - Connect Define flow output to this node.

9. **Add Switch Node "Buttons"**  
   - Configure to handle Telegram button callbacks for posting requests and status updates.  
   - Connect Define Type output (for button commands) to this node.

10. **Add Postgres Nodes for Channel Management:**  
    - "Add Channel": SQL insert/update to add channel info.  
    - "Delete Channel": SQL delete to remove channel.  
    - "Get Channels": SQL select to retrieve channels.  
    - Configure credentials and queries accordingly.  
    - Connect outputs from Commands and Define flow nodes.

11. **Add Telegram Nodes for Channel Verification and Messaging:**  
    - "Channel Exists": Check bot admin status in channel.  
    - "Channel Not Exists": Handle non-existent channel.  
    - "Request New Add Channel" and "Request New Delete Channel": Send confirmation messages.  
    - "Channels": Send channel list messages.  
    - Connect outputs from Postgres channel management nodes.

12. **Add Summarize Node "Add Divide Channels"**  
    - Aggregate channel data for messaging.  
    - Connect Get Channels output to this node, then to Channels node.

13. **Add Postgres Nodes for Bot Status Updates:**  
    - Upsert and update nodes for start, add/delete channel, post requests.  
    - Configure SQL queries to update bot status table.  
    - Connect outputs from relevant Telegram nodes.

14. **Add Postgres Nodes "Select Channels" and "Select Channels " (with space)**  
    - Select channels eligible for posting.  
    - Connect outputs from bot status update nodes.

15. **Add Telegram Nodes for Posting:**  
    - "Send Posts (4922)": Send text messages.  
    - "Send Posts Image (4922)" (two nodes): Send image posts.  
    - Connect Select Channels outputs to these nodes.

16. **Add Telegram Nodes for Post Confirmation:**  
    - "Success Send Post" and "Success Send Post Image": Send confirmation messages after successful posting.  
    - Connect outputs from Send Posts and Send Posts Image nodes.

17. **Connect all nodes respecting the logical flow and error handling:**  
    - Use If nodes to branch on conditions.  
    - Use "continue on error" options on Postgres nodes where appropriate to avoid workflow failure.

18. **Configure Credentials:**  
    - Telegram: Use OAuth2 or Bot Token with admin rights on channels.  
    - Postgres: Use valid connection credentials with read/write access to the required tables.

19. **Create required tables in Postgres:**  
    - Use the provided SQL script, replacing schema names as needed.  
    - Ensure tables for channels, bot status, and posts exist.

20. **Test the workflow:**  
    - Trigger Telegram commands and verify posts are sent to channels.  
    - Check database updates and error handling.

---

### 5. General Notes & Resources

| Note Content                                                                                          | Context or Link                                                                                  |
|-----------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| This workflow requires the Telegram bot to have admin privileges in the target channels.            | Telegram Bot API documentation: https://core.telegram.org/bots/api                              |
| Postgres database must have tables created using the provided SQL script, with schema name replaced.| SQL script is included in the workflow setup instructions.                                     |
| Ensure webhook URLs are correctly configured in Telegram Bot settings for triggers to work.         | Telegram Bot webhook setup guide: https://core.telegram.org/bots/api#setwebhook                 |
| For customization, adjust SQL queries and Telegram message formats as needed.                        | n8n documentation: https://docs.n8n.io/                                                         |
| Workflow tags include "telegram", "module", and "sell" indicating modular design and commercial use.|                                                                                               |

---

This document provides a detailed, structured reference for understanding, reproducing, and modifying the Telegram cross-posting automation workflow using Postgres and n8n.