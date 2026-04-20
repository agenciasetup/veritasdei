"use client"

import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react"
import { Label } from "./Label"

type BaseFieldProps = {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  success?: boolean
  required?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  /** Ocupa largura total do pai */
  fullWidth?: boolean
}

function fieldStyle(error?: boolean, success?: boolean, disabled?: boolean): React.CSSProperties {
  return {
    background: "var(--surface-inset)",
    border: `1px solid ${
      error ? "var(--danger)" : success ? "var(--success)" : "var(--border-1)"
    }`,
    color: "var(--text-1)",
    fontFamily: "var(--font-body)",
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? "not-allowed" : undefined,
  }
}

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size">,
    BaseFieldProps {}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    hint,
    error,
    success,
    required,
    leftIcon,
    rightIcon,
    fullWidth = true,
    className,
    id: idProp,
    disabled,
    style,
    ...rest
  },
  ref,
) {
  const autoId = useId()
  const id = idProp ?? autoId

  return (
    <div className={fullWidth ? "w-full" : undefined}>
      {label && (
        <Label htmlFor={id} required={required} hint={hint}>
          {label}
        </Label>
      )}
      <div className="relative">
        {leftIcon && (
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--text-3)" }}
            aria-hidden="true"
          >
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          disabled={disabled}
          aria-invalid={!!error || undefined}
          className={[
            "w-full h-11 rounded-xl text-sm outline-none transition-[border-color,box-shadow] duration-150",
            leftIcon ? "pl-10" : "pl-4",
            rightIcon ? "pr-10" : "pr-4",
            "focus:ring-0",
            className ?? "",
          ].join(" ")}
          style={{
            ...fieldStyle(!!error, success, disabled),
            ...style,
          }}
          {...rest}
        />
        {rightIcon && (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-3)" }}
            aria-hidden="true"
          >
            {rightIcon}
          </span>
        )}
      </div>
      {error && (
        <p
          className="mt-1.5 text-xs"
          style={{ color: "var(--danger)", fontFamily: "var(--font-body)" }}
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  )
})

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement>,
    BaseFieldProps {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    label,
    hint,
    error,
    success,
    required,
    fullWidth = true,
    className,
    id: idProp,
    disabled,
    rows = 4,
    style,
    leftIcon: _leftIcon,
    rightIcon: _rightIcon,
    ...rest
  },
  ref,
) {
  void _leftIcon
  void _rightIcon
  const autoId = useId()
  const id = idProp ?? autoId

  return (
    <div className={fullWidth ? "w-full" : undefined}>
      {label && (
        <Label htmlFor={id} required={required} hint={hint}>
          {label}
        </Label>
      )}
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        disabled={disabled}
        aria-invalid={!!error || undefined}
        className={[
          "w-full px-4 py-3 rounded-xl text-sm outline-none transition-[border-color,box-shadow] duration-150 resize-none",
          "focus:ring-0",
          className ?? "",
        ].join(" ")}
        style={{
          ...fieldStyle(!!error, success, disabled),
          ...style,
        }}
        {...rest}
      />
      {error && (
        <p
          className="mt-1.5 text-xs"
          style={{ color: "var(--danger)", fontFamily: "var(--font-body)" }}
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  )
})
