import React from 'react';

interface NestlyLogoProps {
  className?: string;
  size?: number;
}

export const NestlyLogo: React.FC<NestlyLogoProps> = ({ className = '', size = 32 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
    width={size}
    height={size}
    className={className}
    role="img"
    aria-label="Nestly"
  >
    {/* Rounded square background — uses theme primary */}
    <rect width="512" height="512" rx="108" fill="hsl(var(--primary))" />

    {/* Nest bowl */}
    <path
      d="M130 310 Q130 410 256 410 Q382 410 382 310"
      fill="none"
      stroke="hsl(var(--primary-foreground))"
      strokeWidth="28"
      strokeLinecap="round"
      opacity="0.85"
    />
    {/* Nest weave lines */}
    <path
      d="M148 330 Q256 380 364 330"
      fill="none"
      stroke="hsl(var(--primary-foreground))"
      strokeWidth="14"
      strokeLinecap="round"
      opacity="0.45"
    />
    <path
      d="M155 360 Q256 400 357 360"
      fill="none"
      stroke="hsl(var(--primary-foreground))"
      strokeWidth="12"
      strokeLinecap="round"
      opacity="0.3"
    />

    {/* Three eggs */}
    <ellipse cx="200" cy="290" rx="38" ry="48" fill="hsl(var(--primary-foreground))" opacity="0.9" transform="rotate(-10 200 290)" />
    <ellipse cx="256" cy="280" rx="38" ry="50" fill="hsl(var(--primary-foreground))" opacity="0.9" />
    <ellipse cx="312" cy="290" rx="38" ry="48" fill="hsl(var(--primary-foreground))" opacity="0.9" transform="rotate(10 312 290)" />

    {/* Egg shine */}
    <ellipse cx="190" cy="272" rx="12" ry="16" fill="hsl(var(--primary-foreground))" opacity="0.3" transform="rotate(-10 190 272)" />
    <ellipse cx="248" cy="262" rx="12" ry="16" fill="hsl(var(--primary-foreground))" opacity="0.3" />
    <ellipse cx="304" cy="272" rx="12" ry="16" fill="hsl(var(--primary-foreground))" opacity="0.3" transform="rotate(10 304 272)" />

    {/* Heart */}
    <path
      d="M256 170 C256 170 240 148 224 148 C206 148 192 164 192 180 C192 208 256 230 256 230 C256 230 320 208 320 180 C320 164 306 148 288 148 C272 148 256 170 256 170Z"
      fill="hsl(var(--primary-foreground))"
      opacity="0.6"
    />
  </svg>
);
