"use client";

import * as React from "react";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { format, isValid, parse } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/neo/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  clearable?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date...",
  className,
  disabled = false,
  clearable = true,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [isTyping, setIsTyping] = React.useState(false);

  // Update input value when value prop changes
  React.useEffect(() => {
    if (value && isValid(value)) {
      setInputValue(format(value, "MMM dd, yyyy"));
      setIsTyping(false);
    } else {
      setInputValue("");
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsTyping(true);

    // Try to parse the input as a date
    if (newValue.trim()) {
      // Try different date formats
      const formats = [
        "MMM dd, yyyy",
        "MM/dd/yyyy",
        "MM-dd-yyyy",
        "yyyy-MM-dd",
        "MM/dd/yy",
        "MM-dd-yy",
        "yyyy/MM/dd",
      ];

      for (const formatStr of formats) {
        const parsed = parse(newValue, formatStr, new Date());
        if (isValid(parsed)) {
          onChange?.(parsed);
          setIsTyping(false);
          return;
        }
      }

      // If no valid date found, clear the value
      onChange?.(undefined);
    } else {
      onChange?.(undefined);
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    onChange?.(date);
    setOpen(false);
    setIsTyping(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInputValue("");
    onChange?.(undefined);
    setIsTyping(false);
  };

  const handleInputFocus = () => {
    setIsTyping(true);
  };

  const handleInputBlur = () => {
    // Keep typing state true if there's input but no valid date
    if (!inputValue.trim() || !value) {
      setIsTyping(false);
    }
  };

  const displayValue = isTyping
    ? inputValue
    : value && isValid(value)
      ? format(value, "MMM dd, yyyy")
      : "";

  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center">
        <input
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 px-3 py-2 bg-[#2d313a] border border-[#353a45] rounded-l-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              disabled={disabled}
              className="rounded-l-none border-l-0 bg-[#2d313a] border-[#353a45] text-white hover:bg-[#353a45] focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="p-0 bg-[#181A20] border border-blue-400/20 rounded-lg shadow-lg"
          >
            <Calendar
              mode="single"
              selected={value}
              onSelect={handleCalendarSelect}
              initialFocus
              className="rounded bg-[#181A20] text-white"
            />
          </DropdownMenuContent>
        </DropdownMenu>
        {clearable && (value || inputValue) && (
          <Button
            variant="outline"
            size="icon"
            onClick={handleClear}
            disabled={disabled}
            className="ml-1 rounded bg-[#2d313a] border-[#353a45] text-white hover:bg-[#353a45] focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
