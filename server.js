// --- Built-in Engines Definition ---
const builtinEngines = {
  g: {
    name: "Google",
    url: "https://www.google.com/search?q=%s",
    suggestUrl: "g",
    iconUrl: "https://icons.duckduckgo.com/ip3/google.com.ico", // ★ 追加
  },
  ge: {
    name: "Google(EN)",
    url: "https://www.google.com/search?q=%s&hl=en",
    suggestUrl: "ge",
    iconUrl: "https://icons.duckduckgo.com/ip3/google.com.ico", // ★ 追加
  },
  y: {
    name: "YouTube",
    url: "https://www.youtube.com/results?search_query=%s",
    suggestUrl:
      "https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=",
    iconUrl: "https://icons.duckduckgo.com/ip3/youtube.com.ico", // ★ 追加
  },
  a: {
    name: "Amazon",
    url: "https://www.amazon.co.jp/s?k=%s",
    suggestUrl: null,
    iconUrl: "https://icons.duckduckgo.com/ip3/amazon.co.jp.ico", // ★ 追加
  },
  w: {
    name: "Wikipedia",
    url: "https://ja.wikipedia.org/wiki/%s",
    suggestUrl:
      "https://ja.wikipedia.org/w/api.php?action=opensearch&format=json&search=",
    iconUrl: "https://icons.duckduckgo.com/ip3/ja.wikipedia.org.ico", // ★ 追加
  },
  m: {
    name: "Google Maps",
    url: "https://www.google.com/maps/search/%s",
    suggestUrl: null,
    iconUrl: "https://www.google.com/images/branding/product/ico/maps_32dp.ico", // Google提供のアイコン例
  },
  t: {
    name: "Twitter",
    url: "https://twitter.com/search?q=%s",
    suggestUrl: null,
    iconUrl: "https://icons.duckduckgo.com/ip3/twitter.com.ico", // ★ 追加 (Xアイコンになるかも)
  },
  r: {
    name: "Reddit",
    url: "https://www.reddit.com/search/?q=%s",
    suggestUrl: null,
    iconUrl: "https://icons.duckduckgo.com/ip3/reddit.com.ico", // ★ 追加
  },
  gi: {
    name: "Google画像",
    url: "https://www.google.com/search?tbm=isch&q=%s",
    suggestUrl: null,
    iconUrl:
      "https://www.google.com/images/branding/product/ico/google_images_32dp.ico", // Google提供のアイコン例
  },
  b: {
    name: "Bing",
    url: "https://www.bing.com/search?q=%s",
    suggestUrl: "b",
    iconUrl: "https://icons.duckduckgo.com/ip3/bing.com.ico", // ★ 追加
  },
  d: {
    name: "DuckDuckGo",
    url: "https://duckduckgo.com/?q=%s",
    suggestUrl: "d",
    iconUrl: "https://icons.duckduckgo.com/ip3/duckduckgo.com.ico", // ★ 追加
  },
};

// ★ JSONPフォールバックに使用するURLを定義
const JSONP_FALLBACK_URLS = {
  g: "https://suggestqueries.google.com/complete/search?client=firefox&ds=yt",
  ge: "https://suggestqueries.google.com/complete/search?client=firefox&ds=yt",
  y: "https://suggestqueries.google.com/complete/search?client=firefox&ds=yt",
  w: "https://ja.wikipedia.org/w/api.php?action=opensearch&format=json",
};

// ★ プロキシ経由でアクセスするサジェストAPIのベースURLを定義
const PROXY_TARGET_URLS = {
  g: "https://suggestqueries.google.com/complete/search?client=firefox&ds=yt",
  ge: "https://suggestqueries.google.com/complete/search?client=firefox&ds=yt",
  b: "https://api.bing.com/osjson.aspx",
  d: "https://duckduckgo.com/ac/",
};

// --- Application Settings Management ---
const AppSettings = {
  KEYS: {
    SPEED_DIAL: "speedDialData",
    CUSTOM_ENGINES: "customEngines",
    DELETED_BUILTIN: "deletedBuiltinEngines",
    COLUMNS: "speedDialColumns",
    FAVICONS: "faviconsCache",
  },
  values: {
    speedDial: [],
    engines: {},
    deletedBuiltinEngines: [],
    columns: 4,
    favicons: {},
  },
  load() {
    this.values.speedDial = JSON.parse(
      localStorage.getItem(this.KEYS.SPEED_DIAL) || "[]"
    );
    this.values.favicons = JSON.parse(
      localStorage.getItem(this.KEYS.FAVICONS) || "{}"
    );
    const savedColumns = localStorage.getItem(this.KEYS.COLUMNS);
    this.values.columns = savedColumns ? parseInt(savedColumns, 10) : 4;
    this.values.columns = Math.max(1, Math.min(15, this.values.columns));

    this.values.deletedBuiltinEngines = JSON.parse(
      localStorage.getItem(this.KEYS.DELETED_BUILTIN) || "[]"
    );
    this.loadEngines();

    cache.favicons = this.values.favicons;
    cache.engines = this.values.engines;
  },
  loadEngines() {
    this.values.engines = JSON.parse(JSON.stringify(builtinEngines));
    this.values.deletedBuiltinEngines.forEach((nickname) => {
      if (this.values.engines[nickname]) {
        delete this.values.engines[nickname];
      }
    });
    const storedCustomEngines = localStorage.getItem(this.KEYS.CUSTOM_ENGINES);
    if (storedCustomEngines) {
      try {
        const loadedCustomEngines = JSON.parse(storedCustomEngines);
        for (const nickname in loadedCustomEngines) {
          if (this.values.engines[nickname]) {
            const existingEngine = this.values.engines[nickname];
            const customEngine = loadedCustomEngines[nickname];
            let suggestUrlToUse = customEngine.suggestUrl;
            if (
              typeof existingEngine.suggestUrl === "string" &&
              existingEngine.suggestUrl === nickname
            ) {
              suggestUrlToUse = existingEngine.suggestUrl;
            }
            this.values.engines[nickname] = {
              ...existingEngine,
              ...customEngine,
              suggestUrl: suggestUrlToUse,
            };
          } else {
            this.values.engines[nickname] = loadedCustomEngines[nickname];
          }
        }
      } catch (e) {
        console.error(
          "Failed to load or merge custom engines from localStorage:",
          e
        );
        localStorage.removeItem(this.KEYS.CUSTOM_ENGINES);
      }
    }
    cache.engines = this.values.engines;
  },
  save() {
    localStorage.setItem(
      this.KEYS.SPEED_DIAL,
      JSON.stringify(this.values.speedDial)
    );
    localStorage.setItem(
      this.KEYS.FAVICONS,
      JSON.stringify(this.values.favicons)
    );
    localStorage.setItem(this.KEYS.COLUMNS, this.values.columns);
    localStorage.setItem(
      this.KEYS.DELETED_BUILTIN,
      JSON.stringify(this.values.deletedBuiltinEngines)
    );
    this.saveEngines();
  },
  saveEngines() {
    const customEnginesToSave = {};
    for (const nickname in this.values.engines) {
      if (
        !builtinEngines[nickname] ||
        JSON.stringify(this.values.engines[nickname]) !==
          JSON.stringify(builtinEngines[nickname])
      ) {
        if (
          !(
            builtinEngines[nickname] &&
            this.values.deletedBuiltinEngines.includes(nickname)
          )
        ) {
          customEnginesToSave[nickname] = this.values.engines[nickname];
        }
      }
    }
    localStorage.setItem(
      this.KEYS.CUSTOM_ENGINES,
      JSON.stringify(customEnginesToSave)
    );
  },
  setSpeedDial(data) {
    this.values.speedDial = data;
    localStorage.setItem(this.KEYS.SPEED_DIAL, JSON.stringify(data));
  },
  setFavicons(data) {
    this.values.favicons = data;
    localStorage.setItem(this.KEYS.FAVICONS, JSON.stringify(data));
    cache.favicons = data;
  },
  setColumns(cols) {
    const validCols = Math.max(1, Math.min(15, parseInt(cols, 10) || 4));
    this.values.columns = validCols;
    localStorage.setItem(this.KEYS.COLUMNS, validCols);
  },
};

// --- Global Cache and State ---
const cache = {
  suggestions: {},
  engines: {},
  favicons: {},
};

const state = {
  selectedSuggestionIndex: -1,
  currentEngine: "g",
  actualEngine: "g",
  originalInputValue: "",
  suggestTimeout: null,
  lastQuery: "",
  editingIndex: -1,
  isEditMode: false,
  editingEngine: null,
  draggedItemIndex: null,
  fetchedIconUrl: null,
  manualIconDataUrl: null,
  currentAdjustment: { hue: 0, saturate: 100, brightness: 100 },
  longPressTimerId: null, // ★ 長押しタイマーのID
  longPressTriggeredEdit: false, // ★ 長押しで編集モードに入ったかどうかのフラグ
};

// --- DOM Elements ---
const elements = {
  datetimeDisplay: document.getElementById("datetime-display"),
  searchInput: document.getElementById("searchInput"),
  suggestionsContainer: document.getElementById("suggestions"),
  searchForm: document.getElementById("searchForm"),
  // ★ エンジン表示/選択UI要素を追加
  currentEngineDisplay: document.getElementById("currentEngineDisplay"),
  currentEngineIcon: document.getElementById("currentEngineIcon"),
  currentEngineInitial: document.getElementById("currentEngineInitial"),
  // currentEngineName: document.getElementById('currentEngineName'), // 名前表示する場合
  engineSelectMenu: document.getElementById("engineSelectMenu"),
  actionButton: document.getElementById("actionButton"),
  romajiButton: document.getElementById("romajiButton"),
  clearButton: document.getElementById("clearButton"),
  speedDialGrid: document.getElementById("speedDialGrid"),
  columnsInput: document.getElementById("columns"),
  speedDialModal: document.getElementById("speedDialModal"),
  modalTitle: document.getElementById("modalTitle"),
  siteNameInput: document.getElementById("siteName"),
  siteUrlInput: document.getElementById("siteUrl"),
  siteIconInput: document.getElementById("siteIcon"),
  faviconPreview: document.getElementById("faviconPreview"),
  initialIconPreview: document.getElementById("initialIconPreview"),
  fetchFaviconButton: document.getElementById("fetchFaviconButton"),
  saveSpeedDialButton: document.getElementById("saveSpeedDial"),
  cancelModalButton: document.getElementById("cancelModal"),
  // ★ 色調調整UI要素を追加
  hueSlider: document.getElementById("hueSlider"),
  hueValue: document.getElementById("hueValue"),
  saturateSlider: document.getElementById("saturateSlider"),
  saturateValue: document.getElementById("saturateValue"),
  brightnessSlider: document.getElementById("brightnessSlider"),
  brightnessValue: document.getElementById("brightnessValue"),
  resetAdjustmentButton: document.getElementById("resetAdjustmentButton"),
  helpButton: document.getElementById("helpButton"),
  helpContent: document.getElementById("helpContent"),
  manageEnginesButton: document.getElementById("manageEngines"),
  engineModal: document.getElementById("engineModal"),
  engineList: document.getElementById("engineList"),
  engineNicknameInput: document.getElementById("engineNickname"),
  engineNameInput: document.getElementById("engineName"),
  engineUrlInput: document.getElementById("engineUrl"),
  engineSuggestUrlInput: document.getElementById("engineSuggestUrl"),
  engineIconUrlInput: document.getElementById("engineIconUrl"),
  addEngineButton: document.getElementById("addEngine"),
  addEngineButtonText: document.querySelector("#addEngine .button-text"),
  closeEngineModalButton: document.getElementById("closeEngineModal"),
  body: document.body,
  settingsButton: document.getElementById("settingsButton"),
  settingsPanel: document.getElementById("settingsPanel"),
};

let speedDialData = []; // Local variable for speed dial data
// let longPressTimerId = null; // ← state に移動したので不要
const LONG_PRESS_DURATION = 600; // ★ 長押し判定時間 (ミリ秒)

