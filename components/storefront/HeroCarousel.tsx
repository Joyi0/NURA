"use client";

import { CSSProperties, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { assetUrl } from "@/lib/shared/catalog";

type Banner = {
  image: string;
  title: string;
  text: string;
  cta: string;
};

export function HeroCarousel({ banners, productsHref }: { banners: Banner[]; productsHref: string }) {
  const [active, setActive] = useState(0);
  const [isInteractive, setIsInteractive] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setIsInteractive(true);
    startTimer();
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [banners.length]);

  function startTimer() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setActive((current) => (current + 1) % banners.length);
    }, 5200);
  }

  function select(index: number) {
    setActive(index);
    startTimer();
  }

  function go(delta: number) {
    setActive((current) => (current + delta + banners.length) % banners.length);
    startTimer();
  }

  return (
    <section
      className={`hero-carousel ${isInteractive ? "is-interactive" : ""}`}
      aria-label="NURA brand banners"
      style={{ "--slide-count": banners.length } as CSSProperties}
    >
      {banners.map((banner, index) => (
        <article
          id={`nura-banner-${index + 1}`}
          className={`hero-slide ${index === active ? "active" : ""}`}
          key={banner.image}
          style={{ "--slide-index": index } as CSSProperties}
        >
          <img src={assetUrl(banner.image)} alt="" />
          <div className="hero-overlay">
            <span>NURA</span>
            <h1>{banner.title}</h1>
            <p>{banner.text}</p>
            <Link className="btn gold" href={productsHref}>
              {banner.cta}
            </Link>
          </div>
          <a
            className="carousel-arrow prev"
            href={`#nura-banner-${((index - 1 + banners.length) % banners.length) + 1}`}
            onClick={() => go(-1)}
            aria-label="Previous banner"
          >
            ‹
          </a>
          <a
            className="carousel-arrow next"
            href={`#nura-banner-${((index + 1) % banners.length) + 1}`}
            onClick={() => go(1)}
            aria-label="Next banner"
          >
            ›
          </a>
          <div className="carousel-dots">
            {banners.map((item, dotIndex) => (
              <a
                aria-label={`Show banner ${dotIndex + 1}`}
                className={dotIndex === index ? "active" : ""}
                href={`#nura-banner-${dotIndex + 1}`}
                key={item.image}
                onClick={() => select(dotIndex)}
              />
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}
