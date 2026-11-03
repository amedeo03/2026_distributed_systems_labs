import io.grpc.Server;
import io.grpc.ServerBuilder;
import java.io.IOException;
import java.util.concurrent.TimeUnit;

/**
 * A server that hosts the Converter service.
 */
public final class ConversionServer {
  public static void main(String[] args) throws IOException, InterruptedException {
    int port = 50051;
    final Server server = ServerBuilder.forPort(port)
        .addService(new Converter())
        .build()
        .start();
    System.out.println("Listening on port " + port);
    Runtime.getRuntime().addShutdownHook(new Thread(() -> {
      server.shutdown();
      try {
        if (!server.awaitTermination(30, TimeUnit.SECONDS)) {
          server.shutdownNow();
          server.awaitTermination(5, TimeUnit.SECONDS);
        }
      } catch (InterruptedException ex) {
        server.shutdownNow();
        Thread.currentThread().interrupt();
      }
    }));
    server.awaitTermination();
  }
}
