const unitsList = document.getElementById('units-list');
const unitSelect = document.getElementById('unit');
const form = document.getElementById('inquiry-form');
const errorEl = document.getElementById('form-error');
const successEl = document.getElementById('form-success');

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatRent(rent) {
  return `$${rent.toLocaleString()}/mo`;
}

async function loadUnits() {
  const res = await fetch('/api/units');
  const units = await res.json();

  unitsList.innerHTML = '';
  unitSelect.innerHTML = '';

  for (const unit of units) {
    const card = document.createElement('div');
    card.className = 'unit-card';
    card.innerHTML = `
      <span class="unit-rent">${formatRent(unit.rent)}</span>
      <div class="unit-name">${escapeHtml(unit.name)}</div>
      <div class="unit-type">${escapeHtml(unit.type)}</div>
      <p class="unit-description">${escapeHtml(unit.description)}</p>
    `;
    unitsList.appendChild(card);

    const option = document.createElement('option');
    option.value = unit.id;
    option.textContent = `${unit.name} — ${formatRent(unit.rent)}`;
    unitSelect.appendChild(option);
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorEl.textContent = '';
  successEl.textContent = '';

  const unitId = Number(unitSelect.value);
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const message = document.getElementById('message').value.trim();

  const res = await fetch('/api/inquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ unitId, name, email, message }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    errorEl.textContent = data.error || 'Something went wrong. Please try again.';
    return;
  }

  form.reset();
  successEl.textContent = "Thanks — your inquiry has been sent. We'll be in touch soon.";
});

loadUnits();
