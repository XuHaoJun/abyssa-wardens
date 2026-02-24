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
        // 初始裝備 - 每種物品各一個
        this.equipment={
            '雙手武器':[GEM_TYPES.SKILL_FIREBALL],
            '胸甲':[GEM_TYPES.OP_RNG],
            '頭盔':[GEM_TYPES.SKILL_LIGHTNING],
            '手套':[GEM_TYPES.SUPPORT_DAMAGE],
            '鞋子':[GEM_TYPES.SUPPORT_SPEED],
            '主手':[GEM_TYPES.SKILL_POISON],
            '副手':[GEM_TYPES.OP_HEAL],
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
    
    equipFromInventory(index){
        const itemName = this.gameState.inventory[index];
        if(!itemName) return;
        
        for(const key in GEM_TYPES){
            const gem = GEM_TYPES[key];
            if(gem.icon+' '+gem.name === itemName){
                let targetSlot = null;
                if(gem.category === 'skill') targetSlot = '主手';
                else if(gem.category === 'operator') targetSlot = '胸甲';
                else if(gem.category === 'support') targetSlot = '手套';
                
                if(targetSlot && (!this.equipment.equipment[targetSlot] || this.equipment.equipment[targetSlot].length === 0)){
                    this.equipment.equipment[targetSlot] = [gem];
                    this.gameState.inventory.splice(index, 1);
                    this.toggleInventory();
                    return;
                }
            }
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
    createGemUI(){
        this.add.text(300,530,'【靈樞】SPACE:',{fontSize:'12px',color:'#4ecdc4'});
        this.updateGemDisplay();
    }
    updateGemDisplay(){
        const skills=this.equipment.getActiveSkills();let x=320;
        for(let i=0;i<skills.length;i++){
            const s=skills[i],isActive=i===this.heroGemSkillIndex,c=isActive?'#0f0':'#888';
            this.add.rectangle(x,560,30,30,0x333,0.8).setStrokeStyle(2,c);
            this.add.text(x-8,552,s.icon,{fontSize:'16px'});
            x+=35;
        }
    }

toggleInventory(){
        if(this.inventoryUI){this.inventoryUI.destroy();this.inventoryUI=null;return;}
        this.inventoryUI=this.add.container(0,0).setDepth(50);
        this.inventoryUI.add(this.add.rectangle(400,300,760,540,0x111111,0.98));
        this.inventoryUI.add(this.add.text(400,25,'背包與裝備',{fontSize:'22px',color:'#ffd700',fontStyle:'bold'}).setOrigin(0.5));
        
        const slots = [
            {name:'頭盔',x:180,y:80},{name:'項鍊',x:250,y:80},
            {name:'胸甲',x:180,y:150},{name:'護腕',x:250,y:150},
            {name:'腰帶',x:180,y:220},
            {name:'主手',x:110,y:300},{name:'副手',x:250,y:300},
            {name:'手套',x:110,y:370},{name:'鞋子',x:250,y:370},
            {name:'戒指',x:110,y:440},{name:'戒指',x:250,y:440},
        ];
        
        for(const s of slots){
            const key = s.name;
            const gems = this.equipment.equipment[key] || [];
            const gem = gems[0];
            const hasGem = !!gem;
            const bg = this.add.rectangle(s.x, s.y, 50, 50, hasGem ? (gem.category==='skill'?0x3a2010:gem.category==='operator'?0x102a20:0x10103a) : 0x1a1a1a, 0.9)
                .setStrokeStyle(hasGem ? 3 : 2, hasGem ? 0xffd700 : 0x555555);
            bg.setInteractive();
            if(hasGem){
                this.inventoryUI.add(this.add.text(s.x-20, s.y-20, gem.icon, {fontSize:'26px'}));
            } else {
                this.inventoryUI.add(this.add.text(s.x-12, s.y-6, 'EMPTY', {fontSize:'10px', color:'#444'}));
            }
            this.inventoryUI.add(this.add.text(s.x, s.y+32, key, {fontSize:'11px',color:'#888'}).setOrigin(0.5));
            bg.on('pointerover', () => { if(gem) this.showItemTooltip(gem, s.x, s.y-35); });
            bg.on('pointerout', () => { if(this.tooltip){ this.tooltip.destroy(); this.tooltip = null; } });
            bg.on('pointerdown', () => { 
                if(gem && this.gameState.inventory.length < 30){
                    this.gameState.inventory.push(gem.icon+' '+gem.name);
                    this.equipment.equipment[key] = [];
                    this.toggleInventory();
                }
            });
            this.inventoryUI.add(bg);
        }
        
        this.inventoryUI.add(this.add.text(560,40,'背包',{fontSize:'16px',color:'#c0c0c0'}).setOrigin(0.5));
        for(let i=0;i<30;i++){
            const row=Math.floor(i/6),col=i%6;
            const bx=430+col*45,by=70+row*45;
            const item=this.gameState.inventory[i];
            const bg=this.add.rectangle(bx,by,40,40,item?0x2a2a2a:0x151515,0.9).setStrokeStyle(1,item?0x00ffff:0x333333);
            if(item) this.inventoryUI.add(this.add.text(bx-10,by-10,item,{fontSize:'18px'}));
            bg.setInteractive();
            bg.on('pointerover', () => { if(item) this.showItemTooltip({name:item,desc:'擊殺掉落'},bx,by-25); });
            bg.on('pointerout', () => { if(this.tooltip){ this.tooltip.destroy(); this.tooltip = null; } });
            bg.on('pointerdown', () => { this.equipFromInventory(i); });
            this.inventoryUI.add(bg);
        }
        
        this.inventoryUI.add(this.add.text(400,520,'按 B 關閉',{fontSize:'12px',color:'#666'}).setOrigin(0.5));
        this.inventoryUI.add(this.add.text(560,520,'金幣: '+this.gameState.gold,{fontSize:'12px',color:'#ffd700'}).setOrigin(0.5));
    }
    showItemTooltip(item,x,y){
        if(this.tooltip)this.tooltip.destroy();
        this.tooltip=this.add.container(x,y).setDepth(100);
        const lines=[item.name];
        if(item.category==='skill'){lines.push('🔥 技能');if(item.damage)lines.push('⚔️ '+item.damage);if(item.range)lines.push('📏 '+item.range);}
        else if(item.category==='operator'){lines.push('🛡️ 幹員');if(item.hp)lines.push('❤️ '+item.hp);if(item.atk)lines.push('⚔️ '+item.atk);if(item.cost)lines.push('💰 '+item.cost);}
        else if(item.category==='support'){lines.push('🔵 輔助');if(item.dmgBonus)lines.push('💪 x'+item.dmgBonus);}
        else if(item.desc)lines.push(item.desc);
        const h=lines.length*15+8,w=100;
        this.tooltip.add(this.add.rectangle(0,0,w,h,0x000,0.95).setStrokeStyle(1,0xffd700));
        for(let i=0;i<lines.length;i++)this.tooltip.add(this.add.text(-w/2+4,-h/2+6+i*14,lines[i],{fontSize:'10px',color:'#fff'}));
    }
}
const config={type:Phaser.AUTO,width:800,height:600,parent:"game-container",backgroundColor:"#1a1a2e",scene:MainScene};
const game=new Phaser.Game(config);
