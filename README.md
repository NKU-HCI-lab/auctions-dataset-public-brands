# A brand dataset for entity name resolution research




## Entity (brand) name resolution

Entity name resolution is the process of aggregating a number of similar strings that are semantically the same (i.e., they represent the same entity) and associating it with a single name. 

For instance, all the following names correspond to the same entity

- IBM"
- I.B.M.
- International Business Machines
- I B M

This is done in several steps:

1. Canonicalization, where a set of entity name variations are mapped to a single entity name. For instance, all the following variations are mapped to a single canonical entity name
   `["IBM", "I.B.M.", "International Business Machines", "I B M" ] → "IBM"`

2. Similarity calculation and clustering, which compares pairs of entities and outputs a similarity score. For instance, looking at the similarity score between the following brands, we can easily group similar brands, despite spelling errors and typos.

   ```bash
	DISNEY - DSINEY: 0.95
	DISNEY - DELTA: 0.41
	DISNEY - DLETA: 0.41
	DELTA - DLETA: 0.95
   ```

3. Validation, that is, using external databases to identify actual entity names from those that don't. For instance, in the following case, we can count the number of search results on Google.

   ```bash
	DISNEY: 32.000.000 
	DSINEY: 500
	DELTA: 5.000.000
	DLETA: 2.000
   ```

**For additional information** watch this video https://youtu.be/qkT42Bu8Njw.

---



## Content of the repository

The repository contains the following files/folders
- [brands.csv](./brands.csv): the original list of brands listed in order of item count (descending). The item count is not provided because:
  - it can change with every new auction
  - although it could be relevant for validation, we don't want to use it at this point (instead, we can use the order in which brands appear)

- [00_documentation](./00_documentation): useful documents and resources
- [01_canonicalization](./01_canonicalization): program that automatically canonicalizes and aggregates brands based on a set of rules
- [02_similarity-calculation](./02_similarity-calculation): program that automatically calculates similarity between brands
- [03_validation](./03_validation): program that automatically validates existing brands
- [04_review](./04_review): program that enables to manually review and aggregate processed and validated brands based on their similarity score

---



### 01. Canonicalization aggregator

This program applies a series of rules to aggregate brands with respect to a unique canonical name. This program should be executed first.

**Input**: the program receives

- the list of brands (brands.csv)
- the list of rules to be applied to the brands (rules.js)

**Process:**

```pseudocode
Load brands and rules

FOR each brand DO:
    Apply canonicalization rules to the brand name

    IF the canonical string is empty THEN:
        CONTINUE to next brand

    IF the list of brands names represented by the canonical string does not exist THEN:
        Initialize an empty list for the canonical string

    IF original brand name not already in the list THEN:
        Add original brand name to the list
END FOR

Save the list of canonical brands and their lists of brands into "brands_canonical.json"  
```

**Output**: the program produces

- A JSON file containing an object with the canonical brand names and their corresponding brands (`brands_canonical.json`)
- A CSV file containing the canonical brand names only (`brands_canonical.csv`)

**What can be improved:**

- obtain statistics of brand count, canonical count, average brand name count/canonical, invalid brands 
- Filter brands like:
  - "BRAND1 BY BRAND2" - BRAND2 (careful: only works for specific brands and can conflict with brands like DAY BY DAY)
  - "BRAND1 FOR BRAND2" - BRAND1 (careful: only works for specific brands and can conflict with brands like FREE FOR ALL)
  - "BRAND CO LTD" -> BRAND
  - "BRAND AND COMPANY" - BRAND 
  - "BRAND AND CO" - BRAND  
- define new rules based on the data

#### Utilities

- `rules-test.js`: helps test the rules on a sample dataset of brands (`rules-test.csv`)
- `visualize-all.html`: page displaying a table with keys as headings and brand lists in one row
- `visualize-canonical-names-only.html`: page displaying only the object keys as a list

---



### 02. Brand similarity calculator

This program calculates the similarity score between brand names. This program can be executed simultaneously with or independently of the brand validator.

For this implementation, we chose Jaro Winkler as a string similarity calculator.

**Input**: the program receives

- the list of brands grouped by their canonical names (`brands_canonical.json`)

**Process**: the program runs the following pseudo-code

```pseudocode
Load brand data from JSON file
Extract unique brand names into an array

IF a previous similarity results file exists THEN:
    Read it and extract processed brand names
    Ensure processed list is unique

FOR each brand in the list:
    IF the brand has already been processed THEN:
        Skip it
    Initialize empty lists for similar pairs (all and one-way only)

    FOR every other brand that comes after the current brand:
        IF names are identical:
            Add pair with similarity 1.0 to both lists
        ELSE:
            Calculate similarity using Jaro-Winkler
            IF similarity exceeds threshold THEN:
                Add pair (both directions) to full list
                Add one-way pair to one-way list
    END FOR
    
    IF any similar pairs found THEN:
        Append full list to "similar.csv"
        Append one-way list to "similar_only_next.csv"
END FOR
```

