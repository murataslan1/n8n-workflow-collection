Auto-Create Geotab Zone for New Salesforce Work Order

https://n8nworkflows.xyz/workflows/auto-create-geotab-zone-for-new-salesforce-work-order-4648


# Auto-Create Geotab Zone for New Salesforce Work Order

### 1. Workflow Overview

**Purpose:**  
This workflow automates the creation of a geofence zone in GeoTab whenever a new Work Order (Job) record is created in Salesforce, provided the Work Order meets specific criteria. It ensures that the new Work Order's location is registered as a GeoTab zone and updates Salesforce with the corresponding zone ID. Additionally, it sends notification emails about the success or failure of this operation.

**Target Use Cases:**  
- Automate geofence zone creation in GeoTab for Salesforce Work Orders.  
- Maintain synchronization of geofence data between Salesforce and GeoTab.  
- Notify operations and stakeholders of success or missing location data issues.  
- Adaptable to other Salesforce objects if needed.

**Logical Blocks:**  
- **1.1 Salesforce Trigger & Initial Response:** Receive and acknowledge Salesforce Outbound Message webhook for new Work Order.  
- **1.2 Work Order Details Retrieval & Field Extraction:** Fetch complete Work Order data from Salesforce and extract necessary fields.  
- **1.3 Location Validation & Conditional Branching:** Check if geolocation data (latitude/longitude) is present; branch accordingly.  
- **1.4 GeoTab Zone Data Preparation:** Format and calculate points for the GeoTab zone polygon.  
- **1.5 GeoTab Authentication & Zone Creation:** Authenticate with GeoTab API, calculate zone active dates, and create the zone.  
- **1.6 Salesforce Update & Notifications:** Update Salesforce record with GeoTab zone details and send success or error email notifications.  

---

### 2. Block-by-Block Analysis

#### 1.1 Salesforce Trigger & Initial Response

- **Overview:**  
  This block waits for an Outbound Message from Salesforce notifying about a newly created Work Order. It immediately responds with an XML acknowledgment to confirm receipt.

- **Nodes Involved:**  
  - Salesforce Webhook  
  - Respond to Webhook  
  - Wait  

- **Node Details:**  

  - **Salesforce Webhook**  
    - Type: Webhook (HTTP POST listener)  
    - Configured to accept POST requests at a unique path tied to Salesforce Outbound Message.  
    - Expects SOAP XML body from Salesforce with Work Order ID.  
    - Output: JSON parsed from the SOAP message.  
    - Failure Modes: Incorrect webhook URL, malformed SOAP message, network timeout.  

  - **Respond to Webhook**  
    - Type: Respond to Webhook  
    - Sends a static SOAP XML acknowledgment back to Salesforce confirming successful receipt.  
    - Sets Content-Type header to `application/xml`.  
    - Output: None (response ends the webhook request).  
    - Failure Modes: Response formatting errors.  

  - **Wait**  
    - Type: Wait (delay node)  
    - Delays workflow processing by 30 seconds before retrieving full Work Order details.  
    - Purpose: Allow Salesforce data to be fully committed and propagated before fetching.  
    - Input: Trigger from webhook.  
    - Output: Triggers next node after delay.  
    - Failure Modes: None significant, except delay too short causing incomplete data fetch.  

---

#### 1.2 Work Order Details Retrieval & Field Extraction

- **Overview:**  
  This block fetches the full Work Order record from Salesforce using the ID extracted from the webhook, then extracts relevant fields needed for geofence creation.

- **Nodes Involved:**  
  - Get Work Order details  
  - Extract required fields  

