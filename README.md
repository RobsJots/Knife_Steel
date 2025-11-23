Knife Steel & Sharpening Reference

This project provides a comprehensive, visually scannable reference for knife steels and sharpening guidance. It presents detailed steel profiles including hardness ranges, manufacturing processes, carbide composition, sharpening grit recommendations, and optimal degrees per side (DPS) for edge geometry. The chart is designed to balance technical depth with usability, making it suitable for both print and digital formats.

🔧 What This Is

A Progressive Web App (PWA) that works offline and installs like a native app

A searchable steel database with instant lookup and fuzzy matching

A dynamic card renderer that displays steel traits, grit guidance, and DPS tradeoffs

📁 File Structure

Knife_Steel/
├── index.html              # App shell with search input and card container
├── app.css                 # Responsive styles and layout
├── app.js                  # Live search, fuzzy matching, card rendering
├── steels.json             # Steel data source (fully structured)
├── manifest.webmanifest    # PWA manifest (installable, standalone)
├── sw.js                   # Service worker for offline caching

🔍 Search Features

Type any steel name, alias, or partial match (e.g. "MagnaCut", "CPM", "D2")

Suggestions appear as you type

Press Enter or click a suggestion to view full card

🧠 Data Model (steels.json)

Each steel entry includes:

name: Primary steel name

aliases: Alternate names or abbreviations

hrcRange and hrcOptimal: Hardness specs

process: Manufacturing route (e.g. PM, conventional melt)

traits: Emoji-tagged characteristics

mfg: Known manufacturers who hit optimal HRC

grit: Recommended sharpening grit range

dps: Array of DPS recommendations with retention/chipping tradeoffs

🚀 How to Deploy

Clone or fork the repo

Push to GitHub Pages (main branch or gh-pages)

Visit https://yourusername.github.io/Knife_Steel/

App is installable and works offline

🛠️ Future Flexibility

This structure supports:

Grouping steels by finish type (Polished, Toothy, Balanced)

Adding new steels without touching HTML

Expanding traits, grit guidance, or DPS logic

Styling or filtering by steel family, process, or use case

📦 Versioning

Update sw.js cache name and footer version when making changes

Use semantic versioning (e.g. v3.2 → v3.3)

🧪 Local Testing

To test locally:

python3 -m http.server
# Then visit http://localhost:8000

📄 License

MIT License. Use freely, modify responsibly.

For questions, contributions, or steel additions, open an issue or pull request.
