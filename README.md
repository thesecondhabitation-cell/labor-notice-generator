# 労働条件通知書ジェネレーター

労働基準法第15条に基づく労働条件の明示用 Web ツールです。ブラウザ上で入力し、印刷・PDF 保存・Word 書き出しができます。入力内容はブラウザに自動保存されます。

## 公開 URL

GitHub Pages を有効化すると、次の URL で公開されます。

**https://thesecondhabitation-cell.github.io/labor-notice-generator/**

（初回は GitHub の設定反映後、数分かかることがあります）

## 初回公開の手順（GitHub Pages）

1. GitHub リポジトリを開く  
   https://github.com/thesecondhabitation-cell/labor-notice-generator
2. **Settings** → **Pages**
3. **Build and deployment** → Source: **Deploy from a branch**
4. Branch: **main** / Folder: **/ (root)** → **Save**

## 今後の更新の仕方

修正はいつでも可能です。基本的な流れは次のとおりです。

1. ローカルで `index.html` / `style.css` / `script.js` などを編集
2. 動作確認（ローカルサーバー例）  
   ```bash
   python3 -m http.server 8080
   ```  
   → http://127.0.0.1:8080/index.html
3. コミットして `main` に push  
   ```bash
   git add .
   git commit -m "変更内容の説明"
   git push origin main
   ```
4. 数分以内に公開 URL に反映されます（GitHub Pages の再デプロイ）

## ファイル構成

| ファイル | 内容 |
|---------|------|
| `index.html` | 画面・通知書プレビューの HTML |
| `style.css` | 画面 UI と印刷用スタイル |
| `script.js` | 入力連動・下書き保存・計算ロジック |
| `word-export.js` | Word 書き出し |

## 注意

- 本ツールは作成支援用です。実際の運用前に、就業規則・個別事情に合わせて内容を確認してください。
- 下書きデータは各利用者のブラウザ内（localStorage）に保存され、サーバーには送信されません。
