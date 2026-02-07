API Uptime Monitoring with WhatsApp Alerts & Google Sheets Management

https://n8nworkflows.xyz/workflows/api-uptime-monitoring-with-whatsapp-alerts---google-sheets-management-6747


# API Uptime Monitoring with WhatsApp Alerts & Google Sheets Management

### 1. Workflow Overview

This workflow automates API uptime monitoring by periodically checking a list of APIs, retrying failed requests, and sending WhatsApp alerts if an API is confirmed down. It manages the API list through Google Sheets and incorporates retry logic with delays. The workflow is tailored for scenarios where continuous API availability is critical and rapid incident notification via WhatsApp is desired.

Logical blocks:

- **1.1 Scheduling & Input Loading**: Trigger every 15 minutes → read API list from Google Sheets → split list for individual processing.
- **1.2 API Testing & Retry Logic**: Initialize retry counters → send initial API request → check response → if no response, wait and retry once → evaluate retry response → decide whether to alert or continue.
- **1.3 Alerting & Continuation**: Format alert message → send WhatsApp alert → proceed to next API.
- **1.4 Control Flow & Looping**: Manage continuation through APIs and retries with conditional branching and wait nodes.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduling & Input Loading

- **Overview:**  
Triggers the workflow every 15 minutes, reads the list of APIs to monitor from a Google Sheet, and splits the list to process each API individually.

- **Nodes Involved:**  
  - Schedule Trigger  
  - Read API List  
  - Process Each API1  

- **Node Details:**

1. **Schedule Trigger**  
   - *Type & Role:* Schedule Trigger node; initiates workflow periodically.  
   - *Config:* Interval set to every 15 minutes.  
   - *Input/Output:* No input; outputs trigger event to "Read API List".  
   - *Failures:* Rare; issues could arise if n8n scheduler malfunctions.  
   
2. **Read API List**  
   - *Type & Role:* Google Sheets node; reads the API monitoring list from a specific sheet.  
   - *Config:* Reads from Sheet1 (gid=0) of Google Sheets document with ID "1VKlDZSHicdZhhj-fl-vIIH0mC6VDwdCS4-LqaDIeyw0". Uses OAuth2 credentials named "Google Sheets account".  
   - *Input/Output:* Receives trigger from Schedule Trigger; outputs array of API data objects to "Process Each API1".  
   - *Failures:* Possible authentication errors, connectivity issues, or sheet access permission errors.  
   
3. **Process Each API1**  
   - *Type & Role:* SplitInBatches node; splits the API list so each API is processed separately.  
   - *Config:* Default batch size (1) to handle APIs one by one.  
   - *Input/Output:* Accepts array from Read API List; outputs one API data object at a time to "Init Retry Counter".  
   - *Failures:* Minimal; issues if input data is malformed or empty.

---

#### 2.2 API Testing & Retry Logic

- **Overview:**  
Manages API availability checks with retry attempts. Initializes retry counter, sends requests, evaluates responses, and decides on retrying or proceeding.

- **Nodes Involved:**  
  - Init Retry Counter  
  - Test API  
  - Check Response  
  - If No Response  
  - Wait 10 Min  
  - Increment Retry  
  - Retry API  
  - Check Retry Response  
  - If Still No Response  
  - If Still No Retry > 4  

- **Node Details:**

1. **Init Retry Counter**  
   - *Type & Role:* Code node; initializes `retryCount` to 0 if not present.  
   - *Config:* Runs JavaScript code to add or confirm `retryCount` property in data.  
   - *Input/Output:* Receives single API object; outputs augmented object to "Test API".  
   - *Failures:* Expression errors if input is malformed.  
   
2. **Test API**  
   - *Type & Role:* HTTP Request node; sends initial API request to the URL specified in the JSON data.  
   - *Config:* HTTP method and URL extracted dynamically from input data fields (`url`, `method`). Timeout set to 10 seconds. Sends "Content-Type: application/json" header. Continues workflow even if request fails (continueOnFail=true).  
   - *Input/Output:* Receives API data; outputs HTTP response JSON to "Check Response".  
   - *Failures:* Network errors, timeouts, invalid URLs, or unexpected HTTP responses.  
   
3. **Check Response**  
   - *Type & Role:* Code node; checks if the API responded with data.  
   - *Config:* Checks that response is a non-empty object; sets `hasResponse` boolean flag accordingly. Uses `retryCount` from previous node.  
   - *Input/Output:* Receives HTTP response; outputs combined API data + `hasResponse` flag to "If No Response".  
   - *Failures:* Expression errors if response is not JSON or empty.  
   
