+++
title = "Zelterman's Estimator of Population Size"
author = ["Folgert Karsdorp"]
lastmod = 2022-04-01T12:43:51+02:00
tags = ["unseen-species", "diversity", "homogeneity", "richness", "zelterman", "chao1", "shakespeare"]
draft = false
+++

## Zelterman's Estimator {#zelterman-s-estimator}

In [Demystifying Chao1 with Good-Turing]({{< relref "20220309103709-good_turing_as_an_unseen_species_model.md" >}}), I introduced and explained the [Chao1 estimator]({{< relref "20220228153400-chao1_estimator.md" >}}) as
an example of a well-known model for estimating the number of unseen species. In this
notebook, I study some aspects of another, alternative estimator developed in
Zelterman (<a href="#citeproc_bib_item_5">1988</a>), which has been popular in applications
such as drug user studies. This estimator has particular properties that make it more
robust or less sensitive to violations of the underlying model. As such, it would be
interesting to study how well the estimator performs when applied to cultural data. In
what follows, I base my descriptions on the original paper by
Zelterman (<a href="#citeproc_bib_item_5">1988</a>) as well as the more recent application of
the method by Böhning and van der Heijden (<a href="#citeproc_bib_item_1">2009</a>).

All unseen species estimators are based on estimating the probability of an item not being
observed, i.e. \\(p(y = 0)\\). Inversely, the probability that we do observe an item then
equals \\(1 - p(y = 0)\\). It follows that the population size \\(N\\) is equal to \\((1 - p(y = 0))
N + p(y = 0) N\\). In other words, the population size is the sum of the fraction of unseen
items and the fraction of seen items. This can be rewritten to \\(n + p(y=0) N\\), since \\(n\\)
represents the observed and thus known population size. Given information about \\(n\\) and
\\(p(y=0)\\), Horvitz and Thompson (<a href="#citeproc_bib_item_4">1952</a>) demonstrate that \\(N\\) can
be estimated with:

\begin{equation}
\hat{N} = \sum^n\_{i = 1} \frac{1}{p(y\_i > 0)}.
\end{equation}

Here, each item \\(i\\) is weighted by the inverse of its observation probability. If all
items have the same observation probability \\(p(y > 0)\\), this can be simplified to:

\begin{equation}
\hat{N} = \frac{n}{1 - p(y=0)}
\end{equation}

To be able to compute this equation, we require knowledge of \\(p(y=0)\\), and if that's not
available, we need to estimate it. If we assume that the counts \\(y\\) follow a Poisson
distribution, this amounts to estimating \\(e^{-\lambda}\\), with \\(\lambda\\) being the Poisson
rate parameter. When the counts \\(y\\) follow a homogeneous Poisson, we can estimate
\\(\lambda\\) with maximum likelihood (<a href="#citeproc_bib_item_1">Böhning and van der Heijden 2009</a>).
However, this homogeneous assumption is often violated, as not all values of \\(y\\) adhere to
the Poisson distribution.

This is where Zelterman (<a href="#citeproc_bib_item_5">1988</a>) comes in. Zelterman argues
that while the Poisson assumption might not be valid for the complete range of \\(y\\), it may
apply to smaller ranges, such as from \\(r\\) to \\(r + 1\\). If we represent the number of items
occurring \\(r\\) times as \\(f\_r\\), Zelterman proposes to use \\(f\_r\\) and \\(f\_{r + 1}\\) to estimate
\\(\lambda\_r\\). Thus, to estimate \\(\lambda\_{r = 1}\\), we can use:

\begin{equation}
\hat{\lambda}\_1 = \frac{(r+1)f\_{r + 1}}{f\_r} = \frac{2f\_2}{f\_1}.
\end{equation}

Interestingly, \\(\hat{\lambda}\_r\\) is computed using the exact same formula as Turing and
Good proposed to obtain their unnormalized, adjusted counts \\(r^\*\\)
(see <a href="#citeproc_bib_item_3">Good 1953</a> and [Demystifying Chao1
with Good-Turing]({{< relref "20220309103709-good_turing_as_an_unseen_species_model.md" >}})). Zelterman's estimator of \\(\lambda\\) is said to be robust as it only
takes into account items that occur once or twice, and as such deviations from the Poisson
in higher order counts do not impact the estimation. Put differently, the distribution
only needs to look like a Poisson for \\(f\_1\\) and \\(f\_2\\). If we plug Zelterman's estimate of
\\(\lambda\\) into the estimator by (<a href="#citeproc_bib_item_4">Horvitz and Thompson 1952</a>), we
obtain an estimate of the population size \\(\hat{N}\\) with \\(\frac{n}{1 - e^{-\hat{\lambda}}}\\)
(see <a href="#citeproc_bib_item_1">Böhning and van der Heijden 2009</a> for further details).


## Testing the Zelterman estimator {#testing-the-zelterman-estimator}

To get a feeling of how the Zelterman estimator behaves, let's apply it to some simulated
data. Below, I define a function in Python which generates a population that follows a
Poisson distribution:

```python
import numpy as np

def generate_population(V, alpha):
    counts = np.random.poisson(np.exp(alpha), size=V)
    return {"counts": counts, "V": V, "N": counts.sum()}

pop = generate_population(100, 0)
```

Using this function we can generate populations, such as the following:

```python
import pandas as pd

ax = pd.Series(pop["counts"]).value_counts().sort_index().plot(kind="bar")
ax.set(xlabel="$r$", ylabel="$f_r$");
```

{{< figure src="/ox-hugo/d0a65d8ac157f513a9fb8026088c30885bd9cb45.png" >}}

