Automate Website Tool Analysis with Telegram, Apify, AI & Google Sheets

https://n8nworkflows.xyz/workflows/automate-website-tool-analysis-with-telegram--apify--ai---google-sheets-7536


# Automate Website Tool Analysis with Telegram, Apify, AI & Google Sheets

### 1. Workflow Overview

This workflow automates the evaluation and analysis of website tools by integrating Telegram messaging, web scraping via Apify, AI-based content processing, and Google Sheets for data storage. It is designed for technology evaluators or experts who receive URLs via Telegram, need detailed insights on those websites, and want structured actionable feedback and decision support.

The workflow is logically divided into these blocks:

- **1.1 Telegram Input & URL Extraction**: Listens for incoming Telegram messages, extracts website URLs, and validates input.
- **1.2 Website Content Extraction**: Uses the extracted URL to crawl and retrieve raw website content via Apify.
- **1.3 Content Cleaning & Contextual AI Analysis**: Cleans raw website text using AI, enriches it with expert profile data from Google Sheets, and generates structured analysis and decision verdict.
- **1.4 Results Recording & User Feedback**: Appends the analysis results to Google Sheets and sends a detailed summary back to the Telegram user.

---

### 2. Block-by-Block Analysis

#### 2.1 Telegram Input & URL Extraction

**Overview:**  
This initial block listens for Telegram messages, extracts any URL found in the message text, and validates its presence. If no URL is found, the user is notified to resend a valid link.

**Nodes Involved:**  
- Telegram Trigger  
- Extract URL from Message  
- URL Present? (If)  
- Notify User: No Link Found  

**Node Details:**

- **Telegram Trigger**  
  - Type: Telegram Trigger node  
  - Role: Starts workflow on any new message update from Telegram chat  
  - Configuration: Listens for "message" updates, uses Telegram API credentials  
  - Inputs: External Telegram messages  
  - Outputs: Message JSON with text content  
  - Edge cases: Message with no text or URL; Telegram API downtime or auth errors  

- **Extract URL from Message**  
  - Type: Code node (JavaScript)  
  - Role: Parses incoming message text and extracts the first HTTP/HTTPS URL using regex  
  - Key expressions: Regex pattern `(https?:\/\/[^\s]+)` to find URLs  
  - Input: Telegram message JSON  
  - Output: JSON object with extracted `url` string or empty if none found  
  - Edge cases: Messages without URLs, malformed URLs, or multiple URLs (only first captured)  

- **URL Present?**  
  - Type: If node  
  - Role: Checks if extracted URL is not empty to decide workflow path  
  - Condition: `$json.url` is not empty  
  - Inputs: Output of "Extract URL from Message"  
  - Outputs: Two branches — URL exists or does not exist  
  - Edge cases: Empty or invalid URL strings  

- **Notify User: No Link Found**  
  - Type: Telegram node (send message)  
  - Role: Sends a Telegram message prompting the user to resend a valid URL if none detected  
  - Configuration: Message text fixed; uses chat ID from initial Telegram Trigger  
  - Inputs: Triggered if URL missing branch from "URL Present?"  
  - Edge cases: Telegram API failures, message not delivered  

---

#### 2.2 Website Content Extraction

**Overview:**  
This block prepares the extracted URL and sends it to Apify’s website content crawler to fetch detailed raw textual data from the target site.

**Nodes Involved:**  
- Set Input URL Field  
- Launch Web Content Extraction  
- Set Raw Web Content  

**Node Details:**

- **Set Input URL Field**  
  - Type: Set node  
  - Role: Stores the extracted URL under a consistent field name `URL` for downstream use  
  - Configuration: Assigns `URL` = extracted URL string  
  - Input: Validated URL from "URL Present?"  
  - Output: JSON with `URL` field  

- **Launch Web Content Extraction**  
  - Type: HTTP Request node  
  - Role: Calls Apify API to run a synchronous crawl on the provided URL and get dataset items (website text content)  
  - Configuration:  
    - POST request to Apify act endpoint for "deep-website-content-crawler"  
    - JSON body includes `startUrls` array with the `URL` value  
    - Uses Apify API credentials  
  - Input: JSON with URL  
  - Output: API response JSON containing website textual content  
  - Edge cases: API timeout, rate limits, invalid URL, authentication failures  

- **Set Raw Web Content**  
  - Type: Set node  
  - Role: Extracts and stores the main website textual content (`text` field from API response) into `Website_content` field  
  - Input: API JSON response  
  - Output: JSON with `Website_content` string field  

---

#### 2.3 Content Cleaning & Contextual AI Analysis

**Overview:**  
This block uses AI to clean the raw website content by removing noise and irrelevant information, then enriches it with expert profile data retrieved from Google Sheets. The combined context is analyzed by an AI agent to generate structured insights, business impact analysis, and a decision verdict.

