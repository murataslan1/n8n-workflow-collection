AI-Powered Social Media Content Generator & Publisher

https://n8nworkflows.xyz/workflows/ai-powered-social-media-content-generator---publisher-2950


# AI-Powered Social Media Content Generator & Publisher

### 1. Workflow Overview

This workflow, titled **AI-Powered Social Media Content Generator & Publisher**, automates the creation and publishing of social media posts across LinkedIn, Instagram, Facebook, and Twitter (X) using AI-generated content from Google Gemini AI. It is designed for marketers, business owners, influencers, and content creators who want to streamline social media content production and distribution.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception & Preprocessing**: Captures user inputs via form submission, including post title, keywords, optional links, and image uploads.
- **1.2 AI Content Generation**: Uses Google Gemini AI to generate optimized social media posts tailored for each platform.
- **1.3 Content Aggregation & Review Preparation**: Aggregates AI-generated content and prepares it for user review.
- **1.4 Image Processing & Hosting**: Handles image uploads, renames and processes images for Instagram and Facebook, and uploads images to imgbb.com for hosting.
- **1.5 Automated Publishing**: Publishes the approved posts to LinkedIn, Facebook, Instagram, and Twitter (X) using their respective APIs.
- **1.6 Post-Publishing Confirmation & Tracking**: Provides confirmation and tracking links for the published posts.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Preprocessing

- **Overview:**  
  This block captures user inputs from a web form, including text fields and image uploads. It splits and organizes the form data for downstream processing.

- **Nodes Involved:**  
  - On form submission  
  - Split Form Input  
  - Split Data  
  - Data for AI  

- **Node Details:**  

  - **On form submission**  
    - *Type:* Form Trigger  
    - *Role:* Entry point that triggers the workflow when a user submits the form.  
    - *Configuration:* Uses a webhook with ID `syncbricks-social-posting-ai-agent` to receive form data.  
    - *Inputs:* External HTTP request (form submission).  
    - *Outputs:* Passes raw form data to "Split Form Input".  
    - *Edge Cases:* Missing or malformed form data; webhook connectivity issues.

  - **Split Form Input**  
    - *Type:* Set  
    - *Role:* Organizes and separates the raw form data into manageable parts.  
    - *Configuration:* Likely extracts fields such as post title, keywords, links, and image references.  
    - *Inputs:* Data from "On form submission".  
    - *Outputs:* Passes structured data to "Split Data".  
    - *Edge Cases:* Unexpected form field names or empty fields.

  - **Split Data**  
    - *Type:* Set  
    - *Role:* Further refines and prepares data specifically for AI processing and other uses.  
    - *Configuration:* Prepares data subsets for AI content generation and image handling.  
    - *Inputs:* Data from "Split Form Input".  
    - *Outputs:* Passes AI-related data to "Data for AI".  
    - *Edge Cases:* Data inconsistency or missing required fields.

  - **Data for AI**  
    - *Type:* Set  
    - *Role:* Final preparation of data to be sent to the AI agent.  
    - *Configuration:* Sets variables and parameters required by the AI agent node.  
    - *Inputs:* Data from "Split Data".  
    - *Outputs:* Passes data to "AI Agent".  
    - *Edge Cases:* Invalid or incomplete data for AI processing.

---

#### 2.2 AI Content Generation

- **Overview:**  
  This block generates platform-optimized social media post content using Google Gemini AI, structured and parsed for downstream use.

- **Nodes Involved:**  
  - AI Agent  
  - Google Gemini Chat Model  
  - Structured Output Parser  
  - Aggregate  

- **Node Details:**  

  - **Google Gemini Chat Model**  
    - *Type:* Language Model (Google Gemini)  
    - *Role:* Provides AI-generated text based on input prompts.  
    - *Configuration:* Connected as the language model for the AI Agent node.  
    - *Inputs:* Receives prompts and data from the AI Agent node.  
    - *Outputs:* Returns AI-generated chat completions.  
    - *Edge Cases:* API key issues, rate limits, network timeouts.

  - **Structured Output Parser**  
    - *Type:* Output Parser  
    - *Role:* Parses AI output into structured JSON or defined format for easier processing.  
    - *Configuration:* Connected as the output parser for the AI Agent node.  
    - *Inputs:* Raw AI output from Google Gemini Chat Model.  
    - *Outputs:* Structured content for aggregation.  
    - *Edge Cases:* Parsing errors if AI output format changes or is malformed.

  - **AI Agent**  
    - *Type:* LangChain Agent  
    - *Role:* Orchestrates AI prompt sending and output parsing.  
    - *Configuration:* Uses Google Gemini Chat Model and Structured Output Parser as subcomponents.  
    - *Inputs:* Receives prepared data from "Data for AI".  
    - *Outputs:* Passes structured AI-generated content to "Aggregate".  
    - *Edge Cases:* Expression failures, API errors, or misconfiguration.

  - **Aggregate**  
    - *Type:* Aggregate  
    - *Role:* Combines multiple AI-generated content pieces into a single dataset for further processing.  
    - *Configuration:* Aggregates AI outputs for all platforms.  
    - *Inputs:* AI Agent outputs.  
    - *Outputs:* Passes aggregated content to "Upload Image".  
    - *Edge Cases:* Empty or partial aggregation due to upstream failures.

