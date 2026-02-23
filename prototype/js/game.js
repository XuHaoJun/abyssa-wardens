// Abyssal Wardens 原型 - Task 2: 完整幹員部署系統

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

// 幹員類型定義
const OPERATOR_TYPES = {
    TNK: { name: '重裝', icon: '🛡️', hp: 500, atk: 15, range: 60, block: 3, cost: 5, color: 0x4a90d9 },
    MEL: { name: '近衛', icon: '⚔️', hp: 300, atk: 25, range: 70, block: 2, cost: 4, color: 0xd94a4a },
    RNG: { name: '狙擊', icon: '🏹', hp: 150, atk: 35, range: 150, block: 0, cost: 4, color: 0x4ad94a },
    MAG: { name: '術士', icon: '🔥', hp: 120, atk: 40, range: 120, block: 0, cost: 5, color: 0x9b4ad9 },
    SUP: { name: '輔助', icon: '💚', hp: 100, atk: 10, range: 100, block: 0, cost: 3, color: 0xd94ad4 }
};

class AStar {
    constructor() { this.obstacles = []; }
    heuristic(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }
    getNeighbors(node) {
        const dirs = [{x: 0, y: -1}, {x: 1, y: 0}, {x: 0, y: 1}, {x: -1, y: 0}];
        const neighbors = [];
        for (const dir of dirs) {
            const nx = node.x + dir.x, ny = node.y + dir.y;
            if (nx >= 0 && nx < CONFIG.cols && ny >= 0 && ny < CONFIG.rows) {
                if (!this.isObstacle(nx, ny)) neighbors.push({x: nx, y: ny});
            }
        }
        return neighbors;
    }
    isObstacle(x, y) { return this.obstacles.some(o => o.x === x && o.y === y); }
    findPath(start, end) {
        const openSet = [start], closedSet = new Set(), cameFrom = new Map(), gScore = new Map(), fScore = new Map();
        const key = n => `${n.x},${n.y}`;
        gScore.set(key(start), 0); fScore.set(key(start), this.heuristic(start, end));
        while (openSet.length > 0) {
            openSet.sort((a, b) => (fScore.get(key(a)) || Infinity) - (fScore.get(key(b)) || Infinity));
            const current = openSet.shift();
            if (current.x === end.x && current.y === end.y) {
                const path = [current];
                while (cameFrom.has(key(current))) { current = cameFrom.get(key(current)); path.unshift(current); }
                return path;
            }
            closedSet.add(key(current));
            for (const neighbor of this.getNeighbors(current)) {
                if (closedSet.has(key(neighbor))) continue;
                const tentativeG = (gScore.get(key(current)) || Infinity) + 1;
                if (!openSet.find(n => n.x === neighbor.x && n.y === neighbor.y)) openSet.push(neighbor);
                else if (tentativeG >= (gScore.get(key(neighbor)) || Infinity)) continue;
                cameFrom.set(key(neighbor), current);
                gScore.set(key(neighbor), tentativeG);
                fScore.set(key(neighbor), tentativeG + this.heuristic(neighbor, end));
            }
        }
        return [];
    }
}

class MainScene extends Phaser.Scene {
    constructor() { super({ key: 'MainScene' }); }

