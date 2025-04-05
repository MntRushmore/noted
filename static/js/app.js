import { setupLofiToggle } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
  window.ui = new UI();
  
  window.notesManager = new NotesManager();
  
  window.whiteboard = new Whiteboard();
  
  const audioElement = document.createElement('audio');
  audioElement.id = 'lofi-audio';
  audioElement.loop = true;

  const sourceElement = document.createElement('source');
  sourceElement.src = 'https://hc-cdn.hel1.your-objectstorage.com/s/v3/1c817202765e802612863946545206cfc4c0883d_tarot_music_audio.mp4';
  sourceElement.type = 'audio/mpeg';

  audioElement.appendChild(sourceElement);
  document.body.appendChild(audioElement);

  const toggleButton = document.createElement('button');
  toggleButton.id = 'lofi-toggle';
  toggleButton.innerText = '🎵';
  toggleButton.style.position = 'fixed';
  toggleButton.style.bottom = '20px';
  toggleButton.style.right = '20px';
  toggleButton.style.zIndex = '9999';
  toggleButton.style.backgroundColor = '#fff';
  toggleButton.style.border = 'none';
  toggleButton.style.borderRadius = '50%';
  toggleButton.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
  toggleButton.style.padding = '12px';
  toggleButton.style.cursor = 'pointer';

  document.body.appendChild(toggleButton);
  
  setupLofiToggle();
  
  setTimeout(() => {
    Utils.showToast('Welcome to Noted! Create and organize your notes.');
  }, 1000);
  
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      window.notesManager.saveNotes();
      Utils.showToast('All notes saved');
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      document.getElementById('new-note-title').focus();
    }
    
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
      });
      
      if (document.getElementById('canvas-container').style.display === 'block') {
        window.whiteboard.toggle();
      }
    }
  });
});
