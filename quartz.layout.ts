import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// Helper: Pages where PostsListWithFilter shows posts list instead of regular content
const postsListTargetSlugs = ["index", "posts/index"]
const isNotPostsListPage = (page: { fileData: { slug?: string } }) =>
  !postsListTargetSlugs.includes(page.fileData.slug ?? "")

// Helper: Hide title/meta only on posts/index (not home page)
const isNotPostsIndexPage = (page: { fileData: { slug?: string } }) =>
  page.fileData.slug !== "posts/index"

// Helper: Content pages are nested 2+ levels deep (e.g., posts/hfrl/index)
// Section pages are top-level indexes (e.g., index, about/index, posts/index)
const isContentPage = (page: { fileData: { slug?: string } }) => {
  const slug = page.fileData.slug ?? ""
  if (slug === "index") return false
  const parts = slug.split("/")
  return !(parts.length === 2 && parts[1] === "index")
}

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  afterBody: [
    // TagList at bottom of content
    Component.ConditionalRender({
      component: Component.TagList(),
      condition: isNotPostsListPage,
    }),
    // Breadcrumbs at bottom of content
    Component.ConditionalRender({
      component: Component.Breadcrumbs(),
      condition: isNotPostsListPage,
    }),
    // Backlinks moved from right sidebar
    Component.Backlinks(),
    // Graph view at bottom of content
    Component.Graph(),
    // Preview drawer for full-page previews
    Component.PreviewDrawer(),
  ],
  footer: Component.Footer({
    links: {},
  }),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    // Title shows on all pages except posts/index
    Component.ConditionalRender({
      component: Component.ArticleTitle(),
      condition: isNotPostsIndexPage,
    }),
    // ContentMeta hidden on posts list pages (home and posts/index)
    Component.ConditionalRender({
      component: Component.ContentMeta(),
      condition: isNotPostsListPage,
    }),
    // TableOfContents for mobile (below date row), hidden on section pages
    Component.ConditionalRender({
      component: Component.MobileOnly(Component.TableOfContents()),
      condition: isContentPage,
    }),
  ],
  left: [
    // TableOfContents for desktop (in left sidebar), hidden on section pages
    Component.ConditionalRender({
      component: Component.DesktopOnly(Component.TableOfContents()),
      condition: isContentPage,
    }),
  ],
  right: [
    // SidebarNav replaces Explorer
    Component.SidebarNav({
      sections: [
        { title: "Features", slug: "features" },
        { title: "Configs", slug: "configuration" },
        { title: "Docs", slug: "documentation" },
      ],
      postsLink: {
        title: "Posts",
        slug: "posts",
      },
      showHome: true,
      showGithub: true,
      githubUrl: "https://github.com/remyjkim/quartz-remsleep", // Example site: remyjkim.com
      showCopyright: true,
      showDarkmode: true,
      showReaderMode: false,
    }),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [
    Component.ArticleTitle(),
    Component.ContentMeta(),
    // TableOfContents for mobile (below date row)
    Component.MobileOnly(Component.TableOfContents()),
  ],
  left: [
    // TableOfContents for desktop (in left sidebar)
    Component.DesktopOnly(Component.TableOfContents()),
  ],
  right: [
    Component.SidebarNav({
      sections: [
        { title: "Features", slug: "features" },
        { title: "Configuration", slug: "configuration" },
        { title: "Documentation", slug: "documentation" },
      ],
      postsLink: {
        title: "Posts",
        slug: "posts",
      },
      showHome: true,
      showGithub: true,
      githubUrl: "https://github.com/remyjkim/quartz-remsleep", // Example site: remyjkim.com
      showCopyright: true,
      showDarkmode: true,
      showReaderMode: false,
    }),
  ],
}
