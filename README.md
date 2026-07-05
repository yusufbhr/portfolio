# Portfolyo — Yusuf Karaca

Tek sayfalık kişisel portfolyo sitesi (HTML + SCSS + JS, framework yok).
Modern Sass modül sistemi (`@use` / `@forward`), tek giriş noktası
(`Content/Styles/Base.scss`) ve katmanlı klasör düzeni.

## Kullanım

```bash
npm install
npm run watch   # geliştirirken canlı derleme
npm run build   # üretim için sıkıştırılmış Content/Styles/Base.css
```

Siteyi yerelde açmak için kökten bir sunucu başlat:

```bash
python3 -m http.server 8765
# http://localhost:8765
```

HTML'de sadece derlenen dosya bağlıdır:

```html
<link rel="stylesheet" href="Content/Styles/Base.css" />
<script src="Content/Js/main.js" defer></script>
```

## Yapı

```
Portfolyo/
├── index.html             → tek sayfa (Hero, Hakkımda, Projeler, İletişim)
├── package.json           → sass build/dev/watch script'leri
└── Content/               → tüm asset'ler
    ├── Images/            → kendi üretilmiş SVG'ler (brand/, projects/, favicon.svg)
    ├── Js/
    │   └── main.js        → Portfolio.Nav + Portfolio.Reveal (namespace deseni)
    └── Styles/
        ├── Base.scss      → TEK giriş noktası (derlenen tek dosya)
        ├── _Font.scss     → @font-face (Syne) + temel tipografi (Inter)
        ├── Fonts/         → bundle'lı Syne dosyaları
        ├── Base/
        │   ├── _abstracts.scss  → token/fonksiyon/mixin toplayıcı (@forward)
        │   ├── _Colour.scss     → renk token'ları (dark tema + neutral + brand)
        │   ├── _Global.scss     → breakpoint'ler, responsive & yardımcı mixinler
        │   ├── _Reset.scss      → CSS reset
        │   ├── _Structure.scss  → html/body/.c-wrapper iskeleti + .reveal
        │   └── _Base.scss       → Reset + Structure toplayıcı
        └── Component/
            ├── Layout/          → Header, Footer
            ├── Micro/           → Cards, Other (küçük bileşenler)
            └── Section/         → Section01–04
```

## Kurallar

- Yeni bir partial'ın adı `_` ile başlar; sadece `Base.scss` `.css`'e derlenir.
- Değişken/mixin gereken her partial en üste şunu ekler:
  ```scss
  @use "../../Base/abstracts" as *;
  ```
- Media query yazarken elle değil mixin kullan:
  ```scss
  .foo {
      @include mobile { ... }
      @include tablet { ... }
      @include below-desktop { ... }
      @include desktop { ... }
  }
  ```
- Renkleri elle (`#fff`) değil, token ile yaz: `$bg-900`, `$brand-600`, `$text-000`, `$body-bg` …
- JS'te namespace / obje-literal deseni kullanılır (`var Portfolio = ...`, `Props / Selectors / Refs / init`).
