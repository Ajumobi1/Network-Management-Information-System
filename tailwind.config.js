export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          soft: 'var(--color-primary-soft)',
          navy: 'var(--color-navy)',
          teal: 'var(--color-teal)',
          tealSoft: 'var(--color-teal-soft)',
          emerald: 'var(--color-emerald)',
          slate: 'var(--color-slate)',
          background: 'var(--color-background)',
          surface: 'var(--color-surface)',
          card: 'var(--color-card)',
          elevated: 'var(--color-elevated)',
          foreground: 'var(--color-foreground)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-muted)',
          subtle: 'var(--color-subtle)',
          border: 'var(--color-border)',
          divider: 'var(--color-divider)',
        },
        status: {
          success: 'var(--color-success)',
          successSoft: 'var(--color-success-soft)',
          warning: 'var(--color-warning)',
          warningSoft: 'var(--color-warning-soft)',
          error: 'var(--color-error)',
          errorSoft: 'var(--color-error-soft)',
          info: 'var(--color-info)',
          infoSoft: 'var(--color-info-soft)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: 'var(--shadow-card)',
        elevated: 'var(--shadow-card-hover)',
        panel: 'var(--shadow-panel)',
      },
      borderRadius: {
        control: 'var(--radius-control)',
        card: 'var(--radius-card)',
        panel: 'var(--radius-panel)',
        pill: 'var(--radius-pill)',
      },
      spacing: {
        page: 'var(--space-page-x)',
        section: 'var(--space-section)',
        card: 'var(--space-card)',
      },
    },
  },
  plugins: [],
};
