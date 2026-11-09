let monthsList = JSON.parse(localStorage.getItem('missed_setups_months')) || [
    { id: '2026-11', name: 'Listopad 2026' },
    { id: '2026-12', name: 'Grudzien 2026' },
    { id: '2027-01', name: 'Styczen 2027' }
];

let entries = JSON.parse(localStorage.getItem('missed_setups_v2') || '{}');
let frameworks = JSON.parse(localStorage.getItem('missed_frameworks') || '[]');

let currentTab = 'journal'; // 'journal' lub 'frameworks'
let currentMonth = null;
let monthToDeleteId = null;
let currentImages = [];
let currentFwImages = [];

const monthsView = document.getElementById('monthsView');
const monthDetailView = document.getElementById('monthDetailView');
const frameworksView = document.getElementById('frameworksView');
const backBtn = document.getElementById('backBtn');
const addMonthBtn = document.getElementById('addMonthBtn');
const addFrameworkBtn = document.getElementById('addFrameworkBtn');
const appTitle = document.getElementById('appTitle');
const statsCount = document.getElementById('statsCount');
const tabsNav = document.getElementById('tabsNav');

const tabJournalBtn = document.getElementById('tabJournalBtn');
const tabFrameworksBtn = document.getElementById('tabFrameworksBtn');

