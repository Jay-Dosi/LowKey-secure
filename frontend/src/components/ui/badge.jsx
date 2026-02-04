import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
    {
        variants: {
            variant: {
                default: "border-slate-700 bg-slate-800 text-slate-300",
                success: "border-green-800 bg-green-900/50 text-green-400",
                warning: "border-yellow-800 bg-yellow-900/50 text-yellow-400",
                danger: "border-red-800 bg-red-900/50 text-red-400",
                info: "border-blue-800 bg-blue-900/50 text-blue-400",
                purple: "border-purple-800 bg-purple-900/50 text-purple-400",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

function Badge({ className, variant, ...props }) {
    return (
        <span className={cn(badgeVariants({ variant }), className)} {...props} />
    )
}

export { Badge, badgeVariants }
