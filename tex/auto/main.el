(TeX-add-style-hook
 "main"
 (lambda ()
   (TeX-add-to-alist 'LaTeX-provided-class-options
                     '(("report" "12pt" "letterpaper")))
   (TeX-add-to-alist 'LaTeX-provided-package-options
                     '(("fontenc" "T1") ("csquotes" "strict" "autostyle") ("babel" "USenglish") ("biblatex" "backend=biber" "style=apa" "maxcitenames=2" "maxbibnames=99" "sorting=ydnt" "uniquelist=false" "mincitenames=1" "citestyle=authoryear")))
   (add-to-list 'LaTeX-verbatim-macros-with-braces-local "href")
   (add-to-list 'LaTeX-verbatim-macros-with-braces-local "hyperref")
   (add-to-list 'LaTeX-verbatim-macros-with-braces-local "hyperimage")
   (add-to-list 'LaTeX-verbatim-macros-with-braces-local "hyperbaseurl")
   (add-to-list 'LaTeX-verbatim-macros-with-braces-local "nolinkurl")
   (add-to-list 'LaTeX-verbatim-macros-with-braces-local "url")
   (add-to-list 'LaTeX-verbatim-macros-with-braces-local "path")
   (add-to-list 'LaTeX-verbatim-macros-with-delims-local "path")
   (TeX-run-style-hooks
    "latex2e"
    "report"
    "rep12"
    "fontenc"
    "csquotes"
    "babel"
    "microtype"
    "datetime"
    "tabto"
    "hyperref"
    "geometry"
    "enumitem"
    "titlesec"
    "setspace"
    "ebgaramond"
    "helvet"
    "biblatex"
    "authblk")
   (TeX-add-symbols
    '("namefont" 1)
    "myname"
    "listtabwidth"
    "listitemspace")
   (LaTeX-add-bibliographies
    "../static/references")
   (LaTeX-add-enumitem-newlists
    '("tablist" "description")))
 :latex)

