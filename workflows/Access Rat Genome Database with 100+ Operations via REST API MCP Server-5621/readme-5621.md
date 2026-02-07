Access Rat Genome Database with 100+ Operations via REST API MCP Server

https://n8nworkflows.xyz/workflows/access-rat-genome-database-with-100--operations-via-rest-api-mcp-server-5621


# Access Rat Genome Database with 100+ Operations via REST API MCP Server

# Comprehensive Reference Document  
## Workflow: Rat Genome Database REST API MCP Server

---

### 1. Workflow Overview

This workflow serves as a comprehensive REST API MCP (Multiple Command Processor) server for the Rat Genome Database (RGD). It exposes over 100 API operations related to rat genomic data, enabling querying, creation, and enrichment of various biological data types such as genes, annotations, phenotypes, pathways, and statistics.

The workflow is logically organized into the following blocks:

- **1.1 Input Trigger:** Listens for incoming MCP REST API calls.
- **1.2 AGR Operations:** Handles calls related to Annotation Gene Reports (AGR).
- **1.3 Annotation Operations:** Supports retrieval and creation of annotations.
- **1.4 Enrichment Operations:** Processes enrichment-related requests.
- **1.5 Gene Operations:** Manages gene data requests including retrieval and creation.
- **1.6 Lookup Operations:** Manages various lookup table-related requests.
- **1.7 Map Operations:** Handles map data queries.
- **1.8 Ontology Operations:** Retrieves ontology information.
- **1.9 Pathway Operations:** Processes pathway-related queries.
- **1.10 Phenotype Operations:** Handles phenotype data retrieval.
- **1.11 QTL (Quantitative Trait Loci) Operations:** Manages QTL data queries.
- **1.12 SSLP (Simple Sequence Length Polymorphism) Operations:** Retrieves SSLP data.
- **1.13 Statistics Operations:** Retrieves statistical data related to terms and other entities.
- **1.14 Strain Operations:** Handles strain-related data retrieval.

Each of these blocks consists primarily of HTTP Request nodes configured to interface with the RGD REST API, triggered by a central MCP trigger node. The workflow includes multiple sticky notes (documentation nodes) to provide inline descriptions and setup instructions.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Trigger

- **Overview:**  
  This block initializes the workflow by listening for REST API requests routed through the MCP trigger node, which dispatches commands to appropriate HTTP Request nodes.

- **Nodes Involved:**  
  - Rat Genome Database REST MCP Server (MCP Trigger)  
  - Sticky Note (Setup Instructions)  
  - Sticky Note (Workflow Overview)  

- **Node Details:**

  - **Rat Genome Database REST MCP Server**  
    - *Type:* MCP Trigger  
    - *Role:* Entry point handling incoming REST API MCP calls.  
    - *Configuration:* Uses webhook with ID `aec0aa24-23f3-4493-a648-4c2e55658335`. No additional parameters configured.  
    - *Connections:* Outputs to all subsequent HTTP Request nodes.  
    - *Failure Modes:* Webhook availability, authentication if secured externally, or malformed MCP command format.  

  - **Sticky Notes**  
    - Contain setup instructions and workflow overview information.  
    - Serve as inline documentation for users.

---

#### 1.2 AGR Operations

- **Overview:**  
  Handles Annotation Gene Report (AGR) related API calls, which involve data retrieval from AGR endpoints.

- **Nodes Involved:**  
  - Get Agr 6  
  - Get Agr 7  
  - Get Agr 8  
  - Get Agr 9  
  - Get Agr 10  
  - Get Agr 11  
  - Description - AGR (Sticky Note)  

- **Node Details:**

  - **Get Agr 6 to Get Agr 11**  
    - *Type:* HTTP Request Tool  
    - *Role:* Query respective AGR endpoints via REST API.  
    - *Configuration:* Each node is individually configured to call a specific AGR endpoint, parameters likely set dynamically from MCP trigger.  
    - *Input:* MCP Trigger node outputs command details.  
    - *Output:* Data retrieved from RGD AGR endpoints.  
    - *Failure Modes:* HTTP errors (4xx, 5xx), network timeouts, invalid parameters.  
    - *Note:* These nodes share a common upstream MCP trigger and are independent of each other.

  - **Description - AGR**  
    - Provides context or explanatory notes about AGR operations.

---

#### 1.3 Annotation Operations

- **Overview:**  
  Handles retrieval and creation of annotation records in the RGD database.

