Auto-Generate Sales Presentations from Claap Calls with GPT-4o and Google Slides

https://n8nworkflows.xyz/workflows/auto-generate-sales-presentations-from-claap-calls-with-gpt-4o-and-google-slides-8537


# Auto-Generate Sales Presentations from Claap Calls with GPT-4o and Google Slides

### 1. Workflow Overview

This workflow automates the generation of customized sales presentations in Google Slides based on recorded sales calls captured in Claap. It targets sales teams seeking to streamline post-call follow-ups by quickly creating tailored presentations reflecting the insights and action points from the calls. The workflow listens for new sales call recordings labeled as "Discovery" or "Proposal," extracts detailed call information, uses GPT-4o AI to generate slide content (ambitions and challenges), duplicates a Google Slides template, personalizes it, manages permissions, and notifies the sales team on Slack.

The workflow is logically divided into these blocks:

- **1.1 Input Reception:** Receives webhook from Claap on new sales call recordings.
- **1.2 Call Data Extraction:** Parses and extracts relevant metadata and call insights.
- **1.3 Presentation Template Selection:** Routes calls based on labels to select appropriate slide templates.
- **1.4 Content Generation via AI:** Uses GPT-4o to generate slide text content (ambitions and challenges).
- **1.5 Presentation Duplication and Personalization:** Copies a Google Slides template, replaces placeholders, inserts images, and deletes irrelevant slides.
- **1.6 Permissions and Sharing:** Sets presentation permissions and assigns editor access.
- **1.7 CRM Integration (Optional):** Retrieves deal info from HubSpot CRM to customize presentations further.
- **1.8 Notification:** Sends Slack message to alert users about the new presentation.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  Receives incoming HTTP POST requests via webhook from Claap whenever a new sales call recording is available.

- **Nodes Involved:**  
  - On new sales call recording

- **Node Details:**  
  - **On new sales call recording**  
    - Type: Webhook  
    - Role: Entry point to receive Claap webhook notifications on new sales call recordings.  
    - Configuration: HTTP POST method with path `claap-recordings`.  
    - Inputs: External webhook trigger.  
    - Outputs: Passes call recording JSON payload downstream.  
    - Failure modes: Webhook misconfiguration, network issues, missing expected payload fields.

---

#### 2.2 Call Data Extraction

- **Overview:**  
  Extracts key metadata from the Claap call recording JSON, such as client name, domain, deal ID, language, action items, key takeaways, outlines, and insights.

- **Nodes Involved:**  
  - Extract call info

- **Node Details:**  
  - **Extract call info**  
    - Type: Set node  
    - Role: Parses incoming JSON and assigns extracted values to named variables for downstream use.  
    - Key Variables:  
      - `client`: Company name from recording.  
      - `domain`: Domain extracted from participant email.  
      - `dealId`: CRM Deal ID if present.  
      - `language`: Determines language based on transcript ISO code (French or English).  
      - `actionItems`, `keyTakeways`, `outlines`, `insights`: Arrays or strings summarizing the call content.  
    - Inputs: JSON payload from webhook.  
    - Outputs: Structured JSON with extracted fields.  
    - Edge Cases: Missing or undefined fields such as `crmDealId`, no participant emails, empty transcripts.

---

#### 2.3 Presentation Template Selection

- **Overview:**  
  Routes the workflow based on the call's label ("Discovery" or "Proposal") to select the appropriate Google Slides template.

- **Nodes Involved:**  
  - Select presentation template  
  - Sticky Note2 (contextual note regarding template selection branching)

- **Node Details:**  
  - **Select presentation template**  
    - Type: Switch  
    - Role: Conditional branching based on call labels.  
    - Configuration: Checks if the recording labels array includes "Discovery" or "Proposal".  
    - Inputs: Extracted call info JSON.  
    - Outputs: "Discovery" or "Proposal" output branches.  
    - Edge Cases: Empty or missing labels, labels other than expected.  
  - **Sticky Note2**  
    - Provides guidance that multiple branches can be added here for different templates.

---

#### 2.4 Content Generation via AI

