const sharp = require('sharp');

const optimizeImage = async (file) => {
  await sharp(file.path)
    .resize(800, null, { withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toFile(`${file.path}-optimized`);
};

module.exports = { optimizeImage };