var fs = require('fs');
var path = require('path');

var NOTES_FILE = path.resolve(__dirname, '..', '..', 'research', 'architect-notes.md');

function readNotes() {
  try {
    if (!fs.existsSync(NOTES_FILE)) return null;
    var content = fs.readFileSync(NOTES_FILE, 'utf8');
    return parseNotes(content);
  } catch (e) {
    return null;
  }
}

function parseNotes(content) {
  var sections = {};
  var currentSection = null;
  var lines = content.split('\n');

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];

    // Detect section headings
    var sectionMatch = line.match(/^## (.+)/);
    if (sectionMatch) {
      currentSection = sectionMatch[1].trim();
      sections[currentSection] = [];
      continue;
    }

    // Skip comments, empty lines, and the template instructions
    if (line.trim().startsWith('<!--') || line.trim().startsWith('<--') || line.trim() === '' || line.trim().startsWith('Write your') || line.trim().startsWith('These are read') || line.trim().startsWith('Add notes under') || line.trim().startsWith('The agents will') || line.trim().startsWith('## How to use')) {
      continue;
    }

    // Collect notes under current section
    if (currentSection && line.trim().length > 0) {
      sections[currentSection].push(line.trim());
    }
  }

  // Filter out empty sections and template comments
  var result = {};
  for (var key in sections) {
    var filtered = sections[key].filter(function(l) {
      return l.length > 0 && !l.startsWith('<!--') && l.indexOf('Add notes') === -1;
    });
    if (filtered.length > 0) {
      result[key] = filtered;
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

function getNotesForAgent(agentName) {
  var allNotes = readNotes();
  if (!allNotes) return null;

  // Map agent names to section names
  var sectionMap = {
    'Bitcoin Core & Protocol': 'Bitcoin Core & Protocol',
    'Lightning Network': 'Lightning Network',
    'APIs & Data Sources': 'APIs & Data Sources',
    'Blockchain General': 'Blockchain General',
    'Academic Research': 'Academic Research',
  };

  var sectionName = sectionMap[agentName];
  if (sectionName && allNotes[sectionName]) {
    return allNotes[sectionName];
  }

  // Also check General Directions
  if (allNotes['General Directions']) {
    return allNotes['General Directions'];
  }

  return null;
}

function hasNotes() {
  var n = readNotes();
  return n !== null;
}

function getSummary() {
  var allNotes = readNotes();
  if (!allNotes) return { hasNotes: false, sectionCount: 0, totalNotes: 0 };

  var total = 0;
  var sections = Object.keys(allNotes);
  for (var i = 0; i < sections.length; i++) {
    total += allNotes[sections[i]].length;
  }

  return { hasNotes: true, sectionCount: sections.length, totalNotes: total, sections: sections };
}

module.exports = { readNotes: readNotes, getNotesForAgent: getNotesForAgent, hasNotes: hasNotes, getSummary: getSummary };
