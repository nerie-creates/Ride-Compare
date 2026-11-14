import { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
  objectFit?: 'cover' | 'contain';
}

export function SafeImage({
  src,
  alt,
  className = '',
  fallbackLabel,
  objectFit = 'cover',
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500 px-3 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <ImageOff className="w-5 h-5 mb-1.5 text-slate-400 shrink-0" />
        <span className="text-xs font-medium text-slate-600 line-clamp-2">
          {fallbackLabel || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setFailed(true)}
      className={`${objectFit === 'contain' ? 'object-contain' : 'object-cover'} ${className}`}
    />
  );
}
