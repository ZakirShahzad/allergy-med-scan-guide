# Flikkt

**Flikkt** is an AI-powered mobile app that helps users avoid dangerous interactions between food products and their current medications or supplements. With a quick barcode scan or product search, Flikkt checks for conflicts and returns a simple 1–100 compatibility score, along with healthier alternatives if needed.

This app is designed for patients, caregivers, pharmacists, and anyone seeking safer, smarter shopping experiences.

---

## 🧠 Key Features

- **AI-Powered Interaction Analysis**  
  Uses a machine-learning model and a drug–ingredient interaction database to flag potential food-medicine conflicts.

- **Compatibility Scoring**  
  Each scanned product receives a 1–100 score to indicate safety and compatibility with your current medications.

- **Safer Alternatives**  
  When a scanned item is flagged, Flikkt suggests similar products with fewer or no risks.

- **Medication & Supplement Manager**  
  Securely store your current medications and supplements so all future scans are personalized.

- **Free Trial + Subscription Tiers**  
  Offers 5 free scans per month and unlocks unlimited access via Stripe-powered in-app purchases.

---

## 📱 Tech Stack

| Layer        | Tech Used                                      |
|--------------|------------------------------------------------|
| Frontend     | React + TypeScript (via Capacitor)             |
| Mobile       | CapacitorJS for native iOS/Android builds      |
| Backend      | Deno serverless functions                      |
| Auth & DB    | Supabase (Postgres + Auth + Storage)           |
| AI Engine    | OpenAI GPT-4 for explanation generation        |
| Payments     | Stripe Billing API                             |
| Deployment   | Vercel (web) + Xcode / Android Studio (native) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 16  
- Deno ≥ 1.30  
- Supabase project  
- OpenAI API key  
- Stripe secret key (for subscriptions)

### Clone the Project

```bash
git clone https://github.com/your-username/flikkt.git
cd flikkt

Setup Environment Variables
Create a .env file at the root and add:


SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
OPENAI_API_KEY=your_openai_key
STRIPE_SECRET_KEY=your_stripe_key


Install Dependencies

npm install
Run Dev Server

npm run dev
Run iOS/Android (Capacitor)

npx cap sync ios
npx cap open ios

npx cap sync android
npx cap open android
