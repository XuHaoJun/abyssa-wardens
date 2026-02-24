// Abyssal Wardens 原型 - 完整裝備系統
const CONFIG = { width:800, height:600, tileSize:40, cols:20, rows:15,
    deployPoints:[{x:100,y:200,type:'ground'},{x:100,y:400,type:'ground'},{x:300,y:200,type:'highground'},{x:300,y:400,type:'highground'},{x:500,y:200,type:'highground'},{x:500,y:400,type:'highground'},{x:700,y:200,type:'ground'},{x:700,y:400,type:'ground'}] };

const ELITE_AFFIXES = {
    FROST:{name:'冰',icon:'❄️',color:0x00ffff,effect:'減速30%',duration:2000},
    ARMOR:{name:'盾',icon:'🛡️',color:0x888888,effect:'護甲+50',hpBonus:1.5},
    FIRE:{name:'火',icon:'🔥',color:0xff4400,effect:'死亡爆炸',dmg:50,range:60},
    HEAL:{name:'癒',icon:'💚',color:0x00ff00,effect:'每秒回血'}
};

// 寶石類型
const GEM_TYPES = {
    // 🔴 技能石
    SKILL_FIREBALL:{name:'火球',icon:'🔥',category:'skill',damage:50,cooldown:1000,range:150},
    SKILL_ICE:{name:'冰霜',icon:'❄️',category:'skill',damage:30,cooldown:800,range:120,slow:0.3},
    SKILL_LIGHTNING:{name:'閃電',icon:'⚡',category:'skill',damage:40,cooldown:600,range:130},
    SKILL_POISON:{name:'劇毒',icon:'☠️',category:'skill',damage:25,cooldown:700,range:100,dps:10},
    // 🟡 陣地石 (Operator)
    OP_TNK:{name:'重裝',icon:'🛡️',category:'operator',hp:500,atk:15,range:60,block:3,cost:5,color:0x4a90d9},
    OP_MEL:{name:'近衛',icon:'⚔️',category:'operator',hp:300,atk:25,range:70,block:2,cost:4,color:0xd94a4a},
    OP_RNG:{name:'狙擊',icon:'🏹',category:'operator',hp:150,atk:35,range:150,block:0,cost:4,color:0x4ad94a},
    OP_MAG:{name:'術士',icon:'🔮',category:'operator',hp:120,atk:40,range:120,block:0,cost:5,color:0x9b4ad9},
    OP_HEAL:{name:'醫療',icon:'💚',category:'operator',hp:100,atk:5,range:80,block:0,cost:3,color:0x4ad94a,heal:20},
    // 🔵 輔助石
    SUPPORT_MULTI:{name:'多重',icon:'🎯',category:'support',multi:2},
    SUPPORT_RANGE:{name:'擴展',icon:'📐',category:'support',rangeBonus:1.3},
    SUPPORT_SPEED:{name:'加速',icon:'⚡',category:'support',speedBonus:1.2},
    SUPPORT_DAMAGE:{name:'增傷',icon:'💪',category:'support',dmgBonus:1.5}
};

// 8 個裝備欄位 (依 GDD 規格)
const EQUIPMENT_SLOTS = {
    '雙手武器':{sockets:6,links:6,icon:'⚔️'},
    '胸甲':{sockets:6,links:6,icon:'🛡️'},
    '頭盔':{sockets:4,links:4,icon:'⛑️'},
    '手套':{sockets:4,links:4,icon:'🧤'},
    '鞋子':{sockets:4,links:4,icon:'👢'},
    '主手':{sockets:3,links:3,icon:'🗡️'},
    '副手':{sockets:3,links:3,icon:'🛡️'},
    '項鍊':{sockets:0,links:0,icon:'📿'},
    '戒指':{sockets:0,links:0,icon:'💍'}
};

