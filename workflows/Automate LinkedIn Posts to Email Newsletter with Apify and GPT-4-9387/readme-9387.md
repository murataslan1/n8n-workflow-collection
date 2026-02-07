Automate LinkedIn Posts to Email Newsletter with Apify and GPT-4

https://n8nworkflows.xyz/workflows/automate-linkedin-posts-to-email-newsletter-with-apify-and-gpt-4-9387


# Automate LinkedIn Posts to Email Newsletter with Apify and GPT-4

### 1. Workflow Overview

This workflow automates the process of transforming recent LinkedIn posts into professional email newsletters and sending them via email. It targets content marketers, social media managers, or newsletter editors who want to repurpose LinkedIn content for email campaigns without manual rewriting or formatting.

**Logical Blocks:**

- **1.1 LinkedIn Posts Ingestion:** Scheduled trigger to run an Apify actor that fetches the latest LinkedIn posts for a given user.
- **1.2 LinkedIn Post Filtering and Preparation:** Selects the first post from the dataset and maps its text content into a variable for further processing.
- **1.3 Post Conversion to Email Newsletter:** Uses OpenAI GPT-4 to reformat the LinkedIn post text into a structured, engaging email newsletter in plain text.
- **1.4 Email HTML Conversion:** Converts the plain text newsletter into responsive, clean HTML email format using GPT-4.
- **1.5 Email Delivery:** Sends the final HTML newsletter email to a specified recipient using Gmail OAuth2 credentials.

---

### 2. Block-by-Block Analysis

#### 2.1 LinkedIn Posts Ingestion

**Overview:**  
This block triggers weekly, runs an Apify actor to scrape LinkedIn posts of a specified username, and gathers the dataset of posts for processing.

**Nodes Involved:**  
- Weekly Schedule  
- Run an Actor and Get All LinkedIn Posts  
- Sticky Note2 (documentation)

**Node Details:**

- **Weekly Schedule**  
  - *Type:* Schedule Trigger  
  - *Role:* Initiates workflow every week.  
  - *Configuration:* Interval set to every 1 week (default weekly trigger).  
  - *Input/Output:* No input; outputs trigger to the next node.  
  - *Edge Cases:* Missed triggers if n8n instance is down; no posts returned if Apify actor fails.  

- **Run an Actor and Get All LinkedIn Posts**  
  - *Type:* Apify node (actor runner)  
  - *Role:* Runs a specific Apify actor that fetches LinkedIn posts for a user.  
  - *Configuration:*  
    - Actor ID: Placeholder `"YOUR_APIFY_ACTOR_ID"` (must be replaced with actual actor ID).  
    - Custom Body JSON includes usernames array (with `"your-linkedin-username"` placeholder), maxItems and maxResults both set to 1, limiting to the most recent post.  
    - Authentication via Apify OAuth2 credentials.  
  - *Input:* Trigger from schedule node.  
  - *Output:* Dataset containing LinkedIn posts.  
  - *Edge Cases:* Authentication failure, actor timeout, no posts found, invalid username.  

- **Sticky Note2**  
  - *Role:* Documentation note titled "LinkedIn Posts Ingestion" with link to n8n sticky notes guide.  
  - *No functional impact.*

---

#### 2.2 LinkedIn Post Filtering and Preparation

**Overview:**  
From the dataset of posts, this block limits to the first post and maps its text content to a workflow variable for transformation.

**Nodes Involved:**  
- Pulls the First Post (Limit node)  
- Variable Mapping (Set node)  
- Sticky Note (documentation)

**Node Details:**

- **Pulls the First Post**  
  - *Type:* Limit node  
  - *Role:* Restricts dataset to one item, ensuring only the latest post is processed.  
  - *Configuration:* Default limit of 1 (explicitly set).  
  - *Input:* Dataset from Apify actor.  
  - *Output:* The first post object only.  
  - *Edge Cases:* Empty dataset output if no posts returned by actor.  

- **Variable Mapping**  
  - *Type:* Set node  
  - *Role:* Extracts the `text` field from the LinkedIn post JSON and assigns it to a new variable `linkedin_post`.  
  - *Configuration:*  
    - Assignments: `linkedin_post = {{$json.text}}`  
  - *Input:* Single post JSON from Limit node.  
  - *Output:* JSON with `linkedin_post` string used downstream.  
  - *Edge Cases:* Missing `text` field leads to empty variable; expression errors if JSON structure changes.  

