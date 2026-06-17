# Book Reading App - Setup Instructions

## Requirements

Before running the application, install:

### 1. Node.js

* Download and install the LTS version from https://nodejs.org
* Verify installation by opening a terminal and running:

```bash
node --version
npm --version
```

## Setup

### 2. Extract the Project

* Extract `book-reading-app.zip` to any folder on your computer.

### 3. Install Dependencies

* Open a terminal or command prompt inside the extracted project folder.
* Run:

```bash
npm install
```

Wait for the installation to finish.

### 4. Start the Application

Run:

```bash
npm run dev
```

### 5. Open the Application

Open your browser and go to:

```text
http://localhost:5173
```

## Database

The application is already configured to use a Supabase cloud database.

No database installation or configuration is required.

Requirements:

* Internet connection
* Included `.env` file

## Troubleshooting

### If the app does not start

Check that Node.js is installed:

```bash
node --version
```

Check that dependencies were installed:

```bash
npm install
```

Restart the development server:

```bash
npm run dev
```


#BY BILAL BOURZIZ