- **Nodes Involved:**  
  - Create Annotation 1  
  - Get Annotation 9  
  - Get Annotation 10  
  - Get Annotation 11  
  - Get Annotation 12  
  - Get Annotation 13  
  - Get Annotation 14  
  - Get Annotation 15  
  - Get Annotation 16  
  - Get Annotation 17  
  - Sticky Note2  
  - Sticky Note (Description)  

- **Node Details:**

  - **Create Annotation 1**  
    - *Type:* HTTP Request Tool  
    - *Role:* Sends POST or PUT requests to create new annotations.  
    - *Configuration:* Configured with request body templates and parameters to create annotation entries.  
    - *Failure Modes:* Validation errors, authentication failures, network issues.

  - **Get Annotation 9 to Get Annotation 17**  
    - *Type:* HTTP Request Tool  
    - *Role:* Fetch different annotation data via GET methods from various endpoints.  
    - *Configuration:* Each node targets specific annotation API endpoints with parameters possibly derived from MCP commands.  
    - *Failure Modes:* Missing data, HTTP errors, timeouts.

  - **Sticky Notes**  
    - Provide guidance and descriptions for annotation operations.

---

#### 1.4 Enrichment Operations

- **Overview:**  
  Handles requests related to enrichment analysis services within the RGD.

- **Nodes Involved:**  
  - Create Enrichment 2  
  - Create Enrichment 3  
  - Description - enrichment-web-service (Sticky Note)  
  - Sticky Note3  

- **Node Details:**

  - **Create Enrichment 2 & 3**  
    - *Type:* HTTP Request Tool  
    - *Role:* Submit requests to enrichment web services for analysis creation or querying.  
    - *Configuration:* Configured with appropriate API URLs, HTTP methods, and data payloads.  
    - *Failure Modes:* Service unavailability, invalid input data.

  - **Sticky Notes**  
    - Describe enrichment web service context and instructions.

---

#### 1.5 Gene Operations

- **Overview:**  
  Manages extensive gene-related API operations including retrieval and creation of gene records.

- **Nodes Involved:**  
  - Get Gene 14 to Get Gene 27 (many nodes)  
  - Create Gene 2  
  - Create Gene 3  
  - Sticky Note5  

- **Node Details:**

  - **Get Gene 14 to Get Gene 27**  
    - *Type:* HTTP Request Tool  
    - *Role:* Fetch a wide variety of gene data from different endpoints.  
    - *Configuration:* Each node likely calls a different gene-related endpoint or query variant.  
    - *Failure Modes:* Data not found, malformed requests, rate limiting.

  - **Create Gene 2 & 3**  
    - *Type:* HTTP Request Tool  
    - *Role:* Create or update gene records in RGD.  
    - *Configuration:* POST or PUT HTTP requests with gene data payloads.  
    - *Failure Modes:* Input validation, authentication, network errors.

  - **Sticky Note5**  
    - Provides additional notes or warnings related to gene operations.

---

#### 1.6 Lookup Operations

- **Overview:**  
  Facilitates operations related to lookup tables, commonly used for metadata or reference data.

- **Nodes Involved:**  
  - Get Lookup 14 to Get Lookup 27  
  - Create Lookup 10 to Create Lookup 19  
  - Sticky Note6  

- **Node Details:**

  - **Get Lookup 14 to Get Lookup 27**  
    - *Type:* HTTP Request Tool  
    - *Role:* Retrieve lookup data entries.  
    - *Configuration:* Configured with REST GET requests to various lookup endpoints.  
    - *Failure Modes:* Missing entries, HTTP errors.

  - **Create Lookup 10 to Create Lookup 19**  
    - *Type:* HTTP Request Tool  
    - *Role:* Create or update lookup entries.  
    - *Configuration:* POST/PUT requests with data payloads.  
    - *Failure Modes:* Validation or duplicate entry errors.

  - **Sticky Note6**  
    - Contains documentation related to lookup operations.

---

#### 1.7 Map Operations

- **Overview:**  
  Manages retrieval of map-related genomic data.

- **Nodes Involved:**  
  - Get Map 3  
  - Get Map 4  
  - Get Map 5  
  - Sticky Note7  
  - Description - Map (Sticky Note)  

