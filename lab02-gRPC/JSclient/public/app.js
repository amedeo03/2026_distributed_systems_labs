'use strict';

// Film Manager frontend: plain DOM + fetch, served by the REST server itself (same origin, session cookie).

const state = {
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  users: null, // Map id -> user, loaded lazily once logged in
};

const IMAGE_FORMATS = { png: 'image/png', jpg: 'image/jpeg', gif: 'image/gif' };

/* ---------- helpers ---------- */

function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value == null || value === false) continue;
    if (key.startsWith('on')) el.addEventListener(key.slice(2), value);
    else el.setAttribute(key === 'className' ? 'class' : key, value === true ? '' : value);
  }
  for (const child of children.flat()) {
    if (child != null && child !== false) el.append(child instanceof Node ? child : String(child));
  }
  return el;
}

const field = (text, input) => h('label', {}, text, input);
const check = (text, input) => h('label', { class: 'inline' }, input, text);
const table = (headers, rows) => h('table', {},
  h('thead', {}, h('tr', {}, headers.map((x) => h('th', {}, x)))),
  h('tbody', {}, rows));

function setUser(user) {
  state.user = user;
  state.users = null;
  if (user) localStorage.setItem('user', JSON.stringify(user));
  else localStorage.removeItem('user');
}

async function errorText(res) {
  let body;
  try { body = await res.json(); } catch { return `${res.status} ${res.statusText}`; }
  const msgs = (body.errors || []).map((e) => {
    if (e.msg != null) return typeof e.msg === 'string' ? e.msg : JSON.stringify(e.msg);
    return [e.instancePath || e.path, e.message].filter(Boolean).join(' ');
  });
  return `${res.status}: ${msgs.join('; ') || body.message || body.error || res.statusText}`;
}

async function api(method, url, { json, form, accept } = {}) {
  const options = { method, headers: {} };
  if (json !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(json);
  }
  if (form) options.body = form;
  if (accept) options.headers.Accept = accept;

  const res = await fetch(url, options);
  if (res.status === 401 && state.user && url !== '/api/users/authenticator') {
    // session expired (e.g., server restarted)
    setUser(null);
    renderHeader();
  }
  if (!res.ok) throw new Error(await errorText(res));
  if (res.status === 204) return null;
  if ((res.headers.get('Content-Type') || '').includes('application/json')) {
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }
  return res.blob();
}

function flash(message, kind) {
  const box = document.getElementById('flash');
  box.className = kind;
  box.textContent = message;
  box.hidden = false;
}

// runs an action, reporting its outcome in the flash area
async function run(action, okMessage) {
  try {
    const result = await action();
    if (okMessage) flash(okMessage, 'ok');
    return result;
  } catch (err) {
    flash(err.message, 'error');
  }
}

async function usersById() {
  if (!state.user) return new Map();
  if (!state.users) {
    try {
      state.users = new Map((await api('GET', '/api/users') || []).map((u) => [u.id, u]));
    } catch {
      return new Map();
    }
  }
  return state.users;
}

function userLabel(users, id) {
  const user = users.get(id);
  return user ? `${user.name} (#${id})` : `#${id}`;
}

function pager(data, go) {
  const current = Number(data.currentPage);
  const total = Number(data.totalPages);
  if (total <= 1) return null;
  return h('div', { class: 'pager' },
    h('button', { disabled: current <= 1, onclick: () => go(current - 1) }, '‹ Prev'),
    h('span', {}, `Page ${current} of ${total}`),
    h('button', { disabled: current >= total, onclick: () => go(current + 1) }, 'Next ›'));
}

const needLogin = () => h('section', {}, h('p', {}, 'Log in to use this page.'));

/* ---------- header / session ---------- */

function loginForm() {
  const email = h('input', { type: 'email', placeholder: 'email', required: true, autocomplete: 'username' });
  const password = h('input', { type: 'password', placeholder: 'password', required: true, autocomplete: 'current-password' });
  return h('form', {
    onsubmit: (ev) => {
      ev.preventDefault();
      run(async () => {
        setUser(await api('POST', '/api/users/authenticator', { json: { email: email.value, password: password.value } }));
        render();
      }, 'Logged in.');
    },
  }, email, password, h('button', {}, 'Log in'));
}

function logout() {
  run(async () => {
    try {
      await api('DELETE', '/api/users/authenticator/current');
    } finally {
      setUser(null);
      navigate('#/public');
    }
  }, 'Logged out.');
}

