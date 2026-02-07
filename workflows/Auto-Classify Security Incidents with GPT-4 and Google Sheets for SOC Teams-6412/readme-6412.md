Auto-Classify Security Incidents with GPT-4 and Google Sheets for SOC Teams

https://n8nworkflows.xyz/workflows/auto-classify-security-incidents-with-gpt-4-and-google-sheets-for-soc-teams-6412


# Auto-Classify Security Incidents with GPT-4 and Google Sheets for SOC Teams

---

### 1. Workflow Overview

This workflow automates the classification of security incidents for Security Operations Center (SOC) teams by leveraging GPT-4 and Google Sheets. Its primary purpose is to periodically read new security alerts from a Google Sheet, classify these alerts using an AI model (GPT-4), format the classification tags, and then write the enriched data back to another Google Sheet for further analysis or tracking.

The workflow logic is divided into the following functional blocks:

- **1.1 Scheduled Trigger and Data Retrieval:** Periodically initiates the workflow and reads security alert data from Google Sheets.
- **1.2 AI-Based Incident Classification:** Sends alert data to GPT-4 for classification and receives structured classification results.
- **1.3 Tag Formatting and Data Output:** Formats the AI-generated tags and writes the classified incident data back to Google Sheets.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Trigger and Data Retrieval

- **Overview:**  
This block triggers the workflow on a schedule and reads raw security alerts from a Google Sheet, serving as the input data source for classification.

- **Nodes Involved:**  
  - Schedule Trigger  
  - 📄 Google Sheets - Read Alerts

- **Node Details:**

  - **Schedule Trigger**  
    - *Type and Role:* Triggers the workflow at configured intervals.  
    - *Configuration:* Default scheduling parameters (not specified in JSON) likely set to run periodically (e.g., hourly or daily).  
    - *Key Expressions/Variables:* None.  
    - *Input/Output:* No inputs; outputs to "📄 Google Sheets - Read Alerts".  
    - *Version:* 1.2  
    - *Potential Failures:* Misconfiguration of schedule, system downtime.  
    - *Sub-workflow:* None.

  - **📄 Google Sheets - Read Alerts**  
    - *Type and Role:* Reads incident alert data from a specified Google Sheet.  
    - *Configuration:* Uses Google Sheets credentials; configured to read rows from a defined sheet and range (specifics not included in JSON).  
    - *Key Expressions/Variables:* Likely uses dynamic range or filters to read new/unprocessed alerts.  
    - *Input/Output:* Input from Schedule Trigger; outputs incident data to "🧠 Classify Incident (GPT)".  
    - *Version:* 1  
    - *Potential Failures:* Authentication errors, API rate limits, empty or malformed sheet data.  
    - *Sub-workflow:* None.

---

#### 1.2 AI-Based Incident Classification

- **Overview:**  
This block sends the raw incident alert data to the GPT-4 API via HTTP Request for classification, receiving structured tags or categories describing the security incident.

- **Nodes Involved:**  
  - 🧠 Classify Incident (GPT)

- **Node Details:**

  - **🧠 Classify Incident (GPT)**  
    - *Type and Role:* HTTP Request node configured to call the GPT-4 API endpoint.  
    - *Configuration:*  
      - Method: POST  
      - Authentication: Likely uses an API key or OAuth (not detailed in JSON)  
      - Request Body: Sends the security alert text with instructions to classify the incident.  
      - Headers: Content-Type application/json, Authorization bearer token.  
    - *Key Expressions/Variables:* Uses input data from previous node to construct the prompt for GPT-4.  
    - *Input/Output:* Receives raw alert data from "📄 Google Sheets - Read Alerts"; outputs classified results to "✏️ Format Tags".  
    - *Version:* 4.2  
    - *Potential Failures:* Network timeout, API quota exceeded, malformed prompts, authentication errors.  
    - *Sub-workflow:* None.

---

#### 1.3 Tag Formatting and Data Output

- **Overview:**  
This block formats the classification tags for consistency and writes the enriched incident data back to Google Sheets for SOC teams to review or integrate with other systems.

- **Nodes Involved:**  
  - ✏️ Format Tags  
  - Google Sheets

