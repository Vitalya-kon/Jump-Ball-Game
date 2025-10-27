import Phaser from 'phaser';
import { createScoreDisplay } from '../ui/ScoreDisplay';
import { GameOverUI } from '../ui/GameOverUI';
import { createPlatformGenerator } from '../gameObjects/PlatformGenerator';
import { CoinManager } from '../gameObjects/CoinManager';
import { resetGamePhysics } from '../utils/GameUtils';

export function createLevelScene() {
  let scoreDisplay: ReturnType<typeof createScoreDisplay>;
  let gameOverUI: GameOverUI;
  let platformGenerator: ReturnType<typeof createPlatformGenerator>;
  let coinManager: CoinManager;
  let player: Phaser.Physics.Arcade.Sprite | null = null;
  let cursors: Phaser.Types.Input.Keyboard.CursorKeys | null | undefined = null;
  let spaceKey: Phaser.Input.Keyboard.Key | null | undefined = null;

  return {
    init() {
      // Инициализация сцены
    },
    
    preload(this: Phaser.Scene) {
      this.load.image('background', '/assets/images/Space/DeWatermark.ai_1759066519691.jpeg');
      this.load.image('player', '/assets/images/Ball/Idle/1.png');
      this.load.image('playerJump', '/assets/images/Ball/Jump/1.png');
      this.load.image('playerFall', '/assets/images/Ball/Jump/2.png');
      this.load.image('platform', '/assets/images/Platform/brown platform merged transparent.png');
      this.load.image('controls', '/assets/images/keyControl/keyControl1.png');
      this.load.image('coin_pos_1', '/assets/images/Coin/gold_1.png');
      this.load.image('coin_pos_2', '/assets/images/Coin/gold_2.png');
      this.load.image('coin_pos_3', '/assets/images/Coin/gold_3.png');
      this.load.image('coin_pos_4', '/assets/images/Coin/gold_4.png');
      this.load.image('+1', '/assets/images/Coin/+1.png');
    },

    create(this: Phaser.Scene) {
      scoreDisplay = createScoreDisplay(this);
      gameOverUI = new GameOverUI(this);
      platformGenerator = createPlatformGenerator(this);
      
      setupPlayer.call(this);
      coinManager = new CoinManager(this, (score) => scoreDisplay.update(score));
      
      platformGenerator.createInitialPlatforms();
      setupControls.call(this);
      setupCamera.call(this);
      setupCollisions.call(this);
    },

    update(this: Phaser.Scene) {
      platformGenerator.update();
      handlePlayerMovement.call(this);
      checkGameEnd.call(this);
    },

    restartGame() {
      scoreDisplay.reset();
      gameOverUI.hide();
      coinManager.clearCoins();
      coinManager.resetScore();
      platformGenerator.reset();
      player?.setPosition(150, 350);
      player?.setVelocity(0, 0);
    }
  };

  function setupPlayer(this: Phaser.Scene) {
    player = this.physics.add.sprite(150, 350, 'player');
    player.setBounce(0.5);
    player.setScale(1.3);
    player.setDepth(100);
    
    player.setBodySize(player.width * 0.8, player.height * 0.1);
    player.setOffset(player.width * 0.1, player.height * 0.05);
  }

  function setupControls(this: Phaser.Scene) {
    cursors = this.input.keyboard?.createCursorKeys();
    spaceKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  function setupCamera(this: Phaser.Scene) {
    if (!player) return;
    this.cameras.main.startFollow(player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, 10000, this.scale.height);
  }

  function setupCollisions(this: Phaser.Scene) {
    const platforms = platformGenerator.getPlatforms();
    if (player && platforms) {
      this.physics.add.collider(player, platforms, () => {
        // Обработка приземления
      });
    }
  }

  function handlePlayerMovement(this: Phaser.Scene) {
    if (!player || !cursors || !spaceKey) return;
    
    const speed = 150;
    const onGround = player.body?.touching.down || player.body?.blocked.down;
    
    if (cursors.left.isDown) {
      player.setVelocityX(-speed);
      player.setFlipX(true);
    } else if (cursors.right.isDown) {
      player.setVelocityX(speed);
      player.setFlipX(false);
    } else {
      player.setVelocityX(0);
    }

    if (Phaser.Input.Keyboard.JustDown(spaceKey) && onGround) {
      player.setVelocityY(-400);
      this.tweens.add({
        targets: player,
        scale: { from: 1.3, to: 1.4 },
        duration: 100,
        yoyo: true
      });
    }
  }

  function checkGameEnd(this: Phaser.Scene) {
    if (player && player.y > this.cameras.main.worldView.bottom + 200) {
      endGame.call(this);
    }
  }

  function endGame(this: Phaser.Scene) {
    gameOverUI.show();
    resetGamePhysics(player);
  }
}