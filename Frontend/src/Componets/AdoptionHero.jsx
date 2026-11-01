import React from 'react';

export default function AdoptionHero({ title = "Find Your Companion" }) {
  return (
    <div className="adopt-hero">

      {/* Replace this SVG with your own illustration */}
      <div className="adopt-hero-svg">
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="32" cy="38" rx="14" ry="10" fill="rgba(224,122,95,0.55)" />
          <circle cx="20" cy="28" r="7" fill="rgba(224,122,95,0.55)" />
          <circle cx="32" cy="23" r="7" fill="rgba(224,122,95,0.55)" />
          <circle cx="44" cy="28" r="7" fill="rgba(224,122,95,0.55)" />
          <circle cx="16" cy="36" r="5" fill="rgba(224,122,95,0.38)" />
          <circle cx="48" cy="36" r="5" fill="rgba(224,122,95,0.38)" />
        </svg>
      </div>

      <div className="adopt-hero-text">
        <h2 className="adopt-hero-title">{title}</h2>
        <p className="adopt-hero-subtitle">
          Your companion is waiting — give them the home they deserve.
        </p>
      </div>

      {/* Replace this SVG with your own illustration */}
      <div className="adopt-hero-svg adopt-hero-svg--right">
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="32" cy="32" r="18" fill="rgba(137,196,212,0.25)" />
          <path d="M22 32 Q32 18 42 32 Q32 46 22 32Z" fill="rgba(137,196,212,0.5)" />
          <circle cx="32" cy="32" r="5" fill="rgba(137,196,212,0.7)" />
        </svg>
      </div>

    </div>
  );
}