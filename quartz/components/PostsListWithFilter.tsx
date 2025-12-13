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
  postsPerPage?: number
  excludeSlugs?: string[] // Slugs to exclude from post list
  showAboutSection?: boolean // Whether to show the "About Blog" content above posts
  targetSlugs?: string[] // Which pages to render on (default: ["index", "posts/index"])
}

const defaultOptions: PostsListWithFilterOptions = {
  postsPerPage: 30,
  excludeSlugs: ["about_blog", "bookshelf", "questions", "about"],
  showAboutSection: false,
  targetSlugs: ["index", "posts/index"],
}

export default ((userOpts?: Partial<PostsListWithFilterOptions>) => {
  const opts = { ...defaultOptions, ...userOpts }

  const PostsListWithFilter: QuartzComponent = (props: QuartzComponentProps) => {
    const { fileData, allFiles, cfg, tree } = props

    // Only render on target pages (default: home and /posts)
    const targetSlugs = opts.targetSlugs ?? ["index"]
    if (!targetSlugs.includes(fileData.slug ?? "")) {
      // Fall back to standard content rendering for other pages
      const content = htmlToJsx(fileData.filePath!, tree) as ComponentChildren
      const classes: string[] = fileData.frontmatter?.cssclasses ?? []
      const classString = ["popover-hint", ...classes].join(" ")
      return <article class={classString}>{content}</article>
    }

    // Posts page specific rendering
    const content = htmlToJsx(fileData.filePath!, tree) as ComponentChildren
    const postsPrefix = "posts/"

    // Use configured filterTags or fall back to auto-generating from posts
    const configuredTags = cfg.filterTags
    const allTags = configuredTags ?? [
      ...new Set(
        allFiles
          .filter((file) => {
            const slug = file.slug ?? ""
            const isTargetPage = targetSlugs.includes(slug)
            return (
              slug.startsWith(postsPrefix) &&
              !isTargetPage &&
              !(opts.excludeSlugs ?? []).includes(slug)
            )
          })
          .flatMap((data) => data.frontmatter?.tags ?? [])
          .flatMap(getAllSegmentPrefixes),
      ),
    ].sort((a, b) => a.localeCompare(b))

    // Filter posts (only posts/ folder, exclude target pages and certain slugs, require a date)
    const blogPosts = allFiles
      .filter((file) => {
        const slug = file.slug ?? ""
        const isTargetPage = targetSlugs.includes(slug)
        return (
          slug.startsWith(postsPrefix) &&
          !isTargetPage &&
          !(opts.excludeSlugs ?? []).includes(slug) &&
          file.dates?.created !== undefined // Has a date
        )
      })
      .sort(byDateAndAlphabetical(cfg))

    return (
      <div class="posts-list-with-filter">
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

          {/* Tag filter bar */}
          <div class="tag-filter-bar" data-tag-filter>
            <a
              href="#"
              class="tag-filter-link active"
              data-tag="all"
              data-router-ignore
            >
              All
            </a>
            {allTags.map((tag) => {
              const tagHref = resolveRelative(fileData.slug!, `tags/${tag}` as FullSlug)
              return (
                <a
                  href={tagHref}
                  class="tag-filter-link"
                  data-tag={tag}
                  data-router-ignore
                >
                  {tag}
                </a>
              )
            })}
          </div>

          {/* Post list */}
          <div class="post-list-container" data-post-list>
            <PageList {...props} allFiles={blogPosts} />
          </div>
        </div>
      </div>
    )
  }

  PostsListWithFilter.css = concatenateResources(style, PageList.css)
  PostsListWithFilter.afterDOMLoaded = script

  return PostsListWithFilter
}) satisfies QuartzComponentConstructor
