/**
 * ================================================
 * UTILITY FUNCTIONS
 * File validation, formatting, and helper functions
 * ================================================
 */

const Utils = {
    /**
     * Supported image MIME types
     */
    SUPPORTED_TYPES: [
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/gif',
        'image/bmp',
        'image/svg+xml'
    ],

    /**
     * Maximum file size in bytes (10MB)
     */
    MAX_FILE_SIZE: 10 * 1024 * 1024,

    /**
     * Validate if file type is supported
     * @param {File} file - File object to validate
     * @returns {boolean} - True if supported
     */
    isValidFileType(file) {
        return this.SUPPORTED_TYPES.includes(file.type);
    },

    /**
     * Validate if file size is within limit
     * @param {File} file - File object to validate
     * @returns {boolean} - True if within limit
     */
    isValidFileSize(file) {
        return file.size <= this.MAX_FILE_SIZE;
    },

    /**
     * Validate file completely
     * @param {File} file - File object to validate
     * @returns {Object} - { valid: boolean, error: string|null }
     */
    validateFile(file) {
        if (!file) {
            return { valid: false, error: 'No file selected' };
        }

        if (!this.isValidFileType(file)) {
            const supportedFormats = this.SUPPORTED_TYPES
                .map(type => type.split('/')[1].toUpperCase())
                .join(', ');
            return { 
                valid: false, 
                error: `Unsupported file type: ${file.type}. Supported formats: ${supportedFormats}` 
            };
        }

        if (!this.isValidFileSize(file)) {
            return { 
                valid: false, 
                error: `File size exceeds ${this.formatFileSize(this.MAX_FILE_SIZE)} limit. Selected file: ${this.formatFileSize(file.size)}` 
            };
        }

        return { valid: true, error: null };
    },

    /**
     * Format bytes to human-readable string
     * @param {number} bytes - Number of bytes
     * @param {number} decimals - Number of decimal places
     * @returns {string} - Formatted string (e.g., "1.5 MB")
     */
    formatFileSize(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    },

    /**
     * Calculate file size reduction percentage
     * @param {number} originalSize - Original file size in bytes
     * @param {number} newSize - New file size in bytes
     * @returns {string} - Formatted percentage string
     */
    calculateReduction(originalSize, newSize) {
        const reduction = ((originalSize - newSize) / originalSize) * 100;
        const sign = reduction >= 0 ? '-' : '+';
        return `${sign}${Math.abs(reduction).toFixed(1)}%`;
    },

    /**
     * Get file extension from filename
     * @param {string} filename - Name of file
     * @returns {string} - File extension (uppercase)
     */
    getFileExtension(filename) {
        return filename.split('.').pop().toUpperCase();
    },

    /**
     * Generate filename for converted WebP file
     * @param {string} originalFilename - Original filename
     * @returns {string} - New filename with .webp extension
     */
    generateWebPFilename(originalFilename) {
        const nameWithoutExt = originalFilename.substring(0, originalFilename.lastIndexOf('.'));
        return `${nameWithoutExt}.webp`;
    },

    /**
     * Load image from file
     * @param {File} file - Image file to load
     * @returns {Promise<HTMLImageElement>} - Loaded image element
     */
    loadImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error('Failed to load image'));
                
                img.src = e.target.result;
            };
            
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    },

    /**
     * Check if browser supports WebP
     * @returns {Promise<boolean>} - True if WebP is supported
     */
    checkWebPSupport() {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = 1;
            
            // Try to convert to WebP
            canvas.toBlob(
                (blob) => {
                    resolve(blob !== null && blob.type === 'image/webp');
                },
                'image/webp'
            );
        });
    },

    /**
     * Debounce function to limit function calls
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} - Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Make Utils available globally
window.Utils = Utils;