---

#### 2.3 Content Aggregation & Review Preparation

- **Overview:**  
  Prepares the AI-generated content and user inputs for review and final editing before publishing.

- **Nodes Involved:**  
  - Upload Image  
  - Nest Top Meta  
  - Rename Image Binary Top Image  
  - Edit Fields  
  - Merge1  
  - Form  

- **Node Details:**  

  - **Upload Image**  
    - *Type:* Form  
    - *Role:* Handles image upload form for Instagram and Facebook posts.  
    - *Configuration:* Uses webhook ID `0dc811ef-b2e0-4213-a0c9-e9b5fb9fcbf1`.  
    - *Inputs:* Aggregated AI content.  
    - *Outputs:* Passes image data to "Nest Top Meta".  
    - *Edge Cases:* Upload failures, unsupported image formats.

  - **Nest Top Meta**  
    - *Type:* Set  
    - *Role:* Organizes metadata and nests image data for downstream processing.  
    - *Configuration:* Sets structured metadata fields.  
    - *Inputs:* Image data from "Upload Image".  
    - *Outputs:* Passes to "Rename Image Binary Top Image".  
    - *Edge Cases:* Missing metadata fields.

  - **Rename Image Binary Top Image**  
    - *Type:* Code  
    - *Role:* Renames the binary property of the uploaded image to a standard name for consistency.  
    - *Configuration:* Custom JavaScript code to rename binary data key.  
    - *Inputs:* Data from "Nest Top Meta".  
    - *Outputs:* Passes renamed image binary to multiple publishing nodes and image hosting.  
    - *Edge Cases:* Binary data missing or corrupted.

  - **Edit Fields**  
    - *Type:* Set  
    - *Role:* Allows manual editing or adjustment of fields before final publishing.  
    - *Configuration:* Sets or modifies fields such as text content or metadata.  
    - *Inputs:* Data from "X" (Twitter) node output.  
    - *Outputs:* Passes to "Merge1".  
    - *Edge Cases:* Incorrect field edits causing publishing errors.

  - **Merge1**  
    - *Type:* Merge  
    - *Role:* Combines outputs from multiple publishing nodes for final form submission.  
    - *Configuration:* Merges data streams from LinkedIn, Facebook, Instagram, and Twitter publishing nodes.  
    - *Inputs:* Outputs from "Publish to LinkedIn", "Publish to Facebook", "Publish to Instagram", and "Edit Fields".  
    - *Outputs:* Passes merged data to "Form".  
    - *Edge Cases:* Merge conflicts or missing inputs.

  - **Form**  
    - *Type:* Form  
    - *Role:* Presents final content for user review and approval before publishing.  
    - *Configuration:* Uses webhook ID `e84b9492-038c-4701-a367-c68237ddebf6`.  
    - *Inputs:* Merged publishing data.  
    - *Outputs:* Final confirmation and tracking.  
    - *Edge Cases:* User cancellation or timeout.

---

#### 2.4 Image Processing & Hosting

- **Overview:**  
  Processes images for Instagram and Facebook, uploads images to imgbb.com for hosting, and prepares images for API publishing.

- **Nodes Involved:**  
  - Upload Image to imgbb.com  
  - Image for Instagram  
  - Publish to Instagram  