- **Node Details:**

  - **Get Map 3 to 5**  
    - *Type:* HTTP Request Tool  
    - *Role:* Query genomic map data endpoints.  
    - *Configuration:* Each has dedicated API endpoint configurations.  
    - *Failure Modes:* Endpoint unavailability, incorrect parameters.

  - **Sticky Notes**  
    - Provide explanations and guidance on map data usage.

---

#### 1.8 Ontology Operations

- **Overview:**  
  Retrieves ontology data relevant to rat genomics.

- **Nodes Involved:**  
  - Get Ontology 3  
  - Get Ontology 4  
  - Get Ontology 5  
  - Description - Ontology (Sticky Note)  
  - Sticky Note8  

- **Node Details:**

  - **Get Ontology 3 to 5**  
    - *Type:* HTTP Request Tool  
    - *Role:* Fetch ontology terms and related information.  
    - *Failure Modes:* Outdated terms, HTTP errors.

  - **Sticky Notes**  
    - Explain ontology data context.

---

#### 1.9 Pathway Operations

- **Overview:**  
  Handles retrieval of biological pathway data.

- **Nodes Involved:**  
  - Get Pathway 2  
  - Get Pathway 3  
  - Sticky Note9  

- **Node Details:**

  - **Get Pathway 2 & 3**  
    - *Type:* HTTP Request Tool  
    - *Role:* Query pathway endpoints for biological pathways.  
    - *Failure Modes:* Network issues, invalid queries.

  - **Sticky Note9**  
    - Documentation for pathway operations.

---

#### 1.10 Phenotype Operations

- **Overview:**  
  Retrieves quantitative phenotype data.

- **Nodes Involved:**  
  - Get Phenotype 2  
  - Get Phenotype 3  
  - Description - Quantitative Phenotype (Sticky Note)  
  - Sticky Note10  

- **Node Details:**

  - **Get Phenotype 2 & 3**  
    - *Type:* HTTP Request Tool  
    - *Role:* Fetch phenotype quantitative data.  
    - *Failure Modes:* Data unavailability.

  - **Sticky Notes**  
    - Describe phenotype data significance.

---

#### 1.11 QTL Operations

- **Overview:**  
  Manages quantitative trait loci data requests.

- **Nodes Involved:**  
  - Get Qtl 3  
  - Get Qtl 4  
  - Get Qtl 5  
  - Sticky Note11  

- **Node Details:**

  - **Get Qtl 3 to 5**  
    - *Type:* HTTP Request Tool  
    - *Role:* Retrieve QTL data via REST API.  
    - *Failure Modes:* Missing data, HTTP errors.

  - **Sticky Note11**  
    - Additional info for QTL operations.

---

#### 1.12 SSLP Operations

- **Overview:**  
  Retrieves data related to Simple Sequence Length Polymorphisms.

- **Nodes Involved:**  
  - Get Sslp 1  
  - Description - SSLP (Sticky Note)  
  - Sticky Note12  

- **Node Details:**

  - **Get Sslp 1**  
    - *Type:* HTTP Request Tool  
    - *Role:* Query SSLP data endpoint.  
    - *Failure Modes:* Network or data errors.

  - **Sticky Notes**  
    - Provide context for SSLP data.

---

#### 1.13 Statistics Operations

- **Overview:**  
  Handles retrieval of statistical information related to terms and genomic data.

- **Nodes Involved:**  
  - Get Stat 24 to Get Stat 47  
  - Get Term Stats 1  
  - Description - Statistics (Sticky Note)  
  - Sticky Note13  

- **Node Details:**

  - **Get Stat 24 to 47, Get Term Stats 1**  
    - *Type:* HTTP Request Tool  
    - *Role:* Fetch various statistical data from RGD.  
    - *Failure Modes:* Large data volume, timeout, HTTP errors.

  - **Sticky Notes**  
    - Explain statistics data and usage.

---

#### 1.14 Strain Operations

- **Overview:**  
  Retrieves rat strain information.

- **Nodes Involved:**  
  - Get Strains 1  
  - Get Strain 2  
  - Get Strain 3  
  - Sticky Note14  

- **Node Details:**

  - **Get Strains 1 to 3**  
    - *Type:* HTTP Request Tool  
    - *Role:* Query strain data endpoints.  
    - *Failure Modes:* Missing strain data, HTTP errors.

  - **Sticky Note14**  
    - Provides information regarding strain data.

---

### 3. Summary Table

