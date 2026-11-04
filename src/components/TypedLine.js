"use client";

import { useEffect, useState } from "react";

const WORDS = ["стрижке", "бритье", "бороде", "укладке"];

export default function TypedLine() {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = WORDS[index];
    const wait = deleting ? 45 : 90;
    const timer = setTimeout(() => {
      if (!deleting) {
        const next = word.slice(0, text.length + 1);
        setText(next);
        if (next === word) setTimeout(() => setDeleting(true), 1100);
      } else {
        const next = word.slice(0, text.length - 1);
        setText(next);
        if (!next) {
          setDeleting(false);
          setIndex((i) => (i + 1) % WORDS.length);
        }
      }
    }, wait);
    return () => clearTimeout(timer);
  }, [text, deleting, index]);

  return (
    <span className="text-[var(--accent)]">
      {text}
      <span className="ml-0.5 inline-block w-[2px] animate-pulse bg-[var(--accent)] align-[-2px]">
        &nbsp;
      </span>
    </span>
  );
}
