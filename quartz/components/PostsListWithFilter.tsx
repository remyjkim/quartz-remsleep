import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { ComponentChildren } from "preact"
import { htmlToJsx } from "../util/jsx"
import { FullSlug, resolveRelative, getAllSegmentPrefixes } from "../util/path"
import { PageList } from "./PageList"
import { byDateAndAlphabetical } from "./PageList"
import { concatenateResources } from "../util/resources"
import style from "./styles/postsListWithFilter.scss"
// @ts-ignore
import script from "./scripts/tagFilter.inline"

interface PostsListWithFilterOptions {
  postsPerPage?: number // Number of posts per page (default: 10)
  excludeSlugs?: string[] // Slugs to exclude from post list
  showAboutSection?: boolean // Whether to show the "About Blog" content above posts
  targetSlugs?: string[] // Which pages to render on (default: ["index", "posts/index"])
  postsPrefixes?: string[] // Folder prefixes to include as posts (default: ["posts/"])
  showPagination?: boolean // Whether to show pagination controls (default: true)
}

const defaultOptions: PostsListWithFilterOptions = {
  postsPerPage: 10,
  excludeSlugs: ["about_blog", "bookshelf", "questions", "about"],
  showAboutSection: false,
  targetSlugs: ["index", "posts/index"],
  postsPrefixes: ["posts/"],
  showPagination: true,
}

