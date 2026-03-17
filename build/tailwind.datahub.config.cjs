const { colors } = require("./theme-tokens.cjs");

module.exports = {
  content: ["./datahub-simulator/index.html"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Roboto", "Arial", "Helvetica", "sans-serif"],
      },
      colors: {
        brand: {
          blue: colors.blue,
          orange: colors.orange,
          danger: colors.danger,
          success: colors.success,
          warning: colors.warning,
          navy: colors.navy,
          deep: colors.deep,
          steel: colors.steel,
          fog: colors.fog,
          surface: colors.surface,
          muted: colors.muted,
          white: colors.white,
        },
      },
    },
  },
};
