angular.module('app.directives')
    .directive('dashboard', ['$http', function($http) {
        return {
            templateUrl: 'templates/dashboard.html',
            restrict: 'E',
            link: function postLink($scope, element, attrs) {
                $scope.pipelineGroups = {};

                $http.get('/pipelines')
                    .success(function(res) {
                        $scope.pipelineGroups = res;
                    });

                $scope.stripPipelineName = function(groupName, pipelineLabel) {
                    return pipelineLabel.replace(groupName+"-", "")
                };

                $scope.getStatusClass = function(status) {
                    if(status === 'Passed') {
                        return 'stage-success';
                    } else if(status === 'Unknown') {
                        return 'stage-unknown';
                    } else {
                        return 'stage-failed';
                    }
                };
            }
        };
    }]);

