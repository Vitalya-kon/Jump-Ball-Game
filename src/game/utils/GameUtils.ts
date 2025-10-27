import Phaser from 'phaser';

export function resetGamePhysics(player: Phaser.Physics.Arcade.Sprite | null) {
  if (player) {
    player.setVelocity(0, 0);
    if (player.body) {
      player.body.enable = false;
    }
  }
}