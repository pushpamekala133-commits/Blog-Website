// ============ STATE MANAGEMENT ============
const blogState = {
    posts: [],
    filteredPosts: [],
    currentEditId: null,
    searchQuery: '',
    selectedCategory: 'all',
    sortMethod: 'newest',
    viewMode: 'grid',
    showStats: false,
    categories: ['Technology', 'Lifestyle', 'Business', 'Travel', 'Food', 'Health', 'Education', 'Entertainment', 'Sports', 'Other']
};

// ============ DOM ELEMENTS ============
const formContainer = document.querySelector('.form-container');
const blogFeed = document.querySelector('.blog-feed');
const statsPanel = document.querySelector('.stats-panel');
const formElement = document.getElementById('blogForm');
const authorInput = document.getElementById('authorInput');
const titleInput = document.getElementById('titleInput');
const categorySelect = document.getElementById('categorySelect');
const contentInput = document.getElementById('contentInput');
const submitBtn = document.getElementById('submitBtn');
const cancelBtn = document.getElementById('cancelBtn');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const sortSelect = document.getElementById('sortSelect');
const gridViewBtn = document.getElementById('gridViewBtn');
const listViewBtn = document.getElementById('listViewBtn');
const statsToggleBtn = document.getElementById('statsToggleBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const scrollTopBtn = document.getElementById('scrollTopBtn');
const modal = document.getElementById('postModal');
const modalBackdrop = document.getElementById('modalBackdrop');
const modalClose = document.querySelector('.modal-close');
const toast = document.querySelector('.toast');

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', () => {
    loadBlogsFromStorage();
    populateCategorySelects();
    displayBlogs();
    setupEventListeners();
});

// ============ EVENT LISTENERS ============
function setupEventListeners() {
    formElement.addEventListener('submit', handleFormSubmit);
    cancelBtn.addEventListener('click', cancelEdit);
    searchInput.addEventListener('input', handleSearch);
    categoryFilter.addEventListener('change', handleCategoryFilter);
    sortSelect.addEventListener('change', handleSort);
    gridViewBtn.addEventListener('click', () => switchViewMode('grid'));
    listViewBtn.addEventListener('click', () => switchViewMode('list'));
    statsToggleBtn.addEventListener('click', toggleStats);
    clearAllBtn.addEventListener('click', handleClearAll);
    exportBtn.addEventListener('click', handleExport);
    importBtn.addEventListener('click', () => document.getElementById('importFile').click());
    document.getElementById('importFile').addEventListener('change', handleImport);
    scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    // Modal events
    modalClose.addEventListener('click', closePostModal);
    modalBackdrop.addEventListener('click', closePostModal);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closePostModal();
        }
    });

    // Show scroll button on scroll
    window.addEventListener('scroll', () => {
        scrollTopBtn.style.display = window.scrollY > 300 ? 'block' : 'none';
    });
}

// ============ POPULATE SELECTS ============
function populateCategorySelects() {
    // Category filter
    categoryFilter.innerHTML = '<option value="all">All Categories</option>';
    blogState.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });

    // Category select in form
    categorySelect.innerHTML = '';
    blogState.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
}

// ============ FORM HANDLING ============
function handleFormSubmit(e) {
    e.preventDefault();

    // Validation
    if (!authorInput.value.trim() || !titleInput.value.trim() || !contentInput.value.trim()) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    if (authorInput.value.trim().length < 2) {
        showToast('Author name must be at least 2 characters', 'error');
        return;
    }

    if (titleInput.value.trim().length < 3) {
        showToast('Title must be at least 3 characters', 'error');
        return;
    }

    if (blogState.currentEditId) {
        updateBlogPost();
    } else {
        createBlogPost();
    }
}

