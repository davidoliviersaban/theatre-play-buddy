/**
 * Standardized icon size classes for consistent UI
 */
export const ICON_SIZES = {
    xs: 'h-3 w-3',      // Small badges, inline indicators
    sm: 'h-4 w-4',      // Buttons, most UI elements
    md: 'h-6 w-6',      // Navigation, headers
    lg: 'h-8 w-8',      // Feature highlights
    xl: 'h-12 w-12',    // Hero sections, success states
} as const;

/**
 * Get mastery color based on percentage
 */
export function getMasteryColor(percentage: number): string {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
}

/**
 * Get mastery text color based on percentage
 */
export function getMasteryTextColor(percentage: number): string {
    if (percentage >= 80) return 'text-green-500';
    if (percentage >= 40) return 'text-yellow-500';
    return 'text-red-500';
}

/**
 * Get mastery border color based on percentage
 */
export function getMasteryBorderColor(percentage: number): string {
    if (percentage >= 80) return 'border-green-500';
    if (percentage >= 40) return 'border-yellow-500';
    return 'border-red-500';
}

/**
 * Standardized opacity levels for consistency
 */
export const OPACITY_LEVELS = {
    subtle: '10',    // Very light tints
    light: '20',     // Light backgrounds
    medium: '50',    // Hover states
    strong: '80',    // Strong emphasis
} as const;

/**
 * Container max-width classes
 */
export const CONTAINER_SIZES = {
    sm: 'max-w-2xl',
    md: 'max-w-3xl',
    lg: 'max-w-7xl',
    reading: 'max-w-[70ch]',
} as const;

/**
 * Standardized transition classes
 */
export const TRANSITIONS = {
    fast: 'transition-all duration-150 ease-in-out',
    normal: 'transition-all duration-200 ease-in-out',
    slow: 'transition-all duration-300 ease-in-out',
    colors: 'transition-colors duration-150',
    shadow: 'transition-shadow duration-200',
} as const;
