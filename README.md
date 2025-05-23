# curaai-project

## Project Overview

`curaai-project` is a web application that appears to be designed for interacting with and processing textual information, potentially from medical documents or web content, and possibly leveraging generative AI capabilities.

The project consists of three main components:
1.  **Backend (`/backend`):** A Node.js server built with Express.js, providing APIs for the frontend. It includes functionalities for interacting with Google's Generative AI, fetching and parsing web content.
2.  **Frontend (`/frontend`):** A React (Create React App) single-page application providing the user interface. It includes capabilities for making API calls, rendering Markdown, and potentially client-side PDF generation/manipulation.
3.  **PDF Utility (`ex.py`):** A Python script for extracting specific pages from PDF documents, currently configured for "TRATADO DE MEDICINA ENDOCANABINOIDES_compressed.pdf".

## Tech Stack

*   **Backend:**
    *   Node.js
    *   Express.js (`^5.1.0` - Note: This is a pre-release version of Express 5. The current stable is 4.x)
    *   `@google/genai`: For interacting with Google's Generative AI.
    *   `@mozilla/readability`, `jsdom`, `node-fetch`, `robots-parser`, `turndown`: For fetching, parsing, and processing web content.
    *   `cors`: For Cross-Origin Resource Sharing.
    *   `dotenv`: For environment variable management.
    *   `xml2js`: For XML parsing.
*   **Frontend:**
    *   React (`^18.2.0`) (via Create React App `5.0.1`)
    *   JavaScript
    *   HTML, CSS
    *   `axios`: For HTTP requests to the backend.
    *   `html2canvas`, `jspdf`: For client-side PDF generation or image capture.
    *   `react-markdown`: For rendering Markdown content.
    *   `styled-components`: For CSS styling.
*   **PDF Utility:**
    *   Python (Version >=3.7 recommended for `pypdf`)
    *   `pypdf`
*   **Package Management:** npm (for frontend and backend)

## Directory Structure

```
curaai-project/
├── backend/            # Node.js Express.js backend application
│   ├── config/         # Configuration files (if any, structure may vary)
│   ├── controllers/    # Request handlers
│   ├── routes/         # API endpoint definitions
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   ├── tools/          # Backend-specific tools or scripts
│   ├── node_modules/   # Backend dependencies (ignored by Git)
│   ├── server.js       # Main backend server entry point
│   ├── package.json    # Backend dependencies and scripts
│   └── README.md       # Backend-specific instructions
├── frontend/           # React (Create React App) frontend application
│   ├── public/         # Static assets (index.html, images, favicons)
│   ├── src/            # Frontend source code
│   │   └── components/ # UI components (typical React structure)
│   ├── node_modules/   # Frontend dependencies (ignored by Git)
│   ├── package.json    # Frontend dependencies and scripts
│   └── README.md       # Frontend-specific instructions
├── cursor/             # Contains project-specific settings or rules, potentially for the Cursor IDE.
│   └── rules/          # Currently empty, purpose to be defined if used.
├── .git/               # Git repository data
├── .gitignore          # Specifies intentionally untracked files by Git
├── ex.py               # Python script to extract pages from a PDF
├── requirements.txt    # Python dependencies for ex.py
├── TRATADO DE MEDICINA ENDOCANABINOIDES_compressed.pdf # Input PDF for ex.py
├── Tratado_Selecionado_Cap4_6_7_Refs.pdf             # Output PDF generated by ex.py
└── README.md           # This file: Project overview and general setup
```

## Prerequisites

*   **Node.js:** Version >= 16.x recommended (as `node-fetch` v2 is used, which is compatible with older Node versions, but modern development typically targets newer LTS versions. Check `engines` in `package.json` if specified by the original developer).
*   **npm:** (Usually comes with Node.js)
*   **Python:** Version >= 3.7 recommended for `pypdf` and general compatibility.
*   **pip:** (Python package installer)

## Global Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd curaai-project
    ```

2.  **Backend Setup:**
    See `backend/README.md` for detailed instructions. (Key steps: `cd backend`, `npm install`, configure `.env`).

3.  **Frontend Setup:**
    See `frontend/README.md` for detailed instructions. (Key steps: `cd frontend`, `npm install`). The frontend is proxying API requests to `http://localhost:3001` as defined in `frontend/package.json`.

4.  **Python Utility Setup (for `ex.py`):**
    It's recommended to use a virtual environment for Python projects.
    ```bash
    # Navigate to the project root if you aren't already there
    python -m venv venv
    ```
    Activate the virtual environment:
    *   On macOS and Linux:
        ```bash
        source venv/bin/activate
        ```
    *   On Windows:
        ```bash
        .\\venv\\Scripts\\activate
        ```
    Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
    To run the script (after configuring page numbers in `ex.py` or modifying it to accept parameters):
    ```bash
    python ex.py
    ```
    To deactivate the virtual environment when done:
    ```bash
    deactivate
    ```

## How to Get Help

*   [**TODO: Add contact information or preferred communication channels for the new programmer, e.g., "Contact original_developer@example.com for questions."**]

## Contributing

*   [**TODO: If you have contribution guidelines (e.g., branch naming, PR process), add them here or link to a CONTRIBUTING.md file. Otherwise, this can be removed or state "Contributions are welcome. Please discuss major changes first."**]
*   Consider adding linting (e.g., ESLint, Prettier for JS; Black, Flake8 for Python) and formatting scripts to `package.json` and `requirements.txt` (for dev dependencies) to maintain code consistency.

---

**Note to New Developer:** Please fill in any remaining `TODO:` sections. Review the `backend/README.md` and `frontend/README.md` files as they contain more specific setup details and TODOs for those parts of the project. Be aware that the backend uses a pre-release version of Express.js 5.