// Abyssal Wardens 原型 - Phaser.js
// 核心游戏逻辑

const CONFIG = {
    width: 800,
    height: 600,
    tileSize: 40,
    path: [
        {x: 0, y: 300},
        {x: 200, y: 300},
        {x: 200, y: 100},
        {x: 400, y: 100},
        {x: 400, y: 500},
        {x: 600, y: 500},
        {x: 600, y: 300},
        {x: 800, y: 300}
    ],
    deployPoints: [
        {x: 100, y: 200, type: 'ground'},
        {x: 100, y: 400, type: 'ground'},
        {x: 300, y: 200, type: 'highground'},
        {x: 300, y: 400, type: 'highground'},
        {x: 500, y: 200, type: 'highground'},
        {x: 500, y: 400, type: 'highground'},
        {x: 700, y: 200, type: 'ground'},
        {x: 700, y: 400, type: 'ground'}
    ]
};

class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    create() {
        // 游戏状态
        this.gameState = {
            gold: 100,
            exp: 0,
            cost: 5,
            wave: 1,
            baseHp: 10,
            maxBaseHp: 10,
            enemies: [],
            towers: [],
            hero: null,
            heroHp: 100,
            maxHeroHp: 100,
            heroCooldown: 0,
            isGameOver: false
        };

        // 绘制背景
        this.drawBackground();
        
        // 绘制路径
        this.drawPath();
        
        // 绘制部署点
        this.drawDeployPoints();
        
        // 创建英雄
        this.createHero();
        
        // 创建UI
        this.createUI();
        
        // 敌人生成定时器
        this.spawnTimer = this.time.addEvent({
            delay: 2000,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });
        
