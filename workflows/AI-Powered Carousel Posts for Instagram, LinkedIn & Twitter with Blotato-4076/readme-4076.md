AI-Powered Carousel Posts for Instagram, LinkedIn & Twitter with Blotato

https://n8nworkflows.xyz/workflows/ai-powered-carousel-posts-for-instagram--linkedin---twitter-with-blotato-4076


# AI-Powered Carousel Posts for Instagram, LinkedIn & Twitter with Blotato

---

## 1. Workflow Overview

This workflow automates the generation and publishing of AI-powered carousel posts (slideshows) to multiple social media platforms such as Instagram, LinkedIn, Twitter, and others, leveraging the Blotato API for carousel creation and Google Gemini AI for content generation.

The workflow is designed to run on a schedule (daily at 10 AM by default) and includes several logical blocks:

- **1.1 Trigger and AI Content Generation**: Scheduled trigger initiates the workflow, branching into two AI agents that generate carousel captions and image prompts either automatically or manually.
- **1.2 Setup and Configuration**: Centralized node holding API keys, account IDs, captions, and template IDs for Blotato and social accounts.
- **1.3 Carousel Creation and Retrieval**: Uses Blotato API to create a carousel based on AI-generated prompts and then retrieves the resulting carousel images.
- **1.4 Social Media Publishing**: Sends the carousel posts to various social platforms via Blotato API HTTP requests, with some platforms disabled by default.
- **1.5 Auxiliary Nodes**: Includes wait nodes for timing control and output parsers for structured AI response handling.

---

## 2. Block-by-Block Analysis

### 2.1 Trigger and AI Content Generation

**Overview:**  
This block initiates the workflow on a schedule and produces AI-generated content for carousel posts. It consists of two parallel AI agents: one auto-generates quotes and prompts, the other allows manual input. Both use structured output parsing to ensure consistent JSON responses.

**Nodes Involved:**  
- Schedule Trigger  
- AI Agent - AI Writes Quote and Prompt  
- AI Agent - Specify Quote and Prompt  
- Google Gemini Chat Model1  
- OpenAI Chat Model  
- Structured Output Parser 1  
- Structured Output Parser 2  

**Node Details:**

- **Schedule Trigger**  
  - *Type:* Schedule Trigger  
  - *Role:* Starts the workflow daily at 10 AM (default)  
  - *Config:* Default scheduling parameters; can be customized with cron or time intervals  
  - *Inputs:* None  
  - *Outputs:* Two branches to AI agents  
  - *Failure Modes:* Scheduling misconfiguration, n8n downtime  

- **AI Agent - AI Writes Quote and Prompt**  
  - *Type:* Langchain Agent  
  - *Role:* Automatically generates captions and image prompts using Google Gemini model  
  - *Config:* Connected to Google Gemini Chat Model1 (gemini-2.5-pro or equivalent) and Structured Output Parser 1 to enforce JSON output  
  - *Expressions:* Uses AI prompt templates (modifiable)  
  - *Inputs:* Trigger from Schedule Trigger  
  - *Outputs:* JSON with quote and prompt passed to SETUP node  
  - *Failures:* AI API errors, malformed JSON output (handled by parser)  

- **AI Agent - Specify Quote and Prompt**  
  - *Type:* Langchain Agent  
  - *Role:* Allows manual specification of quotes and prompts; useful for testing or fixed content  
  - *Config:* Connected to OpenAI Chat Model and Structured Output Parser 2  
  - *Expressions:* Editable `text` field for input prompt  
  - *Inputs:* Trigger from Schedule Trigger  
  - *Outputs:* Structured JSON passed to SETUP node  
  - *Failures:* Same as above  

- **Google Gemini Chat Model1**  
  - *Type:* AI Language Model (Google Gemini)  
  - *Role:* Provides AI completions for the first AI agent  
  - *Config:* Requires Google Gemini API credentials configured in n8n  
  - *Inputs:* Prompts from AI Agent - AI Writes Quote and Prompt  
  - *Outputs:* AI text output to parser  
  - *Failures:* Authentication issues, API limits  

- **OpenAI Chat Model**  
  - *Type:* AI Language Model (OpenAI)  
  - *Role:* Provides completions for the manual AI agent  
  - *Config:* Requires OpenAI API credentials  
  - *Inputs:* Prompts from AI Agent - Specify Quote and Prompt  
  - *Outputs:* AI text output to parser  
  - *Failures:* Same as above  

