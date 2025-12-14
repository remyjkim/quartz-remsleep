Quartz v4 (the current docs are built with **Quartz v4.5.2** as of December 2025) gives you a fairly complete “digital garden toolbelt” out of the box—centered around **links**, **tags**, **hierarchies**, and **discovery UI**. ([Quartz][1])

## Direct answers to your relationship-management questions

* **Wikilinks:** Yes. Quartz supports Obsidian-style `[[wikilinks]]` (including display text overrides, header anchors, and block references). ([Quartz][2])
* **Backlinks:** Yes. Quartz can render a backlinks pane for each note showing incoming links (and those backlinks can use popover previews when enabled). ([Quartz][3])
* **Tags:** Yes. Tags exist both as **frontmatter fields** and (optionally) as **inline parsed tags** in content; Quartz generates tag listing pages and a global tag index. ([Quartz][4])
* **Keywords (automatic extraction):** No built-in “auto-keyword extraction” system is documented. Practically, Quartz expects you to model “keywords” via **tags**, **aliases**, and **links** (and then retrieve via **search**, **tag pages**, and the **graph/backlinks** UI). ([Quartz][5])

## The core relationship primitives Quartz gives you

### 1) Link graph (bi-directional navigation via incoming/outgoing links)

Quartz resolves and normalizes internal links (including Obsidian-style ones) using its link processing pipeline. ([Quartz][6])

**Supported link relationships include:**

* **Note-to-note** links: `[[note]]`
* **Note-to-heading** links: `[[note#Heading]]`
* **Note-to-block** links: `[[note#^blockid]]`
* **Embeds / transclusions**: `![[note]]`, `![[note#Heading]]`, `![[note#^blockid]]` ([Quartz][2])

These become first-class navigational relationships through:

* **Backlinks** (incoming link index per page) ([Quartz][3])
* **Graph View** (local + global knowledge graph exploration) ([Quartz][7])

### 2) Tags as a secondary, non-graph “facet” system

Quartz supports tags in multiple ways:

* **Frontmatter `tags`:** a native frontmatter field. ([Quartz][4])
* **Inline tag parsing (`#tag`)** via the Obsidian-flavored Markdown transformer (`parseTags`). ([Quartz][8])
* **Tag listing pages + tag hierarchy pages** (e.g., `plugin/emitter` generates listings at each level) and a **global `/tags` index**. ([Quartz][9])

### 3) Folder hierarchy as a navigable structure

Quartz treats folders as publishable “collections”:

* **Folder listing pages** for each folder and subfolder (and you can override folder titles/descriptions with `index.md` inside the folder). ([Quartz][9])
* **Breadcrumbs** expose folder ancestry as navigation. ([Quartz][10])
* **Explorer** provides a folder/file tree UI and can resolve folder display names from `folder/index.md` frontmatter. ([Quartz][11])

## Discovery and “findability” features for a knowledge garden

### Full-text search (including tag search)

Quartz ships a keyboard-accessible full-text search powered by Flexsearch and includes tag-oriented queries (e.g., prefix with `#` or use the tag-search shortcut). ([Quartz][12])

### Popover previews (context without leaving the page)

Hovering internal links can show a preview popup (including header-linked previews), and Quartz limits previews to in-vault pages by default. ([Quartz][13])

### Table of contents (intra-note structure)

Quartz can generate a TOC from headings and supports per-page disabling via frontmatter (`enableToc: false`). ([Quartz][14])

### Recent notes

A “recent notes” component can generate a list of recently updated/published notes with configurable filtering/sorting and optional tag display. ([Quartz][15])

## Metadata that matters for relationship management

Quartz natively supports frontmatter fields that help you stabilize and re-map relationships over time:

* **`permalink`** for stable URLs even if file paths change ([Quartz][4])
* **`aliases` / `alias`** for alternate names (useful for synonyms and linking ergonomics) ([Quartz][4])
* **AliasRedirects plugin** can emit redirect pages for aliases/permalinks so old links don’t rot. ([Quartz][16])

## Publication control (important for “public garden vs private vault”)

Quartz offers multiple approaches to keep content out of the built site:

* **Filter plugins** like “draft” filtering and an “explicit publish” approach. ([Quartz][17])
* **`ignorePatterns`** to exclude files/folders from parsing entirely. ([Quartz][17])

## What Quartz offers beyond relationship management (still relevant to gardens)

Quartz’s feature list is broad—27 items in the current docs—including Obsidian/Roam/OxHugo compatibility, Mermaid, LaTeX, citations, comments, RSS, social preview cards, SPA routing, i18n, reader mode, dark mode, etc. ([Quartz][1])

If you tell me how you currently structure your vault (folders-first, tags-first, MOCs/hubs, PARA, etc.), I can recommend a Quartz layout that makes those relationships legible (e.g., where to place backlinks, graph, explorer, and tag pages for maximum navigability) without adding custom code.

[1]: https://quartz.jzhao.xyz/features/ "Feature List"
[2]: https://quartz.jzhao.xyz/features/wikilinks "Wikilinks"
[3]: https://quartz.jzhao.xyz/features/backlinks "Backlinks"
[4]: https://quartz.jzhao.xyz/authoring-content "Authoring Content"
[5]: https://quartz.jzhao.xyz/plugins/Frontmatter "Frontmatter"
[6]: https://quartz.jzhao.xyz/plugins/CrawlLinks "CrawlLinks"
[7]: https://quartz.jzhao.xyz/features/graph-view "Graph View"
[8]: https://quartz.jzhao.xyz/plugins/ObsidianFlavoredMarkdown "ObsidianFlavoredMarkdown"
[9]: https://quartz.jzhao.xyz/features/folder-and-tag-listings "Folder and Tag Listings"
[10]: https://quartz.jzhao.xyz/features/breadcrumbs "Breadcrumbs"
[11]: https://quartz.jzhao.xyz/features/explorer "Explorer"
[12]: https://quartz.jzhao.xyz/features/full-text-search "Full-text Search"
[13]: https://quartz.jzhao.xyz/features/popover-previews "Popover Previews"
[14]: https://quartz.jzhao.xyz/features/table-of-contents "Table of Contents"
[15]: https://quartz.jzhao.xyz/features/recent-notes "Recent Notes"
[16]: https://quartz.jzhao.xyz/plugins/AliasRedirects "AliasRedirects"
[17]: https://quartz.jzhao.xyz/features/private-pages "Private Pages"
