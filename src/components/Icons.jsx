// Lightweight, dependency-free inline icons.
// Stroke uses currentColor so icons inherit text color.

function Svg({ children, size = 20, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  )
}

export function ArrowRight(props) {
  return (
    <Svg {...props}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </Svg>
  )
}

export function Compass(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
    </Svg>
  )
}

export function Sunrise(props) {
  return (
    <Svg {...props}>
      <path d="M12 2v3" />
      <path d="m5 8 1.5 1.5" />
      <path d="M2 16h4" />
      <path d="M18 16h4" />
      <path d="m17.5 9.5 1.5-1.5" />
      <path d="M22 20H2" />
      <path d="M8 16a4 4 0 0 1 8 0" />
    </Svg>
  )
}

export function BookOpen(props) {
  return (
    <Svg {...props}>
      <path d="M12 7v13" />
      <path d="M3 5.5A19 19 0 0 1 12 7a19 19 0 0 1 9-1.5V18a19 19 0 0 0-9 1.5A19 19 0 0 0 3 18Z" />
    </Svg>
  )
}

export function ShieldCheck(props) {
  return (
    <Svg {...props}>
      <path d="M12 3 5 6v5c0 4 3 6.5 7 8 4-1.5 7-4 7-8V6Z" />
      <path d="m9 12 2 2 4-4" />
    </Svg>
  )
}

export function Check(props) {
  return (
    <Svg {...props}>
      <path d="m5 12 4.5 4.5L19 7" />
    </Svg>
  )
}

export function NoEntry(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M6 6 18 18" />
    </Svg>
  )
}

export function Spark(props) {
  return (
    <Svg {...props}>
      <path d="M12 3v4" />
      <path d="M12 17v4" />
      <path d="M3 12h4" />
      <path d="M17 12h4" />
      <path d="M12 9a3 3 0 0 0 3 3 3 3 0 0 0-3 3 3 3 0 0 0-3-3 3 3 0 0 0 3-3Z" />
    </Svg>
  )
}

export function Lightbulb(props) {
  return (
    <Svg {...props}>
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M12 3a6 6 0 0 0-4 10.5c.6.6 1 1.4 1 2.5h6c0-1.1.4-1.9 1-2.5A6 6 0 0 0 12 3Z" />
    </Svg>
  )
}

export function Flag(props) {
  return (
    <Svg {...props}>
      <path d="M5 21V4" />
      <path d="M5 4c3-1.5 6 1.5 9 0v8c-3 1.5-6-1.5-9 0" />
    </Svg>
  )
}

export function Coins(props) {
  return (
    <Svg {...props}>
      <ellipse cx="8" cy="6" rx="5" ry="2.5" />
      <path d="M3 6v5c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5V6" />
      <path d="M3 11v5c0 1.4 2.2 2.5 5 2.5 1 0 1.9-.1 2.7-.4" />
      <ellipse cx="16" cy="15" rx="5" ry="2.5" />
      <path d="M11 15v3c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-3" />
    </Svg>
  )
}

export function Umbrella(props) {
  return (
    <Svg {...props}>
      <path d="M12 3v2" />
      <path d="M3 12a9 9 0 0 1 18 0Z" />
      <path d="M12 12v6a2.5 2.5 0 0 0 5 0" />
    </Svg>
  )
}

export function Clock(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Svg>
  )
}

export function GraduationCap(props) {
  return (
    <Svg {...props}>
      <path d="M12 4 2 9l10 5 10-5-10-5Z" />
      <path d="M6 11v5c0 1 2.7 3 6 3s6-2 6-3v-5" />
    </Svg>
  )
}

export function Scroll(props) {
  return (
    <Svg {...props}>
      <path d="M6 4h11a2 2 0 0 1 2 2v1H8" />
      <path d="M8 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-3H10" />
      <path d="M5 7H3v11a2 2 0 0 0 2 2" />
    </Svg>
  )
}

export function Receipt(props) {
  return (
    <Svg {...props}>
      <path d="M5 3v18l2-1.5L9 21l2-1.5L13 21l2-1.5L17 21l2-1.5V3l-2 1.5L15 3l-2 1.5L11 3 9 4.5 7 3 5 4.5Z" />
      <path d="M8 8h8" />
      <path d="M8 12h8" />
    </Svg>
  )
}

export function TrendingUp(props) {
  return (
    <Svg {...props}>
      <path d="M3 17 10 10l4 4 7-7" />
      <path d="M15 7h6v6" />
    </Svg>
  )
}

export function Heart(props) {
  return (
    <Svg {...props}>
      <path d="M12 20s-7-4.4-9.3-8.6C1.3 8.7 2.7 5.5 5.8 5.5c1.9 0 3.2 1.1 4.2 2.4 1-1.3 2.3-2.4 4.2-2.4 3.1 0 4.5 3.2 3.1 5.9C19 15.6 12 20 12 20Z" />
    </Svg>
  )
}

export function Scale(props) {
  return (
    <Svg {...props}>
      <path d="M12 4v16" />
      <path d="M7 20h10" />
      <path d="M5 7h14" />
      <path d="M5 7 2.5 13a3 3 0 0 0 5 0Z" />
      <path d="M19 7l-2.5 6a3 3 0 0 0 5 0Z" />
    </Svg>
  )
}

/* --- Signature brand marks: the Horizon (a low sun rising over a line) --- */
export function Horizon(props) {
  return (
    <Svg {...props}>
      <path d="M12 3.5v2" />
      <path d="m5.6 7.2 1.2 1.2" />
      <path d="m18.4 7.2-1.2 1.2" />
      <path d="M7 15.5a5 5 0 0 1 10 0" />
      <path d="M2.5 15.5h19" />
      <path d="M4.5 20q7.5-2.2 15 0" />
    </Svg>
  )
}

export function Sun(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.2" />
      <path d="M12 19.3v2.2" />
      <path d="M4.3 4.3l1.6 1.6" />
      <path d="M18.1 18.1l1.6 1.6" />
      <path d="M2.5 12h2.2" />
      <path d="M19.3 12h2.2" />
      <path d="M4.3 19.7l1.6-1.6" />
      <path d="M18.1 5.9l1.6-1.6" />
    </Svg>
  )
}