function createBlogPost() {
    const newPost = {
        id: Date.now(),
        title: titleInput.value.trim(),
        content: contentInput.value.trim(),
        author: authorInput.value.trim(),
        category: categorySelect.value,
        date: new Date().toISOString(),
        wordCount: contentInput.value.trim().split(/\s+/).length,
        charCount: contentInput.value.trim().length
    };

    blogState.posts.push(newPost);
    saveBlogsToStorage();
    resetForm();
    applyFilters();
    displayBlogs();
    showToast(`"${newPost.title}" added successfully!`, 'success');
}

function updateBlogPost() {
    const post = blogState.posts.find(p => p.id === blogState.currentEditId);
    if (post) {
        post.title = titleInput.value.trim();
        post.content = contentInput.value.trim();
        post.author = authorInput.value.trim();
        post.category = categorySelect.value;
        post.wordCount = contentInput.value.trim().split(/\s+/).length;
        post.charCount = contentInput.value.trim().length;

        saveBlogsToStorage();
        resetForm();
        applyFilters();
        displayBlogs();
        showToast(`"${post.title}" updated successfully!`, 'success');
    }
}

function deleteBlogPost(id) {
    const post = blogState.posts.find(p => p.id === id);
    if (!confirm(`Delete "${post.title}"?`)) return;

    blogState.posts = blogState.posts.filter(p => p.id !== id);
    saveBlogsToStorage();
    applyFilters();
    displayBlogs();
    closePostModal();
    showToast(`"${post.title}" deleted successfully!`, 'success');
}

function editBlogPost(id) {
    const post = blogState.posts.find(p => p.id === id);
    if (post) {
        authorInput.value = post.author;
        titleInput.value = post.title;
        categorySelect.value = post.category;
        contentInput.value = post.content;
        blogState.currentEditId = id;
        submitBtn.textContent = '💾 Update Post';
        submitBtn.className = 'btn btn-primary btn-block';
        cancelBtn.style.display = 'block';
        formContainer.style.background = 'rgba(16, 185, 129, 0.05)';
        formContainer.style.borderColor = 'rgba(16, 185, 129, 0.3)';
        authorInput.focus();
        closePostModal();
        showToast('Edit mode enabled', 'info');
    }
}

function resetForm() {
    formElement.reset();
    blogState.currentEditId = null;
    submitBtn.textContent = '✍️ Create Post';
    submitBtn.className = 'btn btn-primary btn-block';
    cancelBtn.style.display = 'none';
    formContainer.style.background = 'var(--card-bg)';
    formContainer.style.borderColor = 'var(--border-color)';
}

function cancelEdit() {
    resetForm();
    showToast('Edit cancelled', 'warning');
}

// ============ FILTERING & SEARCHING ============
function handleSearch(e) {
    blogState.searchQuery = e.target.value.toLowerCase();
    applyFilters();
    displayBlogs();
}

function handleCategoryFilter(e) {
    blogState.selectedCategory = e.target.value;
    applyFilters();
    displayBlogs();
}

function handleSort(e) {
    blogState.sortMethod = e.target.value;
    applyFilters();
    displayBlogs();
}

function applyFilters() {
    // Start with all posts
    let filtered = [...blogState.posts];

    // Search filter
    if (blogState.searchQuery) {
        filtered = filtered.filter(post =>
            post.title.toLowerCase().includes(blogState.searchQuery) ||
            post.content.toLowerCase().includes(blogState.searchQuery)
        );
    }

    // Category filter
    if (blogState.selectedCategory !== 'all') {
        filtered = filtered.filter(post => post.category === blogState.selectedCategory);
    }

    // Sorting
    switch (blogState.sortMethod) {
        case 'newest':
            filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'oldest':
            filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
        case 'a-z':
            filtered.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'z-a':
            filtered.sort((a, b) => b.title.localeCompare(a.title));
            break;
    }

    blogState.filteredPosts = filtered;
}

// ============ VIEW MODE & STATS ============
function switchViewMode(mode) {
    blogState.viewMode = mode;
    gridViewBtn.classList.toggle('active', mode === 'grid');
    listViewBtn.classList.toggle('active', mode === 'list');
    blogFeed.classList.toggle('grid-view', mode === 'grid');
    blogFeed.classList.toggle('list-view', mode === 'list');
    displayBlogs();
}

