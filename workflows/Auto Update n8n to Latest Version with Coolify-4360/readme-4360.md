Auto Update n8n to Latest Version with Coolify

https://n8nworkflows.xyz/workflows/auto-update-n8n-to-latest-version-with-coolify-4360


# Auto Update n8n to Latest Version with Coolify

### 1. Workflow Overview

This workflow automates updating an n8n instance to its latest or beta version using Coolify as the deployment platform. It fetches the latest n8n release information from GitHub, filters releases based on pre-release status, removes duplicates to avoid repeated updates, updates the environment variable specifying the n8n version in Coolify, and finally triggers a redeployment to apply the new version.

Logical blocks:

- **1.1 Scheduled Triggers:** Initiate the update process on defined intervals (for stable or beta releases).
- **1.2 Fetch Releases:** Retrieve release data from GitHub for n8n.
- **1.3 Filter and Limit Releases:** Filter releases based on stability and limit the number processed.
- **1.4 Remove Duplicates:** Prevent repeated updates by skipping already processed releases.
- **1.5 Update Environment Variable:** Set the new n8n version in Coolify environment.
- **1.6 Deploy Update:** Trigger Coolify deployment to apply the new version.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Triggers

- **Overview:**  
Triggers the workflow execution on a schedule to check for new n8n versions, separated into stable and beta release paths.

- **Nodes Involved:**  
  - Auto Update Latest Release  
  - Auto Update Beta Release

- **Node Details:**

  - **Auto Update Latest Release**  
    - Type: Schedule Trigger  
    - Role: Initiates the stable release update workflow on an hourly basis.  
    - Configuration: Runs every hour (disabled by default).  
    - Input: Manual or schedule-based trigger.  
    - Output: Passes control to "Get Release" node.  
    - Edge Cases: Disabled by default, so the update won't trigger unless enabled.

  - **Auto Update Beta Release**  
    - Type: Schedule Trigger  
    - Role: Initiates the beta/pre-release update workflow as frequently as possible (interval unspecified, defaults to immediate repeated triggers).  
    - Configuration: Interval with empty object (likely triggers immediately and repeats).  
    - Input: Manual or schedule-based trigger.  
    - Output: Passes control to "Get Releases" node.  
    - Edge Cases: High-frequency triggering might cause API rate limits.

#### 1.2 Fetch Releases

- **Overview:**  
Retrieves release metadata from GitHub for the n8n repository, either the latest release or the list of recent releases.

- **Nodes Involved:**  
  - Get Release  
  - Get Releases

- **Node Details:**

  - **Get Release**  
    - Type: HTTP Request  
    - Role: Fetches the latest stable n8n release from GitHub API.  
    - Configuration:  
      - URL: `https://api.github.com/repos/n8n-io/n8n/releases/latest`  
      - Query parameter `per_page=10` (though this parameter is redundant for /latest endpoint).  
    - Input: Triggered by "Auto Update Latest Release".  
    - Output: Passes result to "Remove Duplicates".  
    - Edge Cases: GitHub API rate limits, network errors, and unexpected API responses.

  - **Get Releases**  
    - Type: HTTP Request  
    - Role: Fetches the latest 10 releases (including pre-releases) from GitHub API.  
    - Configuration:  
      - URL: `https://api.github.com/repos/n8n-io/n8n/releases`  
      - Query parameter `per_page=10`  
    - Input: Triggered by "Auto Update Beta Release".  
    - Output: Passes result to "Filter".  
    - Edge Cases: GitHub API rate limits, network errors, unexpected data structures.

#### 1.3 Filter and Limit Releases

- **Overview:**  
Filters releases to include only pre-releases (beta) and limits the number of releases processed to avoid overload.

- **Nodes Involved:**  
  - Filter  
  - Limit

