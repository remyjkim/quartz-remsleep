# Jekyll to Hugo Migration Plan: remyjkim.com

## Overview

Migrating remyjkim.com from Jekyll (Lanyon theme) to Hugo while preserving the minimalist, content-first design and all existing functionality.

## Jekyll Site Analysis

### Current Structure
```
remyjkim.com/
├── _config.yml          # Site config
├── _posts/              # Blog posts (9 files)
├── _notes/              # Notes/utilities
├── _layouts/
│   ├── default.html
│   ├── post.html
│   └── page.html
├── _includes/
│   ├── head.html
│   └── sidebar.html
├── public/css/
│   ├── poole.css        # Base framework
│   ├── lanyon.css       # Theme customizations
│   └── syntax.css       # Code highlighting
├── files/               # Static assets/images
├── about.md
├── about_blog.md
├── bookshelf.md
├── questions.md
└── index.html           # Homepage with pagination
```

### Key Features to Preserve
1. **Sidebar navigation** with overlay behavior
2. **Post pagination** (currently 30 per page)
3. **Last modified dates** on posts
4. **Related posts** functionality
5. **Pretty permalinks** (e.g., `/2023/09/06/title/`)
6. **Lanyon design system** (minimal, sidebar, narrow content)
7. **Syntax highlighting**
8. **Static pages** (about, bookshelf, questions)

