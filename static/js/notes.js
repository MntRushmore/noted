
class NotesManager {
  constructor() {
    this.notes = [];
    this.categories = ['Work', 'Personal', 'Other'];
    this.currentCategory = 'all';
    this.container = document.getElementById('notes-container');
    this.noteTemplate = document.getElementById('note-template');
    this.isDragging = false;
    this.dragNote = null;
    this.initialX = 0;
    this.initialY = 0;
    this.initialNoteX = 0;
    this.initialNoteY = 0;
    this.offsetX = 0;
    this.offsetY = 0;
    this.dragMove = this.dragMove.bind(this);
    this.stopDrag = this.stopDrag.bind(this);
    this.touchStart = this.touchStart.bind(this);
    this.touchMove = this.touchMove.bind(this);
    this.touchEnd = this.touchEnd.bind(this);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const titleInput = document.getElementById('new-note-title');
        const textInput = document.getElementById('new-note');
        const categorySelect = document.getElementById('note-category');
        const colorInput = document.getElementById('note-color');
        
        const title = titleInput.value.trim();
        const text = textInput.value.trim();
        
        if (title === '' && text === '') {
          Utils.showToast('Please enter a title or text for your note');
          return;
        }
        
        this.createNote(
          title, 
          text, 
          categorySelect.value, 
          colorInput.value
        );
        
        titleInput.value = '';
        textInput.value = '';
        
        Utils.showToast('Note added');
      }
    });
      
    
    this.loadNotes();
    this.setupEventListeners();
  }
  

  loadNotes() {
    this.notes = Utils.loadFromLocalStorage('notes', []);
    this.renderNotes();
  }
  

  saveNotes() {
    Utils.saveToLocalStorage('notes', this.notes);
  }
  

  renderNotes() {
    this.container.innerHTML = '';
    
    const filteredNotes = this.currentCategory === 'all' 
      ? this.notes 
      : this.notes.filter(note => note.category === this.currentCategory);
    
    // Sort by z-index or pinned status to maintain proper layering
    const sortedNotes = [...filteredNotes].sort((a, b) => {
      // Pinned notes should appear on top
      if (a.pinned && !b.pinned) return 1;
      if (!a.pinned && b.pinned) return -1;
      return 0;
    });
    
    sortedNotes.forEach(note => {
      this.renderNote(note);
    });
    
    // If in grid view, reset position to relative for proper layout
    if (document.querySelector('.notes-area').classList.contains('view-list')) {
      document.querySelectorAll('.note').forEach(note => {
        note.style.position = 'relative';
        note.style.left = 'auto';
        note.style.top = 'auto';
      });
    }
  }
  

  renderNote(note) {
    const noteClone = this.noteTemplate.content.cloneNode(true);
    const noteElement = noteClone.querySelector('.note');
    
    noteElement.id = note.id;
    noteElement.style.backgroundColor = note.color || '#fff9b1';
    
    // Apply saved position if available
    if (note.position) {
      noteElement.style.position = 'absolute';
      noteElement.style.left = note.position.left;
      noteElement.style.top = note.position.top;
      noteElement.style.zIndex = '5';
    }
    
    const titleElement = noteElement.querySelector('.note-title');
    titleElement.textContent = note.title || '';
    
    const contentElement = noteElement.querySelector('.note-content');
    contentElement.textContent = note.text || '';
    
    const dateElement = noteElement.querySelector('.note-date');
    dateElement.textContent = Utils.formatDate(note.date);
    
    const categoryElement = noteElement.querySelector('.note-category');
    if (note.category && note.category !== 'none') {
      categoryElement.textContent = note.category;
    } else {
      categoryElement.style.display = 'none';
    }
    
    // Make entire note draggable, not just the handle with mouse and touch
    noteElement.addEventListener('mousedown', this.startDrag.bind(this));
    noteElement.addEventListener('touchstart', this.touchStart.bind(this), { passive: false });
    
    // Add a specific handle for better UX
    const dragHandle = noteElement.querySelector('.note-drag-handle');
    dragHandle.addEventListener('mousedown', this.startDrag.bind(this));
    dragHandle.addEventListener('touchstart', this.touchStart.bind(this), { passive: false });
    
    const deleteButton = noteElement.querySelector('.delete-note');
    deleteButton.addEventListener('click', () => this.deleteNote(note.id));
    
    titleElement.addEventListener('mousedown', (e) => e.stopPropagation());
    contentElement.addEventListener('mousedown', (e) => e.stopPropagation());
    
    titleElement.addEventListener('input', Utils.debounce(() => {
      this.updateNoteContent(note.id, 'title', titleElement.textContent);
    }, 500));
    
    contentElement.addEventListener('input', Utils.debounce(() => {
      this.updateNoteContent(note.id, 'text', contentElement.textContent);
    }, 500));
    
    const colorButton = noteElement.querySelector('.change-color');
    colorButton.addEventListener('click', (e) => {
      e.stopPropagation();
      const newColor = Utils.getRandomPastelColor();
      noteElement.style.backgroundColor = newColor;
      this.updateNoteContent(note.id, 'color', newColor);
    });
    
    const pinButton = noteElement.querySelector('.pin-note');
    if (note.pinned) {
      pinButton.classList.add('active');
      noteElement.style.boxShadow = '0 0 0 3px var(--primary-color)';
    }
    
    pinButton.addEventListener('click', (e) => {
      e.stopPropagation();
      const isPinned = this.togglePinNote(note.id);
      pinButton.classList.toggle('active', isPinned);
      noteElement.style.boxShadow = isPinned ? 
        '0 0 0 3px var(--primary-color)' : '';
    });
    
    this.container.appendChild(noteElement);
  }

  startDrag(e) {
    const noteElement = e.target.closest('.note');
    if (!noteElement) return;
    
    e.preventDefault();
    this.isDragging = true;
    this.dragNote = noteElement;
    
    const rect = noteElement.getBoundingClientRect();
    const notesArea = document.querySelector('.notes-area');
    
    // Calculate offset from the mouse to the top-left corner of the note
    this.offsetX = e.clientX - rect.left;
    this.offsetY = e.clientY - rect.top;
    
    // If note isn't absolutely positioned yet, position it properly
    if (noteElement.style.position !== 'absolute') {
      noteElement.style.position = 'absolute';
      noteElement.style.width = `${rect.width}px`;
      noteElement.style.left = `${rect.left + notesArea.scrollLeft}px`;
      noteElement.style.top = `${rect.top + notesArea.scrollTop}px`;
    }
    
    noteElement.classList.add('dragging');
    noteElement.style.zIndex = '1000';
    
    document.addEventListener('mousemove', this.dragMove);
    document.addEventListener('mouseup', this.stopDrag);
  }
  
  dragMove(e) {
    if (!this.isDragging || !this.dragNote) return;
    
    // Calculate new position based on current mouse position
    const notesArea = document.querySelector('.notes-area');
    const scrollLeft = notesArea.scrollLeft;
    const scrollTop = notesArea.scrollTop;
    
    requestAnimationFrame(() => {
      // Update note position directly using the mouse position and offset
      this.dragNote.style.left = `${e.clientX - this.offsetX + scrollLeft}px`;
      this.dragNote.style.top = `${e.clientY - this.offsetY + scrollTop}px`;
    });
  }
  
  stopDrag() {
    if (!this.isDragging || !this.dragNote) return;
    
    this.dragNote.classList.remove('dragging');
    
    // Keep elevated z-index for a moment to ensure it stays on top if notes overlap
    setTimeout(() => {
      this.dragNote.style.zIndex = '5';
    }, 200);
    
    const noteId = this.dragNote.id;
    const noteIndex = this.notes.findIndex(note => note.id === noteId);
    
    if (noteIndex !== -1) {
      this.notes[noteIndex].position = {
        left: this.dragNote.style.left,
        top: this.dragNote.style.top
      };
      
      this.saveNotes();
    }
    
    this.isDragging = false;
    this.dragNote = null;
    
    document.removeEventListener('mousemove', this.dragMove);
    document.removeEventListener('mouseup', this.stopDrag);
    document.removeEventListener('touchmove', this.touchMove);
    document.removeEventListener('touchend', this.touchEnd);
  }
  
  // Touch event handlers
  touchStart(e) {
    const noteElement = e.target.closest('.note');
    if (!noteElement) return;
    
    // Prevent default to avoid scrolling while dragging
    e.preventDefault();
    
    this.isDragging = true;
    this.dragNote = noteElement;
    
    const touch = e.touches[0];
    
    // Store initial touch position
    this.initialX = touch.clientX;
    this.initialY = touch.clientY;
    
    // Get current note position
    const notesArea = document.querySelector('.notes-area');
    const scrollLeft = notesArea.scrollLeft;
    const scrollTop = notesArea.scrollTop;
    
    // Get current note position
    const rect = noteElement.getBoundingClientRect();
    
    // Store the offset of touch point within the note
    this.offsetX = touch.clientX - rect.left;
    this.offsetY = touch.clientY - rect.top;
    
    // If note isn't absolutely positioned yet, position it properly
    if (noteElement.style.position !== 'absolute') {
      noteElement.style.position = 'absolute';
      noteElement.style.width = `${rect.width}px`;
      noteElement.style.left = `${rect.left + scrollLeft}px`;
      noteElement.style.top = `${rect.top + scrollTop}px`;
    }
    
    // Parse current position
    this.initialNoteX = parseFloat(noteElement.style.left) || rect.left + scrollLeft;
    this.initialNoteY = parseFloat(noteElement.style.top) || rect.top + scrollTop;
    
    noteElement.classList.add('dragging');
    noteElement.style.zIndex = '1000';
    
    document.addEventListener('touchmove', this.touchMove, { passive: false });
    document.addEventListener('touchend', this.touchEnd);
  }
  
  touchMove(e) {
    if (!this.isDragging || !this.dragNote) return;
    
    // Prevent default to stop scrolling
    e.preventDefault();
    
    const touch = e.touches[0];
    
    // Calculate new position based on current touch position
    const notesArea = document.querySelector('.notes-area');
    const scrollLeft = notesArea.scrollLeft;
    const scrollTop = notesArea.scrollTop;
    
    requestAnimationFrame(() => {
      // Update note position directly using the touch position and offset
      this.dragNote.style.left = `${touch.clientX - this.offsetX + scrollLeft}px`;
      this.dragNote.style.top = `${touch.clientY - this.offsetY + scrollTop}px`;
    });
  }
  
  touchEnd(e) {
    this.stopDrag();
  }
  
  createNote(title, text, category = 'none', color = '#fff9b1') {
    // Calculate a better random position within visible area
    const containerRect = this.container.getBoundingClientRect();
    const notesAreaRect = document.querySelector('.notes-area').getBoundingClientRect();
    
    // Calculate a position that's visible within the notes area
    // Also respect the current scroll position
    const scrollTop = this.container.scrollTop;
    const scrollLeft = this.container.scrollLeft;
    
    const maxWidth = notesAreaRect.width - 250; // Note width estimate
    const maxHeight = notesAreaRect.height - 250; // Note height estimate
    
    const randomLeft = Math.max(50, Math.min(maxWidth, Math.random() * maxWidth));
    const randomTop = Math.max(50, Math.min(maxHeight, Math.random() * maxHeight));
    
    const newNote = {
      id: Utils.generateId(),
      title,
      text,
      category,
      color,
      date: new Date(),
      position: {
        left: `${randomLeft + scrollLeft}px`,
        top: `${randomTop + scrollTop}px`
      },
      pinned: false
    };
    
    this.notes.push(newNote);
    this.saveNotes();
    this.renderNote(newNote);
    
    return newNote;
  }

  deleteNote(id) {
    const noteIndex = this.notes.findIndex(note => note.id === id);
    
    if (noteIndex !== -1) {
      this.notes.splice(noteIndex, 1);
      this.saveNotes();
      document.getElementById(id).remove();
      Utils.showToast('Note deleted');
    }
  }
  

  updateNoteContent(id, field, value) {
    const noteIndex = this.notes.findIndex(note => note.id === id);
    
    if (noteIndex !== -1) {
      this.notes[noteIndex][field] = value;
      this.saveNotes();
    }
  }
  

  togglePinNote(id) {
    const noteIndex = this.notes.findIndex(note => note.id === id);
    
    if (noteIndex !== -1) {
      this.notes[noteIndex].pinned = !this.notes[noteIndex].pinned;
      this.saveNotes();
      return this.notes[noteIndex].pinned;
    }
    
    return false;
  }
  

  clearAllNotes() {
    if (confirm('Are you sure you want to delete all notes?')) {
      this.notes = [];
      this.saveNotes();
      this.container.innerHTML = '';
      Utils.showToast('All notes cleared');
    }
  }
  

  filterByCategory(category) {
    this.currentCategory = category;
    this.renderNotes();
  }
  

  searchNotes(searchText) {
    const normalizedSearchText = searchText.toLowerCase();
    
    if (!normalizedSearchText) {
      this.renderNotes();
      return;
    }
    
    this.container.innerHTML = '';
    
    const filteredNotes = this.notes.filter(note => {
      const inTitle = note.title && note.title.toLowerCase().includes(normalizedSearchText);
      const inText = note.text && note.text.toLowerCase().includes(normalizedSearchText);
      return inTitle || inText;
    });
    
    filteredNotes.forEach(note => {
      this.renderNote(note);
    });
  }
  

  addCategory(categoryName) {
    if (!categoryName) return;
    
    const normalizedName = categoryName.toLowerCase().replace(/\s+/g, '-');
    
    if (this.categories.includes(normalizedName)) {
      Utils.showToast('Category already exists');
      return;
    }
    
    this.categories.push(normalizedName);
    Utils.saveToLocalStorage('categories', this.categories);
    
    this.updateCategoryList();
    Utils.showToast(`Category "${categoryName}" added`);
  }
  
  updateCategoryList() {
    const categoryList = document.getElementById('category-list');
    categoryList.innerHTML = '<li class="active" data-category="all">All Notes</li>';
    
    this.categories.forEach(category => {
      const li = document.createElement('li');
      li.textContent = category.charAt(0).toUpperCase() + category.slice(1);
      li.setAttribute('data-category', category);
      li.addEventListener('click', () => {
        document.querySelectorAll('#category-list li').forEach(item => {
          item.classList.remove('active');
        });
        li.classList.add('active');
        this.filterByCategory(category);
      });
      categoryList.appendChild(li);
    });
  }
  

  exportNotes(format) {
    switch (format) {
      case 'json':
        Utils.exportFile(
          'noted_it_notes.json', 
          JSON.stringify(this.notes, null, 2), 
          'application/json'
        );
        break;
      case 'txt':
        let txtContent = '';
        this.notes.forEach(note => {
          txtContent += `Title: ${note.title || 'Untitled'}\n`;
          txtContent += `Date: ${new Date(note.date).toLocaleString()}\n`;
          txtContent += `Category: ${note.category || 'None'}\n\n`;
          txtContent += `${note.text || ''}\n\n`;
          txtContent += '------------------------\n\n';
        });
        Utils.exportFile('noted_it_notes.txt', txtContent, 'text/plain');
        break;
      case 'html':
        let htmlContent = `<!DOCTYPE html>
        <html>
        <head>
          <title>Noted.it Export</title>
          <style>
            body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .note { background: #fffacd; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
            .note-title { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
            .note-meta { color: #666; font-size: 12px; margin-bottom: 10px; }
            .note-content { white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <h1>Noted.it Notes Export</h1>
          <p>Exported on ${new Date().toLocaleString()}</p>
        `;
        
        this.notes.forEach(note => {
          htmlContent += `
          <div class="note" style="background-color: ${note.color || '#fff9b1'}">
            <div class="note-title">${Utils.escapeHtml(note.title || 'Untitled')}</div>
            <div class="note-meta">
              Date: ${new Date(note.date).toLocaleString()}<br>
              Category: ${note.category || 'None'}
            </div>
            <div class="note-content">${Utils.escapeHtml(note.text || '')}</div>
          </div>
          `;
        });
        
        htmlContent += `
        </body>
        </html>`;
        
        Utils.exportFile('noted_it_notes.html', htmlContent, 'text/html');
        break;
    }
    
    Utils.showToast(`Notes exported as ${format.toUpperCase()}`);
  }
  
  setupEventListeners() {
    document.getElementById('add-note-btn').addEventListener('click', () => {
      const titleInput = document.getElementById('new-note-title');
      const textInput = document.getElementById('new-note');
      const categorySelect = document.getElementById('note-category');
      const colorInput = document.getElementById('note-color');
      
      const title = titleInput.value.trim();
      const text = textInput.value.trim();
      
      if (title === '' && text === '') {
        Utils.showToast('Please enter a title or text for your note');
        return;
      }
      
      this.createNote(
        title, 
        text, 
        categorySelect.value, 
        colorInput.value
      );
      
      titleInput.value = '';
      textInput.value = '';
      
      Utils.showToast('Note added');
    });
    
    const searchInput = document.getElementById('search-notes');
    searchInput.addEventListener('input', Utils.debounce(() => {
      this.searchNotes(searchInput.value);
    }, 300));
    
    document.getElementById('btn-clear-all').addEventListener('click', () => {
      this.clearAllNotes();
    });
    
    document.getElementById('add-category').addEventListener('click', () => {
      const categoryName = prompt('Enter new category name:');
      if (categoryName) {
        this.addCategory(categoryName);
      }
    });
    
    document.querySelectorAll('#category-list li').forEach(item => {
      item.addEventListener('click', () => {
        document.querySelectorAll('#category-list li').forEach(li => {
          li.classList.remove('active');
        });
        item.classList.add('active');
        this.filterByCategory(item.getAttribute('data-category'));
      });
    });
    
    document.querySelectorAll('.export-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const format = btn.getAttribute('data-format');
        this.exportNotes(format);
        document.getElementById('export-modal').style.display = 'none';
      });
    });
    
    document.getElementById('btn-grid-view').addEventListener('click', () => {
      document.querySelector('.notes-area').classList.remove('view-list');
      // Restore absolute positioning when switching back to grid view
      document.querySelectorAll('.note').forEach(note => {
        const noteId = note.id;
        const noteData = this.notes.find(n => n.id === noteId);
        if (noteData && noteData.position) {
          note.style.position = 'absolute';
          note.style.left = noteData.position.left;
          note.style.top = noteData.position.top;
        }
      });
    });
    
    document.getElementById('btn-list-view').addEventListener('click', () => {
      document.querySelector('.notes-area').classList.add('view-list');
      // Switch to relative positioning in list view
      document.querySelectorAll('.note').forEach(note => {
        note.style.position = 'relative';
        note.style.left = 'auto';
        note.style.top = 'auto';
      });
    });
  }
}
