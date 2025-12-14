# Quartz v4 CSS and Styling System Analysis

## Executive Summary

This document provides a comprehensive analysis of Quartz v4's CSS and styling architecture. Quartz uses **Sass (SCSS)** for styling with a component-based approach, CSS custom properties (variables) for theming, and a sophisticated build process that compiles and optimizes styles. The system is designed for maximum customization while maintaining a clean separation between base styles, component styles, and user customizations.

---

## 1. Styling Architecture Overview

### 1.1 Technology Stack

**Primary Technologies:**
- **Sass (SCSS)**: Preprocessor for CSS with variables, nesting, mixins, and imports
- **CSS Custom Properties**: CSS variables for theme configuration
- **LightningCSS**: Modern CSS transformer for minification and browser compatibility
- **esbuild-sass-plugin**: Processes SCSS imports during build

**Key Characteristics:**
- Component-scoped styles (via component `.css` property)
- Global style system (via `quartz/styles/`)
- Theme-driven color and typography system
- Responsive design with breakpoint variables
- CSS-in-JS pattern (styles attached to components)

### 1.2 File Structure

```
quartz/
├── styles/                    # Global styles
│   ├── variables.scss         # Breakpoints, spacing, grid config
│   ├── base.scss             # Base styles (imports variables, syntax, callouts)
│   ├── syntax.scss           # Code syntax highlighting styles
│   ├── callouts.scss         # Callout/admonition styles
│   └── custom.scss           # User customization file (initially empty)
│
└── components/
    ├── styles/               # Component-specific styles
    │   ├── darkmode.scss
    │   ├── explorer.scss
    │   ├── search.scss
    │   ├── toc.scss
    │   ├── graph.scss
    │   └── ... (16 component style files)
    │
    └── [Component].tsx       # Components with .css property
```

---

## 2. Style File Organization

### 2.1 Global Styles (`quartz/styles/`)

#### 2.1.1 `variables.scss` - Layout Configuration

**Purpose**: Defines breakpoints, spacing, grid layouts, and typography weights.

**Key Variables:**

```scss
// Breakpoints
$breakpoints: (
  mobile: 800px,
  desktop: 1200px,
);

// Media query helpers
$mobile: "(max-width: #{map.get($breakpoints, mobile)})";
$tablet: "(min-width: #{map.get($breakpoints, mobile)}) and (max-width: #{map.get($breakpoints, desktop)})";
$desktop: "(min-width: #{map.get($breakpoints, desktop)})";

// Layout dimensions
$pageWidth: #{map.get($breakpoints, mobile)};
$sidePanelWidth: 320px;
$topSpacing: 6rem;

// Typography weights
$boldWeight: 700;
$semiBoldWeight: 600;
$normalWeight: 400;

// Grid templates for responsive layouts
$mobileGrid: (
  templateRows: "auto auto auto auto auto",
  templateColumns: "auto",
  templateAreas: '"grid-sidebar-left" "grid-header" "grid-center" "grid-sidebar-right" "grid-footer"',
);

$tabletGrid: (
  templateColumns: "#{$sidePanelWidth} auto",
  templateAreas: '"grid-sidebar-left grid-header" "grid-sidebar-left grid-center" ...',
);

$desktopGrid: (
  templateColumns: "#{$sidePanelWidth} auto #{$sidePanelWidth}",
  templateAreas: '"grid-sidebar-left grid-header grid-sidebar-right" ...',
);
```

**Usage Pattern:**
- Imported with `@use "./variables.scss" as *;` to access variables
- Used throughout base styles and component styles
- Enables consistent responsive breakpoints

#### 2.1.2 `base.scss` - Foundation Styles

**Purpose**: Core styles for HTML elements, layout grid, typography, and common patterns.

**Structure:**
```scss
@use "sass:map";
@use "./variables.scss" as *;
@use "./syntax.scss";
@use "./callouts.scss";

// HTML/body setup
html { ... }
body { ... }

// Typography
h1, h2, h3, h4, h5, h6 { ... }
p, ul, text, a { ... }

// Layout grid system
.page > #quartz-body {
  display: grid;
  grid-template-columns: #{map.get($desktopGrid, templateColumns)};
  // Responsive breakpoints...
}

// Links, code, tables, images, etc.
```