// --- Initialization ---
function init() {
  document.addEventListener("DOMContentLoaded", () => {
    AppSettings.load();

    elements.columnsInput.value = AppSettings.values.columns;
    speedDialData = AppSettings.values.speedDial;

    setupEventListeners();
    renderEngineList();
    initHelpContent();
    updateGrid();
    renderSpeedDial();

    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get("q");
    if (query) {
      elements.searchInput.value = query;
      updateSuggestions();
    }

    // --- 日付・時刻表示 初期化 ---
    updateDateTime();
    setInterval(updateDateTime, 1000);

    // --- ボタン状態 初期化 ---
    updateClearButtonVisibility();
    updateActionButtonState();
    updateCurrentEngineDisplay();

    feather.replace();
  });
}

// --- Date Time Display ---
function updateDateTime() {
  if (!elements.datetimeDisplay) return;
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][now.getDay()];
  const formattedDateTime = `${year}/${month}/${day} (${dayOfWeek}) ${hours}:${minutes}:${seconds}`;
  elements.datetimeDisplay.textContent = formattedDateTime;
}

// --- Event Listeners Setup ---
function setupEventListeners() {
  elements.searchInput.addEventListener(
    "input",
    debounce(updateSuggestions, 200)
  );
  elements.searchInput.addEventListener("focus", () => {
    if (elements.searchInput.value.trim()) updateSuggestions();
  });
  elements.searchInput.addEventListener("keydown", handleKeyboardNavigation);
  elements.searchInput.addEventListener("blur", () => {
    setTimeout(() => {
      if (
        elements.suggestionsContainer.style.display !== "block" ||
        !elements.suggestionsContainer.contains(document.activeElement)
      ) {
        state.originalInputValue = "";
      }
    }, 100);
  });

  // --- ボタンリスナー ---
  elements.romajiButton.addEventListener("click", () => {
    const currentValue = elements.searchInput.value;
    if (currentValue) {
      const options = {
        customRomajiMapping: {
          ちゃ: "cha",
          ちゅ: "chu",
          ちょ: "cho",
          しゃ: "sha",
          しゅ: "shu",
          しょ: "sho",
          じゃ: "ja",
          じゅ: "ju",
          じょ: "jo",
          し: "shi",
          ち: "chi",
          つ: "tsu",
          じ: "ji",
          ぢ: "ji",
          ず: "zu",
          づ: "zu", // or づ: 'du'
          ふ: "fu",
        },
      };
      const romajiValue = wanakana.toRomaji(currentValue, options);
      if (currentValue !== romajiValue) {
        elements.searchInput.value = romajiValue;
        elements.searchInput.focus();
        updateSuggestions();
        updateClearButtonVisibility(); // Keep this to hide/show based on new value
      }
    }
  });

  elements.clearButton.addEventListener("click", () => {
    elements.searchInput.value = "";
    elements.searchInput.focus();
    elements.suggestionsContainer.style.display = "none";
    state.lastQuery = "";
    state.originalInputValue = "";
    updateClearButtonVisibility();
    updateActionButtonState(); // ★ アクションボタン状態更新
    deactivateFallbackIndicator();
  });

  elements.actionButton.addEventListener("click", () => {
    const action = elements.actionButton.dataset.action;
    if (action === "paste") {
      processClipboard();
    } else if (action === "search") {
      executeSearch();
    }
  });

  // フォームの submit リスナー (Enterキー用)
  elements.searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    executeSearch();
  });

  // --- パネル/モーダル/その他リスナー ---
  document.addEventListener("click", (e) => {
    if (
      !elements.searchInput.contains(e.target) &&
      !elements.suggestionsContainer.contains(e.target)
    ) {
      elements.suggestionsContainer.style.display = "none";
    }
    if (
      !e.target.closest(".help-button") &&
      !e.target.closest(".help-content")
    ) {
      elements.body.classList.remove("help-visible");
    }
    if (!e.target.closest(".settings-area")) {
      closeSettingsPanel();
    }
  });

  elements.helpButton.addEventListener("click", (e) => {
    e.stopPropagation();
    elements.body.classList.toggle("help-visible");
    closeSettingsPanel();
  });

  elements.settingsButton.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleSettingsPanel();
    elements.body.classList.remove("help-visible");
  });
  elements.manageEnginesButton.addEventListener("click", () => {
    openEngineModal();
    closeSettingsPanel();
  });
  elements.columnsInput.addEventListener("input", handleColumnsChange);

  elements.saveSpeedDialButton.addEventListener("click", saveSpeedDial);
  elements.cancelModalButton.addEventListener("click", closeModal);
  elements.speedDialModal.addEventListener("click", (event) => {
    if (event.target === elements.speedDialModal) closeModal();
  });
  elements.addEngineButton.addEventListener("click", addOrUpdateEngine);
  elements.closeEngineModalButton.addEventListener("click", closeEngineModal);
  elements.engineModal.addEventListener("click", (event) => {
    if (event.target === elements.engineModal) closeEngineModal();
  });
  // URL入力欄の blur イベントリスナー (タイトル & ファビコン自動取得機能付き)
  elements.siteUrlInput.addEventListener("blur", async () => {
    const url = elements.siteUrlInput.value.trim();
    const siteNameInput = elements.siteNameInput;

    // --- 既存の処理を一旦実行 (入力値検証や基本的なプレビュー更新など) ---
    handleUrlInputBlur(); // (※この関数の役割は後で見直す)

    // --- URLが有効な場合のみ自動取得を実行 ---
    if (isValidHttpUrl(url)) {
      console.log(
        "[URL Blur] URL is valid, attempting to fetch title and favicon..."
      );

      // --- ローディング表示開始 ---
      setModalLoadingState(true); // ★ ローディング状態にする関数 (後で定義)
      // 既存のアイコン情報をクリア (取得中はイニシャル表示などにするため)
      state.fetchedIconUrl = null;
      updateFaviconPreview(state.manualIconDataUrl, siteNameInput.value || ""); // 手動アイコンがあれば表示、なければイニシャル

      try {
        // --- タイトルとファビコンを並行して取得 ---
        const [fetchedTitle, fetchedFaviconDataUrl] = await Promise.all([
          fetchTitleFromUrl(url),
          fetchFaviconFromUrl(url),
        ]);

        console.log("[URL Blur] Fetch results:", {
          fetchedTitle,
          hasFavicon: !!fetchedFaviconDataUrl,
        });

        // --- 結果を反映 (ユーザー入力がない場合) ---
        // サイト名
        if (fetchedTitle && siteNameInput.value.trim() === "") {
          siteNameInput.value = fetchedTitle;
        }

        // ファビコン (手動アイコンが選択されていなければ)
        if (fetchedFaviconDataUrl && !state.manualIconDataUrl) {
          state.fetchedIconUrl = fetchedFaviconDataUrl; // 取得したData URLをstateに保存
        }

        // --- 最終的なプレビュー更新 ---
        // サイト名が取得された or 既に入力されていた場合、それを使う
        const finalSiteName = siteNameInput.value.trim() || fetchedTitle || "";
        // 手動アイコン > 取得アイコン > イニシャル の優先順位で表示
        updateFaviconPreview(
          state.manualIconDataUrl || state.fetchedIconUrl,
          finalSiteName
        );
      } catch (error) {
        // Promise.all でエラーが発生した場合 (通常は各fetch関数内で処理されるはず)
        console.error("[URL Blur] Error during parallel fetch:", error);
        // エラー時も最終的なプレビューは更新しておく
        updateFaviconPreview(
          state.manualIconDataUrl,
          siteNameInput.value.trim() || ""
        );
      } finally {
        // --- ローディング表示終了 ---
        setModalLoadingState(false); // ★ ローディング状態を解除
      }
    } else {
      console.log("[URL Blur] URL is invalid or empty.");
      // URLが無効な場合、取得済みアイコンがあればクリアするなどの処理が必要か検討
      if (!state.manualIconDataUrl) {
        // 手動アイコンがなければ
        state.fetchedIconUrl = null;
        updateFaviconPreview(null, siteNameInput.value.trim() || ""); // イニシャル表示に戻す
      }
    }
  });

  // ★ 色調調整スライダーのイベントリスナー
  if (elements.hueSlider)
    elements.hueSlider.addEventListener("input", handleAdjustmentChange);
  if (elements.saturateSlider)
    elements.saturateSlider.addEventListener("input", handleAdjustmentChange);
  if (elements.brightnessSlider)
    elements.brightnessSlider.addEventListener("input", handleAdjustmentChange);

  // ★ 色調調整リセットボタンのリスナー
  if (elements.resetAdjustmentButton)
    elements.resetAdjustmentButton.addEventListener("click", resetAdjustments);

  elements.fetchFaviconButton.addEventListener("click", fetchAndCacheFavicon);
  elements.siteIconInput.addEventListener("change", handleManualIconSelect);

  // ★ エンジン表示部分のクリック/キーダウンでメニューを開閉
  if (elements.currentEngineDisplay) {
    elements.currentEngineDisplay.addEventListener("click", (event) => {
      event.stopPropagation(); // 親要素への伝播を停止
      if (elements.engineSelectMenu.style.display === "block") {
        closeEngineSelectMenu();
      } else {
        openEngineSelectMenu();
      }
    });
    elements.currentEngineDisplay.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (elements.engineSelectMenu.style.display === "block") {
          closeEngineSelectMenu();
        } else {
          openEngineSelectMenu();
        }
      } else if (e.key === "Escape") {
        if (elements.engineSelectMenu.style.display === "block") {
          closeEngineSelectMenu();
          elements.currentEngineDisplay.focus(); // フォーカスを戻す
        }
      }
    });
  }

  // ★ メニュー外クリックでメニューを閉じる
  document.addEventListener("click", (event) => {
    if (
      elements.engineSelectMenu &&
      elements.engineSelectMenu.style.display === "block"
    ) {
      if (
        !elements.engineSelectMenu.contains(event.target) &&
        !elements.currentEngineDisplay.contains(event.target)
      ) {
        closeEngineSelectMenu();
      }
    }
  });

  // ★ 検索入力時にエンジン表示も更新
  elements.searchInput.addEventListener("input", updateCurrentEngineDisplay);

  // ★★★ 背景クリックで編集モードを終了するリスナー ★★★
  const container = document.querySelector(".container"); // bodyではなくcontainerを対象に
  if (container) {
    container.addEventListener("click", (event) => {
      // --- 編集モード中でなければ何もしない ---
      if (!state.isEditMode) {
        return;
      }

      // --- クリックされた要素が編集モード維持に必要な要素か判定 ---
      const clickedOnSpeedDialItem = event.target.closest(
        ".speed-dial-item:not(.add-button-item)"
      ); // スピードダイアル項目(追加ボタン除く)
      const clickedOnSettingsArea = event.target.closest(".settings-area"); // 設定ボタンとパネル
      const clickedOnModal = event.target.closest(".modal"); // モーダル自体

      // ★ モーダルが表示されている場合は終了しない
      if (
        elements.speedDialModal.classList.contains("visible") ||
        elements.engineModal.classList.contains("visible")
      ) {
        return;
      }

      // --- 維持すべき要素以外をクリックした場合 ---
      if (
        !clickedOnSpeedDialItem &&
        !clickedOnSettingsArea &&
        !clickedOnModal
      ) {
        console.log("Background clicked, exiting edit mode.");
        toggleEditMode(); // 編集モードを終了
      }
    });
  } else {
    console.error("Container element not found for background click listener.");
  }

  document.addEventListener("visibilitychange", handleVisibilityChange);
}

function toggleSettingsPanel() {
  const isVisible = elements.settingsPanel.classList.toggle("visible");
  if (isVisible) {
    feather.replace();
  }
}

function closeSettingsPanel() {
  elements.settingsPanel.classList.remove("visible");
}

