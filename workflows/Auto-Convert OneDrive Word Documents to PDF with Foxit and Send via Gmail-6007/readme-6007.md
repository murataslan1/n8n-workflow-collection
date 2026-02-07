Auto-Convert OneDrive Word Documents to PDF with Foxit and Send via Gmail

https://n8nworkflows.xyz/workflows/auto-convert-onedrive-word-documents-to-pdf-with-foxit-and-send-via-gmail-6007


# Auto-Convert OneDrive Word Documents to PDF with Foxit and Send via Gmail

### 1. Workflow Overview

This workflow automates the process of converting Microsoft OneDrive Word documents to PDF using Foxit PDF Services and then sending the resulting PDF via Gmail. It is designed for scenarios where documents stored in a specific OneDrive folder need to be regularly converted and distributed automatically.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception and Filtering:** Watches a specific OneDrive folder for new Word documents.
- **1.2 File Retrieval and Preparation:** Downloads the detected Word document and prepares it for upload.
- **1.3 PDF Conversion via Foxit:** Uploads the Word document to Foxit’s API, triggers conversion to PDF, polls for job completion, and downloads the converted PDF.
- **1.4 Email Delivery:** Sends the converted PDF as an email attachment via Gmail.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Filtering

**Overview:**  
This block monitors a specified OneDrive folder for new files and filters only Word documents to proceed.

**Nodes Involved:**  
- Microsoft OneDrive Trigger  
- Filter to Word  

**Node Details:**

- **Microsoft OneDrive Trigger**  
  - *Type:* Trigger node to watch a OneDrive folder.  
  - *Configuration:* Watches folder with ID `01IZFFBT44M7VRGRBPXJBJHXORCT5YINXH` every minute for new files. Uses OAuth2 credentials for Microsoft OneDrive.  
  - *Expressions:* Uses file `id` from the trigger event.  
  - *Connections:* Output connects to "Filter to Word" node.  
  - *Failure Modes:* Possible auth failure if OAuth token expires; folder ID invalid or inaccessible; network timeouts.

