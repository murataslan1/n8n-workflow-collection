Automate PostgreSQL & MySQL Database Management on Linux Servers

https://n8nworkflows.xyz/workflows/automate-postgresql---mysql-database-management-on-linux-servers-6134


# Automate PostgreSQL & MySQL Database Management on Linux Servers

### 1. Workflow Overview

This workflow automates the installation, creation, and deletion of PostgreSQL and MySQL databases on Linux servers via SSH. It is designed for administrators or DevOps engineers who want to quickly manage database instances remotely with minimal manual intervention. The workflow accepts parameters defining the target server, database type, action type (install, create, delete), database name, and credentials, then executes the corresponding commands over SSH.

**Logical Blocks:**

- **1.1 Input Reception and Parameter Setup:** Receives manual trigger and sets all necessary parameters such as server details, database type, action, database name, and user credentials.
- **1.2 Database Type Decision:** Determines whether to operate on PostgreSQL or MySQL based on input.
- **1.3 Action Determination per Database:** For each database type, branches into handling the specified action: install, create database, or delete database.
- **1.4 Execution of SSH Commands:** Runs appropriate bash scripts remotely via SSH to install, create, or delete databases and users.
- **1.5 Output Formatting:** Collects command output and formats a summary response.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception and Parameter Setup

- **Overview:**  
  This block receives a manual trigger and initializes all required parameters for the workflow, supplying defaults if none are provided.

- **Nodes Involved:**  
  - Start (Manual Trigger)  
  - Set Parameters

- **Node Details:**  

  - **Start**  
    - Type: Manual Trigger  
    - Role: Initiates the workflow manually.  
    - Configuration: No parameters needed.  
    - Connections: Outputs to "Set Parameters".  
    - Edge Cases: None; user must trigger manually.

  - **Set Parameters**  
    - Type: Set  
    - Role: Defines all key input parameters with fallback default values.  
    - Configuration:  
      - `server_host`: Defaults to `192.168.1.100`  
      - `server_user`: Defaults to `root`  
      - `server_password`: Defaults to `your_password`  
      - `db_type`: Defaults to `postgresql`  
      - `action`: Defaults to `install`  
      - `database_name`: Defaults to `mydb`  
      - `db_user`: Defaults to `dbuser`  
      - `db_password`: Defaults to `dbpass123`  
    - Expressions: Uses expressions to support JSON input override or defaults.  
    - Connections: Outputs to "Database Type Check".  
    - Edge Cases: Missing parameters rely on defaults; improper values may cause later execution failure.

---

#### 1.2 Database Type Decision

- **Overview:**  
  Determines which database type branch to follow (PostgreSQL or MySQL).

- **Nodes Involved:**  
  - Database Type Check (If)

- **Node Details:**

  - **Database Type Check**  
    - Type: If  
    - Role: Checks if `db_type` equals "postgresql".  
    - Configuration:  
      - Condition: `$json.db_type == "postgresql"`  
    - Connections:   
      - True branch to "PostgreSQL Action Check"  
      - False branch to "MySQL Action Check"  
    - Edge Cases: If `db_type` is neither, workflow does not proceed; no explicit error handling.

---

#### 1.3 Action Determination per Database

- **Overview:**  
  For each database type, this block branches by action type: install, create database, or delete database.

- **Nodes Involved:**  
  - PostgreSQL Action Check (If)  
  - PostgreSQL Create Check (If)  
  - MySQL Action Check (If)  
  - MySQL Create Check (If)

- **Node Details:**

  - **PostgreSQL Action Check**  
    - Type: If  
    - Role: Checks if action is "install" for PostgreSQL.  
    - Connections:  
      - True to "Install PostgreSQL"  
      - False to "PostgreSQL Create Check"  

  - **PostgreSQL Create Check**  
    - Type: If  
    - Role: Checks if action is "create" for PostgreSQL.  
    - Connections:  
      - True to "Create PostgreSQL DB"  
      - False to "Delete PostgreSQL DB"  

  - **MySQL Action Check**  
    - Type: If  
    - Role: Checks if action is "install" for MySQL.  
    - Connections:  
      - True to "Install MySQL"  
      - False to "MySQL Create Check"  

  - **MySQL Create Check**  
    - Type: If  
    - Role: Checks if action is "create" for MySQL.  
    - Connections:  
      - True to "Create MySQL DB"  
      - False to "Delete MySQL DB"  

