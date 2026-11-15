import type { ComponentProps } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../utils/cn'
import { controlClass } from './controlStyles'

export interface SelectOption<TValue extends string> {
  value: TValue
  label: string
}

export interface SelectProps<TValue extends string> extends Omit<ComponentProps<'select'>, 'children'> {
  options: ReadonlyArray<SelectOption<TValue>>
  invalid?: boolean
}

export function Select<TValue extends string>({ options, invalid, className, ...props }: SelectProps<TValue>) {
  const isListBox = props.multiple || (props.size ?? 0) > 1
  return (
    <span className="relative block w-full min-w-0">
      <select
        aria-invalid={invalid || undefined}
        className={controlClass(invalid, cn(
          'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted',
          !isListBox && 'appearance-none pr-10 forced-colors:appearance-auto',
          className,
        ))}
        {...props}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      {!isListBox && (
        <ChevronDown
          aria-hidden
          className={cn('pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted forced-colors:hidden', props.disabled && 'opacity-50')}
        />
      )}
    </span>
  )
}