| Node Name                         | Node Type                 | Functional Role                      | Input Node(s)                      | Output Node(s)                    | Sticky Note                                      |
|----------------------------------|---------------------------|------------------------------------|----------------------------------|----------------------------------|-------------------------------------------------|
| Advanced Warning                 | Sticky Note               | Warning or alert note               | None                             | None                             |                                                 |
| Setup Instructions              | Sticky Note               | Setup guidance                     | None                             | None                             |                                                 |
| Workflow Overview               | Sticky Note               | Overview of workflow               | None                             | None                             |                                                 |
| Rat Genome Database REST MCP Server | MCP Trigger               | Entry point for MCP REST API calls | None                             | All HTTP Request nodes           |                                                 |
| Sticky Note                    | Sticky Note               | General note                      | None                             | None                             |                                                 |
| Get Agr 6                      | HTTP Request Tool         | AGR data retrieval                 | MCP Trigger                     | None                             |                                                 |
| Get Agr 7                      | HTTP Request Tool         | AGR data retrieval                 | MCP Trigger                     | None                             |                                                 |
| Get Agr 8                      | HTTP Request Tool         | AGR data retrieval                 | MCP Trigger                     | None                             |                                                 |
| Get Agr 9                      | HTTP Request Tool         | AGR data retrieval                 | MCP Trigger                     | None                             |                                                 |
| Get Agr 10                     | HTTP Request Tool         | AGR data retrieval                 | MCP Trigger                     | None                             |                                                 |
| Get Agr 11                     | HTTP Request Tool         | AGR data retrieval                 | MCP Trigger                     | None                             |                                                 |
| Description - AGR              | Sticky Note               | AGR block description             | None                             | None                             |                                                 |
| Sticky Note2                  | Sticky Note               | Annotation block note             | None                             | None                             |                                                 |
| Create Annotation 1            | HTTP Request Tool         | Create annotation                 | MCP Trigger                     | None                             |                                                 |
| Get Annotation 9              | HTTP Request Tool         | Get annotation                   | MCP Trigger                     | None                             |                                                 |
| Get Annotation 10             | HTTP Request Tool         | Get annotation                   | MCP Trigger                     | None                             |                                                 |
| Get Annotation 11             | HTTP Request Tool         | Get annotation                   | MCP Trigger                     | None                             |                                                 |
| Get Annotation 12             | HTTP Request Tool         | Get annotation                   | MCP Trigger                     | None                             |                                                 |
| Get Annotation 13             | HTTP Request Tool         | Get annotation                   | MCP Trigger                     | None                             |                                                 |
| Get Annotation 14             | HTTP Request Tool         | Get annotation                   | MCP Trigger                     | None                             |                                                 |
| Get Annotation 15             | HTTP Request Tool         | Get annotation                   | MCP Trigger                     | None                             |                                                 |
| Get Annotation 16             | HTTP Request Tool         | Get annotation                   | MCP Trigger                     | None                             |                                                 |
| Get Annotation 17             | HTTP Request Tool         | Get annotation                   | MCP Trigger                     | None                             |                                                 |
| Sticky Note3                  | Sticky Note               | Enrichment block note            | None                             | None                             |                                                 |
| Create Enrichment 2           | HTTP Request Tool         | Create enrichment                | MCP Trigger                     | None                             |                                                 |
| Create Enrichment 3           | HTTP Request Tool         | Create enrichment                | MCP Trigger                     | None                             |                                                 |
| Description - enrichment-web-service | Sticky Note               | Enrichment service description    | None                             | None                             |                                                 |
| Sticky Note4                  | Sticky Note               | Gene block note                  | None                             | None                             |                                                 |
| Get Gene 14                  | HTTP Request Tool         | Get gene data                   | MCP Trigger                     | None                             |                                                 |
| Get Gene 15                  | HTTP Request Tool         | Get gene data                   | MCP Trigger                     | None                             |                                                 |
| Get Gene 16                  | HTTP Request Tool         | Get gene data                   | MCP Trigger                     | None                             |                                                 |
| Create Gene 2                | HTTP Request Tool         | Create gene                    | MCP Trigger                     | None                             |                                                 |
| Get Gene 17                  | HTTP Request Tool         | Get gene data                   | MCP Trigger                     | None                             |                                                 |
| Get Gene 18                  | HTTP Request Tool         | Get gene data                   | MCP Trigger                     | None                             |                                                 |
| Get Gene 19                  | HTTP Request Tool         | Get gene data                   | MCP Trigger                     | None                             |                                                 |
| Get Gene 20                  | HTTP Request Tool         | Get gene data                   | MCP Trigger                     | None                             |                                                 |
| Get Gene 21                  | HTTP Request Tool         | Get gene data                   | MCP Trigger                     | None                             |                                                 |
| Create Gene 3                | HTTP Request Tool         | Create gene                    | MCP Trigger                     | None                             |                                                 |
| Get Gene 22                  | HTTP Request Tool         | Get gene data                   | MCP Trigger                     | None                             |                                                 |
| Get Gene 23                  | HTTP Request Tool         | Get gene data                   | MCP Trigger                     | None                             |                                                 |
| Get Gene 24                  | HTTP Request Tool         | Get gene data                   | MCP Trigger                     | None                             |                                                 |
| Get Gene 25                  | HTTP Request Tool         | Get gene data                   | MCP Trigger                     | None                             |                                                 |
| Get Gene 26                  | HTTP Request Tool         | Get gene data                   | MCP Trigger                     | None                             |                                                 |
| Get Gene 27                  | HTTP Request Tool         | Get gene data                   | MCP Trigger                     | None                             |                                                 |
| Sticky Note5                 | Sticky Note               | Gene operations note            | None                             | None                             |                                                 |
| Get Lookup 14                | HTTP Request Tool         | Get lookup data                | MCP Trigger                     | None                             |                                                 |
| Create Lookup 10             | HTTP Request Tool         | Create lookup entry            | MCP Trigger                     | None                             |                                                 |
| Get Lookup 15                | HTTP Request Tool         | Get lookup data                | MCP Trigger                     | None                             |                                                 |
| Create Lookup 11             | HTTP Request Tool         | Create lookup entry            | MCP Trigger                     | None                             |                                                 |
| Get Lookup 16                | HTTP Request Tool         | Get lookup data                | MCP Trigger                     | None                             |                                                 |
| Create Lookup 12             | HTTP Request Tool         | Create lookup entry            | MCP Trigger                     | None                             |                                                 |
| Get Lookup 17                | HTTP Request Tool         | Get lookup data                | MCP Trigger                     | None                             |                                                 |
| Create Lookup 13             | HTTP Request Tool         | Create lookup entry            | MCP Trigger                     | None                             |                                                 |
| Get Lookup 18                | HTTP Request Tool         | Get lookup data                | MCP Trigger                     | None                             |                                                 |
| Create Lookup 14             | HTTP Request Tool         | Create lookup entry            | MCP Trigger                     | None                             |                                                 |
| Get Lookup 19                | HTTP Request Tool         | Get lookup data                | MCP Trigger                     | None                             |                                                 |
| Create Lookup 15             | HTTP Request Tool         | Create lookup entry            | MCP Trigger                     | None                             |                                                 |
| Get Lookup 20                | HTTP Request Tool         | Get lookup data                | MCP Trigger                     | None                             |                                                 |
| Create Lookup 16             | HTTP Request Tool         | Create lookup entry            | MCP Trigger                     | None                             |                                                 |
| Get Lookup 21                | HTTP Request Tool         | Get lookup data                | MCP Trigger                     | None                             |                                                 |
| Create Lookup 17             | HTTP Request Tool         | Create lookup entry            | MCP Trigger                     | None                             |                                                 |
| Get Lookup 22                | HTTP Request Tool         | Get lookup data                | MCP Trigger                     | None                             |                                                 |
| Create Lookup 18             | HTTP Request Tool         | Create lookup entry            | MCP Trigger                     | None                             |                                                 |
| Get Lookup 23                | HTTP Request Tool         | Get lookup data                | MCP Trigger                     | None                             |                                                 |
| Create Lookup 19             | HTTP Request Tool         | Create lookup entry            | MCP Trigger                     | None                             |                                                 |
| Sticky Note6                 | Sticky Note               | Lookup operations note         | None                             | None                             |                                                 |
| Get Map 3                   | HTTP Request Tool         | Get genomic map data           | MCP Trigger                     | None                             |                                                 |
| Get Map 4                   | HTTP Request Tool         | Get genomic map data           | MCP Trigger                     | None                             |                                                 |
| Sticky Note7                | Sticky Note               | Map operations note            | None                             | None                             |                                                 |
| Get Map 5                   | HTTP Request Tool         | Get genomic map data           | MCP Trigger                     | None                             |                                                 |
| Description - Map           | Sticky Note               | Map block description          | None                             | None                             |                                                 |
| Sticky Note8                | Sticky Note               | Ontology operations note       | None                             | None                             |                                                 |
| Get Ontology 3              | HTTP Request Tool         | Get ontology data              | MCP Trigger                     | None                             |                                                 |
| Get Ontology 4              | HTTP Request Tool         | Get ontology data              | MCP Trigger                     | None                             |                                                 |
| Get Ontology 5              | HTTP Request Tool         | Get ontology data              | MCP Trigger                     | None                             |                                                 |
| Description - Ontology      | Sticky Note               | Ontology block description     | None                             | None                             |                                                 |
| Sticky Note9                | Sticky Note               | Pathway operations note        | None                             | None                             |                                                 |
| Get Pathway 2              | HTTP Request Tool         | Get pathway data               | MCP Trigger                     | None                             |                                                 |
| Get Pathway 3              | HTTP Request Tool         | Get pathway data               | MCP Trigger                     | None                             |                                                 |
| Sticky Note10               | Sticky Note               | Phenotype operations note      | None                             | None                             |                                                 |
| Get Phenotype 2            | HTTP Request Tool         | Get phenotype data             | MCP Trigger                     | None                             |                                                 |
| Get Phenotype 3            | HTTP Request Tool         | Get phenotype data             | MCP Trigger                     | None                             |                                                 |
| Description - Quantitative Phenotype | Sticky Note               | Phenotype block description    | None                             | None                             |                                                 |
| Sticky Note11               | Sticky Note               | QTL operations note            | None                             | None                             |                                                 |
| Get Qtl 3                  | HTTP Request Tool         | Get QTL data                  | MCP Trigger                     | None                             |                                                 |
| Get Qtl 4                  | HTTP Request Tool         | Get QTL data                  | MCP Trigger                     | None                             |                                                 |
| Get Qtl 5                  | HTTP Request Tool         | Get QTL data                  | MCP Trigger                     | None                             |                                                 |
| Sticky Note12               | Sticky Note               | SSLP operations note           | None                             | None                             |                                                 |
| Get Sslp 1                 | HTTP Request Tool         | Get SSLP data                 | MCP Trigger                     | None                             |                                                 |
| Description - SSLP         | Sticky Note               | SSLP block description         | None                             | None                             |                                                 |
| Sticky Note13               | Sticky Note               | Statistics operations note     | None                             | None                             |                                                 |
| Get Stat 24 to Get Stat 47 | HTTP Request Tool         | Get statistical data           | MCP Trigger                     | None                             |                                                 |
| Get Term Stats 1           | HTTP Request Tool         | Get term statistics            | MCP Trigger                     | None                             |                                                 |
| Description - Statistics   | Sticky Note               | Statistics block description   | None                             | None                             |                                                 |
| Sticky Note14               | Sticky Note               | Strain operations note         | None                             | None                             |                                                 |
| Get Strains 1              | HTTP Request Tool         | Get strain data                | MCP Trigger                     | None                             |                                                 |
| Get Strain 2               | HTTP Request Tool         | Get strain data                | MCP Trigger                     | None                             |                                                 |
| Get Strain 3               | HTTP Request Tool         | Get strain data                | MCP Trigger                     | None                             |                                                 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create MCP Trigger Node**  
   - Type: `@n8n/n8n-nodes-langchain.mcpTrigger`  
   - Name: `Rat Genome Database REST MCP Server`  
   - Configuration: Use webhook ID or create a new webhook for REST API MCP trigger. No additional parameters needed.  

