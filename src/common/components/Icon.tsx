import * as React from 'react';

export type IconName = 'truck' | 'calendar' | 'monitor' | 'document' | 'pin' | 'people' | 'chart' | 'mail' | 'help' | 'folder' | 'box' | 'link';

export const ICON_OPTIONS: { key: IconName; text: string }[] = [
  { key: 'truck', text: 'Truck' },
  { key: 'box', text: 'Parcel' },
  { key: 'calendar', text: 'Calendar' },
  { key: 'monitor', text: 'Computer' },
  { key: 'document', text: 'Document' },
  { key: 'folder', text: 'Folder' },
  { key: 'pin', text: 'Map pin' },
  { key: 'people', text: 'People' },
  { key: 'chart', text: 'Chart' },
  { key: 'mail', text: 'Mail' },
  { key: 'help', text: 'Help' },
  { key: 'link', text: 'Link' }
];

const PATHS: Record<IconName, React.ReactNode> = {
  truck: (
    <>
      <rect x="3" y="7" width="13" height="10" />
      <path d="M16 10h3l2 3v4h-5" />
      <circle cx="7" cy="18" r="1.6" />
      <circle cx="18" cy="18" r="1.6" />
    </>
  ),
  box: (
    <>
      <path d="M3 7l9-4 9 4v10l-9 4-9-4z" />
      <path d="M3 7l9 4 9-4M12 11v10" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  monitor: (
    <>
      <rect x="3" y="4" width="18" height="12" />
      <path d="M8 20h8M12 16v4" />
    </>
  ),
  document: (
    <>
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M9 12h7M9 16h7" />
    </>
  ),
  folder: <path d="M3 6h6l2 2h10v11H3z" />,
  pin: (
    <>
      <path d="M12 21s-7-6-7-11a7 7 0 0114 0c0 5-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2 20c0-4 3-6 7-6s7 2 7 6M16 4a3.5 3.5 0 010 7M22 20c0-3-1.5-5-4-5.6" />
    </>
  ),
  chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" />
      <path d="M3 6l9 7 9-7" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 015 0c0 2-2.5 2-2.5 4M12 17v.5" />
    </>
  ),
  link: <path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1" />
};

/** Simple stroke icons, decorative only (the link text says what it is). */
export const Icon: React.FC<{ name: IconName; size?: number; className?: string }> = ({ name, size = 22, className }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    {PATHS[name] || PATHS.link}
  </svg>
);
