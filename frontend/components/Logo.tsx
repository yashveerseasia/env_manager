interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export default function Logo({ className = '', width = 220, height = 48 }: LogoProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 220 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="ENV Manager"
    >
      <g>
        <rect x="0" y="4" rx="10" ry="10" width="40" height="40" fill="#4F46E5" />
        <path
          d="M20 12L28 16V24C28 28 24 32 20 34C16 32 12 28 12 24V16L20 12Z"
          fill="white"
        />
        <text x="52" y="31" fontSize="20" fontWeight="700" fill="#111827">
          ENV
        </text>
        <text x="98" y="31" fontSize="20" fontWeight="500" fill="#4F46E5">
          Manager
        </text>
      </g>
    </svg>
  );
}
