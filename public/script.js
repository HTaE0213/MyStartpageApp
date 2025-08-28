// --- Built-in Engines Definition ---
const builtinEngines = {
  g: {
    name: "Google (JA)", // 名前を明確化
    url: "https://www.google.com/search?q=%s&hl=ja", // 日本語検索をデフォルトに
    // ★ サジェストURLを完全な形式で指定 (日本語)
    suggestUrl:
      "https://suggestqueries.google.com/complete/search?client=firefox&hl=ja&q=",
    iconUrl: "https://icons.duckduckgo.com/ip3/google.com.ico",
  },
  gs: {
    name: "Google (EN)",
    url: "https://www.google.com/search?q=%s&hl=en",
    // ★ サジェストURLを完全な形式で指定 (英語)
    suggestUrl:
      "https://suggestqueries.google.com/complete/search?client=firefox&hl=en&q=",
    iconUrl: "https://icons.duckduckgo.com/ip3/google.com.ico",
  },
  y: {
    name: "YouTube",
    url: "https://www.youtube.com/results?search_query=%s",
    // ★ YouTubeサジェスト (Google API, 日本語指定)
    suggestUrl:
      "https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&hl=ja&q=",
    iconUrl: "https://icons.duckduckgo.com/ip3/youtube.com.ico",
  },
  a: {
    name: "Amazon (JP)",
    url: "https://www.amazon.co.jp/s?k=%s",
    suggestUrl:
      "https://completion.amazon.co.jp/search/complete?search-alias=aps&client=amazon-search-ui&mkt=6&q=",
    iconUrl: "https://icons.duckduckgo.com/ip3/amazon.co.jp.ico",
  },
  w: {
    name: "Wikipedia (JA)",
    url: "https://ja.wikipedia.org/wiki/%s",
    suggestUrl: "https://ja.wikipedia.org/w/api.php?action=opensearch&search=",
    iconUrl: "https://icons.duckduckgo.com/ip3/wikipedia.org.ico",
  },
  m: {
    name: "Google Maps",
    url: "https://www.google.com/maps/search/%s",
    suggestUrl: null,
    iconUrl: "https://www.google.com/images/branding/product/ico/maps_32dp.ico", // Google提供のアイコン例
  },
  x: {
    name: "X",
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
    // ★ サジェストURLを完全な形式で指定
    suggestUrl: "https://api.bing.com/osjson.aspx?query=",
    iconUrl: "https://icons.duckduckgo.com/ip3/bing.com.ico",
  },
  d: {
    name: "DuckDuckGo",
    url: "https://duckduckgo.com/?q=%s",
    // ★ サジェストURLを完全な形式で指定
    suggestUrl: "https://duckduckgo.com/ac/?q=",
    iconUrl: "https://icons.duckduckgo.com/ip3/duckduckgo.com.ico",
  },
};

// --- Application Settings Management ---
// script.js