class EquipmentSystem {
    constructor(){
        // 初始裝備
        this.equipment={
            '雙手武器':[GEM_TYPES.SKILL_FIREBALL],
            '胸甲':[GEM_TYPES.OP_RNG],
            '頭盔':[GEM_TYPES.SKILL_LIGHTNING],
            '手套':[],
            '鞋子':[],
            '主手':[GEM_TYPES.SUPPORT_MULTI],
            '副手':[],
            '項鍊':[],
            '戒指':[]
        };
    }
    // 獲取所有技能（已部署的 operator 技能 + 英雄身上的 skill）
    getActiveSkills(){const skills=[];for(const slot in this.equipment){for(const gem of this.equipment[slot]){if(gem.category==='skill')skills.push({...gem,slot});}}return skills;}
    // 獲取可部署的 operators
    getDeployableOperators(){const ops=[];for(const slot in this.equipment){for(const gem of this.equipment[slot]){if(gem.category==='operator')ops.push({...gem,slot});}}return ops;}
    // 獲取所有裝備
    getEquipmentList(){const list=[];for(const slot in this.equipment){const sockets=EQUIPMENT_SLOTS[slot].sockets;for(let i=0;i<sockets;i++){const gem=this.equipment[slot][i]||null;list.push({slot,index:i,gem});}}return list;}
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
        // 地形效果：沼澤
        this.terrain=[{x:8,y:5,type:'swamp',speedMod:0.7},{x:8,y:6,type:'swamp',speedMod:0.7},{x:8,y:7,type:'swamp',speedMod:0.7},{x:9,y:6,type:'swamp',speedMod:0.7}];
        // 陷阱
        this.traps=[{x:12,y:7,active:true,damage:30,cooldown:3000,lastTrigger:0}];
        this.hero={hp:100,maxHp:100,x:80,y:300,speed:150,skills:{basic:{dmg:30,cd:500,range:80,lastUsed:0},dash:{dmg:20,cd:3000,dist:120,ready:true,lastUsed:0},ultimate:{dmg:200,cd:15000,range:150,ready:true,charge:0,max:100,lastUsed:0}},isDashing:false,targetPath:[],pathIndex:0,autoAttackTimer:0};
        this.deploymentPoints=5;
        this.gameState={gold:100,exp:0,wave:1,baseHp:10,maxBaseHp:10,enemies:[],towers:[],isGameOver:false,isPaused:false,inventory:[]};
        this.waveConfig={current:1,enemiesPerWave:5,enemiesSpawned:0,isBreak:false,breakTime:5000};
        this.keys={};[Phaser.Input.Keyboard.KeyCodes.Q,Phaser.Input.Keyboard.KeyCodes.E,Phaser.Input.Keyboard.KeyCodes.R,Phaser.Input.Keyboard.KeyCodes.ONE,Phaser.Input.Keyboard.KeyCodes.TWO,Phaser.Input.Keyboard.KeyCodes.THREE,Phaser.Input.Keyboard.KeyCodes.FOUR,Phaser.Input.Keyboard.KeyCodes.FIVE,Phaser.Input.Keyboard.KeyCodes.SPACE,Phaser.Input.Keyboard.KeyCodes.ESC,Phaser.Input.Keyboard.KeyCodes.B].forEach(k=>{this.keys[k]=this.input.keyboard.addKey(k);});
        this.selectedOpType='OP_TNK';this.heroGemSkillIndex=0;
        this.drawBackground();this.drawPath();this.drawDeployPoints();this.drawObstacles();this.createHero();this.createUI();this.createSkillBar();this.createGemUI();this.createWaveUI();this.createPauseMenu();
        this.spawnTimer=this.time.addEvent({delay:2000,callback:this.spawnEnemy,callbackScope:this,loop:true});
        this.input.on('pointerdown',this.handleClick,this);this.input.mouse.disableContextMenu();
    }
    update(time,delta){if(this.gameState.isGameOver||this.gameState.isPaused)return;this.updateWaveLogic();this.updateHero(delta,time);this.updateSkills(time);this.updateBlockers();this.updateEnemies(delta,time);this.updateTowers(delta);this.updateUI();if(this.keys[Phaser.Input.Keyboard.KeyCodes.ESC]&&Phaser.Input.Keyboard.JustDown(this.keys[Phaser.Input.Keyboard.KeyCodes.ESC]))this.togglePause();if(this.keys[Phaser.Input.Keyboard.KeyCodes.B]&&Phaser.Input.Keyboard.JustDown(this.keys[Phaser.Input.Keyboard.KeyCodes.B]))this.toggleInventory();}
    drawBackground(){this.add.grid(400,300,800,600,CONFIG.tileSize,CONFIG.tileSize,0x1a1a2e,0.5,0x2a2a4e,0.3);}
    drawPath(){
        this.pathPoints=[{x:0,y:7},{x:4,y:7},{x:4,y:3},{x:10,y:3},{x:10,y:11},{x:15,y:11},{x:15,y:7},{x:20,y:7}];
        const g=this.add.graphics();g.lineStyle(20,0x4a4a6e,1);g.beginPath();
        for(let i=0;i<this.pathPoints.length;i++){const px=this.pathPoints[i].x*CONFIG.tileSize,py=this.pathPoints[i].y*CONFIG.tileSize+CONFIG.tileSize/2;if(i===0)g.moveTo(px,py);else g.lineTo(px,py);}
        g.strokePath();this.add.rectangle(19*40,7*40+20,60,60,0xf00,0.3);
    }
    drawObstacles(){
        for(const o of this.astar.obstacles)this.add.rectangle(o.x*40+20,o.y*40+20,40,40,0x888,0.5);
        // 沼澤地形
        for(const t of this.terrain){
            const swamp=this.add.rectangle(t.x*40+20,t.y*40+20,40,40,0x228b22,0.4);
            this.add.text(t.x*40+5,t.y*40+15,'沼',{fontSize:'10px',color:'#fff'});
        }
        // 陷阱
        for(const tr of this.traps){
            const trap=this.add.rectangle(tr.x*40+20,tr.y*40+20,30,30,0xff0000,0.5);
            this.add.text(tr.x*40+5,tr.y*40+15,'陷阱',{fontSize:'8px',color:'#fff'});
        }
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
    createPauseMenu(){
        this.pauseMenuBg=this.add.rectangle(400,300,400,300,0x000,0.9).setVisible(false).setDepth(100);
        this.pauseTitle=this.add.text(400,200,'⏸ 遊戲暫停',{fontSize:'32px',color:'#fff',fontStyle:'bold'}).setOrigin(0.5).setVisible(false).setDepth(101);
        this.resumeBtn=this.add.text(400,280,'▶ 繼續',{fontSize:'20px',color:'#4ecdc4',backgroundColor:'#333',padding:{x:20,y:10}}).setOrigin(0.5).setVisible(false).setDepth(101).setInteractive();
        this.resumeBtn.on('pointerdown',()=>this.togglePause());
        this.restartBtn=this.add.text(400,340,'🔄 重新開始',{fontSize:'20px',color:'#ff6b35',backgroundColor:'#333',padding:{x:20,y:10}}).setOrigin(0.5).setVisible(false).setDepth(101).setInteractive();
        this.restartBtn.on('pointerdown',()=>this.scene.restart());
    }
    togglePause(){this.gameState.isPaused=!this.gameState.isPaused;this.pauseMenuBg.setVisible(this.gameState.isPaused);this.pauseTitle.setVisible(this.gameState.isPaused);this.resumeBtn.setVisible(this.gameState.isPaused);this.restartBtn.setVisible(this.gameState.isPaused);}
    toggleInventory(){
        if(this.inventoryUI){this.inventoryUI.destroy();this.inventoryUI=null;return;}
        this.inventoryUI=this.add.container(0,0).setDepth(50);
        // 背景
        this.inventoryUI.add(this.add.rectangle(400,300,700,500,0x1a1a2e,0.97));
        this.inventoryUI.add(this.add.rectangle(400,300,680,480,0x2a2a4e,0.9).setStrokeStyle(2,0x4ecdc4));
        // 標題
        this.inventoryUI.add(this.add.text(400,40,'⚔️ 裝備欄位 (按 B 關閉)',{fontSize:'24px',color:'#fff',fontStyle:'bold'}).setOrigin(0.5));
        // 顯示 8 個裝備欄位 (PoE 風格布局)
        const slotOrder=['雙手武器','胸甲','頭盔','手套','鞋子','主手','副手','項鍊','戒指'];
        const slotLayout={
            '雙手武器':{x:150,y:120},'胸甲':{x:150,y:220},
            '頭盔':{x:150,y:320},'手套':{x:150,y:420},
            '鞋子':{x:400,y:120},'主手':{x:400,y:220},
            '副手':{x:400,y:320},'項鍊':{x:400,y:420},
            '戒指':{x:550,y:420}
        };
        for(const slotName of slotOrder){
            const slot=EQUIPMENT_SLOTS[slotName];
            const pos=slotLayout[slotName];
            // 欄位框
            const sockets=slot.sockets;
            const boxW=sockets*28+8,boxH=36;
            this.inventoryUI.add(this.add.rectangle(pos.x+boxW/2-14,pos.y,boxW,boxH,0x333,0.8).setStrokeStyle(1,sockets>0?0x4ecdc4:0x666));
            // 欄位名
            this.inventoryUI.add(this.add.text(pos.x-40,pos.y,slot.icon,{fontSize:'20px'}).setOrigin(0.5));
            this.inventoryUI.add(this.add.text(pos.x-40,pos.y+18,slotName,{fontSize:'10px',color:'#888'}).setOrigin(0.5));
            // 插槽
            const gems=this.equipment.equipment[slotName]||[];
            for(let i=0;i<sockets;i++){
                const gem=gems[i];
                const sx=pos.x+i*28;
                const bg=this.add.rectangle(sx,pos.y,24,24,gem?0x222:0x111,0.6).setStrokeStyle(1,gem?(gem.category==='skill'?0xff6b35:gem.category==='operator'?0x4ecdc4:0x8888ff):0x444);
                this.inventoryUI.add(bg);
                if(gem){
                    const catColor=gem.category==='skill'?'#ff6b35':gem.category==='operator'?'#4ecdc4':'#8888ff';
                    this.inventoryUI.add(this.add.text(sx-6,pos.y-6,gem.icon,{fontSize:'14px'}).setOrigin(0));
                    this.inventoryUI.add(this.add.text(sx,pos.y+16,gem.name.substring(0,3),{fontSize:'8px',color:catColor}).setOrigin(0.5));
                }
            }
            // 連線數
            if(slot.links>0){
                this.inventoryUI.add(this.add.text(pos.x+sockets*28+5,pos.y,`🔗${slot.links}`,{fontSize:'10px',color:'#4ecdc4'}).setOrigin(0,0.5));
            }
        }
        // 右側：可用寶石列表
        this.inventoryUI.add(this.add.text(580,80,'💎 可用寶石',{fontSize:'14px',color:'#fff'}).setOrigin(0.5));
        let y=110;
        for(const key in GEM_TYPES){
            const gem=GEM_TYPES[key];
            const catColor=gem.category==='skill'?'#ff6b35':gem.category==='operator'?'#4ecdc4':'#8888ff';
            this.inventoryUI.add(this.add.text(580,y,gem.icon+' '+gem.name,{fontSize:'12px',color:catColor}).setOrigin(0,0.5));
            y+=20;
        }
        // 掉落物品
        this.inventoryUI.add(this.add.text(580,380,'🎒 背包',{fontSize:'14px',color:'#fff'}).setOrigin(0.5));
        const items=this.gameState.inventory.length>0?this.gameState.inventory:['(空)'];
        for(let i=0;i<items.length;i++){
            this.inventoryUI.add(this.add.text(580,405+i*20,items[i],{fontSize:'12px',color:'#00ffff'}).setOrigin(0,0.5));
        }
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
        const skills=this.equipment.getActiveSkills();let x=320;
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
        if(Phaser.Input.Keyboard.JustDown(this.keys[Phaser.Input.Keyboard.KeyCodes.SPACE])){this.heroGemSkillIndex=(this.heroGemSkillIndex+1)%this.equipment.getActiveSkills().length;this.updateGemDisplay();}
    }
    updateHero(delta,time){
        if(Phaser.Input.Keyboard.JustDown(this.keys[Phaser.Input.Keyboard.KeyCodes.Q]))this.useDash(time);
        if(Phaser.Input.Keyboard.JustDown(this.keys[Phaser.Input.Keyboard.KeyCodes.E]))this.useGemSkill(time);
        if(Phaser.Input.Keyboard.JustDown(this.keys[Phaser.Input.Keyboard.KeyCodes.R]))this.useUltimate(time);
        if(this.hero.targetPath.length>0){
            const t=this.hero.targetPath[this.hero.pathIndex],tx=t.x*40+20,ty=t.y*40+20,dx=tx-this.heroSprite.x,dy=ty-this.heroSprite.y,d=Math.sqrt(dx*dx+dy*dy);
            if(d<5){this.hero.pathIndex++;if(this.hero.pathIndex>=this.hero.targetPath.length){this.hero.targetPath=[];this.targetMarker.setVisible(false);this.attackRange.setVisible(false);}}
            else{const sp=this.hero.isDashing?this.hero.speed*2.5:this.hero.speed;this.heroSprite.x+=dx/d*sp*delta/1000;this.heroSprite.y+=dy/d*sp*delta/1000;}
        }
        // 直接移動到目標點
        if(this.hero.targetX!==undefined){
            const dx=this.hero.targetX-this.heroSprite.x,dy=this.hero.targetY-this.heroSprite.y,d=Math.sqrt(dx*dx+dy*dy);
            if(d>5){
                const sp=this.hero.speed*delta/1000;
                this.heroSprite.x+=dx/d*Math.min(sp,d);
                this.heroSprite.y+=dy/d*Math.min(sp,d);
            }else{this.hero.targetX=undefined;this.hero.targetY=undefined;this.targetMarker.setVisible(false);this.attackRange.setVisible(false);}
        }
        this.heroSprite.x=Phaser.Math.Clamp(this.heroSprite.x,20,780);this.heroSprite.y=Phaser.Math.Clamp(this.heroSprite.y,20,550);
        // 自動普攻
        this.hero.autoAttackTimer+=delta;
        if(this.hero.autoAttackTimer>=this.hero.skills.basic.cd){
            let target=null,minDist=this.hero.skills.basic.range;
            for(const e of this.gameState.enemies){
                const d=Phaser.Math.Distance.Between(this.heroSprite.x,this.heroSprite.y,e.sprite.x,e.sprite.y);
                if(d<minDist){minDist=d;target=e;}
            }
            if(target){
                this.hero.autoAttackTimer=0;
                const g=this.add.graphics();
                g.lineStyle(2,0xff6b35,0.8);g.lineBetween(this.heroSprite.x,this.heroSprite.y,target.sprite.x,target.sprite.y);
                this.time.delayedCall(80,()=>g.destroy());
                target.hp-=this.hero.skills.basic.dmg;
                this.showDamage(target.sprite.x,target.sprite.y-15,this.hero.skills.basic.dmg,'#ffa500');
                if(target.hp<=0)this.killEnemy(target,true);
            }
        }
        this.heroText.x=this.heroSprite.x-15;this.heroText.y=this.heroSprite.y-5;
        this.heroHpBar.x=this.heroSprite.x;this.heroHpBar.y=this.heroSprite.y-35;this.heroHpBar.width=40*(this.hero.hp/this.hero.maxHp);
    }
    useGemSkill(time){
        const skills=this.equipment.getActiveSkills(),skill=skills[this.heroGemSkillIndex];
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
        if(this.gameState.isGameOver||this.gameState.isPaused)return;
        // 直接移動到點擊位置
        this.hero.targetX=pointer.x;
        this.hero.targetY=pointer.y;
        this.hero.targetPath=[]; // 清除路徑
        this.targetMarker.setPosition(pointer.x,pointer.y).setVisible(true);
        this.attackRange.setPosition(pointer.x,pointer.y).setVisible(true);
    }
    deployTower(pd,idx){
        const gem=GEM_TYPES[this.selectedOpType];
        if(this.deploymentPoints<gem.cost||this.gameState.towers[idx])return;
        const isHigh=pd.type==='highground';
        if(isHigh&&(this.selectedOpType==='OP_TNK'||this.selectedOpType==='OP_MEL'))return;
        if(!isHigh&&(this.selectedOpType==='OP_RNG'||this.selectedOpType==='OP_MAG'))return;
        this.deploymentPoints-=gem.cost;gem.isDeployed=true;
        const tower={gem:gem,sprite:this.add.rectangle(pd.x,pd.y,35,35,gem.color).setInteractive(),text:this.add.text(pd.x-10,pd.y-8,gem.icon,{fontSize:'16px'}),hp:gem.hp*1.3,maxHp:gem.hp*1.3,atk:gem.atk*1.3,range:gem.range,block:gem.block,cost:gem.cost,attackCooldown:0,pointIndex:idx,hpBar:this.add.rectangle(pd.x,pd.y-30,30,4,0x0f0),rangeG:this.add.circle(pd.x,pd.y,gem.range,gem.color,0.1).setVisible(false)};
        tower.sprite.on('pointerover',()=>tower.rangeG.setVisible(true));tower.sprite.on('pointerout',()=>tower.rangeG.setVisible(false));
        this.gameState.towers[idx]=tower;
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
            if(Math.random()<0.3){const items=['⚔️武','🛡️防','💎寶'];const item=items[Math.floor(Math.random()*items.length)];this.gameState.inventory.push(item);this.showMessage('+'+item,e.sprite.x,e.sprite.y-50,'#00ffff');}
            this.showMessage('+'+e.reward,e.sprite.x,e.sprite.y-30,'#fd0');}
        e.sprite.destroy();e.text.destroy();const idx=this.gameState.enemies.indexOf(e);if(idx>-1)this.gameState.enemies.splice(idx,1);
    }
    updateUI(){this.goldText.setText(`金:${this.gameState.gold}`);this.costText.setText(`點:${this.deploymentPoints}`);this.waveText.setText(`波:${this.waveConfig.current}`);this.baseHpText.setText(`基:${this.gameState.baseHp}/10`);this.waveInfoText.setText(`敵:${this.waveConfig.enemiesSpawned}/${this.waveConfig.enemiesPerWave}`);}
    showDamage(x,y,t){const dmg=this.add.text(x,y,`-${t}`,{fontSize:'16px',color:'#f00',fontStyle:'bold'});this.tweens.add({targets:dmg,y:y-30,alpha:0,duration:500,onComplete:()=>dmg.destroy()});}
    showMessage(text,x,y,color='#fff'){const msg=this.add.text(x,y,text,{fontSize:'16px',color:color,fontStyle:'bold',stroke:'#000',strokeThickness:3});this.tweens.add({targets:msg,y:y-30,alpha:0,duration:1000,onComplete:()=>msg.destroy()});}
    gameOver(){this.gameState.isGameOver=true;this.add.rectangle(400,300,400,280,0x000,0.9);this.add.text(400,180,'💀遊戲結束',{fontSize:'36px',color:'#f00',fontStyle:'bold'}).setOrigin(0.5);this.add.text(400,240,'🌊波次:'+this.waveConfig.current,{fontSize:'18px',color:'#fff'}).setOrigin(0.5);this.add.text(400,280,'💰金幣:'+this.gameState.gold,{fontSize:'18px',color:'#fd0'}).setOrigin(0.5);this.add.text(400,320,'🎒掉落:'+(this.gameState.inventory.length>0?this.gameState.inventory.join(' '):'無'),{fontSize:'14px',color:'#00ffff'}).setOrigin(0.5);this.add.text(400,400,'點擊重新開始',{fontSize:'20px',color:'#4ecdc4',backgroundColor:'#333',padding:{x:20,y:10}}).setOrigin(0.5).setInteractive().on('pointerdown',()=>this.scene.restart());}
}
const config={type:Phaser.AUTO,width:800,height:600,parent:'game-container',backgroundColor:'#1a1a2e',scene:MainScene};
const game=new Phaser.Game(config);
