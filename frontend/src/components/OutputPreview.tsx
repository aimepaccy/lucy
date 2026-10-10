import { useEffect, useState, type ReactNode } from 'react'
import { motion, type Variants } from 'motion/react'
import { BookOpenCheck, Check, Layers, Library, ListChecks, MessagesSquare, RotateCw } from 'lucide-react'
import { SpotlightGlow, trackPointer } from '@/components/Spotlight'
import { rise, spring } from '@/lib/motion'
import { cn } from '@/lib/utils'

const inView = { initial: 'hidden', whileInView: 'show', viewport: { once: true, amount: 0.4 } } as const

const lineStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.18, delayChildren: 0.2 } },
}

type CardProps = {
  icon: typeof BookOpenCheck
  title: string
  description: string
  className?: string
  children: ReactNode
}

function BentoCard({ icon: Icon, title, description, className, children }: CardProps) {
  return (
    <motion.article
      variants={rise}
      onMouseMove={trackPointer}
      className={cn(
        'group/spot relative flex flex-col overflow-hidden rounded-xl border bg-card/75 p-5 shadow-sm backdrop-blur-md transition-shadow duration-300 hover:shadow-lg',
        className,
      )}
    >
      <SpotlightGlow size={360} />
      <div className="relative flex-1">{children}</div>
      <div className="relative mt-5 flex items-start gap-3">
        <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </motion.article>
  )
}

function SummaryDemo() {
  const lines = [
    <>Assess severity with <mark className="rounded bg-primary/15 px-1 text-foreground">CURB-65</mark> on admission.</>,
    <>Urea above 7 mmol/L scores one point.</>,
    <>A score of 3 or more means severe pneumonia.</>,
  ]
  return (
    <div className="rounded-lg border bg-background/70 p-4">
      <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Key points</p>
      <motion.ul variants={lineStagger} {...inView} className="space-y-2.5 text-sm">
        {lines.map((line, i) => (
          <motion.li key={i} variants={rise} className="flex gap-2.5">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
            <span>{line}</span>
          </motion.li>
        ))}
      </motion.ul>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {['From notes', 'From recording', 'From slides'].map((label) => (
          <span key={label} className="rounded-full bg-secondary px-2 py-0.5 text-[0.7rem] text-secondary-foreground">
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

function FlashcardDemo() {
  const [flipped, setFlipped] = useState(false)
  const [peek, setPeek] = useState(false)
  return (
    <button
      type="button"
      onClick={() => setFlipped((f) => !f)}
      onPointerEnter={(event) => event.pointerType === 'mouse' && setPeek(true)}
      onPointerLeave={() => setPeek(false)}
      aria-label={flipped ? 'Flashcard answer: urea above 7 mmol/L. Select to see the question.' : 'Flashcard question: in CURB-65, what does U stand for? Select to see the answer.'}
      className="block h-40 w-full outline-none [perspective:900px] focus-visible:ring-4 focus-visible:ring-ring/30"
    >
      <motion.div
        className="relative size-full [transform-style:preserve-3d]"
        animate={{ rotateY: (flipped ? 180 : 0) + (peek ? (flipped ? -10 : 10) : 0) }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-lg border bg-background/80 p-4 text-center [backface-visibility:hidden]">
          <p className="text-sm font-medium">In CURB-65, what does U stand for?</p>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <RotateCw className="size-3" aria-hidden="true" /> Click or tap to flip
          </span>
        </div>
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-linear-to-br from-primary to-accent-foreground p-4 text-center text-primary-foreground [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <p className="font-serif text-2xl italic">Urea above 7 mmol/L</p>
        </div>
      </motion.div>
    </button>
  )
}

function QuizDemo() {
  const options = ['Silent chest', 'Peak flow 60% of best', 'Respiratory rate 22/min', 'Speaks in full sentences']
  const [seen, setSeen] = useState(false)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    if (!seen) return
    const id = window.setTimeout(() => setRevealed(true), 1100)
    return () => window.clearTimeout(id)
  }, [seen])

  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.5 }}
      onViewportEnter={() => setSeen(true)}
      className="space-y-1.5"
    >
      <p className="mb-2 text-sm font-medium">Which finding suggests life-threatening asthma?</p>
      {options.map((option, i) => {
        const correct = i === 0
        return (
          <motion.div
            key={option}
            animate={revealed && !correct ? { opacity: 0.45 } : { opacity: 1 }}
            className={cn(
              'flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-colors duration-500',
              revealed && correct ? 'border-primary/50 bg-primary/10 font-medium' : 'bg-background/60',
            )}
          >
            <span className="grid size-4 shrink-0 place-items-center rounded-full border text-[0.6rem] text-muted-foreground">
              {revealed && correct ? (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={spring}>
                  <Check className="size-3 text-primary" />
                </motion.span>
              ) : (
                String.fromCharCode(65 + i)
              )}
            </span>
            {option}
          </motion.div>
        )
      })}
      <motion.p
        initial={false}
        animate={revealed ? { opacity: 1, height: 'auto' } : { opacity: 0, height: 0 }}
        className="overflow-hidden pt-1 text-xs text-muted-foreground"
      >
        A silent chest means very little air is moving.
      </motion.p>
    </motion.div>
  )
}

function ChatDemo() {
  const bubble: Variants = {
    hidden: { opacity: 0, y: 10, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: spring },
  }
  return (
    <motion.div variants={{ hidden: {}, show: { transition: { staggerChildren: 0.9, delayChildren: 0.3 } } }} {...inView} className="flex flex-col gap-2 text-xs">
      <motion.p variants={bubble} className="max-w-[85%] self-end rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-primary-foreground">
        Why did the registrar keep mentioning urea?
      </motion.p>
      <motion.div variants={bubble} className="flex gap-1 self-start rounded-2xl rounded-bl-sm bg-secondary px-3 py-2.5">
        {[0, 1, 2].map((dot) => (
          <motion.span
            key={dot}
            className="size-1.5 rounded-full bg-muted-foreground"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 0.8, repeat: 2, delay: dot * 0.15 }}
          />
        ))}
      </motion.div>
      <motion.p variants={bubble} className="max-w-[85%] self-start rounded-2xl rounded-bl-sm bg-secondary px-3 py-2 text-secondary-foreground">
        It is the U in CURB-65. Your notes link it to scoring pneumonia severity.
      </motion.p>
    </motion.div>
  )
}

