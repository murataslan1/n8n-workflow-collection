Automate Google OAuth2 Credential Creation in n8n

https://n8nworkflows.xyz/workflows/automate-google-oauth2-credential-creation-in-n8n-2909


# Automate Google OAuth2 Credential Creation in n8n

### 1. Workflow Overview

This workflow automates the creation of multiple Google OAuth2 credentials within n8n, targeting users who manage numerous Google services and accounts. It eliminates the manual, repetitive task of creating and naming OAuth2 credentials for each Google service by generating them programmatically based on a provided Google OAuth JSON and user email.

The workflow is logically divided into these blocks:

- **1.1 Manual Trigger and Input Setup:** Starts the workflow manually and collects essential inputs such as the Google OAuth JSON and the user’s Google email.
- **1.2 Services Definition and Splitting:** Defines the array of Google services for which credentials will be created and splits this array to process each service individually.
- **1.3 Credential Creation:** Uses the input data and service names to create uniquely named OAuth2 credentials for each Google service in n8n.
- **1.4 Documentation and Notes:** Provides user guidance and instructions via a sticky note node.

---

### 2. Block-by-Block Analysis

#### 2.1 Manual Trigger and Input Setup

**Overview:**  
This block initiates the workflow manually and gathers the necessary input data: the Google OAuth JSON configuration and the Google email address used to personalize credential names.

**Nodes Involved:**  
- When clicking ‘Test workflow’ (Manual Trigger)  
- Google JSON (Set)  
- Google Email (Set)

**Node Details:**

- **When clicking ‘Test workflow’**  
  - *Type:* Manual Trigger  
  - *Role:* Starts the workflow on demand.  
  - *Configuration:* No parameters; simply triggers execution.  
  - *Input/Output:* No input; outputs a single execution trigger.  
  - *Edge Cases:* None significant; user must manually trigger.  

- **Google JSON**  
  - *Type:* Set  
  - *Role:* Holds the entire Google OAuth 2.0 JSON data (client ID, client secret, URIs).  
  - *Configuration:* Raw JSON input with placeholders for client_id, client_secret, and redirect URIs.  
  - *Key Variables:* `web.client_id`, `web.client_secret`, `web.redirect_uris`  
  - *Input:* Trigger from Manual Trigger node.  
  - *Output:* JSON object containing OAuth details.  
  - *Edge Cases:* Missing or malformed JSON will cause downstream failures; user must paste valid Google OAuth JSON.  
  - *Notes:* Includes a sticky note reminder to paste the entire JSON from Google Cloud Console.

- **Google Email**  
  - *Type:* Set  
  - *Role:* Stores the user’s Google email address to customize credential names.  
  - *Configuration:* Single string field with the user’s email (e.g., "username@gmail.com").  
  - *Input:* Receives data from Google JSON node.  
  - *Output:* JSON with `Google Email` string field.  
  - *Edge Cases:* Invalid or missing email will cause naming issues; user must enter a valid email.

---

#### 2.2 Services Definition and Splitting

**Overview:**  
Defines which Google services require OAuth2 credentials and splits the list to process each service individually.

**Nodes Involved:**  
- Services (Set)  
- Split Out (Split Out)

**Node Details:**

- **Services**  
  - *Type:* Set  
  - *Role:* Defines an array of Google service identifiers for which credentials will be created.  
  - *Configuration:* An array of objects, each with a `service` property naming the OAuth2 credential type, e.g., `googleDocsOAuth2Api`, `googleSheetsOAuth2Api`, etc.  
  - *Input:* Receives data from Google Email node.  
  - *Output:* JSON with `services` array.  
  - *Edge Cases:* Modifying this array incorrectly may cause invalid credential types or failures in creation.  
  - *Customization:* Users can add or remove services here to tailor credential creation.

- **Split Out**  
  - *Type:* Split Out  
  - *Role:* Splits the `services` array into individual items to process each service separately.  
  - *Configuration:* Splits on the `services` field.  
  - *Input:* Receives the array from Services node.  
  - *Output:* Multiple executions, each with a single service object.  
  - *Edge Cases:* Empty array will result in no credentials created; ensure services array is not empty.

