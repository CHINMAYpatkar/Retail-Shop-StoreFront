import type { Config } from 'tailwindcss';
// An ESM import, not `require`. This file is ESM - it has a top-level `import`
// and `export default` - so Node loads it through the ESM path, where `require`
// is not defined. Mixing the two crashed the dev server on first compile.
import animate from 'tailwindcss-animate';

/**
 * Warm and artisanal — see ADR 0014.
 *
 * The `ink` / `paper` / `gold` scales are shared with the admin app on purpose.
 * Two surfaces of one business should not look like two businesses, and reusing
 * a proven scale means these values are already known to work together.
 *
 * `turmeric` and `chilli` are storefront-only: warmth and heat belong on the
 * customer side, not on a back-office table of vendor payments.
 */
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          50: '#FFFDFA',
          100: '#FDF8F0',
          200: '#F7EEE0',
          300: '#EFE1CC',
          400: '#E3CFB2',
        },
        ink: {
          50: '#F6F4F2',
          100: '#E8E4E0',
          200: '#CFC7C0',
          300: '#A99E95',
          400: '#7D7168',
          500: '#5C524A',
          600: '#443C36',
          700: '#332D28',
          800: '#2A2320',
          900: '#1A1614',
        },
        gold: {
          50: '#FDF6E7',
          100: '#F9E8C2',
          200: '#F2D390',
          300: '#E5B85A',
          400: '#D6A331',
          500: '#C8901E',
          600: '#A87517',
          700: '#835A14',
          800: '#5E4110',
          900: '#3D2A0A',
        },
        turmeric: {
          50: '#FEF7E6',
          100: '#FCE9BC',
          200: '#F7D07A',
          300: '#EDB53C',
          400: '#D99A0B',
          500: '#B98108',
          600: '#946606',
        },
        chilli: {
          50: '#FBEDEB',
          100: '#F5D2CD',
          200: '#E5A69C',
          300: '#CF6B5C',
          400: '#A8342A',
          500: '#8C2620',
          600: '#6B1B17',
        },
      },
      fontFamily: {
        // Editorial serif for display, clean sans for body. Loaded via
        // next/font in the root layout, which supplies these CSS variables.
        display: ['var(--font-display)', 'Georgia', 'Cambria', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'sans-serif'],
        // Tabular figures for prices and quantities, so columns of numbers
        // line up and a changing price does not shift the layout.
        data: ['var(--font-data)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        // A display scale distinct from the body scale, so headings can be
        // genuinely large without dragging body copy along with them.
        'display-sm': ['2rem', { lineHeight: '1.15', letterSpacing: '-0.01em' }],
        'display-md': ['2.75rem', { lineHeight: '1.1', letterSpacing: '-0.015em' }],
        'display-lg': ['3.75rem', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'display-xl': ['5rem', { lineHeight: '1', letterSpacing: '-0.025em' }],
      },
      maxWidth: {
        // Roughly 68 characters at the body size - the readable measure for
        // long-form CMS content.
        prose: '38rem',
        shell: '80rem',
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
      },
      boxShadow: {
        // Warm-tinted rather than neutral grey: a grey shadow on warm paper
        // reads as dirty.
        soft: '0 1px 2px rgba(42, 35, 32, 0.04), 0 2px 8px rgba(42, 35, 32, 0.04)',
        lift: '0 4px 12px rgba(42, 35, 32, 0.08), 0 12px 32px rgba(42, 35, 32, 0.06)',
      },
      keyframes: {
        // Radix reports the measured content height as
        // --radix-accordion-content-height, which is the only way to animate
        // to an unknown height without JavaScript measuring it.
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 280ms cubic-bezier(0.22, 1, 0.36, 1)',
        'accordion-up': 'accordion-up 220ms cubic-bezier(0.22, 1, 0.36, 1)',
      },
      transitionTimingFunction: {
        // One easing curve for the whole site. Motion that shares a curve reads
        // as one system; mixed curves read as several.
        spice: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [animate],
};

export default config;
