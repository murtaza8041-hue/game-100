// ===========================================
// FIRE GAMES - MAIN APPLICATION SCRIPT
// ===========================================

class FireGamesApp {
    constructor() {
        this.currentUser = null;
        this.userData = null;
        this.allGames = [];
        this.filteredGames = [];
        this.currentGame = null;
        
        // Initialize when DOM is ready
        document.addEventListener('DOMContentLoaded', () => {
            this.initialize();
        });
    }
    
    async initialize() {
        console.log("🎮 Fire Games App Initializing...");
        
        // Update loading status
        document.getElementById('loading-status').textContent = "Checking Authentication...";
        
        // Check if Firebase is loaded
        if (!window.Firebase) {
            document.getElementById('loading-status').textContent = "Firebase not loaded. Check configuration.";
            setTimeout(() => {
                this.showOfflineMode();
            }, 3000);
            return;
        }
        
        // Wait for auth state
        setTimeout(async () => {
            // If no user after 3 seconds, show auth modal
            if (!Firebase.auth.currentUser) {
                document.getElementById('loading-screen').style.display = 'none';
                document.getElementById('app-container').style.display = 'block';
                this.showAuthModal();
            }
            
            // Load games
            await this.loadGames();
            
            // Setup event listeners
            this.setupEventListeners();
            
            console.log("✅ Fire Games App Ready!");
        }, 3000);
    }
    
    showOfflineMode() {
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('app-container').style.display = 'block';
        
        // Show offline warning
        const alertDiv = document.createElement('div');
        alertDiv.className = 'fire-alert';
        alertDiv.innerHTML = `
            <i class="fas fa-wifi-slash me-2"></i>
            <strong>Offline Mode</strong> - Firebase not connected. Using demo games.
        `;
        document.querySelector('.container').prepend(alertDiv);
        
        // Load demo games
        this.loadDemoGames();
        this.setupEventListeners();
    }
    
    async loadGames() {
        document.getElementById('loading-status').textContent = "Loading 100+ Games...";
        
        try {
            // Try to load games from Firestore
            this.allGames = await firestoreDB.getAllGames();
            
            if (this.allGames.length === 0) {
                // If no games in Firestore, use fallback
                this.allGames = getFallbackGames();
                console.log("Using fallback games:", this.allGames.length);
            }
            
            this.filteredGames = [...this.allGames];
            
            // Update UI
            this.updateGamesUI();
            
        } catch (error) {
            console.error("Error loading games:", error);
            this.allGames = getFallbackGames();
            this.filteredGames = [...this.allGames];
            this.updateGamesUI();
        }
    }
    
    loadDemoGames() {
        this.allGames = getFallbackGames();
        this.filteredGames = [...this.allGames];
        this.updateGamesUI();
    }
    
    updateGamesUI() {
        // Clear existing games
        const containers = ['featured-games', 'all-games', 'recent-games'];
        containers.forEach(id => {
            const container = document.getElementById(id);
            if (container) container.innerHTML = '';
        });
        
        // Display featured games (first 6)
        const featured = this.allGames.slice(0, 6);
        featured.forEach(game => {
            this.createGameCard(game, 'featured-games');
        });
        
        // Display all games
        this.allGames.forEach(game => {
            this.createGameCard(game, 'all-games');
        });
        
        // Group games by category
        this.displayGamesByCategory();
        
        // Update game count
        document.getElementById('games-loaded-count').textContent = this.allGames.length;
    }
    
    createGameCard(game, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const card = document.createElement('div');
        card.className = 'fire-card game-card p-3';
        card.dataset.gameId = game.id;
        
        card.innerHTML = `
            <div class="text-center">
                <div class="game-icon">
                    <i class="fas ${game.icon || 'fa-gamepad'}"></i>
                </div>
                <div class="game-title">${game.name}</div>
                <div class="game-category-badge">
                    <small class="badge bg-secondary">${game.category || 'Arcade'}</small>
                </div>
            </div>
            <div class="game-stats">
                <div class="d-flex justify-content-between">
                    <span><i class="fas fa-user"></i> ${game.players || 1}</span>
                    <span><i class="fas fa-signal"></i> ${game.difficulty || 'Medium'}</span>
                </div>
            </div>
        `;
        
        card.addEventListener('click', () => {
            this.showGameModal(game);
        });
        
        container.appendChild(card);
    }
    
