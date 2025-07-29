"use client";

import { useState } from "react";
import { PlaceholdersAndVanishInput } from "../../../components/ui/ace/placeholders-and-vanish-input";
import { useWaitlist } from "@/lib/hooks/business/useWaitlist";
import { motion, AnimatePresence } from "motion/react";

export function WaitlistInput() {
  const { setEmail, isLoading, error, success, submitEmail, reset } =
    useWaitlist();

  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await submitEmail();

    if (success) {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        reset();
      }, 3000);
    }
  };

  if (showSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-xl mx-auto text-center"
      >
        <div className="bg-green-500/10 border border-green-500/20 rounded-full p-4">
          <p className="text-green-400 font-medium">
            🎉 You&apos;re on the waitlist! We&apos;ll notify you when we
            launch.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      <PlaceholdersAndVanishInput
        placeholders={[
          "Enter your work email",
          "you@company.com",
          "Get notified on launch",
        ]}
        onChange={handleChange}
        onSubmit={handleSubmit}
      />

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-3 text-red-400 text-sm text-center"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 text-blue-400 text-sm text-center"
        >
          Joining waitlist...
        </motion.div>
      )}
    </div>
  );
}
