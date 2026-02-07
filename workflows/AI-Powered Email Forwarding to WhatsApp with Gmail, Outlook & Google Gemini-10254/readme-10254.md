AI-Powered Email Forwarding to WhatsApp with Gmail, Outlook & Google Gemini

https://n8nworkflows.xyz/workflows/ai-powered-email-forwarding-to-whatsapp-with-gmail--outlook---google-gemini-10254


# AI-Powered Email Forwarding to WhatsApp with Gmail, Outlook & Google Gemini

### 1. Workflow Overview

This workflow automates forwarding emails from multiple email services (Gmail and two Outlook accounts—personal and business) to WhatsApp using AI-powered formatting and filtering via Google Gemini. It targets users who want critical or personalized email notifications delivered as WhatsApp messages, with automatic language translation and spam filtering.

**Use Cases:**
- Multi-account email monitoring (Gmail, Outlook personal, Outlook business)
- AI-based email content filtering, classification, and formatting for WhatsApp readability
- Automatic marking emails as read after processing
- Prioritization of security-related and activation emails
- Translation to Arabic for non-Arabic/English emails
- Forwarding only relevant messages to WhatsApp with direct links extracted

**Logical Blocks:**

- **1.1 Gmail Email Reception and Processing:** Trigger from Gmail, parse email, AI filter & format, mark as read, send to WhatsApp.
- **1.2 Outlook Personal Email Reception and Processing:** Trigger from Outlook personal account, mark as read, parse email, AI filter & format, send to WhatsApp.
- **1.3 Outlook Business Email Reception and Processing:** Trigger from Outlook business account, mark as read, parse email, AI filter & format, send to WhatsApp.
- **1.4 AI Formatting and Filtering (Google Gemini):** Common AI language model agent nodes for Gmail and both Outlook accounts, applying customized prompts for each account type.
- **1.5 WhatsApp Forwarding via Evolution API:** Nodes sending the formatted messages to WhatsApp numbers.
- **1.6 Mark as Read Operations:** Nodes marking emails as read in respective accounts after processing.

---

### 2. Block-by-Block Analysis

#### 1.1 Gmail Email Reception and Processing

- **Overview:**  
  Listens for new emails in Gmail, extracts and cleans email data, applies AI filtering and formatting, marks email as read, and forwards the formatted message to WhatsApp.

- **Nodes Involved:**  
  - Gmail Trigger  
  - Parse Gmail Data  
  - Filter & Format Email (Gmail)  
  - Google Gemini Chat Model (AI model)  
  - Mark as Read (Gmail)  
  - Send to WhatsApp (Gmail)  

- **Node Details:**

  - **Gmail Trigger**  
    - Type: Trigger node monitoring Gmail inbox for new emails every minute.  
    - Configuration: Full email data output (simple: false), polling every minute.  
    - Credentials: Gmail OAuth2.  
    - Inputs: N/A (trigger).  
    - Outputs: Email raw data to "Parse Gmail Data".  
    - Failures: Connectivity issues, auth token expiration, Gmail API limits.  

  - **Parse Gmail Data**  
    - Type: Code node (JavaScript).  
    - Role: Extracts email sender, subject, date (formatted in Arabic locale), and decodes multipart email body (plain text and HTML).  
    - Key logic: Recursively collects text/plain and text/html parts, concatenates them, falls back to snippet if no body found.  
    - Inputs: Raw Gmail email data from trigger.  
    - Outputs: Simplified JSON with from, subject, date, body.  
    - Failures: Missing email data, unexpected email structure.  

  - **Filter & Format Email (Gmail)**  
    - Type: LangChain Agent node using Google Gemini Chat Model.  
    - Role: AI-powered formatter and filter, converts email JSON into a WhatsApp-ready message text per detailed prompt instructions (includes translation rules and spam filtering).  
    - Prompt: Customized for Gmail emails, instructing to forward critical messages, approved senders, and ignore ads.  
    - Inputs: Parsed email JSON.  
    - Outputs: Formatted WhatsApp message text.  
    - Failures: AI API errors, prompt misinterpretation, rate limits.  

  - **Google Gemini Chat Model**  
    - Type: Language model node (Google Gemini).  
    - Role: Executes the AI prompt for Gmail email formatting.  
    - Credentials: Google Palm API.  
    - Inputs: Email JSON from "Parse Gmail Data".  
    - Outputs: AI-generated formatted text to "Filter & Format Email (Gmail)".  
    - Failures: API connectivity, quota limits, malformed prompt.  

  - **Mark as Read (Gmail)**  
    - Type: Gmail node.  
    - Role: Marks the processed email as read in Gmail.  
    - Parameters: Uses the email ID from the Gmail Trigger node.  
    - Credentials: Gmail OAuth2.  
    - Inputs: Formatted email message (trigger context for ID).  
    - Outputs: None downstream (terminal for marking).  
    - Failures: Permission errors, message ID missing, API rate limits.  

  - **Send to WhatsApp (Gmail)**  
    - Type: Evolution API node (WhatsApp messaging).  
    - Role: Sends the AI-formatted email message text to a specified WhatsApp number via Evolution API.  
    - Parameters: Uses the formatted message text output by AI agent.  
    - Credentials: Evolution API.  
    - Inputs: Formatted message text.  
    - Outputs: None downstream.  
    - Failures: Evolution API errors, invalid WhatsApp number, network issues.  

