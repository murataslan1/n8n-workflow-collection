Add a new lead to Pipedrive once GitHub repo is forked

https://n8nworkflows.xyz/workflows/add-a-new-lead-to-pipedrive-once-github-repo-is-forked-1788


# Add a new lead to Pipedrive once GitHub repo is forked

### 1. Workflow Overview

This workflow automatically adds a new lead to Pipedrive whenever someone forks a specified GitHub repository. It is designed to help sales and marketing teams track potential leads generated from GitHub activity without manual intervention.

The workflow is composed of the following logical blocks:

- **1.1 GitHub Event Trigger & Data Retrieval**: Detect when a GitHub repository is forked and retrieve detailed user information of the forkee.
- **1.2 Pipedrive Contact Search**: Search Pipedrive for an existing contact matching the forkee’s email.
- **1.3 Decision Making (Existence Check)**: Determine if the person exists in Pipedrive.
- **1.4 Contact and Lead Management**:
  - If the person exists, proceed to create a new lead linked to that person.
  - If the person does not exist, create a new Pipedrive contact (person), then create a lead linked to the newly created person.
- **1.5 Note Creation**: Add a note to the created lead including the GitHub user URL for reference.

---

### 2. Block-by-Block Analysis

#### 1.1 GitHub Event Trigger & Data Retrieval

- **Overview:**  
  This block listens for fork events on a specific GitHub repository and retrieves detailed information about the user who forked the repo.

- **Nodes Involved:**  
  - On fork (GitHub Trigger)  
  - Get Github user information (HTTP Request)

- **Node Details:**  

  - **On fork**  
    - *Type:* GitHub Trigger  
    - *Role:* Starts the workflow when the specified repository is forked.  
    - *Configuration:* Monitors the "fork" event on repository "DemoRepo" owned by "John-n8n". Uses GitHub credentials for authentication.  
    - *Input/Output:* No input; outputs fork event payload.  
    - *Potential Failures:* Webhook registration failure, GitHub API rate limits, credential expiration.  

  - **Get Github user information**  
    - *Type:* HTTP Request  
    - *Role:* Fetches detailed user information of the forkee using GitHub API URL from the event payload.  
    - *Configuration:* Request URL dynamically set to `{{$json["body"].sender.url}}` (GitHub user API endpoint). Uses GitHub credentials.  
    - *Input/Output:* Input from "On fork"; outputs user data including email.  
    - *Potential Failures:* HTTP errors, missing email field (some GitHub profiles hide email), credential issues.

#### 1.2 Pipedrive Contact Search

- **Overview:**  
  Searches Pipedrive for an existing contact based on the email retrieved from the GitHub user information.

- **Nodes Involved:**  
  - Search forkee in Pipedrive by email (Pipedrive)

- **Node Details:**  

  - **Search forkee in Pipedrive by email**  
    - *Type:* Pipedrive node (Search operation)  
    - *Role:* Searches for a person in Pipedrive whose email matches the GitHub user's email.  
    - *Configuration:* Searches by `email` field using term `{{$json["email"]}}`. Outputs either an empty result or existing person data.  
    - *Input/Output:* Input from "Get Github user information"; outputs search results.  
    - *Potential Failures:* API authentication errors, no results found (handled downstream), rate limiting.

#### 1.3 Decision Making (Existence Check)

- **Overview:**  
  Determines whether the person exists in Pipedrive by checking the presence of the `name` field in the search result.

- **Nodes Involved:**  
  - person exists (IF node)

- **Node Details:**  

  - **person exists**  
    - *Type:* IF node  
    - *Role:* Checks if the `name` field in the search result is not empty, indicating an existing contact.  
    - *Configuration:* Condition: `{{$json["name"]}}` is not empty.  
    - *Input/Output:* Input from "Search forkee in Pipedrive by email"; outputs two paths: true (person exists) and false (person does not exist).  
    - *Potential Failures:* Expression errors if expected fields are missing.

#### 1.4 Contact and Lead Management

- **Overview:**  
  Depending on the IF node decision, either update the existing person or create a new person, then create a lead associated with that person.

- **Nodes Involved:**  
  - Set person Id (Set node)  
  - Create person (Pipedrive)  
  - Create lead (Pipedrive)

