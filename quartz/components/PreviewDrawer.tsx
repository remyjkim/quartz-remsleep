// @ts-ignore
import drawerScript from "./scripts/previewDrawer.inline"
import drawerStyle from "./styles/previewDrawer.scss"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

/**
 * PreviewDrawer Component
 * 
 * Provides a right-side drawer (70% width) for displaying full previews of linked content.
 * Works in conjunction with the popover system - users can click "Open in Side" button
 * in popovers to open the full content in this drawer.
 * 
 * Architecture:
 * - Single global instance (singleton pattern)
 * - Content is cloned from popovers (no duplicate fetching)
 * - Integrates with SPA lifecycle (closes on navigation)
 * - Accessible (Escape key, backdrop click, close button)
 * 
 * @example
 * // In quartz.layout.ts
 * afterBody: [
 *   Component.Graph(),
 *   Component.PreviewDrawer(),
 * ]
 */
const PreviewDrawer: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
  return (
    <>
      {/* Backdrop overlay - clicking closes drawer */}
      <div 
        id="drawer-backdrop" 
        class="drawer-backdrop"
        role="presentation"
        aria-hidden="true"
      />
      
      {/* Main drawer container */}
      <aside
        id="preview-drawer"
        class="preview-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        aria-hidden="true"
      >
        {/* Header with close button and title */}
        <div class="drawer-header">
          <h3 id="drawer-title" class="drawer-title"></h3>
          <button
            class="drawer-close"
            aria-label="Close preview drawer"
            type="button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Scrollable content area */}
        <div class="drawer-body" tabIndex={0}></div>
      </aside>
    </>
  )
}

PreviewDrawer.afterDOMLoaded = drawerScript
PreviewDrawer.css = drawerStyle

export default (() => PreviewDrawer) satisfies QuartzComponentConstructor
