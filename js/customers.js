// Base URL for API calls - adjust to match your backend port
const API_BASE_URL = 'http://localhost:8080';

// Global variables
let customers = [];
let albums = [];
let currentCustomer = null;
let currentReserveAlbum = null;
let currentCancelReservation = null;

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadCustomers();
    loadAllAlbums();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    const searchBtn = document.getElementById('searchBtn');
    const albumSearch = document.getElementById('albumSearch');

    searchBtn.addEventListener('click', handleSearch);
    albumSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // Modal close events
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

    // Confirmation buttons
    document.getElementById('confirmReserveBtn').addEventListener('click', handleConfirmReservation);
    document.getElementById('confirmCancelBtn').addEventListener('click', handleConfirmCancellation);
}

// Load all customers from backend
async function loadCustomers() {
    try {
        const response = await fetch(`${API_BASE_URL}/customers/all`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        customers = await response.json();
        displayCustomers();
    } catch (error) {
        console.error('Error loading customers:', error);
        showError('Kunne ikke indlæse kunder. Kontroller at backend kører.');
    }
}

// Load all albums for search functionality
async function loadAllAlbums() {
    try {
        const response = await fetch(`${API_BASE_URL}/albums/all`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        albums = await response.json();
    } catch (error) {
        console.error('Error loading albums:', error);
        showError('Kunne ikke indlæse albums.');
    }
}

// Display customers in the list
function displayCustomers() {
    const customersList = document.getElementById('customersList');

    if (customers.length === 0) {
        customersList.innerHTML = '<div class="empty-state">Ingen kunder fundet</div>';
        return;
    }

    customersList.innerHTML = customers.map(customer => `
        <div class="customer-item" onclick="selectCustomer(${customer.id})">
            <div class="customer-name">${customer.name}</div>
            <div class="customer-contact">
                📧 ${customer.email}<br>
                📞 ${customer.phoneNumber}
            </div>
        </div>
    `).join('');
}

// Select a customer and show their details
async function selectCustomer(customerId) {
    // Update visual selection
    document.querySelectorAll('.customer-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.customer-item').classList.add('active');

    // Find customer in our local array
    currentCustomer = customers.find(c => c.id === customerId);
    if (!currentCustomer) return;

    // Show customer details section
    document.getElementById('selectedCustomerSection').style.display = 'block';
    document.getElementById('selectedCustomerName').textContent = `${currentCustomer.name} - Reservationer`;

    // Load customer's current reservations
    await loadCustomerReservations(customerId);

    // Load available reservations
    await loadAvailableReservations(customerId);

    // Clear search results
    document.getElementById('searchResults').innerHTML = '';
    document.getElementById('albumSearch').value = '';
}

// Load customer's current reservations
async function loadCustomerReservations(customerId) {
    try {
        const response = await fetch(`${API_BASE_URL}/customers/reservations/${customerId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reservations = await response.json();
        currentCustomer.reservations = reservations;
        displayCurrentReservations(reservations);
    } catch (error) {
        console.error('Error loading customer reservations:', error);
        showError('Kunne ikke indlæse kundens reservationer.');
    }
}

// Display current reservations
function displayCurrentReservations(reservations) {
    const container = document.getElementById('currentReservations');

    if (reservations.length === 0) {
        container.innerHTML = '<div class="empty-state">Ingen aktuelle reservationer</div>';
        return;
    }

    container.innerHTML = reservations.map(album => `
        <div class="reservation-item">
            <div class="reservation-title">${album.title}</div>
            <div class="reservation-details">
                ${album.artist} • ${album.genre}
                ${album.store ? `• ${album.store.name}` : ''}
            </div>
            <div class="reservation-status">
                <span class="availability-status ${album.available ? 'available' : 'unavailable'}">
                    ${album.available ? '✅ Tilgængelig' : '❌ Ikke på lager'}
                </span>
                <button class="cancel-btn-small" onclick="openCancelModal(${album.id})">
                    Afmeld
                </button>
            </div>
        </div>
    `).join('');
}

// Load available reservations (albums that are reserved and available)
async function loadAvailableReservations(customerId) {
    try {
        const response = await fetch(`${API_BASE_URL}/stores/customer/${customerId}/available`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const availableReservations = await response.json();
        displayAvailableReservations(availableReservations);
    } catch (error) {
        console.error('Error loading available reservations:', error);
        document.getElementById('availableReservationsList').innerHTML =
            '<div class="empty-state">Kunne ikke indlæse tilgængelige reservationer</div>';
    }
}

// Display available reservations
function displayAvailableReservations(availableReservations) {
    const container = document.getElementById('availableReservationsList');

    if (availableReservations.length === 0) {
        container.innerHTML = '<div class="empty-state">Ingen tilgængelige reservationer</div>';
        return;
    }

    container.innerHTML = availableReservations.map(album => `
        <div class="reservation-item">
            <div class="reservation-title">🎵 ${album.title}</div>
            <div class="reservation-details">
                ${album.artist} • ${album.genre}
                ${album.store ? `• ${album.store.name}` : ''}
            </div>
            <div class="reservation-status">
                <span class="availability-status available">
                    ✅ Klar til afhentning!
                </span>
            </div>
        </div>
    `).join('');
}

// Handle album search
function handleSearch() {
    const searchTerm = document.getElementById('albumSearch').value.toLowerCase().trim();

    if (!searchTerm) {
        document.getElementById('searchResults').innerHTML = '';
        return;
    }

    const filteredAlbums = albums.filter(album =>
        album.title.toLowerCase().includes(searchTerm) ||
        album.artist.toLowerCase().includes(searchTerm) ||
        album.genre.toLowerCase().includes(searchTerm)
    );

    displaySearchResults(filteredAlbums);
}

// Display search results
function displaySearchResults(searchResults) {
    const container = document.getElementById('searchResults');

    if (searchResults.length === 0) {
        container.innerHTML = '<div class="empty-state">Ingen albums fundet</div>';
        return;
    }

    container.innerHTML = searchResults.map(album => {
        const isAlreadyReserved = currentCustomer.reservations.some(r => r.id === album.id);

        return `
            <div class="album-search-item">
                <div class="album-info">
                    <div class="album-title">${album.title}</div>
                    <div class="album-details">${album.artist} • ${album.genre}</div>
                    <div class="album-store">${album.store ? album.store.name : 'Ingen butik'}</div>
                </div>
                <button 
                    class="reserve-btn" 
                    onclick="openReserveModal(${album.id})"
                    ${isAlreadyReserved ? 'disabled' : ''}>
                    ${isAlreadyReserved ? 'Allerede reserveret' : 'Reserver'}
                </button>
            </div>
        `;
    }).join('');
}

// Open reserve confirmation modal
function openReserveModal(albumId) {
    const album = albums.find(a => a.id === albumId);
    if (!album) return;

    currentReserveAlbum = album;

    document.getElementById('reserveModalContent').innerHTML = `
        <p>Vil du reservere følgende album for <strong>${currentCustomer.name}</strong>?</p>
        <div class="reservation-item" style="margin: 15px 0;">
            <div class="reservation-title">${album.title}</div>
            <div class="reservation-details">
                ${album.artist} • ${album.genre}
                ${album.store ? `• ${album.store.name}` : ''}
            </div>
            <div class="reservation-status">
                <span class="availability-status ${album.available ? 'available' : 'unavailable'}">
                    ${album.available ? '✅ På lager' : '❌ Ikke på lager'}
                </span>
            </div>
        </div>
    `;

    openModal('reserveModal');
}

// Open cancel reservation modal
function openCancelModal(albumId) {
    const album = currentCustomer.reservations.find(r => r.id === albumId);
    if (!album) return;

    currentCancelReservation = album;

    document.getElementById('cancelModalContent').innerHTML = `
        <p>Er du sikker på, at du vil afmelde <strong>${currentCustomer.name}</strong> fra følgende album?</p>
        <div class="reservation-item" style="margin: 15px 0;">
            <div class="reservation-title">${album.title}</div>
            <div class="reservation-details">
                ${album.artist} • ${album.genre}
                ${album.store ? `• ${album.store.name}` : ''}
            </div>
        </div>
    `;

    openModal('cancelModal');
}

// Handle confirm reservation
async function handleConfirmReservation() {
    if (!currentCustomer || !currentReserveAlbum) return;

    try {
        const response = await fetch(`${API_BASE_URL}/customers/${currentCustomer.id}/reserve/${currentReserveAlbum.id}`, {
            method: 'POST'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Reload customer reservations
        await loadCustomerReservations(currentCustomer.id);
        await loadAvailableReservations(currentCustomer.id);

        closeModal('reserveModal');
        showSuccess(`Album "${currentReserveAlbum.title}" er nu reserveret for ${currentCustomer.name}!`);

        // Clear search and refresh search results if there's a current search
        const searchTerm = document.getElementById('albumSearch').value;
        if (searchTerm) {
            handleSearch();
        }

        currentReserveAlbum = null;
    } catch (error) {
        console.error('Error reserving album:', error);
        showError('Kunne ikke reservere album. Prøv igen.');
    }
}

// Handle confirm cancellation
async function handleConfirmCancellation() {
    if (!currentCustomer || !currentCancelReservation) return;

    try {
        const response = await fetch(`${API_BASE_URL}/customers/${currentCustomer.id}/cancel/${currentCancelReservation.id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Reload customer reservations
        await loadCustomerReservations(currentCustomer.id);
        await loadAvailableReservations(currentCustomer.id);

        closeModal('cancelModal');
        showSuccess(`Reservation af "${currentCancelReservation.title}" er nu afmeldt for ${currentCustomer.name}!`);

        // Refresh search results if there's a current search
        const searchTerm = document.getElementById('albumSearch').value;
        if (searchTerm) {
            handleSearch();
        }

        currentCancelReservation = null;
    } catch (error) {
        console.error('Error cancelling reservation:', error);
        showError('Kunne ikke afmelde reservation. Prøv igen.');
    }
}

// Toggle available reservations list (collapsible)
function toggleAvailableReservations() {
    const content = document.getElementById('availableReservationsList');
    const toggle = document.getElementById('availableToggle');

    if (content.classList.contains('collapsed')) {
        content.classList.remove('collapsed');
        toggle.textContent = '▼';
        toggle.classList.remove('collapsed');
    } else {
        content.classList.add('collapsed');
        toggle.textContent = '▶';
        toggle.classList.add('collapsed');
    }
}

// Modal utility functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Message utility functions
function showError(message) {
    removeExistingMessages();
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.querySelector('.container').insertBefore(errorDiv, document.querySelector('main'));

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