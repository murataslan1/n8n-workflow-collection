AWS News Monitoring & LinkedIn Content Automation with Claude 3 & Feishu

https://n8nworkflows.xyz/workflows/aws-news-monitoring---linkedin-content-automation-with-claude-3---feishu-8733


# AWS News Monitoring & LinkedIn Content Automation with Claude 3 & Feishu

### 1. Workflow Overview

This workflow automates the monitoring of AWS industry news, analyzes it using AI (Claude 3 via AWS Bedrock), manages the data storage and approval via Feishu Bitable, and automates LinkedIn content generation and publishing upon manual approval. It is designed for cloud architects, DevOps engineers, technical content creators, and marketing teams who want to maintain an active and professional LinkedIn presence focused on AWS developments.

The workflow is logically divided into two major functional blocks:

- **1.1 AWS News Collection & Analysis (Flow 1):**  
  Automatic daily fetching of AWS news from an RSS feed, AI-powered analysis for business and technical insights, data cleaning, and storage in a Feishu Bitable for review and approval.

- **1.2 LinkedIn Content Generation & Publishing (Flow 2):**  
  Triggered by manual approval status changes in Feishu, this block receives the approved news data via webhook, uses AI to generate a professional LinkedIn post, and publishes it to LinkedIn with relevant hashtags and visibility settings.

Supporting these are various configuration notes and helper nodes for data validation and error handling.

---

### 2. Block-by-Block Analysis

#### 2.1 AWS News Collection & Analysis (Flow 1)

**Overview:**  
This block runs daily to fetch the latest AWS news via RSS, uses AI to analyze and summarize the news with professional insights, cleans and formats the output, and then stores the enriched data in Feishu Bitable for manual review and approval.

**Nodes Involved:**  
- Scheduled Trigger  
- RSS Reader  
- RSS Data Debugger (Code)  
- AWS Bedrock Chat Model (Claude 3)  
- AI Agent  
- Structured Output Parser  
- Data Cleaner (Code)  
- Bitable: Add Record (Feishu)

**Node Details:**

- **Scheduled Trigger**  
  - Type: Schedule Trigger  
  - Role: Initiates the workflow daily at 20:00 (8 PM)  
  - Configuration: Runs every day at hour 20  
  - Input: None  
  - Output: Triggers RSS Reader  
  - Potential failures: Scheduler misconfiguration, time zone issues

- **RSS Reader**  
  - Type: RSS Feed Read  
  - Role: Fetches the latest AWS news from the official AWS What's New feed  
  - Configuration: URL set to `https://aws.amazon.com/about-aws/whats-new/recent/feed`  
  - Input: Trigger from Scheduled Trigger  
  - Output: Raw RSS data to RSS Data Debugger  
  - Potential failures: Network errors, feed unavailability, malformed RSS

- **RSS Data Debugger (Code Node)**  
  - Type: Code (JavaScript)  
  - Role: Validates and logs RSS data structure; provides fallback test data if feed is empty  
  - Configuration: Checks input data length and structure; returns dummy data if empty  
  - Input: Raw RSS data from RSS Reader  
  - Output: Validated and possibly fallback RSS data to AI Agent  
  - Potential failures: Code execution errors, empty feed handling ensures robustness

- **AWS Bedrock Chat Model (Claude 3)**  
  - Type: Language Model (AWS Bedrock)  
  - Role: AI backend model execution for news analysis  
  - Configuration: Model set to `anthropic.claude-3-sonnet-20240229-v1:0`  
  - Input: Text from AI Agent node  
  - Output: AI-generated news analysis JSON to AI Agent  
  - Credentials: AWS account with Bedrock access  
  - Potential failures: API errors, authentication issues, rate limits

- **AI Agent**  
  - Type: Langchain Agent  
  - Role: Sends news data to Claude 3 model for structured analysis  
  - Configuration: System message instructs to output a strict JSON with news title, summary, keywords, rating, and link; limits iterations to 5  
  - Input: JSON stringified news data from RSS Data Debugger  
  - Output: Structured JSON news analysis  
  - Edge cases: AI output parsing failures, malformed JSON from AI, retries limited by max iterations  
  - On error: Continues regular output to avoid halting workflow

- **Structured Output Parser**  
  - Type: Langchain Structured Output Parser  
  - Role: Parses Claude 3 output to conform with expected JSON schema for further processing  
  - Configuration: Example JSON schema provided for validation  
  - Input: AI Agent output  
  - Output: Parsed structured JSON to Data Cleaner  
  - Potential failures: Parsing errors if AI output deviates from schema

