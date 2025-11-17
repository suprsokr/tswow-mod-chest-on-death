import { LOOT_STATE_READY, LOOT_TYPE_CORPSE } from './constants';

/**
 * Spawns a chest at the given location
 * @returns The spawned chest or null if spawn failed
 */
export function spawnChest(
    summoner: TSWorldObject,
    chestEntryId: number,
    x: number,
    y: number,
    z: number,
    o: number,
    despawnTime: number
): TSGameObject | null {
    const chest = summoner.SummonGameObject(chestEntryId, x, y, z, o, despawnTime);
    
    if (!chest || chest.IsNull()) {
        return null;
    }
    
    // Force the chest to GO_READY state immediately
    chest.SetLootState(LOOT_STATE_READY);
    return chest;
}

/**
 * Initializes chest loot (clears it and sets up base properties)
 */
export function initializeChestLoot(chestLoot: TSLoot): void {
    chestLoot.Clear();
    chestLoot.SetGeneratesNormally(false);
    chestLoot.SetLootType(LOOT_TYPE_CORPSE);
}

/**
 * Sets the loot owner if provided
 */
export function setLootOwner(chestLoot: TSLoot, ownerGuid: TSGUID | null): void {
    if (ownerGuid) {
        chestLoot.SetLootOwner(ownerGuid);
    }
}

/**
 * Adds a regular item to loot (with parameter swap workaround)
 * NOTE: Due to a bug in tswow-core (commit=adc9bc6), parameters are swapped in C++
 * TypeScript signature: (id, minCount, maxCount, lootMode, needsQuest, groupId)
 * C++ reads them as:     (id, minCount, maxCount, needsQuest, lootMode, groupId)
 */
export function addRegularItemToLoot(
    loot: TSLoot,
    itemId: number,
    count: number
): void {
    // For regular items: needsQuest=0 (false), lootMode=1
    // So we pass lootMode=0 (→needsQuest=false in C++), needsQuest=1 (→lootMode=1 in C++)
    loot.AddItem(itemId, count, count, 0 as any, 1 as any, 0);
}

/**
 * Adds a quest item to loot (with parameter swap workaround)
 */
export function addQuestItemToLoot(
    loot: TSLoot,
    itemId: number,
    count: number
): void {
    // For quest items: needsQuest=1 (true), lootMode=1
    // So we pass lootMode=1 (→needsQuest=true in C++), needsQuest=1 (→lootMode=1 in C++)
    loot.AddItem(itemId, count, count, 1 as any, 1 as any, 0);
}

