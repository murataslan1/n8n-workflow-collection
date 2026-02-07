AI Agent Creates Content to Be Picked by ChatGPT, Gemini, Google

https://n8nworkflows.xyz/workflows/ai-agent-creates-content-to-be-picked-by-chatgpt--gemini--google-4652


# AI Agent Creates Content to Be Picked by ChatGPT, Gemini, Google

### 1. Workflow Overview

This workflow, titled **"GEO/SEO content engine"**, is designed to automate the generation, classification, and distribution of content optimized for geographic and SEO purposes. It ingests data from Google Sheets, processes and filters duplicates, generates AI-driven content using language models (including Google Gemini and Langchain LLM), classifies the content, and then routes the output through multiple communication and publication channels such as Gmail, LinkedIn, Wordpress, and Mailgun.

The workflow can be logically divided into the following blocks:

- **1.1 Input Reception & Preprocessing:** Trigger and deduplicate new data from Google Sheets.
- **1.2 AI Content Generation:** Use a chain of language models to generate new content.
- **1.3 Content Classification:** Classify the generated content to determine routing.
- **1.4 Distribution & Publishing:** Send classified content through email (Gmail), publish to Wordpress and LinkedIn, and send emails via Mailgun.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception & Preprocessing

**Overview:**  
This block monitors a Google Sheets document for new or updated rows, removes duplicate entries to ensure unique data progression, and prepares the data for AI content generation.

**Nodes Involved:**  
- Google Sheets Trigger  
- Remove Duplicates

**Node Details:**

- **Google Sheets Trigger**  
  - *Type:* Trigger node, listens for changes in a Google Sheets spreadsheet.  
  - *Configuration:* Default parameters, listens for new or updated sheet rows.  
  - *Inputs:* External trigger from the Google Sheets API.  
  - *Outputs:* Passes new or updated sheet data downstream.  
  - *Failure Cases:* Auth errors due to expired or invalid OAuth tokens; connectivity issues to Google API; malformed sheet data.  
  - *Notes:* Entry point for the workflow.

- **Remove Duplicates**  
  - *Type:* Data processing node, removes duplicate entries based on default or configured keys.  
  - *Configuration:* Uses default settings to filter out duplicate rows from input data.  
  - *Inputs:* Data from Google Sheets Trigger.  
  - *Outputs:* Unique rows forwarded to the AI Content Generation block.  
  - *Failure Cases:* Incorrect or missing keys for duplicate detection may cause unexpected behavior.

---

#### 1.2 AI Content Generation

**Overview:**  
Utilizes large language models (LLMs) to generate SEO-optimized content based on the unique inputs from the previous block.

**Nodes Involved:**  
- Basic LLM Chain  
- Google Gemini Chat Model

**Node Details:**

- **Basic LLM Chain**  
  - *Type:* Langchain LLM chain node for generating text content.  
  - *Configuration:* Utilizes a configured LLM (opened via the "ai_languageModel" connection from the Google Gemini Chat Model).  
  - *Inputs:* Unique data from Remove Duplicates node and AI responses from Google Gemini Chat Model.  
  - *Outputs:* Content data sent to Google Sheets for storage.  
  - *Failure Cases:* API key or quota exceeded; prompt configuration errors; response timeouts.

- **Google Gemini Chat Model**  
  - *Type:* Language model node using Google Gemini for chat-based generation.  
  - *Configuration:* Integrated as the AI language model backend for the Basic LLM Chain.  
  - *Inputs:* Feeds AI-generated text to Basic LLM Chain via ai_languageModel connection.  
  - *Outputs:* Provides generated content back to Basic LLM Chain.  
  - *Failure Cases:* Authentication failures with Google API; rate limits; model unavailability.

- *Connections:* The Google Gemini Chat Model is linked as an AI language model provider for the Basic LLM Chain.

---

#### 1.3 Content Classification

**Overview:**  
Classifies the AI-generated content to determine the appropriate communication or publishing channels.

**Nodes Involved:**  
- Google Sheets  
- Text Classifier  
- Google Gemini Chat Model1

**Node Details:**

- **Google Sheets**  
  - *Type:* Data storage node to record AI-generated content.  
  - *Configuration:* Writes results from Basic LLM Chain to a designated Google Sheet.  
  - *Inputs:* Receives content from Basic LLM Chain.  
  - *Outputs:* Passes data to Text Classifier.  
  - *Failure Cases:* Write permission errors; quota limits; sheet not found.