---

#### 1.2 Outlook Personal Email Reception and Processing

- **Overview:**  
  Monitors Outlook personal mailbox for new emails, marks them as read, parses and cleans email content, applies AI formatting and filtering, then forwards to WhatsApp.

- **Nodes Involved:**  
  - Microsoft Outlook Trigger  
  - Mark as Read (Outlook Personal)  
  - Parse Outlook Personal Data  
  - Filter & Format Email (Outlook Personal)  
  - Google Gemini Chat Model1  
  - Send to WhatsApp (Outlook Personal)  

- **Node Details:**

  - **Microsoft Outlook Trigger**  
    - Type: Trigger node for Outlook personal account.  
    - Configuration: Raw output, polling every minute.  
    - Credentials: Microsoft Outlook OAuth2.  
    - Inputs: N/A (trigger).  
    - Outputs: Raw Outlook email JSON.  
    - Failures: Auth errors, API throttling, connection drops.  

  - **Mark as Read (Outlook Personal)**  
    - Type: HTTP Request node.  
    - Role: Patches the Outlook message to set "isRead" to true via Microsoft Graph API.  
    - URL: Constructed with message ID from trigger.  
    - Credentials: Microsoft Outlook OAuth2.  
    - Inputs: Raw Outlook email JSON.  
    - Outputs: Passes the message data to the parser.  
    - Failures: API permission issues, invalid message ID, network errors.  

  - **Parse Outlook Personal Data**  
    - Type: Code node.  
    - Role: Extracts sender, subject, date (formatted Arabic locale), classification (focused/other), and cleans email body (decoding HTML entities, stripping styles/scripts).  
    - Inputs: Outlook raw email JSON.  
    - Outputs: Simplified JSON with id, from, subject, date, classification, body, and raw HTML content.  
    - Failures: Missing data, unexpected content types, decoding errors.  

  - **Filter & Format Email (Outlook Personal)**  
    - Type: LangChain Agent node using Google Gemini.  
    - Role: AI-based formatter and filter with prompt tailored for Outlook personal emails, including rules for forwarding, language translation, link extraction, and spam filtering.  
    - Inputs: Parsed email JSON from code node.  
    - Outputs: WhatsApp message text.  
    - Failures: AI API errors, prompt logic issues.  

  - **Google Gemini Chat Model1**  
    - Type: Google Gemini language model node.  
    - Role: Executes AI prompt for formatting Outlook personal emails.  
    - Credentials: Google Palm API.  
    - Inputs: Parsed email JSON.  
    - Outputs: Formatted message text to the agent node.  
    - Failures: API connectivity, quota issues.  

  - **Send to WhatsApp (Outlook Personal)**  
    - Type: Evolution API node.  
    - Role: Sends the formatted message text to WhatsApp (personal number).  
    - Inputs: Formatted WhatsApp text.  
    - Credentials: Evolution API.  
    - Failures: API errors, invalid number, connection errors.  

---

#### 1.3 Outlook Business Email Reception and Processing

- **Overview:**  
  Monitors Outlook business mailbox, marks messages as read, parses & cleans data, applies AI formatting and filtering, and forwards messages to a business WhatsApp number.

- **Nodes Involved:**  
  - Microsoft Outlook Trigger1  
  - Mark as Read (Outlook Business)  
  - Parse Outlook Business Data  
  - Filter & Format Email (Outlook Business)  
  - Google Gemini Chat Model3  
  - Send to WhatsApp (Outlook Business)  

