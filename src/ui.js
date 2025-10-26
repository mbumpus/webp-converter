/**
 * ================================================
 * UI CONTROLLER
 * Manages user interface interactions and updates
 * ================================================
 */

const UI = {
    /**
     * DOM element references
     */
    elements: {
        dropZone: null,
        fileInput: null,
        errorMessage: null,
        qualitySection: null,
        qualitySlider: null,
        qualityValue: null,
        previewSection: null,
        originalImage: null,
        convertedImage: null,
        originalFormat: null,
        originalSize: null,
        originalDimensions: null,
        convertedSize: null,
        sizeReduction: null,
        processingStatus: null,
        convertBtn: null,
        downloadBtn: null,
        resetBtn: null
    },

    /**
     * Initialize UI and set up event listeners
     */
    async init() {
        // Get DOM elements
        this.cacheElements();

        // Check browser support
        const supported = await ImageConverter.init();
        if (!supported) {
            return;
        }

        // Set up event listeners
        this.setupEventListeners();

        console.log('Image to WebP Converter initialized successfully');
    },

    /**
     * Cache all DOM element references
     */
    cacheElements() {
        this.elements.dropZone = document.getElementById('dropZone');
        this.elements.fileInput = document.getElementById('fileInput');
        this.elements.errorMessage = document.getElementById('errorMessage');
        this.elements.qualitySection = document.getElementById('qualitySection');
        this.elements.qualitySlider = document.getElementById('qualitySlider');
        this.elements.qualityValue = document.getElementById('qualityValue');
        this.elements.previewSection = document.getElementById('previewSection');
        this.elements.originalImage = document.getElementById('originalImage');
        this.elements.convertedImage = document.getElementById('convertedImage');
        this.elements.originalFormat = document.getElementById('originalFormat');
        this.elements.originalSize = document.getElementById('originalSize');
        this.elements.originalDimensions = document.getElementById('originalDimensions');
        this.elements.convertedSize = document.getElementById('convertedSize');
        this.elements.sizeReduction = document.getElementById('sizeReduction');
        this.elements.processingStatus = document.getElementById('processingStatus');
        this.elements.convertBtn = document.getElementById('convertBtn');
        this.elements.downloadBtn = document.getElementById('downloadBtn');
        this.elements.resetBtn = document.getElementById('resetBtn');
    },

    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // File input change
        this.elements.fileInput.addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files[0]);
        });

        // Drag and drop
        this.elements.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.elements.dropZone.classList.add('drag-over');
        });

        this.elements.dropZone.addEventListener('dragleave', () => {
            this.elements.dropZone.classList.remove('drag-over');
        });

        this.elements.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.elements.dropZone.classList.remove('drag-over');
            
            const file = e.dataTransfer.files[0];
            if (file) {
                this.handleFileSelect(file);
            }
        });

        // Quality slider
        this.elements.qualitySlider.addEventListener('input', Utils.debounce((e) => {
            const quality = parseInt(e.target.value);
            this.elements.qualityValue.textContent = quality;
            
            // Auto-reconvert if already converted
            if (ImageConverter.isConverted()) {
                this.handleQualityChange(quality);
            }
        }, 300));

        // Convert button
        this.elements.convertBtn.addEventListener('click', () => {
            this.handleConvert();
        });

        // Download button
        this.elements.downloadBtn.addEventListener('click', () => {
            this.handleDownload();
        });

        // Reset button
        this.elements.resetBtn.addEventListener('click', () => {
            this.handleReset();
        });
    },

    /**
     * Handle file selection
     * @param {File} file - Selected file
     */
    async handleFileSelect(file) {
        if (!file) return;

        try {
            // Hide error message
            this.hideError();

            // Show processing status
            this.showProcessingStatus('Loading image...');

            // Load image
            const imageData = await ImageConverter.loadImageFile(file);

            // Update UI with original image
            this.displayOriginalImage(imageData);

            // Show quality controls and preview section
            this.elements.qualitySection.classList.remove('hidden');
            this.elements.previewSection.classList.remove('hidden');

            // Enable convert button
            this.elements.convertBtn.disabled = false;

            // Hide processing status
            this.hideProcessingStatus();

        } catch (error) {
            this.showError(error.message);
            this.hideProcessingStatus();
        }
    },

    /**
     * Handle image conversion
     */
    async handleConvert() {
        try {
            // Show processing status
            this.showProcessingStatus('Converting to WebP...');

            // Disable convert button during conversion
            this.elements.convertBtn.disabled = true;

            // Get quality value
            const quality = parseInt(this.elements.qualitySlider.value);

            // Convert image
            const conversionData = await ImageConverter.updateQuality(quality);

            // Update UI with converted image
            this.displayConvertedImage(conversionData);

            // Show download button
            this.elements.downloadBtn.classList.remove('hidden');

            // Re-enable convert button
            this.elements.convertBtn.disabled = false;

            // Hide processing status
            this.hideProcessingStatus();

        } catch (error) {
            this.showError(error.message);
            this.elements.convertBtn.disabled = false;
            this.hideProcessingStatus();
        }
    },

    /**
     * Handle quality change (auto-reconvert)
     * @param {number} quality - New quality value
     */
    async handleQualityChange(quality) {
        try {
            // Update converted image with new quality
            const conversionData = await ImageConverter.updateQuality(quality);
            this.updateConvertedPreview(conversionData);

        } catch (error) {
            console.error('Quality update failed:', error);
        }
    },

    /**
     * Handle download
     */
    handleDownload() {
        try {
            ImageConverter.downloadWebP();
        } catch (error) {
            this.showError(error.message);
        }
    },

    /**
     * Handle reset
     */
    handleReset() {
        // Reset converter
        ImageConverter.reset();

        // Clear file input
        this.elements.fileInput.value = '';

        // Hide sections
        this.elements.qualitySection.classList.add('hidden');
        this.elements.previewSection.classList.add('hidden');
        this.elements.downloadBtn.classList.add('hidden');

        // Reset quality slider
        this.elements.qualitySlider.value = 90;
        this.elements.qualityValue.textContent = 90;

        // Clear images
        this.elements.originalImage.src = '';
        this.elements.convertedImage.src = '';

        // Hide error
        this.hideError();
    },

    /**
     * Display original image in preview
     * @param {Object} imageData - Image data from converter
     */
    displayOriginalImage(imageData) {
        this.elements.originalImage.src = imageData.dataUrl;
        this.elements.originalFormat.textContent = imageData.format;
        this.elements.originalSize.textContent = Utils.formatFileSize(imageData.size);
        this.elements.originalDimensions.textContent = `${imageData.width} × ${imageData.height}px`;
    },

    /**
     * Display converted image in preview
     * @param {Object} conversionData - Conversion data from converter
     */
    displayConvertedImage(conversionData) {
        this.elements.convertedImage.src = conversionData.previewUrl;
        this.elements.convertedSize.textContent = Utils.formatFileSize(conversionData.size);
        this.elements.sizeReduction.textContent = conversionData.reduction;
        
        // Show Crewly modal after first successful conversion
        if (window.CrewlyModal) {
            CrewlyModal.showAfterConversion();
        }
        
        // Track conversion event
        if (typeof plausible !== 'undefined') {
            plausible('Image Converted', {
                props: {
                    app: 'webp_converter'
                }
            });
        }
    },

    /**
     * Update only the converted preview (for quality changes)
     * @param {Object} conversionData - New conversion data
     */
    updateConvertedPreview(conversionData) {
        // Revoke old URL
        if (this.elements.convertedImage.src) {
            URL.revokeObjectURL(this.elements.convertedImage.src);
        }

        this.elements.convertedImage.src = conversionData.previewUrl;
        this.elements.convertedSize.textContent = Utils.formatFileSize(conversionData.size);
        this.elements.sizeReduction.textContent = conversionData.reduction;
    },

    /**
     * Show error message
     * @param {string} message - Error message to display
     */
    showError(message) {
        this.elements.errorMessage.textContent = message;
        this.elements.errorMessage.classList.remove('hidden');
    },

    /**
     * Hide error message
     */
    hideError() {
        this.elements.errorMessage.textContent = '';
        this.elements.errorMessage.classList.add('hidden');
    },

    /**
     * Show processing status
     * @param {string} message - Status message
     */
    showProcessingStatus(message = 'Processing...') {
        if (this.elements.processingStatus) {
            this.elements.processingStatus.querySelector('p').textContent = message;
            this.elements.processingStatus.classList.remove('hidden');
        }
    },

    /**
     * Hide processing status
     */
    hideProcessingStatus() {
        if (this.elements.processingStatus) {
            this.elements.processingStatus.classList.add('hidden');
        }
    }
};

