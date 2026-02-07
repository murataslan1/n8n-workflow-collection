Auto-Categorize Outlook Emails into Color Categories with GPT-4o

https://n8nworkflows.xyz/workflows/auto-categorize-outlook-emails-into-color-categories-with-gpt-4o-7796


# Auto-Categorize Outlook Emails into Color Categories with GPT-4o

### 1. Workflow Overview

This workflow automates the categorization of recent Outlook emails into color-coded categories ("Red Category", "Yellow Category", or "Green Category") using OpenAI's GPT-4o model. It fetches emails from an Outlook inbox, processes each email’s content with an AI agent to determine the appropriate category, and then updates the email's category in Outlook accordingly.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Triggering the workflow manually.
- **1.2 Data Retrieval:** Fetching recent emails from Outlook.
- **1.3 Data Preparation:** Selecting and setting relevant email fields for processing.
- **1.4 AI Categorization:** Sending email content to an OpenAI-powered agent to classify the email.
- **1.5 Result Parsing & Setting:** Parsing AI output and preparing category data.
- **1.6 Outlook Update:** Applying the AI-determined category to the original email in Outlook.
- **1.7 Batch Processing:** Handling emails one by one in batches to avoid timeouts or limits.
- **1.8 Setup Guidance:** Sticky notes providing setup instructions and links for credentials configuration.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:** This block initiates the workflow manually by the user.
- **Nodes Involved:**  
  - `When clicking ‘Execute workflow’`
- **Node Details:**

  | Node Name                           | Details                                                                                      |
  |-----------------------------------|----------------------------------------------------------------------------------------------|
  | When clicking ‘Execute workflow’   | **Type:** Manual Trigger<br>**Role:** Starts workflow execution on user command.<br>**Config:** No parameters.<br>**Input:** None.<br>**Output:** Triggers the next node.<br>**Failure Cases:** None.<br>**Version:** 1 |

#### 2.2 Data Retrieval

- **Overview:** Retrieves the latest emails from the user's Outlook inbox.
- **Nodes Involved:**  
  - `Get Messages from Outlook`
- **Node Details:**

  | Node Name               | Details                                                                                  |
  |-------------------------|------------------------------------------------------------------------------------------|
  | Get Messages from Outlook | **Type:** Microsoft Outlook Node<br>**Role:** Fetch up to 5 recent emails.<br>**Config:** Operation: getAll, Limit: 5.<br>**Credentials:** Microsoft Outlook OAuth2 API.<br>**Output:** JSON array of emails.<br>**Input:** Trigger node.<br>**Failure Cases:** Auth errors, API rate limits, network issues.<br>**Version:** 2 |

#### 2.3 Data Preparation

- **Overview:** Extracts and sets critical email fields (subject, preview, sender, message ID) for later use.
- **Nodes Involved:**  
  - `Set Fields from Email`
- **Node Details:**

  | Node Name            | Details                                                                                         |
  |----------------------|-------------------------------------------------------------------------------------------------|
  | Set Fields from Email | **Type:** Set Node<br>**Role:** Maps and prepares email fields for AI consumption.<br>**Config:** Assigns `subject`, `bodyPreview`, `from`, `Message ID` from the email JSON.<br>**Input:** Output of `Get Messages from Outlook`.<br>**Output:** Structured single email data.<br>**Failure Cases:** Missing or malformed fields.<br>**Version:** 3.4 |

#### 2.4 AI Categorization

- **Overview:** Uses GPT-4o to classify each email into a color category based on its content.
- **Nodes Involved:**  
  - `Categorizing Agent`
  - `OpenAI Chat Model1`
  - `Structured Output Parser`