// --- アプリケーション設定管理 ---
const AppSettings = {
  // localStorageで使用するキー
  KEYS: {
    CUSTOM_ENGINES: "customSearchEngines_v2",
    DELETED_BUILTIN: "deletedBuiltinEngines_v2",
    SPEED_DIAL: "speedDialData_v2",
    COLUMNS: "speedDialColumns",
    FAVICONS: "faviconsCache_v2",
    CURRENT_ENGINE: "currentSearchEngine", // 現在のエンジン
    THEME: "startpageTheme", // テーマ設定 (例)
    BACKGROUND: "startpageBackground", // 背景設定 (例)
    // ★★★ デフォルトエンジン用のキーを追加 ★★★
    DEFAULT_SEARCH_ENGINE: "defaultSearchEngine",
    DEFAULT_SUGGEST_ENGINE: "defaultSuggestEngine",
    // 他に必要な設定キーがあれば追加
  },
  // アプリケーションのメモリ上に保持する設定値
  values: {
    engines: {}, // 検索エンジンリスト (ビルトイン + カスタム - 削除済み)
    deletedBuiltinEngines: [], // ユーザーが削除したビルトインエンジンのニックネームリスト
    speedDial: [], // スピードダイアルのデータ
    columns: 4, // スピードダイアルの列数
    favicons: {}, // ファビコンキャッシュ (Data URL)
    theme: "system", // テーマ ('light', 'dark', 'system')
    background: "", // 背景画像/色の設定値
    // currentEngine は values に保持せず、都度 localStorage から読む or キャッシュを使う
    // ★ デフォルトエンジンは values に保持せず、直接 localStorage から読む
    // defaultSearchEngine: 'g',
    // defaultSuggestEngine: 'g',
  },
  // デフォルト値 (localStorage に値がない場合に使用)
  defaults: {
    columns: 4,
    theme: "system",
    background: "",
    // ★★★ デフォルトエンジン用のデフォルト値を設定 ★★★
    defaultSearchEngine: "g",
    defaultSuggestEngine: "g",
  },

  /**
   * アプリケーション起動時に設定をロードする
   */
  load: function () {
    console.log("[AppSettings] Loading settings...");
    // 各設定値を localStorage から読み込み、なければデフォルト値を使用
    this.values.columns = parseInt(
      localStorage.getItem(this.KEYS.COLUMNS) || this.defaults.columns,
      10
    );
    this.values.speedDial = JSON.parse(
      localStorage.getItem(this.KEYS.SPEED_DIAL) || "[]"
    );
    this.values.favicons = JSON.parse(
      localStorage.getItem(this.KEYS.FAVICONS) || "{}"
    );
    this.values.theme =
      localStorage.getItem(this.KEYS.THEME) || this.defaults.theme;
    this.values.background =
      localStorage.getItem(this.KEYS.BACKGROUND) || this.defaults.background;

    // エンジン設定をロード (カスタム/削除済みを考慮)
    this.loadEngines(); // ★ これを先に呼ぶことが重要

    // ★ デフォルトエンジンは loadEngines の後に取得・検証する
    //    (values には保持しない)
    cache.currentEngine = this.getCurrentEngine(); // 現在選択中のエンジン

    // ロードした設定をUIに反映 (例: テーマ適用など)
    this.applyTheme();
    this.applyBackground(); // 背景適用処理 (もしあれば)

    console.log("[AppSettings] Settings loaded:", this.values);
  },

  /**
   * 現在のメモリ上の設定値を localStorage に保存する
   */
  save: function () {
    console.log("[AppSettings] Saving settings...");
    try {
      localStorage.setItem(this.KEYS.COLUMNS, this.values.columns.toString());
      localStorage.setItem(
        this.KEYS.SPEED_DIAL,
        JSON.stringify(this.values.speedDial)
      );
      localStorage.setItem(
        this.KEYS.FAVICONS,
        JSON.stringify(this.values.favicons)
      );
      localStorage.setItem(this.KEYS.THEME, this.values.theme);
      localStorage.setItem(this.KEYS.BACKGROUND, this.values.background);

      // エンジン設定を保存 (カスタム/削除済みを考慮)
      this.saveEngines();
      // deletedBuiltinEngines は saveEngines 内ではなくここで保存
      localStorage.setItem(
        this.KEYS.DELETED_BUILTIN,
        JSON.stringify(this.values.deletedBuiltinEngines)
      );
      // 現在のエンジンは setCurrentEngine で保存されるので、ここでは不要
      // ★ デフォルトエンジンは setDefault... メソッドで個別に保存されるので、
      //   ここでは保存しない (values に保持していないため)

      console.log("[AppSettings] Settings saved successfully.");
    } catch (error) {
      console.error(
        "[AppSettings] Error saving settings to localStorage:",
        error
      );
      // クォータ超過などの可能性
      alert(
        "設定の保存中にエラーが発生しました。ストレージの空き容量を確認してください。"
      );
    }
  },

  /**
   * エンジン設定 (カスタム/削除済み) をロードし、this.values.engines を構築する
   */
  loadEngines: function () {
    // 1. まずビルトインエンジンをディープコピーして基本とする
    this.values.engines = JSON.parse(JSON.stringify(builtinEngines));

    // 2. 削除済みビルトインエンジンリストをロード
    this.values.deletedBuiltinEngines = JSON.parse(
      localStorage.getItem(this.KEYS.DELETED_BUILTIN) || "[]"
    );

    // 3. 削除済みリストに基づいてビルトインエンジンを削除
    this.values.deletedBuiltinEngines.forEach((nickname) => {
      if (this.values.engines[nickname]) {
        delete this.values.engines[nickname];
        // console.log(`[LoadEngines] Removed deleted builtin engine: ${nickname}`);
      }
    });

    // 4. カスタムエンジン (追加または変更されたビルトイン) をロードしてマージ
    const storedCustomEngines = localStorage.getItem(this.KEYS.CUSTOM_ENGINES);
    if (storedCustomEngines) {
      try {
        const loadedCustomEngines = JSON.parse(storedCustomEngines);
        for (const nickname in loadedCustomEngines) {
          // カスタムエンジンは単純に追加/上書き
          this.values.engines[nickname] = loadedCustomEngines[nickname];
          // console.log(`[LoadEngines] Loaded custom/modified engine: ${nickname}`);
        }
      } catch (e) {
        console.error(
          "[LoadEngines] Error parsing custom engines from localStorage:",
          e
        );
        // localStorage.removeItem(this.KEYS.CUSTOM_ENGINES); // 不正なデータを削除する？
      }
    }
    cache.engines = this.values.engines; // キャッシュ更新
    console.log("[LoadEngines] Final engines loaded:", this.values.engines);
  },

  /**
   * カスタムエンジン/変更されたビルトインエンジンを localStorage に保存する
   * (deletedBuiltinEngines は save() 関数で別途保存される)
   */
  saveEngines: function () {
    const customEnginesToSave = {};
    for (const nickname in this.values.engines) {
      // ビルトインに存在しないニックネームか、
      // またはビルトインに存在するが内容が変更されているエンジンのみを保存対象とする
      if (
        !builtinEngines[nickname] ||
        JSON.stringify(this.values.engines[nickname]) !==
          JSON.stringify(builtinEngines[nickname])
      ) {
        // この条件で、追加されたカスタムエンジンと、内容が変更されたビルトインエンジンが対象となる
        customEnginesToSave[nickname] = this.values.engines[nickname];
      }
    }
    localStorage.setItem(
      this.KEYS.CUSTOM_ENGINES,
      JSON.stringify(customEnginesToSave)
    );
    console.log(
      "[SaveEngines] Saved custom/modified engines:",
      customEnginesToSave
    );
  },

  /**
   * 現在選択されている検索エンジンのニックネームを取得する
   * (無効な場合はデフォルト検索エンジンを返すように修正)
   * @returns {string | null} 現在のエンジンのニックネーム、または見つからない場合は null
   */
  getCurrentEngine: function () {
    const storedEngine = localStorage.getItem(this.KEYS.CURRENT_ENGINE);

    // 保存されているエンジンが現在の有効なエンジンリストに存在するか確認
    if (
      storedEngine &&
      this.values.engines &&
      this.values.engines[storedEngine]
    ) {
      return storedEngine;
    }

    // 存在しない場合や未設定の場合はデフォルト *検索* エンジンを返す
    console.warn(
      `[GetCurrentEngine] Stored engine '${storedEngine}' not valid, falling back to default search engine.`
    );
    return this.getDefaultSearchEngine(); // ★ デフォルト検索エンジンを返す
  },

  /**
   * 現在の検索エンジンを設定する
   * @param {string} nickname - 設定するエンジンのニックネーム
   */
  setCurrentEngine: function (nickname) {
    // 設定しようとしているニックネームが有効なエンジンリストに存在するか確認
    if (nickname && this.values.engines && this.values.engines[nickname]) {
      localStorage.setItem(this.KEYS.CURRENT_ENGINE, nickname);
      cache.currentEngine = nickname; // キャッシュも更新
      console.log(`[SetCurrentEngine] Current engine set to: ${nickname}`);
    } else {
      console.error(
        `[SetCurrentEngine] Attempted to set invalid or non-existent engine: ${nickname}`
      );
    }
  },

  // ★★★ デフォルトエンジン関連のメソッドを追加 ★★★

  /**
   * 設定されているデフォルト検索エンジンを取得する
   * @returns {string} デフォルト検索エンジンのニックネーム
   */
  getDefaultSearchEngine: function () {
    const storedDefault = localStorage.getItem(this.KEYS.DEFAULT_SEARCH_ENGINE);
    // 保存された値が現在の有効なエンジンリストに存在するか確認
    if (
      storedDefault &&
      this.values.engines &&
      this.values.engines[storedDefault]
    ) {
      return storedDefault;
    }
    // なければ、デフォルト値 ('g') が有効か確認
    const fallbackDefault = this.defaults.defaultSearchEngine;
    if (this.values.engines && this.values.engines[fallbackDefault]) {
      console.warn(
        `[GetDefaultSearch] Using default value: ${fallbackDefault}`
      );
      return fallbackDefault;
    }
    // デフォルト値 ('g') も無効なら、リストの最初のエンジンを返す
    const engineKeys = Object.keys(this.values.engines || {});
    if (engineKeys.length > 0) {
      const firstEngine = engineKeys[0];
      console.warn(
        `[GetDefaultSearch] Default '${fallbackDefault}' invalid, using first available: ${firstEngine}`
      );
      return firstEngine;
    }
    console.error("[GetDefaultSearch] No valid engines available!");
    return "g"; // 最終手段
  },

  /**
   * デフォルト検索エンジンを設定（保存）する
   * @param {string} nickname 設定するエンジンのニックネーム
   */
  setDefaultSearchEngine: function (nickname) {
    if (nickname && this.values.engines && this.values.engines[nickname]) {
      localStorage.setItem(this.KEYS.DEFAULT_SEARCH_ENGINE, nickname);
      console.log(
        `[SetDefaultSearch] Default search engine set to: ${nickname}`
      );
    } else {
      console.error(
        `[SetDefaultSearch] Attempted to set invalid default search engine: ${nickname}`
      );
    }
  },

  /**
   * 設定されているデフォルトサジェストエンジンを取得する
   * @returns {string} デフォルトサジェストエンジンのニックネーム
   */
  getDefaultSuggestEngine: function () {
    const storedDefault = localStorage.getItem(
      this.KEYS.DEFAULT_SUGGEST_ENGINE
    );
    // 保存された値が現在の有効なエンジンリストに存在し、かつサジェストURLを持つか確認
    if (
      storedDefault &&
      this.values.engines &&
      this.values.engines[storedDefault] &&
      this.values.engines[storedDefault].suggestUrl
    ) {
      return storedDefault;
    }
    // なければ、デフォルト値 ('g') が有効か確認
    const fallbackDefault = this.defaults.defaultSuggestEngine;
    if (
      this.values.engines &&
      this.values.engines[fallbackDefault] &&
      this.values.engines[fallbackDefault].suggestUrl
    ) {
      console.warn(
        `[GetDefaultSuggest] Using default value: ${fallbackDefault}`
      );
      return fallbackDefault;
    }
    // デフォルト値 ('g') も無効なら、サジェスト可能な最初のエンジンを探す
    const engineKeys = Object.keys(this.values.engines || {});
    for (const key of engineKeys) {
      if (this.values.engines[key].suggestUrl) {
        const firstSuggestEngine = key;
        console.warn(
          `[GetDefaultSuggest] Default '${fallbackDefault}' invalid, using first available with suggest: ${firstSuggestEngine}`
        );
        return firstSuggestEngine;
      }
    }
    console.error(
      "[GetDefaultSuggest] No valid engines with suggest URL available!"
    );
    return "g"; // 最終手段
  },

  /**
   * デフォルトサジェストエンジンを設定（保存）する
   * @param {string} nickname 設定するエンジンのニックネーム
   */
  setDefaultSuggestEngine: function (nickname) {
    // サジェストURLを持つ有効なエンジンか確認
    if (
      nickname &&
      this.values.engines &&
      this.values.engines[nickname] &&
      this.values.engines[nickname].suggestUrl
    ) {
      localStorage.setItem(this.KEYS.DEFAULT_SUGGEST_ENGINE, nickname);
      console.log(
        `[SetDefaultSuggest] Default suggest engine set to: ${nickname}`
      );
    } else {
      console.error(
        `[SetDefaultSuggest] Attempted to set invalid default suggest engine (or engine without suggest URL): ${nickname}`
      );
    }
  },

  /**
   * ファビコンキャッシュを追加または更新する
   * @param {string} domain - ドメイン名
   * @param {string} dataUrl - ファビコンの Data URL
   */
  setFaviconCache: function (domain, dataUrl) {
    if (!domain || !dataUrl) return;
    this.values.favicons[domain] = { url: dataUrl, timestamp: Date.now() };
    this.cleanFaviconCache(); // キャッシュ整理を実行
    this.save(); // 変更を保存
  },

  /**
   * ファビコンキャッシュを取得する
   * @param {string} domain - ドメイン名
   * @returns {string | null} ファビコンの Data URL、または null
   */
  getFaviconCache: function (domain) {
    const cacheEntry = this.values.favicons[domain];
    if (cacheEntry) {
      // 有効期限チェック (例: 30日)
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
      if (Date.now() - cacheEntry.timestamp < maxAge) {
        return cacheEntry.url;
      } else {
        // 古いキャッシュは削除
        delete this.values.favicons[domain];
        this.save(); // 削除を保存
        return null;
      }
    }
    return null;
  },

  /**
   * ファビコンキャッシュを整理する (古いものや上限を超えたものを削除)
   */
  cleanFaviconCache: function () {
    const maxCacheSize = 100; // キャッシュする最大件数 (例)
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    const now = Date.now();
    let cacheChanged = false;

    const domains = Object.keys(this.values.favicons);

    // 古いキャッシュを削除
    domains.forEach((domain) => {
      if (now - this.values.favicons[domain].timestamp >= maxAge) {
        delete this.values.favicons[domain];
        cacheChanged = true;
        console.log(
          `[CleanCache] Removed expired favicon cache for: ${domain}`
        );
      }
    });

    // 上限を超えている場合、古いものから削除
    const currentSize = Object.keys(this.values.favicons).length;
    if (currentSize > maxCacheSize) {
      // タイムスタンプでソートして古いものを見つける
      const sortedDomains = Object.keys(this.values.favicons).sort((a, b) => {
        return (
          this.values.favicons[a].timestamp - this.values.favicons[b].timestamp
        );
      });
      const domainsToRemove = sortedDomains.slice(
        0,
        currentSize - maxCacheSize
      );
      domainsToRemove.forEach((domain) => {
        delete this.values.favicons[domain];
        cacheChanged = true;
        console.log(
          `[CleanCache] Removed oldest favicon cache due to size limit: ${domain}`
        );
      });
    }

    // 変更があれば保存
    // if (cacheChanged) {
    //     this.save(); // save()は他の処理からも呼ばれるので、ここでは不要かも
    // }
  },

  /**
   * テーマ設定を適用する
   */
  applyTheme: function () {
    const theme = this.values.theme;
    document.body.classList.remove("light-theme", "dark-theme"); // 既存クラスを削除
    if (theme === "light") {
      document.body.classList.add("light-theme");
    } else if (theme === "dark") {
      document.body.classList.add("dark-theme");
    } else {
      // 'system' または不明な値
      // system テーマの処理 ( prefers-color-scheme を使うなど)
      // ここでは body に特定のクラスは付けず、CSS側で prefers-color-scheme を使う想定
    }
    console.log(`[ApplyTheme] Applied theme: ${theme}`);
  },

  /**
   * 背景設定を適用する (実装例)
   */
  applyBackground: function () {
    const backgroundValue = this.values.background;
    if (backgroundValue) {
      if (
        backgroundValue.startsWith("http") ||
        backgroundValue.startsWith("data:image")
      ) {
        // URL または Data URI の場合
        document.body.style.backgroundImage = `url('${backgroundValue}')`;
        document.body.style.backgroundSize = "cover"; // 例
        document.body.style.backgroundPosition = "center"; // 例
      } else if (
        backgroundValue.startsWith("#") ||
        backgroundValue.startsWith("rgb")
      ) {
        // 色コードの場合
        document.body.style.backgroundImage = "none";
        document.body.style.backgroundColor = backgroundValue;
      } else {
        // それ以外 (例: グラデーション指定など) は直接設定
        document.body.style.background = backgroundValue;
      }
      console.log(`[ApplyBackground] Applied background: ${backgroundValue}`);
    } else {
      // 設定がない場合はデフォルトに戻す
      document.body.style.backgroundImage = "";
      document.body.style.backgroundColor = ""; // またはデフォルト色
      document.body.style.background = "";
      console.log(`[ApplyBackground] Cleared background setting.`);
    }
  },

  // 他のヘルパーメソッドなどがあれば追加 (例: 設定のリセット機能など)
  resetToDefaults: function () {
    if (
      confirm(
        "本当にすべての設定をリセットしますか？\n(カスタムエンジン、スピードダイアル、テーマ設定などが初期化されます)"
      )
    ) {
      console.warn("[AppSettings] Resetting all settings to defaults...");
      // localStorage から関連キーを削除
      Object.values(this.KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });
      // ページをリロードしてデフォルト設定で再初期化
      location.reload();
    }
  },
};

