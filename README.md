# chest-on-death

A TSWoW module that spawns loot chests when creatures or players die, with configurable loot transfer mechanics.

## Features

### Creature Death Chests
- Spawns a loot chest at creature death location
- Two loot modes:
  - **Creature Loot Mode**: Copies the creature's actual loot drops to the chest
  - **Static Loot Mode**: Uses a predefined loot table from datascripts
- **Flexible Ownership Modes:**
  - Free-for-all: Anyone can loot
  - Owner-only: Only the killer can loot
  - Owner-and-group: Killer and their group members can loot
- Optional chest-only loot (removes corpse loot entirely)
- Quest item support
- Auto-despawn when fully looted

### Player Death Chests
- Spawns a chest when players die
- Two loot modes:
  - **Player Items Mode**: Transfers player's items to chest (with advanced filtering)
  - **Static Loot Mode**: Uses a predefined loot table (player keeps all items)
- **Advanced Item Filtering:**
  - Random selection: drop min-max number of items
  - Slot filtering: choose which slots are eligible (bags, equipped, or both)
  - Quality filtering: filter by item quality/rarity
- **Flexible Money Drops:**
  - Percentage-based: drop X-Y% of player's money
  - Static amounts: minimum and maximum copper values
- **Flexible Ownership Modes:**
  - Free-for-all: Anyone can loot (PvP penalty mode)
  - Owner-only: Only the dead player can loot
  - Owner-and-group: Dead player and their group members can loot
- Configurable item removal (force reclaim or just copy)
- Auto-despawn when fully looted

## Configuration

All configuration is done in `livescripts/livescripts.ts` at the entry point. This gives you full visibility and control over both creature and player death chest behavior.

### Creature Death Configuration

```typescript
const creatureConfig: ChestOnDeathCreatureConfig = {
    USE_CREATURE_LOOT: true,              // Copy creature loot vs use chest loot table
    CHEST_ONLY_LOOT: true,                // Remove corpse loot when true
    LOOT_OWNERSHIP: 'owner-and-group',    // Who can loot: 'free-for-all', 'owner-only', 'owner-and-group'
    SPAWN_EMPTY_CHESTS: false,            // Spawn chest even with no loot
    INCLUDE_QUEST_ITEMS: true,            // Include quest items in chest
    CHEST_DESPAWN_TIME: 300,              // Despawn time in seconds (5 minutes)
};
```

**Loot Ownership Modes:**
- `'free-for-all'`: Anyone can loot the chest
- `'owner-only'`: Only the killer can loot
- `'owner-and-group'`: Killer and their group members can loot

### Player Death Configuration

```typescript
const playerConfig: ChestOnDeathPlayerConfig = {
    // === BASIC SETTINGS ===
    ENABLE_PLAYER_DEATH_CHEST: true,    // Enable player death chests
    USE_PLAYER_ITEMS: true,              // Use player items vs chest loot table
    LOOT_OWNERSHIP: 'owner-only',        // Who can loot: 'free-for-all', 'owner-only', 'owner-and-group'
    REMOVE_PLAYER_ITEMS_ON_DEATH: true,  // Remove items from player (must reclaim)
    PLAYER_CHEST_DESPAWN_TIME: 600,     // Despawn time in seconds (10 minutes)
    
    // === ITEM DROP SETTINGS ===
    // (Only apply when USE_PLAYER_ITEMS is true)
    MIN_ITEMS_TO_DROP: 1,                // Minimum items to drop (0 = can drop nothing)
    MAX_ITEMS_TO_DROP: -1,               // Maximum items to drop (-1 = all eligible)
    DROP_FROM_EQUIPPED: true,            // Equipped items are eligible
    DROP_FROM_BAGS: true,                // Bag items are eligible
    ELIGIBLE_ITEM_QUALITIES: [],         // Item quality filter (empty = all)
                                         // [0=Poor, 1=Common, 2=Uncommon, 3=Rare, 
                                         //  4=Epic, 5=Legendary, 6=Artifact, 7=Heirloom]
    
    // === MONEY DROP SETTINGS ===
    // (Only apply when USE_PLAYER_ITEMS is true)
    DROP_MONEY: true,                    // Money can drop
    MONEY_DROP_MIN_PERCENT: 0,           // Minimum % of money to drop (0-100)
    MONEY_DROP_MAX_PERCENT: 100,         // Maximum % of money to drop (0-100)
    MONEY_DROP_MIN_STATIC: 0,            // Minimum copper (overrides % if higher)
    MONEY_DROP_MAX_STATIC: -1,           // Maximum copper cap (-1 = no cap)
};
```

**Loot Ownership Modes:**
- `'free-for-all'`: Anyone can loot the chest (PvP penalty mode)
- `'owner-only'`: Only the dead player can loot
- `'owner-and-group'`: Dead player and their group members can loot

## Usage Examples

### Example 1: Free-For-All Creature Chest

Anyone can loot creature chests.