- **Node Details:**  

  - **Get Work Order details**  
    - Type: Salesforce node (customObject get operation)  
    - Uses OAuth2 Salesforce credentials.  
    - Input: Work Order ID from webhook parsed JSON.  
    - Retrieves full Work Order record for further processing.  
    - Failure Modes: Authentication errors, record not found, Salesforce API limits.  

  - **Extract required fields**  
    - Type: Set node  
    - Extracts and assigns specific fields: Id, WorkOrderNumber, Job_Type__c, Job_Sub_Type__c, Address.latitude, Address.longitude, CreatedDate, Last_Appointment_Date__c.  
    - Prepares data for downstream use.  
    - Failure Modes: Missing expected fields, null or undefined values.  

---

#### 1.3 Location Validation & Conditional Branching

- **Overview:**  
  Checks if latitude (geolocation) data exists for the Work Order. If present, proceeds to prepare GeoTab data; if not, sends an error notification email.

- **Nodes Involved:**  
  - If has location  
  - Email notification - error  

- **Node Details:**  

  - **If has location**  
    - Type: If node (conditional)  
    - Condition: Checks if `Address.latitude` is not empty.  
    - True branch: Continue GeoTab zone creation.  
    - False branch: Trigger error email notification.  
    - Failure Modes: Incorrect field path, unexpected null values.  

  - **Email notification - error**  
    - Type: Microsoft Outlook node (email send)  
    - Sends an automated notification to the Operations team if geolocation is missing.  
    - Email content includes detailed Work Order data for troubleshooting.  
    - Credentials: Microsoft Outlook OAuth2 required.  
    - Failure Modes: Email service downtime, invalid recipient address, authentication failure.  

---

#### 1.4 GeoTab Zone Data Preparation

- **Overview:**  
  Prepares and calculates the coordinates to define a circular geofence zone polygon around the Work Order location.

- **Nodes Involved:**  
  - Prepare data for GeoTab  
  - Calculate points  
  - Sticky Note7 (Check geolocation data) – visual aid  

- **Node Details:**  

  - **Prepare data for GeoTab**  
    - Type: Set node  
    - Assigns values for GeoTab zone creation: Name, Latitude, Longitude, Reference, Comment, ExternalReference, ActiveTo.  
    - Uses extracted Work Order data.  
    - Failure Modes: Missing or malformed input data.  

  - **Calculate points**  
    - Type: Code node (JavaScript)  
    - Calculates 20 evenly spaced points on a circle (radius 200m) around the center latitude/longitude to define polygon points for the GeoTab zone.  
    - Outputs an array of latitude/longitude points as `result`.  
    - Failure Modes: Parsing errors, invalid coordinates, division by zero if latitude is invalid.  

---

#### 1.5 GeoTab Authentication & Zone Creation

- **Overview:**  
  Authenticates with GeoTab API, calculates active zone dates, and submits the zone creation request with polygon points.

- **Nodes Involved:**  
  - GeoTab authentication  
  - Calculate zone's active dates  
  - Create zone in GeoTab  
  - Sticky Note2 (Create zone via GeoTab API) – visual aid  

- **Node Details:**  

  - **GeoTab authentication**  
    - Type: HTTP Request (POST)  
    - Authenticates to GeoTab API using username, password, database name.  
    - Credentials must be replaced with valid GeoTab account data.  
    - Outputs sessionId and other credentials for subsequent calls.  
    - Failure Modes: Bad credentials, network errors, GeoTab API downtime.  

  - **Calculate zone's active dates**  
    - Type: Code node (JavaScript)  
    - Calculates zone activeFrom (today at UTC midnight) and activeTo (60 days later).  
    - Formats ISO strings without milliseconds for API compliance.  
    - Failure Modes: Date parsing errors.  

  - **Create zone in GeoTab**  
    - Type: HTTP Request (POST)  
    - Sends an Add method request to GeoTab API to create a Zone entity.  
    - Uses sessionId from authentication, GeoTab database and username credentials.  
    - Includes zone name, reference, comment, polygon points, visibility settings, and active dates.  
    - Polygon points mapped from `Calculate points` node results.  
    - Failure Modes: API errors, invalid polygon data, expired session, malformed request.  

