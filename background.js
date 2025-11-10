let lastShownIndex = -1;

// Initialize on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['frequency', 'intervalEnabled', 'musicFrequency', 'musicEnabled'], (result) => {
    if (result.intervalEnabled) {
      createIntervalAlarm(result.frequency || 15);
    }
    if (result.musicEnabled) {
      createMusicAlarm(result.musicFrequency || 15);
    }
  });
});

// Listen for alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'intervalReminder') {
    chrome.storage.sync.get(['intervalEnabled', 'contents', 'selectedContents'], (result) => {
      if (result.intervalEnabled && result.contents && result.selectedContents && result.selectedContents.length > 0) {
        const selectedContents = result.selectedContents.map(i => result.contents[i]);
        showRandomContent(selectedContents);
      }
    });
  } else if (alarm.name === 'musicAlarm') {
    chrome.storage.sync.get(['musicEnabled', 'musicSound', 'musicVolume', 'contents', 'selectedMusicContents'], (result) => {
      if (result.musicEnabled && result.contents && result.selectedMusicContents && result.selectedMusicContents.length > 0) {
        const selectedContents = result.selectedMusicContents.map(i => result.contents[i]);
        const content = selectedContents[Math.floor(Math.random() * selectedContents.length)];
        showMusicAlarm(result.musicSound || 'bell', result.musicVolume || 50, content);
      }
    });
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateInterval') {
    if (request.enabled) {
      createIntervalAlarm(request.frequency);
    } else {
      chrome.alarms.clear('intervalReminder');
    }
    sendResponse({success: true});
  } else if (request.action === 'updateMusic') {
    if (request.enabled) {
      createMusicAlarm(request.frequency);
    } else {
      chrome.alarms.clear('musicAlarm');
    }
    sendResponse({success: true});
  }
  return true;
});

function createIntervalAlarm(frequency) {
  chrome.alarms.clear('intervalReminder', () => {
    chrome.alarms.create('intervalReminder', {
      periodInMinutes: frequency
    });
    console.log(`Interval alarm set for every ${frequency} minutes`);
  });
}

function createMusicAlarm(frequency) {
  chrome.alarms.clear('musicAlarm', () => {
    chrome.alarms.create('musicAlarm', {
      periodInMinutes: frequency
    });
    console.log(`Music alarm set for every ${frequency} minutes`);
  });
}

function showRandomContent(contents) {
  let index;
  if (contents.length === 1) {
    index = 0;
  } else {
    do {
      index = Math.floor(Math.random() * contents.length);
    } while (index === lastShownIndex && contents.length > 1);
  }
  
  lastShownIndex = index;
  const content = contents[index];
  
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs[0] && tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'showContent',
        content: content
      }).catch(err => {
        console.log('Could not send message to tab:', err);
      });
    }
  });
}

function showMusicAlarm(sound, volume, content) {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs[0] && tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'showMusicAlarm',
        sound: sound,
        volume: volume,
        content: content
      }).catch(err => {
        console.log('Could not send message to tab:', err);
      });
    }
  });
}