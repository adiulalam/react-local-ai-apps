import * as React from "react"
import { cn } from "@/lib/utils"

const FileUploadRoot = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col items-center gap-4 rounded-xl border border-dashed p-8", className)}
    {...props}
  />
))
FileUploadRoot.displayName = "FileUploadRoot"

const FileUploadIcon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("bg-primary/10 rounded-full p-4", className)}
    {...props}
  />
))
FileUploadIcon.displayName = "FileUploadIcon"

const FileUploadText = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-center", className)}
    {...props}
  />
))
FileUploadText.displayName = "FileUploadText"

export interface FileUploadInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onFileSelect?: (file: File) => void;
}

const FileUploadInput = React.forwardRef<HTMLInputElement, FileUploadInputProps>(
  ({ className, onFileSelect, onChange, type = "file", ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file && onFileSelect) {
        onFileSelect(file)
      }
      if (onChange) {
        onChange(e)
      }
    }

    return (
      <input
        type={type}
        className={cn("hidden", className)}
        ref={ref}
        onChange={handleChange}
        {...props}
      />
    )
  }
)
FileUploadInput.displayName = "FileUploadInput"

export { FileUploadRoot, FileUploadIcon, FileUploadText, FileUploadInput }
