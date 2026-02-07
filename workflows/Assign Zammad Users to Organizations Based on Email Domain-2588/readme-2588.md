Assign Zammad Users to Organizations Based on Email Domain

https://n8nworkflows.xyz/workflows/assign-zammad-users-to-organizations-based-on-email-domain-2588


# Assign Zammad Users to Organizations Based on Email Domain

### 1. Workflow Overview

This n8n workflow automates the assignment of existing users in Zammad to organizations based on their email domains, leveraging Zammad’s domain-based assignment feature. It is designed to post-process users who currently have no organization assigned, matching their email domain to organizations configured with domain-based assignment enabled and active shared domains.

The workflow logically splits into the following functional blocks:

- **1.1 Trigger and Data Retrieval:** Initiates the workflow manually and retrieves all users and all organizations from Zammad.
- **1.2 Filtering Organizations:** Filters organizations to include only those that have domain-based assignment enabled, have a non-empty domain, are shared, and active.
- **1.3 Filtering Users:** Filters users who have an email, have no current organization assignment, and are active.
- **1.4 Domain Extraction:** Extracts the email domain from each filtered user.
- **1.5 Matching and Assignment:** Matches users’ email domains with organization domains and updates the user’s organization in Zammad accordingly.

---

### 2. Block-by-Block Analysis

#### 2.1 Trigger and Data Retrieval

**Overview:**  
This block starts the workflow manually and retrieves all users and organizations from the Zammad system via API.

**Nodes Involved:**  
- When clicking ‘Test workflow’ (Manual Trigger)  
- Zammad (Get all users)  
- Zammad1 (Get all organizations)

**Node Details:**

- **When clicking ‘Test workflow’**  
  - Type: Manual Trigger  
  - Configuration: No parameters; manual start only.  
  - Input: None  
  - Output: Triggers downstream nodes  
  - Edge Cases: None  
  - Notes: Enables manual execution for testing or on-demand runs.

- **Zammad (Get all users)**  
  - Type: Zammad node — getAll operation on users  
  - Configuration: No filters; returns all users, returnAll=true  
  - Credentials: Uses Zammad Token Auth (configured externally)  
  - Input: Trigger from manual node  
  - Output: Full list of users, each user object includes id, email, organization_id, active status, etc.  
  - Edge Cases: API errors, invalid credentials, empty user list  
  - Version: Standard Zammad node version 1

- **Zammad1 (Get all organizations)**  
  - Type: Zammad node — getAll operation on organizations  
  - Configuration: No filters; returns all organizations, returnAll=true  
  - Credentials: Same as above  
  - Input: Trigger from manual node  
  - Output: List of organizations, each with id, domain, domain_assignment flag, shared, active, etc.  
  - Edge Cases: API errors, invalid credentials, empty organization list  
  - Version: Standard Zammad node version 1

---

#### 2.2 Filtering Organizations

**Overview:**  
Filters organizations to those eligible for domain-based assignment: domain_assignment enabled, domain present, shared is true, active is true, and domain is valid.

**Nodes Involved:**  
- Organization has domain and is shared (IF node)

**Node Details:**

- **Organization has domain and is shared**  
  - Type: If node  
  - Configuration: All of the following must be true (AND):  
    - domain_assignment = true  
    - domain is not empty  
    - shared = true  
    - active = true  
    - domain equals domain (additional redundant condition, likely ensures domain field presence)  
  - Input: From Zammad1 (all organizations)  
  - Output: True branch outputs filtered organizations; false branches removed  
  - Edge Cases: Organizations missing domain or domain_assignment flag, inactive organizations  
  - Notes: Ensures only organizations configured for domain-based assignment are processed.

---

#### 2.3 Filtering Users

**Overview:**  
Filters users who have an email address, have no assigned organization, and are active.

**Nodes Involved:**  
- User has email and no organization (IF node)

**Node Details:**

- **User has email and no organization**  
  - Type: If node  
  - Configuration: All of the following conditions must be met (AND):  
    - organization_id is null (user has no assigned organization)  
    - active = true  
    - email is not empty  
    - email contains '@'  
  - Input: From Zammad (all users)  
  - Output: True branch outputs filtered users; false branch filtered out  
  - Edge Cases: Users without email, inactive users, users already assigned organizations  
  - Notes: Prepares user list for domain matching.

---

#### 2.4 Domain Extraction

**Overview:**  
Extracts the domain part from the user’s email to enable matching with organization domains.

**Nodes Involved:**  
- Extract Domain from User E-Mail (Set node)

**Node Details:**

- **Extract Domain from User E-Mail**  
  - Type: Set node  
  - Configuration:  
    - Sets two fields:  
      - user_id (copied from user’s id field)  
      - domain (extracted by splitting email string on '@' and taking the second part)  
    - Keeps only these two fields for output  
  - Input: From “User has email and no organization”  
  - Output: Simplified user data with user_id and domain  
  - Edge Cases: Emails without '@' would fail or produce unexpected results (filtered out previously)  
  - Notes: Keeps output clean for efficient merging.

---

#### 2.5 Matching and Assignment

**Overview:**  
Matches users’ email domains with organization domains and updates the user’s organization field in Zammad accordingly.

**Nodes Involved:**  
- Merge (Merge node)  
- Update User (Zammad update operation)

**Node Details:**

- **Merge**  
  - Type: Merge node  
  - Configuration:  
    - Mode: Combine  
    - Fields to match: domain (string)  
    - Inputs:  
      - First input: output from “Extract Domain from User E-Mail” (users with domains)  
      - Second input: output from “Organization has domain and is shared” (eligible organizations)  
  - Output: Combined data where user domain matches organization domain  
  - Edge Cases: Domains not matching any organization will not output a combined row; no update occurs for those users.

