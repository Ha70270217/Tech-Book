// Image optimization utility for compression and performance

class ImageOptimizer {
  constructor() {
    this.cache = new Map();
    this.maxCacheSize = 50; // Maximum number of images to cache
    this.qualitySettings = {
      low: 0.5,
      medium: 0.7,
      high: 0.85,
      maximum: 0.95
    };
    this.supportedFormats = ['jpeg', 'jpg', 'png', 'webp', 'gif'];
    this.currentCacheSize = 0;
  }

  // Compress an image using Canvas API
  async compressImage(file, options = {}) {
    const {
      quality = 'medium',
      maxWidth = 1920,
      maxHeight = 1080,
      mimeType = 'image/webp',
      returnBlob = true
    } = options;

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          // Calculate new dimensions maintaining aspect ratio
          let { width, height } = this.calculateDimensions(img.width, img.height, maxWidth, maxHeight);

          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;

          // Draw image on canvas
          ctx.drawImage(img, 0, 0, width, height);

          // Get compressed data URL or blob
          const qualityValue = typeof quality === 'string' ? this.qualitySettings[quality] : quality;

          if (returnBlob) {
            canvas.toBlob(
              blob => {
                if (blob) {
                  resolve(blob);
                } else {
                  reject(new Error('Failed to compress image'));
                }
              },
              mimeType,
              qualityValue
            );
          } else {
            const dataURL = canvas.toDataURL(mimeType, qualityValue);
            resolve(dataURL);
          }
        } catch (error) {
          reject(error);
        } finally {
          // Clean up
          canvas.width = 0;
          canvas.height = 0;
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for compression'));
      };

