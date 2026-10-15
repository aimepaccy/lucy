import { Fragment } from 'react'
import { motion, useReducedMotion, type Variants } from 'motion/react'
import { PixelText } from '@/components/PixelWordmark'
import { rise } from '@/lib/motion'

const words = ['Turn', 'a', 'teaching', 'round', 'into', 'a']

const wordStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

export function Hero() {
  const still = useReducedMotion()

  return (
    <motion.section variants={wordStagger} className="max-w-3xl pt-4 sm:pt-8">
      <h1 className="font-ink text-4xl font-medium text-balance sm:text-6xl">
        {words.map((word, i) => (
          <Fragment key={i}>
            <motion.span variants={rise} className="inline-block">
              {word}
            </motion.span>{' '}
          </Fragment>
        ))}
        <motion.span variants={rise} className="relative inline-block text-primary">
          {/* Heights in multiples of 7px, so every pixel is the same size. */}
          <PixelText text="study pack." cursor className="h-7 sm:h-[2.625rem]" />
          <BrushStroke still={still ?? false} />
        </motion.span>
      </h1>
      <motion.p variants={rise} className="mt-5 max-w-2xl text-base text-pretty text-muted-foreground sm:text-lg">
        Record a role-played round, add your notes and slides, and Lucy builds a summary, flashcards,
        an exam-style quiz and further reading from credible sources.
      </motion.p>
    </motion.section>
  )
}

// A single dry-brush stroke in kintsugi gold, painted from left to right.
function BrushStroke({ still }: { still: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 300 24"
      preserveAspectRatio="none"
      className="absolute -bottom-2 left-0 h-3 w-[96%] overflow-visible text-gold sm:-bottom-3 sm:h-4"
    >
      <motion.path
        d="M4 15 C 60 9, 120 7, 180 10 S 270 14, 296 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
        initial={{ pathLength: still ? 1 : 0, opacity: still ? 0.85 : 0 }}
        animate={{ pathLength: 1, opacity: 0.85 }}
        transition={{ duration: 0.9, delay: 0.75, ease: [0.65, 0, 0.35, 1] }}
      />
    </svg>
  )
}
