// =========================================================
// SoundWave - Main Landing Page Script
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
  initNavbarAuth();
  loadTrendingTracks();
  initFaqAccordion();
});

// 1. Check Authentication State and Update Navbar
async function initNavbarAuth() {
  const navActions = document.getElementById('navActions');
  const heroCtaBtn = document.getElementById('heroCtaBtn');

  try {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      const data = await res.json();
      if (data.user) {
        // User is logged in
        navActions.innerHTML = '';

        const userBadge = document.createElement('div');
        userBadge.className = 'user-badge';

        const avatar = document.createElement('div');
        avatar.className = 'user-avatar-circle';
        avatar.textContent = (data.user.name || 'U').charAt(0).toUpperCase();

        const nameSpan = document.createElement('span');
        nameSpan.textContent = data.user.name;

        userBadge.appendChild(avatar);
        userBadge.appendChild(nameSpan);

        const dashboardBtn = document.createElement('a');
        dashboardBtn.href = '/dashboard';
        dashboardBtn.className = 'btn btn-primary btn-small';
        dashboardBtn.textContent = 'Dashboard';

        const logoutBtn = document.createElement('button');
        logoutBtn.type = 'button';
        logoutBtn.className = 'btn btn-outline btn-small';
        logoutBtn.textContent = 'Log Out';
        logoutBtn.addEventListener('click', handleLogout);

        navActions.appendChild(userBadge);
        navActions.appendChild(dashboardBtn);
        navActions.appendChild(logoutBtn);

        // Update Hero CTA
        if (heroCtaBtn) {
          heroCtaBtn.textContent = 'Go to Dashboard';
          heroCtaBtn.href = '/dashboard';
        }
      }
    }
  } catch (err) {
    console.warn('Auth check skipped or offline:', err);
  }
}

// Handle User Logout
async function handleLogout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.reload();
  } catch (err) {
    console.error('Logout error:', err);
  }
}

// 2. Load Trending Tracks from GET /api/songs
async function loadTrendingTracks() {
  const container = document.getElementById('trendingTracksContainer');
  if (!container) return;

  try {
    const res = await fetch('/api/songs');
    if (!res.ok) {
      throw new Error('Failed to load songs');
    }

    const data = await res.json();
    const songs = data.songs || [];

    if (songs.length === 0) {
      container.innerHTML = `
        <div style="padding: 24px; color: var(--text-secondary); width: 100%; text-align: center;">
          No tracks available yet. Check back soon!
        </div>
      `;
      return;
    }

    // Clear skeleton loaders
    container.innerHTML = '';

    // Render cards safely using DOM methods (XSS prevention)
    songs.slice(0, 10).forEach(song => {
      const card = createSongCard(song);
      container.appendChild(card);
    });
  } catch (err) {
    console.error('Error fetching trending songs:', err);
    container.innerHTML = `
      <div style="padding: 24px; color: var(--text-secondary); width: 100%; text-align: center;">
        Unable to load trending tracks right now. Verify database connection.
      </div>
    `;
  }
}

// Helper to create a song card safely
function createSongCard(song) {
  const card = document.createElement('div');
  card.className = 'song-card';

  // Album Cover with Gradient
  const cover = document.createElement('div');
  cover.className = 'album-cover';
  cover.style.background = song.gradientCss || 'linear-gradient(135deg, #1DB954, #121212)';

  // SVG waveform icon inside cover
  cover.innerHTML = `
    <svg class="album-cover-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 18V5l12-2v13"></path>
      <circle cx="6" cy="18" r="3"></circle>
      <circle cx="18" cy="16" r="3"></circle>
    </svg>
    <a href="/dashboard" class="card-play-btn" aria-label="Play ${song.title}">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>
    </a>
  `;

  // Info Container
  const info = document.createElement('div');
  info.className = 'song-info';

  const title = document.createElement('div');
  title.className = 'song-title';
  title.textContent = song.title; // Safe textContent

  const artist = document.createElement('div');
  artist.className = 'song-artist';
  artist.textContent = song.artist; // Safe textContent

  const meta = document.createElement('div');
  meta.className = 'song-meta';

  const genre = document.createElement('span');
  genre.className = 'song-genre-tag';
  genre.textContent = song.genre || 'Music';

  const duration = document.createElement('span');
  duration.textContent = song.duration || '3:30';

  meta.appendChild(genre);
  meta.appendChild(duration);

  info.appendChild(title);
  info.appendChild(artist);
  info.appendChild(meta);

  card.appendChild(cover);
  card.appendChild(info);

  return card;
}

// 3. Pure JS FAQ Accordion
function initFaqAccordion() {
  const accordion = document.getElementById('faqAccordion');
  if (!accordion) return;

  const items = accordion.querySelectorAll('.faq-item');

  items.forEach(item => {
    const header = item.querySelector('.faq-header');
    header.addEventListener('click', () => {
      const isAlreadyActive = item.classList.contains('active');

      // Close all other items
      items.forEach(otherItem => {
        otherItem.classList.remove('active');
        const otherHeader = otherItem.querySelector('.faq-header');
        if (otherHeader) otherHeader.setAttribute('aria-expanded', 'false');
      });

      // Toggle clicked item
      if (!isAlreadyActive) {
        item.classList.add('active');
        header.setAttribute('aria-expanded', 'true');
      }
    });
  });
}