**Output**: the program outputs 

- the list of brands having similarity score >.9, without bijections (i.e., where brand[i]->brand[j] and brand[j]->brand[i]) (similarity.csv)
- the list of brands having similarity score >.9, without bijections (i.e., where brand[i]->brand[j])  (similarity_only_next.csv)

**What can be improved:**

- Add other similarity measures  such as token-level measures (e.g., Jaccard or TF-IDF cosine on word or 3-gram tokens)

***Please note:*** The program supports resuming. Running the program without deleting similarity.csv will keep track of progress.

---



### 03. Brand validator

This program uses browser automation to verify that a brand exists. The program controls an instance of Chrome browser where Brave search engine is used to search for brands. This program can be executed simultaneously/independently with/of the brand similarity calculator.

<mark>**Please note**</mark>: 

1. Although the total count of search results would be extremely useful for this research, the brave search engine (whether through the UI or its APIs) does not return the total count of results. This is a common practice with modern search engines due to the cost of calculating the total number of results.
2. The fact that a brand is marked as validated by the program does not ensure that the brand is a valid one.
3. The fact that a brand processed by the program is not validated does not mean that the brand is not valid.  

**Input**: the program receives

- the list of brands grouped by their canonical names (`brands_canonical.json`)
- the list of brands already processed by the brand validator, *if any* (`validator_processed.csv`)

**Process**: the program runs the following pseudo-code

```pseudocode
Load brand data from JSON file
Load processed brands from CSV file

FOR each brand canonical in the list:
    IF the brand canonical has already been processed THEN:
        Skip it

    FOR each brand name in the canonical list:
        Search for brand name
        Save the results
        
        FOR each item in the results:
            IF the title matches the brand:
                Save the brand and canonical as validated
        FOR each item in the results:
            IF the canonicalized title matches the canonical brand:
                Save the canonical as validated
    END FOR
    
END FOR
```

**Output**: the program outputs

- the list of brands already processed, if any (`validator_processed.csv`)
- the list of validated brands (`validator_validated.csv`)
- the list of canonical brands already processed, if any (`validator_processed_canonical.csv`)
- the list of validated canonical brands (`validator_validated_canonical.csv`)

***Please note:*** 

- The program supports resuming. Running the program without deleting the files will keep track of progress.
- The program supports running on multiple computers simultaneously. To this end:
  - Change `START_INDEX_CANONICAL`
  - Use `merge_results.js` on two different folders containing the output CSV files to merge them 

#### Utilities

- `mouse_coordinates_check.js`: helps identify the coordinates of the "I am a human" button
- `merge-output.js`: merges the output files processed by multiple computers
- `remove-temp-files-and-folders.js`: cleans up any temporary files and folders left by the browser instance

---



### 04. Brand aggregator

<mark>THIS IS BEING EDITED STILL</mark>

This program provides a user interface that enables to manually aggregate similar brands (e.g., misspelled) with their validated brand name. To this end, the user will:

1.  be presented with a table where each row contains a set of brands having similarity score >.9
2. select (using checkboxes) all the invalid/misspelled brands that need to be aggregated/reconciled with their corresponding valid brand
3. select (using a radio button) a valid brand name that will be used to reconcile other invalid/misspelled brands

**Input**: the program receives

- the list of brands validated with the brand validator (validated.csv) 
- the list of brands processed by the validator (processed.csv)
- the list of brands having similarity score >.9 as calculated by the brand similarity calculator (similarity.csv)
- the list of rules to be applied to the brands (rules.js)
- the list of brands already aggregated, if any (aggregator_processed.csv)

**Process**: the program runs the following pseudo-code

- for each group of brands group[i] having similarity score >.9 with respect to brand[i]
  - show a row containing
    - one column with the brand[i] taken into consideration
    - one column with the list of brands in group[i], where each brand brand[j] is treated as follows:
      - if brand[j] has already been processed, skip it
      - else show
        - a radio button that enables to specify the brand lookup destination brand-destination
        - a checkbox that enables to specify the brand lookup source brand-source[i]
        - font style
          - green/bold if the brand has been validated
          - red/strikethrough if the brand has been processed but not validated
          - no highlight/no style if the brand has not been processed yet
    - one column with a textbox that enables manually specifying the brand lookup destination brand-destination
    - one column with a submit button. When the user clicks the submit button
      - save brand-destination in aggregator_processed.csv
      - for each brand-source[i] 
        - save brand-source[i] in aggregator_processed.csv
        - save "brand-source[i] brand-destination" in lookup.csv (tabulation "\t" is used as a separator)

**Output**: the program outputs

- a lookup table with the list of brands (lookup.csv)
- [<u>for internal use</u>] the list of brands already aggregated, if any (aggregator_processed.csv)
