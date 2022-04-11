+++
title = "Demystifying Chao1 with Good-Turing"
author = ["Folgert Karsdorp"]
date = 2022-03-15T00:00:00+01:00
tags = ["chao1", "turing", "richness", "loss", "diversity"]
draft = false
+++

To estimate the "[biodiversity]({{< relref "20210916161105-biodiversity.md" >}})" in a particular area -- or, in other words, the number of
unique species living in a given environment -- ecologists usually have no other option
than to rely on incomplete samples. For all sorts of practical reasons, it is virtually
impossible to spot all species that are actually present in an area, and hence certain
species will be missing in the counts. Consequently, an important research question in
ecology is how to reliably estimate the resulting "bias" between the number of species
that was observerd and the true number of unique species in an area.

Of course, scientists are not only confronted with the possibility of 'unseen entities'
when counting animal species. In astronomy, too, for example, researchers are interested
in counting the number of unseen stars. In linguistics, researchers have also attempted to
estimate the total size of a language's vocabulary using only samples of that language.
And in computer science, researchers have tried to estimate the number of undetected
"bugs" in software code. In all these applications, the same problem arises: there are
more unique stars, words, or bugs than we observe in our samples, and therefore we cannot
base our judgement about the diversity of the phenomenon we are investigating directly on
our observed counts. That would give a biased -- or worse, an i≈mpoverished -- picture of
the true state of affairs. Hence, the statistical methods that have been developed in
ecology to combat such biases are very useful in a wide variety of domains.

In the cultural domain, too, there have been attempts to correct biases in our
observations with statistical methods. A good example is our study into the loss of
European medieval literature Kestemont et al. (<a href="#citeproc_bib_item_4">2022</a>), which was
recently published in the journal _Science_. In that study, we apply a specific "[Unseen
Species]({{< relref "20220228153558-unseen_species_model.md" >}})" model to medieval stories. Medieval stories (such as the legends about "King
Arthur" or the stories surrounding the emperor Charlemagne) were often recorded several
times in manuscripts. But not all of these copies or manuscripts have been preserved --
and, therefore it is possible that the stories they contained have not been preserved
either. Our aim, then, was to use an "Unseen Species" model to estimate how many
"documents" (the manuscripts) and how many "works" (the stories) and been lost. The model
we used is called the "[Chao1 estimator]({{< relref "20220228153400-chao1_estimator.md" >}})", named after its discoverer, Anne Chao, co-author
of our study.

We are often asked how Chao1 can make these estimates of unseen things. But that question
is not so easy to answer, because the exact motivation and derivation of Chao1 is not
particularly intuitive (neither for ecologists, nor for cultural scholars). But
fortunately, as Chao et al. (<a href="#citeproc_bib_item_2">2017</a>) have shown, Chao1 can also
be derived in a slightly different and much more intuitive way. This derivation is based
on the groundbreaking work of the famous computer scientist Alan Turing, which he did at
Bletchley Park during World War II. Below, guided by
Chao et al. (<a href="#citeproc_bib_item_2">2017</a>), I will try to demystify Chao1 in terms of
Turing's work. I hope that this will help people unfamiliar with the method to understand
exactly how it works, and, perhaps more importantly, how (not) to interpret the calculated
values.

Imagine that we discovered a snippet from an unknown book. The snippet has a total of 18
words on it, consisting of 6 unique words with the following frequencies:

| word  | frequency |
|-------|-----------|
| the   | 10        |
| for   | 3         |
| woman | 2         |
| park  | 1         |
| snake | 1         |
| book  | 1         |

The total number of words as well as the number of unique words in this scenario are of
importance. Based on this snippet, where the total frequency \\(n\\) is 18, we would like to
estimate how many unique words there were in the original, unaffected book. The snippet
thus provides us with a "sample" or a subset of the vocabulary in the original work. The
complete vocabulary can be indicated by the symbol \\(V\\), and the observed vocabulary in the
snippet is then called \\(V\_{\textrm{obs}}\\). The aim of unseen species models, such as
Chao1, is then to estimate the true number of unique words \\(V\\) on the basis of the
observed unique vocabulary items (\\(V\_{\textrm{obs}}\\)) and their frequencies. To this end,
we need to know about how many words have a frequency of 0 in our snippet -- or, in other
words, how many unique words are missing from our sample. (Note that we assume that the
snippet was generated under a sampling process with replacement. This is an assumption of
Chao1, which not always holds for cultural data, and is completely unrealistic when
working with snippets of text. See [Estimating Richness under Sampling without Replacement]({{< relref "20220323122150-estimating_richness_under_sampling_without_replacement.md" >}})
for a more elaborate discussion of sampling strategies in relation to Chao1.) If we refer
to that number as \\(f\_0\\), we can calculate the total number of words \\(V\\) by adding \\(f\_0\\) to
the number of unique observed words \\(V\_{\textrm{obs}}\\):

