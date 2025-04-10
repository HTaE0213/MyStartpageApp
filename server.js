// server.js
const express = require("express");
const path = require("path");
const cheerio = require("cheerio");
// (後で他の必要なモジュールを追加: fetch, cheerio など)

const app = express();
const port = process.env.PORT || 3000; // Renderが指定するPORT、なければ3000

// --- ミドルウェア設定 ---
// 静的ファイル (HTML/CSS/JS) を public フォルダから配信
app.use(express.static(path.join(__dirname, "public")));
// JSONリクエストボディをパースするためのミドルウェア (今後必要なら)
// app.use(express.json());
// URLエンコードされたリクエストボディをパース (今後必要なら)
// app.use(express.urlencoded({ extended: true }));
// CORS設定 (同一オリジンになるので基本不要だが、念のためコメントアウトで残す)
// const cors = require('cors');
// app.use(cors());

// --- API エンドポイント ---

// サジェストAPI (/suggest)
app.get("/suggest", async (req, res) => {
  console.log("GET /suggest received:", req.query);
  // ★★★ ここに既存のプロキシサーバーの /suggest ロジックを移植 ★★★
  // req.query.engine, req.query.q, req.query.target_url を使う
  // target_url の検証 (SSRF対策) を行う
  const { engine, q: query, target_url: targetUrl } = req.query;

  if (!query || !targetUrl) {
    return res
      .status(400)
      .json({ error: "Missing required parameters (q, target_url)" });
  }

  // --- 1. target_url の検証 (SSRF対策) ---
  const allowedDomains = [
    "suggestqueries.google.com",
    "api.bing.com",
    "duckduckgo.com",
    "ja.wikipedia.org",
    // 他に許可したいサジェストAPIのドメインがあれば追加
  ];
  let parsedTargetUrl;
  try {
    parsedTargetUrl = new URL(decodeURIComponent(targetUrl)); // デコードしてからパース
    if (!allowedDomains.includes(parsedTargetUrl.hostname)) {
      console.warn(
        `[Suggest Proxy] Forbidden domain requested: ${parsedTargetUrl.hostname}`
      );
      throw new Error("Domain not allowed");
    }
    if (
      parsedTargetUrl.protocol !== "https:" &&
      parsedTargetUrl.protocol !== "http:"
    ) {
      throw new Error("Invalid protocol");
    }
  } catch (error) {
    console.error(
      "[Suggest Proxy] Invalid or forbidden target_url:",
      targetUrl,
      error.message
    );
    return res.status(400).json({ error: "Invalid or forbidden target URL" });
  }

  // --- 2. 外部APIへのリクエスト構築 ---
  const finalSuggestUrl = new URL(parsedTargetUrl.toString()); // URLオブジェクトをコピー
  // クエリパラメータを追加 (エンジンによってパラメータ名が違う可能性に注意)
  if (
    parsedTargetUrl.hostname.includes("google.com") ||
    parsedTargetUrl.hostname.includes("wikipedia.org")
  ) {
    finalSuggestUrl.searchParams.set("q", query); // Google, Wikipedia は 'q' か 'search'
    if (parsedTargetUrl.hostname.includes("wikipedia.org"))
      finalSuggestUrl.searchParams.set("search", query);
  } else if (parsedTargetUrl.hostname.includes("bing.com")) {
    finalSuggestUrl.searchParams.set("query", query); // Bing は 'query' かもしれない (要確認)
    finalSuggestUrl.searchParams.set("q", query); // 'q' も試す
  } else if (parsedTargetUrl.hostname.includes("duckduckgo.com")) {
    finalSuggestUrl.searchParams.set("q", query); // DuckDuckGo は 'q'
  } else {
    // 不明なドメインの場合は 'q' を試す
    finalSuggestUrl.searchParams.set("q", query);
  }
  // 必要に応じて他の固定パラメータを追加 (例: client=firefox)
  // finalSuggestUrl.searchParams.set('client', 'firefox');

  console.log(
    `[Suggest Proxy] Forwarding request to: ${finalSuggestUrl.toString()}`
  );

  // --- 3. 外部APIへフェッチ ---
  try {
    // ★ Node.js v18未満の場合は node-fetch を使う
    // const fetch = (await import('node-fetch')).default;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒タイムアウト

    const response = await fetch(finalSuggestUrl.toString(), {
      signal: controller.signal,
      headers: {
        // 必要に応じてヘッダーを設定
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`External API fetch failed! status: ${response.status}`);
    }

    const data = await response.json();
    res.json(data); // 取得したJSONデータをそのまま返す
  } catch (error) {
    clearTimeout(timeoutId); //念のため
    if (error.name === "AbortError") {
      console.error(`[Suggest Proxy] Request to ${finalSuggestUrl} timed out.`);
      res.status(504).json({ error: "Suggestion request timed out" });
    } else {
      console.error(
        `[Suggest Proxy] Error fetching suggestions from ${finalSuggestUrl}:`,
        error.message
      );
      res
        .status(502)
        .json({ error: "Failed to fetch suggestions from external source" }); // 502 Bad Gateway
    }
  }
});

// タイトル取得API (/fetch-title)
app.get("/fetch-title", async (req, res) => {
  console.log("GET /fetch-title received:", req.query);
  const targetUrl = req.query.url; // クエリパラメータからURLを取得

  // --- 1. URLの基本的な検証 ---
  if (!targetUrl) {
    return res.status(400).json({ error: "URL parameter is required" });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(targetUrl);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new Error("Invalid protocol");
    }
    // ★ ここでさらに厳格な検証を追加可能 (例: 内部IPでないか)
  } catch (error) {
    console.error("[FetchTitle] Invalid URL:", targetUrl, error.message);
    return res.status(400).json({ error: "Invalid or unsupported URL format" });
  }

  console.log(`[FetchTitle] Attempting to fetch title from: ${targetUrl}`);

  try {
    // --- 2. 外部サイトへリクエスト ---
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8秒タイムアウト
    // ★ Node.js v18未満の場合は node-fetch を require して使う
    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
        Accept: "text/html",
        "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
      },
      redirect: "follow",
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // --- 3. HTMLを取得しタイトルを抽出 (正規表現) ---
    const html = await response.text();
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch && titleMatch[1] ? titleMatch[1].trim() : null;

    if (title) {
      console.log(`[FetchTitle] Title found: "${title}"`);
      res.json({ title: title }); // ★ res.json で返す
    } else {
      console.log(`[FetchTitle] Title tag not found in HTML from ${targetUrl}`);
      res.json({ title: null }); // ★ res.json で返す
    }
  } catch (error) {
    // clearTimeout(timeoutId); //念のため (エラー発生前にクリアされているはず)
    if (error.name === "AbortError") {
      console.error(`[FetchTitle] Request timed out for ${targetUrl}`);
      res.status(504).json({ error: "Request timed out" }); // ★ res.status().json()
    } else {
      console.error(
        `[FetchTitle] Error fetching URL ${targetUrl}:`,
        error.message
      );
      res.status(500).json({ error: "Failed to fetch or process the URL" }); // ★ res.status().json()
    }
  }
});