// --- グローバルキャッシュ (任意だがパフォーマンス向上に寄与) ---
const cache = {
  engines: {},
  currentEngine: null,
  suggestions: {}, // ★★★ サジェストキャッシュ用のオブジェクトを追加 ★★★
  // 他に必要なキャッシュがあれば追加
  // 例: スピードダイアルの DOM 要素キャッシュなど
  speedDialItems: {},
};
// --- Settings Export/Import ---

/**
 * 現在の設定をJSONファイルとしてエクスポートする
 */
function exportSettings() {
  console.log("Exporting settings...");
  try {
    // 1. localStorageから現在の設定値を取得
    const settingsToExport = {
      version: 1, // 設定ファイルのバージョン
      customEngines:
        localStorage.getItem(AppSettings.KEYS.CUSTOM_ENGINES) || "{}",
      deletedBuiltinEngines:
        localStorage.getItem(AppSettings.KEYS.DELETED_BUILTIN) || "[]",
      speedDialData: localStorage.getItem(AppSettings.KEYS.SPEED_DIAL) || "[]",
      speedDialColumns: localStorage.getItem(AppSettings.KEYS.COLUMNS) || "4",
      faviconsCache: localStorage.getItem(AppSettings.KEYS.FAVICONS) || "{}",
      // 必要であれば他の設定項目も追加 (例: テーマ設定など)
    };

    // 2. 設定オブジェクトをJSON文字列に変換
    const jsonString = JSON.stringify(settingsToExport, null, 2); // null, 2 で整形

    // 3. JSON文字列をBlobオブジェクトに変換
    const blob = new Blob([jsonString], { type: "application/json" });

    // 4. ダウンロード用のリンクを作成してクリック
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    link.download = `startpage-settings-${timestamp}.json`; // ファイル名
    document.body.appendChild(link); // Firefoxで必要
    link.click();
    document.body.removeChild(link); // 後片付け
    URL.revokeObjectURL(link.href); // メモリ解放

    console.log("Settings exported successfully.");
    alert("設定がエクスポートされました。");
  } catch (error) {
    console.error("Error exporting settings:", error);
    alert("設定のエクスポート中にエラーが発生しました。");
  }
}

/**
 * インポートボタンがクリックされたときの処理 (ファイル選択をトリガー)
 */
function triggerImport() {
  if (elements.importSettingsFile) {
    elements.importSettingsFile.click(); // 非表示のinput[type=file]をクリック
  }
}

/**
 * ファイルが選択されたときの処理 (設定の読み込みと適用)
 * @param {Event} event - ファイル入力のchangeイベント
 */
function importSettings(event) {
  const file = event.target.files[0];
  if (!file) {
    console.log("No file selected for import.");
    return;
  }

  // ★ インポート実行前にユーザーに確認
  if (
    !confirm(
      "現在の設定がインポートする設定で上書きされます。よろしいですか？\n(※ ページがリロードされます)"
    )
  ) {
    // ファイル選択をリセット
    event.target.value = null;
    return;
  }

  console.log(`Importing settings from file: ${file.name}`);
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const jsonString = e.target.result;
      const importedSettings = JSON.parse(jsonString);

      // ★ バージョンチェック (将来的な互換性のため)
      if (!importedSettings || importedSettings.version !== 1) {
        throw new Error("無効な設定ファイル形式またはバージョンです。");
      }

      // ★ localStorageに各設定を書き込む
      localStorage.setItem(
        AppSettings.KEYS.CUSTOM_ENGINES,
        importedSettings.customEngines || "{}"
      );
      localStorage.setItem(
        AppSettings.KEYS.DELETED_BUILTIN,
        importedSettings.deletedBuiltinEngines || "[]"
      );
      localStorage.setItem(
        AppSettings.KEYS.SPEED_DIAL,
        importedSettings.speedDialData || "[]"
      );
      localStorage.setItem(
        AppSettings.KEYS.COLUMNS,
        importedSettings.speedDialColumns || "4"
      );
      localStorage.setItem(
        AppSettings.KEYS.FAVICONS,
        importedSettings.faviconsCache || "{}"
      );
      // 他の設定項目があればここに追加

      console.log("Settings imported successfully.");
      alert(
        "設定がインポートされました。ページをリロードして変更を適用します。"
      );

      // ★ 変更を確実に反映させるためにページをリロード
      location.reload();
    } catch (error) {
      console.error("Error importing settings:", error);
      alert(`設定のインポート中にエラーが発生しました:\n${error.message}`);
    } finally {
      // ファイル選択をリセット (同じファイルを再度選択できるように)
      event.target.value = null;
    }
  };

  reader.onerror = (e) => {
    console.error("Error reading settings file:", e);
    alert("設定ファイルの読み込みに失敗しました。");
    event.target.value = null;
  };

  // ファイルをテキストとして読み込む
  reader.readAsText(file);
}

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
  defaultSearchEngineSelect: document.getElementById(
    "defaultSearchEngineSelect"
  ),
  defaultSuggestEngineSelect: document.getElementById(
    "defaultSuggestEngineSelect"
  ),
  exportSettingsButton: document.getElementById("exportSettingsButton"),
  importSettingsButton: document.getElementById("importSettingsButton"),
  importSettingsFile: document.getElementById("importSettingsFile"),
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
  mobileSearchFocusButton: document.getElementById("mobileSearchFocusButton"),
  fetchTitleButton: document.getElementById("fetchTitleButton"),
};

/**
 * デフォルトエンジン選択のドロップダウンリストをレンダリングする
 */
function renderDefaultEngineSelectors() {
  if (
    !elements.defaultSearchEngineSelect ||
    !elements.defaultSuggestEngineSelect
  ) {
    console.warn("Default engine select elements not found.");
    return;
  }

  const searchSelect = elements.defaultSearchEngineSelect;
  const suggestSelect = elements.defaultSuggestEngineSelect;

  // オプションをクリア
  searchSelect.innerHTML = "";
  suggestSelect.innerHTML = "";

  const fragmentSearch = document.createDocumentFragment();
  const fragmentSuggest = document.createDocumentFragment();

  const currentDefaultSearch = AppSettings.getDefaultSearchEngine();
  const currentDefaultSuggest = AppSettings.getDefaultSuggestEngine();

  const sortedNicknames = Object.keys(AppSettings.values.engines).sort();

  sortedNicknames.forEach((nickname) => {
    const engine = AppSettings.values.engines[nickname];

    // --- デフォルト検索用オプション ---
    const optionSearch = document.createElement("option");
    optionSearch.value = nickname;
    optionSearch.textContent = `${nickname} - ${engine.name}`;
    if (nickname === currentDefaultSearch) {
      optionSearch.selected = true;
    }
    fragmentSearch.appendChild(optionSearch);

    // --- デフォルトサジェスト用オプション (サジェストURLを持つもののみ) ---
    if (engine.suggestUrl) {
      const optionSuggest = document.createElement("option");
      optionSuggest.value = nickname;
      optionSuggest.textContent = `${nickname} - ${engine.name}`;
      if (nickname === currentDefaultSuggest) {
        optionSuggest.selected = true;
      }
      fragmentSuggest.appendChild(optionSuggest);
    }
  });

  searchSelect.appendChild(fragmentSearch);
  suggestSelect.appendChild(fragmentSuggest);

  console.log("Rendered default engine selectors.");
}

