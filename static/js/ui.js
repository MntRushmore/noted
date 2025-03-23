

class UI {
  constructor() {
    this.settings = Utils.loadFromLocalStorage('settings', {
      theme: 'light',
      fontSize: 14,
      autoSave: true
    });
    
    this.setupEventListeners();
    this.applySettings();
  }

  applySettings() {
    document.body.classList.remove('dark-mode', 'sepia-mode');
    if (this.settings.theme === 'dark') {
      document.body.classList.add('dark-mode');
    } else if (this.settings.theme === 'sepia') {
      document.body.classList.add('sepia-mode');
    }
    
    document.documentElement.style.setProperty('--note-font-size', `${this.settings.fontSize}px`);
    
    document.getElementById('font-size').value = this.settings.fontSize;
    document.getElementById('font-size-value').textContent = `${this.settings.fontSize}px`;
    document.getElementById('auto-save').checked = this.settings.autoSave;
    
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-theme') === this.settings.theme);
    });
  }
  

  saveSettings() {
    Utils.saveToLocalStorage('settings', this.settings);
    this.applySettings();
  }

  showModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'flex';
  }
  

  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'none';
  }
  

  toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('show');
  }
  

  toggleDarkMode() {
    if (this.settings.theme === 'dark') {
      this.settings.theme = 'light';
    } else {
      this.settings.theme = 'dark';
    }
    this.saveSettings();
  }
  

  setupEventListeners() {
    document.getElementById('btn-dark-mode').addEventListener('click', () => {
      this.toggleDarkMode();
    });
    
    document.getElementById('btn-settings').addEventListener('click', () => {
      this.showModal('settings-modal');
    });
    
    document.getElementById('btn-export').addEventListener('click', () => {
      this.showModal('export-modal');
    });
    
    document.querySelectorAll('.close-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.closest('.modal').style.display = 'none';
      });
    });
    
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.style.display = 'none';
        }
      });
    });
    
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.settings.theme = btn.getAttribute('data-theme');
        this.saveSettings();
      });
    });
    
    document.getElementById('font-size').addEventListener('input', (e) => {
      this.settings.fontSize = parseInt(e.target.value);
      document.getElementById('font-size-value').textContent = `${this.settings.fontSize}px`;
      this.saveSettings();
    });
    
    document.getElementById('auto-save').addEventListener('change', (e) => {
      this.settings.autoSave = e.target.checked;
      this.saveSettings();
    });
    
    document.getElementById('btn-change-bg').addEventListener('click', () => {
      const backgrounds = [
        'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #fdfcfb 0%, #e2d1c3 100%)',
        'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)',
        'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)'
      ];
      
      const currentBg = document.body.style.background;
      let nextBg = backgrounds[0];
      
      for (let i = 0; i < backgrounds.length; i++) {
        if (currentBg === backgrounds[i] && i < backgrounds.length - 1) {
          nextBg = backgrounds[i + 1];
          break;
        }
      }
      
      document.body.style.background = nextBg;
    });
    
    document.getElementById('btn-whiteboard').addEventListener('click', () => {
      if (window.whiteboard) {
        window.whiteboard.toggle();
      }
    });
  }
}
