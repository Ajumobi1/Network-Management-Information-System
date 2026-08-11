export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: 'var(--color-primary)',
          navy: 'var(--color-navy)',
          teal: 'var(--color-teal)',
          emerald: 'var(--color-emerald)',
          slate: 'var(--color-slate)',
          surface: 'var(--color-surface)',
          background: 'var(--color-background)',
          foreground: 'var(--color-foreground)',
          muted: 'var(--color-muted)',
        },
      },
      boxShadow: {
        soft: '0 10px 30px rgba(15, 23, 42, 0.08)',
        elevated: '0 20px 45px rgba(15, 23, 42, 0.12)',
      },
      borderRadius: {
        xl: '1rem',
      },
    },
  },
  plugins: [],
};
