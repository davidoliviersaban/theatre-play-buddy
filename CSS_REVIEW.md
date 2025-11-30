# CSS/Tailwind Code Review

## ✅ Strengths

1. **Consistent Design System**

   - Using shadcn/ui components with proper theming
   - Good use of CSS variables for colors
   - Consistent spacing scale (gap-2, gap-3, gap-4, etc.)

2. **Responsive Design**

   - Proper breakpoint usage (sm:, lg:)
   - Mobile-first approach
   - Responsive grid layouts

3. **Accessibility**
   - Focus states with ring utilities
   - Proper semantic HTML structure
   - ARIA-friendly components

## ⚠️ Issues Found

### 1. **Duplicate React Import** (Critical)

**File:** `src/app/practice/[id]/summary/page.tsx`

```tsx
import { useSyncExternalStore } from "react";
// ... other imports
import { useSyncExternalStore } from "react"; // DUPLICATE!
```

**Impact:** Compilation error
**Fix:** Remove duplicate import

### 2. **Missing React Import** (Critical)

**File:** `src/app/practice/[id]/summary/page.tsx` (line 17)

```tsx
const resolvedParams = React.use(params); // React not imported!
```

**Fix:** Add `import * as React from "react";`

### 3. **Inconsistent Spacing Units**

**Issues:**

- Mix of arbitrary values and Tailwind classes
- `mt-6 sm:mt-8` vs `mt-8 sm:mt-12` (inconsistent scale)
- Magic numbers in arbitrary values: `max-w-[70ch]`

**Recommendation:**
Create custom spacing tokens in tailwind.config:

```js
extend: {
  maxWidth: {
    'reading': '70ch',
  },
  spacing: {
    '18': '4.5rem', // for consistent gaps
  }
}
```

### 4. **Color Opacity Inconsistencies**

**Examples:**

- `bg-secondary/10`
- `bg-secondary/20`
- `bg-green-500/10`
- `bg-yellow-500/10`
- `bg-primary/5`
- `bg-primary/10`

**Issue:** No clear pattern for opacity levels
**Recommendation:** Standardize to 10, 20, 50 for hover states

### 5. **Repeated Class Combinations**

**Pattern:** `inline-flex items-center gap-1`
**Occurrences:** 15+ times across components

**Fix:** Extract to component or utility class

```tsx
// Create a utility component
export const InlineStack = ({ gap = 1, children, className }) => (
  <span className={cn("inline-flex items-center", `gap-${gap}`, className)}>
    {children}
  </span>
);
```

### 6. **Icon Size Inconsistencies**

**Examples:**

- `h-3 w-3` (badge icons)
- `h-3.5 w-3.5` (completion icons)
- `h-4 w-4` (most icons)
- `h-6 w-6` (navigation buttons)
- `h-8 w-8` (upload icon)
- `h-12 w-12` (success icon)

**Recommendation:** Define semantic icon sizes:

```tsx
const ICON_SIZES = {
  xs: "h-3 w-3", // badges
  sm: "h-4 w-4", // buttons, inline
  md: "h-6 w-6", // headers
  lg: "h-8 w-8", // features
  xl: "h-12 w-12", // heroes
} as const;
```

### 7. **Text Size Naming Issues**

**Examples:**

- `text-[10px]` - arbitrary value
- `text-[11px]` - arbitrary value
- `text-xs` - utility class
- `text-sm` - utility class

**Issue:** Mixing arbitrary values with utilities
**Fix:** Extend Tailwind config:

```js
fontSize: {
  'xxs': '0.625rem',  // 10px
  'xxxs': '0.6875rem', // 11px
}
```

### 8. **Hardcoded Colors**

**Examples:**

- `bg-green-500` (should use semantic colors)
- `text-green-500`
- `text-yellow-500`
- `fill-yellow-500`

**Issue:** Not using design system tokens
**Recommendation:**

```css
:root {
  --success: hsl(142 76% 36%);
  --warning: hsl(48 96% 53%);
  --mastery-high: hsl(142 76% 36%);
  --mastery-medium: hsl(48 96% 53%);
  --mastery-low: hsl(0 84% 60%);
}
```

### 9. **Z-Index Management**

**Found values:**

- `z-10` (navigation buttons, trophy)
- `z-20` (practice header)
- `z-50` (overlays)

**Issue:** No clear z-index scale
**Recommendation:**

