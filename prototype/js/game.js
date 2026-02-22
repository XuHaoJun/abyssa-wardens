// Abyssal Wardens 原型 - 完整算法版
// 包含: A*, BFS/DFS, 行為樹, 狀態機

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

// ==================== A* 尋路演算法 ====================
class AStar {
    constructor(grid, obstacles) {
        this.grid = grid;
        this.obstacles = obstacles;
    }
    
    heuristic(a, b) {
        // Manhattan 距離
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }
    
    getNeighbors(node) {
        const dirs = [
            {x: 0, y: -1}, {x: 1, y: 0},
            {x: 0, y: 1}, {x: -1, y: 0},
            {x: -1, y: -1}, {x: 1, y: -1},
            {x: -1, y: 1}, {x: 1, y: 1}
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
            // 找 fScore 最低的節點
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
                
                const tentativeG = (gScore.get(key(current)) || Infinity) + 
                    this.heuristic(current, neighbor);
                
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
        
        return []; // 無路徑
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

// ==================== BFS 搜尋 ====================
class BFS {
    constructor(grid, obstacles) {
        this.grid = grid;
        this.obstacles = obstacles;
    }
    
    isObstacle(x, y) {
        for (const obs of this.obstacles) {
            if (obs.x === x && obs.y === y) return true;
        }
        return false;
    }
    
    findAllReachable(start) {
        const visited = new Set();
        const queue = [start];
        const reachable = [];
        
        const key = (n) => `${n.x},${n.y}`;
        visited.add(key(start));
        
        const dirs = [{x: 0, y: -1}, {x: 1, y: 0}, {x: 0, y: 1}, {x: -1, y: 0}];
        
        while (queue.length > 0) {
            const current = queue.shift();
            reachable.push(current);
            
            for (const dir of dirs) {
                const nx = current.x + dir.x;
                const ny = current.y + dir.y;
                
                if (nx >= 0 && nx < CONFIG.cols && ny >= 0 && ny < CONFIG.rows) {
                    if (!this.isObstacle(nx, ny) && !visited.has(key({x: nx, y: ny}))) {
                        visited.add(key({x: nx, y: ny}));
                        queue.push({x: nx, y: ny});
                    }
                }
            }
        }
        
        return reachable;
    }
}

// ==================== 狀態機 ====================
class StateMachine {
    constructor() {
        this.states = {};
        this.currentState = null;
    }
    
    addState(name, enter, update, exit) {
        this.states[name] = { enter, update, exit };
    }
    
    setState(name) {
        if (this.currentState && this.states[this.currentState].exit) {
            this.states[this.currentState].exit();
        }
        this.currentState = name;
        if (this.states[name].enter) {
            this.states[name].enter();
        }
    }
    
    update(delta) {
        if (this.currentState && this.states[this.currentState].update) {
            this.states[this.currentState].update(delta);
        }
    }
}

// ==================== 行為樹 ====================
class BehaviorTree {
    constructor() {
        this.root = null;
    }
    
    run(entity, delta) {
        if (this.root) {
            return this.root.execute(entity, delta);
        }
        return 'failure';
    }
}

class Selector {
    constructor(children) {
        this.children = children;
    }
    
    execute(entity, delta) {
        for (const child of this.children) {
            const result = child.execute(entity, delta);
            if (result === 'success') return 'success';
            if (result === 'running') return 'running';
        }
        return 'failure';
    }
}

class Sequence {
    constructor(children) {
        this.children = children;
    }
    
    execute(entity, delta) {
        for (const child of this.children) {
            const result = child.execute(entity, delta);
            if (result === 'failure') return 'failure';
            if (result === 'running') return 'running';
        }
        return 'success';
    }
}

class Condition {
    constructor(checkFn) {
        this.checkFn = checkFn;
    }
    
    execute(entity, delta) {
        return this.checkFn(entity) ? 'success' : 'failure';
    }
}

class Action {
    constructor(actionFn) {
        this.actionFn = actionFn;
    }
    
    execute(entity, delta) {
        return this.actionFn(entity, delta);
    }
}

// ==================== 主遊戲場景 ====================
class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    create() {
        // 初始化 A* 和 BFS
        this.obstacles = [
            {x: 5, y: 7}, {x: 6, y: 7}, {x: 7, y: 7}
        ];
        this.astar = new AStar(CONFIG.cols, this.rows, this.obstacles);
        this.bfs = new BFS(CONFIG.cols, this.rows, this.obstacles);
        
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
            isGameOver: false,
            heroTargetX: null,
            heroTargetY: null,
            heroPath: [],
            heroPathIndex: 0
        };

        this.drawBackground();
        this.drawPath();
        this.drawDeployPoints();
        this.drawObstacles();
        this.createHero();
        this.createUI();
        
        // 敌人生成定时器
        this.spawnTimer = this.time.addEvent({
            delay: 2000,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });
        
        this.input.on('pointerdown', this.handleClick, this);
    }

    update(time, delta) {
        if (this.gameState.isGameOver) return;

        this.updateHero(delta, time);
        
        if (this.gameState.heroCooldown > 0) {
            this.gameState.heroCooldown -= delta;
        }
        
        // 更新所有敌人 (使用行为树)
        for (const enemy of this.gameState.enemies) {
            this.updateEnemyAI(enemy, delta);
        }
        
        this.updateTowers(delta);
        this.updateUI();
    }

    drawBackground() {
        this.add.grid(400, 300, 800, 600, CONFIG.tileSize, CONFIG.tileSize, 0x1a1a2e, 0.5, 0x2a2a4e, 0.3);
    }

    drawPath() {
        // 预设路径点
        this.pathPoints = [
            {x: 0, y: 7},
            {x: 4, y: 7},
            {x: 4, y: 3},
            {x: 10, y: 3},
            {x: 10, y: 11},
            {x: 15, y: 11},
            {x: 15, y: 7},
            {x: 20, y: 7}
        ];
        
        const graphics = this.add.graphics();
        graphics.lineStyle(20, 0x4a4a6e, 1);
        graphics.beginPath();
        
        for (let i = 0; i < this.pathPoints.length; i++) {
            const px = this.pathPoints[i].x * CONFIG.tileSize;
            const py = this.pathPoints[i].y * CONFIG.tileSize + CONFIG.tileSize/2;
            if (i === 0) graphics.moveTo(px, py);
            else graphics.lineTo(px, py);
        }
        graphics.strokePath();
        
        // 终点
        const end = this.pathPoints[this.pathPoints.length - 1];
        this.add.rectangle(end.x * CONFIG.tileSize, end.y * CONFIG.tileSize + CONFIG.tileSize/2, 60, 60, 0xff0000, 0.3);
        this.add.text(end.x * CONFIG.tileSize - 30, end.y * CONFIG.tileSize + CONFIG.tileSize/2 - 10, '基地', { fontSize: '14px', color: '#ff0000' });
    }

    drawObstacles() {
        for (const obs of this.obstacles) {
            this.add.rectangle(
                obs.x * CONFIG.tileSize + CONFIG.tileSize/2,
                obs.y * CONFIG.tileSize + CONFIG.tileSize/2,
                CONFIG.tileSize, CONFIG.tileSize,
                0x888888, 0.5
            );
            this.add.text(
                obs.x * CONFIG.tileSize + 5,
                obs.y * CONFIG.tileSize + 10,
                '障', { fontSize: '12px', color: '#000000' }
            );
        }
    }

    drawDeployPoints() {
        this.deployPointGraphics = [];
        
        for (let i = 0; i < CONFIG.deployPoints.length; i++) {
            const point = CONFIG.deployPoints[i];
            const color = point.type === 'highground' ? 0x4ecdc4 : 0xffe66d;
            const rect = this.add.rectangle(
                point.x, point.y, CONFIG.tileSize - 5, CONFIG.tileSize - 5, color, 0.4
            );
            rect.setStrokeStyle(2, color);
            rect.setInteractive();
            rect.pointData = point;
            rect.pointIndex = i;
            this.deployPointGraphics.push(rect);
            
            const label = point.type === 'highground' ? '高' : '平';
            this.add.text(point.x - 10, point.y - 5, label, { fontSize: '12px', color: '#ffffff' });
        }
    }

    createHero() {
        const start = this.pathPoints[0];
        this.hero = this.add.circle(start.x * CONFIG.tileSize, start.y * CONFIG.tileSize + CONFIG.tileSize/2, 18, 0xff6b35);
        this.heroText = this.add.text(start.x * CONFIG.tileSize - 15, start.y * CONFIG.tileSize + CONFIG.tileSize/2 - 5, '英', { 
            fontSize: '14px', fontStyle: 'bold', color: '#ffffff' 
        });
        this.heroHpBar = this.add.rectangle(start.x * CONFIG.tileSize, start.y * CONFIG.tileSize + CONFIG.tileSize/2 - 30, 36, 5, 0x00ff00);
        
        this.targetMarker = this.add.circle(start.x * CONFIG.tileSize, start.y * CONFIG.tileSize + CONFIG.tileSize/2, 8, 0xffff00, 0.5);
        this.targetMarker.setVisible(false);
        
        this.gameState.heroTargetX = start.x * CONFIG.tileSize;
        this.gameState.heroTargetY = start.y * CONFIG.tileSize + CONFIG.tileSize/2;
        
        // 英雄行为树
        this.heroBehaviorTree = new BehaviorTree();
        this.heroBehaviorTree.root = new Selector([
            new Sequence([
                new Condition((e) => e.targetEnemy && e.inRange),
                new Action((e, delta) => {
                    this.heroAttack(e.targetEnemy);
                    return 'success';
                })
            ]),
            new Sequence([
                new Condition((e) => e.hasPath),
                new Action((e, delta) => {
                    this.followPath(delta);
                    return 'running';
                })
            ]),
            new Action((e, delta) => 'failure')
        ]);
    }

    createUI() {
        this.goldText = this.add.text(20, 20, '金: 100', { fontSize: '18px', color: '#ffd700', backgroundColor: '#00000088', padding: { x: 10, y: 5 } });
        this.costText = this.add.text(20, 50, '點: 5', { fontSize: '18px', color: '#4ecdc4', backgroundColor: '#00000088', padding: { x: 10, y: 5 } });
        this.waveText = this.add.text(20, 80, '波: 1', { fontSize: '18px', color: '#ffffff', backgroundColor: '#00000088', padding: { x: 10, y: 5 } });
        this.baseHpText = this.add.text(650, 20, '基: 10/10', { fontSize: '18px', color: '#ff0000', backgroundColor: '#00000088', padding: { x: 10, y: 5 } });
        
        this.add.text(20, 550, '演算法: A* | BFS | 行為樹 | 狀態機', { fontSize: '12px', color: '#4ecdc4' });
        this.add.text(20, 570, '點地:移動 | 點部署點:塔 | 點敵:攻擊', { fontSize: '12px', color: '#888888' });
    }

    updateUI() {
        this.goldText.setText(`金: ${this.gameState.gold}`);
        this.costText.setText(`點: ${this.gameState.cost}`);
        this.waveText.setText(`波: ${this.gameState.wave}`);
        this.baseHpText.setText(`基: ${this.gameState.baseHp}/${this.gameState.maxBaseHp}`);
    }

    updateHero(delta, time) {
        // 准备行为树输入
        const heroEntity = {
            x: this.hero.x,
            y: this.hero.y,
            targetX: this.gameState.heroTargetX,
            targetY: this.gameState.heroTargetY,
            hasPath: this.gameState.heroPath.length > 0,
            targetEnemy: this.findNearestEnemyInRange(80),
            inRange: false,
            get inRange() {
                return this.targetEnemy !== null;
            }
        };
        
        // 运行行为树
        this.heroBehaviorTree.run(heroEntity, delta);
        
        // 基础移动
        this.hero.x = Phaser.Math.Clamp(this.hero.x, 20, 780);
        this.hero.y = Phaser.Math.Clamp(this.hero.y, 20, 580);
        
        this.heroText.x = this.hero.x - 15;
        this.heroText.y = this.hero.y - 5;
        this.heroHpBar.x = this.hero.x;
        this.heroHpBar.y = this.hero.y - 30;
    }
    
    followPath(delta) {
        if (this.gameState.heroPath.length === 0) return;
        
        const speed = 150;
        const target = this.gameState.heroPath[this.gameState.heroPathIndex];
        const tx = target.x * CONFIG.tileSize + CONFIG.tileSize/2;
        const ty = target.y * CONFIG.tileSize + CONFIG.tileSize/2;
        
        const dx = tx - this.hero.x;
        const dy = ty - this.hero.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 5) {
            this.gameState.heroPathIndex++;
            if (this.gameState.heroPathIndex >= this.gameState.heroPath.length) {
                this.gameState.heroPath = [];
                this.gameState.heroPathIndex = 0;
                this.targetMarker.setVisible(false);
            }
        } else {
            this.hero.x += (dx / dist) * speed * delta / 1000;
            this.hero.y += (dy / dist) * speed * delta / 1000;
        }
    }

