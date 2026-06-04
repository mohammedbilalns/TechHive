import { v2 as cloudinary } from "cloudinary";
import { Readable } from "node:stream";
import { env } from "./env.js";

const CLOUDINARY_FOLDER = "techhive/products";
let isConfigured = false;

function ensureCloudinaryConfigured() {
  if (isConfigured) {
    return;
  }

  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error(
      "Cloudinary environment variables are missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
    );
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });

  isConfigured = true;
}

export function isCloudinaryPublicId(identifier) {
  return typeof identifier === "string" && identifier.includes("/");
}

export function createCloudinaryImageRecord(uploadResult) {
  return {
    path: uploadResult.secure_url,
    filename: uploadResult.public_id,
  };
}

export function uploadBufferToCloudinary(buffer) {
  ensureCloudinaryConfigured();

  const uploadOptions = {
    folder: CLOUDINARY_FOLDER,
    resource_type: "image",
  };

  if (env.CLOUDINARY_UPLOAD_PRESET) {
    uploadOptions.upload_preset = env.CLOUDINARY_UPLOAD_PRESET;
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      },
    );

    Readable.from(buffer).pipe(uploadStream);
  });
}

export async function uploadFileToCloudinary(filePath) {
  ensureCloudinaryConfigured();

  const uploadOptions = {
    folder: CLOUDINARY_FOLDER,
    resource_type: "image",
  };

  if (env.CLOUDINARY_UPLOAD_PRESET) {
    uploadOptions.upload_preset = env.CLOUDINARY_UPLOAD_PRESET;
  }

  return cloudinary.uploader.upload(filePath, uploadOptions);
}

export async function deleteCloudinaryImage(publicId) {
  if (!publicId || !isCloudinaryPublicId(publicId)) {
    return null;
  }

  ensureCloudinaryConfigured();
  return cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
  });
}