let speedDialData = []; // Local variable for speed dial data
// let longPressTimerId = null; // ← state に移動したので不要
const LONG_PRESS_DURATION = 600; // ★ 長押し判定時間 (ミリ秒)

// --- Initialization ---
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

    // ★ ページ読み込み時の自動フォーカス処理を修正 (モバイルでは実行しない)
    setTimeout(() => {
      const isMobile = window.matchMedia("(max-width: 768px)").matches; // CSSのブレークポイントと合わせる
      if (!isMobile && elements.searchInput) {
        // モバイルでない場合のみ自動フォーカスを試みる
        try {
          elements.searchInput.focus({ preventScroll: true });
          console.log("Focused on search input on load (non-mobile).");
        } catch (e) {
          // サイレントモードのブラウザなど、フォーカスが失敗する場合がある
          console.warn("Failed to focus search input automatically.", e);
        }
      } else if (isMobile) {
        console.log("Auto-focus skipped on mobile.");
      } else {
        console.warn(
          "Search input element not found during init focus attempt."
        );
      }
    }, 100);
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
    debounce(updateSuggestions, 20)
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
          づ: "du", // or づ: 'zu'
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

  // ★ デフォルト検索エンジン選択のリスナー
  if (elements.defaultSearchEngineSelect) {
    elements.defaultSearchEngineSelect.addEventListener("change", (event) => {
      AppSettings.setDefaultSearchEngine(event.target.value);
      // 必要なら他のUIも更新 (例: getCurrentEngine のキャッシュ更新など)
      cache.currentEngine = AppSettings.getCurrentEngine(); // キャッシュ更新推奨
      updateCurrentEngineDisplay(); // 現在のエンジン表示も念のため更新
    });
  }

  // ★ デフォルトサジェストエンジン選択のリスナー
  if (elements.defaultSuggestEngineSelect) {
    elements.defaultSuggestEngineSelect.addEventListener("change", (event) => {
      AppSettings.setDefaultSuggestEngine(event.target.value);
    });
  }

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

  // ★ タイトル取得ボタンのリスナーを追加
  if (elements.fetchTitleButton) {
    elements.fetchTitleButton.addEventListener("click", handleFetchTitle); // ★ 専用のハンドラ関数を呼び出す
  }

  // ★ モバイル用検索フォーカスボタンのリスナーを修正
  if (elements.mobileSearchFocusButton) {
    elements.mobileSearchFocusButton.addEventListener("click", () => {
      // ★ 処理全体を setTimeout でラップし、イベント処理の競合を避ける
      setTimeout(() => {
        if (elements.searchInput) {
          // ★ 現在フォーカスされている要素が検索ボックスかどうかを判定
          if (document.activeElement === elements.searchInput) {
            // ★ フォーカスが合っている場合は検索を実行
            console.log(
              "[Mobile Focus Button] Search input focused, executing search."
            );
            executeSearch();
          } else {
            // ★ フォーカスが合っていない場合は検索ボックスにフォーカスを当てる
            console.log("[Mobile Focus Button] Focusing on search input.");
            elements.searchInput.focus();
          }
        } else {
          console.warn("[Mobile Focus Button] Search input element not found.");
        }
      }, 0); // 0ミリ秒の遅延で、現在のイベントサイクルの直後に実行
    });
  }

  document.addEventListener("visibilitychange", handleVisibilityChange);
}

// ★ 設定エクスポートボタンのリスナー
if (elements.exportSettingsButton) {
  elements.exportSettingsButton.addEventListener("click", () => {
    exportSettings();
    closeSettingsPanel(); // パネルを閉じる
  });
}

// ★ 設定インポートボタンのリスナー (ファイル選択をトリガー)
if (elements.importSettingsButton) {
  elements.importSettingsButton.addEventListener("click", () => {
    triggerImport();
    closeSettingsPanel(); // パネルを閉じる
  });
}

// ★ ファイル選択インプットのリスナー (ファイルが選ばれたらインポート処理)
if (elements.importSettingsFile) {
  elements.importSettingsFile.addEventListener("change", importSettings);
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

/**
 * 指定されたエンジン、または現在選択中のエンジンの表示を更新する
 * @param {string} [targetEngineNickname=null] 表示したいエンジンのニックネーム。nullの場合は現在選択中のエンジンを表示。
 */
function updateCurrentEngineDisplay(targetEngineNickname = null) {
  // ★ 表示対象のエンジンニックネームを決定
  const engineNicknameToShow =
    targetEngineNickname !== null
      ? targetEngineNickname
      : AppSettings.getCurrentEngine(); // 引数がなければ現在選択中のエンジン

  const engineData = AppSettings.values.engines[engineNicknameToShow];
  const defaultIconPath = "icons/default-search.svg"; // デフォルトアイコンパス

  // --- アイコン要素の取得 ---
  const iconElement = elements.currentEngineIcon;
  const initialElement = elements.currentEngineInitial;
  if (!iconElement || !initialElement) {
    console.error("Engine display elements not found.");
    return;
  }

  // --- onerror ハンドラの設定 (共通化) ---
  // 無限ループしないように、エラー時はデフォルトアイコンを表示してハンドラ解除
  iconElement.onerror = function () {
    if (this.src !== defaultIconPath) {
      // デフォルトアイコン自体でエラーになったら無限ループするのでチェック
      console.warn(
        `Failed to load icon: ${this.src}. Falling back to default.`
      );
      this.onerror = null; // ハンドラ解除
      this.src = defaultIconPath;
      this.style.display = "inline-block";
      initialElement.style.display = "none";
    } else {
      console.error(`Failed to load default icon: ${defaultIconPath}`);
      this.style.display = "none"; // デフォルトすら読めなければ非表示
      initialElement.style.display = "none";
    }
  };

  // --- エンジンデータに基づいて表示 ---
  if (engineData) {
    let iconSrc = engineData.iconUrl;
    // 1. 有効なアイコンURLがある場合
    if (
      iconSrc &&
      (isValidHttpUrl(iconSrc) || iconSrc.startsWith("data:image"))
    ) {
      // ★★★ 現在の src と異なる場合のみ設定 ★★★
      if (iconElement.src !== iconSrc) {
        console.log(
          `[updateCurrentEngineDisplay] Updating icon for ${engineNicknameToShow}: ${iconSrc}`
        );
        iconElement.src = iconSrc;
      }
      // 表示/非表示は常に設定 (イニシャル表示から切り替わる場合があるため)
      iconElement.style.display = "inline-block";
      initialElement.style.display = "none";
    }
    // 2. アイコンURLがない、または無効な場合 -> イニシャル表示
    else {
      if (iconSrc) {
        // 無効なURLが設定されていた場合
        console.warn(
          `[updateCurrentEngineDisplay] Invalid iconUrl for ${engineNicknameToShow}: ${iconSrc}. Showing initial.`
        );
      }
      // イニシャル表示関数を呼び出す
      displayInitialIcon(initialElement, iconElement, engineData.name);
    }
  }
  // 3. エンジンデータ自体が見つからない場合 -> デフォルトアイコン表示
  else {
    console.warn(
      `[updateCurrentEngineDisplay] Engine data not found for ${engineNicknameToShow}. Using default icon.`
    );
    // ★★★ 現在の src と異なる場合のみ設定 ★★★
    if (iconElement.src !== defaultIconPath) {
      console.log(`[updateCurrentEngineDisplay] Setting default icon.`);
      iconElement.src = defaultIconPath;
    }
    // 表示/非表示は常に設定
    iconElement.style.display = "inline-block";
    initialElement.style.display = "none";
  }

  // --- ツールチップ（title属性）の更新 ---
  const displayElement = elements.currentEngineDisplay;
  if (displayElement) {
    if (engineData) {
      displayElement.title = `検索エンジン: ${engineData.name} (${engineNicknameToShow})`;
    } else {
      displayElement.title = "検索エンジンを選択";
    }
  }
}

/**
 * イニシャルアイコンを表示するヘルパー関数
 * @param {HTMLElement} initialElement イニシャルを表示する要素 (例: span)
 * @param {HTMLElement} iconElement 画像アイコン要素 (例: img)
 * @param {string} name イニシャル生成用の名前
 */
function displayInitialIcon(initialElement, iconElement, name) {
  // 名前がない場合は '?' を使う
  const displayName = name || "";
  const initial = displayName.charAt(0).toUpperCase() || "?";

  if (initialElement) {
    // ★ テキスト内容が違う場合のみ更新 (ちらつき軽減)
    if (initialElement.textContent !== initial) {
      initialElement.textContent = initial;
    }
    initialElement.style.display = "flex"; // イニシャルを表示
  }
  if (iconElement) {
    iconElement.style.display = "none"; // 画像アイコンを非表示
    // ★ src を空にするのは一回だけで良い場合が多い
    if (iconElement.src !== "") {
      iconElement.src = ""; // srcをクリアして不要なロードを防ぐ
    }
  }
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
    newInputValue = nickname + " " + parts.slice(1).join(" ");
  } else if (currentInput.trim() === "") {
    newInputValue = nickname + " ";
  } else {
    newInputValue = nickname + " " + currentInput;
  }
  elements.searchInput.value = newInputValue;

  closeEngineSelectMenu();
  elements.searchInput.focus();

  // ★★★ AppSettings に保存し、表示も更新 ★★★
  AppSettings.setCurrentEngine(nickname); // localStorage に保存
  cache.currentEngine = nickname; // キャッシュも更新
  updateCurrentEngineDisplay(nickname); // ★ 表示を確定させる

  updateSuggestions(); // サジェストも更新
  updateClearButtonVisibility();
  updateActionButtonState();
}

