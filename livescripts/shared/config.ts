/**
 * Configuration interfaces for the chest-on-death module
 */

/**
 * Loot ownership modes
 */
export type LootOwnershipMode = 
    | 'free-for-all'      // Anyone can loot
    | 'owner-only'        // Only the owner (killer/dead player) can loot
    | 'owner-and-group';  // Owner and their group members can loot

/**
 * Configuration for creature death chest spawning
 */
export interface ChestOnDeathCreatureConfig {
    // If true, copy creature's actual loot drops to chest
    // If false, use chest's loot table defined in datascript
    USE_CREATURE_LOOT: boolean;
    
    // If true, creatures will not drop any loot on their body (all loot goes to chest)
    // If false, creatures drop loot normally AND spawn a chest with loot
    CHEST_ONLY_LOOT: boolean;
    
    // Who can loot the chest
    // 'free-for-all': Anyone can loot
    // 'owner-only': Only the killer can loot
    // 'owner-and-group': Killer and their group members can loot
    LOOT_OWNERSHIP: LootOwnershipMode;
    
    // If true, spawn chests even when creatures have no loot
    // If false, only spawn chests when there's loot to transfer
    SPAWN_EMPTY_CHESTS: boolean;
    
    // If true, include quest items in chest loot
    // If false, skip quest items
    INCLUDE_QUEST_ITEMS: boolean;
    
    // How long the chest stays in the world (in seconds)
    CHEST_DESPAWN_TIME: number;
}

/**
 * Configuration for player death chest spawning
 */
export interface ChestOnDeathPlayerConfig {
    // If true, spawn a chest when players die containing their items
    ENABLE_PLAYER_DEATH_CHEST: boolean;
    
    // If true, use player's actual items for chest loot (with filtering/selection applied)
    // If false, use chest's loot table defined in datascript (ignores player items)
    USE_PLAYER_ITEMS: boolean;
    
    // Who can loot the player's death chest
    // 'free-for-all': Anyone can loot
    // 'owner-only': Only the dead player can loot
    // 'owner-and-group': Dead player and their group members can loot
    LOOT_OWNERSHIP: LootOwnershipMode;
    
    // If true, remove items from player inventory on death (they must reclaim from chest)
    // If false, items stay in player inventory (chest has copies)
    // Note: Only applies when USE_PLAYER_ITEMS is true
    REMOVE_PLAYER_ITEMS_ON_DEATH: boolean;
    
    // Despawn time for player death chests (in seconds)
    PLAYER_CHEST_DESPAWN_TIME: number;
    
    // === ITEM DROP SETTINGS ===
    // Note: These settings only apply when USE_PLAYER_ITEMS is true
    
    // Minimum number of items to drop (0 = can drop nothing)
    MIN_ITEMS_TO_DROP: number;
    
    // Maximum number of items to drop (-1 = all eligible items)
    MAX_ITEMS_TO_DROP: number;
    
    // If true, equipped items are eligible for dropping
    DROP_FROM_EQUIPPED: boolean;
    
    // If true, bag items are eligible for dropping
    DROP_FROM_BAGS: boolean;
    
    // Item qualities eligible for dropping (0=Poor, 1=Common, 2=Uncommon, 3=Rare, 4=Epic, 5=Legendary, 6=Artifact, 7=Heirloom)
    // Empty array = all qualities eligible
    ELIGIBLE_ITEM_QUALITIES: number[];
    
    // === MONEY DROP SETTINGS ===
    // Note: These settings only apply when USE_PLAYER_ITEMS is true
    
    // If true, money can be included in death chest
    DROP_MONEY: boolean;
    
    // Minimum percentage of money to drop (0-100)
    MONEY_DROP_MIN_PERCENT: number;
    
    // Maximum percentage of money to drop (0-100)
    MONEY_DROP_MAX_PERCENT: number;
    
    // Minimum static money to drop (in copper, overrides percentage if higher)
    MONEY_DROP_MIN_STATIC: number;
    
    // Maximum static money to drop (in copper, caps the dropped amount)
    // -1 = no cap
    MONEY_DROP_MAX_STATIC: number;
}
