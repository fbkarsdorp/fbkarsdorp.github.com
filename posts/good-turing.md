---
title: Demystifying Chao1 with Good-Turing
date: 2022-03-14
snippet: What do these Unseen Species estimates actually mean?
---

To estimate the "biodiversity" in a particular area – or, in other
words, the number of unique species living in a given environment –
ecologists usually have no other option than to rely on incomplete
samples. For all sorts of practical reasons, it is virtually impossible
to spot all species that are actually present in an area, and hence
certain species will be missing in the counts. Consequently, an
important research question in ecology is how to reliably estimate the
resulting "bias" between the number of species that was observerd and
the true number of unique species in an area.

Of course, scientists are not only confronted with the possibility of
'unseen entities' when counting animal species. In astronomy, too, for
example, researchers are interested in counting the number of unseen
stars. In linguistics, researchers have also attempted to estimate the
total size of a language's vocabulary using only samples of that
language. And in computer science, researchers have tried to estimate
the number of undetected "bugs" in software code. In all these
applications, the same problem arsises: there are more unique stars,
words, or bugs than we observe in our samples, and therefore we cannot
base our judgement about the diversity of the phenomenon we are
investigating directly on our observed counts. That would give a biased
– or worse, an impoverished – picture of the true state of affairs.
Hence, the statistical methods that have been developed in ecology to
combat such biases are very useful in a wide variety of domains.

In the cultural domain, too, there have been attempts to correct biases
in our observations with statistical methods. A good example is our
study into the loss of European medieval literature (Kestemont, Mike and
Karsdorp, Folgert and {de Bruijn}, Elisabeth and Driscoll, Matthew and
Kapitan, Katarzyna A. and Ó Macháin, Pádraig and Sawyer, Daniel and
Sleiderink, Remco and Chao, Anne, 2022), which was recently published in
the journal *Science*. In that study, we apply a specific "Unseen
Species" model to medieval stories. Medieval stories (such as the
legends about "King Arthur" or the stories surrounding the emperor
Charlemagne) were often recorded several times in manuscripts. But not
all of these copies or manuscripts have been preserved – and, therefore
it is possible that the stories they contained have not been preserved
either. Our aim, then, was to use an "Unseen Species" model to estimate
how many "documents" (the manuscripts) and how many "works" (the
stories) and been lost. The model we used is called the "Chao1
estimator", named after its discoverer, Anne Chao, co-author of our
study.

We are often asked how Chao1 can make these estimates of unseen things.
But that question is not so easy to answer, because the exact motivation
and derivation of Chao1 is not particularly intuitive (neither for
ecologists, nor for cultural scholars). But fortunately, as Chao, Anne
and Chiu, Chun‐Huo and Colwell, Robert K. and Magnago, Luiz Fernando S.
and Chazdon, Robin L. and Gotelli, Nicholas J., 2017 have shown, Chao1
can also be derived in a slightly different and much more intuitive way.
This derivation is based on the groundbreaking work of the famous
computer scientist Alan Turing, which he did at Bletchley Park during
World War II. Below, guided by Chao, Anne and Chiu, Chun‐Huo and
Colwell, Robert K. and Magnago, Luiz Fernando S. and Chazdon, Robin L.
and Gotelli, Nicholas J., 2017, I will try to demystify Chao1 in terms
of Turing's work. I hope that this will help people unfamiliar with the
method to understand exactly how it works, and, perhaps more
importantly, how (not) to interpret the calculated values.

Imagine that we discovered a snippet from an unknown book. The snippet
has a total of 18 words on it, consisting of 6 unique words with the
following frequencies:

| word  | frequency |
|-------|-----------|
| the   | 10        |
| for   | 3         |
| woman | 2         |
| park  | 1         |
| snake | 1         |
| book  | 1         |

The total number of words as well as the number of unique words in this
scenario are of importance. Based on this snippet, where the total
frequency *n* is 18, we would like to estimate how many unique words
there were in the original, unaffected book. The snippet thus provides
us with a "sample" or a subset of the vocabulary in the original work.
The complete vocabulary can be indicated by the symbol *V*, and the
observed vocabulary in the snippet is then called *V*<sub>obs</sub>. The
aim of unseen species models, such as Chao1, is then to estimate the
true number of unique words *V* on the basis of the observed unique
vocabulary items (*V*<sub>obs</sub>) and their frequencies. To this end,
we need to know about how many words have a frequency of 0 in our
snippet – or, in other words, how many unique words are missing from our
sample. If we refer to that number as *f*<sub>0</sub>, we can calculate
the total number of words *V* by adding *f*<sub>0</sub> to the number of
unique observed words *V*<sub>obs</sub>:

