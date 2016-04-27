module.exports = function(config){
    config.set({

        basePath : './',

        files : [
            'app/bower_components/angular/angular.js',
            'app/bower_components/angular-mocks/angular-mocks.js',
            'app/bower_components/lodash/lodash.js',
            'app/Queue.js',
            'test/**/*.js'
        ],

        autoWatch : true,

        frameworks: ['jasmine'],

        //browsers : ['Chrome'],
        browsers: ['PhantomJS'],

        plugins : [
            'karma-phantomjs-launcher',
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            'karma-jasmine',
            'karma-junit-reporter'
        ],

        junitReporter : {
            outputFile: 'test_out/unit.xml',
            suite: 'unit'
        }

    });
};
