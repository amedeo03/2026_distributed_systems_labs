'use strict';

var utils = require('../utils/writer.js');
const imageService = require('../service/ImagesService.js');
const constants = require('../utils/constants.js');
const link = require('./link');

function writeError(res, response) {
  if (response == "NO_FILMS" || response == "NO_PUBLIC_FILM") {
    utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The public film does not exist.' }], }, 404);
  }
  else if (response == "NO_IMAGES") {
    utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The image does not exist.' }], }, 404);
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

module.exports.getSingleImage = function getSingleImage(req, res, next) {
  // no Accept header (or */*) selects the first entry, i.e., the json image data structure
  var mediaType = req.accepts(['application/json'].concat(Object.keys(constants.IMAGE_FILE_TYPES)));

  if (!mediaType) {
    return utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'Not acceptable: the supported media types are application/json, image/png, image/jpeg (image/jpg) and image/gif.' }], }, 406);
  }

  if (mediaType == 'application/json') {
    imageService.getSingleImage(req.params.filmId, req.params.imageId, req.user.id)
      .then(function (response) {
        utils.writeJson(res, link.addToImage(response));
      })
      .catch(function (response) {
        writeError(res, response);
      });
    return;
  }

  imageService.getImageFile(req.params.filmId, req.params.imageId, req.user.id, constants.IMAGE_FILE_TYPES[mediaType])
    .then(function (filePath) {
      res.set('Content-Type', mediaType);
      res.sendFile(filePath, function (err) {
        if (err && !res.headersSent) {
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': err.message }], }, 500);
        }
      });
    })
    .catch(function (response) {
      writeError(res, response);
    });
};

module.exports.deleteSingleImage = function deleteSingleImage(req, res, next) {

  imageService.deleteSingleImage(req.params.filmId, req.params.imageId, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response, 204);
    })
    .catch(function (response) {
      writeError(res, response);
    });
};
