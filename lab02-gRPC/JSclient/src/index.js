'use strict';

const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const OpenApiValidator = require('express-openapi-validator');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const yaml = require('js-yaml');
const swaggerUi = require('swagger-ui-express');
require('./passport-config');

const serverPort = 3001;
const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

app.use(session({
  secret: "shhhhh... it's a secret!",
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.authenticate('session'));

// Swagger UI setup
const generatedOpenApiPath =
  path.join(__dirname, 'generated/api/openapi.yaml');

const openApiDocument = yaml.load(
  fs.readFileSync(generatedOpenApiPath, 'utf8')
);

app.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument)
);

app.use(
  OpenApiValidator.middleware({
    apiSpec: path.join(__dirname, 'generated/api/openapi.yaml'),

    operationHandlers: path.join(__dirname, 'generated'),

    validateRequests: false,

    validateSecurity: {
      handlers: {
        cookieAuth: (req) => {
          if (!req.isAuthenticated()) {
            throw {
              status: 401,
              message: 'Not authorized',
            };
          }
          return true;
        },
      },
    },
  })
);

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    error: err.message,
    errors: err.errors,
  });
});

http.createServer(app).listen(serverPort, () => {
  console.log(`Server listening on http://localhost:${serverPort}\nSwagger UI available at http://localhost:${serverPort}/docs`);
});