---

#### 1.6 Salesforce Update & Notifications

- **Overview:**  
  Updates the Salesforce Work Order record with the newly created GeoTab Zone ID and sends a success notification email.

- **Nodes Involved:**  
  - Update Salesforce with zone details  
  - Email notification - success  
  - Sticky Note4 (Credentials to configure) – visual aid  

- **Node Details:**  

  - **Update Salesforce with zone details**  
    - Type: Salesforce node (customObject update operation)  
    - Updates Work Order record with GeoTab_ID__c (zone ID) and GeoTab_Zone_Created__c (boolean true).  
    - Uses Salesforce OAuth2 credentials.  
    - Failure Modes: Authentication issues, record lock, field validation errors.  

  - **Email notification - success**  
    - Type: Microsoft Outlook node (email send)  
    - Sends detailed confirmation email to specified recipients about successful zone creation.  
    - Includes links to Salesforce Work Order and GeoTab Zone for easy access.  
    - Credentials: Microsoft Outlook OAuth2 required.  
    - Failure Modes: Email service issues, invalid recipient, authentication failures.  

---

### 3. Summary Table

| Node Name                      | Node Type                 | Functional Role                                | Input Node(s)            | Output Node(s)                | Sticky Note                                                                                                                                                                                                                                                                                                                                                               |
|-------------------------------|---------------------------|-----------------------------------------------|--------------------------|------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Salesforce Webhook             | Webhook                   | Entry point, receives Salesforce Outbound Msg | -                        | Respond to Webhook, Wait      | ## Prepare Data                                                                                                                                                                                                                                                                                                                                                           |
| Respond to Webhook             | Respond to Webhook        | Sends SOAP acknowledgment to Salesforce       | Salesforce Webhook       | -                            | ## Prepare Data                                                                                                                                                                                                                                                                                                                                                           |
| Wait                          | Wait                      | Delays processing for data availability        | Salesforce Webhook       | Get Work Order details        | ## Prepare Data                                                                                                                                                                                                                                                                                                                                                           |
| Get Work Order details         | Salesforce                | Retrieves full Work Order from Salesforce      | Wait                     | Extract required fields       | ### 🧩 How the Salesforce trigger works                                                                                                                                                                                                                                                                                                                                   |
| Extract required fields        | Set                       | Extracts necessary fields from Work Order      | Get Work Order details   | If has location               | ## Prepare Data                                                                                                                                                                                                                                                                                                                                                           |
| If has location                | If                        | Checks if Work Order has latitude              | Extract required fields  | Prepare data for GeoTab, Email notification - error | **Check geolocation data**                                                                                                                                                                                                                                                                                                                                              |
| Email notification - error     | Microsoft Outlook          | Sends notification if missing geolocation      | If has location          | -                            | ## ⚠️ Missing Geolocation in Salesforce                                                                                                                                                                                                                                                                                                                                   |
| Prepare data for GeoTab        | Set                       | Prepares GeoTab zone data                       | If has location          | Calculate points             | ## Create zone via GeoTab API                                                                                                                                                                                                                                                                                                                                              |
| Calculate points              | Code                      | Calculates polygon points around location      | Prepare data for GeoTab  | GeoTab authentication         | ## Create zone via GeoTab API                                                                                                                                                                                                                                                                                                                                              |
| GeoTab authentication          | HTTP Request              | Authenticates to GeoTab API                     | Calculate points         | Calculate zone's active dates | ## Create zone via GeoTab API                                                                                                                                                                                                                                                                                                                                              |
| Calculate zone's active dates  | Code                      | Computes zone activeFrom and activeTo dates    | GeoTab authentication    | Create zone in GeoTab         | ## Create zone via GeoTab API                                                                                                                                                                                                                                                                                                                                              |
| Create zone in GeoTab          | HTTP Request              | Sends zone creation request to GeoTab API      | Calculate zone's active dates | Update Salesforce with zone details | ## Create zone via GeoTab API                                                                                                                                                                                                                                                                                                                                              |
| Update Salesforce with zone details | Salesforce            | Updates Work Order with GeoTab zone info       | Create zone in GeoTab    | Email notification - success  | ### 🔐 Credentials to configure                                                                                                                                                                                                                                                                                                                                           |
| Email notification - success   | Microsoft Outlook          | Sends confirmation email on success            | Update Salesforce with zone details | -                      | ### 🔐 Credentials to configure                                                                                                                                                                                                                                                                                                                                           |
| Sticky Note*                   | Sticky Note               | Visual aids for sections                        | -                        | -                            | Various notes including instructions, explanations, and credentials details                                                                                                                                                                                                                                                                                               |