2. **Add Sticky Notes for Documentation**  
   - Add nodes of type `Sticky Note` for "Setup Instructions", "Workflow Overview", and descriptive notes for each data block (AGR, Annotation, Enrichment, etc.). Include textual descriptions as needed.

3. **Create HTTP Request Nodes for AGR Operations**  
   - Add nodes named `Get Agr 6` through `Get Agr 11`.  
   - Type: `HTTP Request Tool`  
   - Configure each with the respective RGD AGR endpoint URL, HTTP method `GET`.  
   - Use expressions or parameters to dynamically pass MCP command data as query parameters or path variables.  
   - Connect output of MCP Trigger node to the input of each HTTP Request node.

4. **Create HTTP Request Nodes for Annotation Operations**  
   - Add nodes named `Create Annotation 1` and `Get Annotation 9` through `Get Annotation 17`.  
   - For creation nodes, use HTTP method `POST` or `PUT`. For retrieval, use `GET`.  
   - Configure endpoints accordingly.  
   - Link MCP Trigger output to these nodes.

5. **Create HTTP Request Nodes for Enrichment Operations**  
   - Add `Create Enrichment 2` and `Create Enrichment 3`.  
   - Use `POST` method with appropriate body parameters.  
   - Connect from MCP Trigger.

6. **Create HTTP Request Nodes for Gene Operations**  
   - Add `Get Gene 14` through `Get Gene 27`.  
   - Add `Create Gene 2` and `Create Gene 3` nodes.  
   - Configure GET and POST/PUT requests as appropriate.  
   - Connect MCP trigger outputs.

