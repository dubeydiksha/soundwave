// =========================================================
// SoundWave - Dashboard & Liked Songs CRUD Script
// =========================================================

// Application State
const state = {
  currentUser: null,
  allSongs: [],
  likedSongs: [],
  likedSongIds: new Set(),
  activeGenre: 'All',
  searchQuery: '',
  currentPlayingSong: null,
  isPlaying: false,
  playbackInterval: null,
  currentSeconds: 0,
  totalSeconds: 210,
  songPendingDelete: null
};

document.addEventListener('DOMContentLoaded', () => {
  initDashboard();
});

// Initialize Dashboard
async function initDashboard() {
  const isAuthenticated = await checkAuth();
  if (!isAuthenticated) return;

  setupEventListeners();
  await Promise.all([loadLikedSongs(), loadAllSongs()]);
}

// 1. Check Authentication (Redirect to /login if unauthenticated)
async function checkAuth() {
  try {
    const res = await fetch('/api/auth/me');
    if (!res.ok) {
      window.location.href = '/login';
      return false;
    }

    const data = await res.json();
    state.currentUser = data.user;

    // Greet user safely by name
    const greetingHeader = document.getElementById('greetingHeader');
    const navUserName = document.getElementById('navUserName');
    const userAvatarLetter = document.getElementById('userAvatarLetter');

    const firstName = state.currentUser.name.split(' ')[0];
    const timeGreeting = getTimeBasedGreeting();

    greetingHeader.textContent = `${timeGreeting}, ${firstName}!`;
    navUserName.textContent = state.currentUser.name;
    userAvatarLetter.textContent = (state.currentUser.name || 'U').charAt(0).toUpperCase();

    return true;
  } catch (err) {
    console.error('Auth verification failed:', err);
    window.location.href = '/login';
    return false;
  }
}

function getTimeBasedGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

// 2. Setup Event Listeners
function setupEventListeners() {
  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/';
      } catch (err) {
        console.error('Logout error:', err);
        window.location.href = '/';
      }
    });
  }

  // Search Input with Debounce
  const searchInput = document.getElementById('searchInput');
  let searchTimeout = null;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      state.searchQuery = e.target.value.trim();
      loadAllSongs();
    }, 300);
  });

  // Genre Filter Chips
  const genreChips = document.getElementById('genreChips');
  genreChips.addEventListener('click', (e) => {
    const chip = e.target.closest('.genre-chip');
    if (!chip) return;

    genreChips.querySelectorAll('.genre-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');

    state.activeGenre = chip.dataset.genre || 'All';
    loadAllSongs();
  });

  // Delete Confirmation Modal Controls
  const deleteModal = document.getElementById('deleteModal');
  const modalCancelBtn = document.getElementById('modalCancelBtn');
  const modalConfirmBtn = document.getElementById('modalConfirmBtn');

  modalCancelBtn.addEventListener('click', closeDeleteModal);
  deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) closeDeleteModal();
  });

  modalConfirmBtn.addEventListener('click', confirmRemoveLikedSong);

  // Bottom Player Controls
  setupPlayerControls();
}

