const cap = 764
const margin = 10
const MAX_CHARS = 115
const DestinationPkgEnum = Object.freeze({
  'MyEval': 'MyEval',
  'AF1206': 'AF1206'
});

(function (factory) {
  this.gui = factory();
}.bind(window, function () {

  // Lazy Loaded
  let tutorial = null;
  let workbench = null;
  let displayArea = null;
  let themeSwitch = null;
  let destRuleSet = null;
  let textRuler = null;
  let wordsearch = null;

  function getTutorial() {
    if (tutorial === null) {
      let btnShowTutorial = document.getElementById('btn-show-tutorial');
      let btnHideTutorial = document.getElementById('btn-hide-tutorial');
      let tutorialElement = document.getElementById('tutorial');
      let tutorialContent = tutorialElement.querySelector(".accordion-content");

      function isVisible() {
        return tutorialContent.classList.contains("expanded");
      }
      function showTutorial() {
        if (!isVisible()) {
          tutorialContent.classList.add('expanded');
          btnShowTutorial.parentElement.classList.remove('clickable');
        }
      }
      function hideTutorial() {
        if (isVisible()) {
          tutorialContent.classList.remove('expanded');
          btnShowTutorial.parentElement.classList.add('clickable');
        }
      }

      tutorial = Object.freeze({
        isVisible,
        showTutorial,
        hideTutorial,
        showBtn: {
          onclick: function (func) { btnShowTutorial.addEventListener('click', func); }
        },
        hideBtn: {
          onclick: function (func) { btnHideTutorial.addEventListener('click', func); }
        }
      })
    }
    return tutorial;
  }

  function getWorkBench() {
    if (workbench === null) {
      let element = document.getElementById('textArea');
      workbench = {
        get value() { return element.value },
        oninput: function(func) { element.addEventListener("input", func) },
        triggerInput: function () { element.dispatchEvent(new Event("input")) },
        focus: function() { element.focus(); }
      }
    }
    return workbench;
  }

  function getDisplayArea() {
    if (displayArea === null) {
      let element = document.getElementById('displayArea');
      displayArea = {
        update: html => element.innerHTML = html
      }
    }
    return displayArea;
  }

  function getThemeSwitch() {
    if (themeSwitch === null) {
      let element = document.getElementById('ckbox-light-dark-mode')
      let bodyElement = document.body

      function isDarkMode() { return bodyElement.classList.contains("dark"); }
      function isLightMode() { return bodyElement.classList.contains("light"); }
      function onclick(func) { element.addEventListener("click", func); }
      function changeMode() {
        const isChecked = element.checked
        if (isChecked && !isDarkMode()) {
          bodyElement.classList.remove('light')
          bodyElement.classList.add('dark')
        } else if (!isChecked && !isLightMode()) {
          bodyElement.classList.remove('dark')
          bodyElement.classList.add('light')
        }
      }
      themeSwitch = Object.freeze({
        isDarkMode,
        isLightMode,
        onclick,
        changeMode
      });
    }
    return themeSwitch;
  }

  function getDestRuleSet() {
    if (destRuleSet === null) {
      let editor = document.getElementById("bulletpress-editor")
      let element = document.getElementById("ckbox-style-mode")
      let mode = DestinationPkgEnum.MyEval // DEFAULT == checked

      function isMyEvalStyle() { return mode === DestinationPkgEnum.MyEval }
      function is1206Style() { return mode === DestinationPkgEnum.AF1206 }
      function onclick(func) { element.addEventListener("click", func); }
      function changeMode() {
        const isChecked = element.checked
        if (isChecked && isMyEvalStyle()) {
          // Change to MyEval
          editor.classList.remove("pixelwidth")
          editor.classList.add("characterlength")
        } else {
          // Change to 1206
          editor.classList.remove("characterlength")
          editor.classList.add("pixelwidth")
        }
      }
      destRuleSet = Object.freeze({
        get ruleStyle() {
          return element.checked ? DestinationPkgEnum.MyEval : DestinationPkgEnum.AF1206;
        },
        isMyEvalStyle,
        onclick,
        changeMode
      });
    }
    return destRuleSet;
  }

  function getTextRuler() {
    if (textRuler === null) {
      let canvas = document.createElement('canvas')
      let ctx = canvas.getContext('2d')
      ctx.font="12pt Times New Roman"

      function measure(text) {
        return Math.ceil(ctx.measureText(text).width)
      }

      function countSpaces(text) {
        return text.split(" ").length - 1
      }

      textRuler = {
        measure: measure,
        countSpaces: countSpaces
      }
    }
    return textRuler;
  }

  function getWordSearch() {
    if (wordsearch === null) {
      const bulletpressEditor = document.getElementById("bulletpress-editor");
      const toggleBtn = document.getElementById("ckbox-word-search-show");
      const searchtxtbox = document.getElementById("txtbox-word-search");
      const searchDialog = bulletpressEditor.querySelector(".search-dialog");
      const wordListView = bulletpressEditor.querySelector(".search-results-wordlist");
      const searchDialogHelpBtn = document.getElementById("ckbox-search-help-show");
      const searchHelpDialog = bulletpressEditor.querySelector(".search-dialog-help");
      const searchHelpCloseBtn = bulletpressEditor.querySelector(".search-dialog-help-close-btn");

      function triggerSearchInput() {
        searchtxtbox.dispatchEvent(new Event("input"))
      }

      function showSearchDialog() {
        searchDialog.parentElement.classList.remove("hide");
        searchDialog.classList.remove("animate-hide");
        searchDialog.classList.add("animate-show");
        triggerSearchInput();
        setTimeout(() => {
          searchtxtbox.focus();
        }, 1500) // matches animation length
      }
      function hideSearchDialog() {
        searchDialog.classList.remove("animate-show");
        searchDialog.classList.add("animate-hide");
        searchDialog.parentElement.classList.add("hide");
      }

      function toggleViewOfSearchDialog() {
        evt = new Event(
          (!searchDialog.classList.contains("animate-show"))
          ? "dialogOpen"
          : "dialogClose"
        )
        searchDialog.dispatchEvent(evt);
      }

      function updateWordListView(wordDefList) {
        if (Array.prototype !== Object.getPrototypeOf(wordDefList)) return;
        const wordListHtml = (wordDefList.length === 0)
          ? '<div style="text-align: center;">no matches found.</div>'
          : wordDefList.map((wordDef) => {
              return `<div>${wordDef['word']}</div>`
            }).reduce((prev, wordhtml, i, all_words) => `${prev}${wordhtml}`, "");
        wordListView.innerHTML = wordListHtml;
      }

      wordsearch = {
        toggleViewOfSearchDialog,
        showSearchDialog,
        hideSearchDialog,
        onDialogOpen: function(func) { searchDialog.addEventListener("dialogOpen", func); },
        onDialogClose: function(func) { searchDialog.addEventListener("dialogClose", func); },
        onclick: function(func) { toggleBtn.addEventListener("click", func); },
        searchtext: {
          get value() { return searchtxtbox.value },
          oninput: function(func) { searchtxtbox.addEventListener("input", func) },
          triggerInput: triggerSearchInput
        },
        help: {
          isVisible: function() {
            return !searchHelpDialog.parentElement.classList.contains("hide")
          },
          hideDialog: function() {
            if (gui.wordsearch.help.isVisible()) {
              searchHelpDialog.parentElement.classList.add("hide");
              searchHelpDialog.classList.remove("animate-show");
              searchHelpDialog.classList.add("animate-hide");
              // searchHelpDialog.dispatchEvent(new Event("dialogClose"));
              searchtxtbox.focus();
              searchDialogHelpBtn.parentElement.classList.add("clickable")
            }
          },
          showDialog: function() {
            if (!gui.wordsearch.help.isVisible()) {
              searchHelpDialog.parentElement.classList.remove("hide");
              searchHelpDialog.classList.remove("animate-hide");
              searchHelpDialog.classList.add("animate-show");
              searchDialogHelpBtn.parentElement.classList.remove("clickable")
            }
          },
          showBtn: {
            onclick: function(func) { searchDialogHelpBtn.addEventListener("click", func); }
          },
          closeBtn: {
            onclick: function(func) { searchHelpCloseBtn.addEventListener("click", func); }
          }
        },
        wordlist: {
          update: updateWordListView
        }
      }
    }
    return wordsearch;
  }

  return {
    get tutorial() { return getTutorial() },
    get destPkg() { return getDestRuleSet().ruleStyle; },
    get textArea() { return getWorkBench(); },
    get displayArea() { return getDisplayArea(); },
    get themeSwitch() { return getThemeSwitch(); },
    get destRuleSet() { return getDestRuleSet(); },
    get textRuler() { return getTextRuler(); },
    get wordsearch() { return getWordSearch(); }
  };

}))();


