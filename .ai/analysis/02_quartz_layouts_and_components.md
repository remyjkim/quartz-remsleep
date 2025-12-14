# Quartz Layouts and Components: Comprehensive Analysis

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Layout System Architecture](#layout-system-architecture)
3. [Component System Architecture](#component-system-architecture)
4. [Layout Customization Guide](#layout-customization-guide)
5. [Creating Custom Components](#creating-custom-components)
6. [Practical Examples](#practical-examples)
7. [Best Practices](#best-practices)
8. [Reference](#reference)

---

## Executive Summary

Quartz uses a flexible, component-based layout system that allows for extensive customization without modifying core code. The system is built on:

- **Layout Configuration**: Defined in `quartz.layout.ts` with separate configurations for shared components and page-specific layouts
- **Component Architecture**: TypeScript/TSX components that follow a React-like pattern but render statically
- **Grid System**: CSS Grid-based responsive layout with breakpoints for mobile, tablet, and desktop
- **Component Composition**: Higher-order components for conditional rendering, responsive display, and layout composition

Key insight: **Components can be placed in any layout section (`left`, `right`, `beforeBody`, `afterBody`, etc.), allowing complete control over page structure.**

---

## Layout System Architecture

### Layout Structure

Quartz pages are composed of multiple sections defined in `quartz/cfg.ts`:

```typescript
export interface FullPageLayout {
  head: QuartzComponent              // Single component for <head>
  header: QuartzComponent[]          // Horizontal bar (rarely used)
  beforeBody: QuartzComponent[]      // Vertical stack before content
  pageBody: QuartzComponent          // Main content (usually Content component)
  afterBody: QuartzComponent[]       // Vertical stack after content
  left: QuartzComponent[]            // Left sidebar (vertical on desktop)
  right: QuartzComponent[]           // Right sidebar (vertical on desktop)
  footer: QuartzComponent            // Single footer component
}
```

### Layout Configuration Files

**`quartz.layout.ts`** contains two main exports:

1. **`sharedPageComponents`** (`SharedLayout`): Components shared across all pages
   - `head`: Page metadata, scripts, styles
   - `header`: Optional header bar
   - `afterBody`: Components after main content (shared)
   - `footer`: Site footer

2. **Page-specific layouts** (`PageLayout`): Different layouts for different page types
   - `defaultContentPageLayout`: For individual note pages
   - `defaultListPageLayout`: For tag/folder listing pages
   - Each contains: `beforeBody`, `left`, `right`

### Grid System

The layout uses CSS Grid defined in `quartz/styles/variables.scss`:

**Desktop Layout** (`width > 1200px`):
```
Grid: 3 columns (320px | auto | 320px)
Areas:
  ┌─────────────┬──────────────┬─────────────┐
  │ left        │ header       │ right       │
  │ left        │ center       │ right       │
  │ left        │ footer       │ right       │
  └─────────────┴──────────────┴─────────────┘
```

**Tablet Layout** (`800px < width < 1200px`):
```
Grid: 2 columns (320px | auto)
Areas:
  ┌─────────────┬──────────────┐
  │ left        │ header       │
  │ left        │ center       │
  │ left        │ right        │
  │ left        │ footer       │
  └─────────────┴──────────────┘
```

**Mobile Layout** (`width < 800px`):
```
Grid: 1 column (auto)
Areas:
  ┌──────────────┐
  │ left         │
  │ header       │
  │ center       │
  │ right        │
  │ footer       │
  └──────────────┘
```

### How Components Are Rendered

The rendering process (`quartz/components/renderPage.tsx`):

1. **Left Sidebar**: All components in `left` array wrapped in `<div class="left sidebar">`
2. **Center Column**: Contains:
   - `page-header`: Components from `header` and `beforeBody`
   - Main `Content` component (`pageBody`)
   - `<hr />` separator
   - `page-footer`: Components from `afterBody`
3. **Right Sidebar**: All components in `right` array wrapped in `<div class="right sidebar">`

**Key Insight**: The `afterBody` section renders **inside the center column**, not in a sidebar. This is perfect for placing the graph view at the end of the content.

---

## Component System Architecture

### Component Type Definition

```typescript
export type QuartzComponent = ComponentType<QuartzComponentProps> & {
  css?: StringResource                    // CSS styles (string or SCSS import)
  beforeDOMLoaded?: StringResource         // Scripts before DOM ready
  afterDOMLoaded?: StringResource          // Scripts after DOM ready
}

export type QuartzComponentProps = {
  ctx: BuildCtx                            // Build context
  externalResources: StaticResources      // Static assets
  fileData: QuartzPluginData              // Current page metadata
  cfg: GlobalConfiguration                 // Site configuration
  children: (QuartzComponent | JSX.Element)[]
  tree: Node                              // HTML AST of page content
  allFiles: QuartzPluginData[]           // All pages metadata
  displayClass?: "mobile-only" | "desktop-only"
}
```

### Component Constructor Pattern

All components follow this pattern:

```typescript
interface Options {
  // Component-specific options
}

const defaultOptions: Options = {
  // Default values
}

export default ((userOpts?: Partial<Options>) => {
  const opts = { ...defaultOptions, ...userOpts }
  
  const Component: QuartzComponent = (props: QuartzComponentProps) => {
    // Component JSX
    return <div>...</div>
  }
  
  // Attach resources
  Component.css = style
  Component.afterDOMLoaded = script
  Component.beforeDOMLoaded = preScript
  
  return Component
}) satisfies QuartzComponentConstructor
```

### Component Resources

Components can attach three types of resources:

1. **CSS** (`Component.css`):
   - Plain CSS string (inline)
   - SCSS import: `import style from "./styles/Component.scss"`
   - **Warning**: Styles are global, use specific class names

2. **Before DOM Loaded** (`Component.beforeDOMLoaded`):
   - Runs before page elements are available
   - Use for prefetching, critical initialization
   - Can be string or `.inline.ts` import

3. **After DOM Loaded** (`Component.afterDOMLoaded`):
   - Runs after page is fully loaded
   - Use for DOM manipulation, event listeners
   - Must handle SPA navigation via `"nav"` event

### SPA Navigation Handling

When `enableSPA: true` in config, components must handle navigation:

```typescript
document.addEventListener("nav", () => {
  // Reinitialize component on page navigation
  const element = document.querySelector("#my-component")
  // Setup event listeners
  
  // Cleanup on next navigation
  window.addCleanup(() => {
    // Remove event listeners
  })
})
```

---

## Layout Customization Guide

### Use Case: Right Sidebar Only + Graph at End of Content

**Goal**: Remove left sidebar, keep only right sidebar, move graph view to end of center content column.

#### Step 1: Modify `quartz.layout.ts`

```typescript
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.Breadcrumbs(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
  ],
  left: [],  // Empty - no left sidebar
  right: [
    // Move components that were in left sidebar here
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
        { Component: Component.ReaderMode() },
      ],
    }),
    Component.Explorer(),  // Moved from left sidebar
    Component.DesktopOnly(Component.TableOfContents()),
    Component.Backlinks(),
    // Graph removed from here
  ],
}

// Add graph to afterBody in sharedPageComponents
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  afterBody: [
    Component.Graph(),  // Graph appears at end of center content
  ],
  footer: Component.Footer({...}),
}
```

**Note**: `afterBody` renders in the center column, after the main content and separator (`<hr />`).

#### Step 2: Adjust Grid Layout (Optional)

If you want to optimize the grid for single sidebar, modify `quartz/styles/variables.scss`:

```scss
$desktopGrid: (
  templateRows: "auto auto auto",
  templateColumns: "auto #{$sidePanelWidth}",  // Center | Right sidebar
  rowGap: "5px",
  columnGap: "5px",
  templateAreas:
    '"grid-header grid-sidebar-right"\
      "grid-center grid-sidebar-right"\
      "grid-footer grid-sidebar-right"',
);
```

**However**, this requires more extensive CSS changes. The simpler approach is to leave the grid as-is and just not populate the `left` array.

#### Step 3: Custom Styling (Optional)

Add to `quartz/styles/custom.scss`:

```scss
// Hide left sidebar completely
.sidebar.left {
  display: none;
}

// Adjust center column to use full width
.page > #quartz-body {
  grid-template-columns: auto #{$sidePanelWidth};
  
  .center {
    max-width: 100%;
  }
}
```

### Other Common Customizations

#### Move Component Between Sections

Simply move the component declaration:

```typescript
// Move TableOfContents from right to beforeBody
beforeBody: [
  Component.TableOfContents(),  // Now appears before content
  Component.ArticleTitle(),
],
right: [
  // TableOfContents removed from here
]
```

#### Conditional Component Placement

```typescript
beforeBody: [
  Component.ConditionalRender({
    component: Component.Graph(),
    condition: (page) => page.fileData.frontmatter?.showGraph === true,
  }),
]
```

#### Responsive Component Placement

```typescript
right: [
  Component.DesktopOnly(Component.Graph()),      // Desktop only
  Component.MobileOnly(Component.RecentNotes()), // Mobile only
]
```

---

## Creating Custom Components

### Basic Component Template

```typescript
// quartz/components/MyComponent.tsx
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/MyComponent.scss"
// @ts-ignore
import script from "./scripts/MyComponent.inline"

interface Options {
  title?: string
  showOnMobile: boolean
}

const defaultOptions: Options = {
  showOnMobile: true,
}

export default ((userOpts?: Partial<Options>) => {
  const opts = { ...defaultOptions, ...userOpts }
  
  const MyComponent: QuartzComponent = ({
    fileData,
    cfg,
    allFiles,
    displayClass,
  }: QuartzComponentProps) => {
    // Early return for conditional rendering
    if (!opts.showOnMobile && displayClass === "mobile-only") {
      return null
    }
    
    return (
      <div class={`my-component ${displayClass ?? ""}`}>
        <h3>{opts.title ?? "Default Title"}</h3>
        {/* Component content */}
      </div>
    )
  }
  
  MyComponent.css = style
  MyComponent.afterDOMLoaded = script
  
  return MyComponent
}) satisfies QuartzComponentConstructor
```

### Component with Interactivity

```typescript
// quartz/components/InteractiveComponent.tsx
// @ts-ignore
import script from "./scripts/InteractiveComponent.inline"

export default (() => {
  const InteractiveComponent: QuartzComponent = () => {
    return (
      <div class="interactive-component">
        <button id="my-button">Click Me</button>
        <div id="result"></div>
      </div>
    )
  }
  
  InteractiveComponent.afterDOMLoaded = script
  return InteractiveComponent
}) satisfies QuartzComponentConstructor
```

```typescript
// quartz/components/scripts/InteractiveComponent.inline.ts
document.addEventListener("nav", () => {
  const button = document.querySelector("#my-button") as HTMLButtonElement
  const result = document.querySelector("#result") as HTMLDivElement
  
  const handleClick = () => {
    result.textContent = "Button clicked!"
  }
  
  button?.addEventListener("click", handleClick)
  
  // Cleanup on navigation
  window.addCleanup(() => {
    button?.removeEventListener("click", handleClick)
  })
})
```

### Component Using Other Components

```typescript
import ComponentConstructor from "./OtherComponent"

export default (() => {
  const OtherComponent = ComponentConstructor()
  
  const WrapperComponent: QuartzComponent = (props) => {
    return (
      <div class="wrapper">
        <h2>Wrapper Title</h2>
        <OtherComponent {...props} />
      </div>
    )
  }
  
  return WrapperComponent
}) satisfies QuartzComponentConstructor
```

### Exporting Custom Components

Add to `quartz/components/index.ts`:

```typescript
import MyComponent from "./MyComponent"
import InteractiveComponent from "./InteractiveComponent"

export {
  // ... existing exports
  MyComponent,
  InteractiveComponent,
}
```

Then use in `quartz.layout.ts`:

```typescript
import * as Component from "./quartz/components"

right: [
  Component.MyComponent({ title: "Custom Title" }),
]
```

---

## Practical Examples

### Example 1: Custom Recent Posts Component

```typescript
// quartz/components/CustomRecentPosts.tsx
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { resolveRelative } from "../util/path"
import { byDateAndAlphabetical } from "./PageList"

export default (() => {
  const CustomRecentPosts: QuartzComponent = ({
    allFiles,
    fileData,
    cfg,
  }: QuartzComponentProps) => {
    const recent = allFiles
      .filter((f) => f.dates)
      .sort(byDateAndAlphabetical(cfg))
      .slice(0, 5)
    
    return (
      <div class="custom-recent-posts">
        <h3>Recent Posts</h3>
        <ul>
          {recent.map((page) => (
            <li>
              <a href={resolveRelative(fileData.slug!, page.slug!)}>
                {page.frontmatter?.title ?? page.slug}
              </a>
            </li>
          ))}
        </ul>
      </div>
    )
  }
  
  CustomRecentPosts.css = `
    .custom-recent-posts ul {
      list-style: none;
      padding: 0;
    }
    .custom-recent-posts li {
      margin: 0.5rem 0;
    }
  `
  
  return CustomRecentPosts
}) satisfies QuartzComponentConstructor
```

### Example 2: Graph Component in Center Column

To place graph at end of content (as requested):

```typescript
// In quartz.layout.ts
export const sharedPageComponents: SharedLayout = {
  // ... other components
  afterBody: [
    Component.Graph({
      localGraph: {
        depth: 2,
        scale: 1.2,
      },
      globalGraph: {
        depth: -1,
      },
    }),
  ],
}

export const defaultContentPageLayout: PageLayout = {
  // ... other components
  right: [
    // Graph removed from here
    Component.TableOfContents(),
    Component.Backlinks(),
  ],
}
```

### Example 3: Conditional Graph Based on Frontmatter

```typescript
// Custom component wrapper
export default (() => {
  const ConditionalGraph: QuartzComponent = (props) => {
    const showGraph = props.fileData.frontmatter?.showGraph !== false
    if (!showGraph) return null
    
    const Graph = Component.Graph()
    return <Graph {...props} />
  }
  
  ConditionalGraph.css = Component.Graph().css
  ConditionalGraph.afterDOMLoaded = Component.Graph().afterDOMLoaded
  
  return ConditionalGraph
}) satisfies QuartzComponentConstructor
```

---

## Best Practices

### 1. Component Organization

- **One component per file**: Keep components in separate `.tsx` files
- **Styles**: Place SCSS files in `quartz/components/styles/`
- **Scripts**: Place `.inline.ts` files in `quartz/components/scripts/`
- **Naming**: Use PascalCase for component files (`MyComponent.tsx`)

### 2. Styling Guidelines

- **Use specific class names**: Prefix with component name to avoid conflicts
  ```scss
  .my-component {  // Good
    // styles
  }
  
  .button {  // Bad - too generic
    // styles
  }
  ```
- **SCSS over inline CSS**: Use SCSS imports for complex styles
- **Responsive design**: Test on mobile, tablet, desktop breakpoints

### 3. Performance Considerations

- **Lazy loading**: Use `ConditionalRender` for heavy components
- **Script optimization**: Minimize `afterDOMLoaded` scripts
- **Resource cleanup**: Always use `window.addCleanup()` for event listeners

### 4. Component Composition

- **Reuse existing components**: Compose rather than duplicate
- **Higher-order components**: Use `Flex`, `ConditionalRender`, `MobileOnly`, `DesktopOnly`
- **Props forwarding**: Pass all props to child components: `{...props}`

### 5. Layout Best Practices

- **Semantic placement**: Put navigation in `left`, metadata in `right`
- **Content flow**: Use `beforeBody` for page-level metadata, `afterBody` for related content
- **Mobile-first**: Consider mobile layout when arranging components
- **Accessibility**: Use semantic HTML, ARIA labels where appropriate

### 6. Testing Components

- **Build locally**: Run `npx quartz build` to test changes
- **Check all page types**: Test on content pages, list pages, index page
- **Responsive testing**: Test at different screen sizes
- **SPA navigation**: Test component behavior during client-side navigation

---

## Reference

### Available Components

**Core Components**:
- `Head`: Page metadata and resources
- `Body`: Page wrapper
- `Content`: Main article content
- `Header`: Header bar wrapper

**Navigation**:
- `Explorer`: File/folder tree navigation
- `Search`: Full-text search
- `Breadcrumbs`: Navigation breadcrumbs
- `PageTitle`: Site title link

**Content Display**:
- `ArticleTitle`: Page title
- `ContentMeta`: Date, tags, etc.
- `TagList`: List of tags
- `TableOfContents`: Page TOC
- `Backlinks`: Pages linking to current page
- `RecentNotes`: Recent posts list

**Interactive**:
- `Graph`: Local/global knowledge graph
- `Darkmode`: Theme toggle
- `ReaderMode`: Reading mode toggle
- `Comments`: Comment system integration

**Layout Helpers**:
- `Flex`: Flexbox layout wrapper
- `Spacer`: Empty space
- `MobileOnly`: Mobile-only wrapper
- `DesktopOnly`: Desktop-only wrapper
- `ConditionalRender`: Conditional rendering

### Layout Sections Reference

| Section | Location | Use Case |
|---------|----------|----------|
| `head` | `<head>` tag | Metadata, scripts, styles |
| `header` | Top bar | Site-wide header (rarely used) |
| `beforeBody` | Before content | Page title, metadata, breadcrumbs |
| `pageBody` | Main content | Article content (usually `Content`) |
| `afterBody` | After content | Related content, graph, footer content |
| `left` | Left sidebar | Navigation, search, explorer |
| `right` | Right sidebar | TOC, backlinks, metadata |
| `footer` | Page footer | Site footer |

### Grid Areas

- `grid-sidebar-left`: Left sidebar
- `grid-header`: Page header
- `grid-center`: Main content column
- `grid-sidebar-right`: Right sidebar
- `grid-footer`: Page footer

### Breakpoints

Defined in `quartz/styles/variables.scss`:
- **Mobile**: `max-width: 800px`
- **Tablet**: `800px - 1200px`
- **Desktop**: `min-width: 1200px`

### Component Props Reference

```typescript
QuartzComponentProps {
  ctx: BuildCtx                    // Build context (internal)
  externalResources: StaticResources
  fileData: QuartzPluginData       // Current page data
    - slug: FullSlug
    - frontmatter: FrontMatter
    - dates: DateDetails
    - links: SimpleSlug[]
    - tags: string[]
    - toc: TableOfContentsEntry[]
  cfg: GlobalConfiguration          // Site config
  children: Component[]
  tree: Node                        // HTML AST
  allFiles: QuartzPluginData[]      // All pages
  displayClass?: "mobile-only" | "desktop-only"
}
```

---

## Conclusion

Quartz's layout and component system provides extensive flexibility for customization:

1. **Layout customization** is straightforward: modify `quartz.layout.ts` to rearrange components
2. **Component creation** follows a clear pattern with TypeScript/TSX
3. **Grid system** handles responsiveness automatically
4. **Component composition** enables complex layouts through simple configuration

For the specific use case (right sidebar only, graph at end of content):
- Empty the `left` array in page layouts
- Move `Graph` component to `afterBody` in `sharedPageComponents`
- Optionally adjust grid CSS if full-width center column is desired

The system is designed to be customizable without touching core Quartz code, making it easy to create unique site layouts while maintaining compatibility with Quartz updates.
