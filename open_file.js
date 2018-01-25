const ipc = require('electron').ipcRenderer;
const selectDirBtn = document.getElementById('select_directory');

selectDirBtn.addEventListener('click', function(event) {
    ipc.send('open-file-dialog');
});

ipc.on('select_directory', function(event, path) {
    console.log('path: ', path);
    document.getElementById('selected_directory').innerHTML = `You selected: ${path}`;
});