    create() {
        this.astar = new AStar();
        this.astar.obstacles = [{x: 5, y: 7}, {x: 6, y: 7}, {x: 7, y: 7}];
        
        this.hero = { hp: 100, maxHp: 100, x: 80, y: 300, speed: 150,
            skills: {
                basic: { damage: 30, cooldown: 500, range: 80 },
                dash: { damage: 20, cooldown: 3000, distance: 120, ready: true, lastUsed: 0 },
                ultimate: { damage: 200, cooldown: 15000, range: 150, ready: true, charge: 0, maxCharge: 100, lastUsed: 0 }
            },
            isDashing: false, targetPath: [], pathIndex: 0
        };
        
        this.deploymentPoints = 5;
        this.gameState = { gold: 100, exp: 0, wave: 1, baseHp: 10, maxBaseHp: 10, enemies: [], towers: [], isGameOver: false };
        
        this.keys = {};
        [Phaser.Input.Keyboard.KeyCodes.Q, Phaser.Input.Keyboard.KeyCodes.E, Phaser.Input.Keyboard.KeyCodes.R,
         Phaser.Input.Keyboard.KeyCodes.ONE, Phaser.Input.Keyboard.KeyCodes.TWO, Phaser.Input.Keyboard.KeyCodes.THREE,
         Phaser.Input.Keyboard.KeyCodes.FOUR, Phaser.Input.Keyboard.KeyCodes.FIVE].forEach(k => {
            this.keys[k] = this.input.keyboard.addKey(k);
        });
        
        this.selectedOperatorType = 'TNK';
        
        this.drawBackground();
        this.drawPath();
        this.drawDeployPoints();
        this.drawObstacles();
        this.createHero();
        this.createUI();
        this.createSkillBar();
        
        this.spawnTimer = this.time.addEvent({ delay: 2500, callback: this.spawnEnemy, callbackScope: this, loop: true });
        this.input.on('pointerdown', this.handleClick, this);
        this.input.mouse.disableContextMenu();
    }

    update(time, delta) {
        if (this.gameState.isGameOver) return;
        this.updateHero(delta, time);
        this.updateSkills(time);
        this.updateBlockers();
        this.updateEnemies(delta);
        this.updateTowers(delta);
        this.updateUI();
    }

    drawBackground() { this.add.grid(400, 300, 800, 600, CONFIG.tileSize, CONFIG.tileSize, 0x1a1a2e, 0.5, 0x2a2a4e, 0.3); }

    drawPath() {
        this.pathPoints = [{x: 0, y: 7}, {x: 4, y: 7}, {x: 4, y: 3}, {x: 10, y: 3}, {x: 10, y: 11}, {x: 15, y: 11}, {x: 15, y: 7}, {x: 20, y: 7}];
        const g = this.add.graphics();
        g.lineStyle(20, 0x4a4a6e, 1);
        g.beginPath();
        for (let i = 0; i < this.pathPoints.length; i++) {
            const px = this.pathPoints[i].x * CONFIG.tileSize, py = this.pathPoints[i].y * CONFIG.tileSize + CONFIG.tileSize/2;
            if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
        }
        g.strokePath();
        const end = this.pathPoints[7];
        this.add.rectangle(end.x * CONFIG.tileSize, end.y * CONFIG.tileSize + CONFIG.tileSize/2, 60, 60, 0xff0000, 0.3);
    }

    drawObstacles() {
        for (const obs of this.astar.obstacles) {
            this.add.rectangle(obs.x * CONFIG.tileSize + 20, obs.y * CONFIG.tileSize + 20, 40, 40, 0x888888, 0.5);
        }
    }

    drawDeployPoints() {
        this.deployPointGraphics = [];
        for (let i = 0; i < CONFIG.deployPoints.length; i++) {
            const point = CONFIG.deployPoints[i];
            const color = point.type === 'highground' ? 0x4ecdc4 : 0xffe66d;
            const rect = this.add.rectangle(point.x, point.y, 35, 35, color, 0.4).setStrokeStyle(2, color).setInteractive();
            rect.pointData = point; rect.pointIndex = i;
            this.deployPointGraphics.push(rect);
            this.add.text(point.x - 10, point.y - 5, point.type === 'highground' ? '高' : '平', { fontSize: '12px', color: '#fff' });
        }
    }

    createHero() {
        this.heroSprite = this.add.circle(80, 300, 20, 0xff6b35);
        this.heroText = this.add.text(65, 295, '英', { fontSize: '14px', fontStyle: 'bold', color: '#fff' });
        this.heroHpBar = this.add.rectangle(80, 265, 40, 6, 0x00ff00);
        this.heroHpBarBg = this.add.rectangle(80, 265, 40, 6, 0x333).setStrokeStyle(1, 0xfff);
        this.targetMarker = this.add.circle(80, 300, 8, 0xffff00, 0.5).setVisible(false);
        this.attackRangeGraphic = this.add.circle(80, 300, 80, 0xff6b35, 0.1).setVisible(false);
    }