function renderHeader() {
  const links = [['#/public', 'Public films']];
  if (state.user) {
    links.push(['#/private', 'My private films'], ['#/reviews', 'Reviews'], ['#/new', 'New film'], ['#/users', 'Users']);
  }
  const section = (location.hash || '#/public').split('/').slice(0, 2).join('/');
  document.getElementById('nav').replaceChildren(
    ...links.map(([href, text]) => h('a', { href, class: href === section ? 'active' : null }, text)));
  document.getElementById('session').replaceChildren(...(state.user
    ? [h('span', {}, `${state.user.name} (${state.user.email})`), h('button', { onclick: logout }, 'Log out')]
    : [loginForm()]));
}

/* ---------- films ---------- */

const FILM_LISTS = {
  public: { title: 'Public films', url: '/api/films/public', auth: false },
  private: { title: 'My private films', url: '/api/films/private', auth: true },
  reviews: { title: 'Public films I am invited to review', url: '/api/films/public/invited', auth: true },
};

const filmLink = (film) => h('a', { href: `#/film/${film.private ? 'private' : 'public'}/${film.id}` }, film.title);

async function filmListView(kind, page) {
  const list = FILM_LISTS[kind];
  if (list.auth && !state.user) return needLogin();
  page = Number(page) || 1;
  const [data, users] = await Promise.all([api('GET', `${list.url}?pageNo=${page}`), usersById()]);
  const films = data.films || [];
  const isPrivate = kind === 'private';

  const headers = isPrivate ? ['ID', 'Title', 'Watch date', 'Rating', 'Favorite'] : ['ID', 'Title', 'Owner'];
  const rows = films.map((f) => h('tr', {},
    h('td', {}, f.id),
    h('td', {}, filmLink(f)),
    isPrivate
      ? [h('td', {}, f.watchDate || ''), h('td', {}, f.rating ?? ''), h('td', {}, f.favorite ? '★' : '')]
      : h('td', {}, userLabel(users, f.owner))));

  return h('section', {},
    h('h2', {}, `${list.title} (${data.totalItems})`),
    films.length ? table(headers, rows) : h('p', { class: 'muted' }, 'No films.'),
    pager(data, (p) => { location.hash = `#/${kind}/${p}`; }));
}

// form for creating (no film) or updating a film; the visibility can be chosen only on creation
function filmForm(film, submitText, onSubmit) {
  const title = h('input', { required: true, value: film?.title });
  const isPrivate = h('input', { type: 'checkbox', checked: film ? film.private : true, disabled: !!film });
  const watchDate = h('input', { type: 'date', value: film?.watchDate });
  const rating = h('input', { type: 'number', min: 1, max: 10, value: film?.rating });
  const favorite = h('input', { type: 'checkbox', checked: film?.favorite });
  const privateFields = h('span', {}, field('Watch date', watchDate), field('Rating (1-10)', rating), check('Favorite', favorite));
  const sync = () => { privateFields.style.display = isPrivate.checked ? 'contents' : 'none'; };
  isPrivate.addEventListener('change', sync);
  sync();

  return h('form', {
    onsubmit: (ev) => {
      ev.preventDefault();
      const body = { title: title.value, private: isPrivate.checked };
      if (isPrivate.checked) {
        if (watchDate.value) body.watchDate = watchDate.value;
        if (rating.value) body.rating = Number(rating.value);
        body.favorite = favorite.checked;
      }
      onSubmit(body);
    },
  }, field('Title', title), check('Private', isPrivate), privateFields, h('button', {}, submitText));
}

function newFilmView() {
  if (!state.user) return needLogin();
  return h('section', {}, h('h2', {}, 'New film'), filmForm(null, 'Create', (body) => run(async () => {
    const film = await api('POST', '/api/films', { json: body });
    navigate(`#/film/${film.private ? 'private' : 'public'}/${film.id}`);
  }, 'Film created.')));
}

async function filmView(visibility, id) {
  if (visibility === 'private' && !state.user) return needLogin();
  const [film, users] = await Promise.all([api('GET', `/api/films/${visibility}/${id}`), usersById()]);
  const isOwner = !!state.user && film.owner === state.user.id;

  const info = [['ID', film.id], ['Owner', userLabel(users, film.owner)], ['Visibility', film.private ? 'private' : 'public']];
  if (film.private) info.push(['Watch date', film.watchDate || '—'], ['Rating', film.rating ?? '—'], ['Favorite', film.favorite ? 'yes' : 'no']);

  const views = [h('section', {},
    h('h2', {}, film.title),
    h('table', {}, info.map(([k, v]) => h('tr', {}, h('th', {}, k), h('td', {}, v)))))];

  if (isOwner) {
    views.push(h('section', {},
      h('h3', {}, 'Edit film'),
      filmForm(film, 'Save', (body) => run(async () => {
        await api('PUT', film.self, { json: body });
        render();
      }, 'Film updated.')),
      h('button', {
        class: 'danger',
        onclick: () => confirm(`Delete "${film.title}"?`) && run(async () => {
          await api('DELETE', film.self);
          navigate(film.private ? '#/private' : '#/public');
        }, 'Film deleted.'),
      }, 'Delete film')));
  }
  if (!film.private) {
    views.push(reviewsSection(film, users, isOwner));
    if (state.user) views.push(imagesSection(film, isOwner));
  }
  return views;
}

