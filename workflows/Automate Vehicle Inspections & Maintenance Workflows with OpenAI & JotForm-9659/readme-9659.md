Automate Vehicle Inspections & Maintenance Workflows with OpenAI & JotForm

https://n8nworkflows.xyz/workflows/automate-vehicle-inspections---maintenance-workflows-with-openai---jotform-9659


# Automate Vehicle Inspections & Maintenance Workflows with OpenAI & JotForm

### 1. Workflow Overview

This workflow automates vehicle inspection and maintenance management by integrating vehicle inspection data captured via Jotform with AI-powered analysis and communication tools. Its primary use case is for fleet management teams to efficiently process inspection submissions, assess vehicle conditions using AI, determine maintenance needs, and notify relevant parties accordingly.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Captures vehicle inspection submissions from Jotform.
- **1.2 Data Parsing:** Normalizes and structures raw form data for consistent processing.
- **1.3 Vehicle History Retrieval:** Simulates retrieval and calculation of vehicle maintenance history and due dates.
- **1.4 AI Fleet Analysis:** Uses an AI language model agent to analyze the vehicle condition, compliance, and maintenance requirements, producing structured JSON output.
- **1.5 AI Analysis Extraction & Merging:** Parses AI output and combines it with inspection data, deriving vehicle operational status and maintenance directives.
- **1.6 Routing Decision:** Determines whether the vehicle requires immediate action (critical) or routine processing.
- **1.7 Notifications:** Sends email alerts for critical issues or routine reports and confirms receipt with the driver.
- **1.8 Logging:** Records inspection and analysis results to Google Sheets for tracking and compliance.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:** Listens for new vehicle inspection form submissions from Jotform to trigger the workflow.
- **Nodes Involved:** 
  - `Jotform Trigger`
