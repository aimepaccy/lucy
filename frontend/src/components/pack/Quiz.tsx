import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Check, RotateCcw, Trophy, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Source } from '@/components/pack/Source'
import { spring } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { Question } from '@/types'

const LETTERS = ['A', 'B', 'C', 'D', 'E'] as const
type Letter = (typeof LETTERS)[number]

export function Quiz({ questions }: { questions: Question[] }) {
  const [index, setIndex] = useState(0)
  // One entry per question: the letter chosen, or null while unanswered.
  const [chosen, setChosen] = useState<(Letter | null)[]>(() => questions.map(() => null))
  // Counted from the answers each time, never stored.
  const score = chosen.filter((letter, i) => letter === questions[i].answer).length

  function restart() {
    setChosen(questions.map(() => null))
    setIndex(0)
  }

  if (index === questions.length) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={spring}
        className="flex flex-col items-center gap-3 py-6 text-center"
      >
        <div className="grid size-12 place-items-center rounded-full bg-accent text-accent-foreground">
          <Trophy className="size-6" aria-hidden="true" />
        </div>
        <p className="text-lg font-semibold" role="status">
          You scored {score} out of {questions.length}.
        </p>
        <p className="max-w-md text-sm text-muted-foreground">
          {score === questions.length
            ? 'Every one right. Try the flashcards to keep it fresh.'
            : 'Go back over the explanations for the ones you missed, then try again.'}
        </p>
        <Button onClick={restart} autoFocus>
          <RotateCcw />
          Try again
        </Button>
      </motion.div>
    )
  }

  const question = questions[index]
  const answer = chosen[index]
  const answered = answer !== null

  function choose(letter: Letter) {
    if (answered) return
    setChosen((current) => current.map((value, i) => (i === index ? letter : value)))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="shrink-0">
          Question {index + 1} of {questions.length}
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${(index / questions.length) * 100}%` }}
            transition={spring}
          />
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={spring}
          className="flex flex-col gap-3"
        >
          <p id={`stem-${index}`} className="font-medium text-pretty">
            {question.stem}
          </p>

          <ul role="list" aria-labelledby={`stem-${index}`} className="flex flex-col gap-2">
            {question.options.map((option, i) => {
              const letter = LETTERS[i]
              const right = letter === question.answer
              const picked = letter === answer
              return (
                <li key={letter}>
                  <button
                    type="button"
                    onClick={() => choose(letter)}
                    aria-disabled={answered}
                    aria-pressed={picked}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-lg border bg-background/60 p-3 text-left text-sm transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                      !answered && 'cursor-pointer hover:border-primary/50 hover:bg-accent/50',
                      answered && right && 'border-primary bg-primary/10',
                      answered && picked && !right && 'border-destructive bg-destructive/10',
                      answered && !right && !picked && 'opacity-75',
                    )}
                  >
                    <span
                      className={cn(
                        'grid size-6 shrink-0 place-items-center rounded-full border text-xs font-semibold',
                        answered && right && 'border-primary bg-primary text-primary-foreground',
                        answered && picked && !right && 'border-destructive bg-destructive text-white',
                      )}
                      aria-hidden="true"
                    >
                      {answered && right ? <Check className="size-3.5" /> : answered && picked ? <X className="size-3.5" /> : letter}
                    </span>
                    <span className="flex flex-col gap-1">
                      <span className="font-medium">
                        <span className="sr-only">{letter}. </span>
                        {option.text}
                        {answered && right && <span className="sr-only"> (the best answer)</span>}
                        {answered && picked && !right && <span className="sr-only"> (your answer)</span>}
                      </span>
                      {answered && <span className="text-muted-foreground">{option.explanation}</span>}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>

          <p role="status" className="sr-only">
            {answered && (answer === question.answer ? 'Correct.' : `Not quite. The best answer is ${question.answer}.`)}
          </p>

          {answered && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={spring}
              className="flex flex-col gap-3"
            >
              <Source quote={question.quote} grounded={question.grounded} />
              <Button className="self-end" onClick={() => setIndex(index + 1)} autoFocus>
                {index + 1 === questions.length ? 'See your score' : 'Next question'}
                <ArrowRight />
              </Button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
