
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
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
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
    
    filteredNotes.forEach(note => {
      this.renderNote(note);
    });
  }
  

  renderNote(note) {
    const noteClone = this.noteTemplate.content.cloneNode(true);
    const noteElement = noteClone.querySelector('.note');
    
    noteElement.id = note.id;
    noteElement.style.backgroundColor = note.color || '#fff9b1';
    
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
    
    const dragHandle = noteElement.querySelector('.note-drag-handle');
    dragHandle.addEventListener('mousedown', this.startDrag.bind(this));
    
    const deleteButton = noteElement.querySelector('.delete-note');
    deleteButton.addEventListener('click', () => this.deleteNote(note.id));
    
    titleElement.addEventListener('input', Utils.debounce(() => {
      this.updateNoteContent(note.id, 'title', titleElement.textContent);
    }, 500));
    
    contentElement.addEventListener('input', Utils.debounce(() => {
      this.updateNoteContent(note.id, 'text', contentElement.textContent);
    }, 500));
    
    const colorButton = noteElement.querySelector('.change-color');
    colorButton.addEventListener('click', () => {
      const newColor = Utils.getRandomPastelColor();
      noteElement.style.backgroundColor = newColor;
      this.updateNoteContent(note.id, 'color', newColor);
    });
    
    const pinButton = noteElement.querySelector('.pin-note');
    if (note.pinned) {
      pinButton.classList.add('active');
      noteElement.style.boxShadow = '0 0 0 3px var(--primary-color)';
    }
    
    pinButton.addEventListener('click', () => {
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
    
    this.initialX = e.clientX;
    this.initialY = e.clientY;
    
    const rect = noteElement.getBoundingClientRect();
    this.initialNoteX = rect.left;
    this.initialNoteY = rect.top;
    
    noteElement.classList.add('dragging');
    noteElement.style.zIndex = '1000';
    
    document.addEventListener('mousemove', this.dragMove.bind(this));
    document.addEventListener('mouseup', this.stopDrag.bind(this));
  }
  

  dragMove(e) {
    if (!this.isDragging || !this.dragNote) return;
    
    requestAnimationFrame(() => {
      const dx = e.clientX - this.initialX;
      const dy = e.clientY - this.initialY;
      
      this.dragNote.style.position = 'absolute';
      this.dragNote.style.left = `${this.initialNoteX + dx}px`;
      this.dragNote.style.top = `${this.initialNoteY + dy}px`;
    });
  }
  

  stopDrag() {
    if (!this.isDragging || !this.dragNote) return;
    
    this.dragNote.classList.remove('dragging');
    
    this.dragNote.style.zIndex = '1';
    
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
    
    document.removeEventListener('mousemove', this.dragMove.bind(this));
    document.removeEventListener('mouseup', this.stopDrag.bind(this));
  }
  
  createNote(title, text, category = 'none', color = '#fff9b1') {
    const newNote = {
      id: Utils.generateId(),
      title,
      text,
      category,
      color,
      date: new Date(),
      position: {
        left: `${Math.random() * (window.innerWidth - 300)}px`,
        top: `${Math.random() * (window.innerHeight - 300)}px`
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
    });
    
    document.getElementById('btn-list-view').addEventListener('click', () => {
      document.querySelector('.notes-area').classList.add('view-list');
    });
  }
}