---

#### 2.3 Credential Creation

**Overview:**  
Creates individual OAuth2 credentials in n8n for each Google service, naming them uniquely based on the user’s email and the service type.

**Nodes Involved:**  
- n8n Create Credentials (n8n node)

**Node Details:**

- **n8n Create Credentials**  
  - *Type:* n8n (internal API node)  
  - *Role:* Programmatically creates new OAuth2 credentials in n8n for each Google service.  
  - *Configuration:*  
    - `clientId` and `clientSecret` extracted from the Google JSON node.  
    - Credential name constructed as: `<Google Email> - <service>` (e.g., "username@gmail.com - googleDocsOAuth2Api").  
    - Credential type dynamically set to the current service (e.g., `googleDocsOAuth2Api`).  
  - *Input:* Receives single service object from Split Out node.  
  - *Output:* Confirmation of credential creation.  
  - *Credentials:* Uses an existing n8n API credential to authenticate the creation request.  
  - *Edge Cases:*  
    - API credential must have sufficient permissions.  
    - If the credential type is invalid or the client ID/secret are incorrect, creation will fail.  
    - Duplicate credential names may cause conflicts or overwrite issues.  
  - *Version Requirements:* Requires n8n version supporting the n8n node with credential creation API (version 1 or higher).  
  - *Notes:* After creation, user must manually sign in to each credential to complete OAuth flow.

---

#### 2.4 Documentation and Notes

**Overview:**  
Provides user instructions and context for the workflow via a sticky note.

**Nodes Involved:**  
- Sticky Note

**Node Details:**

- **Sticky Note**  
  - *Type:* Sticky Note  
  - *Role:* Contains detailed instructions, explanations, and reminders about the workflow usage.  
  - *Content Highlights:*  
    - Explains the purpose of automating credential creation.  
    - Lists required inputs: Google JSON, Google Email, n8n API credentials.  
    - Reminds users to sign in to each created credential manually.  
  - *Position:* Placed off to the side for reference.  
  - *Edge Cases:* None; purely informational.

---

### 3. Summary Table

| Node Name                 | Node Type            | Functional Role                         | Input Node(s)               | Output Node(s)           | Sticky Note                                                                                              |
|---------------------------|----------------------|---------------------------------------|-----------------------------|--------------------------|--------------------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’ | Manual Trigger       | Starts workflow manually               | —                           | Google JSON              |                                                                                                        |
| Google JSON               | Set                  | Holds Google OAuth JSON configuration | When clicking ‘Test workflow’ | Google Email             | Include the entire Google JSON file, which can be obtained either when creating the OAuth 2.0 credentials or afterward from the Credentials page. |
| Google Email              | Set                  | Stores user’s Google email             | Google JSON                 | Services                 | Set to your email address                                                                               |
| Services                  | Set                  | Defines array of Google services       | Google Email                | Split Out                |                                                                                                        |
| Split Out                 | Split Out             | Splits services array into single items | Services                    | n8n Create Credentials   |                                                                                                        |
| n8n Create Credentials    | n8n (internal API)    | Creates OAuth2 credentials in n8n      | Split Out                   | —                        |                                                                                                        |
| Sticky Note               | Sticky Note           | Provides workflow instructions         | —                           | —                        | ## Create Google Creds I found manually creating credentials for multiple google accounts to be rather tedious, and if not named well hard to identify later. This will create credentials with the email address for all of the basic services. Set the values of: Google JSON, Google Email, n8n. Sign In You still need to sign in to each credential that was created. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Manual Trigger node**  
   - Name: `When clicking ‘Test workflow’`  
   - Purpose: To start the workflow manually.

2. **Add a Set node for Google JSON**  
   - Name: `Google JSON`  
   - Mode: Raw JSON  
   - Paste your entire Google OAuth 2.0 JSON configuration here (client_id, client_secret, redirect URIs, etc.).  
   - Connect output of Manual Trigger to this node.

