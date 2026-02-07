AI-Generated LinkedIn Posts with OpenAI, Google Sheets & Email Approval Workflow

https://n8nworkflows.xyz/workflows/ai-generated-linkedin-posts-with-openai--google-sheets---email-approval-workflow-4005


# AI-Generated LinkedIn Posts with OpenAI, Google Sheets & Email Approval Workflow

---

# AI-Generated LinkedIn Posts with OpenAI, Google Sheets & Email Approval Workflow

---

### 1. Workflow Overview

This n8n workflow automates the end-to-end process of creating, reviewing, and optionally posting LinkedIn content based on data stored in a Google Sheet. It is designed for marketing teams or content managers who want to streamline content generation and approval using AI, without manual copy-pasting or multi-tool juggling.

The workflow is logically divided into five main blocks:

- **1.1 Schedule & Sheet Data Retrieval**  
  Triggers the workflow on a schedule, reads the next pending post request row from a Google Sheet.

- **1.2 AI-Powered Post Generation & Formatting**  
  Uses OpenAI GPT to generate polished LinkedIn post content from the sheet’s Post Description and Instructions, then formats the data for presentation.

- **1.3 Gmail Approval Workflow**  
  Sends the generated post via Gmail to an approver with a custom form for approval, change requests, or cancellation.

- **1.4 Approval Handling & Regeneration**  
  Processes the approver's response: if approved, proceeds; if changes requested, regenerates content with feedback; if cancelled, updates the sheet accordingly.

- **1.5 Image Check, Posting & Sheet Update**  
  Checks for an image URL, optionally downloads it, posts the final content (with or without image) on LinkedIn, and updates the Google Sheet with the post’s status and link.

---

### 2. Block-by-Block Analysis

---

#### 1.1 Schedule & Sheet Data Retrieval

- **Overview:**  
  Automatically triggers on a defined schedule, fetches the first Google Sheet row where the Status is "Pending," providing the input data for the post generation.

- **Nodes Involved:**  
  - Schedule Trigger  
  - Get Data from Sheets

- **Node Details:**

  - **Schedule Trigger**  
    - Type: Schedule Trigger  
    - Role: Starts the workflow at regular intervals (configurable in the node).  
    - Configuration: Default interval; user can set daily, hourly, etc.  
    - Inputs: None  
    - Outputs: Triggers "Get Data from Sheets"  
    - Edge Cases: Workflow will not run if scheduling is misconfigured or disabled.

  - **Get Data from Sheets**  
    - Type: Google Sheets  
    - Role: Retrieves the first row marked "Pending" from the specified Google Sheet.  
    - Configuration:  
      - Document ID linked to target Google Sheet  
      - Sheet name set to first sheet (gid=0)  
      - Filters: Status column equals "Pending"  
      - Option `returnFirstMatch` enabled to get one row only  
    - Inputs: Trigger from Schedule Trigger  
    - Outputs: Passes row data (Post Description, Instructions, Image URL, Status, row_number) to next node  
    - Credentials: Google Sheets OAuth2 account required  
    - Edge Cases: No pending rows available; Google Sheets API auth or quota errors; malformed sheet structure  

---

#### 1.2 AI-Powered Post Generation & Formatting

- **Overview:**  
  Generates a LinkedIn post from the fetched data using OpenAI GPT, then formats the output alongside the original inputs for clarity and downstream use.

- **Nodes Involved:**  
  - OpenAI Chat Model  
  - Generate Post Content  
  - Data Formatting 1