- **Node Details:**  

  - **Upload Image to imgbb.com**  
    - *Type:* HTTP Request  
    - *Role:* Uploads images to imgbb.com image hosting service.  
    - *Configuration:* Uses imgbb API key and HTTP POST request with image binary data.  
    - *Inputs:* Image binary from "Rename Image Binary Top Image".  
    - *Outputs:* Passes hosted image URL to "Image for Instagram".  
    - *Edge Cases:* API key invalid, upload failure, network issues.

  - **Image for Instagram**  
    - *Type:* HTTP Request  
    - *Role:* Prepares the hosted image for Instagram Graph API publishing.  
    - *Configuration:* Sends HTTP requests to Instagram API endpoints with image URL and metadata.  
    - *Inputs:* Hosted image URL from "Upload Image to imgbb.com".  
    - *Outputs:* Passes prepared image data to "Publish to Instagram".  
    - *Edge Cases:* API rate limits, invalid image URLs.

  - **Publish to Instagram**  
    - *Type:* Facebook Graph API  
    - *Role:* Publishes the image post to Instagram via Facebook Graph API.  
    - *Configuration:* Uses Facebook OAuth2 credentials with Instagram permissions.  
    - *Inputs:* Image data from "Image for Instagram".  
    - *Outputs:* Passes publishing confirmation to "Merge1".  
    - *Edge Cases:* Authentication errors, permission issues, API failures.

---

#### 2.5 Automated Publishing

- **Overview:**  
  Publishes the AI-generated and user-approved posts to LinkedIn, Facebook, and Twitter (X) using their respective APIs.

- **Nodes Involved:**  
  - Publish to LinkedIn  
  - Publish to Facebook  
  - X (Twitter)  

- **Node Details:**  

  - **Publish to LinkedIn**  
    - *Type:* LinkedIn API Node  
    - *Role:* Publishes posts to LinkedIn.  
    - *Configuration:* Uses LinkedIn OAuth2 credentials, posts text and optional links.  
    - *Inputs:* Image and text content from "Rename Image Binary Top Image" and AI content.  
    - *Outputs:* Passes publishing result to "Merge1".  
    - *Edge Cases:* Token expiration, API limits, content rejection.

  - **Publish to Facebook**  
    - *Type:* Facebook Graph API  
    - *Role:* Publishes posts to Facebook pages or profiles.  
    - *Configuration:* Uses Facebook OAuth2 credentials, supports image posts.  
    - *Inputs:* Image and text content from "Rename Image Binary Top Image" and AI content.  
    - *Outputs:* Passes publishing result to "Merge1".  
    - *Edge Cases:* Permission errors, API rate limits.

  - **X (Twitter)**  
    - *Type:* Twitter API Node  
    - *Role:* Publishes tweets to Twitter (X).  
    - *Configuration:* Uses Twitter OAuth2 credentials, posts text content.  
    - *Inputs:* Edited fields from "Rename Image Binary Top Image" and "Edit Fields".  
    - *Outputs:* Passes publishing result to "Edit Fields".  
    - *Edge Cases:* Rate limits, authentication failures, content policy violations.

---

#### 2.6 Post-Publishing Confirmation & Tracking

- **Overview:**  
  Consolidates publishing results and provides confirmation and tracking links to the user.

- **Nodes Involved:**  
  - Merge1  
  - Form  

- **Node Details:**  

  - **Merge1**  
    - *Type:* Merge  
    - *Role:* Combines publishing results from all platforms.  
    - *Configuration:* Merges multiple inputs into one output stream.  
    - *Inputs:* Outputs from all publishing nodes.  
    - *Outputs:* Passes consolidated data to "Form".  
    - *Edge Cases:* Missing or delayed publishing results.

  - **Form**  
    - *Type:* Form  
    - *Role:* Displays confirmation and tracking links to the user.  
    - *Configuration:* Uses webhook to present final data.  
    - *Inputs:* Merged publishing results.  
    - *Outputs:* Ends workflow or triggers follow-up actions.  
    - *Edge Cases:* User does not receive confirmation due to network issues.

---

### 3. Summary Table

