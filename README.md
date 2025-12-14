# Giornale Scolastico Cesaris 2.0

## 🎓 School Newspaper Website

A modern, responsive school newspaper platform for Istituto Cesaris featuring article publishing, global chat, and community engagement.

## 🎨 Design

**Color Scheme:**
- **Primary**: #0033A0 (Cesaris Blue)
- **Secondary**: #FFD700 (Golden Yellow)
- **Success**: #10B981 (Mint Green)
- **Error**: #DC2626 (Red)

**Typography:**
- Headings: Georgia / Garamond (serif)
- Body: Inter / Poppins (sans-serif)

## 📄 Pages

### Public Pages
- **index.html** - Homepage with featured articles
- **articoli.html** - Browse all articles with search/filter
- **articolo.html** - Individual article view
- **categorie.html** - Browse by category
- **about.html** - About the newspaper
- **contact.html** - Contact information
- **guidelines.html** - Community guidelines
- **privacy.html** - Privacy policy
- **terms.html** - Terms of service

### Authentication
- **login.html** - Student login (@cesaris.edu.it)
- **register.html** - New user registration

### User Features
- **chat.html** - Global student chat
- **profilo.html** - User profile
- **candidatura.html** - Apply to become a reporter
- **code-of-conduct.html** - Reporter code of conduct

## ✨ Features

### Articles
- ✅ Article listing with pagination (1,2,3,4,5)
- ✅ Search and filter by category
- ✅ Sort by date, views, or title
- ✅ Article reactions (👍 ❤️ 😮 😢)
- ✅ Comment system
- ✅ Reading time calculation
- ✅ Trending articles
- ✅ Related articles

### Chat System
- ✅ Real-time messaging interface
- ✅ Emoji reactions on messages
- ✅ Pinned messages
- ✅ Typing indicators
- ✅ Online user counter

### Community
- ✅ Newsletter signup
- ✅ Reporter candidacy system
- ✅ Community guidelines
- ✅ Code of conduct
- ✅ Daily motivational quotes

### Authentication
- ✅ Login with @cesaris.edu.it
- ✅ Case-insensitive email validation
- ✅ Session management
- ✅ Terms acceptance modal
- ✅ User profiles

## 🚀 Deployment

This is a static website requiring no build process:

1. Upload all files to your web server
2. Ensure `index.html` is the entry point
3. No server-side code required (uses LocalStorage)

### Hosting Options
- GitHub Pages
- Netlify
- Vercel
- Any static hosting service

## 💻 Development

**No dependencies or build tools required!**

Simply open `index.html` in a web browser to view the site locally.

### File Structure
```
/
├── index.html              # Homepage
├── articoli.html           # All articles
├── articolo.html           # Article detail
├── chat.html               # Global chat
├── login.html              # Authentication
├── candidatura.html        # Reporter application
├── guidelines.html         # Community rules
├── code-of-conduct.html    # Reporter ethics
├── [other pages]
├── css/
│   └── style.css           # Main stylesheet
├── js/
│   ├── main.js             # Core functionality
│   ├── articles.js         # Article management
│   └── chat.js             # Chat system
└── img/                    # Images
```

## 🔐 Authentication

**Student Login:**
- Email must end with @cesaris.edu.it
- Case-insensitive validation
- Session stored in LocalStorage

**Access Levels:**
1. **Anonymous** - Read articles, no login required
2. **Student** - Login required for chat and comments
3. **Reporter** - Apply through candidacy form
4. **Admin** - Full site management (caporedattore, docente)

### Admin Features
- **Maintenance Mode** - Real-time site maintenance control
  - Synchronized across all devices via Supabase
  - Automatic redirect for non-admin users
  - Admin bypass during maintenance
  - See [MAINTENANCE_MODE_SETUP.md](./MAINTENANCE_MODE_SETUP.md) for details
- **User Management** - Suspend, activate, change roles
- **Content Moderation** - Review and manage reports
- **Site Settings** - Control registrations, chat, comments

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints for tablets and desktop
- Touch-friendly interfaces
- Burger menu on mobile

## 🎯 Core Functionality

### For Readers
1. Browse articles by category
2. Search for specific topics
3. React to articles with emoji
4. Read community guidelines

### For Students (Logged In)
1. All reader features +
2. Participate in global chat
3. Leave comments on articles
4. Create user profile
5. Apply to become a reporter

### For Reporters
1. All student features +
2. Submit article candidacy
3. Accept code of conduct
4. (Publishing requires backend - not included)

## ⚠️ Technical Notes

**Current Implementation:**
- ✅ Supabase backend integration
- ✅ Real authentication system
- ✅ Database persistence for articles, users, settings
- ✅ Real-time maintenance mode synchronization
- ✅ Row Level Security (RLS) policies
- 🔄 WebSocket for real-time chat (in progress)
- 🔄 Email notifications (in progress)

**Database Setup:**
1. Execute SQL scripts in `/supabase` directory
2. Set up environment variables
3. Configure RLS policies
4. See individual setup guides:
   - [MAINTENANCE_MODE_SETUP.md](./MAINTENANCE_MODE_SETUP.md) - Maintenance mode
   - [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Complete database setup

## 📊 Browser Support

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile browsers

## 📝 License

© 2024 Giornale Scolastico Cesaris. All rights reserved.

## 🤝 Contributing

This is a school project. For questions or contributions:
- Email: info@cesaris.edu.it
- Redazione: redazione@cesaris.edu.it

---

**Built with ❤️ for Istituto Cesaris**
