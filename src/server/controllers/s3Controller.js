const multer = require('multer');
const { S3Client } = require("@aws-sdk/client-s3");

const s3Client = new S3Client({
    region: 'eu-north-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const upload = multer();

module.exports = { upload, s3Client };