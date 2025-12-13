import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { resolveRelative, FullSlug, pathToRoot } from "../util/path"
import { classNames } from "../util/lang"
import { i18n } from "../i18n"
import { concatenateResources } from "../util/resources"
import style from "./styles/sidebarNav.scss"
import Darkmode from "./Darkmode"
import ReaderMode from "./ReaderMode"
import Search from "./Search"

// @ts-ignore
import script from "./scripts/sidebarNav.inline"

interface NavItem {
  title: string
  slug: string
  icon?: string
  isButton?: boolean
}

export interface SidebarNavOptions {
  sections: NavItem[]
  postsLink: NavItem
  showHome?: boolean
  showGithub?: boolean
  githubUrl?: string
  showCopyright?: boolean
  showDarkmode?: boolean
  showReaderMode?: boolean
  homeTitle?: string // Custom home title (defaults to pageTitle from config)
}

const defaultOptions: SidebarNavOptions = {
  sections: [
    { title: "About Me", slug: "01-about-me" },
    { title: "About Blog", slug: "02-about-blog" },
    { title: "Questions", slug: "03-questions" },
    { title: "Bookshelf", slug: "04-bookshelf" },
  ],
  postsLink: {
    title: "Posts",
    slug: "posts",
    isButton: false, // Styled as nav item, not button
  },
  showHome: true,
  showGithub: true,
  githubUrl: "https://github.com/remyjkim",
  showCopyright: true,
  showDarkmode: true,
  showReaderMode: true,
}

export default ((userOpts?: Partial<SidebarNavOptions>) => {
  const opts: SidebarNavOptions = { ...defaultOptions, ...userOpts }

  // Instantiate sub-components
  const DarkmodeComponent = Darkmode()
  const ReaderModeComponent = ReaderMode()
  const SearchComponent = Search()

  const SidebarNav: QuartzComponent = (props: QuartzComponentProps) => {
    const { fileData, cfg, displayClass } = props
    const currentSlug = (fileData.slug ?? "") as string
    const homeTitle = opts.homeTitle ?? cfg?.pageTitle ?? i18n(cfg?.locale).propertyDefaults.title ?? "Home"
    const baseDir = pathToRoot(fileData.slug!)
    
    // Helper to check if link is active
    const isActive = (slug: string) => {
      const simpleCurrent = currentSlug.split("/")[0]
      return simpleCurrent === slug || currentSlug.startsWith(slug + "/")
    }

    return (
      <nav class={classNames(displayClass, "sidebar-nav")}>
        {/* Mobile header bar - fixed at top on mobile */}
        <div class="mobile-header mobile-only">
          <a href={baseDir} class="mobile-header-title">
            {homeTitle}
          </a>
          <div class="mobile-header-controls">
            {/* Darkmode toggle */}
            {opts.showDarkmode && (
              <div class="mobile-header-darkmode">
                <DarkmodeComponent {...props} />
              </div>
            )}
            {/* Search button */}
            <div class="mobile-header-search">
              <SearchComponent {...props} />
            </div>
            {/* Hamburger menu */}
            <button
              type="button"
              class="sidebar-nav-toggle"
              aria-label="Toggle navigation menu"
              aria-expanded="false"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="menu-icon"
              >
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation content */}
        <div class="sidebar-nav-content">
          {/* Home logo/button - white button with blue text */}
          <a href={baseDir} class="home-button" data-for="index">
            {homeTitle}
          </a>
          
          {/* Separator after home button */}
          <hr class="nav-separator" />
          {/* Section links */}
          <ul class="nav-sections">
            {/* Section links */}
            {opts.sections.map((section) => {
              const href = resolveRelative(
                currentSlug as FullSlug,
                (section.slug + "/index") as FullSlug
              )
              return (
                <li class={isActive(section.slug) ? "active" : ""}>
                  <a href={href} data-for={section.slug}>
                    {section.title}
                  </a>
                </li>
              )
            })}
            
            {/* Github link */}
            {opts.showGithub && opts.githubUrl && (
              <li>
                <a href={opts.githubUrl} target="_blank" rel="noopener noreferrer">
                  Github
                </a>
              </li>
            )}
          </ul>

          {/* Separator */}
          <hr class="nav-separator" />

          {/* Search */}
          <div class="nav-search">
            <SearchComponent {...props} />
          </div>

          {/* Posts link */}
          <div class="nav-posts">
            <a
              href={resolveRelative(
                currentSlug as FullSlug,
                (opts.postsLink.slug + "/index") as FullSlug
              )}
              class={`posts-button${isActive(opts.postsLink.slug) ? " active" : ""}`}
              data-for={opts.postsLink.slug}
            >
              {opts.postsLink.title}
            </a>
          </div>
          
          {/* Theme controls - positioned right after Posts */}
          {(opts.showDarkmode || opts.showReaderMode) && (
            <div class="sidebar-nav-controls">
              {opts.showDarkmode && <DarkmodeComponent {...props} />}
              {opts.showReaderMode && <ReaderModeComponent {...props} />}
            </div>
          )}
          
          {/* Copyright footer */}
          {opts.showCopyright && (
            <div class="sidebar-nav-footer">
              <p>&copy; {new Date().getFullYear()}. All rights reserved.</p>
            </div>
          )}
        </div>
      </nav>
    )
  }

  SidebarNav.css = concatenateResources(
    style,
    DarkmodeComponent.css,
    ReaderModeComponent.css,
    SearchComponent.css,
  )
  SidebarNav.afterDOMLoaded = concatenateResources(
    script,
    DarkmodeComponent.afterDOMLoaded,
    ReaderModeComponent.afterDOMLoaded,
    SearchComponent.afterDOMLoaded,
  )
  SidebarNav.beforeDOMLoaded = concatenateResources(
    DarkmodeComponent.beforeDOMLoaded,
    ReaderModeComponent.beforeDOMLoaded,
  )

  return SidebarNav
}) satisfies QuartzComponentConstructor

