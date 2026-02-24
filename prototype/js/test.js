console.log('Script loading...');
console.log('Phaser exists:', typeof Phaser);

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM ready');
    
    var config = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: 'game-container',
        backgroundColor: '#ff0000',
        scene: {
            create: function() {
                console.log('Scene create called!');
                this.add.circle(400, 300, 50, 0x00ff00);
                this.add.text(400, 400, 'HELLO', {fontSize:'48px',color:'#ffffff'}).setOrigin(0.5);
            }
        }
    };
    
    console.log('Creating game...');
    var game = new Phaser.Game(config);
    console.log('Game created:', game);
});
