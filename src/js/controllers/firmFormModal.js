/**
 * Controller for the Firm Modal form. The Firm Modal form manages CRUD operations for the Firm collection.
 * The form utilizes the angular bootstrap ui Modal directive.
 * Data is passed to the controller via the 'modalParams' object injected into the controller. The object must have
 * two parameters:
 *    modalParams.mode - A string value starting with 'C', 'R', 'U', or 'D'. This determines the operational mode
 *                       of the form and is not case sensitive.
 *    modalParams.data - A property that identifies the instance of the Firm collection to work with or an optional
 *                       firm name that will be placed in the firm_name input when creating a new instance (mode 'C').
 *
 * For 'C', 'U' and 'D' operations, successful completion, after pressing the save button, the form will display a
 * success message then automatically close after a pre-defined delay. The form will return the new or updated
 * instance object. In the case of a delete operation, the _id of the deleted object will be returned.
 *
 * The form is activated, and any returned results are handled by the following code:
 *        let modalInstance = $modal.open({
 *                     templateUrl: './templates/firmFormModal.html',
 *                     controller: 'firmFormModalCtrl',
 *                     size: size,
 *                     resolve: {
 *                       modalParams: function () {
 *                         return {data: 'Test Firm', mode: 'Create'};
 *                       }
 *                     }
 *                   });
 *
 *        modalInstance.result.then(function (result) {
 *                     // handle result which is the instance of the Firm collection the modal form worked with.
 *                     // in the case of the delete ('d' mode), the id of the deleted instance is returned.
 *                   });
 *
 */
define(['./module'], function (controllers) {
  'use strict';

  controllers.controller('FirmFormModalCtrl', ['$scope',
    '$rootScope',
    '$modalInstance',
    'modalParams',
    'Firm',
    'dashboard',
    'configService',
    'modalUtility',
    function ($scope, $rootScope, $modalInstance, modalParams, Firm, dashboard, configService, utility) {
      console.log("FirmFormModal controller fired");

      let helpers = new utility.Helpers($scope, $modalInstance);
      $scope.actionMsg = '';
      $scope.saveTxt = configService.loctxt.add;
      $scope.cancelTxt = configService.loctxt.cancel;
      $scope.txt = configService.loctxt;
      $scope.deleteMode = false;
      $scope.confirmed = false;
      $scope.roomPrice = undefined; //Since we must manipulate the number (convert from de to en numbers), we can't connect to the DB model directly

      // Determine CRUD mode of form.
      // For all but 'C' the query can be by id or by the firm_name property which is also unique.
      const mode = modalParams.mode.substring(0, 1).toLowerCase();
      const qry = typeof (modalParams.data) === 'object' ? {
        '_id': modalParams.data
      } : {
        'firm_name': modalParams.data
      };
      const notFound = configService.loctxt.firm + ' "' + modalParams.data + '" ' + configService.loctxt.notFound;
      let lastFirm = '';

      switch (mode) {
        case 'c':
          $scope.title = configService.loctxt.firm_titleCreate;
          $scope.firm = new Firm();
          $scope.firm.contact = {
            name: '',
            phone: '',
            email: ''
          };
          $scope.firm.firm_name = modalParams.data;
          $scope.edit = true;
          $scope.read = false;
          break;
        case 'r':
          $scope.title = configService.loctxt.firm_titleRead;
          Firm.findOne(qry).then((firm) => {
              if (firm) {
                $scope.firm = firm;
                $scope.roomPrice = firm.room_price;
                $scope.edit = false;
                $scope.read = true;
                $scope.cancelTxt = configService.loctxt.close;
                helpers.dApply();
              } else {
                helpers.showLoadErr(notFound);
              }
            }).catch(err => helpers.showLoadErr(err));
          break;
        case 'u':
          $scope.title = configService.loctxt.firm_titleUpdate;
          Firm.findOne(qry).then((firm) => {
              if (firm) {
                lastFirm = firm.firm_name;
                $scope.firm = firm;
                $scope.roomPrice = firm.room_price;
                $scope.edit = true;
                $scope.read = false;
                $scope.saveTxt = configService.loctxt.update;
                helpers.dApply();
              } else {
                helpers.showLoadErr(notFound);
              }
            }).catch(err => helpers.showLoadErr(err));
          break;
        case 'd':
          $scope.title = configService.loctxt.firm_titleDelete;
          Firm.findOne(qry).then((firm) => {
              if (firm) {
                $scope.firm = firm;
                $scope.edit = false;
                $scope.read = true;
                $scope.deleteMode = true;
                $scope.cancelTxt = configService.loctxt.close;
                $scope.saveTxt = configService.loctxt.delete;
                helpers.dApply();
              } else {
                helpers.showLoadErr(notFound);
              }
            }).catch(err => helpers.showLoadErr(err));
          break;
      }

      // listen to changes in price
      $scope.$watch('roomPrice', function (newval) {
        if (newval) {
          $scope.firm.room_price = Number(newval);
        }
      });

      // modal button click methods
      // save button handler
      $scope.save = function () {
        //perform any pre save form validation or logic here
        // If we change the name of the firm, then we must update the guests that are
        // associated with the previous firm name!
        // TODO-NOTE: by updating guest firm field, the unique name does not get regenerated. Need to find all firms then modify and save each!!!
        let nameChanged = lastFirm && (lastFirm !== $scope.firm.firm_name);
        _saveFirm(nameChanged).then((msg) => {
          $rootScope.$broadcast(configService.constants.firmEditedEvent, $scope.firm); //fire firmEdited event, pass firm object back
          helpers.autoClose(msg, $scope.firm);
        }).catch(err => helpers.showSaveError(err));
      };

      // Delete btn handler
      $scope.delete = function (err) {
        let id = $scope.firm._id;
        $scope.firm.remove().then(() => {
            let msg = configService.loctxt.firm + configService.loctxt.success_deleted;
            helpers.autoClose(msg, id);
        }).catch(err => helpers.showSaveError(err));
      };

      //#region - private functions
      /**
       * Async function to save firm and update guests and reservations that access the firm.
       * It updates all active reservations that have the firm name (or old firm name if changed).
       * If the firm name changed then guests that are associated with the old firm name are updated.
       */
      async function _saveFirm(nameChanged) {
        try {
          let msg = '';
          await $scope.firm.save();
          let oldName = nameChanged ? lastFirm : '';
          let numAffected;

          let resAffected = await dashboard.updateFirmInReservations(oldName, $scope.firm); //update reservations
          if (nameChanged) {
            let numAffected = await dashboard.updateFirmInGuests(lastFirm, $scope.firm.firm_name);
          }

          msg = (mode === 'c' ? configService.loctxt.firm + configService.loctxt.success_saved :
            `${configService.loctxt.success_changes_saved} ${numAffected}, ${configService.loctxt.guests} ${resAffected} ${configService.loctxt.reservations}`);

          return msg;
        } catch (err) {
          throw err;
        }
      }
      //#endregion
    }
  ]);
});