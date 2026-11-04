"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import HeroArt from "./HeroArt";
import NetworkBg from "./NetworkBg";
import TypedLine from "./TypedLine";

const HAIRCUT_VIDEOS = [
  "VxaKCB8AusQ",
  "TrkM_yQAA9Y",
  "DuZ7qLqIGp8",
  "9AJSFvogW4Q",
  "ZblD89wNBlw",
  "yjoLiDAg-24",
  "xpQYh5jxT5c",
  "nS09LW-dMEw",
];

const STORAGE_KEY = "craft-hero-video";

function pickVideo() {
  let last = "";
  try {
    last = sessionStorage.getItem(STORAGE_KEY) || "";
  } catch (_) {
    /* ignore */
  }
  const pool = HAIRCUT_VIDEOS.filter((id) => id !== last);
  const list = pool.length ? pool : HAIRCUT_VIDEOS;
  const id = list[Math.floor(Math.random() * list.length)];
  try {
    sessionStorage.setItem(STORAGE_KEY, id);
  } catch (_) {
    /* ignore */
  }
  return id;
}

function loadYoutubeApi() {
  if (window.YT?.Player) return Promise.resolve();
  if (window.__craftYtReady) return window.__craftYtReady;
  window.__craftYtReady = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
  });
  return window.__craftYtReady;
}

export default function HomeHero({ street, phone }) {
  const mountRef = useRef(null);
  const playerRef = useRef(null);
  const [videoId, setVideoId] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setVideoId(pickVideo());
  }, []);

  useEffect(() => {
    if (!videoId || !mountRef.current) return;
    let cancelled = false;
    const start = 8 + Math.floor(Math.random() * 20);

    loadYoutubeApi().then(() => {
      if (cancelled || !mountRef.current) return;
      playerRef.current = new window.YT.Player(mountRef.current, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          loop: 1,
          playlist: videoId,
          start,
          iv_load_policy: 3,
          disablekb: 1,
          fs: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            event.target.mute();
            event.target.playVideo();
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setReady(true);
            }
            if (event.data === window.YT.PlayerState.ENDED) {
              event.target.playVideo();
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      try {
        playerRef.current?.destroy?.();
      } catch (_) {
        /* ignore */
      }
    };
  }, [videoId]);

  return (
    <section className="relative min-h-[72vh] overflow-hidden bg-[var(--hero)] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className={`absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2 ${
            ready ? "opacity-100" : "opacity-0"
          }`}
        >
          <div ref={mountRef} className="h-full w-full" />
        </div>
        {ready ? <div className="absolute inset-0 bg-[#041226]/70" /> : null}
      </div>

      <div
        className={`absolute inset-0 transition-opacity duration-700 ${
          ready ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
        aria-hidden={ready}
      >
        <NetworkBg />
      </div>

      <div className="relative z-10 mx-auto grid min-h-[72vh] max-w-6xl items-center gap-10 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-2 lg:pb-24 lg:pt-6">
        <div
          className={`order-2 justify-center transition-opacity duration-700 lg:order-1 ${
            ready ? "hidden opacity-0 lg:flex" : "flex opacity-100"
          }`}
        >
          <HeroArt />
        </div>
        <div className="order-1 drop-shadow-[0_8px_24px_rgba(0,0,0,0.55)] lg:order-2">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-sky-200">
            {street}
          </p>
          <h1 className="mt-4 font-display text-4xl leading-tight sm:text-5xl lg:text-6xl">
            Точность линии.
            <br />
            Мастерство в <TypedLine />
          </h1>
          <p className="mt-5 max-w-lg text-lg text-white/80">
            Craft Barbershop помогает вырасти вашему стилю: стратегия стрижки,
            чистая техника и запись без звонка администратору.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/book" className="btn btn-primary">
              Записаться
            </Link>
            <a href="#services" className="btn btn-ghost">
              Смотреть услуги
            </a>
          </div>
          <p className="mt-6 text-sm text-sky-100">{phone}</p>
        </div>
      </div>
    </section>
  );
}
