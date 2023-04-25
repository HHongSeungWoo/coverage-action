const { getPullRequestContext, getOctokit } = require("../lib/github");

const getChangedFiles = async (octokit, { repo, owner, pullNumber }) => {
  const changedFiles = await octokit.request(
    "GET /repos/{owner}/{repo}/pulls/{pull_number}/files",
    {
      repo,
      owner,
      pull_number: pullNumber,
      per_page: 100
    }
  );

  return changedFiles.data;
};

const getChangedFilesCoverage = async (coverage) => {
  const pullRequestContext = getPullRequestContext();

  if (!pullRequestContext) return coverage.data;

  const octokit = await getOctokit();

  const { repo, owner, pullNumber } = pullRequestContext;
  const changedFiles = await getChangedFiles(octokit, {
    repo,
    owner,
    pullNumber
  });

  return coverage.data.reduce((allFiles, { file, lines }) => {
    const changedFile = changedFiles.find(({ filename }) => filename === file);

    if (changedFile) {
      return [
        ...allFiles,
        {
          file,
          url: changedFile.blob_url,
          lines
        }
      ];
    }
    return allFiles;
  }, []);
};

module.exports = getChangedFilesCoverage;