*V* = *f*<sub>0</sub> + *V*<sub>obs</sub> = *f*<sub>0</sub> + 6   (1)

The key question is, of course, how to calculate *f*<sub>0</sub>. If we
assume that our snippet represents the complete work, it is easy to
calculate the probability of a word such as *book*. Let's illustrate
that with the word *book*: if the snippet represents the whole work, we
can simply divide the frequecy of *book* by the total number of words:
$\\frac{1}{18} = 0.056$. Similarly, we can calculate the probability
that a word has a frequency *r*, for example *r* = 1 (words that occur
only once, i.e. singletons). There are 3 words in total with a frequency
of *r* = 1, which we write down as *f*<sub>1</sub> = 3. The probability
that a word has a frequency of 1 is then equal to *f*<sub>1</sub>
divided by the total number of words in a book:
\(\frac{f_1}{n} = \frac{3}{18} = 0.167 \). And the average relative
frequency of words with *r* = 1 is then equal to:
$\\alpha_1 = \\frac{1}{18} f_1 /
f_1 = \\frac{1}{18}$. But of course the 18-word snippet is just a
snippet, and not a whole work. Because the snippet is not complete,
there is a considerable chance that we have not yet seen certain words
from the original, complete book. Therefore, in our probability
calculations, we must take into account the possibility that we will
come across a range of unseen words. But how?

