import React from 'react';

type LogoMode = 'dark' | 'light';
type LogoVariant = 'lockup' | 'icon';

interface SparkedLogoProps {
  mode?: LogoMode;
  variant?: LogoVariant;
  size?: number;
  className?: string;
}

const TwinFlamesIcon: React.FC<{ size: number; mode: LogoMode }> = ({ size }) => {
  const aspectRatio = 56 / 76;
  const width = Math.round(size * aspectRatio);

  return (
    <svg
      width={width}
      height={size}
      viewBox="0 0 56 76"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="tf-base" x1="0" y1="1" x2="0" y2="0" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#ff5f4e" />
          <stop offset="100%" stopColor="#ff8c38" />
        </linearGradient>
        <linearGradient id="tf-tip" x1="0" y1="1" x2="0" y2="0" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#ff8c38" />
          <stop offset="100%" stopColor="#ffca3a" />
        </linearGradient>
      </defs>

      <path
        d="M28 68
           C16 58 8 46 10 32
           C12 20 20 12 28 10
           C24 16 22 24 24 32
           C26 40 32 44 32 52
           C32 60 30 66 28 68Z"
        fill="url(#tf-base)"
      />
      <path
        d="M28 8
           C38 16 46 26 44 38
           C42 50 34 58 28 60
           C32 54 34 46 32 38
           C30 30 24 26 24 18
           C24 12 26 9 28 8Z"
        fill="url(#tf-tip)"
        opacity={0.9}
      />
    </svg>
  );
};

const Wordmark: React.FC<{ mode: LogoMode; fontSize: number }> = ({ mode, fontSize }) => {
  const style: React.CSSProperties = {
    fontFamily: "'Montserrat', sans-serif",
    fontSize,
    fontWeight: 900,
    letterSpacing: '-0.01em',
    lineHeight: 1,
    ...(mode === 'dark'
      ? {
          background: 'linear-gradient(135deg, #ff5f4e 0%, #ff8c38 50%, #ffca3a 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }
      : {
          color: '#14213D',
        }),
  };

  return <span style={style}>Sparked</span>;
};

const SparkedLogo: React.FC<SparkedLogoProps> = ({
  mode = 'dark',
  variant = 'lockup',
  size = 32,
  className,
}) => {
  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: Math.round(size * 0.3),
    lineHeight: 1,
  };

  if (variant === 'icon') {
    return (
      <span style={{ display: 'inline-flex' }} className={className}>
        <TwinFlamesIcon size={size} mode={mode} />
      </span>
    );
  }

  return (
    <span style={containerStyle} className={className}>
      <TwinFlamesIcon size={size} mode={mode} />
      <Wordmark mode={mode} fontSize={Math.round(size * 0.6)} />
    </span>
  );
};

export default SparkedLogo;
