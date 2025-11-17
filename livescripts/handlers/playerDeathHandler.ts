import { ChestOnDeathPlayerConfig } from '../shared/config';
import { 
    INVENTORY_SLOT_BAG_START, 
    INVENTORY_SLOT_BAG_END, 
    EQUIPMENT_SLOT_START, 
    EQUIPMENT_SLOT_END
} from '../shared/constants';
import { 
    spawnChest, 
    initializeChestLoot, 
    addRegularItemToLoot 
} from '../shared/utilities';
import { RegisterChestOwnerCallback } from '../shared/chestPermissions';

interface ItemData {
    itemId: number;
    count: number;
    item: TSItem; // Reference to actual item for removal
}

/**
 * Handles player death and spawns loot chests containing their items
 */
export function registerPlayerDeathHandler(
    events: TSEvents, 
    config: ChestOnDeathPlayerConfig,
    registerChestOwner: RegisterChestOwnerCallback
): void {
    if (!config.ENABLE_PLAYER_DEATH_CHEST) {
        return;
    }
    
    events.Unit.OnDeath((victim, killer) => {
        // Only handle player deaths
        const player = victim.ToPlayer();
        if (!player || player.IsNull()) {
            return;
        }
        
        // Spawn the chest at player's death location
        // UTAG is a compile-time macro and requires literal string arguments
        const chestEntryId = UTAG('chest-on-death', 'loot-chest');
        const chest = spawnChest(
            player,
            chestEntryId,
            player.GetX(),
            player.GetY(),
            player.GetZ(),
            player.GetO(),
            config.PLAYER_CHEST_DESPAWN_TIME
        );
        
        if (!chest) {
            console.error(`[chest-on-death] ERROR: Failed to spawn death chest for player ${player.GetName()}`);
            return;
        }
        
        // Handle loot based on USE_PLAYER_ITEMS setting
        if (config.USE_PLAYER_ITEMS) {
            handlePlayerItemsMode(player, chest, config, registerChestOwner);
        } else {
            handleChestLootTableMode(player, chest, config, registerChestOwner);
        }
    });
}

/**
 * MODE 1: Use player's items for chest loot (with filtering/selection)
 */
function handlePlayerItemsMode(
    player: TSPlayer, 
    chest: TSGameObject, 
    config: ChestOnDeathPlayerConfig,
    registerChestOwner: RegisterChestOwnerCallback
): void {
    // Collect items and money
    const { itemsToTransfer, itemsToRemove, money } = collectPlayerItems(player, config);
    
    // Skip if no items and no money
    if (itemsToTransfer.length === 0 && money === 0) {
        // Despawn empty chest
        chest.Despawn();
        return;
    }
    
    // Register chest ownership for permission checking
    registerChestOwner(chest, player, config.LOOT_OWNERSHIP);
    
    // Setup chest loot
    setupPlayerDeathChestLoot(chest, player, itemsToTransfer, money, config);
    
    // Remove items from player if configured
    if (config.REMOVE_PLAYER_ITEMS_ON_DEATH) {
        removeItemsFromPlayer(player, itemsToRemove, money);
    }
    
    console.log(`[chest-on-death] Death chest spawned for player ${player.GetName()} with ${itemsToTransfer.length} items and ${money} copper`);
}

/**
 * MODE 2: Use chest's own loot table (from datascript)
 * Player keeps all their items, chest spawns with static loot
 */
function handleChestLootTableMode(
    player: TSPlayer, 
    chest: TSGameObject, 
    config: ChestOnDeathPlayerConfig,
    registerChestOwner: RegisterChestOwnerCallback
): void {
    // Register chest ownership for permission checking
    registerChestOwner(chest, player, config.LOOT_OWNERSHIP);
    
    console.log(`[chest-on-death] Death chest spawned for player ${player.GetName()} using chest loot table`);
}

/**
 * Collects eligible items from player inventory and equipment based on configuration
 * Applies filtering by slot type, quality, and random selection
 */
function collectPlayerItems(player: TSPlayer, config: ChestOnDeathPlayerConfig): {
    itemsToTransfer: ItemData[];
    itemsToRemove: TSItem[];
    money: number;
} {
    // Step 1: Collect all eligible items based on slot type and quality
    const eligibleItems: ItemData[] = [];
    
    // Collect from bags if enabled
    if (config.DROP_FROM_BAGS) {
        for (let slot = INVENTORY_SLOT_BAG_START; slot <= INVENTORY_SLOT_BAG_END; slot++) {
            const item = player.GetItemByPos(255, slot);
            if (item && !item.IsNull() && isItemQualityEligible(item, config)) {
                eligibleItems.push({
                    itemId: item.GetEntry(),
                    count: item.GetCount(),
                    item: item
                });
            }
        }
    }
    
    // Collect from equipped slots if enabled
    if (config.DROP_FROM_EQUIPPED) {
        for (let slot = EQUIPMENT_SLOT_START; slot <= EQUIPMENT_SLOT_END; slot++) {
            const item = player.GetItemByPos(255, slot);
            if (item && !item.IsNull() && isItemQualityEligible(item, config)) {
                eligibleItems.push({
                    itemId: item.GetEntry(),
                    count: item.GetCount(),
                    item: item
                });
            }
        }
    }
    
    // Step 2: Randomly select items based on min/max configuration
    const itemsToTransfer = selectRandomItems(eligibleItems, config);
    
    // Step 3: Calculate money to drop
    const money = calculateMoneyToDrop(player, config);
    
    return { itemsToTransfer, itemsToRemove: itemsToTransfer.map(i => i.item), money };
}