// --- Search & Suggestions ---
function updateSuggestions() {
  updateClearButtonVisibility();
  updateActionButtonState();
  const input = elements.searchInput.value; // trim() は後で行う
  state.originalInputValue = input; // 元の値を保存

  let query = input.trim(); // サジェストクエリ用はトリム
  let engineNicknameForSuggest = AppSettings.getDefaultSuggestEngine();
  // ★★★ 表示用エンジンを【デフォルト検索エンジン】で初期化 ★★★
  let engineNicknameForDisplay = AppSettings.getDefaultSearchEngine();
  let searchTermsExist = false;
  let detectedNickname = null;

  const trimmedInput = input.trim(); // ニックネーム判定用にトリム

  if (trimmedInput) {
    // ★ トリムした入力で判定
    const parts = trimmedInput.split(" ");
    const potentialNickname = parts[0].toLowerCase();

    // 有効なニックネームか判定
    if (AppSettings.values.engines[potentialNickname]) {
      detectedNickname = potentialNickname;
      // ★★★ ニックネームが検出された場合のみ、表示用エンジンをそれに設定 ★★★
      engineNicknameForDisplay = potentialNickname;

      // --- サジェスト用エンジンの決定ロジック (変更なし) ---
      if (parts.length > 1) {
        searchTermsExist = true;
        query = parts.slice(1).join(" "); // サジェストクエリ
        if (AppSettings.values.engines[potentialNickname].suggestUrl) {
          engineNicknameForSuggest = potentialNickname;
        } else {
          query = trimmedInput; // サジェストは入力全体でデフォルトエンジンから取得
          engineNicknameForSuggest = AppSettings.getDefaultSuggestEngine();
        }
      } else {
        // ニックネームのみ入力されている場合
        query = ""; // サジェストクエリは空
        engineNicknameForSuggest = potentialNickname; // サジェストはそのエンジンで試す
      }
    } else {
      // ニックネーム指定がない場合
      query = trimmedInput; // サジェストクエリは入力全体
      engineNicknameForSuggest = AppSettings.getDefaultSuggestEngine();
      // ★★★ 表示用エンジンは初期値 (デフォルト検索エンジン) のまま ★★★
    }
  } else {
    // 入力が空の場合
    elements.suggestionsContainer.style.display = "none";
    state.lastQuery = "";
    // ★★★ 表示用エンジンは初期値 (デフォルト検索エンジン) のまま ★★★
  }

  // ★★★ 確定した engineNicknameForDisplay でアイコン表示を更新 ★★★
  updateCurrentEngineDisplay(engineNicknameForDisplay);

  // --- サジェスト取得処理 ---
  if (trimmedInput) {
    // ★ トリムした入力で判定
    // 検索語句があるか、ニックネーム指定がない場合にサジェスト取得
    if (searchTermsExist || detectedNickname === null) {
      state.actualEngine = engineNicknameForSuggest; // サジェスト取得に使うエンジン
      const cacheKey = `${engineNicknameForSuggest}:${query}`;
      if (state.lastQuery === query && cache.suggestions[cacheKey]) {
        displaySuggestions(cache.suggestions[cacheKey]);
        return; // キャッシュがあればそれを使う
      }
      state.lastQuery = query;
      fetchSuggestions(query, engineNicknameForSuggest);
    } else {
      // ニックネームのみ入力の場合はサジェスト非表示
      displaySuggestions([]);
      state.lastQuery = "";
      // ★ actualEngine は表示用と同じにする (検索実行時のため)
      state.actualEngine = engineNicknameForDisplay;
    }
  } else {
    displaySuggestions([]); // 入力が空ならクリア
    // ★ 入力が空の場合も actualEngine をデフォルト検索エンジンにリセット
    state.actualEngine = AppSettings.getDefaultSearchEngine();
  }
}

// ★ fetchSuggestions 関数は【方法3】の修正済みコードを想定
async function fetchSuggestions(query, engine) {
  console.log(`[fetchSuggestions] START - Engine: ${engine}, Query: ${query}`);
  const engineData = AppSettings.values.engines[engine];

  // --- エンジンデータまたはサジェストURLが存在しない場合は終了 ---
  if (!engineData || !engineData.suggestUrl) {
    console.log(
      `[fetchSuggestions] No suggestion URL configured for engine: ${engine}`
    );
    displaySuggestions([]);
    return;
  }

  // --- suggestUrl が有効なURLか基本的なチェック ---
  let suggestApiUrl;
  try {
    suggestApiUrl = engineData.suggestUrl;
    // 基本的には suggestUrl に完全なURLが入っているはずだが、
    // ユーザー入力や古い設定のためにレガシーニックネームの場合も考慮
    if (!isValidHttpUrl(suggestApiUrl) && !suggestApiUrl.startsWith("data:")) {
      console.log(
        `[fetchSuggestions] suggestUrl '${suggestApiUrl}' is not a full URL, checking legacy map.`
      );
      // ★ ユーザー指定のレガシー変換マップ
      const legacyUrls = {
        g: "https://suggestqueries.google.com/complete/search?client=firefox&hl=ja", // 日本語指定
        gs: "https://suggestqueries.google.com/complete/search?client=firefox&hl=en", // 英語指定
        b: "https://api.bing.com/osjson.aspx?query=", // 末尾に query= を付けておくのが親切かも
        d: "https://duckduckgo.com/ac/?q=", // 末尾に q= を付けておくのが親切かも
        // ★ 新しく追加したエンジンのニックネームもここに追加可能 (w, y, a)
        w: builtinEngines.w.suggestUrl,
        y: builtinEngines.y.suggestUrl,
        a: builtinEngines.a.suggestUrl,
      };
      if (legacyUrls[suggestApiUrl]) {
        console.warn(
          `[fetchSuggestions] Legacy suggestUrl '${suggestApiUrl}' found, converting to full URL: ${legacyUrls[suggestApiUrl]}`
        );
        suggestApiUrl = legacyUrls[suggestApiUrl];
        // ★ 任意: 変換後のURLを保存する処理
        // AppSettings.values.engines[engine].suggestUrl = suggestApiUrl;
        // AppSettings.save();
      } else {
        // レガシーマップにもなければエラー
        throw new Error(
          `Invalid suggestUrl format or unknown legacy nickname: ${suggestApiUrl}`
        );
      }
    }
  } catch (error) {
    console.error(
      `[fetchSuggestions] Invalid or missing suggestUrl for engine ${engine}:`,
      engineData.suggestUrl,
      error.message
    );
    displaySuggestions([]);
    return;
  }

  // --- プロキシ経由でリクエストを実行 ---
  console.log("[fetchSuggestions] Using proxy for suggestion request.");
  const encodedQuery = encodeURIComponent(query);

  // ★★★ suggestApiUrl からベースURLを抽出する ★★★
  let baseSuggestApiUrl;
  try {
    const tempUrl = new URL(suggestApiUrl);
    // クエリパラメータ 'q' を削除 (他のパラメータは保持)
    tempUrl.searchParams.delete("q");
    // 他の一般的なクエリパラメータ名も削除候補 (例: 'query', 'term')
    tempUrl.searchParams.delete("query");
    tempUrl.searchParams.delete("term");
    // 末尾のスラッシュがあれば削除する (任意だが統一のため)
    baseSuggestApiUrl = tempUrl.toString().replace(/\/$/, "");
    console.log(
      `[fetchSuggestions] Extracted base suggest URL: ${baseSuggestApiUrl}`
    );
  } catch (e) {
    console.error(
      `[fetchSuggestions] Failed to parse suggestApiUrl to extract base URL: ${suggestApiUrl}`,
      e
    );
    // エラー時は元のURLをそのまま使う (サーバー側でのエラーになる可能性)
    baseSuggestApiUrl = suggestApiUrl;
  }

  // ★★★ エンコードするのは抽出したベースURL ★★★
  const encodedTargetUrl = encodeURIComponent(baseSuggestApiUrl);
  const proxyUrl = `/suggest?engine=${engine}&q=${encodedQuery}&target_url=${encodedTargetUrl}`;

  console.log(`[fetchSuggestions] Fetching via proxy: ${proxyUrl}`);
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒タイムアウト

    const response = await fetch(proxyUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    console.log(
      `[fetchSuggestions] Proxy fetch completed for ${engine}, Status: ${response.status}`
    );

    if (!response.ok) {
      console.error(
        `[fetchSuggestions] Proxy request failed: ${response.status} ${response.statusText}`
      );
      const errorData = await response.json().catch(() => ({}));
      console.error("[fetchSuggestions] Proxy error details:", errorData);
      displaySuggestions([]); // エラー時は候補をクリア
      return;
    }
    const data = await response.json();
    console.log(
      `[fetchSuggestions] Received proxy data for ${engine}, calling processSuggestionData...`
    );
    processSuggestionData(data, engine, query); // 取得データを処理
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
    displaySuggestions([]); // エラー時は候補をクリア
  } finally {
    console.log("[fetchSuggestions] Exiting fetchSuggestions block");
  }
  // ★ JSONP関連の else if や tryFallbackToJsonp は削除
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
  let suggestions = [];
  console.log(`Processing suggestions for ${engine}:`, data);

  try {
    // --- エンジンごとの形式処理 ---
    // ★ Google (g, ge, gsなど), Bing (b), Wikipedia (w) - 共通形式 ["query", [results], ...]
    if (["g", "ge", "gs", "b", "w"].includes(engine)) {
      if (Array.isArray(data) && data.length > 1 && Array.isArray(data[1])) {
        suggestions = data[1]; // ★ 正しくサジェスト配列を取得
      } else {
        console.warn(
          `Unexpected Google/Bing/Wikipedia format for ${engine}:`,
          data
        );
      }
    }
    // ★ DuckDuckGo (d) - [{"phrase": "suggestion"}, ...]
    else if (engine === "d") {
      if (Array.isArray(data)) {
        suggestions = data.map((item) => item.phrase).filter(Boolean);
      } else {
        console.warn(`Unexpected DuckDuckGo format for ${engine}:`, data);
      }
    }
    // ★ 他のカスタムエンジン用の処理 (必要なら追加)
    // else if (engine === 'amazon') { ... }

    // --- 不明なエンジン/形式のフォールバック ---
    else {
      console.warn(
        `Processing logic not defined for engine '${engine}'. Attempting generic extraction.`
      );
      // 汎用的な処理を試みる (より安全な方法)
      if (Array.isArray(data)) {
        if (
          data.length > 1 &&
          Array.isArray(data[1]) &&
          typeof data[1][0] === "string"
        ) {
          suggestions = data[1]; // Google/Bing形式と仮定
        } else if (data.every((item) => typeof item === "string")) {
          suggestions = data; // 単純な文字列配列と仮定
        } else if (
          data.every(
            (item) => typeof item === "object" && item !== null && item.phrase
          )
        ) {
          suggestions = data.map((item) => item.phrase).filter(Boolean); // DDG形式と仮定
        }
      } else if (typeof data === "object" && data !== null) {
        if (Array.isArray(data.suggestions)) suggestions = data.suggestions;
        else if (Array.isArray(data.results)) suggestions = data.results;
      }
      // それでも抽出できなかった場合
      if (suggestions.length === 0) {
        console.warn(
          `Could not extract suggestions using generic methods for ${engine}:`,
          data
        );
      }
    }

    // ★ 以前の間違ったフォールバックを削除:
    // if (suggestions.length === 0 && Array.isArray(data)) {
    //     console.warn(`Unexpected or unhandled suggestion data format for ${engine}:`, data);
    //     suggestions = [query]; // ← この行を削除！
    // }
  } catch (error) {
    console.error(
      `Error processing suggestion data for ${engine}:`,
      error,
      data
    );
    suggestions = []; // エラー時は常に空配列
  }

  // --- サジェストリストの整形とキャッシュ、表示 ---
  const maxSuggestions = 10;
  const filteredSuggestions = suggestions.slice(0, maxSuggestions);

  console.log(`Extracted suggestions for ${engine}:`, filteredSuggestions); // ★ ここで正しい配列が出るはず

  // キャッシュに保存
  const cacheKey = `${engine}:${query}`;
  cache.suggestions[cacheKey] = filteredSuggestions;

  // UIに表示
  displaySuggestions(filteredSuggestions);
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
    // ★★★ state.actualEngine を使う ★★★
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
    // ★ イベントを 'mousedown' に変更し、stopPropagation() を呼び出す
    arrowButton.addEventListener("mousedown", (e) => {
      e.stopPropagation(); // ★ 親要素(item)への mousedown イベントの伝播を停止
      applySuggestionToBox(suggestionText);
      // mousedown でフォーカスが外れるのを防ぐ (任意だがUX向上)
      e.preventDefault();
    });
    // ★ 念のため、click イベントでも stopPropagation を行う (環境による差異吸収)
    arrowButton.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault(); // click のデフォルト動作も抑制
    });

    item.appendChild(engineIndicator);
    item.appendChild(textSpan);
    item.appendChild(arrowButton);

    item.addEventListener("mousedown", (event) => {
      // ★ mousedown時の処理を変更
      event.preventDefault(); // フォーカスが外れるのを防ぐ

      // 1. 元の入力からプレフィックスを取得
      const parts = state.originalInputValue.split(" ");
      const potentialNickname = parts[0].toLowerCase();
      let prefix = null;
      if (AppSettings.values.engines[potentialNickname]) {
          prefix = potentialNickname;
      }

      // 2. 新しい入力値を構築
      const newValue = prefix ? `${prefix} ${suggestionText}` : suggestionText;

      // 3. 入力値を設定し、IME確定を促すinputイベントを発火
      elements.searchInput.value = newValue;
      try {
        const inputEvent = new Event("input", { bubbles: true, cancelable: true });
        elements.searchInput.dispatchEvent(inputEvent);
      } catch (e) {
        console.error("Error dispatching input event:", e);
      }

      // 4. 構築した入力値で検索を実行
      executeSearch();
    });

    fragment.appendChild(item);
  });

  elements.suggestionsContainer.appendChild(fragment);
  elements.suggestionsContainer.style.display = "block";
  feather.replace();
  state.selectedSuggestionIndex = -1;
}

