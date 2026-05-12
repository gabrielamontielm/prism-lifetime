import * as React from "react"
import { cn } from "../../lib/utils"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'flat' | 'glass' | 'elevated'
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "flat", ...props }, ref) => {
    const variants = {
      flat: 'bg-white border border-prism-100', glass: 'glass', elevated: 'bg-white shadow-xl'
    };
    return <div ref={ref} className={cn('rounded-3xl overflow-hidden', variants[variant], className)} {...props} />
  }
)
Card.displayName = "Card"
export { Card }
