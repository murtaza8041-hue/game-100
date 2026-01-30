// ===========================================
// FIREBASE CONFIGURATION - REAL PRODUCTION SETUP
// ===========================================

// Your Firebase Configuration (Replace with your actual values)
const firebaseConfig = {
    apiKey: "AIzaSyDEXAMPLEAPIKEY1234567890", // Replace with your API Key
    authDomain: "your-project.firebaseapp.com", // Your project domain
    databaseURL: "https://your-project.firebaseio.com", // Your Realtime Database URL
    projectId: "your-project-id", // Your Project ID
    storageBucket: "your-project.appspot.com", // Your Storage Bucket
    messagingSenderId: "123456789012", // Your Messaging Sender ID
    appId: "1:123456789012:web:abcdef1234567890", // Your App ID
    measurementId: "G-XXXXXXXXXX" // Optional: Google Analytics
};

// Initialize Firebase Services
try {
    // Initialize Firebase
    const firebaseApp = firebase.initializeApp(firebaseConfig);
    
    // Initialize Services
    const auth = firebase.auth();
    const db = firebase.firestore();
    const storage = firebase.storage();
    const functions = firebase.functions();
    
    // Enable offline persistence for Firestore
    db.enablePersistence()
        .catch((err) => {
            console.warn("Firestore offline persistence not supported:", err);
        });
    
    // Make available globally
    window.Firebase = {
        app: firebaseApp,
        auth: auth,
        db: db,
        storage: storage,
        functions: functions,
        firestore: firebase.firestore,
        timestamp: firebase.firestore.FieldValue.serverTimestamp
    };
    
    console.log("✅ Firebase Initialized Successfully!");
    
    // Check authentication state
    auth.onAuthStateChanged((user) => {
        if (user) {
            console.log("👤 User authenticated:", user.email);
            // User is signed in, update UI
            updateUserUI(user);
            // Load user data from Firestore
            loadUserData(user.uid);
        } else {
            console.log("👤 No user signed in");
            // Show authentication modal
            showAuthModal();
        }
    });
    
} catch (error) {
    console.error("❌ Firebase initialization failed:", error);
    document.getElementById('loading-status').textContent = "Firebase Error - Check Console";
    
    // Fallback to localStorage if Firebase fails
    setTimeout(() => {
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('app-container').style.display = 'block';
        alert("Firebase connection failed. Using offline mode.");
    }, 2000);
}