### Design Characteristics
- Body class: `layout-reverse sidebar-overlay theme-base-02`
- Sidebar on right, overlay mode
- Blue theme (#234bc2, #6a7fb5)
- PT Sans font family
- 15px base font size → 20px responsive
- 38rem max content width

## Hugo Project Structure

```
www.remyjkim.com/
├── hugo.toml                    # Main config
├── content/
│   ├── posts/                   # Blog posts as page bundles
│   │   └── 2023-09-06-commodities/
│   │       ├── index.md
│   │       └── [images]
│   ├── about.md
│   ├── bookshelf.md
│   └── questions.md
├── layouts/
│   ├── _default/
│   │   ├── baseof.html          # Base template (like Jekyll default.html)
│   │   ├── single.html          # Single page template
│   │   ├── list.html            # List pages (homepage, archives)
│   │   └── index.html           # Homepage with pagination
│   ├── posts/
│   │   └── single.html          # Blog post template
│   └── partials/
│       ├── head.html            # Head section
│       ├── sidebar.html         # Sidebar navigation
│       ├── masthead.html        # Site header
│       └── styles.html          # CSS loading
├── assets/css/
│   ├── poole.css
│   ├── lanyon.css
│   └── syntax.css
├── static/
│   └── files/                   # Migrated static assets
└── .ai/
    └── migration-plan.md        # This document
```

## Migration Steps

### Step 1: Configure Hugo (hugo.toml)

```toml
baseURL = "https://remyjkim.com"
title = "Remy Kim"
languageCode = "en-us"

[params]
  tagline = "Unbundling and Rebundling"
  description = ""
  author = "Remy K"
  authorEmail = "remyjkim8@gmail.com"
  authorTwitter = "remycancook"

# Pagination
[pagination]
  pagerSize = 30

# Permalinks matching Jekyll "pretty" format
[permalinks]
  posts = "/:year/:month/:day/:slug/"

# Content sections
[outputs]
  home = ["HTML"]
  section = ["HTML"]

# Taxonomy (if needed)
[taxonomies]
  tag = "tags"
  category = "categories"

# Markup config for code highlighting
[markup]
  [markup.goldmark]
    [markup.goldmark.renderer]
      unsafe = true  # Allow raw HTML in markdown
  [markup.highlight]
    style = "monokai"  # Or custom syntax theme
    lineNos = false
    lineNumbersInTable = false
```

### Step 2: Create CSS Architecture

**Approach:** Port existing CSS files with Hugo Pipes processing

1. Copy CSS files to `assets/css/`:
   - `poole.css` (base framework)
   - `lanyon.css` (theme)
   - `syntax.css` (highlighting)

2. Create `layouts/partials/styles.html`:
```html
{{ $poole := resources.Get "css/poole.css" }}
{{ $syntax := resources.Get "css/syntax.css" }}
{{ $lanyon := resources.Get "css/lanyon.css" }}

{{ $css := slice $poole $syntax $lanyon | resources.Concat "css/styles.css" | minify | fingerprint }}
<link rel="stylesheet" href="{{ $css.RelPermalink }}">
```

### Step 3: Create Base Template (layouts/_default/baseof.html)

Port Jekyll's `default.html` to Hugo:

```html
<!DOCTYPE html>
<html lang="{{ .Site.LanguageCode }}">
  {{ partial "head.html" . }}

  <body class="layout-reverse sidebar-overlay theme-base-02">
    {{ partial "sidebar.html" . }}

    <div class="wrap">
      {{ partial "masthead.html" . }}

      <div class="container content">
        {{ block "main" . }}{{ end }}
      </div>
    </div>
  </body>
</html>
```

### Step 4: Create Partials

**layouts/partials/head.html**
```html
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>{{ if not .IsHome }}{{ .Title }} - {{ end }}{{ .Site.Title }}</title>

  {{ with .Description }}
  <meta name="description" content="{{ . }}">
  {{ else }}
  <meta name="description" content="{{ .Site.Params.description }}">
  {{ end }}

  <!-- Font: PT Sans -->
  <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=PT+Serif:400,400italic,700%7CPT+Sans:400">

  {{ partial "styles.html" . }}
</head>
```

**layouts/partials/sidebar.html**
(Port from Jekyll `_includes/sidebar.html`)

**layouts/partials/masthead.html**
```html
<div class="masthead">
  <div class="container">
    <h3 class="masthead-title">
      <a href="/" title="Home">{{ .Site.Title }}</a>
      <small>{{ .Site.Params.tagline }}</small>
    </h3>
  </div>
</div>
```

### Step 5: Create Post Template (layouts/posts/single.html)

```html
{{ define "main" }}
<div class="post">
  <h1 class="post-title">{{ .Title }}</h1>
  <span class="post-date">{{ .Date.Format "Jan 02, 2006" }}</span>
  {{ with .Lastmod }}
  <h6 class="last-modified">Last modified at {{ .Format "Jan 02, 2006" }}</h6>
  {{ end }}

  <article>
    {{ .Content }}
  </article>
</div>

{{ $related := .Site.RegularPages.Related . | first 3 }}
{{ with $related }}
<div class="related">
  <h2>Related posts</h2>
  <ul class="related-posts">
    {{ range . }}
      <li>
        <h3>
          <a href="{{ .Permalink }}">
            {{ .Title }}
            <small>{{ .Date.Format "Jan 02, 2006" }}</small>
          </a>
        </h3>
      </li>
    {{ end }}
  </ul>
</div>
{{ end }}
{{ end }}
```

### Step 6: Create Homepage with Pagination (layouts/_default/list.html)

```html
{{ define "main" }}
<div class="posts">
  {{ $paginator := .Paginate (where .Site.RegularPages "Section" "posts") 30 }}
  {{ range $paginator.Pages }}
    <div class="post">
      <h1 class="post-title">
        <a href="{{ .Permalink }}">{{ .Title }}</a>
      </h1>
      <span class="post-date">{{ .Date.Format "Jan 02, 2006" }}</span>
      {{ .Summary }}
    </div>
  {{ end }}
</div>

<!-- Pagination -->
{{ template "_internal/pagination.html" . }}
{{ end }}
```

### Step 7: Migrate Content

**Posts Migration:**
1. Move `_posts/*.md` → `content/posts/`
2. Convert front matter:
   - Jekyll: `layout: post` → Hugo: (no layout needed, uses section)
   - Keep: `title`, `status`
   - Add: `slug` (if different from filename)
3. Fix image paths:
   - Jekyll: `../../../../files/path/image.png`
   - Hugo: Create page bundles, use relative paths

**Pages Migration:**
1. Move top-level `.md` files → `content/`
2. Convert front matter:
   - Jekyll: `layout: page` → Hugo: (default single template)

**Static Files:**
1. Move `files/` → `static/files/`
2. Update image references in posts

### Step 8: Handle Jekyll-Specific Features

**Last Modified Dates:**
- Jekyll uses `jekyll-last-modified-at` plugin
- Hugo: Use `lastmod` in front matter or Git integration

**Pagination:**
- Jekyll: `paginate: 30` in config
- Hugo: `.Paginate` with size parameter

**Related Posts:**
- Jekyll: `site.related_posts`
- Hugo: `.Site.RegularPages.Related .` (based on tags/categories)

### Step 9: Sidebar & Navigation

Port Jekyll's sidebar exactly:
- Checkbox toggle mechanism
- Navigation links
- Overlay behavior (CSS-based)

### Step 10: Testing Checklist

- [ ] All posts render correctly
- [ ] Pagination works (30 posts per page)
- [ ] Permalinks match Jekyll URLs
- [ ] Images display correctly
- [ ] Sidebar navigation works
- [ ] Syntax highlighting displays
- [ ] Last modified dates show
- [ ] Related posts appear
- [ ] Static pages render
- [ ] Responsive design works
- [ ] Typography matches original
- [ ] Colors match theme-base-02

## Key Differences: Jekyll vs Hugo

| Feature | Jekyll | Hugo |
|---------|--------|------|
| Config | `_config.yml` | `hugo.toml` |
| Posts dir | `_posts/` | `content/posts/` |
| Layouts | `_layouts/` | `layouts/` |
| Includes | `_includes/` | `layouts/partials/` |
| Templating | Liquid | Go templates |
| Pagination | `site.paginate` | `.Paginate` |
| Front matter date | `date` | `date` (same) |
| Last modified | Plugin | `lastmod` or Git |
| Related posts | `site.related_posts` | `.Site.RegularPages.Related` |
| Static files | `files/` | `static/files/` |

## Benefits of Hugo Migration

1. **Performance:** Hugo builds are significantly faster
2. **No Ruby dependencies:** Static Go binary
3. **Better asset pipeline:** Hugo Pipes for CSS/JS processing
4. **Page bundles:** Organize images with posts
5. **Built-in features:** Syntax highlighting, minification, fingerprinting
6. **Active development:** More frequent updates and features

## Next Steps

1. Complete Hugo project setup
2. Create all templates
3. Migrate content
4. Test thoroughly
5. Deploy to production
