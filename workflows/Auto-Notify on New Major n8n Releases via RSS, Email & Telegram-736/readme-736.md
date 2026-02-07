Auto-Notify on New Major n8n Releases via RSS, Email & Telegram

https://n8nworkflows.xyz/workflows/auto-notify-on-new-major-n8n-releases-via-rss--email---telegram-736


# Auto-Notify on New Major n8n Releases via RSS, Email & Telegram

### 1. Workflow Overview

This workflow automates the monitoring of **major releases** of the **n8n project** by periodically checking its GitHub releases RSS feed. It detects newly published major versions (versions ending with `.0` such as `1.0.0` or `2.0.0`) released within the last 4 hours and notifies users via **Telegram** and **AWS SES email**. It is designed for n8n users who want timely alerts on significant updates without manual checks.

The workflow consists of the following logical blocks:

- **1.1 Triggering and Scheduling**: Defines when the workflow runs (manual or scheduled).
- **1.2 RSS Feed Retrieval**: Reads the official n8n GitHub releases RSS feed.
- **1.3 Filtering Logic**: Extracts releases published within the last 4 hours and filters for major release tags (ending with `.0`).
- **1.4 Conditional Check**: Determines if there are any relevant new releases after filtering.
- **1.5 Notification Dispatch**: Sends alert messages via Telegram and email if new major releases are found.

---

### 2. Block-by-Block Analysis

#### 2.1 Triggering and Scheduling

- **Overview**: Starts the workflow either manually or on a fixed schedule (three times daily).
- **Nodes Involved**: `On clicking 'execute'`, `Cron`
  
**Node Details**

- **On clicking 'execute'**  
  - *Type*: Manual Trigger  
  - *Role*: Allows immediate manual execution for testing or on-demand runs.  
  - *Connections*: Outputs to `RSS Feed Read`  
  - *Edge cases*: No inputs; manual trigger, no failure expected.  
- **Cron**  
  - *Type*: Cron Trigger  
  - *Role*: Automatically triggers the workflow at 10:00, 14:00, and 18:00 server time daily.  
  - *Configuration*: Custom cron expression `0 0 10,14,18 * * *`  
  - *Connections*: Outputs to `RSS Feed Read`  
  - *Edge cases*: Cron misconfiguration or server time zone mismatch may cause missed or mistimed runs.

---

#### 2.2 RSS Feed Retrieval

- **Overview**: Fetches the latest releases data from the official n8n GitHub releases RSS feed.
- **Nodes Involved**: `RSS Feed Read`

**Node Details**

- **RSS Feed Read**  
  - *Type*: RSS Feed Read  
  - *Role*: Pulls the latest release entries from `https://github.com/n8n-io/n8n/releases.atom`  
  - *Parameters*: URL set to n8n releases Atom feed  
  - *Input*: Triggered by `Cron` or `On clicking 'execute'`  
  - *Output*: Emits the feed items downstream for filtering  
  - *Edge cases*: Network errors, feed unavailability, or format changes in the Atom feed may cause failures or empty data.

---

#### 2.3 Filtering Logic

- **Overview**: Filters feed entries to identify major releases published in the last 4 hours.
- **Nodes Involved**: `Filter by current day`

**Node Details**

- **Filter by current day**  
  - *Type*: Function  
  - *Role*: Custom JavaScript filtering of feed items based on publication time and release version pattern.  
  - *Logic*:
    - Gets current date/time and subtracts 4 hours to define a recent window.
    - Filters items where `pubDate` includes the calculated date-hour string.
    - Filters titles starting with `"n8n@"` and ending with `".0"` to detect major releases.
    - Joins the matching titles into a single notification string prefixed with `"New release on n8n:\n"`.
  - *Input*: RSS feed items from `RSS Feed Read`  
  - *Output*: JSON object with `date` and `data` fields; `data` contains notification text or empty string if none found.  
  - *Edge cases*:
    - Timezone or server time mismatch may cause missed detections.
    - If no matching releases found, outputs empty string.
    - Title format changes in the feed may break detection logic.
  - *Version notes*: Uses JavaScript ES5/ES6 syntax compatible with n8n Function node.

---

