// Example: Tic Tac Toe Game (games/tictactoe.js)
class TicTacToeGame {
    constructor(userId) {
        this.userId = userId;
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.gameOver = false;
    }
    
    makeMove(position) {
        if (this.gameOver || this.board[position]) return false;
        
        this.board[position] = this.currentPlayer;
        
        if (this.checkWin()) {
            this.gameOver = true;
            this.saveScore(100);
            return 'win';
        }
        
        if (this.checkDraw()) {
            this.gameOver = true;
            this.saveScore(50);
            return 'draw';
        }
        
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        return 'continue';
    }
    
    async saveScore(score) {
        return await firestoreDB.saveGameScore(this.userId, 'tictactoe', score, {
            board: this.board,
            result: this.gameOver ? 'win' : 'draw'
        });
    }
}