/**
 * Apple Pay Integration for BlockZone Lab
 * Seamless iOS/Mac payments with fallback to web
 */

export class ApplePayIntegration {
  constructor() {
    this.isAvailable = this.checkAvailability();
    this.merchantIdentifier = 'merchant.com.blockzonelab.games';
    this.displayName = 'BlockZone Lab';
  }
  
  checkAvailability() {
    return window.ApplePaySession && 
           ApplePaySession.canMakePayments &&
           ApplePaySession.canMakePayments();
  }
  
  async processPayment(amount, description) {
    if (!this.isAvailable) {
      throw new Error('Apple Pay not available');
    }
    
    const request = {
      countryCode: 'US',
      currencyCode: 'USD',
      merchantCapabilities: ['supports3DS'],
      supportedNetworks: ['visa', 'masterCard', 'amex', 'discover'],
      total: {
        label: \\ - \\,
        amount: amount.toString()
      }
    };
    
    return new Promise((resolve, reject) => {
      const session = new ApplePaySession(3, request);
      
      session.onvalidatemerchant = async (event) => {
        try {
          const response = await fetch('/api/payments/apple_pay/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              validationURL: event.validationURL,
              domainName: window.location.hostname
            })
          });
          
          const merchantSession = await response.json();
          session.completeMerchantValidation(merchantSession);
        } catch (error) {
          reject(error);
        }
      };
      
      session.onpaymentauthorized = async (event) => {
        try {
          const response = await fetch('/api/payments/apple_pay/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              payment: event.payment,
              amount: amount,
              description: description
            })
          });
          
          const result = await response.json();
          
          if (result.success) {
            session.completePayment(ApplePaySession.STATUS_SUCCESS);
            resolve(result);
          } else {
            session.completePayment(ApplePaySession.STATUS_FAILURE);
            reject(new Error(result.error));
          }
        } catch (error) {
          session.completePayment(ApplePaySession.STATUS_FAILURE);
          reject(error);
        }
      };
      
      session.oncancel = () => {
        reject(new Error('Payment cancelled'));
      };
      
      session.begin();
    });
  }
}

// Global instance
window.ApplePayIntegration = new ApplePayIntegration();
