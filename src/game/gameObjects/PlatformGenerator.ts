import Phaser from 'phaser';

export function createPlatformGenerator(scene: Phaser.Scene) {
  let lastPlatformX = 100;
  let lastPlatformY = 600;
  let worldWidth = 0;
  let platforms: Phaser.Physics.Arcade.StaticGroup | null = null;

  function init() {
    platforms = scene.physics.add.staticGroup();
  }

  function createInitialPlatforms() {
    init();
    lastPlatformY = scene.scale.height - 100;
    lastPlatformX = 400;
    
    createPlatform(lastPlatformX, lastPlatformY);
    
    for (let i = 1; i <= 8; i++) {
      createNextPlatform();
    }
  }

  function createNextPlatform() {
    const minGap = 500;
    const maxGap = 850;
    const gap = Phaser.Math.Between(minGap, maxGap);
    const newX = lastPlatformX + gap;

    if (newX > worldWidth - 2000) {
      worldWidth += 5000;
      scene.cameras.main.setBounds(0, 0, worldWidth, scene.scale.height);
    }

    const minY = Math.max(150, lastPlatformY - 150);
    const maxY = Math.min(scene.scale.height - 100, lastPlatformY + 150);
    const newY = Phaser.Math.Between(minY, maxY);

    const platform = createPlatform(newX, newY);
    platform?.setScale(0.5 + Math.random() * 0.4);
    
    lastPlatformX = newX;
    lastPlatformY = newY;
  }

  function createPlatform(x: number, y: number) {
    if (!platforms) return null;
    
    const platform = platforms.create(x, y, 'platform');
    platform.setScale(0.8).setDepth(1).refreshBody();
    return platform;
  }

  function update() {
    // Логика обновления генератора платформ
  }

  function reset() {
    if (platforms) {
      platforms.clear(true, true);
    }
    lastPlatformX = 100;
    lastPlatformY = scene.scale.height - 100;
    worldWidth = 0;
  }

  return {
    createInitialPlatforms,
    createNextPlatform,
    getPlatforms: () => platforms,
    update,
    reset
  };
}