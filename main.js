const {app, BrowserWindow} = require('electron');
const path = require('path');
const url = require('url');
const ipc = require('electron').ipcMain;
const dialog = require('electron').dialog;
const fs = require('fs');
const file = require('file');

// Keep a global reference of the window object, or the window will be closed
// automatically when the JavaScript object is garbage collected
let splashScreen;
let mainWindow;

// console.log('test');

function stopSplashTimer(interval) {
    clearInterval(interval);
}

function createMainWindow(splash, start) {
    mainWindow = new BrowserWindow({
        width:  800,
        height: 600,

        // Don't show the window right away.  We will show it in the
        // 'ready-to-show' event below
        show:   false
    });

    mainWindow.loadURL(url.format({
        pathname:   path.join(__dirname, 'index.html'),
        protocol:   'file:',
        slashes:    true
    }));

    mainWindow.on('ready-to-show', function() {
        // console.log('trying to close the splashScreen');

        var splashtime = setInterval(function() {
            var now = (new Date()).getTime();
            var elapsed = now - start;

            if (elapsed > 2000) {
                splash.close();
                mainWindow.show();
                stopSplashTimer(splashtime);
            }
            // else {
            //     console.log('elapsed:', elapsed);
            // }
        }, 100);





    });

    mainWindow.on('closed', function() {
        mainWindow = null;
    });
}

function createSplashScreen() {
    console.log('starting createSplashScreen');
    splashScreen = new BrowserWindow({
        width:  240,
        height: 240,
        frame:  false,
        backgroundColor:    '#709ed5',
        show:   false
    });

    splashScreen.loadURL(url.format({
        pathname:   path.join(__dirname, 'splash.html'),
        protocol:   'file:',
        slashes:    true
    }));

    splashScreen.on('ready-to-show', function() {
        // console.log('splashScreen ready-to-show start');
        start = (new Date()).getTime();
        splashScreen.show();
        createMainWindow(splashScreen, start);
    });
}

app.on('ready', createSplashScreen);

// Quit when all windows have been closed
app.on('window-all-closed', function() {
    app.quit();
});

app.on('activate', function() {
    if (win === null) {
        createWindow();
    }
});

ipc.on('open-file-dialog', function(event) {
    dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    }, function (files) {
        console.log('files', files);
        if (files) {
            // fs.readdir(files[0], function(err, items) {
            //     console.log(items);
            //     for (var i = 0; i < items.length; i++) {
            //         console.log('items[' + i + ']: ', items[i]);
            //     }
            // });

            var all_files = [];

            file.walk(files[0], function(err, dirPath, dirs, files) {
                console.log('err:', err);
                console.log('dirPath:', dirPath);
                console.log('dirs:', dirs);
                console.log('files:', files);

                all_files.push(files);
            });

            console.log('all_files:', all_files);





            event.sender.send('select_directory', files);
        }
    });
});
