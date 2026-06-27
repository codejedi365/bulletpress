const cap = 766.5
const margin = 10
const MAX_CHARS = 115
const MAX_PERF_BRIEF_CHARS = 350
const MAX_HLR_CHARS = 250
const SECONDS = 1000
const DEFAULT_PB_TEXT = '# EXECUTING THE MISSION\n\nWhen a Primary Care Team member tested COVID positive, MSgt Bailey\nindependently acted to empower | empowered\na SSgt as Team lead ensuring coverage, mentoring them to create/brief new plans to Medical Group for process improvement.'
const DEFAULT_BULLET_TEXT = 'Modernized|Overhauled|Streamlined\nawd/\nannual|yearly\nreview\nprocess|proc\n;\ndedicated 80hrs\n&\nengineered|dev\'d\napp\n--\nestablished total-force SOP\n/\nsaved 3.5K hrs'
const PREVIEW_TRAY_HTML = '<span class="preview-item-tray"><span class="tray-btn copy-btn" title="Copy to clipboard">&#x29C9;</span><span class="tray-btn save-btn" title="Save to storage">&#x1F4BE;</span></span>'
const DestinationPkgEnum = Object.freeze({
  'MyEval': 'MyEval',
  'AF1206': 'AF1206',
  'PerformanceBrief': 'PerformanceBrief'
});

// ─── Module-level localStorage keys ───────────────────────────────────────────
const WB_STORAGE_KEY = 'bulletpress_workbench'
const STYLE_STORAGE_KEY = 'bulletpress_style'
const STORAGE_EXPANDED_KEY = 'bulletpress_storage_expanded'
const THEME_STORAGE_KEY = 'bulletpress_theme'

