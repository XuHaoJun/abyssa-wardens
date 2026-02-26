// ========== Abyssal Wardens - 裝備數據 ==========

const CONFIG = { width:800, height:600, tileSize:40, cols:20, rows:15,
    deployPoints:[{x:100,y:200,type:'ground'},{x:100,y:400,type:'ground'},{x:300,y:200,type:'highground'},{x:300,y:400,type:'highground'},{x:500,y:200,type:'highground'},{x:500,y:400,type:'highground'},{x:700,y:200,type:'ground'},{x:700,y:400,type:'ground'}] };

const ELITE_AFFIXES = { FROST:{name:'冰',icon:'❄️',color:0x00ffff},ARMOR:{name:'盾',icon:'🛡️',color:0x888888,hpBonus:1.5},FIRE:{name:'火',icon:'🔥',color:0xff4400,dmg:50,range:60},HEAL:{name:'癒',icon:'💚',color:0x00ff00} };

// ========== 裝備物品 (Items) ==========
const WEAPONS = [
    {id:'weapon_001',name:'長劍',icon:'🗡️',slots:3,stats:{damage:25,attack_speed:1.2}},
    {id:'weapon_002',name:'巨斧',icon:'🪓',slots:6,stats:{damage:50,attack_speed:0.8}},
    {id:'weapon_003',name:'法杖',icon:'🪄',slots:6,stats:{damage:15,spell_power:40}},
    {id:'weapon_004',name:'弓',icon:'🏹',slots:4,stats:{damage:30,attack_speed:1.5}},
    {id:'weapon_005',name:'盾牌',icon:'🛡️',slots:3,stats:{block:20,armor:15}},
    {id:'weapon_006',name:'匕首',icon:'🔪',slots:2,stats:{damage:15,attack_speed:2.0}}
];

const ARMORS = [
    {id:'armor_001',name:'皮甲',icon:'🥋',slots:4,stats:{armor:20,evasion:50}},
    {id:'armor_002',name:'鎖甲',icon:'🧥',slots:4,stats:{armor:40,evasion:20}},
    {id:'armor_003',name:'板甲',icon:'🦺',slots:4,stats:{armor:80,evasion:5}},
    {id:'armor_004',name:'法袍',icon:'🧙',slots:4,stats:{armor:10,energy_shield:30}}
];

const HELMETS = [
    {id:'helm_001',name:'皮帽',icon:'🧢',slots:4,stats:{armor:8,evasion:15}},
    {id:'helm_002',name:'頭盔',icon:'⛑️',slots:4,stats:{armor:20,evasion:5}}
];

const GLOVES = [
    {id:'gloves_001',name:'皮手套',icon:'🧤',slots:4,stats:{armor:8,evasion:10}},
    {id:'gloves_002',name:'鐵手套',icon:'🥊',slots:4,stats:{armor:18,evasion:3}}
];

const BOOTS = [
    {id:'boots_001',name:'皮靴',icon:'👞',slots:4,stats:{armor:8,evasion:15,move_speed:3}},
    {id:'boots_002',name:'鐵靴',icon:'👢',slots:4,stats:{armor:18,move_speed:2}}
];

// ========== 寶石 (Gems) ==========
const SKILL_GEMS = [
    {id:'skill_001',name:'旋風斬',icon:'🌀',type:'skill',damage_percent:80,cooldown:10,range:4},
    {id:'skill_002',name:'多重箭',icon:'🏹',type:'skill',damage_percent:60,cooldown:8,range:15},
    {id:'skill_003',name:'冰霜新星',icon:'❄️',type:'skill',damage_percent:100,cooldown:12,range:8},
    {id:'skill_004',name:'隕石術',icon:'☄️',type:'skill',damage_percent:250,cooldown:15,range:20},
    {id:'skill_005',name:'閃電脈衝',icon:'⚡',type:'skill',damage_percent:90,cooldown:6,range:18}
];

const OPERATOR_GEMS = [
    {id:'op_001',name:'盾衛',icon:'🛡️',type:'operator',hp:1200,def:80,res:10,cost:5,block:3,category:'TNK'},
    {id:'op_002',name:'鐵壁',icon:'🏰',type:'operator',hp:2000,def:120,res:15,cost:7,block:4,category:'TNK'},
    {id:'op_004',name:'劍舞者',icon:'⚔️',type:'operator',hp:700,def:30,res:15,cost:4,block:2,category:'MEL'},
    {id:'op_006',name:'狙擊手',icon:'🎯',type:'operator',hp:400,def:15,res:20,cost:5,range:20,category:'RNG'},
    {id:'op_008',name:'元素師',icon:'🔮',type:'operator',hp:350,def:10,res:40,cost:5,range:12,category:'MAG'},
    {id:'op_011',name:'光牧',icon:'💚',type:'operator',hp:500,def:20,res:25,cost:4,range:10,category:'SUP',heal:30}
];

