import { registerCreatureDeathHandler } from './handlers/creatureDeathHandler';
import { registerPlayerDeathHandler } from './handlers/playerDeathHandler';
import { ChestOnDeathCreatureConfig, ChestOnDeathPlayerConfig } from './shared/config';
import { registerChestOwner, registerChestPermissions } from './shared/chestPermissions';

export function Main(events: TSEvents) {
    console.log("[chest-on-death] Module loaded - chest spawning enabled");
    
    // Configure creature death chests
    const creatureConfig: ChestOnDeathCreatureConfig = {
        USE_CREATURE_LOOT: true,
        CHEST_ONLY_LOOT: true,
        LOOT_OWNERSHIP: 'owner-and-group',   // Killer and group can loot
        SPAWN_EMPTY_CHESTS: false,
        INCLUDE_QUEST_ITEMS: true,
        CHEST_DESPAWN_TIME: 300, // 5 minutes
    };
    
    // Configure player death chests
    const playerConfig: ChestOnDeathPlayerConfig = {
        ENABLE_PLAYER_DEATH_CHEST: true,
        USE_PLAYER_ITEMS: true,              // Use player items (vs. chest loot table)
        LOOT_OWNERSHIP: 'owner-only',        // Only dead player can loot
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
    
    // Get the chest entry ID (compile-time macro)
    const chestEntryId = UTAG('chest-on-death', 'loot-chest');
    
    // Register chest permission checking
    registerChestPermissions(events, chestEntryId);
    
    // Register event handlers with ownership tracking
    registerCreatureDeathHandler(events, creatureConfig, registerChestOwner);
    registerPlayerDeathHandler(events, playerConfig, registerChestOwner);
}
