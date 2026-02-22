"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const WORDS = [
    "on",
    "working",
    "learning",
    "progressing",
    "executing",
    "secure"
];

export function AnimatedWord() {
    const [index, setIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setIsVisible(false); // Fade out

            setTimeout(() => {
                setIndex((current) => (current + 1) % WORDS.length);
                setIsVisible(true); // Fade back in
            }, 400); // Wait for the fade out to finish before changing the word

        }, 2200); // Total cycle time per word

        return () => clearInterval(interval);
    }, []);

    return (
        <span
            className={cn(
                "gold-text inline-block min-w-[100px] text-center transition-all duration-400 ease-in-out",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
            )}
        >
            {WORDS[index]}
        </span>
    );
}
