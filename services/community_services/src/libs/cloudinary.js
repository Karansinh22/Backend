const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload file to Cloudinary
 * @param {Object} file - File object from express-fileupload
 * @param {String} folder - Folder path in Cloudinary (e.g., 'communities', 'events', 'marketplace', 'pulses')
 * @param {String} resourceType - Resource type: 'image', 'video', 'raw', 'auto'
 * @returns {Promise<Object>} - Cloudinary upload result with secure_url
 */
const uploadToCloudinary = async (file, folder = 'uploads', resourceType = 'image') => {
    try {
        if (!file) {
            throw new Error('No file provided');
        }

        // Check if file has data buffer
        if (!file.data) {
            throw new Error('File does not have data buffer');
        }

        return new Promise((resolve, reject) => {
            // Create a readable stream from the buffer
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: folder,
                    resource_type: resourceType,
                    use_filename: true,
                    unique_filename: true,
                    overwrite: false,
                    transformation: [
                        { quality: 'auto' },
                        { fetch_format: 'auto' }
                    ]
                },
                (error, result) => {
                    if (error) {
                        console.error('Cloudinary upload error:', error);
                        reject(error);
                    } else {
                        console.log('✅ Cloudinary upload successful:', {
                            public_id: result.public_id,
                            secure_url: result.secure_url,
                            format: result.format,
                            bytes: result.bytes
                        });
                        resolve(result);
                    }
                }
            );

            // Convert buffer to stream and pipe to Cloudinary
            const bufferStream = new Readable();
            bufferStream.push(file.data);
            bufferStream.push(null);
            bufferStream.pipe(uploadStream);
        });
    } catch (error) {
        console.error('Error in uploadToCloudinary:', error);
        throw error;
    }
};

/**
 * Upload multiple files to Cloudinary
 * @param {Array|Object} files - File(s) from express-fileupload
 * @param {String} folder - Folder path in Cloudinary
 * @param {String} resourceType - Resource type
 * @returns {Promise<Array>} - Array of Cloudinary upload results
 */
const uploadMultipleToCloudinary = async (files, folder = 'uploads', resourceType = 'image') => {
    try {
        const fileArray = Array.isArray(files) ? files : [files];
        const uploadPromises = fileArray.map(file => uploadToCloudinary(file, folder, resourceType));
        return await Promise.all(uploadPromises);
    } catch (error) {
        console.error('Error in uploadMultipleToCloudinary:', error);
        throw error;
    }
};

/**
 * Delete file from Cloudinary
 * @param {String} publicId - Cloudinary public_id of the file to delete
 * @param {String} resourceType - Resource type
 * @returns {Promise<Object>} - Deletion result
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
    try {
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType
        });
        console.log('✅ Cloudinary deletion result:', result);
        return result;
    } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
        throw error;
    }
};

/**
 * Extract public_id from Cloudinary URL
 * @param {String} url - Cloudinary URL
 * @returns {String|null} - Public ID or null
 */
const extractPublicIdFromUrl = (url) => {
    if (!url) return null;
    
    try {
        // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{version}/{public_id}.{format}
        const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
        return match ? match[1] : null;
    } catch (error) {
        console.error('Error extracting public_id:', error);
        return null;
    }
};

module.exports = {
    uploadToCloudinary,
    uploadMultipleToCloudinary,
    deleteFromCloudinary,
    extractPublicIdFromUrl,
    cloudinary
};