| Node Name                    | Node Type                          | Functional Role                          | Input Node(s)                          | Output Node(s)                          | Sticky Note                                                                                  |
|------------------------------|----------------------------------|----------------------------------------|--------------------------------------|---------------------------------------|----------------------------------------------------------------------------------------------|
| On form submission            | Form Trigger                     | Entry point for user form submission   | -                                    | Split Form Input                      |                                                                                              |
| Split Form Input              | Set                              | Organizes raw form data                 | On form submission                   | Split Data                           |                                                                                              |
| Split Data                   | Set                              | Prepares data subsets                   | Split Form Input                    | Data for AI                         |                                                                                              |
| Data for AI                  | Set                              | Final data prep for AI agent            | Split Data                         | AI Agent                           |                                                                                              |
| Google Gemini Chat Model     | Language Model (Google Gemini)   | Generates AI content                    | AI Agent (as language model)        | AI Agent (as output)                |                                                                                              |
| Structured Output Parser     | Output Parser                   | Parses AI output into structured format| AI Agent (as output parser)         | AI Agent                           |                                                                                              |
| AI Agent                    | LangChain Agent                 | Orchestrates AI prompt and parsing     | Data for AI                        | Aggregate                         |                                                                                              |
| Aggregate                   | Aggregate                      | Combines AI-generated content          | AI Agent                          | Upload Image                      |                                                                                              |
| Upload Image                | Form                           | Handles image upload form               | Aggregate                        | Nest Top Meta                    |                                                                                              |
| Nest Top Meta               | Set                            | Organizes image metadata                | Upload Image                    | Rename Image Binary Top Image    |                                                                                              |
| Rename Image Binary Top Image| Code                           | Renames image binary property           | Nest Top Meta                   | X, Publish to LinkedIn, Publish to Facebook, Upload Image to imgbb.com |                                                                                              |
| Edit Fields                 | Set                            | Allows manual field edits before publish| X                               | Merge1                           |                                                                                              |
| Merge1                      | Merge                          | Combines publishing outputs             | Publish to LinkedIn, Publish to Facebook, Publish to Instagram, Edit Fields | Form                             |                                                                                              |
| Form                        | Form                           | Final user review and confirmation      | Merge1                          | -                                 |                                                                                              |
| Upload Image to imgbb.com   | HTTP Request                   | Uploads images to imgbb.com              | Rename Image Binary Top Image    | Image for Instagram              |                                                                                              |
| Image for Instagram         | HTTP Request                   | Prepares image for Instagram API        | Upload Image to imgbb.com        | Publish to Instagram             |                                                                                              |
| Publish to Instagram        | Facebook Graph API             | Publishes posts to Instagram             | Image for Instagram              | Merge1                          |                                                                                              |
| Publish to Facebook         | Facebook Graph API             | Publishes posts to Facebook              | Rename Image Binary Top Image    | Merge1                          |                                                                                              |
| Publish to LinkedIn         | LinkedIn API Node              | Publishes posts to LinkedIn              | Rename Image Binary Top Image    | Merge1                          |                                                                                              |
| X                          | Twitter API Node               | Publishes tweets to Twitter (X)          | Rename Image Binary Top Image    | Edit Fields                     |                                                                                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Trigger Node:**  
   - Add a **Form Trigger** node named "On form submission".  
   - Configure webhook ID as `syncbricks-social-posting-ai-agent`.  
   - This node listens for user form submissions containing post title, keywords, optional link, and image.

2. **Split and Organize Form Data:**  
   - Add a **Set** node named "Split Form Input".  
   - Connect "On form submission" → "Split Form Input".  
   - Configure to extract and separate form fields (e.g., title, keywords, link, image reference).

3. **Further Data Preparation:**  
   - Add a **Set** node named "Split Data".  
   - Connect "Split Form Input" → "Split Data".  
   - Configure to prepare data subsets for AI processing and image handling.

4. **Prepare Data for AI:**  
   - Add a **Set** node named "Data for AI".  
   - Connect "Split Data" → "Data for AI".  
   - Configure variables and parameters required for AI prompt.

5. **Configure AI Content Generation:**  
   - Add a **LangChain Agent** node named "AI Agent".  
   - Connect "Data for AI" → "AI Agent".  
   - Add a **Google Gemini Chat Model** node.  
   - Connect "Google Gemini Chat Model" as the language model input to "AI Agent".  
   - Add a **Structured Output Parser** node.  
   - Connect "Structured Output Parser" as the output parser input to "AI Agent".  
   - Configure API keys and credentials for Google Gemini AI.

6. **Aggregate AI Outputs:**  
   - Add an **Aggregate** node named "Aggregate".  
   - Connect "AI Agent" → "Aggregate".  
   - Configure to combine AI-generated content for all platforms.

7. **Image Upload Form:**  
   - Add a **Form** node named "Upload Image".  
   - Configure webhook ID `0dc811ef-b2e0-4213-a0c9-e9b5fb9fcbf1`.  
   - Connect "Aggregate" → "Upload Image".  
   - This node allows users to upload images for Instagram and Facebook.

8. **Organize Image Metadata:**  
   - Add a **Set** node named "Nest Top Meta".  
   - Connect "Upload Image" → "Nest Top Meta".  
   - Configure to nest image metadata for processing.