- **Node Details:**

  - **Microsoft Outlook Trigger1**  
    - Type: Trigger node for Outlook business account.  
    - Configuration: Raw output, polling every minute.  
    - Credentials: Microsoft Outlook OAuth2.  
    - Inputs: N/A (trigger).  
    - Outputs: Raw Outlook business email JSON.  
    - Failures: Same as Outlook personal trigger.  

  - **Mark as Read (Outlook Business)**  
    - Type: HTTP Request node (PATCH).  
    - Role: Marks the business email as read via Microsoft Graph API.  
    - URL uses email ID from trigger.  
    - Credentials: Microsoft Outlook OAuth2.  
    - Inputs: Raw email JSON.  
    - Outputs: Passes to parse node.  
    - Failures: API errors, permission issues.  

  - **Parse Outlook Business Data**  
    - Type: Code node.  
    - Role: Similar to personal parse node; decodes HTML, strips scripts/styles, formats date, extracts classification, and outputs simplified JSON.  
    - Inputs: Raw business email JSON.  
    - Outputs: Parsed JSON for AI formatting.  
    - Failures: Same as personal parse node.  

  - **Filter & Format Email (Outlook Business)**  
    - Type: LangChain Agent node using Google Gemini.  
    - Role: AI formatting with prompt tuned for Outlook business emails, applying same forwarding rules and translation as personal.  
    - Inputs: Parsed business email JSON.  
    - Outputs: WhatsApp-formatted message text.  
    - Failures: AI errors, prompt issues.  

  - **Google Gemini Chat Model3**  
    - Type: Google Gemini language model node.  
    - Role: Executes AI prompt for Outlook business emails.  
    - Credentials: Google Palm API.  
    - Inputs: Parsed email JSON.  
    - Outputs: Message text to agent node.  
    - Failures: Connectivity and quota issues.  

  - **Send to WhatsApp (Outlook Business)**  
    - Type: Evolution API node.  
    - Role: Sends formatted email message to business WhatsApp number.  
    - Inputs: Formatted WhatsApp message text.  
    - Credentials: Evolution API.  
    - Failures: API errors, invalid number.  

---

#### 1.4 AI Formatting and Filtering (Google Gemini)

- **Overview:**  
  Central AI language model nodes that process parsed email JSON for formatting into WhatsApp-friendly messages, including language translation and spam filtering.

- **Nodes Involved:**  
  - Google Gemini Chat Model (Gmail)  
  - Google Gemini Chat Model1 (Outlook Personal)  
  - Google Gemini Chat Model3 (Outlook Business)  

- **Node Details:**

  Each node uses Google Gemini API with specific prompt and system messages tailored for the email source. They convert email fields into concise WhatsApp messages, handle language translation rules, extract URLs, and apply filtering to avoid spam/ads.

  - Inputs: Parsed JSON from respective parse nodes.  
  - Outputs: Formatted WhatsApp message text.  
  - Failures: API limits, prompt errors, malformed input JSON.  

---

#### 1.5 WhatsApp Forwarding via Evolution API

- **Overview:**  
  Sends the final AI-formatted WhatsApp message text to the user’s WhatsApp number(s) using Evolution API.

- **Nodes Involved:**  
  - Send to WhatsApp (Gmail)  
  - Send to WhatsApp (Outlook Personal)  
  - Send to WhatsApp (Outlook Business)  

- **Node Details:**

  - Type: Evolution API nodes configured for WhatsApp messaging endpoint.  
  - Parameters: Includes remoteJid (WhatsApp number with suffix), instanceName (custom instance), and messageText from AI output.  
  - Credentials: Evolution API account.  
  - Inputs: Formatted WhatsApp text from AI agent nodes.  
  - Outputs: Terminal nodes, no further output.  
  - Failures: API unreachable, invalid phone number, message delivery failures.  

---

#### 1.6 Mark as Read Operations

- **Overview:**  
  Marks emails as read after processing to avoid reprocessing the same messages.

- **Nodes Involved:**  
  - Mark as Read (Gmail)  
  - Mark as Read (Outlook Personal)  
  - Mark as Read (Outlook Business)  

- **Node Details:**

  - Gmail: Uses Gmail node “markAsRead” operation with message ID.  
  - Outlook: Uses HTTP PATCH requests to Microsoft Graph API with `isRead: true`.  
  - Inputs: Email IDs from respective triggers.  
  - Outputs: Pass-through to parsing nodes (Outlook) or terminal (Gmail).  
  - Failures: API permission errors, network timeouts, invalid message IDs.  

