function initTagFilter() {
  const container = document.querySelector(".posts-list-with-filter")
  const filterBar = document.querySelector("[data-tag-filter]")
  const postList = document.querySelector("[data-post-list]")
  const pagination = document.querySelector("[data-pagination]")

  if (!filterBar || !postList) {
    return // Not on home page or elements not found
  }

  const filterLinks = filterBar.querySelectorAll(".tag-filter-link")
  const postItems = Array.from(postList.querySelectorAll(".section-li"))

  // Get pagination config from data attributes
  const postsPerPage = parseInt(container?.getAttribute("data-posts-per-page") ?? "10", 10)

  // State
  let currentPage = 1
  let currentTag = "all"
  let filteredPosts: Element[] = [...postItems]

  // Create a map of post items to their tags
  const postTagMap = new Map<Element, Set<string>>()

  postItems.forEach((item) => {
    const tagElements = item.querySelectorAll("a.tag-link")
    const tags = new Set<string>()

    tagElements.forEach((tagEl) => {
      const tagText = tagEl.textContent?.trim()
      if (tagText) {
        tags.add(tagText)
      }
    })

    postTagMap.set(item, tags)
  })

  // Get pagination elements
  const prevBtn = pagination?.querySelector("[data-pagination-prev]") as HTMLButtonElement | null
  const nextBtn = pagination?.querySelector("[data-pagination-next]") as HTMLButtonElement | null
  const currentPageEl = pagination?.querySelector("[data-current-page]")
  const totalPagesEl = pagination?.querySelector("[data-total-pages]")

  // Filter posts by tag
  function filterByTag(tag: string): Element[] {
    if (tag === "all") {
      return [...postItems]
    }
    return postItems.filter((item) => {
      const tags = postTagMap.get(item)
      return tags?.has(tag) ?? false
    })
  }

  // Calculate total pages for current filter
  function getTotalPages(): number {
    return Math.ceil(filteredPosts.length / postsPerPage)
  }

  // Update pagination UI
  function updatePaginationUI() {
    if (!pagination) return

    const totalPages = getTotalPages()

    // Update page info
    if (currentPageEl) {
      currentPageEl.textContent = String(currentPage)
    }
    if (totalPagesEl) {
      totalPagesEl.textContent = String(totalPages)
    }

    // Update button states
    if (prevBtn) {
      prevBtn.disabled = currentPage <= 1
    }
    if (nextBtn) {
      nextBtn.disabled = currentPage >= totalPages
    }

    // Show/hide pagination based on total pages
    if (totalPages <= 1) {
      pagination.classList.add("hidden")
    } else {
      pagination.classList.remove("hidden")
    }
  }

  // Display posts for current page
  function displayCurrentPage() {
    const totalPages = getTotalPages()
    const startIndex = (currentPage - 1) * postsPerPage
    const endIndex = startIndex + postsPerPage

    // Hide all posts first
    postItems.forEach((item) => {
      ;(item as HTMLElement).style.display = "none"
    })

    // Show only posts for current page within filtered set
    filteredPosts.slice(startIndex, endIndex).forEach((item) => {
      ;(item as HTMLElement).style.display = ""
    })

    updatePaginationUI()
  }

  // Handle tag filter
  function handleTagFilter(selectedTag: string) {
    currentTag = selectedTag
    currentPage = 1 // Reset to first page when filter changes
    filteredPosts = filterByTag(selectedTag)
    displayCurrentPage()
  }

  // Update active link state
  function updateActiveLink(targetLink: Element) {
    filterLinks.forEach((link) => {
      link.classList.remove("active")
    })
    targetLink.classList.add("active")
  }

  // Attach click handlers to filter links
  filterLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault()
      const target = e.currentTarget as HTMLElement
      const selectedTag = target.getAttribute("data-tag")

      if (!selectedTag) return

      updateActiveLink(target)
      handleTagFilter(selectedTag)

      // Update URL hash for shareable links
      updateUrlHash()
    })
  })

  // Attach pagination handlers
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--
        displayCurrentPage()
        updateUrlHash()
        scrollToPostsSection()
      }
    })
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (currentPage < getTotalPages()) {
        currentPage++
        displayCurrentPage()
        updateUrlHash()
        scrollToPostsSection()
      }
    })
  }

  // Update URL hash with current state
  function updateUrlHash() {
    const params: string[] = []

    if (currentTag !== "all") {
      params.push(`tag=${currentTag}`)
    }
    if (currentPage > 1) {
      params.push(`page=${currentPage}`)
    }

    if (params.length > 0) {
      window.history.replaceState(null, "", `${window.location.pathname}#${params.join("&")}`)
    } else {
      window.history.replaceState(null, "", window.location.pathname)
    }
  }

  // Scroll to posts section after pagination
  function scrollToPostsSection() {
    const postsHeading = document.querySelector(".posts-heading")
    if (postsHeading) {
      postsHeading.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  // Parse URL hash for state
  function parseUrlHash(): { tag: string; page: number } {
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)

    return {
      tag: params.get("tag") ?? "all",
      page: parseInt(params.get("page") ?? "1", 10),
    }
  }

  // Initialize from URL hash
  function initFromHash() {
    const { tag, page } = parseUrlHash()

    // Set tag filter
    if (tag !== "all") {
      const matchingLink = Array.from(filterLinks).find(
        (link) => link.getAttribute("data-tag") === tag,
      )
      if (matchingLink) {
        updateActiveLink(matchingLink)
        currentTag = tag
        filteredPosts = filterByTag(tag)
      }
    }

    // Set page (validate it's within range)
    const totalPages = getTotalPages()
    currentPage = Math.max(1, Math.min(page, totalPages))

    displayCurrentPage()
  }

  // Initialize
  initFromHash()
}

// Initialize on page load
document.addEventListener("nav", () => {
  initTagFilter()
})

// Also run on initial page load (before SPA navigation)
window.addEventListener("load", () => {
  initTagFilter()
})