*Sticky Notes are placed near groups of nodes to explain sections; their content is duplicated in the relevant rows above.

---

### 4. Reproducing the Workflow from Scratch

**Step 1: Create Salesforce Webhook Node**  
- Type: Webhook  
- HTTP Method: POST  
- Path: Unique identifier (e.g., "5e194736-f8d7-4eef-9c71-85d264168f3a")  
- Response Mode: Response Node  
- Options: rawBody = false  

**Step 2: Add Respond to Webhook Node**  
- Connect Salesforce Webhook output to this node.  
- Response Body: Static SOAP XML acknowledging receipt (`<notificationsResponse><Ack>true</Ack></notificationsResponse>`)  
- Set Response Headers: Content-Type = application/xml  

**Step 3: Add Wait Node**  
- Connect Salesforce Webhook output to Wait node.  
- Set delay amount to 30 seconds (to allow Salesforce DB consistency).  

**Step 4: Add Salesforce Get Node to Retrieve Work Order**  
- Connect Wait node output to this node.  
- Operation: Get  
- Resource: Custom Object  
- Custom Object API Name: WorkOrder  
- Record ID: Extract from webhook JSON — expression: `{{$json.body['soapenv:envelope']['soapenv:body'].notifications.notification.sobject['sf:id']}}`  
- Credentials: Set Salesforce OAuth2 credentials  

**Step 5: Add Set Node to Extract Required Fields**  
- Connect Salesforce Get output to this node.  
- Assign the following fields by referencing JSON:  
  - Id  
  - WorkOrderNumber  
  - Job_Type__c  
  - Job_Sub_Type__c  
  - Address.latitude  
  - Address.longitude  
  - CreatedDate  
  - Last_Appointment_Date__c  

**Step 6: Add If Node to Check Location Presence**  
- Connect Set node output here.  
- Condition: `Address.latitude` is not empty  

**Step 7a: (True) Prepare Data for GeoTab**  
- Add Set node  
- Assign fields for GeoTab zone creation:  
  - Name = WorkOrderNumber  
  - Latitude = Address.latitude  
  - Longitude = Address.longitude  
  - Reference = Job_Type__c  
  - Comment = Job_Sub_Type__c  
  - ExternalReference = Id  
  - ActiveTo = Last_Appointment_Date__c  
- Connect If node True output here.  

**Step 7b: (True) Calculate Polygon Points**  
- Add Code node with JavaScript code to calculate 20 points in a circle (~200m radius) around the given lat/lon.  
- Connect Prepare Data node output here.  

**Step 8: GeoTab Authentication HTTP Request**  
- Connect Calculate Points output here.  
- POST to `https://my.geotab.com/apiv1/Authenticate`  
- JSON Body:  
  ```json
  {
    "method": "Authenticate",
    "params": {
      "database": "YOUR_GEOTAB_DATABASE_NAME",
      "userName": "YOUR@USERNAME.EMAIL",
      "password": "YOUR_GEOTAB_USER_PASSWORD"
    }
  }
  ```  
- Headers: Content-Type: application/json  
- Credentials: none (hardcoded in body) but replace with actual data.  