- **Filter to Word**  
  - *Type:* Filter node to allow only Word documents.  
  - *Configuration:* Checks if the file’s MIME type equals `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (standard Word docx MIME).  
  - *Connections:* Output connects to "Get File" node.  
  - *Failure Modes:* MIME type missing or altered; expression evaluation errors.

---

#### 2.2 File Retrieval and Preparation

**Overview:**  
Downloads the Word document from OneDrive and prepares the file data for upload to Foxit.

**Nodes Involved:**  
- Get File  
- Set File Field  

**Node Details:**

- **Get File**  
  - *Type:* OneDrive file operation node.  
  - *Configuration:* Downloads the file whose ID is obtained from the trigger node. Uses same Microsoft OneDrive OAuth2 credentials.  
  - *Connections:* Output connects to "Set File Field".  
  - *Failure Modes:* File not found or deleted before download; permission issues; network errors.

- **Set File Field**  
  - *Type:* Set node to adjust data structure.  
  - *Configuration:* Assigns the binary file data to a field named `bits`. Preserves all other existing fields.  
  - *Expressions:* Uses `data` property from previous node output.  
  - *Connections:* Output connects to "Upload to Foxit".  
  - *Failure Modes:* Data conversion errors; missing binary content.

---

#### 2.3 PDF Conversion via Foxit

**Overview:**  
Uploads the Word document to Foxit’s API, initiates PDF conversion, periodically checks conversion status, and downloads the resulting PDF once ready.

**Nodes Involved:**  
- Upload to Foxit  
- Convert to PDF  
- Check Task  
- Is the job done? (If)  
- Wait  
- Download  

**Node Details:**

- **Upload to Foxit**  
  - *Type:* HTTP Request node to upload the document.  
  - *Configuration:* POST to Foxit’s `/documents/upload` endpoint using multipart form-data with the binary file attached under the `file` parameter. Uses custom HTTP authentication credentials set for Foxit API.  
  - *Connections:* Output connects to "Convert to PDF".  
  - *Failure Modes:* Auth failure; file upload errors; payload size restrictions.

- **Convert to PDF**  
  - *Type:* HTTP Request node to start conversion.  
  - *Configuration:* POST to `/documents/create/pdf-from-word` with JSON body containing the document ID from upload response. Uses same Foxit HTTP credentials.  
  - *Connections:* Output connects to "Check Task".  
  - *Failure Modes:* API errors; invalid document ID; request format errors.

- **Check Task**  
  - *Type:* HTTP Request node to query job status.  
  - *Configuration:* GET request to `/tasks/{taskId}` using the task ID from conversion response.  
  - *Connections:* Output connects to "Is the job done?" for status evaluation.  
  - *Failure Modes:* Task ID invalid; network errors; API rate limits.

- **Is the job done?** (If)  
  - *Type:* Conditional node checking if status is `"COMPLETED"`.  
  - *Configuration:* Checks if the response field `status` equals `"COMPLETED"`.  
  - *Connections:*  
    - True branch connects to "Download" node.  
    - False branch connects to "Wait" node.  
  - *Failure Modes:* Missing or malformed status field; expression errors.

- **Wait**  
  - *Type:* Wait node to pause workflow before polling again.  
  - *Configuration:* Default wait time; no parameters specified.  
  - *Connections:* Connects back to "Is the job done?" node to re-check task status.  
  - *Failure Modes:* Workflow timeouts if task takes too long.

- **Download**  
  - *Type:* HTTP Request node to download the completed PDF document.  
  - *Configuration:* GET request to `/documents/{resultDocumentId}/download` endpoint with Foxit API credentials.  
  - *Connections:* Output connects to "Email PDF" node.  
  - *Failure Modes:* Download failures; invalid document ID; auth errors.

---

#### 2.4 Email Delivery

**Overview:**  
Sends the downloaded PDF as an email attachment using Gmail.

**Nodes Involved:**  
- Email PDF  

**Node Details:**

- **Email PDF**  
  - *Type:* Gmail node to send email.  
  - *Configuration:* Sends to `raymondcamden@gmail.com` (should be customized), with subject "New Document" and message "Enjoy your shiny PDF." Attaches the PDF file downloaded from Foxit as a binary attachment. Uses Gmail OAuth2 credentials.  
  - *Failure Modes:* Gmail API quota limits; OAuth token expiration; invalid recipient email; attachment size limits.

---

### 3. Summary Table

| Node Name               | Node Type                       | Functional Role                        | Input Node(s)              | Output Node(s)            | Sticky Note                                                       |
|-------------------------|--------------------------------|-------------------------------------|---------------------------|---------------------------|------------------------------------------------------------------|
| Microsoft OneDrive Trigger | Microsoft OneDrive Trigger      | Watches OneDrive folder for files   | —                         | Filter to Word            |                                                                  |
| Filter to Word          | Filter                         | Filters only Word documents          | Microsoft OneDrive Trigger | Get File                  |                                                                  |
| Get File                | Microsoft OneDrive             | Downloads Word document              | Filter to Word             | Set File Field            |                                                                  |
| Set File Field          | Set                           | Prepares binary data for upload      | Get File                   | Upload to Foxit           |                                                                  |
| Upload to Foxit         | HTTP Request                  | Uploads Word doc to Foxit API        | Set File Field             | Convert to PDF            | ## Foxit PDF Services<br>This block handles the integration with [Foxit PDF Services](https://developer-api.foxit.com/pdf-services/). You will need to get your own credentials to let this work. |
| Convert to PDF          | HTTP Request                  | Starts PDF conversion job             | Upload to Foxit            | Check Task                |                                                                  |
| Check Task              | HTTP Request                  | Polls status of conversion task      | Convert to PDF             | Is the job done?          |                                                                  |
| Is the job done?        | If                            | Checks if conversion is completed    | Check Task, Wait           | Download (true), Wait (false)|                                                                  |
| Wait                    | Wait                          | Pauses before re-checking status     | Is the job done? (false)   | Is the job done?          |                                                                  |
| Download                | HTTP Request                  | Downloads converted PDF               | Is the job done? (true)    | Email PDF                 |                                                                  |
| Email PDF               | Gmail                         | Sends PDF as email attachment        | Download                   | —                         |                                                                  |
| Sticky Note             | Sticky Note                   | Information about Foxit API usage    | —                         | —                         | ## Foxit PDF Services<br>This block handles the integration with [Foxit PDF Services](https://developer-api.foxit.com/pdf-services/). You will need to get your own credentials to let this work. |
| Sticky Note1            | Sticky Note                   | Setup requirements and instructions  | —                         | —                         | ## Requirements<br>This flow makes use of three things that you'll need to setup. First, is an active OneDrive account with a specific folder ID. That be a bit tricky and you *could* modify it to just use an entire account, just be careful.<br><br>Secondly, you'll need credentials for [Foxit PDF Services](https://developer-api.foxit.com/pdf-services/), there's a free trial available.<br><br>Lastly, it emails the result to a user, in this case, me, so be sure to setup your own GMail auth, and change the TO field unless you want me to get your documents. ;) |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Microsoft OneDrive Trigger node**  
   - Type: Microsoft OneDrive Trigger  
   - Configure to watch a specific folder with ID `01IZFFBT44M7VRGRBPXJBJHXORCT5YINXH`.  
   - Poll interval: every minute.  
   - Use OAuth2 credentials for your Microsoft OneDrive account.  
   - Connect output to the next node.

2. **Add Filter node ("Filter to Word")**  
   - Type: Filter  
   - Condition: `$json["mimeType"] === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"`  
   - Connect input from OneDrive Trigger.  
   - Connect output to "Get File".

