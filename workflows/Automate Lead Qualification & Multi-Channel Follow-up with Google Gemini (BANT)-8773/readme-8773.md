Automate Lead Qualification & Multi-Channel Follow-up with Google Gemini (BANT)

https://n8nworkflows.xyz/workflows/automate-lead-qualification---multi-channel-follow-up-with-google-gemini--bant--8773


# Automate Lead Qualification & Multi-Channel Follow-up with Google Gemini (BANT)

### 1. Workflow Overview

This workflow automates lead qualification and multi-channel follow-up using the BANT framework (Budget, Authority, Need, Timing) combined with Google Gemini (PaLM) AI models. It is designed to intake leads via a web contact form, score them according to their readiness and fit, then route them to the most appropriate engagement channel:

- **Hot leads** are redirected to a calendar booking link for direct scheduling.
- **Mid-level leads** receive a pre-filled WhatsApp message to initiate chat engagement.
- **Cold leads** are sent a nurturing email with helpful resources to maintain relationship building.

The workflow logical blocks are:

- **1.1 Input Reception and Lead Scoring:** Lead form capture triggers AI-based lead scoring using BANT criteria.
- **1.2 Score Routing:** A Switch node routes leads based on the AI-assigned score (`hot`, `mid`, `cold`).
- **1.3 Hot Lead Handling:** Redirects hot leads to a calendar booking URL.
- **1.4 Mid Lead Handling:** Generates a personalized WhatsApp message and redirects leads to WhatsApp chat.
- **1.5 Cold Lead Handling:** Crafts a nurturing email and sends it via Gmail, followed by redirecting the user to a website.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Lead Scoring

**Overview:**  
This block receives lead data from a public contact form and uses a Google Gemini AI model to score the lead according to the BANT framework.

**Nodes Involved:**  
- Lead Contact Form  
- Score Lead  
- Simple JSON Parsing (Lead Score)

**Node Details:**

- **Lead Contact Form**  
  - Type: Form Trigger  
  - Role: Entry point capturing lead inputs such as Full Name, Email, Budget, Job, Need, and Timing.  
  - Configuration: Webhook path `n8n-contact-form` with fields fully customized for lead qualification.  
  - Inputs: User-submitted form data  
  - Outputs: JSON object with lead responses  
  - Failures: Missing required fields, webhook unavailability  

- **Score Lead**  
  - Type: Google Gemini (PaLM) AI node  
  - Role: Uses an advanced language model (Gemma 3 27b Italian version) to analyze BANT inputs and assign a lead score (`hot`, `mid`, `cold`).  
  - Configuration:  
    - Model: `models/gemma-3-27b-it`  
    - Temperature: 0 (deterministic output)  
    - Prompt: Custom prompt precisely defining scoring logic based on BANT criteria with examples and strict output format (JSON with a single "score" key).  
    - Inputs mapped from lead form JSON fields.  
  - Outputs: AI response including a JSON string with the score  
  - Failures: API authentication errors, timeout, malformed output, parsing errors  
  - Version: Requires n8n version compatible with Google Gemini nodes  

- **Simple JSON Parsing (Lead Score)**  
  - Type: Set node  
  - Role: Cleans and parses the AI output JSON string into usable JSON data.  
  - Configuration: Removes Markdown code block syntax and parses text to JSON.  
  - Inputs: AI raw response  
  - Outputs: Parsed JSON with lead score  
  - Failures: Parsing errors if AI output is malformed  

---

#### 2.2 Score Routing

**Overview:**  
Routes the lead based on the AI-assigned score value to one of three paths: hot, mid, or cold.

**Nodes Involved:**  
- Switch

**Node Details:**

- **Switch**  
  - Type: Switch  
  - Role: Routes workflow execution according to the lead score (`hot`, `mid`, or `cold`).  
  - Configuration:  
    - Condition checks if `$json.score` equals `"hot"`, `"mid"`, or `"cold"`.  
    - Outputs: Three separate outputs named accordingly.  
  - Inputs: Parsed lead score JSON  
  - Outputs: Leads flow to corresponding follow-up nodes  
  - Failures: Missing or unexpected score values, expression evaluation errors  

---

#### 2.3 Hot Lead Handling

**Overview:**  
Redirects highly qualified leads to a calendar booking link for immediate scheduling.

**Nodes Involved:**  
- Calendar Booking Link

**Node Details:**

- **Calendar Booking Link**  
  - Type: Form node (completion operation)  
  - Role: Redirects the user to a calendar booking URL upon lead qualification as "hot".  
  - Configuration:  
    - Redirect URL set to a calendar booking platform (e.g., Calendly, Chili Piper).  
    - Responds with HTTP redirect to the booking link.  
  - Inputs: Routed from Switch node "hot" output  
  - Outputs: None (end node)  
  - Failures: Invalid or unreachable redirect URL, form webhook issues  

