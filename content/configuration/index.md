---
title: Configuration
date: 2025-12-14
tags:
  - theme
  - configuration
categories:
  - documentation
---

## Configuring Remsleep

Remsleep is highly configurable through two main files: `quartz.config.ts` and `quartz.layout.ts`.

### Global Configuration (`quartz.config.ts`)

#### Basic Settings

```typescript
const config: QuartzConfig = {
  configuration: {
    pageTitle: "My Digital Garden",
    pageTitleSuffix: "",
    baseUrl: "yourdomain.com",
    locale: "en-US",
    enableSPA: true,
    enablePopovers: true,
  }
}
```

| Option | Type | Description |
|--------|------|-------------|
| `pageTitle` | `string` | Site title shown in header and browser tab |
| `pageTitleSuffix` | `string` | Optional suffix added to page titles |
| `baseUrl` | `string` | Your domain (without https://) |
| `locale` | `string` | Language/locale for date formatting |
| `enableSPA` | `boolean` | Enable single-page app navigation |
| `enablePopovers` | `boolean` | Enable hover previews on links |

#### Filter Settings

```typescript
configuration: {
  filterTags: ["thoughts", "projects", "notes", "learning"],
  filterCategories: ["framework", "creation", "question"],
  showPostTags: true,
}
```

| Option | Type | Description |
|--------|------|-------------|
| `filterTags` | `string[]` | Tags to show in the filter bar. If not set, auto-generates from posts. |
| `filterCategories` | `string[]` | Categories for filtering posts |
| `showPostTags` | `boolean` | Whether to display tags on each post item in lists. Default: `true` |

#### Theme Configuration

```typescript
theme: {
  typography: {
    header: "PT Sans",
    body: "PT Sans",
    code: "IBM Plex Mono",
  },
  colors: {
    lightMode: {
      light: "#ffffff",
      dark: "#313131",
      secondary: "#268bd2",  // Link color
      // ... see full options in quartz.config.ts
    },
    darkMode: {
      light: "#1a1a1a",
      dark: "#ebebec",
      secondary: "#6a9fb5",
      // ... see full options in quartz.config.ts
    },
  },
}
```

#### Ignore Patterns

```typescript
configuration: {
  ignorePatterns: ["private", "templates", ".obsidian", "drafts"],
}
```

Files and folders matching these patterns won't be published.

### Layout Configuration (`quartz.layout.ts`)

#### SidebarNav Options

Configure the right sidebar navigation:

```typescript
Component.SidebarNav({
  sections: [
    { title: "About", slug: "about" },
    { title: "Projects", slug: "projects" },
    { title: "Notes", slug: "notes" },
  ],
  postsLink: { title: "Blog", slug: "posts" },
  showHome: true,
  showDarkmode: true,
  showCopyright: true,
  showGithub: true,
  githubUrl: "https://github.com/yourusername",
  homeTitle: "My Site", // Optional: custom home button text
})
```

| Option | Type | Description |
|--------|------|-------------|
| `sections` | `{title, slug}[]` | Navigation links to your main sections |
| `postsLink` | `{title, slug}` | Link to posts section |
| `showHome` | `boolean` | Show home button |
| `showGithub` | `boolean` | Show GitHub link |
| `githubUrl` | `string` | GitHub profile or repo URL |
| `showCopyright` | `boolean` | Show copyright notice |
| `showDarkmode` | `boolean` | Show theme toggle |
| `showReaderMode` | `boolean` | Show reader mode toggle |
| `homeTitle` | `string` | Custom home button text (defaults to `pageTitle`) |

#### PostsListWithFilter Options

Configure in `quartz/plugins/emitters/contentPage.tsx`:

```typescript
pageBody: PostsListWithFilter({
  targetSlugs: ["index", "posts/index"],
  showAboutSection: false,
  postsPerPage: 10,
  showPagination: true,
  postsPrefixes: ["posts/"],
})
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `targetSlugs` | `string[]` | `["index", "posts/index"]` | Pages where the component renders |
| `showAboutSection` | `boolean` | `false` | Show intro content above posts |
| `postsPerPage` | `number` | `10` | Posts per page |
| `showPagination` | `boolean` | `true` | Show pagination controls |
| `postsPrefixes` | `string[]` | `["posts/"]` | Folder prefixes to include as posts |

#### Conditional Rendering

Hide components on specific pages:

```typescript
// Hide on posts list pages
Component.ConditionalRender({
  component: Component.ContentMeta(),
  condition: (page) => ![\"index\", \"posts/index\"].includes(page.fileData.slug ?? \"\"),
})

// Show only on content pages (not section indexes)
Component.ConditionalRender({
  component: Component.TableOfContents(),
  condition: (page) => {
    const slug = page.fileData.slug ?? \"\"
    if (slug === \"index\") return false
    const parts = slug.split(\"/\")
    return !(parts.length === 2 && parts[1] === \"index\")
  },
})
```

### Custom Colors

The signature blue sidebar color is defined in `quartz/styles/custom.scss`:

```scss
.sidebar.right {
  background-color: #234bc2 !important;  // Hugo theme-base-02
}
```

You can customize this and other colors by editing `custom.scss` or the theme colors in `quartz.config.ts`.

### Analytics

Add analytics tracking:

```typescript
configuration: {
  analytics: {
    provider: "plausible",
  },
}
```

Supported providers: `plausible`, `google`, `umami`, `goatcounter`