;(function (factory) {
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
  let hlrToggle = null;

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
        // empty textArea => auto expand based on mode
        if (window.gui && gui.destPkg === DestinationPkgEnum.PerformanceBrief) {
          // PB mode: split sentences at ". " or "! " followed by a capital letter
          element.value = pastedText.trim().replace(/([.!])\s+(?=[A-Z])/g, '$1\n\n')
        } else {
          const stdBulletRegex = RegExp(/^(?:-\s+)?(\w+.*);\s+(\w.*\w)--(\w.*)$/m)
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
      }

      workbench = {
        get value() { return element.value },
        setValue: function(text) { element.value = text },
        addClass: function(className) { element.classList.add(className); },
        rmClass: function(className) { element.classList.remove(className); },
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
      const radioInputs = document.querySelectorAll('input[name="style-mode"]')
      const styleLabels = document.querySelectorAll('.style-btn')

      function getCheckedValue() {
        const checked = document.querySelector('input[name="style-mode"]:checked')
        return checked ? checked.value : 'performancebrief'
      }

      function getRuleStyleFromValue(val) {
        if (val === 'myeval') return DestinationPkgEnum.MyEval
        if (val === 'af1206') return DestinationPkgEnum.AF1206
        return DestinationPkgEnum.PerformanceBrief
      }

      function updateActiveLabel(val) {
        styleLabels.forEach(label => label.classList.remove('style-btn-active'))
        const activeLabel = document.querySelector(`.style-btn[data-style="${val}"]`)
        if (activeLabel) activeLabel.classList.add('style-btn-active')
      }

      const STYLE_ORDER = ['performancebrief', 'myeval', 'af1206']

      function onclick(func) {
        const selectorSpan = document.getElementById('style-selector')
        if (selectorSpan) selectorSpan.addEventListener('click', func)
      }

      function changeMode() {
        const val = getCheckedValue()
        editor.classList.remove("characterlength", "pixelwidth", "performancebrief")
        if (val === 'myeval') editor.classList.add("characterlength")
        else if (val === 'af1206') editor.classList.add("pixelwidth")
        else editor.classList.add("performancebrief")
        updateActiveLabel(val)
        // Reset HLR toggle when leaving Performance Brief mode
        if (val !== 'performancebrief') {
          const hlrEl = document.getElementById("ckbox-hlr-mode")
          if (hlrEl) hlrEl.checked = false
        }
      }

      function cycleStyle() {
        const current = getCheckedValue()
        const currentIdx = STYLE_ORDER.indexOf(current)
        const nextVal = STYLE_ORDER[(currentIdx + 1) % STYLE_ORDER.length]
        // Swap textarea default content if applicable
        const currentContent = gui.textArea.value.trim()
        if (current === 'performancebrief' && nextVal !== 'performancebrief') {
          if (currentContent === DEFAULT_PB_TEXT.trim()) {
            gui.textArea.setValue(DEFAULT_BULLET_TEXT)
          }
        } else if (current !== 'performancebrief' && nextVal === 'performancebrief') {
          if (currentContent === DEFAULT_BULLET_TEXT.trim()) {
            gui.textArea.setValue(DEFAULT_PB_TEXT)
          }
        }
        const nextRadio = document.querySelector(`input[name="style-mode"][value="${nextVal}"]`)
        if (nextRadio) nextRadio.checked = true
        changeMode()
      }

      destRuleSet = Object.freeze({
        get ruleStyle() {
          return getRuleStyleFromValue(getCheckedValue())
        },
        onclick,
        changeMode,
        cycleStyle
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

  function getHLRToggle() {
    if (hlrToggle === null) {
      const element = document.getElementById("ckbox-hlr-mode")
      hlrToggle = Object.freeze({
        get isActive() { return element ? element.checked : false },
        onchange: function(func) { if (element) element.addEventListener("change", func) }
      })
    }
    return hlrToggle;
  }

  return Object.freeze({
    get tutorial() { return getTutorial() },
    get destPkg() { return getDestRuleSet().ruleStyle; },
    get textArea() { return getWorkBench(); },
    get displayArea() { return getDisplayArea(); },
    get theme() { return getTheme(); },
    get destRuleSet() { return getDestRuleSet(); },
    get textRuler() { return getTextRuler(); },
    get wordsearch() { return getWordSearch(); },
    get hlrToggle() { return getHLRToggle(); }
  });

}))();


const StaticStorage = (function () {
  const STORAGE_KEY = 'bulletpress_storage'
  let items = []
  let listEl = null
  let downloadBtnEl = null
  let clearBtnEl = null
  let _drag = null

  function _load() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      if (!Array.isArray(parsed)) { items = []; return }
      items = parsed.map(item => {
        if (typeof item === 'string') return { text: item, tags: [], style: null, maxLength: null }
        if (item && typeof item === 'object' && typeof item.text === 'string') {
          return {
            text: item.text,
            tags: Array.isArray(item.tags) ? item.tags : [],
            style: item.style || null,
            maxLength: item.maxLength != null ? item.maxLength : null
          }
        }
        return null
      }).filter(Boolean)
    } catch (e) {
      items = []
    }
  }

  function _persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch (e) { /* storage unavailable */ }
  }

  function _makeBtn(html, title) {
    const btn = document.createElement('span')
    btn.className = 'storage-item-btn'
    btn.innerHTML = html
    btn.title = title
    return btn
  }

  function _esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }

  function _colorText(text, item) {
    if (!window.gui) return _esc(text)
    // Use stored style/maxLength if available, otherwise fall back to current app mode
    const storedStyle = item ? item.style : null
    const storedMaxLength = item ? item.maxLength : null
    const pkg = storedStyle || gui.destPkg
    if (pkg === DestinationPkgEnum.MyEval || pkg === 'myeval') {
      const maxLen = storedMaxLength != null ? storedMaxLength : MAX_CHARS
      if (text.length > maxLen) {
        return `<span class="warning-font">${_esc(text.substring(0, maxLen))}</span>` +
               `<span class="error-font char-overage">${_esc(text.substring(maxLen))}</span>`
      }
    } else if (pkg === DestinationPkgEnum.PerformanceBrief || pkg === 'performancebrief') {
      const maxLen = storedMaxLength != null ? storedMaxLength : (gui.hlrToggle.isActive ? MAX_HLR_CHARS : MAX_PERF_BRIEF_CHARS)
      if (text.length > maxLen) {
        return `<span class="warning-font">${_esc(text.substring(0, maxLen))}</span>` +
               `<span class="error-font char-overage">${_esc(text.substring(maxLen))}</span>`
      }
    } else if (pkg === DestinationPkgEnum.AF1206 || pkg === 'af1206') {
      const pixelCap = storedMaxLength != null ? storedMaxLength : cap
      if (gui.textRuler.measure(text) > pixelCap) {
        let validChars = text.length
        for (let i = 0; i < text.length; i++) {
          if (gui.textRuler.measure(text.substring(0, validChars - i)) <= pixelCap) {
            validChars -= i
            break
          }
        }
        return `<span class="warning-font">${_esc(text.substring(0, validChars))}</span>` +
               `<span class="error-font char-overage">${_esc(text.substring(validChars))}</span>`
      }
    }
    return _esc(text)
  }

  function _copyStorageItem(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => ToastManager.success('Copied to clipboard.'))
        .catch(() => { _fallbackCopy(text); ToastManager.success('Copied to clipboard.') })
    } else {
      _fallbackCopy(text)
      ToastManager.success('Copied to clipboard.')
    }
  }

  function _loadStorageItemInWorkbench(text) {
    if (window.gui) {
      gui.textArea.setValue('')
      gui.textArea.processPasteOnWorkbench(text, '', 0)
      gui.textArea.triggerInput()
    }
  }

  function _makePlaceholderEl() {
    const div = document.createElement('div')
    div.className = 'storage-item drag-placeholder'
    return div
  }

  function _cleanup() {
    if (!_drag) return
    if (_drag.sourceEl) _drag.sourceEl.classList.remove('drag-source')
    if (_drag.placeholderEl && _drag.placeholderEl.parentNode) _drag.placeholderEl.remove()
    _drag = null
  }

  function moveUp(index) {
    if (index <= 0) return
    ;[items[index], items[index - 1]] = [items[index - 1], items[index]]
    _persist()
    _render()
  }

  function moveDown(index) {
    if (index >= items.length - 1) return
    ;[items[index], items[index + 1]] = [items[index + 1], items[index]]
    _persist()
    _render()
  }

  function _createItemEl(item, index) {
    const { text, tags } = item
    const div = document.createElement('div')
    div.className = 'storage-item'
    div.dataset.storageIndex = index
    div.draggable = true

    const tray = document.createElement('span')
    tray.className = 'storage-item-tray'

    const upBtn = _makeBtn('&#x25B2;', 'Move up')
    const downBtn = _makeBtn('&#x25BC;', 'Move down')
    const copyBtn = _makeBtn('&#x29C9;', 'Copy to clipboard')
    const loadBtn = _makeBtn('&#x26CF;', 'Load in workbench')
    const tagBtn = _makeBtn('&#127991;', 'Apply tag')
    const delBtn = _makeBtn('&#128465;', 'Remove from storage')

    if (index === 0) upBtn.classList.add('btn-disabled')
    if (index === items.length - 1) downBtn.classList.add('btn-disabled')

    upBtn.addEventListener('click', (e) => { e.stopPropagation(); moveUp(index) })
    downBtn.addEventListener('click', (e) => { e.stopPropagation(); moveDown(index) })
    copyBtn.addEventListener('click', (e) => { e.stopPropagation(); _copyStorageItem(text) })
    loadBtn.addEventListener('click', (e) => { e.stopPropagation(); _loadStorageItemInWorkbench(text) })
    tagBtn.addEventListener('click', (e) => { e.stopPropagation(); TagDialogManager.open(index) })
    delBtn.addEventListener('click', (e) => { e.stopPropagation(); removeAt(index) })

    tray.appendChild(upBtn)
    tray.appendChild(downBtn)
    tray.appendChild(copyBtn)
    tray.appendChild(loadBtn)
    tray.appendChild(tagBtn)
    tray.appendChild(delBtn)

    const textEl = document.createElement('span')
    textEl.className = 'storage-item-text'
    if (item.style === 'performancebrief') {
      const maxLen = item.maxLength != null ? item.maxLength : MAX_PERF_BRIEF_CHARS
      const badge = document.createElement('span')
      badge.className = 'storage-item-length-badge'
      badge.textContent = `[${text.length}/${maxLen}] `
      textEl.appendChild(badge)
      const textNode = document.createElement('span')
      textNode.innerHTML = _colorText(text, item)
      textEl.appendChild(textNode)
    } else if (item.style === 'myeval') {
      const maxLen = item.maxLength != null ? item.maxLength : MAX_CHARS
      const badge = document.createElement('span')
      badge.className = 'storage-item-length-badge'
      badge.textContent = `[${text.length}/${maxLen}] `
      textEl.appendChild(badge)
      const textNode = document.createElement('span')
      textNode.innerHTML = _colorText(text, item)
      textEl.appendChild(textNode)
    } else {
      textEl.innerHTML = _colorText(text, item)
    }

    div.appendChild(tray)
    div.appendChild(textEl)

    div.addEventListener('dragstart', (e) => {
      if (e.target.closest('.storage-item-tray')) { e.preventDefault(); return }
      const srcIndex = Number(div.dataset.storageIndex)
      const itemHeight = div.offsetHeight
      const placeholder = _makePlaceholderEl()
      _drag = { sourceIndex: srcIndex, sourceEl: div, placeholderEl: placeholder, dropBeforeIndex: srcIndex }
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', String(srcIndex))
      requestAnimationFrame(() => {
        placeholder.style.height = itemHeight + 'px'
        div.classList.add('drag-source')
        listEl.insertBefore(placeholder, div)
      })
    })

    return div
  }

  function _setupDragAndDrop() {
    listEl.addEventListener('dragover', (e) => {
      e.preventDefault()
      if (!_drag) return
      e.dataTransfer.dropEffect = 'move'
      const otherItemEls = [...listEl.querySelectorAll('.storage-item:not(.drag-source):not(.drag-placeholder)')]
      let newDropBeforeIndex = otherItemEls.length
      for (let i = 0; i < otherItemEls.length; i++) {
        const rect = otherItemEls[i].getBoundingClientRect()
        if (e.clientY < rect.top + rect.height / 2) {
          newDropBeforeIndex = i
          break
        }
      }
      if (newDropBeforeIndex !== _drag.dropBeforeIndex) {
        _drag.dropBeforeIndex = newDropBeforeIndex
        if (newDropBeforeIndex >= otherItemEls.length) {
          listEl.appendChild(_drag.placeholderEl)
        } else {
          listEl.insertBefore(_drag.placeholderEl, otherItemEls[newDropBeforeIndex])
        }
      }
    })

    listEl.addEventListener('drop', (e) => {
      e.preventDefault()
      if (!_drag) return
      const { sourceIndex, dropBeforeIndex } = _drag
      const srcText = items[sourceIndex]
      const otherItems = items.filter((_, i) => i !== sourceIndex)
      otherItems.splice(dropBeforeIndex, 0, srcText)
      items = otherItems
      _cleanup()
      _persist()
      _render()
    })

    document.addEventListener('dragend', () => {
      if (_drag) {
        _cleanup()
        _render()
      }
    })
  }

  function _render() {
    if (!listEl) return

    // Enable / disable the CSV download button based on whether storage has items
    if (downloadBtnEl) {
      downloadBtnEl.disabled = items.length === 0
    }

    // Enable / disable the clear-all button based on whether storage has items
    if (clearBtnEl) {
      clearBtnEl.disabled = items.length === 0
    }

    listEl.innerHTML = ''
    if (items.length === 0) {
      const msg = document.createElement('div')
      msg.className = 'storage-empty-msg'
      msg.textContent = 'No saved bullets yet.'
      listEl.appendChild(msg)
      return
    }
    items.forEach((item, index) => listEl.appendChild(_createItemEl(item, index)))
  }

  function init(element) {
    listEl = element
    downloadBtnEl = document.querySelector('.storage-download-btn')
    clearBtnEl = document.querySelector('.storage-clear-btn')
    _load()
    _render()
    _setupDragAndDrop()
  }

  function add(text, style, maxLength) {
    const trimmed = text.trim()
    if (!trimmed || items.some(i => i.text === trimmed)) return false
    items.unshift({ text: trimmed, tags: [], style: style || null, maxLength: maxLength != null ? maxLength : null })
    _persist()
    _render()
    return true
  }

  function removeAt(index) {
    items.splice(index, 1)
    _persist()
    _render()
  }

  function clearAll() {
    items = []
    _persist()
    _render()
  }

  function startAddFlow() {
    if (!listEl) return
    // Prevent duplicate edit areas
    if (listEl.querySelector('.storage-edit-wrapper')) {
      listEl.querySelector('.storage-edit-wrapper textarea').focus()
      return
    }

    const wrapper = document.createElement('div')
    wrapper.className = 'storage-edit-wrapper'

    const ta = document.createElement('textarea')
    ta.className = 'storage-edit-textarea secondary-color'
    ta.placeholder = 'Enter bullet text...'
    ta.rows = 2

    const btns = document.createElement('span')
    btns.className = 'storage-edit-btns'

    const saveBtn = document.createElement('span')
    saveBtn.className = 'storage-edit-save'
    saveBtn.innerHTML = '&#x1F4BE;'
    saveBtn.title = 'Save (Ctrl+Enter)'

    const cancelBtn = document.createElement('span')
    cancelBtn.className = 'storage-edit-cancel'
    cancelBtn.innerHTML = '&times;'
    cancelBtn.title = 'Cancel (Esc)'

    function commitEdit() {
      const val = ta.value.trim()
      wrapper.remove()
      if (val) add(val)
    }

    function cancelEdit() {
      wrapper.remove()
    }

    // mousedown + preventDefault keeps focus on textarea (prevents blur before action fires)
    saveBtn.addEventListener('mousedown', (e) => { e.preventDefault(); commitEdit() })
    cancelBtn.addEventListener('mousedown', (e) => { e.preventDefault(); cancelEdit() })

    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); cancelEdit() }
      else if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); commitEdit() }
    })

    // Click anywhere outside textarea → commit (blur fires after mousedown preventDefault won't catch)
    ta.addEventListener('blur', () => {
      setTimeout(() => { if (document.contains(wrapper)) commitEdit() }, 0)
    })

    btns.appendChild(saveBtn)
    btns.appendChild(cancelBtn)
    wrapper.appendChild(ta)
    wrapper.appendChild(btns)
    listEl.insertBefore(wrapper, listEl.firstChild)
    ta.focus()
  }

  function refresh() { _render() }
  function copyItem(text) { _copyStorageItem(text) }
  function loadItem(text) { _loadStorageItemInWorkbench(text) }

  function addTagToItem(index, tagId) {
    if (!items[index]) return
    if (!items[index].tags.includes(tagId)) {
      items[index].tags.push(tagId)
      _persist()
    }
  }

  function removeTagFromItem(index, tagId) {
    if (!items[index]) return
    items[index].tags = items[index].tags.filter(id => id !== tagId)
    _persist()
  }

  function removeTagFromAll(tagId) {
    items.forEach(item => {
      item.tags = item.tags.filter(id => id !== tagId)
    })
    _persist()
  }

  function getItem(index) {
    if (!items[index]) return null
    return { text: items[index].text, tags: [...items[index].tags], style: items[index].style, maxLength: items[index].maxLength }
  }

  function getColoredText(text, item) { return _colorText(text, item) }

  function isEmpty() { return items.length === 0 }

  function downloadCSV() {
    const header = '"bullet","tags"'
    const rows = items.map(item => {
      const tagNames = item.tags.map(id => {
        const tag = TagManager.getById(id)
        return tag ? tag.name : ''
      }).filter(Boolean).join(', ')
      const escapedBullet = item.text.replace(/"/g, '""')
      const escapedTags = tagNames.replace(/"/g, '""')
      return `"${escapedBullet}","${escapedTags}"`
    })
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bulletpress-storage.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return Object.freeze({ init, add, removeAt, clearAll, startAddFlow, refresh, copyItem, loadItem, addTagToItem, removeTagFromItem, removeTagFromAll, getItem, getColoredText, isEmpty, downloadCSV })
})()


const TagManager = (function () {
  const TAGS_KEY = 'bulletpress_tags'
  const DEFAULT_TAGS = [
    { id: 'dtag_1', name: 'EXECUTING THE MISSION', color: '#701b9d' },
    { id: 'dtag_2', name: 'LEADING PEOPLE', color: '#151473' },
    { id: 'dtag_3', name: 'MANAGING RESOURCES', color: '#43d8c4' },
    { id: 'dtag_4', name: 'IMPROVING THE UNIT', color: '#723618' },
    { id: 'dtag_5', name: 'original', color: '#cc620e' },
    { id: 'dtag_6', name: 'review', color: '#b99236' },
    { id: 'dtag_7', name: 'final', color: '#2f9e27' }
  ]
  let tags = []

  function _generateId() {
    return 'tag_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)
  }

  function _persist() {
    try { localStorage.setItem(TAGS_KEY, JSON.stringify(tags)) } catch (e) { /* storage unavailable */ }
  }

  function _load() {
    const stored = localStorage.getItem(TAGS_KEY)
    if (stored === null) {
      tags = DEFAULT_TAGS.map(t => ({ ...t }))
      _persist()
    } else {
      try {
        const parsed = JSON.parse(stored)
        tags = Array.isArray(parsed) ? parsed.filter(t => t && t.id && t.name && t.color) : []
      } catch (e) { tags = [] }
    }
  }

  function getAll() { return [...tags] }
  function getById(id) { return tags.find(t => t.id === id) || null }

  function generateRandomColor() {
    const existing = tags.map(t => t.color.toLowerCase())
    let color, attempts = 0
    do {
      const r = Math.floor(Math.random() * 256)
      const g = Math.floor(Math.random() * 256)
      const b = Math.floor(Math.random() * 256)
      color = '#' + r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0')
      attempts++
    } while (existing.includes(color.toLowerCase()) && attempts < 100)
    return color
  }

  function add(name, color) {
    const id = _generateId()
    tags.push({ id, name: name.trim(), color })
    _persist()
    return id
  }

  function update(id, name, color) {
    const tag = tags.find(t => t.id === id)
    if (!tag) return false
    tag.name = name.trim()
    tag.color = color
    _persist()
    return true
  }

  function remove(id) {
    tags = tags.filter(t => t.id !== id)
    _persist()
    StaticStorage.removeTagFromAll(id)
  }

  _load()

  return Object.freeze({ getAll, getById, generateRandomColor, add, update, remove })
})()


const TagDialogManager = (function () {
  let _currentIndex = null
  let _dialogEl = null
  let _cardEl = null
  let _appliedEl = null
  let _bulletEl = null
  let _bankEl = null
  let _customFormEl = null
  let _nameInputEl = null
  let _hexInputEl = null
  let _colorPreviewEl = null
  let _tagBankCtxMenu = null
  let _ctxTargetId = null
  let _editingTagId = null
  let _tagDragSourceId = null
  let _tagDragIsApplied = false
  let _tagDroppedOnCard = false

  function _getContrastColor(hex) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return lum > 0.5 ? '#000000' : '#ffffff'
  }

  function _makePill(tag, isApplied) {
    const span = document.createElement('span')
    span.className = 'tag-pill' + (isApplied ? ' tag-pill-applied' : '')
    span.dataset.tagId = tag.id
    span.textContent = tag.name
    span.style.backgroundColor = tag.color
    span.style.color = _getContrastColor(tag.color)
    span.draggable = true
    return span
  }

  function _renderApplied(tagIds) {
    _appliedEl.innerHTML = ''
    tagIds.forEach(id => {
      const tag = TagManager.getById(id)
      if (!tag) return
      const pill = _makePill(tag, true)
      pill.addEventListener('contextmenu', (e) => {
        e.preventDefault()
        e.stopPropagation()
        StaticStorage.removeTagFromItem(_currentIndex, id)
        _openDialog(_currentIndex)
      })
      _appliedEl.appendChild(pill)
    })
  }

  function _renderBank() {
    _bankEl.innerHTML = ''
    const allTags = TagManager.getAll().sort((a, b) => a.name.localeCompare(b.name))
    allTags.forEach(tag => {
      const pill = _makePill(tag, false)
      pill.addEventListener('contextmenu', (e) => {
        e.preventDefault()
        e.stopPropagation()
        _ctxTargetId = tag.id
        _tagBankCtxMenu.style.left = e.pageX + 'px'
        _tagBankCtxMenu.style.top = e.pageY + 'px'
        _tagBankCtxMenu.classList.add('visible')
      })
      _bankEl.appendChild(pill)
    })
  }

  function _renderBullet() {
    const item = StaticStorage.getItem(_currentIndex)
    if (!item) return
    _bulletEl.innerHTML = StaticStorage.getColoredText(item.text, item)
  }

  function _openDialog(index) {
    if (!_dialogEl) return
    _currentIndex = index
    const item = StaticStorage.getItem(index)
    if (!item) return
    _renderBullet()
    _renderApplied(item.tags)
    _renderBank()
    _hideCustomForm()
    _dialogEl.style.display = 'flex'
  }

  function _closeDialog() {
    _currentIndex = null
    if (_dialogEl) _dialogEl.style.display = 'none'
    _hideCustomForm()
  }

  function _hideCustomForm() {
    if (!_customFormEl) return
    _customFormEl.style.display = 'none'
    if (_nameInputEl) _nameInputEl.value = ''
    if (_hexInputEl) _hexInputEl.value = ''
    if (_colorPreviewEl) _colorPreviewEl.style.backgroundColor = ''
    _editingTagId = null
    const addBtn = _dialogEl ? _dialogEl.querySelector('.tag-add-new-btn') : null
    if (addBtn) addBtn.style.display = ''
  }

  function _showCustomForm(name, color) {
    const c = color || TagManager.generateRandomColor()
    _nameInputEl.value = name || ''
    _hexInputEl.value = c
    _colorPreviewEl.style.backgroundColor = c
    _customFormEl.style.display = 'block'
    const addBtn = _dialogEl ? _dialogEl.querySelector('.tag-add-new-btn') : null
    if (addBtn) addBtn.style.display = 'none'
    _nameInputEl.focus()
  }

  function _saveCustomForm() {
    const name = _nameInputEl.value.trim()
    const hex = _hexInputEl.value.trim()
    if (!name) { _nameInputEl.focus(); return }
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) { _hexInputEl.focus(); return }
    if (_editingTagId) {
      TagManager.update(_editingTagId, name, hex)
    } else {
      const newId = TagManager.add(name, hex)
      if (_currentIndex !== null) StaticStorage.addTagToItem(_currentIndex, newId)
    }
    _hideCustomForm()
    _openDialog(_currentIndex)
  }

  function init() {
    _dialogEl = document.getElementById('tag-dialog')
    if (!_dialogEl) return
    _cardEl = _dialogEl.querySelector('.tag-dialog-card')
    _appliedEl = _dialogEl.querySelector('.tag-dialog-applied')
    _bulletEl = _dialogEl.querySelector('.tag-dialog-bullet-preview')
    _bankEl = _dialogEl.querySelector('.tag-bank')
    _customFormEl = _dialogEl.querySelector('.tag-custom-form')
    _nameInputEl = _dialogEl.querySelector('.tag-name-input')
    _hexInputEl = _dialogEl.querySelector('.tag-hex-input')
    _colorPreviewEl = _dialogEl.querySelector('.tag-color-preview')
    _tagBankCtxMenu = document.getElementById('tag-bank-context-menu')

    // Close button
    _dialogEl.querySelector('.tag-dialog-close-btn').addEventListener('click', _closeDialog)

    // Backdrop click
    _dialogEl.addEventListener('click', (e) => { if (e.target === _dialogEl) _closeDialog() })

    // ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (_customFormEl.style.display !== 'none') {
          _hideCustomForm()
        } else if (_dialogEl.style.display !== 'none') {
          _closeDialog()
        }
      }
    })

    // Add new tag button
    _dialogEl.querySelector('.tag-add-new-btn').addEventListener('click', () => _showCustomForm())

    // Hex input → enforce # prefix, strip non-hex, and live color preview
    _hexInputEl.addEventListener('input', () => {
      let val = '#' + _hexInputEl.value.replace(/[^0-9a-fA-F]/gi, '')
      if (val.length > 7) val = val.slice(0, 7)
      if (_hexInputEl.value !== val) _hexInputEl.value = val
      _colorPreviewEl.style.backgroundColor = /^#[0-9a-fA-F]{6}$/.test(val) ? val : ''
    })
    _hexInputEl.addEventListener('focus', () => {
      if (!_hexInputEl.value) _hexInputEl.value = '#'
    })

    // Random color button
    _dialogEl.querySelector('.tag-random-btn').addEventListener('click', () => {
      const c = TagManager.generateRandomColor()
      _hexInputEl.value = c
      _colorPreviewEl.style.backgroundColor = c
    })

    // Save form (floppy disk button + Enter key)
    _dialogEl.querySelector('.tag-form-save').addEventListener('click', _saveCustomForm)
    _nameInputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); _saveCustomForm() } })
    _hexInputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); _saveCustomForm() } })

    // Cancel form button
    _dialogEl.querySelector('.tag-form-cancel').addEventListener('click', _hideCustomForm)

    // Drag bank pill → drop on card (apply tag)
    _cardEl.addEventListener('dragover', (e) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      _cardEl.classList.add('drag-active')
    })
    _cardEl.addEventListener('dragleave', () => _cardEl.classList.remove('drag-active'))
    _cardEl.addEventListener('drop', (e) => {
      e.preventDefault()
      _tagDroppedOnCard = true
      _cardEl.classList.remove('drag-active')
      if (_tagDragSourceId && !_tagDragIsApplied) {
        StaticStorage.addTagToItem(_currentIndex, _tagDragSourceId)
        _openDialog(_currentIndex)
      }
    })

    // Drag delegation for bank pills
    _bankEl.addEventListener('dragstart', (e) => {
      const pill = e.target.closest('.tag-pill')
      if (!pill) return
      _tagDragSourceId = pill.dataset.tagId
      _tagDragIsApplied = false
      _tagDroppedOnCard = false
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', pill.dataset.tagId)
    })

    // Drag delegation for applied pills
    _appliedEl.addEventListener('dragstart', (e) => {
      const pill = e.target.closest('.tag-pill')
      if (!pill) return
      _tagDragSourceId = pill.dataset.tagId
      _tagDragIsApplied = true
      _tagDroppedOnCard = false
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', pill.dataset.tagId)
      // Use a 1×1 transparent ghost so the browser has nothing to animate back
      const ghost = document.createElement('div')
      ghost.style.cssText = 'width:1px;height:1px;position:fixed;top:-9999px;left:-9999px;opacity:0;'
      document.body.appendChild(ghost)
      e.dataTransfer.setDragImage(ghost, 0, 0)
      requestAnimationFrame(() => { if (ghost.parentNode) ghost.parentNode.removeChild(ghost) })
    })

    // Drag end: remove applied tag if dropped anywhere outside the card
    document.addEventListener('dragend', () => {
      if (_tagDragIsApplied && _tagDragSourceId && !_tagDroppedOnCard) {
        StaticStorage.removeTagFromItem(_currentIndex, _tagDragSourceId)
        _openDialog(_currentIndex)
      }
      _tagDragSourceId = null
      _tagDragIsApplied = false
      _tagDroppedOnCard = false
    })

    // Tag bank context menu actions
    _tagBankCtxMenu.addEventListener('click', (e) => {
      e.stopPropagation()
      const menuItem = e.target.closest('.context-menu-item')
      if (!menuItem || !_ctxTargetId) return
      const action = menuItem.dataset.action
      if (action === 'apply') {
        StaticStorage.addTagToItem(_currentIndex, _ctxTargetId)
        _openDialog(_currentIndex)
      } else if (action === 'edit') {
        const tag = TagManager.getById(_ctxTargetId)
        if (tag) { _editingTagId = _ctxTargetId; _showCustomForm(tag.name, tag.color) }
      } else if (action === 'delete') {
        const confirmEl = document.getElementById('tag-delete-confirm')
        confirmEl.dataset.pendingTagId = _ctxTargetId
        confirmEl.classList.add('overlay-visible')
      }
      _tagBankCtxMenu.classList.remove('visible')
    })

    // Tag delete confirmation dialog
    const tagDeleteConfirmEl = document.getElementById('tag-delete-confirm')
    tagDeleteConfirmEl.querySelector('.confirm-yes').addEventListener('click', () => {
      const id = tagDeleteConfirmEl.dataset.pendingTagId
      if (id) {
        TagManager.remove(id)
        if (_dialogEl.style.display !== 'none' && _currentIndex !== null) _openDialog(_currentIndex)
      }
      tagDeleteConfirmEl.classList.remove('overlay-visible')
    })
    tagDeleteConfirmEl.querySelector('.confirm-no').addEventListener('click', () => {
      tagDeleteConfirmEl.classList.remove('overlay-visible')
    })
    tagDeleteConfirmEl.addEventListener('click', (e) => {
      if (e.target === tagDeleteConfirmEl) tagDeleteConfirmEl.classList.remove('overlay-visible')
    })
  }

  return Object.freeze({ init, open: _openDialog })
})()