```typescript
const creatureConfig: ChestOnDeathCreatureConfig = {
    USE_CREATURE_LOOT: true,           // Transfer creature's actual loot
    CHEST_ONLY_LOOT: true,             // Remove corpse loot
    LOOT_OWNERSHIP: 'free-for-all',    // Anyone can loot
    SPAWN_EMPTY_CHESTS: false,
    INCLUDE_QUEST_ITEMS: true,
    CHEST_DESPAWN_TIME: 300,
};
```

### Example 2: Hardcore PvP - Drop Grey/Green Items (Free-For-All)

Players drop only common quality items that anyone can loot - light death penalty with PvP risk.

```typescript
const playerConfig: ChestOnDeathPlayerConfig = {
    ENABLE_PLAYER_DEATH_CHEST: true,
    USE_PLAYER_ITEMS: true,              // Use player's actual items
    LOOT_OWNERSHIP: 'free-for-all',      // Anyone can loot
    REMOVE_PLAYER_ITEMS_ON_DEATH: true,  // Remove items (force reclaim)
    PLAYER_CHEST_DESPAWN_TIME: 300,      // 5 minutes to reclaim
    
    // Drop all grey/green items from bags
    MIN_ITEMS_TO_DROP: 0,
    MAX_ITEMS_TO_DROP: -1,               // All eligible items
    DROP_FROM_EQUIPPED: false,           // Keep equipped gear safe
    DROP_FROM_BAGS: true,
    ELIGIBLE_ITEM_QUALITIES: [0, 1],     // Poor and Common only
    
    // Drop small amount of money
    DROP_MONEY: true,
    MONEY_DROP_MIN_PERCENT: 10,
    MONEY_DROP_MAX_PERCENT: 25,
    MONEY_DROP_MIN_STATIC: 0,
    MONEY_DROP_MAX_STATIC: -1,
};
```

### Example 3: Group Reclaim - Drop All Items (Owner and Group)

Player drops everything but can be reclaimed by self or group members - cooperative death penalty.

```typescript
const playerConfig: ChestOnDeathPlayerConfig = {
    ENABLE_PLAYER_DEATH_CHEST: true,
    USE_PLAYER_ITEMS: true,              // Use player's actual items
    LOOT_OWNERSHIP: 'owner-and-group',   // Player and group can loot
    REMOVE_PLAYER_ITEMS_ON_DEATH: true,  // Remove items (force reclaim)
    PLAYER_CHEST_DESPAWN_TIME: 600,      // 10 minutes to reclaim
    
    // Drop everything from all slots
    MIN_ITEMS_TO_DROP: 0,
    MAX_ITEMS_TO_DROP: -1,               // All items
    DROP_FROM_EQUIPPED: true,            // Including equipped gear
    DROP_FROM_BAGS: true,
    ELIGIBLE_ITEM_QUALITIES: [],         // All qualities
    
    // Drop all money
    DROP_MONEY: true,
    MONEY_DROP_MIN_PERCENT: 100,
    MONEY_DROP_MAX_PERCENT: 100,
    MONEY_DROP_MIN_STATIC: 0,
    MONEY_DROP_MAX_STATIC: -1,
};
```

### Example 4: Bonus Money Chest (No Item Loss)

Spawns a chest with bonus gold when player dies - player keeps all their items.

```typescript
const playerConfig: ChestOnDeathPlayerConfig = {
    ENABLE_PLAYER_DEATH_CHEST: true,
    USE_PLAYER_ITEMS: false,              // Use chest's loot table (no item loss)
    LOOT_OWNERSHIP: 'owner-only',         // Only dead player can loot
    REMOVE_PLAYER_ITEMS_ON_DEATH: false,  // Player keeps everything
    PLAYER_CHEST_DESPAWN_TIME: 600,
    
    // These settings are ignored when USE_PLAYER_ITEMS is false
    MIN_ITEMS_TO_DROP: 0,
    MAX_ITEMS_TO_DROP: 0,
    DROP_FROM_EQUIPPED: false,
    DROP_FROM_BAGS: false,
    ELIGIBLE_ITEM_QUALITIES: [],
    DROP_MONEY: false,
    MONEY_DROP_MIN_PERCENT: 0,
    MONEY_DROP_MAX_PERCENT: 0,
    MONEY_DROP_MIN_STATIC: 0,
    MONEY_DROP_MAX_STATIC: -1,
};
```

Then define the bonus money in `datascripts/datascripts.ts`:

```typescript
LOOT_CHEST.Loot.modRefCopy(loot => {
    loot.setMoney(50000, 100000);   // 5-10 gold bonus on death
});
```

## Code Structure
```
livescripts/
├── livescripts.ts              # Main entry point - CONFIGURE HERE
├── shared/
│   ├── config.ts               # Configuration type definitions
│   ├── constants.ts            # Shared constants
│   ├── utilities.ts            # Shared utility functions
│   └── chestPermissions.ts     # Ownership & permission system
└── handlers/
    ├── creatureDeathHandler.ts # Creature death logic
    └── playerDeathHandler.ts   # Player death logic
```