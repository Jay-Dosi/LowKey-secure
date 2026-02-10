import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "bg-green-500 text-slate-950 hover:bg-green-400 focus-visible:ring-green-500",
                destructive: "bg-red-500 text-white hover:bg-red-400 focus-visible:ring-red-500",
                outline: "border border-slate-700 bg-transparent hover:bg-slate-800 hover:text-white focus-visible:ring-slate-500",
                secondary: "bg-slate-800 text-white hover:bg-slate-700 focus-visible:ring-slate-500",
                ghost: "hover:bg-slate-800 hover:text-white focus-visible:ring-slate-500",
                link: "text-green-400 underline-offset-4 hover:underline",
                blue: "bg-blue-600 text-white hover:bg-blue-500 focus-visible:ring-blue-500",
                purple: "bg-purple-600 text-white hover:bg-purple-500 focus-visible:ring-purple-500",
                green: "bg-green-600 text-white hover:bg-green-500 focus-visible:ring-green-500"
            },
            size: {
                default: "h-11 px-5 py-2",
                sm: "h-9 px-3",
                lg: "h-12 px-8 text-base",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

const Button = React.forwardRef(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
