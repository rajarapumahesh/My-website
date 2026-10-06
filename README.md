# Mahesh Rajarapu — Research Portfolio

GitHub Pages: https://rajarapumahesh.github.io/My-website/

The existing charcoal, orange, purple, teal, and cyan theme is retained, including
the portrait sidebar, landscape quote banner, fonts, and original page URLs.
Compact sections and responsive behavior extend that design. Production pages
use plain HTML, CSS, and JavaScript, with no runtime packages or content fetches.
The blue quote banner fills the main content width. A sidebar research snapshot
shows CV-derived accepted-work and platform counts, research topics, and quick
CV/experience links; the sidebar scrolls when the viewport is short.

## Source layout

```text
content/resume.json          Single source of current CV facts and project links
templates/                  Original page shells used during generation
scripts/build.py            Static page generator (Python standard library only)
scripts/verify.cjs           Optional browser verification
assets/css/*.css             Original page-specific theme styles
assets/css/enhancements.css  Compact cards, filters, accessibility, responsive layout
assets/js/reports.js         Resource feedback drafts and accessible modal
assets/js/enhancements.js    Shared navigation, search/filtering, reference copy, PDF preview
*.html                      Generated pages served directly by GitHub Pages
assets/images/              Portraits, banner, and presentation photos
assets/icons/               Social icons
assets/documents/           Latest CV, previous resume, and existing PDFs
sitemap.xml                 Generated canonical page URLs
```

Images and PDFs are grouped under `assets/`. Filenames are retained, and page
templates, generated HTML, CV previews, and social preview images use the new paths.

## Updating the site

Edit CV facts in `content/resume.json`. Edit page composition in `scripts/build.py`
and layout shells in `templates/`. Edit visual additions in
`assets/css/enhancements.css`; the original style files preserve the theme.

```sh
python scripts/build.py
python -m http.server 8000
```

Preview at http://localhost:8000/. Commit the generated HTML and sitemap together
with changed source files. Do not edit generated HTML directly: the next build
will overwrite it. Existing reports and slide links come from the original
templates; update those there. Some external archival tools may require their
own access permissions.

## Features

- Current research role, education, experience, dissertation, skills, funding,
  achievements, leadership, courses, languages, and academic references.
- Eight research/IP entries, with accepted, submitted, under-review, and published
  patent-application statuses separated. No publication URLs are invented.
- Four deployed platforms and seven selected projects on `Projects.html`.
- Combined keyword/category filters, status counts, and reference copying.
- Local latest-CV download and on-demand PDF preview.
- Mobile navigation, skip link, keyboard focus, reduced-motion support, and
  pre-rendered content that remains available without JavaScript.
- Resource-specific feedback drafts with an explicit email handoff. The visitor
  reviews and sends through their own email app; the site does not send email.

Source of current academic facts: `assets/documents/Mahesh_CV.pdf`. Publication
statuses and ongoing appointments follow that CV and require future maintenance.

## Validation

Optional browser tools are development-only:

```sh
npm install --no-save @playwright/test
node scripts/verify.cjs
```

Keep the preview server running. Verification uses installed Chrome; set
`CHROME_PATH` for another local Chromium binary. It checks all seven pages at
five screen widths, preservation of core visual styles, local links, the latest
PDF, combined filters, copied references, feedback drafts, PDF loading, mobile
navigation, and JavaScript errors. Screenshots are saved under ignored
`artifacts/`.


## Publishing

The existing GitHub Pages source is `main` at the repository root. Push generated
pages, assets, the latest CV, and `.nojekyll` to that branch to retain the same URL.
Publishing requires write access to `rajarapumahesh/My-website`.