- **Structured Output Parser 1 & 2**  
  - *Type:* Langchain Structured Output Parser  
  - *Role:* Parses AI responses into structured JSON format  
  - *Config:* Schema validation to catch output format errors  
  - *Inputs:* Raw AI completions  
  - *Outputs:* Validated JSON passed to AI Agents  
  - *Failures:* Schema non-compliance, parsing errors  

---

### 2.2 Setup and Configuration

**Overview:**  
This block centralizes all configuration parameters including API keys, social media account IDs, captions, and Blotato template selections. It acts as a parameter hub feeding downstream nodes with required details.

**Nodes Involved:**  
- SETUP  

**Node Details:**

- **SETUP**  
  - *Type:* Set node  
  - *Role:* Stores and outputs configuration data (API keys, account IDs, captions, template IDs)  
  - *Config:* Includes keys such as `blotato_api_key`, `instagram_id`, `caption`, `template` (e.g., "base/slides/quotecard")  
  - *Inputs:* JSON from AI Agents (quotes/prompts)  
  - *Outputs:* Config data to carousel creation node  
  - *Failures:* Missing or invalid keys will cause downstream API failures  
  - *Notes:* Users must update IDs and keys before running live  

---

### 2.3 Carousel Creation and Retrieval

**Overview:**  
This block handles the creation of a carousel on Blotato using the AI-generated content and then retrieves the completed carousel images for publishing.

**Nodes Involved:**  
- Create Carousel  
- Wait  
- Get Carousel  

**Node Details:**

- **Create Carousel**  
  - *Type:* HTTP Request  
  - *Role:* Sends POST request to Blotato API to create a carousel using setup parameters and AI content  
  - *Config:* Uses `blotato_api_key` from SETUP, includes captions, prompts, and template ID in payload  
  - *Inputs:* Configuration and AI-generated content from SETUP  
  - *Outputs:* Response including carousel creation ID for retrieval  
  - *Failures:* API authentication errors, invalid payloads, network issues  

- **Wait**  
  - *Type:* Wait node  
  - *Role:* Delays workflow execution to allow Blotato to process carousel creation  
  - *Config:* Default wait time; can be adjusted to match API processing time  
  - *Inputs:* Output from Create Carousel  
  - *Outputs:* Triggers Get Carousel  
  - *Failures:* Timing too short may cause retrieval failures  

- **Get Carousel**  
  - *Type:* HTTP Request  
  - *Role:* Retrieves carousel images and metadata from Blotato using creation ID  
  - *Config:* Uses API key and carousel ID from Create Carousel output  
  - *Inputs:* Triggered after wait period  
  - *Outputs:* Carousel image URLs and metadata for publishing  
  - *Failures:* API errors, missing carousel ID, timeout  

---

### 2.4 Social Media Publishing

**Overview:**  
This block publishes the generated carousel posts to multiple social media platforms through Blotato’s API endpoints. Nodes for Facebook, TikTok, Threads, Bluesky, and Pinterest are disabled by default.

**Nodes Involved:**  
- [Instagram] Publish via Blotato  
- [Facebook] Publish via Blotato (disabled)  
- [Linkedin] Publish via Blotato  
- [Tiktok] Publish via Blotato (disabled)  
- [Threads] Publish via Blotato (disabled)  
- [Twitter] Publish via Blotato  
- [Bluesky] Publish via Blotato (disabled)  
- [Pinterest] Publish via Blotato (disabled)  

**Node Details:**

- **Publish via Blotato Nodes (all)**  
  - *Type:* HTTP Request  
  - *Role:* POST requests to respective Blotato social publishing endpoints with carousel images and captions  
  - *Config:* Each uses `blotato_api_key` and platform-specific account IDs from SETUP  
  - *Inputs:* Carousel data from Get Carousel node  
  - *Outputs:* API responses confirming post success or failure  
  - *Disabled by default:* Facebook, TikTok, Threads, Bluesky, Pinterest nodes disabled to avoid unwanted posts  
  - *Failures:* Auth errors, invalid account IDs, API limits, network issues  
  - *Customization:* Enable nodes and update account IDs to activate additional platforms  

---

### 2.5 Auxiliary and Miscellaneous Nodes

