// Abyssal Wardens 原型 - Task 4: 波次與精英怪
const CONFIG = { width:800, height:600, tileSize:40, cols:20, rows:15,
    deployPoints:[{x:100,y:200,type:'ground'},{x:100,y:400,type:'ground'},{x:300,y:200,type:'highground'},{x:300,y:400,type:'highground'},{x:500,y:200,type:'highground'},{x:500,y:400,type:'highground'},{x:700,y:200,type:'ground'},{x:700,y:400,type:'ground'}] };

const ELITE_AFFIXES = {
    FROST:{name:'冰',icon:'❄️',color:0x00ffff,effect:'減速30%',duration:2000},
    ARMOR:{name:'盾',icon:'🛡️',color:0x888888,effect:'護甲+50',hpBonus:1.5},
    FIRE:{name:'火',icon:'🔥',color:0xff4400,effect:'死亡爆炸',dmg:50,range:60},
    HEAL:{name:'癒',icon:'💚',color:0x00ff00,effect:'每秒回血'}
};

// GDD 裝備系統
const GEM_TYPES = {
    SKILL_FIREBALL:{name:'火球',icon:'🔥',type:'skill',damage:50,cooldown:1000,range:150},
    SKILL_ICE:{name:'冰霜',icon:'❄️',type:'skill',damage:30,cooldown:800,range:120,slow:0.3},
    SKILL_LIGHTNING:{name:'閃電',icon:'⚡',type:'skill',damage:40,cooldown:600,range:130},
    SKILL_POISON:{name:'劇毒',icon:'☠️',type:'skill',damage:25,cooldown:700,range:100},
    OP_TNK:{name:'重裝',icon:'🛡️',type:'operator',hp:500,atk:15,range:60,block:3,cost:5,color:0x4a90d9},
    OP_MEL:{name:'近衛',icon:'⚔️',type:'operator',hp:300,atk:25,range:70,block:2,cost:4,color:0xd94a4a},
    OP_RNG:{name:'狙擊',icon:'🏹',type:'operator',hp:150,atk:35,range:150,block:0,cost:4,color:0x4ad94a},
    OP_MAG:{name:'術士',icon:'🔮',type:'operator',hp:120,atk:40,range:120,block:0,cost:5,color:0x9b4ad9},
    OP_HEAL:{name:'醫療',icon:'💚',type:'operator',hp:100,atk:5,range:80,block:0,cost:3,color:0x4ad94a,heal:20},
    SUPPORT_MULTI:{name:'多重',icon:'🎯',type:'support',multi:2},
    SUPPORT_RANGE:{name:'擴展',icon:'📐',type:'support',rangeBonus:1.3},
    SUPPORT_SPEED:{name:'加速',icon:'⚡',type:'support',speedBonus:1.2},
    SUPPORT_DAMAGE:{name:'增傷',icon:'💪',type:'support',dmgBonus:1.5}
};

const EQUIP_SLOTS = {
    '雙手武器':{sockets:6,links:6,icon:'⚔️'},'胸甲':{sockets:6,links:6,icon:'🛡️'},
    '頭盔':{sockets:4,links:4,icon:'⛑️'},'手套':{sockets:4,links:4,icon:'🧤'},
    '鞋子':{sockets:4,links:4,icon:'👢'},'主手':{sockets:3,links:3,icon:'🗡️'},
    '副手':{sockets:3,links:3,icon:'🛡️'},'項鍊':{sockets:0,links:0,icon:'📿'},'戒指':{sockets:0,links:0,icon:'💍'}
};

class EquipmentSystem {
    constructor(){
        this.slots = {
            '雙手武器': Array(6).fill(null),'胸甲': Array(6).fill(null),
            '頭盔': Array(4).fill(null),'手套': Array(4).fill(null),
            '鞋子': Array(4).fill(null),'主手': Array(3).fill(null),
            '副手': Array(3).fill(null),'項鍊': [],'戒指': []
        };
        this.slots['雙手武器'][0] = GEM_TYPES.SKILL_FIREBALL;
        this.slots['胸甲'][0] = GEM_TYPES.OP_RNG;
        this.slots['頭盔'][0] = GEM_TYPES.SKILL_LIGHTNING;
        this.slots['手套'][0] = GEM_TYPES.SUPPORT_DAMAGE;
        this.slots['鞋子'][0] = GEM_TYPES.SUPPORT_SPEED;
        this.slots['主手'][0] = GEM_TYPES.OP_TNK;
        this.deployed = {};
    }
    getHeroSkills(){const sk=[];for(const sn in this.slots){for(const g of this.slots[sn]){if(g&&g.type==='skill'&&!this.isDeployed(g))sk.push({...g,slot:sn});}}return sk;}
    getDeployableOperators(){const op=[];for(const sn in this.slots){for(const g of this.slots[sn]){if(g&&g.type==='operator'&&!this.isDeployed(g))op.push({...g,slot:sn});}}return op;}
    isDeployed(gem){for(const k in this.deployed){if(this.deployed[k]===gem)return true;}return false;}
    deploy(sn,gem,idx){if(gem&&gem.type==='operator'){this.deployed[idx]=gem;return true;}return false;}
    retreat(idx){if(this.deployed[idx]){delete this.deployed[idx];return true;}return false;}
}

