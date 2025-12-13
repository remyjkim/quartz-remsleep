function initTagFilter() {
  const filterBar = document.querySelector("[data-tag-filter]")
  const postList = document.querySelector("[data-post-list]")

  if (!filterBar || !postList) {
    return // Not on home page or elements not found
  }

  const filterLinks = filterBar.querySelectorAll(".tag-filter-link")
  const postItems = postList.querySelectorAll(".section-li")

  // Create a map of post items to their tags
  const postTagMap = new Map<Element, Set<string>>()

  postItems.forEach((item) => {
    const tagElements = item.querySelectorAll(".tag-link")
    const tags = new Set<string>()

    tagElements.forEach((tagEl) => {
      const tagText = tagEl.textContent?.trim()
      if (tagText) {
        tags.add(tagText)
      }
    })

    postTagMap.set(item, tags)
  })

  // Filter function
  function filterPosts(selectedTag: string) {
    if (selectedTag === "all") {
      // Show all posts
      postItems.forEach((item) => {
        ;(item as HTMLElement).style.display = ""
      })
    } else {
      // Filter by tag
      postItems.forEach((item) => {
        const tags = postTagMap.get(item)
        const shouldShow = tags?.has(selectedTag) ?? false
        ;(item as HTMLElement).style.display = shouldShow ? "" : "none"
      })
    }
  }

  // Update active state
  function updateActiveLink(targetLink: Element) {
    filterLinks.forEach((link) => {
      link.classList.remove("active")
    })
    targetLink.classList.add("active")
  }

  // Attach click handlers
  filterLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault()
      const target = e.currentTarget as HTMLElement
      const selectedTag = target.getAttribute("data-tag")

      if (!selectedTag) return

      updateActiveLink(target)
      filterPosts(selectedTag)

      // Update URL hash for shareable links
      if (selectedTag === "all") {
        window.history.replaceState(null, "", window.location.pathname)
      } else {
        window.history.replaceState(null, "", `${window.location.pathname}#tag=${selectedTag}`)
      }
    })
  })

  // Initialize from URL hash on page load
  const hash = window.location.hash
  if (hash.startsWith("#tag=")) {
    const tagFromHash = hash.substring(5)
    const matchingLink = Array.from(filterLinks).find(
      (link) => link.getAttribute("data-tag") === tagFromHash,
    )

    if (matchingLink) {
      updateActiveLink(matchingLink)
      filterPosts(tagFromHash)
    }
  }
}

// Initialize on page load
document.addEventListener("nav", () => {
  initTagFilter()
})

// Also run on initial page load (before SPA navigation)
window.addEventListener("load", () => {
  initTagFilter()
})