7. **Create HTTP Request Nodes for Lookup Operations**  
   - Add `Get Lookup 14` through `Get Lookup 27`.  
   - Add `Create Lookup 10` through `Create Lookup 19`.  
   - Configure endpoints and HTTP methods as required.  
   - Connect from MCP Trigger.

8. **Create HTTP Request Nodes for Map Operations**  
   - Add `Get Map 3`, `Get Map 4`, `Get Map 5`.  
   - Configure with GET method and map endpoints.  
   - Connect from MCP Trigger.

9. **Create HTTP Request Nodes for Ontology Operations**  
   - Add `Get Ontology 3`, `Get Ontology 4`, `Get Ontology 5`.  
   - Configure GET requests.  
   - Connect MCP Trigger output.

10. **Create HTTP Request Nodes for Pathway Operations**  
    - Add `Get Pathway 2`, `Get Pathway 3`.  
    - Configure GET requests.  
    - Connect MCP Trigger output.

11. **Create HTTP Request Nodes for Phenotype Operations**  
    - Add `Get Phenotype 2`, `Get Phenotype 3`.  
    - Configure GET requests.  
    - Connect MCP Trigger output.

12. **Create HTTP Request Nodes for QTL Operations**  
    - Add `Get Qtl 3`, `Get Qtl 4`, `Get Qtl 5`.  
    - Configure GET requests.  
    - Connect MCP Trigger output.

