// server.js
const express = require("express");
const path = require("path");
const cheerio = require("cheerio"); // ファビコン取得で使用
// ★ Node.js v18未満で fetch を使う場合は node-fetch が必要
// const fetch = require('node-fetch'); // Node.js v18未満の場合コメント解除

const app = express();
const port = process.env.PORT || 8000; // Render が指定するポート or ローカル用3000

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
      // ★ この関数内の console.warn はデバッグ用なのでコメントアウト推奨
      // console.warn(`[getQueryParamNameForEngine] Unknown engine nickname: ${engineNickname}. Assuming 'q'.`);
      return "q"; // デフォルトで 'q' を返すか、null を返すか選択
  }
}

// --- APIエンドポイント ---

// サジェスト取得API (/suggest)
app.get("/suggest", async (req, res) => {
  // console.log('GET /suggest received:', req.query); // ★ コメントアウト
  const { engine, q: query, target_url: targetUrl } = req.query;

  if (!query || !targetUrl || !engine) {
    // エラーログは残す
    console.error("[Suggest Proxy] Missing required parameters:", {
      engine,
      query_exists: !!query,
      target_url_exists: !!targetUrl,
    });
    return res.status(400).json({ error: "Missing required parameters" });
  }

  // --- URL検証 ---
  let parsedUrl;
  const allowedProtocols = ["http:", "https:"];
  // server.js の /suggest 内
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

  // --- 外部APIへのURL構築 & リクエスト ---
  let finalUrlString;
  try {
    const queryParamName = getQueryParamNameForEngine(engine);
    parsedUrl.searchParams.set(queryParamName || "q", query);
    finalUrlString = parsedUrl.toString();

    // console.log(`[Suggest Proxy] Forwarding request to: ${finalUrlString}`); // ★ コメントアウト

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

    // console.log(`[Suggest Proxy] Response Status: ${response.status} for ${finalUrlString}`); // ★ コメントアウト
    // console.log('[Suggest Proxy] Response Headers:', JSON.stringify(Object.fromEntries(response.headers.entries()))); // ヘッダーログも削除推奨
    // ... レスポンスボディのログも削除 ...

    if (!response.ok) {
      // console.error(`[Suggest Proxy] Response not OK (${response.status}) for ${finalUrlString}`); // ★ finalUrlString を削除
      console.error(
        `[Suggest Proxy] Response not OK (${response.status}) from external API`
      );
      // ... エラーレスポンス処理 ...
      return;
    }

    const contentType = response.headers.get("content-type");
    // console.log(`[Suggest Proxy] Processing with Content-Type: ${contentType}`); // コメントアウト

    if (
      contentType &&
      (contentType.includes("application/json") ||
        contentType.includes("javascript") || // JSONP用
        contentType.includes("application/x-suggestions+json"))
    ) {
      // console.log('[Suggest Proxy] Trying to parse as JSON...'); // コメントアウト
      try {
        const data = await response.json();
        // console.log(`[Suggest Proxy] Parsed JSON response successfully.`); // コメントアウト
        res.json(data);
      } catch (parseError) {
        console.error(
          `[Suggest Proxy] Failed to parse JSON response: ${parseError}`
        );
        // ... エラーレスポンス処理 ...
      }
    } else if (contentType && contentType.includes("text/plain")) {
      // console.log('[Suggest Proxy] Trying to parse as text/plain...'); // コメントアウト
      // ... text/plain 処理 ...
    } else {
      // console.log('[Suggest Proxy] Entering unexpected content-type block...'); // コメントアウト
      // console.warn(`[Suggest Proxy] Handling unexpected content-type: ${contentType}`); // コメントアウト
      res.status(500).json({
        error: "Received unexpected response format from suggestion source",
      });
    }
  } catch (error) {
    const baseUrlUsed = targetUrl;
    const attemptedUrl = finalUrlString || baseUrlUsed; // これはエラー分析に役立つ可能性あり

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
});

// タイトル取得API (/fetch-title)
app.get("/fetch-title", async (req, res) => {
  // console.log('GET /fetch-title received:', req.query); // ★ コメントアウト
  const targetUrl = req.query.url;

  if (!targetUrl) {
    /* ... */
  }
  try {
    parsedUrl = new URL(targetUrl);
    // ... プロトコル検証 ...
  } catch (error) {
    // console.error('[FetchTitle] Invalid URL:', targetUrl, error.message); // ★ targetUrl 削除
    console.error("[FetchTitle] Invalid URL:", error.message);
    return res.status(400).json({ error: "Invalid or unsupported URL format" });
  }

  // console.log(`[FetchTitle] Attempting to fetch title from: ${targetUrl}`); // ★ コメントアウト
  try {
    // ... fetch 処理 ...
    if (!response.ok) {
      throw new Error(/* ... */);
    }
    const html = await response.text();
    // ... cheerio でタイトル抽出 ...
    if (title) {
      // console.log(`[FetchTitle] Title found: "${title}"`); // ★ タイトルログ削除
      res.json({ title: title });
    } else {
      // console.log(`[FetchTitle] Title tag not found in HTML from ${targetUrl}`); // ★ コメントアウト
      res.json({ title: null });
    }
  } catch (error) {
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

  if (!targetUrl) {
    /* ... */
  }
  try {
    pageUrlObject = new URL(targetUrl);
    // ... プロトコル検証 ...
  } catch (error) {
    // console.error('[FetchFavicon] Invalid URL:', targetUrl, error.message); // ★ URL削除
    console.error("[FetchFavicon] Invalid URL:", error.message);
    return res.status(400).json({ error: "Invalid or unsupported URL format" });
  }
  const pageOrigin = pageUrlObject.origin;

  // console.log(`[FetchFavicon] Attempting to fetch favicon for: ${targetUrl}`); // ★ コメントアウト
  try {
    // ... HTML取得 ...
    // ... ファビコンURL探索ログは削除推奨 ...
    // console.log(`[FetchFavicon] Found potential icon ...`);
    // console.log(`[FetchFavicon] Trying default /favicon.ico ...`);

    if (!faviconUrl) {
      // console.log(`[FetchFavicon] Could not find any favicon URL for ${targetUrl}`); // ★ コメントアウト
      return res.json({ faviconDataUrl: null });
    }

    // console.log(`[FetchFavicon] Fetching image from: ${faviconUrl}`); // ★ コメントアウト

    // ... ファビコン画像取得 ...
    if (!iconResponse.ok) {
      if (iconResponse.status === 404 && faviconUrl.endsWith("/favicon.ico")) {
        // console.log(`[FetchFavicon] Default /favicon.ico returned 404.`); // コメントアウト
        return res.json({ faviconDataUrl: null });
      }
      throw new Error(/* ... */);
    }

    // ... Base64変換 ...
    // console.log(`[FetchFavicon] Favicon fetched successfully for ${targetUrl} (type: ${contentType})`); // ★ コメントアウト
    res.json({ faviconDataUrl: faviconDataUrl });
  } catch (error) {
    if (error.name === "AbortError") {
      // console.error(`[FetchFavicon] Request timed out for ${targetUrl} or its favicon.`); // ★ URL削除
      console.error(`[FetchFavicon] Request timed out.`);
      res
        .status(504)
        .json({ error: "Request timed out while fetching favicon" });
    } else {
      // console.error(`[FetchFavicon] Error fetching favicon for ${targetUrl}:`, error.message); // ★ URL削除
      console.error(`[FetchFavicon] Error fetching favicon:`, error.message);
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
  // console.log(`Access the start page at: http://localhost:${port}`);
});