// --- Clear Button Visibility ---
function updateClearButtonVisibility() {
  if (elements.clearButton && elements.searchInput) {
    const hasValue = elements.searchInput.value.length > 0;
    elements.clearButton.style.display = hasValue ? "flex" : "none";
  }
}

// --- Action Button State ---
function updateActionButtonState() {
  if (!elements.actionButton || !elements.searchInput) return;

  const isEmpty = elements.searchInput.value.length === 0;
  const iconName = isEmpty ? "clipboard" : "search";
  const titleText = isEmpty ? "クリップボードから貼り付け" : "検索";
  const ariaLabelText = isEmpty ? "貼り付け" : "検索";
  const actionType = isEmpty ? "paste" : "search";

  // ★ dataset.action が変更された場合のみ属性とアイコンを更新
  if (elements.actionButton.dataset.action !== actionType) {
    elements.actionButton.title = titleText;
    elements.actionButton.setAttribute("aria-label", ariaLabelText);
    elements.actionButton.dataset.action = actionType;

    // ★★★ ボタンの中身を新しい <i> タグで上書きする ★★★
    elements.actionButton.innerHTML = `<i data-feather="${iconName}"></i>`;

    // ★★★ その後、ページ全体の feather.replace() を呼び出す ★★★
    // (特定の要素だけ更新する方法もあるが、まずは全体更新で確実性を優先)
    feather.replace();
  }
}

// --- Current Engine Display ---
/**
 * 検索ボックスの内容に基づいて現在のエンジン表示を更新する
 */
function updateCurrentEngineDisplay() {
  if (!elements.currentEngineDisplay) return;

  const input = elements.searchInput.value;
  const parts = input.split(" ");
  const potentialNickname = parts[0].toLowerCase();
  let displayEngineKey = "g"; // デフォルトは Google

  // 入力があり、最初の部分が有効なエンジンニックネームで、検索語句もある場合
  if (
    input.trim() &&
    AppSettings.values.engines[potentialNickname] &&
    parts.length > 1
  ) {
    displayEngineKey = potentialNickname;
  }
  // 入力がニックネームのみの場合も、そのエンジンを表示する（スペースなしでも）
  else if (
    AppSettings.values.engines[potentialNickname] &&
    parts.length === 1
  ) {
    displayEngineKey = potentialNickname;
  }

  const engineData = AppSettings.values.engines[displayEngineKey];
  if (!engineData) {
    console.warn("updateCurrentEngineDisplay: Default engine 'g' not found?");
    return; // デフォルトエンジンが見つからない場合は何もしない
  }

  // アイコンまたはイニシャルを設定
  // スピードダイアルと同様のアイコン取得ロジックを使う
  // 注意: ここでは簡略化のため、エンジンのニックネーム自体を iconKey として favicons キャッシュを探す
  // ★★★ engineData.iconUrl を使用 ★★★
  const iconUrl = engineData.iconUrl;

  if (iconUrl) {
    // iconUrl が存在する場合
    elements.currentEngineIcon.src = iconUrl;
    elements.currentEngineIcon.alt = engineData.name;
    elements.currentEngineIcon.style.display = "block";
    elements.currentEngineInitial.style.display = "none";
    // ★ エラーハンドリング (任意だが推奨)
    elements.currentEngineIcon.onerror = () => {
      console.warn(`Failed to load engine icon: ${iconUrl}`);
      // エラー時はイニシャル表示にフォールバック
      displayInitialIcon(
        elements.currentEngineInitial,
        elements.currentEngineIcon,
        engineData.name
      );
    };
    elements.currentEngineIcon.onload = () => {
      // 読み込み成功時は何もしない (onerrorをリセットするならここで)
      // elements.currentEngineIcon.onerror = null;
    };
  } else {
    // iconUrl がない場合はイニシャル表示
    displayInitialIcon(
      elements.currentEngineInitial,
      elements.currentEngineIcon,
      engineData.name
    );
  }

  // (任意) エンジン名を表示する場合
  // if (elements.currentEngineName) {
  //     elements.currentEngineName.textContent = engineData.name;
  // }

  // アクセシビリティ情報更新
  elements.currentEngineDisplay.title = `現在のエンジン: ${engineData.name} (クリックで変更)`;
}

// ★ イニシャル表示用のヘルパー関数 (共通化のため)
function displayInitialIcon(initialElement, iconElement, name) {
  const initial = name.charAt(0).toUpperCase() || "?";
  if (initialElement) {
    initialElement.textContent = initial;
    initialElement.style.display = "flex";
  }
  if (iconElement) {
    iconElement.style.display = "none";
    iconElement.src = ""; // srcをクリア
  }
}

// --- Engine Select Menu ---
/**
 * エンジン選択メニューを開く
 */
function openEngineSelectMenu() {
  if (!elements.engineSelectMenu || !elements.currentEngineDisplay) return;

  elements.engineSelectMenu.innerHTML = ""; // 中身をクリア
  const fragment = document.createDocumentFragment();

  // AppSettings.values.engines からエンジンリストを取得しソート (例: ニックネーム順)
  const sortedNicknames = Object.keys(AppSettings.values.engines).sort();

  sortedNicknames.forEach((nickname) => {
    const engine = AppSettings.values.engines[nickname];
    if (!engine) return; // 念のため
    const item = document.createElement("div");

    item.className = "engine-select-item";
    item.setAttribute("role", "option");
    item.setAttribute("tabindex", "0"); // フォーカス可能に
    item.dataset.nickname = nickname; // ニックネームをdata属性に保存

    // ★★★ engineData.iconUrl を使用 ★★★
    const iconUrl = engine.iconUrl;
    let iconElement;

    if (iconUrl) {
      // iconUrl が存在する場合
      iconElement = document.createElement("img");
      iconElement.src = iconUrl;
      iconElement.alt = engine.name;
      iconElement.loading = "lazy"; // 遅延読み込み
      // ★ エラーハンドリング
      iconElement.onerror = () => {
        console.warn(`Failed to load menu engine icon: ${iconUrl}`);
        // エラー時はイニシャル表示に置き換える
        const initialFallback = createInitialIcon(engine.name);
        initialFallback.classList.add("initial-icon");
        iconElement.replaceWith(initialFallback);
      };
    } else {
      // iconUrl がない場合はイニシャル表示
      iconElement = createInitialIcon(engine.name);
      iconElement.classList.add("initial-icon");
    }
    item.appendChild(iconElement);

    // エンジン名
    const nameSpan = document.createElement("span");
    nameSpan.textContent = engine.name;
    item.appendChild(nameSpan);

    // --- クリック/キーダウンイベントリスナー ---
    item.addEventListener("click", () => selectEngineFromMenu(nickname));
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        selectEngineFromMenu(nickname);
      }
    });

    fragment.appendChild(item);
  });

  elements.engineSelectMenu.appendChild(fragment);
  elements.engineSelectMenu.style.display = "block";
  elements.currentEngineDisplay.setAttribute("aria-expanded", "true");
  // メニュー内の最初の項目にフォーカスを当てる (任意)
  const firstItem = elements.engineSelectMenu.querySelector(
    ".engine-select-item"
  );
  if (firstItem) {
    // setTimeout(() => firstItem.focus(), 0); // 少し遅らせる
  }
  feather.replace(); // アイコン再描画 (もしあれば)
  console.log("Engine select menu opened");
}

/**
 * エンジン選択メニューを閉じる
 */
function closeEngineSelectMenu() {
  if (elements.engineSelectMenu) {
    elements.engineSelectMenu.style.display = "none";
  }
  if (elements.currentEngineDisplay) {
    elements.currentEngineDisplay.setAttribute("aria-expanded", "false");
  }
  console.log("Engine select menu closed");
}

/**
 * メニューからエンジンを選択したときの処理
 * @param {string} nickname - 選択されたエンジンのニックネーム
 */
function selectEngineFromMenu(nickname) {
  console.log(`Engine selected: ${nickname}`);
  const currentInput = elements.searchInput.value;
  const parts = currentInput.split(" ");
  let newInputValue = "";

  // 既にニックネームらしきものがあるか判定
  if (parts.length > 1 && AppSettings.values.engines[parts[0].toLowerCase()]) {
    // 既存のニックネームを置き換える
    newInputValue = nickname + " " + parts.slice(1).join(" ");
  } else if (currentInput.trim() === "") {
    // 入力が空ならニックネームとスペースを追加
    newInputValue = nickname + " ";
  } else {
    // それ以外（検索語句のみ、または無効なニックネーム）の場合は先頭に追加
    newInputValue = nickname + " " + currentInput;
  }

  elements.searchInput.value = newInputValue;
  closeEngineSelectMenu();
  elements.searchInput.focus(); // 検索ボックスにフォーカスを戻す
  updateCurrentEngineDisplay(); // 表示を更新
  updateSuggestions(); // サジェストも更新
  updateClearButtonVisibility();
  updateActionButtonState();
}

// --- Search & Suggestions ---
function updateSuggestions() {
  // deactivateFallbackIndicator(); // ★ 時間経過以外での解除は削除
  updateClearButtonVisibility();
  updateActionButtonState();
  const input = elements.searchInput.value.trim();
  state.originalInputValue = elements.searchInput.value;
  if (!input) {
    elements.suggestionsContainer.style.display = "none";
    state.lastQuery = "";
    return;
  }

  const parts = input.split(" ");
  const nickname = parts[0].toLowerCase();
  const searchTerms = parts.slice(1).join(" ");

  let query = input;
  let engine = "g";

  if (AppSettings.values.engines[nickname] && searchTerms) {
    engine = nickname;
    query = searchTerms;
  }

  const cacheKey = `${engine}_${query}`;

  if (query === state.lastQuery && state.actualEngine === engine) {
    if (cache.suggestions[cacheKey]) {
      displaySuggestions(cache.suggestions[cacheKey]);
    }
    return;
  }

  state.lastQuery = query;
  state.actualEngine = engine;

  fetchSuggestions(query, engine);
}

