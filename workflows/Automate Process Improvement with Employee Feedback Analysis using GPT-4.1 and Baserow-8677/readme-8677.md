Automate Process Improvement with Employee Feedback Analysis using GPT-4.1 and Baserow

https://n8nworkflows.xyz/workflows/automate-process-improvement-with-employee-feedback-analysis-using-gpt-4-1-and-baserow-8677


# Automate Process Improvement with Employee Feedback Analysis using GPT-4.1 and Baserow

### 1. Workflow Overview

This workflow automates the creation of personalized calendar views in Baserow by leveraging its API and JWT authentication. It is designed to generate calendar views filtered by linked records (e.g., employees, customers) and share these views for external calendar integration (e.g., Outlook, Google Calendar) via `.ics` files.

**Target Use Cases:**  
- Task management with personalized deadlines  
- Customer appointment scheduling  
- Inventory delivery tracking per supplier  

**Logical Blocks:**

- **1.1 Authentication & Credential Setup:** Gather Baserow user credentials, generate JWT token for API access.  
- **1.2 Configuration of Tables and Fields:** Define IDs of the relevant Baserow tables and fields used in the workflow.  
- **1.3 Data Retrieval:** Fetch all records from the filter table which contains linked entities for filtering.  
- **1.4 Calendar View Creation:** Create a new calendar view for each linked record with appropriate date field configuration.  
- **1.5 Filter & Decoration Setup:** Apply filters to calendar views to scope records and set background color decorations based on status fields.  
- **1.6 Sharing and Publishing:** Enable public sharing of the calendar view as an `.ics` feed and update the filter table records with links to the generated views and feeds.  

---

### 2. Block-by-Block Analysis

#### 2.1 Authentication & Credential Setup

**Overview:**  
This block authenticates the user against the Baserow API by generating a JWT token required for authorization of all subsequent API calls.

**Nodes Involved:**  
- Set Baserow credentials  
- Create a token

**Node Details:**  

- **Set Baserow credentials**  
  - Type: Set  
  - Role: Stores Baserow username, password, and API host URL as workflow variables.  
  - Configuration: User inputs for `Baserow user`, `Baserow password`, default API host `https://api.baserow.io`.  
  - Inputs: Manual Trigger  
  - Outputs: JSON variables for use in the next node.  
  - Failure modes: Missing or incorrect credentials cause authentication failure in subsequent steps.  
  - Notes: Requires manual credential entry or secure credential management.  

- **Create a token**  
  - Type: HTTP Request  
  - Role: Sends POST request to `/api/user/token-auth/` endpoint to obtain JWT token.  
  - Configuration:  
    - URL dynamically set from API host variable.  
    - Body JSON includes email and password from previous node.  
  - Inputs: JSON with credentials from "Set Baserow credentials"  
  - Outputs: JSON containing `access_token`.  
  - Failure modes: Authentication errors, network timeouts, malformed requests.  
  - Version: n8n HTTP Request node v4.2 used.  

---

#### 2.2 Configuration of Tables and Fields

**Overview:**  
Defines all necessary table and field IDs, interprets the JWT token for authorization header construction, and stores them as workflow variables for reuse.

**Nodes Involved:**  
- Set table and field ids

**Node Details:**  

- **Set table and field ids**  
  - Type: Set  
  - Role: Prepares all required IDs and the JWT token header string for API calls.  
  - Configuration:  
    - Converts raw access token into JWT bearer token format `JWT {{access_token}}`.  
    - Contains numerical IDs for Date table, Date field, Filter field, Status field (optional), Filter table, Database ID, Ics field (optional), View link field (optional).  
  - Inputs: JWT token JSON from "Create a token"  
  - Outputs: JSON with all IDs and token string.  
  - Failure modes: Missing or incorrect IDs lead to API errors in downstream calls.  
  - Notes: User must customize all IDs according to their Baserow database schema.  

---

#### 2.3 Data Retrieval

**Overview:**  
Fetches all records from the filter table to generate personalized calendar views for each linked record.

**Nodes Involved:**  
- Get all records from filter table

**Node Details:**  

