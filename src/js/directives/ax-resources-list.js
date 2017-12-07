/**
 * Directive to create a list for the Resource Collection.
 * Note: Using an isActive attribute. This gives control to the host to turn the list on or off.
 * ToDo - currently there is only one resource type (Parking). If we increase the # of resources we will need a tabbed interface like ax-item-types-tabbed-list
 */
define(['./module'], function (directives) {
  'use strict';
  directives.directive('axResourcesList',
      ['Resource', '$filter', 'convert', 'modals', 'configService', 'dbEnums',
        function (Resource, $filter, convert, modals, configService, dbEnums) {
          var linker = function (scope, element, attrs, modelCtrl) {
            scope.items = [];
            scope.show = false;
            scope.hasErr = false;
            scope.errMsg = '';
            scope.txt = configService.loctxt;
            scope.txtPrice = {}; //Object that will hold each resource's numeric price in text form. (Needed for handling
                                 //number format localization since the xeditable directive doesn;t handle German number format.
            scope.resourceTypes = dbEnums.getResourceTypeEnum();

            scope.$watch('isActive', function (newVal) {
              if (newVal) {
                _getResources();
              }
              else {
                scope.show = false;
                scope.hasErr = false;
                scope.items = []; //If we are not active then clear items and hide contents of directive
              }
            });

            scope.new = function () {
              var dataObj =
                  {
                    data: undefined,
                    extraData: {}
                  },
                  model = modals.getModelEnum().resource;

              modals.create(model,dataObj,function(result) {
                _getResources();
              });
            };

            scope.update = function (id) { //id is the numeric value not the _id object.
              var num = scope.txtPrice['_' + id].replace(/[^0-9,.]/g, '');
              var item = _findItem(id);

              if (item) {
                item.price = num ? convert.deNumberToDecimal(num, true) :  0;
                item.save(function (err) {
                  if (err && num) {
                    scope.txtPrice['_' + id] = '*error*';
                  }
                  scope.$apply();
                });
              }
            };

            scope.delete = function (id) {
              modals.yesNoShow(configService.loctxt.confirmDelete + '?',function (result) {
                if (result) {
                  var item = _findItem(id);
                  if (item){
                    item.remove(function (err) {
                      if (err) {
                        scope.errMsg = err;
                        scope.hasErr = true;
                      }
                      else {
                        scope.hasErr = false;
                        _getResources();
                      }
                    });
                  }
                }
              },'','','danger');
            };

            // Retrieve the items for the specified tab category
            function _getResources() {
              Resource.find().exec(function (err, rlist) {
                if (err) {
                  scope.hasErr = true;
                  scope.errMsg = err;
                }
                else {
                  scope.hasErr = false;
                  scope.txtPrice =_convertNumToText(rlist);
                  scope.items = rlist;
                  scope.resourceType = rlist.length ? rlist[0].resource_type : '';
                  scope.show = true;
                  scope.$apply();
                }
              });
            }

            function _convertNumToText(ilist) {
              var txObj = {};
              ilist.forEach(function (i) {  //convert all numeric values to text
                if (i.price) {
                  txObj['_' + i._id] = $filter('number')(i.price, 2);
                }
              });
              return txObj;
            }

            function _findItem(id) {
              var item;
              for (var j = 0; j < scope.items.length; j++) {
                if (scope.items[j]._id === id){
                  item = scope.items[j];
                  break;
                }
              }

              return item;
            }

          };

          return {
            restrict: 'E',
            link: linker,
            templateUrl: './templates/ax-resources-list.html',
            scope: {
              isActive: '=' // if true then we are on a dom element that is visible.
            }
          };
        }]);
});


