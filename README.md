# Portfolio Website - About Me

A professional, fully responsive portfolio website showcasing your resume, skills, projects, and career aspirations. Built with vanilla HTML, CSS, and JavaScript for optimal performance and easy deployment.

## 🌟 Features

- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Modern UI**: Clean, professional design with smooth animations and transitions
- **Project Showcase**: Displays all your coding projects with descriptions and tech stacks
- **Resume Section**: Comprehensive resume with education, experience, and certifications
- **Career Goals**: Dedicated section showing what types of jobs you're looking for
- **Contact Form**: Easy-to-use contact form for recruiters to reach out
- **Smooth Navigation**: Fixed navigation bar with smooth scrolling
- **SEO Friendly**: Optimized for search engines

## 📁 Project Structure

```
About_Me/
├── index.html          # Main HTML file
├── styles.css          # CSS styling
├── script.js           # JavaScript functionality
└── README.md          # This file
```

## 🚀 Quick Start

### Local Development

1. **Clone or navigate to the directory**
   ```powershell
   cd c:\Projects\About_Me
   ```

2. **Open the website**
   - Simply open `index.html` in your web browser
   - Or use a local server (recommended):
   ```powershell
   # Using Python
   python -m http.server 8000
   
   # Or using Node.js (if you have http-server installed)
   npx http-server
   ```

3. **View in browser**
   - If using a server, navigate to `http://localhost:8000`

## 🎨 Customization

Before deploying, update the following sections in `index.html`:

### Personal Information
- Replace "Your Name" with your actual name
- Update email addresses: `your.email@example.com`
- Update social media links:
  - GitHub: `https://github.com/yourusername`
  - LinkedIn: `https://linkedin.com/in/yourusername`

### Resume Content
Update these sections in the Resume area:
- Education details
- Work experience
- Certifications
- Add a link to your PDF resume

### Projects
The projects section already includes your existing projects. Update the GitHub links:
- AI Recipe Recommender
- Finance Tracker
- Study Planner
- Weather Dashboard
- C Data Structures Library

### Job Preferences
Customize the "Looking For" section with your specific:
- Desired job titles
- Work location preferences
- Industries of interest
- Company size preferences

## 🌐 Deployment Options

### Option 1: GitHub Pages (Recommended - Free & Easy)

1. **Create a GitHub repository**
   ```powershell
   cd c:\Projects\About_Me
   git init
   git add .
   git commit -m "Initial portfolio commit"
   ```

2. **Push to GitHub**
   ```powershell
   # Create a new repository on GitHub first, then:
   git remote add origin https://github.com/yourusername/portfolio.git
   git branch -M main
   git push -u origin main
   ```

3. **Enable GitHub Pages**
   - Go to your repository settings
   - Scroll to "Pages" section
   - Select "main" branch as source
   - Click Save
   - Your site will be live at: `https://yourusername.github.io/portfolio/`

### Option 2: Netlify (Free with Custom Domain Support)

1. **Install Netlify CLI** (optional)
   ```powershell
   npm install -g netlify-cli
   ```

2. **Deploy via Drag & Drop**
   - Go to [netlify.com](https://netlify.com)
   - Sign up for free
   - Drag the `About_Me` folder to the deploy zone
   - Your site will be live instantly with a URL like: `your-site-name.netlify.app`

3. **Or Deploy via CLI**
   ```powershell
   cd c:\Projects\About_Me
   netlify deploy --prod
   ```

### Option 3: Vercel (Free & Fast)

1. **Install Vercel CLI**
   ```powershell
   npm install -g vercel
   ```

2. **Deploy**
   ```powershell
   cd c:\Projects\About_Me
   vercel
   ```

3. **Follow the prompts** and your site will be live at: `your-site-name.vercel.app`

### Option 4: Render (Free Static Site Hosting)

1. Go to [render.com](https://render.com)
2. Sign up and create a new "Static Site"
3. Connect your GitHub repository
4. Render will automatically deploy your site

## 📱 Testing Your Site

Before deploying, test your website:

1. **Responsive Design**: Use browser dev tools to test different screen sizes
2. **All Links**: Verify all navigation and external links work
3. **Contact Form**: Test the contact form functionality
4. **Mobile Menu**: Check hamburger menu on mobile devices
5. **Load Time**: Ensure images and resources load quickly

## 🔧 Advanced Customization

### Adding Your Resume PDF
1. Add your PDF file to the folder (e.g., `resume.pdf`)
2. Update the download link in `index.html`:
   ```html
   <a href="resume.pdf" class="btn btn-primary" download>
   ```

### Changing Colors
Edit CSS variables in `styles.css`:
```css
:root {
    --primary-color: #2563eb;  /* Change to your preferred color */
    --secondary-color: #10b981;
    /* ... other colors ... */
}
```

### Adding More Projects
Copy a project card in `index.html` and update:
- Project name and icon
- Description
- Technology badges
- Features list
- GitHub link

## 📊 Analytics (Optional)

To track visitors, add Google Analytics:

1. Get your tracking ID from [analytics.google.com](https://analytics.google.com)
2. Add this before `</head>` in `index.html`:
   ```html
   <!-- Google Analytics -->
   <script async src="https://www.googletagmanager.com/gtag/js?id=YOUR-ID"></script>
   <script>
     window.dataLayer = window.dataLayer || [];
     function gtag(){dataLayer.push(arguments);}
     gtag('js', new Date());
     gtag('config', 'YOUR-ID');
   </script>
   ```

## 🎯 SEO Optimization

The site is SEO-ready! For better search rankings:

1. **Add meta tags** in `<head>`:
   ```html
   <meta name="description" content="Your professional portfolio description">
   <meta name="keywords" content="software developer, full stack, your name">
   <meta property="og:title" content="Your Name - Portfolio">
   <meta property="og:description" content="Your description">
   <meta property="og:image" content="your-image.jpg">
   ```

2. **Submit to search engines**:
   - Google Search Console
   - Bing Webmaster Tools

## 🤝 Support & Contact

If you need help customizing or deploying your portfolio, feel free to reach out!

## 📝 License

This portfolio template is free to use and customize for your personal portfolio.

---

**Ready to Deploy?** Follow the deployment instructions above and share your portfolio with recruiters! 🚀

## 🔗 Quick Links

- [GitHub Pages Documentation](https://pages.github.com/)
- [Netlify Documentation](https://docs.netlify.com/)
- [Vercel Documentation](https://vercel.com/docs)
- [Web Development Resources](https://developer.mozilla.org/)

Good luck with your job search! 💼✨
