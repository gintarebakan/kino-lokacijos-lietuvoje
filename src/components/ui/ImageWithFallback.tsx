import { useState, type CSSProperties } from "react";

interface ImageWithFallbackProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  style?: CSSProperties;
  fallbackType?: "poster" | "location";
  loading?: "lazy" | "eager";
  width?: number;
  height?: number;
}

const PosterFallback = () => (
  <div
    style={{
      width: "100%",
      height: "100%",
      background: "linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
    }}
  >
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" stroke="#c9a84c" strokeWidth="1.5" />
      <circle cx="8" cy="10" r="1.5" fill="#c9a84c" />
      <path d="M2 15l4-4 3 3 4-5 5 6" stroke="#c9a84c" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M2 4v16M22 4v16M7 4v16M12 4v16M17 4v16" stroke="#333" strokeWidth="0.5" />
    </svg>
    <span style={{ color: "#4b5563", fontSize: "10px", letterSpacing: "0.05em" }}>
      PLAKATAS
    </span>
  </div>
);

const LocationFallback = () => (
  <div
    style={{
      width: "100%",
      height: "100%",
      background: "linear-gradient(135deg, #1a1a1a 0%, #111 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
    }}
  >
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
        stroke="#c9a84c"
        strokeWidth="1.5"
        fill="none"
      />
      <circle cx="12" cy="9" r="2.5" stroke="#c9a84c" strokeWidth="1.5" fill="none" />
    </svg>
    <span style={{ color: "#4b5563", fontSize: "10px", letterSpacing: "0.05em" }}>
      LOKACIJA
    </span>
  </div>
);

export const ImageWithFallback = ({
  src,
  alt,
  className,
  style,
  fallbackType = "poster",
  loading = "lazy",
  width,
  height,
}: ImageWithFallbackProps) => {
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    return fallbackType === "poster" ? <PosterFallback /> : <LocationFallback />;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      loading={loading}
      width={width}
      height={height}
      onError={() => setErrored(true)}
    />
  );
};