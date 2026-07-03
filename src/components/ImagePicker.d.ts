interface ImagePickerProps {
    current: string | null;
    onSelect: (url: string) => void;
    onClose: () => void;
}
/** Overlay for choosing a window's artwork: shipped designs or a custom URL. */
export default function ImagePicker({ current, onSelect, onClose }: ImagePickerProps): import("react").JSX.Element;
export {};
