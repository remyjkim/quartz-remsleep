import { registerEscapeHandler } from "./util"

/**
 * PreviewDrawer Script
 * 
 * Manages the lifecycle and interactions of the preview drawer component.
 * 
 * Features:
 * - Opens drawer with content cloned from popovers (no re-fetching)
 * - Handles close events (Escape key, backdrop click, close button)
 * - Manages focus for accessibility
 * - Integrates with SPA navigation lifecycle
 * - Scrolls to hash fragments within drawer content
 * 
 * Global API:
 * - window.openDrawer(url, hash, content) - Opens drawer with given content
 */

// Drawer DOM element references
let drawer: HTMLElement | null = null
let drawerBackdrop: HTMLElement | null = null
let drawerBody: HTMLElement | null = null
let drawerTitle: HTMLElement | null = null
let drawerCloseBtn: HTMLElement | null = null

// Accessibility: store last focused element to restore on close
let lastFocusedElement: HTMLElement | null = null

/**
 * Initialize drawer elements and attach event listeners
 * Called on each SPA navigation via 'nav' event
 */
function initDrawer(): void {
  drawer = document.getElementById("preview-drawer")
  drawerBackdrop = document.getElementById("drawer-backdrop")
  drawerBody = drawer?.querySelector(".drawer-body") as HTMLElement | null
  drawerTitle = drawer?.querySelector(".drawer-title") as HTMLElement | null
  drawerCloseBtn = drawer?.querySelector(".drawer-close") as HTMLElement | null

  if (!drawer || !drawerBackdrop || !drawerBody || !drawerTitle || !drawerCloseBtn) {
    console.warn("PreviewDrawer: Required elements not found")
    return
  }

  // Close button handler
  drawerCloseBtn.addEventListener("click", closeDrawer)
  window.addCleanup(() => drawerCloseBtn?.removeEventListener("click", closeDrawer))

  // Backdrop and Escape key handlers
  registerEscapeHandler(drawerBackdrop, closeDrawer)

  // Close drawer on reader mode activation (optional enhancement)
  const handleReaderModeChange = (e: CustomEventMap["readermodechange"]) => {
    if (e.detail.mode === "on") {
      closeDrawer()
    }
  }
  document.addEventListener("readermodechange", handleReaderModeChange)
  window.addCleanup(() => {
    document.removeEventListener("readermodechange", handleReaderModeChange)
  })
}

/**
 * Open the preview drawer with content
 * 
 * @param url - The URL of the previewed page
 * @param hash - Hash fragment for scrolling (e.g., "#heading")
 * @param content - DOM node containing the content to display (cloned from popover)
 */
function openDrawer(url: URL, hash: string, content: Node): void {
  if (!drawer || !drawerBody || !drawerTitle || !drawerBackdrop) {
    console.warn("PreviewDrawer: Cannot open - elements not initialized")
    return
  }

  // Store currently focused element for restoration on close
  lastFocusedElement = document.activeElement as HTMLElement

  // Clear previous content
  while (drawerBody.firstChild) {
    drawerBody.removeChild(drawerBody.firstChild)
  }

  // Set title (display pathname)
  const titleText = decodeURIComponent(url.pathname)
  drawerTitle.textContent = titleText

  // Inject content (already normalized and processed by popover)
  drawerBody.appendChild(content)

  // Show drawer with animation
  drawer.classList.add("active")
  drawerBackdrop.classList.add("active")
  drawer.setAttribute("aria-hidden", "false")

  // Prevent body scroll when drawer is open
  document.body.style.overflow = "hidden"

  // Focus management: move focus to close button
  drawerCloseBtn?.focus()

  // Handle hash fragment scrolling
  if (hash && hash.length > 1) {
    // Use requestAnimationFrame to ensure content is rendered
    requestAnimationFrame(() => {
      const targetAnchor = `#popover-internal-${hash.slice(1)}`
      const heading = drawerBody?.querySelector(targetAnchor) as HTMLElement | null
      if (heading && drawerBody) {
        // Scroll with offset for better visibility
        drawerBody.scrollTop = Math.max(0, heading.offsetTop - 12)
      }
    })
  }
}

/**
 * Close the preview drawer
 * Restores focus and cleans up state
 */
function closeDrawer(): void {
  if (!drawer || !drawerBackdrop) return

  // Hide drawer with animation
  drawer.classList.remove("active")
  drawerBackdrop.classList.remove("active")
  drawer.setAttribute("aria-hidden", "true")

  // Restore body scroll
  document.body.style.overflow = ""

  // Restore focus to last focused element (accessibility)
  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    // Use setTimeout to avoid focus issues during transition
    setTimeout(() => {
      lastFocusedElement?.focus()
      lastFocusedElement = null
    }, 100)
  }
}

/**
 * Global API: Expose openDrawer function for popover integration
 */
declare global {
  interface Window {
    openDrawer: (url: URL, hash: string, content: Node) => void
  }
}

window.openDrawer = openDrawer

/**
 * SPA Lifecycle Integration
 * Re-initialize on each navigation and close any open drawer
 */
document.addEventListener("nav", () => {
  // Close drawer when navigating to a new page
  closeDrawer()
  
  // Re-initialize elements and listeners
  initDrawer()
})
