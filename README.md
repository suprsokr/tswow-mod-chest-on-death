# chest-on-death

A TSWoW module that spawns loot chests when creatures or players die, with configurable loot transfer mechanics.

## Features

### Creature Death Chests
- Spawns a loot chest at creature death location
- Two loot modes:
  - **Creature Loot Mode**: Copies the creature's actual loot drops to the chest
  - **Static Loot Mode**: Uses a predefined loot table from datascripts
- Configurable loot ownership (killer-only or free-for-all)
- Optional chest-only loot (removes corpse loot entirely)
- Quest item support

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
- Owner-only or free-for-all looting
- Configurable item removal (force reclaim or just copy)

## Configuration

All configuration is done in `livescripts/livescripts.ts` at the entry point. This gives you full visibility and control over both creature and player death chest behavior.

### Creature Death Configuration

```typescript
const creatureConfig: ChestOnDeathCreatureConfig = {
    USE_CREATURE_LOOT: true,           // Copy creature loot vs use chest loot table
    CHEST_ONLY_LOOT: true,             // Remove corpse loot when true
    OWNER_ONLY_LOOT: true,             // Restrict chest to killer/group
    SPAWN_EMPTY_CHESTS: false,         // Spawn chest even with no loot
    INCLUDE_QUEST_ITEMS: true,         // Include quest items in chest
    CHEST_DESPAWN_TIME: 300,           // Despawn time in seconds (5 minutes)
};
```

### Player Death Configuration

```typescript
const playerConfig: ChestOnDeathPlayerConfig = {
    // === BASIC SETTINGS ===
    ENABLE_PLAYER_DEATH_CHEST: true,   // Enable player death chests
    USE_PLAYER_ITEMS: true,             // Use player items vs chest loot table
    PLAYER_CHEST_OWNER_ONLY: true,     // Only dead player can loot
    REMOVE_PLAYER_ITEMS_ON_DEATH: true, // Remove items from player (must reclaim)
    PLAYER_CHEST_DESPAWN_TIME: 600,    // Despawn time in seconds (10 minutes)
    
    // === ITEM DROP SETTINGS ===
    // (Only apply when USE_PLAYER_ITEMS is true)
    MIN_ITEMS_TO_DROP: 1,               // Minimum items to drop (0 = can drop nothing)
    MAX_ITEMS_TO_DROP: -1,              // Maximum items to drop (-1 = all eligible)
    DROP_FROM_EQUIPPED: true,           // Equipped items are eligible
    DROP_FROM_BAGS: true,               // Bag items are eligible
    ELIGIBLE_ITEM_QUALITIES: [],        // Item quality filter (empty = all)
                                        // [0=Poor, 1=Common, 2=Uncommon, 3=Rare, 
                                        //  4=Epic, 5=Legendary, 6=Artifact, 7=Heirloom]
    
    // === MONEY DROP SETTINGS ===
    // (Only apply when USE_PLAYER_ITEMS is true)
    DROP_MONEY: true,                   // Money can drop
    MONEY_DROP_MIN_PERCENT: 0,          // Minimum % of money to drop (0-100)
    MONEY_DROP_MAX_PERCENT: 100,        // Maximum % of money to drop (0-100)
    MONEY_DROP_MIN_STATIC: 0,           // Minimum copper (overrides % if higher)
    MONEY_DROP_MAX_STATIC: -1,          // Maximum copper cap (-1 = no cap)
};
```

## Usage Examples

### Example 1: Standard Creature Loot Transfer

```typescript
const creatureConfig: ChestOnDeathCreatureConfig = {
    USE_CREATURE_LOOT: true,     // Transfer creature's actual loot
    CHEST_ONLY_LOOT: true,       // Remove corpse loot
    OWNER_ONLY_LOOT: true,       // Only killer can loot
    SPAWN_EMPTY_CHESTS: false,
    INCLUDE_QUEST_ITEMS: true,
    CHEST_DESPAWN_TIME: 300,
};
```

### Example 2: Hardcore Player Death (Drop Everything)

```typescript
const playerConfig: ChestOnDeathPlayerConfig = {
    ENABLE_PLAYER_DEATH_CHEST: true,
    USE_PLAYER_ITEMS: true,              // Use player's actual items
    PLAYER_CHEST_OWNER_ONLY: true,      // Only dead player can reclaim
    REMOVE_PLAYER_ITEMS_ON_DEATH: true, // Remove items (force reclaim)
    PLAYER_CHEST_DESPAWN_TIME: 600,
    
    // Drop all items from all slots
    MIN_ITEMS_TO_DROP: 0,
    MAX_ITEMS_TO_DROP: -1,               // -1 = all eligible items
    DROP_FROM_EQUIPPED: true,
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

### Example 3: Drop Only 1-3 Rare+ Items, 25-50% Money

```typescript
const playerConfig: ChestOnDeathPlayerConfig = {
    ENABLE_PLAYER_DEATH_CHEST: true,
    USE_PLAYER_ITEMS: true,
    PLAYER_CHEST_OWNER_ONLY: false,      // Anyone can loot (PvP penalty)
    REMOVE_PLAYER_ITEMS_ON_DEATH: true,
    PLAYER_CHEST_DESPAWN_TIME: 300,
    
    // Drop 1-3 items, only from bags, rare+ only
    MIN_ITEMS_TO_DROP: 1,
    MAX_ITEMS_TO_DROP: 3,
    DROP_FROM_EQUIPPED: false,           // Protected equipment
    DROP_FROM_BAGS: true,
    ELIGIBLE_ITEM_QUALITIES: [3, 4, 5],  // Rare, Epic, Legendary only
    
    // Drop 25-50% of money, minimum 1 gold
    DROP_MONEY: true,
    MONEY_DROP_MIN_PERCENT: 25,
    MONEY_DROP_MAX_PERCENT: 50,
    MONEY_DROP_MIN_STATIC: 10000,        // 1 gold = 10000 copper
    MONEY_DROP_MAX_STATIC: -1,
};
```

### Example 4: Bonus Loot Chest (Player Keeps Everything)

```typescript
const playerConfig: ChestOnDeathPlayerConfig = {
    ENABLE_PLAYER_DEATH_CHEST: true,
    USE_PLAYER_ITEMS: false,             // Use chest's loot table instead
    PLAYER_CHEST_OWNER_ONLY: true,
    REMOVE_PLAYER_ITEMS_ON_DEATH: false, // (Ignored when USE_PLAYER_ITEMS is false)
    PLAYER_CHEST_DESPAWN_TIME: 600,
    
    // Item/money drop settings are ignored when USE_PLAYER_ITEMS is false
    MIN_ITEMS_TO_DROP: 0,
    MAX_ITEMS_TO_DROP: -1,
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

Then define bonus loot in `datascripts/datascripts.ts`:

```typescript
LOOT_CHEST.Loot.modRefCopy(loot => {
    loot.addItem(6948, 1, 1, 1);  // Hearthstone (example bonus item)
    loot.setMoney(5000, 10000);   // 50 silver - 1 gold
});
```

## Code Structure
```
livescripts/
├── livescripts.ts              # Main entry point - CONFIGURE HERE
├── shared/
│   ├── config.ts               # Configuration type definitions
│   ├── constants.ts            # Shared constants
│   └── utilities.ts            # Shared utility functions
└── handlers/
    ├── creatureDeathHandler.ts # Creature death logic
    └── playerDeathHandler.ts   # Player death logic
```