**Key Features:**
- Uses CSS custom properties (`var(--light)`, `var(--darkgray)`, etc.)
- Responsive grid layout system
- Typography hierarchy
- Link styles (internal vs external)
- Code block styling
- Table styling
- Image handling

**CSS Custom Properties Used:**
- `--light`, `--lightgray`, `--gray`, `--darkgray`, `--dark`
- `--secondary`, `--tertiary`
- `--highlight`, `--textHighlight`
- `--headerFont`, `--bodyFont`, `--codeFont`

#### 2.1.3 `syntax.scss` - Code Highlighting

**Purpose**: Styles for syntax-highlighted code blocks using Shiki.

**Structure:**
```scss
code[data-theme*=" "] {
  color: var(--shiki-light);
  background-color: var(--shiki-light-bg);
}

[saved-theme="dark"] code[data-theme*=" "] {
  color: var(--shiki-dark);
  background-color: var(--shiki-dark-bg);
}
```

**Features:**
- Theme-aware (light/dark mode)
- Uses Shiki CSS variables
- Separate styles for light and dark themes

#### 2.1.4 `callouts.scss` - Admonition Styles

**Purpose**: Styles for callout/admonition blocks (note, warning, tip, etc.).

**Structure:**
```scss
@use "./variables.scss" as *;
@use "sass:color";

.callout {
  border: 1px solid var(--border);
  background-color: var(--bg);
  border-radius: 5px;
  padding: 0 1rem;
  
  &[data-callout="note"] {
    --color: #448aff;
    --border: #448aff44;
    --bg: #448aff10;
    --callout-icon: var(--callout-icon-note);
  }
  // ... other callout types
}
```

**Features:**
- SVG icons embedded as CSS variables
- Color-coded by callout type
- Collapsible support
- Theme-aware colors

#### 2.1.5 `custom.scss` - User Customization

**Purpose**: User-defined custom styles that override or extend base styles.

**Default Content:**
```scss
@use "./base.scss";

// put your custom CSS here!
```

**Customization Strategy:**
- Imports base styles first (`@use "./base.scss"`)
- User adds custom styles after import
- Styles cascade naturally (later rules override earlier)
- Can override CSS variables, component styles, or add new styles

---

## 3. Component-Based Styling

### 3.1 Component Style Pattern

**How Components Define Styles:**

Components can attach styles in two ways:

1. **Inline CSS String** (plain CSS only):
```tsx
export default (() => {
  function YourComponent() {
    return <p class="red-text">Example</p>
  }

  YourComponent.css = `
    p.red-text {
      color: red;
    }
  `

  return YourComponent
}) satisfies QuartzComponentConstructor
```

2. **Imported SCSS File** (recommended):
```tsx
import styles from "./styles/YourComponent.scss"

export default (() => {
  function YourComponent() {
    return <p>Example</p>
  }

  YourComponent.css = styles
  return YourComponent
}) satisfies QuartzComponentConstructor
```

### 3.2 Component Style Files

**Location**: `quartz/components/styles/`

**Component Style Files:**
- `darkmode.scss` - Dark mode toggle button
- `explorer.scss` - File explorer navigation
- `search.scss` - Search component
- `toc.scss` - Table of contents
- `graph.scss` - Graph view visualization
- `breadcrumbs.scss` - Breadcrumb navigation
- `backlinks.scss` - Backlinks section
- `contentMeta.scss` - Content metadata (dates, tags)
- `footer.scss` - Footer component
- `popover.scss` - Popover previews
- `recentNotes.scss` - Recent notes list
- `readermode.scss` - Reader mode toggle
- `listPage.scss` - List page layouts
- `legacyToc.scss` - Legacy TOC styles
- `mermaid.inline.scss` - Mermaid diagram styles
- `clipboard.scss` - Copy-to-clipboard button

**Pattern**: Each component can have its own SCSS file that:
- Uses `@use "../../styles/variables.scss" as *;` for breakpoints
- Defines component-specific classes
- Uses CSS custom properties for theming
- Includes responsive styles

### 3.3 Example: Darkmode Component

**Component File**: `quartz/components/Darkmode.tsx`
```tsx
import styles from "./styles/darkmode.scss"

const Darkmode: QuartzComponent = ({ displayClass, cfg }) => {
  return (
    <button class={classNames(displayClass, "darkmode")}>
      {/* SVG icons */}
    </button>
  )
}

Darkmode.beforeDOMLoaded = darkmodeScript
Darkmode.css = styles

export default (() => Darkmode) satisfies QuartzComponentConstructor
```

