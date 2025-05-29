import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";
import scrollama from "https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm";
async function loadData() {
  const data = await d3.csv("loc.csv", (row) => ({
    ...row,
    line: Number(row.line), // or just +row.line
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + "T00:00" + row.timezone),
    datetime: new Date(row.datetime),
  }));

  return data;
}

function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;
      let ret = {
        id: commit,
        url: "https://github.com/vis-society/lab-7/commit/" + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      Object.defineProperty(ret, "lines", {
        value: lines,
        // What other options do we need to set?
        // Hint: look up configurable, writable, and enumerable
      });

      return ret;
    });
}

let data = await loadData();
let commits = processCommits(data);

function renderCommitInfo(data, commits) {
  const dl = d3.select("#stats").append("dl").attr("class", "stats");

  // Total LOC
  dl.append("dt").html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append("dd").text(data.length);

  // Total commits
  dl.append("dt").text("Total commits");
  dl.append("dd").text(commits.length);

  // Number of files
  const numFiles = d3.groups(data, (d) => d.file).length;
  dl.append("dt").text("Number of files");
  dl.append("dd").text(numFiles);

  const fileLengths = d3.rollups(
    data,
    (v) => v.length,
    (d) => d.file
  );
  const maxFileLength = d3.max(fileLengths, (d) => d[1]);
  dl.append("dt").text("Max File Length");
  dl.append("dd").text(maxFileLength);

  const maxDepthsPerFile = d3.rollups(
    data,
    (v) => d3.max(v, (v) => v.line),
    (d) => d.file
  );
  const avgFileDepth = d3.mean(maxDepthsPerFile, (d) => d[1]);
  dl.append("dt").text("Average file depth");
  dl.append("dd").text(avgFileDepth.toFixed(2));

  // Day of the week with most work
  const workByDay = d3.rollups(
    data,
    (v) => v.length,
    (d) => d.datetime.toLocaleDateString("en-US", { weekday: "long" })
  );
  const busiestDay = d3.greatest(workByDay, (d) => d[1])?.[0];
  dl.append("dt").text("Busiest day of the week");
  dl.append("dd").text(busiestDay);
}

renderCommitInfo(data, commits);

const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);

const width = 1000;
const height = 600;
const margin = { top: 10, right: 10, bottom: 30, left: 40 };

const usableArea = {
  top: margin.top,
  right: width - margin.right,
  bottom: height - margin.bottom,
  left: margin.left,
  width: width - margin.left - margin.right,
  height: height - margin.top - margin.bottom,
};

const rScale = d3
  .scaleSqrt() // Use sqrt to keep area perception accurate
  .domain([minLines, maxLines])
  .range([2, 30]);

let xScale = d3
  .scaleTime()
  .domain(d3.extent(commits, (d) => d.datetime))
  .range([usableArea.left, usableArea.right])
  .nice();

let yScale = d3
  .scaleLinear()
  .domain([0, 24])
  .range([usableArea.bottom, usableArea.top]);

function renderScatterPlot(data, commits) {
  // Create SVG
  const svg = d3
    .select("#chart")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .style("overflow", "visible");

  // Gridlines (before axes)
  const gridlines = svg
    .append("g")
    .attr("class", "gridlines")
    .attr("transform", `translate(${usableArea.left}, 0)`);

  gridlines.call(
    d3.axisLeft(yScale).tickFormat("").tickSize(-usableArea.width)
  );

  // Axes
  let xAxis = d3.axisBottom(xScale);
  let yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => String(d % 24).padStart(2, "0") + ":00");

  svg
    .append("g")
    .attr("transform", `translate(0, ${usableArea.bottom})`)
    .attr("class", "x-axis") // new line to mark the g tag
    .call(xAxis);

  svg
    .append("g")
    .attr("transform", `translate(${usableArea.left}, 0)`)
    .attr("class", "y-axis") // just for consistency
    .call(yAxis);

  // Optional: color by time of day
  const colorScale = d3
    .scaleLinear()
    .domain([0, 12, 24])
    .range(["midnightblue", "orange", "skyblue"]);

  // Dots
  const dots = svg.append("g").attr("class", "dots");

  dots
    .selectAll("circle")
    .data(sortedCommits, (d) => d.id)
    .join("circle")
    .attr("cx", (d) => xScale(d.datetime))
    .attr("cy", (d) => yScale(d.hourFrac))
    .style("--r", (d) => rScale(d.totalLines))
    .attr("r", (d) => rScale(d.totalLines))
    .attr("fill", (d) => colorScale(d.hourFrac))
    .style("fill-opacity", 0.7)
    .on("mouseenter", (event, commit) => {
      d3.select(event.currentTarget).style("fill-opacity", 1);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on("mousemove", (event) => {
      updateTooltipPosition(event);
    })
    .on("mouseleave", (event) => {
      d3.select(event.currentTarget).style("fill-opacity", 0.7);
      updateTooltipVisibility(false);
    });

  const brush = d3.brush().on("start brush end", brushed);

  // Apply brush to the SVG
  svg.call(brush);

  // Raise dots so they're on top of the overlay
  svg.selectAll(".dots, .overlay ~ *").raise();
}

function renderTooltipContent(commit) {
  if (!commit) return;

  const link = document.getElementById("commit-link");
  const date = document.getElementById("commit-date");
  const time = document.getElementById("commit-time");
  const author = document.getElementById("commit-author");
  const lines = document.getElementById("commit-lines");

  link.href = commit.url;
  link.textContent = commit.id;

  date.textContent = commit.datetime.toLocaleDateString("en", {
    dateStyle: "full",
  });
  time.textContent = commit.datetime.toLocaleTimeString("en", {
    timeStyle: "short",
  });
  author.textContent = commit.author;
  lines.textContent = commit.totalLines;
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById("commit-tooltip");
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById("commit-tooltip");
  tooltip.style.left = `${event.clientX + 12}px`;
  tooltip.style.top = `${event.clientY + 12}px`;
}

function brushed(event) {
  const selection = event.selection;

  d3.selectAll("circle").classed("selected", (d) =>
    isCommitSelected(selection, d)
  );

  renderSelectionCount(selection);
  renderLanguageBreakdown(selection);
}
function isCommitSelected(selection, commit) {
  if (!selection) return false;

  const [[x0, y0], [x1, y1]] = selection;
  const x = xScale(commit.datetime);
  const y = yScale(commit.hourFrac);

  return x0 <= x && x <= x1 && y0 <= y && y <= y1;
}
function renderSelectionCount(selection) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];

  const countEl = document.querySelector("#selection-count");
  countEl.textContent = `${selectedCommits.length || "No"} commits selected`;

  return selectedCommits;
}
function renderLanguageBreakdown(selection) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];

  const container = document.getElementById("language-breakdown");
  container.innerHTML = "";

  if (selectedCommits.length === 0) return;

  const lines = selectedCommits.flatMap((d) => d.lines);

  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type
  );

  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format(".1~%")(proportion);

    container.innerHTML += `
      <dt>${language}</dt>
      <dd>${count} lines (${formatted})</dd>
    `;
  }
}