class AStar {
    constructor(){this.obstacles=[];}
    heuristic(a,b){return Math.abs(a.x-b.x)+Math.abs(a.y-b.y);}
    getNeighbors(node){const dirs=[{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}];const neighbors=[];for(const dir of dirs){const nx=node.x+dir.x,ny=node.y+dir.y;if(nx>=0&&nx<CONFIG.cols&&ny>=0&&ny<CONFIG.rows&&!this.isObstacle(nx,ny))neighbors.push({x:nx,y:ny});}return neighbors;}
    isObstacle(x,y){return this.obstacles.some(o=>o.x===x&&o.y===y);}
    findPath(start,end){
        const openSet=[start],closedSet=new Set(),cameFrom=new Map(),gScore=new Map(),fScore=new Map();
        const key=n=>`${n.x},${n.y}`;
        gScore.set(key(start),0);fScore.set(key(start),this.heuristic(start,end));
        while(openSet.length>0){
            openSet.sort((a,b)=>(fScore.get(key(a))||Infinity)-(fScore.get(key(b))||Infinity));
            const current=openSet.shift();
            if(current.x===end.x&&current.y===end.y){const path=[current];while(cameFrom.has(key(current))){current=cameFrom.get(key(current));path.unshift(current);}return path;}
            closedSet.add(key(current));
            for(const neighbor of this.getNeighbors(current)){
                if(closedSet.has(key(neighbor)))continue;
                const tentativeG=(gScore.get(key(current))||Infinity)+1;
                if(!openSet.find(n=>n.x===neighbor.x&&n.y===neighbor.y))openSet.push(neighbor);
                else if(tentativeG>=(gScore.get(key(neighbor))||Infinity))continue;
                cameFrom.set(key(neighbor),current);gScore.set(key(neighbor),tentativeG);fScore.set(key(neighbor),tentativeG+this.heuristic(neighbor,end));
            }
        }
        return[];
    }
}