**Style File**: `quartz/components/styles/darkmode.scss`
```scss
.darkmode {
  cursor: pointer;
  padding: 0;
  position: relative;
  background: none;
  border: none;
  width: 20px;
  height: 20px;
  
  & svg {
    fill: var(--darkgray);
    transition: opacity 0.1s ease;
  }
}

:root[saved-theme="dark"] .darkmode {
  & > .dayIcon { display: none; }
  & > .nightIcon { display: inline; }
}
```

**Key Observations:**
- Component styles are **global** (not scoped)
- Uses CSS custom properties for theming
- Can target `:root[saved-theme="dark"]` for dark mode
- Styles are attached to component function

---

## 4. CSS Custom Properties (Theme System)

### 4.1 Theme Configuration

**Location**: `quartz.config.ts` → `configuration.theme`

**Structure:**
```typescript
theme: {
  fontOrigin: "googleFonts" | "local",
  cdnCaching: boolean,
  typography: {
    title?: FontSpecification,
    header: FontSpecification,
    body: FontSpecification,
    code: FontSpecification,
  },
  colors: {
    lightMode: ColorScheme,
    darkMode: ColorScheme,
  },
}
```

**Color Scheme:**
```typescript
interface ColorScheme {
  light: string          // Page background
  lightgray: string      // Borders
  gray: string          // Graph links, heavier borders
  darkgray: string      // Body text
  dark: string          // Header text and icons
  secondary: string     // Link color, current graph node
  tertiary: string      // Hover states, visited graph nodes
  highlight: string     // Internal link background, highlighted code
  textHighlight: string // Markdown highlighted text background
}
```

### 4.2 CSS Variable Generation

**Location**: `quartz/util/theme.ts` → `joinStyles()`

**Process:**
1. Theme colors are converted to CSS custom properties
2. Font specifications are converted to CSS font-family variables
3. Variables are injected into `:root` for light mode
4. Variables are injected into `:root[saved-theme="dark"]` for dark mode

**Generated CSS:**
```css
:root {
  --light: #faf8f8;
  --lightgray: #e5e5e5;
  --gray: #b8b8b8;
  --darkgray: #4e4e4e;
  --dark: #2b2b2b;
  --secondary: #284b63;
  --tertiary: #84a59d;
  --highlight: rgba(143, 159, 169, 0.15);
  --textHighlight: #fff23688;

  --titleFont: "Schibsted Grotesk", system-ui, ...;
  --headerFont: "Schibsted Grotesk", system-ui, ...;
  --bodyFont: "Source Sans Pro", system-ui, ...;
  --codeFont: "IBM Plex Mono", ui-monospace, ...;
}

:root[saved-theme="dark"] {
  --light: #161618;
  --lightgray: #393639;
  --gray: #646464;
  --darkgray: #d4d4d4;
  --dark: #ebebec;
  --secondary: #7b97aa;
  --tertiary: #84a59d;
  --highlight: rgba(143, 159, 169, 0.15);
  --textHighlight: #b3aa0288;
}
```

**Usage in Styles:**
```scss
body {
  background-color: var(--light);
  color: var(--darkgray);
  font-family: var(--bodyFont);
}

a {
  color: var(--secondary);
  &:hover {
    color: var(--tertiary);
  }
}
```

### 4.3 Font System

**Font Specification Types:**

1. **String** (simple):
```typescript
typography: {
  header: "Schibsted Grotesk",
  body: "Source Sans Pro",
  code: "IBM Plex Mono",
}
```

2. **FontSpecification Object** (advanced):
```typescript
typography: {
  header: {
    name: "Schibsted Grotesk",
    weights: [400, 700],
    includeItalic: true,
  },
  body: {
    name: "Source Sans Pro",
    weights: [400, 600],
    includeItalic: true,
  },
}
```

**Font Loading:**

- **Google Fonts** (`fontOrigin: "googleFonts"`):
  - If `cdnCaching: true`: Links to Google Fonts CDN in `<head>`
  - If `cdnCaching: false`: Downloads fonts and hosts locally
  
