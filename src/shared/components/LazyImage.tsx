'use client';

import React from 'react';

type LazyImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  fallbackSrc?: string;
};

export function LazyImage({ loading, decoding, fallbackSrc, onError, src, ...rest }: LazyImageProps) {
  const [currentSrc, setCurrentSrc] = React.useState(src);

  React.useEffect(() => {
    setCurrentSrc(src);
  }, [src]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...rest}
      src={currentSrc}
      loading={loading ?? 'lazy'}
      decoding={decoding ?? 'async'}
      onError={(event) => {
        if (fallbackSrc && currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
        onError?.(event);
      }}
    />
  );
}