- **Node Details:**

  - **Filter**  
    - Type: Filter  
    - Role: Filters incoming release array to only pre-releases (where `prerelease` is true).  
    - Configuration: Condition: `{{ $json.prerelease }} === true`  
    - Input: Data from "Get Releases".  
    - Output: Passes filtered results to "Limit".  
    - Edge Cases: If no pre-release exists, the workflow stops here.

  - **Limit**  
    - Type: Limit  
    - Role: Limits the number of releases passed downstream.  
    - Configuration: Defaults (no limit specified, so likely defaults to 1 or all).  
    - Input: Filtered pre-release data.  
    - Output: Passes limited data set to "Remove Duplicates".  
    - Edge Cases: If set limit is zero or invalid, no releases proceed.

#### 1.4 Remove Duplicates

- **Overview:**  
Ensures that each release version is processed only once by removing duplicates based on release name.

- **Nodes Involved:**  
  - Remove Duplicates

- **Node Details:**

  - **Remove Duplicates**  
    - Type: Remove Duplicates  
    - Role: Deduplicates releases using persistent memory of previously seen release names.  
    - Configuration:  
      - Operation: `removeItemsSeenInPreviousExecutions`  
      - Deduplication key: `{{ $json.name }}` (release name)  
    - Input: Releases from "Get Release" or "Limit" node.  
    - Output: Passes unique releases to "Update ENV".  
    - Edge Cases: Persistent storage failure could cause duplicate updates.

#### 1.5 Update Environment Variable

- **Overview:**  
Updates the Coolify environment variable `N8N_VERSION` to the new release version to trigger deployment with the updated n8n version.

- **Nodes Involved:**  
  - Update ENV

- **Node Details:**

  - **Update ENV**  
    - Type: HTTP Request  
    - Role: Sends a PATCH request to Coolify API to update environment variables for the app.  
    - Configuration:  
      - URL: `https://console.buatan.id/api/v1/applications/m8ccg8k44coogsk84swk8kgs/envs`  
      - Method: PATCH  
      - Body parameters include:  
        - `key`: "N8N_VERSION"  
        - `value`: Extracted from release name by splitting at '@' and taking last element (`{{ $json.name.split('@').last() }}`)  
        - Flags: `is_preview=false`, `is_build_time=true`, `is_literal=false`  
      - Authentication: HTTP Bearer and HTTP Header (credentials named "Coolify - console.buatan.id")  
    - Input: Unique release data from "Remove Duplicates".  
    - Output: Passes control to "Deploy".  
    - Edge Cases: Authentication failures, API errors, malformed release names causing incorrect version extraction.

#### 1.6 Deploy Update

- **Overview:**  
Triggers a deployment in Coolify to apply the updated environment and redeploy n8n with the new version.

- **Nodes Involved:**  
  - Deploy

- **Node Details:**

  - **Deploy**  
    - Type: HTTP Request  
    - Role: Sends a GET request to Coolify deployment API to redeploy the application.  
    - Configuration:  
      - URL: `https://console.buatan.id/api/v1/deploy?uuid=m8ccg8k44coogsk84swk8kgs&force=false`  
      - Authentication: HTTP Bearer and HTTP Header (same credentials as Update ENV)  
    - Input: Triggered by "Update ENV".  
    - Output: None (end of flow).  
    - Edge Cases: Deployment failures, auth errors, network issues.

---

### 3. Summary Table

| Node Name             | Node Type          | Functional Role                          | Input Node(s)          | Output Node(s)         | Sticky Note                                              |
|-----------------------|--------------------|----------------------------------------|-----------------------|------------------------|----------------------------------------------------------|
| Auto Update Latest Release | Schedule Trigger  | Initiates stable release update hourly | -                     | Get Release            | Disabled by default                                       |
| Auto Update Beta Release   | Schedule Trigger  | Initiates beta release update frequently| -                     | Get Releases           |                                                          |
| Get Release            | HTTP Request       | Fetches latest stable n8n release info | Auto Update Latest Release | Remove Duplicates      |                                                          |
| Get Releases           | HTTP Request       | Fetches last 10 releases (incl. beta)  | Auto Update Beta Release | Filter                 |                                                          |
| Filter                 | Filter             | Filters only pre-release versions       | Get Releases           | Limit                  |                                                          |
| Limit                  | Limit              | Limits number of releases processed     | Filter                 | Remove Duplicates       |                                                          |
| Remove Duplicates      | Remove Duplicates   | Prevents repeated processing of releases| Get Release, Limit     | Update ENV              |                                                          |
| Update ENV             | HTTP Request       | Updates Coolify env variable N8N_VERSION| Remove Duplicates      | Deploy                  | Requires Coolify credentials (HTTP Bearer and Header Auth) |
| Deploy                 | HTTP Request       | Triggers Coolify deployment              | Update ENV             | -                       | Requires Coolify credentials                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node "Auto Update Latest Release":**  
   - Type: Schedule Trigger  
   - Set Rule: Run every 1 hour  
   - Leave disabled initially if not needed immediately.