**Overview:**  
Supporting nodes include sticky notes for documentation and placeholders for user guidance.

**Nodes Involved:**  
- Sticky Note  
- Sticky Note1  
- Sticky Note2  
- Sticky Note3  

**Node Details:**

- **Sticky Notes**  
  - *Type:* Sticky Note  
  - *Role:* Provide inline documentation and user instructions within the workflow canvas  
  - *Config:* Contain textual notes, no input/output connections  
  - *Failures:* None  

---

## 3. Summary Table

| Node Name                      | Node Type                         | Functional Role                         | Input Node(s)                       | Output Node(s)                                         | Sticky Note                                     |
|-------------------------------|----------------------------------|---------------------------------------|-----------------------------------|-------------------------------------------------------|------------------------------------------------|
| Schedule Trigger               | Schedule Trigger                 | Starts workflow on schedule           | None                              | AI Agent - AI Writes Quote and Prompt, AI Agent - Specify Quote and Prompt |                                                |
| AI Agent - AI Writes Quote and Prompt | Langchain Agent                 | Auto-generates quotes/prompts         | Schedule Trigger                  | SETUP                                                |                                                |
| AI Agent - Specify Quote and Prompt | Langchain Agent                 | Manual quote/prompt input              | Schedule Trigger                  | SETUP                                                |                                                |
| Google Gemini Chat Model1      | AI Language Model (Google Gemini) | AI completions for auto AI agent      | AI Agent - AI Writes Quote and Prompt | AI Agent - AI Writes Quote and Prompt                 |                                                |
| OpenAI Chat Model              | AI Language Model (OpenAI)       | AI completions for manual AI agent    | AI Agent - Specify Quote and Prompt | AI Agent - Specify Quote and Prompt                   |                                                |
| Structured Output Parser 1     | Structured Output Parser         | Validates AI output for auto agent    | Google Gemini Chat Model1          | AI Agent - AI Writes Quote and Prompt                 |                                                |
| Structured Output Parser 2     | Structured Output Parser         | Validates AI output for manual agent  | OpenAI Chat Model                 | AI Agent - Specify Quote and Prompt                   |                                                |
| SETUP                         | Set                             | Holds API keys, IDs, captions, config| AI Agents                        | Create Carousel                                      |                                                |
| Create Carousel               | HTTP Request                    | Creates carousel on Blotato           | SETUP                           | Wait                                                 |                                                |
| Wait                          | Wait                           | Delays to allow carousel processing   | Create Carousel                  | Get Carousel                                         |                                                |
| Get Carousel                  | HTTP Request                   | Retrieves carousel images             | Wait                           | All Publish via Blotato nodes                         |                                                |
| [Instagram] Publish via Blotato | HTTP Request                    | Publishes carousel post to Instagram | Get Carousel                   | None                                                 |                                                |
| [Facebook] Publish via Blotato | HTTP Request (Disabled)          | Publishes to Facebook                 | Get Carousel                   | None                                                 |                                                |
| [Linkedin] Publish via Blotato | HTTP Request                    | Publishes to LinkedIn                 | Get Carousel                   | None                                                 |                                                |
| [Tiktok] Publish via Blotato  | HTTP Request (Disabled)          | Publishes to TikTok                   | Get Carousel                   | None                                                 |                                                |
| [Threads] Publish via Blotato | HTTP Request (Disabled)          | Publishes to Threads                  | Get Carousel                   | None                                                 |                                                |
| [Twitter] Publish via Blotato | HTTP Request                    | Publishes to Twitter                  | Get Carousel                   | None                                                 |                                                |
| [Bluesky] Publish via Blotato | HTTP Request (Disabled)          | Publishes to Bluesky                  | Get Carousel                   | None                                                 |                                                |
| [Pinterest] Publish via Blotato | HTTP Request (Disabled)          | Publishes to Pinterest                | Get Carousel                   | None                                                 |                                                |
| Sticky Note                   | Sticky Note                    | Documentation and guidance            | None                          | None                                                 |                                                |
| Sticky Note1                  | Sticky Note                    | Documentation and guidance            | None                          | None                                                 |                                                |
| Sticky Note2                  | Sticky Note                    | Documentation and guidance            | None                          | None                                                 |                                                |
| Sticky Note3                  | Sticky Note                    | Documentation and guidance            | None                          | None                                                 |                                                |

