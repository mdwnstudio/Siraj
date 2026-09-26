/* Real flag artwork, not emoji - emoji render inconsistently across
   platforms and look nothing like the rest of the interface.
   Simplified to the minimum marks that still read at 34px. */

const W = 34, H = 23, R = 4

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <svg width={W} height={H} viewBox="0 0 34 23" aria-hidden focusable="false">
      <defs>
        <clipPath id="fclip"><rect width={W} height={H} rx={R} /></clipPath>
      </defs>
      <g clipPath="url(#fclip)">{children}</g>
      <rect width={W} height={H} rx={R} fill="none" stroke="rgba(69,7,5,.16)" strokeWidth="1.4" />
    </svg>
  )
}

/* Arabic is flown under Palestine's flag: black, white and green bands
   with the red triangle at the hoist */
export const FlagAR = () => (
  <Frame>
    <rect width={W} height={H} fill="#fff" />
    <rect width={W} height={H / 3} fill="#000" />
    <rect y={(H * 2) / 3} width={W} height={H / 3} fill="#149954" />
    <path d={`M0 0 L${W / 3} ${H / 2} L0 ${H} Z`} fill="#E4312B" />
  </Frame>
)

export const FlagEN = () => (
  <Frame>
    <rect width={W} height={H} fill="#012169" />
    <path d="M0 0 L34 23 M34 0 L0 23" stroke="#fff" strokeWidth="5" />
    <path d="M0 0 L34 23 M34 0 L0 23" stroke="#C8102E" strokeWidth="2.4" />
    <path d="M17 0 V23 M0 11.5 H34" stroke="#fff" strokeWidth="7.5" />
    <path d="M17 0 V23 M0 11.5 H34" stroke="#C8102E" strokeWidth="4.2" />
  </Frame>
)

export const FlagFR = () => (
  <Frame>
    <rect width={W} height={H} fill="#fff" />
    <rect width="11.34" height={H} fill="#002395" />
    <rect x="22.66" width="11.34" height={H} fill="#ED2939" />
  </Frame>
)

export const FlagTR = () => (
  <Frame>
    <rect width={W} height={H} fill="#E30A17" />
    <circle cx="13" cy="11.5" r="6" fill="#fff" />
    <circle cx="15" cy="11.5" r="4.8" fill="#E30A17" />
    <path d="M20.4 11.5 L22.9 12.3 L21.3 10.2 L21.3 12.8 L22.9 10.7 Z" fill="#fff" />
  </Frame>
)

export const FlagID = () => (
  <Frame>
    <rect width={W} height="11.5" fill="#CE1126" />
    <rect y="11.5" width={W} height="11.5" fill="#fff" />
  </Frame>
)

export const FlagUR = () => (
  <Frame>
    <rect width={W} height={H} fill="#01411C" />
    <rect width="9" height={H} fill="#fff" />
    <circle cx="21" cy="11.5" r="5.6" fill="#fff" />
    <circle cx="23.2" cy="10.4" r="4.9" fill="#01411C" />
    <path d="M26.6 6.4 L27.4 8.3 L29.3 8.4 L27.8 9.7 L28.3 11.6 L26.6 10.5 L25 11.6 L25.5 9.7 L24 8.4 L25.9 8.3 Z" fill="#fff" />
  </Frame>
)

export const FlagES = () => (
  <Frame>
    <rect width={W} height={H} fill="#AA151B" />
    <rect y="5.75" width={W} height="11.5" fill="#F1BF00" />
  </Frame>
)

export const FlagDE = () => (
  <Frame>
    <rect width={W} height="7.67" fill="#000" />
    <rect y="7.67" width={W} height="7.67" fill="#DD0000" />
    <rect y="15.34" width={W} height="7.66" fill="#FFCE00" />
  </Frame>
)
