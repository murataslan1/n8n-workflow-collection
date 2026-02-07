AI Fitness Coach Strava Data Analysis and Personalized Training Insights

https://n8nworkflows.xyz/workflows/ai-fitness-coach-strava-data-analysis-and-personalized-training-insights-2790


# AI Fitness Coach Strava Data Analysis and Personalized Training Insights

### 1. Workflow Overview

This workflow, titled **"AI Fitness Coach Strava Data Analysis and Personalized Training Insights"**, is designed to serve as a virtual triathlon coach by integrating with Strava to analyze athlete activity data and generate personalized training insights. It targets triathletes and coaches who want automated, AI-driven feedback on swimming, cycling, and running activities, delivered via email or WhatsApp.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Captures real-time activity updates from Strava.
- **1.2 Data Preprocessing:** Flattens and structures raw Strava JSON data for AI consumption.
- **1.3 AI Analysis:** Uses Google Gemini and a custom LangChain agent to analyze data and generate coaching insights.
- **1.4 Output Structuring:** Transforms AI text output into structured JSON elements (headings, lists, paragraphs).
- **1.5 HTML Conversion:** Converts structured JSON into HTML format for presentation.
- **1.6 Communication:** Sends the personalized insights via email and optionally WhatsApp.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block listens for activity updates from Strava, triggering the workflow whenever an athlete records or modifies an activity. It ensures real-time synchronization with Strava’s API.

- **Nodes Involved:**  
  - `Strava Trigger`

- **Node Details:**

  - **Strava Trigger**  
    - *Type:* Trigger node for Strava API events  
    - *Configuration:* Listens to "update" events on "activity" objects; uses OAuth2 credentials linked to a Strava developer account.  
    - *Expressions/Variables:* None (event-driven)  
    - *Input:* None (trigger node)  
    - *Output:* Emits raw Strava activity JSON data on each update event  
    - *Version:* 1  
    - *Edge Cases:*  
      - OAuth token expiration or revocation  
      - API rate limits or downtime  
      - Missing or incomplete activity data  
    - *Sticky Note:*  
      - Instructions for obtaining Strava API key at https://developers.strava.com/  
      - Explains that captured data will be structured downstream  

---

#### 2.2 Data Preprocessing

- **Overview:**  
  This block flattens the nested JSON activity data into a readable string format, making it easier for the AI model to parse and analyze.

- **Nodes Involved:**  
  - `Code` (named "Code")  
  - `Combine Everything`

- **Node Details:**

  - **Code**  
    - *Type:* Code node (JavaScript)  
    - *Configuration:* Adds a dummy field `myNewField` with value 1 to each input item (likely placeholder or test code).  
    - *Input:* Raw data from `Strava Trigger`  
    - *Output:* Passes modified data downstream unchanged except for added field  
    - *Version:* 2  
    - *Edge Cases:* Minimal risk; code is simple and synchronous.

  - **Combine Everything**  
    - *Type:* Code node (JavaScript)  
    - *Configuration:* Implements a recursive function to flatten all nested JSON keys into a single string with key paths and values, separated by newlines and records separated by "---".  
    - *Key Logic:*  
      - Recursively traverses JSON objects  
      - Concatenates keys with dot notation  
      - Produces a clean, flattened string representing all activity data  
    - *Input:* Output from `Code` node  
    - *Output:* Single JSON object with `data` field containing the flattened string  
    - *Version:* 2  
    - *Edge Cases:*  
      - Deeply nested or very large JSON could cause performance issues  
      - Non-serializable values (e.g., functions) would be ignored  
      - Null or undefined values handled gracefully  
    - *Sticky Note:* None

---

#### 2.3 AI Analysis

- **Overview:**  
  This block uses Google Gemini’s language model and a custom LangChain conversational agent to analyze the flattened activity data, identify key performance metrics, and generate personalized coaching feedback.

- **Nodes Involved:**  
  - `Google Gemini Chat Model`  
  - `Fitness Coach`

