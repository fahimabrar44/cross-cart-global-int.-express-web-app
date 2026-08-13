import { toast as sonnerToast } from "sonner";

// Re-export Sonner toast functions for consistency
export const toast = {// eslint-disable-next-line @typescript-eslint/no-explicit-any
  success: (message: string, options?: any) => sonnerToast.success(message, options),// eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: (message: string, options?: any) => sonnerToast.error(message, options),// eslint-disable-next-line @typescript-eslint/no-explicit-any
  info: (message: string, options?: any) => sonnerToast.info(message, options),// eslint-disable-next-line @typescript-eslint/no-explicit-any
  warning: (message: string, options?: any) => sonnerToast.warning(message, options),
  promise: sonnerToast.promise,
  dismiss: sonnerToast.dismiss,// eslint-disable-next-line @typescript-eslint/no-explicit-any
  loading: (message: string, options?: any) => sonnerToast.loading(message, options),
};

// Hook for accessing toast context (if needed)
export { toast as useToast } from "sonner";