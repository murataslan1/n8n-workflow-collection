Auto Germany Apartment Search & Apply with Immobilienscout24 & Google Services

https://n8nworkflows.xyz/workflows/auto-germany-apartment-search---apply-with-immobilienscout24---google-services-6150


# Auto Germany Apartment Search & Apply with Immobilienscout24 & Google Services

### 1. Workflow Overview

This workflow automates the process of searching for rental apartments in Germany (specifically Berlin), filtering them based on user-defined criteria, and automatically applying for suitable listings via email. It integrates with ImmobilienScout24 for apartment listings, Google Drive for retrieving personal documents (Schufa report and salary slips), and Google Sheets for logging applications. The automation runs daily at 8 AM Berlin time and is designed to streamline and expedite apartment hunting and application submission.

The workflow is logically divided into the following blocks:

- **1.1 Trigger and Configuration Setup:** Schedule execution and set user-specific search and contact parameters.
- **1.2 Location Processing:** Convert city name to ImmobilienScout24 GeoID for API queries.
- **1.3 Apartment Listing Retrieval and Filtering:** Fetch apartment listings, then filter based on rent and room count.
- **1.4 Sequential Apartment Processing:** Iterate through filtered apartments one-by-one to prepare applications.
- **1.5 Document Retrieval:** Fetch required personal documents (Schufa report, salary slips) from Google Drive.
- **1.6 Application Preparation and Submission:** Generate personalized cover letters and send application emails with attachments.
- **1.7 Application Logging:** Log each application into a Google Sheet for tracking.

---

### 2. Block-by-Block Analysis

#### 2.1 Trigger and Configuration Setup

- **Overview:**  
  This block initiates the workflow daily and sets all required configuration parameters such as city, maximum rent, room requirements, user contact information, and Google Drive/Sheet file IDs.

- **Nodes Involved:**  
  - Cron Trigger  
  - Set Config

- **Node Details:**

  - **Cron Trigger**  
    - *Type:* Cron Trigger  
    - *Role:* Starts workflow execution every day at 8 AM Berlin time.  
    - *Configuration:* No custom parameters; defaults to daily triggering at 8 AM (based on workflow timezone Europe/Berlin).  
    - *Input/Output:* No input; output triggers next node.  
    - *Potential Failures:* Cron misconfiguration or timezone issues could cause missed triggers.

  - **Set Config**  
    - *Type:* Set  
    - *Role:* Defines static user and search parameters as workflow variables.  
    - *Configuration:* Sets CITY (“Berlin”), MAX_RENT (1200), ROOMS (2), MY_EMAIL, MY_NAME, GDRIVE_SCHUFA_FILE_ID, GDRIVE_SALARY_FILE_ID, GOOGLE_SHEET_ID.  
    - *Input/Output:* Receives trigger; outputs JSON with config values.  
    - *Potential Failures:* Incorrect or missing configuration values will propagate errors downstream.

#### 2.2 Location Processing

- **Overview:**  
  Converts the configured city name into a GeoID required by ImmobilienScout24’s API.

- **Nodes Involved:**  
  - GeoID Lookup

- **Node Details:**

  - **GeoID Lookup**  
    - *Type:* Function  
    - *Role:* Maps city name to ImmobilienScout24 GeoID; defaults to Berlin if unrecognized.  
    - *Configuration:* Uses a hardcoded map (currently only Berlin supported with GeoID 12770000).  
    - *Expressions:* Reads CITY from input JSON.  
    - *Input/Output:* Input from Set Config; outputs city and geoid.  
    - *Potential Failures:* Only Berlin supported; other cities will fallback to Berlin possibly causing irrelevant results.

#### 2.3 Apartment Listing Retrieval and Filtering

- **Overview:**  
  Fetches apartment listings from ImmobilienScout24 API using GeoID and filters them by type, price, and room count.

- **Nodes Involved:**  
  - Fetch Listings From immobilienscout24  
  - Filter Results

