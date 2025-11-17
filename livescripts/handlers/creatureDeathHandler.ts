import { ChestOnDeathCreatureConfig } from '../shared/config';
import { 
    spawnChest, 
    initializeChestLoot, 
    setLootOwner, 
    addRegularItemToLoot, 
    addQuestItemToLoot 
} from '../shared/utilities';

/**
 * Handles creature death and spawns loot chests
 */
export function registerCreatureDeathHandler(events: TSEvents, config: ChestOnDeathCreatureConfig): void {
    // Use OnGenerateLoot instead of OnDeath to properly access creature loot
    // This event fires after loot is generated but before it's shown to players
    events.Creature.OnGenerateLoot((creature, killer) => {
        // Check if we should skip based on USE_CREATURE_LOOT and loot availability
        if (config.USE_CREATURE_LOOT) {
            // Get the creature's loot object (guaranteed to exist in OnGenerateLoot)
            const creatureLoot = creature.GetLoot();
            
            // Check if there's loot to transfer
            const hasItems = creatureLoot.GetItemCount() > 0;
            const hasQuestItems = creatureLoot.GetQuestItemCount() > 0;
            const hasMoney = creatureLoot.GetMoney() > 0;
            const hasAnyLoot = hasItems || hasQuestItems || hasMoney;
            
            // Skip chest spawn if no loot and empty chests are disabled
            if (!hasAnyLoot && !config.SPAWN_EMPTY_CHESTS) {
                return;
            }
        }
        
        // Spawn the chest at creature's position
        // UTAG is a compile-time macro and requires literal string arguments
        const chestEntryId = UTAG('chest-on-death', 'loot-chest');
        const chest = spawnChest(
            creature,
            chestEntryId,
            creature.GetX(),
            creature.GetY(),
            creature.GetZ(),
            creature.GetO(),
            config.CHEST_DESPAWN_TIME
        );
        
        if (!chest) {
            console.error(`[chest-on-death] ERROR: Failed to spawn chest for creature ${creature.GetEntry()} (${creature.GetName()})`);
            return;
        }
        
        // Handle loot based on USE_CREATURE_LOOT setting
        if (config.USE_CREATURE_LOOT) {
            handleCreatureLootMode(creature, chest, killer || null, config);
        } else {
            handleChestLootTableMode(creature, chest, killer || null, config);
        }
    });
}

/**
 * MODE 1: Copy creature loot to chest
 */
function handleCreatureLootMode(
    creature: TSCreature, 
    chest: TSGameObject, 
    killer: TSPlayer | null,
    config: ChestOnDeathCreatureConfig
): void {
    const creatureLoot = creature.GetLoot();
    const chestLoot = chest.GetLoot();
    
    // Initialize chest loot
    initializeChestLoot(chestLoot);
    
    // Set loot owner BEFORE adding items (required for AddItem() to work correctly)
    if (config.OWNER_ONLY_LOOT && killer) {
        const killerPlayer = killer.ToPlayer();
        if (killerPlayer) {
            setLootOwner(chestLoot, killerPlayer.GetGUID());
        }
    }
    
    // Copy money from creature to chest
    const money = creatureLoot.GetMoney();
    if (money > 0) {
        chestLoot.SetMoney(money);
    }
    
    // Copy regular items from creature loot to chest loot
    const itemCount = creatureLoot.GetItemCount();
    for (let i = 0; i < itemCount; i++) {
        const item = creatureLoot.GetItem(i);
        addRegularItemToLoot(chestLoot, item.GetItemID(), item.GetCount());
    }
    
    // Copy quest items from creature loot to chest loot (if enabled)
    if (config.INCLUDE_QUEST_ITEMS) {
        const questItemCount = creatureLoot.GetQuestItemCount();
        for (let i = 0; i < questItemCount; i++) {
            const questItem = creatureLoot.GetQuestItem(i);
            addQuestItemToLoot(chestLoot, questItem.GetItemID(), questItem.GetCount());
        }
    }
    
    // If configured for chest-only loot, prevent creature body from being lootable
    if (config.CHEST_ONLY_LOOT) {
        creatureLoot.Clear();
    }
    
    console.log(`[chest-on-death] Chest spawned for ${creature.GetName()} with ${itemCount} items`);
}

/**
 * MODE 2: Use chest's own loot table (from datascript)
 */
function handleChestLootTableMode(
    creature: TSCreature, 
    chest: TSGameObject, 
    killer: TSPlayer | null,
    config: ChestOnDeathCreatureConfig
): void {
    // Optionally set loot owner for the chest
    if (config.OWNER_ONLY_LOOT && killer) {
        const killerPlayer = killer.ToPlayer();
        if (killerPlayer) {
            const chestLoot = chest.GetLoot();
            setLootOwner(chestLoot, killerPlayer.GetGUID());
        }
    }
    
    // Clear creature body if CHEST_ONLY_LOOT is enabled
    if (config.CHEST_ONLY_LOOT) {
        const creatureLoot = creature.GetLoot();
        creatureLoot.Clear();
    }
    
    console.log(`[chest-on-death] Chest spawned for ${creature.GetName()} using chest loot table`);
}

