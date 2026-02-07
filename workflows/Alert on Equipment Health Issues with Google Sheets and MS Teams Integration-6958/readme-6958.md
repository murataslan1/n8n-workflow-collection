Alert on Equipment Health Issues with Google Sheets and MS Teams Integration

https://n8nworkflows.xyz/workflows/alert-on-equipment-health-issues-with-google-sheets-and-ms-teams-integration-6958


# Alert on Equipment Health Issues with Google Sheets and MS Teams Integration

### 1. Workflow Overview

This workflow is designed to monitor equipment health by periodically fetching equipment data, evaluating critical parameters (temperature and voltage), and alerting via Microsoft Teams if thresholds are exceeded. It also archives the data by converting it into an Excel file and uploading it to Google Drive.

The workflow logically divides into the following blocks:

- **1.1 Data Retrieval:** Scheduled trigger to fetch equipment status data from an external API every 15 minutes.
- **1.2 Condition Evaluation:** Checks if equipment temperature is above 60 and voltage above 20.
- **1.3 Data Archival and Alerting:** Converts the filtered data to an Excel file, uploads it to Google Drive, and sends a Microsoft Teams chat message alert.

---

### 2. Block-by-Block Analysis

#### 2.1 Data Retrieval

- **Overview:**  
  This block initiates the workflow every 15 minutes and retrieves the latest equipment data from a REST API.

- **Nodes Involved:**  
  - Schedule Trigger for Every 15 Min  
  - HTTP Request  

- **Node Details:**  

  - **Schedule Trigger for Every 15 Min**  
    - Type: Schedule Trigger  
    - Role: Starts the workflow on a fixed interval  
    - Configuration: Triggers every 15 minutes  
    - Inputs: None (trigger node)  
    - Outputs: Connects to HTTP Request node  
    - Edge Cases: Misfire if n8n service is down or system clock changes; ensure server time is synchronized  

  - **HTTP Request**  
    - Type: HTTP Request  
    - Role: Fetch equipment data from external API  
    - Configuration:  
      - URL: `https://688c83a8cd9d22dda5cd6aec.mockapi.io/temperature_n8n/equipments`  
      - Method: GET (default)  
      - No additional headers or authentication configured  
    - Inputs: Triggered by Schedule Trigger node  
    - Outputs: Passes JSON data to the Condition check node  
    - Edge Cases:  
      - API downtime or unreachable host  
      - Unexpected response format or data schema changes  
      - Timeout or rate limiting by target API  

#### 2.2 Condition Evaluation

- **Overview:**  
  Evaluates if the equipment data indicates an alert condition by checking temperature and voltage thresholds.

- **Nodes Involved:**  
  - Condition check for Temp and voltage  

- **Node Details:**  

  - **Condition check for Temp and voltage**  
    - Type: If (Conditional)  
    - Role: Filters records where temperature > 60 AND voltage > 20  
    - Configuration:  
      - Condition combinator: AND  
      - Conditions:  
        - Temperature (`$json.temp`) > 60  
        - Voltage (`$json.voltage`) > 20  
    - Inputs: Receives data from HTTP Request node  
    - Outputs: Passes filtered data to Convert to File node  
    - Edge Cases:  
      - Missing or malformed temperature or voltage fields in input JSON  
      - Data type mismatches (e.g., strings instead of numbers) causing evaluation failure  

#### 2.3 Data Archival and Alerting

- **Overview:**  
  Converts the filtered equipment data to an Excel file, uploads it to Google Drive, and sends a message in Microsoft Teams.

- **Nodes Involved:**  
  - Convert to File  
  - Upload file  
  - Create chat message  

- **Node Details:**  

  - **Convert to File**  
    - Type: ConvertToFile  
    - Role: Converts JSON data into an Excel spreadsheet (`.xls`)  
    - Configuration:  
      - Operation: XLS format  
      - File Name: `equipment_list.xls`  
    - Inputs: Receives filtered data from Condition check node  
    - Outputs: Sends the generated file to Upload file node and Create chat message node  
    - Edge Cases:  
      - Large datasets may cause memory or timeouts  
      - Data with unsupported characters or structures might fail conversion  

  - **Upload file**  
    - Type: Google Drive  
    - Role: Uploads the Excel file to Google Drive root folder  
    - Configuration:  
      - Drive: My Drive  
      - Folder: Root (`/`)  
      - Uses OAuth2 credentials for Google Drive (`Google Drive account`)  
    - Inputs: Receives file from Convert to File node  
    - Outputs: Connects to Create chat message node  
    - Edge Cases:  
      - Credential expiration or invalid OAuth tokens  
      - Google Drive API quota limits  
      - File name conflicts or permission issues  

  - **Create chat message**  
    - Type: Microsoft Teams  
    - Role: Sends an alert message in Microsoft Teams chat  
    - Configuration:  
      - Resource: `chatMessage`  
      - Message: Empty string currently configured (likely to be dynamic or configured later)  
      - Chat ID: Configured as empty string with list mode (likely needs manual selection)  
      - Uses OAuth2 credentials for Microsoft Teams (`Microsoft Teams account`)  
    - Inputs: Receives output from Upload file node  
    - Outputs: None (final node)  
    - Edge Cases:  
      - Missing or invalid chat ID will cause failure to send message  
      - OAuth token expiration or permission issues  
      - Empty message content may result in no visible alert in Teams  

