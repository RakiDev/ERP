const { app, BrowserWindow, ipcMain, Notification, Tray, nativeImage, Menu } = require('electron');
const path = require('path');
const DiscordRPC = require('discord-rpc');
let RPC;
let isThereTray = false;

const createClient = async (DiscordRPC, transport, clientId) => {
    RPC = new DiscordRPC.Client({ transport });
    try {
        await RPC.login({ clientId });
    } catch (error) {
        console.error('Could not create client with createClient', error);
        return false;
    }
    console.log('createClient sucess');
    return true;
};

const processButtons = (buttonOneName, buttonOneLink, buttonTwoName, buttonTwoLink) => {
    const buttons = [];
    console.log(buttonOneLink, buttonOneName);
    if (!!(buttonOneName && buttonOneLink)) buttons.push({ label: `${buttonOneName}`, url: `${buttonOneLink}` });
    if (!!(buttonTwoName && buttonTwoLink)) buttons.push({ label: `${buttonTwoName}`, url: `${buttonTwoLink}` });
    console.log(buttons);
    return buttons;
};

const setActivity = async (object, RPC) => {
    if (!RPC) return;
    try {
        const RPCconfig = {
            details: `${ object.details ? object.details : "Testing presence" }`,
            state: `${ object.state ? object.state : "Testing RPC" }`,
            startTimestamp: Date.now(),
            largeImageKey: `${ object.largeImageKey ? object.largeImageKey : "discord-icon"}`,
            largeImageText: `${ object.largeImageText ? object.largeImageText : "Large image text!"}`,
            smallImageKey: `${ object.smallImageKey ? object.smallImageKey : "discord-icon"}`,
            smallImageText: `${ object.smallImageText ? object.smallImageText : "Small image text!"}`,
            instance: false,
        };
        // The buttons property on RPCconfig must not be undefined (only an array with max two objects, 
        // with the properties label and url defined), so we have to check if there is any buttons
        // from the user input. If there are, then and only then we set the property.
        const buttonArray = processButtons(object.buttonOneName, object.buttonOneLink, object.buttonTwoName, object.buttonTwoLink);
        if (buttonArray.length > 0) RPCconfig.buttons = buttonArray;
        await RPC.setActivity(RPCconfig);
    } catch (error) {
        notification('Error', 'Could not update rich presence');
        console.error(error);
    }
}

const loadMainWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 600,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    if (!isThereTray) {
        createTray()
        isThereTray = true;
    }
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

const createTray = () => {
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show ERP',
            click: () => {
                loadMainWindow();
            }
        },
        {
            label: 'Quit', 
            click: () => {
                app.quit();
            }
        },
    ]);
    const icon = path.join(__dirname, '/img/logoERPC.png');
    const trayIcon = nativeImage.createFromPath(icon);
    const tray = new Tray(trayIcon.resize({ height: 50 }));
    tray.setToolTip('Tray testing');
    tray.setContextMenu(contextMenu);
}

const notification = (title, body) => {
    return new Notification({ title, body }).show();
}

app.on('ready', loadMainWindow);

// Ensure that the application boots up when its icon is clicked in the
// operating system’s application dock when there are no windows open.
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) loadMainWindow();
});

// When all windows closed, do nothing to prevent default exit behavior:
// Passing an empty function prevents the app from closing altogether, 
// allowing us to have a background-process-like behavior
app.on('window-all-closed', () => {

});

ipcMain.handle('rpc-handling', (event, ...args) => {
    if (!RPC) return notification('Error', 'You haven\'t logged in yet');
    setActivity(args[0], RPC);
    console.log('Activity set!', '\nRecieved object: ', args[0]);
});

ipcMain.handle('rpc-login', async (event, ...args) => {
    // clientId is always 19 characters long and only contains strings.
    // The Number constructor will try to make a type number with the string,
    // if it's not able to it will return NaN wich is falsy.
    if (!(args[0].clientId.length === 19 && Number(args[0].clientId))) return notification('Error', 'The client ID is invalid');
    // There is only one window in the app.
    // Get it by selecting the first element in the array with [0]
    const win = BrowserWindow.getAllWindows()[0];

    try {
        await RPC.destroy();
    } catch (error) {
        console.log(error);
    } finally {
        // If createClient is able to log in then send true to activate Connection status icon. If not turn it off
        if (await createClient(DiscordRPC, 'ipc', args[0].clientId)) {
            console.log('Sending true');
            win.webContents.send('rpc-login-renderer', 'sajfopasjfosapfjopsafjasopjfoas')
            return;
        }
        console.log('Sending false');
        win.webContents.send('rpc-login-renderer', false);
    }
});