- **Get all records from filter table**  
  - Type: Baserow node  
  - Role: Retrieves all rows from the filter table specified by ID.  
  - Configuration: Uses `tableId` and `databaseId` from previous set node, authenticated with Baserow credentials.  
  - Inputs: JSON with table IDs and token from "Set table and field ids"  
  - Outputs: List of records, each representing an entity for which a calendar view is created.  
  - Failure modes: API errors, authentication failure, empty table.  
  - Notes: Pagination not explicitly handled – may be a limitation with large datasets.  

---

#### 2.4 Calendar View Creation

**Overview:**  
Creates a new calendar view in Baserow for each linked record, named accordingly, and configured with the relevant date field.

**Nodes Involved:**  
- Create new calendar view

**Node Details:**  

- **Create new calendar view**  
  - Type: HTTP Request  
  - Role: Calls Baserow API endpoint to create a calendar view on the Date table.  
  - Configuration:  
    - POST request to `/api/database/views/table/{Date table}`.  
    - Body JSON includes view name (personalized with linked record name), view type `calendar`, ownership, filter type, and date field ID.  
    - Authorization header uses JWT token from "Set table and field ids".  
  - Inputs: Records from filter table  
  - Outputs: JSON for created view including view ID.  
  - Failure modes: API errors, invalid field IDs, permission issues.  
  - Notes: Dependent on correct date field and table ID.  

---

#### 2.5 Filter & Decoration Setup

**Overview:**  
Applies a filter to limit calendar view content to linked records and optionally sets a background color decoration based on a status field.

**Nodes Involved:**  
- Create filter  
- Set background color

**Node Details:**  

- **Create filter**  
  - Type: HTTP Request  
  - Role: Adds a filter to the calendar view to show only records linked to the current filter record.  
  - Configuration:  
    - POST to `/api/database/views/{view_id}/filters/`.  
    - Body specifies the filter field, filter type `link_row_has`, and value as the linked record ID.  
    - Authorization header with JWT token.  
  - Inputs: Newly created calendar view JSON  
  - Outputs: Confirmation of filter creation  
  - Failure modes: API errors, invalid filter field, missing view ID.  

- **Set background color**  
  - Type: HTTP Request  
  - Role: Adds a decoration to the view for background color based on a single select status field.  
  - Configuration:  
    - POST to `/api/database/views/{view_id}/decorations/`.  
    - Body sets decoration type `background_color`, value provider type `single_select_color`, and specifies the status field ID.  
    - Authorization header with JWT token.  
  - Inputs: Filter creation confirmation JSON  
  - Outputs: Confirmation of decoration creation  
  - Failure modes: API errors, missing status field, invalid view ID.  
  - Notes: This step is optional depending on presence of status field.  

---

#### 2.6 Sharing and Publishing

**Overview:**  
Marks the calendar view as publicly shared with an `.ics` feed and updates the filter table records with links to the newly created view and calendar feed.

**Nodes Involved:**  
- Share the view  
- Update the url's

**Node Details:**  

- **Share the view**  
  - Type: HTTP Request  
  - Role: Updates the calendar view by setting `ical_public` to `true` enabling public `.ics` sharing.  
  - Configuration:  
    - PATCH to `/api/database/views/{view_id}`.  
    - Body JSON sets `"ical_public": true`.  
    - Authorization header with JWT token.  
  - Inputs: Decoration creation confirmation JSON  
  - Outputs: Updated view JSON including public ICS feed URL  
  - Failure modes: API errors, permission issues, invalid view ID.  

- **Update the url's**  
  - Type: Baserow node  
  - Role: Updates each record in the filter table with the URLs to the new calendar view and `.ics` feed.  
  - Configuration:  
    - PATCH operation on the filter table row using row ID.  
    - Updates fields for ICS feed URL and view link URL using generated view and feed URLs.  
    - Authenticated with Baserow API credentials.  
  - Inputs: Updated view JSON with URLs  
  - Outputs: Confirmation of record update  
  - Failure modes: API errors, missing field IDs for URL storage, row ID mismatch.  
  - Notes: Enables building applications that reference personalized calendar URLs.  

---

### 3. Summary Table

