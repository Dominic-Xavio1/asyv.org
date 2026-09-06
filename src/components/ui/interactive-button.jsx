'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import {
  getIconToggleMotion,
  getSocialActionMotion,
  getSubmitMotion,
  getButtonMotionProps,
} from '@/lib/motion-presets';

const motionByKind = {
  default: (_active, variant, size) => getButtonMotionProps({ variant, size }),
  outline: () => getButtonMotionProps({ variant: 'outline' }),
  ghost: () => getButtonMotionProps({ variant: 'ghost' }),
  destructive: () => getButtonMotionProps({ variant: 'destructive' }),
  social: getSocialActionMotion,
  submit: getSubmitMotion,
  icon: (active) => getIconToggleMotion(active),
};

/**
 * Drop-in interactive animated button component.
 * Features auto-resolved button chrome, micro-animations, loading state,
 * and dark mode contrast & focus styling.
 *
 * @param {string} [kind='default'] - default | outline | ghost | destructive | social | submit | icon
 * @param {string} [variant] - Overrides chrome variant (default | destructive | outline | secondary | ghost | link)
 * @param {string} [size] - Overrides button size (default | xs | sm | lg | icon)
 * @param {boolean} [unstyled=false] - If true, disables default button chrome
 * @param {boolean} [loading=false] - Shows spinner and disables button
 * @param {boolean} [isLoading=false] - Alias for loading
 * @param {boolean} [active=false] - Active state for toggle icons
 */
export function InteractiveButton({
  className,
  kind = 'default',
  variant,
  size,
  active = false,
  disabled = false,
  loading = false,
  isLoading = false,
  unstyled = false,
  children,
  ...props
}) {
  const prefersReducedMotion = useReducedMotion();
  const isBusy = Boolean(loading || isLoading);
  const isDisabled = Boolean(disabled || isBusy);

  // Auto-resolve variant and size from kind if omitted
  const resolvedVariant =
    variant != null
      ? variant
      : ['destructive', 'outline', 'ghost', 'secondary', 'link'].includes(kind)
      ? kind
      : 'default';

  const resolvedSize =
    size != null
      ? size
      : kind === 'icon'
      ? 'icon'
      : 'default';

  const getMotion = motionByKind[kind] || ((act, v, s) => getButtonMotionProps({ variant: v, size: s }));
  const motionProps =
    isDisabled || prefersReducedMotion
      ? {}
      : typeof getMotion === 'function'
      ? getMotion(active, resolvedVariant, resolvedSize)
      : {};

  return (
    <motion.button
      type="button"
      disabled={isDisabled}
      data-slot="button"
      data-kind={kind}
      data-variant={resolvedVariant}
      data-size={resolvedSize}
      data-loading={isBusy ? 'true' : undefined}
      className={cn(
        !unstyled && buttonVariants({ variant: resolvedVariant, size: resolvedSize }),
        'relative inline-flex items-center justify-center gap-2 select-none font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isBusy && 'cursor-wait opacity-80',
        className
      )}
      {...motionProps}
      {...props}
    >
      {isBusy && (
        <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" aria-hidden="true" />
      )}
      {children}
    </motion.button>
  );
}
