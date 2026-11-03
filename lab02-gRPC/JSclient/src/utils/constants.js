const path = require('path');

module.exports = Object.freeze({
    ELEMENTS_IN_PAGE: '2',
    // directory where the image files are stored, named <imageId>.<fileType>
    IMAGES_DIR: path.join(__dirname, '../images'),
    // accepted image media types, mapped to the file type (extension) used for storage and conversion
    IMAGE_FILE_TYPES: Object.freeze({
        'image/png': 'png',
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/gif': 'gif'
    }),
    CONVERTER_ADDRESS: 'localhost:50051',
    CONVERSION_PROTO: path.join(__dirname, '../../../conversion.proto'),
});