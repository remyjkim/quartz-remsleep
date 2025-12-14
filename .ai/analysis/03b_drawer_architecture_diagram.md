# Drawer Architecture Diagram

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interaction                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Hover over internal link (a.internal)                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│           Existing Popover System (UNCHANGED)                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  popover.inline.ts                                         │ │
│  │  - mouseEnterHandler triggered                             │ │
│  │  - fetchCanonical(targetUrl)                               │ │
│  │  - normalizeRelativeURLs(html, targetUrl)                  │ │
│  │  - Extract .popover-hint elements                          │ │
│  │  - Create popover element                                  │ │
│  │  - Position via @floating-ui/dom                           │ │
│  │  ┌──────────────────────────────────────┐                  │ │
│  │  │  NEW: Add Drawer Trigger Button      │                  │ │
│  │  │  - "Open in Side" button             │                  │ │
│  │  │  - onClick → window.openDrawer()     │                  │ │
│  │  └──────────────────────────────────────┘                  │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  User Sees Popover with "Open in Side" Button                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (optional click)
┌─────────────────────────────────────────────────────────────────┐
│           NEW: PreviewDrawer Component                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  PreviewDrawer.tsx (Component Definition)                  │ │
│  │  - Drawer container HTML structure                         │ │
│  │  - Backdrop element                                        │ │
│  │  - Header with close button                                │ │
│  │  - Body for content                                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  previewDrawer.inline.ts (Drawer Logic)                    │ │
│  │  - window.openDrawer(url, hash, content)                   │ │
│  │  - Clone content from popover                              │ │
│  │  - Inject into drawer body                                 │ │
│  │  - Handle hash scrolling                                   │ │
│  │  - Show drawer (add 'active' class)                        │ │
│  │  - Close handlers (Escape, backdrop, button)               │ │
│  │  - SPA cleanup on 'nav' event                              │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  previewDrawer.scss (Drawer Styles)                        │ │
│  │  - Fixed position, right: 0                                │ │
│  │  - Width: 70vw (90vw on mobile)                            │ │
│  │  - Transform: translateX(100%) → translateX(0)             │ │
│  │  - Backdrop overlay with opacity transition                │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  70% Width Drawer Slides in from Right                          │
│  - Full preview content displayed                               │
│  - Scrollable if content is long                                │
│  - Hash fragment auto-scrolled to                               │
│  - Close via: Escape key, backdrop click, X button              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Registration Flow

```
quartz.config.ts
    └─> enablePopovers: true
           │
           ▼
quartz/plugins/emitters/componentResources.ts
    └─> if (cfg.enablePopovers) {
           componentResources.afterDOMLoaded.push(popoverScript)
           componentResources.css.push(popoverStyle)
         }
         ├─> popoverScript → popover.inline.ts
         └─> popoverStyle → popover.scss

quartz.layout.ts
    └─> sharedPageComponents.afterBody = [
           Component.Graph(),
           Component.PreviewDrawer(),  ← NEW
         ]
           │
           ▼
quartz/components/index.ts
    └─> export { PreviewDrawer }
           │
           ▼
quartz/components/PreviewDrawer.tsx
    └─> PreviewDrawer.afterDOMLoaded = drawerScript
        PreviewDrawer.css = drawerStyle
           ├─> drawerScript → previewDrawer.inline.ts
           └─> drawerStyle → previewDrawer.scss
```

---

## Content Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│  Target Page HTML (fetched once)                             │
│  https://example.com/target-page                             │
└──────────────────────────────────────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │  fetchCanonical(targetUrl)   │
        │  (from util.ts)              │
        └──────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │  DOMParser.parseFromString() │
        │  (parse HTML)                │
        └──────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │  normalizeRelativeURLs()     │
        │  (fix relative paths)        │
        └──────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │  Prefix all IDs:             │
        │  id → popover-internal-id    │
        └──────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │  Extract .popover-hint       │
        │  elements                    │
        └──────────────────────────────┘
                       │
              ┌────────┴────────┐
              ▼                 ▼
    ┌──────────────────┐  ┌──────────────────┐
    │  Popover Inner   │  │  Drawer Content  │
    │  (original)      │  │  (cloned)        │
    │                  │  │                  │
    │  + Trigger Btn ──┼─►│  Same content    │
    │    "Open in Side"│  │  but in drawer   │
    └──────────────────┘  └──────────────────┘
```

---

## SPA Lifecycle Integration

```
User navigates to new page
         │
         ▼
┌─────────────────────┐
│  SPA Navigation     │
│  (spa.inline.ts)    │
└─────────────────────┘
         │
         ├─> document.dispatchEvent("nav", { url })
         │
         └─> cleanupFns.forEach(fn => fn())
                    │
    ┌───────────────┼───────────────┐
    ▼               ▼               ▼
