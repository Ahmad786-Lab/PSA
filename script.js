(function () {
  "use strict";

  var navToggle = document.getElementById("navToggle");
  var siteNav = document.getElementById("siteNav");
  var header = document.querySelector(".site-header");
  var yearEl = document.getElementById("year");
  var heroStat = document.querySelector(
    ".hero-stat-value, .hero-statbox-value[data-count]"
  );

  function setNavOpen(open) {
    if (!siteNav || !navToggle) return;
    siteNav.classList.toggle("is-open", open);
    document.body.classList.toggle("nav-open", open);
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  if (navToggle && siteNav) {
    navToggle.addEventListener("click", function () {
      setNavOpen(!siteNav.classList.contains("is-open"));
    });

    siteNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setNavOpen(false);
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setNavOpen(false);
    });
  }

  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  function normalizeEmailHref(value) {
    var s = String(value).trim();
    if (!s) return "";
    if (/^mailto:/i.test(s)) return s;
    return "mailto:" + s;
  }

  function initFooterSocial() {
    var root = document.getElementById("footerConnect");
    if (!root) return;
    root.innerHTML = "";
    var cfg = window.PSA_SOCIAL;
    if (!cfg || typeof cfg !== "object") {
      root.hidden = true;
      return;
    }
    var items = [
      { label: "Instagram", href: String(cfg.instagram || "").trim() },
      { label: "GroupMe", href: String(cfg.groupMe || "").trim() },
      { label: "Discord", href: String(cfg.discord || "").trim() },
      {
        label: "Email",
        href: String(cfg.email || "").trim()
          ? normalizeEmailHref(cfg.email)
          : "",
      },
    ];
    var any = false;
    items.forEach(function (item) {
      if (!item.href) return;
      any = true;
      var a = document.createElement("a");
      a.className = "footer-connect-link";
      a.href = item.href;
      a.textContent = item.label;
      if (item.label === "Email") {
        a.setAttribute(
          "aria-label",
          "Email " + String(cfg.email).replace(/^mailto:/i, "")
        );
      }
      if (/^https?:/i.test(item.href)) {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      }
      root.appendChild(a);
    });
    root.hidden = !any;
  }

  initFooterSocial();

  function initJoinContactLinks() {
    var cfg = window.PSA_SOCIAL;
    var ig = document.getElementById("joinInstagram");
    var em = document.getElementById("joinEmail");
    if (!cfg || typeof cfg !== "object") return;
    if (ig) {
      var iu = String(cfg.instagram || "").trim();
      if (iu) ig.href = iu;
    }
    if (em) {
      var eu = String(cfg.email || "").trim();
      if (eu) em.href = normalizeEmailHref(eu);
    }
  }

  initJoinContactLinks();

  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 12);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function animateCount(el, target, duration) {
    var start = performance.now();
    var from = 0;
    function frame(now) {
      var t = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = String(Math.round(from + (target - from) * eased));
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  if (heroStat) {
    var target = parseInt(heroStat.getAttribute("data-count") || "0", 10);
    if (!isNaN(target) && target > 0) {
      var started = false;
      var obs = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting && !started) {
              started = true;
              animateCount(heroStat, target, 1400);
              obs.disconnect();
            }
          });
        },
        { threshold: 0.35 }
      );
      obs.observe(heroStat.closest(".hero") || heroStat);
    }
  }

  var revealNodes = document.querySelectorAll("[data-reveal]");
  if (revealNodes.length && "IntersectionObserver" in window) {
    var revealObs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObs.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    revealNodes.forEach(function (node) {
      revealObs.observe(node);
    });
  } else {
    revealNodes.forEach(function (node) {
      node.classList.add("is-visible");
    });
  }

  /* Board grid — Airtable-powered lanyard badges */
  var boardGrid = document.getElementById("boardGrid");
  var boardGridClone = document.getElementById("boardGridClone");
  var boardTrack = document.getElementById("boardTrack");
  var boardStatus = document.getElementById("boardStatus");
  var boardLead = document.getElementById("boardLead");
  var boardMarqueeResizeTimer;

  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function getAirtableConfig() {
    var c = typeof window !== "undefined" ? window.PSA_AIRTABLE : null;
    if (!c || typeof c !== "object") return null;
    return {
      token: String(c.token || "").trim(),
      baseId: String(c.baseId || "").trim(),
      tableName: String(c.tableName || "Board").trim(),
      viewName: String(c.viewName || "").trim(),
      maxRecords: Math.min(100, Math.max(1, parseInt(c.maxRecords, 10) || 10)),
      fieldMap: {
        name: String((c.fieldMap && c.fieldMap.name) || "Name"),
        role: String((c.fieldMap && c.fieldMap.role) || "Role"),
        photo: String((c.fieldMap && c.fieldMap.photo) || "Photo"),
      },
    };
  }

  function pickPhotoUrl(fields, photoField) {
    var v = fields[photoField];
    if (!v) return "";
    if (typeof v === "string" && /^https?:\/\//i.test(v)) return v;
    if (Array.isArray(v) && v.length && v[0]) {
      if (v[0].url) return v[0].url;
      var th = v[0].thumbnails;
      if (th && th.large && th.large.url) return th.large.url;
      if (th && th.small && th.small.url) return th.small.url;
    }
    return "";
  }

  function renderBoardSlot(options) {
    var empty = options.empty;
    var loading = options.loading;
    var name = options.name || "";
    var role = options.role || "";
    var photoUrl = options.photoUrl || "";
    var emptySubtitle =
      options.emptySubtitle !== undefined && options.emptySubtitle !== null
        ? options.emptySubtitle
        : "Add in Airtable";
    var classes = "board-slot";
    if (empty) classes += " is-empty";
    if (loading) classes += " is-loading";

    var imgHtml = "";
    if (photoUrl) {
      imgHtml =
        '<img src="' +
        escapeHtml(photoUrl) +
        '" alt="' +
        escapeHtml(name || "Board member") +
        '" width="400" height="533" loading="lazy" />';
    } else if (!empty) {
      imgHtml =
        '<span class="board-placeholder-icon" aria-hidden="true">+</span>';
    } else {
      imgHtml = "";
    }

    var displayName = name || (loading ? "Loading…" : "—");
    var displayRole = role;
    if (empty) {
      displayName = "";
      displayRole = "";
    }

    function splitName(full) {
      var cleaned = String(full || "")
        .trim()
        .replace(/\s+/g, " ");
      if (!cleaned) return { first: "", last: "" };
      var parts = cleaned.split(" ");
      if (parts.length === 1) return { first: parts[0], last: "" };
      return {
        first: parts.slice(0, -1).join(" "),
        last: parts[parts.length - 1],
      };
    }

    var nameParts = splitName(displayName);
    var nameHtml = "";
    if (displayName) {
      nameHtml =
        '<p class="board-name">' +
        '<span class="board-first">' +
        escapeHtml(nameParts.first || displayName) +
        "</span>" +
        (nameParts.last
          ? '<span class="board-last">' + escapeHtml(nameParts.last) + "</span>"
          : "") +
        "</p>";
    }

    return (
      '<li class="' +
      classes +
      '">' +
      '<div class="board-lanyard" aria-hidden="true"></div>' +
      '<div class="board-clip" aria-hidden="true"></div>' +
      '<div class="board-holder">' +
      '<div class="board-photo-wrap">' +
      imgHtml +
      "</div>" +
      '<div class="board-meta">' +
      nameHtml +
      (displayRole
        ? '<p class="board-role">' + escapeHtml(displayRole) + "</p>"
        : "") +
      "</div></div></li>"
    );
  }

  function buildBoardHtml(slots) {
    var html = "";
    for (var i = 0; i < slots.length; i++) html += renderBoardSlot(slots[i]);
    return html;
  }

  function syncBoardMarqueeSpeed() {
    if (!boardTrack || !boardGrid) return;
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      boardTrack.style.removeProperty("--board-marquee-duration");
      return;
    }
    var w = boardGrid.offsetWidth;
    if (!w) return;
    var pxPerSec = 38;
    var sec = Math.max(28, Math.min(120, w / pxPerSec));
    boardTrack.style.setProperty("--board-marquee-duration", sec + "s");
  }

  function paintBoardSlots(slots) {
    if (!boardGrid) return;
    var safeSlots = Array.isArray(slots) ? slots : [];
    var html = buildBoardHtml(safeSlots);
    boardGrid.innerHTML = html;
    if (boardGridClone) boardGridClone.innerHTML = html;
    requestAnimationFrame(function () {
      requestAnimationFrame(syncBoardMarqueeSpeed);
    });
  }

  function fetchAllAirtableRecords(cfg, urlBase, maxTotal) {
    var records = [];
    var nextOffset = "";
    var hardMax = Math.min(500, Math.max(1, maxTotal || 100));

    function fetchPage() {
      var qs = ["pageSize=100"];
      if (cfg.viewName) qs.push("view=" + encodeURIComponent(cfg.viewName));
      if (nextOffset) qs.push("offset=" + encodeURIComponent(nextOffset));
      var url = urlBase + "?" + qs.join("&");

      return fetch(url, {
        headers: { Authorization: "Bearer " + cfg.token },
      }).then(function (res) {
        if (!res.ok) {
          return res.text().then(function (t) {
            throw { status: res.status, body: t, url: url };
          });
        }
        return res.json().then(function (data) {
          var pageRecords = (data && data.records) || [];
          for (
            var i = 0;
            i < pageRecords.length && records.length < hardMax;
            i++
          ) {
            records.push(pageRecords[i]);
          }
          nextOffset = data && data.offset ? String(data.offset) : "";
          if (nextOffset && records.length < hardMax) return fetchPage();
          return records;
        });
      });
    }

    return fetchPage();
  }

  /* Events — Airtable-powered list */
  var eventList = document.getElementById("eventList");
  var eventsStatus = document.getElementById("eventsStatus");

  function getEventsConfig() {
    var c = typeof window !== "undefined" ? window.PSA_AIRTABLE_EVENTS : null;
    if (!c || typeof c !== "object") return null;
    return {
      token: String(c.token || "").trim(),
      baseId: String(c.baseId || "").trim(),
      tableName: String(c.tableName || "Events").trim(),
      viewName: String(c.viewName || "").trim(),
      maxRecords: Math.min(500, Math.max(1, parseInt(c.maxRecords, 10) || 200)),
      fieldMap: {
        date: String((c.fieldMap && c.fieldMap.date) || "Date"),
        title: String((c.fieldMap && c.fieldMap.title) || "Title"),
        description: String(
          (c.fieldMap && c.fieldMap.description) || "Description"
        ),
      },
    };
  }

  function setEventsMessage(msg) {
    if (eventsStatus) eventsStatus.textContent = msg || "";
  }

  function parseEventDate(v) {
    if (!v) return null;
    if (v instanceof Date) return v;
    if (typeof v !== "string") return null;

    var s = v.trim();
    // Airtable date field commonly returns "YYYY-MM-DD". Parsing that with new Date()
    // treats it as UTC, which can shift the displayed day by timezone.
    var m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T)/);
    if (m) {
      var y = parseInt(m[1], 10);
      var mo = parseInt(m[2], 10);
      var da = parseInt(m[3], 10);
      if (!isNaN(y) && !isNaN(mo) && !isNaN(da)) {
        // Local midnight, stable for display.
        return new Date(y, mo - 1, da, 0, 0, 0, 0);
      }
    }

    var d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  function pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function formatEventShort(d) {
    if (!d) return { text: "TBA", datetime: "" };
    var month = d.toLocaleString(undefined, { month: "short" }).toUpperCase();
    var day = String(d.getDate());
    // Build YYYY-MM-DD from local date parts (not toISOString()) to avoid timezone shifts.
    var iso =
      d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
    return { text: month + " " + day, datetime: iso };
  }

  function renderEvents(items) {
    if (!eventList) return;
    var html = "";
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var dateInfo = formatEventShort(it.dateObj);
      html +=
        '<li class="event-row is-visible">' +
        (dateInfo.datetime
          ? '<time class="event-date" datetime="' +
            escapeHtml(dateInfo.datetime) +
            '">' +
            escapeHtml(dateInfo.text) +
            "</time>"
          : '<span class="event-date">' +
            escapeHtml(dateInfo.text) +
            "</span>") +
        '<div class="event-body">' +
        "<h3>" +
        escapeHtml(it.title || "Untitled event") +
        "</h3>" +
        (it.description ? "<p>" + escapeHtml(it.description) + "</p>" : "") +
        "</div></li>";
    }
    eventList.innerHTML = html;
  }

  function initEvents() {
    if (!eventList) return;

    var cfg = getEventsConfig();
    if (!cfg || !cfg.token || !cfg.baseId || !cfg.tableName) {
      setEventsMessage(
        "Add an Events table and set PSA_AIRTABLE_EVENTS in airtable-config.js to load live events."
      );
      renderEvents([]);
      return;
    }

    // Keep section clean: only show messages for errors / empty states.
    setEventsMessage("");
    renderEvents([
      {
        dateObj: null,
        title: "Loading…",
        description: "Fetching from Airtable.",
      },
      {
        dateObj: null,
        title: "Loading…",
        description: "Fetching from Airtable.",
      },
    ]);

    var urlBase =
      "https://api.airtable.com/v0/" +
      encodeURIComponent(cfg.baseId) +
      "/" +
      encodeURIComponent(cfg.tableName);

    fetchAllAirtableRecords(cfg, urlBase, cfg.maxRecords)
      .then(function (records) {
        var fm = cfg.fieldMap;
        var items = [];
        for (var r = 0; r < records.length; r++) {
          var rec = records[r];
          if (!rec || !rec.fields) continue;
          var f = rec.fields;
          var d = parseEventDate(f[fm.date]);
          var title = f[fm.title];
          var desc = f[fm.description];
          items.push({
            dateObj: d,
            title:
              typeof title === "string"
                ? title
                : title != null
                ? String(title)
                : "",
            description:
              typeof desc === "string"
                ? desc
                : desc != null
                ? String(desc)
                : "",
          });
        }

        if (!cfg.viewName) {
          items.sort(function (a, b) {
            var ad = a.dateObj ? a.dateObj.getTime() : Infinity;
            var bd = b.dateObj ? b.dateObj.getTime() : Infinity;
            return ad - bd;
          });
        }

        renderEvents(items);
        setEventsMessage(
          items.length ? "" : "No events yet—add rows in Airtable."
        );
      })
      .catch(function (err) {
        renderEvents([]);
        if (err && typeof err === "object" && err.status && err.url) {
          setEventsMessage(
            "Could not load Events from Airtable: " +
              err.status +
              " (Calling: " +
              err.url +
              ")"
          );
          return;
        }
        setEventsMessage(
          "Could not load Events from Airtable: " +
            (err && err.message ? err.message : String(err))
        );
      });
  }

  function setBoardMessage(msg) {
    if (boardStatus) boardStatus.textContent = msg || "";
  }

  function setBoardLead(text) {
    if (boardLead && text) boardLead.textContent = text;
  }

  function initBoardGrid() {
    if (!boardGrid) return;

    var cfg = getAirtableConfig();
    if (!cfg || !cfg.token || !cfg.baseId || !cfg.tableName) {
      paintBoardSlots([]);
      setBoardMessage(
        "Configure token, baseId, and tableName in airtable-config.js to load live photos."
      );
      return;
    }

    // Light loading state (no fixed card limit).
    paintBoardSlots([
      {
        loading: true,
        name: "Loading…",
        role: "Fetching from Airtable…",
        photoUrl: "",
      },
      {
        loading: true,
        name: "Loading…",
        role: "Fetching from Airtable…",
        photoUrl: "",
      },
      {
        loading: true,
        name: "Loading…",
        role: "Fetching from Airtable…",
        photoUrl: "",
      },
      {
        loading: true,
        name: "Loading…",
        role: "Fetching from Airtable…",
        photoUrl: "",
      },
      {
        loading: true,
        name: "Loading…",
        role: "Fetching from Airtable…",
        photoUrl: "",
      },
    ]);

    var path =
      "https://api.airtable.com/v0/" +
      encodeURIComponent(cfg.baseId) +
      "/" +
      encodeURIComponent(cfg.tableName);
    var urlBase = path;

    function airtableHint(status, rawMsg) {
      var base = String(cfg.baseId || "");
      var table = String(cfg.tableName || "");
      var endpoint = "v0/" + base + "/" + table;
      if (status === 401 || status === 403) {
        return (
          "Auth issue. In Airtable token settings, make sure your token has scope data.records:read AND access to this base. " +
          "Also confirm baseId starts with app…"
        );
      }
      if (status === 404) {
        return (
          "Not found. Usually this means baseId or tableName is wrong, OR the token doesn't have access to that base. " +
          "Check: baseId should look like appXXXXXXXXXXXXXX (not a share link), and tableName must match exactly (e.g. Table 1)."
        );
      }
      if (status === 422) {
        return "Bad request. Check viewName (if set) matches a real view, and fieldMap names match your Airtable columns.";
      }
      return (
        "Config used: " +
        endpoint +
        ". If this keeps failing, double-check baseId/tableName in airtable-config.js."
      );
    }

    fetchAllAirtableRecords(cfg, urlBase, cfg.maxRecords)
      .then(function (records) {
        var fm = cfg.fieldMap;
        var slots = [];
        for (var r = 0; r < records.length; r++) {
          var rec = records[r];
          if (!rec || !rec.fields) continue;
          var f = rec.fields;
          var nm = f[fm.name];
          var rl = f[fm.role];
          slots.push({
            name: typeof nm === "string" ? nm : nm != null ? String(nm) : "",
            role: typeof rl === "string" ? rl : rl != null ? String(rl) : "",
            photoUrl: pickPhotoUrl(f, fm.photo),
          });
        }
        paintBoardSlots(slots);
        // Keep the board section clean: only show a message on errors / empty state.
        setBoardMessage(
          slots.length
            ? ""
            : "No board members yet—add rows in Airtable to display them here."
        );
        setBoardLead(
          "The people behind PSA here to help, host, and build community."
        );
      })
      .catch(function (err) {
        paintBoardSlots([]);
        if (err && typeof err === "object" && err.status && err.url) {
          var raw = String(err.body || "");
          var parsed = null;
          try {
            parsed = raw ? JSON.parse(raw) : null;
          } catch (e) {
            parsed = null;
          }
          var msg = "";
          if (parsed && typeof parsed === "object") {
            msg =
              parsed.error && typeof parsed.error === "string"
                ? parsed.error
                : "";
            if (!msg && parsed.message && typeof parsed.message === "string")
              msg = parsed.message;
          }
          var hint = airtableHint(err.status, msg || raw);
          setBoardMessage(
            "Could not load Airtable: " +
              err.status +
              (msg ? " " + msg : "") +
              " — " +
              hint +
              " (Calling: " +
              err.url +
              ")"
          );
          return;
        }
        setBoardMessage(
          "Could not load Airtable: " +
            (err && err.message ? err.message : String(err))
        );
      });
  }

  if (boardTrack && boardGrid) {
    window.addEventListener("resize", function () {
      clearTimeout(boardMarqueeResizeTimer);
      boardMarqueeResizeTimer = setTimeout(syncBoardMarqueeSpeed, 120);
    });
  }

  initBoardGrid();
  initEvents();
})();
