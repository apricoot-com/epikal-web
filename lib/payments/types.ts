
export interface CardData {
    number: string;
    expiryMonth: number;
    expiryYear: number;
    cvv: string;
    holderName: string;
    email: string;
    deviceSessionId?: string; // Required for PayU anti-fraud
}

export interface PaymentMethodResult {
    token: string;
    gateway: string;
    last4: string;
    brand: string;
    expiryMonth?: number;
    expiryYear?: number;
}

export interface TransactionResult {
    transactionId: string;
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    rawResponse: any;
}

export interface PaymentProvider {
    name: string;

    /**
     * Tokenizes card data.
     */
    tokenizeCard(cardData: CardData): Promise<PaymentMethodResult>;

    /**
     * Charges a stored payment method.
     */
    charge(amount: number, currency: string, paymentMethodToken: string, extraData?: any): Promise<TransactionResult>;

    /**
     * Create customer if needed (optional)
     */
    createCustomer?(email: string, name: string): Promise<string>;
}
