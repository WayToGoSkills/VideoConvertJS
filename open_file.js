const ipc = require('electron').ipcRenderer;
const selectDirBtn = document.getElementById('select_directory');
const startBtn = document.getElementById('start');

selectDirBtn.addEventListener('click', function(event) {
    ipc.send('open-file-dialog');
});

startBtn.addEventListener('click', function(event) {
    ipc.send('start_pushed');
});

ipc.on('select_directory', function(event, path) {
    console.log('path: ', path);
    document.getElementById('selected_directory_input').value = `${path}`;
});

ipc.on('found_file', function(event, root, name) {
    console.log('found_file:', root, name);

    document.getElementById('folder_input').value = `${root}`;
    document.getElementById('file_input').value = `${name}`;
});

ipc.on('num_video_files', function(event, num, total) {
    console.log('num_video_files:', num, total);
    document.getElementById('all_files_complete').innerHTML = `${num} / ${total}`;
});

ipc.on('set_status', function(event, msg) {
    console.log('set_status:', msg);
    document.getElementById('status_input').value = `${msg}`;
});

ipc.on('hb_progress', function(event, percent, eta, fps, task, overall) {
    document.getElementById('current_file_percent').innerHTML = `${percent}%`;
    $(document).find('#current_file_progress_bar').find('.progress-bar').css('width', `${percent}%`);
    $(document).find('#all_files_progress_bar').find('.progress-bar').css('width', `${overall}%`);
    var status_comment = 'Converting...';

    if (task) {
        status_comment += ` Task: ${task}`;
    }

    if (eta) {
        status_comment += ` ETA: ${eta}`;
    }

    if (fps) {
        status_comment += ` FPS: ${fps}`;
    }

    $(document).find('#status_input').val(status_comment);
})
