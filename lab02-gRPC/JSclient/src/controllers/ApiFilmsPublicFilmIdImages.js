'use strict';

const fs = require('fs');
var utils = require('../utils/writer.js');
const imageService = require('../service/ImagesService.js');
const link = require('./link');

const ACCEPTED_MEDIA_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];

function writeError(res, response) {
  if (response == "NO_FILMS" || response == "NO_PUBLIC_FILM") {
    utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The public film does not exist.' }], }, 404);
  }
  else if (response == "USER_NOT_OWNER") {
    utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user is not the owner of the film' }], }, 403);
  }
  else if (response == "USER_NOT_OWNER_NOR_REVIEWER") {
    utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user is neither the owner nor a reviewer of the film' }], }, 403);
  }
  else {
    utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
  }
}

module.exports.addImage = function addImage(req, res, next) {
  var file = (req.files || []).find(function (f) { return f.fieldname == 'image'; });

  if (file == undefined) {
    return utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The image file is missing (expected in the "image" multipart field).' }], }, 400);
  }
  if (!ACCEPTED_MEDIA_TYPES.includes(file.mimetype)) {
    // discard the file if the uploader already stored it on disk
    if (file.path) {
      fs.unlink(file.path, function () { });
    }
    return utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'Unsupported media type: only PNG, JPEG and GIF images are accepted.' }], }, 415);
  }

  imageService.addImage(req.params.filmId, req.user.id, file)
    .then(function (response) {
      utils.writeJson(res, link.addToImage(response), 201);
    })
    .catch(function (response) {
      writeError(res, response);
    });
};

module.exports.getImages = function getImages(req, res, next) {

  imageService.getImages(req.params.filmId, req.user.id)
    .then(function (response) {
      utils.writeJson(res, link.addToImage(response));
    })
    .catch(function (response) {
      writeError(res, response);
    });
};