const SettingsManager = (function () {
  function exportSettings() {
    const data = {
      version: 1,
      style: localStorage.getItem(STYLE_STORAGE_KEY),
      theme: localStorage.getItem(THEME_STORAGE_KEY),
      storageExpanded: localStorage.getItem(STORAGE_EXPANDED_KEY),
      tutorialViewed: localStorage.getItem('bulletpress_tutorial_viewed'),
      tags: localStorage.getItem('bulletpress_tags')
    }
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bulletpress-settings.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function importSettings(jsonStr) {
    try {
      const data = JSON.parse(jsonStr)
      if (typeof data !== 'object' || data === null) return false
      if (data.style && ['performancebrief', 'myeval', 'af1206'].includes(data.style)) {
        localStorage.setItem(STYLE_STORAGE_KEY, data.style)
      }
      if (data.theme && ['dark', 'light'].includes(data.theme)) {
        localStorage.setItem(THEME_STORAGE_KEY, data.theme)
      }
      if (data.storageExpanded != null) {
        localStorage.setItem(STORAGE_EXPANDED_KEY, String(data.storageExpanded === 'true' || data.storageExpanded === true))
      }
      if (data.tutorialViewed != null) {
        if (data.tutorialViewed) localStorage.setItem('bulletpress_tutorial_viewed', String(data.tutorialViewed))
        else localStorage.removeItem('bulletpress_tutorial_viewed')
      }
      if (data.tags) {
        localStorage.setItem('bulletpress_tags', typeof data.tags === 'string' ? data.tags : JSON.stringify(data.tags))
      }
      return true
    } catch (e) { return false }
  }

  function clearAllData() {
    ;[
      WB_STORAGE_KEY, STYLE_STORAGE_KEY, STORAGE_EXPANDED_KEY,
      THEME_STORAGE_KEY, 'bulletpress_tutorial_viewed',
      'bulletpress_tags', 'bulletpress_storage',
      'bulletpress_announcement_dismissed'
    ].forEach(k => localStorage.removeItem(k))
    window.location.reload()
  }

  return Object.freeze({ exportSettings, importSettings, clearAllData })
})()


function preprocessBrackets(input) {
  let result = ''
  const stack = []
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]
    if (ch === '[' || ch === '(') {
      stack.push(ch)
      result += ch
    } else if (ch === ']') {
      if (stack.length > 0 && stack[stack.length - 1] === '[') stack.pop()
      result += ch
    } else if (ch === ')') {
      if (stack.length > 0 && stack[stack.length - 1] === '(') stack.pop()
      result += ch
    } else if (ch === '\n' && stack.length > 0) {
      result += ' '
    } else {
      result += ch
    }
  }
  return result
}

