'use strict';

const fs = require('fs');
const crypto = require('crypto');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const constants = require('../utils/constants.js');

const packageDefinition = protoLoader.loadSync(constants.CONVERSION_PROTO, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});
const conversionProto = grpc.loadPackageDefinition(packageDefinition).conversion;

const client = new conversionProto.Converter(constants.CONVERTER_ADDRESS, grpc.credentials.createInsecure());

/**
 * Convert an image file through the gRPC Converter service
 *
 * Input:
 * - sourcePath: path of the file to be converted
 * - sourceType: file type of the source file ('png', 'jpg' or 'gif')
 * - targetPath: path where the converted file must be stored
 * - targetType: file type requested for the converted file ('png', 'jpg' or 'gif')
 * Output:
 * - targetPath, once the converted file has been completely stored
 **/
exports.convertFile = function (sourcePath, sourceType, targetPath, targetType) {
    return new Promise((resolve, reject) => {
        // the converted file is written with a temporary name, so that a partial file is never served
        const tmpPath = targetPath + '.' + crypto.randomUUID() + '.tmp';
        const output = fs.createWriteStream(tmpPath);
        const input = fs.createReadStream(sourcePath);
        const call = client.fileConvert();
        var failed = false;
        var received = 0;

        const fail = function (error) {
            if (failed) return;
            failed = true;
            input.destroy();
            call.cancel();
            output.destroy();
            fs.unlink(tmpPath, () => { });
            reject(error);
        };

        // first message: media types; then the file, divided into chunks
        call.write({ meta: { file_type_origin: sourceType, file_type_target: targetType } });
        input.on('data', (chunk) => {
            if (!call.write({ file: chunk })) {
                input.pause();
                call.once('drain', () => input.resume());
            }
        });
        input.on('end', () => call.end());
        input.on('error', (err) => fail(err));

        // first reply: outcome of the conversion; then, on success, the converted file divided into chunks
        call.on('data', (reply) => {
            if (reply.request_oneof == 'meta') {
                if (!reply.meta.success) {
                    fail('The conversion of the image failed' + (reply.meta.error ? ': ' + reply.meta.error : '.'));
                }
            }
            else {
                received += reply.file.length;
                if (!output.write(reply.file)) {
                    call.pause();
                    output.once('drain', () => call.resume());
                }
            }
        });
        call.on('error', (err) => fail('The Converter service failed: ' + err.details));
        call.on('end', () => {
            if (failed) return;
            // the Converter service may report success without producing any data (e.g., unsupported color model)
            if (received == 0) return fail('The conversion of the image failed: the Converter service returned an empty file.');
            output.end(() => {
                fs.rename(tmpPath, targetPath, (err) => {
                    if (err) fail(err);
                    else resolve(targetPath);
                });
            });
        });
        output.on('error', (err) => fail(err));
    });
};
