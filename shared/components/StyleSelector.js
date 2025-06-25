/**
 * Style Selector - BlockZone Lab
 * UI for choosing viral status effects
 */

import { viralStatusSystem } from './ViralStatusSystem.js';

export class StyleSelector {
    constructor() {
        this.currentTier = null;
        this.currentStyle = 'style1';
        this.onStyleSelected = null;
    }

    /**
     * Show style selection modal
     */
    showStyleSelector(tier, currentStyle = 'style1', onStyleSelected = null) {
        this.currentTier = tier;
        this.currentStyle = currentStyle;
        this.onStyleSelected = onStyleSelected;

        const availableStyles = viralStatusSystem.getAvailableStyles(tier);
        if (availableStyles.length <= 1) return;

        const modal = this.createModal(tier, availableStyles);
        document.body.appendChild(modal);

        // Show modal with animation
        setTimeout(() => modal.classList.add('visible'), 10);
    }

    /**
     * Create the style selection modal
     */
    createModal(tier, availableStyles) {
        const modal = document.createElement('div');
        modal.className = 'style-selector-modal';
        modal.innerHTML = `
            <div class="style-selector-overlay"></div>
            <div class="style-selector-content">
                <div class="style-selector-header">
                    <h2>Choose Your ${tier.toUpperCase()} Style</h2>
                    <p>Select your unique visual effect</p>
                </div>
                
                <div class="style-options">
                    ${this.createStyleOptions(tier, availableStyles)}
                </div>
                
                <div class="style-selector-footer">
                    <button class="btn btn--secondary" id="cancelStyleBtn">Cancel</button>
                    <button class="btn btn--primary" id="confirmStyleBtn">Apply Style</button>
                </div>
            </div>
        `;

        // Add event listeners
        this.addModalEventListeners(modal, availableStyles);

        // Add styles
        this.addModalStyles();

        return modal;
    }

    /**
     * Create style option elements
     */
    createStyleOptions(tier, availableStyles) {
        const styleNames = {
            style1: tier === 'silver' ? 'Sparkle Glow' : 'Particle Storm',
            style2: tier === 'silver' ? 'Wave Motion' : 'Lightning Strike',
            style3: tier === 'gold' ? 'Neon Trail' : ''
        };

        return availableStyles.map(style => `
            <div class="style-option ${style === this.currentStyle ? 'selected' : ''}" data-style="${style}">
                <div class="style-preview" id="preview-${style}">
                    <span class="preview-text">${styleNames[style]}</span>
                </div>
                <div class="style-info">
                    <h3>${styleNames[style]}</h3>
                    <p>${this.getStyleDescription(tier, style)}</p>
                </div>
            </div>
        `).join('');
    }

    /**
     * Get style description
     */
    getStyleDescription(tier, style) {
        const descriptions = {
            silver: {
                style1: 'Bright glow with sparkling effects',
                style2: 'Bright glow with wave motion'
            },
            gold: {
                style1: 'Intense glow with particle effects',
                style2: 'Intense glow with lightning effects',
                style3: 'Intense glow with neon trail'
            }
        };

        return descriptions[tier]?.[style] || 'Custom visual effect';
    }