3. **Add Microsoft OneDrive node ("Get File")**  
   - Operation: Download  
   - File ID: Use expression to get file ID from trigger: `{{$items("Microsoft OneDrive Trigger")[0].json.id}}`  
   - Use same OneDrive OAuth2 credentials.  
   - Connect output to "Set File Field".

4. **Add Set node ("Set File Field")**  
   - Assign new field `bits` with value from binary data `data` of previous node.  
   - Enable "Include Other Fields" to preserve metadata.  
   - Connect output to "Upload to Foxit".

5. **Add HTTP Request node ("Upload to Foxit")**  
   - Method: POST  
   - URL: `https://na1.fusion.foxit.com/pdf-services/api/documents/upload`  
   - Authentication: Select or create HTTP Custom Auth credentials for Foxit API.  
   - Body content type: multipart-form-data  
   - Add form parameter named `file` with type `formBinaryData` and input data field name `data`.  
   - Connect output to "Convert to PDF".

6. **Add HTTP Request node ("Convert to PDF")**  
   - Method: POST  
   - URL: `https://na1.fusion.foxit.com/pdf-services/api/documents/create/pdf-from-word`  
   - Authentication: Use same Foxit HTTP Custom Auth credentials.  
   - Body: JSON with field `"documentId": "{{ $json.documentId }}"` (use expression to get documentId from upload response).  
   - Set "Send Body" to true and body format to JSON.  
   - Connect output to "Check Task".

7. **Add HTTP Request node ("Check Task")**  
   - Method: GET  
   - URL: `https://na1.fusion.foxit.com/pdf-services/api/tasks/{{$json.taskId}}` (expression to use taskId from convert response).  
   - Authentication: Foxit HTTP Custom Auth credentials.  
   - Connect output to "Is the job done?".

8. **Add If node ("Is the job done?")**  
   - Condition: Check if `$json.status === "COMPLETED"`  
   - True branch connects to "Download" node.  
   - False branch connects to "Wait" node.

9. **Add Wait node ("Wait")**  
   - Default wait time (e.g., 30 seconds or as preferred).  
   - Connect output back to "Is the job done?" node to re-check status.

10. **Add HTTP Request node ("Download")**  
    - Method: GET  
    - URL: `https://na1.fusion.foxit.com/pdf-services/api/documents/{{ $json.resultDocumentId }}/download` (expression to get resultDocumentId from task completion response).  
    - Authentication: Foxit HTTP Custom Auth credentials.  
    - Connect output to "Email PDF".

11. **Add Gmail node ("Email PDF")**  
    - Operation: Send Email  
    - Send To: Your email address (change from default).  
    - Subject: "New Document"  
    - Message: "Enjoy your shiny PDF."  
    - Attachments: Use binary data from "Download" node.  
    - Authentication: Set up Gmail OAuth2 credentials.  
    - This node is the final step.

12. **Optional: Add Sticky Notes**  
    - Add informational sticky notes as per the original workflow describing the Foxit API integration and setup requirements.

---

### 5. General Notes & Resources

| Note Content | Context or Link |
|--------------|----------------|
| This workflow integrates with [Foxit PDF Services API](https://developer-api.foxit.com/pdf-services/) requiring registration and credentials. A free trial is available. | Foxit PDF Services official API documentation |
| Requires setup of Microsoft OneDrive OAuth2 credentials with appropriate folder access. Folder ID must be obtained carefully from OneDrive. | Microsoft OneDrive API docs |
| Gmail OAuth2 credentials needed to send email with attachments. Be sure to use your own email and credentials to avoid privacy issues. | Gmail API OAuth2 setup |
| Original creator’s email (`raymondcamden@gmail.com`) is used as default recipient; change it before deployment. | Privacy consideration |
| The workflow polls Foxit API task status and waits if conversion is not finished, handle possible long-running task failures or timeouts accordingly. | Workflow stability note |

---

**Disclaimer:**  
The text provided originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and publicly accessible.