/**
 * Checks if an item's quality is eligible for dropping
 */
function isItemQualityEligible(item: TSItem, config: ChestOnDeathPlayerConfig): boolean {
    // If no quality filter is configured, all qualities are eligible
    if (config.ELIGIBLE_ITEM_QUALITIES.length === 0) {
        return true;
    }
    
    const itemQuality = item.GetQuality();
    return config.ELIGIBLE_ITEM_QUALITIES.includes(itemQuality);
}

/**
 * Randomly selects items from eligible items based on min/max configuration
 */
function selectRandomItems(eligibleItems: ItemData[], config: ChestOnDeathPlayerConfig): ItemData[] {
    // If no eligible items, return empty array
    if (eligibleItems.length === 0) {
        return [];
    }
    
    // Determine how many items to drop
    let itemsToDrop: number;
    
    if (config.MAX_ITEMS_TO_DROP === -1) {
        // Drop all eligible items
        itemsToDrop = eligibleItems.length;
    } else {
        // Calculate random amount between min and max
        const maxPossible = Math.min(config.MAX_ITEMS_TO_DROP, eligibleItems.length);
        const minPossible = Math.min(config.MIN_ITEMS_TO_DROP, maxPossible);
        
        if (minPossible === maxPossible) {
            itemsToDrop = minPossible;
        } else {
            itemsToDrop = Math.floor(Math.random() * (maxPossible - minPossible + 1)) + minPossible;
        }
    }
    
    // If dropping all or more than available, return all eligible items
    if (itemsToDrop >= eligibleItems.length) {
        return eligibleItems;
    }
    
    // Randomly select items using Fisher-Yates shuffle
    const shuffled = [...eligibleItems];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled.slice(0, itemsToDrop);
}

/**
 * Calculates the amount of money to drop based on configuration
 */
function calculateMoneyToDrop(player: TSPlayer, config: ChestOnDeathPlayerConfig): number {
    // If money drop is disabled, return 0
    if (!config.DROP_MONEY) {
        return 0;
    }
    
    const totalMoney = player.GetMoney();
    
    // If player has no money, return 0
    if (totalMoney === 0) {
        return 0;
    }
    
    // Calculate percentage-based amount
    const minPercent = Math.max(0, Math.min(100, config.MONEY_DROP_MIN_PERCENT));
    const maxPercent = Math.max(0, Math.min(100, config.MONEY_DROP_MAX_PERCENT));
    
    // Random percentage between min and max
    const randomPercent = minPercent === maxPercent 
        ? minPercent 
        : Math.random() * (maxPercent - minPercent) + minPercent;
    
    let moneyToDrop = Math.floor(totalMoney * (randomPercent / 100));
    
    // Apply minimum static value (overrides percentage if higher)
    if (config.MONEY_DROP_MIN_STATIC > 0) {
        moneyToDrop = Math.max(moneyToDrop, Math.min(config.MONEY_DROP_MIN_STATIC, totalMoney));
    }
    
    // Apply maximum static cap if configured
    if (config.MONEY_DROP_MAX_STATIC !== -1 && config.MONEY_DROP_MAX_STATIC > 0) {
        moneyToDrop = Math.min(moneyToDrop, config.MONEY_DROP_MAX_STATIC);
    }
    
    // Ensure we don't drop more than player has
    moneyToDrop = Math.min(moneyToDrop, totalMoney);
    
    return moneyToDrop;
}

/**
 * Sets up the chest loot with player's items and money
 */
function setupPlayerDeathChestLoot(
    chest: TSGameObject,
    player: TSPlayer,
    itemsToTransfer: ItemData[],
    money: number,
    config: ChestOnDeathPlayerConfig
): void {
    const chestLoot = chest.GetLoot();
    
    // Initialize chest loot
    initializeChestLoot(chestLoot);
    
    // Note: Ownership is handled by registerChestOwner() in the calling function
    // using GameObject data tags, not setLootOwner() which doesn't work for chests
    
    // Add player's money to chest
    if (money > 0) {
        chestLoot.SetMoney(money);
    }
    
    // Add all collected items to chest
    for (const item of itemsToTransfer) {
        addRegularItemToLoot(chestLoot, item.itemId, item.count);
    }
}

/**
 * Removes items and money from the player
 */
function removeItemsFromPlayer(
    player: TSPlayer,
    itemsToRemove: TSItem[],
    money: number
): void {
    // Remove items
    for (const item of itemsToRemove) {
        player.RemoveItem(item, item.GetCount());
    }
    
    // Remove money (subtract the dropped amount from player's total)
    if (money > 0) {
        const currentMoney = player.GetMoney();
        player.SetMoney(Math.max(0, currentMoney - money));
    }
}

