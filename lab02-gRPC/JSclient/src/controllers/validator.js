'use strict';

const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const filmSchema = require('../json-schemas/film_schema.json');
const userSchema = require('../json-schemas/user_schema.json');
const reviewSchema = require('../json-schemas/review_schema.json');

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const validateFilm = ajv.compile(filmSchema);
const validateUser = ajv.compile(userSchema);
const validateReview = ajv.compile(reviewSchema);

module.exports = {
  validateFilm,
  validateUser,
  validateReview
};