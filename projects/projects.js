import { fetchJSON, renderProjects } from '../global.js';
const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const titleElement = document.querySelector('.projects-title');
if (titleElement && projects) {
    titleElement.textContent = `${projects.length} Projects`;
  }
renderProjects(projects, projectsContainer, 'h2');

import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let query = '';
let selectedIndex = -1;
let currentPieData = [];

// Combined filtering
function getFilteredProjects() {
  return projects.filter(p => {
    const matchesQuery = Object.values(p).join('\n').toLowerCase().includes(query);
    const matchesYear = selectedIndex === -1 || p.year === currentPieData[selectedIndex].label;
    return matchesQuery && matchesYear;
  });
}

// Arc generator
let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

function renderPieChart(projectsGiven) {
  const svg = d3.select('svg');
  svg.selectAll('path').remove();

  // Roll up data by year
  const rolledData = d3.rollups(
    projectsGiven,
    v => v.length,
    d => d.year
  );

  const data = rolledData.map(([year, count]) => ({
    value: count,
    label: year
  }));
  currentPieData = data; // Save for global access

  // Generate arcs
  const sliceGenerator = d3.pie().value(d => d.value);
  const arcData = sliceGenerator(data);
  const arcs = arcData.map(d => arcGenerator(d));
  const colors = d3.scaleOrdinal(d3.schemeTableau10);

  // Draw arcs
  arcs.forEach((arc, i) => {
    svg.append('path')
      .attr('d', arc)
      .attr('fill', colors(i))
      .attr('class', i === selectedIndex ? 'selected' : '')
      .style('cursor', 'pointer')
      .on('click', () => {
        selectedIndex = selectedIndex === i ? -1 : i;

        // Highlight selection
        svg.selectAll('path')
          .attr('class', (_, idx) => (idx === selectedIndex ? 'selected' : ''));

        legend.selectAll('li')
          .attr('class', (_, idx) => (idx === selectedIndex ? 'selected' : ''));

        const finalFiltered = getFilteredProjects();
        renderProjects(finalFiltered, projectsContainer, 'h2');
      });
  });

  // Render legend
  const legend = d3.select('.legend');
  legend.selectAll('li').remove();
  data.forEach((d, i) => {
    legend.append('li')
      .attr('style', `--color:${colors(i)}`)
      .attr('class', i === selectedIndex ? 'selected' : '')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => {
        selectedIndex = selectedIndex === i ? -1 : i;

        svg.selectAll('path')
          .attr('class', (_, idx) => (idx === selectedIndex ? 'selected' : ''));

        legend.selectAll('li')
          .attr('class', (_, idx) => (idx === selectedIndex ? 'selected' : ''));

        const finalFiltered = getFilteredProjects();
        renderProjects(finalFiltered, projectsContainer, 'h2');
      });
  });
}

// Initial render
renderPieChart(projects);

// Search functionality
const searchInput = document.querySelector('.searchBar');
searchInput.addEventListener('input', (event) => {
  query = event.target.value.toLowerCase();

  const finalFiltered = getFilteredProjects();
  renderProjects(finalFiltered, projectsContainer, 'h2');
  renderPieChart(finalFiltered);
});


