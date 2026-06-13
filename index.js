/* ==========================================================================
   pooreyoutuber.github.io - Multi-Streamer JavaScript Engine
   ========================================================================== */

// Global State
let inputCount = 1;
let activePlayers = [];
let ytApiLoaded = false;

document.addEventListener('DOMContentLoaded', () => {
  initCopyrightYear();
  initDynamicInputs();
  bootstrapYoutubeAPI();
  initFormSubmit();
  initMuteSync();
});

/**
 * 1. Auto-update Copyright Year in Footer
 */
function initCopyrightYear() {
  const yearEl = document.getElementById('copyright-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}

/**
 * 2. Bootstrap YouTube IFrame API Asynchronously
 */
function bootstrapYoutubeAPI() {
  const tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  const firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// Called automatically by the YouTube API script once loaded
window.onYouTubeIframeAPIReady = function() {
  ytApiLoaded = true;
  console.log("YouTube IFrame Player API successfully loaded.");
};

/**
 * 3. Dynamic Inputs Management (Add/Remove Rows)
 */
function initDynamicInputs() {
  const container = document.getElementById('inputs-container');
  const addBtn = document.getElementById('add-input-btn');

  if (!container || !addBtn) return;

  addBtn.addEventListener('click', () => {
    inputCount++;
    
    // Create new input item structure
    const newRow = document.createElement('div');
    newRow.className = 'input-item';
    newRow.id = `input-row-${inputCount}`;
    
    newRow.innerHTML = `
      <span class="input-number">${inputCount}</span>
      <div class="input-wrapper">
        <input type="url" class="url-input" placeholder="Paste YouTube Video URL (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ)" required aria-label="YouTube URL ${inputCount}">
      </div>
      <button type="button" class="delete-btn" aria-label="Remove URL ${inputCount}">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          <line x1="10" y1="11" x2="10" y2="17"></line>
          <line x1="14" y1="11" x2="14" y2="17"></line>
        </svg>
      </button>
    `;
    
    container.appendChild(newRow);
    
    // Bind delete event to the new button
    const deleteBtn = newRow.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => removeInputRow(newRow.id));
    
    updateRowNumbers();
  });
}

function removeInputRow(rowId) {
  const row = document.getElementById(rowId);
  if (row) {
    row.remove();
    updateRowNumbers();
  }
}

// Re-index row indicators and update visibility of delete buttons
function updateRowNumbers() {
  const container = document.getElementById('inputs-container');
  const rows = container.querySelectorAll('.input-item');
  
  rows.forEach((row, idx) => {
    const num = idx + 1;
    row.querySelector('.input-number').textContent = num;
    row.querySelector('input').setAttribute('aria-label', `YouTube URL ${num}`);
    
    const deleteBtn = row.querySelector('.delete-btn');
    deleteBtn.setAttribute('aria-label', `Remove URL ${num}`);
    
    // Hide delete button if there's only 1 row left
    if (rows.length === 1) {
      deleteBtn.style.display = 'none';
    } else {
      deleteBtn.style.display = 'flex';
    }
  });
  
  // Re-sync inputCount to current list length
  inputCount = rows.length;
}

/**
 * 4. Parse YouTube Video ID from standard and non-standard URL formats
 */
function extractYoutubeId(url) {
  url = url.trim();
  
  // Direct 11-char ID matching
  if (url.length === 11 && !url.includes('/') && !url.includes('.')) {
    return url;
  }
  
  // Standard Youtube URL parsing regex
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  
  return (match && match[2].length === 11) ? match[2] : null;
}

/**
 * 5. Initialize/Rebuild Stream Grid on Form Submission
 */
function initFormSubmit() {
  const form = document.getElementById('stream-builder-form');
  const gridContainer = document.getElementById('grid-container');
  const emptyState = document.getElementById('empty-state');
  const badge = document.getElementById('workspace-badge');

  if (!form || !gridContainer || !emptyState) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Ensure YouTube API is fully initialized
    if (!ytApiLoaded) {
      alert("YouTube player library is still loading. Please try again in a second.");
      return;
    }

    // Clean up existing players
    destroyActivePlayers();

    // Collect all values
    const inputs = document.querySelectorAll('.url-input');
    const videoIds = [];
    
    inputs.forEach(input => {
      const val = input.value.trim();
      if (val) {
        const videoId = extractYoutubeId(val);
        if (videoId) {
          videoIds.push(videoId);
        } else {
          // Visual warning for invalid inputs
          input.style.borderColor = 'var(--color-danger)';
          setTimeout(() => {
            input.style.borderColor = '';
          }, 3000);
        }
      }
    });

    if (videoIds.length === 0) {
      alert("Please enter at least one valid YouTube URL or 11-character Video ID.");
      return;
    }

    // Hide empty state and show grid
    emptyState.style.display = 'none';
    gridContainer.style.display = 'grid';
    badge.textContent = `${videoIds.length} Stream${videoIds.length > 1 ? 's' : ''}`;

    // Adjust grid column classes depending on count
    gridContainer.className = 'stream-grid';
    if (videoIds.length === 1) {
      gridContainer.classList.add('cols-1');
    } else if (videoIds.length === 2) {
      gridContainer.classList.add('cols-2');
    }

    // Retrieve global mute state
    const muteCheckbox = document.getElementById('global-mute-checkbox');
    const startMuted = muteCheckbox ? muteCheckbox.checked : false;

    // Build player DOM elements and instantiate YT.Player
    videoIds.forEach((id, index) => {
      const playerId = `yt-player-${index}`;
      
      // Create wrapper element
      const wrapper = document.createElement('div');
      wrapper.className = 'video-wrapper';
      
      const playerDiv = document.createElement('div');
      playerDiv.id = playerId;
      
      wrapper.appendChild(playerDiv);
      gridContainer.appendChild(wrapper);

      // Create new YT.Player
      const player = new YT.Player(playerId, {
        videoId: id,
        playerVars: {
          'autoplay': 1,
          'mute': startMuted ? 1 : 0,
          'controls': 1,
          'rel': 0,
          'modestbranding': 1
        },
        events: {
          'onReady': (event) => {
            // Auto play on load (modern browsers require mute if autoplaying)
            event.target.playVideo();
          }
        }
      });

      activePlayers.push(player);
    });

    // Smooth scroll to workspace
    document.getElementById('stream-workspace').scrollIntoView({ behavior: 'smooth' });
  });
}

// Clean up player instances to prevent leaks and blank wrappers
function destroyActivePlayers() {
  activePlayers.forEach(player => {
    try {
      if (player && typeof player.destroy === 'function') {
        player.destroy();
      }
    } catch (err) {
      console.error("Error destroying YT player instance:", err);
    }
  });
  
  activePlayers = [];
  
  const gridContainer = document.getElementById('grid-container');
  if (gridContainer) {
    gridContainer.innerHTML = '';
  }
}

/**
 * 6. Global Mute Synchronizer
 */
function initMuteSync() {
  const muteCheckbox = document.getElementById('global-mute-checkbox');
  if (!muteCheckbox) return;

  muteCheckbox.addEventListener('change', () => {
    const isMuted = muteCheckbox.checked;
    
    activePlayers.forEach(player => {
      try {
        if (player && typeof player.mute === 'function') {
          if (isMuted) {
            player.mute();
          } else {
            player.unMute();
          }
        }
      } catch (err) {
        console.error("Failed to toggle player mute state:", err);
      }
    });
  });
}
