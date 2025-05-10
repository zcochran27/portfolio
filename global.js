console.log("IT'S ALIVE!");

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

let pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Projects' },
    { url: 'contact/', title: 'Contact' },
    { url: 'resume/', title: 'Resume'},
    { url: 'meta/', title:'Meta'},
    { url: 'https://github.com/zcochran27', title: 'GitHub' }];
let nav = document.createElement('nav');
document.body.prepend(nav);

const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "/"
  : "/portfolio/"; 
for (let p of pages) {
    let url = p.url;
    let title = p.title;
    url = !url.startsWith('http') ? BASE_PATH + url : url;
    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;
    if (a.host === location.host && a.pathname === location.pathname) {
        a.classList.add('current');
    }
    a.toggleAttribute('target', a.host !== location.host);
    nav.append(a);
  }

  document.body.insertAdjacentHTML(
    'afterbegin',
    `
    <label class="color-scheme">
      Theme:
      <select>
        <option value="light dark">Automatic</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
    `
  );
  
  let select = document.querySelector('.color-scheme select');
  
  select.addEventListener('input', function (event) {
    let value = event.target.value;
    console.log('color scheme changed to', value);
    document.documentElement.style.setProperty('color-scheme', value);
  });

  select.addEventListener('input', function (event) {
    let value = event.target.value;
    console.log('color scheme changed to', value);
    document.documentElement.style.setProperty('color-scheme', value);
  
    // Save to localStorage
    localStorage.colorScheme = value;
  });

  if ("colorScheme" in localStorage) {
    let saved = localStorage.colorScheme;
    document.documentElement.style.setProperty('color-scheme', saved);
    select.value = saved;
  }

  //importing project data
  export async function fetchJSON(url) {
    try {
      // Fetch the JSON file from the given URL
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching or parsing JSON data:', error);
    }
  }

  export function renderProjects(project, containerElement, headingLevel = 'h2') {
    containerElement.innerHTML = '';

    project.forEach(proj => {
    const article = document.createElement('article');
    article.innerHTML = `
    <h3>${proj.title} (${proj.year})</h3>
    <img src="${proj.image}" alt="${proj.title}" width = 275>
    <p>${proj.description}</p>`;
    containerElement.appendChild(article);});
  }
  export async function fetchGitHubData(username) {
    return fetchJSON(`https://api.github.com/users/${username}`);
  }
