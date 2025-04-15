// Copied from shadcn/ui (https://ui.shadcn.com/)
import { useToast as useToastPrimitive } from "@/components/ui/toast"

export { useToast }

type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

function useToast() {
  const { toast } = useToastPrimitive()
  
  return {
    toast: ({ title, description, variant = "default" }: ToastProps) => {
      toast({
        title,
        description,
        variant,
      })
    }
  }
} 