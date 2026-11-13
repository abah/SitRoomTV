export default function BrandMark({ className = "brand__mark" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="64" height="64" rx="14" fill="#E8F0FC" />
      <circle cx="26" cy="32" r="16" fill="#0B57D0" />
      <circle cx="38" cy="32" r="16" fill="#5B8DEF" fillOpacity="0.72" />
      <circle cx="32" cy="32" r="6.5" fill="#0A1628" />
    </svg>
  );
}