- **Node Details:**

  - **OpenAI Chat Model**  
    - Type: Langchain OpenAI Chat Model  
    - Role: Provides GPT model for text generation.  
    - Configuration: Uses "gpt-4o-mini" model (can be changed to any available model).  
    - Credentials: OpenAI API key via OAuth2  
    - Inputs: Receives prompt and messages from "Generate Post Content" node  
    - Outputs: Generated text to "Generate Post Content" node  
    - Edge Cases: API key issues, rate limits, model unavailability, timeout.

  - **Generate Post Content**  
    - Type: Langchain Chain LLM  
    - Role: Defines the prompt and instructions for GPT to create a LinkedIn post based on Post Description and Instructions fields from the sheet.  
    - Configuration:  
      - Prompt includes:  
        - Post Description  
        - Instructions  
        - Task details (e.g., positive tone, 1300 character limit, no explanation)  
      - Uses expressions to inject sheet data dynamically.  
    - Inputs: Data from "Get Data from Sheets"  
    - Outputs: Generated post text to "Data Formatting 1"  
    - Edge Cases: Prompt formatting errors, empty or invalid input data.

  - **Data Formatting 1**  
    - Type: Set node  
    - Role: Creates structured JSON with:  
      - Post Content (from OpenAI output)  
      - Post Description (from sheet)  
      - Instructions (from sheet)  
    - Configuration: Uses expressions to map outputs and inputs precisely.  
    - Inputs: Generated post text from "Generate Post Content"  
    - Outputs: Feeds formatted data to "Send Content Confirmation"  
    - Edge Cases: Expression resolution errors if prior nodes produce unexpected data.

---

#### 1.3 Gmail Approval Workflow

- **Overview:**  
  Sends the generated post content via email to an approver with a custom approval form (dropdown + textarea) for feedback.

- **Nodes Involved:**  
  - Send Content Confirmation

- **Node Details:**

  - **Send Content Confirmation**  
    - Type: Gmail (sendAndWait)  
    - Role: Sends email containing generated post, original description, instructions, and a form for approval response.  
    - Configuration:  
      - Recipient email set (e.g., marketing team member)  
      - Subject: "Approval for LinkedIn Post"  
      - Message body includes:  
        - Generated post  
        - Post Description  
        - Instructions  
      - Form fields:  
        - Dropdown "Confirm Content?" (Yes, No, Cancel) - required  
        - Textarea "Any Changes?" (optional)  
      - Waits for response asynchronously  
    - Credentials: Gmail OAuth2 account  
    - Inputs: Formatted data from "Data Formatting 1"  
    - Outputs: Approval response to "Content Confirmation Logic"  
    - Edge Cases: Email delivery failures, response timeout, invalid response format.

---

#### 1.4 Approval Handling & Regeneration

- **Overview:**  
  Processes the approver’s reply. Posts if approved, regenerates content if changes requested, or cancels and updates the sheet otherwise.

- **Nodes Involved:**  
  - Content Confirmation Logic  
  - Regenerate Post Content

- **Node Details:**

  - **Content Confirmation Logic**  
    - Type: Switch node  
    - Role: Routes workflow based on approval dropdown selection: Yes, No, or Cancel  
    - Configuration: Checks the field "Confirm Content?" value in the email response  
    - Inputs: Response from "Send Content Confirmation"  
    - Outputs:  
      - "Yes" → image check and posting nodes  
      - "No" → "Regenerate Post Content"  
      - "Cancel" → Update Google Sheet with cancellation  
    - Edge Cases: Unexpected or missing response values.

  - **Regenerate Post Content**  
    - Type: Langchain Chain LLM  
    - Role: Uses OpenAI to apply requested changes from approver on the previously generated LinkedIn post content.  
    - Configuration:  
      - Input includes original post and change requests from "Send Content Confirmation"  
      - Instructions: update post content with requests, limit 1300 characters, no explanations  
    - Inputs: Feedback from approval email, prior post content  
    - Outputs: New post content to "Data Formatting 1" (loop back for resending)  
    - Edge Cases: Empty change request, looping without resolution, API errors.

---

#### 1.5 Image Check, Posting & Sheet Update

- **Overview:**  
  Checks if an image URL is provided. If yes, downloads the image and posts with it; if not, posts text only. Updates the Google Sheet with the post status and link.

- **Nodes Involved:**  
  - If Image Provided  
  - Get Image  
  - Post With Image  
  - Post Without Image  
  - Update Google Sheet

