import { std } from "wow/wotlk";

// Create a generic loot chest that will be spawned when creatures die
// The loot will be dynamically assigned in livescripts based on the
// creature if USE_CREATURE_LOOT is true
export const LOOT_CHEST = std.GameObjectTemplates.Chests.create(
    'chest-on-death',
    'generic-loot-chest',
    2843
)
    .Name.enGB.set('Loot Chest')
    .Loot.set(-1)
    .Tags.addUnique('chest-on-death', 'loot-chest')
    // Optional: Add generic loot table for USE_CREATURE_LOOT = false mode
    // Uncomment and configure this section to use static loot instead of creature drops
    // .Loot.modRefCopy(loot => {
    //     // loot.addItem(2589, 1, 1, 1); // Linen Cloth
    // });