#### 2.4 Conditional Check

- **Overview**: Checks if the filtered data contains any new release information.
- **Nodes Involved**: `IF`

**Node Details**

- **IF**  
  - *Type*: If (Conditional)  
  - *Role*: Tests if `data` field from `Filter by current day` contains any text.  
  - *Condition*: Regex check `/.+/` on `{{$node["Filter by current day"].json["data"]}}` to verify non-empty string.  
  - *Input*: Output from `Filter by current day`  
  - *Output*:  
    - True branch if new release data exists → proceeds to notification nodes.  
    - False branch if empty → workflow ends silently.  
  - *Edge cases*: If expression evaluation fails or data field missing, may default to false.

---

#### 2.5 Notification Dispatch

- **Overview**: Sends alerts about the new major n8n release via Telegram and AWS SES email.
- **Nodes Involved**: `Telegram`, `AWS SES`

**Node Details**

- **Telegram**  
  - *Type*: Telegram  
  - *Role*: Sends a message to a Telegram chat with the release notification.  
  - *Parameters*:
    - Message text: `{{$node["Filter by current day"].json["data"]}}` (dynamic notification text)  
    - Chat ID: `-1001235337538` (group/channel chat)  
    - Parse mode: `HTML` (allows rich text formatting)  
  - *Credentials*: Uses Telegram API credentials named `it-killia-bot`  
  - *Input*: True branch from `IF`  
  - *Output*: None (end node)  
  - *Edge cases*:  
    - Invalid chat ID or bot permissions cause failure.  
    - API rate limits or network issues can delay or block messages.  
- **AWS SES**  
  - *Type*: AWS Simple Email Service (SES)  
  - *Role*: Sends an email with the release notification details.  
  - *Parameters*:
    - Email body: HTML-formatted, same as Telegram message.  
    - Subject: `"New n8n version"`  
    - From email: `myemail@mydomain.com` (must be verified in SES)  
    - To address: `myemail@mydomain.com` (recipient)  
  - *Credentials*: AWS SES credentials named `ses`  
  - *Input*: True branch from `IF`  
  - *Output*: None (end node)  
  - *Edge cases*:  
    - SES credential misconfiguration or unverified email addresses cause send failures.  
    - Network issues or SES API limits may delay emails.

---

### 3. Summary Table

| Node Name            | Node Type               | Functional Role                      | Input Node(s)              | Output Node(s)                   | Sticky Note                                                                                                       |
|----------------------|-------------------------|------------------------------------|----------------------------|---------------------------------|------------------------------------------------------------------------------------------------------------------|
| On clicking 'execute' | Manual Trigger          | Manual workflow start               | —                          | RSS Feed Read                   |                                                                                                                  |
| Cron                 | Cron Trigger             | Scheduled workflow start (10:00,14:00,18:00) | —                          | RSS Feed Read                   |                                                                                                                  |
| RSS Feed Read        | RSS Feed Read            | Reads n8n GitHub releases RSS feed | On clicking 'execute', Cron | Filter by current day            |                                                                                                                  |
| Filter by current day | Function                 | Filters feed items published within last 4 hours and major versions | RSS Feed Read               | IF                             |                                                                                                                  |
| IF                   | If / Conditional         | Checks if filtered data contains releases | Filter by current day       | Telegram, AWS SES                |                                                                                                                  |
| Telegram             | Telegram                 | Sends Telegram notification        | IF (true branch)            | —                               |                                                                                                                  |
| AWS SES              | AWS Simple Email Service | Sends email notification           | IF (true branch)            | —                               |                                                                                                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow** in your n8n instance and name it appropriately (e.g., `n8n_check`).

2. **Add a Manual Trigger node**  
   - Node Type: `Manual Trigger`  
   - Purpose: For on-demand testing or execution.

3. **Add a Cron node**  
   - Node Type: `Cron`  
   - Parameters:  
     - Trigger Times: Custom cron expression `0 0 10,14,18 * * *` (runs at 10:00, 14:00, and 18:00 server time daily).

4. **Connect both the Manual Trigger and Cron nodes to a new RSS Feed Read node.**

