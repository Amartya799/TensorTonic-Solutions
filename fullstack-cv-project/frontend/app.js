const form = document.querySelector('#project-form');
const list = document.querySelector('#projects-list');
const template = document.querySelector('#project-template');
const filterSelect = document.querySelector('#status-filter');

let projects = [];

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || 'Request failed.');
  }

  return response.json();
}

function renderProjects() {
  const filter = filterSelect.value;
  const visible = filter === 'all' ? projects : projects.filter((project) => project.status === filter);

  list.innerHTML = '';

  if (!visible.length) {
    const empty = document.createElement('li');
    empty.className = 'empty';
    empty.textContent = 'No projects match this filter yet.';
    list.append(empty);
    return;
  }

  visible.forEach((project) => {
    const node = template.content.cloneNode(true);
    node.querySelector('.title').textContent = project.title;
    node.querySelector('.summary').textContent = project.summary;
    node.querySelector('.stack').textContent = `Stack: ${project.stack.join(', ')}`;
    node.querySelector('.impact').textContent = `Impact: ${project.impact}`;
    node.querySelector('.status-pill').textContent = project.status;

    const statusSelect = node.querySelector('.status-select');
    statusSelect.value = project.status;
    statusSelect.addEventListener('change', async (event) => {
      try {
        const updated = await api(`/api/projects/${project.id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: event.target.value })
        });

        projects = projects.map((item) => (item.id === project.id ? updated : item));
        renderProjects();
      } catch (error) {
        alert(error.message);
      }
    });

    list.append(node);
  });
}

async function loadProjects() {
  projects = await api('/api/projects');
  renderProjects();
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const payload = {
    title: formData.get('title').trim(),
    summary: formData.get('summary').trim(),
    stack: formData.get('stack').split(',').map((item) => item.trim()).filter(Boolean),
    impact: formData.get('impact').trim(),
    status: formData.get('status')
  };

  try {
    const created = await api('/api/projects', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    projects.unshift(created);
    form.reset();
    renderProjects();
  } catch (error) {
    alert(error.message);
  }
});

filterSelect.addEventListener('change', renderProjects);

loadProjects().catch((error) => {
  list.innerHTML = `<li class="empty">Could not load projects: ${error.message}</li>`;
});