    findNearestEnemyInRange(range) {
        let nearest = null;
        let minDist = range;
        
        for (const enemy of this.gameState.enemies) {
            const dist = Phaser.Math.Distance.Between(this.hero.x, this.hero.y, enemy.sprite.x, enemy.sprite.y);
            if (dist < minDist) {
                minDist = dist;
                nearest = enemy;
            }
        }
        return nearest;
    }

    handleClick(pointer) {
        if (this.gameState.isGameOver) return;
        
        // 检查部署点
        for (const point of this.deployPointGraphics) {
            if (point.getBounds().contains(pointer.x, pointer.y)) {
                this.deployTower(point.pointData, point.pointIndex);
                return;
            }
        }
        
        // 检查敌人
        for (const enemy of this.gameState.enemies) {
            const dist = Phaser.Math.Distance.Between(this.hero.x, this.hero.y, enemy.sprite.x, enemy.sprite.y);
            if (dist < 80 && this.gameState.heroCooldown <= 0) {
                this.heroAttack(enemy);
                return;
            }
        }
        
        // A* 寻路移动
        const startX = Math.floor(this.hero.x / CONFIG.tileSize);
        const startY = Math.floor(this.hero.y / CONFIG.tileSize);
        const endX = Math.floor(pointer.x / CONFIG.tileSize);
        const endY = Math.floor(pointer.y / CONFIG.tileSize);
        
        const path = this.astar.findPath({x: startX, y: startY}, {x: endX, y: endY});
        
        if (path.length > 0) {
            this.gameState.heroPath = path;
            this.gameState.heroPathIndex = 0;
            
            this.gameState.heroTargetX = pointer.x;
            this.gameState.heroTargetY = pointer.y;
            this.targetMarker.x = pointer.x;
            this.targetMarker.y = pointer.y;
            this.targetMarker.setVisible(true);
            
            this.showMessage('A*', pointer.x, pointer.y - 20, '#00ff00');
        } else {
            this.showMessage('無法到達', pointer.x, pointer.y - 20, '#ff0000');
        }
    }

