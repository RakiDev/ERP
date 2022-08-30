const { ipcRenderer } = require('electron');

const button = document.getElementById('btnLogin');

function processForm(formElements) {
    let dataObject = {};
    // Transform formElements into an array to use array methods.
    Array.from(formElements).forEach(element => {
        if (element.id === 'btnLogin') return;
        if (element.id === 'largeImageKey' || element.id === 'smallImageKey') return dataObject[element.id] = element.value.replace(/\s/g, '');
        dataObject[element.id] = element.value.trim();
    });
    return dataObject;
}

button.addEventListener('click', () => {
    const form = document.forms.namedItem('login');
    ipcRenderer.invoke('rpc-handling', processForm(form.elements));
});