function toggleStats() {
    blogState.showStats = !blogState.showStats;
    statsPanel.style.display = blogState.showStats ? 'grid' : 'none';
    statsToggleBtn.classList.toggle('active', blogState.showStats);
    if (blogState.showStats) {
        updateStats();
    }
}

function updateStats() {
    const stats = calculateStats();
    
    const statHTML = `
        <div class="stat-item">
            <span class="stat-label">Total Posts</span>
            <span class="stat-value">${stats.totalPosts}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Categories</span>
            <span class="stat-value">${stats.uniqueCategories}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Total Words</span>
            <span class="stat-value">${stats.totalWords}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Total Characters</span>
            <span class="stat-value">${stats.totalCharacters}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Avg Words/Post</span>
            <span class="stat-value">${stats.avgWordsPerPost}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Most Used Category</span>
            <span class="stat-value">${stats.mostUsedCategory}</span>
        </div>
    `;
    
    statsPanel.innerHTML = statHTML;
}

function calculateStats() {
    const total = blogState.posts.length;
    if (total === 0) {
        return {
            totalPosts: 0,
            uniqueCategories: 0,
            totalWords: 0,
            totalCharacters: 0,
            avgWordsPerPost: 0,
            mostUsedCategory: 'N/A'
        };
    }

    const totalWords = blogState.posts.reduce((sum, post) => sum + post.wordCount, 0);
    const totalChars = blogState.posts.reduce((sum, post) => sum + post.charCount, 0);
    const categories = new Set(blogState.posts.map(post => post.category));
    const categoryCount = {};

    blogState.posts.forEach(post => {
        categoryCount[post.category] = (categoryCount[post.category] || 0) + 1;
    });

    const mostUsedCategory = Object.keys(categoryCount).reduce((max, cat) => 
        categoryCount[cat] > categoryCount[max] ? cat : max
    );

    return {
        totalPosts: total,
        uniqueCategories: categories.size,
        totalWords: totalWords,
        totalCharacters: totalChars,
        avgWordsPerPost: Math.round(totalWords / total),
        mostUsedCategory: mostUsedCategory
    };
}

// ============ DISPLAY BLOGS ============
function displayBlogs() {
    if (blogState.filteredPosts.length === 0) {
        blogFeed.innerHTML = '<div class="empty-state"><p>📚</p><p>No blog posts found. Start by creating your first post!</p></div>';
        blogFeed.className = 'blog-feed ' + (blogState.viewMode === 'grid' ? 'grid-view' : 'list-view');
        return;
    }

    const postsHTML = blogState.filteredPosts.map(post => `
        <div class="blog-card" data-id="${post.id}">
            <div class="blog-header">
                <span class="blog-category">${escapeHtml(post.category)}</span>
                <h3>${escapeHtml(post.title)}</h3>
                <div class="blog-meta">
                    <span>${escapeHtml(post.author)}</span>
                    <span>${formatDate(post.date)}</span>
                </div>
            </div>
            <div class="blog-body">
                <p class="blog-excerpt">${escapeHtml(post.content)}</p>
                <small style="color: var(--text-tertiary);">📊 ${post.wordCount} words • ${post.charCount} chars</small>
            </div>
            <div class="blog-footer">
                <button class="blog-action-btn btn-view" onclick="showPostModal(${post.id})">👁️ View</button>
                <button class="blog-action-btn btn-edit" onclick="editBlogPost(${post.id})">✏️ Edit</button>
                <button class="blog-action-btn btn-delete" onclick="deleteBlogPost(${post.id})">🗑️ Delete</button>
            </div>
        </div>
    `).join('');

    blogFeed.innerHTML = postsHTML;
    blogFeed.className = 'blog-feed ' + (blogState.viewMode === 'grid' ? 'grid-view' : 'list-view');
}

