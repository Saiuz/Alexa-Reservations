/**
 * Created by Owner on 2/21/2015.
 */
define(['./module'], function (directives) {
  'use strict';
  directives.directive('axItemTypesTabbedList',
      ['dbEnums', 'dashboard', '$filter', 'convert', 'configService', 'modals', 'Itemtype',
        function (dbEnums, dashboard, $filter, convert, configService, modals, Itemtype) {

      var linker = function (scope, element, attrs) {
        scope.txt = configService.loctxt;
        scope.show = false;
        scope.loading = false;
        scope.hasErr = false;
        scope.errMsg = '';
        scope.tabs = [];

        scope.$watchCollection('[isActive, itemTypes]', function (newvals) {
          if (newvals[0] && newvals[1]) {
            scope.show = true;
            //set to first tab and get data for first tab
            var ix = 0,
                tabarr = [];
            scope.itemTypes.forEach(function (itype) {
              var tab = {
                index: ix,
                title: itype.title,
                category: itype.category,
                active: ix === 0,
                lowTax: itype.lowTax,
                items: [],
                txtPrice: []
              };
              tabarr.push(tab);
              ix++;
            });
            scope.tabs = tabarr;
            _getItems(0);
          }
          else {
            scope.show = false;
            scope.items = []; //If we are not active then clear items and hide contents of directive
          }

        });

        // tab selected
        scope.selected = function (tabIndex) {
          scope.tabs.forEach(function (t) {
            t.active = t.index === tabIndex;
          });
          _getItems(tabIndex);
        };

        // Retrieve the items for the specified tab category
        function _getItems(tabIndex) {
          var category = scope.tabs[tabIndex].category;
          dashboard.getItemTypeList(category).then(function (items) {
            var txtObj = {};
            scope.hasErr = false;
            scope.tabs[tabIndex].txtPrice = _convertNumToText(items);
            scope.tabs[tabIndex].items = items;
          }, function (err) {
            scope.errMsg = err;
            scope.hasErr = true;
          });
        }

        // add a new itemType
        scope.new = function (ix) {
          var dataObj =
              {
                data: undefined,
                extraData: Itemtype.simpleExpenseItemDefaults(scope.tabs[ix].category),
                shortDisplay: true
              },
              model = modals.getModelEnum().itemType;

          modals.create(model,dataObj,function(result) {
            _getItems(ix);
          });
        };

        // update the edited item
        scope.update = function (id, ix) { //id is the numeric value not the _id object.
          var num = scope.tabs[ix].txtPrice['_' + id].replace(/[^0-9,.]/g, '');
          var item = _findItem(id, ix);

          if (item) {
            item.price = num ? convert.deNumberToDecimal(num, true) :  0;
            item.save(function (err) {
              if (err && num) {
                scope.tabs[ix].txtPrice['_' + id] = '*error*';
              }
              scope.$apply();
            });
          }
        };

        scope.delete = function (id, ix) {
          modals.yesNoShow(configService.loctxt.confirmDelete + '?',function (result) {
            if (result) {
              var item = _findItem(id, ix);
              if (item){
                item.remove(function (err) {
                  if (err) {
                    scope.errMsg = err;
                    scope.hasErr = true;
                  }
                  else {
                    scope.hasErr = false;
                    _getItems(ix);
                  }
                });
              }
            }
          },'','','warning');
        };

        function _convertNumToText(ilist) {
          var txObj = {};
          ilist.forEach(function (i) {  //convert all numeric values to text
            if (i.price) {
              txObj['_' + i._id.id] = $filter('number')(i.price, 2);
            }
          });
          return txObj;
        }

        function _findItem(id, ix) {
          var item;
          for (var j = 0; j < scope.tabs[ix].items.length; j++) {
            if (scope.tabs[ix].items[j]._id.id === id){
              item = scope.tabs[ix].items[j];
              break;
            }
          }

          return item;
        }
      }; //end link function

      return {
        restrict: 'E',
        link: linker,
        templateUrl: './templates/ax-item-types-tabbed-list.html',
        scope: {
          isActive: '=', // if true then we are on a dom element that is visible.
          itemTypes: '=' // Array of objects containing the Item type categories to display and the tax rate of each category.
                         // The object has two properties 'category' and a boolean 'lowTaxRate'.
        }
      };
    }]);
});