// ★ fetchSuggestions 関数は【方法3】の修正済みコードを想定
async function fetchSuggestions(query, engine) {
  console.log(`[fetchSuggestions] START - Engine: ${engine}, Query: ${query}`);
  const engineData = AppSettings.values.engines[engine];
  if (!engineData) {
    console.warn(`[fetchSuggestions] Engine not found: ${engine}`);
    displaySuggestions([]);
    return;
  }

  const useProxy =
    (typeof engineData.suggestUrl === "string" &&
      engineData.suggestUrl === engine) ||
    PROXY_TARGET_URLS[engine];
  const jsonpUrl =
    !useProxy &&
    typeof engineData.suggestUrl === "string" &&
    engineData.suggestUrl.startsWith("http")
      ? engineData.suggestUrl
      : null;

  console.log(
    `[fetchSuggestions] DEBUG - useProxy: ${useProxy}, jsonpUrl: ${jsonpUrl}`
  );

  if (useProxy) {
    console.log("[fetchSuggestions] Entering useProxy block");
    // ★★★ SUGGEST_PROXY_URL のチェックを削除 ★★★
    // if (!SUGGEST_PROXY_URL || SUGGEST_PROXY_URL.includes('your-proxy-name')) {
    //    console.error("SUGGEST_PROXY_URL is not configured.");
    //    displaySuggestions([]);
    //    return;
    // }

    const targetApiUrl = PROXY_TARGET_URLS[engine];
    if (!targetApiUrl) {
      console.error(
        `[fetchSuggestions] Target API URL for proxy engine '${engine}' not found in PROXY_TARGET_URLS.`
      );
      displaySuggestions([]);
      // tryFallbackToJsonp(query, engine, 'Target URL not found'); // 必要ならフォールバック
      return;
    }

    const encodedQuery = encodeURIComponent(query);
    const encodedTargetUrl = encodeURIComponent(targetApiUrl);
    // ★ proxyUrl は相対パスのまま
    const proxyUrl = `/suggest?engine=${engine}&q=${encodedQuery}&target_url=${encodedTargetUrl}`;

    console.log(`[fetchSuggestions] Fetching via proxy: ${proxyUrl}`);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // タイムアウトを5秒に短縮 (任意)

      const response = await fetch(proxyUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      console.log(
        `[fetchSuggestions] Proxy fetch completed for ${engine}, Status: ${response.status}`
      );

      if (!response.ok) {
        console.error(
          `[fetchSuggestions] Proxy request failed: ${response.status} ${response.statusText}`
        );
        const errorData = await response.json().catch(() => ({})); // エラー内容取得試行
        console.error("[fetchSuggestions] Proxy error details:", errorData);
        // ★ JSONPフォールバックは method 4 では不要になる可能性が高い
        // tryFallbackToJsonp(query, engine, 'Proxy response not OK');
        displaySuggestions([]); // エラー時は候補をクリア
        return;
      }
      const data = await response.json();
      console.log(
        `[fetchSuggestions] Received proxy data for ${engine}, calling processSuggestionData...`
      );
      processSuggestionData(data, engine, query); // ★ dataを渡す
    } catch (error) {
      if (error.name === "AbortError") {
        console.error(
          `[fetchSuggestions] Proxy request explicit timeout for ${engine}`
        );
      } else {
        console.error(
          `[fetchSuggestions] Error fetching suggestions via proxy for ${engine}:`,
          error
        );
      }
      // ★ JSONPフォールバックは method 4 では不要になる可能性が高い
      // tryFallbackToJsonp(query, engine, error.name || 'Fetch error');
      displaySuggestions([]); // エラー時は候補をクリア
    } finally {
      console.log("[fetchSuggestions] Exiting useProxy block");
    }
  } else if (jsonpUrl) {
    // ★ JSONP処理も method 4 では不要になる可能性が高い (プロキシ経由に統一できるため)
    //    もし残すなら、この部分はそのまま
    console.log(
      "[fetchSuggestions] Using JSONP directly (no proxy configured)"
    );
    fetchSuggestionsViaJsonp(query, engine, jsonpUrl);
  } else {
    console.log(
      `[fetchSuggestions] No suggestion support configured for engine: ${engine}`
    );
    displaySuggestions([]);
  }
  console.log(`[fetchSuggestions] END - Engine: ${engine}`);
}

function tryFallbackToJsonp(query, engine, errorReason) {
  console.warn(
    `[tryFallbackToJsonp] Proxy failed for ${engine} (Reason: ${errorReason}). Checking for JSONP fallback...`
  );

  let fallbackUrl = JSONP_FALLBACK_URLS[engine];
  let isDefaultFallback = false;
  if (!fallbackUrl && JSONP_FALLBACK_URLS["g"]) {
    console.log(
      `[tryFallbackToJsonp] No specific JSONP URL for ${engine}. Defaulting to Google JSONP fallback.`
    );
    fallbackUrl = JSONP_FALLBACK_URLS["g"];
    isDefaultFallback = true;
  }

  if (fallbackUrl) {
    let finalFallbackUrl = fallbackUrl;
    if (fallbackUrl.includes("google.com/complete/search")) {
      const targetLang = engine === "ge" ? "en" : "ja";
      console.log(
        `[tryFallbackToJsonp] Setting Google JSONP language (hl) to: ${targetLang}`
      );
      if (finalFallbackUrl.includes("hl=")) {
        finalFallbackUrl = finalFallbackUrl.replace(
          /hl=[a-z]{2}(&|$)/,
          `hl=${targetLang}$1`
        );
      } else {
        finalFallbackUrl +=
          (finalFallbackUrl.includes("?") ? "&" : "?") + `hl=${targetLang}`;
      }
    }

    const fallbackEngineName = isDefaultFallback
      ? `${engine} (via Google)`
      : engine;
    console.log(
      `[tryFallbackToJsonp] Attempting JSONP fallback for ${fallbackEngineName} using URL: ${finalFallbackUrl}`
    );

    activateFallbackIndicator(); // ★ インジケーター有効化

    fetchSuggestionsViaJsonp(query, engine, finalFallbackUrl);
  } else {
    console.log(
      `[tryFallbackToJsonp] No JSONP fallback available (including default Google) for ${engine}. Clearing suggestions.`
    );
    displaySuggestions([]);
    deactivateFallbackIndicator(); // ★ インジケーター解除
  }
}

function fetchSuggestionsViaJsonp(query, engine, jsonpUrlBase) {
  console.log(`[fetchSuggestionsViaJsonp] Fetching via JSONP for ${engine}`);
  const callbackName = `handleSuggestions_${engine}_${Date.now()}`;
  let timedOut = false;
  let timeoutId = null;

  window[callbackName] = (data) => {
    if (timedOut) return;
    clearTimeout(timeoutId);
    console.log(
      `[fetchSuggestionsViaJsonp] JSONP callback executed for ${engine}`
    );
    processSuggestionData(data, engine, query);
    try {
      delete window[callbackName];
      const script = document.getElementById(callbackName);
      if (script && script.parentNode) script.parentNode.removeChild(script);
    } catch (e) {
      console.warn("[fetchSuggestionsViaJsonp] JSONP Cleanup E:", e);
    }
  };

  const script = document.createElement("script");
  script.id = callbackName;
  let fullSuggestUrl = jsonpUrlBase;
  const encodedQuery = encodeURIComponent(query);
  let queryParam = "q";
  let callbackParam = "callback";

  if (jsonpUrlBase.includes("google.com/complete/search")) {
    queryParam = "q";
    callbackParam = "jsonp";
  } else if (jsonpUrlBase.includes("wikipedia.org")) {
    queryParam = "search";
    callbackParam = "callback";
  }

  fullSuggestUrl +=
    (jsonpUrlBase.includes("?") ? "&" : "?") + `${queryParam}=${encodedQuery}`;
  fullSuggestUrl += `&${callbackParam}=${callbackName}`;

  console.log(
    `[fetchSuggestionsViaJsonp] Constructed JSONP URL: ${fullSuggestUrl}`
  );
  script.src = fullSuggestUrl;

  script.onerror = (e) => {
    if (timedOut) return;
    clearTimeout(timeoutId);
    console.error(
      `[fetchSuggestionsViaJsonp] JSONP request failed for ${engine}:`,
      e
    );
    displaySuggestions([]);
    try {
      delete window[callbackName];
      if (script.parentNode) script.parentNode.removeChild(script);
    } catch (cleanErr) {
      console.warn(
        "[fetchSuggestionsViaJsonp] JSONP Error Cleanup Err:",
        cleanErr
      );
    }
  };

  document.body.appendChild(script);
  console.log(`[fetchSuggestionsViaJsonp] JSONP script appended for ${engine}`);

  timeoutId = setTimeout(() => {
    timedOut = true;
    if (window[callbackName]) {
      console.warn(
        `[fetchSuggestionsViaJsonp] ★★★ JSONP Timeout occurred for ${engine} ★★★`
      );
      window[callbackName] = () => {
        console.log(
          `[fetchSuggestionsViaJsonp] Dummy callback called for timed out JSONP ${engine}`
        );
      };
      try {
        const script = document.getElementById(callbackName);
        if (script && script.parentNode) script.parentNode.removeChild(script);
        console.log(
          `[fetchSuggestionsViaJsonp] Cleaned up timed out script for ${engine}`
        );
      } catch (cleanErr) {
        console.warn(
          "[fetchSuggestionsViaJsonp] JSONP Timeout Clean Err:",
          cleanErr
        );
      }
      const current = getCurrentEngineAndQuery();
      if (current.engine === engine && current.query === query) {
        displaySuggestions([]);
      }
    }
  }, 5000);
  console.log(
    `[fetchSuggestionsViaJsonp] JSONP timeout set for ${engine} (ID: ${timeoutId})`
  );
}

function getCurrentEngineAndQuery() {
  const currentInput = elements.searchInput.value.trim();
  const currentParts = currentInput.split(" ");
  const currentNickname = currentParts[0].toLowerCase();
  let currentQuery = currentInput;
  let currentEngine = "g";

  if (AppSettings.values.engines[currentNickname] && currentParts.length > 1) {
    currentEngine = currentNickname;
    currentQuery = currentParts.slice(1).join(" ");
  }
  return { engine: currentEngine, query: currentQuery };
}

function processSuggestionData(data, engine, query) {
  console.log(`Processing suggestions for ${engine}:`, data);
  let suggestions = [];
  try {
    if (
      (engine === "g" || engine === "ge" || engine === "y" || engine === "w") &&
      Array.isArray(data) &&
      Array.isArray(data[1])
    ) {
      suggestions = data[1].filter((s) => typeof s === "string");
    } else if (
      (engine === "b" || engine === "d") &&
      Array.isArray(data) &&
      Array.isArray(data[1])
    ) {
      suggestions = data[1].filter((s) => typeof s === "string");
    } else if (
      (engine === "b" || engine === "d") &&
      Array.isArray(data) &&
      data.length > 0 &&
      typeof data[0] === "object" &&
      data[0] !== null &&
      "phrase" in data[0]
    ) {
      suggestions = data.map((item) => item.phrase).filter(Boolean);
    } else {
      console.warn(
        `Unexpected or unhandled suggestion data format for ${engine}:`,
        data
      );
      if (Array.isArray(data)) {
        suggestions = data.filter((s) => typeof s === "string");
      }
    }
  } catch (e) {
    console.error("Error processing suggestion data:", e, data);
  }

  console.log(`Extracted suggestions for ${engine}:`, suggestions);

  const cacheKey = `${engine}_${query}`;
  cache.suggestions[cacheKey] = suggestions;

  const current = getCurrentEngineAndQuery();

  if (current.engine === engine && current.query === query) {
    displaySuggestions(suggestions);
  } else {
    console.log("Suggestion received, but input changed. Ignoring.");
  }
}

function displaySuggestions(suggestions) {
  // deactivateFallbackIndicator(); // ★ 時間経過以外での解除は削除
  elements.suggestionsContainer.innerHTML = "";
  if (!suggestions || suggestions.length === 0) {
    elements.suggestionsContainer.style.display = "none";
    return;
  }

  const fragment = document.createDocumentFragment();
  suggestions.forEach((suggestionText) => {
    const item = document.createElement("div");
    item.className = "suggestion-item";
    item.setAttribute("role", "option");
    item.setAttribute("tabindex", "-1");

    const engineIndicator = document.createElement("span");
    engineIndicator.className = "engine-indicator";
    engineIndicator.textContent =
      AppSettings.values.engines[state.actualEngine]?.name + ": ";

    const textSpan = document.createElement("span");
    textSpan.className = "suggestion-text";
    textSpan.textContent = suggestionText;

    const arrowButton = document.createElement("button");
    arrowButton.className = "arrow-button";
    arrowButton.innerHTML = '<i data-feather="arrow-right"></i>';
    arrowButton.setAttribute("aria-label", "入力欄にコピー");
    arrowButton.type = "button";
    arrowButton.addEventListener("click", (e) => {
      e.stopPropagation();
      applySuggestionToBox(suggestionText);
    });

    item.appendChild(engineIndicator);
    item.appendChild(textSpan);
    item.appendChild(arrowButton);

    item.addEventListener("click", () => {
      executeSearchWithSuggestion(suggestionText);
    });

    fragment.appendChild(item);
  });

  elements.suggestionsContainer.appendChild(fragment);
  elements.suggestionsContainer.style.display = "block";
  feather.replace();
  state.selectedSuggestionIndex = -1;
}

function applySuggestionToBox(suggestion) {
  elements.searchInput.value =
    state.actualEngine !== "g"
      ? state.actualEngine + " " + suggestion
      : suggestion;
  elements.searchInput.focus();
  elements.searchInput.selectionStart = elements.searchInput.selectionEnd =
    elements.searchInput.value.length;
  elements.suggestionsContainer.style.display = "none";
  state.originalInputValue = elements.searchInput.value;
  updateClearButtonVisibility(); // ★ 追加
  updateActionButtonState(); // ★ 追加
}