- **Data Cleaner (Code Node)**  
  - Type: Code (JavaScript)  
  - Role: Cleans and standardizes AI-generated data; removes quotes, trims whitespace, validates required fields  
  - Configuration: Iterates over input items, applies robust extraction logic to handle various data shapes  
  - Input: Parsed AI output  
  - Output: Cleaned, standardized JSON suitable for Feishu Bitable insertion  
  - Edge cases: Invalid or missing fields, unexpected data structures, error logging on failure

- **Bitable: Add Record (Feishu)**  
  - Type: Feishu Bitable Node  
  - Role: Inserts cleaned AI-analyzed news records into Feishu Bitable with an initial approval status of "Pending"  
  - Configuration: Maps title, publication date, summary, keywords, rating, link, and status fields  
  - Credentials: Feishu API credentials with Bitable access  
  - Input: Cleaned news data from Data Cleaner  
  - Output: Confirmation of record addition  
  - Potential failures: API errors, authentication failures, rate limits, schema mismatch

---

#### 2.2 LinkedIn Content Generation & Publishing (Flow 2)

**Overview:**  
Triggered manually by a status change in Feishu Bitable (to "Approved"), this block receives approved news via webhook, uses AI to generate a professional and engaging LinkedIn post styled for technical audiences, and publishes the post via LinkedIn API with relevant hashtags and public visibility.

**Nodes Involved:**  
- Webhook  
- AI Agent2  
- AWS Bedrock Chat Model1 (Claude 3)  
- Create a post (LinkedIn)

**Node Details:**

- **Webhook**  
  - Type: Webhook  
  - Role: Receives HTTP POST requests from Feishu Automation when a news record's approval_status changes to "Approved"  
  - Configuration: Path set to a unique webhook ID; accepts POST requests  
  - Input: Data payload from Feishu automation  
  - Output: Passes data to AI Agent2  
  - Potential failures: Connectivity issues, webhook URL mismatch, payload format errors

- **AI Agent2**  
  - Type: Langchain Agent  
  - Role: Generates LinkedIn post content based on approved news data using Claude 3 model  
  - Configuration: System message defines the voice, style, audience, and structure of the post (professional Solutions Architect perspective, 150-300 words, includes hashtags and source link)  
  - Input: JSON stringified approved news from Webhook  
  - Output: Text content for LinkedIn post  
  - Edge cases: AI generation failures, incomplete input data

- **AWS Bedrock Chat Model1 (Claude 3)**  
  - Type: Language Model (AWS Bedrock)  
  - Role: AI backend for LinkedIn post generation  
  - Configuration: Same Claude 3 model as in Flow 1  
  - Input: Text from AI Agent2  
  - Output: Generated LinkedIn post text  
  - Credentials: AWS account  
  - Potential failures: API errors, quota limits