\begin{equation}
V = f\_0 + V\_{\textrm{obs}} = f\_0 + 6
\end{equation}

The key question is, of course, how to calculate \\(f\_0\\). If we assume that our snippet
represents the complete work, it is easy to calculate the probability of a word such as
_book_. Let's illustrate that with the word _book_: if the snippet represents the whole
work, we can simply divide the frequecy of _book_ by the total number of words:
\\(\frac{1}{18} = 0.056\\). Similarly, we can calculate the probability that a word has a
frequency \\(r\\), for example \\(r = 1\\) (words that occur only once, i.e. singletons). There
are 3 words in total with a frequency of \\(r = 1\\), which we write down as \\(f\_1 = 3\\). The
probability that a word has a frequency of 1 is then equal to \\(f\_1\\) divided by the total
number of words in a book: \\(\frac{f\_1}{n} = \frac{3}{18} = 0.167\\). And the average
relative frequency of words with \\(r = 1\\) is then equal to: \\(\alpha\_1 = \frac{1}{18} f\_1 /
f\_1 = \frac{1}{18}\\). But of course the 18-word snippet is just a snippet, and not a whole
work. Because the snippet is not complete, there is a considerable chance that we have not
yet seen certain words from the original, complete book. Therefore, in our probability
calculations, we must take into account the possibility that we will come across a range
of unseen words. But how?

Well, let's suppose that we find another snippet of the same manuscript containing one new
word. What is then the probability that this new word is another instance of the already
observed _book_? Note that if this new word is indeed the word _book_, then _book_ no
longer occurs once but twice. In other words, _book_ then no longer has the frequency \\(r =
1\\) but \\(r = 1 + 1\\). To account for such situations, Turing and his student Good proposed
not to estimate the probability of a word occurring \\(r\\) times with \\(\frac{r}{n}\\) but with
an adjusted count \\(\frac{r^\*}{n}\\) (note the asterisk). This modified count states that the
probability that we have seen a new words \\(r + 1\\) times is equal to the probability of the
words we have already seen \\(r + 1\\) times. This can be formulated as: \\(r^\*= (r + 1) f\_{r +
1} / f\_r\\). The average relative frequency of words that occur \\(r\\) times can then be
computed with:

\begin{equation}
\alpha\_r = \frac{r^\*}{n} = \frac{(r + 1)}{n} \frac{f\_{r + 1}}{f\_r}.
\end{equation}

To illustrate: the word _book_ occurs once in the snippet and there are two other words
that occur once. This, as stated before, gives \\(f\_1 = 3\\). There is one word with a
frequency of 2, so \\(f\_2 = 1\\). If we plug these number into the formula above, we can
calculate the probability that the new word is the word _book_: \\(\frac{(1 + 1)}{18}
\frac{1}{3} = 0.037\\). It is important to note that this new probability is smaller than
the relative frequency of _book_ in the snippet that we caculated earlier (\\(1 / 18 =
0.056\\)). This is because the Good-Turing counts act as a kind of frequency correction,
ensuring that we leave some probability space for any unseen words -- and hence the
corrected probability is smaller.

Before we continue with showing how to use this all for computing \\(f\_0\\), it is important
to make a small modification to the original Good-Turing formula. In a follow-up study,
Chiu et al. (<a href="#citeproc_bib_item_3">2014</a>) show that the Good-Turing estimate can be
made even more precise with:

\begin{equation}
\alpha\_r = \frac{(r + 1) f\_{r + 1}}{(n - r) f\_r}.
\end{equation}

For unseen words, we cannot calculate the average relative frequency \\(\alpha\_0\\), because
we have no knowledge of \\(f\_0\\): \\(\frac{f\_1}{n f\_0=?}\\). What we _are_ able to calculate,
however, is the estimated proportion of the total number of words that are unseen. That
proportion is equal to the product of the average relative frequency of unseen words
\\(\alpha\_0\\) and the number of unseen words \\(f\_0\\): \\(\alpha\_0 f\_0\\). This product can be
approximated by dividing the number of words that occur once by the total number of words:
\\(\frac{f\_1}{n}\\). Essentialy, we strip \\(f\_0\\) from the formula.

