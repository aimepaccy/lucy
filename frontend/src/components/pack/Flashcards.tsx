import { useState, type KeyboardEvent, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { ChevronLeft, ChevronRight, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Source } from '@/components/pack/Source'
import { spring } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { Flashcard } from '@/types'

// Which card shows and whether it is flipped only matter here, so the state lives here, not in App.
export function Flashcards({ cards }: { cards: Flashcard[] }) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const card = cards[index]

  function go(step: number) {
    const next = index + step
    if (next < 0 || next >= cards.length) return
    setIndex(next)
    setFlipped(false)
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowRight') go(1)
    else if (event.key === 'ArrowLeft') go(-1)
    else return
    event.preventDefault()
  }

  return (
    <div className="flex flex-col gap-4" onKeyDown={onKeyDown}>
      <p className="text-center text-xs text-muted-foreground">
        <span aria-live="polite">
          Card {index + 1} of {cards.length}.
        </span>{' '}
        Click or press Space to turn it over; arrow keys move between cards.
      </p>

      {/* The card turns around its vertical axis; each face hides when it faces away. */}
      <div className="mx-auto w-full max-w-xl [perspective:1200px]">
        <motion.button
          key={index}
          type="button"
          onClick={() => setFlipped((side) => !side)}
          aria-label={
            flipped
              ? `Answer: ${card.back}.${card.grounded ? '' : ' Lucy could not find this in your material.'} Turn back to the question.`
              : `Question: ${card.front}. Turn over for the answer.`
          }
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0, rotateY: flipped ? 180 : 0 }}
          transition={spring}
          className="relative grid min-h-56 w-full cursor-pointer rounded-xl outline-none [transform-style:preserve-3d] focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <Face>
            <span className="text-xs font-medium tracking-wide text-primary uppercase">Question</span>
            <span className="block text-lg font-medium text-balance">{card.front}</span>
          </Face>
          <Face back>
            <span className="text-xs font-medium tracking-wide text-primary uppercase">Answer</span>
            <span className="block text-lg text-balance">{card.back}</span>
            <Source quote={card.quote} grounded={card.grounded} />
          </Face>
        </motion.button>
      </div>

      <div className="flex items-center justify-center gap-2">
        <Button variant="outline" size="icon" onClick={() => go(-1)} disabled={index === 0} aria-label="Previous card">
          <ChevronLeft />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setFlipped((side) => !side)}>
          <RotateCw />
          Turn over
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => go(1)}
          disabled={index === cards.length - 1}
          aria-label="Next card"
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  )
}

// Spans, not divs: a button may only contain inline elements.
function Face({ back = false, children }: { back?: boolean; children: ReactNode }) {
  return (
    <span
      className={cn(
        'col-start-1 row-start-1 flex flex-col items-center justify-center gap-3 rounded-xl border bg-background/70 p-6 text-center shadow-sm [backface-visibility:hidden]',
        back && '[transform:rotateY(180deg)]',
      )}
    >
      {children}
    </span>
  )
}
