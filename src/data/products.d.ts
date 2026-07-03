export type ProductVariant = {
    id: string;
    label: string;
    priceCents: number;
};
export type Product = {
    id: string;
    name: string;
    line: string;
    kind: 'Hoodie' | 'Tee' | 'Print';
    image: string;
    priceCents: number;
    variants: ProductVariant[];
    printifyProductId?: string;
    active: boolean;
};
export declare const SEED_PRODUCTS: Product[];
export declare const fmt: (cents: number) => string;