**Step 9: Calculate Zone Active Dates**  
- Add Code node that:  
  - Sets activeFrom = today at 00:00:00 UTC  
  - Sets activeTo = 60 days later at 00:00:00 UTC  
  - Formats ISO strings without milliseconds  
- Connect GeoTab authentication output here.  

**Step 10: Create Zone in GeoTab HTTP Request**  
- Connect active dates output here.  
- POST to `https://my.geotab.com/apiv1`  
- JSON Body uses Add method with entity type "Zone" and includes:  
  - Name, externalReference, reference, comment from "Prepare data for GeoTab" node.  
  - Points array from "Calculate points" node results.  
  - ActiveFrom and ActiveTo from "Calculate zone's active dates".  
  - Groups, visibility and publish settings as per example.  
  - Credentials object includes sessionId from GeoTab authentication output, database, and username (same as authentication).  
- Headers: Content-Type: application/json  

**Step 11: Update Salesforce with Zone Details**  
- Connect Create zone output here.  
- Operation: Update  
- Resource: Custom Object (WorkOrder)  
- Record ID: Work Order Id from Get Work Order details  
- Update Fields:  
  - GeoTab_ID__c = zone ID from GeoTab create response  
  - GeoTab_Zone_Created__c = true  
- Credentials: Salesforce OAuth2  

**Step 12: Email Notification - Success**  
- Connect Salesforce update output here.  
- Send email via Microsoft Outlook node.  
- Subject: Job zone creation confirmation with WorkOrderNumber.  
- Body: Detailed message including Salesforce and GeoTab links, Work Order details.  
- Recipients: pre-set operational email address.  
- Credentials: Microsoft Outlook OAuth2  

**Step 13: Email Notification - Error**  
- Connect If node False output (missing geolocation) here.  
- Send email via Microsoft Outlook node.  
- Subject: Missing Geo Location notification with WorkOrderNumber.  
- Body: Detailed message alerting owner and operations team about missing lat/lon.  
- Recipients: operational email address.  
- Credentials: Microsoft Outlook OAuth2  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                       | Context or Link                                                                                       |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| This workflow listens for Salesforce Outbound Messages tied to the Work Order object. Configuration in Salesforce is required to send these messages to the n8n webhook.                                                                                                                                                                                                                           | See Sticky Note6 for Salesforce Outbound Message setup instructions.                                 |
| Microsoft Outlook OAuth2 credentials must be created and assigned to nodes sending email notifications.                                                                                                                                                                                                                                                                                            | See Sticky Note4 for credentials configuration details.                                             |
| GeoTab API credentials (database name, userName, and password) must be replaced in the HTTP Request nodes for authentication and zone creation.                                                                                                                                                                                                                                                    | See Sticky Note4 for credential placeholders and instructions.                                      |
| The polygon zone is calculated as a circle with 200m radius using 20 points evenly spaced around the center location. This can be adjusted in the Calculate points node code if needed.                                                                                                                                                                                                            | Code snippet in "Calculate points" node.                                                           |
| The workflow assumes the Work Order record contains valid latitude and longitude in `Address.latitude` and `Address.longitude`. Records missing these are handled by sending error notifications.                                                                                                                                                                                               | See Sticky Note1 and conditional logic in "If has location" node.                                   |
| The success email includes direct links to Salesforce Work Order and the GeoTab zone editing page for quick access by operations.                                                                                                                                                                                                                                                                  | Email body references URLs with embedded record IDs.                                                |
| This workflow is designed for Work Order object but can be adapted for other Salesforce objects by changing the relevant node configurations and Salesforce Outbound Message settings.                                                                                                                                                                                                             | Customizable per organizational needs.                                                             |

---

**Disclaimer:** The provided text is generated exclusively from an n8n automation workflow. It complies strictly with content policies and contains no illegal, offensive, or protected elements. All handled data is legal and public.