    createUI() {
        this.goldText = this.add.text(20, 20, '金: 100', { fontSize: '18px', color: '#ffd700', backgroundColor: '#0008', padding: {x:10,y:5} });
        this.costText = this.add.text(20, 50, '點: 5', { fontSize: '18px', color: '#4ecdc4', backgroundColor: '#0008', padding: {x:10,y:5} });
        this.waveText = this.add.text(20, 80, '波: 1', { fontSize: '18px', color: '#fff', backgroundColor: '#0008', padding: {x:10,y:5} });
        this.baseHpText = this.add.text(650, 20, '基: 10/10', { fontSize: '18px', color: '#f00', backgroundColor: '#0008', padding: {x:10,y:5} });
        this.add.text(20, 110, '統帥值:', { fontSize: '14px', color: '#ff6b35' });
        this.ultBar = this.add.rectangle(50, 118, 0, 10, 0xff6b35);
        
        // 幹員選擇UI
        this.add.text(200, 530, '按鍵 1-5 選擇:', { fontSize: '14px', color: '#888' });
        const types = ['TNK','MEL','RNG','MAG','SUP'];
        const icons = ['🛡️','⚔️','🏹','🔥','💚'];
        for(let i=0; i<5; i++) {
            this.add.rectangle(350 + i*50, 560, 40, 30, OPERATOR_TYPES[types[i]].color, 0.5).setStrokeStyle(1, i===0?'#0f0':'#444');
            this.add.text(340 + i*50, 550, `${i+1}:${icons[i]}`, { fontSize: '12px', color: '#fff' });
        }
        
        this.add.text(20, 550, '左鍵:移動/部署 | 右鍵:撤退', { fontSize: '12px', color: '#888' });
    }

    createSkillBar() {
        const barY = 560, barX = 600;
        this.skillQ = this.add.rectangle(barX, barY, 36, 36, 0x4ecdc4).setStrokeStyle(2, 0x0f0);
        this.skillE = this.add.rectangle(barX+50, barY, 36, 36, 0xffe66d).setStrokeStyle(2, 0x0f0);
        this.skillR = this.add.rectangle(barX+100, barY, 36, 36, 0xff6b35).setStrokeStyle(2, 0x0f0);
        this.add.text(barX-12, barY-8, 'Q', {fontSize:'20px',fontStyle:'bold',color:'#000'});
        this.add.text(barX+38, barY-8, 'E', {fontSize:'20px',fontStyle:'bold',color:'#000'});
        this.add.text(barX+88, barY-8, 'R', {fontSize:'20px',fontStyle:'bold',color:'#000'});
        this.skillQCooldown = this.add.rectangle(barX, barY, 36, 36, 0x000, 0.7).setVisible(false);
        this.skillRCooldown = this.add.rectangle(barX+100, barY, 36, 36, 0x000, 0.7).setVisible(false);
    }

