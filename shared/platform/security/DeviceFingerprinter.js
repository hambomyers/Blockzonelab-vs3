/**
 * Device Fingerprinting System
 * Generates unique device signatures for anti-abuse protection
 * Part of BlockZone Lab's unified identity consolidation
 */

import { ImportPaths } from '../../utils/ImportPaths.js';

class DeviceFingerprinter {
    constructor() {
        this.fingerprint = null;
        this.components = new Map();
        this.initialized = false;
    }

    /**
     * Generate comprehensive device fingerprint
     * @returns {Promise<string>} Unique device fingerprint hash
     */
    async generateFingerprint() {
        if (this.fingerprint && this.initialized) {
            return this.fingerprint;
        }

        try {
            const components = await this.collectFingerprints();
            this.fingerprint = await this.hashComponents(components);
            this.initialized = true;
            
            // Cache for quick subsequent calls
            this.cacheFingerprint();
            
            return this.fingerprint;
        } catch (error) {
            console.warn('Device fingerprinting failed, using fallback:', error);
            return this.generateFallbackFingerprint();
        }
    }

    /**
     * Collect all available fingerprint components
     * @private
     */
    async collectFingerprints() {
        const components = {
            canvas: await this.getCanvasFingerprint(),
            webgl: await this.getWebGLFingerprint(),
            audio: await this.getAudioFingerprint(),
            screen: this.getScreenData(),
            timezone: this.getTimezoneData(),
            language: navigator.language || 'unknown',
            platform: navigator.platform || 'unknown',
            userAgent: this.getCleanUserAgent(),
            memory: this.getMemoryInfo(),
            hardware: this.getHardwareConcurrency(),
            plugins: this.getPluginsData(),
            fonts: await this.getFontFingerprint()
        };

        this.components = new Map(Object.entries(components));
        return components;
    }

    /**
     * Generate Canvas fingerprint
     * @private
     */
    async getCanvasFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = 200;
            canvas.height = 50;
            
            // Draw distinctive pattern
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillStyle = '#f60';
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = '#069';
            ctx.fillText('BlockZone Lab 🎮', 2, 15);
            ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
            ctx.fillText('Device ID', 4, 35);
            