    /**
     * Add event listeners to modal
     */
    addModalEventListeners(modal, availableStyles) {
        // Style selection
        const styleOptions = modal.querySelectorAll('.style-option');
        styleOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Remove previous selection
                styleOptions.forEach(opt => opt.classList.remove('selected'));
                
                // Select new style
                option.classList.add('selected');
                this.currentStyle = option.dataset.style;
                
                // Update preview
                this.updatePreview(modal, this.currentTier, this.currentStyle);
            });
        });

        // Cancel button
        const cancelBtn = modal.querySelector('#cancelStyleBtn');
        cancelBtn.addEventListener('click', () => {
            this.closeModal(modal);
        });

        // Confirm button
        const confirmBtn = modal.querySelector('#confirmStyleBtn');
        confirmBtn.addEventListener('click', () => {
            if (this.onStyleSelected) {
                this.onStyleSelected(this.currentStyle);
            }
            this.closeModal(modal);
        });

        // Close on overlay click
        const overlay = modal.querySelector('.style-selector-overlay');
        overlay.addEventListener('click', () => {
            this.closeModal(modal);
        });

        // Initialize preview
        this.updatePreview(modal, this.currentTier, this.currentStyle);
    }

    /**
     * Update style preview
     */
    updatePreview(modal, tier, style) {
        const previewElement = modal.querySelector(`#preview-${style}`);
        if (!previewElement) return;

        // Remove effects from all previews
        modal.querySelectorAll('.style-preview').forEach(preview => {
            viralStatusSystem.removeStatusEffects(preview);
        });

        // Apply effects to selected preview
        const status = viralStatusSystem.getStatus(tier === 'gold' ? 31 : 6);
        viralStatusSystem.applyStatusEffects(previewElement, status, style);
    }

    /**
     * Close modal
     */
    closeModal(modal) {
        modal.classList.remove('visible');
        setTimeout(() => modal.remove(), 300);
    }

    /**
     * Add modal styles
     */
    addModalStyles() {
        if (document.querySelector('#style-selector-styles')) return;

        const style = document.createElement('style');
        style.id = 'style-selector-styles';
        style.textContent = `
            .style-selector-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .style-selector-modal.visible {
                opacity: 1;
            }

            .style-selector-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(4px);
            }

            .style-selector-content {
                position: relative;
                background: linear-gradient(135deg, #1a1a2e, #16213e);
                border: 2px solid #00d4ff;
                border-radius: 16px;
                padding: 32px;
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                transform: scale(0.9);
                transition: transform 0.3s ease;
            }

            .style-selector-modal.visible .style-selector-content {
                transform: scale(1);
            }

            .style-selector-header {
                text-align: center;
                margin-bottom: 32px;
            }

            .style-selector-header h2 {
                color: #00d4ff;
                font-size: 28px;
                margin: 0 0 8px 0;
                font-weight: 700;
            }

            .style-selector-header p {
                color: #aaa;
                font-size: 16px;
                margin: 0;
            }

            .style-options {
                display: grid;
                gap: 16px;
                margin-bottom: 32px;
            }

            .style-option {
                display: flex;
                align-items: center;
                gap: 16px;
                padding: 20px;
                background: rgba(255, 255, 255, 0.05);
                border: 2px solid transparent;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .style-option:hover {
                background: rgba(255, 255, 255, 0.1);
                border-color: rgba(0, 212, 255, 0.3);
            }

            .style-option.selected {
                background: rgba(0, 212, 255, 0.1);
                border-color: #00d4ff;
            }

            .style-preview {
                width: 120px;
                height: 60px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                position: relative;
                overflow: hidden;
            }

            .preview-text {
                font-size: 14px;
                font-weight: 600;
                color: white;
                text-align: center;
            }

            .style-info {
                flex: 1;
            }

            .style-info h3 {
                color: white;
                font-size: 18px;
                margin: 0 0 4px 0;
                font-weight: 600;
            }

            .style-info p {
                color: #aaa;
                font-size: 14px;
                margin: 0;
                line-height: 1.4;
            }

            .style-selector-footer {
                display: flex;
                gap: 12px;
                justify-content: flex-end;
            }

            .style-selector-footer .btn {
                padding: 12px 24px;
                font-size: 14px;
                font-weight: 600;
            }

            @media (max-width: 600px) {
                .style-selector-content {
                    padding: 24px;
                    margin: 20px;
                }

                .style-option {
                    flex-direction: column;
                    text-align: center;
                }

                .style-preview {
                    width: 100px;
                    height: 50px;
                }

                .style-selector-footer {
                    flex-direction: column;
                }
            }
        `;

        document.head.appendChild(style);
    }
}

// Export singleton instance
export const styleSelector = new StyleSelector(); 