- **Node Details:**

  - **Fetch Listings From immobilienscout24**  
    - *Type:* HTTP Request  
    - *Role:* Requests apartment listings filtered by geo-location, minimum rooms, maximum rent, and sorts by newest.  
    - *Configuration:*  
      - URL dynamically constructed using geoid, ROOMS, MAX_RENT parameters from previous nodes.  
      - Accepts JSON response.  
    - *Input/Output:* Input from GeoID Lookup; outputs JSON listings array.  
    - *Potential Failures:*  
      - API changes or rate limiting.  
      - Incorrect URL templating or missing parameters.  
      - Network timeouts.  
      - No explicit authentication—public API assumed.

  - **Filter Results**  
    - *Type:* Function  
    - *Role:* Filters listings to include only apartments with price <= MAX_RENT and rooms >= ROOMS.  
    - *Configuration:* JavaScript filter function examining item.json.type, price, and rooms.  
    - *Input/Output:* Input from HTTP Request; outputs filtered array.  
    - *Potential Failures:*  
      - Parsing errors if data structure changes.  
      - Missing fields in listings.

#### 2.4 Sequential Apartment Processing

- **Overview:**  
  Processes each filtered apartment individually to prepare and send applications one by one.

- **Nodes Involved:**  
  - Process Apartments One-by-One

- **Node Details:**

  - **Process Apartments One-by-One**  
    - *Type:* SplitInBatches  
    - *Role:* Splits apartments into batches of one to sequentially process applications.  
    - *Configuration:* batchSize = 1  
    - *Input/Output:* Input from Filter Results; outputs one apartment per batch.  
    - *Potential Failures:* Large dataset could slow processing; no parallelism.

#### 2.5 Document Retrieval

- **Overview:**  
  Retrieves applicant’s Schufa report and recent salary slips from Google Drive to attach to applications.

- **Nodes Involved:**  
  - Fetch Schufa (Google Drive)  
  - Fetch Salary Slips (Google Drive)

- **Node Details:**

  - **Fetch Schufa (Google Drive)**  
    - *Type:* Google Drive  
    - *Role:* Downloads Schufa report file using configured file ID.  
    - *Configuration:* File ID from GDRIVE_SCHUFA_FILE_ID, OAuth2 authentication.  
    - *Input/Output:* Input from Process Apartments One-by-One; outputs file binary data.  
    - *Potential Failures:*  
      - OAuth token expiration or invalid credentials.  
      - File ID missing or incorrect.  
      - Network errors.

  - **Fetch Salary Slips (Google Drive)**  
    - *Type:* Google Drive  
    - *Role:* Downloads salary slips file similarly using GDRIVE_SALARY_FILE_ID.  
    - *Configuration:* Same as above, different file ID.  
    - *Input/Output:* Input from Process Apartments One-by-One; outputs file binary data.  
    - *Potential Failures:* Same as Fetch Schufa.

#### 2.6 Application Preparation and Submission

- **Overview:**  
  Generates a personalized cover letter and sends the application email with attachments.

- **Nodes Involved:**  
  - Generate Cover Letter  
  - Send Application Email

- **Node Details:**

  - **Generate Cover Letter**  
    - *Type:* Function  
    - *Role:* Creates a personalized cover letter text referencing the apartment’s expose ID, price, rooms, and applicant’s name.  
    - *Configuration:* Uses template string with variables from apartment JSON and config values.  
    - *Input/Output:* Input from both document fetches; outputs JSON with coverLetter text.  
    - *Potential Failures:* Variables missing or undefined; string formatting issues.

  - **Send Application Email**  
    - *Type:* Email Send  
    - *Role:* Sends email to apartment contact with cover letter and attachments (Schufa and salary slips).  
    - *Configuration:*  
      - Subject includes expose ID.  
      - To email from apartment contactEmail field.  
      - From email from MY_EMAIL.  
      - Attachments linked to binary data from Google Drive nodes.  
    - *Input/Output:* Input from Generate Cover Letter; outputs success/failure.  
    - *Potential Failures:*  
      - SMTP or email service credential issues.  
      - Missing contact email.  
      - Attachment size limits.

#### 2.7 Application Logging

- **Overview:**  
  Records details of each apartment application into a Google Sheet for monitoring.

- **Nodes Involved:**  
  - Log to Google Sheet

- **Node Details:**

  - **Log to Google Sheet**  
    - *Type:* Google Sheets  
    - *Role:* Appends a new row with apartment title, address, price, current timestamp, and expose ID.  
    - *Configuration:*  
      - Range A:E  
      - Uses GOOGLE_SHEET_ID and OAuth2 authentication.  
      - Value input mode is USER_ENTERED for formatting.  
    - *Input/Output:* Input from Send Application Email; outputs log confirmation.  
    - *Potential Failures:*  
      - Google Sheets API quota limits.  
      - Incorrect sheet ID or range.  
      - Authentication errors.

