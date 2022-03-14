module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("./css/");
    eleventyConfig.addWatchTarget("./css/");
    return {
        dir: {
            output: "docs"
        }
    }
};