// =========================================================
// 3. READ: Liked Songs (GET /api/liked)
// =========================================================
async function loadLikedSongs() {
  const grid = document.getElementById('likedSongsGrid');
  const countBadge = document.getElementById('likedCountBadge');

  try {
    const res = await fetch('/api/liked');
    if (!res.ok) throw new Error('Failed to fetch liked songs');

    const data = await res.json();
    state.likedSongs = data.likedSongs || [];

    // Populate set of liked song IDs
    state.likedSongIds.clear();
    state.likedSongs.forEach(item => {
      if (item.song && item.song._id) {
        state.likedSongIds.add(item.song._id);
      }
    });

    // Update count badge
    countBadge.textContent = `(${state.likedSongs.length})`;

    // Render Grid
    renderLikedSongsGrid(state.likedSongs);

    // Update player like button if currently playing song is liked
    updatePlayerLikeButton();
  } catch (err) {
    console.error('Error loading liked songs:', err);
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-title">Unable to load liked songs</div>
        <p class="empty-state-desc">Please verify your database connection.</p>
      </div>
    `;
  }
}

function renderLikedSongsGrid(items) {
  const grid = document.getElementById('likedSongsGrid');
  grid.innerHTML = '';

  if (items.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
        <h3 class="empty-state-title">No liked songs yet</h3>
        <p class="empty-state-desc">Songs you love will show up here. Click the heart icon on any song below to start your collection!</p>
      </div>
    `;
    return;
  }

  items.forEach(item => {
    const song = item.song;
    if (!song) return;

    const card = document.createElement('div');
    card.className = 'song-card';

    // Album cover
    const cover = document.createElement('div');
    cover.className = 'album-cover';
    cover.style.background = song.gradientCss || 'linear-gradient(135deg, #1DB954, #121212)';

    // Play button on cover
    const playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.className = 'card-play-btn';
    playBtn.setAttribute('aria-label', `Play ${song.title}`);
    playBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>
    `;
    playBtn.addEventListener('click', () => playTrack(song));

    cover.appendChild(playBtn);

    // Heart toggle button (in top right of card)
    const heartBtn = document.createElement('button');
    heartBtn.type = 'button';
    heartBtn.className = 'like-btn liked';
    heartBtn.setAttribute('aria-label', `Unlike ${song.title}`);
    heartBtn.title = 'Remove from Liked Songs';
    heartBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#1DB954" stroke="#1DB954" stroke-width="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
    `;
    heartBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openDeleteModal(song, item._id);
    });

    card.appendChild(heartBtn);
    card.appendChild(cover);

    // Song Info
    const info = document.createElement('div');
    info.className = 'song-info';

    const title = document.createElement('div');
    title.className = 'song-title';
    title.textContent = song.title; // Safe textContent against XSS

    const artist = document.createElement('div');
    artist.className = 'song-artist';
    artist.textContent = song.artist; // Safe textContent against XSS

    const meta = document.createElement('div');
    meta.className = 'song-meta';

    const genre = document.createElement('span');
    genre.className = 'song-genre-tag';
    genre.textContent = song.genre || 'Music';

    const duration = document.createElement('span');
    duration.textContent = song.duration || '3:30';

    meta.appendChild(genre);
    meta.appendChild(duration);

    // Remove button with confirm dialog
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-btn';
    removeBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
      <span>Remove</span>
    `;
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openDeleteModal(song, item._id);
    });

    info.appendChild(title);
    info.appendChild(artist);
    info.appendChild(meta);
    info.appendChild(removeBtn);

    card.appendChild(info);
    grid.appendChild(card);
  });
}

// =========================================================
// 4. READ: All Songs (GET /api/songs)
// =========================================================
async function loadAllSongs() {
  const grid = document.getElementById('allSongsGrid');

  // Build query string
  const params = new URLSearchParams();
  if (state.activeGenre && state.activeGenre !== 'All') {
    params.set('genre', state.activeGenre);
  }
  if (state.searchQuery) {
    params.set('q', state.searchQuery);
  }

  const url = `/api/songs${params.toString() ? `?${params.toString()}` : ''}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load tracks');

    const data = await res.json();
    state.allSongs = data.songs || [];

    renderAllSongsGrid(state.allSongs);
  } catch (err) {
    console.error('Error fetching all songs:', err);
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-title">Error loading tracks</div>
        <p class="empty-state-desc">Please verify server and database status.</p>
      </div>
    `;
  }
}

function renderAllSongsGrid(songs) {
  const grid = document.getElementById('allSongsGrid');
  grid.innerHTML = '';

  if (songs.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <h3 class="empty-state-title">No songs found</h3>
        <p class="empty-state-desc">Try tweaking your search keywords or switching to a different genre.</p>
      </div>
    `;
    return;
  }

  songs.forEach(song => {
    const isLiked = state.likedSongIds.has(song._id);

    const card = document.createElement('div');
    card.className = 'song-card';

    // Album cover
    const cover = document.createElement('div');
    cover.className = 'album-cover';
    cover.style.background = song.gradientCss || 'linear-gradient(135deg, #1DB954, #121212)';

    // Play button
    const playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.className = 'card-play-btn';
    playBtn.setAttribute('aria-label', `Play ${song.title}`);
    playBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>
    `;
    playBtn.addEventListener('click', () => playTrack(song));

    cover.appendChild(playBtn);

    // CREATE / UPDATE: Like / Unlike Toggle button
    const heartBtn = document.createElement('button');
    heartBtn.type = 'button';
    heartBtn.className = `like-btn ${isLiked ? 'liked' : ''}`;
    heartBtn.setAttribute('aria-label', isLiked ? `Unlike ${song.title}` : `Like ${song.title}`);
    heartBtn.title = isLiked ? 'Unlike track' : 'Add to Liked Songs';

    heartBtn.innerHTML = isLiked
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="#1DB954" stroke="#1DB954" stroke-width="2">
           <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
         </svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
           <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
         </svg>`;

    heartBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleToggleLike(song);
    });

    card.appendChild(heartBtn);
    card.appendChild(cover);

    // Song info
    const info = document.createElement('div');
    info.className = 'song-info';

    const title = document.createElement('div');
    title.className = 'song-title';
    title.textContent = song.title; // Safe textContent against XSS

    const artist = document.createElement('div');
    artist.className = 'song-artist';
    artist.textContent = song.artist; // Safe textContent against XSS

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

    card.appendChild(info);
    grid.appendChild(card);
  });
}

