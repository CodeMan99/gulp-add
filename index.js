/*!
 * gulp-add, https://github.com/hoho/gulp-add
 * (c) 2014 Marat Abdullin, MIT license
 */

'use strict';

var File = require('vinyl');
var PluginError = require('plugin-error');
var Stats = require('stats-ctor');
var through = require('through2');

module.exports = function(filename, content, options) {
	var files = [];
	var before = options === true;

	if (typeof filename === 'object') {
		options = content;
		content = null;
		before = options === true || (options && options.before);

		for (var file in filename) {
			if (filename.hasOwnProperty(file)) {
				var value = filename[file];

				if (typeof value === 'object' && 'content' in value) {
					content = value.content;
					options = value;
				} else {
					content = value;
					options = null;
				}

				files.push(createFile(file, content, options));
			}
		}
	} else if (typeof filename === 'string') {
		if (options && options.before) {
			before = true;
			delete options.before;
		}

		files.push(createFile(filename, content, options));
	} else {
		throw new PluginError('gulp-add', 'Unknown type of first argument: ' + typeof files);
	}

	return through.obj(function(file, enc, next) {
		if (before) {
			pushAll(this, files);
			before = null;
		}

		next(null, file);
	}, function(done) {
		pushAll(this, files);
		done(null);
	});
};

function pushAll(stream, files) {
	while (files.length > 0) {
		stream.push(files.shift());
	}
}

function createFile(path, content, options) {
	var file = new File({
		path: path
	});

	try {
		file.contents = typeof content === 'string' ? Buffer.from(content) : content;
	} catch (err) {
		throw new PluginError('gulp-add', err);
	}

	if (typeof options !== 'object' || options === null) {
		return file;
	}

	if ('mode' in options) {
		file.stat = new Stats(options.stat || null);
		file.stat.mode = options.mode;
	}

	if ('stat' in options && !file.stat) {
		file.stat = options.stat;
	}

	if (file.isBuffer() && file.stat) {
		file.stat.size = file.contents.byteLength;
	}

	for (var key in options) {
		if (key === 'contents' || key === 'content' || key === 'stat' || key === 'mode') {
			continue;
		}

		if (options.hasOwnProperty(key)) {
			file[key] = options[key];
		}
	}

	return file;
}