            return canvas.toDataURL();
        } catch (error) {
            return 'canvas_unavailable';
        }
    }

    /**
     * Generate WebGL fingerprint
     * @private
     */
    async getWebGLFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            
            if (!gl) return 'webgl_unavailable';
            
            const data = {
                vendor: gl.getParameter(gl.VENDOR),
                renderer: gl.getParameter(gl.RENDERER),
                version: gl.getParameter(gl.VERSION),
                shadingLanguage: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
                extensions: gl.getSupportedExtensions(),
                maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
                maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS)
            };
            
            return JSON.stringify(data);
        } catch (error) {
            return 'webgl_error';
        }
    }

    /**
     * Generate Audio fingerprint
     * @private
     */
    async getAudioFingerprint() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const analyser = audioContext.createAnalyser();
            const gainNode = audioContext.createGain();
            const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
            
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(10000, audioContext.currentTime);
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            
            oscillator.connect(analyser);
            analyser.connect(scriptProcessor);
            scriptProcessor.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.start(0);
            
            return new Promise((resolve) => {
                let sample = 0;
                scriptProcessor.onaudioprocess = function(bins) {
                    if (sample > 1000) {
                        const hash = bins.inputBuffer.getChannelData(0)
                            .slice(0, 100)
                            .reduce((a, b) => a + Math.abs(b), 0);
                        oscillator.stop();
                        audioContext.close();
                        resolve(hash.toString());
                    }
                    sample++;
                };
            });
        } catch (error) {
            return 'audio_unavailable';
        }
    }

    /**
     * Get screen and display data
     * @private
     */
    getScreenData() {
        return {
            width: screen.width,
            height: screen.height,
            availWidth: screen.availWidth,
            availHeight: screen.availHeight,
            colorDepth: screen.colorDepth,
            pixelDepth: screen.pixelDepth,
            devicePixelRatio: window.devicePixelRatio || 1,
            orientation: screen.orientation?.type || 'unknown'
        };
    }

    /**
     * Get timezone information
     * @private
     */
    getTimezoneData() {
        return {
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            offset: new Date().getTimezoneOffset(),
            locale: Intl.DateTimeFormat().resolvedOptions().locale
        };
    }

    /**
     * Get cleaned user agent (remove version numbers for stability)
     * @private
     */
    getCleanUserAgent() {
        const ua = navigator.userAgent;
        // Remove version numbers to avoid fingerprint changes on updates
        return ua.replace(/\d+\.\d+(\.\d+)?/g, 'X.X');
    }

    /**
     * Get memory information
     * @private
     */
    getMemoryInfo() {
        if (navigator.deviceMemory) {
            return { deviceMemory: navigator.deviceMemory };
        }
        if (performance.memory) {
            return {
                usedJSHeapSize: Math.round(performance.memory.usedJSHeapSize / 1048576),
                totalJSHeapSize: Math.round(performance.memory.totalJSHeapSize / 1048576)
            };
        }
        return { memory: 'unavailable' };
    }

    /**
     * Get hardware concurrency
     * @private
     */
    getHardwareConcurrency() {
        return navigator.hardwareConcurrency || 'unknown';
    }

    /**
     * Get plugins data (simplified for modern browsers)
     * @private
     */
    getPluginsData() {
        const plugins = Array.from(navigator.plugins || [])
            .map(plugin => plugin.name)
            .sort();
        return plugins.length > 0 ? plugins : ['no_plugins'];
    }

    /**
     * Get font fingerprint
     * @private
     */
    async getFontFingerprint() {
        const testFonts = [
            'Arial', 'Helvetica', 'Times', 'Courier', 'Verdana', 'Georgia', 
            'Palatino', 'Garamond', 'Comic Sans MS', 'Trebuchet MS', 'Impact', 'Arial Black'
        ];
        
        const available = [];
        const testString = 'mmmmmmmmmmlli';
        
        for (const font of testFonts) {
            if (this.isFontAvailable(font, testString)) {
                available.push(font);
            }
        }
        
        return available.sort();
    }

    /**
     * Check if font is available
     * @private
     */
    isFontAvailable(font, testString) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        ctx.font = '72px monospace';
        const baseline = ctx.measureText(testString).width;
        
        ctx.font = `72px ${font}, monospace`;
        const width = ctx.measureText(testString).width;
        
        return width !== baseline;
    }

    /**
     * Hash components into final fingerprint
     * @private
     */
    async hashComponents(components) {
        const jsonString = JSON.stringify(components, Object.keys(components).sort());
        
        // Use SubtleCrypto if available, fallback to simple hash
        if (window.crypto && window.crypto.subtle) {
            const encoder = new TextEncoder();
            const data = encoder.encode(jsonString);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } else {
            return this.simpleHash(jsonString);
        }
    }

    /**
     * Simple hash fallback
     * @private
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16);
    }

    /**
     * Generate fallback fingerprint if main method fails
     * @private
     */
    generateFallbackFingerprint() {
        const fallback = {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            timestamp: Date.now(),
            random: Math.random().toString(36)
        };
        
        return this.simpleHash(JSON.stringify(fallback));
    }

    /**
     * Cache fingerprint in localStorage
     * @private
     */
    cacheFingerprint() {
        try {
            const cacheData = {
                fingerprint: this.fingerprint,
                timestamp: Date.now(),
                components: Array.from(this.components.entries())
            };
            localStorage.setItem('bz_device_fp', JSON.stringify(cacheData));
        } catch (error) {
            console.warn('Could not cache fingerprint:', error);
        }
    }

    /**
     * Load cached fingerprint if valid
     */
    loadCachedFingerprint() {
        try {
            const cached = localStorage.getItem('bz_device_fp');
            if (!cached) return null;
            
            const data = JSON.parse(cached);
            const age = Date.now() - data.timestamp;
            
            // Cache valid for 24 hours
            if (age < 86400000) {
                this.fingerprint = data.fingerprint;
                this.components = new Map(data.components);
                this.initialized = true;
                return this.fingerprint;
            }
        } catch (error) {
            console.warn('Could not load cached fingerprint:', error);
        }
        return null;
    }

    /**
     * Get fingerprint stability score (0-1)
     * Higher score means more stable/reliable fingerprint
     */
    getStabilityScore() {
        if (!this.components || this.components.size === 0) return 0;
        
        let score = 0;
        const weights = {
            canvas: 0.2,
            webgl: 0.2,
            audio: 0.15,
            screen: 0.1,
            fonts: 0.1,
            timezone: 0.05,
            memory: 0.05,
            hardware: 0.05,
            platform: 0.05,
            language: 0.05
        };
        
        for (const [component, weight] of Object.entries(weights)) {
            if (this.components.has(component) && 
                this.components.get(component) !== 'unavailable' &&
                this.components.get(component) !== 'unknown') {
                score += weight;
            }
        }
        
        return Math.min(score, 1);
    }
}

// Export singleton instance
export const deviceFingerprinter = new DeviceFingerprinter();
