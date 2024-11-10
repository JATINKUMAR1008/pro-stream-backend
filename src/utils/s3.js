import AWS from 'aws-sdk';
import fs from 'fs';

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const S3 = new AWS.S3();

const uploadOnS3 = async (file, filename) => {
  try {
    if (!file) return null;

    console.log('Uploading file to S3', filename);

    const fileContent = fs.createReadStream(file.path);
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: filename,
      Body: fileContent,
      ContentType: file.mimetype,
    };

    // Using a promise for S3.upload
    const uploadResult = await new Promise((resolve, reject) => {
      S3.upload(params, (err, data) => {
        if (err) {
            fs.unlinkSync(file.path);
          reject(err);
        } else {
          resolve(data);
        }
      });
    });

    // Clean up the file after upload
    fs.unlinkSync(file.path);

    console.log('File uploaded successfully:', uploadResult);
    return `https://d32xvyoorsee81.cloudfront.net/${filename}`;
  } catch (err) {
    console.error('Error uploading file to S3:', err);

    // Ensure file is cleaned up even in case of error
    if (file?.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    return null;
  }
};

export { uploadOnS3 };
