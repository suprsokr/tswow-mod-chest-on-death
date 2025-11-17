// Configuration
const CONFIG = {
    // If true, copy creature's actual loot drops to chest
    // If false, use chest's loot table defined in datascript
    USE_CREATURE_LOOT: true,
    
    // If true, creatures will not drop any loot on their body (all loot goes to chest)
    // If false, creatures drop loot normally AND spawn a chest with loot
    CHEST_ONLY_LOOT: true,
    
    // If true, only the killer (and their group) can loot the chest
    // If false, anyone can loot the chest (free-for-all)
    OWNER_ONLY_LOOT: true,
    
    // If true, spawn chests even when creatures have no loot
    // If false, only spawn chests when there's loot to transfer
    SPAWN_EMPTY_CHESTS: false,
    
    // If true, include quest items in chest loot
    // If false, skip quest items
    INCLUDE_QUEST_ITEMS: true,
    
    // How long the chest stays in the world (in seconds)
    CHEST_DESPAWN_TIME: 300, // 5 minutes
};

export function Main(events: TSEvents) {
    console.log("[chest-on-death] Module loaded - chest spawning enabled");
    
    // Use OnGenerateLoot instead of OnDeath to properly access creature loot
    // This event fires after loot is generated but before it's shown to players
    events.Creature.OnGenerateLoot((creature, killer) => {
        // Check if we should skip based on USE_CREATURE_LOOT and loot availability
        if (CONFIG.USE_CREATURE_LOOT) {
            // Get the creature's loot object (guaranteed to exist in OnGenerateLoot)
            const creatureLoot = creature.GetLoot();
            
            // Check if there's loot to transfer
            const hasItems = creatureLoot.GetItemCount() > 0;
            const hasQuestItems = creatureLoot.GetQuestItemCount() > 0;
            const hasMoney = creatureLoot.GetMoney() > 0;
            const hasAnyLoot = hasItems || hasQuestItems || hasMoney;
            
            // Skip chest spawn if no loot and empty chests are disabled
            if (!hasAnyLoot && !CONFIG.SPAWN_EMPTY_CHESTS) {
                return;
            }
        }
        
        // Get creature's position for chest spawn
        const x = creature.GetX();
        const y = creature.GetY();
        const z = creature.GetZ();
        const o = creature.GetO();
        
        const chestEntryId = UTAG('chest-on-death', 'loot-chest');
        
        const chest = creature.SummonGameObject(
            chestEntryId,
            x,
            y,
            z,
            o,
            CONFIG.CHEST_DESPAWN_TIME // respawnDelay in seconds
        );
        
        if (!chest || chest.IsNull()) {
            console.error(`[chest-on-death] ERROR: Failed to spawn chest for creature ${creature.GetEntry()} (${creature.GetName()})`);
            return;
        }

        // Force the chest to GO_READY state immediately
        chest.SetLootState(1);
        
        // Handle loot based on USE_CREATURE_LOOT setting
        if (CONFIG.USE_CREATURE_LOOT) {
            // MODE 1: Copy creature loot to chest
            const creatureLoot = creature.GetLoot();
            const chestLoot = chest.GetLoot();
            
            // Clear any auto-generated loot from the chest template and prevent regeneration
            chestLoot.Clear();
            chestLoot.SetGeneratesNormally(false);
            chestLoot.SetLootType(1); // LOOT_CORPSE = 1
            
            // Set loot owner BEFORE adding items (required for AddItem() to work correctly)
            if (CONFIG.OWNER_ONLY_LOOT && killer) {
                const killerPlayer = killer.ToPlayer();
                if (killerPlayer) {
                    chestLoot.SetLootOwner(killerPlayer.GetGUID());
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
                // NOTE: Due to a bug in tswow-core (commit=adc9bc6), parameters are swapped in C++
                // TypeScript signature: (id, minCount, maxCount, lootMode, needsQuest, groupId)
                // C++ reads them as:     (id, minCount, maxCount, needsQuest, lootMode, groupId)
                // For regular items: needsQuest=0 (false), lootMode=1
                // So we pass lootMode=0 (→needsQuest=false in C++), needsQuest=1 (→lootMode=1 in C++)
                chestLoot.AddItem(item.GetItemID(), item.GetCount(), item.GetCount(), 0 as any, 1 as any, 0);
            }
            
            // Copy quest items from creature loot to chest loot (if enabled)
            if (CONFIG.INCLUDE_QUEST_ITEMS) {
                const questItemCount = creatureLoot.GetQuestItemCount();
                for (let i = 0; i < questItemCount; i++) {
                    const questItem = creatureLoot.GetQuestItem(i);
                    // NOTE: Due to a bug in tswow-core (commit=adc9bc6), parameters are swapped in C++
                    // For quest items: needsQuest=1 (true), lootMode=1
                    // So we pass lootMode=1 (→needsQuest=true in C++), needsQuest=1 (→lootMode=1 in C++)
                    chestLoot.AddItem(questItem.GetItemID(), questItem.GetCount(), questItem.GetCount(), 1 as any, 1 as any, 0);
                }
            }
            
            // If configured for chest-only loot, prevent creature body from being lootable
            if (CONFIG.CHEST_ONLY_LOOT) {
                creatureLoot.Clear();
            }
            
            console.log(`[chest-on-death] Chest spawned for ${creature.GetName()} with ${itemCount} items`);
        } else {
            // MODE 2: Use chest's own loot table (from datascript)
            
            // Optionally set loot owner for the chest
            if (CONFIG.OWNER_ONLY_LOOT && killer) {
                const killerPlayer = killer.ToPlayer();
                if (killerPlayer) {
                    const chestLoot = chest.GetLoot();
                    chestLoot.SetLootOwner(killerPlayer.GetGUID());
                }
            }
            
            // Clear creature body if CHEST_ONLY_LOOT is enabled
            if (CONFIG.CHEST_ONLY_LOOT) {
                const creatureLoot = creature.GetLoot();
                creatureLoot.Clear();
            }
            
            console.log(`[chest-on-death] Chest spawned for ${creature.GetName()} using chest loot table`);
        }
    });
}
