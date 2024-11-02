
# Plain
Do less email. Plain and simple.

This is a tech demo for a minimalist, keyboard-driven email client with AI-powered summarization. The idea is that our email is bloated. Over half of email content is unnecessary filler which causes mental strain. When you receive an email there are only two decisions being made: Can I ignore it, and if not, do I need to do something or just reply? Just replying is why we need to open our email but maybe we can spend less time doing that.


## ✨ Features

- 🎯 **Minimalist Interface** - Distraction-free email management in a retro terminal style
- ⌨️ **Keyboard-First** - Complete control without touching your mouse
- 🤖 **AI Summaries** - Smart email summarization to help you process faster
- 🎓 **Trainable** - Teach the AI which emails you want to ignore
- 🖥️ **Terminal Aesthetic** - Clean monospace design using IBM Plex Mono

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/plain.git

# Navigate to project directory
cd plain

# Install dependencies
npm install

# Start development server
npm start
```

## ⌨️ Keyboard Controls

| Key     | Action                   |
|---------|---------------------------|
| ↑/↓     | Navigate emails           |
| Enter   | Toggle full/summary view  |
| R       | Reply to email            |
| D       | Delete email              |
| T       | Enter training mode       |
| Q       | Quit to login             |
| ESC     | Cancel/Back               |

## 🏗️ Architecture

The app is built with React and uses a simple but effective architecture:

### Core Components

- **EmailQueue** - Manages incoming email processing:

```javascript
class EmailQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }

  enqueue(email) {
    this.queue.push(email);
  }

  dequeue() {
    return this.queue.shift();
  }

  isEmpty() {
    return this.queue.length === 0;
  }
}
```

- **Main App Component** - Handles state management and keyboard interactions:

```javascript
function App() {
  const [emails, setEmails] = useState(initialEmails);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentMode, setCurrentMode] = useState('mail');
  const [cursorVisible, setCursorVisible] = useState(true);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('logout'); // 'logout', 'login', or 'main'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginStep, setLoginStep] = useState('email'); // 'email' or 'password'
  const [isLoading, setIsLoading] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [showFullBody, setShowFullBody] = useState(false);
  const [showSentModal, setShowSentModal] = useState(false);
  const [trainMode, setTrainMode] = useState(false);
  const [allEmails, setAllEmails] = useState([]);  // Includes deleted emails
  const [trainIndex, setTrainIndex] = useState(0);
  const [showTrainingComplete, setShowTrainingComplete] = useState(false);
}
```

## 🎨 Styling

The app uses pure CSS with a carefully crafted monospace aesthetic:

```css
.App {
  background-color: #000;
  color: #c0c0c0;
  font-family: "IBM Plex Mono", "Courier New", monospace;
  min-height: 100vh;
  padding: 30px;
  box-sizing: border-box;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  position: relative;
}
```

## 🎓 Training Mode

Plain includes a unique training feature that allows users to personalize their email summary lengths:

- Press `T` to enter training mode
- Use `+` / `-` to adjust summary length
- Press `Enter` to confirm and move to next email
- Press `ESC` to exit training mode

The training UI provides visual feedback:

```html
<div className="training-score">
  <div className="score-labels">
    <span>less</span>
    <span>more</span>
  </div>
  <div className="score-bar">
    <div 
      className="score-fill" 
      style={{width: `${((allEmails[trainIndex].user_score - 490) / 20) * 100}%`}}
    />
  </div>
</div>
```

## 🛠️ Tech Stack

- **React 18**
- **CSS3 (No frameworks)**
- **CSV-Parse** for data handling
- **React Markdown** for email rendering

## 📦 Dependencies

```json
"dependencies": {
  "@testing-library/jest-dom": "^5.17.0",
  "@testing-library/react": "^13.4.0",
  "@testing-library/user-event": "^13.5.0",
  "csv-parse": "^5.5.6",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-markdown": "^9.0.1",
  "react-scripts": "5.0.1",
  "web-vitals": "^2.1.4"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

## 👥 Authors

- **Your Name** - Initial work - [@yourusername](https://github.com/yourusername)

## 🙏 Acknowledgments

- **IBM Plex Mono** font for the retro terminal aesthetic
- **Create React App** for the initial project structure
- **The open-source community**

---

<div align="center">
Made with ❤️ by <a href="https://github.com/ssdavidaie">David Szabo-Stuban</a>
</div>