[popover]      [drawer]        [other components]
cleanup        cleanup         cleanup
listeners      - close drawer  listeners
               - remove listeners
```

**All components listen to "nav" event**:
- `popover.inline.ts` - Re-attach hover listeners to new links
- `previewDrawer.inline.ts` - Close drawer, re-initialize
- `search.inline.ts` - Re-initialize search
- `graph.inline.ts` - Re-render graph
- etc.

**Cleanup pattern** (used everywhere):
```typescript
document.addEventListener("nav", () => {
  const handler = () => { /* ... */ }
  element.addEventListener("click", handler)
  
  window.addCleanup(() => {
    element.removeEventListener("click", handler)
  })
})
```

---

## File Structure

```
quartz/
├── components/
│   ├── PreviewDrawer.tsx                    [NEW] 
│   ├── index.ts                             [MODIFIED] (+1 export)
│   ├── scripts/
│   │   ├── popover.inline.ts                [MODIFIED] (+drawer button)
│   │   ├── previewDrawer.inline.ts          [NEW]
│   │   └── util.ts                          (registerEscapeHandler - reused)
│   └── styles/
│       ├── popover.scss                     [MODIFIED] (+button styles)
│       └── previewDrawer.scss               [NEW]
├── cfg.ts                                   (unchanged)
└── ...

quartz.config.ts                             (unchanged - popovers stay enabled)
quartz.layout.ts                             [MODIFIED] (+PreviewDrawer in afterBody)
globals.d.ts                                 [MODIFIED] (+window.openDrawer type)
```

**Summary**:
- **3 new files**: PreviewDrawer.tsx, previewDrawer.inline.ts, previewDrawer.scss
- **5 modified files**: popover.inline.ts, popover.scss, index.ts, quartz.layout.ts, globals.d.ts
- **0 deleted files**
- **Total changes**: 8 files

---

## Drawer State Machine

```
┌─────────────┐
│   CLOSED    │ (initial state)
│             │
│ - transform: translateX(100%)
│ - backdrop opacity: 0
│ - body overflow: auto
└─────────────┘
      │
      │ window.openDrawer(url, hash, content)
      ▼
┌─────────────┐
│   OPENING   │ (transition)
│             │
│ - Add 'active' class
│ - Inject content
│ - CSS transition: 0.3s
└─────────────┘
      │
      │ (after 300ms)
      ▼
┌─────────────┐
│    OPEN     │ (stable)
│             │
│ - transform: translateX(0)
│ - backdrop opacity: 1
│ - body overflow: hidden
│ - focusable
└─────────────┘
      │
      │ closeDrawer() via:
      │ - Escape key
      │ - Backdrop click
      │ - Close button (×)
      │ - SPA navigation
      ▼
┌─────────────┐
│   CLOSING   │ (transition)
│             │
│ - Remove 'active' class
│ - CSS transition: 0.3s
└─────────────┘
      │
      │ (after 300ms)
      ▼
┌─────────────┐
│   CLOSED    │
│             │
│ - Restore focus
│ - body overflow: auto
└─────────────┘
```

---

## Content Type Handling

Drawer inherits all popover content type handling via cloning:

```
Content Type Check (in popover.inline.ts)
         │
    ┌────┴─────┬─────────┐
    ▼          ▼         ▼