---

#### 2.4 Mid Lead Handling

**Overview:**  
Generates a personalized WhatsApp message and redirects the lead to WhatsApp chat to initiate contact.

**Nodes Involved:**  
- Write Placeholder WA Message  
- Phone Number  
- Send to Whatsapp

**Node Details:**

- **Write Placeholder WA Message**  
  - Type: Google Gemini (PaLM) AI node  
  - Role: Creates a friendly, professional WhatsApp message from the lead’s perspective summarizing their details.  
  - Configuration:  
    - Model: `models/gemini-2.5-flash-lite`  
    - Temperature: 0 for consistent messaging  
    - System message instructs to compose a pre-filled WhatsApp message including lead name, need, budget, timing, authority, and email.  
    - Inputs: Lead details pulled from last form submission node.  
  - Outputs: Text message string containing WhatsApp message  
  - Failures: API timeouts, malformed output, missing input fields  

- **Phone Number**  
  - Type: Set  
  - Role: Prepares variables for WhatsApp URL, including phone number and the message text.  
  - Configuration:  
    - Sets `whatsapp_phone` (initially null, to be configured with company WhatsApp number).  
    - Sets `first_message` to the generated WhatsApp message text from the previous node.  
  - Outputs: Variables for URL construction  
  - Failures: Missing or incorrect phone number  

- **Send to Whatsapp**  
  - Type: Form node (completion operation)  
  - Role: Redirects the lead to WhatsApp chat URL pre-filled with the generated message.  
  - Configuration:  
    - Redirect URL dynamically constructed as `https://wa.me/{{ $json.whatsapp_phone }}?text={{ $json.first_message.urlEncode() }}`  
    - Responds with HTTP redirect to WhatsApp chat link  
  - Inputs: Variables set in Phone Number node  
  - Outputs: None (end node)  
  - Failures: Incorrect phone number format, URL encoding issues  

---

#### 2.5 Cold Lead Handling

**Overview:**  
Crafts a nurturing email for cold leads, sends it via Gmail, then redirects the user to the company website.

**Nodes Involved:**  
- Redirect to Website  
- Write Follow up Email  
- Simple JSON Parsing (Email)  
- Send Follow up Email with Gmail

**Node Details:**

- **Redirect to Website**  
  - Type: Form node (completion operation)  
  - Role: Redirects cold leads to the company’s main website or resource page after submission.  
  - Configuration:  
    - Redirect URL set to main website (e.g., `https://workflows.ac`)  
    - Responds with HTTP redirect  
  - Inputs: Routed from Switch node "cold" output  
  - Outputs: Triggers email generation node  
  - Failures: Invalid redirect URL  

- **Write Follow up Email**  
  - Type: Google Gemini (PaLM) AI node  
  - Role: Generates a personalized, non-sales nurturing email targeted at cold leads, providing value and resources.  
  - Configuration:  
    - Model: `models/gemini-2.5-flash-lite`  
    - Temperature: 0 for consistency  
    - System message instructs a helpful, friendly tone, including subject and email body in JSON output format.  
    - Inputs: Lead details from last form submission  
  - Outputs: JSON string with email `subject` and `body`  
  - Failures: API errors, malformed JSON output  

- **Simple JSON Parsing (Email)**  
  - Type: Set  
  - Role: Parses the AI email JSON string output into usable JSON for sending.  
  - Configuration: Cleans markdown syntax and parses to JSON object with `subject` and `body` keys.  
  - Inputs: Raw AI response  
  - Outputs: Parsed email JSON  
  - Failures: Parsing errors  

- **Send Follow up Email with Gmail**  
  - Type: Gmail node  
  - Role: Sends the generated nurture email to the lead’s email address.  
  - Configuration:  
    - Recipient: Lead email from form submission  
    - Subject and message body taken from parsed AI output  
    - Email type: Plain text  
    - Credentials: Uses OAuth2 Gmail credentials (configured externally)  
  - Inputs: Parsed email JSON and lead email  
  - Outputs: None (end node)  
  - Failures: Authentication errors, invalid email address, SMTP issues  

---

### 3. Summary Table