- **Update User**  
  - Type: Zammad node — update operation on user resource  
  - Configuration:  
    - ID: set from user_id field from merged data  
    - organization: set to matched organization’s id (field `id`)  
  - Credentials: Same Zammad Token Auth  
  - Input: From Merge node’s output  
  - Output: Updated user object with new organization assignment  
  - Edge Cases: API errors, invalid user IDs, permission issues updating user  
  - Notes: Final step assigning organization to user.

---

### 3. Summary Table

| Node Name                      | Node Type            | Functional Role                            | Input Node(s)                | Output Node(s)            | Sticky Note                                                        |
|-------------------------------|----------------------|------------------------------------------|-----------------------------|---------------------------|-------------------------------------------------------------------|
| When clicking ‘Test workflow’  | Manual Trigger       | Manual start of the workflow              | None                        | Zammad, Zammad1           |                                                                   |
| Zammad                        | Zammad (getAll users) | Retrieve all users                        | When clicking ‘Test workflow’| User has email and no organization |                                                                   |
| Zammad1                       | Zammad (getAll orgs) | Retrieve all organizations                | When clicking ‘Test workflow’| Organization has domain and is shared |                                                                   |
| User has email and no organization | If node            | Filter users with email, active, no org  | Zammad                      | Extract Domain from User E-Mail |                                                                   |
| Extract Domain from User E-Mail | Set node             | Extract domain from user email            | User has email and no organization | Merge                   |                                                                   |
| Organization has domain and is shared | If node           | Filter organizations eligible for domain-based assignment | Zammad1                     | Merge                     |                                                                   |
| Merge                         | Merge node            | Match users by domain with organizations | Extract Domain from User E-Mail, Organization has domain and is shared | Update User              |                                                                   |
| Update User                   | Zammad (update user)  | Update user with matched organization    | Merge                       | None                      |                                                                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Add “Manual Trigger” node named **When clicking ‘Test workflow’**. No parameters needed.

2. **Add Zammad Node to Retrieve All Users**  
   - Add a Zammad node named **Zammad**.  
   - Set resource to `user`.  
   - Operation: `getAll`.  
   - Return All: `true`.  
   - Connect output of Manual Trigger to this node.  
   - Use Zammad Token Auth credentials configured with your instance API token.

3. **Add Zammad Node to Retrieve All Organizations**  
   - Add another Zammad node named **Zammad1**.  
   - Set resource to `organization`.  
   - Operation: `getAll`.  
   - Return All: `true`.  
   - Connect output of Manual Trigger to this node in parallel with the users node.  
   - Use same Zammad credentials.

4. **Add If Node to Filter Users**  
   - Add an “If” node named **User has email and no organization**.  
   - Connect input from the users node (**Zammad**).  
   - Configure conditions (all must be true):  
     - `organization_id == null`  
     - `active == true`  
     - `email` is not empty  
     - `email` contains '@'  
   - Output true branch to next step.

5. **Add Set Node to Extract Domain from User Email**  
   - Add a “Set” node named **Extract Domain from User E-Mail**.  
   - Connect input from true branch of user filter node.  
   - Configure to keep only two fields:  
     - `user_id` = expression: `{{$json["id"]}}`  
     - `domain` = expression: `{{$json["email"].split('@')[1]}}`

6. **Add If Node to Filter Organizations**  
   - Add an “If” node named **Organization has domain and is shared**.  
   - Connect input from organizations node (**Zammad1**).  
   - Configure conditions (all must be true):  
     - `domain_assignment == true`  
     - `domain` is not empty  
     - `shared == true`  
     - `active == true`  
     - `domain == domain` (this condition is redundant but replicate it exactly)  
   - Output true branch to next step.

7. **Add Merge Node to Match Users and Organizations**  
   - Add a “Merge” node named **Merge**.  
   - Set mode to `Combine`.  
   - Set fields to match: `domain` (string).  
   - Connect two inputs:  
     - Input 1: from **Extract Domain from User E-Mail** (users with domain)  
     - Input 2: from **Organization has domain and is shared** (eligible organizations)  

8. **Add Zammad Node to Update User Organization**  
   - Add a Zammad node named **Update User**.  
   - Set resource to `user`.  
   - Operation: `update`.  
   - Set ID to `{{$json["user_id"]}}`.  
   - Under Update Fields, set `organization` to `{{$json["id"]}}` (organization id matched from merge).  
   - Connect input from **Merge** node.  
   - Use same Zammad credentials.

9. **Activate and Test**  
   - Save workflow, activate nodes.  
   - Execute manually via the trigger node to assign users to organizations based on domains.

---

### 5. General Notes & Resources

| Note Content                                                                                     | Context or Link                                     |
|-------------------------------------------------------------------------------------------------|----------------------------------------------------|
| This workflow requires that Zammad organizations have domain-based assignment enabled and domains properly configured. | Zammad domain-based assignment feature              |
| For issues or suggestions, report on [Github](GitHub).                                         | Provided GitHub link in original description        |
| Credentials must be stored securely in n8n using the Zammad Token Auth API credential type.     | n8n credential configuration                         |
| Users without an email or already assigned organizations are excluded to prevent overwriting.   | Edge case handling                                   |

---

This concludes the detailed analysis and reconstruction guide for the “Assign Zammad Users to Organizations Based on Email Domain” workflow.