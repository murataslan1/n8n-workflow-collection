Automate n8n Updates with Version Checking and Portainer Webhook

https://n8nworkflows.xyz/workflows/automate-n8n-updates-with-version-checking-and-portainer-webhook-7061


# Automate n8n Updates with Version Checking and Portainer Webhook

---

### 1. Workflow Overview

This workflow automates the update process for an n8n instance by periodically checking for the latest available n8n version on npm and comparing it to the locally installed version extracted from the instance’s metrics endpoint. If a new version is detected, it triggers a Portainer webhook to initiate the update process on the container stack.

The workflow is logically divided into the following blocks:

- **1.1 Scheduled Trigger**: Periodically initiates the version check every 16 hours.
- **1.2 Fetch Latest n8n Version**: Retrieves the most recent n8n version published on npm.
- **1.3 Fetch Local n8n Version**: Obtains the currently installed n8n version by querying the local metrics endpoint and extracting the version.
- **1.4 Version Comparison & Conditional Branching**: Compares the latest and local versions; if they differ, proceeds to trigger the update.
- **1.5 Update Trigger via Portainer Webhook**: Sends a POST request to a Portainer webhook URL to start the update.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Trigger

- **Overview:**  
  Initiates the workflow on a fixed schedule: every 16 hours at minute 8.

- **Nodes Involved:**  
  - Schedule Trigger

- **Node Details:**  
  - **Schedule Trigger**  
    - Type: Schedule Trigger node  
    - Configuration: Executes every 16 hours, precisely at 8 minutes past the hour (e.g., 00:08, 16:08, 32:08, etc.)  
    - Input: None (trigger node)  
    - Output: Starts the workflow chain connected to "Get the latest n8n version"  
    - Failure Modes: None expected; however, workflow execution may be delayed if n8n instance is paused or down.

---

#### 2.2 Fetch Latest n8n Version

- **Overview:**  
  Queries the npm registry API to fetch metadata about the latest published n8n version.

- **Nodes Involved:**  
  - Get the latest n8n version

- **Node Details:**  
  - **Get the latest n8n version**  
    - Type: HTTP Request node  
    - Configuration:  
      - Method: GET  
      - URL: https://registry.npmjs.org/n8n/latest  
      - Returns only the JSON body (fullResponse: false)  
    - Input: Triggered by Schedule Trigger  
    - Output: JSON object containing the latest n8n release metadata, including the "version" field  
    - Failure Modes: Network errors, npm API downtime, response format changes may cause failures or unexpected data  
    - Notes: Relies on npm registry stability and availability  

---

#### 2.3 Fetch Local n8n Version

- **Overview:**  
  Accesses the local n8n instance’s metrics endpoint to extract the currently installed version using regex parsing on returned metrics text.

- **Nodes Involved:**  
  - Get local n8n metrics  
  - local n8n version

- **Node Details:**  
  - **Get local n8n metrics**  
    - Type: HTTP Request node  
    - Configuration:  
      - Method: GET  
      - URL: https://127.0.0.1/metrics  
      - Allow Unauthorized Certificates: Enabled (true) to accept self-signed certs on localhost  
    - Input: Receives output from "Get the latest n8n version" node  
    - Output: Raw metrics text from local n8n metrics endpoint  
    - Failure Modes:  
      - Connection refused if n8n is not running locally or metrics endpoint disabled  
      - TLS errors if certificate config changes  
      - Timeout or network issues on localhost  
  - **local n8n version**  
    - Type: Code node (JavaScript)  
    - Configuration:  
      - Parses the input text data using regex: `n8n_version_info{...version="vX.X.X"...}`  
      - Extracts the version string, strips leading 'v' character to normalize to semantic version format  
      - Throws an error if version info is not found in the metrics output  
    - Input: Receives raw text from "Get local n8n metrics"  
    - Output: JSON with `{ versionCli: "<installed_version>" }`  
    - Failure Modes:  
      - Regex match failure if metrics format changes or version string missing  
      - Upstream HTTP request failure propagates here  
      - Script errors if unexpected input format  

---