- **Node Details:**

  | Node Name            | Details                                                                                                                         |
  |----------------------|---------------------------------------------------------------------------------------------------------------------------------|
  | Categorizing Agent    | **Type:** LangChain Agent Node<br>**Role:** Receives email text (bodyPreview + subject), sends prompt to AI, expects category.<br>**Config:** System message instructs to categorize as Red, Yellow, or Green category.<br>**Input:** Email text from `Set Fields from Email`.<br>**Output:** JSON with category.<br>**Has Output Parser:** True, connected to `Structured Output Parser`.<br>**Failure Cases:** AI response errors, prompt failures, rate limits.<br>**Version:** 2.2 |
  | OpenAI Chat Model1    | **Type:** LangChain OpenAI Chat Model<br>**Role:** GPT-4o model used by the Agent.<br>**Config:** Model set to "gpt-4o".<br>**Input:** AI prompt from `Categorizing Agent`.<br>**Output:** AI text response.<br>**Credentials:** OpenAI API key.<br>**Failure Cases:** API limits, auth errors.<br>**Version:** 1.2 |
  | Structured Output Parser | **Type:** LangChain Output Parser<br>**Role:** Parses AI response into structured JSON with `category` field.<br>**Config:** JSON schema example with `category` string.<br>**Input:** AI raw output.<br>**Output:** Parsed JSON.<br>**Failure Cases:** Parsing errors, unexpected AI output.<br>**Version:** 1.3 |

#### 2.5 Result Parsing & Setting

- **Overview:** Extracts the AI category and associates it with the Outlook message ID for update.
- **Nodes Involved:**  
  - `Set Category and ID`
- **Node Details:**

  | Node Name           | Details                                                                                                                |
  |---------------------|------------------------------------------------------------------------------------------------------------------------|
  | Set Category and ID  | **Type:** Set Node<br>**Role:** Maps parsed AI category and original message ID to `output.category` and `id` fields.<br>**Config:** Assigns `output.category` from AI output, `id` from Outlook message.<br>**Input:** Output from `Loop Over Items1` batch process.<br>**Output:** Prepared data for update.<br>**Failure Cases:** Missing data from AI or Outlook.<br>**Version:** 3.4 |

#### 2.6 Outlook Update

- **Overview:** Updates each Outlook email's category field with the AI-determined color category.
- **Nodes Involved:**  
  - `Update Category`
- **Node Details:**

  | Node Name       | Details                                                                                                                      |
  |-----------------|------------------------------------------------------------------------------------------------------------------------------|
  | Update Category | **Type:** Microsoft Outlook Node<br>**Role:** Updates message category in Outlook by message ID.<br>**Config:** Operation: update, Categories: array with AI category.<br>**Credentials:** Microsoft Outlook OAuth2 API.<br>**Input:** Data from `Set Category and ID`.<br>**Failure Cases:** Auth errors, message not found, API limits.<br>**Version:** 2 |

#### 2.7 Batch Processing

- **Overview:** Processes emails one by one to avoid hitting API rate limits or timeout issues.
- **Nodes Involved:**  
  - `Loop Over Items1`
- **Node Details:**

  | Node Name           | Details                                                                                                                    |
  |---------------------|----------------------------------------------------------------------------------------------------------------------------|
  | Loop Over Items1     | **Type:** SplitInBatches Node<br>**Role:** Processes each email individually through the workflow.<br>**Config:** Default batch options.<br>**Input:** Emails after preparation.<br>**Output:** Single email item per batch to AI categorization.<br>**Failure Cases:** Batch processing timing out.<br>**Version:** 3 |

#### 2.8 Setup Guidance (Sticky Notes)

- **Overview:** Provides instructions and useful links to configure Outlook and OpenAI credentials, billing, and usage.
- **Nodes Involved:**  
  - `Sticky Note21`, `Sticky Note22`, `Sticky Note24`, `Sticky Note54`
- **Node Details:**

  | Node Name       | Details                                                                                                                       |
  |-----------------|-------------------------------------------------------------------------------------------------------------------------------|
  | Sticky Note21   | Detailed setup instructions for Outlook and OpenAI integration, including links to API keys, billing, and contact information. |
  | Sticky Note22   | Workflow purpose overview highlighting automatic email categorization with OpenAI.                                            |
  | Sticky Note24   | Stepwise Outlook credential setup and optional parameter adjustment.                                                          |
  | Sticky Note54   | Stepwise OpenAI credential setup and billing instructions.                                                                    |