function executeSearchWithSuggestion(suggestion) {
  const searchUrl = AppSettings.values.engines[state.actualEngine]?.url.replace(
    /%s/g,
    encodeURIComponent(suggestion)
  );
  if (searchUrl) {
    window.location.href = searchUrl;
  } else {
    console.error(
      "Cannot execute search, engine URL not found for:",
      state.actualEngine
    );
  }
}

function executeSearch() {
  // deactivateFallbackIndicator(); // ★ 時間経過以外での解除は削除
  const input = elements.searchInput.value.trim();
  if (!input) return;

  const parts = input.split(" ");
  const nickname = parts[0].toLowerCase();
  const searchTerms = parts.slice(1).join(" ");

  let searchUrl = "";
  let targetEngine = "g";

  if (AppSettings.values.engines[nickname] && searchTerms) {
    targetEngine = nickname;
    searchUrl = AppSettings.values.engines[nickname].url.replace(
      /%s/g,
      encodeURIComponent(searchTerms)
    );
  } else {
    const googleUrl =
      AppSettings.values.engines["g"]?.url || builtinEngines["g"].url;
    searchUrl = googleUrl.replace(/%s/g, encodeURIComponent(input));
  }

  if (searchUrl) {
    window.location.href = searchUrl;
  } else {
    alert("検索URLの生成に失敗しました。エンジン設定を確認してください。");
  }
}

function handleKeyboardNavigation(e) {
  const suggestions =
    elements.suggestionsContainer.querySelectorAll(".suggestion-item");
  const suggestionCount = suggestions.length;

  if (
    suggestionCount === 0 ||
    elements.suggestionsContainer.style.display === "none"
  ) {
    if (e.key === "Enter") {
      executeSearch();
    }
    return;
  }

  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      if (state.selectedSuggestionIndex < suggestionCount - 1) {
        state.selectedSuggestionIndex++;
      } else {
        state.selectedSuggestionIndex = -1;
      }
      updateSelectedSuggestion(suggestions);
      break;
    case "ArrowUp":
      e.preventDefault();
      if (state.selectedSuggestionIndex > 0) {
        state.selectedSuggestionIndex--;
      } else {
        state.selectedSuggestionIndex = -1;
      }
      updateSelectedSuggestion(suggestions);
      break;
    case "Enter":
      e.preventDefault();
      if (state.selectedSuggestionIndex !== -1) {
        const selectedItem = suggestions[state.selectedSuggestionIndex];
        const suggestionText =
          selectedItem.querySelector(".suggestion-text").textContent;
        executeSearchWithSuggestion(suggestionText);
      } else {
        executeSearch();
      }
      break;
    case "Escape":
      e.preventDefault();
      // deactivateFallbackIndicator(); // ★ 時間経過以外での解除は削除
      elements.suggestionsContainer.style.display = "none";
      state.selectedSuggestionIndex = -1;
      elements.searchInput.value = state.originalInputValue;
      updateClearButtonVisibility(); // ★ 追加
      updateActionButtonState(); // ★ 追加
      break;
    case "Tab":
      if (suggestionCount > 0) {
        e.preventDefault();
        let suggestionToApply = "";
        if (state.selectedSuggestionIndex !== -1) {
          suggestionToApply =
            suggestions[state.selectedSuggestionIndex].querySelector(
              ".suggestion-text"
            ).textContent;
        } else {
          suggestionToApply =
            suggestions[0].querySelector(".suggestion-text").textContent;
          state.selectedSuggestionIndex = 0;
          updateSelectedSuggestion(suggestions);
        }
        applySuggestionToBox(suggestionToApply);
      }
      break;
  }
}

function updateSelectedSuggestion(suggestions) {
  suggestions.forEach((item, index) => {
    if (index === state.selectedSuggestionIndex) {
      item.classList.add("selected");
      item.setAttribute("aria-selected", "true");
      item.scrollIntoView({ block: "nearest", inline: "nearest" });
      const suggestionText = item.querySelector(".suggestion-text").textContent;
      elements.searchInput.value =
        state.actualEngine !== "g"
          ? state.actualEngine + " " + suggestionText
          : suggestionText;
      updateClearButtonVisibility(); // ★ 追加
      updateActionButtonState(); // ★ 追加
    } else {
      item.classList.remove("selected");
      item.setAttribute("aria-selected", "false");
    }
  });

  if (state.selectedSuggestionIndex === -1) {
    elements.searchInput.value = state.originalInputValue;
    updateClearButtonVisibility(); // ★ 追加
    updateActionButtonState(); // ★ 追加
  }
}

// --- Clipboard Processing ---
async function processClipboard() {
  if (!navigator.clipboard || !navigator.clipboard.readText) {
    alert("クリップボードの読み取りがブラウザでサポートされていません。");
    return;
  }
  try {
    const text = await navigator.clipboard.readText();
    if (!text) return; // Nothing on clipboard

    const trimmedText = text.trim();
    // Basic URL detection (starts with http/https/www or contains '.' without spaces)
    const isUrl =
      /^(https?:\/\/|www\.)/i.test(trimmedText) ||
      (trimmedText.includes(".") && !trimmedText.includes(" "));

    if (isUrl) {
      // It looks like a URL, try to navigate
      let url = trimmedText;
      if (
        !trimmedText.startsWith("http://") &&
        !trimmedText.startsWith("https://")
      ) {
        url = "https://" + trimmedText; // Assume https if protocol is missing
      }
      console.log("Navigating to URL from clipboard:", url); // ★ ログ追加 (デバッグ用)
      window.location.href = url;
    } else {
      // Not a URL, treat as search term and execute search directly
      console.log("Executing search with text from clipboard:", text); // ★ ログ追加 (デバッグ用)
      // ★★★ 検索ボックスへの値設定を削除 ★★★
      // elements.searchInput.value = text;

      // Execute search using the default engine directly
      const defaultEngineKey = AppSettings.values.engines["g"]
        ? "g"
        : Object.keys(AppSettings.values.engines)[0]; // デフォルトエンジンキーを取得 (Google優先)
      if (defaultEngineKey && AppSettings.values.engines[defaultEngineKey]) {
        // ★★★ クリップボードのテキストを使って検索URLを生成 ★★★
        const searchUrl = AppSettings.values.engines[
          defaultEngineKey
        ].url.replace(/%s/g, encodeURIComponent(text)); // Use 'text' directly from clipboard
        console.log("Default search URL:", searchUrl); // ★ ログ追加 (デバッグ用)
        window.location.href = searchUrl; // Navigate to search results
      } else {
        alert("デフォルトの検索エンジン (g) が設定されていません。"); // エラーメッセージを具体的に
      }
    }
  } catch (err) {
    console.error("Clipboard read error:", err);
    // Inform user about potential permission issues or HTTPS requirement
    if (location.protocol !== "https:") {
      alert(
        "クリップボードへのアクセスは、安全な接続 (HTTPS) でのみ許可される場合があります。"
      );
    } else {
      alert("クリップボードの読み取りに失敗しました。権限を確認してください。");
    }
  }
}

// --- Speed Dial Management ---
function handleColumnsChange() {
  const columnsInput = elements.columnsInput;
  const columns = parseInt(columnsInput.value, 10);
  const minCols = parseInt(columnsInput.min, 10);
  const maxCols = parseInt(columnsInput.max, 10);
  if (!isNaN(columns) && columns >= minCols && columns <= maxCols) {
    AppSettings.setColumns(columns);
    updateGrid(columns);
  } else {
    console.warn("Invalid column value entered:", columnsInput.value);
  }
}

function updateGrid(columns = null) {
  const colsToUse = columns !== null ? columns : AppSettings.values.columns;
  const minCols = parseInt(elements.columnsInput.min, 10);
  const maxCols = parseInt(elements.columnsInput.max, 10);
  const validColsToUse = Math.max(minCols, Math.min(maxCols, colsToUse));
  elements.speedDialGrid.style.gridTemplateColumns = `repeat(${validColsToUse}, 1fr)`;
}

function createInitialIcon(name) {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
  const icon = document.createElement("div");
  icon.className = "initial-icon";
  icon.textContent = initials || "?";
  return icon;
}

function createSpeedDialItem(data, index) {
  const item = document.createElement("div");
  item.className = "speed-dial-item";
  item.dataset.index = index;
  item.draggable = state.isEditMode;

  const link = document.createElement("a");
  link.href = data.url;
  link.className = "speed-dial-link";
  link.rel = "noopener noreferrer";

  const textSpan = document.createElement("span");
  textSpan.textContent = data.name;

  let iconElement;
  const faviconUrl = AppSettings.values.favicons[data.iconKey] || data.icon;

  if (faviconUrl && faviconUrl.startsWith("data:image")) {
    // 画像の場合のみ
    iconElement = document.createElement("img");
    iconElement.src = faviconUrl;
    iconElement.alt = data.name;
    iconElement.loading = "lazy";

    // ★★★ 保存された adjustment データに基づいて filter スタイルを適用 ★★★
    const adj = data.adjustment || { hue: 0, saturate: 100, brightness: 100 }; // デフォルト値
    iconElement.style.filter = `hue-rotate(${adj.hue}deg) saturate(${adj.saturate}%) brightness(${adj.brightness}%)`;
    iconElement.onerror = () => {
      console.warn("Error loading speed dial icon:", faviconUrl);
      iconElement.replaceWith(createInitialIcon(data.name));
    };
  } else {
    // 画像でない場合 (イニシャルなど)
    iconElement = createInitialIcon(data.name);
    // イニシャルアイコンにはフィルターを適用しない
  }

  link.appendChild(iconElement);
  link.appendChild(textSpan);

  const buttonsContainer = document.createElement("div");
  buttonsContainer.className = "speed-dial-item-buttons";

  const editButton = document.createElement("button");
  editButton.className = "speed-dial-item-button";
  editButton.innerHTML = '<i data-feather="edit-2"></i>';
  editButton.setAttribute("aria-label", "編集");
  editButton.type = "button";
  editButton.addEventListener("click", (event) => {
    event.stopPropagation();
    openEditModal(index);
  });

  const deleteButton = document.createElement("button");
  deleteButton.className = "speed-dial-item-button";
  deleteButton.innerHTML = '<i data-feather="trash-2"></i>';
  deleteButton.setAttribute("aria-label", "削除");
  deleteButton.type = "button";
  deleteButton.addEventListener("click", (event) => {
    event.stopPropagation();
    deleteSpeedDial(index);
  });

  buttonsContainer.appendChild(editButton);
  buttonsContainer.appendChild(deleteButton);

  item.appendChild(link);
  item.appendChild(buttonsContainer);

  return item;
}