| Node Name                   | Node Type           | Functional Role                             | Input Node(s)                   | Output Node(s)                   | Sticky Note                                                                                                      |
|-----------------------------|---------------------|---------------------------------------------|---------------------------------|---------------------------------|------------------------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger      | Initiates the workflow                       | -                               | Set Baserow credentials          | # Authentication: replace <your_username> and <your_password> with your actual Baserow credentials.             |
| Set Baserow credentials      | Set                 | Stores Baserow user credentials and API host | When clicking ‘Execute workflow’ | Create a token                  |                                                                                                                  |
| Create a token               | HTTP Request         | Authenticates user and gets JWT token       | Set Baserow credentials          | Set table and field ids          |                                                                                                                  |
| Set table and field ids      | Set                 | Defines table/field IDs and JWT header      | Create a token                   | Get all records from filter table | # Required tables and fields: Date table, Date field, Filter field, Status field (optional), Filter table, etc. |
| Get all records from filter table | Baserow             | Retrieves all records to filter on           | Set table and field ids          | Create new calendar view         |                                                                                                                  |
| Create new calendar view     | HTTP Request         | Creates calendar view for each linked record | Get all records from filter table | Create filter                  |                                                                                                                  |
| Create filter               | HTTP Request         | Applies filter to calendar view               | Create new calendar view         | Set background color             |                                                                                                                  |
| Set background color         | HTTP Request         | Sets background color decoration on view     | Create filter                   | Share the view                  |                                                                                                                  |
| Share the view              | HTTP Request         | Publishes calendar view with public ICS feed | Set background color             | Update the url's                |                                                                                                                  |
| Update the url's            | Baserow              | Updates filter table records with URLs        | Share the view                  | -                               |                                                                                                                  |
| Sticky Note                 | Sticky Note          | Documentation and overview                    | -                               | -                               | See detailed content in Section 5                                                                                |
| Sticky Note1                | Sticky Note          | Authentication reminder                        | -                               | -                               | # Authentication: replace <your_username> and <your_password> with your actual Baserow credentials.             |
| Sticky Note2                | Sticky Note          | Required tables and fields explanation         | -                               | -                               | # Required tables and fields: Date table, Date field, Filter field, Status field (optional), Filter table, etc. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Manual Trigger node** to start the workflow on demand.

2. **Add a Set node named "Set Baserow credentials":**  
   - Create string parameters:  
     - `Baserow user` (your Baserow email/username)  
     - `Baserow password` (your Baserow password)  
     - `API host` with default `https://api.baserow.io` (change if self-hosted)  
   - Connect from Manual Trigger.

3. **Add an HTTP Request node named "Create a token":**  
   - Method: POST  
   - URL: `={{ $json["API host"] }}/api/user/token-auth/`  
   - Body Content Type: JSON  
   - Request Body:  
     ```json
     {
       "email": "{{ $json["Baserow user"] }}",
       "password": "{{ $json["Baserow password"] }}"
     }
     ```  
   - Connect from "Set Baserow credentials".

4. **Add a Set node named "Set table and field ids":**  
   - Set the following fields (replace placeholder values with your actual IDs):  
     - `JWT Token`: expression `=JWT {{ $json.access_token }}`  
     - `Date table`: number (e.g., 671901)  
     - `Date field`: number (e.g., 5533823)  
     - `Filter field`: number (e.g., 5533824)  
     - `Status field`: number or blank if unused (e.g., 5533825)  
     - `Filter table`: number (e.g., 671897)  
     - `Database ID`: number (e.g., 288404)  
     - `Ics field`: string or blank (e.g., "5533800")  
     - `View link field`: string or blank (e.g., "5533805")  
   - Connect from "Create a token".

5. **Add a Baserow node named "Get all records from filter table":**  
   - Operation: Get all rows  
   - Table ID: `={{ $json["Filter table"] }}`  
   - Database ID: `={{ $json["Database ID"] }}`  
   - Credentials: Configure your Baserow API credentials (email/password)  
   - Connect from "Set table and field ids".

