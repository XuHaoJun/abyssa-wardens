// Abyssal Wardens 原型 - Phase 1: 英雄技能系统

const CONFIG = {
    width: 800,
    height: 600,
    tileSize: 40,
    cols: 20,
    rows: 15,
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

// ==================== A* 寻路 ====================
class AStar {
    constructor(grid, obstacles) {
        this.grid = grid;
        this.obstacles = obstacles;
    }
    
    heuristic(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }
    
    getNeighbors(node) {
        const dirs = [
            {x: 0, y: -1}, {x: 1, y: 0},
            {x: 0, y: 1}, {x: -1, y: 0}
        ];
        const neighbors = [];
        
        for (const dir of dirs) {
            const nx = node.x + dir.x;
            const ny = node.y + dir.y;
            
            if (nx >= 0 && nx < CONFIG.cols && ny >= 0 && ny < CONFIG.rows) {
                if (!this.isObstacle(nx, ny)) {
                    neighbors.push({x: nx, y: ny});
                }
            }
        }
        return neighbors;
    }
    
    isObstacle(x, y) {
        for (const obs of this.obstacles) {
            if (obs.x === x && obs.y === y) return true;
        }
        return false;
    }
    
    findPath(start, end) {
        const openSet = [start];
        const closedSet = new Set();
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();
        
        const key = (n) => `${n.x},${n.y}`;
        
        gScore.set(key(start), 0);
        fScore.set(key(start), this.heuristic(start, end));
        
        while (openSet.length > 0) {
            openSet.sort((a, b) => 
                (fScore.get(key(a)) || Infinity) - (fScore.get(key(b)) || Infinity)
            );
            const current = openSet.shift();
            
            if (current.x === end.x && current.y === end.y) {
                return this.reconstructPath(cameFrom, current);
            }
            
            closedSet.add(key(current));
            
            for (const neighbor of this.getNeighbors(current)) {
                if (closedSet.has(key(neighbor))) continue;
                
                const tentativeG = (gScore.get(key(current)) || Infinity) + 1;
                
                if (!openSet.find(n => n.x === neighbor.x && n.y === neighbor.y)) {
                    openSet.push(neighbor);
                } else if (tentativeG >= (gScore.get(key(neighbor)) || Infinity)) {
                    continue;
                }
                
                cameFrom.set(key(neighbor), current);
                gScore.set(key(neighbor), tentativeG);
                fScore.set(key(neighbor), tentativeG + this.heuristic(neighbor, end));
            }
        }
        return [];
    }
    
    reconstructPath(cameFrom, current) {
        const path = [current];
        const key = (n) => `${n.x},${n.y}`;
        
        while (cameFrom.has(key(current))) {
            current = cameFrom.get(key(current));
            path.unshift(current);
        }
        return path;
    }
}

// ==================== 主游戏场景 ====================
class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    create() {
        this.obstacles = [{x: 5, y: 7}, {x: 6, y: 7}, {x: 7, y: 7}];
        this.astar = new AStar(CONFIG.cols, this.rows, this.obstacles);
        
        // ========== 英雄系统 ==========
        this.hero = {
            hp: 100,
            maxHp: 100,
            x: 80,
            y: 300,
            speed: 150,
            attackRange: 80,
            attackDamage: 30,
            isDashing: false,
            targetPath: [],
            pathIndex: 0,
            
            // 技能系统
            skills: {
                basic: { name: '普攻', damage: 30, cooldown: 500, range: 80, ready: true },
                dash: { name: '衝刺', damage: 20, cooldown: 3000, distance: 120, ready: true, lastUsed: 0 },
                ultimate: { name: '毀滅', damage: 200, cooldown: 15000, range: 150, ready: true, charge: 0, maxCharge: 100, lastUsed: 0 }
            }
        };
        
        this.deploymentPoints = 5;
        
        this.gameState = {
            gold: 100,
            exp: 0,
            wave: 1,
            baseHp: 10,
            maxBaseHp: 10,
            enemies: [],
            towers: [],
            isGameOver: false
        };
        
        this.keys = {};
        this.keys.Q = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
        this.keys.E = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.keys.R = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        
        this.drawBackground();
        this.drawPath();
        this.drawDeployPoints();
        this.drawObstacles();
        this.createHero();
        this.createUI();
        this.createSkillBar();
        
        this.spawnTimer = this.time.addEvent({
            delay: 2500,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });
        
        this.input.on('pointerdown', this.handleClick, this);
    }

    update(time, delta) {
        if (this.gameState.isGameOver) return;
        
        this.updateHero(delta, time);
        this.updateSkills(time);
        this.updateEnemies(delta);
        this.updateTowers(delta);
        this.updateUI();
    }

    drawBackground() {
        this.add.grid(400, 300, 800, 600, CONFIG.tileSize, CONFIG.tileSize, 0x1a1a2e, 0.5, 0x2a2a4e, 0.3);
    }

    drawPath() {
        this.pathPoints = [
            {x: 0, y: 7}, {x: 4, y: 7}, {x: 4, y: 3},
            {x: 10, y: 3}, {x: 10, y: 11}, {x: 15, y: 11},
            {x: 15, y: 7}, {x: 20, y: 7}
        ];
        
        const g = this.add.graphics();
        g.lineStyle(20, 0x4a4a6e, 1);
        g.beginPath();
        for (let i = 0; i < this.pathPoints.length; i++) {
            const px = this.pathPoints[i].x * CONFIG.tileSize;
            const py = this.pathPoints[i].y * CONFIG.tileSize + CONFIG.tileSize/2;
            if (i === 0) g.moveTo(px, py);
            else g.lineTo(px, py);
        }
        g.strokePath();
        
        const end = this.pathPoints[this.pathPoints.length - 1];
        this.add.rectangle(end.x * CONFIG.tileSize, end.y * CONFIG.tileSize + CONFIG.tileSize/2, 60, 60, 0xff0000, 0.3);
        this.add.text(end.x * CONFIG.tileSize - 30, end.y * CONFIG.tileSize + CONFIG.tileSize/2 - 10, '基地', { fontSize: '14px', color: '#ff0000' });
    }

    drawObstacles() {
        for (const obs of this.obstacles) {
            this.add.rectangle(
                obs.x * CONFIG.tileSize + CONFIG.tileSize/2,
                obs.y * CONFIG.tileSize + CONFIG.tileSize/2,
                CONFIG.tileSize, CONFIG.tileSize, 0x888888, 0.5
            );
        }
    }

    drawDeployPoints() {
        this.deployPointGraphics = [];
        
        for (let i = 0; i < CONFIG.deployPoints.length; i++) {
            const point = CONFIG.deployPoints[i];
            const color = point.type === 'highground' ? 0x4ecdc4 : 0xffe66d;
            const rect = this.add.rectangle(point.x, point.y, 35, 35, color, 0.4);
            rect.setStrokeStyle(2, color);
            rect.setInteractive();
            rect.pointData = point;
            rect.pointIndex = i;
            this.deployPointGraphics.push(rect);
            this.add.text(point.x - 10, point.y - 5, point.type === 'highground' ? '高' : '平', { fontSize: '12px', color: '#ffffff' });
        }
    }

    createHero() {
        this.heroSprite = this.add.circle(this.hero.x, this.hero.y, 20, 0xff6b35);
        this.heroText = this.add.text(this.hero.x - 15, this.hero.y - 5, '英', { fontSize: '14px', fontStyle: 'bold', color: '#ffffff' });
        this.heroHpBar = this.add.rectangle(this.hero.x, this.hero.y - 35, 40, 6, 0x00ff00);
        this.heroHpBarBg = this.add.rectangle(this.hero.x, this.hero.y - 35, 40, 6, 0x333333).setStrokeStyle(1, 0xffffff);
        this.targetMarker = this.add.circle(this.hero.x, this.hero.y, 8, 0xffff00, 0.5).setVisible(false);
        this.attackRangeGraphic = this.add.circle(this.hero.x, this.hero.y, this.hero.skills.basic.range, 0xff6b35, 0.1).setVisible(false);
    }

    createUI() {
        this.goldText = this.add.text(20, 20, '金: 100', { fontSize: '18px', color: '#ffd700', backgroundColor: '#00000088', padding: { x: 10, y: 5 } });
        this.costText = this.add.text(20, 50, '點: 5', { fontSize: '18px', color: '#4ecdc4', backgroundColor: '#00000088', padding: { x: 10, y: 5 } });
        this.waveText = this.add.text(20, 80, '波: 1', { fontSize: '18px', color: '#ffffff', backgroundColor: '#00000088', padding: { x: 10, y: 5 } });
        this.baseHpText = this.add.text(650, 20, '基: 10/10', { fontSize: '18px', color: '#ff0000', backgroundColor: '#00000088', padding: { x: 10, y: 5 } });
        
        this.add.text(20, 110, '統帥值:', { fontSize: '14px', color: '#ff6b35' });
        this.ultBarBg = this.add.rectangle(100, 118, 100, 12, 0x333333);
        this.ultBar = this.add.rectangle(50, 118, 0, 10, 0xff6b35);
        
        this.add.text(20, 550, '左鍵:移動/部署 | Q:衝刺 | E:普攻 | R:大招', { fontSize: '12px', color: '#888888' });
    }

    createSkillBar() {
        const barY = 560;
        const barX = 300;
        
        this.add.rectangle(barX + 120, barY + 15, 250, 40, 0x000000, 0.6).setStrokeStyle(2, 0x4a4a6e);
        
        // Q - 冲刺
        this.skillQ = this.add.rectangle(barX, barY, 36, 36, 0x4ecdc4).setStrokeStyle(2, 0x00ff00);
        this.skillQText = this.add.text(barX - 12, barY - 8, 'Q', { fontSize: '20px', fontStyle: 'bold', color: '#000000' });
        this.skillQIcon = this.add.text(barX - 10, barY + 5, '⚡', { fontSize: '14px' });
        this.skillQCooldown = this.add.rectangle(barX, barY, 36, 36, 0x000000, 0.7).setVisible(false);
        
        // E - 普攻
        this.skillE = this.add.rectangle(barX + 50, barY, 36, 36, 0xffe66d).setStrokeStyle(2, 0x00ff00);
        this.skillEText = this.add.text(barX + 38, barY - 8, 'E', { fontSize: '20px', fontStyle: 'bold', color: '#000000' });
        this.skillEIcon = this.add.text(barX + 40, barY + 5, '劍', { fontSize: '14px' });
        
        // R - 大招
        this.skillR = this.add.rectangle(barX + 100, barY, 36, 36, 0xff6b35).setStrokeStyle(2, 0x00ff00);
        this.skillRText = this.add.text(barX + 88, barY - 8, 'R', { fontSize: '20px', fontStyle: 'bold', color: '#000000' });
        this.skillRIcon = this.add.text(barX + 90, barY + 5, '💥', { fontSize: '14px' });
        this.skillRCooldown = this.add.rectangle(barX + 100, barY, 36, 36, 0x000000, 0.7).setVisible(false);
    }

    updateSkills(time) {
        const skills = this.hero.skills;
        
        // 冲刺冷却
        if (!skills.dash.ready) {
            const cd = Math.max(0, (skills.dash.lastUsed + skills.dash.cooldown) - time);
            if (cd > 0) {
                this.skillQCooldown.setVisible(true);
                this.skillQCooldown.height = 36 * (cd / skills.dash.cooldown);
            } else {
                skills.dash.ready = true;
                this.skillQCooldown.setVisible(false);
                this.skillQ.setStrokeStyle(2, 0x00ff00);
            }
        }
        
        // 大招冷却
        if (!skills.ultimate.ready) {
            const cd = Math.max(0, (skills.ultimate.lastUsed + skills.ultimate.cooldown) - time);
            if (cd > 0) {
                this.skillRCooldown.setVisible(true);
                this.skillRCooldown.height = 36 * (cd / skills.ultimate.cooldown);
            } else {
                skills.ultimate.ready = true;
                this.skillRCooldown.setVisible(false);
                this.skillR.setStrokeStyle(2, 0x00ff00);
            }
        }
        
        // 统率值条
        const ultPercent = skills.ultimate.charge / skills.ultimate.maxCharge;
        this.ultBar.width = 100 * ultPercent;
        this.ultBar.x = 50 + (50 * ultPercent);
        
        // 统率值满时提示
        if (skills.ultimate.charge >= skills.ultimate.maxCharge && skills.ultimate.ready) {
            this.skillR.setFillStyle(0xff0000);
        } else {
            this.skillR.setFillStyle(0xff6b35);
        }
    }

    updateHero(delta, time) {
        if (Phaser.Input.Keyboard.JustDown(this.keys.Q)) this.useDash(time);
        if (Phaser.Input.Keyboard.JustDown(this.keys.E)) this.useBasicAttack(time);
        if (Phaser.Input.Keyboard.JustDown(this.keys.R)) this.useUltimate(time);
        
        if (this.hero.targetPath.length > 0) {
            const target = this.hero.targetPath[this.hero.pathIndex];
            const tx = target.x * CONFIG.tileSize + CONFIG.tileSize/2;
            const ty = target.y * CONFIG.tileSize + CONFIG.tileSize/2;
            
            const dx = tx - this.heroSprite.x;
            const dy = ty - this.heroSprite.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 5) {
                this.hero.pathIndex++;
                if (this.hero.pathIndex >= this.hero.targetPath.length) {
                    this.hero.targetPath = [];
                    this.hero.pathIndex = 0;
                    this.targetMarker.setVisible(false);
                    this.attackRangeGraphic.setVisible(false);
                }
            } else {
                const speed = this.hero.isDashing ? this.hero.speed * 2.5 : this.hero.speed;
                this.heroSprite.x += (dx / dist) * speed * delta / 1000;
                this.heroSprite.y += (dy / dist) * speed * delta / 1000;
            }
        }
        
        this.heroSprite.x = Phaser.Math.Clamp(this.heroSprite.x, 20, 780);
        this.heroSprite.y = Phaser.Math.Clamp(this.heroSprite.y, 20, 550);
        
        this.heroText.x = this.heroSprite.x - 15;
        this.heroText.y = this.heroSprite.y - 5;
        this.heroHpBar.x = this.heroSprite.x;
        this.heroHpBar.y = this.heroSprite.y - 35;
        this.heroHpBar.width = 40 * (this.hero.hp / this.hero.maxHp);
        this.heroHpBarBg.x = this.heroSprite.x;
        this.heroHpBarBg.y = this.heroSprite.y - 35;
        this.attackRangeGraphic.x = this.heroSprite.x;
        this.attackRangeGraphic.y = this.heroSprite.y;
    }

    useBasicAttack(time) {
        let target = null;
        let minDist = this.hero.skills.basic.range;
        
        for (const enemy of this.gameState.enemies) {
            const dist = Phaser.Math.Distance.Between(this.heroSprite.x, this.heroSprite.y, enemy.sprite.x, enemy.sprite.y);
            if (dist < minDist) {
                minDist = dist;
                target = enemy;
            }
        }
        
        if (target) {
            const g = this.add.graphics();
            g.lineStyle(3, 0xffe66d, 1);
            g.lineBetween(this.heroSprite.x, this.heroSprite.y, target.sprite.x, target.sprite.y);
            this.time.delayedCall(100, () => g.destroy());
            
            target.hp -= this.hero.skills.basic.damage;
            this.showDamage(target.sprite.x, target.sprite.y - 20, this.hero.skills.basic.damage.toString());
            
            this.hero.skills.ultimate.charge = Math.min(this.hero.skills.ultimate.maxCharge, this.hero.skills.ultimate.charge + 5);
            
            if (target.hp <= 0) this.killEnemy(target, true);
            this.showMessage('普攻!', this.heroSprite.x, this.heroSprite.y - 50, '#ffe66d');
        } else {
            this.showMessage('範圍無敵', this.heroSprite.x, this.heroSprite.y - 50, '#888888');
        }
    }
    
    useDash(time) {
        if (!this.hero.skills.dash.ready) {
            this.showMessage('衝刺冷卻中', this.heroSprite.x, this.heroSprite.y - 50, '#ff0000');
            return;
        }
        
        const pointer = this.input.activePointer;
        this.hero.isDashing = true;
        this.hero.skills.dash.lastUsed = time;
        this.hero.skills.dash.ready = false;
        this.skillQ.setStrokeStyle(2, 0xff0000);
        
        const dx = pointer.x - this.heroSprite.x;
        const dy = pointer.y - this.heroSprite.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
            const dashDist = Math.min(this.hero.skills.dash.distance, dist);
            this.heroSprite.x += (dx / dist) * dashDist;
            this.heroSprite.y += (dy / dist) * dashDist;
            
            const g = this.add.graphics();
            for (let i = 0; i < 5; i++) {
                g.lineStyle(2, 0x4ecdc4, 0.5);
                g.lineBetween(
                    this.heroSprite.x - (dx/dist) * i * 20,
                    this.heroSprite.y - (dy/dist) * i * 20,
                    this.heroSprite.x - (dx/dist) * (i+1) * 20,
                    this.heroSprite.y - (dy/dist) * (i+1) * 20
                );
            }
            this.time.delayedCall(200, () => g.destroy());
        }
        
        for (const enemy of this.gameState.enemies) {
            const dist = Phaser.Math.Distance.Between(this.heroSprite.x, this.heroSprite.y, enemy.sprite.x, enemy.sprite.y);
            if (dist < 50) {
                enemy.hp -= this.hero.skills.dash.damage;
                this.showDamage(enemy.sprite.x, enemy.sprite.y - 20, this.hero.skills.dash.damage.toString());
                if (enemy.hp <= 0) this.killEnemy(enemy, true);
            }
        }
        
        this.time.delayedCall(300, () => { this.hero.isDashing = false; });
        this.showMessage('衝刺!', this.heroSprite.x, this.heroSprite.y - 50, '#4ecdc4');
    }
    
    useUltimate(time) {
        if (!this.hero.skills.ultimate.ready) {
            this.showMessage('大招冷卻中', this.heroSprite.x, this.heroSprite.y - 50, '#ff0000');
            return;
        }
        
        if (this.hero.skills.ultimate.charge < this.hero.skills.ultimate.maxCharge) {
            this.showMessage('統帥值未滿', this.heroSprite.x, this.heroSprite.y - 50, '#ff8800');
            return;
        }
        
        this.hero.skills.ultimate.lastUsed = time;
        this.hero.skills.ultimate.ready = false;
        this.hero.skills.ultimate.charge = 0;
        this.skillR.setStrokeStyle(2, 0xff0000);
        
        const range = this.hero.skills.ultimate.range;
        const rangeGraphic = this.add.circle(this.heroSprite.x, this.heroSprite.y, range, 0xff6b35, 0.3);
        
        let hitCount = 0;
        for (const enemy of this.gameState.enemies) {
            const dist = Phaser.Math.Distance.Between(this.heroSprite.x, this.heroSprite.y, enemy.sprite.x, enemy.sprite.y);
            if (dist < range) {
                enemy.hp -= this.hero.skills.ultimate.damage;
                this.showDamage(enemy.sprite.x, enemy.sprite.y - 20, this.hero.skills.ultimate.damage.toString());
                hitCount++;
                if (enemy.hp <= 0) this.killEnemy(enemy, true);
            }
        }
        
        this.cameras.main.shake(200, 0.01);
        this.time.delayedCall(500, () => rangeGraphic.destroy());
        
        this.showMessage(`毀滅! 命中${hitCount}人`, this.heroSprite.x, this.heroSprite.y - 50, '#ff6b35');
    }

    handleClick(pointer) {
        if (this.gameState.isGameOver) return;
        
        for (const point of this.deployPointGraphics) {
            if (point.getBounds().contains(pointer.x, pointer.y)) {
                this.deployTower(point.pointData, point.pointIndex);
                return;
            }
        }
        
        const startX = Math.floor(this.heroSprite.x / CONFIG.tileSize);
        const startY = Math.floor(this.heroSprite.y / CONFIG.tileSize);
        const endX = Math.floor(pointer.x / CONFIG.tileSize);
        const endY = Math.floor(pointer.y / CONFIG.tileSize);
        
        const path = this.astar.findPath({x: startX, y: startY}, {x: endX, y: endY});
        
        if (path.length > 0) {
            this.hero.targetPath = path;
            this.hero.pathIndex = 0;
            this.targetMarker.x = pointer.x;
            this.targetMarker.y = pointer.y;
            this.targetMarker.setVisible(true);
            this.attackRangeGraphic.x = pointer.x;
            this.attackRangeGraphic.y = pointer.y;
            this.attackRangeGraphic.setVisible(true);
        }
    }

    deployTower(pointData, index) {
        if (this.deploymentPoints < 5) {
            this.showMessage('點數不足!', pointData.x, pointData.y - 30, '#ff0000');
            return;
        }
        
        if (this.gameState.towers[index]) {
            this.showMessage('已有塔!', pointData.x, pointData.y - 30, '#ff8800');
            return;
        }
        
        this.deploymentPoints -= 5;
        
        const tower = {
            sprite: this.add.rectangle(pointData.x, pointData.y, 35, 35, 0x4ecdc4),
            text: this.add.text(pointData.x - 10, pointData.y - 8, '塔', { fontSize: '14px', fontStyle: 'bold', color: '#000000' }),
            damage: 20,
            range: 100,
            attackCooldown: 0,
            pointIndex: index,
            rangeGraphic: this.add.circle(pointData.x, pointData.y, 100, 0x4ecdc4, 0.1).setVisible(false)
        };
        
        this.gameState.towers[index] = tower;
        
        tower.sprite.setInteractive();
        tower.sprite.on('pointerover', () => tower.rangeGraphic.setVisible(true));
        tower.sprite.on('pointerout', () => tower.rangeGraphic.setVisible(false));
        
        this.showMessage('塔!', pointData.x, pointData.y - 30, '#4ecdc4');
    }

    spawnEnemy() {
        if (this.gameState.isGameOver) return;
        
        const types = [
            { name: '哥', hp: 50, speed: 40, color: 0x00ff00, reward: 10 },
            { name: '獸', hp: 100, speed: 30, color: 0xff8800, reward: 20 },
            { name: '幽', hp: 40, speed: 50, color: 0x8800ff, reward: 15 }
        ];
        
        const type = types[Math.floor(Math.random() * types.length)];
        const start = this.pathPoints[0];
        
        const enemy = {
            sprite: this.add.circle(start.x * CONFIG.tileSize, start.y * CONFIG.tileSize + CONFIG.tileSize/2, 15, type.color),
            text: this.add.text(start.x * CONFIG.tileSize - 8, start.y * CONFIG.tileSize + CONFIG.tileSize/2 - 5, type.name, { fontSize: '12px', color: '#ffffff' }),
            hp: type.hp,
            maxHp: type.hp,
            speed: type.speed,
            reward: type.reward,
            pathIndex: 0
        };
        
        this.gameState.enemies.push(enemy);
    }

    updateEnemies(delta) {
        for (let i = this.gameState.enemies.length - 1; i >= 0; i--) {
            const enemy = this.gameState.enemies[i];
            
            const targetPoint = this.pathPoints[enemy.pathIndex + 1];
            if (!targetPoint) {
                this.gameState.baseHp -= 1;
                this.showMessage('漏!', 700, 300, '#ff0000');
                enemy.sprite.destroy();
                enemy.text.destroy();
                this.gameState.enemies.splice(i, 1);
                
                if (this.gameState.baseHp <= 0) this.gameOver();
                continue;
            }
            
            const tx = targetPoint.x * CONFIG.tileSize;
            const ty = targetPoint.y * CONFIG.tileSize + CONFIG.tileSize/2;
            
            const dx = tx - enemy.sprite.x;
            const dy = ty - enemy.sprite.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 5) {
                enemy.pathIndex++;
            } else {
                enemy.sprite.x += (dx / dist) * enemy.speed * delta / 1000;
                enemy.sprite.y += (dy / dist) * enemy.speed * delta / 1000;
            }
            
            enemy.text.x = enemy.sprite.x - 8;
            enemy.text.y = enemy.sprite.y - 5;
        }
    }

    updateTowers(delta) {
        for (const tower of this.gameState.towers) {
            if (!tower) continue;
            
            tower.attackCooldown -= delta;
            
            if (tower.attackCooldown <= 0) {
                let target = null;
                let minDist = tower.range;
                
                for (const enemy of this.gameState.enemies) {
                    const dist = Phaser.Math.Distance.Between(tower.sprite.x, tower.sprite.y, enemy.sprite.x, enemy.sprite.y);
                    if (dist < minDist) {
                        minDist = dist;
                        target = enemy;
                    }
                }
                
                if (target) {
                    const g = this.add.graphics();
                    g.lineStyle(2, 0x4ecdc4, 1);
                    g.lineBetween(tower.sprite.x, tower.sprite.y, target.sprite.x, target.sprite.y);
                    this.time.delayedCall(100, () => g.destroy());
                    
                    target.hp -= tower.damage;
                    this.showDamage(target.sprite.x, target.sprite.y - 20, tower.damage.toString());
                    
                    if (target.hp <= 0) this.killEnemy(target, true);
                    
                    tower.attackCooldown = 1000;
                }
            }
        }
    }

    killEnemy(enemy, getReward) {
        if (getReward) {
            this.gameState.gold += enemy.reward;
            this.deploymentPoints += 2;
            this.gameState.exp += 10;
            this.showMessage(`+${enemy.reward}`, enemy.sprite.x, enemy.sprite.y - 30, '#ffd700');
            
            if (this.gameState.exp >= this.gameState.wave * 50) {
                this.gameState.wave++;
                this.showMessage(`波 ${this.gameState.wave}!`, 400, 100, '#4ecdc4');
            }
        }
        
        enemy.sprite.destroy();
        enemy.text.destroy();
        
        const idx = this.gameState.enemies.indexOf(enemy);
        if (idx > -1) this.gameState.enemies.splice(idx, 1);
    }

    updateUI() {
        this.goldText.setText(`金: ${this.gameState.gold}`);
        this.costText.setText(`點: ${this.deploymentPoints}`);
        this.waveText.setText(`波: ${this.gameState.wave}`);
        this.baseHpText.setText(`基: ${this.gameState.baseHp}/${this.gameState.maxBaseHp}`);
    }

    showDamage(x, y, text) {
        const dmg = this.add.text(x, y, `-${text}`, { fontSize: '16px', color: '#ff0000', fontStyle: 'bold' });
        this.tweens.add({ targets: dmg, y: y - 30, alpha: 0, duration: 500, onComplete: () => dmg.destroy() });
    }

    showMessage(text, x, y, color = '#ffffff') {
        const msg = this.add.text(x, y, text, { fontSize: '16px', color: color, fontStyle: 'bold', stroke: '#000000', strokeThickness: 3 });
        this.tweens.add({ targets: msg, y: y - 30, alpha: 0, duration: 1000, onComplete: () => msg.destroy() });
    }

    gameOver() {
        this.gameState.isGameOver = true;
        
        this.add.rectangle(400, 300, 400, 200, 0x000000, 0.8);
        this.add.text(400, 260, '遊戲結束', { fontSize: '32px', color: '#ff0000', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.text(400, 320, `波次: ${this.gameState.wave}`, { fontSize: '18px', color: '#ffffff' }).setOrigin(0.5);
        
        const restartBtn = this.add.text(400, 370, '點擊重新開始', { fontSize: '16px', color: '#4ecdc4', backgroundColor: '#333333', padding: { x: 10, y: 5 } }).setOrigin(0.5);
        restartBtn.setInteractive();
        restartBtn.on('pointerdown', () => this.scene.restart());
    }
}

const config = {
    type: Phaser.AUTO,
    width: CONFIG.width,
    height: CONFIG.height,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    scene: MainScene
};

const game = new Phaser.Game(config);
