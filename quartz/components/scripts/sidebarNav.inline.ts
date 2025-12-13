function initSidebarNav() {
  const nav = document.querySelector(".sidebar-nav")
  if (!nav) return

  const toggle = nav.querySelector(".sidebar-nav-toggle") as HTMLButtonElement
  const content = nav.querySelector(".sidebar-nav-content") as HTMLElement
  
  if (!toggle || !content) return

  let isOpen = false

  function openMenu() {
    isOpen = true
    nav.classList.add("nav-open") // Add to parent nav element
    toggle.setAttribute("aria-expanded", "true")
    // Prevent body scroll on mobile when menu is open
    document.body.classList.add("sidebar-nav-open")
  }

  function closeMenu() {
    isOpen = false
    nav.classList.remove("nav-open") // Remove from parent nav element
    toggle.setAttribute("aria-expanded", "false")
    document.body.classList.remove("sidebar-nav-open")
  }

  function toggleMenu() {
    if (isOpen) {
      closeMenu()
    } else {
      openMenu()
    }
  }

  // Toggle button click handler
  toggle.addEventListener("click", (e) => {
    e.stopPropagation()
    toggleMenu()
  })

  // Close menu when clicking a navigation link (mobile)
  const navLinks = content.querySelectorAll("a")
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      // Small delay to allow navigation to start
      setTimeout(() => closeMenu(), 100)
    })
  })

  // Close menu when clicking outside (mobile)
  document.addEventListener("click", (e) => {
    if (isOpen && !nav.contains(e.target as Node)) {
      closeMenu()
    }
  })

  // Close menu on escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen) {
      closeMenu()
    }
  })

  // Handle window resize - close menu if switching to desktop
  let resizeTimer: ReturnType<typeof setTimeout>
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      // If window is wide enough, ensure menu is closed
      if (window.innerWidth >= 768 && isOpen) {
        closeMenu()
      }
    }, 250)
  })
}

// Initialize on page load
document.addEventListener("nav", () => {
  initSidebarNav()
})

// Also run on initial page load (before SPA navigation)
window.addEventListener("load", () => {
  initSidebarNav()
})
