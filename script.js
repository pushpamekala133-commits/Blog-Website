// ============ STATE MANAGEMENT ============
const blogState = {
    posts: [],
    currentEditId: null,
    searchQuery: '',
    selectedCategory: '',
    sortMethod: 'newest'
};

// ============ DOM ELEMENTS ============
const formElement = document.getElementById('blogForm');
const authorInput = document.getElementById('author');
const titleInput = document.getElementById('title');
const categorySelect = document.getElementById('category');
const contentInput = document.getElementById('content');
const cancelBtn = document.getElementById('cancelEditBtn');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const sortSelect = document.getElementById('sortBy');
const clearAllBtn = document.getElementById('clearAllBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const scrollTopBtn = document.getElementById('scrollTopBtn');
const blogFeed = document.getElementById('blogFeed');

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', () => {
    loadBlogsFromStorage();
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
    clearAllBtn.addEventListener('click', handleClearAll);
    exportBtn.addEventListener('click', handleExport);
    importBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = handleImport;
        input.click();
    });
    scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    window.addEventListener('scroll', () => {
        scrollTopBtn.style.display = window.scrollY > 300 ? 'block' : 'none';
    });
}



// ============ FORM HANDLING ============
function handleFormSubmit(e) {
    e.preventDefault();

    if (!authorInput.value.trim() || !titleInput.value.trim() || !contentInput.value.trim() || !categorySelect.value) {
        alert('Please fill in all fields');
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
    displayBlogs();
    alert('Post created successfully!');
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
        displayBlogs();
        alert('Post updated successfully!');
    }
}

function deleteBlogPost(id) {
    const post = blogState.posts.find(p => p.id === id);
    if (!confirm(`Delete "${post.title}"?`)) return;

    blogState.posts = blogState.posts.filter(p => p.id !== id);
    saveBlogsToStorage();
    displayBlogs();
}

function editBlogPost(id) {
    const post = blogState.posts.find(p => p.id === id);
    if (post) {
        authorInput.value = post.author;
        titleInput.value = post.title;
        categorySelect.value = post.category;
        contentInput.value = post.content;
        blogState.currentEditId = id;
        document.querySelector('#blogForm button[type="submit"]').textContent = '✏️ Update Post';
        cancelBtn.style.display = 'block';
        document.getElementById('formTitle').textContent = 'Edit Blog Post';
        authorInput.focus();
    }
}

function resetForm() {
    formElement.reset();
    blogState.currentEditId = null;
    document.querySelector('#blogForm button[type="submit"]').textContent = '📝 Publish Post';
    cancelBtn.style.display = 'none';
    document.getElementById('formTitle').textContent = 'Create New Blog Post';
}

function cancelEdit() {
    resetForm();
}

// ============ FILTERING & SEARCHING ============
function handleSearch(e) {
    blogState.searchQuery = e.target.value.toLowerCase();
    displayBlogs();
}

function handleCategoryFilter(e) {
    blogState.selectedCategory = e.target.value;
    displayBlogs();
}

function handleSort(e) {
    blogState.sortMethod = e.target.value;
    displayBlogs();
}

function getFilteredPosts() {
    let filtered = [...blogState.posts];

    if (blogState.searchQuery) {
        filtered = filtered.filter(post =>
            post.title.toLowerCase().includes(blogState.searchQuery) ||
            post.content.toLowerCase().includes(blogState.searchQuery) ||
            post.author.toLowerCase().includes(blogState.searchQuery)
        );
    }

    if (blogState.selectedCategory) {
        filtered = filtered.filter(post => post.category === blogState.selectedCategory);
    }

    switch (blogState.sortMethod) {
        case 'newest':
            filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'oldest':
            filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
        case 'titleAZ':
            filtered.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'titleZA':
            filtered.sort((a, b) => b.title.localeCompare(a.title));
            break;
    }
    return filtered;
}

// ============ DISPLAY BLOGS ============
function displayBlogs() {
    const filtered = getFilteredPosts();

    if (filtered.length === 0) {
        blogFeed.innerHTML = '<div class="empty-state"><p>📭 No blog posts yet</p><p>Start by creating your first post!</p></div>';
        return;
    }

    const postsHTML = filtered.map(post => `
        <div class="blog-card">
            <div class="blog-header">
                <span class="blog-category">${post.category}</span>
                <h3>${post.title}</h3>
                <div class="blog-meta">
                    <span>👤 ${post.author}</span>
                    <span>📅 ${formatDate(post.date)}</span>
                </div>
            </div>
            <div class="blog-body">
                <p>${post.content}</p>
                <small>📊 ${post.wordCount} words • ${post.charCount} characters</small>
            </div>
            <div class="blog-footer">
                <button class="btn btn-secondary" onclick="editBlogPost(${post.id})">✏️ Edit</button>
                <button class="btn btn-danger" onclick="deleteBlogPost(${post.id})">🗑️ Delete</button>
            </div>
        </div>
    `).join('');

    blogFeed.innerHTML = postsHTML;
}

// ============ EXPORT & IMPORT ============
function handleClearAll() {
    if (confirm('Are you sure you want to delete ALL posts? This cannot be undone.')) {
        blogState.posts = [];
        saveBlogsToStorage();
        resetForm();
        displayBlogs();
        alert('All posts deleted');
    }
}

function handleExport() {
    if (blogState.posts.length === 0) {
        alert('No posts to export');
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
    alert(`Exported ${blogState.posts.length} posts!`);
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

            const validPosts = importedPosts.filter(post =>
                post.id && post.title && post.content && post.author && post.category && post.date
            );

            if (validPosts.length === 0) {
                alert('No valid posts found in file');
                return;
            }

            const existingIds = new Set(blogState.posts.map(p => p.id));
            const newPosts = validPosts.filter(p => !existingIds.has(p.id));

            blogState.posts = [...blogState.posts, ...newPosts];
            saveBlogsToStorage();
            displayBlogs();
            alert(`Imported ${newPosts.length} new posts!`);
        } catch (error) {
            alert('Error importing file: Invalid JSON format');
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
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
