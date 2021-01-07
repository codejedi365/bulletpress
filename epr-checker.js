var uppers = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
var lowers = "abcdefghijklmnopqrstuvwxyz";
var numerics = "1234567890";
var others = "#$%+.'’ &";
var allowedChars = uppers + lowers + numerics + others;

var acronymDefinitions = {};

HTMLCollection.prototype.forEach = Array.prototype.forEach;
function openTab(evt, tabName) {
  document.getElementsByClassName("tabcontent").forEach(function (x) { x.style.display = "none"; });
  document.getElementsByClassName("tablinks").forEach(function (x) { x.className = x.className.replace(" active", ""); });
  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.className += " active";
}
document.getElementById("abbreviation-conflicts").style.display = "block";

function generateRemarks() {
  let input = document.getElementById("input").innerText;
  let words = scrubText(input).split(" ").filter(function (x) { return x != ""; });
  let acronyms = findPossibleAcronyms(words);
  let remarks = [];
  acronyms.sort().forEach(function (acronym) {
    if (acronymDefinitions[acronym] && acronymDefinitions[acronym].trim() != "") {
      remarks.push(acronymDefinitions[acronym] + " (" + acronym + ")");
    }
  });
  return remarks.join("; ");
}

document.getElementById("input").onkeyup = function () {
  let input = document.getElementById("input").innerText;
  let words = scrubText(input).split(" ").filter(function (x) { return x != ""; });
  let output = "";
  let possibleNumbers = findPossibleNumbers(words);
  if (possibleNumbers.length > 0) {
    possibleNumbers.forEach(function (number) {
      output += number + "</br>";
    });
    output += "</br>";
  }
  document.getElementById("numbers").innerHTML = output;
  output = "";
  let possibleAcronyms = findPossibleAcronyms(words);
  if (possibleAcronyms.length > 0) {
    output += "<table width='100%'>";
    possibleAcronyms.forEach(function (acronym) {
      let definition = acronymDefinitions[acronym] ? acronymDefinitions[acronym] : "";
      output += "<tr><td>" + acronym + "</td><td><input oninput=acronymDefinitions['" +
        acronym + "']=this.value;document.getElementById('remarks').innerHTML=generateRemarks() value='" + definition + "'></input></td></tr>";
    });
    output += "</table>Generated remarks below:</br>";
    output += "<div class=remarks id=remarks contentEditable=true>" + generateRemarks() + "</div>";
  }
  document.getElementById("acronyms").innerHTML = output;
  output = "";
  let possibleAbbreviations = findPossibleAbbreviations(words);
  if (Object.keys(possibleAbbreviations).length > 0) {
    Object.keys(possibleAbbreviations).sort().forEach(function (abbreviation) {
      let word_b = possibleAbbreviations[abbreviation];
      let word_a = abbreviation.substring(0, abbreviation.length - word_b.length);
      let line = word_a + " -> " + word_b + "</br>";
      if (dictionary.size > 1) {
        if (!dictionary.has(word_a) || !dictionary.has(word_b)) {
          line = "<b>" + line + "</b>";
        }
      }
      output += line;
    });
  }
  document.getElementById("abbreviation-conflicts").innerHTML = output;
  output = "";
  let wordCounts = getWordCounts(words);
  if (Object.keys(wordCounts).length > 0) {
    let uniqueValues = {};
    Object.keys(wordCounts).map(function (key) {
      uniqueValues[wordCounts[key]] = true;
    });
    uniqueValues = Object.keys(uniqueValues).sort(function (x, y) { return x - y; }).reverse();
    uniqueValues.forEach(function (value) {
      valueWords = [];
      Object.keys(wordCounts).forEach(function (word) {
        if (wordCounts[word] == value) {
          valueWords.push(word);
        }
      });
      valueWords.sort().forEach(function (word) {
        output += word + ": " + value + "</br>";
      });
    });
  }
  document.getElementById("word-counts").innerHTML = output;
};