---

### 3. Summary Table

| Node Name                  | Node Type                          | Functional Role                           | Input Node(s)                | Output Node(s)                          | Sticky Note                                                                                                                                                |
|----------------------------|----------------------------------|-----------------------------------------|-----------------------------|----------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Gmail Trigger              | Gmail Trigger                    | Triggers on new Gmail emails             | N/A                         | Parse Gmail Data                       | 📬 GMAIL → WHATSAPP Setup: Gmail OAuth2 credential, update phone in "Send to WhatsApp (Gmail)" node                                                         |
| Parse Gmail Data           | Code                            | Extracts and cleans Gmail email content | Gmail Trigger               | Filter & Format Email (Gmail)          |                                                                                                                                                            |
| Filter & Format Email (Gmail) | LangChain Agent (AI)             | AI formats and filters Gmail email       | Parse Gmail Data            | Mark as Read (Gmail), Send to WhatsApp (Gmail) |                                                                                                                                                            |
| Google Gemini Chat Model   | Google Gemini LM Chat            | AI language model for Gmail formatting   | Filter & Format Email (Gmail) (ai_languageModel) | Filter & Format Email (Gmail) (ai_languageModel) |                                                                                                                                                            |
| Mark as Read (Gmail)       | Gmail Node                      | Marks Gmail email as read                 | Filter & Format Email (Gmail) | None                                  |                                                                                                                                                            |
| Send to WhatsApp (Gmail)   | Evolution API (WhatsApp)         | Sends WhatsApp message for Gmail emails  | Filter & Format Email (Gmail) | None                                  |                                                                                                                                                            |
| Microsoft Outlook Trigger  | Outlook Trigger                  | Triggers on new Outlook personal emails  | N/A                         | Mark as Read (Outlook Personal)        | 📬 OUTLOOK PERSONAL → WHATSAPP Setup: Same Outlook credential, update phone in "Send to WhatsApp (Outlook Personal)" node                                  |
| Mark as Read (Outlook Personal) | HTTP Request (PATCH)             | Marks Outlook personal email as read     | Microsoft Outlook Trigger   | Parse Outlook Personal Data             |                                                                                                                                                            |
| Parse Outlook Personal Data | Code                            | Extracts and cleans Outlook personal email | Mark as Read (Outlook Personal) | Filter & Format Email (Outlook Personal) |                                                                                                                                                            |
| Filter & Format Email (Outlook Personal) | LangChain Agent (AI)             | AI formats and filters Outlook personal email | Parse Outlook Personal Data | Send to WhatsApp (Outlook Personal)    |                                                                                                                                                            |
| Google Gemini Chat Model1  | Google Gemini LM Chat            | AI model for Outlook personal email      | Filter & Format Email (Outlook Personal) (ai_languageModel) | Filter & Format Email (Outlook Personal) (ai_languageModel) |                                                                                                                                                            |
| Send to WhatsApp (Outlook Personal) | Evolution API (WhatsApp)         | Sends WhatsApp message for Outlook personal | Filter & Format Email (Outlook Personal) | None                                  |                                                                                                                                                            |
| Microsoft Outlook Trigger1 | Outlook Trigger                  | Triggers on new Outlook business emails  | N/A                         | Mark as Read (Outlook Business)        | 📬 OUTLOOK BUSINESS → WHATSAPP Setup: Outlook OAuth2 credential, update phone in "Send to WhatsApp (Outlook Business)" node                               |
| Mark as Read (Outlook Business) | HTTP Request (PATCH)             | Marks Outlook business email as read     | Microsoft Outlook Trigger1  | Parse Outlook Business Data             |                                                                                                                                                            |
| Parse Outlook Business Data | Code                            | Extracts and cleans Outlook business email | Mark as Read (Outlook Business) | Filter & Format Email (Outlook Business) |                                                                                                                                                            |
| Filter & Format Email (Outlook Business) | LangChain Agent (AI)             | AI formats and filters Outlook business email | Parse Outlook Business Data | Send to WhatsApp (Outlook Business)    |                                                                                                                                                            |
| Google Gemini Chat Model3  | Google Gemini LM Chat            | AI model for Outlook business email      | Filter & Format Email (Outlook Business) (ai_languageModel) | Filter & Format Email (Outlook Business) (ai_languageModel) |                                                                                                                                                            |
| Send to WhatsApp (Outlook Business) | Evolution API (WhatsApp)         | Sends WhatsApp message for Outlook business | Filter & Format Email (Outlook Business) | None                                  |                                                                                                                                                            |
| Sticky Note                | Sticky Note                     | Overview and setup instructions          | N/A                         | N/A                                   | 📧 EMAIL TO WHATSAPP AUTOMATION: Gmail + 2 Outlook accounts, AI filtering, Arabic translation, spam filtering, setup instructions                        |
| Sticky Note1               | Sticky Note                     | Gmail workflow setup note                 | N/A                         | N/A                                   | 📬 GMAIL → WHATSAPP: Monitors Gmail → AI filters → Sends to WhatsApp, setup Gmail OAuth2 credential, update phone number                                 |
| Sticky Note2               | Sticky Note                     | Outlook Personal workflow setup note      | N/A                         | N/A                                   | 📬 OUTLOOK PERSONAL → WHATSAPP: Monitors personal account, same Outlook credential, update phone number                                                  |
| Sticky Note3               | Sticky Note                     | Outlook Business workflow setup note      | N/A                         | N/A                                   | 📬 OUTLOOK BUSINESS → WHATSAPP: Monitors business account, Outlook OAuth2 credential, update phone number                                               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Gmail Trigger Node:**  
   - Type: Gmail Trigger  
   - Credentials: Configure Gmail OAuth2  
   - Parameters: simple = false, output full email data  
   - Polling: every minute  