      // Start loading the image
      img.src = URL.createObjectURL(file);
    });
  }

  // Calculate dimensions maintaining aspect ratio
  calculateDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
    let width = originalWidth;
    let height = originalHeight;

    // Calculate scaling factors
    const widthRatio = maxWidth / width;
    const heightRatio = maxHeight / height;

    // Use the smaller ratio to maintain aspect ratio
    const ratio = Math.min(widthRatio, heightRatio, 1); // Don't upscale

    width = Math.floor(width * ratio);
    height = Math.floor(height * ratio);

    return { width, height };
  }

  // Convert image to WebP format for better compression
  async convertToWebP(imageSrc, quality = 'medium') {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          canvas.width = img.width;
          canvas.height = img.height;

          ctx.drawImage(img, 0, 0);

          const qualityValue = typeof quality === 'string' ? this.qualitySettings[quality] : quality;

          canvas.toBlob(
            blob => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to convert image to WebP'));
              }
            },
            'image/webp',
            qualityValue
          );
        } catch (error) {
          reject(error);
        } finally {
          canvas.width = 0;
          canvas.height = 0;
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for WebP conversion'));
      };

      img.src = imageSrc;
    });
  }

  // Resize image to specific dimensions
  async resizeImage(file, width, height, options = {}) {
    const { quality = 'medium', mimeType = 'image/webp', returnBlob = true } = options;

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          canvas.width = width;
          canvas.height = height;

          // Draw image with smoothing disabled for sharp edges if needed
          if (options.smooth !== false) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
          }

          ctx.drawImage(img, 0, 0, width, height);

          const qualityValue = typeof quality === 'string' ? this.qualitySettings[quality] : quality;

          if (returnBlob) {
            canvas.toBlob(
              blob => {
                if (blob) {
                  resolve(blob);
                } else {
                  reject(new Error('Failed to resize image'));
                }
              },
              mimeType,
              qualityValue
            );
          } else {
            const dataURL = canvas.toDataURL(mimeType, qualityValue);
            resolve(dataURL);
          }
        } catch (error) {
          reject(error);
        } finally {
          canvas.width = 0;
          canvas.height = 0;
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for resizing'));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  // Generate multiple sizes of an image for responsive design
  async generateResponsiveSizes(file, sizes = [300, 600, 1200, 1920], options = {}) {
    const { quality = 'medium', mimeType = 'image/webp' } = options;
    const results = {};

    for (const size of sizes) {
      try {
        // First, resize the image to the desired size
        const resizedImage = await this.resizeImage(
          file,
          size,
          size,
          { quality, mimeType, returnBlob: true }
        );

        // Create a data URL for the srcset
        const dataUrl = URL.createObjectURL(resizedImage);
        results[`${size}w`] = {
          blob: resizedImage,
          dataUrl: dataUrl,
          width: size,
          height: size
        };
      } catch (error) {
        console.error(`Failed to generate size ${size}:`, error);
        // Continue with other sizes even if one fails
      }
    }

    return results;
  }

  // Lazy load and optimize images
  async lazyLoadAndOptimize(element, options = {}) {
    const { quality = 'medium', mimeType = 'image/webp' } = options;

    if (element.tagName !== 'IMG') {
      throw new Error('Element must be an image');
    }

    const src = element.getAttribute('data-src') || element.src;
    if (!src) {
      throw new Error('No source image found');
    }

    try {
      // Check if image is already optimized and cached
      const cached = this.getCachedImage(src, quality, mimeType);
      if (cached) {
        element.src = URL.createObjectURL(cached);
        return cached;
      }

      // Fetch the original image
      const response = await fetch(src);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }

      const blob = await response.blob();

      // Optimize the image
      const optimized = await this.compressImage(blob, {
        quality,
        mimeType,
        returnBlob: true
      });

      // Cache the optimized image
      this.cacheImage(src, quality, mimeType, optimized);

      // Set the optimized image as source
      element.src = URL.createObjectURL(optimized);

      return optimized;
    } catch (error) {
      console.error('Failed to optimize image:', error);
      // Fallback to original image
      element.src = src;
      throw error;
    }
  }

  // Cache an optimized image
  cacheImage(src, quality, mimeType, blob) {
    const key = `${src}-${quality}-${mimeType}`;

    // Check cache size
    if (this.currentCacheSize >= this.maxCacheSize) {
      // Remove oldest entry (simple FIFO)
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
        this.currentCacheSize--;
      }
    }

    this.cache.set(key, {
      blob,
      timestamp: Date.now()
    });
    this.currentCacheSize++;
  }

  // Get cached image
  getCachedImage(src, quality, mimeType) {
    const key = `${src}-${quality}-${mimeType}`;
    const cached = this.cache.get(key);

    if (cached) {
      // Check if cache is still valid (1 hour expiry)
      if (Date.now() - cached.timestamp < 60 * 60 * 1000) {
        return cached.blob;
      } else {
        // Remove expired cache
        this.cache.delete(key);
        this.currentCacheSize--;
      }
    }

    return null;
  }

  // Preload and optimize images
  async preloadOptimizedImages(imageUrls, options = {}) {
    const { quality = 'medium', mimeType = 'image/webp' } = options;
    const results = [];

    for (const url of imageUrls) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          console.error(`Failed to fetch image for preload: ${url}`);
          continue;
        }

        const blob = await response.blob();
        const optimized = await this.compressImage(blob, {
          quality,
          mimeType,
          returnBlob: true
        });

        this.cacheImage(url, quality, mimeType, optimized);
        results.push({ url, success: true });
      } catch (error) {
        console.error(`Failed to preload and optimize image: ${url}`, error);
        results.push({ url, success: false, error: error.message });
      }
    }

    return results;
  }

  // Create an optimized image element
  createOptimizedImage(src, options = {}) {
    const {
      quality = 'medium',
      mimeType = 'image/webp',
      className = '',
      alt = '',
      sizes = '100vw'
    } = options;

    const img = document.createElement('img');
    img.className = className;
    img.alt = alt;
    img.setAttribute('data-src', src);
    img.setAttribute('loading', 'lazy');
    img.setAttribute('decoding', 'async');

    // Set up responsive image attributes
    if (options.sizes) {
      img.setAttribute('sizes', sizes);
    }

    return img;
  }

  // Optimize all images in a container
  async optimizeContainerImages(container, options = {}) {
    const images = container.querySelectorAll('img[data-src]');
    const promises = Array.from(images).map(img =>
      this.lazyLoadAndOptimize(img, options).catch(err => {
        console.error('Failed to optimize image:', err);
      })
    );

    return Promise.allSettled(promises);
  }

  // Get image information (dimensions, size, etc.)
  async getImageInfo(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        const info = {
          width: img.width,
          height: img.height,
          aspectRatio: img.width / img.height,
          originalSize: file.size,
          type: file.type,
          name: file.name
        };

        URL.revokeObjectURL(url);
        resolve(info);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image for info extraction'));
      };

      img.src = url;
    });
  }

  // Estimate compressed file size
  async estimateCompressedSize(file, quality = 'medium') {
    const info = await this.getImageInfo(file);
    const qualityValue = typeof quality === 'string' ? this.qualitySettings[quality] : quality;

    // Rough estimation based on original size and quality
    // This is a simplified estimation - actual compression varies
    const estimatedSize = Math.floor(file.size * qualityValue * 0.7); // 70% of quality-adjusted size for JPEG/WebP

    return {
      originalSize: file.size,
      estimatedCompressedSize: estimatedSize,
      sizeReduction: file.size - estimatedSize,
      reductionPercentage: Math.round(((file.size - estimatedSize) / file.size) * 100)
    };
  }

  // Batch optimize images
  async batchOptimize(files, options = {}) {
    const {
      quality = 'medium',
      maxWidth = 1920,
      maxHeight = 1080,
      mimeType = 'image/webp'
    } = options;

    const results = [];

    for (const file of files) {
      try {
        const compressed = await this.compressImage(file, {
          quality,
          maxWidth,
          maxHeight,
          mimeType,
          returnBlob: true
        });

        const originalInfo = await this.getImageInfo(file);
        const compressedInfo = await this.getImageInfo(compressed);

        results.push({
          original: {
            file,
            info: originalInfo
          },
          compressed: {
            blob: compressed,
            info: compressedInfo
          },
          compressionRatio: originalInfo.originalSize / compressedInfo.originalSize
        });
      } catch (error) {
        results.push({
          original: { file, info: null },
          compressed: null,
          error: error.message
        });
      }
    }

    return results;
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    this.currentCacheSize = 0;
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.currentCacheSize,
      maxSize: this.maxCacheSize,
      entries: this.cache.size,
      usagePercentage: Math.round((this.currentCacheSize / this.maxCacheSize) * 100)
    };
  }
}

// Singleton instance
const imageOptimizer = new ImageOptimizer();

// Export the class and instance
export { ImageOptimizer, imageOptimizer };

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.ImageOptimizer = imageOptimizer;
}