    updateSkills(time) {
        const s = this.hero.skills;
        if (!s.dash.ready) {
            const cd = Math.max(0, (s.dash.lastUsed + s.dash.cooldown) - time);
            if (cd > 0) { this.skillQCooldown.setVisible(true); this.skillQCooldown.height = 36 * (cd / s.dash.cooldown); }
            else { s.dash.ready = true; this.skillQCooldown.setVisible(false); this.skillQ.setStrokeStyle(2, '#0f0'); }
        }
        if (!s.ultimate.ready) {
            const cd = Math.max(0, (s.ultimate.lastUsed + s.ultimate.cooldown) - time);
            if (cd > 0) { this.skillRCooldown.setVisible(true); this.skillRCooldown.height = 36 * (cd / s.ultimate.cooldown); }
            else { s.ultimate.ready = true; this.skillRCooldown.setVisible(false); this.skillR.setStrokeStyle(2, '#0f0'); }
        }
        const p = s.ultimate.charge / s.ultimate.maxCharge;
        this.ultBar.width = 100 * p; this.ultBar.x = 50 + 50 * p;
        
        // 選擇幹員
        if (Phaser.Input.Keyboard.JustDown(this.keys[Phaser.Input.Keyboard.KeyCodes.ONE])) this.selectedOperatorType = 'TNK';
        if (Phaser.Input.Keyboard.JustDown(this.keys[Phaser.Input.Keyboard.KeyCodes.TWO])) this.selectedOperatorType = 'MEL';
        if (Phaser.Input.Keyboard.JustDown(this.keys[Phaser.Input.Keyboard.KeyCodes.THREE])) this.selectedOperatorType = 'RNG';
        if (Phaser.Input.Keyboard.JustDown(this.keys[Phaser.Input.Keyboard.KeyCodes.FOUR])) this.selectedOperatorType = 'MAG';
        if (Phaser.Input.Keyboard.JustDown(this.keys[Phaser.Input.Keyboard.KeyCodes.FIVE])) this.selectedOperatorType = 'SUP';
    }

    updateHero(delta, time) {
        if (Phaser.Input.Keyboard.JustDown(this.keys[Phaser.Input.Keyboard.KeyCodes.Q])) this.useDash(time);
        if (Phaser.Input.Keyboard.JustDown(this.keys[Phaser.Input.Keyboard.KeyCodes.E])) this.useBasicAttack(time);
        if (Phaser.Input.Keyboard.JustDown(this.keys[Phaser.Input.Keyboard.KeyCodes.R])) this.useUltimate(time);
        
        if (this.hero.targetPath.length > 0) {
            const t = this.hero.targetPath[this.hero.pathIndex];
            const tx = t.x * 40 + 20, ty = t.y * 40 + 20;
            const dx = tx - this.heroSprite.x, dy = ty - this.heroSprite.y, d = Math.sqrt(dx*dx+dy*dy);
            if (d < 5) { this.hero.pathIndex++; if (this.hero.pathIndex >= this.hero.targetPath.length) { this.hero.targetPath = []; this.targetMarker.setVisible(false); this.attackRangeGraphic.setVisible(false); } }
            else { const sp = this.hero.isDashing ? this.hero.speed * 2.5 : this.hero.speed; this.heroSprite.x += dx/d * sp * delta/1000; this.heroSprite.y += dy/d * sp * delta/1000; }
        }
        this.heroSprite.x = Phaser.Math.Clamp(this.heroSprite.x, 20, 780); this.heroSprite.y = Phaser.Math.Clamp(this.heroSprite.y, 20, 550);
        this.heroText.x = this.heroSprite.x - 15; this.heroText.y = this.heroSprite.y - 5;
        this.heroHpBar.x = this.heroSprite.x; this.heroHpBar.y = this.heroSprite.y - 35; this.heroHpBar.width = 40 * (this.hero.hp/this.hero.maxHp);
    }

    useBasicAttack(time) {
        let target = null, minDist = this.hero.skills.basic.range;
        for (const e of this.gameState.enemies) {
            const d = Phaser.Math.Distance.Between(this.heroSprite.x, this.heroSprite.y, e.sprite.x, e.sprite.y);
            if (d < minDist) { minDist = d; target = e; }
        }
        if (target) {
            const g = this.add.graphics(); g.lineStyle(3, 0xffe66d, 1); g.lineBetween(this.heroSprite.x, this.heroSprite.y, target.sprite.x, target.sprite.y);
            this.time.delayedCall(100, () => g.destroy());
            target.hp -= this.hero.skills.basic.damage;
            this.showDamage(target.sprite.x, target.sprite.y - 20, this.hero.skills.basic.damage);
            this.hero.skills.ultimate.charge = Math.min(100, this.hero.skills.ultimate.charge + 5);
            if (target.hp <= 0) this.killEnemy(target, true);
        }
    }
    
