import { CartItem } from '../lib/types';
interface StoreProps {
    onAddToCart: (item: CartItem) => void;
}
export default function Store({ onAddToCart }: StoreProps): import("react").JSX.Element;
export {};
