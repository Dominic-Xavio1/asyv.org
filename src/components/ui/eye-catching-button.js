// components/ui/eye-catching-button.jsx
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export const EyeCatchingButton_v2 = ({ className, ...props }) => {
  return (
    <Button
      {...props}
      className={cn(
        'animate-bg-shine border-[1px] rounded-lg shadow bg-[length:200%_100%] tracking-wide duration-[2200ms]',
        'bg-[linear-gradient(110deg,#FFF,45%,#E4E4E7,55%,#FFF)] text-zinc-800 border-zinc-300',
        className,
      )}
    />
  );
};