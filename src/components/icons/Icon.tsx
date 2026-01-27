// Icon component - SVG icons for the application

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
  | 'close';

const icons: Record<IconName, JSX.Element> = {
  'arrow-left': (
    <path
      d="M19 12H5M12 19l-7-7 7-7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  'undo': (
    <path
      d="M3 7v6h6M3 13a9 9 0 1 0 2.5-6.5L3 9"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  'redo': (
    <path
      d="M21 7v6h-6M21 13a9 9 0 1 1-2.5-6.5L21 9"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  'filter': (
    <>
      <line x1="4" y1="6" x2="20" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="6" y1="12" x2="18" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="8" y1="18" x2="16" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  'dice': (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="8" cy="8" r="1.5" fill="currentColor" />
      <circle cx="16" cy="8" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <circle cx="8" cy="16" r="1.5" fill="currentColor" />
      <circle cx="16" cy="16" r="1.5" fill="currentColor" />
    </>
  ),
  'map': (
    <>
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
    <path
      d="M7 17l5-5 5 5M12 12v9M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  'hexagon': (
    <path
      d="M12 2l9 5v10l-9 5-9-5V7l9-5z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  'close': (
    <path
      d="M18 6L6 18M6 6l12 12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
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
