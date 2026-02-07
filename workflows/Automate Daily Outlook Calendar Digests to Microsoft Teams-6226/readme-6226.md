Automate Daily Outlook Calendar Digests to Microsoft Teams

https://n8nworkflows.xyz/workflows/automate-daily-outlook-calendar-digests-to-microsoft-teams-6226


# Automate Daily Outlook Calendar Digests to Microsoft Teams

---

### 1. Workflow Overview

This workflow automates the delivery of a daily summary of Outlook calendar events into a Microsoft Teams chat or channel. It is designed to provide team members or individuals with a clear agenda for the day without needing to open their calendar applications. The workflow runs automatically every midnight, retrieves the current day’s calendar events, formats them into a readable HTML message, and sends the summary to a configured Teams chat.

**Logical Blocks:**

- **1.1 Scheduled Trigger:** Initiates the workflow automatically every midnight.
- **1.2 Date Filter Creation:** Generates a Microsoft Graph API-compatible date filter string for retrieving today’s events.
- **1.3 Outlook Calendar Retrieval:** Fetches all calendar events for the current day using the Microsoft Outlook API.
- **1.4 Message Formatting:** Transforms the retrieved events into an HTML-formatted message summarizing meeting time, subject, and preview.
- **1.5 Teams Message Delivery:** Sends the formatted daily agenda message to a specified Microsoft Teams chat.

Additional sticky notes provide explanations, usage instructions, and sample outputs.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Trigger

- **Overview:** Automatically starts the workflow daily at midnight to prepare the day’s agenda.
- **Nodes Involved:**  
  - Schedule every midnight

- **Node Details:**

  - **Schedule every midnight**  
    - *Type & Role:* Schedule Trigger - initiates workflow execution based on a time interval.  
    - *Configuration:* Set to trigger every 24 hours at midnight UTC by default (uses an empty interval array implying daily run).  
    - *Inputs:* None (trigger node).  
    - *Outputs:* Activates "Create filter for 'TODAY' value" node.  
    - *Version:* 1.2 (compatible with current n8n versions).  
    - *Potential Failure Points:* Timezone misalignment if user expects local time instead of UTC; misconfiguration could cause unexpected trigger times.

---

#### 1.2 Date Filter Creation

- **Overview:** Calculates the UTC start and end timestamps for the current day and constructs a filter string compatible with Microsoft Graph API to fetch events occurring today.
- **Nodes Involved:**  
  - Create filter for "TODAY" value

- **Node Details:**

  - **Create filter for "TODAY" value**  
    - *Type & Role:* Code node executing JavaScript to produce date filters.  
    - *Configuration:*  
      - Calculates start of today at 00:00:00 UTC and start of tomorrow at 00:00:00 UTC.  
      - Generates ISO 8601 strings for these dates.  
      - Constructs a filter string for Microsoft Graph API:  
        `start/dateTime ge 'startISO' and start/dateTime lt 'endISO'`  
      - Returns JSON with keys: filter, startISO, endISO.  
    - *Inputs:* Trigger from Schedule node (no input data used).  
    - *Outputs:* JSON object with filter string and date boundaries.  
    - *Expressions/Variables:* Uses native JavaScript Date methods and template literals.  
    - *Version:* 2.  
    - *Potential Failure Points:* Timezone errors if local time expected but UTC used; Date object manipulations can fail if environment date settings are altered; malformed filter string could cause API errors.

---

#### 1.3 Outlook Calendar Retrieval

- **Overview:** Retrieves all Outlook calendar events for the current day using the filter string generated previously.
- **Nodes Involved:**  
  - Get Calendar Events

- **Node Details:**

  - **Get Calendar Events**  
    - *Type & Role:* Microsoft Outlook node - fetches calendar events using Microsoft Graph API.  
    - *Configuration:*  
      - Resource set to "event".  
      - Operation is "Get Many" (retrieve multiple events).  
      - Filter parameter uses the dynamic expression: `{{$json.filter}}` sourced from the previous Code node.  
    - *Inputs:* Receives JSON with filter string from "Create filter for 'TODAY' value".  
    - *Outputs:* List of calendar event items for the day.  
    - *Credentials:* Requires Microsoft Outlook OAuth2 API credentials with permissions to read calendar events.  
    - *Version:* 2.  
    - *Potential Failure Points:* Authentication failures (expired token, permission issues); API rate limits; malformed filter leading to empty or error responses; network timeouts.

