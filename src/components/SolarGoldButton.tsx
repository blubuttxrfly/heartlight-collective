import { useRef, type MouseEvent, type ReactNode, type ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

// lightweight className joiner (project does not include clsx/tailwind-merge)
function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

type BaseProps = {
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  iconPosition?: 'before' | 'after';
};

type ButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement>;
type AnchorProps = BaseProps & Omit<LinkProps, 'to'> & { to: string };

function SolarGoldInner({
  children,
  className,
  icon,
  iconPosition = 'after',
}: {
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  iconPosition?: 'before' | 'after';
}) {
  return (
    <span
      className={cn(
        'relative z-10 inline-flex items-center justify-center gap-2 transition-colors duration-300',
        className
      )}
    >
      {iconPosition === 'before' && icon}
      {children}
      {iconPosition === 'after' && icon}
    </span>
  );
}

function useRippleOrigin() {
  const ref = useRef<HTMLElement>(null);
  const setOrigin = (e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--sg-x', `${e.clientX - rect.left}px`);
    el.style.setProperty('--sg-y', `${e.clientY - rect.top}px`);
  };
  return { ref, setOrigin };
}

const sharedClasses = cn(
  'group relative overflow-hidden isolate rounded-xl border border-gold-400/30',
  'bg-transparent px-6 py-3 font-medium',
  'text-gold-300 transition-colors duration-300',
  'hover:border-gold-400 hover:text-void-900',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/50',
  'disabled:opacity-50 disabled:cursor-not-allowed',
  'before:pointer-events-none before:absolute before:left-[var(--sg-x,50%)] before:top-[var(--sg-y,50%)]',
  'before:z-0 before:h-[300%] before:w-[300%] before:-translate-x-1/2 before:-translate-y-1/2',
  'before:rounded-full before:bg-gold-400',
  'before:opacity-0 before:transition-all before:duration-500 before:ease-out',
  'before:scale-0 hover:before:scale-100 hover:before:opacity-100'
);

export function SolarGoldButton({
  children,
  className,
  icon,
  iconPosition,
  ...rest
}: ButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const setOrigin = (e: MouseEvent<HTMLButtonElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--sg-x', `${e.clientX - rect.left}px`);
    el.style.setProperty('--sg-y', `${e.clientY - rect.top}px`);
  };

  return (
    <button
      ref={ref}
      type="button"
      className={cn(sharedClasses, className)}
      onMouseMove={setOrigin}
      {...rest}
    >
      <SolarGoldInner icon={icon} iconPosition={iconPosition}>
        {children}
      </SolarGoldInner>
    </button>
  );
}

export function SolarGoldLink({
  to,
  children,
  className,
  icon,
  iconPosition,
  ...rest
}: AnchorProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const setOrigin = (e: MouseEvent<HTMLAnchorElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--sg-x', `${e.clientX - rect.left}px`);
    el.style.setProperty('--sg-y', `${e.clientY - rect.top}px`);
  };

  return (
    <Link
      ref={ref}
      to={to}
      className={cn(sharedClasses, className)}
      onMouseMove={setOrigin}
      {...rest}
    >
      <SolarGoldInner icon={icon} iconPosition={iconPosition}>
        {children}
      </SolarGoldInner>
    </Link>
  );
}

export default SolarGoldButton;
