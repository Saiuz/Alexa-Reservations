/**
 * Directive to display the address (Guest) or Firm list. The list will allow editing deletion and the creation of new
 * items. The list can be paged on the alphabet and there is a search field to find a specific name that functions
 * similar to the guest and firm lookup directives.
 */
define(['./module'], function (directives) {
  'use strict';
  directives.directive('axGuestFirmList', ['Guest', 'Firm', 'Reservation', 'modals', '$filter', 'convert', 'configService',
    function (Guest, Firm, Reservation, modals, $filter, convert, configService) {

      let linker = function (scope, element, attrs, modelCtrl) {
      let modechar = attrs.mode.toLowerCase().charAt(0),
          isGuest = modechar === 'a' || modechar === 'g',
          dataObjR = {data: undefined, extraData: undefined},
          model;

      scope.items = [];
      scope.headers = [];
      scope.isGuest = isGuest;
      scope.searchTxt = '';
      scope.searchTxt2 = '';
      scope.txt = configService.loctxt;
      scope.show = false;
      scope.withFirm = false;
      scope.withFirm = false;
      scope.loading = false;
      scope.lastQry = '';
      scope.lastQry2 = '';
      scope.hasErr = false;
      scope.errMsg = '';

      // watches for change in isActive and the search box texts
      scope.$watchCollection('[isActive, searchTxt, searchTxt2]', function (newVals, oldVals) {
        console.log(newVals, oldVals);
        if (newVals[0]) {
          if (isGuest) {
            scope.headers = Guest.toDisplayObjHeader(scope.withFirm);
            scope.placeholder = configService.loctxt.lastNameSearch;
            scope.placeholder2 = configService.loctxt.firmGuestSearch;
            model = modals.getModelEnum().guest;
          }
          else {
            scope.headers = Firm.toDisplayObjHeader();
            scope.placeholder = configService.loctxt.firmSearch;
            model = modals.getModelEnum().firm;
          }
          scope.show = true;
        }
        else {
          scope.show = false;
          scope.items = []; //If we are not active then clear items and hide contents of directive
        }
        // search text form ax-delayed-input directive changed or other methods changing the value.
        if (newVals[1] !== oldVals[1]) {
          if (isGuest) {
            if (newVals[1]) {
              _getGuests(newVals[1], scope.withFirm, scope.lastQry2).then().catch(err => _showErr(err));
            }
            else {
              scope.items = [];
            }
          }
          else {
            if (newVals[1]) {
              _getFirms(newVals[1]).then().catch(err => _showErr(err));
            }
            else {
              scope.items = [];
            }
          }
        }
        if (newVals[2] !== oldVals[2] || scope.lastQry) { // only applies to guests - firm search box value changed
          if (isGuest) {
            if (newVals[1] || newVals[2]) {
              _getGuests(scope.lastQry, scope.withFirm, newVals[2]).then().catch(err => _showErr(err));
            }
            else {
              scope.items = [];
            }
          }
        }
      });

      //clear callback for ax-delayed-input directive clear button
      scope.clear = function () {
        scope.lastQry = '';
      };
      scope.clear2 = function () {
        scope.lastQry2 = '';
      };

      // Alphabet buttons handler
      scope.query = function (regx) {
        scope.searchTxt = regx; //update handled in watch
      };

      // change event for the With/Without Firm buttons. Applies only to the Guest collection.
      // if we change the buttons, requery using the last query strings. Only withFirm changes.
      scope.fChange = function (hasFirm) {
        scope.withFirm = hasFirm;
        scope.searchTxt2 = '';
        scope.headers = Guest.toDisplayObjHeader(scope.withFirm);
        if (scope.lastQry) {
          _getGuests(scope.lastQry, scope.withFirm, scope.lastQry2).then().catch(err => _showErr(err));
        }
      };

      //CRUD button handlers
      scope.new = function () {
        dataObjR.data = [];
        modals.create(model,dataObjR,function(result) {
          if (result) {
            if (isGuest) {
              _getGuests(result.last_name).then().catch(err => _showErr(err));
            }
            else {
              _getFirms(result.firm_name).then().catch(err => _showErr(err));
            }
          }
        });
      };

      scope.edit = function (id) {
        dataObjR.data = id;
        modals.update(model,dataObjR,function(result) {
          if (result) {
            if (isGuest && scope.lastQry) {
              _getGuests(scope.lastQry).then().catch(err => _showErr(err));
            }
            else if (!isGuest && scope.lastQry) {
              _getFirms(scope.lastQry).then().catch(err => _showErr(err));
            }
          }
        });
      };

      scope.delete = function (id) {
        dataObjR.data = id;
        modals.delete(model,dataObjR,function(result) {
          if (result) {
            if (isGuest && scope.lastQry) {
              _getGuests(scope.lastQry).then().catch(err => _showErr(err));
            }
            else if (!isGuest && scope.lastQry) {
              _getFirms(scope.lastQry).then().catch(err => _showErr(err));
            }
          }
        });
      };

      // Method to retrieve and transform the Guest data. If firm search is true then the guests returned are
      // those that are associated with the firms that match the qryRegex
      async function _getGuests (qryRegex, firmSearch, altRegex) {
        scope.lastQry = qryRegex;
        scope.lastQry2 = altRegex;
        let fqry = scope.withFirm ? {$ne: ''} : {$eq: ''};
        let qry = firmSearch ?
                  qryRegex && altRegex ?
                  {firm: {$regex: altRegex, $options: 'i'}, last_name: {$regex: qryRegex, $options: 'i'} }
                  : qryRegex && !altRegex ?
                    {last_name: {$regex: qryRegex, $options: 'i'}, firm: fqry}
                    : {firm: {$regex: altRegex, $options: 'i'}}
                  : {last_name: {$regex: qryRegex, $options: 'i'}, firm: fqry};

        scope.loading = true;
        
        try {
          let guests = await Guest.find(qry).sort({last_name: 1}).exec();
          scope.hasErr = false;
          scope.qryCnt = guests.length;
          var rowItems = [];
          for (let i = 0; i < guests.length; i++) {
            let g = guests[i];
            let rCnt = await Reservation.count({$or: [{"guest.id": g._id},{"gust2.id": g._id}]})
            let tds = {id: g._id, cols: g.toDisplayObj(scope.withFirm, rCnt)};
            rowItems.push(tds);
          }
          scope.loading = false;
          scope.items = rowItems;
          scope.$apply();   
        } catch (err) {
          throw err;
        }
      }

      // Method to retrieve and transform the Firm data
      async function _getFirms (qryRegex) {
        scope.lastQry = qryRegex;
        let qry = {firm_name: {$regex: qryRegex, $options: 'i'}},
            priceCol = scope.headers[1];

        scope.loading = true;
        try {
          let firms = await Firm.find(qry).sort({firm_name: 1}).exec();
          scope.hasErr = false;
          scope.qryCnt = firms.length;
          var rowItems = [];
          for (let i = 0; i < firms.length; i++) {
            let g = firms[i];
            let gCnt = await Guest.count({firm: g.firm_name});
            let cols = g.toDisplayObj(gCnt);
            cols[priceCol] = $filter('currency')(cols[priceCol]);
            let tds = {id: g._id, cols: cols};
            rowItems.push(tds);
          }

          scope.loading = false;
          scope.items = rowItems;
          scope.$apply();

        } catch (err) {
          throw err;
        }
      }

     function _showErr(err) {
      scope.errMsg = err.message;
      scope.hasErr = true;
      scope.$apply();
     }

    };  //end linker

    return {
      restrict: 'E',
      link: linker,
      templateUrl: './templates/ax-guest-firm-list.html',
      scope: {
        isActive: '=', // if true then we are on a dom element that is visible.
        mode: '@' // if the mode string starts with 'a' or 'g' then use guest collection, if it starts with 'f' use Firm.
      }
    };
  }]);
});