- **Create a post (LinkedIn)**  
  - Type: LinkedIn Node  
  - Role: Publishes the AI-generated post on LinkedIn with hashtags and public visibility  
  - Configuration: Uses person/company ID, appends hashtags (#AWS #CloudComputing #Technology #Innovation #AWSNews) automatically; visibility set to "PUBLIC"  
  - Credentials: LinkedIn OAuth2 with post permissions  
  - Input: Post content from AI Agent2  
  - Output: Confirmation of published post  
  - Edge cases: Authentication failures, posting permission issues, LinkedIn API rate limits

---

#### 2.3 Supporting Sticky Notes & Documentation Nodes

- **Main Template Description:** Explains the overall workflow purpose and use cases.

- **Flow 1: News Collection & Analysis:** Describes the first block steps and AI analysis features.

- **Flow 2: LinkedIn Content Generation:** Describes the second block steps and manual approval workflow.

- **Feishu Bitable Management:** Details the structure and use of the Feishu Bitable as the central data store.

- **Feishu Automation Setup:** Instructions for setting up Feishu webhook automation to trigger LinkedIn posting.

- **Manual Approval Process:** Explains the human review and approval steps in Feishu.

- **Setup Instructions:** Guides credential configuration and required services (AWS Bedrock, Feishu, LinkedIn, n8n).

---

### 3. Summary Table

| Node Name               | Node Type                          | Functional Role                          | Input Node(s)           | Output Node(s)           | Sticky Note                                                                                  |
|-------------------------|----------------------------------|----------------------------------------|------------------------|-------------------------|------------------------------------------------------------------------------------------------|
| Scheduled Trigger       | Schedule Trigger                  | Initiates daily news fetching           | —                      | RSS Reader              | Flow 1: AWS News Collection & Analysis overview notes                                        |
| RSS Reader             | RSS Feed Read                    | Fetches AWS news RSS feed                | Scheduled Trigger       | RSS Data Debugger       | Flow 1: AWS News Collection & Analysis overview notes                                        |
| RSS Data Debugger       | Code                             | Validates RSS data and fallback          | RSS Reader              | AI Agent                | Flow 1: AWS News Collection & Analysis overview notes                                        |
| AWS Bedrock Chat Model  | Langchain LM (AWS Bedrock)       | AI backend for news analysis             | AI Agent                | AI Agent                | Flow 1: AWS News Collection & Analysis overview notes                                        |
| AI Agent               | Langchain Agent                  | Sends news to AI for structured analysis | RSS Data Debugger       | Structured Output Parser | Flow 1: AWS News Collection & Analysis overview notes                                        |
| Structured Output Parser| Langchain Output Parser          | Parses AI output into structured JSON   | AI Agent                | Data Cleaner            | Flow 1: AWS News Collection & Analysis overview notes                                        |
| Data Cleaner           | Code                             | Cleans and standardizes AI data          | Structured Output Parser| Bitable: Add Record      | Flow 1: AWS News Collection & Analysis overview notes                                        |
| Bitable: Add Record    | Feishu Bitable                   | Stores cleaned news in Feishu Bitable    | Data Cleaner            | —                       | Feishu Bitable Management sticky note                                                       |
| Webhook                | Webhook                         | Receives approved news data via HTTP    | Feishu Automation Setup | AI Agent2               | Flow 2: LinkedIn Content Generation sticky note                                             |
| AI Agent2              | Langchain Agent                  | Generates LinkedIn post content          | Webhook                 | Create a post           | Flow 2: LinkedIn Content Generation sticky note                                             |
| AWS Bedrock Chat Model1 | Langchain LM (AWS Bedrock)       | AI backend for LinkedIn post generation  | AI Agent2               | AI Agent2               | Flow 2: LinkedIn Content Generation sticky note                                             |
| Create a post          | LinkedIn Node                   | Publishes AI-generated post on LinkedIn | AI Agent2               | —                       | Flow 2: LinkedIn Content Generation sticky note                                             |
| Main Template Description | Sticky Note                    | Describes workflow purpose and use cases | —                      | —                       |                                                                                              |
| Flow 1: News Collection & Analysis | Sticky Note            | Overview of AWS news monitoring & analysis | —                      | —                       |                                                                                              |
| Flow 2: LinkedIn Content Generation | Sticky Note            | Overview of LinkedIn content generation & approval | —                      | —                       |                                                                                              |
| Feishu Bitable Management | Sticky Note                   | Explains Feishu Bitable structure & usage | —                      | —                       |                                                                                              |
| Feishu Automation Setup | Sticky Note                    | Instructions to set up Feishu webhook automation | —                      | Webhook                  |                                                                                              |
| Manual Approval Process | Sticky Note                    | Details manual review and approval steps | —                      | —                       |                                                                                              |
| Setup Instructions     | Sticky Note                    | Credential and service configuration instructions | —                      | —                       |                                                                                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Scheduled Trigger node:**  
   - Type: Schedule Trigger  
   - Set to trigger daily at 20:00 (8 PM)  
   - No credentials required

2. **Create RSS Reader node:**  
   - Type: RSS Feed Read  
   - Set URL to: `https://aws.amazon.com/about-aws/whats-new/recent/feed`  
   - Connect Scheduled Trigger output to RSS Reader input

3. **Create RSS Data Debugger node:**  
   - Type: Code  
   - Paste JavaScript code to validate RSS data and provide fallback test data if empty (as per workflow)  
   - Connect RSS Reader output to RSS Data Debugger input

4. **Create AI Agent node for news analysis:**  
   - Type: Langchain Agent  
   - Configure system message to instruct AI to produce structured JSON news analysis, including title, summary (~200 words), keywords, rating, and link  
   - Set max iterations to 5  
   - Connect RSS Data Debugger output to AI Agent input

5. **Create AWS Bedrock Chat Model node:**  
   - Type: Langchain LM Chat AWS Bedrock  
   - Select model: `anthropic.claude-3-sonnet-20240229-v1:0`  
   - Connect AI Agent's ai_languageModel input to this node  
   - Configure AWS credentials with Bedrock access (IAM user with Bedrock permissions)

6. **Create Structured Output Parser node:**  
   - Type: Langchain Output Parser Structured  
   - Provide example JSON schema matching AI output  
   - Connect AI Agent output to this parser

7. **Create Data Cleaner node:**  
   - Type: Code  
   - Paste JavaScript code to clean and standardize AI output data (removes quotes, trims fields, validates required fields)  
   - Connect Structured Output Parser output to Data Cleaner input

8. **Create Feishu Bitable Add Record node:**  
   - Type: Feishu Bitable (n8n-nodes-feishu-lite)  
   - Configure credentials with Feishu developer app having Bitable permissions  
   - Set operation to add record to a table with fields: title, pubDate, summary, keywords, rating, link, approval_status (set to "Pending")  
   - Connect Data Cleaner output to Feishu node input

9. **Create Webhook node for approved data reception:**  
   - Type: Webhook  
   - Set unique path and method POST  
   - This node will receive data from Feishu automation when approval_status changes to "Approved"

10. **Create AI Agent2 node for LinkedIn post generation:**  
    - Type: Langchain Agent  
    - Configure system message to instruct AI to generate a professional LinkedIn post with the given news data, including structure, tone, hashtags, call to action, and source link  
    - Connect Webhook output to AI Agent2 input

11. **Create AWS Bedrock Chat Model1 node:**  
    - Type: Langchain LM Chat AWS Bedrock  
    - Use the same Claude 3 model  
    - Connect AI Agent2's ai_languageModel input to this node  
    - Use same AWS credentials as before

12. **Create LinkedIn Create a Post node:**  
    - Type: LinkedIn node  
    - Configure OAuth2 credentials with posting permission and admin access to LinkedIn company page or personal account  
    - Set post text to AI Agent2 output plus hashtags (#AWS #CloudComputing #Technology #Innovation #AWSNews)  
    - Set visibility to "PUBLIC"  
    - Connect AI Agent2 output to LinkedIn node input

13. **Configure Feishu Automation:**  
    - In Feishu Bitable, configure field automation to trigger when `approval_status` changes to "Approved"  
    - Action: Send HTTP POST request to the webhook URL from step 9  
    - Headers: Content-Type: application/json  
    - Body: send the record data as JSON

14. **Manual Approval Workflow:**  
    - Review news records in Feishu Bitable  
    - When ready, change `approval_status` from "Pending" to "Approved" to trigger LinkedIn posting

15. **Test each step:**  
    - Validate RSS fetching and AI analysis  
    - Confirm data stored in Feishu  
    - Test manual approval triggers LinkedIn post creation

---

### 5. General Notes & Resources

| Note Content                                                                                                                                              | Context or Link                                                                                  |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Requires self-hosted n8n instance to use community nodes such as n8n-nodes-feishu-lite                                                                    | n8n community nodes package: https://www.npmjs.com/package/n8n-nodes-feishu-lite                |
| AWS Bedrock setup guide: Enable Claude 3 Sonnet model, create IAM user with Bedrock permissions                                                           | AWS Bedrock Console: https://console.aws.amazon.com/bedrock/                                   |
| Feishu platform and developer app setup needed to create Bitable and webhook automation                                                                   | Feishu Platform: https://www.feishu.cn/en/ Developer Console: https://open.feishu.cn/          |
| LinkedIn Developer app setup for OAuth2 and posting permissions; set up company page with admin rights                                                    | LinkedIn Developers: https://www.linkedin.com/developers/ Company Pages: https://www.linkedin.com/company/ |
| Workflow designed for professional and technical audiences: CTOs, DevOps engineers, cloud architects, business leaders                                    | —                                                                                              |
| Workflow uses hashtags: #AWS #CloudComputing #Technology #Innovation #AWSNews for LinkedIn posts                                                          | —                                                                                              |
| Feishu Bitable columns: title, pubDate, summary, keywords, rating, link, approval_status (Pending/Approved/Rejected)                                      | See Feishu Bitable Management sticky note                                                      |
| Manual approval ensures quality control and alignment with brand voice before LinkedIn publishing                                                         | See Manual Approval Process sticky note                                                        |
| Feishu webhook URL must exactly match the webhook node in n8n for automation to trigger correctly                                                        | See Feishu Automation Setup sticky note                                                       |

---

This comprehensive documentation enables both human users and AI agents to fully understand, reproduce, and maintain the AWS News Monitoring & LinkedIn Content Automation workflow using Claude 3 and Feishu integrations.