- **Node Details:**

  - **Google Gemini Chat Model**  
    - *Type:* AI language model node (Google Gemini via LangChain)  
    - *Configuration:* Uses model `models/gemini-2.0-flash-exp` with default options; credentials linked to Google PaLM API.  
    - *Input:* Flattened activity data string from `Combine Everything` node  
    - *Output:* AI-generated textual response with coaching insights  
    - *Version:* 1  
    - *Edge Cases:*  
      - API quota limits or authentication errors  
      - Model response latency or timeouts  
      - Unexpected or malformed input data affecting output quality  
    - *Sticky Note:*  
      - Notes that this is connected to Gemini 2.0 Flash  

  - **Fitness Coach**  
    - *Type:* LangChain conversational agent node  
    - *Configuration:*  
      - Custom prompt defining the agent as a Triathlon Coach specializing in running, swimming, and cycling.  
      - Detailed instructions to analyze metrics like pace, heart rate, cadence, SWOLF, power zones, elevation, etc.  
      - Provides motivational, data-driven, and personalized feedback tailored to user goals and experience.  
      - Input includes the flattened Strava data string injected into the prompt.  
    - *Input:* Output from `Google Gemini Chat Model` node (AI text)  
    - *Output:* Refined AI coaching response text  
    - *Version:* 1.7  
    - *Edge Cases:*  
      - Prompt misinterpretation or incomplete data leading to generic advice  
      - Long or complex inputs causing truncation or loss of context  
      - Agent failure or LangChain integration issues  
    - *Sticky Note:*  
      - Describes the AI Triathlon Coach capabilities and context awareness in detail  

---

#### 2.4 Output Structuring

- **Overview:**  
  This block parses the AI-generated text response into structured JSON elements representing headings, paragraphs, bullet lists, and numbered lists for better formatting.

- **Nodes Involved:**  
  - `Structure Output`

- **Node Details:**

  - **Structure Output**  
    - *Type:* Code node (JavaScript)  
    - *Configuration:*  
      - Splits AI text by double newlines to identify sections  
      - Detects markdown-like syntax:  
        - `**bold**` for headings  
        - Lines starting with `*` for bullet lists  
        - Lines starting with digits + dot for numbered lists  
      - Converts these into JSON objects with types: `heading`, `paragraph`, `list`, `numbered-list`  
    - *Input:* AI text from `Fitness Coach` node  
    - *Output:* Array of JSON objects representing structured content  
    - *Version:* 2  
    - *Edge Cases:*  
      - Unexpected text formatting may cause misclassification  
      - Empty or malformed input results in empty output  
    - *Sticky Note:*  
      - Notes that this node structures data and prepares it for HTML conversion  

---

#### 2.5 HTML Conversion

- **Overview:**  
  Converts the structured JSON content into an HTML string suitable for email or messaging presentation.

- **Nodes Involved:**  
  - `Conver to HTML` (typo in node name)

- **Node Details:**

  - **Conver to HTML**  
    - *Type:* Code node (JavaScript)  
    - *Configuration:*  
      - Iterates over structured JSON items  
      - Converts each type to corresponding HTML tags:  
        - `paragraph` → `<p>`  
        - `heading` → `<h2>`  
        - `list` → `<ul><li>`  
        - `numbered-list` → `<ol><li>`  
      - Concatenates all into a single HTML string  
    - *Input:* Output from `Structure Output` node  
    - *Output:* Single JSON object with `html` field containing the full HTML string  
    - *Version:* 2  
    - *Edge Cases:*  
      - Malformed JSON input could cause empty or broken HTML  
      - Special characters not escaped (assumed safe from AI output)  
    - *Sticky Note:*  
      - Indicates this node converts structured data to HTML  

---

#### 2.6 Communication

- **Overview:**  
  Sends the personalized training insights to the athlete via email and optionally via WhatsApp for instant notifications.

- **Nodes Involved:**  
  - `Send Email`  
  - `WhatsApp Business Cloud` (optional)

- **Node Details:**

  - **Send Email**  
    - *Type:* Email Send node  
    - *Configuration:*  
      - Sends email with subject "New Activity on Strava"  
      - Email body is the HTML content from `Conver to HTML` node  
      - Recipient and sender emails configured (example uses placeholders)  
      - Uses SMTP credentials (OCI Amjid SMTP)  
      - Attribution disabled for cleaner emails  
    - *Input:* HTML from `Conver to HTML` node  
    - *Output:* None (terminal node)  
    - *Version:* 2.1  
    - *Edge Cases:*  
      - SMTP authentication failure or connectivity issues  
      - Invalid recipient email address  
      - Large email size or malformed HTML causing delivery issues  
    - *Sticky Note:*  
      - Mentions sending personalized responses via email or other channels  

  - **WhatsApp Business Cloud**  
    - *Type:* WhatsApp messaging node  
    - *Configuration:*  
      - Sends a summary message (configuration details minimal, likely requires customization)  
      - Uses WhatsApp Business Cloud API credentials  
    - *Input:* Not explicitly connected in the provided JSON but intended as optional notification channel  
    - *Output:* None (terminal node)  
    - *Version:* 1  
    - *Edge Cases:*  
      - API limits or authentication errors  
      - Message formatting or length restrictions  
      - Recipient phone number configuration required  
    - *Sticky Note:* None