- **Sticky Note**  
  - *Role:* Documentation note titled "LinkedIn Posts Filtering" with link to n8n sticky notes guide.

---

#### 2.3 Post Conversion to Email Newsletter

**Overview:**  
Transforms the raw LinkedIn post text into a well-structured, engaging email newsletter using OpenAI GPT-4 with specific instructions on tone, format, and content.

**Nodes Involved:**  
- Convert LinkedIn Post to Email Newsletter (OpenAI LangChain node)  
- Sticky Note1 (documentation)

**Node Details:**

- **Convert LinkedIn Post to Email Newsletter**  
  - *Type:* OpenAI LangChain node (chat model)  
  - *Role:* Converts LinkedIn post text into an email newsletter format.  
  - *Configuration:*  
    - Model: GPT-4 variant `chatgpt-4o-latest`.  
    - Messages:  
      - System prompt defines expert email newsletter writer role and detailed requirements: maintain message, adapt tone, add greeting, closing, subject line, bullet points, no call-to-action, and signature.  
      - User prompt injects the `linkedin_post` variable content dynamically.  
  - *Input:* JSON with `linkedin_post` string.  
  - *Output:* Structured text with three parts: Subject Line, Preview Text, Email Body (with greeting, paragraphs, bullet points, closing).  
  - *Edge Cases:* API rate limit or auth failures, incomplete or ambiguous LinkedIn posts, unexpected output format from GPT requiring validation.  

- **Sticky Note1**  
  - *Role:* Documentation note titled "Post Conversion to Newsletter Article" with guide link.

---

#### 2.4 Email HTML Conversion

**Overview:**  
Takes the plain text email newsletter and converts it into professional, responsive HTML email code optimized for major email clients.

**Nodes Involved:**  
- Convert Text to HTML Format (OpenAI LangChain node)  
- Sticky Note3 (documentation)

**Node Details:**

- **Convert Text to HTML Format**  
  - *Type:* OpenAI LangChain node (chat model)  
  - *Role:* Converts plain text newsletter content into HTML with inline CSS for email compatibility.  
  - *Configuration:*  
    - Model: GPT-4 variant `chatgpt-4o-latest`.  
    - Messages:  
      - System prompt describes email HTML best practices: inline CSS, responsive layout, web-safe fonts, spacing, no call-to-action, professional color scheme.  
      - User prompt injects the previous node's generated newsletter content (`message.content`).  
  - *Input:* Text newsletter content from prior node.  
  - *Output:* Complete HTML email code including `<html>`, `<head>`, `<body>` tags, ready to send.  
  - *Edge Cases:* Formatting errors if input text is malformed; API errors; HTML output validation needed for email clients.  

- **Sticky Note3**  
  - *Role:* Documentation note titled "Email Delivery" with guide link.

---

#### 2.5 Email Delivery

**Overview:**  
Sends the generated HTML newsletter email to a predefined recipient using Gmail with OAuth2 authentication.

**Nodes Involved:**  
- Send a message (Gmail node)  
- Sticky Note3 (documentation shared with previous block)

**Node Details:**

- **Send a message**  
  - *Type:* Gmail node  
  - *Role:* Sends email with subject and HTML content.  
  - *Configuration:*  
    - Recipient email: `"recipient@example.com"` (placeholder to be replaced).  
    - Subject: Fixed `"Latest Newsletter Article"` (does not dynamically use AI-generated subject line, potential enhancement).  
    - Message body: Uses the HTML content from the previous node (`message.content`).  
    - Credentials: Gmail OAuth2 (requires setup with valid Gmail account).  
  - *Input:* HTML email content from HTML conversion node.  
  - *Output:* Email sent event.  
  - *Edge Cases:* Authentication errors, quota exceeded, invalid recipient email, network issues.  

- **Sticky Note3**  
  - *Role:* Documentation note on email delivery block.

---

### 3. Summary Table

