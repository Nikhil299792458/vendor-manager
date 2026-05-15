# Vendor Manager Web

A dependency-free, local-first website for mechanical procurement vendor intelligence. It starts as a browser database, can be backed up as JSON/CSV/Markdown, and can optionally save/share the database through Google Drive.

The app is designed for vendors, suppliers, fabricators, manufacturers, service providers, RFQs, quotations, catalogues, documents, reminders, follow-ups, and scorecards. No aggressive scraping is included.

## File Tree

```text
VendorManagerWeb/
|-- public/
|   |-- index.html
|   |-- styles.css
|   |-- app.js
|   |-- manifest.webmanifest
|   |-- service-worker.js
|   |-- icon.svg
|-- dev-server.js
|-- package.json
|-- netlify.toml
|-- vercel.json
|-- firebase.json
|-- .firebaserc
|-- README.md
```

## Run Locally

Install Node.js 18 or newer, then:

```bash
cd VendorManagerWeb
npm start
```

Open:

```text
http://127.0.0.1:5000
```

Check syntax:

```bash
npm run check
```

## What Is Implemented

- Vendor CRUD with richer fields: tags, brands, GST, lifecycle status, technical capabilities, MOQ, lead time, payment terms.
- Vendor detail page with contact actions, linked catalogues, documents, quotations, interactions, reminders, and latest score.
- Fuzzy-ish search across company, products, tags, city, phone, email, GST, and technical notes.
- Duplicate warning using phone, email, GST, website domain, and similar company name.
- RFQ manager with invited vendors, due date, status pipeline, and quote linking.
- Quotation comparison with landed cost: base price, GST, shipping, and delay penalty.
- Catalogue manager with URL status checks and optional Drive file upload.
- Document library for quotations, proforma invoices, purchase orders, GST certificates, calibration certificates, warranty files, and other evidence.
- Follow-up interactions plus separate reminder tracker.
- Vendor scoring with configurable weights.
- Dashboard analytics and procurement signals.
- Analytics page: vendors by category/city, quotations per month, lead time by category, score comparison, pending work.
- Audit history for important changes.
- JSON backup/restore, vendor CSV import/export, quotation/RFQ/reminder CSV export, category-wise Markdown export.
- Optional Google Drive database save/load/share.
- PWA/offline shell files for installable static hosting.

## Data Storage

- Primary storage: browser `localStorage`.
- Backup: export JSON regularly.
- Optional shared file: one JSON database in Google Drive using your OAuth Client ID.
- Attachments: if Google Drive is connected, selected catalogue/document/quotation files are uploaded to Drive and the Drive link is stored. Without Drive, the browser can only remember the selected file name.

## CSV Import

Use **Import / Export > Vendor CSV**. Common headers are normalized automatically, including:

```csv
companyName,vendorType,category,tags,productsServices,city,area,phone,email,website,gstNumber,contactPerson,typicalLeadTimeDays,lifecycleStatus,verificationStatus
```

Export a vendor CSV first if you want a clean template.

## Google Drive Setup

1. Open Google Cloud Console.
2. Enable the Google Drive API.
3. Configure the OAuth consent screen.
4. Create an OAuth Client ID with application type **Web application**.
5. Add authorized JavaScript origins:
   - `http://127.0.0.1:5000`
   - `http://localhost:5000`
   - your hosted website origin, for example `https://username.github.io`
6. Paste the client ID in **Google Drive > OAuth Client ID**.
7. Click **Connect Google Drive**.
8. Create or load a database file.

The app requests only:

```text
https://www.googleapis.com/auth/drive.file
```

## Sharing With Friends

1. Create a Drive database file from the app.
2. Save current data to Drive.
3. Share the Drive file from the app with your friend's Google email.
4. Your friend opens the same website, connects Drive, pastes the Drive File ID, and loads the database.

This is file-based collaboration, not live multi-user editing. If two people save over the same file at the same time, the latest save can overwrite earlier changes.

## Publish To GitHub Pages

Simplest method:

1. Create a GitHub repository.
2. Copy the contents of `VendorManagerWeb/public/` into the repository root.
3. Commit and push.
4. Open **Settings > Pages**.
5. Source: **Deploy from a branch**.
6. Branch: `main`, folder: `/root`.
7. Open the GitHub Pages URL after deployment.

Alternative method:

1. Keep the full `VendorManagerWeb/` folder in the repository.
2. In **Settings > Pages**, select branch `main` and folder `/docs` only if you copy `public/` into `docs/`.
3. GitHub Pages cannot directly serve an arbitrary `public/` folder unless you use an action.

Because all asset paths are relative, the app works under subpaths such as:

```text
https://username.github.io/vendor-manager/
```

## Other Hosting Options

Netlify:

```text
Publish directory: public
Build command: none
```

Vercel:

```text
Framework: Other
Output directory: public
Build command: none
```

Firebase Hosting is optional and does not require Firebase Studio:

```bash
firebase login
firebase use your-firebase-project-id
firebase deploy --only hosting
```

## Limitations

- Static hosting cannot enforce secure app-level user roles. Google Drive sharing controls file access, but true role-based permissions require a backend such as Firestore, Supabase, or a custom server.
- Browser link checks are limited by CORS. Some valid vendor sites will show `Unknown`.
- `localStorage` is practical for a small to medium procurement database. A future IndexedDB version would be better for very large attachment metadata and history.
- The app does not scrape IndiaMart, Justdial, or vendor websites.
- Keep JSON backups before large imports, shared edits, or schema changes.