- **Overview:**  
  Sends the extracted call insights to OpenAI GPT-4o to generate a concise summary of ambitions and challenges to be used as slide content.

- **Nodes Involved:**  
  - Generate slide content

- **Node Details:**  
  - **Generate slide content**  
    - Type: OpenAI (Langchain node)  
    - Role: AI text generation for sales follow-up content.  
    - Configuration:  
      - Model: `gpt-4o-mini`  
      - Prompt instructs AI to extract two elements: Ambition and three key Challenges from call summary.  
      - Output formatted as JSON with fields `ambition` and `challenges` array.  
      - Language output matches call language (English or French).  
    - Inputs: Call insights from "Extract call info".  
    - Outputs: JSON with ambition and challenges.  
    - Edge Cases: API authentication errors, rate limits, incomplete or ambiguous AI output.

---

#### 2.5 Presentation Duplication and Personalization

- **Overview:**  
  Duplicates a Google Slides template presentation, replaces placeholders with call-specific values, adds client logo image, and deletes irrelevant slides based on deal currency.

- **Nodes Involved:**  
  - Set presentation id  
  - Duplicate presentation  
  - Publish presentation  
  - Set user as editor  
  - Update presentation  
  - Format challenges  
  - Delete wrong currency slide  
  - Select slide to delete  
  - Sticky Note3 (about alternative n8n node usage)

- **Node Details:**  
  - **Set presentation id**  
    - Type: Set  
    - Role: Hardcodes base template presentation ID for duplication.  
    - Value: Google Slides template presentation ID.  
  - **Duplicate presentation**  
    - Type: HTTP Request  
    - Role: Calls Google Drive API to copy the base template, renaming it with client name.  
    - Inputs: Template presentation ID from "Set presentation id".  
    - Outputs: New presentation ID.  
    - Credentials: Google Drive OAuth2.  
    - Edge Cases: API auth errors, rate limits, invalid template ID.  
  - **Publish presentation**  
    - Type: HTTP Request  
    - Role: Sets the duplicated presentation's permissions to be publicly readable.  
    - Inputs: New presentation ID.  
    - Outputs: Permission confirmation.  
    - Credentials: Google Drive OAuth2.  
  - **Set user as editor**  
    - Type: HTTP Request  
    - Role: Adds a specific user (email `editor@example.com`) as an editor on the duplicated presentation.  
    - Inputs: New presentation ID.  
    - Outputs: Permission confirmation.  
    - Credentials: Google Drive OAuth2.  
    - Edge Cases: Invalid email, permission errors.  
  - **Format challenges**  
    - Type: Code (JavaScript)  
    - Role: Formats the challenges array into newline-separated string for slide text replacement.  
    - Input: AI output from "Generate slide content".  
    - Output: `challengesFormatted` string.  
  - **Update presentation**  
    - Type: HTTP Request  
    - Role: Uses Google Slides API batchUpdate to replace text placeholders ($client, $date, $ambition, $challenges) and insert client logo image.  
    - Inputs:  
      - Presentation ID (duplicated).  
      - Extracted client and domain info.  
      - Generated ambition and formatted challenges.  
      - Current date formatted for French locale.  
    - Credentials: Google Slides OAuth2.  
    - Edge Cases: API limits, incorrect placeholder text, image URL failures.  
  - **Select slide to delete**  
    - Type: Set  
    - Role: Decides which slide to delete based on deal currency (EUR or other).  
    - Inputs: HubSpot deal info (currency code).  
  - **Delete wrong currency slide**  
    - Type: HTTP Request  
    - Role: Deletes the slide identified by "Select slide to delete" using Google Slides API.  
    - Credentials: Google Slides OAuth2.  
  - **Sticky Note3**  
    - Notes the option to use built-in n8n node for Google Slides updates but with less control.

---

#### 2.6 Permissions and Sharing

- **Overview:**  
  Sets public read permissions and assigns an editor to the duplicated presentation to enable sharing and collaboration.

- **Nodes Involved:**  
  - Publish presentation  
  - Set user as editor

- **Node Details:**  
  See node details in 2.5 above.

