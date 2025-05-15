// Firebase configuration - Replace with your actual config
const firebaseConfig = {
  apiKey: "AIzaSyAx0MAEUiYCGq-fY1OI-nOYR4-uRXh43ws",
  authDomain: "tracker-6f5af.firebaseapp.com",
  databaseURL: "https://tracker-6f5af-default-rtdb.firebaseio.com",
  projectId: "tracker-6f5af",
  storageBucket: "tracker-6f5af.firebasestorage.app",
  messagingSenderId: "311345597895",
  appId: "1:311345597895:web:34bcaecc4403985d45dde2"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const loadingScreen = document.getElementById('loadingScreen');
const appContainer = document.getElementById('appContainer');
const authMessage = document.getElementById('authMessage');
const timerSection = document.getElementById('timerSection');
const statsSection = document.getElementById('statsSection');
const chartSection = document.getElementById('chartSection');
const subjectSelect = document.getElementById('subjectSelect');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const timerDisplay = document.getElementById('timerDisplay');
const statsGrid = document.getElementById('statsGrid');
const shareCodeSpan = document.getElementById('shareCode');
const authButtons = document.getElementById('authButtons');
const userMenu = document.getElementById('userMenu');
const userEmail = document.getElementById('userEmail');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const logoutBtn = document.getElementById('logoutBtn');
const addSubjectBtn = document.getElementById('addSubjectBtn');
const viewSharedBtn = document.getElementById('viewSharedBtn');
const shareCodeBtn = document.getElementById('shareCodeBtn');

// Modal elements
const loginModal = document.getElementById('loginModal');
const signupModal = document.getElementById('signupModal');
const viewStatsModal = document.getElementById('viewStatsModal');
const addSubjectModal = document.getElementById('addSubjectModal');
const closeLoginModal = document.getElementById('closeLoginModal');
const closeSignupModal = document.getElementById('closeSignupModal');
const closeViewStatsModal = document.getElementById('closeViewStatsModal');
const closeAddSubjectModal = document.getElementById('closeAddSubjectModal');
const loginSubmit = document.getElementById('loginSubmit');
const signupSubmit = document.getElementById('signupSubmit');
const viewStatsSubmit = document.getElementById('viewStatsSubmit');
const addSubjectSubmit = document.getElementById('addSubjectSubmit');
const loginMessage = document.getElementById('loginMessage');
const signupMessage = document.getElementById('signupMessage');
const viewStatsMessage = document.getElementById('viewStatsMessage');
const newSubjectName = document.getElementById('newSubjectName');
const subjectColor = document.getElementById('subjectColor');
const chartTypeSelect = document.getElementById('chartTypeSelect');

// Timer variables
let timerInterval;
let startTime;
let currentSubject = '';
let studyChart = null;

// Initialize the app
function init() {
    // Set up event listeners
    setupEventListeners();
    
    // Check auth state
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in
            showAppContent(user);
            loadUserData(user.uid);
        } else {
            // No user signed in
            showAuthContent();
            // Show view stats modal if there's a share code in URL
            const urlParams = new URLSearchParams(window.location.search);
            const shareCode = urlParams.get('share');
            if (shareCode) {
                showModal(viewStatsModal);
                document.getElementById('shareCodeInput').value = shareCode;
            }
        }
        
        // Hide loading screen and show app
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            appContainer.classList.add('loaded');
        }, 500);
    });
}

function setupEventListeners() {
    // Timer events
    startBtn.addEventListener('click', startTimer);
    stopBtn.addEventListener('click', stopTimer);
    
    // Auth events
    loginBtn.addEventListener('click', () => showModal(loginModal));
    signupBtn.addEventListener('click', () => showModal(signupModal));
    logoutBtn.addEventListener('click', handleLogout);
    
    // Modal events
    closeLoginModal.addEventListener('click', () => hideModal(loginModal));
    closeSignupModal.addEventListener('click', () => hideModal(signupModal));
    closeViewStatsModal.addEventListener('click', () => hideModal(viewStatsModal));
    closeAddSubjectModal.addEventListener('click', () => hideModal(addSubjectModal));
    loginSubmit.addEventListener('click', handleLogin);
    signupSubmit.addEventListener('click', handleSignup);
    viewStatsSubmit.addEventListener('click', handleViewStats);
    addSubjectSubmit.addEventListener('click', handleAddSubject);
    
    // Other events
    shareCodeBtn.addEventListener('click', copyShareCode);
    addSubjectBtn.addEventListener('click', () => showModal(addSubjectModal));
    viewSharedBtn.addEventListener('click', () => showModal(viewStatsModal));
    chartTypeSelect.addEventListener('change', updateChartType);
}

