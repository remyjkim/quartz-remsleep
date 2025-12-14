# Preview Drawer Implementation - Executive Summary

**Date**: 2025-12-13  
**Project**: Quartz Preview Drawer Component  
**Status**: Investigation Complete ✅

---

## Quick Reference

**Goal**: Add a drawer component that opens from the right side (70% width) when user clicks "Open in Side" button in popover previews.

**Approach**: Augment existing popovers (keep them working) with drawer functionality.

**Complexity**: Low-Medium  
**Risk**: Low  
**Files Changed**: 8 (3 new, 5 modified)  
**Lines of Code**: ~200 new lines  

---

## What We Investigated

### 1. Current Popover System ✅

**Location**: `quartz/components/scripts/popover.inline.ts` (134 lines)

**How it works**:
- Listens to hover on `a.internal` links
- Fetches target page HTML via `fetchCanonical()`
- Normalizes URLs, prefixes IDs to avoid collisions
- Extracts `.popover-hint` content (special class marking preview-able content)
- Positions tooltip using `@floating-ui/dom`
- Handles images, PDFs, and HTML content
- Cleans up on SPA navigation via `window.addCleanup()`

**Key Insight**: We can reuse all this logic by cloning the popover content instead of re-fetching.

### 2. Quartz Component Architecture ✅

**Pattern** (from `Darkmode.tsx`, `ReaderMode.tsx`):
```typescript
const MyComponent: QuartzComponent = (props) => {
  return <div>...</div>
}

MyComponent.afterDOMLoaded = script  // Client-side JS
MyComponent.css = styles             // Component styles

export default (() => MyComponent) satisfies QuartzComponentConstructor
```

**Registration**:
1. Export from `quartz/components/index.ts`
2. Add to `quartz.layout.ts` (usually in `afterBody` for global components)

### 3. SPA Lifecycle System ✅

**Event System** (`index.d.ts`):
- `nav` - Fired on page navigation
- `prenav` - Before navigation starts
- `themechange` - Dark/light mode toggle
- `readermodechange` - Reader mode toggle

**Cleanup Pattern**:
```typescript
document.addEventListener("nav", () => {
  // Attach listeners
  element.addEventListener("click", handler)
  
  // Register cleanup
  window.addCleanup(() => {
    element.removeEventListener("click", handler)
  })
})
```

All components use this pattern to avoid memory leaks in SPA context.

### 4. Content Marking System ✅

**Every page type includes** `class="popover-hint"`:
- `Content.tsx` - Regular pages (article tag)
- `TagContent.tsx` - Tag listing pages
- `FolderContent.tsx` - Folder pages
- `404.tsx` - Error pages
- `renderPage.tsx` - Page headers

This class marks what content should appear in previews.

---

## Our Solution

### Strategy: Augment, Don't Replace

**Why**:
1. User explicitly wants to "still show the popover preview"
2. Popovers provide value (quick hover preview)
3. Drawer adds functionality without removing features
4. Less disruptive to existing UX
5. Lower risk (isolated change)

**How**:
1. Keep popovers enabled (`enablePopovers: true`)
2. Add "Open in Side" button to popover
3. Button opens drawer with cloned popover content
4. Drawer component exists globally (like Graph, Footer)

### Technical Design

**Content Flow**:
```
User hovers link
    ↓
Popover appears (existing)
    ↓
Popover fetches & renders content (existing)
    ↓
[NEW] "Open in Side" button added to popover
    ↓
User clicks button
    ↓
[NEW] Drawer opens with cloned content (no re-fetch!)
    ↓
User reads, scrolls, closes
```

**Component Structure**:

```typescript
// PreviewDrawer.tsx - Component definition
<>
  <div id="drawer-backdrop" class="drawer-backdrop"></div>
  <div id="preview-drawer" class="preview-drawer">
    <div class="drawer-header">
      <button class="drawer-close">×</button>
      <h3 class="drawer-title"></h3>
    </div>
    <div class="drawer-body"></div>
  </div>
</>

// previewDrawer.inline.ts - Logic
- window.openDrawer(url, hash, content)
- Clone content from popover
- Show drawer with animation
- Handle close events (Escape, backdrop, button)
- Clean up on navigation

// previewDrawer.scss - Styles
- Fixed position, right: 0
- Transform slide animation
- 70vw width (90vw mobile)
- Backdrop overlay
```

