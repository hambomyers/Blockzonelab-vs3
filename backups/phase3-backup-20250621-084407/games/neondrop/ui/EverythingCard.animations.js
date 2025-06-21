/**
 * EverythingCard Animations - Simple Animation Utilities
 */
export class CardAnimations {
    static animateIn(element, delay = 0) {
        return new Promise(resolve => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                element.style.transition = 'all 0.6s ease';
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
                setTimeout(resolve, 600);
            }, delay);
        });
    }

    static async fadeIn(element) {
        element.style.opacity = '0';
        element.style.transition = 'opacity 0.4s ease';
        
        setTimeout(() => {
            element.style.opacity = '1';
        }, 10);
        
        return new Promise(resolve => setTimeout(resolve, 400));
    }

    static async fadeOut(element) {
        element.style.transition = 'opacity 0.3s ease';
        element.style.opacity = '0';
        
        return new Promise(resolve => setTimeout(resolve, 300));
    }

    static showLoading(container) {
        const loader = document.createElement('div');
        loader.className = 'loading-spinner';
        loader.innerHTML = '<div class="spinner"></div><p>Loading...</p>';
        
        // Add spinner styles if not present
        if (!document.querySelector('#spinner-styles')) {
            const style = document.createElement('style');
            style.id = 'spinner-styles';
            style.textContent = `
                .loading-spinner {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 20px;
                }
                .spinner {
                    width: 30px;
                    height: 30px;
                    border: 3px solid #f3f3f3;
                    border-top: 3px solid #00d4ff;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 10px;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
        
        container.appendChild(loader);
        return loader;
    }

    static hideLoading(container) {
        const loader = container.querySelector('.loading-spinner');
        if (loader) {
            loader.remove();
        }
    }
}
