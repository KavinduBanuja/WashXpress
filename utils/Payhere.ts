/**
 * PayHere wrapper — works in Expo Go (mock) and in EAS dev build (real).
 * 
 * When you're ready to go live:
 *   1. Run: npm install @payhere/payhere-mobilesdk-reactnative@4.0.14
 *   2. Run: npx eas build --profile development --platform android
 *   3. Change MOCK_PAYHERE to false below
 */

const MOCK_PAYHERE = true; // ← flip to false after EAS build

let PayHereReal: any = null;

if (!MOCK_PAYHERE) {
  try {
    PayHereReal = require('@payhere/payhere-mobilesdk-reactnative').default;
  } catch (e) {
    console.warn('PayHere native module not available, falling back to mock');
  }
}

const PayHereMock = {
  startPayment: (
    paymentObject: any,
    onSuccess: (paymentId: string) => void,
    onError: (error: string) => void,
    onDismissed: () => void
  ) => {
    console.log('🧪 PayHere MOCK — payment object:', paymentObject);
    // Simulate a 2 second payment process then succeed
    setTimeout(() => {
      console.log('🧪 PayHere MOCK — payment success');
      onSuccess('MOCK-PAYMENT-' + Date.now());
    }, 2000);
  },
};

const PayHere = PayHereReal || PayHereMock;

export default PayHere;