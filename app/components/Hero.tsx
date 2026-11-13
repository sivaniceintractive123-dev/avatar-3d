'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const FRAME_COUNT = 181;
const MIDDLE_FRAME  = Math.round((FRAME_COUNT - 1) / 2);
const NAV  = ['Home', 'Chapters', 'Gallery', 'Story'];

export default function Hero() {
  const sectionRef  = useRef<HTMLElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const imagesRef   = useRef<(HTMLImageElement | null)[]>([]);
  const frameRef    = useRef(MIDDLE_FRAME);
  const navRef      = useRef<HTMLElement>(null);
  const contentRef  = useRef<HTMLDivElement>(null);
  const bottomRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas  = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // ── resize canvas
    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      draw(frameRef.current);
    };
    resize();
    window.addEventListener('resize', resize);

    function draw(i: number) {
      const img = imagesRef.current[i];
      if (!img || !img.complete || img.naturalWidth === 0) return;
      const { naturalWidth: iw, naturalHeight: ih } = img;
      const cw = canvas!.width, ch = canvas!.height;
      const scale = Math.max(cw / iw, ch / ih);
      ctx!.clearRect(0, 0, cw, ch);
      ctx!.drawImage(img, (cw - iw * scale) / 2, (ch - ih * scale) / 2, iw * scale, ih * scale);
    }

    // ── preload frames
    imagesRef.current = new Array(FRAME_COUNT).fill(null);
    let first = false;
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.src = `/left%20right/ezgif-frame-${String(i + 1).padStart(3, '0')}.jpg`;
      img.onload = () => {
        imagesRef.current[i] = img;
        if (!first) { first = true; frameRef.current = i; draw(i); }
        if (i === frameRef.current) draw(i);
      };
    }

    // ── mouse → frame (window-level so overlays don't block)
    const onMove = (e: MouseEvent) => {
      if (!section) return;
      const r = section.getBoundingClientRect();
      if (e.clientY < r.top || e.clientY > r.bottom) return;
      const ratio = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      const idx   = Math.round(ratio * (FRAME_COUNT - 1));
      if (idx !== frameRef.current) { frameRef.current = idx; draw(idx); }
    };
    window.addEventListener('mousemove', onMove);

    // ── GSAP entrance
    const tl = gsap.timeline({ delay: 0.1 });
    tl.fromTo(navRef.current,
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }
    )
    .fromTo(contentRef.current,
      { opacity: 0, x: -50 },
      { opacity: 1, x: 0, duration: 1.1, ease: 'power3.out' },
      '-=0.5'
    )
    .fromTo(bottomRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
      '-=0.6'
    );

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  const scrollToChapters = () => {
    gsap.registerPlugin(ScrollTrigger);
    const t = ScrollTrigger.getById('frame-0');
    window.dispatchEvent(new CustomEvent('avatar:scrollTo', { detail: t?.start ?? 0 }));
  };

  const scrollToGallery = () => {
    const el = document.querySelector('[data-gallery]') as HTMLElement | null;
    if (el) window.scrollTo({ top: el.offsetTop, behavior: 'smooth' });
  };

  return (
    <section
      ref={sectionRef}
      style={{
        position: 'relative', height: '100vh', width: '100%',
        overflow: 'hidden', background: '#010c08',
      }}
    >
      {/* ── Eye-tracking canvas (full bleed) ── */}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

      {/* Minimal overlay — only thin edges, animation fully visible */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: [
          'linear-gradient(to right, rgba(1,10,6,0.65) 0%, rgba(1,10,6,0.22) 12%, transparent 24%)',
          'linear-gradient(180deg, rgba(1,10,6,0.55) 0%, transparent 10%, transparent 84%, rgba(1,10,6,0.75) 100%)',
        ].join(', '),
      }} />

      {/* ── NAV BAR ── */}
      <nav
        ref={navRef}
        style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'clamp(1.2rem, 2.5vh, 1.8rem) clamp(1.5rem, 4vw, 3rem)',
          zIndex: 10, opacity: 0,
        }}
      >
        {/* Logo */}
        <span style={{
          fontFamily: 'Georgia, serif', fontSize: '1.1rem',
          fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase',
          color: '#fff', textShadow: '0 0 20px rgba(0,229,200,0.6)',
        }}>
          AVATAR
        </span>

        {/* Nav links pill */}
        <div style={{
          display: 'flex', gap: '0.2rem',
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(14px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '40px', padding: '0.25rem 0.3rem',
        }}>
          {NAV.map((label, i) => (
            <button
              key={label}
              onClick={label === 'Chapters' ? scrollToChapters : label === 'Gallery' ? scrollToGallery : undefined}
              style={{
                fontFamily: 'monospace', fontSize: '0.65rem',
                letterSpacing: '0.14em', textTransform: 'uppercase',
                padding: '0.38rem 1rem', borderRadius: '30px',
                border: 'none', cursor: 'pointer',
                background: i === 0 ? 'rgba(255,255,255,0.88)' : 'transparent',
                color: i === 0 ? '#010c08' : 'rgba(255,255,255,0.55)',
                fontWeight: i === 0 ? 700 : 400,
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => { if (i !== 0) (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
              onMouseLeave={e => { if (i !== 0) (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.55)'; }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Menu button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button style={{
            fontFamily: 'monospace', fontSize: '0.65rem',
            letterSpacing: '0.18em', textTransform: 'uppercase',
            padding: '0.42rem 1.1rem', borderRadius: '30px',
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(2,20,12,0.5)', backdropFilter: 'blur(12px)',
            color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
          }}>
            Menu
          </button>
          <button style={{
            width: '36px', height: '36px', borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(2,20,12,0.5)', backdropFilter: 'blur(12px)',
            color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
            fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            ··
          </button>
        </div>
      </nav>

      {/* ── MAIN CONTENT — left side ── */}
      <div
        ref={contentRef}
        style={{
          position: 'absolute',
          top: '50%', transform: 'translateY(-52%)',
          left: 'clamp(2rem, 5vw, 4.5rem)',
          maxWidth: 'clamp(220px, 28vw, 360px)',
          zIndex: 5, opacity: 0,
        }}
      >
        {/* Eyebrow */}
        <p style={{
          fontFamily: "'Courier New', monospace",
          fontSize: 'clamp(0.5rem, 0.65vw, 0.62rem)',
          letterSpacing: '0.38em', textTransform: 'uppercase',
          color: 'rgba(0,229,180,0.85)',
          marginBottom: 'clamp(0.4rem, 0.8vh, 0.65rem)',
          textShadow: '0 0 14px rgba(0,229,180,0.5)',
          fontWeight: 400,
        }}>
          James Cameron&apos;s
        </p>

        {/* Title */}
        <h1 style={{
          fontFamily: 'Georgia, serif',
          fontSize: 'clamp(1.6rem, 3.4vw, 3.4rem)',
          fontWeight: 900,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#ffffff',
          lineHeight: 0.9,
          margin: '0 0 clamp(0.7rem, 1.4vh, 1.1rem)',
          textShadow: '0 2px 30px rgba(0,0,0,0.85)',
        }}>
          AVATAR
        </h1>

        {/* Description */}
        <p style={{
          fontFamily: 'Georgia, serif',
          fontSize: 'clamp(0.68rem, 0.88vw, 0.82rem)',
          fontWeight: 400,
          lineHeight: 1.72,
          color: 'rgba(255,255,255,0.72)',
          marginBottom: 'clamp(1rem, 2vh, 1.6rem)',
          maxWidth: '320px',
          letterSpacing: '0.01em',
        }}>
          Three films. One extraordinary universe. Follow Jake Sully and Neytiri
          as their bond forges the fate of Pandora — and all life within it.
        </p>

        {/* CTA buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', flexWrap: 'wrap' }}>
          <button
            onClick={scrollToChapters}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.45rem',
              fontFamily: "'Courier New', monospace",
              fontSize: '0.6rem',
              letterSpacing: '0.18em', textTransform: 'uppercase',
              padding: '0.58rem 1.25rem', borderRadius: '50px',
              border: 'none',
              background: 'linear-gradient(135deg, rgba(0,229,180,1) 0%, rgba(0,200,160,1) 100%)',
              color: '#010c08', fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 0 20px rgba(0,229,180,0.45), 0 4px 14px rgba(0,0,0,0.4)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 32px rgba(0,229,180,0.65), 0 6px 18px rgba(0,0,0,0.4)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 20px rgba(0,229,180,0.45), 0 4px 14px rgba(0,0,0,0.4)';
            }}
          >
            Explore Pandora <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>··</span>
          </button>

          <button
            style={{
              display: 'flex', alignItems: 'center', gap: '0.45rem',
              fontFamily: "'Courier New', monospace",
              fontSize: '0.6rem',
              letterSpacing: '0.18em', textTransform: 'uppercase',
              padding: '0.56rem 1.2rem', borderRadius: '50px',
              border: '1px solid rgba(255,255,255,0.28)',
              background: 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(12px)',
              color: 'rgba(255,255,255,0.82)', cursor: 'pointer',
              transition: 'border-color 0.25s, color 0.25s, transform 0.2s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.55)';
              (e.currentTarget as HTMLButtonElement).style.color = '#fff';
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.28)';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.82)';
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
            }}
          >
            <span style={{ fontSize: '0.58rem' }}>▶</span> Watch Trailer
          </button>
        </div>
      </div>

      {/* ── BOTTOM BAR ── */}
      <div
        ref={bottomRef}
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          display: 'flex', alignItems: 'center',
          height: 'clamp(54px, 8vh, 70px)',
          background: 'rgba(1,10,6,0.72)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          padding: '0 clamp(1.5rem, 4vw, 3rem)',
          gap: '0',
          zIndex: 6, opacity: 0,
        }}
      >
        {/* Play trailer */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          paddingRight: 'clamp(1.2rem, 3vw, 2.2rem)',
          borderRight: '1px solid rgba(255,255,255,0.1)',
          cursor: 'pointer', flexShrink: 0,
        }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '0.65rem',
          }}>▶</div>
          <span style={{
            fontFamily: 'monospace', fontSize: '0.52rem',
            letterSpacing: '0.35em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.7)',
          }}>
            Play Trailer
          </span>
        </div>

        {/* Movie title ticker */}
        <div style={{
          flex: 1, overflow: 'hidden', position: 'relative',
          maskImage: 'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)',
        }}>
          <style>{`
            @keyframes ticker {
              0%   { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .movie-ticker {
              display: flex;
              align-items: center;
              width: max-content;
              animation: ticker 18s linear infinite;
            }
            .movie-ticker:hover { animation-play-state: paused; }
          `}</style>
          <div className="movie-ticker">
            {/* duplicate for seamless loop */}
            {[...Array(2)].map((_, pass) => (
              <div key={pass} style={{ display: 'flex', alignItems: 'center' }}>
                {[
                  { n: '01', title: 'Avatar', year: '2009' },
                  { n: '02', title: 'The Way of Water', year: '2022' },
                  { n: '03', title: 'Fire and Ash', year: '2025' },
                ].map((film) => (
                  <div key={`${pass}-${film.n}`} style={{
                    display: 'flex', alignItems: 'center', gap: '0.7rem',
                    padding: '0 2.8rem', whiteSpace: 'nowrap',
                  }}>
                    <span style={{
                      fontFamily: 'monospace', fontSize: '0.6rem',
                      color: 'rgba(0,229,180,0.5)', fontWeight: 700, letterSpacing: '0.1em',
                    }}>
                      {film.n}
                    </span>
                    <span style={{
                      fontFamily: 'Georgia, serif', fontSize: '0.75rem',
                      color: 'rgba(255,255,255,0.75)', letterSpacing: '0.08em',
                      fontStyle: 'italic',
                    }}>
                      Avatar{film.n !== '01' ? `: ${film.title}` : ''}
                    </span>
                    <span style={{
                      fontFamily: 'monospace', fontSize: '0.55rem',
                      color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em',
                    }}>
                      {film.year}
                    </span>
                    <span style={{
                      color: 'rgba(0,229,180,0.25)', fontSize: '0.5rem',
                      margin: '0 0.4rem',
                    }}>◆</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Social / scroll */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.6rem',
          paddingLeft: 'clamp(1.2rem, 3vw, 2.2rem)',
          borderLeft: '1px solid rgba(255,255,255,0.1)',
          flexShrink: 0,
        }}>
          {['IG', 'TW', 'YT', 'FB'].map(s => (
            <button key={s} style={{
              width: '28px', height: '28px', borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'transparent', color: 'rgba(255,255,255,0.45)',
              fontFamily: 'monospace', fontSize: '0.4rem', letterSpacing: '0.05em',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'border-color 0.2s, color 0.2s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,229,180,0.6)';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(0,229,180,0.9)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.15)';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.45)';
            }}>
              {s}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