---

## Implementation Plan

### Phase 1: Core Component (3 files)
**Create**:
1. `quartz/components/PreviewDrawer.tsx`
2. `quartz/components/scripts/previewDrawer.inline.ts`
3. `quartz/components/styles/previewDrawer.scss`

**Test**: Manual drawer open via console

### Phase 2: Popover Integration (2 files)
**Modify**:
1. `quartz/components/scripts/popover.inline.ts` - Add button
2. `quartz/components/styles/popover.scss` - Style button

**Test**: Hover → popover → click button → drawer opens

### Phase 3: Registration (3 files)
**Modify**:
1. `quartz/components/index.ts` - Export component
2. `quartz.layout.ts` - Add to afterBody
3. `globals.d.ts` - Type window.openDrawer

**Test**: Full build and deploy

### Phase 4: Polish & Test
- Accessibility (focus trap, ARIA)
- Mobile responsive
- Hash scrolling
- Reader mode integration
- Edge cases

---

## Files Inventory

### New Files (3):
```
quartz/components/
├── PreviewDrawer.tsx                 (~40 lines)
└── scripts/
│   └── previewDrawer.inline.ts       (~120 lines)
└── styles/
    └── previewDrawer.scss            (~80 lines)
```

### Modified Files (5):
```
quartz/components/
├── index.ts                          (+1 export line)
├── scripts/
│   └── popover.inline.ts             (+10 lines - button creation)
└── styles/
    └── popover.scss                  (+15 lines - button styles)

quartz.layout.ts                      (+1 line - component registration)
globals.d.ts                          (+1 line - type definition)
```

### Total Impact:
- **Lines added**: ~270 lines
- **Lines modified**: ~5 lines
- **Files touched**: 8
- **Breaking changes**: 0
- **Dependencies**: 0 new (reuses @floating-ui/dom)

---

## Key Technical Decisions

### 1. Clone vs Re-fetch ✅
**Decision**: Clone popover content  
**Reason**: Faster, no duplicate network requests, consistent content

### 2. Global vs Per-Link Drawer ✅
**Decision**: Single global drawer instance  
**Reason**: Simpler state management, less memory, standard pattern

### 3. Drawer Width ✅
**Decision**: 70vw desktop, 90vw mobile  
**Reason**: User requirement, leaves some context visible

### 4. Mobile Behavior ⚠️
**Decision**: TBD with user  
**Options**:
- A) Drawer only works via popover (but popovers hidden on mobile)
- B) Direct link clicks open drawer on mobile (prevents navigation)
- C) Drawer not available on mobile

**Recommendation**: Option B for consistency

### 5. Close Triggers ✅
**Decision**: Escape key, backdrop click, close button, navigation  
**Reason**: Standard UX patterns, user expectation

### 6. Reader Mode Integration ✅
**Decision**: Close drawer when reader mode activates  
**Reason**: Reader mode is for focused reading, drawer is distraction

---

## Alignment with Mentor Guidelines

**Mentor's Recommendation**: Replace popovers entirely  
**Our Deviation**: Augment popovers instead  

**Justification**:
1. User explicitly wants "still show the popover preview"
2. Drawer adds functionality, doesn't remove it
3. Both can coexist without conflict

**Maintained Alignment**:
- ✅ Custom Quartz component pattern
- ✅ Reuse preview extraction pipeline
- ✅ Component structure (`.tsx` + `.inline.ts` + `.scss`)
- ✅ `afterBody` placement for global components
- ✅ SPA lifecycle integration (`nav` event, `addCleanup`)
- ✅ No core framework modifications
- ✅ Upgrade-friendly (isolated changes)

---

## Risk Assessment

### Low Risk ✅
- Component is isolated and self-contained
- No breaking changes to existing features
- Easy to disable via layout config
- Well-established patterns used throughout
- Small code footprint (~270 lines)