const pasteZone = document.getElementById('pasteZone');
const previewContainer = document.getElementById('previewContainer');
const setupForm = document.getElementById('setupForm');
const editingIdInput = document.getElementById('editingId');
const submitBtn = document.getElementById('submitBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const entriesList = document.getElementById('entriesList');

// Frameworks form elements
const frameworkForm = document.getElementById('frameworkForm');
const editingFrameworkIdInput = document.getElementById('editingFrameworkId');
const fwPasteZone = document.getElementById('fwPasteZone');
const fwPreviewContainer = document.getElementById('fwPreviewContainer');
const fwSubmitBtn = document.getElementById('fwSubmitBtn');
const fwCancelEditBtn = document.getElementById('fwCancelEditBtn');
const frameworksList = document.getElementById('frameworksList');

const modal = document.getElementById('imageModal');
const modalImg = document.getElementById('modalImg');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalGalleryNav = document.getElementById('modalGalleryNav');

// Modale
const addMonthModal = document.getElementById('addMonthModal');
const newMonthInput = document.getElementById('newMonthInput');
const cancelMonthBtn = document.getElementById('cancelMonthBtn');
const confirmMonthBtn = document.getElementById('confirmMonthBtn');

const deleteMonthModal = document.getElementById('deleteMonthModal');
const deleteMonthText = document.getElementById('deleteMonthText');
const cancelDeleteMonthBtn = document.getElementById('cancelDeleteMonthBtn');
const confirmDeleteMonthBtn = document.getElementById('confirmDeleteMonthBtn');

// Przełączanie zakładek
tabJournalBtn.addEventListener('click', () => switchTab('journal'));
tabFrameworksBtn.addEventListener('click', () => switchTab('frameworks'));

function switchTab(tab) {
    currentTab = tab;
    if (tab === 'journal') {
        tabJournalBtn.classList.add('active-tab');
        tabFrameworksBtn.classList.remove('active-tab');
        frameworksView.style.display = 'none';
        addFrameworkBtn.style.display = 'none';
        closeMonth(); // Wraca do kafelków miesięcy
    } else {
        tabFrameworksBtn.classList.add('active-tab');
        tabJournalBtn.classList.remove('active-tab');
        monthsView.style.display = 'none';
        monthDetailView.style.display = 'none';
        backBtn.style.display = 'none';
        addMonthBtn.style.display = 'none';
        statsCount.style.display = 'none';
        addFrameworkBtn.style.display = 'inline-block';
        appTitle.innerText = "Framework's";
        frameworksView.style.display = 'block';
        resetFrameworkForm();
        renderFrameworks();
    }
}

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

// Wklejanie screenów do Dziennika
window.addEventListener('paste', e => {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (let item of items) {
        if (item.type.indexOf('image') === 0) {
            const blob = item.getAsFile();
            const reader = new FileReader();
            reader.onload = function(event) {
                if (currentTab === 'journal' && currentMonth) {
                    currentImages.push(event.target.result);
                    renderPreviews();
                } else if (currentTab === 'frameworks') {
                    currentFwImages.push(event.target.result);
                    renderFwPreviews();
                }
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

// Wklejanie screenów do Framework's
function renderFwPreviews() {
    if (currentFwImages.length === 0) {
        fwPreviewContainer.innerHTML = '';
        fwPasteZone.style.display = 'block';
        return;
    }

    fwPasteZone.style.display = 'none';
    fwPreviewContainer.innerHTML = currentFwImages.map((imgSrc, index) => `
        <div style="position: relative; display: inline-block;">
            <img src="${imgSrc}" style="width: 80px; height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border);">
            <button type="button" onclick="removeFwImage(${index})" style="position: absolute; top: -6px; right: -6px; background: var(--danger); color: white; border: none; border-radius: 50%; width: 18px; height: 18px; font-size: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center;">x</button>
        </div>
    `).join('');
}

window.removeFwImage = function(index) {
    currentFwImages.splice(index, 1);
    renderFwPreviews();
}

// Obsługa formularza Dziennika
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
        const entryIndex = entries[currentMonth].findIndex(item => item.id == editId);
        if (entryIndex !== -1) {
            entries[currentMonth][entryIndex].asset = assetVal;
            entries[currentMonth][entryIndex].notes = notesVal;
            entries[currentMonth][entryIndex].images = [...currentImages];
        }
        resetForm();
    } else {
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

// Obsługa formularza Framework's
frameworkForm.addEventListener('submit', e => {
    e.preventDefault();
    const editId = editingFrameworkIdInput.value;

    if (editId) {
        const index = frameworks.findIndex(f => f.id == editId);
        if (index !== -1) {
            frameworks[index].images = [...currentFwImages];
        }
        resetFrameworkForm();
    } else {
        const newFw = {
            id: Date.now(),
            images: [...currentFwImages],
            date: new Date().toLocaleDateString('pl-PL') + ' ' + new Date().toLocaleTimeString('pl-PL', {hour: '2-digit', minute:'2-digit'})
        };
        frameworks.unshift(newFw);
        resetFrameworkForm();
    }

    localStorage.setItem('missed_frameworks', JSON.stringify(frameworks));
    renderFrameworks();
});

function resetFrameworkForm() {
    frameworkForm.reset();
    editingFrameworkIdInput.value = '';
    currentFwImages = [];
    renderFwPreviews();
    fwPasteZone.style.display = 'block';
    fwSubmitBtn.innerText = 'Zapisz Framework';
    fwCancelEditBtn.style.display = 'none';
}

fwCancelEditBtn.addEventListener('click', resetFrameworkForm);

function editFramework(id) {
    const item = frameworks.find(f => f.id == id);
    if (!item) return;

    editingFrameworkIdInput.value = item.id;
    currentFwImages = [...item.images];
    renderFwPreviews();
    fwSubmitBtn.innerText = 'Zaktualizuj Framework';
    fwCancelEditBtn.style.display = 'inline-block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteFramework(id) {
    frameworks = frameworks.filter(f => f.id !== id);
    if (editingFrameworkIdInput.value == id) {
        resetFrameworkForm();
    }
    localStorage.setItem('missed_frameworks', JSON.stringify(frameworks));
    renderFrameworks();
}

function renderFrameworks() {
    if (frameworks.length === 0) {
        frameworksList.innerHTML = `<div class="card empty-state">Brak zapisanych frameworkow. Uzyj formularza po lewej, aby dodac pierwszy.</div>`;
        return;
    }

    frameworksList.innerHTML = frameworks.map(item => {
        const imgs = item.images || [];
        // Zawsze bierzemy do 4 zdjęć do wyświetlenia w divie 2x2
        let gridImgs = imgs.slice(0, 4);
        while(gridImgs.length < 4) {
            gridImgs.push(null); // wypełnienie pustymi miejscami jeśli jest mniej niż 4
        }

        let gridHtml = gridImgs.map(img => {
            if (img) {
                return `<img src="${img}" style="width: 100%; height: 100%; object-fit: cover;">`;
            } else {
                return `<div style="background: var(--bg-color); width: 100%; height: 100%;"></div>`;
            }
        }).join('');

        return `
            <div class="framework-card">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 0.85rem; color: var(--text-muted);">Zdjec: ${imgs.length}</span>
                    <div class="entry-actions">
                        <button class="action-btn edit" onclick="editFramework(${item.id})" title="Edytuj">✎</button>
                        <button class="action-btn delete" onclick="deleteFramework(${item.id})" title="Usun">x</button>
                    </div>
                </div>
                <div class="framework-grid-4" onclick='openFrameworkGallery(${JSON.stringify(imgs)})' title="Kliknij, aby otworzyc galerie">
                    ${gridHtml}
                    <div class="fw-overlay-count">+${imgs.length}</div>
                </div>
                <div class="entry-date">${item.date}</div>
            </div>
        `;
    }).join('');
}

function openFrameworkGallery(imagesArray) {
    if (!imagesArray || imagesArray.length === 0) return;
    openModalGallery(imagesArray, 0);
}

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
    statsCount.style.display = 'block';
    tabsNav.style.display = 'none';
    appTitle.innerText = `${monthObj ? monthObj.name : monthId}`;

    resetForm();
    renderMonthView();
}

function closeMonth() {
    currentMonth = null;
    monthDetailView.style.display = 'none';
    frameworksView.style.display = 'none';
    monthsView.style.display = 'grid';
    backBtn.style.display = 'none';
    addMonthBtn.style.display = 'inline-block';
    addFrameworkBtn.style.display = 'none';
    statsCount.style.display = 'block';
    tabsNav.style.display = 'flex';
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
            ? `<div style="display: flex; gap: 8px; flex-wrap: wrap;">` + imagesList.map((img, idx) => `<img src="${img}" class="entry-thumb" onclick='openModalGallery(${JSON.stringify(imagesList)}, ${idx})' title="Kliknij, aby powiekszyc" style="width: 140px; height: 95px;">`).join('') + `</div>`
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
                                <button class="action-btn edit" onclick="editEntry(${item.id})" title="Edytuj wpis">✎</button>
                                <button class="action-btn delete" onclick="deleteEntry(${item.id})" title="Usun wpis">x</button>
                            </div>
                        </div>
                    </div>
                    <div class="entry-desc">${item.notes ? escapeHtml(item.notes) : '<i>Brak dodatkowych notatek.</i>'}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Obsługa galerii modalnej
function openModalGallery(imagesArray, index) {
    if (!imagesArray || imagesArray.length === 0) return;
    
    let currentIndex = index;
    modalImg.src = imagesArray[currentIndex];
    
    if (imagesArray.length > 1) {
        modalGalleryNav.innerHTML = imagesArray.map((img, i) => `
            <img src="${img}" style="width: 60px; height: 45px; object-fit: cover; border-radius: 4px; cursor: pointer; border: ${i === currentIndex ? '2px solid var(--accent)' : '1px solid var(--border)'};" onclick="event.stopPropagation(); changeModalImage('${img}', this)">
        `).join('');
    } else {
        modalGalleryNav.innerHTML = '';
    }

    modal.style.display = 'flex';
}

window.changeModalImage = function(src, thumbElement) {
    modalImg.src = src;
    modalGalleryNav.querySelectorAll('img').forEach(img => img.style.border = '1px solid var(--border)');
    thumbElement.style.border = '2px solid var(--accent)';
}

closeModalBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

modal.addEventListener('click', () => {
    modal.style.display = 'none';
});

function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

renderMonthsGrid();
