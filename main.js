const { app, BrowserWindow, ipcMain, Notification, Tray, nativeImage, Menu } = require('electron');
const path = require('path');
const DiscordRPC = require('discord-rpc');
let RPC;
let isThereTray = false;

const createClient = (DiscordRPC, transport, clientId) => {
    let returnValue = true;
    RPC = new DiscordRPC.Client({ transport });
    RPC.login({ clientId })
        .then(console.log('createClient sucess'))
        .catch(err => {
            console.error('Could not create client with createClient', err);
            returnValue = false;
        });
    console.log(returnValue);
    return returnValue;
};


const setActivity = (object, RPC) => {
    if (!RPC) return;
    try {
        RPC.setActivity({
            details: `${ object.details ? object.details : "Testing presence" }`,
            state: `${ object.state ? object.state : "Testing RPC" }`,
            startTimestamp: Date.now(),
            largeImageKey: `${ object.largeImageKey ? object.largeImageKey : "discord-icon"}`,
            largeImageText: `${ object.largeImageText ? object.largeImageText : "Large image text!"}`,
            smallImageKey: `${ object.smallImageKey ? object.smallImageKey : "discord-icon"}`,
            smallImageText: `${ object.smallImageText ? object.smallImageText : "Small image text!"}`,
            instance: false,
            buttons: [
                {
                    label: `Youtube`,
                    url: `https://www.youtube.com`
                },
                {
                    label: `Google`,
                    url: `https://www.google.com`
                }
            ]
        });
    } catch (error) {
        const notification = {
            title: 'Error',
            body: 'Could not update rich presence'
        }
        new Notification(notification).show();
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
            label: 'Show ERPC',
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

// Fix issue on some operating systems where the application 
// still remains active even after all windows have been closed
app.on('window-all-closed', () => {
});

// Ensure that the application boots up when its icon is clicked in the
// operating system’s application dock when there are no windows open.
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) loadMainWindow();
});

ipcMain.handle('show-notification', (event, ...args) => {
    const notification = {
        title: 'New Task',
        body: `Added: ${args[0]}`
    }
    new Notification(notification).show();
});

ipcMain.handle('rpc-handling', (event, ...args) => {
    if (!RPC) {
        const notification = {
            title: 'Error',
            body: 'You haven\'t logged in yet!'
        }
        new Notification(notification).show();
        return;
    }
    setActivity(args[0], RPC);
    console.log('Activity set!', '\nRecieved object: ', args[0]);
});

ipcMain.handle('rpc-login', (event, ...args) => {
    // clientId is always 19 characters long and only contains strings.
    // The Number constructor will try to make a type number with the string,
    // if it's not able to it will return NaN wich is falsy.
    if (!(args[0].clientId.length === 19 && Number(args[0].clientId))) return notification('Error', 'The client ID is invalid');
    // There is only one window in the app.
    // Get it by selecting the first element in the array with [0]
    const win = BrowserWindow.getAllWindows()[0];

    try {
        RPC.destroy();
    } catch (error) {
        console.log(error);
    } finally {
        console.log('reached here. args: ', args[0].clientId);
        if (createClient(DiscordRPC, 'ipc', args[0].clientId)) {
            win.webContents.send('rpc-login-renderer', true)
            return;
        }
        win.webContents.send('rpc-login-renderer', false);
    }
});