---

### 3. Summary Table

| Node Name                      | Node Type           | Functional Role                      | Input Node(s)                  | Output Node(s)                   | Sticky Note                                                                                              |
|-------------------------------|---------------------|-----------------------------------|-------------------------------|---------------------------------|---------------------------------------------------------------------------------------------------------|
| Schedule Trigger for Every 15 Min | Schedule Trigger    | Initiates workflow every 15 minutes | None                          | HTTP Request                    |                                                                                                         |
| HTTP Request                  | HTTP Request        | Fetches equipment data from API    | Schedule Trigger for Every 15 Min | Condition check for Temp and voltage |                                                                                                         |
| Condition check for Temp and voltage | If                 | Checks temp > 60 and voltage > 20  | HTTP Request                  | Convert to File                 |                                                                                                         |
| Convert to File               | ConvertToFile       | Converts filtered data to Excel file | Condition check for Temp and voltage | Upload file, Create chat message |                                                                                                         |
| Upload file                  | Google Drive        | Uploads the Excel file to Google Drive | Convert to File              | Create chat message             |                                                                                                         |
| Create chat message           | Microsoft Teams     | Sends alert message in Microsoft Teams chat | Upload file                  | None                           | The message content is empty; ensure to configure meaningful alert text and valid chat ID before use.  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node:**  
   - Type: Schedule Trigger  
   - Configure it to run every 15 minutes (set minutes interval to 15).  
   - No credentials needed.

2. **Add an HTTP Request node:**  
   - Connect input from Schedule Trigger node.  
   - Set HTTP Method to GET (default).  
   - Set URL to `https://688c83a8cd9d22dda5cd6aec.mockapi.io/temperature_n8n/equipments`.  
   - No authentication or headers needed.  
   - Ensure to handle potential API failures by adding error workflows if desired.

3. **Add an If node for condition check:**  
   - Connect input from HTTP Request node.  
   - Set combinator to AND.  
   - Add two conditions:  
     - Expression: `{{$json["temp"]}}` > 60  
     - Expression: `{{$json["voltage"]}}` > 20  
   - Use strict type validation.  
   - Route output "true" to the next node, "false" can be left unconnected or handled separately.

4. **Add a ConvertToFile node:**  
   - Connect input from the true output of the If node.  
   - Set operation to `xls` (Excel format).  
   - Set File Name to `equipment_list.xls`.  
   - No credentials needed.

5. **Add a Google Drive node:**  
   - Connect input from ConvertToFile node.  
   - Configure credentials with a valid Google Drive OAuth2 credential.  
   - Set Drive to "My Drive".  
   - Set Folder ID to root ("/").  
   - No additional options required.

6. **Add a Microsoft Teams node:**  
   - Connect input from Google Drive node.  
   - Configure credentials with a valid Microsoft Teams OAuth2 credential.  
   - Set Resource to `chatMessage`.  
   - Set Chat ID to the appropriate chat or team channel ID (must be valid and authorized).  
   - Set Message content with a meaningful alert text, e.g.,  
     `"Equipment alert: Temperature and voltage thresholds exceeded. Data uploaded to Google Drive."`  
   - Ensure OAuth scopes include permission to send chat messages.

7. **Verify connections:**  
   - Schedule Trigger → HTTP Request → If (Condition check) → ConvertToFile → Google Drive → Microsoft Teams.

8. **Test end-to-end:**  
   - Run manually or wait for scheduled trigger.  
   - Confirm data retrieval, condition evaluation, file creation, upload, and Teams message sending.

---

### 5. General Notes & Resources

| Note Content                                                                                   | Context or Link                                           |
|------------------------------------------------------------------------------------------------|-----------------------------------------------------------|
| Ensure Google Drive and Microsoft Teams OAuth2 credentials have appropriate scopes and permissions to upload files and send messages respectively. | Credential setup documentation in n8n official docs.      |
| The mock API URL is a placeholder; replace with actual equipment monitoring API endpoint.      | API endpoint replacement                                   |
| Microsoft Teams message node currently has an empty message and chatId; these must be properly configured for alerts to be sent. | Workflow configuration reminder                            |
| This workflow demonstrates a pattern for integrating IoT or equipment telemetry data with collaboration platforms and cloud storage. | Use case: Equipment Health Monitoring                      |

---

**Disclaimer:** The text provided originates exclusively from an automated workflow created using n8n, an integration and automation tool. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All data handled are legal and public.