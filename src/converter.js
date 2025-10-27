/**
 * ================================================
 * IMAGE CONVERTER ENGINE
 * Core WebP conversion logic using Canvas API
 * ================================================
 */

const ImageConverter = {
    /**
     * Current state
     */
    state: {
        originalFile: null,
        originalImage: null,
        convertedBlob: null,
        quality: 0.9, // Default quality 90%
        isConverting: false
    },

    /**
     * Initialize converter
     * @returns {Promise<boolean>} - True if initialization successful
     */
    async init() {
        // Skip browser check - we'll handle errors at conversion time if needed
        console.log('Image converter initialized');
        return true;
    },

    /**
     * Load and prepare image file for conversion
     * @param {File} file - Image file to load
     * @returns {Promise<Object>} - Image data and metadata
     */
    async loadImageFile(file) {
        // Validate file
        const validation = Utils.validateFile(file);
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        // Load image
        const img = await Utils.loadImage(file);
        
        // Store in state
        this.state.originalFile = file;
        this.state.originalImage = img;

        // Return image data
        return {
            file: file,
            image: img,
            format: Utils.getFileExtension(file.name),
            size: file.size,
            width: img.naturalWidth,
            height: img.naturalHeight,
            dataUrl: img.src
        };
    },

    /**
     * Convert image to WebP format
     * @param {number} quality - Quality setting (0.0 to 1.0)
     * @returns {Promise<Object>} - Converted image data
     */
    async convertToWebP(quality = this.state.quality) {
        if (!this.state.originalImage) {
            throw new Error('No image loaded for conversion');
        }

        if (this.state.isConverting) {
            throw new Error('Conversion already in progress');
        }

        this.state.isConverting = true;
        this.state.quality = quality;

        try {
            // Create canvas with same dimensions as original image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = this.state.originalImage.naturalWidth;
            canvas.height = this.state.originalImage.naturalHeight;

            // Draw image to canvas
            ctx.drawImage(this.state.originalImage, 0, 0);

            // Convert to WebP blob
            const blob = await new Promise((resolve, reject) => {
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Failed to convert image to WebP'));
                        }
                    },
                    'image/webp',
                    quality
                );
            });

            // Store converted blob
            this.state.convertedBlob = blob;

            // Create preview URL
            const previewUrl = URL.createObjectURL(blob);

            // Calculate metrics
            const originalSize = this.state.originalFile.size;
            const newSize = blob.size;
            const reduction = Utils.calculateReduction(originalSize, newSize);

            return {
                blob: blob,
                previewUrl: previewUrl,
                size: newSize,
                originalSize: originalSize,
                reduction: reduction,
                quality: quality * 100,
                width: canvas.width,
                height: canvas.height
            };

        } catch (error) {
            throw new Error(`Conversion failed: ${error.message}`);
        } finally {
            this.state.isConverting = false;
        }
    },

    /**
     * Download converted WebP file
     * @param {string} filename - Optional custom filename
     */
    downloadWebP(filename = null) {
        if (!this.state.convertedBlob) {
            throw new Error('No converted image available for download');
        }

        // Generate filename
        const downloadName = filename || 
            Utils.generateWebPFilename(this.state.originalFile.name);

        // Create download link
        const downloadUrl = URL.createObjectURL(this.state.convertedBlob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = downloadName;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up URL
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);
    },

    /**
     * Update conversion quality and re-convert
     * @param {number} quality - New quality value (0-100)
     * @returns {Promise<Object>} - Updated conversion data
     */
    async updateQuality(quality) {
        const normalizedQuality = quality / 100;
        return await this.convertToWebP(normalizedQuality);
    },

    /**
     * Reset converter state
     */
    reset() {
        // Revoke object URLs to free memory
        if (this.state.originalImage) {
            URL.revokeObjectURL(this.state.originalImage.src);
        }

        // Clear state
        this.state = {
            originalFile: null,
            originalImage: null,
            convertedBlob: null,
            quality: 0.9,
            isConverting: false
        };
    },

    /**
     * Get current converter state
     * @returns {Object} - Current state
     */
    getState() {
        return { ...this.state };
    },

    /**
     * Check if converter has an active image loaded
     * @returns {boolean} - True if image is loaded
     */
    hasImage() {
        return this.state.originalImage !== null;
    },

    /**
     * Check if conversion is complete
     * @returns {boolean} - True if converted
     */
    isConverted() {
        return this.state.convertedBlob !== null;
    },

    /**
     * Get conversion statistics for metrics tracking
     * @returns {Object} - Conversion statistics
     */
    getConversionStats() {
        if (!this.state.originalFile || !this.state.convertedBlob) {
            return null;
        }

        const originalSize = this.state.originalFile.size;
        const newSize = this.state.convertedBlob.size;
        const reductionPercent = ((originalSize - newSize) / originalSize) * 100;

        return {
            originalFormat: Utils.getFileExtension(this.state.originalFile.name),
            originalSize: originalSize,
            webpSize: newSize,
            reductionBytes: originalSize - newSize,
            reductionPercent: reductionPercent,
            quality: this.state.quality * 100,
            width: this.state.originalImage.naturalWidth,
            height: this.state.originalImage.naturalHeight,
            timestamp: new Date().toISOString()
        };
    }
};

// Make ImageConverter available globally
window.ImageConverter = ImageConverter;