const bulletPress = (string) => {

  let replacements = [
    [/\s*--\s*/gi, '--'],   // 'asdf -- abcd' >>> 'asdf--abcd'
    [/^\s*-?\s*/gi, '- '],       // ' asdf' >>> '- asdf'
    [/\s+$/gi, ''],         // 'asdf ' >>> 'asdf'
    [/\s*\/\s*/gi, '/'],
    [/\s*,/gi, ','],
    [/\s+;/gi, ';'],
    [/\s+/gi, ' ']
  ]

  let pieces = string
    .split('\n')
    .map((x) => x.split('|'))

  let bullets = ['']

  pieces.forEach((terms) => {
    let tempBullets = []

    terms.forEach((term) => {
      tempBullets.push(
        bullets.map(x => `${x} ${term}`)
      )
    })

    bullets = tempBullets.flat().slice(0)
  })

  // OPTIMIZATION: Store bullets as objects with pixelLength attached
  bullets = bullets.map((x) => {
    replacements.forEach((replacement) => {
      x = x.replace(...replacement)
    })
    return x.trim()
  }).map((x) => {
    if (gui.destPkg === DestinationPkgEnum.AF1206) {
      while (gui.textRuler.measure(x) > cap && gui.textRuler.countSpaces(x) > 1) {
        x = x.split('').reverse().join('').replace(' ','\u2006').split('').reverse().join('')
      }
    }
    return x
  }).filter((x) => {
    if (gui.destPkg === DestinationPkgEnum.MyEval) {
      charLength = x.length
      return charLength <= MAX_CHARS+3
    } else if (gui.destPkg === DestinationPkgEnum.AF1206) {
      pixelLength = gui.textRuler.measure(x)
      return pixelLength <= cap + margin
    }
    return true
  }).sort((x, y) => {
    if (gui.destPkg === DestinationPkgEnum.MyEval) {
      return y.length - x.length
    } else if (gui.destPkg === DestinationPkgEnum.AF1206) {
      return gui.textRuler.measure(y) - gui.textRuler.measure(x)
    }
    return 0
  })
  if (bullets.length > 0) {
    if (gui.destPkg === DestinationPkgEnum.MyEval) {
      // Add overage formatting cue
      bullets = bullets.map((str) => {
        if (str.length > MAX_CHARS) {
          return [
            '<span class="warning-font">',
            str.substring(0, MAX_CHARS),
            '</span>',
            '<span class="error-font char-overage">',
            str.substring(MAX_CHARS),
            '</span>'
          ].join('');
        }
        return str;
      })
      bullets.unshift(Array(MAX_CHARS).fill("#").join(''));

    } else if (gui.destPkg === DestinationPkgEnum.AF1206) {
      // Add overage formatting cue
      bullets = bullets.map((str) => {
        if (gui.textRuler.measure(str) <= cap) {
          return str;
        }
        // Overage identified, attempt to highlight
        let valid_num_chars = str.length;
        for (let i = 0; i < str.length; i++) {
          const partialBullet = str.substring(0, valid_num_chars-i)
          if (gui.textRuler.measure(partialBullet) <= cap) {
            valid_num_chars -= i;
            break;
          }
        }
        return [
          '<span class="warning-font">',
          str.substring(0, valid_num_chars),
          '</span>',
          '<span class="error-font char-overage">',
          str.substring(valid_num_chars),
          '</span>'
        ].join('');
      });
      // Add visual cue for maximum pixel length
      visual_cue = "-"
      do {
        visual_cue += visual_cue.charAt(0)
      } while (gui.textRuler.measure(visual_cue) < cap)
      bullets.unshift(visual_cue)
    }
    // Return bullets wrapped in html tag 1 per line
    return bullets.map((bullet) => '<div>' + bullet + '</div>');
  }
  return [ '<div>No bullets of length/all bullets over length</div>' ]
}


