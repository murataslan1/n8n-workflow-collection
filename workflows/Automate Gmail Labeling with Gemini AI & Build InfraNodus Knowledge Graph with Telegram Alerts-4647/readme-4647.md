Automate Gmail Labeling with Gemini AI & Build InfraNodus Knowledge Graph with Telegram Alerts

https://n8nworkflows.xyz/workflows/automate-gmail-labeling-with-gemini-ai---build-infranodus-knowledge-graph-with-telegram-alerts-4647


# Automate Gmail Labeling with Gemini AI & Build InfraNodus Knowledge Graph with Telegram Alerts

---
### 1. Workflow Overview

This workflow automates the processing of incoming Gmail messages by classifying and labeling them with AI, building a knowledge graph of selected categories using InfraNodus, and optionally sending insightful notifications via Telegram. It is designed for users who want to organize their inbox automatically, gain visual and analytic insights on categorized emails, and receive instant alerts on important messages.

Logical blocks:

- **1.1 Input Reception:** Detect new incoming Gmail messages excluding sent emails.
- **1.2 AI-Based Classification:** Classify emails into predefined categories using Google Gemini AI (or optionally OpenAI).
- **1.3 Gmail Labeling:** Apply Gmail labels to messages based on classification results.
- **1.4 Knowledge Graph Construction:** Extract clean text from labeled emails and save statements into an InfraNodus knowledge graph.
- **1.5 Insight Generation:** Generate insightful questions or ideas from the knowledge graph using InfraNodus API.
- **1.6 Telegram Notifications:** Optionally notify via Telegram about important new emails and generated insights.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
This block listens for new incoming Gmail messages (excluding emails sent by the user themselves) and triggers the workflow when such messages arrive.

**Nodes Involved:**  
- Gmail Trigger  
- Sticky Note (Introductory Note)

**Node Details:**

- **Gmail Trigger**  
  - Type: Gmail Trigger (core n8n node)  
  - Configuration: Polls Gmail every minute for new messages; filters exclude messages sent by the user (`-from:me`)  
  - Input: N/A (trigger)  
  - Output: Emits new email data to next nodes  
  - Credentials: Gmail OAuth2 with user's Gmail account  
  - Edge Cases: OAuth token expiration, Gmail API rate limits, empty inbox, network issues  

- **Sticky Note**  
  - Provides introductory explanation for this block  
  - No technical role besides documentation  

---

#### 1.2 AI-Based Classification

**Overview:**  
Classifies the incoming email content into specific categories using a text classifier powered by Google Gemini AI (default) or OpenAI (optional). Categories include Business, Personal, Appointments, Urgent, and Invoices.

**Nodes Involved:**  
- Google Gemini Chat Model  
- Text Classifier  
- Sticky Note (Classification Instructions)  
- OpenAI Chat Model (Disabled)  

**Node Details:**

- **Google Gemini Chat Model**  
  - Type: LangChain Google Gemini Chat Model node  
  - Configuration: Uses model `models/gemini-2.5-flash-preview-04-17` with configured Google Palm API credentials  
  - Input: Incoming Gmail message data (subject and text)  
  - Output: Classified labels to Text Classifier  
  - Credentials: Google Palm API  
  - Edge Cases: API quota limits, authentication errors, model unavailability  

- **Text Classifier**  
  - Type: LangChain Text Classifier  
  - Configuration: Multi-class classification enabled; input text combines email subject and body text  
  - Categories: Business, Personal, Appointments, Urgent, Invoices (with detailed descriptions)  
  - Input: Text from Google Gemini Chat Model or Gmail Trigger (fallback)  
  - Output: Emits classification results for labeling nodes  
  - Edge Cases: Misclassification, input formatting issues  

- **OpenAI Chat Model**  
  - Disabled by default; can be enabled to replace Gemini with OpenAI GPT-4o model  

- **Sticky Note1**  
  - Explains classification purpose and options; encourages using Gemini for privacy reasons but allows OpenAI  

---

#### 1.3 Gmail Labeling

**Overview:**  
Applies Gmail labels to the message according to the classification results. Labels must be pre-created in Gmail. The message remains in Inbox but is also stored in label folders for easy access.