    useDash(time) {
        if (!this.hero.skills.dash.ready) return;
        const p = this.input.activePointer;
        this.hero.isDashing = true; this.hero.skills.dash.lastUsed = time; this.hero.skills.dash.ready = false;
        const dx = p.x - this.heroSprite.x, dy = p.y - this.heroSprite.y, d = Math.sqrt(dx*dx+dy*dy);
        if (d > 0) { const dd = Math.min(120, d); this.heroSprite.x += dx/d * dd; this.heroSprite.y += dy/d * dd; }
        for (const e of this.gameState.enemies) {
            if (Phaser.Math.Distance.Between(this.heroSprite.x, this.heroSprite.y, e.sprite.x, e.sprite.y) < 50) {
                e.hp -= 20; this.showDamage(e.sprite.x, e.sprite.y - 20, 20); if (e.hp <= 0) this.killEnemy(e, true);
            }
        }
        this.time.delayedCall(300, () => this.hero.isDashing = false);
    }
    
    useUltimate(time) {
        if (!this.hero.skills.ultimate.ready || this.hero.skills.ultimate.charge < 100) return;
        this.hero.skills.ultimate.lastUsed = time; this.hero.skills.ultimate.ready = false; this.hero.skills.ultimate.charge = 0;
        const r = this.hero.skills.ultimate.range, g = this.add.circle(this.heroSprite.x, this.heroSprite.y, r, 0xff6b35, 0.3);
        let c = 0;
        for (const e of this.gameState.enemies) {
            if (Phaser.Math.Distance.Between(this.heroSprite.x, this.heroSprite.y, e.sprite.x, e.sprite.y) < r) {
                e.hp -= 200; this.showDamage(e.sprite.x, e.sprite.y - 20, 200); c++; if (e.hp <= 0) this.killEnemy(e, true);
            }
        }
        this.cameras.main.shake(200, 0.01); this.time.delayedCall(500, () => g.destroy());
    }

    handleClick(pointer) {
        if (this.gameState.isGameOver) return;
        
        // 右鍵撤退
        if (pointer.rightButtonDown()) {
            for (let i = 0; i < this.gameState.towers.length; i++) {
                const t = this.gameState.towers[i];
                if (t && t.sprite.getBounds().contains(pointer.x, pointer.y)) {
                    this.retreatTower(i); return;
                }
            }
            return;
        }
        
        // 部署
        for (const pt of this.deployPointGraphics) {
            if (pt.getBounds().contains(pointer.x, pointer.y)) { this.deployTower(pt.pointData, pt.pointIndex); return; }
        }
        
        // 移動
        const path = this.astar.findPath({x: Math.floor(this.heroSprite.x/40), y: Math.floor(this.heroSprite.y/40)}, {x: Math.floor(pointer.x/40), y: Math.floor(pointer.y/40)});
        if (path.length > 0) { this.hero.targetPath = path; this.hero.pathIndex = 0; this.targetMarker.setPosition(pointer.x, pointer.y).setVisible(true); this.attackRangeGraphic.setPosition(pointer.x, pointer.y).setVisible(true); }
    }

