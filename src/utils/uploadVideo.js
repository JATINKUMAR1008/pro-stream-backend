import AWS from 'aws-sdk';
import fs from 'fs';
import { ApiErrors } from './ApiErrors.js';

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const S3 = new AWS.S3();

export const uploadVideoOnS3 = async (file, name) => {
  try {
    const fileContent = fs.createReadStream(file.path);
    const params = {
      Bucket: process.env.VIDEO_UPLOAD_BUCKET,
      Key: `${name}`,
      Body: fileContent,
    };

    const uploadPromise = S3.upload(params).on('httpUploadProgress', (event) => {
      console.log("upload progress", event.loaded, "/", event.total);
    }).promise();
    const data = await uploadPromise;
    fs.unlinkSync(file.path)

    return data.Key; // Return the uploaded key (file name)
  } catch (err) {
    fs.unlinkSync(file.path)
    throw new ApiErrors(500, "Error uploading video");
  }
};