```text
Total number of observed items n = 89
Total number of unique items V = 100
Total number of missing items is 45
```

We will use the Zelterman estimator to obtain estimates for \\(\hat{N}\\) and \\(\hat{V}\\). The
estimator is easy to implement, as demonstrated by the following lines of code:

```python
def horvitz_thompson_estimator(n, l):
    return n / (1 - np.exp(-l))

def zelterman_estimator(f1, f2):
    return (2 * f2) / f1

def estimate_population_size(x):
    x = x[x > 0]
    f1 = (x == 1).sum()
    f2 = (x == 2).sum()
    l = zelterman_estimator(f1, f2)
    return {
        "N": horvitz_thompson_estimator(x.sum(), l),
        "V": horvitz_thompson_estimator(x.shape[0], l)
    }
```

Applying the estimator to our simulated population, we obtain the following estimates of
\\(V\\) and \\(N\\):

```python
estimate_population_size(pop["counts"])
```

|   |   |                    |   |   |                  |
|---|---|--------------------|---|---|------------------|
| N | : | 151.82741330117702 | V | : | 93.8259295681431 |

Note that these estimates are very similar to the ones obtained by applying the [Chao1
estimator]({{< relref "20220228153400-chao1_estimator.md" >}}):

|   |   |                   |   |   |                  |
|---|---|-------------------|---|---|------------------|
| N | : | 127.1003745318352 | V | : | 93.1003745318352 |


## How many words did Shakespeare know? {#how-many-words-did-shakespeare-know}

In the 1970s. pioneers Efron and Thisted applied [Unseen Species Model]({{< relref "20220228153558-unseen_species_model.md" >}})s to cultural data.
In Efron and Thisted (<a href="#citeproc_bib_item_2">1976</a>), they attempt to estimate how many unique
words Shakespeare knew but did not use. How large, so to speak, was his passive
vocabulary, and how large was his total vocabulary?
Efron and Thisted (<a href="#citeproc_bib_item_2">1976</a>) estimate these numbers in part based on the
Good-Turing estimator (see [Demystifying Chao1 with Good-Turing]({{< relref "20220309103709-good_turing_as_an_unseen_species_model.md" >}})). They calculate that
Shakespeare must have known at least approximately 35,000 additional words on top of the
31,543 he used in his works.

Below, I will apply the Zelterman estimator to make an alternative estimate of
Shakespeare's vocabulary. For this purpose, I will use the word counts as mentioned in
Efron and Thisted (<a href="#citeproc_bib_item_2">1976</a>):

| \\(f\_1\\) | \\(f\_2\\) | \\(V\\) | \\(N\\) |
|------------|------------|---------|---------|
| 14,376     | 4,343      | 31,534  | 884,647 |

Based on these counts, we can easily plug the numbers into the Zelterman formula. We first
calculate \\(\lambda\_{r = 1}\\) with \\(\lambda\_{r=1} = (2 \times 4343) / 14376 = 0.6042\\).
Subsequently, we apply the Horvitz-Thompson estimator to arrive at our estimate of the
vocabulary: \\(\hat{V} = 31534 / (1 - \text{exp}(-0.6042)) = 69536\\) unique words. With this,
the Zelterman estimator estimates Shakespeare's vocabulary as being slightly larger, but
in the same ballpark as the one by Efron and Thisted (<a href="#citeproc_bib_item_2">1976</a>).

## References

<style>.csl-entry{text-indent: -1.5em; margin-left: 1.5em;}</style><div class="csl-bib-body">
  <div class="csl-entry"><a id="citeproc_bib_item_1"></a>Böhning, Dankmar, and Peter G. M. van der Heijden. 2009. “A Covariate Adjustment for Zero-Truncated Approaches to Estimating the Size of Hidden and Elusive Populations.” <i>The Annals of Applied Statistics</i> 3 (2). <a href="https://doi.org/10.1214/08-AOAS214">https://doi.org/10.1214/08-AOAS214</a>.</div>
  <div class="csl-entry"><a id="citeproc_bib_item_2"></a>Efron, Bradley, and Ronald Thisted. 1976. “Estimating the Number of Unsen Species: How Many Words Did Shakespeare Know?” <i>Biometrika</i> 63 (3): 435. <a href="https://doi.org/10.2307/2335721">https://doi.org/10.2307/2335721</a>.</div>
  <div class="csl-entry"><a id="citeproc_bib_item_3"></a>Good, I. J. 1953. “The Population Frequencies of Species and the Estimation of Population Parameters.” <i>Biometrika</i> 40 (3-4): 237–64. <a href="https://doi.org/10.1093/biomet/40.3-4.237">https://doi.org/10.1093/biomet/40.3-4.237</a>.</div>
  <div class="csl-entry"><a id="citeproc_bib_item_4"></a>Horvitz, D. G., and D. J. Thompson. 1952. “A Generalization of Sampling without Replacement from a Finite Universe.” <i>Journal of the American Statistical Association</i> 47 (260): 663–85. <a href="https://doi.org/10.1080/01621459.1952.10483446">https://doi.org/10.1080/01621459.1952.10483446</a>.</div>
  <div class="csl-entry"><a id="citeproc_bib_item_5"></a>Zelterman, Daniel. 1988. “Robust Estimation in Truncated Discrete Distributions with Application to Capture-Recapture Experiments.” <i>Journal of Statistical Planning and Inference</i> 18 (2): 225–37. <a href="https://doi.org/10.1016/0378-3758(88)90007-9">https://doi.org/10.1016/0378-3758(88)90007-9</a>.</div>
</div>
