/**
 * Controller for the Guest Stay display Modal window. This modal will display 
 * information about the reservations that the specified guest has in the system.
 * There is only one modal parameter:
 *    modalParams.guest - The message to display in the modal box.
 *
 *
 * The form is activated, and the returned result is handled by the following code:
 *        let modalInstance = $modal.open({
 *                     templateUrl: './templates/billDisplayModal.html',
 *                     controller: 'BillDisplayModalCtrl',
 *                     size: size,
 *                     resolve: {
 *                       modalParams: function () {
 *                         return {reservation_number: 150021, room: 7, guest: 'Johanus Schmit'}
 *                     }
 *                   });
 *
 *        modalInstance.result.then(function (result) {
 *                     // no data returned.
 *                   });
 *
 */
define(['./module'], function (controllers) {
  'use strict';

  controllers.controller('GuestDisplayModalCtrl', ['$scope',
    '$modalInstance',
    '$filter',
    'modalParams',
    'configService',
    'Guest',
    'Firm',
    'Reservation',
    'datetime',
    'modalUtility',
    function ($scope, $modalInstance, $filter, modalParams, configService, Guest, Firm, Reservation, datetime, utility) {

      //let gui = require('nw.gui');
      let helpers = new utility.Helpers($scope, $modalInstance);
      $scope.txt = configService.loctxt;
      $scope.guest;
      $scope.resDetails;

      const notFound = configService.loctxt.guest + ' ' + configService.loctxt.notFound;
      $scope.title = "...";

      // Get basic guest information and then search for the reservations that the guest has (either primary
      // guest or secondary guest)
      $scope.isGuest = modalParams.isGuest;
      if (modalParams.isGuest) {
        _getGuestInfo().then((results) => {
          $scope.resDetails = results;
          helpers.dApply();
        }).catch(err => helpers.showLoadErr(err));
      } else {
        _getFirmInfo().then((results) => {
          $scope.resDetails = results;
          helpers.dApply();
        }).catch(err => helpers.showLoadErr(err));
      }
      //#region - private functions

      async function _getGuestInfo() {
        try {
          const guest = await Guest.findById(modalParams.entityID);
          if (!guest) throw new Error(notFound);
          $scope.title = `Reservierungsinformation für Gast: ${guest.name}`;
          $scope.guest = guest.name;
          $scope.firm = guest.firm;
          const resArr = [];
          const res = await Reservation.find({ $or: [{ "guest.id": modalParams.entityID }, { "guest2.id": modalParams.entityID }] })
            .lean()
            .sort({ start_date: -1 })
            .exec();
          res.forEach((r) => {
            const rms = r.rooms.map((rm) => {
              return rm.number.toString();
            });
            let sum = 0;
            r.expenses.forEach((e) => {
              sum += (e.price * e.count);
            });

            const rec = {
              resNum: r.reservation_number,
              from: $filter('date')(r.start_date, 'shortDate'),
              until: $filter('date')(r.end_date, 'shortDate'),
              nights: datetime.getNightsStayed(r.start_date, r.end_date),
              rooms: rms.join(", "),
              type: r.type,
              total: sum,
            };
            resArr.push(rec);
          });
          return resArr;
        } catch (err) {
          throw err;
        }
      }

      async function _getFirmInfo() {
        try {
          const firm = await Firm.findById(modalParams.entityID);
          if (!firm) throw new Error(notFound);
          $scope.title = `Reservierungsinformation für Firma: ${firm.firm_name}`;
          $scope.guest = "";
          $scope.firm = "";
          const resArr = [];
          const res = await Reservation.find({ "firm": firm.firm_name})
            .lean()
            .sort({ start_date: -1 })
            .exec();
          res.forEach((r) => {
            const rms = r.rooms.map((rm) => {
              return rm.number.toString();
            });
            let sum = 0;
            r.expenses.forEach((e) => {
              sum += (e.price * e.count);
            });

            const rec = {
              resNum: r.reservation_number,
              from: $filter('date')(r.start_date, 'shortDate'),
              until: $filter('date')(r.end_date, 'shortDate'),
              nights: datetime.getNightsStayed(r.start_date, r.end_date),
              rooms: rms.join(", "),
              type: r.type,
              total: sum,
            };
            resArr.push(rec);
          });
          //get guest info
          const gList = await Guest.find({firm: firm.firm_name}).sort({last_name: 1});
          $scope.guestList = gList;
          return resArr;
        } catch (err) {
          throw err;
        }
      }

      //#endregion

    }
  ]);
});