function splitByBarePipes(str) {
  const result = []
  let current = ''
  const stack = []
  for (let i = 0; i < str.length; i++) {
    const ch = str[i]
    if (ch === '[' || ch === '(') {
      stack.push(ch)
      current += ch
    } else if (ch === ']') {
      if (stack.length > 0 && stack[stack.length - 1] === '[') stack.pop()
      current += ch
    } else if (ch === ')') {
      if (stack.length > 0 && stack[stack.length - 1] === '(') stack.pop()
      current += ch
    } else if (ch === '|' && stack.length === 0) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

function expandInlineBrackets(str) {
  const segments = []
  let i = 0
  while (i < str.length) {
    const ch = str[i]
    if (ch === '[' || ch === '(') {
      const open = ch
      const close = open === '[' ? ']' : ')'
      // Depth-aware scan: find the bracket that MATCHES this open, not just the first close
      let depth = 1
      let j = i + 1
      while (j < str.length && depth > 0) {
        if (str[j] === open) depth++
        else if (str[j] === close) depth--
        j++
      }
      if (depth === 0) {
        const closePos = j - 1  // j overshot by 1 after the decrement
        const inner = str.substring(i + 1, closePos)
        const parts = splitByBarePipes(inner)
        if (parts.length > 1) {
          // Recursively expand each alternative so nested groups inside are handled
          const options = parts.flatMap(part => expandInlineBrackets(part))
          segments.push({ type: 'alt', options })
        } else {
          // No bare pipes — treat as literal text, brackets included
          segments.push({ type: 'fixed', text: str.substring(i, j) })
        }
        i = j
      } else {
        // Unmatched open bracket — emit remainder as literal text
        segments.push({ type: 'fixed', text: str.substring(i) })
        i = str.length
      }
    } else {
      let j = i
      while (j < str.length && str[j] !== '[' && str[j] !== '(') j++
      if (j > i) segments.push({ type: 'fixed', text: str.substring(i, j) })
      i = j
    }
  }
  let results = ['']
  for (const seg of segments) {
    if (seg.type === 'fixed') {
      results = results.map(r => r + seg.text)
    } else {
      const expanded = []
      for (const r of results) {
        for (const opt of seg.options) expanded.push(r + opt)
      }
      results = expanded
    }
  }
  return results
}


const bulletPress = (string) => {

  const isPB = gui.destPkg === DestinationPkgEnum.PerformanceBrief

  // Early exit for empty workbench
  if (string.trim() === '') {
    return ['<div style="text-align:center;"><i>Please type in the workbench to generate a preview.</i></div>']
  }

  let replacements = [
    [/\s*--\s*/gi, '--'],   // 'asdf -- abcd' >>> 'asdf--abcd'
    isPB
      ? [/^\s*-?\s*/gi, '']   // PB: strip leading hyphen/space, no bullet prefix
      : [/^\s*-?\s*/gi, '- '], // other: add '- ' prefix
    [/\s+$/gi, ''],         // 'asdf ' >>> 'asdf'
    [/\s*\/\s*/gi, '/'],
    [/\s*,/gi, ','],
    [/\s+;/gi, ';'],
    [/\s+/gi, ' ']
  ]

  const COMMENT_LINE_RE = /^[ \t]*##*[ \t]+\S/
  let pieces = preprocessBrackets(string)
    .split('\n')
    .filter(line => !COMMENT_LINE_RE.test(line))
    .map(line => splitByBarePipes(line).flatMap(alt => expandInlineBrackets(alt)))

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
    } else if (gui.destPkg === DestinationPkgEnum.PerformanceBrief) {
      const limit = gui.hlrToggle.isActive ? MAX_HLR_CHARS : MAX_PERF_BRIEF_CHARS
      return x.length <= Math.floor(limit * 1.5)
    }
    return true
  }).sort((x, y) => {
    if (gui.destPkg === DestinationPkgEnum.MyEval) {
      return y.length - x.length
    } else if (gui.destPkg === DestinationPkgEnum.AF1206) {
      return gui.textRuler.measure(y) - gui.textRuler.measure(x)
    } else if (gui.destPkg === DestinationPkgEnum.PerformanceBrief) {
      return y.length - x.length
    }
    return 0
  })
  if (bullets.length > 0) {
    if (gui.destPkg === DestinationPkgEnum.PerformanceBrief) {
      const maxLen = gui.hlrToggle.isActive ? MAX_HLR_CHARS : MAX_PERF_BRIEF_CHARS
      return bullets.map((str, index) => {
        const num = index + 1
        const prefix = `${num}. [${str.length}/${maxLen}] `
        let content
        if (str.length > maxLen) {
          content = prefix +
            `<span class="warning-font">${str.substring(0, maxLen)}</span>` +
            `<span class="error-font char-overage">${str.substring(maxLen)}</span>`
        } else {
          content = prefix + str
        }
        return `<div class="perf-brief-item preview-item">${PREVIEW_TRAY_HTML}${content}</div>`
      })

    } else if (gui.destPkg === DestinationPkgEnum.MyEval) {
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
    return [
      bullets.map(
        (bullet, idx) => idx === 0
          ? '<div class="preview-separator">' + bullet + '</div>'
          : '<div class="preview-item">' + PREVIEW_TRAY_HTML + bullet + '</div>'
      ).concat(
        ["</div>"]
      ).reduce(
        (prev, bullethtml, i, all_bullets) => `${prev}${bullethtml}`,
        "<div style='margin:auto; width:fit-content;'>"
      )
    ];
  }
  return [ '<div style="text-align:center;"><i>All statements exceed length buffer! Reduce content for preview.</i></div>' ]
}


