// Base URL for API calls - adjust to match your backend port
const API_BASE_URL = 'http://localhost:8080';

// Global variables
let albums = [];
let stores = [];
let currentDeleteId = null;

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadAlbums();
    loadStores();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Add Album Modal
    const addAlbumBtn = document.getElementById('addAlbumBtn');
    const addAlbumModal = document.getElementById('addAlbumModal');
    const addAlbumForm = document.getElementById('addAlbumForm');

    addAlbumBtn.addEventListener('click', () => openModal('addAlbumModal'));
    addAlbumForm.addEventListener('submit', handleAddAlbum);

    // Edit Album Form
    const editAlbumForm = document.getElementById('editAlbumForm');
    editAlbumForm.addEventListener('submit', handleEditAlbum);

    // Delete confirmation
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    confirmDeleteBtn.addEventListener('click', handleDeleteAlbum);

    // Close modals when clicking X or outside
    const closeButtons = document.querySelectorAll('.close');
    const modals = document.querySelectorAll('.modal');

    closeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            closeModal(modal.id);
        });
    });

    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
}

// Load all albums from backend
async function loadAlbums() {
    try {
        const response = await fetch(`${API_BASE_URL}/albums/all`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        albums = await response.json();
        displayAlbums();
    } catch (error) {
        console.error('Error loading albums:', error);
        showError('Kunne ikke indlæse albums. Kontroller at backend kører.');
    }
}

// Load all stores from backend
async function loadStores() {
    try {
        // Since there's no specific endpoint for all stores, we'll need to add one
        // For now, we'll fetch stores through store details if we have IDs
        // This is a workaround - ideally you should add a GET /stores/all endpoint
        const storeIds = [1, 2, 3]; // Based on your InitData
        const storePromises = storeIds.map(id =>
            fetch(`${API_BASE_URL}/stores/details/${id}`)
                .then(response => response.ok ? response.json() : null)
                .catch(() => null)
        );

        const storeResults = await Promise.all(storePromises);
        stores = storeResults.filter(store => store !== null);

        populateStoreDropdowns();
    } catch (error) {
        console.error('Error loading stores:', error);
        showError('Kunne ikke indlæse butikker.');
    }
}

// Display albums in table
function displayAlbums() {
    const tableBody = document.getElementById('albumsTableBody');

    if (albums.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="loading">Ingen albums fundet</td></tr>';
        return;
    }

    tableBody.innerHTML = albums.map(album => `
        <tr>
            <td>${album.title}</td>
            <td>${album.genre}</td>
            <td>${album.artist}</td>
            <td>
                <span class="${album.available ? 'availability-yes' : 'availability-no'}">
                    ${album.available ? 'Ja' : 'Nej'}
                </span>
            </td>
            <td>
                ${album.store ?
        `<span class="store-name" onclick="showStoreDetails(${album.store.id})">${album.store.name}</span>`
        : 'Ingen butik'}
            </td>
            <td>
                <button class="action-btn edit-btn" onclick="openEditModal(${album.id})">Rediger</button>
                <button class="action-btn delete-btn" onclick="openDeleteModal(${album.id})">Slet</button>
            </td>
        </tr>
    `).join('');
}

// Populate store dropdowns
function populateStoreDropdowns() {
    const addStoreSelect = document.getElementById('storeSelect');
    const editStoreSelect = document.getElementById('editStoreSelect');

    const storeOptions = stores.map(store =>
        `<option value="${store.id}">${store.name}</option>`
    ).join('');

    addStoreSelect.innerHTML = '<option value="">Vælg butik...</option>' + storeOptions;
    editStoreSelect.innerHTML = '<option value="">Vælg butik...</option>' + storeOptions;
}

// Handle adding new album
async function handleAddAlbum(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const storeId = formData.get('storeSelect');

    if (!storeId) {
        showError('Vælg venligst en butik');
        return;
    }

    const albumData = {
        title: formData.get('title'),
        genre: formData.get('genre'),
        artist: formData.get('artist'),
        available: formData.get('available') === 'true',
        store: { id: parseInt(storeId) }
    };

    try {
        const response = await fetch(`${API_BASE_URL}/albums/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(albumData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const newAlbum = await response.json();
        albums.push(newAlbum);
        displayAlbums();
        closeModal('addAlbumModal');
        showSuccess('Album tilføjet succesfuldt!');
        e.target.reset();
    } catch (error) {
        console.error('Error adding album:', error);
        showError('Kunne ikke tilføje album. Prøv igen.');
    }
}

// Open edit modal with album data
function openEditModal(albumId) {
    const album = albums.find(a => a.id === albumId);
    if (!album) return;

    document.getElementById('editAlbumId').value = album.id;
    document.getElementById('editTitle').value = album.title;
    document.getElementById('editGenre').value = album.genre;
    document.getElementById('editArtist').value = album.artist;
    document.getElementById('editAvailable').value = album.available.toString();
    document.getElementById('editStoreSelect').value = album.store ? album.store.id : '';

    openModal('editAlbumModal');
}

// Handle editing album
async function handleEditAlbum(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const albumId = formData.get('editAlbumId');
    const storeId = formData.get('editStoreSelect');

    if (!storeId) {
        showError('Vælg venligst en butik');
        return;
    }

    const albumData = {
        title: formData.get('editTitle'),
        genre: formData.get('editGenre'),
        artist: formData.get('editArtist'),
        available: formData.get('editAvailable') === 'true',
        store: { id: parseInt(storeId) }
    };

    try {
        const response = await fetch(`${API_BASE_URL}/albums/update/${albumId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(albumData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const updatedAlbum = await response.json();
        const index = albums.findIndex(a => a.id == albumId);
        if (index !== -1) {
            albums[index] = updatedAlbum;
        }

        displayAlbums();
        closeModal('editAlbumModal');
        showSuccess('Album opdateret succesfuldt!');
    } catch (error) {
        console.error('Error updating album:', error);
        showError('Kunne ikke opdatere album. Prøv igen.');
    }
}

// Open delete confirmation modal
function openDeleteModal(albumId) {
    currentDeleteId = albumId;
    openModal('deleteModal');
}

// Handle deleting album
async function handleDeleteAlbum() {
    if (!currentDeleteId) return;

    try {
        const response = await fetch(`${API_BASE_URL}/albums/delete/${currentDeleteId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        albums = albums.filter(a => a.id !== currentDeleteId);
        displayAlbums();
        closeModal('deleteModal');
        showSuccess('Album slettet succesfuldt!');
        currentDeleteId = null;

        // Clear store details if showing details for deleted album's store
        const storeDetailsDiv = document.getElementById('storeDetails');
        if (storeDetailsDiv.innerHTML.includes('Albums i denne butik')) {
            storeDetailsDiv.innerHTML = '<p>Klik på en butiks navn i tabellen for at se detaljer</p>';
        }
    } catch (error) {
        console.error('Error deleting album:', error);
        showError('Kunne ikke slette album. Prøv igen.');
    }
}

// Show store details when store name is clicked
async function showStoreDetails(storeId) {
    try {
        const response = await fetch(`${API_BASE_URL}/stores/details/${storeId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const store = await response.json();
        displayStoreDetails(store);
    } catch (error) {
        console.error('Error loading store details:', error);
        showError('Kunne ikke indlæse butiksdetaljer.');
    }
}

// Display store details
function displayStoreDetails(store) {
    const storeDetailsDiv = document.getElementById('storeDetails');

    const albumsList = store.albums && store.albums.length > 0
        ? store.albums.map(album => `
            <div class="album-item">
                <strong>${album.title}</strong> af ${album.artist} 
                <span class="${album.available ? 'availability-yes' : 'availability-no'}">
                    (${album.available ? 'På lager' : 'Ikke på lager'})
                </span>
            </div>
          `).join('')
        : '<p>Ingen albums i denne butik</p>';

    storeDetailsDiv.innerHTML = `
        <div class="store-info">
            <h3>📍 ${store.name}</h3>
            <p><strong>Adresse:</strong> ${store.street}</p>
            <p><strong>By:</strong> ${store.city}</p>
            <p><strong>Postnummer:</strong> ${store.zip}</p>
        </div>
        <div class="store-albums">
            <h4>🎵 Albums i denne butik:</h4>
            ${albumsList}
        </div>
    `;
}

// Modal utility functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Restore scrolling
}

// Message utility functions
function showError(message) {
    removeExistingMessages();
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.querySelector('.container').insertBefore(errorDiv, document.querySelector('main'));

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

function showSuccess(message) {
    removeExistingMessages();
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    document.querySelector('.container').insertBefore(successDiv, document.querySelector('main'));

    // Auto remove after 3 seconds
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.parentNode.removeChild(successDiv);
        }
    }, 3000);
}

function removeExistingMessages() {
    const existingMessages = document.querySelectorAll('.error-message, .success-message');
    existingMessages.forEach(msg => {
        if (msg.parentNode) {
            msg.parentNode.removeChild(msg);
        }
    });
}