---

### 3. Summary Table

| Node Name                         | Node Type         | Functional Role                               | Input Node(s)                   | Output Node(s)                     | Sticky Note                                                                                  |
|----------------------------------|-------------------|-----------------------------------------------|--------------------------------|----------------------------------|----------------------------------------------------------------------------------------------|
| Cron Trigger                     | Cron Trigger      | Triggers workflow daily at 8 AM Berlin time  | —                              | Set Config                       | Triggers the workflow every day at 8 AM Berlin time.                                         |
| Set Config                      | Set               | Sets user and search configuration parameters | Cron Trigger                   | GeoID Lookup                    | Set your configuration: city, max rent, rooms, email, file IDs etc.                          |
| GeoID Lookup                   | Function          | Maps city name to GeoID for API query         | Set Config                    | Fetch Listings From immobilienscout24 | Convert city name to GeoID needed by ImmobilienScout24 API.                                  |
| Fetch Listings From immobilienscout24 | HTTP Request     | Requests apartment listings from API          | GeoID Lookup                  | Filter Results                  | Fetch apartment listings from ImmobilienScout24 with filters applied.                        |
| Filter Results                | Function          | Filters listings by apartment, rent, rooms   | Fetch Listings From immobilienscout24 | Process Apartments One-by-One | Filter listings to only include apartments matching rent and rooms criteria.                |
| Process Apartments One-by-One    | SplitInBatches    | Processes apartments sequentially              | Filter Results                | Fetch Schufa (Google Drive), Fetch Salary Slips (Google Drive) | Process apartments one by one to send applications.                                          |
| Fetch Schufa (Google Drive)      | Google Drive      | Retrieves Schufa report file                   | Process Apartments One-by-One | Generate Cover Letter           | Fetch Schufa report from Google Drive to attach in application.                             |
| Fetch Salary Slips (Google Drive) | Google Drive      | Retrieves salary slips file                     | Process Apartments One-by-One | Generate Cover Letter           | Fetch latest salary slips from Google Drive for application.                               |
| Generate Cover Letter            | Function          | Creates personalized cover letter text        | Fetch Schufa, Fetch Salary Slips | Send Application Email        | Generate a personalized cover letter with expose ID and applicant name.                     |
| Send Application Email          | Email Send        | Sends application email with attachments      | Generate Cover Letter          | Log to Google Sheet             | Send the apartment application email with attachments.                                     |
| Log to Google Sheet             | Google Sheets     | Logs applied apartments for tracking           | Send Application Email        | —                              | Log applied apartments in Google Sheets for tracking.                                       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow in n8n. Set the workflow timezone to "Europe/Berlin".**

2. **Add a "Cron Trigger" node:**
   - Name: `Cron Trigger`
   - Set to trigger daily at 08:00 (8 AM).
   - Connect output to next node.

3. **Add a "Set" node:**
   - Name: `Set Config`
   - Define the following string parameters with your values:
     - `CITY` = "Berlin"
     - `MAX_RENT` = "1200"
     - `ROOMS` = "2"
     - `MY_EMAIL` = your email address (e.g. "your.email@example.com")
     - `MY_NAME` = your full name (e.g. "Max Mustermann")
     - `GDRIVE_SCHUFA_FILE_ID` = Google Drive file ID for your Schufa report
     - `GDRIVE_SALARY_FILE_ID` = Google Drive file ID for your salary slips
     - `GOOGLE_SHEET_ID` = Google Sheets document ID for logging
   - Connect `Cron Trigger` output to `Set Config` input.

4. **Add a "Function" node:**
   - Name: `GeoID Lookup`
   - Use the code:
     ```javascript
     const geoidMap = { Berlin: 12770000 };
     const city = $json["CITY"] || "Berlin";
     return [{ json: { city, geoid: geoidMap[city] || geoidMap["Berlin"] } }];
     ```
   - Connect `Set Config` output to this node.

5. **Add an "HTTP Request" node:**
   - Name: `Fetch Listings From immobilienscout24`
   - Method: GET
   - URL (Expression):
     ```
     https://www.immobilienscout24.de/Suche/S-T/Wohnung-Miete/Berlin/umkreis-{{$json["geoid"]}}?numberofroomsfrom={{$json["ROOMS"]}}&price=-{{$json["MAX_RENT"]}}&sorting=2
     ```
   - Headers: Accept: application/json
   - Response format: JSON
   - Connect `GeoID Lookup` output to this node.