- **Text Classifier**  
  - *Type:* Langchain text classification node.  
  - *Configuration:* Classifies content to decide routing paths. Receives AI model input from Google Gemini Chat Model1.  
  - *Inputs:* Content from Google Sheets.  
  - *Outputs:* Routes classified content to one of four Gmail nodes based on classification results.  
  - *Failure Cases:* Misclassification due to model training; API failures; malformed input.

- **Google Gemini Chat Model1**  
  - *Type:* Language model node (Google Gemini) used specifically as backend for Text Classifier.  
  - *Configuration:* Acts as AI language model for Text Classifier node via ai_languageModel connection.  
  - *Inputs:* Feeds classification AI responses to Text Classifier.  
  - *Outputs:* Classified results to Text Classifier.  
  - *Failure Cases:* Same as Google Gemini Chat Model; any connectivity or quota issues.

---

#### 1.4 Distribution & Publishing

**Overview:**  
Distributes the classified content into multiple channels: sending emails via Gmail and Mailgun, publishing posts on Wordpress, and posting on LinkedIn.

**Nodes Involved:**  
- Gmail  
- Gmail1  
- Gmail2  
- Gmail3  
- LinkedIn  
- Wordpress  
- Wordpress1  
- Mailgun

**Node Details:**

- **Gmail, Gmail1, Gmail2, Gmail3**  
  - *Type:* Gmail nodes to send emails using different Gmail webhook credentials.  
  - *Configuration:* Each node linked to a distinct Gmail webhook for sending emails based on classification category.  
  - *Inputs:* Receive classified content routing from Text Classifier.  
  - *Outputs:* Gmail → LinkedIn; Gmail1 → Wordpress; Gmail2 → Mailgun; Gmail3 → Wordpress1 nodes respectively.  
  - *Failure Cases:* OAuth token expiration; sending limits; invalid email addresses; rate limits.

- **LinkedIn**  
  - *Type:* LinkedIn posting node.  
  - *Configuration:* Posts content received from Gmail node.  
  - *Inputs:* Content from Gmail node.  
  - *Outputs:* None (terminal node for LinkedIn publishing).  
  - *Failure Cases:* API permission errors; post format issues.

- **Wordpress, Wordpress1**  
  - *Type:* Wordpress publishing nodes.  
  - *Configuration:* Post content on Wordpress sites, each linked to different Gmail nodes (Gmail1 and Gmail3).  
  - *Inputs:* Content from respective Gmail nodes.  
  - *Outputs:* None (terminal nodes for Wordpress publishing).  
  - *Failure Cases:* Authentication errors; invalid post data; API limits.

- **Mailgun**  
  - *Type:* Mailgun email sending node.  
  - *Configuration:* Sends emails with content from Gmail2 node using Mailgun API.  
  - *Inputs:* Content from Gmail2 node.  
  - *Outputs:* None (terminal email sending node).  
  - *Failure Cases:* API key issues; message rejection; sending limits.

---

### 3. Summary Table

| Node Name              | Node Type                           | Functional Role                    | Input Node(s)          | Output Node(s)            | Sticky Note                                            |
|------------------------|-----------------------------------|----------------------------------|-----------------------|---------------------------|--------------------------------------------------------|
| Google Sheets Trigger   | Google Sheets Trigger              | Input data trigger from Sheets   | -                     | Remove Duplicates          |                                                        |
| Remove Duplicates       | Remove Duplicates                  | Filter duplicate sheet rows      | Google Sheets Trigger | Basic LLM Chain            |                                                        |
| Basic LLM Chain         | Langchain LLM Chain                | Generate AI content              | Remove Duplicates, Google Gemini Chat Model | Google Sheets             |                                                        |
| Google Gemini Chat Model| Google Gemini LM Chat Model        | AI language model for content    | -                     | Basic LLM Chain (ai_languageModel) |                                                        |
| Google Sheets          | Google Sheets                      | Store generated content          | Basic LLM Chain        | Text Classifier            |                                                        |
| Text Classifier         | Langchain Text Classifier          | Classify content for routing     | Google Sheets          | Gmail1, Gmail, Gmail2, Gmail3 |                                                        |
| Google Gemini Chat Model1| Google Gemini LM Chat Model       | AI language model for classification | -                   | Text Classifier (ai_languageModel) |                                                        |
| Gmail                  | Gmail                             | Send email, route to LinkedIn    | Text Classifier        | LinkedIn                   |                                                        |
| Gmail1                 | Gmail                             | Send email, route to Wordpress   | Text Classifier        | Wordpress                  |                                                        |
| Gmail2                 | Gmail                             | Send email, route to Mailgun     | Text Classifier        | Mailgun                    |                                                        |
| Gmail3                 | Gmail                             | Send email, route to Wordpress1  | Text Classifier        | Wordpress1                 |                                                        |
| LinkedIn               | LinkedIn                          | Post content to LinkedIn         | Gmail                  | -                         |                                                        |
| Wordpress              | Wordpress                        | Publish post                    | Gmail1                 | -                         |                                                        |
| Wordpress1             | Wordpress                        | Publish post                    | Gmail3                 | -                         |                                                        |
| Mailgun                | Mailgun                          | Send email via Mailgun            | Gmail2                  | -                         |                                                        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Google Sheets Trigger node:**  
   - Set up OAuth2 credentials for Google API.  
   - Configure to trigger on new or updated rows in a specific Google Sheet used for input data.

