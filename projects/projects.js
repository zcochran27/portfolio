import { fetchJSON, renderProjects } from '../global.js';
const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const titleElement = document.querySelector('.projects-title');
if (titleElement && projects) {
    titleElement.textContent = `${projects.length} Projects`;
  }
renderProjects(projects, projectsContainer, 'h2');