- **Local Fonts** (`fontOrigin: "local"`):
  - User provides fonts in `static/fonts/`
  - User defines `@font-face` in `custom.scss`

**Font Processing:**
- `googleFontHref()` generates Google Fonts URL
- `processGoogleFonts()` downloads and processes font files
- Font files saved to `static/fonts/` directory
- CSS variables reference font names

---

## 5. Build Process and Style Compilation

### 5.1 Build Pipeline

**Location**: `quartz/cli/handlers.js` → `handleBuild()`

**Process Flow:**

1. **SCSS Processing** (via esbuild-sass-plugin):
   ```javascript
   sassPlugin({
     type: "css-text",  // Import SCSS as text string
     cssImports: true,
   })
   ```

2. **Component Resource Collection** (`componentResources.ts`):
   - Scans all components used in layout
   - Collects `.css` properties from components
   - Collects `.beforeDOMLoaded` and `.afterDOMLoaded` scripts

3. **Style Aggregation**:
   ```typescript
   const stylesheet = joinStyles(
     ctx.cfg.configuration.theme,
     googleFontsStyleSheet,      // Google Fonts CSS (if applicable)
     ...componentResources.css, // All component styles
     styles,                     // custom.scss
   )
   ```

4. **CSS Processing** (LightningCSS):
   ```typescript
   transform({
     filename: "index.css",
     code: Buffer.from(stylesheet),
     minify: true,
     targets: {
       safari: (15 << 16) | (6 << 8),
       ios_saf: (15 << 16) | (6 << 8),
       edge: 115 << 16,
       firefox: 102 << 16,
       chrome: 109 << 16,
     },
     include: Features.MediaQueries,
   })
   ```

5. **Output**:
   - Single minified CSS file: `index.css`
   - Injected into `<head>` via `Head.tsx` component

### 5.2 Style Loading Order

**Final CSS Order:**
1. Google Fonts stylesheet (if `cdnCaching: false`)
2. Component styles (in component registration order)
3. `custom.scss` (user customizations)

**Why Order Matters:**
- Later styles override earlier styles
- `custom.scss` loads last, allowing overrides
- Component styles can override base styles
- CSS specificity rules apply

### 5.3 Hot Reloading

**Development Mode** (`--serve`):
- File watcher monitors `.scss` files
- On change, rebuilds styles using esbuild
- WebSocket signals browser to reload
- Fast iteration cycle

**Build Cache:**
- Transpiled styles cached in `.quartz-cache/`
- Only rebuilds on file changes
- Significantly faster rebuilds

---

## 6. Responsive Design System

### 6.1 Breakpoint System

**Breakpoints** (`variables.scss`):
```scss
$breakpoints: (
  mobile: 800px,
  desktop: 1200px,
);

$mobile: "(max-width: 800px)";
$tablet: "(min-width: 800px) and (max-width: 1200px)";
$desktop: "(min-width: 1200px)";
```

**Usage:**
```scss
@media all and ($mobile) {
  // Mobile styles
}

@media all and ($tablet) {
  // Tablet styles
}

@media all and ($desktop) {
  // Desktop styles
}
```

### 6.2 Grid Layout System

**Three Grid Configurations:**

1. **Mobile Grid** (`$mobileGrid`):
   - Single column
   - Vertical stacking
   - All sections stacked

2. **Tablet Grid** (`$tabletGrid`):
   - Two columns: sidebar-left + content
   - Sidebar-left spans all rows
   - Right sidebar becomes horizontal row

3. **Desktop Grid** (`$desktopGrid`):
   - Three columns: sidebar-left + content + sidebar-right
   - Sidebars fixed width (`$sidePanelWidth: 320px`)
   - Content area flexible

**Implementation** (`base.scss`):
```scss
.page > #quartz-body {
  display: grid;
  grid-template-columns: #{map.get($desktopGrid, templateColumns)};
  grid-template-rows: #{map.get($desktopGrid, templateRows)};
  grid-template-areas: #{map.get($desktopGrid, templateAreas)};

  @media all and ($tablet) {
    grid-template-columns: #{map.get($tabletGrid, templateColumns)};
    // ...
  }
  
  @media all and ($mobile) {
    grid-template-columns: #{map.get($mobileGrid, templateColumns)};
    // ...
  }
}
```

### 6.3 Utility Classes

