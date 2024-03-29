+++
title = "My Literate Emacs Configuration"
author = ["Folgert Karsdorp"]
lastmod = 2022-12-24T17:08:32+01:00
tags = ["emacs", "org-mode", "python", "jupyter", "gtd"]
draft = false
+++

## What's this? {#what-s-this}

This document is a literate version of my GNU Emacs configuration written in Org mode. Org
mode is a kind of markdown with super powers, which allows you to write code side by side
with the corresponding documentation. My Emacs configuration is the result of certainly
years and years of tinkering and refinement, and there is always something that could be
just a little bit better or different so that it fits my workflow better. Here's a
screenshot of my current setup:

{{< figure src="/ox-hugo/2022-12-21_16-30-53_Screenshot 2022-12-21 at 16.30.30.png" >}}

This document is also on GitHub. See <https://github.com/fbkarsdorp/.emacs.d>


## Startup {#startup}

```emacs-lisp
;;; -*- lexical-binding: t -*-
;;; init.el --- This is where all emacs start.
```

Set garbage collection memory threshold to some large number to improve the speed of
loading the configuration. Not sure it really makes that much of a difference, but most
people seem to do this.

```emacs-lisp
(setq gc-cons-threshold 100000000)
(add-hook 'after-init-hook (lambda () (setq gc-cons-threshold (* 10 1024 1024))))
```

Don't show the startup message

```emacs-lisp
(setq inhibit-startup-message t)
```


### Encoding {#encoding}

Set the encoding to UTF8:

```emacs-lisp
(prefer-coding-system 'utf-8)
```


### Path {#path}

Ensure defined paths in the terminal are also visible to Emacs. Aparently, this is a macOS
thing:

```emacs-lisp
(when (memq window-system '(mac ns x))
  (setq exec-path-from-shell-arguments nil)
  (exec-path-from-shell-initialize))
```


## Package management {#package-management}

For installing Emacs packages, I use MELPA, the Milkypostman’s Emacs Lisp Package Archive.
In the future, I might switch over to straight, which clones packages directly from git,
for for the moment (and the past 15 years or so), MELPA has been working just fine.

```emacs-lisp
(setq load-prefer-newer t)
(package-initialize)
(setq package-archives (append
                        package-archives
                        '(("melpa" . "https://melpa.org/packages/")
                          ("elpa" . "https://elpa.nongnu.org/nongnu/"))))
```

The `use-package` macro by John Wiegley greatly improves the readability, configurability,
uniformity, and maintainability of third-party packages. Additionaly, I use
`quelpa-use-package`, which allows you to install packages from some git host using
use-package.

```emacs-lisp
(eval-when-compile
  (require 'use-package)
  (require 'quelpa-use-package))
(setq use-package-always-ensure t)
(require 'bind-key)
```

The `async` package lets you install packages asynchronously. Quite useful to speed up
installation of packages.

```emacs-lisp
(use-package async
  :config (setq async-bytecomp-package-mode 1))
```


## Aesthetics {#aesthetics}


### Interface components {#interface-components}

Frames should have transparent title bars and must have dimensions 58x291.

```emacs-lisp
(setq default-frame-alist '((ns-transparent-titlebar . t)
                            (height . 48) (width . 159)))
```

Emacs' GUI has a number of modes enabled, such as toolbar mode, which I never use. Like
most Emacs users, I always turn it off:

```emacs-lisp
(tool-bar-mode -1)
(scroll-bar-mode -1)
(tooltip-mode -1)
```

I also set the fringe a little wider to ensure the text isn't too close to the window
border:

```emacs-lisp
(fringe-mode 16)
```

Use a non-blinking horizontal line as cursor. I like the minimal look:

```emacs-lisp
(blink-cursor-mode nil)
(setq-default cursor-type 'hbar)
```

```emacs-lisp
(fset 'yes-or-no-p 'y-or-n-p)
(setq ring-bell-function 'ignore)
```

The modeline in Emacs displays all information about your files, buffers, and active
modes. The `moody` and `minions` packages simplify the modeline a bit.

```emacs-lisp
(use-package moody
  :config
  (setq x-underline-at-descent-line t)
  (moody-replace-mode-line-buffer-identification)
  (moody-replace-vc-mode))

(use-package minions
  :config (minions-mode 1))
```

The package diminish helps to de-clutter the modeline.

```emacs-lisp
(use-package diminish)
```

Emacs's tab-bar-mode is great to keep you buffers organized. It's a bit different from
tabs in Firefox or other popular text editors, as it provides tabs for collections
windows, rather than a single window.

```emacs-lisp
(setq tab-bar-mode t)
(setq tab-bar-show nil)
(setq frame-title-format '((:eval (format "%s" (cdr (assoc 'name (tab-bar--current-tab)))))))
```


### Theming {#theming}

Endless fiddling with different themes is not the most productive activity. And yet, the
visual appeal of your working environment should not be underestimated either. I find that
it helps to maintain my appreciation for Emacs if I occasionally give the editor a visual
update. Emacs comes with many built-in color themes. Whenever switching between them, it's
important to make sure all settings are cleared instead of layering them. The following
advice function takes care of that automatically when loading another theme:

```emacs-lisp
(defadvice load-theme (before clear-previous-themes activate)
  "Clear existing theme settings instead of layering them"
  (mapc #'disable-theme custom-enabled-themes))
```

The color themes of Protesilaos Stavrou are unmatched. I usually use his
modus-themes (prefering modus operandi during the day) but have recently become a fan of
the ef-themes as well. Modus-themes let you customize almost every aspect of the theme, so
please check out the documentation. Here's my config:

```emacs-lisp
(use-package modus-themes
  :init
  (setq modus-themes-bold-constructs t
        modus-themes-completions '((matches . (extrabold intense background))
                                   (selection . (semibold accented intense))
                                   (popup . (accented)))
        modus-themes-diffs 'desaturated
        modus-themes-headings '((1 . (1.2))
                                (2 . (rainbow 1.1))
                                (3 . (1))
                                (t . (monochrome)))
        modus-themes-hl-line '(nil)
        modus-themes-links '(nil)
        modus-themes-mixed-fonts nil
        modus-themes-mode-line '(moody borderless accented)
        modus-themes-tabs-accented t
        modus-themes-prompts '(background)
        modus-themes-region '(accented bg-only)
        modus-themes-syntax '(faint)
        modus-themes-tabs-accented nil
        )
  (setq modus-themes-org-agenda
        '((header-date . (grayscale workaholic bold-today))
          (header-block . (1.5 semibold))
          (scheduled . uniform)
          (event . (italic))
          (habit . traffic-light)))
  (modus-themes-load-themes)
  :config
  (modus-themes-load-operandi)
  :bind ("<f5>" . modus-themes-toggle))
```


### Typography {#typography}

We first set the default font.

```emacs-lisp
(set-face-attribute 'default nil :family "Input Mono Compressed" :height 120)
```

Then, set the fill column to a maximum of 90 characters (10 more than the default).

```emacs-lisp
(setq-default fill-column 90)
```

A number of packages rely on icons for presentation purposes. We load the `fontawesome`
and `all-the-icons` packages, which provide a large number of icons.

