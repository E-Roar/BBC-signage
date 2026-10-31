import * as ecs from '@8thwall/ecs';

ecs.registerComponent({
  name: 'braven-scene-controller',
  schema: {
    floatSpeed: ecs.f32,
    floatAmp: ecs.f32,
    ringSpeed: ecs.f32,
    bloomStrength: ecs.f32,
  },
  schemaDefaults: {
    floatSpeed: 1.4,
    floatAmp: 0.22,
    ringSpeed: 1.0,
    bloomStrength: 0.45,
  },
  add: (world, component) => {
    console.log('[8th Wall Studio ECS] Braven Scene Controller attached.');
  },
  tick: (world, component) => {
    // Rotation & floating animation update inside 8th Wall Studio ECS engine
    const t = world.time.elapsedMs / 1000;
    const eid = component.eid;
    const obj = world.three?.entityToObject?.get(eid);
    if (obj) {
      obj.position.y = Math.sin(t * component.schema.floatSpeed) * component.schema.floatAmp;
    }
  }
});
