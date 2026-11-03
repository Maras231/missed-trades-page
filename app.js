let monthsList = JSON.parse(localStorage.getItem('missed_setups_months')) || [
    { id: '2026-11', name: 'Listopad 2026' },
    { id: '2026-12', name: 'Grudzien 2026' },
    { id: '2027-01', name: 'Styczen 2027' }
];

let entries = JSON.parse(localStorage.getItem('missed_setups_v2') || '{}');
let currentMonth = null;
let monthToDeleteId = null;
let currentImages = [];

const monthsView = document.getElementById('monthsView');
const monthDetailView = document.getElementById('monthDetailView');
const backBtn = document.getElementById('backBtn');
const addMonthBtn = document.getElementById('addMonthBtn');
const appTitle = document.getElementById('appTitle');
const statsCount = document.getElementById('statsCount');
const pasteZone = document.getElementById('pasteZone');
const previewContainer = document.getElementById('previewContainer');
const setupForm = document.getElementById('setupForm');
const editingIdInput = document.getElementById('editingId');
const submitBtn = document.getElementById('submitBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const entriesList = document.getElementById('entriesList');
const modal = document.getElementById('imageModal');
const modalImg = document.getElementById('modalImg');

// Modale
const addMonthModal = document.getElementById('addMonthModal');
const newMonthInput = document.getElementById('newMonthInput');
const cancelMonthBtn = document.getElementById('cancelMonthBtn');
const confirmMonthBtn = document.getElementById('confirmMonthBtn');

const deleteMonthModal = document.getElementById('deleteMonthModal');
const deleteMonthText = document.getElementById('deleteMonthText');
const cancelDeleteMonthBtn = document.getElementById('cancelDeleteMonthBtn');
const confirmDeleteMonthBtn = document.getElementById('confirmDeleteMonthBtn');

// Dodawanie miesiąca
addMonthBtn.addEventListener('click', () => {
    newMonthInput.value = '';
    addMonthModal.style.display = 'flex';
    newMonthInput.focus();
});

cancelMonthBtn.addEventListener('click', () => {
    addMonthModal.style.display = 'none';
});

confirmMonthBtn.addEventListener('click', submitNewMonth);
newMonthInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') submitNewMonth();
    if (e.key === 'Escape') addMonthModal.style.display = 'none';
});

function submitNewMonth() {
    const monthName = newMonthInput.value.trim();
    if (!monthName) return;

    const monthId = 'm_' + Date.now();
    monthsList.push({ id: monthId, name: monthName });
    localStorage.setItem('missed_setups_months', JSON.stringify(monthsList));
    
    addMonthModal.style.display = 'none';
    renderMonthsGrid();
}

// Usuwanie miesiąca
function promptDeleteMonth(monthId, monthName) {
    monthToDeleteId = monthId;
    deleteMonthText.innerText = `Czy na pewno chcesz usunac miesiac "${monthName}" wraz ze wszystkimi jego wpisami?`;
    deleteMonthModal.style.display = 'flex';
}

cancelDeleteMonthBtn.addEventListener('click', () => {
    deleteMonthModal.style.display = 'none';
    monthToDeleteId = null;
});

confirmDeleteMonthBtn.addEventListener('click', () => {
    if (!monthToDeleteId) return;

    monthsList = monthsList.filter(m => m.id !== monthToDeleteId);
    delete entries[monthToDeleteId];

    localStorage.setItem('missed_setups_months', JSON.stringify(monthsList));
    localStorage.setItem('missed_setups_v2', JSON.stringify(entries));

    deleteMonthModal.style.display = 'none';
    monthToDeleteId = null;
    renderMonthsGrid();
});

// Wklejanie screenów
window.addEventListener('paste', e => {
    if (!currentMonth) return;
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (let item of items) {
        if (item.type.indexOf('image') === 0) {
            const blob = item.getAsFile();
            const reader = new FileReader();
            reader.onload = function(event) {
                currentImages.push(event.target.result);
                renderPreviews();
            };
            reader.readAsDataURL(blob);
        }
    }
});

function renderPreviews() {
    if (currentImages.length === 0) {
        previewContainer.innerHTML = '';
        pasteZone.style.display = 'block';
        return;
    }

    pasteZone.style.display = 'none';
    previewContainer.innerHTML = currentImages.map((imgSrc, index) => `
        <div style="position: relative; display: inline-block;">
            <img src="${imgSrc}" style="width: 80px; height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border);">
            <button type="button" onclick="removeImage(${index})" style="position: absolute; top: -6px; right: -6px; background: var(--danger); color: white; border: none; border-radius: 50%; width: 18px; height: 18px; font-size: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center;">x</button>
        </div>
    `).join('');
}

window.removeImage = function(index) {
    currentImages.splice(index, 1);
    renderPreviews();
}

// Obsługa formularza (Dodawanie lub Edycja)
setupForm.addEventListener('submit', e => {
    e.preventDefault();
    if (!currentMonth) return;

    if (!entries[currentMonth]) {
        entries[currentMonth] = [];
    }

    const editId = editingIdInput.value;
    const assetVal = document.getElementById('asset').value.toUpperCase();
    const notesVal = document.getElementById('notes').value;

    if (editId) {
        // Tryb edycji istniejącego wpisu
        const entryIndex = entries[currentMonth].findIndex(item => item.id == editId);
        if (entryIndex !== -1) {
            entries[currentMonth][entryIndex].asset = assetVal;
            entries[currentMonth][entryIndex].notes = notesVal;
            entries[currentMonth][entryIndex].images = [...currentImages];
        }
        resetForm();
    } else {
        // Tryb dodawania nowego wpisu
        const newEntry = {
            id: Date.now(),
            asset: assetVal,
            notes: notesVal,
            images: [...currentImages],
            date: new Date().toLocaleDateString('pl-PL') + ' ' + new Date().toLocaleTimeString('pl-PL', {hour: '2-digit', minute:'2-digit'})
        };
        entries[currentMonth].unshift(newEntry);
        resetForm();
    }

    saveAndRenderMonth();
});

