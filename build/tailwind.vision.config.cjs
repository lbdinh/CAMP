const { colors } = require("./theme-tokens.cjs");

module.exports = {
  content: ["./vision-demo-sim/index.html"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      colors: {
        brand: {
          deep: colors.deep,
          navy: colors.navy,
          steel: colors.steel,
          blue: colors.blue,
          orange: colors.orange,
          fog: colors.fog,
          surface: colors.surface,
          success: colors.success,
          warning: colors.warning,
          danger: colors.danger,
          white: colors.white,
        },
      },
    },
  },
};