    displayGamesByCategory() {
        const categories = {};
        
        // Group games by category
        this.allGames.forEach(game => {
            const category = game.category || 'arcade';
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(game);
        });
        
        // Display categories
        const container = document.getElementById('game-categories');
        container.innerHTML = '';
        
        Object.keys(categories).forEach(category => {
            const categoryDiv = document.createElement('div');
            
            // Capitalize category name
            const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
            
            categoryDiv.innerHTML = `
                <h3 class="game-category">
                    <i class="fas fa-${this.getCategoryIcon(category)} me-2"></i>
                    ${categoryName.toUpperCase()} (${categories[category].length} games)
                </h3>
                <div class="games-grid" id="category-${category}">
                    <!-- Games will be added here -->
                </div>
            `;
            
            container.appendChild(categoryDiv);
            
            // Add first 4 games from this category
            const categoryGames = categories[category].slice(0, 4);
            const gamesContainer = document.getElementById(`category-${category}`);
            
            categoryGames.forEach(game => {
                this.createGameCard(game, `category-${category}`);
            });
        });
    }
    
    getCategoryIcon(category) {
        const icons = {
            'arcade': 'gamepad',
            'puzzle': 'puzzle-piece',
            'board': 'chess-board',
            'sports': 'futbol',
            'brain': 'brain',
            'creative': 'palette',
            'action': 'fist-raised',
            'strategy': 'chess',
            'adventure': 'map',
            'racing': 'car',
            'shooter': 'crosshairs',
            'simulation': 'desktop'
        };
        return icons[category] || 'gamepad';
    }
    
