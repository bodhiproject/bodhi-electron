'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

require("babel-core/register");
require('babel-polyfill');

var restify = require('restify');
var corsMiddleware = require('restify-cors-middleware');

var _require = require('child_process'),
    spawn = _require.spawn;

var _require2 = require('graphql'),
    execute = _require2.execute,
    subscribe = _require2.subscribe;

var _require3 = require('subscriptions-transport-ws'),
    SubscriptionServer = _require3.SubscriptionServer;

var schema = require('./schema');

var syncRouter = require('./route/sync');
var apiRouter = require('./route/api');

var startSync = require('./sync');

var PORT = 5555;

var server = restify.createServer({
  title: 'Bodhi Synchroniser'
});

var cors = corsMiddleware({
  origins: ['*']
});
server.pre(cors.preflight);
server.use(cors.actual);
server.use(restify.plugins.bodyParser({ mapParams: true }));
server.use(restify.plugins.queryParser());
server.on('after', function (req, res, route, err) {
  if (route) {
    console.log(route.methods[0] + ' ' + route.spec.path + ' ' + res.statusCode);
  } else {
    console.log('' + err.message);
  }
});

var startAPI = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            syncRouter.applyRoutes(server);
            apiRouter.applyRoutes(server);

            server.get(/\/?.*/, restify.plugins.serveStatic({
              directory: './ui',
              default: 'index.html'
            }));

            server.listen(PORT, function () {
              SubscriptionServer.create({ execute: execute, subscribe: subscribe, schema: schema }, { server: server, path: '/subscriptions' });
              console.log('Bodhi API server running on http://localhost:' + PORT + '.');
            });

          case 4:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function startAPI() {
    return _ref.apply(this, arguments);
  };
}();

var qtumprocess = spawn('./qtum/bin/qtumd', ['-testnet', '-logevents', '-rpcuser=bodhi', '-rpcpassword=bodhi']);

qtumprocess.stdout.on('data', function (data) {
  console.log('stdout: ' + data);
});

qtumprocess.stderr.on('data', function (data) {
  console.log('qtum node cant start with error: ' + data);
  process.exit();
});

qtumprocess.on('close', function (code) {
  console.log('qtum node exited with code ' + code);
  process.exit();
});

function exit(signal) {
  console.log('Received ' + signal + ', exiting');
  qtumprocess.kill();
}

process.on(['SIGINT', 'SIGTERM'], exit);

// 3s is sufficient for qtumd to start
setTimeout(function () {
  startSync();
  startAPI();
}, 3000);