// DiceResultReveal — shows the latest locally-rolled total with a brief
// digit-scramble before settling. Purely presentational: it does not know
// how to roll dice, only how to animate whatever DiceRoll it's handed.

import { useEffect, useRef, useState } from 'react';
import type { DiceRoll } from '../../types';

const SCRAMBLE_DURATION_MS = 400;
const SCRAMBLE_TICK_MS = 50;

interface DiceResultRevealProps {
  roll: DiceRoll | null;
}

function scrambledDigits(digitCount: number): string {
  let out = '';
  for (let i = 0; i < digitCount; i++) {
    out += Math.floor(Math.random() * 10);
  }
  return out;
}

function DiceResultReveal({ roll }: DiceResultRevealProps) {
  const [display, setDisplay] = useState<number | null>(roll?.total ?? null);
  const [settled, setSettled] = useState(true);
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!roll) {
      setDisplay(null);
      setSettled(true);
      return;
    }

    const reducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) {
      setDisplay(roll.total);
      setSettled(true);
      return;
    }

    setSettled(false);
    const isNegative = roll.total < 0;
    const digitCount = Math.max(1, String(Math.abs(roll.total)).length);

    intervalRef.current = window.setInterval(() => {
      const magnitude = Number(scrambledDigits(digitCount));
      setDisplay(isNegative ? -magnitude : magnitude);
    }, SCRAMBLE_TICK_MS);

    timeoutRef.current = window.setTimeout(() => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setDisplay(roll.total);
      setSettled(true);
    }, SCRAMBLE_DURATION_MS);

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [roll]);

  if (!roll || display === null) {
    return (
      <div className="dice-reveal dice-reveal-empty">
        <p className="empty-hint">Roll to see a result.</p>
      </div>
    );
  }

  return (
    <div className="dice-reveal">
      <div className={`dice-reveal-value${settled ? ' settled' : ''}`}>{display}</div>
      <div className="dice-reveal-notation">{roll.notation}</div>
    </div>
  );
}

export default DiceResultReveal;
