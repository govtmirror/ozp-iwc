/* global debuggerModule */
debuggerModule.controller("metricsController", ['$scope', '$interval', '$filter', 'iwcClient', "$log", function (scope, $interval, $filter, client, log) {
    var filter = $filter('filter');
    scope.updateFrequency = 1000;
    scope.metricWindow = 60000;
    scope.updateActive = false;
    scope.metrics = [];
    scope.metricsActive = 0;
    var metricsByName = {};

    scope.selectAllFilteredItems = function (state) {
        var filtered = filter(scope.metrics, {'name': scope.viewFilter});

        angular.forEach(filtered, function (item) {
            item.visible = state;
        });
    };

    var ensureGroup = function (name) {
//        if(scope.groupVisibility[name]===undefined) {
//            scope.groupVisibility[name]=(name.match("participants.*receivedPackets.rate1m")!==null);
//        }
        if (metricsByName[name] === undefined) {
            var metricDef = {
                name: name,
                visible: false
            };
            scope.metrics.push(metricDef);
            metricsByName[name] = metricDef;
        }

    };

    var updateWanted = function (name) {
        return metricsByName[name].visible;
    };

    var pushDataPoint = function (dataPoints, name, time, value) {
        ensureGroup(name);
        if (updateWanted(name)) {
            dataPoints.push({
                group: name,
                x: time,
                y: value
            });
        }
    };
    scope.refresh = function () {
        var dataPoints = [];
        var nowDate = new Date();
        client.getMetrics().then(function (metrics) {
            metrics.forEach(function (m) {
                if (typeof m.value === "object") {
                    for (var k in m.value) {
                        pushDataPoint(dataPoints, m.name + "." + k, nowDate, m.value[k]);
                    }
                } else {
                    pushDataPoint(dataPoints, m.name, nowDate, m.value);
                }
            });
            scope.$apply();
            scope.$broadcast('timeSeriesData', dataPoints);
            scope.metricsActive = dataPoints.length;
        });
    };

    client.connect().then(function () {
        scope.refresh();
    }).catch(function(err) {
        log.error(err);
    });

    var timer = null;
    var updateTimer = function () {
        if (timer) {
            $interval.cancel(timer);
        }
        if (scope.updateActive) {
            timer = $interval(scope.refresh, scope.updateFrequency);
        }
    };


    scope.$watch('updateActive', updateTimer);
    scope.$watch('updateFrequency', updateTimer);
}]);

debuggerModule.directive("metrics", [function () {
    return {
        restrict: 'E',
        templateUrl: 'templates/metrics.tpl.html'
    };
}]);

debuggerModule.directive("metricsToolbar", [function () {
    return {
        restrict: 'E',
        templateUrl: 'templates/metricsToolbar.tpl.html'
    };
}]);

debuggerModule.directive("metricsContent", [function () {
    return {
        restrict: 'E',
        templateUrl: 'templates/metricsContent.tpl.html'
    };
}]);

debuggerModule.directive("metricsDetail", [function () {
    return {
        restrict: 'E',
        templateUrl: 'templates/metricsDetail.tpl.html'
    };
}]);