/* ---------- reviews ---------- */

function reviewsSection(film, users, isOwner) {
  const list = h('div');
  const editor = h('div');
  let page = 1;

  const load = async (p) => {
    try {
      const data = await api('GET', `${film.reviews}?pageNo=${p}`);
      page = p;
      const reviews = data.reviews || [];
      list.replaceChildren(h('div', {},
        reviews.length ? table(['Reviewer', 'Status', 'Date', 'Rating', 'Review', ''], reviews.map((r) => h('tr', {},
          h('td', {}, userLabel(users, r.reviewerId)),
          h('td', {}, r.completed ? 'completed' : 'pending'),
          h('td', {}, r.reviewDate || ''),
          h('td', {}, r.rating ?? ''),
          h('td', {}, r.review || ''),
          h('td', {},
            !r.completed && state.user && r.reviewerId === state.user.id
              ? h('button', { onclick: () => openReviewEditor(r) }, 'Write review') : null,
            !r.completed && isOwner
              ? h('button', { class: 'danger', onclick: () => deleteInvitation(r) }, 'Delete invitation') : null))))
          : h('p', { class: 'muted' }, 'No reviews.'),
        pager(data, load)));
    } catch (err) {
      list.replaceChildren(h('p', { class: 'muted' }, err.message));
    }
  };

  const deleteInvitation = (review) => run(async () => {
    await api('DELETE', review.self);
    await load(1);
  }, 'Invitation deleted.');

  const openReviewEditor = (summary) => run(async () => {
    const review = await api('GET', summary.self);
    if (review.completed) {
      await load(page);
      throw new Error('This review has already been completed.');
    }
    const date = h('input', { type: 'date', required: true, value: new Date().toISOString().slice(0, 10) });
    const rating = h('input', { type: 'number', min: 1, max: 10, required: true });
    const text = h('textarea', { required: true, maxlength: 1000, rows: 3, cols: 50 });
    editor.replaceChildren(h('h3', {}, 'Complete your review'), h('form', {
      onsubmit: (ev) => {
        ev.preventDefault();
        run(async () => {
          await api('PUT', review.self, {
            json: {
              filmId: review.filmId, reviewerId: review.reviewerId, completed: true,
              reviewDate: date.value, rating: Number(rating.value), review: text.value,
            },
          });
          editor.replaceChildren();
          await load(page);
        }, 'Review completed.');
      },
    }, field('Date', date), field('Rating (1-10)', rating), field('Review', text),
    h('button', {}, 'Submit'), h('button', { type: 'button', onclick: () => editor.replaceChildren() }, 'Cancel')));
  });

  load(1);
  return h('section', {}, h('h2', {}, 'Reviews'), list, editor, isOwner ? inviteForm(film, users, () => load(1)) : null);
}

function inviteForm(film, users, reload) {
  const candidates = [...users.values()].filter((u) => u.id !== film.owner);
  const select = h('select', { multiple: true, size: Math.min(candidates.length, 6) },
    candidates.map((u) => h('option', { value: u.id }, `${u.name} <${u.email}>`)));
  return h('div', {}, h('h3', {}, 'Invite reviewers'), h('form', {
    onsubmit: (ev) => {
      ev.preventDefault();
      const ids = [...select.selectedOptions].map((o) => Number(o.value));
      if (!ids.length) return flash('Select at least one user.', 'error');
      run(async () => {
        await api('POST', film.reviews, { json: ids.map((reviewerId) => ({ filmId: film.id, reviewerId, completed: false })) });
        await reload();
      }, 'Invitations issued.');
    },
  }, field('Users (Ctrl/Cmd+click for more)', select), h('button', {}, 'Invite')));
}

/* ---------- images ---------- */

