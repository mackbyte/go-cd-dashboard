angular.module('app.directives')
    .directive('dashboard', function() {
        return {
            templateUrl: 'templates/dashboard.html',
            restrict: 'E',
            link: function postLink($scope, element, attrs) {
                var socket = io();
                
                $scope.pipelines = {};
                
                socket.on('stage-change', function(data) {
                    $scope.pipelines = data;
                    $scope.$apply();
                });
            }
        };
    });

