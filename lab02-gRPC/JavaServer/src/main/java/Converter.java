import conversion.ConversionReply;
import conversion.ConversionRequest;
import conversion.ConverterGrpc;
import conversion.MetadataReply;
import com.google.protobuf.ByteString;
import io.grpc.stub.StreamObserver;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.Transparency;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Locale;
import java.util.Set;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.imageio.ImageIO;

public final class Converter extends ConverterGrpc.ConverterImplBase {

	private static final Logger logger = Logger.getLogger(Converter.class.getName());

	private static final Set<String> SUPPORTED_TYPES = Set.of("png", "jpg", "gif");

	private static final int CHUNK_SIZE = 1024; // 1KB

	@Override
	public StreamObserver<ConversionRequest> fileConvert(final StreamObserver<ConversionReply> responseObserver) {
		// gRPC never invokes the methods of a single StreamObserver concurrently, so plain fields are enough
		return new StreamObserver<ConversionRequest>() {
			private final ByteArrayOutputStream received = new ByteArrayOutputStream();
			private String typeOrigin = "";
			private String typeTarget = "";
			private String errorMessage = null;

			@Override
			public void onNext(ConversionRequest dataChunk) {
				if (errorMessage != null) {
					return;
				}
				try {
					switch (dataChunk.getRequestOneofCase()) {
						// metadata information is received
						case META -> {
							typeOrigin = dataChunk.getMeta().getFileTypeOrigin().toLowerCase(Locale.ROOT);
							typeTarget = dataChunk.getMeta().getFileTypeTarget().toLowerCase(Locale.ROOT);
						}
						// file chunk is received
						case FILE -> dataChunk.getFile().writeTo(received);
						case REQUESTONEOF_NOT_SET -> { }
					}
				} catch (IOException e) {
					logger.log(Level.INFO, "error on receiving the file", e);
					errorMessage = "error on receiving the file";
				}
			}

			@Override
			public void onError(Throwable t) {
				// the client cancelled or the call broke: no reply can be delivered anymore
				logger.log(Level.INFO, "error in receiving the file", t);
			}

			@Override
			public void onCompleted() {
				logger.log(Level.INFO, "file has been received!");

				byte[] converted = null;
				if (errorMessage == null) {
					try {
						converted = convert(received.toByteArray(), typeOrigin, typeTarget);
					} catch (ConversionException e) {
						logger.log(Level.INFO, "conversion has failed!", e);
						errorMessage = e.getMessage();
					} catch (IOException e) {
						logger.log(Level.INFO, "conversion has failed!", e);
						errorMessage = "the image could not be converted: " + e;
					}
				}

				if (converted != null) {
					logger.log(Level.INFO, "conversion has been successful!");
					responseObserver.onNext(ConversionReply.newBuilder()
							.setMeta(MetadataReply.newBuilder().setSuccess(true))
							.build());
					for (int offset = 0; offset < converted.length; offset += CHUNK_SIZE) {
						int length = Math.min(CHUNK_SIZE, converted.length - offset);
						responseObserver.onNext(ConversionReply.newBuilder()
								.setFile(ByteString.copyFrom(converted, offset, length))
								.build());
					}
				} else {
					responseObserver.onNext(ConversionReply.newBuilder()
							.setMeta(MetadataReply.newBuilder()
									.setSuccess(false)
									.setError(errorMessage))
							.build());
				}
				responseObserver.onCompleted();
			}
		};
	}

	/**
	 * Converts an image between the supported media types, filling transparent pixels with white.
	 */
	static byte[] convert(byte[] image, String typeOrigin, String typeTarget) throws ConversionException, IOException {
		if (!SUPPORTED_TYPES.contains(typeOrigin) || !SUPPORTED_TYPES.contains(typeTarget)) {
			throw new ConversionException("media type not supported: " + typeOrigin + " -> " + typeTarget);
		}
		BufferedImage imageReceived = ImageIO.read(new ByteArrayInputStream(image));
		if (imageReceived == null) {
			throw new ConversionException("the received file is not a valid image");
		}
		if (imageReceived.getColorModel().getTransparency() != Transparency.OPAQUE) {
			imageReceived = fillTransparentPixels(imageReceived, Color.WHITE);
		}
		ByteArrayOutputStream output = new ByteArrayOutputStream();
		if (!ImageIO.write(imageReceived, typeTarget, output)) {
			throw new ConversionException("no " + typeTarget + " writer is able to encode the image");
		}
		return output.toByteArray();
	}

	public static BufferedImage fillTransparentPixels(BufferedImage image, Color fillColor) {
		int w = image.getWidth();
		int h = image.getHeight();
		BufferedImage image2 = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
		Graphics2D g = image2.createGraphics();
		g.setColor(fillColor);
		g.fillRect(0, 0, w, h);
		g.drawRenderedImage(image, null);
		g.dispose();
		return image2;
	}

	static final class ConversionException extends Exception {
		ConversionException(String message) {
			super(message);
		}
	}
}