13. **Create HTTP Request Nodes for SSLP Operations**  
    - Add `Get Sslp 1`.  
    - Configure GET request endpoint.  
    - Connect MCP Trigger output.

14. **Create HTTP Request Nodes for Statistics Operations**  
    - Add `Get Stat 24` through `Get Stat 47` and `Get Term Stats 1`.  
    - Configure GET requests for statistical data endpoints.  
    - Connect MCP Trigger output.

15. **Create HTTP Request Nodes for Strain Operations**  
    - Add `Get Strains 1`, `Get Strain 2`, `Get Strain 3`.  
    - Configure GET requests.  
    - Connect MCP Trigger output.

16. **Set Credentials**  
    - For HTTP Request Tool nodes, configure credentials if RGD API requires authentication (e.g., API key, OAuth2).  
    - Confirm all HTTP requests have proper authentication and headers.

17. **Configure Expressions and Parameters**  
    - In each HTTP Request node, use expressions to extract parameters from MCP trigger command input.  
    - Validate and sanitize inputs to avoid malformed requests.

18. **Add Error Handling (Optional)**  
    - Consider adding error workflow branches or catch nodes to handle HTTP errors, timeouts, or invalid requests gracefully.

---

### 5. General Notes & Resources

| Note Content                                                                                                       | Context or Link                                 |
|--------------------------------------------------------------------------------------------------------------------|------------------------------------------------|
| This workflow demonstrates using n8n's MCP trigger for exposing a REST API with extensive RGD operations.          | Workflow context                               |
| RGD API documentation should be referred to for accurate endpoint URLs and parameters configuration.               | https://rgd.mcw.edu/rgdweb/ontology/search.html (example) |
| Sticky notes in the workflow serve as useful inline documentation for setup and operation understanding.           | n8n Sticky Notes feature                        |
| Ensure network stability and API rate limits are respected to avoid failures during high-volume queries.           | General API best practices                       |
| Validate all inputs passed via MCP commands to avoid injection or malformed requests.                              | Security best practices                          |

---

**Disclaimer:** The provided text is exclusively derived from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to applicable content policies and contains no illegal, offensive, or protected elements. All manipulated data is legal and public.