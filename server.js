// server.js
const express = require("express");
const path = require("path");
const cheerio = require("cheerio"); // ファビコン取得で使用
// ★ Node.js v18未満で fetch を使う場合は node-fetch が必要
// const fetch = require('node-fetch'); // Node.js v18未満の場合コメント解除
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 8000; // Render が指定するポート or ローカル用8000

// --- ★ 追加: MongoDB接続設定 ---
// 環境変数 MONGODB_URI が設定されていないとエラーになるので注意
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("Connected to MongoDB Atlas"))
    .catch(err => console.error("MongoDB Connection Error:", err));
} else {
  console.warn("MONGODB_URI is not set. Cloud sync will not work.");
}

// --- ★ 追加: データモデル定義 ---
const SettingSchema = new mongoose.Schema({
  sync_key: { type: String, required: true, unique: true }, // 合言葉
  data: { type: mongoose.Schema.Types.Mixed, required: true }, // 設定データ
  updated_at: { type: Date, default: Date.now }
});
const Setting = mongoose.model('Setting', SettingSchema);

// --- ミドルウェア ---
app.use(express.json()); // JSONボディパーサー (APIで必要なら)

// --- 静的ファイルの配信 ---
// publicフォルダの中身をルートURL ('/') からアクセスできるようにする
app.use(express.static(path.join(__dirname, "public")));

/**
 * エンジンニックネームに対応するサジェストAPIのクエリパラメータ名を取得する
 * @param {string} engineNickname - エンジンのニックネーム (例: 'g', 'w', 'b')
 * @returns {string | null} クエリパラメータ名 (例: 'q', 'search'), 不明な場合は null
 */
function getQueryParamNameForEngine(engineNickname) {
  switch (engineNickname) {
    case "g":
    case "gs":
    case "y": // YouTube (Google API)
    case "a": // Amazon
    case "d": // DuckDuckGo
      return "q";
    case "b": // Bing
      return "query";
    case "w": // Wikipedia
      return "search";
    // 他のエンジンを追加する場合
    // case 'some_other_engine':
    //     return 'term';
    default:
      // 不明なエンジンや、パラメータ名が 'q' で良い場合
      // console.warn(`[getQueryParamNameForEngine] Unknown engine nickname: ${engineNickname}. Assuming 'q'.`); // ★ コメントアウト
      return "q"; // デフォルトで 'q' を返すか、null を返すか選択
  }
}

// --- APIエンドポイント ---