function editEntry(id) {
    const monthData = entries[currentMonth] || [];
    const item = monthData.find(i => i.id == id);
    if (!item) return;

    editingIdInput.value = item.id;
    document.getElementById('asset').value = item.asset;
    document.getElementById('notes').value = item.notes || '';
    currentImages = item.images ? [...item.images] : (item.image ? [item.image] : []);
    
    renderPreviews();
    submitBtn.innerText = 'Zaktualizuj wpis';
    cancelEditBtn.style.display = 'inline-block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

cancelEditBtn.addEventListener('click', () => {
    resetForm();
});

function resetForm() {
    setupForm.reset();
    editingIdInput.value = '';
    currentImages = [];
    renderPreviews();
    pasteZone.style.display = 'block';
    submitBtn.innerText = 'Zapisz w tym miesiacu';
    cancelEditBtn.style.display = 'none';
}

function deleteEntry(id) {
    if (!currentMonth) return;
    entries[currentMonth] = entries[currentMonth].filter(item => item.id !== id);
    if (editingIdInput.value == id) {
        resetForm();
    }
    saveAndRenderMonth();
}

function saveAndRenderMonth() {
    localStorage.setItem('missed_setups_v2', JSON.stringify(entries));
    renderMonthView();
}

function openMonth(monthId) {
    currentMonth = monthId;
    const monthObj = monthsList.find(m => m.id === monthId);
    
    monthsView.style.display = 'none';
    monthDetailView.style.display = 'grid';
    backBtn.style.display = 'inline-block';
    addMonthBtn.style.display = 'none';
    appTitle.innerText = `${monthObj ? monthObj.name : monthId}`;

    resetForm();
    renderMonthView();
}

function closeMonth() {
    currentMonth = null;
    monthDetailView.style.display = 'none';
    monthsView.style.display = 'grid';
    backBtn.style.display = 'none';
    addMonthBtn.style.display = 'inline-block';
    appTitle.innerText = `Missed Setups Journal`;
    statsCount.innerText = 'Wybierz miesiac';
    resetForm();
    renderMonthsGrid();
}

backBtn.addEventListener('click', closeMonth);

function renderMonthsGrid() {
    monthsView.innerHTML = monthsList.map(m => {
        const count = entries[m.id] ? entries[m.id].length : 0;
        return `
            <div class="month-card" onclick="openMonth('${m.id}')">
                <div class="month-card-header">
                    <h3>${m.name}</h3>
                    <button class="delete-month-btn" data-id="${m.id}" data-name="${escapeHtml(m.name)}" title="Usun miesiac">x</button>
                </div>
                <p>Zapisane setupy: <strong>${count}</strong></p>
            </div>
        `;
    }).join('');

    document.querySelectorAll('.delete-month-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = e.currentTarget.getAttribute('data-id');
            const name = e.currentTarget.getAttribute('data-name');
            promptDeleteMonth(id, name);
        });
    });
}

function renderMonthView() {
    const monthData = entries[currentMonth] || [];
    statsCount.innerText = `Wpisy w miesiacu: ${monthData.length}`;

    if (monthData.length === 0) {
        entriesList.innerHTML = `<div class="card empty-state">Brak zapisanych missnietych setupow w tym miesiacu. Uzyj formularza po lewej, aby dodac pierwszy.</div>`;
        return;
    }

    entriesList.innerHTML = monthData.map(item => {
        let imagesList = item.images || (item.image ? [item.image] : []);
        
        let imagesHtml = imagesList.length > 0 
            ? `<div style="display: flex; gap: 8px; flex-wrap: wrap;">` + imagesList.map(img => `<img src="${img}" class="entry-thumb" data-img="${img}" title="Kliknij, aby powiekszyc" style="width: 140px; height: 95px;">`).join('') + `</div>`
            : '<div class="entry-thumb no-img-thumb" style="width: 140px; height: 95px;">Brak zdjecia</div>';

        return `
            <div class="entry-card" style="align-items: flex-start;">
                ${imagesHtml}
                <div class="entry-info">
                    <div class="entry-header">
                        <span class="entry-asset">${item.asset}</span>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span class="entry-date">${item.date}</span>
                            <div class="entry-actions">
                                <button class="action-btn edit" data-id="${item.id}" title="Edytuj wpis">✎</button>
                                <button class="action-btn delete" data-id="${item.id}" title="Usun wpis">x</button>
                            </div>
                        </div>
                    </div>
                    <div class="entry-desc">${item.notes ? escapeHtml(item.notes) : '<i>Brak dodatkowych notatek.</i>'}</div>
                </div>
            </div>
        `;
    }).join('');

    document.querySelectorAll('.action-btn.delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = Number(e.currentTarget.getAttribute('data-id'));
            deleteEntry(id);
        });
    });

    document.querySelectorAll('.action-btn.edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = Number(e.currentTarget.getAttribute('data-id'));
            editEntry(id);
        });
    });

    document.querySelectorAll('.entry-thumb[data-img]').forEach(img => {
        img.addEventListener('click', (e) => {
            openModal(e.currentTarget.getAttribute('data-img'));
        });
    });
}

function openModal(src) {
    modalImg.src = src;
    modal.style.display = 'flex';
}

modal.addEventListener('click', () => {
    modal.style.display = 'none';
});

function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

renderMonthsGrid();