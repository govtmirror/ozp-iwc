/* global debuggerModule */
debuggerModule.controller("ApiDisplayCtrl", ["$scope", "$attrs", "iwcClient", "apiSettingService", "$log", function (scope, attrs, client, apiDat, log) {
    // IWC message parameters
    scope.msg = {
        api: 'data.api',  // data.api, system.api, etc
        action: 'get',    // get, set
        resource: '',     // /some/resource
        entity: '',       // {"validJSON": "true"}
        contentType: '',  // /application/something+json
        response: {}      // iwc response to our message
    };

    scope.api = attrs.api;
    scope.msg.api = scope.api;
    scope.clickActions = [];
    for (var i in apiDat.apis[scope.api].actions) {
        var action = apiDat.apis[scope.api].actions[i].action;
        scope.clickActions.push(action);
    }

    scope.keys = [];

    var statusTemplate = "<pre class='preWrap'>{{COL_FIELD | json}}</pre>";
    var containsFilterGen = function () {
        return {
            condition: function (searchTerm, cellValue) {
                return cellValue.match(searchTerm);
            },
            placeholder: 'contains'
        };
    };

    var containsFilterJSONGen = function () {
        return {
            condition: function (searchTerm, cellValue) {
                return JSON.stringify(cellValue).match(searchTerm);
            },
            placeholder: 'contains'
        };

    };

    var columnDefs = [
        {
            field: 'actions',
            displayName: "actions",
            headerCellTemplate: 'templates/headerTemplate.tpl.html',
            cellTemplate: 'templates/resourceTemplate.tpl.html',
            width: "130"

        }, {
            field: 'resource',
            displayName: 'Resource',
            //cellTemplate: 'templates/resourceTemplate.tpl.html',
            filter: containsFilterGen(),
            width: "7%"
        }, {
            field: 'contentType',
            displayName: 'Content Type',
            filter: containsFilterGen(),
            width: "7%"
        }, {
            field: 'lifespan',
            displayName: 'Lifespan',
            cellTemplate: statusTemplate,
            cellClass: 'grid-pre',
            filter: containsFilterGen(),
            width: "7%"
        }, {
            field: 'entity',
            displayName: 'Entity',
            cellTemplate: statusTemplate,
            cellClass: 'grid-pre',
            filter: containsFilterJSONGen(),
            width: "35%"
        }, {
            field: 'permissions',
            displayName: 'Permissions',
            cellTemplate: statusTemplate,
            cellClass: 'grid-pre',
            filter: containsFilterJSONGen(),
            width: "10%"
        }, {
            field: 'collection',
            displayName: 'collection',
            cellTemplate: statusTemplate,
            cellClass: 'grid-pre',
            filter: containsFilterJSONGen(),
            width: "10%"

        }];
    scope.gridOptions = {
        data: 'keys',
        columnDefs: columnDefs,
        rowHeight: 120,
        enableFiltering: true,
        onRegisterApi: function (gridApi) {
            scope.gridApi = gridApi;
            setTimeout(function () {
                scope.gridApi.core.handleWindowResize();
            }, 0);
        }
    };

    scope.loadKey = function (key) {
        client.api(scope.api).get(key.resource).then(function (response) {
            for (var i in response) {
                key[i] = response[i];
            }
            key.isLoaded = true;
            if (!scope.$$phase) {
                scope.$apply();
            }
        })["catch"](function (error) {
            console.log('Error in loadKey: ' + JSON.stringify(error));
        });
    };

    scope.validAction = function (action, contentType) {
        var actions = apiDat.apis[scope.api].actions;
        for (var i in actions) {
            if (actions[i].action === action) {
                if (actions[i].contentTypes.indexOf(contentType) > -1) {
                    return true;
                } else {
                    return false;
                }
            }
        }
        return false;
    };

    scope.performAction = function (action, key) {
        client.send({
            'dst': scope.api,
            'action': action,
            'resource': key.resource
        });
    };

    scope.init = function () {
        client.api(scope.api).list("/").then(function (response) {
            scope.keys = response.entity.map(function (k) {
                var key = {
                    'resource': k,
                    'isLoaded': false,
                    'isWatched': false
                };
                scope.loadKey(key);
                return key;
            });
        });

        client.connect().then(function () {
            scope.actions = client.apiMap[scope.api].actions;
            if (scope.gridApi && scope.gridApi.core) {
                scope.gridApi.core.handleWindowResize();
            }
        }).catch(function(err){
            log.error(err);
        });

    };

    scope.refresh = function () {
        client.api(scope.api).list("/").then(function (response) {
            var allKeys = scope.keys.slice();
            // Loop through all the resources in the api
            response.entity.forEach(function (k) {
                var newKey = true;
                // Loop through all the local resouces if match reload the key
                for(var i in allKeys){
                    if(scope.keys[i].resource === k){
                        newKey = false;
                        allKeys[i] = false;
                        scope.loadKey(scope.keys[i]);
                        break;
                    }
                }
                // If no match was found its a new resource.
                if(newKey){
                    scope.keys.push({
                        'resource': k,
                        'isLoaded': false,
                        'isWatched': false
                    });
                    scope.loadKey(scope.keys[scope.keys.length-1]);
                }
            });
            // Loop through any key that wasn't in the list response and remove it. it was
            // deleted.
            for(var i in allKeys){
                if(allKeys[i].resource){
                    for(var j in scope.keys){
                        if(scope.keys[j].resource === allKeys[i].resource){
                            scope.keys.splice(j,1);
                            break;
                        }
                    }
                }
            }
        });
    };

    scope.toggleWatchKey = function(key){
        if(key.isWatched){
            scope.unwatchKey(key);
        } else {
            scope.watchKey(key);
        }
    };

    scope.watchKey = function (key) {
        if (!key.isWatched) {
            key.isWatched = true;
            client.api(scope.api).watch(key.resource, function (response) {
                if (response.response === 'changed') {
                    scope.$evalAsync(function () {
                        key.entity = response.entity.newValue;
                        key.collection = response.entity.newCollection;
                        key.permissions = response.permissions;
                        key.contentType = response.contentType;
                    });
                }
            }).then(function (response) {
                scope.$evalAsync(function () {
                    key.entity = response.entity;
                    key.collection = response.collection;
                    key.permissions = response.permissions;
                    key.contentType = response.contentType;
                    key.watchData = {
                        msgId: response.replyTo
                    };
                });
            });
        }
    };

    scope.watchFiltered = function(keys){
        keys = keys || scope.gridApi.core.getVisibleRows(scope.gridApi.grid).map(function(row){
            return row.entity;
        });

        keys.forEach(scope.watchKey);
    };

    scope.unwatchFiltered = function(keys){
        keys = keys || scope.gridApi.core.getVisibleRows(scope.gridApi.grid).map(function(row){
            return row.entity;
        });
        keys.forEach(scope.unwatchKey);
    };

    scope.unwatchKey = function(key){
        if(key.isWatched){
            key.isWatched = false;
            client.api(scope.api).unwatch(key.resource,key.watchData);
        }
    };

    scope.sendMessage = function () {
        console.log('sending message: dst: ' + scope.msg.api + ', action: ' + scope.msg.action +
            ', resource: ' + scope.msg.resource + ', entity: ' + scope.msg.entity + ', contentType: ' +
            scope.msg.contentType);

        if (scope.entityVisible) {
            if (scope.entityFromFile && scope.msg.entity) {
                alert('Use either the manual entity or select an entity file, but you may not use both');
                return;
            }
            if (scope.entityFromFile) {
                scope.msg.entity = scope.entityFromFile;
                console.log('got file entity: ' + JSON.stringify(scope.entityFromFile));
            }

            client.api(scope.msg.api)[scope.msg.action](scope.msg.resource,
                {entity: JSON.parse(scope.msg.entity), contentType: scope.msg.contentType}).then(function (response) {
                    console.log('got response: ' + JSON.stringify(response));
                    scope.msg.response = response;
                    scope.msg.response.entity = JSON.stringify(response.entity, null, 2);
                    scope.$apply();
                });
        } else {
            client.api(scope.msg.api)[scope.msg.action](scope.msg.resource, {contentType: scope.msg.contentType}).then(function (reply) {
                console.log('got response: ' + JSON.stringify(reply));
                scope.msg.response = reply;
                scope.msg.response.entity = JSON.stringify(reply.entity, null, 2);
                scope.$apply();
            })["catch"](function (error) {
                console.log('error: ' + JSON.stringify(error));
            });
        }

    };

    scope.handleFile = function (file) {
        console.log('got file: ' + JSON.stringify(file));
    };

    // file reader stuff
    scope.readContent = function ($fileContent) {
        console.log('got file entity: ' + JSON.stringify($fileContent));
        scope.entityFromFile = $fileContent;
    };

    scope.resetForm = function () {
        scope.entityFromFile = '';
    };

    scope.writeActions = ['set', 'addChild', 'removeChild', 'invoke', 'register', 'launch'];
    scope.$watch('msg.action', function () {
        if (scope.msg && scope.msg.action) {
            scope.entityVisible = scope.writeActions.indexOf(scope.msg.action) >= 0;
        } else {
            scope.entityVisible = false;
        }
    });

    //Unwatch everything when closing the api display.
    scope.$on("$destroy", function(){
        scope.unwatchFiltered(scope.keys);
    });

    scope.init();
}]);

debuggerModule.directive("apiDisplay", function () {
    return {
        restrict: 'E',
        templateUrl: 'templates/apiDisplay.tpl.html'
    };
});

debuggerModule.directive("apiData", function () {
    return {
        restrict: 'E',
        templateUrl: 'templates/apiData.tpl.html'
    };
});

debuggerModule.directive("apiMessage", function () {
    return {
        restrict: 'E',
        templateUrl: 'templates/apiMessage.tpl.html'
    };
});
