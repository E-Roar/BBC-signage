import * as ecs from '@8thwall/ecs';

ecs.registerComponent({
  name: 'image-target-sync',
  schema: {
    targetName: ecs.string,
  },
  schemaDefaults: {
    targetName: 'braven-marker',
  },
  add: (world, component) => {
    console.log(`[8th Wall Studio ECS] Image Target Sync added for: ${component.schema.targetName}`);

    // Listen to 8th Wall image target tracking events on world
    const onFound = (event: any) => {
      console.log(`[8th Wall Studio ECS] Target Found: ${component.schema.targetName}`, event);
    };

    const onLost = (event: any) => {
      console.log(`[8th Wall Studio ECS] Target Lost: ${component.schema.targetName}`, event);
    };

    world.events.addListener(world.events.globalId, 'xr:imagefound', onFound);
    world.events.addListener(world.events.globalId, 'xr:imagelost', onLost);
  },
  remove: (world) => {
    console.log('[8th Wall Studio ECS] Image Target Sync removed.');
  },
  tick: (world, component) => {
    // Per-frame tracking tick inside 8th Wall Studio runtime
  }
});
