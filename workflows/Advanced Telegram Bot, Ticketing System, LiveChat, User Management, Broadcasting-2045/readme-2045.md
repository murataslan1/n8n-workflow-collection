Advanced Telegram Bot, Ticketing System, LiveChat, User Management, Broadcasting

https://n8nworkflows.xyz/workflows/advanced-telegram-bot--ticketing-system--livechat--user-management--broadcasting-2045


# Advanced Telegram Bot, Ticketing System, LiveChat, User Management, Broadcasting

### 1. Workflow Overview

This advanced n8n workflow extends Telegram bot capabilities to build a comprehensive user management, support ticketing, live chat, and broadcasting system integrated with Redis for fast data storage and retrieval.

**Target Use Cases:**  
- Businesses or support teams seeking to automate Telegram user support with ticket-based chat threads inside a Telegram supergroup.  
- Efficient user data management for quick access and updates via Redis.  
- Broadcasting messages from a Telegram channel to all users who interacted with the bot, with blocked user filtering.  
- Live chat support where user messages automatically create forum topics (tickets) in a support group and replies from support staff are forwarded back to users.

**Logical Blocks:**  
- **1.1 Telegram Bot Input Reception**: Captures incoming updates (messages, channel posts) from the Telegram bot.  
- **1.2 User Data Formatting and Storage**: Formats incoming user data for Redis storage and updates user records.  
- **1.3 Support Ticket Management**: Creates forum topics (tickets) for user chats, stores topic IDs, and manages forwarding of messages between users and support group threads.  
- **1.4 Support Replies Handling**: Detects replies inside the support forum and forwards them back to the respective users.  
- **1.5 Broadcasting System**: Sends channel posts as broadcast messages to all bot users, filtering out blocked users and respecting Telegram API limits.  
- **1.6 Blocked User Management**: Marks users as blocked when broadcast failures occur to prevent further attempts.  
- **1.7 Configuration and Metadata**: Centralized node for bot credentials, group and channel IDs, plus informative sticky notes for setup and usage guidance.

---

### 2. Block-by-Block Analysis

#### 1.1 Telegram Bot Input Reception

**Overview:**  
Receives updates from Telegram (both user messages and channel posts) and routes them based on chat type.

**Nodes Involved:**  
- Telegram-Bot  
- Bot-Config  
- Format  
- Bot-Fields  
- 1st (Switch Node)

**Node Details:**  
- **Telegram-Bot**  
  - Type: Telegram Trigger  
  - Role: Entry point capturing Telegram updates of type "message" and "channel_post"  
  - Config: Uses Telegram API credentials (bot token)  
  - Output: Raw Telegram JSON update to Bot-Config  
  - Failure modes: Telegram webhook errors, invalid token, rate limits

- **Bot-Config**  
  - Type: Set  
  - Role: Stores static configuration: BotToken, Support_Group_ID, Boradcast_Channel_ID  
  - Config: User inputs their bot token and Telegram group/channel IDs  
  - Output: Passes config with incoming Telegram update  
  - Failure modes: Missing or incorrect bot token or IDs

- **Format**  
  - Type: Code (JavaScript)  
  - Role: Escapes JSON for Redis storage; flattens nested Telegram user message objects for clean storage  
  - Key logic: `escapeRedisJsonSyntax` escapes quotes, backslashes, slashes; flattens nested fields with prefixing  
  - Input: Raw Telegram JSON + Bot-Config output  
  - Output: Reformatted user object under `TG_USER_` key  
  - Failure modes: Syntax errors in code, unexpected input shape

- **Bot-Fields**  
  - Type: Set  
  - Role: Removes sensitive or unnecessary fields (e.g., BotToken) from formatted user data to prepare for storage  
  - Config: Removes `BotToken`, `pairedItem_item`, `Support_Group_ID`  
  - Input: Output of Format node  
  - Output: Clean user data for downstream use  
  - Failure modes: Missing fields, improper removal

- **1st (Switch)**  
  - Type: Switch  
  - Role: Routes flow based on chat type (`private`, `supergroup`, `channel`) from field `$json.chat_type` or `$json.channel_post_sender_chat_type`  
  - Outputs: 1=private, 2=supergroup, 3=channel, 0=none/fallback  
  - Failure modes: Unexpected chat types, missing chat type field

