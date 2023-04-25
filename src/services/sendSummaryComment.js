const core = require("@actions/core");

const { getPullRequestContext, getOctokit } = require("../lib/github");
const { getSendSummaryComment, getAppName } = require("../input");

const findComment = async (
  octokit,
  { repo, owner, issueNumber, searchBody }
) => {
  const { data } = await octokit.request(
    "GET /repos/{owner}/{repo}/issues/{issue_number}/comments",
    {
      repo,
      owner,
      issue_number: issueNumber,
      per_page: 100
    }
  );

  return data.find((comment) => comment.body.includes(searchBody));
};

const updateComment = async (
  octokit,
  { repo, owner, commentId, body }
) => {
  const { data } = await octokit.request(
    "PATCH /repos/{owner}/{repo}/issues/comments/{comment_id}",
    {
      repo,
      owner,
      body,
      comment_id: commentId
    }
  );

  return data;
};

const createComment = async (
  octokit,
  { repo, owner, issueNumber, body }
) => {
  const { data } = await octokit.request(
    "POST /repos/{owner}/{repo}/issues/{issue_number}/comments",
    {
      repo,
      owner,
      issue_number: issueNumber,
      body
    }
  );

  return data;
};

const createOrUpdateComment = async (
  octokit,
  { owner, repo, issueNumber, searchBody, body }
) => {
  const comment = await findComment(octokit, {
    owner,
    repo,
    issueNumber,
    searchBody
  });

  return comment
    ? updateComment(octokit, { owner, repo, commentId: comment.id, body })
    : createComment(octokit, { owner, repo, issueNumber, body });
};

const buildTableRow = ({ file, lines, url }) => {
  const getChangesLink = (lineLines) => `${url}${lineLines}`;
  // TODO: find a way to get diff patch
  // `https://github.com/${owner}/${repo}/pull/${pullRequestNumber}/files#diff-${sha}${lines}`;

  const buildArrayLink = (lineLines) => {
    const href = getChangesLink(`#L${lineLines[0]}-L${lineLines[1]}`);
    const text = lineLines.join("-");
    return `<a href="${href}">${text}</a>`;
  };
  const buildLink = (line) =>
    `<a href="${getChangesLink(`#L${line}`)}">${line}</a>`;

  const buildUncoveredLines = (line) =>
    Array.isArray(line) ? buildArrayLink(line) : buildLink(line);

  const formattedlines = lines.map(buildUncoveredLines).join(", ");
  const formattedFile = `<a href="${getChangesLink("")}">${file}</a>`;

  return `<tr><td>${formattedFile}</td><td>${formattedlines}</td></tr>`;
};

const buildDetailsBlock = (changedFiles) => {
  if (changedFiles.length === 0) return "✅ All code changes are covered";

  const summary = "<summary>Uncovered files and lines</summary>";

  const tableHeader = "<tr><th>File</th><th>Lines</th></tr>";
  const tableBody = changedFiles.map(buildTableRow).join("");
  const table = `<table><tbody>${tableHeader}${tableBody}</tbody></table>`;

  return `<details>${summary}${table}</details>`;
};

const getCoverageReportBody = ({
  changedFiles,
  title,
  coverageDiff,
  totalCoverage
}) => {
  const coverageDiffOutput = coverageDiff < 0 ? "▾" : "▴";
  const trendArrow = coverageDiff === 0 ? "" : coverageDiffOutput;
  const header = `${title}`;
  const detailsWithChangedFiles = buildDetailsBlock(changedFiles);
  const descTotal = `Total: <b>${totalCoverage}%</b>`;
  const descCoverageDiff = `Your code coverage diff: <b>${coverageDiff}% ${trendArrow}</b>`;
  const description = `${descTotal}\n\n${descCoverageDiff}`;

  return `<h3>${header}</h3>${description}\n\n${detailsWithChangedFiles}`;
};

const sendSummaryComment = async (
  changedFiles,
  coverageDiff,
  totalCoverage
) => {
  const isSendSummaryComment = getSendSummaryComment();
  const pullRequestContext = getPullRequestContext();

  if (isSendSummaryComment && pullRequestContext) {
    core.info(`send-summary-comment is enabled for this workflow`);

    const appName = getAppName() ? getAppName() : "Hits Coverage";

    const title = `${appName} - Code coverage report`;

    const body = getCoverageReportBody({
      changedFiles,
      title,
      coverageDiff,
      totalCoverage
    });

    const octokit = await getOctokit();
    const { repo, owner, pullNumber } = pullRequestContext;
    await createOrUpdateComment(octokit, {
      owner,
      repo,
      issueNumber: pullNumber,
      searchBody: title,
      body
    });
  }
};

module.exports = sendSummaryComment;
