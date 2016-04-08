module.exports = function(config) {
    config.set({
        basePath: '',
        frameworks: ['jasmine'],
        files: [
            'src/public/bower_components/angular/angular.js',
            'src/public/bower_components/angular-mocks/angular-mocks.js',
            'src/public/templates/*.html',
            'src/public/javascripts/app.js',
            'src/public/javascripts/directives/*.js',
            'test/public/**/*.js'
        ],
        preprocessors: {
            'src/public/!(bower_components)/**/*.js': ['coverage'],
            'src/public/templates/*.html': ['ng-html2js']
        },
        coverageReporter: {
            type : 'json',
            includeAllSources: true,
            dir : 'test/coverage',
            subdir: '.',
            file: 'coverage-browser.json'
        },
        ngHtml2JsPreprocessor: {
            stripPrefix: "src/public/",
            prependPrefix: "",
            moduleName: "directive-templates"
        },
        reporters: ['progress', 'coverage'],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: false,
        browsers: ['PhantomJS'],
        singleRun: true,
        concurrency: Infinity
    })
};