[image/*]  [application/pdf]  [text/html]
    │          │                │
    ▼          ▼                ▼
  <img>     <iframe>      .popover-hint extraction
    │          │                │
    └──────────┴────────────────┘
              │
              ▼
    popoverInner contains rendered content
              │
              ▼
    Clone node → pass to drawer
              │
              ▼
    Drawer displays same content
```

**Supported in drawer**:
- ✅ Markdown/HTML pages (via `.popover-hint`)
- ✅ Images (via `<img>` tags)
- ✅ PDFs (via `<iframe>` embeds)
- ✅ Hash fragment scrolling
- ✅ Relative URL normalization

---

## CSS Selectors & Classes

**Popover Classes** (existing):
- `.popover` - Popover container
- `.popover-inner` - Content container
- `.popover-hint` - Content marker (what gets extracted)
- `.active-popover` - Visible state

**Drawer Classes** (new):
- `.preview-drawer` - Drawer container
- `.drawer-backdrop` - Overlay behind drawer
- `.drawer-header` - Header section
- `.drawer-title` - Page title display
- `.drawer-close` - Close button (×)
- `.drawer-body` - Content container
- `.active` - Open state (drawer & backdrop)

**Popover Trigger** (new):
- `.drawer-trigger` - "Open in Side" button in popover

---

## Responsive Behavior

```
┌──────────────────────────────────────────────────────────┐
│  Desktop (>1200px)                                       │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Main Content (30vw)    │    Drawer (70vw)       │  │
│  │                          │                         │  │
│  │  - Popovers work         │  - Full preview        │  │
│  │  - Hover interactions    │  - Scrollable          │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  Tablet (800px - 1200px)                                 │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Main Content (30vw)    │    Drawer (70vw)       │  │
│  │                          │                         │  │
│  │  - Popovers work         │  - Full preview        │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  Mobile (<800px)                                         │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Main (10vw) │  Drawer (90vw)                     │  │
│  │              │                                     │  │
│  │  - No popovers (display: none)                    │  │
│  │  - Links → could trigger drawer directly?         │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

**Mobile consideration**: Since popovers don't show on mobile, should we make links directly open the drawer? This would require additional logic:

```typescript
// In previewDrawer.inline.ts
if (window.innerWidth <= 800) {
  // Mobile: click opens drawer instead of navigating
  document.querySelectorAll("a.internal").forEach(link => {
    link.addEventListener("click", (e) => {
      if (!e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        openDrawerFromLink(link)
      }
    })
  })
}
```

**Decision needed**: Should mobile links open drawer or navigate normally?

---

## Performance Considerations

**Content Fetching**:
- ❌ **Bad**: Fetch content twice (once for popover, once for drawer)
- ✅ **Good**: Fetch once, clone for drawer
- ✅ **Better**: Cache fetched content keyed by URL

**Drawer Rendering**:
- First open: ~300ms (CSS transition)
- Subsequent opens (same content): ~50ms (DOM cloning)
- Content injection: O(n) where n = number of DOM nodes

**Memory**:
- One drawer instance globally (singleton)
- Content cleared on close (if needed) or kept for history

**Optimization idea**: Keep last 5 drawer contents cached for instant re-opening:
```typescript
const drawerCache = new Map<string, Node>() // url → content
```

---

## Testing Checklist

### Functional Tests:
- [ ] Hover on link → popover appears
- [ ] Click "Open in Side" → drawer opens
- [ ] Drawer shows correct content
- [ ] Hash fragments scroll to heading
- [ ] Close via Escape key
- [ ] Close via backdrop click
- [ ] Close via × button
- [ ] Close on SPA navigation
- [ ] Images display correctly
- [ ] PDFs load in iframe
- [ ] Relative URLs work

### Edge Cases:
- [ ] Very long content (scrolling)
- [ ] Content with no `.popover-hint`
- [ ] Circular transclusions
- [ ] Links with `data-noPopover="true"`
- [ ] Multiple rapid opens/closes
- [ ] Open drawer, hover another link (popover should show)

### Responsive:
- [ ] Desktop: 70vw width
- [ ] Tablet: 70vw width
- [ ] Mobile: 90vw width
- [ ] Mobile: popovers hidden, drawer works

### Accessibility:
- [ ] Focus moves to close button on open
- [ ] Focus returns to trigger on close
- [ ] Screen reader announces drawer state
- [ ] Keyboard navigation works
- [ ] Color contrast meets WCAG AA

### Integration:
- [ ] Works with reader mode
- [ ] Works with dark mode
- [ ] Works with search overlay
- [ ] Works with graph view
- [ ] No console errors
- [ ] Build completes successfully

---

## Future Enhancements

**Phase 2+**:
1. **Drawer History**: Back/forward buttons to navigate opened pages
2. **Multiple Drawers**: Stack or tab multiple previews
3. **Resize Handle**: User-adjustable width
4. **Pin Drawer**: Keep drawer open while browsing
5. **Drawer-to-Drawer**: Links in drawer open new drawer content
6. **Mobile-specific UX**: Direct link clicks to drawer on mobile
7. **Configuration Options**: Width, position (left/right), behavior
8. **Analytics**: Track drawer usage vs popover usage
9. **Keyboard Shortcuts**: Cmd+K to open drawer for current link
10. **Preview Mode Toggle**: Switch between popover and drawer as default

**Advanced**:
- **iframe Mode**: Render full page in iframe for truly faithful preview
- **Embed Mode**: Add `?embed=1` query param to hide sidebars in drawer
- **Collaborative Notes**: Share drawer state via URL hash

---

## Conclusion

This architecture provides:
1. ✅ **Minimal changes**: 8 files total
2. ✅ **Non-breaking**: Existing popovers work unchanged
3. ✅ **Upgrade-friendly**: Isolated component
4. ✅ **Quartz-idiomatic**: Follows component patterns
5. ✅ **Accessible**: Keyboard, screen reader, focus management
6. ✅ **Responsive**: Works on all screen sizes
7. ✅ **Performant**: Content reuse, no duplicate fetches

Ready to proceed with detailed task planning! 🚀
