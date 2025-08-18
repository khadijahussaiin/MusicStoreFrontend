const apiBase = "http://localhost:8080"; // din backend

// Modal
const modal = document.getElementById("albumModal");
const addAlbumBtn = document.getElementById("addAlbumBtn");
const closeBtn = document.querySelector(".close");
const albumForm = document.getElementById("albumForm");
const albumTableBody = document.querySelector("#albumTable tbody");
const storeSelect = document.getElementById("storeSelect");

// Åbn modal til nyt album
addAlbumBtn.onclick = () => {
    document.getElementById("albumId").value = "";
    albumForm.reset();
    modal.style.display = "block";
};

// Luk modal
closeBtn.onclick = () => modal.style.display = "none";

// Hent stores til dropdown
async function loadStores() {
    const res = await fetch(`${apiBase}/stores`);
    const stores = await res.json();
    storeSelect.innerHTML = "";
    stores.forEach(s => {
        let opt = document.createElement("option");
        opt.value = s.id;
        opt.textContent = s.name;
        storeSelect.appendChild(opt);
    });
}

// Hent albums og vis i tabel
async function loadAlbums() {
    const res = await fetch(`${apiBase}/albums`);
    const albums = await res.json();
    albumTableBody.innerHTML = "";

    albums.forEach(a => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${a.title}</td>
            <td>${a.genre}</td>
            <td>${a.artist}</td>
            <td>${a.available ? "Yes" : "No"}</td>
            <td>${a.store ? a.store.name : "-"}</td>
            <td>
                <button onclick="editAlbum(${a.id})">Edit</button>
                <button onclick="deleteAlbum(${a.id})">Delete</button>
            </td>
        `;
        albumTableBody.appendChild(row);
    });
}

// Gem eller opdater album
albumForm.onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById("albumId").value;
    const album = {
        title: document.getElementById("title").value,
        genre: document.getElementById("genre").value,
        artist: document.getElementById("artist").value,
        available: document.getElementById("available").value === "true",
        store: { id: storeSelect.value }
    };

    let method = id ? "PUT" : "POST";
    let url = id ? `${apiBase}/albums/${id}` : `${apiBase}/albums`;

    await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(album)
    });

    modal.style.display = "none";
    loadAlbums();
};

// Rediger album
async function editAlbum(id) {
    const res = await fetch(`${apiBase}/albums/${id}`);
    const album = await res.json();

    document.getElementById("albumId").value = album.id;
    document.getElementById("title").value = album.title;
    document.getElementById("genre").value = album.genre;
    document.getElementById("artist").value = album.artist;
    document.getElementById("available").value = album.available;
    storeSelect.value = album.store ? album.store.id : "";

    modal.style.display = "block";
}

// Slet album
async function deleteAlbum(id) {
    if (confirm("Are you sure you want to delete this album?")) {
        await fetch(`${apiBase}/albums/${id}`, { method: "DELETE" });
        loadAlbums();
    }
}

// Init
window.onload = async () => {
    await loadStores();
    await loadAlbums();
};
