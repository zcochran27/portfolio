console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

let pages = [
    { url: 'index.html', title: 'Home' },
    { url: 'projects/index.html', title: 'Projects' },
    { url: 'contact/index.html', title: 'Contact' },
    { url: 'resume/index.html', title: 'Resume'},
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
    // if (a.pathname=== "/zcochran27" || a.pathname === "https://github.com/zcochran27") {
    //     a.target = "_blank";
    // }
    // if (a.host !== location.host) {
    //     a.target = "_blank";
    // }
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
  
  // Step 4.4: Make the switcher actually change theme
  let select = document.querySelector('.color-scheme select');
  
  select.addEventListener('input', function (event) {
    let value = event.target.value;
    console.log('color scheme changed to', value);
    document.documentElement.style.setProperty('color-scheme', value);
  });