renderScatterPlot(data, commits);

function updateScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = d3.select("#chart").select("svg");

  xScale = xScale.domain(d3.extent(commits, (d) => d.datetime));

  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

  const xAxis = d3.axisBottom(xScale);

  // CHANGE: we should clear out the existing xAxis and then create a new one.
  const xAxisGroup = svg.select("g.x-axis");
  xAxisGroup.selectAll("*").remove();
  xAxisGroup.call(xAxis);

  const dots = svg.select("g.dots");

  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
  dots
    .selectAll("circle")
    .data(sortedCommits, (d) => d.id)
    .join("circle")
    .attr("cx", (d) => xScale(d.datetime))
    .attr("cy", (d) => yScale(d.hourFrac))
    .style("--r", (d) => rScale(d.totalLines))
    .attr("r", (d) => rScale(d.totalLines))
    .attr("fill", "steelblue")
    .style("fill-opacity", 0.7) // Add transparency for overlapping dots
    .on("mouseenter", (event, commit) => {
      d3.select(event.currentTarget).style("fill-opacity", 1); // Full opacity on hover
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on("mouseleave", (event) => {
      d3.select(event.currentTarget).style("fill-opacity", 0.7);
      updateTooltipVisibility(false);
    });
}
commits.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
let commitProgress = 100;
let filteredCommits = commits;
let timeScale = d3
  .scaleTime()
  .domain([
    d3.min(commits, (d) => d.datetime),
    d3.max(commits, (d) => d.datetime),
  ])
  .range([0, 100]);
let commitMaxTime = timeScale.invert(commitProgress);
// const slider = document.getElementById("commit-progress");
// const timeDisplay = document.getElementById("commit-time-slide");
function onTimeSliderChange(selectedDatetime) {
  commitMaxTime = timeScale.invert(selectedDatetime);

  //const options = { dateStyle: "long", timeStyle: "short" };
  //timeDisplay.textContent = commitMaxTime.toLocaleString(undefined, options);
  filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);
  updateScatterPlot(data, filteredCommits);
  updateFileDisplay(filteredCommits);
}

//slider.addEventListener("input", onTimeSliderChange);
onTimeSliderChange(); // initialize on page load

function updateFileDisplay(filteredCommits) {
  let lines = filteredCommits.flatMap((d) => d.lines);
  let colors = d3.scaleOrdinal(d3.schemeTableau10);
  let files = d3
    .groups(lines, (d) => d.file)
    .map(([name, lines]) => {
      return { name, lines };
    })
    .sort((a, b) => b.lines.length - a.lines.length);

  let filesContainer = d3
    .select("#files")
    .selectAll("div")
    .data(files, (d) => d.name)
    .join((enter) =>
      enter.append("div").call((div) => {
        div.append("dt").append("code");
        div.append("dd");
      })
    );

  // Update filename + number of lines
  filesContainer
    .select("dt > code")
    .html((d) => `${d.name}<br><small>${d.lines.length} lines</small>`);

  // Append one .loc <div> for each line
  filesContainer
    .select("dd")
    .selectAll("div")
    .data((d) => d.lines)
    .join("div")
    .attr("class", "loc")
    .attr("style", (d) => `--color: ${colors(d.type)}`);
}

d3.select("#scatter-story")
  .selectAll(".step")
  .data(commits)
  .join("div")
  .attr("class", "step")
  .html(
    (d, i) => `
		On ${d.datetime.toLocaleString("en", {
      dateStyle: "full",
      timeStyle: "short",
    })},
		I made <a href="${d.url}" target="_blank">${
      i > 0 ? "another glorious commit" : "my first commit, and it was glorious"
    }</a>.
		I edited ${d.totalLines} lines across ${
      d3.rollups(
        d.lines,
        (D) => D.length,
        (d) => d.file
      ).length
    } files.
		Then I looked over all I had made, and I saw that it was very good.
	`
  );
function onStepEnter(response) {
  let commit = response.element.__data__;
  let selectedDatetime = commit.datetime;

  const visibleCommits = commits.filter((d) => d.datetime <= selectedDatetime);
  updateScatterPlot(data, visibleCommits);
  updateFileDisplay(visibleCommits);
}

const scroller = scrollama();
scroller
  .setup({
    container: "#scrolly-1",
    step: "#scrolly-1 .step",
  })
  .onStepEnter(onStepEnter);