// =========================================================
// 5. CREATE & UPDATE: Like / Unlike Toggle Handler
// =========================================================
async function handleToggleLike(song) {
  const isLiked = state.likedSongIds.has(song._id);

  if (isLiked) {
    // If already liked, toggle unlike (or prompt remove)
    await removeLikedSongDirectly(song._id, song.title);
  } else {
    // POST /api/liked to CREATE
    try {
      const res = await fetch('/api/liked', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songId: song._id })
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Failed to like track', 'error');
        return;
      }

      state.likedSongIds.add(song._id);
      showToast(`Added "${song.title}" to Liked Songs!`, 'success');

      // Refresh both views
      await loadLikedSongs();
      renderAllSongsGrid(state.allSongs);
      updatePlayerLikeButton();
    } catch (err) {
      console.error('Error liking track:', err);
      showToast('Network error while saving like.', 'error');
    }
  }
}

// =========================================================
// 6. DELETE: Remove from Liked Songs with Confirm Dialog
// =========================================================
function openDeleteModal(song, likedEntryId) {
  state.songPendingDelete = { song, likedEntryId };

  const modal = document.getElementById('deleteModal');
  const modalMessage = document.getElementById('modalMessage');

  modalMessage.textContent = `Are you sure you want to remove "${song.title}" by ${song.artist} from your Liked Songs library?`;
  modal.classList.add('active');
}

function closeDeleteModal() {
  const modal = document.getElementById('deleteModal');
  modal.classList.remove('active');
  state.songPendingDelete = null;
}

async function confirmRemoveLikedSong() {
  if (!state.songPendingDelete) return;

  const { song, likedEntryId } = state.songPendingDelete;
  closeDeleteModal();

  const targetId = likedEntryId || song._id;
  await removeLikedSongDirectly(targetId, song.title, song._id);
}

async function removeLikedSongDirectly(id, songTitle, actualSongId) {
  try {
    const res = await fetch(`/api/liked/${id}`, {
      method: 'DELETE'
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || 'Failed to remove song.', 'error');
      return;
    }

    // Clean from local set
    if (actualSongId) {
      state.likedSongIds.delete(actualSongId);
    } else {
      state.likedSongIds.delete(id);
    }

    showToast(`Removed "${songTitle}" from Liked Songs.`, 'info');

    // Refresh both sections
    await loadLikedSongs();
    renderAllSongsGrid(state.allSongs);
    updatePlayerLikeButton();
  } catch (err) {
    console.error('Error removing liked song:', err);
    showToast('Network error removing song.', 'error');
  }
}

// =========================================================
// 7. Interactive Bottom Music Player Bar
// =========================================================
function setupPlayerControls() {
  const playPauseBtn = document.getElementById('playerPlayPauseBtn');
  const playIcon = document.getElementById('playIcon');
  const playerLikeBtn = document.getElementById('playerLikeBtn');
  const playerPrevBtn = document.getElementById('playerPrevBtn');
  const playerNextBtn = document.getElementById('playerNextBtn');
  const progressBarBg = document.getElementById('progressBarBg');
  const volumeBarBg = document.getElementById('volumeBarBg');
  const volumeBarFill = document.getElementById('volumeBarFill');

  playPauseBtn.addEventListener('click', togglePlayback);

  playerLikeBtn.addEventListener('click', () => {
    if (state.currentPlayingSong) {
      handleToggleLike(state.currentPlayingSong);
    }
  });

  playerPrevBtn.addEventListener('click', playPreviousTrack);
  playerNextBtn.addEventListener('click', playNextTrack);

  // Seek bar click
  progressBarBg.addEventListener('click', (e) => {
    if (!state.currentPlayingSong) return;
    const rect = progressBarBg.getBoundingClientRect();
    const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    state.currentSeconds = Math.floor(clickRatio * state.totalSeconds);
    updateProgressBar();
  });

  // Volume bar click
  volumeBarBg.addEventListener('click', (e) => {
    const rect = volumeBarBg.getBoundingClientRect();
    const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    volumeBarFill.style.width = `${clickRatio * 100}%`;
  });
}