- **Node Details:**  

  - **Set person Id**  
    - *Type:* Set node  
    - *Role:* Prepares the Pipedrive person ID for use in creating leads. Takes the `id` from the selected person or newly created person.  
    - *Configuration:* Sets `PipedrivePersonId` variable to `{{$json["id"]}}`.  
    - *Input/Output:* Input from "person exists" (true branch) or "Create person" (false branch); outputs to "Create lead".  
    - *Potential Failures:* Missing or invalid ID field.

  - **Create person**  
    - *Type:* Pipedrive node (Create operation)  
    - *Role:* Creates a new person in Pipedrive if no existing contact is found.  
    - *Configuration:* Name is set to `{{$node["On fork"].json["body"].forkee.owner.login}}`, email set from "Get Github user information". Uses Pipedrive credentials.  
    - *Input/Output:* Input from "person exists" (false branch); outputs newly created person data.  
    - *Potential Failures:* API errors, missing required fields, invalid email format.

  - **Create lead**  
    - *Type:* Pipedrive node (Create operation)  
    - *Role:* Creates a new lead in Pipedrive linked to the person (existing or newly created).  
    - *Configuration:*  
      - Title: `"Repo '{{ $node["On fork"].json["body"]["repository"]["full_name"] }}' forked by {{$json["name"]}}"`  
      - Resource: lead  
      - `person_id`: `{{$json["PipedrivePersonId"]}}`  
      - Associate with person: true  
      - Uses Pipedrive credentials.  
    - *Input/Output:* Input from "Set person Id"; outputs lead data.  
    - *Potential Failures:* Missing person ID, API errors.

#### 1.5 Note Creation

- **Overview:**  
  Adds a note to the newly created lead containing the GitHub user's profile URL for traceability.

- **Nodes Involved:**  
  - Create note with github url (Pipedrive)

- **Node Details:**  

  - **Create note with github url**  
    - *Type:* Pipedrive node (Create operation)  
    - *Role:* Creates a note attached to the lead with the GitHub user's URL.  
    - *Configuration:*  
      - Content: `"Github user url: {{ $node["On fork"].json["body"].sender.html_url }}"`  
      - Resource: note  
      - `lead_id`: `{{$json["id"]}}` (ID of the lead created in previous node)  
      - Uses Pipedrive credentials.  
    - *Input/Output:* Input from "Create lead"; no further nodes.  
    - *Potential Failures:* Missing lead ID, API errors.

---

### 3. Summary Table

| Node Name                      | Node Type            | Functional Role                        | Input Node(s)                  | Output Node(s)                 | Sticky Note                        |
|--------------------------------|----------------------|-------------------------------------|-------------------------------|-------------------------------|----------------------------------|
| On fork                        | GitHub Trigger       | Trigger workflow on repo fork       |                               | Get Github user information    |                                  |
| Get Github user information    | HTTP Request         | Retrieve detailed forkee info       | On fork                       | Search forkee in Pipedrive by email |                                  |
| Search forkee in Pipedrive by email | Pipedrive            | Search for existing contact by email| Get Github user information   | person exists                 |                                  |
| person exists                  | IF                   | Check if person exists in Pipedrive | Search forkee in Pipedrive by email | Set person Id (true branch), Create person (false branch) |                                  |
| Set person Id                  | Set                  | Set PipedrivePersonId for lead creation | person exists (true branch), Create person | Create lead                   |                                  |
| Create person                 | Pipedrive            | Create new Pipedrive contact        | person exists (false branch)   | Set person Id                 |                                  |
| Create lead                   | Pipedrive            | Create new lead linked to person    | Set person Id                 | Create note with github url   |                                  |
| Create note with github url   | Pipedrive            | Add note with GitHub URL to lead    | Create lead                  |                               |                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create GitHub Trigger Node:**
   - Type: GitHub Trigger  
   - Name: `On fork`  
   - Configure credentials: Select your GitHub account credentials.  
   - Set the event to listen for: `fork`.  
   - Set repository owner: `John-n8n`  
   - Set repository name: `DemoRepo`.  
   - Save.

2. **Create HTTP Request Node:**
   - Type: HTTP Request  
   - Name: `Get Github user information`  
   - Connect input from `On fork`.  
   - Set URL to: `={{$json["body"].sender.url}}` (This dynamically takes the API URL of the forkee).  
   - Authentication: Use predefined credentials of GitHub (select your GitHub account credentials).  
   - Method: GET (default).  
   - Save.

