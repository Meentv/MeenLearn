/* ============================================================
   MeenLearn · script.js
   The engine: tabs, home, subject pages (lessons + quiz),
   playground, theme, 3D tilt, and the built-in AI tutor.
   Everything runs in the browser.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- merge lesson content ---------- */
  window.MEEN.lessons = {};
  window.MEEN.quiz = {};
  [window.MEEN_LESSONS_1, window.MEEN_LESSONS_2, window.MEEN_LESSONS_3, window.MEEN_LESSONS_4, window.MEEN_LESSONS_5].forEach(function (bag) {
    if (!bag) return;
    Object.keys(bag).forEach(function (k) {
      if (k === "quizzes") return;
      window.MEEN.lessons[k] = bag[k];
    });
    if (bag.quizzes) {
      Object.keys(bag.quizzes).forEach(function (k) {
        window.MEEN.quiz[k] = bag.quizzes[k];
      });
    }
  });

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } }
  };

  /* ============================================================
     COMMON HEADER: theme, menu, tabstrip
     ============================================================ */
  function initCommon(activeKey) {
    // theme
    var themeBtn = $("#theme");
    var applyTheme = function (light) {
      document.body.classList.toggle("light", light);
      if (themeBtn) themeBtn.textContent = light ? "☀" : "☾";
    };
    applyTheme(store.get("meen-theme", false) === "light");
    if (themeBtn) themeBtn.addEventListener("click", function () {
      var light = !document.body.classList.contains("light");
      applyTheme(light);
      store.set("meen-theme", light ? "light" : "dark");
    });

    // mobile menu
    var menuBtn = $("#menuBtn"), nav = $(".headnav");
    if (menuBtn && nav) menuBtn.addEventListener("click", function () { nav.classList.toggle("open"); });

    // tabstrip (the signature element)
    var strip = $("#tabstrip");
    if (strip) {
      var html = "";
      MEEN.order.forEach(function (key) {
        var s = MEEN.subjects[key];
        var n = (MEEN.lessons[key] || []).length;
        var active = key === activeKey ? " active" : "";
        html += '<a class="tab' + active + '" style="--c:' + s.color + '" href="' + s.page + '">' +
          '<span class="dot"></span>' + esc(s.name) + '<span class="n">' + String(n).padStart(2, "0") + "</span></a>";
      });
      strip.innerHTML = html;
    }

    initTilt();
    initReveal();
  }

  /* ---------- 3D tilt + light-follow ---------- */
  function initTilt() {
    if (window.matchMedia && window.matchMedia("(hover: none)").matches) return;
    $$(".tilt-card").forEach(function (card) {
      var max = 7;
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = "perspective(900px) rotateX(" + (-py * max).toFixed(2) + "deg) rotateY(" + (px * max).toFixed(2) + "deg) translateZ(6px)";
        card.style.setProperty("--mx", ((px + 0.5) * 100).toFixed(1) + "%");
        card.style.setProperty("--my", ((py + 0.5) * 100).toFixed(1) + "%");
      });
      card.addEventListener("mouseleave", function () { card.style.transform = ""; });
    });
  }

  /* ---------- scroll reveal ---------- */
  function initReveal() {
    var els = $$(".reveal");
    if (!els.length || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("revealed"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("revealed"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ============================================================
     HOME
     ============================================================ */
  function initHome() {
    initCommon();

    // live stats
    var total = 0;
    MEEN.order.forEach(function (k) { total += (MEEN.lessons[k] || []).length; });
    var ct = $("#courseTotal"); if (ct) ct.textContent = MEEN.order.length;
    var lt = $("#lessonTotal"); if (lt) lt.textContent = total;

    // subject cards (3D flip)
    var grid = $("#subjectGrid");
    if (grid) {
      grid.innerHTML = MEEN.order.map(function (key, i) {
        var s = MEEN.subjects[key];
        var n = (MEEN.lessons[key] || []).length;
        return (
          '<a class="flip3d reveal" style="--c:' + s.color + ';transition-delay:' + (i * 60) + 'ms" href="' + s.page + '">' +
            '<div class="flip3d-inner">' +
              '<div class="flip3d-face flip3d-front">' +
                '<div class="top"><span class="ic">' + esc(s.icon) + '</span><span class="ct">' + String(n).padStart(2, "0") + " LESSONS</span></div>" +
                "<h3>" + esc(s.name) + "</h3>" +
                "<p>" + esc(s.tagline) + "</p>" +
                '<div class="flip-hint">FLIP →</div>' +
              "</div>" +
              '<div class="flip3d-face flip3d-back">' +
                "<p>" + esc(s.blurb) + "</p>" +
                '<div class="go">Start track →</div>' +
              "</div>" +
            "</div>" +
          "</a>"
        );
      }).join("");
      initReveal();
    }
  }

  /* ============================================================
     SUBJECT PAGES (lessons + quiz)
     ============================================================ */
  function initSubjectPage(key) {
    var s = MEEN.subjects[key];
    var lessons = MEEN.lessons[key] || [];
    if (!s || !lessons.length) { console.error("No data for", key); return; }
    initCommon(key);

    // hero
    var hero = $("#subHero");
    if (hero) hero.style.setProperty("--c", s.color);
    set("#subIcon", s.icon);
    set("#subTitle", s.name);
    set("#subTagline", s.tagline);
    set("#subDesc", s.desc);
    set("#subLevel", s.level);
    set("#subjectName", s.name);
    var count = $("#subCount");
    if (count) count.textContent = lessons.length + " lessons · " + s.name + " track";

    // state
    var doneKey = "meen-progress-" + key;
    var done = new Set(store.get(doneKey, []));
    var current = 0;

    var listEl = $("#lessonList"), panel = $("#lessonPanel");
    if (panel) panel.style.setProperty("--c", s.color);

    /* ----- lesson list ----- */
    function renderList(filter) {
      if (!listEl) return;
      var f = (filter || "").trim().toLowerCase();
      var html = "";
      var shown = 0;
      lessons.forEach(function (l, i) {
        if (f && l.t.toLowerCase().indexOf(f) === -1) return;
        shown++;
        var cls = (i === current ? " active" : "") + (done.has(i) ? " done" : "");
        html += '<button data-i="' + i + '" class="' + cls + '"><span class="num">' + String(i + 1).padStart(2, "0") + "</span>" +
          esc(l.t) + '<span class="chk">✓</span></button>';
      });
      listEl.innerHTML = shown ? html : '<div class="no-results">No lesson matches “' + esc(filter) + "”.</div>";
      $$("#lessonList button").forEach(function (b) {
        b.addEventListener("click", function () {
          current = +b.dataset.i;
          renderLesson();
          renderList($("#lessonSearch").value);
          panel.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      });
    }

    function updateProgress() {
      var pct = Math.round((done.size / lessons.length) * 100);
      var pt = $("#progressText"); if (pt) pt.textContent = pct + "%";
      var pb = $("#progressBar"); if (pb) pb.style.width = pct + "%";
    }

    /* ----- lesson panel ----- */
    function webDoc(h, c, j) {
      return "<!doctype html><html><head><meta charset=\"utf-8\">" +
        (c ? "<style>" + c + "<\/style>" : "") +
        "</head><body>" + (h || "") +
        (j ? "<script>" + j + "<\/script>" : "") +
        "<\/body><\/html>";
    }

    /* ----- "you need first" bar (apps required before this lesson) ----- */
    function renderNeeds() {
      var bar = $("#lNeeds");
      if (!bar) return;
      var l = lessons[current];
      var apps = window.MEEN.apps || {};
      var chips = [];
      (l.needs || []).forEach(function (k) {
        var a = apps[k]; if (!a) return;
        chips.push('<span class="nb-chip req"><span class="nb-ic">◆</span><b>' + esc(a.name) + "</b>" +
          '<i>' + esc(a.note) + "</i>" +
          (a.url ? '<a href="' + esc(a.url) + '" target="_blank" rel="noopener">Get it →</a>' : "") + "</span>");
      });
      (l.opt || []).forEach(function (k) {
        var a = apps[k]; if (!a) return;
        chips.push('<span class="nb-chip opt"><span class="nb-ic">◇</span><b>' + esc(a.name) + "</b>" +
          '<i>' + esc(a.note) + "</i>" +
          (a.url ? '<a href="' + esc(a.url) + '" target="_blank" rel="noopener">Get it →</a>' : "") + "</span>");
      });
      if (!chips.length) { bar.innerHTML = ""; bar.classList.add("hide"); return; }
      bar.innerHTML = '<span class="nb-label">YOU NEED FIRST</span>' + chips.join("");
      bar.classList.remove("hide");
    }

    function renderLesson() {
      var l = lessons[current];
      if (!l) return;
      set("#lKicker", "LESSON " + String(current + 1).padStart(2, "0") + " / " + String(lessons.length).padStart(2, "0") + " · " + s.name.toUpperCase());
      set("#lTitle", l.t);
      renderNeeds();
      set("#lText", l.text);
      var defEl = $("#lDefinition");
      if (defEl) defEl.innerHTML = "<span>DEFINITION</span><p>" + esc(l.def) + "</p>";
      var codeEl = $("#lCode");
      if (codeEl) codeEl.textContent = l.code;

      var outEl = $("#exampleResult");
      if (outEl) {
        if (l.out && l.out.web) {
          outEl.innerHTML = "";
          var fr = document.createElement("iframe");
          fr.setAttribute("sandbox", "allow-scripts");
          fr.setAttribute("title", "Live example");
          fr.srcdoc = webDoc(l.out.web.h, l.out.web.c, l.out.web.j);
          outEl.appendChild(fr);
        } else {
          outEl.innerHTML = '<div class="term">' + esc(l.out ? l.out.term : "") + "</div>";
        }
      }

      var flow = (l.flow || []).map(function (step, i, arr) {
        return (i ? '<span class="arrow">→</span>' : "") + '<span class="step">' + esc(step) + "</span>";
      }).join("");
      var vis = $("#lVisual");
      if (vis) vis.innerHTML = '<div class="visual-diagram"><div class="visual-flow" style="--c:' + s.color + '">' + flow + "</div></div>";

      set("#lPractical", l.task);
      set("#lMistake", l.mistake);
      set("#lTip", l.tip);

      // challenge (hidden until revealed)
      var ch = $("#lChallenge");
      if (ch) { ch.textContent = ""; ch.classList.add("challenge-hidden"); }
      var rv = $("#revealBtn");
      if (rv) {
        rv.textContent = "Reveal task";
        rv.onclick = function () {
          ch.textContent = l.challenge;
          ch.classList.remove("challenge-hidden");
          rv.textContent = "Hide task";
        };
      }

      // nav
      set("#navPos", (current + 1) + " / " + lessons.length);
      var prev = $("#prevBtn"), next = $("#nextBtn");
      if (prev) prev.disabled = current === 0;
      if (next) next.disabled = current === lessons.length - 1;

      // try-in-playground link (only for lessons with a live web demo)
      var tp = $("#tryPlayLink");
      if (tp) {
        if (l.out && l.out.web) {
          tp.href = "playground.html#p=" + key + (current + 1);
          tp.classList.remove("hide");
        } else {
          tp.classList.add("hide");
        }
      }

      // done button state
      var db = $("#doneBtn");
      if (db) {
        var isDone = done.has(current);
        db.textContent = isDone ? "✓ Done — undo" : "Mark done ✓";
        db.classList.toggle("done", isDone);
      }

      // deep link
      try { history.replaceState(null, "", "#l" + (current + 1)); } catch (e) { /* file:// */ }
      renderList($("#lessonSearch").value);
    }

    function set(sel, val) { var el = $(sel); if (el) el.textContent = val; }

    // wiring
    var prev = $("#prevBtn"), next = $("#nextBtn"), db = $("#doneBtn");
    if (prev) prev.addEventListener("click", function () { if (current > 0) { current--; renderLesson(); } });
    if (next) next.addEventListener("click", function () { if (current < lessons.length - 1) { current++; renderLesson(); } });
    if (db) db.addEventListener("click", function () {
      if (done.has(current)) done.delete(current); else done.add(current);
      store.set(doneKey, Array.from(done));
      renderLesson();
      updateProgress();
    });

    var search = $("#lessonSearch");
    if (search) search.addEventListener("input", function () { renderList(search.value); });

    var copy = $("#copyBtn");
    if (copy) copy.addEventListener("click", function () {
      var code = ($("#lCode") || {}).textContent || "";
      var doneCopy = function () { copy.textContent = "Copied ✓"; setTimeout(function () { copy.textContent = "Copy"; }, 1200); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(doneCopy, doneCopy);
      } else { doneCopy(); }
    });

    // deep link on load
    var m = (location.hash || "").match(/^#l(\d+)$/);
    if (m) {
      var i = parseInt(m[1], 10) - 1;
      if (i >= 0 && i < lessons.length) current = i;
    }

    renderList("");
    updateProgress();
    renderLesson();

    /* ----- quiz ----- */
    var bank = MEEN.quiz[key] || [];
    var modal = $("#modal"), quizBody = $("#quizBody"), quizStart = $("#quizStart");
    var bestEl = $("#bestScore");
    var bestKey = "meen-quizbest-" + key;
    var best = store.get(bestKey, null);
    if (bestEl) bestEl.textContent = best === null ? "—" : (best + "/5");

    if (quizStart && bank.length) {
      quizStart.addEventListener("click", startQuiz);
    }
    var quizClose = $("#quizClose");
    if (quizClose) quizClose.addEventListener("click", function () { modal.classList.add("hide"); });
    if (modal) modal.addEventListener("click", function (e) { if (e.target === modal) modal.classList.add("hide"); });

    function startQuiz() {
      // pick 5 random questions
      var idx = bank.map(function (_, i) { return i; });
      for (var i = idx.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = idx[i]; idx[i] = idx[j]; idx[j] = t;
      }
      var qs = idx.slice(0, 5).map(function (i) { return bank[i]; });
      var qi = 0, score = 0, locked = false;

      function showQuestion() {
        locked = false;
        var q = qs[qi];
        quizBody.innerHTML =
          '<div class="quiz-q">Q' + (qi + 1) + ' · ' + esc(q.q) + "</div>" +
          '<div class="answers">' +
          q.a.map(function (opt, oi) {
            return '<button class="answer" data-o="' + oi + '">' + esc(opt) + "</button>";
          }).join("") +
          "</div>";
        $$(".answer", quizBody).forEach(function (btn) {
          btn.addEventListener("click", function () {
            if (locked) return;
            locked = true;
            var pick = +btn.dataset.o;
            $$(".answer", quizBody).forEach(function (b) {
              b.disabled = true;
              if (+b.dataset.o === q.c) b.classList.add("correct");
            });
            if (pick === q.c) { score++; } else { btn.classList.add("wrong"); }
            var w = document.createElement("p");
            w.className = "quiz-why";
            w.textContent = (pick === q.c ? "Correct. " : "Not quite. ") + q.w;
            quizBody.appendChild(w);
            var nxt = document.createElement("button");
            nxt.className = "btn small";
            nxt.style.marginTop = "12px";
            nxt.textContent = qi < qs.length - 1 ? "Next question →" : "See result →";
            nxt.addEventListener("click", function () {
              qi++;
              if (qi < qs.length) showQuestion(); else showResult();
            });
            quizBody.appendChild(nxt);
          });
        });
      }

      function showResult() {
        var msg = score === 5 ? "Perfect. Move on with confidence." :
          score >= 4 ? "Solid — one more pass and you're set." :
            score >= 3 ? "Good start. Revisit the weaker lessons and retry." :
              "Worth another run — the lessons are right there.";
        if (best === null || score > best) { best = score; store.set(bestKey, best); if (bestEl) bestEl.textContent = best + "/5"; }
        quizBody.innerHTML =
          '<div class="quiz-result"><strong>' + score + " / 5</strong>" +
          "<p style=\"color:var(--muted);font-size:13px;margin:8px 0 16px\">" + msg + "</p>" +
          '<button class="btn small" id="quizRetry">Try again ↻</button></div>';
        $("#quizRetry", quizBody).addEventListener("click", startQuiz);
      }

      modal.classList.remove("hide");
      showQuestion();
    }
  }

  /* ============================================================
     PLAYGROUND
     ============================================================ */
  function initPlayground() {
    initCommon();

    var starters = {
      blank: {
        h: "<!-- start typing -->\n<h1>Hello, playground</h1>\n<p>Edit any tab and hit Run.</p>",
        c: "body { font-family: sans-serif; padding: 24px; background: #faf7f0; color: #20232b; }",
        j: "console.log(\"hello from JS\");"
      },
      counter: {
        h: "<button id=\"btn\">Clicks: 0</button>",
        c: "body { font-family: sans-serif; padding: 24px; }\nbutton { padding: 10px 18px; font-size: 15px; border: 0; border-radius: 8px; background: #14171f; color: #f5b23d; cursor: pointer; }",
        j: "var n = 0;\nvar btn = document.getElementById('btn');\nbtn.addEventListener('click', function () {\n  n += 1;\n  btn.textContent = 'Clicks: ' + n;\n});"
      },
      card: {
        h: "<div class=\"card\">\n  <h3>MeenLearn Pro</h3>\n  <p>Every track, every lesson, in one place.</p>\n  <span class=\"price\">Free, forever</span>\n  <button>Start now</button>\n</div>",
        c: "body { font-family: sans-serif; display: grid; place-items: center; min-height: 100vh; margin: 0; background: #14171f; }\n.card { background: #1c212c; color: #eceae3; border-radius: 14px; padding: 26px; width: 240px; text-align: center; border: 1px solid #ffffff14; }\n.price { display: block; color: #f5b23d; font-weight: 700; margin: 10px 0 14px; }\nbutton { border: 0; border-radius: 8px; background: #f5b23d; color: #241a08; font-weight: 700; padding: 9px 16px; cursor: pointer; }",
        j: "document.querySelector('button').addEventListener('click', function () {\n  alert('Welcome aboard!');\n});"
      },
      form: {
        h: "<form>\n  <label>Name\n    <input name=\"name\" placeholder=\"Ada\">\n  </label>\n  <button>Save</button>\n</form>\n<p class=\"out\"></p>",
        c: "body { font-family: sans-serif; padding: 24px; }\ninput { display: block; margin: 4px 0 14px; padding: 9px; border: 1px solid #ccc; border-radius: 6px; width: 220px; }\nbutton { padding: 9px 16px; border: 0; border-radius: 6px; background: #14171f; color: #f5b23d; font-weight: 700; cursor: pointer; }\n.out { color: #2c8a63; font-weight: 700; }",
        j: "document.querySelector('form').addEventListener('submit', function (e) {\n  e.preventDefault();\n  var name = new FormData(this).get('name');\n  document.querySelector('.out').textContent = name ? 'Saved for ' + name + '!' : 'Name is required.';\n});"
      }
    };
    var currentStarter = "blank";

    var areaH = $("#areaHtml"), areaC = $("#areaCss"), areaJ = $("#areaJs"), frame = $("#frame");
    var status = $(".preview header span");
    var tabs = { html: $("#tabHtml"), css: $("#tabCss"), js: $("#tabJs") };
    var areas = { html: areaH, css: areaC, js: areaJ };

    function showTab(name) {
      Object.keys(tabs).forEach(function (k) {
        tabs[k].classList.toggle("active", k === name);
        areas[k].style.display = k === name ? "block" : "none";
      });
    }
    Object.keys(tabs).forEach(function (k) {
      tabs[k].addEventListener("click", function () { showTab(k); });
    });

    function loadStarter(name) {
      currentStarter = name;
      var st = starters[name];
      areaH.value = st.h; areaC.value = st.c; areaJ.value = st.j;
      run();
    }

    function run() {
      if (!frame) return;
      if (status) status.textContent = "Running…";
      var doc = "<!doctype html><html><head><meta charset=\"utf-8\"><style>" + areaC.value + "<\/style></head><body>" +
        areaH.value + "<script>" + areaJ.value + "<\/script><\/body><\/html>";
      frame.srcdoc = doc;
      frame.onload = function () { if (status) status.textContent = "Ready"; };
      if (status) status.textContent = "Ready";
    }

    $$(".starter-row button").forEach(function (b) {
      b.addEventListener("click", function () { loadStarter(b.dataset.s); });
    });
    $("#run").addEventListener("click", run);
    $("#resetPlay").addEventListener("click", function () { loadStarter(currentStarter); });
    // ctrl/cmd + enter runs
    [areaH, areaC, areaJ].forEach(function (a) {
      a.addEventListener("keydown", function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); run(); }
      });
    });

    // "Try in Playground" deep link: #p=<trackKey><lessonNumber>
    var pm = (location.hash || "").match(/^#p=([a-z]+)(\d+)$/i);
    var loadedLesson = null, loadedMeta = null;
    if (pm) {
      var lk = pm[1].toLowerCase();
      var ln = parseInt(pm[2], 10) - 1;
      var ll = (MEEN.lessons[lk] || [])[ln];
      if (ll && ll.out && ll.out.web) { loadedLesson = ll; loadedMeta = { key: lk, n: ln + 1 }; }
    }
    if (loadedLesson) {
      areaH.value = loadedLesson.out.web.h || "";
      areaC.value = loadedLesson.out.web.c || "";
      areaJ.value = loadedLesson.out.web.j || "";
      currentStarter = "blank";
      var badge = $("#playBadge");
      if (badge) badge.textContent = "loaded from: " + MEEN.subjects[loadedMeta.key].name + " · lesson " + String(loadedMeta.n).padStart(2, "0");
      run();
    } else {
      loadStarter("blank");
    }
  }

  /* ============================================================
     AI TUTOR DASHBOARD (ai.html) — chat with saved history,
     per-track chips, goals and stats.
     ============================================================ */
  var DASH_CHATS_KEY = "meen-ai-chat";
  var DASH_GOALS = [
    { label: "I want to build websites", q: "My goal is to become a frontend developer — what should I learn in what order?" },
    { label: "I want Python + data", q: "My goal is to work with Python and data — what should I learn in what order?" },
    { label: "I want to ship my work", q: "My goal is to put my work on the internet and version it properly — what should I learn in what order?" }
  ];

  function initAIDashboard() {
    if (!$("#dMessages")) return;
    initCommon("ai");

    var msgs = $("#dMessages"), form = $("#dForm"), input = $("#dInput"), suggest = $("#dSuggest");
    var ai = MEEN.ai;

    function loadChat() { return store.get(DASH_CHATS_KEY, []); }
    function saveChat(list) { store.set(DASH_CHATS_KEY, list.slice(-100)); }

    function addMsg(text, who, scroll) {
      var d = document.createElement("div");
      d.className = "ai-msg " + who;
      d.textContent = text;
      msgs.appendChild(d);
      if (scroll !== false) msgs.scrollTop = msgs.scrollHeight;
      return d;
    }
    function typing() {
      var d = document.createElement("div");
      d.className = "ai-msg bot typing";
      d.innerHTML = '<span></span><span></span><span></span>';
      msgs.appendChild(d);
      msgs.scrollTop = msgs.scrollHeight;
      return d;
    }
    function updateStats() {
      var done = 0, quizzes = 0;
      MEEN.order.forEach(function (k) {
        done += (store.get("meen-progress-" + k, []) || []).length;
        var b = store.get("meen-quizbest-" + k, null);
        if (b !== null && b >= 4) quizzes++;
      });
      var q = $("#dQuestions"); if (q) q.textContent = loadChat().length;
      var t = $("#dTracks"); if (t) t.textContent = MEEN.order.length;
      var l = $("#dLessons"); if (l) l.textContent = done;
      var z = $("#dQuizzes"); if (z) z.textContent = quizzes + "/" + MEEN.order.length;
    }

    function send(text) {
      var q = (text != null ? text : input.value).trim();
      if (!q) return;
      var chat = loadChat();
      chat.push({ q: q });
      addMsg(q, "user");
      input.value = "";
      var t = typing();
      setTimeout(function () {
        t.remove();
        var a = askAI(q);
        chat[chat.length - 1].a = a;
        saveChat(chat);
        addMsg(a, "bot");
        updateStats();
      }, 420 + Math.random() * 380);
    }

    // restore history
    var chat = loadChat();
    if (chat.length) {
      chat.forEach(function (m) {
        addMsg(m.q, "user", false);
        if (m.a) addMsg(m.a, "bot", false);
      });
    } else {
      addMsg(ai.greeting, "bot", false);
    }
    msgs.scrollTop = msgs.scrollHeight;

    // suggestion chips (site-level)
    if (suggest && ai.suggest) {
      suggest.innerHTML = ai.suggest.map(function (sug) {
        return '<button type="button" data-q="' + esc(sug) + '">' + esc(sug) + "</button>";
      }).join("");
      $$("#dSuggest button").forEach(function (b) {
        b.addEventListener("click", function () { send(b.dataset.q); });
      });
    }

    // per-track topic chips
    var chips = $("#dChips");
    if (chips) {
      chips.innerHTML = MEEN.order.map(function (k) {
        var s = MEEN.subjects[k];
        return '<button type="button" class="dash-chip" style="--c:' + s.color + '" data-q="Explain the basics of ' + esc(s.name) + ' to me like a beginner">' +
          esc(s.name) + " <span>" + (MEEN.lessons[k] || []).length + "</span></button>";
      }).join("");
      $$("#dChips button").forEach(function (b) {
        b.addEventListener("click", function () { send(b.dataset.q); });
      });
    }

    // goals
    var goals = $("#dGoals");
    if (goals) {
      goals.innerHTML = DASH_GOALS.map(function (g, i) {
        return '<button type="button" data-i="' + i + '">' + esc(g.label) + "</button>";
      }).join("");
      $$("#dGoals button").forEach(function (b) {
        b.addEventListener("click", function () { send(DASH_GOALS[+b.dataset.i].q); });
      });
    }

    // new chat
    var clear = $("#dClear");
    if (clear) clear.addEventListener("click", function () {
      if (loadChat().length && !confirm("Start a new chat? Your current conversation will be cleared.")) return;
      store.set(DASH_CHATS_KEY, []);
      msgs.innerHTML = "";
      addMsg(ai.greeting, "bot");
      updateStats();
    });

    if (form) form.addEventListener("submit", function (e) { e.preventDefault(); send(); });

    updateStats();
  }

  /* ---------- shared AI brain (used by the quick panel AND the dashboard) ---------- */
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

  function askAI(qRaw) {
    var q = " " + qRaw.toLowerCase().replace(/[?!.,;]+/g, " ").replace(/\s+/g, " ") + " ";
    var bestScore = 0, bestAns = null;
    (MEEN.ai.kb || []).forEach(function (entry) {
      var score = 0;
      (entry.k || []).forEach(function (kw) {
        var k = kw.toLowerCase();
        if (k.indexOf(" ") > -1) {
          if (q.indexOf(k) > -1) score += 3;
        } else {
          try {
            if (new RegExp("\\b" + escRe(k) + "\\b").test(q)) score += 2;
          } catch (e) { if (q.indexOf(k) > -1) score += 2; }
        }
      });
      if (score > bestScore) { bestScore = score; bestAns = entry.a; }
    });
    if (bestAns) return bestAns;

    var mentioned = MEEN.order.filter(function (k) {
      var name = MEEN.subjects[k].name.toLowerCase();
      return new RegExp("\\b" + escRe(name) + "\\b").test(q);
    });
    if (mentioned.length) {
      var s = MEEN.subjects[mentioned[0]];
      var concept = { css: "flexbox", sql: "JOINs", python: "f-strings", git: "merge conflicts",
        javascript: "events", html: "the head section", terminal: "the PATH variable",
        web: "status codes", projects: "the quiz game loop", programming: "loops" }[mentioned[0]] || "the first lesson";
      return "Good topic — the " + s.name + " track covers it across " + (MEEN.lessons[mentioned[0]] || []).length +
        " lessons. Open " + s.page + " and start from lesson 01, or ask me a specific concept from that track (e.g. “explain " +
        concept + "”). You can also open the AI Tutor dashboard from the top menu for a bigger chat with saved history.";
    }
    return MEEN.ai.fallback;
  }

  /* ============================================================
     AI TUTOR — quick panel (retired; the brain above still powers the dashboard)
     ============================================================ */
  function initAskAI() {
    var fab = $("#aiFab"), panel = $("#aiPanel");
    if (!fab || !panel) return;

    var msgs = $("#aiMessages"), form = $("#aiForm"), input = $("#aiInput"), suggest = $("#aiSuggest");
    var ai = MEEN.ai;

    function addMsg(text, who) {
      var d = document.createElement("div");
      d.className = "ai-msg " + who;
      d.textContent = text;
      msgs.appendChild(d);
      msgs.scrollTop = msgs.scrollHeight;
      return d;
    }

    function typing() {
      var d = document.createElement("div");
      d.className = "ai-msg bot typing";
      d.innerHTML = '<span></span><span></span><span></span>';
      msgs.appendChild(d);
      msgs.scrollTop = msgs.scrollHeight;
      return d;
    }

    function send(text) {
      var q = (text != null ? text : input.value).trim();
      if (!q) return;
      addMsg(q, "user");
      input.value = "";
      var t = typing();
      setTimeout(function () {
        t.remove();
        addMsg(askAI(q), "bot");
      }, 420 + Math.random() * 380);
    }

    fab.addEventListener("click", function () { panel.classList.toggle("hide"); });
    var close = $("#aiClose");
    if (close) close.addEventListener("click", function () { panel.classList.add("hide"); });

    if (suggest && ai.suggest) {
      suggest.innerHTML = ai.suggest.map(function (sug) {
        return '<button type="button" data-q="' + esc(sug) + '">' + esc(sug) + "</button>";
      }).join("");
      $$("#aiSuggest button").forEach(function (b) {
        b.addEventListener("click", function () { send(b.dataset.q); });
      });
    }

    if (form) form.addEventListener("submit", function (e) { e.preventDefault(); send(); });

    // greet once
    setTimeout(function () { if (!msgs.dataset.greeted) { msgs.dataset.greeted = "1"; addMsg(ai.greeting, "bot"); } }, 250);
  }

  /* ---------- public ---------- */
  window.MEEN_API = {
    initHome: initHome,
    initSubjectPage: initSubjectPage,
    initPlayground: initPlayground,
    initAskAI: initAskAI,
    initAIDashboard: initAIDashboard,
    askAI: askAI
  };

  // pages call init*() directly; expose as globals too
  window.initHome = initHome;
  window.initSubjectPage = initSubjectPage;
  window.initPlayground = initPlayground;
  window.initAskAI = initAskAI;
  window.initAIDashboard = initAIDashboard;
})();
