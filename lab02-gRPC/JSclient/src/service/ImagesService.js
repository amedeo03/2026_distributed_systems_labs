'use strict';
const fs = require('fs');
const path = require('path');
const serviceUtils = require('../utils/serviceUtils.js');
const constants = require('../utils/constants.js');
const db = require('../components/db');
const converter = require('../components/converter');

const FILE_TYPES = [...new Set(Object.values(constants.IMAGE_FILE_TYPES))];

function filePath(imageId, fileType) {
  return path.join(constants.IMAGES_DIR, imageId + '.' + fileType);
}

function removeFile(file) {
  return fs.promises.unlink(file).catch((err) => {
    if (err.code != 'ENOENT') throw err;
  });
}

function dbGet(sql, params) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
  });
}

function dbAll(sql, params) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
  });
}

function dbRun(sql, params) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) { err ? reject(err) : resolve(this); });
  });
}

/**
 * Check that the public film exists and that the user can access its images
 *
 * Input:
 * - filmId: ID of the film
 * - userId: ID of the user performing the operation
 * - ownerOnly: true if only the owner can perform the operation, false if also the reviewers can
 * Output:
 * - rejects with NO_FILMS, NO_PUBLIC_FILM, USER_NOT_OWNER or USER_NOT_OWNER_NOR_REVIEWER
 **/
async function checkFilmAccess(filmId, userId, ownerOnly) {
  const film = await dbGet('SELECT owner, private FROM films WHERE id = ?', [filmId]);
  if (film == undefined)
    throw "NO_FILMS";
  if (film.private == 1)
    throw "NO_PUBLIC_FILM";
  if (film.owner == userId)
    return;
  if (ownerOnly)
    throw "USER_NOT_OWNER";
  const review = await dbGet('SELECT 1 FROM reviews WHERE filmId = ? AND reviewerId = ?', [filmId, userId]);
  if (review == undefined)
    throw "USER_NOT_OWNER_NOR_REVIEWER";
}

async function getImage(filmId, imageId) {
  const row = await dbGet('SELECT * FROM images WHERE id = ? AND filmId = ?', [imageId, filmId]);
  if (row == undefined)
    throw "NO_IMAGES";
  return serviceUtils.createImage(row);
}

/**
 * Associate a new image to a public film
 *
 * Input:
 * - filmId: ID of the film
 * - owner: ID of the user who is uploading the image
 * - file: the uploaded file (multer file object, already stored on disk with a temporary name)
 * Output:
 * - the created image
 **/
exports.addImage = async function (filmId, owner, file) {
  try {
    await checkFilmAccess(filmId, owner, true);
    const name = path.parse(file.originalname).name;
    const result = await dbRun('INSERT INTO images(filmId, name) VALUES(?,?)', [filmId, name]);
    try {
      await fs.promises.rename(file.path, filePath(result.lastID, constants.IMAGE_FILE_TYPES[file.mimetype]));
    } catch (err) {
      await dbRun('DELETE FROM images WHERE id = ?', [result.lastID]);
      throw err;
    }
    return serviceUtils.createImage({ id: result.lastID, filmId: Number(filmId), name: name });
  } catch (err) {
    await removeFile(file.path);
    throw err;
  }
};

/**
 * Retrieve the images associated to a public film
 *
 * Input:
 * - filmId: ID of the film
 * - userId: ID of the user (owner or reviewer of the film)
 * Output:
 * - list of the images
 **/
exports.getImages = async function (filmId, userId) {
  await checkFilmAccess(filmId, userId, false);
  const rows = await dbAll('SELECT * FROM images WHERE filmId = ?', [filmId]);
  return rows.map((row) => serviceUtils.createImage(row));
};

/**
 * Retrieve an image associated to a public film
 *
 * Input:
 * - filmId: ID of the film
 * - imageId: ID of the image
 * - userId: ID of the user (owner or reviewer of the film)
 * Output:
 * - the image
 **/
exports.getSingleImage = async function (filmId, imageId, userId) {
  await checkFilmAccess(filmId, userId, false);
  return getImage(filmId, imageId);
};

/**
 * Retrieve the file of an image associated to a public film, in the requested file type.
 * If the file is not stored with that file type, it is converted by the Converter service and stored.
 *
 * Input:
 * - filmId: ID of the film
 * - imageId: ID of the image
 * - userId: ID of the user (owner or reviewer of the film)
 * - fileType: requested file type ('png', 'jpg' or 'gif')
 * Output:
 * - absolute path of the image file
 **/
exports.getImageFile = async function (filmId, imageId, userId, fileType) {
  await checkFilmAccess(filmId, userId, false);
  const image = await getImage(filmId, imageId);

  const target = filePath(image.id, fileType);
  if (fs.existsSync(target))
    return target;

  const sourceType = FILE_TYPES.find((type) => fs.existsSync(filePath(image.id, type)));
  if (sourceType == undefined)
    throw "The image file is not available.";
  return converter.convertFile(filePath(image.id, sourceType), sourceType, target, fileType);
};

/**
 * Delete the images (and their files) associated to a film
 *
 * Input:
 * - filmId: ID of the film
 * Output:
 * - no response expected for this operation
 **/
exports.deleteFilmImages = async function (filmId) {
  const rows = await dbAll('SELECT id FROM images WHERE filmId = ?', [filmId]);
  await dbRun('DELETE FROM images WHERE filmId = ?', [filmId]);
  for (const row of rows)
    await Promise.all(FILE_TYPES.map((type) => removeFile(filePath(row.id, type))));
};

/**
 * Delete an image associated to a public film, together with its files
 *
 * Input:
 * - filmId: ID of the film
 * - imageId: ID of the image
 * - owner: ID of the user who is deleting the image
 * Output:
 * - no response expected for this operation
 **/
exports.deleteSingleImage = async function (filmId, imageId, owner) {
  await checkFilmAccess(filmId, owner, true);
  const image = await getImage(filmId, imageId);
  await dbRun('DELETE FROM images WHERE id = ?', [image.id]);
  await Promise.all(FILE_TYPES.map((type) => removeFile(filePath(image.id, type))));
  return null;
};
