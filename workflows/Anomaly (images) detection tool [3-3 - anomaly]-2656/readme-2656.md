Anomaly (images) detection tool [3/3 - anomaly]

https://n8nworkflows.xyz/workflows/anomaly--images--detection-tool--3-3---anomaly--2656


# Anomaly (images) detection tool [3/3 - anomaly]

---

## 1. Workflow Overview

This workflow implements an **Anomaly Detection Tool** for agricultural crop images, designed to determine if a given crop image is anomalous relative to a pre-existing dataset stored in a Qdrant vector database. It is the third pipeline in a series, where:

- Pipeline 1: Uploads and crops the dataset images into Qdrant.
- Pipeline 2: Defines cluster centers and threshold scores for each crop class within Qdrant.
- Pipeline 3 (this workflow): Accepts any crop image URL as input, generates an embedding vector using Voyage AI’s multimodal embedding model, queries Qdrant against cluster medoids, and compares similarity scores to thresholds to decide anomaly status.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception and Preparation**: Accepts image URL input, sets variables for Qdrant access.
- **1.2 Embedding Generation**: Sends image URL to Voyage AI embeddings API to obtain vector representation.
- **1.3 Qdrant Query for Similarity**: Queries Qdrant collection medoids to retrieve similarity scores.
- **1.4 Score Comparison and Result**: Compares similarity scores against cluster thresholds to detect anomaly and outputs a message.

This modular structure leverages prior dataset preparation and cluster thresholding to facilitate real-time anomaly detection on new images.

---

## 2. Block-by-Block Analysis

### 2.1 Input Reception and Preparation

**Overview:**  
This block receives the input image URL via a workflow trigger, sets constant variables for accessing the Qdrant collection and cluster medoid details, and retrieves metadata about the collection including total points and crop classes.

**Nodes Involved:**  
- Execute Workflow Trigger  
- Image URL hardcode  
- Variables for medoids  
- Total Points in Collection  
- Each Crop Counts  
- Info About Crop Labeled Clusters  
- Sticky Note2, Sticky Note3, Sticky Note4, Sticky Note5, Sticky Note22, Sticky Note1

**Node Details:**

- **Execute Workflow Trigger**  
  - *Type:* Entry trigger node  
  - *Role:* Receives external trigger with JSON containing `imageURL`  
  - *Inputs:* None (trigger)  
  - *Outputs:* Passes to "Image URL hardcode"  
  - *Edge Cases:* Missing or malformed imageURL in trigger payload  

- **Image URL hardcode**  
  - *Type:* Set node  
  - *Role:* Extracts and explicitly sets the input image URL variable for downstream use  
  - *Configuration:* Assigns `imageURL` from trigger’s JSON path `query.imageURL`  
  - *Inputs:* From Execute Workflow Trigger  
  - *Outputs:* To Variables for medoids  

- **Variables for medoids**  
  - *Type:* Set node  
  - *Role:* Defines constants for Qdrant access and cluster medoid properties  
  - *Configuration:*  
    - `clusterCenterType`: "is_medoid" (defines medoid point property in Qdrant)  
    - `qdrantCloudURL`: Qdrant Cloud base URL (region-specific)  
    - `collectionName`: "agricultural-crops" (Qdrant collection)  
    - `clusterThresholdCenterType`: "is_medoid_cluster_threshold" (threshold property key)  
  - *Inputs:* From Image URL hardcode  
  - *Outputs:* To Total Points in Collection  

- **Total Points in Collection**  
  - *Type:* HTTP Request  
  - *Role:* Queries Qdrant to get the total number of points in the collection  
  - *Configuration:* POST request to `/collections/{collectionName}/points/count` with JSON body `{ "exact": true }`  
  - *Authentication:* Qdrant API credentials  
  - *Inputs:* From Variables for medoids  
  - *Outputs:* To Each Crop Counts  
  - *Failures:* Network issues, auth failures, invalid collection name  

- **Each Crop Counts**  
  - *Type:* HTTP Request  
  - *Role:* Retrieves count of points per crop class (facet query on "crop_name") from Qdrant  
  - *Configuration:* POST `/collections/{collectionName}/facet` with body containing key `"crop_name"` and limit set to total points count  
  - *Authentication:* Qdrant API credentials  
  - *Inputs:* From Total Points in Collection  
  - *Outputs:* To Info About Crop Labeled Clusters  
  - *Failures:* Same as above, plus facet key errors  