#### 2.4 Version Comparison & Conditional Branching

- **Overview:**  
  Compares the installed n8n version to the latest npm version. If the versions differ, it triggers the update process.

- **Nodes Involved:**  
  - If

- **Node Details:**  
  - **If**  
    - Type: If node (conditional branching)  
    - Configuration:  
      - Compares:  
        - Left value: Latest version from npm (`$('Get the latest n8n version').item.json.version`)  
        - Right value: Local installed version from `local n8n version` node (`$json.versionCli`)  
      - Operation: string notEquals (case sensitive, strict validation)  
    - Input: Receives installed version JSON from "local n8n version"  
    - Output:  
      - True branch: If versions differ → proceed to "Portainer Webhook" node  
      - False branch: No output (workflow ends)  
    - Failure Modes:  
      - Expression evaluation errors if referenced nodes fail or produce missing data  
      - Version string format inconsistencies causing false positives/negatives  

---

#### 2.5 Update Trigger via Portainer Webhook

- **Overview:**  
  Sends a POST request to a predefined Portainer webhook URL to initiate the n8n container stack update.

- **Nodes Involved:**  
  - Portainer Webhook

- **Node Details:**  
  - **Portainer Webhook**  
    - Type: HTTP Request node  
    - Configuration:  
      - Method: POST  
      - URL: https://portainer.tld.com/api/stacks/webhooks/606e8503-8824-43b1-a67c-cf95abbee1a8 (user-configured)  
      - Does not allow unauthorized certificates (false)  
      - No request body or authentication configured (assumes webhook token in URL)  
    - Input: Triggered from "If" node’s true branch  
    - Output: Response from Portainer webhook call (ignored downstream)  
    - Failure Modes:  
      - Network issues or webhook URL changes cause update failure  
      - Unauthorized or expired webhook tokens  
      - Portainer API downtime or rate limiting  

---

### 3. Summary Table

| Node Name             | Node Type              | Functional Role                        | Input Node(s)              | Output Node(s)             | Sticky Note                                                                                   |
|-----------------------|------------------------|-------------------------------------|----------------------------|----------------------------|----------------------------------------------------------------------------------------------|
| Schedule Trigger      | Schedule Trigger       | Periodic workflow trigger             | —                          | Get the latest n8n version | ## Cron<br>Every 16 Hours at minute 8                                                        |
| Get the latest n8n version | HTTP Request          | Fetch latest n8n version info from npm | Schedule Trigger            | Get local n8n metrics       | ## Latest Version<br>Fetch from npmjs                                                        |
| Get local n8n metrics  | HTTP Request          | Fetch local n8n metrics endpoint       | Get the latest n8n version  | local n8n version           | ## Get Metrics<br>Fetch from local install                                                   |
| local n8n version      | Code                   | Parse installed n8n version from metrics | Get local n8n metrics       | If                         | ## Installed Version<br>Extract from metrics                                                 |
| If                    | If                     | Compare versions; detect update need   | local n8n version           | Portainer Webhook           | ## If Update available<br>Proceed with the workflow                                         |
| Portainer Webhook      | HTTP Request          | Trigger Portainer webhook to update n8n | If                         | —                          | ## Start Update<br>Using webhook, but SSH might be useful aswell                            |
| Sticky Note           | Sticky Note            | Informational (Cron schedule)          | —                          | —                          | ## Cron<br>Every 16 Hours at minute 8                                                        |
| Sticky Note1          | Sticky Note            | Informational (Latest version info)   | —                          | —                          | ## Latest Version<br>Fetch from npmjs                                                        |
| Sticky Note2          | Sticky Note            | Informational (Local metrics fetch)   | —                          | —                          | ## Get Metrics<br>Fetch from local install                                                   |
| Sticky Note3          | Sticky Note            | Informational (Installed version parse) | —                          | —                          | ## Installed Version<br>Extract from metrics                                                 |
| Sticky Note4          | Sticky Note            | Informational (Update condition)       | —                          | —                          | ## If Update available<br>Proceed with the workflow                                         |
| Sticky Note5          | Sticky Note            | Informational (Update trigger)          | —                          | —                          | ## Start Update<br>Using webhook, but SSH might be useful aswell                            |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow and name it** (e.g., "n8n-autoupdate").