---

#### 1.2 User Data Formatting and Storage

**Overview:**  
Checks if the user is new or existing by querying Redis, then either saves or updates user data accordingly.

**Nodes Involved:**  
- Check User in Database  
- New User ? (If)  
- Save User Data  
- Update User Data  
- Get User Chat Topic

**Node Details:**  
- **Check User in Database**  
  - Type: Redis (keys operation)  
  - Role: Checks if a Redis key exists for user `TG-USER-{{chat_id}}`  
  - Input: User chat_id from Bot-Fields  
  - Output: Keys list or empty (for new user detection)  
  - Failure modes: Redis connection errors, key pattern errors

- **New User ?**  
  - Type: If  
  - Role: Checks if Redis query result is empty (user not stored)  
  - Condition: `$json.isEmpty() === true`  
  - Outputs: True = new user, False = existing user

- **Save User Data** (for new users)  
  - Type: Redis (set operation)  
  - Role: Stores formatted user data under key `TG-USER-chat_id` as a hash  
  - Input: Bot-Fields JSON object  
  - Failure modes: Redis write errors, invalid data format

- **Update User Data** (for existing users)  
  - Type: Redis (set operation)  
  - Role: Updates Redis hash with current user data under `TG-USER-chat_id`  
  - Then triggers **Get User Chat Topic**

- **Get User Chat Topic**  
  - Type: Redis (get operation)  
  - Role: Retrieves stored chat ticket topic ID for the user from Redis hash  
  - Output: Passes topic data to next node  
  - Failure modes: Redis read errors, missing topic ID

---

#### 1.3 Support Ticket Management

**Overview:**  
Creates new forum topics (chat tickets) for user messages in the support group if none exists, saves topic IDs, and forwards user messages into their dedicated topic. Handles recreation if topic is deleted.

**Nodes Involved:**  
- Create Topic (Chat Ticket)  
- Save Topic ID  
- Forward New Message  
- IF No Topic Created  
- ReCreate Topic (Chat Ticket)  
- ReSave Topic ID  
- Forward New Message to the recrated topic  
- No Operation, do nothing (NoOp)

**Node Details:**  
- **Create Topic (Chat Ticket)**  
  - Type: HTTP Request  
  - Role: Calls Telegram Bot API `createForumTopic` on support group with a name `[username] - [id:chat_id]`  
  - Inputs: Support_Group_ID, BotToken, user first name and chat ID to generate topic name  
  - Output: Telegram API response including `message_thread_id` for the topic  
  - Failure modes: API errors, insufficient permissions, name conflicts

- **Save Topic ID**  
  - Type: Redis (set hash)  
  - Role: Stores topic/thread ID under Redis key `TG-USER-chat_id` for future forwarding  
  - Input: API response `message_thread_id`  
  - Failure modes: Redis write errors

- **Forward New Message**  
  - Type: HTTP Request  
  - Role: Forwards the incoming user message into the support group topic/thread using Telegram Bot API `forwardMessage`  
  - Inputs: Support_Group_ID, message_thread_id from Redis, original user chat_id, message_id  
  - Failure modes: Telegram API errors e.g. "thread not found"

- **IF No Topic Created**  
  - Type: If  
  - Role: Checks if forwarding failed due to "thread not found" error (topic deleted or closed)  
  - Outputs: True = recreate topic, False = no action

- **ReCreate Topic (Chat Ticket)**  
  - Type: HTTP Request  
  - Role: Recreates forum topic with same naming scheme, used when original topic was deleted  
  - Output: New topic `message_thread_id`

- **ReSave Topic ID**  
  - Type: Redis (set hash)  
  - Role: Saves new topic/thread ID in Redis key for user

- **Forward New Message to the recrated topic**  
  - Type: HTTP Request  
  - Role: Forwards original user message to newly created topic/thread

- **No Operation, do nothing**  
  - Type: NoOp  
  - Role: Ends flow on branches where no further action is required

**Sticky Note**: Explains reason for topic recreation when support team deletes/closes tickets, ensuring continuous support threads.

---

#### 1.4 Support Replies Handling

**Overview:**  
When support team members reply to tickets inside the support group forum, the replies are forwarded back to the original user.

