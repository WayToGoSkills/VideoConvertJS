const {app, BrowserWindow} = require('electron');
const path = require('path');
const url = require('url');
const ipc = require('electron').ipcMain;
const dialog = require('electron').dialog;
const fs = require('fs');
const walk = require('walk');
const ffmpeg = require('fluent-ffmpeg');
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

function getRotation(all_files, index, preset, event) {
    event.sender.send('set_status', 'Finding video rotations...');

    var input_file_parse = path.parse(all_files[index].path);
    event.sender.send('found_file', input_file_parse.dir, input_file_parse.name + input_file_parse.ext);

    ffmpeg.ffprobe(all_files[index].path, function(err, data) {
        // console.log('data:', data);
        try {
            if (data.streams[0].tags.rotate) {
                if (data.streams[0].tags.rotate == 90) {
                    all_files[index].rotation = 'angle=90';
                }
                else if (data.streams[0].tags.rotate == 180) {
                    all_files[index].rotation = 'angle=180';
                }
                else if (data.streams[0].tags.rotate == 270) {
                    all_files[index].rotation = 'angle=270';
                }
            }
        } catch (error) {
            console.log('Could not set rotation!');
        }

        try {
            if (data.format.tags.creation_time) {
                all_files[index].creationtime = data.format.tags.creation_time;
            }
        } catch (error) {
            // console.log('Could not set creation time!');
            // console.log('data:', data);
            console.log(fs.statSync(all_files[index].path));
            var stats = fs.statSync(all_files[index].path);
            all_files[index].creationtime = stats.mtime;
        }


        ++index;
        if (index < all_files.length) {
            getRotation(all_files, index, preset, event);
        } else {
            console.log('all_files:', all_files);
            conv_hb.start_handbrake_conversion(all_files, preset, event);
        }
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
        // console.log('directory', dir);
        if (dir) {
            event.sender.send('select_directory', dir);
        }
    });
});

ipc.on('start_pushed', function(event, dir, recursive, reconvert, preset) {
    // console.log('start_pushed!', dir, recursive, reconvert, preset);
    event.sender.send('set_status', 'Scanning directory...');
    event.sender.send('num_video_files', 0);

    var all_files = [];
    var allowed_extensions = ['.mov', '.avi', '.mpg', '.mpeg', '.wmv'];

    walker = walk.walk(dir);

    walker.on('file', function(root, fileStats, next) {
        // console.log('============ walker file ==========');
        // console.log('root:', root);
        // console.log('fileStats:', fileStats);
        // console.log('next:', next);

        var full_path = root + path.sep + fileStats.name;

        var full_path_parse = path.parse(full_path);
        var output_file = full_path_parse.dir + path.sep + full_path_parse.name + '.mp4';
        event.sender.send('found_file', root, fileStats.name);

        var ext = path.extname(fileStats.name);

        if (allowed_extensions.indexOf(ext.toLowerCase()) > -1) {
            if (reconvert) {
                all_files.push({'path': full_path});
            } else {
                if (!fs.existsSync(output_file)) {
                    all_files.push({'path': full_path});
                }
            }

            event.sender.send('num_video_files', 0, all_files.length);
        }

        next();
    });

    walker.on('errors', function (root, nodeStatsArray, next) {
        console.error('Error happened!');
        console.error('root:', root);
        console.error('nodeStatsArray:', nodeStatsArray);
        next();
    });

    walker.on('end', function() {
        // console.log('all_files:', all_files);
        event.sender.send('set_status', 'Scanning directory complete');
        event.sender.send('found_file', '', '');

        if (all_files.length > 0) {
            // conv_hb.start_handbrake_conversion(all_files, preset, event);
            var rotation_index = 0;
            getRotation(all_files, rotation_index, preset, event);
        }
    });
});

ipc.on('quit_app', function(event) {
    app.quit();
});
