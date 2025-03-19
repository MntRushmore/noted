// note saverrrr
window.addEventListener("load", loadNotes);

function saveNotes() {
    const notes = document.querySelectorAll(".note");
    let notesArray = [];

    notes.forEach(note => {
        notesArray.push({
            text: note.querySelector("textarea").value,
            color: note.style.backgroundColor
        });
    });

    localStorage.setItem("notes", JSON.stringify(notesArray));
}

function loadNotes() {
    const notes = JSON.parse(localStorage.getItem("notes")) || [];
    notes.forEach(note => {
        createNote(note.text, note.color);
    });
}

function createNote(text = "", color = "yellow") {
    const note = document.createElement("div");
    note.classList.add("note");
    note.style.backgroundColor = color;

    note.innerHTML = `
        <textarea>${text}</textarea>
        <button onclick="deleteNote(this)">❌</button>
    `;

    note.querySelector("textarea").addEventListener("input", saveNotes);
    document.body.appendChild(note);
    saveNotes();
}

function deleteNote(button) {
    button.parentElement.remove();
    saveNotes();
}
