# Deployment to GitHub Pages

This guide will help you deploy the Whist game app to GitHub Pages.

## Prerequisites

1. A GitHub account
2. Git installed on your computer

## Steps to Deploy

### 1. Create a Private Repository on GitHub

1. Go to GitHub and click "New repository"
2. Name it (e.g., `whist-game`)
3. Set it to **Private**
4. Don't initialize with README, .gitignore, or license
5. Click "Create repository"

### 2. Initialize Git and Push Code

In your project directory, run:

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Add your GitHub repository as remote (replace USERNAME and REPO_NAME)
git remote add origin https://github.com/USERNAME/REPO_NAME.git

# Push to main branch
git branch -M main
git push -u origin main
```

### 3. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click on **Settings**
3. Scroll down to **Pages** in the left sidebar
4. Under **Source**, select **GitHub Actions**
5. The workflow will automatically deploy when you push to `main` branch

### 4. Access Your Deployed App

After the workflow completes (check the **Actions** tab), your app will be available at:
```
https://USERNAME.github.io/REPO_NAME/
```

Note: The first deployment might take a few minutes. You can check the deployment status in the **Actions** tab.

## Manual Deployment

If you want to deploy manually:

1. Build the project: `npm run build`
2. Push the `dist` folder to a `gh-pages` branch

But the GitHub Actions workflow handles this automatically, so manual deployment is not needed.

## Updating the Deployment

Simply push changes to the `main` branch:

```bash
git add .
git commit -m "Your commit message"
git push
```

The GitHub Actions workflow will automatically rebuild and redeploy your app.

