'use strict';

const { validateFilm } = require('./validator');
const link = require('./link');

var utils = require('../utils/writer.js');
const filmService = require('../service/FilmsService.js');

module.exports.createFilm = function createFilm(req, res, next) {
  if (!validateFilm(req.body)) {
    return utils.writeJson(
      res,
      { errors: validateFilm.errors },
      400
    );
  }

  var film = req.body;
  var owner = req.user.id;
  filmService.createFilm(film, owner)
    .then(function (response) {
      utils.writeJson(res, link.addToFilm(response), 201);
    })
    .catch(function (response) {
      utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
    });
};