function renderSpeedDial() {
  elements.speedDialGrid.innerHTML = ""; // グリッドをクリア

  // --- 各スピードダイアル項目をレンダリング ---
  AppSettings.values.speedDial.forEach((data, index) => {
    const item = createSpeedDialItem(data, index);

    // --- ★★★ 長押しイベントリスナーを追加 ★★★ ---
    item.addEventListener("mousedown", (e) => startLongPressTimer(e, item));
    item.addEventListener("touchstart", (e) => {
      // 長押し開始時にデフォルトのタッチ動作（スクロールなど）を少し遅延させるか検討
      // ただし、やりすぎると通常のスクロールがしにくくなる
      // e.preventDefault(); // ← やらない方が良いかも
      startLongPressTimer(e, item);
    });
    item.addEventListener("mouseup", cancelLongPressTimer);
    item.addEventListener("mouseleave", cancelLongPressTimer); // マウスが要素外に出たらキャンセル
    item.addEventListener("touchend", cancelLongPressTimer);
    item.addEventListener("touchmove", cancelLongPressTimer); // 指が動いたらキャンセル

    // --- ★★★ クリックイベントリスナーを追加 (リンク遷移制御用) ★★★ ---
    // item 自体ではなく、子要素の <a> タグに設定する方が確実
    const linkElement = item.querySelector(".speed-dial-link");
    if (linkElement) {
      linkElement.addEventListener("click", handleSpeedDialItemClick);
    } else {
      // フォールバックとして item にも設定しておく (構造が変わった場合など)
      item.addEventListener("click", handleSpeedDialItemClick);
    }

    elements.speedDialGrid.appendChild(item);

    // 編集モード時のドラッグ可能設定
    if (state.isEditMode) {
      item.draggable = true;
    }
  });

  // --- ★★★ 末尾に「追加ボタン(+)」をレンダリング ★★★ ---
  const addButton = document.createElement("div");
  addButton.className = "speed-dial-item add-button-item"; // 共通クラスと専用クラス
  addButton.title = "スピードダイアル項目を追加";
  addButton.setAttribute("aria-label", "スピードダイアル項目を追加");
  addButton.innerHTML = `
          <i data-feather="plus-circle"></i>
          <span>追加</span>
      `;
  // クリックしたらモーダルを開く
  addButton.addEventListener("click", () => {
    openAddModal();
    closeSettingsPanel(); // 設定パネルが開いていたら閉じる
  });
  elements.speedDialGrid.appendChild(addButton);
  // --- ここまで追加ボタンの処理 ---

  feather.replace(); // アイコンをレンダリング (追加ボタンのアイコンも含む)

  // 編集モードならドラッグ＆ドロップリスナーを再適用
  if (state.isEditMode) {
    addDragDropListeners();
  }
}

function openAddModal() {
  state.editingIndex = -1;
  state.fetchedIconUrl = null;
  state.manualIconDataUrl = null;
  elements.modalTitle.textContent = "スピードダイアル項目を追加";
  elements.siteNameInput.value = "";
  elements.siteUrlInput.value = "";
  elements.siteIconInput.value = "";
  updateFaviconPreview(null, "");
  resetAdjustments(); // ★ 調整値をリセットしてUIに反映
  elements.speedDialModal.classList.add("visible");
  feather.replace(); // ★ リセットボタンのアイコンも描画

  // ★★★ モーダル表示後、少し遅れてURL入力欄にフォーカス ★★★
  setTimeout(() => {
    if (elements.siteUrlInput) {
      // 要素が存在するか確認
      elements.siteUrlInput.focus();
      console.log("Focused on siteUrlInput"); // デバッグ用ログ
    } else {
      console.warn("openAddModal: siteUrlInput not found, cannot focus.");
    }
  }, 100); // 100ミリ秒後にフォーカス (トランジション完了を待つため)
}

function openEditModal(index) {
  state.editingIndex = index;
  const data = AppSettings.values.speedDial[index];

  state.fetchedIconUrl = null;
  state.manualIconDataUrl = data.icon?.startsWith("data:image")
    ? data.icon
    : null;

  elements.modalTitle.textContent = "スピードダイアル項目を編集";
  elements.siteNameInput.value = data.name;
  elements.siteUrlInput.value = data.url;
  elements.siteIconInput.value = "";

  // ★ 保存されている調整値を取得、なければデフォルト
  const savedAdjustment = data.adjustment || {
    hue: 0,
    saturate: 100,
    brightness: 100,
  };
  state.currentAdjustment = { ...savedAdjustment }; // stateにコピー

  // ★ UIに調整値を反映
  elements.hueSlider.value = state.currentAdjustment.hue;
  elements.saturateSlider.value = state.currentAdjustment.saturate;
  elements.brightnessSlider.value = state.currentAdjustment.brightness;
  handleAdjustmentChange(); // 表示更新とプレビュー適用

  updateFaviconPreview(data.icon, data.name); // アイコン表示（フィルターはhandleAdjustmentChangeで適用済）

  elements.speedDialModal.classList.add("visible");
  feather.replace(); // ★ リセットボタンのアイコンも描画
}

// --- Icon Adjustment ---
/**
 * スライダーの値に基づいて state.currentAdjustment を更新し、プレビューにフィルターを適用する
 */
function handleAdjustmentChange() {
  if (!elements.hueSlider) return; // 要素がなければ何もしない

  // state に現在のスライダー値を保存
  state.currentAdjustment.hue = parseInt(elements.hueSlider.value, 10);
  state.currentAdjustment.saturate = parseInt(
    elements.saturateSlider.value,
    10
  );
  state.currentAdjustment.brightness = parseInt(
    elements.brightnessSlider.value,
    10
  );

  // 数値表示を更新
  elements.hueValue.textContent = state.currentAdjustment.hue;
  elements.saturateValue.textContent = state.currentAdjustment.saturate;
  elements.brightnessValue.textContent = state.currentAdjustment.brightness;

  // プレビューアイコンにフィルターを適用
  applyAdjustmentToPreview();
}

/**
 * state.currentAdjustment の値に基づいてプレビューアイコンの filter スタイルを設定する
 */
function applyAdjustmentToPreview() {
  const imgPreview = elements.faviconPreview;
  if (imgPreview && imgPreview.style.display === "block") {
    // 画像が表示されている場合のみ
    const { hue, saturate, brightness } = state.currentAdjustment;
    imgPreview.style.filter = `hue-rotate(${hue}deg) saturate(${saturate}%) brightness(${brightness}%)`;
  } else if (imgPreview) {
    imgPreview.style.filter = "none"; // 画像が表示されていない場合はフィルター解除
  }
}

/**
 * 色調調整をデフォルト値にリセットする
 */
function resetAdjustments() {
  state.currentAdjustment = { hue: 0, saturate: 100, brightness: 100 };
  elements.hueSlider.value = state.currentAdjustment.hue;
  elements.saturateSlider.value = state.currentAdjustment.saturate;
  elements.brightnessSlider.value = state.currentAdjustment.brightness;
  handleAdjustmentChange(); // 表示とプレビューを更新
}

function updateFaviconPreview(imageUrl, siteName) {
  const imgPreview = elements.faviconPreview;
  const initialPreview = elements.initialIconPreview;

  if (imageUrl) {
    imgPreview.src = imageUrl;
    imgPreview.style.display = "block";
    initialPreview.style.display = "none";
    imgPreview.onload = () => {
      imgPreview.style.display = "block";
      initialPreview.style.display = "none";
    };
    imgPreview.onerror = () => {
      console.warn("Favicon preview load error:", imageUrl);
      state.fetchedIconUrl = null;
      updateFaviconPreview(null, siteName);
    };
  } else if (siteName) {
    const initialIcon = createInitialIcon(siteName);
    initialPreview.innerHTML = initialIcon.innerHTML;
    initialPreview.style.display = "flex";
    imgPreview.style.display = "none";
    imgPreview.src = "";
  } else {
    imgPreview.style.display = "none";
    initialPreview.style.display = "none";
    imgPreview.src = "";
  }
  feather.replace();
}
// (案1: 関数を残し、アイコンプレビュー更新のみに)
function handleUrlInputBlur() {
  // この関数はアイコンプレビュー更新のみ担当する、または
  // 上記 blur リスナー内で updateFaviconPreview を呼ぶのでこの関数は不要になるかも
  const url = elements.siteUrlInput.value.trim();
  const siteName = elements.siteNameInput.value.trim();
  if (!state.manualIconDataUrl && !state.fetchedIconUrl) {
    // 手動/取得済みアイコンがない場合のみイニシャル更新
    updateFaviconPreview(
      null,
      siteName || (isValidHttpUrl(url) ? getDomainFromUrl(url) || url : "")
    );
  }
}

// (案2: 関数自体を削除し、blur リスナーに処理を完全に移譲)
// function handleUrlInputBlur() { ... } // ← 関数定義を削除

function handleManualIconSelect() {
  const iconFile = elements.siteIconInput.files[0];
  if (iconFile) {
    if (iconFile.size > 1 * 1024 * 1024) {
      alert("アイコンサイズは1MB以下にしてください。");
      elements.siteIconInput.value = "";
      state.manualIconDataUrl = null;
      handleUrlInputBlur();
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      state.manualIconDataUrl = reader.result;
      updateFaviconPreview(
        state.manualIconDataUrl,
        elements.siteNameInput.value.trim()
      );
      state.fetchedIconUrl = null;
    };
    reader.onerror = () => {
      alert("ファイル読み込みに失敗しました。");
      state.manualIconDataUrl = null;
    };
    reader.readAsDataURL(iconFile);
  } else {
    state.manualIconDataUrl = null;
    handleUrlInputBlur();
  }
}

async function fetchAndCacheFavicon() {
  const url = elements.siteUrlInput.value.trim();
  const siteName = elements.siteNameInput.value.trim();
  if (!isValidHttpUrl(url)) {
    alert("有効なURLを入力してください。");
    return;
  }

  const domain = getDomainFromUrl(url);
  if (!domain) {
    alert("URLからドメインを取得できませんでした。");
    return;
  }

  const faviconServiceUrl = `https://icons.duckduckgo.com/ip3/${domain}.ico`;

  console.log("Fetching favicon from:", faviconServiceUrl);
  elements.fetchFaviconButton.disabled = true;

  try {
    const img = new Image();
    img.onload = () => {
      console.log("Favicon loaded successfully:", faviconServiceUrl);
      state.fetchedIconUrl = faviconServiceUrl;
      state.manualIconDataUrl = null;
      elements.siteIconInput.value = "";
      updateFaviconPreview(state.fetchedIconUrl, siteName);
      elements.fetchFaviconButton.disabled = false;
    };
    img.onerror = () => {
      console.warn("Failed to load favicon from:", faviconServiceUrl);
      alert(
        `アイコンを取得できませんでした。\n別のアイコンを試すか、ファイルを選択してください。\n(${faviconServiceUrl})`
      );
      state.fetchedIconUrl = null;
      updateFaviconPreview(null, siteName || url);
      elements.fetchFaviconButton.disabled = false;
    };
    img.src = faviconServiceUrl;
  } catch (error) {
    console.error("Error in fetchAndCacheFavicon:", error);
    alert("アイコン取得中にエラーが発生しました。");
    elements.fetchFaviconButton.disabled = false;
  }
}

function saveSpeedDial() {
  const name = elements.siteNameInput.value.trim();
  const url = elements.siteUrlInput.value.trim();

  if (!name || !url) {
    alert("サイト名とURLは必須です。");
    return;
  }
  if (!isValidHttpUrl(url)) {
    alert("有効なURL形式 (http(s)://...) を入力してください。");
    return;
  }

  let finalIcon = null;
  if (state.manualIconDataUrl) {
    finalIcon = state.manualIconDataUrl;
  } else if (state.fetchedIconUrl) {
    finalIcon = state.fetchedIconUrl;
  } else if (
    state.editingIndex > -1 &&
    AppSettings.values.speedDial[state.editingIndex].icon &&
    !elements.siteIconInput.files[0]
  ) {
    finalIcon = AppSettings.values.speedDial[state.editingIndex].icon;
  }

  // ★★★ 現在の調整値を取得 ★★★
  const adjustmentData = { ...state.currentAdjustment };

  // ★★★ 新しいアイテムデータに adjustment を含める ★★★
  const newItem = { name, url, icon: finalIcon, adjustment: adjustmentData };

  if (state.editingIndex > -1) {
    AppSettings.values.speedDial[state.editingIndex] = newItem;
  } else {
    AppSettings.values.speedDial.push(newItem);
  }

  AppSettings.setSpeedDial(AppSettings.values.speedDial);
  renderSpeedDial();
  closeModal();
}

function closeModal() {
  elements.speedDialModal.classList.remove("visible");
  state.editingIndex = -1;
  state.fetchedIconUrl = null;
  state.manualIconDataUrl = null;
}

function deleteSpeedDial(index) {
  if (
    confirm(`「${AppSettings.values.speedDial[index].name}」を削除しますか？`)
  ) {
    AppSettings.values.speedDial.splice(index, 1);
    AppSettings.setSpeedDial(AppSettings.values.speedDial);
    renderSpeedDial();
  }
}

