# 実装計画: スピードダイアルのラベル表示設定

## 目的

スピードダイアルのアイコン下のラベル（サイト名）の表示・非表示を切り替える設定を追加する。

## ユーザーレビュー

- 特になし

## 変更内容

### `public/index.html`

#### [MODIFY] [index.html](file:///d:/%E3%83%89%E3%82%AD%E3%83%A5%E3%83%A1%E3%83%B3%E3%83%88/code/MyStartPage/MyStartpageApp/public/index.html)

- 設定パネルに「ラベルを表示」チェックボックスを追加。

### `public/style.css`

#### [MODIFY] [style.css](file:///d:/%E3%83%89%E3%82%AD%E3%83%A5%E3%83%A1%E3%83%B3%E3%83%88/code/MyStartPage/MyStartpageApp/public/style.css)

- `.speed-dial-grid.hide-labels` クラスによるスタイル定義を追加。
- ラベル非表示時のアイコンサイズ調整 (48px) とマージン調整。

### `public/script.js`

#### [MODIFY] [script.js](file:///d:/%E3%83%89%E3%82%AD%E3%83%A5%E3%83%A1%E3%83%B3%E3%83%88/code/MyStartPage/MyStartpageApp/public/script.js)

- `AppSettings` に `SHOW_LABELS` キーを追加。
- `init()` 関数内で設定の読み込みと適用ロジックを追加 (イベントリスナー設定前)。
- `updateSpeedDialLabels(show)` 関数を追加。

## 検証計画

### 手動検証

- 設定パネルを開き、チェックボックスの ON/OFF でラベルが表示/非表示になることを確認する。
- ページリロード後も設定が維持されることを確認する。
