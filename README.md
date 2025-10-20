# 🔧 Perimeter Maintenance Dashboard

A professional Progressive Web App (PWA) for managing customer inspections, NSI compliance, and scaffold alarm systems.

![Perimeter Security Logo](icons/web-app-manifest-192x192.png)

## 🚀 Features

### 🎤 **Voice Control (NEW!)**
- **Full two-way voice interaction** powered by AI
- **Natural language queries** - "How many systems on hire?"
- **Voice-activated updates** - "Change P1 to off hire"
- **Premium voice responses** with ElevenLabs
- **Hands-free operation** for field work
- **Context-aware conversations** that remember what you said
- **See [VOICE-CONTROL-GUIDE.md](VOICE-CONTROL-GUIDE.md) for full details**

### 📱 **Mobile-First PWA Experience**
- **Animated Splash Screen** with branded logo on app launch
- **Clean White Login Screen** with professional branding
- **Sticky Footer Navigation** for mobile devices and PWA mode
- **Touch-optimized interface** with proper tap targets
- **Offline capability** with service worker caching

### 🔧 **Maintenance Management**
- **Rolling 12-Month Performance Tracking** with accurate NSI filter support
- **Monthly Completion Statistics** with interactive carousel
- **Customer inspection scheduling** with flexible windows
- **NSI 3-Month Window Rule** compliance
- **Progress bars** showing on-time vs late completion rates
- **"Can Be Done" tracking** for current opportunities

### 📋 **NSI Compliance Tracking**
- **Complaints Management** with status tracking
- **ID Badge Management** with expiration monitoring
- **Test Equipment Calibration** tracking
- **First Aid Requirements** monitoring
- **Image attachments** for documentation
- **Mobile-optimized cards** for easy field use

### 📝 **Activity Logging**
- **Voice Command History** - Track all voice interactions
- **Command success/failure monitoring**
- **Timestamp tracking** for audit trail
- **Export logs** for analysis

### 🏗️ **Scaffold System Management**
- **System tracking** with P-numbers and contact details
- **Full address management** for installation locations
- **Rental history tracking** - Complete audit trail of all hires
- **On/Off hire management** with date tracking
- **Revenue calculations** with weekly/monthly projections
- **Invoice management** with overdue tracking
- **ARC integration** for enhanced monitoring
- **Extra sensors** cost calculations

## 🎨 **Design & Branding**

### **Professional UI**
- **Orange & Dark Blue Branding** throughout the application
- **Light Grey Theme** with consistent color scheme
- **Professional SVG Icons** for navigation
- **Smooth animations** and transitions
- **Responsive design** for all screen sizes

### **Mobile Navigation**
- **Top Navigation** for desktop users
- **Bottom Footer Tabs** for mobile/PWA users
- **Auto-switching** based on screen size and PWA mode
- **Touch-friendly buttons** with visual feedback

## 🛠️ **Technical Features**

### **PWA Capabilities**
- **Installable** on mobile devices and desktop
- **Offline functionality** with service worker
- **App-like experience** in standalone mode
- **Professional icon set** (72px to 512px)
- **Proper manifest** configuration

### **Data Management**
- **Supabase integration** for real-time data
- **PostgreSQL database** with Row Level Security (RLS)
- **Rental history tracking** with complete audit trails
- **Export/Import functionality** for data backup
- **Search and filtering** across all modules
- **Sortable tables** with multiple criteria
- **Mobile card layouts** for small screens

### **AI & Voice Technology Stack**
- **OpenAI GPT-4** for natural language understanding
- **Browser Speech Recognition** for voice input (Web Speech API)
- **ElevenLabs** for premium text-to-speech (with browser fallback)
- **Real-time command parsing** and execution
- **Context-aware conversations** with memory

## 📊 **Statistics & Reporting**

- **Rolling 12-Month Performance** with NSI filter support
- **Monthly completion tracking** with visual charts
- **On-time vs Late analysis** with color-coded indicators
- **Revenue projections** for scaffold systems
- **Overdue tracking** across all modules
- **Interactive drill-down** for detailed analysis

## 🎯 **Recent Enhancements**