| Node Name                           | Node Type                    | Functional Role                                  | Input Node(s)                   | Output Node(s)                        | Sticky Note                                                                                  |
|-----------------------------------|------------------------------|-------------------------------------------------|--------------------------------|-------------------------------------|----------------------------------------------------------------------------------------------|
| Weekly Schedule                   | Schedule Trigger             | Triggers workflow weekly                        | None                           | Run an Actor and Get All LinkedIn Posts | ## LinkedIn Posts Ingestion [Guide](https://docs.n8n.io/workflows/sticky-notes/)              |
| Run an Actor and Get All LinkedIn Posts | Apify node                    | Runs Apify actor to fetch LinkedIn posts       | Weekly Schedule                | Pulls the First Post                  | ## LinkedIn Posts Ingestion [Guide](https://docs.n8n.io/workflows/sticky-notes/)              |
| Pulls the First Post              | Limit                       | Limits dataset to the first LinkedIn post      | Run an Actor and Get All LinkedIn Posts | Variable Mapping                     | ## LinkedIn Posts Filtering [Guide](https://docs.n8n.io/workflows/sticky-notes/)               |
| Variable Mapping                 | Set                         | Maps LinkedIn post text to variable `linkedin_post` | Pulls the First Post           | Convert LinkedIn Post to Email Newsletter | ## LinkedIn Posts Filtering [Guide](https://docs.n8n.io/workflows/sticky-notes/)               |
| Convert LinkedIn Post to Email Newsletter | OpenAI LangChain (Chat)       | Converts post text to email newsletter format  | Variable Mapping               | Convert Text to HTML Format           | ## Post Conversion to Newsletter Article [Guide](https://docs.n8n.io/workflows/sticky-notes/) |
| Convert Text to HTML Format       | OpenAI LangChain (Chat)       | Converts newsletter text to responsive HTML    | Convert LinkedIn Post to Email Newsletter | Send a message                      | ## Email Delivery [Guide](https://docs.n8n.io/workflows/sticky-notes/)                         |
| Send a message                   | Gmail                       | Sends the final HTML email to recipient        | Convert Text to HTML Format    | None                                | ## Email Delivery [Guide](https://docs.n8n.io/workflows/sticky-notes/)                         |
| Sticky Note2                    | Sticky Note                 | Documentation for LinkedIn Posts Ingestion     | None                           | None                                | ## LinkedIn Posts Ingestion [Guide](https://docs.n8n.io/workflows/sticky-notes/)              |
| Sticky Note                     | Sticky Note                 | Documentation for LinkedIn Posts Filtering     | None                           | None                                | ## LinkedIn Posts Filtering [Guide](https://docs.n8n.io/workflows/sticky-notes/)               |
| Sticky Note1                    | Sticky Note                 | Documentation for Post Conversion to Newsletter Article | None                     | None                                | ## Post Conversion to Newsletter Article [Guide](https://docs.n8n.io/workflows/sticky-notes/) |
| Sticky Note3                    | Sticky Note                 | Documentation for Email Delivery                | None                           | None                                | ## Email Delivery [Guide](https://docs.n8n.io/workflows/sticky-notes/)                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow in n8n.**

2. **Add a Schedule Trigger node:**  
   - Name: `Weekly Schedule`  
   - Type: Schedule Trigger  
   - Set interval to every 1 week (default settings).  
   - Position it at top left.

3. **Add an Apify node:**  
   - Name: `Run an Actor and Get All LinkedIn Posts`  
   - Type: Apify (actor runner)  
   - Connect `Weekly Schedule` output to this node input.  
   - Configure:  
     - Actor ID: Insert your Apify LinkedIn posts scraping actor ID.  
     - Operation: `Run actor and get dataset`.  
     - Custom Body (JSON):  
       ```json
       {
         "usernames": ["your-linkedin-username"],
         "maxItems": 1,
         "maxResults": 1
       }
       ```  
     - Authentication: Use Apify OAuth2 credentials (configure in n8n credentials).  
   - Position below the schedule trigger.

4. **Add a Limit node:**  
   - Name: `Pulls the First Post`  
   - Type: Limit  
   - Connect `Run an Actor and Get All LinkedIn Posts` output to this node.  
   - Set limit to 1 (default).  
   - Position below Apify node.

5. **Add a Set node:**  
   - Name: `Variable Mapping`  
   - Type: Set  
   - Connect `Pulls the First Post` output to this node.  
   - Add assignment:  
     - Variable name: `linkedin_post`  
     - Type: String  
     - Value: `{{$json.text}}` (extract `text` field from LinkedIn post JSON).  
   - Position right of the Limit node.