---

#### 1.4 Message Formatting

- **Overview:** Processes each calendar event into an HTML snippet summarizing the meeting time, subject, and body preview for presentation in Teams.
- **Nodes Involved:**  
  - HTML format

- **Node Details:**

  - **HTML format**  
    - *Type & Role:* Code node to transform raw event data into HTML messages.  
    - *Configuration:*  
      - Iterates over each item (event).  
      - Extracts `start.dateTime`, `subject`, and `bodyPreview`.  
      - Uses default values ("N/A" or "No subject") if fields are missing.  
      - Builds an HTML string combining these fields with icons and formatting tags (`<b>`, `<br>`).  
    - *Expressions/Variables:* Uses JavaScript map function on items; accesses nested JSON fields safely with optional chaining (`?.`).  
    - *Inputs:* Receives event data array from "Get Calendar Events".  
    - *Outputs:* JSON array with field `htmlMessage` containing the formatted HTML string for each event.  
    - *Version:* 2.  
    - *Potential Failure Points:* Missing fields in events; unexpected data structure changes; improper HTML escaping (though none included here); large number of events could cause performance issues.

---

#### 1.5 Teams Message Delivery

- **Overview:** Sends the compiled HTML message summarizing today’s meetings to a specified Microsoft Teams chat or channel.
- **Nodes Involved:**  
  - Create chat message

- **Node Details:**

  - **Create chat message**  
    - *Type & Role:* Microsoft Teams node - posts chat messages.  
    - *Configuration:*  
      - Resource set to "chatMessage".  
      - Uses a pre-configured chat ID (list mode with cached URL and display name).  
      - Message content set dynamically with expression: `{{$json.htmlMessage}}` obtained from previous Code node.  
      - Options left default/empty.  
    - *Inputs:* Receives formatted HTML messages from "HTML format".  
    - *Outputs:* None (final node).  
    - *Credentials:* Requires Microsoft Teams OAuth2 API credentials with permissions to post messages to chat/channel.  
    - *Version:* 2.  
    - *Potential Failure Points:* Authentication errors; invalid chat ID; message size limits; HTML rendering inconsistencies in Teams; network issues.

---

#### Additional Nodes: Sticky Notes

- **Sticky Note2:** Describes the automatic daily schedule sending process and summarizes the workflow steps.
- **Sticky Note3:** Shows a sample final message format as received in Teams chat.
- **Sticky Note4:** Provides a detailed description of the workflow, use cases, how it works, instructions for customization, and requirements.

These notes are purely informational and do not affect the workflow execution.

---

### 3. Summary Table

| Node Name                 | Node Type                 | Functional Role                          | Input Node(s)                  | Output Node(s)               | Sticky Note                                                                                              |
|---------------------------|---------------------------|----------------------------------------|-------------------------------|-----------------------------|--------------------------------------------------------------------------------------------------------|
| Schedule every midnight    | Schedule Trigger          | Starts workflow daily at midnight      | -                             | Create filter for "TODAY" value | See Sticky Note4 for workflow overview and usage instructions                                         |
| Create filter for "TODAY" value | Code                    | Generates today's date filter string   | Schedule every midnight        | Get Calendar Events          | See Sticky Note4 for workflow overview and usage instructions                                         |
| Get Calendar Events        | Microsoft Outlook         | Retrieves today's calendar events      | Create filter for "TODAY" value | HTML format                  | See Sticky Note4 for workflow overview and usage instructions                                         |
| HTML format                | Code                     | Formats events into HTML message        | Get Calendar Events            | Create chat message          | See Sticky Note2 for stepwise summary; See Sticky Note4 for workflow overview and usage instructions   |
| Create chat message        | Microsoft Teams           | Sends formatted message to Teams chat  | HTML format                   | -                           | See Sticky Note2 for stepwise summary; See Sticky Note3 for sample output message; See Sticky Note4 for overview |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow in n8n.**

