# Film Manager with gRPC Image Converter

Lab 02 project: a REST Film Manager service whose film images are converted between formats by a separate gRPC service.

| Component | Directory | Port | Description |
|---|---|---|---|
| Converter | [`JavaServer/`](JavaServer) | 50051 | Java gRPC server converting images between PNG, JPG and GIF ([`conversion.proto`](conversion.proto)) |
| REST server | [`JSclient/`](JSclient) | 3001 | Node.js/Express API (films, reviews, images, users), gRPC client of the Converter |
| Web frontend | [`JSclient/public/`](JSclient/public) | 3001 | Plain HTML/JS frontend served by the REST server |

The REST API is described in [`JSclient/api/openapi.json`](JSclient/api/openapi.json); when the server is running, Swagger UI is at http://localhost:3001/docs.

## Requirements

- JDK 21+ and Maven 3.9+ (Converter; also needed by `npm run generate`)
- Node.js and npm (REST server)

## Run

1. Start the Converter (see [`JavaServer/README.md`](JavaServer/README.md) for Eclipse):

   ```sh
   cd JavaServer
   mvn compile exec:java
   ```

2. In another terminal, start the REST server and frontend. The first time, install the dependencies and generate the route handlers from the OpenAPI document:

   ```sh
   cd JSclient
   npm install
   npm run generate
   ```

   Then:

   ```sh
   npm start                   # keeps the existing database
   RESET_DB=true npm start     # recreates the database with the sample data
   ```

3. Open http://localhost:3001/.

The sample users' credentials are listed in [`JSclient/src/database/passwords_databases.txt`](JSclient/src/database/passwords_databases.txt).