const ToastManager = (function () {
  let _container = null

  function _ensureContainer() {
    if (!_container) {
      _container = document.createElement('div')
      _container.id = 'toast-container'
      document.body.appendChild(_container)
    }
    return _container
  }

  function _dismiss(toast) {
    toast.classList.remove('toast-visible')
    toast.classList.add('toast-hiding')
    toast.addEventListener('transitionend', () => { if (toast.parentNode) toast.parentNode.removeChild(toast) }, { once: true })
  }

  function show(message, type) {
    const c = _ensureContainer()
    const toast = document.createElement('div')
    toast.className = 'toast toast-' + (type || 'success')

    const msg = document.createElement('span')
    msg.className = 'toast-message'
    msg.textContent = message

    const closeBtn = document.createElement('button')
    closeBtn.className = 'toast-close-btn'
    closeBtn.innerHTML = '&times;'
    closeBtn.setAttribute('aria-label', 'Dismiss notification')
    closeBtn.addEventListener('click', () => { clearTimeout(timer); _dismiss(toast) })

    toast.appendChild(msg)
    toast.appendChild(closeBtn)
    c.appendChild(toast)

    let timer = setTimeout(() => _dismiss(toast), 5000)

    toast.addEventListener('mouseenter', () => clearTimeout(timer))
    toast.addEventListener('mouseleave', () => { timer = setTimeout(() => _dismiss(toast), 5000) })

    // Double rAF ensures the element is painted before the transition class is added
    requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('toast-visible')))
  }

  return Object.freeze({
    success: (msg) => show(msg, 'success'),
    error:   (msg) => show(msg, 'error'),
    warning: (msg) => show(msg, 'warning')
  })
})()