    deployTower(pointData, index) {
        if (this.gameState.cost < 5) {
            this.showMessage('點數不足!', pointData.x, pointData.y - 30, '#ff0000');
            return;
        }
        
        if (this.gameState.towers[index]) {
            this.showMessage('已有塔!', pointData.x, pointData.y - 30, '#ff8800');
            return;
        }
        
        this.gameState.cost -= 5;
        
        const tower = {
            sprite: this.add.rectangle(pointData.x, pointData.y, 35, 35, 0x4ecdc4),
            text: this.add.text(pointData.x - 10, pointData.y - 8, '塔', { fontSize: '14px', fontStyle: 'bold', color: '#000000' }),
            damage: 20,
            range: 100,
            attackCooldown: 0,
            pointIndex: index,
            rangeGraphic: this.add.circle(pointData.x, pointData.y, tower?.range || 100, 0x4ecdc4, 0.1)
        };
        
        if (tower.rangeGraphic) tower.rangeGraphic.setVisible(false);
        
        this.gameState.towers[index] = tower;
        
        // 范围显示切换
        tower.sprite.setInteractive();
        tower.sprite.on('pointerover', () => {
            if (tower.rangeGraphic) tower.rangeGraphic.setVisible(true);
        });
        tower.sprite.on('pointerout', () => {
            if (tower.rangeGraphic) tower.rangeGraphic.setVisible(false);
        });
        
        this.showMessage('塔!', pointData.x, pointData.y - 30, '#4ecdc4');
    }

