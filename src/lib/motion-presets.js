/** Shared spring physics — matches feed comment / emoji interactions */
export const springSnappy = {
  type: 'spring',
  stiffness: 400,
  damping: 25,
};

export const springBouncy = {
  type: 'spring',
  stiffness: 500,
  damping: 18,
};

/**
 * Motion props for shadcn Button variants
 */
export function getButtonMotionProps({ variant = 'default', size = 'default' } = {}) {
  if (size === 'icon') {
    return {
      whileHover: { scale: 1.1, y: -2, rotate: -3 },
      whileTap: { scale: 0.9 },
      transition: springSnappy,
    };
  }

  switch (variant) {
    case 'ghost':
      return {
        whileHover: { scale: 1.06, y: -1 },
        whileTap: { scale: 0.93 },
        transition: springSnappy,
      };
    case 'link':
      return {
        whileHover: { x: 4 },
        whileTap: { scale: 0.98, x: 0 },
        transition: springSnappy,
      };
    case 'destructive':
      return {
        whileHover: { scale: 1.03, y: -2 },
        whileTap: { scale: 0.92 },
        transition: springBouncy,
      };
    case 'outline':
    case 'secondary':
      return {
        whileHover: { scale: 1.02, y: -2 },
        whileTap: { scale: 0.95 },
        transition: springSnappy,
      };
    default:
      return {
        whileHover: { scale: 1.03, y: -2 },
        whileTap: { scale: 0.94 },
        transition: springSnappy,
      };
  }
}

/** Social / feed action chips (like, comment, share) */
export function getSocialActionMotion() {
  return {
    whileHover: { scale: 1.04, y: -2 },
    whileTap: { scale: 0.92 },
    transition: springSnappy,
  };
}

/** Primary submit / CTA (post comment, send, save) */
export function getSubmitMotion() {
  return {
    whileHover: { scale: 1.03, x: 4 },
    whileTap: { scale: 0.96, x: 0 },
    transition: springSnappy,
  };
}

/** Icon-only toggle (emoji, menu) */
export function getIconToggleMotion(isActive = false) {
  return {
    whileHover: { y: -4, scale: 1.05 },
    whileTap: { scale: isActive ? 0.95 : 1.02 },
    transition: springSnappy,
  };
}