const SUPPORT_GEMS = [
    {id:'supp_001',name:'範圍擴大',icon:'📐',type:'support',area_percent:40},
    {id:'supp_002',name:'高階多重',icon:'🎯',type:'support',projectile_count:2},
    {id:'supp_003',name:'連鎖',icon:'⛓️',type:'support',chain_count:3},
    {id:'supp_007',name:'附加火焰',icon:'🔥',type:'support',flat_fire_damage:10},
    {id:'supp_014',name:'減速',icon:'❄️',type:'support',slow_percent:20}
];

const ALL_GEMS = [...SKILL_GEMS,...OPERATOR_GEMS,...SUPPORT_GEMS];

const EQUIP_SLOTS = {
    '雙手武器':{icon:'⚔️'},'胸甲':{icon:'🛡️'},'頭盔':{icon:'⛑️'},
    '手套':{icon:'🧤'},'鞋子':{icon:'👢'},'主手':{icon:'🗡️'},
    '副手':{icon:'🛡️'},'項鍊':{icon:'📿'},'戒指':{icon:'💍'}
};

// ========== 裝備系統 ==========
class EquipmentSystem {
    constructor(){
        // 預設裝備 + 寶石
        this.equipment = {
            '雙手武器': { item: WEAPONS[0], gems: [SKILL_GEMS[0], SKILL_GEMS[3], null] },  // 長劍 + 旋風斬 + 隕石術
            '胸甲': { item: ARMORS[0], gems: [OPERATOR_GEMS[0], OPERATOR_GEMS[3], OPERATOR_GEMS[5], null] },  // 皮甲 + 盾衛 + 狙擊手 + 光牧
            '頭盔': { item: HELMETS[0], gems: [SKILL_GEMS[4], SUPPORT_GEMS[0], SUPPORT_GEMS[3], null] },  // 皮帽 + 閃電脈衝 + 範圍擴大 + 附加火焰
            '手套': { item: GLOVES[0], gems: [SUPPORT_GEMS[1], SUPPORT_GEMS[4], null, null] },  // 皮手套 + 高階多重 + 減速
            '鞋子': { item: BOOTS[0], gems: [SUPPORT_GEMS[2], null, null, null] },  // 皮靴 + 連鎖
            '主手': { item: WEAPONS[5], gems: [SKILL_GEMS[1], null] },  // 匕首 + 多重箭
            '副手': { item: WEAPONS[4], gems: [OPERATOR_GEMS[1], null, null] },  // 盾牌 + 鐵壁
            '項鍊': { item: null, gems: [] },
            '戒指': { item: null, gems: [] }
        };
        this.deployed = {};
        this.inventory = [];
    }
    
    getHeroSkills(){
        const skills = [];
        for(const slotName in this.equipment){
            const eq = this.equipment[slotName];
            if(eq.item && eq.gems){
                for(const gem of eq.gems){
                    if(gem && gem.type === 'skill' && !this.isGemDeployed(gem)){
                        skills.push({...gem, slot:slotName});
                    }
                }
            }
        }
        return skills;
    }
    
    getDeployableOperators(){
        const ops = [];
        for(const slotName in this.equipment){
            const eq = this.equipment[slotName];
            if(eq.item && eq.gems){
                for(const gem of eq.gems){
                    if(gem && gem.type === 'operator' && !this.isGemDeployed(gem)){
                        ops.push({...gem, slot:slotName});
                    }
                }
            }
        }
        return ops;
    }
    
    isGemDeployed(gem){
        for(const key in this.deployed){
            if(this.deployed[key] === gem) return true;
        }
        return false;
    }
    
    deploy(gem, pointIndex){
        if(gem && gem.type === 'operator'){
            this.deployed[pointIndex] = gem;
            return true;
        }
        return false;
    }
    
    retreat(pointIndex){
        if(this.deployed[pointIndex]){
            delete this.deployed[pointIndex];
            return true;
        }
        return false;
    }
}

// ========== AStar Pathfinding ==========
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