- **Node Details:**

  - **If Image Provided**  
    - Type: If node  
    - Role: Conditional branch checking if the Image URL field from the sheet is non-empty.  
    - Inputs: Data from "Content Confirmation Logic" (approved path)  
    - Outputs:  
      - True: to "Get Image" node  
      - False: to "Post Without Image" node  
    - Edge Cases: Invalid or unreachable image URL, empty string.

  - **Get Image**  
    - Type: HTTP Request  
    - Role: Downloads the image from provided URL to prepare for LinkedIn posting.  
    - Inputs: Image URL from sheet data  
    - Outputs: Image binary data to "Post With Image"  
    - Edge Cases: HTTP errors, URL unreachable, large file size, timeout.

  - **Post With Image**  
    - Type: LinkedIn node  
    - Role: Posts the generated LinkedIn content with the downloaded image.  
    - Configuration:  
      - Text: Post content from "Data Formatting 1"  
      - Person: LinkedIn profile identifier  
      - ShareMediaCategory: IMAGE  
    - Inputs: Image from "Get Image" and post content  
    - Credentials: LinkedIn OAuth2 account  
    - Outputs: Post response (including post URI) to "Update Google Sheet"  
    - Edge Cases: LinkedIn API errors, authentication issues.

  - **Post Without Image**  
    - Type: LinkedIn node  
    - Role: Posts the LinkedIn content without any image.  
    - Configuration: Similar to "Post With Image" but without media.  
    - Inputs: Post content from "Data Formatting 1"  
    - Credentials: LinkedIn OAuth2 account  
    - Outputs: Post response to "Update Google Sheet"  
    - Edge Cases: Same as above without media-related errors.

  - **Update Google Sheet**  
    - Type: Google Sheets  
    - Role: Updates the original row’s Status to "Completed" or "Cancelled," adds post link or output, using row_number to identify the row.  
    - Configuration:  
      - Document and sheet ID consistent with initial fetch  
      - Columns updated: Status, Output (post URI), Post Link, row_number (read-only)  
      - Matching column: row_number  
    - Inputs: Post response or cancellation info  
    - Credentials: Google Sheets OAuth2 account  
    - Edge Cases: Write permission errors, row_number mismatch, Google API issues.

---

### 3. Summary Table

| Node Name               | Node Type                     | Functional Role                                  | Input Node(s)           | Output Node(s)                | Sticky Note                                                                                     |
|-------------------------|-------------------------------|-------------------------------------------------|-------------------------|------------------------------|------------------------------------------------------------------------------------------------|
| Schedule Trigger        | Schedule Trigger               | Initiates workflow on schedule                   | None                    | Get Data from Sheets          | ## 1. Schedule & Sheet Data Retrieval ... Ensure your Google Sheets credentials are correctly configured. |
| Get Data from Sheets    | Google Sheets                 | Fetches 1st pending row from Google Sheet        | Schedule Trigger        | Generate Post Content         | See above                                                                                      |
| OpenAI Chat Model       | Langchain OpenAI Chat Model  | Provides GPT model for text generation            | Generate Post Content (prompt) | Generate Post Content / Regenerate Post Content | ## 2. AI-Powered Post Generation & Formatting ... You can modify the prompt if needed.        |
| Generate Post Content   | Langchain Chain LLM          | Generates LinkedIn post from sheet data           | Get Data from Sheets    | Data Formatting 1             | See above                                                                                      |
| Data Formatting 1       | Set                          | Formats generated and original data for email    | Generate Post Content / Regenerate Post Content | Send Content Confirmation     | See above                                                                                      |
| Send Content Confirmation | Gmail (sendAndWait)          | Sends post for approval with custom form          | Data Formatting 1       | Content Confirmation Logic    | ## 3. Gmail Approval Workflow ... Set Gmail credentials and recipient email in the node.       |
| Content Confirmation Logic | Switch                      | Routes workflow based on approval response        | Send Content Confirmation | If Image Provided / Regenerate Post Content / Update Google Sheet | ## 4. Approval Handling & Regeneration ...                                              |
| Regenerate Post Content | Langchain Chain LLM          | Regenerates post content based on requested edits | Content Confirmation Logic ("No" branch) | Data Formatting 1             | See above                                                                                      |
| If Image Provided       | If                           | Checks if Image URL is provided                    | Content Confirmation Logic ("Yes" branch) | Get Image / Post Without Image | ## 5. Image Check, Posting & Sheet Update ...                                                |
| Get Image               | HTTP Request                 | Downloads image from the URL                        | If Image Provided       | Post With Image              | See above                                                                                      |
| Post With Image         | LinkedIn                     | Posts content with image on LinkedIn               | Get Image               | Update Google Sheet           | See above                                                                                      |
| Post Without Image      | LinkedIn                     | Posts content without image on LinkedIn            | If Image Provided       | Update Google Sheet           | See above                                                                                      |
| Update Google Sheet     | Google Sheets                | Updates post status and link in Google Sheet       | Post With Image / Post Without Image / Content Confirmation Logic ("Cancel" branch) | None                         | See above                                                                                      |
| Sticky Note             | Sticky Note                  | Documentation block (Schedule & Sheet Data)        | None                    | None                         | See above                                                                                      |
| Sticky Note1            | Sticky Note                  | Documentation block (AI Post Generation)            | None                    | None                         | See above                                                                                      |
| Sticky Note2            | Sticky Note                  | Documentation block (Gmail Approval Workflow)       | None                    | None                         | See above                                                                                      |
| Sticky Note3            | Sticky Note                  | Documentation block (Approval Handling)              | None                    | None                         | See above                                                                                      |
| Sticky Note4            | Sticky Note                  | Documentation block (Image Check & Post Update)     | None                    | None                         | See above                                                                                      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow in n8n and name it appropriately** (e.g., "LinkedIn Post Generation & Approval Automation").

