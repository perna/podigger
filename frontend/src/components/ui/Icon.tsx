import { cn } from '@/lib/utils';

interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
    name: string;
    fill?: boolean;
    weight?: number;
    grade?: number;
    opticalSize?: number;
}

/**
 * Icon component that renders a Material Symbol Rounded.
 * Requires the Material Symbols Rounded font to be loaded in the layout.
 */
export function Icon({
    name,
    fill = false,
    weight = 400,
    grade = 0,
    opticalSize = 24,
    className,
    ...props
}: IconProps) {
    return (
        <span
            className={cn('material-symbols-rounded select-none', className)}
            style={{
                fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' ${weight}, 'GRAD' ${grade}, 'opsz' ${opticalSize}`,
            }}
            aria-hidden="true"
            {...props}
        >
            {name}
        </span>
    );
}
