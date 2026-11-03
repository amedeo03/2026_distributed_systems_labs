'use strict';

module.exports.getFilmManager = function getFilmManager() {
  return {
    films: '/api/films/',
    privateFilms: '/api/films/private/',
    publicFilms: '/api/films/public/',
    invitedPublicFilms: '/api/films/public/invited',
    reviewAssignments: '/api/films/public/assignments',
    users: '/api/users/',
    usersAuthenticator: '/api/users/authenticator'
  };
};

module.exports.addToFilm = function addToFilm(response) {
  if (response == null) {
    return response;
  }

  if (Array.isArray(response)) {
    return response.map(function (film) {
      var basePath = film.private ? '/api/films/private/' : '/api/films/public/';
      var representation = {
        ...film,
        self: basePath + film.id
      };

      if (film.private == false) {
        representation.reviews = '/api/films/public/' + film.id + '/reviews';
        representation.images = '/api/films/public/' + film.id + '/images';
      }

      return representation;
    });
  }

  var basePath = response.private ? '/api/films/private/' : '/api/films/public/';
  var representation = {
    ...response,
    self: basePath + response.id
  };

  if (response.private == false) {
    representation.reviews = '/api/films/public/' + response.id + '/reviews';
    representation.images = '/api/films/public/' + response.id + '/images';
  }

  return representation;
};

module.exports.addToUser = function addToUser(response) {
  if (response == null) {
    return response;
  }

  if (Array.isArray(response)) {
    return response.map(function (user) {
      return {
        ...user,
        self: '/api/users/' + user.id
      };
    });
  }

  return {
    ...response,
    self: '/api/users/' + response.id
  };
};

module.exports.addToReview = function addToReview(response) {
  if (response == null) {
    return response;
  }

  if (Array.isArray(response)) {
    return response.map(function (review) {
      return {
        ...review,
        self: '/api/films/public/' + review.filmId + '/reviews/' + review.reviewerId
      };
    });
  }

  return {
    ...response,
    self: '/api/films/public/' + response.filmId + '/reviews/' + response.reviewerId
  };
};

module.exports.addToImage = function addToImage(response) {
  if (response == null) {
    return response;
  }

  if (Array.isArray(response)) {
    return response.map(function (image) {
      return {
        ...image,
        self: '/api/films/public/' + image.filmId + '/images/' + image.id
      };
    });
  }

  return {
    ...response,
    self: '/api/films/public/' + response.filmId + '/images/' + response.id
  };
};