---

#### 2.7 CRM Integration (Optional)

- **Overview:**  
  Checks if the call recording is linked to a CRM deal. If yes, retrieves deal details from HubSpot to customize the presentation further (e.g., delete slides based on currency).

- **Nodes Involved:**  
  - If there is a deal  
  - Get deal info  
  - Select slide to delete  
  - Delete wrong currency slide  
  - Sticky Note4 (contextual explanation)

- **Node Details:**  
  - **If there is a deal**  
    - Type: If node  
    - Role: Checks if deal ID exists in call data.  
    - Condition: Existence of deal ID string.  
  - **Get deal info**  
    - Type: HubSpot node  
    - Role: Retrieves detailed deal information using HubSpot App Token.  
    - Input: Deal ID from webhook data.  
    - Output: Deal properties including currency code.  
  - **Select slide to delete** and **Delete wrong currency slide**  
    - See 2.5 above.  
  - **Sticky Note4**  
    - Explains this branch is for CRM-driven presentation customization.

---

#### 2.8 Notification

- **Overview:**  
  Sends a Slack message to notify the sales team that a new presentation has been generated and shared, with a clickable link to the Google Slides file.

- **Nodes Involved:**  
  - Send to @user

- **Node Details:**  
  - **Send to @user**  
    - Type: Slack  
    - Role: Sends a formatted Slack message with link to the new presentation.  
    - Configuration: User selected by username `@user`.  
    - Message includes client name and direct Google Slides URL.  
    - Credentials: Slack API OAuth token.  
    - Edge Cases: Slack API rate limits, invalid user handle.

---

### 3. Summary Table

| Node Name                   | Node Type               | Functional Role                                         | Input Node(s)                     | Output Node(s)                 | Sticky Note                                                      |
|-----------------------------|-------------------------|---------------------------------------------------------|----------------------------------|-------------------------------|-----------------------------------------------------------------|
| On new sales call recording  | Webhook                 | Entry point for Claap webhook on new call recordings    | -                                | Extract call info              |                                                                 |
| Extract call info            | Set                     | Extracts metadata and insights from call payload        | On new sales call recording       | Select presentation template   |                                                                 |
| Select presentation template | Switch                  | Routes calls based on label to choose presentation      | Extract call info                 | Set presentation id            | Sticky Note2: Multiple presentation branches possible           |
| Set presentation id          | Set                     | Sets base Google Slides template ID                      | Select presentation template      | Generate slide content         |                                                                 |
| Generate slide content       | OpenAI (Langchain)      | Generates ambitions and challenges from call insights   | Set presentation id              | Format challenges             |                                                                 |
| Format challenges           | Code                    | Formats AI challenges array into newline-separated text | Generate slide content           | Duplicate presentation         |                                                                 |
| Duplicate presentation       | HTTP Request            | Copies Google Slides template and renames it            | Format challenges                | Publish presentation           |                                                                 |
| Publish presentation         | HTTP Request            | Sets public read permission on duplicated presentation   | Duplicate presentation           | Set user as editor             |                                                                 |
| Set user as editor           | HTTP Request            | Assigns editor rights to a user on the presentation      | Publish presentation             | Update presentation            |                                                                 |
| Update presentation          | HTTP Request            | Replaces placeholders, inserts logo image in slides     | Set user as editor               | Send to @user                 | Sticky Note3: Alternative n8n node available but less control   |
| Send to @user               | Slack                   | Sends Slack notification with presentation link          | Update presentation             | -                             |                                                                 |
| If there is a deal          | If                      | Checks if call is linked to a CRM deal                   | -                              | Get deal info / (none)         | Sticky Note4: CRM integration context                            |
| Get deal info               | HubSpot                 | Retrieves CRM deal details                                | If there is a deal               | Select slide to delete         |                                                                 |
| Select slide to delete      | Set                     | Chooses slide to delete based on deal currency           | Get deal info                   | Delete wrong currency slide    |                                                                 |
| Delete wrong currency slide | HTTP Request            | Deletes slide in presentation if currency mismatch       | Select slide to delete           | -                             |                                                                 |
| Sticky Note                 | Sticky Note             | Describes overall workflow and template use              | -                              | -                             | Workflow overview and presentation template info with link      |
| Sticky Note1                | Sticky Note             | Workflow setup and configuration instructions            | -                              | -                             | Links to Claap webhook setup, OpenAI, Slack setup video         |
| Sticky Note2                | Sticky Note             | Notes on branching for multiple presentation templates   | -                              | -                             | Duplicate content for Select presentation template node         |
| Sticky Note3                | Sticky Note             | Notes alternative node for updating Google Slides        | -                              | -                             | Duplicate content for Update presentation node                  |
| Sticky Note4                | Sticky Note             | Notes CRM integration and presentation personalization    | -                              | -                             | Duplicate content for If there is a deal node                   |