// --- Long Press Functions ---
/**
 * 長押しタイマーを開始する
 * @param {Event} event - イベントオブジェクト
 * @param {HTMLElement} itemElement - 対象のスピードダイアル要素
 */
function startLongPressTimer(event, itemElement) {
  // console.log('startLongPressTimer');
  cancelLongPressTimer(); // 既存のタイマーがあればキャンセル
  if (state.isEditMode) return; // 編集モード中は長押し不要

  state.longPressTimerId = setTimeout(() => {
    // console.log('Long press detected!');
    enterEditModeViaLongPress(itemElement);
  }, LONG_PRESS_DURATION);
}

/**
 * 長押しタイマーをキャンセルする
 */
function cancelLongPressTimer() {
  // console.log('cancelLongPressTimer');
  if (state.longPressTimerId) {
    clearTimeout(state.longPressTimerId);
    state.longPressTimerId = null;
  }
}

/**
 * 長押しによって編集モードに移行する
 * @param {HTMLElement} itemElement - 対象のスピードダイアル要素
 */
function enterEditModeViaLongPress(itemElement) {
  // console.log('enterEditModeViaLongPress');
  state.longPressTimerId = null; // タイマーIDクリア
  if (!state.isEditMode) {
    state.longPressTriggeredEdit = true; // クリック防止フラグを立てる
    toggleEditMode(); // 編集モードに移行
    // 必要なら haptic feedback をここで実行
    if (navigator.vibrate) {
      navigator.vibrate(50); // 短い振動
    }
    console.log("Entered edit mode via long press.");
  }
}

/**
 * スピードダイアル項目のクリックイベントハンドラ
 * 長押しで編集モードに入った場合や、既に編集モードの場合はリンク遷移を防ぐ
 * @param {Event} event
 */
function handleSpeedDialItemClick(event) {
  // console.log('handleSpeedDialItemClick, longPressTriggered:', state.longPressTriggeredEdit, 'isEditMode:', state.isEditMode);
  if (state.longPressTriggeredEdit || state.isEditMode) {
    event.preventDefault(); // リンク遷移をキャンセル
    // console.log('Prevented default click action.');
    // 長押しフラグは一度使ったらリセット
    if (state.longPressTriggeredEdit) {
      setTimeout(() => {
        state.longPressTriggeredEdit = false;
      }, 50); // 少し遅延させてリセット
    }
  }
  // 通常のクリック（編集モードでなく、長押しでもない）の場合は何もしない（デフォルトのリンク遷移が行われる）
}

// --- Edit Mode & Drag/Drop ---
function toggleEditMode() {
  cancelLongPressTimer();
  state.longPressTriggeredEdit = false;

  state.isEditMode = !state.isEditMode;
  console.log(`Toggled edit mode: ${state.isEditMode}`);

  elements.body.classList.toggle("edit-mode", state.isEditMode);
  // ★ 編集/完了ボタンの表示切替コードが削除された

  const items = elements.speedDialGrid.querySelectorAll(
    ".speed-dial-item:not(.add-button-item)"
  );
  items.forEach((item) => {
    item.draggable = state.isEditMode;
  });

  if (state.isEditMode) {
    addDragDropListeners();
  } else {
    removeDragDropListeners();
  }

  // renderSpeedDial(); // 必要なら呼び出す (追加ボタンの表示/非表示など)
  feather.replace();
}

function handleDragStart(event) {
  event.dataTransfer.setData("text/plain", event.target.dataset.index);
  event.dataTransfer.effectAllowed = "move";
  event.target.classList.add("dragging");
  state.draggedItemIndex = parseInt(event.target.dataset.index, 10);
}

function handleDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  const targetItem = event.target.closest(".speed-dial-item");
  if (targetItem && !targetItem.classList.contains("dragging")) {
    clearDragOverHighlight();
    targetItem.classList.add("drag-over-target");
  }
}

function handleDragLeave(event) {
  const targetItem = event.target.closest(".speed-dial-item");
  if (targetItem && targetItem.classList.contains("drag-over-target")) {
    targetItem.classList.remove("drag-over-target");
  }
}

function handleDrop(event) {
  event.preventDefault();
  clearDragOverHighlight();

  const draggedIndex = parseInt(event.dataTransfer.getData("text/plain"), 10);
  const dropTargetElement = event.target.closest(".speed-dial-item");

  if (dropTargetElement && !dropTargetElement.classList.contains("dragging")) {
    const droppedOnIndex = parseInt(dropTargetElement.dataset.index, 10);

    if (draggedIndex !== droppedOnIndex) {
      const itemToMove = AppSettings.values.speedDial.splice(
        draggedIndex,
        1
      )[0];
      AppSettings.values.speedDial.splice(droppedOnIndex, 0, itemToMove);

      AppSettings.setSpeedDial(AppSettings.values.speedDial);
      renderSpeedDial();
      // addDragDropListeners(); // renderSpeedDial内で再適用されるので不要かも
    }
  }
  const draggingElement = elements.speedDialGrid.querySelector(".dragging");
  if (draggingElement) draggingElement.classList.remove("dragging");
  state.draggedItemIndex = null;
}

function handleDragEnd(event) {
  event.target.classList.remove("dragging");
  clearDragOverHighlight();
  state.draggedItemIndex = null;
}

function clearDragOverHighlight() {
  const highlighted =
    elements.speedDialGrid.querySelectorAll(".drag-over-target");
  highlighted.forEach((el) => el.classList.remove("drag-over-target"));
}

function addDragDropListeners() {
  const items = elements.speedDialGrid.querySelectorAll(".speed-dial-item");
  items.forEach((item) => {
    item.addEventListener("dragstart", handleDragStart);
    item.addEventListener("dragover", handleDragOver);
    item.addEventListener("dragleave", handleDragLeave);
    item.addEventListener("drop", handleDrop);
    item.addEventListener("dragend", handleDragEnd);
    item.draggable = true;
  });
}

function removeDragDropListeners() {
  const items = elements.speedDialGrid.querySelectorAll(".speed-dial-item");
  items.forEach((item) => {
    item.removeEventListener("dragstart", handleDragStart);
    item.removeEventListener("dragover", handleDragOver);
    item.removeEventListener("dragleave", handleDragLeave);
    item.removeEventListener("drop", handleDrop);
    item.removeEventListener("dragend", handleDragEnd);
    item.draggable = false;
  });
}

// --- Engine Management ---
function openEngineModal() {
  state.editingEngine = null;
  elements.engineNicknameInput.value = "";
  elements.engineNameInput.value = "";
  elements.engineUrlInput.value = "";
  elements.engineSuggestUrlInput.value = "";
  elements.engineNicknameInput.disabled = false;
  elements.addEngineButtonText.textContent = "エンジンを追加";
  renderEngineList();
  elements.engineModal.classList.add("visible");
  feather.replace();
}

function closeEngineModal() {
  elements.engineModal.classList.remove("visible");
}

function renderEngineList() {
  elements.engineList.innerHTML = "";
  const fragment = document.createDocumentFragment();
  const sortedNicknames = Object.keys(AppSettings.values.engines).sort(
    (a, b) => {
      const aIsBuiltin = !!builtinEngines[a];
      const bIsBuiltin = !!builtinEngines[b];
      if (aIsBuiltin && !bIsBuiltin) return -1;
      if (!aIsBuiltin && bIsBuiltin) return 1;
      return a.localeCompare(b);
    }
  );

  sortedNicknames.forEach((nickname) => {
    const engine = AppSettings.values.engines[nickname];
    const listItem = document.createElement("li");

    const engineInfo = document.createElement("span");
    engineInfo.className = "engine-info";
    engineInfo.innerHTML = `<strong class="engine-nickname">${nickname}</strong> - ${engine.name}`;
    listItem.appendChild(engineInfo);

    const actions = document.createElement("span");
    actions.className = "engine-actions";

    const editButton = document.createElement("button");
    editButton.innerHTML = '<i data-feather="edit"></i> 編集';
    editButton.addEventListener("click", () => openEditEngineModal(nickname));
    actions.appendChild(editButton);

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.innerHTML = '<i data-feather="trash-2"></i> 削除';
    deleteButton.addEventListener("click", () => deleteEngine(nickname));
    actions.appendChild(deleteButton);

    listItem.appendChild(actions);
    fragment.appendChild(listItem);
  });

  elements.engineList.appendChild(fragment);
  feather.replace();
  initHelpContent();
}

function openEditEngineModal(nickname) {
  state.editingEngine = nickname;
  const engine = AppSettings.values.engines[nickname];
  if (!engine) {
    // 念のため存在チェック
    console.error("Cannot edit engine, not found:", nickname);
    return;
  }
  elements.engineNicknameInput.value = nickname;
  elements.engineNameInput.value = engine.name;
  elements.engineUrlInput.value = engine.url;
  elements.engineSuggestUrlInput.value = engine.suggestUrl || "";
  elements.engineIconUrlInput.value = engine.iconUrl || ""; // ★ アイコンURLを読み込む
  elements.engineNicknameInput.disabled = false; // ニックネーム編集可能に
  elements.addEngineButtonText.textContent = "変更を保存";
  elements.engineModal.classList.add("visible");
  feather.replace();
}

function addOrUpdateEngine() {
  const newNickname = elements.engineNicknameInput.value.trim().toLowerCase();
  const name = elements.engineNameInput.value.trim();
  const url = elements.engineUrlInput.value.trim();
  const suggestUrl = elements.engineSuggestUrlInput.value.trim();

  if (!newNickname || !name || !url) {
    alert("ニックネーム、エンジン名、検索URLは必須です。");
    return;
  }
  if (/\s/.test(newNickname)) {
    alert("ニックネームにスペースは使用できません。");
    return;
  }
  if (!url.includes("%s")) {
    alert("検索URLには '%s' を含める必要があります。");
    return;
  }

  if (
    state.editingEngine !== newNickname &&
    AppSettings.values.engines[newNickname]
  ) {
    alert(`ニックネーム '${newNickname}' は既に使用されています。`);
    return;
  }

  const newEngineData = {
    name,
    url,
    suggestUrl: suggestUrl || null,
    iconUrl: iconUrl || null, // 空なら null を保存
  };

  if (state.editingEngine && state.editingEngine !== newNickname) {
    delete AppSettings.values.engines[state.editingEngine];
  }

  AppSettings.values.engines[newNickname] = newEngineData;

  const indexInDeleted =
    AppSettings.values.deletedBuiltinEngines.indexOf(newNickname);
  if (indexInDeleted > -1) {
    AppSettings.values.deletedBuiltinEngines.splice(indexInDeleted, 1);
  }

  AppSettings.save(); // AppSettings.save() は saveEngines() を呼ぶはず
  AppSettings.loadEngines(); // ★ 変更を反映させるために再読み込み

  renderEngineList(); // リスト更新
  initHelpContent(); // ヘルプ更新
  updateCurrentEngineDisplay(); // ★ 現在のエンジン表示も更新

  closeEngineModal(); // モーダルを閉じる
}

function deleteEngine(nickname) {
  if (!AppSettings.values.engines[nickname]) return;

  if (
    confirm(
      `${nickname} - ${AppSettings.values.engines[nickname].name} を削除しますか？`
    )
  ) {
    const isBuiltin = !!builtinEngines[nickname];
    delete AppSettings.values.engines[nickname];
    if (isBuiltin) {
      if (!AppSettings.values.deletedBuiltinEngines.includes(nickname)) {
        AppSettings.values.deletedBuiltinEngines.push(nickname);
      }
    }
    AppSettings.save();
    renderEngineList();
  }
}

// --- Help Content ---
function initHelpContent() {
  const helpShortcutList = elements.helpContent.querySelector(".shortcut-list");
  helpShortcutList.innerHTML = "";
  const fragment = document.createDocumentFragment();
  const sortedNicknames = Object.keys(AppSettings.values.engines).sort(); // Simple alphabetical sort for help
  sortedNicknames.forEach((nickname) => {
    const engine = AppSettings.values.engines[nickname];
    const item = document.createElement("div");
    item.className = "shortcut-item";
    item.textContent = `${nickname} - ${engine.name}`;
    fragment.appendChild(item);
  });
  helpShortcutList.appendChild(fragment);
}

