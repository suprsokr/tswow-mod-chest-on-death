/**
 * Chest ownership and permission checking system
 * 
 * Since SetLootOwner() doesn't work for GameObjects and SetLootRecipient() 
 * isn't available in TSWoW's API, we use GameObject data tags to store
 * ownership information and manually check permissions via the OnUse event.
 */

import { LootOwnershipMode } from './config';

/**
 * Callback type for registering chest ownership
 */
export type RegisterChestOwnerCallback = (
    chest: TSGameObject,
    owner: TSPlayer,
    ownershipMode: LootOwnershipMode
) => void;

/**
 * Register a chest with its owner for permission checking
 * Uses GameObject data tags to store ownership information directly on the chest
 * 
 * @param chest - The chest GameObject
 * @param owner - The owner player (killer or dead player)
 * @param ownershipMode - Who can loot: 'free-for-all', 'owner-only', or 'owner-and-group'
 */
export function registerChestOwner(
    chest: TSGameObject, 
    owner: TSPlayer,
    ownershipMode: LootOwnershipMode
): void {
    // Store ownership data directly on the GameObject using data tags
    const ownerGuidLow = owner.GetGUID().GetCounter();
    const ownerName = owner.GetName();
    
    chest.SetNumber('chest-owner-guid-low', ownerGuidLow);
    chest.SetString('chest-owner-name', ownerName);
    chest.SetString('chest-ownership-mode', ownershipMode);
    
    // If owner-and-group mode, also store the owner's group GUID
    if (ownershipMode === 'owner-and-group') {
        const ownerGroup = owner.GetGroup();
        if (ownerGroup && !ownerGroup.IsNull()) {
            const ownerGroupGuidLow = ownerGroup.GetGUID().GetCounter();
            chest.SetNumber('chest-owner-group-guid-low', ownerGroupGuidLow);
            console.log(`[chest-on-death] Registered chest for owner ${ownerName} and group (mode: ${ownershipMode})`);
        } else {
            // Owner has no group, treat as owner-only
            console.log(`[chest-on-death] Registered chest for owner ${ownerName} (no group, mode: ${ownershipMode})`);
        }
    } else {
        console.log(`[chest-on-death] Registered chest for owner ${ownerName} (mode: ${ownershipMode})`);
    }
}

/**
 * Register chest permission checking via Spell.OnCheckCast
 * Must be called during module initialization
 * 
 * Validates spell casts BEFORE they execute, preventing unauthorized
 * players from opening protected chests.
 * 
 * @param events - TSEvents object from Main()
 * @param chestEntryId - The chest's entry ID (from UTAG or TAG)
 */
export function registerChestPermissions(events: TSEvents, chestEntryId: number): void {
    // Hook Spell.OnCheckCast to validate before the spell executes
    // Returns SPELL_FAILED_CHEST_IN_USE (25) to deny access
    events.Spell.OnCheckCast((spell, result) => {
        // Get the spell target
        const target = spell.GetTarget();
        const gameObjectTarget = target.ToGameObject();
        
        // Only care about GameObjects
        if (!gameObjectTarget || gameObjectTarget.IsNull()) {
            return;
        }
        
        // Check if target is our chest
        if (gameObjectTarget.GetEntry() !== chestEntryId) {
            return;
        }
        
        // Get the caster (player trying to open the chest)
        const caster = spell.GetCaster();
        const player = caster.ToPlayer();
        if (!player || player.IsNull()) {
            console.log(`[chest-on-death] OnCheckCast: Non-player trying to open chest, denying`);
            result.set(25); // SPELL_FAILED_CHEST_IN_USE
            return;
        }
        
        // Read ownership data from GameObject data tags
        const ownerGuidLow = gameObjectTarget.GetNumber('chest-owner-guid-low', 0);
        const ownerName = gameObjectTarget.GetString('chest-owner-name', '');
        const ownershipMode = gameObjectTarget.GetString('chest-ownership-mode', 'free-for-all') as LootOwnershipMode;
        
        console.log(`[chest-on-death] OnCheckCast: ${player.GetName()} trying to open chest. Owner: ${ownerName} (${ownerGuidLow}), Mode: ${ownershipMode}`);
        
        // Free-for-all: anyone can loot
        if (ownershipMode === 'free-for-all' || ownerGuidLow === 0) {
            console.log(`[chest-on-death] Allowing ${player.GetName()} to open chest (free-for-all)`);
            return; // result defaults to 0 (SPELL_CAST_OK)
        }
        
        // Check if player is the owner (compare low GUID counters)
        const playerGuidLow = player.GetGUID().GetCounter();
        const isOwner = (playerGuidLow === ownerGuidLow);
        
        // Owner-only: only the owner can loot
        if (ownershipMode === 'owner-only') {
            if (isOwner) {
                console.log(`[chest-on-death] Allowing ${player.GetName()} to open chest (owner)`);
                return; // Owner, allow access
            }
            // Not owner, fail the cast
            result.set(25); // SPELL_FAILED_CHEST_IN_USE
            player.SendBroadcastMessage(`This chest belongs to ${ownerName}.`);
            console.log(`[chest-on-death] Denied ${player.GetName()} from opening ${ownerName}'s chest (owner-only)`);
            return;
        }
        
        // Owner-and-group: owner and their group members can loot
        if (ownershipMode === 'owner-and-group') {
            if (isOwner) {
                console.log(`[chest-on-death] Allowing ${player.GetName()} to open chest (owner)`);
                return; // Owner, allow access
            }
            
            // Check if player is in owner's group
            const ownerGroupGuidLow = gameObjectTarget.GetNumber('chest-owner-group-guid-low', 0);
            const playerGroup = player.GetGroup();
            
            if (playerGroup && !playerGroup.IsNull() && ownerGroupGuidLow !== 0) {
                const playerGroupGuidLow = playerGroup.GetGUID().GetCounter();
                if (playerGroupGuidLow === ownerGroupGuidLow) {
                    console.log(`[chest-on-death] Allowing ${player.GetName()} to open chest (group member)`);
                    return; // In owner's group, allow access
                }
            }
            
            // Not owner or group member, fail the cast
            result.set(25); // SPELL_FAILED_CHEST_IN_USE
            player.SendBroadcastMessage(`This chest belongs to ${ownerName} and their group.`);
            console.log(`[chest-on-death] Denied ${player.GetName()} from opening ${ownerName}'s chest (owner-and-group)`);
            return;
        }
    });
    
    // Hook OnLootStateChanged to despawn empty chests after looting
    // State 3 (GO_JUST_DEACTIVATED) fires when the chest is closed after being opened
    events.GameObject.OnLootStateChanged(chestEntryId, (go, state, unit) => {
        // Only care about GO_JUST_DEACTIVATED (3) = chest was just closed
        if (state !== 3) {
            return;
        }
        
        // Check if chest is empty (fully looted)
        const loot = go.GetLoot();
        if (loot.IsLooted()) {
            console.log(`[chest-on-death] Chest fully looted, despawning immediately`);
            go.Despawn();
        } else {
            console.log(`[chest-on-death] Chest closed but still has loot, keeping it spawned`);
        }
    });
    
    console.log("[chest-on-death] Chest permission system enabled (using Spell.OnCheckCast + OnLootStateChanged)");
}

