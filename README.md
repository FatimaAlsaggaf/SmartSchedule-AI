# SmartSchedule

AI-assisted university scheduling that helps academic teams turn course data, scheduling rules, and student needs into practical semester timetables.

![SmartSchedule calendar dashboard and AI schedule assistant](https://fatima-alsaggaf-portfolio.vercel.app/images/projects/smartschedule.png)

## The idea

Building a semester timetable means balancing academic constraints, course availability, and special student cases. SmartSchedule brings schedule generation, conflict checking, and collaborative review into one platform for scheduling committees, faculty, and students.

## Key features

- **AI-assisted timetable generation:** uses Gemini with course data and scheduling constraints to propose schedules.
- **Conflict detection:** checks timetable conflicts and the impact of changes on irregular students.
- **Academic rules and course management:** manages courses, sections, levels, deadlines, and elective preferences.
- **Collaborative review:** supports comments, notifications, and real-time collaboration components.
- **Version history:** tracks schedule changes and supports restoring earlier versions.
- **Multiple user experiences:** dedicated web dashboards for committees, faculty, and students, plus a Flutter client.

## Technologies

| Layer | Technologies |
| --- | --- |
| Web interface | HTML, CSS, JavaScript, Bootstrap |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB, Mongoose |
| AI | Google Gemini API |
| Collaboration and history | Yjs, WebSocket, jsondiffpatch |
| Mobile client | Flutter, Dart, Provider |
| Deployment configuration | Vercel |

## Repository structure

```text
assets/           Web styles and JavaScript
backend/src/      Express routes, models, scheduling services, and Gemini integration
api/              Vercel serverless entry points
smart_schedule/   Flutter client
*.html            Web dashboards and feature pages
.env.example      Configuration template without credentials
```

## Run locally

You need Node.js and npm, a development MongoDB database, and a Gemini API key for schedule generation. Email verification and password reset also require email credentials.

```bash
git clone https://github.com/FatimaAlsaggaf/SmartSchedule-AI.git
cd SmartSchedule-AI
npm ci
cp .env.example .env
# Fill in your own development settings in .env.
npm run dev
```

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp` if needed. The API uses port `4000` by default. Serve the repository's HTML pages with a local static server, such as VS Code Live Server; the frontend points to `http://localhost:4000/api` on localhost.

For the mobile client, see [its setup guide](smart_schedule/README.md).

## Configuration and security

Real `.env` files, local deployment settings, dependency folders, and build output are excluded from this public source snapshot. `.env.example` contains variable names and non-secret defaults only. Embedded database credentials were replaced with environment-variable references before publication.

Use a separate development database and a strong `JWT_SECRET`. Do not run database maintenance or seed scripts against production data. Never commit credentials or place them in browser-side JavaScript.

## Project status

This repository presents an academic project and its source code. The portfolio image is a project preview, not a link to a verified live deployment. End-to-end execution has not been verified for this published snapshot; database setup, service credentials, and deployment configuration are required. The optional WebSocket scripts need dependency/entry-point review before use.
