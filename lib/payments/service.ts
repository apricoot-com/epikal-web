
import { PaymentProvider } from './types';
import { PayUProvider } from './payu';

export class PaymentService {
    private static provider: PaymentProvider;

    static getProvider(): PaymentProvider {
        if (!this.provider) {
            // Logic to select provider based on ENV or Config
            this.provider = new PayUProvider();
        }
        return this.provider;
    }
}
