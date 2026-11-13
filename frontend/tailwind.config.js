export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        kjou: {
          red: "rgb(var(--kjou-red) / <alpha-value>)",
          "red-hover": "rgb(var(--kjou-red-hover) / <alpha-value>)",
          carbon: "rgb(var(--kjou-carbon) / <alpha-value>)",
          white: "rgb(var(--kjou-white) / <alpha-value>)",
          mist: "rgb(var(--kjou-mist) / <alpha-value>)",
          border: "rgb(var(--kjou-border) / <alpha-value>)",
          text: "rgb(var(--kjou-text) / <alpha-value>)",
          muted: "rgb(var(--kjou-muted) / <alpha-value>)",
          surface: {
            DEFAULT: "rgb(var(--kjou-surface) / <alpha-value>)",
            muted: "rgb(var(--kjou-surface-muted) / <alpha-value>)",
            inverse: "rgb(var(--kjou-surface-inverse) / <alpha-value>)",
          },
        },
        status: {
          success: "rgb(var(--kjou-success) / <alpha-value>)",
          warning: "rgb(var(--kjou-warning) / <alpha-value>)",
          danger: "rgb(var(--kjou-danger) / <alpha-value>)",
        },
      },
      fontFamily: {
        "kjou-display": ["var(--kjou-font-display)"],
        "kjou-body": ["var(--kjou-font-body)"],
      },
      fontSize: {
        "kjou-page": [
          "var(--kjou-type-page)",
          { lineHeight: "var(--kjou-line-page)" },
        ],
        "kjou-page-compact": [
          "var(--kjou-type-page-compact)",
          { lineHeight: "var(--kjou-line-page-compact)" },
        ],
        "kjou-section": [
          "var(--kjou-type-section)",
          { lineHeight: "var(--kjou-line-section)" },
        ],
        "kjou-body": [
          "var(--kjou-type-body)",
          { lineHeight: "var(--kjou-line-body)" },
        ],
        "kjou-meta": [
          "var(--kjou-type-meta)",
          { lineHeight: "var(--kjou-line-meta)" },
        ],
      },
      spacing: {
        "kjou-page-sm": "var(--kjou-space-page-sm)",
        "kjou-page": "var(--kjou-space-page)",
        "kjou-section": "var(--kjou-space-section)",
      },
      borderRadius: {
        "kjou-card": "var(--kjou-radius-card)",
        "kjou-control": "var(--kjou-radius-control)",
      },
      borderWidth: {
        kjou: "var(--kjou-border-width)",
      },
      ringWidth: {
        kjou: "var(--kjou-focus-ring-width)",
      },
      ringOffsetWidth: {
        kjou: "var(--kjou-focus-ring-offset)",
      },
    },
  },
  plugins: [],
};