2. **Add a Schedule Trigger node:**  
   - Set interval to 16 hours.  
   - Configure to trigger at minute 8 of the hour (field: hoursInterval=16, triggerAtMinute=8).  
   - This node starts the workflow.

3. **Add an HTTP Request node named "Get the latest n8n version":**  
   - Set method to GET.  
   - Set URL to `https://registry.npmjs.org/n8n/latest`.  
   - Under options, ensure "Full Response" is disabled to receive only JSON body.  
   - Connect Schedule Trigger’s output to this node’s input.

4. **Add an HTTP Request node named "Get local n8n metrics":**  
   - Set method to GET.  
   - Set URL to `https://127.0.0.1/metrics`.  
   - Enable "Allow Unauthorized Certificates" to true (accept self-signed certs).  
   - Connect "Get the latest n8n version" output to this node.

5. **Add a Code node named "local n8n version":**  
   - Set language to JavaScript.  
   - Paste the following code to parse the version from metrics text:

   ```javascript
   const text = $input.first().json.data;
   const match = text.match(/n8n_version_info\{[^}]*version="(v[\d.]+)"/);

   if (match) {
     const version = match[1].replace(/^v/, ''); // remove leading 'v'
     return [{ json: { versionCli: version } }];
   } else {
     throw new Error("Version info not found in metrics output");
   }
   ```

   - Connect "Get local n8n metrics" output to this node.

6. **Add an If node named "If":**  
   - Configure condition:  
     - Left value: Expression `={{ $('Get the latest n8n version').item.json.version }}`  
     - Operator: String "Not Equals"  
     - Right value: Expression `={{ $json.versionCli }}` (from the code node)  
     - Case sensitive: true; Type validation: strict.  
   - Connect "local n8n version" output to this node.

7. **Add an HTTP Request node named "Portainer Webhook":**  
   - Set method to POST.  
   - Set URL to your Portainer webhook URL, e.g., `https://portainer.tld.com/api/stacks/webhooks/your-webhook-id`.  
   - Ensure "Allow Unauthorized Certificates" is false unless your certificate setup requires otherwise.  
   - Connect the true output (update needed) from the "If" node to this node.

8. **Finalize connections:**  
   - Confirm the flow:  
     Schedule Trigger → Get the latest n8n version → Get local n8n metrics → local n8n version → If → Portainer Webhook.

9. **No credentials are required for these nodes by default.**  
   - The HTTP requests to npm and localhost do not require authentication.  
   - The Portainer webhook URL embeds authentication token or access control via URL.

10. **Add Sticky Notes for clarity (optional):**  
    - Add descriptive sticky notes near relevant nodes explaining their role, schedule, or parameters to aid maintenance.

---

### 5. General Notes & Resources

| Note Content                                                                                      | Context or Link                                                                                     |
|-------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| This workflow triggers an automated update of n8n using Portainer’s webhook API. SSH alternatives exist for update triggering but are not implemented here. | Workflow design consideration                                                                     |
| The local metrics endpoint is accessed via HTTPS on localhost with self-signed certs, ensure your n8n instance exposes metrics and accepts local HTTPS connections. | n8n metrics endpoint configuration                                                                |
| The npm URL `https://registry.npmjs.org/n8n/latest` is the official source for latest n8n versions. Changes in npm registry API may require workflow adjustment. | npm registry API documentation                                                                    |
| Portainer webhook URL must be generated and maintained securely in Portainer to avoid unauthorized updates. | Portainer documentation: https://docs.portainer.io/api/webhooks                                 |
| Cron scheduling uses n8n’s native Schedule Trigger; ensure n8n server time zone is considered for timing accuracy. | n8n scheduling documentation                                                                       |

---

**Disclaimer:** The provided content is extracted exclusively from an n8n workflow automation and complies with current content policies. No illegal, offensive, or protected elements are present. All handled data is legal and public.