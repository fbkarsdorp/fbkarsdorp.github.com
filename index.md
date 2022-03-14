---
layout: base.liquid
---

I'm a researcher in Computational Humanities and Cultural Evolution at the [Meertens
Institute](https://www.meertens.knaw.nl) of the [Royal Netherlands Academy of Arts and
Sciences](https://www.knaw.nl) (Amsterdam, the Netherlands). My research focuses on why
some cultural phenomena are adopted and persist through time, while others change or
disappear. Additionally, I'm interested in measuring cultural diversity and compositional
complexity, and how we can account for biases in our estimations of diversity. To do that,
I use computational models from Machine Learning, Cultural Evolution, and Ecology.

Besides cultural change and diversity, I'm also interested in teaching about computer
programming in the context of the Humanities. I published a text book with Princeton
University Press about using Python for [Humanities data
analysis](href="https://press.princeton.edu/books/hardcover/9780691172361/humanities-data-analysis).
Check out the open access edition of our book
[here](https://www.humanitiesdataanalysis.org)!

## News

<ul>
{% for post in collections.news reversed %}
  <li><a href="{{ post.url }}">
    <span class="post-link">{{ post.data.title }}</span>
  </a>
  — <span class="snippet">{{ post.data.snippet }}</span>
  — <time>{{ post.data.date | date: "%B %d, %Y" }}</time>
  </li>
{% endfor %}
</ul>


## Public Notebooks

<ul>
{% for post in collections.posts reversed %}
  <li><a href="{{ post.url }}">
    <span class="post-link">{{ post.data.title }}</span>
  </a>
  — <span class="snippet">{{ post.data.snippet }}</span>
  — <time>{{ post.data.date | date: "%B %d, %Y" }}</time>
  </li>
{% endfor %}
</ul>


## Selected publications

<ul>
{% for publication in collections.publications %}
  <li><a href="{{ publication.data.url }}">
    <span class="post-link">{{ publication.data.title }}</span>
  </a>
  — <span class="snippet">{{ publication.data.journal }}</span>
  — <time>{{ publication.data.year }}</time>
  </li>
{% endfor %}
</ul>

For a complete list of publications, see my
[CV](https://github.com/fbkarsdorp/fbkarsdorp.github.com/blob/master/static/cv.pdf). 

