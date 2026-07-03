export interface CartItem {
    productId: string;
    name: string;
    price: number;
    image: string;
    size: string;
    quantity: number;
}
export interface CheckoutSession {
    sessionId: string;
    url: string;
}
