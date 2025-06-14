/**
 * BLOCKZONE LAB - Dynamic Bitcoin Price Integration
 * Automatically updates Bitcoin pizza references with current prices
 */

class BitcoinPriceManager {
    constructor() {
        this.currentPrice = null;
        this.pizzaBitcoins = 10000; // The famous 10,000 BTC pizza
        this.lastUpdated = null;
        this.cacheTime = 60 * 60 * 1000; // 1 hour cache
    }

    async getCurrentPrice() {
        // Check cache first
        const cached = this.getCachedPrice();
        if (cached) {
            this.currentPrice = cached.price;
            return this.currentPrice;
        }

        try {
            // Try CoinGecko API (free, no API key needed)
            const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
            const data = await response.json();
            
            if (data.bitcoin && data.bitcoin.usd) {
                this.currentPrice = data.bitcoin.usd;
                this.cachePrice();
                return this.currentPrice;
            }
        } catch (error) {
            console.warn('CoinGecko API failed, trying backup...');
        }

        try {
            // Backup: CoinDesk API
            const response = await fetch('https://api.coindesk.com/v1/bpi/currentprice.json');
            const data = await response.json();
            
            if (data.bpi && data.bpi.USD && data.bpi.USD.rate_float) {
                this.currentPrice = data.bpi.USD.rate_float;
                this.cachePrice();
                return this.currentPrice;
            }
        } catch (error) {
            console.warn('All Bitcoin APIs failed, using fallback price');
        }

        // Fallback price if APIs fail
        this.currentPrice = 120000; // Conservative estimate
        return this.currentPrice;
    }

    cachePrice() {
        const cacheData = {
            price: this.currentPrice,
            timestamp: Date.now()
        };
        localStorage.setItem('blockzone_btc_price', JSON.stringify(cacheData));
        this.lastUpdated = Date.now();
    }

    getCachedPrice() {
        try {
            const cached = localStorage.getItem('blockzone_btc_price');
            if (!cached) return null;

            const data = JSON.parse(cached);
            const age = Date.now() - data.timestamp;

            if (age < this.cacheTime) {
                this.lastUpdated = data.timestamp;
                return data;
            }
        } catch (error) {
            console.warn('Invalid cache data');
        }
        return null;
    }

    calculatePizzaValue() {
        if (!this.currentPrice) return "over $1 billion";

        const value = this.currentPrice * this.pizzaBitcoins;
        
        if (value >= 1000000000) {
            const billions = (value / 1000000000).toFixed(1);
            return `$${billions} billion`;
        } else if (value >= 1000000) {
            const millions = Math.round(value / 1000000);
            return `$${millions} million`;
        } else {
            return `$${Math.round(value).toLocaleString()}`;
        }
    }

    async updatePizzaReferences() {
        await this.getCurrentPrice();
        const pizzaValue = this.calculatePizzaValue();
        
        // Update all pizza references on the page
        const pizzaElements = document.querySelectorAll('[data-bitcoin-pizza]');
        pizzaElements.forEach(element => {
            const template = element.dataset.bitcoinPizza;
            element.textContent = template.replace('{PIZZA_VALUE}', pizzaValue);
        });

        // Update any specific pizza value spans
        const valueElements = document.querySelectorAll('.bitcoin-pizza-value');
        valueElements.forEach(element => {
            element.textContent = pizzaValue;
        });

        console.log(`🍕 Bitcoin pizza value updated: ${pizzaValue} (${this.currentPrice.toLocaleString()} per BTC)`);
    }

    // Format current Bitcoin price nicely
    formatCurrentPrice() {
        if (!this.currentPrice) return "~$120,000";
        return `$${Math.round(this.currentPrice).toLocaleString()}`;
    }

    // Get cache age for debugging
    getCacheAge() {
        if (!this.lastUpdated) return "No cache";
        const age = Date.now() - this.lastUpdated;
        const minutes = Math.round(age / (60 * 1000));
        return `${minutes} minutes ago`;
    }
}

// Global instance
window.BitcoinPrice = new BitcoinPriceManager();

// Auto-update on page load
document.addEventListener('DOMContentLoaded', () => {
    window.BitcoinPrice.updatePizzaReferences();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BitcoinPriceManager;
}
