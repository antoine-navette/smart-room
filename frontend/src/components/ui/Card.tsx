import * as React from "react"
import { cn } from "../../lib/utils"

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }>(
  ({ className, interactive, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(
        "bg-surface-container-lowest border-[3px] border-on-surface neo-shadow flex flex-col", 
        interactive && "group overflow-hidden hover:-translate-y-1 transition-transform cursor-pointer", 
        className
      )} 
      {...props} 
    />
  )
)
Card.displayName = "Card"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-4 md:p-gutter flex flex-col flex-grow", className)} {...props} />
  )
)
CardContent.displayName = "CardContent"

export { Card, CardContent }
