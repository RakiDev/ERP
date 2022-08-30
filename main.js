const { app, BrowserWindow, ipcMain, Notification, Tray, nativeImage, Menu } = require('electron');
const path = require('path');
const DiscordRPC = require('discord-rpc');
const RPC = new DiscordRPC.Client({ transport: 'ipc' });
let clientId = '1014017161271975956';
let isThereTray = false;

const setActivity = async object => {
    if (!RPC) return;
    try {
        RPC.setActivity({
            details: `${ object.details ? object.details : "Testing presence" }`,
            state: `${ object.state ? object.state : "Testing RPC" }`,
            startTimestamp: Date.now(),
            largeImageKey: `${ object.largeImageKey ? object.largeImageKey : ""}`,
            largeImageText: `${ object.largeImageText ? object.largeImageText : "Large image text!"}`,
            smallImageKey: `${ object.smallImageKey ? object.smallImageKey : ""}`,
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
    setActivity(args[0]);
    console.log('Activity set!', '\nRecieved object: ', args[0]);
});

RPC.login({ clientId })
    .then(console.log('RPC ON'))
    .catch(err => console.error(err));


