# Drawer Implementation Investigation

## Executive Summary

This document outlines the comprehensive investigation into implementing a custom drawer component for the Quartz project. The goal is to enhance the popover preview system by adding a "Open in the Side" button that triggers a right-side drawer (70% width) displaying the full preview content.

**Key Decision**: We will **keep popovers enabled** and **augment them** with a drawer button, rather than replacing the popover system entirely.

---

## Current Popover Architecture

### 1. System Components

The existing popover system consists of:

#### **Files**:
- `quartz/components/scripts/popover.inline.ts` - Client-side popover logic
- `quartz/components/styles/popover.scss` - Popover styling
- `quartz/cfg.ts` - Configuration type definitions
- `quartz.config.ts` - Configuration (currently `enablePopovers: true`)
- `quartz/plugins/emitters/componentResources.ts` - Resource injection logic

#### **Key Functions & Features**:

**`popover.inline.ts`** (134 lines):
- Uses `@floating-ui/dom` for positioning
- Event: `mouseEnterHandler` on `a.internal` links
- Respects `data-noPopover="true"` attribute
- Fetches content via `fetchCanonical(targetUrl)` from `util.ts`
- Normalizes relative URLs via `normalizeRelativeURLs(html, targetUrl)`
- Prefixes IDs: `popover-internal-${id}` to avoid collisions
- Extracts `.popover-hint` elements from target page
- Handles images, PDFs, and HTML content
- Scrolls to hash fragments within popover
- Cleans up via `window.addCleanup()` (SPA lifecycle)

**Content Marking**:
All pages include `class="popover-hint"` on main content containers:
- `quartz/components/pages/Content.tsx` - Article content
- `quartz/components/pages/TagContent.tsx` - Tag pages
- `quartz/components/pages/FolderContent.tsx` - Folder listings
- `quartz/components/pages/404.tsx` - Error pages
- `quartz/components/renderPage.tsx` - Page headers

### 2. How Popovers are Enabled

**Configuration Flow**:
1. `quartz.config.ts` sets `enablePopovers: true`
2. `quartz/plugins/emitters/componentResources.ts` (line 83-86):
   ```typescript
   if (cfg.enablePopovers) {
     componentResources.afterDOMLoaded.push(popoverScript)
     componentResources.css.push(popoverStyle)
   }
   ```
3. Scripts/styles are injected globally during build

### 3. SPA Integration

**Custom Event System** (`index.d.ts`):
```typescript
interface CustomEventMap {
  prenav: CustomEvent<{}>
  nav: CustomEvent<{ url: FullSlug }>
  themechange: CustomEvent<{ theme: "light" | "dark" }>
  readermodechange: CustomEvent<{ mode: "on" | "off" }>
}
```

**Lifecycle** (`spa.inline.ts` line 43-44):
```typescript
const cleanupFns: Set<(...args: any[]) => void> = new Set()
window.addCleanup = (fn) => cleanupFns.add(fn)
```

All interactive components listen to `document.addEventListener("nav", ...)` and register cleanup functions.

### 4. Component Pattern

**Standard Quartz Component** (example: `Darkmode.tsx`):
```typescript
const Darkmode: QuartzComponent = ({ displayClass, cfg }: QuartzComponentProps) => {
  return <button class={classNames(displayClass, "darkmode")}>...</button>
}

Darkmode.beforeDOMLoaded = darkmodeScript  // Optional
Darkmode.afterDOMLoaded = darkmodeScript   // Optional
Darkmode.css = styles

export default (() => Darkmode) satisfies QuartzComponentConstructor
```

Components are registered in:
- `quartz/components/index.ts` (exports)
- `quartz.layout.ts` (layout configuration)

---

## Proposed Implementation Strategy

### Option A: Augment Popovers (RECOMMENDED)

**Rationale**: 
- Minimal changes to existing system
- Popovers remain functional (hover preview)
- Drawer provides extended functionality
- No need to disable/replace working features

**Implementation**:

#### 1. Modify Popover to Include Drawer Button

**File**: `quartz/components/scripts/popover.inline.ts`

**Changes**:
- After popover element is created and `.popover-hint` content is extracted
- Add a "Open in Side" button to the popover header
- Button click triggers drawer opening with the same content
- Use same content pipeline (no re-fetching needed)

**Key modification point** (around line 69):
```typescript
const popoverElement = document.createElement("div")
popoverElement.id = popoverId
popoverElement.classList.add("popover")
const popoverInner = document.createElement("div")
popoverInner.classList.add("popover-inner")

// NEW: Add drawer button
const drawerButton = document.createElement("button")
drawerButton.classList.add("drawer-trigger")
drawerButton.textContent = "Open in Side"
drawerButton.addEventListener("click", (e) => {
  e.stopPropagation()
  openDrawer(targetUrl, hash, popoverInner.cloneNode(true))
})
popoverInner.appendChild(drawerButton)
```

