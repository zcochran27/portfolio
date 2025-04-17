console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}
// const navLinks = $$("nav a");

// const currentLink = navLinks.find(
//   (a) => a.host === location.host && a.pathname === location.pathname
// );
// currentLink?.classList.add('current');

let pages = [
    { url: 'index.html', title: 'Home' },
    { url: 'projects/index.html', title: 'Projects' },
    { url: 'contact/index.html', title: 'Contact' },
    { url: 'https://github.com/zcochran27', title: 'GitHub' }];

let nav = document.createElement('nav');
document.body.prepend(nav);

const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "/"                 // Local
  : "/zcochran27/portfolio/"; 

for (let p of pages) {
    let url = p.url;
    let title = p.title;
    url = !url.startsWith('http') ? BASE_PATH + url : url;
    console.log("url")
    console.log("")
    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;
    console.log(a.host)
    console.log(location.host)
    console.log(a.pathname)
    console.log(location.pathname)
    if (a.host === location.host && a.pathname === location.pathname) {
        a.classList.add('current');
      }
    nav.append(a);
  }
