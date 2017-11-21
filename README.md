Alexa-Reservations
==================

Hotel Reservation Manager for a German Kur Hotel.  The app is based on Node-Webkit and Angular. It was created using the 
[Angular Desktop A](https://github.com/jgrenon/angular-desktop-app) application skeleton.

It is build with Angular 1.4 and NW.js (0.25.4-sdk). This latest version replaces a local NoSQL db (TingoDB) with a MongoDB version.

## Project Installation

1) Download and install the tooling dependencies globally. These are `Node.js/npm`, `Grunt` and `Bower`. To install:
    1) For Node get latest from [Node.js](https://nodejs.org)
    2) For Bower: ```$> npm install -g bower```
    3) For Grunt: ```$> npm install -g grunt```

2) Download or clone the project from GitHub.
3) In a Command/Terminal window, cd to the local directory containing the code and type the following commands to load the dependencies:
```
$> npm install
$> grunt install
```
The above two commands should install all of the node and bower dependencies and also install the specific version of NW.js for your current platform.


**Special Dependency**

The app can export it's MongoDB database to a local archive. To do this, it requires that the `mongodump` app be part of this app's distribution. It must be copied manually to the *extra* folder since it is not stored in source control. The `mongodump` utility is part of the `MongoDB` distribution and the executable is located in the `bin` directory.

## Packaging & Distribution
Currently there is only a packaging option for Windows using InnoSetup. This app will create a Setup executable for the application. You can download the InnoSetup software from [here](http://www.jrsoftware.org/isdl.php)

The setup script is the file `InnoScript32.iss`. **NOTE:** this script uses absolute file paths for the source and destination files. Be sure to modify the ```#define MyBaseDir``` statement near the top of the file to point to the local project's top level directory. 

To run the script