# Income Tracker App 💰

A React Native & Expo application designed to act as your personal finance assistant. Track your incomes, manage your expenses, analyze categories, and get customized AI-powered financial advice directly within the app!

## Features ✨
- **Dashboard Overview**: Get a quick glance at your total income, expense, and current balance.
- **Transaction Management**: Add, edit, and view all your transactions securely.
- **AI Financial Assistant**: Use the built-in AI chat, which analyzes your financial situation and gives customized suggestions (powered by OpenRouter/Gemini).
- **Data Privacy**: All your financial data is strictly stored locally on your device.

## Technologies Used 🛠️
- [React Native](https://reactnative.dev/)
- [Expo](https://expo.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [OpenRouter API](https://openrouter.ai/) for intelligent assistant features

## Getting Started 🚀

### Prerequisites
- Node.js installed
- Expo CLI or npm/yarn
- Expo Go app on your physical device or an emulator (iOS/Android)

### Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repository-url>
   cd income-tracker-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   - The application relies on an `.env` file for secure keys.
   - Copy the `.env.example` file to create your own `.env` file:
   ```bash
   cp .env.example .env
   ```
   - Open `.env` and configure your API key:
   ```env
   EXPO_PUBLIC_OPENROUTER_API_KEY=your_actual_api_key_here
   ```

4. **Start the development server:**
   ```bash
   npx expo start
   ```

## Contributing 🤝
Pull requests are completely welcome. For major changes, please open an issue first to discuss what you want to change.

## License 📄
[MIT License](https://choosealicense.com/licenses/mit/)