- **Edge Cases:**  
  - Unsupported actions (other than install, create, delete) will default to deletion path, which may be unintended.  
  - No explicit validation or error catching for invalid actions.

---

#### 1.4 Execution of SSH Commands

- **Overview:**  
  Executes the appropriate bash script on the remote Linux server via SSH to perform installation, database creation, or deletion.

- **Nodes Involved:**  
  - Install PostgreSQL (SSH)  
  - Create PostgreSQL DB (SSH)  
  - Delete PostgreSQL DB (SSH)  
  - Install MySQL (SSH)  
  - Create MySQL DB (SSH)  
  - Delete MySQL DB (SSH)

- **Node Details:**

  - **Install PostgreSQL**  
    - Type: SSH  
    - Role: Installs PostgreSQL server, configures it for remote access, sets passwords, creates database and user.  
    - Configuration: Bash script with commands for package installation, service enablement, password and config setup, database and user creation.  
    - Authentication: Uses private key credential.  
    - Input: Parameters from previous nodes (`db_password`, `database_name`, `db_user`, `server_host`).  
    - Output: Command stdout, errors.  
    - Edge Cases: SSH connection issues, command failures, permission problems, missing sudo privileges on server.

  - **Create PostgreSQL DB**  
    - Type: SSH  
    - Role: Creates a new PostgreSQL database and user on an existing installation.  
    - Configuration: Bash script creating database and user with privileges.  
    - Authentication: Same private key credential.  
    - Edge Cases: If database or user already exists, commands may fail unless PostgreSQL handles duplicates gracefully.

  - **Delete PostgreSQL DB**  
    - Type: SSH  
    - Role: Drops PostgreSQL database and user.  
    - Configuration: Bash script dropping database and user if exists.  
    - Authentication: Same private key credential.  
    - Edge Cases: Attempting to delete non-existent database or user may cause warnings/errors.

  - **Install MySQL**  
    - Type: SSH  
    - Role: Installs MySQL server, configures for remote access, sets root password, creates database and user.  
    - Configuration: Bash script with commands for package installation, root password setup, config changes, database and user creation.  
    - Authentication: Same private key credential.  
    - Edge Cases: SSH issues, default password conflicts, package installation errors.

  - **Create MySQL DB**  
    - Type: SSH  
    - Role: Creates new MySQL database and user with privileges.  
    - Configuration: Bash commands executing SQL statements.  
    - Authentication: Same private key credential.  
    - Edge Cases: Similar to PostgreSQL create DB; existing database/user may cause errors.

  - **Delete MySQL DB**  
    - Type: SSH  
    - Role: Deletes MySQL database and user.  
    - Configuration: Bash commands to drop database and user if exist.  
    - Authentication: Same private key credential.  
    - Edge Cases: Errors if database or user do not exist.

---

#### 1.5 Output Formatting

- **Overview:**  
  Collects and structures command output and metadata for final reporting.

- **Nodes Involved:**  
  - Format Output (Set)

- **Node Details:**

  - **Format Output**  
    - Type: Set  
    - Role: Packages SSH stdout, status, action performed, database type, and database name into a structured output JSON.  
    - Configuration: Uses expressions to pull `stdout` from previous SSH node, and inputs from "Set Parameters".  
    - Connections: Final node in each branch; no outputs.  
    - Edge Cases: If prior SSH node fails or produces no output, result may be empty or misleading.

---

### 3. Summary Table

