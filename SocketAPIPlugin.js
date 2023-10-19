/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/plugin/index.ts":
/*!*****************************!*\
  !*** ./src/plugin/index.ts ***!
  \*****************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const fs_1 = __importDefault(__webpack_require__(/*! fs */ "fs"));
const path_1 = __importDefault(__webpack_require__(/*! path */ "path"));
class SocketAPIPlugin {
    constructor(props) {
        this.#props = { ...props };
    }
    #props;
    apply(compiler) {
        compiler.hooks.beforeRun.tap('SocketAPIPlugin', () => {
            const imports = [];
            const types = [];
            this.#props.controllerRootPaths.forEach(controllerRootPath => {
                const controllerFiles = this.#identifyControllerFiles(controllerRootPath);
                const controllerDetails = controllerFiles.map(file => this.#extractControllerDetails(file)).filter(v => v != null);
                controllerDetails.forEach(({ file, name, type }) => {
                    imports.push(`import type { ${type} } from '${path_1.default.relative(this.#props.generatedControllerTypesFileName, file)}';`);
                    types.push(`'${name}': createSocketProxy<${type}>('${name}'),`);
                });
            });
            console.log({ imports, types });
        });
    }
    #identifyControllerFiles(controllerRootPath) {
        const files = [];
        const entries = fs_1.default.readdirSync(controllerRootPath, { withFileTypes: true });
        entries.forEach(entry => {
            if (entry.isDirectory()) {
                files.push(...this.#identifyControllerFiles(entry.name));
            }
            else if (entry.isFile() && entry.name.endsWith('.ts')) {
                files.push(path_1.default.resolve(controllerRootPath, entry.name));
            }
        });
        return files;
    }
    #extractControllerDetails(controllerFilePath) {
        return {
            file: controllerFilePath,
            name: '',
            type: '',
        };
    }
}
module.exports = SocketAPIPlugin;


/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

module.exports = require("fs");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("path");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/plugin/index.ts");
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;