import { motion, type Variants } from 'motion/react'
import { rise } from '@/lib/motion'

const words = ['Turn', 'a', 'teaching', 'round', 'into', 'a']

const wordStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

export function Hero() {
  return (
    <motion.section variants={wordStagger} className="max-w-3xl pt-4 sm:pt-8">
      <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        {words.map((word, i) => (
          <motion.span key={i} variants={rise} className="mr-[0.25em] inline-block">
            {word}
          </motion.span>
        ))}
        <motion.span
          variants={rise}
          className="inline-block bg-linear-to-r from-primary to-accent-foreground bg-clip-text text-transparent"
        >
          study pack.
        </motion.span>
      </h1>
      <motion.p variants={rise} className="mt-4 max-w-2xl text-base text-pretty text-muted-foreground sm:text-lg">
        Record a role-played round, add your notes and slides, and Lucy builds a summary, flashcards,
        an exam-style quiz and further reading from trusted sources.
      </motion.p>
    </motion.section>
  )
}
