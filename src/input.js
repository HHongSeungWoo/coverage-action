const core = require("@actions/core");

const valueOrFalse = (value) =>
  value === "" || value.toLowerCase() === "false" ? false : value;

const getShowAnnotations = () => {
  const availableAnnotations = ["warning", "error"];

  const showAnnotations = core.getInput("show-annotations");

  if (showAnnotations === "") return false;

  if (!availableAnnotations.includes(showAnnotations)) {
    throw new Error(
      `'show-annotations' param should be empty or one of the following options ${availableAnnotations.join(
        ","
      )}`
    );
  }

  return showAnnotations;
};

const getGithubToken = () => valueOrFalse(core.getInput("github-token"));

const getAppName = () => valueOrFalse(core.getInput("app-name"));

const getLcovFile = () => core.getInput("lcov-file");

const getBaseLcovFile = () => valueOrFalse(core.getInput("base-lcov-file"));

const getSendSummaryComment = () =>
  valueOrFalse(core.getInput("send-summary-comment"));

module.exports = {
  getShowAnnotations,
  getGithubToken,
  getAppName,
  getLcovFile,
  getBaseLcovFile,
  getSendSummaryComment
};