---

### 3. Summary Table

| Node Name             | Node Type                          | Functional Role                          | Input Node(s)        | Output Node(s)          | Sticky Note                                                                                                  |
|-----------------------|----------------------------------|----------------------------------------|----------------------|-------------------------|--------------------------------------------------------------------------------------------------------------|
| Strava Trigger        | n8n-nodes-base.stravaTrigger     | Captures Strava activity updates       | None (trigger)       | Code                    | Instructions for Strava API key setup: https://developers.strava.com/                                        |
| Code                  | n8n-nodes-base.code              | Adds dummy field, passes data           | Strava Trigger       | Combine Everything       |                                                                                                              |
| Combine Everything     | n8n-nodes-base.code              | Flattens nested JSON activity data      | Code                 | Google Gemini Chat Model |                                                                                                              |
| Google Gemini Chat Model | @n8n/n8n-nodes-langchain.lmChatGoogleGemini | AI model analyzing activity data       | Combine Everything   | Fitness Coach            | Connected to Gemini 2.0 Flash                                                                                 |
| Fitness Coach         | @n8n/n8n-nodes-langchain.agent  | Conversational AI coach generating insights | Google Gemini Chat Model | Structure Output         | Detailed AI Triathlon Coach capabilities and context awareness                                               |
| Structure Output      | n8n-nodes-base.code              | Parses AI text into structured JSON     | Fitness Coach        | Conver to HTML           | Structures data and converts to HTML                                                                         |
| Conver to HTML        | n8n-nodes-base.code              | Converts structured JSON to HTML        | Structure Output     | Send Email               | Converts structured data to HTML                                                                              |
| Send Email            | n8n-nodes-base.emailSend         | Sends email with training insights      | Conver to HTML       | None                    | Sends personalized response via email or other channels                                                      |
| WhatsApp Business Cloud | n8n-nodes-base.whatsApp          | Optional WhatsApp notification           | (Not connected)      | None                    |                                                                                                              |
| Sticky Note           | n8n-nodes-base.stickyNote        | Informational notes                      | None                 | None                    | Multiple notes covering AI coach description, Strava setup, HTML conversion, and developer credits           |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Strava Trigger Node**  
   - Type: `Strava Trigger`  
   - Event: `update`  
   - Object: `activity`  
   - Credentials: Configure OAuth2 with your Strava developer API key  
   - Position: Leftmost node, trigger start of workflow

2. **Add Code Node ("Code")**  
   - Type: `Code` (JavaScript)  
   - Purpose: Add a dummy field or preprocess if needed (optional)  
   - Code snippet:  
     ```js
     for (const item of $input.all()) {
       item.json.myNewField = 1;
     }
     return $input.all();
     ```  
   - Connect output of `Strava Trigger` to this node

3. **Add Code Node ("Combine Everything")**  
   - Type: `Code` (JavaScript)  
   - Purpose: Flatten nested JSON activity data into a string  
   - Code snippet:  
     ```js
     function flattenJson(obj, prefix = '') {
       let str = '';
       for (const key in obj) {
         if (typeof obj[key] === 'object' && obj[key] !== null) {
           str += flattenJson(obj[key], `${prefix}${key}.`);
         } else {
           str += `${prefix}${key}: ${obj[key]}\n`;
         }
       }
       return str;
     }
     const data = $input.all();
     let output = '';
     data.forEach(item => {
       output += flattenJson(item.json);
       output += '\n---\n';
     });
     return [{ json: { data: output } }];
     ```  
   - Connect output of `Code` node to this node

4. **Add Google Gemini Chat Model Node**  
   - Type: `@n8n/n8n-nodes-langchain.lmChatGoogleGemini`  
   - Model Name: `models/gemini-2.0-flash-exp`  
   - Credentials: Google PaLM API credentials  
   - Connect output of `Combine Everything` node to this node

5. **Add LangChain Agent Node ("Fitness Coach")**  
   - Type: `@n8n/n8n-nodes-langchain.agent`  
   - Prompt: Use the detailed triathlon coach prompt provided, injecting the flattened data as `{{ $json.data }}`  
   - Agent Type: `conversationalAgent`  
   - Connect AI output from `Google Gemini Chat Model` node to this node