// ONREADY Event
document.onreadystatechange = function () {
  if (document.readyState === "complete") {
    // Setup html listeners
    gui.textArea.oninput(() => {
      gui.displayArea.update(
        bulletPress(gui.textArea.value).join('')
      );
    });
    gui.tutorial.showBtn.onclick(() => {
      gui.tutorial.showTutorial();
    })
    gui.tutorial.hideBtn.onclick(() => {
      gui.tutorial.hideTutorial();
    })
    gui.themeSwitch.onclick(() => {
      gui.themeSwitch.changeMode();
    });
    gui.destRuleSet.onclick(() => {
      gui.destRuleSet.changeMode();
      gui.textArea.triggerInput();
    });
    gui.wordsearch.onclick(() => {
      gui.wordsearch.toggleViewOfSearchDialog();
    });
    gui.wordsearch.searchtext.oninput(() => {
      gui.wordsearch.wordlist.update(
        Dictionary.search(gui.wordsearch.searchtext.value)
      )
    });
    gui.wordsearch.onDialogOpen(() => {
      gui.wordsearch.showSearchDialog();
    })
    gui.wordsearch.onDialogClose(() => {
      let wordsearchClosingDelay = 0
      if (gui.wordsearch.help.isVisible()) {
        gui.wordsearch.help.hideDialog();
        wordsearchClosingDelay += 700
      }
      setTimeout(() => {
        gui.wordsearch.hideSearchDialog();
        setTimeout(() => {
          gui.textArea.focus();
        }, 900);
      }, wordsearchClosingDelay);
    });
    gui.wordsearch.help.showBtn.onclick(() => {
      gui.wordsearch.help.showDialog();
    });
    gui.wordsearch.help.closeBtn.onclick(() => {
      gui.wordsearch.help.hideDialog();
    })

    // Trigger page
    gui.themeSwitch.changeMode();
    gui.textArea.triggerInput();
  }
}