We are now almost in the position to grasp how to estimate \\(f\_0\\). As I mentioned, we can
estimate the product \\(\alpha\_0 f\_0\\) with \\(\frac{f\_1}{n}\\). A simple way to compute \\(f\_0\\)
would be to divide this product by \\(\alpha\_0\\). But unfortunately, we do not know the
average relative frequency of unseen words. We therefore have to work with what we do
know, for example that the average relative frequency of unseen words is probably lower
that that of words occuring once. That is to say: \\(\alpha\_0 \leq \alpha\_1\\). It then
follows that \\(\frac{\alpha\_0 f\_0}{\alpha\_0}\\) must be _at least_ equal to or greater than
\\(\frac{\alpha\_0 f\_0}{\alpha\_1}\\):

\begin{equation}
f\_0 = \frac{\alpha\_0 f\_0}{\alpha\_0} \geq \frac{\alpha\_0 f\_0}{\alpha\_1}.
\end{equation}

We can rewrite that last formula (\\(\frac{\alpha\_0 f\_0}{\alpha\_1}\\)) to the calculable
\\(\frac{f1}{n} / \frac{2f\_2}{(n - 1)f\_1}\\). If we apply this formula to our snippet, the
estimate is that we have not yet seen at least \\(\frac{3}{18} / \frac{2 \* 1}{(18 - 1) \* 3}
\approx 4\\) words yet. It is important to emphasize again that \\(\frac{\alpha\_0
f\_0}{\alpha\_0}\\) is _at least_ equal to or greater than \\(\frac{\alpha\_0 f\_0}{\alpha\_1}\\),
and that our estimate of \\(f\_0\\) is thus a _lower bound_ on the true number of unique words.
This estimate, based on Good-Turing counts, gives the same lower bound for \\(f\_0\\) that Anne
Chao has proven extensively (<a href="#citeproc_bib_item_1">Chao 1984</a>), and can be
calculated with her well-known unseen species model, Chao1, which can be formulated as:
\\(\frac{(n - 1)}{n} \frac{f\_1^2}{2 f\_2}\\).

The Chao1 model thus provides a lower bound of the ecological, or cultural, richness in a
given area. Using the Good-Turing perspective, we can now also clarify when the lower
bound is in fact an accurate estimate of the true richness. The reasoning is as follows:
if the average frequency of unseen words (\\(\alpha\_0\\)) is approximately equal to that of
words that occur once (\\(\alpha\_1\\)), then there is no longer any difference between
\\(\frac{\alpha\_0 f\_0}{\alpha\_0}\\) and \\(\frac{\alpha\_0 f\_0}{\alpha\_1}\\), and thus the method
can provide an unbiased estimate of the number of unique species, or say, cultural
artefacts, such as medieval stories that exist in a given area -- including the ones that
have not been seen.


## References {#references}

## References

<style>.csl-entry{text-indent: -1.5em; margin-left: 1.5em;}</style><div class="csl-bib-body">
  <div class="csl-entry"><a id="citeproc_bib_item_1"></a>Chao, Anne. 1984. “Nonparametric Estimation of the Number of Classes in a Population.” <i>Scandinavian Journal of Statistics</i> 11 (4): 265–70.</div>
  <div class="csl-entry"><a id="citeproc_bib_item_2"></a>Chao, Anne, Chiu Chun‐Huo, Robert K. Colwell, Luiz Fernando S. Magnago, Robin L. Chazdon, and Nicholas J. Gotelli. 2017. “Deciphering the Enigma of Undetected Species, Phylogenetic, and Functional Diversity Based on Good‐Turing Theory.” <i>Ecology</i> 98 (11): 2914–29. <a href="https://doi.org/10.1002/ecy.2000">https://doi.org/10.1002/ecy.2000</a>.</div>
  <div class="csl-entry"><a id="citeproc_bib_item_3"></a>Chiu, Chun-Huo, Yi-Ting Wang, Bruno A. Walther, and Anne Chao. 2014. “An Improved Nonparametric Lower Bound of Species Richness via a Modified Good-Turing Frequency Formula: An Improved Nonparametric Lower Bound of Species Richness.” <i>Biometrics</i> 70 (3): 671–82. <a href="https://doi.org/10.1111/biom.12200">https://doi.org/10.1111/biom.12200</a>.</div>
  <div class="csl-entry"><a id="citeproc_bib_item_4"></a>Kestemont, Mike, Folgert Karsdorp, Elisabeth de Bruijn, Matthew Driscoll, Katarzyna A. Kapitan, Pádraig Ó Macháin, Daniel Sawyer, Remco Sleiderink, and Anne Chao. 2022. “Forgotten Books: The Application of Unseen Species Models to the Survival of Culture.” <i>Science</i> 375 (6582): 765–69. <a href="https://doi.org/10.1126/science.abl7655">https://doi.org/10.1126/science.abl7655</a>.</div>
</div>