- **Info About Crop Labeled Clusters**  
  - *Type:* Set node  
  - *Role:* Calculates number of crop classes (`cropsNumber`) from facet response length, used later for query limit  
  - *Configuration:* Sets `cropsNumber` to length of facet hits array  
  - *Inputs:* From Each Crop Counts  
  - *Outputs:* To Embed image  

- **Sticky Notes**  
  - Provide contextual information about:  
    - Crop classes included in dataset (Sticky Note1)  
    - Role and use of variables for Qdrant (Sticky Note2)  
    - Explanation of cluster center types and threshold types (Sticky Note3)  
    - Overview of the anomaly detection tool process (Sticky Note4)  
    - Explanation of nodes for crop counts and their prior use (Sticky Note5)  
    - General workflow description and recreation instructions (Sticky Note22)  

---

### 2.2 Embedding Generation

**Overview:**  
This block generates the embedding vector for the input image URL using the Voyage AI multimodal embedding API.

**Nodes Involved:**  
- Embed image  
- Sticky Note6

**Node Details:**

- **Embed image**  
  - *Type:* HTTP Request  
  - *Role:* Sends POST request to Voyage AI embeddings endpoint with the image URL to obtain an embedding vector  
  - *Configuration:*  
    - URL: `https://api.voyageai.com/v1/multimodalembeddings`  
    - Method: POST  
    - JSON body includes:  
      ```json
      {
        "inputs": [
          {
            "content": [
              {
                "type": "image_url",
                "image_url": "<value from 'Image URL hardcode' node>"
              }
            ]
          }
        ],
        "model": "voyage-multimodal-3",
        "input_type": "document"
      }
      ```  
    - Authentication: HTTP Header Auth with Voyage AI API credentials  
  - *Inputs:* From Info About Crop Labeled Clusters  
  - *Outputs:* To Get similarity of medoids  
  - *Failures:* API key invalid, rate limits, malformed image URL, API downtime  

- **Sticky Note6**  
  - Explains embedding process and purpose within anomaly detection  

---

### 2.3 Qdrant Query for Similarity

**Overview:**  
This block queries the Qdrant collection for similarity scores between the input image embedding and cluster medoids, retrieving the closest medoid points with their scores and payloads.

**Nodes Involved:**  
- Get similarity of medoids  
- Sticky Note7

**Node Details:**

- **Get similarity of medoids**  
  - *Type:* HTTP Request  
  - *Role:* Queries Qdrant collection points using the embedding vector to find similarity scores with medoid points  
  - *Configuration:*  
    - URL dynamically constructed from variables: `{{qdrantCloudURL}}/collections/{{collectionName}}/points/query`  
    - Method: POST  
    - JSON body includes:  
      ```json
      {
        "query": <embedding vector from Embed image>,
        "using": "voyage",
        "limit": <cropsNumber from Info About Crop Labeled Clusters>,
        "with_payload": true,
        "filter": {
          "must": [
            {
              "key": <clusterCenterType>,
              "match": { "value": true }
            }
          ]
        }
      }
      ```  
    - Authentication: Qdrant API credentials  
  - *Inputs:* From Embed image  
  - *Outputs:* To Compare scores  
  - *Failures:* Network errors, invalid embedding vectors, Qdrant API limits, wrong filter key  

- **Sticky Note7**  
  - Details role of this query in determining similarity to cluster centers and anomaly decision logic  

---

### 2.4 Score Comparison and Result

**Overview:**  
This block analyzes the similarity scores returned from Qdrant, compares them to the threshold scores for each cluster medoid, and decides whether the input image is anomalous or similar to a known crop class.

**Nodes Involved:**  
- Compare scores

**Node Details:**

- **Compare scores**  
  - *Type:* Code node (Python)  
  - *Role:* Iterates over medoid points, compares each point’s similarity score to its stored threshold; determines the highest scoring crop above threshold or flags anomaly if none pass threshold  
  - *Key expressions:*  
    - Uses `points = _input.first()['json']['result']['points']` to access query results  
    - Reads threshold key from variables: `clusterThresholdCenterType`  
    - Logic:  
      - Initialize `max_score = -1`, `crop_with_max_score = None`, `undefined = True`  
      - Iterate points: if score >= threshold, update max_score and crop_with_max_score  
      - If none above threshold, set result message to alert anomaly  
      - Else, return message with crop name similarity  
  - *Inputs:* From Get similarity of medoids  
  - *Outputs:* JSON with key `"result"` containing message string  
  - *Failures:* Code errors if input JSON malformed, missing keys, or empty points array  

---

## 3. Summary Table

