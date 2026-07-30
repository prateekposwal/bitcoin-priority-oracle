var fs = require('fs');
var path = require('path');

var NOTES_FILE = path.resolve(__dirname, '..', '..', 'research', 'architect-notes.md');

function addNote(section, note) {
  if (!section || !note) {
    console.log('Usage: node tools/research/add-note.js "Section Name" "Your insight text"');
    console.log('Sections: Bitcoin Core & Protocol, Lightning Network, APIs & Data Sources, Blockchain General, Academic Research, General Directions');
    return;
  }

  // Validate section
  var validSections = [
    'Bitcoin Core & Protocol',
    'Lightning Network',
    'APIs & Data Sources',
    'Blockchain General',
    'Academic Research',
    'General Directions'
  ];

  if (validSections.indexOf(section) === -1) {
    console.log('Invalid section. Choose from:');
    validSections.forEach(function(s) { console.log('  - ' + s); });
    return;
  }

  var content = fs.readFileSync(NOTES_FILE, 'utf8');
  var lines = content.split('\n');
  var inserted = false;

  for (var i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '## ' + section) {
      // Find the end of this section (next ## or end of file)
      var insertAt = i + 1;
      while (insertAt < lines.length && !lines[insertAt].startsWith('## ')) {
        insertAt++;
      }
      // Insert the note before the next section or at the end of this section
      lines.splice(insertAt, 0, '- ' + note);
      inserted = true;
      break;
    }
  }

  if (inserted) {
    fs.writeFileSync(NOTES_FILE, lines.join('\n'));
    console.log('✅ Note added to "' + section + '"');
    console.log('   "' + note + '"');
    console.log('   The research agents will include this in their next cycle.');
  } else {
    console.log('Section "' + section + '" not found in notes file.');
  }
}

// Run from command line
var args = process.argv.slice(2);
if (args.length >= 2) {
  addNote(args[0], args.slice(1).join(' '));
} else {
  console.log('Usage: node tools/research/add-note.js "Section Name" "Your insight text"');
}