6. **Add an HTTP Request node named "Create new calendar view":**  
   - Method: POST  
   - URL: `={{$('Set Baserow credentials').item.json["API host"]}}/api/database/views/table/{{ $('Set table and field ids').item.json['Date table'] }}/`  
   - Body Content Type: JSON  
   - Body (uses current record context):  
     ```json
     {
       "name": "Calendar for {{ $json.Name }}",
       "type": "calendar",
       "ownership_type": "collaborative",
       "filter_type": "OR",
       "date_field": {{ $('Set table and field ids').item.json['Date field'] }}
     }
     ```  
   - Headers: Add `Authorization` with value `={{ $('Set table and field ids').item.json['JWT Token'] }}`  
   - Connect from "Get all records from filter table".

7. **Add an HTTP Request node named "Create filter":**  
   - Method: POST  
   - URL: `={{$('Set Baserow credentials').item.json["API host"]}}/api/database/views/{{ $('Create new calendar view').item.json.id }}/filters/`  
   - Body:  
     ```json
     {
       "field": {{ $('Set table and field ids').item.json['Filter field'] }},
       "type": "link_row_has",
       "value": {{ $('Get all records from filter table').item.json.id }}
     }
     ```  
   - Headers: `Authorization` with JWT token as above  
   - Connect from "Create new calendar view".

8. **Add an HTTP Request node named "Set background color":**  
   - Method: POST  
   - URL: `={{$('Set Baserow credentials').item.json["API host"]}}/api/database/views/{{ $json.view }}/decorations/`  
   - Body:  
     ```json
     {
       "type": "background_color",
       "value_provider_type": "single_select_color",
       "value_provider_conf": {
         "field_id": {{ $('Set table and field ids').item.json['Status field'] }}
       },
       "order": 1
     }
     ```  
   - Headers: `Authorization` with JWT token  
   - Connect from "Create filter".

9. **Add an HTTP Request node named "Share the view":**  
   - Method: PATCH  
   - URL: `={{$('Set Baserow credentials').item.json["API host"]}}/api/database/views/{{ $json.view }}/`  
   - Body:  
     ```json
     {
       "ical_public": true
     }
     ```  
   - Headers: `Authorization` with JWT token  
   - Connect from "Set background color".

10. **Add a Baserow node named "Update the url's":**  
    - Operation: Update row  
    - Table ID: `={{ $('Set table and field ids').item.json["Filter table"] }}`  
    - Row ID: `={{ $('Get all records from filter table').item.json.id }}`  
    - Fields to update:  
      - Field ID for ICS URL: `={{ $json.ical_feed_url }}` (from shared view response)  
      - Field ID for View Link: Constructed link using database and table IDs  
    - Credentials: Use Baserow API credentials  
    - Connect from "Share the view".

11. **Add Sticky Notes for documentation:**  
    - For authentication instructions near "Set Baserow credentials".  
    - For required fields explanation near "Set table and field ids".  
    - For overall workflow explanation at the beginning or side.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Context or Link                                                                                                      |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| This workflow demonstrates creating personalized calendar views with Baserow and n8n, useful for task, customer, or inventory management by filtering on linked records and sharing `.ics` calendar feeds.                                                                                                                                                                                                                                                                                                                                                                               | Workflow purpose                                                                                                     |
| Authentication uses JWT tokens generated via Baserow’s API with user email and password. You must replace `<your_username>` and `<your_password>` in the credentials node.                                                                                                                                                                                                                                                                                                                                                                                                                                     | Sticky Note1                                                                                                        |
| Required tables and fields include: Date table (holding date field), Date field, Filter field (link to table), Status field (optional, for color), Filter table (referenced table), Database ID, and optional fields for ICS and view link URLs.                                                                                                                                                                                                                                                                                                                                                                                       | Sticky Note2                                                                                                        |
| Baserow API documentation is essential for deeper customization: [Baserow API Docs](https://api.baserow.io/api/redoc/)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | External API Documentation                                                                                          |
| This workflow can be triggered manually or adapted to webhook/event triggers. Pagination for large datasets is not handled and may require extension.                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Usage Note                                                                                                          |
| The workflow is designed to be easily customizable: change date fields, filters, color decorations, or add notifications when views are created.                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Customization guidance                                                                                              |

---

**Disclaimer:**  
The text provided is exclusively derived from an automated n8n workflow. It strictly complies with content policies and contains no illegal, offensive, or protected elements. All data processed is legal and public.