2. **Add a Schedule Trigger node:**  
   - Type: Schedule Trigger  
   - Set your desired interval (e.g., daily at 9 AM).

3. **Add a Google Sheets node to get data:**  
   - Operation: Read Rows  
   - Configure credentials for Google Sheets OAuth2.  
   - Document ID: Your target Google Sheet ID.  
   - Sheet name: Use first sheet or specify by gid=0.  
   - Add filter: Status column equals "Pending".  
   - Enable "Return First Match" to get only one row.  
   - Connect Schedule Trigger → Get Data from Sheets.

4. **Add Langchain OpenAI Chat Model node:**  
   - Select model "gpt-4o-mini" or your preferred GPT model.  
   - Set credentials with your OpenAI API key.

5. **Add Langchain Chain LLM node named "Generate Post Content":**  
   - Define a prompt that inputs: Post Description and Instructions from Google Sheets data.  
   - Include instructions to produce a professional LinkedIn post, max 1300 chars, no explanation.  
   - Connect "Get Data from Sheets" output to this node’s input.  
   - Configure this node to use the OpenAI Chat Model node as language model source.

6. **Add a Set node named "Data Formatting 1":**  
   - Assign three variables:  
     - "Post Content" ← output text from Generate Post Content  
     - "Post Description" ← from Google Sheets data  
     - "Instructions" ← from Google Sheets data  
   - Connect "Generate Post Content" → "Data Formatting 1".

7. **Add a Gmail node named "Send Content Confirmation":**  
   - Operation: Send Email and Wait for Reply (sendAndWait).  
   - Configure Gmail OAuth2 credentials.  
   - Set recipient email address for approval.  
   - Subject: "Approval for LinkedIn Post".  
   - Message body: Include Post Content, Post Description, Instructions.  
   - Add form fields:  
     - Dropdown "Confirm Content?" with options: Yes, No, Cancel (required)  
     - Textarea "Any Changes?" (optional)  
   - Connect "Data Formatting 1" → "Send Content Confirmation".

8. **Add a Switch node named "Content Confirmation Logic":**  
   - Condition on "Confirm Content?" field from approval email response.  
   - Outputs:  
     - Yes  
     - No  
     - Cancel  
   - Connect "Send Content Confirmation" → "Content Confirmation Logic".

9. **Add a Langchain Chain LLM node named "Regenerate Post Content":**  
   - Prompt to apply any changes from "Any Changes?" on the previously generated post.  
   - Input: Original post content and change requests.  
   - Output: Updated post content.  
   - Connect "Content Confirmation Logic" “No” output → "Regenerate Post Content".  
   - Connect "Regenerate Post Content" → "Data Formatting 1" (loop back to resend for approval).