// Show app content when user is logged in
function showAppContent(user) {
    authMessage.innerHTML = `<span class="success">Welcome back, ${user.email}!</span>`;
    authButtons.style.display = 'none';
    userMenu.style.display = 'flex';
    userEmail.textContent = user.email;
    timerSection.style.display = 'block';
    statsSection.style.display = 'block';
    chartSection.style.display = 'block';
}

// Show auth content when no user is logged in
function showAuthContent() {
    authMessage.innerHTML = 'Please login or sign up to track your study time.';
    authButtons.style.display = 'flex';
    userMenu.style.display = 'none';
    timerSection.style.display = 'none';
    statsSection.style.display = 'none';
    chartSection.style.display = 'none';
}

// Load user data from Firestore
function loadUserData(userId) {
    db.collection('users').doc(userId).get()
        .then(doc => {
            if (doc.exists) {
                const userData = doc.data();
                shareCodeSpan.textContent = userData.shareCode || generateShareCode();
                populateSubjectSelect(userData.subjects || [
                    { name: 'Math', color: '#4361ee' },
                    { name: 'Science', color: '#4cc9f0' },
                    { name: 'History', color: '#f8961e' },
                    { name: 'English', color: '#f72585' },
                    { name: 'Programming', color: '#7209b7' }
                ]);
                updateStatsDisplay(userData);
                updateStudyChart(userData);
            } else {
                // Create new user document with default subjects
                const shareCode = generateShareCode();
                const defaultSubjects = [
                    { name: 'Math', color: '#4361ee' },
                    { name: 'Science', color: '#4cc9f0' },
                    { name: 'History', color: '#f8961e' },
                    { name: 'English', color: '#f72585' },
                    { name: 'Programming', color: '#7209b7' }
                ];
                
                db.collection('users').doc(userId).set({
                    shareCode: shareCode,
                    subjects: defaultSubjects,
                    stats: {},
                    sessions: []
                });
                
                shareCodeSpan.textContent = shareCode;
                populateSubjectSelect(defaultSubjects);
            }
        })
        .catch(error => {
            console.error("Error loading user data:", error);
            showMessage(authMessage, "Error loading data", 'error');
        });
}

// Populate subject select dropdown
function populateSubjectSelect(subjects) {
    subjectSelect.innerHTML = '<option value="">Select a subject</option>';
    
    subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject.name;
        option.textContent = subject.name;
        option.style.color = subject.color;
        subjectSelect.appendChild(option);
    });
}