/**
 * ================================================
 * CREWLY CODES MODAL CONTROLS
 * Manages "Built with Crewly Codes" modal
 * ================================================
 */
const CrewlyModal = {
    modalShownThisSession: false,

    /**
     * Show the Crewly Codes modal
     */
    show() {
        const modal = document.getElementById('crewly-modal');
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            
            // Track modal view (if analytics available)
            this.trackEvent('Modal Viewed');
        }
    },

    /**
     * Close the Crewly Codes modal
     */
    close() {
        const modal = document.getElementById('crewly-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    },

    /**
     * Show modal after successful conversion (post-engagement)
     */
    showAfterConversion() {
        if (!this.modalShownThisSession) {
            setTimeout(() => {
                this.show();
                this.modalShownThisSession = true;
            }, 2000); // Wait 2 seconds after successful conversion
        }
    },

    /**
     * Track modal-related events
     */
    trackEvent(eventName, props = {}) {
        if (typeof plausible !== 'undefined') {
            plausible(eventName, { props: { ...props, app: 'webp_converter' } });
        }
    },

    /**
     * Track modal CTA clicks
     */
    trackCtaClick(destination) {
        this.trackEvent('Modal CTA Click', { destination });
    },

    /**
     * Track footer clicks
     */
    trackFooterClick(destination) {
        this.trackEvent('Footer Click', { destination });
    }
};

// Set up global modal functions for inline onclick handlers
window.showCrewlyModal = () => CrewlyModal.show();
window.closeCrewlyModal = () => CrewlyModal.close();
window.trackModalClick = (dest) => CrewlyModal.trackCtaClick(dest);
window.trackFooterClick = (dest) => CrewlyModal.trackFooterClick(dest);

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('crewly-modal');
    if (event.target === modal) {
        CrewlyModal.close();
    }
};

// Close modal on Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        CrewlyModal.close();
    }
});

// Make CrewlyModal available globally
window.CrewlyModal = CrewlyModal;

// Initialize UI when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => UI.init());
} else {
    UI.init();
}

// Make UI available globally
window.UI = UI;