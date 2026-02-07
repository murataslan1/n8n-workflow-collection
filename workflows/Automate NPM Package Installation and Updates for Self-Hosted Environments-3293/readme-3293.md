Automate NPM Package Installation and Updates for Self-Hosted Environments

https://n8nworkflows.xyz/workflows/automate-npm-package-installation-and-updates-for-self-hosted-environments-3293


# Automate NPM Package Installation and Updates for Self-Hosted Environments

### 1. Workflow Overview

This workflow automates the installation and updating of npm packages in a self-hosted n8n Docker environment. It targets users who want to seamlessly add external Node.js libraries (e.g., axios, cheerio, node-fetch) to their n8n Code nodes without manual intervention. The workflow ensures that specified npm packages are installed if missing and keeps them updated regularly.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Accepts triggers (manual, scheduled, or on n8n instance startup) to initiate the installation process.
- **1.2 Package Preparation:** Parses and prepares the list of npm packages to install.
- **1.3 Package Installation:** Executes shell commands to check for and install missing npm packages inside the Docker container.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:** This block listens for different types of triggers to start the workflow: manual trigger, scheduled daily trigger, and n8n instance startup trigger. It ensures flexibility in how and when the installation process runs.
- **Nodes Involved:** `trigger_manual`, `trigger_schedule`, `trigger_instance`
- **Node Details:**

  - **trigger_manual**
    - Type: Manual Trigger
    - Role: Allows manual initiation of the workflow from the n8n UI.
    - Configuration: Default, no parameters.
    - Inputs: None (entry point)
    - Outputs: Connects to `libraries_set`.
    - Edge Cases: None typical; user must manually trigger.
  
  - **trigger_schedule**
    - Type: Schedule Trigger
    - Role: Automatically triggers the workflow on a recurring schedule (default daily).
    - Configuration: Interval set to daily (default empty object implies daily).
    - Inputs: None (entry point)
    - Outputs: Connects to `libraries_set`.
    - Edge Cases: Scheduling misconfiguration or n8n downtime may delay execution.
  
  - **trigger_instance**
    - Type: n8n Trigger (Instance Event)
    - Role: Triggers the workflow when the n8n instance starts (event: `init`).
    - Configuration: Listens for `init` event.
    - Inputs: None (entry point)
    - Outputs: Connects to `libraries_set`.
    - Edge Cases: Only works on self-hosted instances; cloud instances do not support this event.

#### 2.2 Package Preparation

- **Overview:** This block prepares the list of npm packages by reading a comma-separated string, converting it into an array, and splitting it into individual package names for processing.
- **Nodes Involved:** `libraries_set`, `libraries_array`, `libraries_split`
- **Node Details:**

  - **libraries_set**
    - Type: Set
    - Role: Defines the initial list of npm packages as a comma-separated string.
    - Configuration: Sets a string variable `libraries` with value `"axios,cheerio,node-fetch"`.
    - Inputs: Connected from all triggers.
    - Outputs: Connects to `libraries_array`.
    - Edge Cases: User must update this list to match desired packages; empty or malformed strings may cause errors downstream.
  
  - **libraries_array**
    - Type: Set
    - Role: Converts the comma-separated string into an array.
    - Configuration: Uses expression `{{$json.libraries.split(",")}}` to split the string.
    - Inputs: From `libraries_set`.
    - Outputs: Connects to `libraries_split`.
    - Edge Cases: If `libraries` is empty or missing, results in empty array.
  
  - **libraries_split**
    - Type: Split Out
    - Role: Splits the array into individual items, outputting one item per execution.
    - Configuration: Splits field `libraries` into separate executions with field name `library`.
    - Inputs: From `libraries_array`.
    - Outputs: Connects to `library_install`.
    - Edge Cases: Empty arrays result in no executions; malformed data may cause errors.

#### 2.3 Package Installation

- **Overview:** This block executes a bash script for each npm package to check if it is already installed in the Docker container and installs it if missing.
- **Nodes Involved:** `library_install`
- **Node Details:**

  - **library_install**
    - Type: Execute Command
    - Role: Runs a bash script to conditionally install npm packages.
    - Configuration:
      - Command is a bash script that:
        - Reads the package name from the input field `library`.
        - Checks if the package directory exists under `/home/node/node_modules/`.
        - If missing, runs `npm install <package>`.
        - Verifies installation success.
        - Outputs success or failure messages.
      - `executeOnce` is set to `false` to run for each package.
    - Inputs: From `libraries_split`.
    - Outputs: Execution result logs.
    - Edge Cases:
      - Permission issues inside Docker container.
      - Network issues during `npm install`.
      - Package installation failures.
      - Nonexistent or incorrect package names.
      - Requires the workflow to run in a self-hosted Docker environment where npm is accessible.
    - Version Requirements: Requires n8n version supporting Execute Command node and Docker environment with npm installed.

---

### 3. Summary Table