// Timer functions
function startTimer() {
    currentSubject = subjectSelect.value;
    if (!currentSubject) {
        showMessage(authMessage, "Please select a subject first", 'error');
        return;
    }
    
    startTime = new Date();
    startBtn.style.display = 'none';
    stopBtn.style.display = 'block';
    subjectSelect.disabled = true;
    
    // Update timer display immediately and then every second
    updateTimerDisplay();
    timerInterval = setInterval(updateTimerDisplay, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    const endTime = new Date();
    const duration = Math.floor((endTime - startTime) / 1000); // in seconds
    
    // Get current user
    const user = auth.currentUser;
    if (!user) return;
    
    // Prepare session data
    const sessionData = {
        subject: currentSubject,
        start: startTime,
        end: endTime,
        duration: duration
    };
    
    // Save the session to Firestore
    db.collection('users').doc(user.uid).update({
        sessions: firebase.firestore.FieldValue.arrayUnion(sessionData),
        [`stats.${currentSubject}.totalTime`]: firebase.firestore.FieldValue.increment(duration),
        [`stats.${currentSubject}.sessions`]: firebase.firestore.FieldValue.increment(1)
    })
    .then(() => {
        // Update UI
        startBtn.style.display = 'block';
        stopBtn.style.display = 'none';
        subjectSelect.disabled = false;
        resetTimerDisplay();
        
        // Reload user data to update stats
        loadUserData(user.uid);
    })
    .catch(error => {
        console.error("Error saving session:", error);
        showMessage(authMessage, "Error saving session", 'error');
    });
}

function updateTimerDisplay() {
    const now = new Date();
    const elapsed = new Date(now - startTime);
    
    const hours = String(elapsed.getUTCHours()).padStart(2, '0');
    const minutes = String(elapsed.getUTCMinutes()).padStart(2, '0');
    const seconds = String(elapsed.getUTCSeconds()).padStart(2, '0');
    
    const [hoursSpan, minutesSpan, secondsSpan] = timerDisplay.children;
    hoursSpan.textContent = hours;
    minutesSpan.textContent = minutes;
    secondsSpan.textContent = seconds;
}

function resetTimerDisplay() {
    const [hoursSpan, minutesSpan, secondsSpan] = timerDisplay.children;
    hoursSpan.textContent = '00';
    minutesSpan.textContent = '00';
    secondsSpan.textContent = '00';
}

// Stats functions
function updateStatsDisplay(userData) {
    statsGrid.innerHTML = '';
    
    // If no data yet
    if (!userData.sessions || userData.sessions.length === 0) {
        statsGrid.innerHTML = `
            <div class="stat-card" style="grid-column: 1/-1; text-align: center;">
                <div class="stat-value">0</div>
                <div class="stat-label">No study sessions yet</div>
                <small>Start a session to see your stats</small>
            </div>
        `;
        return;
    }
    
    // Calculate today's time
    const today = new Date().toDateString();
    const todaySessions = userData.sessions.filter(session => 
        new Date(session.start).toDateString() === today
    );
    const todayTime = todaySessions.reduce((total, session) => total + session.duration, 0);
    
    // Today's stats card
    statsGrid.appendChild(createStatCard('Today', formatTime(todayTime), 'Total study time today'));
    
    // All-time stats
    let allTime = 0;
    if (userData.stats) {
        for (const subject in userData.stats) {
            allTime += userData.stats[subject].totalTime || 0;
        }
    }
    statsGrid.appendChild(createStatCard('All Time', formatTime(allTime), 'Total study time'));
    
    // By subject stats
    if (userData.stats) {
        for (const subject in userData.stats) {
            const stat = userData.stats[subject];
            statsGrid.appendChild(createStatCard(
                subject,
                formatTime(stat.totalTime),
                `${stat.sessions} sessions`
            ));
        }
    }
}

function createStatCard(title, value, description) {
    const card = document.createElement('div');
    card.className = 'stat-card';
    card.innerHTML = `
        <div class="stat-value">${value}</div>
        <div class="stat-label">${title}</div>
        <small>${description}</small>
    `;
    return card;
}

// Chart functions
function updateStudyChart(userData) {
    const ctx = document.getElementById('studyChart').getContext('2d');
    
    // Prepare data for chart
    const subjects = [];
    const studyTimes = [];
    const sessionCounts = [];
    const backgroundColors = [];
    
    if (userData.subjects && userData.stats) {
        userData.subjects.forEach(subject => {
            if (userData.stats[subject.name]) {
                subjects.push(subject.name);
                studyTimes.push(userData.stats[subject.name].totalTime / 3600); // Convert to hours
                sessionCounts.push(userData.stats[subject.name].sessions);
                backgroundColors.push(subject.color);
            }
        });
    }
    
    // Destroy previous chart if exists
    if (studyChart) {
        studyChart.destroy();
    }
    
    const chartType = chartTypeSelect.value;
    
    studyChart = new Chart(ctx, {
        type: chartType,
        data: {
            labels: subjects,
            datasets: [
                {
                    label: 'Study Hours',
                    data: studyTimes,
                    backgroundColor: backgroundColors,
                    borderColor: backgroundColors.map(color => `${color}cc`),
                    borderWidth: 1,
                    yAxisID: 'y'
                },
                chartType === 'bar' ? {
                    label: 'Session Count',
                    data: sessionCounts,
                    backgroundColor: backgroundColors.map(color => `${color}66`),
                    borderColor: backgroundColors.map(color => `${color}cc`),
                    borderWidth: 1,
                    type: 'line',
                    yAxisID: 'y1'
                } : null
            ].filter(Boolean)
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Study Time by Subject',
                    font: {
                        size: 16
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (context.dataset.label === 'Study Hours') {
                                const hours = context.raw;
                                const minutes = (hours % 1) * 60;
                                return `${context.dataset.label}: ${Math.floor(hours)}h ${Math.round(minutes)}m`;
                            }
                            return `${context.dataset.label}: ${context.raw}`;
                        }
                    }
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        padding: 20
                    }
                }
            },
            scales: chartType === 'bar' ? {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Study Hours'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Session Count'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            } : undefined
        }
    });
}

function updateChartType() {
    const user = auth.currentUser;
    if (user) {
        loadUserData(user.uid);
    }
}