- **Node Details:**

  - **✏️ Format Tags**  
    - *Type and Role:* Set node used to transform or standardize classification tags from GPT output.  
    - *Configuration:* Likely uses expressions or static values to clean or restructure tags (e.g., trimming whitespace, formatting arrays to strings).  
    - *Key Expressions/Variables:* May use JSON or string manipulation expressions based on GPT response format.  
    - *Input/Output:* Input from "🧠 Classify Incident (GPT)"; outputs to "Google Sheets".  
    - *Version:* 1  
    - *Potential Failures:* Expression errors if GPT output format changes, missing or unexpected data.  
    - *Sub-workflow:* None.

  - **Google Sheets**  
    - *Type and Role:* Writes the formatted classification data back to a Google Sheet.  
    - *Configuration:* Uses Google Sheets credentials; configured to append or update rows in a defined sheet and range.  
    - *Key Expressions/Variables:* Uses the output from "✏️ Format Tags" to populate sheet columns.  
    - *Input/Output:* Input from "✏️ Format Tags"; no further outputs.  
    - *Version:* 4.5  
    - *Potential Failures:* Authentication errors, API rate limits, sheet write conflicts.  
    - *Sub-workflow:* None.

---

### 3. Summary Table

| Node Name                   | Node Type           | Functional Role                         | Input Node(s)           | Output Node(s)          | Sticky Note |
|-----------------------------|---------------------|---------------------------------------|------------------------|-------------------------|-------------|
| Schedule Trigger             | Schedule Trigger    | Initiates workflow on schedule        | —                      | 📄 Google Sheets - Read Alerts |             |
| 📄 Google Sheets - Read Alerts | Google Sheets       | Reads raw security alerts from sheet  | Schedule Trigger       | 🧠 Classify Incident (GPT) |             |
| 🧠 Classify Incident (GPT)    | HTTP Request        | Sends alert data to GPT-4 for classification | 📄 Google Sheets - Read Alerts | ✏️ Format Tags          |             |
| ✏️ Format Tags               | Set                 | Formats AI-generated classification tags | 🧠 Classify Incident (GPT) | Google Sheets           |             |
| Google Sheets               | Google Sheets       | Writes classified incident data back to sheet | ✏️ Format Tags          | —                       |             |
| Sticky Note                 | Sticky Note         | (Empty content)                       | —                      | —                       |             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow** in n8n and name it "M4 - Incident Classifier".

2. **Add a Schedule Trigger node:**  
   - Name: `Schedule Trigger`  
   - Configure the trigger to run at the desired interval (e.g., every hour or day).  
   - Leave default settings if unsure.

3. **Add a Google Sheets node to read alerts:**  
   - Name: `📄 Google Sheets - Read Alerts`  
   - Set operation to "Read Rows".  
   - Configure credentials for Google Sheets OAuth2.  
   - Set the Spreadsheet ID and Sheet Name that contains raw security alerts.  
   - Optionally set filters or limits to read only new/unprocessed rows.

4. **Connect the Schedule Trigger output to the Google Sheets Read Alerts node input.**

5. **Add an HTTP Request node to classify incidents:**  
   - Name: `🧠 Classify Incident (GPT)`  
   - Set HTTP Method to POST.  
   - Set URL to the GPT-4 API endpoint (e.g., `https://api.openai.com/v1/chat/completions`).  
   - Under Authentication, set API Key from OpenAI credentials.  
   - In the Body Parameters, construct the prompt dynamically using the alert data from Google Sheets.  
   - Set Headers: Content-Type `application/json`, Authorization with Bearer token.  
   - Set Response Format to JSON.

6. **Connect the Google Sheets Read Alerts node output to the HTTP Request node input.**

7. **Add a Set node to format tags:**  
   - Name: `✏️ Format Tags`  
   - Use this node to parse and standardize the GPT response fields (e.g., classification tags).  
   - Use expressions to extract relevant parts of the GPT output and format them (strings, arrays, etc.).

8. **Connect the HTTP Request node output to the Set node input.**

9. **Add a Google Sheets node to write classified data:**  
   - Name: `Google Sheets`  
   - Set operation to "Append" or "Update" rows as needed.  
   - Configure Google Sheets credentials.  
   - Specify the Spreadsheet ID and Sheet Name for classified incidents.  
   - Map the formatted tags and other incident details to the appropriate columns.

10. **Connect the Set node output to the Google Sheets write node input.**

11. **Save and activate the workflow.**

---

### 5. General Notes & Resources

| Note Content                                                      | Context or Link                                      |
|------------------------------------------------------------------|-----------------------------------------------------|
| Workflow leverages GPT-4 model for natural language classification of security incidents. | Requires valid OpenAI API key and proper usage quotas. |
| Ensure Google Sheets API credentials have read/write permissions for the target spreadsheets. | Google Cloud Console and OAuth2 setup required.    |
| Consider error handling mechanisms for API limits, malformed data, or empty inputs. | n8n supports error workflows and retry settings.    |

---

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.