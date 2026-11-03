'use strict';

var utils = require('../utils/writer.js');
const link = require('./link');

module.exports.getFilmManager = function getFilmManager (req, res, next) {
  utils.writeJson(res, link.getFilmManager());
};