// --- Tab Visibility Change ---
function handleVisibilityChange() {
  const isModalVisible =
    elements.speedDialModal.classList.contains("visible") ||
    elements.engineModal.classList.contains("visible");
  if (document.visibilityState === "visible" && !isModalVisible) {
    elements.searchInput.focus();
  }
}

// --- Fallback Indicator ---
let fallbackIndicatorTimeoutId = null;

function activateFallbackIndicator() {
  const container = elements.searchInput?.closest(".search-input-container"); // ★ コンテナを取得
  if (container) {
    container.classList.add("fallback-active"); // ★ コンテナにクラスを追加
    if (fallbackIndicatorTimeoutId) {
      clearTimeout(fallbackIndicatorTimeoutId);
    }
    fallbackIndicatorTimeoutId = setTimeout(() => {
      deactivateFallbackIndicator();
    }, 3000);
  }
}

function deactivateFallbackIndicator() {
  const container = elements.searchInput?.closest(".search-input-container"); // ★ コンテナを取得
  if (container) {
    container.classList.remove("fallback-active"); // ★ コンテナからクラスを削除
  }
  if (fallbackIndicatorTimeoutId) {
    clearTimeout(fallbackIndicatorTimeoutId);
    fallbackIndicatorTimeoutId = null;
  }
}

// --- Fetch Favicon via Proxy ---
/**
 * 指定されたURLのファビコンをプロキシサーバー経由で非同期に取得する関数
 * @param {string} url - ファビコンを取得したい対象のURL
 * @returns {Promise<string|null>} 取得したファビコンのData URL文字列、または取得失敗時にnullを返すPromise
 */
async function fetchFaviconFromUrl(url) {
  // 1. URLの基本的な有効性チェック
  if (!isValidHttpUrl(url)) {
    console.log("[fetchFaviconFromUrl] Invalid URL provided:", url);
    return null;
  }

  // 2. プロキシサーバーのエンドポイントURLを構築 (相対パス)
  const proxyFaviconUrl = `/fetch-favicon?url=${encodeURIComponent(url)}`;
  console.log(
    "[fetchFaviconFromUrl] Fetching favicon via server API:",
    proxyFaviconUrl
  ); // ログメッセージ変更

  // 3. fetch処理
  try {
    // タイムアウト設定 (例: 10秒)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn(
        `[fetchFaviconFromUrl] Request to ${proxyFaviconUrl} timed out after 10 seconds.`
      );
      controller.abort();
    }, 10000); // 10000ミリ秒 = 10秒

    // サーバーのAPIへ fetch リクエストを実行
    const response = await fetch(proxyFaviconUrl, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    // レスポンスステータスを確認
    if (!response.ok) {
      let errorData = {
        error: `Server API responded with status ${response.status}`,
      };
      try {
        errorData = await response.json();
      } catch (jsonError) {
        /* ignore */
      }
      console.error(
        `[fetchFaviconFromUrl] Server API error: ${response.status}`,
        errorData
      );
      return null;
    }

    // JSONデータを取得
    const data = await response.json();

    // レスポンスに faviconDataUrl があり、文字列であれば返す
    if (data && typeof data.faviconDataUrl === "string") {
      console.log(
        "[fetchFaviconFromUrl] Favicon Data URL successfully fetched."
      );
      return data.faviconDataUrl;
    } else if (data && data.faviconDataUrl === null) {
      console.log(
        "[fetchFaviconFromUrl] Server reported favicon not found (returned null)."
      );
      return null;
    } else {
      console.warn(
        "[fetchFaviconFromUrl] Invalid or missing faviconDataUrl in server response:",
        data
      );
      return null;
    }
  } catch (error) {
    // fetch 自体のエラー処理
    if (error.name === "AbortError") {
      console.error("[fetchFaviconFromUrl] Request aborted (likely timeout).");
    } else {
      console.error("[fetchFaviconFromUrl] Error fetching favicon:", error);
    }
    return null;
  }
}

// --- Modal Loading State ---
/**
 * スピードダイアルモーダルの入力フィールド等のローディング状態を設定/解除する
 * @param {boolean} isLoading - ローディング状態にする場合は true
 */
function setModalLoadingState(isLoading) {
  // ★★★ 関数冒頭で必要な要素を取得し、存在しない場合は警告を出す ★★★
  const siteNameInput = elements.siteNameInput;
  const siteUrlInput = elements.siteUrlInput;
  const faviconPreview = elements.faviconPreview;
  // const manualIconButton = elements.manualIconButton; // ← 一旦コメントアウト or 削除
  const manualIconInput = elements.manualIconInput;
  const fetchFaviconButton = elements.fetchFaviconButton; // ★ ファビコン取得ボタンも対象にする
  const saveButton = elements.saveSpeedDialButton; // ★ 保存ボタンも対象にする

  // ★★★ 要素が存在しない場合の警告 (デバッグ用) ★★★
  if (!siteNameInput)
    console.warn("setModalLoadingState: siteNameInput not found");
  if (!siteUrlInput)
    console.warn("setModalLoadingState: siteUrlInput not found");
  if (!faviconPreview)
    console.warn("setModalLoadingState: faviconPreview not found");
  if (!manualIconInput)
    console.warn("setModalLoadingState: manualIconInput not found");
  if (!fetchFaviconButton)
    console.warn("setModalLoadingState: fetchFaviconButton not found");
  if (!saveButton) console.warn("setModalLoadingState: saveButton not found");
  // if (!manualIconButton) console.warn("setModalLoadingState: manualIconButton not found");

  // --- ローディング状態の設定/解除 ---
  if (isLoading) {
    // --- 要素が存在すれば無効化 & プレースホルダー変更 ---
    if (siteNameInput) {
      siteNameInput.placeholder = "情報取得中...";
      siteNameInput.disabled = true;
    }
    if (siteUrlInput) {
      siteUrlInput.disabled = true;
    }
    if (manualIconInput) {
      // ファイル選択 input
      manualIconInput.disabled = true;
    }
    if (fetchFaviconButton) {
      // URLから取得ボタン
      fetchFaviconButton.disabled = true;
    }
    if (saveButton) {
      // 保存ボタン
      saveButton.disabled = true;
    }
    // if (manualIconButton && typeof manualIconButton.disabled !== 'undefined') { // ← 不要なら削除
    //     manualIconButton.disabled = true;
    // }

    // --- アイコンプレビューにスピナー表示 ---
    if (faviconPreview) {
      // ★ 既存のimg要素をクリアしてからスピナーを追加
      faviconPreview.innerHTML = "";
      faviconPreview.style.display = "flex"; // スピナー表示のためにflexなどに
      faviconPreview.style.alignItems = "center";
      faviconPreview.style.justifyContent = "center";
      faviconPreview.style.width = "32px"; // サイズ指定
      faviconPreview.style.height = "32px";
      faviconPreview.style.backgroundColor = "var(--bg-secondary)"; // 背景色
      faviconPreview.innerHTML = '<div class="spinner"></div>'; // スピナー要素
    }
    // ★ イニシャル表示も隠す
    if (elements.initialIconPreview) {
      elements.initialIconPreview.style.display = "none";
    }
  } else {
    // --- 要素が存在すれば有効化 & プレースホルダー戻す ---
    if (siteNameInput) {
      siteNameInput.placeholder = "例: Google";
      siteNameInput.disabled = false;
    }
    if (siteUrlInput) {
      siteUrlInput.disabled = false;
    }
    if (manualIconInput) {
      manualIconInput.disabled = false;
    }
    if (fetchFaviconButton) {
      fetchFaviconButton.disabled = false;
    }
    if (saveButton) {
      saveButton.disabled = false;
    }
    // if (manualIconButton && typeof manualIconButton.disabled !== 'undefined') { // ← 不要なら削除
    //     manualIconButton.disabled = false;
    // }

    // --- アイコンプレビューのスピナー削除 & スタイル戻す ---
    if (faviconPreview) {
      // スピナー削除は updateFaviconPreview に任せるのでここでは何もしないか、
      // またはスタイルだけ戻す
      faviconPreview.style.backgroundColor = "";
      faviconPreview.style.display = "none"; // updateFaviconPreviewが制御
      faviconPreview.innerHTML = ""; // 中身をクリア
    }
  }
  // ★ スピナーの表示/非表示後にFeatherアイコンを再描画 (もしスピナー内にアイコンを使う場合)
  // feather.replace(); // スピナーが単純なdivなら不要
}
// --- Fetch Title via Proxy ---
/**
 * 指定されたURLのタイトルをプロキシサーバー経由で非同期に取得する関数
 * @param {string} url - タイトルを取得したい対象のURL
 * @returns {Promise<string|null>} 取得したタイトル文字列、または取得失敗時にnullを返すPromise
 */
async function fetchTitleFromUrl(url) {
  // 1. URLの基本的な有効性チェック (http/httpsのみ)
  if (!isValidHttpUrl(url)) {
    console.log(
      "[fetchTitleFromUrl] Invalid URL provided (must be http/https):",
      url
    );
    return null; // 無効なURLなら null を返す
  }

  // 2. プロキシサーバーのエンドポイントURLを構築 (相対パス)
  const proxyTitleUrl = `/fetch-title?url=${encodeURIComponent(url)}`;
  console.log(
    "[fetchTitleFromUrl] Fetching title via server API:",
    proxyTitleUrl
  ); // ログメッセージ変更

  // 3. fetch処理
  try {
    // AbortController でタイムアウトを設定 (例: 8秒)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn(
        `[fetchTitleFromUrl] Request to ${proxyTitleUrl} timed out after 8 seconds.`
      );
      controller.abort(); // タイムアウト時にリクエストを中断
    }, 8000); // 8000ミリ秒 = 8秒

    // サーバーのAPIへ fetch リクエストを実行
    const response = await fetch(proxyTitleUrl, {
      signal: controller.signal, // タイムアウト用シグナルを渡す
    });

    // リクエストが完了したらタイムアウトタイマーをクリア
    clearTimeout(timeoutId);

    // サーバーからのレスポンスステータスを確認
    if (!response.ok) {
      // エラーレスポンスの内容を読み取り試行 (JSON形式を期待)
      let errorData = {
        error: `Server API responded with status ${response.status}`,
      }; // デフォルトエラー
      try {
        errorData = await response.json();
      } catch (jsonError) {
        console.warn(
          "[fetchTitleFromUrl] Could not parse error response as JSON."
        );
      }
      console.error(
        `[fetchTitleFromUrl] Server API error: ${response.status}`,
        errorData
      );
      return null; // エラー時は null を返す
    }

    // 正常なレスポンスからJSONデータを取得
    const data = await response.json();

    // レスポンスに title プロパティがあり、文字列であればその値を返す
    if (data && typeof data.title === "string") {
      console.log(
        "[fetchTitleFromUrl] Title successfully fetched:",
        data.title
      );
      return data.title;
    } else {
      console.warn(
        "[fetchTitleFromUrl] Title not found or invalid in server response:",
        data
      );
      return null;
    }
  } catch (error) {
    // fetch 自体のエラー（ネットワークエラー、タイムアウトなど）を処理
    if (error.name === "AbortError") {
      console.error("[fetchTitleFromUrl] Request aborted (likely timeout).");
    } else {
      console.error("[fetchTitleFromUrl] Error fetching title:", error);
    }
    return null; // その他のエラー時も null を返す
  }
}

// --- Utilities ---
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func.apply(this, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function isValidHttpUrl(string) {
  let url;
  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }
  return url.protocol === "http:" || url.protocol === "https:";
}

function getDomainFromUrl(url) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname;
  } catch (e) {
    console.warn("Invalid URL for domain extraction:", url);
    return null;
  }
}

// --- Initialize Application ---
init();
