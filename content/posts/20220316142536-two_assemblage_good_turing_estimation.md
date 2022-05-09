+++
title = "Estimating Unseen Shared Cultural Diversity"
author = ["Folgert Karsdorp"]
lastmod = 2022-05-09T18:26:32+02:00
tags = ["shared-richness", "chao1", "richness", "unseen-species", "folktales"]
draft = false
+++

## Shared Species Estimation {#shared-species-estimation}

In [Demystifying Chao1 with Good-Turing]({{< relref "20220309103709-good_turing_as_an_unseen_species_model.md" >}}), I tried to explain the intuition behind the Chao1
estimator (<a href="#citeproc_bib_item_1">Chao 1984</a>) for unseen species using the
Good-Turing estimator as described in Chao et al. (<a href="#citeproc_bib_item_2">2017</a>). The
latter article discusses another set of diversity measures within that same framework of
Turing. The number of unique species or the number of unique cultural artifacts in a given
environment is only one diversity measure, but we can also study the shared diversity
between two cultural collections, for example. In addition to the number of unique
species, this definition of diversity thus also involves the specific composition of an
assemblage or collection. As with estimating the number of unique species, it is quite
conceivable that our samples do not give a complete picture of which species or cultural
artifacts are shared between two assemblages or collections. Fortunately, with only a few
small adjustments, we can modify the Good-Turing framework to compute a lower-bound on the
number of unseen items _shared_ between two collections.


## Problem description {#problem-description}

Imagine two collections of folk tales, collected in an attempt to map out what folk tales
people know in a particular area. The collections were established indepedently from each
other, and in each collection the observed folk tales were categorized according to the
same folk tale classification systems. The two imaginary collections consists of the
following folk tale types, that were observed with the frequencies listed in the table
below:

| Story ID    | Description                                                                 | \\(c\_1\\) | \\(c\_2\\) |
|-------------|-----------------------------------------------------------------------------|------------|------------|
| SINSAG 0487 | Precedence of other events                                                  | 10         | 8          |
| TM 2801     | Strong man/woman                                                            | 3          | 4          |
| SINSAG 0486 | Other signs of death                                                        | 2          | 2          |
| SINSAG 0481 | Funeral procession seen                                                     | 2          | 1          |
| SINSAG 0478 | Indescribable hauntings                                                     | 1          | 3          |
| SINSAG 0489 | The second face                                                             | 1          | 2          |
| TM 3101     | Witch makes child (human, animal) sick                                      | 1          | 0          |
| SINSAG 1226 | "That's where he lives and this is where he is."                            | 1          | 1          |
| TM 3104     | Devil's Breath as a Defense                                                 | 1          | 0          |
| SINSAG 0917 | Devil scares sinners (cursers, wood thieves, Sunday violators or scoffers). | 1          | 0          |
| total       |                                                                             | 23         | 21         |
| ^           |                                                                             | x          | y          |

The first collection reports a total of \\(n\_1 = 23\\) stories, broken down into 10 unique
story types. The second collection consists of 7 story types represented by a total of
\\(n\_2 = 21\\) folk tales. Together, the two collections consist of 10 unique folk tales,
which we denote by \\(S\_{\textrm{obs}}\\). 7 of the 10 folk tale types appear in both
collections: \\(S\_{\textrm{shared}, \textrm{obs}} = 7\\). Of course, these collections only
represent samples, and thus there's a fair chance that both collections are incomplete and
don't accurately describe the shared number of stories. This actual number of shared
stories and thus implicitly the number of unseen shared stories is the number we want to
calculate. We refer to the true number of shared stories with \\(V\_{\textrm{shared}}\\). To
calculate that number, we need a number of ingredients. First, we need to know how many
stories the two collections already share (\\(V\_{\textrm{shared}, \textrm{obs}}\\)). In
addition, we want to calculate the number of shared stories that appear only in one of the
two collections. We can denote that number with \\(f\_{0, +}\\) for the number of stories that
do not appear in the first collection but appear at least once in the second collection.
Conversely, we use \\(f\_{ +, 0}\\) for the number of stories that occur at least once in the
first collection but not in the second collection. Finally, we want to calculate the
number of unseen shared stories. We denote that number by \\(f\_{0, 0}\\). Based on all these
numbers, we can calculate the true number of shared stories:

\begin{equation}
S\_{\textrm{shared}} = S\_{\textrm{shared}, \textrm{obs}} + f\_{0, +} + f\_{ +, 0} + f\_{0, 0}
\end{equation}


## Mean relative frequencies of shared items {#mean-relative-frequencies-of-shared-items}

In [Demystifying Chao1 with Good-Turing]({{< relref "20220309103709-good_turing_as_an_unseen_species_model.md" >}}), I explained how we can calculate the true average
relative frequency of species or words (or some other category) that occur \\(r\\) times using
the Good-Turing framework. You will need to read that post in order to understand the
following section. With minimal modifications, we can use the same strategy to calculate
the average relative frequency \\(\alpha\_{r+}\\) of folk tales that occur \\(r\\) times collection
1 and at least once (hence the '+' sign) in collection 2. The formula looks like this:

\begin{equation}
\alpha\_{r+} = \frac{(r + 1)f\_{r+1, +}}{(n\_1 - r)f\_{r, +}}
\end{equation}

Of course, we can also compute the average relative frequency \\(\alpha\_{+, v}\\) of folk
tales occurring \\(v\\) times in collection 2 and at least once in collection 1:

\begin{equation}
\alpha\_{+, v} = \frac{(v + 1)f\_{ +, v+1}}{(n\_2 - r)f\_{ +, v}}
\end{equation}

If a folk type occurs equally often in both collections, we can calculate the average
relative frequency \\(\alpha\_{rr}\\) with:

\begin{equation}
\alpha\_{rr} = \frac{(r + 1)^2 f\_{r+1, r+1}}{(n\_1 - r) (n\_2 - r)f\_{r, r}}
\end{equation}

Back to the calculation of \\(v\_{\textrm{shared}}\\). Just as we have seen in [Demystifying
Chao1 with Good-Turing]({{< relref "20220309103709-good_turing_as_an_unseen_species_model.md" >}}), we cannot compute \\(f\_{0, +}\\) and \\(f\_{ +, 0}\\) directly, since we
have no knowledge about \\(\alpha\_{0, +}\\) en \\(\alpha\_{ +, 0}\\). In other words, we don't know
the frequency with which shared folk tales occur in one of the collections but not in the
other. What we do know, however, is that \\(\frac{\alpha\_{0, +} f\_{0, +}}{\alpha\_{0, +}}
\geq \frac{\alpha\_{0, +} f\_{0, +}}{\alpha\_{1, +}}\\). And that last term can be calculated
with:

\begin{equation}
f\_{0, +} = \frac{\alpha\_{0, +} f\_{0,
+}}{\alpha\_{0, +}} \geq \frac{\alpha\_{0, +} f\_{0, +}}{\alpha\_{1, +}} = \frac{\frac{f\_{1, +}}{n\_1}}{\frac{2f\_{2, +}}{(n\_1 - 1)f\_{1, +}}} = \frac{(n\_1 - 1)}{n\_1} \frac{f^2\_{1, +}}{2f\_{2, +}}
\end{equation}

Conversely, the frequency with which shared folk tales occur in collection 1 but not in
collection 2 (\\(f\_{+, 0}\\)), can be calculated with:

\begin{equation}
f\_{+, 0} = \frac{\alpha\_{ +, 0} f\_{ +,
0}}{\alpha\_{ +, 0}} \geq \frac{\alpha\_{ +, 0} f\_{ +, 0}}{\alpha\_{ +, 1}} = \frac{\frac{f\_{ +, 1}}{n\_2}}{\frac{2f\_{ +, 2}}{(n\_2 - 1)f\_{ +, 1}}} = \frac{(n\_2 - 1)}{n\_2} \frac{f^2\_{ +, 1}}{2f\_{ +, 2}}
\end{equation}

All that remains is computing \\(f\_{0, 0}\\), for which we may also assume that \\(\alpha\_{0, 0}
\leq \alpha\_{1, 1}\\). That leads to:

\begin{equation}
f\_{0, 0} = \frac{\alpha\_{0, 0} f\_{0, 0}}{\alpha\_{0, 0}} \geq \frac{\alpha\_{0, 0} f\_{0, 0}}{\alpha\_{1, 1}} = \frac{\frac{f\_{1, 1}}{n\_1, n\_2}}{\frac{4f\_{2, 2}}{(n\_1 - 1) (n\_2 - 1)f\_{1, 1}}} = \frac{(n\_1 - 1)}{n\_1} \frac{(n\_2 - 1)}{n\_2} \frac{f^2\_{1, 1}}{4f\_{2, 2}}
\end{equation}