| Node Name                   | Node Type                        | Functional Role                         | Input Node(s)                  | Output Node(s)                   | Sticky Note                                                                                     |
|-----------------------------|---------------------------------|---------------------------------------|-------------------------------|---------------------------------|------------------------------------------------------------------------------------------------|
| Lead Contact Form            | Form Trigger                    | Capture lead data from web form       | -                             | Score Lead                      | 💡 Later, activate this workflow and share the public form URL to start collecting leads!      |
| Score Lead                  | Google Gemini (PaLM)            | AI lead scoring using BANT framework  | Lead Contact Form              | Simple JSON Parsing (Lead Score) | This is the brain of your lead qualification! Customize prompt per your sales process.         |
| Simple JSON Parsing (Lead Score) | Set                           | Parse AI JSON lead score output       | Score Lead                    | Switch                         |                                                                                                |
| Switch                      | Switch                         | Route leads by score (hot, mid, cold) | Simple JSON Parsing (Lead Score) | Calendar Booking Link / Write Placeholder WA Message / Redirect to Website | Acts as lead router directing to different engagement paths.                                   |
| Calendar Booking Link       | Form                           | Redirect hot leads to calendar booking | Switch (hot output)            | -                             | Set redirect URL to your calendar booking platform (e.g., Calendly).                           |
| Write Placeholder WA Message | Google Gemini (PaLM)            | Generate WhatsApp message for mid leads | Switch (mid output)            | Phone Number                   | Customize WhatsApp message prompt for personalized outreach.                                  |
| Phone Number                | Set                            | Prepare WhatsApp phone and message    | Write Placeholder WA Message  | Send to Whatsapp               | Set your company's WhatsApp phone number here.                                                |
| Send to Whatsapp            | Form                           | Redirect mid leads to WhatsApp chat   | Phone Number                  | -                             | Redirect URL built dynamically using phone and message.                                      |
| Redirect to Website         | Form                           | Redirect cold leads to main website   | Switch (cold output)           | Write Follow up Email          | Set redirectUrl to your company’s main website or resource page.                              |
| Write Follow up Email       | Google Gemini (PaLM)            | Generate nurturing email for cold leads | Redirect to Website            | Simple JSON Parsing (Email)    | Customize email prompt to provide value and avoid hard sales.                                |
| Simple JSON Parsing (Email) | Set                            | Parse AI JSON email output             | Write Follow up Email          | Send Follow up Email with Gmail |                                                                                                |
| Send Follow up Email with Gmail | Gmail                          | Send nurturing email                   | Simple JSON Parsing (Email)   | -                             | Requires OAuth2 Gmail credentials; sends to lead email.                                      |
| Sticky Note (0)             | Sticky Note                    | Workflow overview and instructions     | -                             | -                             | Describes workflow purpose and setup steps.                                                  |
| Sticky Note (3)             | Sticky Note                    | Reminder to activate form               | -                             | -                             | 💡 Later, activate this workflow and share the public form URL to start collecting leads!      |
| Sticky Note (4)             | Sticky Note                    | Explains Score Lead node prompt         | -                             | -                             | Customize BANT scoring logic per your sales process.                                          |
| Sticky Note (6)             | Sticky Note                    | Explains Switch node function           | -                             | -                             | Switch routes leads into three qualification paths.                                          |
| Sticky Note (7)             | Sticky Note                    | Explains Hot Lead handling              | -                             | -                             | Set calendar booking URL for hot leads.                                                      |
| Sticky Note (8)             | Sticky Note                    | Explains Mid Lead WhatsApp handling    | -                             | -                             | Set WhatsApp phone number and customize message prompt.                                      |
| Sticky Note (11)            | Sticky Note                    | Explains Cold Lead nurturing email flow | -                             | -                             | Set redirect URL for cold leads and customize nurturing email prompt.                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Form Trigger node**  
   - Name: `Lead Contact Form`  
   - Configure webhook path: `n8n-contact-form`  
   - Add form fields:  
     - Full Name (text, required)  
     - Email (email, required)  
     - What would you want to build in n8n? (textarea, required)  
     - What's your budget? (text)  
     - When would you want to start building? (text)  
     - What is your current job? (text)  
   - Optional: Add form description and button label.

2. **Add a Google Gemini (PaLM) node**  
   - Name: `Score Lead`  
   - Credential: Google Gemini (PaLM API) account  
   - Model: `models/gemma-3-27b-it`  
   - Temperature: 0  
   - Messages: Paste the provided BANT scoring prompt, mapping inputs to form fields:  
     - need: `What would you want to build in n8n ?`  
     - budget: `What's you budget ?`  
     - timing: `When would you want to start building ?`  
     - authority: `What is your current job ?`  
   - Connect output from `Lead Contact Form` to this node.

3. **Add a Set node**  
   - Name: `Simple JSON Parsing (Lead Score)`  
   - Mode: Raw  
   - Expression for JSON Output: Clean and parse AI output string to JSON (remove markdown, call `.parseJson()`).  
   - Connect output from `Score Lead` to this node.