**Nodes Involved:**  
- Support Forum (If node)  
- From Ticket (If node)  
- Forward Support Reply To User  
- IF Topic Created  
- Send User Ticket Created Notification  
- No Operation, do nothing

**Node Details:**  
- **Support Forum**  
  - Type: If  
  - Role: Checks if incoming message chat id matches the support group ID to filter support messages

- **From Ticket**  
  - Type: If  
  - Role: Checks if message is associated with a forum topic (ticket) by verifying fields: `message_thread_id` non-empty, `reply_to_message_is_topic_message` true, and `is_topic_message` true

- **Forward Support Reply To User**  
  - Type: HTTP Request  
  - Role: Forwards support team message back to end user by extracting user chat ID from the forum topic name or reply metadata  
  - Uses Telegram Bot API `forwardMessage` with chat_id extracted from topic name regex

- **IF Topic Created**  
  - Type: If  
  - Role: Checks if a forum topic was just created (used to trigger notification to user)

- **Send User Ticket Created Notification**  
  - Type: Telegram node  
  - Role: Sends a notification message to user informing that a new ticket is created and support will reply soon

- **No Operation, do nothing**  
  - Ends flow on branches where no further steps are needed

---

#### 1.5 Broadcasting System

**Overview:**  
Broadcasts messages posted in a verified Telegram channel to all users who previously interacted with the bot, while filtering out blocked users and respecting Telegram rate limits.

**Nodes Involved:**  
- IF Verified Channel  
- Retrieve all users in DB  
- Format Users  
- Filter Blocked Users  
- Split In Batches1  
- Broadcast Channel Post into Users  
- Wait1  
- Set Blocked Member

**Node Details:**  
- **IF Verified Channel**  
  - Type: If  
  - Role: Checks if incoming channel post is from the configured broadcasting channel ID  
  - Output True = broadcast flow triggers, False = ignored

- **Retrieve all users in DB**  
  - Type: Redis (keys operation)  
  - Role: Retrieves all Redis keys matching `TG-USER-*` to get all stored users

- **Format Users**  
  - Type: Code  
  - Role: Converts Redis response object into array of user objects for iteration

- **Filter Blocked Users**  
  - Type: Filter  
  - Role: Filters out any user where the `Blocked` field equals '1', i.e., blocked users not to receive broadcast

- **Split In Batches1**  
  - Type: SplitInBatches  
  - Role: Batches users into groups of 29 to avoid Telegram API rate limits (max 30 requests/sec)

- **Broadcast Channel Post into Users**  
  - Type: HTTP Request  
  - Role: Uses Telegram Bot API `copyMessage` to send the broadcast channel post to each user's chat_id  
  - On error: continues to next user (important for handling blocked or invalid users)

- **Wait1**  
  - Type: Wait  
  - Role: Pauses 3 seconds between batches to further respect API limits

- **Set Blocked Member**  
  - Type: Redis (set hash)  
  - Role: Marks users as blocked by setting `Blocked=1` in Redis when broadcast fails  
  - Input: User chat_id from either Bot-Fields or current batch item

---

#### 1.6 Blocked User Management

**Overview:**  
Tracks users who block the bot or cause errors during broadcast to prevent repeated broadcast attempts.

**Nodes Involved:**  
- Set Blocked Member (already covered in 1.5)

**Details:**  
- Users who cause errors during message copy are marked as blocked in Redis with a `Blocked` flag.  
- This flag is checked to filter users out from future broadcasts.

---

#### 1.7 Configuration and Metadata

**Overview:**  
Contains configuration parameters and detailed sticky notes with instructions and best practices for setup and operation.

**Nodes Involved:**  
- Bot-Config  
- Sticky Note  
- Sticky Note1  
- Sticky Note2  
- Sticky Note3  
- Sticky Note4

**Details:**  
- **Bot-Config** node holds the Bot Token, Support Group ID, and Broadcasting Channel ID.  
- Multiple sticky notes provide setup instructions, rationale for design decisions, and usage tips.  
- Sticky notes emphasize security (keep support group private), bot permissions, Redis hosting options, and future feature plans.

---

### 3. Summary Table