We apply these formulas to our invented story collections to calculate the actual shared
repertoire. For \\(f\_{0, + }\\), we have \\(\frac{(n\_1 - 1)}{n\_1} \frac{f^2\_{1, +}}{2f\_{2, +}} =
\frac{22}{23} \frac{3^2}{4} = 2.2\\). And for \\(f\_{ +, 0}\\), we have that \\(\frac{(n\_2 -
1)}{n\_2} \frac{f^2\_{ +, 1}}{2f\_{ +, 2}} = \frac{20}{21} \frac{2^2}{4} = 1.4\\). To compute
\\(f\_{0, 0}\\), then, we compute \\(\frac{(n\_1 - 1)}{n\_1} \frac{(n\_2 - 1)}{n\_2} \frac{f^2\_{1,
1}}{4f\_{2, 2}} = \frac{22}{23} \frac{20}{21} \frac{1^2}{4} = 0.2\\). Finally we compute
\\(S\_{\text{shared}}\\):

\begin{equation}
S\_{\textrm{shared}} = 7 + 2.2 + 1.4 + 0.2 = 11
\end{equation}


## Shared Richness in the Dutch Folktale Database {#shared-richness-in-the-dutch-folktale-database}

Having applied Chao's shared richness estimator to a toy example, it would be interesting
to apply it to a real case. Below, I apply the estimator to the [Dutch Folktale Database](https://www.verhalenbank.nl), a
tremendous resource hosting over 45,000 folktales in Dutch and Dutch dialects. All the
stories in the database are annotated in great detail, with information on such things as
origin, time, speaker, motifs, keywords and much more (see <a href="#citeproc_bib_item_3">Meder et al. 2016</a> for a complete overview). In addition, most of
the stories are categorized according to established classification systems for folktales,
such as for example, the Aarne-Thompson-Uther (ATU) classification system. These
categories, or, story types, can be understood as the equivalent of species names in
biology. As such, we can make use of Unseen Species models to estimate the true story
richness (in a particular region, time, or collection).

In what follows, I would like to calculate the shared story richness based on the shared
richness estimator of Chao et al. (<a href="#citeproc_bib_item_2">2017</a>) described above. For
this purpose I use a subcorpus of the database, consisting of stories collected by Dam
Jaarsma. Folktale collector Jaarsma collected an enormous amount of stories (over 15,000)
in the Dutch province of Frysia and in particular in the eastern region called "de Friese
Wouden". Jaarsma recorded most of stories in two places: Drachten (\\(n\_1=1065\\)) and Harkema
(\\(n\_2=1448\\)). In total, \\(S\_{\text{obs}}=407\\) different story types were found in these two
places, of which \\(S\_{\text{shared, obs}}=136\\). were found in both places. Of course, both
subsets are samples from a likely larger population, and as such, there is a significant
chance that the two places shared more (knowledge about) stories than is apparent from the
recordings of Jaarsma. Below, I try to use the method described in
Chao et al. (<a href="#citeproc_bib_item_2">2017</a>) to provide a lower bound on the true number
of shared stories.

In order to simplify the data processing, I have put all the stories recorded by Dam
Jaarsma in Drachten and Harkema in a conveniently arranged table, containing on each row a
unique story type, and the number of attestations of each type in both places:

```python
import pandas as pd

df = pd.read_csv("data/dfd-jaarsma.csv")
df.head()
```

|   | drachten | harkema |
|---|----------|---------|
| 0 | 65       | 123     |
| 1 | 56       | 84      |
| 2 | 42       | 39      |
| 3 | 38       | 56      |
| 4 | 33       | 45      |

Using vectorized operations, it is relatively straightforward to implement the Shared
Richness Estimator. The function definition `estimate_shared_richness` below takes two
NumPy arrays or Pandas Series as input representing the counts of each uniquely found
species or story type. It then computes the estimated shared richness, as well as all
other statistics supporting this number:

```python
def estimate_shared_richness(s1, s2):
    n1, n2 = s1.sum(), s2.sum()

    # Compute f_{0, +}
    f1p = ((s1 == 1) & (s2 >= 1)).sum()
    f2p = ((s1 == 2) & (s2 >= 1)).sum()
    f0p = ((n1 - 1) / n1) * ((f1p ** 2) / (2 * f2p))

    # Compute f_{+, 0}
    fp1 = ((s1 >= 1) & (s2 == 1)).sum()
    fp2 = ((s1 >= 1) & (s2 == 2)).sum()
    fp0 = ((n2 - 1) / n2) * ((fp1 ** 2) / (2 * fp2))

    # Compute f_{0, 0}
    f11 = ((s1 == 1) & (s2 == 1)).sum()
    f22 = ((s1 == 2) & (s2 == 2)).sum()
    f00 = ((n1 - 1) / n1) * ((n2 - 1) / n2) * ((f11 ** 2) / (4 * f22))

    obs_shared = ((s1 > 0) & (s2 > 0)).sum()

    S = obs_shared + f0p + fp0 + f00
    return {
        "S": round(S),
        "observed shared": obs_shared,
        "f0+": round(f0p),
        "f+0": round(fp0),
        "f00": round(f00)
    }
```

We apply the function to our data to compute a lower-bound of the true number of shared
story types between Drachten and Harkema:

```python
est = estimate_shared_richness(df["harkema"], df["drachten"])
print(
    f"Observed nunber of shared story types: {est['observed shared']}\n"
    f"Estimated # shared story types: {est['S']}\n"
    f"Estimated # stories present but unseen in Harkema and present in Drachten: {est['f0+']}\n"
    f"Estimated # stories present in Harkema but unseen yet present in Drachten: {est['f+0']}\n"
    f"Estimated # stories unseen yet present in both Harkema and Drachten: {est['f00']}")
```

```text
Observed nunber of shared story types: 136
Estimated # shared story types: 244
Estimated # stories present but unseen in Harkema and present in Drachten: 48
Estimated # stories present in Harkema but unseen yet present in Drachten: 26
Estimated # stories unseen yet present in both Harkema and Drachten: 34
```

The collections of Jaarsma report a total of 136 story types present in both Drachten and
Harkema. Being a sample of the true population, this number is likely biased. The Shared
Richness estimator developed in Chao et al. (<a href="#citeproc_bib_item_2">2017</a>) corrects
this bias to a lower-bound of at least 244 story types shared between the two places.
Thus, at least \\(244 - 136 = 108\\) story types were likely present in both places even though
it was not recorded by Jaarsma. 48 of these story types were already seen in Drachten, but
not yet in Harkema, and 26 of them have been observed by Jaarsma in Harkema but not in
Drachten. Finally, a total of 34 story types were shared between both places, but neither
of them has a record of these types.

While this application to two folktale collections obviouslyy has only a limited scope, I
hope that it nevertheless does a good job of illustrating how the Shared Richness
estimator can help to estimate similarities and differences in cultural diversity. Due to
undersampling, biases can emerge in our perception of (shared) diversity. The Shared
richness estimator allows us to correct this bias and turn the observed shared richness
into a lower-bound of the true share diversity. Such a correction is of crucial importance
when we want to map out the cultural similarities and diferences between cultures in past
and present.

## References

<style>.csl-entry{text-indent: -1.5em; margin-left: 1.5em;}</style><div class="csl-bib-body">
  <div class="csl-entry"><a id="citeproc_bib_item_1"></a>Chao, Anne. 1984. “Nonparametric Estimation of the Number of Classes in a Population.” <i>Scandinavian Journal of Statistics</i> 11 (4): 265–70.</div>
  <div class="csl-entry"><a id="citeproc_bib_item_2"></a>Chao, Anne, Chiu Chun‐Huo, Robert K. Colwell, Luiz Fernando S. Magnago, Robin L. Chazdon, and Nicholas J. Gotelli. 2017. “Deciphering the Enigma of Undetected Species, Phylogenetic, and Functional Diversity Based on Good‐Turing Theory.” <i>Ecology</i> 98 (11): 2914–29. <a href="https://doi.org/10.1002/ecy.2000">https://doi.org/10.1002/ecy.2000</a>.</div>
  <div class="csl-entry"><a id="citeproc_bib_item_3"></a>Meder, Theo, Folgert Karsdorp, Dong Nguyen, Mariët Theune, Dolf Trieschnigg, and Iwe Muiser. 2016. “Automatic Enrichment and Classification of Folktales in the Dutch Folktale Database.” <i>Journal of American Folklore</i> 129 (511): 78–96.</div>
</div>