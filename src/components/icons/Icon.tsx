// Icon component - Duotone SVG icons with accent color

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

export type IconName =
  // Existing icons
  | 'arrow-left'
  | 'undo'
  | 'redo'
  | 'filter'
  | 'dice'
  | 'map'
  | 'export'
  | 'hexagon'
  | 'close'
  | 'settings'
  // UI Action Icons
  | 'check'
  | 'circle'
  | 'circle-filled'
  | 'pencil'
  | 'trash'
  | 'eye'
  | 'eye-off'
  | 'chevron-down'
  | 'chevron-right'
  // Content Category Icons
  | 'pin'
  | 'sword'
  | 'user'
  | 'sparkle'
  | 'lightbulb'
  // Time & Weather Icons
  | 'clock'
  | 'calendar'
  | 'cloud-sun'
  | 'walk'
  // Weather Condition Icons
  | 'sun'
  | 'cloud-partial'
  | 'cloud'
  | 'cloud-rain'
  | 'cloud-storm'
  | 'fog'
  | 'snowflake'
  | 'wind'
  | 'thermometer-hot'
  | 'thermometer-cold'
  // Season Icons
  | 'flower'
  | 'leaf'
  // Time of Day Icons
  | 'sunrise'
  | 'sunset'
  | 'moon'
  | 'moon-new'
  // Search & Navigation Icons
  | 'search'
  | 'star'
  // Terrain Icons
  | 'tree'
  | 'triangle'
  | 'mountain'
  | 'drop'
  | 'water'
  // NPC & Faction Icons
  | 'shield'
  | 'users'
  | 'heart'
  | 'skull'
  | 'link';

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

  // ============ UI Action Icons ============

  'check': (
    <>
      {/* Secondary - circle background */}
      <circle cx="12" cy="12" r="9" fill="var(--icon-secondary)" />
      {/* Primary - checkmark */}
      <path
        d="M8 12l3 3 5-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  'circle': (
    <>
      {/* Secondary - inner fill */}
      <circle cx="12" cy="12" r="6" fill="var(--icon-secondary)" />
      {/* Primary - outline */}
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
    </>
  ),
  'circle-filled': (
    <>
      {/* Secondary - outer glow */}
      <circle cx="12" cy="12" r="9" fill="var(--icon-secondary)" />
      {/* Primary - filled center */}
      <circle cx="12" cy="12" r="5" fill="currentColor" />
    </>
  ),
  'pencil': (
    <>
      {/* Secondary - pencil body */}
      <path
        d="M12 20h9"
        fill="var(--icon-secondary)"
        stroke="none"
      />
      <path
        d="M4 20l2-8 10-10 4 4-10 10-6 4z"
        fill="var(--icon-secondary)"
      />
      {/* Primary - pencil outline */}
      <path
        d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  'trash': (
    <>
      {/* Secondary - trash can body */}
      <path
        d="M6 6v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6H6z"
        fill="var(--icon-secondary)"
      />
      {/* Primary - trash outline */}
      <path
        d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M10 11v6M14 11v6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),
  'eye': (
    <>
      {/* Secondary - eye shape fill */}
      <path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        fill="var(--icon-secondary)"
      />
      {/* Primary - eye outline and pupil */}
      <path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </>
  ),
  'eye-off': (
    <>
      {/* Secondary - partial eye fill */}
      <path
        d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"
        fill="var(--icon-secondary)"
      />
      {/* Primary - eye with slash */}
      <path
        d="M1 1l22 22"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M14.12 14.12a3 3 0 1 1-4.24-4.24"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),
  'chevron-down': (
    <>
      {/* Secondary - filled chevron area */}
      <path
        d="M6 9l6 6 6-6"
        fill="var(--icon-secondary)"
      />
      {/* Primary - chevron stroke */}
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  'chevron-right': (
    <>
      {/* Secondary - filled chevron area */}
      <path
        d="M9 18l6-6-6-6"
        fill="var(--icon-secondary)"
      />
      {/* Primary - chevron stroke */}
      <path
        d="M9 18l6-6-6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),

  // ============ Content Category Icons ============

  'pin': (
    <>
      {/* Secondary - pin head fill */}
      <circle cx="12" cy="10" r="6" fill="var(--icon-secondary)" />
      {/* Primary - pin outline */}
      <path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="12" cy="9" r="2.5" fill="currentColor" />
    </>
  ),
  'sword': (
    <>
      {/* Secondary - blade fill */}
      <path
        d="M14.5 4L20 9.5 9.5 20 4 14.5 14.5 4z"
        fill="var(--icon-secondary)"
      />
      {/* Primary - sword outline */}
      <path
        d="M14.5 4L20 9.5M4 14.5L9.5 20M7.5 16.5l-3 3M16.5 7.5l3-3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M15 5l4 4-10.5 10.5-4-4L15 5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Hilt */}
      <path
        d="M6 18l-2 2M8.5 15.5l-5 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),
  'user': (
    <>
      {/* Secondary - body fill */}
      <path
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
        fill="var(--icon-secondary)"
      />
      <circle cx="12" cy="7" r="4" fill="var(--icon-secondary)" />
      {/* Primary - outline */}
      <path
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle
        cx="12"
        cy="7"
        r="4"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
    </>
  ),
  'sparkle': (
    <>
      {/* Secondary - sparkle glow */}
      <path
        d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z"
        fill="var(--icon-secondary)"
      />
      {/* Primary - sparkle outline */}
      <path
        d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Small sparkles */}
      <circle cx="19" cy="5" r="1" fill="currentColor" />
      <circle cx="5" cy="19" r="1" fill="currentColor" />
    </>
  ),
  'lightbulb': (
    <>
      {/* Secondary - bulb fill */}
      <path
        d="M9 18h6M10 22h4"
        fill="var(--icon-secondary)"
      />
      <circle cx="12" cy="9" r="6" fill="var(--icon-secondary)" />
      {/* Primary - bulb outline */}
      <path
        d="M12 2a7 7 0 0 0-4 12.7V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.3A7 7 0 0 0 12 2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M9 18h6M10 22h4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),

  // ============ Time & Weather Icons ============

  'clock': (
    <>
      {/* Secondary - clock face */}
      <circle cx="12" cy="12" r="9" fill="var(--icon-secondary)" />
      {/* Primary - outline and hands */}
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M12 6v6l4 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),
  'calendar': (
    <>
      {/* Secondary - calendar body */}
      <rect x="3" y="4" width="18" height="18" rx="2" fill="var(--icon-secondary)" />
      {/* Primary - calendar outline */}
      <rect
        x="3"
        y="4"
        width="18"
        height="18"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M16 2v4M8 2v4M3 10h18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Date dots */}
      <circle cx="8" cy="15" r="1" fill="currentColor" />
      <circle cx="12" cy="15" r="1" fill="currentColor" />
      <circle cx="16" cy="15" r="1" fill="currentColor" />
    </>
  ),
  'cloud-sun': (
    <>
      {/* Secondary - sun rays and cloud */}
      <circle cx="17" cy="7" r="4" fill="var(--icon-secondary)" />
      <path
        d="M8 18a6 6 0 0 1 0-12h.5A5.5 5.5 0 0 1 19 9a4 4 0 0 1 0 8H8z"
        fill="var(--icon-secondary)"
      />
      {/* Primary - sun outline */}
      <circle
        cx="17"
        cy="7"
        r="3"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M17 1v2M17 11v1M23 7h-2M13 7h-1M21.5 2.5l-1.5 1.5M14 4l-1-1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Primary - cloud outline */}
      <path
        d="M8 19a6 6 0 0 1 0-12 5.5 5.5 0 0 1 10.43 2.08A4 4 0 0 1 18 19H8z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  'walk': (
    <>
      {/* Secondary - body fill */}
      <circle cx="12" cy="4" r="2" fill="var(--icon-secondary)" />
      <path
        d="M14 10l-2 5-3-2"
        fill="var(--icon-secondary)"
      />
      {/* Primary - walking figure */}
      <circle
        cx="12"
        cy="4"
        r="2"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M14 10l-2 5-3-2M9 22l3-7 3 1M12 15l3 4M15 19l2 3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M10 7h4l2 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),

  // ============ Weather Condition Icons ============

  'sun': (
    <>
      {/* Secondary - sun glow */}
      <circle cx="12" cy="12" r="6" fill="var(--icon-secondary)" />
      {/* Primary - sun outline and rays */}
      <circle
        cx="12"
        cy="12"
        r="5"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),
  'cloud-partial': (
    <>
      {/* Secondary - sun behind cloud */}
      <circle cx="18" cy="8" r="4" fill="var(--icon-secondary)" />
      <path
        d="M6 19a5 5 0 0 1 0-10h.5A4.5 4.5 0 0 1 15 6a3.5 3.5 0 0 1 0 7H6z"
        fill="var(--icon-secondary)"
      />
      {/* Primary - outlines */}
      <circle
        cx="18"
        cy="8"
        r="3"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M6 19a5 5 0 0 1 0-10 4.5 4.5 0 0 1 8.5-2A3.5 3.5 0 0 1 14 19H6z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  'cloud': (
    <>
      {/* Secondary - cloud fill */}
      <path
        d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"
        fill="var(--icon-secondary)"
      />
      {/* Primary - cloud outline */}
      <path
        d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  'cloud-rain': (
    <>
      {/* Secondary - cloud fill */}
      <path
        d="M16 13V6a4 4 0 0 0-8 0v.1A5 5 0 0 0 4 11a5 5 0 0 0 5 5h7a4 4 0 0 0 0-8z"
        fill="var(--icon-secondary)"
      />
      {/* Primary - cloud and rain */}
      <path
        d="M16 13V6a4 4 0 0 0-8 0v.1A5 5 0 0 0 4 11a5 5 0 0 0 5 5h7a4 4 0 0 0 0-8z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M8 19v2M12 19v2M16 19v2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),
  'cloud-storm': (
    <>
      {/* Secondary - cloud fill */}
      <path
        d="M19 12a6 6 0 0 0-6-6 6 6 0 0 0-5.66 4H6a4 4 0 0 0 0 8h12a4 4 0 0 0 1-7.9z"
        fill="var(--icon-secondary)"
      />
      {/* Primary - cloud and lightning */}
      <path
        d="M19 12a6 6 0 0 0-6-6 6 6 0 0 0-5.66 4H6a4 4 0 0 0 0 8h12a4 4 0 0 0 1-7.9z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Lightning bolt */}
      <path
        d="M13 17l-2 4 4-2-2 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  'fog': (
    <>
      {/* Secondary - fog layers fill */}
      <rect x="3" y="8" width="18" height="2" rx="1" fill="var(--icon-secondary)" />
      <rect x="3" y="14" width="18" height="2" rx="1" fill="var(--icon-secondary)" />
      {/* Primary - fog lines */}
      <path
        d="M3 8h18M3 12h18M3 16h18M6 20h12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),
  'snowflake': (
    <>
      {/* Secondary - center glow */}
      <circle cx="12" cy="12" r="4" fill="var(--icon-secondary)" />
      {/* Primary - snowflake arms */}
      <path
        d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Branch details */}
      <path
        d="M12 6l-2 2M12 6l2 2M12 18l-2-2M12 18l2-2M6 12l2-2M6 12l2 2M18 12l-2-2M18 12l-2 2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),
  'wind': (
    <>
      {/* Secondary - wind gust fill */}
      <path
        d="M9.59 4.59A2 2 0 1 1 11 8H2M12.59 19.41A2 2 0 1 0 14 16H2"
        fill="var(--icon-secondary)"
      />
      {/* Primary - wind lines */}
      <path
        d="M9.59 4.59A2 2 0 1 1 11 8H2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M12.59 19.41A2 2 0 1 0 14 16H2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M17.73 7.73A2.5 2.5 0 1 1 19.5 12H2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  'thermometer-hot': (
    <>
      {/* Secondary - thermometer body */}
      <rect x="9" y="2" width="6" height="14" rx="3" fill="var(--icon-secondary)" />
      <circle cx="12" cy="18" r="4" fill="var(--icon-secondary)" />
      {/* Primary - outline and mercury */}
      <path
        d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Hot indicator - high mercury */}
      <circle cx="12" cy="18" r="2" fill="currentColor" />
      <path d="M12 14v-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Heat waves */}
      <path
        d="M18 4l2 1M18 8l2-1M18 12l2 1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),
  'thermometer-cold': (
    <>
      {/* Secondary - thermometer body */}
      <rect x="9" y="2" width="6" height="14" rx="3" fill="var(--icon-secondary)" />
      <circle cx="12" cy="18" r="4" fill="var(--icon-secondary)" />
      {/* Primary - outline */}
      <path
        d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Cold indicator - low mercury */}
      <circle cx="12" cy="18" r="2" fill="currentColor" />
      {/* Snowflake indicator */}
      <path
        d="M19 8v4M17 10h4M19 8l1.5 1.5M19 8l-1.5 1.5M19 12l1.5-1.5M19 12l-1.5-1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),

  // ============ Season Icons ============

  'flower': (
    <>
      {/* Secondary - petals */}
      <circle cx="12" cy="7" r="3" fill="var(--icon-secondary)" />
      <circle cx="7" cy="12" r="3" fill="var(--icon-secondary)" />
      <circle cx="17" cy="12" r="3" fill="var(--icon-secondary)" />
      <circle cx="9" cy="16" r="3" fill="var(--icon-secondary)" />
      <circle cx="15" cy="16" r="3" fill="var(--icon-secondary)" />
      {/* Primary - petal outlines and center */}
      <circle cx="12" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="7" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="17" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="9" cy="16" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="15" cy="16" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      {/* Center */}
      <circle cx="12" cy="12" r="3" fill="currentColor" />
      {/* Stem */}
      <path d="M12 15v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  'leaf': (
    <>
      {/* Secondary - leaf fill */}
      <path
        d="M12 2C6.5 2 2 6.5 2 12c0 5.5 4.5 10 10 10 1.5 0 3-1.5 3-3 0-1.5-1.5-3-3-3-5 0-6-4-6-4s4-1 4-6c0 0 4 1 4 6 0 3 3 7 6 7"
        fill="var(--icon-secondary)"
      />
      {/* Primary - leaf outline */}
      <path
        d="M11 20A7 7 0 0 1 4 13C4 7.5 9.5 2 12 2c2.5 0 8 5.5 8 11a7 7 0 0 1-7 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Leaf vein */}
      <path
        d="M12 2v18M8 8c2 2 2 4 4 6M16 8c-2 2-2 4-4 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),

  // ============ Time of Day Icons ============

  'sunrise': (
    <>
      {/* Secondary - sun glow */}
      <circle cx="12" cy="14" r="5" fill="var(--icon-secondary)" />
      {/* Primary - horizon and sun */}
      <path
        d="M17 18a5 5 0 1 0-10 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Rays */}
      <path
        d="M12 2v4M4.93 10.93l2.83 2.83M2 18h4M18 18h4M18.24 13.76l2.83-2.83"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Horizon line */}
      <path
        d="M2 22h20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),
  'sunset': (
    <>
      {/* Secondary - sun glow */}
      <circle cx="12" cy="16" r="5" fill="var(--icon-secondary)" />
      {/* Primary - horizon and setting sun */}
      <path
        d="M17 18a5 5 0 1 0-10 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Rays fading down */}
      <path
        d="M12 9v3M4.93 13.93l2 2M17.07 15.93l2-2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Horizon line */}
      <path
        d="M2 22h20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Clouds */}
      <path
        d="M3 18h3M18 18h3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),
  'moon': (
    <>
      {/* Secondary - moon glow */}
      <path
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
        fill="var(--icon-secondary)"
      />
      {/* Primary - moon outline */}
      <path
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Stars */}
      <circle cx="18" cy="5" r="1" fill="currentColor" />
      <circle cx="21" cy="9" r="0.5" fill="currentColor" />
    </>
  ),
  'moon-new': (
    <>
      {/* Secondary - dark moon */}
      <circle cx="12" cy="12" r="9" fill="var(--icon-secondary)" />
      {/* Primary - moon outline */}
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      {/* Stars around */}
      <circle cx="4" cy="4" r="1" fill="currentColor" />
      <circle cx="20" cy="6" r="0.75" fill="currentColor" />
      <circle cx="19" cy="18" r="1" fill="currentColor" />
      <circle cx="5" cy="19" r="0.5" fill="currentColor" />
    </>
  ),

  // ============ Search & Navigation Icons ============

  'search': (
    <>
      {/* Secondary - lens fill */}
      <circle cx="11" cy="11" r="6" fill="var(--icon-secondary)" />
      {/* Primary - lens outline and handle */}
      <circle
        cx="11"
        cy="11"
        r="8"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M21 21l-4.35-4.35"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),
  'star': (
    <>
      {/* Secondary - star fill */}
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        fill="var(--icon-secondary)"
      />
      {/* Primary - star outline */}
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),

  // ============ Terrain Icons ============

  'tree': (
    <>
      {/* Secondary - foliage fill */}
      <path
        d="M12 2L5 12h3l-2 5h12l-2-5h3L12 2z"
        fill="var(--icon-secondary)"
      />
      {/* Primary - tree outline */}
      <path
        d="M12 2L5 12h3l-2 5h12l-2-5h3L12 2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Trunk */}
      <path
        d="M12 17v5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </>
  ),
  'triangle': (
    <>
      {/* Secondary - triangle fill */}
      <path
        d="M12 3L2 21h20L12 3z"
        fill="var(--icon-secondary)"
      />
      {/* Primary - triangle outline */}
      <path
        d="M12 3L2 21h20L12 3z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  'mountain': (
    <>
      {/* Secondary - mountain fill */}
      <path
        d="M2 20L8 8l4 5 3-4 5 11H2z"
        fill="var(--icon-secondary)"
      />
      {/* Primary - mountain outline */}
      <path
        d="M2 20L8 8l4 5 3-4 5 11H2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Snow cap */}
      <path
        d="M8 8l2 3 1-1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  'drop': (
    <>
      {/* Secondary - drop fill */}
      <path
        d="M12 2C8 8 4 12 4 16a8 8 0 0 0 16 0c0-4-4-8-8-14z"
        fill="var(--icon-secondary)"
      />
      {/* Primary - drop outline */}
      <path
        d="M12 2C8 8 4 12 4 16a8 8 0 0 0 16 0c0-4-4-8-8-14z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  'water': (
    <>
      {/* Secondary - wave fill */}
      <path
        d="M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0v6H2v-6z"
        fill="var(--icon-secondary)"
      />
      {/* Primary - wave lines */}
      <path
        d="M2 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M2 14c2-2 4-2 6 0s4 2 6 0 4-2 6 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M2 20c2-2 4-2 6 0s4 2 6 0 4-2 6 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),

  // ============ NPC & Faction Icons ============

  'shield': (
    <>
      {/* Secondary - shield fill */}
      <path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        fill="var(--icon-secondary)"
      />
      {/* Primary - shield outline */}
      <path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  'users': (
    <>
      {/* Secondary - body fills */}
      <path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
        fill="var(--icon-secondary)"
      />
      <circle cx="9" cy="7" r="4" fill="var(--icon-secondary)" />
      {/* Primary - outlines */}
      <path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" fill="none" />
      <path
        d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  'heart': (
    <>
      {/* Secondary - heart fill */}
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"
        fill="var(--icon-secondary)"
      />
      {/* Primary - heart outline */}
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  'skull': (
    <>
      {/* Secondary - skull fill */}
      <circle cx="12" cy="10" r="8" fill="var(--icon-secondary)" />
      {/* Primary - skull outline */}
      <circle cx="12" cy="10" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
      {/* Eyes */}
      <circle cx="9" cy="9" r="1.5" fill="currentColor" />
      <circle cx="15" cy="9" r="1.5" fill="currentColor" />
      {/* Jaw */}
      <path
        d="M8 18v3h2v-2h4v2h2v-3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Nose */}
      <path d="M12 12v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  'link': (
    <>
      {/* Secondary - chain link fill */}
      <path
        d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
        fill="var(--icon-secondary)"
      />
      {/* Primary - chain outline */}
      <path
        d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
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