Well, let's suppose that we find another snippet of the same manuscript
containing one new word. What is then the probability that this new word
is another instance of the already observed *book*? Note that if this
new word is indeed the word *book*, then *book* no longer occurs once
but twice. In other words, *book* then no longer has the frequency
*r* = 1 but *r* = 1 + 1. To account for such situations, Turing and his
student Good proposed not to estimate the probability of a word
occurring *r* times with $\\frac{r}{n}$ but with an adjusted count
$\\frac{r^\*}{n}$ (note the asterisk). This modified count states that
the probability that we have seen a new words *r* + 1 times is equal to
the probability of the words we have already seen *r* + 1 times. This
can be formulated as:
*r*<sup>\*</sup> = (*r*+1)*f*<sub>*r* + 1</sub>/*f*<sub>*r*</sub>. The
average relative frequency of words that occur *r* times can then be
computed with:

$$\\begin{equation}
\\alpha_r = \\frac{r^\*}{n} = \\frac{(r + 1)}{n} \\frac{f\_{r + 1}}{f_r}.
\\end{equation} \\qquad (2)$$

To illustrate: the word *book* occurs once in the snippet and there are
two other words that occur once. This, as stated before, gives
*f*<sub>1</sub> = 3. There is one word with a frequency of 2, so
*f*<sub>2</sub> = 1. If we plug these number into the formula above, we
can calculate the probability that the new word is the word *book*:
$\\frac{(1 + 1)}{18}
\\frac{1}{3} = 0.037$. It is important to note that this new probability
is smaller than the relative frequency of *book* in the snippet that we
caculated earlier (1/18 = 0.056). This is because the Good-Turing counts
act as a kind of frequency correction, ensuring that we leave some
probability space for any unseen words – and hence the corrected
probability is smaller.

Before we continue with showing how to use this all for computing
*f*<sub>0</sub>, it is important to make a small modification to the
original Good-Turing formula. In a follow-up study, Chiu, Chun-Huo and
Wang, Yi-Ting and Walther, Bruno A. and Chao, Anne, 2014 show that the
Good-Turing estimate can be made even more precise with:

$$\\begin{equation}
\\alpha_r = \\frac{(r + 1) f\_{r + 1}}{(n - r) f_r}.
\\end{equation} \\qquad (3)$$

For unseen words, we cannot calculate the average relative frequency
*α*<sub>0</sub>, because we have no knowledge of *f*<sub>0</sub>:
$\\frac{f_1}{n f_0=?}$. What we *are* able to calculate, however, is the
estimated proportion of the total number of words that are unseen. That
proportion is equal to the product of the average relative frequency of
unseen words *α*<sub>0</sub> and the number of unseen words
*f*<sub>0</sub>: *α*<sub>0</sub>*f*<sub>0</sub>. This product can be
approximated by dividing the number of words that occur once by the
total number of words: $\\frac{f_1}{n}$. Essentialy, we strip
*f*<sub>0</sub> from the formula.

We are now almost in the position to grasp how to estimate
*f*<sub>0</sub>. As I mentioned, we can estimate the product
*α*<sub>0</sub>*f*<sub>0</sub> with $\\frac{f_1}{n}$. A simple way to
compute *f*<sub>0</sub> would be to divide this product by
*α*<sub>0</sub>. But unfortunately, we do not know the average relative
frequency of unseen words. We therefore have to work with what we do
know, for example that the average relative frequency of unseen words is
probably lower that that of words occuring once. That is to say:
*α*<sub>0</sub> ≤ *α*<sub>1</sub>. It then follows that
$\\frac{\\alpha_0 f_0}{\\alpha_0}$ must be *at least* equal to or
greater than $\\frac{\\alpha_0 f_0}{\\alpha_1}$:

$$\\begin{equation}
f_0 = \\frac{\\alpha_0 f_0}{\\alpha_0} \\geq \\frac{\\alpha_0 f_0}{\\alpha_1}.
\\end{equation} \\qquad (4)$$

We can rewrite that last formula ($\\frac{\\alpha_0 f_0}{\\alpha_1}$) to
the calculable $\\frac{f1}{n} / \\frac{2f_2}{(n - 1)f_1}$. If we apply
this formula to our snippet, the estimate is that we have not yet seen
at least $\\frac{3}{18} / \\frac{2 \* 1}{(18 - 1) \* 3}
\\approx 4$ words yet. It is important to emphasize again that
$\\frac{\\alpha_0
f_0}{\\alpha_0}$ is *at least* equal to or greater than
$\\frac{\\alpha_0 f_0}{\\alpha_1}$, and that our estimate of
*f*<sub>0</sub> is thus a *lower bound* on the true number of unique
words. This estimate, based on Good-Turing counts, gives the same lower
bound for *f*<sub>0</sub> that Anne Chao has proven extensively (Chao,
Anne, 1984), and can be calculated with her well-known unseen species
model, Chao1, which can be formulated as:
$\\frac{(n - 1)}{n} \\frac{f_1^2}{2 f_2}$.

The Chao1 model thus provides a lower bound of the ecological, or
cultural, richness in a given area. Using the Good-Turing perspective,
we can now also clarify when the lower bound is in fact an accurate
estimate of the true richness. The reasoning is as follows: if the
average frequency of unseen words (*α*<sub>0</sub>) is approximately
equal to that of words that occur once (*α*<sub>1</sub>), then there is
no longer any difference between $\\frac{\\alpha_0 f_0}{\\alpha_0}$ and
$\\frac{\\alpha_0 f_0}{\\alpha_1}$, and thus method can provide an
unbiased estimate of the number of unique species, or say, cultural
artefacts, such as mediavl stories that exist in a given area –
including the ones that have not been seen.

# References

Chao, Anne (1984). *Nonparametric Estimation of the Number of Classes in
a Population*, Scandinavian Journal of Statistics.

Chao, Anne and Chiu, Chun‐Huo and Colwell, Robert K. and Magnago, Luiz
Fernando S. and Chazdon, Robin L. and Gotelli, Nicholas J. (2017).
*Deciphering the Enigma of Undetected Species, Phylogenetic, and
Functional Diversity Based on Good‐Turing Theory*, Ecology.

Chiu, Chun-Huo and Wang, Yi-Ting and Walther, Bruno A. and Chao, Anne
(2014). *An Improved Nonparametric Lower Bound of Species Richness via a
Modified Good-Turing Frequency Formula: An Improved Nonparametric Lower
Bound of Species Richness*, Biometrics.

Kestemont, Mike and Karsdorp, Folgert and {de Bruijn}, Elisabeth and
Driscoll, Matthew and Kapitan, Katarzyna A. and Ó Macháin, Pádraig and
Sawyer, Daniel and Sleiderink, Remco and Chao, Anne (2022). *Forgotten
Books: The Application of Unseen Species Models to the Survival of
Culture*, Science.
