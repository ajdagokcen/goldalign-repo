# GoldAlign

### Synopsis

GoldAlign provides a browser-based interface for creating gold standard annotations of sentence alignment. Output is generated automatically from a graphical grid-based workspace.

Sentence pairs to be aligned are stored in tab-separated files called *batches*, which can contain any number of such pairs (batch sizes under 10 are recommended but not required). *Datasets* are groups (directories) of related batches for the sake of organization and convenience. Once users select a dataset to work with, they can view their completion status for each batch within the set and open any batch to begin annotation.

After any two users tasked with primary annotation have completed a given batch, users tasked with arbitration can look at both users' annotations simultaneously on a color-coded grid, solve any discrepancies, and output the finalized alignment.

GoldAlign is introduced in the paper *A Corpus of Word-Aligned Asked and Anticipated Questions in a Virtual Patient Dialogue System* by Ajda Gokcen, Evan Jaffe, Johnsey Erdmann, Michael White, Douglas Danforth.  This paper is included in the proceedings of the 10th edition of the Language Resources and Evaluation Conference (LREC 2016).

Any future updates to GoldAlign can be tracked at the [GitHub repository](https://github.com/ajdagokcen/goldalign-repo).

### Installation and Running

GoldAlign is run through Node.js, which can be downloaded for installation [here](https://nodejs.org/en/download/) or via command line as outlined [here](https://nodejs.org/en/download/package-manager/).

Once Node.js is installed on the machine on which you want to run GoldAlign, you can simply execute the bash script `RUN` in the project's root directory. By default, this will run GoldAlign at the local port numbered *2001*, although you can specify a different port number by instead running `app.js {port # of choice}`. The tool can then be accessed at **localhost:{PORT #}** within any browser, or at **{URL OF CHOICE}:{PORT #}** if you are running it on a properly set-up server.

You can run `CHECK` (again, within the project's root directory) to ensure that everything is in fact running, or `KILL` to end the process.

### Administration

***Creating new batch files.*** Batch files are flat, tab-delimited text files of variable length, stored in dataset directories as explained in the next paragraph.  Example batch files can be found at `data/datasets/demo-corpus/`.  They are of the following 10-column structure:

1. **PAIRWISE-ID** *(string; unique ID for the two sentences being aligned)*
2. **SOURCE-STRING** *(string; the source sentence to be aligned)*
3. **SOURCE-LINK** *(string; a relative link to the context file containing the source sentence; left blank if there is no such file)*
4. **TARGET-STRING** *(string; the target sentence to be aligned)*
5. **TARGET-LINK** *(string; a relative link to the context file containing the target sentence; left blank if there is no such file)*
6. **CORPUS-PARAPHRASE-JUDGMENT** *(boolean 0 or 1; the paraphrase judgment for the two sentences according to the original corpus, 0 for non-paraphrases and 1 for paraphrases)*
7. **USER-PARAPHRASE-JUDGMENT** *(boolean 0 or 1; the paraphrase judgment for the two sentences according to the user, 0 for non-paraphrases and 1 for paraphrases)*
8. **SURE-ALIGNMENT** *(string; space-delimited list of index pairs of the form {SOURCE-INDEX}-{TARGET-INDEX} representing certain or strong word-wise alignments between the source and target sentences)*
9. **POSS-ALIGNMENT** *(string; space-delimited list of index pairs of the form {SOURCE-INDEX}-{TARGET-INDEX} representing possible or weak word-wise alignments between the source and target sentences)*
10. **COMMENTS** *(string; freeform user-created notes)*

***Creating new datasets.*** New datasets/batches cannot be added through the tool's interface; they can only be added directly into the file structure of your instance of GoldAlign.  Datasets must be added as subdirectories of `data/datasets/`.  For example, a dataset called "new-dataset" would be represented as a directory with the path `data/datasets/new-dataset/` relative to the root directory.  The initial batch files must be put into this directory in order to be viewable by the tool (e.g., at `data/datasets/new-dataset/batch-1.tsv`).  Once datasets/batches are initialized as such, the tool automatically handles the creation of modified and arbitration-related files.

***Creating context files.*** New context files cannot be added through the tool's interface; they can only be added directly into the file structure of your instance of GoldAlign.  Context files must parallel a dataset, being stored in subdirectories of `data/context/`.  You must create a directory parallel to the one in `data/datasets/`, so a dataset stored at `data/datasets/new-dataset/` would have a parallel context directory created at `data/context/new-dataset/`.  Within this directory, context files may look like anything you'd like; there are some examples at `data/context/demo-corpus/`.

Within the tool's workspace there is a fixed relative link to a file at `data/context/{DATASET-NAME}/all_labels.html`.  This file, should it be included, is for context that is relevant to the entire dataset, and thus should be available for users to access regardless of which sentence pair or batch they are working on at the time.

Note that context links in the batch files must be **relative to the context path specific to the dataset**, so if the root-relative path to a context file is `data/context/new-dataset/context-1.html`, the source or target links in the batch files would simply be *"context-1.html"*.

***Creating new users.*** New users cannot be added through the tool's interface; they can only be added directly into the file structure of your instance of GoldAlign.  Users must be added as subdirectories of `data/users/`.  For example, a user called "new-user" would be represented as a directory with the path `data/users/new-user/` relative to the root directory.  Once users are initialized as such, the tool automatically handles the creation of modified and arbitration-related files. 

***Accessing finalized data.*** Finalized datasets for a given user can be found at `data/users/{USERNAME}/complete/`.  Finalized gold (arbitrated) datasets for a given two users can be found at `data/users/arbit/{USERNAME-1}_{USERNAME-2}/complete/`.

### Credits

A significant portion of the code for the alignment grid (as in *index.js*) utilizes elements of Chris Callison-Burch’s word alignment tool:

- Zaidan, Omar, and Chris Callison-Burch. "Fast. Cheap and Creative: Evaluating Translation Quality Using Amazon’s Mechanical Turk." Proceedings of the 2009 Conference on Empirical Methods in Natural Language Processing. 2009. <https://www.aclweb.org/anthology/D/D09/D09-1030.pdf>.
    - (see locally: pdf/callison-burch\_2009.pdf)
- Callison-Burch, Chris, David Talbot, and Miles Osborne. "Statistical machine translation with word-and sentence-aligned parallel corpora." Proceedings of the 42nd Annual Meeting of the Association for Computational Linguistics. 2004. <https://aclweb.org/anthology/P/P04/P04-1023.pdf>.
    - (see locally: pdf/callison-burch\_2004.pdf)

### License

GoldAlign is licensed under GPL 3.0, shown in the file LICENSE.txt.