4. **Add a Switch node**  
   - Name: `Switch`  
   - Property to check: `$json.score`  
   - Add three rules: equals `"hot"`, `"mid"`, and `"cold"` respectively.  
   - Connect output from `Simple JSON Parsing (Lead Score)` to this node.

5. **Hot Lead Path:**  
   - Add a Form node:  
     - Name: `Calendar Booking Link`  
     - Operation: Completion  
     - Set `redirectUrl` to your calendar booking page (e.g., Calendly).  
     - Connect Switch's `hot` output to this node.

6. **Mid Lead Path:**  
   - Add a Google Gemini (PaLM) node:  
     - Name: `Write Placeholder WA Message`  
     - Credential: Google Gemini (PaLM API)  
     - Model: `models/gemini-2.5-flash-lite`  
     - Temperature: 0  
     - System message: Communications Assistant prompt to generate WhatsApp message from lead’s perspective.  
     - Inputs mapped from the last `Lead Contact Form` submission (full name, email, need, budget, timing, authority).  
     - Connect Switch's `mid` output to this node.  
   - Add a Set node:  
     - Name: `Phone Number`  
     - Assign variables:  
       - `whatsapp_phone`: Set your company’s WhatsApp phone number here (number type).  
       - `first_message`: Set to the WhatsApp message text from `Write Placeholder WA Message`.  
     - Connect output from `Write Placeholder WA Message` to this node.  
   - Add a Form node:  
     - Name: `Send to Whatsapp`  
     - Operation: Completion  
     - Redirect URL expression: `https://wa.me/{{ $json.whatsapp_phone }}?text={{ $json.first_message.urlEncode() }}`  
     - Connect output from `Phone Number` to this node.

7. **Cold Lead Path:**  
   - Add a Form node:  
     - Name: `Redirect to Website`  
     - Operation: Completion  
     - Set `redirectUrl` to your company main website (e.g., `https://workflows.ac`).  
     - Connect Switch's `cold` output to this node.  
   - Add a Google Gemini (PaLM) node:  
     - Name: `Write Follow up Email`  
     - Credential: Google Gemini (PaLM API)  
     - Model: `models/gemini-2.5-flash-lite`  
     - Temperature: 0  
     - System message: Marketing Automation prompt for nurturing cold leads with subject and body JSON output.  
     - Inputs mapped from the last `Lead Contact Form` submission (full name, email, need, budget, timing, authority).  
     - Connect output from `Redirect to Website` to this node.  
   - Add a Set node:  
     - Name: `Simple JSON Parsing (Email)`  
     - Mode: Raw  
     - Expression: Clean and parse AI email output JSON string.  
     - Connect output from `Write Follow up Email` to this node.  
   - Add a Gmail node:  
     - Name: `Send Follow up Email with Gmail`  
     - Credential: OAuth2 Gmail credentials  
     - Send To: Lead's email from form submission  
     - Subject: From parsed email JSON  
     - Message: From parsed email JSON body  
     - Email Type: Plain text  
     - Connect output from `Simple JSON Parsing (Email)` to this node.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                 | Context or Link                                                            |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------|
| Workflow intelligently qualifies leads using BANT and routes them to calendar booking, WhatsApp chat, or nurturing email.                                                                                                    | Workflow Purpose Overview                                                 |
| Customize the `Score Lead` prompt to reflect your specific sales process and ideal customer profile.                                                                                                                         | Sticky Note (4)                                                           |
| Set your calendar booking link in `Calendar Booking Link` node to enable hot leads to schedule calls.                                                                                                                       | Sticky Note (7)                                                           |
| Set your company WhatsApp phone number in `Phone Number` node and customize WhatsApp message prompt to engage mid leads effectively.                                                                                      | Sticky Note (8)                                                           |
| Set redirect URL in `Redirect to Website` node for cold leads to land on a helpful resource or homepage. Customize nurturing email prompt to add value and avoid pushy sales tactics.                                        | Sticky Note (11)                                                          |
| Activate the `Lead Contact Form` webhook and share its URL publicly to start collecting leads.                                                                                                                               | Sticky Note (3)                                                           |
| For feedback, coaching, or custom workflows, contact the creator via the unified AI-powered contact form at https://template.workflows.ac?source=Lead%20Form%20Routing                                                        | Workflow Overview Sticky Note                                            |

---

**Disclaimer:** The text provided originates exclusively from an automated workflow created with n8n, respecting all current content policies. It contains no illegal, offensive, or protected elements. All data processed is legal and public.