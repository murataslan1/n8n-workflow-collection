Automate UniFi Controller Updates via SSH with Telegram Notifications

https://n8nworkflows.xyz/workflows/automate-unifi-controller-updates-via-ssh-with-telegram-notifications-8599


# Automate UniFi Controller Updates via SSH with Telegram Notifications

### 1. Workflow Overview

This workflow automates the process of checking for new UniFi Controller software releases and, when a new release is detected (within the last 24 hours), performs an upgrade on the UniFi Controller host via SSH. It also sends a notification via Telegram summarizing the update, optionally using an AI language model to generate a concise summary.

Logical blocks included:

- **1.1 Trigger & Release Check:** Scheduled trigger initiates the workflow once daily at 13:13, fetching the UniFi Debian repository release metadata and parsing it to determine if an update occurred within the last 24 hours.
- **1.2 Upgrade Execution via SSH:** If a new release is detected, the workflow runs commands over SSH on the UniFi Controller host to update package lists and upgrade the UniFi package.
- **1.3 Post-Upgrade Notification:** After upgrading, the workflow uses an AI model to generate a summary message and sends a Telegram notification to inform stakeholders of the update status.

---

### 2. Block-by-Block Analysis

#### 2.1 Trigger & Release Check

- **Overview:**  
This block triggers the workflow daily at a fixed time, fetches the latest UniFi Debian package release metadata, extracts relevant details (codename, release date), and determines if the release is recent (within the last 24 hours).

- **Nodes Involved:**  
  - Schedule Trigger  
  - HTTP Request  
  - Extract Codename + Date + Time Comparison  
  - If: Changed within 24h?  
  - Sticky Note: Trigger & Check

- **Node Details:**

  - **Schedule Trigger**  
    - *Type:* scheduleTrigger  
    - *Role:* Initiates workflow at 13:13 daily  
    - *Configuration:* Interval trigger set to hour=13, minute=13  
    - *Inputs:* None (trigger node)  
    - *Outputs:* HTTP Request node  
    - *Edge Cases:* Scheduler misfire or downtime may delay checks  

  - **HTTP Request**  
    - *Type:* httpRequest  
    - *Role:* Retrieve the UniFi Debian stable InRelease file as plain text  
    - *Configuration:* GET request to `https://dl.ui.com/unifi/debian/dists/stable/InRelease`, response format string  
    - *Inputs:* Trigger from Schedule Trigger  
    - *Outputs:* Extract Codename + Date + Time Comparison node  
    - *Edge Cases:* Network errors, HTTP errors, invalid response format  

  - **Extract Codename + Date + Time Comparison**  
    - *Type:* code (JavaScript)  
    - *Role:* Parses InRelease content to extract the release codename and date; calculates if the release is less than 24 hours old  
    - *Key Expressions:* Regex extraction of `Codename` and `Date` fields; date parsing and timestamp comparison  
    - *Inputs:* HTTP Request output JSON with `body` string  
    - *Outputs:* If: Changed within 24h? node with JSON containing `codename`, `releaseDate`, `releaseTimestamp`, `changedInLast24h`  
    - *Edge Cases:* Missing or malformed InRelease content, date parsing errors  

  - **If: Changed within 24h?**  
    - *Type:* if  
    - *Role:* Conditional gate that passes workflow forward only if the release changed less than 24 hours ago (`changedInLast24h` is true)  
    - *Condition:* Boolean check on `changedInLast24h` field from previous node  
    - *Inputs:* Extract Codename + Date + Time Comparison  
    - *Outputs:*  
      - True: Update package lists node (proceed with upgrade)  
      - False: Ends workflow (no upgrade needed)  
    - *Edge Cases:* Misinterpretation of date or boolean values  

  - **Sticky Note: Trigger & Check**  
    - *Type:* stickyNote  
    - *Role:* Documenting this block as the initial trigger and release check  
    - *Content:* "Trigger workflow and check if UniFi repo has updated within the last 24 hours"  
    - *Inputs/Outputs:* None (documentation only)  

---

#### 2.2 Upgrade Execution via SSH

- **Overview:**  
If a new release is confirmed, this block updates the package lists and upgrades the UniFi package on the controller host via SSH commands.

- **Nodes Involved:**  
  - Update package lists (SSH)  
  - Upgrade UniFi (SSH)  
  - Sticky Note: Upgrade

- **Node Details:**

  - **Update package lists**  
    - *Type:* ssh  
    - *Role:* Executes `apt-get --allow-releaseinfo-change update` to refresh package lists, allowing for repository metadata changes  
    - *Configuration:* Working directory `/root`, command as above, private key authentication (SSH key must be configured)  
    - *Inputs:* If: Changed within 24h? node (True branch)  
    - *Outputs:* Upgrade UniFi node  
    - *Edge Cases:* SSH connection failure, command errors, apt lock held by other processes  

  - **Upgrade UniFi**  
    - *Type:* ssh  
    - *Role:* Executes `apt-get upgrade -y unifi` to upgrade the UniFi package non-interactively  
    - *Configuration:* Working directory `/root`, command as above, private key authentication  
    - *Inputs:* Update package lists node  
    - *Outputs:* Message a model node  
    - *Edge Cases:* SSH failures, package upgrade failures, insufficient permissions  

  - **Sticky Note: Upgrade**  
    - *Type:* stickyNote  
    - *Role:* Documentation for upgrade block  
    - *Content:* "Issue package upgrade via SSH (controller host needs apt access and SSH key configured)"  