2. **Add Code Node "Parse Gmail Data":**  
   - Paste provided JS code to extract sender, subject, date (Arabic locale), and decode multipart email body.  
   - Input: Connect from Gmail Trigger output.  

3. **Add LangChain Agent Node "Filter & Format Email (Gmail)":**  
   - Type: @n8n/n8n-nodes-langchain.agent  
   - Configuration: Use the provided prompt text targeting Gmail emails for WhatsApp formatting, including Arabic translation and spam filtering rules.  
   - Input: Connect from "Parse Gmail Data".  

4. **Add Google Gemini Chat Model Node:**  
   - Type: @n8n/n8n-nodes-langchain.lmChatGoogleGemini  
   - Credentials: Configure Google Palm API (Google Gemini)  
   - Input: Connect from "Filter & Format Email (Gmail)" ai_languageModel input slot.  

5. **Connect Google Gemini Chat Model output to "Filter & Format Email (Gmail)" ai_languageModel output slot.**

6. **Add Gmail Node "Mark as Read (Gmail)":**  
   - Operation: markAsRead  
   - Parameters: Use messageId from Gmail Trigger node (`={{ $('Gmail Trigger').item.json.id }}`)  
   - Credentials: Gmail OAuth2  
   - Input: Connect from "Filter & Format Email (Gmail)" main output.  

7. **Add Evolution API Node "Send to WhatsApp (Gmail)":**  
   - Type: n8n-nodes-evolution-api-en.evolutionApi  
   - Credentials: Setup Evolution API account  
   - Parameters:  
     - resource: messages-api  
     - remoteJid: YOUR_WHATSAPP_NUMBER@s.whatsapp.net (replace with real number)  
     - messageText: `={{ $json.output }}` (from AI output)  
     - instanceName: YourInstanceName (replace with your instance)  
   - Input: Connect from "Filter & Format Email (Gmail)" main output.  

8. **Create Microsoft Outlook Trigger Node (Personal):**  
   - Type: Microsoft Outlook Trigger  
   - Credentials: Microsoft Outlook OAuth2  
   - Parameters: output raw, poll every minute  

9. **Add HTTP Request Node "Mark as Read (Outlook Personal)":**  
   - Method: PATCH  
   - URL: `https://graph.microsoft.com/v1.0/me/messages/{{$json["id"]}}`  
   - Body: `{ "isRead": true }` (JSON)  
   - Headers: Content-Type application/json  
   - Credentials: Microsoft Outlook OAuth2  
   - Input: Connect from Outlook Trigger output  

10. **Add Code Node "Parse Outlook Personal Data":**  
    - Paste provided JS code for decoding and formatting Outlook personal emails (HTML entity decoding, classification, Arabic locale date).  
    - Input: Connect from "Mark as Read (Outlook Personal)".  

11. **Add LangChain Agent "Filter & Format Email (Outlook Personal)":**  
    - Use provided prompt tailored for Outlook personal email with forwarding rules and translation.  
    - Input: Connect from "Parse Outlook Personal Data".  

