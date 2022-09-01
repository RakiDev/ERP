const { ipcRenderer } = require('electron');

const button = document.getElementById('btnLogin');
const switchStatus = document.getElementById('switchStatus');
const switchDot = document.getElementById('switch');

function processForm(formElements) {
    let dataObject = {};
    // Transform formElements into an array to use array methods.
    Array.from(formElements).forEach(element => {
        if (element.id === 'btnLogin' || element.id === 'switchStatus') return;
        if (element.id === 'largeImageKey' || element.id === 'smallImageKey') return dataObject[element.id] = element.value.replace(/\s/g, '');
        dataObject[element.id] = element.value.trim();
    });
    return dataObject;
}

// On click send form as object to Main process to update RPC
button.addEventListener('click', () => {
    const form = document.forms.namedItem('login');
    ipcRenderer.invoke('rpc-handling', processForm(form.elements));
});

// Switch dot-green class from status dot
switchStatus.addEventListener('click', () => {
    const form = document.forms.namedItem('bottom-login');
    ipcRenderer.invoke('rpc-login', processForm(form.elements));
});

ipcRenderer.on('rpc-login-renderer', (event, onOrOff) => {
    // If onOrOff ture, it turns on the class. If not, it takes it away
    switchDot.classList.toggle('dot-green', onOrOff);
});