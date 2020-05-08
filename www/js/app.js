// (c) 2014 Don Coleman
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

angular.module('ionicNFC', ['ionic', 'nfcFilters'])
    .constant('common', { nfc: { initialized: false } })
    .controller('MainController', function ($scope, nfcService, $ionicPopup, common) {

        $scope.tag = nfcService.tag;
        $scope.nfc = common.nfc;
        $scope.content = {};
        nfcService.initialize();

        $scope.clear = function () {
            nfcService.clearTag();
        };
        $scope.isIOS = ionic.Platform.isIOS();

        $scope.write = function () {
            // nfcService.writeTag("aBcD一二三四dCbA");
            $scope.content = {};
            $ionicPopup.show({
                template: '<input type="text" ng-model="content.msg">',
                title: '输入要写入的内容',
                scope: $scope,
                buttons: [
                    { text: '取消' },
                    {
                        text: '<b>确定</b>',
                        type: 'button-positive',
                        onTap: function (e) {
                            console.debug('content.msg: ', $scope.content.msg);
                            if (!$scope.content.msg) {
                                //don't allow the user to close unless he enters wifi password
                                e.preventDefault();
                            } else {
                                nfcService.writeTag($scope.content.msg);
                            }
                        }
                    }
                ]
            });
        }
        $scope.erase = function () {
            nfcService.eraseTag();
        }
        $scope.beginSession = function () {
            nfcService.beginSession();
        }
        $scope.initialize = function () {
            nfcService.initialize().then(function () {
                console.debug('common initialized:', common.nfc.initialized);
                console.debug('initialized: ', $scope.nfc.initialized);
            });
        }
    })

    .factory('nfcService', function ($rootScope, $ionicPlatform, common, $q, $ionicPopup) {

        var tag = {};

        function initialize() {
            var q = $q.defer();
            $ionicPlatform.ready(function () {
                nfc.enabled(function (status) {
                    console.debug('nfc status:', status);
                    addListener().then(q.resolve, q.reject);
                }, function (reason) {
                    console.warn('nfc disabled: ', reason);
                    $ionicPopup.confirm({
                        title: 'NFC未启用',
                        template: '前往设置？'
                    }).then(function (res) {
                        if (res) {
                            nfc.showSettings(function () {
                                console.debug('nfc show setting ok');
                                q.reject();
                            }, function (reason) {
                                console.warn('nfc show setting error', reason);
                                q.reject(reason);
                            });
                        } else {
                            q.reject();
                        }
                    });

                    // q.reject(reason);
                });
                // addTagDiscoveredListener 可读id； addNdefListener 可读内容，没内容时读不出信息，连 id 也没有
            });
            return q.promise;
        }
        function addListener() {
            var q = $q.defer();
            nfc.addNdefListener(function (nfcEvent) {
                console.log("addNdefListener");
                $rootScope.$apply(function () {
                    angular.copy(nfcEvent.tag, tag);
                    // if necessary $state.go('some-route')
                });
            }, function () {
                console.log("Listening for NDEF Tags.");
                common.nfc.initialized = true;
                console.debug("initialized: ", common.nfc.initialized);
                q.resolve();
            }, function (reason) {
                alert("Error adding NFC Listener " + reason);
                q.reject(reason);
            });
            nfc.addTagDiscoveredListener(function (nfcEvent) {
                console.log("addTagDiscoveredListener: " + JSON.stringify(nfcEvent.tag));
                $rootScope.$apply(function () {
                    angular.copy(nfcEvent.tag, tag);
                    // if necessary $state.go('some-route')
                });
            }, function () {
                console.log("Listening for TagDiscovered Tags.");
                common.nfc.initialized = true;
                console.debug("initialized: ", common.nfc.initialized);
                q.resolve();
            }, function (reason) {
                alert("Error adding TagDIscovered Listener " + reason);
                q.reject(reason);
            });
            return q.promise;
        }


        function writeTag(content) {
            var message = [
                ndef.textRecord(content),
            ];
            nfc.write(message, function (r) {
                console.log(r);
                alert("写入成功");
            }, function (e) {
                console.error(e);
                alert("写入出错!!!");
            })
        }
        function eraseTag() {
            nfc.erase(function (r) {
                console.log(r);
                alert("擦除成功");
            }, function (e) {
                console.error(e);
                alert("擦除出错!!!");
            })
        }
        function beginSession() {
            nfc.beginSession(function () {
                console.log("beginSession");
            });
        }
        return {
            tag: tag,

            clearTag: function () {
                angular.copy({}, this.tag);
            },

            writeTag: writeTag,
            eraseTag: eraseTag,
            beginSession: beginSession,
            initialize: initialize
        };
    });