        // 玩家输入
        this.input.on('pointerdown', this.handleClick, this);
        this.cursors = this.input.keyboard.createCursorKeys();
    }

    update(time, delta) {
        if (this.gameState.isGameOver) return;

        // 英雄移动
        this.updateHero(delta);
        
        // 英雄攻击冷却
        if (this.gameState.heroCooldown > 0) {
            this.gameState.heroCooldown -= delta;
        }
        
        // 更新敌人
        this.updateEnemies(delta);
        
        // 更新塔
        this.updateTowers(delta);
        
        // 更新UI
        this.updateUI();
    }

    drawBackground() {
        // 绘制网格背景
        this.add.grid(400, 300, 800, 600, CONFIG.tileSize, CONFIG.tileSize, 0x1a1a2e, 0.5, 0x2a2a4e, 0.3);
    }

    drawPath() {
        // 绘制路径
        const graphics = this.add.graphics();
        graphics.lineStyle(20, 0x4a4a6e, 1);
        graphics.beginPath();
        graphics.moveTo(CONFIG.path[0].x * CONFIG.tileSize, CONFIG.path[0].y);
        for (let i = 1; i < CONFIG.path.length; i++) {
            graphics.lineTo(CONFIG.path[i].x * CONFIG.tileSize, CONFIG.path[i].y);
        }
        graphics.strokePath();
        
        // 路径点标记
        for (let i = 0; i < CONFIG.path.length; i++) {
            const point = CONFIG.path[i];
            const circle = this.add.circle(point.x * CONFIG.tileSize, point.y, 8, 0xff6b35, 0.5);
        }
        
        // 终点标记
        const end = CONFIG.path[CONFIG.path.length - 1];
        this.add.rectangle(end.x * CONFIG.tileSize, end.y, 60, 60, 0xff0000, 0.3);
        this.add.text(end.x * CONFIG.tileSize - 30, end.y - 10, '基地', { fontSize: '14px', color: '#ff0000' });
    }

    drawDeployPoints() {
        this.deployPointGraphics = [];
        
        for (let i = 0; i < CONFIG.deployPoints.length; i++) {
            const point = CONFIG.deployPoints[i];
            const color = point.type === 'highground' ? 0x4ecdc4 : 0xffe66d;
            const rect = this.add.rectangle(
                point.x, 
                point.y, 
                CONFIG.tileSize, 
                CONFIG.tileSize, 
                color, 
                0.3
            );
            rect.setStrokeStyle(2, color);
            rect.setInteractive();
            rect.pointData = point;
            rect.pointIndex = i;
            this.deployPointGraphics.push(rect);
            
            // 文字标签
            const label = point.type === '高台' ? '高' : '平';
            this.add.text(point.x - 10, point.y - 5, label, { fontSize: '12px', color: '#ffffff' });
        }
    }

    createHero() {
        const start = CONFIG.path[0];
        this.hero = this.add.circle(start.x * CONFIG.tileSize, start.y, 20, 0xff6b35);
        this.heroText = this.add.text(start.x * CONFIG.tileSize - 15, start.y - 5, '英', { 
            fontSize: '16px', 
            fontStyle: 'bold',
            color: '#ffffff' 
        });
        
        // 英雄血条
        this.heroHpBar = this.add.rectangle(start.x * CONFIG.tileSize, start.y - 35, 40, 6, 0x00ff00);
    }

    createUI() {
        // 金币
        this.goldText = this.add.text(20, 20, `💰 金幣: ${this.gameState.gold}`, { 
            fontSize: '18px', 
            color: '#ffd700',
            backgroundColor: '#00000088',
            padding: { x: 10, y: 5 }
        });
        
        // 部署点数
        this.costText = this.add.text(20, 50, `⚡ 部署點數: ${this.gameState.cost}`, { 
            fontSize: '18px', 
            color: '#4ecdc4',
            backgroundColor: '#00000088',
            padding: { x: 10, y: 5 }
        });
        
        // 波次
        this.waveText = this.add.text(20, 80, `🌊 波次: ${this.gameState.wave}`, { 
            fontSize: '18px', 
            color: '#ffffff',
            backgroundColor: '#00000088',
            padding: { x: 10, y: 5 }
        });
        
        // 基地血量
        this.baseHpText = this.add.text(650, 20, `❤️ 基地: ${this.gameState.baseHp}/${this.gameState.maxBaseHp}`, { 
            fontSize: '18px', 
            color: '#ff0000',
            backgroundColor: '#00000088',
            padding: { x: 10, y: 5 }
        });
        
        // 部署提示
        this.add.text(20, 550, '點擊部署點放置【塔】 | WASD移動 | 點擊敵人攻擊', { 
            fontSize: '14px', 
            color: '#888888' 
        });
    }

    updateUI() {
        this.goldText.setText(`💰 金幣: ${this.gameState.gold}`);
        this.costText.setText(`⚡ 部署點數: ${this.gameState.cost}`);
        this.waveText.setText(`🌊 波次: ${this.gameState.wave}`);
        this.baseHpText.setText(`❤️ 基地: ${this.gameState.baseHp}/${this.gameState.maxBaseHp}`);
    }

    updateHero(delta) {
        const speed = 200;
        let dx = 0, dy = 0;
        
        if (this.cursors.left.isDown) dx = -1;
        if (this.cursors.right.isDown) dx = 1;
        if (this.cursors.up.isDown) dy = -1;
        if (this.cursors.down.isDown) dy = 1;
        
        if (dx !== 0 || dy !== 0) {
            this.hero.x += dx * speed * delta / 1000;
            this.hero.y += dy * speed * delta / 1000;
            this.heroText.x = this.hero.x - 15;
            this.heroText.y = this.hero.y - 5;
            this.heroHpBar.x = this.hero.x;
            this.heroHpBar.y = this.hero.y - 35;
        }
        
        // 边界限制
        this.hero.x = Phaser.Math.Clamp(this.hero.x, 20, 780);
        this.hero.y = Phaser.Math.Clamp(this.hero.y, 20, 580);
    }

    handleClick(pointer) {
        if (this.gameState.isGameOver) return;
        
        // 检查是否点击部署点
        for (let i = 0; i < this.deployPointGraphics.length; i++) {
            const point = this.deployPointGraphics[i];
            if (point.getBounds().contains(pointer.x, pointer.y)) {
                this.deployTower(point.pointData, point.pointIndex);
                return;
            }
        }
        
        // 检查是否点击敌人（攻击）
        for (let i = 0; i < this.gameState.enemies.length; i++) {
            const enemy = this.gameState.enemies[i];
            const dist = Phaser.Math.Distance.Between(this.hero.x, this.hero.y, enemy.sprite.x, enemy.sprite.y);
            if (dist < 80 && this.gameState.heroCooldown <= 0) {
                this.heroAttack(enemy);
                return;
            }
        }
    }

    deployTower(pointData, index) {
        if (this.gameState.cost < 5) {
            this.showMessage('部署點數不足!', pointData.x, pointData.y - 30);
            return;
        }
        
        if (this.gameState.towers[index]) {
            this.showMessage('已有塔!', pointData.x, pointData.y - 30);
            return;
        }
        
        // 消耗部署点
        this.gameState.cost -= 5;
        
        // 创建塔
        const tower = {
            sprite: this.add.rectangle(pointData.x, pointData.y, 35, 35, 0x4ecdc4),
            text: this.add.text(pointData.x - 10, pointData.y - 8, '塔', { 
                fontSize: '14px', 
                fontStyle: 'bold',
                color: '#000000' 
            }),
            damage: 20,
            range: 100,
            attackCooldown: 0,
            pointIndex: index
        };
        
        this.gameState.towers[index] = tower;
        
        // 塔攻击范围显示
        tower.rangeGraphic = this.add.circle(pointData.x, pointData.y, tower.range, 0x4ecdc4, 0.1);
        
        this.showMessage('塔已部署!', pointData.x, pointData.y - 30);
    }

    heroAttack(enemy) {
        this.gameState.heroCooldown = 500;
        
        // 绘制攻击线
        const graphics = this.add.graphics();
        graphics.lineStyle(3, 0xff6b35, 1);
        graphics.lineBetween(this.hero.x, this.hero.y, enemy.sprite.x, enemy.sprite.y);
        
        this.time.delayedCall(100, () => graphics.destroy());
        
        // 伤害敌人
        enemy.hp -= 30;
        
        // 伤害显示
        this.showDamage(enemy.sprite.x, enemy.sprite.y - 20, '30');
        
        if (enemy.hp <= 0) {
            this.killEnemy(enemy, true);
        }
    }

    spawnEnemy() {
        if (this.gameState.isGameOver) return;
        
        const enemyTypes = [
            { name: '哥', hp: 50, speed: 40, damage: 5, color: 0x00ff00, reward: 10 },
            { name: '獸', hp: 100, speed: 30, damage: 10, color: 0xff8800, reward: 20 },
            { name: '幽', hp: 40, speed: 50, damage: 8, color: 0x8800ff, reward: 15 }
        ];
        
        const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        
        const start = CONFIG.path[0];
        const enemy = {
            sprite: this.add.circle(start.x * CONFIG.tileSize, start.y, 15, type.color),
            text: this.add.text(start.x * CONFIG.tileSize - 8, start.y - 5, type.name, { 
                fontSize: '12px', 
                color: '#ffffff' 
            }),
            hp: type.hp,
            maxHp: type.hp,
            speed: type.speed,
            damage: type.damage,
            reward: type.reward,
            pathIndex: 0,
            pathProgress: 0,
            type: type
        };
        
        this.gameState.enemies.push(enemy);
    }

    updateEnemies(delta) {
        for (let i = this.gameState.enemies.length - 1; i >= 0; i--) {
            const enemy = this.gameState.enemies[i];
            
            // 沿路径移动
            const targetPoint = CONFIG.path[enemy.pathIndex + 1];
            if (!targetPoint) {
                // 到达终点
                this.gameState.baseHp -= 1;
                this.showMessage('漏怪! -1', 700, 300, '#ff0000');
                this.destroyEnemy(enemy, false);
                this.gameState.enemies.splice(i, 1);
                
                if (this.gameState.baseHp <= 0) {
                    this.gameOver();
                }
                continue;
            }
            
            const targetX = targetPoint.x * CONFIG.tileSize;
            const targetY = targetPoint.y;
            
            const dx = targetX - enemy.sprite.x;
            const dy = targetY - enemy.sprite.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 5) {
                enemy.pathIndex++;
                enemy.pathProgress = 0;
            } else {
                enemy.sprite.x += (dx / dist) * enemy.speed * delta / 1000;
                enemy.sprite.y += (dy / dist) * enemy.speed * delta / 1000;
                enemy.text.x = enemy.sprite.x - 8;
                enemy.text.y = enemy.sprite.y - 5;
            }
        }
    }

    updateTowers(delta) {
        for (let i = 0; i < this.gameState.towers.length; i++) {
            const tower = this.gameState.towers[i];
            if (!tower) continue;
            
            tower.attackCooldown -= delta;
            
            if (tower.attackCooldown <= 0) {
                // 寻找最近敌人
                let target = null;
                let minDist = tower.range;
                
                for (let j = 0; j < this.gameState.enemies.length; j++) {
                    const enemy = this.gameState.enemies[j];
                    const dist = Phaser.Math.Distance.Between(
                        tower.sprite.x, tower.sprite.y,
                        enemy.sprite.x, enemy.sprite.y
                    );
                    
                    if (dist < minDist) {
                        minDist = dist;
                        target = enemy;
                    }
                }
                
                if (target) {
                    this.towerAttack(tower, target);
                    tower.attackCooldown = 1000;
                }
            }
        }
    }

    towerAttack(tower, target) {
        // 绘制攻击线
        const graphics = this.add.graphics();
        graphics.lineStyle(2, 0x4ecdc4, 1);
        graphics.lineBetween(tower.sprite.x, tower.sprite.y, target.sprite.x, target.sprite.y);
        
        this.time.delayedCall(100, () => graphics.destroy());
        
        // 伤害敌人
        target.hp -= tower.damage;
        
        // 伤害显示
        this.showDamage(target.sprite.x, target.sprite.y - 20, tower.damage.toString());
        
        if (target.hp <= 0) {
            this.killEnemy(target, true);
        }
    }

    killEnemy(enemy, getReward) {
        if (getReward) {
            this.gameState.gold += enemy.reward;
            this.gameState.cost += 2;
            this.gameState.exp += 10;
            this.showMessage(`+${enemy.reward}💰`, enemy.sprite.x, enemy.sprite.y - 30, '#ffd700');
            
            // 击杀升级波次
            if (this.gameState.exp >= this.gameState.wave * 50) {
                this.gameState.wave++;
                this.showMessage(`🌊 波次 ${this.gameState.wave}!`, 400, 100, '#4ecdc4');
            }
        }
        
        this.destroyEnemy(enemy, getReward);
    }

    destroyEnemy(enemy, killed) {
        enemy.sprite.destroy();
        enemy.text.destroy();
        
        const index = this.gameState.enemies.indexOf(enemy);
        if (index > -1) {
            this.gameState.enemies.splice(index, 1);
        }
    }

    showDamage(x, y, text) {
        const damageText = this.add.text(x, y, `-${text}`, { 
            fontSize: '16px', 
            color: '#ff0000',
            fontStyle: 'bold' 
        });
        
        this.tweens.add({
            targets: damageText,
            y: y - 30,
            alpha: 0,
            duration: 500,
            onComplete: () => damageText.destroy()
        });
    }

    showMessage(text, x, y, color = '#ffffff') {
        const msg = this.add.text(x, y, text, { 
            fontSize: '16px', 
            color: color,
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        });
        
        this.tweens.add({
            targets: msg,
            y: y - 30,
            alpha: 0,
            duration: 1000,
            onComplete: () => msg.destroy()
        });
    }

    gameOver() {
        this.gameState.isGameOver = true;
        
        const bg = this.add.rectangle(400, 300, 400, 200, 0x000000, 0.8);
        
        this.add.text(400, 260, '遊戲結束', { 
            fontSize: '32px', 
            color: '#ff0000',
            fontStyle: 'bold' 
        }).setOrigin(0.5);
        
        this.add.text(400, 320, `到達波次: ${this.gameState.wave}`, { 
            fontSize: '18px', 
            color: '#ffffff' 
        }).setOrigin(0.5);
        
        const restartBtn = this.add.text(400, 370, '點擊重新開始', { 
            fontSize: '16px', 
            color: '#4ecdc4',
            backgroundColor: '#333333',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);
        
        restartBtn.setInteractive();
        restartBtn.on('pointerdown', () => {
            this.scene.restart();
        });
    }
}

// 游戏配置
const config = {
    type: Phaser.AUTO,
    width: CONFIG.width,
    height: CONFIG.height,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    scene: MainScene,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    }
};

const game = new Phaser.Game(config);