    deployTower(pd, idx) {
        const op = OPERATOR_TYPES[this.selectedOperatorType];
        if (this.deploymentPoints < op.cost) { this.showMessage(`不足!`, pd.x, pd.y-30,'#f00'); return; }
        if (this.gameState.towers[idx]) { this.showMessage('已有!', pd.x, pd.y-30,'#f80'); return; }
        
        const isHigh = pd.type === 'highground';
        if (isHigh && (this.selectedOperatorType === 'TNK' || this.selectedOperatorType === 'MEL')) { this.showMessage('需平地!', pd.x, pd.y-30,'#f80'); return; }
        if (!isHigh && (this.selectedOperatorType === 'RNG' || this.selectedOperatorType === 'MAG')) { this.showMessage('需高台!', pd.x, pd.y-30,'#f80'); return; }
        
        this.deploymentPoints -= op.cost;
        
        const tower = {
            type: this.selectedOperatorType,
            sprite: this.add.rectangle(pd.x, pd.y, 35, 35, op.color).setInteractive(),
            text: this.add.text(pd.x-10, pd.y-8, op.icon, {fontSize:'16px'}),
            hp: op.hp, maxHp: op.hp, atk: op.atk, range: op.range, block: op.block, cost: op.cost,
            attackCooldown: 0, pointIndex: idx,
            hpBar: this.add.rectangle(pd.x, pd.y-30, 30, 4, 0x0f0),
            rangeG: this.add.circle(pd.x, pd.y, op.range, op.color, 0.1).setVisible(false)
        };
        
        tower.sprite.on('pointerover', () => tower.rangeG.setVisible(true));
        tower.sprite.on('pointerout', () => tower.rangeG.setVisible(false));
        
        this.gameState.towers[idx] = tower;
        this.showMessage(`${op.icon}`, pd.x, pd.y-30, '#'+op.color.toString(16));
    }

    retreatTower(idx) {
        const t = this.gameState.towers[idx];
        if (!t) return;
        this.showMessage('撤退!', t.sprite.x, t.sprite.y-30, '#f80');
        this.deploymentPoints += Math.floor(t.cost * 0.5);
        t.sprite.destroy(); t.text.destroy(); t.hpBar.destroy(); t.rangeG.destroy();
        this.gameState.towers[idx] = null;
    }

    updateBlockers() {
        for (const e of this.gameState.enemies) e.blocked = false;
        for (const t of this.gameState.towers) {
            if (!t) continue;
            const blocked = this.gameState.enemies.filter(e => !e.blocked && Phaser.Math.Distance.Between(t.sprite.x, t.sprite.y, e.sprite.x, e.sprite.y) < t.range + 20);
            for (let i = 0; i < Math.min(blocked.length, t.block); i++) blocked[i].blocked = true;
        }
    }

    spawnEnemy() {
        if (this.gameState.isGameOver) return;
        const types = [{n:'哥',h:50,s:40,c:0x0f0,r:10},{n:'獸',h:100,s:30,c:0xf80,r:20},{n:'幽',h:40,s:50,c:0x80f,r:15}];
        const t = types[Math.floor(Math.random()*3)];
        const sp = this.pathPoints[0];
        const e = { sprite: this.add.circle(sp.x*40, sp.y*40+20, 15, t.c), text: this.add.text(sp.x*40-8, sp.y*40+15, t.n,{fontSize:'12px',color:'#fff'}),
            hp:t.h, maxHp:t.h, speed:t.s, reward:t.r, pathIndex:0, blocked:false };
        this.gameState.enemies.push(e);
    }

    updateEnemies(delta) {
        for (let i = this.gameState.enemies.length - 1; i >= 0; i--) {
            const e = this.gameState.enemies[i];
            if (e.blocked && e.blocker && e.blocker.hp > 0) {
                e.blocker.hp -= 0.5 * delta/1000;
                e.blocker.hpBar.width = 30 * (e.blocker.hp / e.blocker.maxHp);
                if (e.blocker.hp <= 0) this.destroyTower(e.blocker.pointIndex);
                continue;
            }
            const tp = this.pathPoints[e.pathIndex + 1];
            if (!tp) { this.gameState.baseHp--; this.showMessage('漏!',700,300,'#f00'); e.sprite.destroy(); e.text.destroy(); this.gameState.enemies.splice(i,1); if(this.gameState.baseHp<=0)this.gameOver(); continue; }
            const tx = tp.x*40, ty = tp.y*40+20, dx=tx-e.sprite.x, dy=ty-e.sprite.y, d=Math.sqrt(dx*dx+dy*dy);
            if(d<5) e.pathIndex++; else { e.sprite.x+=dx/d*e.speed*delta/1000; e.sprite.y+=dy/d*e.speed*delta/1000; }
            e.text.x=e.sprite.x-8; e.text.y=e.sprite.y-5;
        }
    }