**Display Classes:**

```scss
.desktop-only {
  display: initial;
  @media all and ($mobile) {
    display: none;
  }
}

.mobile-only {
  display: none;
  @media all and ($mobile) {
    display: initial;
  }
}
```

**Usage in Components:**
- Components receive `displayClass` prop
- Can be `"mobile-only"` or `"desktop-only"`
- Applied to component root element

---

## 7. Customization Strategies

### 7.1 Level 1: Theme Configuration (Easiest)

**What**: Change colors and fonts via `quartz.config.ts`

**How**:
```typescript
theme: {
  typography: {
    header: "Your Font",
    body: "Your Font",
    code: "Your Font",
  },
  colors: {
    lightMode: {
      light: "#ffffff",
      secondary: "#your-color",
      // ... other colors
    },
    darkMode: {
      // ... dark mode colors
    },
  },
}
```

**Best For:**
- Color scheme changes
- Font changes
- Quick theme adjustments

**Limitations:**
- Only affects CSS variables
- Cannot change layout structure
- Cannot add new styles

### 7.2 Level 2: Custom SCSS (Recommended)

**What**: Add custom styles in `quartz/styles/custom.scss`

**How**:
```scss
@use "./base.scss";

// Override CSS variables
:root {
  --secondary: #your-color;
}

// Override component styles
.sidebar {
  width: 14rem !important;
}

// Add new styles
.my-custom-class {
  // styles
}
```

**Best For:**
- Overriding base styles
- Adding custom components
- Layout adjustments
- Component style overrides

**Advantages:**
- Full SCSS features (variables, nesting, mixins)
- Access to all base variables
- Can override any style
- Loads last (highest priority)

### 7.3 Level 3: Component Style Overrides

**What**: Override component-specific styles

**How**:
```scss
// In custom.scss
.explorer {
  // Override explorer styles
  background-color: var(--light);
  border: 1px solid var(--lightgray);
}

.search {
  // Override search styles
  input {
    border-radius: 10px;
  }
}
```

**Best For:**
- Component-specific customizations
- Fine-tuning component appearance
- Responsive adjustments

**Note**: Component styles are global, so use specific selectors.

### 7.4 Level 4: Create Custom Components

**What**: Create new components with custom styles

**How**:
1. Create `quartz/components/YourComponent.tsx`
2. Create `quartz/components/styles/YourComponent.scss`
3. Import and attach styles:
```tsx
import styles from "./styles/YourComponent.scss"

export default (() => {
  function YourComponent() {
    return <div class="your-component">Content</div>
  }

  YourComponent.css = styles
  return YourComponent
}) satisfies QuartzComponentConstructor
```

**Best For:**
- New UI elements
- Complex customizations
- Reusable components

---

## 8. Best Practices

### 8.1 Style Organization

**Do:**
- ✅ Use `custom.scss` for user customizations
- ✅ Use component-specific SCSS files for component styles
- ✅ Import variables: `@use "../../styles/variables.scss" as *;`
- ✅ Use CSS custom properties for theming
- ✅ Use SCSS nesting for organization

**Don't:**
- ❌ Modify base Quartz files directly (updates will overwrite)
- ❌ Use inline styles in components (use `.css` property)
- ❌ Hardcode colors (use CSS variables)
- ❌ Duplicate styles across components

### 8.2 CSS Variable Usage

**Do:**
- ✅ Use `var(--secondary)` instead of `#284b63`
- ✅ Use `var(--bodyFont)` instead of hardcoded fonts
- ✅ Use semantic variable names
- ✅ Override variables in `custom.scss` if needed

**Don't:**
- ❌ Hardcode theme colors
- ❌ Create new CSS variables without good reason
- ❌ Override variables in component styles (do it in `custom.scss`)

### 8.3 Responsive Design

**Do:**
- ✅ Use breakpoint variables (`$mobile`, `$tablet`, `$desktop`)
- ✅ Test on all breakpoints
- ✅ Use utility classes (`desktop-only`, `mobile-only`)
- ✅ Consider mobile-first approach

**Don't:**
- ❌ Hardcode breakpoint values
- ❌ Ignore mobile layouts
- ❌ Use fixed widths without media queries

### 8.4 Performance

