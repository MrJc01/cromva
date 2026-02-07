/**
 * Category Picker Component
 * Dropdown with search for selecting/creating note categories
 */

// Default categories
const defaultCategories = [
    { id: 'sistema', name: 'Sistema', color: 'blue' },
    { id: 'trabalho', name: 'Trabalho', color: 'emerald' },
    { id: 'pessoal', name: 'Pessoal', color: 'purple' },
    { id: 'ideias', name: 'Ideias', color: 'amber' },
    { id: 'projetos', name: 'Projetos', color: 'pink' },
    { id: 'local', name: 'Local', color: 'teal' }
];

// Load custom categories from localStorage
function getCategories() {
    const custom = JSON.parse(localStorage.getItem('cromvaCategories') || '[]');
    return [...defaultCategories, ...custom];
}

function saveCategories(categories) {
    // Only save custom categories (not defaults)
    const custom = categories.filter(c => !defaultCategories.find(d => d.id === c.id));
    localStorage.setItem('cromvaCategories', JSON.stringify(custom));
}

// Toggle dropdown visibility
function toggleCategoryDropdown() {
    const dropdown = document.getElementById('category-dropdown');
    const isHidden = dropdown.classList.contains('hidden');

    if (isHidden) {
        dropdown.classList.remove('hidden');
        renderCategoryList();
        document.getElementById('category-search').value = '';
        document.getElementById('category-search').focus();

        // Close on outside click
        setTimeout(() => {
            document.addEventListener('click', closeCategoryDropdownOnOutside);
        }, 10);
    } else {
        dropdown.classList.add('hidden');
        document.removeEventListener('click', closeCategoryDropdownOnOutside);
    }
}

function closeCategoryDropdownOnOutside(e) {
    const container = document.getElementById('category-dropdown-container');
    if (!container.contains(e.target)) {
        document.getElementById('category-dropdown').classList.add('hidden');
        document.removeEventListener('click', closeCategoryDropdownOnOutside);
    }
}

// Render category list
function renderCategoryList(filter = '') {
    const list = document.getElementById('category-list');
    if (!list) return;

    const categories = getCategories();
    const filtered = filter
        ? categories.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()))
        : categories;

    // Get current note's category
    const currentNote = window.notes?.find(n => n.id === window.currentNoteId);
    const currentCategory = currentNote?.category || 'Sistema';

    list.innerHTML = filtered.map(cat => {
        const isSelected = cat.name === currentCategory;
        const colorClasses = {
            'blue': 'bg-blue-500',
            'emerald': 'bg-emerald-500',
            'purple': 'bg-purple-500',
            'amber': 'bg-amber-500',
            'pink': 'bg-pink-500',
            'teal': 'bg-teal-500',
            'red': 'bg-red-500',
            'gray': 'bg-zinc-500'
        };
        const dotColor = colorClasses[cat.color] || 'bg-zinc-500';

        return `
            <button onclick="selectCategory('${cat.name}')" 
                class="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${isSelected ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}">
                <span class="w-2 h-2 rounded-full ${dotColor}"></span>
                <span class="flex-1 text-left">${cat.name}</span>
                ${isSelected ? '<i data-lucide="check" class="w-3 h-3 text-emerald-500"></i>' : ''}
            </button>
        `;
    }).join('');

    // Show "Create new" button if filter doesn't match any existing
    const btnCreate = document.getElementById('btn-create-category');
    const nameSpan = document.getElementById('new-category-name');

    if (filter && !categories.find(c => c.name.toLowerCase() === filter.toLowerCase())) {
        btnCreate.classList.remove('hidden');
        nameSpan.textContent = filter;
    } else {
        btnCreate.classList.add('hidden');
    }

    // Refresh icons
    if (window.lucide) lucide.createIcons();
}

// Filter categories on search input
function filterCategories(value) {
    renderCategoryList(value);
}

// Select a category
function selectCategory(categoryName) {
    if (!window.currentNoteId) return;

    const noteIndex = window.notes.findIndex(n => n.id === window.currentNoteId);
    if (noteIndex > -1) {
        window.notes[noteIndex].category = categoryName;

        // Update UI
        document.getElementById('current-category-label').textContent = categoryName;

        // Close dropdown
        document.getElementById('category-dropdown').classList.add('hidden');
        document.removeEventListener('click', closeCategoryDropdownOnOutside);

        // Save
        if (typeof saveData === 'function') saveData();

        showToast(`Categoria alterada para "${categoryName}"`);
    }
}

// Create new category
function createNewCategory() {
    const input = document.getElementById('category-search');
    const name = input.value.trim();

    if (!name) return;

    // Generate random color
    const colors = ['blue', 'emerald', 'purple', 'amber', 'pink', 'teal', 'red'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    // Add to categories
    const categories = getCategories();
    const newCat = {
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name: name,
        color: color
    };

    categories.push(newCat);
    saveCategories(categories);

    // Select the new category
    selectCategory(name);

    showToast(`Categoria "${name}" criada!`);
}

// Update category label when opening a note
function updateCategoryLabel() {
    const note = window.notes?.find(n => n.id === window.currentNoteId);
    const label = document.getElementById('current-category-label');
    if (label && note) {
        label.textContent = note.category || 'Sistema';
    }
}

// Export for use
window.toggleCategoryDropdown = toggleCategoryDropdown;
window.filterCategories = filterCategories;
window.selectCategory = selectCategory;
window.createNewCategory = createNewCategory;
window.updateCategoryLabel = updateCategoryLabel;

console.log('[CategoryPicker] Initialized');
