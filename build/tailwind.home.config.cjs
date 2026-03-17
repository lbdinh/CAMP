const { colors } = require("./theme-tokens.cjs");

module.exports = {
  content: ["./index.html"],
  theme: {
    fontFamily: {
      sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
    },
    extend: {
      colors: {
        brand: {
          deep: colors.deep,
          navy: colors.navy,
          steel: colors.steel,
          blue: colors.blue,
          orange: colors.orange,
          fog: colors.fog,
          surface: colors.surface,
          white: colors.white,
        },
      },
      animation: {
        "fade-up-1": "fadeUp 0.6s ease both 0.1s",
        "fade-up-2": "fadeUp 0.6s ease both 0.2s",
        "fade-up-3": "fadeUp 0.6s ease both 0.3s",
        "fade-up-4": "fadeUp 0.6s ease both 0.4s",
        "fade-up-5": "fadeUp 0.6s ease both 0.5s",
        "fade-up-6": "fadeUp 0.6s ease both 0.6s",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
};
