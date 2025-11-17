# chest-on-death

A TSWoW module that spawns loot chests when creatures die, transferring their loot to the chest instead of (or in addition to) dropping it on their corpse.

## Features

- Spawns a loot chest at creature death location
- Two loot modes:
  - **Creature Loot Mode**: Copies the creature's actual loot drops to the chest
  - **Static Loot Mode**: Uses a predefined loot table from datascripts
- Configurable loot ownership (killer-only or free-for-all)
- Optional chest-only loot (removes corpse loot entirely)
- Quest item support
- Automatic chest despawn after configurable time

## Configuration

Edit `livescripts/livescripts.ts` to customize behavior:

```typescript
const CONFIG = {
    USE_CREATURE_LOOT: true,      // Copy creature loot vs use chest loot table
    CHEST_ONLY_LOOT: true,         // Remove corpse loot when true
    OWNER_ONLY_LOOT: true,         // Restrict chest to killer/group
    SPAWN_EMPTY_CHESTS: false,     // Spawn chest even with no loot
    INCLUDE_QUEST_ITEMS: true,     // Include quest items in chest
    CHEST_DESPAWN_TIME: 300,       // Despawn time in seconds (5 minutes)
};
```

## Usage

When `USE_CREATURE_LOOT` is `true` (default), the module automatically transfers creature loot to chests with no additional setup needed.

When `USE_CREATURE_LOOT` is `false`, configure the chest's loot table in `datascripts/datascripts.ts`:

```typescript
export const LOOT_CHEST = std.GameObjectTemplates.Chests.create(...)
    .Loot.modRefCopy(loot => {
        loot.addItem(2589, 1, 1, 1); // Example: Linen Cloth
        // Add more items as needed
    });
```

## Technical Notes

- Contains workaround for parameter swap bug in tswow-core's `AddItem()` method in commit=adc9bc6 ots the tswow repo.

