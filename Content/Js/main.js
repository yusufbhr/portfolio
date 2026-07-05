// ============================================================================
// Portfolio — client-side behaviour
// Namespace / object-literal module pattern (Props / Selectors / Refs / init).
// No build step; loaded with <script defer>.
// ============================================================================

var Portfolio = Portfolio || {};

// ----------------------------------------------------------------------------
// Nav — hamburger toggle, close-on-navigate, scroll-spy active link
// ----------------------------------------------------------------------------
Portfolio.Nav = {
    Props: {
        OpenClass: "is-open",
        ActiveClass: "is-active"
    },
    Selectors: {
        header: ".header-01",
        hamb: ".hamb",
        link: ".level-01 a",
        section: "main section[id]"
    },
    Refs: {},

    init: function () {
        this.Refs.header = document.querySelector(this.Selectors.header);
        this.Refs.hamb = document.querySelector(this.Selectors.hamb);
        this.Refs.links = document.querySelectorAll(this.Selectors.link);
        this.Refs.sections = document.querySelectorAll(this.Selectors.section);

        if (!this.Refs.header) {
            return;
        }

        this.bindHamburger();
        this.bindLinks();
        this.bindScrollSpy();
    },

    closeMenu: function () {
        this.Refs.header.classList.remove(this.Props.OpenClass);
        if (this.Refs.hamb) {
            this.Refs.hamb.setAttribute("aria-expanded", "false");
        }
    },

    bindHamburger: function () {
        var self = this;
        if (!this.Refs.hamb) {
            return;
        }
        this.Refs.hamb.addEventListener("click", function () {
            var open = self.Refs.header.classList.toggle(self.Props.OpenClass);
            self.Refs.hamb.setAttribute("aria-expanded", open ? "true" : "false");
        });
    },

    bindLinks: function () {
        var self = this;
        for (var i = 0; i < this.Refs.links.length; i++) {
            this.Refs.links[i].addEventListener("click", function () {
                self.closeMenu();
            });
        }
    },

    bindScrollSpy: function () {
        var self = this;
        if (!this.Refs.sections.length || !("IntersectionObserver" in window)) {
            return;
        }
        var observer = new IntersectionObserver(function (entries) {
            for (var i = 0; i < entries.length; i++) {
                if (entries[i].isIntersecting) {
                    self.setActive(entries[i].target.id);
                }
            }
        }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });

        for (var j = 0; j < this.Refs.sections.length; j++) {
            observer.observe(this.Refs.sections[j]);
        }
    },

    setActive: function (id) {
        for (var i = 0; i < this.Refs.links.length; i++) {
            var href = this.Refs.links[i].getAttribute("href") || "";
            this.Refs.links[i].classList.toggle(this.Props.ActiveClass, href === "#" + id);
        }
    }
};

// ----------------------------------------------------------------------------
// Reveal — fade/slide sections and cards in as they enter the viewport
// ----------------------------------------------------------------------------
Portfolio.Reveal = {
    Props: {
        RevealClass: "reveal",
        VisibleClass: "is-visible"
    },
    Selectors: {
        targets: [
            ".Section-01 .Section-01-pill",
            ".Section-01 .b-item",
            ".Section-01 .b-item-01",
            ".Section-01 .Section-01-cta",
            ".Micro-Other-01",
            ".Section-03-lead",
            ".Section-03-stats",
            ".Section-03-marquee",
            ".Section-03-exp-item",
            ".Cards-02",
            ".Section-04-inner > *"
        ].join(",")
    },

    init: function () {
        var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduce || !("IntersectionObserver" in window)) {
            return; // leave everything visible
        }

        var self = this;
        var nodes = document.querySelectorAll(this.Selectors.targets);
        for (var i = 0; i < nodes.length; i++) {
            nodes[i].classList.add(this.Props.RevealClass);
        }

        var observer = new IntersectionObserver(function (entries, obs) {
            for (var j = 0; j < entries.length; j++) {
                if (entries[j].isIntersecting) {
                    entries[j].target.classList.add(self.Props.VisibleClass);
                    obs.unobserve(entries[j].target);
                }
            }
        }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });

        for (var k = 0; k < nodes.length; k++) {
            observer.observe(nodes[k]);
        }
    }
};

// ----------------------------------------------------------------------------
// Glow — publishes pointer position as CSS custom properties so project
// cards (Section-02-grid) can paint a cursor-tracked spotlight ring.
// Skipped on touch/coarse pointers, where hover doesn't apply anyway.
// ----------------------------------------------------------------------------
Portfolio.Glow = {
    Refs: {},

    init: function () {
        var fine = window.matchMedia && window.matchMedia("(pointer: fine)").matches;
        if (!fine) {
            return;
        }

        this.Refs.root = document.documentElement;
        document.addEventListener("pointermove", this.onPointerMove.bind(this));
    },

    onPointerMove: function (e) {
        this.Refs.root.style.setProperty("--x", e.clientX);
        this.Refs.root.style.setProperty("--y", e.clientY);
        this.Refs.root.style.setProperty("--xp", (e.clientX / window.innerWidth).toFixed(4));
    }
};

