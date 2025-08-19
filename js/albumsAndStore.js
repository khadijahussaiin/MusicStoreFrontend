const API = 'http://localhost:8080';
let albums = [];

// Load albums
async function loadAlbums() {
    try {
        const res = await fetch(`${API}/albums/all`);
        albums = await res.json();
        showAlbums();
    } catch (e) {
        alert('Fejl ved indlæsning');
    }
}

// Show albums in table
function showAlbums() {
    document.getElementById('albums').innerHTML = albums.map(a => `
        <tr>
            <td>${a.title}</td>
            <td>${a.artist}</td>
            <td>${a.genre}</td>
            <td>${a.available ? 'Ja' : 'Nej'}</td>
            <td><span class="store-link" onclick="showStore(${a.store?.id})">${a.store?.name || 'Ingen'}</span></td>
            <td>
                <button class="edit-btn" onclick="editAlbum(${a.id})">Rediger</button>
                <button class="delete-btn" onclick="deleteAlbum(${a.id})">Slet</button>
            </td>
        </tr>
    `).join('');
}

// Open modal
function openModal() {
    document.getElementById('form').reset();
    document.getElementById('albumId').value = '';
    document.getElementById('modalTitle').textContent = 'Tilføj Album';
    document.getElementById('modal').style.display = 'block';
}

// Edit album
function editAlbum(id) {
    const album = albums.find(a => a.id === id);
    document.getElementById('albumId').value = album.id;
    document.getElementById('title').value = album.title;
    document.getElementById('artist').value = album.artist;
    document.getElementById('genre').value = album.genre;
    document.getElementById('available').value = album.available;
    document.getElementById('storeId').value = album.store?.id || 1;
    document.getElementById('modalTitle').textContent = 'Rediger Album';
    document.getElementById('modal').style.display = 'block';
}

// Delete album
async function deleteAlbum(id) {
    if (!confirm('Slet album?')) return;
    try {
        await fetch(`${API}/albums/delete/${id}`, {method: 'DELETE'});
        loadAlbums();
        alert('Slettet!');
    } catch (e) {
        alert('Fejl ved sletning');
    }
}

// Show store details
async function showStore(id) {
    try {
        const res = await fetch(`${API}/stores/details/${id}`);
        const store = await res.json();
        document.getElementById('storeInfo').innerHTML = `
            <h4>${store.name}</h4>
            <p>${store.street}, ${store.city} ${store.zip}</p>
            <p>Albums: ${store.albums.map(a => a.title).join(', ')}</p>
        `;
        document.getElementById('storeInfo').style.display = 'block';
    } catch (e) {
        alert('Fejl ved butik info');
    }
}

// Close modal
function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

// Form submit
document.getElementById('form').onsubmit = async function(e) {
    e.preventDefault();
    const data = {
        title: document.getElementById('title').value,
        artist: document.getElementById('artist').value,
        genre: document.getElementById('genre').value,
        available: document.getElementById('available').value === 'true',
        store: {id: parseInt(document.getElementById('storeId').value)}
    };

    const id = document.getElementById('albumId').value;
    try {
        if (id) {
            await fetch(`${API}/albums/update/${id}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });
        } else {
            await fetch(`${API}/albums/add`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });
        }
        closeModal();
        loadAlbums();
        alert('Gemt!');
    } catch (e) {
        alert('Fejl ved gemning');
    }
};

// Start app
loadAlbums();