---

## 4. Reproducing the Workflow from Scratch

1. **Create the Schedule Trigger Node**  
   - Type: Schedule Trigger  
   - Configure to trigger daily at 10 AM or preferred schedule.  

2. **Create AI Language Models**  
   - Create `Google Gemini Chat Model1` node: configure with Google Gemini API credentials.  
   - Create `OpenAI Chat Model` node: configure with OpenAI API credentials.  

3. **Create AI Agents**  
   - Create `AI Agent - AI Writes Quote and Prompt` (Langchain Agent):  
     - Connect `Google Gemini Chat Model1` as AI language model.  
     - Connect `Structured Output Parser 1` as output parser.  
     - Configure prompt templates for auto-generation of quotes/prompts.  
   - Create `AI Agent - Specify Quote and Prompt` (Langchain Agent):  
     - Connect `OpenAI Chat Model` as AI language model.  
     - Connect `Structured Output Parser 2` as output parser.  
     - Configure prompt text for manual quote/prompt input.  

4. **Create Structured Output Parsers**  
   - Add `Structured Output Parser 1` and `Structured Output Parser 2`: configure schemas for expected JSON output from AI.  

5. **Connect Schedule Trigger Outputs**  
   - Connect Schedule Trigger output to both AI Agents to run in parallel.  

6. **Create SETUP Node**  
   - Type: Set node  
   - Include parameters:  
     - `blotato_api_key` (your Blotato API key)  
     - Social media account IDs (`instagram_id`, `facebook_id`, `twitter_id`, etc.)  
     - Default caption text  
     - Blotato template ID (e.g., `base/slides/quotecard`)  
   - Connect both AI Agents outputs to this node to merge AI content with config.  

7. **Create Carousel Creation Node**  
   - Type: HTTP Request  
   - Configure POST request to Blotato API endpoint to create carousel.  
   - Use API key and content from SETUP node in the request body.  
   - Connect SETUP output to this node.  

8. **Add Wait Node**  
   - Add a Wait node to pause the workflow for a suitable time to allow carousel creation (default or configurable).  
   - Connect Create Carousel output to Wait node.  

9. **Add Get Carousel Node**  
   - Type: HTTP Request  
   - Configure GET request to Blotato API to retrieve the created carousel images using response ID from Create Carousel.  
   - Connect Wait node output to Get Carousel node.  

10. **Add Social Media Publishing Nodes**  
    - For each social platform (Instagram, Facebook, LinkedIn, TikTok, Threads, Twitter, Bluesky, Pinterest):  
      - Create HTTP Request node.  
      - Configure POST requests to respective Blotato social publishing API endpoints.  
      - Use `blotato_api_key` and platform account IDs from SETUP node.  
      - Connect each node's input to Get Carousel output.  
      - Disable nodes for platforms not in use by default.  

11. **Add Sticky Notes**  
    - Optionally add Sticky Note nodes to provide inline documentation.  

12. **Activate and Test**  
    - Enable required nodes.  
    - Run manual executions to test AI generation, carousel creation, and publishing steps.  
    - Adjust parameters as needed for timing, prompts, or account details.  

13. **Configure Credentials in n8n**  
    - Add HTTP Request or Generic Credentials for Blotato API key.  
    - Add Google Gemini API credentials under Google Palm API.  
    - Add OpenAI API credentials.  

---

## 5. General Notes & Resources

| Note Content                                                                                                                | Context or Link                                  |
|-----------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------|
| Official Blotato website for API key and account setup                                                                      | https://www.blotato.com/                         |
| n8n official website and cloud/self-hosted instance signup                                                                   | https://n8n.io/                                  |
| Google Gemini API key required for AI content generation                                                                     | See Google Cloud Console or Google Palm API docs|
| To customize AI prompts and themes, edit the `text` field in AI Agent nodes                                                  | Workflow Step 4 in documentation                 |
| Disable unused social platform nodes to avoid accidental posts                                                               | Workflow Step 6 in documentation                 |
| For troubleshooting API errors, verify keys and account IDs in SETUP node                                                    | Workflow Step 8 Troubleshooting table             |
| Adding an Error Trigger node can help capture and handle execution failures                                                  | Customization Tips                                |

---

**Disclaimer:**  
The text provided is exclusively derived from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with the applicable content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.

---