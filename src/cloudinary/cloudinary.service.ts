import { Injectable } from '@nestjs/common';
import { UploadApiResponse, v2 as cloudinary } from 'cloudinary';
import { Readable } from 'node:stream';

@Injectable()
export class CloudinaryService {
  /**
   * Upload image to Cloudinary
   * @param file - Multer file buffer
   * @param folder - Folder path in Cloudinary (e.g., 'mbg/profiles')
   * @returns Upload result with secure_url and public_id
   */

  async uploadImage(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'image',
          transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto' },
            { fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );
      const stream = Readable.from(file.buffer);
      stream.pipe(uploadStream);
    });
  }


    /**
   * Delete image from Cloudinary
   * @param publicId - Cloudinary public_id (e.g., 'mbg/profiles/abc123')
   * @returns Deletion result
   */

    async deleteImage(publicId: string): Promise<any> {
        try {
            return await cloudinary.uploader.destroy(publicId)
        }  catch(error) {
            console.error('Failed to delete image from Cloudinary:', error);
        } 
    }

}