6. **Add a "Function" node:**
   - Name: `Filter Results`
   - Code:
     ```javascript
     return items.filter(item => item.json.type === 'apartment' &&
       parseFloat(item.json.price) <= parseFloat($json["MAX_RENT"]) &&
       parseInt(item.json.rooms) >= parseInt($json["ROOMS"]));
     ```
   - Connect output of `Fetch Listings From immobilienscout24` to this node.

7. **Add a "SplitInBatches" node:**
   - Name: `Process Apartments One-by-One`
   - Batch Size: 1
   - Connect output of `Filter Results` to this node.

8. **Add two "Google Drive" nodes:**
   - Name: `Fetch Schufa (Google Drive)`
     - Authentication: OAuth2 (set up Google Drive credentials)
     - File ID: Expression: `{{$json["GDRIVE_SCHUFA_FILE_ID"]}}`
   - Name: `Fetch Salary Slips (Google Drive)`
     - Authentication: OAuth2
     - File ID: Expression: `{{$json["GDRIVE_SALARY_FILE_ID"]}}`
   - Both nodes receive input from `Process Apartments One-by-One` in parallel.

9. **Add a "Function" node:**
   - Name: `Generate Cover Letter`
   - Code:
     ```javascript
     return [{
       json: {
         coverLetter: `Sehr geehrte Damen und Herren,\n\n Ich interessiere mich sehr für die Wohnung mit Exposé-ID ${$json["exposeId"]} (${ $json["price"] } EUR, ${ $json["rooms"] } Zimmer).\n\n Im Anhang finden Sie meine Schufa-Auskunft und aktuelle Gehaltsabrechnungen.\n\n Vielen Dank für Ihre Zeit und ich freue mich auf Ihre Rückmeldung.\n\n Mit freundlichen Grüßen,\n${$json["MY_NAME"]}`
       }
     }];
     ```
   - Connect outputs of both Google Drive nodes to this node (they merge here).

10. **Add an "Email Send" node:**
    - Name: `Send Application Email`
    - From Email: Expression: `{{$json["MY_EMAIL"]}}`
    - To Email: Expression: `{{$json["contactEmail"]}}` (from apartment data)
    - Subject: Expression: `Wohnungsbewerbung – Interesse an Exposé-ID {{$json["exposeId"]}}`
    - Content: Expression: `{{$json["coverLetter"]}}`
    - Attachments: Add binary properties:
      - `schufa` (from Schufa Google Drive node)
      - `salary` (from Salary slips Google Drive node)
    - Connect output of `Generate Cover Letter` to this node.

11. **Add a "Google Sheets" node:**
    - Name: `Log to Google Sheet`
    - Authentication: OAuth2 (configure Google Sheets credentials)
    - Spreadsheet ID: Expression: `{{$json["GOOGLE_SHEET_ID"]}}`
    - Range: `A:E`
    - Values: Expression array:
      ```
      [
        "={{$json[\"title\"]}}",
        "={{$json[\"address\"]}}",
        "={{$json[\"price\"]}}",
        "={{new Date().toISOString()}}",
        "={{$json[\"exposeId\"]}}"
      ]
      ```
    - Connect output of `Send Application Email` to this node.

12. **Save and activate the workflow.**

---

### 5. General Notes & Resources

| Note Content                                                                                 | Context or Link                                                     |
|----------------------------------------------------------------------------------------------|-------------------------------------------------------------------|
| Workflow triggers daily at 8 AM Berlin time to catch new apartment listings regularly.       | Cron Trigger sticky note                                           |
| User must configure city, rent, rooms, email, and Google Drive/Sheet IDs before running.     | Set Config sticky note                                             |
| GeoID lookup currently supports Berlin only; extending requires adding more city mappings.   | GeoID Lookup sticky note                                           |
| ImmobilienScout24 API endpoint URL format may change; verify periodically.                    | Fetch Listings sticky note                                         |
| Google Drive nodes require OAuth2 credentials with access to specified files.                 | Fetch Schufa and Salary Slips sticky notes                         |
| Email node requires valid SMTP or email provider credentials configured in n8n.               | Send Application Email sticky note                                 |
| Google Sheets logging helps track applications and avoid duplicates.                          | Log to Google Sheet sticky note                                    |

---

**Disclaimer:**  
This document describes an automated workflow created with n8n, respecting all applicable content policies and handling only legal and public data.