| Node Name              | Node Type         | Functional Role                                 | Input Node(s)           | Output Node(s)           | Sticky Note                                                                                   |
|------------------------|-------------------|------------------------------------------------|------------------------|-------------------------|----------------------------------------------------------------------------------------------|
| Start                  | Manual Trigger    | Initiates workflow                             |                        | Set Parameters          |                                                                                              |
| Set Parameters         | Set               | Defines parameters with defaults               | Start                  | Database Type Check      | Core Elements - Defines server, DB type, action, credentials                                 |
| Database Type Check    | If                | Routes based on db_type (PostgreSQL/MySQL)     | Set Parameters          | PostgreSQL Action Check, MySQL Action Check | Core Elements - Confirms selected DB type                                                   |
| PostgreSQL Action Check| If                | Checks action for PostgreSQL (install or else) | Database Type Check (True) | Install PostgreSQL, PostgreSQL Create Check | Core Elements - Identifies PostgreSQL action                                                |
| PostgreSQL Create Check| If                | Checks if PostgreSQL action is create           | PostgreSQL Action Check (False) | Create PostgreSQL DB, Delete PostgreSQL DB | Core Elements - Validates PostgreSQL create action                                        |
| Install PostgreSQL     | SSH               | Installs and configures PostgreSQL             | PostgreSQL Action Check (True) | Format Output          | Core Elements - Sets up PostgreSQL                                                         |
| Create PostgreSQL DB   | SSH               | Creates PostgreSQL database and user            | PostgreSQL Create Check (True) | Format Output          | Core Elements - Creates PostgreSQL DB                                                      |
| Delete PostgreSQL DB   | SSH               | Deletes PostgreSQL database and user             | PostgreSQL Create Check (False) | Format Output          | Core Elements - Deletes PostgreSQL DB                                                      |
| MySQL Action Check     | If                | Checks action for MySQL (install or else)       | Database Type Check (False) | Install MySQL, MySQL Create Check | Core Elements - Identifies MySQL action                                                    |
| MySQL Create Check     | If                | Checks if MySQL action is create                 | MySQL Action Check (False) | Create MySQL DB, Delete MySQL DB | Core Elements - Validates MySQL create action                                              |
| Install MySQL          | SSH               | Installs and configures MySQL                   | MySQL Action Check (True) | Format Output          | Core Elements - Sets up MySQL                                                              |
| Create MySQL DB        | SSH               | Creates MySQL database and user                  | MySQL Create Check (True) | Format Output          | Core Elements - Creates MySQL DB                                                          |
| Delete MySQL DB        | SSH               | Deletes MySQL database and user                   | MySQL Create Check (False) | Format Output          | Core Elements - Deletes MySQL DB                                                          |
| Format Output          | Set               | Formats the command output for final response   | Install PostgreSQL, Create PostgreSQL DB, Delete PostgreSQL DB, Install MySQL, Create MySQL DB, Delete MySQL DB |                       | Core Elements - Structures final output                                                   |
| Sticky Note            | Sticky Note       | Documentation summary                            |                        |                         | Core Elements - Lists all main nodes and their roles                                       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow and add a "Manual Trigger" node named "Start".**

2. **Add a "Set" node named "Set Parameters".**  
   - Connect "Start" → "Set Parameters"  
   - Add string parameters with expressions:  
     - `server_host`: `={{ $json.server_host || '192.168.1.100' }}`  
     - `server_user`: `={{ $json.server_user || 'root' }}`  
     - `server_password`: `={{ $json.server_password || 'your_password' }}`  
     - `db_type`: `={{ $json.db_type || 'postgresql' }}`  
     - `action`: `={{ $json.action || 'install' }}`  
     - `database_name`: `={{ $json.database_name || 'mydb' }}`  
     - `db_user`: `={{ $json.db_user || 'dbuser' }}`  
     - `db_password`: `={{ $json.db_password || 'dbpass123' }}`

3. **Add an "If" node named "Database Type Check".**  
   - Connect "Set Parameters" → "Database Type Check"  
   - Condition: `$json.db_type == "postgresql"`  
   - True branch → "PostgreSQL Action Check"  
   - False branch → "MySQL Action Check"

4. **Add an "If" node named "PostgreSQL Action Check".**  
   - Connect True from "Database Type Check" → "PostgreSQL Action Check"  
   - Condition: `$json.action == "install"`  
   - True branch → "Install PostgreSQL"  
   - False branch → "PostgreSQL Create Check"