| Node Name                         | Node Type                 | Functional Role                                     | Input Node(s)                      | Output Node(s)                         | Sticky Note                                                                                                                                                                                                                                                                                                                                                                                                                           |
|----------------------------------|---------------------------|----------------------------------------------------|----------------------------------|--------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Telegram-Bot                     | Telegram Trigger          | Entry point for Telegram updates                    | None                             | Bot-Config                           |                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Bot-Config                      | Set                       | Stores bot token, group, and channel IDs           | Telegram-Bot                     | Format                              |                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Format                         | Code                      | Formats and escapes incoming user data for Redis   | Bot-Config                      | Bot-Fields                         |                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Bot-Fields                     | Set                       | Cleans user data, removes sensitive fields         | Format                         | 1st                                |                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 1st                            | Switch                    | Routes flow based on chat type (private, supergroup, channel) | Bot-Fields                     | Check User in Database / Support Forum / IF Verified Channel |                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Check User in Database          | Redis (keys)              | Checks if user exists in Redis DB                   | 1st (private output)             | New User ?                         |                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| New User ?                     | If                        | Determines if user is new or existing               | Check User in Database           | Save User Data / Update User Data   |                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Save User Data                 | Redis (set)               | Saves new user data in Redis                        | New User ? (true)                | Create Topic (Chat Ticket)           |                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Update User Data               | Redis (set)               | Updates existing user data in Redis                 | New User ? (false)               | Get User Chat Topic                  |                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Get User Chat Topic            | Redis (get)               | Retrieves user's topic/thread ID                    | Update User Data                 | Forward New Message                  |                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Create Topic (Chat Ticket)     | HTTP Request              | Creates a forum topic (ticket) in support group     | Save User Data                  | Save Topic ID                      |                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Save Topic ID                 | Redis (set)               | Saves forum topic ID in Redis                        | Create Topic (Chat Ticket)       | Forward New Message                  |                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Forward New Message           | HTTP Request              | Forwards user message to support group topic        | Get User Chat Topic             | No Operation, do nothing / IF No Topic Created |                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| IF No Topic Created           | If                        | Checks if forwarding failed due to missing topic    | Forward New Message              | ReCreate Topic (Chat Ticket) / No Operation, do nothing |                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ReCreate Topic (Chat Ticket)  | HTTP Request              | Recreates forum topic if deleted                     | IF No Topic Created             | ReSave Topic ID                   | Explains recreation of topic if deleted or closed by support team                                                                                                                                                                                                                                                                                                                                                                    |
| ReSave Topic ID               | Redis (set)               | Saves new topic ID after recreation                   | ReCreate Topic (Chat Ticket)    | Forward New Message to the recrated topic |                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Forward New Message to the recrated topic | HTTP Request       | Forwards message to newly recreated topic           | ReSave Topic ID                 | No Operation, do nothing            |                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| No Operation, do nothing     | NoOp                      | Terminates flow in branches requiring no action      | Several nodes                   | None                               |                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Support Forum                | If                        | Checks if message is from support group              | 1st (supergroup output)         | From Ticket                       |                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| From Ticket                  | If                        | Checks if message is a reply in a forum topic        | Support Forum                  | Forward Support Reply To User / IF Topic Created |                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Forward Support Reply To User | HTTP Request              | Forwards support reply to user                        | From Ticket                    | No Operation, do nothing            |                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| IF Topic Created             | If                        | Checks if a forum topic was created                   | From Ticket                    | Send User Ticket Created Notification |                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Send User Ticket Created Notification | Telegram             | Notifies user a ticket was created                    | IF Topic Created               | No Operation, do nothing            |                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Check User in Database       | Redis (keys)              | Checks if user exists                                 | 1st (private output)            | New User ?                        |                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Retrieve all users in DB      | Redis (keys)              | Retrieves all user keys                               | IF Verified Channel             | Format Users                     |                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Format Users                 | Code                      | Converts Redis keys response to user array            | Retrieve all users in DB        | Filter Blocked Users             |                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Filter Blocked Users         | Filter                    | Filters out users marked as blocked                    | Format Users                   | Split In Batches1                |                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Split In Batches1            | SplitInBatches            | Batches users for rate-limited broadcast              | Filter Blocked Users           | Broadcast Channel Post into Users | Telegram API limit 29/sec                                                                                                                                                                                                                                                                                                                                                                                                            |
| Broadcast Channel Post into Users | HTTP Request          | Sends broadcast message to each user                   | Split In Batches1              | Wait1 / Set Blocked Member         |                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Wait1                       | Wait                      | Waits 3 seconds between batches                         | Broadcast Channel Post into Users | Split In Batches1              |                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Set Blocked Member           | Redis (set)               | Marks user as blocked if broadcast fails               | Broadcast Channel Post into Users | Split In Batches1              |                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| IF Verified Channel          | If                        | Checks if incoming channel post is from broadcast channel | 1st (channel output)           | Retrieve all users in DB / No Operation, do nothing |                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Sticky Note                  | Sticky Note               | Setup instructions, rationale, and usage notes         | None                         | None                               | Detailed setup instructions and project rationale                                                                                                                                                                                                                                                                                                                                                                                   |
| Sticky Note1                 | Sticky Note               | Explains topic recreation logic                         | None                         | None                               | Explains topic recreation on deletion or closure                                                                                                                                                                                                                                                                                                                                                                                    |
| Sticky Note2                 | Sticky Note               | Support side forwarding explanation                      | None                         | None                               | Support replies forwarding info                                                                                                                                                                                                                                                                                                                                                                                                      |
| Sticky Note3                 | Sticky Note               | User side data saving and forwarding explanation         | None                         | None                               | User data caching and message forwarding info                                                                                                                                                                                                                                                                                                                                                                                       |
| Sticky Note4                 | Sticky Note               | Channel broadcasting explanation                          | None                         | None                               | Describes broadcasting logic and purpose                                                                                                                                                                                                                                                                                                                                                                                            |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger Node**  
   - Type: Telegram Trigger  
   - Configure credentials with your bot token  
   - Set updates to listen to: `message` and `channel_post`

