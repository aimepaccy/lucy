import { motion } from 'motion/react'
import { ShieldCheck } from 'lucide-react'
import { rise } from '@/lib/motion'

export function PrivacyNotice() {
  return (
    <motion.aside
      variants={rise}
      className="flex items-start gap-3 rounded-lg border border-primary/25 bg-accent/60 px-4 py-3 text-sm text-accent-foreground"
    >
      <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p>
        <span className="font-semibold">Role-play and teaching only.</span> Never record real patients or add
        anything that could identify one. Uploaded files are deleted once they have been processed.
      </p>
    </motion.aside>
  )
}
