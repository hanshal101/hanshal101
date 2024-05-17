"use strict";
(() => {
var exports = {};
exports.id = 703;
exports.ids = [703];
exports.modules = {

/***/ 4021:
/***/ ((module) => {

module.exports = import("next/dist/compiled/@vercel/og/index.node.js");;

/***/ }),

/***/ 2037:
/***/ ((module) => {

module.exports = require("os");

/***/ }),

/***/ 3475:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  headerHooks: () => (/* binding */ headerHooks),
  originalPathname: () => (/* binding */ originalPathname),
  requestAsyncStorage: () => (/* binding */ requestAsyncStorage),
  routeModule: () => (/* binding */ routeModule),
  serverHooks: () => (/* binding */ serverHooks),
  staticGenerationAsyncStorage: () => (/* binding */ staticGenerationAsyncStorage),
  staticGenerationBailout: () => (/* binding */ staticGenerationBailout)
});

// NAMESPACE OBJECT: ./node_modules/next/dist/build/webpack/loaders/next-metadata-route-loader.js?page=%2Frobots.txt%2Froute&isDynamic=1!./src/app/robots.ts?__next_metadata_route__
var robots_next_metadata_route_namespaceObject = {};
__webpack_require__.r(robots_next_metadata_route_namespaceObject);
__webpack_require__.d(robots_next_metadata_route_namespaceObject, {
  GET: () => (GET)
});

// EXTERNAL MODULE: ./node_modules/next/dist/server/node-polyfill-headers.js
var node_polyfill_headers = __webpack_require__(2394);
// EXTERNAL MODULE: ./node_modules/next/dist/server/future/route-modules/app-route/module.js
var app_route_module = __webpack_require__(9692);
var module_default = /*#__PURE__*/__webpack_require__.n(app_route_module);
// EXTERNAL MODULE: ./node_modules/next/server.js
var server = __webpack_require__(514);
;// CONCATENATED MODULE: ./src/app/robots.ts
const Robots = ()=>({
        rules: [
            {
                userAgent: "*"
            }
        ],
        sitemap: "https://hanshal101.github.io/hanshal101/sitemap.xml",
        host: "https://hanshal101.github.io/hanshal101/"
    });
/* harmony default export */ const robots = (Robots);

// EXTERNAL MODULE: ./node_modules/next/dist/build/webpack/loaders/metadata/resolve-route-data.js
var resolve_route_data = __webpack_require__(4031);
;// CONCATENATED MODULE: ./node_modules/next/dist/build/webpack/loaders/next-metadata-route-loader.js?page=%2Frobots.txt%2Froute&isDynamic=1!./src/app/robots.ts?__next_metadata_route__




const contentType = "text/plain"
const fileType = "robots"

async function GET() {
  const data = await robots()
  const content = (0,resolve_route_data.resolveRouteData)(data, fileType)

  return new server.NextResponse(content, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': "public, max-age=0, must-revalidate",
    },
  })
}

;// CONCATENATED MODULE: ./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?page=%2Frobots.txt%2Froute&name=app%2Frobots.txt%2Froute&pagePath=private-next-app-dir%2Frobots.ts&appDir=C%3A%5CUsers%5Chansh%5CDownloads%5Cwebsite-master%5Cwebsite-master%5Csrc%5Capp&appPaths=%2Frobots&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!

    

    

    

    const options = {"definition":{"kind":"APP_ROUTE","page":"/robots.txt/route","pathname":"/robots.txt","filename":"robots","bundlePath":"app/robots.txt/route"},"resolvedPagePath":"next-metadata-route-loader?page=%2Frobots.txt%2Froute&isDynamic=1!C:\\Users\\hansh\\Downloads\\website-master\\website-master\\src\\app\\robots.ts?__next_metadata_route__","nextConfigOutput":""}
    const routeModule = new (module_default())({
      ...options,
      userland: robots_next_metadata_route_namespaceObject,
    })

    // Pull out the exports that we need to expose from the module. This should
    // be eliminated when we've moved the other routes to the new format. These
    // are used to hook into the route.
    const {
      requestAsyncStorage,
      staticGenerationAsyncStorage,
      serverHooks,
      headerHooks,
      staticGenerationBailout
    } = routeModule

    const originalPathname = "/robots.txt/route"

    

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, [212,535], () => (__webpack_exec__(3475)));
module.exports = __webpack_exports__;

})();