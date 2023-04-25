import * as fs from "fs";
import lcov from "lcov-parse";

const groupByFile = (lcovData) => {
  const response = [];

  lcovData.forEach((fileData) => {
    const lines = fileData.lines.details
      .filter(({ hit }) => hit === 0)
      .map(({ line }) => line);

    if (lines.length > 0) {
      response.push({
        file: fileData.file,
        lines
      });
    }
  });

  return response;
};

// TODO: this function is interapted by empty lines
// Need to find a way how we can avoid this in order to keep the whole interval
const groupByFileLines = (filesLines) =>
  // eslint-disable-next-line max-statements
  filesLines.map(({ file, lines }) => {
    const groupedLines = [];
    let previousLine = null;
    let startLine = null;

    const pushCurrentStateToArray = () =>
      groupedLines.push(
        startLine !== previousLine ? [startLine, previousLine] : previousLine
      );

    // eslint-disable-next-line no-restricted-syntax
    for (const line of lines) {
      // initialize first element
      if (startLine === null) {
        startLine = line;
        previousLine = line;
        // eslint-disable-next-line no-continue
        continue;
      }

      /// group elements to range
      if (previousLine !== line - 1) {
        pushCurrentStateToArray();
        startLine = line;
      }

      previousLine = line;
    }

    // Push last element
    pushCurrentStateToArray();

    return { file, lines: groupedLines };
  });

export const groupLcovData = (lcovData) => {
  const groupedFiles = groupByFile(lcovData);

  return groupByFileLines(groupedFiles);
};

// TODO: add types for data and lcovData
export const parseLcovFileData = (data) =>
  new Promise((resolve, reject) =>
    lcov(data, (err, res) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(res);
    })
  );

export const calculatePercentage = (lcovData) => {
  let hit = 0;
  let found = 0;

  lcovData.forEach((entry) => {
    hit += entry.lines.hit;
    found += entry.lines.found;
  });

  return parseFloat(((hit / found) * 100).toFixed(2));
};

export const parseLcovFile = async (coverageFilePath) => {
  const fileRaw = fs.readFileSync(coverageFilePath, "utf8");

  if (!fileRaw) {
    throw new Error(
      `No coverage report found at '${coverageFilePath}', exiting...`
    );
  }
  const lcovData = await parseLcovFileData(fileRaw);

  const data = groupLcovData(lcovData);

  const percentage = calculatePercentage(lcovData);

  return { lcovData, data, percentage };
};
