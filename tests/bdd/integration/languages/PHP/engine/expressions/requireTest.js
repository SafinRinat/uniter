/*
 * Uniter - JavaScript PHP interpreter
 * Copyright 2013 Dan Phillimore (asmblah)
 * http://asmblah.github.com/uniter/
 *
 * Released under the MIT license
 * https://github.com/asmblah/uniter/raw/master/MIT-LICENSE.txt
 */

/*global define */
define([
    '../tools',
    '../../tools',
    'js/util',
    'js/Exception/Exception'
], function (
    engineTools,
    phpTools,
    util,
    Exception
) {
    'use strict';

    describe('PHP Engine require(...) expression integration', function () {
        var engine;

        function check(scenario) {
            engineTools.check(function () {
                return {
                    engine: engine
                };
            }, scenario);
        }

        beforeEach(function () {
            engine = phpTools.createEngine();
        });

        util.each({
            'requiring a file where include transport resolves promise with empty string': {
                code: util.heredoc(function () {/*<<<EOS
<?php
    require 'test_file.php';

EOS
*/;}), // jshint ignore:line
                options: {
                    include: function (path, promise) {
                        promise.resolve('');
                    }
                },
                expectedResult: null,
                expectedStderr: '',
                expectedStdout: ''
            },
            'requiring a file where no include transport is specified': {
                code: util.heredoc(function () {/*<<<EOS
<?php
    require 'test_file.php';

EOS
*/;}), // jshint ignore:line
                expectedException: {
                    instanceOf: Exception,
                    match: /^include\(\) :: No "include" transport is available for loading the module\.$/
                },
                expectedStderr: '',
                expectedStdout: ''
            },
            'requiring a file where include transport resolves promise with code that just contains inline HTML': {
                code: util.heredoc(function () {/*<<<EOS
<?php
    require 'print_hello_world.php';

EOS
*/;}), // jshint ignore:line
                options: {
                    include: function (path, promise) {
                        // Note that the path is passed back for testing
                        promise.resolve('hello world from ' + path + '!');
                    }
                },
                expectedResult: null,
                expectedStderr: '',
                expectedStdout: 'hello world from print_hello_world.php!'
            },
            'requiring a file where include transport resolves promise with code that contains PHP code to echo a string': {
                code: util.heredoc(function () {/*<<<EOS
<?php
    require 'print_hello.php';

EOS
*/;}), // jshint ignore:line
                options: {
                    include: function (path, promise) {
                        // Note that the path is passed back for testing
                        promise.resolve('<?php echo "hello from ' + path + '!";');
                    }
                },
                expectedResult: null,
                expectedStderr: '',
                expectedStdout: 'hello from print_hello.php!'
            },
            'requiring a file where include transport resolves promise with code that returns a string': {
                code: util.heredoc(function () {/*<<<EOS
<?php
    print 'and ' . (require 'print_hello.php') . '!';

EOS
*/;}), // jshint ignore:line
                options: {
                    include: function (path, promise) {
                        promise.resolve('<?php return "welcome back";');
                    }
                },
                expectedResult: null,
                expectedStderr: '',
                expectedStdout: 'and welcome back!'
            },
            'requiring a file where include transport resolves promise asynchronously': {
                code: util.heredoc(function () {/*<<<EOS
<?php
    print 'and ' . (require 'print_hello.php') . '!';

EOS
*/;}), // jshint ignore:line
                options: {
                    include: function (path, promise) {
                        setTimeout(function () {
                            promise.resolve('<?php return "welcome back from ' + path + '";');
                        });
                    }
                },
                expectedResult: null,
                expectedStderr: '',
                expectedStdout: 'and welcome back from print_hello.php!'
            },
            'requiring a file where include transport resolves promise with assoc. array asynchronously': {
                code: util.heredoc(function () {/*<<<EOS
<?php
var_dump(require 'get_stuff.php');
EOS
*/;}), // jshint ignore:line
                options: {
                    include: function (path, promise) {
                        setTimeout(function () {
                            promise.resolve('<?php return array("first" => 21, "second" => 23);');
                        });
                    }
                },
                expectedResult: null,
                expectedStderr: '',
                expectedStdout: util.heredoc(function () {/*<<<EOS
array(2) {
  ["first"]=>
  int(21)
  ["second"]=>
  int(23)
}

EOS
*/;}), // jshint ignore:line
            }
        }, function (scenario, description) {
            describe(description, function () {
                check(scenario);
            });
        });
    });
});
