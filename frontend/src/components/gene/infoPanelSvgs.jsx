export function AnimatedWave({ selectedSite }) {
  return (
    <svg
      id="wave-1"
      width="100%"
      height="320"
      viewBox="0 0 680 320"
      preserveAspectRatio="none"
      className="absolute bottom-0 left-0 pointer-events-none transition-[transform] duration-150 ease-in-out"
      style={{ transform: selectedSite ? "translateY(0px)" : "translateY(140px)" }}
    >
      <path
        d="M 0 86 C 80 66 160 101 240 82 C 330 55 391 101 530 82 C 554 77 601 72 680 86 L 680 350 L 0 350 Z"
        fill="#0e4f7a"
      />
      <path
        d="M 0 102 C 90 82 170 115 260 96 C 340 78 403 121 569 86 C 611 77 660 102 680 98 L 680 350 L 0 350 Z"
        fill="#079aaa"
      />
    </svg>
  );
}

export function StaticWave() {
  return (
    <svg
      id="wave-2"
      width="100%"
      height="170"
      viewBox="0 0 680 170"
      preserveAspectRatio="none"
      className="absolute bottom-0 left-0 pointer-events-none"
    >
      <path
        d="M 0 117 C 100 97 160 138 280 110 C 370 92 450 120 530 102 C 590 88 640 105 680 110 L 680 170 L 0 170 Z"
        fill="#00e0e0"
        opacity="0.85"
      />
    </svg>
  );
}

export function CloseArrow({ onClose }) {
  return (
    <svg width="40" height="125" viewBox="0 0 40 125" onClick={onClose} className="cursor-pointer mr-8">
      <defs>
        <marker id="arrowhead" viewBox="0 0 10 10" refX="5" refY="10" markerWidth="8" markerHeight="8">
          <path
            d="M0 0L5 10L10 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </marker>
      </defs>
      <path
        d="M15 0 C23 15, 7 30, 15 45 C23 60, 7 75, 15 90 C19 98, 15 110, 15 120"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        markerEnd="url(#arrowhead)"
      />
      <text x="25" y="60" textAnchor="middle" transform="rotate(90, 25, 60)" fill="currentColor">
        CLOSE
      </text>
    </svg>
  );
}