| Node Name                    | Node Type                 | Functional Role                                  | Input Node(s)                 | Output Node(s)               | Sticky Note                                                                                                             |
|------------------------------|---------------------------|-------------------------------------------------|------------------------------|-----------------------------|-------------------------------------------------------------------------------------------------------------------------|
| Execute Workflow Trigger      | Execute Workflow Trigger  | Entry point receiving input image URL           | None                         | Image URL hardcode           | See Sticky Note4, Sticky Note22 for tool overview                                                                        |
| Image URL hardcode            | Set                       | Extracts and sets input image URL                | Execute Workflow Trigger     | Variables for medoids        |                                                                                                                         |
| Variables for medoids         | Set                       | Defines constants for Qdrant API and cluster keys| Image URL hardcode           | Total Points in Collection   | Sticky Note2 (variables explanation), Sticky Note3 (cluster center and threshold keys)                                  |
| Total Points in Collection    | HTTP Request              | Fetches total point count in Qdrant collection  | Variables for medoids        | Each Crop Counts            | Sticky Note5 (explains crop class counting nodes)                                                                        |
| Each Crop Counts             | HTTP Request              | Retrieves crop class counts (facets)             | Total Points in Collection   | Info About Crop Labeled Clusters | Sticky Note5                                                                                                           |
| Info About Crop Labeled Clusters | Set                   | Calculates number of crop classes (`cropsNumber`)| Each Crop Counts             | Embed image                 |                                                                                                                         |
| Embed image                  | HTTP Request              | Generates embedding vector from input image URL | Info About Crop Labeled Clusters | Get similarity of medoids    | Sticky Note6 (explains embedding process)                                                                                |
| Get similarity of medoids    | HTTP Request              | Queries Qdrant medoid points with embedding vector| Embed image                  | Compare scores              | Sticky Note7 (explains similarity matching logic)                                                                        |
| Compare scores              | Code (Python)              | Compares medoid scores to thresholds; decides anomaly| Get similarity of medoids    | None                        |                                                                                                                         |
| Sticky Note1                | Sticky Note                | Lists crops included in dataset                   | None                         | None                        | Covers dataset crop types                                                                                                |
| Sticky Note2                | Sticky Note                | Explains variables for Qdrant collection access  | None                         | None                        | Covers Variables for medoids node                                                                                        |
| Sticky Note3                | Sticky Note                | Explains cluster center types and threshold keys | None                         | None                        | Covers Variables for medoids node                                                                                        |
| Sticky Note4                | Sticky Note                | Overview of anomaly detection tool                | None                         | None                        | Covers entire workflow starting point                                                                                   |
| Sticky Note5                | Sticky Note                | Explains nodes for counting crop classes          | None                         | None                        | Covers Total Points in Collection, Each Crop Counts, Info About Crop Labeled Clusters                                   |
| Sticky Note6                | Sticky Note                | Explains embedding step                            | None                         | None                        | Covers Embed image node                                                                                                  |
| Sticky Note7                | Sticky Note                | Explains querying similarity and anomaly logic   | None                         | None                        | Covers Get similarity of medoids node                                                                                   |
| Sticky Note22               | Sticky Note                | General workflow description and recreation notes | None                         | None                        | Covers entire workflow context and links to dataset and Qdrant Cloud                                                    |

---

## 4. Reproducing the Workflow from Scratch

1. **Create Trigger Node**  
   - Add **Execute Workflow Trigger** node as entry point.  
   - No parameters needed. It will receive input JSON with key `query.imageURL`.

2. **Add Set Node to Extract Image URL**  
   - Name: `Image URL hardcode`  
   - Set field `imageURL` as string: expression `{{$json.query.imageURL}}`  
   - Connect trigger output to this node.

3. **Add Set Node for Constants (Variables for medoids)**  
   - Name: `Variables for medoids`  
   - Add the following string fields:  
     - `clusterCenterType`: "is_medoid"  
     - `qdrantCloudURL`: Your Qdrant Cloud URL (e.g., `https://your-cluster-region.aws.cloud.qdrant.io`)  
     - `collectionName`: "agricultural-crops" (or your collection name)  
     - `clusterThresholdCenterType`: "is_medoid_cluster_threshold"  
   - Connect `Image URL hardcode` output to this node.

4. **Add HTTP Request Node to Get Total Points in Collection**  
   - Name: `Total Points in Collection`  
   - Method: POST  
   - URL: `{{$json.qdrantCloudURL}}/collections/{{$json.collectionName}}/points/count`  
   - Body (JSON): `{ "exact": true }`  
   - Authentication: Use saved Qdrant API credentials (OAuth2 or API key)  
   - Connect from `Variables for medoids`.