```js
zIndex: {
  'base': '0',
  'dropdown': '1000',
  'sticky': '1100',
  'fixed': '1200',
  'modal-backdrop': '1300',
  'modal': '1400',
  'popover': '1500',
  'tooltip': '1600',
}
```

### 10. **Transition Inconsistencies**

**Examples:**

- `transition-all duration-300`
- `transition-colors`
- `transition-shadow`

**Issue:** Some transitions specify duration, others don't
**Recommendation:** Always specify duration:

```tsx
transition-all duration-200 ease-in-out
transition-colors duration-150
```

## 🔧 Recommended Refactors

### 1. Extract Repeated Button Patterns

```tsx
// src/components/ui/icon-button.tsx
export const IconButton = ({ icon: Icon, children, ...props }) => (
  <Button {...props}>
    <Icon className="mr-2 h-4 w-4" />
    {children}
  </Button>
);
```

### 2. Create Card Stat Component

```tsx
// src/components/ui/stat-card.tsx
export const StatCard = ({ title, value, subtitle }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </CardContent>
  </Card>
);
```

### 3. Standardize Container Widths

```tsx
// Create layout components
const Container = ({ size = "md", children }) => (
  <div
    className={cn(
      "mx-auto px-4 sm:px-6 lg:px-8",
      size === "sm" && "max-w-2xl",
      size === "md" && "max-w-3xl",
      size === "lg" && "max-w-7xl",
      size === "reading" && "max-w-[70ch]"
    )}
  >
    {children}
  </div>
);
```

### 4. Fix Typography Scale

Current issues with `text-[10px]` and `text-[11px]`

**Add to tailwind.config.ts:**

```ts
fontSize: {
  'xxs': ['0.625rem', { lineHeight: '0.875rem' }],
  'xxxs': ['0.6875rem', { lineHeight: '1rem' }],
}
```

### 5. Create Mastery Color Utility

```tsx
// src/lib/mastery-utils.ts
export function getMasteryColor(percentage: number): string {
  if (percentage >= 80) return "bg-green-500";
  if (percentage >= 40) return "bg-yellow-500";
  return "bg-red-500";
}

export function getMasteryTextColor(percentage: number): string {
  if (percentage >= 80) return "text-green-500";
  if (percentage >= 40) return "text-yellow-500";
  return "text-red-500";
}
```

## 📋 Action Items

### High Priority (Breaks functionality)

1. ✅ Fix duplicate `useSyncExternalStore` import
2. ✅ Add missing `React` import for `React.use()`

### Medium Priority (Code quality)

3. Extract repeated class patterns to components
4. Standardize opacity levels (10, 20, 50)
5. Create icon size constants
6. Add semantic color tokens for success/warning/mastery

### Low Priority (Nice to have)

7. Extend Tailwind config for custom font sizes
8. Create z-index scale
9. Standardize transition durations
10. Extract container components

## 🎨 Tailwind Config Improvements

```typescript
// tailwind.config.ts additions
export default {
  theme: {
    extend: {
      fontSize: {
        xxs: ["0.625rem", { lineHeight: "0.875rem" }],
        xxxs: ["0.6875rem", { lineHeight: "1rem" }],
      },
      colors: {
        mastery: {
          high: "hsl(142 76% 36%)",
          medium: "hsl(48 96% 53%)",
          low: "hsl(0 84% 60%)",
        },
      },
      zIndex: {
        dropdown: "1000",
        sticky: "1100",
        fixed: "1200",
        overlay: "1300",
        modal: "1400",
        popover: "1500",
        tooltip: "1600",
      },
      maxWidth: {
        reading: "70ch",
      },
    },
  },
};
```

## 📊 CSS Statistics

- **Total className occurrences:** 200+
- **Repeated patterns:** 15+ instances of `inline-flex items-center gap-X`
- **Arbitrary values:** 10+ instances (mostly font sizes and max-widths)
- **Hardcoded colors:** 8+ instances (green-500, yellow-500, red-500)
- **Inconsistent spacing:** Multiple patterns for similar layouts

## ✨ Benefits of Refactoring

1. **Reduced bundle size** - Fewer duplicate classes
2. **Easier theming** - Semantic color tokens
3. **Better maintainability** - Extracted components
4. **Consistent UX** - Standardized spacing/colors
5. **Improved type safety** - TypeScript for utility functions
