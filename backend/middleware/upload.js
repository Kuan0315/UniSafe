import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directories exist
const ensureUploadDirs = () => {
    const dirs = [
        './uploads',
        './uploads/images',
        './uploads/videos',
        './uploads/documents'
    ];

    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
};

ensureUploadDirs();

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = './uploads';

        if (file.mimetype.startsWith('image/')) {
            uploadPath = './uploads/images';
        } else if (file.mimetype.startsWith('video/')) {
            uploadPath = './uploads/videos';
        } else {
            uploadPath = './uploads/documents';
        }

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    // Allow images, videos, and PDFs
    if (
        file.mimetype.startsWith('image/') ||
        file.mimetype.startsWith('video/') ||
        file.mimetype === 'application/pdf'
    ) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images, videos, and PDFs are allowed.'), false);
    }
};

// Configure multer
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

// Middleware for handling multiple files
export const uploadMedia = (fieldName, maxCount = 5) => {
    return (req, res, next) => {
        upload.array(fieldName, maxCount)(req, res, (err) => {
            if (err) {
                return res.status(400).json({
                    success: false,
                    message: err.message
                });
            }

            // Add file URLs to request body
            if (req.files && req.files.length > 0) {
                req.body.media = req.files.map(file =>
                    `${req.protocol}://${req.get('host')}/${file.path.replace(/\\/g, '/')}`
                );
            }

            next();
        });
    };
};

// Middleware for single file upload
export const uploadSingle = (fieldName) => {
    return (req, res, next) => {
        upload.single(fieldName)(req, res, (err) => {
            if (err) {
                return res.status(400).json({
                    success: false,
                    message: err.message
                });
            }

            if (req.file) {
                req.body[fieldName] = `${req.protocol}://${req.get('host')}/${req.file.path.replace(/\\/g, '/')}`;
            }

            next();
        });
    };
};