class MainScene extends Phaser.Scene {
    constructor(){super({key:'MainScene'});}
    create(){
        this.equipment=new EquipmentSystem();this.astar=new AStar();this.astar.obstacles=[{x:5,y:7},{x:6,y:7},{x:7,y:7}];
        // 地形
        this.terrain=[{x:8,y:5,type:'swamp',speedMod:0.7},{x:8,y:6,type:'swamp',speedMod:0.7},{x:8,y:7,type:'swamp',speedMod:0.7},{x:9,y:6,type:'swamp',speedMod:0.7}];
        this.traps=[{x:12,y:7,active:true,damage:30,cooldown:3000,lastTrigger:0}];
        this.hero={hp:100,maxHp:100,x:80,y:300,speed:150,skills:{basic:{dmg:30,cd:500,range:80},dash:{dmg:20,cd:3000,dist:120,ready:true,lastUsed:0},ultimate:{dmg:200,cd:15000,range:150,ready:true,charge:0,max:100,lastUsed:0}},isDashing:false,targetPath:[],pathIndex:0};
        this.deploymentPoints=5;
        this.gameState={gold:100,exp:0,wave:1,baseHp:10,maxBaseHp:10,enemies:[],towers:[],isGameOver:false,isPaused:false,inventory:[]};
        this.waveConfig={current:1,enemiesPerWave:5,enemiesSpawned:0,isBreak:false,breakTime:5000};
        this.keys={};[Phaser.Input.Keyboard.KeyCodes.Q,Phaser.Input.Keyboard.KeyCodes.E,Phaser.Input.Keyboard.KeyCodes.R,Phaser.Input.Keyboard.KeyCodes.ONE,Phaser.Input.Keyboard.KeyCodes.TWO,Phaser.Input.Keyboard.KeyCodes.THREE,Phaser.Input.Keyboard.KeyCodes.FOUR,Phaser.Input.Keyboard.KeyCodes.FIVE,Phaser.Input.Keyboard.KeyCodes.SPACE,Phaser.Input.Keyboard.KeyCodes.B,Phaser.Input.Keyboard.KeyCodes.ESC].forEach(k=>{this.keys[k]=this.input.keyboard.addKey(k);});
        this.selectedOpType='OP_TNK';this.heroGemSkillIndex=0;
        this.drawBackground();this.drawPath();this.drawDeployPoints();this.drawObstacles();this.createHero();this.createUI();this.createSkillBar();this.createGemUI();this.createWaveUI();
        this.spawnTimer=this.time.addEvent({delay:2000,callback:this.spawnEnemy,callbackScope:this,loop:true});
        this.input.on('pointerdown',this.handleClick,this);this.input.mouse.disableContextMenu();
    }
    update(time,delta){if(this.gameState.isGameOver||this.gameState.isPaused)return;this.updateWaveLogic();this.updateHero(delta,time);this.updateSkills(time);this.updateBlockers();this.updateEnemies(delta,time);this.updateTowers(delta);this.updateUI();if(this.keys[Phaser.Input.Keyboard.KeyCodes.B]&&Phaser.Input.Keyboard.JustDown(this.keys[Phaser.Input.Keyboard.KeyCodes.B]))this.toggleInventory();if(this.keys[Phaser.Input.Keyboard.KeyCodes.ESC]&&Phaser.Input.Keyboard.JustDown(this.keys[Phaser.Input.Keyboard.KeyCodes.ESC]))this.togglePause();}
    drawBackground(){this.add.grid(400,300,800,600,CONFIG.tileSize,CONFIG.tileSize,0x1a1a2e,0.5,0x2a2a4e,0.3);}
    drawPath(){
        this.pathPoints=[{x:0,y:7},{x:4,y:7},{x:4,y:3},{x:10,y:3},{x:10,y:11},{x:15,y:11},{x:15,y:7},{x:20,y:7}];
        const g=this.add.graphics();g.lineStyle(20,0x4a4a6e,1);g.beginPath();
        for(let i=0;i<this.pathPoints.length;i++){const px=this.pathPoints[i].x*CONFIG.tileSize,py=this.pathPoints[i].y*CONFIG.tileSize+CONFIG.tileSize/2;if(i===0)g.moveTo(px,py);else g.lineTo(px,py);}
        g.strokePath();this.add.rectangle(19*40,7*40+20,60,60,0xf00,0.3);
    }
    drawObstacles(){for(const o of this.astar.obstacles)this.add.rectangle(o.x*40+20,o.y*40+20,40,40,0x888,0.5);
        // 沼澤
        for(const t of this.terrain){this.add.rectangle(t.x*40+20,t.y*40+20,40,40,0x228b22,0.4);this.add.text(t.x*40+5,t.y*40+15,'沼',{fontSize:'10px',color:'#fff'});}
        // 陷阱
        for(const tr of this.traps){this.add.rectangle(tr.x*40+20,tr.y*40+20,30,30,0xff0000,0.5);this.add.text(tr.x*40+5,tr.y*40+15,'陷阱',{fontSize:'8px',color:'#fff'});}
    }
    drawDeployPoints(){
        this.deployPointGraphics=[];
        for(let i=0;i<CONFIG.deployPoints.length;i++){
            const p=CONFIG.deployPoints[i],c=p.type==='highground'?0x4ecdc4:0xffe66d;
            const rect=this.add.rectangle(p.x,p.y,35,35,c,0.4).setStrokeStyle(2,c).setInteractive();
            rect.pointData=p;rect.pointIndex=i;this.deployPointGraphics.push(rect);
            this.add.text(p.x-10,p.y-5,p.type==='highground'?'高':'平',{fontSize:'12px',color:'#fff'});
        }
    }
    createHero(){this.heroSprite=this.add.circle(80,300,20,0xff6b35);this.heroText=this.add.text(65,295,'英',{fontSize:'14px',fontStyle:'bold',color:'#fff'});this.heroHpBar=this.add.rectangle(80,265,40,6,0x0f0);this.targetMarker=this.add.circle(80,300,8,0xff0,0.5).setVisible(false);this.attackRange=this.add.circle(80,300,80,0xff6b35,0.1).setVisible(false);}
    createUI(){
        this.goldText=this.add.text(20,20,'金:100',{fontSize:'18px',color:'#fd0',backgroundColor:'#0008',padding:{x:10,y:5}});
        this.costText=this.add.text(20,50,'點:5',{fontSize:'18px',color:'#4ecdc4',backgroundColor:'#0008',padding:{x:10,y:5}});
        this.waveText=this.add.text(20,80,'波:1',{fontSize:'18px',color:'#fff',backgroundColor:'#0008',padding:{x:10,y:5}});
        this.baseHpText=this.add.text(650,20,'基:10/10',{fontSize:'18px',color:'#f00',backgroundColor:'#0008',padding:{x:10,y:5}});
        this.add.text(20,110,'統帥值:',{fontSize:'14px',color:'#ff6b35'});this.ultBar=this.add.rectangle(50,118,0,10,0xff6b35);
        this.add.text(20,550,'左:移動/部署|右:撤退|1-5:選|SPACE:技能',{fontSize:'11px',color:'#888'});
    }
    createWaveUI(){this.waveInfoText=this.add.text(650,50,'敵:0/5',{fontSize:'14px',color:'#fff',backgroundColor:'#0008',padding:{x:5,y:3}});this.nextWaveText=this.add.text(400,300,'',{fontSize:'28px',color:'#4ecdc4',fontStyle:'bold',stroke:'#000',strokeThickness:4}).setOrigin(0.5).setVisible(false);}
    togglePause(){
        this.gameState.isPaused = !this.gameState.isPaused;
        if(this.gameState.isPaused){
            this.pauseUI = this.add.container(0,0).setDepth(100);
            this.pauseUI.add(this.add.rectangle(400,300,400,200,0x000,0.9));
            this.pauseUI.add(this.add.text(400,250,'⏸ 遊戲暫停',{fontSize:'32px',color:'#fff',fontStyle:'bold'}).setOrigin(0.5));
            this.pauseUI.add(this.add.text(400,310,'按 ESC 繼續',{fontSize:'18px',color:'#4ecdc4'}).setOrigin(0.5));
        }else if(this.pauseUI){
            this.pauseUI.destroy();this.pauseUI=null;
        }
    }
    
