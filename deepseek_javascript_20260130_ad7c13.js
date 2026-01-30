// Create 'users' collection
// It will auto-create when users register

// Create 'games' collection with sample data
const games = [
    {
        id: 'space-shooter',
        name: 'Space Shooter',
        category: 'arcade',
        description: 'Defend Earth from alien invasion!',
        icon: 'fa-rocket',
        players: 1,
        difficulty: 'medium',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    },
    // Add 99+ more games...
];

// Create 'leaderboards' collection
// It will auto-create when scores are saved