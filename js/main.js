/* ============================================================
   main.js — Returnly Global JavaScript
   Handles: navbar, hero, scroll effects, toasts, modal,
            auth state, item cards, search/filter logic,
            owner edit/delete actions in the detail modal
   ============================================================ */

'use strict';

// ── Helpers ───────────────────────────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

// ── Toast notifications ───────────────────────────────────────
function showToast(message, type = 'default', duration = 4000) {
  let container = $('#toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: '✅', error: '❌', warning: '⚠️', default: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || icons.default}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all .3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── Navbar logic ──────────────────────────────────────────────
function initNavbar() {
  const navbar   = $('#navbar');
  const hamburger = $('#hamburger');
  const drawer   = $('#nav-drawer');
  const page     = window.location.pathname.split('/').pop() || 'index.html';

  if (!navbar) return;

  // Active link highlight
  $$('.nav-links a, .nav-drawer a').forEach(a => {
    if (a.getAttribute('href') === page ||
        (page === '' && a.getAttribute('href') === 'index.html')) {
      a.classList.add('active');
    }
  });

  // Scroll shadow
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });

  // Hamburger toggle
  if (hamburger && drawer) {
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.toggle('open');
      drawer.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close drawer when a link is clicked
    $$('.nav-drawer a').forEach(a =>
      a.addEventListener('click', () => {
        hamburger.classList.remove('open');
        drawer.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      })
    );

    // Close on outside click
    document.addEventListener('click', e => {
      if (!navbar.contains(e.target) && !drawer.contains(e.target)) {
        hamburger.classList.remove('open');
        drawer.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  // Auth-aware nav buttons
  updateNavAuthState();
}

// ── Auth-aware UI ─────────────────────────────────────────────
async function updateNavAuthState() {
  if (typeof sb === 'undefined') return;

  const { data: { session } } = await sb.auth.getSession();
  const user = session?.user || null;

  // Desktop nav actions & links
  const loginBtn  = $('#nav-login-btn');
  const logoutBtn = $('#nav-logout-btn');
  const dashLinks = $$('#nav-dashboard-link, #nav-dashboard-btn');

  const updateUI = (u) => {
    if (loginBtn)  loginBtn.style.display  = u ? 'none' : '';
    if (logoutBtn) logoutBtn.style.display = u ? '' : 'none';
    dashLinks.forEach(el => el.style.display = u ? '' : 'none');

    // Drawer counterparts
    const drawerLogin  = $('#drawer-login');
    const drawerLogout = $('#drawer-logout');
    const drawerDash   = $('#drawer-dashboard');
    if (drawerLogin)  drawerLogin.style.display  = u ? 'none' : '';
    if (drawerLogout) drawerLogout.style.display = u ? '' : 'none';
    if (drawerDash)   drawerDash.style.display   = u ? '' : 'none';
  };

  updateUI(user);

  // Listen for auth changes
  sb.auth.onAuthStateChange((_event, s) => {
    updateUI(s?.user || null);
  });
}

// ── Logout handler ────────────────────────────────────────────
function initLogout() {
  $$('[data-action="logout"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (typeof sb === 'undefined') return;
      await sb.auth.signOut();
      showToast('You\'ve been signed out. See you soon! 👋', 'success');
      setTimeout(() => window.location.href = 'index.html', 1200);
    });
  });
}

// ── Scroll-reveal ─────────────────────────────────────────────
function initScrollReveal() {
  const els = $$('.reveal');
  if (!els.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  els.forEach(el => io.observe(el));
}

// ── Item card builder ─────────────────────────────────────────
const CATEGORY_ICONS = {
  Pets: '🐾', Phone: '📱', Wallet: '👛', Bag: '🎒',
  Keys: '🔑', Documents: '📄', Other: '📦'
};

function buildItemCard(item, onClick) {
  const isLost = item.type === 'lost';
  const icon   = CATEGORY_ICONS[item.category] || '📦';
  const date   = new Date(item.item_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const hasValidUrl = !!(item.image_url && typeof item.image_url === 'string' && item.image_url.trim().length > 0);

  const card = document.createElement('article');
  card.className = 'card';
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `${item.type} item: ${item.title}`);
  card.dataset.id = item.id;

  const imageMarkup = hasValidUrl
    ? `<img class="card-img" src="${escapeHtml(item.image_url.trim())}" alt="${escapeHtml(item.title)}" loading="lazy" onerror="this.onerror=null; this.replaceWith(Object.assign(document.createElement('div'), {className:'card-img-placeholder', textContent:'${icon}'}));">`
    : `<div class="card-img-placeholder">${icon}</div>`;

  card.innerHTML = `
    ${imageMarkup}
    <div class="card-body">
      <div class="flex gap-1 items-center mb-1">
        <span class="badge badge-${item.type}">${isLost ? '🔍 Lost' : '🎉 Found'}</span>
        <span class="badge" style="background:rgba(0,0,0,.05);color:var(--text-muted);">${icon} ${escapeHtml(item.category)}</span>
      </div>
      <h3 class="card-title">${escapeHtml(item.title)}</h3>
      <div class="card-meta">
        <span>📍 ${escapeHtml(item.area)}</span>
        <span>📅 ${date}</span>
      </div>
      ${item.description ? `<p style="font-size:.85rem;color:var(--text-muted);margin-top:.5rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${escapeHtml(item.description)}</p>` : ''}
    </div>
  `;

  const open = () => onClick && onClick(item);
  card.addEventListener('click', open);
  card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') open(); });

  return card;
}

// ── Item detail modal ─────────────────────────────────────────
function openItemModal(item) {
  const overlay = $('#item-modal');
  if (!overlay) return;

  const isLost = item.type === 'lost';
  const icon   = CATEGORY_ICONS[item.category] || '📦';
  const date   = new Date(item.item_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  $('#modal-title').textContent   = item.title;
  $('#modal-badge').className     = `badge badge-${item.type}`;
  $('#modal-badge').textContent   = isLost ? '🔍 Lost' : '🎉 Found';
  $('#modal-category').textContent = `${icon} ${item.category}`;
  $('#modal-area').textContent    = `📍 ${item.area}`;
  $('#modal-date').textContent    = `📅 ${date}`;
  $('#modal-desc').textContent    = item.description || 'No description provided.';

  const imgEl = $('#modal-img');
  if (imgEl) {
    if (item.image_url) {
      imgEl.src   = item.image_url;
      imgEl.alt   = item.title;
      imgEl.style.display = '';
    } else {
      imgEl.style.display = 'none';
    }
  }

  // Show contact info only to logged-in users
  updateModalContactState(item);

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Store current item for contact reveal
  overlay.dataset.currentItem = JSON.stringify(item);
}

async function updateModalContactState(item) {
  if (typeof sb === 'undefined') return;
  const { data: { session } } = await sb.auth.getSession();
  const user = session?.user || null;

  const contactWrap  = $('#modal-contact-wrap');
  const loginPrompt  = $('#modal-login-prompt');
  const contactInfo  = $('#modal-contact-info');

  if (!contactWrap) return;

  const isOwner = !!(user && item.user_id === user.id);

  if (isOwner) {
    if (contactWrap) contactWrap.style.display = 'none';
  } else {
    if (contactWrap) contactWrap.style.display = '';
    if (user) {
      if (loginPrompt) loginPrompt.style.display = 'none';
      if (contactInfo) {
        const methodIcons = { email: '✉️', phone: '📞', whatsapp: '💬' };
        contactInfo.innerHTML = `
          <strong>${methodIcons[item.contact_method] || '📬'} ${capitalize(item.contact_method)}</strong><br>
          <a href="${item.contact_method === 'email' ? 'mailto:' : 'tel:'}${escapeHtml(item.contact_value)}"
             style="color:var(--teal);font-weight:600;">
            ${escapeHtml(item.contact_value)}
          </a>
        `;
        contactInfo.style.display = '';
      }
    } else {
      if (contactInfo) contactInfo.style.display = 'none';
      if (loginPrompt) loginPrompt.style.display = '';
    }
  }

  // ── Owner actions: Edit & Delete ──────────────────────────
  // Show Edit/Delete buttons in the modal footer only when the
  // logged-in user is the owner of the post.
  const ownerActions = $('#modal-owner-actions');
  if (ownerActions) {
    ownerActions.style.display = isOwner ? 'flex' : 'none';

    if (isOwner) {
      // Wire up Edit button (opens the inline edit modal)
      const editBtn = $('#modal-edit-btn');
      if (editBtn) {
        const fresh = editBtn.cloneNode(true);
        editBtn.replaceWith(fresh);
        fresh.addEventListener('click', () => {
          closeModal();
          openEditModal(item);
        });
      }

      // Wire up Delete button
      const delBtn = $('#modal-delete-btn');
      if (delBtn) {
        const freshDel = delBtn.cloneNode(true);
        delBtn.replaceWith(freshDel);
        freshDel.addEventListener('click', () => {
          closeModal();
          openModalDelete(item.id, item.image_url || '', item.title);
        });
      }
    }
  }
}

// ── Storage helper: extract path from public URL ──────────────
function storagePathFromUrl(publicUrl) {
  try {
    const url   = new URL(publicUrl);
    const parts = url.pathname.split('/item-photos/');
    return parts[1] ? decodeURIComponent(parts[1].split('?')[0]) : null;
  } catch (_) { return null; }
}

// ── Delete an item (used by both dashboard and modal) ─────────
async function deleteItemById(id, imageUrl) {
  // 1. Remove photo from storage (best-effort)
  if (imageUrl) {
    const path = storagePathFromUrl(imageUrl);
    if (path) {
      await sb.storage.from('item-photos').remove([path]).catch(() => {});
    }
  }
  // 2. Delete the row
  const { error } = await sb.from('items').delete().eq('id', id);
  return error;
}

// ── Standalone confirm-delete modal (shared by modal & dash) ──
// A lightweight confirm overlay injected once into the page.
function ensureDeleteConfirmModal() {
  if (document.getElementById('global-confirm-modal')) return;
  const html = `
    <div class="modal-overlay" id="global-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="gcm-title">
      <div class="modal" style="max-width:420px;">
        <div class="modal-header">
          <h2 id="gcm-title" style="font-size:1.1rem;">🗑️ Delete this post?</h2>
          <button class="modal-close" id="gcm-close" aria-label="Close">✕</button>
        </div>
        <div class="modal-body">
          <p id="gcm-item-name" style="font-weight:600;margin-bottom:.5rem;"></p>
          <p style="color:var(--text-muted);font-size:.93rem;">
            Are you sure? This can't be undone.
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" id="gcm-cancel">Cancel</button>
          <button class="btn btn-danger" id="gcm-confirm">Yes, delete</button>
        </div>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', html);

  document.getElementById('gcm-close').addEventListener('click',  closeDeleteConfirm);
  document.getElementById('gcm-cancel').addEventListener('click', closeDeleteConfirm);
  document.getElementById('global-confirm-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('global-confirm-modal')) closeDeleteConfirm();
  });
}

let _pendingDeleteId  = null;
let _pendingDeleteUrl = null;
let _afterDeleteCb    = null;

function openModalDelete(id, imageUrl, title, afterDeleteCb) {
  ensureDeleteConfirmModal();
  _pendingDeleteId  = id;
  _pendingDeleteUrl = imageUrl;
  _afterDeleteCb    = afterDeleteCb || null;

  document.getElementById('gcm-item-name').textContent = title || 'this item';

  // Rebind confirm button to avoid duplicate listeners
  const confirmBtn = document.getElementById('gcm-confirm');
  const fresh = confirmBtn.cloneNode(true);
  confirmBtn.replaceWith(fresh);
  fresh.addEventListener('click', async () => {
    fresh.disabled = true;
    fresh.textContent = '⏳ Deleting…';
    const err = await deleteItemById(_pendingDeleteId, _pendingDeleteUrl);
    closeDeleteConfirm();
    if (err) {
      showToast('Could not delete — please try again: ' + (err.message || ''), 'error');
    } else {
      showToast('Post deleted. 🗑️', 'default');
      if (typeof _afterDeleteCb === 'function') {
        _afterDeleteCb();
      } else {
        setTimeout(() => window.location.reload(), 800);
      }
    }
  });

  document.getElementById('global-confirm-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeDeleteConfirm() {
  const m = document.getElementById('global-confirm-modal');
  if (m) m.classList.remove('open');
  document.body.style.overflow = '';
  _pendingDeleteId = _pendingDeleteUrl = _afterDeleteCb = null;
}

// ── Edit modal (inline, shared across pages) ──────────────────
function ensureEditModal() {
  if (document.getElementById('edit-item-modal')) return;
  const html = `
  <div class="modal-overlay" id="edit-item-modal" role="dialog" aria-modal="true" aria-labelledby="edit-modal-title">
    <div class="modal" style="max-width:620px;">
      <div class="modal-header">
        <h2 id="edit-modal-title" style="font-size:1.2rem;">✏️ Edit Post</h2>
        <button class="modal-close" id="edit-modal-close" aria-label="Close">✕</button>
      </div>
      <div class="modal-body" style="padding-bottom:.5rem;">
        <form id="edit-item-form" novalidate>

          <!-- Type toggle -->
          <div class="form-group">
            <label class="form-label">Item type <span class="req" aria-hidden="true">*</span></label>
            <div class="type-toggle" role="group" aria-label="Select lost or found">
              <input type="radio" name="edit-type" id="edit-type-lost" value="lost" />
              <label class="lost-label" for="edit-type-lost">🔍 I Lost This</label>
              <input type="radio" name="edit-type" id="edit-type-found" value="found" />
              <label class="found-label" for="edit-type-found">🎉 I Found This</label>
            </div>
          </div>

          <!-- Title -->
          <div class="form-group">
            <label class="form-label" for="edit-title">Item name <span class="req" aria-hidden="true">*</span></label>
            <input class="form-input" type="text" id="edit-title" maxlength="100" required />
            <span class="form-error" id="edit-title-err" role="alert"></span>
          </div>

          <!-- Category -->
          <div class="form-group">
            <label class="form-label" for="edit-category">Category <span class="req" aria-hidden="true">*</span></label>
            <select class="form-select" id="edit-category" required>
              <option value="">Select a category…</option>
              <option value="Pets">🐾 Pets</option>
              <option value="Phone">📱 Phone</option>
              <option value="Wallet">👛 Wallet</option>
              <option value="Bag">🎒 Bag</option>
              <option value="Keys">🔑 Keys</option>
              <option value="Documents">📄 Documents</option>
              <option value="Other">📦 Other</option>
            </select>
            <span class="form-error" id="edit-category-err" role="alert"></span>
          </div>

          <!-- Description -->
          <div class="form-group">
            <label class="form-label" for="edit-description">Description</label>
            <textarea class="form-textarea" id="edit-description" maxlength="800"></textarea>
          </div>

          <!-- Photo -->
          <div class="form-group">
            <label class="form-label">Photo</label>
            <div id="edit-current-photo-wrap" style="margin-bottom:.75rem;display:none;">
              <img id="edit-current-photo" src="" alt="Current photo"
                style="width:100%;max-height:180px;object-fit:cover;border-radius:var(--radius-sm);" />
              <button type="button" id="edit-remove-current-photo" class="btn btn-ghost btn-sm" style="margin-top:.4rem;">
                ✕ Remove current photo
              </button>
            </div>
            <div class="photo-upload-area" id="edit-upload-area" role="button" tabindex="0" aria-label="Upload a replacement photo">
              <input type="file" id="edit-photo-input" accept="image/*" aria-hidden="true" />
              <div id="edit-upload-placeholder">
                <div style="font-size:1.75rem;margin-bottom:.35rem;" aria-hidden="true">📸</div>
                <p style="font-weight:600;font-size:.9rem;margin-bottom:.2rem;">Click or drag to replace photo</p>
                <p style="font-size:.78rem;color:var(--text-muted);">JPG, PNG or WEBP · Max 5 MB · optional</p>
              </div>
              <img id="edit-photo-preview" class="photo-preview" src="" alt="New photo preview" />
              <button type="button" id="edit-remove-new-photo" class="btn btn-ghost btn-sm" style="display:none;margin-top:.5rem;">
                ✕ Remove new photo
              </button>
            </div>
          </div>

          <!-- Area -->
          <div class="form-group">
            <label class="form-label" for="edit-area">Area / Neighbourhood <span class="req" aria-hidden="true">*</span></label>
            <input class="form-input" type="text" id="edit-area" maxlength="80" required />
            <span class="form-hint">🛡️ Neighbourhood only — never a full address.</span>
            <span class="form-error" id="edit-area-err" role="alert"></span>
          </div>

          <!-- Date -->
          <div class="form-group">
            <label class="form-label" for="edit-date">Date lost / found <span class="req" aria-hidden="true">*</span></label>
            <input class="form-input" type="date" id="edit-date" required />
            <span class="form-error" id="edit-date-err" role="alert"></span>
          </div>

          <!-- Contact method -->
          <div class="form-group">
            <label class="form-label">Contact method <span class="req" aria-hidden="true">*</span></label>
            <div style="display:flex;gap:.75rem;flex-wrap:wrap;margin-bottom:.75rem;" role="group">
              <label style="display:flex;align-items:center;gap:.45rem;cursor:pointer;">
                <input type="radio" name="edit-contact-method" value="email" style="accent-color:var(--teal);" /> ✉️ Email
              </label>
              <label style="display:flex;align-items:center;gap:.45rem;cursor:pointer;">
                <input type="radio" name="edit-contact-method" value="phone" style="accent-color:var(--teal);" /> 📞 Phone
              </label>
              <label style="display:flex;align-items:center;gap:.45rem;cursor:pointer;">
                <input type="radio" name="edit-contact-method" value="whatsapp" style="accent-color:var(--teal);" /> 💬 WhatsApp
              </label>
            </div>
            <input class="form-input" type="text" id="edit-contact-value" required />
            <span class="form-hint">Only visible to signed-in users.</span>
            <span class="form-error" id="edit-contact-err" role="alert"></span>
          </div>

          <!-- Global error -->
          <div id="edit-form-error" role="alert"
            style="display:none;padding:.75rem 1rem;background:rgba(239,68,68,.08);border-radius:var(--radius-sm);
                   color:#DC2626;font-size:.9rem;margin-bottom:.75rem;border:1px solid rgba(239,68,68,.2);">
          </div>

        </form>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" id="edit-modal-cancel">Cancel</button>
        <button class="btn btn-primary" id="edit-modal-save">💾 Save Changes</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);

  // Close handlers
  ['edit-modal-close', 'edit-modal-cancel'].forEach(id => {
    document.getElementById(id).addEventListener('click', closeEditModal);
  });
  document.getElementById('edit-item-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('edit-item-modal')) closeEditModal();
  });

  // Photo upload wiring
  const uploadArea   = document.getElementById('edit-upload-area');
  const fileInput    = document.getElementById('edit-photo-input');
  const preview      = document.getElementById('edit-photo-preview');
  const placeholder  = document.getElementById('edit-upload-placeholder');
  const removeNew    = document.getElementById('edit-remove-new-photo');

  uploadArea.addEventListener('click', e => {
    if (e.target !== removeNew) fileInput.click();
  });
  uploadArea.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') fileInput.click();
  });
  uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.classList.add('drag-over'); });
  uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'));
  uploadArea.addEventListener('drop', e => {
    e.preventDefault(); uploadArea.classList.remove('drag-over');
    if (e.dataTransfer.files[0]) handleEditFile(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', () => { if (fileInput.files[0]) handleEditFile(fileInput.files[0]); });

  removeNew.addEventListener('click', e => {
    e.stopPropagation();
    _editSelectedFile = null;
    fileInput.value = '';
    preview.src = '';
    preview.classList.remove('show');
    placeholder.style.display = '';
    removeNew.style.display = 'none';
  });

  // Remove current photo toggle
  document.getElementById('edit-remove-current-photo').addEventListener('click', () => {
    _editRemoveCurrentPhoto = true;
    document.getElementById('edit-current-photo-wrap').style.display = 'none';
  });

  // Save button
  document.getElementById('edit-modal-save').addEventListener('click', submitEditForm);
}

function handleEditFile(file) {
  if (!file.type.startsWith('image/')) {
    showToast('Please choose an image file (JPG, PNG, WEBP).', 'error'); return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showToast('File too large. Max size is 5 MB.', 'error'); return;
  }
  _editSelectedFile = file;
  const reader = new FileReader();
  reader.onload = ev => {
    const preview     = document.getElementById('edit-photo-preview');
    const placeholder = document.getElementById('edit-upload-placeholder');
    const removeNew   = document.getElementById('edit-remove-new-photo');
    preview.src = ev.target.result;
    preview.classList.add('show');
    placeholder.style.display = 'none';
    removeNew.style.display = '';
  };
  reader.readAsDataURL(file);
}

// State for the open edit modal
let _editingItem           = null;
let _editSelectedFile      = null;
let _editRemoveCurrentPhoto = false;
let _afterEditCb           = null;

function openEditModal(item, afterEditCb) {
  ensureEditModal();
  _editingItem            = item;
  _editSelectedFile       = null;
  _editRemoveCurrentPhoto = false;
  _afterEditCb            = afterEditCb || null;

  // Clear errors
  ['edit-title-err','edit-category-err','edit-area-err','edit-date-err','edit-contact-err'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.textContent = ''; el.classList.remove('show'); }
  });
  ['edit-title','edit-category','edit-area','edit-date','edit-contact-value'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('error');
  });
  const globalErr = document.getElementById('edit-form-error');
  if (globalErr) globalErr.style.display = 'none';

  // Pre-fill fields
  const typeRadio = document.querySelector(`input[name="edit-type"][value="${item.type}"]`);
  if (typeRadio) typeRadio.checked = true;
  document.getElementById('edit-title').value       = item.title        || '';
  document.getElementById('edit-category').value    = item.category     || '';
  document.getElementById('edit-description').value = item.description  || '';
  document.getElementById('edit-area').value        = item.area         || '';
  document.getElementById('edit-date').value        = item.item_date    || '';
  document.getElementById('edit-contact-value').value = item.contact_value || '';

  const methodRadio = document.querySelector(`input[name="edit-contact-method"][value="${item.contact_method}"]`);
  if (methodRadio) methodRadio.checked = true;

  // Current photo
  const currentWrap  = document.getElementById('edit-current-photo-wrap');
  const currentPhoto = document.getElementById('edit-current-photo');
  if (item.image_url) {
    currentPhoto.src = item.image_url;
    currentWrap.style.display = '';
  } else {
    currentWrap.style.display = 'none';
  }

  // Reset new-photo preview
  const preview     = document.getElementById('edit-photo-preview');
  const placeholder = document.getElementById('edit-upload-placeholder');
  const removeNew   = document.getElementById('edit-remove-new-photo');
  const fileInput   = document.getElementById('edit-photo-input');
  preview.src = '';
  preview.classList.remove('show');
  placeholder.style.display = '';
  removeNew.style.display = 'none';
  fileInput.value = '';

  // Reset save button
  const saveBtn = document.getElementById('edit-modal-save');
  saveBtn.disabled = false;
  saveBtn.textContent = '💾 Save Changes';

  document.getElementById('edit-item-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeEditModal() {
  const m = document.getElementById('edit-item-modal');
  if (m) m.classList.remove('open');
  document.body.style.overflow = '';
  _editingItem = _editSelectedFile = _afterEditCb = null;
  _editRemoveCurrentPhoto = false;
}

function validateEditForm() {
  let ok = true;
  const setErr = (errId, inputId, msg) => {
    const errEl   = document.getElementById(errId);
    const inputEl = document.getElementById(inputId);
    if (errEl)   { errEl.textContent = msg; errEl.classList.toggle('show', !!msg); }
    if (inputEl) inputEl.classList.toggle('error', !!msg);
    if (msg) ok = false;
  };
  // Clear first
  setErr('edit-title-err',   'edit-title',         '');
  setErr('edit-category-err','edit-category',       '');
  setErr('edit-area-err',    'edit-area',           '');
  setErr('edit-date-err',    'edit-date',           '');
  setErr('edit-contact-err', 'edit-contact-value',  '');

  if (!document.getElementById('edit-title').value.trim())
    setErr('edit-title-err', 'edit-title', 'Item name is required.');
  if (!document.getElementById('edit-category').value)
    setErr('edit-category-err', 'edit-category', 'Please choose a category.');
  if (!document.getElementById('edit-area').value.trim())
    setErr('edit-area-err', 'edit-area', 'Area is required.');
  if (!document.getElementById('edit-date').value)
    setErr('edit-date-err', 'edit-date', 'Date is required.');
  if (!document.getElementById('edit-contact-value').value.trim())
    setErr('edit-contact-err', 'edit-contact-value', 'Contact info is required.');

  return ok;
}

async function submitEditForm() {
  if (!_editingItem) return;
  if (!validateEditForm()) return;

  const saveBtn  = document.getElementById('edit-modal-save');
  const globalErr = document.getElementById('edit-form-error');
  globalErr.style.display = 'none';
  saveBtn.disabled = true;
  saveBtn.textContent = '⏳ Saving…';

  try {
    const { data: { session } } = await sb.auth.getSession();
    if (!session?.user) throw new Error('You must be signed in to edit a post.');

    const type           = document.querySelector('input[name="edit-type"]:checked')?.value;
    const title          = document.getElementById('edit-title').value.trim();
    const category       = document.getElementById('edit-category').value;
    const description    = document.getElementById('edit-description').value.trim();
    const area           = document.getElementById('edit-area').value.trim();
    const item_date      = document.getElementById('edit-date').value;
    const contact_method = document.querySelector('input[name="edit-contact-method"]:checked')?.value;
    const contact_value  = document.getElementById('edit-contact-value').value.trim();

    let image_url = _editingItem.image_url || null;

    // ── Handle photo changes ──
    // 1. Remove current photo if requested (and no new one is coming)
    if (_editRemoveCurrentPhoto && !_editSelectedFile && image_url) {
      const path = storagePathFromUrl(image_url);
      if (path) await sb.storage.from('item-photos').remove([path]).catch(() => {});
      image_url = null;
    }

    // 2. Upload new photo if provided
    if (_editSelectedFile) {
      saveBtn.textContent = '📸 Uploading photo…';
      // Delete old photo from storage first
      if (image_url) {
        const oldPath = storagePathFromUrl(image_url);
        if (oldPath) await sb.storage.from('item-photos').remove([oldPath]).catch(() => {});
      }
      const ext      = _editSelectedFile.name.split('.').pop();
      const fileName = `${session.user.id}/${Date.now()}.${ext}`;
      const { data: uploadData, error: uploadErr } = await sb.storage
        .from('item-photos')
        .upload(fileName, _editSelectedFile, { cacheControl: '3600', upsert: false });
      if (uploadErr) throw new Error(`Photo upload failed: ${uploadErr.message}`);
      const targetPath = (uploadData && uploadData.path) ? uploadData.path : fileName;
      const { data: urlData } = sb.storage.from('item-photos').getPublicUrl(targetPath);
      image_url = urlData?.publicUrl || null;
      if (!image_url) throw new Error('Could not get public URL for uploaded photo.');
    }

    saveBtn.textContent = '💾 Saving…';

    // ── Update row ──
    const { error: updateErr } = await sb
      .from('items')
      .update({ type, title, category, description, image_url, area, item_date, contact_method, contact_value })
      .eq('id', _editingItem.id);

    if (updateErr) throw new Error(updateErr.message);

    closeEditModal();
    showToast('Post updated! ✏️', 'success');
    if (typeof _afterEditCb === 'function') {
      _afterEditCb();
    } else {
      setTimeout(() => window.location.reload(), 800);
    }

  } catch (err) {
    console.error(err);
    globalErr.textContent = err.message || 'Something went wrong. Please try again.';
    globalErr.style.display = '';
    saveBtn.disabled = false;
    saveBtn.textContent = '💾 Save Changes';
  }
}

function closeModal() {
  const overlay = $('#item-modal');
  if (!overlay) return;
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

function initModal() {
  const overlay = $('#item-modal');
  if (!overlay) return;

  // Close on overlay click
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal();
  });

  // Close button
  const closeBtn = $('#modal-close');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  // Keyboard close
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });
}

// ── Rendering: list of items ──────────────────────────────────
function renderItems(items, container, emptyMessage = 'No items found.') {
  container.innerHTML = '';

  if (!items || items.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">🔍</div>
        <h3>Nothing here yet</h3>
        <p>${emptyMessage}</p>
        <a href="post.html" class="btn btn-primary mt-2">Post an Item</a>
      </div>`;
    return;
  }

  items.forEach(item => {
    const card = buildItemCard(item, openItemModal);
    container.appendChild(card);
  });
}

// ── Loading state ─────────────────────────────────────────────
function showLoading(container, message = 'Loading items…') {
  container.innerHTML = `
    <div class="loading-wrap" style="grid-column:1/-1">
      <div class="spinner"></div>
      <p>${message}</p>
    </div>`;
}

// ── Fetch items from Supabase ─────────────────────────────────
async function fetchItems({ type, limit, search, category, area, userId } = {}) {
  if (typeof sb === 'undefined') return [];

  let query = sb
    .from('items')
    .select('*')
    .eq('status', 'open')
    .order('created_at', { ascending: false });

  if (type)     query = query.eq('type', type);
  if (category) query = query.eq('category', category);
  if (area)     query = query.ilike('area', `%${area}%`);
  if (userId)   query = query.eq('user_id', userId);
  if (limit)    query = query.limit(limit);

  // Full-text search on title + description
  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,area.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) { console.error('fetchItems:', error); return []; }
  return data || [];
}

