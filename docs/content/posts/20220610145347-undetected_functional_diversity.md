+++
title = "Undetected Functional Attribute Diversity"
author = ["Folgert Karsdorp"]
lastmod = 2022-06-23T12:31:36+02:00
tags = ["functional", "diversity", "FAD", "similarity", "bias", "sampling"]
draft = false
+++

## Functional Diversity {#functional-diversity}

In some previous notebooks (see, for example, [here]({{< relref "20220309103709-good_turing_as_an_unseen_species_model.md" >}}), [here]({{< relref "20220323122150-estimating_richness_under_sampling_without_replacement.md" >}}), and [here]({{< relref "20220316142536-two_assemblage_good_turing_estimation.md" >}})), I have discussed the
concept of cultural diversity and how methods from ecology can be used to estimate the
lower bound of unseen cultural diversity. In these notebooks, diversity was understood
simply as the number of unique items in a collection (e.g., species, narratives, pictures,
melodies, etc.), with all elements being considered as equidistant, or, in other words,
categorically different. Of course, it only rarely, if ever, happens that all items are
exactly equally different from each other. It is much more likely that some species are
more similar than others. And the same is true of cultural artefacts.

Imagine two populations "A" and "B", each consisting of 100 unique items. In terms of
categorical diversity, both populations have a diversity index of 100. We can, however,
also describe each item in terms of certain characteristics and properties, as shown
below, in which the items are represented as points in a two-dimensional space
(representing weight and height, for example):

{{< figure src="/ox-hugo/64ff902eee21dde59ec2258fba83d89afe17f853.png" >}}

Clearly, the items in population B can grouped into three clusters, whereas there does not
appear to be any clustering structure in population A, and as a whole the distance between
all individual items seems larger in population A than in B. In short, if we treat
diversity as a scalar phenomenon rather than a categorical one and thus incorporate
similarities between items in our definition of diversity, it is clear that population A
is more diverse than population B.

In ecology, several diversity measures have been developed that account for differences
between species and individuals. Most of these measures attempt to estimate functional
diversity in terms of the similarities between certain attributes. Based on these
attributes, then, we can compute pairwise distances between species using well-known
distance metrics (such as the "Euclidean distance" or "Jaccard dissimilarity index").
"Functional Attribute Diversity" (FAD) (<a href="#citeproc_bib_item_3">Walker, Kinzig, and Langridge 1999</a>), is an
example of such a measure that expresses functional diversity as the sum of the pairwise
distances between species:

\\[
\textrm{FAD} = \sum^S\_{i = 1} \sum^S\_{j = 1} d\_{ij}
\\]

Here, \\(S\\) represents the number of unique species, and \\(d\_{ij}\\) the distance between
species \\(i\\) and \\(j\\).


### Functional Diversity in the Dutch Folktale Database {#functional-diversity-in-the-dutch-folktale-database}

To get a feel for the FAD measure compared to other more common measures such as
"richness" (i.e., the number of unique elements), I apply the measure to a collection of
Dutch folktales from the [Dutch Folktale Database](https://www.verhalenbank.nl) (also see [Estimating Unseen Shared
Cultural Diversity]({{< relref "20220316142536-two_assemblage_good_turing_estimation.md" >}})). Many stories in the database have been categorised according to the
Aarne-Thompson-Uther index (<a href="#citeproc_bib_item_2">Uther 2004</a>), which is an
international index for categorising folktales. This index distinguishes numerous
different folktale types, that are defined on the basis of a set of motifs that often
occur in instantiations these types. Each story type in the index provides a short summary
of the most common plot developments along with a sequence of motifs from Thompson's
_Motif Index_. An example of such a description reads as follows:

> ATU 327A, **Hansel and Gretel**. A (poor) father (persuaded by the stepmother) abandons his
> children (a boy and a girl) in the forest [S321, S143]. Twice the children find their way
> back home, following scattered pebbles [R135]. On the third night, birds eat the scattered
> peas (bread-crumbs) [R135.1]. The children come upon a gingerbread house which belongs to
> a witch (ogress) [G401, F771.1.10, G412.1]. She takes them into her house. The boy is
> fattened [G82], while the girl must do house-work. The witch asks the boy to show his
> finger in order to test how fat he is [G82.1], but he shows her a bone(stick) [G82.1.1].
> When the witch wants to cook the boy, the sister deceives her by feigning ignorance and
> pushes her into the oven [G526, G512.3.2]. [. . . ] The children escape, carrying the
> witch’s treasure with them. Birds and beasts(angels) help them across water. They return
> home.