5. **Add an "If" node named "PostgreSQL Create Check".**  
   - Connect False from "PostgreSQL Action Check" → "PostgreSQL Create Check"  
   - Condition: `$json.action == "create"`  
   - True branch → "Create PostgreSQL DB"  
   - False branch → "Delete PostgreSQL DB"

6. **Add an SSH node named "Install PostgreSQL".**  
   - Connect True from "PostgreSQL Action Check" → "Install PostgreSQL"  
   - Configure SSH credentials with private key to target server.  
   - Paste the provided bash script for PostgreSQL installation (see node details above).  
   - Set authentication to use private key credential.

7. **Add an SSH node named "Create PostgreSQL DB".**  
   - Connect True from "PostgreSQL Create Check" → "Create PostgreSQL DB"  
   - Use similar SSH credential as above.  
   - Paste PostgreSQL database creation bash script.

8. **Add an SSH node named "Delete PostgreSQL DB".**  
   - Connect False from "PostgreSQL Create Check" → "Delete PostgreSQL DB"  
   - Use SSH credential.  
   - Paste PostgreSQL deletion bash script.

9. **Add an "If" node named "MySQL Action Check".**  
   - Connect False from "Database Type Check" → "MySQL Action Check"  
   - Condition: `$json.action == "install"`  
   - True branch → "Install MySQL"  
   - False branch → "MySQL Create Check"

10. **Add an "If" node named "MySQL Create Check".**  
    - Connect False from "MySQL Action Check" → "MySQL Create Check"  
    - Condition: `$json.action == "create"`  
    - True branch → "Create MySQL DB"  
    - False branch → "Delete MySQL DB"

11. **Add an SSH node named "Install MySQL".**  
    - Connect True from "MySQL Action Check" → "Install MySQL"  
    - Use SSH credential.  
    - Paste MySQL installation bash script.

12. **Add an SSH node named "Create MySQL DB".**  
    - Connect True from "MySQL Create Check" → "Create MySQL DB"  
    - Use SSH credential.  
    - Paste MySQL database creation bash script.

13. **Add an SSH node named "Delete MySQL DB".**  
    - Connect False from "MySQL Create Check" → "Delete MySQL DB"  
    - Use SSH credential.  
    - Paste MySQL deletion bash script.

14. **Add a "Set" node named "Format Output".**  
    - Connect all SSH nodes ("Install PostgreSQL", "Create PostgreSQL DB", "Delete PostgreSQL DB", "Install MySQL", "Create MySQL DB", "Delete MySQL DB") → "Format Output"  
    - Configure to set fields:  
      - `result`: `={{ $json.stdout }}`  
      - `status`: `"success"`  
      - `action_performed`: `={{ $('Set Parameters').item.json.action }}`  
      - `database_type`: `={{ $('Set Parameters').item.json.db_type }}`  
      - `database_name`: `={{ $('Set Parameters').item.json.database_name }}`

15. **(Optional) Add a Sticky Note node to summarize core elements and document the workflow steps.**

---

### 5. General Notes & Resources

| Note Content                                                                                                     | Context or Link                                               |
|-----------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------|
| This workflow uses SSH private key authentication; ensure private key credentials are properly configured in n8n. | Credential Setup Instruction                                  |
| The workflow assumes Debian-based Linux servers with `apt` package manager and systemd services.                 | Supported OS Environment                                      |
| For PostgreSQL, remote connections are enabled by modifying `postgresql.conf` and `pg_hba.conf`.                  | PostgreSQL Remote Access Setup                                |
| MySQL root password is set non-interactively using `debconf-set-selections`.                                    | MySQL Root Password Automation                                |
| No explicit error handling nodes are included; consider adding error catchers for SSH failures or invalid input. | Enhancement Suggestion                                        |
| The workflow uses default parameter fallbacks; override inputs via JSON input to customize execution.            | Input Parameter Flexibility                                   |
| The workflow can be integrated into larger automation pipelines for cloud server provisioning or DB lifecycle.   | Possible Extension Use Cases                                  |

---

**Disclaimer:**  
The provided information is extracted exclusively from an n8n workflow automation. All commands and data comply with legal and ethical policies. The workflow is intended for legitimate database management tasks on authorized servers only.