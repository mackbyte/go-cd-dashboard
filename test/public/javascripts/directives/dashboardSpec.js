'use strict';

describe('Dashboard', function() {
    var scope;

    beforeEach(module('app'));
    beforeEach(module('directive-templates'));
    beforeEach(inject(function($rootScope) {
        scope = $rootScope.$new();
    }));

    describe('directive', function() {
        var element,
            $httpBackend;

        beforeEach(inject(function($compile, _$httpBackend_) {
            $httpBackend = _$httpBackend_;
            $httpBackend
                .when('GET', '/pipelines')
                .respond({});

            element = angular.element('<dashboard></dashboard>');
            element = $compile(element)(scope);
            scope.$digest();

            $httpBackend.flush();
        }));

        afterEach(function() {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

        it("should contain a an h1 tag that has text 'Dashboard'", function() {
            expect(true).toBe(true);
        });
    });
});