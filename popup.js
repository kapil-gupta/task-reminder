// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const tabName = tab.dataset.tab;
    
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    tab.classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
  });
});

// Load saved settings
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  loadContents();
  loadIntervalContentSelect();
  loadMusicContentSelect();
});

function loadSettings() {
  chrome.storage.sync.get([
    'frequency', 
    'intervalEnabled', 
    'selectedContents',
    'musicFrequency',
    'musicEnabled',
    'musicSound',
    'musicVolume',
    'selectedMusicContents'
  ], (result) => {
    document.getElementById('frequency').value = result.frequency || '15';
    document.getElementById('interval-enabled').checked = result.intervalEnabled || false;
    
    document.getElementById('music-frequency').value = result.musicFrequency || '15';
    document.getElementById('music-enabled').checked = result.musicEnabled || false;
    document.getElementById('music-volume').value = result.musicVolume || 50;
    
    const soundValue = result.musicSound || 'bell';
    document.getElementById(`sound-${soundValue}`).checked = true;
  });
}

function loadIntervalContentSelect() {
  chrome.storage.sync.get(['contents', 'selectedContents'], (result) => {
    const contents = result.contents || [];
    const selected = result.selectedContents || [];
    const selectDiv = document.getElementById('interval-content-select');
    
    if (contents.length === 0) {
      selectDiv.innerHTML = '<p style="color: #999; font-size: 13px; text-align: center;">Add content first</p>';
      return;
    }
    
    selectDiv.innerHTML = contents.map((content, index) => `
      <div class="content-checkbox-item">
        <input type="checkbox" id="select-${index}" value="${index}" ${selected.includes(index) ? 'checked' : ''}>
        <label for="select-${index}">${content}</label>
      </div>
    `).join('');
  });
}

function loadMusicContentSelect() {
  chrome.storage.sync.get(['contents', 'selectedMusicContents'], (result) => {
    const contents = result.contents || [];
    const selected = result.selectedMusicContents || [];
    const selectDiv = document.getElementById('music-content-select');
    
    if (contents.length === 0) {
      selectDiv.innerHTML = '<p style="color: #999; font-size: 13px; text-align: center;">Add content first</p>';
      return;
    }
    
    selectDiv.innerHTML = contents.map((content, index) => `
      <div class="content-checkbox-item">
        <input type="checkbox" id="music-select-${index}" value="${index}" ${selected.includes(index) ? 'checked' : ''}>
        <label for="music-select-${index}">${content}</label>
      </div>
    `).join('');
  });
}

function loadContents() {
  chrome.storage.sync.get(['contents'], (result) => {
    const contents = result.contents || [];
    const listDiv = document.getElementById('content-list');
    
    if (contents.length === 0) {
      listDiv.innerHTML = '<p style="color: #999; font-size: 13px; text-align: center;">No content saved yet</p>';
      return;
    }
    
    listDiv.innerHTML = contents.map((content, index) => `
      <div class="content-item">
        <div class="content-text" title="${content.replace(/"/g, '&quot;')}">${content}</div>
        <div class="content-actions">
          <button class="small-btn secondary-btn edit-content" data-index="${index}">Edit</button>
          <button class="small-btn danger-btn delete-content" data-index="${index}">Delete</button>
        </div>
      </div>
    `).join('');
    
    // Add event listeners
    document.querySelectorAll('.edit-content').forEach(btn => {
      btn.addEventListener('click', () => editContent(parseInt(btn.dataset.index)));
    });
    
    document.querySelectorAll('.delete-content').forEach(btn => {
      btn.addEventListener('click', () => deleteContent(parseInt(btn.dataset.index)));
    });
    
    // Reload interval content select
    loadIntervalContentSelect();
    loadMusicContentSelect();
  });
}

// Add content
document.getElementById('add-content').addEventListener('click', () => {
  const content = document.getElementById('new-content').value.trim();
  
  if (!content) {
    showStatus('Please enter some content', 'error');
    return;
  }
  
  chrome.storage.sync.get(['contents'], (result) => {
    const contents = result.contents || [];
    contents.push(content);
    
    chrome.storage.sync.set({ contents }, () => {
      document.getElementById('new-content').value = '';
      loadContents();
      showStatus('Content added!', 'success');
    });
  });
});

// Delete content
function deleteContent(index) {
  chrome.storage.sync.get(['contents', 'selectedContents'], (result) => {
    const contents = result.contents || [];
    const selected = result.selectedContents || [];
    
    contents.splice(index, 1);
    
    // Update selected indices
    const newSelected = selected
      .filter(i => i !== index)
      .map(i => i > index ? i - 1 : i);
    
    chrome.storage.sync.set({ contents, selectedContents: newSelected }, () => {
      loadContents();
      showStatus('Content deleted!', 'success');
    });
  });
}

