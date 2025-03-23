

class Whiteboard {
  constructor() {
    this.canvas = document.getElementById('whiteboard');
    this.ctx = this.canvas.getContext('2d');
    this.isDrawing = false;
    this.undoStack = [];
    this.currentTool = 'brush';
    this.startX = 0;
    this.startY = 0;
    
    this.initCanvas();
    this.setupEventListeners();
  }
  

  initCanvas() {
    this.resizeCanvas();
    
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    this.saveCanvasState();
    
    this.loadCanvasState();
  }
  

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  

  saveCanvasState() {
    this.undoStack.push(this.canvas.toDataURL());
    
    if (this.undoStack.length > 20) {
      this.undoStack.shift();
    }
    
    Utils.saveToLocalStorage('whiteboardState', this.undoStack);
  }
  

  loadCanvasState() {
    const savedState = Utils.loadFromLocalStorage('whiteboardState', []);
    
    if (savedState.length > 0) {
      this.undoStack = savedState;
      this.loadImageFromStack();
    }
  }
  

  loadImageFromStack() {
    if (this.undoStack.length === 0) return;
    
    const img = new Image();
    img.src = this.undoStack[this.undoStack.length - 1];
    img.onload = () => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(img, 0, 0);
    };
  }
  

  undo() {
    if (this.undoStack.length <= 1) {
      this.clearCanvas();
      return;
    }
    
    this.undoStack.pop();
    this.loadImageFromStack();
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.undoStack = [];
    this.saveCanvasState();
  }
  

  startDrawing(e) {
    this.isDrawing = true;
    
    const rect = this.canvas.getBoundingClientRect();
    this.startX = e.clientX - rect.left;
    this.startY = e.clientY - rect.top;
    
    this.ctx.beginPath();
    this.ctx.moveTo(this.startX, this.startY);
    
    if (this.currentTool === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        this.ctx.font = `${this.ctx.lineWidth * 10}px sans-serif`;
        this.ctx.fillStyle = this.ctx.strokeStyle;
        this.ctx.fillText(text, this.startX, this.startY);
        this.saveCanvasState();
      }
      this.isDrawing = false;
    }
  }
  
 
  draw(e) {
    if (!this.isDrawing) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    switch (this.currentTool) {
      case 'eraser':
        const savedColor = this.ctx.strokeStyle;
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
        this.ctx.strokeStyle = savedColor;
        break;
        
      case 'line':
        this.drawFromLastState();
        this.ctx.beginPath();
        this.ctx.moveTo(this.startX, this.startY);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
        break;
        
      case 'rectangle':
        this.drawFromLastState();
        this.ctx.beginPath();
        this.ctx.rect(
          this.startX, 
          this.startY, 
          x - this.startX, 
          y - this.startY
        );
        this.ctx.stroke();
        break;
        
      case 'circle':
        this.drawFromLastState();
        this.ctx.beginPath();
        const radius = Math.sqrt(
          Math.pow(x - this.startX, 2) + 
          Math.pow(y - this.startY, 2)
        );
        this.ctx.arc(this.startX, this.startY, radius, 0, 2 * Math.PI);
        this.ctx.stroke();
        break;
        
      default: 
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
        break;
    }
  }

  drawFromLastState() {
    if (this.undoStack.length === 0) return;
    
    const lastState = this.undoStack[this.undoStack.length - 1];
    const img = new Image();
    img.src = lastState;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(img, 0, 0);
  }
  

  stopDrawing() {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    this.saveCanvasState();
  }
  
 
  saveAsNote() {
    const dataUrl = this.canvas.toDataURL();
    
    if (window.notesManager) {
      window.notesManager.createNote(
        'Whiteboard Drawing', 
        `<img src="${dataUrl}" style="max-width: 100%;" alt="Drawing">`,
        'ideas',
        '#ffffff'
      );
      Utils.showToast('Drawing saved as note');
    }
  }
  

  toggle() {
    const container = document.getElementById('canvas-container');
    const isVisible = container.style.display === 'block';
    
    container.style.display = isVisible ? 'none' : 'block';
    
    if (!isVisible) {
      this.resizeCanvas();
      this.loadCanvasState();
    }
  }
  
 
  setupEventListeners() {
    this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
    this.canvas.addEventListener('mousemove', this.draw.bind(this));
    this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
    this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));
    
    document.getElementById('toolSelect').addEventListener('change', (e) => {
      this.currentTool = e.target.value;
    });
    
    document.getElementById('colorPicker').addEventListener('input', (e) => {
      this.ctx.strokeStyle = e.target.value;
    });
    
    document.getElementById('sizeSlider').addEventListener('input', (e) => {
      this.ctx.lineWidth = e.target.value;
    });
    
    document.getElementById('btn-undo').addEventListener('click', () => {
      this.undo();
    });
    
    document.getElementById('btn-clear-canvas').addEventListener('click', () => {
      if (confirm('Are you sure you want to clear the whiteboard?')) {
        this.clearCanvas();
      }
    });
    
    document.getElementById('btn-save-drawing').addEventListener('click', () => {
      this.saveAsNote();
    });
    
    document.getElementById('btn-close-canvas').addEventListener('click', () => {
      this.toggle();
    });
    
    window.addEventListener('resize', () => {
      if (document.getElementById('canvas-container').style.display === 'block') {
        this.resizeCanvas();
        this.loadImageFromStack();
      }
    });
  }
}
