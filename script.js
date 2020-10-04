try {
  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  var recognition = new SpeechRecognition();
}
catch(e) {
  console.error(e);
  $('.no-browser-support').show();
  $('.app').hide();
}


var noteTextarea = $('#note-textarea');
var instructions = $('#recording-instructions');
var notesList = $('ul#notes');

var noteContent = '';

// Get all notes from previous sessions and display them.
var notes = getAllNotes();
renderNotes(notes);

var dict = {
  Name: "",
  Age: "",
  Weight: "",
  Height: ""
};

/*-----------------------------
      Voice Recognition 
------------------------------*/

// If false, the recording will stop after a few seconds of silence.
// When true, the silence period is longer (about 15 seconds),
// allowing us to keep recording even when the user pauses. 
recognition.continuous = true;

// This block is called every time the Speech APi captures a line. 
recognition.onresult = function(event) {

  // event is a SpeechRecognitionEvent object.
  // It holds all the lines we have captured so far. 
  // We only need the current one.
  var current = event.resultIndex;

  // Get a transcript of what was said.
  var transcript = event.results[current][0].transcript;

  // Add the current transcript to the contents of our Note.
  // There is a weird bug on mobile, where everything is repeated twice.
  // There is no official solution so far so we have to handle an edge case.
  var mobileRepeatBug = (current == 1 && transcript == event.results[0][0].transcript);

  if(!mobileRepeatBug) {
    noteContent += transcript;
    noteTextarea.val(noteContent);
  }
};

recognition.onstart = function() { 
  instructions.text('Voice recognition activated. Try speaking into the microphone.');
}

recognition.onspeechend = function() {
  instructions.text('You were quiet for a while so voice recognition turned itself off.');
}

recognition.onerror = function(event) {
  if(event.error == 'no-speech') {
    instructions.text('No speech was detected. Try again.');  
  };
}



/*-----------------------------
      App buttons and input 
------------------------------*/
$('#subButton').on('click', function(e) {
  var input = document.getElementById("username").value;
  document.getElementById("user").value=input;
});

$('#sign-out').on('click', function(e) {
  window.location.href = "index.html"
});

$('#start-record-btn').on('click', function(e) {
  if (noteContent.length) {
    noteContent += ' ';
  }
  recognition.start();
});


$('#pause-record-btn').on('click', function(e) {
  recognition.stop();
  instructions.text('Voice recognition paused.');
});

// Sync the text inside the text area with the noteContent variable.
noteTextarea.on('input', function() {
  noteContent = $(this).val();
})

$('#save-note-btn').on('click', function(e) {
  recognition.stop();

  if(!noteContent.length) {
    instructions.text('Could not save empty note. Please add a message to your note.');
  }
  else {
    if (noteContent.indexOf("name is") != -1) {
      if(noteContent.indexOf(" ", noteContent.indexOf(" ", noteContent.indexOf("name is")+8)+1)!=-1)
        dict["Name"]=noteContent.substring(noteContent.indexOf("name is")+8, noteContent.indexOf(" ", noteContent.indexOf(" ", noteContent.indexOf("name is")+8)+1));
      else
        dict["Name"]=noteContent.substring(noteContent.indexOf("name is")+8);
    }
    if (noteContent.toLowerCase().indexOf("age is") != -1) {
      if(noteContent.indexOf(" ", noteContent.indexOf("age is")+7)!=-1)
        dict["Age"]=noteContent.substring(noteContent.indexOf("age is")+7, noteContent.indexOf(" ", noteContent.indexOf("age is")+7));
      else
        dict["Age"]=noteContent.substring(noteContent.indexOf("age is")+7);
    }
    if (noteContent.toLowerCase().indexOf("weight is") != -1) {
      if(noteContent.indexOf(" ", noteContent.indexOf("weight is")+10)!=-1)
        dict["Weight"]=noteContent.substring(noteContent.indexOf("weight is")+10, noteContent.indexOf(" ", noteContent.indexOf("weight is")+10));
      else
        dict["Weight"]=noteContent.substring(noteContent.indexOf("weight is")+10);
    }
    if (noteContent.toLowerCase().indexOf("height is") != -1) {
      if(noteContent.indexOf(" ", noteContent.indexOf("height is")+10)!=-1)
        dict["Height"]=noteContent.substring(noteContent.indexOf("height is")+10, noteContent.indexOf(" ", noteContent.indexOf("height is")+10));
      else
        dict["Height"]=noteContent.substring(noteContent.indexOf("height is")+10);
    }

    noteContent = "Name: " + dict["Name"] + " \| Age: " + dict["Age"] + " \| Weight (lb): " + dict["Weight"] + " \| Height (cm): " + dict["Height"];
    // Save note to localStorage.
    // The key is the dateTime with seconds, the value is the content of the note.
    saveNote(new Date().toLocaleString(), noteContent);

    // Reset variables and update UI.
    noteContent = '';
    renderNotes(getAllNotes());
    noteTextarea.val('');
    instructions.text('Patient information saved successfully.');
  }
      
})


notesList.on('click', function(e) {
  e.preventDefault();
  var target = $(e.target);

  // Delete note.
  if(target.hasClass('delete-note')) {
    var dateTime = target.siblings('.date').text();  
    deleteNote(dateTime);
    target.closest('.note').remove();
  }
});

/*-----------------------------
      Helper Functions 
------------------------------*/

function renderNotes(notes) {
  var html = '';
  if(notes.length) {
    notes.forEach(function(note) {
      html+= `<li class="note">
        <p class="header">
          <span class="date">${note.date}</span>
          <a href="#" class="delete-note" title="Delete">Delete</a>
        </p>
        <p class="content">${note.content}</p>
      </li>`;    
    });
  }
  else {
    html = '<li><p class="content">You don\'t have any prior patient information.</p></li>';
  }
  notesList.html(html);
}


function saveNote(dateTime, content) {
  localStorage.setItem('note-' + dateTime, content);
}


function getAllNotes() {
  var notes = [];
  var key;
  for (var i = 0; i < localStorage.length; i++) {
    key = localStorage.key(i);

    if(key.substring(0,5) == 'note-') {
      notes.push({
        date: key.replace('note-',''),
        content: localStorage.getItem(localStorage.key(i))
      });
    } 
  }
  return notes;
}


function deleteNote(dateTime) {
  localStorage.removeItem('note-' + dateTime); 
}