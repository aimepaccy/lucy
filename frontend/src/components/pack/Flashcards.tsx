import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { ChevronLeft, ChevronRight, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { KintsugiSeam } from '@/components/Kintsugi'
import { Source } from '@/components/pack/Source'
import { spring } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { Flashcard } from '@/types'

// Which card shows and whether it is flipped only matter here, so the state lives here, not in App.
export function Flashcards({ cards }: { cards: Flashcard[] }) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  // A new card is a new button (see its key), so focus has to be handed over to it.
  const focusNewCard = useRef(false)
  const card = cards[index]
  if (!card) return null

  function go(step: number) {
    const next = index + step
    if (next < 0 || next >= cards.length) return
    focusNewCard.current = document.activeElement?.hasAttribute('data-flashcard') ?? false
    setIndex(next)
    setFlipped(false)
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowRight') go(1)
    else if (event.key === 'ArrowLeft') go(-1)
    else return
    event.preventDefault()
  }

  const question = `Question: ${sentence(card.front)}`
  const answer = `Answer: ${sentence(card.back)} ${card.grounded ? `From your session: "${card.quote}"` : 'Lucy could not find this in your material.'}`

  return (
    <div className="flex flex-col gap-4" onKeyDown={onKeyDown}>
      <p className="text-center text-xs text-muted-foreground">
        Card {index + 1} of {cards.length}. Tap or press Space to turn it over; arrow keys move between cards.
      </p>
      {/* Read out when the card changes or turns over; a focused button's new label often is not. */}
      <p className="sr-only" aria-live="polite">
        Card {index + 1} of {cards.length}. {flipped ? answer : question}
      </p>

      {/* The card turns around its vertical axis; each face hides when it faces away.
          The key makes each card a new button, so the next card never shows its answer while turning back. */}
      <div className="relative mx-auto w-full max-w-xl [perspective:1200px]">
        {/* A second card peeking out behind, like a stack of index cards. */}
        <span aria-hidden="true" className="absolute inset-0 rotate-[1.6deg] rounded-md border bg-card/80 shadow-sm" />
        <motion.button
          key={index}
          ref={(node) => {
            if (node && focusNewCard.current) {
              node.focus()
              focusNewCard.current = false
            }
          }}
          data-flashcard=""
          type="button"
          onClick={() => setFlipped((side) => !side)}
          aria-label={flipped ? `${answer} Turn back to the question.` : `${question} Turn over for the answer.`}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0, rotateY: flipped ? 180 : 0 }}
          transition={spring}
          className="relative grid min-h-60 w-full cursor-pointer rounded-md outline-none [transform-style:preserve-3d] focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <Face>
            <Label>Question</Label>
            <span className="block font-ink text-xl font-medium text-balance">{card.front}</span>
          </Face>
          <Face back>
            <Label>Answer</Label>
            <span className="block text-lg text-balance">{card.back}</span>
            <Source quote={card.quote} grounded={card.grounded} />
          </Face>
        </motion.button>
      </div>

      {/* aria-disabled, not disabled: a disabled button drops keyboard focus on the first and last card. */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => go(-1)}
          aria-disabled={index === 0}
          aria-label="Previous card"
          className="aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
        >
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
          aria-disabled={index === cards.length - 1}
          aria-label="Next card"
          className="aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  )
}

// Ends a text with exactly one full stop, so labels never read "..".
function sentence(text: string) {
  return `${text.trim().replace(/[.\s]+$/, '')}.`
}

// Spans, not divs: a button may only contain inline elements.
function Face({ back = false, children }: { back?: boolean; children: ReactNode }) {
  return (
    <span
      className={cn(
        'index-card relative col-start-1 row-start-1 flex flex-col items-center justify-center gap-3 overflow-hidden rounded-md border bg-card px-6 pt-14 pb-8 text-center shadow-md backface-hidden',
        back && '[transform:rotateY(180deg)]',
      )}
    >
      {children}
      <KintsugiSeam variant="corner" className="absolute -right-px -bottom-px h-7 w-12 -scale-x-100 -scale-y-100" />
    </span>
  )
}

// Sits in the header band above the card's first rule.
function Label({ children }: { children: ReactNode }) {
  return (
    <span className="absolute top-3.5 left-5 text-xs font-medium tracking-wide text-primary uppercase">{children}</span>
  )
}