function _getBulletText(element) {
  const clone = element.cloneNode(true)
  const tray = clone.querySelector('.preview-item-tray')
  if (tray) tray.remove()
  return clone.textContent.replace(/^\d+\.\s*\[\d+\/\d+\]\s*/, '').trim()
}

function copyBulletText(element) {
  const text = _getBulletText(element)
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => ToastManager.success('Copied to clipboard.'))
      .catch(() => { _fallbackCopy(text); ToastManager.success('Copied to clipboard.') })
  } else {
    _fallbackCopy(text)
    ToastManager.success('Copied to clipboard.')
  }
}

function _fallbackCopy(text) {
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  document.execCommand('copy')
  document.body.removeChild(ta)
}

function saveBulletToStorage(element) {
  const text = _getBulletText(element)
  const pkg = gui.destPkg
  let style = null, maxLength = null
  if (pkg === DestinationPkgEnum.PerformanceBrief) {
    style = 'performancebrief'
    maxLength = gui.hlrToggle.isActive ? MAX_HLR_CHARS : MAX_PERF_BRIEF_CHARS
  } else if (pkg === DestinationPkgEnum.MyEval) {
    style = 'myeval'
    maxLength = MAX_CHARS
  } else if (pkg === DestinationPkgEnum.AF1206) {
    style = 'af1206'
    maxLength = cap
  }
  const saved = StaticStorage.add(text, style, maxLength)
  if (saved) ToastManager.success('Bullet saved to storage.')
}