2. **Create a Schedule Trigger node "Auto Update Beta Release":**  
   - Type: Schedule Trigger  
   - Set Rule: Leave interval empty or set minimal interval to trigger frequently.

3. **Create HTTP Request node "Get Release":**  
   - URL: `https://api.github.com/repos/n8n-io/n8n/releases/latest`  
   - Method: GET  
   - Query Parameters: per_page=10 (optional)  
   - Connect "Auto Update Latest Release" → "Get Release".

4. **Create HTTP Request node "Get Releases":**  
   - URL: `https://api.github.com/repos/n8n-io/n8n/releases`  
   - Method: GET  
   - Query Parameters: per_page=10  
   - Connect "Auto Update Beta Release" → "Get Releases".

5. **Create Filter node "Filter":**  
   - Condition: Only pass if `prerelease` property is true (`{{ $json.prerelease }} === true`).  
   - Connect "Get Releases" → "Filter".

6. **Create Limit node "Limit":**  
   - Use default limit (or set specific number if required).  
   - Connect "Filter" → "Limit".

7. **Create Remove Duplicates node "Remove Duplicates":**  
   - Operation: Remove items seen in previous executions  
   - Value for dedupe: `{{ $json.name }}`  
   - Connect both "Get Release" → "Remove Duplicates" and "Limit" → "Remove Duplicates" (merge branches here).

8. **Create HTTP Request node "Update ENV":**  
   - URL: `https://console.buatan.id/api/v1/applications/m8ccg8k44coogsk84swk8kgs/envs`  
   - Method: PATCH  
   - Body (JSON):  
     ```json
     {
       "key": "N8N_VERSION",
       "value": "{{ $json.name.split('@').last() }}",
       "is_preview": false,
       "is_build_time": true,
       "is_literal": false
     }
     ```  
   - Authentication: Configure HTTP Bearer Auth and HTTP Header Auth credentials for Coolify API.  
   - Connect "Remove Duplicates" → "Update ENV".

9. **Create HTTP Request node "Deploy":**  
   - URL: `https://console.buatan.id/api/v1/deploy?uuid=m8ccg8k44coogsk84swk8kgs&force=false`  
   - Method: GET (default)  
   - Authentication: Same Coolify credentials as "Update ENV".  
   - Connect "Update ENV" → "Deploy".

10. **Verify Credentials:**  
    - Create or import credentials for Coolify API with HTTP Bearer Auth and HTTP Header Auth.  
    - Assign these credentials to "Update ENV" and "Deploy" nodes.

11. **Testing and Activation:**  
    - Enable triggers as required.  
    - Test workflow runs manually or wait for schedule triggers.

---

### 5. General Notes & Resources

| Note Content                                                                                          | Context or Link                            |
|-----------------------------------------------------------------------------------------------------|--------------------------------------------|
| The workflow uses Coolify API endpoints at console.buatan.id for environment update and deployment. | Coolify API integration                    |
| The stable update schedule is disabled by default to avoid unintended updates.                       | Scheduling configuration                   |
| GitHub API rate limits might affect frequent polling, especially for beta updates.                   | GitHub API documentation: https://docs.github.com/en/rest/reference/repos#releases |
| The extraction of the version string from the release name assumes a '@' delimiter.                  | Version parsing logic                       |

---

**Disclaimer:**  
The provided text is sourced exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with applicable content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.