---

#### 2.3 Post-Upgrade Notification

- **Overview:**  
After upgrading, this block generates a concise summary of the update using an AI language model and sends a Telegram notification with the update details and a link to the UniFi web interface.

- **Nodes Involved:**  
  - Message a model (OpenAI)  
  - Notify via Telegram  
  - Sticky Note: Notify

- **Node Details:**

  - **Message a model**  
    - *Type:* @n8n/n8n-nodes-langchain.openAi  
    - *Role:* Uses OpenAI GPT-4.1-NANO model to create a summary message about the UniFi update  
    - *Configuration:*  
      - Model: GPT-4.1-NANO  
      - Message prompt includes extracted codename, release date, and apt command exit codes/stdout from previous SSH nodes  
    - *Inputs:* Upgrade UniFi node output (exit codes and stdout) and Extract Codename + Date + Time Comparison data  
    - *Outputs:* Notify via Telegram node  
    - *Edge Cases:* API authentication errors, rate limits, malformed prompt causing generation failure  

  - **Notify via Telegram**  
    - *Type:* telegram  
    - *Role:* Sends a Telegram message to a configured chat ID with the update summary and UniFi web interface link  
    - *Configuration:*  
      - Text uses Markdown formatting  
      - Chat ID from environment variable `TELEGRAM_CHAT_ID`  
      - Message includes AI-generated content or a fallback string if AI message is missing  
    - *Inputs:* Message a model output  
    - *Outputs:* None (end of workflow)  
    - *Edge Cases:* Missing or invalid Telegram token/credentials, invalid chat ID, Telegram API downtime  

  - **Sticky Note: Notify**  
    - *Type:* stickyNote  
    - *Role:* Documentation of notification block  
    - *Content:* "Inform via Telegram about the update (optional LLM for a short summary) Require env var TELEGRAM_CHAT_ID and credentials binding."  

---

### 3. Summary Table

| Node Name                        | Node Type                            | Functional Role                          | Input Node(s)                      | Output Node(s)                         | Sticky Note                                                                                      |
|---------------------------------|------------------------------------|----------------------------------------|----------------------------------|--------------------------------------|------------------------------------------------------------------------------------------------|
| Schedule Trigger                 | scheduleTrigger                    | Workflow trigger at daily fixed time   | None                             | HTTP Request                         | Trigger workflow and check if UniFi repo has updated within the last 24 hours                   |
| HTTP Request                    | httpRequest                       | Fetch UniFi Debian stable InRelease    | Schedule Trigger                 | Extract Codename + Date + Time Comparison | Trigger workflow and check if UniFi repo has updated within the last 24 hours                   |
| Extract Codename + Date + Time Comparison | code                             | Parse release metadata and check recency | HTTP Request                    | If: Changed within 24h?               | Trigger workflow and check if UniFi repo has updated within the last 24 hours                   |
| If: Changed within 24h?          | if                               | Conditional pass if release is recent  | Extract Codename + Date + Time Comparison | Update package lists (True)           | Trigger workflow and check if UniFi repo has updated within the last 24 hours                   |
| Update package lists             | ssh                              | Run apt-get update on UniFi host       | If: Changed within 24h? (True)   | Upgrade UniFi                        | Issue package upgrade via SSH (controller host needs apt access and SSH key configured)         |
| Upgrade UniFi                   | ssh                              | Upgrade UniFi package                   | Update package lists             | Message a model                     | Issue package upgrade via SSH (controller host needs apt access and SSH key configured)         |
| Message a model                 | @n8n/n8n-nodes-langchain.openAi | Generate update summary via AI model   | Upgrade UniFi                   | Notify via Telegram                 | Inform via Telegram about the update (optional LLM for a short summary) Require env var TELEGRAM_CHAT_ID and credentials binding. |
| Notify via Telegram             | telegram                         | Send Telegram notification              | Message a model                 | None                               | Inform via Telegram about the update (optional LLM for a short summary) Require env var TELEGRAM_CHAT_ID and credentials binding. |
| Sticky Note: Trigger & Check    | stickyNote                      | Documentation                          | None                             | None                               | Trigger workflow and check if UniFi repo has updated within the last 24 hours                   |
| Sticky Note: Upgrade            | stickyNote                      | Documentation                          | None                             | None                               | Issue package upgrade via SSH (controller host needs apt access and SSH key configured)         |
| Sticky Note: Notify             | stickyNote                      | Documentation                          | None                             | None                               | Inform via Telegram about the update (optional LLM for a short summary) Require env var TELEGRAM_CHAT_ID and credentials binding. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**  
   - Type: `scheduleTrigger`  
   - Set to trigger daily at 13:13 (Hour: 13, Minute: 13)  
   - Connect output to HTTP Request node  