// ONREADY Event
document.onreadystatechange = function () {
  if (document.readyState === "complete") {
    // Setup html listeners
    let _wbSaveTimer = null

    gui.textArea.oninput(() => {
      gui.displayArea.update(
        bulletPress(gui.textArea.value).join('')
      );
      clearTimeout(_wbSaveTimer)
      _wbSaveTimer = setTimeout(() => {
        const content = gui.textArea.value
        if (!content.trim()) {
          localStorage.removeItem(WB_STORAGE_KEY)
        } else if (content !== DEFAULT_PB_TEXT && content !== DEFAULT_BULLET_TEXT) {
          localStorage.setItem(WB_STORAGE_KEY, content)
        }
      }, 500)
    });
    gui.textArea.onpaste((clipboardText, selectionText, selectionStartPos) => {
      gui.textArea.processPasteOnWorkbench(clipboardText, selectionText, selectionStartPos);
      gui.textArea.triggerInput();
    })
    gui.tutorial.showBtn.onclick(() => {
      gui.tutorial.showTutorial();
      localStorage.setItem('bulletpress_tutorial_viewed', 'true')
    })
    gui.tutorial.hideBtn.onclick(() => {
      gui.tutorial.hideTutorial();
    })
    gui.theme.onOSColorSchemeChange(() => {
      // Only follow OS preference if the user has not explicitly set a theme
      if (!localStorage.getItem(THEME_STORAGE_KEY)) {
        gui.theme.setColorScheme(gui.theme.getPreferredColorScheme())
      }
    })
    gui.theme.switch.onclick(() => {
      gui.theme.changeMode()
      localStorage.setItem(THEME_STORAGE_KEY, gui.theme.isDarkMode() ? 'dark' : 'light')
    });
    gui.destRuleSet.onclick(() => {
      gui.destRuleSet.cycleStyle();
      const styleVal = document.querySelector('input[name="style-mode"]:checked')?.value || 'performancebrief'
      localStorage.setItem(STYLE_STORAGE_KEY, styleVal)
      gui.textArea.triggerInput();
      StaticStorage.refresh();
    });
    gui.hlrToggle.onchange(() => {
      gui.textArea.triggerInput();
      StaticStorage.refresh();
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
      gui.textArea.addClass('search-open');
    })
    gui.wordsearch.onDialogClose(() => {
      let wordsearchClosingDelay = 0
      if (gui.wordsearch.help.isVisible()) {
        gui.wordsearch.help.hideDialog();
        wordsearchClosingDelay += 700
      }
      setTimeout(() => {
        gui.wordsearch.hideSearchDialog();
        gui.textArea.rmClass('search-open');
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

    // Preview item interactions (event delegation on displayArea)
    const displayAreaEl = document.getElementById('displayArea')
    let selectedPreviewItem = null
    const contextMenu = document.getElementById('preview-context-menu')

    displayAreaEl.addEventListener('click', function (e) {
      const item = e.target.closest('.preview-item')
      if (item) {
        // Tray button checks (stop before toggling selection)
        if (e.target.closest('.copy-btn')) {
          e.stopPropagation()
          copyBulletText(item)
          return
        }
        if (e.target.closest('.save-btn')) {
          e.stopPropagation()
          saveBulletToStorage(item)
          return
        }
        // Select item
        if (selectedPreviewItem && selectedPreviewItem !== item) {
          selectedPreviewItem.classList.remove('selected')
        }
        item.classList.add('selected')
        selectedPreviewItem = item
        e.stopPropagation()
      } else {
        // Clicked inside displayArea but not on an item
        if (selectedPreviewItem) {
          selectedPreviewItem.classList.remove('selected')
          selectedPreviewItem = null
        }
      }
    })

    // Deselect on body click outside displayArea / context menus; also close settings dropdown
    document.body.addEventListener('click', function (e) {
      if (!e.target.closest('#displayArea') && !e.target.closest('#preview-context-menu')) {
        if (selectedPreviewItem) {
          selectedPreviewItem.classList.remove('selected')
          selectedPreviewItem = null
        }
      }
      if (!e.target.closest('.storage-list') && !e.target.closest('#storage-context-menu')) {
        if (selectedStorageItem) {
          selectedStorageItem.classList.remove('selected')
          selectedStorageItem = null
        }
      }
      if (!e.target.closest('#btn-settings-gear') && !e.target.closest('#settings-dropdown')) {
        const sd = document.getElementById('settings-dropdown')
        if (sd) sd.style.display = 'none'
      }
    })

    // Right-click context menu on preview items
    displayAreaEl.addEventListener('contextmenu', function (e) {
      const item = e.target.closest('.preview-item')
      if (!item) return
      e.preventDefault()
      if (selectedPreviewItem && selectedPreviewItem !== item) {
        selectedPreviewItem.classList.remove('selected')
      }
      item.classList.add('selected')
      selectedPreviewItem = item
      contextMenu.style.left = e.pageX + 'px'
      contextMenu.style.top = e.pageY + 'px'
      contextMenu.classList.add('visible')
      contextMenu._targetItem = item
    })

    // Dismiss context menus on any document click
    document.addEventListener('click', function () {
      contextMenu.classList.remove('visible')
      storageContextMenu.classList.remove('visible')
      document.getElementById('tag-bank-context-menu').classList.remove('visible')
    })

    // Context menu item actions
    contextMenu.addEventListener('click', function (e) {
      e.stopPropagation()
      const menuItem = e.target.closest('.context-menu-item')
      if (!menuItem || !this._targetItem) return
      if (menuItem.dataset.action === 'copy') copyBulletText(this._targetItem)
      else if (menuItem.dataset.action === 'save') saveBulletToStorage(this._targetItem)
      this.classList.remove('visible')
    })

    // Static storage
    const storageList = document.querySelector('.storage-list')
    const storageAddBtn = document.querySelector('.storage-add-btn')
    const storageClearBtn = document.querySelector('.storage-clear-btn')
    const storageClearConfirm = document.getElementById('storage-clear-confirm')

    StaticStorage.init(storageList)

    TagDialogManager.init()

    storageAddBtn.addEventListener('click', () => StaticStorage.startAddFlow())

    storageClearBtn.addEventListener('click', () => {
      storageClearConfirm.classList.add('overlay-visible')
    })

    storageClearConfirm.querySelector('.confirm-yes').addEventListener('click', () => {
      StaticStorage.clearAll()
      storageClearConfirm.classList.remove('overlay-visible')
      ToastManager.success('All storage cleared.')
    })

    storageClearConfirm.querySelector('.confirm-no').addEventListener('click', () => {
      storageClearConfirm.classList.remove('overlay-visible')
    })

    // Dismiss confirm dialog when clicking the overlay backdrop
    storageClearConfirm.addEventListener('click', (e) => {
      if (e.target === storageClearConfirm) {
        storageClearConfirm.classList.remove('overlay-visible')
      }
    })

    // Storage item interactions
    let selectedStorageItem = null
    const storageContextMenu = document.getElementById('storage-context-menu')

    storageList.addEventListener('click', function (e) {
      const item = e.target.closest('.storage-item')
      if (!item) return
      if (selectedStorageItem && selectedStorageItem !== item) {
        selectedStorageItem.classList.remove('selected')
      }
      item.classList.add('selected')
      selectedStorageItem = item
      e.stopPropagation()
    })

    storageList.addEventListener('contextmenu', function (e) {
      const item = e.target.closest('.storage-item')
      if (!item) return
      e.preventDefault()
      if (selectedStorageItem && selectedStorageItem !== item) {
        selectedStorageItem.classList.remove('selected')
      }
      item.classList.add('selected')
      selectedStorageItem = item
      storageContextMenu.style.left = e.pageX + 'px'
      storageContextMenu.style.top = e.pageY + 'px'
      storageContextMenu.classList.add('visible')
      storageContextMenu._targetIndex = parseInt(item.dataset.storageIndex)
    })

    storageContextMenu.addEventListener('click', function (e) {
      e.stopPropagation()
      const menuItem = e.target.closest('.context-menu-item')
      if (!menuItem) return
      const action = menuItem.dataset.action
      const idx = this._targetIndex
      if (!isNaN(idx)) {
        const si = StaticStorage.getItem(idx)
        if (action === 'copy' && si) StaticStorage.copyItem(si.text)
        else if (action === 'load' && si) StaticStorage.loadItem(si.text)
        else if (action === 'delete') StaticStorage.removeAt(idx)
        else if (action === 'tag') TagDialogManager.open(idx)
      }
      this.classList.remove('visible')
    })

    // Storage view toggle
    const storageViewToggleBtn = document.querySelector('.storage-view-toggle-btn')

    function applyStorageView(expanded) {
      storageList.classList.toggle('storage-expanded', expanded)
      storageViewToggleBtn.classList.toggle('is-expanded', expanded)
    }

    storageViewToggleBtn.addEventListener('click', () => {
      const nowExpanded = !storageList.classList.contains('storage-expanded')
      applyStorageView(nowExpanded)
      localStorage.setItem(STORAGE_EXPANDED_KEY, String(nowExpanded))
    })

    const clearWorkbenchBtn = document.getElementById('btn-clear-workbench')
    clearWorkbenchBtn.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      gui.textArea.setValue('')
      gui.textArea.triggerInput()
      clearWorkbenchBtn.blur()
    })

    // Settings gear button and dropdown
    const settingsGearBtn = document.getElementById('btn-settings-gear')
    const settingsDropdown = document.getElementById('settings-dropdown')

    settingsGearBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      const isOpen = settingsDropdown.style.display !== 'none'
      settingsDropdown.style.display = isOpen ? 'none' : 'block'
    })

    // Download storage CSV
    const storageDownloadBtn = document.querySelector('.storage-download-btn')
    storageDownloadBtn.addEventListener('click', () => {
      try {
        StaticStorage.downloadCSV()
      } catch (err) {
        ToastManager.error('Failed to export storage as CSV.')
      }
    })

    // Export settings
    document.getElementById('btn-settings-export').addEventListener('click', (e) => {
      e.stopPropagation()
      settingsDropdown.style.display = 'none'
      try {
        SettingsManager.exportSettings()
      } catch (err) {
        ToastManager.error('Failed to export settings.')
      }
    })

    // Import settings
    const importFileInput = document.getElementById('settings-import-file')
    document.getElementById('btn-settings-import').addEventListener('click', (e) => {
      e.stopPropagation()
      importFileInput.click()
    })
    importFileInput.addEventListener('change', () => {
      const file = importFileInput.files[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        const ok = SettingsManager.importSettings(ev.target.result)
        importFileInput.value = ''
        settingsDropdown.style.display = 'none'
        if (ok) {
          ToastManager.success('Settings imported successfully.')
          window.location.reload()
        } else {
          ToastManager.error('Failed to import settings: invalid file format.')
        }
      }
      reader.onerror = () => {
        importFileInput.value = ''
        ToastManager.error('Failed to read the settings file.')
      }
      reader.readAsText(file)
    })

    // Clear all data
    const settingsClearConfirm = document.getElementById('settings-clear-confirm')
    document.getElementById('btn-settings-clear-all').addEventListener('click', (e) => {
      e.stopPropagation()
      settingsDropdown.style.display = 'none'
      settingsClearConfirm.classList.add('overlay-visible')
    })
    settingsClearConfirm.querySelector('.confirm-yes').addEventListener('click', () => {
      SettingsManager.clearAllData()
    })
    settingsClearConfirm.querySelector('.confirm-no').addEventListener('click', () => {
      settingsClearConfirm.classList.remove('overlay-visible')
    })
    settingsClearConfirm.addEventListener('click', (e) => {
      if (e.target === settingsClearConfirm) settingsClearConfirm.classList.remove('overlay-visible')
    })

    // CTRL+D shortcut — open/close word search from workbench textarea
    document.getElementById('textArea').addEventListener('keydown', (e) => {
      if (e.ctrlKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault()
        document.getElementById('ckbox-word-search-show').click()
      }
    })

    // Restore saved state
    const savedStyle = localStorage.getItem(STYLE_STORAGE_KEY)
    if (savedStyle && ['performancebrief', 'myeval', 'af1206'].includes(savedStyle)) {
      const radio = document.querySelector(`input[name="style-mode"][value="${savedStyle}"]`)
      if (radio) radio.checked = true
    }
    gui.destRuleSet.changeMode()
    StaticStorage.refresh()

    // Announcement dismissal
    const ANNOUNCEMENT_DISMISSED_KEY = 'bulletpress_announcement_dismissed'
    const announcementEl = document.getElementById('app-announcement')
    if (announcementEl) {
      if (localStorage.getItem(ANNOUNCEMENT_DISMISSED_KEY)) {
        announcementEl.style.display = 'none'
      } else {
        const closeBtn = announcementEl.querySelector('.announcement-close-btn')
        if (closeBtn) {
          closeBtn.addEventListener('click', () => {
            // Step 1: lock current pixel height so we can animate from it
            const fullHeight = announcementEl.offsetHeight
            announcementEl.style.height = fullHeight + 'px'

            // Step 2: hide content instantly (box still occupies space)
            announcementEl.classList.add('announcement-hiding')

            // Step 3: one frame later add collapsing class + set target values → transition fires
            requestAnimationFrame(() => {
              announcementEl.classList.add('announcement-collapsing')
              announcementEl.style.height = '0'
              announcementEl.style.paddingTop = '0'
              announcementEl.style.paddingBottom = '0'
              announcementEl.style.marginTop = '0'
              announcementEl.style.marginBottom = '0'
              announcementEl.style.borderTopWidth = '0'
              announcementEl.style.borderBottomWidth = '0'
            })

            // Step 4: after collapse finishes, fully remove from layout
            announcementEl.addEventListener('transitionend', () => {
              announcementEl.style.display = 'none'
              localStorage.setItem(ANNOUNCEMENT_DISMISSED_KEY, '1')
            }, { once: true })
          })
        }
      }
    }

    const savedWB = localStorage.getItem(WB_STORAGE_KEY)
    if (savedWB !== null && savedWB !== DEFAULT_PB_TEXT && savedWB !== DEFAULT_BULLET_TEXT) {
      gui.textArea.setValue(savedWB)
    } else if (savedWB === null) {
      if (StaticStorage.isEmpty()) {
        const currentStyle = document.querySelector('input[name="style-mode"]:checked')?.value || 'performancebrief'
        if (currentStyle !== 'performancebrief') {
          gui.textArea.setValue(DEFAULT_BULLET_TEXT)
        }
        // performancebrief: textarea already has DEFAULT_PB_TEXT from the HTML initial value
      } else {
        // Has storage items — user is not new, clear the textarea default
        gui.textArea.setValue('')
      }
    }

    applyStorageView(localStorage.getItem(STORAGE_EXPANDED_KEY) === 'true')

    // Restore saved theme or fall back to OS preference
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
    if (savedTheme && ['dark', 'light'].includes(savedTheme)) {
      gui.theme.setColorScheme(savedTheme)
    } else {
      gui.theme.setColorScheme(gui.theme.getPreferredColorScheme())
    }
    gui.textArea.triggerInput();
    if (!localStorage.getItem('bulletpress_tutorial_viewed')) {
      gui.tutorial.guidearrow.flash(3 * SECONDS, 3);
    }
  }
}

