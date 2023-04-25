const core = require("@actions/core");

const { getBaseLcovFile } = require("../input");
const { parseLcovFile } = require("./parselocv");

// eslint-disable-next-line max-statements
const getBasecoverageDiff = async (coverage) => {
  const baseFile = getBaseLcovFile();

  const baseMetrics = false;

  let baseCoveragePercentage = baseMetrics || 0;

  if (!baseCoveragePercentage && baseFile) {
    core.info(`base-lcov-file: ${baseFile}`);
    const baseCoverage = await parseLcovFile(baseFile);
    baseCoveragePercentage = baseCoverage.percentage;
  }

  const diff = (coverage.percentage - baseCoveragePercentage).toFixed(2);

  core.info(`Base branch code coverage: ${baseCoveragePercentage}%`);
  core.info(`Code coverage diff: ${diff}%`);

  return diff;
};

module.exports = getBasecoverageDiff;
