# Jingshin Public Leave Portal (v1.3.0)

A professional, mobile-responsive web portal designed for **Jingshin Ltd.** employees to submit leave applications remotely. This system acts as a secure bridge between a public interface and the internal local HR management system.

## 🌟 Key Features

- **ID Verification:** Real-time worker validation against the master employee list.
- **Multilingual Support:** Instant switching between **Traditional Chinese (繁)**, **English (EN)**, and **Vietnamese (VI)**.
- **Milestone Balance Display:** Integrated with the local "Milestone Bucket" system to show remaining annual leave days in real-time.
- **Google Drive Attachments:** Optional document upload (Images/PDF) stored securely in a private Google Drive folder.
- **Auto-Translation:** Automatically translates leave reasons to Traditional Chinese using Google Language Services for HR processing.
- **Mobile Optimized:** Modern UI with subtle wave animations and smooth transitions.

## 🏗️ How It Works (The Architecture)

The system operates as a hybrid cloud-local ecosystem:

1. **Frontend (GitHub Pages):** A lightweight React/Vite application that collects worker data and leave details.
2. **Middleman (Google Apps Script):**
   * Handles incoming API requests from the frontend.
   * Validates Worker IDs against a Google Sheet.
   * Processes Base64 attachments and saves them to **Google Drive**.
   * Stores pending applications in a Google Sheet "Inbox".
3. **Local Synchronization (Node.js Backend):**
   * A local server runs a cron job every **10 minutes**.
   * It "pulls" new applications from the Google Sheet.
   * It "downloads" high-resolution attachments from Google Drive to the local server storage.
   * It updates the local MySQL database and calculates the new leave balance.
   * Every **15 minutes**, it "pushes" the latest employee list and updated leave balances back to the Google Sheet so the portal stays accurate.

## 🛠️ Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Storage:** Google Sheets (Database Cache) + Google Drive (File Storage)
- **Engine:** Google Apps Script (Serverless API)
- **Local Integration:** Node.js (Cron Sync Service)

## 🔐 Security & Privacy

- **Protected Access:** The leave form is hidden until a valid company ID is provided.
- **Private Storage:** Attachments are saved to a private Drive folder, accessible only by the script and the authorized local HR server.
- **Bot Protection:** Includes a "Honey Pot" field to prevent automated spam submissions.

---

*© 2026 Jingshin Ltd. - Human Resources Administration System*