function imagesSection(film, isOwner) {
  const list = h('div');
  const viewer = h('div');
  let objectUrl = null;

  const load = async () => {
    try {
      const images = await api('GET', film.images) || [];
      list.replaceChildren(images.length
        ? table(['ID', 'Name', 'Format', ''], images.map((img) => {
          const format = h('select', {}, Object.keys(IMAGE_FORMATS).map((ext) => h('option', { value: ext }, ext.toUpperCase())));
          return h('tr', {},
            h('td', {}, img.id),
            h('td', {}, img.name),
            h('td', {}, format),
            h('td', {},
              h('button', { onclick: () => show(img, format.value) }, 'Show'),
              isOwner ? h('button', { class: 'danger', onclick: () => remove(img) }, 'Delete') : null));
        }))
        : h('p', { class: 'muted' }, 'No images.'));
    } catch (err) {
      list.replaceChildren(h('p', { class: 'muted' }, err.message));
    }
  };

  // the server converts the stored file through the gRPC Converter when the requested format differs
  const show = (img, ext) => run(async () => {
    viewer.replaceChildren(h('p', { class: 'muted' }, `Loading ${img.name}.${ext}…`));
    try {
      const blob = await api('GET', img.self, { accept: IMAGE_FORMATS[ext] });
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = URL.createObjectURL(blob);
      viewer.replaceChildren(
        h('a', { href: objectUrl, download: `${img.name}.${ext}` }, `Download ${img.name}.${ext} (${Math.ceil(blob.size / 1024)} KB)`),
        h('img', { class: 'preview', src: objectUrl, alt: img.name }));
    } catch (err) {
      viewer.replaceChildren();
      throw err;
    }
  });

  const remove = (img) => confirm(`Delete image "${img.name}"?`) && run(async () => {
    await api('DELETE', img.self);
    viewer.replaceChildren();
    await load();
  }, 'Image deleted.');

  const file = h('input', { type: 'file', required: true, accept: Object.values(IMAGE_FORMATS).join(',') });
  const upload = isOwner ? h('form', {
    onsubmit: (ev) => {
      ev.preventDefault();
      const form = new FormData();
      form.append('image', file.files[0]);
      run(async () => {
        await api('POST', film.images, { form });
        file.value = '';
        await load();
      }, 'Image uploaded.');
    },
  }, field('Image (PNG, JPEG, GIF)', file), h('button', {}, 'Upload')) : null;

  load();
  return h('section', {}, h('h2', {}, 'Images'), list, upload, viewer);
}

/* ---------- users ---------- */

async function usersView() {
  if (!state.user) return needLogin();
  const users = await api('GET', '/api/users') || [];
  return h('section', {}, h('h2', {}, `Users (${users.length})`), table(['ID', 'Name', 'Email'],
    users.map((u) => h('tr', {}, h('td', {}, u.id), h('td', {}, h('a', { href: `#/users/${u.id}` }, u.name)), h('td', {}, u.email)))));
}

async function userView(id) {
  if (!state.user) return needLogin();
  const user = await api('GET', `/api/users/${id}`);
  if (!user) throw new Error('404: The user does not exist.');
  return h('section', {}, h('h2', {}, user.name),
    h('table', {}, [['ID', user.id], ['Email', user.email]].map(([k, v]) => h('tr', {}, h('th', {}, k), h('td', {}, v)))),
    h('p', {}, h('a', { href: '#/users' }, '‹ All users')));
}

/* ---------- routing ---------- */

const ROUTES = [
  [/^#\/(public|private|reviews)(?:\/(\d+))?$/, filmListView],
  [/^#\/film\/(public|private)\/(\d+)$/, filmView],
  [/^#\/new$/, newFilmView],
  [/^#\/users$/, usersView],
  [/^#\/users\/(\d+)$/, userView],
];

let renderId = 0;

async function render() {
  renderHeader();
  const hash = location.hash || '#/public';
  const route = ROUTES.find(([re]) => re.test(hash));
  if (!route) {
    location.hash = '#/public';
    return;
  }
  const id = ++renderId;
  const main = document.getElementById('main');
  let content;
  try {
    content = await route[1](...hash.match(route[0]).slice(1));
  } catch (err) {
    content = h('section', {}, h('p', {}, err.message));
  }
  if (id === renderId) main.replaceChildren(...[].concat(content));
}

// navigation triggered by an action keeps the action's outcome visible; plain navigation clears it
let keepFlash = false;

function navigate(hash) {
  if (location.hash === hash) return render();
  keepFlash = true;
  location.hash = hash;
}

window.addEventListener('hashchange', () => {
  if (!keepFlash) document.getElementById('flash').hidden = true;
  keepFlash = false;
  render();
});
render();