// ★ 追加: 設定の保存 (Upload)
app.post('/api/sync', async (req, res) => {
  const { key, settings } = req.body;
  if (!key || !settings) {
    return res.status(400).json({ error: "Key and settings are required" });
  }
  try {
    // 合言葉(key)で検索し、あれば更新、なければ作成 (upsert)
    await Setting.findOneAndUpdate(
      { sync_key: key },
      { data: settings, updated_at: new Date() },
      { upsert: true, new: true }
    );
    res.json({ success: true, message: "Saved to MongoDB" });
  } catch (err) {
    console.error("Save Error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ★ 追加: 設定の読み込み (Download)
app.get('/api/sync', async (req, res) => {
  const key = req.query.key;
  if (!key) {
    return res.status(400).json({ error: "Key is required" });
  }
  try {
    const doc = await Setting.findOne({ sync_key: key });
    if (doc) {
      res.json({ success: true, settings: doc.data });
    } else {
      res.status(404).json({ error: "Settings not found" });
    }
  } catch (err) {
    console.error("Load Error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// サジェスト取得API (/suggest)
app.get("/suggest", async (req, res) => {
  // console.log('GET /suggest received:', req.query); // ★ コメントアウト
  const { engine, q: query, target_url: targetUrl } = req.query;

  // --- 1. パラメータ検証 ---
  if (!query || !targetUrl || !engine) {
    // エラーログは残すが、具体的なパラメータ値は出力しない
    console.error("[Suggest Proxy] Missing required parameters:", {
      engine_exists: !!engine,
      query_exists: !!query,
      target_url_exists: !!targetUrl,
    });
    return res
      .status(400)
      .json({ error: "Missing required parameters: engine, q, target_url" });
  }

  // --- 2. target_url (ベースURL) の検証 ---
  let parsedUrl;
  const allowedProtocols = ["http:", "https:"];
  const allowedDomains = [
    // 主要検索エンジン
    "suggestqueries.google.com",
    "www.google.com",
    "api.bing.com",
    "duckduckgo.com",
    "api.search.yahoo.com", // Yahoo! JAPAN
    "sug.search.yahoo.net", // Yahoo! USA
    "suggestion.baidu.com", // Baidu
    "suggest.yandex.com", // Yandex
    "search.brave.com", // Brave Search

    // 主要サイト
    "ja.wikipedia.org",
    "en.wikipedia.org", // Wikipedia (EN) も追加
    "completion.amazon.co.jp", // Amazon (JP)
    "completion.amazon.com", // Amazon (US)

    // 今後使う可能性が比較的高そうなもの
    "github.com",
    "stackoverflow.com",

    // 必要に応じて他のドメインを追加
  ];

  try {
    parsedUrl = new URL(targetUrl);
    if (!allowedProtocols.includes(parsedUrl.protocol)) {
      throw new Error("Invalid protocol");
    }
    if (
      !allowedDomains.some(
        (domain) =>
          parsedUrl.hostname === domain ||
          parsedUrl.hostname.endsWith("." + domain)
      )
    ) {
      // console.warn(`[Suggest Proxy] Forbidden domain requested: ${parsedUrl.hostname}`); // ★ コメントアウト (ドメイン名はログに残さない)
      throw new Error("Forbidden domain");
    }
  } catch (error) {
    // console.error('[Suggest Proxy] Invalid or forbidden target_url:', targetUrl, error.message); // ★ targetUrl をログから削除
    console.error(
      "[Suggest Proxy] Invalid or forbidden target_url:",
      error.message
    );
    return res.status(400).json({ error: "Invalid or forbidden target URL" });
  }

  // --- 3. 外部APIへの最終リクエストURL構築 ---
  let finalUrlString;
  try {
    // ★★★ エンジンに応じて適切なクエリパラメータ名を設定 ★★★
    const queryParamName = getQueryParamNameForEngine(engine); // ヘルパー関数を想定
    // if (!queryParamName) { // queryParamName が null でも 'q' を使うので、この警告は不要かも
    //   console.warn(`[Suggest Proxy] Query parameter name not defined for engine: ${engine}. Defaulting to 'q'.`);
    // }
    parsedUrl.searchParams.set(queryParamName || "q", query); // 取得した名前 or 'q' を使う
    finalUrlString = parsedUrl.toString();

    // console.log(`[Suggest Proxy] Forwarding request to: ${finalUrlString}`); // ★ コメントアウト

    // --- 4. 外部APIへリクエスト転送 ---
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const response = await fetch(finalUrlString, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; StartpageProxy/1.0)",
        Accept: "application/json, application/x-suggestions+json, */*",
      },
    });
    clearTimeout(timeoutId);

    // ★★★ デバッグログ強化: ステータスとヘッダー全体を出力 ★★★
    // console.log(`[Suggest Proxy] Response Status: ${response.status} for ${finalUrlString}`); // ★ コメントアウト
    // console.log('[Suggest Proxy] Response Headers:', JSON.stringify(Object.fromEntries(response.headers.entries()))); // ★ コメントアウト (ヘッダーも情報を含む可能性)

    // レスポンスボディを読む前にクローンを作成 (複数回読むため)
    // const responseCloneForTextLog = response.clone(); // ボディログ削除のため不要
    const responseCloneForJsonParse = response.clone(); // JSONパース失敗時用

    // ★★★ デバッグログ強化: ボディ内容をテキストで必ずログ出力 ★★★
    // responseCloneForTextLog.text().then(textBody => console.log('[Suggest Proxy] Response Body (text, first 500 chars):', textBody.substring(0, 500))).catch(err => console.error('[Suggest Proxy] Error reading response body as text:', err)); // ★ コメントアウト

    // --- 5. レスポンスをクライアントに返す ---
    if (!response.ok) {
      // console.error(`[Suggest Proxy] Response not OK (${response.status}) for ${finalUrlString}`); // ★ finalUrlString を削除
      console.error(
        `[Suggest Proxy] Response not OK (${response.status}) from external API`
      );
      // エラーレスポンスの内容を返す試み
      try {
        const errorData = await response.json(); // エラーもJSON形式かもしれない
        res.status(response.status).json(errorData);
      } catch {
        // JSONでなくても、ステータスコードとテキストを返す
        res
          .status(response.status)
          .json({ error: `External API error: ${response.statusText}` });
      }
      return; // ここで処理終了
    }

    // 正常なレスポンスの場合
    const contentType = response.headers.get("content-type");
    // console.log(`[Suggest Proxy] Processing with Content-Type: ${contentType}`); // ★ コメントアウト

    if (
      contentType &&
      (contentType.includes("application/json") ||
        contentType.includes("javascript") || // JSONP用
        contentType.includes("application/x-suggestions+json")) // Wikipedia用
    ) {
      // console.log('[Suggest Proxy] Trying to parse as JSON...'); // ★ コメントアウト
      try {
        // ★ クローンではなく元の response を使う (一度しか読めないため)
        const data = await response.json();
        // console.log(`[Suggest Proxy] Parsed JSON response successfully.`); // ★ コメントアウト
        res.json(data); // クライアントにJSONデータを返す
      } catch (parseError) {
        console.error(
          `[Suggest Proxy] Failed to parse JSON response: ${parseError}`
        );
        // JSONパース失敗時のボディ内容のログも削除
        // responseCloneForJsonParse.text().then(textBody => console.error('[Suggest Proxy] Response body on JSON parse error:', textBody.substring(0, 500))).catch(err => console.error('[Suggest Proxy] Error reading response body on JSON parse error:', err));
        res
          .status(500)
          .json({ error: "Failed to parse suggestion data from source" });
      }
    } else if (contentType && contentType.includes("text/plain")) {
      // console.log('[Suggest Proxy] Trying to parse as text/plain...'); // ★ コメントアウト
      try {
        const textData = await response.text(); // 元の response を使う
        const jsonData = JSON.parse(textData);
        // console.log(`[Suggest Proxy] Parsed text/plain response as JSON.`); // ★ コメントアウト
        res.json(jsonData);
      } catch (parseError) {
        // console.warn(`[Suggest Proxy] Failed to parse text/plain response as JSON from ${finalUrlString}`); // ★ コメントアウト
        console.warn(
          `[Suggest Proxy] Failed to parse text/plain response as JSON`
        ); // URL削除
        res.status(500).json({
          error:
            "Received non-JSON or unparseable response from suggestion source",
        });
      }
    } else {
      // console.log('[Suggest Proxy] Entering unexpected content-type block...'); // ★ コメントアウト
      // console.warn(`[Suggest Proxy] Handling unexpected content-type: ${contentType}`); // ★ コメントアウト
      console.warn(`[Suggest Proxy] Handling unexpected content-type`); // Content-Type自体はログに残さない
      res.status(500).json({
        error: "Received unexpected response format from suggestion source",
      });
    }
  } catch (error) {
    // ★ エラーハンドリング: tryブロック外でも参照可能な変数を使用
    // const baseUrlUsed = targetUrl; // 元のベースURL
    // finalUrlString は try ブロック内で定義されているため、エラー時は未定義の可能性がある
    // そのため、エラー発生箇所に応じて参照可能な変数を使う
    // const attemptedUrl = finalUrlString || baseUrlUsed; // finalUrlStringが定義されていればそれ、なければ元のベースURL

    if (error.name === "AbortError") {
      // console.error(`[Suggest Proxy] External API request timed out for ${attemptedUrl}`); // ★ URL削除
      console.error(`[Suggest Proxy] External API request timed out.`);
      res.status(504).json({ error: "Suggestion source request timed out" });
    } else {
      // console.error(`[Suggest Proxy] Error during external API request for ${attemptedUrl}:`, error); // ★ URL削除
      console.error(
        `[Suggest Proxy] Error during external API request:`,
        error
      ); // エラーオブジェクトは残す
      res
        .status(502)
        .json({ error: "Bad Gateway - Error connecting to suggestion source" });
    }
  }
}); // app.get('/suggest', ...) の終わり

// タイトル取得API (/fetch-title)
app.get("/fetch-title", async (req, res) => {
  // console.log('GET /fetch-title received:', req.query); // ★ コメントアウト
  const targetUrl = req.query.url;

  // --- 1. URLの基本的な検証 ---
  if (!targetUrl) {
    console.error("[FetchTitle] URL parameter is required"); // エラー自体はログに残す
    return res.status(400).json({ error: "URL parameter is required" });
  }
  let parsedUrl;
  try {
    parsedUrl = new URL(targetUrl);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new Error("Invalid protocol");
    }
    // ★ ここでさらに厳格な検証を追加可能 (例: 内部IPでないか、許可ドメインリストなど)
  } catch (error) {
    // console.error('[FetchTitle] Invalid URL:', targetUrl, error.message); // ★ targetUrl 削除
    console.error("[FetchTitle] Invalid URL:", error.message);
    return res.status(400).json({ error: "Invalid or unsupported URL format" });
  }

  // console.log(`[FetchTitle] Attempting to fetch title from: ${targetUrl}`); // ★ コメントアウト
  try {
    // --- 2. 外部サイトへリクエスト ---
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8秒タイムアウト
    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; StartpageTitleFetcher/1.0)",
        Accept: "text/html",
        "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
      },
      redirect: "follow", // リダイレクトを許可
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      // 4xx, 5xx エラーの場合
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // --- 3. HTMLを取得しタイトルを抽出 ---
    const html = await response.text();
    // cheerio を使ってより確実に抽出
    const $ = cheerio.load(html);
    let title = $("title").first().text().trim();

    // もし cheerio で取れなければ正規表現を試す (代替)
    if (!title) {
      const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      title = titleMatch && titleMatch[1] ? titleMatch[1].trim() : null;
    }

    if (title) {
      // console.log(`[FetchTitle] Title found: "${title}"`); // ★ タイトルログ削除
      res.json({ title: title });
    } else {
      // console.log(`[FetchTitle] Title tag not found in HTML from ${targetUrl}`); // ★ コメントアウト
      res.json({ title: null }); // タイトルが見つからなかった場合
    }
  } catch (error) {
    // clearTimeout(timeoutId); // 念のため
    if (error.name === "AbortError") {
      // console.error(`[FetchTitle] Request timed out for ${targetUrl}`); // ★ URL削除
      console.error(`[FetchTitle] Request timed out.`);
      res.status(504).json({ error: "Request timed out while fetching title" });
    } else {
      // console.error(`[FetchTitle] Error fetching URL ${targetUrl}:`, error.message); // ★ URL削除
      console.error(`[FetchTitle] Error fetching URL:`, error.message);
      res
        .status(500)
        .json({ error: "Failed to fetch or process the URL for title" });
    }
  }
});

// ファビコン取得API (/fetch-favicon)
app.get("/fetch-favicon", async (req, res) => {
  // console.log('GET /fetch-favicon received:', req.query); // ★ コメントアウト
  const targetUrl = req.query.url;

  // --- 1. URLの基本的な検証 ---
  if (!targetUrl) {
    console.error("[FetchFavicon] URL parameter is required"); // エラー自体はログに残す
    return res.status(400).json({ error: "URL parameter is required" });
  }
  let pageUrlObject;
  try {
    pageUrlObject = new URL(targetUrl);
    if (
      pageUrlObject.protocol !== "http:" &&
      pageUrlObject.protocol !== "https:"
    ) {
      throw new Error("Invalid protocol");
    }
    // ★ ここでさらに厳格なURL検証を追加可能
  } catch (error) {
    // console.error('[FetchFavicon] Invalid URL:', targetUrl, error.message); // ★ URL削除
    console.error("[FetchFavicon] Invalid URL:", error.message);
    return res.status(400).json({ error: "Invalid or unsupported URL format" });
  }
  const pageOrigin = pageUrlObject.origin;

  // console.log(`[FetchFavicon] Attempting to fetch favicon for: ${targetUrl}`); // ★ コメントアウト
  try {
    // --- 2. ページのHTMLを取得 ---
    const controllerHtml = new AbortController();
    const timeoutHtml = setTimeout(() => controllerHtml.abort(), 8000);
    const htmlResponse = await fetch(targetUrl, {
      signal: controllerHtml.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; StartpageFaviconFetcher/1.0)",
        Accept: "text/html",
      },
      redirect: "follow",
    });
    clearTimeout(timeoutHtml);
    if (!htmlResponse.ok) {
      throw new Error(`HTML fetch failed! status: ${htmlResponse.status}`);
    }
    const html = await htmlResponse.text();
    const $ = cheerio.load(html);

    // --- 3. ファビコンURLを探す (優先度順) ---
    let faviconUrl = null;
    const selectors = [
      'link[rel="apple-touch-icon"]', // iOS用 (高解像度の場合が多い)
      'link[rel="icon"][sizes]', // サイズ指定ありのicon
      'link[rel="shortcut icon"]', // 古い形式
      'link[rel="icon"]', // 一般的なicon
    ];
    // サイズが大きいものを優先するロジック (より高度)
    let bestSize = 0;
    selectors.forEach((selector) => {
      $(selector).each((i, el) => {
        const href = $(el).attr("href");
        if (!href) return;
        try {
          const currentUrl = new URL(href, pageOrigin).toString();
          const sizes = $(el).attr("sizes"); // sizes属性を取得
          let currentSize = 0;
          if (sizes) {
            const sizeMatch = sizes.match(/(\d+)[xX]\d+/); // 最初の数字を取得
            if (sizeMatch) currentSize = parseInt(sizeMatch[1], 10);
          }
          // より大きいサイズのアイコンが見つかったら更新
          if (currentSize > bestSize || !faviconUrl) {
            faviconUrl = currentUrl;
            bestSize = currentSize;
            // console.log(`[FetchFavicon] Found potential icon (${selector}, size: ${ sizes || "N/A" }): ${faviconUrl}`); // ★ コメントアウト
          }
        } catch (e) {
          // console.warn(`[FetchFavicon] Invalid href found (${selector}): ${href}`); // ★ コメントアウト
        }
      });
    });

    // HTML内で見つからなければ、ルートの favicon.ico を試す
    if (!faviconUrl) {
      try {
        faviconUrl = new URL("/favicon.ico", pageOrigin).toString();
        // console.log(`[FetchFavicon] Trying default /favicon.ico: ${faviconUrl}`); // ★ コメントアウト
      } catch (e) {
        /* エラーは無視 */
      }
    }

    if (!faviconUrl) {
      // console.log(`[FetchFavicon] Could not find any favicon URL for ${targetUrl}`); // ★ コメントアウト
      return res.json({ faviconDataUrl: null });
    }

    // --- 4. 見つけたURLからファビコン画像を取得 ---
    // console.log(`[FetchFavicon] Fetching image from: ${faviconUrl}`); // ★ コメントアウト
    const controllerIcon = new AbortController();
    const timeoutIcon = setTimeout(() => controllerIcon.abort(), 5000); // アイコン取得タイムアウト
    const iconResponse = await fetch(faviconUrl, {
      signal: controllerIcon.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; StartpageFaviconFetcher/1.0)",
      },
    });
    clearTimeout(timeoutIcon);

    if (!iconResponse.ok) {
      // 特に /favicon.ico が 404 の場合はよくあること
      if (iconResponse.status === 404 && faviconUrl.endsWith("/favicon.ico")) {
        // console.log(`[FetchFavicon] Default /favicon.ico returned 404.`); // ★ コメントアウト
        return res.json({ faviconDataUrl: null });
      }
      throw new Error(
        `Favicon fetch failed! status: ${iconResponse.status}` // URLはエラーメッセージから削除
      );
    }

    // --- 5. 画像データをBase64 Data URLに変換 ---
    const imageBuffer = Buffer.from(await iconResponse.arrayBuffer());
    // Content-Type を取得、なければ推測 (より安全な方法を検討)
    const contentType =
      iconResponse.headers.get("content-type") || "image/x-icon";
    // ★ セキュリティ: SVGの場合はサニタイズが必要かもしれない
    if (contentType.includes("svg")) {
      // サニタイズ処理をここに実装 (例: DOMPurifyなど)
      // console.warn("[FetchFavicon] SVG favicon found, sanitization recommended but not implemented."); // ★ コメントアウト
    }
    const faviconDataUrl = `data:${contentType};base64,${imageBuffer.toString(
      "base64"
    )}`;

    // console.log(`[FetchFavicon] Favicon fetched successfully for ${targetUrl} (type: ${contentType})`); // ★ コメントアウト
    res.json({ faviconDataUrl: faviconDataUrl });
  } catch (error) {
    // clearTimeout(timeoutHtml); // 念のため
    // clearTimeout(timeoutIcon); // 念のため
    if (error.name === "AbortError") {
      // console.error(`[FetchFavicon] Request timed out for ${targetUrl} or its favicon.`); // ★ URL削除
      console.error(`[FetchFavicon] Request timed out.`);
      res
        .status(504)
        .json({ error: "Request timed out while fetching favicon" });
    } else {
      // console.error(`[FetchFavicon] Error fetching favicon for ${targetUrl}:`, error.message); // ★ URL削除
      console.error(`[FetchFavicon] Error fetching favicon:`, error.message);
      // ページ自体は存在してもファビコン取得でエラーになることは多いので500よりは specific なエラーが良いかも
      res.status(502).json({ error: "Failed to fetch or process favicon" });
    }
  }
});

// --- ルートURL ('/') へのアクセス ---
// 静的ファイル配信が index.html を自動的に返すので、通常は不要。
// SPA(Single Page Application)的なルーティングが必要な場合はここに記述。
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

// --- サーバー起動 ---
app.listen(port, () => {
  // サーバーが起動したこととポート番号はログに残してもプライバシーリスクは低い
  console.log(`Server listening on port ${port}`);
  // ローカルアクセスURLのログも残して良いでしょう
  console.log(`Access the start page at: http://localhost:${port}`);
});
