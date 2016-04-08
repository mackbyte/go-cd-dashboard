angular.module('app.directives')
    .directive('dashboard', ['$http', function($http) {
        return {
            templateUrl: 'templates/dashboard.html',
            restrict: 'E',
            link: function postLink($scope, element, attrs) {
                $scope.pipelines = {};
                
                $http.get('/pipelines')
                    .success(function(res) {
                        $scope.pipelines = res;
                    });
            }
        };
    }]);