function ReadingDemo() {
  const items = [
    { source: 'StatPearls', title: 'Community-acquired pneumonia' },
    { source: 'PubMed', title: 'Severity scores in pneumonia' },
    { source: 'Radiopaedia', title: 'Lobar pneumonia' },
  ]
  return (
    <motion.ul variants={lineStagger} {...inView} className="space-y-2">
      {items.map((item) => (
        <motion.li key={item.source} variants={rise} className="flex items-center gap-2.5 rounded-md border bg-background/60 px-2.5 py-2 text-xs">
          <span className="rounded bg-accent px-1.5 py-0.5 text-[0.65rem] font-semibold text-accent-foreground">{item.source}</span>
          <span className="truncate">{item.title}</span>
        </motion.li>
      ))}
    </motion.ul>
  )
}

export function OutputPreview() {
  return (
    <motion.section
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
      {...inView}
      viewport={{ once: true, amount: 0.15 }}
      className="pt-10"
      aria-labelledby="output-heading"
    >
      <motion.div variants={rise} className="mb-6 max-w-2xl">
        <p className="mb-2 text-xs font-semibold tracking-wider text-primary uppercase">What you get</p>
        <h2 id="output-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">
          One session in, a{' '}
          <span className="font-serif text-[1.15em] font-normal tracking-normal italic">full revision set</span> out.
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Built only from what you add, and labelled as AI-generated. The cards below show the format with an example
          on pneumonia and asthma.
        </p>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-6">
        <BentoCard icon={BookOpenCheck} title="Summary" description="The teaching points, not a transcript." className="md:col-span-4">
          <SummaryDemo />
        </BentoCard>
        <BentoCard icon={Layers} title="Flashcards" description="Quick recall, made from what was taught." className="md:col-span-2">
          <FlashcardDemo />
        </BentoCard>
        <BentoCard icon={ListChecks} title="Exam-style quiz" description="Single best answer, with every option explained." className="md:col-span-2">
          <QuizDemo />
        </BentoCard>
        <BentoCard icon={MessagesSquare} title="Ask about my session" description="Answers drawn from your own material." className="md:col-span-2">
          <ChatDemo />
        </BentoCard>
        <BentoCard icon={Library} title="Further reading" description="Links come from the sources themselves, never from the AI." className="md:col-span-2">
          <ReadingDemo />
        </BentoCard>
      </div>
    </motion.section>
  )
}