function getDictionary(path) {
  let successMessage = "Dictionary loaded successfully.";
  let errorMessage = "An error occurred while attempting to load the dictionary.  Certain checker capabilities may be degraded.";
  document.getElementById("dictionary-status").innerHTML = "Loading dictionary...";
  let words = new Set();
  let rawFile = new XMLHttpRequest();
  try {
    rawFile.open("GET", path);
    rawFile.responseType = "text";
    rawFile.onreadystatechange = function () {
      if (rawFile.readyState === 4) {
        if (rawFile.status === 200 || rawFile.status === 0) {
          let allText = rawFile.responseText;
          allText.split(/\r?\n/).forEach(function (word) {
            words.add(word);
          });
          if (words.size > 1) {
            document.getElementById("dictionary-status").innerHTML = successMessage;
            document.getElementById("input").onkeyup();
          } else {
            document.getElementById("dictionary-status").innerHTML = errorMessage;
          }
        }
      }
    };
    rawFile.send();
  } catch (e) {
    document.getElementById("dictionary-status").innerHTML = errorMessage;
    console.log(errorMessage);
    console.log(e);
  }
  return words;
}

var dictionary = getDictionary("enable1.txt");

String.prototype.includes = function (str) {
  return this.indexOf(str) !== -1;
};

/**
 * Replaces characters that aren't found in the set of allowed characters with whitespace.
 * @param {string} text The text from which disallowed characters should be replaced.
 * @return {string} The text with disallowed characters replaced with whitespace.
 */
function scrubText(text) {
  let scrubbedText = "";
  for (let i = 0; i < text.length; i++) {
    let c = text.charAt(i);
    if (allowedChars.includes(c)) {
      scrubbedText += c;
    } else {
      scrubbedText += " ";
    }
  }
  return scrubbedText;
}

/**
 * Finds all words in a given word list that contain numbers.
 * @param {string[]} words A list of words.
 * @return {string[]} A sorted list of possible numbers from the word list.  Items in the list may be alphanumeric.
 */
function findPossibleNumbers(words) {
  let possibleNumbers = {};
  words.forEach(function (word) {
    for (let i = 0; i < word.length; i++) {
      if (numerics.includes(word.charAt(i))) {
        possibleNumbers[word] = true;
        break;
      }
    }
  });
  return Object.keys(possibleNumbers).sort();
}

/**
 * Finds all words in a given word list that are completely uppercase, and aren't considered to be possible numbers.
 * @param {string[]} words A list of words.
 * @param {string[]} A sorted list of possible acronyms from the word list.
 */
function findPossibleAcronyms(words) {
  let possibleAcronyms = {};
  words.forEach(function (word) {
    if (word.length > 1) {
      if (word == word.toUpperCase() && findPossibleNumbers([word]).length === 0) {
        possibleAcronyms[word] = true;
      }
    }
  });
  return Object.keys(possibleAcronyms).sort();
}

/**
 * Finds all pairs of words from the word list where, given {word_a: word_b}, word_b contains all lowercase letters from word_a.
 * @param {string[]} words A list of words.
 * @return {Object[]} A collection of words and the words they're possible abbreviations of.
 */
function findPossibleAbbreviations(words) {
  let possibleAbbreviations = {};
  words.forEach(function (word_a) {
    word_a = word_a.toLowerCase();
    let expr = word_a.split("")
      .filter(function (c) { return lowers.includes(c); });
    if (expr.length > 0) {
      expr = expr.join(".*") + ".*";
      words.forEach(function (word_b) {
        word_b = word_b.toLowerCase();
        if (word_a.length < word_b.length && word_a.charAt(0) == word_b.charAt(0)) {
          if (word_b.search(expr) != -1) {
            possibleAbbreviations[word_a + word_b] = word_b;
          }
        }
      });
    }
  });
  return possibleAbbreviations;
}

/**
 * Generates counts for all words in a given word list, using their lowercase form.
 * @param {string[]} words A list of words.
 * @return {Object[]} A collection of lowercase word forms and their counts.
 */
function getWordCounts(words) {
  let counts = {};
  words.forEach(function (word) {
    let key = word.toLowerCase();
    counts[key] = 1 + (counts[key] ? counts[key] : 0);
  });
  return counts;
}
