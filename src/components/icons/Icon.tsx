// Icon component - Duotone SVG icons with accent color

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

export type IconName =
  | 'arrow-left'
  | 'undo'
  | 'redo'
  | 'filter'
  | 'dice'
  | 'map'
  | 'export'
  | 'hexagon'
  | 'close'
  | 'settings';

const icons: Record<IconName, JSX.Element> = {
  'arrow-left': (
    <>
      {/* Secondary - filled chevron background */}
      <path
        d="M14 6l-6 6 6 6"
        fill="var(--icon-secondary)"
        stroke="none"
      />
      {/* Primary - arrow line */}
      <path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  'undo': (
    <>
      {/* Secondary - circular sweep fill */}
      <path
        d="M3 13a9 9 0 1 0 2.5-6.5"
        fill="var(--icon-secondary)"
        stroke="none"
      />
      {/* Primary - arrow and arc */}
      <path
        d="M3 7v6h6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M3 13a9 9 0 1 0 2.5-6.5L3 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  'redo': (
    <>
      {/* Secondary - circular sweep fill */}
      <path
        d="M21 13a9 9 0 1 1-2.5-6.5"
        fill="var(--icon-secondary)"
        stroke="none"
      />
      {/* Primary - arrow and arc */}
      <path
        d="M21 7v6h-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M21 13a9 9 0 1 1-2.5-6.5L21 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  'filter': (
    <>
      {/* Secondary - funnel shape background */}
      <path
        d="M4 4h16l-6 7v6l-4 2V11L4 4z"
        fill="var(--icon-secondary)"
        stroke="none"
      />
      {/* Primary - funnel outline */}
      <path
        d="M4 4h16l-6 7v6l-4 2V11L4 4z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  'dice': (
    <>
      {/* Secondary - filled dice face */}
      <rect x="3" y="3" width="18" height="18" rx="3"
            fill="var(--icon-secondary)" />
      {/* Primary - dice outline */}
      <rect x="3" y="3" width="18" height="18" rx="3"
            stroke="currentColor" strokeWidth="2" fill="none" />
      {/* Primary - dots */}
      <circle cx="8" cy="8" r="1.5" fill="currentColor" />
      <circle cx="16" cy="8" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <circle cx="8" cy="16" r="1.5" fill="currentColor" />
      <circle cx="16" cy="16" r="1.5" fill="currentColor" />
    </>
  ),
  'map': (
    <>
      {/* Secondary - center panel fill */}
      <path
        d="M8 2l8 4v16l-8-4V2z"
        fill="var(--icon-secondary)"
        stroke="none"
      />
      {/* Primary - map outline and folds */}
      <path
        d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M8 2v16M16 6v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  'export': (
    <>
      {/* Secondary - document base */}
      <path
        d="M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4H5z"
        fill="var(--icon-secondary)"
        stroke="none"
      />
      {/* Primary - arrow and document outline */}
      <path
        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M7 10l5-5 5 5M12 5v12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  'hexagon': (
    <>
      {/* Secondary - filled hex center */}
      <path
        d="M12 2l9 5v10l-9 5-9-5V7l9-5z"
        fill="var(--icon-secondary)"
      />
      {/* Primary - hex outline */}
      <path
        d="M12 2l9 5v10l-9 5-9-5V7l9-5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  'close': (
    <>
      {/* Secondary - circular background */}
      <circle cx="12" cy="12" r="9" fill="var(--icon-secondary)" />
      {/* Primary - X mark */}
      <path
        d="M15 9l-6 6M9 9l6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  'settings': (
    <>
      {/* Secondary - gear body */}
      <circle cx="12" cy="12" r="5" fill="var(--icon-secondary)" />
      {/* Primary - gear outline and teeth */}
      <path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
};

function Icon({ name, size = 16, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`icon icon-${name} ${className}`}
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  );
}

export default Icon;