4. **If No Response**  
   - *Type & Role:* If node; branches logic based on `hasResponse` flag.  
   - *Config:* Condition checks if `hasResponse` is false.  
   - *Input/Output:* If false → "Wait 10 Min" node (retry flow). If true → "Continue Next API".  
   - *Failures:* Condition evaluation issues if flag missing.  
   
5. **Wait 10 Min**  
   - *Type & Role:* Wait node; pauses workflow for 10 minutes before retry.  
   - *Config:* Default wait time of 10 minutes.  
   - *Input/Output:* Receives from "If No Response"; outputs to "Increment Retry".  
   - *Failures:* Minimal; workflow timeout considerations.  
   
6. **Increment Retry**  
   - *Type & Role:* Code node; increments `retryCount` by 1.  
   - *Config:* JavaScript increments the retry counter in the JSON data.  
   - *Input/Output:* Receives data; outputs incremented retry count to "Retry API".  
   - *Failures:* Errors if `retryCount` missing or non-numeric.  
   
7. **Retry API**  
   - *Type & Role:* HTTP Request node; retries API call with same settings as initial test.  
   - *Config:* Same dynamic URL and method as "Test API". Timeout 10 seconds. Continues on fail.  
   - *Input/Output:* Receives data; outputs retry response to "Check Retry Response".  
   - *Failures:* Similar to initial request failures.  
   
8. **Check Retry Response**  
   - *Type & Role:* Code node; evaluates retry response validity same as initial check.  
   - *Config:* Sets `hasResponse` flag based on retry response content.  
   - *Input/Output:* Outputs data to "If Still No Response".  
   - *Failures:* Same as initial response check.  
   
9. **If Still No Response**  
   - *Type & Role:* If node; branches based on retry success and retry count.  
   - *Config:* Checks if still no response (`hasResponse` false).  
   - *Input/Output:* If still false → "If Still No Retry > 4". Else → "Continue Next API".  
   - *Failures:* Condition evaluation errors if data invalid.  
   
10. **If Still No Retry > 4**  
    - *Type & Role:* If node; check if retry count is >= 4 to decide alert or wait again.  
    - *Config:* Condition `retryCount >= 4`.  
    - *Input/Output:* If true → "Format Down Alert" (send alert); if false → "Wait 10 Min" (retry loop).  
    - *Failures:* Logic errors if `retryCount` missing.

---

#### 2.3 Alerting & Continuation

- **Overview:**  
Formats the alert message for WhatsApp and sends it, then moves to the next API.

- **Nodes Involved:**  
  - Format Down Alert  
  - Send WhatsApp Alert  
  - Continue Next API  

- **Node Details:**

1. **Format Down Alert**  
   - *Type & Role:* Code node; generates a formatted string alert including API name, URL, and timestamp.  
   - *Config:* Constructs message with emojis and ISO timestamp string.  
   - *Input/Output:* Receives API data; outputs enriched data with `alertMessage` to "Send WhatsApp Alert".  
   - *Failures:* Expression errors if input data missing fields.  
   
2. **Send WhatsApp Alert**  
   - *Type & Role:* WhatsApp node; sends the alert message via WhatsApp API.  
   - *Config:* Sends `alertMessage` text body to a fixed recipient phone number (+919974388925) using phoneNumberId "550325331503475". Credentials from WhatsApp API named "WhatsApp account API".  
   - *Input/Output:* Receives alert data; outputs to "Continue Next API".  
   - *Failures:* Authentication errors, API rate limits, wrong phone number format, or WhatsApp API downtime.  
   
3. **Continue Next API**  
   - *Type & Role:* Code node; resets retry count if response received and signals to continue with next API in the list.  
   - *Config:* Resets retryCount to 0 if `hasResponse` is true; passes data back to "Process Each API1" to process next batch item.  
   - *Input/Output:* Accepts data from multiple branches; outputs to "Process Each API1".  
   - *Failures:* Logic errors if input data malformed.

---

#### 2.4 Control Flow & Looping

- **Overview:**  
Manages looping through APIs and retry attempts, ensuring that the workflow continues correctly without infinite loops.

- **Nodes Involved:**  
  - Process Each API1 (second output)  
  - Continue Next API  
  - Schedule Trigger  

- **Node Details:**

1. **Process Each API1** (second output)  
   - *Type & Role:* SplitInBatches node; accepts data from "Continue Next API" to proceed to the next API in the batch. This ensures sequential processing.  
   - *Config:* No special config; controls batch flow.  
   - *Input/Output:* Receives from Continue Next API; outputs to Init Retry Counter.  
   - *Failures:* Batch state corruption if input data incorrect.  
   