This example shows that the tale type ATU 327A contains twelve motifs, such as S321
_Destitute parents abandon children_, G401 _Children wander into ogre’s house_, G82.1
_Cannibal cuts captive’s finger to test fatness_, and G526 _Ogre deceived by feigned
ignorance of hero_.

Below, I will use use these motif sequences to compute the distances between stories, and
subsequently, the FAD of the folktale collection. We start with loading the data:

```python
dfd = pd.read_csv("data/dfd-motifs.csv")
dfd.head()
```

|   | count | storytype | motifs  | category     |
|---|-------|-----------|---------|--------------|
| 0 | 2     | ATU 1     | K371.1  | Animal Tales |
| 1 | 7     | ATU 2     | K1021   | Animal Tales |
| 2 | 1     | ATU 2A    | K1021.1 | Animal Tales |
| 3 | 2     | ATU 15    | K372    | Animal Tales |
| 4 | 1     | ATU 20C   | Z43.3   | Animal Tales |

An rudimentary yet important measure of diversity is the number of unique items or
"richness" in an assemblage or collection. The richness of the folktale collection is
simply the number of unique story types:

```python
dfd['storytype'].nunique()
```

```text
348
```

Similarly, we can compute this richness per folktale type category. The index defines
seven categories (Tales of Magic I and II are essentially one category) with the following
richness diversity:

```python
dfd["category"].value_counts()
```

Let us now compute the Functional Attribute Diversity of the folktale collection as a
whole and per category. As our distance measure, we will compute the Jaccard
dissimilarity index, which is a set-based dissimilarity measure:

```python
import itertools

def jaccard_distance(a, b):
    return 1 - len(a.intersection(b)) / len(a.union(b))

FAD = 0
motifs = dfd["motifs"].str.split(";").apply(set).values
for a, b in itertools.combinations(motifs, 2):
     d = jaccard_distance(a, b)
     assert d <= 1
     FAD += d * 2

print(f"FAD = {round(FAD)}")
```

```text
FAD = 131374
```

By themselves, these numbers are rather difficult to interpret. I'm not quite sure how to
interpret the value of 131374. It becomes more interesting and interpretable when we
compare the FAD of different categories. So, let's do that and compute the FAD of the
seven categories and compare their diversity measures:

```python
FADs = {}
for category in df["category"].unique():
    FAD = 0
    motifs = dfd.loc[dfd["category"] == category, "motifs"].str.split(";").apply(set).values
    for a, b in itertools.combinations(motifs, 2):
         d = jaccard_distance(a, b)
         FAD += d * 2
    FADs[category] = FAD

for category in sorted(FADs, key=FADs.get, reverse=True):
    print(category, round(FADs[category]))

```

```text
Anecdotes and Jokes 19736
Animal Tales 4966
Tales of Magic I 2548
Tales of Magic II 866
Realistic Tales 812
Religious Tales 450
Tales of the Stupid Ogre 240
Formula Tales 6
```

The FAD measure shows more pronounced differences between the categories. For example,
when "Anecdotes and Jokes" has about twice the number of unique stories than "Animal
Tales". This difference becomes even larger for the FAD, for which Anecdotes and Jokes has
a FAD that is \\(\frac{19736}{4966} \approx 4\\) times larger than that of Animal Tales.


## Unseen Functional Diversity {#unseen-functional-diversity}

The ATU index is a collection of all defined story types. However, in actual folktales
collections, we rarely encounter all of these types, as they often represent incomplete
samples, offering only limited insight into the potential diversity of folktales. The same
problem arises in ecology. When bioregistration campaigns are used to measure categorical
or functional diversity in a given area, there is always a chance that not all species and
therefore not thee full feature space had been observed. Can we somehow correct the bias
introduced by this by estimating how much _functional_ diversity is unobserved?

Chao et al. (<a href="#citeproc_bib_item_1">2017</a>) propose an estimator of undetected fuctional
diversity to correct for this bias. Their method is based on the Good-Turing framework I
discussed in [Demystifying Chao1 with Good-Turing]({{< relref "20220309103709-good_turing_as_an_unseen_species_model.md" >}}). The method estimates a lower-bound of
the unseen FAD in way comparable to the estimation of the number of unseen species
_shared_ between two assemlages (see [Estimating Unseen Shared Cultural Diversity]({{< relref "20220316142536-two_assemblage_good_turing_estimation.md" >}})).
(<a href="#citeproc_bib_item_1">Chao et al. 2017</a>) show that the a lower-bound of the true FAD
can be expressed as the sum of the following four terms:

\\[
\textrm{FAD} = \textrm{FAD}\_{\textrm{obs}} + \textrm{F}\_{0+} + \textrm{F}\_{+0} + \textrm{F}\_{00}.
\\]

Here, \\(\textrm{FAD}\_{\textrm{obs}}\\) represents the FAD of the observed sample. \\(F\_{0+}\\)
and \\(F\_{+0}\\) represent the unseen FAD of pairs of items in which one item is missing from
the sample. Finally, \\(F\_{00}\\) represents the FAD for items that are both missing from the
sample.

Just as I explained before in [Demystifying Chao1 with Good-Turing]({{< relref "20220309103709-good_turing_as_an_unseen_species_model.md" >}}) and [Estimating Unseen
Shared Cultural Diversity]({{< relref "20220316142536-two_assemblage_good_turing_estimation.md" >}}), we aim to compute the mean distance \\(\theta\_{rr}\\) of any two
pair of items (or species) that occur exactly \\(r\\) times. To do that,
(<a href="#citeproc_bib_item_1">Chao et al. 2017</a>) propose the estimator \\(\theta\_{rr}\\):

\\[
\hat{\theta}\_{rr} = \frac{(r + 1)^2 F\_{r + 1, r + 1}}{(n - 2r)(n - 2r - 1)F\_{rr}}, r = 0, 1, 2, \ldots
\\]

Unfortunately, we do not know \\(F\_{00}\\) nor do we know about \\(\theta\_{00}\\). We do know,
however, that \\(\frac{F\_{11}}{n}\\) is a good estimate of the product of \\(\theta\_{00}\\) and
\\(F\_{00}\\). And like with the Good-Turing derivation of Chao1, it should intuitively hold
that \\(\theta\_{00} \leq \theta\_{11}\\). And if that is the case we can compute a lower bound
for \\(F\_{00}\\) with:

\begin{align\*}
F\_{00} = \frac{\theta\_{00} F\_{00}}{\theta\_{00}} \geq \frac{\theta\_{00} F\_{00}}{\theta\_{11}} & = \frac{\frac{F\_{11}}{n(n - 1)}}{\frac{4F\_{22}}{(n - 2)(n - 3)F\_{11}}} \\\\
 & = \frac{(n - 2)}{n} \frac{(n - 3)}{(n - 1)} \frac{F^2\_{11}}{4F\_{22}}
\end{align\*}

For \\(F\_{0+}\\) and \\(F\_{+0}\\), we apply the same strategy as explained in [Estimating Unseen
Shared Cultural Diversity]({{< relref "20220316142536-two_assemblage_good_turing_estimation.md" >}}), which gives us the following expression to compute a
lower-bound for the true functional diversity in an assemblage:

\\[
\textrm{FAD}\_{\textrm{Chao1}} = \textrm{FAD}\_{\textrm{obs}} + \frac{(n - 1)}{n} \frac{F^2\_{1+}}{2F\_{2+}}  + \frac{(n - 1)}{n} \frac{F^2\_{+1}}{2F\_{+2}} + \frac{(n - 2)}{n} \frac{(n - 3)}{(n - 1)} \frac{F^2\_{11}}{4F\_{22}}
\\]


### Unseen Functional Diversity in the Dutch Folktale Database {#unseen-functional-diversity-in-the-dutch-folktale-database}

To conclude this notebook, let us apply the \\(\textrm{FAD}\_{\textrm{Chao1}}\\) to the
folktale database to estimate its unseen functional diversity. We start by implementing
the FAD estimator in the following lines of code:

```python
def compute_fad_chao1(dm, counts):

    FAD_obs = np.sum(dm[counts > 0][:, counts > 0])
    mean_distance = np.mean(dm)
    F1p = np.sum(dm[counts == 1][:, counts >= 1])
    Fp1 = np.sum(dm[counts >= 1][:, counts == 1])
    F2p = np.sum(dm[counts == 2][:, counts >= 1])
    F2p = max(F2p, mean_distance)
    Fp2 = np.sum(dm[counts >= 1][:, counts == 2])
    Fp2 = max(Fp2, mean_distance)
    F11 = np.sum(dm[counts == 1][:, counts == 1])
    F22 = np.sum(dm[counts == 2][:, counts == 2])
    F22 = max(F22, mean_distance)
    assert round(F1p) == round(Fp1), (F1p, Fp1)
    assert round(F2p) == round(Fp2), (F2p, Fp2)
    n = sum(counts)
    k = (n - 1) / n
    F0p = k * (F1p ** 2) / (2 * F2p)
    Fp0 = k * (Fp1 ** 2) / (2 * Fp2)
    F00 = ((n - 2) / n) * ((n - 3) / (n - 1)) * ((F11 ** 2) / (4 * F22))
    return {
        "obs": round(FAD_obs),
        "F0+": round(F0p),
        "F+0": round(Fp0),
        "F00": round(F00),
        "FAD": round(FAD_obs + F0p + Fp0 + F00)
    }
```

Next, we implement the following wrapper function, which makes it slightly more convenient
to compute the FAD for different folktale categories:

```python
def estimate_fad(df, category=None):
    if category is not None:
        df = df.loc[df["category"] == category]
    counts = df["count"].values
    motifs = df["motifs"].str.split(";").apply(set).values
    V = counts.shape[0]
    dm = np.zeros((V, V))
    for i in range(V):
        for j in range(V):
            dm[i, j] = dm[j, i] = jaccard_distance(motifs[i], motifs[j])
    return compute_fad_chao1(dm, counts)
```

Let us first apply the estimator to the complete collection. Below, I compute the FAD as
well as the ratio between the observed FAD and the estimated lower-bound of the true FAD:

```python
fad = estimate_fad(dfd)
print(f"Observed FAD: {fad['obs']}, Estimated FAD: {fad['FAD']}, FAD coverage: {fad['obs'] / fad['FAD']:.2f}")
```

```text
Observed FAD: 131374, Estimated FAD: 287015, FAD coverage: 0.46
```

We estimate a FAD of 287015, of which 46% is already available in the folktale database.
This means that still a considerate amount of variation is not yet part of the database.
It is also to be expected that the FAD coverage varies by story category. Therefore, I
calculate the FAD again below for each folktale category, in order to identify any
differences:

```python
for category in dfd["category"].unique():
    fad = estimate_fad(dfd, category)
    print(category, f"coverage: {fad['obs'] / fad['FAD']:.2f}")
```

```text
Animal Tales coverage: 0.39
Tales of Magic I coverage: 0.24
Tales of Magic II coverage: 0.46
Religious Tales coverage: 0.54
Realistic Tales coverage: 0.43
Tales of the Stupid Ogre coverage: 0.36
Anecdotes and Jokes coverage: 0.58
Formula Tales coverage: 0.50
```

These number show that the functional diversity in "Anecdotes and Jokes" is relatively
well covered by the folktale database, while "Tales of Magic I" (24%) and "Animal Tales"
(39%) have a much lower diversity coverage.

## References

<style>.csl-entry{text-indent: -1.5em; margin-left: 1.5em;}</style><div class="csl-bib-body">
  <div class="csl-entry"><a id="citeproc_bib_item_1"></a>Chao, Anne, Chiu Chun‐Huo, Robert K. Colwell, Luiz Fernando S. Magnago, Robin L. Chazdon, and Nicholas J. Gotelli. 2017. “Deciphering the Enigma of Undetected Species, Phylogenetic, and Functional Diversity Based on Good‐Turing Theory.” <i>Ecology</i> 98 (11): 2914–29. <a href="https://doi.org/10.1002/ecy.2000">https://doi.org/10.1002/ecy.2000</a>.</div>
  <div class="csl-entry"><a id="citeproc_bib_item_2"></a>Uther, Hans-Jörg. 2004. <i>He Types of International Folktales: A Classification and Bibliography, Based on the System of Antti Aarne and Stith Thompson</i>. 284-286. Suomalainen Tiedeakatemia, Academia Scientiarum Fennica.</div>
  <div class="csl-entry"><a id="citeproc_bib_item_3"></a>Walker, Brian, Ann Kinzig, and Jenny Langridge. 1999. “Plant Attribute Diversity, Resilience, and Ecosystem Function: The Nature and Significance of Dominant and Minor Species.” <i>Ecosystems</i> 2: 95–113.</div>
</div>