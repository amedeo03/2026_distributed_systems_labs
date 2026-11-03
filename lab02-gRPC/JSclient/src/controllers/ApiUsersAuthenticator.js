'use strict';

var utils = require('../utils/writer.js');
const userService = require('../service/UsersService.js');
const link = require('./link');

module.exports.authenticateUser = function authenticateUser (req, res, next) {
  userService.authenticateUser(req, res, next)
    .then(function (response) {
      utils.writeJson(res, link.addToUser(response), 200);
    })
    .catch(function (err) {
      if(err === 'NO_USER') {
        utils.writeJson(res, { message: 'Unauthorized access.' }, 401);
      }
      else {
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': err }], }, 500);
      }
    });
};