// ファビコン取得API (/fetch-favicon)
app.get("/fetch-favicon", async (req, res) => {
  console.log("GET /fetch-favicon received:", req.query);
  const targetUrl = req.query.url;

  // --- 1. URLの基本的な検証 ---
  if (!targetUrl) {
    /* ... (fetchTitleと同様のエラー処理) ... */ return res
      .status(400)
      .json(/*...*/);
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
    /* ... (fetchTitleと同様のエラー処理) ... */ return res
      .status(400)
      .json(/*...*/);
  }
  const pageOrigin = pageUrlObject.origin;

  console.log(`[FetchFavicon] Attempting to fetch favicon for: ${targetUrl}`);

  try {
    // --- 2. ページのHTMLを取得 ---
    const controllerHtml = new AbortController();
    const timeoutHtml = setTimeout(() => controllerHtml.abort(), 8000);
    const htmlResponse = await fetch(targetUrl, {
      /* ... (fetchTitleと同様のヘッダーなど) ... */
    });
    clearTimeout(timeoutHtml);
    if (!htmlResponse.ok) {
      throw new Error(`HTML fetch failed! status: ${htmlResponse.status}`);
    }
    const html = await htmlResponse.text();
    const $ = cheerio.load(html); // ★ cheerioで解析

    // --- 3. ファビコンURLを探す ---
    let faviconUrl = null;
    const selectors = [
      'link[rel="apple-touch-icon"]',
      'link[rel="shortcut icon"]',
      'link[rel="icon"]',
    ];
    for (const selector of selectors) {
      const href = $(selector).last().attr("href");
      if (href) {
        try {
          faviconUrl = new URL(href, pageOrigin).toString();
          console.log(
            `[FetchFavicon] Found icon URL in HTML (${selector}): ${faviconUrl}`
          );
          break;
        } catch (e) {
          console.warn(
            `[FetchFavicon] Invalid href found (${selector}): ${href}`
          );
        }
      }
    }
    if (!faviconUrl) {
      try {
        faviconUrl = new URL("/favicon.ico", pageOrigin).toString();
        console.log(
          `[FetchFavicon] Trying default /favicon.ico: ${faviconUrl}`
        );
      } catch (e) {
        /* ... エラー処理 ... */
      }
    }

    if (!faviconUrl) {
      console.log(
        `[FetchFavicon] Could not find any favicon URL for ${targetUrl}`
      );
      return res.json({ faviconDataUrl: null }); // ★ res.json で返す
    }

    // --- 4. 見つけたURLからファビコン画像を取得 ---
    console.log(`[FetchFavicon] Fetching image from: ${faviconUrl}`);
    const controllerIcon = new AbortController();
    const timeoutIcon = setTimeout(() => controllerIcon.abort(), 5000);
    const iconResponse = await fetch(faviconUrl, {
      signal: controllerIcon.signal,
    });
    clearTimeout(timeoutIcon);

    if (!iconResponse.ok) {
      if (iconResponse.status === 404 && faviconUrl.endsWith("/favicon.ico")) {
        console.log(`[FetchFavicon] Default /favicon.ico returned 404.`);
        return res.json({ faviconDataUrl: null }); // ★ res.json で返す
      }
      throw new Error(
        `Favicon fetch failed! status: ${iconResponse.status} from ${faviconUrl}`
      );
    }

    // --- 5. 画像データをBase64 Data URLに変換 ---
    const imageBuffer = Buffer.from(await iconResponse.arrayBuffer());
    const contentType =
      iconResponse.headers.get("content-type") || "image/x-icon";
    const faviconDataUrl = `data:${contentType};base64,${imageBuffer.toString(
      "base64"
    )}`;

    console.log(
      `[FetchFavicon] Favicon fetched successfully for ${targetUrl} (type: ${contentType})`
    );
    res.json({ faviconDataUrl: faviconDataUrl }); // ★ res.json で返す
  } catch (error) {
    // clearTimeout(timeoutHtml); // 念のため
    // clearTimeout(timeoutIcon); // 念のため
    if (error.name === "AbortError") {
      console.error(
        `[FetchFavicon] Request timed out for ${targetUrl} or its favicon.`
      );
      res.status(504).json({ error: "Request timed out" }); // ★ res.status().json()
    } else {
      console.error(
        `[FetchFavicon] Error fetching favicon for ${targetUrl}:`,
        error.message
      );
      res.status(500).json({ error: "Failed to fetch or process favicon" }); // ★ res.status().json()
    }
  }
});

// --- ルートパスの処理 ---
// public/index.html をデフォルトで提供
// express.staticが '/' へのリクエストで index.html を探してくれるので、
// 通常はこのルートハンドラは不要な場合が多い。
// 明示的に設定する場合:
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

// --- サーバー起動 ---
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  console.log(`Access the start page at: http://localhost:${port}`);
});