**Nodes Involved:**  
- Clean Website Content (LLM)  
- Set Clean Detailed Context  
- Fetch Profile from Google Sheets  
- Contextual Website Analyzer AI (LangChain agent)  
- Structure AI Analysis Output  

**Node Details:**

- **Clean Website Content**  
  - Type: LangChain LLM Chain node  
  - Role: Processes raw website content, removing UI noise, ads, navigation, and irrelevant text, producing detailed factual plain text  
  - Configuration: Custom prompt instructs AI to extract only meaningful content, expand abbreviations, and format output without opinions or summaries  
  - Input: `Website_content`  
  - Output: Cleaned detailed context text  
  - Edge cases: AI hallucinations, incomplete content extraction, timeouts  

- **Set Clean Detailed Context**  
  - Type: Set node  
  - Role: Stores cleaned detailed website context in `cleaned_detailed_context` field for next steps  
  - Input: Cleaned text output from prior node  
  - Output: JSON with `cleaned_detailed_context`  

- **Fetch Profile from Google Sheets**  
  - Type: Google Sheets Tool node  
  - Role: Retrieves expert profile data (expertise, tools, goals) from a specified Google Sheets document and sheet  
  - Configuration:  
    - Document ID and Sheet name set to a predefined Google Sheet containing company/expert details  
    - Uses Google Sheets OAuth2 credentials  
  - Input: Triggered before contextual AI analysis to supply context  
  - Output: Array of strings representing profile attributes  
  - Edge cases: Google API rate limits, auth failures, missing data  

- **Contextual Website Analyzer AI**  
  - Type: LangChain Agent node  
  - Role: Deeply analyzes cleaned website context combined with expert profile data, producing structured output including summary, business impact, risks, actionable insights, and a decision verdict  
  - Configuration:  
    - System message defines strict rules to prevent hallucinations and require structured plain text output with specific headers  
    - Output includes sections such as [Context Retrieved from Database], [Website Concise Summary], [Key Considerations], [Business Impact & Opportunities], [Benefits & Strengths], [Risks & Weaknesses], [Actionable Insights], and [Decision Verdict]  
  - Inputs: Cleaned context text and Google Sheets profile data (via AI tool input)  
  - Outputs: Raw AI text output with structured information  
  - Edge cases: AI model errors, hallucinations, incomplete data, performance issues  

- **Structure AI Analysis Output**  
  - Type: LangChain Output Parser Structured node  
  - Role: Parses AI’s textual output into a JSON object with predefined schema fields for downstream use (arrays of strings for most sections, object for decision verdict)  
  - Configuration: JSON schema defining required fields and types  
  - Input: AI raw output  
  - Output: Structured JSON with all analysis fields extracted  
  - Edge cases: Parsing failures if AI output format deviates, missing fields  

---

#### 2.4 Results Recording & User Feedback

**Overview:**  
This final block appends the structured analysis results into a Google Sheets "Analysis Results" sheet and sends a formatted Telegram message back to the user with a concise summary and decision verdict.

**Nodes Involved:**  
- Record Website Analysis Results  
- Send a text message1  

**Node Details:**

- **Record Website Analysis Results**  
  - Type: Google Sheets node  
  - Role: Appends or updates a row in a Google Sheet with all key analysis outputs including verdict, rationale, confidence, business impact, risks, and more  
  - Configuration:  
    - Document ID and sheet specified for "Analysis Results"  
    - Mapping defined for each column to respective fields in AI structured output and URL input  
    - Uses Google Sheets OAuth2 credentials  
  - Input: Structured AI output JSON  
  - Output: Confirmation of row append/update  
  - Edge cases: Google API limits, auth issues, data mapping errors  

- **Send a text message1**  
  - Type: Telegram node (send message)  
  - Role: Delivers a detailed Telegram message to the user summarizing the website URL and all AI-generated insights and decision data  
  - Configuration:  
    - Message uses Markdown formatting and escapes special characters to ensure proper display  
    - Fields included: website URL, concise summary, business impact, actionable insights, decision verdict details (rationale, effort, urgency, confidence, alternative approach)  
    - Uses chat ID from original Telegram Trigger  
  - Input: Structured AI output and initial URL  
  - Edge cases: Telegram API failures, message formatting errors, very long message truncation  

---

### 3. Summary Table

