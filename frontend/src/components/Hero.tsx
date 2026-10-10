import { Fragment } from 'react'
import { motion, type Variants } from 'motion/react'
import { BookOpenCheck, Layers, ListChecks, MessagesSquare, Sparkles } from 'lucide-react'
import { rise } from '@/lib/motion'

const words = ['Turn', 'a', 'teaching', 'round', 'into', 'a']

const outputs = [
  { icon: BookOpenCheck, label: 'Summary' },
  { icon: Layers, label: 'Flashcards' },
  { icon: ListChecks, label: 'Exam-style quiz' },
  { icon: MessagesSquare, label: 'Ask your session' },
]

const wordStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

export function Hero() {
  return (
    <motion.section variants={wordStagger} className="max-w-3xl pt-6 sm:pt-12">
      <motion.p
        variants={rise}
        className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/70 px-3 py-1 text-xs font-medium text-accent-foreground shadow-sm backdrop-blur"
      >
        <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
        For role-played rounds and bedside teaching
      </motion.p>

      <h1 className="text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl">
        {words.map((word, i) => (
          <Fragment key={i}>
            <motion.span variants={rise} className="inline-block">
              {word}
            </motion.span>{' '}
          </Fragment>
        ))}
        <motion.span variants={rise} className="text-shimmer inline-block pr-1 font-serif font-normal tracking-normal italic">
          study pack.
        </motion.span>
      </h1>

      <motion.p variants={rise} className="mt-5 max-w-2xl text-base text-pretty text-muted-foreground sm:text-lg">
        Record a role-played round, add your notes and slides, and Lucy builds a summary, flashcards,
        an exam-style quiz and further reading from credible sources.
      </motion.p>

      <motion.ul variants={wordStagger} className="mt-6 flex flex-wrap gap-2" aria-label="What a study pack contains">
        {outputs.map(({ icon: Icon, label }) => (
          <motion.li
            key={label}
            variants={rise}
            className="inline-flex items-center gap-1.5 rounded-lg border bg-card/60 px-2.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur"
          >
            <Icon className="size-3.5 text-primary" aria-hidden="true" />
            {label}
          </motion.li>
        ))}
      </motion.ul>
    </motion.section>
  )
}