2. **Create HTTP Request Node**  
   - Type: `httpRequest`  
   - Method: GET  
   - URL: `https://dl.ui.com/unifi/debian/dists/stable/InRelease`  
   - Response format: String  
   - Connect output to Extract Codename + Date + Time Comparison node  

3. **Create Code Node: Extract Codename + Date + Time Comparison**  
   - Type: `code` (JavaScript)  
   - Paste the following logic:  
     ```javascript
     const inReleaseContent = $input.first().json.body || '';

     const codenameMatch = inReleaseContent.match(/^Codename:\s*(.+)$/m);
     const codename = codenameMatch ? codenameMatch[1].trim() : null;

     const dateMatch = inReleaseContent.match(/^Date:\s*(.+)$/m);
     const dateString = dateMatch ? dateMatch[1].trim() : null;

     let releaseTimestamp = null;
     let changedInLast24h = false;

     if (dateString) {
       const parsedDate = new Date(dateString);
       if (!isNaN(parsedDate)) {
         releaseTimestamp = parsedDate.getTime();
         const now = Date.now();
         const diffHours = (now - releaseTimestamp) / (1000 * 60 * 60);
         changedInLast24h = diffHours <= 24;
       }
     }

     return [{ json: { codename, releaseDate: dateString, releaseTimestamp, changedInLast24h } }];
     ```  
   - Connect output to If: Changed within 24h? node  

4. **Create If Node: Changed within 24h?**  
   - Type: `if`  
   - Condition: Check if `changedInLast24h` is true (Boolean equals true)  
   - True branch connects to Update package lists node  
   - False branch ends workflow  

5. **Create SSH Node: Update package lists**  
   - Type: `ssh`  
   - Command: `apt-get --allow-releaseinfo-change update`  
   - Working directory: `/root`  
   - Authentication: Private Key (configure SSH credentials with private key for the UniFi host)  
   - Connect output to Upgrade UniFi node  

6. **Create SSH Node: Upgrade UniFi**  
   - Type: `ssh`  
   - Command: `apt-get upgrade -y unifi`  
   - Working directory: `/root`  
   - Authentication: Private Key (reuse SSH credentials)  
   - Connect output to Message a model node  

7. **Create OpenAI Node: Message a model**  
   - Type: `@n8n/n8n-nodes-langchain.openAi`  
   - Model: GPT-4.1-NANO  
   - Messages (system or user prompt):  
     ```
     Please concisely summarize the performed UniFi update and what's new in this release.

     Codename: {{ $('Extract Codename + Date + Time Comparison').item.json.codename }}
     Release date: {{ $('Extract Codename + Date + Time Comparison').item.json.releaseDate }}

     apt-get update exit code: {{ $('Update package lists').item.json.code }}
     apt-get upgrade exit code/stdout: {{ $('Upgrade UniFi').item.json.code }} / {{ $('Upgrade UniFi').item.json.stdout }}
     ```  
   - Connect output to Notify via Telegram node  

8. **Create Telegram Node: Notify via Telegram**  
   - Type: `telegram`  
   - Chat ID: Set to `{{$env.TELEGRAM_CHAT_ID}}` (make sure environment variable is set)  
   - Text (Markdown enabled):  
     ```
     UniFi package updated:
     {{ $json.message && $json.message.content ? $json.message.content : 'Upgrade finished.' }}
     [Web interface](https://unifi.ui.com)
     ```  
   - Credentials: Configure Telegram Bot API credentials with OAuth2 or token  
   - No output (end of workflow)  

9. **Add Sticky Notes (Optional for Documentation):**  
   - Create at appropriate positions with content as in the original workflow for clarity and maintenance.  

10. **Set Workflow Settings:**  
    - Execution order: default (v1)  
    - Activate workflow if desired  

---

### 5. General Notes & Resources

| Note Content                                                                                                  | Context or Link                                     |
|---------------------------------------------------------------------------------------------------------------|----------------------------------------------------|
| Requires SSH private key credentials configured in n8n for the UniFi Controller host with appropriate access | SSH Node authentication configuration              |
| Environment variable TELEGRAM_CHAT_ID must be set with the target Telegram chat ID                            | Telegram notification setup                          |
| Telegram node requires valid Telegram Bot API credentials                                                    | Telegram Bot creation and token acquisition         |
| UniFi Controller web interface accessible at https://unifi.ui.com                                            | Provided in notification message                     |
| The workflow depends on the UniFi Debian repository's InRelease file structure and fields                      | https://dl.ui.com/unifi/debian/dists/stable/InRelease |
| Uses OpenAI GPT-4.1-NANO model for summary generation; ensure API credentials configured in n8n               | OpenAI API usage                                     |

---

**Disclaimer:**  
The provided text is exclusively derived from an automated workflow created with n8n, an integration and automation tool. This processing strictly respects current content policies and contains no illegal, offensive, or protected material. All handled data is legal and publicly available.