---

### 4. Reproducing the Workflow from Scratch

**Step 1: Create Webhook Trigger Node**  
- Node Type: Webhook  
- Name: `On new sales call recording`  
- HTTP Method: POST  
- Path: `claap-recordings`  
- Purpose: Receive Claap webhook notifications on new call recordings.

**Step 2: Extract Call Information**  
- Node Type: Set  
- Name: `Extract call info`  
- Assign fields using expressions from webhook JSON:  
  - `client`: First company name from `body.event.recording.companies[0].name`  
  - `domain`: Extract domain from participant email (find participant other than recorder, split email by '@')  
  - `dealId`: CRM deal ID from `body.event.recording.crmInfo.crmDealId` or empty string if undefined  
  - `language`: `french` if transcript lang ISO is `fr`, else `english`  
  - `actionItems`, `keyTakeways`, `outlines`: Join respective arrays with newline  
  - `insights`: Map insights sections to formatted string `"title:\n description"` joined by double newline.

**Step 3: Presentation Template Selection**  
- Node Type: Switch  
- Name: `Select presentation template`  
- Conditions:  
  - Output "Discovery" if recording labels include "Discovery"  
  - Output "Proposal" if recording labels include "Proposal"  
- Connect from `Extract call info` node.

**Step 4: Set Base Presentation ID**  
- Node Type: Set  
- Name: `Set presentation id`  
- Hardcode: `presentationId` = `1UZ0vGvHWwl1M0u_ThxJr6qLr-flIkIvCiVrg3fHPCFk` (Google Slides template ID)  
- Connect from `Select presentation template`.

**Step 5: Generate Slide Content with OpenAI**  
- Node Type: OpenAI (Langchain)  
- Name: `Generate slide content`  
- Model: `gpt-4o-mini`  
- Message prompt (use expressions):  
  - Instruction to extract `ambition` and 3 `challenges` from call insights, output JSON, language dynamic from extracted call info.  
  - Provide call summary from `Extract call info.insights`.  
- Connect from `Set presentation id`.  
- Credential: OpenAI API key.

**Step 6: Format Challenges for Slides**  
- Node Type: Code  
- Name: `Format challenges`  
- JavaScript: Join challenges array with newline characters.  
- Connect from `Generate slide content`.

**Step 7: Duplicate Presentation Template**  
- Node Type: HTTP Request  
- Name: `Duplicate presentation`  
- Method: POST  
- URL: `https://www.googleapis.com/drive/v3/files/{{$node["Set presentation id"].json["presentationId"]}}/copy`  
- Body JSON: `{ "name": "Claap x {{ $node["Extract call info"].json.client }} - Demo" }`  
- Credentials: Google Drive OAuth2  
- Connect from `Format challenges`.

**Step 8: Publish Presentation (Make Publicly Readable)**  
- Node Type: HTTP Request  
- Name: `Publish presentation`  
- Method: POST  
- URL: `https://www.googleapis.com/drive/v3/files/{{ $json.id }}/permissions?supportsAllDrives=true`  
- Body JSON: `{ "role": "reader", "type": "anyone", "allowFileDiscovery": true }`  
- Credentials: Google Drive OAuth2  
- Connect from `Duplicate presentation`.