**Nodes Involved:**  
- Label as Business  
- Label as Personal  
- Label as Appointments  
- Label as Urgent  
- Label as Invoices  
- Sticky Note3  

**Node Details:**

- **Label as Business / Personal / Appointments / Urgent / Invoices**  
  - Type: Gmail node (addLabels operation)  
  - Configuration: Each node adds a specific Gmail label to the message based on classification  
  - Input: Message ID from Gmail Trigger; activated conditionally by classification output  
  - Output: Continues to next steps (some to Aggregate node)  
  - Credentials: Same Gmail OAuth2 credentials  
  - Edge Cases: Label ID mismatch, label does not exist, Gmail API errors, message ID missing  

- **Sticky Note3**  
  - Explains labeling purpose and warns users to create the Gmail labels beforehand  

---

#### 1.4 Knowledge Graph Construction

**Overview:**  
Extracts clean text from emails labeled as Business (or chosen category), formats statements, and saves them into an InfraNodus knowledge graph for visual and analytic summarization.

**Nodes Involved:**  
- Clean html and organize into statements (Code node)  
- InfraNodus Save to Graph (HTTP Request)  
- Wait  
- Aggregate  
- Sticky Note5  

**Node Details:**

- **Clean html and organize into statements**  
  - Type: Code node (JavaScript)  
  - Configuration: Removes HTML tags, scripts, styles, comments, decodes entities from email text, and constructs statements prefixed with sender name and date  
  - Input: Email content from labeled Business emails  
  - Output: JSON object with array of cleaned statements  
  - Edge Cases: Malformed HTML, missing text, unexpected encodings  

- **InfraNodus Save to Graph**  
  - Type: HTTP Request node  
  - Configuration: POST request to InfraNodus API with `name` of the graph (`gmail_business`), sending statements for saving  
  - Authentication: Bearer token via InfraNodus API key credential  
  - Context settings in notes enable text knowledge graph processing  
  - Output: Triggers Wait node  
  - Edge Cases: API rate limits, authentication failure, network errors, malformed payloads  

- **Wait**  
  - Type: Wait node  
  - Purpose: Ensures InfraNodus processing completes before next step  

- **Aggregate**  
  - Type: Aggregate node  
  - Configuration: Aggregates all item data once all labeling nodes finish  
  - Purpose: Prepares for label name retrieval and notification  

- **Sticky Note5**  
  - Explains InfraNodus graph usage, naming conventions, and access instructions  

---

#### 1.5 Insight Generation

**Overview:**  
Queries InfraNodus to generate an insightful question or idea based on the updated knowledge graph and sends this insight through Telegram.

**Nodes Involved:**  
- InfraNodus Question Generator (HTTP Request)  
- Send Insight to Telegram  
- Sticky Note6  
- Sticky Note7  

**Node Details:**

- **InfraNodus Question Generator**  
  - Type: HTTP Request node  
  - Configuration: POST to InfraNodus API requesting AI-generated question (`requestMode=question`) for graph `gmail_business`  
  - Authentication: InfraNodus API key (same as Save to Graph)  
  - Output: AI-generated advice or question text  
  - Edge Cases: API errors, empty graph, improper graph name  

- **Send Insight to Telegram**  
  - Type: Telegram node  
  - Configuration: Sends a message containing the AI-generated question with a link to the graph editor on InfraNodus  
  - Credentials: Telegram Bot API credentials  
  - Edge Cases: Chat ID missing, bot blocked, network failures, retry enabled  

- **Sticky Note6 & Sticky Note7**  
  - Provide instructions on generating insights and sending them to Telegram or other platforms  

---

#### 1.6 Telegram Notifications for Important Emails

**Overview:**  
Sends Telegram notifications for selected important email categories immediately after labeling and retrieving email details.

**Nodes Involved:**  
- Get Label's Name in Gmail  
- Get Email's snippet  
- Send Notification via Telegram  
- Sticky Note4  
- Sticky Note10  

**Node Details:**

- **Get Label's Name in Gmail**  
  - Type: Gmail node (get label operation)  
  - Configuration: Retrieves the label name using label ID from aggregated data  
  - Input: Aggregated output including label IDs  
  - Output: Passes label name to next node  