    heroAttack(enemy) {
        this.gameState.heroCooldown = 500;
        
        const graphics = this.add.graphics();
        graphics.lineStyle(3, 0xff6b35, 1);
        graphics.lineBetween(this.hero.x, this.hero.y, enemy.sprite.x, enemy.sprite.y);
        this.time.delayedCall(100, () => graphics.destroy());
        
        enemy.hp -= 30;
        this.showDamage(enemy.sprite.x, enemy.sprite.y - 20, '30');
        
        if (enemy.hp <= 0) this.killEnemy(enemy, true);
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
        
        // 为每个敌人创建行为树
        const enemyBehaviorTree = new BehaviorTree();
        enemyBehaviorTree.root = new Selector([
            new Sequence([
                new Condition((e) => e.distanceToBase < 2),
                new Action((e, delta) => {
                    this.gameState.baseHp -= 1;
                    this.showMessage('漏!', 700, 300, '#ff0000');
                    if (this.gameState.baseHp <= 0) this.gameOver();
                    return 'success';
                })
            ]),
            new Sequence([
                new Condition((e) => e.health < 30),
                new Action((e, delta) => {
                    // 逃跑逻辑
                    e.speed *= 1.5;
                    return 'running';
                })
            ]),
            new Action((e, delta) => {
                // 正常移动
                this.moveAlongPath(e, delta);
                return 'running';
            })
        ]);
        
        const enemy = {
            sprite: this.add.circle(start.x * CONFIG.tileSize, start.y * CONFIG.tileSize + CONFIG.tileSize/2, 15, type.color),
            text: this.add.text(start.x * CONFIG.tileSize - 8, start.y * CONFIG.tileSize + CONFIG.tileSize/2 - 5, type.name, { fontSize: '12px', color: '#ffffff' }),
            hp: type.hp,
            maxHp: type.hp,
            speed: type.speed,
            reward: type.reward,
            pathIndex: 0,
            behaviorTree: enemyBehaviorTree,
            distanceToBase: 999
        };
        
        this.gameState.enemies.push(enemy);
    }