// Edit content
function editContent(index) {
  chrome.storage.sync.get(['contents'], (result) => {
    const contents = result.contents || [];
    
    // Create a modal for editing
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: white;
      padding: 20px;
      border-radius: 8px;
      width: 400px;
      max-width: 90%;
    `;
    
    const title = document.createElement('h3');
    title.textContent = 'Edit Content';
    title.style.marginTop = '0';
    
    const textarea = document.createElement('textarea');
    textarea.value = contents[index];
    textarea.style.cssText = `
      width: 100%;
      min-height: 150px;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-family: Arial, sans-serif;
      font-size: 14px;
      box-sizing: border-box;
      resize: vertical;
      margin: 10px 0;
    `;
    
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 10px;
      margin-top: 15px;
    `;
    
    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';
    saveBtn.style.cssText = `
      flex: 1;
      padding: 10px;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    `;
    saveBtn.onclick = () => {
      const newContent = textarea.value.trim();
      if (newContent) {
        contents[index] = newContent;
        chrome.storage.sync.set({ contents }, () => {
          loadContents();
          showStatus('Content updated!', 'success');
          document.body.removeChild(modal);
        });
      }
    };
    
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = `
      flex: 1;
      padding: 10px;
      background: #f44336;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    `;
    cancelBtn.onclick = () => {
      document.body.removeChild(modal);
    };
    
    buttonContainer.appendChild(saveBtn);
    buttonContainer.appendChild(cancelBtn);
    
    modalContent.appendChild(title);
    modalContent.appendChild(textarea);
    modalContent.appendChild(buttonContainer);
    modal.appendChild(modalContent);
    
    document.body.appendChild(modal);
    textarea.focus();
    
    // Close on background click
    modal.onclick = (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    };
  });
}

// Save interval settings
document.getElementById('save-interval').addEventListener('click', () => {
  const frequency = parseInt(document.getElementById('frequency').value);
  const enabled = document.getElementById('interval-enabled').checked;
  
  // Get selected contents
  const checkboxes = document.querySelectorAll('#interval-content-select input[type="checkbox"]:checked');
  const selectedContents = Array.from(checkboxes).map(cb => parseInt(cb.value));
  
  if (enabled && selectedContents.length === 0) {
    showStatus('Please select at least one content', 'error');
    return;
  }
  
  chrome.storage.sync.set({
    frequency: frequency,
    intervalEnabled: enabled,
    selectedContents: selectedContents
  }, () => {
    showStatus('Interval settings saved!', 'success');
    
    chrome.runtime.sendMessage({
      action: 'updateInterval',
      frequency: frequency,
      enabled: enabled
    });
  });
});

// Save music settings
document.getElementById('save-music').addEventListener('click', () => {
  const frequency = parseInt(document.getElementById('music-frequency').value);
  const enabled = document.getElementById('music-enabled').checked;
  const sound = document.querySelector('input[name="sound"]:checked').value;
  const volume = parseInt(document.getElementById('music-volume').value);
  
  // Get selected contents
  const checkboxes = document.querySelectorAll('#music-content-select input[type="checkbox"]:checked');
  const selectedMusicContents = Array.from(checkboxes).map(cb => parseInt(cb.value));
  
  if (enabled && selectedMusicContents.length === 0) {
    showStatus('Please select at least one content', 'error');
    return;
  }
  
  chrome.storage.sync.set({
    musicFrequency: frequency,
    musicEnabled: enabled,
    musicSound: sound,
    musicVolume: volume,
    selectedMusicContents: selectedMusicContents
  }, () => {
    showStatus('Music settings saved!', 'success');
    
    chrome.runtime.sendMessage({
      action: 'updateMusic',
      frequency: frequency,
      enabled: enabled
    });
  });
});

// Test music
document.getElementById('test-music').addEventListener('click', async () => {
  const sound = document.querySelector('input[name="sound"]:checked').value;
  const volume = parseInt(document.getElementById('music-volume').value);
  
  chrome.storage.sync.get(['contents', 'selectedMusicContents'], async (result) => {
    const contents = result.contents || [];
    const selected = result.selectedMusicContents || [];
    
    if (contents.length === 0 || selected.length === 0) {
      showStatus('Please add and select content first', 'error');
      return;
    }
    
    const selectedContents = selected.map(i => contents[i]);
    const content = selectedContents[Math.floor(Math.random() * selectedContents.length)];
    
    try {
      const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
      
      try {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'showMusicAlarm',
          sound: sound,
          volume: volume,
          content: content
        });
        showStatus('Playing sound and showing content...', 'success');
      } catch (err) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        
        await chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ['styles.css']
        });
        
        setTimeout(async () => {
          await chrome.tabs.sendMessage(tab.id, {
            action: 'showMusicAlarm',
            sound: sound,
            volume: volume,
            content: content
          });
          showStatus('Playing sound and showing content...', 'success');
        }, 100);
      }
    } catch (error) {
      showStatus('Cannot play on this page', 'error');
    }
  });
});

// Test display
document.getElementById('test').addEventListener('click', async () => {
  chrome.storage.sync.get(['contents', 'selectedContents'], async (result) => {
    const contents = result.contents || [];
    const selected = result.selectedContents || [];
    
    if (contents.length === 0) {
      showStatus('Please add some content first', 'error');
      return;
    }
    
    if (selected.length === 0) {
      showStatus('Please select content for intervals', 'error');
      return;
    }
    
    const selectedContents = selected.map(i => contents[i]);
    const content = selectedContents[Math.floor(Math.random() * selectedContents.length)];
    
    try {
      const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
      
      try {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'showContent',
          content: content
        });
        showStatus('Content displayed!', 'success');
      } catch (err) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        
        await chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ['styles.css']
        });
        
        setTimeout(async () => {
          await chrome.tabs.sendMessage(tab.id, {
            action: 'showContent',
            content: content
          });
          showStatus('Content displayed!', 'success');
        }, 100);
      }
    } catch (error) {
      showStatus('Cannot display on this page (try a regular webpage)', 'error');
    }
  });
});

function showStatus(message, type) {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  
  setTimeout(() => {
    statusDiv.className = 'status';
  }, 3000);
}