// Subject management
function handleAddSubject() {
    const subjectName = newSubjectName.value.trim();
    const color = subjectColor.value;
    
    if (!subjectName) {
        showMessage(document.getElementById('addSubjectModal').querySelector('.modal-body'), "Please enter a subject name", 'error');
        return;
    }
    
    const user = auth.currentUser;
    if (!user) return;
    
    const newSubject = {
        name: subjectName,
        color: color
    };
    
    // Add subject to user's list
    db.collection('users').doc(user.uid).update({
        subjects: firebase.firestore.FieldValue.arrayUnion(newSubject)
    })
    .then(() => {
        hideModal(addSubjectModal);
        showMessage(authMessage, `"${subjectName}" added to your subjects!`, 'success');
        loadUserData(user.uid);
        newSubjectName.value = '';
    })
    .catch(error => {
        console.error("Error adding subject:", error);
        showMessage(document.getElementById('addSubjectModal').querySelector('.modal-body'), "Error adding subject", 'error');
    });
}

// Auth functions
function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showMessage(loginMessage, "Please fill in all fields", 'error');
        return;
    }
    
    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            hideModal(loginModal);
        })
        .catch(error => {
            console.error("Login error:", error);
            showMessage(loginMessage, error.message, 'error');
        });
}

function handleSignup() {
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    
    if (!name || !email || !password) {
        showMessage(signupMessage, "Please fill in all fields", 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage(signupMessage, "Password must be at least 6 characters", 'error');
        return;
    }
    
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Create user document in Firestore
            const shareCode = generateShareCode();
            const defaultSubjects = [
                { name: 'Math', color: '#4361ee' },
                { name: 'Science', color: '#4cc9f0' },
                { name: 'History', color: '#f8961e' },
                { name: 'English', color: '#f72585' },
                { name: 'Programming', color: '#7209b7' }
            ];
            
            return db.collection('users').doc(userCredential.user.uid).set({
                name: name,
                email: email,
                shareCode: shareCode,
                subjects: defaultSubjects,
                stats: {},
                sessions: []
            });
        })
        .then(() => {
            hideModal(signupModal);
        })
        .catch(error => {
            console.error("Signup error:", error);
            showMessage(signupMessage, error.message, 'error');
        });
}

function handleLogout() {
    auth.signOut()
        .catch(error => {
            console.error("Logout error:", error);
            showMessage(authMessage, error.message, 'error');
        });
}

function handleViewStats() {
    const shareCode = document.getElementById('shareCodeInput').value.trim();
    
    if (!shareCode) {
        showMessage(viewStatsMessage, "Please enter a share code", 'error');
        return;
    }
    
    // Find user with this share code
    db.collection('users').where('shareCode', '==', shareCode).get()
        .then(querySnapshot => {
            if (querySnapshot.empty) {
                showMessage(viewStatsMessage, "Invalid share code", 'error');
                return;
            }
            
            // Get the user document
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();
            
            // Update UI to show shared stats
            hideModal(viewStatsModal);
            authMessage.innerHTML = `<span class="success">Viewing stats shared by ${userData.email || 'a user'}</span>`;
            statsSection.style.display = 'block';
            chartSection.style.display = 'block';
            updateStatsDisplay(userData);
            updateStudyChart(userData);
            
            // Update URL with share code
            window.history.pushState({}, '', `?share=${shareCode}`);
        })
        .catch(error => {
            console.error("Error viewing stats:", error);
            showMessage(viewStatsMessage, "Error loading shared stats", 'error');
        });
}

// Helper functions
function formatTime(seconds) {
    if (!seconds) return "00:00:00";
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function generateShareCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function copyShareCode() {
    navigator.clipboard.writeText(shareCodeSpan.textContent)
        .then(() => {
            const originalText = shareCodeBtn.innerHTML;
            shareCodeBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            setTimeout(() => {
                shareCodeBtn.innerHTML = originalText;
            }, 2000);
        })
        .catch(err => {
            console.error('Could not copy text: ', err);
        });
}

function showModal(modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function hideModal(modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    // Clear messages and inputs
    const modalBody = modal.querySelector('.modal-body');
    if (modalBody) {
        const message = modalBody.querySelector('.message');
        if (message) message.innerHTML = '';
    }
    
    if (modal === loginModal) {
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
    } else if (modal === signupModal) {
        document.getElementById('signupName').value = '';
        document.getElementById('signupEmail').value = '';
        document.getElementById('signupPassword').value = '';
    } else if (modal === addSubjectModal) {
        document.getElementById('newSubjectName').value = '';
    }
}

function showMessage(element, message, type) {
    element.innerHTML = `<div class="message ${type}">${message}</div>`;
}

// Initialize the app when DOM is loaded
setTimeout(() => {
    document.getElementById('appContainer').style.display = 'block';
    init();
}, 0);
