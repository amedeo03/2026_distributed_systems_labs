# Image Converter - Java gRPC Server
This repository contains the [grpc Server](/JavaServer) to be used in the Laboratory 2 activity in order to convert the image files to the required format, as well as  the [conversion.proto](/conversion.proto) file.

## Requirements
- JDK 21 or newer
- Maven 3.9+ (only for the command-line build; Eclipse ships its own)

## Build and Run
You can use Eclipse to make the project run. You need to:
- Import the project: File -> Import -> Select "Existing Maven Project..." -> Select the root directory clicking "Browse..." -> Click on "Finish"
- Run Maven by: Project -> Update Maven Project -> Click "Ok"
- Go on the ConversionServer.java file and click on "Run"

Alternatively, from the `JavaServer` directory:

```sh
mvn compile exec:java
```

The server listens on port 50051.

### OS Notice

The native `protoc` compiler matching your OS and CPU (Linux, Windows, macOS on Intel or ARM) is selected automatically by the `os-maven-plugin`, so no change to the `pom.xml` is needed.