**Do:**
- ✅ Let Quartz minify CSS (automatic)
- ✅ Use CSS custom properties (efficient)
- ✅ Avoid deeply nested selectors
- ✅ Use `@use` instead of `@import` (SCSS best practice)

**Don't:**
- ❌ Add unnecessary styles
- ❌ Duplicate styles
- ❌ Use `!important` unless necessary
- ❌ Create overly specific selectors

---

## 9. Common Customization Patterns

### 9.1 Sidebar Customization

**Goal**: Customize sidebar width, position, or styling

**Approach**:
```scss
// In custom.scss
.sidebar {
  width: 14rem !important;
  
  &.left {
    background-color: var(--light);
    border-right: 1px solid var(--lightgray);
  }
  
  &.right {
    background-color: var(--light);
    border-left: 1px solid var(--lightgray);
  }
}
```

### 9.2 Typography Customization

**Goal**: Change font sizes, line heights, or spacing

**Approach**:
```scss
// In custom.scss
article {
  h1 { font-size: 2rem; }
  h2 { font-size: 1.5rem; }
  p { line-height: 1.8; }
}
```

### 9.3 Color Scheme Override

**Goal**: Change specific colors without modifying config

**Approach**:
```scss
// In custom.scss
:root {
  --secondary: #your-color;
  --tertiary: #your-hover-color;
}

:root[saved-theme="dark"] {
  --secondary: #your-dark-color;
  --tertiary: #your-dark-hover-color;
}
```

### 9.4 Component Style Override

**Goal**: Customize a specific component

**Approach**:
```scss
// In custom.scss
.explorer {
  // Override explorer styles
  font-size: 0.9rem;
  
  button {
    padding: 0.5rem;
  }
}
```

### 9.5 Layout Adjustments

**Goal**: Change grid layout or spacing

**Approach**:
```scss
// In custom.scss
.page > #quartz-body {
  column-gap: 2rem;  // Increase gap between columns
  row-gap: 2rem;     // Increase gap between rows
}

.center {
  max-width: 42rem;  // Wider content area
}
```

---

## 10. Dark Mode System

### 10.1 Theme Toggle

**Component**: `Darkmode.tsx`
- Toggles between light and dark themes
- Saves preference to localStorage
- Updates `:root[saved-theme]` attribute

### 10.2 Dark Mode Styles

**Implementation**:
- CSS variables defined for both modes
- `:root[saved-theme="dark"]` selector switches variables
- Components use variables (automatically theme-aware)

**Example**:
```scss
body {
  background-color: var(--light);  // Changes based on theme
  color: var(--darkgray);          // Changes based on theme
}

:root[saved-theme="dark"] {
  --light: #161618;
  --darkgray: #d4d4d4;
}
```

### 10.3 Custom Dark Mode Colors

**How to Customize**:
```scss
// In custom.scss
:root[saved-theme="dark"] {
  --light: #your-dark-bg;
  --darkgray: #your-dark-text;
  // ... other dark mode colors
}
```

---

## 11. Font System Details

### 11.1 Font Loading Strategies

**Google Fonts with CDN** (`cdnCaching: true`):
- Links to Google Fonts CDN in `<head>`
- Faster initial load
- External dependency

**Google Fonts Local** (`cdnCaching: false`):
- Downloads fonts during build
- Hosts fonts in `static/fonts/`
- Self-contained (no external dependency)
- Slower build time

**Local Fonts** (`fontOrigin: "local"`):
- User provides fonts
- User defines `@font-face` in `custom.scss`
- Full control

### 11.2 Font Specification

**Simple String**:
```typescript
typography: {
  header: "Schibsted Grotesk",
}
```
- Uses default weights: `[400, 700]` for header, `[400, 600]` for body
- Includes italic for body font

**FontSpecification Object**:
```typescript
typography: {
  header: {
    name: "Schibsted Grotesk",
    weights: [400, 500, 700],
    includeItalic: false,
  },
}
```
- Custom weights
- Control italic inclusion
- More control over font loading

### 11.3 Font Variables

**Generated Variables**:
- `--titleFont`: Title font (or header if not specified)
- `--headerFont`: Header font (h1-h6)
- `--bodyFont`: Body text font
- `--codeFont`: Code font (monospace)

**Usage**:
```scss
h1, h2, h3 {
  font-family: var(--headerFont);
}

body {
  font-family: var(--bodyFont);
}

code {
  font-family: var(--codeFont);
}
```