#### 2. Create PreviewDrawer Component

**New Files**:
- `quartz/components/PreviewDrawer.tsx` (component definition)
- `quartz/components/scripts/previewDrawer.inline.ts` (drawer logic)
- `quartz/components/styles/previewDrawer.scss` (drawer styles)

**Component Structure** (`PreviewDrawer.tsx`):
```typescript
// @ts-ignore
import drawerScript from "./scripts/previewDrawer.inline"
import drawerStyle from "./styles/previewDrawer.scss"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const PreviewDrawer: QuartzComponent = () => {
  return (
    <>
      <div id="drawer-backdrop" class="drawer-backdrop"></div>
      <div id="preview-drawer" class="preview-drawer">
        <div class="drawer-header">
          <button class="drawer-close" aria-label="Close drawer">×</button>
          <h3 class="drawer-title"></h3>
        </div>
        <div class="drawer-body"></div>
      </div>
    </>
  )
}

PreviewDrawer.afterDOMLoaded = drawerScript
PreviewDrawer.css = drawerStyle

export default (() => PreviewDrawer) satisfies QuartzComponentConstructor
```

**Drawer Logic** (`previewDrawer.inline.ts`):
```typescript
import { normalizeRelativeURLs } from "../../util/path"
import { registerEscapeHandler } from "./util"

let drawer: HTMLElement | null = null
let drawerBackdrop: HTMLElement | null = null
let drawerBody: HTMLElement | null = null
let drawerTitle: HTMLElement | null = null

function initDrawer() {
  drawer = document.getElementById("preview-drawer")
  drawerBackdrop = document.getElementById("drawer-backdrop")
  drawerBody = drawer?.querySelector(".drawer-body") as HTMLElement
  drawerTitle = drawer?.querySelector(".drawer-title") as HTMLElement
  
  // Close handlers
  const closeButton = drawer?.querySelector(".drawer-close")
  closeButton?.addEventListener("click", closeDrawer)
  
  registerEscapeHandler(drawerBackdrop, closeDrawer)
}

function openDrawer(url: URL, hash: string, content: Node) {
  if (!drawer || !drawerBody || !drawerTitle) return
  
  // Clear previous content
  drawerBody.innerHTML = ""
  
  // Set title
  drawerTitle.textContent = url.pathname
  
  // Append content
  drawerBody.appendChild(content)
  
  // Handle hash scrolling
  if (hash) {
    const targetAnchor = `#popover-internal-${hash.slice(1)}`
    const heading = drawerBody.querySelector(targetAnchor) as HTMLElement
    if (heading) {
      drawerBody.scrollTop = heading.offsetTop - 12
    }
  }
  
  // Show drawer
  drawer.classList.add("active")
  drawerBackdrop.classList.add("active")
  document.body.style.overflow = "hidden"
}

function closeDrawer() {
  drawer?.classList.remove("active")
  drawerBackdrop?.classList.remove("active")
  document.body.style.overflow = ""
}

// Make openDrawer globally available for popover to call
window.openDrawer = openDrawer

document.addEventListener("nav", () => {
  initDrawer()
  // Close drawer on navigation
  closeDrawer()
})
```

**Drawer Styles** (`previewDrawer.scss`):
```scss
@use "../../styles/variables.scss" as *;

.drawer-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 998;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
  
  &.active {
    opacity: 1;
    visibility: visible;
  }
}

.preview-drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: 70vw;
  height: 100vh;
  background-color: var(--light);
  z-index: 999;
  transform: translateX(100%);
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.15);
  
  &.active {
    transform: translateX(0);
  }
  
  .drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--lightgray);
    flex-shrink: 0;
    
    .drawer-title {
      margin: 0;
      font-size: 1.2rem;
      font-weight: $semiBoldWeight;
      color: var(--darkgray);
      flex: 1;
    }
    
    .drawer-close {
      background: none;
      border: none;
      font-size: 2rem;
      line-height: 1;
      color: var(--gray);
      cursor: pointer;
      padding: 0;
      width: 2rem;
      height: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &:hover {
        color: var(--darkgray);
      }
    }
  }
  
  .drawer-body {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    
    // Inherit popover-hint styles
    & > * {
      max-width: 100%;
    }
  }
  
  @media all and ($mobile) {
    width: 90vw;
  }
}
```

#### 3. Register Component

**File**: `quartz/components/index.ts`
```typescript
import PreviewDrawer from "./PreviewDrawer"