- **Get Email's snippet**  
  - Type: Gmail node (get message operation)  
  - Configuration: Retrieves snippet and other message details by message ID  
  - Input: Message ID from Gmail Trigger  

- **Send Notification via Telegram**  
  - Type: Telegram node  
  - Configuration: Sends a formatted message including label name, email subject, snippet, and link to Gmail thread  
  - Credentials: Telegram Bot API credentials  
  - Edge Cases: Same as Send Insight to Telegram  

- **Sticky Note4 & Sticky Note10**  
  - Explain Telegram setup via BotFather and which label categories to notify on  

---

### 3. Summary Table

| Node Name                   | Node Type                          | Functional Role                             | Input Node(s)            | Output Node(s)            | Sticky Note                                                                                       |
|-----------------------------|----------------------------------|--------------------------------------------|--------------------------|---------------------------|-------------------------------------------------------------------------------------------------|
| Gmail Trigger               | Gmail Trigger                    | Trigger on new incoming Gmail messages     | N/A                      | Text Classifier           | ## 1. When a new message arrives to your GMail inbox, trigger this workflow                      |
| Sticky Note                 | Sticky Note                     | Documentation                              | N/A                      | N/A                       | ## 1. When a new message arrives to your GMail inbox, trigger this workflow                      |
| Google Gemini Chat Model    | LangChain Google Gemini Model   | AI classification model                     | Gmail Trigger            | Text Classifier           | ## 2. Classify the email by the topic... (Gemini recommended for privacy)                        |
| Text Classifier             | LangChain Text Classifier       | Classify email content into categories      | Gmail Trigger, Gemini Model | Label as Business, Personal, Appointments, Urgent, Invoices | ## 2. Classify the email by the topic...                                                        |
| OpenAI Chat Model (disabled)| LangChain OpenAI Model          | Optional alternative AI classification model| N/A                      | Text Classifier           | ## 2. Classify the email by the topic... (Optional OpenAI)                                      |
| Label as Business           | Gmail node (Add Labels)         | Label message as Business-related           | Text Classifier          | Clean html and organize into statements | ## 3. Label the message with an appropriate tag...                                               |
| Label as Personal           | Gmail node (Add Labels)         | Label message as Personal                    | Text Classifier          | Aggregate                 | ## 3. Label the message with an appropriate tag...                                               |
| Label as Appointments       | Gmail node (Add Labels)         | Label message as Appointment                 | Text Classifier          | Aggregate                 | ## 3. Label the message with an appropriate tag...                                               |
| Label as Urgent             | Gmail node (Add Labels)         | Label message as Urgent                       | Text Classifier          | Aggregate                 | ## 3. Label the message with an appropriate tag...                                               |
| Label as Invoices           | Gmail node (Add Labels)         | Label message as Invoice                      | Text Classifier          | Aggregate                 | ## 3. Label the message with an appropriate tag...                                               |
| Clean html and organize into statements | Code node (JavaScript) | Clean email content and create statements  | Label as Business        | InfraNodus Save to Graph  | ## 4. Save message with the "business" label...                                                 |
| InfraNodus Save to Graph    | HTTP Request                   | Save statements to InfraNodus knowledge graph | Clean html and organize into statements | Wait                      | ## 4. Save message with the "business" label...                                                 |
| Wait                       | Wait                           | Timing control between save and query       | InfraNodus Save to Graph | InfraNodus Question Generator |                                                                                                 |
| Aggregate                   | Aggregate                      | Aggregate label outputs                      | Label as Personal, Appointments, Urgent, Invoices | Get Label's Name in Gmail  |                                                                                                 |
| Get Label's Name in Gmail   | Gmail node (Get label)          | Retrieve label name by ID                    | Aggregate                | Get Email's snippet       |                                                                                                 |
| Get Email's snippet         | Gmail node (Get message)        | Retrieve message snippet                     | Get Label's Name in Gmail | Send Notification via Telegram |                                                                                                 |
| Send Notification via Telegram | Telegram                     | Notify about important emails on Telegram   | Get Email's snippet      | N/A                       | ## Optional: Notify via Telegram...                                                             |
| InfraNodus Question Generator | HTTP Request                 | Generate insight question from InfraNodus graph | Wait                     | Send Insight to Telegram  | ## Optional: Generate an interesting insight question based on the graph                        |
| Send Insight to Telegram    | Telegram                      | Send insight question notification           | InfraNodus Question Generator | N/A                       | ## Optional: Send a new insight question to the Telegram chat                                  |
| Sticky Note1                | Sticky Note                   | Documentation: Classification instructions  | N/A                      | N/A                       | ## 2. Classify the email by the topic...                                                        |
| Sticky Note3                | Sticky Note                   | Documentation: Labeling instructions         | N/A                      | N/A                       | ## 3. Label the message with an appropriate tag...                                             |
| Sticky Note4                | Sticky Note                   | Documentation: Telegram notification setup   | N/A                      | N/A                       | ## Optional: Notify via Telegram...                                                             |
| Sticky Note5                | Sticky Note                   | Documentation: InfraNodus knowledge graph    | N/A                      | N/A                       | ## 4. Save message with the "business" label...                                                 |
| Sticky Note6                | Sticky Note                   | Documentation: Insight generation             | N/A                      | N/A                       | ## Optional: Generate an interesting insight question based on the graph                        |
| Sticky Note7                | Sticky Note                   | Documentation: Telegram insight notification  | N/A                      | N/A                       | ## Optional: Send a new insight question to the Telegram chat                                  |
| Sticky Note8                | Sticky Note                   | Documentation: Workflow summary and image     | N/A                      | N/A                       | # Label Incoming Messages with AI...                                                           |
| Sticky Note9                | Sticky Note                   | Documentation: Setup guide                      | N/A                      | N/A                       | ## Setup Guide                                                                                |
| Sticky Note10               | Sticky Note                   | Documentation: Immediate Telegram notifications | N/A                      | N/A                       | ## Optional: Choose which emails you want to be notified immediately about                     |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Gmail Trigger Node:**  
   - Type: Gmail Trigger  
   - Credentials: Connect your Gmail account via OAuth2  
   - Configuration:  
     - Poll every minute  
     - Filter query: `-from:me` (exclude your own sent emails)  
   - Connect output to Text Classifier node  

