import Phaser from 'phaser';

export class GameOverUI {
  private gameOverText: Phaser.GameObjects.Text | null = null;
  private restartButton: Phaser.GameObjects.Text | null = null;
  private scene: Phaser.Scene;
  private onRestart?: () => void;

  constructor(scene: Phaser.Scene, onRestart?: () => void) {
    this.scene = scene;
    this.onRestart = onRestart;
  }

  show(): void {
    console.log('[GameOverUI] Показ UI завершения игры');
    
    this.hide(); // Сначала очищаем старый UI

    this.gameOverText = this.scene.add.text(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY - 50,
      'GAME OVER',
      { 
        fontSize: '48px', 
        color: '#ff0000', 
        stroke: '#000', 
        strokeThickness: 4,
        fontFamily: 'Arial, sans-serif'
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(1000);

    this.restartButton = this.scene.add.text(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY + 50,
      'Tap to Restart',
      { 
        fontSize: '32px', 
        color: '#fff', 
        backgroundColor: 'rgba(0,0,0,0.8)', 
        padding: { x: 30, y: 15 },
        fontFamily: 'Arial, sans-serif'
      }
    )
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(1000)
    .setInteractive({ useHandCursor: true });

    this.restartButton.on('pointerdown', () => {
      console.log('[GameOverUI] Нажата кнопка рестарта');
      if (this.onRestart) {
        this.onRestart();
      }
    });

    // Добавляем обработчик для перезапуска по нажатию любой клавиши
    this.scene.input.keyboard?.once('keydown', () => {
      console.log('[GameOverUI] Нажата клавиша для рестарта');
      if (this.onRestart) {
        this.onRestart();
      }
    });
  }

  hide(): void {
    if (this.gameOverText) {
      this.gameOverText.destroy();
      this.gameOverText = null;
    }
    if (this.restartButton) {
      this.restartButton.destroy();
      this.restartButton = null;
    }
  }

  isVisible(): boolean {
    return this.gameOverText !== null;
  }

  destroy(): void {
    this.hide();
  }
}