6. **Add Code Node ("Structure Output")**  
   - Type: `Code` (JavaScript)  
   - Purpose: Parse AI text into structured JSON elements  
   - Code snippet:  
     ```js
     const input = $json.output;
     const sections = input.split('\n\n');
     const result = [];
     sections.forEach((section) => {
       const trimmedSection = section.trim();
       if (/^\*\*(.*?)\*\*$/.test(trimmedSection)) {
         result.push({ type: 'heading', content: trimmedSection.replace(/\*\*(.*?)\*\*/, '<b>$1</b>') });
       } else if (trimmedSection.startsWith('*')) {
         const listItems = trimmedSection.split('\n').map(item => item.trim().replace(/^\*\s/, ''));
         result.push({ type: 'list', items: listItems });
       } else if (/^\d+\.\s/.test(trimmedSection)) {
         const numberedItems = trimmedSection.split('\n').map(item => item.trim().replace(/^\d+\.\s/, ''));
         result.push({ type: 'numbered-list', items: numberedItems });
       } else {
         result.push({ type: 'paragraph', content: trimmedSection });
       }
     });
     return result.map(item => ({ json: item }));
     ```  
   - Connect output of `Fitness Coach` node to this node

7. **Add Code Node ("Conver to HTML")**  
   - Type: `Code` (JavaScript)  
   - Purpose: Convert structured JSON to HTML string  
   - Code snippet:  
     ```js
     const inputData = $input.all();
     function convertToHTML(data) {
       let html = '';
       data.forEach(item => {
         switch (item.json.type) {
           case 'paragraph':
             html += `<p>${item.json.content}</p>`;
             break;
           case 'heading':
             html += `<h2>${item.json.content}</h2>`;
             break;
           case 'list':
             html += '<ul>';
             item.json.items.forEach(li => { html += `<li>${li}</li>`; });
             html += '</ul>';
             break;
           case 'numbered-list':
             html += '<ol>';
             item.json.items.forEach(li => { html += `<li>${li}</li>`; });
             html += '</ol>';
             break;
         }
       });
       return html;
     }
     const singleHTML = convertToHTML(inputData);
     return [{ json: { html: singleHTML } }];
     ```  
   - Connect output of `Structure Output` node to this node

8. **Add Email Send Node ("Send Email")**  
   - Type: `Email Send`  
   - Parameters:  
     - Subject: `"New Activity on Strava"`  
     - HTML Body: `={{ $json.html }}` (from previous node)  
     - To Email: Athlete’s email address (customize)  
     - From Email: e.g., `"Fitness Coach <email@example.com>"`  
   - Credentials: SMTP or Gmail OAuth2 configured with valid email account  
   - Connect output of `Conver to HTML` node to this node

9. **Optional: Add WhatsApp Business Cloud Node**  
   - Type: `WhatsApp`  
   - Operation: `send`  
   - Credentials: WhatsApp Business Cloud API credentials  
   - Configure message content with summary or key insights (customize as needed)  
   - Connect output of `Conver to HTML` or `Fitness Coach` node as appropriate

10. **Deploy and Test**  
    - Ensure all credentials are valid and authorized  
    - Test by triggering Strava activity update  
    - Verify email and WhatsApp delivery and content formatting

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                  | Context or Link                                   |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------|
| AI Triathlon Coach is a data-driven virtual assistant analyzing Strava data for swimming, cycling, and running, providing motivational and personalized coaching. Connected to Gemini 2.0 Flash.                                               | Sticky Note near AI nodes                         |
| Strava API key setup instructions: https://developers.strava.com/                                                                                                                                                                            | Sticky Note near Strava Trigger                    |
| HTML conversion node structures AI output for clear presentation in emails or messaging.                                                                                                                                                     | Sticky Note near Structure Output and Conver to HTML nodes |
| Developed by Amjid Ali. Support and resources available via: PayPal http://paypal.me/pmptraining, SyncBricks LMS http://lms.syncbricks.com, YouTube channel http://youtube.com/@syncbricks                                                  | Sticky Note near workflow start                    |
| Workflow enables customization of AI prompts, email, and WhatsApp messaging to tailor coaching to athlete goals and preferences.                                                                                                           | Workflow description section                       |
| Performance metrics handled include swimming (SWOLF, stroke count), cycling (cadence, power zones), and running (pace, stride length).                                                                                                       | Workflow description section                       |

---

This comprehensive documentation enables advanced users and AI agents to fully understand, reproduce, and extend the AI Fitness Coach workflow integrating Strava data with Google Gemini AI for personalized triathlon coaching.