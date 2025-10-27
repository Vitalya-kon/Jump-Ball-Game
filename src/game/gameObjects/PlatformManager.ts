import Phaser from 'phaser';

export class PlatformManager {
  private platforms: Phaser.Physics.Arcade.StaticGroup | null = null;
  private lastPlatformX = 100;
  private lastPlatformY = 600;
  private worldWidth = 0;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  create(): Phaser.Physics.Arcade.StaticGroup {
    this.platforms = this.scene.physics.add.staticGroup();
    this.worldWidth = 10000;
    return this.platforms;
  }

  createInitialPlatforms(): Phaser.Physics.Arcade.Sprite[] {
    const canvasHeight = this.scene.sys.canvas.height;
    this.lastPlatformY = canvasHeight - 100;
    this.lastPlatformX = 400;

    const platformsCreated: Phaser.Physics.Arcade.Sprite[] = [];

    const firstPlatform = this.platforms?.create(this.lastPlatformX, this.lastPlatformY, 'platform');
    if (firstPlatform) {
      firstPlatform.setScale(0.8).setDepth(1).refreshBody();
      platformsCreated.push(firstPlatform);
    }

    for (let i = 1; i <= 8; i++) {
      const platform = this.createNextPlatform();
      if (platform) {
        platformsCreated.push(platform);
      }
    }

    return platformsCreated;
  }

  createNextPlatform(): Phaser.Physics.Arcade.Sprite | null {
    const minGap = 500;
    const maxGap = 850;
    const gap = Phaser.Math.Between(minGap, maxGap);

    const newX = this.lastPlatformX + gap;

    // Расширяем мир при необходимости
    if (newX > this.worldWidth - 2000) {
      this.worldWidth += 5000;
      this.scene.cameras.main.setBounds(0, 0, this.worldWidth, this.scene.scale.height);

      const bg = this.scene.children.getByName('background') as Phaser.GameObjects.TileSprite;
      if (bg) {
        bg.setSize(this.worldWidth, this.scene.scale.height);
      }
    }

    const minY = Math.max(150, this.lastPlatformY - 150);
    const maxY = Math.min(this.scene.scale.height - 100, this.lastPlatformY + 150);
    const newY = Phaser.Math.Between(minY, maxY);

    const platform = this.platforms?.create(newX, newY, 'platform');
    platform?.setScale(0.5 + Math.random() * 0.4);
    platform?.setDepth(1);
    platform?.refreshBody();

    this.lastPlatformX = newX;
    this.lastPlatformY = newY;
    
    return platform || null;
  }

  shouldGenerateNextPlatform(playerX: number): boolean {
    const viewportRight = playerX + this.scene.cameras.main.width / 2;
    const generationThreshold = this.lastPlatformX - 1000;
    return viewportRight > generationThreshold;
  }

  getPlatforms(): Phaser.Physics.Arcade.StaticGroup | null {
    return this.platforms;
  }

  getWorldWidth(): number {
    return this.worldWidth;
  }

  reset(): void {
    this.platforms?.clear(true, true);
    this.lastPlatformX = 100;
    this.lastPlatformY = this.scene.scale.height - 100;
    this.worldWidth = 10000;
  }
}