export default ((userOpts?: Partial<PostsListWithFilterOptions>) => {
  const opts = { ...defaultOptions, ...userOpts }

  const PostsListWithFilter: QuartzComponent = (props: QuartzComponentProps) => {
    const { fileData, allFiles, cfg, tree } = props

    // Check if this page should show posts list
    // Priority: frontmatter.showPostsList > targetSlugs fallback
    const showPostsList = fileData.frontmatter?.showPostsList
    const targetSlugs = opts.targetSlugs ?? ["index"]
    const shouldShowPostsList = showPostsList === true ||
      (showPostsList === undefined && targetSlugs.includes(fileData.slug ?? ""))

    if (!shouldShowPostsList) {
      // Fall back to standard content rendering for other pages
      const content = htmlToJsx(fileData.filePath!, tree) as ComponentChildren
      const classes: string[] = fileData.frontmatter?.cssclasses ?? []
      const classString = ["popover-hint", ...classes].join(" ")
      return <article class={classString}>{content}</article>
    }

    // Posts page specific rendering
    const content = htmlToJsx(fileData.filePath!, tree) as ComponentChildren
    const postsPrefixes = opts.postsPrefixes ?? ["posts/"]

    // Helper to check if slug matches any posts prefix (but not the index of that prefix)
    const isPostSlug = (slug: string) => {
      return postsPrefixes.some((prefix) => {
        // Must start with prefix and not be the index page of that prefix
        const prefixWithoutSlash = prefix.replace(/\/$/, "")
        const prefixIndex = prefixWithoutSlash + "/index"
        return slug.startsWith(prefix) && slug !== prefixWithoutSlash && slug !== prefixIndex
      })
    }

    // Use configured filterTags or fall back to auto-generating from posts
    const configuredTags = cfg.filterTags
    const allTags = configuredTags ?? [
      ...new Set(
        allFiles
          .filter((file) => {
            const slug = file.slug ?? ""
            const isTargetPage = targetSlugs.includes(slug)
            return (
              isPostSlug(slug) &&
              !isTargetPage &&
              !(opts.excludeSlugs ?? []).includes(slug)
            )
          })
          .flatMap((data) => data.frontmatter?.tags ?? [])
          .flatMap(getAllSegmentPrefixes),
      ),
    ].sort((a, b) => a.localeCompare(b))

    // Use configured filterCategories or fall back to auto-generating from posts
    const configuredCategories = cfg.filterCategories
    const allCategories = configuredCategories ?? [
      ...new Set(
        allFiles
          .filter((file) => {
            const slug = file.slug ?? ""
            const isTargetPage = targetSlugs.includes(slug)
            return (
              isPostSlug(slug) &&
              !isTargetPage &&
              !(opts.excludeSlugs ?? []).includes(slug)
            )
          })
          .flatMap((data) => data.frontmatter?.categories ?? []),
      ),
    ].sort((a, b) => a.localeCompare(b))

    // Get frontmatter-based filters (for page-specific filtering)
    const postsFilterTags = fileData.frontmatter?.postsFilterTags as string[] | undefined
    const postsFilterCategories = fileData.frontmatter?.postsFilterCategories as string[] | undefined

    // Filter posts (from configured prefixes, exclude target pages and certain slugs, require a date)
    const blogPosts = allFiles
      .filter((file) => {
        const slug = file.slug ?? ""
        const isTargetPage = targetSlugs.includes(slug)
        const hasRequiredTag = !postsFilterTags ||
          postsFilterTags.some(tag => (file.frontmatter?.tags ?? []).includes(tag))
        const hasRequiredCategory = !postsFilterCategories ||
          postsFilterCategories.some(cat => (file.frontmatter?.categories ?? []).includes(cat))
        return (
          isPostSlug(slug) &&
          !isTargetPage &&
          !(opts.excludeSlugs ?? []).includes(slug) &&
          file.dates?.created !== undefined && // Has a date
          hasRequiredTag &&
          hasRequiredCategory
        )
      })
      .sort(byDateAndAlphabetical(cfg))

    const postsPerPage = opts.postsPerPage ?? 10
    const totalPosts = blogPosts.length
    const totalPages = Math.ceil(totalPosts / postsPerPage)

    return (
      <div
        class="posts-list-with-filter"
        data-posts-per-page={postsPerPage}
        data-total-posts={totalPosts}
      >
        {/* Optional about section from posts/index.md content */}
        {opts.showAboutSection && content && (
          <>
            <article class="popover-hint about-section">{content}</article>
            <hr />
          </>
        )}

        {/* Posts section */}
        <div class="posts-section">
          <h2 class="posts-heading">Posts</h2>

          {/* Filter bar (tags + categories) */}
          <div class="filter-bar" data-filter-bar>
            <a
              href="#"
              class="filter-link active"
              data-filter="all"
              data-filter-type="all"
              data-router-ignore
            >
              All
            </a>
            {allTags.map((tag) => {
              const tagHref = resolveRelative(fileData.slug!, `tags/${tag}` as FullSlug)
              return (
                <a
                  href={tagHref}
                  class="filter-link filter-tag"
                  data-filter={tag}
                  data-filter-type="tag"
                  data-router-ignore
                >
                  {tag}
                </a>
              )
            })}
            {allCategories.map((category) => (
              <a
                href="#"
                class="filter-link filter-category"
                data-filter={category}
                data-filter-type="category"
                data-router-ignore
              >
                {category}
              </a>
            ))}
          </div>

          {/* Post list */}
          <div class="post-list-container" data-post-list>
            <PageList {...props} allFiles={blogPosts} showTags={cfg.showPostTags ?? true} showCategories={cfg.showPostCategories ?? true} />
          </div>

          {/* Pagination controls */}
          {opts.showPagination && totalPages > 1 && (
            <div class="pagination" data-pagination>
              <button
                class="pagination-btn pagination-prev"
                data-pagination-prev
                disabled
                aria-label="Previous page"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                Prev
              </button>
              <span class="pagination-info" data-pagination-info>
                Page <span data-current-page>1</span> of <span data-total-pages>{totalPages}</span>
              </span>
              <button
                class="pagination-btn pagination-next"
                data-pagination-next
                aria-label="Next page"
              >
                Next
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  PostsListWithFilter.css = concatenateResources(style, PageList.css)
  PostsListWithFilter.afterDOMLoaded = script

  return PostsListWithFilter
}) satisfies QuartzComponentConstructor
