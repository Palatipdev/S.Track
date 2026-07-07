import { useState } from "react";

export function useSubmitGuard() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function guard(fn: () => Promise<void>) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await fn();
    } finally {
      setIsSubmitting(false);
    }
  }

  return { isSubmitting, guard };
}