// ============ MODAL FUNCTIONS ============
function showPostModal(id) {
    const post = blogState.posts.find(p => p.id === id);
    if (!post) return;

    const modalContent = document.querySelector('.modal-body');
    const modalBodyContent = `
        <button class="modal-close">✕</button>
        <h2>${escapeHtml(post.title)}</h2>
        <span class="blog-category">${escapeHtml(post.category)}</span>
        <div class="modal-meta">
            <span><strong>Author</strong>${escapeHtml(post.author)}</span>
            <span><strong>Date</strong>${formatDate(post.date)}</span>
            <span><strong>Words</strong>${post.wordCount}</span>
            <span><strong>Characters</strong>${post.charCount}</span>
        </div>
        <p class="modal-content-text">${escapeHtml(post.content)}</p>
        <div class="modal-actions">
            <button class="btn btn-secondary" onclick="editBlogPost(${post.id})">✏️ Edit</button>
            <button class="btn btn-danger" onclick="deleteBlogPost(${post.id})">🗑️ Delete</button>
            <button class="btn btn-secondary" onclick="copyPostContent(${post.id})">📋 Copy</button>
        </div>
    `;

    modalContent.innerHTML = modalBodyContent;
    document.querySelector('.modal-close').addEventListener('click', closePostModal);
    
    modal.classList.add('active');
    modalBackdrop.classList.add('active');
}

function closePostModal() {
    modal.classList.remove('active');
    modalBackdrop.classList.remove('active');
}

function copyPostContent(id) {
    const post = blogState.posts.find(p => p.id === id);
    if (post) {
        const text = `${post.title}\n\nBy: ${post.author}\nCategory: ${post.category}\nDate: ${formatDate(post.date)}\n\n${post.content}`;
        navigator.clipboard.writeText(text).then(() => {
            showToast('Post copied to clipboard!', 'success');
        });
    }
}

// ============ EXPORT & IMPORT ============
function handleClearAll() {
    if (confirm('Are you sure you want to delete ALL posts? This cannot be undone.')) {
        blogState.posts = [];
        blogState.filteredPosts = [];
        saveBlogsToStorage();
        resetForm();
        displayBlogs();
        showToast('All posts deleted', 'success');
    }
}

function handleExport() {
    if (blogState.posts.length === 0) {
        showToast('No posts to export', 'warning');
        return;
    }

    const dataStr = JSON.stringify(blogState.posts, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `blog-posts-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Exported ${blogState.posts.length} posts!`, 'success');
}

function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const importedPosts = JSON.parse(event.target.result);

            if (!Array.isArray(importedPosts)) {
                throw new Error('Invalid format');
            }

            // Validate posts structure
            const validPosts = importedPosts.filter(post =>
                post.id && post.title && post.content && post.author && post.category && post.date
            );

            if (validPosts.length === 0) {
                showToast('No valid posts found in file', 'error');
                return;
            }

            // Merge with existing posts (avoid duplicates by ID)
            const existingIds = new Set(blogState.posts.map(p => p.id));
            const newPosts = validPosts.filter(p => !existingIds.has(p.id));

            blogState.posts = [...blogState.posts, ...newPosts];
            saveBlogsToStorage();
            applyFilters();
            displayBlogs();

            showToast(`Imported ${newPosts.length} new posts!`, 'success');
        } catch (error) {
            showToast('Error importing file: Invalid JSON format', 'error');
        }
    };

    reader.readAsText(file);
    e.target.value = '';
}

// ============ STORAGE FUNCTIONS ============
function saveBlogsToStorage() {
    localStorage.setItem('blogPosts', JSON.stringify(blogState.posts));
}

function loadBlogsFromStorage() {
    const stored = localStorage.getItem('blogPosts');
    if (stored) {
        try {
            blogState.posts = JSON.parse(stored);
        } catch (error) {
            console.error('Error loading posts:', error);
            blogState.posts = [];
        }
    }
}

// ============ UTILITY FUNCTIONS ============
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    } else if (date.getFullYear() === today.getFullYear()) {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
    }
}

function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
