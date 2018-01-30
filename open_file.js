const ipc = require('electron').ipcRenderer;

$(document).on('click', '#select_directory', function(event) {
    ipc.send('open-file-dialog');
});

$(document).on('click', '#start', function(event) {
    var dir = $(document).find('#selected_directory_input').val();
    var reconvert = false;
    var recursive = false;
    var preset = $(document).find('#select_preset').val();

    if ($(document).find('#reconvert').hasClass('btn-primary')) {
        reconvert = true;
    }
    if ($(document).find('#recursive').hasClass('btn-primary')) {
        recursive = true;
    }
    ipc.send('start_pushed', dir, recursive, reconvert, preset);
});

$(document).on('click', '#quit', function(event) {
    ipc.send('quit_app');
});

$(document).on('click', '.option_button', function() {
    $(this).toggleClass('affirmative');
    $(this).toggleClass('btn-primary').toggleClass('btn-outline-primary');
});

ipc.on('select_directory', function(event, path) {
    console.log('path: ', path);
    $(document).find('#selected_directory_input').val(`${path}`);
});

ipc.on('found_file', function(event, root, name) {
    console.log('found_file:', root, name);

    $(document).find('#folder_input').val(`${root}`);
    $(document).find('#file_input').val(`${name}`);
});

ipc.on('num_video_files', function(event, num, total) {
    console.log('num_video_files:', num, total);
    $(document).find('#all_files_complete').html(`${num} / ${total}`);
});

ipc.on('set_status', function(event, msg) {
    console.log('set_status:', msg);
    $(document).find('#status_input').val(`${msg}`);
});

ipc.on('hb_progress', function(event, percent, eta, fps, task, overall) {
    $(document).find('#current_file_percent').html(`${percent}%`);
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
});
