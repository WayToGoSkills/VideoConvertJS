module.exports.start_handbrake_conversion = start_handbrake_conversion;
module.exports.convert_using_handbrake = convert_using_handbrake;

const path = require('path');
const hbjs = require('handbrake-js');
const fs = require('fs');
// const utimes = require('@ronomon/utimes');

function start_handbrake_conversion(input_file_array, preset, event) {
    // console.log('start_handbrake_conversion');
    var index = 0;
    convert_using_handbrake(input_file_array, index, preset, event);
}

function convert_using_handbrake(input_file_array, index, preset, event) {
    // console.log('input_file:', input_file_array[index].path);
    // console.log(input_file_array[index].rotation);
    event.sender.send('num_video_files', index, input_file_array.length);
    var input_file_parse = path.parse(input_file_array[index].path);
    var output_file = input_file_parse.dir + path.sep + input_file_parse.name + '.mp4';
    var rotation = parseInt(input_file_array[index].rotation);

    // console.log('output_file:', output_file);

    var options = {
        input:      input_file_array[index].path,
        output:     output_file,
        preset:     preset
    };

    if ('rotation' in input_file_array[index]) {
        options.rotate = input_file_array[index].rotation;
    }

    // console.log('options:', options);

    hbjs.spawn(options).on('start', function() {
        // console.log(input_file_parse.name);
        event.sender.send('set_status', 'Initializing Handbrake...');
        event.sender.send('found_file', input_file_parse.dir, input_file_parse.base);
    }).on('begin', function() {
        event.sender.send('set_status', 'Converting...');
    }).on('progress', function(progress) {
        var previous_percent = index / input_file_array.length * 100;
        var future_percent = (index + 1) / input_file_array.length * 100
        ;

        var overall_percent = previous_percent + (future_percent - previous_percent) * progress.percentComplete / 100;
        // console.log('Percent Complete:', progress.percentComplete, progress.eta, overall_percent.toFixed(2), index, previous_percent, future_percent);
        event.sender.send('hb_progress',
            progress.percentComplete,
            progress.eta,
            progress.fps,
            progress.task,
            overall_percent.toFixed(2)
        );
    }).on('end', function() {
        // console.log('END!');
        setFileDate(input_file_array[index], output_file);
        ++index;
        if (index < input_file_array.length) {
            convert_using_handbrake(input_file_array, index, preset, event);
        } else {
            event.sender.send('set_status', 'Complete');
            event.sender.send('found_file', '', '');
            event.sender.send('num_video_files', index, input_file_array.length);
        }
    });
}

function setFileDate(original, converted) {
    console.log('original:', original);
    // fs.stat(original.path, function(err, stats) {
    //     console.log(stats);
    // });
    console.log('converted:', converted);
    var datestring = original.creationtime;
    var datestring_mod = datestring.replace(' ', 'T');
    // var btime = new Date(datestring_mod);
    var btime = Date.parse(datestring_mod) / 1000;
    console.log('btime:', btime);
    fs.utimesSync(converted, parseInt(btime), parseInt(btime));
}
