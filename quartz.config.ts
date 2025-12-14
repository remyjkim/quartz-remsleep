import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "Remy Kim",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    analytics: {
      provider: "plausible",
    },
    locale: "en-US",
    baseUrl: "remyjkim.com",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "modified",
    filterTags: ["ai", "crypto", "finance", "markets", "epistemology"],
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: "PT Sans",
        body: "PT Sans",
        code: "IBM Plex Mono",
      },
      colors: {
        lightMode: {
          light: "#ffffff",           // White background (Hugo default)
          lightgray: "#e5e5e5",       // Light gray for borders
          gray: "#9a9a9a",            // Gray for metadata/dates
          darkgray: "#515151",        // Main text color (from Hugo)
          dark: "#313131",            // Headings color (from Hugo)
          secondary: "#268bd2",       // Primary blue (Hugo link color)
          tertiary: "#6a7fb5",        // Lighter blue for hover states
          highlight: "rgba(38, 139, 210, 0.1)",  // Light blue highlight
          textHighlight: "#fff23688", // Keep yellow text highlight
        },
        darkMode: {
          light: "#1a1a1a",           // Dark background
          lightgray: "#393639",       // Dark gray for borders
          gray: "#646464",            // Medium gray
          darkgray: "#d4d4d4",        // Light text
          dark: "#ebebec",            // Headings in dark mode
          secondary: "#6a9fb5",       // Softer blue for dark mode
          tertiary: "#84a59d",        // Tertiary accent
          highlight: "rgba(106, 159, 181, 0.15)",  // Dark mode highlight
          textHighlight: "#b3aa0288", // Dark mode text highlight
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      // Comment out CustomOgImages to speed up build time
      Plugin.CustomOgImages(),
    ],
  },
}

export default config
