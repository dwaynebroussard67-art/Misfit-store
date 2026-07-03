interface OwnerBarProps {
    forgeMode: boolean;
    onForgeModeChange: (on: boolean) => void;
    saving: boolean;
}
/**
 * Owner controls. Signed out: a quiet "Owner" link in the footer area.
 * Signed in: a bar with the Forge Mode toggle. Forge Mode = edit mode.
 */
export default function OwnerBar({ forgeMode, onForgeModeChange, saving }: OwnerBarProps): import("react").JSX.Element;
export {};