2. **Create a Set Node named Bot-Config**  
   - Add three fields:  
     - `BotToken`: Your Telegram bot token (also configure Telegram credentials for nodes)  
     - `Support_Group_ID`: Telegram Supergroup ID where support tickets will be created  
     - `Boradcast_Channel_ID`: Telegram Channel ID for broadcasting messages  
   - Connect Telegram Trigger output to Bot-Config

3. **Create a Code Node named Format**  
   - Paste the JavaScript code that escapes Redis JSON syntax and flattens nested objects under a root key `TG_USER_`  
   - Connect Bot-Config output to Format

4. **Create a Set Node named Bot-Fields**  
   - Configure to remove sensitive/unneeded fields: BotToken, pairedItem_item, Support_Group_ID  
   - Connect Format output to Bot-Fields

5. **Create a Switch Node named 1st**  
   - Route based on `$json.chat_type` or `$json.channel_post_sender_chat_type` string field  
   - Outputs:  
     - 1 for "private"  
     - 2 for "supergroup"  
     - 3 for "channel"  
     - 0 default/fallback  
   - Connect Bot-Fields output to 1st

6. **Private Chat Handling (Output 1 of 1st):**  
   - Create Redis node "Check User in Database" with operation `keys` and key pattern `TG-USER-{{ $json.chat_id }}`  
   - Connect 1st output 1 to this node  
   - Add an If node "New User ?" with condition `$json.isEmpty() === true`  
   - Connect Check User in Database output to New User ?  
   - For True (new user): Create Redis node "Save User Data" with operation `set` and key `TG-USER-{{ $json.chat_id }}` storing Bot-Fields JSON  
   - Connect New User ? true to Save User Data  
   - For False (existing user): Create Redis node "Update User Data" similarly  
   - Connect New User ? false to Update User Data  
   - After Update User Data, add Redis node "Get User Chat Topic" with operation `get` key `TG-USER-{{ $json.chat_id }}`  
   - Connect Update User Data to Get User Chat Topic

7. **Ticket Creation and Forwarding:**  
   - From Save User Data, connect to HTTP Request node "Create Topic (Chat Ticket)"  
     - URL: `https://api.telegram.org/bot{{ BotToken }}/createForumTopic?chat_id={{ Support_Group_ID }}&name=[username + id]&icon_color=9367192&icon_custom_emoji_id=5417915203100613993`  
   - Connect Create Topic to Redis node "Save Topic ID" (set hash key `TG-USER-{{ chat_id }}` with `message_thread_id`)  
   - Connect Save Topic ID and Get User Chat Topic to HTTP Request "Forward New Message"  
     - Calls Telegram API `forwardMessage` to support group topic  
   - From Forward New Message, add If node "IF No Topic Created" to check for error containing "thread not found"  
   - If true, call HTTP Request "ReCreate Topic (Chat Ticket)" (same as Create Topic)  
   - Then Redis node "ReSave Topic ID" (set hash)  
   - Then HTTP Request "Forward New Message to the recrated topic"  
   - Add NoOp nodes to end branches where no further action is needed  

