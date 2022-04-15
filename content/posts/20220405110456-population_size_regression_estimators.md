+++
title = "Population Size Estimation as a Regression Problem 🚧🚧"
author = ["Folgert Karsdorp"]
lastmod = 2022-04-15T20:57:52+02:00
tags = ["heterogeneity", "chao1", "regression", "pymc3", "richness", "diversity", "zelterman"]
draft = false
+++

## Unseen heterogeneity {#unseen-heterogeneity}

[Unseen Species Model]({{< relref "20220228153558-unseen_species_model.md" >}})s such as [Chao1]({{< relref "20220228153400-chao1_estimator.md" >}}) provide accurate point-estimates of the population
size when the rare species in studied sample are homogeneous. That is, in the case of
animal species, for example, all species are equally likely to be observed. Of course,
this is a simplifying assumption. Some species are simply more difficult to spot than
others, and so most samples contain unseen heterogeneity. When such heterogeneity is
present in a sample, the Chao1 estimate reduces to a lower bound of the actual population
size. What happens when we do have knowledge about (some parts of) the the origin of the
heterogeneity? Is there a way to use that information to correct for some of the bias of
Chao's estimator?

In a series of articles, Dankmar Böhning and colleagues show how information about
covariates (e.g., certain characteristics of animal species) can help to reduce this bias
(<a href="#citeproc_bib_item_2">Böhning and van der Heijden 2009</a>; <a href="#citeproc_bib_item_1">Bohning et al. 2013</a>). The crucial insight in these articles is the
conceptualisation of Unseen Species Models as maximum likelihood estimators for a
truncated Poisson likelihood. That insight allows
Bohning et al. (<a href="#citeproc_bib_item_1">2013</a>) to develop a regression method for
population size estimation that incorporates information about covariates and is a
generalization of Chao1. Simlarly, Böhning and van der Heijden (<a href="#citeproc_bib_item_2">2009</a>)
use this insight to generalize the [Zelterman estimator]({{< relref "20220405102342-zelterman_estimator.md" >}})
(<a href="#citeproc_bib_item_5">Zelterman 1988</a>) to incorporate information about
covariates. Below, I will briefly describe both generalizations, after which I will put
them to test in a simulation study.


## Unseen Species Models in a Likelihood Framework {#unseen-species-models-in-a-likelihood-framework}


### The Chao1 estimator {#the-chao1-estimator}

As I described in more detail in [Demystifying Chao1 with Good-Turing]({{< relref "20220309103709-good_turing_as_an_unseen_species_model.md" >}}), the Chao1 estimator
developed in Chao (<a href="#citeproc_bib_item_3">1984</a>) takes the form of \\(f^2\_1 /
(2f\_2)\\), where \\(f\_1\\) indicates how many species occur once, and \\(f\_2\\) how many occur
exactly 2 times. The estimator thus only works with \\(f\_1\\) and \\(f\_2\\) (everything that
occurs more often, or not at all, is ignored), and that is why we can speak of a
_truncated distribution_. To be more specific: Chao1 assumes that the observed species
follow a Poisson distribution, and thus by only considering \\(f\_1\\) and \\(f\_2\\), we are
dealing with a truncated Poisson distribution. A Poisson distribution has one parameter
\\(\lambda\\) that represents the expected outcome value, such as the expected number of
observations or sightings of an animal species:

\begin{equation}
y \sim \text{Poisson}(\lambda)
\end{equation}

An exciting insight from Bohning et al. (<a href="#citeproc_bib_item_1">2013</a>) is that in the
case of a _truncated_ Poisson distribution, the parameter \\(\lambda\\) can be estimated with
a binomial likelihood. To understand this, we need to consider that a truncated Poisson
with \\(y \in {1, 2}\\) is in fact a binomial distribution with a binary outcome: something
occurs once of something occurs twice. We can thus calculate the probability that
something occurs twice and not once, i.e., \\(P(y=2)\\). That probability is maximised by
\\(\hat{p} = f\_2 / (f\_1 + f\_2)\\). With \\(\lambda = 2p/(1 - p)\\), we can use \\(p\\) to obtain an
estimate for \\(\lambda\\).

Bohning et al. (<a href="#citeproc_bib_item_1">2013</a>) subsequently show that can also estimate
\\(\hat{p}\\) using logistic regression (see also <a href="#citeproc_bib_item_2">Böhning and van der Heijden 2009</a>). And by doing so, it becomes possible to
include information on covariates. These covariates, then, provide information about the
probability of an item occuring once or twice in the sample under investigation. In a
logistic regression, the outcome probability \\(p\_i\\) is connected to a linear model via a
logit link:

