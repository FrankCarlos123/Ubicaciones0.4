let folders = {};
let currentFolder = null;
let rotationInterval = null;
let scanner = null;
let scannerMode = 'add'; // 'add', 'search', 'createFolder'

// Inicializar la aplicación
window.onload = function() {
    loadData();
    renderFolders();
};

// Gestión de datos
function loadData() {
    const savedData = localStorage.getItem('folders');
    if (savedData) {
        folders = JSON.parse(savedData);
    }
}

function saveData() {
    localStorage.setItem('folders', JSON.stringify(folders));
}

// Renderizado de carpetas
function renderFolders() {
    const grid = document.getElementById('qrGrid');
    grid.innerHTML = '';
    
    Object.keys(folders).forEach(folderId => {
        const div = document.createElement('div');
        div.className = 'qr-item';
        div.onclick = () => openFolder(folderId);
        
        const qrDiv = document.createElement('div');
        new QRCode(qrDiv, {
            text: folderId,
            width: 128,
            height: 128
        });
        
        const label = document.createElement('div');
        label.className = 'qr-label';
        label.textContent = folderId;
        
        div.appendChild(qrDiv);
        div.appendChild(label);
        grid.appendChild(div);
    });
}

// Gestión de carpetas
function createNewFolder(scannedFolderId) {
    if (folders[scannedFolderId]) {
        alert('Esta carpeta ya existe');
        return;
    }
    
    folders[scannedFolderId] = {
        items: []
    };
    saveData();
    renderFolders();
}

function showAddFolderDialog() {
    scannerMode = 'createFolder';
    startScanner('Escanea el código para crear la carpeta');
}

function openFolder(folderId) {
    currentFolder = folderId;
    document.getElementById('mainView').classList.add('hidden');
    document.getElementById('folderView').classList.remove('hidden');
    document.getElementById('viewTitle').textContent = 'Ventana dentro de carpeta';
    startRotation();
}

// Búsqueda
function startSearch() {
    scannerMode = 'search';
    startScanner('Escaneando para buscar...');
}

function handleSearch(scannedData) {
    let foundFolder = null;
    
    for (const [folderId, folder] of Object.entries(folders)) {
        if (folder.items.includes(scannedData)) {
            foundFolder = folderId;
            break;
        }
    }
    
    if (foundFolder) {
        openFolder(foundFolder);
    } else {
        alert('Dato no encontrado en ninguna carpeta');
    }
}

// Rotación de datos
function startRotation() {
    stopRotation();
    
    const folder = folders[currentFolder];
    let currentIndex = -1;
    const qrDisplay = document.getElementById('qrDisplay');
    
    function showNext() {
        if (!folder.items.length) {
            qrDisplay.innerHTML = '';
            new QRCode(qrDisplay, {
                text: currentFolder,
                width: 256,
                height: 256
            });
            const label = document.createElement('div');
            label.className = 'qr-label';
            label.textContent = currentFolder;
            qrDisplay.appendChild(label);
            return;
        }
        
        currentIndex = (currentIndex + 1) % (folder.items.length * 2);
        qrDisplay.innerHTML = '';
        
        if (currentIndex % 2 === 0) {
            // Mostrar QR de la carpeta
            new QRCode(qrDisplay, {
                text: currentFolder,
                width: 256,
                height: 256
            });
            const label = document.createElement('div');
            label.className = 'qr-label';
            label.textContent = currentFolder;
            qrDisplay.appendChild(label);
        } else {
            // Mostrar dato
            const itemIndex = Math.floor(currentIndex / 2);
            new QRCode(qrDisplay, {
                text: folder.items[itemIndex],
                width: 256,
                height: 256
            });
            const label = document.createElement('div');
            label.className = 'qr-label';
            label.textContent = folder.items[itemIndex];
            qrDisplay.appendChild(label);
        }
    }
    
    showNext();
    rotationInterval = setInterval(showNext, 3000);
}

// Scanner
function startScanner(message = 'Escaneando...') {
    document.getElementById('scannerView').classList.remove('hidden');
    document.getElementById('scannerMessage').textContent = message;
    
    scanner = new Html5QrcodeScanner("reader", { 
        fps: 10,
        qrbox: {width: 250, height: 250}
    });
    
    scanner.render((decodedText) => {
        handleScanResult(decodedText);
        stopScanner();
    });
}

function stopScanner() {
    if (scanner) {
        scanner.clear();
        scanner = null;
    }
    document.getElementById('scannerView').classList.add('hidden');
}

function handleScanResult(scannedData) {
    switch (scannerMode) {
        case 'createFolder':
            createNewFolder(scannedData);
            break;
        case 'search':
            handleSearch(scannedData);
            break;
        case 'add':
            if (!folders[currentFolder].items.includes(scannedData)) {
                folders[currentFolder].items.push(scannedData);
                saveData();
                stopRotation();
                startRotation();
            }
            break;
    }
    scannerMode = 'add'; // Reset scanner mode
}

function stopRotation() {
    if (rotationInterval) {
        clearInterval(rotationInterval);
        rotationInterval = null;
    }
}

function backToMain() {
    currentFolder = null;
    stopRotation();
    document.getElementById('folderView').classList.add('hidden');
    document.getElementById('mainView').classList.remove('hidden');
    document.getElementById('viewTitle').textContent = 'Ventana Principal';
}

// Event Listeners
window.addEventListener('beforeunload', () => {
    stopRotation();
    stopScanner();
});