3. **Add a Set node for Google Email**  
   - Name: `Google Email`  
   - Add a string field named `Google Email` with your Google account email (e.g., "username@gmail.com").  
   - Connect output of `Google JSON` node to this node.

4. **Add a Set node for Services**  
   - Name: `Services`  
   - Add an array field named `services` containing objects with a `service` property for each Google OAuth2 API you want to create credentials for. Example array:  
     ```json
     [
       {"service": "googleDocsOAuth2Api"},
       {"service": "googleSheetsOAuth2Api"},
       {"service": "googleSlidesOAuth2Api"},
       {"service": "googleDriveOAuth2Api"},
       {"service": "gmailOAuth2"},
       {"service": "googleCalendarOAuth2Api"},
       {"service": "googleContactsOAuth2Api"}
     ]
     ```  
   - Connect output of `Google Email` node to this node.

5. **Add a Split Out node**  
   - Name: `Split Out`  
   - Configure to split on the `services` field.  
   - Connect output of `Services` node to this node.

6. **Add an n8n node to create credentials**  
   - Name: `n8n Create Credentials`  
   - Set resource to `credential`.  
   - Set credential type name dynamically using expression: `{{$json.service}}` (the current service from split).  
   - Set the credential name dynamically using expression: `{{ $('Google Email').item.json['Google Email'] }} - {{ $json.service }}`  
   - Set data field with JSON object containing:  
     ```json
     {
       "clientId": "{{ $('Google JSON').item.json.web.client_id }}",
       "clientSecret": "{{ $('Google JSON').item.json.web.client_secret }}"
     }
     ```  
   - Configure credentials for this node with your n8n API credentials (OAuth2 or API key with permission to create credentials).  
   - Connect output of `Split Out` node to this node.

7. **Add a Sticky Note node (optional)**  
   - Name: `Sticky Note`  
   - Add detailed instructions about workflow usage, input requirements, and post-creation sign-in steps.  
   - Place it visually near the start of the workflow for reference.

8. **Connect nodes as follows:**  
   - Manual Trigger → Google JSON → Google Email → Services → Split Out → n8n Create Credentials

9. **Save and activate the workflow.**

10. **Run the workflow manually to generate credentials.**

11. **After execution, visit the n8n Credentials dashboard to complete OAuth sign-in for each newly created credential.**

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                   | Context or Link                                                                                  |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Manually creating multiple Google OAuth2 credentials is tedious and naming them well is critical for later identification. This workflow automates that process.                                                              | Workflow purpose summary                                                                        |
| Include the entire Google OAuth 2.0 JSON file from Google Cloud Console when setting up the `Google JSON` node.                                                                                                               | Google Cloud Console instructions                                                              |
| Set your Google email address accurately in the `Google Email` node to ensure credential names are meaningful.                                                                                                                | User input requirement                                                                          |
| After credentials are created, you must manually sign in to each credential in n8n to complete the OAuth2 authorization process.                                                                                              | Post-creation step reminder                                                                     |
| Modify the `Services` array to add or remove Google services as needed for your workspace.                                                                                                                                     | Customization tip                                                                              |
| Use the n8n API credentials with sufficient permissions to allow programmatic creation of credentials.                                                                                                                        | Credential setup requirement                                                                   |
| For more information on Google OAuth2 setup in n8n, see the official documentation: https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.google-oauth2/                                                           | Official n8n Google OAuth2 documentation                                                       |
| This workflow can save hours of manual work when managing multiple Google accounts and services, especially for teams or agencies.                                                                                            | Time-saving benefit                                                                            |

---

This documentation provides a complete, structured reference for understanding, reproducing, and customizing the "Automate Google OAuth2 Credential Creation in n8n" workflow. It anticipates common issues such as input errors, API permission problems, and manual post-creation steps, enabling both advanced users and automation agents to work effectively with this workflow.