/**
 * Video Recorder System for Challenge Videos
 * Records actual gameplay video using MediaRecorder API
 * Creates sped-up challenge videos for sharing
 */

export class VideoRecorder {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.options = {
            frameRate: 60,
            quality: 0.8,
            speedMultiplier: 4, // 4x speed for challenges
            ...options
        };
        
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.isRecording = false;
        this.startTime = null;
        this.frameCount = 0;
        
        // Video processing
        this.videoBlob = null;
        this.videoUrl = null;
        this.processedVideoUrl = null;
        
        // Performance tracking
        this.performanceMetrics = {
            recordingStart: 0,
            recordingEnd: 0,
            processingStart: 0,
            processingEnd: 0,
            totalFrames: 0
        };
    }

    /**
     * Start recording gameplay video
     */
    async startRecording() {
        if (this.isRecording) {
            console.warn('⚠️ Already recording');
            return false;
        }

        try {
            // Get canvas stream
            const stream = this.canvas.captureStream(this.options.frameRate);
            
            // Create MediaRecorder with high quality settings
            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9',
                videoBitsPerSecond: 5000000 // 5 Mbps for high quality
            });

            this.recordedChunks = [];
            this.isRecording = true;
            this.startTime = Date.now();
            this.frameCount = 0;

            // Set up event handlers
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                this.finishRecording();
            };

            // Start recording
            this.mediaRecorder.start(1000); // Capture in 1-second chunks
            this.performanceMetrics.recordingStart = Date.now();
            
            console.log('🎬 Video recording started');
            return true;

        } catch (error) {
            console.error('❌ Failed to start video recording:', error);
            return false;
        }
    }

    /**
     * Stop recording
     */
    stopRecording() {
        if (!this.isRecording || !this.mediaRecorder) {
            console.warn('⚠️ Not currently recording');
            return null;
        }

        this.mediaRecorder.stop();
        this.isRecording = false;
        this.performanceMetrics.recordingEnd = Date.now();
        
        console.log('⏹️ Video recording stopped');
        return this.videoBlob;
    }

    /**
     * Finish recording and process video
     */
    async finishRecording() {
        if (this.recordedChunks.length === 0) {
            console.warn('⚠️ No video data recorded');
            return null;
        }

        // Create video blob
        this.videoBlob = new Blob(this.recordedChunks, { type: 'video/webm' });
        this.videoUrl = URL.createObjectURL(this.videoBlob);

        console.log(`📹 Raw video recorded: ${(this.videoBlob.size / 1024 / 1024).toFixed(2)} MB`);
        
        // Process video for challenge (speed up, compress)
        await this.processVideoForChallenge();
        
        return this.processedVideoUrl;
    }

    /**
     * Process video for challenge sharing (speed up, compress)
     */
    async processVideoForChallenge() {
        this.performanceMetrics.processingStart = Date.now();
        
        try {
            // Create video element for processing
            const video = document.createElement('video');
            video.src = this.videoUrl;
            video.muted = true;
            
            // Wait for video to load
            await new Promise((resolve) => {
                video.onloadedmetadata = resolve;
            });

            // Create canvas for processing
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set canvas size (maintain aspect ratio, reduce for sharing)
            const aspectRatio = video.videoWidth / video.videoHeight;
            canvas.width = 480; // Reduced width for sharing
            canvas.height = canvas.width / aspectRatio;

            // Create MediaRecorder for processed video
            const processedStream = canvas.captureStream(this.options.frameRate / this.options.speedMultiplier);
            const processedRecorder = new MediaRecorder(processedStream, {
                mimeType: 'video/webm;codecs=vp9',
                videoBitsPerSecond: 2000000 // 2 Mbps for processed video
            });

            const processedChunks = [];
            
            processedRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    processedChunks.push(event.data);
                }
            };

            processedRecorder.onstop = () => {
                const processedBlob = new Blob(processedChunks, { type: 'video/webm' });
                this.processedVideoUrl = URL.createObjectURL(processedBlob);
                this.performanceMetrics.processingEnd = Date.now();
                
                console.log(`⚡ Processed challenge video: ${(processedBlob.size / 1024 / 1024).toFixed(2)} MB`);
                console.log(`⏱️ Processing time: ${this.performanceMetrics.processingEnd - this.performanceMetrics.processingStart}ms`);
            };

            // Start processing
            processedRecorder.start();
            video.currentTime = 0;
            video.play();

            // Process frames at 4x speed
            const processFrame = () => {
                if (video.ended || video.paused) {
                    processedRecorder.stop();
                    return;
                }

                // Draw current frame to canvas
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                // Schedule next frame
                setTimeout(processFrame, 1000 / (this.options.frameRate / this.options.speedMultiplier));
            };

            processFrame();

        } catch (error) {
            console.error('❌ Failed to process video:', error);
            // Fallback to original video
            this.processedVideoUrl = this.videoUrl;
        }
    }

    /**
     * Create challenge video with overlay
     */
    async createChallengeVideo(gameData, challengeData) {
        if (!this.processedVideoUrl) {
            console.warn('⚠️ No processed video available');
            return null;
        }

        try {
            // Create video element
            const video = document.createElement('video');
            video.src = this.processedVideoUrl;
            video.muted = true;
            
            await new Promise((resolve) => {
                video.onloadedmetadata = resolve;
            });

            // Create canvas with overlay
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Create overlay canvas
            const overlayCanvas = document.createElement('canvas');
            const overlayCtx = overlayCanvas.getContext('2d');
            overlayCanvas.width = canvas.width;
            overlayCanvas.height = canvas.height;

            // Draw challenge overlay
            this.drawChallengeOverlay(overlayCtx, canvas.width, canvas.height, gameData, challengeData);

            // Create final video with overlay
            const finalStream = canvas.captureStream(this.options.frameRate / this.options.speedMultiplier);
            const finalRecorder = new MediaRecorder(finalStream, {
                mimeType: 'video/webm;codecs=vp9',
                videoBitsPerSecond: 2500000 // 2.5 Mbps for final video
            });

            const finalChunks = [];
            
            finalRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    finalChunks.push(event.data);
                }
            };

            finalRecorder.onstop = () => {
                const finalBlob = new Blob(finalChunks, { type: 'video/webm' });
                const finalUrl = URL.createObjectURL(finalBlob);
                
                console.log(`🏆 Challenge video created: ${(finalBlob.size / 1024 / 1024).toFixed(2)} MB`);
                
                // Clean up intermediate URLs
                if (this.videoUrl !== this.processedVideoUrl) {
                    URL.revokeObjectURL(this.videoUrl);
                }
                URL.revokeObjectURL(this.processedVideoUrl);
                
                return finalUrl;
            };

            // Start recording final video
            finalRecorder.start();
            video.currentTime = 0;
            video.play();

            // Process frames with overlay
            const processFrame = () => {
                if (video.ended || video.paused) {
                    finalRecorder.stop();
                    return;
                }

                // Draw video frame
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                // Draw overlay
                ctx.drawImage(overlayCanvas, 0, 0);
                
                // Schedule next frame
                setTimeout(processFrame, 1000 / (this.options.frameRate / this.options.speedMultiplier));
            };

            processFrame();

        } catch (error) {
            console.error('❌ Failed to create challenge video:', error);
            return this.processedVideoUrl; // Fallback to processed video
        }
    }

    /**
     * Draw challenge overlay on video
     */
    drawChallengeOverlay(ctx, width, height, gameData, challengeData) {
        // Semi-transparent background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, width, height);

        // Challenge title
        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🎮 CHALLENGE VIDEO', width / 2, 50);

        // Score
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px Arial';
        ctx.fillText(`Score: ${gameData.score.toLocaleString()}`, width / 2, 100);

        // Challenge info
        ctx.font = '18px Arial';
        ctx.fillText(`Beat this score for $${challengeData.stake}`, width / 2, 140);
        ctx.fillText(`Prize: $${challengeData.winnerPrize}`, width / 2, 170);

        // Player info
        ctx.font = '16px Arial';
        ctx.fillText(`Created by: ${challengeData.creator}`, width / 2, height - 60);
        ctx.fillText(`BlockZone Lab Challenge`, width / 2, height - 30);
    }

    /**
     * Get recording status
     */
    isRecording() {
        return this.isRecording;
    }

    /**
     * Get recording duration
     */
    getRecordingDuration() {
        if (!this.startTime) return 0;
        return Date.now() - this.startTime;
    }

    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        return { ...this.performanceMetrics };
    }

    /**
     * Clean up resources
     */
    cleanup() {
        if (this.videoUrl) {
            URL.revokeObjectURL(this.videoUrl);
        }
        if (this.processedVideoUrl && this.processedVideoUrl !== this.videoUrl) {
            URL.revokeObjectURL(this.processedVideoUrl);
        }
        
        this.videoBlob = null;
        this.videoUrl = null;
        this.processedVideoUrl = null;
    }

    /**
     * Export video as downloadable file
     */
    exportVideo(filename = 'challenge-video.webm') {
        if (!this.processedVideoUrl) {
            console.warn('⚠️ No video to export');
            return null;
        }

        const a = document.createElement('a');
        a.href = this.processedVideoUrl;
        a.download = filename;
        a.click();
        
        console.log(`📥 Video exported: ${filename}`);
        return filename;
    }
} 