9. **Rename Image Binary:**  
   - Add a **Code** node named "Rename Image Binary Top Image".  
   - Connect "Nest Top Meta" → "Rename Image Binary Top Image".  
   - Implement JavaScript code to rename the binary property of the image to a standard key.  
   - Connect outputs of this node to the following nodes:  
     - "X" (Twitter)  
     - "Publish to LinkedIn"  
     - "Publish to Facebook"  
     - "Upload Image to imgbb.com"

10. **Twitter Publishing:**  
    - Add a **Twitter** node named "X".  
    - Connect "Rename Image Binary Top Image" → "X".  
    - Configure Twitter OAuth2 credentials.  
    - Output connects to "Edit Fields".

11. **Edit Fields Before Publishing:**  
    - Add a **Set** node named "Edit Fields".  
    - Connect "X" → "Edit Fields".  
    - Configure to allow manual edits to tweet content if needed.  
    - Connect output to "Merge1".

12. **LinkedIn Publishing:**  
    - Add a **LinkedIn** node named "Publish to LinkedIn".  
    - Connect "Rename Image Binary Top Image" → "Publish to LinkedIn".  
    - Configure LinkedIn OAuth2 credentials.  
    - Connect output to "Merge1".

13. **Facebook Publishing:**  
    - Add a **Facebook Graph API** node named "Publish to Facebook".  
    - Connect "Rename Image Binary Top Image" → "Publish to Facebook".  
    - Configure Facebook OAuth2 credentials.  
    - Connect output to "Merge1".

14. **Image Hosting on imgbb.com:**  
    - Add an **HTTP Request** node named "Upload Image to imgbb.com".  
    - Connect "Rename Image Binary Top Image" → "Upload Image to imgbb.com".  
    - Configure HTTP POST request to imgbb API with API key and image binary.  
    - Connect output to "Image for Instagram".

15. **Prepare Image for Instagram:**  
    - Add an **HTTP Request** node named "Image for Instagram".  
    - Connect "Upload Image to imgbb.com" → "Image for Instagram".  
    - Configure HTTP request to Instagram Graph API with hosted image URL.  
    - Connect output to "Publish to Instagram".

16. **Instagram Publishing:**  
    - Add a **Facebook Graph API** node named "Publish to Instagram".  
    - Connect "Image for Instagram" → "Publish to Instagram".  
    - Configure Facebook OAuth2 credentials with Instagram permissions.  
    - Connect output to "Merge1".

17. **Merge Publishing Outputs:**  
    - Add a **Merge** node named "Merge1".  
    - Connect outputs from:  
      - "Publish to LinkedIn"  
      - "Publish to Facebook"  
      - "Publish to Instagram"  
      - "Edit Fields" (Twitter)  
    - Configure to merge all publishing results.

18. **Final Confirmation Form:**  
    - Add a **Form** node named "Form".  
    - Configure webhook ID `e84b9492-038c-4701-a367-c68237ddebf6`.  
    - Connect "Merge1" → "Form".  
    - This node presents confirmation and tracking links to the user.

---

### 5. General Notes & Resources

| Note Content                                                                                                   | Context or Link                                                                                      |
|---------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| Workflow uses Google Gemini AI for generating optimized social media content.                                  | Requires Google Gemini AI API key.                                                                  |
| Image uploads are handled via a dedicated form and hosted on imgbb.com for Instagram compatibility.           | Requires imgbb API key.                                                                             |
| Publishing uses official APIs: Facebook Graph API, LinkedIn API, Twitter API, Instagram API via Facebook Graph.| Requires respective OAuth2 credentials for each platform.                                          |
| YouTube video tutorial available for setup and usage guidance.                                                | [YouTube Tutorial - AI-Powered Social Media Posting in n8n](https://youtu.be/-Oc_HfreJJE?si=BUmsld-SVd-i8wi2) |
| Developed by Amjid Ali from SyncBricks.                                                                       | Website: https://syncbricks.com, LinkedIn: https://linkedin.com/in/amjidali, YouTube: https://youtube.com/@syncbricks |
| Support and contributions encouraged via PayPal donations.                                                    | http://paypal.me/pmptraining                                                                         |
| Full AI Automation courses available on SyncBricks LMS and Udemy.                                            | http://lms.syncbricks.com, https://www.udemy.com/course/ai-automation-mastery-build-intelligent-agents-with-lowcode/?referralCode=0062E7C1D64784AB70CA |

---

This structured documentation provides a comprehensive understanding of the workflow’s architecture, node-by-node functionality, reproduction steps, and additional resources for users and developers.