### Medium Risk ⚠️
- Popover modification (small but touches working code)
- Mobile UX needs clarification
- Performance with very large content (mitigated by cloning)

### High Risk ❌
- None identified

---

## Testing Strategy

### Unit Tests:
- Drawer open/close logic
- Content cloning and injection
- Hash fragment scrolling
- Event handler cleanup

### Integration Tests:
- Popover → drawer flow
- Multiple content types (HTML, images, PDFs)
- SPA navigation cleanup
- Dark mode compatibility
- Reader mode interaction

### Manual Tests:
- Desktop: hover → popover → drawer
- Tablet: responsive width
- Mobile: 90vw drawer
- Accessibility: keyboard navigation, screen readers
- Edge cases: very long content, no `.popover-hint`, circular refs

---

## Questions for User

Before creating detailed task plan:

1. **Mobile Behavior**: Should links open drawer directly on mobile? (Since popovers are hidden)
   - Option A: No drawer on mobile
   - Option B: Click link → drawer (no navigation)
   - Option C: Long-press link → drawer, click → navigate

2. **Button Text**: Confirm "Open in Side" or prefer:
   - "View Full Preview"
   - "Open Full Page"
   - "Expand →"
   - Custom?

3. **Reader Mode**: Confirm drawer should close when reader mode activates?

4. **Drawer Width**: Confirm 70vw (desktop) and 90vw (mobile)?

5. **Future Config**: Should we add config options to `quartz.config.ts` or hardcode for now?
   ```typescript
   drawer: {
     enabled: true,
     width: "70vw",
     position: "right" // or "left"
   }
   ```

---

## Success Criteria

### Must Have ✅
- [ ] Popover shows "Open in Side" button
- [ ] Button opens drawer from right
- [ ] Drawer displays cloned content correctly
- [ ] Drawer closes via Escape/backdrop/button
- [ ] Works with HTML, images, PDFs
- [ ] Hash fragments scroll to heading
- [ ] Cleans up on SPA navigation
- [ ] No console errors
- [ ] Responsive on all screen sizes
- [ ] Build succeeds

### Should Have ⭐
- [ ] Accessible (keyboard navigation, focus trap)
- [ ] Reader mode integration
- [ ] Dark mode support
- [ ] Smooth animations
- [ ] Mobile optimized

### Nice to Have 💎
- [ ] Drawer content caching
- [ ] Configurable width/position
- [ ] Drawer history (back/forward)
- [ ] Analytics tracking
- [ ] Mobile-specific UX

---

## Next Steps

1. ✅ **Investigation complete** (this document)
2. ⏳ **User review and feedback** (answer questions above)
3. ⏳ **Create detailed task plan** (`02_implement_preview_drawer.md`)
4. ⏳ **Begin Phase 1 implementation**

---

## Resources Created

1. **03_drawer_implementation_investigation.md** - Detailed technical analysis
2. **03b_drawer_architecture_diagram.md** - Visual diagrams and flows
3. **03c_implementation_summary.md** - This executive summary (you are here)

**Total Investigation**: ~3,000 lines of documentation  
**Confidence Level**: High (95%)  
**Ready for Implementation**: Yes, pending user feedback

---

## Timeline Estimate

**Phase 1** (Core Component): 2-3 hours
**Phase 2** (Integration): 1-2 hours
**Phase 3** (Registration): 30 minutes
**Phase 4** (Polish & Test): 2-3 hours

**Total**: 6-9 hours of development

**Breakdown**:
- Component structure: 1 hour
- Drawer logic: 2 hours
- Styling & animation: 1.5 hours
- Popover integration: 1 hour
- Testing: 2 hours
- Documentation: 1 hour
- Edge case fixes: 1.5 hours

---

## Conclusion

**Status**: Investigation complete, ready for task planning  
**Recommendation**: Proceed with Option A (Augment Popovers)  
**Confidence**: High - clear path forward with minimal risk  
**Blocker**: None - awaiting user confirmation on questions  

The implementation is straightforward, follows Quartz patterns, and provides the requested functionality without breaking existing features. The component will be maintainable, upgrade-friendly, and user-friendly.

🚀 **Ready to build!**
