var add = require('..');
var concat = require('concat-stream');
var intoStream = require('into-stream');
var should = require('should');
var normalize = require('normalize-path');
var path = require('path');
var File = require('vinyl');
var fs = require('fs');
require('mocha');


describe('gulp-add', function() {
    describe('add()', function() {
        testAdd(
            'push two new files at end of the stream',
            add({
                'newfile1.txt': 'hello world1',
                'newfile2.txt': 'ololo piu piu'
            }),
            [
                'test/oldfile1.txt',
                'test/oldfile2.txt'
            ],
            [
                'test/oldfile1.txt', 'oldfile1',
                'test/oldfile2.txt', 'oldfile2',
                'newfile1.txt', 'hello world1',
                'newfile2.txt', 'ololo piu piu'
            ]
        );

        testAdd(
            'push one new file at the end of the stream',
            add('newfile1.txt', 'hello world2'),
            [
                'test/oldfile1.txt',
                'test/oldfile2.txt'
            ],
            [
                'test/oldfile1.txt', 'oldfile1',
                'test/oldfile2.txt', 'oldfile2',
                'newfile1.txt', 'hello world2'
            ]
        );

        testAdd(
            'single new file as a source stream',
            add('newfile1.txt', 'hello world3'),
            [],
            ['newfile1.txt', 'hello world3']
        );

        testAdd(
            'push two new files at the front of the stream',
            add({
                'newfile1.txt': 'hello world1',
                'newfile2.txt': 'ololo piu piu'
            }, true),
            [
                'test/oldfile1.txt',
                'test/oldfile2.txt'
            ],
            [
                'newfile1.txt', 'hello world1',
                'newfile2.txt', 'ololo piu piu',
                'test/oldfile1.txt', 'oldfile1',
                'test/oldfile2.txt', 'oldfile2'
            ]
        );

        testAdd(
            'push one new file at the front of the stream',
            add('newfile1.txt', 'hello world2', true),
            [
                'test/oldfile1.txt',
                'test/oldfile2.txt'
            ],
            [
                'newfile1.txt', 'hello world2',
                'test/oldfile1.txt', 'oldfile1',
                'test/oldfile2.txt', 'oldfile2'
            ]
        );

        testAdd(
            'single new file as a source stream',
            add('newfile1.txt', 'hello world3', true),
            [],
            ['newfile1.txt', 'hello world3']
        );

        testAdd(
            'single new file with buffer content',
            add('newfile1.txt', Buffer.from('hello world4')),
            ['test/oldfile1.txt'],
            [
                'test/oldfile1.txt', 'oldfile1',
                'newfile1.txt', 'hello world4'
            ]
        );

        testAdd(
            'two new files with buffer content',
            add({
            	'newfile1.txt': Buffer.from('hello world5'),
            	'newfile2.txt': Buffer.from('hello world6')
            }),
            [
                'test/oldfile1.txt',
                'test/oldfile2.txt'
            ],
            [
                'test/oldfile1.txt', 'oldfile1',
                'test/oldfile2.txt', 'oldfile2',
                'newfile1.txt', 'hello world5',
                'newfile2.txt', 'hello world6'
            ]
        );

        testAdd(
            'single new file with stream content',
            add('stream.txt', intoStream('hello stream')),
            [
                'test/oldfile1.txt',
                'test/oldfile2.txt'
            ],
            [
                'test/oldfile1.txt', 'oldfile1',
                'test/oldfile2.txt', 'oldfile2',
                'stream.txt', 'hello stream'
            ]
        );

        testAdd(
            'multiple new files with stream content',
            add({
                 'stream1.txt': intoStream('hello stream1'),
                 'stream2.txt': intoStream('hello stream2')
            }),
            [
                'test/oldfile1.txt',
                'test/oldfile2.txt'
            ],
            [
                'test/oldfile1.txt', 'oldfile1',
                'test/oldfile2.txt', 'oldfile2',
                'stream1.txt', 'hello stream1',
                'stream2.txt', 'hello stream2'
            ]
        );

        function testAdd(name, stream, files, results) {
            it(name, function(done) {
                var checkDone = function() {
                    if (results && !results.length) {
                        results = null;
                        done();
                    }
                };

                stream.on('data', function (file) {
                    var expectedFilename = results.shift();
                    var expectedHead = results.shift();

                    should.exist(file);
                    should.exist(file.relative);
                    should.exist(file.contents);
                    should.exist(expectedFilename);
                    should.exist(expectedHead);

                    normalize(file.path).should.equal(expectedFilename);
                    normalize(file.relative).should.equal(expectedFilename);

                    if (file.isStream()) {
                        file.contents.pipe(concat(function(contents) {
                            contents.toString().substring(0, expectedHead.length).should.equal(expectedHead);
                            checkDone();
                        }));
                        return;
                    } else if (file.isBuffer()) {
                        Buffer.isBuffer(file.contents).should.equal(true);
                        file.contents.toString().substring(0, expectedHead.length).should.equal(expectedHead);
                    }

                    checkDone();
                });

                files.forEach(function (filename) {
                    stream.write(new File({
                        path: filename,
                        contents: fs.readFileSync(filename)
                    }));
                });

                stream.end();

                if (results && !results.length) {
                    results = null;
                    done();
                }
            });
        }
    });
});