- **Node Details:**
  - **Type:** JotForm Trigger
  - **Role:** Entry point capturing form submissions for vehicle inspections.
  - **Configuration:** Listens on form ID `252866368275067` using configured Jotform API credentials.
  - **Expressions/Variables:** Passes entire form JSON object downstream.
  - **Input/Output:** No input; outputs raw form submission JSON.
  - **Failure Modes:** API connectivity issues, webhook misconfiguration, or missing form submissions.
  - **Sticky Note:** 📩 **TRIGGER** Captures vehicle inspections via Jotform with photos. Link: [Jotform](https://www.jotform.com/?partner=mediajade).

#### 2.2 Data Parsing

- **Overview:** Normalizes and structures incoming raw form data into a consistent JSON format for further processing.
- **Nodes Involved:**
  - `Parse Inspection Data`
- **Node Details:**
  - **Type:** Code Node (JavaScript)
  - **Role:** Extracts and standardizes fields such as driver info, vehicle details, inspection conditions, and timestamps.
  - **Configuration:** Parses fields with fallback keys; applies defaults (e.g., "good" for conditions, current date).
  - **Key Expressions:** Uses `$input.first().json` to access form data; constructs normalized JSON with keys like `inspectionId`, `driverName`, `vehicleMake`, `tiresCondition`, etc.
  - **Input/Output:** Input from `Jotform Trigger`; outputs normalized inspection JSON.
  - **Failure Modes:** Missing or malformed fields; type conversion errors for numeric fields like mileage.
  - **Sticky Note:** 🧾 **PARSE DATA** Normalizes form fields.

#### 2.3 Vehicle History Retrieval

- **Overview:** Simulates retrieval of vehicle maintenance history and computes due dates for upcoming services based on current mileage.
- **Nodes Involved:**
  - `Get Vehicle History`
- **Node Details:**
  - **Type:** Code Node (JavaScript)
  - **Role:** Emulates a vehicle database to calculate metrics like miles since last oil change, inspection due statuses, and compliance deadlines.
  - **Configuration:** Hardcoded vehicle history data and intervals; compares current date to due dates.
  - **Key Expressions:** Calculates booleans such as `oilChangeDue`, `tireRotationDue`, `annualInspectionOverdue`.
  - **Input/Output:** Input from `Parse Inspection Data`; outputs enriched JSON containing history and due flags.
  - **Failure Modes:** Date parsing errors, calculation errors if mileage or year invalid.
  - **Sticky Note:** 📊 **VEHICLE HISTORY** Retrieves maintenance records and calculates due dates.

#### 2.4 AI Fleet Analysis

- **Overview:** Uses an AI language model agent to analyze the vehicle inspection and history data, assessing condition, identifying issues, and generating maintenance recommendations in JSON.
- **Nodes Involved:**
  - `OpenAI Chat Model`
  - `AI Fleet Analysis`
- **Node Details:**
  - **OpenAI Chat Model:**
    - **Type:** LangChain OpenAI Chat
    - **Role:** Provides GPT-4.1-mini model to the AI agent for analysis.
    - **Configuration:** Uses GPT-4.1-mini model with supplied OpenAI credentials.
    - **Input/Output:** Inputs prompt text from the AI Fleet Analysis node; outputs AI textual response.
    - **Failure Modes:** API quota limits, timeouts, invalid credentials.
  - **AI Fleet Analysis:**
    - **Type:** LangChain Agent
    - **Role:** Formulates a detailed prompt embedding all inspection and history data to produce structured JSON analysis.
    - **Configuration:** Uses a system message positioning it as a “fleet maintenance analyst with DOT compliance expertise.” The prompt requests a JSON output with specified structure including overallStatus, criticalIssues, maintenanceRequired, complianceStatus, costAnalysis, and workOrderGeneration.
    - **Key Expressions:** Injects dynamic fields from previous nodes using string interpolation (e.g., `{{ $json.vehicleMake }}`, `{{ $json.oilChangeDue }}`).
    - **Input/Output:** Input from `Get Vehicle History`; outputs AI response JSON.
    - **Failure Modes:** Prompt formatting issues, malformed AI output, API errors.
  - **Sticky Note:** 🤖 **AI ANALYSIS** Analyzes condition, compliance, and generates recommendations.

#### 2.5 AI Analysis Extraction & Merging

- **Overview:** Parses the AI-generated JSON string safely and merges AI insights with original inspection data, deriving vehicle status and potential actions.
- **Nodes Involved:**
  - `Extract AI Analysis`
  - `Merge Fleet Analysis`
- **Node Details:**
  - **Extract AI Analysis:**
    - **Type:** Set Node
    - **Role:** Assigns AI output text to a new field `aiAnalysis`.
    - **Configuration:** Simple variable assignment from previous node’s `output` field.
    - **Input/Output:** Input from `AI Fleet Analysis`; outputs JSON with `aiAnalysis` string.
  - **Merge Fleet Analysis:**
    - **Type:** Code Node (JavaScript)
    - **Role:** Safely parses `aiAnalysis` string into JSON; applies fallback defaults if parsing fails.
    - Derives operational status (`operational`, `out_of_service`, `requires_attention`) based on AI flags.
    - Generates a work order number if required.
    - Combines all relevant AI insights with inspection data for downstream use.
    - **Input/Output:** Input from `Extract AI Analysis`; outputs enriched JSON with overallCondition, safetyRating, workOrder details, etc.
    - **Failure Modes:** JSON parse errors, missing AI keys.
  - **Sticky Note:** 🔗 **MERGE** Combines AI insights with inspection data.

#### 2.6 Routing Decision

- **Overview:** Routes workflow execution based on whether the vehicle requires immediate action or not.
- **Nodes Involved:**
  - `Critical Issue?` (If Node)
- **Node Details:**
  - **Type:** If Node
  - **Role:** Checks if `requiresImmediateAction` is true.
  - **Configuration:** Boolean condition on `$json.requiresImmediateAction`.
  - **Input/Output:** Input from `Merge Fleet Analysis`; routes to `Critical Alert Email` or `Routine Report Email`.
  - **Failure Modes:** Missing or malformed `requiresImmediateAction` field.
  - **Sticky Note:** ⚡ **ROUTE** Critical vs Routine.

#### 2.7 Notifications

- **Overview:** Sends notification emails to the maintenance team and drivers based on inspection outcomes.
- **Nodes Involved:**
  - `Critical Alert Email`
  - `Routine Report Email`
  - `Driver Confirmation`
- **Node Details:**
  - **Critical Alert Email:**
    - **Type:** Gmail Node
    - **Role:** Sends detailed critical issue alerts with vehicle info, safety ratings, critical issues, and work order info.
    - **Configuration:** Sends to `maintenance@fleet.com` with dynamic subject and message body interpolating multiple nodes’ data.
    - **Credentials:** Gmail OAuth2 credentials configured.
    - **Input/Output:** Input from `Critical Issue?` true branch; outputs to `Driver Confirmation`.
    - **Failure Modes:** Email sending failures, authentication errors.
  - **Routine Report Email:**
    - **Type:** Gmail Node
    - **Role:** Sends routine inspection summaries with condition and maintenance due flags.
    - **Configuration:** Similar recipient and dynamic content but for non-critical cases.
    - **Credentials:** Gmail OAuth2 credentials configured.
    - **Input/Output:** Input from `Critical Issue?` false branch; outputs to `Driver Confirmation`.
  - **Driver Confirmation:**
    - **Type:** Gmail Node
    - **Role:** Sends confirmation email to the driver summarizing inspection results and recommendations.
    - **Configuration:** Recipient is driver's email extracted from form data; message content depends on immediate action flags and work orders.
    - **Input/Output:** Input from both alert email nodes; outputs to `Log to Google Sheets`.
  - **Sticky Note:** 📧 **NOTIFICATIONS** Maintenance alerts and driver confirmation.

#### 2.8 Logging

- **Overview:** Logs all inspection and analysis data to a Google Sheets spreadsheet for record-keeping and compliance tracking.
- **Nodes Involved:**
  - `Log to Google Sheets`
- **Node Details:**
  - **Type:** Google Sheets Node
  - **Role:** Appends or updates rows in a Google Sheet identified by document ID.
  - **Configuration:** Maps multiple inspection and analysis fields like driver name, vehicle ID, conditions, issues, ratings, and notes.
  - **Input/Output:** Input from `Driver Confirmation`; no further output.
  - **Credentials:** Google Sheets OAuth2 credentials configured.
  - **Failure Modes:** API permission errors, rate limits, sheet access issues.
  - **Sticky Note:** 📊 **LOGGING** Tracks all inspections, maintenance, and compliance.

---

### 3. Summary Table

| Node Name             | Node Type                     | Functional Role                         | Input Node(s)             | Output Node(s)              | Sticky Note                                                                                                  |
|-----------------------|-------------------------------|---------------------------------------|---------------------------|-----------------------------|--------------------------------------------------------------------------------------------------------------|
| Jotform Trigger       | JotForm Trigger               | Capture vehicle inspection submissions | -                         | Parse Inspection Data        | 📩 **TRIGGER** Captures vehicle inspections via Jotform with photos [Jotform link](https://www.jotform.com/?partner=mediajade)            |
| Parse Inspection Data | Code Node                    | Normalize and structure form data     | Jotform Trigger           | Get Vehicle History          | 🧾 **PARSE DATA** Normalizes form fields                                                                    |
| Get Vehicle History   | Code Node                    | Retrieve vehicle history & calculate maintenance due dates | Parse Inspection Data     | AI Fleet Analysis            | 📊 **VEHICLE HISTORY** Retrieves maintenance records and calculates due dates                               |
| OpenAI Chat Model     | LangChain OpenAI Chat        | Provides GPT model for AI agent        | AI Fleet Analysis (agent) | AI Fleet Analysis            | 🤖 **AI ANALYSIS** Analyzes condition, compliance, and generates recommendations                              |
| AI Fleet Analysis     | LangChain Agent              | Generate AI maintenance analysis      | Get Vehicle History       | Extract AI Analysis          | 🤖 **AI ANALYSIS** Analyzes condition, compliance, and generates recommendations                              |
| Extract AI Analysis   | Set Node                    | Extract AI JSON output string          | AI Fleet Analysis         | Merge Fleet Analysis         | 🔗 **MERGE** Combines AI insights with inspection data                                                       |
| Merge Fleet Analysis  | Code Node                    | Parse AI output and merge with inspection data | Extract AI Analysis       | Critical Issue?              | 🔗 **MERGE** Combines AI insights with inspection data                                                       |
| Critical Issue?       | If Node                     | Route based on immediate maintenance need | Merge Fleet Analysis      | Critical Alert Email, Routine Report Email | ⚡ **ROUTE** Critical vs Routine                                        |
| Critical Alert Email  | Gmail Node                  | Send critical maintenance alert email | Critical Issue?           | Driver Confirmation         | 📧 **NOTIFICATIONS** Maintenance alerts and driver confirmation                                               |
| Routine Report Email  | Gmail Node                  | Send routine inspection report email  | Critical Issue?           | Driver Confirmation         | 📧 **NOTIFICATIONS** Maintenance alerts and driver confirmation                                               |
| Driver Confirmation   | Gmail Node                  | Confirm inspection receipt to driver  | Critical Alert Email, Routine Report Email | Log to Google Sheets         | 📧 **NOTIFICATIONS** Maintenance alerts and driver confirmation                                               |
| Log to Google Sheets  | Google Sheets Node          | Log inspection and maintenance data   | Driver Confirmation       | -                           | 📊 **LOGGING** Tracks all inspections, maintenance, and compliance                                           |
| Sticky Note           | Sticky Note                 | Documentation and visual comments     | -                         | -                           | Various notes throughout workflow                                                                             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Jotform Trigger Node:**
   - Node Type: `JotForm Trigger`
   - Configure with your Jotform API credentials.
   - Set Form ID to your vehicle inspection form (e.g., `252866368275067`).
   - This node will trigger on each form submission.

2. **Add Code Node "Parse Inspection Data":**
   - Node Type: `Code`
   - Input: Output of `Jotform Trigger`.
   - JavaScript:
     - Parse and normalize form fields with fallback keys.
     - Set default values for missing fields.
     - Output a JSON with keys: inspectionId, inspectionDate, driverName, driverEmail, vehicleId, vehicleMake, vehicleModel, vehicleYear, licensePlate, currentMileage (number), fuelLevel, tiresCondition, brakesCondition, lightsCondition, fluidLevels, engineCondition, transmissionCondition, interiorCondition, exteriorCondition, hasIssues, issueDescription, damagePhotos, cleanlinessRating, odometerPhoto, notes, submittedAt (ISO string), status ('pending_review').

3. **Add Code Node "Get Vehicle History":**
   - Node Type: `Code`
   - Input: Output of `Parse Inspection Data`.
   - JavaScript:
     - Simulate vehicle database with last service mileages and intervals.
     - Calculate due maintenance booleans (oilChangeDue, tireRotationDue, brakeInspectionDue).
     - Check compliance dates (annualInspectionDue, dotInspectionDue, registrationExpiry).
     - Calculate vehicle age.
     - Output enriched JSON with above details merged with input.

4. **Add LangChain Agent Node "AI Fleet Analysis":**
   - Node Type: `@n8n/n8n-nodes-langchain.agent`
   - Input: Output of `Get Vehicle History`.
   - Configuration:
     - System message: "You are an expert fleet maintenance analyst with DOT compliance expertise."
     - Prompt: Use detailed template injecting vehicle and inspection data as in the example, requesting structured JSON analysis of condition, issues, maintenance, compliance, costs, and work order generation.
     - Assign an OpenAI Chat Model node (`OpenAI Chat Model`) with GPT-4.1-mini as language model.
     - Connect OpenAI Chat Model node as the `ai_languageModel` input for this agent node.
     - Use your OpenAI API credentials.

5. **Add Set Node "Extract AI Analysis":**
   - Node Type: `Set`
   - Input: Output of `AI Fleet Analysis`.
   - Assign a new variable `aiAnalysis` equal to the AI agent’s `output` field (string).

6. **Add Code Node "Merge Fleet Analysis":**
   - Node Type: `Code`
   - Input: Output of `Extract AI Analysis`.
   - JavaScript:
     - Parse `aiAnalysis` JSON string safely; fall back to default safe object on error.
     - Derive vehicle operational status: 'operational', 'out_of_service', 'requires_attention'.
     - Generate work order number if AI recommends.
     - Output combined JSON including overallCondition, driveable, requiresImmediateAction, safetyRating, criticalIssues, maintenanceRequired, complianceStatus, costAnalysis, workOrderGeneration fields.

7. **Add If Node "Critical Issue?":**
   - Node Type: `If`
   - Input: Output of `Merge Fleet Analysis`.
   - Condition: Check if `requiresImmediateAction` is true.
   - True branch leads to critical alert email.
   - False branch leads to routine report email.

8. **Add Gmail Node "Critical Alert Email":**
   - Node Type: `Gmail`
   - Input: True branch of `Critical Issue?`.
   - Configure Gmail OAuth2 credentials.
   - Recipient: `maintenance@fleet.com`.
   - Subject: Include vehicle ID and alert.
   - Message: Detailed critical issue summary, safety rating, work order info, and driver details. Use expressions to interpolate data from relevant nodes.

9. **Add Gmail Node "Routine Report Email":**
   - Node Type: `Gmail`
   - Input: False branch of `Critical Issue?`.
   - Configure Gmail OAuth2 credentials.
   - Recipient: `maintenance@fleet.com`.
   - Subject: Vehicle inspection summary and condition.
   - Message: Summary of overall condition, maintenance due flags, and work order presence.

10. **Add Gmail Node "Driver Confirmation":**
    - Node Type: `Gmail`
    - Input: Outputs of both alert and routine email nodes.
    - Recipient: Driver email from form data.
    - Subject: Confirmation of inspection received.
    - Message: Inspection summary, safety rating, immediate action warnings, work order info.

11. **Add Google Sheets Node "Log to Google Sheets":**
    - Node Type: `Google Sheets`
    - Input: Output of `Driver Confirmation`.
    - Configure Google Sheets OAuth2 credentials.
    - Document ID: Your fleet inspection Google Sheet.
    - Sheet Name: e.g., "Sheet1" or GID 0.
    - Operation: Append or Update.
    - Mapping: Map inspection, vehicle, maintenance, and AI analysis fields (driver name, vehicle ID, mileage, conditions, issues, safety rating, work order info, notes).

12. **Connect nodes accordingly following the logical flow:**
    - `Jotform Trigger` → `Parse Inspection Data`
    - `Parse Inspection Data` → `Get Vehicle History`
    - `Get Vehicle History` → `AI Fleet Analysis`
    - `AI Fleet Analysis` → `Extract AI Analysis`
    - `Extract AI Analysis` → `Merge Fleet Analysis`
    - `Merge Fleet Analysis` → `Critical Issue?`
    - `Critical Issue?` True → `Critical Alert Email` → `Driver Confirmation` → `Log to Google Sheets`
    - `Critical Issue?` False → `Routine Report Email` → `Driver Confirmation` → `Log to Google Sheets`
    - `OpenAI Chat Model` → `AI Fleet Analysis` (as AI language model input)

---

### 5. General Notes & Resources

| Note Content                                                                                                           | Context or Link                                                                                         |
|------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|
| Use Jotform for free vehicle inspection forms creation with photo upload capability.                                   | [Jotform Partner Link](https://www.jotform.com/?partner=mediajade)                                      |
| AI model used is GPT-4.1-mini via LangChain integration within n8n for specialized fleet maintenance analysis.          | Requires OpenAI API credentials and LangChain nodes configured properly.                                |
| Gmail OAuth2 credentials must be configured for sending emails securely and reliably.                                   | Ensure OAuth2 consent and scopes include email sending permissions.                                     |
| Google Sheets OAuth2 credentials required for logging; set up permissions for spreadsheet access and edit rights.       | Spreadsheet ID and sheet name must be correct and accessible by the OAuth2 user.                        |
| The workflow assumes stable internet connectivity and API availability from Jotform, OpenAI, Gmail, and Google Sheets. | Potential error handling for API timeouts and quota limits should be implemented in production use.    |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created with n8n, an integration and automation tool. This process strictly adheres to current content policies and contains no illegal, offensive, or protected material. All data processed is legal and public.