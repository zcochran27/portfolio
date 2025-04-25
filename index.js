import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';
const projects = await fetchJSON('./lib/projects.json');
const latestProjects = projects.slice(0, 3);
const projectsContainer = document.querySelector('.projects');
renderProjects(latestProjects, projectsContainer, 'h2');

const githubData = await fetchGitHubData('zcochran27');
const profileStats = document.querySelector('#profile-stats');
if (profileStats) {
    profileStats.innerHTML = `
          <h2>Profile Stats</h2>
          <dl class = "stats-grid">
            <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
            <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
            <dt>Followers:</dt><dd>${githubData.followers}</dd>
            <dt>Following:</dt><dd>${githubData.following}</dd>
          </dl>
      `;
  }