    updateEnemyAI(enemy, delta) {
        // 计算到基地距离 (BFS)
        const ex = Math.floor(enemy.sprite.x / CONFIG.tileSize);
        const ey = Math.floor(enemy.sprite.y / CONFIG.tileSize);
        const bfs = new BFS();
        const reachable = bfs.findAllReachable({x: ex, y: ey});
        enemy.distanceToBase = Math.min(...reachable.map(p => Math.abs(p.x - 19) + Math.abs(p.y - 7)));
        
        // 运行行为树
        enemy.behaviorTree.run(enemy, delta);
    }

    moveAlongPath(enemy, delta) {
        const targetPoint = this.pathPoints[enemy.pathIndex + 1];
        if (!targetPoint) {
            this.killEnemy(enemy, false);
            return;
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
                    this.towerAttack(tower, target);
                    tower.attackCooldown = 1000;
                }
            }
        }
    }

    towerAttack(tower, target) {
        const graphics = this.add.graphics();
        graphics.lineStyle(2, 0x4ecdc4, 1);
        graphics.lineBetween(tower.sprite.x, tower.sprite.y, target.sprite.x, target.sprite.y);
        this.time.delayedCall(100, () => graphics.destroy());
        
        target.hp -= tower.damage;
        this.showDamage(target.sprite.x, target.sprite.y - 20, tower.damage.toString());
        
        if (target.hp <= 0) this.killEnemy(target, true);
    }

    killEnemy(enemy, getReward) {
        if (getReward) {
            this.gameState.gold += enemy.reward;
            this.gameState.cost += 2;
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