10. **Add an If node named "If Image Provided":**  
    - Condition: Check if the Image URL from the sheet is not empty.  
    - Connect "Content Confirmation Logic" “Yes” output → "If Image Provided".

11. **Add an HTTP Request node named "Get Image":**  
    - URL: Use the Image URL from the sheet data.  
    - Method: GET.  
    - Connect "If Image Provided" True → "Get Image".

12. **Add a LinkedIn node named "Post With Image":**  
    - Text: Post Content from "Data Formatting 1".  
    - Person: Your LinkedIn profile identifier.  
    - ShareMediaCategory: IMAGE.  
    - Attach binary image data from "Get Image".  
    - Connect "Get Image" → "Post With Image".

13. **Add a LinkedIn node named "Post Without Image":**  
    - Text: Post Content from "Data Formatting 1".  
    - Person: Your LinkedIn profile identifier.  
    - Connect "If Image Provided" False → "Post Without Image".

14. **Add a Google Sheets node named "Update Google Sheet":**  
    - Operation: Update Row.  
    - Document ID and Sheet name same as initial fetch.  
    - Match row using "row_number" from initial sheet data.  
    - Update columns:  
      - Status: "Completed" (for successful posts) or "Cancelled" (if cancelled).  
      - Output: Post URI or cancellation note.  
      - Post Link: Post URI if applicable.  
    - Connect output of both "Post With Image" and "Post Without Image" → "Update Google Sheet".  
    - Also connect "Content Confirmation Logic" “Cancel” output → "Update Google Sheet" with status Cancelled.

15. **Add Sticky Notes** (optional but recommended) to document each logical block within the workflow editor for clarity.

16. **Configure all credentials:**  
    - Google Sheets OAuth2  
    - Gmail OAuth2  
    - OpenAI API key  
    - LinkedIn OAuth2

17. **Test the workflow manually:**  
    - Verify data retrieval, AI generation, email sending, approval process, posting, and sheet update.

18. **Activate the workflow** to run automatically on schedule.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                         | Context or Link                                                                                                                                                             |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| This workflow requires a Google Sheet with columns: Post Description, Instructions, Image (URL), Status, and row_number (hidden but required for updates).                                           | Setup instruction section                                                                                                                                                   |
| Use the OpenAI GPT model "gpt-4o-mini" or any other supported model in your plan. Adjust prompts as necessary for tone or style changes.                                                             | OpenAI model configuration                                                                                                                                                   |
| Gmail node uses the "sendAndWait" operation enabling interactive approval via email with custom forms. Recipient email must be set accordingly.                                                      | Gmail Approval Workflow                                                                                                                                                      |
| LinkedIn nodes require OAuth2 credentials with posting permission and a valid person identifier (LinkedIn profile URN).                                                                              | LinkedIn API integration                                                                                                                                                      |
| Image download is optional and contingent on a valid URL in the Google Sheet's Image column.                                                                                                         | Image inclusion logic                                                                                                                                                         |
| After posting or cancellation, the Google Sheet row is updated to reflect final status and includes the LinkedIn post link or cancellation note.                                                   | Post-processing and status tracking                                                                                                                                          |
| Workflow designed to loop on content regeneration until approval or cancellation occurs. Monitor for potential infinite loops if changes are repeatedly requested without approval.                   | Approval handling edge case                                                                                                                                                   |
| For more on n8n Google Sheets node configuration: https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.googleSheets/                                                                    | Official n8n Docs                                                                                                                                                             |
| For Gmail send and wait node usage and form field configuration: https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.gmail/                                                             | Official n8n Docs                                                                                                                                                             |
| For LinkedIn node configuration and OAuth2 setup: https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.linkedIn/                                                                         | Official n8n Docs                                                                                                                                                             |
| OpenAI prompt engineering can be customized in the Langchain Chain LLM nodes to adapt post style or add features like hashtags, emojis, or calls to action.                                         | Prompt customization guidance                                                                                                                                                 |

---

**Disclaimer:**  
The provided text is exclusively derived from an automated n8n workflow designed for legal and publicly available data. It complies with content policies and contains no illegal, offensive, or protected material.

---