12. **Add Google Gemini Chat Model1 Node:**  
    - Credentials: Google Palm API  
    - Input: Connect from "Filter & Format Email (Outlook Personal)" ai_languageModel input.  

13. **Connect Google Gemini Chat Model1 output to "Filter & Format Email (Outlook Personal)" ai_languageModel output.**

14. **Add Evolution API Node "Send to WhatsApp (Outlook Personal)":**  
    - Configure similarly to Gmail send node but update remoteJid with personal WhatsApp.  
    - Input: Connect from "Filter & Format Email (Outlook Personal)" main output.  

15. **Create Microsoft Outlook Trigger Node1 (Business):**  
    - Same setup as personal trigger but for business account.  

16. **Add HTTP Request Node "Mark as Read (Outlook Business)":**  
    - Same parameters as personal but connected to business trigger.  

17. **Add Code Node "Parse Outlook Business Data":**  
    - Use provided JS code for Outlook business email parsing.  

18. **Add LangChain Agent "Filter & Format Email (Outlook Business)":**  
    - Use business-specific prompt for AI filtering and formatting.  

19. **Add Google Gemini Chat Model3 Node:**  
    - Credentials: Google Palm API  
    - Input/output connected to the agent node as above.  

20. **Add Evolution API Node "Send to WhatsApp (Outlook Business)":**  
    - Configure with business WhatsApp number.  

21. **Add Sticky Notes:**  
    - For overview and setup instructions, replicate the textual content from the original workflow for user guidance.  

22. **Verify all connections:**  
    - Triggers → Mark as Read nodes → Parse nodes → AI nodes → WhatsApp send nodes  
    - AI model nodes connected properly with agent nodes.  

23. **Replace placeholders:**  
    - WhatsApp numbers in Evolution API nodes  
    - Evolution API instance names  
    - Trusted email addresses in AI prompts  
    - Credentials for Gmail OAuth2, Outlook OAuth2, Google Palm API, and Evolution API  

24. **Test each email source independently to ensure correct triggering, processing, AI formatting, and WhatsApp delivery.**

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                       | Context or Link                                                                                                   |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| 📧 EMAIL TO WHATSAPP AUTOMATION: AI-powered multi-account email forwarding with Gmail and two Outlook accounts, featuring Google Gemini AI filtering, automatic Arabic translation, security prioritization, and spam filtering. Setup requires 4 credentials and WhatsApp number configuration.                         | Workflow overview sticky note                                                                                     |
| 📬 GMAIL → WHATSAPP: Monitors Gmail inbox and forwards filtered messages to WhatsApp. Requires Gmail OAuth2 credential and updating WhatsApp number in the Evolution API send node.                                                                                                                               | Sticky note near Gmail nodes                                                                                       |
| 📬 OUTLOOK PERSONAL → WHATSAPP: Monitors personal Outlook account with same Outlook credential, sending filtered messages to WhatsApp personal number. Update phone number in respective Evolution API node.                                                                                                         | Sticky note near Outlook personal nodes                                                                            |
| 📬 OUTLOOK BUSINESS → WHATSAPP: Monitors business Outlook account, sending filtered messages to WhatsApp business number. Requires Outlook OAuth2 credential and updating phone number in send node.                                                                                                              | Sticky note near Outlook business nodes                                                                            |
| AI prompts include detailed rules for forwarding essential emails (activations, 2FA, security alerts), approved senders, ignoring spam and promotions, link extraction, and language translation (non-Arabic/English emails translated to Arabic). Detailed prompt texts are embedded in LangChain agent nodes.           | Found in Filter & Format Email LangChain Agent node parameters                                                     |
| Evolution API usage requires an API account and instance name; phone numbers must be formatted as WhatsApp JIDs: `number@s.whatsapp.net`.                                                                                                                                                                        | Evolution API nodes                                                                                                |
| Gmail and Outlook API tokens require periodic refresh; watch for auth errors or API limits.                                                                                                                                                                                                                       | General API integration note                                                                                       |
| Arabic locale formatting is applied to dates for clarity in target language environment.                                                                                                                                                                                                                          | Date formatting in code nodes                                                                                      |
| AI model used is Google Gemini via Google Palm API, requiring relevant credentials and quota management.                                                                                                                                                                                                           | AI nodes credentials                                                                                               |

---

This documentation fully details the workflow structure, logic, node configurations, and setup guidance, enabling both users and automation agents to understand, reproduce, and maintain the multi-account AI-powered email to WhatsApp forwarding system.