5. **Add HTTP Request Node to Get Each Crop Counts (Facet)**  
   - Name: `Each Crop Counts`  
   - Method: POST  
   - URL: `{{$json.qdrantCloudURL}}/collections/{{$json.collectionName}}/facet`  
   - Body (JSON):  
     ```json
     {
       "key": "crop_name",
       "limit": {{$json.result.count}},
       "exact": true
     }
     ```  
   - Authentication: Qdrant API credentials  
   - Connect from `Total Points in Collection`.

6. **Add Set Node for Crop Classes Number**  
   - Name: `Info About Crop Labeled Clusters`  
   - Set field `cropsNumber` (number) to expression `{{$json.result.hits.length}}`  
   - Connect from `Each Crop Counts`.

7. **Add HTTP Request Node to Embed Image**  
   - Name: `Embed image`  
   - Method: POST  
   - URL: `https://api.voyageai.com/v1/multimodalembeddings`  
   - Body (JSON):  
     ```json
     {
       "inputs": [
         {
           "content": [
             {
               "type": "image_url",
               "image_url": "={{$node['Image URL hardcode'].json['imageURL']}}"
             }
           ]
         }
       ],
       "model": "voyage-multimodal-3",
       "input_type": "document"
     }
     ```  
   - Authentication: HTTP Header Auth with Voyage AI API key  
   - Connect from `Info About Crop Labeled Clusters`.

8. **Add HTTP Request Node to Query Qdrant Medoids**  
   - Name: `Get similarity of medoids`  
   - Method: POST  
   - URL: `={{$node['Variables for medoids'].json.qdrantCloudURL}}/collections/{{$node['Variables for medoids'].json.collectionName}}/points/query`  
   - Body (JSON):  
     ```json
     {
       "query": {{$node['Embed image'].json.data[0].embedding}},
       "using": "voyage",
       "limit": {{$node['Info About Crop Labeled Clusters'].json.cropsNumber}},
       "with_payload": true,
       "filter": {
         "must": [
           {
             "key": {{$node['Variables for medoids'].json.clusterCenterType}},
             "match": { "value": true }
           }
         ]
       }
     }
     ```  
   - Authentication: Qdrant API credentials  
   - Connect from `Embed image`.

9. **Add Code Node to Compare Scores**  
   - Name: `Compare scores`  
   - Language: Python  
   - Code:  
     ```python
     points = _input.first()['json']['result']['points']
     threshold_type = _('Variables for medoids').first()['json']['clusterThresholdCenterType']

     max_score = -1
     crop_with_max_score = None
     undefined = True

     for center in points:
         if center['score'] >= center['payload'][threshold_type]:
             undefined = False
             if center['score'] > max_score:
                 max_score = center['score']
                 crop_with_max_score = center['payload']['crop_name']

     if undefined:
         result_message = "ALERT, we might have a new undefined crop!"
     else:
         result_message = f"Looks similar to {crop_with_max_score}"

     return [{
         "json": {
             "result": result_message
         }
     }]
     ```  
   - Connect from `Get similarity of medoids`.

10. **Optional: Add Sticky Notes at appropriate positions** to document:  
    - Dataset crop types  
    - Variable explanations  
    - Workflow overview  
    - Embedding process  
    - Similarity logic  

---

## 5. General Notes & Resources

| Note Content                                                                                                                             | Context or Link                                                                                                                      |
|------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------|
| Dataset crops include 29 classes such as 'pearl_millet(bajra)', 'tobacco-plant', 'cherry', 'cotton', 'banana', etc.                     | Sticky Note1 content; relevant for understanding dataset scope                                                                     |
| To recreate the tool, upload the crops dataset from Kaggle to Google Storage and configure Qdrant Cloud (Free Tier available), Voyage AI API, and Google Cloud Storage credentials | Workflow description and external resource links in Sticky Note22                                                                   |
| Voyage AI embedding model used is `voyage-multimodal-3` via https://api.voyageai.com/v1/multimodalembeddings                           | Embedding node configuration                                                                                                       |
| Qdrant Cloud documentation and quickstart for cluster setup: https://qdrant.tech/documentation/quickstart-cloud/                         | Relevant for pipeline 1 and 2 setup; linked in Sticky Note22                                                                        |
| Thresholds for anomaly detection are stored as `is_medoid_cluster_threshold` in Qdrant points payloads                                    | Used in variables and comparison node; critical for anomaly decision logic                                                          |
| The workflow is adaptable to any image dataset with similar structure if embeddings and Qdrant collections are properly configured       | General note on workflow flexibility                                                                                                |

---

# End of Document