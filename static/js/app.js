

document.addEventListener('DOMContentLoaded', () => {
  window.ui = new UI();
  
  window.notesManager = new NotesManager();
  
  window.whiteboard = new Whiteboard();
  
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