8. **Support Side Reply Handling:**  
   - From 1st output 2 (supergroup), add If node "Support Forum" checking if message chat ID equals Support_Group_ID  
   - Connect Support Forum true to If node "From Ticket" with conditions on `message_thread_id` and topic reply flags  
   - Connect From Ticket true to HTTP Request "Forward Support Reply To User"  
     - Forwards support reply to user extracted from topic name  
   - Connect From Ticket true also to If node "IF Topic Created" checking if forum topic created name is non-empty  
   - IF Topic Created true connects to Telegram node "Send User Ticket Created Notification"  
   - Add NoOp nodes to end flows where no action is needed  

9. **Broadcasting System:**  
   - From 1st output 3 (channel), add If node "IF Verified Channel" checking if channel_post sender_chat id equals `Boradcast_Channel_ID`  
   - If true, Redis node "Retrieve all users in DB" with keys operation pattern `TG-USER-*`  
   - Connect to Code node "Format Users" to convert key response to array of users  
   - Connect to Filter node "Filter Blocked Users" filtering users where `Blocked` != 1  
   - Connect to SplitInBatches node "Split In Batches1" with batch size 29  
   - Connect to HTTP Request node "Broadcast Channel Post into Users"  
     - Calls Telegram API `copyMessage` to send broadcast to user chat IDs  
     - On error: continue execution  
   - Connect to Wait node "Wait1" with 3 seconds delay  
   - Connect Wait node back to SplitInBatches for next batch  
   - On error of Broadcast node, connect to Redis node "Set Blocked Member" to mark user as blocked  
   - Connect Set Blocked Member output back to SplitInBatches node  

10. **Add Sticky Notes:**  
    - Add all sticky notes with provided text to explain configuration, flow logic, and rationale for users setting up or maintaining the workflow.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Context or Link                                                                                                                                                                                      |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Use **Config Bot** node to setup your Telegram details: bot token, support group ID (bot must be admin), broadcast channel ID (bot must be admin).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Setup guidance in Sticky Note at workflow start                                                                                                                                                    |
| Do not make your support group public. It converts group messages into tickets that get forwarded from users. Avoid promoting your broadcasting channel; it is dedicated for organizing broadcast messages. You can host Redis easily with Coolify.io. Future version will add message edit forwarding.                                                                                                                                                                                                                                                                                                                                              | Sticky Note explaining usage best practices                                                                                                                                                        |
| This method prevents support history loss caused by Telegram message deletions since forwarded messages in support group cannot be deleted by the sender. Enables team collaboration by transforming the group into a ticketing system where multiple coworkers can reply. Integrates easily with third-party CRM systems via n8n.                                                                                                                                                                                                                                                                                                                         | Sticky Note rationale for design                                                                                                                                                                  |
| Support side block forwards replies sent by support team to users, maintaining conversation continuity.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Sticky Note2                                                                                                                                                                                       |
| User side caches data in Redis for fast access and forwards messages to support tickets.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Sticky Note3                                                                                                                                                                                       |
| Broadcasting sends channel posts to all users who have interacted with the bot before, filtering blocked users and respecting Telegram API limits with batching and wait nodes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Sticky Note4                                                                                                                                                                                       |
| Live Demo Bot: [Telegram Bot Link](https://TheLiveChatBot.t.me) | Live Demo Support Group: [Telegram Group Link](https://t.me/+-8BELbd0GDYxMTEx) | Broadcasting Channel: [Telegram Channel Link](https://broadcasting_channel.t.me)                                                                                                                                                                                                                                                         |

---

This structured documentation provides an exhaustive understanding of the workflow's architecture, the function of each node, key configurations, and detailed instructions to rebuild it entirely. It anticipates possible errors such as Redis connection issues, Telegram API rate limits, topic deletion race conditions, and blocked users filtering, ensuring reliability and maintainability.