    async showGameModal(game) {
        this.currentGame = game;
        
        // Update modal content
        document.getElementById('gameModalTitle').textContent = game.name;
        document.getElementById('game-description').textContent = 
            game.description || `A fun ${game.category} game. Play now and beat your high score!`;
        
        document.getElementById('game-category').textContent = game.category || 'Arcade';
        document.getElementById('game-category').className = `badge bg-${this.getCategoryColor(game.category)}`;
        
        // Load user's high score
        if (this.currentUser) {
            const history = await firestoreDB.getGameHistory(this.currentUser.uid, game.id);
            if (history.length > 0) {
                const highScore = Math.max(...history.map(h => h.score || 0));
                document.getElementById('game-high-score').textContent = highScore.toLocaleString();
            }
            
            // Load leaderboard rank
            const leaderboard = await firestoreDB.getLeaderboard(game.id, 10);
            const userRank = leaderboard.findIndex(entry => entry.userId === this.currentUser.uid);
            if (userRank !== -1) {
                document.getElementById('game-rank').textContent = `#${userRank + 1}`;
            }
        }
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('gameModal'));
        modal.show();
    }
    
    getCategoryColor(category) {
        const colors = {
            'arcade': 'danger',
            'puzzle': 'info',
            'board': 'warning',
            'sports': 'success',
            'brain': 'primary',
            'creative': 'purple'
        };
        return colors[category] || 'secondary';
    }
    
    showAuthModal() {
        const modal = new bootstrap.Modal(document.getElementById('authModal'));
        modal.show();
    }
    
    async loginWithEmail(email, password) {
        const result = await firebaseAuth.loginWithEmail(email, password);
        
        if (result.success) {
            this.currentUser = result.user;
            await this.loadUserData(result.user.uid);
            
            // Close modal
            bootstrap.Modal.getInstance(document.getElementById('authModal')).hide();
            
            // Show success message
            this.showAlert('success', `Welcome back, ${this.userData?.username || 'Player'}!`);
            
        } else {
            this.showAlert('danger', `Login failed: ${result.error}`);
        }
    }
    
    async registerWithEmail(username, email, password) {
        // Validate inputs
        if (password.length < 6) {
            this.showAlert('warning', 'Password must be at least 6 characters');
            return;
        }
        
        const result = await firebaseAuth.registerWithEmail(username, email, password);
        
        if (result.success) {
            this.currentUser = result.user;
            await this.loadUserData(result.user.uid);
            
            // Close modal
            bootstrap.Modal.getInstance(document.getElementById('authModal')).hide();
            
            // Show success message
            this.showAlert('success', `Account created! Welcome to Fire Games, ${username}!`);
            
        } else {
            this.showAlert('danger', `Registration failed: ${result.error}`);
        }
    }
    
    async loadUserData(userId) {
        try {
            this.userData = await firestoreDB.getUserData(userId);
            
            if (this.userData) {
                // Update UI with user data
                this.updateUserUI();
            }
        } catch (error) {
            console.error("Error loading user data:", error);
        }
    }
    
    updateUserUI() {
        if (!this.userData) return;
        
        // Update user name
        document.getElementById('user-name').textContent = this.userData.username || 'Player';
        
        // Update user avatar
        const avatar = document.getElementById('user-avatar');
        if (this.userData.profile?.avatar) {
            avatar.innerHTML = `<img src="${this.userData.profile.avatar}" style="width:100%;height:100%;border-radius:50%;" alt="Avatar">`;
        } else {
            avatar.innerHTML = `<i class="fas fa-user"></i>`;
        }
        
        // Update stats
        document.getElementById('games-played-count').textContent = 
            this.userData.stats?.gamesPlayed || 0;
        
        document.getElementById('total-score').textContent = 
            (this.userData.stats?.totalScore || 0).toLocaleString();
        
        document.getElementById('user-level').textContent = 
            this.userData.profile?.level || 1;
    }
    
    setupEventListeners() {
        // Auth form toggles
        document.getElementById('show-register')?.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('login-form').style.display = 'none';
            document.getElementById('register-form').style.display = 'block';
        });
        
        document.getElementById('show-login')?.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('register-form').style.display = 'none';
            document.getElementById('login-form').style.display = 'block';
        });
        
        // Login button
        document.getElementById('login-btn')?.addEventListener('click', () => {
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            if (!email || !password) {
                this.showAlert('warning', 'Please enter email and password');
                return;
            }
            
            this.loginWithEmail(email, password);
        });
        
        // Register button
        document.getElementById('register-btn')?.addEventListener('click', () => {
            const username = document.getElementById('register-username').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const confirm = document.getElementById('register-confirm').value;
            
            if (!username || !email || !password) {
                this.showAlert('warning', 'Please fill all fields');
                return;
            }
            
            if (password !== confirm) {
                this.showAlert('warning', 'Passwords do not match');
                return;
            }
            
            this.registerWithEmail(username, email, password);
        });
        
        // Google login
        document.getElementById('google-login')?.addEventListener('click', async () => {
            const result = await firebaseAuth.loginWithGoogle();
            
            if (result.success) {
                this.currentUser = result.user;
                await this.loadUserData(result.user.uid);
                
                bootstrap.Modal.getInstance(document.getElementById('authModal')).hide();
                this.showAlert('success', `Welcome, ${this.userData?.username || 'Google User'}!`);
            } else {
                this.showAlert('danger', `Google login failed: ${result.error}`);
            }
        });
        
        // GitHub login
        document.getElementById('github-login')?.addEventListener('click', async () => {
            const result = await firebaseAuth.loginWithGitHub();
            
            if (result.success) {
                this.currentUser = result.user;
                await this.loadUserData(result.user.uid);
                
                bootstrap.Modal.getInstance(document.getElementById('authModal')).hide();
                this.showAlert('success', `Welcome, ${this.userData?.username || 'GitHub User'}!`);
            } else {
                this.showAlert('danger', `GitHub login failed: ${result.error}`);
            }
        });
        
        // Logout
        document.getElementById('logout-link')?.addEventListener('click', async (e) => {
            e.preventDefault();
            
            const result = await firebaseAuth.logout();
            if (result.success) {
                this.currentUser = null;
                this.userData = null;
                this.updateUserUI();
                this.showAuthModal();
                this.showAlert('info', 'You have been logged out');
            }
        });
        
        // Play game button
        document.getElementById('play-game-btn')?.addEventListener('click', () => {
            if (!this.currentUser) {
                this.showAlert('warning', 'Please sign in to play games');
                this.showAuthModal();
                return;
            }
            
            if (this.currentGame) {
                this.launchGame(this.currentGame);
            }
        });
        
        // Search input
        document.getElementById('search-input')?.addEventListener('input', (e) => {
            this.searchGames(e.target.value);
        });
    }
    
    searchGames(query) {
        if (!query.trim()) {
            this.filteredGames = [...this.allGames];
            this.updateGamesUI();
            return;
        }
        
        const searchTerm = query.toLowerCase();
        this.filteredGames = this.allGames.filter(game => 
            game.name.toLowerCase().includes(searchTerm) ||
            (game.category && game.category.toLowerCase().includes(searchTerm)) ||
            (game.description && game.description.toLowerCase().includes(searchTerm))
        );
        
        // Update search results
        const container = document.getElementById('all-games');
        container.innerHTML = '';
        
        if (this.filteredGames.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-search fa-3x mb-3 text-muted"></i>
                    <h4>No games found for "${query}"</h4>
                    <p>Try a different search term</p>
                </div>
            `;
        } else {
            this.filteredGames.forEach(game => {
                this.createGameCard(game, 'all-games');
            });
        }
    }
    
    launchGame(game) {
        // Close modal
        bootstrap.Modal.getInstance(document.getElementById('gameModal')).hide();
        
        // Show game loading screen
        this.showAlert('info', `Loading ${game.name}...`);
        
        // In a real implementation, this would load the actual game
        // For now, we'll simulate loading and show a play area
        
        setTimeout(() => {
            // Create game iframe or canvas
            const gameContainer = document.createElement('div');
            gameContainer.className = 'game-container';
            gameContainer.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #000;
                z-index: 99999;
                display: flex;
                flex-direction: column;
            `;
            
            gameContainer.innerHTML = `
                <div class="game-header p-3" style="background: #1A1A2E; border-bottom: 2px solid #FF6B35;">
                    <div class="container d-flex justify-content-between align-items-center">
                        <h4 class="mb-0"><i class="fas fa-${game.icon} me-2"></i>${game.name}</h4>
                        <button class="btn btn-danger" id="close-game">
                            <i class="fas fa-times"></i> Exit Game
                        </button>
                    </div>
                </div>
                <div class="game-area flex-grow-1 d-flex align-items-center justify-content-center">
                    <div class="text-center">
                        <h1 class="display-1 mb-4">🎮</h1>
                        <h3 class="mb-3">${game.name}</h3>
                        <p class="text-muted mb-4">Game would load here in production</p>
                        <div class="row justify-content-center">
                            <div class="col-md-8">
                                <div class="fire-card p-4">
                                    <h5 class="mb-3">Simulated Gameplay</h5>
                                    <p>In a real implementation, this would be the actual game.</p>
                                    <p>For demo purposes, here's a simulated score:</p>
                                    <h2 class="text-warning" id="demo-score">0</h2>
                                    <button class="btn fire-btn mt-3" id="increase-score">
                                        <i class="fas fa-plus"></i> Increase Score
                                    </button>
                                    <button class="btn btn-success mt-3" id="save-score">
                                        <i class="fas fa-save"></i> Save Score to Cloud
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(gameContainer);
            
            // Game logic
            let score = 0;
            const scoreElement = document.getElementById('demo-score');
            
            document.getElementById('increase-score').addEventListener('click', () => {
                score += Math.floor(Math.random() * 100) + 10;
                scoreElement.textContent = score;
            });
            
            document.getElementById('save-score').addEventListener('click', async () => {
                if (this.currentUser) {
                    const result = await firestoreDB.saveGameScore(
                        this.currentUser.uid,
                        game.id,
                        score,
                        { duration: 60, level: 1 }
                    );
                    
                    if (result.success) {
                        this.showAlert('success', `Score ${score} saved to cloud!`);
                    } else {
                        this.showAlert('danger', `Failed to save: ${result.error}`);
                    }
                } else {
                    this.showAlert('warning', 'Sign in to save scores');
                }
            });
            
            document.getElementById('close-game').addEventListener('click', () => {
                document.body.removeChild(gameContainer);
                this.showAlert('info', `Exited ${game.name}`);
            });
        }, 1000);
    }
    
    showAlert(type, message) {
        // Remove existing alerts
        const existing = document.querySelector('.fire-alert');
        if (existing) existing.remove();
        
        // Create new alert
        const alert = document.createElement('div');
        alert.className = `fire-alert alert-${type}`;
        alert.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <span>
                    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
                    ${message}
                </span>
                <button class="btn btn-sm btn-link text-white" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Add styles based on type
        const styles = {
            success: 'background: rgba(46, 213, 115, 0.1); border-color: #2ed573;',
            warning: 'background: rgba(255, 165, 2, 0.1); border-color: #ffa502;',
            danger: 'background: rgba(255, 71, 87, 0.1); border-color: #ff4757;',
            info: 'background: rgba(0, 180, 216, 0.1); border-color: #00b4d8;'
        };
        
        alert.style.cssText = styles[type] || styles.info;
        
        // Insert at top of container
        const container = document.querySelector('.container');
        if (container) {
            container.insertBefore(alert, container.firstChild);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.remove();
                }
            }, 5000);
        }
    }
}

// Initialize the application
const fireGamesApp = new FireGamesApp();

// Make available globally
window.FireGames = fireGamesApp;