export {
  // ... existing exports
  PreviewDrawer,
}
```

**File**: `quartz.layout.ts`
```typescript
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [...],
  afterBody: [
    Component.Graph(),
    Component.PreviewDrawer(), // Add drawer globally
  ],
  footer: Component.Footer({...}),
}
```

#### 4. Update Type Definitions

**File**: `globals.d.ts`
```typescript
interface Window {
  spaNavigate(url: URL, isBack: boolean = false)
  addCleanup(fn: (...args: any[]) => void)
  openDrawer(url: URL, hash: string, content: Node): void  // NEW
}
```

#### 5. Style Drawer Trigger Button in Popover

**File**: `quartz/components/styles/popover.scss`
```scss
.popover {
  // ... existing styles
  
  .drawer-trigger {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background-color: var(--secondary);
    color: var(--light);
    border: none;
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-size: 0.85rem;
    cursor: pointer;
    z-index: 10;
    
    &:hover {
      background-color: var(--tertiary);
    }
  }
}
```

---

### Option B: Replace Popovers with Drawer (NOT RECOMMENDED)

**Rationale**: 
- Mentor's guideline suggests this approach
- More "clean" from architectural perspective
- Simpler state management

**Why NOT recommended**:
- Loses hover preview functionality
- Users want requirement is to **add** drawer, not replace popovers
- More disruptive to UX
- Requires disabling working feature

**Implementation** (if chosen):
1. Set `enablePopovers: false` in `quartz.config.ts`
2. Create `PreviewDrawer` component as above
3. Drawer script listens to `a.internal` clicks instead of popover hover
4. Re-implement all popover features in drawer context

---

## Technical Considerations

### 1. Content Reuse

**Efficient approach**: Clone content already fetched for popover
```typescript
// In popover script, after content is extracted:
const contentClone = popoverInner.cloneNode(true)
drawerButton.addEventListener("click", () => {
  window.openDrawer(targetUrl, hash, contentClone)
})
```

**Benefits**:
- No duplicate fetches
- Consistent content between popover and drawer
- Faster drawer opening

### 2. ID Collision Handling

**Current system**: Prefixes IDs with `popover-internal-`
**Drawer system**: Can reuse same prefix since we're cloning the popover content

**Alternative**: Separate prefix `drawer-internal-` if we want independent content

### 3. Mobile Considerations

**Popover**: Hidden on mobile (`@media all and ($mobile) { display: none !important; }`)
**Drawer**: Should be functional on mobile at 90vw width

### 4. Reader Mode Integration

**Reader mode** (`readermode.inline.ts`) dims sidebars on activation.
**Drawer consideration**: Should drawer close when reader mode is enabled?

**Recommendation**: Yes, close drawer on reader mode activation:
```typescript
document.addEventListener("readermodechange", (e) => {
  if (e.detail.mode === "on") {
    closeDrawer()
  }
})
```

### 5. SPA Navigation

**Requirement**: Drawer must close on navigation
**Implementation**: Already included in `document.addEventListener("nav", ...)` handler

### 6. Accessibility

**Required elements**:
- `aria-label` on close button ✅
- Focus trap when drawer is open
- Restore focus to trigger button on close
- Keyboard navigation (already handled via `registerEscapeHandler`)

**Enhancement**:
```typescript
let lastFocusedElement: HTMLElement | null = null

function openDrawer(url: URL, hash: string, content: Node) {
  lastFocusedElement = document.activeElement as HTMLElement
  // ... open drawer
  closeButton?.focus()
}