// ── Filter + search bar binding ───────────────────────────────
function bindFilters({ searchInput, categorySelect, areaInput, container, type }) {
  let debounceTimer;

  const refresh = async () => {
    showLoading(container);
    const items = await fetchItems({
      type,
      search:   searchInput?.value?.trim() || '',
      category: categorySelect?.value || '',
      area:     areaInput?.value?.trim() || '',
    });
    renderItems(items, container, type
      ? `No ${type} items match your search. Try different filters.`
      : 'No items match your search.');
  };

  const debounce = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(refresh, 350);
  };

  if (searchInput)   searchInput.addEventListener('input', debounce);
  if (categorySelect) categorySelect.addEventListener('change', refresh);
  if (areaInput)     areaInput.addEventListener('input', debounce);

  return refresh; // return so caller can do initial load
}

// ── Utilities ─────────────────────────────────────────────────
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

// Lazy image loading guard (in case browser doesn't support natively)
function lazyLoadImages() {
  if ('loading' in HTMLImageElement.prototype) return; // native support
  const images = $$('img[loading="lazy"]');
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.src = e.target.dataset.src || e.target.src;
        io.unobserve(e.target);
      }
    });
  });
  images.forEach(img => io.observe(img));
}

// ── Footer current year ───────────────────────────────────────
function initFooterYear() {
  const year = new Date().getFullYear();
  $$('.current-year, #current-year').forEach(el => {
    el.textContent = year;
  });
}

// ── Init on DOM ready ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initLogout();
  initScrollReveal();
  initModal();
  lazyLoadImages();
  initFooterYear();
});
