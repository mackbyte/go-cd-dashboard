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
                .respond({
                    cfa: {
                        ed1: {
                            success: false,
                            build_number: 15
                        },
                        stg: {
                            success: true,
                            build_number: 12
                        },
                        prd: {
                            success: true,
                            build_number: 10
                        }
                    },
                    ttl: {
                        ed1: {
                            success: false,
                            build_number: 25
                        },
                        stg: {
                            success: true,
                            build_number: 20
                        },
                        prd: {
                            success: true,
                            build_number: 20
                        }
                    },
                    smc: {
                        ed1: {
                            success: true,
                            build_number: 8
                        },
                        stg: {
                            success: false,
                            build_number: 7
                        },
                        prd: {
                            success: true,
                            build_number: 5
                        }
                    }
                });

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
            expect(element.find('h1').text()).toBe('Dashboard');
        });
    });
});