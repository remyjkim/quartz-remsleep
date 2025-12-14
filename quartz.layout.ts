import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// Helper: Pages where PostsListWithFilter shows posts list instead of regular content
const postsListTargetSlugs = ["index", "posts/index"]
const isNotPostsListPage = (page: { fileData: { slug?: string } }) =>
  !postsListTargetSlugs.includes(page.fileData.slug ?? "")

// Helper: Hide title/meta only on posts/index (not home page)
const isNotPostsIndexPage = (page: { fileData: { slug?: string } }) =>
  page.fileData.slug !== "posts/index"

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
    // TableOfContents for mobile (below date row)
    Component.ConditionalRender({
      component: Component.MobileOnly(Component.TableOfContents()),
      condition: isNotPostsListPage,
    }),
  ],
  left: [
    // TableOfContents for desktop (in left sidebar)
    Component.DesktopOnly(Component.TableOfContents()),
  ],
  right: [
    // SidebarNav replaces Explorer
    Component.SidebarNav({
      sections: [
        { title: "About", slug: "about" },
        { title: "World Models", slug: "frameworks-models" },
        { title: "Questions", slug: "questions-validations" },
        { title: "World Data", slug: "learnings-observations" },
        { title: "Creations", slug: "tools-creations" },
      ],
      postsLink: {
        title: "Posts",
        slug: "posts",
      },
      showHome: true,
      showGithub: true,
      githubUrl: "https://github.com/remyjkim",
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
        { title: "About", slug: "about" },
        { title: "Frameworks", slug: "frameworks-models" },
        { title: "Questions", slug: "questions-validations" },
        { title: "Learnings", slug: "learnings-observations" },
        { title: "Creations", slug: "tools-creations" },
      ],
      postsLink: {
        title: "Posts",
        slug: "posts",
      },
      showHome: true,
      showGithub: true,
      githubUrl: "https://github.com/remyjkim",
      showCopyright: true,
      showDarkmode: true,
      showReaderMode: false,
    }),
  ],
}
