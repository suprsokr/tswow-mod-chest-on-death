import { registerCreatureDeathHandler } from './handlers/creatureDeathHandler';
import { registerPlayerDeathHandler } from './handlers/playerDeathHandler';
import { ChestOnDeathCreatureConfig, ChestOnDeathPlayerConfig } from './shared/config';

export function Main(events: TSEvents) {
    console.log("[chest-on-death] Module loaded - chest spawning enabled");
    
    // Configure creature death chests
    const creatureConfig: ChestOnDeathCreatureConfig = {
        USE_CREATURE_LOOT: true,
        CHEST_ONLY_LOOT: true,
        OWNER_ONLY_LOOT: true,
        SPAWN_EMPTY_CHESTS: false,
        INCLUDE_QUEST_ITEMS: true,
        CHEST_DESPAWN_TIME: 300, // 5 minutes
    };
    
    // Configure player death chests
    const playerConfig: ChestOnDeathPlayerConfig = {
        ENABLE_PLAYER_DEATH_CHEST: true,
        USE_PLAYER_ITEMS: true,              // Use player items (vs. chest loot table)
        PLAYER_CHEST_OWNER_ONLY: true,
        REMOVE_PLAYER_ITEMS_ON_DEATH: true,
        PLAYER_CHEST_DESPAWN_TIME: 600,      // 10 minutes
        
        // Item drop settings
        MIN_ITEMS_TO_DROP: 1,                // Drop at least 1 item
        MAX_ITEMS_TO_DROP: -1,               // -1 = drop all eligible items (no limit)
        DROP_FROM_EQUIPPED: true,            // Equipped items can drop
        DROP_FROM_BAGS: true,                // Bag items can drop
        ELIGIBLE_ITEM_QUALITIES: [],         // Empty = all qualities eligible
        
        // Money drop settings
        DROP_MONEY: true,                    // Money can drop
        MONEY_DROP_MIN_PERCENT: 0,           // Drop at least 0% of money
        MONEY_DROP_MAX_PERCENT: 100,         // Drop up to 100% of money
        MONEY_DROP_MIN_STATIC: 0,            // No minimum static amount
        MONEY_DROP_MAX_STATIC: -1,           // -1 = no cap on money dropped
    };
    
    // Register event handlers
    registerCreatureDeathHandler(events, creatureConfig);
    registerPlayerDeathHandler(events, playerConfig);
}