5. **Add an RSS Feed Read node**  
   - Node Type: `RSS Feed Read`  
   - Parameters:  
     - URL: `https://github.com/n8n-io/n8n/releases.atom`  
   - Input connections: From both Manual Trigger and Cron nodes.

6. **Add a Function node named `Filter by current day`** with the following JavaScript code:
   ```javascript
   var d = new Date();
   var year = d.getFullYear();
   var month = d.getMonth() + 1;
   var day = d.getDate();
   var hour = d.getHours() - 4; // Publication in last 4 hours

   month = month < 10 ? "0" + month : month;
   day = day < 10 ? "0" + day : day;
   hour = hour < 10 ? "0" + hour : hour;

   var lines = items.filter(function(item) {
     var str = year + "-" + month + "-" + day + "T" + hour;
     return item.json.pubDate.indexOf(str) !== -1 && item.json.title.indexOf("n8n@") !== -1 && item.json.title.indexOf(".0") !== -1;
   }).map(function(item) {
     return item.json.title;
   }).join("\n");

   return [
     {
       json: {
         date: year + "-" + month + "-" + day + " " + hour,
         data: lines && lines.length ? "New release on n8n:\n" + lines : ""
       }
     }
   ];
   ```
   - Connect input from `RSS Feed Read`.

7. **Add an If node**  
   - Parameters:  
     - Condition Type: String  
     - Condition: Check if `{{$node["Filter by current day"].json["data"]}}` matches regex `/.+/` (non-empty string).  
   - Input: From `Filter by current day`.

8. **Add a Telegram node**  
   - Node Type: `Telegram`  
   - Parameters:  
     - Text: `{{$node["Filter by current day"].json["data"]}}`  
     - Chat ID: Set your Telegram group's or user's chat ID (e.g., `-1001235337538`)  
     - Additional Fields → Parse mode: `HTML`  
   - Credentials: Create or select `Telegram API` credentials for your bot.  
   - Connect input from the If node’s **true** branch.

9. **Add an AWS SES node**  
   - Node Type: `AWS SES`  
   - Parameters:  
     - Body: `{{$node["Filter by current day"].json["data"]}}`  
     - Subject: `"New n8n version"`  
     - From Email: Your verified SES sender email (e.g., `myemail@mydomain.com`)  
     - To Addresses: Add recipient email(s) (e.g., `myemail@mydomain.com`)  
     - Is Body HTML: `true`  
   - Credentials: Configure AWS SES credentials with appropriate permissions.  
   - Connect input from the If node’s **true** branch.

10. **Connect the If node’s false branch to no further nodes**, effectively ending the workflow silently if no new releases are detected.

11. **Activate the workflow** to enable scheduled execution.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                 | Context or Link                                                                                               |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| The workflow requires activation to start scheduled polling and notifications.                                                                               | Setup note in workflow description                                                                            |
| To receive Telegram notifications, configure your Telegram bot and obtain the chat ID for your target group or user.                                        | Telegram Bot API documentation: https://core.telegram.org/bots/api                                            |
| AWS SES requires verified sender and recipient email addresses along with configured IAM permissions for sending emails.                                     | AWS SES setup guide: https://docs.aws.amazon.com/ses/latest/DeveloperGuide/setting-up.html                     |
| The GitHub releases Atom feed format must remain consistent; changes to feed structure or title formatting may require updates to filtering logic.           | GitHub releases feed: https://github.com/n8n-io/n8n/releases.atom                                            |
| To customize, consider adding other notification channels like Slack or Discord by adding corresponding nodes post-IF check.                               | n8n Community forum and node library: https://community.n8n.io/                                              |
| Cron schedule can be adjusted to change notification frequency as required.                                                                                   | n8n Cron node documentation: https://docs.n8n.io/nodes/n8n-nodes-base.cron/                                   |
| Workflow created by [Miquel Colomer](https://www.linkedin.com/in/miquelcolomersalas/) and [n8nhackers.com](https://n8nhackers.com).                         | Contact: [contact@n8nhackers.com](mailto:contact@n8nhackers.com)                                              |

---

This document fully describes the workflow structure, logic, and configuration, enabling both human operators and automation systems to understand, reproduce, and extend the workflow efficiently.