    toggleInventory(){
        if(this.inventoryUI){this.inventoryUI.destroy();this.inventoryUI=null;return;}
        this.inventoryUI=this.add.container(0,0).setDepth(50);
        this.inventoryUI.add(this.add.rectangle(400,300,760,540,0x111111,0.98));
        this.inventoryUI.add(this.add.text(400,25,'🎒 裝備與背包 (按B關閉)',{fontSize:'22px',color:'#ffd700',fontStyle:'bold'}).setOrigin(0.5));
        
        // 8 裝備欄位 (GDD 2)
        const slotOrder = ['雙手武器','胸甲','頭盔','手套','鞋子','主手','副手','項鍊','戒指'];
        const slotPos = {
            '雙手武器':{x:180,y:100},'胸甲':{x:180,y:170},'頭盔':{x:180,y:240},
            '手套':{x:180,y:310},'鞋子':{x:180,y:380},'主手':{x:100,y:450},
            '副手':{x:260,y:450},'項鍊':{x:180,y:450}
        };
        
        for(const slotName of slotOrder){
            const slotDef = EQUIP_SLOTS[slotName];
            const pos = slotPos[slotName] || {x:180,y:450};
            const sockets = this.equipment.slots[slotName];
            
            // 欄位名
            this.inventoryUI.add(this.add.text(pos.x, pos.y-35, slotDef.icon+' '+slotName, {fontSize:'12px',color:'#888'}).setOrigin(0.5));
            
            // 插槽網格
            const socketW = 28, gap = 2;
            const totalW = sockets.length * (socketW + gap);
            const startX = pos.x - totalW/2 + socketW/2;
            
            for(let i=0; i<sockets.length; i++){
                const gem = sockets[i];
                const sx = startX + i * (socketW + gap);
                const sy = pos.y;
                const bgColor = gem ? (gem.type==='skill'?0x3a2010:gem.type==='operator'?0x102a20:0x10103a) : 0x1a1a1a;
                const borderColor = gem ? (gem.type==='skill'?0xff6b35:gem.type==='operator'?0x4ecdc4:0x8888ff) : 0x444444;
                
                const slotBg = this.add.rectangle(sx, sy, socketW, socketW, bgColor, 0.9).setStrokeStyle(2, borderColor);
                if(gem){
                    this.inventoryUI.add(this.add.text(sx-10, sy-10, gem.icon, {fontSize:'18px'}));
                }
                this.inventoryUI.add(slotBg);
            }
            
            // 連線數
            if(slotDef.links > 0){
                this.inventoryUI.add(this.add.text(pos.x, pos.y+25, '🔗'+slotDef.links, {fontSize:'10px',color:'#4ecdc4'}).setOrigin(0.5));
            }
        }
        
        // 背包
        this.inventoryUI.add(this.add.text(560,70,'🎒 背包 (30格)',{fontSize:'14px',color:'#c0c0c0'}).setOrigin(0.5));
        for(let i=0; i<30; i++){
            const row = Math.floor(i/6), col = i%6;
            const bx = 430 + col*42, by = 100 + row*42;
            const item = this.gameState.inventory[i];
            const bg = this.add.rectangle(bx,by,38,38, item?0x2a2a2a:0x151515,0.9).setStrokeStyle(1, item?0x00ffff:0x333333);
            if(item) this.inventoryUI.add(this.add.text(bx-8,by-8,item,{fontSize:'14px'}));
            this.inventoryUI.add(bg);
        }
        
        // 可部署 Operators
        this.inventoryUI.add(this.add.text(560,350,'🛡️ 可部署單位',{fontSize:'14px',color:'#c0c0c0'}).setOrigin(0.5));
        const ops = this.equipment.getDeployableOperators();
        let oy = 380;
        for(const op of ops){
            this.inventoryUI.add(this.add.rectangle(560,oy,160,26,0x2a4a2a,0.8).setStrokeStyle(1,0x00ff00));
            this.inventoryUI.add(this.add.text(560-70,oy-5,op.icon+' '+op.name,{fontSize:'12px',color:'#4ecdc4'}));
            this.inventoryUI.add(this.add.text(560+70,oy-5,'💰'+op.cost,{fontSize:'11px',color:'#fd0'}).setOrigin(0.5));
            oy += 32;
        }
        
        // 說明
        this.inventoryUI.add(this.add.text(400,515,'💡 點擊部署點放置Operator | 數字鍵1-5選擇 | SPACE切換技能',{fontSize:'10px',color:'#666'}).setOrigin(0.5));
    }
    createSkillBar(){
        const barY=560,barX=600;
        this.skillQ=this.add.rectangle(barX,barY,36,36,0x4ecdc4).setStrokeStyle(2,'#0f0');
        this.skillE=this.add.rectangle(barX+50,barY,36,36,0xffe66d).setStrokeStyle(2,'#0f0');
        this.skillR=this.add.rectangle(barX+100,barY,36,36,0xff6b35).setStrokeStyle(2,'#0f0');
        this.add.text(barX-12,barY-8,'Q',{fontSize:'20px',fontStyle:'bold',color:'#000'});this.add.text(barX+38,barY-8,'E',{fontSize:'20px',fontStyle:'bold',color:'#000'});this.add.text(barX+88,barY-8,'R',{fontSize:'20px',fontStyle:'bold',color:'#000'});
        this.skillQCD=this.add.rectangle(barX,barY,36,36,0x000,0.7).setVisible(false);this.skillRCD=this.add.rectangle(barX+100,barY,36,36,0x000,0.7).setVisible(false);
    }
    createGemUI(){this.add.text(300,530,'【靈樞】SPACE:',{fontSize:'12px',color:'#4ecdc4'});this.updateGemDisplay();}
    updateGemDisplay(){
        if(this.gemTexts)this.gemTexts.forEach(t=>t.destroy());this.gemTexts=[];
        const skills=this.equipment.getHeroSkills();let x=320;
        for(let i=0;i<skills.length;i++){const s=skills[i],isActive=i===this.heroGemSkillIndex,c=isActive?'#0f0':'#888';this.gemTexts.push(this.add.rectangle(x,560,30,30,0x333,0.8).setStrokeStyle(2,c),this.add.text(x-8,552,s.icon,{fontSize:'16px'}));x+=35;}
    }
    updateWaveLogic(){
        if(this.waveConfig.isBreak)return;
        if(this.waveConfig.enemiesSpawned>=this.waveConfig.enemiesPerWave&&this.gameState.enemies.length===0){
            this.waveConfig.isBreak=true;
            this.nextWaveText.setText(`波次${this.waveConfig.current}完成!\n準備下一波...`);this.nextWaveText.setVisible(true);
            this.time.delayedCall(this.waveConfig.breakTime,()=>{this.waveConfig.current++;this.waveConfig.enemiesSpawned=0;this.waveConfig.enemiesPerWave=5+this.waveConfig.current*2;this.waveConfig.isBreak=false;this.nextWaveText.setVisible(false);this.showMessage(`🌊波次${this.waveConfig.current}開始!`,400,100,'#4ecdc4');});
        }
    }
    spawnEnemy(){
        if(this.gameState.isGameOver||this.waveConfig.isBreak)return;
        if(this.waveConfig.enemiesSpawned>=this.waveConfig.enemiesPerWave)return;
        this.waveConfig.enemiesSpawned++;
        let types=[{name:'哥',hp:50,speed:40,color:0x0f0,reward:10},{name:'獸',hp:100,speed:30,color:0xf80,reward:20},{name:'幽',hp:40,speed:50,color:0x80f,reward:15}];
        if(this.waveConfig.current>=3&&Math.random()<0.15+(this.waveConfig.current-3)*0.05){
            const affixKeys=Object.keys(ELITE_AFFIXES),affixKey=affixKeys[Math.floor(Math.random()*affixKeys.length)],affix=ELITE_AFFIXES[affixKey];
            types=[{name:affix.icon+'精英',hp:150*(affix.hpBonus||1),speed:35,color:affix.color,reward:30,isElite:true,affix:affix}];
        }
        const t=types[Math.floor(Math.random()*types.length)],sp=this.pathPoints[0];
        const e={sprite:this.add.circle(sp.x*40,sp.y*40+20,t.isElite?18:15,t.color),text:this.add.text(sp.x*40-10,sp.y*40+15,t.name,{fontSize:'12px',color:'#fff'}),hp:t.hp,maxHp:t.hp,speed:t.speed,reward:t.reward,pathIndex:0,blocked:false,isElite:t.isElite||false,affix:t.affix||null,slowTimer:0,healTimer:0};
        this.gameState.enemies.push(e);
    }
    updateSkills(time){
        const s=this.hero.skills;
        if(!s.dash.ready){const cd=Math.max(0,(s.dash.lastUsed+s.dash.cd)-time);if(cd>0){this.skillQCD.setVisible(true);this.skillQCD.height=36*(cd/s.dash.cd);}else{s.dash.ready=true;this.skillQCD.setVisible(false);this.skillQ.setStrokeStyle(2,'#0f0');}}
        if(!s.ultimate.ready){const cd=Math.max(0,(s.ultimate.lastUsed+s.ultimate.cd)-time);if(cd>0){this.skillRCD.setVisible(true);this.skillRCD.height=36*(cd/s.ultimate.cd);}else{s.ultimate.ready=true;this.skillRCD.setVisible(false);this.skillR.setStrokeStyle(2,'#0f0');}}
        this.ultBar.width=100*(s.ultimate.charge/s.ultimate.max);this.ultBar.x=50+50*(s.ultimate.charge/s.ultimate.max);
        if(Phaser.Input.Keyboard.JustDown(this.keys[Phaser.Input.Keyboard.KeyCodes.ONE]))this.selectedOpType='OP_TNK';
        if(Phaser.Input.Keyboard.JustDown(this.keys[Phaser.Input.Keyboard.KeyCodes.TWO]))this.selectedOpType='OP_MEL';
        if(Phaser.Input.Keyboard.JustDown(this.keys[Phaser.Input.Keyboard.KeyCodes.THREE]))this.selectedOpType='OP_RNG';
        if(Phaser.Input.Keyboard.JustDown(this.keys[Phaser.Input.Keyboard.KeyCodes.FOUR]))this.selectedOpType='OP_MAG';
        if(Phaser.Input.Keyboard.JustDown(this.keys[Phaser.Input.Keyboard.KeyCodes.SPACE])){this.heroGemSkillIndex=(this.heroGemSkillIndex+1)%this.equipment.getHeroSkills().length;this.updateGemDisplay();}
    }
    updateHero(delta,time){
        if(Phaser.Input.Keyboard.JustDown(this.keys[Phaser.Input.Keyboard.KeyCodes.Q]))this.useDash(time);
        if(Phaser.Input.Keyboard.JustDown(this.keys[Phaser.Input.Keyboard.KeyCodes.E]))this.useGemSkill(time);
        if(Phaser.Input.Keyboard.JustDown(this.keys[Phaser.Input.Keyboard.KeyCodes.R]))this.useUltimate(time);
        // 直接移動
        if(this.hero.targetX!==undefined){
            const dx=this.hero.targetX-this.heroSprite.x,dy=this.hero.targetY-this.heroSprite.y,d=Math.sqrt(dx*dx+dy*dy);
            if(d>5){const sp=this.hero.speed*delta/1000;this.heroSprite.x+=dx/d*Math.min(sp,d);this.heroSprite.y+=dy/d*Math.min(sp,d);}
            else{this.hero.targetX=undefined;this.hero.targetY=undefined;this.targetMarker.setVisible(false);this.attackRange.setVisible(false);}
        }
        // 自動普攻
        this.hero.autoAttackTimer=(this.hero.autoAttackTimer||0)+delta;
        if(this.hero.autoAttackTimer>=500){
            let target=null,minDist=80;
            for(const e of this.gameState.enemies){const d=Phaser.Math.Distance.Between(this.heroSprite.x,this.heroSprite.y,e.sprite.x,e.sprite.y);if(d<minDist){minDist=d;target=e;}}
            if(target){this.hero.autoAttackTimer=0;const g=this.add.graphics();g.lineStyle(2,0xff6b35,0.8);g.lineBetween(this.heroSprite.x,this.heroSprite.y,target.sprite.x,target.sprite.y);this.time.delayedCall(80,()=>g.destroy());target.hp-=30;this.showDamage(target.sprite.x,target.sprite.y-15,30,'#ffa500');if(target.hp<=0)this.killEnemy(target,true);}
        }
        this.heroSprite.x=Phaser.Math.Clamp(this.heroSprite.x,20,780);this.heroSprite.y=Phaser.Math.Clamp(this.heroSprite.y,20,550);
        this.heroText.x=this.heroSprite.x-15;this.heroText.y=this.heroSprite.y-5;
        this.heroHpBar.x=this.heroSprite.x;this.heroHpBar.y=this.heroSprite.y-35;this.heroHpBar.width=40*(this.hero.hp/this.hero.maxHp);
    }
    useGemSkill(time){
        const skills=this.equipment.getHeroSkills(),skill=skills[this.heroGemSkillIndex];
        if(!skill)return;
        let target=null,minDist=skill.range;
        for(const e of this.gameState.enemies){const d=Phaser.Math.Distance.Between(this.heroSprite.x,this.heroSprite.y,e.sprite.x,e.sprite.y);if(d<minDist){minDist=d;target=e;}}
        if(target){const g=this.add.graphics();g.lineStyle(3,0xff6b35,1);g.lineBetween(this.heroSprite.x,this.heroSprite.y,target.sprite.x,target.sprite.y);this.time.delayedCall(100,()=>g.destroy());target.hp-=skill.damage;this.showDamage(target.sprite.x,target.sprite.y-20,skill.damage);this.hero.skills.ultimate.charge=Math.min(100,this.hero.skills.ultimate.charge+5);if(target.hp<=0)this.killEnemy(target,true);}
    }
    useDash(time){
        if(!this.hero.skills.dash.ready)return;
        const p=this.input.activePointer;this.hero.isDashing=true;this.hero.skills.dash.lastUsed=time;this.hero.skills.dash.ready=false;
        const dx=p.x-this.heroSprite.x,dy=p.y-this.heroSprite.y,d=Math.sqrt(dx*dx+dy*dy);
        if(d>0){const dd=Math.min(120,d);this.heroSprite.x+=dx/d*dd;this.heroSprite.y+=dy/d*dd;}
        for(const e of this.gameState.enemies){if(Phaser.Math.Distance.Between(this.heroSprite.x,this.heroSprite.y,e.sprite.x,e.sprite.y)<50){e.hp-=20;this.showDamage(e.sprite.x,e.sprite.y-20,20);if(e.hp<=0)this.killEnemy(e,true);}}
        this.time.delayedCall(300,()=>this.hero.isDashing=false);
    }
    useUltimate(time){
        if(!this.hero.skills.ultimate.ready||this.hero.skills.ultimate.charge<100)return;
        this.hero.skills.ultimate.lastUsed=time;this.hero.skills.ultimate.ready=false;this.hero.skills.ultimate.charge=0;
        const r=this.hero.skills.ultimate.range,g=this.add.circle(this.heroSprite.x,this.heroSprite.y,r,0xff6b35,0.3);
        for(const e of this.gameState.enemies){if(Phaser.Math.Distance.Between(this.heroSprite.x,this.heroSprite.y,e.sprite.x,e.sprite.y)<r){e.hp-=200;this.showDamage(e.sprite.x,e.sprite.y-20,200);if(e.hp<=0)this.killEnemy(e,true);}}
        this.cameras.main.shake(200,0.01);this.time.delayedCall(500,()=>g.destroy());
    }
    handleClick(pointer){
        if(this.gameState.isGameOver||this.gameState.isPaused||this.inventoryUI)return;
        if(pointer.rightButtonDown()){for(let i=0;i<this.gameState.towers.length;i++){const t=this.gameState.towers[i];if(t&&t.sprite.getBounds().contains(pointer.x,pointer.y)){this.equipment.retreat(i);this.deploymentPoints+=Math.floor(t.cost*0.5);t.sprite.destroy();t.text.destroy();t.hpBar.destroy();t.rangeG.destroy();this.gameState.towers[i]=null;return;}}return;}
        for(const pt of this.deployPointGraphics){if(pt.getBounds().contains(pointer.x,pointer.y)){this.deployTower(pt.pointData,pt.pointIndex);return;}}
        // 直接移動
        this.hero.targetX=pointer.x;
        this.hero.targetY=pointer.y;
        this.targetMarker.setPosition(pointer.x,pointer.y).setVisible(true);
        this.attackRange.setPosition(pointer.x,pointer.y).setVisible(true);
    }
    deployTower(pd,idx){
        const ops = this.equipment.getDeployableOperators();
        const selectedOp = ops[this.selectedOpType < ops.length ? this.selectedOpType : 0];
        if(!selectedOp) return;
        if(this.deploymentPoints < selectedOp.cost || this.gameState.towers[idx]) return;
        const isHigh = pd.type === 'highground';
        if(isHigh && (selectedOp.name==='重裝' || selectedOp.name==='近衛')) return;
        if(!isHigh && (selectedOp.name==='狙擊' || selectedOp.name==='術士')) return;
        
        this.deploymentPoints -= selectedOp.cost;
        this.equipment.deploy(selectedOp.slot, selectedOp, idx);
        
        const tower = {
            gem: selectedOp,
            sprite: this.add.rectangle(pd.x,pd.y,35,35,selectedOp.color).setInteractive(),
            text: this.add.text(pd.x-10,pd.y-8,selectedOp.icon,{fontSize:'16px'}),
            hp: selectedOp.hp*1.3, maxHp: selectedOp.hp*1.3, atk: selectedOp.atk*1.3, range: selectedOp.range, block: selectedOp.block, cost: selectedOp.cost,
            attackCooldown: 0, pointIndex: idx,
            hpBar: this.add.rectangle(pd.x,pd.y-30,30,4,0x0f0),
            rangeG: this.add.circle(pd.x,pd.y,selectedOp.range,selectedOp.color,0.1).setVisible(false)
        };
        tower.sprite.on('pointerover',()=>tower.rangeG.setVisible(true));
        tower.sprite.on('pointerout',()=>tower.rangeG.setVisible(false));
        this.gameState.towers[idx] = tower;
    }
    updateBlockers(){for(const e of this.gameState.enemies)e.blocked=false;for(const t of this.gameState.towers){if(!t)continue;const blocked=this.gameState.enemies.filter(e=>!e.blocked&&Phaser.Math.Distance.Between(t.sprite.x,t.sprite.y,e.sprite.x,e.sprite.y)<t.range+20);for(let i=0;i<Math.min(blocked.length,t.block);i++)blocked[i].blocked=true;}}
    updateEnemies(delta,time){
        for(let i=this.gameState.enemies.length-1;i>=0;i--){
            const e=this.gameState.enemies[i];
            // 沼澤減速
            let terrainMod=1;
            const ex=Math.floor(e.sprite.x/40),ey=Math.floor(e.sprite.y/40);
            for(const t of this.terrain){if(t.x===ex&&t.y===ey){terrainMod=t.speedMod;break;}}
            // 陷阱
            for(const tr of this.traps){
                if(tr.active&&Phaser.Math.Distance.Between(e.sprite.x,e.sprite.y,tr.x*40+20,tr.y*40+20)<25){
                    if(time-tr.lastTrigger>tr.cooldown){tr.lastTrigger=time;e.hp-=tr.damage;this.showDamage(e.sprite.x,e.sprite.y-30,tr.damage);if(e.hp<=0){this.killEnemy(e,true);continue;}}
                }
            }
            if(e.affix&&e.affix.name==='冰'&&e.slowTimer>0)e.slowTimer-=delta;
            if(e.affix&&e.affix.name==='癒'){e.healTimer=(e.healTimer||0)+delta;if(e.healTimer>1000){e.hp=Math.min(e.maxHp,e.hp+5);e.healTimer=0;}}
            let currentSpeed=e.speed*terrainMod;if(e.slowTimer>0)currentSpeed*=0.7;
            if(e.blocked&&e.blocker&&e.blocker.hp>0){e.blocker.hp-=0.5*delta/1000;e.blocker.hpBar.width=30*(e.blocker.hp/e.blocker.maxHp);if(e.blocker.hp<=0){if(e.blocker.gem)e.blocker.gem.isDeployed=false;e.blocker.sprite.destroy();e.blocker.text.destroy();e.blocker.hpBar.destroy();e.blocker.rangeG.destroy();this.gameState.towers[e.blocker.pointIndex]=null;}continue;}
            const tp=this.pathPoints[e.pathIndex+1];
            if(!tp){this.gameState.baseHp--;if(this.gameState.baseHp<=0)this.gameOver();e.sprite.destroy();e.text.destroy();this.gameState.enemies.splice(i,1);continue;}
            const tx=tp.x*40,ty=tp.y*40+20,dx=tx-e.sprite.x,dy=ty-e.sprite.y,d=Math.sqrt(dx*dx+dy*dy);
            if(d<5)e.pathIndex++;else{e.sprite.x+=dx/d*currentSpeed*delta/1000;e.sprite.y+=dy/d*currentSpeed*delta/1000;}
            e.text.x=e.sprite.x-8;e.text.y=e.sprite.y-5;
        }
    }
    updateTowers(delta){
        for(const t of this.gameState.towers){
            if(!t)continue;
            t.attackCooldown-=delta;
            if(t.attackCooldown<=0){
                let target=null,minD=t.range;
                for(const e of this.gameState.enemies){const d=Phaser.Math.Distance.Between(t.sprite.x,t.sprite.y,e.sprite.x,e.sprite.y);if(d<minD){minD=d;target=e;}}
                if(target){
                    const g=this.add.graphics();g.lineStyle(2,t.rangeG.fillColor,1);g.lineBetween(t.sprite.x,t.sprite.y,target.sprite.x,target.sprite.y);this.time.delayedCall(100,()=>g.destroy());
                    let dmg=t.atk;if(t.gem&&t.gem.name==='冰霜')target.slowTimer=2000;
                    target.hp-=dmg;this.showDamage(target.sprite.x,target.sprite.y-20,Math.floor(dmg));if(target.hp<=0)this.killEnemy(target,true);t.attackCooldown=1000;
                }
            }
        }
    }
    killEnemy(e,r){
        if(e.isElite&&e.affix&&e.affix.name==='火'){for(const other of this.gameState.enemies){if(other===e)continue;const d=Phaser.Math.Distance.Between(e.sprite.x,e.sprite.y,other.sprite.x,other.sprite.y);if(d<e.affix.range){other.hp-=e.affix.dmg;this.showDamage(other.sprite.x,other.sprite.y-20,e.affix.dmg);if(other.hp<=0&&!other.dead){other.dead=true;this.killEnemy(other,true);}}}}
        if(r){this.gameState.gold+=e.reward;this.deploymentPoints+=2;this.gameState.exp+=10;
            // 掉落物品
            if(Math.random()<0.3){const items=['⚔️武器','🛡️防具','💎寶石'];const item=items[Math.floor(Math.random()*items.length)];this.gameState.inventory.push(item);this.showMessage('+'+item,e.sprite.x,e.sprite.y-50,'#00ffff');}
            this.showMessage('+'+e.reward,e.sprite.x,e.sprite.y-30,'#fd0');}
        e.sprite.destroy();e.text.destroy();const idx=this.gameState.enemies.indexOf(e);if(idx>-1)this.gameState.enemies.splice(idx,1);
    }
    updateUI(){this.goldText.setText(`金:${this.gameState.gold}`);this.costText.setText(`點:${this.deploymentPoints}`);this.waveText.setText(`波:${this.waveConfig.current}`);this.baseHpText.setText(`基:${this.gameState.baseHp}/10`);this.waveInfoText.setText(`敵:${this.waveConfig.enemiesSpawned}/${this.waveConfig.enemiesPerWave}`);}
    showDamage(x,y,t){const dmg=this.add.text(x,y,`-${t}`,{fontSize:'16px',color:'#f00',fontStyle:'bold'});this.tweens.add({targets:dmg,y:y-30,alpha:0,duration:500,onComplete:()=>dmg.destroy()});}
    showMessage(text,x,y,color='#fff'){const msg=this.add.text(x,y,text,{fontSize:'16px',color:color,fontStyle:'bold',stroke:'#000',strokeThickness:3});this.tweens.add({targets:msg,y:y-30,alpha:0,duration:1000,onComplete:()=>msg.destroy()});}
    gameOver(){this.gameState.isGameOver=true;this.add.rectangle(400,300,400,200,0x000,0.8);this.add.text(400,260,'遊戲結束',{fontSize:'32px',color:'#f00',fontStyle:'bold'}).setOrigin(0.5);this.add.text(400,320,`波次:${this.waveConfig.current}`,{fontSize:'18px',color:'#fff'}).setOrigin(0.5);this.add.text(400,370,'點擊重新開始',{fontSize:'16px',color:'#4ecdc4',backgroundColor:'#333',padding:{x:10,y:5}}).setOrigin(0.5).setInteractive().on('pointerdown',()=>this.scene.restart());}
}
const config={type:Phaser.AUTO,width:800,height:600,parent:'game-container',backgroundColor:'#1a1a2e',scene:MainScene};
const game=new Phaser.Game(config);
