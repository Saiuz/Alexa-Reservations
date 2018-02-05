/**
 * Service based on https://github.com/DWand/nw-fileDialog
 */
define(['./module'], function (services) {
  'use strict';

  services.service('fileDialogs', [function()  {
    var callDialog = function(dialog, callback) {
      dialog.addEventListener('change', function() {
        var result = dialog.value;
        callback(result);
      }, false);
      dialog.click();
    };

    var dialogs = {};

    dialogs.saveAs = function(callback,  defaultFilename, acceptTypes) {
      let dialog =  _getDialog(); 
      dialog.nwsaveas = defaultFilename || '';
      if (angular.isArray(acceptTypes)) {
        dialog.accept = acceptTypes.join(',');
      } else if (angular.isString(acceptTypes)) {
        dialog.accept = acceptTypes;
      }
      callDialog(dialog, callback);
    };

    dialogs.openFile = function(callback, workingDir, multiple, acceptTypes) {
      let dialog =  _getDialog(); 
      if (multiple) {
        dialog.multiple = 'multiple';
      }
      if (workingDir) {
        dialog.nwworkingdir = workingDir;
      }
      if (angular.isArray(acceptTypes)) {
        dialog.accept = acceptTypes.join(',');
      } else if (angular.isString(acceptTypes)) {
        dialog.accept = acceptTypes;
      }
      callDialog(dialog, callback);
    };

    dialogs.openDir = function(callback, workingDir) {
      let dialog =  _getDialog(); 
      dialog.nwdirectory = 'nwdirectory';
      dialog.nwworkingdir = workingDir;
      callDialog(dialog, callback);
    };

    /**
     * gets the file input element on the document
     * if it exists or it will create it.
     * Resets a number of basic properties if it exists.
     */
    function _getDialog() {
      let dialog =  document.getElementById('fileDialog'); 
      if (!dialog) {
        document = document.createElement('input');
        dialog.type = 'file';
        dialog.id = 'fileDialog';
      } else { // reset existing properties
        dialog.nwdirectory = '';
        dialog.nwsaveas = '';
        dialog.nwworkingdir = '';
        dialog.multiple = false;
        dialog.accept = '';
        dialog.value = '';
      }

      return dialog;
    }
    return dialogs;
  }]);
});