---

### 3. Summary Table

| Node Name               | Node Type                           | Functional Role                         | Input Node(s)                  | Output Node(s)               | Sticky Note                                                                                                                     |
|-------------------------|-----------------------------------|---------------------------------------|-------------------------------|------------------------------|---------------------------------------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger                   | Workflow start                        | None                          | Get Messages from Outlook     |                                                                                                                                 |
| Get Messages from Outlook | Microsoft Outlook Node             | Fetch recent emails                   | When clicking ‘Execute workflow’ | Set Fields from Email         | See Sticky Note21, Sticky Note24 for setup instructions                                                                         |
| Set Fields from Email    | Set Node                         | Prepare email fields for AI           | Get Messages from Outlook      | Loop Over Items1              |                                                                                                                                 |
| Loop Over Items1         | SplitInBatches                   | Batch processing of emails            | Set Fields from Email          | Set Category and ID, Categorizing Agent |                                                                                                                                 |
| Categorizing Agent       | LangChain Agent Node             | AI categorization of email content    | Loop Over Items1               | Loop Over Items1              | Uses OpenAI Chat Model1 and Structured Output Parser                                                                            |
| OpenAI Chat Model1       | LangChain OpenAI Chat Model      | GPT-4o model for AI processing        | Categorizing Agent             | Categorizing Agent            | See Sticky Note21, Sticky Note54 for OpenAI API setup                                                                           |
| Structured Output Parser | LangChain Output Parser          | Parse AI response into structured JSON | OpenAI Chat Model1             | Categorizing Agent            |                                                                                                                                 |
| Set Category and ID      | Set Node                         | Prepare AI category and message ID    | Loop Over Items1               | Update Category              |                                                                                                                                 |
| Update Category          | Microsoft Outlook Node           | Update email category in Outlook      | Set Category and ID            | None                         | See Sticky Note21, Sticky Note24 for Outlook credential usage                                                                   |
| Sticky Note21            | Sticky Note                     | Setup instructions and contact info   | None                         | None                         | Detailed setup instructions for Outlook and OpenAI, billing, and contact details                                               |
| Sticky Note22            | Sticky Note                     | Workflow overview                      | None                         | None                         | Workflow purpose and description                                                                                                |
| Sticky Note24            | Sticky Note                     | Outlook connection setup instructions | None                         | None                         | Stepwise Outlook OAuth2 credential setup                                                                                        |
| Sticky Note54            | Sticky Note                     | OpenAI connection setup instructions  | None                         | None                         | Stepwise OpenAI API key and billing setup                                                                                       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Name: `When clicking ‘Execute workflow’`  
   - Type: Manual Trigger (n8n built-in)  
   - No parameters.

2. **Create Microsoft Outlook Node to Get Messages**  
   - Name: `Get Messages from Outlook`  
   - Type: Microsoft Outlook  
   - Operation: `getAll`  
   - Limit: `5` (adjustable)  
   - Credentials: Create and assign Microsoft Outlook OAuth2 API credentials with your Outlook account.  
   - Connect output from `When clicking ‘Execute workflow’` to this node.

3. **Create Set Node to Extract Email Fields**  
   - Name: `Set Fields from Email`  
   - Type: Set  
   - Assign fields:  
     - `subject` = `{{$json.subject}}`  
     - `bodyPreview` = `{{$json.bodyPreview}}`  
     - `from` = `{{$json.from}}`  
     - `Message ID` = `{{$json.id}}`  
   - Connect output from `Get Messages from Outlook` to this node.

4. **Create SplitInBatches Node for Batch Processing**  
   - Name: `Loop Over Items1`  
   - Type: SplitInBatches  
   - Default batch size (1 item per batch)  
   - Connect output from `Set Fields from Email` to this node.

