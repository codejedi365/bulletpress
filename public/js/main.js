const cap = 766.5
const margin = 10
const MAX_CHARS = 115
const SECONDS = 1000
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
  let theme = null;
  let destRuleSet = null;
  let textRuler = null;
  let wordsearch = null;

  function getTutorial() {
    if (tutorial === null) {
      const btnShowTutorial = document.getElementById('btn-show-tutorial');
      const btnHideTutorial = document.getElementById('btn-hide-tutorial');
      const tutorialElement = document.getElementById('tutorial');
      const tutorialContent = tutorialElement.querySelector(".accordion-content");
      const tutorialPointer = document.getElementById("guidearrow-tutorial");

      function flashGuideArrow(flashDuration, numFlashes = 1) {
        // Define callback
        function flashExecutor(duration, repeat) {
          this.classList.toggle("hide")
          if (repeat > 0) {
            const newArgs = [duration, repeat - 1]
            setTimeout(
              flashExecutor.bind(this),
              duration,
              ...newArgs
            )
          }
        }
        const duration = flashDuration / 2 // half it for both side toggles
        const repetitions = (numFlashes % 2 === 0)
          ? numFlashes + 1
          : numFlashes + 2;
        setTimeout(
          flashExecutor.bind(tutorialPointer),
          duration,
          ...[duration, repetitions]
        )
      }

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
        guidearrow: {
          flash: flashGuideArrow
        },
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

      function processPasteOnWorkbench(pastedText, selectedText, selectionStartPos) {
        let currentText = element.value;
        if (currentText.length > 0) {
          // Data exists in textArea
          let newText = "";
          if (selectedText.length === 0) {
            // insertion only w/ nothing to overwrite .. act like regular paste (insert text at a location of cursor)
            newText = [
              currentText.substring(0, selectionStartPos),
              pastedText,
              currentText.substring(selectionStartPos)
            ].join("")
          } else if (currentText.replace(selectedText, "").trim().length > 0) {
              // determined that the entire contents will not be overwritten
              newText = currentText.replace(selectedText, pastedText).trim()
          }
          if (newText.length > 0) {
            // Not empty... act like regular paste (overwrite selected text)
            element.value = newText;
            return
          }
          // Fallthrough -- textArea gets a full overwrite
        }
        // empty textArea => auto expand bullet
        const stdBulletRegex = RegExp(/^-\s+(\w+.*);\s+(\w.*\w)--(\w.*)$/m)
        let stdBulletMatch
        if (stdBulletMatch = stdBulletRegex.exec(pastedText.trim())) {
          const frag_action = stdBulletMatch[1]
          const frag_result = stdBulletMatch[2]
          const frag_impact = stdBulletMatch[3]

          const separateInternally = (str) => {
            // weird way of splitting but keeping the splitter symbol as a separate array item
            return str.split("/")
              .join("\n/\n")
              .split(/\s*&\s*/)
              .join("\n&\n")
              .split("\n");
          }
          const formattedText = [
            ...separateInternally(frag_action),
            ";",
            ...separateInternally(frag_result),
            "--",
            ...separateInternally(frag_impact)
          ].join("\n");
          // Insert
          element.value = formattedText;
        } else {
          element.value = pastedText;
        }
      }

      workbench = {
        get value() { return element.value },
        oninput: function(func) { element.addEventListener("input", func) },
        onpaste: function(func) { element.addEventListener("paste", function (evt) {
          const clipdata = evt.clipboardData || window.clipboardData;
          const clipboardData = clipdata.getData('text/plain');
          debugger

          evt.preventDefault();
          // Delete any selected text (user overwriting current contents)
          // const selection = window.getSelection();
          // if (!selection.rangeCount) return;
          // selection.deleteFromDocument();
          // Execute actual handler
          let selectiontext = (typeof this.selectionStart === "number")
            ? this.value.slice(this.selectionStart, this.selectionEnd)
            : "";
          return func(clipboardData, selectiontext, this.selectionStart);
        }) },
        triggerInput: function () { element.dispatchEvent(new Event("input")) },
        focus: function() { element.focus(); },
        processPasteOnWorkbench
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

  let currentColorScheme = null;

  function getTheme() {
    if (theme === null) {
      let element = document.getElementById('ckbox-light-dark-mode')
      let bodyElement = document.body

      function setColorScheme(scheme) {
        switch(scheme){
          case 'dark':
            bodyElement.classList.add('dark');
            bodyElement.classList.remove('light');
            if (!element.checked) {
              element.checked = true;
            }
            break;
          case 'light':
            bodyElement.classList.add('light');
            bodyElement.classList.remove('dark');
            if (element.checked) {
              element.checked = false;
            }
            break;
          default:
            // Default
            return;
        }
        currentColorScheme = scheme;
      }
      function getPreferredColorScheme() {
        if (window.matchMedia) {
          return (window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
        }
        return 'dark'; // webmaster preferred style
      }
      function onOSColorSchemeChange(func) {
        if (window.matchMedia) {
          let colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
          colorSchemeQuery.addEventListener('change', func);
        }
      }
      function isDarkMode() { return currentColorScheme === 'dark'; }
      function isLightMode() { return currentColorScheme === 'light'; }
      function onclick(func) { element.addEventListener("click", func); }
      function changeMode() {
        const isChecked = element.checked
        if (isChecked && !isDarkMode()) {
          setColorScheme('dark')
        } else if (!isChecked && !isLightMode()) {
          setColorScheme('light')
        }
      }
      theme = Object.freeze({
        isDarkMode,
        isLightMode,
        switch: {
          onclick
        },
        changeMode,
        onOSColorSchemeChange,
        getPreferredColorScheme,
        setColorScheme
      });
    }
    return theme;
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

  return Object.freeze({
    get tutorial() { return getTutorial() },
    get destPkg() { return getDestRuleSet().ruleStyle; },
    get textArea() { return getWorkBench(); },
    get displayArea() { return getDisplayArea(); },
    get theme() { return getTheme(); },
    get destRuleSet() { return getDestRuleSet(); },
    get textRuler() { return getTextRuler(); },
    get wordsearch() { return getWordSearch(); }
  });

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
    gui.textArea.onpaste((clipboardText, selectionText, selectionStartPos) => {
      gui.textArea.processPasteOnWorkbench(clipboardText, selectionText, selectionStartPos);
      gui.textArea.triggerInput();
    })
    gui.tutorial.showBtn.onclick(() => {
      gui.tutorial.showTutorial();
    })
    gui.tutorial.hideBtn.onclick(() => {
      gui.tutorial.hideTutorial();
    })
    gui.theme.onOSColorSchemeChange(() => {
      gui.theme.setColorScheme(
        gui.theme.getPreferredColorScheme()
      );
    })
    gui.theme.switch.onclick(() => {
      gui.theme.changeMode();
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
    gui.theme.setColorScheme(
      gui.theme.getPreferredColorScheme()
    )
    gui.textArea.triggerInput();
    gui.tutorial.guidearrow.flash(3 * SECONDS, 3);
  }
}