2. **Add Remove Duplicates node:**  
   - Connect output of Google Sheets Trigger to this node.  
   - Configure to remove duplicates based on relevant columns (default or customized keys).

3. **Add Basic LLM Chain node:**  
   - Connect output of Remove Duplicates node.  
   - Configure an LLM chain using Langchain, leaving the AI model input to be linked from Google Gemini Chat Model.

4. **Add Google Gemini Chat Model node:**  
   - Configure Google API credentials with necessary permissions for Gemini AI.  
   - Connect as an AI language model input to Basic LLM Chain node (via "ai_languageModel" connection).

5. **Add Google Sheets node:**  
   - Connect output of Basic LLM Chain to this node.  
   - Configure to write generated content back into a designated Google Sheet.

6. **Add Text Classifier node:**  
   - Connect output of Google Sheets node.  
   - Configure with classification criteria and link it to an AI language model node (Google Gemini Chat Model1).

7. **Add Google Gemini Chat Model1 node:**  
   - Configure similarly to the first Gemini node but dedicated for classification.  
   - Connect as AI language model input to Text Classifier node.

8. **Add four Gmail nodes (Gmail, Gmail1, Gmail2, Gmail3):**  
   - Each connected to different outputs of Text Classifier according to classification results.  
   - Configure Gmail OAuth2 credentials and webhook IDs for each.  
   - Set up email parameters for sending content.

9. **Add LinkedIn node:**  
   - Connect output of Gmail node.  
   - Configure LinkedIn OAuth2 credentials and specify posting parameters.

10. **Add two Wordpress nodes (Wordpress, Wordpress1):**  
    - Connect Wordpress to Gmail1 output; Wordpress1 to Gmail3 output.  
    - Configure Wordpress credentials and specify blog and post parameters.

11. **Add Mailgun node:**  
    - Connect output of Gmail2 node.  
    - Configure Mailgun API credentials and email sending parameters.

12. **Connect nodes as per the established workflow:**  
    - Google Sheets Trigger → Remove Duplicates → Basic LLM Chain → Google Sheets → Text Classifier  
    - Text Classifier → Gmail, Gmail1, Gmail2, Gmail3  
    - Gmail → LinkedIn  
    - Gmail1 → Wordpress  
    - Gmail3 → Wordpress1  
    - Gmail2 → Mailgun

13. **Test each node individually for successful API authentication and data flow.**

---

### 5. General Notes & Resources

| Note Content                                                                                             | Context or Link                                           |
|---------------------------------------------------------------------------------------------------------|-----------------------------------------------------------|
| Google Gemini Chat Model nodes require authentication with Google Cloud and appropriate API quotas.     | Google Cloud Console (https://console.cloud.google.com)   |
| Gmail nodes use webhook IDs for receiving and sending emails; ensure OAuth2 credentials are up to date.  | Gmail API documentation (https://developers.google.com/gmail/api) |
| Langchain integration nodes require correct API keys and proper prompt templates for reliable output.   | Langchain Documentation (https://docs.langchain.com/)     |
| Wordpress nodes require valid credentials with publish permissions; check API endpoint compatibility.    | Wordpress REST API (https://developer.wordpress.org/rest-api/) |
| Mailgun node requires API key and verified sending domain for email dispatch.                            | Mailgun documentation (https://documentation.mailgun.com/)|
| Ensure Google Sheets API quotas and permissions are sufficient for reading and writing data.             | Google Sheets API Quotas (https://developers.google.com/sheets/api/limits) |

---

_Disclaimer: The provided text is exclusively derived from an automated workflow created with n8n, a tool for integration and automation. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All handled data are legal and publicly accessible._