5. **Create LangChain Agent Node for AI Categorization**  
   - Name: `Categorizing Agent`  
   - Type: LangChain Agent  
   - Text input: `"body: {{$json.bodyPreview}} subject: {{$json.subject}}"`  
   - System message:  
     ```
     You are a helpful assistant. take in the email message and determine if it is Red Category, Yellow Category, or Green Category. based on random

     output data like this. 

     {
       "category": "Red Category, Yellow Category, or Green Category"
     }
     ```  
   - Prompt type: `define`  
   - Enable output parser.  
   - Connect AI language model input to the OpenAI Chat Model node (next step).  
   - Connect output parser input to the Structured Output Parser node (next step).  
   - Connect output from `Loop Over Items1` to this node.

6. **Create LangChain OpenAI Chat Model Node**  
   - Name: `OpenAI Chat Model1`  
   - Type: LangChain OpenAI Chat Model  
   - Model: `gpt-4o`  
   - Credentials: OpenAI API key (create in n8n credentials using your OpenAI API key).  
   - Connect AI language model input from `Categorizing Agent`.

7. **Create LangChain Structured Output Parser Node**  
   - Name: `Structured Output Parser`  
   - Type: LangChain Output Parser  
   - JSON schema example:  
     ```json
     {
       "category": "Red Category, Yellow Category, or Green Category"
     }
     ```  
   - Connect output parser input from `OpenAI Chat Model1`.

8. **Create Set Node to Assign AI Category and Message ID**  
   - Name: `Set Category and ID`  
   - Type: Set  
   - Assignments:  
     - `output.category` = `{{$json.output.category}}` (from AI output)  
     - `id` = `{{$node["Get Messages from Outlook"].item.json.id}}`  
   - Connect output of `Loop Over Items1` to this node.

9. **Create Microsoft Outlook Node to Update Message Category**  
   - Name: `Update Category`  
   - Type: Microsoft Outlook  
   - Operation: `update`  
   - Message ID: `{{$json.id}}`  
   - Update Fields: Categories = `[{{$json.output.category}}]`  
   - Credentials: Same Microsoft Outlook OAuth2 API as used for fetching messages.  
   - Connect output from `Set Category and ID` to this node.

10. **Wire Connections**  
    - `When clicking ‘Execute workflow’` → `Get Messages from Outlook`  
    - `Get Messages from Outlook` → `Set Fields from Email`  
    - `Set Fields from Email` → `Loop Over Items1`  
    - `Loop Over Items1` → `Categorizing Agent`  
    - `OpenAI Chat Model1` → AI Language Model input of `Categorizing Agent`  
    - `Structured Output Parser` → AI Output Parser input of `Categorizing Agent`  
    - `Loop Over Items1` → `Set Category and ID`  
    - `Set Category and ID` → `Update Category`  
    - `Categorizing Agent` → `Loop Over Items1` (to continue batch processing)

11. **Credential Setup**  
    - Create Microsoft Outlook OAuth2 API credentials in n8n with proper scopes to read and update emails.  
    - Create OpenAI credentials with your API key and ensure billing is active.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                          | Context or Link                                                                                   |
|-------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| Setup instructions for Outlook OAuth2 API credentials: login, approve access, and attach credentials to relevant nodes.                            | Sticky Note21, Sticky Note24                                                                    |
| Setup instructions for OpenAI API key and billing: API key creation, fund billing account, attach credentials in n8n.                               | Sticky Note21, Sticky Note54                                                                    |
| Workflow purpose: auto-categorizes Outlook emails into Red, Yellow, or Green categories using OpenAI GPT-4o.                                         | Sticky Note22                                                                                   |
| Contact: Robert Breen, email robert@ynteractive.com, LinkedIn https://www.linkedin.com/in/robert-breen-29429625/, Website https://ynteractive.com     | Sticky Note21                                                                                   |

---

**Disclaimer:** The text provided is exclusively derived from an automated workflow created using n8n, an integration and automation tool. This processing strictly complies with applicable content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.