---

## 12. Component Style Collection Process

### 12.1 Resource Collection

**Process** (`componentResources.ts`):

1. **Scan Components**:
   - Iterates through all emitters
   - Collects components via `getQuartzComponents()`
   - Creates set of unique components

2. **Extract Styles**:
   ```typescript
   for (const component of allComponents) {
     const { css, beforeDOMLoaded, afterDOMLoaded } = component
     // Collect CSS strings
   }
   ```

3. **Normalize**:
   - Handles single strings or arrays
   - Deduplicates styles
   - Preserves order

### 12.2 Style Aggregation

**Order**:
1. Google Fonts stylesheet (if local)
2. Component styles (registration order)
3. `custom.scss` (user styles)

**Result**: Single CSS string containing all styles

### 12.3 Processing

**LightningCSS Transform**:
- Minifies CSS
- Adds vendor prefixes
- Transpiles modern CSS for browser compatibility
- Targets specific browser versions

**Output**: Single minified `index.css` file

---

## 13. Comparison with Hugo Styling

### 13.1 Key Differences

| Aspect | Hugo | Quartz |
|--------|------|--------|
| **Preprocessor** | None (or manual) | SCSS (Sass) |
| **Variables** | CSS custom properties | CSS custom properties + SCSS variables |
| **Component Styles** | Separate CSS files | Attached to components |
| **Build Process** | Hugo Pipes | esbuild + LightningCSS |
| **Customization** | Override theme CSS | `custom.scss` + config |
| **Theme System** | Theme-based | Config-based |

### 13.2 Migration Considerations

**From Hugo to Quartz:**

1. **SCSS Conversion**:
   - Convert CSS to SCSS
   - Use `@use` instead of `@import`
   - Leverage SCSS features (nesting, variables)

2. **Component Styles**:
   - Move component styles to component `.css` property
   - Or keep in `custom.scss` if global

3. **CSS Variables**:
   - Map Hugo theme variables to Quartz CSS variables
   - Override in `custom.scss` if needed

4. **Layout System**:
   - Quartz uses CSS Grid (Hugo may use Flexbox)
   - Adjust breakpoints to match Quartz system

---

## 14. Summary and Recommendations

### 14.1 Styling Architecture Strengths

✅ **Component-Based**: Styles co-located with components
✅ **Theme System**: CSS variables enable easy theming
✅ **SCSS Support**: Full Sass features available
✅ **Build Optimization**: Automatic minification and optimization
✅ **Responsive**: Built-in breakpoint system
✅ **Customizable**: Multiple customization levels

### 14.2 Best Customization Approach

**For Most Users**:
1. Start with theme configuration (colors, fonts)
2. Add custom styles in `custom.scss` for overrides
3. Use CSS variables for consistency
4. Leverage SCSS features for organization

**For Advanced Users**:
1. Create custom components with component styles
2. Override component styles in `custom.scss`
3. Customize layout grid if needed
4. Add custom CSS variables if necessary

### 14.3 Key Takeaways

1. **Quartz uses SCSS** for styling with component-based architecture
2. **CSS custom properties** drive the theme system
3. **`custom.scss`** is the primary customization file
4. **Component styles** are attached via `.css` property
5. **Build process** compiles and optimizes all styles into single CSS file
6. **Responsive design** uses breakpoint variables
7. **Dark mode** is built-in via CSS variable switching

---

## Appendix: File Reference

### Global Styles
- `quartz/styles/variables.scss` - Breakpoints and layout variables
- `quartz/styles/base.scss` - Base styles and layout grid
- `quartz/styles/syntax.scss` - Code syntax highlighting
- `quartz/styles/callouts.scss` - Callout/admonition styles
- `quartz/styles/custom.scss` - User customizations

### Component Styles
- `quartz/components/styles/*.scss` - Component-specific styles

### Build Files
- `quartz/util/theme.ts` - Theme processing and CSS variable generation
- `quartz/plugins/emitters/componentResources.ts` - Style collection and processing
- `quartz/cli/handlers.js` - Build process with SCSS compilation

### Configuration
- `quartz.config.ts` - Theme configuration (colors, fonts)

---

*Analysis completed: 2025-01-XX*
*Project: Quartz v4 CSS and Styling System*

