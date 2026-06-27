# Quick Setup Guide for Teachers

This guide will help you run the Book Reading App on your computer.

## What You Need

- A computer with Windows, Mac, or Linux
- Internet connection
- About 10 minutes of time

## Step-by-Step Instructions

### 1. Install Node.js

1. Go to https://nodejs.org/
2. Download the **LTS version** (recommended for most users)
3. Run the installer and follow the prompts
4. To verify it's installed, open a terminal/command prompt and type:
   ```
   node --version
   ```
   You should see a version number like `v18.x.x` or higher

### 2. Extract the Project Files

1. Extract the ZIP file you received to a folder on your computer
2. Remember where you extracted it (e.g., `Desktop/BookReadingApp`)

### 3. Install Dependencies

1. Open a terminal/command prompt
2. Navigate to the project folder:
   ```
   cd path/to/BookReadingApp
   ```
   (Replace `path/to/BookReadingApp` with the actual path)
   
3. Run this command:
   ```
   npm install
   ```
   This will download all required packages (takes 2-3 minutes)

### 4. Configure the App

1. In the project folder, find the file named `.env`
2. This file should already have the correct settings
3. **Important**: Make sure this file is present and has content

### 5. Run the Application

1. In the terminal (still in the project folder), run:
   ```
   npm run dev
   ```

2. You should see output like:
   ```
   VITE v7.x.x  ready in xxx ms
   
   ➜  Local:   http://localhost:5173/
   ```

3. Open your web browser and go to: `http://localhost:5173`

### 6. Start Using the App!

- Click **Sign Up** to create an account
- Or click **Sign In** if you already have an account
- Browse books, read, bookmark, and more!

## About the Database

### Will it work on my computer?

**YES!** The database is cloud-based, which means:

✅ **No installation needed** - The database runs on the internet, not on your computer
✅ **All data is saved** - Books, bookmarks, reviews, and user accounts are stored securely online
✅ **Works from anywhere** - You can access the app from any computer with the same credentials
✅ **Multiple users** - Multiple people can use the app simultaneously

### How does it work?

The app connects to a **Supabase** database (a modern cloud database service). All the data is stored on Supabase's servers, not on your local computer. This means:

- You don't need to install any database software
- You don't need to configure any database settings
- All your data is automatically backed up
- The app works the same way on any computer

### What if I want to use my own database?

If you want to set up your own Supabase project:

1. Go to https://supabase.com/ and sign up (free tier available)
2. Create a new project
3. Follow the instructions in the main README.md file to set up the database
4. Update the `.env` file with your new credentials

## Common Issues

### "npm is not recognized" error
- Node.js is not installed or not in your PATH
- Try closing and reopening your terminal
- Restart your computer if needed

### Port 5173 is already in use
Another application is using that port. Try:
```
npm run dev -- --port 3000
```
Then open http://localhost:3000

### Can't connect to database
- Check that the `.env` file exists and has content
- Verify you have an internet connection
- The Supabase project might be paused (free tier pauses after inactivity)

### Books not loading
- Make sure you ran all the database migrations (see main README.md)
- Check the browser console (F12) for error messages

## Need Help?

If you encounter issues:
1. Check the main README.md file for detailed troubleshooting
2. Make sure all steps were completed in order
3. Verify Node.js is installed: `node --version`
4. Verify npm is installed: `npm --version`

## Summary

1. ✅ Install Node.js
2. ✅ Extract project files
3. ✅ Run `npm install`
4. ✅ Ensure `.env` file exists
5. ✅ Run `npm run dev`
6. ✅ Open http://localhost:5173

**That's it!** The database is already set up and working. Just follow these steps and you'll have the app running in minutes.