2. **Continue Next API** (described above)  
   - Bridges retry success/failure branches back to batch processing.  
   
3. **Schedule Trigger** (described above)  
   - Initiates workflow every 15 minutes, ensuring periodic checks.

---

### 3. Summary Table

| Node Name           | Node Type           | Functional Role                          | Input Node(s)           | Output Node(s)              | Sticky Note                                                     |
|---------------------|---------------------|----------------------------------------|------------------------|-----------------------------|----------------------------------------------------------------|
| Schedule Trigger     | Schedule Trigger    | Initiates workflow every 15 minutes    |                        | Read API List               | ## How It Works * Schedule Trigger → Triggers every 15 minutes. |
| Read API List       | Google Sheets       | Reads API list from Google Sheet       | Schedule Trigger       | Process Each API1           | * Read API List → Fetches all API URLs from a Google Sheet.     |
| Process Each API1   | SplitInBatches      | Splits API list for individual processing | Read API List, Continue Next API | Init Retry Counter, (second output to Init Retry Counter) | * Process Each API1 → Loops through each API entry.              |
| Init Retry Counter  | Code                | Initializes retry count to 0            | Process Each API1      | Test API                   | * Init Retry Counter → Initializes `retryCount = 0`.            |
| Test API            | HTTP Request        | Sends initial API request               | Init Retry Counter     | Check Response             | * Test API → Sends the first request to the API.                |
| Check Response      | Code                | Checks if API responded                  | Test API               | If No Response             | * Check Response → Checks if a valid response was received.     |
| If No Response      | If                  | Branch if no response                    | Check Response         | Wait 10 Min, Continue Next API | * If No Response → Branches into retry flow if down.             |
| Wait 10 Min         | Wait                | Waits 10 minutes before retry            | If No Response, If Still No Retry > 4 | Increment Retry, Retry API | * Wait 10 Min → Increment Retry → Retry API → Check Retry Response. |
| Increment Retry     | Code                | Increments retry counter                 | Wait 10 Min            | Retry API                  |                                                                |
| Retry API           | HTTP Request        | Sends retry API request                  | Increment Retry        | Check Retry Response       |                                                                |
| Check Retry Response| Code                | Checks retry response                     | Retry API              | If Still No Response       |                                                                |
| If Still No Response| If                  | Branch if retry also failed               | Check Retry Response   | If Still No Retry > 4, Continue Next API |                                                                |
| If Still No Retry > 4| If                 | Checks if retry count >= 4                | If Still No Response   | Format Down Alert, Wait 10 Min |                                                                |
| Format Down Alert   | Code                | Formats WhatsApp alert message            | If Still No Retry > 4  | Send WhatsApp Alert        | * Format Down Alert → Formats the WhatsApp alert with API details. |
| Send WhatsApp Alert | WhatsApp            | Sends API down alert message              | Format Down Alert      | Continue Next API          | * Send WhatsApp Alert → Sends API down alert to configured number. |
| Continue Next API   | Code                | Resets retry counter and continues next API | Send WhatsApp Alert, If No Response, If Still No Response | Process Each API1 | * Continue Next API → Moves to next API in list.                |
| Sticky Note        | Sticky Note         | Documentation of workflow logic           |                        |                             | ## How It Works * Full process description inside note.         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node**  
   - Set to run every 15 minutes.  
   - No credentials needed.

2. **Add a Google Sheets node ("Read API List")**  
   - Connect from Schedule Trigger.  
   - Configure OAuth2 credentials for Google Sheets access.  
   - Set Document ID to "1VKlDZSHicdZhhj-fl-vIIH0mC6VDwdCS4-LqaDIeyw0".  
   - Select Sheet1 (gid=0).  
   - Leave filters empty to read all rows.

3. **Add a SplitInBatches node ("Process Each API1")**  
   - Connect from "Read API List".  
   - Default batch size (1).  
   - Configure second output (for resuming batch) as needed.

4. **Create a Code node ("Init Retry Counter")**  
   - Connect from "Process Each API1".  
   - Use JavaScript to check if `retryCount` exists; if not, set to 0:  
   ```js
   const apiData = $json;
   if (!apiData.retryCount) {
     apiData.retryCount = 0;
   }
   return apiData;
   ```
   