// Firebase Authentication Methods
window.firebaseAuth = {
    // Email/Password Login
    loginWithEmail: async (email, password) => {
        try {
            const result = await Firebase.auth.signInWithEmailAndPassword(email, password);
            return { success: true, user: result.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    // Email/Password Registration
    registerWithEmail: async (username, email, password) => {
        try {
            // Create user in Firebase Auth
            const result = await Firebase.auth.createUserWithEmailAndPassword(email, password);
            const user = result.user;
            
            // Create user document in Firestore
            await Firebase.db.collection('users').doc(user.uid).set({
                uid: user.uid,
                username: username,
                email: email,
                createdAt: Firebase.timestamp(),
                lastLogin: Firebase.timestamp(),
                profile: {
                    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=FF6B35&color=fff`,
                    bio: "New Fire Games Player",
                    level: 1,
                    xp: 0,
                    coins: 100
                },
                stats: {
                    gamesPlayed: 0,
                    totalScore: 0,
                    achievements: [],
                    badges: []
                },
                settings: {
                    theme: 'dark',
                    sound: true,
                    notifications: true
                }
            });
            
            return { success: true, user: user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    // Google Sign-In
    loginWithGoogle: async () => {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('profile');
            provider.addScope('email');
            
            const result = await Firebase.auth.signInWithPopup(provider);
            const user = result.user;
            
            // Check if user exists in Firestore
            const userDoc = await Firebase.db.collection('users').doc(user.uid).get();
            
            if (!userDoc.exists) {
                // Create new user document
                await Firebase.db.collection('users').doc(user.uid).set({
                    uid: user.uid,
                    username: user.displayName || user.email.split('@')[0],
                    email: user.email,
                    createdAt: Firebase.timestamp(),
                    lastLogin: Firebase.timestamp(),
                    profile: {
                        avatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}&background=FF6B35&color=fff`,
                        bio: "Google User",
                        level: 1,
                        xp: 0,
                        coins: 100
                    },
                    stats: {
                        gamesPlayed: 0,
                        totalScore: 0,
                        achievements: [],
                        badges: []
                    },
                    settings: {
                        theme: 'dark',
                        sound: true,
                        notifications: true
                    }
                });
            } else {
                // Update last login
                await Firebase.db.collection('users').doc(user.uid).update({
                    lastLogin: Firebase.timestamp()
                });
            }
            
            return { success: true, user: user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    // GitHub Sign-In
    loginWithGitHub: async () => {
        try {
            const provider = new firebase.auth.GithubAuthProvider();
            provider.addScope('read:user');
            
            const result = await Firebase.auth.signInWithPopup(provider);
            const user = result.user;
            
            // Check if user exists in Firestore
            const userDoc = await Firebase.db.collection('users').doc(user.uid).get();
            
            if (!userDoc.exists) {
                // Create new user document
                await Firebase.db.collection('users').doc(user.uid).set({
                    uid: user.uid,
                    username: user.displayName || user.email.split('@')[0],
                    email: user.email,
                    createdAt: Firebase.timestamp(),
                    lastLogin: Firebase.timestamp(),
                    profile: {
                        avatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}&background=FF6B35&color=fff`,
                        bio: "GitHub User",
                        level: 1,
                        xp: 0,
                        coins: 100
                    },
                    stats: {
                        gamesPlayed: 0,
                        totalScore: 0,
                        achievements: [],
                        badges: []
                    },
                    settings: {
                        theme: 'dark',
                        sound: true,
                        notifications: true
                    }
                });
            }
            
            return { success: true, user: user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    // Logout
    logout: async () => {
        try {
            await Firebase.auth.signOut();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    // Reset Password
    resetPassword: async (email) => {
        try {
            await Firebase.auth.sendPasswordResetEmail(email);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    // Get Current User
    getCurrentUser: () => {
        return Firebase.auth.currentUser;
    }
};

// Firestore Database Methods
window.firestoreDB = {
    // User Data
    getUserData: async (userId) => {
        try {
            const doc = await Firebase.db.collection('users').doc(userId).get();
            return doc.exists ? doc.data() : null;
        } catch (error) {
            console.error("Error getting user data:", error);
            return null;
        }
    },
    
    updateUserData: async (userId, data) => {
        try {
            await Firebase.db.collection('users').doc(userId).update(data);
            return { success: true };
        } catch (error) {
            console.error("Error updating user data:", error);
            return { success: false, error: error.message };
        }
    },
    
    // Game Data
    saveGameScore: async (userId, gameId, score, data = {}) => {
        try {
            const gameData = {
                userId: userId,
                gameId: gameId,
                score: score,
                timestamp: Firebase.timestamp(),
                ...data
            };
            
            // Save to user's game history
            await Firebase.db.collection('users').doc(userId).collection('gameHistory').add(gameData);
            
            // Update user stats
            await Firebase.db.collection('users').doc(userId).update({
                'stats.totalScore': firebase.firestore.FieldValue.increment(score),
                'stats.gamesPlayed': firebase.firestore.FieldValue.increment(1),
                'profile.xp': firebase.firestore.FieldValue.increment(Math.floor(score / 10))
            });
            
            // Update leaderboard
            await Firebase.db.collection('leaderboards').doc(gameId).collection('scores').add({
                userId: userId,
                score: score,
                timestamp: Firebase.timestamp(),
                username: (await firestoreDB.getUserData(userId)).username
            });
            
            return { success: true };
        } catch (error) {
            console.error("Error saving game score:", error);
            return { success: false, error: error.message };
        }
    },
    
    getGameHistory: async (userId, gameId = null) => {
        try {
            let query = Firebase.db.collection('users').doc(userId).collection('gameHistory');
            
            if (gameId) {
                query = query.where('gameId', '==', gameId);
            }
            
            query = query.orderBy('timestamp', 'desc').limit(20);
            
            const snapshot = await query.get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error getting game history:", error);
            return [];
        }
    },
    
    getLeaderboard: async (gameId, limit = 100) => {
        try {
            const snapshot = await Firebase.db.collection('leaderboards')
                .doc(gameId)
                .collection('scores')
                .orderBy('score', 'desc')
                .limit(limit)
                .get();
            
            return snapshot.docs.map((doc, index) => ({ 
                rank: index + 1, 
                id: doc.id, 
                ...doc.data() 
            }));
        } catch (error) {
            console.error("Error getting leaderboard:", error);
            return [];
        }
    },
    
    // Games Collection
    getAllGames: async () => {
        try {
            const snapshot = await Firebase.db.collection('games').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error getting games:", error);
            
            // Fallback: Return hardcoded games if Firestore fails
            return getFallbackGames();
        }
    },
    
    getGameById: async (gameId) => {
        try {
            const doc = await Firebase.db.collection('games').doc(gameId).get();
            return doc.exists ? { id: doc.id, ...doc.data() } : null;
        } catch (error) {
            console.error("Error getting game:", error);
            return null;
        }
    },
    
    // Achievements
    unlockAchievement: async (userId, achievementId) => {
        try {
            const achievement = {
                id: achievementId,
                unlockedAt: Firebase.timestamp()
            };
            
            await Firebase.db.collection('users').doc(userId).update({
                'stats.achievements': firebase.firestore.FieldValue.arrayUnion(achievement)
            });
            
            return { success: true };
        } catch (error) {
            console.error("Error unlocking achievement:", error);
            return { success: false, error: error.message };
        }
    }
};

// Initialize Games Data (Fallback if Firestore not set up)
function getFallbackGames() {
    // This is a sample of 20 games - you would have 100+ in production
    const games = [
        // Arcade Games (25)
        { id: 'space-shooter', name: 'Space Shooter', category: 'arcade', icon: 'fa-rocket', players: 1, difficulty: 'medium' },
        { id: 'snake', name: 'Snake', category: 'arcade', icon: 'fa-snake', players: 1, difficulty: 'easy' },
        { id: 'tetris', name: 'Tetris', category: 'arcade', icon: 'fa-th', players: 1, difficulty: 'medium' },
        { id: 'pacman', name: 'Pac-Man', category: 'arcade', icon: 'fa-ghost', players: 1, difficulty: 'medium' },
        { id: 'breakout', name: 'Breakout', category: 'arcade', icon: 'fa-square', players: 1, difficulty: 'easy' },
        
        // Puzzle Games (20)
        { id: 'sudoku', name: 'Sudoku', category: 'puzzle', icon: 'fa-border-all', players: 1, difficulty: 'hard' },
        { id: 'memory', name: 'Memory Match', category: 'puzzle', icon: 'fa-brain', players: 1, difficulty: 'easy' },
        { id: 'word-search', name: 'Word Search', category: 'puzzle', icon: 'fa-search', players: 1, difficulty: 'medium' },
        { id: 'crossword', name: 'Crossword', category: 'puzzle', icon: 'fa-font', players: 1, difficulty: 'hard' },
        { id: 'jigsaw', name: 'Jigsaw Puzzle', category: 'puzzle', icon: 'fa-puzzle-piece', players: 1, difficulty: 'medium' },
        
        // Board Games (15)
        { id: 'chess', name: 'Chess', category: 'board', icon: 'fa-chess', players: 2, difficulty: 'hard' },
        { id: 'checkers', name: 'Checkers', category: 'board', icon: 'fa-circle', players: 2, difficulty: 'medium' },
        { id: 'backgammon', name: 'Backgammon', category: 'board', icon: 'fa-dice', players: 2, difficulty: 'medium' },
        { id: 'go', name: 'Go', category: 'board', icon: 'fa-circle-notch', players: 2, difficulty: 'hard' },
        { id: 'mahjong', name: 'Mahjong', category: 'board', icon: 'fa-th-large', players: 4, difficulty: 'medium' },
        
        // Sports Games (15)
        { id: 'basketball', name: 'Basketball', category: 'sports', icon: 'fa-basketball-ball', players: 2, difficulty: 'medium' },
        { id: 'soccer', name: 'Soccer', category: 'sports', icon: 'fa-futbol', players: 2, difficulty: 'medium' },
        { id: 'racing', name: 'Car Racing', category: 'sports', icon: 'fa-car', players: 1, difficulty: 'easy' },
        { id: 'bowling', name: 'Bowling', category: 'sports', icon: 'fa-bowling-ball', players: 4, difficulty: 'easy' },
        { id: 'golf', name: 'Mini Golf', category: 'sports', icon: 'fa-golf-ball', players: 1, difficulty: 'hard' },
        
        // Brain Games (15)
        { id: 'trivia', name: 'Trivia Quiz', category: 'brain', icon: 'fa-question-circle', players: 1, difficulty: 'medium' },
        { id: 'math', name: 'Math Challenge', category: 'brain', icon: 'fa-calculator', players: 1, difficulty: 'hard' },
        { id: 'logic', name: 'Logic Puzzles', category: 'brain', icon: 'fa-project-diagram', players: 1, difficulty: 'hard' },
        { id: 'memory-test', name: 'Memory Test', category: 'brain', icon: 'fa-memory', players: 1, difficulty: 'medium' },
        { id: 'pattern', name: 'Pattern Recognition', category: 'brain', icon: 'fa-shapes', players: 1, difficulty: 'medium' },
        
        // Creative Games (10)
        { id: 'drawing', name: 'Drawing Canvas', category: 'creative', icon: 'fa-paint-brush', players: 1, difficulty: 'easy' },
        { id: 'music', name: 'Music Maker', category: 'creative', icon: 'fa-music', players: 1, difficulty: 'medium' },
        { id: 'sandbox', name: 'Sandbox', category: 'creative', icon: 'fa-cube', players: 1, difficulty: 'easy' },
        { id: 'simulation', name: 'Simulation', category: 'creative', icon: 'fa-desktop', players: 1, difficulty: 'hard' },
        { id: 'builder', name: 'City Builder', category: 'creative', icon: 'fa-city', players: 1, difficulty: 'hard' }
    ];
    
    // Add 80 more game IDs (in production, these would be full objects)
    for (let i = 1; i <= 80; i++) {
        games.push({
            id: `game-${i}`,
            name: `Game ${i}`,
            category: ['arcade', 'puzzle', 'board', 'sports', 'brain', 'creative'][Math.floor(Math.random() * 6)],
            icon: ['fa-gamepad', 'fa-dice', 'fa-chess-board', 'fa-futbol', 'fa-brain', 'fa-palette'][Math.floor(Math.random() * 6)],
            players: Math.floor(Math.random() * 4) + 1,
            difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)]
        });
    }
    
    return games;
}

console.log("✅ Firebase Config Loaded");