2. **Create Google Gemini Chat Model Node:**  
   - Type: LangChain Google Gemini Chat Model  
   - Credentials: Configure Google Palm API credentials  
   - Model Name: `models/gemini-2.5-flash-preview-04-17`  
   - Connect Gmail Trigger output to this node and its output to Text Classifier node (optional: if you want AI preprocessing)  

3. **Create Text Classifier Node:**  
   - Type: LangChain Text Classifier  
   - Input Text:  
     ```
     Subject: {{$json.subject}}
     Message:
     {{$json.text}}
     ```  
   - Enable multi-class classification  
   - Define categories:  
     - Business: Business-related messages...  
     - Personal: Personal emails...  
     - Appointments: Important appointments...  
     - Urgent: Things to attend urgently...  
     - Invoices: Emails with invoices...  
   - Connect inputs from Gmail Trigger or Gemini Model (depending on use)  
   - Connect outputs to respective Label nodes  

4. **Create Gmail Label Nodes (for each category):**  
   For each category (Business, Personal, Appointments, Urgent, Invoices):  
   - Type: Gmail node (Add Labels)  
   - Credentials: Gmail OAuth2 same as trigger  
   - Parameters:  
     - Operation: Add Labels  
     - Label IDs: Use Gmail label IDs for each category (must be pre-created in Gmail)  
     - Message ID: `={{ $('Gmail Trigger').item.json.id }}`  
   - Connect Text Classifier outputs to corresponding Label nodes  

5. **Create Code Node "Clean html and organize into statements":**  
   - Type: Code (JavaScript)  
   - Paste provided JS code that cleans HTML, removes scripts and styles, decodes entities, and formats statements with sender and date  
   - Input: Connect from "Label as Business" node output  

