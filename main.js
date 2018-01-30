const {app, BrowserWindow} = require('electron');
const path = require('path');
const url = require('url');
const ipc = require('electron').ipcMain;
const dialog = require('electron').dialog;
// const fs = require('fs');
// const file = require('file');
const walk = require('walk');

const conv_hb = require('./convert_handbrake.js');

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
        width:  1000,
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

            if (elapsed > 200) {
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
    }, function (dir) {
        console.log('directory', dir);
        event.sender.send('num_video_files', 0);
        if (dir) {
            event.sender.send('set_status', 'Scanning directory...');
            var all_files = [];
            var allowed_extensions = ['.mov', '.avi', '.mpg', '.mpeg', '.wmv'];

            walker = walk.walk(dir[0]);

            walker.on('file', function(root, fileStats, next) {
                console.log('============ walker file ==========');
                console.log('root:', root);
                console.log('fileStats:', fileStats);
                console.log('next:', next);

                var full_path = root + '/' + fileStats.name;
                event.sender.send('found_file', root, fileStats.name);

                var ext = path.extname(fileStats.name);

                if (allowed_extensions.indexOf(ext.toLowerCase()) > -1) {
                    all_files.push(full_path);
                    event.sender.send('num_video_files', 0, all_files.length);
                }

                next();
            });

            walker.on('errors', function (root, nodeStatsArray, next) {
                console.error('Error happened!');
                console.error('root:', root);
                console.error('nodeStatsArray:', nodeStatsArray);
                next();
            })

            walker.on('end', function() {
                console.log('all_files:', all_files);
                event.sender.send('set_status', 'Scanning directory complete');
                event.sender.send('found_file', '', '');
                conv_hb.start_handbrake_conversion(all_files, event);
            });

            event.sender.send('select_directory', dir);
        }
    });
});
