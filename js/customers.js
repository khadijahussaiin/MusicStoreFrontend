const API = 'http://localhost:8080';
let customers = [];
let albums = [];
let currentCustomer = null;

// Load data
async function loadData() {
    try {
        let res = await fetch(`${API}/customers/all`);
        customers = await res.json();
        showCustomers();

        res = await fetch(`${API}/albums/all`);
        albums = await res.json();
    } catch (e) {
        alert('Fejl ved indlæsning');
    }
}

// Show customers
function showCustomers() {
    document.getElementById('customersList').innerHTML = customers.map(c => `
        <div class="customer-item" onclick="selectCustomer(${c.id})">
            <strong>${c.name}</strong><br>
            ${c.email}<br>
            ${c.phoneNumber}
        </div>
    `).join('');
}

// Select customer
async function selectCustomer(id) {
    // Update selection
    document.querySelectorAll('.customer-item').forEach(i => i.classList.remove('active'));
    event.target.closest('.customer-item').classList.add('active');

    currentCustomer = customers.find(c => c.id === id);
    document.getElementById('customerActions').style.display = 'block';
    document.getElementById('customerName').textContent = currentCustomer.name;

    await loadReservations(id);
    await loadAvailable(id);
}

// Load reservations
async function loadReservations(id) {
    try {
        const res = await fetch(`${API}/customers/reservations/${id}`);
        const reservations = await res.json();
        currentCustomer.reservations = reservations;

        document.getElementById('reservations').innerHTML = reservations.length ?
            reservations.map(a => `
                <div class="album-item">
                    <strong>${a.title}</strong> - ${a.artist}<br>
                    ${a.genre} | ${a.store?.name || 'Ingen'} | ${a.available ? 'På lager✅' : 'Ikke på lager❌'}
                    <button class="cancel-btn" onclick="cancelReservation(${a.id})">Afmeld</button>
                </div>
            `).join('') : '<p>Ingen reservationer</p>';
    } catch (e) {
        console.error(e);
    }
}

// Load available
async function loadAvailable(id) {
    try {
        const res = await fetch(`${API}/stores/customer/${id}/available`);
        const available = await res.json();

        document.getElementById('available').innerHTML = available.length ?
            available.map(a => `
                <div class="album-item">
                    <strong>🎵 ${a.title}</strong> - ${a.artist}<br>
                    ${a.genre} | ${a.store?.name || 'Ingen'}<br>
                    <span style="color: green;">✅ Klar til afhentning!</span>
                </div>
            `).join('') : '<p>Ingen tilgængelige</p>';
    } catch (e) {
        console.error(e);
    }
}

// Search albums
function searchAlbums() {
    const term = document.getElementById('search').value.toLowerCase();
    if (!term) {
        document.getElementById('searchResults').innerHTML = '';
        return;
    }

    const filtered = albums.filter(a =>
        a.title.toLowerCase().includes(term) ||
        a.artist.toLowerCase().includes(term) ||
        a.genre.toLowerCase().includes(term)
    );

    document.getElementById('searchResults').innerHTML = filtered.length ?
        '<h4>Resultater:</h4>' + filtered.map(a => {
            const reserved = currentCustomer.reservations.some(r => r.id === a.id);
            return `
                <div class="album-item">
                    <strong>${a.title}</strong> - ${a.artist}<br>
                    ${a.genre} | ${a.store?.name || 'Ingen'} | ${a.available ? '✅' : '❌'}
                    <button class="reserve-btn" onclick="reserveAlbum(${a.id})" ${reserved ? 'disabled' : ''}>
                        ${reserved ? 'Reserveret' : 'Reserver'}
                    </button>
                </div>
            `;
        }).join('') : '<p>Ingen resultater</p>';
}

// Reserve album
async function reserveAlbum(albumId) {
    try {
        await fetch(`${API}/customers/${currentCustomer.id}/reserve/${albumId}`, {method: 'POST'});
        await loadReservations(currentCustomer.id);
        await loadAvailable(currentCustomer.id);
        if (document.getElementById('search').value) searchAlbums();
        alert('Reserveret!');
    } catch (e) {
        alert('Fejl ved reservation');
    }
}

// Cancel reservation
async function cancelReservation(albumId) {
    if (!confirm('Afmeld reservation?')) return;
    try {
        await fetch(`${API}/customers/${currentCustomer.id}/cancel/${albumId}`, {method: 'DELETE'});
        await loadReservations(currentCustomer.id);
        await loadAvailable(currentCustomer.id);
        if (document.getElementById('search').value) searchAlbums();
        alert('Afmeldt!');
    } catch (e) {
        alert('Fejl ved afmelding');
    }
}

// Toggle available
function toggleAvailable() {
    document.getElementById('available').classList.toggle('show');
}

// Search on Enter
document.getElementById('search').onkeypress = function(e) {
    if (e.key === 'Enter') searchAlbums();
};

// Start app
loadData();