2. **Add a Schedule Trigger node:**  
   - Name: `Schedule every midnight`  
   - Type: `Schedule Trigger`  
   - Configure to trigger daily at midnight UTC (default daily interval).  
   - No inputs needed.

3. **Add a Code node:**  
   - Name: `Create filter for "TODAY" value`  
   - Type: `Code` (JavaScript)  
   - Connect from `Schedule every midnight`.  
   - Paste the following JS code:  
     ```javascript
     const now = new Date();

     // Start of today (UTC)
     const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
     // Start of tomorrow (UTC)
     const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));

     const startISO = start.toISOString();
     const endISO = end.toISOString();

     const filter = `start/dateTime ge '${startISO}' and start/dateTime lt '${endISO}'`;

     return [{
       json: {
         filter,
         startISO,
         endISO
       }
     }];
     ```
   - This code calculates the UTC boundaries of the current day and builds a Microsoft Graph API filter string.

4. **Add a Microsoft Outlook node:**  
   - Name: `Get Calendar Events`  
   - Type: `Microsoft Outlook`  
   - Connect from `Create filter for "TODAY" value`.  
   - Set Resource to `event`.  
   - Set Operation to `Get Many` (retrieve multiple events).  
   - In Filters, choose `Custom` and enter the expression: `{{$json.filter}}` — this uses the filter string from the previous node.  
   - Configure Microsoft Outlook OAuth2 credentials with permission to read calendar events.

5. **Add a Code node:**  
   - Name: `HTML format`  
   - Type: `Code` (JavaScript)  
   - Connect from `Get Calendar Events`.  
   - Paste the following code:  
     ```javascript
     return items.map(item => {
       const start = item.json.start?.dateTime || "N/A";
       const subject = item.json.subject || "No subject";
       const preview = item.json.bodyPreview || "";

       return {
         json: {
           htmlMessage: `
             <b>📅 Meeting Time:</b> ${start}<br>
             <b>📝 Subject:</b> ${subject}<br>
             <b>📄 Summary:</b><br>
             ${preview}
           `
         }
       };
     });
     ```
   - This formats event details into an HTML message.

6. **Add a Microsoft Teams node:**  
   - Name: `Create chat message`  
   - Type: `Microsoft Teams`  
   - Connect from `HTML format`.  
   - Set Resource to `chatMessage`.  
   - For Chat ID, select or enter the target chat/channel ID (can be set in list mode with cached URLs for ease).  
   - For Message, use expression: `{{$json.htmlMessage}}` to send the formatted HTML content.  
   - Configure Microsoft Teams OAuth2 credentials with permission to post messages.

7. **Save and activate the workflow.**

8. **(Optional) Add Sticky Notes:**  
   - Add descriptive sticky notes in the n8n editor to explain the workflow purpose, usage instructions, sample outputs, and configuration notes as per the original workflow.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Context or Link                                                                                     |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| Automatically send your daily schedule from Outlook calendar to Microsoft Teams in a formatted, easy-to-read HTML message. Supports team coordination without opening Outlook.                                                                                                                                                                                                                                                                                                                               | Provided by Sticky Note2 in the workflow                                                         |
| Detailed workflow description, use cases, configuration steps, and requirements including the necessity for Microsoft Outlook and Microsoft Teams API permissions.                                                                                                                                                                                                                                                                                                                                         | Provided by Sticky Note4 in the workflow                                                         |
| Sample message format as received in Teams chat illustrating meeting time, subject, summary, and meeting join details.                                                                                                                                                                                                                                                                                                                                                                                    | Provided by Sticky Note3 in the workflow                                                         |
| For community support, visit the n8n community user page: https://community.n8n.io/u/easy8.ai. For direct contact: Easy8.ai. YouTube tutorials and support: https://www.youtube.com/@easy8ai                                                                                                                                                                                                                                                                                                               | Support and additional resources                                                                 |

---

**Disclaimer:**  
The text provided is exclusively derived from an automated workflow created with n8n, a workflow automation tool. This process strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data processed is legal and public.

---