```emacs-lisp
(use-package fontawesome)
(use-package all-the-icons)
```


## Completion {#completion}

Emacs has endless functions. To quickly and efficiently find the functionality you're
looking for, several completion frameworks have been developed. I have long been using
[Ivy](https://github.com/abo-abo/swiper), a generic completion system for Emacs. Together with its companion Counsel ("a
collection of Ivy-enhanced versions of common Emacs commands") and Swiper ("an
Ivy-enhanced alternative to Isearch."), Ivy provides an environment with which you can
quickly navigate, select and filter commands. The configuration of Ivy is nothing special.
I bind search to `C-s` and adjust the regex building function for ivy-bibtex.

```emacs-lisp
(use-package ivy
  :init (ivy-mode 1)
  :config
  (setq ivy-use-virtual-buffers t
        enable-recursive-minibuffers t
        ivy-display-style 'fancy
        ivy-re-builders-alist '((ivy-bibtex . ivy--regex-ignore-order)
                                (t . ivy--regex-plus)))
  :bind (("C-s" . 'swiper-isearch)
         ("C-r" . 'swiper-backward)))
```

Ivy ensures that all commands that use the completion-read function go past Ivy. Counsel
goes a step further and modifies several well-known functions of Emacs, such as the
well-known `M-x` menu. I am far from using all the Counsel functions. The most important
ones for me are specified in the configuration below. Furthermore, I have changed the
ripgrep settings slightly to give a little more context in the results.

```emacs-lisp
(use-package counsel
  :init (counsel-mode t)
  :bind (("C-x C-r" . 'counsel-recentf)
         ("C-c i" . 'counsel-imenu)
         ("C-c c" . 'counsel-org-capture)
         ("C-x b" . 'ivy-switch-buffer))
  :config
  (setq counsel-grep-base-command "grep -niE %s %s")
  (setq counsel-grep-base-command
        ;; "ag --nocolor --nogroup %s %s")
        "rg -S -M 120 --no-heading --line-number --color never %s %s")
  (setq counsel-find-file-occur-cmd
        "gls -a | grep -i -E '%s' | gxargs -d '\\n' gls -d --group-directories-first")
  (setq counsel-locate-cmd 'counsel-locate-cmd-mdfind))
```

Ivy presents lists. The package `prescient` takes these lists, then sorts and filters
them. It works nicely with Counsel too.

```emacs-lisp
(use-package prescient
  :config
  (prescient-persist-mode))

(use-package ivy-prescient
  :config (ivy-prescient-mode))
```

Hydra's are great to create key binding menu's that stick around. Before, I had more
defined. Now only a few.

```emacs-lisp
(use-package ivy-hydra)
```

The `which-key` package is great for discoverability and memorability of functionalities.
The package gives completions for keybindings. For example, type `C-c` and which-key
returns all key bindings that follow that combination. Really useful, since there are just
too many key bindings...

```emacs-lisp
(use-package which-key
  :diminish
  :init
  (progn
    (setq which-key-idle-delay 1.0)
    (which-key-mode)))
```


## Editing {#editing}

They call it a text editor for a reason. I first make some customizations to various
editing functions and settings, starting with tabs, which we all hate, so let's turn them
off:

```emacs-lisp
(setq-default indent-tabs-mode nil
              tab-always-indent 'complete
              tab-width 4)
```

The default mode in Emacs is Emacs lisp. For my work, it's better to set this to text:

```emacs-lisp
(setq-default initial-major-mode 'text-mode
              default-major-mode 'text-mode)
```

The option to add a double space following a period is so old, it's hard to find exactly
when it was introduced. The documentation says "at or before Emacs version 19.24". We're
now at emacs 29, and I'm still turing it off:

```emacs-lisp
(setq sentence-end-double-space nil)
```

Highlighting matching parentheses helps catching syntax errors early on:

```emacs-lisp
(show-paren-mode t)
```

Emacs &gt;=29 has support for pixel scrolling. This greatly improves editing files with
images:

```emacs-lisp
(pixel-scroll-precision-mode)
```

When working on text, I prefer auto-filll which breaks lines after a set number of
characters. Hard breakes help with putting text files under git control. To auto-fill all
text related modes, we add the mode to the text mode hook:

```emacs-lisp
(add-hook 'text-mode-hook #'auto-fill-mode)
```

When files change on disk, update the buffer automatically:

```emacs-lisp
(global-auto-revert-mode t)
```

Emacs is quick to warn about large files. With the new large file support this is
certainly no longer necessary. I raise the threshold a bit:

```emacs-lisp
(setq large-file-warning-threshold 100000000)
```

Next are some packages to make editing even easier with Emacs. First two packages for
easier navigation. `avy` offers a great way to navigate your document without touching the
mouse. It allows you to jump to text in a decision tree like strategy. There are many
different search options, but I tend to use only two of them. The first,
`avy-goto-char-timer` allows you to type in part of a word within a certain time limit
before avy presents the selection keys. The second one shows selection keys for each line
in all visible buffers.

```emacs-lisp
(use-package avy
  :bind (("M-j" . 'avy-goto-char-timer)
         ("M-\\" . 'avy-goto-line)))
```

Ace-window is another package by the same author, Oleh Krehel, which allows you to quickly
switch and manipulate windows in Emacs. I bind it to `M-o`, as I use it quite often and
that's an easy binding.

```emacs-lisp
(use-package ace-window
  :config
  (set-face-attribute
   'aw-leading-char-face nil
   :weight 'bold
   :height 2.0)
  (setq aw-keys '(?a ?s ?d ?f ?g ?h ?j ?k ?l))
  :bind (("M-o" . 'ace-window)))
```

I think Sublime text was the first text editor to offer simultaneous editing with multiple
cursors -- a feature so powerful that nowadays practically all editors (even Jupyter
notebooks!) implement the feature. For Emacs we rely on the package `multiple-cursors`,
which is a stable package that offers a similar experience.

```emacs-lisp
(use-package multiple-cursors
  :bind (("C-S-c C-S-c" . mc/edit-lines)
         ("C->"         . mc/mark-next-like-this)
         ("C-<"         . mc/mark-previous-like-this)
         ("C-c C-<"     . mc/mark-all-like-this)
         ("M-<down-mouse-1>" . mc/add-cursor-on-click)
         ("C-c m" . vr/mc-mark)))
```

The package `expand-region` provides a nifty way to select parts of text of code. By
repeating the keybinding, the selected region will be expanded semantically. For example,
when inside a list comprehension that's part of a function in Python, expand region would
first select everything inside the list comprehension, and then its immediate semantic
parent, i.e. the function.

```emacs-lisp
(use-package expand-region
  :bind ("C-=" . er/expand-region))
```

The `electric` package, part of Emacs, enable automatic paren and quote pairing. It's
simple but effective.

```emacs-lisp
(use-package electric
  :ensure nil
  :config (electric-pair-mode 1))
```

The package `move-text` provides a little utility function to easily move the current line
or region up and down. It's bound to Cmd+arrow up or arrow down.

```emacs-lisp
(use-package move-text
  :config (move-text-default-bindings))
```

Highlighting the current line gives some visual support when editing files. I turn it on
globally:

```emacs-lisp
(use-package hl-line
  :ensure nil
  :custom-face (hl-line ((t (:extend t))))
  :hook (after-init . global-hl-line-mode))
```

Sometimes having too many buffers around is distracting. The Olivetti mode helps focussing
on writing by centering your document and increasing the margins. I set the style to
"fancy", which sets both margins and fringe:

```emacs-lisp
(use-package olivetti
  :config (setq olivetti-style 'fancy))
```

For editing csv files, I rely on `csv-mode`:

```emacs-lisp
(use-package csv-mode
  :defer t)
```

Likewise, YAML files are edited with the `yaml-mode`:

```emacs-lisp
(use-package yaml-mode
  :mode (("\\.yml\\'" . yaml-mode)))
```


## System management {#system-management}


### Dired {#dired}

Dired is the main mode for doing all kinds of file management. Below are some
customizations to let it play nicely with macOS. To use these, make sure gls is install
through brew.

```emacs-lisp
(when (string= system-type "darwin")
  (setq dired-use-ls-dired nil))

(setq insert-directory-program "gls" dired-use-ls-dired t)
(setq dired-recursive-deletes 'always)
```

While already really good, the package `dirvish` an improved version of dired. It offers a
much more appealing interface, which is easily customizable. Most importantly, dirvish
helps discovering all kinds of nifty tricks inside dired that I didn't know about.

```emacs-lisp
(use-package dirvish
  :init
  (dirvish-override-dired-mode)
  :custom
  (dirvish-quick-access-entries
   '(("h" "~/"                          "Home")
     ("d" "~/.emacs.d/"                 "Emacs")
     ("p" "~/projects"                  "Projects")
     ("t" "~/.local/share/Trash/files/" "TrashCan")))
  (dirvish-mode-line-format
   '(:left (sort file-time " " file-size symlink) :right (omit yank index)))
  ;; Don't worry, Dirvish is still performant even you enable all these attributes
  (dirvish-attributes '(all-the-icons collapse subtree-state vc-state git-msg))
  :config
  (setq dired-dwim-target t)
  (setq delete-by-moving-to-trash t)
  ;; Enable mouse drag-and-drop files to other applications
  (setq dired-mouse-drag-files t)                   ; added in Emacs 29
  (setq mouse-drag-and-drop-region-cross-program t) ; added in Emacs 29
  (setq dired-listing-switches
        "-l --almost-all --human-readable --time-style=long-iso --group-directories-first --no-group")
  :bind
  ;; Bind `dirvish|dirvish-side|dirvish-dwim' as you see fit
  (("C-c f" . dirvish-fd)
   ;; Dirvish has all the keybindings in `dired-mode-map' already
   :map dirvish-mode-map
   ("a"   . dirvish-quick-access)
   ("f"   . dirvish-file-info-menu)
   ("y"   . dirvish-yank-menu)
   ("N"   . dirvish-narrow)
   ("^"   . dirvish-history-last)
   ("h"   . dirvish-history-jump) ; remapped `describe-mode'
   ("s"   . dirvish-quicksort)    ; remapped `dired-sort-toggle-or-edit'
   ("v"   . dirvish-vc-menu)      ; remapped `dired-view-file'
   ("TAB" . dirvish-subtree-toggle)
   ("M-f" . dirvish-history-go-forward)
   ("M-b" . dirvish-history-go-backward)
   ("M-l" . dirvish-ls-switches-menu)
   ("M-m" . dirvish-mark-menu)
   ("M-t" . dirvish-layout-toggle)
   ("M-s" . dirvish-setup-menu)
   ("M-e" . dirvish-emerge-menu)
   ("M-j" . dirvish-fd-jump)))
