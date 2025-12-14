function initTagFilter() {
  const container = document.querySelector(".posts-list-with-filter")
  const filterBar = document.querySelector("[data-filter-bar]")
  const postList = document.querySelector("[data-post-list]")
  const pagination = document.querySelector("[data-pagination]")

  if (!filterBar || !postList) {
    return // Not on home page or elements not found
  }

  const filterLinks = filterBar.querySelectorAll(".filter-link")
  const postItems = Array.from(postList.querySelectorAll(".section-li"))

  // Get pagination config from data attributes
  const postsPerPage = parseInt(container?.getAttribute("data-posts-per-page") ?? "10", 10)

  // State
  let currentPage = 1
  let currentFilter = "all"
  let currentFilterType: "all" | "tag" | "category" = "all"
  let filteredPosts: Element[] = [...postItems]

  // Create maps of post items to their tags and categories
  const postTagMap = new Map<Element, Set<string>>()
  const postCategoryMap = new Map<Element, Set<string>>()

  postItems.forEach((item) => {
    // Collect tags
    const tagElements = item.querySelectorAll("a.tag-link")
    const tags = new Set<string>()
    tagElements.forEach((tagEl) => {
      const tagText = tagEl.textContent?.trim()
      if (tagText) {
        tags.add(tagText)
      }
    })
    postTagMap.set(item, tags)

    // Collect categories
    const categoryElements = item.querySelectorAll("a.category-link")
    const categories = new Set<string>()
    categoryElements.forEach((catEl) => {
      const catText = catEl.textContent?.trim()
      if (catText) {
        categories.add(catText)
      }
    })
    postCategoryMap.set(item, categories)
  })

  // Get pagination elements
  const prevBtn = pagination?.querySelector("[data-pagination-prev]") as HTMLButtonElement | null
  const nextBtn = pagination?.querySelector("[data-pagination-next]") as HTMLButtonElement | null
  const currentPageEl = pagination?.querySelector("[data-current-page]")
  const totalPagesEl = pagination?.querySelector("[data-total-pages]")

  // Filter posts by tag or category
  function filterPosts(filter: string, filterType: "all" | "tag" | "category"): Element[] {
    if (filterType === "all") {
      return [...postItems]
    }

    if (filterType === "tag") {
      return postItems.filter((item) => {
        const tags = postTagMap.get(item)
        return tags?.has(filter) ?? false
      })
    }

    if (filterType === "category") {
      return postItems.filter((item) => {
        const categories = postCategoryMap.get(item)
        return categories?.has(filter) ?? false
      })
    }

    return [...postItems]
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

  // Handle filter selection
  function handleFilter(filter: string, filterType: "all" | "tag" | "category") {
    currentFilter = filter
    currentFilterType = filterType
    currentPage = 1 // Reset to first page when filter changes
    filteredPosts = filterPosts(filter, filterType)
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
      const filter = target.getAttribute("data-filter")
      const filterType = target.getAttribute("data-filter-type") as "all" | "tag" | "category"

      if (!filter || !filterType) return

      updateActiveLink(target)
      handleFilter(filter, filterType)

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

    if (currentFilterType === "tag") {
      params.push(`tag=${currentFilter}`)
    } else if (currentFilterType === "category") {
      params.push(`category=${currentFilter}`)
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
  function parseUrlHash(): { filter: string; filterType: "all" | "tag" | "category"; page: number } {
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)

    const tag = params.get("tag")
    const category = params.get("category")

    if (tag) {
      return {
        filter: tag,
        filterType: "tag",
        page: parseInt(params.get("page") ?? "1", 10),
      }
    }

    if (category) {
      return {
        filter: category,
        filterType: "category",
        page: parseInt(params.get("page") ?? "1", 10),
      }
    }

    return {
      filter: "all",
      filterType: "all",
      page: parseInt(params.get("page") ?? "1", 10),
    }
  }

  // Initialize from URL hash
  function initFromHash() {
    const { filter, filterType, page } = parseUrlHash()

    // Set filter
    if (filterType !== "all") {
      const matchingLink = Array.from(filterLinks).find(
        (link) => link.getAttribute("data-filter") === filter && link.getAttribute("data-filter-type") === filterType,
      )
      if (matchingLink) {
        updateActiveLink(matchingLink)
        currentFilter = filter
        currentFilterType = filterType
        filteredPosts = filterPosts(filter, filterType)
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
