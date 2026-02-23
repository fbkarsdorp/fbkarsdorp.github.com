+++
title = "Functional Diversity as a Generalization of Lexical Diversity"
author = ["Folgert Karsdorp"]
lastmod = 2022-12-15T16:58:56+01:00
tags = ["diversity", "richness", "semantics", "hill-numbers", "similarity"]
draft = false
+++

This is a transcript of a [talk](https://youtu.be/z8OCu9tB-jY) given at the [CHR2022](https://2022.computational-humanities-research.org) conference. For the corresponding
paper, see <https://ceur-ws.org/Vol-3290/short_paper2780.pdf>.

<iframe width="560" height="315" src="https://www.youtube.com/embed/z8OCu9tB-jY" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>


## Lexical diversity {#lexical-diversity}

One of the simplest and most basic corpus statistics is the number of unique words in a
text. This number gives us a quick and straightforward picture of the lexical diversity of
a text. Lexical diversity is typically implemented by measuring the number of unique
letter combinations. This is of course very easy to do, but it doesn’t necessarily
describe the lexical richness of a text adequately. This becomes clear when we compare the
following few sets of words:

-   cat, progesterone, remember, blue
-   cat, dog, blue, red
-   cat, dog, bird, rabbit neighbors
-   naighbors, neigbors, neighbours

If we define a unique word as a unique orthographic combination of letters, then all these
sets have a lexical diversity of 4. That doesn’t seem to match our intuition. The first
set seems much more diverse semantically than the third set, let alone the last set with
only historical spelling variants of the same word.


## Ecological diversity {#ecological-diversity}

In our paper, we investigate the application of a new measure of lexical diversity, which
takes the semantic differences between words into account. This measure is called
“Functional Diversity”, which we borrow from the field of ecology where a similar problem
exists (also see [Undetected Functional Attribute Diversity]({{< relref "20220610145347-undetected_functional_diversity.md" >}})). Compare for example these two
ponds. In both ponds, we find 4 unique animal species. As such, we could conclude that the
biodiversity is the same in both ponds. But intuitively, that categorical measure of
diversity doesn’t seem right: the pond on the right looks much more diverse than the pond
on the left. Functional diversity recognizes this intuition by including the similarities
and differences in species’ traits.

{{< figure src="/ox-hugo/2022-12-15_11-14-44_ponds2.png" >}}


## Functional diversity {#functional-diversity}

The specific implementation of functional diversity that we apply was originally developed
by the biostatistician Anne Chao and her colleagues
(<a href="#citeproc_bib_item_1">Chao et al. 2019</a>; <a href="#citeproc_bib_item_2">Chiu and Chao 2014</a>). In this framework, we group together all word
types with a distance less than a certain threshold. (Let’s call that threshold \\(\tau\\) for
convenience.) For example, take the words apple and pear, which are represented here as
circles. The size represents how many tokens we have of each word. The distance between
these two words is measured to be 0.4. If we set the threshold \\(\tau\\) to a value that is
equal or smaller than this 0.4, then each word type forms its own functional group. So,
one group for apple, and one for pear – which yields a total functional diversity of 2.

<video autoplay loop playsinline><source src="/videos/ProportionalContribution_0000.mp4" type="video/mp4"></video>

Beyond this first level, where \\(\tau\\) is set to the minimal distance, we start allowing words
to form groups. For example, if we set the distance threshold to 0.6, apple and pear are
merged together. Yet, they don’t form a single functional group, because they only overlap
partially, and not completely: in the framework we employ, each type can contribute to one
or more functional groups in a way that is proportional to their frequency. To know the
size of a functional group, then, we take all tokens of a word type, for instance pear,
plus a fraction of the tokens of any other word type, like apple, that is functionally
indistinctive of pear.

<video autoplay loop playsinline><source src="/videos/ProportionalContribution_0001.mp4" type="video/mp4"></video>

The higher the threshold for \\(\tau\\), the more word types are merged into functional
groups. Here we add the word _computer_, which has a distance of 0.8 to _apple_ and 1
_pear_. With \\(\tau\\) set to 0.6, _computer_ still forms its own functional group, but with
a value of 0.8 or higher, it is partially merged with _apple_. Note that this also updates
the composition of the apple functional group.

<video autoplay loop playsinline><source src="/videos/ProportionalContribution_0002.mp4" type="video/mp4"></video>

We can continue increasing the threshold value, until eventually all words will belong to
the same functional group. In other words, this method enables us to not just talk about
diversity at one level, but at a continuum of levels.

<video autoplay loop playsinline><source src="/videos/ProportionalContribution_0003.mp4" type="video/mp4"></video>


## Representation of words and their distances {#representation-of-words-and-their-distances}

The computation of functional diversity requires a way of measuring similarity between
words and specifically we focus on lexical semantics. Traditional lexicon-based methods
like WordNet are discouraged whenever the goal is to compute the similarity in an open-set
scenario, where full coverage would be hard to obtain. A second option is to compute
similarities in a word embedding space such as the one obtained through an algorithm like
word2vec. The problem we faced here is that the quality of embeddings for infrequent words
is poor, considering that the corresponding vectors have been updated very sparsely during
training. For this study, we focused on contextualized word embeddings extracted from a
Large Language Model like BERT. The intuition is that even in the case of low frequent
words (including, for example, misspelled words) a model like BERT can still rely on the
sentential context in order to infer the semantics of a word. In terms of models, we
relied on [MacBERTh](https://macberth.netlify.app/), which is a historical language model for English following the
architecture and parameterization of BERT base uncased (<a href="#citeproc_bib_item_3">Manjavacas and Fonteyn 2022</a>).


## Results {#results}


### Functional diversity is affected less by increased orthographic variation {#functional-diversity-is-affected-less-by-increased-orthographic-variation}

Our analyses and results led to two important insights. First, we found that diversity at
the level of functional groups is affected less by non-meaningful variation such as OCR
errors and orthographic variation, which are very common in historical corpora. To learn
more about these results, we refer to Section 4.1 in the paper.

{{< figure src="/ox-hugo/2022-12-15_12-53-43_scramble-impact-diversity.png" >}}


### Functional diversity is a theoretically relevant complement to lexical diversity {#functional-diversity-is-a-theoretically-relevant-complement-to-lexical-diversity}

We also found that approaching the ‘vocabulary richness’ of a text through the lens of the
attribute diversity framework allowed us to identify text pairs that had approximately the
same number of unique word types, but a diverging number of functional groups. This
indicates that, while the size of the texts’ vocabularies may be the same, one text covers
a broader semantic range with its vocabulary. A nice example to illustrate this is the
pairing of this fiction text with an advertisement, where the advertisement has fewer
functional groups at \\(d\_\textrm{mean}\\) than the fiction text.

{{< figure src="/ox-hugo/2022-12-15_12-53-23_adv_fict_comp.png" >}}

So why is that the case?
Well, because advertisements often present a list of closely related services and/or
goods, and hence, while they may use a large number of unique words, they cover less
functional-semantic ground than for instance fiction texts.


## Future work {#future-work}

Of course, this short paper was just an exploration of an idea, and more work has to be
done. In fact, there are a few directions in which all this could go. First, We worked
with MacBERTh, but there are other ways of implementing functional similarity. For
instance, MacBERTh produces token embeddings, so to obtain a single representation per
unique string of characters we work with an averaged representation. This may not be
ideal, and perhaps there are other ways to approach this – which is something we are
looking into.

But also beyond the technical side of things, we see concrete case studies to apply this
method to. Naturally, this can be applied to studies in stylistics. Does, for instance, an
author’s vocabulary become more diverse as they age? And if so, does it become more evenly
spread across more semantic fields, or does it rather just become more detailed within the
same number of fields? Or can we characterize literature for children or second language
learners, which is often defined at different reading levels, in terms of categorical as
well as functional lexical diversity?

## References

<style>.csl-entry{text-indent: -1.5em; margin-left: 1.5em;}</style><div class="csl-bib-body">
  <div class="csl-entry"><a id="citeproc_bib_item_1"></a>Chao, Anne, Chiu Chun‐Huo, Sébastien Villéger, Sun I‐Fang, Simon Thorn, Lin Yi‐Ching, Chiang Jyh‐Min, and William B. Sherwin. 2019. “An Attribute‐Diversity Approach to Functional Diversity, Functional Beta Diversity, and Related (Dis)Similarity Measures.” <i>Ecological Monographs</i> 89 (2). <a href="https://doi.org/10.1002/ecm.1343">https://doi.org/10.1002/ecm.1343</a>.</div>
  <div class="csl-entry"><a id="citeproc_bib_item_2"></a>Chiu, Chun-Huo, and Anne Chao. 2014. “Distance-Based Functional Diversity Measures and Their Decomposition: A Framework Based on Hill Numbers.” Edited by Francesco de Bello. <i>Plos One</i> 9 (7): e100014. <a href="https://doi.org/10.1371/journal.pone.0100014">https://doi.org/10.1371/journal.pone.0100014</a>.</div>
  <div class="csl-entry"><a id="citeproc_bib_item_3"></a>Manjavacas, Enrique, and Lauren Fonteyn. 2022. “Adapting Vs. Pre-Training Language Models for Historical Languages.” <i>Journal of Data Mining &#38; Digital Humanities</i>. <a href="https://doi.org/10.46298/jdmdh.9152">https://doi.org/10.46298/jdmdh.9152</a>.</div>
</div>