```


### Backups / Recovery / Recent files {#backups-recovery-recent-files}

Most of my projects are under git control, but still we need a way to ensure local backups
in case something goes wrong locally before pushing changes to the remote. By default,
Emacs makes backups in the working directory, but that creates some serious clutter. So, I
prefer to store then in one place.

```emacs-lisp
(setq backup-by-copying t)
(setq backup-directory-alist '(("." . "~/.emacs.d/backups")))
(setq delete-old-versions t)
(setq version-control t)
(setq create-lockfiles nil)
```

`recentf` is a minor mode in Emacs that creates a list of recently visited files.
Completion frontend such as Ivy can then use this list to present to the user. I exclude
some files I certainly never want to revisit, and also set the maximum number of saved
items to 500.

```emacs-lisp
(use-package recentf
  :config
  (setq recentf-exclude '("COMMIT_MSG" "COMMIT_EDITMSG" "github.*txt$"
                          "[0-9a-f]\\{32\\}-[0-9a-f]\\{32\\}\\.org"
                          ".*png$" ".*cache$"))
  (setq recentf-max-saved-items 500))
```

Finally, we use the minor save-place-mode to save place in each file, which is rather
handy upon revisiting files.

```emacs-lisp
(save-place-mode 1)
```


### Tramp {#tramp}

Tramp is great for working on remote files. The config is simple:

```emacs-lisp
(use-package tramp
  :ensure nil
  :defer t
  :config
  (setq tramp-default-user "folgertk"
        tramp-default-method "ssh")
  (use-package counsel-tramp
    :bind ("C-c t" . counsel-tramp))
  (put 'temporary-file-directory 'standard-value '("/tmp")))
```


## Project Management {#project-management}

For project management, I use Projectile. This project interaction library provides all
kinds of nice features that operate on the project level.

```emacs-lisp
(use-package projectile
  :diminish
  :config
  (setq projectile-completion-system 'ivy)
  (setq projectile-switch-project-action #'projectile-dired)
  :bind (:map projectile-mode-map
              ("C-c p" . projectile-command-map))
  :init (projectile-mode +1))
```

Projectile is integrated with counsel through `counsel-projectile`. All projects are
opened in dedicated tabs.

```emacs-lisp
(defun projectile-name-tab-by-project-name-or-default ()
  (let ((project-name (projectile-project-name)))
    (if (string= "-" project-name)
        (tab-bar-tab-name-current)
      project-name)))

(setq tab-bar-tab-name-function #'projectile-name-tab-by-project-name-or-default)

(defun counsel-projectile-switch-project-action-dired-new-tab (project)
  (let* ((project-name (file-name-nondirectory (directory-file-name project)))
         (tab-bar-index (tab-bar--tab-index-by-name project-name)))
    (if tab-bar-index
        (tab-bar-select-tab (+ tab-bar-index 1))
      (progn
        (tab-bar-new-tab)
        (let ((projectile-switch-project-action 'projectile-dired))
          (counsel-projectile-switch-project-by-name project))
        (dirvish-side)))))

(defun projectile-kill-buffers-and-enclosing-tab ()
  (interactive)
  (let* ((project-name (projectile-project-name))
         (tab-bar-index (tab-bar--tab-index-by-name project-name)))
    (when tab-bar-index
      (projectile-kill-buffers)
      (tab-bar-switch-to-recent-tab)
      (tab-bar-close-tab (+ tab-bar-index 1)))))

(use-package counsel-projectile
  :after projectile
  :init (counsel-projectile-mode)
  :config
  ;; I want projectile to open dired upon selecting a project.
  (counsel-projectile-modify-action
   'counsel-projectile-switch-project-action
   '((add ("T" counsel-projectile-switch-project-action-dired-new-tab "open in new tab") 1)))
  :bind (:map projectile-mode-map
              ("C-c p k" . projectile-kill-buffers-and-enclosing-tab)))
```


## Git {#git}

Magit -- A Git Porcelain inside Emacs is _the_ git interface for Emacs. There's simply no
way to describe just how good this is. It's one of a kind and of those packages that makes
me want to stick with Emacs. Customization isn't really necessary, except perhaps for some
keybindings:

```emacs-lisp
(use-package magit
  :config
  (setq magit-git-executable "/usr/bin/git")
  :bind (("C-x g" . magit-status)
         ("C-c M-g" . magit-file-popup)))
```

Keep you git repositories clean! The package `gitignore-templates` is a great help to do that.

```emacs-lisp
(use-package gitignore-templates
  :defer t)
```


## Writing {#writing}


### Org mode {#org-mode}

Org mode is one of the main reasons I use Emacs. Org is a mode in which I take notes of
articles and meetings, write blogs, keep bookmarks, organize all my appointments in it,
develop a backlog and project schedule and all sorts of other things. For a scientific
researcher, org-mode is the best piece of software available because you can configure
everything, but really everything, to fit your workflow exactly. Some people think that is
also a risk of org-mode and Emacs in general. But I think adaptability and flexibility are
crucial since your workflow always changes a little bit. Emacs and Org-mode make it
possible to customize my academic toolbox exactly to my needs. My configuration for
Org-mode is quite extensive. I will first discuss a set of general settings. Then I'll
cover my calendar setup and my org-roam settings.

```emacs-lisp
(use-package org :ensure org-contrib)
```


#### Agenda {#agenda}

My org agenda consists of entries spread across five documents. In `inbox.org` I keep all
my unctegorized to-do's, notes and thoughts. By temporarily storing all new entries in an
inbox, I limit the time I'm distracted. In `agenda.org` I keep all the appointments,
meetings, zoom-calls, lectures and so on. I usually do not put todo's here, just entries
that are scheduled for a particular day or time. In `projects.org` I keep a backlog of all
the projects I am working on. In `habits.org` I keep a number of habits, such as going to
exercise, watering the plants, and whether I need a haircut again 🙃. Finally, in
`readlist.org` I keep a list of links to articles in Zotero that I still want to read.

```emacs-lisp
(defvar my-agenda-files '("inbox.org" "projects.org" "habits.org" "agenda.org" "leeslijst.org"))
(setq org-directory "~/org"
      org-agenda-files (mapcar
                        (lambda (f) (concat (file-name-as-directory org-directory) f))
                        my-agenda-files)
      org-default-notes-file (concat (file-name-as-directory org-directory) "notes.org"))
```

Crucial to my workflow is org-mode's "refiling" functionality. Refiling means moving
entries or nodes to specific locations in other files. This is quite handy when moving all
entries collected in my inbox to the appropriate locations. I usually refile entries to
one of the projects in `projects.org`. Each project therein has two main sections, "notes"
and "tasks." To quickly move entries to these two sections, I modify the variable
`org-refile-targets` below.

```emacs-lisp
(mapc (lambda (item)
        (setf (alist-get item ivy-initial-inputs-alist) ""))
      '(org-refile org-agenda-refile org-capture-refile))

(setq org-refile-use-outline-path 'file
      org-outline-path-complete-in-steps nil
      org-refile-allow-creating-parent-nodes 'confirm
      org-refile-targets '((org-agenda-files :maxlevel . 2))
      org-refile-targets '(("projects.org" :regexp . "\\(?:\\(?:Note\\|Task\\)s\\)")))
```

Todo's can be in two stages: done or not. When not, they are given the keyword "TODO." If
I am waiting for input from someone else or for some other reason can't continue working
on a todo, then I set the entry to "WAITING". When todo's are done I set them to "DONE",
and if I don't continue working on them for some reason, I set the keyword to "CANCELLED".

```emacs-lisp
(setq org-todo-keywords '((sequence "TODO" "WAITING" "|" "DONE" "CANCELLED"))
      org-enforce-todo-dependencies t)
```

For making reports, I like to log when I completed a todo. I store that information in
org-mode drawers.

```emacs-lisp
(setq org-log-done 'time  ; when marking a todo as done, at the time
      org-log-into-drawer t)  ; log into drawers right underneath the heading
```

Like "refiling," Org-mode's "capture" functionality allows me to quickly save notes and
thoughts without being distracted for too long. Org capture works with templates that
allow different types of capture items to be quickly park. Below I define four of them.
The first is for new todo items, which automatically land in my inbox. The second is for
appointments. Captured appointments are automatically placed in the calendar under "future
appointments." Then there is a template for adding items to my reading list, and finally a
template for notes that also end up in my inbox.

```emacs-lisp
(setq org-capture-templates
      '(("t" "Todo" entry (file+headline "~/org/inbox.org" "Tasks")
         "* TODO %^{Todo} %^G \n:PROPERTIES:\n:CREATED: %U\n:END:\n\n%?"
         :empty-lines 1)
        ("m" "Meeting" entry (file+headline "~/org/agenda.org" "Toekomstig")
         "* %^{Description} :meeting:\n%^t"
         :empty-lines 1)
        ("r" "Read" entry (file+headline "~/org/leeslijst.org" "Articles")
         "* TODO %c \n:PROPERTIES:\n:CREATED: %U\n:END:\n\n%?"
         :empty-lines 1)
        ("n" "Note" entry (file+headline "~/org/inbox.org" "Notes")
         "* %^{Title} %^G \n:PROPERTIES:\n:CREATED: %U\n:END:\n\n%?"
         :empty-lines 1)))
```

For replying to email I also made a template. For this but I use the package
`org-mac-link`, which provides functionality to link to text in applications outside of
Emacs, such as the Address Book, Firefox, Safari, Finder, and to Mail. The ability to link
to Mail is particularly useful. It works as follows. All mails in Mail have a unique
message ID. That ID remains the same when the mail is moved to another folder. By linking
to a mail's ID, I can easily record notes or todo's for emails.

```emacs-lisp
(add-to-list 'load-path (expand-file-name "org-mac-link" "~/.emacs.d/gitrepos"))
(require 'org-mac-link)
(add-hook 'org-mode-hook (lambda ()
(define-key org-mode-map (kbd "C-c g") 'org-mac-link-get-link)))

(org-add-link-type "message" 'org-mac-message-open)

(defun org-mac-message-open (message-id)
  "Visit the message with MESSAGE-ID.
   This will use the command `open' with the message URL."
  (browse-url (concat "message://%3c" (substring message-id 2) "%3e")))
```

The corresponding capture template is as follows:

```emacs-lisp
(setq org-capture-template
      (append org-capture-templates
              '(("e" "Mail" entry (file+headline "~/org/inbox.org" "Mail")
                 "* TODO  %(org-mac-message-get-links \"s\") %^g \n:PROPERTIES:\n:CREATED: %U\n:END:\n\n%?"
                 :empty-lines 1))))
```

The final capture template is for storing bookmarks. I keep links to interesting web pages
in a file called `bookmarks.org`. I use `org-cliplink` to copy URLs from the clipboard to
a file. The nice thing about this packages is that it automatically uses the title of the
website for displaying the link.

```emacs-lisp
(setq org-capture-template
      (append org-capture-templates
              '(("l" "Link" entry (file+headline "~/org/bookmarks.org" "Bookmarks")
                 "* %(org-cliplink-capture) %^g \n:PROPERTIES:\n:CREATED: %U\n:END:\n\n%?"
                 :empty-lines 1))))

(use-package org-cliplink
  :defer t
  :after org)
```

Org's Agenda mode aggregates all TODO's and scheduled items from the different agenda
files and presents them in a nice overview. To easily customize this overview, I use the
`org-super-agenda` package, which allows you to group TODOs on all kinds of criteria.

```emacs-lisp
(use-package org-super-agenda
  :after org
  :config
  (use-package origami
    :bind (:map org-super-agenda-header-map ("<tab>" . origami-toggle-node))
    :hook (org-agenda-mode . origami-mode)))

(add-hook 'org-agenda-mode-hook 'org-super-agenda-mode)
```

Below are some preferences for Org's agenda:

```emacs-lisp
(setq org-agenda-search-view-always-boolean t
      org-agenda-block-separator (propertize
                                  (make-string (frame-width) ?\u2594)
                                  'face '(:foreground "grey38"))
      org-super-agenda-header-separator ""
      org-habit-show-habits-only-for-today nil
      org-agenda-restore-windows-after-quit t
      org-agenda-show-future-repeats nil
      org-deadline-warning-days 2
      org-agenda-window-setup 'current
      org-agenda-span 'day
      org-agenda-start-on-weekday 1 ;; nil
      org-agenda-skip-deadline-prewarning-if-scheduled t
      org-agenda-skip-scheduled-if-done t
      org-agenda-skip-deadline-if-done t
      org-agenda-format-date "\n%A, %-e %B %Y"
      org-agenda-dim-blocked-tasks t)
```

{{< figure src="/ox-hugo/2022-12-24_16-59-13_Screenshot 2022-12-24 at 16.45.08.png" >}}

My agenda view consist of three windows, which are displayed in a dedicated tab. The first
presents the agenda of the current day. The second displays my project backlog, including
TODOs temporarily stored in my Inbox, as well as articles I want to read. These different
views are stored in the variable `org-agenda-custom-commands`. First, we add a view for my
daily tasks:

```emacs-lisp
(setq org-agenda-custom-commands
      '(("d" "Dagelijkse Takenlijst"
         ((agenda ""
                  ((org-agenda-overriding-header " Planner")
                   (org-agenda-prefix-format '((agenda . " %?-12t")))
                   (org-agenda-span 'day)
                   (org-deadline-warning-days 0)
                   (org-super-agenda-groups
                    '((:name "" :time-grid t :scheduled t :deadline t :category "verjaardag")
                      (:discard (:anything t))))))))))
```

Next, we define the project backlog view. The view consist of three sections: one for
unsorted TODOs in the inbox, one with all project TODOs grouped by category (which
coincides with the project name in my case), and a final section with articles I plan to
read.

```emacs-lisp
(org-super-agenda--def-auto-group category "their org-category property"
  :key-form (org-super-agenda--when-with-marker-buffer (org-super-agenda--get-marker item)
              (org-get-category))
  :header-form (concat " " key))

(setq org-agenda-custom-commands (append org-agenda-custom-commands
        '(("p" "Project backlog"
          ((todo "TODO|NEXT|WAITING|HOLD"
                ((org-agenda-overriding-header " Inbox\n")
                 (org-agenda-prefix-format "  ")
                 (org-agenda-files '("~/org/inbox.org"))))
          (todo "TODO|NEXT|WAITING|HOLD"
                 ((org-agenda-overriding-header " Project TODOs")
                 (org-agenda-prefix-format "  ")
                  (org-agenda-files '("~/org/projects.org"))
                  (org-super-agenda-groups
                   '((:discard (:scheduled t :date t))
                     (:auto-category t)
                     (:discard (:anything t))))))
          (todo "TODO|NEXT"
                ((org-agenda-overriding-header " Reading List")
                 (org-agenda-prefix-format "  ")
                 (org-agenda-files '("~/org/leeslijst.org"))
                 (org-super-agenda-groups
                  '((:discard (:scheduled t))
                    (:name " Priority A reading" :priority "A")
                    (:name " Priority B reading" :priority "B")
                    (:name " Priority C reading" :priority "C")
                     (:discard (:anything t)))))))))))
```

The final view, then, is used to present a weekly overview of completed tasks.

```emacs-lisp
(defun format-closed-query ()
  (format "+TODO=\"DONE\"+CLOSED>=\"<-%sd>\"" (read-string "Number of days: ")))
(setq org-agenda-custom-commands (append org-agenda-custom-commands
        '(("w" "Weekly review"
         ((tags (format-closed-query)
                ((org-agenda-overriding-header "Overview of DONE tasks")
                 (org-agenda-archives-mode t))))))))
```

The third and final window displays a calendar view. Currently I use calfw and calfw-org
which displays all my TODOs in a calendar view much like those you find in popular
calendar apps.

```emacs-lisp
;; Functions to keep calendar in sight when working on the agenda
(defun fk-window-displaying-agenda-p (window)
  (equal (with-current-buffer (window-buffer window) major-mode)
         'org-agenda-mode))

(defun fk-position-calendar-buffer (buffer alist)
  (let ((agenda-window (car (remove-if-not #'fk-window-displaying-agenda-p (window-list)))))
    (when agenda-window
      (if (not (get-buffer-window "*Calendar*"))
          (let ((desired-window (split-window agenda-window nil 'below)))
            (set-window-buffer desired-window buffer)
            desired-window)))))

(add-to-list 'display-buffer-alist (cons "\\*Calendar\\*" (cons #'fk-position-calendar-buffer nil)))
(use-package calfw)
(use-package calfw-org)
```

The following functions create this custom view:

```emacs-lisp
(defun side-by-side-agenda-view ()
  (progn
    (org-agenda nil "a")
    (split-window-right)
    (org-agenda-redo)
    (split-window-below)
    (other-window 1)
    (cfw:open-org-calendar)
    (setq org-agenda-sticky t)
    (other-window 1)
    (org-agenda nil "p")
    (setq org-agenda-sticky nil)))

(defun show-my-agenda ()
  (interactive)
  (let ((tab-bar-index (tab-bar--tab-index-by-name "Agenda")))
    (if tab-bar-index
        (tab-bar-select-tab (+ tab-bar-index 1))
      (progn
        (tab-bar-new-tab)
        (tab-bar-rename-tab "Agenda")
        (side-by-side-agenda-view)
        (message "Agenda loaded")))))
```


#### Org Roam {#org-roam}

I use Org Roam for note keeping. Org Roam is much like Roam research, Obsidian, and other
tools for so-called \`networked thought'. Org Roam provides a simple system to connect
files with links and backlinks, thus forming a graph or network of all your notes. I
mainly use it for research, and sometimes publish seperate notebooks on my website.

```emacs-lisp
(use-package org-roam
  :init
  (setq org-roam-v2-ack t)
  :hook
  (after-init . org-roam-mode)
  :custom
  (org-roam-directory (file-truename "~/kaartenbak"))
  :bind (("C-c o l" . org-roam-buffer-toggle)
         ("C-c o f" . org-roam-node-find)
         ("C-c o g" . org-roam-graph)
         ("C-c o i" . org-roam-node-insert)
         ("C-c o c" . org-roam-capture)
         ;; Dailies
         ("C-c o j" . org-roam-dailies-capture-today))
  :config
  (org-roam-setup)
  (setq org-roam-db-gc-threshold (* 10 1024 1024))
  ;; If using org-roam-protocol
  (require 'org-roam-protocol)
  (require 'org-roam-export) ;; check whether this helps exporting
  (setq org-roam-dailies-directory "daily/")
  (setq org-roam-dailies-capture-templates
      '(("d" "default" entry
         "* %?"
         :if-new (file+head "%<%Y-%m-%d>.org"
                            "#+title: %<%Y-%m-%d>\n")))))

(use-package org-roam-bibtex
  :hook (org-roam-mode . org-roam-bibtex-mode)
  :after org-roam)
```

Org Roam already provides good text-based visualizations of the network, but sometimes
it's nice to actually browse the network in a visual graph. The package org-roam-ui gives
you a way to browse the network in an interactive graph which is rendered in the browser.
It's quite useful, and often helps remembering certain relationships between notes.

```emacs-lisp
(use-package org-roam-ui
  :after org-roam
  :config
  (setq org-roam-ui-sync-theme t
        org-roam-ui-follow t
        org-roam-ui-update-on-save t
        org-roam-ui-browser-function #'browse-url-chromium
        org-roam-ui-open-on-start nil))
```

Here's a picture of the network:

{{< figure src="/ox-hugo/2022-12-24_16-40-43_Screenshot 2022-12-24 at 16.40.27.png" >}}

The starting point of my org roam is a slipbox (kaartenbak), which I open in a new
dedicated tab with the following utility function:

```emacs-lisp
(defun open-kaartenbak ()
  (interactive)
  (let ((tab-bar-index (tab-bar--tab-index-by-name "Kaartenbak")))
    (if tab-bar-index
        (tab-bar-switch-to-tab (+ tab-bar-index 1))
      (progn
        (tab-bar-new-tab)
        (tab-bar-rename-tab "Kaartenbak")
        (find-file "~/kaartenbak/20210727213932-kaartenbak.org")))))
```


#### Uncategorized settings {#uncategorized-settings}

Below are some tweaks to make editing org files a little more enjoyable to make.

```emacs-lisp
(setq org-use-speed-commands t  ; set to true for navigation with shortcuts
      org-image-actual-width (list 550) ; resize the width of images
      org-format-latex-options (plist-put org-format-latex-options :scale 1.5)
      org-src-fontify-natively t  ; use auctex for formatting latex in org
      org-hide-leading-stars nil  ; Show all stars of headers
      org-adapt-indentation nil   ; Don't indent subsections (helps org-babel code blocks)
      org-cite-global-bibliography '("~/org/bib.bib")  ; for citing references
      org-latex-create-formula-image-program 'dvisvgm
      org-latex-default-class "tufte-handout"
      org-highlight-latex-and-related '(native))
```

Org-download is a convenient package for adding images or information from websites to org
documents.

```emacs-lisp
(use-package org-download)
```


### Blogging {#blogging}

My [website](https://www.karsdorp.io) is built with [Hugo](https://gohugo.io/), a popular static site generator. The package ox-hugo
provides a convenient bridge between my prefered writing system, org-mode and Hugo. It
allows me to export notes in roam or basically any note I want to my website.
Configuration is straightforward:

```emacs-lisp
(use-package ox-hugo
  :config
  (require 'oc-csl)
  (setq org-hugo-base-dir "~/local/folgertk/")
  (setq org-hugo--preprocess-buffer nil)
  (setq org-hugo-auto-set-lastmod t)
  (setq org-cite-csl-styles-dir "~/Zotero/styles")
  (setq org-cite-export-processors '((t csl)))
  :after ox)
```


### LaTeX {#latex}

Auctex is the go-to package for LaTeX editing in Emacs. It's been there for a while. It's
reliable, flexible, and doesn't get in your way.

```emacs-lisp
(use-package tex
  :defer t
  :ensure auctex
  :init
  (progn
    (setq TeX-auto-save t
          TeX-parse-self t
          TeX-PDF-mode 1
          ;; Don't insert line-break at inline math
          LaTeX-fill-break-at-separators nil
          TeX-view-program-list
          '(("Preview.app" "open -a Preview.app %o")
            ("Skim" "open -a Skim.app %o")
            ("displayline" "displayline -g -b %n %o %b")
            ("open" "open %o"))
          TeX-view-program-selection
          '((output-dvi "open")
            (output-pdf "Skim")
            (output-html "open")))
    (add-hook 'TeX-mode-hook #'turn-on-reftex))
  :config
  (bind-key "C-c h l" 'hydra-langtool/body TeX-mode-map)
  (company-auctex-init))
```

`ox-latex` is used for exporting org documents to LaTeX. Here I add some customization to
export with Tufte Handout by default and add the LaTeX `minted` package for exporting
blocks of code.

```emacs-lisp
(use-package ox-latex
  :ensure nil
  :defer t
  :config
  (add-to-list 'org-latex-packages-alist '("" "minted"))
  (setq org-latex-listings 'minted)

  (setq org-latex-pdf-process
        '("pdflatex -shell-escape -interaction nonstopmode -output-directory %o %f"
          "pdflatex -shell-escape -interaction nonstopmode -output-directory %o %f"
          "pdflatex -shell-escape -interaction nonstopmode -output-directory %o %f"))

  (add-to-list 'org-latex-classes
             '("tufte-handout"
               "\\documentclass{tufte-handout}"
               ("\\section{%s}" . "\\section*{%s}")
               ("\\subsection{%s}" . "\\subsection*{%s}")
               ("\\subsubsection{%s}" . "\\subsubsection*{%s}")
               ("\\paragraph{%s}" . "\\paragraph*{%s}")
               ("\\subparagraph{%s}" . "\\subparagraph*{%s}"))))
```


### Bibliography management {#bibliography-management}

BibTeX support comes from the `bibtex` package. No special customization:

```emacs-lisp
(use-package bibtex
  :mode (("\\.bib\\'" . bibtex-mode)))
```

{{< figure src="/ox-hugo/2022-12-23_09-37-53_Screenshot 2022-12-23 at 09.37.23.png" >}}

Ivy-BibTeX is an extension to Ivy that allows you to search a BibTeX bibliography. Since
it is based on Ivy, it has advanced search capabilities enabling you to find what you are
looking for very quickly. The package is integrated with the different writing modes of
Emacs, such as Markdown, LaTeX and Orgmode. It works on the basis of a .bib file. I use
the bibliography manager Zotero to make one. Zotero's "better bibtex" plugin monitors
changes in the bibliographic database and automatically exports a new version of the
BibTeX file if there are any changes. Here is the complete configuration:

```emacs-lisp
(use-package ivy-bibtex
  :bind*
  ("C-c C-r" . ivy-bibtex)
  :config
  (setq bibtex-completion-bibliography "~/org/bib.bib")
  (setq bibtex-completion-pdf-field "File")
  (setq bibtex-completion-pdf-open-function 'bibtex-pdf-open-function)
  (setq ivy-bibtex-default-action #'ivy-bibtex-insert-citation)
  (setq bibtex-completion-display-formats '((t . "${author:36} ${title:*} ${year:4} ${=type=:7}")))
  (setq bibtex-completion-format-citation-functions
        '((org-mode      . bibtex-completion-format-citation-org-cite)
          (latex-mode    . bibtex-completion-format-citation-cite)
          (markdown-mode . bibtex-completion-format-citation-pandoc-citeproc)
          (default       . bibtex-completion-format-citation-default)))
  (ivy-bibtex-ivify-action add-to-reading-list ivy-bibtex-add-to-reading-list)
  (ivy-bibtex-ivify-action show-pdf-in-finder ivy-bibtex-show-pdf-in-finder)
  (ivy-bibtex-ivify-action read-on-remarkable ivy-bibtex-read-on-remarkable)
  (ivy-add-actions 'ivy-bibtex '(("R" ivy-bibtex-add-to-reading-list "add to reading list")))
  (ivy-add-actions 'ivy-bibtex '(("F" ivy-bibtex-show-pdf-in-finder "show in finder")))
  (ivy-add-actions 'ivy-bibtex '(("M" ivy-bibtex-read-on-remarkable "read on remarkable"))))
```

I added some "actions" to those that ivy-bibtex itself provides. The first action, tied to
the "R" key, is "add to reading list". This action allows you to efficiently add
bibliographic entries to the reading list in the org agenda by typing "R" at a selected
entry. A capture buffer is presented to add some notes. The function that makes this
possible is the following:

```emacs-lisp
(defun add-to-reading-list (keys &optional fallback-action)
  (let ((link (bibtex-completion-format-citation-org-title-link-to-PDF keys)))
    (kill-new link)
    (org-capture nil "r")))
```

To read PDFs, I prefer to use my [Remarkable tablet](https://remarkable.com/). It is just a lot of hassle to select
an entry from Zotero, find the corresponding PDF, and then put it on my Remarkable tablet.
The function `read-on-remarkable` makes all this a lot easier. Find an entry with
Ivy-bibtex and send the corresponding PDF directly from Emacs to the Remarkable using the
Remarkable API, rmapi.

```emacs-lisp
(defun read-on-remarkable (keys &optional fallback-action)
  (let ((fpath (car (bibtex-completion-find-pdf (car keys)))))
    (call-process "rmapi" nil 0 nil "put" fpath)))
```

Finally, two more functions to open PDF files either in Finder or in the PDF reader Skim.
These are two functions specifically for macOS, but I assume they could easily be adapted
for other systems.

```emacs-lisp
(defun bibtex-pdf-open-function (fpath)
  (call-process "open" nil 0 nil "-a" "/Applications/Skim.app" fpath))

(defun show-pdf-in-finder (keys &optional fallback-action)
  (let ((dir (file-name-directory (car (bibtex-completion-find-pdf (car keys))))))
    (cond
     ((> (length dir) 1)
      (shell-command (concat "open " dir)))
     (t
      (message "No PDF(s) found for this entry: %s" key)))))
```

In case you want to read PDF files inside Emacs?

```emacs-lisp
(use-package pdf-tools
  :config (setq pdf-view-use-scaling t))
```


### Markdown {#markdown}

The `markdown-mode` package provides a major mode for editing Markdown files in Emacs.
Customization is pretty simple and straightforward.

```emacs-lisp
(use-package markdown-mode
  :commands (markdown-mode gfm-mode)
  :mode (("README\\.md\\'" . gfm-mode)
         ("\\.md\\'" . gfm-mode)
         ("\\.markdown\\'" . markdown-mode))
  :init (setq markdown-command "pandoc")
  :config
  (setq visual-line-column 90)
  (setq markdown-fontify-code-blocks-natively t)
  (setq markdown-enable-math t))
```

The `pandoc-mode` package provides an elegant interface to perform document conversions
using the pandoc library. It's not strictly markdown specific, but I tend to use it mainly
when working with Markdown files.

```emacs-lisp
(use-package pandoc-mode
  :after org)
```


## Programming {#programming}


### General {#general}

The development of the Language Server Protocol has made code completion for virtually all
text editors easier and more uniform. By decoupling completion from the presentation, much
like a backend and frontend, it is now possible to get the same high quality completions
in virtually every programming language. In Emacs, there are two modes that can speak with
LSP. I once chose `lsp-mode`, but the other, `eglot`, is just as good, in my opinion.
Below is my configuration, which largely consists of turning off all kinds of unnecessary
functionality (for me).

```emacs-lisp
(use-package lsp-mode
  :init
  (setq lsp-keymap-prefix "C-c l")
  :hook ((python-mode . lsp)
         ;; if you want which-key integration
         (lsp-mode . lsp-enable-which-key-integration))
  :config
  (setq lsp-enable-symbol-highlighting nil
        lsp-lens-enable nil
        lsp-headerline-breadcrumb-enable nil
        lsp-modeline-code-actions-enable nil
        lsp-diagnostics-provider :none
        lsp-modeline-diagnostics-enable nil
        lsp-completion-show-detail nil
        lsp-completion-show-kind nil
        lsp-pyright-python-executable-cmd "python3"
        )
  :commands (lsp lsp-deferred))
```

To display completions, then, I use the company framework of Emacs, which stands for
"complete any". It's purpose is to display completion candidates. Company is enabled
globally, with the exception of text modes and terminal modes. Other customizations are
failry straightforward.

```emacs-lisp
(use-package company
  :config
  (add-hook 'prog-mode-hook 'company-mode)
  (setq company-global-modes '(not text-mode term-mode markdown-mode gfm-mode))
  (setq company-selection-wrap-around t
        company-show-numbers t
        company-tooltip-align-annotations t
        company-idle-delay 0.5
        company-require-match nil
        company-minimum-prefix-length 2)
  ;; Bind next and previous selection to more intuitive keys
  (define-key company-active-map (kbd "C-n") 'company-select-next)
  (define-key company-active-map (kbd "C-p") 'company-select-previous)
  ;; (add-to-list 'company-frontends 'company-tng-frontend)
  ;; :bind (("TAB" . 'company-indent-or-complete-common)))
  :after lsp-mode
  :hook (lsp-mode . company-mode)
  :bind (:map company-active-map ("<tab>" . company-complete-selection))
  (:map lsp-mode-map ("<tab>" . company-indent-or-complete-common)))
```

The package `company-prescient` provides a way to sort completion candidates using
`prescient`.

```emacs-lisp
(use-package company-prescient
  :config (company-prescient-mode))
```


### Python {#python}

I use Pyright as a Static type checker for Python, and connect that with LSP:

```emacs-lisp
(use-package lsp-pyright
  :ensure t
  :hook (python-mode . (lambda ()
                          (require 'lsp-pyright)
                          (lsp))))  ; or lsp-deferred
```

`pyvenv` is a minor mode to work with virtual environments in Python. Nothing fancy, but
it works:

```emacs-lisp
(use-package pyvenv
  :init (setenv "WORKON_HOME" "~/.virtualenvs/"))
```

The `jupyter` package offers a REPL and org-mode source block frontend to Jupyter kernels.
This intergration with org-mode is truly amazing, as it allows you to turn any org
document into a fully interactive notebook much like Jupyter, without heaving to deal with
the unpleasantness of typing in a browser. It also gives me all the benefits of working in
org mode, including the integration with my agenda, making notes in org roam, and my blog.

```emacs-lisp
(use-package jupyter
  :after org
  :config
  (setq org-babel-python-command "python3")
  (setq org-confirm-babel-evaluate nil)
  (org-babel-do-load-languages 'org-babel-load-languages '((jupyter . t)))
  ;; default args for jupyter-python
  (setq org-babel-default-header-args:jupyter-python
   ;; NOTE: for converting Python Dataframes into org tables, I'm using code from
   ;; https://github.com/gregsexton/ob-ipython/blob/7147455230841744fb5b95dcbe03320313a77124/README.org#tips-and-tricks
   ;; which I put in .ipython/profile_default/startup/orgtable.py as a startup file for ipython.
        '((:results . "replace")
          (:async . "yes")
          (:session . "py")
          (:kernel . "python3")))
  (setq org-babel-default-header-args:jupyter-R
        '((:results . "replace")
          (:async . "yes")
          (:session . "R")
          (:kernel . "R")))
  (add-hook 'org-babel-after-execute-hook 'org-redisplay-inline-images))
```


### R {#r}

For working with R, Emacs Speaks Statistics (ESS) provides an unmatched experience. It's
an interactive environment much like jupyter, which allows you to easily and iteratively
execute parts of your statistical analyses in R.

```emacs-lisp
(use-package ess
  :defer t
  :config
  (setq ess-eval-visibly 'nowait))
```


### Stan {#stan}

Libraries for doing Bayesian statistics, both in Python and R, often rely on Stan. There
is some support in Emacs for writing Stan code, including rudimentary completion and
documentation.

```emacs-lisp
(use-package stan-mode :defer t)

(use-package company-stan
  :after stan-mode
  :hook (stan-mode . company-stan-setup))

(use-package eldoc-stan
  :after stan-mode
  :hook (stan-mode . eldoc-stan-setup))
```


## Searching {#searching}

The packaghe `deadgrep` offers an intuitive interface on [ripgrep](https://github.com/BurntSushi/ripgrep), which is a fast
alternative to grep. I add a little utility function to search directly in my folder with
org files.

```emacs-lisp
(use-package deadgrep
  :bind*
  (("C-c r" . deadgrep)
   ("C-c f" . grep-org-files))
  :config
  (defun grep-org-files (words)
    (interactive "sSearch org files: ")
    (let ((default-directory org-directory)
          (deadgrep--file-type '(glob . "*.org"))
          (deadgrep--context '(1 . 1))
          (deadgrep--search-type 'regexp))
      (deadgrep words))))
```


## Utility functions {#utility-functions}

Handy little package and functionality to open a terminal (in my case iterm2) in the same
folder as where the working document resides.

```emacs-lisp
(use-package terminal-here
  :config
  (setq terminal-here-mac-terminal-command 'iterm2))
```

Simple utility function for (un)commenting lines. Bound to M-/.

```emacs-lisp
(defun comment-current-line-dwim ()
  "Comment or uncomment the current line."
  (interactive)
  (save-excursion
    (if (use-region-p)
        (comment-or-uncomment-region (region-beginning) (region-end))
      (push-mark (beginning-of-line) t t)
      (end-of-line)
      (comment-dwim nil))))
```

Simple function to create a scratch pad for random thoughts. Similar to Emacs's **scratch**
buffer but for org files.

```emacs-lisp
(defun new-scratch-pad ()
"Create a new org-mode buffer for random stuff."
(interactive)
(let ((tab-bar-index (tab-bar--tab-index-by-name "Kladblok")))
  (if tab-bar-index
      (progn
        (tab-bar-select-tab (+ tab-bar-index 1))
        (switch-to-buffer "kladblok")
        (olivetti-mode t))
    (progn
      (tab-bar-new-tab)
      (tab-bar-rename-tab "Kladblok")
      (let ((buffer (generate-new-buffer "kladblok")))
        (switch-to-buffer buffer)
        (setq buffer-offer-save t)
        (org-mode)
        (olivetti-mode t))))))
```

```emacs-lisp
(defun xah-unfill-paragraph ()
  (interactive)
  (let ((fill-column most-positive-fixnum))
    (fill-paragraph)))
```

Hydra to resize windows without touching the mouse.

```emacs-lisp
(defhydra hydra-windows (:color red)
  ("s" shrink-window-horizontally "shrink horizontally" :column "Sizing")
  ("e" enlarge-window-horizontally "enlarge horizontally")
  ("b" balance-windows "balance window height")
  ("m" maximize-window "maximize current window")
  ("M" minimize-window "minimize current window")

  ("h" split-window-below "split horizontally" :column "Split management")
  ("v" split-window-right "split vertically")
  ("d" delete-window "delete current window")
  ("x" delete-other-windows "delete-other-windows")
  ("q" nil "quit menu" :color blue :column nil))
```


## Global key bindings {#global-key-bindings}

```emacs-lisp
(setq mac-option-key-is-meta nil
      mac-command-key-is-meta t
      mac-command-modifier 'meta
      mac-option-modifier 'none)

(global-set-key (kbd "M-/") 'comment-current-line-dwim)
(global-set-key (kbd "M-+")  'mode-line-other-buffer)
(global-set-key (kbd "M-`") 'other-frame)
(global-set-key (kbd "C-x k") 'kill-this-buffer)
(global-set-key (kbd "C-x K") 'kill-buffer)
(global-set-key (kbd "C-c s") 'new-scratch-pad)
;; Turn off swiping to switch buffers (defined in mac-win.el)
(global-unset-key [swipe-left])
(global-unset-key [swipe-right])
(global-unset-key (kbd "C-<mouse-4>"))
(global-unset-key (kbd "C-<mouse-5>"))
(global-unset-key (kbd "C-<wheel-down>"))
(global-unset-key (kbd "C-<wheel-up>"))
(global-set-key (kbd "M-n") 'hydra-windows/body)
(define-key global-map "\C-ca" 'org-agenda)
(define-key global-map (kbd "C-c M-a") 'show-my-agenda)
(global-set-key (kbd "C-x C-b") 'tab-bar-select-tab-by-name)
```


## Server {#server}

Start an Emacs server, which allows you to start up successive clients instantaneously:

```emacs-lisp
(use-package server
  :config
  (unless (server-running-p)
    (server-start)))
```


## Custom file {#custom-file}

Config changes made through the customize UI will be stored here

```emacs-lisp
(setq custom-file (expand-file-name "custom.el" "~/.emacs.d"))

(when (file-exists-p custom-file)
  (load custom-file))
```
