const themeDir = __dirname + "/../../";

module.exports = {
  plugins: [
    require("@tailwindcss/postcss-plugin")({
		config: themeDir + "assets/css/tailwind.config.js"
		}),
    require("autoprefixer")({
      path: [themeDir],
    }),
    require("cssnano")({
      preset: "default",
    }),
  ],
};
