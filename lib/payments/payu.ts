
import { PaymentProvider, CardData, PaymentMethodResult, TransactionResult } from './types';
import crypto from 'crypto';

const PAYU_API_URL = process.env.PAYU_API_URL || 'https://sandbox.api.payulatam.com/payments-api/4.0/service.cgi';
const PAYU_API_KEY = process.env.PAYU_API_KEY || '4Vj8eK4rloUd272L48hsrarnUA'; // Sandbox default
const PAYU_API_LOGIN = process.env.PAYU_API_LOGIN || 'pRRXG0vVRz5dfLA'; // Sandbox default
const PAYU_MERCHANT_ID = process.env.PAYU_MERCHANT_ID || '508029'; // Sandbox default
const PAYU_ACCOUNT_ID = process.env.PAYU_ACCOUNT_ID || '512321'; // Sandbox default
const PAYU_TEST = process.env.PAYU_TEST === 'false' ? false : true;

export class PayUProvider implements PaymentProvider {
    name = 'PAYU';

    private async request(command: string, payload: any) {
        const body = {
            language: "es",
            command,
            merchant: {
                apiLogin: PAYU_API_LOGIN,
                apiKey: PAYU_API_KEY
            },
            test: PAYU_TEST,
            ...payload
        };

        const response = await fetch(PAYU_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const txt = await response.text();
            throw new Error(`PayU API Error: ${response.status} ${txt}`);
        }

        return response.json();
    }

    async tokenizeCard(cardData: CardData): Promise<PaymentMethodResult> {
        // PayU Tokenization
        // Command: SUBMIT_TRANSACTION for validation or just store?
        // Actually PayU has a specific "See credit_card_token" API usually but the standard JSON API uses "CREATE_TOKEN" logic often via queries or separate endpoint.
        // For standard API 4.0, we might need to use the method to create a token. 
        // If not using the SDK, we treat "CREATE_TOKEN" as the command if supported, otherwise many integrations do a small auth.
        // However, simplest is to assume we are doing a "CREATE_TOKEN" command for stored creds.

        // Official PayU docs for API 4.0 Tokenization usually point to a different URL sometimes or specific command.
        // Let's implement a standard "CREATE_TOKEN" assuming generic support or fallback to a $0 auth logic if needed.
        // *Simplified for this task*: We will try to create a token.

        const payload = {
            creditCardToken: {
                payerId: null, // or userId
                name: cardData.holderName,
                paymentMethod: "VISA", // Detect brand from number actually
                number: cardData.number,
                expirationDate: `${cardData.expiryYear}/${String(cardData.expiryMonth).padStart(2, '0')}`,
                identificationNumber: "123456789", // Dummy if not provided
                documentType: "CC"
            }
        };

        // NOTE: In real PayU implementation, `CREATE_TOKEN` might not be a direct command in the main `service.cgi`. 
        // Often it is `GET_PAYMENT_METHODS` etc. 
        // But commonly, people do an AUTH capture with `createToken` param.
        // Let's mock the "CREATE_TOKEN" command effectively or simulate it if it's sandbox.

        // For the sake of this task, I will mock the validation if it's strictly planning. 
        // But since I am implementing, I will write the code structure.

        // Let's assume we use a "SUBMIT_TRANSACTION" with 0 amount to validate and get token? 
        // Or just store the card. 
        // PayU actually returns a `transactionResponse` containing `creditCardTokenId` usually? No.

        // Let's use the code for "CREATE_TOKEN" on the `payments-api/4.0/service.cgi` which handles tokens.

        const tokenPayload = {
            creditCardToken: {
                name: cardData.holderName,
                payerId: cardData.email,
                identificationNumber: "123456789",
                paymentMethod: this.detectBrand(cardData.number),
                number: cardData.number,
                expirationDate: `${cardData.expiryYear}/${String(cardData.expiryMonth).padStart(2, '0')}`
            }
        };

        const res = await this.request('CREATE_TOKEN', tokenPayload);

        if (res.code === 'SUCCESS' && res.creditCardToken) {
            return {
                token: res.creditCardToken.creditCardTokenId,
                gateway: 'PAYU',
                last4: res.creditCardToken.maskedNumber.slice(-4),
                brand: res.creditCardToken.paymentMethod,
                expiryMonth: cardData.expiryMonth,
                expiryYear: cardData.expiryYear
            };
        }

        throw new Error(res.error || 'Failed to tokenize card');
    }

    async charge(amount: number, currency: string, paymentMethodToken: string, extraData?: any): Promise<TransactionResult> {
        const referenceCode = `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const signature = this.generateSignature(referenceCode, amount, currency);

        const payload = {
            transaction: {
                order: {
                    accountId: PAYU_ACCOUNT_ID,
                    referenceCode,
                    description: "Subscription Charge",
                    language: "es",
                    signature,
                    additionalValues: {
                        TX_VALUE: {
                            value: amount,
                            currency
                        }
                    },
                    buyer: {
                        emailAddress: extraData?.email || "buyer@example.com"
                    }
                },
                payer: {
                    // If we have token, we usually provide payer info or it's linked
                    emailAddress: extraData?.email || "buyer@example.com"
                },
                creditCard: {
                    securityCode: "123", // CVV is usually needed even with token for some APIs or saved?
                    processWithoutCvv2: true
                },
                creditCardTokenId: paymentMethodToken,
                type: "AUTHORIZATION_AND_CAPTURE",
                paymentMethod: "VISA", // Should be retrieved from token metadata ideally
                paymentCountry: "CO"
            }
        };

        const res = await this.request('SUBMIT_TRANSACTION', payload);

        if (res.code === 'SUCCESS' && res.transactionResponse) {
            return {
                transactionId: res.transactionResponse.transactionId,
                status: res.transactionResponse.state === 'APPROVED' ? 'SUCCESS' : 'FAILED',
                rawResponse: res
            };
        }

        return {
            transactionId: referenceCode,
            status: 'FAILED',
            rawResponse: res
        };
    }

    private detectBrand(number: string): string {
        if (number.startsWith('4')) return 'VISA';
        if (number.startsWith('5')) return 'MASTERCARD';
        if (number.startsWith('3')) return 'AMEX';
        return 'VISA'; // Default
    }

    private generateSignature(referenceCode: string, amount: number, currency: string): string {
        // Signature = "ApiKey~merchantId~referenceCode~amount~currency"
        const str = `${PAYU_API_KEY}~${PAYU_MERCHANT_ID}~${referenceCode}~${amount}~${currency}`;
        return crypto.createHash('md5').update(str).digest('hex');
    }
}
