export const PRODUCT_VALIDATION_LIMITS = {
    // Maximum number of display images per book
    MAX_IMAGES_PER_BOOK: 5,
    
    // Maximum file size per image (in bytes) - 5MB
    MAX_FILE_SIZE: 5 * 1024 * 1024,
    
    // Allowed image file types
    ALLOWED_IMAGE_TYPES: [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/webp',
        'image/gif'
    ],
    
    // Maximum total file size for all images in a single request (25MB for single book)
    MAX_TOTAL_FILE_SIZE: 25 * 1024 * 1024,
    
    // Maximum number of characters for text fields
    MAX_NAME_LENGTH: 200,
    MAX_DESCRIPTION_LENGTH: 2000,
    MAX_PUBLISHER_LENGTH: 100,
    MAX_ISBN_LENGTH: 20,
    MAX_RATED_LENGTH: 10,
    
    // Price limits
    MIN_PRICE: 0,
    MAX_PRICE: 10000,
    
    // Stock limits
    MIN_STOCK: 0,
    MAX_STOCK: 10000
} as const;

export const VALIDATION_MESSAGES = {
    TOO_MANY_IMAGES: `Cannot upload more than ${PRODUCT_VALIDATION_LIMITS.MAX_IMAGES_PER_BOOK} images per book`,
    FILE_TOO_LARGE: `File size must be less than ${PRODUCT_VALIDATION_LIMITS.MAX_FILE_SIZE / (1024 * 1024)}MB`,
    INVALID_FILE_TYPE: `Only ${PRODUCT_VALIDATION_LIMITS.ALLOWED_IMAGE_TYPES.join(', ')} files are allowed`,
    TOTAL_FILE_SIZE_EXCEEDED: `Total file size must be less than ${PRODUCT_VALIDATION_LIMITS.MAX_TOTAL_FILE_SIZE / (1024 * 1024)}MB`,
    NAME_TOO_LONG: `Book name must be less than ${PRODUCT_VALIDATION_LIMITS.MAX_NAME_LENGTH} characters`,
    DESCRIPTION_TOO_LONG: `Description must be less than ${PRODUCT_VALIDATION_LIMITS.MAX_DESCRIPTION_LENGTH} characters`,
    // PRICE_OUT_OF_RANGE: `Price must be between $${PRODUCT_VALIDATION_LIMITS.MIN_PRICE} and $${PRODUCT_VALIDATION_LIMITS.MAX_PRICE}`,
    STOCK_OUT_OF_RANGE: `Stock must be between ${PRODUCT_VALIDATION_LIMITS.MIN_STOCK} and ${PRODUCT_VALIDATION_LIMITS.MAX_STOCK}`
} as const; 