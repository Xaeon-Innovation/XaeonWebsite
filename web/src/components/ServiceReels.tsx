import type { CSSProperties } from "react";
import styles from "./ServiceReels.module.css";

/**
 * Resting offsets (in cells) traced from the original "SERVICES" artwork, so the word settles
 * into the same staggered, mid-spin look. Positive = the letter sits lower in its window.
 */
const LETTERS: { char: string; rest: number }[] = [
  { char: "S", rest: 0.36 },
  { char: "E", rest: -0.04 },
  { char: "R", rest: 0.46 },
  { char: "V", rest: 0.27 },
  { char: "I", rest: 0.08 },
  { char: "C", rest: 0.36 },
  { char: "E", rest: -0.1 },
  { char: "S", rest: 0.39 },
];

const COPIES = 7;

/**
 * Decorative slot-machine lettering for the services page: each letter is a reel that spins
 * in on load and ticks now and then. Pure CSS (no JavaScript); static under reduced motion.
 */
export default function ServiceReels({ word = LETTERS }: { word?: typeof LETTERS }) {
  return (
    <div className={styles.reels} aria-hidden="true" dir="ltr">
      {word.map((letter, i) => {
        // Alternate directions so neighbouring reels move against each other.
        const dir = i % 2 === 0 ? 1 : -1;
        const vars = {
          "--rest": letter.rest,
          "--dir": dir,
          "--spins": 3,
          "--spin-delay": `${0.08 * i}s`,
          "--spin-duration": `${1.35 + 0.07 * i}s`,
          // Different periods and offsets keep the ticking irregular, never in unison.
          "--tick-period": `${7 + ((i * 3) % 5)}s`,
          "--tick-delay": `${2.2 + ((i * 7) % 8) * 0.55}s`,
        } as CSSProperties;
        return (
          <span key={`${letter.char}-${i}`} className={styles.reel} style={vars}>
            <span className={styles.spin} style={{ display: "block" }}>
              <span className={styles.tick} style={{ display: "block" }}>
                <span className={styles.strip}>
                  {Array.from({ length: COPIES }, (_, k) => (
                    <span key={k} className={styles.glyph}>
                      {letter.char}
                    </span>
                  ))}
                </span>
              </span>
            </span>
          </span>
        );
      })}
    </div>
  );
}
