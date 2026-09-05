'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  getIconToggleMotion,
  getSocialActionMotion,
  getSubmitMotion,
  getButtonMotionProps,
} from '@/lib/motion-presets';

const motionByKind = {
  default: () => getButtonMotionProps({ variant: 'default' }),
  outline: () => getButtonMotionProps({ variant: 'outline' }),
  ghost: () => getButtonMotionProps({ variant: 'ghost' }),
  social: getSocialActionMotion,
  submit: getSubmitMotion,
  icon: (active) => getIconToggleMotion(active),
};

/**
 * Drop-in animated replacement for plain <button> elements.
 * kind: default | outline | ghost | social | submit | icon
 */
export function InteractiveButton({
  className,
  kind = 'default',
  active = false,
  disabled,
  children,
  ...props
}) {
  const prefersReducedMotion = useReducedMotion();
  const getMotion = motionByKind[kind] || motionByKind.default;
  const motionProps =
    disabled || prefersReducedMotion ? {} : getMotion(active);

  return (
    <motion.button
      type="button"
      disabled={disabled}
      className={cn(className)}
      {...motionProps}
      {...props}
    >
      {children}
    </motion.button>
  );
}
