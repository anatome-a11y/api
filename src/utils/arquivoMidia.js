const fs = require('fs');
const mongoose = require('mongoose');

const bucketName = 'midias';

const getBucket = () => {
    if (!mongoose.connection.db) {
        throw new Error('Banco de dados indisponível');
    }
    return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName });
};

const salvarNoMongo = file => new Promise((resolve, reject) => {
    const bucket = getBucket();
    const upload = bucket.openUploadStream(file.filename, {
        contentType: file.mimetype,
        metadata: { originalName: file.originalname }
    });

    fs.createReadStream(file.path)
        .on('error', reject)
        .pipe(upload)
        .on('error', reject)
        .on('finish', () => resolve(upload));
});

module.exports = { getBucket, salvarNoMongo };