function closeDrawer() {
  // ... close drawer
  lastFocusedElement?.focus()
}
```

### 7. Content Types

**Popover handles**:
- HTML (`.popover-hint` extraction) ✅
- Images (`<img>`) ✅
- PDFs (`<iframe>`) ✅

**Drawer should inherit** all three content types via cloning.

---

## Implementation Phases

### Phase 1: Core Drawer Component (Minimal)
1. Create `PreviewDrawer.tsx`, `previewDrawer.inline.ts`, `previewDrawer.scss`
2. Register in `index.ts` and `quartz.layout.ts`
3. Implement basic open/close functionality
4. Add global `window.openDrawer()` function

**Test**: Drawer opens/closes manually via console: `window.openDrawer(...)`

### Phase 2: Popover Integration
1. Modify `popover.inline.ts` to add drawer trigger button
2. Wire button to call `window.openDrawer()` with cloned content
3. Style drawer trigger button

**Test**: Hover on link → popover appears → click "Open in Side" → drawer opens

### Phase 3: Polish & Edge Cases
1. Add accessibility features (focus trap, ARIA)
2. Handle reader mode integration
3. Mobile responsive adjustments
4. Content scrolling with hash fragments
5. Test with images, PDFs, long content

**Test**: Full user flow across different content types and devices

### Phase 4: Documentation
1. Update `docs/` with drawer feature explanation
2. Add configuration options (optional: drawer width, position)
3. Document opt-out mechanism (e.g., `data-noDrawer="true"`)

---

## Configuration Options (Future)

Could be added to `quartz.config.ts`:
```typescript
configuration: {
  enablePopovers: true,
  enableDrawer: true,        // Enable/disable drawer
  drawerWidth: "70vw",       // Customize width
  drawerPosition: "right",   // "left" or "right"
}
```

But for MVP, hardcode these values.

---

## Files to Create/Modify

### New Files (3):
1. `quartz/components/PreviewDrawer.tsx`
2. `quartz/components/scripts/previewDrawer.inline.ts`
3. `quartz/components/styles/previewDrawer.scss`

### Modified Files (5):
1. `quartz/components/scripts/popover.inline.ts` - Add drawer trigger button
2. `quartz/components/styles/popover.scss` - Style drawer trigger button
3. `quartz/components/index.ts` - Export PreviewDrawer
4. `quartz.layout.ts` - Add PreviewDrawer to layout
5. `globals.d.ts` - Add window.openDrawer type

### Total: 8 files

---

## Risk Assessment

### Low Risk:
- Drawer component is isolated and doesn't break existing features
- Popover system remains unchanged (core functionality)
- Easy to disable/remove if issues arise

### Medium Risk:
- Popover modification (drawer button) - small change, well-tested area
- Performance with large content - mitigated by cloning already-fetched content

### High Risk:
- None identified

---

## Alternative UX Approaches (Discussed)

### 1. Click to Open Drawer (No Popover)
**Flow**: Click link → drawer opens (no navigation)
**Pros**: Simpler interaction model
**Cons**: Loses hover preview, requires modifier keys for normal navigation

### 2. Popover with Expand Icon
**Flow**: Hover → popover + small expand icon → click icon → drawer
**Pros**: Cleaner popover UI
**Cons**: Icon might be too small, extra click target

### 3. Drawer on Long Hover
**Flow**: Hover 1s → popover, hover 3s → auto-open drawer
**Pros**: No extra button
**Cons**: Unpredictable UX, hard to control

**Chosen approach**: Option from user requirement - popover with visible button.

---

## Mentor Guideline Alignment

**Mentor said**: 
> "The cleanest (and most upgrade-friendly) way to replace Quartz's hover popovers with a right-side 'preview drawer' is to disable the built-in popover feature and ship your drawer as a custom Quartz component."

**Our deviation**:
We're **augmenting** instead of **replacing** because:
1. User wants "still show the popover preview" (explicit requirement)
2. Popovers provide value (quick preview without heavy UI)
3. Less disruptive to existing UX
4. Drawer adds functionality, doesn't remove it

**Alignment maintained**:
- Custom Quartz component ✅
- Reuses popover preview pipeline ✅
- Component pattern (`.tsx` + `.inline.ts` + `.scss`) ✅
- `afterBody` placement ✅
- Respects SPA lifecycle (`nav` event, `addCleanup`) ✅

---

## Next Steps

1. **Review this investigation** with user
2. **Confirm approach** (Option A: Augment vs Option B: Replace)
3. **Create detailed task plan** in `.ai/tasks/02_implement_preview_drawer.md`
4. **Begin Phase 1 implementation**

---

## Questions for User

1. Confirm: Keep popovers + add drawer button? (vs replace popovers entirely)
2. Drawer width: 70vw ok? Mobile: 90vw?
3. Button text: "Open in Side" or "Open Full Preview" or custom?
4. Should drawer close automatically on reader mode activation?
5. Any other content types to support (videos, embeds)?

---

## Conclusion

**Recommended Strategy**: Option A (Augment Popovers)

**Minimal, Precise Changes**:
- 3 new files (component, script, style)
- 5 modified files (integration points)
- ~200 lines of new code total
- No breaking changes to existing functionality

**Upgrade-friendly**:
- Component is isolated
- No core Quartz modifications
- Easy to maintain across Quartz updates
- Can be disabled via layout config

**User Experience**:
- Preserves hover preview (fast)
- Adds drawer for deep reading (immersive)
- Accessible and responsive
- Consistent with Quartz patterns

**Ready for detailed task planning**: Yes ✅