6. **Create HTTP Request Node "InfraNodus Save to Graph":**  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://infranodus.com/api/v1/graphAndStatements?doNotSave=false&includeGraph=false&includeGraphSummary=true&includeStatements=false`  
   - Authentication: HTTP Bearer Auth with InfraNodus API key credential  
   - Body Parameters (JSON):  
     - name: `"gmail_business"`  
     - statements: `={{ $json.statements }}`  
     - contextSettings: JSON string for text processing as per notes  
   - Connect output of Code node to this node  

7. **Create Wait Node:**  
   - Type: Wait  
   - Connect output of InfraNodus Save to Graph to Wait node  

8. **Create HTTP Request Node "InfraNodus Question Generator":**  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://infranodus.com/api/v1/graphAndAdvice?doNotSave=true&optimize=gap&includeGraph=false&includeGraphSummary=true`  
   - Authentication: InfraNodus API key credential  
   - Body Parameters:  
     - aiTopics: true  
     - requestMode: question (or idea if preferred)  
     - name: "gmail_business" (must match Save to Graph)  
   - Connect Wait node output to this node  

9. **Create Telegram Node "Send Insight to Telegram":**  
   - Type: Telegram  
   - Credentials: Telegram Bot API credentials (from BotFather)  
   - Text:  
     ```
     💭 Question: {{ $json.aiAdvice[0].text }}  
     More at [https://infranodus.com/your_user_name/gmail_business/edit](https://infranodus.com/your_user_name/gmail_business/edit)
     ```  
   - Connect InfraNodus Question Generator output to this node  

10. **Create Aggregate Node:**  
    - Type: Aggregate  
    - Configuration: Aggregate all item data once labeling nodes finish  
    - Connect outputs of Label as Personal, Appointments, Urgent, and Invoices nodes here  

11. **Create Gmail Node "Get Label's Name in Gmail":**  
    - Type: Gmail (get label)  
    - Credentials: Gmail OAuth2  
    - Label ID: `={{ $json.data[0].labelIds.find(label => label.includes('Label')) }}`  
    - Connect Aggregate node output to this node  

12. **Create Gmail Node "Get Email's snippet":**  
    - Type: Gmail (get message)  
    - Credentials: Gmail OAuth2  
    - Message ID: `={{ $('Gmail Trigger').item.json.id }}`  
    - Connect Get Label's Name node output to this node  

13. **Create Telegram Node "Send Notification via Telegram":**  
    - Type: Telegram  
    - Credentials: Telegram Bot API credentials  
    - Text:  
      ```
      📬 Important email / Label: {{ $('Get Label\'s Name in Gmail').item.json.name }} / Preview:  
      {{ $('Gmail Trigger').item.json.subject }}: {{ $json.snippet }}  
      Read more at https://mail.google.com/mail/u/0/#inbox/{{ $('Gmail Trigger').item.json.threadId }}
      ```  
    - Connect Get Email's snippet node output to this node  

14. **Add Sticky Notes for Documentation:**  
    - Add sticky notes at appropriate places with provided content for clarity and setup instructions  

---

### 5. General Notes & Resources

| Note Content | Context or Link |
|--------------|-----------------|
| The workflow uses Gemini AI by default due to privacy benefits as it is operated by the same company as Gmail. OpenAI GPT-4o is available as an alternative. | Classification block setup |
| Labels must be pre-created in Gmail prior to running the workflow to avoid labeling errors. | Gmail labeling instructions |
| InfraNodus knowledge graph allows visual summaries and insights generation from email content; graphs are accessible at infranodus.com with user and graph name. | InfraNodus usage and API: https://infranodus.com/api-access |
| Telegram notifications require a bot token obtained from [@botfather](https://t.me/botfather); notifications can also be adapted to Discord, email, or Google Sheets. | Telegram bot setup: https://t.me/botfather |
| Support for this workflow is available at [https://support.noduslabs.com](https://support.noduslabs.com) | Support contact |
| Example InfraNodus graph overview image is included in the main documentation node to illustrate functionality visually. | https://infranodus.com/images/front/infranodus-overview@2x.jpg |

---

**Disclaimer:**  
The provided text and workflow derive exclusively from an automated n8n workflow and comply strictly with content policies. No illegal, offensive, or protected content is included. All data processed is legal and public.