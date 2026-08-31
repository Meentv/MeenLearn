# MeenLearn — by MeenDev

A free learning site: 10 tracks, **203 step-by-step lessons**, live examples, quizzes, a playground, and a built-in AI tutor that knows every lesson. No account, no setup.

## Tracks
| Track | Lessons | Focus |
|---|---|---|
| [Programming](programming.html) | 20 | algorithms, data, logic, functions, debugging |
| [Terminal](terminal.html) | 20 | command line, files, installs, pipes, running code, reading errors |
| [HTML](html.html) | 20 | elements, skeleton, head vs body, forms, semantics, a11y |
| [CSS](css.html) | 20 | selectors, box model, flexbox, grid, responsive, motion |
| [JavaScript](javascript.html) | 21 | language, DOM, events, storage, fetch, to-do app |
| [Python](python.html) | 26 | language, files, modules, venvs, OOP, regex, 2 mini-projects |
| [SQL](sql.html) | 20 | queries, joins, keys, indexes, analysis project |
| [Web & Hosting](web.html) | 20 | HTTP, DNS, hosting, GitHub Pages, Netlify, domains, APIs, Node, a live site |
| [Git](git.html) | 24 | commits, branches, merges, diff, GitHub, time travel, PRs, team workflow |
| [Projects](projects.html) | 12 | build real apps: quiz, password, palette, to-do, expense, forms, countdown, kanban, recipe, currency, pricing, 404 |

## Every lesson has
- a plain-English explanation + formal definition
- a runnable example (live browser preview, or terminal output)
- a visual flow diagram
- a practical task, a common mistake, and a pro tip
- a hidden challenge ("Reveal task")
- a **"YOU NEED FIRST" bar** when the lesson needs software — it names each app (VS Code, Python, Git, Node…), why you need it, and a Get-it link. Optional apps are marked separately from required ones.
- a **Playground ↗** button that loads the lesson's example straight into the live editor (for lessons with browser code)

Plus per track: course progress (saved in your browser), lesson search, and a 5-question Knowledge Check drawn from an 8-question bank (best score saved).

## The AI tutor (two sizes)
- **✦ Ask AI** button — a quick panel on every page.
- **AI Tutor dashboard** (`ai.html`) — the full room: saved conversation history, per-track suggestion chips, learning-goal buttons, and your progress stats.

Both are powered by the same tutor brain — 190+ curated entries drawn from the site's own lessons (including "what do I need to install?" and "what order should I learn in?"). No account, no setup; your chat history and progress live in your browser.

## Run it
It's a static site. Open `index.html` directly, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Files
```
index.html          home (hero 3D scene, tracks, roadmap)
ai.html             AI Tutor dashboard (history, goals, stats)
programming.html … projects.html   the 10 track pages (same engine)
playground.html     live HTML/CSS/JS editor (+ deep-link from any lesson)
data.js             subject metadata + app registry + AI knowledge base
lessons1.js         Programming + HTML lessons & quizzes
lessons2.js         CSS + JavaScript lessons & quizzes
lessons3.js         Python + SQL + Git lessons & quizzes
lessons4.js         Terminal + Web & Hosting lessons & quizzes
lessons5.js         Projects lessons & quizzes
script.js           the engine (tabs, lessons, quiz, playground, 3D, AI, dashboard)
style.css           design system + 3D effects + "you need first" bar + responsive
favicon.svg         the gold "M"
```

© 2026 MeenDev · Built for people who learn by doing
