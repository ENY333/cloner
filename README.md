# ToolVerse

A Vercel-ready all-in-one workspace for AI, File, Google, Developer and Engineering tools.

## Structure

- `index.html` — application shell
- `styles.css` — responsive dark UI
- `app.js` — routing, catalog, tool workspaces
- `api/gas.js` — Vercel proxy for Google Apps Script
- `vercel.json` — Vercel function config

## Current built-in tool workspaces

Working client-side modules:
- JSON Formatter / Validator
- Base64 Encoder / Decoder
- API Tester
- Code Workspace
- Image Toolbox (resize → PNG)
- Text Converter

Integrated API module:
- Google Drive Cloner → `/api/gas` → GAS Web App

UI-ready modules:
- AI Workspace
- Prompt Lab
- Text Summarizer
- AI Translate
- PDF Toolbox
- OCR Studio
- Universal Converter
- Drive Manager
- Sheets Tools
- CAD
- CNC
- MATLAB
- PLC

## Vercel setup

Set an Environment Variable:

`GAS_API_URL=https://script.google.com/macros/s/XXXXXXXX/exec`

Then deploy.

No build step is required for the static frontend.


## Lắp lên Vercel nhanh nhất

### Cách A — GitHub (khuyên dùng)

1. Tạo repository mới trên GitHub, ví dụ `toolverse`.
2. Upload toàn bộ file/thư mục trong ZIP này lên repository.
3. Vào Vercel → Add New → Project → Import GitHub Repository.
4. Chọn repo `toolverse`.
5. Nếu Vercel hỏi Framework, chọn `Other` hoặc để auto-detect.
6. Build Command: để trống.
7. Output Directory: để mặc định / trống.
8. Root Directory: `.`.
9. Deploy.

### Cách B — Vercel CLI

Trong thư mục project:

```bash
npm install -g vercel
vercel login
vercel
```

Sau khi kiểm tra local/deployment preview, dùng:

```bash
vercel --prod
```

### Bắt buộc để Drive Cloner hoạt động

Trong Vercel:

`Project → Settings → Environment Variables`

Thêm:

```text
GAS_API_URL = https://script.google.com/macros/s/XXXXXXXXXXXX/exec
```

Chọn Production (và Preview/Development nếu cần).

Sau khi thêm hoặc đổi Environment Variable, hãy redeploy để deployment nhận giá trị mới.

### Google Apps Script

Mở `Code.gs` → deploy Web App → lấy URL `/exec` → đặt vào `GAS_API_URL`.

### Kiểm tra

Sau khi deploy:

```text
https://YOUR-PROJECT.vercel.app/
```

Vào:

`Google Tools → Drive Cloner → Check API`

Nếu hiện:

```text
Drive Cloner Pro API is online
```

thì Vercel → GAS đã nối được.


## Vercel deployment fix

`vercel.json` intentionally does not override the `functions` glob.
Vercel auto-detects `api/gas.js` as a Node.js Function when it is present
at the project root under `/api`. This avoids the
`The pattern "api/gas.js" ... doesn't match any Serverless Functions`
error caused by an unmatched `functions` configuration.

Required project layout:

```text
index.html
styles.css
app.js
vercel.json
api/
  gas.js
```