// ----------------------------------------------------------------------------
// CopyContact — click-to-copy for the email/phone buttons in Section-04.
// Shows a small "Kopyalandı ✓" tooltip for a couple of seconds after copying.
// ----------------------------------------------------------------------------
Portfolio.CopyContact = {
    Props: {
        CopiedClass: "is-copied",
        RevertDelay: 1600
    },
    Selectors: {
        button: "[data-copy]"
    },
    Refs: {},

    init: function () {
        if (!navigator.clipboard) {
            return;
        }

        this.Refs.buttons = document.querySelectorAll(this.Selectors.button);
        for (var i = 0; i < this.Refs.buttons.length; i++) {
            this.bindButton(this.Refs.buttons[i]);
        }
    },

    bindButton: function (button) {
        var self = this;
        var timeoutId;

        button.addEventListener("click", function () {
            var value = button.getAttribute("data-copy");
            navigator.clipboard.writeText(value).then(function () {
                button.classList.add(self.Props.CopiedClass);
                clearTimeout(timeoutId);
                timeoutId = setTimeout(function () {
                    button.classList.remove(self.Props.CopiedClass);
                }, self.Props.RevertDelay);
            });
        });
    }
};

// ----------------------------------------------------------------------------
// I18n — TR/EN content switch. No page reload, no build step: every
// translatable node carries a data-i18n(-html/-attr) key, this module
// swaps textContent/innerHTML/attributes and remembers the choice.
// ----------------------------------------------------------------------------
Portfolio.I18n = {
    Props: {
        StorageKey: "portfolio-lang",
        Default: "tr",
        ActiveClass: "is-active"
    },
    Refs: {},

    Dict: {
        "meta.title": {
            tr: "Yusuf Bahri Karaca — Frontend Developer",
            en: "Yusuf Bahri Karaca — Frontend Developer"
        },
        "meta.description": {
            tr: "Yusuf Bahri Karaca — İstanbul merkezli Mid-Level Frontend Developer. React, TypeScript, SCSS ve ASP.NET ile hızlı, erişilebilir ve zarif web arayüzleri.",
            en: "Yusuf Bahri Karaca — Istanbul-based Mid-Level Frontend Developer. Fast, accessible, elegant web interfaces built with React, TypeScript, SCSS, and ASP.NET."
        },
        "nav.about": { tr: "Hakkımda", en: "About" },
        "nav.projects": { tr: "Projeler", en: "Projects" },
        "nav.contact": { tr: "İletişim", en: "Contact" },
        "nav.cv": { tr: "CV İndir", en: "Download CV" },

        "hero.badge": {
            tr: "Freelance & tam zamanlı işlere açığım",
            en: "Available for freelance & full-time roles"
        },
        "hero.name": {
            tr: "Yusuf Bahri Karaca",
            en: "Yusuf Bahri Karaca"
        },
        "hero.title": {
            tr: 'Dijital ürünleri <span class="hl">hızlı ve zarif</span> arayüzlere dönüştürüyorum.',
            en: 'I turn digital products into <span class="hl">fast, elegant</span> interfaces.'
        },
        "hero.sub": {
            tr: "Ben Yusuf Bahri Karaca — 4+ yıl deneyimli Frontend Developer. Lidia e-ticaret ekosisteminin tek frontend mühendisi olarak fikirleri üretime hazır, erişilebilir ve pikselinde arayüzlere dönüştürüyorum.",
            en: "I'm Yusuf Bahri Karaca — a Frontend Developer with 4+ years of experience. As the sole frontend engineer for the Lidia e-commerce ecosystem, I turn ideas into production-ready, accessible, pixel-perfect interfaces."
        },
        "hero.ctaPrimary": { tr: "Projelerimi gör", en: "See my projects" },
        "hero.ctaSecondary": { tr: "İletişime geç", en: "Get in touch" },

        "about.eyebrow": { tr: "Hakkımda", en: "About" },
        "about.title": { tr: "Uçtan uca tasarlayıp geliştiriyorum.", en: "I design and build end to end." },
        "about.p1": {
            tr: "4 yılı aşkın süredir modern web standartları, duyarlı tasarım ve bileşen odaklı mimari üzerine çalışıyorum. Arayüzü kusursuz hissettiren detaylara — performans, erişilebilirlik ve akıcı etkileşime — önem veriyorum.",
            en: "For 4+ years I've worked with modern web standards, responsive design, and component-driven architecture. I care about the details that make an interface feel flawless — performance, accessibility, and fluid interaction."
        },
        "about.p2": {
            tr: "Feux Digital'de Lidia e-ticaret ekosisteminin (PIM, Console, Merchant Console) tek frontend mühendisiyim; ayrıca TEB, Kale, Kalekim ve Biboya gibi yüksek trafikli kurumsal siteler için kritik geliştirmeler yaptım.",
            en: "At Feux Digital, I'm the sole frontend engineer for the Lidia e-commerce ecosystem (PIM, Console, Merchant Console); I've also shipped critical work for high-traffic corporate sites like TEB, Kale, Kalekim, and Biboya."
        },
        "about.stat1": { tr: "Yıl deneyim", en: "Years of experience" },
        "about.stat2": { tr: "Kurumsal proje", en: "Corporate projects" },
        "about.stat3": { tr: "AI ile hız kazancı", en: "Speed gain with AI" },
        "about.marqueeAria": { tr: "Yetenekler", en: "Skills" },

        "exp.eyebrow": { tr: "Deneyim", en: "Experience" },
        "exp.role3": { tr: "Yazılım Mühendisi — Stajyer", en: "Software Engineer — Intern" },
        "exp.city1": { tr: "Feux Digital · İstanbul", en: "Feux Digital · Istanbul" },
        "exp.city2": { tr: "BilgeAdam Teknoloji · İstanbul", en: "BilgeAdam Teknoloji · Istanbul" },
        "exp.city3": { tr: "Szutest Teknoloji · İstanbul", en: "Szutest Teknoloji · Istanbul" },
        "exp.period1": { tr: "Nis 2023 — Haz 2026", en: "Apr 2023 — Jun 2026" },
        "exp.period2": { tr: "Haz 2021 — Oca 2022", en: "Jun 2021 — Jan 2022" },
        "exp.period3": { tr: "Mar 2021 — Haz 2021", en: "Mar 2021 — Jun 2021" },

        "projects.eyebrow": { tr: "Projeler", en: "Projects" },
        "projects.title": { tr: "Seçili Çalışmalar", en: "Selected Work" },
        "projects.sub": {
            tr: "Uçtan uca geliştirdiğim ürünler ve katkı verdiğim yüksek trafikli kurumsal işlerden bir seçki.",
            en: "A selection of products I've built end to end and high-traffic corporate work I've contributed to."
        },

        "card.lidia.alt": { tr: "Lidia e-ticaret ekosistemi arayüz görseli", en: "Lidia e-commerce ecosystem interface visual" },
        "card.lidia.title": { tr: "Lidia E-ticaret Ekosistemi", en: "Lidia E-commerce Ecosystem" },
        "card.lidia.desc": {
            tr: "PIM, Console ve Merchant Console: uçtan uca tek frontend mühendisi olarak geliştirdiğim çok modüllü e-ticaret platformu.",
            en: "PIM, Console, and Merchant Console: a multi-module e-commerce platform I built end to end as the sole frontend engineer."
        },
        "card.lidia.note": { tr: "Özel proje · Feux Digital", en: "Private project · Feux Digital" },

        "card.nft.alt": { tr: "NFT Web Side arayüz görseli", en: "NFT Web Side interface visual" },
        "card.nft.desc": {
            tr: "Bir NFT koleksiyonu için modern, animasyonlu ve tamamen duyarlı tanıtım arayüzü.",
            en: "A modern, animated, fully responsive showcase site for an NFT collection."
        },
        "card.nft.link": { tr: "GitHub'da gör", en: "View on GitHub" },

        "card.teb.alt": { tr: "TEB StartTEB arayüz görseli", en: "TEB StartTEB interface visual" },
        "card.teb.desc": {
            tr: "startteb.com için kritik özellik geliştirmeleri, performans iyileştirmeleri ve hata düzeltmeleri.",
            en: "Critical feature development, performance improvements, and bug fixes for startteb.com."
        },
        "card.teb.link": { tr: "Siteyi ziyaret et", en: "Visit site" },

        "card.kale.alt": { tr: "Kale kurumsal site arayüz görseli", en: "Kale corporate site interface visual" },
        "card.kale.desc": {
            tr: "kale.com.tr kurumsal sitesi için arayüz geliştirmeleri, çapraz tarayıcı uyumu ve bakım.",
            en: "Interface development, cross-browser compatibility, and maintenance for the kale.com.tr corporate site."
        },
        "card.kale.link": { tr: "Siteyi ziyaret et", en: "Visit site" },

        "card.kalekim.alt": { tr: "Kalekim kurumsal site arayüz görseli", en: "Kalekim corporate site interface visual" },
        "card.kalekim.desc": {
            tr: "Kalekim kurumsal web arayüzü için özellik geliştirmeleri ve responsive iyileştirmeler.",
            en: "Feature development and responsive improvements for the Kalekim corporate web interface."
        },
        "card.kalekim.link": { tr: "Siteyi ziyaret et", en: "Visit site" },

        "card.biboya.alt": { tr: "Biboya arayüz görseli", en: "Biboya interface visual" },
        "card.biboya.desc": {
            tr: "Biboya için duyarlı, kullanıcı odaklı arayüz geliştirmeleri ve sürekli bakım.",
            en: "Responsive, user-focused interface development and ongoing maintenance for Biboya."
        },
        "card.biboya.note": { tr: "Kurumsal katkı · Feux Digital", en: "Corporate contribution · Feux Digital" },

        "contact.badge": { tr: "Yeni projelere açığım", en: "Open to new projects" },
        "contact.title": {
            tr: 'Birlikte harika bir şey <span class="hl">inşa edelim.</span>',
            en: 'Let\'s <span class="hl">build something great</span> together.'
        },
        "contact.sub": {
            tr: "Bir projen mi var, yoksa sadece merhaba mı demek istiyorsun? Kutum her zaman açık.",
            en: "Have a project in mind, or just want to say hi? My inbox is always open."
        },
        "contact.copied": { tr: "Kopyalandı ✓", en: "Copied ✓" },

        "footer.copyright": { tr: "© 2026 Yusuf Bahri Karaca — Tüm hakları saklıdır.", en: "© 2026 Yusuf Bahri Karaca — All rights reserved." },
        "footer.built": {
            tr: "İstanbul'da, Bricolage Grotesque + Geist ile tasarlandı.",
            en: "Designed in Istanbul with Bricolage Grotesque + Geist."
        },

        "aria.homepage": { tr: "Ana sayfa", en: "Homepage" },
        "aria.menu": { tr: "Menüyü aç/kapat", en: "Toggle menu" },
        "aria.mainNav": { tr: "Ana menü", en: "Main menu" },
        "aria.subNav": { tr: "Alt menü", en: "Secondary menu" },
        "aria.langSwitch": { tr: "Dil seçimi", en: "Language selector" }
    },

    init: function () {
        this.Refs.langButtons = document.querySelectorAll("[data-lang]");
        this.Refs.textNodes = document.querySelectorAll("[data-i18n]");
        this.Refs.htmlNodes = document.querySelectorAll("[data-i18n-html]");
        this.Refs.attrNodes = document.querySelectorAll("[data-i18n-attr]");

        var saved = localStorage.getItem(this.Props.StorageKey);
        this.apply(saved === "en" ? "en" : this.Props.Default);
        this.bindButtons();
    },

    bindButtons: function () {
        var self = this;
        for (var i = 0; i < this.Refs.langButtons.length; i++) {
            this.Refs.langButtons[i].addEventListener("click", function () {
                self.apply(this.getAttribute("data-lang"));
            });
        }
    },

    apply: function (lang) {
        document.documentElement.lang = lang;
        localStorage.setItem(this.Props.StorageKey, lang);

        for (var i = 0; i < this.Refs.langButtons.length; i++) {
            var btn = this.Refs.langButtons[i];
            btn.classList.toggle(this.Props.ActiveClass, btn.getAttribute("data-lang") === lang);
        }

        for (var j = 0; j < this.Refs.textNodes.length; j++) {
            var textEl = this.Refs.textNodes[j];
            var textEntry = this.Dict[textEl.getAttribute("data-i18n")];
            if (textEntry) {
                textEl.textContent = textEntry[lang];
            }
        }

        for (var k = 0; k < this.Refs.htmlNodes.length; k++) {
            var htmlEl = this.Refs.htmlNodes[k];
            var htmlEntry = this.Dict[htmlEl.getAttribute("data-i18n-html")];
            if (htmlEntry) {
                htmlEl.innerHTML = htmlEntry[lang];
            }
        }

        for (var m = 0; m < this.Refs.attrNodes.length; m++) {
            var attrEl = this.Refs.attrNodes[m];
            var parts = attrEl.getAttribute("data-i18n-attr").split(":");
            var attrEntry = this.Dict[parts[1]];
            if (attrEntry) {
                attrEl.setAttribute(parts[0], attrEntry[lang]);
            }
        }

        var titleEntry = this.Dict["meta.title"];
        if (titleEntry) {
            document.title = titleEntry[lang];
        }
    }
};

// ----------------------------------------------------------------------------
// Boot
// ----------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", function () {
    document.documentElement.classList.add("has-js");
    Portfolio.Nav.init();
    Portfolio.Reveal.init();
    Portfolio.Glow.init();
    Portfolio.CopyContact.init();
    Portfolio.I18n.init();
});
