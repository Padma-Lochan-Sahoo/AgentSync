import { Button } from "@/components/ui/button"
import { Loader } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingButtonProps extends React.ComponentProps<typeof Button> {
  isLoading?: boolean
  loadingText?: string
}

export function LoadingButton({
  isLoading,
  loadingText,
  children,
  className,
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      disabled={isLoading || disabled}
      className={cn("flex items-center gap-2", className)}
      {...props}
    >
      {isLoading ? loadingText ?? children : children}
      {isLoading && <Loader className="h-4 w-4 animate-spin" />}
    </Button>
  )
}