| Node Name                     | Node Type                         | Functional Role                                   | Input Node(s)               | Output Node(s)                 | Sticky Note                                                                                                      |
|-------------------------------|----------------------------------|-------------------------------------------------|-----------------------------|-------------------------------|-----------------------------------------------------------------------------------------------------------------|
| Telegram Trigger              | Telegram Trigger                 | Starts on Telegram message                        | —                           | Extract URL from Message       | **Title**: Telegram Input & URL Extraction<br>Detect incoming Telegram messages and extract URL.               |
| Extract URL from Message      | Code                            | Extracts URL from Telegram message text          | Telegram Trigger            | URL Present?                  |                                                                                                                 |
| URL Present?                 | If                              | Checks if URL exists                              | Extract URL from Message     | Set Input URL Field / Notify User: No Link Found | **Title:** Input Validation & User Notification<br>Ensures URL presence or asks user to resend.               |
| Notify User: No Link Found    | Telegram (Send message)          | Notifies user when no URL found                   | URL Present? (no URL branch) | —                             |                                                                                                                 |
| Set Input URL Field           | Set                             | Stores validated URL for downstream use          | URL Present? (URL branch)    | Launch Web Content Extraction | **Title:** Website Content Extraction<br>Prepares URL and triggers web content crawling.                       |
| Launch Web Content Extraction | HTTP Request                    | Calls Apify API to crawl website content          | Set Input URL Field          | Set Raw Web Content            |                                                                                                                 |
| Set Raw Web Content           | Set                             | Extracts raw website text content from API response | Launch Web Content Extraction | Clean Website Content          |                                                                                                                 |
| Clean Website Content         | LangChain LLM Chain             | Cleans raw website text by removing noise        | Set Raw Web Content          | Set Clean Detailed Context     | **Title:** Content Cleaning & Contextual Analysis<br>Uses AI to clean and prepare content for analysis.         |
| Set Clean Detailed Context    | Set                             | Stores cleaned website content                    | Clean Website Content        | Contextual Website Analyzer AI |                                                                                                                 |
| Fetch Profile from Google Sheets | Google Sheets Tool             | Retrieves expert profile and goals                | —                           | Contextual Website Analyzer AI |                                                                                                                 |
| Contextual Website Analyzer AI | LangChain Agent                | Analyzes content + profile, generates insights   | Set Clean Detailed Context, Fetch Profile from Google Sheets | Record Website Analysis Results |                                                                                                                 |
| Structure AI Analysis Output  | LangChain Output Parser Structured | Parses AI textual output into structured JSON    | Contextual Website Analyzer AI | Contextual Website Analyzer AI (parser output) |                                                                                                                 |
| Record Website Analysis Results | Google Sheets                  | Logs analysis results in Google Sheets            | Contextual Website Analyzer AI | Send a text message1           | **Title:** Results Recording & User Feedback<br>Saves results and sends summary to Telegram user.              |
| Send a text message1          | Telegram (Send message)          | Sends analysis summary and verdict to user       | Record Website Analysis Results | —                             |                                                                                                                 |
| Sticky Note                  | Sticky Note                     | Comments on Telegram Input & URL Extraction       | —                           | —                             | **Title**: Telegram Input & URL Extraction<br>Detect incoming Telegram messages and extract URL if present.    |
| Sticky Note2                 | Sticky Note                     | Comments on Website Content Extraction             | —                           | —                             | **Title:** Website Content Extraction<br>Prepare URL and pull content from target website.                     |
| Sticky Note3                 | Sticky Note                     | Comments on Content Cleaning & Contextual Analysis| —                           | —                             | **Title:** Content Cleaning & Contextual Analysis<br>AI cleans website data and generates business insights.   |
| Sticky Note4                 | Sticky Note                     | Comments on Results Recording & User Feedback      | —                           | —                             | **Title:** Results Recording & User Feedback<br>Save analysis and send summary back to Telegram user.          |
| Sticky Note1                 | Sticky Note                     | Comments on Input Validation & User Notification  | —                           | —                             | **Title:** Input Validation & User Notification<br>Ensure URL exists and provide feedback if missing.          |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger node:**  
   - Type: Telegram Trigger  
   - Trigger on "message" updates  
   - Authenticate with Telegram API credentials  
   - Position: start of workflow  

2. **Add Code node "Extract URL from Message":**  
   - Use JavaScript code to extract first HTTP/HTTPS URL from incoming message text using regex `(https?:\/\/[^\s]+)`  
   - Connect Telegram Trigger output to this node  

3. **Add If node "URL Present?":**  
   - Condition: Check if extracted URL (`$json.url`) is not empty  
   - Connect "Extract URL from Message" to this node  

4. **Add Telegram node "Notify User: No Link Found":**  
   - Send message: "Hmm, I couldn’t find a valid link in your message. Can you try sending the URL again?"  
   - Chat ID from Telegram Trigger message chat id  
   - Connect "URL Present?" node’s false output to this node  

5. **Add Set node "Set Input URL Field":**  
   - Assign field `URL` with value from extracted URL (`={{ $json.url }}`)  
   - Connect "URL Present?" true output to this node  