    updateTowers(delta) {
        for (const t of this.gameState.towers) {
            if (!t) continue;
            t.attackCooldown -= delta;
            if (t.attackCooldown <= 0) {
                let target = null, minD = t.range;
                for (const e of this.gameState.enemies) {
                    const d = Phaser.Math.Distance.Between(t.sprite.x, t.sprite.y, e.sprite.x, e.sprite.y);
                    if (d < minD) { minD = d; target = e; }
                }
                if (target) {
                    const g = this.add.graphics(); g.lineStyle(2, t.rangeG.fillColor, 1); g.lineBetween(t.sprite.x, t.sprite.y, target.sprite.x, target.sprite.y);
                    this.time.delayedCall(100, () => g.destroy());
                    target.hp -= t.atk; this.showDamage(target.sprite.x, target.sprite.y-20, t.atk);
                    if (target.hp <= 0) this.killEnemy(target, true);
                    t.attackCooldown = 1000;
                }
            }
        }
    }

    destroyTower(idx) {
        const t = this.gameState.towers[idx];
        if (!t) return;
        this.showMessage('💥', t.sprite.x, t.sprite.y, '#f00');
        t.sprite.destroy(); t.text.destroy(); t.hpBar.destroy(); t.rangeG.destroy();
        this.gameState.towers[idx] = null;
    }

    killEnemy(e, r) {
        if (r) { this.gameState.gold += e.reward; this.deploymentPoints += 2; this.gameState.exp += 10;
            this.showMessage(`+${e.reward}`, e.sprite.x, e.sprite.y-30, '#fd0');
            if (this.gameState.exp >= this.gameState.wave*50) { this.gameState.wave++; this.showMessage(`波${this.gameState.wave}!`,400,100,'#4ecdc4'); } }
        e.sprite.destroy(); e.text.destroy();
        const i = this.gameState.enemies.indexOf(e); if(i>-1) this.gameState.enemies.splice(i,1);
    }

    updateUI() {
        this.goldText.setText(`金: ${this.gameState.gold}`);
        this.costText.setText(`點: ${this.deploymentPoints}`);
        this.waveText.setText(`波: ${this.gameState.wave}`);
        this.baseHpText.setText(`基: ${this.gameState.baseHp}/10`);
    }

    showDamage(x, y, t) {
        const dmg = this.add.text(x, y, `-${t}`, {fontSize:'16px',color:'#f00',fontStyle:'bold'});
        this.tweens.add({targets:dmg, y:y-30, alpha:0, duration:500, onComplete:()=>dmg.destroy()});
    }

    showMessage(text, x, y, color = '#fff') {
        const msg = this.add.text(x, y, text, {fontSize:'16px',color:color,fontStyle:'bold',stroke:'#000',strokeThickness:3});
        this.tweens.add({targets:msg, y:y-30, alpha:0, duration:1000, onComplete:()=>msg.destroy()});
    }

    gameOver() {
        this.gameState.isGameOver = true;
        this.add.rectangle(400,300,400,200,0x000,0.8);
        this.add.text(400,260,'遊戲結束',{fontSize:'32px',color:'#f00',fontStyle:'bold'}).setOrigin(0.5);
        this.add.text(400,320,`波次:${this.gameState.wave}`,{fontSize:'18px',color:'#fff'}).setOrigin(0.5);
        const btn = this.add.text(400,370,'點擊重新開始',{fontSize:'16px',color:'#4ecdc4',backgroundColor:'#333',padding:{x:10,y:5}}).setOrigin(0.5).setInteractive();
        btn.on('pointerdown', () => this.scene.restart());
    }
}

const config = { type: Phaser.AUTO, width: 800, height: 600, parent: 'game-container', backgroundColor: '#1a1a2e', scene: MainScene };
const game = new Phaser.Game(config);