**Step 9: Set User as Editor**  
- Node Type: HTTP Request  
- Name: `Set user as editor`  
- Method: POST  
- URL: `https://www.googleapis.com/drive/v3/files/{{ $node["Duplicate presentation"].json.id }}/permissions?supportsAllDrives=true`  
- Body JSON: `{ "role": "writer", "type": "user", "emailAddress": "editor@example.com" }`  
- Credentials: Google Drive OAuth2  
- Connect from `Publish presentation`.

**Step 10: Update Presentation with Content and Logo**  
- Node Type: HTTP Request  
- Name: `Update presentation`  
- Method: POST  
- URL: `https://slides.googleapis.com/v1/presentations/{{ $node["Duplicate presentation"].json.id }}:batchUpdate`  
- Body JSON: Use batchUpdate requests to:  
  - Replace text placeholders `$client`, `$date` (current date in French format), `$ambition`, `$challenges` with respective values from nodes.  
  - Insert client logo image from `https://logo.clearbit.com/{{ $node["Extract call info"].json.domain }}` at specified slide location.  
- Credentials: Google Slides OAuth2  
- Connect from `Set user as editor`.

**Step 11: Slack Notification**  
- Node Type: Slack  
- Name: `Send to @user`  
- Message: Markdown block with clickable link to new presentation and client name.  
- User: `@user` (select username mode)  
- Credentials: Slack OAuth token  
- Connect from `Update presentation`.

**Optional CRM Branch:**

**Step 12: Check if Deal Exists**  
- Node Type: If  
- Name: `If there is a deal`  
- Condition: Check existence of `deal.id` from webhook JSON.  
- Connect from `On new sales call recording`.

**Step 13: Get Deal Info from HubSpot**  
- Node Type: HubSpot  
- Name: `Get deal info`  
- Operation: Get deal by ID from `crmInfo.deal.id`.  
- Credential: HubSpot App Token  
- Connect from `If there is a deal` (true branch).

**Step 14: Select Slide to Delete Based on Currency**  
- Node Type: Set  
- Name: `Select slide to delete`  
- Logic: If deal currency missing or EUR, select slide ID `g3417703b8a7_0_3` else `g3026f7d6b00_0_71`.  
- Connect from `Get deal info`.

**Step 15: Delete Slide**  
- Node Type: HTTP Request  
- Name: `Delete wrong currency slide`  
- Method: POST  
- URL: `https://slides.googleapis.com/v1/presentations/{{ $node["Duplicate presentation"].json.id }}:batchUpdate`  
- Body JSON: Delete object request for slide ID from previous node.  
- Credentials: Google Slides OAuth2  
- Connect from `Select slide to delete`.

---

### 5. General Notes & Resources

| Note Content                                                                                                  | Context or Link                                                                                                  |
|---------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| Workflow generates sales follow-up presentations in Google Slides triggered by Claap call recordings labeled "Discovery" or "Proposal". | Sticky Note overview node; Template presentation URL: https://docs.google.com/presentation/d/1UZ0vGvHWwl1M0u_ThxJr6qLr-flIkIvCiVrg3fHPCFk/edit?slide=id.g33acd02fb35_0_0 |
| Workflow setup instructions including Claap webhook creation, OpenAI API key setup, Slack credential configuration, and presentation personalization. | Sticky Note1 content with links: Claap webhook article https://help.claap.io/en/articles/10395357-using-claap-s-webhooks, Slack setup video https://www.youtube.com/watch?v=qk5JH6ImK0I&ab_channel=NateHerk%7CAIAutomation |
| Multiple presentation templates can be selected by expanding the switch node to route based on call labels.  | Sticky Note2                                                                                                    |
| Alternative to Google Slides API batchUpdate is n8n built-in Google Slides node, but with limited functionality (no full text replace or image insert). | Sticky Note3                                                                                                    |
| CRM integration enables advanced presentation customization using HubSpot deal data, such as slide deletion based on deal currency. | Sticky Note4                                                                                                    |

---

**Disclaimer:** The provided analysis and documentation are based exclusively on an n8n workflow designed for integration and automation purposes. It complies fully with content policies and contains only legal and public data.