\begin{align\*}
y\_i & \sim \text{Binomial}(1, p\_i) \\\\
\text{logit}(p\_i) & = \alpha \\\\
\end{align\*}

where \\(\alpha\\) represents the intercept. This specification allows us to easily add
covariates (also called predictors) to the linear model as follows:

\begin{align\*}
y\_i & \sim \text{Binomial}(1, p\_i) \\\\
\text{logit}(p\_i) & = \alpha + \beta\_x x\_i\\\\
\end{align\*}

where \\(x\_i\\) represents the value of a given predictor and \\(\beta\_x\\) the coefficient
of predictor \\(x\\). After estimating \\(p\_i\\) we can estimate the parameter \\(\lambda\_i\\) with:

\begin{equation}
\hat{\lambda}\_i = 2 \frac{\hat{p}\_i}{1 - \hat{p}\_i}
\end{equation}

What remains is to use the estimate \\(\lambda\_i\\) to calculate the number of unseen items,
\\(f\_0\\). Bohning et al. (<a href="#citeproc_bib_item_1">2013</a>)  show that \\(f\_0\\) and the population
size \\(\hat{N}\\) can be estimated with:

\begin{equation}
\hat{N} = n + \sum^{f\_1 + f\_2}\_{i = 1} \frac{1}{\hat{\lambda}\_i + \hat{\lambda}\_i^2 / 2}
\end{equation}

For proofs and theorems of this equation, I refer to the note by
Bohning et al. (<a href="#citeproc_bib_item_1">2013</a>). In the remainder of this notebook, I want
to concentrate on showing how \\(\lambda\_i\\) and \\(p\_i\\) can be estimated in practice using a
Bayesian generalised linear model.


### The Zelterman estimator {#the-zelterman-estimator}