| Node Name        | Node Type           | Functional Role                         | Input Node(s)                 | Output Node(s)          | Sticky Note                                                                                   |
|------------------|---------------------|---------------------------------------|------------------------------|-------------------------|-----------------------------------------------------------------------------------------------|
| trigger_manual   | Manual Trigger      | Manual start of workflow               | None                         | libraries_set            |                                                                                               |
| trigger_schedule | Schedule Trigger    | Daily automatic start                  | None                         | libraries_set            |                                                                                               |
| trigger_instance | n8n Trigger         | Start on n8n instance initialization   | None                         | libraries_set            |                                                                                               |
| libraries_set    | Set                 | Defines comma-separated npm packages  | trigger_manual, trigger_schedule, trigger_instance | libraries_array         | Edit this node to specify the npm packages you want to install (e.g., axios, cheerio, node-fetch). |
| libraries_array  | Set                 | Converts string to array               | libraries_set                | libraries_split          |                                                                                               |
| libraries_split  | Split Out            | Splits array into individual packages | libraries_array              | library_install          |                                                                                               |
| library_install  | Execute Command      | Installs missing npm packages          | libraries_split              |                         | Runs bash script to check and install packages inside Docker container. Requires self-hosted n8n. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**
   - Type: Manual Trigger
   - Name: `trigger_manual`
   - No parameters needed.

2. **Create Schedule Trigger Node**
   - Type: Schedule Trigger
   - Name: `trigger_schedule`
   - Set interval to daily (default empty interval object).

3. **Create n8n Trigger Node**
   - Type: n8n Trigger
   - Name: `trigger_instance`
   - Set event to `init` (trigger on n8n instance startup).

4. **Create Set Node for Package List**
   - Type: Set
   - Name: `libraries_set`
   - Add a string field named `libraries`.
   - Set value to a comma-separated list of npm packages you want to install, e.g., `axios,cheerio,node-fetch`.
   - Connect outputs of `trigger_manual`, `trigger_schedule`, and `trigger_instance` to this node.

5. **Create Set Node to Convert String to Array**
   - Type: Set
   - Name: `libraries_array`
   - Add an array field named `libraries`.
   - Set value using expression: `{{$json.libraries.split(",")}}`.
   - Connect output of `libraries_set` to this node.

6. **Create Split Out Node**
   - Type: Split Out
   - Name: `libraries_split`
   - Configure to split the field `libraries`.
   - Set destination field name to `library`.
   - Connect output of `libraries_array` to this node.

7. **Create Execute Command Node**
   - Type: Execute Command
   - Name: `library_install`
   - Paste the following bash script as the command:

     ```bash
     #!/bin/bash

     # Get library name from variable
     LIBRARY_NAME="{{$json.library}}"

     # Check if library directory exists
     LIBRARY_DIR="/home/node/node_modules/$LIBRARY_NAME"

     # Check if library is already installed
     if [ ! -d "$LIBRARY_DIR" ]; then
       echo "Installing $LIBRARY_NAME..."
       npm install "$LIBRARY_NAME"
       
       # Verify installation
       if [ -d "$LIBRARY_DIR" ]; then
         echo "$LIBRARY_NAME was successfully installed."
       else
         echo "Failed to install $LIBRARY_NAME. Please check for errors."
         exit 1
       fi
     else
       echo "$LIBRARY_NAME is already installed at $LIBRARY_DIR."
     fi
     ```
   - Set `executeOnce` to `false` to run for each package.
   - Connect output of `libraries_split` to this node.

8. **Configure Credentials**
   - No special credentials needed for this workflow.
   - Ensure the n8n instance runs in a self-hosted Docker container with npm installed and accessible.
   - Make sure environment variable `NODE_FUNCTION_ALLOW_EXTERNAL` is set in Docker compose:
     - Option A: `NODE_FUNCTION_ALLOW_EXTERNAL=axios,cheerio,node-fetch` (list your packages)
     - Option B: `NODE_FUNCTION_ALLOW_EXTERNAL=*` (allow all external packages)

9. **Save and Activate Workflow**
   - Save the workflow.
   - Run manually via `trigger_manual` or wait for scheduled or instance start triggers.

---

### 5. General Notes & Resources

| Note Content                                                                                                  | Context or Link                                                                                                      |
|---------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| This workflow only works on self-hosted n8n instances because it requires Docker container access and npm.    | Important usage note                                                                                                 |
| To allow external npm packages in Code nodes, set environment variable `NODE_FUNCTION_ALLOW_EXTERNAL` accordingly in your Docker compose file. | See Step 1 in the workflow description                                                                               |
| For more information on managing external packages in n8n, visit the official docs or community forums.       | https://docs.n8n.io/nodes/expressions/#using-external-npm-packages-in-code-nodes                                     |
| The workflow automates package installation and updates, saving time and reducing manual errors.               | Workflow purpose summary                                                                                            |
| Image preview included in original workflow description shows node layout and connections for visual reference.| Refer to the original workflow image (fileId:1043)                                                                  |

---

This documentation provides a complete, structured understanding of the workflow, enabling users and automation agents to reproduce, modify, and troubleshoot it effectively.