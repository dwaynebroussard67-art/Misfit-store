import { CartItem } from '../lib/types';
interface CartProps {
    items: CartItem[];
    onRemove: (productId: string, size: string) => void;
    onClose: () => void;
}
export default function Cart({ items, onRemove, onClose }: CartProps): import("react").JSX.Element;
export {};
