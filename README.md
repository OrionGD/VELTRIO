# VELTRIO 🌐

**AI-Powered Real-time Translation & Sentiment Analysis**

VELTRIO is a sophisticated web application designed to bridge communication gaps by providing real-time language translation, sentiment analysis, and interactive AI voice conversations. Leveraging the power of Google's **Gemini 2.5 Flash** models, VELTRIO offers deep insights into both the literal meaning and emotional context of global communication.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC?logo=tailwind-css&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Google_GenAI-Gemini_2.5-8E75B2?logo=google&logoColor=white)

## ✨ Key Features

### 🗣️ Smart Translator
*   **Multi-modal Input:** Type text or use real-time speech recognition.
*   **Intelligent Language Detection:** Automatically defaults to your browser's language for speech input.
*   **Sentiment Analysis:** Instantly analyzes the emotional tone (Positive, Negative, Neutral) of your text and provides context.
*   **Text-to-Speech (TTS):** Listen to translations with adjustable playback speed (0.5x - 2x).
*   **Translation History:** Automatically saves your recent translations for quick reference.

### 🎙️ Live Conversation
*   **Bidirectional Voice Chat:** Engage in natural, low-latency voice-to-voice conversations with Gemini.
*   **Real-time Transcription:** View live transcripts of both your input and the AI's response.
*   **Visual Feedback:** Dynamic UI indicators for connection status, listening, and speaking states.

### 🎨 Modern UI/UX
*   **Dark/Light Mode:** Fully responsive interface with seamless theme switching.
*   **Glassmorphism Design:** A polished aesthetic using backdrop blurs and smooth gradients.
*   **Mobile-First:** Optimized for performance across desktop and mobile devices.

## 🛠️ Technology Stack

*   **Frontend:** React 19, TypeScript
*   **Styling:** Tailwind CSS
*   **AI SDK:** `@google/genai` (Google GenAI SDK)
*   **Models:**
    *   `gemini-2.5-flash` (Text Translation & Sentiment)
    *   `gemini-2.5-flash-native-audio-preview-09-2025` (Live Audio Streaming)
*   **Audio Processing:** Web Audio API (Raw PCM streaming, AudioContext)
*   **Build Tool:** Vite

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18 or higher)
*   A valid API Key.

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/veltrio.git
    cd veltrio
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**
    Create a `.env` file in the root directory and add your API key:
    ```env
    API_KEY=your_google_genai_api_key_here
    ```
    *(Note: Ensure your bundler is configured to expose this key as `process.env.API_KEY`)*

4.  **Run the development server**
    ```bash
    npm run dev
    ```

## 👥 Meet the Team

VELTRIO was built by a dedicated team of engineers:

| Team Member | Role | Contribution |
| :--- | :--- | :--- |
| **Arjun S N** | Lead Developer & Architect | System architecture, state management strategies, and SDK integration patterns. |
| **Aravindan K** | AI Integration Specialist | Gemini Live API implementation, raw PCM audio streaming, and speech pipeline optimization. |
| **Godfrey T R** | Frontend Engineer & UI/UX | User interface design, responsive layouts, visual sentiment components, and landing page aesthetics. |

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

&copy; 2025 VELTRIO.