function applySuggestionToBox(suggestion) {
  const engineToUse = state.actualEngine;
  const newValue = `${engineToUse} ${suggestion}`;
  console.log(
    `[applySuggestionToBox] Setting input value to: "${newValue}" (Engine: ${engineToUse}, Suggestion: ${suggestion})`
  );

  // 値を設定
  elements.searchInput.value = newValue;

  // ★★★ input イベントを手動で発火させる ★★★
  // これにより、IMEや他のリスナーが値の変更を検知し、未確定文字がクリアされることを期待する
  try {
    const inputEvent = new Event("input", { bubbles: true, cancelable: true });
    elements.searchInput.dispatchEvent(inputEvent);
    console.log("[applySuggestionToBox] Dispatched input event.");
  } catch (e) {
    console.error("[applySuggestionToBox] Error dispatching input event:", e);
  }
  // ★★★ ここまで追加 ★★★

  // フォーカスを維持し、カーソルを末尾に移動
  try {
    elements.searchInput.focus();
    elements.searchInput.selectionStart = elements.searchInput.selectionEnd =
      elements.searchInput.value.length;
  } catch (e) {
    console.warn("Error during focus or setting selection range:", e);
  }

  elements.suggestionsContainer.style.display = "none";
  state.originalInputValue = elements.searchInput.value;
  updateClearButtonVisibility();
  updateActionButtonState();
  updateSuggestions(); // サジェスト更新はイベント発火後の方が良いかもしれない
}

function executeSearchWithSuggestion(suggestion) {
  console.log(`Executing search with suggestion: ${suggestion}`); // デバッグ用ログ
  const searchUrl = AppSettings.values.engines[state.actualEngine]?.url.replace(
    /%s/g,
    encodeURIComponent(suggestion)
  );
  if (searchUrl) {
    console.log(`Navigating to: ${searchUrl}`); // デバッグ用ログ
    window.location.href = searchUrl;
  } else {
    console.error(
      "Cannot execute search, engine URL not found for:",
      state.actualEngine
    );
  }
}

