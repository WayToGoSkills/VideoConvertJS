module.exports.start_handbrake_conversion = start_handbrake_conversion;
module.exports.convert_using_handbrake = convert_using_handbrake;

const path = require('path');
const hbjs = require('handbrake-js');

function start_handbrake_conversion(input_file_array, event) {
    console.log('start_handbrake_conversion');
    var index = 0;
    convert_using_handbrake(input_file_array, index, event);
}

function convert_using_handbrake(input_file_array, index, event) {
    console.log('input_file:', input_file_array[index]);
    var input_file_parse = path.parse(input_file_array[index]);
    var output_file = input_file_parse.name + '.m4v';

    console.log('output_file:', output_file);

    hbjs.spawn({
        input:  input_file_array[index],
        output: output_file
    }).on('start', function() {
        console.log(input_file_parse.name);
        event.sender.send('set_status', 'Initializing Handbrake...');
        event.sender.send('found_file', input_file_parse.dir, input_file_parse.base);
    }).on('begin', function() {
        event.sender.send('set_status', 'Converting...');
    }).on('progress', function(progress) {
        console.log('Percent Complete:', progress.percentComplete, progress.eta);
        event.sender.send('hb_progress',
            progress.percentComplete,
            progress.eta,
            progress.fps,
            progress.task
        );
    }).on('end', function() {
        console.log('END!');
        ++index;
        convert_using_handbrake(input_file_array, index, event);
    });
}