6. **Add HTTP Request node "Launch Web Content Extraction":**  
   - Method: POST  
   - URL: `https://api.apify.com/v2/acts/6sigmag~deep-website-content-crawler/run-sync-get-dataset-items`  
   - Body (JSON): `{"startUrls": ["{{ $json.URL }}"]}`  
   - Authentication: Use Apify API credentials  
   - Connect "Set Input URL Field" output here  

7. **Add Set node "Set Raw Web Content":**  
   - Assign `Website_content` = `{{$json.text}}` extracted from Apify response  
   - Connect output of "Launch Web Content Extraction"  

8. **Add LangChain LLM Chain node "Clean Website Content":**  
   - Configure prompt to remove irrelevant website text and output detailed factual plain text without summaries or opinions (see overview for prompt details)  
   - Input text: `{{$json.Website_content}}`  
   - Connect "Set Raw Web Content" output here  

9. **Add Set node "Set Clean Detailed Context":**  
   - Assign `cleaned_detailed_context` = cleaned text from previous node output  
   - Connect from "Clean Website Content"  

10. **Add Google Sheets Tool node "Fetch Profile from Google Sheets":**  
    - Configure with Google Sheets OAuth2 credentials  
    - Set Document ID and Sheet Name to expert profile dataset  
    - Connect independently or in parallel with "Set Clean Detailed Context" (both inputs for next node)  

11. **Add LangChain Agent node "Contextual Website Analyzer AI":**  
    - Configure with system prompt that instructs AI to analyze website content with expert profile context and produce structured output with specified headers, concise summary, and decision verdict (see overview for detailed prompt)  
    - Inputs:  
      - `text` = `{{$json.cleaned_detailed_context}}`  
      - AI tool input: output from "Fetch Profile from Google Sheets"  
    - Connect "Set Clean Detailed Context" and "Fetch Profile from Google Sheets" outputs here  

12. **Add LangChain Output Parser Structured node "Structure AI Analysis Output":**  
    - Define JSON schema matching expected AI output fields (arrays for text sections, object for verdict)  
    - Connect AI raw output of "Contextual Website Analyzer AI" to this node  

13. **Add Google Sheets node "Record Website Analysis Results":**  
    - Use Google Sheets OAuth2 credentials  
    - Point to "Analysis Results" sheet in same document or specified document  
    - Map columns to AI output fields and input URL field as per schema: verdict, rationale, confidence, summaries, insights, etc.  
    - Connect "Contextual Website Analyzer AI" output here (use parsed output as needed)  

14. **Add Telegram node "Send a text message1":**  
    - Compose a Markdown-formatted message with all relevant fields escaped for Telegram Markdown (website URL, concise summary, business impact, actionable insights, decision verdict details)  
    - Retrieve chat ID from original Telegram Trigger node  
    - Connect output of "Record Website Analysis Results" here  

15. **Connect nodes in the sequence and verify all credentials:**  
    - Telegram API credentials for triggers and sending messages  
    - Apify API credentials for crawling  
    - Google Sheets OAuth2 credentials for reading profile and writing results  
    - OpenRouter API credentials for LangChain AI nodes  

16. **Test workflow end-to-end with Telegram messages containing valid URLs and verify outputs in Telegram and Google Sheets.**

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                  | Context or Link                                                                                           |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| This workflow uses a sophisticated AI prompt engineering approach to strictly limit hallucinations and ensure factual, structured output from website content and expert profiles.                                                                                                           | Prompt details are embedded in LangChain Agent node and LLM Chain node configurations.                    |
| Telegram message formatting escapes special Markdown characters to prevent display errors.                                                                                                                                                                                                  | See "Send a text message1" node expression with regex replacements.                                       |
| Website content extraction relies on Apify's "deep-website-content-crawler" act; ensure Apify account has sufficient quota and access.                                                                                                                                                      | Apify API documentation: https://apify.com/docs/api/v2/acts/run-sync-get-dataset-items                    |
| Google Sheets document contains at least two sheets: one for expert/company profiles ("Company Details") and another for analysis results ("Analysis Results").                                                                                                                              | Use consistent schema and columns to avoid data mapping errors.                                          |
| The workflow is tagged under "Tool Evaluation", "Web Scraping", and "AI Analysis" reflecting its multi-domain usage.                                                                                                                                                                        | Useful for categorizing and reusing within n8n environment.                                              |
| The AI model used is "openai/gpt-oss-120b" via OpenRouter, an open-source GPT variant; ensure API credentials and rate limits are managed.                                                                                                                                                   | OpenRouter: https://openrouter.ai                                                                        |

---

This detailed reference enables reproduction, modification, and error anticipation for the entire workflow automating website tool assessment via Telegram input, Apify crawling, AI analysis, and Google Sheets documentation.