// Sound URLs (using data URLs for built-in sounds)
const SOUNDS = {
  bell: 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg',
  chime: 'https://actions.google.com/sounds/v1/alarms/chiming_clock.ogg',
  beep: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg',
  ding: 'https://actions.google.com/sounds/v1/tools/ring.ogg'
};

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'showContent') {
    showFullPageContent(request.content);
  } else if (request.action === 'showMusicAlarm') {
    showMusicAlarm(request.sound, request.volume, request.content);
  } else if (request.action === 'playSound') {
    playSound(request.sound, request.volume);
  }
});

function showFullPageContent(content) {
  // Check if overlay already exists
  if (document.getElementById('content-reminder-overlay')) {
    return;
  }
  
  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'content-reminder-overlay';
  overlay.className = 'content-reminder-overlay';
  
  // Create content container
  const container = document.createElement('div');
  container.className = 'content-reminder-container';
  
  // Create content display
  const contentDiv = document.createElement('div');
  contentDiv.className = 'content-reminder-content';
  contentDiv.textContent = content;
  
  // Create close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'content-reminder-close';
  closeBtn.textContent = '✕';
  closeBtn.onclick = () => {
    overlay.remove();
  };
  
  // Assemble elements
  container.appendChild(closeBtn);
  container.appendChild(contentDiv);
  overlay.appendChild(container);
  
  // Add to page
  document.body.appendChild(overlay);
  
  // Auto-close after 10 seconds
  setTimeout(() => {
    if (overlay.parentNode) {
      overlay.remove();
    }
  }, 10000);
}

function showMusicAlarm(sound, volume, content) {
  // Check if overlay already exists
  if (document.getElementById('content-reminder-overlay')) {
    return;
  }
  
  // Play sound
  playSound(sound, volume);
  
  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'content-reminder-overlay';
  overlay.className = 'content-reminder-overlay music-alarm';
  
  // Create content container
  const container = document.createElement('div');
  container.className = 'content-reminder-container music-alarm-container';
  
  // Create alarm icon
  const icon = document.createElement('div');
  icon.className = 'music-alarm-icon';
  icon.textContent = '⏰';
  
  // Create content display
  const contentDiv = document.createElement('div');
  contentDiv.className = 'content-reminder-content music-alarm-text';
  contentDiv.textContent = content || 'Time for a break!';
  
  // Create subtitle
  const subtitle = document.createElement('div');
  subtitle.className = 'music-alarm-subtitle';
  subtitle.textContent = 'Take a moment to rest';
  
  // Create close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'content-reminder-close';
  closeBtn.textContent = '✕';
  closeBtn.onclick = () => {
    overlay.remove();
  };
  
  // Assemble elements
  container.appendChild(closeBtn);
  container.appendChild(icon);
  container.appendChild(contentDiv);
  container.appendChild(subtitle);
  overlay.appendChild(container);
  
  // Add to page
  document.body.appendChild(overlay);
  
  // Auto-close after 15 seconds
  setTimeout(() => {
    if (overlay.parentNode) {
      overlay.remove();
    }
  }, 15000);
}

function playSound(sound, volume) {
  const audio = new Audio(SOUNDS[sound] || SOUNDS.bell);
  audio.volume = (volume || 50) / 100;
  audio.play().catch(err => {
    console.log('Could not play sound:', err);
  });
}