6. **Add an OpenAI LangChain node for post conversion:**  
   - Name: `Convert LinkedIn Post to Email Newsletter`  
   - Type: OpenAI LangChain (chat)  
   - Connect `Variable Mapping` output to this node.  
   - Configure:  
     - Model: Select GPT-4 variant, e.g., `chatgpt-4o-latest`.  
     - Messages:  
       - System role message specifying the expert newsletter writer role and detailed formatting instructions (see overview section for full prompt).  
       - User role message with content:  
         ```
         =Convert the following LinkedIn post into an email newsletter format:

         {{ $json.linkedin_post }}

         Please provide:
         1. **Subject Line**: An attention-grabbing subject line (50-60 characters)
         2. **Preview Text**: A short preview/preheader (40-50 characters)
         3. **Email Body**: The converted content with:
            - A friendly greeting
            - Well-structured paragraphs
            - Bullet points where appropriate
            - Do not provide a call to action
            - A professional closing
            - Always end with this signature:  
               Best regards,  
               [Your Name]  
               [Your Company]

         Format the output as structured text that's ready to send.
         ```  
     - Credentials: Use OpenAI API credentials.  
   - Position below `Variable Mapping`.

7. **Add another OpenAI LangChain node for HTML conversion:**  
   - Name: `Convert Text to HTML Format`  
   - Type: OpenAI LangChain (chat)  
   - Connect `Convert LinkedIn Post to Email Newsletter` output to this node.  
   - Configure:  
     - Model: GPT-4 variant `chatgpt-4o-latest`.  
     - Messages:  
       - System role message describing HTML email best practices (inline CSS, responsive, web-safe fonts, no call to action, professional color scheme, etc.).  
       - User role message with content:  
         ```
         =Convert the following email newsletter into HTML format:

         {{ $json.message.content }}

         Requirements:
         - Use a clean, professional design with a maximum width of 600px
         - Apply inline CSS styles to all elements
         - Use a readable font (Arial, Helvetica, or similar web-safe font)
         - Include proper spacing between sections
         - Make headings bold and slightly larger
         - Format any bullet points as proper HTML lists
         - Do not include a call-to-action link
         - Do not end the newsletter article with a call-to-action statement or question
         - Use a color scheme that's professional (you can use shades of blue/gray)
         - Add proper padding and margins for readability
         - Ensure proper white space padding on the left and right side of the text.

         Return ONLY the complete HTML code ready to be used in an email, starting with a complete HTML structure including <html>, <head>, and <body> tags.
         ```  
     - Credentials: OpenAI API credentials.  
   - Position right of the previous OpenAI node.

8. **Add a Gmail node to send the email:**  
   - Name: `Send a message`  
   - Type: Gmail  
   - Connect `Convert Text to HTML Format` output to this node.  
   - Configure:  
     - Recipient email: Replace `"recipient@example.com"` with actual recipient.  
     - Subject: Set to `"Latest Newsletter Article"` (optionally can be improved to use AI-generated subject line with extra expression).  
     - Message: Use expression to inject `{{$json.message.content}}` (the HTML email code).  
     - Credentials: Set up Gmail OAuth2 credentials with valid Gmail account and permission to send emails.  
   - Position below the HTML conversion node.

9. **(Optional) Add Sticky Notes for documentation:**  
   - Add Sticky Note nodes near relevant blocks with descriptive titles and the n8n sticky notes guide link for user guidance.

10. **Test the workflow:**  
    - Replace all placeholder credentials and parameters with real values.  
    - Execute manually or wait for scheduled trigger.  
    - Verify email delivery and formatting.

---

### 5. General Notes & Resources

| Note Content                                                                                                                    | Context or Link                                                |
|---------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------|
| This workflow relies on a custom Apify actor ID for LinkedIn posts scraping, which must be obtained and authorized beforehand. | Apify Actor setup                                             |
| OpenAI GPT-4 API is used for text transformation and HTML generation; ensure your OpenAI quota and credentials are valid.      | OpenAI API documentation                                      |
| Gmail OAuth2 credentials must be configured properly to enable email sending without authentication errors.                    | Gmail OAuth2 setup instructions                                |
| Sticky notes are used for inline documentation; users can edit these by double-clicking and refer to n8n sticky notes guide.    | https://docs.n8n.io/workflows/sticky-notes/                    |
| The email subject sent is fixed but can be improved to dynamically use the AI-generated subject line for better engagement.     | Potential enhancement for personalization                      |
| The HTML email generator enforces no call-to-action links in the content by design to keep the newsletter informational only.  | Email formatting guideline                                     |

---

**Disclaimer:**  
The provided text originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and publicly accessible.