function executeSearch() {
  const input = elements.searchInput.value.trim();
  if (!input) return;

  // ★★★ URL形式かどうかの判定処理を追加 ★★★
  // processClipboard と同様のロジックを使用
  const isUrlLikely =
    /^(https?:\/\/|www\.)/i.test(input) || // http://, https://, www. で始まる
    (input.includes(".") &&
      !input.includes(" ") &&
      !input.startsWith("localhost")); // スペースを含まず . を含み、localhost以外 (ローカル開発用ファイルパス等を除外)

  if (isUrlLikely) {
    let urlToNavigate = input;
    // 'www.' で始まる場合やプロトコルがない場合に 'https://' を補完
    if (!input.startsWith("http://") && !input.startsWith("https://")) {
      urlToNavigate = "https://" + input;
    }
    console.log(
      "[executeSearch] Input detected as URL, navigating to:",
      urlToNavigate
    );
    try {
      // ★ 念のため、URLとして有効か最終チェック (無効なら検索にフォールバック)
      new URL(urlToNavigate); // これがエラーを投げなければ有効な形式
      window.location.href = urlToNavigate;
      return; // URLへ遷移したのでここで終了
    } catch (e) {
      console.warn(
        "[executeSearch] Input looked like URL but failed validation, proceeding with search:",
        e.message
      );
      // URLの形式が無効だった場合は、通常の検索処理に進む
    }
  }

  // --- URL形式でない場合、またはURL検証でエラーになった場合の検索処理 ---
  console.log(
    "[executeSearch] Input is not a URL or validation failed, proceeding with search for:",
    input
  );
  const parts = input.split(" ");
  const nickname = parts[0].toLowerCase();
  const searchTerms = parts.slice(1).join(" ");

  let searchUrl = "";
  let targetEngine = AppSettings.getDefaultSearchEngine(); // デフォルト検索エンジンを取得

  // ニックネーム指定があり、かつ検索語句がある場合
  if (AppSettings.values.engines[nickname] && searchTerms) {
    targetEngine = nickname;
    searchUrl = AppSettings.values.engines[nickname].url.replace(
      /%s/g,
      encodeURIComponent(searchTerms)
    );
    console.log(
      `[executeSearch] Using engine '${targetEngine}' for terms: '${searchTerms}'`
    );
  }
  // ニックネーム指定がない、またはニックネームのみの場合 (入力全体を検索)
  else {
    // デフォルトエンジンが有効か確認
    if (AppSettings.values.engines[targetEngine]) {
      searchUrl = AppSettings.values.engines[targetEngine].url.replace(
        /%s/g,
        encodeURIComponent(input) // 入力全体を検索語句とする
      );
      console.log(
        `[executeSearch] Using default engine '${targetEngine}' for input: '${input}'`
      );
    } else {
      // デフォルトエンジンが見つからない場合のフォールバック
      console.error(
        "[executeSearch] Default search engine not found! Falling back to Google."
      );
      const fallbackEngineKey = "g"; // Googleをフォールバック先とする
      if (builtinEngines[fallbackEngineKey]) {
        targetEngine = fallbackEngineKey;
        searchUrl = builtinEngines[fallbackEngineKey].url.replace(
          /%s/g,
          encodeURIComponent(input)
        );
      } else {
        // Googleすら定義されていない最悪のケース
        alert("デフォルトの検索エンジンが見つかりません。");
        return; // 検索URLが生成できないので終了
      }
    }
  }

  // --- 生成された検索URLへ遷移 ---
  if (searchUrl) {
    console.log("[executeSearch] Navigating to search URL:", searchUrl);
    window.location.href = searchUrl;
  } else {
    // 通常ここには到達しないはずだが、念のため
    console.error("[executeSearch] Failed to generate search URL.");
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
  console.log("[processClipboard] Attempting to read clipboard..."); // ★ デバッグログ追加
  console.log("[processClipboard] Current protocol:", location.protocol); // ★ プロトコル確認ログ

  // --- HTTPS接続チェックを先に行う ---
  if (location.protocol !== "https:") {
    console.error("[processClipboard] Clipboard API requires HTTPS.");
    alert(
      "クリップボード機能を利用するには、安全な接続 (HTTPS) が必要です。\n現在の接続は " +
        location.protocol +
        " です。"
    );
    return; // HTTPSでない場合はここで処理終了
  }

  // --- クリップボードAPIの存在チェック ---
  if (!navigator.clipboard || !navigator.clipboard.readText) {
    console.error("[processClipboard] Clipboard API (readText) not supported.");
    alert("お使いのブラウザはクリップボードの読み取りに対応していません。");
    return;
  }

  // --- クリップボード読み取り実行 ---
  try {
    console.log("[processClipboard] Calling navigator.clipboard.readText()..."); // ★ API呼び出し前ログ
    const text = await navigator.clipboard.readText(); // ★ ここで権限要求が行われるはず
    console.log("[processClipboard] Clipboard read successfully."); // ★ 成功ログ

    if (!text) {
      console.log("[processClipboard] Clipboard is empty.");
      return; // クリップボードが空なら終了
    }

    const trimmedText = text.trim();
    console.log("[processClipboard] Clipboard content:", trimmedText); // ★ 内容ログ

    // --- URLかどうかの判定と処理 (変更なし) ---
    const isUrl =
      /^(https?:\/\/|www\.)/i.test(trimmedText) ||
      (trimmedText.includes(".") && !trimmedText.includes(" "));

    if (isUrl) {
      let url = trimmedText;
      if (
        !trimmedText.startsWith("http://") &&
        !trimmedText.startsWith("https://")
      ) {
        url = "https://" + trimmedText;
      }
      console.log("[processClipboard] Navigating to URL:", url);
      window.location.href = url;
    } else {
      console.log("[processClipboard] Treating as search term:", trimmedText);
      const defaultEngineKey = AppSettings.values.engines["g"]
        ? "g"
        : Object.keys(AppSettings.values.engines)[0];
      if (defaultEngineKey && AppSettings.values.engines[defaultEngineKey]) {
        const searchUrl = AppSettings.values.engines[
          defaultEngineKey
        ].url.replace(/%s/g, encodeURIComponent(trimmedText)); // ★ trimmedText を使用
        console.log(
          "[processClipboard] Executing search with default engine:",
          searchUrl
        );
        window.location.href = searchUrl;
      } else {
        console.error("[processClipboard] Default search engine not found.");
        alert("デフォルトの検索エンジン (g) が設定されていません。");
      }
    }
  } catch (err) {
    // --- エラーハンドリング ---
    console.error(
      "[processClipboard] Error reading clipboard:",
      err.name,
      err.message,
      err
    ); // ★ エラー詳細ログ
    let message = "クリップボードの読み取りに失敗しました。";

    if (err.name === "NotAllowedError") {
      // ユーザーが許可しなかった場合、または設定でブロックされている可能性
      message += "\nクリップボードへのアクセス許可が必要です。";
      // モバイルの場合、ブラウザの設定やOSの設定を確認するよう促す
      if (window.matchMedia("(max-width: 768px)").matches) {
        message +=
          "\nブラウザアプリの権限設定やOSのプライバシー設定を確認してください。";
      } else {
        message +=
          "\nブラウザのアドレスバー付近に表示される権限アイコンを確認するか、サイト設定をご確認ください。";
      }
    } else if (err.name === "SecurityError") {
      message +=
        "\nセキュリティ上の理由でアクセスがブロックされました。ページがアクティブでない場合などに発生することがあります。";
    } else {
      // その他のエラー (NotFoundError なども含む)
      message += "\n予期せぬエラーが発生しました (" + err.name + ")。";
    }
    alert(message);
  }
}

// --- Speed Dial Management ---
function handleColumnsChange() {
  console.log("handleColumnsChange called"); // ★ 呼び出し確認
  const columnsInput = elements.columnsInput;
  const columns = parseInt(columnsInput.value, 10);
  const minCols = parseInt(columnsInput.min, 10);
  const maxCols = parseInt(columnsInput.max, 10);
  console.log(
    `Input value: ${columnsInput.value}, Parsed: ${columns}, Min: ${minCols}, Max: ${maxCols}`
  ); // ★ 値確認

  if (!isNaN(columns) && columns >= minCols && columns <= maxCols) {
    console.log(`Validation passed. Setting columns to ${columns}`); // ★ バリデーション確認
    // AppSettings.values.columns に値を設定
    AppSettings.values.columns = columns;
    console.log(
      "Updated AppSettings.values.columns:",
      AppSettings.values.columns
    ); // ★ 値更新確認

    console.log("Calling AppSettings.save()..."); // ★ 保存呼び出し確認
    AppSettings.save(); // 設定をlocalStorageに保存
    console.log("AppSettings.save() finished.");

    console.log("Calling updateGrid()..."); // ★ グリッド更新呼び出し確認
    updateGrid(columns); // グリッド表示を更新
    console.log("updateGrid() finished.");
  } else {
    console.warn("Invalid column value entered:", columnsInput.value);
  }
}

function updateGrid(columns = null) {
  console.log(`updateGrid called. columns param: ${columns}`); // ★ 呼び出し確認
  // AppSettings.values.columns から確実に値を取得する
  const colsToUse = columns !== null ? columns : AppSettings.values.columns;
  console.log(`Using columns: ${colsToUse}`); // ★ 使用する列数確認

  // elements.columnsInput が存在するか確認 (min/max取得のため)
  if (!elements.columnsInput) {
    console.error("columnsInput element not found in updateGrid");
    return;
  }
  const minCols = parseInt(elements.columnsInput.min, 10);
  const maxCols = parseInt(elements.columnsInput.max, 10);

  // 念のためここでもバリデーション/範囲制限
  const validColsToUse = Math.max(
    minCols || 1,
    Math.min(maxCols || 15, colsToUse || AppSettings.defaults.columns)
  );
  console.log(`Valid columns to use: ${validColsToUse}`); // ★ 最終的な列数確認

  // elements.speedDialGrid が存在するか確認
  if (elements.speedDialGrid) {
    const gridTemplateColumnsValue = `repeat(${validColsToUse}, 1fr)`;
    console.log(`Setting gridTemplateColumns to: ${gridTemplateColumnsValue}`); // ★ 設定値確認
    elements.speedDialGrid.style.gridTemplateColumns = gridTemplateColumnsValue;
  } else {
    console.error("speedDialGrid element not found in updateGrid");
  }
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
  const iconSource = data.icon; // 保存されたアイコン情報 (URL or Data URL or null)

  // ★★★ アイコンソースが Data URL または 有効な HTTP/HTTPS URL の場合 ★★★
  if (
    iconSource &&
    (iconSource.startsWith("data:image") || isValidHttpUrl(iconSource))
  ) {
    iconElement = document.createElement("img");
    iconElement.src = iconSource; // ★ data.icon (URL or Data URL) を src に設定
    iconElement.alt = data.name;
    iconElement.loading = "lazy";

    // 保存された adjustment データに基づいて filter スタイルを適用
    const adj = data.adjustment || { hue: 0, saturate: 100, brightness: 100 };
    iconElement.style.filter = `hue-rotate(${adj.hue}deg) saturate(${adj.saturate}%) brightness(${adj.brightness}%)`;

    // エラー時のフォールバック
    iconElement.onerror = () => {
      console.warn("Error loading speed dial icon:", iconSource);
      // ★ エラー時は、img要素自体をイニシャルアイコン要素に置き換える
      const initialFallback = createInitialIcon(data.name);
      iconElement.replaceWith(initialFallback); // replaceWith を使う
    };
  } else {
    // ★ アイコンソースがない、または無効な形式の場合はイニシャル表示
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

/**
 * ★ スピードダイアル編集モーダルの「タイトル取得」ボタンクリック時の処理
 */
async function handleFetchTitle() {
  const urlInput = elements.siteUrlInput;
  const nameInput = elements.siteNameInput;
  const button = elements.fetchTitleButton;
  const url = urlInput.value.trim();

  if (!isValidHttpUrl(url)) {
    alert("有効なURLを入力してください。");
    return;
  }

  // ボタンを無効化し、スピナー表示（元のアイコンを一時的に保持）
  const originalButtonContent = button.innerHTML;
  button.disabled = true;
  button.innerHTML = '<div class="spinner"></div>';

  try {
    console.log(`[handleFetchTitle] Fetching title for: ${url}`);
    const fetchedTitle = await fetchTitleFromUrl(url); // 既存のタイトル取得関数を呼び出し

    if (fetchedTitle) {
      console.log(`[handleFetchTitle] Title fetched: ${fetchedTitle}`);
      nameInput.value = fetchedTitle; // 取得したタイトルを入力欄に設定
    } else {
      console.warn(
        "[handleFetchTitle] Failed to fetch title or title was empty."
      );
      // ユーザーにフィードバック（任意）
      alert(
        "タイトルを取得できませんでした。URLを確認するか、手動で入力してください。"
      );
    }
  } catch (error) {
    // fetchTitleFromUrl 内で既にコンソールエラーは出力されているはず
    console.error(
      "[handleFetchTitle] Error occurred during title fetch:",
      error
    );
    alert("タイトルの取得中にエラーが発生しました。");
  } finally {
    // ボタンの状態を元に戻す
    button.disabled = false;
    button.innerHTML = originalButtonContent;
    feather.replace(); // アイコン再描画
  }
}

function saveSpeedDial() {
  console.log("saveSpeedDial function called"); // ★ 関数呼び出し確認

  const name = elements.siteNameInput.value.trim();
  const url = elements.siteUrlInput.value.trim();
  console.log("Saving:", { name, url }); // ★ 入力値確認

  // --- バリデーション ---
  if (!name || !url) {
    alert("サイト名とURLは必須です。");
    console.log("Validation failed: Name or URL is empty."); // ★ バリデーション失敗ログ
    return;
  }
  if (!isValidHttpUrl(url)) {
    alert("有効なURL形式 (http(s)://...) を入力してください。");
    console.log("Validation failed: Invalid URL format."); // ★ バリデーション失敗ログ
    return;
  }
  console.log("Validation passed."); // ★ バリデーション通過ログ

  // --- アイコンデータの決定 ---
  let finalIcon = null;
  if (state.manualIconDataUrl) {
    finalIcon = state.manualIconDataUrl;
    console.log("Using manual icon.");
  } else if (state.fetchedIconUrl) {
    finalIcon = state.fetchedIconUrl;
    console.log("Using fetched icon.");
  } else if (
    state.editingIndex > -1 &&
    AppSettings.values.speedDial[state.editingIndex]?.icon && // Optional chaining
    !elements.siteIconInput.files[0] // ファイルが新たに選択されていない場合
  ) {
    // 編集モードで、既存のアイコンがあり、新しいファイルが選択されていない場合は既存アイコンを維持
    finalIcon = AppSettings.values.speedDial[state.editingIndex].icon;
    console.log("Keeping existing icon during edit.");
  } else {
    console.log(
      "No specific icon set, will use null (or let creation handle initials)."
    );
  }

  // --- 調整値の取得 ---
  const adjustmentData = { ...state.currentAdjustment };
  console.log("Adjustment data:", adjustmentData);

  // --- 新しいアイテムデータの作成 ---
  const newItem = { name, url, icon: finalIcon, adjustment: adjustmentData };
  console.log("New item data:", newItem);

  // --- 配列への追加または更新 ---
  if (state.editingIndex > -1) {
    // 編集モード
    if (AppSettings.values.speedDial[state.editingIndex]) {
      // 念のためインデックス存在確認
      AppSettings.values.speedDial[state.editingIndex] = newItem;
      console.log(`Updated item at index ${state.editingIndex}`);
    } else {
      console.error(
        `Error updating: Index ${state.editingIndex} not found in speedDial array.`
      );
      alert("エラーが発生しました。アイテムの更新に失敗しました。");
      return; // エラー発生時は中断
    }
  } else {
    // 新規追加モード
    AppSettings.values.speedDial.push(newItem);
    console.log("Added new item to speedDial array.");
  }

  // --- localStorageへの保存 ---
  console.log("Calling AppSettings.save()...");
  AppSettings.save(); // ★ save() を呼び出す (setSpeedDialは不要)
  console.log("AppSettings.save() finished.");

  // --- UIの更新とモーダルを閉じる ---
  console.log("Calling renderSpeedDial()...");
  renderSpeedDial();
  console.log("renderSpeedDial() finished.");

  console.log("Calling closeModal()...");
  closeModal();
  console.log("closeModal() finished.");
}

function closeModal() {
  elements.speedDialModal.classList.remove("visible");
  state.editingIndex = -1;
  state.fetchedIconUrl = null;
  state.manualIconDataUrl = null;
}

function deleteSpeedDial(index) {
  // ★ 削除対象が存在するか念のため確認
  if (!AppSettings.values.speedDial || !AppSettings.values.speedDial[index]) {
    console.error(`[deleteSpeedDial] Item at index ${index} not found.`);
    return;
  }

  if (
    confirm(`「${AppSettings.values.speedDial[index].name}」を削除しますか？`)
  ) {
    AppSettings.values.speedDial.splice(index, 1); // 配列から削除
    AppSettings.save(); // ★ 変更を localStorage に保存する
    renderSpeedDial(); // UIを再描画
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
  renderDefaultEngineSelectors();
  elements.engineModal.classList.add("visible");
  feather.replace();
}

function closeEngineModal() {
  elements.engineModal.classList.remove("visible");
  state.editingEngine = null; // ★ 閉じる際にもリセットするのが安全
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
  renderDefaultEngineSelectors();
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
  // ★★★ まず全ての入力値を取得する ★★★
  const newNickname = elements.engineNicknameInput.value.trim().toLowerCase();
  const name = elements.engineNameInput.value.trim();
  const url = elements.engineUrlInput.value.trim();
  const suggestUrl = elements.engineSuggestUrlInput.value.trim();
  const iconUrl = elements.engineIconUrlInput.value.trim(); // ★ ここで取得する

  // --- バリデーション ---
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
  // ★ アイコンURLの形式チェック (任意だが推奨)
  if (
    iconUrl &&
    !isValidHttpUrl(iconUrl) &&
    !iconUrl.startsWith("data:image")
  ) {
    alert(
      "アイコンURLの形式が正しくないようです。\nhttp://, https://, または data:image で始まる必要があります。"
    );
    return;
  }

  // --- ニックネームの重複チェック (編集時を除く) ---
  if (
    state.editingEngine !== newNickname && // 編集中のニックネーム自体は許可
    AppSettings.values.engines[newNickname] // 新しいニックネームが既に存在するか
  ) {
    alert(`ニックネーム '${newNickname}' は既に使用されています。`);
    return;
  }

  // --- 新しいエンジンデータを作成 ---
  const newEngineData = {
    name,
    url,
    // ★ 入力された suggestUrl をそのまま使う。空なら null ★
    suggestUrl: suggestUrl || null,
    iconUrl: iconUrl || null,
  };

  // --- エンジンデータの更新/追加ロジック ---
  const isEditing = state.editingEngine !== null;
  const originalNickname = state.editingEngine; // 元のニックネームを保持

  const isBuiltinOriginal = !!builtinEngines[originalNickname]; // 元がビルトインか

  if (isEditing) {
    console.log(
      `Editing existing engine. Original: ${originalNickname}, New: ${newNickname}, Was Builtin: ${isBuiltinOriginal}`
    );
    if (originalNickname === newNickname) {
      // ニックネーム変更なし
      AppSettings.values.engines[newNickname] = newEngineData;
      console.log(`Engine updated (no nickname change): ${newNickname}`);
    } else {
      // ニックネーム変更あり
      // 1. 新しいニックネームでデータを保存
      AppSettings.values.engines[newNickname] = newEngineData;
      // 2. 古いニックネームのエントリを内部状態から削除
      if (AppSettings.values.engines[originalNickname]) {
        delete AppSettings.values.engines[originalNickname];
        console.log(
          `Internal engine state updated, deleted old entry: ${originalNickname}`
        );
      }
      // ★★★ 3. 元のニックネームがビルトインの場合、削除済みリストに追加 ★★★
      if (
        isBuiltinOriginal &&
        !AppSettings.values.deletedBuiltinEngines.includes(originalNickname)
      ) {
        AppSettings.values.deletedBuiltinEngines.push(originalNickname);
        console.log(`Added ${originalNickname} to deletedBuiltinEngines list.`);
      }
      console.log(`Engine updated (nickname changed): ${newNickname}`);
    }
  } else {
    // 新規追加
    AppSettings.values.engines[newNickname] = newEngineData;
    console.log(`New engine added: ${newNickname}`);
  }

  // --- 削除済みリストからの復帰処理 ---
  // 新しいニックネームが削除済みリストにあれば復帰させる
  const indexInDeleted =
    AppSettings.values.deletedBuiltinEngines.indexOf(newNickname);
  if (indexInDeleted > -1) {
    AppSettings.values.deletedBuiltinEngines.splice(indexInDeleted, 1);
    console.log(`Engine restored from deleted list: ${newNickname}`);
  }

  // --- 保存と再描画 ---
  AppSettings.save(); // ★ save() は更新された deletedBuiltinEngines も保存する
  AppSettings.loadEngines(); // 再読み込みして最終状態を確認

  renderEngineList();
  initHelpContent();
  updateCurrentEngineDisplay();
  closeEngineModal();
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