3. **Create Pipedrive Search Node:**
   - Type: Pipedrive  
   - Name: `Search forkee in Pipedrive by email`  
   - Connect input from `Get Github user information`.  
   - Operation: Search  
   - Resource: Person  
   - Term: `={{ $json["email"] }}` (search by email retrieved).  
   - Additional Fields: Set `fields` to `email` to restrict search to email field.  
   - Set Pipedrive credentials (your Pipedrive account credentials).  
   - Enable "Always Output Data" to ensure output even if no results found.  
   - Save.

4. **Create IF Node:**
   - Type: IF  
   - Name: `person exists`  
   - Connect input from `Search forkee in Pipedrive by email`.  
   - Condition: String → `{{$json["name"]}}` is not empty.  
   - Save.

5. **Create Set Node:**
   - Type: Set  
   - Name: `Set person Id`  
   - Connect input from the true output of `person exists` and also from `Create person` (to be created next).  
   - Add field:  
     - Name: `PipedrivePersonId`  
     - Value: `={{ $json["id"] }}` (Person ID from Pipedrive).  
   - Save.

6. **Create Pipedrive Create Person Node:**
   - Type: Pipedrive  
   - Name: `Create person`  
   - Connect input from the false output of `person exists`.  
   - Operation: Create  
   - Resource: Person  
   - Name: `={{ $node["On fork"].json["body"].forkee.owner.login }}` (GitHub username of forkee).  
   - Additional Fields: Add email array field with value: `={{$node["Get Github user information"].json["email"]}}`.  
   - Use Pipedrive credentials.  
   - Save.

7. **Create Pipedrive Create Lead Node:**
   - Type: Pipedrive  
   - Name: `Create lead`  
   - Connect input from `Set person Id`.  
   - Operation: Create  
   - Resource: Lead  
   - Title: `=Repo '{{$node["On fork"].json["body"]["repository"]["full_name"]}}' forked by {{$json["name"]}}`  
   - Person ID: `={{$json["PipedrivePersonId"]}}`  
   - Associate With: Person (enabled).  
   - Use Pipedrive credentials.  
   - Save.

8. **Create Pipedrive Create Note Node:**
   - Type: Pipedrive  
   - Name: `Create note with github url`  
   - Connect input from `Create lead`.  
   - Operation: Create  
   - Resource: Note  
   - Content: `=Github user url: {{ $node["On fork"].json["body"].sender.html_url }}`  
   - Additional Fields: Lead ID: `={{ $json["id"] }}` (Lead ID from previous node).  
   - Use Pipedrive credentials.  
   - Save.

9. **Link all nodes as per connections:**

   - `On fork` → `Get Github user information`  
   - `Get Github user information` → `Search forkee in Pipedrive by email`  
   - `Search forkee in Pipedrive by email` → `person exists`  
   - `person exists` (true) → `Set person Id`  
   - `person exists` (false) → `Create person` → `Set person Id`  
   - `Set person Id` → `Create lead` → `Create note with github url`

10. **Credentials Setup:**

    - GitHub credentials: OAuth2 or Personal Access Token with repo scope.  
    - Pipedrive credentials: API key from your Pipedrive account.

---

### 5. General Notes & Resources

| Note Content                                                                                     | Context or Link                                                                                  |
|-------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Pipedrive credentials setup instructions available here: https://docs.n8n.io/integrations/builtin/credentials/pipedrive/ | Credential configuration for Pipedrive node authentication.                                     |
| GitHub credentials setup instructions: https://docs.n8n.io/integrations/builtin/credentials/github/ | Credential configuration for GitHub API authentication and webhook triggering.                  |
| This workflow helps automate lead capture from GitHub forks, useful for open-source project marketing and sales tracking. | Workflow purpose and use case.                                                                  |
| Ensure GitHub webhook permissions allow "fork" event subscription for this to work correctly.    | GitHub webhook event subscription requirement.                                                 |
| Handle cases where GitHub user email is private/unavailable; workflow may fail to find or create contacts correctly. | Potential edge case for missing email in GitHub user profile.                                  |
| API rate limit considerations for GitHub and Pipedrive APIs should be monitored for high volume usage. | Integration reliability and error handling note.                                               |

---

This document fully describes the workflow’s structure, logic, and configuration to enable reproduction, modification, and troubleshooting by advanced users or automation agents.