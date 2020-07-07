module.exports = {
  purge: ["./src/**/*.js"],
  theme: {
    extend: {
      height: {},
    },
  },
  variants: {
    backgroundColor: ["responsive", "hover", "focus", "active"],
  },
  plugins: [],
};