### **v2024.2 - Voice Control & Scaffold Updates**
- ✅ **Full voice control system** with browser speech recognition & GPT-4
- ✅ **Premium text-to-speech** with ElevenLabs integration (or browser fallback)
- ✅ **Natural language understanding** for complex queries
- ✅ **Voice-activated data modifications** with confirmations
- ✅ **Hands-free operation** perfect for mobile field work
- ✅ **Conversation context** for multi-turn interactions
- ✅ **Scaffold rental history tracking** - Complete audit trail
- ✅ **Address management** for scaffold systems
- ✅ **Voice command logs tab** for activity monitoring
- ✅ **Enhanced error handling** with automatic TTS fallback

### **v2024.1 - Mobile & Branding Update**
- ✅ **Added animated splash screen** with company logo
- ✅ **Redesigned login screen** with clean white theme
- ✅ **Implemented mobile footer navigation** for PWA
- ✅ **Fixed NSI filter bug** in rolling statistics
- ✅ **Added professional icon set** with actual company branding
- ✅ **Removed annoying install prompts** for cleaner UX
- ✅ **Updated theme colors** for consistency

## 🚀 **Getting Started**

### **Installation**
1. Visit the dashboard URL in your mobile browser
2. Tap "Add to Home Screen" or "Install App"
3. Launch from your home screen for full PWA experience

### **Voice Control Setup**

#### **Local Development**
1. Copy `voice-config.example.js` to `voice-config.js`
2. Add your API keys:
   - `OPENAI_API_KEY` (required for AI understanding and speech-to-text)
   - `ELEVENLABS_API_KEY` (optional - for premium voice responses, falls back to browser TTS)
3. Refresh the page
4. Look for the purple microphone button (bottom right)
5. **Hold button down** while speaking, **release when done**
6. Speak clearly in phrases (e.g., "How many systems on hire?")
7. See [VOICE-CONTROL-GUIDE.md](VOICE-CONTROL-GUIDE.md) for complete instructions

#### **Production Deployment (Netlify)**
1. Go to your Netlify dashboard → Site settings → Environment variables
2. Add these **required** variables:
   - `OPENAI_API_KEY` - Your OpenAI API key (for Whisper STT and GPT-4)
   - `ELEVENLABS_API_KEY` - Your ElevenLabs API key (for premium TTS)
3. Optional environment variables (defaults work well):
   - `TTS_PROVIDER=elevenlabs` - Voice provider (default: elevenlabs)
   - `VOICE_LANGUAGE=en-GB` - Voice recognition language (default: en-GB)
4. Deploy - `voice-config.js` is auto-generated from env vars during build
5. Service worker is configured to always fetch fresh JS/CSS files (no caching issues)

**How It Works:**
- **Speech-to-Text:** OpenAI Whisper (accurate, reliable)
- **AI Understanding:** GPT-4 (natural language processing)
- **Text-to-Speech:** ElevenLabs (premium quality) with browser fallback
- **Interface:** Hold-to-talk (works on desktop and mobile)
- **Supported Browsers:** Chrome, Safari, Edge (desktop and mobile)

### **Login**
- Enter your password on the clean login screen
- Enjoy the branded splash screen animation
- Access all modules via the bottom navigation tabs (mobile) or top tabs (desktop)

## 📱 **Mobile Experience**

The app is optimized for mobile field work:
- **Bottom navigation tabs** for easy thumb access
- **Touch-optimized buttons** and forms
- **Mobile card layouts** instead of tables
- **Proper keyboard handling** for data entry
- **Offline capability** for areas with poor connectivity

## 🔒 **Security**

- Password-protected access
- Session management with automatic logout
- Secure Supabase integration
- HTTPS enforcement for PWA features

## 🎨 **Branding**

The application features consistent branding with:
- **Orange & Dark Blue** company colors
- **Professional logo** throughout the interface
- **Light grey theme** for clean, modern appearance
- **Consistent typography** and spacing

## 📞 **Support**

For technical support or feature requests, contact the development team.

---

**Built with ❤️ for Perimeter Security**  
*Professional maintenance management made simple*