In [Zelterman's Estimator of Population Size]({{< relref "20220405102342-zelterman_estimator.md" >}}), I briefly introduced the Zelterman estimator,
which, combined with the [Horvitz-Thompson estimator]({{< relref "20220405101628-horvitz_thompson_estimator.md" >}}), can be used as an estimator of the
population size, \\(\hat{N}\\). Böhning and van der Heijden (<a href="#citeproc_bib_item_2">2009</a>) apply
the same framework to develop a version of the Zelterman estimator which can incorporate
information about covariates. Recall the the Horvitz-Thompson estimator takes the form of:

\begin{equation}
\hat{N} = \frac{n}{1 - e^{-\lambda}}
\end{equation}

Thus, we can use the same binomial regression framework to estimate the probability \\(p\\)
that something occur twice and not once, which is uniquely connected to \\(\lambda = 2p/(1 -
p)\\) (see <a href="#citeproc_bib_item_2">Böhning and van der Heijden 2009</a> for further details).


## Experimenting with Bayesian regression {#experimenting-with-bayesian-regression}


### Simulation Model {#simulation-model}

In this section, I aim to get a better idea of the effect of heterogeneity in a sample on
the quality of population size estimation. In order to do so systematically, it is useful
to define a function with which we can simulate data. Below, I define a simple function in
Python, `generate_population`, which lets us generate populations of size \\(N\\) in which the
number of occurrences of each item \\(i\\) is sampled from a Poisson distribution:
een Poisson verdeling:

\begin{align\*}
N\_i & \sim \text{Poisson}(\lambda\_i) \\\\
\text{log}(\lambda\_i) & = \alpha + \beta x\_i \\\\
\end{align\*}

In this equation, \\(\alpha\\) represents the log-scale intercept (i.e., the mean expected
abundance on a log scale), and \\(\beta\\) the effect (the slope) of predictor \\(x\\). \\(x\_i\\)
takes on a binary value, thus representing two categories (e.g., male en female animals).
A translation into Python code is as follows:

```python
import numpy as np
import pandas as pd

def generate_population(N, alpha, beta):
    X = np.zeros(N)
    X[N//2:] = 1
    Lambda = np.exp(alpha + beta*X)
    counts = np.random.poisson(Lambda, size=N)
    return pd.DataFrame({"counts": counts, "X": X})
```

Let's test the function. Below, I generate a population of 1000 unique items. To first get
a feel for how the estimator works with heterogeneity, we'll set beta to 1:

```python
import seaborn as sns

pop = generate_population(1000, 0, 1)

ax = sns.catplot(
    data=pop.groupby("X")["counts"].value_counts().reset_index(name="f"),
    kind="bar", x="counts", y="f", hue="X")
ax.set(xlabel="count", ylabel="f");
```

{{< figure src="/ox-hugo/84331342e22b29d14f27dcd8019d4c3da488f712.png" >}}

The total number of unseen items as well the number os unseen items per group can be
recovered with:

```python
print(f'Total number of missing items is {(pop["counts"] == 0).sum()}')
print(f'Number of missing items with X=1 is {((pop["counts"] == 0) & (pop["X"] == 1)).sum()}')
print(f'Number of missing items with X=0 is {((pop["counts"] == 0) & (pop["X"] == 0)).sum()}')
```

```text
Total number of missing items is 233
Number of missing items with X=1 is 40
Number of missing items with X=0 is 193
```

Thus, the chance of unseen items with \\(x\_i=1\\) is much smaller than when \\(x\_i=0\\).


### Data preparation {#data-preparation}

As said, we aim to estimate the parameters of the truncated Poisson distribution by means
of logistic regression. To this end, we reduce our generate sample to only contain items
that occur once or twice. And subsequently, we add a binary indicator variable \\(y\\) that
equal 1 if the count of item \\(i\\) is 2, and 0 otherwise. This binary variable, then, will
be the outcome variable in the binomial regression model.

```python
data = pop.copy()[pop["counts"].isin((1, 2))]
data["y"] = (data["counts"] == 2).astype(int)
data = data.reset_index(drop=True)
data.sample(5).head()
```

|     | counts | X | y |
|-----|--------|---|---|
| 275 | 2      | 1 | 1 |
| 163 | 1      | 0 | 0 |
| 360 | 1      | 1 | 0 |
| 65  | 1      | 0 | 0 |
| 226 | 1      | 0 | 0 |


### Regression model {#regression-model}

We will use the PyMC3 library for doing probabilistic programming in Python to perfom our
regression analysis and thus to estimate the parameter \\(\hat{p}\_i\\) and corresponding
parameter \\(\lambda\_i\\) through \\(\hat{\lambda}\_i = 2 \frac{\hat{p}\_i}{1 - \hat{p}\_i}\\). PyMC3
has an intuitive model specification syntax, which allows us to easily code down our
model, while maintaining flexibility:

```python
import pymc3 as pm

with pm.Model() as model:
    alpha = pm.Normal('alpha', 0, 5)  # prior on alpha
    beta = pm.Normal('beta', 0, 5)  # prior on beta
    p = pm.Deterministic("p", pm.math.invlogit(alpha + beta*data["X"]))
    f2 = pm.Binomial("f2", 1, p, observed=data["y"])
    trace = pm.sample(1000, tune=2000, return_inferencedata=True)
```

I assume that most lines of code in this model definition are easy to understand. The
deterministic variable \\(p\\) is there for convenience allowing us to work with estimated
values on the probability scale later on. PyMC3 is closely integrated with the ArviZ
library, which is the go-to library in Python for exploratory analyses of Bayesian models.

```python
import arviz as az
az.summary(trace, var_names=["alpha", "beta"])
```

|       | mean  | sd    | hdi_3% | hdi_97% | mcse_mean | mcse_sd | ess_bulk | ess_tail | r_hat |
|-------|-------|-------|--------|---------|-----------|---------|----------|----------|-------|
| alpha | -0.59 | 0.131 | -0.841 | -0.354  | 0.003     | 0.002   | 1602     | 2034     | 1     |
| beta  | 1.15  | 0.196 | 0.758  | 1.491   | 0.005     | 0.004   | 1422     | 1724     | 1     |

Looking at the table, it appears that the sampling process was succesful, which is also
confirmed by the good mixing of the chains in the following trace plot:

```python
az.plot_trace(trace)
plt.tight_layout();
```

{{< figure src="/ox-hugo/fda179b06caa7577686126fee2039d5ed0668555.png" >}}

Now that we have an estimate of \\(\hat{p}\\), we can use that to obtain our estimate of the
population size following the equations above. First, we extract 1,000 posterior samples
from each chain resulting in 4,000 posterior samples. We then compute the \\(\lambda\_i\\)
values for each item \\(i\\) in the data set. And finally, we compute \\(f\_0\\) and add that to
the observed population size to obtain an estimate of the true population size.

```python
post = az.extract_dataset(trace) # stack all chains
n = (pop["counts"] > 0).sum()
p = post["p"].values
l = (2 * p) / (1 - p)
f0 = (1 / (l + (l**2) / 2))
N = n + f0.sum(0)

az.plot_posterior(N, point_estimate="mean");
```

{{< figure src="./.ob-jupyter/0bf94dbb855952a156c51d2f1e13bf7130c181d9.png" >}}

The cool thing about using a Bayesian regression analysis is that our estimate of
\\(\hat{N}\\) becomes a distribution of estimates. We observe that the mean estimate is
relatively close to the true value of \\(N=1000\\).

Note that the estimate is rather similar to the lower-bound of Chao1, which has a slightly
more negative bias:

```python
import copia

print(round(copia.chao1(pop["counts"])))
```

```text
901
```

An additional benefit of the regression approach is that we can easily obtain posterior
population size estimates for different covariates. Below, we plot the estimates for \\(x=0\\)
(left panel) and \\(x=1\\) (right panel).

```python
fig, axes = plt.subplots(ncols=2, figsize=(8, 4))

labeller = az.labels.MapLabeller(var_name_map={"x": r"$x=0$"})

n0 = ((pop["counts"] > 0) & (pop["X"] == 0)).sum()
l = (2 * p) / (1 - p)
f0_x0 = (1 / (l + (l**2) / 2)) * (data["X"] == 0).astype(int).values[:, None]
S_x0 = n0 + f0_x0.sum(0)

az.plot_posterior(S_x0, ax=axes[0], labeller=labeller);

labeller = az.labels.MapLabeller(var_name_map={"x": r"$x=1$"})
n1 = ((pop["counts"] > 0) & (pop["X"] == 1)).sum()
l = (2 * p) / (1 - p)
f0_x1 = (1 / (l + (l**2) / 2)) * (data["X"] == 1).astype(int).values[:, None]
S_x1 = n1 + f0_x1.sum(0)

az.plot_posterior(S_x1, ax=axes[1], labeller=labeller);
```

{{< figure src="/ox-hugo/b8e3552547054dcbe8cff81faf558bebbd7eb1be.png" >}}

Note that the mean estimates of the two groups add up to the global estimate of the
population size. This, however, is not the case when we apply Chao1 to each group
individually:

```python
N0 = round(copia.chao1(pop.loc[pop["X"] == 0, "counts"]))
N1 = round(copia.chao1(pop.loc[pop["X"] == 1, "counts"]))

print(f"Estimate for N for X=0 equals {N0}")
print(f"Estimate for N for X=1 equals {N1}")
print(f"The sum of the group estimates equals {N0 + N1}.")
```

```text
Estimate for N for X=0 equals 461
Estimate for N for X=1 equals 484
The sum of the group estimates equals 945.
```


### Evaluation {#evaluation}

A major advantage of the regression approach and certainly regression in a Bayesian
framework is that it makes all the usual tools for model evaluation and model comparison
available. In this way, it becomes possible to more accurately and systematically
investigate whether the assumption of certain covariates leads to a better predictive
model, and thus whether the assumption of heterogeneity in the dataset was justified and
possibly even necessary to arrive at less biased population size estimates.

ArviZ implements several well-known evelation criteria, such as WAIC and Leave-one-out
Cross-validation (LOO). Below, I compare two models using LOO: one with only an intercept
(effectively assuming homogeneity), and the previously presented model with an additional
coefficient \\(\beta\\). Before we proceed, let's fit the intercept-only model:

```python
with pm.Model() as intercept_model:
    alpha = pm.Normal('alpha', 0, 5)  # prior on alpha
    p = pm.Deterministic("p", pm.math.invlogit(alpha))
    f2 = pm.Binomial("f2", 1, p, observed=data["y"])
    intercept_trace = pm.sample(1000, tune=2000, return_inferencedata=True)
```

The model appears to have converged decently:

```python
import arviz as az
az.summary(intercept_trace, var_names=["alpha"])
```

|       | mean   | sd   | hdi_3% | hdi_97% | mcse_mean | mcse_sd | ess_bulk | ess_tail | r_hat |
|-------|--------|------|--------|---------|-----------|---------|----------|----------|-------|
| alpha | -0.056 | 0.09 | -0.225 | 0.11    | 0.002     | 0.002   | 1612     | 2631     | 1     |

Without coefficients, the regression version of Chao1 reduces to the original Chao1
estimate (<a href="#citeproc_bib_item_1">Bohning et al. 2013</a>). Thus, unsurprisingly yet
reassuringly, the mean estimate of the intercept model is approximately equal to the
point-estimate of Chao1:

```python
post = az.extract_dataset(intercept_trace) # stack all chains
n = (pop["counts"] > 0).sum()
nu  = (post["alpha"].values * np.ones(data.shape[0])[:, None])
p = np.exp(nu) / (1 + np.exp(nu))
l = (2 * p) / (1 - p)
f0 = (1 / (l + (l**2) / 2))
N = n + f0.sum(0)

az.plot_posterior(N, point_estimate="mean");
```

{{< figure src="/ox-hugo/a5bb2ee6085541ae4c223dd4d2aac7a1a54c068f.png" >}}

ArviZ provides the neat function `az.compare()` to compare the out-of-sample predictive
fit of different models. Here, we compute the LOO for both models and display the results
in a DataFrame:

```python
loo_comparison = az.compare(
    {
        "covariate-model": trace,
        "intercept-model": intercept_trace,
    })
loo_comparison
```

|                 | rank | loo      | p_loo   | d_loo   | weight    | se       | dse    | warning | loo_scale |
|-----------------|------|----------|---------|---------|-----------|----------|--------|---------|-----------|
| covariate-model | 0    | -324.945 | 2.0769  | 0       | 0.967038  | 6.17537  | 0      | False   | log       |
| intercept-model | 1    | -343.226 | 1.00932 | 18.2808 | 0.0329623 | 0.627712 | 6.1465 | False   | log       |

The covariate model is ranked first, and received almost all of the weight (which can
loosely be interpreted as the probability of a model being true compared to the other
model and given the data). Thus, the model comparison confirms what we already knew: the
data is heterogeneously generated, and knowlegde about the nature of this heterogeneity
should help specifying a better model.

ArviZ also provides a function to create a summary plot much like the ones in
McElreath (<a href="#citeproc_bib_item_4">2016</a>)'s _Statistical Rethinking_ book. The
open circles in the plot below represent the LOO values, and the error bars represent the
standard deviation of these LOO values. Again, the plot confirms what we already knew, but
that's reassuring if we want to apply the method to real-world case.

```python
az.plot_compare(loo_comparison, insample_dev=False);
```

{{< figure src="/ox-hugo/9bb9b9d25a40d7e23fa3e9d91aa37b4bc652f2ce.png" >}}

## References

<style>.csl-entry{text-indent: -1.5em; margin-left: 1.5em;}</style><div class="csl-bib-body">
  <div class="csl-entry"><a id="citeproc_bib_item_1"></a>Bohning, Dankmar, Alberto Vidal-Diez, Rattana Lerdsuwansri, Chukiat Viwatwongkasem, and Mark Arnold. 2013. “A Generalization of Chao’s Estimator for Covariate Information.” <i>Biometrics</i> 69: 1033–42. <a href="https://doi.org/10.1111/biom.12082">https://doi.org/10.1111/biom.12082</a>.</div>
  <div class="csl-entry"><a id="citeproc_bib_item_2"></a>Böhning, Dankmar, and Peter G. M. van der Heijden. 2009. “A Covariate Adjustment for Zero-Truncated Approaches to Estimating the Size of Hidden and Elusive Populations.” <i>The Annals of Applied Statistics</i> 3 (2). <a href="https://doi.org/10.1214/08-AOAS214">https://doi.org/10.1214/08-AOAS214</a>.</div>
  <div class="csl-entry"><a id="citeproc_bib_item_3"></a>Chao, Anne. 1984. “Nonparametric Estimation of the Number of Classes in a Population.” <i>Scandinavian Journal of Statistics</i> 11 (4): 265–70.</div>
  <div class="csl-entry"><a id="citeproc_bib_item_4"></a>McElreath, Richard. 2016. <i>Statistical Rethinking: A Bayesian Course with Examples in R and Stan</i>. First. Chapman and Hall/CRC. <a href="https://doi.org/10.1201/9781315372495">https://doi.org/10.1201/9781315372495</a>.</div>
  <div class="csl-entry"><a id="citeproc_bib_item_5"></a>Zelterman, Daniel. 1988. “Robust Estimation in Truncated Discrete Distributions with Application to Capture-Recapture Experiments.” <i>Journal of Statistical Planning and Inference</i> 18 (2): 225–37. <a href="https://doi.org/10.1016/0378-3758(88)90007-9">https://doi.org/10.1016/0378-3758(88)90007-9</a>.</div>
</div>