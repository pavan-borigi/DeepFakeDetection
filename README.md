# Deepfake Detection System 🕵️‍♂️✨

Welcome! This is an AI-powered application designed to help you distinguish between real and AI-generated media. We've built this tool to make advanced deepfake detection accessible, fast, and easy to use.

## 🚀 What Does It Do?
Simply put, you upload an image, and our system analyzes it using deep learning to tell you if it's likely **Real** or **Fake**. 

It uses a **MobileNetV3** AI model under the hood—a lightweight but powerful neural network—to scan for subtle artifacts that the human eye might miss.

## 🌟 Key Features
*   **Instant Analysis**: Get results in seconds.
*   **Confidence Score**: We don't just say "Fake"; each result comes with a percentage score so you know how sure the AI is.
*   **User-Friendly Dashboard**: Clean, modern interface (built with React) to manage your uploads.
*   **Secure History**: Keep track of your past scans.

## 🛠️ How to Run It (Locally)

### Prerequisites
*   **Node.js**: For the frontend.
*   **Python (3.12+)**: For the AI backend.

### Quick Start
1.  **Clone the repository**:
    ```bash
    git clone https://github.com/pavan-borigi/DeepFake-DetectionSystem.git
    ```
2.  **Start the Backend**:
    This handles the AI magic.
    ```bash
    # Important: Use this precise command on Windows to avoid path errors
    subst Z: "path\to\project"
    cmd /c "Z: && .\.venv\Scripts\python server\api_server.py"
    ```
3.  **Start the Frontend**:
    This launches the website.
    ```bash
    npm --prefix apps/web run dev
    ```
4.  **Open in Browser**:
    Go to `http://localhost:8081` (or the port shown in your terminal).

## 🧩 Tech Stack
*   **Frontend**: React, TypeScript, Tailwind CSS
*   **Backend**: Python, Flask, PyTorch
*   **Database**: Supabase

## 🚀 Deploy on Render

### Backend (Flask API)
1. Create a new **Web Service** from the repo.
2. **Root Directory**: `server`
3. **Build Command**:
    ```bash
    pip install -r requirements-api.txt
    ```
4. **Start Command**:
    ```bash
    python api_server.py
    ```
5. **Environment**: Python 3.12+

### Frontend (Vite)
1. Create a new **Static Site** from the repo.
2. **Root Directory**: `apps/web`
3. **Build Command**:
    ```bash
    npm install && npm run build
    ```
4. **Publish Directory**: `dist`
5. Add environment variables:
    - `VITE_SUPABASE_URL`
    - `VITE_SUPABASE_PUBLISHABLE_KEY`

### Notes
- The API runs on Render at a public URL; update any client-side API base URL if you deploy the backend separately.
- If you want to proxy API requests from the frontend, add a rewrite on Render or configure a custom domain.

## 🤝 Contributing
Found a bug? Have an idea? Feel free to open an issue or submit a pull request. We love improving this together!

---
*Built with ❤️ for a more authentic internet.*