5. **Create an HTTP Request node ("Test API")**  
   - Connect from "Init Retry Counter".  
   - Method and URL set dynamically:  
     - URL: `{{$json.url}}`  
     - Method: `{{$json.method}}`  
   - Headers: Content-Type: application/json  
   - Timeout: 10000 ms  
   - Enable "Continue On Fail".

6. **Create a Code node ("Check Response")**  
   - Connect from "Test API".  
   - JavaScript to check if response contains any keys:  
   ```js
   const response = $json;
   const apiData = $('Init Retry Counter').first().json;
   let hasResponse = response && typeof response === 'object' && Object.keys(response).length > 0;
   return {
     ...apiData,
     hasResponse: hasResponse
   };
   ```

7. **Add an If node ("If No Response")**  
   - Connect from "Check Response".  
   - Condition: `hasResponse == false` (boolean operation).  
   - True branch → "Wait 10 Min" node.  
   - False branch → "Continue Next API" node.

8. **Create a Wait node ("Wait 10 Min")**  
   - Connect from "If No Response" true output.  
   - Wait for 10 minutes.

9. **Create a Code node ("Increment Retry")**  
   - Connect from "Wait 10 Min".  
   - Increment retry count:  
   ```js
   const data = $json;
   data.retryCount = (data.retryCount || 0) + 1;
   return data;
   ```

10. **Create an HTTP Request node ("Retry API")**  
    - Connect from "Increment Retry".  
    - Same config as "Test API": dynamic URL, method, headers, timeout, continue on fail.

11. **Create a Code node ("Check Retry Response")**  
    - Connect from "Retry API".  
    - Same logic as "Check Response" but uses data from "Increment Retry":  
    ```js
    const response = $json;
    const apiData = $('Increment Retry').first().json;
    let hasResponse = response && typeof response === 'object' && Object.keys(response).length > 0;
    return {
      ...apiData,
      hasResponse: hasResponse
    };
    ```

12. **Add an If node ("If Still No Response")**  
    - Connect from "Check Retry Response".  
    - Condition: `hasResponse == false`.  
    - True branch → "If Still No Retry > 4" node.  
    - False branch → "Continue Next API".

13. **Add an If node ("If Still No Retry > 4")**  
    - Connect from "If Still No Response" true output.  
    - Condition: `retryCount >= 4`.  
    - True branch → "Format Down Alert".  
    - False branch → "Wait 10 Min" (loop retry).

14. **Create a Code node ("Format Down Alert")**  
    - Connect from "If Still No Retry > 4" true output.  
    - Format alert message:  
    ```js
    const api = $json;
    const alertMessage = `🚨 API DOWN ALERT\n\n📋 ${api.name}\n🌐 ${api.url}\n⏰ ${new Date().toISOString()}`;
    return {
      ...api,
      alertMessage: alertMessage
    };
    ```

15. **Add a WhatsApp node ("Send WhatsApp Alert")**  
    - Connect from "Format Down Alert".  
    - Set operation to "send".  
    - Text body: `{{$json.alertMessage}}`.  
    - PhoneNumberId: "550325331503475".  
    - Recipient phone number: "+919974388925".  
    - Configure WhatsApp API credentials ("WhatsApp account API").

16. **Create a Code node ("Continue Next API")**  
    - Connect from "Send WhatsApp Alert", "If No Response" false branch, and "If Still No Response" false branch.  
    - Reset retryCount if response present and return data:  
    ```js
    const data = $json;
    if (data.hasResponse) {
      data.retryCount = 0;
    }
    return data;
    ```
    - Connect output to second output of "Process Each API1" to continue batch processing.

---

### 5. General Notes & Resources

| Note Content                                                                                                              | Context or Link                                                                                         |
|---------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| Workflow uses Google Sheets as source of monitored APIs for easy management without changing workflow                      | Google Sheets document ID: 1VKlDZSHicdZhhj-fl-vIIH0mC6VDwdCS4-LqaDIeyw0                                |
| WhatsApp alerts ensure instant notification of API downtime with rich formatted messages                                   | WhatsApp API credentials required; ensure phone number and phoneNumberId are correctly set             |
| Retry logic includes a 10-minute wait and up to 4 retries before alerting to reduce false positives                       | Helps avoid transient network issues triggering alerts                                                |
| The workflow is designed for n8n version supporting typeVersion 4.2 nodes and uses OAuth2 credentials for Google APIs      | Verify n8n instance version compatibility                                                             |
| Sticky Note in workflow provides a concise process flow description for quick understanding                                | Visible in editor, useful for onboarding and maintenance                                              |

---

**Disclaimer:** The text above is generated from an automated n8n workflow export. All data processed complies with applicable content policies and is legal and public.