function playTrack(song) {
  state.currentPlayingSong = song;
  state.isPlaying = true;
  state.currentSeconds = 0;

  // Convert duration string "3:42" to seconds
  state.totalSeconds = parseDurationToSeconds(song.duration || '3:30');

  // Update UI metadata
  const playerThumb = document.getElementById('playerThumb');
  const playerTitle = document.getElementById('playerTitle');
  const playerArtist = document.getElementById('playerArtist');
  const totalTimeLabel = document.getElementById('totalTimeLabel');

  playerThumb.style.background = song.gradientCss || 'linear-gradient(135deg, #1DB954, #121212)';
  playerTitle.textContent = song.title; // Safe textContent
  playerArtist.textContent = song.artist; // Safe textContent
  totalTimeLabel.textContent = song.duration || '3:30';

  updatePlayerLikeButton();
  updatePlayPauseIcon(true);

  startPlaybackTimer();
  showToast(`Now playing: "${song.title}"`, 'info');
}

function togglePlayback() {
  if (!state.currentPlayingSong) {
    if (state.allSongs.length > 0) {
      playTrack(state.allSongs[0]);
    }
    return;
  }

  state.isPlaying = !state.isPlaying;
  updatePlayPauseIcon(state.isPlaying);

  if (state.isPlaying) {
    startPlaybackTimer();
  } else {
    clearInterval(state.playbackInterval);
  }
}

function startPlaybackTimer() {
  clearInterval(state.playbackInterval);
  state.playbackInterval = setInterval(() => {
    if (!state.isPlaying) return;

    state.currentSeconds++;
    if (state.currentSeconds >= state.totalSeconds) {
      playNextTrack();
    } else {
      updateProgressBar();
    }
  }, 1000);
}

function updateProgressBar() {
  const currentTimeLabel = document.getElementById('currentTimeLabel');
  const progressBarFill = document.getElementById('progressBarFill');

  currentTimeLabel.textContent = formatSecondsToTime(state.currentSeconds);
  const ratio = (state.currentSeconds / state.totalSeconds) * 100;
  progressBarFill.style.width = `${Math.min(100, ratio)}%`;
}

function playNextTrack() {
  if (!state.currentPlayingSong || state.allSongs.length === 0) return;
  const currentIndex = state.allSongs.findIndex(s => s._id === state.currentPlayingSong._id);
  const nextIndex = (currentIndex + 1) % state.allSongs.length;
  playTrack(state.allSongs[nextIndex]);
}

function playPreviousTrack() {
  if (!state.currentPlayingSong || state.allSongs.length === 0) return;
  const currentIndex = state.allSongs.findIndex(s => s._id === state.currentPlayingSong._id);
  const prevIndex = (currentIndex - 1 + state.allSongs.length) % state.allSongs.length;
  playTrack(state.allSongs[prevIndex]);
}

function updatePlayPauseIcon(isPlaying) {
  const playPauseBtn = document.getElementById('playerPlayPauseBtn');
  playPauseBtn.innerHTML = isPlaying
    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
         <rect x="6" y="4" width="4" height="16"></rect>
         <rect x="14" y="4" width="4" height="16"></rect>
       </svg>`
    : `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
         <polygon points="5 3 19 12 5 21 5 3"></polygon>
       </svg>`;
}

function updatePlayerLikeButton() {
  const playerLikeBtn = document.getElementById('playerLikeBtn');
  if (!playerLikeBtn || !state.currentPlayingSong) return;

  const isLiked = state.likedSongIds.has(state.currentPlayingSong._id);
  playerLikeBtn.innerHTML = isLiked
    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="#1DB954" stroke="#1DB954" stroke-width="2">
         <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
       </svg>`
    : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
         <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
       </svg>`;
}

function parseDurationToSeconds(str) {
  const parts = str.split(':').map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 200;
}

function formatSecondsToTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// =========================================================
// 8. Toast Notifications
// =========================================================
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconSvg = type === 'success'
    ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1DB954" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`
    : type === 'error'
    ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e91429" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`
    : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00c6ff" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;

  const iconSpan = document.createElement('span');
  iconSpan.innerHTML = iconSvg;

  const textSpan = document.createElement('span');
  textSpan.textContent = message; // Safe textContent against XSS

  toast.appendChild(iconSpan);
  toast.appendChild(textSpan);
  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  // Auto remove after 3.5s
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3500);
}
