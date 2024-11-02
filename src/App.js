import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import './App.css';
import { parse } from 'csv-parse/browser/esm/sync';

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

const initialEmails = [
  {
    senderName: "Alice Smith",
    senderEmail: "alice@example.com",
    subject: "Welcome to PLAIN",
    body: "Hey there!\n\nWelcome to PLAIN, your new minimal email client.\n\nBest,\nAlice",
    summary: "Welcome message for new PLAIN users",
    read_status: false,
    user_score: 0
  }
];

const loadEmailsFromCSV = async () => {
  try {
    const response = await fetch('/example.csv');
    const csvText = await response.text();
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true
    });

    return records.map(record => {
      // Format the received date to YYYY-MM-DD HH:mm
      const receivedDate = new Date(record.Received);
      const formattedDate = receivedDate.toISOString()
        .replace('T', ' ')           // Replace T with space
        .substring(0, 16);           // Take only YYYY-MM-DD HH:mm part

      return {
        senderName: record.senderName,
        senderEmail: record.senderEmail,
        subject: record.Subject,
        body: record.Body,
        summary: record.summary,
        received: formattedDate,
        read_status: false,
        user_score: 0
      };
    });
  } catch (error) {
    console.error('Error loading emails from CSV:', error);
    return initialEmails;
  }
};

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

  const emailRef = useRef(email);
  const loginStepRef = useRef(loginStep);
  const passwordRef = useRef(password);
  const emailQueueRef = useRef(new EmailQueue());

  useEffect(() => {
    emailRef.current = email;
    loginStepRef.current = loginStep;
    passwordRef.current = password;
  }, [email, loginStep, password]);

  useEffect(() => {
    if (currentMode === 'mail' && emails[currentIndex] && !emails[currentIndex].read_status && showFullBody) {
      setEmails(prevEmails => prevEmails.map((email, idx) => 
        idx === currentIndex ? { ...email, read_status: true } : email
      ));
    }
  }, [currentMode, currentIndex, emails, showFullBody]);

  useEffect(() => {
    const handleClick = () => {
      const input = document.querySelector('.hidden-input');
      if (input) input.focus();
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const isValidEmail = (email) => {
    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleKeyInput = useCallback((event) => {
    if (currentScreen === 'logout') {
      if (event.key === 'Enter') {
        const currentEmail = emailRef.current;
        const currentPassword = passwordRef.current;
        const currentLoginStep = loginStepRef.current;
        console.log('Email entered:', currentEmail);
        console.log('Password entered:', currentPassword);
        console.log('Login step:', currentLoginStep);
        if (currentLoginStep === 'email') {
          if (!isValidEmail(currentEmail.trim())) {
            setLoginError('Please enter a valid email');
            return;
          }
          setLoginStep('password');
          setPassword('');
          setLoginError('');
        } else if (currentLoginStep === 'password') {
          if (currentPassword.length < 6) {
            setLoginError('Password must be at least 6 characters');
            return;
          }
          // Handle successful login
          setIsAuthenticated(true);
          setCurrentScreen('main');
        }
      } else if (event.key === 'Escape') {
        if (loginStepRef.current === 'password') {
          setLoginStep('email');
          setPassword('');
        } else {
          setEmail('');
        }
        setLoginError('');
      }
    }

    if (currentScreen === 'main') {
      if (!isReplying) {
        switch (event.key) {
          case 'Enter':
            setShowFullBody(prev => !prev);
            break;
          case 'ArrowUp':
            setCurrentIndex(prev => Math.max(0, prev - 1));
            setShowFullBody(false);
            break;
          case 'ArrowDown':
            setCurrentIndex(prev => Math.min(emails.length - 1, prev + 1));
            setShowFullBody(false);
            break;
          case 'r':
          case 'R':
            setIsReplying(true);
            setReplyText('');
            break;
          case 'd':
          case 'D':
            setEmails(prev => prev.filter((_, idx) => idx !== currentIndex));
            if (currentIndex >= emails.length - 1) {
              setCurrentIndex(Math.max(0, emails.length - 2));
            }
            break;
          case 'q':
          case 'Q':
            setCurrentScreen('logout');
            setLoginStep('email');
            setEmail('');
            setPassword('');
            break;
          case 't':
          case 'T':
            setTrainMode(true);
            setTrainIndex(0);
            setAllEmails(emails.map(email => ({
              ...email,
              user_score: email.user_score || 500
            })));
            break;
          default:
            break;
        }
      } else {
        // Reply mode handling
        if (event.key === 'Escape') {
          if (showConfirmModal) {
            // Second ESC press - exit everything
            setShowConfirmModal(false);
            setIsReplying(false);
            setReplyText('');
          } else {
            // First ESC press - show confirm modal
            setShowConfirmModal(true);
          }
        } else if (showConfirmModal) {
          switch (event.key) {
            case 'Enter':
              setShowSentModal(true);
              setTimeout(() => {
                setShowSentModal(false);
                setEmails(prev => prev.filter((_, idx) => idx !== currentIndex));
                if (currentIndex >= emails.length - 1) {
                  setCurrentIndex(Math.max(0, emails.length - 2));
                }
                setIsReplying(false);
                setReplyText('');
                setShowConfirmModal(false);
              }, 1000);
              break;
            case ' ':
              setShowConfirmModal(false);
              break;
            default:
              break;
          }
        } else {
          if (event.key === 'Backspace') {
            setReplyText(prev => prev.slice(0, -1));
          } else if (event.key.length === 1) {
            setReplyText(prev => prev + event.key);
          }
        }
      }
    }

    if (trainMode) {
      switch (event.key) {
        case '+':
          setAllEmails(prev => prev.map((email, idx) => 
            idx === trainIndex && email.user_score < 510
              ? { ...email, user_score: email.user_score + 2 }
              : email
          ));
          break;
        case '-':
          setAllEmails(prev => prev.map((email, idx) => 
            idx === trainIndex && email.user_score > 490
              ? { ...email, user_score: email.user_score - 2 }
              : email
          ));
          break;
        case 'Enter':
          if (showTrainingComplete) {
            setTrainMode(false);
            setShowTrainingComplete(false);
          } else if (trainIndex < allEmails.length - 1) {
            setTrainIndex(prev => prev + 1);
          } else {
            setShowTrainingComplete(true);
          }
          break;
        case 'Escape':
          setTrainMode(false);
          break;
      }
    }
  }, [
    currentScreen,
    isReplying,
    emails.length,
    currentIndex,
    setCurrentScreen,
    setLoginStep,
    setEmail,
    setPassword,
    setIsReplying,
    setReplyText,
    setEmails,
    setCurrentIndex,
    isValidEmail
  ]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      handleKeyInput(event);
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    handleKeyInput,
    currentScreen,
    emails,
    currentIndex,
    isReplying
  ]);

  const processEmailQueue = useCallback(async () => {
    const queue = emailQueueRef.current;
    
    if (queue.processing || queue.isEmpty()) {
      return;
    }

    queue.processing = true;
    setIsLoading(true);

    try {
      while (!queue.isEmpty()) {
        const email = queue.dequeue();
        setEmails(prevEmails => {
          const newEmails = [email, ...prevEmails];
          if (currentIndex >= newEmails.length) {
            setCurrentIndex(newEmails.length - 1);
          }
          return newEmails;
        });
        setQueueCount(queue.queue.length);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('Error processing email queue:', error);
    } finally {
      queue.processing = false;
      setIsLoading(false);
    }
  }, [currentIndex]);

  const handleWebhookData = useCallback((webhookData) => {
    const newEmail = {
      senderName: webhookData.senderName,
      senderEmail: webhookData.senderEmail,
      received: webhookData.received,
      subject: webhookData.subject,
      body: webhookData.body,
      summary: webhookData.summary,
      read_status: false,
      user_score: 0
    };

    emailQueueRef.current.enqueue(newEmail);
    setQueueCount(emailQueueRef.current.queue.length);
    processEmailQueue();
  }, [processEmailQueue]);

  useEffect(() => {
    const handleWebhookEvent = (event) => {
      handleWebhookData(event.detail);
    };

    window.addEventListener('email-webhook', handleWebhookEvent);
    return () => window.removeEventListener('email-webhook', handleWebhookEvent);
  }, [handleWebhookData]);

  useEffect(() => {
    const loadEmails = async () => {
      try {
        setIsLoading(true);
        const loadedEmails = await loadEmailsFromCSV();
        if (loadedEmails && loadedEmails.length > 0) {
          setEmails(loadedEmails);
        }
      } catch (error) {
        console.error('Failed to load emails:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEmails();
  }, []);

  // Logged out landing screen
  if (currentScreen === 'logout') {
    return (
      <div className="App">
        <div className="logout-screen">
          <pre className="ascii-art">
{`
██████╗ ██╗      █████╗ ██╗███╗   ██
██╔══██╗██║     ██╔══██ ██║████╗  ██║
██████╔╝██║     ███████║██║██╔██╗ ██║
██╔═══╝ ██║     ██╔══██║██║██║╚██╗██║
██      ██████╗ ██║  ██║██║██║ ╚████║
╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝
`}
          </pre>
          <p className="version">v1.0.0</p>
          <p className="logout-message">Do less email. Plain and simple.</p>
          <div className="login-prompt">
            {loginStep === 'email' ? (
              <>
                <p>Enter your email address to login:</p>
                <div className="input-line">
                  {email}<span className="cursor">█</span>
                </div>
              </>
            ) : (
              <>
                <p>Email: {email}</p>
                <p>Password:</p>
                <div className="input-line">
                  {'*'.repeat(password.length)}<span className="cursor">█</span>
                </div>
              </>
            )}
          </div>
          {loginError && <p className="error-message">{loginError}</p>}
          <p className="controls">ESC: {loginStep === 'email' ? 'Clear' : 'Back'}</p>
          <input
            type={loginStep === 'email' ? 'email' : 'password'}
            value={loginStep === 'email' ? email : password}
            onChange={(e) => {
              setLoginError('');
              const value = e.target.value;
              console.log('Input changed:', value);
              if (loginStep === 'email') {
                setEmail(value);
              } else {
                setPassword(value);
              }
            }}
            className="hidden-input"
            autoFocus
          />
        </div>
      </div>
    );
  }

  if (currentScreen === 'login') {
    // ... existing login screen JSX ...
  }

  // In your render logic, after successful login:
  if (currentScreen === 'main') {
    return (
      <div className="App">
        <div className={trainMode ? 'train-mode' : 'mail-mode'}>
          {trainMode ? (
            <>
              <h2>TRAIN</h2>
              <div className="controls">
                + increase · - decrease · ENTER next · ESC quit
              </div>
              <div className="email-details email-details-summary">
                <div className="email-meta">
                  <p>From: {`${allEmails[trainIndex].senderName} <${allEmails[trainIndex].senderEmail}>`}</p>
                  <p>Subject: {allEmails[trainIndex].subject}</p>
                </div>
                <div className="email-body">
                  <ReactMarkdown>{allEmails[trainIndex].summary}</ReactMarkdown>
                </div>
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
              </div>
            </>
          ) : (
            <>
              <h2>PLAIN</h2>
              <div className="controls">
                ↑↓ navigate · R reply · D delete · T train · Q quit
                {isLoading && <span className="loading-indicator"> · Loading...</span>}
                {queueCount > 0 && <span className="queue-indicator"> · {queueCount} pending</span>}
              </div>
              {emails && emails.length > 0 && emails[currentIndex] && (
                <div className={`email-details ${showFullBody ? 'email-details-full' : 'email-details-summary'}`}>
                  {isReplying ? (
                    <div className="reply-text">
                      {replyText}
                      <span className="reply-cursor"></span>
                    </div>
                  ) : (
                    <>
                      <div className="email-meta">
                        <p>From: {`${emails[currentIndex].senderName} <${emails[currentIndex].senderEmail}>`}</p>
                        <p>Subject: {emails[currentIndex].subject}</p>
                      </div>
                      <hr className="divider" />
                      <div className="email-body">
                        <ReactMarkdown>{showFullBody ? emails[currentIndex].body : emails[currentIndex].summary}</ReactMarkdown>
                      </div>
                    </>
                  )}
                </div>
              )}

              <ul className="email-list">
                {emails.length > 0 ? (
                  (() => {
                    const startIdx = Math.max(0, currentIndex - 2);
                    const endIdx = Math.min(emails.length, startIdx + 9);
                    
                    return emails.slice(startIdx, endIdx).map((email, idx) => (
                      <li key={startIdx + idx} className={`email-item ${startIdx + idx === currentIndex ? 'highlight' : ''}`}>
                        <div className="email-item-content">
                          <span className="read-status">{email.read_status ? ' ' : '► '}</span>
                          <span className="sender">{email.senderName}</span>
                          <span className="received">{`<${email.received}>`}</span>
                        </div>
                      </li>
                    ));
                  })()
                ) : (
                  <li className="email-item">No emails to display</li>
                )}
              </ul>

              {showConfirmModal && (
                <div className="reply-modal">
                  <p>What would you like to do with your reply?</p>
                  <p className="reply-modal-options">
                    ESC - discard · ENTER - send · SPACE - keep editing
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {showTrainingComplete && (
          <div className="reply-modal">
            <p>Training queued.</p>
            <p className="reply-modal-options">Press ENTER to return to Plain mode</p>
          </div>
        )}
      </div>
    );
  }

  // ... rest of your existing authenticated App JSX ...
}

export default App;
