'use strict';

var utils = require('../utils/writer.js');
const filmService = require('../service/FilmsService.js');
const link = require('./link');

module.exports.assignReviewBalanced = function assignReviewBalanced (req, res, next) {
  filmService.assignReviewBalanced()
    .then(function (response) {
      utils.writeJson(res, link.addToReview(response));
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
